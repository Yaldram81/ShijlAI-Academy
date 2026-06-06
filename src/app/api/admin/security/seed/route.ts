import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/security/seed — Seed security data for demo
export async function GET() {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)

    // 1. Upsert SecuritySettings singleton
    let settings = await db.securitySettings.findFirst()
    if (!settings) {
      settings = await db.securitySettings.create({
        data: {
          enableMFA: true,
          force2FAForAdmins: true,
          enforceMFAForInstructors: false,
          mfaMethod: 'totp',
          rateLimitingEnabled: true,
          maxRequestsPerMinute: 60,
          loginAttemptThreshold: 5,
          lockDurationMinutes: 15,
          ipBasedRateLimiting: true,
          apiRateLimitPerHour: 1000,
          maxFailedLogins: 5,
          sessionTimeoutMinutes: 60,
          maxConcurrentSessions: 3,
          rememberMeDuration: 30,
          enforceSingleSession: false,
          idleTimeoutMinutes: 30,
          userPasswordMinLength: 8,
          userPasswordUppercase: true,
          userPasswordLowercase: false,
          userPasswordNumber: true,
          userPasswordSpecial: false,
          adminPasswordMinLength: 12,
          adminPasswordUppercase: true,
          adminPasswordNumber: true,
          adminPasswordSpecial: true,
          passwordExpiryDays: 90,
          passwordPreventReuseCount: 5,
          ipWhitelistEnabled: false,
          ipWhitelist: null,
          loginAlertsEnabled: true,
          alertOnSuspiciousIp: true,
          alertOnNewDevice: true,
          alertOnFailedLogin: true,
          failedLoginThreshold: 500,
          corsEnabled: false,
          corsAllowedOrigins: null,
        },
      })
    }

    // 2. Upsert 5 default SecurityRole records
    const defaultRoles = [
      {
        name: 'Super Admin',
        permissions: '["full_access"]',
        isDefault: false,
        description: 'Full system access with all permissions including critical operations',
      },
      {
        name: 'Admin',
        permissions: '["manage_users","manage_courses","manage_content","manage_finance","manage_notifications","manage_gamification"]',
        isDefault: false,
        description: 'Standard admin access excluding delete_users and change_revenue_split',
      },
      {
        name: 'Moderator',
        permissions: '["content_review","qa_management","community_management","user_suspension"]',
        isDefault: false,
        description: 'Content moderation and community management',
      },
      {
        name: 'Support Agent',
        permissions: '["view_users","process_refunds","send_messages"]',
        isDefault: false,
        description: 'Customer support and refund processing',
      },
      {
        name: 'Finance Admin',
        permissions: '["manage_revenue","manage_payouts","process_refunds"]',
        isDefault: false,
        description: 'Financial operations and payout management',
      },
    ]

    for (const role of defaultRoles) {
      await db.securityRole.upsert({
        where: { name: role.name },
        update: {
          permissions: role.permissions,
          isDefault: role.isDefault,
          description: role.description,
        },
        create: role,
      })
    }

    // 3. Upsert 2 demo API keys
    // Use keyHash as unique field for upsert
    const demoApiKeys = [
      {
        name: 'Production Key',
        keyPrefix: 'shijlai_live_sk_',
        keyHash: 'demo_hash_production_key_4821',
        keyLastFour: '4821',
        permission: 'full_access',
        isActive: true,
      },
      {
        name: 'Read-Only Key',
        keyPrefix: 'shijlai_read_sk_',
        keyHash: 'demo_hash_readonly_key_2341',
        keyLastFour: '2341',
        permission: 'read_only',
        isActive: true,
      },
    ]

    for (const apiKeyData of demoApiKeys) {
      const existing = await db.apiKey.findUnique({
        where: { keyHash: apiKeyData.keyHash },
      })
      if (!existing) {
        await db.apiKey.create({ data: apiKeyData })
      }
    }

    // 4. Create demo login alerts (check count to avoid duplicates on re-seed)
    const existingAlertsCount = await db.loginAlert.count()
    if (existingAlertsCount === 0) {
      // Today's alerts
      const todayAlerts = [
        {
          userId: null,
          userName: 'unknown_user',
          userEmail: 'unknown@example.com',
          userRole: null,
          ip: '192.168.1.45',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          location: 'London, UK',
          eventType: 'failed_login',
          isSuspicious: false,
          createdAt: new Date(today.getTime() + 2 * 60 * 60 * 1000),
        },
        {
          userId: null,
          userName: 'ahmad_khan',
          userEmail: 'ahmad@example.com',
          userRole: 'student',
          ip: '10.0.0.123',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
          location: 'New York, US',
          eventType: 'failed_login',
          isSuspicious: false,
          createdAt: new Date(today.getTime() + 3 * 60 * 60 * 1000),
        },
        {
          userId: null,
          userName: 'sara_ali',
          userEmail: 'sara@example.com',
          userRole: 'instructor',
          ip: '172.16.0.55',
          userAgent: 'Chrome/120.0 Mobile',
          location: 'Toronto, Canada',
          eventType: 'failed_login',
          isSuspicious: false,
          createdAt: new Date(today.getTime() + 4 * 60 * 60 * 1000),
        },
        {
          userId: null,
          userName: 'ahmad_khan',
          userEmail: 'ahmad@example.com',
          userRole: 'student',
          ip: '10.0.0.123',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
          location: 'New York, US',
          eventType: 'locked_account',
          isSuspicious: false,
          createdAt: new Date(today.getTime() + 4.5 * 60 * 60 * 1000),
        },
        {
          userId: null,
          userName: null,
          userEmail: null,
          userRole: null,
          ip: '45.33.32.156',
          userAgent: 'Python-urllib/3.9',
          location: 'Unknown',
          eventType: 'suspicious_ip',
          isSuspicious: true,
          createdAt: new Date(today.getTime() + 5 * 60 * 60 * 1000),
        },
        {
          userId: null,
          userName: 'admin_zain',
          userEmail: 'zain@shijlai.com',
          userRole: 'admin',
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
          location: 'London, UK',
          eventType: 'admin_login',
          isSuspicious: false,
          createdAt: new Date(today.getTime() + 6 * 60 * 60 * 1000),
        },
        {
          userId: null,
          userName: 'admin_fatima',
          userEmail: 'fatima@shijlai.com',
          userRole: 'admin',
          ip: '192.168.1.2',
          userAgent: 'Mozilla/5.0 (Macintosh)',
          location: 'Toronto, Canada',
          eventType: 'admin_login',
          isSuspicious: false,
          createdAt: new Date(today.getTime() + 7 * 60 * 60 * 1000),
        },
        {
          userId: null,
          userName: null,
          userEmail: null,
          userRole: null,
          ip: '185.220.101.42',
          userAgent: 'curl/7.68.0',
          location: 'Unknown (Tor)',
          eventType: 'suspicious_ip',
          isSuspicious: true,
          createdAt: new Date(today.getTime() + 8 * 60 * 60 * 1000),
        },
        {
          userId: null,
          userName: 'usman_dev',
          userEmail: 'usman@example.com',
          userRole: 'student',
          ip: '192.168.2.100',
          userAgent: 'Mozilla/5.0 (Linux; Android)',
          location: 'Sydney, Australia',
          eventType: 'failed_login',
          isSuspicious: false,
          createdAt: new Date(today.getTime() + 9 * 60 * 60 * 1000),
        },
        {
          userId: null,
          userName: 'usman_dev',
          userEmail: 'usman@example.com',
          userRole: 'student',
          ip: '192.168.2.100',
          userAgent: 'Mozilla/5.0 (Linux; Android)',
          location: 'Sydney, Australia',
          eventType: 'locked_account',
          isSuspicious: false,
          createdAt: new Date(today.getTime() + 9.2 * 60 * 60 * 1000),
        },
      ]

      // Yesterday's alerts
      const yesterdayAlerts = [
        {
          userId: null,
          userName: 'hacker_attempt',
          userEmail: null,
          userRole: null,
          ip: '45.33.32.156',
          userAgent: 'Python-urllib/3.9',
          location: 'Unknown',
          eventType: 'failed_login',
          isSuspicious: true,
          createdAt: new Date(yesterday.getTime() + 1 * 60 * 60 * 1000),
        },
        {
          userId: null,
          userName: 'hacker_attempt',
          userEmail: null,
          userRole: null,
          ip: '45.33.32.156',
          userAgent: 'Python-urllib/3.9',
          location: 'Unknown',
          eventType: 'failed_login',
          isSuspicious: true,
          createdAt: new Date(yesterday.getTime() + 1.5 * 60 * 60 * 1000),
        },
        {
          userId: null,
          userName: 'hacker_attempt',
          userEmail: null,
          userRole: null,
          ip: '45.33.32.156',
          userAgent: 'Python-urllib/3.9',
          location: 'Unknown',
          eventType: 'failed_login',
          isSuspicious: true,
          createdAt: new Date(yesterday.getTime() + 2 * 60 * 60 * 1000),
        },
        {
          userId: null,
          userName: 'admin_zain',
          userEmail: 'zain@shijlai.com',
          userRole: 'admin',
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0)',
          location: 'London, UK',
          eventType: 'admin_login',
          isSuspicious: false,
          createdAt: new Date(yesterday.getTime() + 3 * 60 * 60 * 1000),
        },
        {
          userId: null,
          userName: 'mohsin_raza',
          userEmail: 'mohsin@example.com',
          userRole: 'instructor',
          ip: '172.16.0.78',
          userAgent: 'Safari/17.0',
          location: 'Berlin, Germany',
          eventType: 'failed_login',
          isSuspicious: false,
          createdAt: new Date(yesterday.getTime() + 5 * 60 * 60 * 1000),
        },
        {
          userId: null,
          userName: null,
          userEmail: null,
          userRole: null,
          ip: '91.198.22.18',
          userAgent: 'Masscan/1.3',
          location: 'Unknown',
          eventType: 'suspicious_ip',
          isSuspicious: true,
          createdAt: new Date(yesterday.getTime() + 8 * 60 * 60 * 1000),
        },
        {
          userId: null,
          userName: 'locked_user_1',
          userEmail: 'locked1@example.com',
          userRole: 'student',
          ip: '192.168.5.22',
          userAgent: 'Mozilla/5.0 (Windows)',
          location: 'Paris, France',
          eventType: 'locked_account',
          isSuspicious: false,
          createdAt: new Date(yesterday.getTime() + 10 * 60 * 60 * 1000),
        },
        {
          userId: null,
          userName: 'locked_user_2',
          userEmail: 'locked2@example.com',
          userRole: 'student',
          ip: '10.10.10.50',
          userAgent: 'Chrome/120.0',
          location: 'Tokyo, Japan',
          eventType: 'locked_account',
          isSuspicious: false,
          createdAt: new Date(yesterday.getTime() + 12 * 60 * 60 * 1000),
        },
      ]

      await db.loginAlert.createMany({
        data: [...todayAlerts, ...yesterdayAlerts],
      })
    }

    // 5. Create demo blocked IPs
    const existingBlockedCount = await db.blockedIp.count()
    if (existingBlockedCount === 0) {
      await db.blockedIp.createMany({
        data: [
          {
            ip: '45.33.32.156',
            reason: 'Brute force attack detected — multiple failed login attempts',
            createdAt: new Date(yesterday.getTime() + 3 * 60 * 60 * 1000),
          },
          {
            ip: '185.220.101.42',
            reason: 'Tor exit node — suspicious automated activity',
            createdAt: new Date(today.getTime() + 8 * 60 * 60 * 1000),
          },
          {
            ip: '91.198.22.18',
            reason: 'Port scanning detected — masscan traffic',
            expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            createdAt: new Date(yesterday.getTime() + 8 * 60 * 60 * 1000),
          },
          {
            ip: '103.21.244.0',
            reason: 'DDoS participation — rate limit exceeded',
            expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            createdAt: new Date(today.getTime() + 10 * 60 * 60 * 1000),
          },
        ],
      })
    }

    // Return summary
    const [rolesCount, apiKeysCount, alertsCount, blockedIpsCount] =
      await Promise.all([
        db.securityRole.count(),
        db.apiKey.count(),
        db.loginAlert.count(),
        db.blockedIp.count(),
      ])

    return NextResponse.json({
      success: true,
      message: 'Security data seeded successfully',
      summary: {
        settings: !!settings,
        roles: rolesCount,
        apiKeys: apiKeysCount,
        loginAlerts: alertsCount,
        blockedIps: blockedIpsCount,
      },
    })
  } catch (error) {
    console.error('Security seed error:', error)
    return NextResponse.json(
      { error: 'Failed to seed security data' },
      { status: 500 }
    )
  }
}
