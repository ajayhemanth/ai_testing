import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const requirementId = searchParams.get('requirementId')

    const testCases = await prisma.testCase.findMany({
      where: requirementId ? { requirementId } : undefined,
      include: {
        project: true,
        requirement: true,
        executionHistory: {
          orderBy: { executedAt: 'desc' },
          take: 1,
        },
        complianceMappings: {
          include: {
            standard: true,
          },
        },
      },
    })

    const testCasesWithStats = testCases.map((testCase) => {
      const lastExecution = testCase.executionHistory[0]
      const complianceStandards = testCase.complianceMappings
        .map(m => m.standard.name)
        .join(', ')

      return {
        id: testCase.id,
        projectId: testCase.projectId,
        projectName: testCase.project.name,
        title: testCase.title,
        description: testCase.description,
        testSteps: testCase.testSteps,
        steps: testCase.testSteps ? testCase.testSteps.split('\n').map(s => s.replace(/^\d+\.\s*/, '')) : [],
        expectedResult: testCase.expectedResults,
        expectedResults: testCase.expectedResults,
        actualResult: testCase.actualResults,
        actualResults: testCase.actualResults,
        status: testCase.status,
        priority: testCase.priority,
        category: testCase.category,
        requirementId: testCase.requirementId,
        requirementTitle: testCase.requirement?.title,
        automationStatus: testCase.automationStatus,
        lastExecuted: testCase.lastExecutedAt ? new Date(testCase.lastExecutedAt).toLocaleDateString() : lastExecution ? new Date(lastExecution.executedAt).toLocaleDateString() : null,
        lastExecutedAt: testCase.lastExecutedAt || lastExecution?.executedAt,
        lastExecutionStatus: lastExecution?.status,
        compliance: complianceStandards ? complianceStandards.split(', ') : [],
        complianceStandards,
        tags: testCase.tags,
        jiraId: testCase.jiraId,
        azureId: testCase.azureId,
        aiGenerated: true,
        createdAt: testCase.createdAt,
        updatedAt: testCase.updatedAt,
      }
    })

    // If filtering by requirementId, return just the test cases array
    if (requirementId) {
      return NextResponse.json(testCasesWithStats)
    }

    // Calculate statistics
    const stats = {
      total: testCases.length,
      passed: testCases.filter(tc => tc.status === 'passed').length,
      failed: testCases.filter(tc => tc.status === 'failed').length,
      pending: testCases.filter(tc => tc.status === 'pending').length,
      automated: testCases.filter(tc => tc.automationStatus === 'automated').length,
      manual: testCases.filter(tc => tc.automationStatus === 'manual').length,
    }

    return NextResponse.json({
      testCases: testCasesWithStats,
      stats,
    })
  } catch (error) {
    console.error('Test cases API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch test cases' },
      { status: 500 }
    )
  }
}