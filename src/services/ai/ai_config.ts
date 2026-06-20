import { db } from '@/lib/db'
import { AIConfiguration, AIProvider, AIModel } from '@prisma/client'

export class AIConfigManager {
  static async getConfig(): Promise<AIConfiguration> {
    let config = await db.aIConfiguration.findFirst()
    if (!config) {
      config = await db.aIConfiguration.create({ data: {} })
    }
    return config
  }

  static async getActiveProviders(): Promise<AIProvider[]> {
    return db.aIProvider.findMany({
      where: {
        isActive: true,
        type: 'llm',
        apiKey: { not: null, not: '' },
      },
      orderBy: {
        priority: 'desc',
      },
    })
  }

  static async getModel(complexity: 'fast' | 'complex'): Promise<AIModel> {
    const config = await this.getConfig()
    
    let modelId = complexity === 'complex' ? config.fallbackModelId : config.defaultModelId
    
    if (modelId) {
      const model = await db.aIModel.findUnique({
        where: { id: modelId },
      })
      if (model && model.isActive) {
        return model
      }
    }

    // Fallbacks if not set or inactive
    // Find a model associated with an active Google provider, or any active model
    const activeGoogleModel = await db.aIModel.findFirst({
      where: {
        isActive: true,
        provider: {
          slug: { in: ['google', 'gemini'] },
          isActive: true
        },
        isDefault: complexity === 'complex' ? false : true // fallback guess
      },
      include: { provider: true }
    })

    if (activeGoogleModel) return activeGoogleModel

    const anyActiveModel = await db.aIModel.findFirst({
      where: {
        isActive: true,
        provider: {
          isActive: true
        }
      }
    })

    if (!anyActiveModel) {
      throw new Error('No active AI models associated with active providers found in the database.')
    }

    return anyActiveModel
  }

  static async getNextApiKey(): Promise<{ provider: AIProvider; apiKey: string }> {
    const providers = await this.getActiveProviders()
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const availableProviders: AIProvider[] = []
    
    for (const provider of providers) {
      if (provider.healthStatus === 'down') continue

      // Budget check
      if (provider.monthlyBudget !== null && provider.monthlyBudget !== undefined) {
        const costAgg = await db.aIUsageLog.aggregate({
          _sum: { costUSD: true },
          where: {
            providerId: provider.id,
            createdAt: { gte: startOfMonth }
          }
        })
        const spent = costAgg._sum.costUSD || 0
        if (spent >= provider.monthlyBudget) {
          console.warn(`Provider ${provider.name} exceeded monthly budget of $${provider.monthlyBudget}. Current spent: $${spent}`)
          continue
        }
      }

      availableProviders.push(provider)
    }

    if (availableProviders.length === 0) {
      // If all are down/budget-exceeded, try to use any active provider as a last resort
      const fallbackProviders = providers.filter(p => p.isActive)
      if (fallbackProviders.length > 0) {
        return {
          provider: fallbackProviders[0],
          apiKey: fallbackProviders[0].apiKey!,
        }
      }
      
      // Try environment variable as the absolute ultimate fallback
      const envKey = process.env.GEMINI_API_KEY
      if (envKey) {
        return {
          provider: {
            id: 'env-fallback',
            name: 'Google Env Fallback',
            slug: 'google-env-fallback',
            type: 'llm',
            apiKey: envKey,
            apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta',
            isActive: true,
            isDefault: false,
            priority: 0,
            config: '{}',
            monthlyBudget: null,
            healthStatus: 'healthy',
            lastHealthCheck: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          apiKey: envKey,
        }
      }

      throw new Error('All Gemini/Google AI API keys are exhausted, rate-limited, or exceeded monthly budget, and no GEMINI_API_KEY environment variable is set.')
    }

    // Sort: healthy first, then priority DESC
    availableProviders.sort((a, b) => {
      const getHealthScore = (status: string) => {
        if (status === 'healthy') return 3
        if (status === 'unknown') return 2
        if (status === 'degraded') return 1
        return 0
      }

      const scoreA = getHealthScore(a.healthStatus)
      const scoreB = getHealthScore(b.healthStatus)

      if (scoreA !== scoreB) {
        return scoreB - scoreA
      }
      return b.priority - a.priority
    })

    const selected = availableProviders[0]
    return {
      provider: selected,
      apiKey: selected.apiKey!,
    }
  }

  static async markKeyDegraded(providerId: string): Promise<void> {
    if (providerId === 'env-fallback') return
    try {
      await db.aIProvider.update({
        where: { id: providerId },
        data: {
          healthStatus: 'degraded',
          lastHealthCheck: new Date(),
        },
      })
      
      await db.aIAuditLog.create({
        data: {
          action: 'provider_degraded',
          category: 'security',
          description: `AI Provider with ID ${providerId} was marked as degraded due to rate limiting (429) or API error.`,
          severity: 'warning',
        }
      })
    } catch (err) {
      console.error(`Failed to mark provider ${providerId} degraded:`, err)
    }
  }

  static async markKeyHealthy(providerId: string): Promise<void> {
    if (providerId === 'env-fallback') return
    try {
      await db.aIProvider.update({
        where: { id: providerId },
        data: {
          healthStatus: 'healthy',
          lastHealthCheck: new Date(),
        },
      })
    } catch (err) {
      console.error(`Failed to mark provider ${providerId} healthy:`, err)
    }
  }
}
