const path = require('path')
const fs = require('fs').promises

async function testConversion() {
  try {
    console.log('Testing document conversion...\n')

    // Import the PDF processor
    const { PDFProcessor } = require('./lib/document-processors/pdf-processor')
    const processor = new PDFProcessor()

    // Test with the sample requirements document
    const sampleDoc = path.join(__dirname, 'sample-documents', 'patient-monitoring-system-requirements.md')

    // Check if sample exists
    try {
      await fs.access(sampleDoc)
      console.log('✓ Found sample document:', sampleDoc)
    } catch {
      console.log('Sample document not found. Creating a test PDF...')

      // Create a simple test PDF using pdf-lib
      const { PDFDocument, rgb } = require('pdf-lib')
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([600, 400])
      page.drawText('Test Requirements Document', {
        x: 50,
        y: 350,
        size: 20,
        color: rgb(0, 0, 0)
      })
      page.drawText('This is a test PDF for conversion testing.', {
        x: 50,
        y: 300,
        size: 12,
        color: rgb(0, 0, 0)
      })
      page.drawText('Requirement 1: System shall support user authentication', {
        x: 50,
        y: 250,
        size: 12,
        color: rgb(0, 0, 0)
      })
      page.drawText('Requirement 2: System shall encrypt all data at rest', {
        x: 50,
        y: 220,
        size: 12,
        color: rgb(0, 0, 0)
      })

      const testPdfPath = path.join(__dirname, 'temp', 'test-document.pdf')
      await fs.mkdir(path.dirname(testPdfPath), { recursive: true })
      const pdfBytes = await pdfDoc.save()
      await fs.writeFile(testPdfPath, pdfBytes)
      console.log('✓ Created test PDF:', testPdfPath)

      // Test PDF conversion
      console.log('\n📄 Testing PDF to Image conversion...')
      const pdfImages = await processor.convertPDFToImages(testPdfPath, 'test-doc')
      console.log(`✓ Converted PDF to ${pdfImages.length} image(s)`)

      for (const image of pdfImages) {
        console.log(`  - Page ${image.pageNumber}: ${image.width}x${image.height} - ${image.imagePath}`)
      }

      // Clean up test file
      await fs.unlink(testPdfPath)
    }

    // Test with DOCX if we have a test file
    const testDocx = path.join(__dirname, 'temp', 'test.docx')
    try {
      await fs.access(testDocx)
      console.log('\n📝 Testing DOCX to PDF conversion...')
      const pdfPath = await processor.convertDocxToPdf(testDocx)
      console.log('✓ Converted DOCX to PDF:', pdfPath)

      const docxImages = await processor.convertPDFToImages(pdfPath, 'test-docx')
      console.log(`✓ Converted to ${docxImages.length} image(s)`)
    } catch {
      console.log('\n📝 No DOCX test file found, skipping DOCX test')
    }

    console.log('\n✅ Document conversion test completed successfully!')

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)

    if (error.message.includes('GraphicsMagick')) {
      console.log('\n💡 GraphicsMagick or ImageMagick is required for PDF conversion.')
      console.log('Install with: brew install graphicsmagick (macOS) or apt-get install graphicsmagick (Linux)')
    }

    if (error.message.includes('LibreOffice')) {
      console.log('\n💡 LibreOffice is required for DOCX conversion.')
      console.log('Install with: brew install libreoffice (macOS) or apt-get install libreoffice (Linux)')
    }
  }
}

testConversion()