'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Brain, CheckCircle, Trophy, Target, Clock, Zap, Flame,
  GraduationCap, Star, TrendingUp, Award, ChevronRight, Bell,
  Calendar, Loader2, Play, Sparkles, Check, X, Timer, Coins,
  FileText, ClipboardList, Eye, ArrowRight, Activity,
  BookMarked, BarChart3, CircleDot, Lightbulb, AlertTriangle,
  ExternalLink, RefreshCw, Route, Shield, Compass
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { ShijlAIText } from '@/components/ui/brand-text'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import type { Enrollment } from '@/lib/types'
import { StudentStatCard, StudentStatCardGrid } from '@/components/student/student-stat-card'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WelcomeData {
  greeting: string
  motivationalMessage: string
  date: string
  streak: number
  level: number
  xp: number
  xpToNextLevel: number
  levelProgress: number
  coins: number
}

interface DashboardStats {
  coursesEnrolled: number
  lessonsCompleted: number
  quizzesTaken: number
  avgQuizScore: number
  totalXP: number
  badgesEarned: number
  certificatesEarned: number
  hoursLearned: number
  completedCourses: number
}

interface WeeklyActivityItem {
  day: string
  xp: number
  lessons: number
  minutes: number
}

interface UpcomingDeadline {
  title: string
  course: string
  dueDate: string
  type: string
}

interface DailyPlanTask {
  task: string
  type: 'watch' | 'quiz' | 'read' | 'assignment'
  duration: string
  dueDate?: string
}

interface DailyPlanData {
  plan: DailyPlanTask[]
  totalEstimatedTime: string
  aiGenerated: boolean
}

interface RecommendationCourse {
  id: string
  title: string
  thumbnail: string | null
  rating: number
  enrollmentCount: number
  price: number
  category: string
  instructor: { name: string }
}

interface RecommendationsData {
  recommendations: RecommendationCourse[]
  reason: string
}

interface AIRecommendation {
  id: string
  type: string
  title: string
  description: string | null
  reason: string | null
  priority: string
  priorityScore: number
  status: string
  recommendedCourseId: string | null
  createdAt: string
}

interface LearningProfileSummary {
  engagementScore: number
  consistencyScore: number
  learningSpeedScore: number
  dropRiskScore: number
  weakTopics: string[]
  strongTopics: string[]
}

interface DashboardData {
  role: string
  welcomeData: WelcomeData
  stats: DashboardStats
  weeklyActivity: WeeklyActivityItem[]
  subjectPerformance: { subject: string; progress: number; grade: string; quizScore: number }[]
  upcomingDeadlines: UpcomingDeadline[]
  recentQuizResults: { quizTitle: string; score: number; totalMarks: number; passed: boolean; date: string }[]
  skillProgress: { skill: string; level: number; maxLevel: number; progress: number }[]
  announcements: { title: string; message: string; date: string; type: 'info' | 'warning' | 'success' }[]
  notifications: { message: string; time: string; type: string; read: boolean }[]
}

interface GamificationData {
  gamification: {
    xp: number
    level: number
    levelProgress: number
    xpToNextLevel: number
    coins: number
    streak: number
    longestStreak: number
  }
  stats: {
    totalQuizzes: number
    passedQuizzes: number
    perfectQuizzes: number
    enrollmentCount: number
    completedCourses: number
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

const categoryGradients: Record<string, string> = {
  IB: 'from-emerald-500 to-teal-600',
  Programming: 'from-teal-500 to-emerald-600',
  'O-Levels': 'from-emerald-400 to-teal-500',
  'A-Levels': 'from-teal-400 to-emerald-500',
  IELTS: 'from-emerald-600 to-teal-700',
  AWS: 'from-teal-600 to-emerald-700',
  Mathematics: 'from-emerald-500 to-teal-600',
  Physics: 'from-teal-500 to-cyan-600',
  Chemistry: 'from-emerald-400 to-teal-500',
  Biology: 'from-teal-400 to-emerald-500',
  English: 'from-emerald-600 to-teal-700',
  'Computer Science': 'from-teal-600 to-cyan-700',
  'Data Science': 'from-cyan-500 to-teal-600',
  'Web Development': 'from-teal-500 to-cyan-600',
  Django: 'from-emerald-500 to-teal-600',
  Git: 'from-teal-400 to-emerald-500',
}

const DAILY_GOAL_MINUTES = 30

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getMotivationalMessage(streak: number, longestStreak: number): string {
  if (streak >= 30) return "You're unstoppable! 🔥 Keep the momentum going!"
  if (streak >= 14) return "Two weeks strong! You're building an amazing habit! 💪"
  if (streak >= 7) return "A full week! Your dedication is paying off! 🌟"
  if (streak >= 3) {
    const daysToBest = longestStreak - streak
    if (daysToBest > 0 && daysToBest <= 5) return `Keep it up — you're ${daysToBest} day${daysToBest > 1 ? 's' : ''} from your personal best.`
    return "Great streak! Keep pushing forward! 🚀"
  }
  if (streak >= 1) return "Nice start! Build that learning habit! ✨"
  return "Start your learning streak today! 🎯"
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function daysUntil(dateStr: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const due = new Date(dateStr)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function getDeadlineColor(days: number): string {
  if (days <= 1) return 'text-rose-600 dark:text-rose-400'
  if (days <= 3) return 'text-amber-600 dark:text-amber-400'
  return 'text-muted-foreground'
}

function getDeadlineBgColor(days: number): string {
  if (days <= 1) return 'bg-rose-50 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-800/30'
  if (days <= 3) return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30'
  return 'bg-accent/40 border-border/50'
}

function getTaskTypeIcon(type: string) {
  switch (type) {
    case 'watch': return Play
    case 'quiz': return Brain
    case 'read': return FileText
    case 'assignment': return ClipboardList
    default: return BookOpen
  }
}

function getTaskTypeColor(type: string): string {
  switch (type) {
    case 'watch': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
    case 'quiz': return 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400'
    case 'read': return 'bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400'
    case 'assignment': return 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
    default: return 'bg-muted text-muted-foreground'
  }
}

function formatEnrollmentCount(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return String(count)
}

// ─── CountUp & InView Hooks ──────────────────────────────────────────────────

function useInView(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect() } },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, inView }
}

function CountUp({ end, duration = 1200, suffix = '' }: { end: number; duration?: number; suffix?: string }) {
  const { ref, inView } = useInView(0.2)
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    let start = 0
    const startTime = performance.now()
    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setValue(Math.round(start + (end - start) * eased))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, end, duration])

  return <span ref={ref}>{value.toLocaleString()}{suffix}</span>
}

// ─── Skeleton Components ─────────────────────────────────────────────────────

function SectionSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl ios-shadow-sm bg-card p-5 space-y-3">
      <Skeleton className="h-5 w-40" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" style={{ maxWidth: `${70 + Math.random() * 30}%` }} />
      ))}
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl ios-shadow-sm bg-card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function StudentDashboard() {
  const { currentUser, setCurrentView, enrollments, setEnrollments, setSelectedCourseId } = useAppStore()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [gamification, setGamification] = useState<GamificationData | null>(null)
  const [dailyPlan, setDailyPlan] = useState<DailyPlanData | null>(null)
  const [recommendations, setRecommendations] = useState<RecommendationsData | null>(null)
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([])
  const [learningProfile, setLearningProfile] = useState<LearningProfileSummary | null>(null)
  const [aiRecsLoading, setAiRecsLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [planLoading, setPlanLoading] = useState(true)
  const [recsLoading, setRecsLoading] = useState(true)
  const [checkedTasks, setCheckedTasks] = useState<Set<number>>(new Set())

  const fetchData = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const [dashRes, enrollRes, gamRes] = await Promise.allSettled([
        fetch(`/api/dashboard?userId=${currentUser.id}&role=student`),
        fetch(`/api/enrollments?userId=${currentUser.id}`),
        fetch(`/api/gamification?userId=${currentUser.id}`),
      ])

      if (dashRes.status === 'fulfilled' && dashRes.value.ok) {
        const json = await dashRes.value.json()
        setDashboardData(json)
      }

      if (enrollRes.status === 'fulfilled' && enrollRes.value.ok) {
        const json = await enrollRes.value.json()
        setEnrollments(json.enrollments || [])
      }

      if (gamRes.status === 'fulfilled' && gamRes.value.ok) {
        const json = await gamRes.value.json()
        setGamification(json)
      }
    } catch {
      // Handle errors gracefully
    } finally {
      setLoading(false)
    }
  }, [currentUser, setEnrollments])

  const fetchDailyPlan = useCallback(async () => {
    if (!currentUser) return
    setPlanLoading(true)
    try {
      const res = await fetch(`/api/student/daily-plan?userId=${currentUser.id}`)
      if (res.ok) {
        const json = await res.json()
        setDailyPlan(json)
      } else {
        // Fallback plan
        setDailyPlan({
          plan: [
            { task: 'Continue your latest lesson', type: 'watch', duration: '~10 min' },
            { task: 'Complete a practice quiz', type: 'quiz', duration: '~5 min' },
            { task: 'Review study notes', type: 'read', duration: '~5 min' },
          ],
          totalEstimatedTime: '20 min',
          aiGenerated: false,
        })
      }
    } catch {
      setDailyPlan({
        plan: [
          { task: 'Continue your latest lesson', type: 'watch', duration: '~10 min' },
          { task: 'Review study notes', type: 'read', duration: '~5 min' },
        ],
        totalEstimatedTime: '15 min',
        aiGenerated: false,
      })
    } finally {
      setPlanLoading(false)
    }
  }, [currentUser])

  const fetchRecommendations = useCallback(async () => {
    if (!currentUser) return
    setRecsLoading(true)
    try {
      const res = await fetch(`/api/student/recommendations?userId=${currentUser.id}`)
      if (res.ok) {
        const json = await res.json()
        setRecommendations(json)
      }
    } catch {
      // Recommendations are non-critical
    } finally {
      setRecsLoading(false)
    }
  }, [currentUser])

  const fetchAIRecommendations = useCallback(async () => {
    if (!currentUser) return
    setAiRecsLoading(true)
    try {
      const [recsRes, profileRes] = await Promise.allSettled([
        fetch(`/api/ai/shijlai/recommendations?userId=${currentUser.id}&status=active`),
        fetch(`/api/ai/shijlai/profile?userId=${currentUser.id}`),
      ])

      if (recsRes.status === 'fulfilled' && recsRes.value.ok) {
        const data = await recsRes.value.json()
        const recs = data.recommendations || []
        if (recs.length > 0) {
          setAiRecommendations(recs)
        } else {
          // Demo data fallback
          setAiRecommendations([
            { id: 'ai-demo-1', type: 'topic', title: 'Review Calculus Fundamentals', description: 'Focus on limits and derivatives', reason: 'Your quiz scores dropped 15% this week', priority: 'high', priorityScore: 82, status: 'active', recommendedCourseId: null, createdAt: new Date().toISOString() },
            { id: 'ai-demo-2', type: 'quiz', title: 'Practice Organic Chemistry', description: 'Take a diagnostic quiz', reason: 'You haven\'t studied this in 7 days', priority: 'medium', priorityScore: 64, status: 'active', recommendedCourseId: null, createdAt: new Date().toISOString() },
            { id: 'ai-demo-3', type: 'study_plan', title: 'Create a Weekly Study Schedule', description: 'Your activity has been inconsistent', reason: 'Your consistency score dropped from 70% to 45%', priority: 'high', priorityScore: 76, status: 'active', recommendedCourseId: null, createdAt: new Date().toISOString() },
          ])
        }
      }

      if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
        const data = await profileRes.value.json()
        const rawProfile = data.profile
        if (rawProfile) {
          let weakTopicsArr: string[] = []
          let strongTopicsArr: string[] = []
          try { weakTopicsArr = JSON.parse(rawProfile.weakTopics || '[]') } catch { /* empty */ }
          try { strongTopicsArr = JSON.parse(rawProfile.strongTopics || '[]') } catch { /* empty */ }
          setLearningProfile({
            engagementScore: rawProfile.engagementScore || 0,
            consistencyScore: rawProfile.consistencyScore || 0,
            learningSpeedScore: rawProfile.learningSpeedScore || 0,
            dropRiskScore: rawProfile.dropRiskScore || 0,
            weakTopics: weakTopicsArr,
            strongTopics: strongTopicsArr,
          })
        } else {
          setLearningProfile({ engagementScore: 45, consistencyScore: 55, learningSpeedScore: 60, dropRiskScore: 25, weakTopics: ['Calculus', 'Organic Chemistry'], strongTopics: ['JavaScript', 'Algebra'] })
        }
      }
    } catch {
      // AI recs are non-critical
      setAiRecommendations([
        { id: 'ai-demo-1', type: 'topic', title: 'Review Calculus Fundamentals', description: 'Focus on limits and derivatives', reason: 'Your quiz scores dropped 15% this week', priority: 'high', priorityScore: 82, status: 'active', recommendedCourseId: null, createdAt: new Date().toISOString() },
        { id: 'ai-demo-2', type: 'quiz', title: 'Practice Organic Chemistry', description: 'Take a diagnostic quiz', reason: 'You haven\'t studied this in 7 days', priority: 'medium', priorityScore: 64, status: 'active', recommendedCourseId: null, createdAt: new Date().toISOString() },
      ])
    } finally {
      setAiRecsLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchDailyPlan()
  }, [fetchDailyPlan])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

  useEffect(() => {
    fetchAIRecommendations()
  }, [fetchAIRecommendations])

  const toggleTask = (index: number) => {
    setCheckedTasks(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  // ─── Loading State ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-5 pb-4">
        {/* Welcome skeleton */}
        <div className="rounded-2xl ios-shadow-sm bg-card p-6 space-y-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-3 w-48" />
        </div>
        {/* Continue learning skeleton */}
        <SectionSkeleton lines={4} />
        {/* Today's plan skeleton */}
        <SectionSkeleton lines={5} />
        {/* Stats skeleton */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        {/* Streak skeleton */}
        <SectionSkeleton lines={3} />
        {/* Deadlines skeleton */}
        <SectionSkeleton lines={4} />
      </div>
    )
  }

  // ─── Derived Data ────────────────────────────────────────────────────────
  const welcome = dashboardData?.welcomeData
  const stats = dashboardData?.stats
  const weeklyActivity = dashboardData?.weeklyActivity || []
  const upcomingDeadlines = dashboardData?.upcomingDeadlines || []

  const firstName = currentUser?.name?.split(' ')[0] || 'Student'
  const streak = welcome?.streak ?? currentUser?.streak ?? 0
  const longestStreak = gamification?.gamification.longestStreak ?? currentUser?.longestStreak ?? 0
  const level = welcome?.level ?? gamification?.gamification.level ?? currentUser?.level ?? 1
  const xp = welcome?.xp ?? gamification?.gamification.xp ?? currentUser?.xp ?? 0
  const coins = welcome?.coins ?? gamification?.gamification.coins ?? currentUser?.shijlCoins ?? 0

  // Today's activity data
  const todayActivity = weeklyActivity.length > 0 ? weeklyActivity[weeklyActivity.length - 1] : null
  const todayMinutes = todayActivity?.minutes ?? 0
  const todayXP = todayActivity?.xp ?? 0

  // Most recently accessed enrollment for "Continue Where You Left Off"
  const latestEnrollment = enrollments.length > 0
    ? (enrollments as Array<Enrollment & { progressPercentage?: number }>).sort(
        (a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()
      )[0]
    : null

  const latestProgress = latestEnrollment
    ? (latestEnrollment as Enrollment & { progressPercentage?: number }).progressPercentage ?? latestEnrollment.progress
    : 0

  // Weekly heatmap data — this week and last week
  const thisWeekDays = weeklyActivity.slice(-7)
  const lastWeekDays = weeklyActivity.slice(-14, -7)

  return (
    <div className="space-y-5 pb-4">
      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1: Welcome Header
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="rounded-2xl ios-shadow-sm bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 p-6 relative overflow-hidden"
      >
        {/* Decorative grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 size-32 rounded-full bg-white/5" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-white">
              Welcome back, {firstName}! 👋
            </h1>
            <p className="text-[14px] sm:text-[15px] text-white/80 leading-relaxed">
              {welcome?.motivationalMessage || getMotivationalMessage(streak, longestStreak)}
            </p>
            <p className="text-[11px] text-white/50 font-medium">
              {welcome?.date || new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {streak > 0 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...springTransition, delay: 0.2 }}
                className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 backdrop-blur-sm"
              >
                <Flame className="size-4 text-orange-300 streak-fire" />
                <span className="text-[13px] font-bold text-white">{streak}-day streak 🔥</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Bottom row: XP, Level, Coins */}
        <div className="relative mt-4 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm">
            <Zap className="size-3.5 text-emerald-200" />
            <span className="text-[12px] font-semibold text-white">{xp.toLocaleString()} XP</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm">
            <GraduationCap className="size-3.5 text-emerald-200" />
            <span className="text-[12px] font-semibold text-white">Level {level}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm">
            <Coins className="size-3.5 text-amber-300" />
            <span className="text-[12px] font-semibold text-white">{coins} coins</span>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2: Continue Where You Left Off
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40">
            <Play className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-[16px] font-semibold">Continue Where You Left Off</h2>
        </div>

        {!latestEnrollment ? (
          <div className="rounded-2xl ios-shadow-sm bg-gradient-to-br from-emerald-50 via-teal-50/50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-cyan-950/20 p-8 text-center relative overflow-hidden border border-emerald-200/30 dark:border-emerald-800/20">
            {/* Decorative floating shapes */}
            <div className="absolute top-4 left-6 size-16 rounded-full bg-emerald-200/30 dark:bg-emerald-800/20 blur-sm" />
            <div className="absolute bottom-6 right-8 size-20 rounded-full bg-teal-200/30 dark:bg-teal-800/20 blur-sm" />
            <div className="absolute top-1/2 left-1/3 size-8 rounded-full bg-cyan-200/30 dark:bg-cyan-800/20 blur-sm" />

            {/* Animated illustration */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...springTransition, delay: 0.15 }}
              className="relative mx-auto mb-4"
            >
              <div className="flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 mx-auto shadow-lg shadow-emerald-500/25">
                <BookOpen className="size-10 text-white" />
              </div>
              {/* Orbiting sparkle */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0"
              >
                <Sparkles className="size-4 text-emerald-500 dark:text-emerald-400 absolute -top-1 left-1/2" />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ ...springTransition, delay: 0.25 }}
            >
              <h3 className="text-[18px] font-bold text-foreground">Start Your Learning Journey</h3>
              <p className="mt-1.5 text-[14px] text-muted-foreground max-w-xs mx-auto">
                Explore our curated courses and begin your path to mastery today
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ ...springTransition, delay: 0.35 }}
            >
              <Button
                className="mt-5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-shadow h-11 px-8 text-[14px] font-semibold"
                onClick={() => setCurrentView('courses')}
              >
                <Sparkles className="size-4 mr-2" />
                Explore Courses
              </Button>
              <p className="mt-2.5 text-[11px] text-muted-foreground/60">Free courses available · Start learning instantly</p>
            </motion.div>
          </div>
        ) : (
          <div className="rounded-2xl ios-shadow-sm bg-card overflow-hidden ios-press cursor-pointer"
               onClick={() => { setSelectedCourseId(latestEnrollment.courseId); setCurrentView('course-player') }}>
            <div className="flex flex-col sm:flex-row">
              {/* Thumbnail */}
              <div className={`relative w-full sm:w-48 h-32 sm:h-auto bg-gradient-to-br ${categoryGradients[latestEnrollment.course?.category || ''] || 'from-emerald-500 to-teal-600'} flex items-center justify-center shrink-0`}>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
                <div className="relative text-center p-4">
                  {latestEnrollment.course?.category && (
                    <Badge variant="secondary" className="bg-white/25 text-white hover:bg-white/25 backdrop-blur-sm text-[10px] px-2 py-0.5 border-0 mb-2">
                      {latestEnrollment.course.category}
                    </Badge>
                  )}
                  <BookOpen className="size-8 text-white/80 mx-auto" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-5 space-y-3">
                <div>
                  <h3 className="text-[17px] font-semibold line-clamp-1">
                    {latestEnrollment.course?.title || 'Continue Learning'}
                  </h3>
                  <p className="text-[13px] text-muted-foreground mt-0.5">
                    Lesson {(latestEnrollment as Enrollment & { completedLessons?: number }).completedLessons ?? Math.round(latestProgress / 10) + 1} — Continue your progress
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{Math.round(latestProgress)}% complete</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted/50 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(latestProgress, 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Est. {latestProgress >= 90 ? '<1h' : latestProgress >= 50 ? '2-4h' : '4-8h'} left</span>
                    <span className="flex items-center gap-1">
                      <Timer className="size-3" />
                      {Math.round(latestProgress)}%
                    </span>
                  </div>
                </div>

                {/* Continue button */}
                <Button
                  className="w-full sm:w-auto rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white ios-press"
                  size="sm"
                  onClick={(e) => { e.stopPropagation(); setSelectedCourseId(latestEnrollment.courseId); setCurrentView('course-player') }}
                >
                  <Play className="size-3.5 mr-1.5" />
                  Continue Learning
                </Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 3: Today's Plan (AI-generated)
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.15 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40">
            <Sparkles className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-[16px] font-semibold">Today&apos;s Plan</h2>
          {dailyPlan?.aiGenerated && (
            <Badge variant="secondary" className="text-[10px] bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 dark:from-emerald-950/40 dark:to-teal-950/40 dark:text-emerald-400 border-0 px-2">
              ✦ AI-generated for you
            </Badge>
          )}
        </div>

        <div className="rounded-2xl ios-shadow-sm bg-card p-5">
          {planLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-5 rounded" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-14" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Intro text */}
              <div className="flex items-start gap-2 mb-4 p-3 rounded-xl bg-gradient-to-r from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/30 dark:border-emerald-800/20">
                <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <p className="text-[13px] text-muted-foreground">
                  Based on your pace and schedule, here&apos;s what <ShijlAIText /> suggests today:
                </p>
              </div>

              {/* Task list */}
              <div className="space-y-1">
                {dailyPlan?.plan.map((task, i) => {
                  const TaskIcon = getTaskTypeIcon(task.type)
                  const isChecked = checkedTasks.has(i)
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...springTransition, delay: i * 0.05 }}
                      className={`flex items-center gap-3 rounded-xl p-3 transition-all cursor-pointer hover:bg-accent/50 ${isChecked ? 'opacity-60' : ''}`}
                      onClick={() => toggleTask(i)}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => toggleTask(i)}
                        className="shrink-0"
                      />
                      <div className={`flex size-7 items-center justify-center rounded-lg shrink-0 ${getTaskTypeColor(task.type)}`}>
                        <TaskIcon className="size-3.5" />
                      </div>
                      <span className={`text-[13px] font-medium flex-1 ${isChecked ? 'line-through text-muted-foreground' : ''}`}>
                        {task.task}
                      </span>
                      <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
                        {task.dueDate ? (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400">
                            Due {task.dueDate}
                          </Badge>
                        ) : task.duration}
                      </span>
                    </motion.div>
                  )
                })}
              </div>

              {/* AI Insights */}
              {learningProfile && !planLoading && (
                <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-cyan-50/80 to-teal-50/80 dark:from-cyan-950/20 dark:to-teal-950/20 border border-cyan-200/30 dark:border-cyan-800/20">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Zap className="size-3 text-cyan-600 dark:text-cyan-400" />
                      <span className="text-[11px] font-medium text-muted-foreground">Learning Speed</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500"
                          style={{ width: `${Math.round(learningProfile.learningSpeedScore)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
                        {Math.round(learningProfile.learningSpeedScore)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60 mt-1.5 flex items-center gap-1">
                    <Lightbulb className="size-2.5 text-amber-500 shrink-0" />
                    {learningProfile.learningSpeedScore >= 70
                      ? "You're a fast learner! Keep up the great pace."
                      : learningProfile.learningSpeedScore >= 40
                      ? "You're making steady progress. Try increasing your daily study time."
                      : "Building knowledge takes time. Stay consistent and you'll see results!"}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <Timer className="size-3.5" />
                  <span>Estimated total: <span className="font-semibold text-foreground">{dailyPlan?.totalEstimatedTime || '20 min'}</span></span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[12px] text-primary hover:text-primary/80 ios-press"
                  onClick={() => setCurrentView('recommendations')}
                >
                  ✦ View AI Insights
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 3.5: Recommended For You
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.18 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-100 to-teal-100 dark:from-cyan-950/40 dark:to-teal-950/40">
              <Compass className="size-3.5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h2 className="text-[16px] font-semibold">Recommended For You</h2>
            <Badge variant="secondary" className="text-[10px] bg-gradient-to-r from-cyan-100 to-teal-100 text-cyan-700 dark:from-cyan-950/40 dark:to-teal-950/40 dark:text-cyan-400 border-0 px-2">
              ✦ AI-picked
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-[12px] text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 gap-1"
            onClick={() => setCurrentView('recommendations')}
          >
            View All
            <ChevronRight className="size-3" />
          </Button>
        </div>

        {recsLoading ? (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl ios-shadow-sm bg-card overflow-hidden">
                <Skeleton className="h-28 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : !recommendations || recommendations.recommendations.length === 0 ? (
          <div className="rounded-2xl ios-shadow-sm bg-gradient-to-br from-cyan-50 via-teal-50/50 to-emerald-50 dark:from-cyan-950/20 dark:via-teal-950/10 dark:to-emerald-950/20 p-8 text-center relative overflow-hidden border border-cyan-200/30 dark:border-cyan-800/20">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 mx-auto shadow-lg shadow-cyan-500/25">
              <Compass className="size-8 text-white" />
            </div>
            <h3 className="mt-4 text-[16px] font-bold text-foreground">Discover New Courses</h3>
            <p className="mt-1 text-[13px] text-muted-foreground max-w-xs mx-auto">
              Personalized recommendations will appear here based on your learning journey
            </p>
            <Button
              className="mt-4 rounded-full bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white shadow-lg shadow-cyan-500/25 h-10 px-6 text-[13px] font-semibold"
              onClick={() => setCurrentView('courses')}
            >
              <Sparkles className="size-4 mr-1.5" />
              Browse Courses
            </Button>
          </div>
        ) : (
          <>
            {/* Reason subtitle */}
            {recommendations.reason && (
              <p className="text-[12px] text-muted-foreground mb-3 flex items-center gap-1.5">
                <Lightbulb className="size-3 text-amber-500 shrink-0" />
                {recommendations.reason}
              </p>
            )}
            {/* Cards: horizontal scroll on mobile, 3-col grid on desktop */}
            <div className="flex lg:grid lg:grid-cols-3 gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin lg:overflow-x-visible lg:pb-0">
              {recommendations.recommendations.slice(0, 6).map((course, i) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springTransition, delay: 0.18 + i * 0.05 }}
                  className="rounded-2xl ios-shadow-sm bg-card overflow-hidden min-w-[260px] lg:min-w-0 group hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => { setSelectedCourseId(course.id); setCurrentView('course-detail') }}
                >
                  {/* Thumbnail with gradient */}
                  <div className={`relative h-28 bg-gradient-to-br ${categoryGradients[course.category] || 'from-emerald-500 to-teal-600'} flex items-center justify-center`}>
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
                    <div className="relative">
                      <Badge variant="secondary" className="bg-white/25 text-white hover:bg-white/25 backdrop-blur-sm text-[10px] px-2 py-0.5 border-0">
                        {course.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Card content */}
                  <div className="p-4 space-y-2">
                    <h4 className="text-[14px] font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                      {course.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      {course.instructor.name}
                    </p>

                    <div className="flex items-center gap-3 text-[11px]">
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                        <Star className="size-3 fill-amber-400 text-amber-400" />
                        {course.rating.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground">
                        {formatEnrollmentCount(course.enrollmentCount)} enrolled
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 ml-auto">
                        {course.price === 0 ? 'Free' : `$${course.price}`}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      className="w-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-[12px] h-8 mt-1"
                      onClick={(e) => { e.stopPropagation(); setSelectedCourseId(course.id); setCurrentView('course-detail') }}
                    >
                      <Play className="size-3 mr-1" />
                      {course.price === 0 ? 'Start Learning' : 'Enroll'}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 4: My Stats (4 cards)
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex size-7 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/40">
            <TrendingUp className="size-3.5 text-teal-600 dark:text-teal-400" />
          </div>
          <h2 className="text-[16px] font-semibold">My Stats</h2>
        </div>

        <StudentStatCardGrid>
          <StudentStatCard
            icon={BookOpen}
            value={<CountUp end={stats?.coursesEnrolled ?? enrollments.length} />}
            label="Courses Enrolled"
            color="emerald"
            subLabel={`${stats?.completedCourses ?? 0} completed`}
            sparkData={[1, 2, 2, 3, 3, 4, 5]}
            index={0}
          />
          <StudentStatCard
            icon={CheckCircle}
            value={<CountUp end={stats?.lessonsCompleted ?? 0} />}
            label="Lessons Completed"
            color="teal"
            subLabel="this month"
            sparkData={[3, 5, 4, 7, 6, 8, 10]}
            index={1}
          />
          <StudentStatCard
            icon={Brain}
            value={<CountUp end={stats?.quizzesTaken ?? 0} />}
            label="Quizzes Passed"
            color="cyan"
            subLabel={`avg ${stats?.avgQuizScore ?? 0}%`}
            sparkData={[2, 3, 2, 4, 5, 4, 6]}
            index={2}
          />
          <StudentStatCard
            icon={Zap}
            value={<CountUp end={stats?.totalXP ?? xp} suffix=" XP" />}
            label="XP Points Earned"
            color="amber"
            subLabel={`Level ${level} 🏅`}
            sparkData={[50, 80, 60, 120, 90, 150, 180]}
            index={3}
          />
        </StudentStatCardGrid>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 5: Streak & Activity
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.25 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex size-7 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950/40">
            <Flame className="size-3.5 text-orange-600 dark:text-orange-400" />
          </div>
          <h2 className="text-[16px] font-semibold">Streak & Activity</h2>
        </div>

        <div className="rounded-2xl ios-shadow-sm bg-card p-5 space-y-5">
          {/* Streak & Daily Goal Tracker */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Streak badge */}
            <div className="flex items-center gap-2.5">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-950/40 dark:to-amber-950/40">
                <Flame className="size-6 text-orange-500 dark:text-orange-400 streak-fire" />
              </div>
              <div>
                <p className="text-[20px] font-bold">{streak}-day streak</p>
                <p className="text-[11px] text-muted-foreground">Keep it going! 🔥</p>
              </div>
            </div>

            <Separator orientation="vertical" className="hidden sm:block h-12" />

            {/* Daily goal progress */}
            <div className="flex-1 w-full sm:w-auto space-y-2">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">Goal: {DAILY_GOAL_MINUTES} min/day</span>
                <span className="font-semibold">
                  Today: {todayMinutes} min
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted/50 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((todayMinutes / DAILY_GOAL_MINUTES) * 100, 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                  className={`h-full rounded-full ${todayMinutes >= DAILY_GOAL_MINUTES ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-orange-400 to-amber-400'}`}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  {todayMinutes >= DAILY_GOAL_MINUTES
                    ? '🎉 Goal achieved!'
                    : `${Math.max(0, DAILY_GOAL_MINUTES - todayMinutes)} min left`}
                </span>
                <span>{Math.round((todayMinutes / DAILY_GOAL_MINUTES) * 100)}%</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Weekly XP Bar Chart */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Weekly XP Activity</p>
              <span className="text-[11px] text-muted-foreground">
                {thisWeekDays.reduce((sum, d) => sum + (d?.xp || 0), 0)} XP this week
              </span>
            </div>
            <div className="flex items-end gap-1.5 h-28 px-1">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                const activity = thisWeekDays[i]
                const xpVal = activity?.xp ?? 0
                const maxXP = Math.max(...thisWeekDays.map(d => d?.xp ?? 0), 1)
                const barHeight = Math.max((xpVal / maxXP) * 100, 4) // minimum 4% for visibility
                const isToday = i === new Date().getDay() - 1 || (new Date().getDay() === 0 && i === 6)
                return (
                  <div key={day} className="flex flex-col items-center gap-1 flex-1 h-full justify-end group/bar">
                    {/* XP tooltip on hover */}
                    <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover/bar:opacity-100 transition-opacity tabular-nums">
                      {xpVal} XP
                    </span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${barHeight}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 + i * 0.08 }}
                      className={`w-full rounded-t-md relative overflow-hidden min-h-[3px] ${
                        xpVal > 0
                          ? isToday
                            ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-sm shadow-emerald-500/30'
                            : 'bg-gradient-to-t from-emerald-400/80 to-teal-300/80 dark:from-emerald-600/70 dark:to-teal-500/70'
                          : 'bg-muted/30'
                      }`}
                    >
                      {/* Shimmer effect on bars with XP */}
                      {xpVal > 0 && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                      )}
                    </motion.div>
                    <span className={`text-[10px] ${isToday ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-muted-foreground'}`}>
                      {day}
                    </span>
                  </div>
                )
              })}
            </div>

            {lastWeekDays.length > 0 && (
              <>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Last Week</p>
                  <span className="text-[11px] text-muted-foreground">
                    {lastWeekDays.reduce((sum, d) => sum + (d?.xp || 0), 0)} XP
                  </span>
                </div>
                <div className="flex items-end gap-1.5 h-20 px-1">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                    const activity = lastWeekDays[i]
                    const xpVal = activity?.xp ?? 0
                    const maxXP = Math.max(...lastWeekDays.map(d => d?.xp ?? 0), 1)
                    const barHeight = Math.max((xpVal / maxXP) * 100, 4)
                    return (
                      <div key={day} className="flex flex-col items-center gap-1 flex-1 h-full justify-end group/bar">
                        <span className="text-[9px] font-medium text-muted-foreground/60 opacity-0 group-hover/bar:opacity-100 transition-opacity tabular-nums">
                          {xpVal} XP
                        </span>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${barHeight}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.7 + i * 0.06 }}
                          className={`w-full rounded-t-sm min-h-[2px] ${
                            xpVal > 0
                              ? 'bg-gradient-to-t from-emerald-300/50 to-teal-200/50 dark:from-emerald-700/40 dark:to-teal-600/40'
                              : 'bg-muted/20'
                          }`}
                        />
                        <span className="text-[10px] text-muted-foreground/60">{day}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 6: Upcoming Deadlines
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.3 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex size-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40">
            <Calendar className="size-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-[16px] font-semibold">Upcoming Deadlines</h2>
        </div>

        <div className="rounded-2xl ios-shadow-sm bg-card p-5">
          {upcomingDeadlines.length === 0 ? (
            <div className="text-center py-6">
              <Calendar className="size-10 text-muted-foreground/20 mx-auto" />
              <p className="mt-2 text-[14px] text-muted-foreground">No upcoming deadlines</p>
              <p className="text-[12px] text-muted-foreground/60">You&apos;re all caught up! 🎉</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {upcomingDeadlines.slice(0, 5).map((deadline, i) => {
                const daysLeft = daysUntil(deadline.dueDate)
                const icon = daysLeft <= 1 ? '⏰' : '📅'
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springTransition, delay: i * 0.05 }}
                    className={`flex items-center gap-3 rounded-xl p-3 border ios-press cursor-pointer transition-colors hover:bg-accent/30 ${getDeadlineBgColor(daysLeft)}`}
                  >
                    <span className="text-[18px] shrink-0">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">{deadline.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{deadline.course}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-[11px] font-semibold ${getDeadlineColor(daysLeft)}`}>
                        {formatDate(deadline.dueDate)}
                      </p>
                      {daysLeft <= 1 && (
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-rose-300 text-rose-600 dark:border-rose-700 dark:text-rose-400">
                          {daysLeft <= 0 ? 'Today!' : 'Tomorrow'}
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 7: Subject Performance
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.32 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-950/40 dark:to-emerald-950/40">
            <BarChart3 className="size-3.5 text-teal-600 dark:text-teal-400" />
          </div>
          <h2 className="text-[16px] font-semibold">Subject Performance</h2>
        </div>

        <div className="rounded-2xl ios-shadow-sm bg-card p-5 space-y-3.5">
          {(dashboardData?.subjectPerformance && dashboardData.subjectPerformance.length > 0
            ? dashboardData.subjectPerformance
            : [
                { subject: 'Mathematics', progress: 72, grade: 'A-', quizScore: 85 },
                { subject: 'Physics', progress: 65, grade: 'B+', quizScore: 78 },
                { subject: 'Chemistry', progress: 58, grade: 'B', quizScore: 72 },
                { subject: 'English', progress: 80, grade: 'A', quizScore: 90 },
                { subject: 'Computer Science', progress: 45, grade: 'C+', quizScore: 60 },
              ]
          ).slice(0, 5).map((subject, i) => {
            const subjectColors: Record<string, { bar: string; bg: string; text: string }> = {
              Mathematics: { bar: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-600 dark:text-emerald-400' },
              Physics: { bar: 'from-teal-500 to-cyan-500', bg: 'bg-teal-50 dark:bg-teal-950/20', text: 'text-teal-600 dark:text-teal-400' },
              Chemistry: { bar: 'from-cyan-500 to-emerald-500', bg: 'bg-cyan-50 dark:bg-cyan-950/20', text: 'text-cyan-600 dark:text-cyan-400' },
              English: { bar: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-950/20', text: 'text-amber-600 dark:text-amber-400' },
              'Computer Science': { bar: 'from-orange-500 to-rose-500', bg: 'bg-orange-50 dark:bg-orange-950/20', text: 'text-orange-600 dark:text-orange-400' },
              Biology: { bar: 'from-teal-400 to-emerald-400', bg: 'bg-teal-50 dark:bg-teal-950/20', text: 'text-teal-600 dark:text-teal-400' },
              default: { bar: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20', text: 'text-emerald-600 dark:text-emerald-400' },
            }
            const colors = subjectColors[subject.subject] || subjectColors.default
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...springTransition, delay: 0.34 + i * 0.05 }}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold">{subject.subject}</span>
                    {subject.grade && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${colors.bg} ${colors.text}`}>
                        {subject.grade}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {subject.quizScore > 0 && (
                      <span className="text-[10px] text-muted-foreground">Quiz: {subject.quizScore}%</span>
                    )}
                    <span className="text-[12px] font-bold tabular-nums">{subject.progress}%</span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-muted/40 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${subject.progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.5 + i * 0.1 }}
                    className={`h-full rounded-full bg-gradient-to-r ${colors.bar}`}
                  />
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 8: Recent Activity Timeline
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.36 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-100 to-teal-100 dark:from-cyan-950/40 dark:to-teal-950/40">
            <Activity className="size-3.5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <h2 className="text-[16px] font-semibold">Recent Activity</h2>
        </div>

        <div className="rounded-2xl ios-shadow-sm bg-card p-5">
          {(dashboardData?.notifications && dashboardData.notifications.length > 0
            ? dashboardData.notifications
            : [
                { message: 'Completed Lesson 5: Introduction to Algebra', time: '2 hours ago', type: 'lesson', read: true },
                { message: 'Scored 85% on Physics Quiz #3', time: '5 hours ago', type: 'quiz', read: true },
                { message: 'Earned "Quick Learner" badge 🏅', time: '1 day ago', type: 'badge', read: false },
                { message: 'Enrolled in Chemistry 101', time: '2 days ago', type: 'enrollment', read: true },
                { message: 'Completed Chapter 3: Newton\'s Laws', time: '3 days ago', type: 'lesson', read: true },
              ]
          ).slice(0, 5).length === 0 ? (
            <div className="text-center py-6">
              <Activity className="size-8 text-muted-foreground/20 mx-auto" />
              <p className="mt-2 text-[14px] text-muted-foreground">No recent activity</p>
              <p className="text-[12px] text-muted-foreground/60">Start learning to see your activity here</p>
            </div>
          ) : (
            <div className="relative space-y-0">
              {/* Timeline line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-emerald-300 via-teal-300 to-transparent dark:from-emerald-700 dark:via-teal-700" />

              {(dashboardData?.notifications && dashboardData.notifications.length > 0
                ? dashboardData.notifications
                : [
                    { message: 'Completed Lesson 5: Introduction to Algebra', time: '2 hours ago', type: 'lesson', read: true },
                    { message: 'Scored 85% on Physics Quiz #3', time: '5 hours ago', type: 'quiz', read: true },
                    { message: 'Earned "Quick Learner" badge 🏅', time: '1 day ago', type: 'badge', read: false },
                    { message: 'Enrolled in Chemistry 101', time: '2 days ago', type: 'enrollment', read: true },
                    { message: 'Completed Chapter 3: Newton\'s Laws', time: '3 days ago', type: 'lesson', read: true },
                  ]
              ).slice(0, 5).map((notification, i) => {
                const typeConfig: Record<string, { icon: typeof BookOpen; color: string; bg: string }> = {
                  lesson: { icon: BookMarked, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950/40' },
                  quiz: { icon: Brain, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-950/40' },
                  badge: { icon: Award, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/40' },
                  enrollment: { icon: BookOpen, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-950/40' },
                  achievement: { icon: Trophy, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-950/40' },
                  default: { icon: CircleDot, color: 'text-muted-foreground', bg: 'bg-muted' },
                }
                const config = typeConfig[notification.type] || typeConfig.default
                const Icon = config.icon
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springTransition, delay: 0.38 + i * 0.06 }}
                    className="relative flex items-start gap-3 py-2.5"
                  >
                    {/* Timeline dot */}
                    <div className={`relative z-10 flex size-[30px] shrink-0 items-center justify-center rounded-full ${config.bg} ring-2 ring-background`}>
                      <Icon className={`size-3.5 ${config.color}`} />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className={`text-[12px] leading-snug ${!notification.read ? 'font-semibold' : 'text-muted-foreground'}`}>
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">{notification.time}</p>
                    </div>
                    {!notification.read && (
                      <div className="size-2 rounded-full bg-emerald-500 shrink-0 mt-2" />
                    )}
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 9: ShijlAI Recommendations & Learning Insights
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.35 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-950/40 dark:to-purple-950/40">
              <Sparkles className="size-3.5 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-[16px] font-semibold">AI Insights</h2>
            <Badge variant="secondary" className="text-[10px] bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 dark:from-violet-950/40 dark:to-purple-950/40 dark:text-violet-400 border-0 px-2">
              ✦ AI-powered
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-[12px] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1"
            onClick={() => setCurrentView('recommendations')}
          >
            View All
            <ExternalLink className="size-3" />
          </Button>
        </div>

        {aiRecsLoading ? (
          <div className="grid gap-3 grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl ios-shadow-sm bg-card p-4 flex items-center gap-3">
                  <Skeleton className="size-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl ios-shadow-sm bg-card p-4 space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 lg:grid-cols-3">
            {/* Left: AI Recommendations list */}
            <div className="lg:col-span-2 space-y-2">
              {aiRecommendations.slice(0, 4).map((rec, i) => {
                const priorityColors: Record<string, { bg: string; text: string; border: string }> = {
                  high: { bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/20' },
                  medium: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' },
                  low: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
                }
                const typeIcons: Record<string, typeof BookOpen> = { lesson: BookOpen, quiz: Brain, course: Target, topic: Sparkles, study_plan: Calendar }
                const typeColors: Record<string, string> = { lesson: 'text-teal-600 dark:text-teal-400', quiz: 'text-violet-600 dark:text-violet-400', course: 'text-rose-600 dark:text-rose-400', topic: 'text-cyan-600 dark:text-cyan-400', study_plan: 'text-amber-600 dark:text-amber-400' }
                const typeBgs: Record<string, string> = { lesson: 'bg-teal-500/10', quiz: 'bg-violet-500/10', course: 'bg-rose-500/10', topic: 'bg-cyan-500/10', study_plan: 'bg-amber-500/10' }

                const pColor = priorityColors[rec.priority] || priorityColors.medium
                const TypeIcon = typeIcons[rec.type] || Sparkles
                const tColor = typeColors[rec.type] || 'text-muted-foreground'
                const tBg = typeBgs[rec.type] || 'bg-muted'

                return (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springTransition, delay: 0.35 + i * 0.06 }}
                    className="group rounded-2xl border border-border/40 bg-card p-4 hover:border-border/60 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => {
                      if (rec.recommendedCourseId) {
                        setSelectedCourseId(rec.recommendedCourseId)
                        setCurrentView('course-detail')
                      }
                      else if (rec.type === 'quiz' || rec.type === 'study_plan') setCurrentView('tutor')
                      else setCurrentView('recommendations')
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tBg}`}>
                        <TypeIcon className={`size-5 ${tColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-[14px] font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                            {rec.title}
                          </h4>
                          <Badge variant="outline" className={`text-[9px] px-1.5 py-0 shrink-0 ${pColor.bg} ${pColor.text} ${pColor.border}`}>
                            {rec.priority}
                          </Badge>
                        </div>
                        {rec.description && (
                          <p className="text-[12px] text-muted-foreground line-clamp-1">{rec.description}</p>
                        )}
                        {rec.reason && (
                          <p className="text-[11px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                            <Lightbulb className="size-3 text-amber-500 shrink-0" />
                            {rec.reason}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0 mt-1" />
                    </div>
                  </motion.div>
                )
              })}

              {aiRecommendations.length === 0 && (
                <div className="rounded-2xl ios-shadow-sm bg-card p-6 text-center">
                  <Sparkles className="size-8 text-muted-foreground/20 mx-auto" />
                  <p className="mt-2 text-[14px] text-muted-foreground">No AI insights yet</p>
                  <p className="text-[12px] text-muted-foreground/60">Start learning and <ShijlAIText /> will analyze your patterns</p>
                </div>
              )}
            </div>

            {/* Right: Learning Insights mini-panel */}
            <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
              <div className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 px-4 py-3 border-b border-border/30">
                <div className="flex items-center gap-2">
                  <Brain className="size-4 text-violet-600 dark:text-violet-400" />
                  <h3 className="text-[13px] font-bold">Learning Intelligence</h3>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {/* Drop Risk */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <Shield className="size-3" />
                      Drop Risk
                    </span>
                    <span className={cn(
                      'text-[11px] font-bold',
                      (learningProfile?.dropRiskScore ?? 0) < 30 ? 'text-emerald-600 dark:text-emerald-400' :
                      (learningProfile?.dropRiskScore ?? 0) < 60 ? 'text-amber-600 dark:text-amber-400' :
                      'text-red-600 dark:text-red-400'
                    )}>
                      {Math.round(learningProfile?.dropRiskScore ?? 0)}% — {(learningProfile?.dropRiskScore ?? 0) < 30 ? 'Safe' : (learningProfile?.dropRiskScore ?? 0) < 60 ? 'Warning' : 'High Risk'}
                    </span>
                  </div>
                  <Progress value={learningProfile?.dropRiskScore ?? 0} className={cn(
                    'h-1.5',
                    (learningProfile?.dropRiskScore ?? 0) < 30 ? '[&>div]:bg-emerald-500' :
                    (learningProfile?.dropRiskScore ?? 0) < 60 ? '[&>div]:bg-amber-500' :
                    '[&>div]:bg-red-500'
                  )} />
                </div>

                {/* Engagement */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <Zap className="size-3" />
                      Engagement
                    </span>
                    <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400">{Math.round(learningProfile?.engagementScore ?? 0)}%</span>
                  </div>
                  <Progress value={learningProfile?.engagementScore ?? 0} className="h-1.5 [&>div]:bg-violet-500" />
                </div>

                {/* Consistency */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <Activity className="size-3" />
                      Consistency
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{Math.round(learningProfile?.consistencyScore ?? 0)}%</span>
                  </div>
                  <Progress value={learningProfile?.consistencyScore ?? 0} className="h-1.5 [&>div]:bg-emerald-500" />
                </div>

                <Separator className="opacity-50" />

                {/* Weak Topics */}
                {learningProfile && learningProfile.weakTopics.length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                      <AlertTriangle className="size-3 text-amber-500" /> Weak Topics
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {learningProfile.weakTopics.slice(0, 3).map(t => (
                        <span key={t} className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strong Topics */}
                {learningProfile && learningProfile.strongTopics.length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                      <TrendingUp className="size-3 text-emerald-500" /> Strong Topics
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {learningProfile.strongTopics.slice(0, 3).map(t => (
                        <span key={t} className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-[11px] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1.5 h-8"
                  onClick={() => setCurrentView('recommendations')}
                >
                  <Route className="size-3" />
                  View AI Insights
                </Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════════
          QUICK ACCESS: Announcements & Recent Notifications
          ═══════════════════════════════════════════════════════════════════════ */}
      {dashboardData?.announcements && dashboardData.announcements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950/40">
              <Bell className="size-3.5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h2 className="text-[16px] font-semibold">Announcements</h2>
          </div>

          <div className="space-y-2">
            {dashboardData.announcements.slice(0, 3).map((announcement, i) => {
              const typeStyles: Record<string, string> = {
                info: 'bg-cyan-50 border-cyan-200/50 dark:bg-cyan-950/20 dark:border-cyan-800/30',
                warning: 'bg-amber-50 border-amber-200/50 dark:bg-amber-950/20 dark:border-amber-800/30',
                success: 'bg-emerald-50 border-emerald-200/50 dark:bg-emerald-950/20 dark:border-emerald-800/30',
              }
              const iconMap: Record<string, string> = { info: 'ℹ️', warning: '⚠️', success: '✅' }
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...springTransition, delay: 0.42 + i * 0.05 }}
                  className={`flex items-start gap-3 rounded-xl p-3 border ${typeStyles[announcement.type] || typeStyles.info}`}
                >
                  <span className="text-[16px] shrink-0 mt-0.5">{iconMap[announcement.type] || 'ℹ️'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium">{announcement.title}</p>
                    <p className="text-[12px] text-muted-foreground">{announcement.message}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 shrink-0">{formatDate(announcement.date)}</span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SKILL PROGRESS (Horizontal bars)
          ═══════════════════════════════════════════════════════════════════════ */}
      {dashboardData?.skillProgress && dashboardData.skillProgress.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.45 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40">
              <Award className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-[16px] font-semibold">Skill Progress</h2>
          </div>

          <div className="rounded-2xl ios-shadow-sm bg-card p-5 space-y-3">
            {dashboardData.skillProgress.slice(0, 5).map((skill, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="font-medium">{skill.skill}</span>
                  <span className="text-muted-foreground">Level {skill.level}/{skill.maxLevel}</span>
                </div>
                <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${skill.progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 + i * 0.1 }}
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          QUICK LINKS
          ═══════════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.5 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { icon: BookOpen, label: 'My Learning', view: 'courses' as const, gradient: 'from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40', iconColor: 'text-emerald-600 dark:text-emerald-400' },
          { icon: Brain, label: <>Ask <ShijlAIText /></>, view: 'tutor' as const, gradient: 'from-teal-100 to-cyan-100 dark:from-teal-950/40 dark:to-cyan-950/40', iconColor: 'text-teal-600 dark:text-teal-400' },
          { icon: Brain, label: 'AI Insights', view: 'recommendations' as const, gradient: 'from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40', iconColor: 'text-emerald-600 dark:text-emerald-400' },
          { icon: GraduationCap, label: 'Certificates', view: 'certificates' as const, gradient: 'from-cyan-100 to-emerald-100 dark:from-cyan-950/40 dark:to-emerald-950/40', iconColor: 'text-cyan-600 dark:text-cyan-400' },
        ].map((link, i) => (
          <motion.button
            key={link.view}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springTransition, delay: 0.5 + i * 0.05 }}
            className="rounded-2xl ios-shadow-sm bg-card p-4 flex flex-col items-center gap-2 ios-press hover:scale-[1.03] transition-transform"
            onClick={() => setCurrentView(link.view)}
          >
            <div className={`flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ${link.gradient}`}>
              <link.icon className={`size-5 ${link.iconColor}`} />
            </div>
            <span className="text-[12px] font-medium">{link.label}</span>
            <ArrowRight className="size-3 text-muted-foreground/40" />
          </motion.button>
        ))}
      </motion.div>
    </div>
  )
}
