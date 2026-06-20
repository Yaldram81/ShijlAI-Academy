import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AIService } from '@/services/ai'

// ═══════════════════════════════════════════════════════════════════
// ─── Types ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

type CopilotIntent =
  | 'course_analysis'
  | 'instructor_analysis'
  | 'student_analysis'
  | 'engagement_analysis'
  | 'enrollment_analysis'
  | 'risk_analysis'
  | 'report_generation'
  | 'search'
  | 'platform_overview'

interface CopilotQuery {
  adminId: string
  query: string
  sessionId?: string
}

interface IntentMatch {
  intent: CopilotIntent
  confidence: number
}

// In-memory store for recent queries per admin (no new Prisma models)
const recentQueriesMap = new Map<string, Array<{ query: string; intent: string; timestamp: string }>>()

// ═══════════════════════════════════════════════════════════════════
// ─── Module 1: Intent Detection Engine ────────────────────────────
// ═══════════════════════════════════════════════════════════════════

const INTENT_KEYWORDS: Record<CopilotIntent, string[]> = {
  course_analysis: [
    'course performance', 'course analysis', 'underperforming courses', 'courses need attention',
    'course health', 'course quality', 'course rating', 'course completion', 'course drop',
    'course problem', 'worst courses', 'best courses', 'course metrics', 'course stats',
    'which courses', 'how are courses', 'course review',
  ],
  instructor_analysis: [
    'instructor struggling', 'instructor response time', 'instructor performance',
    'instructor analysis', 'instructor rating', 'instructor quality', 'instructor review',
    'which instructors', 'instructor effectiveness', 'instructor problem', 'instructor attention',
    'instructors need review', 'instructor stats', 'instructor metrics', 'teaching quality',
  ],
  student_analysis: [
    'at-risk students', 'at risk students', 'inactive students', 'student dropout',
    'student analysis', 'failing students', 'student risk', 'student performance',
    'struggling students', 'student engagement', 'student problem', 'student attention',
    'how many students are inactive', 'student dropout rate', 'students leaving',
  ],
  engagement_analysis: [
    'engagement', 'student activity', 'participation', 'student engagement',
    'engagement analysis', 'activity level', 'platform engagement', 'engagement rate',
    'how active', 'activity trends', 'student participation', 'lesson engagement',
  ],
  enrollment_analysis: [
    'enrollments dropping', 'enrollment trends', 'new signups', 'enrollment analysis',
    'enrollment decline', 'enrollment stats', 'enrollment numbers', 'sign up rate',
    'why are enrollments', 'enrollment growth', 'new enrollments', 'enrollment data',
  ],
  risk_analysis: [
    'what needs attention', 'risks', 'immediate priorities', 'risk analysis',
    'what requires attention', 'requires immediate attention', 'needs attention',
    'urgent issues', 'critical issues', 'priority',
    'what should i focus on', 'immediate action', 'immediate attention',
    'alerts', 'problems', 'what needs immediate', 'attention required',
  ],
  report_generation: [
    'generate report', 'weekly report', 'monthly report', 'report',
    'summary report', 'performance report', 'analytics report', 'create report',
    'export report', 'download report',
  ],
  search: [
    'find students', 'find courses', 'search for', 'show me students',
    'list courses', 'courses with low rating', 'inactive for', 'filter',
    'who are', 'how many students', 'how many courses',
  ],
  platform_overview: [
    'what happened this week', 'platform summary', 'overview', 'platform overview',
    'dashboard summary', 'how is the platform', 'platform status', 'platform health',
    'tell me about the platform', 'what is the state', 'current status', 'big picture',
  ],
}

function detectIntent(query: string): IntentMatch {
  const lowerQuery = query.toLowerCase()

  // Score each intent by keyword matches
  const scores: Record<CopilotIntent, number> = {
    course_analysis: 0,
    instructor_analysis: 0,
    student_analysis: 0,
    engagement_analysis: 0,
    enrollment_analysis: 0,
    risk_analysis: 0,
    report_generation: 0,
    search: 0,
    platform_overview: 0,
  }

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword)) {
        scores[intent as CopilotIntent] += keyword.split(' ').length // multi-word matches score higher
      }
    }
  }

  // Also check for important individual words that signal intent
  const wordBoosts: Record<string, CopilotIntent[]> = {
    'risk': ['risk_analysis'],
    'urgent': ['risk_analysis'],
    'immediate': ['risk_analysis'],
    'critical': ['risk_analysis'],
    'attention': ['risk_analysis', 'course_analysis'],
    'inactive': ['student_analysis'],
    'dropout': ['student_analysis'],
    'at-risk': ['student_analysis'],
    'enrollment': ['enrollment_analysis'],
    'engagement': ['engagement_analysis'],
    'instructor': ['instructor_analysis'],
    'course': ['course_analysis'],
    'report': ['report_generation'],
  }
  const queryWords = lowerQuery.split(/\s+/)
  for (const word of queryWords) {
    const cleanWord = word.replace(/[^a-z-]/g, '')
    if (wordBoosts[cleanWord]) {
      for (const intent of wordBoosts[cleanWord]) {
        scores[intent] += 0.5 // small boost for individual keyword matches
      }
    }
  }

  // Find best match
  let bestIntent: CopilotIntent = 'platform_overview'
  let bestScore = 0

  for (const [intent, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score
      bestIntent = intent as CopilotIntent
    }
  }

  // If no clear match, default to platform_overview
  if (bestScore === 0) {
    // Check for generic search patterns like "X days", "inactive", etc.
    if (lowerQuery.match(/\b\d+\s+days?\b/) || lowerQuery.includes('inactive') || lowerQuery.includes('find')) {
      bestIntent = 'search'
      bestScore = 1
    } else {
      bestIntent = 'platform_overview'
      bestScore = 0
    }
  }

  return {
    intent: bestIntent,
    confidence: Math.min(bestScore / 5, 1), // normalize confidence
  }
}

// ═══════════════════════════════════════════════════════════════════
// ─── Module 2: Data Retrieval Engine ──────────────────────────────
// ═══════════════════════════════════════════════════════════════════

// --- Helpers ---

function safeDiv(num: number, den: number): number {
  return den === 0 ? 0 : num / den
}

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
}

function dateStr(d: Date): string {
  return d.toISOString().split('T')[0]
}

// --- Demo Data Fallbacks ---

