import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/student/learning - Fetch enrollments with counts
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status') // active, completed, archived
    const sort = searchParams.get('sort') || 'last_accessed'

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Build where clause
    const where: Record<string, unknown> = { userId }
    if (status && status !== 'all') {
      where.status = status
    }

    // Build order by
    let orderBy: Record<string, unknown>
    switch (sort) {
      case 'progress':
        orderBy = { progress: 'desc' }
        break
      case 'enrolled_date':
        orderBy = { enrolledAt: 'desc' }
        break
      case 'title':
        orderBy = { course: { title: 'asc' } }
        break
      case 'last_accessed':
      default:
        orderBy = { lastAccessed: 'desc' }
        break
    }

    // Fetch enrollments (lightweight first, then enrich)
    const enrollments = await db.enrollment.findMany({
      where,
      include: {
        course: {
          include: {
            instructor: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
        lessonProgress: true,
      },
      orderBy,
    })

    // Get counts, reviews, and certificates in parallel
    const [allCount, inProgressCount, completedCount, archivedCount, wishlistCount, reviews, certificates] = await Promise.all([
      db.enrollment.count({ where: { userId } }),
      db.enrollment.count({ where: { userId, status: 'active' } }),
      db.enrollment.count({ where: { userId, status: 'completed' } }),
      db.enrollment.count({ where: { userId, status: 'archived' } }),
      db.wishlist.count({ where: { userId } }),
      db.review.findMany({ where: { userId }, select: { enrollmentId: true } }),
      db.certificate.findMany({ where: { userId }, select: { id: true, courseId: true, certificateId: true } }),
    ])

    const reviewEnrollmentIds = new Set(reviews.map((r) => r.enrollmentId))
    const certMap = new Map(certificates.map((c) => [c.courseId, c]))

    // Get lesson counts per course
    const courseIds = enrollments.map((e) => e.courseId)
    const modulesWithLessons = await db.module.findMany({
      where: { courseId: { in: courseIds } },
      include: {
        lessons: {
          select: { id: true, title: true, order: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    })

    // Group by courseId
    const courseLessonsMap = new Map<string, typeof modulesWithLessons>()
    for (const m of modulesWithLessons) {
      if (!courseLessonsMap.has(m.courseId)) {
        courseLessonsMap.set(m.courseId, [])
      }
      courseLessonsMap.get(m.courseId)!.push(m)
    }

    // Get in-progress lesson details for next lesson
    const inProgressLessonIds = enrollments.flatMap((e) =>
      e.lessonProgress.filter((lp) => lp.status === 'in_progress').map((lp) => lp.lessonId)
    )

    let lessonDetails: Map<string, { id: string; title: string; order: number; moduleId: string; moduleOrder: number }> = new Map()
    if (inProgressLessonIds.length > 0) {
      const lessons = await db.lesson.findMany({
        where: { id: { in: inProgressLessonIds } },
        include: { module: { select: { order: true } } },
      })
      for (const l of lessons) {
        lessonDetails.set(l.id, {
          id: l.id,
          title: l.title,
          order: l.order,
          moduleId: l.moduleId,
          moduleOrder: l.module.order,
        })
      }
    }

    // Transform enrollments
    const transformedEnrollments = enrollments.map((enrollment) => {
      const course = enrollment.course
      const modules = courseLessonsMap.get(enrollment.courseId) || []
      const allLessons = modules.flatMap((m) => m.lessons)
      const totalLessons = allLessons.length

      const completedLessons = enrollment.lessonProgress.filter(
        (lp) => lp.status === 'completed'
      ).length

      const progressPercentage = totalLessons > 0
        ? Math.round((completedLessons / totalLessons) * 100)
        : enrollment.progress

      // Find next lesson
      const completedLessonIds = new Set(
        enrollment.lessonProgress
          .filter((lp) => lp.status === 'completed')
          .map((lp) => lp.lessonId)
      )

      let nextLesson: { id: string; title: string; moduleOrder: number; lessonOrder: number } | null = null

      // Check in-progress lessons first
      const inProgressLP = enrollment.lessonProgress.find((lp) => lp.status === 'in_progress')
      if (inProgressLP) {
        const detail = lessonDetails.get(inProgressLP.lessonId)
        if (detail) {
          nextLesson = {
            id: detail.id,
            title: detail.title,
            moduleOrder: detail.moduleOrder,
            lessonOrder: detail.order,
          }
        }
      }

      // Otherwise find first uncompleted lesson
      if (!nextLesson) {
        for (const courseModule of modules) {
          for (const lesson of courseModule.lessons) {
            if (!completedLessonIds.has(lesson.id)) {
              nextLesson = {
                id: lesson.id,
                title: lesson.title,
                moduleOrder: courseModule.order,
                lessonOrder: lesson.order,
              }
              break
            }
          }
          if (nextLesson) break
        }
      }

      const certificate = certMap.get(enrollment.courseId)

      return {
        id: enrollment.id,
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        progress: enrollment.progress,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt.toISOString(),
        completedAt: enrollment.completedAt?.toISOString() ?? null,
        lastAccessed: enrollment.lastAccessed.toISOString(),
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          category: course.category,
          level: course.level,
          thumbnail: course.thumbnail,
          rating: course.rating,
          estimatedDuration: course.estimatedDuration,
          price: course.price,
          instructor: course.instructor,
        },
        totalLessons,
        completedLessons,
        progressPercentage,
        nextLesson,
        hasReview: reviewEnrollmentIds.has(enrollment.id),
        certificate: certificate
          ? { id: certificate.id, certificateId: certificate.certificateId }
          : null,
      }
    })

    return NextResponse.json({
      enrollments: transformedEnrollments,
      counts: {
        all: allCount,
        inProgress: inProgressCount,
        completed: completedCount,
        archived: archivedCount,
        wishlist: wishlistCount,
      },
    })
  } catch (error) {
    console.error('Error fetching learning data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch learning data' },
      { status: 500 }
    )
  }
}

// PATCH /api/student/learning - Archive/restore enrollment
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { enrollmentId, action } = body

    if (!enrollmentId || !action) {
      return NextResponse.json(
        { error: 'enrollmentId and action are required' },
        { status: 400 }
      )
    }

    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      )
    }

    let updateData: Record<string, unknown> = {}

    switch (action) {
      case 'archive':
        updateData = { status: 'archived' }
        break
      case 'restore':
        updateData = { status: 'active' }
        break
      case 'complete':
        updateData = { status: 'completed', completedAt: new Date(), progress: 100 }
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: archive, restore, complete' },
          { status: 400 }
        )
    }

    const updated = await db.enrollment.update({
      where: { id: enrollmentId },
      data: updateData,
    })

    return NextResponse.json({
      enrollment: {
        id: updated.id,
        status: updated.status,
        progress: updated.progress,
        completedAt: updated.completedAt?.toISOString() ?? null,
      },
    })
  } catch (error) {
    console.error('Error updating enrollment:', error)
    return NextResponse.json(
      { error: 'Failed to update enrollment' },
      { status: 500 }
    )
  }
}
