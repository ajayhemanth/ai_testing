"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  Play,
  Plus,
  Sparkles,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Zap,
  Shield,
  GitBranch,
  Target,
  Brain,
  RefreshCw,
  Copy,
  Edit,
  Trash,
  Download,
  ChevronRight,
  Lightbulb,
  Wand2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function TestCasesPage() {
  const [testCases, setTestCases] = useState<any[]>([])
  const [stats, setStats] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    pending: 0,
    automated: 0,
    manual: 0,
  })
  const [loading, setLoading] = useState(true)
  const [selectedCase, setSelectedCase] = useState<any>(null)
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedProject, setSelectedProject] = useState("all")
  const [projects, setProjects] = useState<any[]>([])

  useEffect(() => {
    // Fetch test cases
    fetch('/api/test-cases')
      .then(res => res.json())
      .then(data => {
        setTestCases(data.testCases || [])
        setStats(data.stats || {
          total: 0,
          passed: 0,
          failed: 0,
          pending: 0,
          automated: 0,
          manual: 0,
        })
        if (data.testCases && data.testCases.length > 0) {
          setSelectedCase(data.testCases[0])
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch test cases:', err)
        setLoading(false)
      })

    // Fetch projects for filter
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        setProjects(data.projects || [])
      })
      .catch(err => {
        console.error('Failed to fetch projects:', err)
      })
  }, [])

  const [isExecuting, setIsExecuting] = useState(false)
  const [executionProgress, setExecutionProgress] = useState(0)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingTestCase, setEditingTestCase] = useState<any>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<any>(null)
  const [complianceCheckResult, setComplianceCheckResult] = useState<any>(null)
  const [showComplianceSuggestions, setShowComplianceSuggestions] = useState(false)
  const [selectedTestCase, setSelectedTestCase] = useState<any>(null)

  const getFilteredTestCases = (tab: string = "all") => {
    return testCases.filter(tc => {
      // Search filter
      const matchesSearch = searchQuery === "" ||
        tc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tc.id?.toLowerCase().includes(searchQuery.toLowerCase())

      // Tab filter
      let matchesTab = true
      if (tab === "automated") {
        matchesTab = tc.automationStatus?.toLowerCase() === "automated"
      } else if (tab === "manual") {
        matchesTab = tc.automationStatus?.toLowerCase() === "manual" || !tc.automationStatus
      } else if (tab === "failed") {
        matchesTab = tc.status?.toLowerCase() === "failed"
      }

      // Priority filter
      const matchesPriority = selectedPriority === "all" || tc.priority === selectedPriority

      // Status filter
      const matchesStatus = selectedStatus === "all" || tc.status === selectedStatus

      // Category filter
      const matchesCategory = selectedCategory === "all" || tc.category === selectedCategory

      // Project filter
      const matchesProject = selectedProject === "all" || tc.projectId === selectedProject

      return matchesSearch && matchesTab && matchesPriority && matchesStatus && matchesCategory && matchesProject
    })
  }

  const handleExport = () => {
    const filteredData = getFilteredTestCases(activeTab)

    const csv = [
      ['ID', 'Title', 'Description', 'Category', 'Priority', 'Status', 'Automation Status', 'Project', 'Requirement'].join(','),
      ...filteredData.map(tc => [
        tc.id,
        `"${tc.title || ''}".replace(/"/g, '""')`,
        `"${tc.description || ''}".replace(/"/g, '""')`,
        tc.category || '',
        tc.priority || '',
        tc.status || '',
        tc.automationStatus || '',
        tc.projectName || '',
        tc.requirementTitle || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `test-cases-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast.success('Test cases exported successfully')
  }

  const handleResetFilters = () => {
    setSearchQuery("")
    setSelectedPriority("all")
    setSelectedStatus("all")
    setSelectedCategory("all")
    setSelectedProject("all")
    setIsFilterOpen(false)
  }

  const mockTestCases = [
  {
    id: "TC-001",
    title: "Verify user login with valid credentials",
    description: "Test that users can successfully log in with valid username and password",
    requirementId: "REQ-001",
    priority: "High",
    status: "Passed",
    category: "Authentication",
    automationStatus: "Automated",
    lastExecuted: "2 hours ago",
    compliance: ["HIPAA", "ISO 27001"],
    steps: [
      "Navigate to login page",
      "Enter valid username",
      "Enter valid password",
      "Click login button",
    ],
    expectedResult: "User successfully logged in and redirected to dashboard",
    actualResult: "As expected",
    aiGenerated: true,
  },
  {
    id: "TC-002",
    title: "Validate patient data encryption at rest",
    description: "Ensure all patient data is encrypted using AES-256",
    requirementId: "REQ-002",
    priority: "Critical",
    status: "Failed",
    category: "Security",
    automationStatus: "Manual",
    lastExecuted: "1 day ago",
    compliance: ["HIPAA", "GDPR"],
    steps: [
      "Access database directly",
      "Query patient records table",
      "Verify encryption algorithm",
      "Check encryption key strength",
    ],
    expectedResult: "All patient data encrypted with AES-256",
    actualResult: "Some fields not encrypted",
    aiGenerated: false,
  },
  {
    id: "TC-003",
    title: "Performance test for vital signs monitoring",
    description: "Verify real-time monitoring latency is under 100ms",
    requirementId: "REQ-003",
    priority: "High",
    status: "In Progress",
    category: "Performance",
    automationStatus: "Automated",
    lastExecuted: "Running",
    compliance: ["IEC 62304", "FDA 21 CFR"],
    steps: [
      "Connect monitoring device",
      "Start data stream",
      "Measure latency",
      "Record results",
    ],
    expectedResult: "Latency < 100ms for 95% of readings",
    actualResult: "Pending",
    aiGenerated: true,
  },
]

  const handleGenerateTestCases = () => {
    setIsGenerateOpen(false)
    toast.success("AI Test Generation Started", {
      description: "Vertex AI is creating comprehensive test cases...",
    })

    setTimeout(() => {
      toast.success("15 new test cases generated", {
        description: "AI has created test cases with full compliance mapping",
      })
    }, 3000)
  }

  const handleExecuteTests = () => {
    setIsExecuting(true)
    setExecutionProgress(0)

    const interval = setInterval(() => {
      setExecutionProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsExecuting(false)
          toast.success("Test execution completed", {
            description: "23 passed, 2 failed, 1 skipped",
          })
          return 100
        }
        return prev + 10
      })
    }, 500)
  }

  const handleEditTestCase = (testCase: any) => {
    setEditingTestCase(testCase)
    setEditForm({
      title: testCase.title || '',
      description: testCase.description || '',
      testSteps: testCase.testSteps || testCase.steps?.join('\n') || '',
      expectedResult: testCase.expectedResult || testCase.expectedResults || '',
      actualResult: testCase.actualResult || testCase.actualResults || '',
      priority: testCase.priority?.toLowerCase() || 'medium',
      category: testCase.category?.toLowerCase() || 'functional',
      status: testCase.status || 'pending',
      compliance: testCase.complianceTags ? testCase.complianceTags.split(',').map((t: string) => t.trim()).filter(Boolean) : testCase.compliance || [],
    })
    setAiSuggestions(null)
    setIsEditOpen(true)
  }

  const handleGetAISuggestions = async () => {
    if (!editingTestCase) return

    setLoadingSuggestions(true)
    try {
      const response = await fetch(`/api/test-cases/${editingTestCase.id}/suggest-improvements`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setAiSuggestions(data.suggestions)

        // Auto-apply compliance suggestions
        if (data.suggestions.suggestedComplianceTags) {
          setEditForm({
            ...editForm,
            compliance: data.suggestions.suggestedComplianceTags
          })
        }

        toast.success('AI analysis complete! Compliance standards updated based on test case content.')
      } else {
        toast.error('Failed to get AI suggestions')
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error)
      toast.error('Failed to analyze test case')
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const handleApplyAllSuggestions = () => {
    if (!aiSuggestions) return

    setEditForm({
      title: aiSuggestions.improvedTitle || editForm.title,
      description: aiSuggestions.improvedDescription || editForm.description,
      testSteps: aiSuggestions.improvedSteps ? aiSuggestions.improvedSteps.join('\n') : editForm.testSteps,
      expectedResult: aiSuggestions.improvedExpectedResults || editForm.expectedResult,
      actualResult: editForm.actualResult,
      priority: aiSuggestions.suggestedPriority || editForm.priority,
      category: aiSuggestions.suggestedCategory || editForm.category,
      status: editForm.status,
      compliance: aiSuggestions.suggestedComplianceTags || editForm.compliance,
    })

    toast.success('All AI suggestions applied!')
  }

  const handleSaveTestCase = async () => {
    if (!editingTestCase) return

    try {
      const response = await fetch(`/api/test-cases/${editingTestCase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          testSteps: editForm.testSteps,
          expectedResults: editForm.expectedResult, // API expects expectedResults not expectedResult
          category: editForm.category,
          priority: editForm.priority,
          status: editForm.status,
          complianceTags: editForm.compliance?.join(', ') || '',
        }),
      })

      if (response.ok) {
        toast.success('Test case updated successfully')

        // Refresh test cases
        const refreshResponse = await fetch('/api/test-cases')
        const data = await refreshResponse.json()
        setTestCases(data.testCases || [])

        // Update selected test case if it's the one we edited
        if (selectedTestCase?.id === editingTestCase.id) {
          const updated = data.testCases.find((tc: any) => tc.id === editingTestCase.id)
          if (updated) setSelectedTestCase(updated)
        }

        handleCloseEdit()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update test case')
      }
    } catch (error) {
      console.error('Error saving test case:', error)
      toast.error('Failed to save test case')
    }
  }

  const handleCloseEdit = () => {
    setIsEditOpen(false)
    setEditingTestCase(null)
    setEditForm({})
    setAiSuggestions(null)
  }

  // Removed duplicate handleSaveTestCase - using the one defined above with actual API integration

  const handleApplySuggestions = () => {
    toast.success("Compliance suggestions applied", {
      description: "Test case updated with recommended improvements",
    })
    setShowComplianceSuggestions(false)
    setComplianceCheckResult(null)
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "in_progress":
      case "in progress":
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />
      case "skipped":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical": return "destructive"
      case "High": return "default"
      case "Medium": return "secondary"
      case "Low": return "outline"
      default: return "outline"
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Test Cases</h1>
          <p className="text-muted-foreground mt-2">
            AI-powered test case generation and management
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleExecuteTests} disabled={isExecuting}>
            {isExecuting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Execute All
              </>
            )}
          </Button>

          <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate with AI
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>AI Test Case Generation</DialogTitle>
                <DialogDescription>
                  Generate comprehensive test cases from requirements
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Select Requirements</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose requirements to generate tests for" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Requirements</SelectItem>
                      <SelectItem value="req-001">REQ-001: User Authentication</SelectItem>
                      <SelectItem value="req-002">REQ-002: Data Encryption</SelectItem>
                      <SelectItem value="req-003">REQ-003: Vital Signs Monitoring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Test Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select test type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="functional">Functional</SelectItem>
                        <SelectItem value="integration">Integration</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Coverage Level</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select coverage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic (Happy Path)</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="comprehensive">Comprehensive</SelectItem>
                        <SelectItem value="exhaustive">Exhaustive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Additional Context</Label>
                  <Textarea
                    placeholder="Provide any specific scenarios or edge cases to consider..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Generation Options</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="negative" defaultChecked />
                      <label htmlFor="negative" className="text-sm">Include negative test cases</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="edge" defaultChecked />
                      <label htmlFor="edge" className="text-sm">Include edge cases</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="compliance" defaultChecked />
                      <label htmlFor="compliance" className="text-sm">Map to compliance standards</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="synthetic" />
                      <label htmlFor="synthetic" className="text-sm">Generate synthetic test data</label>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-purple-50 dark:bg-purple-950 p-4">
                  <div className="flex items-start space-x-3">
                    <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                        AI-Powered Generation
                      </p>
                      <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                        Our multi-agent system will:
                      </p>
                      <ul className="text-sm text-purple-700 dark:text-purple-300 mt-2 space-y-1">
                        <li>• Analyze requirements and identify test scenarios</li>
                        <li>• Generate step-by-step test procedures</li>
                        <li>• Create expected results based on specifications</li>
                        <li>• Map tests to compliance requirements</li>
                        <li>• Suggest automation candidates</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGenerateTestCases}>
                  Generate Test Cases
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isExecuting && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Executing test suite...</span>
                <span>{executionProgress}%</span>
              </div>
              <Progress value={executionProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Test Case Library</CardTitle>
              <CardDescription>
                Manage and execute your test cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                  <TabsTrigger value="all">All Tests ({testCases.length})</TabsTrigger>
                  <TabsTrigger value="automated">Automated ({testCases.filter(tc => tc.automationStatus?.toLowerCase() === "automated").length})</TabsTrigger>
                  <TabsTrigger value="manual">Manual ({testCases.filter(tc => tc.automationStatus?.toLowerCase() === "manual" || !tc.automationStatus).length})</TabsTrigger>
                  <TabsTrigger value="failed">Failed ({testCases.filter(tc => tc.status?.toLowerCase() === "failed").length})</TabsTrigger>
                </TabsList>
                {['all', 'automated', 'manual', 'failed'].map(tab => (
                  <TabsContent key={tab} value={tab} className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Input
                        placeholder="Search test cases..."
                        className="max-w-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            Filter
                            {(selectedPriority !== "all" || selectedStatus !== "all" || selectedCategory !== "all" || selectedProject !== "all") && (
                              <Badge className="ml-2" variant="secondary">
                                {[selectedPriority, selectedStatus, selectedCategory, selectedProject].filter(f => f !== "all").length}
                              </Badge>
                            )}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Filter Test Cases</DialogTitle>
                            <DialogDescription>
                              Apply filters to narrow down test cases
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="priority">Priority</Label>
                              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                                <SelectTrigger id="priority">
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Priorities</SelectItem>
                                  <SelectItem value="critical">Critical</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="status">Status</Label>
                              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger id="status">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Statuses</SelectItem>
                                  <SelectItem value="passed">Passed</SelectItem>
                                  <SelectItem value="failed">Failed</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="skipped">Skipped</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="category">Category</Label>
                              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger id="category">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Categories</SelectItem>
                                  <SelectItem value="functional">Functional</SelectItem>
                                  <SelectItem value="security">Security</SelectItem>
                                  <SelectItem value="performance">Performance</SelectItem>
                                  <SelectItem value="compliance">Compliance</SelectItem>
                                  <SelectItem value="usability">Usability</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="project">Project</Label>
                              <Select value={selectedProject} onValueChange={setSelectedProject}>
                                <SelectTrigger id="project">
                                  <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All Projects</SelectItem>
                                  {projects.map((project) => (
                                    <SelectItem key={project.id} value={project.id}>
                                      {project.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={handleResetFilters}>
                              Reset
                            </Button>
                            <Button onClick={() => setIsFilterOpen(false)}>
                              Apply Filters
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">Status</TableHead>
                          <TableHead>Test Case ID</TableHead>
                          <TableHead className="min-w-[250px] max-w-[300px]">Test Case</TableHead>
                          <TableHead>Requirement ID</TableHead>
                          <TableHead>Project</TableHead>
                          <TableHead>Requirement</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Automation</TableHead>
                          <TableHead>Last Executed</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getFilteredTestCases(tab).map((testCase) => (
                        <TableRow
                          key={testCase.id}
                          className="cursor-pointer"
                          onClick={() => setSelectedTestCase(testCase)}
                        >
                          <TableCell>
                            {getStatusIcon(testCase.status)}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs">{testCase.id.slice(0, 8)}</code>
                          </TableCell>
                          <TableCell className="min-w-[250px] max-w-[300px]">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                {testCase.aiGenerated && (
                                  <Sparkles className="h-3 w-3 text-blue-600" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate" title={testCase.title}>
                                {testCase.title}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {testCase.requirementId ? (
                              <code className="text-xs">{testCase.requirementId.slice(0, 8)}</code>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {testCase.projectName || 'No Project'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium">
                              {testCase.requirementTitle || 'No Requirement'}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{testCase.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getPriorityColor(testCase.priority)}>
                              {testCase.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {testCase.automationStatus?.toLowerCase() === "automated" ? (
                              <div className="flex items-center text-green-600">
                                <Zap className="mr-1 h-3 w-3" />
                                <span className="text-sm">Automated</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Manual</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {testCase.lastExecuted}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  toast.info("Executing test case...")
                                }}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEditTestCase(testCase)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
              ))}
            </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-1">
          {selectedTestCase ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Test Case Details</CardTitle>
                    <CardDescription>{selectedTestCase.id}</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditTestCase(selectedTestCase)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Title</h4>
                  <p className="text-sm text-muted-foreground">{selectedTestCase.title}</p>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedTestCase.description}</p>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-2">Test Steps</h4>
                  <ol className="space-y-2">
                    {(selectedTestCase.testSteps ? selectedTestCase.testSteps.split('\n') : selectedTestCase.steps || []).map((step: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-sm font-medium">{index + 1}.</span>
                        <span className="text-sm text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-2">Expected Result</h4>
                  <p className="text-sm text-muted-foreground">{selectedTestCase.expectedResults || selectedTestCase.expectedResult || 'Not specified'}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Status</h4>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedTestCase.status)}
                    <span className="text-sm capitalize">{selectedTestCase.status || 'pending'}</span>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-2">Compliance Mapping</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedTestCase.complianceTags ? selectedTestCase.complianceTags.split(',').map((t: string) => t.trim()).filter(Boolean) : selectedTestCase.compliance || []).map((comp: string) => (
                      <Badge key={comp} variant="secondary">
                        <Shield className="mr-1 h-3 w-3" />
                        {comp}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2 pt-4">
                  <Button className="flex-1" size="sm">
                    <Play className="mr-2 h-4 w-4" />
                    Execute
                  </Button>
                  <Button variant="outline" className="flex-1" size="sm">
                    <Copy className="mr-2 h-4 w-4" />
                    Clone
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 mb-4" />
                  <p>Select a test case to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Test Case Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent
          className={cn(
            "w-[90vw] max-w-[1400px]",
            "h-[85vh] max-h-[85vh]",
            "sm:max-w-[90vw] sm:w-[90vw]",
            "md:max-w-[1400px] md:w-[90vw]",
            "overflow-y-auto"
          )}>
          <DialogHeader>
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle>Edit Test Case</DialogTitle>
                <DialogDescription>
                  Update test case details. Click "Analyze with AI" to get compliance suggestions.
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetAISuggestions}
                disabled={loadingSuggestions}
              >
                {loadingSuggestions ? (
                  <>Analyzing...</>
                ) : (
                  <><Lightbulb className="mr-2 h-4 w-4" />Analyze with AI</>
                )}
              </Button>
            </div>
          </DialogHeader>
          {editingTestCase && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Test Case ID</Label>
                  <Input value={editingTestCase.id} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="passed">Passed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="skipped">Skipped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={editForm.priority}
                    onValueChange={(value) => setEditForm({ ...editForm, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={editForm.category}
                    onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="functional">Functional</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="usability">Usability</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Test Steps</Label>
                <Textarea
                  value={editForm.testSteps}
                  onChange={(e) => setEditForm({ ...editForm, testSteps: e.target.value })}
                  rows={4}
                  placeholder="Enter test steps (one per line)"
                />
              </div>

              <div className="space-y-2">
                <Label>Expected Result</Label>
                <Textarea
                  value={editForm.expectedResult}
                  onChange={(e) => setEditForm({ ...editForm, expectedResult: e.target.value })}
                  rows={2}
                />
              </div>

              {aiSuggestions && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/10">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      AI Suggestions
                    </h4>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleApplyAllSuggestions}
                    >
                      <Wand2 className="mr-2 h-4 w-4" />
                      Apply All Suggestions
                    </Button>
                  </div>

                  {aiSuggestions.improvedTitle && aiSuggestions.improvedTitle !== editForm.title && (
                    <div className="space-y-1">
                      <Label className="text-xs">Suggested Title</Label>
                      <div className="p-2 bg-background rounded text-sm">{aiSuggestions.improvedTitle}</div>
                    </div>
                  )}

                  {aiSuggestions.improvedDescription && aiSuggestions.improvedDescription !== editForm.description && (
                    <div className="space-y-1">
                      <Label className="text-xs">Suggested Description</Label>
                      <div className="p-2 bg-background rounded text-sm">{aiSuggestions.improvedDescription}</div>
                    </div>
                  )}

                  {aiSuggestions.improvedSteps && aiSuggestions.improvedSteps.join('\n') !== editForm.testSteps && (
                    <div className="space-y-1">
                      <Label className="text-xs">Suggested Test Steps</Label>
                      <div className="p-2 bg-background rounded text-sm whitespace-pre-wrap">
                        {aiSuggestions.improvedSteps.join('\n')}
                      </div>
                    </div>
                  )}

                  {aiSuggestions.improvedExpectedResults && aiSuggestions.improvedExpectedResults !== editForm.expectedResult && (
                    <div className="space-y-1">
                      <Label className="text-xs">Suggested Expected Results</Label>
                      <div className="p-2 bg-background rounded text-sm">{aiSuggestions.improvedExpectedResults}</div>
                    </div>
                  )}

                  <div className="flex gap-4">
                    {aiSuggestions.suggestedPriority && aiSuggestions.suggestedPriority !== editForm.priority && (
                      <div className="space-y-1">
                        <Label className="text-xs">Suggested Priority</Label>
                        <Badge variant="outline">{aiSuggestions.suggestedPriority}</Badge>
                      </div>
                    )}

                    {aiSuggestions.suggestedCategory && aiSuggestions.suggestedCategory !== editForm.category && (
                      <div className="space-y-1">
                        <Label className="text-xs">Suggested Category</Label>
                        <Badge variant="outline">{aiSuggestions.suggestedCategory}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Compliance Standards (AI Determined)</Label>
                <p className="text-sm text-muted-foreground">
                  Click "Analyze with AI" to automatically determine applicable compliance standards
                </p>
                {!aiSuggestions ? (
                  <div className="rounded-lg border border-dashed p-4 text-center">
                    <Lightbulb className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No compliance analysis yet. Click "Analyze with AI" above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {editForm.compliance?.length > 0 ? (
                        editForm.compliance.map((standard: string) => (
                          <Badge
                            key={standard}
                            variant="default"
                            className="transition-all"
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            {standard}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">No compliance standards applicable</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <strong>AI Determined:</strong> Based on test content analysis
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      AI-Powered Compliance Detection
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Compliance standards are automatically determined by AI based on your test case content. No manual selection needed - the AI analyzes your test steps, expected results, and description to identify applicable regulations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveTestCase}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compliance Suggestions Dialog */}
      <Dialog open={showComplianceSuggestions} onOpenChange={setShowComplianceSuggestions}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Compliance Check Results</span>
              </div>
            </DialogTitle>
            <DialogDescription>
              AI has analyzed your test case for compliance requirements
            </DialogDescription>
          </DialogHeader>
          {complianceCheckResult && (
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-4">
                {complianceCheckResult.compliant ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="mr-2 h-5 w-5" />
                    <span className="font-medium">Fully Compliant</span>
                  </div>
                ) : (
                  <div className="flex items-center text-yellow-600">
                    <AlertCircle className="mr-2 h-5 w-5" />
                    <span className="font-medium">Compliance Gaps Detected</span>
                  </div>
                )}
                <div className="flex-1" />
                <div className="flex gap-2">
                  {complianceCheckResult.standards.map((standard: string) => (
                    <Badge key={standard} variant="outline">{standard}</Badge>
                  ))}
                </div>
              </div>

              {complianceCheckResult.gaps.length > 0 && (
                <div className="space-y-2">
                  <Label>Identified Gaps</Label>
                  <div className="rounded-lg border p-3 space-y-2 bg-yellow-50 dark:bg-yellow-950">
                    {complianceCheckResult.gaps.map((gap: string, index: number) => (
                      <div key={index} className="flex items-start space-x-2">
                        <XCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                        <p className="text-sm">{gap}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>AI Suggestions</Label>
                <div className="space-y-2">
                  {complianceCheckResult.suggestions.map((suggestion: any, index: number) => (
                    <div
                      key={index}
                      className={cn(
                        "rounded-lg border p-3 space-y-1",
                        suggestion.type === "critical" && "bg-red-50 dark:bg-red-950 border-red-200",
                        suggestion.type === "recommended" && "bg-yellow-50 dark:bg-yellow-950 border-yellow-200",
                        suggestion.type === "optional" && "bg-blue-50 dark:bg-blue-950 border-blue-200"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {suggestion.type === "critical" && <AlertCircle className="h-4 w-4 text-red-600" />}
                          {suggestion.type === "recommended" && <AlertCircle className="h-4 w-4 text-yellow-600" />}
                          {suggestion.type === "optional" && <AlertCircle className="h-4 w-4 text-blue-600" />}
                          <p className="text-sm font-medium">
                            {suggestion.type === "critical" && "Critical"}
                            {suggestion.type === "recommended" && "Recommended"}
                            {suggestion.type === "optional" && "Optional"}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {suggestion.standard}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{suggestion.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {complianceCheckResult.impactedTests.length > 0 && (
                <div className="space-y-2">
                  <Label>Related Test Cases</Label>
                  <div className="rounded-lg border p-3 bg-gray-50 dark:bg-gray-950">
                    <p className="text-sm text-muted-foreground mb-2">
                      These test cases may also need updates:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {complianceCheckResult.impactedTests.map((testId: string) => (
                        <Badge key={testId} variant="secondary">{testId}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowComplianceSuggestions(false)}>
              Ignore Suggestions
            </Button>
            <Button onClick={handleApplySuggestions}>
              <Sparkles className="mr-2 h-4 w-4" />
              Apply AI Suggestions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}