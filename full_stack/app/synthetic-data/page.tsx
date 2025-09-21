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
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import {
  Database,
  Plus,
  Sparkles,
  Download,
  Copy,
  RefreshCw,
  Users,
  FileText,
  Activity,
  Calendar,
  Hash,
  Type,
  ToggleLeft,
  List,
} from "lucide-react"
import { toast } from "sonner"
import ReactSyntaxHighlighter from "react-syntax-highlighter"
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs"

const dataTypes = [
  { value: "patient", label: "Patient Records", icon: Users },
  { value: "appointment", label: "Appointments", icon: Calendar },
  { value: "vitals", label: "Vital Signs", icon: Activity },
  { value: "prescription", label: "Prescriptions", icon: FileText },
  { value: "lab", label: "Lab Results", icon: FileText },
]

const mockGeneratedData = `[
  {
    "patientId": "PAT-2024-001",
    "firstName": "Sarah",
    "lastName": "Johnson",
    "dateOfBirth": "1985-03-15",
    "gender": "Female",
    "bloodType": "O+",
    "allergies": ["Penicillin", "Peanuts"],
    "medications": [
      {
        "name": "Metformin",
        "dosage": "500mg",
        "frequency": "Twice daily"
      }
    ],
    "vitalSigns": {
      "bloodPressure": "120/80",
      "heartRate": 72,
      "temperature": 98.6,
      "respiratoryRate": 16
    },
    "lastVisit": "2024-01-15",
    "nextAppointment": "2024-02-15"
  }
]`

export default function SyntheticDataPage() {
  const [dataType, setDataType] = useState("patient")
  const [recordCount, setRecordCount] = useState([100])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)

  const handleGenerateData = () => {
    setIsGenerating(true)
    setGenerationProgress(0)

    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsGenerating(false)
          toast.success("Synthetic data generated", {
            description: `${recordCount[0]} records created successfully`,
          })
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const SelectedIcon = dataTypes.find(t => t.value === dataType)?.icon || Database

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Synthetic Data Generator</h1>
          <p className="text-muted-foreground mt-2">
            AI-powered test data generation for healthcare scenarios
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Data Configuration</CardTitle>
            <CardDescription>Configure synthetic data parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Data Type</Label>
              <Select value={dataType} onValueChange={setDataType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dataTypes.map(type => {
                    const Icon = type.icon
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center">
                          <Icon className="mr-2 h-4 w-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Number of Records: {recordCount[0]}</Label>
              <Slider
                value={recordCount}
                onValueChange={setRecordCount}
                min={1}
                max={1000}
                step={10}
              />
            </div>

            <div className="space-y-2">
              <Label>Schema Template</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fhir">FHIR R4</SelectItem>
                  <SelectItem value="hl7">HL7 v2.5</SelectItem>
                  <SelectItem value="custom">Custom Schema</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Compliance Requirements</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="hipaa" defaultChecked />
                  <label htmlFor="hipaa" className="text-sm">HIPAA Compliant</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="gdpr" defaultChecked />
                  <label htmlFor="gdpr" className="text-sm">GDPR Compliant</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="deidentified" />
                  <label htmlFor="deidentified" className="text-sm">De-identified Data</label>
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleGenerateData}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Data
                </>
              )}
            </Button>

            {isGenerating && (
              <div className="space-y-2">
                <Progress value={generationProgress} />
                <p className="text-xs text-center text-muted-foreground">
                  AI is creating realistic test data...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Generated Data Preview</CardTitle>
            <CardDescription>Sample of generated synthetic data</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="json">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="json">JSON</TabsTrigger>
                  <TabsTrigger value="table">Table</TabsTrigger>
                  <TabsTrigger value="statistics">Statistics</TabsTrigger>
                </TabsList>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
              <TabsContent value="json">
                <ReactSyntaxHighlighter
                  language="json"
                  style={atomOneDark}
                  customStyle={{
                    borderRadius: "0.5rem",
                    fontSize: "0.75rem",
                    maxHeight: "400px",
                  }}
                >
                  {mockGeneratedData}
                </ReactSyntaxHighlighter>
              </TabsContent>
              <TabsContent value="table">
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Patient ID</th>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">DOB</th>
                        <th className="text-left p-2">Blood Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2">PAT-2024-001</td>
                        <td className="p-2">Sarah Johnson</td>
                        <td className="p-2">1985-03-15</td>
                        <td className="p-2">O+</td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2">PAT-2024-002</td>
                        <td className="p-2">Michael Chen</td>
                        <td className="p-2">1972-08-23</td>
                        <td className="p-2">A+</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </TabsContent>
              <TabsContent value="statistics">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Records</p>
                      <p className="text-2xl font-bold">100</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Unique Fields</p>
                      <p className="text-2xl font-bold">24</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Data Size</p>
                      <p className="text-2xl font-bold">256 KB</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Validation Rate</p>
                      <p className="text-2xl font-bold">100%</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Field Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Type className="h-4 w-4" />
                        <span className="text-sm">String Fields: 12</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Hash className="h-4 w-4" />
                        <span className="text-sm">Numeric Fields: 8</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ToggleLeft className="h-4 w-4" />
                        <span className="text-sm">Boolean Fields: 3</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <List className="h-4 w-4" />
                        <span className="text-sm">Array Fields: 2</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Generations</CardTitle>
          <CardDescription>Previously generated synthetic datasets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { type: "Patient Records", records: 500, date: "2 hours ago", size: "1.2 MB" },
              { type: "Lab Results", records: 1000, date: "1 day ago", size: "2.4 MB" },
              { type: "Appointments", records: 250, date: "3 days ago", size: "512 KB" },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{item.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.records} records • {item.size}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">{item.date}</span>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}