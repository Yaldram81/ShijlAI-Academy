import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ==================== SEED DATA ====================

async function seedAuditLogs() {
  const existingCount = await db.activityLog.count()
  if (existingCount > 0) return

  const admin = await db.user.findFirst({ where: { role: 'admin' } })
  if (!admin) return

  const now = new Date()

  const seedEntries: Array<{
    type: string
    title: string
    description: string
    icon: string
    action: string
    targetName: string
    targetType: string
    severity: string
    category: string
    ipAddress: string
    daysAgo: number
    hoursAgo: number
  }> = [
    { title: 'Approved course', action: 'approved', targetName: 'Django API', targetType: 'course', category: 'content', severity: 'info', icon: '✅', description: 'Course "Django API Masterclass" has been approved and published', ipAddress: '103.45.67.89', type: 'course_review_pending', daysAgo: 0, hoursAgo: 2 },
    { title: 'Suspended user', action: 'suspended', targetName: 'Ahmed Khan', targetType: 'user', category: 'user_management', severity: 'warning', icon: '🚫', description: 'User account suspended due to policy violations', ipAddress: '182.176.45.22', type: 'user_suspended', daysAgo: 0, hoursAgo: 5 },
    { title: 'Removed flagged post', action: 'removed', targetName: 'Post #4821', targetType: 'post', category: 'content', severity: 'warning', icon: '🗑️', description: 'Flagged post removed after review — contained inappropriate content', ipAddress: '119.160.92.11', type: 'content_removed', daysAgo: 1, hoursAgo: 3 },
    { title: 'Issued refund $45', action: 'issued', targetName: 'Fatima Noor', targetType: 'refund', category: 'finance', severity: 'info', icon: '💰', description: 'Refund of $45 issued to Fatima Noor for Django API Masterclass', ipAddress: '39.32.55.78', type: 'refund_issued', daysAgo: 1, hoursAgo: 8 },
    { title: 'Changed revenue split', action: 'changed', targetName: 'Bilal Raza', targetType: 'user', category: 'finance', severity: 'info', icon: '📊', description: 'Revenue split changed from 80% to 85% for instructor Bilal Raza', ipAddress: '103.45.67.89', type: 'revenue_split_changed', daysAgo: 1, hoursAgo: 14 },
    { title: 'Sent platform notification', action: 'sent', targetName: 'All users', targetType: 'notification', category: 'admin_action', severity: 'info', icon: '📢', description: 'Platform-wide notification sent: "New courses available this week!"', ipAddress: '182.176.45.22', type: 'notification_sent', daysAgo: 2, hoursAgo: 1 },
    { title: 'Rejected course', action: 'rejected', targetName: 'Advanced Blockchain 101', targetType: 'course', category: 'content', severity: 'warning', icon: '❌', description: 'Course rejected — does not meet quality standards. Feedback sent to instructor.', ipAddress: '119.160.92.11', type: 'course_review_pending', daysAgo: 2, hoursAgo: 6 },
    { title: 'Created API key', action: 'created', targetName: 'analytics-readonly-key', targetType: 'api_key', category: 'admin_action', severity: 'info', icon: '🔑', description: 'New API key created with read-only analytics permissions', ipAddress: '39.32.55.78', type: 'api_key_generated', daysAgo: 2, hoursAgo: 11 },
    { title: 'Blocked IP', action: 'blocked', targetName: '192.168.45.102', targetType: 'ip', category: 'security', severity: 'critical', icon: '🛡️', description: 'IP blocked due to repeated brute-force login attempts (23 failed attempts)', ipAddress: '103.45.67.89', type: 'ip_blocked', daysAgo: 3, hoursAgo: 4 },
    { title: 'Updated security settings', action: 'updated', targetName: 'Security Settings', targetType: 'settings', category: 'security', severity: 'info', icon: '⚙️', description: 'Two-factor authentication enforced for all admin accounts', ipAddress: '182.176.45.22', type: 'settings_updated', daysAgo: 3, hoursAgo: 9 },
    { title: 'Processed payout', action: 'processed', targetName: 'Sara Ahmed', targetType: 'payout', category: 'finance', severity: 'info', icon: '💳', description: 'Payout of $450 processed for instructor Sara Ahmed via bank transfer', ipAddress: '119.160.92.11', type: 'payout_processed', daysAgo: 3, hoursAgo: 15 },
    { title: 'Approved instructor application', action: 'approved', targetName: 'Usman Tariq', targetType: 'user', category: 'user_management', severity: 'info', icon: '👨‍🏫', description: 'Instructor application approved for Usman Tariq — Python & Data Science expert', ipAddress: '39.32.55.78', type: 'user_signup', daysAgo: 4, hoursAgo: 2 },
    { title: 'Approved course', action: 'approved', targetName: 'React Masterclass', targetType: 'course', category: 'content', severity: 'info', icon: '✅', description: 'Course "React Masterclass" approved after review', ipAddress: '103.45.67.89', type: 'course_review_pending', daysAgo: 4, hoursAgo: 7 },
    { title: 'Issued refund $28', action: 'issued', targetName: 'Hassan Ali', targetType: 'refund', category: 'finance', severity: 'info', icon: '💰', description: 'Refund of $28 issued to Hassan Ali for React Masterclass', ipAddress: '182.176.45.22', type: 'refund_issued', daysAgo: 4, hoursAgo: 13 },
    { title: 'Suspended user', action: 'suspended', targetName: 'Zainab Malik', targetType: 'user', category: 'user_management', severity: 'warning', icon: '🚫', description: 'User suspended for repeated community guideline violations', ipAddress: '119.160.92.11', type: 'user_suspended', daysAgo: 5, hoursAgo: 3 },
    { title: 'Removed flagged post', action: 'removed', targetName: 'Post #3902', targetType: 'post', category: 'content', severity: 'warning', icon: '🗑️', description: 'Post removed — spam content detected and verified', ipAddress: '39.32.55.78', type: 'content_removed', daysAgo: 5, hoursAgo: 10 },
    { title: 'Sent platform notification', action: 'sent', targetName: 'Instructors', targetType: 'notification', category: 'admin_action', severity: 'info', icon: '📢', description: 'Notification sent to all instructors: "Update your course content by March 15"', ipAddress: '103.45.67.89', type: 'notification_sent', daysAgo: 6, hoursAgo: 1 },
    { title: 'Blocked IP', action: 'blocked', targetName: '10.0.0.55', targetType: 'ip', category: 'security', severity: 'critical', icon: '🛡️', description: 'IP blocked — suspicious activity detected from multiple accounts', ipAddress: '182.176.45.22', type: 'ip_blocked', daysAgo: 6, hoursAgo: 8 },
    { title: 'Processed payout', action: 'processed', targetName: 'Nadia Shah', targetType: 'payout', category: 'finance', severity: 'info', icon: '💳', description: 'Payout of $785 processed for instructor Nadia Shah via PayPal', ipAddress: '119.160.92.11', type: 'payout_processed', daysAgo: 6, hoursAgo: 14 },
    { title: 'Changed revenue split', action: 'changed', targetName: 'Kamran Siddiqui', targetType: 'user', category: 'finance', severity: 'info', icon: '📊', description: 'Revenue split changed from 80% to 90% for premium instructor Kamran Siddiqui', ipAddress: '39.32.55.78', type: 'revenue_split_changed', daysAgo: 7, hoursAgo: 5 },
    { title: 'Created API key', action: 'created', targetName: 'webhook-integration-key', targetType: 'api_key', category: 'admin_action', severity: 'info', icon: '🔑', description: 'New API key created for Zapier webhook integration', ipAddress: '103.45.67.89', type: 'api_key_generated', daysAgo: 7, hoursAgo: 11 },
    { title: 'Approved course', action: 'approved', targetName: 'Python for Data Science', targetType: 'course', category: 'content', severity: 'info', icon: '✅', description: 'Course "Python for Data Science" approved and published', ipAddress: '182.176.45.22', type: 'course_review_pending', daysAgo: 8, hoursAgo: 3 },
    { title: 'Rejected course', action: 'rejected', targetName: 'Beginner Guitar Lessons', targetType: 'course', category: 'content', severity: 'warning', icon: '❌', description: 'Course rejected — insufficient video quality and missing learning objectives', ipAddress: '119.160.92.11', type: 'course_review_pending', daysAgo: 8, hoursAgo: 9 },
    { title: 'Updated security settings', action: 'updated', targetName: 'Security Settings', targetType: 'settings', category: 'security', severity: 'info', icon: '⚙️', description: 'Password policy updated: minimum 12 characters with special characters required', ipAddress: '39.32.55.78', type: 'settings_updated', daysAgo: 9, hoursAgo: 4 },
    { title: 'Approved instructor application', action: 'approved', targetName: 'Ayesha Farooq', targetType: 'user', category: 'user_management', severity: 'info', icon: '👨‍🏫', description: 'Instructor application approved for Ayesha Farooq — Mathematics specialist', ipAddress: '103.45.67.89', type: 'user_signup', daysAgo: 9, hoursAgo: 10 },
    { title: 'Issued refund $62', action: 'issued', targetName: 'Omar Sheikh', targetType: 'refund', category: 'finance', severity: 'info', icon: '💰', description: 'Refund of $62 issued to Omar Sheikh for Python for Data Science', ipAddress: '182.176.45.22', type: 'refund_issued', daysAgo: 10, hoursAgo: 6 },
    { title: 'Blocked IP', action: 'blocked', targetName: '172.16.0.88', targetType: 'ip', category: 'security', severity: 'critical', icon: '🛡️', description: 'IP blocked — DDoS attack pattern detected, 500+ requests per minute', ipAddress: '119.160.92.11', type: 'ip_blocked', daysAgo: 10, hoursAgo: 14 },
    { title: 'Processed payout', action: 'processed', targetName: 'Imran Hussain', targetType: 'payout', category: 'finance', severity: 'info', icon: '💳', description: 'Payout of $320 processed for instructor Imran Hussain via bank transfer', ipAddress: '39.32.55.78', type: 'payout_processed', daysAgo: 11, hoursAgo: 2 },
    { title: 'Removed flagged post', action: 'removed', targetName: 'Post #2210', targetType: 'post', category: 'content', severity: 'warning', icon: '🗑️', description: 'Post removed after community report — misleading course promotion', ipAddress: '103.45.67.89', type: 'content_removed', daysAgo: 11, hoursAgo: 8 },
    { title: 'Sent platform notification', action: 'sent', targetName: 'New Students', targetType: 'notification', category: 'admin_action', severity: 'info', icon: '📢', description: 'Welcome notification sent to 47 new students who joined this week', ipAddress: '182.176.45.22', type: 'notification_sent', daysAgo: 12, hoursAgo: 5 },
    { title: 'Approved course', action: 'approved', targetName: 'IELTS Preparation Complete', targetType: 'course', category: 'content', severity: 'info', icon: '✅', description: 'Course "IELTS Preparation Complete" approved after thorough review', ipAddress: '119.160.92.11', type: 'course_review_pending', daysAgo: 13, hoursAgo: 3 },
  ]

  const data = seedEntries.map((entry) => ({
    userId: admin.id,
    type: entry.type,
    title: entry.title,
    description: entry.description,
    icon: entry.icon,
    action: entry.action,
    targetName: entry.targetName,
    targetType: entry.targetType,
    ipAddress: entry.ipAddress,
    severity: entry.severity,
    category: entry.category,
    createdAt: new Date(
      now.getTime() - entry.daysAgo * 24 * 60 * 60 * 1000 - entry.hoursAgo * 60 * 60 * 1000
    ),
  }))

  await db.activityLog.createMany({ data })
}

