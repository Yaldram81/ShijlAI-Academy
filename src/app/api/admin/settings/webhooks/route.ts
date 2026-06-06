import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper: serialize webhook dates
function serializeWebhook(wh: Record<string, unknown>) {
  return {
    ...wh,
    lastTriggeredAt: (wh.lastTriggeredAt as Date)?.toISOString?.() ?? null,
    createdAt: (wh.createdAt as Date)?.toISOString?.() ?? wh.createdAt,
    updatedAt: (wh.updatedAt as Date)?.toISOString?.() ?? wh.updatedAt,
  }
}

// GET /api/admin/settings/webhooks — List all WebhookConfig entries
export async function GET() {
  try {
    const webhooks = await db.webhookConfig.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const serialized = webhooks.map(wh => serializeWebhook(wh as Record<string, unknown>))

    return NextResponse.json({ webhooks: serialized })
  } catch (error) {
    console.error('Webhooks fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    )
  }
}

// POST /api/admin/settings/webhooks — Create a new webhook
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, url, secret, events, isActive } = body

    if (!name || !url || !events) {
      return NextResponse.json(
        { error: 'Name, URL, and events are required' },
        { status: 400 }
      )
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
      webhook: serializeWebhook(webhook as Record<string, unknown>),
    })
  } catch (error) {
    console.error('Webhook create error:', error)
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/settings/webhooks — Update a webhook
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updateFields } = body

    if (!id) {
      return NextResponse.json({ error: 'Webhook ID is required' }, { status: 400 })
    }

    const existing = await db.webhookConfig.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        if (key === 'events' && Array.isArray(value)) {
          updateData[key] = JSON.stringify(value)
        } else {
          updateData[key] = value
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
      webhook: serializeWebhook(updated as Record<string, unknown>),
    })
  } catch (error) {
    console.error('Webhook update error:', error)
    return NextResponse.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/settings/webhooks — Delete a webhook
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Webhook ID is required' }, { status: 400 })
    }

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
  } catch (error) {
    console.error('Webhook delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    )
  }
}
