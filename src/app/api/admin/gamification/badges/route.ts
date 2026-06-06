import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/gamification/badges
export async function GET() {
  try {
    const badges = await db.badge.findMany({ orderBy: { name: 'asc' } })

    const userBadgeRows = await db.userBadge.findMany({ select: { badgeId: true } })
    const earnCounts: Record<string, number> = {}
    for (const ub of userBadgeRows) {
      earnCounts[ub.badgeId] = (earnCounts[ub.badgeId] || 0) + 1
    }

    return NextResponse.json({
      data: badges.map(b => ({
        ...b,
        earnCount: earnCounts[b.id] || 0,
      })),
    })
  } catch (error) {
    console.error('[Badges GET]', error)
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 })
  }
}

// POST /api/admin/gamification/badges — Create new badge
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, icon, category, xpReward, coinReward, requirement, isActive } = body

    if (!name || !description || !icon || !category) {
      return NextResponse.json({ error: 'name, description, icon, and category are required' }, { status: 400 })
    }

    const badge = await db.badge.create({
      data: {
        name,
        description,
        icon,
        category,
        xpReward: Number(xpReward || 0),
        coinReward: Number(coinReward || 0),
        requirement: typeof requirement === 'object' ? JSON.stringify(requirement) : (requirement || '{}'),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    })

    return NextResponse.json({ data: badge }, { status: 201 })
  } catch (error) {
    console.error('[Badges POST]', error)
    return NextResponse.json({ error: 'Failed to create badge' }, { status: 500 })
  }
}

// PATCH /api/admin/gamification/badges — Update badge
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, name, description, icon, category, xpReward, coinReward, requirement, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (icon !== undefined) updateData.icon = icon
    if (category !== undefined) updateData.category = category
    if (xpReward !== undefined) updateData.xpReward = Number(xpReward)
    if (coinReward !== undefined) updateData.coinReward = Number(coinReward)
    if (requirement !== undefined) updateData.requirement = typeof requirement === 'object' ? JSON.stringify(requirement) : requirement
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)

    const badge = await db.badge.update({ where: { id }, data: updateData })
    return NextResponse.json({ data: badge })
  } catch (error) {
    console.error('[Badges PATCH]', error)
    return NextResponse.json({ error: 'Failed to update badge' }, { status: 500 })
  }
}

// DELETE /api/admin/gamification/badges — Delete badge
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    await db.badge.delete({ where: { id } })
    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    console.error('[Badges DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete badge' }, { status: 500 })
  }
}
