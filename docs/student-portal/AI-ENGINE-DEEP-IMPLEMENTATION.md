# ShijlAI Academy — AI Engine: Deep Technical Implementation

> Complete technical documentation of the Adaptive Learning Engine, covering every algorithm, data structure, and LLM interaction pattern.

---

## Table of Contents

1. [Learning Engine Architecture](#1-learning-engine-architecture)
2. [Event Service — Data Ingestion](#2-event-service--data-ingestion)
3. [Feature Engine — Metric Computation](#3-feature-engine--metric-computation)
4. [Profile Service — Student Modeling](#4-profile-service--student-modeling)
5. [Mastery Service — Topic Tracking](#5-mastery-service--topic-tracking)
6. [Recommendation Engine — Adaptive Delivery](#6-recommendation-engine--adaptive-delivery)
7. [Study Planner — Plan Generation](#7-study-planner--plan-generation)
8. [LLM Integration Patterns](#8-llm-integration-patterns)
9. [Ask ShijlAI — Context Engineering](#9-ask-shijlai--context-engineering)
10. [AI Companion — Proactive Intelligence](#10-ai-companion--proactive-intelligence)
11. [Mock Interview — Simulation Engine](#11-mock-interview--simulation-engine)
12. [Data Flow Diagrams](#12-data-flow-diagrams)

---

## 1. Learning Engine Architecture

### 1.1 Module Structure

```
src/services/learning-engine/
├── index.ts                    # Barrel export
├── event-service.ts            # Event logging & triggers
├── feature-engine.ts           # 5 metric computations
├── profile-service.ts          # Student profile aggregation
├── mastery-service.ts          # Weighted mastery tracking
├── recommendation-engine.ts    # Adaptive recommendations
└── study-planner-service.ts    # Algorithmic study plans
```

### 1.2 Service Dependency Graph

```
                    ┌──────────────┐
                    │ Event Service │ ← User Actions (frontend)
                    └──────┬───────┘
                           │ logEvent()
                           │
              ┌────────────┼────────────────┐
              ▼                              ▼
    ┌──────────────────┐          ┌──────────────────┐
    │  Mastery Service │          │ Profile Service  │
    │  updateTopic     │          │  updateStudent   │
    │  Mastery()       │          │  Profile()       │
    └────────┬─────────┘          └────────┬─────────┘
             │                             │
             │  getWeakTopics()            │ 5x Feature Engine
             │  getStrongTopics()          │ compute*()
             │  getAllMasteries()          │
             ▼                             ▼
    ┌──────────────────────────────────────────────┐
    │           Recommendation Engine               │
    │    generateRecommendations()                  │
    │    computePriorityScore()                     │
    └──────────────────┬───────────────────────────┘
                       │
                       ▼
    ┌──────────────────────────────────────────────┐
    │            Ask ShijlAI / Companion            │
    │    Receives full student context for          │
    │    personalized AI interactions               │
    └──────────────────────────────────────────────┘
```

### 1.3 Barrel Export (`index.ts`)

All services are re-exported for clean imports:

```typescript
export { logEvent, computeScoreDelta, getRecentEvents, getEventCount, getEventSum }
    from './event-service'
export { computeLearningSpeed, computeEngagementScore, computeConsistencyScore,
         computeAveragePerformance, computeDropRisk }
    from './feature-engine'
export { getOrCreateProfile, updateStudentProfile }
    from './profile-service'
export { computeWeightedMastery, getMasteryStatus, getStatusDisplay,
         updateTopicMastery, applyTimeDecay, getWeakTopics, getStrongTopics,
         getAllMasteries, computeSkillMasteries, getMasteryInsights }
    from './mastery-service'
export { generateRecommendations, computePriorityScore }
    from './recommendation-engine'
export { generateStudyPlan, getStudentStudyPlans, updateStudyPlanTask,
         getTodayTasks, deleteStudyPlan, generateAIPlanEnhancement }
    from './study-planner-service'
```

---

## 2. Event Service — Data Ingestion

### 2.1 `logEvent(params)` — The Core Pipeline

Every learning action flows through this single function:

```typescript
async function logEvent(params: {
    userId: string
    eventType: string
    eventValue?: number
    courseId?: string
    topicId?: string
    metadata?: Record<string, unknown>
}) {
    const { userId, eventType, eventValue = 0, courseId, topicId, metadata } = params

    // STEP 1: Create event record
    const event = await db.learningMetric.create({
        data: {
            userId,
            eventType,
            eventValue,
            courseId,
            topicId,
            metadata: metadata || undefined,
            timestamp: new Date()
        }
    })

    // STEP 2: Compute score delta for mastery update
    const scoreDelta = computeScoreDelta(eventType, eventValue)

    // STEP 3: Update topic mastery (non-blocking)
    if (topicId) {
        try {
            await updateTopicMastery({
                userId,
                topicId,
                courseId: courseId || undefined,
                scoreDelta
            })
        } catch (error) {
            console.error('Error updating topic mastery:', error)
            // Non-blocking — mastery update failure doesn't affect event logging
        }
    }

    // STEP 4: Update student profile (non-blocking)
    try {
        await updateStudentProfile(userId)
    } catch (error) {
        console.error('Error updating student profile:', error)
        // Non-blocking — profile update failure doesn't affect event logging
    }

    return event
}
```

**Key Design Principles:**
1. **Non-blocking downstream**: Mastery and profile update failures don't prevent event logging
2. **Single entry point**: All learning actions must go through `logEvent()`
3. **Event is truth**: If it's not logged, it doesn't exist for the AI system

### 2.2 Score Delta Computation

```typescript
function computeScoreDelta(eventType: string, eventValue: number): number {
    switch (eventType) {
        case 'quiz_attempted':    return eventValue * 0.3   // 30% of quiz score
        case 'lesson_completed':  return 15                  // Fixed +15
        case 'assignment_submitted': return eventValue * 0.25 // 25% of assignment score
        case 'video_watched':     return 5                   // Fixed +5
        case 'ai_tutor_used':     return 3                   // Fixed +3
        default:                  return eventValue * 0.1    // 10% of value
    }
}
```

### 2.3 Query Functions

```typescript
// Recent events with optional filters
getRecentEvents(userId, options?: { eventType?, courseId?, since?, limit? })
// → db.learningMetric.findMany({ where, orderBy: { timestamp: 'desc' }, take: limit || 50 })

// Event count
getEventCount(userId, eventType?, since?)
// → db.learningMetric.count({ where })

// Event sum
getEventSum(userId, eventType, since?)
// → db.learningMetric.findMany({ where }) → JS reduce((sum, e) => sum + e.eventValue, 0)
```

---

## 3. Feature Engine — Metric Computation

### 3.1 `computeLearningSpeed(userId)`

```typescript
async function computeLearningSpeed(userId: string): Promise<number> {
    const enrollments = await db.enrollment.findMany({
        where: { userId },
        include: { course: { include: { modules: { include: { lessons: true } } } } }
    })

    let completedLessons = 0
    let totalMinutesSpent = 0

    for (const enrollment of enrollments) {
        const progress = await db.lessonProgress.findMany({
            where: {
                userId,
                status: 'completed',
                lesson: { module: { courseId: enrollment.courseId } }
            }
        })
        completedLessons += progress.length
        totalMinutesSpent += progress.reduce((sum, p) => sum + (p.timeSpent || 0), 0)
    }

    const timeSpentHours = totalMinutesSpent / 60
    if (timeSpentHours === 0) return 50  // Default for new students

    const speed = (completedLessons / timeSpentHours) * 10
    return Math.min(100, Math.max(0, speed))
}
```

**Interpretation:**
- `50`: Default (no data yet)
- `0-30`: Slow learner (needs more time per lesson)
- `30-70`: Moderate speed
- `70-100`: Fast learner (quick comprehension)

### 3.2 `computeEngagementScore(userId)`

```typescript
async function computeEngagementScore(userId: string): Promise<number> {
    // 5 components with different weights:
    const logins = await getEventCount(userId, 'login', last7Days)
    const timeHours = await getTotalTimeSpent(userId, last7Days) / 60
    const quizzes = await getEventCount(userId, 'quiz_attempted', last7Days)
    const aiUsage = await getEventCount(userId, 'ai_tutor_used', last7Days)
    const lessons = await getEventCount(userId, 'lesson_completed', last7Days)

    const score = Math.min(logins, 7) * 5       // Max 35 pts
                + timeHours * 4                   // Uncapped (practical max ~60)
                + Math.min(quizzes, 10) * 2       // Max 20 pts
                + Math.min(aiUsage, 10) * 1.5     // Max 15 pts
                + Math.min(lessons, 10) * 0.5      // Max 5 pts

    return Math.min(100, Math.max(0, score))
}
```

**Component Breakdown:**
| Component | Max Raw Score | Weight | Practical Max |
|-----------|--------------|--------|--------------|
| Login frequency | 7 × 5 = 35 | 1.0× | 35 |
| Time spent | hours × 4 | 1.0× | ~60 (15 hrs) |
| Quiz attempts | 10 × 2 = 20 | 1.0× | 20 |
| AI tutor usage | 10 × 1.5 = 15 | 1.0× | 15 |
| Lessons completed | 10 × 0.5 = 5 | 1.0× | 5 |
| **Total** | | | **~135 → capped 100** |

### 3.3 `computeConsistencyScore(userId)`

```typescript
async function computeConsistencyScore(userId: string): Promise<number> {
    const user = await db.user.findUnique({ where: { id: userId } })
    const enrollments = await db.enrollment.findMany({ where: { userId } })

    if (!enrollments.length) return 0

    // Calculate total days enrolled (earliest enrollment to now)
    const earliestEnrollment = enrollments.reduce((min, e) =>
        e.enrolledAt < min ? e.enrolledAt : min, new Date())
    const totalDays = Math.max(1, daysBetween(earliestEnrollment, new Date()))

    // Count active days from DailyActivity
    const dailyActivities = await db.dailyActivity.findMany({ where: { userId } })
    const activeDays = dailyActivities.filter(d => d.xpEarned > 0).length

    let score = (activeDays / totalDays) * 100

    // Streak penalty
    if (user.streak < 3) score -= 10

    return Math.min(100, Math.max(0, score))
}
```

### 3.4 `computeAveragePerformance(userId)`

```typescript
async function computeAveragePerformance(userId: string): Promise<number> {
    const quizAttempts = await db.quizAttempt.findMany({ where: { userId } })
    const submissions = await db.submission.findMany({ where: { studentId: userId } })

    const scores: number[] = []

    quizAttempts.forEach(q => scores.push(q.score))
    submissions.forEach(s => { if (s.grade) scores.push(s.grade) })

    if (scores.length === 0) return 0

    return scores.reduce((sum, s) => sum + s, 0) / scores.length
}
```

### 3.5 `computeDropRisk(userId)`

```typescript
async function computeDropRisk(userId: string): Promise<number> {
    // 1. Low engagement component
    const engagement = await computeEngagementScore(userId)
    const lowEngagement = Math.max(0, 100 - engagement)

    // 2. Low consistency component
    const consistency = await computeConsistencyScore(userId)
    const lowConsistency = Math.max(0, 100 - consistency)

    // 3. Declining score component
    const user = await db.user.findUnique({ where: { id: userId } })
    const recentAttempts = await db.quizAttempt.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5
    })
    const olderAttempts = await db.quizAttempt.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: 5, take: 5
    })

    let decliningScore = 0
    if (recentAttempts.length && olderAttempts.length) {
        const recentAvg = avg(recentAttempts.map(a => a.score))
        const olderAvg = avg(olderAttempts.map(a => a.score))
        if (recentAvg < olderAvg) {
            decliningScore = 2 * (olderAvg - recentAvg)
        }
    }

    // 4. Inactivity component
    const lastActive = user.lastActiveAt
    const daysInactive = lastActive
        ? daysBetween(lastActive, new Date())
        : 30  // Assume long inactivity if never active
    const inactivityScore = Math.min(100, daysInactive * 5)

    // Weighted combination
    const dropRisk = lowEngagement * 0.30
                   + lowConsistency * 0.30
                   + decliningScore * 0.20
                   + inactivityScore * 0.20

    return Math.min(100, Math.max(0, dropRisk))
}
```

**Drop Risk Interpretation:**

| Score | Risk Level | Recommended Action |
|-------|-----------|-------------------|
| 0-20 | Low | Continue normal learning |
| 20-40 | Moderate | Increase study consistency |
| 40-60 | High | Create study plan, set reminders |
| 60-80 | Critical | Immediate intervention, AI companion check-in |
| 80-100 | Severe | Academic advisor notification |

---

## 4. Profile Service — Student Modeling

### 4.1 `getOrCreateProfile(userId)`

```typescript
async function getOrCreateProfile(userId: string) {
    let profile = await db.studentLearningProfile.findUnique({ where: { userId } })

    if (!profile) {
        // Create empty profile
        profile = await db.studentLearningProfile.create({
            data: {
                userId,
                learningLevel: 'beginner',
                engagementScore: 0,
                consistencyScore: 0,
                learningSpeedScore: 50,    // Default
                dropRiskScore: 0,
                completionRate: 0,
                averageQuizScore: 0,
                weakTopics: [],
                strongTopics: [],
                learningSpeed: 'moderate',
                lastComputedAt: new Date()
            }
        })

        // Trigger immediate computation
        profile = await updateStudentProfile(userId)
    }

    return profile
}
```

### 4.2 `updateStudentProfile(userId)` — Full Computation

```typescript
async function updateStudentProfile(userId: string) {
    // THROTTLE: Skip if computed less than 5 minutes ago
    const existing = await db.studentLearningProfile.findUnique({ where: { userId } })
    if (existing?.lastComputedAt) {
        const minutesSince = (Date.now() - existing.lastComputedAt.getTime()) / 60000
        if (minutesSince < 5) return existing
    }

    try {
        // STEP 1: Run all 5 feature computations in parallel
        const [learningSpeed, engagement, consistency, performance, dropRisk] =
            await Promise.all([
                computeLearningSpeed(userId),
                computeEngagementScore(userId),
                computeConsistencyScore(userId),
                computeAveragePerformance(userId),
                computeDropRisk(userId)
            ])

        // STEP 2: Apply time decay to stale topics
        await applyTimeDecay(userId)

        // STEP 3: Get weak and strong topics
        const weakTopics = await getWeakTopics(userId, 50)
        const strongTopics = await getStrongTopics(userId, 75)

        // STEP 4: Determine learning level
        const avgMastery = weakTopics.length + strongTopics.length > 0
            ? (weakTopics.reduce((s, t) => s + t.masteryScore, 0) +
               strongTopics.reduce((s, t) => s + t.masteryScore, 0)) /
              (weakTopics.length + strongTopics.length)
            : 0

        let learningLevel: string
        if (avgMastery < 40 || performance < 50) learningLevel = 'beginner'
        else if (avgMastery < 70 || performance < 75) learningLevel = 'intermediate'
        else learningLevel = 'advanced'

        // STEP 5: Determine learning speed
        let learningSpeedCategory: string
        if (learningSpeed < 40) learningSpeedCategory = 'slow'
        else if (learningSpeed < 70) learningSpeedCategory = 'moderate'
        else learningSpeedCategory = 'fast'

        // STEP 6: Fetch supplementary data
        const enrollments = await db.enrollment.findMany({ where: { userId } })
        const quizAttempts = await db.quizAttempt.findMany({ where: { userId } })
        const user = await db.user.findUnique({ where: { id: userId } })

        const completionRate = enrollments.length > 0
            ? enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length
            : 0

        // STEP 7: Upsert profile
        const profile = await db.studentLearningProfile.upsert({
            where: { userId },
            update: {
                learningLevel,
                engagementScore: engagement,
                consistencyScore: consistency,
                learningSpeedScore: learningSpeed,
                dropRiskScore: dropRisk,
                completionRate,
                averageQuizScore: performance,
                weakTopics: weakTopics.map(t => ({
                    topicId: t.topicId,
                    topicName: t.topicId,  // Simplified
                    masteryScore: t.masteryScore,
                    status: t.status
                })),
                strongTopics: strongTopics.map(t => ({
                    topicId: t.topicId,
                    topicName: t.topicId,
                    masteryScore: t.masteryScore,
                    status: t.status
                })),
                learningSpeed: learningSpeedCategory,
                totalXpEarned: user?.xp || 0,
                totalLessonsCompleted: enrollments.reduce((sum, e) =>
                    sum + Math.floor(e.progress / 100 * 10), 0),  // Estimated
                totalQuizzesTaken: quizAttempts.length,
                totalTimeSpent: enrollments.reduce((sum, e) =>
                    sum + (e.timeSpent || 0), 0),
                studyStreakDays: user?.streak || 0,
                lastComputedAt: new Date()
            },
            create: {
                userId,
                learningLevel,
                engagementScore: engagement,
                consistencyScore: consistency,
                learningSpeedScore: learningSpeed,
                dropRiskScore: dropRisk,
                completionRate,
                averageQuizScore: performance,
                weakTopics: weakTopics.map(t => ({ /* ... */ })),
                strongTopics: strongTopics.map(t => ({ /* ... */ })),
                learningSpeed: learningSpeedCategory,
                totalXpEarned: user?.xp || 0,
                studyStreakDays: user?.streak || 0,
                lastComputedAt: new Date()
            }
        })

        return profile
    } catch (error) {
        console.error('Error updating student profile:', error)
        // Return existing profile or create minimal fallback
        return existing || await db.studentLearningProfile.create({ data: { userId } })
    }
}
```

---

## 5. Mastery Service — Topic Tracking

### 5.1 `computeWeightedMastery(params)`

```typescript
function computeWeightedMastery(params: {
    quizScore?: number        // 0-100
    assignmentScore?: number   // 0-100
    practiceScore?: number     // 0-100
    completionScore?: number   // 0-100
}): number {
    const { quizScore = 0, assignmentScore = 0, practiceScore = 0, completionScore = 0 } = params

    return (quizScore * 0.50) +
           (assignmentScore * 0.25) +
           (practiceScore * 0.15) +
           (completionScore * 0.10)
}
```

### 5.2 `updateTopicMastery(params)` — Core Update Logic

```typescript
async function updateTopicMastery(params: {
    userId: string
    topicId: string
    courseId?: string
    scoreDelta?: number         // Legacy: raw delta
    quizScore?: number          // New: component score
    assignmentScore?: number
    practiceScore?: number
    completionScore?: number
}) {
    const { userId, topicId, courseId } = params
    const existing = await db.topicMastery.findUnique({
        where: { userId_topicId: { userId, topicId } }
    })

    if (existing) {
        // MERGE: Update existing mastery
        let quizScore = existing.quizScore
        let assignmentScore = existing.assignmentScore
        let practiceScore = existing.practiceScore
        let completionScore = existing.completionScore

        if (params.quizScore !== undefined) quizScore = params.quizScore
        if (params.assignmentScore !== undefined) assignmentScore = params.assignmentScore
        if (params.practiceScore !== undefined) practiceScore = params.practiceScore
        if (params.completionScore !== undefined) completionScore = params.completionScore

        // Legacy: apply scoreDelta to quizScore
        if (params.scoreDelta !== undefined && params.quizScore === undefined) {
            quizScore = Math.min(100, Math.max(0, existing.quizScore + params.scoreDelta))
        }

        const newMastery = computeWeightedMastery({
            quizScore, assignmentScore, practiceScore, completionScore
        })

        // Determine trend
        const delta = newMastery - existing.masteryScore
        let trend: string
        if (delta > 2) trend = 'improving'
        else if (delta < -2) trend = 'declining'
        else trend = 'stable'

        return await db.topicMastery.update({
            where: { id: existing.id },
            data: {
                quizScore, assignmentScore, practiceScore, completionScore,
                masteryScore: newMastery,
                status: getMasteryStatus(newMastery),
                trend,
                attemptCount: existing.attemptCount + 1,
                lastPracticedAt: new Date(),
                decayApplied: false  // Reset decay flag on new activity
            }
        })
    } else {
        // CREATE: New mastery record
        const mastery = computeWeightedMastery({
            quizScore: params.quizScore || 0,
            assignmentScore: params.assignmentScore || 0,
            practiceScore: params.practiceScore || 0,
            completionScore: params.completionScore || 0
        })

        return await db.topicMastery.create({
            data: {
                userId, topicId, courseId,
                quizScore: params.quizScore || 0,
                assignmentScore: params.assignmentScore || 0,
                practiceScore: params.practiceScore || 0,
                completionScore: params.completionScore || 0,
                masteryScore: mastery,
                status: getMasteryStatus(mastery),
                trend: 'stable',
                attemptCount: 1,
                lastPracticedAt: new Date(),
                decayApplied: false
            }
        })
    }
}
```

### 5.3 `applyTimeDecay(userId)`

```typescript
async function applyTimeDecay(userId: string): Promise<number> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    // Find stale topics (not practiced in 7+ days, decay not yet applied)
    const staleTopics = await db.topicMastery.findMany({
        where: {
            userId,
            lastPracticedAt: { lt: sevenDaysAgo },
            decayApplied: false
        }
    })

    let updatedCount = 0

    for (const topic of staleTopics) {
        const daysSinceLastPractice = Math.floor(
            (Date.now() - topic.lastPracticedAt.getTime()) / (24 * 60 * 60 * 1000)
        )
        const daysOverThreshold = daysSinceLastPractice - 7
        const decayFactor = 1 - (0.005 * daysOverThreshold)

        // Apply decay proportionally to ALL component scores
        const newQuiz = Math.max(0, topic.quizScore * decayFactor)
        const newAssignment = Math.max(0, topic.assignmentScore * decayFactor)
        const newPractice = Math.max(0, topic.practiceScore * decayFactor)
        const newCompletion = Math.max(0, topic.completionScore * decayFactor)

        const newMastery = computeWeightedMastery({
            quizScore: newQuiz,
            assignmentScore: newAssignment,
            practiceScore: newPractice,
            completionScore: newCompletion
        })

        await db.topicMastery.update({
            where: { id: topic.id },
            data: {
                quizScore: newQuiz,
                assignmentScore: newAssignment,
                practiceScore: newPractice,
                completionScore: newCompletion,
                masteryScore: newMastery,
                status: getMasteryStatus(newMastery),
                decayApplied: true
            }
        })
        updatedCount++
    }

    return updatedCount
}
```

**Decay Example:**
```
Topic: Python Loops
- Last practiced: 30 days ago
- Original scores: quiz=85, assignment=70, practice=60, completion=90
- Days over threshold: 30 - 7 = 23
- Decay factor: 1 - (0.005 × 23) = 0.885
- New scores: quiz=75.2, assignment=61.9, practice=53.1, completion=79.7
- New mastery: 75.2×0.5 + 61.9×0.25 + 53.1×0.15 + 79.7×0.1 = 69.9
- Status change: "strong" → "learning"
```

### 5.4 `computeSkillMasteries(userId)`

```typescript
async function computeSkillMasteries(userId: string) {
    const masteries = await db.topicMastery.findMany({ where: { userId } })
    const mappings = await db.skillTopicMapping.findMany()

    // Group topics by skillId
    const skillsMap = new Map<string, { totalWeight: number, weightedScore: number }>()

    for (const mapping of mappings) {
        const mastery = masteries.find(m => m.topicId === mapping.topicId)
        const score = mastery ? mastery.masteryScore : 0

        if (!skillsMap.has(mapping.skillId)) {
            skillsMap.set(mapping.skillId, { totalWeight: 0, weightedScore: 0 })
        }
        const skill = skillsMap.get(mapping.skillId)!
        skill.totalWeight += mapping.weight
        skill.weightedScore += score * mapping.weight
    }

    // Compute final skill scores
    const result: Record<string, number> = {}
    for (const [skillId, data] of skillsMap) {
        result[skillId] = data.totalWeight > 0
            ? data.weightedScore / data.totalWeight
            : 0
    }

    // Fallback: auto-group if no mappings exist
    if (mappings.length === 0) {
        const categoryGroups = new Map<string, number[]>()
        for (const mastery of masteries) {
            const category = mastery.topicId.split('_')[0]  // e.g., "python_basics" → "python"
            if (!categoryGroups.has(category)) categoryGroups.set(category, [])
            categoryGroups.get(category)!.push(mastery.masteryScore)
        }
        for (const [category, scores] of categoryGroups) {
            result[category] = scores.reduce((a, b) => a + b, 0) / scores.length
        }
    }

    return result
}
```

### 5.5 `getMasteryInsights(userId)`

```typescript
async function getMasteryInsights(userId: string) {
    const masteries = await db.topicMastery.findMany({ where: { userId } })
    const insights: Array<{ type: string, message: string, data?: any }> = []

    for (const mastery of masteries) {
        // Strong topic celebration
        if (mastery.masteryScore >= 90) {
            insights.push({
                type: 'celebration',
                message: `Excellent! You've mastered ${mastery.topicId}!`,
                data: { topicId: mastery.topicId, score: mastery.masteryScore }
            })
        }

        // Weak topic alert
        if (mastery.masteryScore < 30) {
            insights.push({
                type: 'weak_topic',
                message: `${mastery.topicId} needs attention — consider reviewing basics`,
                data: { topicId: mastery.topicId, score: mastery.masteryScore }
            })
        }

        // Mistake concentration (high quiz attempts but low score)
        if (mastery.quizScore < 40 && mastery.attemptCount > 3) {
            insights.push({
                type: 'mistake_concentration',
                message: `Quiz errors concentrate in ${mastery.topicId} — focused practice recommended`,
                data: { topicId: mastery.topicId, quizScore: mastery.quizScore, attempts: mastery.attemptCount }
            })
        }

        // Learning phase encouragement
        if (mastery.masteryScore >= 50 && mastery.masteryScore < 75) {
            insights.push({
                type: 'progress',
                message: `You're making progress on ${mastery.topicId}!`,
                data: { topicId: mastery.topicId, score: mastery.masteryScore }
            })
        }

        // Declining warning
        if (mastery.trend === 'declining') {
            insights.push({
                type: 'declining',
                message: `${mastery.topicId} mastery is declining — review recommended`,
                data: { topicId: mastery.topicId, trend: mastery.trend }
            })
        }
    }

    return insights
}
```

---

## 6. Recommendation Engine — Adaptive Delivery

### 6.1 `generateRecommendations(input)` — Full Pipeline

```typescript
async function generateRecommendations(input: {
    userId: string
    courseId?: string
    sourceEvent?: string    // Triggering event (quiz_completed, lesson_finished, etc.)
}) {
    const { userId, courseId, sourceEvent } = input

    // STEP 1: Fetch student context
    const profile = await getOrCreateProfile(userId)
    const weakTopics = await getWeakTopics(userId, 50)
    const strongTopics = await getStrongTopics(userId, 75)
    const allMasteries = await getAllMasteries(userId, courseId)
    const enrollments = await db.enrollment.findMany({
        where: { userId, status: 'active' },
        include: { course: { include: { modules: true } } }
    })

    const recommendations: AIRecommendation[] = []

    // STEP 2: Rule-based recommendation generation

    // Rule 1: Very weak topics (<30%) → HIGH priority review
    for (const topic of weakTopics.filter(t => t.masteryScore < 30)) {
        recommendations.push({
            type: 'topic',
            title: `Review Basics: ${topic.topicId}`,
            description: `Your mastery is at ${Math.round(topic.masteryScore)}%. Start with fundamentals.`,
            priority: 'high',
            reason: `Very weak topic (${Math.round(topic.masteryScore)}% mastery)`,
            priorityScore: computePriorityScore(
                100 - topic.masteryScore,  // weakness
                50,                        // career relevance (default)
                profile.engagementScore,   // engagement match
                100                        // recency (urgent)
            )
        })

        // Also recommend a practice quiz
        recommendations.push({
            type: 'quiz',
            title: `Practice Quiz: ${topic.topicId}`,
            description: `Test your understanding with a focused quiz.`,
            priority: 'high',
            reason: `Quiz practice recommended for weak topic`,
            priorityScore: computePriorityScore(90, 40, profile.engagementScore, 90)
        })
    }

    // Rule 2: Weak topics (30-50%) → MEDIUM priority revision
    for (const topic of weakTopics.filter(t => t.masteryScore >= 30)) {
        recommendations.push({
            type: 'topic',
            title: `Revise: ${topic.topicId}`,
            description: `Review and practice to strengthen your understanding.`,
            priority: 'medium',
            reason: `Weak topic (${Math.round(topic.masteryScore)}% mastery)`,
            priorityScore: computePriorityScore(
                100 - topic.masteryScore, 50, profile.engagementScore, 70
            )
        })
    }

    // Rule 3: Incomplete modules in enrolled courses → HIGH priority
    for (const enrollment of enrollments) {
        if (enrollment.progress < 100) {
            recommendations.push({
                type: 'lesson',
                title: `Continue: ${enrollment.course.title}`,
                description: `You're ${Math.round(enrollment.progress)}% through this course.`,
                priority: 'high',
                reason: `Incomplete course (${Math.round(enrollment.progress)}% progress)`,
                priorityScore: computePriorityScore(
                    100 - enrollment.progress, 60, profile.engagementScore, 80
                )
            })
        }
    }

    // Rule 4: Strong topics → LOW priority advanced challenge
    for (const topic of strongTopics.slice(0, 2)) {  // Max 2
        recommendations.push({
            type: 'topic',
            title: `Advanced Challenge: ${topic.topicId}`,
            description: `Try advanced problems to deepen your mastery.`,
            priority: 'low',
            reason: `Strong topic — ready for challenges`,
            priorityScore: computePriorityScore(20, 70, profile.engagementScore, 40)
        })
    }

    // Rule 5: High drop risk → Study plan recommendation
    if (profile.dropRiskScore > 60) {
        recommendations.push({
            type: 'study_plan',
            title: 'Create a Study Plan',
            description: 'Your drop risk is high. A structured plan can help you stay on track.',
            priority: 'high',
            reason: `High drop risk (${Math.round(profile.dropRiskScore)}%)`,
            priorityScore: computePriorityScore(80, 50, profile.engagementScore, 100)
        })
    } else if (profile.dropRiskScore > 30) {
        recommendations.push({
            type: 'study_plan',
            title: 'Review Your Schedule',
            description: 'Consider creating a study plan for better consistency.',
            priority: 'medium',
            reason: `Moderate drop risk (${Math.round(profile.dropRiskScore)}%)`,
            priorityScore: computePriorityScore(50, 50, profile.engagementScore, 70)
        })
    }

    // STEP 3: Sort by priority score, take top 5
    recommendations.sort((a, b) => b.priorityScore - a.priorityScore)
    const top5 = recommendations.slice(0, 5)

    // STEP 4: Save to DB with deduplication
    const saved: AIRecommendation[] = []
    for (const rec of top5) {
        const existing = await db.aIRecommendation.findFirst({
            where: { userId, type: rec.type, title: rec.title, status: 'active' }
        })
        if (!existing) {
            const saved_rec = await db.aIRecommendation.create({
                data: { userId, ...rec, status: 'active' }
            })
            saved.push(saved_rec)
        }
    }

    return saved
}
```

### 6.2 `computePriorityScore()`

```typescript
function computePriorityScore(
    weakness: number,        // 0-100 (how weak the area is)
    careerRelevance: number, // 0-100 (relevance to career goals)
    engagementMatch: number, // 0-100 (matches current engagement level)
    recency: number          // 0-100 (how recently relevant)
): number {
    return (weakness * 0.40) +
           (careerRelevance * 0.20) +
           (engagementMatch * 0.20) +
           (recency * 0.20)
}
```

**Weight Rationale:**
- **Weakness (40%)**: The most important factor — students should focus on what they struggle with
- **Career Relevance (20%)**: Ensures recommendations align with long-term goals
- **Engagement Match (20%)**: Avoids recommending content too easy or too hard
- **Recency (20%)**: Prioritizes timely recommendations (e.g., exam approaching)

---

## 7. Study Planner — Plan Generation

### 7.1 `generateStudyPlan(params)` — Full Algorithm

```typescript
async function generateStudyPlan(params: {
    userId: string
    examDate: string          // ISO date string, must be in future
    subjects: string[]        // e.g., ['Python', 'Machine Learning']
    dailyHours: number        // 0.5 - 16
    topics?: Array<{          // Optional custom topic list
        name: string
        mastery: number       // 0-100
    }>
    aiEnhanced?: boolean      // Default: true
}) {
    const { userId, examDate, subjects, dailyHours, aiEnhanced = true } = params

    // STEP 1: Calculate timeline
    const exam = new Date(examDate)
    const now = new Date()
    const daysRemaining = Math.min(90, Math.max(1, Math.ceil(
        (exam.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    )))

    // STEP 2: Fetch student context
    const profile = await getOrCreateProfile(userId)
    const enrollments = await db.enrollment.findMany({
        where: { userId, status: 'active' },
        include: { course: { include: { modules: true } } }
    })

    // STEP 3: Build topic list
    let topicList = params.topics || []

    if (topicList.length === 0) {
        // Auto-generate from profile + enrollments
        const masteries = await getAllMasteries(userId)
        topicList = masteries.map(m => ({
            name: m.topicId,
            mastery: m.masteryScore
        }))

        // Add subjects not yet tracked
        for (const subject of subjects) {
            if (!topicList.find(t => t.name.toLowerCase().includes(subject.toLowerCase()))) {
                topicList.push({ name: subject, mastery: 50 })  // Default moderate
            }
        }
    }

    // STEP 4: Distribute topics by weight
    const { weak, moderate, strong } = distributeTopics(
        topicList.filter(t => t.mastery < 50),
        topicList.filter(t => t.mastery >= 50 && t.mastery < 75),
        topicList.filter(t => t.mastery >= 75),
        daysRemaining
    )

    // STEP 5: Generate daily tasks
    const tasks: StudyPlanTask[] = []
    let dayIndex = 1

    for (const dayTopics of dailyTopicSchedule) {
        const progressPercent = (dayIndex / daysRemaining) * 100
        const isReviewDay = dayIndex % 3 === 0
        const isDayBeforeExam = dayIndex === daysRemaining - 1

        // Determine phase
        let taskTypes: string[]
        if (progressPercent <= 40) {
            taskTypes = ['study', 'ai_discussion', 'quiz']  // Early phase
        } else if (progressPercent <= 75) {
            taskTypes = ['study', 'practice', 'quiz']        // Middle phase
        } else {
            taskTypes = ['revision', 'mock_exam', 'practice'] // Late phase
        }

        // Number of tasks based on daily hours
        const numTasks = dailyHours <= 1 ? 1 : dailyHours <= 2 ? 2 : dailyHours <= 4 ? 3 : 4

        // Duration distribution
        const durations = distributeDuration(dailyHours * 60, numTasks)

        // Generate tasks
        for (let i = 0; i < numTasks; i++) {
            let type = isReviewDay ? 'revision' : (isDayBeforeExam && i === 0 ? 'mock_exam' : taskTypes[i % taskTypes.length])

            tasks.push({
                day: dayIndex,
                title: `${type.charAt(0).toUpperCase() + type.slice(1)}: ${dayTopics[i % dayTopics.length]?.name || subjects[0]}`,
                type,
                duration: durations[i],
                subject: dayTopics[i % dayTopics.length]?.name || subjects[0],
                topic: dayTopics[i % dayTopics.length]?.name,
                status: 'pending'
            })
        }

        dayIndex++
    }

    // STEP 6: AI enhancement (optional)
    let tips: string[] | null = null
    let focusAreas: string[] | null = null

    if (aiEnhanced) {
        const enhancement = await generateAIPlanEnhancement({
            profile, subjects, examDate, dailyHours, topicList
        })
        tips = enhancement?.tips
        focusAreas = enhancement?.focusAreas
    }

    // STEP 7: Save to database
    const plan = await db.studyPlan.create({
        data: {
            userId,
            title: `Study Plan: ${subjects.join(', ')}`,
            examDate: exam,
            totalDays: daysRemaining,
            dailyHours,
            subjects,
            status: 'active',
            progress: 0,
            tasks: {
                create: tasks.map(t => ({
                    ...t,
                    tips: tips || undefined,
                    focusAreas: focusAreas || undefined
                }))
            }
        }
    })

    // STEP 8: Log activity
    await db.studentAIActivity.create({
        data: {
            userId,
            activityType: 'study_plan_generated',
            details: { planId: plan.id, subjects, daysRemaining }
        }
    })

    return plan
}
```

### 7.2 `distributeTopics()` — Weight Allocation

```typescript
function distributeTopics(weak, moderate, strong, totalDays) {
    // Weight allocation per day
    const weakWeight = 0.40
    const moderateWeight = 0.30
    const strongWeight = 0.15
    const reviewWeight = 0.15

    const dailySchedule = []

    for (let day = 0; day < totalDays; day++) {
        const dayTopics = []

        // Distribute topics proportionally
        const weakTopic = weak[day % Math.max(1, weak.length)]
        const moderateTopic = moderate[day % Math.max(1, moderate.length)]
        const strongTopic = strong[day % Math.max(1, strong.length)]

        if (weakTopic) dayTopics.push({ ...weakTopic, weight: weakWeight })
        if (moderateTopic) dayTopics.push({ ...moderateTopic, weight: moderateWeight })
        if (strongTopic) dayTopics.push({ ...strongTopic, weight: strongWeight })

        dailySchedule.push(dayTopics)
    }

    return dailySchedule
}
```

### 7.3 `generateAIPlanEnhancement()` — LLM Integration

```typescript
async function generateAIPlanEnhancement(context: {
    profile: StudentLearningProfile
    subjects: string[]
    examDate: string
    dailyHours: number
    topicList: Array<{ name: string, mastery: number }>
}) {
    try {
        const ZAI = require('z-ai-web-dev-sdk')
        const zai = new ZAI()

        const prompt = `Given a student's learning data:
- Learning level: ${context.profile.learningLevel}
- Engagement score: ${context.profile.engagementScore}/100
- Subjects: ${context.subjects.join(', ')}
- Exam date: ${context.examDate}
- Daily study hours: ${context.dailyHours}
- Current topic mastery: ${context.topicList.map(t => `${t.name}: ${t.mastery}%`).join(', ')}

Provide study plan enhancement as JSON:
{
    "tips": ["tip1", "tip2", "tip3"],
    "focusAreas": ["area1", "area2"],
    "scheduleNotes": "Additional scheduling advice"
}`

        const response = await zai.chat({
            messages: [{ role: 'user', content: prompt }],
            thinking: { type: 'disabled' }
        })

        const jsonMatch = response.choices[0].message.content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0])
        }
        return null
    } catch (error) {
        console.error('AI plan enhancement failed:', error)
        return null  // Graceful fallback
    }
}
```

---

## 8. LLM Integration Patterns

### 8.1 Three Import Patterns

The codebase uses three different import patterns for the same SDK:

```typescript
// Pattern 1: Dynamic import (most routes)
const ZAI = await import('z-ai-web-dev-sdk')
const zai = new ZAI.default()

// Pattern 2: Default import (some routes)
import ZAI from 'z-ai-web-dev-sdk'
const zai = new ZAI()

// Pattern 3: CommonJS require (study-planner-service)
const ZAI = require('z-ai-web-dev-sdk')
const zai = new ZAI()
```

### 8.2 Common LLM Call Pattern

```typescript
const response = await zai.chat({
    messages: [
        { role: 'system', content: systemPrompt },
        ...chatHistory,
        { role: 'user', content: userMessage }
    ],
    thinking: { type: 'disabled' }  // Consistent across all calls
})

const aiMessage = response.choices[0].message.content
```

### 8.3 JSON Extraction Pattern

All LLM responses that need structured output use regex extraction:

```typescript
const jsonMatch = aiMessage.match(/\{[\s\S]*\}/)
if (jsonMatch) {
    const parsed = JSON.parse(jsonMatch[0])
    // Use parsed data
}
```

**Limitation:** This regex can fail with nested JSON or multiple JSON objects in the response.

---

## 9. Ask ShijlAI — Context Engineering

### 9.1 System Prompt Construction

The `/api/ai/shijlai/chat` endpoint builds the most context-rich system prompt in the platform:

```typescript
// Base prompt
let systemPrompt = `You are Ask ShijlAI, an AI-powered learning assistant for ShijlAI Academy. `

// Mode-specific prompt
switch (mode) {
    case 'tutor':
        systemPrompt += `You are a warm, friendly learning buddy. Use the Socratic method - guide through questions, not direct answers. Be conversational and encouraging. Do NOT create structured study plans - just help learn concepts naturally.`
        break
    case 'quiz':
        systemPrompt += `You are a quiz generator. Create multiple-choice questions in this exact format:
Question N:
A) option
B) option
C) option
D) option
Answer: [letter]
Explanation: [brief explanation]`
        break
    case 'assignment':
        systemPrompt += `You are an assignment helper. Break down assignments into numbered steps with time estimates. Help students understand the approach without giving direct answers.`
        break
    case 'study_planner':
        systemPrompt += `You are a study schedule generator. Use emoji indicators: 📖 for study blocks, 📝 for practice, 🔄 for review, ☕ for breaks. Create structured, time-boxed schedules.`
        break
    case 'career_advisor':
        systemPrompt += `You are a professional career counselor. Provide phased career development steps with realistic timeframes. Consider the student's current skill level and goals.`
        break
    case 'companion':
        systemPrompt += `You are a warm, caring AI mentor. Naturally reference the student's data when relevant (e.g., "I noticed your Python mastery is at 45%"). Celebrate wins genuinely. Be proactive in suggesting next steps.`
        break
}

// Student profile context
const profile = await db.studentLearningProfile.findUnique({ where: { userId } })
if (profile) {
    systemPrompt += `\n\nStudent Profile:
- Learning Level: ${profile.learningLevel}
- Learning Speed: ${profile.learningSpeed}
- Engagement Score: ${profile.engagementScore}/100
- Consistency Score: ${profile.consistencyScore}/100
- Drop Risk: ${profile.dropRiskScore}/100
- Completion Rate: ${profile.completionRate}%
- Average Quiz Score: ${profile.averageQuizScore}%`
}

// Weak topics
const weakTopics = await getWeakTopics(userId, 50)
if (weakTopics.length > 0) {
    systemPrompt += `\n\nWeak Topics (mastery < 50%):`
    weakTopics.forEach(t => {
        systemPrompt += `\n- ${t.topicId}: ${Math.round(t.masteryScore)}% (Quiz:${Math.round(t.quizScore)}% Assign:${Math.round(t.assignmentScore)}% Practice:${Math.round(t.practiceScore)}% Complete:${Math.round(t.completionScore)}%)`
    })
}

// Course context (if session linked to course)
if (session.courseId) {
    const course = await db.course.findUnique({
        where: { id: session.courseId },
        include: { modules: { include: { lessons: true } } }
    })
    if (course) {
        systemPrompt += `\n\nCourse Context: ${course.title}\n${course.description}\n\nModules:`
        course.modules.forEach(m => {
            systemPrompt += `\n- ${m.title}`
            m.lessons.forEach(l => {
                systemPrompt += `\n  · ${l.title}`
            })
        })
    }
}

// Conversation summary (if available)
const summaries = await db.conversationSummary.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: 'desc' }
})
if (summaries.length > 0) {
    systemPrompt += `\n\nPrevious Conversation Summary: ${summaries[0].summary}`
}

// Recent chat history (last 10 messages)
const recentMessages = await db.shijlAIMessage.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: 'desc' },
    take: 10
})
```

---

## 10. AI Companion — Proactive Intelligence

### 10.1 `buildStudentDataContext(userId)`

The companion builds the most comprehensive student data context:

```typescript
async function buildStudentDataContext(userId: string) {
    const [user, profile, masteries, enrollments, studyPlans, activities, companionMessages] =
        await Promise.all([
            db.user.findUnique({ where: { id: userId } }),
            db.studentLearningProfile.findUnique({ where: { userId } }),
            db.topicMastery.findMany({ where: { userId } }),
            db.enrollment.findMany({
                where: { userId, status: 'active' },
                include: { course: true }
            }),
            db.studyPlan.findMany({
                where: { userId, status: 'active' },
                include: { tasks: true }
            }),
            db.studentAIActivity.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 10
            }),
            db.aICompanionMessage.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 5
            })
        ])

    return {
        user,
        profile: profile || createDefaultProfile(),
        masteries,
        enrollments,
        studyPlans,
        recentActivities: activities,
        recentMessages: companionMessages,
        weakTopics: masteries.filter(m => m.masteryScore < 50).sort((a, b) => a.masteryScore - b.masteryScore),
        strongTopics: masteries.filter(m => m.masteryScore >= 75).sort((a, b) => b.masteryScore - a.masteryScore),
        avgMastery: masteries.length > 0
            ? masteries.reduce((sum, m) => sum + m.masteryScore, 0) / masteries.length
            : 0
    }
}
```

### 10.2 `runCompanionEngine(ctx)` — Rule-Based Insights

```typescript
function runCompanionEngine(ctx: StudentDataContext) {
    const insights: CompanionInsight[] = []

    // Rule 1: Inactivity alert
    const daysSinceActive = ctx.user?.lastActiveAt
        ? daysBetween(ctx.user.lastActiveAt, new Date())
        : 999
    if (daysSinceActive >= 5) {
        insights.push({
            type: 'inactivity',
            severity: daysSinceActive >= 14 ? 'critical' : 'warning',
            title: 'Inactivity Detected',
            message: `You haven't studied in ${daysSinceActive} days. Let's get back on track!`,
            action: { type: 'navigate', target: 'dashboard' }
        })
    }

    // Rule 2: Weak topic alert
    const weakestTopic = ctx.weakTopics[0]
    if (weakestTopic && weakestTopic.masteryScore < 30) {
        insights.push({
            type: 'weak_topic',
            severity: 'warning',
            title: 'Weak Topic Needs Attention',
            message: `${weakestTopic.topicId} mastery is at ${Math.round(weakestTopic.masteryScore)}%. Consider reviewing the basics.`,
            action: { type: 'navigate', target: 'tutor', params: { topic: weakestTopic.topicId } }
        })
    }

    // Rule 3: Missed study plan tasks
    const missedTasks = ctx.studyPlans
        .flatMap(p => p.tasks)
        .filter(t => t.status === 'pending' && isOverdue(t))
    if (missedTasks.length > 0) {
        insights.push({
            type: 'missed_tasks',
            severity: 'info',
            title: 'Missed Study Tasks',
            message: `You missed ${missedTasks.length} study plan task(s) recently.`,
            action: { type: 'navigate', target: 'study-planner' }
        })
    }

    // Rule 4: Upcoming exam
    const upcomingExams = ctx.studyPlans
        .filter(p => p.examDate && daysBetween(new Date(), p.examDate) <= 14)
    if (upcomingExams.length > 0) {
        const daysLeft = daysBetween(new Date(), upcomingExams[0].examDate)
        insights.push({
            type: 'upcoming_exam',
            severity: daysLeft <= 3 ? 'critical' : 'warning',
            title: 'Exam Approaching',
            message: `Your ${upcomingExams[0].subjects.join(', ')} exam is in ${daysLeft} days!`,
            action: { type: 'navigate', target: 'study-planner' }
        })
    }

    // Rule 5: Recent achievements
    const recentAchievements = ctx.recentActivities
        .filter(a => a.activityType.includes('badge') || a.activityType.includes('level'))
    if (recentAchievements.length > 0) {
        insights.push({
            type: 'achievement',
            severity: 'info',
            title: 'Recent Achievement!',
            message: `Great job! ${recentAchievements[0].details?.title || 'Keep it up!'}`,
        })
    }

    return insights
}
```

### 10.3 Personality Adaptation

```typescript
function getCompanionPersonality(ctx: StudentDataContext) {
    const { engagementScore, masteryScore } = {
        engagementScore: ctx.profile?.engagementScore || 50,
        masteryScore: ctx.avgMastery
    }

    if (engagementScore < 40 && masteryScore < 50) {
        return {
            type: 'coach',
            greeting: "Hey! I'm here to help you get back on track. Let's start with something small today!",
            tone: 'motivational, encouraging, structured'
        }
    }

    if (engagementScore >= 40 && masteryScore < 60) {
        return {
            type: 'mentor',
            greeting: "Good to see you! Ready to learn something new today?",
            tone: 'patient, explanatory, step-by-step'
        }
    }

    return {
        type: 'advisor',
        greeting: "Welcome back! Ready for a challenge today?",
        tone: 'challenging, advanced, exploratory'
    }
}
```

---

## 11. Mock Interview — Simulation Engine

### 11.1 Interview Pipeline

```
1. START → Generate questions (LLM or fallback bank)
2. For each question:
   a. Present question to student
   b. Student submits answer
   c. LLM evaluates answer → returns score + feedback + ideal answer
