import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/courses - Get instructor's courses with analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')
    const status = searchParams.get('status') // 'all', 'published', 'draft', 'archived'
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const level = searchParams.get('level')
    const sort = searchParams.get('sort') || 'updatedAt-desc'

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    // Build where clause — fetch ALL courses for summary first (unfiltered)
    const baseWhere: Record<string, unknown> = { instructorId }

    // Build filtered where clause for the actual query
    const where: Record<string, unknown> = { instructorId }

    // Status filter
    if (status === 'published') {
      where.isPublished = true
      where.isArchived = { not: true }
    } else if (status === 'draft') {
      where.isPublished = false
      where.isArchived = { not: true }
      where.reviewStatus = { not: 'under_review' }
    } else if (status === 'under-review') {
      where.reviewStatus = 'under_review'
      where.isArchived = { not: true }
    } else if (status === 'archived') {
      where.isArchived = true
    } else {
      // 'all' — include everything
    }

    // Category filter
    if (category && category !== 'all') {
      where.category = category
    }

    // Level filter
    if (level && level !== 'all') {
      where.level = level
    }

    // Search filter
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { category: { contains: search } },
      ]
    }

    // Parse sort param
    const sortMap: Record<string, Record<string, string>> = {
      'updatedAt-desc': { updatedAt: 'desc' },
      'updatedAt-asc': { updatedAt: 'asc' },
      'title-asc': { title: 'asc' },
      'title-desc': { title: 'desc' },
      'createdAt-desc': { createdAt: 'desc' },
      'createdAt-asc': { createdAt: 'asc' },
      'rating-desc': { rating: 'desc' },
      'students-desc': { enrollmentCount: 'desc' },
      'revenue-desc': { price: 'desc' },
    }
    const orderBy = sortMap[sort] || { updatedAt: 'desc' }

    // Fetch filtered courses
    const courses = await db.course.findMany({
      where,
      include: {
        modules: {
          include: {
            lessons: { select: { id: true, duration: true, type: true } },
          },
          orderBy: { order: 'asc' },
        },
        enrollments: {
          select: {
            id: true,
            progress: true,
            enrolledAt: true,
            userId: true,
          },
          orderBy: { enrolledAt: 'desc' },
        },
        quizzes: {
          select: { id: true, title: true, type: true },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy,
    })

    // Fetch ALL courses for summary (unfiltered by status/category/level/search)
    const allCourses = await db.course.findMany({
      where: baseWhere,
      include: {
        enrollments: {
          select: { id: true, progress: true, enrolledAt: true },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    })

    // Calculate analytics for each course
    const coursesWithAnalytics = courses.map((course) => {
      const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0)
      const totalDuration = course.modules.reduce(
        (acc, m) => acc + m.lessons.reduce((la, l) => la + l.duration, 0),
        0
      )
      const avgProgress = course.enrollments.length > 0
        ? Math.round(course.enrollments.reduce((acc, e) => acc + e.progress, 0) / course.enrollments.length)
        : 0
      const completionRate = course.enrollments.length > 0
        ? Math.round((course.enrollments.filter((e) => e.progress >= 100).length / course.enrollments.length) * 100)
        : 0

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const recentEnrollments = course.enrollments.filter(
        (e) => new Date(e.enrolledAt) >= sevenDaysAgo
      ).length

      return {
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
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        modules: course.modules.map((m) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          order: m.order,
          lessonCount: m.lessons.length,
          totalDuration: m.lessons.reduce((acc, l) => acc + l.duration, 0),
        })),
        quizzes: course.quizzes,
        analytics: {
          totalEnrollments: course._count.enrollments,
          recentEnrollments,
          avgProgress,
          completionRate,
          totalLessons,
          totalDuration,
          totalRevenue: course.price * course._count.enrollments,
        },
      }
    })

    // Build summary from ALL courses (not filtered)
    const totalCourses = allCourses.length
    const nonArchivedCourses = allCourses.filter((c) => !c.isArchived)
    const publishedCourses = nonArchivedCourses.filter((c) => c.isPublished).length
    const draftCourses = nonArchivedCourses.filter((c) => !c.isPublished).length
    const archivedCourses = allCourses.filter((c) => c.isArchived).length
    const totalStudents = allCourses.reduce((acc, c) => acc + c._count.enrollments, 0)
    const totalRevenue = allCourses.reduce((acc, c) => acc + (c.price * c._count.enrollments), 0)
    const avgRating = allCourses.length > 0
      ? (allCourses.reduce((acc, c) => acc + c.rating, 0) / allCourses.length).toFixed(1)
      : '0.0'
    const avgCompletionRate = allCourses.reduce((acc, c) => {
      if (c.enrollments.length === 0) return acc
      const rate = Math.round(
        (c.enrollments.filter((e) => e.progress >= 100).length / c.enrollments.length) * 100
      )
      return acc + rate
    }, 0)
    const avgCompletionDisplay = allCourses.filter((c) => c.enrollments.length > 0).length > 0
      ? Math.round(avgCompletionRate / allCourses.filter((c) => c.enrollments.length > 0).length)
      : 0

    return NextResponse.json({
      courses: coursesWithAnalytics,
      summary: {
        totalCourses,
        publishedCourses,
        draftCourses,
        archivedCourses,
        totalStudents,
        totalRevenue,
        avgRating,
        avgCompletionRate: avgCompletionDisplay,
      },
    })
  } catch (error) {
    console.error('Error fetching instructor courses:', error)
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 })
  }
}

// POST /api/instructor/courses - Create a new course
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { instructorId, title, description, category, level, language, price, thumbnail } = body

    if (!instructorId || !title || !description || !category) {
      return NextResponse.json(
        { error: 'Instructor ID, title, description, and category are required' },
        { status: 400 }
      )
    }

    const course = await db.course.create({
      data: {
        title,
        description,
        category,
        level: level || 'beginner',
        language: language || 'en',
        price: price || 0,
        thumbnail: thumbnail || null,
        isPublished: false,
        instructorId,
      },
      include: {
        modules: true,
        _count: { select: { enrollments: true } },
      },
    })

    return NextResponse.json({ course, message: 'Course created successfully' }, { status: 201 })
  } catch (error) {
    console.error('Error creating course:', error)
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
  }
}
