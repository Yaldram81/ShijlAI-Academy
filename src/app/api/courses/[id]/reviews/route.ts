import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/courses/[id]/reviews — Fetch course reviews with distribution
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const filter = searchParams.get('filter') // '5', '4', '3', '2', '1', or null for all
    const skip = (page - 1) * limit

    // Build where clause
    const where: Record<string, unknown> = { courseId }
    if (filter && ['5', '4', '3', '2', '1'].includes(filter)) {
      where.rating = parseInt(filter)
    }

    // Fetch reviews
    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.review.count({ where }),
    ])

    // Fetch rating distribution
    const distribution = await db.review.groupBy({
      by: ['rating'],
      where: { courseId },
      _count: { rating: true },
    })

    const distributionMap: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    distribution.forEach((d) => {
      distributionMap[d.rating] = d._count.rating
    })

    // Calculate average
    const allReviews = await db.review.findMany({
      where: { courseId },
      select: { rating: true },
    })
    const avgRating = allReviews.length > 0
      ? Math.round((allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length) * 10) / 10
      : 0

    // Mask anonymous user names
    const maskedReviews = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      content: r.content,
      isAnonymous: r.isAnonymous,
      createdAt: r.createdAt,
      user: r.isAnonymous
        ? { id: 'anonymous', name: 'Anonymous Student', avatar: null }
        : { id: r.user.id, name: r.user.name, avatar: r.user.avatar },
    }))

    return NextResponse.json({
      reviews: maskedReviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        averageRating: avgRating,
        totalReviews: allReviews.length,
        distribution: distributionMap,
      },
    })
  } catch (error) {
    console.error('Error fetching course reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}
