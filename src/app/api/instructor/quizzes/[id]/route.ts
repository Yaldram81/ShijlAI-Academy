import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/quizzes/[id] - Get quiz details with questions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const quiz = await db.quiz.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true, instructorId: true } },
        questions: { orderBy: { order: 'asc' } },
        _count: { select: { attempts: true } },
        attempts: {
          select: {
            id: true,
            score: true,
            maxScore: true,
            percentage: true,
            passed: true,
            completedAt: true,
          },
          orderBy: { startedAt: 'desc' },
        },
      },
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    const completedAttempts = quiz.attempts.filter((a) => a.completedAt !== null)
    const passedAttempts = completedAttempts.filter((a) => a.passed)
    const passRate = completedAttempts.length > 0
      ? Math.round((passedAttempts.length / completedAttempts.length) * 100)
      : 0
    const avgScore = completedAttempts.length > 0
      ? Math.round(completedAttempts.reduce((acc, a) => acc + a.percentage, 0) / completedAttempts.length)
      : 0

    // Parse options for MCQ questions
    const formattedQuestions = quiz.questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      options: (() => {
        try {
          const parsed = JSON.parse(q.options)
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      })(),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      points: q.points,
      order: q.order,
    }))

    return NextResponse.json({
      quiz: {
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
        course: { id: quiz.course.id, title: quiz.course.title },
        questions: formattedQuestions,
        attemptStats: {
          totalAttempts: quiz._count.attempts,
          completedAttempts: completedAttempts.length,
          passRate,
          avgScore,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching quiz:', error)
    return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 })
  }
}

// DELETE /api/instructor/quizzes/[id] - Delete a quiz
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    // Verify the quiz belongs to one of the instructor's courses
    const quiz = await db.quiz.findUnique({
      where: { id },
      include: { course: { select: { instructorId: true } } },
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    if (quiz.course.instructorId !== instructorId) {
      return NextResponse.json({ error: 'You do not have permission to delete this quiz' }, { status: 403 })
    }

    // Delete quiz (cascade will handle questions and attempts)
    await db.quiz.delete({ where: { id } })

    return NextResponse.json({ success: true, message: 'Quiz deleted successfully' })
  } catch (error) {
    console.error('Error deleting quiz:', error)
    return NextResponse.json({ error: 'Failed to delete quiz' }, { status: 500 })
  }
}

// PATCH /api/instructor/quizzes/[id] - Update a quiz
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { instructorId, title, description, type, timeLimit, passingScore, maxAttempts, isPublished } = body

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    // Verify the quiz belongs to one of the instructor's courses
    const quiz = await db.quiz.findUnique({
      where: { id },
      include: { course: { select: { instructorId: true } } },
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    if (quiz.course.instructorId !== instructorId) {
      return NextResponse.json({ error: 'You do not have permission to update this quiz' }, { status: 403 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (type !== undefined) updateData.type = type
    if (timeLimit !== undefined) updateData.timeLimit = timeLimit
    if (passingScore !== undefined) updateData.passingScore = passingScore
    if (maxAttempts !== undefined) updateData.maxAttempts = maxAttempts
    if (isPublished !== undefined) updateData.isPublished = isPublished

    const updatedQuiz = await db.quiz.update({
      where: { id },
      data: updateData,
      include: {
        course: { select: { id: true, title: true } },
        _count: { select: { questions: true, attempts: true } },
      },
    })

    return NextResponse.json({
      quiz: {
        id: updatedQuiz.id,
        title: updatedQuiz.title,
        description: updatedQuiz.description,
        type: updatedQuiz.type,
        timeLimit: updatedQuiz.timeLimit,
        passingScore: updatedQuiz.passingScore,
        maxAttempts: updatedQuiz.maxAttempts,
        isPublished: updatedQuiz.isPublished,
        course: { id: updatedQuiz.course.id, title: updatedQuiz.course.title },
        questionCount: updatedQuiz._count.questions,
      },
    })
  } catch (error) {
    console.error('Error updating quiz:', error)
    return NextResponse.json({ error: 'Failed to update quiz' }, { status: 500 })
  }
}
