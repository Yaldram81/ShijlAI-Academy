import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/assessment/outcomes
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')
    const courseId = searchParams.get('courseId')

    if (!instructorId) {
      return NextResponse.json({ error: 'instructorId is required' }, { status: 400 })
    }
    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
    }

    // Verify the instructor owns this course
    const course = await db.course.findFirst({
      where: { id: courseId, instructorId },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found or not owned by instructor' }, { status: 404 })
    }

    // Get all learning outcomes for this course
    const outcomes = await db.learningOutcome.findMany({
      where: { courseId },
      include: {
        questionOutcomes: {
          include: {
            outcome: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    })

    if (outcomes.length === 0) {
      return NextResponse.json({ outcomes: [] })
    }

    // Get all question IDs linked to outcomes
    const questionIds = [
      ...new Set(
        outcomes.flatMap(o => o.questionOutcomes.map(qo => qo.questionId))
      ),
    ]

    // Get the questions
    const questions = await db.question.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, text: true, type: true, correctAnswer: true, quizId: true },
    })

    // Get all quizzes for these questions
    const quizIds = [...new Set(questions.map(q => q.quizId))]

    // Get all attempts for these quizzes
    const attempts = await db.quizAttempt.findMany({
      where: { quizId: { in: quizIds }, completedAt: { not: null } },
      select: { id: true, userId: true, answers: true },
    })

    // Parse all answers and group by userId and questionId
    const userAnswers: Record<string, Record<string, string>> = {}
    for (const attempt of attempts) {
      try {
        const answers = JSON.parse(attempt.answers) as Array<{ questionId: string; answer: string }>
        if (!userAnswers[attempt.userId]) {
          userAnswers[attempt.userId] = {}
        }
        for (const ans of answers) {
          userAnswers[attempt.userId][ans.questionId] = ans.answer
        }
      } catch {
        // Skip unparseable
      }
    }

    // Build question lookup
    const questionMap: Record<string, { text: string; type: string; correctAnswer: string }> = {}
    for (const q of questions) {
      questionMap[q.id] = { text: q.text, type: q.type, correctAnswer: q.correctAnswer }
    }

    // Calculate mastery for each outcome
    const result = outcomes.map(outcome => {
      const linkedQuestionIds = outcome.questionOutcomes.map(qo => qo.questionId)
      const linkedQuestions = linkedQuestionIds
        .filter(qid => questionMap[qid])
        .map(qid => ({
          id: qid,
          text: questionMap[qid].text,
          type: questionMap[qid].type,
        }))

      // Calculate mastery: for each student who attempted these questions,
      // what % did they get correct? Then average across students.
      const studentMasteryScores: number[] = []
      const users = Object.keys(userAnswers)

      for (const userId of users) {
        const userAnswerMap = userAnswers[userId]
        let correctForOutcome = 0
        let totalForOutcome = 0

        for (const qid of linkedQuestionIds) {
          if (questionMap[qid] && userAnswerMap[qid] !== undefined) {
            totalForOutcome++
            if (userAnswerMap[qid] === questionMap[qid].correctAnswer) {
              correctForOutcome++
            }
          }
        }

        if (totalForOutcome > 0) {
          studentMasteryScores.push((correctForOutcome / totalForOutcome) * 100)
        }
      }

      const avgMastery = studentMasteryScores.length > 0
        ? Math.round((studentMasteryScores.reduce((a, b) => a + b, 0) / studentMasteryScores.length) * 100) / 100
        : 0

      let masteryLevel: string
      if (avgMastery >= 90) masteryLevel = 'mastered'
      else if (avgMastery >= 70) masteryLevel = 'proficient'
      else if (avgMastery >= 50) masteryLevel = 'developing'
      else if (avgMastery > 0) masteryLevel = 'beginning'
      else masteryLevel = 'no_data'

      return {
        id: outcome.id,
        title: outcome.title,
        description: outcome.description,
        questionCount: linkedQuestionIds.length,
        avgMastery,
        masteryLevel,
        questions: linkedQuestions,
      }
    })

    return NextResponse.json({ outcomes: result })
  } catch (error) {
    console.error('Error in outcomes GET:', error)
    return NextResponse.json({ error: 'Failed to fetch outcomes' }, { status: 500 })
  }
}
