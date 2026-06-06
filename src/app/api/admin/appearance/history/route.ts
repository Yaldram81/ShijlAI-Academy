import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/appearance/history — Fetch appearance change history
export async function GET() {
  try {
    const history = await db.appearanceHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const serialized = history.map(entry => ({
      ...entry,
      createdAt: entry.createdAt.toISOString(),
    }))

    return NextResponse.json({ history: serialized })
  } catch (error) {
    console.error('Appearance history fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appearance history' },
      { status: 500 }
    )
  }
}

// POST /api/admin/appearance/history — Restore from history
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, id } = body

    if (action === 'restore' && id) {
      // Find the history entry
      const entry = await db.appearanceHistory.findUnique({ where: { id } })
      if (!entry) {
        return NextResponse.json({ error: 'History entry not found' }, { status: 404 })
      }

      // Parse the snapshot
      const snapshot = JSON.parse(entry.snapshot) as Record<string, unknown>

      // Get current config
      let config = await db.appearanceBranding.findFirst()
      if (!config) {
        config = await db.appearanceBranding.create({ data: {} })
      }

      // Create a new history snapshot before restoring
      const { id: _configId, updatedAt: _updatedAt, ...currentData } = config
      await db.appearanceHistory.create({
        data: {
          snapshot: JSON.stringify(currentData),
          presetName: config.themePreset,
          changeDescription: `Auto-snapshot before restoring from ${new Date(entry.createdAt).toLocaleString()}`,
        },
      })

      // Apply the snapshot
      const data: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(snapshot)) {
        if (value !== undefined) {
          data[key] = value
        }
      }

      const updated = await db.appearanceBranding.update({
        where: { id: config.id },
        data,
      })

      // Log the activity
      await db.activityLog.create({
        data: {
          type: 'appearance_restored',
          title: 'Appearance configuration restored',
          description: `Restored from snapshot taken at ${new Date(entry.createdAt).toLocaleString()}`,
          icon: '🔄',
          action: 'updated',
          targetType: 'settings',
          category: 'admin_action',
        },
      })

      return NextResponse.json({
        config: {
          ...updated,
          updatedAt: updated.updatedAt.toISOString(),
        },
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Appearance history restore error:', error)
    return NextResponse.json(
      { error: 'Failed to restore from history' },
      { status: 500 }
    )
  }
}
