import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const metrics = await prisma.devOpsMetric.findMany({
      include: {
        project: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    })

    // Group metrics by pipeline
    const pipelineMetrics = metrics.reduce((acc, metric) => {
      const pipelineName = metric.pipeline || 'default'
      if (!acc[pipelineName]) {
        acc[pipelineName] = []
      }
      acc[pipelineName].push(metric)
      return acc
    }, {} as Record<string, typeof metrics>)

    // Calculate statistics for each pipeline
    const pipelineStats = Object.entries(pipelineMetrics).map(([pipeline, pipelineData]) => {
      const latest = pipelineData[0]
      const totalBuilds = pipelineData.length
      const successfulBuilds = pipelineData.filter(m => m.buildStatus === 'success').length
      const avgCoverage = pipelineData.reduce((acc, m) => acc + m.coverage, 0) / pipelineData.length
      const avgTestsPassed = pipelineData.reduce((acc, m) => acc + m.testsPassed, 0) / pipelineData.length
      const avgTestsFailed = pipelineData.reduce((acc, m) => acc + m.testsFailed, 0) / pipelineData.length

      return {
        pipeline,
        projectName: latest.project.name,
        totalBuilds,
        successfulBuilds,
        buildSuccessRate: Math.round((successfulBuilds / totalBuilds) * 100),
        avgCoverage: Math.round(avgCoverage),
        avgTestsPassed: Math.round(avgTestsPassed),
        avgTestsFailed: Math.round(avgTestsFailed),
        latestBuild: {
          status: latest.buildStatus,
          testsPassed: latest.testsPassed,
          testsFailed: latest.testsFailed,
          testsSkipped: latest.testsSkipped,
          coverage: latest.coverage,
          deploymentStatus: latest.deploymentStatus,
          timestamp: latest.timestamp,
        },
      }
    })

    // Calculate overall statistics
    const overallStats = {
      totalBuilds: metrics.length,
      successfulBuilds: metrics.filter(m => m.buildStatus === 'success').length,
      failedBuilds: metrics.filter(m => m.buildStatus === 'failed').length,
      avgCoverage: metrics.length > 0
        ? Math.round(metrics.reduce((acc, m) => acc + m.coverage, 0) / metrics.length)
        : 0,
      totalTestsPassed: metrics.reduce((acc, m) => acc + m.testsPassed, 0),
      totalTestsFailed: metrics.reduce((acc, m) => acc + m.testsFailed, 0),
      totalTestsSkipped: metrics.reduce((acc, m) => acc + m.testsSkipped, 0),
    }

    return NextResponse.json({
      pipelines: pipelineStats,
      recentBuilds: metrics.slice(0, 10),
      stats: overallStats,
    })
  } catch (error) {
    console.error('DevOps metrics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch DevOps metrics' },
      { status: 500 }
    )
  }
}