import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface QuestionInput {
  text: string
  type: string // mcq, true_false, fill_blank, short_answer
  options?: string | unknown[] // JSON for MCQ options
  correctAnswer: string
  explanation?: string
  points?: number
  order?: number
}

// POST /api/instructor/modules/[m[moduleId]/quizzes - Create quiz with questions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  try {
    const { moduleId } = await params
    const body = await request.json()
    const {
      title, description, type, timeLimit, passingScore, maxAttempts,
      isPublished, questions,
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Quiz title is required' }, { status: 400 })
    }

    // Validate module exists
    const moduleExists = await db.module.findUnique({
      where: { id: moduleId },
      include: { course: { select: { id: true } } },
    })
    if (!moduleExists) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 })
    }

    // Create quiz with questions in a transaction
    const quiz = await db.quiz.create({
      data: {
        title,
        description: description || null,
        type: type || 'practice',
        timeLimit: timeLimit || 0,
        passingScore: passingScore || 70,
        courseId: moduleExists.course.id,
        moduleId,
        maxAttempts: maxAttempts || 0,
        isPublished: isPublished ?? true,
        questions: {
          create: (questions as QuestionInput[] || []).map((q, index) => ({
            text: q.text,
            type: q.type || 'mcq',
            options: typeof q.options === 'string' ? q.options : JSON.stringify(q.options || []),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || null,
            points: q.points || 1,
            order: q.order ?? index,
          })),
        },
      },
      include: {
        questions: { orderBy: { order: 'asc' } },
      },
    })

    return NextResponse.json(
      { quiz, message: 'Quiz created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating quiz:', error)
    return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 })
  }
}
