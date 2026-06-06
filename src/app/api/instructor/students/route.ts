import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/students - Get all students enrolled in instructor's courses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')
    const search = searchParams.get('search')
    const courseId = searchParams.get('courseId')
    const status = searchParams.get('status') // active, completed, dropped
    const sortBy = searchParams.get('sortBy') || 'enrolledAt' // name, progress, lastActive, enrolledAt
    const sortOrder = searchParams.get('sortOrder') || 'desc' // asc, desc
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    // Verify instructor exists
    const instructor = await db.user.findUnique({
      where: { id: instructorId },
      select: { id: true, role: true },
    })
    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
    }

    // Get all courses for this instructor
    const instructorCourses = await db.course.findMany({
      where: { instructorId },
      select: { id: true, title: true, category: true },
    })

    if (instructorCourses.length === 0) {
      return NextResponse.json({
        students: [],
        summary: {
          totalStudents: 0,
          activeStudents: 0,
          completedStudents: 0,
          avgProgress: 0,
          topCourse: null,
        },
        pagination: { total: 0, page, limit, totalPages: 0 },
      })
    }

    const courseIds = instructorCourses.map((c) => c.id)

    // Build enrollment where clause
    const enrollmentWhere: Record<string, unknown> = {
      courseId: { in: courseIds },
    }

    if (courseId) {
      enrollmentWhere.courseId = courseId
    }

    // Fetch all relevant enrollments with user and course data
    const enrollments = await db.enrollment.findMany({
      where: enrollmentWhere,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            lastActiveAt: true,
            xp: true,
            level: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
        lessonProgress: {
          select: {
            id: true,
            status: true,
            timeSpent: true,
            completedAt: true,
            lesson: {
              select: { id: true, duration: true },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    })

    // Group enrollments by student
    const studentMap = new Map<string, {
      id: string
      name: string
      email: string
      avatar: string | null
      lastActiveAt: Date
      xp: number
      level: number
      enrolledCourses: Array<{
        courseId: string
        courseTitle: string
        category: string
        progress: number
        enrolledAt: Date
        lastAccessed: Date
        completedAt: Date | null
      }>
    }>()

    for (const enrollment of enrollments) {
      const userId = enrollment.user.id
      if (!studentMap.has(userId)) {
        studentMap.set(userId, {
          id: userId,
          name: enrollment.user.name,
          email: enrollment.user.email,
          avatar: enrollment.user.avatar,
          lastActiveAt: enrollment.user.lastActiveAt,
          xp: enrollment.user.xp,
          level: enrollment.user.level,
          enrolledCourses: [],
        })
      }

      const student = studentMap.get(userId)!
      student.enrolledCourses.push({
        courseId: enrollment.course.id,
        courseTitle: enrollment.course.title,
        category: enrollment.course.category,
        progress: enrollment.progress,
        enrolledAt: enrollment.enrolledAt,
        lastAccessed: enrollment.lastAccessed,
        completedAt: enrollment.completedAt,
      })
    }

    // Compute per-student metrics
    let students = Array.from(studentMap.values()).map((student) => {
      const totalCoursesEnrolled = student.enrolledCourses.length
      const completedCourses = student.enrolledCourses.filter((c) => c.completedAt !== null).length
      const overallProgress = totalCoursesEnrolled > 0
        ? Math.round(student.enrolledCourses.reduce((acc, c) => acc + c.progress, 0) / totalCoursesEnrolled)
        : 0
      const lastActiveDate = student.enrolledCourses.reduce(
        (max, c) => (c.lastAccessed > max ? c.lastAccessed : max),
        student.enrolledCourses[0]?.lastAccessed ?? new Date()
      )

      // Determine student status
      let studentStatus: string
      if (completedCourses === totalCoursesEnrolled && totalCoursesEnrolled > 0) {
        studentStatus = 'completed'
      } else {
        // Check if active: lastAccessed within 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const isActive = student.enrolledCourses.some((c) => c.lastAccessed >= thirtyDaysAgo)
        studentStatus = isActive ? 'active' : 'dropped'
      }

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        avatar: student.avatar,
        enrolledCourses: student.enrolledCourses.map((c) => ({
          courseId: c.courseId,
          courseTitle: c.courseTitle,
          progress: c.progress,
          enrolledAt: c.enrolledAt,
          lastAccessed: c.lastAccessed,
          completedAt: c.completedAt,
        })),
        overallProgress,
        totalCoursesEnrolled,
        completedCourses,
        lastActiveDate,
        status: studentStatus,
        xp: student.xp,
        level: student.level,
      }
    })

    // Filter by status
    if (status) {
      students = students.filter((s) => s.status === status)
    }

    // Filter by search
    if (search) {
      const searchLower = search.toLowerCase()
      students = students.filter(
        (s) =>
          s.name.toLowerCase().includes(searchLower) ||
          s.email.toLowerCase().includes(searchLower) ||
          s.enrolledCourses.some((c) => c.courseTitle.toLowerCase().includes(searchLower))
      )
    }

    // Filter by courseId (only students enrolled in that specific course)
    if (courseId) {
      students = students.filter((s) =>
        s.enrolledCourses.some((c) => c.courseId === courseId)
      )
    }

    // Sort
    students.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'progress':
          comparison = a.overallProgress - b.overallProgress
          break
        case 'lastActive':
          comparison = new Date(a.lastActiveDate).getTime() - new Date(b.lastActiveDate).getTime()
          break
        case 'enrolledAt':
        default: {
          const aEarliest = a.enrolledCourses.reduce(
            (min, c) => (c.enrolledAt < min ? c.enrolledAt : min),
            a.enrolledCourses[0]?.enrolledAt ?? new Date()
          )
          const bEarliest = b.enrolledCourses.reduce(
            (min, c) => (c.enrolledAt < min ? c.enrolledAt : min),
            b.enrolledCourses[0]?.enrolledAt ?? new Date()
          )
          comparison = new Date(aEarliest).getTime() - new Date(bEarliest).getTime()
          break
        }
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    // Pagination
    const total = students.length
    const totalPages = Math.ceil(total / limit)
    const paginatedStudents = students.slice((page - 1) * limit, page * limit)

    // Summary (computed from ALL students, not filtered)
    const allStudents = Array.from(studentMap.values()).map((student) => {
      const totalCoursesEnrolled = student.enrolledCourses.length
      const completedCourses = student.enrolledCourses.filter((c) => c.completedAt !== null).length
      const overallProgress = totalCoursesEnrolled > 0
        ? Math.round(student.enrolledCourses.reduce((acc, c) => acc + c.progress, 0) / totalCoursesEnrolled)
        : 0
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const isActive = student.enrolledCourses.some((c) => c.lastAccessed >= thirtyDaysAgo)
      const allCompleted = completedCourses === totalCoursesEnrolled && totalCoursesEnrolled > 0

      return { overallProgress, isActive, allCompleted }
    })

    const totalStudentsCount = allStudents.length
    const activeStudentsCount = allStudents.filter((s) => s.isActive).length
    const completedStudentsCount = allStudents.filter((s) => s.allCompleted).length
    const avgProgress = totalStudentsCount > 0
      ? Math.round(allStudents.reduce((acc, s) => acc + s.overallProgress, 0) / totalStudentsCount)
      : 0

    // Top course: most enrolled
    const courseEnrollmentCounts = new Map<string, { title: string; count: number }>()
    for (const enrollment of enrollments) {
      const existing = courseEnrollmentCounts.get(enrollment.courseId)
      if (existing) {
        existing.count++
      } else {
        courseEnrollmentCounts.set(enrollment.courseId, {
          title: enrollment.course.title,
          count: 1,
        })
      }
    }
    let topCourse: { courseId: string; title: string; enrollmentCount: number } | null = null
    for (const [courseIdKey, data] of courseEnrollmentCounts) {
      if (!topCourse || data.count > topCourse.enrollmentCount) {
        topCourse = { courseId: courseIdKey, title: data.title, enrollmentCount: data.count }
      }
    }

    return NextResponse.json({
      students: paginatedStudents,
      summary: {
        totalStudents: totalStudentsCount,
        activeStudents: activeStudentsCount,
        completedStudents: completedStudentsCount,
        avgProgress,
        topCourse,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching instructor students:', error)
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
  }
}
