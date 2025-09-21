"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
  Bot,
  Brain,
  Zap,
  Play,
  Pause,
  Settings,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Target,
  Shield,
  Database,
  FileText,
  GitBranch,
} from "lucide-react"
import { AGENT_TYPES, MOCK_VERTEX_AGENTS } from "@/lib/constants"
import { toast } from "sonner"

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([])
  const [agentMetrics, setAgentMetrics] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalActive: 0,
    totalIdle: 0,
    totalAgents: 0,
    tasksCompleted: 0,
    successRate: 0,
    avgResponse: "0s",
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/agents')
      .then(res => res.json())
      .then(data => {
        setAgents(data.agents || [])
        setAgentMetrics(data.metrics || [])

        // Calculate stats from the response
        const totalTasks = data.agents.reduce((acc: number, agent: any) => acc + agent.tasksCompleted, 0)
        const avgSuccess = data.agents.length > 0
          ? data.agents.reduce((acc: number, agent: any) => acc + agent.successRate, 0) / data.agents.length
          : 0
        const avgTime = data.agents.length > 0
          ? data.agents.reduce((acc: number, agent: any) => {
              const time = parseFloat(agent.avgResponseTime) || 0
              return acc + time
            }, 0) / data.agents.length
          : 0

        setStats({
          totalActive: data.totalActive || 0,
          totalIdle: data.totalIdle || 0,
          totalAgents: data.agents.length || 0,
          tasksCompleted: totalTasks,
          successRate: Math.round(avgSuccess),
          avgResponse: `${avgTime.toFixed(1)}s`,
        })
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch agents:', err)
        setLoading(false)
      })
  }, [])

  const handleToggleAgent = (agentId: string) => {
    setAgents(prev =>
      prev.map(agent =>
        agent.id === agentId
          ? {
              ...agent,
              status: agent.status === "active" ? "idle" : "active",
              progress: agent.status === "active" ? 0 : 10,
            }
          : agent
      )
    )

    const agent = agents.find(a => a.id === agentId)
    toast.success(
      agent?.status === "active" ? "Agent paused" : "Agent activated",
      {
        description: `${agent?.name} status updated`,
      }
    )
  }

  const handleOrchestrate = () => {
    toast.success("Multi-agent orchestration started", {
      description: "Agents are coordinating to complete your task",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "text-green-600"
      case "idle": return "text-gray-600"
      case "error": return "text-red-600"
      default: return "text-gray-600"
    }
  }

  const getAgentIcon = (type: string) => {
    switch (type) {
      case "test-generator": return FileText
      case "compliance-checker": return Shield
      case "data-synthesizer": return Database
      case "risk-assessor": return Target
      default: return Bot
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Agent Orchestration</h1>
          <p className="text-muted-foreground mt-2">
            Vertex AI multi-agent system management
          </p>
        </div>
        <Button onClick={handleOrchestrate}>
          <Sparkles className="mr-2 h-4 w-4" />
          Orchestrate Agents
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalActive} / {stats.totalAgents}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.totalIdle} idle agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tasksCompleted}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Last 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <Progress value={stats.successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponse}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Across all agents
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {agents.map((agent) => {
          const Icon = getAgentIcon(agent.type)
          return (
            <Card key={agent.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription className="text-xs">
                        Powered by {agent.model}
                      </CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={agent.status === "active"}
                    onCheckedChange={() => handleToggleAgent(agent.id)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={agent.status === "active" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    <div
                      className={`h-2 w-2 rounded-full mr-2 ${
                        agent.status === "active" ? "bg-green-500 animate-pulse" : "bg-gray-400"
                      }`}
                    />
                    {agent.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {agent.tasksCompleted} tasks today
                  </span>
                </div>

                {agent.currentTask && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {agent.currentTask}
                    </p>
                    <Progress value={agent.progress} className="h-2" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Success Rate</p>
                    <p className="text-sm font-medium">{agent.successRate || 0}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Time</p>
                    <p className="text-sm font-medium">{agent.avgResponseTime || '0s'}</p>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  <Settings className="mr-2 h-3 w-3" />
                  Configure
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Performance Metrics</CardTitle>
          <CardDescription>Task completion statistics by agent type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agentMetrics.map((metric) => (
              <div key={metric.agent} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Brain className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{metric.agent}</p>
                    <p className="text-xs text-muted-foreground">
                      {metric.tasks} tasks • {metric.success}% success • {metric.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={metric.success} className="w-24" />
                  <span className="text-sm font-medium">{metric.success}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}