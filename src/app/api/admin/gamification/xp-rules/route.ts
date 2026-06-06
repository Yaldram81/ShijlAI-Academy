import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/gamification/xp-rules
export async function GET() {
  try {
    const rules = await db.xPRule.findMany({ orderBy: { order: 'asc' } })
    return NextResponse.json({ data: rules })
  } catch (error) {
    console.error('[XP Rules GET]', error)
    return NextResponse.json({ error: 'Failed to fetch XP rules' }, { status: 500 })
  }
}

// POST /api/admin/gamification/xp-rules — Create new XP rule
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, label, xpAwarded, coinAwarded, category, isActive, description } = body

    if (!action || !label || xpAwarded === undefined) {
      return NextResponse.json({ error: 'action, label, and xpAwarded are required' }, { status: 400 })
    }

    const existing = await db.xPRule.findUnique({ where: { action } })
    if (existing) {
      return NextResponse.json({ error: 'XP rule with this action already exists' }, { status: 409 })
    }

    const maxOrder = await db.xPRule.aggregate({ _max: { order: true } })
    const rule = await db.xPRule.create({
      data: {
        action,
        label,
        xpAwarded: Number(xpAwarded),
        coinAwarded: Number(coinAwarded || 0),
        category: category || 'learning',
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        order: (maxOrder._max.order || 0) + 1,
        description: description || null,
      },
    })

    return NextResponse.json({ data: rule }, { status: 201 })
  } catch (error) {
    console.error('[XP Rules POST]', error)
    return NextResponse.json({ error: 'Failed to create XP rule' }, { status: 500 })
  }
}

// PATCH /api/admin/gamification/xp-rules — Update XP rule
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, action, label, xpAwarded, coinAwarded, category, isActive, description, order } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (action !== undefined) updateData.action = action
    if (label !== undefined) updateData.label = label
    if (xpAwarded !== undefined) updateData.xpAwarded = Number(xpAwarded)
    if (coinAwarded !== undefined) updateData.coinAwarded = Number(coinAwarded)
    if (category !== undefined) updateData.category = category
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)
    if (description !== undefined) updateData.description = description
    if (order !== undefined) updateData.order = Number(order)

    const rule = await db.xPRule.update({ where: { id }, data: updateData })
    return NextResponse.json({ data: rule })
  } catch (error) {
    console.error('[XP Rules PATCH]', error)
    return NextResponse.json({ error: 'Failed to update XP rule' }, { status: 500 })
  }
}

// DELETE /api/admin/gamification/xp-rules — Delete XP rule
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    await db.xPRule.delete({ where: { id } })
    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    console.error('[XP Rules DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete XP rule' }, { status: 500 })
  }
}
