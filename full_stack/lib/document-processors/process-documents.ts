import { convertDocumentToImages, saveImagesToTemp } from './convert-to-image'
import { extractTextFromImages } from './extract-text-gemini'
import { generateMissingDataQuestions } from './generate-questions'
import { generateRequirements, GeneratedRequirement } from './generate-requirements'
import { analyzeDocumentForGaps, DocumentGapAnalysis } from './analyze-document-gaps'
import fs from 'fs/promises'
import path from 'path'

export interface ProcessedDocument {
  fileName: string
  fileType: string
  extractedContent: any
  questions: any[]
  requirements: GeneratedRequirement[]
  analysis?: DocumentGapAnalysis
  errors?: string[]
}

export interface ProcessingOptions {
  projectId: string
  apiKey: string
  generateQuestions?: boolean
  autoGenerateRequirements?: boolean
}

const TEXT_EXTENSIONS = ['.txt', '.md', '.csv', '.json', '.xml', '.html', '.htm', '.rtf']
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
const DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']

export async function processDocuments(
  filePaths: string[],
  options: ProcessingOptions
): Promise<ProcessedDocument[]> {
  const results: ProcessedDocument[] = []

  for (const filePath of filePaths) {
    try {
      const result = await processSingleDocument(filePath, options)
      results.push(result)
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error)
      results.push({
        fileName: path.basename(filePath),
        fileType: path.extname(filePath),
        extractedContent: { text: '', sections: [], metadata: {} },
        questions: [],
        requirements: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      })
    }
  }

  return results
}

async function processSingleDocument(
  filePath: string,
  options: ProcessingOptions
): Promise<ProcessedDocument> {
  const fileName = path.basename(filePath)
  const fileExt = path.extname(filePath).toLowerCase()

  let extractedContent: any
  let tempImagePaths: string[] = []

  try {
    if (TEXT_EXTENSIONS.includes(fileExt)) {
      // For text files, just read the content directly
      const fileContent = await fs.readFile(filePath, 'utf-8')
      extractedContent = {
        text: fileContent,
        sections: [],
        metadata: {
          documentType: 'text',
          totalPages: 1
        }
      }
    } else if (IMAGE_EXTENSIONS.includes(fileExt) || DOCUMENT_EXTENSIONS.includes(fileExt)) {
      console.log(`\n📄 Converting ${fileName} to images...`)
      const conversionResult = await convertDocumentToImages(filePath, fileExt.substring(1))
      console.log(`✓ Converted to ${conversionResult.pageCount} images`)

      // Use existing image paths if available (from pdf2pic), otherwise save temp images
      if (conversionResult.imagePaths && conversionResult.imagePaths.length > 0) {
        tempImagePaths = conversionResult.imagePaths
      } else {
        tempImagePaths = await saveImagesToTemp(conversionResult.images)
      }

      console.log(`\n🔍 Extracting text from ${tempImagePaths.length} images using Gemini 2.5 Pro...`)
      extractedContent = await extractTextFromImages(tempImagePaths, options.apiKey)
      console.log(`✓ Text extraction complete - ${extractedContent.text.length} total characters`)
    } else {
      const fileContent = await fs.readFile(filePath, 'utf-8')
      extractedContent = {
        text: fileContent,
        sections: [],
        metadata: { documentType: 'unknown' }
      }
    }

    // Analyze document for gaps and compliance needs
    console.log(`\n🔍 Analyzing document for gaps and compliance requirements...`)
    const analysis = await analyzeDocumentForGaps(extractedContent, options.apiKey)
    console.log(`✓ Analysis complete - Found ${analysis.criticalGaps.length} critical gaps, ${analysis.importantGaps.length} important gaps`)

    let questions: any[] = []
    if (options.generateQuestions !== false) {
      console.log(`\n❓ Generating questions for missing data...`)
      questions = await generateMissingDataQuestions(
        extractedContent,
        extractedContent.metadata?.documentType || 'general',
        options.apiKey
      )
      console.log(`✓ Generated ${questions.length} questions`)
    }

    let requirements: GeneratedRequirement[] = []
    if (options.autoGenerateRequirements !== false) {
      console.log(`\n📋 Generating requirements from extracted content...`)
      requirements = await generateRequirements(
        extractedContent,
        { questions },
        options.apiKey
      )
      console.log(`✓ Generated ${requirements.length} requirements`)
    }

    await cleanupTempImages(tempImagePaths)

    return {
      fileName,
      fileType: fileExt,
      extractedContent,
      questions,
      requirements,
      analysis
    }
  } catch (error) {
    await cleanupTempImages(tempImagePaths)
    throw error
  }
}

async function cleanupTempImages(imagePaths: string[]) {
  for (const imagePath of imagePaths) {
    try {
      // Only delete if it's in the temp directory
      if (imagePath.includes('/temp/') || imagePath.includes('\\temp\\')) {
        await fs.unlink(imagePath)

        // Try to remove empty parent directories
        const parentDir = path.dirname(imagePath)
        try {
          const files = await fs.readdir(parentDir)
          if (files.length === 0) {
            await fs.rmdir(parentDir)
          }
        } catch (error) {
          // Directory not empty or already deleted, ignore
        }
      }
    } catch (error) {
      console.error(`Failed to cleanup temp image: ${imagePath}`)
    }
  }
}

export async function saveRequirementsToDatabase(
  requirements: GeneratedRequirement[],
  projectId: string,
  prisma: any
): Promise<any[]> {
  const savedRequirements = []

  for (const req of requirements) {
    try {
      const saved = await prisma.requirement.create({
        data: {
          projectId,
          title: req.title,
          description: req.description,
          type: req.category === 'functional' ? 'functional' :
                req.category === 'non-functional' ? 'non-functional' :
                req.category === 'technical' ? 'technical' : 'business',
          priority: req.priority,
          status: 'draft',
          source: req.source || 'Document upload',
          acceptanceCriteria: req.acceptanceCriteria?.join('\n') || '',
          userStory: req.userStory,
          compliance: req.compliance?.join(', ') || null,
          testScenarios: req.testScenarios?.join('\n') || null,
          dependencies: req.dependencies?.join(', ') || null,
          risks: req.risks?.join('\n') || null
        }
      })
      savedRequirements.push(saved)
      console.log(`✅ Saved requirement: ${req.id} - ${req.title}`)
    } catch (error) {
      console.error(`Error saving requirement ${req.id}:`, error)
    }
  }

  console.log(`\n💾 Saved ${savedRequirements.length}/${requirements.length} requirements to database`)
  return savedRequirements
}