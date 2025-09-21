import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        testCases: true,
        requirements: true,
        complianceChecks: {
          include: {
            standard: true,
          },
        },
        devOpsMetrics: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    })

    const projectsWithStats = projects.map((project) => {
      const totalTests = project.testCases.length
      const passedTests = project.testCases.filter(tc => tc.status === 'passed').length
      const failedTests = project.testCases.filter(tc => tc.status === 'failed').length
      const pendingTests = project.testCases.filter(tc => tc.status === 'pending').length

      const avgCompliance = project.complianceChecks.length > 0
        ? project.complianceChecks.reduce((acc, check) => acc + check.coverage, 0) / project.complianceChecks.length
        : 0

      const latestCoverage = project.devOpsMetrics[0]?.coverage || 0

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        softwareType: project.softwareType,
        targetCompliances: project.targetCompliances,
        country: project.country,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        stats: {
          totalTests,
          passedTests,
          failedTests,
          pendingTests,
          totalRequirements: project.requirements.length,
          compliance: Math.round(avgCompliance),
          coverage: Math.round(latestCoverage),
        },
      }
    })

    return NextResponse.json(projectsWithStats)
  } catch (error) {
    console.error('Projects API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const project = await prisma.project.create({
      data: {
        name: body.name,
        description: body.description,
        softwareType: body.softwareType,
        targetCompliances: body.targetCompliances,
        country: body.country,
        status: 'active',
        activities: {
          create: {
            type: 'project_created',
            description: `Project "${body.name}" was created`,
            metadata: JSON.stringify({
              softwareType: body.softwareType,
              country: body.country,
              targetCompliances: body.targetCompliances,
            }),
          },
        },
      },
      include: {
        activities: true,
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error('Create project error:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}