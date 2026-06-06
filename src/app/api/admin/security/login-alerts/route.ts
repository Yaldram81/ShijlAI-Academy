import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/security/login-alerts — Fetch login alerts with filters and pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const filter = searchParams.get('filter') || 'all'

    const where: Record<string, unknown> = {}
    if (filter && filter !== 'all') {
      where.eventType = filter
    }

    const [alerts, total] = await Promise.all([
      db.loginAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.loginAlert.count({ where }),
    ])

    return NextResponse.json({ alerts, total, page, limit })
  } catch (error) {
    console.error('Login alerts fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch login alerts' },
      { status: 500 }
    )
  }
}
