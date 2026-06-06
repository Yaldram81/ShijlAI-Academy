import { db } from '@/lib/db'
import { computeLearningSpeed, computeEngagementScore, computeConsistencyScore, computeAveragePerformance, computeDropRisk } from './feature-engine'
import { getWeakTopics, getStrongTopics, applyTimeDecay } from './mastery-service'

/**
 * Profile Service - Student profile builder/updater
 * Calls feature-engine to compute metrics, then updates the StudentLearningProfile
 */

export async function getOrCreateProfile(userId: string) {
  let profile = await db.studentLearningProfile.findUnique({ where: { studentId: userId } })

  if (!profile) {
    profile = await db.studentLearningProfile.create({
      data: { studentId: userId },
    })
    // Immediately compute metrics
    profile = await updateStudentProfile(userId)
  }

  return profile
}

export async function updateStudentProfile(userId: string) {
  try {
    // Ensure profile exists
    let profile = await db.studentLearningProfile.findUnique({ where: { studentId: userId } })
    if (!profile) {
      profile = await db.studentLearningProfile.create({
        data: { studentId: userId },
      })
    }

    // Don't recompute too frequently (at most once per 5 minutes)
    if (profile.lastComputedAt) {
      const minutesSinceLastCompute = (Date.now() - new Date(profile.lastComputedAt).getTime()) / (1000 * 60)
      if (minutesSinceLastCompute < 5) {
        return profile
      }
    }

    // Run feature engine computations in parallel
    const [learningSpeedScore, engagementScore, consistencyScore, averagePerformance, dropRiskScore] = await Promise.all([
      computeLearningSpeed(userId),
      computeEngagementScore(userId),
      computeConsistencyScore(userId),
      computeAveragePerformance(userId),
      computeDropRisk(userId),
    ])

    // Apply time decay to topic mastery
    await applyTimeDecay(userId)

    // Get weak/strong topics from mastery data
    const weakTopicsList = await getWeakTopics(userId, 50)
    const strongTopicsList = await getStrongTopics(userId, 75)

    const weakTopics = weakTopicsList.map(t => t.topicName)
    const strongTopics = strongTopicsList.map(t => t.topicName)

    // If no mastery data yet, fall back to enrollment-based topics
    if (weakTopics.length === 0 && strongTopics.length === 0) {
      const enrollments = await db.enrollment.findMany({
        where: { userId },
        include: { course: true },
      })
      const categoryProgress: Record<string, { total: number; completed: number }> = {}
      for (const e of enrollments) {
        if (e.course?.category) {
          const cat = e.course.category
          if (!categoryProgress[cat]) categoryProgress[cat] = { total: 0, completed: 0 }
          categoryProgress[cat].total += 1
          if (e.status === 'completed') categoryProgress[cat].completed += 1
        }
      }
      for (const [topic, data] of Object.entries(categoryProgress)) {
        const rate = data.total > 0 ? (data.completed / data.total) * 100 : 0
        if (rate < 50) weakTopics.push(topic)
        else if (rate >= 80) strongTopics.push(topic)
      }
    }

    // Determine learning level
    let learningLevel = 'beginner'
    if (averagePerformance > 80 && engagementScore > 60) learningLevel = 'advanced'
    else if (averagePerformance > 60 || engagementScore > 40) learningLevel = 'intermediate'

    // Determine learning speed label
    let learningSpeed = 'moderate'
    if (learningSpeedScore > 70) learningSpeed = 'fast'
    else if (learningSpeedScore < 30) learningSpeed = 'slow'

    // Get basic stats
    const enrollments = await db.enrollment.findMany({
      where: { userId },
      include: { lessonProgress: true },
    })
    const quizAttempts = await db.quizAttempt.findMany({
      where: { userId, completedAt: { not: null } },
    })
    const user = await db.user.findUnique({ where: { id: userId } })

    const totalLessonsCompleted = enrollments.reduce(
      (sum, e) => sum + e.lessonProgress.filter(lp => lp.status === 'completed').length,
      0
    )
    const totalTimeSpent = enrollments.reduce(
      (sum, e) => sum + e.lessonProgress.reduce((lpSum, lp) => lpSum + lp.timeSpent, 0),
      0
    )

    // Update the profile
    profile = await db.studentLearningProfile.update({
      where: { studentId: userId },
      data: {
        learningLevel,
        engagementScore,
        consistencyScore,
        learningSpeedScore,
        dropRiskScore,
        completionRate: enrollments.length > 0
          ? (enrollments.filter(e => e.status === 'completed').length / enrollments.length) * 100
          : 0,
        averageQuizScore: averagePerformance,
        weakTopics: JSON.stringify(weakTopics),
        strongTopics: JSON.stringify(strongTopics),
        learningSpeed,
        totalXpEarned: user?.xp || 0,
        totalLessonsCompleted,
        totalQuizzesTaken: quizAttempts.length,
        totalTimeSpent,
        studyStreakDays: user?.streak || 0,
        lastComputedAt: new Date(),
      },
    })

    return profile
  } catch (error) {
    console.error('[ProfileService] Error updating profile:', error)
    // Return existing profile even if update fails
    return await db.studentLearningProfile.findUnique({ where: { studentId: userId } }) ||
      await db.studentLearningProfile.create({ data: { studentId: userId } })
  }
}
