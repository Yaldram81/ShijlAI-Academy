'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Star, BookOpen, TrendingUp, Loader2, AlertCircle, Plus,
  ArrowUpRight, ArrowDownRight, MessageSquare, ClipboardCheck,
  Eye, Lightbulb, ChevronRight, Clock,
  Flame, Zap, GraduationCap, Award, Trophy, Coins,
  FileEdit, Send, CheckCircle2, BarChart3, Sparkles,
  Download, RefreshCw, Megaphone, PenTool, Copy, Archive,
  ChevronUp, ChevronDown, MoreHorizontal, X, DollarSign,
  Target, Activity, CalendarDays,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { InstructorStatCard, InstructorStatCardGrid } from '@/components/instructor/instructor-stat-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Legend,
} from 'recharts'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FinancialSummary {
  totalRevenue: number
  totalRefunds: number
  netRevenue: number
  platformFee: number
  instructorEarnings: number
  availableForPayout: number
  completedPayouts: number
  pendingPayouts: number
  commissionRate: number
  payoutRate: number
  currency: string
  hasCommissionOverride: boolean
  overrideReason: string | null
}

interface ComparisonData {
  instructor: {
    avgRating: number
    completionRate: number
    avgQuizPassRate: number
    totalStudents: number
    totalCourses: number
    totalRevenue: number
    avgRevenuePerCourse: number
  }
  platform: {
    totalCourses: number
    totalEnrollments: number
    avgRating: number
    avgCompletionRate: number
    avgQuizPassRate: number
    totalRevenue: number
    avgRevenuePerCourse: number
  }
  differences: {
    rating: number
    completionRate: number
    quizPassRate: number
    revenuePerCourse: number
  }
}

interface EngagementMetrics {
  lessonCompletionRate: number
  avgTimeSpentMinutes: number
  activityBreakdown: { lessons: number; quizzes: number; assignments: number; discussions: number }
  dailyActiveStudents: number
  weeklyActiveStudents: number
}

interface SubmissionStats {
  pending: number
  toGrade: number
  graded: number
  total: number
}

