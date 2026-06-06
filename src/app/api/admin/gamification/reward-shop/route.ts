import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/gamification/reward-shop
export async function GET() {
  try {
    const items = await db.rewardShopItem.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { userRewards: true } } },
    })
    return NextResponse.json({
      data: items.map(i => ({
        ...i,
        claimCount: i._count.userRewards,
      })),
    })
  } catch (error) {
    console.error('[Reward Shop GET]', error)
    return NextResponse.json({ error: 'Failed to fetch reward shop items' }, { status: 500 })
  }
}

// POST /api/admin/gamification/reward-shop — Create new reward shop item
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, icon, category, coinCost, xpCost, stock, isActive } = body

    if (!name || !coinCost) {
      return NextResponse.json({ error: 'name and coinCost are required' }, { status: 400 })
    }

    const item = await db.rewardShopItem.create({
      data: {
        name,
        description: description || '',
        icon: icon || '🎁',
        category: category || 'digital',
        coinCost: Number(coinCost),
        xpCost: Number(xpCost || 0),
        stock: stock !== undefined ? Number(stock) : -1,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    })

    return NextResponse.json({ data: item }, { status: 201 })
  } catch (error) {
    console.error('[Reward Shop POST]', error)
    return NextResponse.json({ error: 'Failed to create reward shop item' }, { status: 500 })
  }
}

// PATCH /api/admin/gamification/reward-shop — Update reward shop item
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, name, description, icon, category, coinCost, xpCost, stock, isActive, claimed } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (icon !== undefined) updateData.icon = icon
    if (category !== undefined) updateData.category = category
    if (coinCost !== undefined) updateData.coinCost = Number(coinCost)
    if (xpCost !== undefined) updateData.xpCost = Number(xpCost)
    if (stock !== undefined) updateData.stock = Number(stock)
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)
    if (claimed !== undefined) updateData.claimed = Number(claimed)

    const item = await db.rewardShopItem.update({ where: { id }, data: updateData })
    return NextResponse.json({ data: item })
  } catch (error) {
    console.error('[Reward Shop PATCH]', error)
    return NextResponse.json({ error: 'Failed to update reward shop item' }, { status: 500 })
  }
}

// DELETE /api/admin/gamification/reward-shop — Delete reward shop item
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    await db.rewardShopItem.delete({ where: { id } })
    return NextResponse.json({ data: { deleted: true } })
  } catch (error) {
    console.error('[Reward Shop DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete reward shop item' }, { status: 500 })
  }
}
