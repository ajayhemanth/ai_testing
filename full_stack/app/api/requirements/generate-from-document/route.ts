import { NextRequest, NextResponse } from 'next/server'
import { generateRequirements } from '@/lib/document-processors/generate-requirements'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, documentId, analysis, gapAnswers } = body

    if (!projectId || !documentId) {
      return NextResponse.json(
        { error: 'Project ID and document ID are required' },
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

    // Prepare content with gap answers integrated
    const enhancedContent = {
      text: analysis?.text || '',
      sections: analysis?.sections || [],
      metadata: {
        ...analysis?.metadata,
        gapAnswers,
        projectType: gapAnswers?.['project-type'] || analysis?.projectType,
        complianceStandards: gapAnswers?.['compliance-standards'] || analysis?.complianceStandards,
        riskClassification: gapAnswers?.['risk-classification'] || analysis?.riskLevel,
        targetUsers: gapAnswers?.['target-users'] || analysis?.targetUsers,
        deploymentRegions: gapAnswers?.['deployment-regions'] || analysis?.regions,
        dataHandling: gapAnswers?.['data-handling'] || analysis?.dataHandling,
        integrations: gapAnswers?.['integrations'] || analysis?.integrations,
      }
    }

    // Generate comprehensive requirements using both document content and gap answers
    const requirements = await generateRequirements(
      enhancedContent,
      { answers: gapAnswers },
      apiKey
    )

    // Store requirements in the database
    const createdRequirements = []
    for (const req of requirements) {
      try {
        // Handle acceptanceCriteria - convert array to string if needed
        let acceptanceCriteria = ''
        if (Array.isArray(req.acceptanceCriteria)) {
          acceptanceCriteria = req.acceptanceCriteria.join('\n')
        } else if (typeof req.acceptanceCriteria === 'string') {
          acceptanceCriteria = req.acceptanceCriteria
        }

        // Handle testScenarios - convert array to JSON string if needed
        let testScenarios = ''
        if (Array.isArray(req.testScenarios)) {
          testScenarios = JSON.stringify(req.testScenarios)
        } else if (typeof req.testScenarios === 'string') {
          testScenarios = req.testScenarios
        }

        // Handle complianceTags - convert array to comma-separated string if needed
        let complianceTags = ''
        if (Array.isArray(req.compliance)) {
          complianceTags = req.compliance.join(', ')
        } else if (typeof req.compliance === 'string') {
          complianceTags = req.compliance
        }

        const created = await prisma.requirement.create({
          data: {
            projectId,
            title: req.title,
            description: req.description,
            type: req.category || 'functional',
            priority: req.priority || 'medium',
            status: 'draft',
            source: `Document: ${documentId}${gapAnswers ? ' + Gap Analysis' : ''}`,
            complianceTags,
            acceptanceCriteria,
            userStory: req.userStory || '',
            testScenarios,
            dependencies: req.dependencies ? JSON.stringify(req.dependencies) : '',
            risks: req.risks ? JSON.stringify(req.risks) : '',
          }
        })
        createdRequirements.push(created)
      } catch (error) {
        console.error('Failed to create requirement:', error, req)
      }
    }

    // Now generate test cases for the created requirements
    let testCaseMessage = ''
    if (createdRequirements.length > 0) {
      try {
        // Get the base URL from headers or use localhost as fallback
        const host = request.headers.get('host') || 'localhost:3000'
        const protocol = request.headers.get('x-forwarded-proto') || 'https'
        const baseUrl = `${protocol}://${host}`

        // Use AbortController to set a longer timeout (10 minutes)
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 600000) // 10 minutes

        try {
          const testCaseResponse = await fetch(`${baseUrl}/api/test-cases/generate-from-requirements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              requirementIds: createdRequirements.map(r => r.id)
            }),
            signal: controller.signal
          })

          clearTimeout(timeout)

          if (testCaseResponse.ok) {
            const testCaseResult = await testCaseResponse.json()
            testCaseMessage = ` and ${testCaseResult.count} test cases`
          }
        } catch (fetchError: any) {
          clearTimeout(timeout)
          if (fetchError.name === 'AbortError') {
            console.log('Test case generation timeout - running in background')
            testCaseMessage = ' (test cases are being generated in background)'
          } else {
            throw fetchError
          }
        }
      } catch (error) {
        console.error('Failed to generate test cases:', error)
        // Don't fail the whole operation if test case generation fails
      }
    }

    return NextResponse.json({
      success: true,
      count: createdRequirements.length,
      requirements: createdRequirements,
      message: `Successfully generated ${createdRequirements.length} requirements${testCaseMessage}`
    })

  } catch (error: any) {
    console.error('Generate requirements from document error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate requirements' },
      { status: 500 }
    )
  }
}