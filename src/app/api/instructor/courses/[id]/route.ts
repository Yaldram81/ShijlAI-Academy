import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/courses/[id] - Get single instructor course with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')

    if (!instructorId) {
      return NextResponse.json({ error: 'instructorId is required' }, { status: 400 })
    }

    const course = await db.course.findUnique({
      where: { id },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
          },
        },
        enrollments: {
          take: 20,
          orderBy: { enrolledAt: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
        quizzes: {
          select: { id: true, title: true, type: true, passingScore: true, isPublished: true },
        },
        reviews: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Verify ownership
    if (course.instructorId !== instructorId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Compute analytics
    const totalEnrollments = course.enrollmentCount
    const recentEnrollments = course.enrollments.filter(e => {
      const enrolledAt = new Date(e.enrolledAt)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return enrolledAt >= weekAgo
    }).length

    const avgProgress = course.enrollments.length > 0
      ? Math.round(course.enrollments.reduce((sum, e) => sum + e.progress, 0) / course.enrollments.length)
      : 0

    const completedEnrollments = course.enrollments.filter(e => e.status === 'completed').length
    const completionRate = course.enrollments.length > 0
      ? Math.round((completedEnrollments / course.enrollments.length) * 100)
      : 0

    const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0)
    const totalDuration = course.modules.reduce(
      (acc, m) => acc + m.lessons.reduce((la, l) => la + l.duration, 0), 0
    )

    // Total revenue from transactions
    const revenueResult = await db.transaction.aggregate({
      where: {
        courseId: course.id,
        type: 'enrollment',
        status: 'completed',
      },
      _sum: { instructorEarning: true },
    })
    const totalRevenue = revenueResult._sum.instructorEarning || 0

    // Build enrollment trend data (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const recentEnrollmentsAll = await db.enrollment.findMany({
      where: {
        courseId: course.id,
        enrolledAt: { gte: thirtyDaysAgo },
      },
      select: { enrolledAt: true },
      orderBy: { enrolledAt: 'asc' },
    })

    // Group enrollments by date
    const enrollmentByDate: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      enrollmentByDate[key] = 0
    }
    for (const e of recentEnrollmentsAll) {
      const key = new Date(e.enrolledAt).toISOString().split('T')[0]
      if (enrollmentByDate[key] !== undefined) {
        enrollmentByDate[key]++
      }
    }
    const enrollmentTrend = Object.entries(enrollmentByDate).map(([date, count]) => ({ date, count }))

    // Rating breakdown
    const allReviews = await db.review.findMany({
      where: { courseId: course.id },
      select: { rating: true },
    })
    const ratingBreakdown = [1, 2, 3, 4, 5].map(star => ({
      star,
      count: allReviews.filter(r => r.rating === star).length,
    }))

    // Format modules for response
    const modules = course.modules.map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      order: m.order,
      lessons: m.lessons.map(l => ({
        id: l.id,
        title: l.title,
        type: l.type,
        duration: l.duration,
        order: l.order,
        isPublished: l.isPublished,
        isFree: l.isFree,
      })),
      lessonCount: m.lessons.length,
      totalDuration: m.lessons.reduce((sum, l) => sum + l.duration, 0),
    }))

    // Format recent enrollments
    const recentEnrollmentList = course.enrollments.map(e => ({
      id: e.id,
      userId: e.user.id,
      name: e.user.name,
      avatar: e.user.avatar,
      progress: Math.round(e.progress),
      status: e.status,
      enrolledAt: e.enrolledAt.toISOString(),
    }))

    // Format reviews
    const recentReviews = course.reviews.map(r => ({
      id: r.id,
      userId: r.user.id,
      name: r.user.name,
      avatar: r.user.avatar,
      rating: r.rating,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
    }))

    return NextResponse.json({
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        language: course.language,
        thumbnail: course.thumbnail,
        price: course.price,
        isPublished: course.isPublished,
        isArchived: course.isArchived,
        enrollmentCount: course.enrollmentCount,
        rating: course.rating,
        reviewStatus: course.reviewStatus,
        reviewNote: course.reviewNote,
        certificateEnabled: course.certificateEnabled,
        completionThreshold: course.completionThreshold,
        estimatedDuration: course.estimatedDuration,
        learningObjectives: course.learningObjectives,
        prerequisites: course.prerequisites,
        targetAudience: course.targetAudience,
        tags: course.tags,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString(),
        submittedForReviewAt: course.submittedForReviewAt?.toISOString() || null,
        reviewedAt: course.reviewedAt?.toISOString() || null,
      },
      modules,
      recentEnrollments: recentEnrollmentList,
      analytics: {
        totalEnrollments,
        recentEnrollments,
        avgProgress,
        completionRate,
        totalLessons,
        totalDuration,
        totalRevenue,
        enrollmentTrend,
        ratingBreakdown,
      },
      quizzes: course.quizzes,
      recentReviews,
    })
  } catch (error) {
    console.error('Error fetching instructor course:', error)
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 })
  }
}

