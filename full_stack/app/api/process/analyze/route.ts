import { NextRequest, NextResponse } from 'next/server'
import { progressStore } from '@/lib/progress-store'
import { generateMissingDataQuestions } from '@/lib/document-processors/generate-questions'
import { generateRequirements } from '@/lib/document-processors/generate-requirements'
import { analyzeDocumentForGaps } from '@/lib/document-processors/analyze-document-gaps'
import { generateGapQuestions } from '@/lib/document-processors/generate-gap-questions'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { documentId, projectId, documents } = body

    if (!documentId || !documents) {
      return NextResponse.json(
        { error: 'Document ID and documents are required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    // Combine all extracted text
    const combinedContent = {
      text: documents.map((d: any) => d.extractedContent.text).join('\n\n--- Document Break ---\n\n'),
      sections: documents.flatMap((d: any) => d.extractedContent.sections),
      metadata: documents[0]?.extractedContent?.metadata || {}
    }

    // Step 1: Analyze document for gaps
    progressStore.addUpdate(documentId, {
      step: 'analyze',
      status: 'processing',
      current: 1,
      total: 3,
      message: 'Analyzing document for gaps and compliance needs',
      details: { phase: 'gap-analysis' }
    })

    const analysis = await analyzeDocumentForGaps(combinedContent, apiKey)

    progressStore.addUpdate(documentId, {
      step: 'analyze',
      status: 'processing',
      current: 1,
      total: 3,
      message: `Found ${analysis.criticalGaps.length} critical gaps, ${analysis.importantGaps.length} important gaps`,
      details: {
        criticalGaps: analysis.criticalGaps.length,
        importantGaps: analysis.importantGaps.length,
        optionalGaps: analysis.optionalGaps.length,
        confidence: analysis.confidence
      }
    })

    // Step 2: Generate questions
    progressStore.addUpdate(documentId, {
      step: 'analyze',
      status: 'processing',
      current: 2,
      total: 3,
      message: 'Generating questions for missing data',
      details: { phase: 'questions' }
    })

    const questions = await generateMissingDataQuestions(
      combinedContent,
      combinedContent.metadata?.documentType || 'general',
      apiKey
    )

    progressStore.addUpdate(documentId, {
      step: 'analyze',
      status: 'processing',
      current: 2,
      total: 3,
      message: `Generated ${questions.length} questions`,
      details: {
        questionsGenerated: questions.length,
        criticalQuestions: questions.filter((q: any) => q.importance === 'critical').length
      }
    })

    // Step 3: Check if we need user input for gaps
    const hasSignificantGaps = analysis.criticalGaps.length > 0 ||
                               analysis.importantGaps.length > 0

    if (hasSignificantGaps) {
      // Generate dynamic questions based on the specific gaps found
      progressStore.addUpdate(documentId, {
        step: 'analyze',
        status: 'processing',
        current: 3,
        total: 3,
        message: 'Generating targeted questions for gaps',
        details: { phase: 'gap-questions' }
      })

      const dynamicQuestions = await generateGapQuestions(
        combinedContent.text,
        {
          criticalGaps: analysis.criticalGaps,
          importantGaps: analysis.importantGaps,
          optionalGaps: analysis.optionalGaps
        },
        analysis,
        apiKey
      )

      progressStore.addUpdate(documentId, {
        step: 'analyze',
        status: 'completed',
        current: 3,
        total: 3,
        message: 'Analysis complete - user input needed for gaps',
        details: {
          gapsFound: true,
          criticalGaps: analysis.criticalGaps.length,
          importantGaps: analysis.importantGaps.length,
          dynamicQuestionsCount: dynamicQuestions.length,
          analysis: {
            ...analysis,
            text: combinedContent.text,
            sections: combinedContent.sections
          },
          dynamicQuestions, // Include dynamic questions in SSE update
          documentId,
          projectId,
          hasGaps: true
        }
      })

      return NextResponse.json({
        documentId,
        projectId,
        analysis: {
          ...analysis,
          text: combinedContent.text, // Include the actual document text
          sections: combinedContent.sections
        },
        questions,
        dynamicQuestions, // Include the dynamically generated questions
        requirements: [], // No requirements yet - wait for gap answers
        hasGaps: true,
        nextStep: 'show-questionnaire',
        message: 'Document analyzed - gaps found that need clarification'
      })
    }

    // No significant gaps, proceed to generate requirements
    progressStore.addUpdate(documentId, {
      step: 'analyze',
      status: 'processing',
      current: 3,
      total: 3,
      message: 'Generating requirements from content',
      details: { phase: 'requirements' }
    })

    const requirements = await generateRequirements(
      combinedContent,
      { questions },
      apiKey
    )

    progressStore.addUpdate(documentId, {
      step: 'analyze',
      status: 'completed',
      current: 3,
      total: 3,
      message: `Generated ${requirements.length} requirements`,
      details: {
        requirementsGenerated: requirements.length,
        functionalRequirements: requirements.filter((r: any) => r.category === 'functional').length,
        nonFunctionalRequirements: requirements.filter((r: any) => r.category === 'non-functional').length
      }
    })

    return NextResponse.json({
      documentId,
      projectId,
      analysis,
      questions,
      requirements,
      hasGaps: false,
      nextStep: '/api/process/store',
      message: 'Analysis completed successfully'
    })

  } catch (error: any) {
    console.error('Analyze error:', error)

    const documentId = request.headers.get('x-document-id') || 'unknown'
    progressStore.addUpdate(documentId, {
      step: 'analyze',
      status: 'error',
      message: `Analysis failed: ${error.message}`,
      details: { error: error.message }
    })

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}