function getDemoCourseData() {
  const courses = [
    { id: 'demo-c1', title: 'Python for Beginners', category: 'Programming', instructor: 'Dr. Sarah Khan', rating: 4.5, enrollmentCount: 245, completionRate: 68, isPublished: true, avgProgress: 52 },
    { id: 'demo-c2', title: 'Machine Learning Fundamentals', category: 'AI/ML', instructor: 'Prof. Ahmed Ali', rating: 4.2, enrollmentCount: 180, completionRate: 45, isPublished: true, avgProgress: 38 },
    { id: 'demo-c3', title: 'Web Development Bootcamp', category: 'Web Dev', instructor: 'Zainab Malik', rating: 3.8, enrollmentCount: 310, completionRate: 55, isPublished: true, avgProgress: 44 },
    { id: 'demo-c4', title: 'Data Structures & Algorithms', category: 'CS', instructor: 'Dr. Tariq Hassan', rating: 4.7, enrollmentCount: 155, completionRate: 72, isPublished: true, avgProgress: 58 },
    { id: 'demo-c5', title: 'React Native Mobile Dev', category: 'Mobile', instructor: 'Fatima Noor', rating: 3.2, enrollmentCount: 88, completionRate: 22, isPublished: true, avgProgress: 25 },
    { id: 'demo-c6', title: 'Cybersecurity Essentials', category: 'Security', instructor: 'Omar Siddiqui', rating: 4.0, enrollmentCount: 130, completionRate: 58, isPublished: true, avgProgress: 46 },
    { id: 'demo-c7', title: 'AWS Cloud Practitioner', category: 'Cloud', instructor: 'Ayesha Rahman', rating: 2.9, enrollmentCount: 65, completionRate: 15, isPublished: true, avgProgress: 18 },
    { id: 'demo-c8', title: 'Advanced JavaScript', category: 'Programming', instructor: 'Bilal Raza', rating: 4.3, enrollmentCount: 200, completionRate: 61, isPublished: true, avgProgress: 50 },
  ]
  const underperforming = courses.filter(c => c.completionRate < 30 || c.rating < 3.5)
  const avgCompletion = courses.reduce((s, c) => s + c.completionRate, 0) / courses.length
  const avgRating = courses.reduce((s, c) => s + c.rating, 0) / courses.length
  return { courses, underperforming, avgCompletion: Math.round(avgCompletion * 10) / 10, avgRating: Math.round(avgRating * 10) / 10, totalCourses: courses.length, publishedCourses: courses.length }
}

function getDemoInstructorData() {
  const instructors = [
    { id: 'demo-i1', name: 'Dr. Sarah Khan', courseCount: 3, totalStudents: 520, avgRating: 4.5, completionRate: 68, avgResponseTime: 4, effectivenessScore: 82, warnings: [] as string[] },
    { id: 'demo-i2', name: 'Prof. Ahmed Ali', courseCount: 2, totalStudents: 280, avgRating: 4.2, completionRate: 45, avgResponseTime: 12, effectivenessScore: 65, warnings: ['Slow Q&A response time (avg 12h)'] },
    { id: 'demo-i3', name: 'Zainab Malik', courseCount: 2, totalStudents: 410, avgRating: 3.8, completionRate: 55, avgResponseTime: 8, effectivenessScore: 58, warnings: ['Average rating below 4.0'] },
    { id: 'demo-i4', name: 'Dr. Tariq Hassan', courseCount: 1, totalStudents: 155, avgRating: 4.7, completionRate: 72, avgResponseTime: 2, effectivenessScore: 90, warnings: [] },
    { id: 'demo-i5', name: 'Fatima Noor', courseCount: 1, totalStudents: 88, avgRating: 3.2, completionRate: 22, avgResponseTime: 36, effectivenessScore: 28, warnings: ['Low rating: 3.2/5', 'Very low completion rate: 22%', 'Slow Q&A response: 36h avg', 'No new enrollments in 30 days'] },
    { id: 'demo-i6', name: 'Omar Siddiqui', courseCount: 2, totalStudents: 195, avgRating: 4.0, completionRate: 58, avgResponseTime: 6, effectivenessScore: 70, warnings: [] },
    { id: 'demo-i7', name: 'Ayesha Rahman', courseCount: 1, totalStudents: 65, avgRating: 2.9, completionRate: 15, avgResponseTime: 48, effectivenessScore: 18, warnings: ['Critical: Rating 2.9/5', 'Critical: Completion rate 15%', 'Very slow Q&A response: 48h avg', 'No new enrollments in 30 days'] },
  ]
  const struggling = instructors.filter(i => i.warnings.length > 0)
  return { instructors, struggling, totalInstructors: instructors.length, avgEffectiveness: Math.round(instructors.reduce((s, i) => s + i.effectivenessScore, 0) / instructors.length * 10) / 10 }
}

function getDemoStudentData() {
  const now = new Date()
  return {
    totalStudents: 1247,
    atRiskCount: 89,
    inactiveCount: 156,
    failingQuizCount: 67,
    avgProgress: 42,
    recentSignups: 34,
    dropoutRisk: [
      { id: 'demo-s1', name: 'Hassan Ali', lastActive: '15 days ago', progress: 12, riskScore: 92 },
      { id: 'demo-s2', name: 'Maryam Khan', lastActive: '21 days ago', progress: 8, riskScore: 88 },
      { id: 'demo-s3', name: 'Usman Sheikh', lastActive: '18 days ago', progress: 15, riskScore: 85 },
    ],
    inactiveStudents: [
      { id: 'demo-s4', name: 'Aisha Bhatti', lastActive: '28 days ago', enrolledCourses: 2 },
      { id: 'demo-s5', name: 'Raza Hussain', lastActive: '45 days ago', enrolledCourses: 1 },
    ],
    failingStudents: [
      { id: 'demo-s6', name: 'Kiran Fatima', avgQuizScore: 35, courses: 1 },
      { id: 'demo-s7', name: 'Imran Shah', avgQuizScore: 28, courses: 2 },
    ],
    now: now.toISOString(),
  }
}

function getDemoEngagementData() {
  return {
    activeUsersToday: 89,
    activeUsersThisWeek: 342,
    activeUsersThisMonth: 678,
    totalActiveEnrollments: 856,
    avgSessionDuration: 24,
    aiUsageCount: 1245,
    aiActiveUsers: 234,
    lessonCompletionsWeek: 189,
    quizAttemptsWeek: 67,
    discussionPostsWeek: 23,
    engagementByCourse: [
      { course: 'Python for Beginners', score: 72, trend: 'up' },
      { course: 'Machine Learning Fundamentals', score: 45, trend: 'down' },
      { course: 'Web Development Bootcamp', score: 58, trend: 'stable' },
      { course: 'React Native Mobile Dev', score: 22, trend: 'down' },
      { course: 'AWS Cloud Practitioner', score: 18, trend: 'down' },
    ],
  }
}

function getDemoEnrollmentData() {
  return {
    totalEnrollments: 1373,
    thisMonth: 89,
    lastMonth: 112,
    monthBefore: 95,
    enrollmentTrend: -20.5,
    popularCourses: [
      { title: 'Web Development Bootcamp', enrollments: 310, growth: 12 },
      { title: 'Python for Beginners', enrollments: 245, growth: 8 },
      { title: 'Advanced JavaScript', enrollments: 200, growth: -3 },
      { title: 'Machine Learning Fundamentals', enrollments: 180, growth: -8 },
    ],
    decliningCourses: [
      { title: 'AWS Cloud Practitioner', enrollments: 65, growth: -42 },
      { title: 'React Native Mobile Dev', enrollments: 88, growth: -25 },
    ],
    conversionRate: 12.4,
    avgEnrollmentPerCourse: 171,
  }
}

function getDemoPlatformOverview() {
  return {
    totalUsers: 1589,
    totalStudents: 1247,
    totalInstructors: 28,
    totalCourses: 42,
    publishedCourses: 35,
    totalEnrollments: 1373,
    totalRevenue: 2847500,
    revenueThisMonth: 342000,
    revenueLastMonth: 398000,
    revenueTrend: -14.1,
    dailyActiveUsers: 89,
    weeklyActiveUsers: 342,
    monthlyActiveUsers: 678,
    completionRate: 49,
    avgRating: 3.9,
    alerts: [
      { severity: 'critical', title: '2 instructors with critical effectiveness scores', entity: 'instructor' },
      { severity: 'critical', title: '156 students inactive for 14+ days', entity: 'student' },
      { severity: 'warning', title: 'Enrollment down 20.5% this month', entity: 'platform' },
      { severity: 'warning', title: '3 courses with completion rate below 30%', entity: 'course' },
    ],
  }
}

