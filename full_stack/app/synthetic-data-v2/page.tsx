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
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import {
  Database,
  Download,
  Sparkles,
  Shield,
  FileJson,
  FileText,
  Code,
  Heart,
  Activity,
  Stethoscope,
  TestTube,
  Pill,
  Brain,
  ChevronRight,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  Info,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function SyntheticDataV2Page() {
  // State for cascading filters
  const [projects, setProjects] = useState<any[]>([])
  const [requirements, setRequirements] = useState<any[]>([])
  const [testCases, setTestCases] = useState<any[]>([])

  const [selectedProject, setSelectedProject] = useState("")
  const [selectedRequirement, setSelectedRequirement] = useState("")
  const [selectedTestCases, setSelectedTestCases] = useState<string[]>([])

  // State for generation options
  const [dataType, setDataType] = useState("patient_records")
  const [outputFormat, setOutputFormat] = useState("json")
  const [recordCount, setRecordCount] = useState(10)
  const [complexityLevel, setComplexityLevel] = useState("moderate")
  const [includeEdgeCases, setIncludeEdgeCases] = useState(true)
  const [maskPHI, setMaskPHI] = useState(true)
  const [additionalContext, setAdditionalContext] = useState("")

  // State for generation process
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedData, setGeneratedData] = useState<any>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)

  // Load projects on mount
  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        setProjects(data || [])
      })
      .catch(err => {
        console.error('Failed to fetch projects:', err)
        toast.error('Failed to load projects')
      })
  }, [])

  // Load requirements when project is selected
  useEffect(() => {
    if (selectedProject) {
      fetch(`/api/requirements?projectId=${selectedProject}`)
        .then(res => res.json())
        .then(data => {
          setRequirements(data.requirements || [])
          setSelectedRequirement("all")
          setSelectedTestCases([])
          setTestCases([])
        })
        .catch(err => {
          console.error('Failed to fetch requirements:', err)
          toast.error('Failed to load requirements')
        })
    } else {
      setRequirements([])
      setSelectedRequirement("")
      setSelectedTestCases([])
      setTestCases([])
    }
  }, [selectedProject])

  // Load test cases when requirement is selected
  useEffect(() => {
    if (selectedRequirement && selectedRequirement !== 'all') {
      fetch(`/api/test-cases?requirementId=${selectedRequirement}`)
        .then(res => res.json())
        .then(data => {
          setTestCases(data || [])
          setSelectedTestCases([])
        })
        .catch(err => {
          console.error('Failed to fetch test cases:', err)
          toast.error('Failed to load test cases')
        })
    } else if (selectedProject) {
      // Load all test cases for the project
      fetch(`/api/test-cases`)
        .then(res => res.json())
        .then(data => {
          const projectTestCases = (data.testCases || []).filter(
            (tc: any) => tc.projectId === selectedProject
          )
          setTestCases(projectTestCases)
          setSelectedTestCases([])
        })
        .catch(err => {
          console.error('Failed to fetch test cases:', err)
          toast.error('Failed to load test cases')
        })
    } else {
      setTestCases([])
      setSelectedTestCases([])
    }
  }, [selectedRequirement, selectedProject])

  const handleGenerateData = async () => {
    if (selectedTestCases.length === 0) {
      toast.error('Please select at least one test case')
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) return prev
        return prev + 10
      })
    }, 500)

    try {
      const response = await fetch('/api/synthetic-data/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedProject,
          requirementId: selectedRequirement,
          testCaseIds: selectedTestCases,
          dataType,
          outputFormat,
          recordCount,
          complexityLevel,
          includeEdgeCases,
          maskPHI,
          additionalContext,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedData(data)
        setGenerationProgress(100)
        toast.success('Synthetic data generated successfully!')
        setIsPreviewOpen(true)
      } else {
        throw new Error('Failed to generate data')
      }
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to generate synthetic data')
    } finally {
      clearInterval(progressInterval)
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }

  const handleCopyToClipboard = () => {
    if (generatedData) {
      const dataString = typeof generatedData.data === 'string'
        ? generatedData.data
        : JSON.stringify(generatedData.data, null, 2)
      navigator.clipboard.writeText(dataString)
      setCopiedToClipboard(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopiedToClipboard(false), 2000)
    }
  }

  const handleDownload = () => {
    if (generatedData) {
      const dataString = typeof generatedData.data === 'string'
        ? generatedData.data
        : JSON.stringify(generatedData.data, null, 2)

      const fileExtension = outputFormat === 'json' ? 'json' :
                           outputFormat === 'csv' ? 'csv' :
                           outputFormat === 'sql' ? 'sql' :
                           outputFormat === 'xml' ? 'xml' : 'txt'

      const blob = new Blob([dataString], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `synthetic-data-${Date.now()}.${fileExtension}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Downloaded successfully!')
    }
  }

  const getDataTypeIcon = (type: string) => {
    switch (type) {
      case 'patient_records': return <Heart className="h-4 w-4" />
      case 'medical_images': return <Activity className="h-4 w-4" />
      case 'lab_results': return <TestTube className="h-4 w-4" />
      case 'clinical_notes': return <Stethoscope className="h-4 w-4" />
      case 'medications': return <Pill className="h-4 w-4" />
      case 'device_data': return <Brain className="h-4 w-4" />
      default: return <Database className="h-4 w-4" />
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'json': return <FileJson className="h-4 w-4" />
      case 'csv': return <FileText className="h-4 w-4" />
      case 'sql': return <Code className="h-4 w-4" />
      case 'fhir': return <Shield className="h-4 w-4" />
      case 'hl7': return <Activity className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Synthetic Data Generation</h1>
        <p className="text-muted-foreground mt-2">
          Generate compliant synthetic healthcare data for your test cases
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Test Case Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Test Case Selection</CardTitle>
              <CardDescription>
                Select test cases for synthetic data generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Project Selection */}
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Requirement Selection */}
              {selectedProject && (
                <div className="space-y-2">
                  <Label>Requirement (Optional)</Label>
                  <Select value={selectedRequirement} onValueChange={setSelectedRequirement}>
                    <SelectTrigger>
                      <SelectValue placeholder="All requirements" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All requirements</SelectItem>
                      {requirements.map((req) => (
                        <SelectItem key={req.id} value={req.id}>
                          {req.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Test Cases Selection */}
              {testCases.length > 0 && (
                <div className="space-y-2">
                  <Label>Test Cases</Label>
                  <ScrollArea className="h-48 rounded-md border p-4">
                    <div className="space-y-2">
                      {testCases.map((tc) => (
                        <div key={tc.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={tc.id}
                            checked={selectedTestCases.includes(tc.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTestCases([...selectedTestCases, tc.id])
                              } else {
                                setSelectedTestCases(selectedTestCases.filter(id => id !== tc.id))
                              }
                            }}
                          />
                          <label
                            htmlFor={tc.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            <div className="flex items-center justify-between">
                              <span>{tc.title}</span>
                              <div className="flex gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {tc.category}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {tc.priority}
                                </Badge>
                              </div>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{selectedTestCases.length} test case(s) selected</span>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => {
                        if (selectedTestCases.length === testCases.length) {
                          setSelectedTestCases([])
                        } else {
                          setSelectedTestCases(testCases.map(tc => tc.id))
                        }
                      }}
                    >
                      {selectedTestCases.length === testCases.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Generation Options */}
          <Card>
            <CardHeader>
              <CardTitle>Generation Options</CardTitle>
              <CardDescription>
                Configure synthetic data parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Data Type */}
                <div className="space-y-2">
                  <Label>Data Type</Label>
                  <Select value={dataType} onValueChange={setDataType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient_records">
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4" />
                          Patient Records
                        </div>
                      </SelectItem>
                      <SelectItem value="medical_images">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          Medical Images (DICOM)
                        </div>
                      </SelectItem>
                      <SelectItem value="lab_results">
                        <div className="flex items-center gap-2">
                          <TestTube className="h-4 w-4" />
                          Lab Results
                        </div>
                      </SelectItem>
                      <SelectItem value="clinical_notes">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4" />
                          Clinical Notes
                        </div>
                      </SelectItem>
                      <SelectItem value="medications">
                        <div className="flex items-center gap-2">
                          <Pill className="h-4 w-4" />
                          Medication Records
                        </div>
                      </SelectItem>
                      <SelectItem value="device_data">
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4" />
                          Device Data (IoT)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Output Format */}
                <div className="space-y-2">
                  <Label>Output Format</Label>
                  <Select value={outputFormat} onValueChange={setOutputFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">
                        <div className="flex items-center gap-2">
                          <FileJson className="h-4 w-4" />
                          JSON
                        </div>
                      </SelectItem>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          CSV
                        </div>
                      </SelectItem>
                      <SelectItem value="sql">
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4" />
                          SQL Inserts
                        </div>
                      </SelectItem>
                      <SelectItem value="fhir">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          FHIR Resources
                        </div>
                      </SelectItem>
                      <SelectItem value="hl7">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          HL7 Messages
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Record Count */}
              <div className="space-y-2">
                <Label>Number of Records: {recordCount}</Label>
                <Slider
                  value={[recordCount]}
                  onValueChange={(value) => setRecordCount(value[0])}
                  min={1}
                  max={1000}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>100</span>
                  <span>500</span>
                  <span>1000</span>
                </div>
              </div>

              {/* Complexity Level */}
              <div className="space-y-2">
                <Label>Data Complexity</Label>
                <Select value={complexityLevel} onValueChange={setComplexityLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple (Basic fields only)</SelectItem>
                    <SelectItem value="moderate">Moderate (Standard fields)</SelectItem>
                    <SelectItem value="complex">Complex (All fields with relationships)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Privacy Options */}
              <div className="space-y-3">
                <Label>Privacy & Compliance</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="maskPHI"
                      checked={maskPHI}
                      onCheckedChange={(checked) => setMaskPHI(checked as boolean)}
                    />
                    <label
                      htmlFor="maskPHI"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Mask PHI (Protected Health Information)
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="edgeCases"
                      checked={includeEdgeCases}
                      onCheckedChange={(checked) => setIncludeEdgeCases(checked as boolean)}
                    />
                    <label
                      htmlFor="edgeCases"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Include edge cases and boundary values
                    </label>
                  </div>
                </div>
              </div>

              {/* Additional Context */}
              <div className="space-y-2">
                <Label>Additional Context (Optional)</Label>
                <Textarea
                  placeholder="Provide any specific requirements or scenarios for the synthetic data..."
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Summary & Actions */}
        <div className="space-y-6">
          {/* Generation Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Generation Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedProject && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Project:</span>
                  <span className="font-medium">
                    {projects.find(p => p.id === selectedProject)?.name}
                  </span>
                </div>
              )}

              {selectedRequirement && selectedRequirement !== 'all' && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Requirement:</span>
                  <span className="font-medium truncate max-w-[150px]" title={requirements.find(r => r.id === selectedRequirement)?.title}>
                    {requirements.find(r => r.id === selectedRequirement)?.title}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Test Cases:</span>
                <Badge variant="secondary">{selectedTestCases.length}</Badge>
              </div>

              <Separator />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Data Type:</span>
                <div className="flex items-center gap-2">
                  {getDataTypeIcon(dataType)}
                  <span className="font-medium">
                    {dataType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Format:</span>
                <div className="flex items-center gap-2">
                  {getFormatIcon(outputFormat)}
                  <span className="font-medium">{outputFormat.toUpperCase()}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Records:</span>
                <span className="font-medium">{recordCount}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Complexity:</span>
                <Badge variant="outline">{complexityLevel}</Badge>
              </div>

              {(maskPHI || includeEdgeCases) && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    {maskPHI && (
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-3 w-3 text-green-600" />
                        <span>PHI Masking Enabled</span>
                      </div>
                    )}
                    {includeEdgeCases && (
                      <div className="flex items-center gap-2 text-sm">
                        <AlertCircle className="h-3 w-3 text-blue-600" />
                        <span>Edge Cases Included</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
            <CardContent className="pt-0">
              <Button
                className="w-full"
                onClick={handleGenerateData}
                disabled={selectedTestCases.length === 0 || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Synthetic Data
                  </>
                )}
              </Button>

              {isGenerating && (
                <div className="mt-4 space-y-2">
                  <Progress value={generationProgress} />
                  <p className="text-xs text-center text-muted-foreground">
                    Processing test cases...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compliance Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Compliance Notice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                  <p className="text-sm text-muted-foreground">
                    Generated data will comply with the test case's associated compliance standards
                    and respect privacy requirements.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Generated Synthetic Data</DialogTitle>
            <DialogDescription>
              Preview and download your generated test data
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 rounded-md border p-4">
            <pre className="text-sm">
              {generatedData && (
                typeof generatedData.data === 'string'
                  ? generatedData.data
                  : JSON.stringify(generatedData.data, null, 2)
              )}
            </pre>
          </ScrollArea>
          <DialogFooter className="flex items-center justify-between">
            <div className="flex gap-2">
              {generatedData?.stats && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Records: {generatedData.stats.recordCount}</span>
                  <span>Size: {generatedData.stats.sizeInKB} KB</span>
                  {generatedData.stats.complianceStandards && (
                    <div className="flex gap-1">
                      <span>Compliance:</span>
                      {generatedData.stats.complianceStandards.map((std: string) => (
                        <Badge key={std} variant="outline" className="text-xs">
                          {std}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCopyToClipboard}
                disabled={!generatedData}
              >
                {copiedToClipboard ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
              <Button onClick={handleDownload} disabled={!generatedData}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}