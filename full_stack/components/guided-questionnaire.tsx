"use client"

import { useState } from "react"
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
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Question {
  id: string
  type: "single" | "multiple" | "text" | "textarea" | "cards"
  question: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  required?: boolean
  options?: {
    value: string
    label: string
    description?: string
    icon?: React.ComponentType<{ className?: string }>
  }[]
  placeholder?: string
  validation?: (value: string | string[] | number) => boolean
  nextQuestion?: (value: string | string[] | number) => string | null
  category?: string
}

const questions: Question[] = [
  {
    id: "project-type",
    type: "cards",
    question: "What type of healthcare software are you developing?",
    description: "This helps us understand the regulatory requirements",
    icon: Package,
    required: true,
    category: "Project Information",
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
        description: "Software that drives or controls a hardware medical device",
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
        description: "AI-powered diagnostic or treatment recommendations",
        icon: Brain,
      },
      {
        value: "telemedicine",
        label: "Telemedicine Platform",
        description: "Remote patient consultation and monitoring",
        icon: Globe,
      },
      {
        value: "pharmacy",
        label: "Pharmacy Management",
        description: "Prescription and medication management",
        icon: Pill,
      },
    ],
    nextQuestion: (value) => "risk-class",
  },
  {
    id: "risk-class",
    type: "single",
    question: "What is the risk classification of your software?",
    description: "Based on IEC 62304 and FDA guidance",
    icon: AlertTriangle,
    required: false,
    category: "Risk Assessment",
    options: [
      {
        value: "class-a",
        label: "Class A (Low Risk)",
        description: "No injury or damage to health possible",
      },
      {
        value: "class-b",
        label: "Class B (Medium Risk)",
        description: "Non-serious injury possible",
      },
      {
        value: "class-c",
        label: "Class C (High Risk)",
        description: "Death or serious injury possible",
      },
      {
        value: "unknown",
        label: "Not sure yet",
        description: "We'll help you determine this",
      },
    ],
    nextQuestion: (value) => "target-regions",
  },
  {
    id: "target-regions",
    type: "multiple",
    question: "Which regions will your software be deployed in?",
    description: "Select all that apply for compliance mapping",
    icon: Globe,
    required: true,
    category: "Compliance Regions",
    options: [
      {
        value: "usa",
        label: "United States",
        description: "FDA, HIPAA regulations",
        icon: Shield,
      },
      {
        value: "eu",
        label: "European Union",
        description: "MDR, IVDR, GDPR regulations",
        icon: Shield,
      },
      {
        value: "india",
        label: "India",
        description: "CDSCO, ICMR guidelines",
        icon: Shield,
      },
      {
        value: "uk",
        label: "United Kingdom",
        description: "MHRA regulations",
        icon: Shield,
      },
      {
        value: "canada",
        label: "Canada",
        description: "Health Canada regulations",
        icon: Shield,
      },
      {
        value: "australia",
        label: "Australia",
        description: "TGA regulations",
        icon: Shield,
      },
    ],
    nextQuestion: (value) => "patient-data",
  },
  {
    id: "patient-data",
    type: "cards",
    question: "Will your software handle patient data?",
    description: "This determines privacy and security requirements",
    icon: Lock,
    required: true,
    category: "Data Privacy",
    options: [
      {
        value: "yes-phi",
        label: "Yes, Protected Health Information (PHI)",
        description: "Names, addresses, medical records",
        icon: Database,
      },
      {
        value: "yes-anonymous",
        label: "Yes, but anonymized/de-identified",
        description: "No personally identifiable information",
        icon: Lock,
      },
      {
        value: "no",
        label: "No patient data",
        description: "Only healthcare provider data",
        icon: Users,
      },
    ],
    nextQuestion: (value) => value !== "no" ? "data-storage" : "integration-needs",
  },
  {
    id: "data-storage",
    type: "single",
    question: "Where will patient data be stored?",
    description: "Storage location affects compliance requirements",
    icon: Database,
    required: false,
    category: "Data Management",
    options: [
      {
        value: "cloud",
        label: "Cloud Storage",
        description: "AWS, Google Cloud, Azure",
      },
      {
        value: "on-premise",
        label: "On-Premise",
        description: "Hospital/clinic servers",
      },
      {
        value: "hybrid",
        label: "Hybrid",
        description: "Combination of cloud and on-premise",
      },
      {
        value: "edge",
        label: "Edge Devices",
        description: "Local device storage",
      },
    ],
    nextQuestion: (value) => "integration-needs",
  },
  {
    id: "integration-needs",
    type: "multiple",
    question: "What systems will your software integrate with?",
    description: "Understanding integration requirements for comprehensive testing",
    icon: Zap,
    required: false,
    category: "System Integration",
    options: [
      {
        value: "ehr-systems",
        label: "EHR/EMR Systems",
        description: "Epic, Cerner, Allscripts",
      },
      {
        value: "medical-devices",
        label: "Medical Devices",
        description: "Monitors, imaging equipment",
      },
      {
        value: "lab-systems",
        label: "Laboratory Systems",
        description: "LIS, LIMS",
      },
      {
        value: "pharmacy",
        label: "Pharmacy Systems",
        description: "e-Prescribing, dispensing",
      },
      {
        value: "billing",
        label: "Billing Systems",
        description: "Insurance, claims processing",
      },
      {
        value: "none",
        label: "Standalone System",
        description: "No external integrations",
      },
    ],
    nextQuestion: (value) => "clinical-features",
  },
  {
    id: "clinical-features",
    type: "multiple",
    question: "What clinical features will your software include?",
    description: "Helps determine specific testing requirements",
    icon: Stethoscope,
    required: false,
    category: "Clinical Functionality",
    options: [
      {
        value: "diagnosis",
        label: "Diagnostic Support",
        description: "Disease detection, analysis",
      },
      {
        value: "treatment",
        label: "Treatment Recommendations",
        description: "Therapy suggestions, protocols",
      },
      {
        value: "monitoring",
        label: "Patient Monitoring",
        description: "Vital signs, continuous tracking",
      },
      {
        value: "alerts",
        label: "Clinical Alerts",
        description: "Warnings, notifications",
      },
      {
        value: "imaging",
        label: "Medical Imaging",
        description: "X-ray, MRI, CT analysis",
      },
      {
        value: "calculations",
        label: "Clinical Calculations",
        description: "Dosing, risk scores",
      },
    ],
    nextQuestion: (value) => "user-types",
  },
  {
    id: "user-types",
    type: "multiple",
    question: "Who will be using your software?",
    description: "Different users require different testing scenarios",
    icon: Users,
    required: true,
    category: "User Requirements",
    options: [
      {
        value: "doctors",
        label: "Physicians/Doctors",
        description: "Clinical staff",
      },
      {
        value: "nurses",
        label: "Nurses",
        description: "Nursing staff",
      },
      {
        value: "patients",
        label: "Patients",
        description: "End users/consumers",
      },
      {
        value: "admins",
        label: "Administrators",
        description: "IT/System admins",
      },
      {
        value: "technicians",
        label: "Lab/Radiology Technicians",
        description: "Technical staff",
      },
      {
        value: "caregivers",
        label: "Caregivers/Family",
        description: "Patient support network",
      },
    ],
    nextQuestion: (value) => "special-requirements",
  },
  {
    id: "special-requirements",
    type: "textarea",
    question: "Do you have any specific requirements or constraints?",
    description: "Optional: Add any special considerations, existing documentation, or unique requirements",
    icon: ClipboardCheck,
    required: false,
    category: "Additional Information",
    placeholder: "E.g., Must comply with specific hospital protocols, integrate with legacy systems, support offline mode, etc.",
    nextQuestion: (value) => null,
  },
]

