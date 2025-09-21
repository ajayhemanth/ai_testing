import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { processDocuments, saveRequirementsToDatabase } from '@/lib/document-processors/process-documents'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const projectId = formData.get('projectId') as string

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
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

    const uploadDir = path.join(process.cwd(), 'uploads')
    await mkdir(uploadDir, { recursive: true })

    const filePaths: string[] = []
    const uploadedFiles: any[] = []

    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const timestamp = Date.now()
      const fileName = `${timestamp}-${file.name}`
      const filePath = path.join(uploadDir, fileName)

      await writeFile(filePath, buffer)
      filePaths.push(filePath)

      uploadedFiles.push({
        originalName: file.name,
        savedName: fileName,
        size: file.size,
        type: file.type
      })
    }

    console.log(`\n🚀 Starting document processing for project ${projectId}`)
    console.log(`📁 Processing ${filePaths.length} file(s): ${files.map(f => f.name).join(', ')}\n`)

    const processedDocuments = await processDocuments(filePaths, {
      projectId,
      apiKey,
      generateQuestions: true,
      autoGenerateRequirements: true
    })

    console.log(`\n✅ Document processing complete!`)

    const allSavedRequirements: any[] = []
    const processingResults = []

    for (let i = 0; i < processedDocuments.length; i++) {
      const doc = processedDocuments[i]
      const fileInfo = uploadedFiles[i]

      if (doc.requirements && doc.requirements.length > 0) {
        const savedReqs = await saveRequirementsToDatabase(
          doc.requirements,
          projectId,
          prisma
        )
        allSavedRequirements.push(...savedReqs)
      }

      await prisma.activity.create({
        data: {
          projectId,
          type: 'document_upload',
          description: `Uploaded and processed document: ${fileInfo.originalName}`,
          metadata: JSON.stringify({
            fileName: fileInfo.originalName,
            requirementsExtracted: doc.requirements.length,
            questionsGenerated: doc.questions.length
          })
        }
      })

      processingResults.push({
        file: fileInfo,
        extractedText: doc.extractedContent.text.substring(0, 500),
        sections: doc.extractedContent.sections.length,
        questions: doc.questions,
        requirementsGenerated: doc.requirements.length,
        requirementsSaved: doc.requirements.filter(r =>
          allSavedRequirements.some(sr => sr.title === r.title)
        ).length,
        errors: doc.errors
      })
    }

    return NextResponse.json({
      success: true,
      filesProcessed: files.length,
      results: processingResults,
      totalRequirementsSaved: allSavedRequirements.length
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to process uploaded files', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}