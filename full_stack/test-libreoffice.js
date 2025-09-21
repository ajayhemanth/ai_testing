const libre = require('libreoffice-convert')
const fs = require('fs').promises
const path = require('path')
const { promisify } = require('util')

const convertAsync = promisify(libre.convert)

async function testLibreOffice() {
  try {
    console.log('Testing LibreOffice conversion...\n')

    // Create a simple HTML file to convert (LibreOffice can convert HTML to PDF)
    const testDir = path.join(__dirname, 'temp', 'test-conversion')
    await fs.mkdir(testDir, { recursive: true })

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Requirements Document</title>
</head>
<body>
  <h1>Healthcare System Requirements</h1>

  <h2>Functional Requirements</h2>
  <p><strong>REQ-001:</strong> User Authentication</p>
  <p>The system shall provide secure multi-factor authentication.</p>

  <p><strong>REQ-002:</strong> Data Encryption</p>
  <p>All patient data must be encrypted using AES-256.</p>

  <h2>Compliance Requirements</h2>
  <ul>
    <li>HIPAA Compliance</li>
    <li>FDA 21 CFR Part 11</li>
    <li>ISO 27001</li>
  </ul>
</body>
</html>`

    const htmlPath = path.join(testDir, 'test-doc.html')
    await fs.writeFile(htmlPath, htmlContent)
    console.log('✓ Created test HTML:', htmlPath)

    // Convert HTML to PDF using LibreOffice
    console.log('\n📝 Converting HTML to PDF...')
    const htmlBuffer = await fs.readFile(htmlPath)
    const pdfPath = path.join(testDir, 'test-doc-converted.pdf')

    try {
      const pdfBuffer = await convertAsync(htmlBuffer, '.pdf', undefined)
      await fs.writeFile(pdfPath, pdfBuffer)
      console.log('✓ Converted to PDF:', pdfPath)

      const stats = await fs.stat(pdfPath)
      console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`)

      console.log('\n✅ LibreOffice conversion test completed successfully!')
    } catch (convertError) {
      console.error('❌ Conversion failed:', convertError.message)

      if (convertError.message.includes('soffice')) {
        console.log('\n💡 LibreOffice is required. Install with:')
        console.log('   macOS: brew install libreoffice')
        console.log('   Linux: apt-get install libreoffice')
      }
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
  }
}

testLibreOffice()