3. COMPLETE → LLM generates comprehensive report
4. Update topic masteries based on interview performance
```

### 11.2 Fallback Question Bank Structure

```typescript
const FALLBACK_QUESTIONS = {
    python: {
        beginner: [
            {
                question: "What is the difference between a list and a tuple in Python?",
                idealAnswer: "Lists are mutable, tuples are immutable. Lists use [], tuples use (). Tuples are faster and can be used as dictionary keys.",
                topic: "python_data_structures"
            },
            // ... 5 questions per domain-level
        ],
        intermediate: [/* ... */],
        advanced: [/* ... */]
    },
    // machine_learning, web_development, data_science, general
}
```

### 11.3 Answer Evaluation Prompt

```typescript
const evaluationPrompt = `You are an interview evaluator. Assess the following answer:

Question: ${question}
Student's Answer: ${answer}
Ideal Answer: ${idealAnswer}

Provide your evaluation as JSON:
{
    "score": 0-100,
    "accuracy": 0-100,
    "completeness": 0-100,
    "clarity": 0-100,
    "feedback": "Specific feedback on the answer",
    "strengths": ["what was good"],
    "improvements": ["what could be better"]
}`
```

### 11.4 Final Report Generation

```typescript
const reportPrompt = `Generate a comprehensive interview report based on these answers:

Domain: ${domain}
Questions and Answers:
${answers.map((a, i) => `Q${i+1}: ${a.question}\nAnswer: ${a.answer}\nScore: ${a.score}`).join('\n\n')}

Provide the report as JSON:
{
    "overallScore": 0-100,
    "accuracy": 0-100,
    "completeness": 0-100,
    "clarity": 0-100,
    "confidence": 0-100,
    "strengths": ["area1", "area2"],
    "weaknesses": ["area1", "area2"],
    "recommendations": ["rec1", "rec2", "rec3"],
    "skillUpdates": [
        { "topicId": "topic_name", "currentMastery": 50, "suggestedMastery": 55 }
    ]
}`
```

---

## 12. Data Flow Diagrams

### 12.1 Complete Student Learning Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       STUDENT ACTIONS                            │
│  Complete Lesson │ Take Quiz │ Submit Assignment │ Use AI Tutor │
└───────────┬─────────────────────────────────────────────────────┘
            │
            ▼
┌───────────────────────────┐
│     Event Service         │
│  logEvent()               │
│  ├─ db.learningMetric     │
│  ├─ updateTopicMastery()  │──────┐
│  └─ updateStudentProfile()│──┐   │
└───────────────────────────┘  │   │
                               │   │
            ┌──────────────────┘   │
            ▼                      ▼
┌───────────────────────┐  ┌──────────────────────┐
│   Profile Service     │  │   Mastery Service    │
│ ├─ Feature Engine     │  │ ├─ Weighted Formula  │
│ │  ├─ Learning Speed  │  │ ├─ Temporal Decay    │
│ │  ├─ Engagement      │  │ ├─ Trend Tracking    │
│ │  ├─ Consistency     │  │ └─ Skill Mastery     │
│ │  ├─ Performance     │  └──────────────────────┘
│ │  └─ Drop Risk       │           │
│ └─ 5-min Throttle     │           │
└───────────┬───────────┘           │
            │                       │
            ▼                       ▼
┌───────────────────────────────────────────────┐
│           RECOMMENDATION ENGINE               │
│  1. Identify weak areas                       │
│  2. Map prerequisites                         │
│  3. Apply rules (6 rule categories)           │
│  4. Score & prioritize                        │
│     P = 0.40×W + 0.20×CR + 0.20×EM + 0.20×R │
└───────────────────────┬───────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
┌──────────────┐ ┌────────────┐ ┌──────────────┐
│ Ask ShijlAI  │ │ Companion  │ │ Study Planner│
│ 6-mode tutor │ │ Proactive  │ │ Algorithmic  │
│ + profile    │ │ mentor     │ │ + AI enhance │
│ + mastery    │ │ + insights │ │              │
│ + course ctx │ │ + actions  │ │              │
└──────────────┘ └────────────┘ └──────────────┘
```

