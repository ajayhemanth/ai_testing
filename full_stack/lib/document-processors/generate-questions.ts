import { GoogleGenerativeAI } from '@/lib/vertex-ai-wrapper'

export interface MissingDataQuestion {
  id: string
  category: string
  question: string
  context: string
  importance: 'critical' | 'high' | 'medium' | 'low'
  expectedDataType: string
  examples?: string[]
}

export async function generateMissingDataQuestions(
  extractedContent: any,
  documentType: string,
  apiKey: string
): Promise<MissingDataQuestion[]> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

  const prompt = `You are a requirements engineering expert. Analyze this extracted document content and identify missing or unclear information that needs clarification.

Document Type: ${documentType}
Content:
${extractedContent.text.substring(0, 5000)}

Based on the document type and content, generate questions to gather missing critical information. Focus on:

1. For Requirements Documents:
   - Missing acceptance criteria
   - Undefined priority levels
   - Unclear user roles
   - Missing non-functional requirements
   - Unspecified compliance standards
   - Missing test scenarios

2. For Technical Specifications:
   - Missing system constraints
   - Undefined interfaces
   - Missing performance metrics
   - Unclear data flows
   - Missing error handling

3. For General Documents:
   - Missing context
   - Undefined terms
   - Unclear scope
   - Missing stakeholders

Generate questions in JSON format:
{
  "questions": [
    {
      "id": "Q001",
      "category": "Functional Requirements|Non-Functional|Compliance|Testing|General",
      "question": "Clear, specific question",
      "context": "Why this information is needed",
      "importance": "critical|high|medium|low",
      "expectedDataType": "text|number|boolean|list|date",
      "examples": ["Example answer 1", "Example answer 2"]
    }
  ]
}

Generate up to 10 most important questions. Only return valid JSON:`

  try {
    const result = await model.generateContent(prompt)
    const jsonText = result.response.text()
    const cleanJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    const parsed = JSON.parse(cleanJson)
    return parsed.questions || []
  } catch (error) {
    console.error('Error generating questions:', error)
    return generateDefaultQuestions(documentType)
  }
}

function generateDefaultQuestions(documentType: string): MissingDataQuestion[] {
  const baseQuestions: MissingDataQuestion[] = [
    {
      id: 'Q001',
      category: 'General',
      question: 'What is the primary purpose and scope of this system/feature?',
      context: 'Understanding the overall scope helps ensure all requirements align with project goals',
      importance: 'critical',
      expectedDataType: 'text',
      examples: ['Patient monitoring system for remote healthcare', 'E-commerce platform for B2B sales']
    },
    {
      id: 'Q002',
      category: 'Functional Requirements',
      question: 'Who are the primary users and what are their roles?',
      context: 'User roles determine access levels and functionality requirements',
      importance: 'critical',
      expectedDataType: 'list',
      examples: ['Doctors, Nurses, Patients, Administrators', 'Buyers, Sellers, Support Staff']
    },
    {
      id: 'Q003',
      category: 'Non-Functional',
      question: 'What are the performance requirements (response time, throughput, concurrent users)?',
      context: 'Performance requirements affect architecture and infrastructure decisions',
      importance: 'high',
      expectedDataType: 'text',
      examples: ['< 3 second response time, 10,000 concurrent users', '99.9% uptime']
    }
  ]

  if (documentType === 'requirements' || documentType === 'specification') {
    baseQuestions.push(
      {
        id: 'Q004',
        category: 'Compliance',
        question: 'Are there any regulatory compliance requirements (HIPAA, GDPR, FDA)?',
        context: 'Compliance requirements may require specific security and audit features',
        importance: 'critical',
        expectedDataType: 'list',
        examples: ['HIPAA for healthcare data', 'GDPR for EU users', 'FDA 21 CFR Part 11']
      },
      {
        id: 'Q005',
        category: 'Testing',
        question: 'What are the acceptance criteria for each requirement?',
        context: 'Clear acceptance criteria are needed to validate implementation',
        importance: 'high',
        expectedDataType: 'text',
        examples: ['User can login with valid credentials within 2 seconds', 'System logs all access attempts']
      }
    )
  }

  return baseQuestions
}

export async function askFollowUpQuestion(
  question: MissingDataQuestion,
  userAnswer: string,
  apiKey: string
): Promise<{ isComplete: boolean; followUp?: string }> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

  const prompt = `Evaluate if this answer is complete and sufficient for the given question.

Question: ${question.question}
Context: ${question.context}
Expected Data Type: ${question.expectedDataType}
User Answer: ${userAnswer}

Determine if the answer is:
1. Complete and sufficient
2. Needs clarification or more detail

Return JSON:
{
  "isComplete": true/false,
  "followUp": "Follow-up question if needed"
}

Only return valid JSON:`

  try {
    const result = await model.generateContent(prompt)
    const jsonText = result.response.text()
    const cleanJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    return JSON.parse(cleanJson)
  } catch (error) {
    console.error('Error evaluating answer:', error)
    return { isComplete: true }
  }
}