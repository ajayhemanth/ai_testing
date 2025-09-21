import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [
      complianceStandards,
      complianceChecks,
      complianceMappings,
      projects,
    ] = await Promise.all([
      prisma.complianceStandard.findMany(),
      prisma.complianceCheck.findMany({
        include: {
          project: true,
          standard: true,
        },
      }),
      prisma.complianceMapping.findMany({
        include: {
          testCase: true,
          standard: true,
        },
      }),
      prisma.project.findMany({
        include: {
          testCases: {
            include: {
              complianceMappings: {
                include: {
                  standard: true,
                },
              },
            },
          },
        },
      }),
    ])

    // Calculate coverage by standard
    const standardCoverage = complianceStandards.map((standard) => {
      const checks = complianceChecks.filter(c => c.standardId === standard.id)
      const avgCoverage = checks.length > 0
        ? checks.reduce((acc, check) => acc + check.coverage, 0) / checks.length
        : 0

      const mappings = complianceMappings.filter(m => m.standardId === standard.id)
      const verifiedMappings = mappings.filter(m => m.status === 'verified')

      return {
        id: standard.id,
        name: standard.name,
        version: standard.version,
        country: standard.country,
        description: standard.description,
        categories: standard.categories,
        coverage: Math.round(avgCoverage),
        totalRequirements: mappings.length,
        verifiedRequirements: verifiedMappings.length,
        projects: checks.map(c => c.project.name),
      }
    })

    // Calculate project compliance
    const projectCompliance = projects.map((project) => {
      const projectChecks = complianceChecks.filter(c => c.projectId === project.id)
      const avgCompliance = projectChecks.length > 0
        ? projectChecks.reduce((acc, check) => acc + check.coverage, 0) / projectChecks.length
        : 0

      const testCasesWithCompliance = project.testCases.filter(
        tc => tc.complianceMappings.length > 0
      )

      return {
        projectId: project.id,
        projectName: project.name,
        targetCompliances: project.targetCompliances,
        overallCompliance: Math.round(avgCompliance),
        totalTestCases: project.testCases.length,
        compliantTestCases: testCasesWithCompliance.length,
        standards: projectChecks.map(c => ({
          name: c.standard.name,
          coverage: Math.round(c.coverage),
          status: c.status,
          findings: c.findings,
          checkedAt: c.checkedAt,
        })),
      }
    })

    // Calculate overall statistics
    const overallStats = {
      totalStandards: complianceStandards.length,
      totalChecks: complianceChecks.length,
      totalMappings: complianceMappings.length,
      verifiedMappings: complianceMappings.filter(m => m.status === 'verified').length,
      avgCompliance: complianceChecks.length > 0
        ? Math.round(complianceChecks.reduce((acc, c) => acc + c.coverage, 0) / complianceChecks.length)
        : 0,
    }

    return NextResponse.json({
      standards: standardCoverage,
      projectCompliance,
      stats: overallStats,
    })
  } catch (error) {
    console.error('Compliance API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch compliance data' },
      { status: 500 }
    )
  }
}