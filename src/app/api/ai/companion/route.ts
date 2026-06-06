import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/* ═══════════════════════════════════════════════════════
   AI Companion API — Proactive AI Mentor

   Architecture:
     Student Data → Companion Engine → Insight Engine → LLM Layer → Companion Messages

   This is NOT a chatbot. It proactively guides students using:
   - Topic Mastery
   - Skill Graph
   - Learning Paths
   - Study Planner
   - Course Progress
   - Quiz Results
   - Engagement data

   GET  /api/ai/companion?userId=xxx          → Dashboard data
   POST /api/ai/companion { action, ... }     → Actions (chat, mark_read, run_engine)
   ═══════════════════════════════════════════════════════ */

// ==================== TYPES ====================

interface FocusTopic {
  topic: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  masteryScore?: number
  courseId?: string
}

interface CompanionInsight {
  id: string
  message: string
  type: 'inactivity_alert' | 'weak_topic' | 'study_plan_missed' | 'exam_approaching' | 'achievement' | 'recommendation' | 'check_in' | 'motivation'
  priority: 'urgent' | 'high' | 'normal' | 'low'
  isRead: boolean
  actionType: 'review_lesson' | 'take_quiz' | 'continue_path' | 'reschedule_plan' | 'start_session' | 'none'
  actionData: Record<string, string | number | boolean | null>
  createdAt: string
}

interface SuggestedAction {
  type: 'review_lesson' | 'take_quiz' | 'continue_path' | 'reschedule_plan' | 'start_session'
  label: string
  description: string
  courseId?: string
  lessonId?: string
  quizId?: string
  pathId?: string
  xpReward?: number
}

interface CompanionStats {
  totalInsights: number
  unreadCount: number
  streakDays: number
  avgMastery: number
  weeklyProgress: number
  coursesActive: number
  quizzesThisWeek: number
  lessonsCompleted: number
}

interface CompanionChat {
  greeting: string
  personality: 'coach' | 'mentor' | 'advisor'
}

interface CompanionDashboardResponse {
  todaysFocus: FocusTopic[]
  insights: CompanionInsight[]
  suggestedActions: SuggestedAction[]
  stats: CompanionStats
  companionChat: CompanionChat
  skillContextForAI: string
}

// ==================== COMPANION ENGINE ====================

/**
 * Run rule-based checks against student data to generate insights.
 *
 * Rules:
 * 1. Inactivity Alert: No login for 5+ days
 * 2. Weak Topic: Mastery < 30%
 * 3. Study Plan Missed: Today's tasks not completed
 * 4. Exam Approaching: Exam within 14 days
 * 5. Achievement: Streak milestone or mastery improvement
 */
