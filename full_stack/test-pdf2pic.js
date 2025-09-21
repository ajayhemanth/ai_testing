const { fromPath } = require('pdf2pic')
const { PDFDocument, rgb } = require('pdf-lib')
const fs = require('fs').promises
const path = require('path')

async function testPdf2Pic() {
  try {
    console.log('Testing pdf2pic directly...\n')

    // Create a test PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([600, 400])
    page.drawText('Healthcare Requirements Test', {
      x: 50,
      y: 350,
      size: 20,
      color: rgb(0, 0, 0)
    })
    page.drawText('REQ-001: User Authentication System', {
      x: 50,
      y: 300,
      size: 14,
      color: rgb(0, 0, 0)
    })
    page.drawText('The system shall provide secure authentication', {
      x: 50,
      y: 270,
      size: 12,
      color: rgb(0, 0, 0)
    })
    page.drawText('REQ-002: Data Encryption', {
      x: 50,
      y: 220,
      size: 14,
      color: rgb(0, 0, 0)
    })
    page.drawText('All patient data must be encrypted at rest', {
      x: 50,
      y: 190,
      size: 12,
      color: rgb(0, 0, 0)
    })

    // Add a second page
    const page2 = pdfDoc.addPage([600, 400])
    page2.drawText('Page 2: Compliance Requirements', {
      x: 50,
      y: 350,
      size: 20,
      color: rgb(0, 0, 0)
    })
    page2.drawText('HIPAA Compliance Required', {
      x: 50,
      y: 300,
      size: 14,
      color: rgb(0, 0, 0)
    })

    // Save test PDF
    const testDir = path.join(__dirname, 'temp', 'test-conversion')
    await fs.mkdir(testDir, { recursive: true })
    const pdfPath = path.join(testDir, 'test-requirements.pdf')
    const pdfBytes = await pdfDoc.save()
    await fs.writeFile(pdfPath, pdfBytes)
    console.log('✓ Created test PDF:', pdfPath)

    // Convert PDF to images using pdf2pic
    console.log('\n📄 Converting PDF to images...')
    const options = {
      density: 150,
      savePath: testDir,
      format: 'png',
      quality: 85,
      width: 1500,
      preserveAspectRatio: true
    }

    const converter = fromPath(pdfPath, options)

    // Try bulk conversion
    try {
      const results = await converter.bulk(-1, { responseType: 'image' })
      console.log(`✓ Converted ${results.length} pages to images`)

      for (const result of results) {
        if (result.path) {
          console.log(`  - Page ${result.page}: ${result.path}`)
          const stats = await fs.stat(result.path)
          console.log(`    Size: ${(stats.size / 1024).toFixed(2)} KB`)
        }
      }
    } catch (bulkError) {
      console.log('Bulk conversion failed, trying page-by-page...')

      // Try page by page
      for (let i = 1; i <= 2; i++) {
        try {
          const result = await converter(i, { responseType: 'image' })
          if (result.path) {
            console.log(`✓ Page ${i}: ${result.path}`)
          }
        } catch (pageError) {
          console.log(`Failed to convert page ${i}:`, pageError.message)
        }
      }
    }

    console.log('\n✅ pdf2pic test completed successfully!')
    console.log(`📁 Images saved in: ${testDir}`)

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)

    if (error.message.includes('gm')) {
      console.log('\n💡 GraphicsMagick is required. Install with:')
      console.log('   macOS: brew install graphicsmagick')
      console.log('   Linux: apt-get install graphicsmagick')
    }
  }
}

testPdf2Pic()