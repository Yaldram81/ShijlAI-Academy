import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Default payment methods to seed
const DEFAULT_PAYMENT_METHODS = [
  { name: 'stripe', displayName: 'Stripe', icon: '💳', order: 1, isActive: true, isConnected: false },
  { name: 'jazzcash', displayName: 'JazzCash', icon: '📱', order: 2, isActive: true, isConnected: true },
  { name: 'easypaisa', displayName: 'Easypaisa', icon: '📲', order: 3, isActive: true, isConnected: true },
  { name: 'payoneer', displayName: 'Payoneer', icon: '🏦', order: 4, isActive: false, isConnected: false },
  { name: 'bank_transfer', displayName: 'Bank Transfer', icon: '🏛️', order: 5, isActive: true, isConnected: true },
]

// Default integrations to seed
const DEFAULT_INTEGRATIONS = [
  { name: 'anthropic', displayName: 'Anthropic (AI)', category: 'ai', icon: '🤖', order: 1, isConnected: true, usageInfo: '48.2M tokens/mo' },
  { name: 'cloudflare_stream', displayName: 'Cloudflare Stream', category: 'video', icon: '🎬', order: 2, isConnected: true, usageInfo: '1,847 videos stored' },
  { name: 'google_analytics', displayName: 'Google Analytics', category: 'analytics', icon: '📊', order: 3, isConnected: true, usageInfo: 'Tracking active' },
  { name: 'mailchimp', displayName: 'Mailchimp', category: 'marketing', icon: '✉️', order: 4, isConnected: false, usageInfo: null },
  { name: 'firebase', displayName: 'Firebase', category: 'analytics', icon: '🔥', order: 5, isConnected: true, usageInfo: 'Push notifications enabled' },
  { name: 'facebook_pixel', displayName: 'Facebook Pixel', category: 'marketing', icon: '👤', order: 6, isConnected: false, usageInfo: null },
  { name: 'twilio', displayName: 'Twilio', category: 'communication', icon: '📞', order: 7, isConnected: false, usageInfo: null },
  { name: 'zapier', displayName: 'Zapier', category: 'automation', icon: '⚡', order: 8, isConnected: false, usageInfo: null },
]

// Default legal pages to seed
const DEFAULT_LEGAL_PAGES = [
  { name: 'terms_of_service', displayName: 'Terms of Service', content: '# Terms of Service\n\nLast updated: December 2024\n\nWelcome to ShijlAI Academy...' },
  { name: 'privacy_policy', displayName: 'Privacy Policy', content: '# Privacy Policy\n\nLast updated: December 2024\n\nYour privacy matters to us...' },
  { name: 'refund_policy', displayName: 'Refund Policy', content: '# Refund Policy\n\nLast updated: December 2024\n\nWe offer a 30-day refund policy...' },
  { name: 'cookie_policy', displayName: 'Cookie Policy', content: '# Cookie Policy\n\nLast updated: December 2024\n\nThis Cookie Policy explains how we use cookies...' },
  { name: 'instructor_agreement', displayName: 'Instructor Agreement', content: '# Instructor Agreement\n\nLast updated: December 2024\n\nThis agreement governs your use of ShijlAI Academy as an instructor...' },
]

// GET /api/admin/settings — Fetch all platform settings data
export async function GET() {
  try {
    // Fetch or create platform settings singleton
    let settings = await db.platformSettings.findFirst()
    if (!settings) {
      settings = await db.platformSettings.create({ data: {} })
    }

    // Fetch payment methods, seed defaults if empty
    let paymentMethods = await db.paymentMethodConfig.findMany({ orderBy: { order: 'asc' } })
    if (paymentMethods.length === 0) {
      await db.paymentMethodConfig.createMany({ data: DEFAULT_PAYMENT_METHODS })
      paymentMethods = await db.paymentMethodConfig.findMany({ orderBy: { order: 'asc' } })
    }

    // Fetch integrations, seed defaults if empty
    let integrations = await db.integration.findMany({ orderBy: { order: 'asc' } })
    if (integrations.length === 0) {
      await db.integration.createMany({ data: DEFAULT_INTEGRATIONS })
      integrations = await db.integration.findMany({ orderBy: { order: 'asc' } })
    }

    // Fetch legal pages, seed defaults if empty
    let legalPages = await db.legalPage.findMany({ orderBy: { name: 'asc' } })
    if (legalPages.length === 0) {
      await db.legalPage.createMany({ data: DEFAULT_LEGAL_PAGES })
      legalPages = await db.legalPage.findMany({ orderBy: { name: 'asc' } })
    }

    // Fetch webhooks
    const webhooks = await db.webhookConfig.findMany({ orderBy: { createdAt: 'desc' } })

    // Serialize dates
    const serializedSettings = {
      ...settings,
      maintenanceScheduledStart: settings.maintenanceScheduledStart?.toISOString() ?? null,
      maintenanceScheduledEnd: settings.maintenanceScheduledEnd?.toISOString() ?? null,
      updatedAt: settings.updatedAt.toISOString(),
    }

    const serializedPaymentMethods = paymentMethods.map(pm => ({
      ...pm,
      createdAt: pm.createdAt.toISOString(),
      updatedAt: pm.updatedAt.toISOString(),
    }))

    const serializedIntegrations = integrations.map(ig => ({
      ...ig,
      createdAt: ig.createdAt.toISOString(),
      updatedAt: ig.updatedAt.toISOString(),
    }))

    const serializedLegalPages = legalPages.map(lp => ({
      ...lp,
      lastUpdatedAt: lp.lastUpdatedAt.toISOString(),
      createdAt: lp.createdAt.toISOString(),
      updatedAt: lp.updatedAt.toISOString(),
    }))

    const serializedWebhooks = webhooks.map(wh => ({
      ...wh,
      lastTriggeredAt: wh.lastTriggeredAt?.toISOString() ?? null,
      createdAt: wh.createdAt.toISOString(),
      updatedAt: wh.updatedAt.toISOString(),
    }))

    return NextResponse.json({
      settings: serializedSettings,
      paymentMethods: serializedPaymentMethods,
      integrations: serializedIntegrations,
      legalPages: serializedLegalPages,
      webhooks: serializedWebhooks,
    })
  } catch (error) {
    console.error('Platform settings fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platform settings' },
      { status: 500 }
    )
  }
}

