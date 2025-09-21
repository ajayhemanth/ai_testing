import { GoogleGenerativeAI } from '@/lib/vertex-ai-wrapper'

export interface TestCaseImprovement {
  improvedTitle?: string
  improvedDescription?: string
  improvedSteps?: string[]
  improvedExpectedResults?: string
  suggestedComplianceTags?: string[]
  suggestedPriority?: 'critical' | 'high' | 'medium' | 'low'
  suggestedCategory?: string
  improvements?: string[]
  complianceGaps?: string[]
}

export async function generateTestCaseImprovements(
  testCase: {
    title: string
    description?: string
    testSteps?: string
    expectedResults?: string
    category?: string
    priority?: string
    requirement?: {
      title: string
      description?: string
      complianceTags?: string
    }
    project?: {
      name: string
      softwareType?: string
      targetCompliances?: string
    }
  },
  apiKey?: string
): Promise<TestCaseImprovement> {
  const genAI = new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

  // Extract existing compliance tags
  const existingCompliance = testCase.requirement?.complianceTags?.split(',').map(t => t.trim()).filter(Boolean) || []
  const projectCompliance = testCase.project?.targetCompliances?.split(',').map(t => t.trim()).filter(Boolean) || []
  const allCompliance = [...new Set([...existingCompliance, ...projectCompliance])]

  const prompt = `You are an expert QA engineer specializing in healthcare software testing and compliance. Analyze and improve this test case.

Current Test Case:
Title: ${testCase.title}
Description: ${testCase.description || 'Not provided'}
Category: ${testCase.category || 'Not specified'}
Priority: ${testCase.priority || 'Not specified'}
Test Steps: ${testCase.testSteps || 'Not provided'}
Expected Results: ${testCase.expectedResults || 'Not provided'}

Related Requirement:
${testCase.requirement ? `Title: ${testCase.requirement.title}
Description: ${testCase.requirement.description || 'Not provided'}
Compliance: ${testCase.requirement.complianceTags || 'None'}` : 'No requirement linked'}

Project Context:
${testCase.project ? `Name: ${testCase.project.name}
Type: ${testCase.project.softwareType || 'Healthcare Software'}
Target Compliance: ${testCase.project.targetCompliances || 'Standard'}` : 'No project context'}

Existing Compliance Standards to Consider: ${allCompliance.length > 0 ? allCompliance.join(', ') : 'None specified'}

Please analyze and suggest improvements focusing on:

1. Title clarity and specificity
2. Comprehensive test coverage
3. Step-by-step clarity and completeness
4. Expected results precision
5. Compliance requirements coverage
6. Medical/Healthcare specific concerns
7. Risk-based priority assessment

For compliance, consider these healthcare standards if relevant:
- FDA: 21 CFR Part 11 (Electronic Records), 21 CFR Part 820 (Quality System), 510(k), PMA
- ISO: 13485 (Medical Devices), 14971 (Risk Management), 62304 (Medical Device Software)
- IEC: 62366 (Usability), 60601 (Medical Electrical Equipment)
- HIPAA: Privacy Rule, Security Rule, Breach Notification
- GDPR: Data Protection, Privacy by Design
- HL7/FHIR: Interoperability Standards
- DICOM: Medical Imaging Standards

Generate improvements in JSON format:
{
  "improvedTitle": "Clear, specific title that describes what is being tested",
  "improvedDescription": "Comprehensive description including purpose and scope",
  "improvedSteps": ["Step 1: Specific action", "Step 2: Next action", "Step 3: Verification"],
  "improvedExpectedResults": "Detailed expected outcome including success criteria",
  "suggestedComplianceTags": ["HIPAA", "FDA 21 CFR Part 11", "ISO 13485"],
  "suggestedPriority": "critical|high|medium|low based on risk",
  "suggestedCategory": "functional|security|performance|compliance|usability",
  "improvements": ["List of specific improvements made"],
  "complianceGaps": ["Any compliance requirements not addressed"]
}

Return ONLY valid JSON. Focus on practical, actionable improvements specific to healthcare software testing.`

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

    const improvements = JSON.parse(jsonText)

    // Ensure all fields are present
    return {
      improvedTitle: improvements.improvedTitle || testCase.title,
      improvedDescription: improvements.improvedDescription || testCase.description,
      improvedSteps: improvements.improvedSteps || (testCase.testSteps ? testCase.testSteps.split('\n') : []),
      improvedExpectedResults: improvements.improvedExpectedResults || testCase.expectedResults,
      suggestedComplianceTags: improvements.suggestedComplianceTags || existingCompliance,
      suggestedPriority: improvements.suggestedPriority || testCase.priority as any,
      suggestedCategory: improvements.suggestedCategory || testCase.category,
      improvements: improvements.improvements || [],
      complianceGaps: improvements.complianceGaps || []
    }
  } catch (error) {
    console.error('Error generating test case improvements:', error)

    // Return original with basic suggestions
    return {
      improvedTitle: testCase.title,
      improvedDescription: testCase.description,
      improvedSteps: testCase.testSteps ? testCase.testSteps.split('\n') : [],
      improvedExpectedResults: testCase.expectedResults,
      suggestedComplianceTags: existingCompliance,
      suggestedPriority: testCase.priority as any,
      suggestedCategory: testCase.category,
      improvements: ['Review test steps for clarity', 'Ensure compliance requirements are met'],
      complianceGaps: []
    }
  }
}