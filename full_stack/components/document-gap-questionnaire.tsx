"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  FileText,
  Shield,
  Users,
  Target,
  Globe,
  Activity,
  Brain,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
  Package,
  Heart,
  Stethoscope,
  Pill,
  ClipboardCheck,
  Database,
  Lock,
  SkipForward,
  PlayCircle,
  FileSearch,
  HelpCircle,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Document analysis result - what was found and what's missing
export interface DocumentAnalysis {
  documentInfo: {
    fileName: string
    fileSize: string
    pages?: number
    uploadedAt: string
  }
  extractedInfo: {
    projectType?: string
    softwareName?: string
    targetUsers?: string[]
    complianceStandards?: string[]
    regions?: string[]
    dataHandling?: string
    integrations?: string[]
    riskLevel?: string
    clinicalFeatures?: string[]
    text?: string  // Document text content
    sections?: any[]  // Document sections
    requirements?: Array<{
      id: string
      title: string
      type: string
    }>
  }
  missingInfo: {
    critical: string[]
    important: string[]
    optional: string[]
  }
  confidenceScores: {
    overall: number
    sections: Record<string, number>
  }
  dynamicQuestions?: Array<{
    id: string
    category: 'critical' | 'important' | 'optional'
    type: 'single' | 'multiple' | 'text' | 'cards'
    question: string
    reason: string
    documentContext?: string
    options?: Array<{
      value: string
      label: string
      description?: string
    }>
    placeholder?: string
  }>
}

interface GapQuestion {
  id: string
  category: "critical" | "important" | "optional"
  type: "single" | "multiple" | "text" | "textarea" | "cards"
  question: string
  reason: string // Why we're asking this
  foundContext?: string // What we found related to this
  icon?: React.ComponentType<{ className?: string }>
  options?: {
    value: string
    originalValue?: string // Original value from backend for dynamic questions
    label: string
    description?: string
    icon?: React.ComponentType<{ className?: string }>
  }[]
  placeholder?: string
  skipLabel?: string
}

