import { GoogleGenerativeAI } from '@/lib/vertex-ai-wrapper'

export interface GapQuestion {
  id: string
  category: 'critical' | 'important' | 'optional'
  type: 'single' | 'multiple' | 'text' | 'cards'
  question: string
  reason: string
  documentContext?: string
  options?: Array<{
    value: string
    label: string
    description?: string
  }>
  placeholder?: string
  validation?: {
    required?: boolean
    minLength?: number
    maxLength?: number
  }
}

export async function generateGapQuestions(
  documentContent: string,
  gaps: {
    criticalGaps: string[]
    importantGaps: string[]
    optionalGaps: string[]
  },
  extractedInfo: any,
  apiKey: string
): Promise<GapQuestion[]> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

  const prompt = `You are a healthcare software compliance expert. Based on the document analysis, generate specific questions to fill the identified gaps.

Document Summary:
${JSON.stringify(extractedInfo, null, 2)}

Identified Gaps:
Critical: ${gaps.criticalGaps.join(', ') || 'None'}
Important: ${gaps.importantGaps.join(', ') || 'None'}
Optional: ${gaps.optionalGaps.join(', ') || 'None'}

Document Excerpt (first 2000 chars):
${documentContent.substring(0, 2000)}

Generate targeted questions for EACH gap identified. For each question:
1. Ask specifically about the missing information
2. Explain WHY this information is critical for compliance/testing
3. Reference what WAS found in the document to provide context
4. Suggest appropriate answer options when applicable

Rules:
- Questions should be specific to the document, not generic
- Prioritize critical gaps first, then important, then optional
- Maximum 8 questions total
- Each question must explain its compliance/testing importance
- Reference specific standards (FDA, ISO, IEC) when relevant
- If the document mentions something vaguely, ask for specifics

Generate questions in JSON format:
{
  "questions": [
    {
      "id": "unique-id-based-on-gap",
      "category": "critical|important|optional",
      "type": "single|multiple|cards",
      "question": "Specific question about the gap",
      "reason": "Detailed explanation of why this matters for compliance and testing",
      "documentContext": "What the document mentioned that prompted this question",
      "options": [
        {
          "value": "option-value",
          "label": "Option Label",
          "description": "Brief description"
        }
      ],
      "placeholder": "For text inputs only"
    }
  ]
}

Focus on:
- FDA classification if medical device mentioned but class unclear
- Specific HIPAA safeguards if PHI mentioned but security unclear
- ISO 13485 requirements if QMS mentioned but processes unclear
- IEC 62304 software safety class if safety-critical but level unclear
- Specific user roles and permissions if users mentioned generally
- Data retention and audit requirements if compliance mentioned
- Integration standards (HL7, FHIR, DICOM) if interoperability mentioned
- Performance metrics if reliability mentioned but not quantified

Return ONLY valid JSON.`

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

    const parsed = JSON.parse(jsonText)
    return parsed.questions || []
  } catch (error) {
    console.error('Error generating gap questions:', error)
    // Fallback to a few essential questions based on gaps
    return generateFallbackQuestions(gaps, extractedInfo)
  }
}

function generateFallbackQuestions(
  gaps: { criticalGaps: string[]; importantGaps: string[]; optionalGaps: string[] },
  extractedInfo: any
): GapQuestion[] {
  const questions: GapQuestion[] = []

  // Generate basic questions for critical gaps
  gaps.criticalGaps.slice(0, 3).forEach((gap, index) => {
    questions.push({
      id: `critical-gap-${index}`,
      category: 'critical',
      type: 'text',
      question: `Please provide information about: ${gap}`,
      reason: 'This information is critical for generating comprehensive test cases and ensuring regulatory compliance.',
      placeholder: 'Enter detailed information...'
    })
  })

  // Add important gaps
  gaps.importantGaps.slice(0, 2).forEach((gap, index) => {
    questions.push({
      id: `important-gap-${index}`,
      category: 'important',
      type: 'text',
      question: `Can you clarify: ${gap}`,
      reason: 'This information will improve the accuracy and completeness of requirements.',
      placeholder: 'Provide additional details...'
    })
  })

  return questions
}