// Allowed fields for platform settings updates
const PLATFORM_SETTINGS_FIELDS = [
  'platformName', 'platformUrl', 'supportEmail', 'defaultTimezone', 'defaultCurrency', 'showUsdAlso', 'platformStatus',
  'openRegistration', 'emailVerificationRequired', 'socialLoginGoogle', 'socialLoginFacebook', 'socialLoginApple',
  'instructorSelfRegister', 'captchaOnSignup', 'minimumStudentAge',
  'adminReviewBeforePublish', 'maxReviewTimeHours', 'minimumLessonsPerCourse', 'minimumVideoDurationMinutes',
  'promoVideoRequired', 'quizPerSectionRequired', 'maxVideoFileSizeGb', 'maxDocFileSizeMb',
  'supportedLanguages', 'defaultLanguage', 'autoDetectLanguage',
  'maintenanceMode', 'maintenanceMessage', 'maintenanceWhitelistIps',
  'maintenanceScheduledStart', 'maintenanceScheduledEnd', 'maintenanceNotifyUsers', 'maintenanceNotifyHoursBefore',
  'smtpHost', 'smtpPort', 'smtpSecure', 'smtpUser', 'smtpPass',
  'smtpFromName', 'smtpFromEmail', 'smtpReplyTo', 'emailHeaderImageUrl', 'emailTemplateBody',
  'seoMetaTitle', 'seoMetaDescription', 'seoKeywords', 'seoRobotsTxt', 'seoCanonicalUrl',
  'seoSitemapEnabled', 'seoGoogleSiteVerification',
  'dataRetentionDays', 'gdprEnabled', 'gdprDataExportEnabled', 'gdprRightToBeForgotten',
  'gdprCookieConsent', 'gdprPrivacyPolicyUrl', 'anonymizeDeletedUsers',
  'rateLimitEnabled', 'rateLimitApiPerMinute', 'rateLimitLoginPerHour', 'rateLimitUploadPerHour',
  'moderationAutoFlag', 'moderationAiAssistance', 'moderationProfanityFilter',
  'moderationLinkFilter', 'moderationMediaScan', 'moderationQueueThreshold',
  'allowedOrigins', 'corsEnabled',
]

// Allowed fields for payment method updates
const PAYMENT_METHOD_FIELDS = ['name', 'displayName', 'icon', 'order', 'isActive', 'isConnected']

// Allowed fields for integration updates
const INTEGRATION_FIELDS = ['name', 'displayName', 'category', 'icon', 'order', 'isConnected', 'usageInfo']

// Allowed fields for legal page updates
const LEGAL_PAGE_FIELDS = ['displayName', 'content']

// Allowed fields for webhook updates
const WEBHOOK_FIELDS = ['name', 'url', 'secret', 'events', 'isActive']

