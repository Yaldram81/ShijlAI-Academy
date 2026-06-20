import { GoogleGenAI } from '@google/genai'
import { AIProvider, AIModel } from '@prisma/client'

export class GeminiProvider {
  /**
   * Calls the Gemini API with the given provider, API key, model, and message options.
   */
  static async callGemini(
    provider: AIProvider,
    apiKey: string,
    model: AIModel,
    options: {
      systemPrompt?: string
      messages: Array<{ role: string; content: string }>
      maxOutputTokens?: number
      responseMimeType?: string
      responseSchema?: any
    }
  ) {
    const ai = new GoogleGenAI({ apiKey })

    // Map OpenAI messages to Gemini contents format
    const contents: any[] = []
    let systemInstruction = options.systemPrompt || ''

    for (const msg of options.messages) {
      if (msg.role === 'system') {
        systemInstruction = systemInstruction 
          ? `${systemInstruction}\n\n${msg.content}`
          : msg.content
      } else {
        const role = msg.role === 'assistant' ? 'model' : 'user'
        contents.push({
          role,
          parts: [{ text: msg.content }]
        })
      }
    }

    const config: any = {}
    if (systemInstruction) {
      config.systemInstruction = systemInstruction
    }
    if (options.responseMimeType) {
      config.responseMimeType = options.responseMimeType
    }
    if (options.responseSchema) {
      config.responseSchema = options.responseSchema
    }
    
    // Set token bounds
    const maxTokens = options.maxOutputTokens || model.maxOutputTokens || 4096
    config.maxOutputTokens = maxTokens

    const response = await ai.models.generateContent({
      model: model.modelId, // e.g. "gemini-2.5-flash"
      contents,
      config,
    })

    return response
  }
}
