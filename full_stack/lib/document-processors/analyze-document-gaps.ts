import { GoogleGenerativeAI } from "@google/generative-ai"

export interface DocumentGapAnalysis {
  projectType?: string
  softwareName?: string
  targetUsers?: string[]
  complianceStandards?: string[]
  regions?: string[]
  dataHandling?: string
  integrations?: string[]
  riskLevel?: string
  clinicalFeatures?: string[]
  requirements?: Array<{
    id: string
    title: string
    type: string
  }>
  criticalGaps: string[]
  importantGaps: string[]
  optionalGaps: string[]
  confidence: number
  sectionConfidence: Record<string, number>
  pages?: number
}

const COMPLIANCE_STANDARDS = {
  USA: ['HIPAA', 'FDA 21 CFR Part 11', 'FDA 21 CFR Part 820', 'FDA 510(k)', 'FDA PMA', 'HITECH', 'CLIA', 'ONC Health IT Certification'],
  EU: ['GDPR', 'MDR (Medical Device Regulation)', 'IVDR (In Vitro Diagnostic Regulation)', 'CE Mark', 'ISO 13485'],
  India: ['CDSCO', 'Medical Device Rules 2017', 'IT Act 2000', 'DISHA Act'],
  Global: ['ISO 13485', 'ISO 14971', 'IEC 62304', 'IEC 62366', 'ISO 27001', 'ISO 27799', 'HL7 FHIR', 'DICOM']
}

const MEDICAL_DEVICE_CLASSES = {
  FDA: {
    'Class I': 'Low risk - General controls (e.g., bandages, exam gloves)',
    'Class II': 'Moderate risk - Special controls & 510(k) clearance (e.g., powered wheelchairs, pregnancy test kits)',
    'Class III': 'High risk - Premarket approval required (e.g., implantable pacemakers, heart valves)'
  },
  EU_MDR: {
    'Class I': 'Low risk - Non-invasive devices',
    'Class IIa': 'Low to medium risk - Short-term invasive devices',
    'Class IIb': 'Medium to high risk - Long-term invasive devices',
    'Class III': 'High risk - Life-supporting or implantable devices'
  },
  IEC_62304: {
    'Class A': 'No injury or damage to health possible',
    'Class B': 'Non-serious injury possible',
    'Class C': 'Death or serious injury possible'
  }
}

export async function analyzeDocumentForGaps(
  extractedContent: any,
  apiKey: string
): Promise<DocumentGapAnalysis> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
      temperature: 0.3,
      topK: 1,
      topP: 0.95,
      maxOutputTokens: 4096,
    }
  })

  const prompt = `
You are an expert healthcare software testing and compliance specialist with deep knowledge of FDA regulations, IEC standards, and global medical device requirements. Analyze the following document for gaps that would prevent comprehensive test case generation and regulatory compliance.

Document Content:
${extractedContent.text}

Focus specifically on identifying gaps related to:
1. Medical device classification and intended use
2. Patient safety and risk management requirements
3. Clinical validation and testing requirements
4. Regulatory compliance pathways
5. Data integrity and security requirements
6. Interoperability and integration standards
7. Performance and reliability metrics

Analyze and provide a JSON response with the following structure:
{
  "projectType": "string or null - type of healthcare software (EHR, Medical Device, Telemedicine, etc.)",
  "softwareName": "string or null - name of the software/project",
  "targetUsers": ["array of user types mentioned - doctors, nurses, patients, etc."],
  "complianceStandards": ["array of compliance standards detected or needed"],
  "regions": ["array of regions/countries where software will be deployed"],
  "dataHandling": "string or null - how PHI/patient data is handled",
  "integrations": ["array of systems/APIs mentioned for integration"],
  "riskLevel": "string or null - medical device risk classification if applicable",
  "clinicalFeatures": ["array of clinical features/functions mentioned"],
  "requirements": [
    {
      "id": "REQ-001",
      "title": "requirement title",
      "type": "functional/security/performance/compliance"
    }
  ],
  "criticalGaps": ["array of critical missing information that MUST be clarified"],
  "importantGaps": ["array of important missing information that SHOULD be clarified"],
  "optionalGaps": ["array of optional information that would be nice to have"],
  "confidence": 0.0 to 1.0 - overall confidence in the analysis,
  "sectionConfidence": {
    "projectType": 0.0 to 1.0,
    "compliance": 0.0 to 1.0,
    "requirements": 0.0 to 1.0,
    "risks": 0.0 to 1.0
  }
}

Critical gaps are MANDATORY items for medical software testing and compliance:
- Medical device classification (FDA Class I/II/III, EU MDR Class, IEC 62304 Class)
- Intended use statement and indications for use
- Clinical validation requirements and acceptance criteria
- Specific compliance standards (HIPAA, FDA 21 CFR, MDR, IEC 62304)
- Patient safety risk analysis (ISO 14971 requirements)
- Data integrity controls (21 CFR Part 11, ALCOA+ principles)
- Cybersecurity requirements (FDA premarket cybersecurity guidance)

Important gaps significantly impact test strategy:
- Performance benchmarks and stress testing requirements
- Interoperability standards (HL7, FHIR, DICOM)
- User role definitions and access controls
- Backup and disaster recovery requirements
- Clinical workflow integration points
- Audit trail and logging requirements

Optional gaps enhance testing completeness:
- Usability testing metrics (IEC 62366)
- Localization and multi-language support
- Training and documentation requirements
- Future scalability considerations

IMPORTANT: Limit the total number of critical + important gaps to between 3 and 10 items that are most crucial for medical compliance and testing.
Focus on the most significant gaps that would prevent regulatory approval or comprehensive testing.
`

  try {
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    // Try to extract JSON from the response
    let jsonText = responseText

    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

    // Try to find JSON object in the response
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response')
    }

    jsonText = jsonMatch[0]

    // Clean up common issues
    jsonText = jsonText
      .replace(/,\s*}/g, '}') // Remove trailing commas
      .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
      .replace(/\n\s*\n/g, '\n') // Remove extra newlines
      .trim()

    const analysis = JSON.parse(jsonText) as DocumentGapAnalysis

    // Add metadata
    analysis.pages = extractedContent.metadata?.totalPages || 1

    // Post-process to ensure critical compliance gaps
    if (!analysis.complianceStandards || analysis.complianceStandards.length === 0) {
      if (!analysis.criticalGaps.includes('compliance-standards')) {
        analysis.criticalGaps.push('compliance-standards')
      }
    }

    if (analysis.projectType?.toLowerCase().includes('device') && !analysis.riskLevel) {
      if (!analysis.criticalGaps.includes('risk-classification')) {
        analysis.criticalGaps.push('risk-classification')
      }
    }

    // Ensure regions are identified for compliance mapping
    if (!analysis.regions || analysis.regions.length === 0) {
      if (!analysis.importantGaps.includes('deployment-regions')) {
        analysis.importantGaps.push('deployment-regions')
      }
    }

    return analysis
  } catch (error) {
    console.error('Error analyzing document for gaps:', error)

    // Return a basic analysis with gaps flagged
    return {
      criticalGaps: ['document-analysis-failed'],
      importantGaps: [],
      optionalGaps: [],
      confidence: 0.3,
      sectionConfidence: {
        projectType: 0.3,
        compliance: 0.3,
        requirements: 0.3,
        risks: 0.3
      },
      pages: extractedContent.metadata?.totalPages || 1
    }
  }
}

