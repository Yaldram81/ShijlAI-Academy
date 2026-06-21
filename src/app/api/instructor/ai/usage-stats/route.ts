import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET: Get usage statistics for an instructor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')

    if (!instructorId) {
      return NextResponse.json(
        { error: 'instructorId is required' },
        { status: 400 }
      )
    }

    // Run count queries in parallel
    const [
      totalGenerations,
      favoriteCount,
      templatesCount,
      assistantMessagesCount,
      recentActivity,
      thisMonthCount,
      lastMonthCount,
    ] = await Promise.all([
      db.aIGeneration.count({ where: { instructorId } }),
      db.aIGeneration.count({ where: { instructorId, isFavorite: true } }),
      db.aITemplate.count({ where: { instructorId, isDefault: false } }),
      db.aIAssistantMessage.count({ where: { instructorId } }),
      db.aIGeneration.findMany({
        where: { instructorId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          toolType: true,
          title: true,
          isFavorite: true,
          createdAt: true,
        },
      }),
      db.aIGeneration.count({
        where: {
          instructorId,
          createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
      db.aIGeneration.count({
        where: {
          instructorId,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ])

    // Build byTool breakdown from generations
    const allGenerations = await db.aIGeneration.findMany({
      where: { instructorId },
      select: { toolType: true },
    })
    const byToolMap = new Map<string, number>()
    for (const g of allGenerations) {
      byToolMap.set(g.toolType, (byToolMap.get(g.toolType) || 0) + 1)
    }
    const byTool = Array.from(byToolMap.entries()).map(([toolType, count]) => ({ toolType, count }))

    return NextResponse.json({
      totalGenerations,
      favoriteCount,
      templatesCount,
      assistantMessagesCount,
      byTool,
      recentActivity,
      thisMonth: thisMonthCount,
      lastMonth: lastMonthCount,
    })
  } catch (error) {
    console.error('Error fetching AI usage stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch usage statistics' },
      { status: 500 }
    )
  }
}
