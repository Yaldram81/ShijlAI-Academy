import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim().toLowerCase() || ''
  const scope = searchParams.get('scope') || 'public' // public, student, instructor, admin
  const userId = searchParams.get('userId') || ''
  const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 10)

  if (!q || q.length < 1) {
    return NextResponse.json({ results: {} })
  }

  const searchTerms = q.split(/\s+/).filter(Boolean)
  const results: Record<string, any[]> = {}

  try {
    // ─── PUBLIC SCOPE ───
    // Searches courses, instructors, blog posts, categories
    if (scope === 'public') {
      // Search courses
      const courses = await db.course.findMany({
        where: {
          isPublished: true,
          isArchived: false,
          OR: searchTerms.flatMap(term => [
            { title: { contains: term } },
            { description: { contains: term } },
            { category: { contains: term } },
            { tags: { contains: term } },
          ]),
        },
        select: {
          id: true, title: true, category: true, level: true,
          price: true, rating: true, enrollmentCount: true,
          thumbnail: true, language: true, estimatedDuration: true,
          instructor: { select: { name: true, avatar: true } },
        },
        take: limit,
        orderBy: { enrollmentCount: 'desc' },
      })
      results.courses = courses

      // Search instructors
      const instructors = await db.user.findMany({
        where: {
          role: 'instructor',
          status: 'active',
          OR: searchTerms.flatMap(term => [
            { name: { contains: term } },
            { bio: { contains: term } },
          ]),
        },
        select: {
          id: true, name: true, avatar: true, bio: true,
          instructorProfile: { select: { headline: true, expertise: true } },
          coursesCreated: {
            where: { isPublished: true },
            select: { id: true, rating: true },
            take: 1,
            orderBy: { rating: 'desc' },
          },
          _count: { select: { coursesCreated: { where: { isPublished: true } } } },
        },
        take: limit,
      })
      results.instructors = instructors

      // Search blog posts
      const blogs = await db.blogPost.findMany({
        where: {
          status: 'published',
          OR: searchTerms.flatMap(term => [
            { title: { contains: term } },
            { excerpt: { contains: term } },
            { tags: { contains: term } },
            { category: { contains: term } },
          ]),
        },
        select: {
          id: true, title: true, slug: true, excerpt: true,
          category: true, tags: true, coverImage: true, gradient: true,
          authorName: true, authorAvatar: true, createdAt: true,
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
      results.blogs = blogs

      // Search categories/subjects
      const allCategories = await db.course.findMany({
        where: {
          isPublished: true,
          OR: searchTerms.map(term => ({ category: { contains: term } })),
        },
        select: { category: true, _count: { select: { enrollments: true } } },
        distinct: ['category'],
        take: limit,
      })
      results.categories = allCategories.filter(c => c.category)
    }

    // ─── STUDENT SCOPE ───
    // Searches enrolled courses, assignments, Q&A, schedule, community
    if (scope === 'student' && userId) {
      // Enrolled courses
      const enrollments = await db.enrollment.findMany({
        where: {
          userId,
          course: {
            OR: searchTerms.flatMap(term => [
              { title: { contains: term } },
              { description: { contains: term } },
              { category: { contains: term } },
              { tags: { contains: term } },
            ]),
          },
        },
        select: {
          id: true, progress: true, status: true,
          course: {
            select: {
              id: true, title: true, category: true, thumbnail: true,
              rating: true, instructor: { select: { name: true } },
            },
          },
        },
        take: limit,
        orderBy: { lastAccessed: 'desc' },
      })
      results.enrolledCourses = enrollments

      // Assignments (via enrolled courses)
      const userEnrollments = await db.enrollment.findMany({
        where: { userId },
        select: { courseId: true },
      })
      const enrolledCourseIds = userEnrollments.map(e => e.courseId)

      if (enrolledCourseIds.length > 0) {
        const assignments = await db.assignment.findMany({
          where: {
            courseId: { in: enrolledCourseIds },
            isPublished: true,
            OR: searchTerms.flatMap(term => [
              { title: { contains: term } },
              { description: { contains: term } },
            ]),
          },
          select: {
            id: true, title: true, type: true, dueDate: true,
            courseId: true,
            course: { select: { title: true } },
            submissions: {
              where: { studentId: userId },
              select: { id: true, status: true, score: true },
              take: 1,
            },
          },
          take: limit,
          orderBy: { dueDate: 'asc' },
        })
        results.assignments = assignments

        // Q&A Questions
        const qaQuestions = await db.qAQuestion.findMany({
          where: {
            courseId: { in: enrolledCourseIds },
            OR: searchTerms.flatMap(term => [
              { question: { contains: term } },
            ]),
          },
          select: {
            id: true, question: true, isAnswered: true, upvotes: true, createdAt: true,
            course: { select: { id: true, title: true } },
            user: { select: { name: true, avatar: true } },
            _count: { select: { answers: true } },
          },
          take: limit,
          orderBy: { createdAt: 'desc' },
        })
        results.qaQuestions = qaQuestions
      }

      // Schedule events
      const scheduleEvents = await db.scheduleEvent.findMany({
        where: {
          userId,
          OR: searchTerms.flatMap(term => [
            { title: { contains: term } },
            { description: { contains: term } },
          ]),
        },
        select: {
          id: true, title: true, type: true, startDate: true, endDate: true,
        },
        take: limit,
        orderBy: { startDate: 'asc' },
      })
      results.schedule = scheduleEvents

      // Tutor sessions
      const tutorSessions = await db.tutorSession.findMany({
        where: {
          userId,
          isArchived: false,
          OR: searchTerms.flatMap(term => [
            { title: { contains: term } },
            { context: { contains: term } },
          ]),
        },
        select: {
          id: true, title: true, context: true, language: true, createdAt: true,
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
      results.tutorSessions = tutorSessions

      // Community discussion posts
      const discussionPosts = await db.discussionPost.findMany({
        where: {
          OR: searchTerms.flatMap(term => [
            { title: { contains: term } },
            { content: { contains: term } },
          ]),
        },
        select: {
          id: true, title: true, createdAt: true,
          author: { select: { name: true, avatar: true } },
          _count: { select: { replies: true, upvotes: true } },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
      results.communityPosts = discussionPosts

      // Explore courses (published courses not enrolled)
      const exploreCourses = await db.course.findMany({
        where: {
          isPublished: true,
          isArchived: false,
          id: { notIn: enrolledCourseIds },
          OR: searchTerms.flatMap(term => [
            { title: { contains: term } },
            { description: { contains: term } },
            { category: { contains: term } },
            { tags: { contains: term } },
          ]),
        },
        select: {
          id: true, title: true, category: true, level: true,
          price: true, rating: true, enrollmentCount: true, thumbnail: true,
          instructor: { select: { name: true, avatar: true } },
        },
        take: limit,
        orderBy: { enrollmentCount: 'desc' },
      })
      results.exploreCourses = exploreCourses
    }

    // ─── INSTRUCTOR SCOPE ───
    // Searches instructor's courses, students, Q&A, assignments, revenue
    if (scope === 'instructor' && userId) {
      // Instructor's courses
      const courses = await db.course.findMany({
        where: {
          instructorId: userId,
          OR: searchTerms.flatMap(term => [
            { title: { contains: term } },
            { description: { contains: term } },
            { category: { contains: term } },
            { tags: { contains: term } },
          ]),
        },
        select: {
          id: true, title: true, category: true, level: true,
          isPublished: true, reviewStatus: true,
          enrollmentCount: true, rating: true, price: true, thumbnail: true,
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
      results.courses = courses

      // Students (via enrollments in instructor's courses)
      const instructorCourseIds = (await db.course.findMany({
        where: { instructorId: userId },
        select: { id: true },
      })).map(c => c.id)

      if (instructorCourseIds.length > 0) {
        const studentEnrollments = await db.enrollment.findMany({
          where: {
            courseId: { in: instructorCourseIds },
            user: {
              OR: searchTerms.flatMap(term => [
                { name: { contains: term } },
                { email: { contains: term } },
              ]),
            },
          },
          select: {
            id: true, progress: true, enrolledAt: true,
            user: {
              select: {
                id: true, name: true, email: true, avatar: true,
                xp: true, level: true, streak: true,
              },
            },
            course: { select: { id: true, title: true } },
          },
          take: limit,
          orderBy: { enrolledAt: 'desc' },
        })
        results.students = studentEnrollments

        // Q&A questions for instructor's courses
        const qaQuestions = await db.qAQuestion.findMany({
          where: {
            courseId: { in: instructorCourseIds },
            OR: searchTerms.flatMap(term => [
              { question: { contains: term } },
            ]),
          },
          select: {
            id: true, question: true, isAnswered: true, upvotes: true, createdAt: true,
            course: { select: { id: true, title: true } },
            user: { select: { name: true, avatar: true } },
            _count: { select: { answers: true } },
          },
          take: limit,
          orderBy: { createdAt: 'desc' },
        })
        results.qaQuestions = qaQuestions

        // Assignments
        const assignments = await db.assignment.findMany({
          where: {
            courseId: { in: instructorCourseIds },
            OR: searchTerms.flatMap(term => [
              { title: { contains: term } },
              { description: { contains: term } },
            ]),
          },
          select: {
            id: true, title: true, type: true, dueDate: true, maxScore: true,
            course: { select: { id: true, title: true } },
            _count: { select: { submissions: true } },
          },
          take: limit,
          orderBy: { dueDate: 'asc' },
        })
        results.assignments = assignments

        // Submissions needing grading
        const submissions = await db.submission.findMany({
          where: {
            assignment: { courseId: { in: instructorCourseIds } },
            status: 'submitted',
            student: {
              OR: searchTerms.flatMap(term => [
                { name: { contains: term } },
              ]),
            },
          },
          select: {
            id: true, content: true, submittedAt: true, attempt: true,
            assignment: { select: { id: true, title: true, maxScore: true } },
            student: { select: { id: true, name: true, avatar: true } },
          },
          take: limit,
          orderBy: { submittedAt: 'desc' },
        })
        results.submissions = submissions
      }

      // Revenue / Transactions
      const transactions = await db.transaction.findMany({
        where: {
          instructorId: userId,
          OR: searchTerms.flatMap(term => [
            { description: { contains: term } },
            { invoiceNumber: { contains: term } },
          ]),
        },
        select: {
          id: true, type: true, amount: true, currency: true,
          status: true, description: true, invoiceNumber: true, createdAt: true,
          course: { select: { id: true, title: true } },
          student: { select: { id: true, name: true } },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
      results.transactions = transactions

      // AI Templates
      const aiTemplates = await db.aITemplate.findMany({
        where: {
          instructorId: userId,
          OR: searchTerms.flatMap(term => [
            { name: { contains: term } },
            { description: { contains: term } },
          ]),
        },
        select: {
          id: true, name: true, toolType: true, description: true, isDefault: true,
        },
        take: limit,
      })
      results.aiTemplates = aiTemplates
    }

    // ─── ADMIN SCOPE ───
    // Searches users, instructors, courses, blog posts, transactions, applications
    if (scope === 'admin') {
      // Users
      const users = await db.user.findMany({
        where: {
          OR: searchTerms.flatMap(term => [
            { name: { contains: term } },
            { email: { contains: term } },
            { role: { contains: term } },
          ]),
        },
        select: {
          id: true, name: true, email: true, role: true, status: true,
          avatar: true, xp: true, level: true, createdAt: true,
          _count: { select: { enrollments: true } },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
      results.users = users

      // Instructors (with course counts)
      const instructors = await db.user.findMany({
        where: {
          role: 'instructor',
          OR: searchTerms.flatMap(term => [
            { name: { contains: term } },
            { email: { contains: term } },
            { bio: { contains: term } },
          ]),
        },
        select: {
          id: true, name: true, email: true, avatar: true, status: true,
          instructorProfile: { select: { headline: true, expertise: true, applicationStatus: true } },
          _count: { select: { coursesCreated: true } },
        },
        take: limit,
      })
      results.instructors = instructors

      // All courses
      const courses = await db.course.findMany({
        where: {
          OR: searchTerms.flatMap(term => [
            { title: { contains: term } },
            { description: { contains: term } },
            { category: { contains: term } },
            { reviewStatus: { contains: term } },
          ]),
        },
        select: {
          id: true, title: true, category: true, level: true,
          isPublished: true, reviewStatus: true, enrollmentCount: true,
          rating: true, price: true, featured: true, staffPick: true,
          instructor: { select: { id: true, name: true, avatar: true } },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
      results.courses = courses

      // Blog posts
      const blogs = await db.blogPost.findMany({
        where: {
          OR: searchTerms.flatMap(term => [
            { title: { contains: term } },
            { excerpt: { contains: term } },
            { category: { contains: term } },
            { tags: { contains: term } },
            { authorName: { contains: term } },
          ]),
        },
        select: {
          id: true, title: true, slug: true, category: true, status: true,
          authorName: true, createdAt: true,
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
      results.blogs = blogs

      // Transactions
      const transactions = await db.transaction.findMany({
        where: {
          OR: searchTerms.flatMap(term => [
            { description: { contains: term } },
            { invoiceNumber: { contains: term } },
            { type: { contains: term } },
            { status: { contains: term } },
          ]),
        },
        select: {
          id: true, type: true, amount: true, currency: true,
          status: true, description: true, invoiceNumber: true, createdAt: true,
          student: { select: { id: true, name: true } },
          instructor: { select: { id: true, name: true } },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
      results.transactions = transactions

      // Instructor applications
      const applications = await db.instructorApplication.findMany({
        where: {
          OR: searchTerms.flatMap(term => [
            { fullName: { contains: term } },
            { email: { contains: term } },
            { expertise: { contains: term } },
            { applicationCode: { contains: term } },
            { status: { contains: term } },
          ]),
        },
        select: {
          id: true, fullName: true, email: true, expertise: true,
          status: true, applicationCode: true, createdAt: true,
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
      results.applications = applications

      // Activity logs
      const activityLogs = await db.activityLog.findMany({
        where: {
          OR: searchTerms.flatMap(term => [
            { title: { contains: term } },
            { description: { contains: term } },
            { action: { contains: term } },
            { targetType: { contains: term } },
            { targetName: { contains: term } },
          ]),
        },
        select: {
          id: true, type: true, title: true, action: true,
          targetName: true, targetType: true, severity: true,
          createdAt: true,
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      })
      results.activityLogs = activityLogs
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('[Search API Error]', error)
    return NextResponse.json({ results: {}, error: 'Search failed' }, { status: 500 })
  }
}
