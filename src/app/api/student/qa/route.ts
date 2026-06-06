import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ============================================================
// GET /api/student/qa — Fetch Q&A questions with rich metadata
// ============================================================
// Query params:
//   courseId  (required) — filter questions by course
//   lessonId (optional) — filter questions by lesson within the course
//   userId   (optional) — include upvote state for this user per question & answer
//   page     (optional, default 1)
//   limit    (optional, default 20, max 100)
//
// Returns:
//   questions[]   — paginated questions with answers, upvote counts, user upvote state
//   qaSettings    — instructor QA settings (so student knows if replies are allowed)
//   course        — { id, title }
//   lesson        — { id, title } | null (only when lessonId is provided)
//   pagination    — { page, limit, totalItems, totalPages, hasNext }
// ============================================================

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const courseId = searchParams.get('courseId')
    const lessonId = searchParams.get('lessonId') || undefined
    const userId = searchParams.get('userId') || undefined
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20))

    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId is required' },
        { status: 400 }
      )
    }

    // Build where clause
    const where: Record<string, unknown> = { courseId }
    if (lessonId) {
      where.lessonId = lessonId
    }

    // Fetch total count for pagination
    const totalItems = await db.qAQuestion.count({ where })
    const totalPages = Math.max(1, Math.ceil(totalItems / limit))
    const hasNext = page < totalPages
    const skip = (page - 1) * limit

    // Fetch questions with answers and user info
    const questions = await db.qAQuestion.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
        answers: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [
        { isPinned: 'desc' },
        { upvotes: 'desc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limit,
    })

    // Collect IDs for batch queries
    const questionIds = questions.map((q) => q.id)
    const answerIds = questions.flatMap((q) => q.answers.map((a) => a.id))

    // Batch fetch answer upvote counts
    const answerUpvoteCounts = new Map<string, number>()
    if (answerIds.length > 0) {
      const upvoteCounts = await db.qAAnswerUpvote.groupBy({
        by: ['answerId'],
        where: { answerId: { in: answerIds } },
        _count: { id: true },
      })
      upvoteCounts.forEach((uc) => {
        answerUpvoteCounts.set(uc.answerId, uc._count.id)
      })
    }

    // Batch fetch user's upvote state for questions
    const userQuestionUpvoteSet = new Set<string>()
    const userAnswerUpvoteSet = new Set<string>()

    if (userId) {
      if (questionIds.length > 0) {
        const userQUpvotes = await db.qAUpvote.findMany({
          where: { userId, questionId: { in: questionIds } },
          select: { questionId: true },
        })
        userQUpvotes.forEach((u) => userQuestionUpvoteSet.add(u.questionId))
      }

      if (answerIds.length > 0) {
        const userAUpvotes = await db.qAAnswerUpvote.findMany({
          where: { userId, answerId: { in: answerIds } },
          select: { answerId: true },
        })
        userAUpvotes.forEach((u) => userAnswerUpvoteSet.add(u.answerId))
      }
    }

    // Format questions with all enriched data
    const formatted = questions.map((q) => ({
      id: q.id,
      userId: q.userId,
      userName: q.user.name || 'Anonymous',
      userAvatar: q.user.avatar,
      lessonId: q.lessonId,
      question: q.question,
      isAnswered: q.isAnswered,
      isPinned: q.isPinned,
      isFlagged: q.isFlagged,
      upvotes: q.upvotes,
      hasUpvoted: userId ? userQuestionUpvoteSet.has(q.id) : false,
      aiDraftAnswer: q.aiDraftAnswer,
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
      answers: q.answers.map((a) => ({
        id: a.id,
        questionId: a.questionId,
        userId: a.userId,
        userName: a.user.name || 'Anonymous',
        userAvatar: a.user.avatar,
        content: a.content,
        isAiGenerated: a.isAiGenerated,
        isInstructorAnswer: a.isInstructorAnswer,
        isEdited: a.isEdited,
        isAccepted: a.isAccepted,
        upvoteCount: answerUpvoteCounts.get(a.id) ?? 0,
        hasUpvoted: userId ? userAnswerUpvoteSet.has(a.id) : false,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      })),
    }))

    // Fetch course info
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, instructorId: true },
    })

    // Fetch lesson info if lessonId provided
    let lesson: { id: string; title: string } | null = null
    if (lessonId) {
      const lessonData = await db.lesson.findUnique({
        where: { id: lessonId },
        select: { id: true, title: true },
      })
      if (lessonData) {
        lesson = { id: lessonData.id, title: lessonData.title }
      }
    }

    // Fetch QA settings for the instructor
    let qaSettings = null
    if (course?.instructorId) {
      qaSettings = await db.qASettings.findUnique({
        where: { instructorId: course.instructorId },
        select: {
          id: true,
          autoAnswer: true,
          emailNotifications: true,
          allowStudentReplies: true,
          requireApproval: true,
          maxQuestionsPerDay: true,
        },
      })
    }

    return NextResponse.json({
      questions: formatted,
      qaSettings,
      course: course ? { id: course.id, title: course.title } : null,
      lesson,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNext,
      },
    })
  } catch (error) {
    console.error('Error fetching student Q&A:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Q&A' },
      { status: 500 }
    )
  }
}