### 12.2 Ask ShijlAI Message Processing Flow

```
POST /api/ai/shijlai/chat
    │
    ├─ 1. Validate request (sessionId, message, mode)
    │
    ├─ 2. Fetch/create ShijlAISession
    │     └─ db.shijlAISession.findUnique/create
    │
    ├─ 3. Build system prompt
    │     ├─ Mode-specific prompt
    │     ├─ Student profile (from Profile Service)
    │     ├─ Weak topics (from Mastery Service)
    │     ├─ Course context (if session linked)
    │     ├─ Conversation summary (if >20 messages)
    │     └─ Recent chat history (last 10)
    │
    ├─ 4. Call LLM (z-ai-web-dev-sdk)
    │     └─ zai.chat({ messages: [system, ...history, user] })
    │
    ├─ 5. Save messages
    │     ├─ db.shijlAIMessage.create (user message)
    │     └─ db.shijlAIMessage.create (AI response)
    │
    ├─ 6. Update session
    │     ├─ db.shijlAISession.update (messageCount++)
    │     └─ If >20 messages → generate summary
    │
    ├─ 7. Log activity
    │     ├─ logEvent({ eventType: 'ai_tutor_used' })
    │     └─ db.studentAIActivity.create
    │
    └─ 8. Return response
          └─ { message, sessionId, mode }
```

### 12.3 AI Companion Dashboard Generation Flow

```
GET /api/ai/companion
    │
    ├─ 1. buildStudentDataContext(userId)
    │     ├─ 8 parallel DB queries
    │     └─ Returns: user, profile, masteries, enrollments, plans, activities, messages
    │
    ├─ 2. runCompanionEngine(ctx)
    │     ├─ Rule 1: Inactivity check (≥5 days)
    │     ├─ Rule 2: Weak topic check (<30%)
    │     ├─ Rule 3: Missed study plan tasks
    │     ├─ Rule 4: Upcoming exams (≤14 days)
    │     └─ Rule 5: Recent achievements
    │
    ├─ 3. buildTodaysFocus(weakTopics, examTopics)
    │     └─ Priority sort: exam-linked weak → weak → exam-linked
    │
    ├─ 4. buildSuggestedActions(ctx)
    │     └─ Review weakest (+25 XP), Take quiz (+20), Continue path (+15)
    │
    ├─ 5. getCompanionPersonality(ctx)
    │     └─ Coach | Mentor | Advisor (based on engagement + mastery)
    │
    └─ 6. Return dashboard (falls back to demo on error)
          └─ { todaysFocus, insights, suggestedActions, stats, companionChat }
```
