"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Download,
  TrendingUp,
  Brain,
  Target,
  Globe,
  Flag,
  AlertCircle,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { COMPLIANCE_STANDARDS } from "@/lib/constants"
import { toast } from "sonner"

const complianceOverview = {
  USA: [
    { standard: "FDA 21 CFR Part 11", coverage: 92, tests: 450, gaps: 12 },
    { standard: "HIPAA", coverage: 88, tests: 380, gaps: 23 },
    { standard: "SOX", coverage: 78, tests: 290, gaps: 34 },
  ],
  EU: [
    { standard: "MDR 2017/745", coverage: 85, tests: 420, gaps: 28 },
    { standard: "IVDR 2017/746", coverage: 82, tests: 360, gaps: 31 },
    { standard: "GDPR", coverage: 94, tests: 310, gaps: 8 },
  ],
  INDIA: [
    { standard: "CDSCO", coverage: 76, tests: 280, gaps: 42 },
    { standard: "ICMR Guidelines", coverage: 71, tests: 220, gaps: 48 },
  ],
  GLOBAL: [
    { standard: "ISO 13485:2016", coverage: 91, tests: 480, gaps: 15 },
    { standard: "ISO 14971:2019", coverage: 89, tests: 340, gaps: 18 },
    { standard: "IEC 62304:2006", coverage: 93, tests: 520, gaps: 11 },
    { standard: "ISO 9001:2015", coverage: 87, tests: 290, gaps: 21 },
    { standard: "ISO 27001:2022", coverage: 85, tests: 310, gaps: 24 },
  ],
}

const subdivisionCompliance = [
  { subdivision: "User Access Control", compliance: 95, standard: "HIPAA" },
  { subdivision: "Audit Trails", compliance: 88, standard: "FDA 21 CFR" },
  { subdivision: "Data Encryption", compliance: 92, standard: "GDPR" },
  { subdivision: "Risk Management", compliance: 86, standard: "ISO 14971" },
  { subdivision: "Software Validation", compliance: 90, standard: "IEC 62304" },
  { subdivision: "Quality Management", compliance: 84, standard: "ISO 13485" },
]

const complianceTimeline = [
  { month: "Jan", compliance: 72 },
  { month: "Feb", compliance: 75 },
  { month: "Mar", compliance: 78 },
  { month: "Apr", compliance: 82 },
  { month: "May", compliance: 85 },
  { month: "Jun", compliance: 87 },
]

export default function CompliancePage() {
  const [complianceData, setComplianceData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/compliance')
      .then(res => res.json())
      .then(data => {
        setComplianceData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch compliance data:', err)
        setLoading(false)
      })
  }, [])
  const [selectedRegion, setSelectedRegion] = useState("ALL")
  const [selectedStandard, setSelectedStandard] = useState("")

  const handleRunComplianceCheck = () => {
    toast.success("Compliance check initiated", {
      description: "AI agents are analyzing your test coverage against standards...",
    })
  }

  const handleGenerateComplianceReport = () => {
    toast.success("Report generation started", {
      description: "Comprehensive compliance report will be ready in 2 minutes",
    })
  }

  const getComplianceColor = (coverage: number) => {
    if (coverage >= 90) return "text-green-600"
    if (coverage >= 75) return "text-yellow-600"
    return "text-red-600"
  }

  const getComplianceStatus = (coverage: number) => {
    if (coverage >= 90) return { icon: CheckCircle2, color: "text-green-600", label: "Compliant" }
    if (coverage >= 75) return { icon: AlertTriangle, color: "text-yellow-600", label: "Partial" }
    return { icon: XCircle, color: "text-red-600", label: "Non-Compliant" }
  }

  const pieData = Object.entries(complianceOverview).flatMap(([region, standards]) =>
    standards.map(s => ({ name: s.standard, value: s.tests }))
  ).slice(0, 6)

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Compliance Management</h1>
          <p className="text-muted-foreground mt-2">
            Multi-region compliance tracking and validation
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleGenerateComplianceReport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button onClick={handleRunComplianceCheck}>
            <Sparkles className="mr-2 h-4 w-4" />
            Run Compliance Check
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.3%</div>
            <Progress value={87.3} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
              +5.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Standards Covered</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">13 / 15</div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="outline" className="text-xs">FDA</Badge>
              <Badge variant="outline" className="text-xs">ISO</Badge>
              <Badge variant="outline" className="text-xs">IEC</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Gaps</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">342</div>
            <p className="text-xs text-muted-foreground mt-2">
              Across all standards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Suggestions</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground mt-2">
              Test cases to improve
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Compliance by Region</CardTitle>
            <CardDescription>Coverage across different regulatory regions</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">All</TabsTrigger>
                <TabsTrigger value="usa">USA</TabsTrigger>
                <TabsTrigger value="eu">EU</TabsTrigger>
                <TabsTrigger value="india">India</TabsTrigger>
                <TabsTrigger value="global">Global</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-4">
                <div className="space-y-3">
                  {Object.entries(complianceOverview).map(([region, standards]) => (
                    <div key={region} className="space-y-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <Flag className="h-4 w-4" />
                        <span className="font-medium">{region}</span>
                      </div>
                      {standards.slice(0, 2).map((std) => {
                        const status = getComplianceStatus(std.coverage)
                        const Icon = status.icon
                        return (
                          <div key={std.standard} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Icon className={`h-5 w-5 ${status.color}`} />
                              <div>
                                <p className="text-sm font-medium">{std.standard}</p>
                                <p className="text-xs text-muted-foreground">
                                  {std.tests} test cases • {std.gaps} gaps
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-lg font-bold ${getComplianceColor(std.coverage)}`}>
                                {std.coverage}%
                              </p>
                              <Badge variant={std.coverage >= 90 ? "default" : "secondary"} className="text-xs">
                                {status.label}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subdivision Compliance</CardTitle>
            <CardDescription>Detailed compliance by standard subdivisions</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                compliance: {
                  label: "Compliance",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[350px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={subdivisionCompliance}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subdivision" className="text-xs" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar
                    name="Compliance"
                    dataKey="compliance"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Distribution by Standard</CardTitle>
          <CardDescription>Visual breakdown of test cases across compliance standards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer
              config={{
                value: {
                  label: "Test Cases",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>

            <ChartContainer
              config={{
                compliance: {
                  label: "Compliance %",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complianceTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="compliance" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Compliance Recommendations</CardTitle>
          <CardDescription>Intelligent suggestions to improve compliance coverage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
              <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Add Data Retention Tests</p>
                <p className="text-xs text-muted-foreground mt-1">
                  GDPR Article 5(1)(e) requires specific data retention testing. Create 12 new test cases.
                </p>
              </div>
              <Button size="sm" variant="outline">
                Generate Tests
              </Button>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Update Electronic Signature Tests</p>
                <p className="text-xs text-muted-foreground mt-1">
                  FDA 21 CFR Part 11.50 requirements have gaps in signature validation tests.
                </p>
              </div>
              <Button size="sm" variant="outline">
                Review Gaps
              </Button>
            </div>
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Risk Management Documentation</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ISO 14971 compliance can be improved by adding 8 risk analysis test scenarios.
                </p>
              </div>
              <Button size="sm" variant="outline">
                Add Scenarios
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}