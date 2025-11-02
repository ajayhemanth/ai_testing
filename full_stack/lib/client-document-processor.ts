export interface ProcessingResult {
  documentId: string
  projectId: string
  totalRequirements: number
  questions?: any[]
  requirements?: any[]
  analysis?: any
  hasGaps?: boolean
  error?: string
}

export class ClientDocumentProcessor {
  private documentId: string = ''
  private projectId: string = ''
  private analyzeResult: any = null

  async startProcessing(files: File[], projectId: string): Promise<string> {
    // Generate documentId on client side FIRST so UI can connect to SSE immediately
    this.documentId = this.generateDocumentId()
    this.projectId = projectId

    // Start upload in background (non-blocking)
    this.uploadAndProcess(files, projectId).catch(error => {
      console.error('Processing error:', error)
    })

    // Return documentId immediately for SSE connection
    return this.documentId
  }

  private generateDocumentId(): string {
    // Generate UUID v4 compatible ID on client side
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  private async uploadAndProcess(files: File[], projectId: string): Promise<void> {
    try {
      // Upload with pre-generated documentId
      const uploadResult = await this.uploadDocuments(files, projectId, this.documentId)

      // Continue processing pipeline
      await this.continueProcessing(uploadResult)
    } catch (error) {
      console.error('Upload and process error:', error)
      throw error
    }
  }

  private async continueProcessing(uploadResult: any): Promise<void> {
    try {
      // Step 2: Extract text from images
      const extractResult = await this.extractText(uploadResult)

      // Step 3: Analyze content and check for gaps
      const analyzeResult = await this.analyzeContent(extractResult)

      // Store analyze result for later use
      this.analyzeResult = analyzeResult

      // Step 4: If no gaps, store requirements. Otherwise, return analysis for questionnaire
      if (analyzeResult.hasGaps) {
        // Return early - let the UI handle the gap questionnaire
        // The analysis data will be passed through the progress update
        console.log('Gaps found in document analysis, showing questionnaire')
        return
      }

      // Step 5: Store requirements in database (only if no gaps)
      await this.storeRequirements(analyzeResult)
    } catch (error) {
      console.error('Processing pipeline error:', error)
      throw error
    }
  }

  private async uploadDocuments(files: File[], projectId: string, documentId: string) {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    formData.append('projectId', projectId)
    formData.append('documentId', documentId)  // Pass pre-generated documentId

    const response = await fetch('/api/process/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Upload failed')
    }

    return response.json()
  }

  private async extractText(uploadResult: any) {
    const response = await fetch('/api/process/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documentId: uploadResult.documentId,
        projectId: uploadResult.projectId,
        documents: uploadResult.documents
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Text extraction failed')
    }

    return response.json()
  }

  private async analyzeContent(extractResult: any) {
    const response = await fetch('/api/process/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documentId: extractResult.documentId,
        projectId: extractResult.projectId,
        documents: extractResult.documents
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Analysis failed')
    }

    return response.json()
  }

  private async storeRequirements(analyzeResult: any) {
    const response = await fetch('/api/process/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documentId: analyzeResult.documentId,
        projectId: analyzeResult.projectId,
        requirements: analyzeResult.requirements
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Storage failed')
    }

    return response.json()
  }

  getDocumentId(): string {
    return this.documentId
  }

  getAnalyzeResult(): any {
    return this.analyzeResult
  }
}