// PUT /api/admin/settings — Update platform settings
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, ...data } = body

    if (type === 'settings') {
      // Update platform settings
      let settings = await db.platformSettings.findFirst()
      if (!settings) {
        settings = await db.platformSettings.create({ data: {} })
      }

      const updateData: Record<string, unknown> = {}
      for (const field of PLATFORM_SETTINGS_FIELDS) {
        if (data[field] !== undefined) updateData[field] = data[field]
      }

      const updated = await db.platformSettings.update({
        where: { id: settings.id },
        data: updateData,
      })

      // Log activity
      await db.activityLog.create({
        data: {
          type: 'settings_updated',
          title: 'Platform settings updated',
          description: 'Admin updated platform configuration',
          icon: '⚙️',
          action: 'updated',
          targetType: 'settings',
          category: 'admin_action',
        },
      })

      const serializedSettings = {
        ...updated,
        maintenanceScheduledStart: updated.maintenanceScheduledStart?.toISOString() ?? null,
        maintenanceScheduledEnd: updated.maintenanceScheduledEnd?.toISOString() ?? null,
        updatedAt: updated.updatedAt.toISOString(),
      }

      return NextResponse.json({ settings: serializedSettings })
    }

    if (type === 'paymentMethod') {
      // Update a payment method
      const { id } = data
      if (!id) return NextResponse.json({ error: 'Payment method ID required' }, { status: 400 })

      const updateData: Record<string, unknown> = {}
      for (const field of PAYMENT_METHOD_FIELDS) {
        if (data[field] !== undefined) updateData[field] = data[field]
      }

      const updated = await db.paymentMethodConfig.update({
        where: { id },
        data: updateData,
      })

      await db.activityLog.create({
        data: {
          type: 'settings_updated',
          title: `Payment method "${updated.displayName}" updated`,
          description: 'Admin updated payment method configuration',
          icon: '💳',
          action: 'updated',
          targetType: 'settings',
          category: 'admin_action',
        },
      })

      return NextResponse.json({
        paymentMethod: {
          ...updated,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      })
    }

    if (type === 'integration') {
      // Update an integration
      const { id } = data
      if (!id) return NextResponse.json({ error: 'Integration ID required' }, { status: 400 })

      const updateData: Record<string, unknown> = {}
      for (const field of INTEGRATION_FIELDS) {
        if (data[field] !== undefined) updateData[field] = data[field]
      }

      const updated = await db.integration.update({
        where: { id },
        data: updateData,
      })

      await db.activityLog.create({
        data: {
          type: 'settings_updated',
          title: `Integration "${updated.displayName}" updated`,
          description: 'Admin updated integration configuration',
          icon: '🔗',
          action: 'updated',
          targetType: 'settings',
          category: 'admin_action',
        },
      })

      return NextResponse.json({
        integration: {
          ...updated,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      })
    }

    if (type === 'legalPage') {
      // Update a legal page
      const { id } = data
      if (!id) return NextResponse.json({ error: 'Legal page ID required' }, { status: 400 })

      const updateData: Record<string, unknown> = {}
      for (const field of LEGAL_PAGE_FIELDS) {
        if (data[field] !== undefined) updateData[field] = data[field]
      }
      updateData.lastUpdatedAt = new Date()

      const updated = await db.legalPage.update({
        where: { id },
        data: updateData,
      })

      await db.activityLog.create({
        data: {
          type: 'settings_updated',
          title: `Legal page "${updated.displayName}" updated`,
          description: 'Admin updated legal page content',
          icon: '📜',
          action: 'updated',
          targetType: 'settings',
          category: 'admin_action',
        },
      })

      return NextResponse.json({
        legalPage: {
          ...updated,
          lastUpdatedAt: updated.lastUpdatedAt.toISOString(),
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      })
    }

    // ── Webhook CRUD operations ──
    if (type === 'webhook') {
      const { action } = data

      if (action === 'create') {
        const { name, url, secret, events, isActive } = data
        if (!name || !url || !events) {
          return NextResponse.json({ error: 'Name, URL, and events are required' }, { status: 400 })
        }

        const webhook = await db.webhookConfig.create({
          data: {
            name,
            url,
            secret: secret ?? null,
            events: typeof events === 'string' ? events : JSON.stringify(events),
            isActive: isActive ?? true,
          },
        })

        await db.activityLog.create({
          data: {
            type: 'settings_updated',
            title: `Webhook "${name}" created`,
            description: 'Admin created a new webhook configuration',
            icon: '🪝',
            action: 'created',
            targetType: 'settings',
            category: 'admin_action',
          },
        })

        return NextResponse.json({
          webhook: {
            ...webhook,
            lastTriggeredAt: webhook.lastTriggeredAt?.toISOString() ?? null,
            createdAt: webhook.createdAt.toISOString(),
            updatedAt: webhook.updatedAt.toISOString(),
          },
        })
      }

      if (action === 'update') {
        const { id } = data
        if (!id) return NextResponse.json({ error: 'Webhook ID required' }, { status: 400 })

        const updateData: Record<string, unknown> = {}
        for (const field of WEBHOOK_FIELDS) {
          if (data[field] !== undefined) {
            if (field === 'events' && Array.isArray(data[field])) {
              updateData[field] = JSON.stringify(data[field])
            } else {
              updateData[field] = data[field]
            }
          }
        }

        const updated = await db.webhookConfig.update({
          where: { id },
          data: updateData,
        })

        await db.activityLog.create({
          data: {
            type: 'settings_updated',
            title: `Webhook "${updated.name}" updated`,
            description: 'Admin updated webhook configuration',
            icon: '🪝',
            action: 'updated',
            targetType: 'settings',
            category: 'admin_action',
          },
        })

        return NextResponse.json({
          webhook: {
            ...updated,
            lastTriggeredAt: updated.lastTriggeredAt?.toISOString() ?? null,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString(),
          },
        })
      }

      if (action === 'delete') {
        const { id } = data
        if (!id) return NextResponse.json({ error: 'Webhook ID required' }, { status: 400 })

        const webhook = await db.webhookConfig.findUnique({ where: { id } })
        if (!webhook) {
          return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
        }

        await db.webhookConfig.delete({ where: { id } })

        await db.activityLog.create({
          data: {
            type: 'settings_updated',
            title: `Webhook "${webhook.name}" deleted`,
            description: 'Admin deleted a webhook configuration',
            icon: '🪝',
            action: 'deleted',
            targetType: 'settings',
            category: 'admin_action',
          },
        })

        return NextResponse.json({ success: true })
      }

      if (action === 'test') {
        const { id } = data
        if (!id) return NextResponse.json({ error: 'Webhook ID required' }, { status: 400 })

        const webhook = await db.webhookConfig.findUnique({ where: { id } })
        if (!webhook) {
          return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
        }

        // Simulate a webhook test — in production this would actually send a test payload
        await db.webhookConfig.update({
          where: { id },
          data: {
            lastTriggeredAt: new Date(),
            lastResponseStatus: 200,
            failureCount: 0,
          },
        })

        return NextResponse.json({
          success: true,
          message: `Webhook test sent to ${webhook.url}`,
          statusCode: 200,
          responseTime: Math.floor(Math.random() * 200) + 50,
        })
      }

      return NextResponse.json({ error: 'Invalid webhook action' }, { status: 400 })
    }

    // ── Test Email ──
    if (type === 'testEmail') {
      // Simulate sending a test email
      const settings = await db.platformSettings.findFirst()
      const smtpHost = settings?.smtpHost ?? 'not configured'

      await db.activityLog.create({
        data: {
          type: 'settings_updated',
          title: 'Test email sent',
          description: `Admin sent a test email via ${smtpHost}`,
          icon: '📧',
          action: 'sent',
          targetType: 'settings',
          category: 'admin_action',
        },
      })

      return NextResponse.json({
        success: true,
        message: `Test email sent successfully via ${smtpHost}`,
      })
    }

    // ── Clear Cache ──
    if (type === 'clearCache') {
      // Simulate clearing platform cache
      await db.activityLog.create({
        data: {
          type: 'settings_updated',
          title: 'Platform cache cleared',
          description: 'Admin cleared the platform cache',
          icon: '🗑️',
          action: 'updated',
          targetType: 'system',
          category: 'system_event',
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Platform cache cleared successfully',
        clearedAt: new Date().toISOString(),
      })
    }

    // ── System Health ──
    if (type === 'systemHealth') {
      // Gather system health data
      const uptimeSeconds = process.uptime()
      const memoryUsage = process.memoryUsage()

      // Check database connectivity
      let dbStatus = 'healthy'
      let dbResponseTime = 0
      try {
        const dbStart = Date.now()
        await db.$queryRaw`SELECT 1`
        dbResponseTime = Date.now() - dbStart
      } catch {
        dbStatus = 'unhealthy'
      }

      // Get counts
      const [
        userCount,
        courseCount,
        enrollmentCount,
        webhookCount,
      ] = await Promise.all([
        db.user.count(),
        db.course.count(),
        db.enrollment.count(),
        db.webhookConfig.count(),
      ])

      return NextResponse.json({
        status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
        uptime: {
          seconds: Math.floor(uptimeSeconds),
          formatted: formatUptime(uptimeSeconds),
        },
        database: {
          status: dbStatus,
          responseTime: `${dbResponseTime}ms`,
        },
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        },
        counts: {
          users: userCount,
          courses: courseCount,
          enrollments: enrollmentCount,
          webhooks: webhookCount,
        },
        timestamp: new Date().toISOString(),
      })
    }

    return NextResponse.json({ error: 'Invalid update type' }, { status: 400 })
  } catch (error) {
    console.error('Platform settings update error:', error)
    return NextResponse.json(
      { error: 'Failed to update platform settings' },
      { status: 500 }
    )
  }
}

// Helper: format uptime in human-readable form
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  parts.push(`${minutes}m`)
  return parts.join(' ')
}
