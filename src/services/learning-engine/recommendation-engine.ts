import { db } from '@/lib/db'
import { getWeakTopics, getStrongTopics, getAllMasteries } from './mastery-service'
import { getOrCreateProfile } from './profile-service'

/**
 * Recommendation Engine - Generates adaptive learning paths
 * Step 1: Identify weak areas
 * Step 2: Map prerequisites
 * Step 3: Apply recommendation rules
 * Step 4: Score and prioritize
 */

interface RecommendationInput {
  userId: string
  sourceEvent?: string
  sourceData?: Record<string, unknown>
}

export async function generateRecommendations(input: RecommendationInput) {
  const { userId, sourceEvent, sourceData } = input

  try {
    const [profile, weakTopics, strongTopicsList, allMasteries] = await Promise.all([
      getOrCreateProfile(userId),
      getWeakTopics(userId, 50),
      getStrongTopics(userId, 75),
      getAllMasteries(userId),
    ])

    const recommendations: Array<{
      type: string
      title: string
      description: string
      reason: string
      recommendedTopicId?: string
      recommendedCourseId?: string
      priority: string
      priorityScore: number
      relatedId?: string
      relatedType?: string
    }> = []

    // STEP 1: Recommendations based on weak topics
    for (const topic of weakTopics.slice(0, 5)) {
      const masteryScore = topic.masteryScore

      // STEP 3: Apply recommendation rules based on performance level
      if (masteryScore < 30) {
        // Very weak: recommend basics + prerequisites + practice quizzes
        recommendations.push({
          type: 'topic',
          title: `Review ${topic.topicName} Basics`,
          description: `Your mastery of ${topic.topicName} is very low (${Math.round(masteryScore)}%). Start with the fundamentals and build up.`,
          reason: `You scored ${Math.round(masteryScore)}% in ${topic.topicName} — focus on basics first`,
          recommendedTopicId: topic.topicId,
          recommendedCourseId: topic.courseId || undefined,
          priority: 'high',
          priorityScore: computePriorityScore(masteryScore, 0, profile.engagementScore, 100),
        })
        recommendations.push({
          type: 'quiz',
          title: `Practice Quiz: ${topic.topicName}`,
          description: `Take a practice quiz to reinforce your understanding of ${topic.topicName} fundamentals.`,
          reason: `Practice quizzes help build foundational knowledge in ${topic.topicName}`,
          recommendedTopicId: topic.topicId,
          priority: 'high',
          priorityScore: computePriorityScore(masteryScore, 0, profile.engagementScore, 80),
        })
      } else if (masteryScore < 50) {
        // Weak: recommend intermediate content + revision
        recommendations.push({
          type: 'lesson',
          title: `Revise ${topic.topicName}`,
          description: `You have partial understanding of ${topic.topicName} (${Math.round(masteryScore)}%). Review key concepts to strengthen your grasp.`,
          reason: `Your ${topic.topicName} mastery is ${Math.round(masteryScore)}% — targeted revision will help`,
          recommendedTopicId: topic.topicId,
          recommendedCourseId: topic.courseId || undefined,
          priority: 'medium',
          priorityScore: computePriorityScore(masteryScore, 20, profile.engagementScore, 60),
        })
      }
    }

    // STEP 2: Prerequisite recommendations (find gaps in learning path)
    const enrolledCourses = await db.enrollment.findMany({
      where: { userId, status: 'active' },
      include: { course: { include: { modules: { include: { lessons: true } } } } },
      take: 5,
    })

    for (const enrollment of enrolledCourses) {
      const course = enrollment.course
      if (!course) continue

      // Find incomplete modules in enrolled courses
      for (const courseModule of course.modules) {
        const moduleMastery = allMasteries.find(m => m.topicId === `module-${courseModule.id}`)
        if (moduleMastery && moduleMastery.masteryScore < 40) {
          recommendations.push({
            type: 'lesson',
            title: `Continue: ${courseModule.title}`,
            description: `Complete the lessons in ${courseModule.title} module of ${course.title}.`,
            reason: `This module in ${course.title} needs attention (${Math.round(moduleMastery.masteryScore)}% mastery)`,
            recommendedTopicId: `module-${courseModule.id}`,
            recommendedCourseId: course.id,
            relatedId: course.id,
            relatedType: 'course',
            priority: 'high',
            priorityScore: computePriorityScore(moduleMastery.masteryScore, 30, profile.engagementScore, 70),
          })
        }
      }
    }

    // Recommendations for strong topics: advance to next level
    for (const topic of strongTopicsList.slice(0, 3)) {
      recommendations.push({
        type: 'course',
        title: `Advanced ${topic.topicName}`,
        description: `You've mastered the basics of ${topic.topicName}. Ready for more advanced content?`,
        reason: `Your ${topic.topicName} mastery is ${Math.round(topic.masteryScore)}% — you're ready for the next level`,
        recommendedTopicId: topic.topicId,
        priority: 'low',
        priorityScore: computePriorityScore(100 - topic.masteryScore, 50, profile.engagementScore, 30),
      })
    }

    // Drop risk recommendations
    if (profile.dropRiskScore > 60) {
      recommendations.push({
        type: 'study_plan',
        title: 'Create a Study Plan',
        description: 'Your activity has decreased recently. A structured study plan can help you stay on track.',
        reason: `Your drop risk is ${Math.round(profile.dropRiskScore)}% — a study plan can help`,
        priority: 'high',
        priorityScore: 85,
      })
    } else if (profile.dropRiskScore > 30) {
      recommendations.push({
        type: 'study_plan',
        title: 'Review Your Study Schedule',
        description: 'Your engagement has been declining. Consider adjusting your study schedule.',
        reason: `Your engagement is declining — small adjustments can make a big difference`,
        priority: 'medium',
        priorityScore: 60,
      })
    }

    // Sort by priority score descending
    recommendations.sort((a, b) => b.priorityScore - a.priorityScore)

    // Save top recommendations to DB (limit to top 5)
    const savedRecommendations = []
    for (const rec of recommendations.slice(0, 5)) {
      try {
        // Check if similar recommendation already exists
        const existing = await db.aIRecommendation.findFirst({
          where: {
            userId,
            type: rec.type,
            title: rec.title,
            status: 'active',
          },
        })
        if (existing) continue // Don't duplicate

        const saved = await db.aIRecommendation.create({
          data: {
            userId,
            type: rec.type,
            title: rec.title,
            description: rec.description,
            reason: rec.reason,
            recommendedTopicId: rec.recommendedTopicId || null,
            recommendedCourseId: rec.recommendedCourseId || null,
            relatedId: rec.relatedId || null,
            relatedType: rec.relatedType || null,
            priority: rec.priority,
            priorityScore: rec.priorityScore,
            status: 'active',
            sourceEvent: sourceEvent || 'engine_computed',
            sourceData: sourceData ? JSON.stringify(sourceData) : null,
          },
        })
        savedRecommendations.push(saved)
      } catch {
        // Skip invalid recs
      }
    }

    return savedRecommendations
  } catch (error) {
    console.error('[RecommendationEngine] Error:', error)
    return []
  }
}

// STEP 4: Priority scoring formula
function computePriorityScore(
  weaknessWeight: number, // 0-100 (higher = more weak)
  careerRelevance: number, // 0-100
  engagementMatch: number, // 0-100
  recencyNeed: number // 0-100
): number {
  return Math.round(
    (weaknessWeight * 0.4) +
    (careerRelevance * 0.2) +
    (engagementMatch * 0.2) +
    (recencyNeed * 0.2)
  )
}
