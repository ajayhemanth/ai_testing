import { GoogleGenerativeAI } from '@/lib/vertex-ai-wrapper'

export interface GeneratedRequirement {
  id: string
  title: string
  description: string
  category: 'functional' | 'non-functional' | 'technical' | 'business'
  priority: 'critical' | 'high' | 'medium' | 'low'
  source: string
  acceptanceCriteria: string[]
  compliance?: string[]
  userStory?: string
  testScenarios?: string[]
  dependencies?: string[]
  risks?: string[]
}

export async function generateRequirements(
  extractedContent: any,
  additionalContext: { questions?: any[]; answers?: any[] } = {},
  apiKey: string
): Promise<GeneratedRequirement[]> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

  const qaContext = formatQAContext(additionalContext)

  const prompt = `You are an expert requirements engineer specializing in healthcare software and compliance. Analyze this document content and generate comprehensive software requirements with proactive compliance mapping.

Document Content:
${extractedContent.text.substring(0, 8000)}

${qaContext ? `Additional Context from Q&A:\n${qaContext}` : ''}

Generate detailed software requirements following these guidelines:

1. Identify and extract ALL requirements mentioned in the document
2. For each requirement create:
   - Unique ID (REQ-001, REQ-002, etc.)
   - Clear, actionable title
   - Detailed description
   - Category (functional/non-functional/technical/business)
   - Priority (critical/high/medium/low)
   - Source reference from document
   - Acceptance criteria (at least 2-3 criteria)
   - Related compliance standards (ANALYZE EVERY REQUIREMENT)
   - User story if applicable
   - Test scenarios (at least 2)
   - Dependencies on other requirements
   - Potential risks

3. Requirements should be:
   - Specific and measurable
   - Achievable and testable
   - Traceable to source
   - Non-ambiguous

4. COMPLIANCE ANALYSIS - CRITICALLY IMPORTANT:
   Analyze EVERY requirement for applicable compliance standards from this comprehensive list:

   - FDA: 21 CFR Part 11 (Electronic Records), Part 820 (Quality System), 510(k), PMA
   - ISO: 13485 (Medical Devices), 14971 (Risk Management), 62304 (Medical Device Software), 27001 (Information Security)
   - IEC: 62366 (Usability), 60601 (Medical Electrical Equipment), 62443 (Cybersecurity)
   - HIPAA: Privacy Rule, Security Rule, Breach Notification, Minimum Necessary
   - GDPR: Data Protection, Privacy by Design, Right to Erasure, Data Portability
   - NIST: Cybersecurity Framework, 800-53 (Security Controls), 800-66 (HIPAA Security)
   - HL7/FHIR: Interoperability Standards, Data Exchange
   - DICOM: Medical Imaging Standards
   - SOC2: Type I/II, Security, Availability, Confidentiality
   - OWASP: Application Security, Top 10 Vulnerabilities

   For EACH requirement, determine which standards apply based on:
   - Functionality type (patient data = HIPAA, medical device = FDA/ISO 13485)
   - Data handling (PHI storage = HIPAA, EU data = GDPR, imaging = DICOM)
   - System features (authentication = NIST, encryption = FIPS 140-2)
   - User interactions (clinical workflow = IEC 62366, patient portal = WCAG)
   - Integration points (data exchange = HL7/FHIR, APIs = OWASP)

   ALWAYS suggest compliance tags even if not explicitly mentioned in the document.
   For healthcare software, default to including HIPAA and FDA 21 CFR Part 11 unless clearly not applicable.
   If the requirement involves patient data, ALWAYS include HIPAA.
   If it's a medical device or clinical software, ALWAYS include FDA and ISO 13485.

Generate requirements in JSON format:
{
  "requirements": [
    {
      "id": "REQ-001",
      "title": "Clear requirement title",
      "description": "Detailed description",
      "category": "functional|non-functional|technical|business",
      "priority": "critical|high|medium|low",
      "source": "Reference to document section",
      "acceptanceCriteria": ["Criterion 1", "Criterion 2"],
      "compliance": ["HIPAA", "FDA"],
      "userStory": "As a [user], I want [feature] so that [benefit]",
      "testScenarios": ["Test scenario 1", "Test scenario 2"],
      "dependencies": ["REQ-002", "REQ-003"],
      "risks": ["Risk 1", "Risk 2"]
    }
  ]
}

Extract ALL requirements from the document. Only return valid JSON:`

  try {
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    // Try to extract JSON from the response
    let jsonText = responseText

    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

    // Try to find JSON object in the response
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonText = jsonMatch[0]
    }

    // Clean up common issues
    jsonText = jsonText
      .replace(/,\s*}/g, '}') // Remove trailing commas
      .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
      .replace(/\n\s*\n/g, '\n') // Remove extra newlines
      .trim()

    try {
      const parsed = JSON.parse(jsonText)
      return parsed.requirements || []
    } catch (parseError) {
      console.error('Failed to parse JSON, attempting to extract requirements:', parseError)
      console.log('Raw response:', responseText.substring(0, 500))

      // Try to parse as array directly if it starts with [
      if (jsonText.startsWith('[')) {
        try {
          const requirements = JSON.parse(jsonText)
          if (Array.isArray(requirements)) {
            return requirements
          }
        } catch (e) {
          console.error('Failed to parse as array:', e)
        }
      }

      return generateFallbackRequirements(extractedContent)
    }
  } catch (error) {
    console.error('Error generating requirements:', error)
    return generateFallbackRequirements(extractedContent)
  }
}

