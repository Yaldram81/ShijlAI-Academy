import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/gamification/levels
export async function GET() {
  try {
    const levels = await db.levelConfig.findMany({ orderBy: { level: 'asc' } })
    return NextResponse.json({ data: levels })
  } catch (error) {
    console.error('[Levels GET]', error)
    return NextResponse.json({ error: 'Failed to fetch levels' }, { status: 500 })
  }
}

// POST /api/admin/gamification/levels — Create or update level
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { level, title, minXp, maxXp, badgeIcon, coinReward } = body

    if (!level || !title || maxXp === undefined) {
      return NextResponse.json({ error: 'level, title, and maxXp are required' }, { status: 400 })
    }

    const result = await db.levelConfig.upsert({
      where: { level: Number(level) },
      update: { title, minXp: Number(minXp || 0), maxXp: Number(maxXp), badgeIcon: badgeIcon || null, coinReward: Number(coinReward || 0) },
      create: { level: Number(level), title, minXp: Number(minXp || 0), maxXp: Number(maxXp), badgeIcon: badgeIcon || null, coinReward: Number(coinReward || 0) },
    })

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error) {
    console.error('[Levels POST]', error)
    return NextResponse.json({ error: 'Failed to create/update level' }, { status: 500 })
  }
}

// PATCH /api/admin/gamification/levels — Update a level
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, level, title, minXp, maxXp, badgeIcon, coinReward } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (minXp !== undefined) updateData.minXp = Number(minXp)
    if (maxXp !== undefined) updateData.maxXp = Number(maxXp)
    if (badgeIcon !== undefined) updateData.badgeIcon = badgeIcon
    if (coinReward !== undefined) updateData.coinReward = Number(coinReward)

    const result = await db.levelConfig.update({ where: { id }, data: updateData })
    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('[Levels PATCH]', error)
    return NextResponse.json({ error: 'Failed to update level' }, { status: 500 })
  }
}