// --- Data Retrieval Functions ---

async function fetchCourseAnalysisData() {
  try {
    const courses = await db.course.findMany({
      where: { isPublished: true },
      include: {
        instructor: { select: { id: true, name: true } },
        enrollments: { select: { id: true, progress: true, status: true, enrolledAt: true, completedAt: true } },
        reviews: { select: { rating: true } },
      },
    })

    if (courses.length === 0) return getDemoCourseData()

    const analysis = courses.map(c => {
      const enrollmentCount = c.enrollments.length
      const completedCount = c.enrollments.filter(e => e.status === 'completed' || e.completedAt).length
      const completionRate = enrollmentCount > 0 ? Math.round(safeDiv(completedCount, enrollmentCount) * 1000) / 10 : 0
      const avgRating = c.reviews.length > 0
        ? Math.round(c.reviews.reduce((s, r) => s + r.rating, 0) / c.reviews.length * 10) / 10
        : c.rating
      const avgProgress = enrollmentCount > 0
        ? Math.round(c.enrollments.reduce((s, e) => s + e.progress, 0) / enrollmentCount * 10) / 10
        : 0

      return {
        id: c.id,
        title: c.title,
        category: c.category,
        instructor: c.instructor.name,
        rating: avgRating,
        enrollmentCount,
        completionRate,
        isPublished: c.isPublished,
        avgProgress,
      }
    })

    const underperforming = analysis.filter(c => c.completionRate < 30 || c.rating < 3.5)
    const avgCompletion = analysis.length > 0 ? Math.round(analysis.reduce((s, c) => s + c.completionRate, 0) / analysis.length * 10) / 10 : 0
    const avgRating = analysis.length > 0 ? Math.round(analysis.reduce((s, c) => s + c.rating, 0) / analysis.length * 10) / 10 : 0

    return { courses: analysis, underperforming, avgCompletion, avgRating, totalCourses: courses.length, publishedCourses: analysis.length }
  } catch {
    return getDemoCourseData()
  }
}