// Generate questions based on what's missing from the document
const generateQuestionsFromGaps = (analysis: DocumentAnalysis): GapQuestion[] => {
  // Use dynamic questions if available, otherwise fall back to hardcoded ones
  if (analysis.dynamicQuestions && analysis.dynamicQuestions.length > 0) {
    // Use the dynamically generated questions from the backend
    console.log('Dynamic questions:', analysis.dynamicQuestions)

    // Process dynamic questions and ensure unique IDs
    return analysis.dynamicQuestions.map((q, qIndex) => ({
      ...q,
      id: q.id || `dynamic-question-${qIndex}`, // Ensure each question has a unique ID
      // Keep original option values but store them with originalValue
      options: q.options?.map((opt, optIndex) => ({
        ...opt,
        originalValue: opt.value, // Store the original value
        value: `${q.id || `dynamic-q-${qIndex}`}-opt-${optIndex}` // Create truly unique values
      })),
      icon: q.category === 'critical' ? AlertTriangle :
            q.category === 'important' ? Info :
            HelpCircle,
      skipLabel: q.category !== 'critical' ? 'Skip for now' : undefined
    }))
  }

  // Fallback to hardcoded questions if dynamic ones aren't available
  const questions: GapQuestion[] = []
  const MAX_QUESTIONS = 10
  const MIN_QUESTIONS = 3

  // Critical gaps - must have for compliance
  if (!analysis.extractedInfo.projectType) {
    questions.push({
      id: "project-type",
      category: "critical",
      type: "cards",
      question: "What type of healthcare software is described in your document?",
      reason: "We couldn't clearly identify the software type from your document. This is essential for determining regulatory requirements.",
      foundContext: "Your document mentions medical software but doesn't specify the exact category.",
      icon: Package,
      options: [
        {
          value: "samd",
          label: "Software as Medical Device (SaMD)",
          description: "Standalone software with medical purpose",
          icon: Activity,
        },
        {
          value: "simd",
          label: "Software in Medical Device (SiMD)",
          description: "Software that drives hardware medical device",
          icon: Heart,
        },
        {
          value: "ehr",
          label: "Electronic Health Records (EHR)",
          description: "Patient data management system",
          icon: Database,
        },
        {
          value: "clinical",
          label: "Clinical Decision Support",
          description: "AI-powered diagnostic assistance",
          icon: Brain,
        },
      ],
    })
  }

  if (!analysis.extractedInfo.riskLevel) {
    questions.push({
      id: "risk-level",
      category: "critical",
      type: "single",
      question: "What is the medical device software safety classification?",
      reason: "Software safety classification is crucial for determining IEC 62304 lifecycle requirements, FDA submission pathway (510(k) vs PMA), and the depth of V&V testing needed. Each class has specific documentation and testing requirements.",
      foundContext: analysis.extractedInfo.clinicalFeatures?.length
        ? `Your document mentions ${analysis.extractedInfo.clinicalFeatures.join(", ")} which may indicate risk level.`
        : undefined,
      icon: AlertTriangle,
      options: [
        {
          value: "class-a",
          label: "IEC 62304 Class A",
          description: "No injury or damage to health is possible - Basic testing required",
        },
        {
          value: "class-b",
          label: "IEC 62304 Class B / FDA Class II",
          description: "Non-serious injury possible - Enhanced testing with unit & integration tests",
        },
        {
          value: "class-c",
          label: "IEC 62304 Class C / FDA Class III",
          description: "Death or serious injury possible - Full V&V with formal methods",
        },
      ],
      skipLabel: "Not a medical device",
    })
  }

  if (!analysis.extractedInfo.regions || analysis.extractedInfo.regions.length === 0) {
    questions.push({
      id: "target-regions",
      category: "critical",
      type: "multiple",
      question: "Which regions will your software be deployed in?",
      reason: "Target regions weren't clearly specified. This is crucial for compliance requirements.",
      icon: Globe,
      options: [
        {
          value: "usa",
          label: "United States",
          description: "FDA, HIPAA regulations",
        },
        {
          value: "eu",
          label: "European Union",
          description: "MDR, GDPR regulations",
        },
        {
          value: "uk",
          label: "United Kingdom",
          description: "MHRA regulations",
        },
      ],
    })
  }

  // Add compliance standards question if missing
  if (!analysis.extractedInfo.complianceStandards || analysis.extractedInfo.complianceStandards.length === 0) {
    questions.push({
      id: "compliance-standards",
      category: "critical",
      type: "multiple",
      question: "Which medical regulatory standards and certifications are required?",
      reason: "Regulatory compliance directly impacts test strategy. FDA requires specific validation protocols, HIPAA mandates security testing, and ISO standards define quality management requirements.",
      foundContext: analysis.extractedInfo.regions?.length ?
        `Deployment in ${analysis.extractedInfo.regions.join(", ")} will require specific certifications.` :
        "Each market has mandatory compliance requirements.",
      icon: Shield,
      options: [
        { value: "fda-510k", label: "FDA 510(k) Clearance", description: "US medical device market entry" },
        { value: "fda-pma", label: "FDA PMA", description: "High-risk device approval" },
        { value: "hipaa", label: "HIPAA Compliance", description: "PHI protection requirements" },
        { value: "ce-mdr", label: "CE Mark under MDR", description: "EU medical device regulation" },
        { value: "iso-13485", label: "ISO 13485", description: "Quality management system" },
        { value: "iec-62304", label: "IEC 62304", description: "Medical device software lifecycle" },
        { value: "iso-14971", label: "ISO 14971", description: "Risk management standard" },
      ],
    })
  }

  // Important gaps - should have for comprehensive testing
  if (!analysis.extractedInfo.targetUsers || analysis.extractedInfo.targetUsers.length === 0) {
    if (questions.length < MAX_QUESTIONS) {
      questions.push({
        id: "target-users",
        category: "important",
        type: "multiple",
        question: "Who are the clinical end users requiring validation?",
        reason: "User roles determine access control testing, workflow validation, and usability testing requirements per IEC 62366.",
        foundContext: "Each user type requires specific test scenarios and permission testing.",
        icon: Users,
        options: [
          { value: "physicians", label: "Physicians/Specialists", description: "Clinical decision makers" },
          { value: "nurses", label: "Nurses/Clinical Staff", description: "Primary system users" },
          { value: "patients", label: "Patients/Caregivers", description: "Consumer access" },
          { value: "lab-tech", label: "Lab/Imaging Technicians", description: "Diagnostic operators" },
          { value: "administrators", label: "Healthcare IT/Admins", description: "System configuration" },
        ],
        skipLabel: "Define during testing",
      })
    }
  }

  if (!analysis.extractedInfo.dataHandling && questions.length < MAX_QUESTIONS) {
    questions.push({
      id: "data-handling",
      category: "critical",
      type: "cards",
      question: "What type of patient data will be processed and stored?",
      reason: "Data classification drives security testing requirements, audit logging needs, encryption standards (AES-256), and 21 CFR Part 11 compliance for electronic records.",
      foundContext: analysis.extractedInfo.complianceStandards?.includes("HIPAA")
        ? "HIPAA compliance mentioned suggests PHI handling."
        : undefined,
      icon: Lock,
      options: [
        {
          value: "phi",
          label: "Protected Health Information (PHI)",
          description: "Full HIPAA compliance, encryption, audit trails required",
          icon: Database,
        },
        {
          value: "electronic-records",
          label: "Electronic Medical Records",
          description: "21 CFR Part 11 compliance, ALCOA+ principles apply",
          icon: FileText,
        },
        {
          value: "diagnostic-data",
          label: "Diagnostic/Clinical Data",
          description: "DICOM, HL7, clinical decision support data",
          icon: Activity,
        },
        {
          value: "deidentified",
          label: "De-identified/Research Data",
          description: "Reduced compliance burden, IRB considerations",
          icon: Lock,
        },
      ],
    })
  }

  // Add critical testing requirements questions
  if (questions.length < MAX_QUESTIONS &&
      (!analysis.extractedInfo.clinicalFeatures || analysis.extractedInfo.clinicalFeatures.length === 0)) {
    questions.push({
      id: "clinical-validation",
      category: "critical",
      type: "cards",
      question: "What clinical validation and testing is required?",
      reason: "Clinical validation determines test protocols, sample size requirements, statistical analysis methods, and whether clinical trials or usability studies per IEC 62366 are needed.",
      icon: ClipboardCheck,
      options: [
        {
          value: "clinical-trial",
          label: "Clinical Trial/Study",
          description: "FDA IDE, IRB approval, GCP compliance",
        },
        {
          value: "analytical-validation",
          label: "Analytical/Technical Validation",
          description: "Algorithm performance, sensitivity/specificity",
        },
        {
          value: "usability-studies",
          label: "Human Factors/Usability (IEC 62366)",
          description: "User interface validation, use errors analysis",
        },
        {
          value: "bench-testing",
          label: "Verification & Validation (V&V)",
          description: "Software testing per IEC 62304 requirements",
        },
      ],
    })
  }

  // Add interoperability question if space available
  if (questions.length < MAX_QUESTIONS &&
      (!analysis.extractedInfo.integrations || analysis.extractedInfo.integrations.length === 0)) {
    questions.push({
      id: "interoperability",
      category: "important",
      type: "multiple",
      question: "Which healthcare interoperability standards are required?",
      reason: "Interoperability testing ensures data exchange compliance, interface validation, and conformance to healthcare IT standards.",
      icon: Zap,
      options: [
        { value: "hl7-fhir", label: "HL7 FHIR", description: "Modern REST API standard" },
        { value: "hl7-v2", label: "HL7 v2.x", description: "Legacy messaging standard" },
        { value: "dicom", label: "DICOM", description: "Medical imaging standard" },
        { value: "cda", label: "C-CDA", description: "Clinical document exchange" },
        { value: "x12", label: "X12/EDI", description: "Insurance/billing data" },
        { value: "ncpdp", label: "NCPDP", description: "Pharmacy data exchange" },
      ],
      skipLabel: "No integrations required",
    })
  }

  // Ensure we have at least MIN_QUESTIONS
  if (questions.length < MIN_QUESTIONS) {
    // Add performance/reliability question
    questions.push({
      id: "performance-requirements",
      category: "important",
      type: "cards",
      question: "What are your critical performance and reliability requirements?",
      reason: "Performance criteria define load testing scenarios, stress testing parameters, and availability requirements for medical systems.",
      icon: Zap,
      options: [
        {
          value: "high-availability",
          label: "24/7 High Availability (99.9%+)",
          description: "Critical care, emergency systems",
        },
        {
          value: "real-time",
          label: "Real-time Processing (<100ms)",
          description: "Patient monitoring, alerts",
        },
        {
          value: "high-throughput",
          label: "High Volume Processing",
          description: "Lab systems, imaging workflows",
        },
        {
          value: "standard",
          label: "Standard Clinical Workflow",
          description: "Typical response times acceptable",
        },
      ],
    })
  }

  // Limit to MAX_QUESTIONS
  return questions.slice(0, MAX_QUESTIONS)
}

