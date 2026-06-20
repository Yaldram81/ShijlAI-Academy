import { db } from '@/lib/db'
import { AIConfigManager } from './ai_config'
import { GeminiProvider } from './gemini_provider'

export class AIService {
  /**
   * Generates a conversational text response from the AI.
   */
  static async chat(options: ChatOptions): Promise<string> {
    return this.executeWithRetry(options, false) as Promise<string>
  }

  /**
   * Generates a structured JSON object response from the AI.
   */
  static async generateJSON<T>(options: JSONOptions): Promise<T> {
    const result = await this.executeWithRetry({
      ...options,
      responseMimeType: 'application/json',
      responseSchema: options.schema,
    }, true)
    return result as T
  }
  
  private static async executeWithRetry(
    options: ChatOptions & { responseMimeType?: string; responseSchema?: any },
    isJson: boolean
  ): Promise<any> {
    const complexity = options.complexity || 'fast'
    const model = await AIConfigManager.getModel(complexity)
    const startTime = Date.now()
    
    let attempts = 0
    const activeProviders = await AIConfigManager.getActiveProviders()
    const maxAttempts = Math.max(3, activeProviders.length)
    
    let lastError: any = null
    
    while (attempts < maxAttempts) {
      let providerInfo: { provider: any; apiKey: string } | null = null
      try {
        providerInfo = await AIConfigManager.getNextApiKey()
      } catch (err) {
        lastError = err
        break
      }
      
      const { provider, apiKey } = providerInfo
      attempts++
      
      try {
        const response = await GeminiProvider.callGemini(provider, apiKey, model, {
          systemPrompt: options.systemPrompt,
          messages: options.messages,
          maxOutputTokens: options.maxOutputTokens,
          responseMimeType: options.responseMimeType,
          responseSchema: options.responseSchema,
        })
        
        const text = response.text || ''
        const latencyMs = Date.now() - startTime
        
        // Extract token usage
        const promptTokens = response.usageMetadata?.promptTokenCount || 0
        const completionTokens = response.usageMetadata?.candidatesTokenCount || 0
        const totalTokens = response.usageMetadata?.totalTokenCount || 0
        
        // Calculate cost (standard OpenAI pricing units mapping)
        const inputCost = (promptTokens / 1000000) * model.inputPricePer1M
        const outputCost = (completionTokens / 1000000) * model.outputPricePer1M
        const costUSD = inputCost + outputCost
        
        // Log usage to DB
        db.aIUsageLog.create({
          data: {
            providerId: provider.id,
            modelId: model.id,
            feature: options.feature || 'unknown',
            action: isJson ? 'json_generation' : 'chat_completion',
            promptTokens,
            completionTokens,
            totalTokens,
            costUSD,
            latencyMs,
            status: 'success',
            userId: options.userId || null,
            courseId: options.courseId || null,
            sessionId: options.sessionId || null,
          }
        }).catch(err => console.error('Failed to write AI usage log:', err))
        
        // Mark key healthy since it succeeded
        if (provider.id !== 'env-fallback') {
          await AIConfigManager.markKeyHealthy(provider.id)
        }
        
        if (isJson) {
          try {
            return JSON.parse(text)
          } catch (jsonErr) {
            // Cleanup standard markdown json markers
            const cleaned = text
              .replace(/^```(?:json)?\s*/i, '')
              .replace(/\s*```$/i, '')
              .trim()
            try {
              return JSON.parse(cleaned)
            } catch (innerErr) {
              console.error('Failed to parse JSON response from Gemini:', text, innerErr)
              throw new Error('AI returned invalid JSON format: ' + innerErr.message)
            }
          }
        }
        
        return text
      } catch (error: any) {
        console.error(`Attempt ${attempts} failed with provider ${provider.name}:`, error)
        lastError = error
        
        const errorMsg = error?.message || ''
        const isRateLimit = errorMsg.includes('429') || 
                            errorMsg.toLowerCase().includes('rate limit') || 
                            errorMsg.toLowerCase().includes('quota') ||
                            errorMsg.toLowerCase().includes('too many requests')
                            
        // Mark key degraded on rate limit
        if (isRateLimit && provider.id !== 'env-fallback') {
          await AIConfigManager.markKeyDegraded(provider.id)
        }
        
        // Log failure to DB
        db.aIUsageLog.create({
          data: {
            providerId: provider.id,
            modelId: model.id,
            feature: options.feature || 'unknown',
            action: isJson ? 'json_generation' : 'chat_completion',
            status: isRateLimit ? 'rate_limited' : 'error',
            errorMessage: errorMsg.slice(0, 1000),
            errorCode: error?.status?.toString() || null,
            userId: options.userId || null,
            courseId: options.courseId || null,
            sessionId: options.sessionId || null,
          }
        }).catch(err => console.error('Failed to write failure AI usage log:', err))
      }
    }
    
    // If we reach here, all attempts failed
    throw lastError || new Error('AI execution failed across all available providers.')
  }
}

export interface ChatOptions {
  systemPrompt?: string
  messages: Array<{ role: string; content: string }>
  complexity?: 'fast' | 'complex'
  feature?: string
  userId?: string
  courseId?: string
  sessionId?: string
  maxOutputTokens?: number
}

export interface JSONOptions extends ChatOptions {
  schema?: any
}
