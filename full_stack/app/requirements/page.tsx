"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  Upload,
  FileText,
  Plus,
  Download,
  Search,
  Filter,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Clock,
  FileUp,
  Link,
  Brain,
  Target,
  Zap,
  TestTube,
  MessageSquare,
  Wand2,
  Trash2,
  Edit,
  Lightbulb,
  Save,
  X,
  Loader2,
} from "lucide-react"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { GuidedQuestionnaire } from "@/components/guided-questionnaire"
import { DocumentGapQuestionnaire } from "@/components/document-gap-questionnaire"
import { motion, AnimatePresence } from "framer-motion"
import type { DocumentAnalysis } from "@/components/document-gap-questionnaire"
import { DocumentProcessingProgress } from "@/components/document-processing-progress"
import { ClientDocumentProcessor } from "@/lib/client-document-processor"

const mockRequirements = [
  {
    id: "REQ-001",
    title: "User Authentication System",
    description: "System shall provide secure multi-factor authentication for healthcare professionals",
    type: "Functional",
    source: "User Story US-234",
    priority: "High",
    status: "Approved",
    testCases: 12,
    compliance: ["HIPAA", "ISO 27001"],
    aiGenerated: false,
  },
  {
    id: "REQ-002",
    title: "Patient Data Encryption",
    description: "All patient data must be encrypted at rest using AES-256 encryption",
    type: "Security",
    source: "Compliance Doc",
    priority: "Critical",
    status: "In Review",
    testCases: 8,
    compliance: ["HIPAA", "GDPR"],
    aiGenerated: true,
  },
  {
    id: "REQ-003",
    title: "Real-time Vital Signs Monitoring",
    description: "System shall capture and display vital signs with latency less than 100ms",
    type: "Performance",
    source: "Technical Spec",
    priority: "High",
    status: "Draft",
    testCases: 15,
    compliance: ["IEC 62304", "FDA 21 CFR"],
    aiGenerated: false,
  },
]

