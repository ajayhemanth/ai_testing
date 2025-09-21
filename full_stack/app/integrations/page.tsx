"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Plug,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Key,
} from "lucide-react"
import { INTEGRATION_TYPES } from "@/lib/constants"
import { toast } from "sonner"

const integrations = [
  {
    id: "jira",
    name: "Jira",
    description: "Sync test cases and requirements with Jira issues",
    status: "connected",
    lastSync: "5 minutes ago",
    icon: "🔗",
    config: {
      url: "https://company.atlassian.net",
      project: "HEALTH-PROJ",
    },
  },
  {
    id: "azure-devops",
    name: "Azure DevOps",
    description: "Connect with Azure pipelines and boards",
    status: "disconnected",
    lastSync: null,
    icon: "☁️",
    config: null,
  },
  {
    id: "github",
    name: "GitHub",
    description: "Track code changes and pull requests",
    status: "connected",
    lastSync: "1 hour ago",
    icon: "🐙",
    config: {
      repo: "healthcare/app",
      branch: "main",
    },
  },
  {
    id: "slack",
    name: "Slack",
    description: "Send notifications to Slack channels",
    status: "connected",
    lastSync: "Real-time",
    icon: "💬",
    config: {
      channel: "#qa-alerts",
    },
  },
  {
    id: "jenkins",
    name: "Jenkins",
    description: "Trigger tests from CI/CD pipelines",
    status: "error",
    lastSync: "Connection failed",
    icon: "🏗️",
    config: {
      url: "https://jenkins.company.com",
    },
  },
  {
    id: "polarion",
    name: "Polarion",
    description: "ALM integration for requirements management",
    status: "disconnected",
    lastSync: null,
    icon: "📊",
    config: null,
  },
]

export default function IntegrationsPage() {
  const [integrationList, setIntegrationList] = useState(integrations)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<typeof integrations[0] | null>(null)

  const handleToggleIntegration = (id: string, enabled: boolean) => {
    setIntegrationList(prev =>
      prev.map(int =>
        int.id === id
          ? { ...int, status: enabled ? "connected" : "disconnected" }
          : int
      )
    )

    toast.success(enabled ? "Integration enabled" : "Integration disabled", {
      description: `${integrationList.find(i => i.id === id)?.name} has been ${enabled ? "connected" : "disconnected"}`,
    })
  }

  const handleConfigure = (integration: typeof integrations[0]) => {
    setSelectedIntegration(integration)
    setConfigDialogOpen(true)
  }

  const handleSaveConfig = () => {
    setConfigDialogOpen(false)
    toast.success("Configuration saved", {
      description: "Integration settings have been updated",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <XCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return "default"
      case "error": return "destructive"
      default: return "secondary"
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground mt-2">
            Connect with your existing tools and platforms
          </p>
        </div>
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrationList.map((integration) => (
          <Card key={integration.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{integration.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {integration.description}
                    </CardDescription>
                  </div>
                </div>
                <Switch
                  checked={integration.status === "connected"}
                  onCheckedChange={(checked) =>
                    handleToggleIntegration(integration.id, checked)
                  }
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(integration.status)}
                  <Badge variant={getStatusColor(integration.status)}>
                    {integration.status}
                  </Badge>
                </div>
                {integration.lastSync && (
                  <span className="text-xs text-muted-foreground">
                    {integration.lastSync}
                  </span>
                )}
              </div>

              {integration.config && (
                <div className="pt-2 border-t space-y-1">
                  {Object.entries(integration.config).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-muted-foreground capitalize">{key}:</span>
                      <span className="font-mono">{value as string}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleConfigure(integration)}
                >
                  <Settings className="mr-2 h-3 w-3" />
                  Configure
                </Button>
                {integration.status === "connected" && (
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Configure {selectedIntegration?.name}
            </DialogTitle>
            <DialogDescription>
              Update integration settings and authentication
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="url">Instance URL</Label>
              <Input
                id="url"
                placeholder="https://your-instance.com"
                defaultValue={selectedIntegration?.config?.url}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <div className="flex space-x-2">
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Enter API key"
                />
                <Button variant="outline" size="icon">
                  <Key className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project">Project/Workspace</Label>
              <Input
                id="project"
                placeholder="Project identifier"
                defaultValue={selectedIntegration?.config?.project}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfig}>
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}