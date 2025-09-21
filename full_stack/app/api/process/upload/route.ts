import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { progressStore } from '@/lib/progress-store'
import { convertDocumentToImages } from '@/lib/document-processors/convert-to-image'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  const documentId = uuidv4()

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

    // Send initial progress
    progressStore.addUpdate(documentId, {
      step: 'upload',
      status: 'processing',
      current: 0,
      total: files.length,
      message: `Uploading ${files.length} document(s)`,
      details: {
        phase: 'initialization',
        subSteps: [
          'uploadFiles',
          'convertToImages',
          'extractText',
          'generateQuestions',
          'generateRequirements',
          'saveToDatabase'
        ]
      }
    })

    // Create upload directories
    const uploadDir = path.join(process.cwd(), 'uploads', documentId)
    const imageDir = path.join(uploadDir, 'images')
    await mkdir(imageDir, { recursive: true })

    const uploadedDocuments = []
    let totalPages = 0

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      progressStore.addUpdate(documentId, {
        step: 'upload',
        status: 'processing',
        current: i,
        total: files.length,
        message: `Processing ${file.name}`,
        details: { fileName: file.name }
      })

      // Save uploaded file
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const filePath = path.join(uploadDir, file.name)
      await writeFile(filePath, buffer)

      // Convert to images
      progressStore.addUpdate(documentId, {
        step: 'upload',
        status: 'processing',
        current: i,
        total: files.length,
        message: `Converting ${file.name} to images`,
        details: { phase: 'conversion' }
      })

      const fileExt = path.extname(file.name).toLowerCase().substring(1)
      const conversionResult = await convertDocumentToImages(filePath, fileExt)

      totalPages += conversionResult.pageCount

      uploadedDocuments.push({
        originalName: file.name,
        filePath,
        fileType: fileExt,
        pageCount: conversionResult.pageCount,
        imagePaths: conversionResult.imagePaths || []
      })
    }

    // Upload complete
    progressStore.addUpdate(documentId, {
      step: 'upload',
      status: 'completed',
      current: files.length,
      total: files.length,
      message: `Uploaded and converted ${files.length} document(s)`,
      details: {
        documentsUploaded: files.length,
        totalPages
      }
    })

    return NextResponse.json({
      documentId,
      projectId,
      documents: uploadedDocuments,
      totalPages,
      nextStep: '/api/process/extract',
      message: 'Files uploaded and converted successfully'
    })

  } catch (error: any) {
    progressStore.addUpdate(documentId, {
      step: 'upload',
      status: 'error',
      message: `Upload failed: ${error.message}`,
      details: { error: error.message }
    })

    return NextResponse.json(
      { error: error.message, documentId },
      { status: 500 }
    )
  }
}