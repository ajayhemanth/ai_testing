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
  Database,
  Target,
  Sparkles,
  FileCode,
  FolderOpen,
  ListChecks,
  BarChart3,
  PieChartIcon,
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
    totalRequirements: 0,
    totalTestCases: 0,
    totalDataGenerations: 0,
    passedTests: 0,
    failedTests: 0,
    pendingTests: 0,
    testPassRate: 0,
    automationRate: 0,
    requirementsCoverage: 0,
    projectMetrics: [],
    testExecutionTrend: [],
    complianceDistribution: [],
    requirementTypes: [],
    testPriorities: [],
    testCategories: [],
    testCasesByStatus: [],
    recentActivities: [],
    recentDataGenerations: [],
    recentDocuments: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/real-stats')
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

  const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#14b8a6']

  const chartConfig = {
    created: {
      label: "Created",
      color: "#6366f1",
    },
    passed: {
      label: "Passed",
      color: "#10b981",
    },
    failed: {
      label: "Failed",
      color: "#ef4444",
    },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Healthcare Testing Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Real-time insights from your testing workflow
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              Active healthcare software projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requirements</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequirements}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              {stats.requirementsCoverage}% have test cases
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Cases</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTestCases}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Zap className="h-3 w-3 mr-1 text-yellow-500" />
              {stats.automationRate}% automated
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Pass Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.testPassRate}%</div>
            <Progress value={stats.testPassRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Test Status Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-green-200 dark:border-green-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">
              Passed Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.passedTests}</div>
            <Progress value={(stats.passedTests / Math.max(stats.totalTestCases, 1)) * 100} className="mt-2 bg-green-100" />
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">
              Failed Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedTests}</div>
            <Progress value={(stats.failedTests / Math.max(stats.totalTestCases, 1)) * 100} className="mt-2 bg-red-100" />
          </CardContent>
        </Card>

        <Card className="border-yellow-200 dark:border-yellow-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              Pending Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingTests}</div>
            <Progress value={(stats.pendingTests / Math.max(stats.totalTestCases, 1)) * 100} className="mt-2 bg-yellow-100" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Test Activity Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Test Activity (Last 7 Days)</CardTitle>
            <CardDescription>Test case creation and status changes</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.testExecutionTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="created"
                    stackId="1"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.6}
                  />
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
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Requirements by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Requirements Distribution</CardTitle>
            <CardDescription>Breakdown by requirement type</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.requirementTypes.length > 0 ? (
              <ChartContainer config={{}} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.requirementTypes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <p className="text-sm">No requirements data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Test Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Test Cases by Priority</CardTitle>
            <CardDescription>Priority distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.testPriorities.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.testPriorities}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ priority, percent }) => `${priority} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.testPriorities.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p className="text-sm">No test priority data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Test Categories</CardTitle>
            <CardDescription>Distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.testCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.testCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.testCategories.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p className="text-sm">No category data</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compliance Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Coverage</CardTitle>
            <CardDescription>Requirements by compliance standard</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.complianceDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.complianceDistribution.slice(0, 6)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.complianceDistribution.slice(0, 6).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p className="text-sm">No compliance data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Project Metrics</CardTitle>
          <CardDescription>Requirements and test cases per project</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.projectMetrics.length > 0 ? (
            <ChartContainer config={{}} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.projectMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="requirements" fill="#8b5cf6" name="Requirements" />
                  <Bar dataKey="testCases" fill="#10b981" name="Test Cases" />
                  <Bar dataKey="dataGenerations" fill="#f59e0b" name="Synthetic Data" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <p className="text-sm">No project data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Feeds */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest actions in your projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {stats.recentActivities.length > 0 ? (
                stats.recentActivities.map((activity: any) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div
                      className={`h-2 w-2 rounded-full mt-1.5 ${
                        activity.type === 'requirements_generated'
                          ? 'bg-green-500'
                          : activity.type === 'document_uploaded'
                          ? 'bg-blue-500'
                          : activity.type === 'test_created'
                          ? 'bg-purple-500'
                          : 'bg-gray-500'
                      }`}
                    />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.project} • {activity.time}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activities</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Synthetic Data Generations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Data Generations</CardTitle>
            <CardDescription>Synthetic test data created</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {stats.recentDataGenerations.length > 0 ? (
                stats.recentDataGenerations.map((gen: any) => (
                  <div key={gen.id} className="flex items-start space-x-3">
                    <Database className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">
                        {gen.recordCount} {gen.dataType.replace(/_/g, ' ')} records
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {gen.projectName} • {gen.outputFormat.toUpperCase()} • {gen.createdAt}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No data generations yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Uploads */}
      {stats.recentDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Document Uploads</CardTitle>
            <CardDescription>Documents processed for requirements generation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentDocuments.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{doc.description}</p>
                      <p className="text-xs text-muted-foreground">{doc.project}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{doc.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Generation Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Synthetic Data Summary</CardTitle>
          <CardDescription>Overview of generated test data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalDataGenerations}</div>
              <p className="text-xs text-muted-foreground">Total Generations</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {stats.recentDataGenerations.reduce((sum: number, gen: any) => sum + gen.recordCount, 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Total Records</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {new Set(stats.recentDataGenerations.map((g: any) => g.projectName)).size}
              </div>
              <p className="text-xs text-muted-foreground">Projects with Data</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {new Set(stats.recentDataGenerations.map((g: any) => g.outputFormat)).size}
              </div>
              <p className="text-xs text-muted-foreground">Format Types</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}