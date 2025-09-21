"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  Plus,
  Play,
  Edit,
  Trash,
  TestTube,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  PlayCircle,
} from "lucide-react"
import { toast } from "sonner"

export default function ProjectTestCasesPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [testCases, setTestCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newTestCase, setNewTestCase] = useState({
    name: "",
    description: "",
    type: "functional",
    priority: "medium",
    expectedResult: "",
    steps: "",
  })

  useEffect(() => {
    const projectId = params.id

    // Fetch project details
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        const foundProject = data.find((p: any) => p.id === projectId)
        setProject(foundProject)
      })
      .catch(err => console.error('Failed to fetch project:', err))

    // Fetch test cases for this project
    fetch('/api/test-cases')
      .then(res => res.json())
      .then(data => {
        const testCasesArray = Array.isArray(data) ? data : (data.testCases || [])
        const projectTests = testCasesArray.filter((tc: any) => tc.projectId === projectId)
        setTestCases(projectTests)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch test cases:', err)
        setLoading(false)
      })
  }, [params.id])

  const handleCreateTestCase = async () => {
    try {
      const response = await fetch('/api/test-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTestCase,
          projectId: params.id,
          status: 'pending',
        }),
      })

      if (!response.ok) throw new Error('Failed to create test case')

      const created = await response.json()
      setTestCases([...testCases, created])

      toast.success('Test case created successfully')

      // Reset form
      setNewTestCase({
        name: "",
        description: "",
        type: "functional",
        priority: "medium",
        expectedResult: "",
        steps: "",
      })
      setIsCreateOpen(false)

      // Log activity
      fetch(`/api/projects/${params.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'test_created',
          description: `New test case "${newTestCase.name}" was created`,
        }),
      })
    } catch (error) {
      toast.error('Failed to create test case')
    }
  }

  const handleRunTest = async (testCase: any) => {
    toast.success(`Running test: ${testCase.name}`, {
      description: "AI agent is executing the test case",
    })

    // Log activity
    fetch(`/api/projects/${params.id}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'test_executed',
        description: `Test case "${testCase.name}" was executed`,
      }),
    })
  }

  const handleRunAllTests = () => {
    toast.success("Running all test cases", {
      description: `Executing ${testCases.length} test cases with AI agents`,
    })

    // Log activity
    fetch(`/api/projects/${params.id}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'test_executed',
        description: `All ${testCases.length} test cases were executed`,
      }),
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'running':
        return <PlayCircle className="h-4 w-4 text-blue-600 animate-pulse" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'functional': return 'default'
      case 'regression': return 'secondary'
      case 'smoke': return 'outline'
      case 'integration': return 'default'
      case 'performance': return 'secondary'
      case 'security': return 'destructive'
      default: return 'outline'
    }
  }

  const filteredTestCases = testCases.filter(tc =>
    tc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tc.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/projects/${params.id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Test Cases</h1>
            <p className="text-muted-foreground">
              {project?.name} - Test Case Management
            </p>
          </div>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={handleRunAllTests}>
            <Play className="mr-2 h-4 w-4" />
            Run All Tests
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Test Case
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tests</CardDescription>
            <CardTitle className="text-2xl">{testCases.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Passed</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {testCases.filter(tc => tc.status === 'passed').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Failed</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {testCases.filter(tc => tc.status === 'failed').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">
              {testCases.filter(tc => tc.status === 'pending').length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search test cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="outline">
          {filteredTestCases.length} Test Cases
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Cases</CardTitle>
          <CardDescription>
            Manage and execute test cases for this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTestCases.length > 0 ? (
                filteredTestCases.map((testCase) => (
                  <TableRow key={testCase.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{testCase.name}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">
                          {testCase.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTypeColor(testCase.type || 'functional')}>
                        {testCase.type || 'functional'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(testCase.priority || 'medium')}>
                        {testCase.priority || 'medium'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(testCase.status)}
                        <span className="text-sm">{testCase.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {testCase.lastRun ? new Date(testCase.lastRun).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      {testCase.duration || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRunTest(testCase)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    <TestTube className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No test cases defined yet</p>
                    <Button
                      className="mt-2"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCreateOpen(true)}
                    >
                      Create First Test Case
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Test Case Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Test Case</DialogTitle>
            <DialogDescription>
              Define a new test case for this project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Test Name</Label>
              <Input
                id="name"
                value={newTestCase.name}
                onChange={(e) => setNewTestCase({ ...newTestCase, name: e.target.value })}
                placeholder="Enter test case name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTestCase.description}
                onChange={(e) => setNewTestCase({ ...newTestCase, description: e.target.value })}
                placeholder="Describe what this test validates"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Test Type</Label>
                <Select
                  value={newTestCase.type}
                  onValueChange={(value) => setNewTestCase({ ...newTestCase, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="functional">Functional</SelectItem>
                    <SelectItem value="regression">Regression</SelectItem>
                    <SelectItem value="smoke">Smoke</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newTestCase.priority}
                  onValueChange={(value) => setNewTestCase({ ...newTestCase, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="steps">Test Steps</Label>
              <Textarea
                id="steps"
                value={newTestCase.steps}
                onChange={(e) => setNewTestCase({ ...newTestCase, steps: e.target.value })}
                placeholder="List the steps to execute this test"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedResult">Expected Result</Label>
              <Textarea
                id="expectedResult"
                value={newTestCase.expectedResult}
                onChange={(e) => setNewTestCase({ ...newTestCase, expectedResult: e.target.value })}
                placeholder="What is the expected outcome?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTestCase}>
              Create Test Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}