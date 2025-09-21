"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  MoreHorizontal,
  Folder,
  Edit,
  Trash,
  FileText,
  TestTube,
  Shield,
  Activity,
  Calendar,
  Users,
  Target,
  AlertTriangle,
} from "lucide-react"
import { SOFTWARE_TYPES, COMPLIANCE_STANDARDS } from "@/lib/constants"
import { toast } from "sonner"

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [editingProject, setEditingProject] = useState<any>({})
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    softwareType: "",
    targetCompliances: [] as string[],
    country: "",
  })

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        // Transform data to match the expected format
        const transformedProjects = data.map((project: any) => ({
          id: project.id,
          name: project.name,
          description: project.description,
          softwareType: project.softwareType,
          targetCompliances: project.targetCompliances,
          country: project.country,
          status: project.status,
          progress: Math.round((project.stats.passedTests / Math.max(project.stats.totalTests, 1)) * 100),
          testCases: project.stats.totalTests,
          requirements: project.stats.totalRequirements,
          complianceScore: project.stats.compliance,
          lastActivity: new Date(project.updatedAt).toLocaleDateString(),
          team: Math.floor(Math.random() * 15) + 1, // Simulated for now
          risk: project.stats.failedTests > 5 ? "high" : project.stats.failedTests > 0 ? "medium" : "low",
        }))
        setProjects(transformedProjects)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch projects:', err)
        setLoading(false)
      })
  }, [])

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === "all" || project.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const handleCreateProject = async () => {
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newProject,
          targetCompliances: newProject.targetCompliances.join(', '),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create project')
      }

      const created = await response.json()

      // Refresh the projects list
      const projectsResponse = await fetch('/api/projects')
      const projectsData = await projectsResponse.json()
      const transformedProjects = projectsData.map((project: any) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        softwareType: project.softwareType,
        targetCompliances: project.targetCompliances,
        country: project.country,
        status: project.status,
        progress: Math.round((project.stats.passedTests / Math.max(project.stats.totalTests, 1)) * 100),
        testCases: project.stats.totalTests,
        requirements: project.stats.totalRequirements,
        complianceScore: project.stats.compliance,
        lastActivity: new Date(project.updatedAt).toLocaleDateString(),
        team: Math.floor(Math.random() * 15) + 1,
        risk: project.stats.failedTests > 5 ? "high" : project.stats.failedTests > 0 ? "medium" : "low",
      }))
      setProjects(transformedProjects)

      toast.success("Project created successfully", {
        description: "AI agents are being configured for your project",
      })

      // Reset form
      setNewProject({
        name: "",
        description: "",
        softwareType: "",
        targetCompliances: [],
        country: "",
      })
      setIsCreateOpen(false)
    } catch (error) {
      toast.error("Failed to create project", {
        description: "Please try again later",
      })
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "text-green-600"
      case "medium": return "text-yellow-600"
      case "high": return "text-red-600"
      default: return "text-gray-600"
    }
  }

  const handleEditProject = async () => {
    try {
      const response = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingProject.name,
          description: editingProject.description,
          softwareType: editingProject.softwareType,
          targetCompliances: editingProject.targetCompliances,
          country: editingProject.country,
          status: editingProject.status,
        }),
      })

      if (!response.ok) throw new Error('Failed to update project')

      // Refresh projects list
      const projectsResponse = await fetch('/api/projects')
      const projectsData = await projectsResponse.json()
      const transformedProjects = projectsData.map((project: any) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        softwareType: project.softwareType,
        targetCompliances: project.targetCompliances,
        country: project.country,
        status: project.status,
        progress: Math.round((project.stats.passedTests / Math.max(project.stats.totalTests, 1)) * 100),
        testCases: project.stats.totalTests,
        requirements: project.stats.totalRequirements,
        complianceScore: project.stats.compliance,
        lastActivity: new Date(project.updatedAt).toLocaleDateString(),
        team: Math.floor(Math.random() * 15) + 1,
        risk: project.stats.failedTests > 5 ? "high" : project.stats.failedTests > 0 ? "medium" : "low",
      }))
      setProjects(transformedProjects)

      toast.success('Project updated successfully')
      setEditDialogOpen(false)
    } catch (error) {
      toast.error('Failed to update project')
    }
  }

  const handleDeleteProject = async () => {
    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete project')

      // Remove from local state
      setProjects(projects.filter(p => p.id !== selectedProject.id))

      toast.success('Project deleted successfully')
      setDeleteDialogOpen(false)
    } catch (error) {
      toast.error('Failed to delete project')
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-2">
            Manage your healthcare software testing projects
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Set up a new healthcare software testing project with AI-powered capabilities
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  placeholder="Enter project name"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="software-type">Software Type</Label>
                  <Select
                    value={newProject.softwareType}
                    onValueChange={(value) => setNewProject({ ...newProject, softwareType: value })}>
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
                  <Label htmlFor="country">Target Region</Label>
                  <Select
                    value={newProject.country}
                    onValueChange={(value) => setNewProject({ ...newProject, country: value })}>
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
              </div>
              <div className="space-y-2">
                <Label>Target Compliance Standards</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(COMPLIANCE_STANDARDS).map(([region, standards]) => (
                    standards.slice(0, 3).map(std => (
                      <div key={std.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={std.id}
                          className="rounded"
                          checked={newProject.targetCompliances.includes(std.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewProject({
                                ...newProject,
                                targetCompliances: [...newProject.targetCompliances, std.id]
                              })
                            } else {
                              setNewProject({
                                ...newProject,
                                targetCompliances: newProject.targetCompliances.filter(id => id !== std.id)
                              })
                            }
                          }}
                        />
                        <label htmlFor={std.id} className="text-sm">{std.name}</label>
                      </div>
                    ))
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject}>
                Create Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                  <CardDescription>{project.description}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingProject(project)
                        setEditDialogOpen(true)
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Project
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push(`/projects/${project.id}/requirements`)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View Requirements
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push(`/projects/${project.id}/test-cases`)}
                    >
                      <TestTube className="mr-2 h-4 w-4" />
                      View Test Cases
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => {
                        setSelectedProject(project)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Delete Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant={project.status === "active" ? "default" : "secondary"}>
                  {project.status}
                </Badge>
                <Badge variant="outline">
                  {SOFTWARE_TYPES.find(t => t.value === project.softwareType)?.label}
                </Badge>
                <Badge variant="outline">{project.country}</Badge>
                <div className={`flex items-center ${getRiskColor(project.risk)}`}>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  <span className="text-xs font-medium">{project.risk} risk</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{project.requirements} Requirements</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TestTube className="h-4 w-4 text-muted-foreground" />
                  <span>{project.testCases} Test Cases</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>{project.complianceScore}% Compliance</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{project.team} Team Members</span>
                </div>
              </div>

              <div className="pt-3 border-t">
                <p className="text-xs text-muted-foreground">
                  Target Compliance: {project.targetCompliances}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Last activity: {project.lastActivity}
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  View Details
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  Open Project
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Project Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update project details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Project Name</Label>
              <Input
                id="edit-name"
                value={editingProject?.name || ''}
                onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editingProject?.description || ''}
                onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-software-type">Software Type</Label>
                <Select
                  value={editingProject?.softwareType}
                  onValueChange={(value) => setEditingProject({ ...editingProject, softwareType: value })}
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
                  value={editingProject?.status}
                  onValueChange={(value) => setEditingProject({ ...editingProject, status: value })}
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
                value={editingProject?.country}
                onValueChange={(value) => setEditingProject({ ...editingProject, country: value })}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedProject?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteProject}>
              Delete Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}