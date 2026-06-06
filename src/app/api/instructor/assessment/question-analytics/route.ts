import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/assessment/question-analytics
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')
    const courseId = searchParams.get('courseId')

    if (!instructorId) {
      return NextResponse.json({ error: 'instructorId is required' }, { status: 400 })
    }

    // Get all courses for this instructor
    const courses = await db.course.findMany({
      where: { instructorId, ...(courseId ? { id: courseId } : {}) },
      select: { id: true },
    })
    const courseIds = courses.map(c => c.id)

    if (courseIds.length === 0) {
      return NextResponse.json({
        questions: [],
        summary: {
          totalQuestions: 0,
          avgSuccessRate: 0,
          distribution: { too_difficult: 0, difficult: 0, normal: 0, easy: 0, too_easy: 0 },
        },
      })
    }

    // Get all quizzes for these courses
    const quizzes = await db.quiz.findMany({
      where: { courseId: { in: courseIds } },
      select: { id: true, title: true },
    })
    const quizIds = quizzes.map(q => q.id)

    if (quizIds.length === 0) {
      return NextResponse.json({
        questions: [],
        summary: {
          totalQuestions: 0,
          avgSuccessRate: 0,
          distribution: { too_difficult: 0, difficult: 0, normal: 0, easy: 0, too_easy: 0 },
        },
      })
    }

    // Get all questions for these quizzes
    const questions = await db.question.findMany({
      where: { quizId: { in: quizIds } },
      select: {
        id: true,
        text: true,
        type: true,
        quizId: true,
        correctAnswer: true,
      },
    })

    if (questions.length === 0) {
      return NextResponse.json({
        questions: [],
        summary: {
          totalQuestions: 0,
          avgSuccessRate: 0,
          distribution: { too_difficult: 0, difficult: 0, normal: 0, easy: 0, too_easy: 0 },
        },
      })
    }

    // Get all quiz attempts for these quizzes
    const attempts = await db.quizAttempt.findMany({
      where: { quizId: { in: quizIds }, completedAt: { not: null } },
      select: { id: true, quizId: true, answers: true },
    })

    // Parse answers from all attempts and aggregate per question
    const questionStats: Record<string, { attempts: number; correct: number; incorrect: number }> = {}

    for (const question of questions) {
      questionStats[question.id] = { attempts: 0, correct: 0, incorrect: 0 }
    }

    for (const attempt of attempts) {
      try {
        const answers = JSON.parse(attempt.answers) as Array<{ questionId: string; answer: string }>
        for (const ans of answers) {
          const q = questions.find(q => q.id === ans.questionId)
          if (q && questionStats[q.id]) {
            questionStats[q.id].attempts++
            if (ans.answer === q.correctAnswer) {
              questionStats[q.id].correct++
            } else {
              questionStats[q.id].incorrect++
            }
          }
        }
      } catch {
        // Skip unparseable answers
      }
    }

    // Build quiz title lookup
    const quizTitleMap: Record<string, string> = {}
    for (const q of quizzes) {
      quizTitleMap[q.id] = q.title
    }

    // Calculate analytics and upsert
    const results = []
    const distribution = { too_difficult: 0, difficult: 0, normal: 0, easy: 0, too_easy: 0 }
    let totalSuccessRate = 0

    for (const question of questions) {
      const stats = questionStats[question.id]
      const attemptsCount = stats.attempts
      const correctCount = stats.correct
      const incorrectCount = stats.incorrect

      const successRate = attemptsCount > 0 ? (correctCount / attemptsCount) * 100 : 0
      const difficultyScore = attemptsCount > 0 ? 100 - successRate : 50

      let difficultyLevel: string
      if (successRate <= 20) difficultyLevel = 'too_difficult'
      else if (successRate <= 40) difficultyLevel = 'difficult'
      else if (successRate <= 70) difficultyLevel = 'normal'
      else if (successRate <= 90) difficultyLevel = 'easy'
      else difficultyLevel = 'too_easy'

      // Upsert analytics
      await db.questionAnalytics.upsert({
        where: { questionId: question.id },
        update: {
          attempts: attemptsCount,
          correctAttempts: correctCount,
          incorrectAttempts: incorrectCount,
          successRate: Math.round(successRate * 100) / 100,
          difficultyScore: Math.round(difficultyScore * 100) / 100,
          difficultyLevel,
          lastUpdated: new Date(),
        },
        create: {
          questionId: question.id,
          attempts: attemptsCount,
          correctAttempts: correctCount,
          incorrectAttempts: incorrectCount,
          successRate: Math.round(successRate * 100) / 100,
          difficultyScore: Math.round(difficultyScore * 100) / 100,
          difficultyLevel,
        },
      })

      distribution[difficultyLevel as keyof typeof distribution]++
      totalSuccessRate += successRate

      results.push({
        id: question.id,
        text: question.text,
        type: question.type,
        quizTitle: quizTitleMap[question.quizId] || 'Unknown Quiz',
        analytics: {
          attempts: attemptsCount,
          correctAttempts: correctCount,
          incorrectAttempts: incorrectCount,
          successRate: Math.round(successRate * 100) / 100,
          difficultyScore: Math.round(difficultyScore * 100) / 100,
          difficultyLevel,
        },
      })
    }

    const avgSuccessRate = questions.length > 0 ? Math.round((totalSuccessRate / questions.length) * 100) / 100 : 0

    return NextResponse.json({
      questions: results,
      summary: {
        totalQuestions: questions.length,
        avgSuccessRate,
        distribution,
      },
    })
  } catch (error) {
    console.error('Error in question-analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch question analytics' }, { status: 500 })
  }
}
