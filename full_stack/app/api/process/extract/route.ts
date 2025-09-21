import { NextRequest, NextResponse } from 'next/server'
import { progressStore } from '@/lib/progress-store'
import { extractTextFromImages } from '@/lib/document-processors/extract-text-gemini'
import path from 'path'
import { readdir } from 'fs/promises'

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

      // Get image paths
      let imagePaths: string[] = []

      if (doc.imagePaths && doc.imagePaths.length > 0) {
        imagePaths = doc.imagePaths
      } else {
        // Find images in the document's image directory
        const imageDir = path.join(process.cwd(), 'uploads', documentId, 'images')
        const files = await readdir(imageDir)
        imagePaths = files
          .filter(f => f.match(/\.(png|jpg|jpeg)$/i))
          .map(f => path.join(imageDir, f))
          .sort()
      }

      // Extract text using Gemini with progress tracking
      const extractedContent = await extractTextFromImages(
        imagePaths,
        apiKey,
        documentId,
        doc.originalName
      )

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
    console.error('Extract error:', error)

    const documentId = request.headers.get('x-document-id') || 'unknown'
    progressStore.addUpdate(documentId, {
      step: 'extract',
      status: 'error',
      message: `Extraction failed: ${error.message}`,
      details: { error: error.message }
    })

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}