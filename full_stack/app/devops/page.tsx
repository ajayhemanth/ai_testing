"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { CheckCircle2, XCircle, Upload, RefreshCw, GitBranch, Bug } from "lucide-react"

interface TestCase {
  id: number
  title: string
  status: string
  priority: string
  compliance: string[]
  requirementId: number
  projectId: number
  jiraId?: string
  azureId?: string
}

interface Project {
  id: number
  name: string
}

export default function DevOpsIntegrationPage() {
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [syncing, setSyncing] = useState(false)
  const [jiraStatus, setJiraStatus] = useState({ connected: false, lastSync: null })
  const [azureStatus, setAzureStatus] = useState({ connected: false, lastSync: null })

  useEffect(() => {
    fetchProjects()
    fetchTestCases()
    checkConnectionStatus()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      const data = await response.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }

  const fetchTestCases = async () => {
    try {
      const response = await fetch("/api/test-cases")
      const data = await response.json()
      setTestCases(data.testCases || [])
    } catch (error) {
      console.error("Failed to fetch test cases:", error)
    }
  }

  const checkConnectionStatus = async () => {
    try {
      const [jiraRes, azureRes] = await Promise.all([
        fetch("/api/devops/jira/status"),
        fetch("/api/devops/azure/status")
      ])

      if (jiraRes.ok) {
        const jiraData = await jiraRes.json()
        setJiraStatus(jiraData)
      }

      if (azureRes.ok) {
        const azureData = await azureRes.json()
        setAzureStatus(azureData)
      }
    } catch (error) {
      console.error("Failed to check connection status:", error)
    }
  }

  const syncToJira = async (testCaseId?: number) => {
    setSyncing(true)
    try {
      const endpoint = testCaseId
        ? `/api/devops/jira/sync/${testCaseId}`
        : `/api/devops/jira/sync`

      const response = await fetch(endpoint, { method: "POST" })
      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || "Successfully synced to Jira")
        await fetchTestCases()
        await checkConnectionStatus()
      } else {
        toast.error(data.error || "Failed to sync to Jira")
      }
    } catch (error) {
      toast.error("Failed to sync to Jira")
    } finally {
      setSyncing(false)
    }
  }

  const syncToAzure = async (testCaseId?: number) => {
    setSyncing(true)
    try {
      const endpoint = testCaseId
        ? `/api/devops/azure/sync/${testCaseId}`
        : `/api/devops/azure/sync`

      const response = await fetch(endpoint, { method: "POST" })
      const data = await response.json()

      if (response.ok) {
        toast.success(data.message || "Successfully synced to Azure DevOps")
        await fetchTestCases()
        await checkConnectionStatus()
      } else {
        toast.error(data.error || "Failed to sync to Azure DevOps")
      }
    } catch (error) {
      toast.error("Failed to sync to Azure DevOps")
    } finally {
      setSyncing(false)
    }
  }

  const filteredTestCases = selectedProject === "all"
    ? testCases
    : testCases.filter(tc => tc.projectId === parseInt(selectedProject))

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">DevOps Integration</h1>
          <p className="text-muted-foreground mt-2">
            Sync test cases with Jira and Azure DevOps
          </p>
        </div>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id.toString()}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Connection Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Jira Integration
            </CardTitle>
            <CardDescription>
              Sync test cases with Jira issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                {jiraStatus.connected ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Not Connected
                  </Badge>
                )}
              </div>
              {jiraStatus.lastSync && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Sync</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(jiraStatus.lastSync).toLocaleString()}
                  </span>
                </div>
              )}
              <Button
                className="w-full"
                onClick={() => syncToJira()}
                disabled={syncing}
              >
                {syncing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Sync Test Cases (Batch of 5)
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Azure DevOps Integration
            </CardTitle>
            <CardDescription>
              Sync test cases with Azure DevOps work items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                {azureStatus.connected ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Not Connected
                  </Badge>
                )}
              </div>
              {azureStatus.lastSync && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Sync</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(azureStatus.lastSync).toLocaleString()}
                  </span>
                </div>
              )}
              <Button
                className="w-full"
                onClick={() => syncToAzure()}
                disabled={syncing}
              >
                {syncing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Sync Test Cases (Batch of 5)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Cases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Test Cases</CardTitle>
          <CardDescription>
            {filteredTestCases.length} test cases available for sync
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Test Cases</TabsTrigger>
              <TabsTrigger value="synced">Synced</TabsTrigger>
              <TabsTrigger value="not-synced">Not Synced</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-2 mt-4">
              {filteredTestCases.map((testCase) => (
                <div key={testCase.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <h3 className="font-semibold">{testCase.title}</h3>
                      <div className="flex gap-2">
                        <Badge variant="outline">{testCase.status}</Badge>
                        <Badge variant="outline">{testCase.priority}</Badge>
                        {testCase.compliance.map((tag) => (
                          <Badge key={tag} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        {testCase.jiraId && (
                          <span className="flex items-center gap-1">
                            <Bug className="h-3 w-3" />
                            Jira: {testCase.jiraId}
                          </span>
                        )}
                        {testCase.azureId && (
                          <span className="flex items-center gap-1">
                            <GitBranch className="h-3 w-3" />
                            Azure: {testCase.azureId}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => syncToJira(testCase.id)}
                        disabled={syncing}
                      >
                        Sync to Jira
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => syncToAzure(testCase.id)}
                        disabled={syncing}
                      >
                        Sync to Azure
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="synced" className="space-y-2 mt-4">
              {filteredTestCases
                .filter(tc => tc.jiraId || tc.azureId)
                .map((testCase) => (
                  <div key={testCase.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="font-semibold">{testCase.title}</h3>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          {testCase.jiraId && <span>Jira: {testCase.jiraId}</span>}
                          {testCase.azureId && <span>Azure: {testCase.azureId}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </TabsContent>

            <TabsContent value="not-synced" className="space-y-2 mt-4">
              {filteredTestCases
                .filter(tc => !tc.jiraId && !tc.azureId)
                .map((testCase) => (
                  <div key={testCase.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold">{testCase.title}</h3>
                  </div>
                ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}