export function generateDynamicQuestions(
  analysis: DocumentGapAnalysis
): Array<{
  id: string
  category: 'critical' | 'important' | 'optional'
  question: string
  type: string
  options?: any[]
  context?: string
}> {
  const questions = []

  // Critical gaps
  if (analysis.criticalGaps.includes('compliance-standards')) {
    questions.push({
      id: 'compliance-standards',
      category: 'critical' as const,
      question: 'Which compliance standards does your software need to meet?',
      type: 'multiple',
      options: [
        ...COMPLIANCE_STANDARDS.USA.map(s => ({ value: s, label: s, region: 'USA' })),
        ...COMPLIANCE_STANDARDS.EU.map(s => ({ value: s, label: s, region: 'EU' })),
        ...COMPLIANCE_STANDARDS.India.map(s => ({ value: s, label: s, region: 'India' })),
        ...COMPLIANCE_STANDARDS.Global.map(s => ({ value: s, label: s, region: 'Global' }))
      ],
      context: 'No compliance standards were identified in the document'
    })
  }

  if (analysis.criticalGaps.includes('risk-classification')) {
    questions.push({
      id: 'risk-classification',
      category: 'critical' as const,
      question: 'What is the medical device risk classification?',
      type: 'single',
      options: [
        { value: 'class-i', label: 'Class I - Low Risk', description: 'General controls' },
        { value: 'class-ii', label: 'Class II - Moderate Risk', description: 'Special controls' },
        { value: 'class-iii', label: 'Class III - High Risk', description: 'Premarket approval' }
      ],
      context: 'Medical device software requires risk classification for regulatory compliance'
    })
  }

  // Important gaps
  if (analysis.importantGaps.includes('deployment-regions')) {
    questions.push({
      id: 'deployment-regions',
      category: 'important' as const,
      question: 'In which regions will your software be deployed?',
      type: 'multiple',
      options: [
        { value: 'usa', label: 'United States' },
        { value: 'eu', label: 'European Union' },
        { value: 'india', label: 'India' },
        { value: 'uk', label: 'United Kingdom' },
        { value: 'canada', label: 'Canada' },
        { value: 'australia', label: 'Australia' }
      ],
      context: 'Region-specific compliance requirements will be applied'
    })
  }

  if (!analysis.targetUsers || analysis.targetUsers.length === 0) {
    questions.push({
      id: 'target-users',
      category: 'important' as const,
      question: 'Who are the primary users of your software?',
      type: 'multiple',
      options: [
        { value: 'physicians', label: 'Physicians/Doctors' },
        { value: 'nurses', label: 'Nurses' },
        { value: 'patients', label: 'Patients' },
        { value: 'administrators', label: 'Hospital Administrators' },
        { value: 'technicians', label: 'Lab/Radiology Technicians' },
        { value: 'pharmacists', label: 'Pharmacists' }
      ],
      context: 'Different user types require different test scenarios and UI considerations'
    })
  }

  // Optional gaps
  if (!analysis.integrations || analysis.integrations.length === 0) {
    questions.push({
      id: 'integrations',
      category: 'optional' as const,
      question: 'Which systems will your software integrate with?',
      type: 'text',
      context: 'Integration points help generate comprehensive integration test cases'
    })
  }

  return questions
}