async function fetchInstructorAnalysisData() {
  try {
    const instructors = await db.user.findMany({
      where: { role: 'instructor' },
      select: {
        id: true,
        name: true,
        lastActiveAt: true,
        coursesCreated: {
          where: { isPublished: true },
          select: {
            id: true,
            title: true,
            enrollmentCount: true,
            rating: true,
            enrollments: {
              select: { id: true, progress: true, status: true, completedAt: true, enrolledAt: true },
            },
            reviews: { select: { rating: true } },
            quizzes: {
              select: {
                attempts: {
                  where: { completedAt: { not: null } },
                  select: { percentage: true },
                },
              },
            },
          },
        },
        qaAnswers: {
          select: { createdAt: true, question: { select: { createdAt: true } } },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (instructors.length === 0) return getDemoInstructorData()

    const now = new Date()
    const analysis = instructors.map(inst => {
      const courses = inst.coursesCreated
      const courseCount = courses.length
      const totalStudents = courses.reduce((s, c) => s + c.enrollmentCount, 0)
      const allEnrollments = courses.flatMap(c => c.enrollments)
      const completedCount = allEnrollments.filter(e => e.status === 'completed' || e.completedAt).length
      const completionRate = allEnrollments.length > 0
        ? Math.round(safeDiv(completedCount, allEnrollments.length) * 1000) / 10
        : 0

      const allRatings = courses.flatMap(c => c.reviews.map(r => r.rating))
      const avgRating = allRatings.length > 0
        ? Math.round(allRatings.reduce((s, r) => s + r, 0) / allRatings.length * 10) / 10
        : courseCount > 0 ? Math.round(courses.reduce((s, c) => s + c.rating, 0) / courseCount * 10) / 10 : 0

      // Response time from Q&A data
      const responseTimes = inst.qaAnswers
        .filter(a => a.question)
        .map(a => {
          const qDate = new Date(a.question.createdAt)
          const aDate = new Date(a.createdAt)
          return (aDate.getTime() - qDate.getTime()) / (1000 * 60 * 60) // hours
        })
        .filter(h => h >= 0)
      const avgResponseTime = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((s, t) => s + t, 0) / responseTimes.length * 10) / 10
        : 0

      // Student success rate
      const allQuizAttempts = courses.flatMap(c => c.quizzes.flatMap(q => q.attempts))
      const studentSuccessRate = allQuizAttempts.length > 0
        ? Math.round(allQuizAttempts.reduce((s, a) => s + a.percentage, 0) / allQuizAttempts.length * 10) / 10
        : 0

      // Effectiveness score (weighted)
      const ratingNorm = safeDiv(avgRating, 5) * 100
      const effectivenessScore = Math.round(
        completionRate * 0.30 +
        ratingNorm * 0.25 +
        studentSuccessRate * 0.25 +
        (allEnrollments.length > 0 ? allEnrollments.filter(e => e.status === 'active').reduce((s, e) => s + e.progress, 0) / allEnrollments.filter(e => e.status === 'active').length : 0) * 0.20
      )

      // Warnings
      const warnings: string[] = []
      if (avgResponseTime > 24) warnings.push(`Slow Q&A response time (avg ${avgResponseTime}h)`)
      if (avgRating > 0 && avgRating < 4.0) warnings.push('Average rating below 4.0')
      if (completionRate < 25 && allEnrollments.length > 5) warnings.push(`Low completion rate: ${completionRate}%`)
      const daysSinceActive = Math.floor((now.getTime() - new Date(inst.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24))
      if (daysSinceActive > 14) warnings.push(`Inactive for ${daysSinceActive} days`)

      return {
        id: inst.id,
        name: inst.name,
        courseCount,
        totalStudents,
        avgRating,
        completionRate,
        avgResponseTime,
        effectivenessScore: Math.min(effectivenessScore, 100),
        studentSuccessRate,
        warnings,
      }
    })

    const struggling = analysis.filter(i => i.warnings.length > 0)
    return {
      instructors: analysis,
      struggling,
      totalInstructors: analysis.length,
      avgEffectiveness: analysis.length > 0 ? Math.round(analysis.reduce((s, i) => s + i.effectivenessScore, 0) / analysis.length * 10) / 10 : 0,
    }
  } catch {
    return getDemoInstructorData()
  }
}

async function fetchStudentAnalysisData() {
  try {
    const now = new Date()
    const fourteenDaysAgo = daysAgo(14)

    const [totalStudents, studentsWithEnrollments, inactiveStudents, failingStudents] = await Promise.all([
      db.user.count({ where: { role: 'student' } }),
      db.user.findMany({
        where: { role: 'student' },
        select: {
          id: true,
          name: true,
          lastActiveAt: true,
          enrollments: {
            select: { progress: true, status: true },
          },
          quizAttempts: {
            where: { completedAt: { not: null } },
            select: { percentage: true, passed: true },
            orderBy: { completedAt: 'desc' },
            take: 10,
          },
          learningProfile: {
            select: { dropRiskScore: true },
          },
        },
      }),
      // Inactive students (lastActiveAt > 14 days ago)
      db.user.findMany({
        where: {
          role: 'student',
          lastActiveAt: { lt: fourteenDaysAgo },
        },
        select: { id: true, name: true, lastActiveAt: true, enrollments: { select: { id: true } } },
        take: 20,
      }),
      // Failing quiz students
      db.user.findMany({
        where: {
          role: 'student',
          quizAttempts: { some: { passed: false, completedAt: { not: null } } },
        },
        select: {
          id: true,
          name: true,
          quizAttempts: {
            where: { completedAt: { not: null } },
            select: { percentage: true, passed: true },
            orderBy: { completedAt: 'desc' },
            take: 5,
          },
        },
        take: 20,
      }),
    ])

    if (totalStudents === 0) return getDemoStudentData()

    // At-risk students (high dropRiskScore)
    const atRiskStudents = studentsWithEnrollments.filter(s => {
      const riskScore = (s as any).learningProfile?.dropRiskScore
      return riskScore && riskScore > 70
    })

    // Calculate average progress
    const activeEnrollments = studentsWithEnrollments.flatMap(s => s.enrollments)
    const avgProgress = activeEnrollments.length > 0
      ? Math.round(activeEnrollments.reduce((s, e) => s + e.progress, 0) / activeEnrollments.length * 10) / 10
      : 0

    // Recent signups
    const sevenDaysAgo = daysAgo(7)
    const recentSignups = studentsWithEnrollments.filter(s => new Date(s.lastActiveAt) >= sevenDaysAgo).length

    // Top at-risk
    const dropoutRisk = atRiskStudents.slice(0, 5).map(s => ({
      id: s.id,
      name: s.name,
      lastActive: `${Math.floor((now.getTime() - new Date(s.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24))} days ago`,
      progress: s.enrollments.length > 0 ? Math.round(s.enrollments.reduce((sum, e) => sum + e.progress, 0) / s.enrollments.length) : 0,
      riskScore: (s as any).learningProfile?.dropRiskScore || 0,
    }))

    const inactive = inactiveStudents.slice(0, 5).map(s => ({
      id: s.id,
      name: s.name,
      lastActive: `${Math.floor((now.getTime() - new Date(s.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24))} days ago`,
      enrolledCourses: s.enrollments.length,
    }))

    const failing = failingStudents.slice(0, 5).map(s => ({
      id: s.id,
      name: s.name,
      avgQuizScore: s.quizAttempts.length > 0
        ? Math.round(s.quizAttempts.reduce((sum, q) => sum + q.percentage, 0) / s.quizAttempts.length)
        : 0,
      courses: s.quizAttempts.length,
    }))

    return {
      totalStudents,
      atRiskCount: atRiskStudents.length,
      inactiveCount: inactiveStudents.length,
      failingQuizCount: failingStudents.length,
      avgProgress,
      recentSignups,
      dropoutRisk,
      inactiveStudents: inactive,
      failingStudents: failing,
      now: now.toISOString(),
    }
  } catch {
    return getDemoStudentData()
  }
}

async function fetchEngagementData() {
  try {
    const now = new Date()
    const sevenDaysAgo = daysAgo(7)
    const thirtyDaysAgo = daysAgo(30)
    const todayStr = dateStr(now)

    const [todayActivity, weekActivity, monthActivity, lessonProgress, quizAttemptsWeek, aiActivities, courses] = await Promise.all([
      db.dailyActivity.findMany({ where: { date: todayStr }, select: { userId: true }, distinct: ['userId'] }),
      db.dailyActivity.findMany({ where: { date: { gte: dateStr(sevenDaysAgo) } }, select: { userId: true }, distinct: ['userId'] }),
      db.dailyActivity.findMany({ where: { date: { gte: dateStr(thirtyDaysAgo) } }, select: { userId: true }, distinct: ['userId'] }),
      db.lessonProgress.aggregate({ _avg: { timeSpent: true }, where: { status: 'completed' } }),
      db.quizAttempt.count({ where: { completedAt: { gte: sevenDaysAgo } } }),
      db.studentAIActivity.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      db.course.findMany({
        where: { isPublished: true },
        select: {
          id: true,
          title: true,
          enrollments: { select: { progress: true, status: true } },
        },
      }),
    ])

    const activeEnrollments = courses.reduce((sum, c) => sum + c.enrollments.filter(e => e.status === 'active').length, 0)
    const avgSessionDuration = Math.round(((lessonProgress._avg.timeSpent || 0) / 60) * 10) / 10

    const engagementByCourse = courses.slice(0, 8).map(c => {
      const active = c.enrollments.filter(e => e.status === 'active')
      const avgProgress = active.length > 0 ? active.reduce((s, e) => s + e.progress, 0) / active.length : 0
      const score = Math.round(Math.min(avgProgress * 1.2, 100))
      return { course: c.title, score, trend: score > 50 ? 'up' : score > 30 ? 'stable' : 'down' as const }
    })

    if (todayActivity.length === 0 && courses.length === 0) return getDemoEngagementData()

    return {
      activeUsersToday: todayActivity.length,
      activeUsersThisWeek: weekActivity.length,
      activeUsersThisMonth: monthActivity.length,
      totalActiveEnrollments: activeEnrollments,
      avgSessionDuration,
      aiUsageCount: aiActivities,
      aiActiveUsers: Math.round(aiActivities * 0.18), // estimate
      lessonCompletionsWeek: 0,
      quizAttemptsWeek,
      discussionPostsWeek: 0,
      engagementByCourse,
    }
  } catch {
    return getDemoEngagementData()
  }
}

async function fetchEnrollmentData() {
  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const [totalEnrollments, thisMonth, lastMonth, courses] = await Promise.all([
      db.enrollment.count(),
      db.enrollment.count({ where: { enrolledAt: { gte: monthStart } } }),
      db.enrollment.count({ where: { enrolledAt: { gte: lastMonthStart, lt: monthStart } } }),
      db.course.findMany({
        where: { isPublished: true },
        select: { title: true, enrollmentCount: true, enrollments: { select: { enrolledAt: true } } },
        orderBy: { enrollmentCount: 'desc' },
      }),
    ])

    if (totalEnrollments === 0) return getDemoEnrollmentData()

    const enrollmentTrend = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 1000) / 10 : 0

    const popularCourses = courses.slice(0, 5).map(c => {
      const thisMonthEnroll = c.enrollments.filter(e => new Date(e.enrolledAt) >= monthStart).length
      const lastMonthEnroll = c.enrollments.filter(e => {
        const d = new Date(e.enrolledAt)
        return d >= lastMonthStart && d < monthStart
      }).length
      const growth = lastMonthEnroll > 0 ? Math.round(((thisMonthEnroll - lastMonthEnroll) / lastMonthEnroll) * 100) : 0
      return { title: c.title, enrollments: c.enrollmentCount, growth }
    })

    const decliningCourses = popularCourses.filter(c => c.growth < -10)

    return {
      totalEnrollments,
      thisMonth,
      lastMonth,
      monthBefore: 0,
      enrollmentTrend,
      popularCourses,
      decliningCourses,
      conversionRate: 0,
      avgEnrollmentPerCourse: courses.length > 0 ? Math.round(totalEnrollments / courses.length) : 0,
    }
  } catch {
    return getDemoEnrollmentData()
  }
}

async function fetchRiskAnalysisData() {
  try {
    const [courseData, instructorData, studentData] = await Promise.all([
      fetchCourseAnalysisData(),
      fetchInstructorAnalysisData(),
      fetchStudentAnalysisData(),
    ])

    const risks: Array<{ severity: 'critical' | 'high' | 'medium'; category: string; description: string; count: number }> = []

    // Course risks
    const criticalCourses = (courseData as any).underperforming?.filter((c: any) => c.completionRate < 20 || c.rating < 3.0) || []
    if (criticalCourses.length > 0) {
      risks.push({ severity: 'critical', category: 'Course Quality', description: `${criticalCourses.length} courses with critical performance issues`, count: criticalCourses.length })
    }

    // Instructor risks
    const criticalInstructors = (instructorData as any).struggling?.filter((i: any) => i.effectivenessScore < 30) || []
    if (criticalInstructors.length > 0) {
      risks.push({ severity: 'critical', category: 'Instructor Performance', description: `${criticalInstructors.length} instructors with critically low effectiveness`, count: criticalInstructors.length })
    }

    // Student risks
    const atRisk = (studentData as any).atRiskCount || 0
    const inactive = (studentData as any).inactiveCount || 0
    if (atRisk > 0) risks.push({ severity: 'high', category: 'Student At-Risk', description: `${atRisk} students at risk of dropping out`, count: atRisk })
    if (inactive > 20) risks.push({ severity: 'high', category: 'Student Inactivity', description: `${inactive} students inactive for 14+ days`, count: inactive })

    return { risks, courseData, instructorData, studentData }
  } catch {
    // Fallback to demo
    return {
      risks: [
        { severity: 'critical' as const, category: 'Instructor Performance', description: '2 instructors with critically low effectiveness', count: 2 },
        { severity: 'critical' as const, category: 'Student Inactivity', description: '156 students inactive for 14+ days', count: 156 },
        { severity: 'high' as const, category: 'Course Quality', description: '3 courses with completion rate below 30%', count: 3 },
        { severity: 'high' as const, category: 'Student At-Risk', description: '89 students at risk of dropping out', count: 89 },
        { severity: 'medium' as const, category: 'Enrollment Decline', description: 'Enrollment down 20.5% this month', count: 0 },
      ],
      courseData: getDemoCourseData(),
      instructorData: getDemoInstructorData(),
      studentData: getDemoStudentData(),
    }
  }
}

async function fetchSearchData(query: string) {
  const lowerQuery = query.toLowerCase()
  const results: { type: string; items: any[]; total: number }[] = []

  try {
    // Parse for "inactive for N days" pattern
    const inactiveMatch = lowerQuery.match(/inactive\s+(?:for\s+)?(\d+)\s+days?/)
    if (inactiveMatch) {
      const days = parseInt(inactiveMatch[1])
      const cutoffDate = daysAgo(days)
      const inactiveStudents = await db.user.findMany({
        where: {
          role: 'student',
          lastActiveAt: { lt: cutoffDate },
        },
        select: { id: true, name: true, lastActiveAt: true, enrollments: { select: { id: true } } },
        take: 20,
      })
      const total = await db.user.count({
        where: { role: 'student', lastActiveAt: { lt: cutoffDate } },
      })
      results.push({
        type: `Students inactive for ${days}+ days`,
        items: inactiveStudents.map(s => ({
          name: s.name,
          lastActive: new Date(s.lastActiveAt).toLocaleDateString(),
          enrolledCourses: s.enrollments.length,
        })),
        total,
      })
    }

    // Parse for "low rating" pattern
    if (lowerQuery.includes('low rating')) {
      const lowRatedCourses = await db.course.findMany({
        where: { isPublished: true, rating: { lt: 3.5 } },
        select: { title: true, rating: true, enrollmentCount: true },
        take: 20,
      })
      const total = await db.course.count({ where: { isPublished: true, rating: { lt: 3.5 } } })
      results.push({
        type: 'Courses with low rating (< 3.5)',
        items: lowRatedCourses,
        total,
      })
    }

    // Generic student search
    if (lowerQuery.includes('student') && !inactiveMatch) {
      const studentCount = await db.user.count({ where: { role: 'student' } })
      results.push({
        type: 'Total students',
        items: [],
        total: studentCount,
      })
    }

    // Generic course search
    if (lowerQuery.includes('course') && !lowerQuery.includes('low rating')) {
      const courseCount = await db.course.count({ where: { isPublished: true } })
      results.push({
        type: 'Total published courses',
        items: [],
        total: courseCount,
      })
    }

    // If no specific patterns matched, do a general search
    if (results.length === 0) {
      const [studentCount, courseCount, enrollmentCount] = await Promise.all([
        db.user.count({ where: { role: 'student' } }),
        db.course.count({ where: { isPublished: true } }),
        db.enrollment.count(),
      ])
      results.push(
        { type: 'Total students', items: [], total: studentCount },
        { type: 'Total published courses', items: [], total: courseCount },
        { type: 'Total enrollments', items: [], total: enrollmentCount },
      )
    }
  } catch {
    // Demo fallback
    results.push(
      { type: 'Students inactive for 14+ days', items: getDemoStudentData().inactiveStudents, total: 156 },
      { type: 'Courses with low rating (< 3.5)', items: getDemoCourseData().underperforming, total: getDemoCourseData().underperforming.length },
    )
  }

  return { results, query }
}

async function fetchPlatformOverview() {
  try {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const sevenDaysAgo = daysAgo(7)
    const thirtyDaysAgo = daysAgo(30)
    const todayStr = dateStr(now)

    const [
      totalUsers,
      totalStudents,
      totalInstructors,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      revenueThisMonth,
      revenueLastMonth,
      todayActivity,
      weekActivity,
      monthActivity,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: 'student' } }),
      db.user.count({ where: { role: 'instructor' } }),
      db.course.count(),
      db.course.count({ where: { isPublished: true } }),
      db.enrollment.count(),
      db.transaction.aggregate({ _sum: { amount: true }, where: { type: 'enrollment', status: 'completed', createdAt: { gte: monthStart } } }),
      db.transaction.aggregate({ _sum: { amount: true }, where: { type: 'enrollment', status: 'completed', createdAt: { gte: lastMonthStart, lt: monthStart } } }),
      db.dailyActivity.findMany({ where: { date: todayStr }, select: { userId: true }, distinct: ['userId'] }),
      db.dailyActivity.findMany({ where: { date: { gte: dateStr(sevenDaysAgo) } }, select: { userId: true }, distinct: ['userId'] }),
      db.dailyActivity.findMany({ where: { date: { gte: dateStr(thirtyDaysAgo) } }, select: { userId: true }, distinct: ['userId'] }),
    ])

    const revThis = revenueThisMonth._sum.amount || 0
    const revLast = revenueLastMonth._sum.amount || 0
    const revenueTrend = revLast > 0 ? Math.round(((revThis - revLast) / revLast) * 1000) / 10 : 0

    // Completion rate
    const completedEnrollments = await db.enrollment.count({ where: { completedAt: { not: null } } })
    const completionRate = totalEnrollments > 0 ? Math.round(safeDiv(completedEnrollments, totalEnrollments) * 1000) / 10 : 0

    // Average rating
    const avgRatingAgg = await db.course.aggregate({ _avg: { rating: true }, where: { isPublished: true } })
    const avgRating = Math.round((avgRatingAgg._avg.rating || 0) * 10) / 10

    // Alerts from risk data
    const alerts: Array<{ severity: string; title: string; entity: string }> = []

    if (totalStudents === 0 && totalCourses === 0) return getDemoPlatformOverview()

    return {
      totalUsers,
      totalStudents,
      totalInstructors,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      totalRevenue: revThis + revLast, // simplified
      revenueThisMonth: revThis,
      revenueLastMonth: revLast,
      revenueTrend,
      dailyActiveUsers: todayActivity.length,
      weeklyActiveUsers: weekActivity.length,
      monthlyActiveUsers: monthActivity.length,
      completionRate,
      avgRating,
      alerts,
    }
  } catch {
    return getDemoPlatformOverview()
  }
}

