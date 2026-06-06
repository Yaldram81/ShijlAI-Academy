import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/quizzes - Get all quizzes for the instructor's courses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')
    const search = searchParams.get('search')
    const courseId = searchParams.get('courseId')
    const type = searchParams.get('type') // practice, assessment, diagnostic, certification
    const status = searchParams.get('status') // published, draft
    const sortBy = searchParams.get('sortBy') || 'createdAt' // createdAt, title, type, passingScore
    const sortOrder = searchParams.get('sortOrder') || 'desc' // asc, desc

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
      select: { id: true, title: true },
    })

    if (instructorCourses.length === 0) {
      return NextResponse.json({
        quizzes: [],
        summary: {
          totalQuizzes: 0,
          publishedCount: 0,
          draftCount: 0,
          byType: {
            practice: 0,
            assessment: 0,
            diagnostic: 0,
            certification: 0,
          },
          avgPassRate: 0,
          totalAttempts: 0,
        },
      })
    }

    const courseIds = instructorCourses.map((c) => c.id)

    // Build where clause
    const where: Record<string, unknown> = {
      courseId: { in: courseIds },
    }

    if (courseId) {
      // Verify the course belongs to the instructor
      if (!courseIds.includes(courseId)) {
        return NextResponse.json({ error: 'Course not found or does not belong to this instructor' }, { status: 403 })
      }
      where.courseId = courseId
    }

    if (type) {
      where.type = type
    }

    if (status === 'published') {
      where.isPublished = true
    } else if (status === 'draft') {
      where.isPublished = false
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    // Parse sort
    const sortMap: Record<string, Record<string, string>> = {
      createdAt: { createdAt: sortOrder },
      title: { title: sortOrder },
      type: { type: sortOrder },
      passingScore: { passingScore: sortOrder },
      updatedAt: { updatedAt: sortOrder },
    }
    const orderBy = sortMap[sortBy] || { createdAt: 'desc' }

    // Fetch quizzes with question count and attempt count (no full attempt records)
    const quizzes = await db.quiz.findMany({
      where,
      include: {
        course: {
          select: { id: true, title: true },
        },
        _count: {
          select: { questions: true, attempts: true },
        },
      },
      orderBy,
    })

    // Fetch aggregated attempt stats per quiz in a single query
    const quizIds = quizzes.map(q => q.id)
    const attemptStats = await db.quizAttempt.groupBy({
      by: ['quizId'],
      where: {
        quizId: { in: quizIds },
        completedAt: { not: null },
      },
      _count: true,
      _sum: { percentage: true },
    })

    const passedCount = await db.quizAttempt.groupBy({
      by: ['quizId'],
      where: {
        quizId: { in: quizIds },
        completedAt: { not: null },
        passed: true,
      },
      _count: true,
    })

    const attemptStatsMap = new Map(quizIds.map(qid => {
      const stat = attemptStats.find(s => s.quizId === qid)
      const passed = passedCount.find(p => p.quizId === qid)
      const completedAttempts = stat?._count || 0
      const passRate = completedAttempts > 0
        ? Math.round(((passed?._count || 0) / completedAttempts) * 100)
        : 0
      const avgScore = completedAttempts > 0
        ? Math.round((stat?._sum.percentage || 0) / completedAttempts)
        : 0
      return [qid, { completedAttempts, passRate, avgScore }]
    }))

    // Format quizzes with attempt stats
    const formattedQuizzes = quizzes.map((quiz) => {
      const stats = attemptStatsMap.get(quiz.id) || { completedAttempts: 0, passRate: 0, avgScore: 0 }

      return {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        type: quiz.type,
        timeLimit: quiz.timeLimit,
        passingScore: quiz.passingScore,
        maxAttempts: quiz.maxAttempts,
        isPublished: quiz.isPublished,
        createdAt: quiz.createdAt,
        updatedAt: quiz.updatedAt,
        course: {
          id: quiz.course.id,
          title: quiz.course.title,
        },
        questionCount: quiz._count.questions,
        attemptStats: {
          totalAttempts: quiz._count.attempts,
          completedAttempts: stats.completedAttempts,
          passRate: stats.passRate,
          avgScore: stats.avgScore,
        },
      }
    })

    // Build summary from ALL quizzes (not filtered) using aggregation
    const allQuizzes = await db.quiz.findMany({
      where: { courseId: { in: courseIds } },
      select: {
        type: true,
        isPublished: true,
        _count: { select: { attempts: true } },
      },
    })

    const totalQuizzes = allQuizzes.length
    const publishedCount = allQuizzes.filter((q) => q.isPublished).length
    const draftCount = allQuizzes.filter((q) => !q.isPublished).length

    const byType = {
      practice: allQuizzes.filter((q) => q.type === 'practice').length,
      assessment: allQuizzes.filter((q) => q.type === 'assessment').length,
      diagnostic: allQuizzes.filter((q) => q.type === 'diagnostic').length,
      certification: allQuizzes.filter((q) => q.type === 'certification').length,
    }

    // Calculate overall pass rate and total attempts via aggregation
    const totalAttemptStats = await db.quizAttempt.aggregate({
      _count: true,
      _sum: { percentage: true },
      where: {
        quiz: { courseId: { in: courseIds } },
        completedAt: { not: null },
      },
    })

    const totalPassedStats = await db.quizAttempt.aggregate({
      _count: true,
      where: {
        quiz: { courseId: { in: courseIds } },
        completedAt: { not: null },
        passed: true,
      },
    })

    const totalAttempts = totalAttemptStats._count
    const avgPassRate = totalAttempts > 0
      ? Math.round((totalPassedStats._count / totalAttempts) * 100)
      : 0

    return NextResponse.json({
      quizzes: formattedQuizzes,
      summary: {
        totalQuizzes,
        publishedCount,
        draftCount,
        byType,
        avgPassRate,
        totalAttempts,
      },
    })
  } catch (error) {
    console.error('Error fetching instructor quizzes:', error)
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 })
  }
}

