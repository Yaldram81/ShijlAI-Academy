import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  computeEngagementScore,
  computeConsistencyScore,
  computeDropRisk,
  computeAveragePerformance,
} from '@/services/learning-engine'
import { getWeakTopics } from '@/services/learning-engine'
import { AIService } from '@/services/ai'

// GET /api/ai/shijlai/insights?userId=xxx&category=xxx&isRead=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const category = searchParams.get('category')
    const isReadStr = searchParams.get('isRead')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = { userId }
    if (category) where.category = category
    if (isReadStr !== null && isReadStr !== undefined) {
      where.isRead = isReadStr === 'true'
    }

    const insights = await db.learningInsight.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ insights })
  } catch (error) {
    console.error('[ShijlAI Insights GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/ai/shijlai/insights
// Generate actionable insights from computed metrics
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Compute metrics using the feature engine
    const [engagementScore, consistencyScore, dropRiskScore, averagePerformance] =
      await Promise.all([
        computeEngagementScore(userId),
        computeConsistencyScore(userId),
        computeDropRisk(userId),
        computeAveragePerformance(userId),
      ])

    // Get profile data
    const profile = await db.studentLearningProfile.findUnique({
      where: { studentId: userId },
    })

    // Get weak topics for insights
    const weakTopics = await getWeakTopics(userId)

    // Get recent events for trend analysis
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentActivities = await db.studentAIActivity.findMany({
      where: { userId, createdAt: { gte: last7Days } },
    })
    const previousWeekActivities = await db.studentAIActivity.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(last7Days.getTime() - 7 * 24 * 60 * 60 * 1000),
          lt: last7Days,
        },
      },
    })

    // Get quiz and enrollment data
    const quizAttempts = await db.quizAttempt.findMany({
      where: { userId, completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      take: 10,
    })
    const enrollments = await db.enrollment.findMany({
      where: { userId },
      include: { course: true },
      take: 10,
    })

    const studentData = {
      level: profile?.learningLevel || 'beginner',
      engagementScore,
      consistencyScore,
      dropRiskScore,
      avgQuizScore: averagePerformance,
      learningSpeedScore: profile?.learningSpeedScore || 0,
      completionRate: profile?.completionRate || 0,
      weakTopics: profile?.weakTopics || '[]',
      strongTopics: profile?.strongTopics || '[]',
      learningSpeed: profile?.learningSpeed || 'moderate',
      studyStreak: profile?.studyStreakDays || 0,
      xp: profile?.totalXpEarned || 0,
      enrolledCourses: enrollments.length,
      completedCourses: enrollments.filter(e => e.status === 'completed').length,
      quizPassRate: quizAttempts.length > 0
        ? (quizAttempts.filter(q => q.passed).length / quizAttempts.length) * 100
        : 0,
      recentQuizScores: quizAttempts.slice(0, 5).map(q => q.percentage),
      activitiesThisWeek: recentActivities.length,
      activitiesLastWeek: previousWeekActivities.length,
      weakMasteryTopics: weakTopics.slice(0, 5).map(t => ({
        name: t.topicName,
        score: t.masteryScore,
        trend: t.trend,
      })),
    }

    // Generate rule-based insights from computed metrics
    const ruleBasedInsights = generateRuleBasedInsights(studentData)

    // Try LLM enhancement
    let llmInsights: Array<Record<string, unknown>> = []
    try {
      llmInsights = await AIService.generateJSON<Array<Record<string, unknown>>>({
        systemPrompt: `You are a learning analytics engine for ShijlAI Academy. Analyze the student's data and generate 2-4 additional learning insights. Focus on actionable insights from the computed metrics (engagement, consistency, drop risk, performance). Each insight should have: type (strength, weakness, trend, suggestion, warning, or achievement), title, description, category (general, academic, study_habits, time_management, or quiz_performance), severity (info, warning, or critical), isActionable (boolean), actionSuggestion (string with specific advice). Return as a JSON array.`,
        messages: [
          {
            role: 'user',
            content: `Student data: ${JSON.stringify(studentData)}`,
          },
        ],
        complexity: 'fast',
        feature: 'learning_insights',
        userId,
      })
    } catch (llmError) {
      console.warn('[ShijlAI Insights] LLM generation failed, using rule-based only:', llmError)
    }

    // Combine rule-based and LLM insights
    const allInsights = [...ruleBasedInsights, ...llmInsights]

    // Save insights to DB
    const savedInsights = []
    for (const insight of allInsights) {
      try {
        const saved = await db.learningInsight.create({
          data: {
            userId,
            type: (insight.type as string) || 'suggestion',
            title: (insight.title as string) || 'Insight',
            description: (insight.description as string) || '',
            category: (insight.category as string) || 'general',
            severity: (insight.severity as string) || 'info',
            isActionable: (insight.isActionable as boolean) !== false,
            actionSuggestion: insight.actionSuggestion as string || null,
            relatedData: JSON.stringify(studentData),
          },
        })
        savedInsights.push(saved)
      } catch {
        // Skip invalid insights
      }
    }

    // Log activity
    await db.studentAIActivity.create({
      data: {
        userId,
        activityType: 'insight_viewed',
        metadata: JSON.stringify({ count: savedInsights.length }),
      },
    })

    return NextResponse.json({ insights: savedInsights, generated: savedInsights.length })
  } catch (error) {
    console.error('[ShijlAI Insights POST] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Generate rule-based insights from computed metrics
 * Includes drop risk warnings, engagement trends, study suggestions
 */
function generateRuleBasedInsights(data: {
  engagementScore: number
  consistencyScore: number
  dropRiskScore: number
  avgQuizScore: number
  learningSpeedScore: number
  completionRate: number
  studyStreak: number
  weakMasteryTopics: Array<{ name: string; score: number; trend: string }>
  activitiesThisWeek: number
  activitiesLastWeek: number
  enrolledCourses: number
  completedCourses: number
  quizPassRate: number
}): Array<Record<string, unknown>> {
  const insights: Array<Record<string, unknown>> = []

  // Drop risk warning
  if (data.dropRiskScore > 60) {
    insights.push({
      type: 'warning',
      title: 'High Drop Risk Detected',
      description: `Your drop risk score is ${Math.round(data.dropRiskScore)}/100. This indicates you may be at risk of disengaging from your courses. Consistency and engagement have been low recently.`,
      category: 'study_habits',
      severity: 'critical',
      isActionable: true,
      actionSuggestion: 'Set a daily study reminder, even 15 minutes helps. Focus on one course at a time and try to complete at least one lesson daily.',
    })
  } else if (data.dropRiskScore > 30) {
    insights.push({
      type: 'warning',
      title: 'Moderate Drop Risk',
      description: `Your drop risk score is ${Math.round(data.dropRiskScore)}/100. There are some signs of reduced engagement that could lead to dropping out if not addressed.`,
      category: 'study_habits',
      severity: 'warning',
      isActionable: true,
      actionSuggestion: 'Try to maintain a consistent study schedule. Even short daily sessions are more effective than occasional long ones.',
    })
  }

  // Engagement trend
  const activityChange = data.activitiesLastWeek > 0
    ? ((data.activitiesThisWeek - data.activitiesLastWeek) / data.activitiesLastWeek) * 100
    : data.activitiesThisWeek > 0 ? 100 : 0

  if (activityChange < -30) {
    insights.push({
      type: 'trend',
      title: 'Engagement Declining',
      description: `Your activity this week is ${Math.abs(Math.round(activityChange))}% lower than last week. Staying consistent is key to learning success.`,
      category: 'study_habits',
      severity: 'warning',
      isActionable: true,
      actionSuggestion: 'Set a specific time each day for studying. Use the study planner to create a manageable schedule.',
    })
  } else if (activityChange > 30) {
    insights.push({
      type: 'achievement',
      title: 'Engagement Improving',
      description: `Your activity this week is ${Math.round(activityChange)}% higher than last week. Keep up the great work!`,
      category: 'study_habits',
      severity: 'info',
      isActionable: false,
      actionSuggestion: 'Maintain this momentum. Consider setting slightly more challenging goals.',
    })
  }

  // Weak topics insight
  if (data.weakMasteryTopics.length > 0) {
    const weakestTopic = data.weakMasteryTopics[0]
    insights.push({
      type: 'weakness',
      title: `Weak Topic: ${weakestTopic.name}`,
      description: `Your mastery of "${weakestTopic.name}" is only ${Math.round(weakestTopic.score)}%. ${weakestTopic.trend === 'declining' ? 'This topic is declining - review it soon!' : weakestTopic.trend === 'improving' ? 'You are improving but still have work to do.' : 'Focus on building a stronger foundation here.'}`,
      category: 'academic',
      severity: weakestTopic.score < 30 ? 'critical' : 'warning',
      isActionable: true,
      actionSuggestion: `Start with the basics of ${weakestTopic.name}. Use practice quizzes and review lessons. Consider asking ShijlAI for help with specific concepts.`,
    })
  }

  // Study streak suggestion
  if (data.studyStreak < 3) {
    insights.push({
      type: 'suggestion',
      title: 'Build Your Study Streak',
      description: `Your current study streak is ${data.studyStreak} days. Building a streak helps maintain consistency and improves learning outcomes.`,
      category: 'time_management',
      severity: 'info',
      isActionable: true,
      actionSuggestion: 'Aim to study at least 15 minutes every day. Even a single lesson or quiz counts towards your streak.',
    })
  } else if (data.studyStreak >= 7) {
    insights.push({
      type: 'achievement',
      title: `${data.studyStreak}-Day Study Streak!`,
      description: `You've maintained a ${data.studyStreak}-day study streak. Consistent practice leads to better retention and understanding.`,
      category: 'study_habits',
      severity: 'info',
      isActionable: false,
      actionSuggestion: 'Keep going! You might qualify for streak rewards soon.',
    })
  }

  // Quiz performance insight
  if (data.quizPassRate < 50 && data.avgQuizScore > 0) {
    insights.push({
      type: 'weakness',
      title: 'Quiz Performance Needs Improvement',
      description: `Your quiz pass rate is ${Math.round(data.quizPassRate)}%. Reviewing failed quizzes and understanding mistakes will help improve your scores.`,
      category: 'quiz_performance',
      severity: 'warning',
      isActionable: true,
      actionSuggestion: 'Review the explanations for incorrect answers. Focus on understanding concepts rather than memorizing. Use ShijlAI in quiz mode for targeted practice.',
    })
  }

  // Completion rate insight
  if (data.completionRate < 30 && data.enrolledCourses > 1) {
    insights.push({
      type: 'suggestion',
      title: 'Focus on Course Completion',
      description: `You've completed ${Math.round(data.completionRate)}% of your enrolled courses. Consider focusing on finishing one course before starting new ones.`,
      category: 'time_management',
      severity: 'info',
      isActionable: true,
      actionSuggestion: 'Pick the course you\'re closest to completing and dedicate study time to it. Set a target completion date.',
    })
  }

  // Consistency insight
  if (data.consistencyScore < 30) {
    insights.push({
      type: 'weakness',
      title: 'Low Study Consistency',
      description: `Your consistency score is ${Math.round(data.consistencyScore)}/100. Irregular study patterns make it harder to retain information and build skills.`,
      category: 'study_habits',
      severity: 'warning',
      isActionable: true,
      actionSuggestion: 'Try to study at the same time every day. Use the study planner to create a consistent schedule. Even 20 minutes daily is better than 2 hours once a week.',
    })
  }

  return insights
}

// PATCH /api/ai/shijlai/insights
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { insightId, isRead } = body

    if (!insightId) {
      return NextResponse.json({ error: 'insightId is required' }, { status: 400 })
    }

    const insight = await db.learningInsight.findUnique({ where: { id: insightId } })
    if (!insight) {
      return NextResponse.json({ error: 'Insight not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (isRead !== undefined) {
      updateData.isRead = isRead
    }

    const updatedInsight = await db.learningInsight.update({
      where: { id: insightId },
      data: updateData,
    })

    return NextResponse.json({ insight: updatedInsight })
  } catch (error) {
    console.error('[ShijlAI Insights PATCH] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