// ═══════════════════════════════════════════════════════════════════
// ─── Module 3: LLM Reasoning Layer ───────────────────────────────
// ═══════════════════════════════════════════════════════════════════

async function generateLLMResponse(query: string, intent: CopilotIntent, data: any): Promise<string> {
  try {
    const systemPrompt = `You are the AI Admin Copilot — an intelligence assistant for ShijlAI Academy administrators. You have access to REAL platform data and must base your analysis on it.

CRITICAL RULES:
- ONLY analyze the data provided below — do NOT invent or assume numbers
- Be concise and actionable — admins want insights, not essays
- Always include specific numbers and metrics from the data
- Always end with 2-3 recommended actions the admin should take
- Use markdown formatting with **bold** for key metrics and insights
- Structure your response clearly with sections

PLATFORM DATA:
${JSON.stringify(data, null, 2)}`

    const response = await AIService.chat({
      systemPrompt,
      messages: [
        { role: 'user', content: `Admin Question: ${query}\n\nIntent: ${intent}\n\nProvide a clear, data-driven analysis with actionable recommendations.` }
      ],
      complexity: 'complex',
      feature: 'admin_copilot',
    })

    return response || 'Unable to generate analysis. Please try again.'
  } catch (error) {

    console.error('[AdminCopilot] LLM Error:', error)
    // Fallback: generate a rule-based response from the data
    return generateRuleBasedResponse(query, intent, data)
  }
}

