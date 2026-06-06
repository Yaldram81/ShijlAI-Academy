import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/assessment/distractor-analysis
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')
    const questionId = searchParams.get('questionId')

    if (!instructorId) {
      return NextResponse.json({ error: 'instructorId is required' }, { status: 400 })
    }
    if (!questionId) {
      return NextResponse.json({ error: 'questionId is required' }, { status: 400 })
    }

    // Get the question
    const question = await db.question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        text: true,
        type: true,
        options: true,
        correctAnswer: true,
        quizId: true,
      },
    })

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Only MCQ type questions have distractors
    if (question.type !== 'mcq' && question.type !== 'true_false') {
      return NextResponse.json({
        question: {
          id: question.id,
          text: question.text,
          type: question.type,
          options: [],
          correctAnswer: question.correctAnswer,
        },
        distractors: [],
        totalAttempts: 0,
        weakDistractorCount: 0,
        recommendation: 'Distractor analysis is only available for MCQ and True/False questions.',
      })
    }

    // Parse options
    let optionsList: string[] = []
    try {
      optionsList = JSON.parse(question.options) as string[]
    } catch {
      optionsList = []
    }

    // Get the quiz to find attempts
    const quiz = await db.quiz.findUnique({
      where: { id: question.quizId },
      select: { id: true },
    })

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Get all attempts for this quiz
    const attempts = await db.quizAttempt.findMany({
      where: { quizId: quiz.id, completedAt: { not: null } },
      select: { answers: true },
    })

    // Count selections for each option
    const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const selectionCounts: Record<string, number> = {}
    for (let i = 0; i < optionsList.length && i < optionLabels.length; i++) {
      selectionCounts[optionLabels[i]] = 0
    }

    let totalAttempts = 0

    for (const attempt of attempts) {
      try {
        const answers = JSON.parse(attempt.answers) as Array<{ questionId: string; answer: string }>
        const answerForQuestion = answers.find(a => a.questionId === questionId)
        if (answerForQuestion) {
          totalAttempts++
          const label = answerForQuestion.answer.toUpperCase()
          if (selectionCounts[label] !== undefined) {
            selectionCounts[label]++
          }
        }
      } catch {
        // Skip unparseable answers
      }
    }

    // Build distractor analysis
    const distractors = []
    let weakDistractorCount = 0

    for (let i = 0; i < optionsList.length && i < optionLabels.length; i++) {
      const label = optionLabels[i]
      const optionText = optionsList[i]
      const selectionCount = selectionCounts[label] || 0
      const selectionRate = totalAttempts > 0 ? (selectionCount / totalAttempts) * 100 : 0
      const isCorrect = question.correctAnswer.toUpperCase() === label
      const isWeak = !isCorrect && totalAttempts > 0 && selectionRate < 5

      if (isWeak) weakDistractorCount++

      // Upsert distractor analytics
      await db.distractorAnalytics.upsert({
        where: {
          questionId_optionLabel: { questionId: question.id, optionLabel: label },
        },
        update: {
          optionText,
          selectionCount,
          selectionRate: Math.round(selectionRate * 100) / 100,
          isCorrect,
          isWeak,
        },
        create: {
          questionId: question.id,
          optionLabel: label,
          optionText,
          selectionCount,
          selectionRate: Math.round(selectionRate * 100) / 100,
          isCorrect,
          isWeak,
        },
      })

      distractors.push({
        optionLabel: label,
        optionText,
        selectionCount,
        selectionRate: Math.round(selectionRate * 100) / 100,
        isCorrect,
        isWeak,
      })
    }

    // Generate recommendation
    let recommendation = ''
    if (totalAttempts === 0) {
      recommendation = 'No attempt data available yet. Encourage students to take this quiz.'
    } else if (weakDistractorCount === 0) {
      recommendation = 'All distractors are functioning well. No immediate changes needed.'
    } else if (weakDistractorCount === 1) {
      recommendation = 'One weak distractor detected. Consider revising it to make it more plausible.'
    } else {
      recommendation = `${weakDistractorCount} weak distractors detected. Review these options to make them more plausible and better differentiate student understanding.`
    }

    return NextResponse.json({
      question: {
        id: question.id,
        text: question.text,
        type: question.type,
        options: optionsList,
        correctAnswer: question.correctAnswer,
      },
      distractors,
      totalAttempts,
      weakDistractorCount,
      recommendation,
    })
  } catch (error) {
    console.error('Error in distractor-analysis:', error)
    return NextResponse.json({ error: 'Failed to analyze distractors' }, { status: 500 })
  }
}
