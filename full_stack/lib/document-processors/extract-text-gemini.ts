import { GoogleGenerativeAI } from '@/lib/vertex-ai-wrapper'
import fs from 'fs/promises'
import { progressStore } from '@/lib/progress-store'

export interface ExtractedContent {
  text: string
  sections: { title: string; content: string }[]
  metadata: {
    documentType?: string
    complianceStandards?: string[]
    totalPages?: number
    extractionDate?: string
    [key: string]: any
  }
}

export async function extractTextFromImages(
  imagePaths: string[],
  apiKey: string,
  documentId?: string,
  fileName?: string
): Promise<ExtractedContent> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

  const extractedTexts: string[] = new Array(imagePaths.length)
  const sections: { title: string; content: string }[] = []

  console.log(`Starting parallel text extraction for ${imagePaths.length} images...`)

  // Send initial progress
  if (documentId) {
    progressStore.addUpdate(documentId, {
      step: 'extract',
      status: 'processing',
      current: 0,
      total: imagePaths.length,
      message: `Starting text extraction from ${fileName || 'document'}`,
      details: {
        fileName: fileName,
        totalPages: imagePaths.length,
        phase: 'initialization'
      }
    })
  }

  // Process images in parallel batches
  const MAX_CONCURRENT = 10 // Process 10 images concurrently
  let processedCount = 0
  let totalCharacters = 0

  for (let i = 0; i < imagePaths.length; i += MAX_CONCURRENT) {
    const batch = imagePaths.slice(i, Math.min(i + MAX_CONCURRENT, imagePaths.length))
    const batchStartIdx = i
    const batchNumber = Math.floor(i / MAX_CONCURRENT) + 1
    const totalBatches = Math.ceil(imagePaths.length / MAX_CONCURRENT)

    console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} images)`)

    // Update progress for batch start
    if (documentId) {
      progressStore.addUpdate(documentId, {
        step: 'extract',
        status: 'processing',
        current: processedCount,
        total: imagePaths.length,
        message: `Processing batch ${batchNumber} of ${totalBatches} (pages ${i + 1}-${Math.min(i + batch.length, imagePaths.length)})`,
        details: {
          fileName: fileName,
          batchNumber: batchNumber,
          totalBatches: totalBatches,
          totalPages: imagePaths.length,
          phase: 'extracting'
        }
      })
    }

    // Process batch in parallel
    const batchPromises = batch.map(async (imagePath, batchIdx) => {
      const pageNum = batchStartIdx + batchIdx + 1
      console.log(`  🔄 Starting page ${pageNum}/${imagePaths.length}`)

      try {
        const startTime = Date.now()
        const imageData = await fs.readFile(imagePath)
        const base64Image = imageData.toString('base64')

        const prompt = `You are a document analysis expert. Please extract ALL text content from this document image.

Instructions:
1. Extract every piece of text you can see in the image
2. Preserve the document structure (headings, sections, paragraphs)
3. Include tables, lists, and any formatted content
4. For requirements documents, pay special attention to:
   - Requirement IDs (REQ-XXX, FR-XXX, NFR-XXX, etc.)
   - Requirement descriptions
   - Priority levels
   - Compliance standards mentioned
   - User stories
   - Acceptance criteria
5. Format the output as clean, structured text

If this appears to be page ${pageNum} of a multi-page document, indicate that at the beginning.