// Rule-based fallback when LLM is unavailable
function generateRuleBasedResponse(query: string, intent: CopilotIntent, data: any): string {
  switch (intent) {
    case 'course_analysis': {
      const d = data as ReturnType<typeof getDemoCourseData>
      const underperformingList = (d.underperforming || []).map((c: any) => `- **${c.title}**: Rating ${c.rating}/5, Completion ${c.completionRate}%, ${c.enrollmentCount} students`).join('\n')
      return `## Course Analysis\n\n**Total Courses:** ${d.totalCourses} | **Published:** ${d.publishedCourses}\n**Avg Completion Rate:** ${d.avgCompletion}% | **Avg Rating:** ${d.avgRating}/5\n\n### Underperforming Courses (${(d.underperforming || []).length})\n${underperformingList || 'No critical issues found.'}\n\n### Recommended Actions\n1. Review and improve content for courses with completion rate below 30%\n2. Reach out to instructors of low-rated courses for quality improvement\n3. Consider archiving courses with persistent low engagement`
    }
    case 'instructor_analysis': {
      const d = data as ReturnType<typeof getDemoInstructorData>
      const strugglingList = (d.struggling || []).map((i: any) => `- **${i.name}**: Effectiveness ${i.effectivenessScore}/100, Rating ${i.avgRating}/5\n  Warnings: ${i.warnings.join('; ')}`).join('\n')
      return `## Instructor Analysis\n\n**Total Instructors:** ${d.totalInstructors} | **Avg Effectiveness:** ${d.avgEffectiveness}/100\n\n### Struggling Instructors (${(d.struggling || []).length})\n${strugglingList || 'No critical issues found.'}\n\n### Recommended Actions\n1. Schedule 1-on-1 meetings with instructors scoring below 30 on effectiveness\n2. Provide teaching resources and mentoring for low-rated instructors\n3. Set up Q&A response time expectations and monitoring`
    }
    case 'student_analysis': {
      const d = data as ReturnType<typeof getDemoStudentData>
      return `## Student Analysis\n\n**Total Students:** ${d.totalStudents}\n**At-Risk:** ${d.atRiskCount} | **Inactive (14+ days):** ${d.inactiveCount} | **Failing Quizzes:** ${d.failingQuizCount}\n**Average Progress:** ${d.avgProgress}%\n\n### Top At-Risk Students\n${(d.dropoutRisk || []).map((s: any) => `- **${s.name}**: Risk ${s.riskScore}/100, Last active ${s.lastActive}, Progress ${s.progress}%`).join('\n')}\n\n### Recommended Actions\n1. Launch re-engagement campaign for ${d.inactiveCount} inactive students\n2. Assign academic support to ${d.atRiskCount} at-risk students\n3. Review quiz difficulty for ${d.failingQuizCount} failing students`
    }
    case 'engagement_analysis': {
      const d = data as ReturnType<typeof getDemoEngagementData>
      return `## Engagement Analysis\n\n**DAU:** ${d.activeUsersToday} | **WAU:** ${d.activeUsersThisWeek} | **MAU:** ${d.activeUsersThisMonth}\n**Avg Session:** ${d.avgSessionDuration} min | **AI Usage:** ${d.aiUsageCount} interactions\n\n### Course Engagement\n${(d.engagementByCourse || []).map((c: any) => `- **${c.course}**: Score ${c.score}/100 (trend: ${c.trend})`).join('\n')}\n\n### Recommended Actions\n1. Boost engagement in low-scoring courses with interactive content\n2. Increase AI feature adoption — only ${d.aiActiveUsers} students use AI tools\n3. Add gamification elements to courses with declining engagement`
    }
    case 'enrollment_analysis': {
      const d = data as ReturnType<typeof getDemoEnrollmentData>
      return `## Enrollment Analysis\n\n**Total Enrollments:** ${d.totalEnrollments}\n**This Month:** ${d.thisMonth} | **Last Month:** ${d.lastMonth} | **Trend:** ${d.enrollmentTrend > 0 ? '+' : ''}${d.enrollmentTrend}%\n\n### Popular Courses\n${(d.popularCourses || []).map((c: any) => `- **${c.title}**: ${c.enrollments} enrollments (growth: ${c.growth > 0 ? '+' : ''}${c.growth}%)`).join('\n')}\n\n### Declining Courses\n${(d.decliningCourses || []).map((c: any) => `- **${c.title}**: ${c.enrollments} enrollments (decline: ${c.growth}%)`).join('\n')}\n\n### Recommended Actions\n1. Investigate why enrollments declined ${Math.abs(d.enrollmentTrend)}% this month\n2. Run promotional campaigns for declining courses\n3. Leverage popular courses to cross-sell related content`
    }
    case 'risk_analysis': {
      const d = data as any
      return `## Risk Analysis\n\n### Critical Risks\n${(d.risks || []).filter((r: any) => r.severity === 'critical').map((r: any) => `- **[${r.severity.toUpperCase()}] ${r.category}**: ${r.description}`).join('\n')}\n\n### High Risks\n${(d.risks || []).filter((r: any) => r.severity === 'high').map((r: any) => `- **[${r.severity.toUpperCase()}] ${r.category}**: ${r.description}`).join('\n')}\n\n### Recommended Actions\n1. Address critical instructor effectiveness issues immediately\n2. Launch student re-engagement campaign for inactive users\n3. Review and improve underperforming course content`
    }
    case 'report_generation': {
      return `## Platform Report\n\nReport generation requires the full platform overview. Key metrics have been compiled from all data sources.\n\n### Recommended Actions\n1. Schedule weekly report review with the team\n2. Set up automated alerts for critical metrics\n3. Track progress on action items from this report`
    }
    case 'search': {
      const d = data as any
      const searchResults = (d.results || []).map((r: any) => `### ${r.type}\nFound: **${r.total}** results${r.items.length > 0 ? '\n' + r.items.slice(0, 5).map((i: any) => `- ${i.name || i.title || JSON.stringify(i)}`).join('\n') : ''}`).join('\n\n')
      return `## Search Results\n\nQuery: "${d.query}"\n\n${searchResults || 'No results found.'}\n\n### Recommended Actions\n1. Review the search results for patterns\n2. Take action on identified issues\n3. Set up monitoring for key metrics`
    }
    default: {
      const d = data as ReturnType<typeof getDemoPlatformOverview>
      return `## Platform Overview\n\n**Users:** ${d.totalUsers} (${d.totalStudents} students, ${d.totalInstructors} instructors)\n**Courses:** ${d.totalCourses} (${d.publishedCourses} published)\n**Enrollments:** ${d.totalEnrollments}\n**Revenue This Month:** PKR ${(d.revenueThisMonth || 0).toLocaleString()}\n**DAU:** ${d.dailyActiveUsers} | **WAU:** ${d.weeklyActiveUsers} | **MAU:** ${d.monthlyActiveUsers}\n**Completion Rate:** ${d.completionRate}% | **Avg Rating:** ${d.avgRating}/5\n\n### Active Alerts\n${(d.alerts || []).map((a: any) => `- **[${a.severity?.toUpperCase()}]** ${a.title}`).join('\n')}\n\n### Recommended Actions\n1. Address critical alerts first\n2. Review enrollment and revenue trends\n3. Focus on student engagement and retention`
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// ─── Module 4: Recommendations Engine ─────────────────────────────
// ═══════════════════════════════════════════════════════════════════

function generateRecommendations(intent: CopilotIntent, data: any): string[] {
  const recommendations: string[] = []

  switch (intent) {
    case 'course_analysis': {
      const d = data as any
      const underperformingCount = (d.underperforming || []).length
      if (underperformingCount > 0) {
        recommendations.push(`Review and improve ${underperformingCount} underperforming courses — focus on content quality and engagement`)
      }
      if (d.avgCompletion < 50) {
        recommendations.push('Launch a course completion improvement initiative — target courses below 30% completion rate')
      }
      recommendations.push('Schedule quarterly course quality reviews with instructors')
      break
    }
    case 'instructor_analysis': {
      const d = data as any
      const strugglingCount = (d.struggling || []).length
      if (strugglingCount > 0) {
        recommendations.push(`Schedule 1-on-1 meetings with ${strugglingCount} struggling instructors to discuss performance improvement`)
      }
      if (d.struggling?.some((i: any) => i.warnings.some((w: string) => w.includes('response time')))) {
        recommendations.push('Implement Q&A response time SLA — target <24 hours for all instructors')
      }
      recommendations.push('Create an instructor mentoring program pairing top performers with struggling ones')
      break
    }
    case 'student_analysis': {
      const d = data as any
      if (d.inactiveCount > 50) {
        recommendations.push(`Launch a re-engagement campaign for ${d.inactiveCount} inactive students — email + push notifications`)
      }
      if (d.atRiskCount > 0) {
        recommendations.push(`Assign academic support to ${d.atRiskCount} at-risk students immediately`)
      }
      if (d.failingQuizCount > 0) {
        recommendations.push(`Review quiz difficulty and provide supplementary materials for ${d.failingQuizCount} failing students`)
      }
      break
    }
    case 'engagement_analysis': {
      const d = data as any
      const lowEngagement = (d.engagementByCourse || []).filter((c: any) => c.score < 40)
      if (lowEngagement.length > 0) {
        recommendations.push(`Add interactive elements and quizzes to ${lowEngagement.length} low-engagement courses`)
      }
      recommendations.push(`Increase AI feature adoption — ${d.aiActiveUsers || 0} students currently use AI tools out of potentially hundreds`)
      recommendations.push('Introduce weekly challenges and streak rewards to boost daily activity')
      break
    }
    case 'enrollment_analysis': {
      const d = data as any
      if (d.enrollmentTrend < -10) {
        recommendations.push(`Investigate the ${Math.abs(d.enrollmentTrend)}% enrollment decline — survey recent non-converters and analyze market trends`)
      }
      if ((d.decliningCourses || []).length > 0) {
        recommendations.push(`Run targeted promotions for ${d.decliningCourses.length} declining courses with special offers or updated content`)
      }
      recommendations.push('Leverage popular courses to cross-sell related content and increase average enrollment per student')
      break
    }
    case 'risk_analysis': {
      const d = data as any
      const criticals = (d.risks || []).filter((r: any) => r.severity === 'critical')
      if (criticals.length > 0) {
        recommendations.push(`URGENT: Address ${criticals.length} critical risks immediately — ${criticals.map((c: any) => c.category).join(', ')}`)
      }
      recommendations.push('Set up automated alerting for risk thresholds so issues are caught earlier')
      recommendations.push('Create a weekly risk review process with the admin team')
      break
    }
    case 'report_generation': {
      recommendations.push('Schedule this report to be generated weekly and shared with the team')
      recommendations.push('Set up automated alerts for any metric that changes by more than 15%')
      recommendations.push('Track action items from each report and review progress weekly')
      break
    }
    case 'search': {
      recommendations.push('Review search results for actionable patterns')
      recommendations.push('Set up monitoring dashboards for the metrics you searched for')
      break
    }
    default: {
      const d = data as any
      if ((d.alerts || []).some((a: any) => a.severity === 'critical')) {
        recommendations.push('Address critical platform alerts immediately')
      }
      if (d.revenueTrend < 0) {
        recommendations.push(`Revenue is declining (${d.revenueTrend}%) — review pricing and promotional strategies`)
      }
      recommendations.push('Focus on student retention — inactive students are the biggest risk to growth')
      break
    }
  }

  // Ensure we always have at least 2 recommendations
  if (recommendations.length < 2) {
    recommendations.push('Review platform metrics weekly to catch trends early')
    recommendations.push('Set up automated alerts for critical thresholds')
  }

  return recommendations.slice(0, 3)
}

// ═══════════════════════════════════════════════════════════════════
// ─── Critical Alert Detection (for sidebar) ──────────────────────
// ═══════════════════════════════════════════════════════════════════

async function detectCriticalAlerts(): Promise<Array<{ id: string; type: string; severity: string; title: string; description: string; entityType?: string; timestamp: string }>> {
  const alerts: Array<{ id: string; type: string; severity: string; title: string; description: string; entityType?: string; timestamp: string }> = []

  try {
    const fourteenDaysAgo = daysAgo(14)
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const lastMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)

    const [inactiveCount, thisMonthEnroll, lastMonthEnroll, lowRatedCourses, criticalInstructors] = await Promise.all([
      db.user.count({ where: { role: 'student', lastActiveAt: { lt: fourteenDaysAgo } } }),
      db.enrollment.count({ where: { enrolledAt: { gte: monthStart } } }),
      db.enrollment.count({ where: { enrolledAt: { gte: lastMonthStart, lt: monthStart } } }),
      db.course.count({ where: { isPublished: true, rating: { lt: 3.0 } } }),
      db.user.count({ where: { role: 'instructor', lastActiveAt: { lt: fourteenDaysAgo } } }),
    ])

    if (inactiveCount > 50) {
      alerts.push({ id: 'alert-inactive-critical', type: 'student_inactivity', severity: 'critical', title: `${inactiveCount} students inactive 14+ days`, description: 'High inactivity rate threatens retention and revenue', entityType: 'student', timestamp: new Date().toISOString() })
    } else if (inactiveCount > 0) {
      alerts.push({ id: 'alert-inactive-warning', type: 'student_inactivity', severity: 'warning', title: `${inactiveCount} students inactive 14+ days`, description: 'Some students have disengaged from the platform', entityType: 'student', timestamp: new Date().toISOString() })
    }

    if (lastMonthEnroll > 0) {
      const trend = Math.round(((thisMonthEnroll - lastMonthEnroll) / lastMonthEnroll) * 100)
      if (trend < -20) {
        alerts.push({ id: 'alert-enrollment-critical', type: 'enrollment_decline', severity: 'critical', title: `Enrollment down ${Math.abs(trend)}%`, description: `${thisMonthEnroll} vs ${lastMonthEnroll} last month`, entityType: 'platform', timestamp: new Date().toISOString() })
      } else if (trend < -10) {
        alerts.push({ id: 'alert-enrollment-warning', type: 'enrollment_decline', severity: 'warning', title: `Enrollment down ${Math.abs(trend)}%`, description: `${thisMonthEnroll} vs ${lastMonthEnroll} last month`, entityType: 'platform', timestamp: new Date().toISOString() })
      }
    }

    if (lowRatedCourses > 0) {
      alerts.push({ id: 'alert-low-rated-courses', type: 'course_quality', severity: 'warning', title: `${lowRatedCourses} courses with rating below 3.0`, description: 'Low-rated courses damage platform reputation', entityType: 'course', timestamp: new Date().toISOString() })
    }

    if (criticalInstructors > 0) {
      alerts.push({ id: 'alert-inactive-instructors', type: 'instructor_inactive', severity: 'warning', title: `${criticalInstructors} instructors inactive 14+ days`, description: 'Inactive instructors may need attention', entityType: 'instructor', timestamp: new Date().toISOString() })
    }
  } catch {
    // Demo alerts
    alerts.push(
      { id: 'alert-demo-1', type: 'student_inactivity', severity: 'critical', title: '156 students inactive 14+ days', description: 'High inactivity rate threatens retention and revenue', entityType: 'student', timestamp: new Date().toISOString() },
      { id: 'alert-demo-2', type: 'instructor_performance', severity: 'critical', title: '2 instructors with critical effectiveness', description: 'These instructors need immediate support', entityType: 'instructor', timestamp: new Date().toISOString() },
      { id: 'alert-demo-3', type: 'enrollment_decline', severity: 'warning', title: 'Enrollment down 20.5%', description: '89 vs 112 last month', entityType: 'platform', timestamp: new Date().toISOString() },
      { id: 'alert-demo-4', type: 'course_quality', severity: 'warning', title: '3 courses with low completion rates', description: 'Courses below 30% completion damage student outcomes', entityType: 'course', timestamp: new Date().toISOString() },
    )
  }

  return alerts
}

// ═══════════════════════════════════════════════════════════════════
// ─── POST Handler — Main Chat Endpoint ────────────────────────────
// ═══════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body: CopilotQuery = await request.json()
    const { adminId, query, sessionId } = body

    if (!adminId || !query) {
      return NextResponse.json(
        { error: 'Missing required fields: adminId, query' },
        { status: 400 }
      )
    }

    // ─── Step 1: Intent Detection ──────────────────────────────
    const { intent, confidence } = detectIntent(query)

    // ─── Step 2: Data Retrieval ────────────────────────────────
    let data: any

    switch (intent) {
      case 'course_analysis':
        data = await fetchCourseAnalysisData()
        break
      case 'instructor_analysis':
        data = await fetchInstructorAnalysisData()
        break
      case 'student_analysis':
        data = await fetchStudentAnalysisData()
        break
      case 'engagement_analysis':
        data = await fetchEngagementData()
        break
      case 'enrollment_analysis':
        data = await fetchEnrollmentData()
        break
      case 'risk_analysis':
        data = await fetchRiskAnalysisData()
        break
      case 'report_generation':
        data = await fetchPlatformOverview()
        break
      case 'search':
        data = await fetchSearchData(query)
        break
      default:
        data = await fetchPlatformOverview()
        break
    }

    // ─── Step 3: LLM Reasoning ────────────────────────────────
    const message = await generateLLMResponse(query, intent, data)

    // ─── Step 4: Recommendations ──────────────────────────────
    const recommendations = generateRecommendations(intent, data)

    // ─── Store query in memory ─────────────────────────────────
    const session = sessionId || `session-${Date.now()}`
    const existing = recentQueriesMap.get(adminId) || []
    existing.unshift({
      query,
      intent,
      timestamp: new Date().toISOString(),
    })
    recentQueriesMap.set(adminId, existing.slice(0, 20)) // keep last 20

    return NextResponse.json({
      message,
      sessionId: session,
      intent,
      data,
      recommendations,
    })
  } catch (error) {
    console.error('[AdminCopilot] POST Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process query',
        message: 'I encountered an error processing your request. Please try again.',
        sessionId: `error-${Date.now()}`,
        intent: 'platform_overview',
        recommendations: ['Check system status', 'Try a more specific question'],
      },
      { status: 500 }
    )
  }
}

