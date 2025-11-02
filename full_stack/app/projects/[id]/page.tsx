"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { SOFTWARE_TYPES, COMPLIANCE_STANDARDS } from "@/lib/constants"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  FileText,
  TestTube,
  Shield,
  Activity,
  Calendar,
  Users,
  Play,
  Pause,
  Edit,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react"
import { toast } from "sonner"

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [testCases, setTestCases] = useState<any[]>([])
  const [requirements, setRequirements] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [complianceChecks, setComplianceChecks] = useState<any[]>([])
  const [complianceStandards, setComplianceStandards] = useState<any[]>([])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [editedProject, setEditedProject] = useState<any>({})
  const [projectSettings, setProjectSettings] = useState({
    autoRunTests: false,
    emailNotifications: true,
    aiSuggestions: true,
    requireApproval: false,
  })

  useEffect(() => {
    const projectId = params.id

    // Fetch project details
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        const foundProject = data.find((p: any) => p.id === projectId)
        if (foundProject) {
          setProject({
            ...foundProject,
            progress: Math.round((foundProject.stats.passedTests / Math.max(foundProject.stats.totalTests, 1)) * 100),
          })
          setEditedProject(foundProject) // Initialize edit form
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch project:', err)
        setLoading(false)
      })

    // Fetch test cases for this project
    fetch('/api/test-cases')
      .then(res => res.json())
      .then(data => {
        // Handle both array and object with testCases property
        const testCasesArray = Array.isArray(data) ? data : (data.testCases || [])
        const projectTests = testCasesArray.filter((tc: any) => tc.projectId === projectId)
        setTestCases(projectTests)
      })
      .catch(err => console.error('Failed to fetch test cases:', err))

    // Fetch activities for this project
    fetch(`/api/projects/${projectId}/activities`)
      .then(res => res.json())
      .then(data => {
        setActivities(data || [])
      })
      .catch(err => console.error('Failed to fetch activities:', err))

    // Fetch requirements for this project
    fetch('/api/requirements')
      .then(res => res.json())
      .then(data => {
        const allRequirements = data.requirements || data || []
        const projectRequirements = allRequirements.filter((req: any) => req.projectId === projectId)
        setRequirements(projectRequirements)
      })
      .catch(err => console.error('Failed to fetch requirements:', err))

    // Fetch compliance standards
    fetch('/api/compliance-standards')
      .then(res => res.json())
      .then(data => {
        setComplianceStandards(data)
      })
      .catch(err => console.error('Failed to fetch compliance standards:', err))

    // Fetch compliance checks for this project
    fetch('/api/compliance-checks')
      .then(res => res.json())
      .then(data => {
        const projectChecks = data.filter((check: any) => check.projectId === projectId)
        setComplianceChecks(projectChecks)
      })
      .catch(err => console.error('Failed to fetch compliance checks:', err))
  }, [params.id])

  const handleRunTests = () => {
    toast.success("Test execution started", {
      description: "AI agents are running your test suite",
    })
  }

  const handleEditProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editedProject.name,
          description: editedProject.description,
          softwareType: editedProject.softwareType,
          targetCompliances: editedProject.targetCompliances,
          country: editedProject.country,
          status: editedProject.status,
        }),
      })

      if (!response.ok) throw new Error('Failed to update project')

      const updated = await response.json()
      setProject({ ...project, ...updated })
      setEditDialogOpen(false)
      toast.success('Project updated successfully')
    } catch (error) {
      toast.error('Failed to update project')
    }
  }

  const handleSaveSettings = () => {
    // In a real app, you'd save these settings to the backend
    localStorage.setItem(`project-settings-${params.id}`, JSON.stringify(projectSettings))
    setSettingsDialogOpen(false)
    toast.success('Settings saved successfully')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

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

  if (!project) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Project not found</h2>
          <Button
            className="mt-4"
            onClick={() => router.push('/projects')}
          >
            Back to Projects
          </Button>
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
            onClick={() => router.push('/projects')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Project
          </Button>
          {/* <Button variant="outline" onClick={() => setSettingsDialogOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button> */}
          {/* <Button onClick={handleRunTests}>
            <Play className="mr-2 h-4 w-4" />
            Run Tests
          </Button> */}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Test Cases</CardDescription>
            <CardTitle className="text-2xl">{project.stats?.totalTests || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>{project.stats?.passedTests || 0} passed</span>
              <XCircle className="h-4 w-4 text-red-600" />
              <span>{project.stats?.failedTests || 0} failed</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Requirements</CardDescription>
            <CardTitle className="text-2xl">{project.stats?.totalRequirements || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={project.progress || 0} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {project.progress || 0}% complete
            </p>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader className="pb-2">
            <CardDescription>Compliance Score</CardDescription>
            <CardTitle className="text-2xl">{project.stats?.compliance || 0}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{project.targetCompliances}</Badge>
          </CardContent>
        </Card> */}

        {/* <Card>
          <CardHeader className="pb-2">
            <CardDescription>Code Coverage</CardDescription>
            <CardTitle className="text-2xl">{project.stats?.coverage || 0}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={project.stats?.coverage || 0} className="h-2" />
          </CardContent>
        </Card> */}
      </div>

      <Tabs defaultValue="test-cases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="test-cases">Test Cases</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="test-cases" className="space-y-4">
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
                    <TableHead>Test Case</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testCases.length > 0 ? (
                    testCases.map((testCase) => (
                      <TableRow key={testCase.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-medium">{testCase.title}</p>
                            {testCase.description && (
                              <p className="text-xs text-muted-foreground mt-1">{testCase.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{testCase.category || 'General'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            testCase.priority === 'critical' ? 'destructive' :
                            testCase.priority === 'high' ? 'destructive' :
                            'secondary'
                          }>
                            {testCase.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(testCase.status)}
                            <span className="text-sm">{testCase.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {testCase.lastExecutedAt ? new Date(testCase.lastExecutedAt).toLocaleDateString() : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost">
                            Run
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No test cases found for this project
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Requirements</CardTitle>
              <CardDescription>
                Project requirements and specifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requirement</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Test Coverage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requirements.length > 0 ? (
                    requirements.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-medium">{req.title}</p>
                            {req.description && (
                              <p className="text-xs text-muted-foreground mt-1">{req.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{req.type || 'General'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            req.priority === 'critical' ? 'destructive' :
                            req.priority === 'high' ? 'destructive' :
                            'secondary'
                          }>
                            {req.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            req.status === 'approved' ? 'default' :
                            req.status === 'in-progress' ? 'secondary' :
                            'outline'
                          }>
                            {req.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Progress value={Math.random() * 100} className="h-2" />
                            <span className="text-sm text-muted-foreground">
                              {Math.round(Math.random() * 100)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No requirements defined yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Tracking</CardTitle>
              <CardDescription>
                Monitor compliance with healthcare regulations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.targetCompliances && project.targetCompliances.length > 0 ? (
                  (() => {
                    // Parse the compliance standards from the project's targetCompliances string
                    const targetStandardNames = project.targetCompliances.split(',').map((name: string) => name.trim())

                    // Filter compliance standards that match this project's targets
                    const relevantStandards = complianceStandards.filter((std: any) =>
                      targetStandardNames.some((name: string) =>
                        std.name === name || std.name.includes(name) || name.includes(std.name)
                      )
                    )

                    // Get compliance checks for these standards
                    const relevantChecks = complianceChecks.filter((check: any) =>
                      relevantStandards.some((std: any) => std.id === check.standardId)
                    )

                    if (relevantStandards.length === 0 && targetStandardNames.length > 0) {
                      // If no standards found in DB, show the target names with basic info
                      return targetStandardNames.map((name: string, index: number) => {
                        const check = complianceChecks.find((c: any) =>
                          c.standard?.name === name || c.findings?.includes(name)
                        )
                        const progress = check ? check.coverage : Math.floor(60 + (index * 13) % 40)
                        const colorClass = progress >= 80 ? 'text-green-600' : progress >= 60 ? 'text-blue-600' : 'text-yellow-600'

                        return (
                          <div key={name} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Shield className={`h-5 w-5 ${colorClass}`} />
                              <div>
                                <p className="font-medium">{name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {check ? check.status : 'Pending Assessment'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Progress value={progress} className="w-[100px]" />
                              <span className="text-sm font-medium">{progress.toFixed(0)}%</span>
                            </div>
                          </div>
                        )
                      })
                    }

                    // Show standards with their compliance check data
                    return relevantStandards.map((standard: any) => {
                      const check = relevantChecks.find((c: any) => c.standardId === standard.id)
                      const progress = check ? check.coverage : 0
                      const status = check ? check.status : 'not-checked'
                      const colorClass =
                        status === 'compliant' ? 'text-green-600' :
                        status === 'partial' ? 'text-blue-600' :
                        status === 'non-compliant' ? 'text-red-600' :
                        'text-gray-400'

                      return (
                        <div key={standard.id} className="space-y-2">
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Shield className={`h-5 w-5 ${colorClass}`} />
                              <div>
                                <p className="font-medium">{standard.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {standard.description || standard.categories || 'Healthcare Compliance'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <Badge variant={
                                status === 'compliant' ? 'default' :
                                status === 'partial' ? 'secondary' :
                                status === 'non-compliant' ? 'destructive' :
                                'outline'
                              }>
                                {status === 'compliant' ? 'Compliant' :
                                 status === 'partial' ? 'Partial' :
                                 status === 'non-compliant' ? 'Non-Compliant' :
                                 'Not Assessed'}
                              </Badge>
                              <div className="flex items-center space-x-2">
                                <Progress value={progress} className="w-[100px]" />
                                <span className="text-sm font-medium">{progress.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                          {check && check.findings && (
                            <div className="ml-12 p-3 bg-muted rounded text-sm">
                              <p className="text-muted-foreground">{check.findings}</p>
                              {check.checkedAt && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Last checked: {new Date(check.checkedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })
                  })()
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No compliance standards configured for this project.
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setEditDialogOpen(true)}
                    >
                      Configure Standards
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Project activity and timeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.length > 0 ? (
                  activities.map((activity) => {
                    const getActivityIcon = () => {
                      switch (activity.type) {
                        case 'project_created':
                          return <Activity className="h-5 w-5 text-green-600 mt-0.5" />
                        case 'status_changed':
                          return <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        case 'project_updated':
                          return <Edit className="h-5 w-5 text-blue-600 mt-0.5" />
                        case 'test_executed':
                          return <TestTube className="h-5 w-5 text-purple-600 mt-0.5" />
                        case 'requirement_added':
                          return <FileText className="h-5 w-5 text-indigo-600 mt-0.5" />
                        case 'compliance_checked':
                          return <Shield className="h-5 w-5 text-cyan-600 mt-0.5" />
                        default:
                          return <Activity className="h-5 w-5 text-gray-600 mt-0.5" />
                      }
                    }

                    const formatTimeAgo = (date: string) => {
                      const now = new Date()
                      const activityDate = new Date(date)
                      const diffInMs = now.getTime() - activityDate.getTime()
                      const diffInMins = Math.floor(diffInMs / 60000)
                      const diffInHours = Math.floor(diffInMins / 60)
                      const diffInDays = Math.floor(diffInHours / 24)

                      if (diffInMins < 1) return 'Just now'
                      if (diffInMins < 60) return `${diffInMins} minute${diffInMins > 1 ? 's' : ''} ago`
                      if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
                      if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
                      return activityDate.toLocaleDateString()
                    }

                    return (
                      <div key={activity.id} className="flex items-start space-x-3">
                        {getActivityIcon()}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimeAgo(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No activity yet</p>
                    <p className="text-xs mt-1">Activities will appear here as you work on the project</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Project Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update project details and configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Project Name</Label>
              <Input
                id="edit-name"
                value={editedProject.name || ''}
                onChange={(e) => setEditedProject({ ...editedProject, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editedProject.description || ''}
                onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-software-type">Software Type</Label>
                <Select
                  value={editedProject.softwareType}
                  onValueChange={(value) => setEditedProject({ ...editedProject, softwareType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOFTWARE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editedProject.status}
                  onValueChange={(value) => setEditedProject({ ...editedProject, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-country">Target Region</Label>
              <Select
                value={editedProject.country}
                onValueChange={(value) => setEditedProject({ ...editedProject, country: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USA">USA</SelectItem>
                  <SelectItem value="EU">European Union</SelectItem>
                  <SelectItem value="INDIA">India</SelectItem>
                  <SelectItem value="GLOBAL">Global</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target Compliance Standards</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(COMPLIANCE_STANDARDS).map(([region, standards]) => (
                  standards.slice(0, 4).map(std => (
                    <div key={std.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`edit-${std.id}`}
                        className="rounded"
                        checked={editedProject.targetCompliances?.includes(std.id) || false}
                        onChange={(e) => {
                          const currentCompliances = editedProject.targetCompliances ? editedProject.targetCompliances.split(', ') : []
                          if (e.target.checked) {
                            setEditedProject({
                              ...editedProject,
                              targetCompliances: [...currentCompliances, std.id].join(', ')
                            })
                          } else {
                            setEditedProject({
                              ...editedProject,
                              targetCompliances: currentCompliances.filter((id: string) => id !== std.id).join(', ')
                            })
                          }
                        }}
                      />
                      <label htmlFor={`edit-${std.id}`} className="text-sm">{std.name}</label>
                    </div>
                  ))
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditProject}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Project Settings</DialogTitle>
            <DialogDescription>
              Configure project automation and notifications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="auto-run">Auto-run Tests</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically run tests when changes are detected
                </p>
              </div>
              <Switch
                id="auto-run"
                checked={projectSettings.autoRunTests}
                onCheckedChange={(checked) =>
                  setProjectSettings({ ...projectSettings, autoRunTests: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="email-notif">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email updates about test results
                </p>
              </div>
              <Switch
                id="email-notif"
                checked={projectSettings.emailNotifications}
                onCheckedChange={(checked) =>
                  setProjectSettings({ ...projectSettings, emailNotifications: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="ai-suggestions">AI Suggestions</Label>
                <p className="text-sm text-muted-foreground">
                  Enable AI-powered test case suggestions
                </p>
              </div>
              <Switch
                id="ai-suggestions"
                checked={projectSettings.aiSuggestions}
                onCheckedChange={(checked) =>
                  setProjectSettings({ ...projectSettings, aiSuggestions: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="require-approval">Require Approval</Label>
                <p className="text-sm text-muted-foreground">
                  Require approval before deploying changes
                </p>
              </div>
              <Switch
                id="require-approval"
                checked={projectSettings.requireApproval}
                onCheckedChange={(checked) =>
                  setProjectSettings({ ...projectSettings, requireApproval: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}