import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateTestCaseImprovements } from '@/lib/document-processors/improve-test-case'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    // Fetch the test case with related data
    const testCase = await prisma.testCase.findUnique({
      where: { id },
      include: {
        project: true,
        requirement: true,
      },
    })

    if (!testCase) {
      return NextResponse.json(
        { error: 'Test case not found' },
        { status: 404 }
      )
    }

    // Generate improvements using AI
    const improvements = await generateTestCaseImprovements(
      {
        title: testCase.title,
        description: testCase.description || undefined,
        testSteps: testCase.testSteps || undefined,
        expectedResults: testCase.expectedResults || undefined,
        category: testCase.category || undefined,
        priority: testCase.priority || undefined,
        requirement: testCase.requirement ? {
          title: testCase.requirement.title,
          description: testCase.requirement.description || undefined,
          complianceTags: testCase.requirement.complianceTags || undefined,
        } : undefined,
        project: testCase.project ? {
          name: testCase.project.name,
          softwareType: testCase.project.softwareType || undefined,
          targetCompliances: testCase.project.targetCompliances || undefined,
        } : undefined,
      },
      apiKey
    )

    return NextResponse.json({
      success: true,
      suggestions: improvements,
      currentTestCase: {
        id: testCase.id,
        title: testCase.title,
        description: testCase.description,
        testSteps: testCase.testSteps,
        expectedResults: testCase.expectedResults,
        category: testCase.category,
        priority: testCase.priority,
        status: testCase.status,
        automationStatus: testCase.automationStatus,
        tags: testCase.tags,
        complianceTags: testCase.requirement?.complianceTags,
      },
    })
  } catch (error: any) {
    console.error('Generate suggestions error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate suggestions' },
      { status: 500 }
    )
  }
}