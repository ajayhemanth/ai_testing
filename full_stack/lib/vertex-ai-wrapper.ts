import { VertexAI } from '@google-cloud/vertexai'
import path from 'path'
import fs from 'fs'

// Service account configuration
const serviceAccountPath = path.join(process.cwd(), '..', 'service_account.json')
let vertexClient: VertexAI | null = null

// Initialize Vertex AI client
function getVertexClient(): VertexAI {
  if (!vertexClient) {
    // Read service account for project ID
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'))
    const projectId = serviceAccount.project_id || 'cloud-billed-1'

    vertexClient = new VertexAI({
      project: projectId,
      location: 'us-central1',
      googleAuthOptions: {
        keyFilename: serviceAccountPath
      }
    })
  }
  return vertexClient
}

// Mimic Gemini's GoogleGenerativeAI class
export class GoogleGenerativeAI {
  private apiKey: string

  constructor(apiKey: string) {
    // We accept the API key for compatibility but use service account instead
    this.apiKey = apiKey
  }

  getGenerativeModel(config: { model: string }) {
    const vertex = getVertexClient()

    // Map Gemini model names to Vertex AI model names
    let modelName = config.model

    const vertexModel = vertex.preview.getGenerativeModel({
      model: modelName,
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
        topP: 0.8,
        topK: 40
      }
    })

    // Return an object that mimics Gemini's model interface
    return {
      generateContent: async (prompt: string | { contents: any[] }) => {
        try {
          let contents: any[]

          if (typeof prompt === 'string') {
            contents = [{
              role: 'user',
              parts: [{ text: prompt }]
            }]
          } else {
            contents = prompt.contents
          }

          const result = await vertexModel.generateContent({
            contents: contents
          })

          // Mimic Gemini's response structure
          return {
            response: {
              text: () => {
                const candidate = result.response?.candidates?.[0]
                if (!candidate || !candidate.content || !candidate.content.parts) {
                  throw new Error('No response generated')
                }

                const textParts = candidate.content.parts
                  .filter((part: any) => part.text)
                  .map((part: any) => part.text)
                  .join('')

                return textParts
              },
              candidates: result.response?.candidates || []
            }
          }
        } catch (error: any) {
          console.error('Vertex AI generation error:', error)
          throw new Error(`Generation failed: ${error.message}`)
        }
      },

      generateContentStream: async (prompt: string | { contents: any[] }) => {
        try {
          let contents: any[]

          if (typeof prompt === 'string') {
            contents = [{
              role: 'user',
              parts: [{ text: prompt }]
            }]
          } else {
            contents = prompt.contents
          }

          const streamingResult = await vertexModel.generateContentStream({
            contents: contents
          })

          // Mimic Gemini's streaming response structure
          return {
            stream: (async function* () {
              for await (const chunk of streamingResult.stream) {
                yield {
                  text: () => {
                    const candidate = chunk.candidates?.[0]
                    if (!candidate || !candidate.content || !candidate.content.parts) {
                      return ''
                    }

                    const textParts = candidate.content.parts
                      .filter((part: any) => part.text)
                      .map((part: any) => part.text)
                      .join('')

                    return textParts
                  },
                  candidates: chunk.candidates || []
                }
              }
            })(),

            response: streamingResult.response
          }
        } catch (error: any) {
          console.error('Vertex AI streaming error:', error)
          throw new Error(`Streaming generation failed: ${error.message}`)
        }
      },

      startChat: (config?: { history?: any[], generationConfig?: any, safetySettings?: any[] }) => {
        const chatSession = vertexModel.startChat({
          history: config?.history || [],
          generationConfig: config?.generationConfig,
          safetySettings: config?.safetySettings
        })

        // Return an object that mimics Gemini's chat interface
        return {
          sendMessage: async (message: string) => {
            try {
              const result = await chatSession.sendMessage(message)

              return {
                response: {
                  text: () => {
                    const candidate = result.response?.candidates?.[0]
                    if (!candidate || !candidate.content || !candidate.content.parts) {
                      throw new Error('No response generated')
                    }

                    const textParts = candidate.content.parts
                      .filter((part: any) => part.text)
                      .map((part: any) => part.text)
                      .join('')

                    return textParts
                  },
                  candidates: result.response?.candidates || []
                }
              }
            } catch (error: any) {
              console.error('Vertex AI chat error:', error)
              throw new Error(`Chat failed: ${error.message}`)
            }
          },

          sendMessageStream: async (message: string) => {
            try {
              const streamingResult = await chatSession.sendMessageStream(message)

              return {
                stream: (async function* () {
                  for await (const chunk of streamingResult.stream) {
                    yield {
                      text: () => {
                        const candidate = chunk.candidates?.[0]
                        if (!candidate || !candidate.content || !candidate.content.parts) {
                          return ''
                        }

                        const textParts = candidate.content.parts
                          .filter((part: any) => part.text)
                          .map((part: any) => part.text)
                          .join('')

                        return textParts
                      },
                      candidates: chunk.candidates || []
                    }
                  }
                })(),

                response: streamingResult.response
              }
            } catch (error: any) {
              console.error('Vertex AI chat streaming error:', error)
              throw new Error(`Chat streaming failed: ${error.message}`)
            }
          }
        }
      }
    }
  }
}

// Export a compatibility function for environments checking for API key
export function isVertexConfigured(): boolean {
  try {
    return fs.existsSync(serviceAccountPath)
  } catch {
    return false
  }
}