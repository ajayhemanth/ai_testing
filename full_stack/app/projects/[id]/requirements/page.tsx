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
  Edit,
  Trash,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
} from "lucide-react"
import { toast } from "sonner"

export default function ProjectRequirementsPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [requirements, setRequirements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newRequirement, setNewRequirement] = useState({
    title: "",
    description: "",
    type: "functional",
    priority: "medium",
    source: "",
    complianceTags: "",
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

    // Fetch requirements for this project
    fetch('/api/requirements')
      .then(res => res.json())
      .then(data => {
        const projectRequirements = Array.isArray(data)
          ? data.filter((req: any) => req.projectId === projectId)
          : (data.requirements || []).filter((req: any) => req.projectId === projectId)
        setRequirements(projectRequirements)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch requirements:', err)
        setLoading(false)
      })
  }, [params.id])

  const handleCreateRequirement = async () => {
    try {
      const response = await fetch('/api/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRequirement,
          projectId: params.id,
        }),
      })

      if (!response.ok) throw new Error('Failed to create requirement')

      const created = await response.json()
      setRequirements([...requirements, created])

      toast.success('Requirement created successfully')

      // Reset form
      setNewRequirement({
        title: "",
        description: "",
        type: "functional",
        priority: "medium",
        source: "",
        complianceTags: "",
      })
      setIsCreateOpen(false)

      // Log activity
      fetch(`/api/projects/${params.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'requirement_added',
          description: `New requirement "${newRequirement.title}" was added`,
        }),
      })
    } catch (error) {
      toast.error('Failed to create requirement')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'not-started':
        return <Clock className="h-4 w-4 text-gray-400" />
      case 'in-progress':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
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

  const filteredRequirements = requirements.filter(req =>
    req.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    req.description?.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h1 className="text-3xl font-bold">Requirements</h1>
            <p className="text-muted-foreground">
              {project?.name} - Requirements Management
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Requirement
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requirements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="outline">
          {filteredRequirements.length} Requirements
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Requirements</CardTitle>
          <CardDescription>
            Manage functional and non-functional requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Test Coverage</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequirements.length > 0 ? (
                filteredRequirements.map((requirement) => (
                  <TableRow key={requirement.id}>
                    <TableCell className="font-medium">
                      {requirement.title}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {requirement.description}
                    </TableCell>
                    <TableCell>
                      {requirement.type || 'General'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(requirement.priority || 'medium')}>
                        {requirement.priority || 'medium'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(requirement.status || 'not-started')}
                        <span className="text-sm">{requirement.status || 'not-started'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {requirement.testCoverage || 0}%
                    </TableCell>
                    <TableCell className="text-right">
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
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No requirements defined yet</p>
                    <Button
                      className="mt-2"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCreateOpen(true)}
                    >
                      Add First Requirement
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Requirement Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Requirement</DialogTitle>
            <DialogDescription>
              Define a new requirement for this project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newRequirement.title}
                onChange={(e) => setNewRequirement({ ...newRequirement, title: e.target.value })}
                placeholder="Enter requirement title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newRequirement.description}
                onChange={(e) => setNewRequirement({ ...newRequirement, description: e.target.value })}
                placeholder="Describe the requirement in detail"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={newRequirement.type}
                  onValueChange={(value) => setNewRequirement({ ...newRequirement, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="functional">Functional</SelectItem>
                    <SelectItem value="non-functional">Non-Functional</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="usability">Usability</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={newRequirement.priority}
                  onValueChange={(value) => setNewRequirement({ ...newRequirement, priority: value })}
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRequirement}>
              Create Requirement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}