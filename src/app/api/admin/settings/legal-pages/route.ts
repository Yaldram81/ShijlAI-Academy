import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET /api/admin/settings/legal-pages — List all legal pages or get single by ?name=xxx ──

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const name = searchParams.get('name')

    if (name) {
      // Get a single legal page by name
      const legalPage = await db.legalPage.findUnique({
        where: { name },
      })
      if (!legalPage) {
        return NextResponse.json(
          { error: 'Legal page not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ legalPage })
    }

    // List all legal pages
    const legalPages = await db.legalPage.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ legalPages })
  } catch (error) {
    console.error('Legal pages fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch legal pages' },
      { status: 500 }
    )
  }
}

// ── PUT /api/admin/settings/legal-pages — Update legal page content ──

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, name, displayName, content } = body

    // Must provide either id or name to identify the page
    const identifier = id || name
    if (!identifier) {
      return NextResponse.json(
        { error: 'Legal page ID or name is required' },
        { status: 400 }
      )
    }

    // Find the existing legal page
    let existing
    if (id) {
      existing = await db.legalPage.findUnique({ where: { id } })
    } else {
      existing = await db.legalPage.findUnique({ where: { name } })
    }

    if (!existing) {
      return NextResponse.json(
        { error: 'Legal page not found' },
        { status: 404 }
      )
    }

    const data: Record<string, unknown> = {}
    if (displayName !== undefined) data.displayName = displayName.trim()
    if (content !== undefined) data.content = content
    // Always update lastUpdatedAt when content changes
    if (content !== undefined) data.lastUpdatedAt = new Date()

    const legalPage = await db.legalPage.update({
      where: { id: existing.id },
      data,
    })

    // Log the activity
    await db.activityLog.create({
      data: {
        type: 'settings_updated',
        title: 'Legal page updated',
        description: `Updated legal page: ${legalPage.displayName}`,
        icon: '📄',
        metadata: JSON.stringify({
          name: existing.name,
          action: 'update',
          updatedFields: Object.keys(data),
        }),
      },
    })

    return NextResponse.json({ legalPage })
  } catch (error) {
    console.error('Legal page update error:', error)
    return NextResponse.json(
      { error: 'Failed to update legal page' },
      { status: 500 }
    )
  }
}
