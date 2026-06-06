import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/gamification/challenges
export async function GET() {
  try {
    const challenges = await db.dailyChallenge.findMany({
      orderBy: { date: 'desc' },
      include: { _count: { select: { userChallenges: true } } },
    })
    return NextResponse.json({
      data: challenges.map(c => ({
        ...c,
        participantCount: c._count.userChallenges,
      })),
    })
  } catch (error) {
    console.error('[Challenges GET]', error)
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 })
  }
}

// POST /api/admin/gamification/challenges — Create new challenge
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, type, target, unit, xpReward, coinReward, icon, difficulty, date, isActive } = body

    if (!title || !type || !date) {
      return NextResponse.json({ error: 'title, type, and date are required' }, { status: 400 })
    }

    const challenge = await db.dailyChallenge.create({
      data: {
        title,
        description: description || '',
        type,
        target: Number(target || 1),
        unit: unit || 'xp',
        xpReward: Number(xpReward || 0),
        coinReward: Number(coinReward || 0),
        icon: icon || '🎯',
        difficulty: difficulty || 'medium',
        date,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    })

    return NextResponse.json({ data: challenge }, { status: 201 })
  } catch (error) {
    console.error('[Challenges POST]', error)
    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 })
  }
}

// PATCH /api/admin/gamification/challenges — Update challenge
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, title, description, type, target, unit, xpReward, coinReward, icon, difficulty, date, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (type !== undefined) updateData.type = type
    if (target !== undefined) updateData.target = Number(target)
    if (unit !== undefined) updateData.unit = unit
    if (xpReward !== undefined) updateData.xpReward = Number(xpReward)
    if (coinReward !== undefined) updateData.coinReward = Number(coinReward)
    if (icon !== undefined) updateData.icon = icon
    if (difficulty !== undefined) updateData.difficulty = difficulty
    if (date !== undefined) updateData.date = date
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)

    const challenge = await db.dailyChallenge.update({ where: { id }, data: updateData })
    return NextResponse.json({ data: challenge })
  } catch (error) {
    console.error('[Challenges PATCH]', error)
    return NextResponse.json({ error: 'Failed to update challenge' }, { status: 500 })
  }
}

// DELETE /api/admin/gamification/challenges — Delete challenge
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    await db.dailyChallenge.delete({ where: { id } })
    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    console.error('[Challenges DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete challenge' }, { status: 500 })
  }
}
