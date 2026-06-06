import { db } from '@/lib/db'

/**
 * Mastery Service - Topic Mastery Engine with weighted formula
 *
 * Architecture:
 *   Questions → Topic Mastery → Skill Mastery → Learning Outcomes → Recommendations → Ask ShijlAI
 *
 * Weighted Formula:
 *   masteryScore = quizScore * 0.50 + assignmentScore * 0.25 + practiceScore * 0.15 + completionScore * 0.10
 *
 * Status Labels:
 *   0-25%    → not_started
 *   25-50%   → weak
 *   50-75%   → learning
 *   75-90%   → strong
 *   90-100%  → mastered
 */

// ─── Weighted formula constants ───
const QUIZ_WEIGHT = 0.50
const ASSIGNMENT_WEIGHT = 0.25
const PRACTICE_WEIGHT = 0.15
const COMPLETION_WEIGHT = 0.10

/**
 * Compute the weighted mastery score from component scores
 */
export function computeWeightedMastery(params: {
  quizScore: number
  assignmentScore: number
  practiceScore: number
  completionScore: number
}): number {
  const { quizScore, assignmentScore, practiceScore, completionScore } = params
  return Math.min(100, Math.max(0,
    quizScore * QUIZ_WEIGHT +
    assignmentScore * ASSIGNMENT_WEIGHT +
    practiceScore * PRACTICE_WEIGHT +
    completionScore * COMPLETION_WEIGHT
  ))
}

/**
 * Convert mastery score to status label
 */
export function getMasteryStatus(score: number): string {
  if (score >= 90) return 'mastered'
  if (score >= 75) return 'strong'
  if (score >= 50) return 'learning'
  if (score >= 25) return 'weak'
  return 'not_started'
}

/**
 * Get human-readable status label with emoji
 */
export function getStatusDisplay(status: string): { label: string; emoji: string; color: string } {
  switch (status) {
    case 'mastered': return { label: 'Mastered', emoji: '🟢', color: 'emerald' }
    case 'strong': return { label: 'Strong', emoji: '🔵', color: 'blue' }
    case 'learning': return { label: 'Learning', emoji: '🟡', color: 'amber' }
    case 'weak': return { label: 'Weak', emoji: '🔴', color: 'red' }
    default: return { label: 'Not Started', emoji: '⚪', color: 'slate' }
  }
}

interface UpdateMasteryParams {
  userId: string
  topicId: string
  topicName: string
  courseId?: string
  skillId?: string
  // Component score updates (pass only what changed)
  quizScore?: number
  assignmentScore?: number
  practiceScore?: number
  completionScore?: number
  // Legacy support: simple score delta
  scoreDelta?: number
  // Question tracking
  questionsAttempted?: number
  questionsCorrect?: number
}

/**
 * Update topic mastery with weighted formula
 * Either pass individual component scores, or a simple scoreDelta for backward compat
 */
