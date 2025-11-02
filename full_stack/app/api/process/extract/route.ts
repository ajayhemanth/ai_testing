import { NextRequest, NextResponse } from 'next/server'
import { progressStore } from '@/lib/progress-store'
import { extractTextFromImages } from '@/lib/document-processors/extract-text-gemini'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { downloadFromGCS, listFilesInGCS } from '@/lib/storage'
import os from 'os'

export async function POST(request: NextRequest) {
  console.log('[Extract] POST handler called')
  try {
    const body = await request.json()
    console.log('[Extract] Request body:', JSON.stringify(body, null, 2))
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

    progressStore.addUpdate(documentId, {
      step: 'extract',
      status: 'processing',
      current: 0,
      total: documents.length,
      message: 'Starting text extraction',
      details: { phase: 'initialization' }
    })

    const extractedDocuments = []
    let totalExtracted = 0

    // Process each document
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i]

      progressStore.addUpdate(documentId, {
        step: 'extract',
        status: 'processing',
        current: i,
        total: documents.length,
        message: `Extracting text from ${doc.originalName}`,
        details: {
          fileName: doc.originalName,
          pageCount: doc.pageCount
        }
      })

      let extractedContent

      // Check if this is a text-based file (markdown, txt)
      const isTextFile = ['md', 'markdown', 'txt', 'text'].includes(doc.fileType?.toLowerCase())

      // Check if this is a PDF that failed image conversion (format would be 'pdf-direct')
      const isPdfDirect = doc.format === 'pdf-direct' ||
                         (doc.fileType === 'pdf' && (!doc.imagePaths || doc.imagePaths.length === 0))

      if (isTextFile) {
        // For text files, download from GCS and read the content directly
        const fileBuffer = await downloadFromGCS(doc.gcsPath)
        const fileContent = fileBuffer.toString('utf-8')

        // Create extracted content in the same format as image extraction
        extractedContent = {
          text: fileContent,
          sections: [
            {
              title: 'Full Document',
              content: fileContent,
              type: 'text'
            }
          ],
          metadata: {
            fileName: doc.originalName,
            fileType: doc.fileType,
            pageCount: 1,
            extractedAt: new Date().toISOString()
          }
        }
      } else if (isPdfDirect) {
        // For PDFs that failed image conversion, send PDF directly to Gemini
        console.log(`🔍 PDF Direct Reading: Processing ${doc.originalName} directly with Gemini`)
        progressStore.addUpdate(documentId, {
          step: 'extract',
          status: 'processing',
          current: i,
          total: documents.length,
          message: `📄 PDF Direct Reading for: ${doc.originalName}`,
          details: {
            fileName: doc.originalName,
            method: 'direct-pdf-extraction'
          }
        })

        // Download PDF file from GCS and send directly to Gemini
        const { GoogleGenerativeAI } = await import('@google/generative-ai')
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

        const pdfBuffer = await downloadFromGCS(doc.gcsPath)
        const base64Pdf = pdfBuffer.toString('base64')

        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64Pdf
            }
          },
          {
            text: `Extract all text content from this PDF document.
                   Organize the content into clear sections.
                   Return the full text preserving the document structure.`
          }
        ])

        const extractedText = result.response.text()

        extractedContent = {
          text: extractedText,
          sections: [
            {
              title: 'Full Document',
              content: extractedText,
              type: 'pdf-direct'
            }
          ],
          metadata: {
            fileName: doc.originalName,
            fileType: doc.fileType,
            pageCount: doc.pageCount || 1,
            extractedAt: new Date().toISOString(),
            extractionMethod: 'direct-pdf'
          }
        }
      } else {
        // Get image paths for non-text files - download from GCS to temp directory
        const imagePaths: string[] = []

        // Create temp directory for images
        const tempDir = path.join(os.tmpdir(), `extract-${documentId}`)
        await mkdir(tempDir, { recursive: true })

        if (doc.imagePaths && doc.imagePaths.length > 0) {
          // Download images from GCS to temp directory
          for (const imagePath of doc.imagePaths) {
            // Extract just the filename from the full GCS path
            const fileName = path.basename(imagePath)
            const localPath = path.join(tempDir, fileName)

            // Download from GCS
            const gcsImagePath = `${projectId}/${documentId}/images/${fileName}`
            const imageBuffer = await downloadFromGCS(gcsImagePath)
            await writeFile(localPath, imageBuffer)

            imagePaths.push(localPath)
          }
        } else {
          // List images from GCS
          const gcsPrefix = `${projectId}/${documentId}/images/`
          const gcsFiles = await listFilesInGCS(gcsPrefix)
          const imageFiles = gcsFiles
            .filter(f => f.match(/\.(png|jpg|jpeg)$/i))
            .sort()

          // Download each image
          for (const gcsPath of imageFiles) {
            const fileName = path.basename(gcsPath)
            const localPath = path.join(tempDir, fileName)
            const imageBuffer = await downloadFromGCS(gcsPath)
            await writeFile(localPath, imageBuffer)
            imagePaths.push(localPath)
          }
        }

        // Extract text using Gemini with progress tracking
        extractedContent = await extractTextFromImages(
          imagePaths,
          apiKey,
          documentId,
          doc.originalName
        )
      }

      totalExtracted += extractedContent.text.length

      extractedDocuments.push({
        ...doc,
        extractedContent,
        textLength: extractedContent.text.length
      })

      progressStore.addUpdate(documentId, {
        step: 'extract',
        status: 'processing',
        current: i + 1,
        total: documents.length,
        message: `Extracted ${extractedContent.text.length} characters from ${doc.originalName}`,
        details: {
          fileName: doc.originalName,
          charactersExtracted: extractedContent.text.length,
          sectionsFound: extractedContent.sections.length
        }
      })
    }

    progressStore.addUpdate(documentId, {
      step: 'extract',
      status: 'completed',
      current: documents.length,
      total: documents.length,
      message: `Text extraction complete`,
      details: {
        totalCharacters: totalExtracted,
        documentsProcessed: documents.length
      }
    })

    return NextResponse.json({
      documentId,
      projectId,
      documents: extractedDocuments,
      totalExtracted,
      nextStep: '/api/process/analyze',
      message: 'Text extraction completed successfully'
    })

  } catch (error: any) {
    console.error('[Extract] ERROR:', error)
    console.error('[Extract] Error message:', error.message)
    console.error('[Extract] Error stack:', error.stack)

    const documentId = request.headers.get('x-document-id') || 'unknown'
    progressStore.addUpdate(documentId, {
      step: 'extract',
      status: 'error',
      message: `Extraction failed: ${error.message}`,
      details: { error: error.message, stack: error.stack }
    })

    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    )
  }
}