// ==================== GET HANDLER ====================

export async function GET(request: NextRequest) {
  try {
    // Auto-seed if empty
    await seedAuditLogs()

    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
    const category = searchParams.get('category')
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const severity = searchParams.get('severity')
    const exportFormat = searchParams.get('export')

    // Build where clause
    const where: Record<string, unknown> = {}

    if (category) {
      where.category = category
    }
    if (action) {
      where.action = action
    }
    if (userId) {
      where.userId = userId
    }
    if (severity) {
      where.severity = severity
    }
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      }
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { targetName: { contains: search } },
        { description: { contains: search } },
      ]
    }

    // ── Export: CSV ──
    if (exportFormat === 'csv') {
      const allLogs = await db.activityLog.findMany({
        where,
        include: {
          user: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      const csvHeader = 'Timestamp,Admin,Action,Target,Target Type,Severity,Category,IP Address,Description'
      const csvRows = allLogs.map((log) => {
        const ts = log.createdAt.toISOString()
        const adminName = log.user?.name || 'System'
        const act = log.action
        const target = (log.targetName || '').replace(/"/g, '""')
        const targetType = log.targetType || ''
        const sev = log.severity
        const cat = log.category
        const ip = log.ipAddress || ''
        const desc = (log.description || '').replace(/"/g, '""')
        return `"${ts}","${adminName}","${act}","${target}","${targetType}","${sev}","${cat}","${ip}","${desc}"`
      })
      const csv = [csvHeader, ...csvRows].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=audit-log-export.csv',
        },
      })
    }

    // ── Export: PDF (plain text report) ──
    if (exportFormat === 'pdf') {
      const allLogs = await db.activityLog.findMany({
        where,
        include: {
          user: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      })

      const lines = allLogs.map((log) => {
        const ts = log.createdAt.toISOString()
        const adminName = log.user?.name || 'System'
        return `[${ts}] ${adminName} - ${log.action.toUpperCase()} - ${log.targetName || 'N/A'} (${log.targetType || 'N/A'}) [${log.severity}] [${log.category}]${log.description ? ' - ' + log.description : ''}`
      })

      const report = [
        'AUDIT LOG REPORT',
        `Generated: ${new Date().toISOString()}`,
        `Total Records: ${allLogs.length}`,
        '─'.repeat(80),
        '',
        ...lines,
      ].join('\n')

      return new NextResponse(report, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': 'attachment; filename=audit-log-export.txt',
        },
      })
    }

    // ── Normal GET: paginated list + stats ──
    const [logs, total] = await Promise.all([
      db.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.activityLog.count({ where }),
    ])

    // ── Compute stats ──
    const now = new Date()
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

    const [totalEvents, thisMonth, lastMonth, byCategoryRaw, bySeverityRaw, topAdminsRaw] =
      await Promise.all([
        db.activityLog.count(),
        db.activityLog.count({
          where: { createdAt: { gte: startOfThisMonth } },
        }),
        db.activityLog.count({
          where: {
            createdAt: {
              gte: startOfLastMonth,
              lte: endOfLastMonth,
            },
          },
        }),
        db.activityLog.groupBy({
          by: ['category'],
          _count: { category: true },
        }),
        db.activityLog.groupBy({
          by: ['severity'],
          _count: { severity: true },
        }),
        db.activityLog.groupBy({
          by: ['userId'],
          _count: { userId: true },
          where: { userId: { not: null } },
          orderBy: { _count: { userId: 'desc' } },
          take: 5,
        }),
      ])

    // Month-over-month change
    const momChange = lastMonth === 0
      ? (thisMonth > 0 ? 100 : 0)
      : Math.round(((thisMonth - lastMonth) / lastMonth) * 100)

    // Build category stats with all possible categories
    const byCategory: Record<string, number> = {
      admin_action: 0,
      system_event: 0,
      security: 0,
      finance: 0,
      content: 0,
      user_management: 0,
    }
    for (const item of byCategoryRaw) {
      if (item.category) {
        byCategory[item.category] = item._count.category
      }
    }

    // Build severity stats
    const bySeverity: Record<string, number> = { info: 0, warning: 0, critical: 0 }
    for (const item of bySeverityRaw) {
      if (item.severity) {
        bySeverity[item.severity] = item._count.severity
      }
    }

    // Resolve top admin names
    const adminIds = topAdminsRaw
      .map((a) => a.userId)
      .filter((id): id is string => id !== null)

    const adminUsers = await db.user.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, name: true },
    })

    const adminMap = new Map(adminUsers.map((u) => [u.id, u.name]))

    const topAdmins = topAdminsRaw
      .filter((a) => a.userId !== null)
      .map((a) => ({
        userId: a.userId!,
        userName: adminMap.get(a.userId!) || 'Unknown',
        actionCount: a._count.userId,
      }))

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
      totalPages,
      stats: {
        totalEvents,
        thisMonth,
        lastMonth,
        momChange,
        byCategory,
        bySeverity,
        topAdmins,
      },
    })
  } catch (error) {
    console.error('[AUDIT_LOG_GET]', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}

// ==================== POST HANDLER ====================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      type,
      title,
      description,
      icon,
      metadata,
      action,
      targetName,
      targetType,
      targetId,
      ipAddress,
      severity,
      category,
      userId,
    } = body

    if (!type || !title) {
      return NextResponse.json(
        { error: 'type and title are required fields' },
        { status: 400 }
      )
    }

    const entry = await db.activityLog.create({
      data: {
        type,
        title,
        description: description || null,
        icon: icon || '📋',
        metadata: metadata || null,
        action: action || 'generic',
        targetName: targetName || null,
        targetType: targetType || null,
        targetId: targetId || null,
        ipAddress: ipAddress || null,
        severity: severity || 'info',
        category: category || 'admin_action',
        userId: userId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('[AUDIT_LOG_POST]', error)
    return NextResponse.json(
      { error: 'Failed to create audit log entry' },
      { status: 500 }
    )
  }
}