// POST /api/instructor/quizzes - Create a new quiz
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { instructorId, title, description, type, courseId, moduleId, timeLimit, passingScore, maxAttempts, questions } = body

    if (!instructorId || !title || !courseId) {
      return NextResponse.json({ error: 'Instructor ID, title, and course ID are required' }, { status: 400 })
    }

    // Verify the course belongs to this instructor
    const course = await db.course.findFirst({
      where: { id: courseId, instructorId },
    })
    if (!course) {
      return NextResponse.json({ error: 'Course not found or does not belong to this instructor' }, { status: 403 })
    }

    // Create the quiz
    const quiz = await db.quiz.create({
      data: {
        title,
        description: description || null,
        type: type || 'practice',
        courseId,
        moduleId: moduleId || null,
        timeLimit: timeLimit || 0,
        passingScore: passingScore || 70,
        maxAttempts: maxAttempts || 0,
        isPublished: false,
      },
    })

    // Create questions if provided
    if (Array.isArray(questions) && questions.length > 0) {
      await db.question.createMany({
        data: questions.map((q: { text: string; type: string; options: string; correctAnswer: string; explanation: string | null; points: number }, i: number) => ({
          quizId: quiz.id,
          text: q.text,
          type: q.type || 'mcq',
          options: q.options || '[]',
          correctAnswer: q.correctAnswer || '',
          explanation: q.explanation || null,
          points: q.points || 10,
          order: i + 1,
        })),
      })
    }

    // Fetch the created quiz with questions count
    const createdQuiz = await db.quiz.findUnique({
      where: { id: quiz.id },
      include: {
        course: { select: { id: true, title: true } },
        _count: { select: { questions: true, attempts: true } },
      },
    })

    return NextResponse.json({
      quiz: {
        id: createdQuiz!.id,
        title: createdQuiz!.title,
        description: createdQuiz!.description,
        type: createdQuiz!.type,
        timeLimit: createdQuiz!.timeLimit,
        passingScore: createdQuiz!.passingScore,
        maxAttempts: createdQuiz!.maxAttempts,
        isPublished: createdQuiz!.isPublished,
        createdAt: createdQuiz!.createdAt,
        updatedAt: createdQuiz!.updatedAt,
        course: { id: createdQuiz!.course.id, title: createdQuiz!.course.title },
        questionCount: createdQuiz!._count.questions,
        attemptStats: { totalAttempts: 0, completedAttempts: 0, passRate: 0, avgScore: 0 },
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating quiz:', error)
    return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 })
  }
}
