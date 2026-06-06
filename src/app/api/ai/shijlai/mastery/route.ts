import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAllMasteries, updateTopicMastery, computeSkillMasteries, getMasteryInsights } from '@/services/learning-engine/mastery-service'

// GET /api/ai/shijlai/mastery?userId=xxx&courseId=xxx&include=skills,insights
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const courseId = searchParams.get('courseId') || undefined
    const include = searchParams.get('include') || ''

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    let masteries = await getAllMasteries(userId, courseId)

    // If no mastery records exist, generate from enrollment data with weighted formula
    if (masteries.length === 0) {
      const enrollments = await db.enrollment.findMany({
        where: { userId },
        include: {
          course: { include: { modules: { include: { lessons: true } } } },
          lessonProgress: { include: { lesson: true } },
        },
      })

      for (const enrollment of enrollments) {
        const course = enrollment.course
        if (!course) continue

        const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0)
        const completedLessons = enrollment.lessonProgress.filter(lp => lp.status === 'completed').length
        const completionScore = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

        // Create mastery records per module (topic)
        for (const courseModule of course.modules) {
          const moduleCompletedLessons = enrollment.lessonProgress.filter(
            lp => lp.status === 'completed' && courseModule.lessons.some(l => l.id === lp.lessonId)
          ).length
          const moduleTotalLessons = courseModule.lessons.length
          const modCompletion = moduleTotalLessons > 0 ? (moduleCompletedLessons / moduleTotalLessons) * 100 : 0

          try {
            await db.topicMastery.upsert({
              where: { userId_topicId: { userId, topicId: `mod-${courseModule.id}` } },
              create: {
                userId,
                topicId: `mod-${courseModule.id}`,
                topicName: courseModule.title,
                courseId: course.id,
                completionScore: modCompletion,
                masteryScore: modCompletion * 0.10, // Only completion component
                status: modCompletion > 0 ? (modCompletion >= 90 ? 'mastered' : modCompletion >= 75 ? 'strong' : modCompletion >= 50 ? 'learning' : modCompletion >= 25 ? 'weak' : 'not_started') : 'not_started',
                attemptCount: 1,
                trend: 'stable',
              },
              update: {
                completionScore: modCompletion,
                masteryScore: modCompletion * 0.10,
                trend: 'stable',
              },
            })
          } catch {
            // Skip if upsert fails
          }
        }

        // Also create a course-level category mastery (legacy compat)
        if (course.category) {
          try {
            await db.topicMastery.upsert({
              where: { userId_topicId: { userId, topicId: `cat-${course.category}` } },
              create: {
                userId,
                topicId: `cat-${course.category}`,
                topicName: course.category,
                courseId: course.id,
                completionScore: completionScore,
                masteryScore: completionScore * 0.10,
                status: completionScore > 0 ? (completionScore >= 90 ? 'mastered' : completionScore >= 75 ? 'strong' : completionScore >= 50 ? 'learning' : 'weak') : 'not_started',
                attemptCount: 1,
                trend: completionScore > 50 ? 'improving' : 'stable',
              },
              update: {
                completionScore: completionScore,
                masteryScore: completionScore * 0.10,
                trend: completionScore > 50 ? 'improving' : 'stable',
              },
            })
          } catch {
            // Skip
          }
        }
      }

      masteries = await getAllMasteries(userId, courseId)
    }

    // Compute summary
    const weakTopics = masteries.filter(m => m.masteryScore < 50)
    const strongTopics = masteries.filter(m => m.masteryScore >= 75)
    const avgMastery = masteries.length > 0
      ? masteries.reduce((sum, m) => sum + m.masteryScore, 0) / masteries.length
      : 0

    // Status distribution
    const statusDist = {
      mastered: masteries.filter(m => m.status === 'mastered').length,
      strong: masteries.filter(m => m.status === 'strong').length,
      learning: masteries.filter(m => m.status === 'learning').length,
      weak: masteries.filter(m => m.status === 'weak').length,
      not_started: masteries.filter(m => m.status === 'not_started').length,
    }

    const result: Record<string, unknown> = {
      masteries,
      summary: {
        totalTopics: masteries.length,
        weakTopicCount: weakTopics.length,
        strongTopicCount: strongTopics.length,
        averageMastery: Math.round(avgMastery),
        statusDistribution: statusDist,
        weakTopics: weakTopics.map(t => ({
          topicId: t.topicId,
          name: t.topicName,
          score: Math.round(t.masteryScore),
          status: t.status,
          trend: t.trend,
          questionsAttempted: t.questionsAttempted,
          questionsCorrect: t.questionsCorrect,
          breakdown: {
            quiz: Math.round(t.quizScore),
            assignment: Math.round(t.assignmentScore),
            practice: Math.round(t.practiceScore),
            completion: Math.round(t.completionScore),
          },
        })),
        strongTopics: strongTopics.map(t => ({
          topicId: t.topicId,
          name: t.topicName,
          score: Math.round(t.masteryScore),
          status: t.status,
          trend: t.trend,
        })),
      },
    }

    // Optionally include skill masteries
    if (include.includes('skills')) {
      result.skills = await computeSkillMasteries(userId)
    }

    // Optionally include intelligent insights
    if (include.includes('insights')) {
      result.insights = await getMasteryInsights(userId)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[ShijlAI Mastery GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/ai/shijlai/mastery - Update topic mastery
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId, topicId, topicName, courseId, skillId,
      quizScore, assignmentScore, practiceScore, completionScore,
      scoreDelta, questionsAttempted, questionsCorrect,
    } = body

    if (!userId || !topicId || !topicName) {
      return NextResponse.json({ error: 'userId, topicId, and topicName are required' }, { status: 400 })
    }

    const result = await updateTopicMastery({
      userId,
      topicId,
      topicName,
      courseId: courseId || undefined,
      skillId: skillId || undefined,
      quizScore: quizScore !== undefined ? Number(quizScore) : undefined,
      assignmentScore: assignmentScore !== undefined ? Number(assignmentScore) : undefined,
      practiceScore: practiceScore !== undefined ? Number(practiceScore) : undefined,
      completionScore: completionScore !== undefined ? Number(completionScore) : undefined,
      scoreDelta: scoreDelta !== undefined ? Number(scoreDelta) : undefined,
      questionsAttempted: questionsAttempted !== undefined ? Number(questionsAttempted) : undefined,
      questionsCorrect: questionsCorrect !== undefined ? Number(questionsCorrect) : undefined,
    })

    return NextResponse.json({ mastery: result })
  } catch (error) {
    console.error('[ShijlAI Mastery POST] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