export default function RequirementsPage() {
  const [requirements, setRequirements] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showGuidedFlow, setShowGuidedFlow] = useState(false)
  const [generationMode, setGenerationMode] = useState<"guided" | "quick" | null>(null)
  const [showDocumentGaps, setShowDocumentGaps] = useState(false)
  const [documentAnalysis, setDocumentAnalysis] = useState<DocumentAnalysis | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadProjectId, setUploadProjectId] = useState("")
  const [processingDocumentId, setProcessingDocumentId] = useState<string | null>(null)
  const [showProgress, setShowProgress] = useState(false)
  const [newRequirement, setNewRequirement] = useState({
    projectId: "",
    title: "",
    description: "",
    type: "functional",
    priority: "medium",
    source: "",
    complianceTags: "",
  })
  const [selectedRequirements, setSelectedRequirements] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedProject, setSelectedProject] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedRequirement, setSelectedRequirement] = useState<any>(null)
  const [requirementTestCases, setRequirementTestCases] = useState<any[]>([])
  const [loadingTestCases, setLoadingTestCases] = useState(false)
  const [editingTestCase, setEditingTestCase] = useState<any>(null)
  const [editForm, setEditForm] = useState<any>({})
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<any>(null)
  const [savingTestCase, setSavingTestCase] = useState(false)

  const handleCreateRequirement = async () => {
    if (!newRequirement.projectId || !newRequirement.title) {
      toast.error("Please select a project and provide a title")
      return
    }

    try {
      const response = await fetch('/api/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequirement),
      })

      if (!response.ok) throw new Error('Failed to create requirement')

      const created = await response.json()

      // Refetch requirements to get the full data with project info
      const reqResponse = await fetch('/api/requirements')
      const updatedData = await reqResponse.json()
      setRequirements(updatedData.requirements || updatedData || [])

      toast.success('Requirement created successfully')

      // Reset form
      setNewRequirement({
        projectId: "",
        title: "",
        description: "",
        type: "functional",
        priority: "medium",
        source: "",
        complianceTags: "",
      })
      setIsCreateOpen(false)
    } catch (error) {
      toast.error('Failed to create requirement')
    }
  }

  useEffect(() => {
    // Fetch all requirements
    fetch('/api/requirements')
      .then(res => res.json())
      .then(data => {
        setRequirements(data.requirements || data || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch requirements:', err)
        setLoading(false)
      })

    // Fetch all projects for the create dialog
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        setProjects(data)
      })
      .catch(err => console.error('Failed to fetch projects:', err))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    multiple: true,
    onDrop: (acceptedFiles) => {
      handleFileUpload(acceptedFiles)
    },
  })

  const analyzeDocument = (files: File[]): DocumentAnalysis => {
    // Simulate document analysis based on file name and type
    const fileName = files[0]?.name || "document"
    const isCompleteDoc = fileName.toLowerCase().includes("complete") ||
                          fileName.toLowerCase().includes("full")

    return {
      documentInfo: {
        fileName: fileName,
        fileSize: files[0] ? `${(files[0].size / 1024).toFixed(2)} KB` : "Unknown",
        uploadedAt: new Date().toISOString()
      },
      extractedInfo: {
        projectType: isCompleteDoc ? "Electronic Health Records (EHR) System" : undefined,
        softwareName: isCompleteDoc ? "HealthConnect Pro" : undefined,
        targetUsers: isCompleteDoc ? ["Physicians", "Nurses", "Administrators"] : undefined,
        complianceStandards: ["HIPAA", "GDPR"],
        regions: isCompleteDoc ? ["USA", "EU"] : undefined,
        dataHandling: isCompleteDoc ? "Patient demographics, medical history, prescriptions" : undefined,
        integrations: undefined,
        riskLevel: undefined,
        clinicalFeatures: isCompleteDoc ? ["Patient Management", "E-Prescribing"] : undefined,
        requirements: isCompleteDoc ? [
          { id: "REQ-001", title: "User Authentication", type: "Security" },
          { id: "REQ-002", title: "Data Encryption", type: "Security" },
        ] : []
      },
      missingInfo: {
        critical: ["Risk Classification", "Performance Requirements"],
        important: ["Integration Systems", "Backup Strategy", "Disaster Recovery"],
        optional: ["User Training Requirements", "Maintenance Schedule"]
      },
      confidenceScores: {
        overall: isCompleteDoc ? 0.65 : 0.25,
        sections: {
          projectType: isCompleteDoc ? 0.9 : 0.3,
          compliance: 0.7,
          riskLevel: 0.1,
          integrations: 0.2,
          performance: 0.15
        }
      }
    }
  }

  const handleFileUpload = async (files: File[]) => {
    if (!uploadProjectId) {
      toast.error("Please select a project first")
      return
    }

    setUploadedFiles(files)
    setIsProcessing(true)
    setShowProgress(true)

    try {
      const processor = new ClientDocumentProcessor()
      const documentId = await processor.startProcessing(files, uploadProjectId)
      setProcessingDocumentId(documentId)

      // The completion will be handled by the progress component's onComplete callback
    } catch (error) {
      console.error('Upload error:', error)
      setIsProcessing(false)
      setShowProgress(false)
      toast.error("Failed to process documents", {
        description: error instanceof Error ? error.message : "Please try again",
      })
    }
  }

  const handleProcessingComplete = async (details: any) => {
    setIsProcessing(false)
    setShowProgress(false)

    console.log('Processing complete with details:', details)

    // Check if we have gaps from the analyze step
    if (details?.hasGaps && details?.analysis) {
      // Create document analysis object from the processing results
      const analysis: DocumentAnalysis = {
        documentInfo: {
          fileName: uploadedFiles[0]?.name || "Document",
          fileSize: `${(uploadedFiles[0]?.size / 1024 / 1024).toFixed(2)}MB`,
          pages: details.analysis.pages || 0,
          uploadedAt: new Date().toISOString(),
        },
        extractedInfo: {
          projectType: details.analysis.projectType,
          softwareName: details.analysis.softwareName,
          targetUsers: details.analysis.targetUsers || [],
          complianceStandards: details.analysis.complianceStandards || [],
          regions: details.analysis.regions || [],
          dataHandling: details.analysis.dataHandling,
          integrations: details.analysis.integrations || [],
          riskLevel: details.analysis.riskLevel,
          clinicalFeatures: details.analysis.clinicalFeatures || [],
          requirements: details.analysis.requirements || [],
          text: details.analysis.text, // Include the document text
          sections: details.analysis.sections || []
        },
        missingInfo: {
          critical: details.analysis.criticalGaps || [],
          important: details.analysis.importantGaps || [],
          optional: details.analysis.optionalGaps || [],
        },
        confidenceScores: {
          overall: details.analysis.confidence || 0.7,
          sections: details.analysis.sectionConfidence || {},
        },
        dynamicQuestions: details.dynamicQuestions // Include the dynamic questions
      }

      // Save the document ID for later use
      setProcessingDocumentId(details.documentId)

      // Show the gap questionnaire to gather missing information
      setDocumentAnalysis(analysis)
      setShowDocumentGaps(true)
      toast.info("Document analyzed", {
        description: `Found ${analysis.missingInfo.critical.length + analysis.missingInfo.important.length} items that need clarification for comprehensive requirements.`,
      })

      // Don't close the upload dialog - let the questionnaire show
      return
    } else if (details?.totalRequirements > 0) {
      // Legacy flow - direct requirement generation
      toast.success(`Document processing complete!`, {
        description: `Successfully extracted and saved ${details.totalRequirements} requirements`,
      })

      // Refresh requirements list
      fetch('/api/requirements')
        .then(res => res.json())
        .then(data => setRequirements(data.requirements || data || []))
        .catch(err => console.error('Failed to refresh requirements:', err))

      setIsUploadOpen(false)
      setUploadProjectId("")
    } else {
      toast.warning("No requirements extracted", {
        description: "The document was processed but no requirements were found.",
      })
    }
  }

  const handleProcessingError = (error: string) => {
    setIsProcessing(false)
    setShowProgress(false)
    toast.error("Processing failed", {
      description: error,
    })
  }

  const handleGenerateRequirements = () => {
    setIsGenerateOpen(false)
    toast.success("AI Requirements Generation Started", {
      description: "Vertex AI agents are analyzing your specifications...",
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredRequirements.map((req: any) => req.id))
      setSelectedRequirements(allIds)
    } else {
      setSelectedRequirements(new Set())
    }
  }

  const handleSelectRequirement = (id: string, checked: boolean) => {
    const newSelection = new Set(selectedRequirements)
    if (checked) {
      newSelection.add(id)
    } else {
      newSelection.delete(id)
    }
    setSelectedRequirements(newSelection)
  }

  const handleDeleteSelected = async () => {
    if (selectedRequirements.size === 0) {
      toast.error("Please select requirements to delete")
      return
    }
    setShowDeleteDialog(true)
  }

  const handleViewTestCases = async (requirement: any) => {
    setSelectedRequirement(requirement)
    setLoadingTestCases(true)

    try {
      const response = await fetch(`/api/test-cases?requirementId=${requirement.id}`)
      if (response.ok) {
        const data = await response.json()
        setRequirementTestCases(data)
      }
    } catch (error) {
      console.error('Failed to fetch test cases:', error)
      toast.error('Failed to load test cases')
    } finally {
      setLoadingTestCases(false)
    }
  }

  const handleEditTestCase = (testCase: any) => {
    setEditingTestCase(testCase)
    setEditForm({
      title: testCase.title,
      description: testCase.description || '',
      testSteps: testCase.testSteps || '',
      expectedResults: testCase.expectedResults || '',
      category: testCase.category || 'functional',
      priority: testCase.priority || 'medium',
      status: testCase.status || 'pending',
      automationStatus: testCase.automationStatus || 'manual',
      tags: testCase.tags || '',
      complianceTags: testCase.requirement?.complianceTags || '',
    })
    setAiSuggestions(null)
  }

  const handleGetSuggestions = async () => {
    if (!editingTestCase) return

    setLoadingSuggestions(true)
    try {
      const response = await fetch(`/api/test-cases/${editingTestCase.id}/suggest-improvements`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setAiSuggestions(data.suggestions)
        toast.success('AI suggestions generated successfully')
      } else {
        toast.error('Failed to generate suggestions')
      }
    } catch (error) {
      console.error('Error getting suggestions:', error)
      toast.error('Failed to generate suggestions')
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const handleApplySuggestions = () => {
    if (!aiSuggestions) return

    setEditForm({
      ...editForm,
      title: aiSuggestions.improvedTitle || editForm.title,
      description: aiSuggestions.improvedDescription || editForm.description,
      testSteps: aiSuggestions.improvedSteps ? aiSuggestions.improvedSteps.map((step: string, idx: number) => `${idx + 1}. ${step}`).join('\n') : editForm.testSteps,
      expectedResults: aiSuggestions.improvedExpectedResults || editForm.expectedResults,
      category: aiSuggestions.suggestedCategory || editForm.category,
      priority: aiSuggestions.suggestedPriority || editForm.priority,
      complianceTags: aiSuggestions.suggestedComplianceTags ? aiSuggestions.suggestedComplianceTags.join(', ') : editForm.complianceTags,
    })

    toast.success('Suggestions applied to the form')
  }

  const handleSaveTestCase = async () => {
    if (!editingTestCase) return

    setSavingTestCase(true)
    try {
      const response = await fetch(`/api/test-cases/${editingTestCase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          complianceTags: editForm.complianceTags,
        }),
      })

      if (response.ok) {
        toast.success('Test case updated successfully')

        // Refresh test cases
        const refreshResponse = await fetch(`/api/test-cases?requirementId=${selectedRequirement.id}`)
        if (refreshResponse.ok) {
          const data = await refreshResponse.json()
          setRequirementTestCases(data)
        }

        setEditingTestCase(null)
        setEditForm({})
        setAiSuggestions(null)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update test case')
      }
    } catch (error) {
      console.error('Error saving test case:', error)
      toast.error('Failed to update test case')
    } finally {
      setSavingTestCase(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingTestCase(null)
    setEditForm({})
    setAiSuggestions(null)
  }

  const handleExportRequirements = () => {
    // Convert requirements to CSV
    const csv = [
      ['ID', 'Title', 'Description', 'Type', 'Priority', 'Status', 'Project', 'Compliance Tags'].join(','),
      ...filteredRequirements.map(req => [
        req.id,
        `"${req.title || ''}"`,
        `"${req.description || ''}"`,
        req.type || '',
        req.priority || '',
        req.status || '',
        `"${req.project?.name || ''}"`,
        `"${req.complianceTags || ''}"`,
      ].join(','))
    ].join('\n')

    // Download CSV file
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `requirements-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success('Requirements exported successfully')
  }

  const confirmDelete = async () => {
    setShowDeleteDialog(false)
    setIsDeleting(true)

    try {
      const response = await fetch('/api/requirements', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedRequirements) }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message)

        // Clear selection and refresh requirements
        setSelectedRequirements(new Set())
        fetch('/api/requirements')
          .then(res => res.json())
          .then(data => setRequirements(data.requirements || data || []))
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete requirements')
      }
    } catch (error) {
      toast.error('Failed to delete requirements')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleQuestionnaireComplete = (answers: Record<string, string | string[] | number>) => {
    setShowGuidedFlow(false)
    setIsGenerateOpen(false)
    console.log("Questionnaire answers:", answers)

    // Generate detailed prompt from answers
    const prompt = generatePromptFromAnswers(answers)

    toast.success("Requirements generation started", {
      description: `AI is generating requirements based on your ${Object.keys(answers).length} answers...`,
    })

    // Simulate requirement generation
    setTimeout(() => {
      toast.success("15 new requirements generated", {
        description: "AI has created comprehensive requirements with compliance mapping",
      })
    }, 3000)
  }

  const generatePromptFromAnswers = (answers: Record<string, string | string[] | number>) => {
    // Convert answers to a comprehensive prompt
    return {
      projectType: answers["project-type"],
      riskClass: answers["risk-class"],
      regions: answers["target-regions"],
      dataHandling: answers["patient-data"],
      storage: answers["data-storage"],
      integrations: answers["integration-needs"],
      clinicalFeatures: answers["clinical-features"],
      userTypes: answers["user-types"],
      specialRequirements: answers["special-requirements"],
    }
  }

  const handleSkipQuestionnaire = () => {
    setShowGuidedFlow(false)
    setGenerationMode("quick")
  }

  const generateRequirementsFromDocument = async (details: any, gapAnswers?: Record<string, string | string[] | number>) => {
    try {
      const response = await fetch('/api/requirements/generate-from-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: uploadProjectId,
          documentId: details.documentId,
          analysis: details.analysis,
          gapAnswers,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success("Requirements generated successfully!", {
          description: `Created ${result.count} requirements based on document analysis${gapAnswers ? ' and your answers' : ''}.`,
        })

        // Force refresh requirements list
        try {
          const reqResponse = await fetch('/api/requirements', { cache: 'no-store' })
          if (reqResponse.ok) {
            const data = await reqResponse.json()
            setRequirements(data.requirements || data || [])
          }
        } catch (error) {
          console.error('Failed to refresh requirements:', error)
        }
      } else {
        throw new Error('Failed to generate requirements')
      }
    } catch (error) {
      toast.error("Failed to generate requirements", {
        description: "Please try again or contact support.",
      })
    } finally {
      setIsUploadOpen(false)
      setUploadProjectId("")
      setShowDocumentGaps(false)
      setDocumentAnalysis(null)
    }
  }

  const handleDocumentGapsComplete = async (answers: Record<string, string | string[] | number>) => {
    const filledGaps = Object.keys(answers).filter(key => answers[key]).length
    const totalGaps = Object.keys(answers).length

    toast.info("Generating comprehensive requirements...", {
      description: `Using document content and ${filledGaps} answered questions. This may take 5-10 minutes...`,
    })

    // Store the processing details to use with gap answers
    const processingDetails = {
      documentId: processingDocumentId,
      analysis: documentAnalysis?.extractedInfo,
    }

    await generateRequirementsFromDocument(processingDetails, answers)
  }

  const handleDocumentGapsSkip = async () => {
    toast.info("Generating requirements from document only...", {
      description: "This may take 5-10 minutes. Some requirements may be less detailed without additional context.",
    })

    const processingDetails = {
      documentId: processingDocumentId,
      analysis: documentAnalysis?.extractedInfo,
    }

    await generateRequirementsFromDocument(processingDetails)
  }

  const OLD_handleDocumentGapsComplete = async (answers: Record<string, string | string[] | number>) => {
    setShowDocumentGaps(false)
    setIsUploadOpen(false)

    const filledGaps = Object.keys(answers).filter(key => answers[key]).length
    const totalGaps = Object.keys(answers).length

    toast.success("Requirements generation started", {
      description: `Combining document content with ${filledGaps} answered questions to generate comprehensive requirements...`,
    })

    // Generate requirements with the selected project
    setTimeout(async () => {
      const newRequirements = [
        {
          projectId: uploadProjectId,
          title: "Risk Management Process",
          description: "Implement risk management process according to ISO 14971 for Class " + (answers["risk-classification"] || "II") + " medical device software",
          type: "compliance",
          source: `${uploadedFiles[0]?.name} + Gap Analysis`,
          priority: "critical",
          status: "draft",
          complianceTags: "ISO 14971,IEC 62304",
        },
        {
          projectId: uploadProjectId,
          title: "System Integration Requirements",
          description: "Support integration with " + (answers["integration-systems"] || "HL7 FHIR, DICOM") + " systems",
          type: "functional",
          source: `${uploadedFiles[0]?.name} + Gap Analysis`,
          priority: "high",
          status: "draft",
          complianceTags: "HL7,DICOM",
        },
        // Add more generated requirements
        {
          projectId: uploadProjectId,
          title: "Data Privacy Compliance",
          description: "Ensure patient data handling complies with " + (answers["regions"] || "GDPR") + " regulations",
          type: "compliance",
          source: `${uploadedFiles[0]?.name} + Gap Analysis`,
          priority: "critical",
          status: "draft",
          complianceTags: "GDPR,HIPAA",
        },
      ]

      // Create requirements in database
      for (const req of newRequirements) {
        try {
          await fetch('/api/requirements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req),
          })
        } catch (error) {
          console.error('Failed to create requirement:', error)
        }
      }

      // Refresh requirements list
      const response = await fetch('/api/requirements')
      const updatedData = await response.json()
      setRequirements(updatedData.requirements || updatedData || [])

      toast.success(`${newRequirements.length} requirements generated`, {
        description: `Successfully combined document analysis with ${filledGaps} gap-filling answers`,
      })

      // Reset upload project selection
      setUploadProjectId("")
    }, 3000)
  }

  const OLD_handleDocumentGapsSkip = () => {
    setShowDocumentGaps(false)
    setIsUploadOpen(false)

    toast.success("Processing document as-is", {
      description: "Generating requirements from available document content only...",
    })

    setTimeout(async () => {
      // Generate basic requirements from document without gap analysis
      const basicRequirements = [
        {
          projectId: uploadProjectId,
          title: "Basic Functional Requirement",
          description: "Extracted from document - requires further specification",
          type: "functional",
          source: uploadedFiles[0]?.name || "Uploaded Document",
          priority: "medium",
          status: "draft",
          complianceTags: "",
        },
      ]

      // Create requirements in database
      for (const req of basicRequirements) {
        try {
          await fetch('/api/requirements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req),
          })
        } catch (error) {
          console.error('Failed to create requirement:', error)
        }
      }

      // Refresh requirements list
      const response = await fetch('/api/requirements')
      const updatedData = await response.json()
      setRequirements(updatedData.requirements || updatedData || [])

      toast.success("Requirements generated", {
        description: "Consider filling gaps for more comprehensive requirements",
      })

      // Reset upload project selection
      setUploadProjectId("")
    }, 2000)
  }

  const getPriorityColor = (priority: string) => {
    const lowerPriority = priority?.toLowerCase()
    switch (lowerPriority) {
      case "critical": return "destructive"
      case "high": return "destructive"
      case "medium": return "secondary"
      case "low": return "outline"
      default: return "outline"
    }
  }

  const getStatusColor = (status: string) => {
    const lowerStatus = status?.toLowerCase()
    switch (lowerStatus) {
      case "approved":
      case "completed":
        return "text-green-600"
      case "in-progress":
      case "in review":
        return "text-yellow-600"
      case "pending":
      case "draft":
        return "text-gray-600"
      default: return "text-gray-600"
    }
  }

  const getFilteredRequirements = (type: string = "all") => {
    return requirements.filter(req => {
      // Text search filter
      const matchesSearch = searchQuery === "" || (
        req.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.project?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )

      // Type filter for tabs
      const matchesType = type === "all" ||
        (type === "functional" && req.type?.toLowerCase() === "functional") ||
        (type === "security" && req.type?.toLowerCase() === "security") ||
        (type === "performance" && req.type?.toLowerCase() === "performance") ||
        (type === "compliance" && req.type?.toLowerCase() === "compliance")

      // Priority filter
      const matchesPriority = selectedPriority === "all" ||
        req.priority?.toLowerCase() === selectedPriority

      // Status filter
      const matchesStatus = selectedStatus === "all" ||
        req.status?.toLowerCase() === selectedStatus

      // Project filter
      const matchesProject = selectedProject === "all" ||
        req.project?.id === selectedProject

      return matchesSearch && matchesType && matchesPriority && matchesStatus && matchesProject
    })
  }

  const filteredRequirements = getFilteredRequirements(selectedType)

  const renderRequirementsTable = (reqs: any[]) => (
    <>
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search requirements..."
            className="max-w-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {selectedRequirements.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete ({selectedRequirements.size})
          </Button>
        )}
        <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Filter Requirements</DialogTitle>
              <DialogDescription>
                Apply filters to narrow down requirements
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
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
                <Label>Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="All projects" />
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
              <Button variant="outline" onClick={() => {
                setSelectedPriority("all")
                setSelectedStatus("all")
                setSelectedProject("all")
              }}>
                Clear Filters
              </Button>
              <Button onClick={() => setIsFilterOpen(false)}>Apply</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="outline" size="sm" onClick={handleExportRequirements}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
          <p className="text-lg font-medium text-muted-foreground">Loading requirements...</p>
          <p className="text-sm text-muted-foreground mt-2">Please wait while we fetch your data</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRequirements.size > 0 && selectedRequirements.size === reqs.length}
                    onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                  />
                </TableHead>
                <TableHead>Requirement ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px] max-w-[120px]">Source</TableHead>
                <TableHead>Compliance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reqs.length > 0 ? (
                reqs.map((req) => (
                  <TableRow
                    key={req.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewTestCases(req)}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedRequirements.has(req.id)}
                        onCheckedChange={(checked) => handleSelectRequirement(req.id, checked as boolean)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">{req.id.slice(0, 8)}</code>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{req.title}</p>
                        {req.description && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                            {req.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {req.project?.name || 'No Project'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {req.type || 'General'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(req.priority)}>
                        {req.priority || 'medium'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`flex items-center ${getStatusColor(req.status)}`}>
                        {(req.status?.toLowerCase() === "approved" || req.status?.toLowerCase() === "completed") && <CheckCircle className="mr-1 h-3 w-3" />}
                        {(req.status?.toLowerCase() === "in-progress" || req.status?.toLowerCase() === "in review") && <Clock className="mr-1 h-3 w-3" />}
                        {(req.status?.toLowerCase() === "pending" || req.status?.toLowerCase() === "draft") && <AlertCircle className="mr-1 h-3 w-3" />}
                        {req.status || 'pending'}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground w-[120px] max-w-[120px]">
                      <div className="truncate" title={req.source || '-'}>
                        {req.source || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {req.complianceTags ? (
                          (() => {
                            // Deduplicate tags and add index to key for uniqueness
                            const tags: string[] = req.complianceTags.split(',')
                              .map((tag: string) => tag.trim())
                              .filter((tag: string) => tag)
                            const uniqueTags: string[] = [...new Set(tags)]
                            return uniqueTags.map((tag, index) => (
                              <Badge key={`${req.id}-tag-${index}`} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))
                          })()
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No requirements found</p>
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
        </div>
      )}
    </>
  )

  return (
    <div className="p-8 space-y-8">
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Requirements</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedRequirements.size} requirement(s)?
              This action cannot be undone and will also delete all associated test cases.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Requirements Management</h1>
          <p className="text-muted-foreground mt-2">
            Import, generate, and manage software requirements with AI assistance
          </p>
        </div>
        <div className="flex space-x-3">
          {/* <Button onClick={() => setIsCreateOpen(true)} disabled className="opacity-50 cursor-not-allowed">
            <Plus className="mr-2 h-4 w-4" />
            Add Requirement
          </Button> */}
          <Dialog open={isUploadOpen} onOpenChange={(open) => {
            setIsUploadOpen(open)
            if (!open) {
              // Reset ALL state when closing
              setUploadProjectId("")
              setProcessingDocumentId(null)
              setShowProgress(false)
              setIsProcessing(false)
              setUploadedFiles([])
            } else {
              // Reset state when opening too
              setProcessingDocumentId(null)
              setShowProgress(false)
              setIsProcessing(false)
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Upload Documents
              </Button>
            </DialogTrigger>
            <DialogContent
              className={cn(
                "w-[90vw] max-w-[1400px]",
                "h-[85vh] max-h-[85vh]",
                "sm:max-w-[90vw] sm:w-[90vw]",
                "md:max-w-[1400px] md:w-[90vw]",
                "overflow-y-auto"
              )}
            >
              <AnimatePresence mode="wait">
                {showProgress && processingDocumentId ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <DialogHeader>
                      <DialogTitle>Processing Documents</DialogTitle>
                      <DialogDescription>
                        Your documents are being processed through multiple stages
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <DocumentProcessingProgress
                        documentId={processingDocumentId}
                        onComplete={handleProcessingComplete}
                        onError={handleProcessingError}
                      />
                    </div>
                  </motion.div>
                ) : !showDocumentGaps ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <DialogHeader>
                      <DialogTitle>Upload Requirement Documents</DialogTitle>
                      <DialogDescription>
                        Select a project and upload your specifications
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      {!uploadProjectId && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Please select a project before uploading documents
                          </AlertDescription>
                        </Alert>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="upload-project">Project *</Label>
                        <Select
                          value={uploadProjectId}
                          onValueChange={setUploadProjectId}
                        >
                          <SelectTrigger className={!uploadProjectId ? "border-red-500" : ""}>
                            <SelectValue placeholder="Select a project for these requirements" />
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
                      <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                          isDragActive ? "border-primary bg-primary/5" : "border-muted"
                        }`}
                      >
                        <input {...getInputProps()} />
                        <FileUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        {isDragActive ? (
                          <p>Drop the files here...</p>
                        ) : (
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Drag & drop files here, or click to select
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Supports PDF, TXT, and Markdown files
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                        Cancel
                      </Button>
                    </DialogFooter>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-6"
                  >
                    {documentAnalysis && (
                      <DocumentGapQuestionnaire
                        documentAnalysis={documentAnalysis}
                        onComplete={handleDocumentGapsComplete}
                        onSkip={handleDocumentGapsSkip}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </DialogContent>
          </Dialog>

          {/* <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
            <DialogTrigger asChild>
              <Button disabled className="opacity-50 cursor-not-allowed">
                <Sparkles className="mr-2 h-4 w-4" />
                AI Generate
              </Button>
            </DialogTrigger> */}
            {/* Commenting out AI Generate button and keeping dialog for future use */}
          <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
              <AnimatePresence mode="wait">
                {!showGuidedFlow && !generationMode ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <DialogHeader>
                      <DialogTitle>Choose Generation Method</DialogTitle>
                      <DialogDescription>
                        Select how you&apos;d like to generate requirements for your healthcare software
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card
                            className="cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => setShowGuidedFlow(true)}
                          >
                            <CardHeader>
                              <div className="flex items-start space-x-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600">
                                  <MessageSquare className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  <CardTitle className="text-lg">Guided Interview</CardTitle>
                                  <Badge variant="default" className="mt-2">Recommended</Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">
                                Answer step-by-step questions tailored to healthcare software.
                                Our AI will gather comprehensive information to generate precise,
                                compliance-ready requirements.
                              </p>
                              <div className="mt-4 space-y-2">
                                <div className="flex items-center text-sm">
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                  <span>Comprehensive coverage</span>
                                </div>
                                <div className="flex items-center text-sm">
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                  <span>Compliance-focused</span>
                                </div>
                                <div className="flex items-center text-sm">
                                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                                  <span>Skip questions anytime</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>

                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Card
                            className="cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => setGenerationMode("quick")}
                          >
                            <CardHeader>
                              <div className="flex items-start space-x-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-teal-600">
                                  <Wand2 className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  <CardTitle className="text-lg">Quick Generate</CardTitle>
                                  <Badge variant="secondary" className="mt-2">Fast</Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">
                                Provide basic project information and let AI generate requirements
                                immediately. Best for experienced users who know exactly what they need.
                              </p>
                              <div className="mt-4 space-y-2">
                                <div className="flex items-center text-sm">
                                  <Zap className="h-4 w-4 mr-2 text-blue-600" />
                                  <span>Quick setup</span>
                                </div>
                                <div className="flex items-center text-sm">
                                  <Zap className="h-4 w-4 mr-2 text-blue-600" />
                                  <span>Basic requirements</span>
                                </div>
                                <div className="flex items-center text-sm">
                                  <Zap className="h-4 w-4 mr-2 text-blue-600" />
                                  <span>Manual input</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>
                        Cancel
                      </Button>
                    </DialogFooter>
                  </motion.div>
                ) : showGuidedFlow ? (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-6"
                  >
                    <GuidedQuestionnaire
                      onComplete={handleQuestionnaireComplete}
                      onSkip={handleSkipQuestionnaire}
                    />
                  </motion.div>
                ) : generationMode === "quick" ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <DialogHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <DialogTitle>Quick Requirements Generation</DialogTitle>
                          <DialogDescription>
                            Provide basic information to generate requirements
                          </DialogDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setGenerationMode(null)
                            setShowGuidedFlow(false)
                          }}
                        >
                          ← Back
                        </Button>
                      </div>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Project Context</Label>
                        <Textarea
                          placeholder="Describe your healthcare software project..."
                          className="min-h-[100px]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Software Type</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="samd">SaMD</SelectItem>
                              <SelectItem value="simd">SiMD</SelectItem>
                              <SelectItem value="ehr">EHR System</SelectItem>
                              <SelectItem value="clinical">Clinical Decision Support</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Compliance Standards</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="Select standards" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fda">FDA 21 CFR Part 11</SelectItem>
                              <SelectItem value="iso13485">ISO 13485</SelectItem>
                              <SelectItem value="iec62304">IEC 62304</SelectItem>
                              <SelectItem value="hipaa">HIPAA</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
                        <div className="flex items-start space-x-3">
                          <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                              Quick Generation
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                              For more comprehensive requirements, try our Guided Interview mode
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleGenerateRequirements}>
                        Generate Requirements
                      </Button>
                    </DialogFooter>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Create Requirement Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Requirement</DialogTitle>
            <DialogDescription>
              Create a new requirement and assign it to a project
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <Select
                value={newRequirement.projectId}
                onValueChange={(value) => setNewRequirement({ ...newRequirement, projectId: value })}
              >
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
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
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
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={newRequirement.source}
                onChange={(e) => setNewRequirement({ ...newRequirement, source: e.target.value })}
                placeholder="e.g., User Story US-234, Compliance Doc"
              />
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

      <Card>
        <CardHeader>
          <CardTitle>Requirements Overview</CardTitle>
          <CardDescription>
            Manage and track all project requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Requirements</TabsTrigger>
              <TabsTrigger value="functional">Functional</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-4">
              {renderRequirementsTable(filteredRequirements)}
            </TabsContent>
            <TabsContent value="functional" className="space-y-4">
              {renderRequirementsTable(getFilteredRequirements("functional"))}
            </TabsContent>
            <TabsContent value="security" className="space-y-4">
              {renderRequirementsTable(getFilteredRequirements("security"))}
            </TabsContent>
            <TabsContent value="performance" className="space-y-4">
              {renderRequirementsTable(getFilteredRequirements("performance"))}
            </TabsContent>
            <TabsContent value="compliance" className="space-y-4">
              {renderRequirementsTable(getFilteredRequirements("compliance"))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Test Cases Dialog */}
      <Dialog open={!!selectedRequirement} onOpenChange={() => setSelectedRequirement(null)}>
        <DialogContent
          className={cn(
            "w-[90vw] max-w-[1600px]",
            "h-[85vh] max-h-[85vh]",
            "sm:max-w-[90vw] sm:w-[90vw]",
            "md:max-w-[1600px] md:w-[90vw]",
            "overflow-hidden flex flex-col"
          )}>
          <DialogHeader>
            <DialogTitle>Test Cases for Requirement</DialogTitle>
            <DialogDescription>
              {selectedRequirement?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {loadingTestCases ? (
              <div className="p-8 text-center">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>
              </div>
            ) : editingTestCase ? (
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Edit Test Case</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGetSuggestions}
                      disabled={loadingSuggestions}
                    >
                      {loadingSuggestions ? (
                        <>Getting AI Suggestions...</>
                      ) : (
                        <><Lightbulb className="mr-2 h-4 w-4" />Get AI Suggestions</>
                      )}
                    </Button>
                    {aiSuggestions && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleApplySuggestions}
                      >
                        Apply Suggestions
                      </Button>
                    )}
                  </div>
                </div>

                {aiSuggestions && (
                  <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100">AI Suggestions</h4>
                      </div>
                      {aiSuggestions.improvements && aiSuggestions.improvements.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Improvements:</p>
                          <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-300">
                            {aiSuggestions.improvements.map((improvement: string, idx: number) => (
                              <li key={idx}>{improvement}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {aiSuggestions.complianceGaps && aiSuggestions.complianceGaps.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Compliance Gaps:</p>
                          <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-300">
                            {aiSuggestions.complianceGaps.map((gap: string, idx: number) => (
                              <li key={idx}>{gap}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      placeholder="Test case title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      placeholder="Test case description"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-steps">Test Steps</Label>
                    <Textarea
                      id="edit-steps"
                      value={editForm.testSteps}
                      onChange={(e) => setEditForm({ ...editForm, testSteps: e.target.value })}
                      placeholder="1. First step\n2. Second step\n3. Third step"
                      rows={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-expected">Expected Results</Label>
                    <Textarea
                      id="edit-expected"
                      value={editForm.expectedResults}
                      onChange={(e) => setEditForm({ ...editForm, expectedResults: e.target.value })}
                      placeholder="Expected outcome of the test"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-category">Category</Label>
                      <Select
                        value={editForm.category}
                        onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                      >
                        <SelectTrigger id="edit-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="functional">Functional</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="performance">Performance</SelectItem>
                          <SelectItem value="usability">Usability</SelectItem>
                          <SelectItem value="compliance">Compliance</SelectItem>
                          <SelectItem value="integration">Integration</SelectItem>
                          <SelectItem value="regression">Regression</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-priority">Priority</Label>
                      <Select
                        value={editForm.priority}
                        onValueChange={(value) => setEditForm({ ...editForm, priority: value })}
                      >
                        <SelectTrigger id="edit-priority">
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
                    <Label htmlFor="edit-compliance">Compliance Tags</Label>
                    <Input
                      id="edit-compliance"
                      value={editForm.complianceTags}
                      onChange={(e) => setEditForm({ ...editForm, complianceTags: e.target.value })}
                      placeholder="HIPAA, FDA 21 CFR Part 11, ISO 13485"
                    />
                    <p className="text-xs text-muted-foreground">Separate multiple tags with commas</p>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={savingTestCase}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveTestCase}
                      disabled={savingTestCase}
                    >
                      {savingTestCase ? (
                        <>Saving...</>
                      ) : (
                        <><Save className="mr-2 h-4 w-4" />Save Changes</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : requirementTestCases.length > 0 ? (
              <div className="space-y-4 p-4">
                {requirementTestCases.map((testCase) => (
                  <Card key={testCase.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold">{testCase.title}</h4>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTestCase(testCase)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Badge variant={testCase.priority === 'critical' || testCase.priority === 'high' ? 'destructive' : testCase.priority === 'medium' ? 'secondary' : 'outline'}>
                            {testCase.priority}
                          </Badge>
                          <Badge variant="outline">{testCase.category}</Badge>
                        </div>
                      </div>
                      {testCase.description && (
                        <p className="text-sm text-muted-foreground">{testCase.description}</p>
                      )}
                      {testCase.testSteps && (
                        <div>
                          <p className="text-sm font-medium mb-1">Test Steps:</p>
                          <pre className="text-sm whitespace-pre-wrap bg-muted p-2 rounded">{testCase.testSteps}</pre>
                        </div>
                      )}
                      {testCase.expectedResults && (
                        <div>
                          <p className="text-sm font-medium mb-1">Expected Results:</p>
                          <p className="text-sm bg-muted p-2 rounded">{testCase.expectedResults}</p>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Badge variant={testCase.status === 'passed' ? 'default' : testCase.status === 'failed' ? 'destructive' : 'secondary'}>
                          {testCase.status}
                        </Badge>
                        {testCase.automationStatus && (
                          <Badge variant="outline">{testCase.automationStatus}</Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <TestTube className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-muted-foreground">No test cases found for this requirement</p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    setSelectedRequirement(null)
                    // Optionally trigger test case generation
                    toast.info('You can generate test cases from the Test Cases page')
                  }}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Test Cases
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequirement(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}