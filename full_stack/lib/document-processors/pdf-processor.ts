import { promises as fs } from 'fs'
import path from 'path'
import { fromPath } from 'pdf2pic'
import sharp from 'sharp'
import { promisify } from 'util'

// Dynamic import for libreoffice-convert to handle CommonJS module
let libre: any

async function initLibreOffice() {
  if (!libre) {
    libre = require('libreoffice-convert')
  }
  return libre
}

export interface PDFPageImage {
  pageNumber: number
  imagePath: string
  width: number
  height: number
}

export class PDFProcessor {
  private outputDir: string

  constructor(outputDir: string = path.join(process.cwd(), 'temp', 'document-images')) {
    this.outputDir = outputDir
    this.ensureDirectoryExists()
  }

  private async ensureDirectoryExists() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true })
    } catch (error) {
      console.error('Error creating output directory:', error)
    }
  }

  async convertDocxToPdf(docxPath: string): Promise<string> {
    try {
      const libreConvert = await initLibreOffice()

      // Read the DOCX file
      const docxBuffer = await fs.readFile(docxPath)

      // Define the output PDF path
      const pdfPath = docxPath.replace(/\.docx$/i, '.pdf')

      // Convert DOCX to PDF using the promisified version
      const convertAsync = promisify(libreConvert.convert)
      const pdfBuffer = await convertAsync(docxBuffer, '.pdf', undefined)

      // Write the PDF file
      await fs.writeFile(pdfPath, pdfBuffer)

      console.log(`Converted DOCX to PDF: ${docxPath} -> ${pdfPath}`)
      return pdfPath
    } catch (error) {
      console.error('Error converting DOCX to PDF:', error)
      // If LibreOffice is not available, throw a more informative error
      if (error instanceof Error && error.message.includes('LibreOffice')) {
        throw new Error('LibreOffice is required for DOCX conversion. Please install it on your system.')
      }
      throw new Error(`Failed to convert DOCX to PDF: ${error}`)
    }
  }

  async convertPDFToImages(pdfPath: string, documentId?: string): Promise<PDFPageImage[]> {
    const pageImages: PDFPageImage[] = []

    try {
      // Create a unique directory for this PDF's images
      const pdfName = path.basename(pdfPath, '.pdf')
      const timestamp = Date.now()
      const imageDir = path.join(
        this.outputDir,
        documentId || `doc_${timestamp}`,
        pdfName
      )
      await fs.mkdir(imageDir, { recursive: true })

      // Set up pdf2pic options - optimized for quality and size
      const options = {
        density: 150,           // Good balance between quality and size
        savePath: imageDir,     // Where to save
        format: 'png',         // PNG for better text clarity
        quality: 85,           // Good quality
        width: 1500,           // Reasonable width for text readability
        preserveAspectRatio: true
      }

      const converter = fromPath(pdfPath, options)

      // Try bulk conversion first (convert all pages at once)
      try {
        const bulkResult = await converter.bulk(-1, { responseType: 'image' })

        if (Array.isArray(bulkResult)) {
          for (const result of bulkResult) {
            if (result.path) {
              // Get image metadata
              const metadata = await sharp(result.path).metadata()

              pageImages.push({
                pageNumber: result.page || pageImages.length + 1,
                imagePath: result.path,
                width: metadata.width || 0,
                height: metadata.height || 0
              })
            }
          }
        }
      } catch (bulkError) {
        console.log('Bulk conversion failed, trying page-by-page conversion')

        // Fallback: Convert pages one by one
        let pageNum = 1
        let hasMorePages = true
        const maxPages = 200 // Safety limit

        while (hasMorePages && pageNum <= maxPages) {
          try {
            const result = await converter(pageNum, { responseType: 'image' })

            if (result.path) {
              const metadata = await sharp(result.path).metadata()

              pageImages.push({
                pageNumber: pageNum,
                imagePath: result.path,
                width: metadata.width || 0,
                height: metadata.height || 0
              })
              pageNum++
            } else {
              hasMorePages = false
            }
          } catch (pageError) {
            // No more pages
            hasMorePages = false
          }
        }
      }

      console.log(`Converted ${pageImages.length} pages from PDF: ${pdfPath}`)
      return pageImages
    } catch (error) {
      console.error('Error converting PDF to images:', error)

      // Check if GraphicsMagick/ImageMagick is installed
      if (error instanceof Error && error.message.includes('gm')) {
        throw new Error('GraphicsMagick or ImageMagick is required for PDF conversion. Please install it on your system.')
      }

      throw new Error(`Failed to convert PDF: ${error}`)
    }
  }

  async optimizeImage(imagePath: string): Promise<string> {
    try {
      const optimizedPath = imagePath.replace(/\.(png|jpg|jpeg)$/i, '_optimized.jpg')

      await sharp(imagePath)
        .jpeg({ quality: 80 })
        .resize(1500, null, { withoutEnlargement: true })
        .toFile(optimizedPath)

      return optimizedPath
    } catch (error) {
      console.error('Error optimizing image:', error)
      return imagePath
    }
  }

  async convertOfficeDocumentToImages(
    filePath: string,
    documentId?: string
  ): Promise<PDFPageImage[]> {
    const ext = path.extname(filePath).toLowerCase()

    if (ext === '.docx' || ext === '.doc') {
      // Convert to PDF first, then to images
      const pdfPath = await this.convertDocxToPdf(filePath)
      return await this.convertPDFToImages(pdfPath, documentId)
    } else if (ext === '.pdf') {
      return await this.convertPDFToImages(filePath, documentId)
    } else {
      throw new Error(`Unsupported file type: ${ext}`)
    }
  }
}