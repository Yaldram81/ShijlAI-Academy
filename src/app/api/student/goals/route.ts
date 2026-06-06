import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status') || 'active'

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const where: any = { userId }
    if (status !== 'all') where.status = status

    const goals = await db.learningGoal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ goals })
  } catch (error) {
    console.error('Error fetching goals:', error)
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, type, title, target, unit, period, startDate, endDate } = body

    if (!userId || !type || !title || !target || !unit || !period || !startDate || !endDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const goal = await db.learningGoal.create({
      data: {
        userId,
        type,
        title,
        target: parseFloat(target),
        current: 0,
        unit,
        period,
        status: 'active',
        startDate,
        endDate,
      },
    })

    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    console.error('Error creating goal:', error)
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, userId, current, status } = body

    if (!id) {
      return NextResponse.json({ error: 'Goal id is required' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const existing = await db.learningGoal.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Goal not found or unauthorized' }, { status: 404 })
    }

    const data: any = {}
    if (current !== undefined) data.current = parseFloat(current)
    if (status) data.status = status

    const goal = await db.learningGoal.update({
      where: { id },
      data,
    })

    return NextResponse.json({ goal })
  } catch (error) {
    console.error('Error updating goal:', error)
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id') || searchParams.get('goalId')
    const userId = searchParams.get('userId')

    if (!id) {
      return NextResponse.json({ error: 'Goal id is required' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const goal = await db.learningGoal.findUnique({ where: { id } })
    if (!goal || goal.userId !== userId) {
      return NextResponse.json({ error: 'Goal not found or unauthorized' }, { status: 404 })
    }

    await db.learningGoal.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
  }
}
