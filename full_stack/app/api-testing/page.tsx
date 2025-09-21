"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import {
  Globe,
  Play,
  Plus,
  FileCode,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Upload,
  Download,
  RefreshCw,
} from "lucide-react"
import { API_METHODS } from "@/lib/constants"
import { toast } from "sonner"
import ReactSyntaxHighlighter from "react-syntax-highlighter"
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs"

const mockApiTests = [
  {
    id: "API-001",
    name: "Get Patient Records",
    endpoint: "/api/v1/patients/{id}",
    method: "GET",
    status: "passed",
    responseTime: 145,
    lastRun: "2 minutes ago",
  },
  {
    id: "API-002",
    name: "Create Appointment",
    endpoint: "/api/v1/appointments",
    method: "POST",
    status: "failed",
    responseTime: 523,
    lastRun: "15 minutes ago",
  },
  {
    id: "API-003",
    name: "Update Medical Record",
    endpoint: "/api/v1/records/{id}",
    method: "PUT",
    status: "passed",
    responseTime: 234,
    lastRun: "1 hour ago",
  },
]

export default function ApiTestingPage() {
  const [apiTests] = useState(mockApiTests)
  const [selectedMethod, setSelectedMethod] = useState("GET")
  const [responseBody, setResponseBody] = useState(`{
  "status": "success",
  "data": {
    "id": "12345",
    "name": "John Doe",
    "records": []
  }
}`)

  const handleRunTest = () => {
    toast.success("API test executed", {
      description: "Response received in 145ms",
    })
  }

  const handleImportSwagger = () => {
    toast.success("Swagger import started", {
      description: "Analyzing API documentation and generating tests...",
    })
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">API Testing</h1>
          <p className="text-muted-foreground mt-2">
            Automated API testing and validation
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleImportSwagger}>
            <Upload className="mr-2 h-4 w-4" />
            Import Swagger
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Test
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>API Test Configuration</CardTitle>
            <CardDescription>Configure and execute API tests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Endpoint URL</Label>
              <div className="flex space-x-2">
                <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {API_METHODS.map(method => (
                      <SelectItem key={method} value={method}>{method}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="https://api.example.com/endpoint" className="flex-1" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Headers</Label>
              <Textarea
                placeholder="Content-Type: application/json"
                className="font-mono text-sm"
              />
            </div>

            {selectedMethod !== "GET" && (
              <div className="space-y-2">
                <Label>Request Body</Label>
                <Textarea
                  placeholder='{"key": "value"}'
                  className="font-mono text-sm min-h-[100px]"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Expected Response Code</Label>
              <Input type="number" placeholder="200" />
            </div>

            <Button className="w-full" onClick={handleRunTest}>
              <Play className="mr-2 h-4 w-4" />
              Run Test
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response</CardTitle>
            <CardDescription>API test response details</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="body">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="body">Body</TabsTrigger>
                <TabsTrigger value="headers">Headers</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
              </TabsList>
              <TabsContent value="body">
                <ReactSyntaxHighlighter
                  language="json"
                  style={atomOneDark}
                  customStyle={{
                    borderRadius: "0.5rem",
                    padding: "1rem",
                    fontSize: "0.875rem",
                  }}
                >
                  {responseBody}
                </ReactSyntaxHighlighter>
              </TabsContent>
              <TabsContent value="headers">
                <div className="space-y-2 text-sm font-mono">
                  <div>Content-Type: application/json</div>
                  <div>X-Request-ID: abc123</div>
                  <div>Cache-Control: no-cache</div>
                </div>
              </TabsContent>
              <TabsContent value="metrics">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Response Time</span>
                    <span className="text-sm font-medium">145ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Status Code</span>
                    <Badge variant="outline">200 OK</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Size</span>
                    <span className="text-sm font-medium">2.3 KB</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test History</CardTitle>
          <CardDescription>Recent API test executions</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Test Name</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Response Time</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiTests.map((test) => (
                <TableRow key={test.id}>
                  <TableCell>
                    {test.status === "passed" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{test.name}</TableCell>
                  <TableCell className="font-mono text-sm">{test.endpoint}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{test.method}</Badge>
                  </TableCell>
                  <TableCell>{test.responseTime}ms</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {test.lastRun}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}