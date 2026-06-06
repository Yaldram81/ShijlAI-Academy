import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET /api/admin/settings/integrations — List all integrations ──

export async function GET() {
  try {
    const integrations = await db.integration.findMany({
      orderBy: { order: 'asc' },
    })
    return NextResponse.json({ integrations })
  } catch (error) {
    console.error('Integrations fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    )
  }
}

// ── POST /api/admin/settings/integrations — Create a new integration ──

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, displayName, category, isConnected, config, usageInfo, icon, order } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Integration name is required' },
        { status: 400 }
      )
    }

    if (!displayName || !displayName.trim()) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      )
    }

    if (!category || !category.trim()) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      )
    }

    // Check for duplicate name
    const existing = await db.integration.findUnique({
      where: { name: name.trim() },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Integration with this name already exists' },
        { status: 409 }
      )
    }

    const integration = await db.integration.create({
      data: {
        name: name.trim(),
        displayName: displayName.trim(),
        category: category.trim(),
        isConnected: isConnected ?? false,
        config: config ? (typeof config === 'string' ? config : JSON.stringify(config)) : null,
        usageInfo: usageInfo || null,
        icon: icon || null,
        order: order ?? 0,
      },
    })

    // Log the activity
    await db.activityLog.create({
      data: {
        type: 'settings_updated',
        title: 'Integration added',
        description: `Added integration: ${displayName}`,
        icon: '🔗',
        metadata: JSON.stringify({ name, category, action: 'create' }),
      },
    })

    return NextResponse.json({ integration }, { status: 201 })
  } catch (error) {
    console.error('Integration creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create integration' },
      { status: 500 }
    )
  }
}

// ── PUT /api/admin/settings/integrations — Update an integration ──

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, name, displayName, category, isConnected, config, usageInfo, icon, order } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Integration ID is required' },
        { status: 400 }
      )
    }

    const existing = await db.integration.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      )
    }

    // Check for duplicate name if name is being changed
    if (name && name !== existing.name) {
      const duplicate = await db.integration.findUnique({
        where: { name },
      })
      if (duplicate) {
        return NextResponse.json(
          { error: 'Integration with this name already exists' },
          { status: 409 }
        )
      }
    }

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name.trim()
    if (displayName !== undefined) data.displayName = displayName.trim()
    if (category !== undefined) data.category = category.trim()
    if (isConnected !== undefined) data.isConnected = isConnected
    if (config !== undefined) {
      data.config = typeof config === 'string' ? config : JSON.stringify(config)
    }
    if (usageInfo !== undefined) data.usageInfo = usageInfo
    if (icon !== undefined) data.icon = icon
    if (order !== undefined) data.order = order

    const integration = await db.integration.update({
      where: { id },
      data,
    })

    // Log the activity
    await db.activityLog.create({
      data: {
        type: 'settings_updated',
        title: 'Integration updated',
        description: `Updated integration: ${integration.displayName}`,
        icon: '🔗',
        metadata: JSON.stringify({ id, updatedFields: Object.keys(data) }),
      },
    })

    return NextResponse.json({ integration })
  } catch (error) {
    console.error('Integration update error:', error)
    return NextResponse.json(
      { error: 'Failed to update integration' },
      { status: 500 }
    )
  }
}

// ── DELETE /api/admin/settings/integrations — Delete an integration ──

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Integration ID is required' },
        { status: 400 }
      )
    }

    const existing = await db.integration.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      )
    }

    await db.integration.delete({ where: { id } })

    // Log the activity
    await db.activityLog.create({
      data: {
        type: 'settings_updated',
        title: 'Integration removed',
        description: `Removed integration: ${existing.displayName}`,
        icon: '🔗',
        metadata: JSON.stringify({ name: existing.name, action: 'delete' }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Integration deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete integration' },
      { status: 500 }
    )
  }
}
