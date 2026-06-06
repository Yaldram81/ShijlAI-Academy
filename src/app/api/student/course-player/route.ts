import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/student/course-player - Fetch all data for course player view
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    let enrollmentId = searchParams.get('enrollmentId')
    const lessonId = searchParams.get('lessonId') // optional: current lesson
    const courseId = searchParams.get('courseId')
    const userId = searchParams.get('userId')

    // If enrollmentId not provided, look it up from courseId + userId
    if (!enrollmentId && courseId && userId) {
      const foundEnrollment = await db.enrollment.findFirst({
        where: { courseId, userId },
      })
      if (foundEnrollment) {
        enrollmentId = foundEnrollment.id
      }
    }

    if (!enrollmentId) {
      return NextResponse.json(
        { error: 'enrollmentId or courseId+userId is required' },
        { status: 400 }
      )
    }

    // Fetch enrollment with course and instructor
    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            instructor: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      )
    }

    const resolvedCourseId = enrollment.courseId

    // Fetch modules with lessons, lesson progress, Q&A, notes, and bookmarks in parallel
    const [modules, lessonProgress, qaQuestions, currentNotes, currentBookmarks] = await Promise.all([
      // Modules with lessons (filter out unpublished modules)
      db.module.findMany({
        where: { courseId: resolvedCourseId, isPublished: true },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              type: true,
              duration: true,
              order: true,
              videoUrl: true,
              description: true,
              content: true,
              objectives: true,
              resources: true,
              transcript: true,
              slideUrl: true,
              isFree: true,
              isPublished: true,
            },
          },
        },
        orderBy: { order: 'asc' },
      }),

      // All lesson progress for this enrollment
      db.lessonProgress.findMany({
        where: { enrollmentId },
        select: {
          lessonId: true,
          status: true,
          timeSpent: true,
          completedAt: true,
        },
      }),

      // QA Questions for this course with answers count and user name
      db.qAQuestion.findMany({
        where: { courseId: resolvedCourseId },
        select: {
          id: true,
          question: true,
          upvotes: true,
          isAnswered: true,
          createdAt: true,
          user: {
            select: { name: true },
          },
          answers: {
            select: { id: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Notes for current lesson (if lessonId provided) — multiple notes supported
      lessonId
        ? db.lessonNote.findMany({
            where: {
              userId: enrollment.userId,
              lessonId,
              enrollmentId,
            },
            select: {
              id: true,
              content: true,
              timestamp: true,
              color: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),

      // Bookmarks for current lesson (if lessonId provided) — multiple bookmarks supported
      lessonId
        ? db.lessonBookmark.findMany({
            where: {
              userId: enrollment.userId,
              lessonId,
              enrollmentId,
            },
            select: {
              id: true,
              timestamp: true,
              label: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
    ])

    // Build progress map for quick lookup
    const progressMap = new Map(
      lessonProgress.map((lp) => [lp.lessonId, lp])
    )

    // Calculate totals
    const allLessons = modules.flatMap((m) => m.lessons)
    const totalLessons = allLessons.length
    const completedLessons = lessonProgress.filter(
      (lp) => lp.status === 'completed'
    ).length

    // Determine section status for each module
    const modulesWithStatus = modules.map((courseModule, moduleIndex) => {
      const lessonsWithProgress = courseModule.lessons
        .filter((lesson) => lesson.isPublished !== false)
        .map((lesson) => {
        const progress = progressMap.get(lesson.id)
        return {
          id: lesson.id,
          title: lesson.title,
          type: lesson.type,
          duration: lesson.duration,
          order: lesson.order,
          videoUrl: lesson.videoUrl,
          description: lesson.description,
          content: lesson.content,
          objectives: lesson.objectives,
          resources: lesson.resources,
          transcript: lesson.transcript,
          slideUrl: lesson.slideUrl,
          isFree: lesson.isFree,
          isPublished: lesson.isPublished,
          progress: progress
            ? {
                status: progress.status,
                timeSpent: progress.timeSpent,
                completedAt: progress.completedAt?.toISOString() ?? null,
              }
            : null,
          isCurrentLesson: lessonId === lesson.id,
        }
      })

      // Determine section status
      let sectionStatus: 'completed' | 'in_progress' | 'locked' = 'locked'

      const hasCompleted = lessonsWithProgress.some(
        (l) => l.progress?.status === 'completed'
      )
      const hasInProgress = lessonsWithProgress.some(
        (l) => l.progress?.status === 'in_progress'
      )
      const allCompleted = lessonsWithProgress.length > 0 && lessonsWithProgress.every(
        (l) => l.progress?.status === 'completed'
      )

      if (allCompleted) {
        sectionStatus = 'completed'
      } else if (hasCompleted || hasInProgress) {
        sectionStatus = 'in_progress'
      } else {
        // No started lessons in this module — check if previous module is completed
        if (moduleIndex === 0) {
          // First module is never locked
          sectionStatus = 'in_progress'
        } else {
          // Check previous module (use filtered lessonsWithProgress from previous module)
          const prevModuleData = modulesWithStatus[moduleIndex - 1]
          const prevAllCompleted = prevModuleData
            ? prevModuleData.lessons.length > 0 && prevModuleData.lessons.every(
              (l) => l.progress?.status === 'completed'
            )
            : false

          if (prevAllCompleted) {
            sectionStatus = 'in_progress'
          } else {
            sectionStatus = 'locked'
          }
        }
      }

      return {
        id: courseModule.id,
        title: courseModule.title,
        order: courseModule.order,
        lessons: lessonsWithProgress,
        sectionStatus,
      }
    })

    // Find next lesson (first uncompleted lesson in order)
    let nextLesson: { id: string; title: string; moduleOrder: number; lessonOrder: number } | null = null

    for (const courseModule of modulesWithStatus) {
      if (courseModule.sectionStatus === 'locked') continue

      for (const lesson of courseModule.lessons) {
        if (!lesson.progress || (lesson.progress.status !== 'completed')) {
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

    // If all lessons are completed, nextLesson remains null
    // Check if there's an in-progress lesson that should take priority
    for (const courseModule of modulesWithStatus) {
      for (const lesson of courseModule.lessons) {
        if (lesson.progress?.status === 'in_progress') {
          nextLesson = {
            id: lesson.id,
            title: lesson.title,
            moduleOrder: courseModule.order,
            lessonOrder: lesson.order,
          }
          break
        }
      }
      if (nextLesson && modulesWithStatus.some(
        (m) => m.lessons.some((l) => l.progress?.status === 'in_progress' && l.id === nextLesson.id)
      )) break
    }

    // Format Q&A questions
    const formattedQA = qaQuestions.map((q) => ({
      id: q.id,
      question: q.question,
      upvotes: q.upvotes,
      isAnswered: q.isAnswered,
      user: { name: q.user.name },
      answersCount: q.answers.length,
      createdAt: q.createdAt.toISOString(),
    }))

    // Calculate progress percentage
    const progressPercentage = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0

    return NextResponse.json({
      enrollment: {
        id: enrollment.id,
        progress: progressPercentage,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt.toISOString(),
        lastAccessed: enrollment.lastAccessed.toISOString(),
      },
      course: {
        id: enrollment.course.id,
        title: enrollment.course.title,
        description: enrollment.course.description,
        category: enrollment.course.category,
        level: enrollment.course.level,
        thumbnail: enrollment.course.thumbnail,
        instructor: enrollment.course.instructor,
      },
      modules: modulesWithStatus,
      totalLessons,
      completedLessons,
      nextLesson,
      qaQuestions: formattedQA,
      currentNotes,
      currentBookmarks,
    })
  } catch (error) {
    console.error('Error fetching course player data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course player data' },
      { status: 500 }
    )
  }
}