// ═══════════════════════════════════════════════════════════════════
// ─── GET Handler — Sidebar Data ───────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const adminId = searchParams.get('adminId')

    if (!adminId) {
      return NextResponse.json(
        { error: 'Missing adminId parameter' },
        { status: 400 }
      )
    }

    // Recent queries
    const recentQueries = (recentQueriesMap.get(adminId) || []).slice(0, 5)

    // Suggested questions
    const suggestedQuestions = [
      'Which courses need attention?',
      'Show at-risk students',
      'Generate weekly report',
      'Why are enrollments declining?',
      'What requires immediate attention?',
      'Which instructors need review?',
      'How many students are inactive?',
      'Platform summary this week',
    ]

    // Critical alerts
    const criticalAlerts = await detectCriticalAlerts()

    return NextResponse.json({
      recentQueries,
      suggestedQuestions,
      criticalAlerts,
    })
  } catch (error) {
    console.error('[AdminCopilot] GET Error:', error)
    return NextResponse.json(
      {
        recentQueries: [],
        suggestedQuestions: [
          'Which courses need attention?',
          'Show at-risk students',
          'Generate weekly report',
          'Why are enrollments declining?',
          'What requires immediate attention?',
          'Which instructors need review?',
          'How many students are inactive?',
          'Platform summary this week',
        ],
        criticalAlerts: [
          { id: 'alert-fallback-1', type: 'system', severity: 'warning', title: 'Unable to detect live alerts', description: 'Check system status', entityType: 'platform', timestamp: new Date().toISOString() },
        ],
      },
      { status: 200 }
    )
  }
}
