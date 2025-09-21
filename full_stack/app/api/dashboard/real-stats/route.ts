import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Fetch all real data from completed pages
    const [
      projects,
      requirements,
      testCases,
      dataGenerations,
      activities,
      testCasesByStatus,
      requirementsByType,
      testCasesByPriority,
      requirementsByPriority,
      testCasesByCategory,
      recentDocuments,
    ] = await Promise.all([
      // Projects with counts
      prisma.project.findMany({
        include: {
          _count: {
            select: {
              requirements: true,
              testCases: true,
              dataGenerations: true,
            }
          }
        }
      }),
      // All requirements
      prisma.requirement.findMany({
        include: {
          project: true,
          _count: {
            select: { testCases: true }
          }
        }
      }),
      // All test cases
      prisma.testCase.findMany({
        include: {
          project: true,
          requirement: true,
        }
      }),
      // Data generations (synthetic data)
      prisma.dataGeneration.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { project: true }
      }),
      // Recent activities
      prisma.activity.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { project: true }
      }),
      // Test cases by status
      prisma.testCase.groupBy({
        by: ['status'],
        _count: true,
      }),
      // Requirements by type
      prisma.requirement.groupBy({
        by: ['type'],
        _count: true,
      }),
      // Test cases by priority
      prisma.testCase.groupBy({
        by: ['priority'],
        _count: true,
      }),
      // Requirements by priority
      prisma.requirement.groupBy({
        by: ['priority'],
        _count: true,
      }),
      // Test cases by category
      prisma.testCase.groupBy({
        by: ['category'],
        _count: true,
        where: {
          category: { not: null }
        }
      }),
      // Recent document uploads (from activities)
      prisma.activity.findMany({
        where: {
          type: { in: ['document_uploaded', 'requirements_generated'] }
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { project: true }
      }),
    ])

    // Calculate stats
    const totalProjects = projects.length
    const totalRequirements = requirements.length
    const totalTestCases = testCases.length
    const totalDataGenerations = dataGenerations.length

    // Calculate test pass rate
    const passedTests = testCases.filter(tc => tc.status === 'passed').length
    const failedTests = testCases.filter(tc => tc.status === 'failed').length
    const pendingTests = testCases.filter(tc => tc.status === 'pending').length
    const testPassRate = totalTestCases > 0
      ? ((passedTests / totalTestCases) * 100).toFixed(1)
      : '0'

    // Calculate automation rate
    const automatedTests = testCases.filter(tc => tc.automationStatus === 'automated').length
    const automationRate = totalTestCases > 0
      ? ((automatedTests / totalTestCases) * 100).toFixed(1)
      : '0'

    // Requirements coverage (requirements with test cases)
    const requirementsWithTests = requirements.filter(r => r._count.testCases > 0).length
    const requirementsCoverage = totalRequirements > 0
      ? ((requirementsWithTests / totalRequirements) * 100).toFixed(1)
      : '0'

    // Compliance tags analysis
    const complianceTags = new Map()
    requirements.forEach(req => {
      if (req.complianceTags) {
        req.complianceTags.split(',').forEach(tag => {
          const trimmedTag = tag.trim()
          if (trimmedTag) {
            complianceTags.set(trimmedTag, (complianceTags.get(trimmedTag) || 0) + 1)
          }
        })
      }
    })
    const complianceDistribution = Array.from(complianceTags.entries()).map(([tag, count]) => ({
      name: tag,
      value: count
    }))

    // Project metrics for charts
    const projectMetrics = projects.map(p => ({
      name: p.name,
      requirements: p._count.requirements,
      testCases: p._count.testCases,
      dataGenerations: p._count.dataGenerations,
      createdAt: p.createdAt,
    }))

    // Test execution timeline (based on status changes - last 7 days)
    const last7Days = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))

      const dayTestCases = testCases.filter(tc => {
        const updatedAt = new Date(tc.updatedAt)
        return updatedAt >= dayStart && updatedAt <= dayEnd
      })

      last7Days.push({
        date: dayName,
        created: dayTestCases.length,
        passed: dayTestCases.filter(tc => tc.status === 'passed').length,
        failed: dayTestCases.filter(tc => tc.status === 'failed').length,
      })
    }

    // Format activities
    const formattedActivities = activities.map(a => ({
      id: a.id,
      type: a.type,
      description: a.description,
      project: a.project?.name || 'Unknown',
      time: new Date(a.createdAt).toLocaleString(),
      metadata: a.metadata,
    }))

    // Requirements by type chart
    const requirementTypes = requirementsByType.map(r => ({
      type: r.type || 'Unspecified',
      count: r._count,
    }))

    // Test cases by priority chart
    const testPriorities = testCasesByPriority.map(tc => ({
      priority: tc.priority,
      count: tc._count,
    }))

    // Test cases by category
    const testCategories = testCasesByCategory.map(tc => ({
      category: tc.category,
      count: tc._count,
    }))

    return NextResponse.json({
      // Core stats
      totalProjects,
      totalRequirements,
      totalTestCases,
      totalDataGenerations,
      passedTests,
      failedTests,
      pendingTests,
      testPassRate: parseFloat(testPassRate),
      automationRate: parseFloat(automationRate),
      requirementsCoverage: parseFloat(requirementsCoverage),

      // Chart data
      projectMetrics,
      testExecutionTrend: last7Days,
      complianceDistribution,
      requirementTypes,
      testPriorities,
      testCategories,
      testCasesByStatus,

      // Lists
      recentActivities: formattedActivities,
      recentDataGenerations: dataGenerations.map(dg => ({
        id: dg.id,
        projectName: dg.project.name,
        dataType: dg.dataType,
        outputFormat: dg.outputFormat,
        recordCount: dg.recordCount,
        createdAt: new Date(dg.createdAt).toLocaleString(),
      })),
      recentDocuments: recentDocuments.map(doc => ({
        id: doc.id,
        project: doc.project?.name || 'Unknown',
        description: doc.description,
        time: new Date(doc.createdAt).toLocaleString(),
      })),
    })
  } catch (error) {
    console.error('Dashboard real stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}