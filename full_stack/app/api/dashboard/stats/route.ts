import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get overall statistics
    const [
      totalProjects,
      totalTestCases,
      totalRequirements,
      activeIntegrations,
      testExecutions,
      recentMetrics,
      complianceChecks,
      activeAgents,
      projects,
      recentActivities,
      testCasesByProject,
      complianceStandards,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.testCase.count(),
      prisma.requirement.count(),
      prisma.integration.count({ where: { status: 'active' } }),
      prisma.testExecution.findMany({
        orderBy: { executedAt: 'desc' },
        take: 100,
      }),
      prisma.devOpsMetric.findMany({
        orderBy: { timestamp: 'desc' },
        take: 1,
      }),
      prisma.complianceCheck.findMany({
        orderBy: { checkedAt: 'desc' },
        include: { standard: true },
      }),
      prisma.agent.count({ where: { status: 'active' } }),
      prisma.project.findMany({
        include: {
          testCases: true,
          _count: {
            select: { testCases: true }
          }
        },
        take: 10,
      }),
      prisma.activity.findMany({
        orderBy: { createdAt: 'desc' },
        include: { project: true },
        take: 5,
      }),
      prisma.testCase.groupBy({
        by: ['projectId'],
        _count: true,
      }),
      prisma.complianceStandard.findMany({
        take: 5,
      }),
    ])

    // Calculate test statistics
    const passedTests = testExecutions.filter(e => e.status === 'passed').length
    const failedTests = testExecutions.filter(e => e.status === 'failed').length
    const testPassRate = testExecutions.length > 0
      ? (passedTests / testExecutions.length * 100).toFixed(1)
      : '0'

    // Calculate average compliance
    const avgCompliance = complianceChecks.length > 0
      ? (complianceChecks.reduce((acc, check) => acc + check.coverage, 0) / complianceChecks.length).toFixed(1)
      : '0'

    // Get latest code coverage
    const codeCoverage = recentMetrics[0]?.coverage || 0

    // Calculate project metrics for pie chart
    const projectMetrics = projects.map(project => ({
      name: project.name,
      value: project._count.testCases,
      id: project.id,
    })).filter(p => p.value > 0).slice(0, 4)

    // Format recent activities
    const formattedActivities = recentActivities.map(activity => ({
      id: activity.id,
      action: activity.description,
      project: activity.project.name,
      time: new Date(activity.createdAt).toLocaleString(),
      type: activity.type,
    }))

    // Calculate compliance by standard
    const complianceByStandard = complianceStandards.map(standard => {
      const checks = complianceChecks.filter(c => c.standardId === standard.id)
      const coverage = checks.length > 0
        ? checks.reduce((acc, c) => acc + c.coverage, 0) / checks.length
        : 0
      return {
        standard: standard.name,
        coverage: Math.round(coverage),
        tests: checks.length,
      }
    })

    // Generate test execution trend (last 7 days)
    const last7Days = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })

      // Count executions for this day
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))
      const dayExecutions = testExecutions.filter(e => {
        const execDate = new Date(e.executedAt)
        return execDate >= dayStart && execDate <= dayEnd
      })

      last7Days.push({
        date: dayName,
        passed: dayExecutions.filter(e => e.status === 'passed').length,
        failed: dayExecutions.filter(e => e.status === 'failed').length,
        skipped: dayExecutions.filter(e => e.status === 'skipped').length || 0,
      })
    }

    return NextResponse.json({
      totalProjects,
      totalTestCases,
      totalRequirements,
      activeIntegrations,
      activeAgents,
      testPassRate: parseFloat(testPassRate),
      codeCoverage,
      complianceScore: parseFloat(avgCompliance),
      recentTestRuns: testExecutions.length,
      passedTests,
      failedTests,
      projectMetrics,
      recentActivities: formattedActivities,
      complianceByStandard,
      testExecutionTrend: last7Days,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}