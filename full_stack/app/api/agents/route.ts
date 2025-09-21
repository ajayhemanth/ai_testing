import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const agents = await prisma.agent.findMany({
      orderBy: { lastRunAt: 'desc' },
    })

    // Get task statistics for each agent
    const agentStats = await Promise.all(
      agents.map(async (agent) => {
        // For demo purposes, we'll calculate some stats from test executions
        const recentExecutions = await prisma.testExecution.count({
          where: {
            executedBy: 'Automation',
            executedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
        })

        const successfulExecutions = await prisma.testExecution.count({
          where: {
            executedBy: 'Automation',
            status: 'passed',
            executedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        })

        const avgResponseTime = agent.lastRunAt
          ? Math.random() * 3 + 1 // Simulated for now
          : 0

        return {
          ...agent,
          tasksCompleted: recentExecutions,
          successRate: recentExecutions > 0
            ? Math.round((successfulExecutions / recentExecutions) * 100)
            : 0,
          avgResponseTime: `${avgResponseTime.toFixed(1)}s`,
          currentTask: agent.status === 'active'
            ? `Processing ${agent.type} task`
            : null,
          progress: agent.status === 'active' ? Math.floor(Math.random() * 100) : 0,
        }
      })
    )

    // Calculate metrics for agent performance
    const agentMetrics = agents.slice(0, 5).map((agent) => {
      const stats = agentStats.find(s => s.id === agent.id)
      return {
        agent: agent.name,
        tasks: stats?.tasksCompleted || 0,
        success: stats?.successRate || 0,
        time: stats?.avgResponseTime || '0s',
      }
    })

    return NextResponse.json({
      agents: agentStats,
      metrics: agentMetrics,
      totalActive: agents.filter(a => a.status === 'active').length,
      totalIdle: agents.filter(a => a.status === 'idle').length,
    })
  } catch (error) {
    console.error('Agents API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}