// ============================================================
// POST /api/student/qa — Actions for student Q&A interaction
// ============================================================
// Actions:
//   upvote         — { questionId, userId } Toggle question upvote (deduplication)
//   upvote-answer  — { answerId, userId }   Toggle answer upvote (deduplication)
//   reply          — { questionId, content, userId, courseId } Post a reply (checks allowStudentReplies)
//   create         — { userId, courseId, lessonId?, question } Create question (rate limited by maxQuestionsPerDay)
//   accept-answer  — { answerId, userId }   Accept an answer (only question owner)
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body as { action?: string }

    // ---- Action: Toggle question upvote (deduplication) ----
    if (action === 'upvote') {
      const { questionId, userId } = body as {
        questionId?: string
        userId?: string
      }

      if (!questionId || !userId) {
        return NextResponse.json(
          { error: 'questionId and userId are required' },
          { status: 400 }
        )
      }

      // Check if question exists
      const question = await db.qAQuestion.findUnique({
        where: { id: questionId },
        select: { id: true, upvotes: true },
      })
      if (!question) {
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 }
        )
      }

      // Check for existing upvote (deduplication)
      const existingUpvote = await db.qAUpvote.findUnique({
        where: {
          questionId_userId: { questionId, userId },
        },
      })

      if (existingUpvote) {
        // Remove upvote and decrement count
        await db.$transaction([
          db.qAUpvote.delete({
            where: { id: existingUpvote.id },
          }),
          db.qAQuestion.update({
            where: { id: questionId },
            data: { upvotes: { decrement: 1 } },
          }),
        ])

        const updated = await db.qAQuestion.findUnique({
          where: { id: questionId },
          select: { upvotes: true },
        })

        return NextResponse.json({
          upvotes: updated?.upvotes ?? 0,
          hasUpvoted: false,
        })
      } else {
        // Create upvote and increment count
        await db.$transaction([
          db.qAUpvote.create({
            data: { questionId, userId },
          }),
          db.qAQuestion.update({
            where: { id: questionId },
            data: { upvotes: { increment: 1 } },
          }),
        ])

        const updated = await db.qAQuestion.findUnique({
          where: { id: questionId },
          select: { upvotes: true },
        })

        return NextResponse.json({
          upvotes: updated?.upvotes ?? 1,
          hasUpvoted: true,
        })
      }
    }

    // ---- Action: Toggle answer upvote (deduplication) ----
    if (action === 'upvote-answer') {
      const { answerId, userId } = body as {
        answerId?: string
        userId?: string
      }

      if (!answerId || !userId) {
        return NextResponse.json(
          { error: 'answerId and userId are required' },
          { status: 400 }
        )
      }

      // Check if answer exists
      const answer = await db.qAAnswer.findUnique({
        where: { id: answerId },
        select: { id: true },
      })
      if (!answer) {
        return NextResponse.json(
          { error: 'Answer not found' },
          { status: 404 }
        )
      }

      // Check for existing upvote (deduplication)
      const existingUpvote = await db.qAAnswerUpvote.findUnique({
        where: {
          answerId_userId: { answerId, userId },
        },
      })

      if (existingUpvote) {
        // Remove upvote
        await db.qAAnswerUpvote.delete({
          where: { id: existingUpvote.id },
        })

        const upvoteCount = await db.qAAnswerUpvote.count({
          where: { answerId },
        })

        return NextResponse.json({
          upvoteCount,
          hasUpvoted: false,
        })
      } else {
        // Create upvote
        await db.qAAnswerUpvote.create({
          data: { answerId, userId },
        })

        const upvoteCount = await db.qAAnswerUpvote.count({
          where: { answerId },
        })

        return NextResponse.json({
          upvoteCount,
          hasUpvoted: true,
        })
      }
    }

    // ---- Action: Reply to a question ----
    if (action === 'reply') {
      const { questionId, content, userId, courseId } = body as {
        questionId?: string
        content?: string
        userId?: string
        courseId?: string
      }

      if (!questionId || !content || !userId || !courseId) {
        return NextResponse.json(
          { error: 'questionId, content, userId, and courseId are required' },
          { status: 400 }
        )
      }

      // Verify the question exists and belongs to the course
      const question = await db.qAQuestion.findUnique({
        where: { id: questionId },
        select: { id: true, courseId: true, userId: true },
      })
      if (!question) {
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 }
        )
      }
      if (question.courseId !== courseId) {
        return NextResponse.json(
          { error: 'Question does not belong to the specified course' },
          { status: 400 }
        )
      }

      // Verify enrollment
      const enrollment = await db.enrollment.findFirst({
        where: { userId, courseId },
      })
      if (!enrollment) {
        return NextResponse.json(
          { error: 'You must be enrolled in this course to reply' },
          { status: 403 }
        )
      }

      // Get course to find instructor
      const course = await db.course.findUnique({
        where: { id: courseId },
        select: { instructorId: true },
      })
      if (!course) {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        )
      }

      // Check QA settings — allowStudentReplies
      const qaSettings = await db.qASettings.findUnique({
        where: { instructorId: course.instructorId },
      })
      if (qaSettings && !qaSettings.allowStudentReplies) {
        return NextResponse.json(
          { error: 'Student replies are not allowed in this course. Only the instructor can answer questions.' },
          { status: 403 }
        )
      }

      // Check if user is the instructor (instructors can always reply)
      const isInstructor = course.instructorId === userId

      // Create the answer
      const newAnswer = await db.qAAnswer.create({
        data: {
          questionId,
          userId,
          content: content.trim(),
          isInstructorAnswer: isInstructor,
        },
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
      })

      // Update question's isAnswered flag
      await db.qAQuestion.update({
        where: { id: questionId },
        data: { isAnswered: true },
      })

      return NextResponse.json({
        answer: {
          id: newAnswer.id,
          questionId: newAnswer.questionId,
          userId: newAnswer.userId,
          userName: newAnswer.user.name || 'Anonymous',
          userAvatar: newAnswer.user.avatar,
          content: newAnswer.content,
          isAiGenerated: newAnswer.isAiGenerated,
          isInstructorAnswer: newAnswer.isInstructorAnswer,
          isEdited: newAnswer.isEdited,
          isAccepted: newAnswer.isAccepted,
          upvoteCount: 0,
          hasUpvoted: false,
          createdAt: newAnswer.createdAt.toISOString(),
          updatedAt: newAnswer.updatedAt.toISOString(),
        },
      })
    }

    // ---- Action: Accept an answer ----
    if (action === 'accept-answer') {
      const { answerId, userId } = body as {
        answerId?: string
        userId?: string
      }

      if (!answerId || !userId) {
        return NextResponse.json(
          { error: 'answerId and userId are required' },
          { status: 400 }
        )
      }

      // Fetch the answer with its question
      const answer = await db.qAAnswer.findUnique({
        where: { id: answerId },
        include: {
          question: {
            select: { id: true, userId: true },
          },
        },
      })
      if (!answer) {
        return NextResponse.json(
          { error: 'Answer not found' },
          { status: 404 }
        )
      }

      // Verify the user is the question owner
      if (answer.question.userId !== userId) {
        return NextResponse.json(
          { error: 'Only the question owner can accept an answer' },
          { status: 403 }
        )
      }

      // Unaccept any previously accepted answers for this question
      await db.qAAnswer.updateMany({
        where: {
          questionId: answer.questionId,
          isAccepted: true,
        },
        data: { isAccepted: false },
      })

      // Accept this answer
      await db.qAAnswer.update({
        where: { id: answerId },
        data: { isAccepted: true },
      })

      return NextResponse.json({
        success: true,
        answerId,
        isAccepted: true,
      })
    }

    // ---- Default action: Create a new question ----
    {
      const { userId, courseId, lessonId, question } = body as {
        userId?: string
        courseId?: string
        lessonId?: string
        question?: string
      }

      if (!userId || !courseId || !question) {
        return NextResponse.json(
          { error: 'userId, courseId, and question are required' },
          { status: 400 }
        )
      }

      // Verify enrollment
      const enrollment = await db.enrollment.findFirst({
        where: { userId, courseId },
      })
      if (!enrollment) {
        return NextResponse.json(
          { error: 'You must be enrolled in this course to ask questions' },
          { status: 403 }
        )
      }

      // Get course to find instructor
      const course = await db.course.findUnique({
        where: { id: courseId },
        select: { instructorId: true },
      })
      if (!course) {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        )
      }

      // Rate limiting: check maxQuestionsPerDay from QASettings
      const qaSettings = await db.qASettings.findUnique({
        where: { instructorId: course.instructorId },
      })
      const maxQuestionsPerDay = qaSettings?.maxQuestionsPerDay ?? 10

      // Count today's questions by this user for this course
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)

      const todayQuestionCount = await db.qAQuestion.count({
        where: {
          userId,
          courseId,
          createdAt: { gte: todayStart },
        },
      })

      if (todayQuestionCount >= maxQuestionsPerDay) {
        return NextResponse.json(
          {
            error: `You have reached the daily question limit of ${maxQuestionsPerDay} for this course`,
            limit: maxQuestionsPerDay,
            remaining: 0,
          },
          { status: 429 }
        )
      }

      // Create the question
      const newQuestion = await db.qAQuestion.create({
        data: {
          userId,
          courseId,
          lessonId: lessonId || null,
          question: question.trim(),
        },
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
          answers: true,
        },
      })

      return NextResponse.json(
        {
          question: {
            id: newQuestion.id,
            userId: newQuestion.userId,
            userName: newQuestion.user.name || 'Anonymous',
            userAvatar: newQuestion.user.avatar,
            lessonId: newQuestion.lessonId,
            question: newQuestion.question,
            isAnswered: newQuestion.isAnswered,
            isPinned: newQuestion.isPinned,
            isFlagged: newQuestion.isFlagged,
            upvotes: newQuestion.upvotes,
            hasUpvoted: false,
            aiDraftAnswer: newQuestion.aiDraftAnswer,
            createdAt: newQuestion.createdAt.toISOString(),
            updatedAt: newQuestion.updatedAt.toISOString(),
            answers: [],
          },
          rateLimit: {
            limit: maxQuestionsPerDay,
            remaining: maxQuestionsPerDay - todayQuestionCount - 1,
          },
        },
        { status: 201 }
      )
    }
  } catch (error) {
    console.error('Error in student Q&A POST:', error)
    return NextResponse.json(
      { error: 'Failed to process Q&A action' },
      { status: 500 }
    )
  }
}