interface GuidedQuestionnaireProps {
  onComplete: (answers: Record<string, string | string[] | number>) => void
  onSkip: () => void
}

export function GuidedQuestionnaire({ onComplete, onSkip }: GuidedQuestionnaireProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | string[] | number>>({})
  const [currentAnswer, setCurrentAnswer] = useState<string | string[] | number | null>(null)
  const [selectedCards, setSelectedCards] = useState<string[]>([])

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  const handleNext = () => {
    if (currentAnswer !== null || !currentQuestion.required) {
      const newAnswers = currentAnswer !== null
        ? { ...answers, [currentQuestion.id]: currentAnswer }
        : answers
      setAnswers(newAnswers)

      const nextQuestionId = currentAnswer !== null
        ? currentQuestion.nextQuestion?.(currentAnswer)
        : null
      if (nextQuestionId) {
        const nextIndex = questions.findIndex(q => q.id === nextQuestionId)
        if (nextIndex !== -1) {
          setCurrentQuestionIndex(nextIndex)
          setCurrentAnswer(null)
          setSelectedCards([])
        } else {
          onComplete(newAnswers)
        }
      } else if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        setCurrentAnswer(null)
        setSelectedCards([])
      } else {
        onComplete(newAnswers)
      }
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

  const handleSkipToEnd = () => {
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

  const QuestionIcon = currentQuestion.icon || FileText

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Intelligent Requirements Assistant</h2>
            <p className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onSkip}
          className="gap-2"
        >
          <SkipForward className="h-4 w-4" />
          Skip Setup
        </Button>
      </div>

      <Progress value={progress} className="h-2" />

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
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                  <QuestionIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="mb-2">
                      {currentQuestion.category}
                    </Badge>
                    {!currentQuestion.required && (
                      <Badge variant="secondary" className="text-xs">
                        Optional
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">
                    {currentQuestion.question}
                  </CardTitle>
                  {currentQuestion.description && (
                    <CardDescription className="mt-2">
                      {currentQuestion.description}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentQuestion.type === "cards" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.options?.map((option) => {
                    const OptionIcon = option.icon || FileText
                    const isSelected = currentAnswer === option.value
                    return (
                      <motion.div
                        key={option.value}
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
                  {currentQuestion.options?.map((option) => {
                    const OptionIcon = option.icon || FileText
                    const isSelected = selectedCards.includes(option.value)
                    return (
                      <motion.div
                        key={option.value}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div
                          className={cn(
                            "p-4 rounded-lg border-2 cursor-pointer transition-all",
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground"
                          )}
                          onClick={() => handleCardSelect(option.value)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={cn(
                              "p-1.5 rounded",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary"
                            )}>
                              <OptionIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{option.label}</p>
                              {option.description && (
                                <p className="text-xs text-muted-foreground">
                                  {option.description}
                                </p>
                              )}
                            </div>
                            <div className={cn(
                              "h-5 w-5 rounded border-2",
                              isSelected
                                ? "bg-primary border-primary"
                                : "border-muted-foreground"
                            )}>
                              {isSelected && (
                                <CheckCircle className="h-4 w-4 text-primary-foreground" />
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
                    {currentQuestion.options?.map((option) => (
                      <label
                        key={option.value}
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

              <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-900 dark:text-blue-100">
                  Your answers help our AI generate more accurate and relevant test cases.
                  You can always refine these later.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center space-x-3">
          {Object.keys(answers).length > 2 && (
            <Button
              variant="outline"
              onClick={handleSkipToEnd}
              className="gap-2"
            >
              <PlayCircle className="h-4 w-4" />
              Continue with {Object.keys(answers).length} answers
            </Button>
          )}

          <Button
            onClick={handleNext}
            disabled={currentQuestion.required && currentAnswer === null}
          >
            {currentQuestionIndex === questions.length - 1 ? (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Requirements
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