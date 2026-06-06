import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ============================================================================
// GET /api/instructor/qa — Fetch Q&A questions for an instructor's courses
// ============================================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const instructorId = searchParams.get('instructorId')
    const courseId = searchParams.get('courseId')
    const status = searchParams.get('status') // unanswered, answered, flagged, all, pinned
    const lessonId = searchParams.get('lessonId')
    const studentId = searchParams.get('studentId')
    const sortBy = searchParams.get('sortBy') || 'newest' // newest, oldest, most-upvoted, unanswered-first
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!instructorId) {
      return NextResponse.json({ error: 'instructorId is required' }, { status: 400 })
    }

    // Get instructor's courses
    const courses = await db.course.findMany({
      where: { instructorId, isArchived: false },
      select: {
        id: true,
        title: true,
        modules: {
          select: {
            id: true,
            title: true,
            order: true,
            lessons: { select: { id: true, title: true, order: true } },
          },
        },
      },
    })

    const courseIds = courses.map(c => c.id)

    if (courseIds.length === 0) {
      return NextResponse.json({
        questions: [],
        summary: { totalQuestions: 0, unanswered: 0, answered: 0, flagged: 0, pinned: 0 },
        courses: [],
        lessons: [],
        qaSettings: null,
        stats: { avgResponseTime: null, responseRate: 0, questionsTrend: 0 },
        pagination: { page: 1, limit, totalItems: 0, totalPages: 0, hasNext: false, hasPrev: false },
      })
    }

    // Build where clause
    const where: Record<string, unknown> = {
      courseId: courseId && courseIds.includes(courseId) ? courseId : { in: courseIds },
    }

    if (status === 'unanswered') {
      where.isAnswered = false
      where.isFlagged = false
    } else if (status === 'answered') {
      where.isAnswered = true
    } else if (status === 'flagged') {
      where.isFlagged = true
    } else if (status === 'pinned') {
      where.isPinned = true
    }

    if (lessonId) {
      where.lessonId = lessonId
    }

    if (studentId) {
      where.userId = studentId
    }

    if (search) {
      where.question = { contains: search }
    }

    // Date range filters
    if (dateFrom || dateTo) {
      const createdAt: Record<string, unknown> = {}
      if (dateFrom) {
        createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        // Set to end of day for dateTo
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        createdAt.lte = toDate
      }
      where.createdAt = createdAt
    }

    // Parallel queries for summary counts, total for pagination, and questions
    const [
      totalQuestions,
      unanswered,
      answered,
      flagged,
      pinned,
      totalFiltered,
      questions,
      qaSettings,
    ] = await Promise.all([
      db.qAQuestion.count({ where: { courseId: { in: courseIds }, isFlagged: false } }),
      db.qAQuestion.count({ where: { courseId: { in: courseIds }, isAnswered: false, isFlagged: false } }),
      db.qAQuestion.count({ where: { courseId: { in: courseIds }, isAnswered: true, isFlagged: false } }),
      db.qAQuestion.count({ where: { courseId: { in: courseIds }, isFlagged: true } }),
      db.qAQuestion.count({ where: { courseId: { in: courseIds }, isPinned: true } }),
      db.qAQuestion.count({ where }),
      db.qAQuestion.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
          course: { select: { id: true, title: true } },
          lesson: {
            select: {
              id: true,
              title: true,
              order: true,
              module: { select: { id: true, title: true, order: true } },
            },
          },
          answers: {
            include: {
              user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
              upvotes: { select: { id: true, userId: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
          upvoteRecords: { select: { id: true, userId: true } },
        },
        orderBy: getSortOrder(sortBy),
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.qASettings.findUnique({ where: { instructorId } }),
    ])

    // Compute stats
    const stats = await computeStats(instructorId, courseIds, dateFrom, dateTo)

    // Pagination metadata
    const totalPages = Math.ceil(totalFiltered / limit)
    const hasNext = page < totalPages
    const hasPrev = page > 1

    // Format lesson labels
    const allLessons: Array<{ id: string; title: string; label: string; courseId: string }> = []
    for (const course of courses) {
      for (const mod of course.modules) {
        for (const lesson of mod.lessons) {
          allLessons.push({
            id: lesson.id,
            title: lesson.title,
            label: `${mod.order}.${lesson.order} ${lesson.title}`,
            courseId: course.id,
          })
        }
      }
    }

    // Enrich questions with computed upvote counts
    const enrichedQuestions = questions.map(q => ({
      ...q,
      upvoteCount: q.upvoteRecords.length,
      answers: q.answers.map(a => ({
        ...a,
        upvoteCount: a.upvotes.length,
      })),
    }))

    return NextResponse.json({
      questions: enrichedQuestions,
      summary: { totalQuestions, unanswered, answered, flagged, pinned },
      courses: courses.map(c => ({ id: c.id, title: c.title })),
      lessons: allLessons,
      qaSettings,
      stats,
      pagination: {
        page,
        limit,
        totalItems: totalFiltered,
        totalPages,
        hasNext,
        hasPrev,
      },
    })
  } catch (error) {
    console.error('Error fetching Q&A:', error)
    return NextResponse.json({ error: 'Failed to fetch Q&A data' }, { status: 500 })
  }
}

// ============================================================================
// Helper: Determine sort order
// ============================================================================
function getSortOrder(sortBy: string): Record<string, unknown> | Array<Record<string, unknown>> {
  switch (sortBy) {
    case 'oldest':
      return { createdAt: 'asc' }
    case 'most-upvoted':
      return { upvotes: 'desc' }
    case 'unanswered-first':
      return [{ isAnswered: 'asc' }, { createdAt: 'desc' }]
    default: // newest
      return { createdAt: 'desc' }
  }
}

// ============================================================================
// Helper: Compute Q&A stats
// ============================================================================
async function computeStats(
  instructorId: string,
  courseIds: string[],
  dateFrom?: string | null,
  dateTo?: string | null
): Promise<{
  avgResponseTime: number | null
  responseRate: number
  questionsTrend: number
}> {
  try {
    // Determine current period boundaries
    const now = new Date()
    let periodStart: Date
    let periodEnd: Date = now

    if (dateFrom) {
      periodStart = new Date(dateFrom)
    } else {
      // Default: last 30 days
      periodStart = new Date(now)
      periodStart.setDate(periodStart.getDate() - 30)
    }
    if (dateTo) {
      periodEnd = new Date(dateTo)
      periodEnd.setHours(23, 59, 59, 999)
    }

    // Calculate previous period of equal length
    const periodLengthMs = periodEnd.getTime() - periodStart.getTime()
    const prevPeriodEnd = new Date(periodStart.getTime() - 1)
    const prevPeriodStart = new Date(prevPeriodEnd.getTime() - periodLengthMs)

    // Fetch questions with instructor answers for avg response time
    const questionsWithAnswers = await db.qAQuestion.findMany({
      where: {
        courseId: { in: courseIds },
        isAnswered: true,
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      include: {
        answers: {
          where: { isInstructorAnswer: true },
          orderBy: { createdAt: 'asc' },
          take: 1,
        },
      },
    })

    // avgResponseTime: time from question creation to first instructor answer
    let avgResponseTime: number | null = null
    const responseTimes: number[] = []
    for (const q of questionsWithAnswers) {
      if (q.answers.length > 0) {
        const diffMs = new Date(q.answers[0].createdAt).getTime() - new Date(q.createdAt).getTime()
        responseTimes.push(diffMs)
      }
    }
    if (responseTimes.length > 0) {
      avgResponseTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    }

    // responseRate: % of questions with instructor answers
    const totalQuestionsInPeriod = await db.qAQuestion.count({
      where: {
        courseId: { in: courseIds },
        createdAt: { gte: periodStart, lte: periodEnd },
      },
    })

    const questionsWithInstructorAnswer = await db.qAQuestion.count({
      where: {
        courseId: { in: courseIds },
        isAnswered: true,
        createdAt: { gte: periodStart, lte: periodEnd },
        answers: { some: { isInstructorAnswer: true } },
      },
    })

    const responseRate = totalQuestionsInPeriod > 0
      ? Math.round((questionsWithInstructorAnswer / totalQuestionsInPeriod) * 100)
      : 0

    // questionsTrend: comparison with previous period
    const prevPeriodQuestions = await db.qAQuestion.count({
      where: {
        courseId: { in: courseIds },
        createdAt: { gte: prevPeriodStart, lte: prevPeriodEnd },
      },
    })

    let questionsTrend = 0
    if (prevPeriodQuestions > 0) {
      questionsTrend = Math.round(((totalQuestionsInPeriod - prevPeriodQuestions) / prevPeriodQuestions) * 100)
    } else if (totalQuestionsInPeriod > 0) {
      questionsTrend = 100 // went from 0 to some
    }

    return { avgResponseTime, responseRate, questionsTrend }
  } catch (error) {
    console.error('Error computing Q&A stats:', error)
    return { avgResponseTime: null, responseRate: 0, questionsTrend: 0 }
  }
}

// ============================================================================
// POST /api/instructor/qa — Various Q&A actions
// ============================================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action } = body

    // -----------------------------------------------------------------------
    // action: 'answer' — Post an answer to a question
    // -----------------------------------------------------------------------
    if (action === 'answer') {
      const { questionId, content, userId, isAiGenerated, instructorId } = body
      if (!questionId || !content || !userId) {
        return NextResponse.json({ error: 'Missing required fields: questionId, content, userId' }, { status: 400 })
      }

      // Verify the question belongs to one of the instructor's courses
      if (instructorId) {
        const question = await db.qAQuestion.findUnique({
          where: { id: questionId },
          include: { course: { select: { instructorId: true } } },
        })
        if (!question) {
          return NextResponse.json({ error: 'Question not found' }, { status: 404 })
        }
        if (question.course.instructorId !== instructorId) {
          return NextResponse.json({ error: 'You can only answer questions from your own courses' }, { status: 403 })
        }
      }

      // Determine if the answerer is an instructor
      const answerer = await db.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })
      const isInstructor = answerer?.role === 'instructor'

      const answer = await db.qAAnswer.create({
        data: {
          questionId,
          userId,
          content,
          isAiGenerated: isAiGenerated || false,
          isInstructorAnswer: isInstructor,
        },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
          upvotes: { select: { id: true, userId: true } },
        },
      })

      // Mark question as answered
      await db.qAQuestion.update({
        where: { id: questionId },
        data: { isAnswered: true },
      })

      return NextResponse.json({
        answer: {
          ...answer,
          upvoteCount: answer.upvotes.length,
        },
        message: 'Answer posted successfully',
      })
    }

    // -----------------------------------------------------------------------
    // action: 'pin' — Pin/unpin a question
    // -----------------------------------------------------------------------
    if (action === 'pin') {
      const { questionId, isPinned, instructorId } = body
      if (!questionId) {
        return NextResponse.json({ error: 'questionId is required' }, { status: 400 })
      }

      // Verify the question belongs to one of the instructor's courses
      if (instructorId) {
        const question = await db.qAQuestion.findUnique({
          where: { id: questionId },
          include: { course: { select: { instructorId: true } } },
        })
        if (!question) {
          return NextResponse.json({ error: 'Question not found' }, { status: 404 })
        }
        if (question.course.instructorId !== instructorId) {
          return NextResponse.json({ error: 'You can only pin questions from your own courses' }, { status: 403 })
        }
      }

      await db.qAQuestion.update({
        where: { id: questionId },
        data: { isPinned: isPinned ?? true },
      })

      return NextResponse.json({ message: isPinned ? 'Question pinned' : 'Question unpinned' })
    }

    // -----------------------------------------------------------------------
    // action: 'flag' — Flag/unflag a question
    // -----------------------------------------------------------------------
    if (action === 'flag') {
      const { questionId, isFlagged, instructorId } = body
      if (!questionId) {
        return NextResponse.json({ error: 'questionId is required' }, { status: 400 })
      }

      // Verify the question belongs to one of the instructor's courses
      if (instructorId) {
        const question = await db.qAQuestion.findUnique({
          where: { id: questionId },
          include: { course: { select: { instructorId: true } } },
        })
        if (!question) {
          return NextResponse.json({ error: 'Question not found' }, { status: 404 })
        }
        if (question.course.instructorId !== instructorId) {
          return NextResponse.json({ error: 'You can only flag questions from your own courses' }, { status: 403 })
        }
      }

      await db.qAQuestion.update({
        where: { id: questionId },
        data: { isFlagged: isFlagged ?? true },
      })

      return NextResponse.json({ message: isFlagged ? 'Question flagged' : 'Question unflagged' })
    }

    // -----------------------------------------------------------------------
    // action: 'delete-answer' — Delete an answer (with isAnswered recalculation)
    // -----------------------------------------------------------------------
    if (action === 'delete-answer') {
      const { answerId } = body
      if (!answerId) {
        return NextResponse.json({ error: 'answerId is required' }, { status: 400 })
      }

      // Find the answer to get the questionId before deleting
      const answer = await db.qAAnswer.findUnique({
        where: { id: answerId },
        select: { questionId: true },
      })

      if (!answer) {
        return NextResponse.json({ error: 'Answer not found' }, { status: 404 })
      }

      await db.qAAnswer.delete({ where: { id: answerId } })

      // BUG FIX: Recalculate isAnswered on the parent question
      const remainingAnswers = await db.qAAnswer.count({
        where: { questionId: answer.questionId },
      })

      await db.qAQuestion.update({
        where: { id: answer.questionId },
        data: { isAnswered: remainingAnswers > 0 },
      })

      return NextResponse.json({ message: 'Answer deleted', isAnswered: remainingAnswers > 0 })
    }

    // -----------------------------------------------------------------------
    // action: 'edit-answer' — Edit an answer
    // -----------------------------------------------------------------------
    if (action === 'edit-answer') {
      const { answerId, content } = body
      if (!answerId || !content) {
        return NextResponse.json({ error: 'answerId and content are required' }, { status: 400 })
      }

      const answer = await db.qAAnswer.update({
        where: { id: answerId },
        data: { content, isEdited: true },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
          upvotes: { select: { id: true, userId: true } },
        },
      })

      return NextResponse.json({
        answer: {
          ...answer,
          upvoteCount: answer.upvotes.length,
        },
        message: 'Answer updated',
      })
    }

    // -----------------------------------------------------------------------
    // action: 'accept-answer' — Mark an answer as accepted
    // -----------------------------------------------------------------------
    if (action === 'accept-answer') {
      const { answerId } = body
      if (!answerId) {
        return NextResponse.json({ error: 'answerId is required' }, { status: 400 })
      }

      // Find the answer to get questionId
      const answer = await db.qAAnswer.findUnique({
        where: { id: answerId },
        select: { questionId: true },
      })

      if (!answer) {
        return NextResponse.json({ error: 'Answer not found' }, { status: 404 })
      }

      // Unmark any previously accepted answer for this question
      await db.qAAnswer.updateMany({
        where: { questionId: answer.questionId, isAccepted: true },
        data: { isAccepted: false },
      })

      // Mark the new answer as accepted
      await db.qAAnswer.update({
        where: { id: answerId },
        data: { isAccepted: true },
      })

      return NextResponse.json({ message: 'Answer marked as accepted' })
    }

    // -----------------------------------------------------------------------
    // action: 'delete-question' — Delete a question (instructor can delete from their courses)
    // -----------------------------------------------------------------------
    if (action === 'delete-question') {
      const { questionId, instructorId } = body
      if (!questionId || !instructorId) {
        return NextResponse.json({ error: 'questionId and instructorId are required' }, { status: 400 })
      }

      // Verify the question belongs to one of the instructor's courses
      const question = await db.qAQuestion.findUnique({
        where: { id: questionId },
        include: { course: { select: { instructorId: true } } },
      })

      if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 })
      }

      if (question.course.instructorId !== instructorId) {
        return NextResponse.json({ error: 'You can only delete questions from your own courses' }, { status: 403 })
      }

      await db.qAQuestion.delete({ where: { id: questionId } })

      return NextResponse.json({ message: 'Question deleted' })
    }

    // -----------------------------------------------------------------------
    // action: 'bulk-approve' — Approve multiple flagged questions
    // -----------------------------------------------------------------------
    if (action === 'bulk-approve') {
      const { questionIds, instructorId } = body
      if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
        return NextResponse.json({ error: 'questionIds array is required' }, { status: 400 })
      }
      if (!instructorId) {
        return NextResponse.json({ error: 'instructorId is required' }, { status: 400 })
      }

      // Verify all questions belong to the instructor's courses
      const instructorCourses = await db.course.findMany({
        where: { instructorId, isArchived: false },
        select: { id: true },
      })
      const instructorCourseIds = instructorCourses.map(c => c.id)

      const questions = await db.qAQuestion.findMany({
        where: { id: { in: questionIds } },
        select: { id: true, courseId: true },
      })

      // Filter to only questions belonging to instructor's courses
      const validQuestionIds = questions
        .filter(q => instructorCourseIds.includes(q.courseId))
        .map(q => q.id)

      if (validQuestionIds.length === 0) {
        return NextResponse.json({ error: 'No valid questions found for this instructor' }, { status: 403 })
      }

      // Unflag the questions
      const result = await db.qAQuestion.updateMany({
        where: { id: { in: validQuestionIds } },
        data: {
          isFlagged: false,
          flaggedReason: null,
          moderationStatus: 'kept',
          moderatedAt: new Date(),
          moderatedBy: instructorId,
        },
      })

      return NextResponse.json({
        message: `${result.count} question(s) approved`,
        approvedCount: result.count,
        skippedCount: questionIds.length - validQuestionIds.length,
      })
    }

    // -----------------------------------------------------------------------
    // action: 'reply' — Student reply (respects allowStudentReplies from settings)
    // -----------------------------------------------------------------------
    if (action === 'reply') {
      const { questionId, content, userId } = body
      if (!questionId || !content || !userId) {
        return NextResponse.json({ error: 'Missing required fields: questionId, content, userId' }, { status: 400 })
      }

      // Check if student replies are allowed
      const question = await db.qAQuestion.findUnique({
        where: { id: questionId },
        include: {
          course: {
            select: {
              instructorId: true,
            },
          },
        },
      })

      if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 })
      }

      const qaSettings = await db.qASettings.findUnique({
        where: { instructorId: question.course.instructorId },
      })

      if (qaSettings && !qaSettings.allowStudentReplies) {
        return NextResponse.json(
          { error: 'Student replies are not allowed for this instructor\'s Q&A' },
          { status: 403 }
        )
      }

      // Create the reply as an answer
      const reply = await db.qAAnswer.create({
        data: {
          questionId,
          userId,
          content,
          isAiGenerated: false,
          isInstructorAnswer: false,
        },
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
          upvotes: { select: { id: true, userId: true } },
        },
      })

      // Mark question as answered (it now has a response)
      await db.qAQuestion.update({
        where: { id: questionId },
        data: { isAnswered: true },
      })

      return NextResponse.json({
        answer: {
          ...reply,
          upvoteCount: reply.upvotes.length,
        },
        message: 'Reply posted successfully',
      })
    }

    // -----------------------------------------------------------------------
    // action: 'upvote-answer' — Toggle upvote on an answer
    // -----------------------------------------------------------------------
    if (action === 'upvote-answer') {
      const { answerId, userId } = body
      if (!answerId || !userId) {
        return NextResponse.json({ error: 'answerId and userId are required' }, { status: 400 })
      }

      // Check if already upvoted (deduplication)
      const existingUpvote = await db.qAAnswerUpvote.findUnique({
        where: { answerId_userId: { answerId, userId } },
      })

      if (existingUpvote) {
        // Toggle off: remove the upvote
        await db.qAAnswerUpvote.delete({
          where: { id: existingUpvote.id },
        })

        // Count remaining upvotes
        const upvoteCount = await db.qAAnswerUpvote.count({
          where: { answerId },
        })

        return NextResponse.json({
          upvoted: false,
          upvoteCount,
          message: 'Upvote removed',
        })
      } else {
        // Toggle on: add the upvote
        await db.qAAnswerUpvote.create({
          data: { answerId, userId },
        })

        const upvoteCount = await db.qAAnswerUpvote.count({
          where: { answerId },
        })

        return NextResponse.json({
          upvoted: true,
          upvoteCount,
          message: 'Answer upvoted',
        })
      }
    }

    // -----------------------------------------------------------------------
    // action: 'save-settings' — Save Q&A settings (with new fields)
    // -----------------------------------------------------------------------
    if (action === 'save-settings') {
      const {
        instructorId,
        autoAnswer,
        emailNotifications,
        allowStudentReplies,
        requireApproval,
        maxQuestionsPerDay,
      } = body

      if (!instructorId) {
        return NextResponse.json({ error: 'instructorId is required' }, { status: 400 })
      }

      const settings = await db.qASettings.upsert({
        where: { instructorId },
        update: {
          autoAnswer: autoAnswer ?? false,
          emailNotifications: emailNotifications ?? 'immediately',
          allowStudentReplies: allowStudentReplies ?? true,
          requireApproval: requireApproval ?? false,
          maxQuestionsPerDay: maxQuestionsPerDay ?? 10,
        },
        create: {
          instructorId,
          autoAnswer: autoAnswer ?? false,
          emailNotifications: emailNotifications ?? 'immediately',
          allowStudentReplies: allowStudentReplies ?? true,
          requireApproval: requireApproval ?? false,
          maxQuestionsPerDay: maxQuestionsPerDay ?? 10,
        },
      })

      return NextResponse.json({ settings, message: 'Settings saved' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in Q&A POST:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

// ============================================================================
// DELETE /api/instructor/qa — Delete a question (with ownership verification)
// ============================================================================
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const questionId = searchParams.get('questionId')
    const instructorId = searchParams.get('instructorId')

    if (!questionId) {
      return NextResponse.json({ error: 'questionId is required' }, { status: 400 })
    }

    // Verify the question belongs to the instructor's course
    if (instructorId) {
      const question = await db.qAQuestion.findUnique({
        where: { id: questionId },
        include: { course: { select: { instructorId: true } } },
      })

      if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 })
      }

      if (question.course.instructorId !== instructorId) {
        return NextResponse.json(
          { error: 'You can only delete questions from your own courses' },
          { status: 403 }
        )
      }
    }

    await db.qAQuestion.delete({ where: { id: questionId } })

    return NextResponse.json({ message: 'Question deleted' })
  } catch (error) {
    console.error('Error deleting Q&A question:', error)
    return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
  }
}