export async function updateTopicMastery(params: UpdateMasteryParams) {
  const {
    userId, topicId, topicName, courseId, skillId,
    quizScore, assignmentScore, practiceScore, completionScore,
    scoreDelta, questionsAttempted, questionsCorrect,
  } = params

  try {
    const existing = await db.topicMastery.findUnique({
      where: { userId_topicId: { userId, topicId } },
    })

    if (existing) {
      // Compute new component scores
      let newQuiz = existing.quizScore
      let newAssignment = existing.assignmentScore
      let newPractice = existing.practiceScore
      let newCompletion = existing.completionScore

      if (quizScore !== undefined) newQuiz = Math.min(100, Math.max(0, quizScore))
      if (assignmentScore !== undefined) newAssignment = Math.min(100, Math.max(0, assignmentScore))
      if (practiceScore !== undefined) newPractice = Math.min(100, Math.max(0, practiceScore))
      if (completionScore !== undefined) newCompletion = Math.min(100, Math.max(0, completionScore))

      // Legacy: if scoreDelta is provided, apply to quizScore as main driver
      if (scoreDelta !== undefined && quizScore === undefined) {
        newQuiz = Math.min(100, Math.max(0, existing.quizScore + scoreDelta))
      }

      const newMasteryScore = computeWeightedMastery({
        quizScore: newQuiz,
        assignmentScore: newAssignment,
        practiceScore: newPractice,
        completionScore: newCompletion,
      })

      // Determine trend
      let trend = 'stable'
      if (newMasteryScore > existing.masteryScore + 2) trend = 'improving'
      else if (newMasteryScore < existing.masteryScore - 2) trend = 'declining'

      const newStatus = getMasteryStatus(newMasteryScore)

      return db.topicMastery.update({
        where: { id: existing.id },
        data: {
          quizScore: newQuiz,
          assignmentScore: newAssignment,
          practiceScore: newPractice,
          completionScore: newCompletion,
          masteryScore: newMasteryScore,
          status: newStatus,
          trend,
          attemptCount: { increment: 1 },
          lastAttempted: new Date(),
          decayApplied: false,
          courseId: courseId || existing.courseId,
          skillId: skillId || existing.skillId,
          questionsAttempted: questionsAttempted ? { increment: questionsAttempted } : existing.questionsAttempted,
          questionsCorrect: questionsCorrect ? { increment: questionsCorrect } : existing.questionsCorrect,
        },
      })
    } else {
      // Create new mastery record
      const qs = quizScore ?? (scoreDelta ? Math.min(100, Math.max(0, scoreDelta)) : 0)
      const as = assignmentScore ?? 0
      const ps = practiceScore ?? 0
      const cs = completionScore ?? 0
      const masteryScore = computeWeightedMastery({ quizScore: qs, assignmentScore: as, practiceScore: ps, completionScore: cs })
      const status = getMasteryStatus(masteryScore)

      return db.topicMastery.create({
        data: {
          userId,
          topicId,
          topicName,
          courseId: courseId || null,
          skillId: skillId || null,
          quizScore: qs,
          assignmentScore: as,
          practiceScore: ps,
          completionScore: cs,
          masteryScore,
          status,
          questionsAttempted: questionsAttempted ?? 0,
          questionsCorrect: questionsCorrect ?? 0,
          attemptCount: 1,
          lastAttempted: new Date(),
          trend: 'stable',
        },
      })
    }
  } catch (error) {
    console.error('[MasteryService] Error updating topic mastery:', error)
    return null
  }
}

/**
 * Apply time decay to topics not recently attempted
 * Decay factor: 0.5% per day since last attempt (after 7 days)
 */
export async function applyTimeDecay(userId: string): Promise<number> {
  try {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const staleTopics = await db.topicMastery.findMany({
      where: {
        userId,
        lastAttempted: { lt: sevenDaysAgo },
        masteryScore: { gt: 0 },
      },
    })

    let decayed = 0
    for (const topic of staleTopics) {
      const daysSinceLastAttempt = Math.floor(
        (now.getTime() - new Date(topic.lastAttempted).getTime()) / (1000 * 60 * 60 * 24)
      )
      const decayDays = Math.max(0, daysSinceLastAttempt - 7)
      const decayAmount = decayDays * 0.5 // 0.5% per day

      // Apply decay proportionally to all component scores
      const decayFactor = 1 - (decayAmount / 100)
      const newQuiz = Math.max(0, topic.quizScore * decayFactor)
      const newAssignment = Math.max(0, topic.assignmentScore * decayFactor)
      const newPractice = Math.max(0, topic.practiceScore * decayFactor)
      const newCompletion = Math.max(0, topic.completionScore * decayFactor)

      const newMasteryScore = computeWeightedMastery({
        quizScore: newQuiz,
        assignmentScore: newAssignment,
        practiceScore: newPractice,
        completionScore: newCompletion,
      })

      const trend = newMasteryScore < topic.masteryScore - 2 ? 'declining' : topic.trend
      const status = getMasteryStatus(newMasteryScore)

      await db.topicMastery.update({
        where: { id: topic.id },
        data: {
          quizScore: newQuiz,
          assignmentScore: newAssignment,
          practiceScore: newPractice,
          completionScore: newCompletion,
          masteryScore: newMasteryScore,
          status,
          trend,
          decayApplied: true,
        },
      })
      decayed++
    }

    return decayed
  } catch (error) {
    console.error('[MasteryService] Error applying time decay:', error)
    return 0
  }
}