interface DocumentGapQuestionnaireProps {
  documentAnalysis: DocumentAnalysis
  onComplete: (answers: Record<string, string | string[] | number>) => void
  onSkip: () => void
}

export function DocumentGapQuestionnaire({
  documentAnalysis,
  onComplete,
  onSkip,
}: DocumentGapQuestionnaireProps) {
  const [questions] = useState<GapQuestion[]>(() =>
    generateQuestionsFromGaps(documentAnalysis)
  )
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({})
  const [currentAnswer, setCurrentAnswer] = useState<string | string[] | number | null>(null)
  const [selectedCards, setSelectedCards] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const criticalQuestions = questions.filter(q => q.category === "critical")
  const importantQuestions = questions.filter(q => q.category === "important")
  const optionalQuestions = questions.filter(q => q.category === "optional")

  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0
    ? ((currentQuestionIndex + 1) / questions.length) * 100
    : 0

  const totalGaps = documentAnalysis.missingInfo.critical.length +
                    documentAnalysis.missingInfo.important.length +
                    documentAnalysis.missingInfo.optional.length

  const handleNext = async () => {
    if (currentAnswer !== null || currentQuestion?.skipLabel) {
      const newAnswers = { ...answers }
      if (currentAnswer !== null) {
        // Extract original values for dynamic questions
        let answerToStore = currentAnswer

        // For single/cards selections with dynamic questions, use original values
        if (typeof currentAnswer === 'string' && currentQuestion.options) {
          const selectedOption = currentQuestion.options.find(opt => opt.value === currentAnswer)
          if (selectedOption?.originalValue) {
            answerToStore = selectedOption.originalValue
          }
        }
        // For multiple selections with dynamic questions, map to original values
        else if (Array.isArray(currentAnswer) && currentQuestion.options) {
          answerToStore = currentAnswer.map(val => {
            const option = currentQuestion.options?.find(opt => opt.value === val)
            return option?.originalValue || val
          })
        }

        newAnswers[currentQuestion.id] = answerToStore
      }
      setAnswers(newAnswers)

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        setCurrentAnswer(null)
        setSelectedCards([])
      } else {
        setIsSubmitting(true)
        await onComplete(newAnswers)
        // Note: Component will likely be unmounted after onComplete,
        // so we don't need to setIsSubmitting(false)
      }
    }
  }

  const handleSkipQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setCurrentAnswer(null)
      setSelectedCards([])
    } else {
      setIsSubmitting(true)
      await onComplete(answers)
    }
  }

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      const prevQuestion = questions[currentQuestionIndex - 1]
      setCurrentAnswer(answers[prevQuestion.id] || null)
      if (prevQuestion.type === "multiple") {
        const prevAnswer = answers[prevQuestion.id]
        setSelectedCards(Array.isArray(prevAnswer) ? prevAnswer : [])
      }
    }
  }

  const handleFinishEarly = () => {
    onComplete(answers)
  }

  const handleCardSelect = (value: string) => {
    if (currentQuestion.type === "cards") {
      setCurrentAnswer(value)
    } else if (currentQuestion.type === "multiple") {
      const newSelection = selectedCards.includes(value)
        ? selectedCards.filter(v => v !== value)
        : [...selectedCards, value]
      setSelectedCards(newSelection)
      setCurrentAnswer(newSelection.length > 0 ? newSelection : null)
    }
  }

  const QuestionIcon = currentQuestion?.icon || FileText

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "critical": return "text-red-600 bg-red-50 dark:bg-red-950"
      case "important": return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950"
      case "optional": return "text-blue-600 bg-blue-50 dark:bg-blue-950"
      default: return "text-gray-600 bg-gray-50 dark:bg-gray-950"
    }
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "critical": return <Badge variant="destructive">Required</Badge>
      case "important": return <Badge variant="default">Recommended</Badge>
      case "optional": return <Badge variant="secondary">Optional</Badge>
      default: return null
    }
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Document Analysis Complete</h3>
        <p className="text-muted-foreground mb-6">
          Your document contains all necessary information. No additional details needed!
        </p>
        <Button onClick={() => onComplete({})}>
          Generate Requirements
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 relative">
      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold">Generating Requirements and Test Cases</p>
              <p className="text-sm text-muted-foreground">
                Analyzing your answers and document content...
              </p>
              <p className="text-xs text-muted-foreground">
                This may take 5 to 10 mins
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Document Analysis Summary */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileSearch className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Document Analysis Complete</CardTitle>
                <CardDescription>
                  {documentAnalysis.documentInfo.fileName} • {documentAnalysis.documentInfo.pages} pages
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                {Math.round(documentAnalysis.confidenceScores.overall)}%
              </p>
              <p className="text-xs text-muted-foreground">Confidence</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">{criticalQuestions.length} Critical</span>
              </div>
              <p className="text-xs text-muted-foreground">Must have</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center space-x-2">
                <Info className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">{importantQuestions.length} Important</span>
              </div>
              <p className="text-xs text-muted-foreground">Should have</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center space-x-2">
                <HelpCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">{optionalQuestions.length} Optional</span>
              </div>
              <p className="text-xs text-muted-foreground">Nice to have</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress and Navigation */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <div className="flex items-center space-x-2">
            {Object.keys(answers).length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleFinishEarly}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Continue with {Object.keys(answers).length} answers
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
            >
              <SkipForward className="mr-2 h-4 w-4" />
              Skip All
            </Button>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Current Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-2">
            <CardHeader>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      getCategoryColor(currentQuestion.category)
                    )}>
                      <QuestionIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        {getCategoryBadge(currentQuestion.category)}
                        <Badge variant="outline" className="text-xs">
                          Gap detected in document
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">
                        {currentQuestion.question}
                      </CardTitle>
                      <CardDescription>
                        <Lightbulb className="inline h-3 w-3 mr-1" />
                        {currentQuestion.reason}
                      </CardDescription>
                      {currentQuestion.foundContext && (
                        <Alert className="mt-3">
                          <Info className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Context from your document:</strong> {currentQuestion.foundContext}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentQuestion.type === "cards" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.options?.map((option, index) => {
                    const OptionIcon = option.icon || FileText
                    const isSelected = currentAnswer === option.value
                    return (
                      <motion.div
                        key={`${currentQuestion.id}-card-${index}`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-md",
                            isSelected && "border-primary ring-2 ring-primary ring-offset-2"
                          )}
                          onClick={() => setCurrentAnswer(option.value)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <div className={cn(
                                "p-2 rounded-lg",
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary"
                              )}>
                                <OptionIcon className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{option.label}</p>
                                {option.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {option.description}
                                  </p>
                                )}
                              </div>
                              {isSelected && (
                                <CheckCircle className="h-5 w-5 text-primary" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {currentQuestion.type === "multiple" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {currentQuestion.options?.map((option, index) => {
                    const isSelected = selectedCards.includes(option.value)
                    return (
                      <motion.div
                        key={`${currentQuestion.id}-multi-${index}`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div
                          className={cn(
                            "p-3 rounded-lg border-2 cursor-pointer transition-all",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground"
                          )}
                          onClick={() => handleCardSelect(option.value)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">{option.label}</p>
                              {option.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {option.description}
                                </p>
                              )}
                            </div>
                            <div className={cn(
                              "h-5 w-5 rounded border-2 flex items-center justify-center",
                              isSelected
                                ? "bg-primary border-primary"
                                : "border-muted-foreground"
                            )}>
                              {isSelected && (
                                <CheckCircle className="h-3 w-3 text-primary-foreground" />
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {currentQuestion.type === "single" && (
                <RadioGroup
                  value={typeof currentAnswer === "string" ? currentAnswer : ""}
                  onValueChange={(value) => setCurrentAnswer(value)}
                >
                  <div className="space-y-3">
                    {currentQuestion.options?.map((option, index) => (
                      <label
                        key={`${currentQuestion.id}-single-${index}`}
                        className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <RadioGroupItem value={option.value} className="mt-1" />
                        <div className="flex-1">
                          <p className="font-medium">{option.label}</p>
                          {option.description && (
                            <p className="text-sm text-muted-foreground">
                              {option.description}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </RadioGroup>
              )}

              {currentQuestion.type === "text" && (
                <div className="space-y-2">
                  <Input
                    placeholder={currentQuestion.placeholder}
                    value={currentAnswer || ""}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    className="text-base"
                  />
                </div>
              )}

              {currentQuestion.type === "textarea" && (
                <div className="space-y-2">
                  <Textarea
                    placeholder={currentQuestion.placeholder}
                    value={currentAnswer || ""}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    className="min-h-[120px] text-base"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentQuestionIndex === 0 || isSubmitting}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center space-x-3">
          {currentQuestion.skipLabel && (
            <Button
              variant="ghost"
              onClick={handleSkipQuestion}
              disabled={isSubmitting}
            >
              {currentQuestion.skipLabel}
            </Button>
          )}

          <Button
            onClick={handleNext}
            disabled={isSubmitting || (currentQuestion.category === "critical" && currentAnswer === null && !currentQuestion.skipLabel)}
          >
            {currentQuestionIndex === questions.length - 1 ? (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Complete Analysis
              </>
            ) : (
              <>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}