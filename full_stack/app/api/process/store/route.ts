import { NextRequest, NextResponse } from 'next/server'
import { progressStore } from '@/lib/progress-store'
import { prisma } from '@/lib/prisma'
import { saveRequirementsToDatabase } from '@/lib/document-processors/process-documents'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { documentId, projectId, requirements } = body

    if (!documentId || !projectId || !requirements) {
      return NextResponse.json(
        { error: 'Document ID, Project ID, and requirements are required' },
        { status: 400 }
      )
    }

    progressStore.addUpdate(documentId, {
      step: 'store',
      status: 'processing',
      current: 0,
      total: requirements.length,
      message: `Saving ${requirements.length} requirements to database`,
      details: { phase: 'saving' }
    })

    // Save requirements to database
    const savedRequirements = await saveRequirementsToDatabase(
      requirements,
      projectId,
      prisma
    )

    // Log activity
    await prisma.activity.create({
      data: {
        projectId,
        type: 'requirements_generated',
        description: `Generated and saved ${savedRequirements.length} requirements from document upload`,
        metadata: JSON.stringify({
          documentId,
          requirementsGenerated: requirements.length,
          requirementsSaved: savedRequirements.length
        })
      }
    })

    progressStore.addUpdate(documentId, {
      step: 'store',
      status: 'completed',
      current: savedRequirements.length,
      total: requirements.length,
      message: `Saved ${savedRequirements.length} requirements`,
      details: {
        requirementsSaved: savedRequirements.length,
        requirementsFailed: requirements.length - savedRequirements.length
      }
    })

    // Final completion update
    progressStore.addUpdate(documentId, {
      step: 'complete',
      status: 'completed',
      message: 'Document processing complete!',
      details: {
        totalRequirements: savedRequirements.length,
        projectId
      }
    })

    return NextResponse.json({
      documentId,
      projectId,
      savedRequirements: savedRequirements.length,
      message: 'Requirements saved successfully',
      complete: true
    })

  } catch (error: any) {
    console.error('Store error:', error)

    const documentId = request.headers.get('x-document-id') || 'unknown'
    progressStore.addUpdate(documentId, {
      step: 'store',
      status: 'error',
      message: `Storage failed: ${error.message}`,
      details: { error: error.message }
    })

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}