function formatQAContext(context: { questions?: any[]; answers?: any[] }): string {
  if (!context.questions || !context.answers) return ''

  let qaText = ''
  for (let i = 0; i < context.questions.length; i++) {
    const q = context.questions[i]
    const a = context.answers?.[i]
    if (q && a) {
      qaText += `Q: ${q.question}\nA: ${a}\n\n`
    }
  }
  return qaText
}

function generateFallbackRequirements(extractedContent: any): GeneratedRequirement[] {
  console.log('Using fallback requirement generation')
  const lines = extractedContent.text.split('\n')
  const requirements: GeneratedRequirement[] = []
  let reqCounter = 1

  // Create at least one basic requirement from the document
  if (extractedContent.text && extractedContent.text.length > 100) {
    requirements.push({
      id: `REQ-${String(reqCounter).padStart(3, '0')}`,
      title: 'Document Requirements Analysis',
      description: 'Requirements extracted from document analysis. Further refinement needed.',
      category: 'functional',
      priority: 'medium',
      source: 'Document Analysis',
      acceptanceCriteria: ['Document requirements have been reviewed', 'Requirements have been validated'],
      compliance: [],
    })
    reqCounter++
  }

  for (const line of lines) {
    if (line.match(/REQ-\d+|requirement|shall|must|should/i) && line.length > 20) {
      requirements.push({
        id: `REQ-${String(reqCounter).padStart(3, '0')}`,
        title: `Requirement ${reqCounter}`,
        description: line.trim().substring(0, 500),
        category: 'functional',
        priority: 'medium',
        source: 'Document text',
        acceptanceCriteria: ['Requirement is implemented', 'Requirement passes testing'],
        testScenarios: ['Verify requirement implementation', 'Test edge cases']
      })
      reqCounter++
      if (reqCounter > 10) break
    }
  }

  if (requirements.length === 0) {
    requirements.push({
      id: 'REQ-001',
      title: 'Document Processing',
      description: 'System shall process uploaded documents and extract requirements',
      category: 'functional',
      priority: 'high',
      source: 'System requirement',
      acceptanceCriteria: [
        'Documents are successfully uploaded',
        'Requirements are extracted and saved'
      ],
      testScenarios: ['Upload valid document', 'Verify requirement extraction']
    })
  }

  return requirements
}

export async function refineRequirement(
  requirement: GeneratedRequirement,
  feedback: string,
  apiKey: string
): Promise<GeneratedRequirement> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

  const prompt = `Refine this requirement based on user feedback.

Current Requirement:
${JSON.stringify(requirement, null, 2)}

User Feedback:
${feedback}

Generate an improved version addressing the feedback. Maintain the same JSON structure but improve content based on feedback.

Return only valid JSON matching the original structure:`

  try {
    const result = await model.generateContent(prompt)
    const jsonText = result.response.text()
    const cleanJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    return JSON.parse(cleanJson)
  } catch (error) {
    console.error('Error refining requirement:', error)
    return requirement
  }
}

export async function groupRequirementsByModule(
  requirements: GeneratedRequirement[],
  apiKey: string
): Promise<Map<string, GeneratedRequirement[]>> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

  const prompt = `Group these requirements into logical modules or components.

Requirements:
${JSON.stringify(requirements.map(r => ({ id: r.id, title: r.title, category: r.category })), null, 2)}

Suggest logical groupings/modules for these requirements. Consider:
- Functional areas (Authentication, Data Management, Reporting, etc.)
- System layers (UI, Backend, Database, Integration)
- User roles or workflows

Return JSON:
{
  "modules": {
    "Module Name": ["REQ-001", "REQ-002"],
    "Another Module": ["REQ-003", "REQ-004"]
  }
}

Only return valid JSON:`

  try {
    const result = await model.generateContent(prompt)
    const jsonText = result.response.text()
    const cleanJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    const parsed = JSON.parse(cleanJson)

    const grouped = new Map<string, GeneratedRequirement[]>()

    for (const [module, reqIds] of Object.entries(parsed.modules)) {
      const moduleReqs = requirements.filter(r =>
        (reqIds as string[]).includes(r.id)
      )
      if (moduleReqs.length > 0) {
        grouped.set(module, moduleReqs)
      }
    }

    return grouped
  } catch (error) {
    console.error('Error grouping requirements:', error)
    const grouped = new Map<string, GeneratedRequirement[]>()
    grouped.set('All Requirements', requirements)
    return grouped
  }
}