import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/security — Fetch security settings, overview stats, roles, api keys, blocked IPs, admin team
// Updated: added new fields for MFA, rate limiting, session mgmt, login alerts, CORS
export async function GET() {
  try {
    // Fetch or create the singleton security settings
    let settings = await db.securitySettings.findFirst()
    if (!settings) {
      settings = await db.securitySettings.create({ data: {} })
    }

    // Compute overview stats
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [
      failedLoginsToday,
      accountsLockedToday,
      suspiciousIpsFlagged,
      activeAdminSessions,
    ] = await Promise.all([
      db.loginAlert.count({
        where: {
          eventType: 'failed_login',
          createdAt: { gte: startOfDay },
        },
      }),
      db.loginAlert.count({
        where: {
          eventType: 'locked_account',
          createdAt: { gte: startOfDay },
        },
      }),
      db.loginAlert.count({
        where: {
          eventType: 'suspicious_ip',
          createdAt: { gte: startOfDay },
        },
      }),
      db.user.count({
        where: {
          role: 'admin',
          lastActiveAt: { gte: new Date(now.getTime() - 30 * 60 * 1000) }, // active in last 30 min
        },
      }),
    ])

    const overview = {
      failedLoginsToday,
      accountsLockedToday,
      suspiciousIpsFlagged,
      activeAdminSessions,
      failedLoginThreshold: settings.failedLoginThreshold,
    }

    // Fetch roles
    const roles = await db.securityRole.findMany({ orderBy: { createdAt: 'asc' } })

    // Seed default roles if none exist
    if (roles.length === 0) {
      const defaultRoles = [
        { name: 'Super Admin', permissions: JSON.stringify(['dashboard.view','users.view','users.edit','users.delete','courses.view','courses.edit','courses.delete','content.review','content.moderate','finance.view','finance.manage','payouts.manage','notifications.send','notifications.manage','security.view','security.manage','settings.manage','gamification.manage','api.keys','roles.manage']), isDefault: true, description: 'Full access to all features and settings' },
        { name: 'Admin', permissions: JSON.stringify(['dashboard.view','users.view','users.edit','courses.view','courses.edit','content.review','content.moderate','finance.view','finance.manage','payouts.manage','notifications.send','notifications.manage','security.view','settings.manage','gamification.manage']), isDefault: true, description: 'Access to most features except critical deletions' },
        { name: 'Moderator', permissions: JSON.stringify(['dashboard.view','users.view','courses.view','content.review','content.moderate','notifications.send','security.view']), isDefault: true, description: 'Content moderation and user monitoring' },
        { name: 'Support Agent', permissions: JSON.stringify(['dashboard.view','users.view','users.edit','courses.view','notifications.send','security.view']), isDefault: true, description: 'User support and basic management' },
        { name: 'Finance Admin', permissions: JSON.stringify(['dashboard.view','finance.view','finance.manage','payouts.manage','users.view']), isDefault: true, description: 'Financial operations and payout management' },
      ]
      for (const role of defaultRoles) {
        const created = await db.securityRole.create({ data: role })
        roles.push(created)
      }
    }

    // Fetch API keys
    const apiKeys = await db.apiKey.findMany({ orderBy: { createdAt: 'desc' } })

    // Fetch blocked IPs
    const blockedIps = await db.blockedIp.findMany({ orderBy: { createdAt: 'desc' } })

    // Fetch admin team members
    const adminTeamRaw = await db.user.findMany({
      where: { role: 'admin' },
      select: { id: true, name: true, email: true, role: true, lastLoginAt: true },
      take: 20,
    })

    const adminTeam = adminTeamRaw.map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: 'Admin',
      lastLoginAt: m.lastLoginAt?.toISOString() || null,
    }))

    return NextResponse.json({
      settings,
      overview,
      roles,
      apiKeys,
      blockedIps,
      adminTeam,
    })
  } catch (error) {
    console.error('Security fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch security data' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/security — Update security settings
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()

    // Get or create the singleton settings record
    let settings = await db.securitySettings.findFirst()
    if (!settings) {
      settings = await db.securitySettings.create({ data: {} })
    }

    // Allowlist of fields that can be updated via PUT — prevents arbitrary field writes
    const ALLOWED_FIELDS = new Set([
      // Authentication / Password Policy
      'userPasswordMinLength', 'userPasswordUppercase', 'userPasswordLowercase',
      'userPasswordNumber', 'userPasswordSpecial',
      'adminPasswordMinLength', 'adminPasswordUppercase', 'adminPasswordNumber', 'adminPasswordSpecial',
      'passwordExpiryDays', 'passwordPreventReuseCount',
      // MFA
      'enableMFA', 'force2FAForAdmins', 'enforceMFAForInstructors', 'mfaMethod',
      // Rate Limiting
      'rateLimitingEnabled', 'maxRequestsPerMinute', 'loginAttemptThreshold',
      'lockDurationMinutes', 'ipBasedRateLimiting', 'apiRateLimitPerHour', 'maxFailedLogins',
      // Session Management
      'sessionTimeoutMinutes', 'maxConcurrentSessions', 'rememberMeDuration',
      'enforceSingleSession', 'idleTimeoutMinutes',
      // IP Management
      'ipWhitelistEnabled', 'ipWhitelist',
      // Login Alerts
      'loginAlertsEnabled', 'alertEmail', 'alertOnSuspiciousIp', 'alertOnNewDevice',
      'alertOnFailedLogin', 'failedLoginThreshold',
      // CORS
      'corsEnabled', 'corsAllowedOrigins',
    ])

    // Only include fields that are in the allowlist and have defined values
    const data: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(body)) {
      if (ALLOWED_FIELDS.has(key) && value !== undefined) {
        data[key] = value
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update. Check field names against the allowlist.' },
        { status: 400 }
      )
    }

    const updated = await db.securitySettings.update({
      where: { id: settings.id },
      data,
    })

    // Log security event
    await db.securityEvent.create({
      data: {
        type: 'settings_updated',
        details: JSON.stringify({ updatedFields: Object.keys(data) }),
      },
    })

    return NextResponse.json({ settings: updated })
  } catch (error) {
    console.error('Security settings update error:', error)
    return NextResponse.json(
      { error: 'Failed to update security settings' },
      { status: 500 }
    )
  }
}
