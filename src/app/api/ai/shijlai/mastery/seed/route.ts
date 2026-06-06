import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { computeWeightedMastery, getMasteryStatus } from '@/services/learning-engine/mastery-service'

/**
 * POST /api/ai/shijlai/mastery/seed
 * Seeds demo topic mastery data with weighted formula breakdowns
 * and skill-topic mappings for the Topic Mastery Engine
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = body.userId

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // ─── 1. Create Skill-Topic Mappings ───
    const skillMappings = [
      // Python Programming (topics: Variables, Loops, Functions, Classes)
      { skillId: 'python-programming', skillName: 'Python Programming', topicId: 'py-variables', topicName: 'Variables & Data Types', category: 'programming', weight: 1.0 },
      { skillId: 'python-programming', skillName: 'Python Programming', topicId: 'py-loops', topicName: 'Loops & Iteration', category: 'programming', weight: 1.0 },
      { skillId: 'python-programming', skillName: 'Python Programming', topicId: 'py-functions', topicName: 'Functions & Scope', category: 'programming', weight: 1.2 },
      { skillId: 'python-programming', skillName: 'Python Programming', topicId: 'py-classes', topicName: 'Classes & OOP', category: 'programming', weight: 1.5 },

      // Machine Learning (topics: Regression, Classification, Neural Networks, Evaluation Metrics)
      { skillId: 'machine-learning', skillName: 'Machine Learning', topicId: 'ml-regression', topicName: 'Regression', category: 'data', weight: 1.0 },
      { skillId: 'machine-learning', skillName: 'Machine Learning', topicId: 'ml-classification', topicName: 'Classification', category: 'data', weight: 1.2 },
      { skillId: 'machine-learning', skillName: 'Machine Learning', topicId: 'ml-neural-nets', topicName: 'Neural Networks', category: 'data', weight: 1.5 },
      { skillId: 'machine-learning', skillName: 'Machine Learning', topicId: 'ml-evaluation', topicName: 'Evaluation Metrics', category: 'data', weight: 1.0 },

      // Web Development (topics: HTML/CSS, JavaScript, React, APIs)
      { skillId: 'web-development', skillName: 'Web Development', topicId: 'web-html-css', topicName: 'HTML & CSS', category: 'web', weight: 0.8 },
      { skillId: 'web-development', skillName: 'Web Development', topicId: 'web-javascript', topicName: 'JavaScript', category: 'web', weight: 1.2 },
      { skillId: 'web-development', skillName: 'Web Development', topicId: 'web-react', topicName: 'React Components', category: 'web', weight: 1.5 },
      { skillId: 'web-development', skillName: 'Web Development', topicId: 'web-apis', topicName: 'APIs & Fetch', category: 'web', weight: 1.0 },

      // Mathematics (topics: Algebra, Calculus, Linear Algebra, Statistics)
      { skillId: 'mathematics', skillName: 'Mathematics', topicId: 'math-algebra', topicName: 'Algebra', category: 'math', weight: 1.0 },
      { skillId: 'mathematics', skillName: 'Mathematics', topicId: 'math-calculus', topicName: 'Calculus', category: 'math', weight: 1.2 },
      { skillId: 'mathematics', skillName: 'Mathematics', topicId: 'math-linear-algebra', topicName: 'Linear Algebra', category: 'math', weight: 1.0 },
      { skillId: 'mathematics', skillName: 'Mathematics', topicId: 'math-statistics', topicName: 'Statistics & Probability', category: 'math', weight: 1.0 },

      // Physics (topics: Mechanics, Thermodynamics, Electromagnetism, Optics)
      { skillId: 'physics', skillName: 'Physics', topicId: 'phys-mechanics', topicName: 'Mechanics', category: 'science', weight: 1.0 },
      { skillId: 'physics', skillName: 'Physics', topicId: 'phys-thermo', topicName: 'Thermodynamics', category: 'science', weight: 1.2 },
      { skillId: 'physics', skillName: 'Physics', topicId: 'phys-em', topicName: 'Electromagnetism', category: 'science', weight: 1.0 },
      { skillId: 'physics', skillName: 'Physics', topicId: 'phys-optics', topicName: 'Optics & Waves', category: 'science', weight: 0.8 },
    ]

    for (const sm of skillMappings) {
      await db.skillTopicMapping.upsert({
        where: { skillId_topicId: { skillId: sm.skillId, topicId: sm.topicId } },
        create: sm,
        update: { skillName: sm.skillName, topicName: sm.topicName, weight: sm.weight, category: sm.category },
      })
    }

    // ─── 2. Create Topic Mastery Records with Weighted Scores ───
    const topicMasteries = [
      // Python Programming topics
      { topicId: 'py-variables', topicName: 'Variables & Data Types', skillId: 'python-programming', quizScore: 90, assignmentScore: 92, practiceScore: 88, completionScore: 100, questionsAttempted: 25, questionsCorrect: 23 },
      { topicId: 'py-loops', topicName: 'Loops & Iteration', skillId: 'python-programming', quizScore: 85, assignmentScore: 88, practiceScore: 82, completionScore: 100, questionsAttempted: 20, questionsCorrect: 17 },
      { topicId: 'py-functions', topicName: 'Functions & Scope', skillId: 'python-programming', quizScore: 70, assignmentScore: 75, practiceScore: 68, completionScore: 85, questionsAttempted: 18, questionsCorrect: 13 },
      { topicId: 'py-classes', topicName: 'Classes & OOP', skillId: 'python-programming', quizScore: 40, assignmentScore: 45, practiceScore: 35, completionScore: 60, questionsAttempted: 15, questionsCorrect: 6, trend: 'declining' },

      // Machine Learning topics
      { topicId: 'ml-regression', topicName: 'Regression', skillId: 'machine-learning', quizScore: 82, assignmentScore: 90, practiceScore: 75, completionScore: 100, questionsAttempted: 20, questionsCorrect: 16 },
      { topicId: 'ml-classification', topicName: 'Classification', skillId: 'machine-learning', quizScore: 30, assignmentScore: 35, practiceScore: 25, completionScore: 50, questionsAttempted: 10, questionsCorrect: 3, trend: 'declining' },
      { topicId: 'ml-neural-nets', topicName: 'Neural Networks', skillId: 'machine-learning', quizScore: 22, assignmentScore: 18, practiceScore: 15, completionScore: 35, questionsAttempted: 8, questionsCorrect: 2, trend: 'declining' },
      { topicId: 'ml-evaluation', topicName: 'Evaluation Metrics', skillId: 'machine-learning', quizScore: 65, assignmentScore: 70, practiceScore: 60, completionScore: 80, questionsAttempted: 12, questionsCorrect: 8 },

      // Web Development topics
      { topicId: 'web-html-css', topicName: 'HTML & CSS', skillId: 'web-development', quizScore: 95, assignmentScore: 98, practiceScore: 90, completionScore: 100, questionsAttempted: 30, questionsCorrect: 29 },
      { topicId: 'web-javascript', topicName: 'JavaScript', skillId: 'web-development', quizScore: 72, assignmentScore: 78, practiceScore: 68, completionScore: 90, questionsAttempted: 22, questionsCorrect: 16, trend: 'improving' },
      { topicId: 'web-react', topicName: 'React Components', skillId: 'web-development', quizScore: 58, assignmentScore: 62, practiceScore: 50, completionScore: 70, questionsAttempted: 14, questionsCorrect: 8 },
      { topicId: 'web-apis', topicName: 'APIs & Fetch', skillId: 'web-development', quizScore: 45, assignmentScore: 50, practiceScore: 40, completionScore: 55, questionsAttempted: 10, questionsCorrect: 5 },

      // Mathematics topics
      { topicId: 'math-algebra', topicName: 'Algebra', skillId: 'mathematics', quizScore: 80, assignmentScore: 85, practiceScore: 78, completionScore: 95, questionsAttempted: 35, questionsCorrect: 28 },
      { topicId: 'math-calculus', topicName: 'Calculus', skillId: 'mathematics', quizScore: 42, assignmentScore: 48, practiceScore: 38, completionScore: 60, questionsAttempted: 18, questionsCorrect: 8, trend: 'declining' },
      { topicId: 'math-linear-algebra', topicName: 'Linear Algebra', skillId: 'mathematics', quizScore: 72, assignmentScore: 78, practiceScore: 70, completionScore: 85, questionsAttempted: 22, questionsCorrect: 16, trend: 'improving' },
      { topicId: 'math-statistics', topicName: 'Statistics & Probability', skillId: 'mathematics', quizScore: 55, assignmentScore: 60, practiceScore: 48, completionScore: 70, questionsAttempted: 16, questionsCorrect: 9 },

      // Physics topics
      { topicId: 'phys-mechanics', topicName: 'Mechanics', skillId: 'physics', quizScore: 68, assignmentScore: 72, practiceScore: 65, completionScore: 80, questionsAttempted: 20, questionsCorrect: 14 },
      { topicId: 'phys-thermo', topicName: 'Thermodynamics', skillId: 'physics', quizScore: 38, assignmentScore: 42, practiceScore: 30, completionScore: 50, questionsAttempted: 12, questionsCorrect: 5, trend: 'declining' },
      { topicId: 'phys-em', topicName: 'Electromagnetism', skillId: 'physics', quizScore: 55, assignmentScore: 60, practiceScore: 50, completionScore: 65, questionsAttempted: 14, questionsCorrect: 8 },
      { topicId: 'phys-optics', topicName: 'Optics & Waves', skillId: 'physics', quizScore: 48, assignmentScore: 52, practiceScore: 42, completionScore: 55, questionsAttempted: 10, questionsCorrect: 5 },
    ]

    for (const tm of topicMasteries) {
      const masteryScore = computeWeightedMastery({
        quizScore: tm.quizScore,
        assignmentScore: tm.assignmentScore,
        practiceScore: tm.practiceScore,
        completionScore: tm.completionScore,
      })

      await db.topicMastery.upsert({
        where: { userId_topicId: { userId, topicId: tm.topicId } },
        create: {
          userId,
          topicId: tm.topicId,
          topicName: tm.topicName,
          skillId: tm.skillId,
          quizScore: tm.quizScore,
          assignmentScore: tm.assignmentScore,
          practiceScore: tm.practiceScore,
          completionScore: tm.completionScore,
          masteryScore,
          status: getMasteryStatus(masteryScore),
          questionsAttempted: tm.questionsAttempted,
          questionsCorrect: tm.questionsCorrect,
          attemptCount: tm.questionsAttempted,
          lastAttempted: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          trend: (tm as { trend?: string }).trend || (masteryScore > 70 ? 'improving' : masteryScore < 40 ? 'declining' : 'stable'),
        },
        update: {
          topicName: tm.topicName,
          skillId: tm.skillId,
          quizScore: tm.quizScore,
          assignmentScore: tm.assignmentScore,
          practiceScore: tm.practiceScore,
          completionScore: tm.completionScore,
          masteryScore,
          status: getMasteryStatus(masteryScore),
          questionsAttempted: tm.questionsAttempted,
          questionsCorrect: tm.questionsCorrect,
          attemptCount: tm.questionsAttempted,
        },
      })
    }

    return NextResponse.json({
      success: true,
      seeded: {
        skillMappings: skillMappings.length,
        topicMasteries: topicMasteries.length,
      },
    })
  } catch (error) {
    console.error('[Mastery Seed] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
