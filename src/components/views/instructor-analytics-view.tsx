'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Users, Coins, Star, CheckCircle, BookOpen, Zap,
  TrendingUp, TrendingDown, ArrowUpDown, ArrowUp, ArrowDown, ArrowRight,
  Download, Loader2, AlertCircle, Award, Medal, Crown, Trophy,
  BarChart3, Target, FileText, Brain, Clock, Activity,
  ChevronRight, ChevronDown, ChevronUp, Sparkles, CircleDot, GraduationCap,
  RefreshCw, Eye, MessageSquare, ThumbsUp, ThumbsDown, Minus,
  Video, Radio, CalendarDays,
  Lightbulb, AlertTriangle, Wrench, ClipboardList, BookX,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { InstructorStatCard, InstructorStatCardGrid } from '@/components/instructor/instructor-stat-card'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Line,
} from 'recharts'

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

interface AnalyticsOverview {
  totalStudents: number
  totalRevenue: number
  avgRating: number
  completionRate: number
  totalCourses: number
  publishedCourses: number
  draftCourses: number
}

interface TimeSeriesPoint {
  date: string
  revenue?: number
  cumulative?: number
  enrollments?: number
}

interface CoursePerformanceItem {
  courseId: string
  title: string
  category: string
  enrollmentCount: number
  completionRate: number
  avgScore: number
  revenue: number
  rating: number
}

interface StudentDistribution {
  excellent: number
  good: number
  average: number
  needsImprovement: number
}

interface QuizAnalyticsData {
  totalQuizzes: number
  totalAttempts: number
  avgPassRate: number
  avgScore: number
  quizzesByType: Array<{ type: string; count: number }>
}

interface AssignmentAnalyticsData {
  totalAssignments: number
  submissionRate: number
  avgScore: number
  byType: Array<{ type: string; count: number }>
}

interface TopStudent {
  name: string
  xp: number
  coursesCompleted: number
  avgScore: number
}

interface EngagementMetrics {
  avgDailyActiveStudents: number
  avgTimeSpentPerStudent: number
  avgLessonsCompletedPerDay: number
}

interface CategoryBreakdownItem {
  category: string
  courseCount: number
  studentCount: number
  avgRating: number
}

interface ComparisonChange {
  current: number
  previous: number
  change: number
  changePercent: number
}

interface RetentionMetrics {
  activeStudents: number
  returningStudents: number
  churnedStudents: number
  retentionRate: number
  avgTimeToComplete: number
}

interface ModuleDropoff {
  moduleId: string
  moduleTitle: string
  order: number
  lessonCount: number
  avgCompletionRate: number
  dropoffRate: number
}

interface LessonDropoffCourse {
  courseId: string
  courseTitle: string
  modules: ModuleDropoff[]
}

interface ReviewItem {
  id: string
  courseTitle: string
  rating: number
  content: string
  userName: string
  createdAt: string
}

interface ReviewAnalyticsData {
  totalReviews: number
  avgRating: number
  ratingDistribution: Array<{ rating: number; count: number }>
  recentReviews: ReviewItem[]
  sentimentBreakdown: { positive: number; neutral: number; negative: number }
}

interface ForecastPoint {
  date: string
  projected: number
  lower: number
  upper: number
}

interface RevenueBreakdownItem {
  courseId: string
  courseTitle: string
  revenue: number
  percentage: number
  enrollmentCount: number
  avgPrice: number
}

interface LiveSessionAnalyticsData {
  totalSessions: number
  totalAttendees: number
  avgAttendanceRate: number
  byType: Array<{ type: string; count: number; avgAttendance: number }>
}

interface AnalyticsData {
  overview: AnalyticsOverview
  revenueOverTime: TimeSeriesPoint[]
  enrollmentOverTime: TimeSeriesPoint[]
  coursePerformance: CoursePerformanceItem[]
  studentDistribution: StudentDistribution
  quizAnalytics: QuizAnalyticsData
  assignmentAnalytics: AssignmentAnalyticsData
  topPerformingStudents: TopStudent[]
  engagementMetrics: EngagementMetrics
  categoryBreakdown: CategoryBreakdownItem[]
  comparison: {
    totalStudents: ComparisonChange
    totalRevenue: ComparisonChange
    avgRating: ComparisonChange
    completionRate: ComparisonChange
    publishedCourses: ComparisonChange
  }
  retentionMetrics: RetentionMetrics
  lessonDropoff: LessonDropoffCourse[]
  reviewAnalytics: ReviewAnalyticsData
  enrollmentForecast: ForecastPoint[]
  revenueBreakdown: RevenueBreakdownItem[]
  liveSessionAnalytics: LiveSessionAnalyticsData
}

interface AIInsight {
  type: 'opportunity' | 'warning' | 'achievement' | 'suggestion'
  title: string
  description: string
  metric: string
  value: string
  icon: string
}

interface InsightsData {
  insights: AIInsight[]
  summary: string
  recommendations: string[]
}

interface EngagementHeatmapData {
  period: string
  heatmap: {
    grid: number[][]
    days: string[]
    hours: string[]
  }
  byDayOfWeek: Array<{ day: string; dayIndex: number; totalActivities: number; avgPerHour: number }>
  peakHours: Array<{ hour: number; label: string; totalActivities: number; isPeak: boolean }>
  summary: {
    totalActivities: number
    peakDay: string | null
    peakHour: string | null
    avgActivitiesPerDay: number
    mostActiveTimeSlot: string | null
  }
  lessonMetrics: {
    completed: number
    inProgress: number
    total: number
    completionRate: number
    avgTimeSpentMinutes: number
  }
  enrollmentMetrics: {
    newEnrollments: number
    completedCourses: number
    avgProgress: number
  }
}

type Period = '7d' | '30d' | '90d' | 'all'
type SortField = 'title' | 'students' | 'completion' | 'score' | 'revenue' | 'rating'
type SortDirection = 'asc' | 'desc'

// ═══════════════════════════════════════════════════════════════════════════════
// Intelligent Analytics Types
// ═══════════════════════════════════════════════════════════════════════════════

interface IntelligentMetrics {
  totalStudents: number
  courseCompletionRate: number
  averageStudentScore: number
  averageEngagement: number
  averageAssignmentScore: number
  courseRating: number
}

interface DifficultLesson {
  lessonId: string
  lessonTitle: string
  moduleTitle: string
  courseTitle: string
  courseId: string
  difficultyScore: number
  avgScore: number
  completionRate: number
  repeatVisitRate: number
  dropoffRate: number
  studentCount: number
}

interface StudentStruggle {
  topic: string
  avgMastery: number
  strugglingStudents: number
  totalStudents: number
  trend: 'improving' | 'declining' | 'stable'
}

interface ModuleDrop {
  moduleTitle: string
  courseTitle: string
  courseId: string
  currentAvgScore: number
  previousAvgScore: number
  dropPercent: number
  studentCount: number
}

interface IntelligentInsight {
  id: string
  type: 'opportunity' | 'warning' | 'achievement' | 'suggestion'
  title: string
  description: string
  category: 'course_health' | 'student_engagement' | 'content_quality' | 'revenue'
  severity: 'info' | 'warning' | 'critical' | 'positive'
  actionable: boolean
  actionSuggestion?: string
}

interface IntelligentSuggestion {
  id: string
  type: 'add_revision' | 'create_quiz' | 'update_module' | 'review_content' | 'engage_students'
  title: string
  description: string
  targetId?: string
  targetType?: string
  priority: 'low' | 'medium' | 'high'
}

interface IntelligentAnalyticsData {
  metrics: IntelligentMetrics
  difficultLessons: DifficultLesson[]
  studentStruggles: StudentStruggle[]
  moduleDrops: ModuleDrop[]
  insights: IntelligentInsight[]
  suggestions: IntelligentSuggestion[]
}

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

const PIE_COLORS = ['#10b981', '#14b8a6', '#f59e0b', '#f43f5e']
const PIE_LABELS = ['Excellent (≥90%)', 'Good (≥70%)', 'Average (≥40%)', 'Needs Improvement (<40%)']

const CATEGORY_COLORS: Record<string, string> = {
  'IB': '#10b981',
  'O-Levels': '#14b8a6',
  'A-Levels': '#06b6d4',
  'IELTS': '#f59e0b',
  'AWS': '#8b5cf6',
  'Programming': '#22c55e',
  'Web Dev': '#0ea5e9',
  'Data Science': '#ec4899',
}

const QUIZ_TYPE_COLORS: Record<string, string> = {
  practice: '#10b981',
  assessment: '#14b8a6',
  diagnostic: '#f59e0b',
  certification: '#8b5cf6',
}

const ASSIGNMENT_TYPE_COLORS: Record<string, string> = {
  written: '#10b981',
  coding: '#14b8a6',
  project: '#f59e0b',
  'peer-review': '#06b6d4',
  presentation: '#8b5cf6',
}