export async function getWeakTopics(userId: string, threshold = 50) {
  return db.topicMastery.findMany({
    where: {
      userId,
      masteryScore: { lt: threshold },
    },
    orderBy: { masteryScore: 'asc' },
    take: 10,
  })
}

export async function getStrongTopics(userId: string, threshold = 75) {
  return db.topicMastery.findMany({
    where: {
      userId,
      masteryScore: { gte: threshold },
    },
    orderBy: { masteryScore: 'desc' },
    take: 10,
  })
}

export async function getAllMasteries(userId: string, courseId?: string) {
  const where: Record<string, unknown> = { userId }
  if (courseId) where.courseId = courseId
  return db.topicMastery.findMany({
    where,
    orderBy: { masteryScore: 'asc' },
  })
}

/**
 * Compute skill mastery from constituent topic masteries
 * Skill Score = weighted average of topic scores (using SkillTopicMapping weights)
 */
export async function computeSkillMasteries(userId: string) {
  try {
    // Get all topic masteries for this user
    const topicMasteries = await db.topicMastery.findMany({ where: { userId } })

    if (topicMasteries.length === 0) return []

    // Get all skill-topic mappings
    const mappings = await db.skillTopicMapping.findMany()

    if (mappings.length === 0) {
      // No mappings defined yet — auto-group by skillId if set on topicMastery
      const skillGroups: Record<string, { skillId: string; skillName: string; topics: typeof topicMasteries }> = {}
      for (const tm of topicMasteries) {
        const sid = tm.skillId || tm.topicId
        const sname = tm.skillId ? tm.topicName : tm.topicName
        if (!skillGroups[sid]) {
          skillGroups[sid] = { skillId: sid, skillName: sname, topics: [] }
        }
        skillGroups[sid].topics.push(tm)
      }

      return Object.values(skillGroups).map(sg => {
        const avgScore = sg.topics.reduce((sum, t) => sum + t.masteryScore, 0) / sg.topics.length
        return {
          skillId: sg.skillId,
          skillName: sg.skillName,
          skillScore: Math.round(avgScore),
          status: getMasteryStatus(avgScore),
          topicCount: sg.topics.length,
          topics: sg.topics.map(t => ({
            topicId: t.topicId,
            topicName: t.topicName,
            masteryScore: Math.round(t.masteryScore),
            status: t.status,
            trend: t.trend,
          })),
        }
      })
    }

    // Group mappings by skillId
    const skillMap: Record<string, { skillName: string; category: string; topics: { topicId: string; topicName: string; weight: number }[] }> = {}
    for (const m of mappings) {
      if (!skillMap[m.skillId]) {
        skillMap[m.skillId] = { skillName: m.skillName, category: m.category, topics: [] }
      }
      skillMap[m.skillId].topics.push({ topicId: m.topicId, topicName: m.topicName, weight: m.weight })
    }

    // Compute each skill's mastery from its topics
    const result = []
    for (const [skillId, skill] of Object.entries(skillMap)) {
      let totalWeight = 0
      let weightedSum = 0
      const topicDetails = []

      for (const st of skill.topics) {
        const tm = topicMasteries.find(t => t.topicId === st.topicId)
        const score = tm ? tm.masteryScore : 0
        weightedSum += score * st.weight
        totalWeight += st.weight
        topicDetails.push({
          topicId: st.topicId,
          topicName: st.topicName,
          masteryScore: Math.round(score),
          status: tm ? tm.status : 'not_started',
          trend: tm ? tm.trend : 'stable',
        })
      }

      const skillScore = totalWeight > 0 ? weightedSum / totalWeight : 0

      result.push({
        skillId,
        skillName: skill.skillName,
        category: skill.category,
        skillScore: Math.round(skillScore),
        status: getMasteryStatus(skillScore),
        topicCount: skill.topics.length,
        topics: topicDetails,
      })
    }

    return result
  } catch (error) {
    console.error('[MasteryService] Error computing skill masteries:', error)
    return []
  }
}

