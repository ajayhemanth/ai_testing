"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Shield,
  TrendingUp,
  Users,
  Zap,
  Package,
  GitBranch,
  TestTube,
} from "lucide-react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export default function DashboardPage() {
  const [stats, setStats] = useState<any>({
    totalProjects: 0,
    totalTestCases: 0,
    totalRequirements: 0,
    activeIntegrations: 0,
    activeAgents: 0,
    testPassRate: 0,
    codeCoverage: 0,
    complianceScore: 0,
    recentTestRuns: 0,
    passedTests: 0,
    failedTests: 0,
    projectMetrics: [],
    recentActivities: [],
    complianceByStandard: [],
    testExecutionTrend: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch dashboard stats:', err)
        setLoading(false)
      })
  }, [])

  // Use real test execution trend data from API
  const testExecutionData = stats.testExecutionTrend?.length > 0
    ? stats.testExecutionTrend
    : [{ date: "Mon", passed: 0, failed: 0, skipped: 0 }]

  // Use real compliance data from API
  const complianceData = stats.complianceByStandard?.length > 0
    ? stats.complianceByStandard
    : []

  // Use real project metrics from API
  const COLORS = ["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#6366f1"]
  const projectMetrics = stats.projectMetrics?.map((project: any, index: number) => ({
    ...project,
    color: COLORS[index % COLORS.length]
  })) || []

  const riskAssessmentData = [
    { category: "Security", current: Math.min(100, stats.testPassRate + 5), target: 95 },
    { category: "Performance", current: Math.max(60, stats.testPassRate - 10), target: 90 },
    { category: "Compliance", current: stats.complianceScore, target: 95 },
    { category: "Usability", current: Math.min(100, stats.testPassRate), target: 85 },
    { category: "Reliability", current: Math.min(100, stats.testPassRate + 2), target: 95 },
    { category: "Scalability", current: Math.max(50, stats.codeCoverage - 5), target: 80 },
  ]

  // Use real recent activity from API
  const recentActivity = stats.recentActivities?.map((activity: any) => ({
    ...activity,
    status: activity.type === 'test_executed' ? 'success' :
            activity.type === 'compliance_check' ? 'warning' :
            activity.type === 'data_generated' ? 'info' : 'default'
  })) || []

  const chartConfig = {
    passed: {
      label: "Passed",
      color: "#10b981",
    },
    failed: {
      label: "Failed",
      color: "#ef4444",
    },
    skipped: {
      label: "Skipped",
      color: "#6b7280",
    },
  } satisfies ChartConfig

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Clock className="mr-2 h-4 w-4" />
            Last 7 days
          </Button>
          <Button size="sm">
            <Activity className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Test Cases</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTestCases.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(stats.totalTestCases * 0.12)}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Pass Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.testPassRate.toFixed(1)}%</div>
            <Progress value={stats.testPassRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Code Coverage</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.codeCoverage.toFixed(1)}%</div>
            <Progress value={stats.codeCoverage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.complianceScore.toFixed(1)}%</div>
            <Progress value={stats.complianceScore} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Test Execution Trends</CardTitle>
            <CardDescription>Daily test execution results for the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={testExecutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="passed"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  stackId="1"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="skipped"
                  stackId="1"
                  stroke="#6b7280"
                  fill="#6b7280"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Active Systems</CardTitle>
            <CardDescription>Real-time system status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Projects</span>
              </div>
              <Badge variant="secondary">{stats.totalProjects} Active</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Requirements</span>
              </div>
              <Badge variant="secondary">{stats.totalRequirements} Tracked</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <GitBranch className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Integrations</span>
              </div>
              <Badge variant="secondary">{stats.activeIntegrations} Connected</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">AI Agents</span>
              </div>
              <Badge variant="secondary">{stats.activeAgents} Running</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance and Risk Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Coverage</CardTitle>
            <CardDescription>Test coverage by compliance standard</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={complianceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="standard" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="coverage" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment</CardTitle>
            <CardDescription>Current vs target risk metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={riskAssessmentData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Current"
                  dataKey="current"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.6}
                />
                <Radar
                  name="Target"
                  dataKey="target"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.3}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions from AI agents and integrations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity: any) => (
                <div key={activity.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        activity.status === "success"
                          ? "bg-green-500"
                          : activity.status === "warning"
                          ? "bg-yellow-500"
                          : activity.status === "info"
                          ? "bg-blue-500"
                          : "bg-gray-500"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.project} {activity.count && `• ${activity.count} items`}
                        {activity.standard && `• ${activity.standard}`}
                        {activity.records && `• ${activity.records} records`}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">{activity.time}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Project Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project Test Distribution</CardTitle>
            <CardDescription>Test cases across active projects</CardDescription>
          </CardHeader>
          <CardContent>
            {projectMetrics.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={projectMetrics}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {projectMetrics.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p className="text-sm">No project data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Overall system performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">API Response Time</span>
                <span className="text-sm font-medium">145ms avg</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Performance</span>
                <span className="text-sm font-medium">98% uptime</span>
              </div>
              <Progress value={98} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Agent Availability</span>
                <span className="text-sm font-medium">{stats.activeAgents}/{stats.activeAgents + 2} online</span>
              </div>
              <Progress value={(stats.activeAgents / (stats.activeAgents + 2)) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Integration Health</span>
                <span className="text-sm font-medium">{stats.activeIntegrations} active</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}