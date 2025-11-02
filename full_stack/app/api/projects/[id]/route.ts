import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const project = await prisma.project.findUnique({
      where: { id },
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

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const totalTests = project.testCases.length
    const passedTests = project.testCases.filter(tc => tc.status === 'passed').length
    const failedTests = project.testCases.filter(tc => tc.status === 'failed').length
    const pendingTests = project.testCases.filter(tc => tc.status === 'pending').length

    const avgCompliance = project.complianceChecks.length > 0
      ? project.complianceChecks.reduce((acc, check) => acc + check.coverage, 0) / project.complianceChecks.length
      : 0

    const latestCoverage = project.devOpsMetrics[0]?.coverage || 0

    const projectWithStats = {
      ...project,
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

    return NextResponse.json(projectWithStats)
  } catch (error) {
    console.error('Project API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()

    // Get current project to compare changes
    const currentProject = await prisma.project.findUnique({
      where: { id }
    })

    const updatedProject = await prisma.project.update({
      where: { id },
      data: body,
    })

    // Log status changes
    if (body.status && currentProject && body.status !== currentProject.status) {
      await prisma.activity.create({
        data: {
          projectId: id,
          type: 'status_changed',
          description: `Project status changed from ${currentProject.status} to ${body.status}`,
          metadata: JSON.stringify({ oldStatus: currentProject.status, newStatus: body.status }),
        },
      })
    }

    // Log other updates
    if (body.name && currentProject && body.name !== currentProject.name) {
      await prisma.activity.create({
        data: {
          projectId: id,
          type: 'project_updated',
          description: `Project renamed from "${currentProject.name}" to "${body.name}"`,
        },
      })
    }

    return NextResponse.json(updatedProject)
  } catch (error) {
    console.error('Update project error:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Delete all related records first
    await prisma.$transaction([
      prisma.testCase.deleteMany({ where: { projectId: id } }),
      prisma.requirement.deleteMany({ where: { projectId: id } }),
      prisma.syntheticData.deleteMany({ where: { projectId: id } }),
      prisma.apiTest.deleteMany({ where: { projectId: id } }),
      prisma.integration.deleteMany({ where: { projectId: id } }),
      prisma.complianceCheck.deleteMany({ where: { projectId: id } }),
      prisma.devOpsMetric.deleteMany({ where: { projectId: id } }),
      prisma.activity.deleteMany({ where: { projectId: id } }),
      prisma.dataGeneration.deleteMany({ where: { projectId: id } }),
      prisma.project.delete({ where: { id } }),
    ])

    return NextResponse.json({ message: 'Project deleted successfully' })
  } catch (error) {
    console.error('Delete project error:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}