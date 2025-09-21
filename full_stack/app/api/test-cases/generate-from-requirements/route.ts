import { NextRequest, NextResponse } from 'next/server'
import { generateTestCasesForMultipleRequirements } from '@/lib/document-processors/generate-test-cases'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, requirementIds, generateForAll = false } = body

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
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

    // Fetch requirements to generate test cases for
    let requirements
    if (generateForAll) {
      // Get all requirements for the project
      requirements = await prisma.requirement.findMany({
        where: { projectId },
        orderBy: { priority: 'desc' }
      })
    } else if (requirementIds && requirementIds.length > 0) {
      // Get specific requirements
      requirements = await prisma.requirement.findMany({
        where: {
          id: { in: requirementIds },
          projectId
        }
      })
    } else {
      // Get requirements without test cases
      const requirementsWithTestCases = await prisma.testCase.findMany({
        where: { requirement: { projectId } },
        select: { requirementId: true },
        distinct: ['requirementId']
      })

      const requirementIdsWithTestCases = requirementsWithTestCases.map(tc => tc.requirementId).filter(Boolean)

      requirements = await prisma.requirement.findMany({
        where: {
          projectId,
          id: { notIn: requirementIdsWithTestCases as string[] }
        },
        orderBy: { priority: 'desc' }
      })
    }

    if (requirements.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No requirements found to generate test cases for',
        count: 0,
        testCases: []
      })
    }

    // Get project context for better test case generation
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    const projectContext = {
      projectType: project?.softwareType || 'Healthcare Software',
      complianceStandards: project?.targetCompliances?.split(',').map(s => s.trim()) || [],
      targetUsers: ['Healthcare Professionals', 'Patients', 'Administrators']
    }

    // Generate test cases for all requirements
    const testCasesMap = await generateTestCasesForMultipleRequirements(
      requirements,
      projectContext,
      apiKey
    )

    // Store test cases in database
    const createdTestCases = []
    let totalCreated = 0

    for (const [requirementId, testCases] of testCasesMap) {
      for (const testCase of testCases) {
        try {
          // Convert steps array to string
          const stepsText = Array.isArray(testCase.steps)
            ? testCase.steps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')
            : testCase.steps

          // Combine preconditions and test data into the description
          const fullDescription = [
            testCase.description,
            testCase.preconditions ? `\n\nPreconditions:\n${testCase.preconditions}` : '',
            testCase.testData ? `\n\nTest Data:\n${testCase.testData}` : ''
          ].join('')

          const created = await prisma.testCase.create({
            data: {
              requirementId,
              title: testCase.title,
              description: fullDescription,
              category: testCase.type || 'functional',
              priority: testCase.priority || 'medium',
              status: 'pending',
              testSteps: stepsText || '',
              expectedResults: testCase.expectedResult || '',
              actualResults: '',
              automationStatus: 'manual',
              projectId, // Add projectId directly to test case
            }
          })

          createdTestCases.push(created)
          totalCreated++
        } catch (error) {
          console.error('Failed to create test case:', error, testCase)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${totalCreated} test cases for ${requirements.length} requirements`,
      count: totalCreated,
      testCases: createdTestCases,
      requirementsProcessed: requirements.length
    })

  } catch (error: any) {
    console.error('Generate test cases error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate test cases' },
      { status: 500 }
    )
  }
}