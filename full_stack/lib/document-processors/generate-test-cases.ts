import { GoogleGenerativeAI } from '@/lib/vertex-ai-wrapper'

export interface GeneratedTestCase {
  title: string
  description: string
  type: 'functional' | 'integration' | 'performance' | 'security' | 'usability' | 'regression'
  priority: 'critical' | 'high' | 'medium' | 'low'
  preconditions: string
  steps: string[]
  expectedResult: string
  testData?: string
  requirementId?: string
}

export async function generateTestCasesForRequirement(
  requirement: {
    id: string
    title: string
    description: string
    type: string
    priority: string
    acceptanceCriteria?: string
    userStory?: string
    complianceTags?: string
  },
  projectContext?: {
    projectType?: string
    complianceStandards?: string[]
    targetUsers?: string[]
  },
  apiKey?: string
): Promise<GeneratedTestCase[]> {
  const genAI = new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

  const prompt = `You are an expert QA engineer specializing in healthcare software testing and regulatory compliance. Generate comprehensive test cases for this requirement with proactive compliance validation.

Requirement:
ID: ${requirement.id}
Title: ${requirement.title}
Description: ${requirement.description}
Type: ${requirement.type}
Priority: ${requirement.priority}
${requirement.acceptanceCriteria ? `Acceptance Criteria:\n${requirement.acceptanceCriteria}` : ''}
${requirement.userStory ? `User Story: ${requirement.userStory}` : ''}
${requirement.complianceTags ? `Existing Compliance Tags: ${requirement.complianceTags}` : ''}

${projectContext ? `Project Context:
- Type: ${projectContext.projectType || 'Healthcare Software'}
- Target Compliance: ${projectContext.complianceStandards?.join(', ') || 'Standard'}
- Users: ${projectContext.targetUsers?.join(', ') || 'Healthcare Professionals'}` : ''}

COMPLIANCE STANDARDS TO ANALYZE AGAINST:
Analyze this requirement and generate test cases that validate compliance with applicable standards from:

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
- WCAG: 2.1 AA (Accessibility for patient portals)

For EACH test case, determine applicable compliance validations based on:
- If it involves patient data → Include HIPAA Privacy/Security tests
- If it's a medical device/clinical feature → Include FDA/ISO 13485 validation
- If it handles EU data → Include GDPR compliance checks
- If it has authentication → Include NIST security controls
- If it exchanges data → Include HL7/FHIR interoperability tests
- If it's user-facing → Include IEC 62366 usability and WCAG accessibility

Generate 3-5 comprehensive test cases covering:
1. Positive/Happy path scenarios WITH compliance validation
2. Negative/Error scenarios WITH regulatory failure handling
3. Edge cases WITH compliance boundary testing
4. Specific compliance validation tests (audit trails, data protection, access controls)
5. Performance/Security aspects WITH regulatory requirements

For each test case, provide:
- Clear, descriptive title including compliance aspect
- Detailed description with compliance rationale
- Type (functional/integration/performance/security/usability/regression)
- Priority based on risk and regulatory importance
- Preconditions including compliance setup
- Step-by-step execution steps with compliance checkpoints
- Expected results including compliance verification
- Test data requirements (including PHI test data handling)
- Applicable compliance standards being validated

IMPORTANT: Even if no compliance tags are provided, proactively identify and test for applicable standards.
For healthcare software, ALWAYS include HIPAA and FDA 21 CFR Part 11 test validations unless clearly not applicable.

Generate test cases in JSON format:
{
  "testCases": [
    {
      "title": "Clear test case title",
      "description": "Detailed description",
      "type": "functional|integration|performance|security|usability|regression",
      "priority": "critical|high|medium|low",
      "preconditions": "What must be set up before testing",
      "steps": ["Step 1", "Step 2", "Step 3"],
      "expectedResult": "What should happen",
      "testData": "Any specific test data needed"
    }
  ]
}

Only return valid JSON:`

  try {
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    // Extract JSON from response
    let jsonText = responseText
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')

    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonText = jsonMatch[0]
    }

    // Clean up common issues
    jsonText = jsonText
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .trim()

    const parsed = JSON.parse(jsonText)
    const testCases = parsed.testCases || []

    // Add requirement ID to each test case
    return testCases.map((tc: GeneratedTestCase) => ({
      ...tc,
      requirementId: requirement.id
    }))
  } catch (error) {
    console.error('Error generating test cases:', error)
    return generateFallbackTestCases(requirement)
  }
}

function generateFallbackTestCases(requirement: any): GeneratedTestCase[] {
  const priority = requirement.priority?.toLowerCase() || 'medium'
  const baseTestCases: GeneratedTestCase[] = [
    {
      title: `Verify ${requirement.title} - Positive Scenario`,
      description: `Test that ${requirement.title} works correctly under normal conditions`,
      type: 'functional',
      priority: priority as any,
      preconditions: 'System is accessible and user has appropriate permissions',
      steps: [
        'Navigate to the relevant feature',
        `Execute the functionality: ${requirement.title}`,
        'Verify the operation completes successfully'
      ],
      expectedResult: 'Feature works as described in the requirement',
      requirementId: requirement.id
    }
  ]

  // Add negative test case for critical/high priority requirements
  if (priority === 'critical' || priority === 'high') {
    baseTestCases.push({
      title: `Verify ${requirement.title} - Error Handling`,
      description: `Test error handling for ${requirement.title}`,
      type: 'functional',
      priority: 'medium',
      preconditions: 'System is accessible',
      steps: [
        'Navigate to the relevant feature',
        'Provide invalid or missing input',
        'Attempt to execute the functionality'
      ],
      expectedResult: 'System displays appropriate error message and handles the error gracefully',
      requirementId: requirement.id
    })
  }

  // Add security test for compliance-related requirements
  if (requirement.complianceTags && requirement.complianceTags.includes('HIPAA')) {
    baseTestCases.push({
      title: `Verify ${requirement.title} - HIPAA Compliance`,
      description: `Ensure ${requirement.title} maintains HIPAA compliance`,
      type: 'security',
      priority: 'critical',
      preconditions: 'System configured with audit logging enabled',
      steps: [
        'Execute the functionality',
        'Verify audit logs are created',
        'Check data encryption in transit and at rest',
        'Verify access controls are enforced'
      ],
      expectedResult: 'All HIPAA requirements are met including audit trails and data protection',
      requirementId: requirement.id
    })
  }

  return baseTestCases
}

export async function generateTestCasesForMultipleRequirements(
  requirements: any[],
  projectContext?: any,
  apiKey?: string
): Promise<Map<string, GeneratedTestCase[]>> {
  const testCasesMap = new Map<string, GeneratedTestCase[]>()

  // Generate test cases for each requirement in parallel (batch of 3 at a time to avoid rate limits)
  const batchSize = 3
  for (let i = 0; i < requirements.length; i += batchSize) {
    const batch = requirements.slice(i, i + batchSize)
    const promises = batch.map(req =>
      generateTestCasesForRequirement(req, projectContext, apiKey)
    )

    const results = await Promise.all(promises)

    batch.forEach((req, index) => {
      testCasesMap.set(req.id, results[index])
    })

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < requirements.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return testCasesMap
}