/**
 * Get intelligent insights based on topic mastery data
 * Powers the "AI Insights" that reference specific topic weakness data
 */
export async function getMasteryInsights(userId: string) {
  try {
    const masteries = await db.topicMastery.findMany({
      where: { userId },
      orderBy: { masteryScore: 'asc' },
    })

    if (masteries.length === 0) {
      return {
        totalTopics: 0,
        averageMastery: 0,
        insights: [],
        weakTopics: [],
        strongTopics: [],
        mistakeConcentration: null,
      }
    }

    const avgMastery = masteries.reduce((sum, m) => sum + m.masteryScore, 0) / masteries.length

    const weakTopics = masteries.filter(m => m.masteryScore < 50)
    const strongTopics = masteries.filter(m => m.masteryScore >= 75)
    const learningTopics = masteries.filter(m => m.masteryScore >= 50 && m.masteryScore < 75)

    // Calculate mistake concentration: what % of mistakes come from weak topics
    const totalQuestions = masteries.reduce((sum, m) => sum + m.questionsAttempted, 0)
    const totalIncorrect = masteries.reduce((sum, m) => sum + (m.questionsAttempted - m.questionsCorrect), 0)
    const weakIncorrect = weakTopics.reduce((sum, m) => sum + (m.questionsAttempted - m.questionsCorrect), 0)
    const mistakeConcentration = totalIncorrect > 0 ? Math.round((weakIncorrect / totalIncorrect) * 100) : 0

    // Generate intelligent insights
    const insights: string[] = []

    if (strongTopics.length > 0) {
      const strongNames = strongTopics.slice(0, 3).map(t => t.topicName).join(', ')
      insights.push(`You perform well in ${strongNames}.`)
    }

    if (weakTopics.length > 0) {
      const weakNames = weakTopics.slice(0, 3).map(t => t.topicName).join(', ')
      insights.push(`You struggle most with ${weakNames}.`)
    }

    if (mistakeConcentration > 50 && weakTopics.length > 0) {
      insights.push(`${mistakeConcentration}% of your mistakes come from your weak topics.`)
    }

    if (learningTopics.length > 0) {
      insights.push(`${learningTopics.length} topic${learningTopics.length > 1 ? 's are' : ' is'} in the learning phase — consistent practice will move them to strong.`)
    }

    const decliningTopics = masteries.filter(m => m.trend === 'declining')
    if (decliningTopics.length > 0) {
      insights.push(`${decliningTopics.length} topic${decliningTopics.length > 1 ? 's are' : ' is'} declining — review ${decliningTopics[0].topicName} soon.`)
    }

    return {
      totalTopics: masteries.length,
      averageMastery: Math.round(avgMastery),
      insights,
      weakTopics: weakTopics.map(t => ({
        topicId: t.topicId,
        name: t.topicName,
        score: Math.round(t.masteryScore),
        status: t.status,
        trend: t.trend,
        questionsAttempted: t.questionsAttempted,
        questionsCorrect: t.questionsCorrect,
      })),
      strongTopics: strongTopics.map(t => ({
        topicId: t.topicId,
        name: t.topicName,
        score: Math.round(t.masteryScore),
        status: t.status,
        trend: t.trend,
      })),
      mistakeConcentration: totalQuestions > 0 ? mistakeConcentration : null,
    }
  } catch (error) {
    console.error('[MasteryService] Error getting mastery insights:', error)
    return { totalTopics: 0, averageMastery: 0, insights: [], weakTopics: [], strongTopics: [], mistakeConcentration: null }
  }
}