const INSIGHT_COLORS: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  opportunity: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40' },
  warning: { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-400', iconBg: 'bg-amber-100 dark:bg-amber-900/40' },
  achievement: { bg: 'bg-teal-50 dark:bg-teal-950/30', border: 'border-teal-200 dark:border-teal-800', text: 'text-teal-700 dark:text-teal-400', iconBg: 'bg-teal-100 dark:bg-teal-900/40' },
  suggestion: { bg: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-200 dark:border-cyan-800', text: 'text-cyan-700 dark:text-cyan-400', iconBg: 'bg-cyan-100 dark:bg-cyan-900/40' },
}

const SESSION_TYPE_LABELS: Record<string, string> = {
  live_class: 'Live Class',
  office_hours: 'Office Hours',
  qa_session: 'Q&A Session',
  workshop: 'Workshop',
}

// ═══════════════════════════════════════════════════════════════════════════════
// Helper: Sparkline data generator
// ═══════════════════════════════════════════════════════════════════════════════

function generateSparkline(base: number, variance: number, length = 7): number[] {
  return Array.from({ length }, (_, i) =>
    Math.max(0, base + (Math.sin(i * 0.8) * variance + (Math.random() - 0.3) * variance * 0.5))
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Custom Chart Tooltip
// ═══════════════════════════════════════════════════════════════════════════════

function EmeraldTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; color: string }>
  label?: string
  formatter?: (value: number, dataKey: string) => string
}) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-xl bg-card p-3 ios-shadow-sm border border-border/50 text-[13px] min-w-[140px]">
      <p className="font-semibold mb-1.5 text-foreground">{label}</p>
      {payload.map((entry, i) => {
        const displayValue = formatter
          ? formatter(entry.value, entry.dataKey)
          : entry.value.toLocaleString()
        const labelMap: Record<string, string> = {
          revenue: 'Revenue',
          cumulative: 'Cumulative',
          enrollments: 'Enrollments',
          count: 'Count',
          value: 'Value',
          projected: 'Projected',
          lower: 'Lower Bound',
          upper: 'Upper Bound',
          percentage: 'Percentage',
        }
        return (
          <div key={i} className="flex items-center justify-between gap-3 py-0.5">
            <div className="flex items-center gap-1.5">
              <div
                className="size-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{labelMap[entry.dataKey] || entry.dataKey}</span>
            </div>
            <span className="font-semibold text-foreground">{displayValue}</span>
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Mini Sparkline Component
// ═══════════════════════════════════════════════════════════════════════════════

function MiniSparkline({ data, color = '#10b981', height = 32 }: { data: number[]; color?: string; height?: number }) {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const width = 80
  const padding = 2

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = height - padding - ((v - min) / range) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`
  const gradientId = `spark-${color.replace('#', '')}-${Math.random().toString(36).slice(2, 6)}`

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradientId})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Progress Ring Component
// ═══════════════════════════════════════════════════════════════════════════════

function ProgressRing({ value, size = 44, strokeWidth = 4, color = '#10b981' }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(value, 100) / 100) * circumference

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--muted)" strokeWidth={strokeWidth} opacity={0.3} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700"
      />
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Star Rating Component
// ═══════════════════════════════════════════════════════════════════════════════

function StarRating({ rating, max = 5, size = 12 }: { rating: number; max?: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.floor(rating)
        const half = !filled && i < rating
        return (
          <Star
            key={i}
            className={cn(
              'shrink-0',
              filled
                ? 'text-amber-500 fill-amber-500'
                : half
                  ? 'text-amber-500 fill-amber-200 dark:fill-amber-800'
                  : 'text-muted-foreground/30'
            )}
            style={{ width: size, height: size }}
          />
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Horizontal Stacked Bar Component
// ═══════════════════════════════════════════════════════════════════════════════

function HorizontalStackedBar({
  items,
  colorMap,
  total,
}: {
  items: Array<{ type: string; count: number }>
  colorMap: Record<string, string>
  total: number
}) {
  return (
    <div className="space-y-2">
      <div className="h-6 rounded-full overflow-hidden flex bg-muted/30">
        {items.map((item) => {
          const pct = total > 0 ? (item.count / total) * 100 : 0
          if (pct === 0) return null
          return (
            <motion.div
              key={item.type}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full first:rounded-l-full last:rounded-r-full relative group cursor-pointer"
              style={{ backgroundColor: colorMap[item.type] || '#94a3b8', minWidth: pct > 0 ? '4px' : '0' }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {pct > 12 && (
                  <span className="text-[9px] font-bold text-white drop-shadow-sm">{item.count}</span>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {items.map((item) => (
          <div key={item.type} className="flex items-center gap-1.5 text-[11px]">
            <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: colorMap[item.type] || '#94a3b8' }} />
            <span className="text-muted-foreground capitalize">{item.type.replace('-', ' ')}</span>
            <span className="font-semibold text-foreground">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Loading Skeleton
// ═══════════════════════════════════════════════════════════════════════════════

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div>
            <Skeleton className="h-7 w-28 rounded-xl" />
            <Skeleton className="h-4 w-48 rounded mt-1" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-72 rounded-full" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[110px] rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[300px] rounded-2xl" />
        <Skeleton className="h-[300px] rounded-2xl" />
      </div>
      <Skeleton className="h-[350px] rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[300px] rounded-2xl" />
        <Skeleton className="h-[300px] rounded-2xl" />
      </div>
      <Skeleton className="h-[250px] rounded-2xl" />
      <Skeleton className="h-[300px] rounded-2xl" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════

export function InstructorAnalyticsView() {
  const { currentUser } = useAppStore()

  // ─── State ────────────────────────────────────────────────────────────────
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<Period>('30d')
  const [sortField, setSortField] = useState<SortField>('students')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [exporting, setExporting] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState<'ai-insights' | 'statistics'>('ai-insights')

  // AI Insights state
  const [insightsData, setInsightsData] = useState<InsightsData | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState<string | null>(null)
  const [insightsOpen, setInsightsOpen] = useState(true)

  // Engagement heatmap state
  const [engagementData, setEngagementData] = useState<EngagementHeatmapData | null>(null)
  const [engagementLoading, setEngagementLoading] = useState(false)
  const [engagementError, setEngagementError] = useState<string | null>(null)

  // Lesson dropoff expanded courses
  const [expandedDropoffCourses, setExpandedDropoffCourses] = useState<Set<string>>(new Set())

  // Intelligent Analytics state
  const [intelligentData, setIntelligentData] = useState<IntelligentAnalyticsData | null>(null)
  const [intelligentLoading, setIntelligentLoading] = useState(false)
  const [intelligentError, setIntelligentError] = useState<string | null>(null)
  const [showAllDifficultLessons, setShowAllDifficultLessons] = useState(false)
  const [showAllStruggles, setShowAllStruggles] = useState(false)
  const [showAllModuleDrops, setShowAllModuleDrops] = useState(false)
  const [showAllSuggestions, setShowAllSuggestions] = useState(false)

  // Show more / Show less toggles
  const [showAllDropoffCourses, setShowAllDropoffCourses] = useState(false)
  const [expandedDropoffModules, setExpandedDropoffModules] = useState<Set<string>>(new Set())
  const [showAllRevenueCourses, setShowAllRevenueCourses] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [showAllStudents, setShowAllStudents] = useState(false)
  const [showAllCategories, setShowAllCategories] = useState(false)

  // Auto-refresh timer ref
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Fetch main analytics data ────────────────────────────────────────────
  const fetchAnalytics = useCallback(async (showLoading = true) => {
    if (!currentUser?.id) return
    if (showLoading) setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/instructor/analytics?instructorId=${currentUser.id}&period=${period}`)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        if (res.status === 404) {
          setData(null)
          return
        }
        throw new Error(errData.error || 'Failed to fetch analytics data')
      }
      const json = await res.json()
      setData(json as AnalyticsData)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id, period])

  // ─── Fetch AI insights ────────────────────────────────────────────────────
  const fetchInsights = useCallback(async () => {
    if (!currentUser?.id) return
    setInsightsLoading(true)
    setInsightsError(null)
    try {
      const res = await fetch(`/api/instructor/analytics/insights?instructorId=${currentUser.id}&period=${period}`)
      if (!res.ok) throw new Error('Failed to fetch insights')
      const json = await res.json()
      setInsightsData(json as InsightsData)
    } catch (err) {
      setInsightsError(err instanceof Error ? err.message : 'Failed to load insights')
    } finally {
      setInsightsLoading(false)
    }
  }, [currentUser?.id, period])

  // ─── Fetch engagement heatmap ─────────────────────────────────────────────
  const fetchEngagement = useCallback(async () => {
    if (!currentUser?.id) return
    setEngagementLoading(true)
    setEngagementError(null)
    try {
      const res = await fetch(`/api/instructor/analytics/engagement?instructorId=${currentUser.id}&period=${period}`)
      if (!res.ok) throw new Error('Failed to fetch engagement data')
      const json = await res.json()
      setEngagementData(json as EngagementHeatmapData)
    } catch (err) {
      setEngagementError(err instanceof Error ? err.message : 'Failed to load engagement data')
    } finally {
      setEngagementLoading(false)
    }
  }, [currentUser?.id, period])

  // ─── Fetch intelligent analytics data ─────────────────────────────────────
  const fetchIntelligentData = useCallback(async () => {
    if (!currentUser?.id) return
    setIntelligentLoading(true)
    setIntelligentError(null)
    try {
      const res = await fetch(`/api/analytics/intelligent?userId=${currentUser.id}&role=instructor`)
      if (!res.ok) throw new Error('Failed to fetch intelligent analytics')
      const json = await res.json()
      setIntelligentData(json as IntelligentAnalyticsData)
    } catch (err) {
      setIntelligentError(err instanceof Error ? err.message : 'Failed to load intelligent analytics')
    } finally {
      setIntelligentLoading(false)
    }
  }, [currentUser?.id])

  // ─── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  useEffect(() => {
    fetchEngagement()
  }, [fetchEngagement])

  useEffect(() => {
    fetchIntelligentData()
  }, [fetchIntelligentData])

  // ─── Export Data ────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true)
    try {
      // Create CSV content for raw data export
      const csvRows = [
        ['Metric', 'Value'],
        ['Total Students', data?.overview.totalStudents || 0],
        ['Total Revenue ($)', data?.overview.totalRevenue || 0],
        ['Average Rating', data?.overview.avgRating || 0],
        ['Completion Rate (%)', data?.overview.completionRate || 0],
        ['Total Courses', data?.overview.totalCourses || 0],
        ['Published Courses', data?.overview.publishedCourses || 0]
      ]
      
      const csvContent = csvRows.map(e => e.join(",")).join("\n")
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `instructor-analytics-${period}-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Load jspdf and html2canvas dynamically for PDF export
      const { jsPDF } = await import('jspdf')
      const html2canvas = (await import('html2canvas')).default
      
      const element = document.getElementById('analytics-dashboard')
      if (element) {
        toast.info('Generating PDF report...')
        // Hide UI elements we don't want in the PDF
        const exportBtn = document.getElementById('export-btn')
        if (exportBtn) exportBtn.style.display = 'none'
          
        const canvas = await html2canvas(element, { scale: 2, useCORS: true })
        
        if (exportBtn) exportBtn.style.display = 'flex'

        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF('p', 'mm', 'a4')
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
        pdf.save(`analytics-report-${new Date().toISOString().split('T')[0]}.pdf`)
      }
      
      toast.success('Reports exported successfully')
    } catch (err) {
      console.error(err)
      toast.error('Failed to export reports')
    } finally {
      setExporting(false)
    }
  }

  // Auto-refresh every 60s
  useEffect(() => {
    if (autoRefreshRef.current) clearInterval(autoRefreshRef.current)
    if (autoRefresh) {
      autoRefreshRef.current = setInterval(() => {
        fetchAnalytics(false)
      }, 60000)
    }
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current)
    }
  }, [autoRefresh, fetchAnalytics])

  // Expand first course in dropoff by default
  useEffect(() => {
    if (data?.lessonDropoff && data.lessonDropoff.length > 0) {
      setExpandedDropoffCourses(new Set([data.lessonDropoff[0].courseId]))
    }
  }, [data?.lessonDropoff])

  // ─── Computed values ──────────────────────────────────────────────────────
  const engagementScore = useMemo(() => {
    if (!data) return 0
    const { overview, engagementMetrics } = data
    const studentWeight = Math.min(overview.totalStudents / 50, 1) * 25
    const completionWeight = (overview.completionRate / 100) * 25
    const activityWeight = Math.min(engagementMetrics.avgDailyActiveStudents / 20, 1) * 25
    const ratingWeight = (overview.avgRating / 5) * 25
    return Math.round(studentWeight + completionWeight + activityWeight + ratingWeight)
  }, [data])

  const sortedCourses = useMemo(() => {
    if (!data) return []
    const sorted = [...data.coursePerformance]
    sorted.sort((a, b) => {
      let aVal: number | string
      let bVal: number | string
      switch (sortField) {
        case 'title': aVal = a.title; bVal = b.title; break
        case 'students': aVal = a.enrollmentCount; bVal = b.enrollmentCount; break
        case 'completion': aVal = a.completionRate; bVal = b.completionRate; break
        case 'score': aVal = a.avgScore; bVal = b.avgScore; break
        case 'revenue': aVal = a.revenue; bVal = b.revenue; break
        case 'rating': aVal = a.rating; bVal = b.rating; break
        default: aVal = 0; bVal = 0
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })
    return sorted
  }, [data, sortField, sortDirection])

  const pieData = useMemo(() => {
    if (!data) return []
    const d = data.studentDistribution
    return [
      { name: 'Excellent', value: d.excellent, color: PIE_COLORS[0] },
      { name: 'Good', value: d.good, color: PIE_COLORS[1] },
      { name: 'Average', value: d.average, color: PIE_COLORS[2] },
      { name: 'Needs Improvement', value: d.needsImprovement, color: PIE_COLORS[3] },
    ]
  }, [data])

  // KPI config with real comparison data
  const kpiConfig = useMemo(() => {
    if (!data) return []
    const comp = data.comparison
    return [
      {
        key: 'totalStudents' as const,
        label: 'Total Students',
        icon: Users,
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        iconBg: 'bg-emerald-100 dark:bg-emerald-950/40',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        format: (v: number) => v.toLocaleString(),
        value: data.overview.totalStudents,
        comparison: comp.totalStudents,
      },
      {
        key: 'totalRevenue' as const,
        label: 'Total Revenue',
        icon: Coins,
        bg: 'bg-teal-50 dark:bg-teal-950/30',
        iconBg: 'bg-teal-100 dark:bg-teal-950/40',
        iconColor: 'text-teal-600 dark:text-teal-400',
        format: (v: number) => `$${v.toLocaleString()}`,
        value: data.overview.totalRevenue,
        comparison: comp.totalRevenue,
      },
      {
        key: 'avgRating' as const,
        label: 'Avg Course Rating',
        icon: Star,
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        iconBg: 'bg-amber-100 dark:bg-amber-950/40',
        iconColor: 'text-amber-600 dark:text-amber-400',
        format: (v: number) => v.toFixed(1),
        value: data.overview.avgRating,
        comparison: comp.avgRating,
      },
      {
        key: 'completionRate' as const,
        label: 'Completion Rate',
        icon: CheckCircle,
        bg: 'bg-cyan-50 dark:bg-cyan-950/30',
        iconBg: 'bg-cyan-100 dark:bg-cyan-950/40',
        iconColor: 'text-cyan-600 dark:text-cyan-400',
        format: (v: number) => `${v}%`,
        value: data.overview.completionRate,
        comparison: comp.completionRate,
      },
      {
        key: 'publishedCourses' as const,
        label: 'Published Courses',
        icon: BookOpen,
        bg: 'bg-green-50 dark:bg-green-950/30',
        iconBg: 'bg-green-100 dark:bg-green-950/40',
        iconColor: 'text-green-600 dark:text-green-400',
        format: (v: number) => v.toLocaleString(),
        value: data.overview.publishedCourses,
        comparison: comp.publishedCourses,
      },
      {
        key: 'engagementScore' as const,
        label: 'Engagement Score',
        icon: Zap,
        bg: 'bg-teal-50 dark:bg-teal-950/30',
        iconBg: 'bg-teal-100 dark:bg-teal-950/40',
        iconColor: 'text-teal-600 dark:text-teal-400',
        format: (v: number) => `${v}`,
        value: engagementScore,
        comparison: null,
      },
    ]
  }, [data, engagementScore])

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }


  const toggleDropoffCourse = (courseId: string) => {
    setExpandedDropoffCourses(prev => {
      const next = new Set(prev)
      if (next.has(courseId)) next.delete(courseId)
      else next.add(courseId)
      return next
    })
  }

  // ─── Format helpers ───────────────────────────────────────────────────────
  const formatRevenue = (v: number) => {
    if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`
    return `$${v.toLocaleString()}`
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  // ─── Loading State ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 pb-4">
        <AnalyticsSkeleton />
      </div>
    )
  }

  // ─── Error State ────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="size-10 text-rose-500" />
        <p className="text-[15px] font-medium text-foreground">{error || 'Failed to load analytics'}</p>
        <p className="text-[13px] text-muted-foreground">Something went wrong while fetching your analytics data.</p>
        <Button variant="outline" size="sm" className="rounded-full ios-press" onClick={() => fetchAnalytics()}>
          Try Again
        </Button>
      </div>
    )
  }

  const { overview, revenueOverTime, enrollmentOverTime, coursePerformance, studentDistribution, quizAnalytics, assignmentAnalytics, topPerformingStudents, engagementMetrics, categoryBreakdown, retentionMetrics, lessonDropoff, reviewAnalytics, enrollmentForecast, revenueBreakdown, liveSessionAnalytics } = data

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div id="analytics-dashboard" className="space-y-6 pb-4">

      {/* ═══════════════════════════════════════════════════════════════════
          1. HEADER SECTION
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
      >
        <div className="relative rounded-2xl overflow-hidden ios-shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 animate-gradient-shift opacity-10" />
          <div className="relative p-5 bg-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Title */}
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white ios-shadow-sm">
                  <Brain className="size-5" />
                </div>
                <div>
                  <h1 className="text-[28px] font-bold tracking-tight">Intelligent Analytics</h1>
                  <p className="text-[13px] text-muted-foreground">
                    {currentUser?.name ? `${currentUser.name}'s teaching ` : 'Track your teaching '}performance & student engagement
                  </p>
                </div>
              </div>

              {/* Right side: controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Period Selector Pills */}
                <div className="flex items-center rounded-full bg-muted/60 p-0.5">
                  {(['7d', '30d', '90d', 'all'] as Period[]).map((p) => {
                    const labels: Record<Period, string> = { '7d': '7 Days', '30d': '30 Days', '90d': '90 Days', 'all': 'All Time' }
                    const isActive = period === p
                    return (
                      <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all ios-press',
                          isActive
                            ? 'bg-card text-foreground ios-shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {labels[p]}
                      </button>
                    )
                  })}
                </div>

                {/* Auto-refresh toggle */}
                <button
                  onClick={() => setAutoRefresh(prev => !prev)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium transition-all border',
                    autoRefresh
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'border-border bg-card text-muted-foreground'
                  )}
                >
                  <RefreshCw className={cn('size-3', autoRefresh && 'animate-spin')} style={{ animationDuration: '3s' }} />
                  Auto
                </button>

                {/* Export Report button */}
                <Button
                  id="export-btn"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30 ios-press"
                  onClick={handleExport}
                  disabled={exporting}
                >
                  {exporting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Download className="size-3.5" />
                  )}
                  {exporting ? 'Exporting...' : 'Export Report'}
                </Button>
              </div>
            </div>

            {/* Last updated timestamp */}
            {lastUpdated && (
              <div className="flex items-center gap-1.5 mt-3 text-[11px] text-muted-foreground">
                <Clock className="size-3" />
                <span>Last updated: {formatTimeAgo(lastUpdated)}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 rounded-xl bg-muted/50 p-1">
        <button
          onClick={() => setActiveTab('ai-insights')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all',
            activeTab === 'ai-insights'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Brain className="size-4 text-emerald-500" />
          AI Insights
        </button>
        <button
          onClick={() => setActiveTab('statistics')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all',
            activeTab === 'statistics'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <BarChart3 className="size-4 text-teal-500" />
          Statistics
        </button>
      </div>

      {activeTab === 'ai-insights' && (
      <>
      {/* ═══════════════════════════════════════════════════════════════════
          2. AI INSIGHTS PANEL (collapsible)
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.05 }}
        className="rounded-2xl ios-shadow-sm bg-card overflow-hidden"
      >
        {/* Header */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setInsightsOpen(prev => !prev)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setInsightsOpen(prev => !prev) } }}
          className="w-full flex items-center justify-between p-5 hover:bg-accent/30 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
              <Sparkles className="size-4" />
            </div>
            <div className="text-left">
              <h3 className="text-[17px] font-semibold">AI Insights</h3>
              <p className="text-[11px] text-muted-foreground">Smart analysis of your teaching data</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full h-7 text-[11px] gap-1"
              onClick={(e) => { e.stopPropagation(); fetchInsights() }}
              disabled={insightsLoading}
            >
              <RefreshCw className={cn('size-3', insightsLoading && 'animate-spin')} />
              Regenerate
            </Button>
            {insightsOpen ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Collapsible content */}
        <AnimatePresence>
          {insightsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5 space-y-4">
                {insightsLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full rounded" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-xl" />
                      ))}
                    </div>
                  </div>
                ) : insightsError ? (
                  <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
                    <AlertCircle className="size-6" />
                    <p className="text-[13px]">{insightsError}</p>
                    <Button variant="outline" size="sm" className="rounded-full" onClick={fetchInsights}>
                      Retry
                    </Button>
                  </div>
                ) : insightsData ? (
                  <>
                    {/* AI Summary */}
                    {insightsData.summary && (
                      <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-3 border border-emerald-200/50 dark:border-emerald-800/50">
                        <p className="text-[13px] text-foreground leading-relaxed">{insightsData.summary}</p>
                      </div>
                    )}

                    {/* Insight cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {insightsData.insights.map((insight, i) => {
                        const colors = INSIGHT_COLORS[insight.type] || INSIGHT_COLORS.suggestion
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...springTransition, delay: i * 0.05 }}
                            className={cn('rounded-xl p-3 border', colors.bg, colors.border)}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className={cn('flex size-8 items-center justify-center rounded-lg text-[16px] shrink-0', colors.iconBg)}>
                                {insight.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className={cn('text-[13px] font-semibold', colors.text)}>{insight.title}</p>
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-md capitalize">
                                    {insight.type}
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">{insight.description}</p>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <span className="text-[11px] font-bold text-foreground">{insight.value}</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>

                    {/* Recommendations */}
                    {insightsData.recommendations.length > 0 && (
                      <div className="rounded-xl bg-accent/30 p-3">
                        <p className="text-[13px] font-semibold mb-2 text-foreground">Recommendations</p>
                        <ol className="space-y-1.5">
                          {insightsData.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                              <span className="flex size-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold shrink-0">
                                {i + 1}
                              </span>
                              <span className="leading-relaxed">{rec}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          2.5 INTELLIGENT ANALYTICS SECTIONS (from /api/analytics/intelligent)
          ═══════════════════════════════════════════════════════════════════ */}

      {/* Intelligent Data Loading / Error Banner */}
      {intelligentLoading && !intelligentData && (
        <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-emerald-500" />
          <span className="text-[13px]">Loading intelligent analytics...</span>
        </div>
      )}
      {intelligentError && !intelligentData && (
        <div className="flex items-center justify-center gap-3 py-4 text-muted-foreground">
          <AlertCircle className="size-4 text-amber-500" />
          <span className="text-[13px]">{intelligentError}</span>
          <Button variant="outline" size="sm" className="rounded-full text-[11px] h-7" onClick={fetchIntelligentData}>
            Retry
          </Button>
        </div>
      )}

      {intelligentData && (
        <>
          {/* ─── DIFFICULT LESSONS DETECTED ─── */}
          {intelligentData.difficultLessons.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.08 }}
              className="rounded-2xl ios-shadow-sm bg-card p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/40">
                    <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold">Difficult Lessons Detected</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {intelligentData.difficultLessons.length} lessons with high difficulty scores
                    </p>
                  </div>
                </div>
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 text-[10px] rounded-lg">
                  AI-detected
                </Badge>
              </div>

              <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
                <div className="space-y-3">
                  {(showAllDifficultLessons ? intelligentData.difficultLessons : intelligentData.difficultLessons.slice(0, 5)).map((lesson, idx) => {
                    const difficultyColor = lesson.difficultyScore >= 70
                      ? 'from-rose-500 to-red-600'
                      : lesson.difficultyScore >= 50
                        ? 'from-amber-500 to-orange-600'
                        : 'from-amber-400 to-amber-500'
                    const difficultyLabel = lesson.difficultyScore >= 70 ? 'Hard' : lesson.difficultyScore >= 50 ? 'Moderate' : 'Elevated'
                    return (
                      <motion.div
                        key={lesson.lessonId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...springTransition, delay: idx * 0.04 }}
                        className="rounded-xl border border-border/50 p-3.5 hover:bg-accent/20 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-[13px] font-semibold text-foreground truncate">{lesson.lessonTitle}</p>
                              <Badge className={cn('text-[9px] px-1.5 py-0 rounded-md text-white bg-gradient-to-r', difficultyColor)}>
                                {difficultyLabel}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {lesson.moduleTitle} · {lesson.courseTitle}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <div className="text-center px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                              <p className="text-[16px] font-bold text-amber-700 dark:text-amber-400">{lesson.difficultyScore}</p>
                              <p className="text-[8px] text-muted-foreground font-medium">Difficulty</p>
                            </div>
                          </div>
                        </div>

                        {/* Difficulty bar */}
                        <div className="mt-2.5">
                          <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${lesson.difficultyScore}%` }}
                              transition={{ duration: 0.6, delay: idx * 0.05, ease: 'easeOut' }}
                              className={cn('h-full rounded-full bg-gradient-to-r', difficultyColor)}
                            />
                          </div>
                        </div>

                        {/* Metrics row */}
                        <div className="flex items-center gap-4 mt-2.5 text-[11px]">
                          <span className="text-muted-foreground">
                            Completion: <span className={cn('font-semibold', lesson.completionRate >= 60 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>{lesson.completionRate}%</span>
                          </span>
                          <span className="text-muted-foreground">
                            Dropoff: <span className={cn('font-semibold', lesson.dropoffRate >= 40 ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400')}>{lesson.dropoffRate}%</span>
                          </span>
                          <span className="text-muted-foreground">
                            Revisits: <span className="font-semibold text-foreground">{lesson.repeatVisitRate}%</span>
                          </span>
                          <span className="text-muted-foreground">
                            Students: <span className="font-semibold text-foreground">{lesson.studentCount}</span>
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
                {intelligentData.difficultLessons.length > 5 && (
                  <Button variant="ghost" size="sm" className="w-full text-[12px] text-muted-foreground hover:text-foreground mt-2" onClick={() => setShowAllDifficultLessons(prev => !prev)}>
                    {showAllDifficultLessons ? 'Show less' : `Show all ${intelligentData.difficultLessons.length} lessons`}
                    {showAllDifficultLessons ? <ChevronUp className="size-3.5 ml-1" /> : <ChevronDown className="size-3.5 ml-1" />}
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* ─── STUDENT STRUGGLE AREAS ─── */}
          {intelligentData.studentStruggles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.12 }}
              className="rounded-2xl ios-shadow-sm bg-card p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/40">
                    <BookX className="size-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold">Student Struggle Areas</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Weak topics across your students
                    </p>
                  </div>
                </div>
                <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 text-[10px] rounded-lg">
                  {intelligentData.studentStruggles.length} topics
                </Badge>
              </div>

              <div className="max-h-[350px] overflow-y-auto scrollbar-thin">
                <div className="space-y-2">
                  {(showAllStruggles ? intelligentData.studentStruggles : intelligentData.studentStruggles.slice(0, 6)).map((struggle, idx) => {
                    const masteryColor = struggle.avgMastery < 30
                      ? '#f43f5e'
                      : struggle.avgMastery < 50
                        ? '#f59e0b'
                        : '#14b8a6'
                    const trendIcon = struggle.trend === 'improving'
                      ? <TrendingUp className="size-3 text-emerald-500" />
                      : struggle.trend === 'declining'
                        ? <TrendingDown className="size-3 text-rose-500" />
                        : <Minus className="size-3 text-muted-foreground" />
                    return (
                      <motion.div
                        key={struggle.topic}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ ...springTransition, delay: idx * 0.03 }}
                        className="flex items-center gap-3 rounded-xl p-3 hover:bg-accent/30 transition-colors"
                      >
                        <div className="flex size-9 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/20 shrink-0">
                          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">#{idx + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-[13px] font-semibold text-foreground truncate">{struggle.topic}</p>
                            {trendIcon}
                          </div>
                          <div className="flex items-center gap-3 text-[11px]">
                            <span className="text-muted-foreground">
                              Avg mastery: <span className="font-semibold" style={{ color: masteryColor }}>{struggle.avgMastery}%</span>
                            </span>
                            <span className="text-muted-foreground">
                              <span className="font-semibold text-rose-600 dark:text-rose-400">{struggle.strugglingStudents}</span>/{struggle.totalStudents} struggling
                            </span>
                          </div>
                          {/* Mini mastery bar */}
                          <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden mt-1.5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${struggle.avgMastery}%` }}
                              transition={{ duration: 0.5, delay: idx * 0.04 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: masteryColor }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
                {intelligentData.studentStruggles.length > 6 && (
                  <Button variant="ghost" size="sm" className="w-full text-[12px] text-muted-foreground hover:text-foreground mt-2" onClick={() => setShowAllStruggles(prev => !prev)}>
                    {showAllStruggles ? 'Show less' : `Show all ${intelligentData.studentStruggles.length} topics`}
                    {showAllStruggles ? <ChevronUp className="size-3.5 ml-1" /> : <ChevronDown className="size-3.5 ml-1" />}
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* ─── MODULE PERFORMANCE DROPS ─── */}
          {intelligentData.moduleDrops.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.16 }}
              className="rounded-2xl ios-shadow-sm bg-card p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-950/40">
                    <TrendingDown className="size-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold">Module Performance Drops</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Modules where student scores declined
                    </p>
                  </div>
                </div>
                <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 text-[10px] rounded-lg">
                  {intelligentData.moduleDrops.length} modules
                </Badge>
              </div>

              <div className="max-h-[350px] overflow-y-auto scrollbar-thin">
                <div className="grid gap-3 sm:grid-cols-2">
                  {(showAllModuleDrops ? intelligentData.moduleDrops : intelligentData.moduleDrops.slice(0, 4)).map((drop, idx) => {
                    const dropColor = drop.dropPercent >= 20
                      ? 'text-rose-600 dark:text-rose-400'
                      : drop.dropPercent >= 10
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-orange-600 dark:text-orange-400'
                    return (
                      <motion.div
                        key={`${drop.moduleTitle}-${drop.courseTitle}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ ...springTransition, delay: idx * 0.04 }}
                        className="rounded-xl border border-border/50 p-3.5 hover:bg-accent/20 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-foreground truncate">{drop.moduleTitle}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{drop.courseTitle}</p>
                          </div>
                          <Badge className={cn('text-[10px] px-1.5 py-0.5 rounded-md font-bold', drop.dropPercent >= 20 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400')}>
                            -{drop.dropPercent}%
                          </Badge>
                        </div>

                        {/* Score comparison */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 text-center rounded-lg bg-emerald-50 dark:bg-emerald-950/20 py-1.5 px-2">
                            <p className="text-[14px] font-bold text-emerald-600 dark:text-emerald-400">{drop.previousAvgScore}%</p>
                            <p className="text-[9px] text-muted-foreground">Previous</p>
                          </div>
                          <div className="shrink-0">
                            <ArrowRight className="size-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 text-center rounded-lg bg-rose-50 dark:bg-rose-950/20 py-1.5 px-2">
                            <p className="text-[14px] font-bold text-rose-600 dark:text-rose-400">{drop.currentAvgScore}%</p>
                            <p className="text-[9px] text-muted-foreground">Current</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <Users className="size-3" />
                          <span>{drop.studentCount} students</span>
                          <span className={cn('font-semibold ml-auto', dropColor)}>
                            {drop.dropPercent >= 20 ? 'Significant drop' : drop.dropPercent >= 10 ? 'Moderate drop' : 'Slight drop'}
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
                {intelligentData.moduleDrops.length > 4 && (
                  <Button variant="ghost" size="sm" className="w-full text-[12px] text-muted-foreground hover:text-foreground mt-2" onClick={() => setShowAllModuleDrops(prev => !prev)}>
                    {showAllModuleDrops ? 'Show less' : `Show all ${intelligentData.moduleDrops.length} modules`}
                    {showAllModuleDrops ? <ChevronUp className="size-3.5 ml-1" /> : <ChevronDown className="size-3.5 ml-1" />}
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* ─── AI SUGGESTIONS ─── */}
          {intelligentData.suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.2 }}
              className="rounded-2xl ios-shadow-sm bg-card p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                    <Lightbulb className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold">AI Suggestions</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Actionable improvements for your courses
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full h-7 text-[11px] gap-1"
                  onClick={fetchIntelligentData}
                  disabled={intelligentLoading}
                >
                  <RefreshCw className={cn('size-3', intelligentLoading && 'animate-spin')} />
                  Refresh
                </Button>
              </div>

              <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
                <div className="space-y-3">
                  {(showAllSuggestions ? intelligentData.suggestions : intelligentData.suggestions.slice(0, 5)).map((suggestion, idx) => {
                    const typeConfig: Record<string, { icon: JSX.Element; bg: string; text: string; border: string }> = {
                      add_revision: {
                        icon: <BookOpen className="size-3.5" />,
                        bg: 'bg-amber-50 dark:bg-amber-950/20',
                        text: 'text-amber-700 dark:text-amber-400',
                        border: 'border-amber-200 dark:border-amber-800',
                      },
                      create_quiz: {
                        icon: <Brain className="size-3.5" />,
                        bg: 'bg-emerald-50 dark:bg-emerald-950/20',
                        text: 'text-emerald-700 dark:text-emerald-400',
                        border: 'border-emerald-200 dark:border-emerald-800',
                      },
                      update_module: {
                        icon: <Wrench className="size-3.5" />,
                        bg: 'bg-orange-50 dark:bg-orange-950/20',
                        text: 'text-orange-700 dark:text-orange-400',
                        border: 'border-orange-200 dark:border-orange-800',
                      },
                      review_content: {
                        icon: <ClipboardList className="size-3.5" />,
                        bg: 'bg-cyan-50 dark:bg-cyan-950/20',
                        text: 'text-cyan-700 dark:text-cyan-400',
                        border: 'border-cyan-200 dark:border-cyan-800',
                      },
                      engage_students: {
                        icon: <Users className="size-3.5" />,
                        bg: 'bg-teal-50 dark:bg-teal-950/20',
                        text: 'text-teal-700 dark:text-teal-400',
                        border: 'border-teal-200 dark:border-teal-800',
                      },
                    }
                    const config = typeConfig[suggestion.type] || typeConfig.review_content
                    const priorityColors = {
                      high: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
                      medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
                      low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
                    }
                    return (
                      <motion.div
                        key={suggestion.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...springTransition, delay: idx * 0.04 }}
                        className={cn('rounded-xl border p-3.5', config.bg, config.border)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn('flex size-8 items-center justify-center rounded-lg shrink-0', config.text)}>
                            {config.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <p className={cn('text-[13px] font-semibold', config.text)}>{suggestion.title}</p>
                              <Badge className={cn('text-[9px] px-1.5 py-0 rounded-md', priorityColors[suggestion.priority])}>
                                {suggestion.priority}
                              </Badge>
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-md capitalize">
                                {suggestion.type.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">{suggestion.description}</p>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
                {intelligentData.suggestions.length > 5 && (
                  <Button variant="ghost" size="sm" className="w-full text-[12px] text-muted-foreground hover:text-foreground mt-2" onClick={() => setShowAllSuggestions(prev => !prev)}>
                    {showAllSuggestions ? 'Show less' : `Show all ${intelligentData.suggestions.length} suggestions`}
                    {showAllSuggestions ? <ChevronUp className="size-3.5 ml-1" /> : <ChevronDown className="size-3.5 ml-1" />}
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </>
      )}
      </>)}

      {activeTab === 'statistics' && (
      <>
      {/* ═══════════════════════════════════════════════════════════════════
          3. KPI OVERVIEW CARDS (6 cards with real comparison data)
          ═══════════════════════════════════════════════════════════════════ */}
      <InstructorStatCardGrid columns={3}>
        {kpiConfig.map((kpi, i) => {
          const changePercent = kpi.comparison?.changePercent ?? 0
          const colorToken = kpi.key === 'totalStudents' ? 'emerald'
            : kpi.key === 'totalRevenue' ? 'teal'
            : kpi.key === 'avgRating' ? 'amber'
            : kpi.key === 'completionRate' ? 'cyan'
            : kpi.key === 'publishedCourses' ? 'emerald'
            : 'teal'

          return (
            <InstructorStatCard
              key={kpi.key}
              icon={kpi.icon}
              value={kpi.format(kpi.value)}
              label={kpi.label}
              color={colorToken}
              trend={kpi.comparison ? changePercent : undefined}
              trendLabel={kpi.comparison ? 'vs last period' : `${engagementScore}/100 composite`}
              sparkData={generateSparkline(kpi.value, Math.max(kpi.value * 0.15, 1))}
              index={i}
            />
          )
        })}
      </InstructorStatCardGrid>

      {/* ═══════════════════════════════════════════════════════════════════
          4. REVENUE & ENROLLMENT CHARTS (2-column)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.3 }}
          className="rounded-2xl ios-shadow-sm bg-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
                <Coins className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-[17px] font-semibold">Revenue Over Time</h3>
                <p className="text-[11px] text-muted-foreground">Daily revenue & cumulative total</p>
              </div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] rounded-lg">
              {formatRevenue(overview.totalRevenue)} total
            </Badge>
          </div>
          {revenueOverTime.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Coins className="size-10 text-muted-foreground/20 mb-2" />
              <p className="text-[13px]">No revenue data yet</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueOverTime} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cumulRevGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                  <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatRevenue(v)} />
                  <Tooltip content={<EmeraldTooltip formatter={(v) => formatRevenue(v)} />} />
                  <Area type="monotone" dataKey="cumulative" stroke="#14b8a6" strokeWidth={2} fill="url(#cumulRevGradient)" name="Cumulative" />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revGradient)" name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Enrollment Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.35 }}
          className="rounded-2xl ios-shadow-sm bg-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-950/40">
                <Users className="size-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h3 className="text-[17px] font-semibold">Enrollment Over Time</h3>
                <p className="text-[11px] text-muted-foreground">New enrollments & cumulative</p>
              </div>
            </div>
            <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 text-[10px] rounded-lg">
              {overview.totalStudents} students
            </Badge>
          </div>
          {enrollmentOverTime.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Users className="size-10 text-muted-foreground/20 mb-2" />
              <p className="text-[13px]">No enrollment data yet</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={enrollmentOverTime} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cumulEnrollGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                  <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<EmeraldTooltip />} />
                  <Area type="monotone" dataKey="cumulative" stroke="#10b981" strokeWidth={2} fill="url(#cumulEnrollGrad)" name="Cumulative" />
                  <Area type="monotone" dataKey="enrollments" stroke="#14b8a6" strokeWidth={2} fill="url(#enrollGrad)" name="Enrollments" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          5. REVENUE BREAKDOWN (full width)
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.4 }}
        className="rounded-2xl ios-shadow-sm bg-card p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="flex size-8 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-950/40">
            <BarChart3 className="size-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h3 className="text-[17px] font-semibold">Revenue Breakdown</h3>
            <p className="text-[11px] text-muted-foreground">Revenue contribution by course</p>
          </div>
        </div>

        {revenueBreakdown.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Coins className="size-10 text-muted-foreground/20 mb-2" />
            <p className="text-[14px] font-medium">No revenue data</p>
            <p className="text-[12px]">Revenue will appear once students enroll in your courses</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
            <div className="space-y-3">
              {(showAllRevenueCourses ? revenueBreakdown : revenueBreakdown.slice(0, 5)).map((item, idx) => {
                const course = coursePerformance.find(c => c.courseId === item.courseId)
                const catColor = course ? (CATEGORY_COLORS[course.category] || '#10b981') : '#10b981'
                return (
                  <motion.div
                    key={item.courseId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springTransition, delay: idx * 0.03 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: catColor }} />
                        <span className="text-[13px] font-medium truncate">{item.courseTitle}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span className="text-[11px] text-muted-foreground">{item.enrollmentCount} students</span>
                        <span className="text-[13px] font-bold text-foreground">{formatRevenue(item.revenue)}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-md">{item.percentage}%</Badge>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.05, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: catColor }}
                      />
                    </div>
                  </motion.div>
                )
              })}
            </div>
            {revenueBreakdown.length > 5 && (
              <Button variant="ghost" size="sm" className="w-full text-[12px] text-muted-foreground hover:text-foreground mt-2" onClick={() => setShowAllRevenueCourses(prev => !prev)}>
                {showAllRevenueCourses ? 'Show less' : `Show all ${revenueBreakdown.length} courses`}
                {showAllRevenueCourses ? <ChevronUp className="size-3.5 ml-1" /> : <ChevronDown className="size-3.5 ml-1" />}
              </Button>
            )}
          </div>
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          6. STUDENT RETENTION & DISTRIBUTION (2-column)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: Retention Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.45 }}
          className="rounded-2xl ios-shadow-sm bg-card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
              <Activity className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-[17px] font-semibold">Student Retention</h3>
              <p className="text-[11px] text-muted-foreground">Engagement & retention metrics</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Active Students */}
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 p-3 flex items-center gap-3">
              <div className="relative shrink-0">
                <ProgressRing value={overview.totalStudents > 0 ? (retentionMetrics.activeStudents / overview.totalStudents) * 100 : 0} size={48} color="#10b981" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400">{retentionMetrics.activeStudents}</span>
                </div>
              </div>
              <div>
                <p className="text-[14px] font-bold text-foreground">{retentionMetrics.activeStudents}</p>
                <p className="text-[10px] text-muted-foreground font-medium">Active (7d)</p>
              </div>
            </div>
            {/* Returning Students */}
            <div className="rounded-xl bg-teal-50 dark:bg-teal-950/20 p-3 text-center">
              <p className="text-[20px] font-bold text-teal-700 dark:text-teal-400">{retentionMetrics.returningStudents}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Returning Students</p>
            </div>
            {/* Churned Students */}
            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 p-3 text-center">
              <p className="text-[20px] font-bold text-rose-600 dark:text-rose-400">{retentionMetrics.churnedStudents}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Churned (30d+)</p>
            </div>
            {/* Retention Rate */}
            <div className="rounded-xl bg-cyan-50 dark:bg-cyan-950/20 p-3 text-center">
              <p className="text-[20px] font-bold text-cyan-700 dark:text-cyan-400">{retentionMetrics.retentionRate}%</p>
              <p className="text-[10px] text-muted-foreground font-medium">Retention Rate</p>
            </div>
          </div>
          {/* Avg time to complete */}
          <div className="mt-3 flex items-center justify-between rounded-xl bg-accent/30 p-3">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <span className="text-[12px] text-muted-foreground">Avg Time to Complete</span>
            </div>
            <span className="text-[14px] font-bold text-foreground">
              {retentionMetrics.avgTimeToComplete > 0 ? `${retentionMetrics.avgTimeToComplete} days` : '—'}
            </span>
          </div>
        </motion.div>

        {/* Right: Student Distribution Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.5 }}
          className="rounded-2xl ios-shadow-sm bg-card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="flex size-8 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-950/40">
              <CircleDot className="size-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="text-[17px] font-semibold">Student Distribution</h3>
              <p className="text-[11px] text-muted-foreground">Performance breakdown</p>
            </div>
          </div>

          {pieData.every(d => d.value === 0) ? (
            <div className="flex flex-col items-center justify-center h-56 text-muted-foreground">
              <Users className="size-10 text-muted-foreground/20 mb-2" />
              <p className="text-[13px]">No students to distribute</p>
            </div>
          ) : (
            <>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={4} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value} students`, name]} contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', fontSize: '13px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {pieData.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-2 rounded-lg bg-accent/30 px-2.5 py-1.5">
                    <div className="size-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-muted-foreground truncate">{PIE_LABELS[idx]}</p>
                      <p className="text-[13px] font-bold text-foreground">{entry.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          7. COURSE PERFORMANCE TABLE
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.55 }}
        className="rounded-2xl ios-shadow-sm bg-card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
              <BarChart3 className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-[17px] font-semibold">Course Performance</h3>
              <p className="text-[11px] text-muted-foreground">{coursePerformance.length} courses tracked</p>
            </div>
          </div>
        </div>

        {coursePerformance.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BookOpen className="size-10 text-muted-foreground/20 mb-2" />
            <p className="text-[14px] font-medium">No courses to analyze</p>
            <p className="text-[12px]">Create and publish courses to see performance data</p>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto scrollbar-thin">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[640px]">
              <thead className="sticky top-0 z-10 bg-card">
                <tr className="border-b border-border/50">
                  {([
                    { field: 'title' as SortField, label: 'Course', width: '' },
                    { field: 'students' as SortField, label: 'Students', width: 'w-20' },
                    { field: 'completion' as SortField, label: 'Completion', width: 'w-28' },
                    { field: 'score' as SortField, label: 'Avg Score', width: 'w-20' },
                    { field: 'revenue' as SortField, label: 'Revenue', width: 'w-24' },
                    { field: 'rating' as SortField, label: 'Rating', width: 'w-28' },
                  ]).map((col) => (
                    <th
                      key={col.field}
                      className={cn(
                        'text-left text-[11px] font-semibold text-muted-foreground pb-3 px-2 cursor-pointer hover:text-foreground transition-colors',
                        col.width
                      )}
                      onClick={() => handleSort(col.field)}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {sortField === col.field ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="size-3 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <ArrowDown className="size-3 text-emerald-600 dark:text-emerald-400" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3 opacity-30" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {sortedCourses.map((course, idx) => {
                    const completionColor = course.completionRate >= 75 ? 'bg-emerald-500' : course.completionRate >= 50 ? 'bg-teal-500' : course.completionRate >= 25 ? 'bg-amber-500' : 'bg-rose-400'
                    const scoreColor = course.avgScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' : course.avgScore >= 60 ? 'text-teal-600 dark:text-teal-400' : course.avgScore >= 40 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                    return (
                      <motion.tr
                        key={course.courseId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ ...springTransition, delay: idx * 0.03 }}
                        className="border-b border-border/30 hover:bg-accent/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2.5">
                            <div className="size-9 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0" style={{ backgroundColor: CATEGORY_COLORS[course.category] || '#10b981' }}>
                              {course.category.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold truncate group-hover:text-primary transition-colors">{course.title}</p>
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 mt-0.5 rounded-md">{course.category}</Badge>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1">
                            <Users className="size-3 text-muted-foreground" />
                            <span className="text-[13px] font-semibold">{course.enrollmentCount}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-muted-foreground">{course.completionRate}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${course.completionRate}%` }} transition={{ duration: 0.6, delay: idx * 0.03 }} className={cn('h-full rounded-full', completionColor)} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className={cn('text-[13px] font-bold', scoreColor)}>{course.avgScore}%</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-[13px] font-semibold text-green-600 dark:text-green-400">{formatRevenue(course.revenue)}</span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1.5">
                            <StarRating rating={course.rating} size={11} />
                            <span className="text-[11px] font-semibold text-foreground">{course.rating.toFixed(1)}</span>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          </div>
        )}
      </motion.div>
      </>)}

      {activeTab === 'ai-insights' && (
      <>
      {/* ═══════════════════════════════════════════════════════════════════
          8. LESSON DROP-OFF ANALYSIS
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.6 }}
        className="rounded-2xl ios-shadow-sm bg-card p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="flex size-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/40">
            <TrendingDown className="size-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-[17px] font-semibold">Lesson Drop-off Analysis</h3>
            <p className="text-[11px] text-muted-foreground">Module-by-module completion & dropoff rates</p>
          </div>
        </div>

        {lessonDropoff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <BookOpen className="size-10 text-muted-foreground/20 mb-2" />
            <p className="text-[13px]">No dropoff data available</p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto scrollbar-thin">
            <div className="space-y-3">
              {(showAllDropoffCourses ? lessonDropoff : lessonDropoff.slice(0, 3)).map((course) => {
                const isExpanded = expandedDropoffCourses.has(course.courseId)
                const isModulesExpanded = expandedDropoffModules.has(course.courseId)
                const sortedModules = [...course.modules].sort((a, b) => a.order - b.order)
                const visibleModules = isModulesExpanded ? sortedModules : sortedModules.slice(0, 5)
                const remainingModules = sortedModules.length - 5
                return (
                <div key={course.courseId} className="rounded-xl border border-border/50 overflow-hidden">
                  <button
                    onClick={() => toggleDropoffCourse(course.courseId)}
                    className="w-full flex items-center justify-between p-3 hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="size-4 text-muted-foreground" />
                      <span className="text-[13px] font-semibold text-foreground">{course.courseTitle}</span>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-md">{course.modules.length} modules</Badge>
                    </div>
                    {isExpanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 space-y-2">
                          {visibleModules.map((mod, modIdx) => {
                            // Color from green (high completion) to red (high dropoff)
                            const completionColor = mod.avgCompletionRate >= 75 ? '#10b981' : mod.avgCompletionRate >= 50 ? '#f59e0b' : '#f43f5e'
                            const dropoffColor = mod.dropoffRate >= 75 ? '#f43f5e' : mod.dropoffRate >= 50 ? '#f59e0b' : '#10b981'
                            return (
                              <div key={mod.moduleId} className="rounded-lg bg-accent/20 p-2.5">
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-[10px] font-bold text-muted-foreground shrink-0">M{mod.order || modIdx + 1}</span>
                                    <span className="text-[12px] font-medium truncate">{mod.moduleTitle}</span>
                                    <span className="text-[10px] text-muted-foreground shrink-0">{mod.lessonCount} lessons</span>
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0 ml-2">
                                    <span className="text-[11px] font-semibold" style={{ color: completionColor }}>
                                      {mod.avgCompletionRate}% complete
                                    </span>
                                    <span className="text-[11px] font-semibold" style={{ color: dropoffColor }}>
                                      {mod.dropoffRate}% dropoff
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-1.5">
                                  <div className="flex-1">
                                    <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${mod.avgCompletionRate}%` }}
                                        transition={{ duration: 0.5, delay: modIdx * 0.05 }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: completionColor }}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${mod.dropoffRate}%` }}
                                        transition={{ duration: 0.5, delay: modIdx * 0.05 }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: dropoffColor }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                          {sortedModules.length > 5 && (
                            <Button variant="ghost" size="sm" className="w-full text-[12px] text-muted-foreground hover:text-foreground mt-1" onClick={() => setExpandedDropoffModules(prev => {
                              const next = new Set(prev)
                              if (next.has(course.courseId)) next.delete(course.courseId)
                              else next.add(course.courseId)
                              return next
                            })}>
                              {isModulesExpanded ? 'Show less' : `Show ${remainingModules} more modules`}
                              {isModulesExpanded ? <ChevronUp className="size-3.5 ml-1" /> : <ChevronDown className="size-3.5 ml-1" />}
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
            </div>
            {lessonDropoff.length > 3 && (
              <Button variant="ghost" size="sm" className="w-full text-[12px] text-muted-foreground hover:text-foreground mt-2" onClick={() => setShowAllDropoffCourses(prev => !prev)}>
                {showAllDropoffCourses ? 'Show less' : `Show ${lessonDropoff.length - 3} more courses`}
                {showAllDropoffCourses ? <ChevronUp className="size-3.5 ml-1" /> : <ChevronDown className="size-3.5 ml-1" />}
              </Button>
            )}
          </div>
        )}
      </motion.div>
      </>)}

      {activeTab === 'statistics' && (
      <>
      {/* ═══════════════════════════════════════════════════════════════════
          9. QUIZ & ASSIGNMENT ANALYTICS (2-column)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Quiz Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.65 }}
          className="rounded-2xl ios-shadow-sm bg-card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
              <Brain className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-[17px] font-semibold">Quiz Analytics</h3>
              <p className="text-[11px] text-muted-foreground">Assessment performance overview</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 p-3 text-center">
              <p className="text-[20px] font-bold text-emerald-700 dark:text-emerald-400">{quizAnalytics.totalQuizzes}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Total Quizzes</p>
            </div>
            <div className="rounded-xl bg-teal-50 dark:bg-teal-950/20 p-3 text-center">
              <p className="text-[20px] font-bold text-teal-700 dark:text-teal-400">{quizAnalytics.totalAttempts}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Total Attempts</p>
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 p-3 text-center">
              <p className="text-[20px] font-bold text-amber-700 dark:text-amber-400">{quizAnalytics.avgPassRate}%</p>
              <p className="text-[10px] text-muted-foreground font-medium">Avg Pass Rate</p>
            </div>
            <div className="rounded-xl bg-cyan-50 dark:bg-cyan-950/20 p-3 text-center">
              <p className="text-[20px] font-bold text-cyan-700 dark:text-cyan-400">{quizAnalytics.avgScore}%</p>
              <p className="text-[10px] text-muted-foreground font-medium">Avg Score</p>
            </div>
          </div>
          <div>
            <p className="text-[13px] font-semibold mb-2">Quizzes by Type</p>
            <HorizontalStackedBar items={quizAnalytics.quizzesByType} colorMap={QUIZ_TYPE_COLORS} total={quizAnalytics.totalQuizzes} />
          </div>
        </motion.div>

        {/* Assignment Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.7 }}
          className="rounded-2xl ios-shadow-sm bg-card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="flex size-8 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-950/40">
              <FileText className="size-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <h3 className="text-[17px] font-semibold">Assignment Analytics</h3>
              <p className="text-[11px] text-muted-foreground">Submission & grading overview</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl bg-teal-50 dark:bg-teal-950/20 p-3 text-center">
              <p className="text-[20px] font-bold text-teal-700 dark:text-teal-400">{assignmentAnalytics.totalAssignments}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Total</p>
            </div>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 p-3 text-center">
              <p className="text-[20px] font-bold text-emerald-700 dark:text-emerald-400">{assignmentAnalytics.submissionRate}%</p>
              <p className="text-[10px] text-muted-foreground font-medium">Submission Rate</p>
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 p-3 text-center">
              <p className="text-[20px] font-bold text-amber-700 dark:text-amber-400">{assignmentAnalytics.avgScore || '—'}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Avg Score</p>
            </div>
          </div>
          <div>
            <p className="text-[13px] font-semibold mb-2">Assignments by Type</p>
            <HorizontalStackedBar items={assignmentAnalytics.byType} colorMap={ASSIGNMENT_TYPE_COLORS} total={assignmentAnalytics.totalAssignments} />
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="text-muted-foreground font-medium">Submission Rate</span>
              <span className="font-bold text-foreground">{assignmentAnalytics.submissionRate}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted/40 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${assignmentAnalytics.submissionRate}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500" />
            </div>
          </div>
        </motion.div>
      </div>
      </>)}

      {activeTab === 'ai-insights' && (
      <>
      {/* ═══════════════════════════════════════════════════════════════════
          10. REVIEW ANALYTICS
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.72 }}
        className="rounded-2xl ios-shadow-sm bg-card p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="flex size-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/40">
            <MessageSquare className="size-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-[17px] font-semibold">Review Analytics</h3>
            <p className="text-[11px] text-muted-foreground">Student feedback & sentiment analysis</p>
          </div>
        </div>

        {reviewAnalytics.totalReviews === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <MessageSquare className="size-10 text-muted-foreground/20 mb-2" />
            <p className="text-[13px]">No reviews yet</p>
            <p className="text-[12px]">Reviews will appear once students rate your courses</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Rating distribution bar chart */}
            <div className="lg:col-span-1">
              <p className="text-[13px] font-semibold mb-3">Rating Distribution</p>
              <div className="space-y-2">
                {reviewAnalytics.ratingDistribution.map((rd) => {
                  const maxCount = Math.max(...reviewAnalytics.ratingDistribution.map(r => r.count), 1)
                  const widthPct = (rd.count / maxCount) * 100
                  return (
                    <div key={rd.rating} className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-muted-foreground w-6 shrink-0 text-right">{rd.rating}★</span>
                      <div className="flex-1 h-5 rounded-full bg-muted/30 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${widthPct}%` }}
                          transition={{ duration: 0.5 }}
                          className="h-full rounded-full bg-amber-400"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-foreground w-6 shrink-0">{rd.count}</span>
                    </div>
                  )
                })}
              </div>

              {/* Sentiment breakdown */}
              <div className="mt-4 space-y-2">
                <p className="text-[13px] font-semibold">Sentiment Breakdown</p>
                <div className="flex gap-2">
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 rounded-lg gap-1">
                    <ThumbsUp className="size-3" /> {reviewAnalytics.sentimentBreakdown.positive} Positive
                  </Badge>
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 rounded-lg gap-1">
                    <Minus className="size-3" /> {reviewAnalytics.sentimentBreakdown.neutral} Neutral
                  </Badge>
                  <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 rounded-lg gap-1">
                    <ThumbsDown className="size-3" /> {reviewAnalytics.sentimentBreakdown.negative} Negative
                  </Badge>
                </div>
              </div>
            </div>

            {/* Recent reviews list */}
            <div className="lg:col-span-2">
              <p className="text-[13px] font-semibold mb-3">Recent Reviews</p>
              {reviewAnalytics.recentReviews.length === 0 ? (
                <p className="text-[12px] text-muted-foreground py-4">No recent reviews</p>
              ) : (
                <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
                  <div className="space-y-2">
                    {(showAllReviews ? reviewAnalytics.recentReviews : reviewAnalytics.recentReviews.slice(0, 3)).map((review) => (
                      <div key={review.id} className="rounded-xl bg-accent/30 p-3 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <StarRating rating={review.rating} size={11} />
                            <span className="text-[11px] font-semibold text-foreground">{review.rating.toFixed(1)}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-[12px] text-foreground leading-relaxed line-clamp-2">
                          {review.content || 'No written feedback'}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Avatar className="size-5">
                            <AvatarFallback className="text-[8px] font-bold bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                              {review.userName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[11px] text-muted-foreground font-medium">{review.userName}</span>
                          <span className="text-[10px] text-muted-foreground">on</span>
                          <span className="text-[11px] font-medium text-foreground truncate">{review.courseTitle}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {reviewAnalytics.recentReviews.length > 3 && (
                    <Button variant="ghost" size="sm" className="w-full text-[12px] text-muted-foreground hover:text-foreground mt-2" onClick={() => setShowAllReviews(prev => !prev)}>
                      {showAllReviews ? 'Show less' : `Show ${reviewAnalytics.recentReviews.length - 3} more`}
                      {showAllReviews ? <ChevronUp className="size-3.5 ml-1" /> : <ChevronDown className="size-3.5 ml-1" />}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
      </>)}

      {activeTab === 'statistics' && (
      <>
      {/* ═══════════════════════════════════════════════════════════════════
          11. ENROLLMENT FORECAST
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.75 }}
        className="rounded-2xl ios-shadow-sm bg-card p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="flex size-8 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-950/40">
            <TrendingUp className="size-4 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h3 className="text-[17px] font-semibold">Enrollment Forecast</h3>
            <p className="text-[11px] text-muted-foreground">Projected enrollments with confidence intervals</p>
          </div>
        </div>

        {enrollmentForecast.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <TrendingUp className="size-10 text-muted-foreground/20 mb-2" />
            <p className="text-[13px]">Insufficient data for forecast</p>
            <p className="text-[12px]">Need more enrollment history to generate projections</p>
          </div>
        ) : (
          <>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={enrollmentForecast} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                  <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<EmeraldTooltip formatter={(v) => `${v} enrollments`} />} />
                  <Area type="monotone" dataKey="upper" stroke="none" fill="url(#confidenceGradient)" name="Upper" />
                  <Area type="monotone" dataKey="lower" stroke="none" fill="transparent" name="Lower" />
                  <Line type="monotone" dataKey="projected" stroke="#06b6d4" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Projected" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-2">
              <div className="flex items-center gap-1.5 text-[11px]">
                <div className="w-6 h-0.5 border-t-2 border-dashed border-cyan-500" />
                <span className="text-muted-foreground">Projected</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <div className="size-3 rounded-sm bg-cyan-200/40" />
                <span className="text-muted-foreground">95% Confidence</span>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          12. CATEGORY BREAKDOWN
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.8 }}
        className="rounded-2xl ios-shadow-sm bg-card p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="flex size-8 items-center justify-center rounded-xl bg-green-100 dark:bg-green-950/40">
            <GraduationCap className="size-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-[17px] font-semibold">Category Breakdown</h3>
            <p className="text-[11px] text-muted-foreground">Courses per category with student count & ratings</p>
          </div>
        </div>

        {categoryBreakdown.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <GraduationCap className="size-10 text-muted-foreground/20 mb-2" />
            <p className="text-[13px]">No category data</p>
          </div>
        ) : (
          <>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBreakdown} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                  <defs>
                    {categoryBreakdown.map((cat, i) => (
                      <linearGradient key={cat.category} id={`cat-${i}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={CATEGORY_COLORS[cat.category] || '#10b981'} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={CATEGORY_COLORS[cat.category] || '#10b981'} stopOpacity={0.4} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null
                      const tooltipData = payload[0].payload as CategoryBreakdownItem
                      return (
                        <div className="rounded-xl bg-card p-3 ios-shadow-sm border border-border/50 text-[13px] min-w-[180px]">
                          <p className="font-semibold mb-1.5" style={{ color: CATEGORY_COLORS[tooltipData.category] || '#10b981' }}>{tooltipData.category}</p>
                          <div className="space-y-1">
                            <div className="flex justify-between"><span className="text-muted-foreground">Courses</span><span className="font-semibold">{tooltipData.courseCount}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Students</span><span className="font-semibold">{tooltipData.studentCount}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Avg Rating</span><span className="font-semibold">{tooltipData.avgRating.toFixed(1)}</span></div>
                          </div>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="studentCount" radius={[0, 6, 6, 0]} name="Students">
                    {categoryBreakdown.map((cat, i) => (
                      <Cell key={`cat-cell-${i}`} fill={CATEGORY_COLORS[cat.category] || '#10b981'} fillOpacity={0.75} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-3">
              {(showAllCategories ? categoryBreakdown : categoryBreakdown.slice(0, 5)).map((cat, i) => (
                <motion.div
                  key={cat.category}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...springTransition, delay: 0.85 + i * 0.04 }}
                  className="rounded-xl bg-accent/40 p-3 hover:bg-accent/60 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-3 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#10b981' }} />
                    <span className="text-[12px] font-semibold truncate">{cat.category}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div><p className="text-[13px] font-bold text-foreground">{cat.courseCount}</p><p className="text-[9px] text-muted-foreground">Courses</p></div>
                    <div><p className="text-[13px] font-bold text-foreground">{cat.studentCount}</p><p className="text-[9px] text-muted-foreground">Students</p></div>
                    <div><p className="text-[13px] font-bold text-foreground">{cat.avgRating.toFixed(1)}</p><p className="text-[9px] text-muted-foreground">Rating</p></div>
                  </div>
                </motion.div>
              ))}
            </div>
            {categoryBreakdown.length > 5 && (
              <Button variant="ghost" size="sm" className="w-full text-[12px] text-muted-foreground hover:text-foreground mt-2" onClick={() => setShowAllCategories(prev => !prev)}>
                {showAllCategories ? 'Show less' : `Show ${categoryBreakdown.length - 5} more`}
                {showAllCategories ? <ChevronUp className="size-3.5 ml-1" /> : <ChevronDown className="size-3.5 ml-1" />}
              </Button>
            )}
          </>
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          13. TOP PERFORMING STUDENTS
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.85 }}
        className="rounded-2xl ios-shadow-sm bg-card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/40">
              <Trophy className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-[17px] font-semibold">Top Performing Students</h3>
              <p className="text-[11px] text-muted-foreground">Based on XP & course completion</p>
            </div>
          </div>
          <button
            className="flex items-center gap-0.5 text-[13px] font-medium text-primary ios-press hover:underline"
            onClick={() => {
              const { setCurrentView } = useAppStore.getState()
              setCurrentView('instructor-students')
            }}
          >
            View All Students <ChevronRight className="size-4" />
          </button>
        </div>

        {topPerformingStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Users className="size-10 text-muted-foreground/20 mb-2" />
            <p className="text-[13px]">No students enrolled yet</p>
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
            <div className="space-y-2">
              {(showAllStudents ? topPerformingStudents : topPerformingStudents.slice(0, 5)).map((student, idx) => {
                const medalConfig = [
                  { icon: Crown, bg: 'bg-amber-100 dark:bg-amber-950/40', color: 'text-amber-600 dark:text-amber-400' },
                  { icon: Medal, bg: 'bg-gray-200 dark:bg-gray-700', color: 'text-gray-600 dark:text-gray-300' },
                  { icon: Award, bg: 'bg-orange-100 dark:bg-orange-950/40', color: 'text-orange-600 dark:text-orange-400' },
                ]
                const MedalIcon = idx < 3 ? medalConfig[idx].icon : null
                return (
                  <motion.div
                    key={`${student.name}-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springTransition, delay: 0.9 + idx * 0.05 }}
                    className={cn(
                      'flex items-center gap-3 rounded-xl p-3 hover:bg-accent/40 transition-colors',
                      idx === 0 && 'bg-amber-50/50 dark:bg-amber-950/10'
                    )}
                  >
                    {MedalIcon ? (
                      <div className={cn('flex size-9 items-center justify-center rounded-full', medalConfig[idx].bg)}>
                        <MedalIcon className={cn('size-4', medalConfig[idx].color)} />
                      </div>
                    ) : (
                      <div className="flex size-9 items-center justify-center rounded-full bg-muted/60 text-[13px] font-bold text-muted-foreground">
                        {idx + 1}
                      </div>
                    )}
                    <Avatar className="size-10 ring-2 ring-primary/10">
                      <AvatarFallback className="text-[12px] font-semibold bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                        {student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold truncate">{student.name}</p>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><BookOpen className="size-3" />{student.coursesCompleted} courses</span>
                        <span className="flex items-center gap-1"><Target className="size-3" />{student.avgScore}% avg</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                      <Zap className="size-3 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[12px] font-bold text-emerald-700 dark:text-emerald-400">{student.xp.toLocaleString()}</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
            {topPerformingStudents.length > 5 && (
              <Button variant="ghost" size="sm" className="w-full text-[12px] text-muted-foreground hover:text-foreground mt-2" onClick={() => setShowAllStudents(prev => !prev)}>
                {showAllStudents ? 'Show less' : `Show all ${topPerformingStudents.length} students`}
                {showAllStudents ? <ChevronUp className="size-3.5 ml-1" /> : <ChevronDown className="size-3.5 ml-1" />}
              </Button>
            )}
          </div>
        )}
      </motion.div>
      </>)}

      {activeTab === 'ai-insights' && (
      <>
      {/* ═══════════════════════════════════════════════════════════════════
          14. ENGAGEMENT HEATMAP (REAL data from engagement API)
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.9 }}
        className="rounded-2xl ios-shadow-sm bg-card p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
            <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-[17px] font-semibold">Engagement Heatmap</h3>
            <p className="text-[11px] text-muted-foreground">Student activity by day & hour</p>
          </div>
        </div>

        {engagementLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-40 w-full rounded-xl" />
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
            </div>
          </div>
        ) : engagementError ? (
          <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
            <AlertCircle className="size-6" />
            <p className="text-[13px]">{engagementError}</p>
            <Button variant="outline" size="sm" className="rounded-full" onClick={fetchEngagement}>
              Retry
            </Button>
          </div>
        ) : engagementData ? (
          <RealEngagementHeatmap data={engagementData} />
        ) : null}
      </motion.div>
      </>)}

      {activeTab === 'statistics' && (
      <>
      {/* ═══════════════════════════════════════════════════════════════════
          15. LIVE SESSION ANALYTICS (conditional)
          ═══════════════════════════════════════════════════════════════════ */}
      {liveSessionAnalytics.totalSessions > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.95 }}
          className="rounded-2xl ios-shadow-sm bg-card p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="flex size-8 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/40">
              <Video className="size-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h3 className="text-[17px] font-semibold">Live Session Analytics</h3>
              <p className="text-[11px] text-muted-foreground">Session attendance & engagement</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 p-3 text-center">
              <p className="text-[20px] font-bold text-emerald-700 dark:text-emerald-400">{liveSessionAnalytics.totalSessions}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Total Sessions</p>
            </div>
            <div className="rounded-xl bg-teal-50 dark:bg-teal-950/20 p-3 text-center">
              <p className="text-[20px] font-bold text-teal-700 dark:text-teal-400">{liveSessionAnalytics.totalAttendees}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Total Attendees</p>
            </div>
            <div className="rounded-xl bg-cyan-50 dark:bg-cyan-950/20 p-3 text-center">
              <p className="text-[20px] font-bold text-cyan-700 dark:text-cyan-400">{liveSessionAnalytics.avgAttendanceRate}%</p>
              <p className="text-[10px] text-muted-foreground font-medium">Avg Attendance</p>
            </div>
          </div>

          {liveSessionAnalytics.byType.length > 0 && (
            <div>
              <p className="text-[13px] font-semibold mb-2">By Session Type</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {liveSessionAnalytics.byType.map((type) => (
                  <div key={type.type} className="rounded-xl bg-accent/30 p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Radio className="size-3 text-muted-foreground" />
                      <span className="text-[11px] font-semibold text-foreground">{SESSION_TYPE_LABELS[type.type] || type.type}</span>
                    </div>
                    <p className="text-[16px] font-bold text-foreground">{type.count}</p>
                    <p className="text-[10px] text-muted-foreground">{type.avgAttendance}% avg attendance</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
      </>)}

    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Real Engagement Heatmap (uses data from engagement API)
// ═══════════════════════════════════════════════════════════════════════════════

function RealEngagementHeatmap({ data }: { data: EngagementHeatmapData }) {
  const { heatmap, summary } = data

  const getColor = (value: number, maxVal: number): string => {
    if (maxVal === 0) return 'bg-emerald-100/30 dark:bg-emerald-900/10'
    const ratio = value / maxVal
    if (ratio === 0) return 'bg-emerald-100/30 dark:bg-emerald-900/10'
    if (ratio <= 0.15) return 'bg-emerald-200/50 dark:bg-emerald-800/30'
    if (ratio <= 0.3) return 'bg-emerald-300/60 dark:bg-emerald-700/40'
    if (ratio <= 0.5) return 'bg-emerald-400/70 dark:bg-emerald-600/50'
    if (ratio <= 0.75) return 'bg-emerald-500/80 dark:bg-emerald-500/60'
    return 'bg-emerald-600 dark:bg-emerald-400/80'
  }

  // Calculate max value for color scaling
  const maxVal = useMemo(() => {
    let max = 0
    for (const row of heatmap.grid) {
      for (const val of row) {
        if (val > max) max = val
      }
    }
    return max
  }, [heatmap.grid])

  // Day labels (remap: grid is 0=Sun to 6=Sat, we want Mon first)
  const dayIndices = [1, 2, 3, 4, 5, 6, 0] // Mon-Sun
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <div className="h-3" />
          {dayLabels.map((day) => (
            <div key={day} className="h-3.5 flex items-center text-[9px] text-muted-foreground font-medium pr-1.5">
              {day}
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-0.5">
          {/* Hour labels */}
          <div className="flex gap-0.5">
            {Array.from({ length: 24 }, (_, i) => i).filter((_, i) => i % 3 === 0).map((h) => (
              <div key={h} className="text-[8px] text-muted-foreground text-center" style={{ width: `${3 * 14 + 2}px` }}>
                {h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`}
              </div>
            ))}
          </div>
          {/* Heatmap grid */}
          {dayIndices.map((dayIdx, displayIdx) => (
            <div key={dayIdx} className="flex gap-0.5">
              {heatmap.grid[dayIdx].map((value, hourIdx) => (
                <motion.div
                  key={hourIdx}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: (displayIdx * 24 + hourIdx) * 0.002, ...springTransition }}
                  className={cn(
                    'size-3.5 rounded-[3px] transition-colors cursor-pointer hover:ring-1 hover:ring-emerald-400',
                    getColor(value, maxVal)
                  )}
                  title={`${dayLabels[displayIdx]} ${hourIdx}:00 — Activity: ${value}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-0.5">
          {[0, 0.15, 0.3, 0.5, 0.75, 1].map((ratio, i) => (
            <div key={i} className={cn('size-3 rounded-[2px]', getColor(ratio * maxVal, maxVal))} />
          ))}
        </div>
        <span>More</span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2 text-center">
          <p className="text-[14px] font-bold text-emerald-700 dark:text-emerald-400">{summary.avgActivitiesPerDay}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Avg/Day</p>
        </div>
        <div className="rounded-lg bg-teal-50 dark:bg-teal-950/30 p-2 text-center">
          <p className="text-[14px] font-bold text-teal-700 dark:text-teal-400">{summary.peakDay || '—'}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Peak Day</p>
        </div>
        <div className="rounded-lg bg-cyan-50 dark:bg-cyan-950/30 p-2 text-center">
          <p className="text-[14px] font-bold text-cyan-700 dark:text-cyan-400">{summary.peakHour || '—'}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Peak Hour</p>
        </div>
      </div>
    </div>
  )
}