// PATCH /api/instructor/courses/[id] - Update course (including publish/unpublish)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId') || body.instructorId

    const existing = await db.course.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Verify ownership
    if (!instructorId || existing.instructorId !== instructorId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {}
    const allowedFields = ['title', 'description', 'category', 'level', 'language', 'price', 'thumbnail', 'isArchived', 'certificateEnabled', 'completionThreshold', 'estimatedDuration', 'learningObjectives', 'prerequisites', 'targetAudience', 'tags', 'reviewStatus', 'submittedForReviewAt']
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Security: Instructors cannot set isPublished directly — that's done via admin review approval
    // Remove isPublished from updateData if instructor tries to set it
    delete updateData.isPublished

    // Security: Only allow valid reviewStatus transitions by instructor
    // Instructor can: draft → pending (submit for review), changes_requested → pending (re-submit), any → draft (save as draft)
    if (updateData.reviewStatus !== undefined) {
      const currentStatus = existing.reviewStatus
      const newStatus = updateData.reviewStatus as string
      const allowedTransitions: Record<string, string[]> = {
        draft: ['pending'],
        pending: ['draft'],
        changes_requested: ['pending', 'draft'],
        rejected: ['pending', 'draft'],
        under_review: ['draft'], // can withdraw
        approved: ['draft'], // can unpublish (goes back to draft)
      }
      const allowed = allowedTransitions[currentStatus] || []
      if (!allowed.includes(newStatus)) {
        return NextResponse.json(
          { error: `Cannot change review status from '${currentStatus}' to '${newStatus}'. Allowed: ${allowed.join(', ') || 'none'}` },
          { status: 400 }
        )
      }
    }

    // Validate before submitting for review
    if (updateData.reviewStatus === 'pending') {
      const courseWithContent = await db.course.findUnique({
        where: { id },
        include: { modules: { include: { lessons: true } } },
      })
      if (!courseWithContent) {
        return NextResponse.json({ error: 'Course not found' }, { status: 404 })
      }
      if (courseWithContent.modules.length === 0) {
        return NextResponse.json({ error: 'Course must have at least one module to submit for review' }, { status: 400 })
      }
      const totalLessons = courseWithContent.modules.reduce((acc, m) => acc + m.lessons.length, 0)
      if (totalLessons === 0) {
        return NextResponse.json({ error: 'Course must have at least one lesson to submit for review' }, { status: 400 })
      }
    }

    const course = await db.course.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ course, message: 'Course updated successfully' })
  } catch (error) {
    console.error('Error updating course:', error)
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
  }
}

// DELETE /api/instructor/courses/[id] - Delete a course
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')

    const existing = await db.course.findUnique({
      where: { id },
      include: { _count: { select: { enrollments: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Verify ownership
    if (!instructorId || existing.instructorId !== instructorId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    if (existing._count.enrollments > 0) {
      return NextResponse.json(
        { error: 'Cannot delete course with active enrollments. Unpublish instead.' },
        { status: 400 }
      )
    }

    await db.course.delete({ where: { id } })

    return NextResponse.json({ message: 'Course deleted successfully' })
  } catch (error) {
    console.error('Error deleting course:', error)
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 })
  }
}