Extract the text now:`

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Image
            }
          }
        ])

        const extractedText = result.response.text()
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
        console.log(`  ✅ Page ${pageNum} completed (${elapsed}s) - ${extractedText.length} chars`)

        return {
          pageNum: pageNum - 1, // Zero-indexed for array storage
          text: extractedText,
          success: true,
          charactersExtracted: extractedText.length
        }
      } catch (error) {
        console.error(`  ❌ Page ${pageNum} failed:`, error)
        return {
          pageNum: pageNum - 1,
          text: `[Error extracting text from page ${pageNum}]`,
          success: false,
          charactersExtracted: 0
        }
      }
    })

    // Wait for all pages in batch to complete
    const batchResults = await Promise.all(batchPromises)

    // Store results in correct order and update progress
    for (const result of batchResults) {
      extractedTexts[result.pageNum] = result.text
      totalCharacters += result.charactersExtracted
      processedCount++
    }

    const successCount = batchResults.filter(r => r.success).length
    console.log(`✅ Batch complete: ${successCount}/${batch.length} pages successful (${processedCount}/${imagePaths.length} total)`)

    // Update progress after batch completion
    if (documentId) {
      progressStore.addUpdate(documentId, {
        step: 'extract',
        status: 'processing',
        current: processedCount,
        total: imagePaths.length,
        message: `Completed batch ${batchNumber}/${totalBatches} - Extracted ${processedCount}/${imagePaths.length} pages`,
        details: {
          fileName: fileName,
          pagesProcessed: processedCount,
          totalPages: imagePaths.length,
          totalCharacters: totalCharacters,
          batchesComplete: batchNumber,
          totalBatches: totalBatches,
          phase: 'extracting'
        }
      })
    }
  }

  // Process sections from all extracted text
  console.log(`\n📝 Processing sections from extracted text...`)
  const fullText = extractedTexts.join('\n\n--- Page Break ---\n\n')

  // Extract sections from the combined text
  const allSections = await extractSections(fullText, model)
  sections.push(...allSections)

  const metadataResult = await extractMetadata(fullText, model)

  console.log(`\n✅ Text extraction complete!`)
  console.log(`  - Total pages processed: ${imagePaths.length}`)
  console.log(`  - Total text extracted: ${fullText.length} characters`)
  console.log(`  - Sections identified: ${sections.length}`)

  // Send completion update
  if (documentId) {
    progressStore.addUpdate(documentId, {
      step: 'extract',
      status: 'completed',
      current: processedCount,
      total: imagePaths.length,
      message: `Text extraction complete - ${fullText.length} characters from ${imagePaths.length} pages`,
      details: {
        fileName: fileName,
        totalPages: imagePaths.length,
        totalCharacters: fullText.length,
        sectionsFound: sections.length,
        phase: 'completed'
      }
    })
  }

  return {
    text: fullText,
    sections,
    metadata: {
      ...metadataResult,
      pageCount: imagePaths.length,
      totalCharacters: fullText.length
    }
  }
}

async function extractSections(text: string, model: any): Promise<{ title: string; content: string }[]> {
  try {
    const sectionPrompt = `Analyze this document text and identify the main sections.

For each section, provide:
1. Section title
2. Section content summary

Focus on major headings and their content. Return as JSON array with structure:
[{ "title": "Section Name", "content": "Section content summary" }]

Document text:
${text.substring(0, 10000)}... [truncated if longer]

Return only the JSON array, no other text:`

    const result = await model.generateContent(sectionPrompt)
    const response = result.response.text()

    try {
      const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      return JSON.parse(cleanedResponse)
    } catch {
      return []
    }
  } catch (error) {
    console.error('Error extracting sections:', error)
    return []
  }
}

async function extractMetadata(text: string, model: any): Promise<any> {
  try {
    const metadataPrompt = `Analyze this document and extract metadata.

Extract:
1. Document type (e.g., requirements, technical spec, user manual)
2. Any compliance standards mentioned (HIPAA, GDPR, ISO, etc.)
3. Key stakeholders or authors mentioned
4. Project or system name if mentioned

Document text (first 5000 chars):
${text.substring(0, 5000)}

Return as JSON object with these fields. Return only JSON, no other text:`

    const result = await model.generateContent(metadataPrompt)
    const response = result.response.text()

    try {
      const cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      return JSON.parse(cleanedResponse)
    } catch {
      return {}
    }
  } catch (error) {
    console.error('Error extracting metadata:', error)
    return {}
  }
}