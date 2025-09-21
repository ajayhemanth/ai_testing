import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import { PDFProcessor, PDFPageImage } from './pdf-processor'

export interface ConversionResult {
  images: Buffer[]
  pageCount: number
  format: string
  imagePaths?: string[]
}

export async function convertDocumentToImages(
  filePath: string,
  fileType: string
): Promise<ConversionResult> {
  const ext = fileType.toLowerCase()

  switch (ext) {
    case 'pdf':
      return await convertPdfToImages(filePath)
    case 'docx':
    case 'doc':
      return await convertOfficeToImages(filePath)
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'bmp':
      return await convertImageToStandardFormat(filePath)
    default:
      throw new Error(`Unsupported file type: ${ext}`)
  }
}

async function convertPdfToImages(filePath: string): Promise<ConversionResult> {
  try {
    const processor = new PDFProcessor()
    const pageImages = await processor.convertPDFToImages(filePath)

    const images: Buffer[] = []
    const imagePaths: string[] = []

    for (const pageImage of pageImages) {
      const imageBuffer = await fs.readFile(pageImage.imagePath)
      images.push(imageBuffer)
      imagePaths.push(pageImage.imagePath)
    }

    return {
      images,
      pageCount: pageImages.length,
      format: 'pdf',
      imagePaths
    }
  } catch (error) {
    console.error('Error converting PDF with pdf2pic:', error)
    // Fallback to simple image if pdf2pic fails (e.g., GraphicsMagick not installed)
    return await createFallbackImage(filePath, 'pdf')
  }
}

async function convertOfficeToImages(filePath: string): Promise<ConversionResult> {
  try {
    const processor = new PDFProcessor()
    const pageImages = await processor.convertOfficeDocumentToImages(filePath)

    const images: Buffer[] = []
    const imagePaths: string[] = []

    for (const pageImage of pageImages) {
      const imageBuffer = await fs.readFile(pageImage.imagePath)
      images.push(imageBuffer)
      imagePaths.push(pageImage.imagePath)
    }

    return {
      images,
      pageCount: pageImages.length,
      format: 'office',
      imagePaths
    }
  } catch (error) {
    console.error('Error converting Office document:', error)
    // Fallback if LibreOffice is not installed
    return await createFallbackImage(filePath, 'office')
  }
}

async function createFallbackImage(filePath: string, format: string): Promise<ConversionResult> {
  // Create a simple placeholder image as fallback
  const { createCanvas } = require('canvas')
  const canvas = createCanvas(1200, 1600)
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, 1200, 1600)

  ctx.fillStyle = 'black'
  ctx.font = '24px Arial'
  ctx.fillText(`[${format.toUpperCase()} Document]`, 50, 50)
  ctx.font = '16px Arial'
  ctx.fillText('Note: GraphicsMagick/ImageMagick or LibreOffice not installed', 50, 80)
  ctx.fillText('Document will be processed directly via Gemini Vision API', 50, 110)
  ctx.fillText(`File: ${path.basename(filePath)}`, 50, 140)

  const buffer = canvas.toBuffer('image/png')

  return {
    images: [buffer],
    pageCount: 1,
    format
  }
}

async function convertImageToStandardFormat(filePath: string): Promise<ConversionResult> {
  const imageBuffer = await fs.readFile(filePath)
  const convertedImage = await sharp(imageBuffer)
    .png()
    .toBuffer()

  return {
    images: [convertedImage],
    pageCount: 1,
    format: 'image'
  }
}

export async function saveImagesToTemp(images: Buffer[]): Promise<string[]> {
  const tempDir = path.join(process.cwd(), 'temp', 'document-images')
  await fs.mkdir(tempDir, { recursive: true })

  const imagePaths: string[] = []
  const timestamp = Date.now()

  for (let i = 0; i < images.length; i++) {
    const imagePath = path.join(tempDir, `page-${timestamp}-${i}.png`)
    await fs.writeFile(imagePath, images[i])
    imagePaths.push(imagePath)
  }

  return imagePaths
}