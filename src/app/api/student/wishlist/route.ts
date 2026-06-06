import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/student/wishlist - Fetch wishlist items
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Get user's enrollment course IDs to determine isEnrolled
    const enrolledCourseIds = await db.enrollment.findMany({
      where: { userId },
      select: { courseId: true },
    })
    const enrolledSet = new Set(enrolledCourseIds.map((e) => e.courseId))

    const wishlist = await db.wishlist.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            instructor: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const transformed = wishlist.map((item) => ({
      id: item.id,
      courseId: item.courseId,
      course: {
        id: item.course.id,
        title: item.course.title,
        thumbnail: item.course.thumbnail,
        category: item.course.category,
        level: item.course.level,
        rating: item.course.rating,
        price: item.course.price,
        instructor: item.course.instructor,
      },
      isEnrolled: enrolledSet.has(item.courseId),
      createdAt: item.createdAt.toISOString(),
    }))

    return NextResponse.json({ wishlist: transformed })
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wishlist' },
      { status: 500 }
    )
  }
}

// DELETE /api/student/wishlist - Remove from wishlist
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, courseId } = body

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: 'userId and courseId are required' },
        { status: 400 }
      )
    }

    await db.wishlist.deleteMany({
      where: { userId, courseId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing from wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to remove from wishlist' },
      { status: 500 }
    )
  }
}

// POST /api/student/wishlist - Add to wishlist
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, courseId } = body

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: 'userId and courseId are required' },
        { status: 400 }
      )
    }

    // Check if already in wishlist
    const existing = await db.wishlist.findUnique({
      where: { userId_courseId: { userId, courseId } },
    })

    if (existing) {
      return NextResponse.json({ wishlist: existing, message: 'Already in wishlist' })
    }

    const wishlistItem = await db.wishlist.create({
      data: { userId, courseId },
    })

    return NextResponse.json({ wishlist: wishlistItem })
  } catch (error) {
    console.error('Error adding to wishlist:', error)
    return NextResponse.json(
      { error: 'Failed to add to wishlist' },
      { status: 500 }
    )
  }
}
