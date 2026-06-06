import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Helper: validate userId, fallback to first student user
async function validateUser(userId: string | null): Promise<{ id: string; name: string; role: string } | null> {
  if (userId) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, role: true },
    })
    if (user) return user
  }
  // Fallback: find first student user
  const fallback = await db.user.findFirst({
    where: { role: 'student' },
    select: { id: true, name: true, role: true },
  })
  return fallback
}

// GET /api/student/community/peer-reviews?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const user = await validateUser(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'No student user found' },
        { status: 404 }
      )
    }

    // Fetch pending peer reviews where this user is the reviewer
    const pendingReviews = await db.peerReview.findMany({
      where: {
        reviewerId: user.id,
        status: 'pending',
      },
      include: {
        assignment: {
          select: { id: true, title: true, courseId: true },
        },
        reviewee: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Get submission content for preview
    const submissionIds = pendingReviews.map((r) => r.submissionId)
    const submissions = await db.submission.findMany({
      where: { id: { in: submissionIds } },
      select: {
        id: true,
        content: true,
        submittedAt: true,
      },
    })

    const submissionMap = new Map(submissions.map((s) => [s.id, s]))

    const formattedReviews = pendingReviews.map((review) => {
      const submission = submissionMap.get(review.submissionId)
      return {
        id: review.id,
        assignmentId: review.assignmentId,
        assignmentTitle: review.assignment.title,
        submissionId: review.submissionId,
        submissionPreview: submission
          ? submission.content.substring(0, 200) + (submission.content.length > 200 ? '...' : '')
          : null,
        revieweeId: review.revieweeId,
        revieweeName: review.reviewee.name,
        revieweeAvatar: review.reviewee.avatar,
        xpReward: 50,
        status: review.status,
        createdAt: review.createdAt.toISOString(),
      }
    })

    return NextResponse.json({ reviews: formattedReviews })
  } catch (error) {
    console.error('Error fetching peer reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch peer reviews' },
      { status: 500 }
    )
  }
}

// POST /api/student/community/peer-reviews — Submit a peer review
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, peerReviewId, feedback, rating } = body

    if (!userId || !peerReviewId || !feedback) {
      return NextResponse.json(
        { error: 'userId, peerReviewId, and feedback are required' },
        { status: 400 }
      )
    }

    // Validate the peer review exists and belongs to this user
    const peerReview = await db.peerReview.findUnique({
      where: { id: peerReviewId },
      include: {
        assignment: {
          select: { id: true, title: true },
        },
      },
    })
    if (!peerReview) {
      return NextResponse.json(
        { error: 'Peer review not found' },
        { status: 404 }
      )
    }
    if (peerReview.reviewerId !== userId) {
      return NextResponse.json(
        { error: 'You are not the assigned reviewer for this peer review' },
        { status: 403 }
      )
    }
    if (peerReview.status !== 'pending') {
      return NextResponse.json(
        { error: 'This peer review has already been completed' },
        { status: 400 }
      )
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const xpAwarded = 50

    // Update peer review and award XP in a transaction
    await db.$transaction(async (tx) => {
      // Update the peer review
      await tx.peerReview.update({
        where: { id: peerReviewId },
        data: {
          feedback,
          rating: rating ?? null,
          xpAwarded,
          status: 'completed',
        },
      })

      // Award XP to the reviewer
      await tx.user.update({
        where: { id: userId },
        data: {
          xp: { increment: xpAwarded },
          shijlCoins: { increment: 5 },
        },
      })

      // Record daily activity for XP
      const today = new Date().toISOString().split('T')[0]
      const existingActivity = await tx.dailyActivity.findUnique({
        where: {
          userId_date: { userId, date: today },
        },
      })

      if (existingActivity) {
        await tx.dailyActivity.update({
          where: { id: existingActivity.id },
          data: { xpEarned: { increment: xpAwarded } },
        })
      } else {
        await tx.dailyActivity.create({
          data: {
            userId,
            date: today,
            xpEarned: xpAwarded,
          },
        })
      }
    })

    return NextResponse.json({
      completed: true,
      xpAwarded,
      message: 'Peer review submitted successfully! You earned 50 XP.',
    })
  } catch (error) {
    console.error('Error submitting peer review:', error)
    return NextResponse.json(
      { error: 'Failed to submit peer review' },
      { status: 500 }
    )
  }
}