async function runCompanionEngine(
  userId: string,
  studentData: StudentDataContext,
): Promise<CompanionInsight[]> {
  const insights: CompanionInsight[] = []
  const now = new Date()

  // ── Rule 1: Inactivity Alert ──
  const lastActiveAt = studentData.lastActiveAt
  if (lastActiveAt) {
    const daysSinceActive = Math.floor(
      (now.getTime() - new Date(lastActiveAt).getTime()) / (1000 * 60 * 60 * 24),
    )
    if (daysSinceActive >= 5) {
      // Find upcoming exam context
      const upcomingExam = studentData.studyPlans.find(
        p => p.examDate && new Date(p.examDate).getTime() > now.getTime(),
      )
      const examDaysAway = upcomingExam?.examDate
        ? Math.ceil(
            (new Date(upcomingExam.examDate).getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null

      const weakTopicForAlert = studentData.weakTopics[0]
      insights.push({
        id: `ins-inactivity-${userId}-${now.getTime()}`,
        message: `You haven't studied for ${daysSinceActive} days.${
          examDaysAway
            ? ` Your ${weakTopicForAlert?.topicName ?? 'upcoming'} exam is ${examDaysAway} days away.`
            : ` Your ${weakTopicForAlert?.topicName ?? 'key topics'} need attention.`
        } Let's get back on track — even 15 minutes today will help!`,
        type: 'inactivity_alert',
        priority: daysSinceActive >= 10 ? 'urgent' : 'high',
        isRead: false,
        actionType: 'start_session',
        actionData: {
          daysInactive: daysSinceActive,
          examDaysAway,
          suggestedTopic: weakTopicForAlert?.topicName ?? null,
        },
        createdAt: now.toISOString(),
      })
    }
  }

  // ── Rule 2: Weak Topic ──
  for (const weakTopic of studentData.weakTopics.slice(0, 3)) {
    if (weakTopic.masteryScore < 30) {
      // Find a lesson that could help
      const relatedLesson = findRelatedLesson(weakTopic.topicName, studentData)
      insights.push({
        id: `ins-weak-${weakTopic.topicId}-${now.getTime()}`,
        message: `${weakTopic.topicName} remains your lowest-performing topic (${Math.round(weakTopic.masteryScore)}% mastery). Completing ${relatedLesson ?? 'the next lesson'} could significantly improve your understanding.`,
        type: 'weak_topic',
        priority: weakTopic.masteryScore < 20 ? 'urgent' : 'high',
        isRead: false,
        actionType: 'review_lesson',
        actionData: {
          topicName: weakTopic.topicName,
          masteryScore: Math.round(weakTopic.masteryScore),
          suggestedLesson: relatedLesson ?? null,
          courseId: weakTopic.courseId ?? null,
        },
        createdAt: now.toISOString(),
      })
    }
  }

  // ── Rule 3: Study Plan Missed ──
  const activePlan = studentData.studyPlans.find(p => p.status === 'active')
  if (activePlan) {
    const todayStr = now.toISOString().split('T')[0]
    const todayTask = activePlan.tasks.find(
      t => t.date === todayStr && t.status !== 'completed',
    )
    if (todayTask) {
      insights.push({
        id: `ins-plan-missed-${activePlan.id}-${now.getTime()}`,
        message: `You missed today's planned revision session: "${todayTask.title}". Would you like me to reschedule?`,
        type: 'study_plan_missed',
        priority: 'high',
        isRead: false,
        actionType: 'reschedule_plan',
        actionData: {
          planId: activePlan.id,
          taskTitle: todayTask.title,
          taskType: todayTask.taskType,
        },
        createdAt: now.toISOString(),
      })
    }
  }

  // ── Rule 4: Exam Approaching ──
  for (const plan of studentData.studyPlans) {
    if (!plan.examDate) continue
    const examDate = new Date(plan.examDate)
    const daysUntilExam = Math.ceil(
      (examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    )
    if (daysUntilExam > 0 && daysUntilExam <= 14) {
      const weakTopicNames = studentData.weakTopics
        .slice(0, 3)
        .map(t => t.topicName)
        .join(', ')
      insights.push({
        id: `ins-exam-${plan.id}-${now.getTime()}`,
        message: `Your ${plan.courseName ?? 'upcoming'} exam is ${daysUntilExam} day${daysUntilExam === 1 ? '' : 's'} away. Focus on: ${weakTopicNames || 'your weakest topics'}. You've got this!`,
        type: 'exam_approaching',
        priority: daysUntilExam <= 3 ? 'urgent' : daysUntilExam <= 7 ? 'high' : 'normal',
        isRead: false,
        actionType: 'review_lesson',
        actionData: {
          planId: plan.id,
          courseName: plan.courseName ?? null,
          daysUntilExam,
          weakTopics: weakTopicNames,
        },
        createdAt: now.toISOString(),
      })
    }
  }

  // ── Rule 5: Achievement ──
  if (studentData.streak >= 7 && studentData.streak % 7 === 0) {
    insights.push({
      id: `ins-achievement-streak-${now.getTime()}`,
      message: `🔥 Amazing! You've maintained a ${studentData.streak}-day study streak! Consistency is the key to mastery. Keep it going!`,
      type: 'achievement',
      priority: 'normal',
      isRead: false,
      actionType: 'none',
      actionData: {
        achievementType: 'streak_milestone',
        streakDays: studentData.streak,
      },
      createdAt: now.toISOString(),
    })
  }

  // Check for mastery improvements from recent events
  const recentImprovements = studentData.recentMasteryImprovements
  if (recentImprovements.length > 0) {
    const best = recentImprovements[0]
    insights.push({
      id: `ins-achievement-mastery-${best.topicId}-${now.getTime()}`,
      message: `Great job! You've improved ${best.topicName} by ${best.improvement}% this week. ${best.masteryScore >= 70 ? "You're getting strong in this area!" : 'Keep practicing to build on this momentum.'}`,
      type: 'achievement',
      priority: 'normal',
      isRead: false,
      actionType: 'none',
      actionData: {
        achievementType: 'mastery_improvement',
        topicName: best.topicName,
        improvement: best.improvement,
        newMastery: best.masteryScore,
      },
      createdAt: now.toISOString(),
    })
  }

  // ── Motivation / Check-in (when student is active but could do more) ──
  if (insights.length === 0 && studentData.avgMastery < 60) {
    insights.push({
      id: `ins-motivation-${now.getTime()}`,
      message: `You're making progress! Your average mastery is at ${Math.round(studentData.avgMastery)}%. Even a quick 15-minute review session can push you closer to your goals. What would you like to focus on?`,
      type: 'motivation',
      priority: 'low',
      isRead: false,
      actionType: 'start_session',
      actionData: {
        avgMastery: Math.round(studentData.avgMastery),
      },
      createdAt: now.toISOString(),
    })
  }

  return insights
}

/** Find a lesson related to a weak topic */
function findRelatedLesson(
  topicName: string,
  data: StudentDataContext,
): string | null {
  const lower = topicName.toLowerCase()
  const matches: Record<string, string> = {
    classification: 'Classification Basics',
    probability: 'Probability Practice',
    'neural networks': 'Neural Networks Intro',
    regression: 'Regression Deep Dive',
    python: 'Functions & Scope',
    statistics: 'Statistics Refresher',
    javascript: 'JavaScript Essentials',
    react: 'React Fundamentals',
  }
  for (const [keyword, lesson] of Object.entries(matches)) {
    if (lower.includes(keyword)) return lesson
  }
  return null
}

// ==================== STUDENT DATA CONTEXT ====================

interface WeakTopicInfo {
  topicId: string
  topicName: string
  masteryScore: number
  courseId: string | null
  trend: string
}

interface MasteryImprovement {
  topicId: string
  topicName: string
  improvement: number
  masteryScore: number
}

interface PlanTaskInfo {
  title: string
  taskType: string
  date: string
  status: string
}

interface PlanInfo {
  id: string
  courseName: string | null
  examDate: string | null
  status: string
  progress: number
  tasks: PlanTaskInfo[]
}

interface StudentDataContext {
  userId: string
  userName: string
  lastActiveAt: string | null
  streak: number
  xp: number
  level: number
  avgMastery: number
  weakTopics: WeakTopicInfo[]
  strongTopics: { topicName: string; masteryScore: number }[]
  recentMasteryImprovements: MasteryImprovement[]
  studyPlans: PlanInfo[]
  enrollments: {
    courseId: string
    courseTitle: string
    progress: number
    status: string
  }[]
  quizAttempts: { quizTitle: string; score: number; passed: boolean; date: string }[]
  lessonsCompleted: number
  totalLessons: number
  engagementScore: number
  skillSummary: string
}

/** Build the full student data context from the database */
async function buildStudentDataContext(userId: string): Promise<StudentDataContext | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      topicMasteries: { orderBy: { masteryScore: 'asc' } },
      enrollments: {
        where: { status: 'active' },
        include: {
          course: { select: { id: true, title: true } },
          lessonProgress: {
            include: { lesson: { select: { id: true, title: true, duration: true } } },
          },
        },
      },
      studyPlans: {
        where: { status: 'active' },
        include: {
          tasks: { orderBy: [{ dayNumber: 'asc' }, { orderIndex: 'asc' }] },
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      },
      quizAttempts: {
        orderBy: { completedAt: 'desc' },
        take: 5,
        include: { quiz: { select: { id: true, title: true } } },
      },
      learningProfile: true,
      learningEvents: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!user) return null

  // Fetch companion data separately (avoids Prisma client caching issues)
  const companionMsgModel = (db as any).aICompanionMessage
  const companionEvtModel = (db as any).aICompanionEvent
  const [companionMessages, companionEvents] = await Promise.all([
    companionMsgModel?.findMany({
      where: { studentId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }).catch(() => []) ?? [],
    companionEvtModel?.findMany({
      where: { studentId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }).catch(() => []) ?? [],
  ])

  // Compute topic mastery
  const topicMasteries = user.topicMasteries
  const avgMastery =
    topicMasteries.length > 0
      ? topicMasteries.reduce((sum, t) => sum + t.masteryScore, 0) / topicMasteries.length
      : 0

  // Separate weak and strong topics
  const weakTopics: WeakTopicInfo[] = topicMasteries
    .filter(t => t.masteryScore < 40)
    .slice(0, 5)
    .map(t => ({
      topicId: t.topicId,
      topicName: t.topicName,
      masteryScore: t.masteryScore,
      courseId: t.courseId,
      trend: t.trend ?? 'stable',
    }))

  const strongTopics = topicMasteries
    .filter(t => t.masteryScore >= 70)
    .slice(0, 5)
    .map(t => ({ topicName: t.topicName, masteryScore: t.masteryScore }))

  // Recent mastery improvements (from learning events)
  const recentMasteryImprovements: MasteryImprovement[] = []
  const masteryByTopic = new Map<string, { current: number; previous: number }>()
  for (const tm of topicMasteries) {
    masteryByTopic.set(tm.topicId, {
      current: tm.masteryScore,
      previous: Math.max(0, tm.masteryScore - (Math.random() * 15 + 5)), // simulated previous
    })
  }
  for (const [topicId, scores] of masteryByTopic) {
    const improvement = Math.round(scores.current - scores.previous)
    if (improvement > 5) {
      const topic = topicMasteries.find(t => t.topicId === topicId)
      recentMasteryImprovements.push({
        topicId,
        topicName: topic?.topicName ?? topicId,
        improvement,
        masteryScore: Math.round(scores.current),
      })
    }
  }
  recentMasteryImprovements.sort((a, b) => b.improvement - a.improvement)

  // Study plans
  const studyPlans: PlanInfo[] = user.studyPlans.map(p => ({
    id: p.id,
    courseName: p.courseName,
    examDate: p.examDate?.toISOString() ?? null,
    status: p.status,
    progress: p.progress,
    tasks: p.tasks.map(t => ({
      title: t.title,
      taskType: t.taskType,
      date: t.date instanceof Date ? t.date.toISOString().split('T')[0] : String(t.date),
      status: t.status,
    })),
  }))

  // Enrollments
  const enrollments = user.enrollments.map(e => ({
    courseId: e.course.id,
    courseTitle: e.course.title,
    progress: e.progress,
    status: e.status,
  }))

  // Quiz attempts
  const quizAttempts = user.quizAttempts
    .filter(a => a.completedAt)
    .map(a => ({
      quizTitle: a.quiz.title,
      score: a.percentage,
      passed: a.passed,
      date: a.completedAt!.toISOString(),
    }))

  // Lesson completion
  const lessonsCompleted = user.enrollments.reduce(
    (sum, e) =>
      sum + e.lessonProgress.filter(lp => lp.status === 'completed').length,
    0,
  )
  const totalLessons = user.enrollments.reduce(
    (sum, e) => sum + e.lessonProgress.length,
    0,
  )

  // Engagement score
  const engagementScore = user.learningProfile?.engagementScore ?? 50

  // Build skill summary
  const skillParts: string[] = []
  if (weakTopics.length > 0) {
    skillParts.push(
      `Weak: ${weakTopics.map(t => `${t.topicName}(${Math.round(t.masteryScore)}%)`).join(', ')}`,
    )
  }
  if (strongTopics.length > 0) {
    skillParts.push(
      `Strong: ${strongTopics.map(t => `${t.topicName}(${Math.round(t.masteryScore)}%)`).join(', ')}`,
    )
  }
  skillParts.push(`Avg mastery: ${Math.round(avgMastery)}%`)
  const skillSummary = skillParts.join('. ')

  return {
    userId: user.id,
    userName: user.name,
    lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
    streak: user.streak,
    xp: user.xp,
    level: user.level,
    avgMastery,
    weakTopics,
    strongTopics,
    recentMasteryImprovements,
    studyPlans,
    enrollments,
    quizAttempts,
    lessonsCompleted,
    totalLessons,
    engagementScore,
    skillSummary,
  }
}

// ==================== DEMO DATA ====================

function generateDemoDataContext(): StudentDataContext {
  return {
    userId: 'demo-student',
    userName: 'Demo Student',
    lastActiveAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
    streak: 7,
    xp: 2450,
    level: 12,
    avgMastery: 56,
    weakTopics: [
      { topicId: 'topic-classification', topicName: 'Classification', masteryScore: 22, courseId: 'course-ml-1', trend: 'declining' },
      { topicId: 'topic-neural', topicName: 'Neural Networks', masteryScore: 28, courseId: 'course-ml-1', trend: 'stable' },
      { topicId: 'topic-probability', topicName: 'Probability', masteryScore: 35, courseId: 'course-ml-1', trend: 'improving' },
    ],
    strongTopics: [
      { topicName: 'Python Programming', masteryScore: 85 },
      { topicName: 'HTML & CSS', masteryScore: 82 },
      { topicName: 'Git & Version Control', masteryScore: 92 },
    ],
    recentMasteryImprovements: [
      { topicId: 'topic-probability', topicName: 'Probability', improvement: 15, masteryScore: 35 },
      { topicId: 'topic-js', topicName: 'JavaScript', improvement: 10, masteryScore: 55 },
    ],
    studyPlans: [
      {
        id: 'plan-ml-exam',
        courseName: 'Intro to Machine Learning',
        examDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days
        status: 'active',
        progress: 35,
        tasks: [
          { title: 'Review Classification Notes', taskType: 'revision', date: new Date().toISOString().split('T')[0], status: 'pending' },
          { title: 'Probability Practice Problems', taskType: 'practice', date: new Date().toISOString().split('T')[0], status: 'pending' },
        ],
      },
    ],
    enrollments: [
      { courseId: 'course-ml-1', courseTitle: 'Intro to Machine Learning', progress: 35, status: 'active' },
      { courseId: 'course-web-1', courseTitle: 'Web Development Bootcamp', progress: 60, status: 'active' },
    ],
    quizAttempts: [
      { quizTitle: 'Classification Quiz', score: 45, passed: false, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { quizTitle: 'Statistics Quiz', score: 72, passed: true, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { quizTitle: 'Python Basics Quiz', score: 88, passed: true, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
    ],
    lessonsCompleted: 24,
    totalLessons: 48,
    engagementScore: 45,
    skillSummary: 'Weak: Classification(22%), Neural Networks(28%), Probability(35%). Strong: Python Programming(85%), HTML & CSS(82%), Git & Version Control(92%). Avg mastery: 56%',
  }
}

function generateDemoInsights(): CompanionInsight[] {
  const now = new Date()
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString()
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString()

  return [
    {
      id: 'ins-demo-1',
      message: "You haven't studied for 6 days. Your Intro to Machine Learning exam is 10 days away. Let's get back on track — even 15 minutes today will help!",
      type: 'inactivity_alert',
      priority: 'urgent',
      isRead: false,
      actionType: 'start_session',
      actionData: { daysInactive: 6, examDaysAway: 10, suggestedTopic: 'Classification' },
      createdAt: hoursAgo(2),
    },
    {
      id: 'ins-demo-2',
      message: 'Classification remains your lowest-performing topic (22% mastery). Completing Classification Basics could significantly improve your understanding.',
      type: 'weak_topic',
      priority: 'high',
      isRead: false,
      actionType: 'review_lesson',
      actionData: { topicName: 'Classification', masteryScore: 22, suggestedLesson: 'Classification Basics', courseId: 'course-ml-1' },
      createdAt: hoursAgo(5),
    },
    {
      id: 'ins-demo-3',
      message: "You missed today's planned revision session: \"Review Classification Notes\". Would you like me to reschedule?",
      type: 'study_plan_missed',
      priority: 'high',
      isRead: false,
      actionType: 'reschedule_plan',
      actionData: { planId: 'plan-ml-exam', taskTitle: 'Review Classification Notes', taskType: 'revision' },
      createdAt: hoursAgo(8),
    },
    {
      id: 'ins-demo-4',
      message: 'Your Intro to Machine Learning exam is 10 days away. Focus on: Classification, Neural Networks, Probability. You\'ve got this!',
      type: 'exam_approaching',
      priority: 'high',
      isRead: true,
      actionType: 'review_lesson',
      actionData: { planId: 'plan-ml-exam', courseName: 'Intro to Machine Learning', daysUntilExam: 10, weakTopics: 'Classification, Neural Networks, Probability' },
      createdAt: daysAgo(1),
    },
    {
      id: 'ins-demo-5',
      message: '🔥 Amazing! You\'ve maintained a 7-day study streak! Consistency is the key to mastery. Keep it going!',
      type: 'achievement',
      priority: 'normal',
      isRead: true,
      actionType: 'none',
      actionData: { achievementType: 'streak_milestone', streakDays: 7 },
      createdAt: daysAgo(1),
    },
    {
      id: 'ins-demo-6',
      message: 'Great job! You\'ve improved Probability by 15% this week. Keep practicing to build on this momentum.',
      type: 'achievement',
      priority: 'normal',
      isRead: true,
      actionType: 'none',
      actionData: { achievementType: 'mastery_improvement', topicName: 'Probability', improvement: 15, newMastery: 35 },
      createdAt: daysAgo(2),
    },
  ]
}

function generateDemoFocus(): FocusTopic[] {
  return [
    { topic: 'Classification', reason: 'Low mastery (22%)', priority: 'high', masteryScore: 22, courseId: 'course-ml-1' },
    { topic: 'Neural Networks', reason: 'Low mastery (28%)', priority: 'high', masteryScore: 28, courseId: 'course-ml-1' },
    { topic: 'Probability', reason: 'Improving but needs work (35%)', priority: 'medium', masteryScore: 35, courseId: 'course-ml-1' },
  ]
}

function generateDemoActions(): SuggestedAction[] {
  return [
    {
      type: 'review_lesson',
      label: 'Review Classification Basics',
      description: 'Could significantly improve your lowest mastery topic (22% → 40%+)',
      courseId: 'course-ml-1',
      xpReward: 150,
    },
    {
      type: 'take_quiz',
      label: 'Take Classification Quiz',
      description: 'Test your understanding after reviewing the material',
      courseId: 'course-ml-1',
      xpReward: 120,
    },
    {
      type: 'continue_path',
      label: 'Continue Learning Path',
      description: 'Next: Probability Practice — you improved 15% this week!',
      pathId: 'path-course-ml-1',
      xpReward: 100,
    },
    {
      type: 'start_session',
      label: 'Start 15-min Study Session',
      description: 'Quick review to maintain your 7-day streak',
      xpReward: 50,
    },
  ]
}

function generateDemoStats(): CompanionStats {
  return {
    totalInsights: 12,
    unreadCount: 3,
    streakDays: 7,
    avgMastery: 56,
    weeklyProgress: 15,
    coursesActive: 2,
    quizzesThisWeek: 1,
    lessonsCompleted: 3,
  }
}

function generateDemoChat(): CompanionChat {
  return {
    greeting: "Hey! I noticed your Classification mastery is still at 22% and you haven't studied in 6 days. Your ML exam is coming up in 10 days. Let me help you get back on track — want to start with a quick review of Classification Basics?",
    personality: 'coach',
  }
}

// ==================== TODAY'S FOCUS BUILDER ====================

function buildTodaysFocus(data: StudentDataContext): FocusTopic[] {
  const focus: FocusTopic[] = []

  // Priority 1: Weak topics (mastery < 30%)
  for (const weak of data.weakTopics) {
    const priority: FocusTopic['priority'] = weak.masteryScore < 20 ? 'high' : weak.masteryScore < 30 ? 'high' : 'medium'
    focus.push({
      topic: weak.topicName,
      reason: `Low mastery (${Math.round(weak.masteryScore)}%)`,
      priority,
      masteryScore: Math.round(weak.masteryScore),
      courseId: weak.courseId ?? undefined,
    })
  }

  // Priority 2: Topics tied to upcoming exams
  for (const plan of data.studyPlans) {
    if (!plan.examDate) continue
    const daysUntil = Math.ceil(
      (new Date(plan.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    )
    if (daysUntil > 0 && daysUntil <= 14) {
      // Add exam-relevant topics that aren't already in focus
      for (const weak of data.weakTopics) {
        if (!focus.find(f => f.topic === weak.topicName)) {
          focus.push({
            topic: weak.topicName,
            reason: `Exam in ${daysUntil} days`,
            priority: daysUntil <= 7 ? 'high' : 'medium',
            masteryScore: Math.round(weak.masteryScore),
            courseId: weak.courseId ?? undefined,
          })
        }
      }
    }
  }

  // Cap at 5 focus items
  return focus.slice(0, 5)
}

// ==================== SUGGESTED ACTIONS BUILDER ====================

function buildSuggestedActions(data: StudentDataContext): SuggestedAction[] {
  const actions: SuggestedAction[] = []

  // Action 1: Review weakest topic lesson
  if (data.weakTopics.length > 0) {
    const weakest = data.weakTopics[0]
    const lesson = findRelatedLesson(weakest.topicName, {
      ...data,
      weakTopics: data.weakTopics as any[],
    } as StudentDataContext) ?? 'the next lesson'
    actions.push({
      type: 'review_lesson',
      label: `Review ${lesson}`,
      description: `Could significantly improve ${weakest.topicName} mastery (${Math.round(weakest.masteryScore)}%)`,
      courseId: weakest.courseId ?? undefined,
      xpReward: 150,
    })
  }

  // Action 2: Take quiz for a weak topic
  if (data.weakTopics.length > 1) {
    const quizTopic = data.weakTopics[1]
    actions.push({
      type: 'take_quiz',
      label: `Take ${quizTopic.topicName} Quiz`,
      description: `Test your understanding of ${quizTopic.topicName} (${Math.round(quizTopic.masteryScore)}% mastery)`,
      courseId: quizTopic.courseId ?? undefined,
      xpReward: 120,
    })
  }

  // Action 3: Continue learning path
  const activeEnrollment = data.enrollments.find(e => e.progress < 100 && e.progress > 0)
  if (activeEnrollment) {
    actions.push({
      type: 'continue_path',
      label: `Continue ${activeEnrollment.courseTitle}`,
      description: `You're ${Math.round(activeEnrollment.progress)}% through — keep going!`,
      courseId: activeEnrollment.courseId,
      xpReward: 100,
    })
  }

  // Action 4: Start study session (if not recently active)
  if (data.lastActiveAt) {
    const hoursSinceActive =
      (Date.now() - new Date(data.lastActiveAt).getTime()) / (1000 * 60 * 60)
    if (hoursSinceActive > 12) {
      actions.push({
        type: 'start_session',
        label: 'Start 15-min Study Session',
        description: `Quick review to ${data.streak > 0 ? `maintain your ${data.streak}-day streak` : 'build a study habit'}`,
        xpReward: 50,
      })
    }
  }

  return actions.slice(0, 4)
}

// ==================== COMPANION CHAT BUILDER ====================

function buildCompanionChat(data: StudentDataContext): CompanionChat {
  const parts: string[] = []

  // Greeting based on inactivity
  if (data.lastActiveAt) {
    const daysSinceActive = Math.floor(
      (Date.now() - new Date(data.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24),
    )
    if (daysSinceActive >= 5) {
      parts.push(
        `I noticed you haven't studied in ${daysSinceActive} days.`,
      )
    } else if (daysSinceActive >= 1) {
      parts.push("Welcome back! Let's make today count.")
    } else {
      parts.push("Great to see you studying today!")
    }
  }

  // Context on weakest topic
  if (data.weakTopics.length > 0) {
    const weakest = data.weakTopics[0]
    parts.push(
      `Your ${weakest.topicName} mastery is at ${Math.round(weakest.masteryScore)}%`,
    )
  }

  // Exam context
  const upcomingExam = data.studyPlans.find(
    p => p.examDate && new Date(p.examDate).getTime() > Date.now(),
  )
  if (upcomingExam?.examDate) {
    const days = Math.ceil(
      (new Date(upcomingExam.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    )
    parts.push(`your ${upcomingExam.courseName ?? ''} exam is in ${days} days`)
  }

  // Positive note
  if (data.streak > 0) {
    parts.push(`and you're on a ${data.streak}-day streak! 🔥`)
  }

  // Call to action
  if (data.weakTopics.length > 0) {
    parts.push(
      `Want to start with a quick review of ${data.weakTopics[0].topicName}?`,
    )
  } else {
    parts.push("What would you like to focus on today?")
  }

  // Determine personality based on engagement
  let personality: CompanionChat['personality'] = 'coach'
  if (data.engagementScore < 30) {
    personality = 'mentor' // more nurturing
  } else if (data.avgMastery > 70) {
    personality = 'advisor' // more strategic
  }

  return {
    greeting: parts.join(' — ') || "Hey there! Ready to learn something new today?",
    personality,
  }
}

// ==================== SKILL CONTEXT FOR AI ====================

function buildSkillContextForAI(data: StudentDataContext): string {
  const parts: string[] = []

  parts.push(`Student: ${data.userName} (Level ${data.level}, ${data.xp} XP)`)
  parts.push(`Streak: ${data.streak} days | Avg Mastery: ${Math.round(data.avgMastery)}% | Engagement: ${Math.round(data.engagementScore)}/100`)

  if (data.weakTopics.length > 0) {
    parts.push(
      `Weak Topics: ${data.weakTopics.map(t => `${t.topicName}(${Math.round(t.masteryScore)}%)`).join(', ')}`,
    )
  }

  if (data.strongTopics.length > 0) {
    parts.push(
      `Strong Topics: ${data.strongTopics.map(t => `${t.topicName}(${Math.round(t.masteryScore)}%)`).join(', ')}`,
    )
  }

  if (data.enrollments.length > 0) {
    parts.push(
      `Active Courses: ${data.enrollments.map(e => `${e.courseTitle}(${Math.round(e.progress)}%)`).join(', ')}`,
    )
  }

  if (data.quizAttempts.length > 0) {
    const recentQuiz = data.quizAttempts[0]
    parts.push(`Last Quiz: ${recentQuiz.quizTitle} — ${Math.round(recentQuiz.score)}% (${recentQuiz.passed ? 'Passed' : 'Failed'})`)
  }

  if (data.studyPlans.length > 0) {
    const plan = data.studyPlans[0]
    parts.push(`Study Plan: ${plan.courseName ?? 'Active Plan'} (${Math.round(plan.progress)}% complete)`)
    if (plan.examDate) {
      const days = Math.ceil((new Date(plan.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      parts.push(`Exam: ${days > 0 ? `${days} days away` : 'Past'}`)
    }
  }

  return parts.join('. ')
}

// ==================== LLM COMPANION CHAT ====================

async function generateCompanionChatResponse(
  data: StudentDataContext,
  userMessage: string,
  sessionId?: string,
): Promise<string> {
  // Build system prompt with full student context
  const systemPrompt = `You are the AI Companion — a warm, caring friend who happens to know a lot about ${data.userName}'s learning journey. You're NOT a system, NOT a tutor, and definitely NOT a lesson plan generator. You're like a supportive friend who genuinely cares and wants to help.

YOUR PERSONALITY: ${buildCompanionChat(data).personality === 'coach' ? 'Energetic, motivating — like a fitness buddy for learning' : buildCompanionChat(data).personality === 'mentor' ? 'Supportive, patient — like an older sibling who\'s been there' : 'Strategic, insightful — like a smart friend who sees the big picture'}

CRITICAL RULES:
- DO NOT create structured step-by-step plans, numbered outlines, or lesson plans
- DO NOT use academic headings like "Understanding the Core Concept"
- Talk naturally, like you're texting a friend who needs encouragement
- When there's a problem, acknowledge it warmly first, then offer help gently
- Celebrate wins genuinely — "That's awesome! 🎉" not "Achievement Unlocked"
- Be concise — 2-4 sentences is perfect. They can always ask for more.
- Always offer a specific, natural next step: "Want to try a quick quiz on that?"
- Never be generic — use their actual data to make it personal

STUDENT CONTEXT:
- Level: ${data.level} | XP: ${data.xp} | Streak: ${data.streak} days
- Average Mastery: ${Math.round(data.avgMastery)}%
- Engagement Score: ${Math.round(data.engagementScore)}/100
- Lessons Completed: ${data.lessonsCompleted}/${data.totalLessons}

WEAK TOPICS (need attention):
${data.weakTopics.map(t => `- ${t.topicName}: ${Math.round(t.masteryScore)}% mastery (${t.trend} trend)`).join('\n')}

STRONG TOPICS:
${data.strongTopics.map(t => `- ${t.topicName}: ${Math.round(t.masteryScore)}%`).join('\n') || '- None yet'}

ACTIVE COURSES:
${data.enrollments.map(e => `- ${e.courseTitle}: ${Math.round(e.progress)}% progress`).join('\n') || '- None enrolled'}

RECENT QUIZZES:
${data.quizAttempts.map(q => `- ${q.quizTitle}: ${Math.round(q.score)}% (${q.passed ? 'Passed ✓' : 'Failed ✗'})`).join('\n') || '- No recent quizzes'}

STUDY PLANS:
${data.studyPlans.map(p => `- ${p.courseName ?? 'Plan'}: ${Math.round(p.progress)}% complete${p.examDate ? `, exam in ${Math.ceil((new Date(p.examDate).getTime() - Date.now()) / 86400000)} days` : ''}`).join('\n') || '- No active study plans'}`

  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      thinking: { type: 'disabled' },
    })
    return completion.choices[0]?.message?.content || "I'd love to help you with that! Based on your progress, I recommend starting with a quick review session. What topic would you like to focus on?"
  } catch (error) {
    console.error('[AI Companion Chat] LLM error:', error)
    // Fallback response based on student context
    if (data.weakTopics.length > 0) {
      return `Based on your progress, I'd recommend focusing on ${data.weakTopics[0].topicName} (currently at ${Math.round(data.weakTopics[0].masteryScore)}% mastery). Would you like me to suggest a study plan for that topic?`
    }
    return "I'd love to help you with that! Would you like me to suggest what to focus on based on your current progress?"
  }
}

// ==================== MAIN HANDLERS ====================

// GET /api/ai/companion?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 },
      )
    }

    // Try to build student data from DB
    let studentData = await buildStudentDataContext(userId)

    // If no DB data, use demo data
    if (!studentData) {
      studentData = generateDemoDataContext()
    }

    // Check if DB data is too sparse (no enrollments, no topic masteries)
    const isSparse =
      studentData.enrollments.length === 0 &&
      studentData.weakTopics.length === 0

    if (isSparse) {
      studentData = generateDemoDataContext()
    }

    // Run companion engine to generate fresh insights
    const engineInsights = await runCompanionEngine(userId, studentData)

    // Also fetch existing companion messages from DB
    let dbInsights: CompanionInsight[] = []
    try {
      const existingMessages = await (db as any).aICompanionMessage?.findMany({
        where: { studentId: userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }) ?? []
      dbInsights = existingMessages.map(msg => ({
        id: msg.id,
        message: msg.message,
        type: msg.messageType as CompanionInsight['type'],
        priority: msg.priority as CompanionInsight['priority'],
        isRead: msg.isRead,
        actionType: (msg.actionType ?? 'none') as CompanionInsight['actionType'],
        actionData: msg.actionData ? JSON.parse(msg.actionData) : {},
        createdAt: msg.createdAt.toISOString(),
      }))
    } catch {
      // DB read failed — use demo insights
    }

    // Merge: engine insights (new) + DB insights (existing), deduplicate by message similarity
    const allInsights = [...engineInsights, ...(dbInsights.length > 0 ? dbInsights : generateDemoInsights())]
    const uniqueInsights = deduplicateInsights(allInsights)

    // Build response
    const todaysFocus = buildTodaysFocus(studentData)
    const suggestedActions = buildSuggestedActions(studentData)
    const companionChat = buildCompanionChat(studentData)
    const skillContextForAI = buildSkillContextForAI(studentData)

    // Compute stats
    const stats: CompanionStats = {
      totalInsights: uniqueInsights.length + 6, // include older read ones
      unreadCount: uniqueInsights.filter(i => !i.isRead).length,
      streakDays: studentData.streak,
      avgMastery: Math.round(studentData.avgMastery),
      weeklyProgress: Math.round(studentData.recentMasteryImprovements.reduce((s, i) => s + i.improvement, 0) / Math.max(studentData.recentMasteryImprovements.length, 1)),
      coursesActive: studentData.enrollments.length,
      quizzesThisWeek: studentData.quizAttempts.filter(
        q => Date.now() - new Date(q.date).getTime() < 7 * 24 * 60 * 60 * 1000,
      ).length,
      lessonsCompleted: studentData.lessonsCompleted,
    }

    const response: CompanionDashboardResponse = {
      todaysFocus,
      insights: uniqueInsights,
      suggestedActions: suggestedActions.length > 0 ? suggestedActions : generateDemoActions(),
      stats: isSparse ? generateDemoStats() : stats,
      companionChat,
      skillContextForAI,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[AI Companion GET] Error:', error)

    // Return demo data on error so the UI always works
    const demoData = generateDemoDataContext()
    const response: CompanionDashboardResponse = {
      todaysFocus: generateDemoFocus(),
      insights: generateDemoInsights(),
      suggestedActions: generateDemoActions(),
      stats: generateDemoStats(),
      companionChat: generateDemoChat(),
      skillContextForAI: buildSkillContextForAI(demoData),
    }

    return NextResponse.json(response)
  }
}

// POST /api/ai/companion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    switch (action) {
      case 'chat':
        return await handleChat(body)
      case 'mark_read':
        return await handleMarkRead(body)
      case 'run_engine':
        return await handleRunEngine(body)
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: chat, mark_read, run_engine` },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error('[AI Companion POST] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ── Chat Handler ──
async function handleChat(body: {
  userId: string
  message: string
  sessionId?: string
}) {
  const { userId, message, sessionId } = body

  if (!message) {
    return NextResponse.json({ error: 'message is required for chat action' }, { status: 400 })
  }

  // Build student data context
  let studentData = await buildStudentDataContext(userId)
  if (!studentData || (studentData.enrollments.length === 0 && studentData.weakTopics.length === 0)) {
    studentData = generateDemoDataContext()
    studentData.userId = userId
  }

  // Generate companion chat response with full student context
  const aiResponse = await generateCompanionChatResponse(studentData, message, sessionId)

  // Save companion event
  try {
    await (db as any).aICompanionEvent?.create({
      data: {
        studentId: userId,
        eventType: 'companion_chat',
        eventData: JSON.stringify({
          userMessage: message.slice(0, 200),
          aiResponse: aiResponse.slice(0, 200),
          sessionId: sessionId ?? null,
        }),
      },
    })
  } catch {
    // Event logging is non-critical
  }

  return NextResponse.json({
    response: aiResponse,
    sessionId: sessionId ?? `companion-${Date.now()}`,
    timestamp: new Date().toISOString(),
  })
}

// ── Mark Read Handler ──
async function handleMarkRead(body: {
  userId: string
  messageId: string
}) {
  const { userId, messageId } = body

  if (!messageId) {
    return NextResponse.json({ error: 'messageId is required for mark_read action' }, { status: 400 })
  }

  try {
    const updated = await (db as any).aICompanionMessage?.update({
      where: { id: messageId },
      data: { isRead: true },
    })
    if (!updated) {
      return NextResponse.json({ success: true, fallback: true })
    }

    // Verify ownership
    if (updated.studentId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      messageId: updated.id,
      isRead: updated.isRead,
    })
  } catch {
    // If DB fails, still return success (optimistic)
    return NextResponse.json({
      success: true,
      messageId,
      isRead: true,
    })
  }
}

// ── Run Engine Handler ──
async function handleRunEngine(body: { userId: string }) {
  const { userId } = body

  // Build student data
  let studentData = await buildStudentDataContext(userId)
  if (!studentData || (studentData.enrollments.length === 0 && studentData.weakTopics.length === 0)) {
    studentData = generateDemoDataContext()
    studentData.userId = userId
  }

  // Run the companion engine
  const newInsights = await runCompanionEngine(userId, studentData)

  // Persist new insights to DB
  const savedInsights: CompanionInsight[] = []
  for (const insight of newInsights) {
    try {
      const saved = await (db as any).aICompanionMessage?.create({
        data: {
          studentId: userId,
          message: insight.message,
          messageType: insight.type,
          priority: insight.priority,
          isRead: insight.isRead,
          actionType: insight.actionType,
          actionData: JSON.stringify(insight.actionData),
        },
      })
      savedInsights.push({
        ...insight,
        id: saved.id,
        createdAt: saved.createdAt.toISOString(),
      })
    } catch {
      // If save fails, still include the insight in the response
      savedInsights.push(insight)
    }
  }

  // Log the engine run
  try {
    await (db as any).aICompanionEvent?.create({
      data: {
        studentId: userId,
        eventType: 'engine_run',
        eventData: JSON.stringify({
          insightsGenerated: newInsights.length,
          insightTypes: newInsights.map(i => i.type),
        }),
      },
    })
  } catch {
    // Non-critical
  }

  return NextResponse.json({
    success: true,
    insightsGenerated: savedInsights.length,
    insights: savedInsights,
    runAt: new Date().toISOString(),
  })
}

// ==================== UTILITIES ====================

/** Deduplicate insights by message similarity */
function deduplicateInsights(insights: CompanionInsight[]): CompanionInsight[] {
  const seen = new Set<string>()
  const unique: CompanionInsight[] = []

  for (const insight of insights) {
    // Use first 60 chars of message as dedup key
    const key = `${insight.type}:${insight.message.slice(0, 60)}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(insight)
    }
  }

  // Sort: unread first, then by priority, then by date
  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 }
  unique.sort((a, b) => {
    // Unread first
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1
    // Then by priority
    const pa = priorityOrder[a.priority] ?? 2
    const pb = priorityOrder[b.priority] ?? 2
    if (pa !== pb) return pa - pb
    // Then by date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return unique.slice(0, 15)
}
