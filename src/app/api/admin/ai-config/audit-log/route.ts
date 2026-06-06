import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/ai-config/audit-log — List audit logs with filtering and pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const action = searchParams.get('action')
    const severity = searchParams.get('severity')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Build where clause
    const where: Record<string, unknown> = {}
    if (category) where.category = category
    if (action) where.action = action
    if (severity) where.severity = severity
    if (startDate || endDate) {
      const createdAt: Record<string, Date> = {}
      if (startDate) createdAt.gte = new Date(startDate)
      if (endDate) createdAt.lte = new Date(endDate)
      where.createdAt = createdAt
    }

    const skip = (page - 1) * limit

    const [logs, totalCount] = await Promise.all([
      db.aIAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.aIAuditLog.count({ where }),
    ])

    // Category distribution
    const categoryDist = await db.aIAuditLog.groupBy({
      by: ['category'],
      _count: true,
      where,
    })

    // Severity distribution
    const severityDist = await db.aIAuditLog.groupBy({
      by: ['severity'],
      _count: true,
      where,
    })

    // Action distribution (top 10)
    const actionDist = await db.aIAuditLog.groupBy({
      by: ['action'],
      _count: true,
      where,
      orderBy: { _count: { action: 'desc' } },
    })

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        categoryDistribution: categoryDist.map(c => ({
          category: c.category,
          count: c._count,
        })),
        severityDistribution: severityDist.map(s => ({
          severity: s.severity,
          count: s._count,
        })),
        actionDistribution: actionDist.slice(0, 10).map(a => ({
          action: a.action,
          count: a._count,
        })),
      },
    })
  } catch (error) {
    console.error('Audit log fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}
