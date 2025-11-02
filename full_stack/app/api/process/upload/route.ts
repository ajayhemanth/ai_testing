import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile } from 'fs/promises'
import path from 'path'
import os from 'os'
import { progressStore } from '@/lib/progress-store'
import { convertDocumentToImages } from '@/lib/document-processors/convert-to-image'
import { uploadToGCS } from '@/lib/storage'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  let documentId = ''
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const projectId = formData.get('projectId') as string
    documentId = formData.get('documentId') as string || uuidv4()  // Use client-provided ID or generate

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

    // Create temporary directories for processing
    const tempDir = path.join(os.tmpdir(), `doc-${documentId}`)
    const imageDir = path.join(tempDir, 'images')
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

      // Upload file to GCS
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const gcsPath = `${projectId}/${documentId}/${file.name}`
      await uploadToGCS(buffer, gcsPath, file.type)

      // Save to temp for processing
      const tempFilePath = path.join(tempDir, file.name)
      await writeFile(tempFilePath, buffer)

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
      const conversionResult = await convertDocumentToImages(tempFilePath, fileExt)

      // Upload images to GCS and store just the filenames
      const imageFilenames: string[] = []
      if (conversionResult.imagePaths) {
        for (const imagePath of conversionResult.imagePaths) {
          const imageBuffer = await readFile(imagePath)
          const imageName = path.basename(imagePath)
          const imageGcsPath = `${projectId}/${documentId}/images/${imageName}`
          await uploadToGCS(imageBuffer, imageGcsPath, 'image/png')
          imageFilenames.push(imageName)
        }
      }

      totalPages += conversionResult.pageCount

      uploadedDocuments.push({
        originalName: file.name,
        gcsPath: gcsPath,
        fileType: fileExt,
        pageCount: conversionResult.pageCount,
        imagePaths: imageFilenames
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