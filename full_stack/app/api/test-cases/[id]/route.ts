import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const testCase = await prisma.testCase.findUnique({
      where: { id },
      include: {
        project: true,
        requirement: true,
        executionHistory: {
          orderBy: { executedAt: 'desc' },
          take: 5,
        },
        complianceMappings: {
          include: {
            standard: true,
          },
        },
      },
    })

    if (!testCase) {
      return NextResponse.json(
        { error: 'Test case not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(testCase)
  } catch (error) {
    console.error('Get test case error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test case' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      title,
      description,
      testSteps,
      expectedResults,
      category,
      priority,
      status,
      automationStatus,
      tags,
      // Compliance tags will be handled separately
    } = body

    // Update the test case
    const updatedTestCase = await prisma.testCase.update({
      where: { id },
      data: {
        title,
        description,
        testSteps,
        expectedResults,
        category,
        priority,
        status,
        automationStatus,
        tags,
        updatedAt: new Date(),
      },
      include: {
        project: true,
        requirement: true,
      },
    })

    // Handle compliance tags if provided
    if (body.complianceTags !== undefined) {
      // Update requirement's compliance tags if test case has a requirement
      if (updatedTestCase.requirementId) {
        await prisma.requirement.update({
          where: { id: updatedTestCase.requirementId },
          data: {
            complianceTags: Array.isArray(body.complianceTags)
              ? body.complianceTags.join(', ')
              : body.complianceTags,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      testCase: updatedTestCase,
    })
  } catch (error: any) {
    console.error('Update test case error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update test case' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.testCase.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Test case deleted successfully',
    })
  } catch (error) {
    console.error('Delete test case error:', error)
    return NextResponse.json(
      { error: 'Failed to delete test case' },
      { status: 500 }
    )
  }
}