interface InstructorDashboardData {
  role: 'instructor'
  period: string
  welcomeData: {
    greeting: string
    subtitle?: string
    date: string
    totalStudents: number
    activeToday: number
    lastLogin?: string
  }
  stats: {
    totalCourses: number
    totalStudents: number
    avgRating: number
    totalRevenue: number
    completionRate: number
    avgQuizPassRate: number
    newEnrollmentsWeek: number
    pendingReviews: number
    monthRevenue?: number
    studentsMoMChange?: number
    revenueMoMChange?: number
    activeCourses?: number
    draftCourses?: number
    totalReviews?: number
  }
  enrollmentTrend: { date: string; enrollments: number; cumulative: number }[]
  revenueByDay?: { day: number; [courseSlug: string]: number }[]
  coursePerformance: {
    courseId: string
    courseTitle: string
    category: string
    enrollmentCount: number
    rating: number
    completionRate: number
    revenue: number
    quizStats: { totalAttempts: number; passRate: number; avgScore: number }
    status: 'published' | 'draft'
    modulesCount: number
    recentEnrollments: number
  }[]
  studentPerformanceDistribution: {
    excellent: number
    good: number
    average: number
    needsImprovement: number
  }
  topStudents: {
    id?: string
    name: string
    xp: number
    coursesCompleted: number
    avgScore: number
  }[]
  contentPipeline: {
    draft: number
    review: number
    published: number
  }
  recentStudentActivity: {
    studentName: string
    action: string
    course: string
    time: string
    type?: string
  }[]
  reviewQueue: {
    studentName: string
    quizTitle: string
    score: number
    submittedAt: string
  }[]
  announcements: {
    title: string
    message: string
    date: string
    type: 'info' | 'success' | 'warning'
  }[]
  actionRequired?: {
    type: string
    count: number
    text: string
    actionLabel: string
    actionView: string
  }[]
  tip?: string
  // New enhanced fields
  comparisonData?: ComparisonData | null
  engagementMetrics?: EngagementMetrics
  financialSummary?: FinancialSummary
  submissionStats?: SubmissionStats
  heatmapData?: {
    grid: number[][]
    days: string[]
    hours: string[]
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

const CHART_COLORS = ['#10b981', '#14b8a6', '#f59e0b', '#8b5cf6', '#f43f5e', '#06b6d4']

const ACTIVITY_TYPE_CONFIG: Record<string, { icon: typeof Users; color: string; bg: string; emoji: string }> = {
  enrollment: { icon: Users, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950/40', emoji: '🟢' },
  review: { icon: Star, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/40', emoji: '⭐' },
  question: { icon: MessageSquare, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950/40', emoji: '💬' },
  completion: { icon: BookOpen, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-950/40', emoji: '🎓' },
  earning: { icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950/40', emoji: '💰' },
  activity: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted/50', emoji: '🔵' },
}

const ACTION_TYPE_CONFIG: Record<string, { icon: typeof AlertCircle; color: string; bg: string }> = {
  qa: { icon: MessageSquare, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-950/40' },
  assignments: { icon: ClipboardCheck, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/40' },
  review: { icon: Eye, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-950/40' },
}

const PERFORMANCE_COLORS: Record<string, string> = {
  excellent: '#10b981',
  good: '#14b8a6',
  average: '#f59e0b',
  needsImprovement: '#f43f5e',
}

const PERFORMANCE_BG: Record<string, string> = {
  excellent: 'bg-emerald-500',
  good: 'bg-teal-500',
  average: 'bg-amber-500',
  needsImprovement: 'bg-rose-500',
}

const PERFORMANCE_LABELS: Record<string, string> = {
  excellent: 'Excellent (90%+)',
  good: 'Good (70-89%)',
  average: 'Average (50-69%)',
  needsImprovement: 'Needs Improvement (<50%)',
}

const RANK_STYLES: Record<number, { bg: string; border: string; text: string; icon: typeof Trophy; iconColor: string }> = {
  0: { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-300 dark:border-amber-700', text: 'text-amber-700 dark:text-amber-400', icon: Trophy, iconColor: 'text-amber-500' },
  1: { bg: 'bg-slate-50 dark:bg-slate-950/20', border: 'border-slate-300 dark:border-slate-700', text: 'text-slate-600 dark:text-slate-400', icon: Award, iconColor: 'text-slate-400' },
  2: { bg: 'bg-orange-50 dark:bg-orange-950/20', border: 'border-orange-300 dark:border-orange-700', text: 'text-orange-700 dark:text-orange-400', icon: Award, iconColor: 'text-orange-600' },
}

const STAT_CARD_THEMES = [
  { border: 'border-l-teal-500', gradient: 'from-teal-400 to-teal-600', iconGradient: 'from-teal-100 to-cyan-100 dark:from-teal-950/40 dark:to-cyan-950/40', textColor: 'text-teal-700 dark:text-teal-400', sparkData: [3, 5, 4, 8, 7, 10, 12], sparkColor: '#14b8a6' },
  { border: 'border-l-emerald-500', gradient: 'from-emerald-400 to-emerald-600', iconGradient: 'from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40', textColor: 'text-emerald-700 dark:text-emerald-400', sparkData: [50, 80, 60, 120, 90, 150, 180], sparkColor: '#10b981' },
  { border: 'border-l-purple-500', gradient: 'from-purple-400 to-violet-600', iconGradient: 'from-purple-100 to-violet-100 dark:from-purple-950/40 dark:to-violet-950/40', textColor: 'text-purple-700 dark:text-purple-400', sparkData: [2, 3, 4, 3, 5, 4, 6], sparkColor: '#8b5cf6' },
  { border: 'border-l-amber-500', gradient: 'from-amber-400 to-amber-600', iconGradient: 'from-amber-100 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/40', textColor: 'text-amber-700 dark:text-amber-400', sparkData: [4, 4.2, 4.5, 4.3, 4.6, 4.4, 4.7], sparkColor: '#f59e0b' },
  { border: 'border-l-cyan-500', gradient: 'from-cyan-400 to-cyan-600', iconGradient: 'from-cyan-100 to-teal-100 dark:from-cyan-950/40 dark:to-teal-950/40', textColor: 'text-cyan-700 dark:text-cyan-400', sparkData: [30, 35, 40, 38, 45, 42, 50], sparkColor: '#06b6d4' },
  { border: 'border-l-rose-500', gradient: 'from-rose-400 to-rose-600', iconGradient: 'from-rose-100 to-pink-100 dark:from-rose-950/40 dark:to-pink-950/40', textColor: 'text-rose-700 dark:text-rose-400', sparkData: [60, 55, 70, 65, 75, 72, 80], sparkColor: '#f43f5e' },
]

const PERIOD_OPTIONS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y', label: '1 Year' },
  { value: 'all', label: 'All Time' },
]

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type SortField = 'courseTitle' | 'enrollmentCount' | 'revenue' | 'rating' | 'completionRate' | 'status'
type SortDir = 'asc' | 'desc'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUSD(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
  return `$${value.toLocaleString()}`
}

function formatUSDShort(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return `${value}`
}

function getActivityType(action: string): string {
  const lower = action.toLowerCase()
  if (lower.includes('enroll')) return 'enrollment'
  if (lower.includes('review') || lower.includes('rating')) return 'review'
  if (lower.includes('question') || lower.includes('quiz') || lower.includes('submitted')) return 'question'
  if (lower.includes('complet') || lower.includes('finished')) return 'completion'
  if (lower.includes('earn') || lower.includes('revenue') || lower.includes('paid')) return 'earning'
  return 'activity'
}

function getInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return '??'
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??'
}

function getHeatmapColor(value: number, max: number): string {
  if (value === 0) return 'bg-muted/30'
  const intensity = Math.min(value / Math.max(max, 1), 1)
  if (intensity < 0.25) return 'bg-emerald-200 dark:bg-emerald-900/40'
  if (intensity < 0.5) return 'bg-emerald-400 dark:bg-emerald-700/60'
  if (intensity < 0.75) return 'bg-emerald-600 dark:bg-emerald-500/70'
  return 'bg-emerald-800 dark:bg-emerald-400/80'
}

// ─── InView Hook & CountUp Component ─────────────────────────────────────────

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

function CountUp({ end, duration = 1200, suffix = '', prefix = '' }: { end: number; duration?: number; suffix?: string; prefix?: string }) {
  const { ref, inView } = useInView(0.2)
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    const startTime = performance.now()
    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setValue(Math.round(end * eased))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, end, duration])

  return <span ref={ref}>{prefix}{value.toLocaleString()}{suffix}</span>
}

// ─── Mini Sparkline Component ────────────────────────────────────────────────

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1)
  const width = 60
  const height = 20
  const step = width / (data.length - 1 || 1)

  const points = data.map((v, i) => `${i * step},${height - (v / max) * (height - 2) - 1}`).join(' ')

  return (
    <svg width={width} height={height} className="opacity-50 group-hover:opacity-80 transition-opacity">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  )
}

// ─── Custom Chart Tooltip ─────────────────────────────────────────────────────

function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-xl bg-card p-3 shadow-lg border border-border/50 text-[13px]">
      <p className="font-semibold mb-1.5 text-muted-foreground">Day {label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.dataKey.replace(/_/g, ' ')}:</span>
          <span className="font-semibold text-foreground ml-auto">${entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6 pb-4">
      <div className="rounded-2xl bg-card p-6 space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-card p-5 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-xl" />
            </div>
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-card p-5 space-y-3">
          <Skeleton className="h-6 w-36" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="size-8 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-card p-5 space-y-3">
          <Skeleton className="h-6 w-36" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="size-8 rounded-lg" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl bg-card p-5 space-y-4">
        <Skeleton className="h-6 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-3">
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}


// ─── Comparison Banner ────────────────────────────────────────────────────────

function ComparisonBanner({ comparisonData }: { comparisonData: ComparisonData }) {
  if (!comparisonData) return null
  const diffs = comparisonData.differences
  const items: { label: string; instructor: number | string; platform: number | string; diff: number; format: 'pct' | 'currency' | 'number' }[] = [
    { label: 'Avg Rating', instructor: comparisonData.instructor.avgRating, platform: comparisonData.platform.avgRating, diff: diffs.rating, format: 'number' },
    { label: 'Completion Rate', instructor: `${comparisonData.instructor.completionRate}%`, platform: `${comparisonData.platform.avgCompletionRate}%`, diff: diffs.completionRate, format: 'pct' },
    { label: 'Quiz Pass Rate', instructor: `${comparisonData.instructor.avgQuizPassRate}%`, platform: `${comparisonData.platform.avgQuizPassRate}%`, diff: diffs.quizPassRate, format: 'pct' },
  ].filter(item => item.diff !== 0)

  if (items.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.15 }}
      className="rounded-2xl bg-card border border-emerald-200 dark:border-emerald-800/50 p-4 sm:p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40">
          <BarChart3 className="size-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-[15px] font-semibold">You vs Platform Average</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {items.map((item) => {
          const isAbove = item.diff > 0
          return (
            <div key={item.label} className="rounded-xl bg-accent/30 p-3 flex items-center gap-3">
              <div className={`flex size-9 items-center justify-center rounded-full shrink-0 ${isAbove ? 'bg-emerald-100 dark:bg-emerald-950/40' : 'bg-rose-100 dark:bg-rose-950/40'}`}>
                {isAbove ? (
                  <ArrowUpRight className="size-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ArrowDownRight className="size-4 text-rose-600 dark:text-rose-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-muted-foreground">{item.label}</p>
                <p className="text-[14px] font-bold">
                  {item.instructor}{' '}
                  <span className={`text-[12px] font-semibold ${isAbove ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    ({isAbove ? '+' : ''}{item.format === 'pct' ? `${item.diff}%` : item.format === 'currency' ? formatUSD(item.diff) : item.diff})
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground">Platform avg: {item.platform}</p>
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── Financial Summary Card ───────────────────────────────────────────────────

function FinancialSummaryCard({ financial }: { financial: FinancialSummary }) {
  const { setCurrentView } = useAppStore()
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...springTransition, delay: 0.2 }}
      className="rounded-2xl bg-card p-4 sm:p-5 cursor-pointer hover:ring-2 hover:ring-emerald-300 dark:hover:ring-emerald-700 transition-all"
      onClick={() => setCurrentView('instructor-revenue')}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40">
          <DollarSign className="size-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h3 className="text-[15px] font-semibold">Financial Summary</h3>
          {financial.hasCommissionOverride && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 mt-0.5 border-amber-400 text-amber-600">
              Custom Rate
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Revenue', value: formatUSD(financial.totalRevenue), color: 'text-foreground' },
          { label: 'Your Earnings', value: formatUSD(financial.instructorEarnings), color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Available for Payout', value: formatUSD(financial.availableForPayout), color: 'text-teal-600 dark:text-teal-400' },
          { label: 'Platform Fee', value: `${formatUSD(financial.platformFee)} (${financial.commissionRate}%)`, color: 'text-muted-foreground' },
          { label: 'Pending Clearance', value: formatUSD(financial.pendingPayouts), color: 'text-amber-600 dark:text-amber-400' },
          { label: 'Completed Payouts', value: formatUSD(financial.completedPayouts), color: 'text-muted-foreground' },
        ].map(item => (
          <div key={item.label} className="rounded-xl bg-accent/30 p-3">
            <p className="text-[11px] text-muted-foreground font-medium">{item.label}</p>
            <p className={`text-[15px] font-bold mt-0.5 ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Payout rate bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
          <span>Your payout rate: {financial.payoutRate}%</span>
          <span>Platform fee: {financial.commissionRate}%</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden flex bg-muted">
          <div className="bg-gradient-to-r from-emerald-400 to-teal-500 rounded-l-full transition-all" style={{ width: `${financial.payoutRate}%` }} />
          <div className="bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 rounded-r-full transition-all" style={{ width: `${financial.commissionRate}%` }} />
        </div>
      </div>
    </motion.div>
  )
}

// ─── Engagement Heatmap ───────────────────────────────────────────────────────

function EngagementHeatmap({ heatmapData }: { heatmapData: { grid: number[][]; days: string[]; hours: string[] } }) {
  const grid = heatmapData.grid
  const maxVal = Math.max(...grid.flat(), 1)

  // Find peak hours
  const hourTotals = Array.from({ length: 24 }, (_, h) =>
    grid.reduce((sum, day) => sum + day[h], 0)
  )
  const peakHourIndices = [...hourTotals]
    .map((v, i) => ({ v, i }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 3)
    .filter(h => h.v > 0)
    .map(h => h.i)

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="min-w-[600px]">
          {/* Hour headers */}
          <div className="flex items-center gap-0.5 mb-1">
            <div className="w-8 shrink-0" />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="flex-1 text-center">
                <span className="text-[9px] text-muted-foreground">{h % 3 === 0 ? `${h}` : ''}</span>
              </div>
            ))}
          </div>
          {/* Grid rows */}
          {grid.map((dayRow, dayIdx) => (
            <div key={dayIdx} className="flex items-center gap-0.5 mb-0.5">
              <div className="w-8 shrink-0">
                <span className="text-[10px] font-medium text-muted-foreground">{DAY_SHORT[dayIdx]}</span>
              </div>
              {dayRow.map((val, hourIdx) => (
                <TooltipProvider key={hourIdx}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`flex-1 h-5 rounded-[3px] transition-colors ${getHeatmapColor(val, maxVal)}`}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-[11px]">
                      <p>{DAY_SHORT[dayIdx]} {hourIdx}:00-{hourIdx + 1}:00</p>
                      <p className="font-semibold">{val} activities</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          ))}
        </div>
      </div>
      {/* Peak hours */}
      {peakHourIndices.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-muted-foreground font-medium">Peak hours:</span>
          {peakHourIndices.map(h => (
            <Badge key={h} variant="secondary" className="text-[10px] h-5 gap-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
              <Flame className="size-2.5" /> {h}:00 - {h + 1}:00
            </Badge>
          ))}
        </div>
      )}
      {/* Legend */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">Less</span>
        {['bg-muted/30', 'bg-emerald-200 dark:bg-emerald-900/40', 'bg-emerald-400 dark:bg-emerald-700/60', 'bg-emerald-600 dark:bg-emerald-500/70', 'bg-emerald-800 dark:bg-emerald-400/80'].map((cls, i) => (
          <div key={i} className={`size-3 rounded-[2px] ${cls}`} />
        ))}
        <span className="text-[10px] text-muted-foreground">More</span>
      </div>
    </div>
  )
}

// ─── Performance Distribution Bar ─────────────────────────────────────────────

function PerformanceDistributionChart({
  data,
  activeFilter,
  onFilterChange,
}: {
  data: InstructorDashboardData['studentPerformanceDistribution']
  activeFilter: string | null
  onFilterChange: (key: string | null) => void
}) {
  const total = data.excellent + data.good + data.average + data.needsImprovement
  if (total === 0) return null

  const segments = [
    { key: 'excellent', value: data.excellent, pct: ((data.excellent / total) * 100).toFixed(1) },
    { key: 'good', value: data.good, pct: ((data.good / total) * 100).toFixed(1) },
    { key: 'average', value: data.average, pct: ((data.average / total) * 100).toFixed(1) },
    { key: 'needsImprovement', value: data.needsImprovement, pct: ((data.needsImprovement / total) * 100).toFixed(1) },
  ]

  return (
    <div className="space-y-4">
      <div className="h-10 rounded-xl overflow-hidden flex">
        {segments.map(seg => (
          <div
            key={seg.key}
            className={`${PERFORMANCE_BG[seg.key]} relative group/seg transition-all duration-300 hover:brightness-110 cursor-pointer ${activeFilter === seg.key ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card' : ''}`}
            style={{ width: `${seg.pct}%` }}
            onClick={() => onFilterChange(activeFilter === seg.key ? null : seg.key)}
          >
            {parseFloat(seg.pct) > 12 && (
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white drop-shadow-sm">
                {seg.pct}%
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {segments.map(seg => (
          <div
            key={seg.key}
            className={`flex items-center gap-2 rounded-xl p-2.5 cursor-pointer transition-all ${activeFilter === seg.key ? 'bg-accent ring-1 ring-foreground/20' : 'bg-accent/30 hover:bg-accent/50'}`}
            onClick={() => onFilterChange(activeFilter === seg.key ? null : seg.key)}
          >
            <div className={`size-3 rounded-full shrink-0 ${PERFORMANCE_BG[seg.key]}`} />
            <div className="min-w-0">
              <p className="text-[12px] font-semibold truncate">{PERFORMANCE_LABELS[seg.key]?.split(' (')[0]}</p>
              <p className="text-[11px] text-muted-foreground">{seg.value} students · {seg.pct}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Content Pipeline Widget ──────────────────────────────────────────────────

function ContentPipelineWidget({ pipeline, onNewCourse }: { pipeline: InstructorDashboardData['contentPipeline']; onNewCourse: () => void }) {
  const steps = [
    { key: 'draft', label: 'Draft', count: pipeline.draft, icon: FileEdit, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/40', ring: 'ring-amber-400', fillGrad: 'from-amber-400 to-amber-500' },
    { key: 'review', label: 'In Review', count: pipeline.review, icon: Eye, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-950/40', ring: 'ring-teal-400', fillGrad: 'from-teal-400 to-teal-500' },
    { key: 'published', label: 'Published', count: pipeline.published, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950/40', ring: 'ring-emerald-400', fillGrad: 'from-emerald-400 to-emerald-500' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, idx) => {
          const StepIcon = step.icon
          return (
            <div key={step.key} className="flex items-center gap-2 flex-1">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...springTransition, delay: 0.1 + idx * 0.1 }}
                className="flex flex-col items-center gap-2 flex-1"
              >
                <div className={`relative flex size-14 items-center justify-center rounded-full ring-2 ${step.ring} ${step.bg}`}>
                  <StepIcon className={`size-6 ${step.color}`} />
                  <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-gradient-to-br ${step.fillGrad} text-[10px] font-bold text-white shadow-sm">
                    {step.count}
                  </span>
                </div>
                <span className="text-[12px] font-semibold text-center">{step.label}</span>
              </motion.div>
              {idx < steps.length - 1 && (
                <div className="flex-shrink-0 w-8 sm:w-12 h-0.5 bg-gradient-to-r from-muted-foreground/20 to-muted-foreground/10 relative -mt-5">
                  <ChevronRight className="size-3 text-muted-foreground/40 absolute -right-1 -top-1.5" />
                </div>
              )}
            </div>
          )
        })}
      </div>
      <Button
        className="w-full gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-shadow"
        onClick={onNewCourse}
      >
        <Plus className="size-4" />
        Create New Course
      </Button>
    </div>
  )
}

// ─── Top Students Section ─────────────────────────────────────────────────────

function TopStudentsSection({ students }: { students: InstructorDashboardData['topStudents'] }) {
  const { setCurrentView, setSelectedStudentId } = useAppStore()
  if (students.length === 0) return null

  const avatarGradients = [
    'from-emerald-400 to-teal-500',
    'from-teal-400 to-cyan-500',
    'from-cyan-400 to-emerald-500',
    'from-amber-400 to-orange-500',
    'from-purple-400 to-violet-500',
  ]

  return (
    <div className="space-y-2">
      {students.map((student, idx) => {
        const rank = RANK_STYLES[idx]
        const RankIcon = rank?.icon || Award
        const isTop3 = idx < 3

        return (
          <motion.div
            key={student.id || student.name}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...springTransition, delay: 0.1 + idx * 0.06 }}
            className={`flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-accent/40 cursor-pointer ${isTop3 ? rank!.bg + ' ' + 'border ' + rank!.border : 'bg-accent/20'}`}
            onClick={() => {
              if (student.id) {
                setSelectedStudentId(student.id)
                setCurrentView('instructor-student-detail')
              } else {
                setCurrentView('instructor-students')
              }
            }}
          >
            <div className="flex items-center justify-center w-7 shrink-0">
              {isTop3 ? (
                <RankIcon className={`size-5 ${rank!.iconColor}`} />
              ) : (
                <span className="text-[13px] font-bold text-muted-foreground">{idx + 1}</span>
              )}
            </div>
            <div className={`flex size-9 items-center justify-center rounded-full bg-gradient-to-br ${avatarGradients[idx % avatarGradients.length]} shrink-0`}>
              <span className="text-[12px] font-bold text-white">{getInitials(student.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate">{student.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  <Zap className="size-2.5" /> {student.xp.toLocaleString()} XP
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {student.coursesCompleted} course{student.coursesCompleted !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-[14px] font-bold ${student.avgScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' : student.avgScore >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {student.avgScore.toFixed(0)}%
              </p>
              <p className="text-[10px] text-muted-foreground">avg score</p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ─── Quick Actions Panel ──────────────────────────────────────────────────────

function QuickActionsPanel({
  instructorId,
  draftCourses,
  onRefresh,
}: {
  instructorId: string
  draftCourses: number
  onRefresh: () => void
}) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleAction = async (action: string, payload: Record<string, unknown>) => {
    setLoading(action)
    try {
      const res = await fetch('/api/instructor/quick-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorId, action, payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Action failed')
      toast.success(data.message || 'Action completed successfully')
      onRefresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setLoading(null)
    }
  }

  const actions = [
    {
      key: 'publish',
      label: 'Publish Draft',
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-950/40',
      disabled: draftCourses === 0,
      onClick: () => handleAction('publish-course', { courseId: 'latest' }),
    },
    {
      key: 'announce',
      label: 'Send Announcement',
      icon: Megaphone,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-100 dark:bg-teal-950/40',
      disabled: false,
      onClick: () => handleAction('send-announcement', { courseId: 'all', title: 'Update', content: 'New content available!' }),
    },
    {
      key: 'message',
      label: 'Message Student',
      icon: MessageSquare,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-950/40',
      disabled: false,
      onClick: () => handleAction('message-student', { studentId: 'recent', message: 'Keep up the great work!' }),
    },
    {
      key: 'grade',
      label: 'Grade Submission',
      icon: PenTool,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-950/40',
      disabled: false,
      onClick: () => handleAction('grade-submission', { submissionId: 'latest', score: 85, feedback: 'Good work!' }),
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map(action => {
        const ActionIcon = action.icon
        return (
          <Button
            key={action.key}
            variant="outline"
            size="sm"
            disabled={action.disabled || loading === action.key}
            onClick={action.onClick}
            className="h-auto py-2.5 px-3 justify-start gap-2 rounded-xl text-[12px] font-medium hover:bg-accent/50"
          >
            {loading === action.key ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <div className={`flex size-6 items-center justify-center rounded-md ${action.bg}`}>
                <ActionIcon className={`size-3 ${action.color}`} />
              </div>
            )}
            {action.label}
          </Button>
        )
      })}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function InstructorDashboard() {
  const { currentUser, setCurrentView } = useAppStore()
  const setSelectedCourseId = useAppStore((s) => s.setSelectedCourseId)
  const setSelectedStudentId = useAppStore((s) => s.setSelectedStudentId)
  const [data, setData] = useState<InstructorDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refetching, setRefetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('30d')
  const [sortField, setSortField] = useState<SortField>('revenue')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [performanceFilter, setPerformanceFilter] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0)
  const [exporting, setExporting] = useState(false)

  // Grading dialog state
  const [gradeDialog, setGradeDialog] = useState<{ open: boolean; submissionId: string; studentName: string; assignmentTitle: string; maxScore: number }>({
    open: false, submissionId: '', studentName: '', assignmentTitle: '', maxScore: 100,
  })
  const [gradeScore, setGradeScore] = useState('')
  const [gradeFeedback, setGradeFeedback] = useState('')
  const [grading, setGrading] = useState(false)

  // Reply dialog state
  const [replyDialog, setReplyDialog] = useState<{ open: boolean; questionId: string; questionText: string }>({
    open: false, questionId: '', questionText: '',
  })
  const [replyContent, setReplyContent] = useState('')
  const [replying, setReplying] = useState(false)

  // Announcement dialog state
  const [announceDialog, setAnnounceDialog] = useState(false)
  const [announceTitle, setAnnounceTitle] = useState('')
  const [announceContent, setAnnounceContent] = useState('')
  const [announcing, setAnnouncing] = useState(false)

  // ─── Fetch data ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async (showRefetchLoader = false) => {
    if (!currentUser) return
    if (showRefetchLoader) {
      setRefetching(true)
    } else {
      setLoading(true)
    }
    setError(null)
    try {
      const res = await fetch(`/api/instructor/dashboard?instructorId=${currentUser.id}&period=${period}`)
      if (!res.ok) throw new Error('Failed to fetch dashboard data')
      const json = await res.json()
      setData(json as InstructorDashboardData)
      setLastUpdated(new Date())
      setSecondsSinceUpdate(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
      setRefetching(false)
    }
  }, [currentUser, period])

  useEffect(() => {
    fetchData(false)
  }, [fetchData])

  // ─── Auto-refresh every 60 seconds ──────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsSinceUpdate(prev => prev + 1)
    }, 1000)

    const refreshInterval = setInterval(() => {
      if (currentUser) {
        fetchData(true)
      }
    }, 60000)

    return () => {
      clearInterval(interval)
      clearInterval(refreshInterval)
    }
  }, [currentUser, fetchData])

  // ─── Period change handler ──────────────────────────────────────────────
  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod)
  }

  // ─── CSV Export ─────────────────────────────────────────────────────────
  const handleExportCSV = async (type: 'revenue' | 'students') => {
    if (!currentUser) return
    setExporting(true)
    try {
      if (type === 'revenue') {
        const res = await fetch(`/api/instructor/revenue/export?instructorId=${currentUser.id}&format=csv&period=${period}`)
        if (!res.ok) throw new Error('Export failed')
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `revenue-export-${period}-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('Revenue CSV exported successfully')
      } else {
        // Student data export - generate from coursePerformance
        if (!data) return
        const headers = ['Course', 'Students', 'Revenue', 'Rating', 'Completion Rate', 'Quiz Pass Rate', 'Status']
        const rows = data.coursePerformance.map(c =>
          [c.courseTitle, c.enrollmentCount, c.revenue, c.rating, `${c.completionRate}%`, `${c.quizStats.passRate}%`, c.status].join(',')
        )
        const csv = [headers.join(','), ...rows].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `students-export-${period}-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('Student data CSV exported successfully')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  // ─── Quick action handlers ──────────────────────────────────────────────
  const handleGradeSubmit = async () => {
    if (!gradeDialog.submissionId || !gradeScore) return
    setGrading(true)
    try {
      const res = await fetch('/api/instructor/quick-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId: currentUser!.id,
          action: 'grade-submission',
          payload: { submissionId: gradeDialog.submissionId, score: parseInt(gradeScore), feedback: gradeFeedback },
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Grading failed')
      toast.success(result.message || 'Submission graded successfully')
      setGradeDialog({ open: false, submissionId: '', studentName: '', assignmentTitle: '', maxScore: 100 })
      setGradeScore('')
      setGradeFeedback('')
      fetchData(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Grading failed')
    } finally {
      setGrading(false)
    }
  }

  const handleReplySubmit = async () => {
    if (!replyDialog.questionId || !replyContent) return
    setReplying(true)
    try {
      const res = await fetch('/api/instructor/quick-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId: currentUser!.id,
          action: 'reply-qa',
          payload: { questionId: replyDialog.questionId, content: replyContent },
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Reply failed')
      toast.success(result.message || 'Reply posted successfully')
      setReplyDialog({ open: false, questionId: '', questionText: '' })
      setReplyContent('')
      fetchData(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reply failed')
    } finally {
      setReplying(false)
    }
  }

  const handleAnnounceSubmit = async () => {
    if (!announceTitle || !announceContent) return
    setAnnouncing(true)
    try {
      const res = await fetch('/api/instructor/quick-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId: currentUser!.id,
          action: 'send-announcement',
          payload: { courseId: 'all', title: announceTitle, content: announceContent },
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Announcement failed')
      toast.success(result.message || 'Announcement sent successfully')
      setAnnounceDialog(false)
      setAnnounceTitle('')
      setAnnounceContent('')
      fetchData(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Announcement failed')
    } finally {
      setAnnouncing(false)
    }
  }

  const handleCourseAction = async (courseId: string, action: 'publish' | 'archive' | 'duplicate') => {
    if (!currentUser) return
    try {
      if (action === 'duplicate') {
        const res = await fetch(`/api/instructor/courses/${courseId}/duplicate`, { method: 'POST' })
        const result = await res.json()
        if (!res.ok) throw new Error(result.error || 'Duplicate failed')
        toast.success('Course duplicated successfully')
      } else {
        const res = await fetch('/api/instructor/courses/bulk', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instructorId: currentUser.id, courseIds: [courseId], action }),
        })
        const result = await res.json()
        if (!res.ok) throw new Error(result.error || 'Action failed')
        toast.success(result.message || `Course ${action}d successfully`)
      }
      fetchData(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    }
  }

  // ─── Derived data ──────────────────────────────────────────────────────

  const courseSlugs = useMemo(() => {
    if (!data?.revenueByDay || data.revenueByDay.length === 0) return []
    const sample = data.revenueByDay[0]
    return Object.keys(sample).filter(k => k !== 'day')
  }, [data?.revenueByDay])

  const sortedCourses = useMemo(() => {
    if (!data?.coursePerformance) return []
    const sorted = [...data.coursePerformance]
    sorted.sort((a, b) => {
      let aVal: number | string = 0
      let bVal: number | string = 0
      switch (sortField) {
        case 'courseTitle': aVal = a.courseTitle; bVal = b.courseTitle; break
        case 'enrollmentCount': aVal = a.enrollmentCount; bVal = b.enrollmentCount; break
        case 'revenue': aVal = a.revenue; bVal = b.revenue; break
        case 'rating': aVal = a.rating; bVal = b.rating; break
        case 'completionRate': aVal = a.completionRate; bVal = b.completionRate; break
        case 'status': aVal = a.status; bVal = b.status; break
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })
    return sorted
  }, [data?.coursePerformance, sortField, sortDir])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronRight className="size-3 text-muted-foreground/40" />
    return sortDir === 'asc' ? <ChevronUp className="size-3 text-emerald-500" /> : <ChevronDown className="size-3 text-emerald-500" />
  }

  // ─── Loading State ──────────────────────────────────────────────────────
  if (loading) return <DashboardSkeleton />

  // ─── Error State ────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="size-8 text-rose-500" />
        <p className="text-[15px] text-muted-foreground">{error || 'Failed to load dashboard data'}</p>
        <Button variant="outline" size="sm" onClick={() => fetchData(false)} className="gap-2">
          <Loader2 className="size-3.5 animate-spin" />
          Retry
        </Button>
      </div>
    )
  }

  const { welcomeData, stats, revenueByDay, coursePerformance, recentStudentActivity, actionRequired, tip } = data
  const financial = data.financialSummary
  const comparisonData = data.comparisonData
  const heatmapData = data.heatmapData
  const submissionStats = data.submissionStats

  const monthRevenue = stats.monthRevenue ?? stats.totalRevenue
  const studentsMoMChange = stats.studentsMoMChange ?? 0
  const revenueMoMChange = stats.revenueMoMChange ?? 0
  const activeCourses = stats.activeCourses ?? stats.totalCourses - (stats.draftCourses ?? 0)
  const draftCourses = stats.draftCourses ?? 0
  const totalReviews = stats.totalReviews ?? 0

  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never'
    if (secondsSinceUpdate < 5) return 'Just now'
    if (secondsSinceUpdate < 60) return `${secondsSinceUpdate}s ago`
    return `${Math.floor(secondsSinceUpdate / 60)}m ago`
  }

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-4">

      {/* ═══════════════════════════════════════════════════════════════════
          1. GRADIENT WELCOME BANNER WITH PERIOD SELECTOR + LAST UPDATED
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
        <div className="absolute -top-10 -right-10 size-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-8 size-32 rounded-full bg-white/5" />
        <div className="absolute top-1/2 right-1/4 size-20 rounded-full bg-white/3" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <h1 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-white">
              {welcomeData.greeting} 👋
            </h1>
            <p className="text-[14px] sm:text-[15px] text-white/80 leading-relaxed">
              {welcomeData.subtitle ?? "Here's your overview for today."}
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-[11px] text-white/50 font-medium">
                {welcomeData.date} · Last login: {welcomeData.lastLogin ?? 'Recently'}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-white/50">
                <motion.div
                  animate={{ rotate: refetching ? 360 : 0 }}
                  transition={{ duration: 1, repeat: refetching ? Infinity : 0, ease: 'linear' }}
                >
                  <RefreshCw className="size-3" />
                </motion.div>
                <span>Last updated: {formatLastUpdated()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {/* Period Selector */}
            <Select value={period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[120px] h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0 text-[12px]">
                <CalendarDays className="size-3.5 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="gap-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border-0 shadow-lg shadow-black/10"
              size="sm"
              onClick={() => setCurrentView('course-creator')}
            >
              <Plus className="size-4" />
              New Course
            </Button>
          </div>
        </div>

        <div className="relative mt-4 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm">
            <Users className="size-3.5 text-emerald-200" />
            <span className="text-[12px] font-semibold text-white">{stats.totalStudents.toLocaleString()} students</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm">
            <Coins className="size-3.5 text-amber-300" />
            <span className="text-[12px] font-semibold text-white">{formatUSD(monthRevenue)}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm">
            <BookOpen className="size-3.5 text-emerald-200" />
            <span className="text-[12px] font-semibold text-white">{activeCourses} active courses</span>
          </div>
          {welcomeData.activeToday > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 backdrop-blur-sm">
              <Flame className="size-3.5 text-orange-300" />
              <span className="text-[12px] font-semibold text-white">{welcomeData.activeToday} active today</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. COMPARISON BANNER
          ═══════════════════════════════════════════════════════════════════ */}
      {comparisonData && <ComparisonBanner comparisonData={comparisonData} />}

      {/* ═══════════════════════════════════════════════════════════════════
          3. SIX STAT CARDS WITH REAL TRENDS
          ═══════════════════════════════════════════════════════════════════ */}
      <InstructorStatCardGrid columns={3}>
        <InstructorStatCard
          icon={Users}
          value={stats.totalStudents.toLocaleString()}
          label="Total Students"
          color="teal"
          trend={studentsMoMChange}
          trendLabel="MoM"
          index={0}
          sparkData={STAT_CARD_THEMES[0].sparkData}
          onClick={() => setCurrentView('instructor-students')}
        />
        <InstructorStatCard
          icon={TrendingUp}
          value={formatUSD(monthRevenue)}
          label="Monthly Revenue"
          color="emerald"
          trend={revenueMoMChange}
          trendLabel="MoM"
          index={1}
          sparkData={STAT_CARD_THEMES[1].sparkData}
          onClick={() => setCurrentView('instructor-revenue')}
        />
        <InstructorStatCard
          icon={BookOpen}
          value={`${activeCourses}`}
          label="Active Courses"
          color="violet"
          trendLabel={`${draftCourses} draft${draftCourses !== 1 ? 's' : ''}`}
          index={2}
          sparkData={STAT_CARD_THEMES[2].sparkData}
          onClick={() => setCurrentView('instructor-courses')}
        />
        <InstructorStatCard
          icon={Star}
          value={`${stats.avgRating} / 5`}
          label="Avg. Rating"
          color="amber"
          trendLabel={`${totalReviews.toLocaleString()} reviews`}
          index={3}
          sparkData={STAT_CARD_THEMES[3].sparkData}
          onClick={() => setCurrentView('instructor-analytics')}
        />
        <InstructorStatCard
          icon={Target}
          value={`${stats.completionRate}%`}
          label="Completion Rate"
          color="cyan"
          trendLabel={comparisonData ? `Platform: ${comparisonData.platform.avgCompletionRate}%` : undefined}
          index={4}
          sparkData={STAT_CARD_THEMES[4].sparkData}
          onClick={() => setCurrentView('instructor-analytics')}
        />
        <InstructorStatCard
          icon={GraduationCap}
          value={`${stats.avgQuizPassRate}%`}
          label="Quiz Pass Rate"
          color="rose"
          trendLabel={comparisonData ? `Platform: ${comparisonData.platform.avgQuizPassRate}%` : undefined}
          index={5}
          sparkData={STAT_CARD_THEMES[5].sparkData}
          onClick={() => setCurrentView('instructor-quizzes')}
        />
      </InstructorStatCardGrid>

      {/* ═══════════════════════════════════════════════════════════════════
          4. REVENUE CHART WITH PERIOD CONTROL + EXPORT
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.25 }}
        className="rounded-2xl bg-card p-4 sm:p-5"
      >
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h3 className="text-[18px] font-semibold">Revenue Overview</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">Per-course revenue breakdown</p>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={period} onValueChange={handlePeriodChange}>
              <TabsList className="h-8">
                <TabsTrigger value="7d" className="text-[11px] px-2.5 h-6">7D</TabsTrigger>
                <TabsTrigger value="30d" className="text-[11px] px-2.5 h-6">30D</TabsTrigger>
                <TabsTrigger value="90d" className="text-[11px] px-2.5 h-6">90D</TabsTrigger>
                <TabsTrigger value="1y" className="text-[11px] px-2.5 h-6">1Y</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-[12px] rounded-lg"
              disabled={exporting}
              onClick={() => handleExportCSV('revenue')}
            >
              {exporting ? <Loader2 className="size-3 animate-spin" /> : <Download className="size-3" />}
              Export
            </Button>
          </div>
        </div>

        {revenueByDay && revenueByDay.length > 0 && courseSlugs.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByDay} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  {courseSlugs.map((slug, idx) => (
                    <linearGradient key={`area-${slug}`} id={`areaGradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0.3} />
                      <stop offset="50%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0.1} />
                      <stop offset="95%" stopColor={CHART_COLORS[idx % CHART_COLORS.length]} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  ticks={[1, 5, 9, 13, 17, 21, 25, 29]}
                />
                <YAxis
                  tickFormatter={(v: number) => `$${formatUSDShort(v)}`}
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Legend
                  formatter={(value: string) => value.replace(/_/g, ' ')}
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                />
                {courseSlugs.map((slug, idx) => (
                  <Area
                    key={slug}
                    type="monotone"
                    dataKey={slug}
                    stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                    strokeWidth={2}
                    fill={`url(#areaGradient-${idx})`}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                    name={slug}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          data.enrollmentTrend && data.enrollmentTrend.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.enrollmentTrend} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fallbackAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                      <stop offset="50%" stopColor="#14b8a6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fallbackAreaGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="50%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="enrollments" stroke="#14b8a6" strokeWidth={2} fill="url(#fallbackAreaGrad)" name="Enrollments" />
                  <Area type="monotone" dataKey="cumulative" stroke="#10b981" strokeWidth={2} fill="url(#fallbackAreaGrad2)" name="Cumulative" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-muted-foreground text-[14px]">
              No revenue data available for this period
            </div>
          )
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          5. FINANCIAL SUMMARY + ENGAGEMENT HEATMAP (Two Columns)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Financial Summary */}
        {financial && <FinancialSummaryCard financial={financial} />}

        {/* Engagement Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.3 }}
          className="rounded-2xl bg-card p-4 sm:p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/40">
              <Activity className="size-4 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-[15px] font-semibold">Student Engagement</h3>
          </div>
          {heatmapData ? (
            <EngagementHeatmap heatmapData={heatmapData} />
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-[13px]">
              No engagement data available
            </div>
          )}
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          6. STUDENT PERFORMANCE DISTRIBUTION
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.35 }}
        className="rounded-2xl bg-card p-4 sm:p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950/40">
              <GraduationCap className="size-4 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="text-[15px] font-semibold">Student Performance Distribution</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-[11px] rounded-lg"
            disabled={exporting}
            onClick={() => handleExportCSV('students')}
          >
            <Download className="size-3" /> Export
          </Button>
        </div>
        <PerformanceDistributionChart
          data={data.studentPerformanceDistribution}
          activeFilter={performanceFilter}
          onFilterChange={setPerformanceFilter}
        />
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          7. ACTION CENTER + QUICK ACTIONS (Two Columns)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Action Center (Enhanced) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.4 }}
          className="rounded-2xl bg-card p-4 sm:p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950/40">
              <AlertCircle className="size-4 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-[15px] font-semibold">Action Center</h3>
            {submissionStats && submissionStats.pending > 0 && (
              <Badge
                className="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 text-[10px] h-5 cursor-pointer hover:bg-rose-200 dark:hover:bg-rose-950/60 transition-colors"
                onClick={() => setCurrentView('instructor-assignments')}
              >
                {submissionStats.pending} pending
              </Badge>
            )}
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {actionRequired && actionRequired.length > 0 ? (
              actionRequired.map((action, idx) => {
                const ActionIcon = ACTION_TYPE_CONFIG[action.type]?.icon || AlertCircle
                const actionColor = ACTION_TYPE_CONFIG[action.type]?.color || 'text-muted-foreground'
                const actionBg = ACTION_TYPE_CONFIG[action.type]?.bg || 'bg-muted/50'
                return (
                  <motion.div
                    key={`${action.type}-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...springTransition, delay: 0.1 + idx * 0.05 }}
                    className="flex items-center gap-3 rounded-xl p-3 hover:bg-accent/30 transition-colors cursor-pointer"
                    onClick={() => setCurrentView(action.actionView as 'instructor-courses')}
                  >
                    <div className={`flex size-9 items-center justify-center rounded-lg shrink-0 ${actionBg}`}>
                      <ActionIcon className={`size-4 ${actionColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium">{action.count} {action.text}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[11px] gap-1.5 rounded-lg shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        setCurrentView(action.actionView as any)
                      }}
                    >
                      {action.actionLabel}
                      <ChevronRight className="size-3" />
                    </Button>
                  </motion.div>
                )
              })
            ) : (
              <div className="flex flex-col items-center py-6 text-muted-foreground">
                <CheckCircle2 className="size-8 text-emerald-500 mb-2" />
                <p className="text-[13px] font-medium">All caught up!</p>
                <p className="text-[12px]">No pending actions</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions Panel */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.45 }}
          className="rounded-2xl bg-card p-4 sm:p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950/40">
              <Sparkles className="size-4 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-[15px] font-semibold">Quick Actions</h3>
          </div>

          <QuickActionsPanel
            instructorId={currentUser?.id || ''}
            draftCourses={draftCourses}
            onRefresh={() => fetchData(true)}
          />

          {/* Tip section */}
          {tip && (
            <div className="mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-[12px] text-emerald-700 dark:text-emerald-400">{tip}</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          8. COURSE PERFORMANCE TABLE (Sortable)
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.5 }}
        className="rounded-2xl bg-card p-4 sm:p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40">
              <BarChart3 className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-[15px] font-semibold">Course Performance</h3>
            <Badge variant="secondary" className="text-[10px] h-5">{coursePerformance.length} courses</Badge>
          </div>
        </div>

        {coursePerformance.length > 0 ? (
          <div className="overflow-x-auto -mx-1 px-1">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('courseTitle')}>
                    <div className="flex items-center gap-1">Course <SortIcon field="courseTitle" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('enrollmentCount')}>
                    <div className="flex items-center gap-1">Students <SortIcon field="enrollmentCount" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('revenue')}>
                    <div className="flex items-center gap-1">Revenue <SortIcon field="revenue" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('rating')}>
                    <div className="flex items-center gap-1">Rating <SortIcon field="rating" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('completionRate')}>
                    <div className="flex items-center gap-1">Completion <SortIcon field="completionRate" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">Status <SortIcon field="status" /></div>
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCourses.map(course => (
                  <TableRow
                    key={course.courseId}
                    className="cursor-pointer hover:bg-accent/30"
                    onClick={() => {
                      setSelectedCourseId(course.courseId)
                      setCurrentView('instructor-course-detail')
                    }}
                  >
                    <TableCell>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold truncate max-w-[180px]">{course.courseTitle}</p>
                        <p className="text-[11px] text-muted-foreground">{course.category} · {course.modulesCount} modules</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-[13px] font-medium">{course.enrollmentCount}</p>
                        {course.recentEnrollments > 0 && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400">+{course.recentEnrollments} this week</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-[13px] font-medium">{formatUSD(course.revenue)}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="size-3 text-amber-500 fill-amber-500" />
                        <span className="text-[13px] font-medium">{course.rating}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={course.completionRate} className="h-1.5 w-14" />
                        <span className="text-[12px] font-medium">{course.completionRate}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={course.status === 'published' ? 'default' : 'secondary'}
                        className={`text-[10px] h-5 ${course.status === 'published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'}`}
                      >
                        {course.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="size-7">
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          {course.status === 'draft' && (
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCourseAction(course.courseId, 'publish') }}>
                              <CheckCircle2 className="size-3.5 mr-2 text-emerald-500" /> Publish
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCourseAction(course.courseId, 'archive') }}>
                            <Archive className="size-3.5 mr-2" /> Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCourseAction(course.courseId, 'duplicate') }}>
                            <Copy className="size-3.5 mr-2" /> Duplicate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center py-8 text-muted-foreground">
            <BookOpen className="size-8 mb-2" />
            <p className="text-[13px]">No courses yet</p>
          </div>
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          9. RECENT ACTIVITY + TOP STUDENTS + CONTENT PIPELINE (Three Columns)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Student Activity */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.55 }}
          className="rounded-2xl bg-card p-4 sm:p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/40">
              <Activity className="size-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-[15px] font-semibold">Recent Activity</h3>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {recentStudentActivity.length > 0 ? recentStudentActivity.map((item, idx) => {
              const type = item.type || getActivityType(item.action)
              const config = ACTIVITY_TYPE_CONFIG[type] || ACTIVITY_TYPE_CONFIG.activity
              const ItemIcon = config.icon
              return (
                <motion.div
                  key={`${item.studentName}-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...springTransition, delay: 0.05 + idx * 0.04 }}
                  className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-accent/30 transition-colors cursor-pointer"
                  onClick={() => {
                    if (type === 'enrollment') {
                      setCurrentView('instructor-students')
                    } else if (type === 'completion' || type === 'review') {
                      setCurrentView('instructor-courses')
                    } else if (type === 'question') {
                      setCurrentView('instructor-qa')
                    } else {
                      setCurrentView('instructor-analytics')
                    }
                  }}
                >
                  <div className={`flex size-8 items-center justify-center rounded-lg shrink-0 ${config.bg}`}>
                    <ItemIcon className={`size-3.5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] truncate">
                      <span className="font-semibold">{item.studentName}</span>{' '}
                      <span className="text-muted-foreground">{item.action}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{item.course}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">{item.time}</span>
                </motion.div>
              )
            }) : (
              <div className="py-6 text-center text-muted-foreground text-[12px]">No recent activity</div>
            )}
          </div>
        </motion.div>

        {/* Top Students */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.6 }}
          className="rounded-2xl bg-card p-4 sm:p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40">
              <Trophy className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-[15px] font-semibold">Top Students</h3>
          </div>
          <TopStudentsSection students={data.topStudents} />
        </motion.div>

        {/* Content Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.65 }}
          className="rounded-2xl bg-card p-4 sm:p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="flex size-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/40">
              <FileEdit className="size-4 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-[15px] font-semibold">Content Pipeline</h3>
          </div>
          <ContentPipelineWidget
            pipeline={data.contentPipeline}
            onNewCourse={() => setCurrentView('course-creator')}
          />
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          DIALOGS
          ═══════════════════════════════════════════════════════════════════ */}

      {/* Grade Submission Dialog */}
      <Dialog open={gradeDialog.open} onOpenChange={(open) => setGradeDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="size-4 text-amber-500" />
              Grade Submission
            </DialogTitle>
            <DialogDescription>
              Grade {gradeDialog.studentName}&apos;s submission for {gradeDialog.assignmentTitle}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-[13px] font-medium">Score (out of {gradeDialog.maxScore})</label>
              <Input
                type="number"
                min={0}
                max={gradeDialog.maxScore}
                value={gradeScore}
                onChange={(e) => setGradeScore(e.target.value)}
                placeholder={`0 - ${gradeDialog.maxScore}`}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-[13px] font-medium">Feedback</label>
              <Textarea
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                placeholder="Provide feedback for the student..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGradeDialog(prev => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button
              className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
              disabled={grading || !gradeScore}
              onClick={handleGradeSubmit}
            >
              {grading ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
              Submit Grade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Q&A Dialog */}
      <Dialog open={replyDialog.open} onOpenChange={(open) => setReplyDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="size-4 text-blue-500" />
              Reply to Question
            </DialogTitle>
            <DialogDescription>{replyDialog.questionText}</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Type your answer..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialog(prev => ({ ...prev, open: false }))}>
              Cancel
            </Button>
            <Button
              className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
              disabled={replying || !replyContent}
              onClick={handleReplySubmit}
            >
              {replying ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Post Reply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Announcement Dialog */}
      <Dialog open={announceDialog} onOpenChange={setAnnounceDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="size-4 text-teal-500" />
              Send Announcement
            </DialogTitle>
            <DialogDescription>Send an announcement to all your enrolled students</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-[13px] font-medium">Title</label>
              <Input
                value={announceTitle}
                onChange={(e) => setAnnounceTitle(e.target.value)}
                placeholder="Announcement title..."
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-[13px] font-medium">Message</label>
              <Textarea
                value={announceContent}
                onChange={(e) => setAnnounceContent(e.target.value)}
                placeholder="Write your announcement..."
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAnnounceDialog(false)}>
              Cancel
            </Button>
            <Button
              className="gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
              disabled={announcing || !announceTitle || !announceContent}
              onClick={handleAnnounceSubmit}
            >
              {announcing ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
