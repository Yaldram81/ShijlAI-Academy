import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/student/reviews - Submit a course review
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, courseId, enrollmentId, rating, content, anonymous } = body

    if (!userId || !courseId || !enrollmentId || !rating) {
      return NextResponse.json(
        { error: 'userId, courseId, enrollmentId, and rating are required' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Verify enrollment belongs to user
    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
    })

    if (!enrollment || enrollment.userId !== userId) {
      return NextResponse.json(
        { error: 'Invalid enrollment' },
        { status: 403 }
      )
    }

    // Check if review already exists
    const existingReview = await db.review.findUnique({
      where: { enrollmentId },
    })

    if (existingReview) {
      // Update existing review
      const updated = await db.review.update({
        where: { id: existingReview.id },
        data: {
          rating,
          content: content || null,
          isAnonymous: anonymous || false,
        },
      })
      return NextResponse.json({ review: updated })
    }

    // Create new review
    const review = await db.review.create({
      data: {
        userId,
        courseId,
        enrollmentId,
        rating,
        content: content || null,
        isAnonymous: anonymous || false,
      },
    })

    // Update course rating (average of all reviews)
    const courseReviews = await db.review.findMany({
      where: { courseId },
      select: { rating: true },
    })
    const avgRating =
      courseReviews.reduce((sum, r) => sum + r.rating, 0) / courseReviews.length

    await db.course.update({
      where: { id: courseId },
      data: { rating: Math.round(avgRating * 10) / 10 },
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('Error submitting review:', error)
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    )
  }
}
