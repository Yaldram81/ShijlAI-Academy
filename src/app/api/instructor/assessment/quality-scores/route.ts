import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/assessment/quality-scores
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

    // Verify course ownership
    const course = await db.course.findFirst({
      where: { id: courseId, instructorId },
    })
    if (!course) {
      return NextResponse.json({ error: 'Course not found or not owned by instructor' }, { status: 404 })
    }

    // Get all quizzes for this course
    const quizzes = await db.quiz.findMany({
      where: { courseId },
      select: { id: true, title: true },
    })

    if (quizzes.length === 0) {
      return NextResponse.json({ quizzes: [] })
    }

    // Get all learning outcomes for this course
    const outcomes = await db.learningOutcome.findMany({
      where: { courseId },
      include: { questionOutcomes: true },
    })

    const totalOutcomes = outcomes.length
    const outcomesWithQuestions = outcomes.filter(o => o.questionOutcomes.length > 0).length

    const result = []

    for (const quiz of quizzes) {
      // Get questions for this quiz
      const questions = await db.question.findMany({
        where: { quizId: quiz.id },
        select: { id: true, type: true },
      })

      if (questions.length === 0) {
        // Upsert with zero scores
        await db.assessmentQualityScore.upsert({
          where: { quizId: quiz.id },
          update: {
            difficultyBalance: 0,
            questionVariety: 0,
            outcomeCoverage: 0,
            avgCompletionTime: 0,
            overallScore: 0,
            calculatedAt: new Date(),
          },
          create: {
            quizId: quiz.id,
            difficultyBalance: 0,
            questionVariety: 0,
            outcomeCoverage: 0,
            avgCompletionTime: 0,
            overallScore: 0,
          },
        })
        result.push({
          id: quiz.id,
          title: quiz.title,
          qualityScore: {
            overallScore: 0,
            difficultyBalance: 0,
            questionVariety: 0,
            outcomeCoverage: 0,
            avgCompletionTime: 0,
          },
        })
        continue
      }

      // 1. Difficulty Balance - based on standard deviation of success rates
      const questionAnalytics = await db.questionAnalytics.findMany({
        where: { questionId: { in: questions.map(q => q.id) } },
        select: { successRate: true },
      })

      let difficultyBalance = 0
      if (questionAnalytics.length > 1) {
        const rates = questionAnalytics.map(qa => qa.successRate)
        const mean = rates.reduce((a, b) => a + b, 0) / rates.length
        const variance = rates.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / rates.length
        const stdDev = Math.sqrt(variance)
        // Lower std dev = better balanced. Max meaningful std dev is ~50 (spread across full range)
        // Normalize: 100 - (stdDev / 50 * 100), clamped to 0-100
        difficultyBalance = Math.max(0, Math.min(100, 100 - (stdDev / 50) * 100))
      } else if (questionAnalytics.length === 1) {
        difficultyBalance = 50 // Single question, neutral
      }

      // 2. Question Variety - % of different question types used
      const questionTypes = new Set(questions.map(q => q.type))
      const allQuestionTypes = ['mcq', 'true_false', 'fill_blank', 'short_answer']
      const questionVariety = (questionTypes.size / allQuestionTypes.length) * 100

      // 3. Outcome Coverage - % of course outcomes that have at least one linked question
      const questionIds = questions.map(q => q.id)
      const linkedQuestionOutcomes = await db.questionOutcome.findMany({
        where: { questionId: { in: questionIds } },
        select: { outcomeId: true },
      })
      const linkedOutcomeIds = new Set(linkedQuestionOutcomes.map(qo => qo.outcomeId))
      // How many outcomes are covered by questions from THIS quiz specifically
      const coveredOutcomes = outcomes.filter(o => linkedOutcomeIds.has(o.id)).length
      const outcomeCoverage = totalOutcomes > 0 ? (coveredOutcomes / totalOutcomes) * 100 : 0

      // 4. Average Completion Time
      const completedAttempts = await db.quizAttempt.findMany({
        where: {
          quizId: quiz.id,
          completedAt: { not: null },
          startedAt: { not: null },
        },
        select: { startedAt: true, completedAt: true },
      })

      let avgCompletionTime = 0
      if (completedAttempts.length > 0) {
        const totalTime = completedAttempts.reduce((sum, attempt) => {
          if (attempt.completedAt && attempt.startedAt) {
            return sum + (new Date(attempt.completedAt).getTime() - new Date(attempt.startedAt).getTime()) / 1000
          }
          return sum
        }, 0)
        avgCompletionTime = totalTime / completedAttempts.length
      }

      // 5. Time factor - normalize completion time to 0-100 scale
      // Assume ideal time is around quiz timeLimit or 30 mins for unlimited
      const quizInfo = await db.quiz.findUnique({
        where: { id: quiz.id },
        select: { timeLimit: true },
      })
      const idealTime = (quizInfo?.timeLimit && quizInfo.timeLimit > 0 ? quizInfo.timeLimit : 30) * 60
      // If avg time is within ideal, score high. If way over, score low.
      let timeFactor = 0
      if (avgCompletionTime > 0) {
        const ratio = avgCompletionTime / idealTime
        if (ratio <= 1) {
          timeFactor = 100
        } else if (ratio <= 1.5) {
          timeFactor = 100 - (ratio - 1) * 100
        } else {
          timeFactor = Math.max(0, 50 - (ratio - 1.5) * 50)
        }
      }

      // Composite score
      const overallScore = Math.round(
        difficultyBalance * 0.30 +
        questionVariety * 0.25 +
        outcomeCoverage * 0.25 +
        timeFactor * 0.20
      )

      // Round individual scores
      const roundedDifficultyBalance = Math.round(difficultyBalance * 100) / 100
      const roundedQuestionVariety = Math.round(questionVariety * 100) / 100
      const roundedOutcomeCoverage = Math.round(outcomeCoverage * 100) / 100
      const roundedAvgCompletionTime = Math.round(avgCompletionTime * 100) / 100

      // Upsert
      await db.assessmentQualityScore.upsert({
        where: { quizId: quiz.id },
        update: {
          difficultyBalance: roundedDifficultyBalance,
          questionVariety: roundedQuestionVariety,
          outcomeCoverage: roundedOutcomeCoverage,
          avgCompletionTime: roundedAvgCompletionTime,
          overallScore,
          calculatedAt: new Date(),
        },
        create: {
          quizId: quiz.id,
          difficultyBalance: roundedDifficultyBalance,
          questionVariety: roundedQuestionVariety,
          outcomeCoverage: roundedOutcomeCoverage,
          avgCompletionTime: roundedAvgCompletionTime,
          overallScore,
        },
      })

      result.push({
        id: quiz.id,
        title: quiz.title,
        qualityScore: {
          overallScore,
          difficultyBalance: roundedDifficultyBalance,
          questionVariety: roundedQuestionVariety,
          outcomeCoverage: roundedOutcomeCoverage,
          avgCompletionTime: roundedAvgCompletionTime,
        },
      })
    }

    return NextResponse.json({ quizzes: result })
  } catch (error) {
    console.error('Error in quality-scores:', error)
    return NextResponse.json({ error: 'Failed to calculate quality scores' }, { status: 500 })
  }
}
