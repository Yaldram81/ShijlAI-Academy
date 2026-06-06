import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/gamification/events
export async function GET() {
  try {
    const events = await db.gamificationEvent.findMany({
      orderBy: { startDate: 'desc' },
    })
    return NextResponse.json({ data: events })
  } catch (error) {
    console.error('[Events GET]', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

// POST /api/admin/gamification/events — Create new event
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, title, description, icon, xpMultiplier, coinMultiplier, startDate, endDate, isActive } = body

    if (!type || !title || !startDate || !endDate) {
      return NextResponse.json({ error: 'type, title, startDate, and endDate are required' }, { status: 400 })
    }

    const event = await db.gamificationEvent.create({
      data: {
        type,
        title,
        description: description || '',
        icon: icon || '🎉',
        xpMultiplier: Number(xpMultiplier || 1.0),
        coinMultiplier: Number(coinMultiplier || 1.0),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    })

    return NextResponse.json({ data: event }, { status: 201 })
  } catch (error) {
    console.error('[Events POST]', error)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }
}

// PATCH /api/admin/gamification/events — Update event
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, type, title, description, icon, xpMultiplier, coinMultiplier, startDate, endDate, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (type !== undefined) updateData.type = type
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (icon !== undefined) updateData.icon = icon
    if (xpMultiplier !== undefined) updateData.xpMultiplier = Number(xpMultiplier)
    if (coinMultiplier !== undefined) updateData.coinMultiplier = Number(coinMultiplier)
    if (startDate !== undefined) updateData.startDate = new Date(startDate)
    if (endDate !== undefined) updateData.endDate = new Date(endDate)
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)

    const event = await db.gamificationEvent.update({ where: { id }, data: updateData })
    return NextResponse.json({ data: event })
  } catch (error) {
    console.error('[Events PATCH]', error)
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
  }
}

// DELETE /api/admin/gamification/events — Delete event
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    await db.gamificationEvent.delete({ where: { id } })
    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    console.error('[Events DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }
}
