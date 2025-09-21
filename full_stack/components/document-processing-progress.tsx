"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  Clock,
  AlertCircle,
  FileUp,
  FileText,
  Brain,
  Database,
  Loader2,
  XCircle
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export interface ProcessingStep {
  step: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  message?: string
  current?: number
  total?: number
  details?: any
}

const stepIcons: Record<string, React.ElementType> = {
  upload: FileUp,
  extract: FileText,
  analyze: Brain,
  store: Database,
  complete: CheckCircle
}

const stepLabels: Record<string, string> = {
  upload: "Upload & Convert",
  extract: "Extract Text",
  analyze: "Analyze Content",
  store: "Save Requirements",
  complete: "Complete"
}

interface DocumentProcessingProgressProps {
  documentId: string
  onComplete?: (details: any) => void
  onError?: (error: string) => void
}

export function DocumentProcessingProgress({
  documentId,
  onComplete,
  onError
}: DocumentProcessingProgressProps) {
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { step: 'upload', status: 'pending' },
    { step: 'extract', status: 'pending' },
    { step: 'analyze', status: 'pending' },
    { step: 'store', status: 'pending' },
    { step: 'complete', status: 'pending' }
  ])
  const [currentDetails, setCurrentDetails] = useState<any>(null)
  const [overallProgress, setOverallProgress] = useState(0)

  useEffect(() => {
    if (!documentId) {
      console.log('No documentId provided to DocumentProcessingProgress')
      return
    }

    console.log('Establishing SSE connection for document:', documentId)
    const url = `/api/process/progress/${documentId}`
    console.log('SSE URL:', url)
    const eventSource = new EventSource(url)

    eventSource.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data)
        console.log('Received SSE update:', update)

        setSteps(prevSteps => {
          const newSteps = [...prevSteps]
          const stepIndex = newSteps.findIndex(s => s.step === update.step)

          if (stepIndex !== -1) {
            newSteps[stepIndex] = {
              ...newSteps[stepIndex],
              status: update.status,
              message: update.message,
              current: update.current,
              total: update.total,
              details: update.details
            }

            // Update previous steps to completed if current step is processing
            if (update.status === 'processing' || update.status === 'completed') {
              for (let i = 0; i < stepIndex; i++) {
                if (newSteps[i].status === 'pending') {
                  newSteps[i].status = 'completed'
                }
              }
            }
          }

          // Calculate overall progress
          const completedSteps = newSteps.filter(s => s.status === 'completed').length
          const processingStep = newSteps.find(s => s.status === 'processing')
          let progress = (completedSteps / newSteps.length) * 100

          if (processingStep && processingStep.current && processingStep.total) {
            const stepProgress = (processingStep.current / processingStep.total) * (100 / newSteps.length)
            progress += stepProgress
          }

          setOverallProgress(Math.min(progress, 100))

          return newSteps
        })

        setCurrentDetails(update.details)

        // Handle analyze step completion with gaps
        if (update.step === 'analyze' && update.status === 'completed' && update.details?.gapsFound) {
          setTimeout(() => {
            eventSource.close()
            if (onComplete) {
              // Pass the analysis details including dynamic questions
              onComplete({
                ...update.details,
                documentId,
                hasGaps: true,
                nextStep: 'show-questionnaire'
              })
            }
          }, 1000) // Short delay to see completion
        }

        // Handle normal completion
        if (update.step === 'complete' && update.status === 'completed') {
          setTimeout(() => {
            eventSource.close()
            if (onComplete) {
              onComplete(update.details)
            }
          }, 1500) // Short delay to see completion
        }

        // Handle errors
        if (update.status === 'error') {
          eventSource.close()
          if (onError) {
            onError(update.message || 'Processing failed')
          }
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      console.error('EventSource readyState:', eventSource.readyState)
      console.error('DocumentId:', documentId)
      // Don't close on error, let it reconnect
      if (eventSource.readyState === EventSource.CLOSED) {
        console.error('SSE connection closed unexpectedly')
      }
    }

    eventSource.onopen = () => {
      console.log('SSE connection opened')
    }

    return () => {
      eventSource.close()
    }
  }, [documentId, onComplete, onError])

  const getStatusIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse'
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Processing Documents</span>
          <Badge variant="outline">{Math.round(overallProgress)}%</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={overallProgress} className="h-2" />

        <div className="space-y-3">
          <AnimatePresence mode="sync">
            {steps.map((step, index) => {
              const Icon = stepIcons[step.step] || FileUp
              const label = stepLabels[step.step] || step.step

              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-start space-x-3 p-3 rounded-lg border ${getStatusColor(step.status)}`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(step.status)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{label}</span>
                      </div>
                      {step.current !== undefined && step.total !== undefined && (
                        <span className="text-sm text-muted-foreground">
                          {step.current} / {step.total}
                        </span>
                      )}
                    </div>
                    {step.message && (
                      <p className="text-sm mt-1 text-muted-foreground">
                        {step.message}
                      </p>
                    )}
                    {step.status === 'processing' && step.current && step.total && (
                      <Progress
                        value={(step.current / step.total) * 100}
                        className="h-1 mt-2"
                      />
                    )}
                    {step.details && step.status === 'processing' && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {step.details.fileName && (
                          <p>Processing: {step.details.fileName}</p>
                        )}
                        {step.details.phase && (
                          <p>Phase: {step.details.phase}</p>
                        )}
                        {step.details.charactersExtracted !== undefined && (
                          <p>Extracted: {step.details.charactersExtracted.toLocaleString()} characters</p>
                        )}
                        {step.details.requirementsGenerated !== undefined && (
                          <p>Requirements: {step.details.requirementsGenerated}</p>
                        )}
                      </div>
                    )}
                    {step.details && step.status === 'completed' && (
                      <div className="mt-2 text-xs space-y-1">
                        {step.details.documentsUploaded && (
                          <p className="text-green-700">
                            ✓ {step.details.documentsUploaded} document(s) uploaded
                          </p>
                        )}
                        {step.details.totalPages && (
                          <p className="text-green-700">
                            ✓ {step.details.totalPages} pages converted
                          </p>
                        )}
                        {step.details.totalCharacters && (
                          <p className="text-green-700">
                            ✓ {step.details.totalCharacters.toLocaleString()} characters extracted
                          </p>
                        )}
                        {step.details.questionsGenerated !== undefined && (
                          <p className="text-green-700">
                            ✓ {step.details.questionsGenerated} questions identified
                          </p>
                        )}
                        {step.details.requirementsGenerated !== undefined && (
                          <p className="text-green-700">
                            ✓ {step.details.requirementsGenerated} requirements generated
                          </p>
                        )}
                        {step.details.requirementsSaved !== undefined && (
                          <p className="text-green-700">
                            ✓ {step.details.requirementsSaved} requirements saved
                          </p>
                        )}
                        {step.details.totalRequirements !== undefined && (
                          <p className="text-green-700 font-medium">
                            ✓ Complete! {step.details.totalRequirements} total requirements
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {currentDetails?.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Error occurred</p>
                <p className="text-sm text-red-700 mt-1">{currentDetails.error}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}