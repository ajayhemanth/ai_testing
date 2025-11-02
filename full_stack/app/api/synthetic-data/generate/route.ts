import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GoogleGenerativeAI } from '@/lib/vertex-ai-wrapper'

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const {
      projectId,
      requirementId,
      testCaseIds,
      dataType,
      outputFormat,
      recordCount,
      complexityLevel,
      includeEdgeCases,
      maskPHI,
      additionalContext,
    } = body

    // Fetch test cases with related data
    const testCases = await prisma.testCase.findMany({
      where: { id: { in: testCaseIds } },
      include: {
        project: true,
        requirement: true,
      },
    })

    if (testCases.length === 0) {
      return NextResponse.json(
        { error: 'No test cases found' },
        { status: 404 }
      )
    }

    // Extract compliance standards from test cases
    const complianceStandards = new Set<string>()
    testCases.forEach(tc => {
      if (tc.requirement?.complianceTags) {
        tc.requirement.complianceTags.split(',').forEach(tag =>
          complianceStandards.add(tag.trim())
        )
      }
    })

    // Generate synthetic data using Gemini
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    const prompt = `You are a healthcare data expert specializing in generating synthetic test data that complies with medical standards.

Generate synthetic ${dataType.replace(/_/g, ' ')} data for the following test cases:

Test Cases:
${testCases.map(tc => `- ${tc.title}: ${tc.description || 'No description'}`).join('\n')}

Requirements:
- Data Type: ${dataType.replace(/_/g, ' ')}
- Output Format: ${outputFormat.toUpperCase()}
- Number of Records: ${recordCount}
- Complexity Level: ${complexityLevel}
- Include Edge Cases: ${includeEdgeCases ? 'Yes' : 'No'}
- Mask PHI: ${maskPHI ? 'Yes' : 'No'}
- Compliance Standards: ${Array.from(complianceStandards).join(', ') || 'Standard healthcare compliance'}

${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Generate realistic, diverse synthetic data that:
1. Is appropriate for testing the specified test cases
2. Follows the specified output format exactly
3. Includes edge cases if requested
4. Masks all PHI if requested (use realistic but fake names, dates, SSNs, etc.)
5. Complies with the specified healthcare standards
6. Has the specified complexity level

${getFormatInstructions(outputFormat, dataType, recordCount)}

Return ONLY the formatted data without any explanations or markdown code blocks.`

    const result = await model.generateContent(prompt)
    const generatedData = result.response.text()

    // Parse or clean the generated data based on format
    let formattedData = generatedData
    try {
      if (outputFormat === 'json') {
        // Try to parse and re-stringify for proper formatting
        formattedData = JSON.stringify(JSON.parse(generatedData), null, 2)
      }
    } catch (e) {
      // If parsing fails, use the raw generated data
      console.log('Using raw generated data')
    }

    // Calculate data size
    const sizeInKB = Math.round(new TextEncoder().encode(formattedData).length / 1024)

    // Log the generation for auditing
    await prisma.dataGeneration.create({
      data: {
        projectId,
        testCaseIds: testCaseIds.join(','),
        dataType,
        outputFormat,
        recordCount,
        complexityLevel,
        metadata: {
          requirementId,
          includeEdgeCases,
          maskPHI,
          additionalContext,
          complianceStandards: Array.from(complianceStandards),
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: formattedData,
      stats: {
        recordCount,
        sizeInKB,
        dataType,
        outputFormat,
        complianceStandards: Array.from(complianceStandards),
      },
    })
  } catch (error: any) {
    console.error('Synthetic data generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate synthetic data' },
      { status: 500 }
    )
  }
}

function getFormatInstructions(format: string, dataType: string, count: number): string {
  switch (format) {
    case 'json':
      return `Generate a JSON ${count > 1 ? 'array' : 'object'} with ${count} ${dataType.replace(/_/g, ' ')} record(s).
      Use appropriate field names and data types.
      Example structure for patient records:
      ${count > 1 ? '[' : ''}{
        "id": "unique_id",
        "firstName": "John",
        "lastName": "Doe",
        "dateOfBirth": "1990-01-01",
        "mrn": "MRN123456",
        // ... other relevant fields
      }${count > 1 ? ', ...]' : ''}`

    case 'csv':
      return `Generate CSV format with headers in the first row and ${count} data rows.
      Use comma separation and quote fields containing commas.
      Example:
      id,firstName,lastName,dateOfBirth,mrn
      1,John,Doe,1990-01-01,MRN123456
      2,Jane,Smith,1985-05-15,MRN789012`

    case 'sql':
      return `Generate SQL INSERT statements for a table named "${dataType}".
      Create ${count} INSERT statements with appropriate values.
      Example:
      INSERT INTO ${dataType} (id, first_name, last_name, date_of_birth, mrn) VALUES
      (1, 'John', 'Doe', '1990-01-01', 'MRN123456'),
      (2, 'Jane', 'Smith', '1985-05-15', 'MRN789012');`

    case 'fhir':
      return `Generate FHIR resources in JSON format following FHIR R4 specification.
      Create ${count} ${getFHIRResourceType(dataType)} resource(s).
      Include all required fields and appropriate extensions.
      Follow FHIR naming conventions and data types.`

    case 'hl7':
      return `Generate HL7 v2.x messages appropriate for ${dataType}.
      Create ${count} message(s) with proper segments.
      Use | as field separator, ^ for components.
      Include MSH, PID, and other relevant segments.`

    default:
      return `Generate ${count} ${dataType.replace(/_/g, ' ')} record(s) in ${format} format.`
  }
}

function getFHIRResourceType(dataType: string): string {
  const mapping: Record<string, string> = {
    'patient_records': 'Patient',
    'lab_results': 'Observation',
    'medications': 'MedicationStatement',
    'clinical_notes': 'DocumentReference',
    'medical_images': 'ImagingStudy',
    'device_data': 'DeviceMetric',
  }
  return mapping[dataType] || 'Resource'
}