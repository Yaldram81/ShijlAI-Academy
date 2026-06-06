'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Cpu, Users, BookOpen, Activity, TrendingUp, TrendingDown, Minus,
  AlertTriangle, ShieldCheck, AlertCircle, Info, Sparkles, Brain,
  Loader2, RefreshCw, ChevronDown, ChevronUp, Star, Award,
  GraduationCap, BarChart3, Zap, Eye, ArrowUpRight, ArrowDownRight,
  Clock, MessageSquareWarning, BookMarked, UserCheck, Flame
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

// ─── Type Definitions ───────────────────────────────────────────

interface PlatformHealth {
  totalStudents: number
  totalCourses: number
  totalEnrollments: number
  dailyActiveUsers: number
  weeklyActiveUsers: number
  monthlyActiveUsers: number
  avgSessionDuration: number
  completionRate: number
  retentionRate: number
  trends: {
    dauTrend: number
    wauTrend: number
    enrollmentTrend: number
    completionTrend: number
  }
}

interface CourseEngagement {
  courseId: string
  courseTitle: string
  enrollmentCount: number
  engagementScore: number
  loginScore: number
  activityScore: number
  quizScore: number
  aiScore: number
  communityScore: number
}

interface CourseIntelligenceItem {
  courseId: string
  courseTitle: string
  instructorName: string
  healthScore: number
  status: 'healthy' | 'at_risk' | 'critical'
  enrollmentGrowth: number
  completionRate: number
  avgRating: number
  engagementRate: number
  assessmentScore: number
  enrollmentCount: number
}

interface InstructorIntelligenceItem {
  instructorId: string
  instructorName: string
  courseCount: number
  totalStudents: number
  effectivenessScore: number
  completionRate: number
  avgRating: number
  studentSuccessRate: number
  engagementScore: number
  warnings: string[]
}

interface AlertItem {
  id: string
  type: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  relatedEntity: string
  relatedEntityType: 'course' | 'instructor' | 'student' | 'platform'
  timestamp: string
  isRead: boolean
}

interface InsightItem {
  id: string
  engine: string
  type: 'positive' | 'negative' | 'neutral' | 'warning'
  title: string
  description: string
  actionable: boolean
  actionSuggestion?: string
}

interface SystemIntelligenceData {
  platformHealth: PlatformHealth
  engagement: {
    courseEngagement: CourseEngagement[]
    platformAverageEngagement: number
  }
  courseIntelligence: CourseIntelligenceItem[]
  instructorIntelligence: InstructorIntelligenceItem[]
  alerts: AlertItem[]
  insights: InsightItem[]
}

interface AIInsightsResult {
  insights: string
  generatedAt: string
}

// ─── Animation Variants ─────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

const cardHover = {
  rest: { scale: 1 },
  hover: { scale: 1.01, transition: { duration: 0.2 } }
}

// ─── Utility Components ─────────────────────────────────────────

function TrendIndicator({ value, label }: { value: number; label?: string }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        {label ? `${label} 0%` : '0%'}
      </span>
    )
  }
  const isUp = value > 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
      {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {isUp ? '+' : ''}{value}%
    </span>
  )
}

function HealthScoreRing({ score, size = 64, strokeWidth = 5 }: { score: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const getColor = (s: number) => {
    if (s >= 70) return { stroke: '#10b981', bg: 'rgba(16,185,129,0.1)', text: 'text-emerald-600 dark:text-emerald-400' }
    if (s >= 40) return { stroke: '#f59e0b', bg: 'rgba(245,158,11,0.1)', text: 'text-amber-600 dark:text-amber-400' }
    return { stroke: '#ef4444', bg: 'rgba(239,68,68,0.1)', text: 'text-red-600 dark:text-red-400' }
  }
  const color = getColor(score)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/20" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color.stroke} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      <span className={`absolute text-sm font-bold ${color.text}`}>{score}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { classes: string; dot: string }> = {
    healthy: { classes: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
    at_risk: { classes: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
    critical: { classes: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800', dot: 'bg-red-500' },
  }
  const c = config[status] || config.at_risk
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.classes}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {status.replace('_', ' ').toUpperCase()}
    </span>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, { classes: string; icon: React.ReactNode }> = {
    critical: { classes: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800', icon: <AlertCircle className="h-3 w-3" /> },
    warning: { classes: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800', icon: <AlertTriangle className="h-3 w-3" /> },
    info: { classes: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200 dark:border-sky-800', icon: <Info className="h-3 w-3" /> },
  }
  const c = config[severity] || config.info
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${c.classes}`}>
      {c.icon}
      {severity.toUpperCase()}
    </span>
  )
}

function InsightTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'positive': return <TrendingUp className="h-4 w-4 text-emerald-500" />
    case 'negative': return <TrendingDown className="h-4 w-4 text-red-500" />
    case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />
    default: return <Info className="h-4 w-4 text-sky-500" />
  }
}

function InsightTypeBorder({ type }: { type: string }) {
  switch (type) {
    case 'positive': return 'border-l-emerald-500'
    case 'negative': return 'border-l-red-500'
    case 'warning': return 'border-l-amber-500'
    default: return 'border-l-sky-500'
  }
}

function formatTimestamp(ts: string): string {
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString()
}

function EntityIcon({ type }: { type: string }) {
  switch (type) {
    case 'course': return <BookOpen className="h-3 w-3" />
    case 'instructor': return <GraduationCap className="h-3 w-3" />
    case 'student': return <Users className="h-3 w-3" />
    default: return <Activity className="h-3 w-3" />
  }
}

// ─── Loading Skeleton ───────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────

export function AdminSystemIntelligenceView() {
  const [data, setData] = useState<SystemIntelligenceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // AI Insights state
  const [aiInsights, setAiInsights] = useState<AIInsightsResult | null>(null)
  const [generatingInsights, setGeneratingInsights] = useState(false)
  const [insightsError, setInsightsError] = useState<string | null>(null)

  // Expanded course state
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)

  // Sort state for course intelligence
  const [courseSort, setCourseSort] = useState<'healthScore' | 'completionRate' | 'avgRating' | 'enrollmentGrowth'>('healthScore')
  const [courseSortDir, setCourseSortDir] = useState<'asc' | 'desc'>('asc')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/system-intelligence')
      if (!res.ok) throw new Error('Failed to fetch intelligence data')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleGenerateInsights = async () => {
    if (!data || generatingInsights) return
    setGeneratingInsights(true)
    setInsightsError(null)
    try {
      const res = await fetch('/api/admin/system-intelligence/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to generate AI insights')
      const json = await res.json()
      setAiInsights(json)
    } catch (err) {
      setInsightsError(err instanceof Error ? err.message : 'Failed to generate insights')
    } finally {
      setGeneratingInsights(false)
    }
  }

  const handleCourseSort = (key: typeof courseSort) => {
    if (courseSort === key) {
      setCourseSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setCourseSort(key)
      setCourseSortDir('asc')
    }
  }

  // ─── Loading State ──────────────────────────────────────────

  if (loading) {
    return <DashboardSkeleton />
  }

  // ─── Error State ────────────────────────────────────────────

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto h-14 w-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Intelligence Engines Offline</h3>
                <p className="text-sm text-muted-foreground mt-1">{error || 'Unable to load system intelligence data'}</p>
              </div>
              <Button onClick={fetchData} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Retry Connection
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  const { platformHealth: ph, engagement: eng, courseIntelligence: ci, instructorIntelligence: ii, alerts, insights } = data

  // Sorted courses
  const sortedCourses = [...ci].sort((a, b) => {
    const aVal = a[courseSort]
    const bVal = b[courseSort]
    return courseSortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
  })

  // Instructor ranking (by effectiveness, descending for display)
  const rankedInstructors = [...ii].sort((a, b) => b.effectivenessScore - a.effectivenessScore)

  // Alert counts
  const criticalAlerts = alerts.filter(a => a.severity === 'critical')
  const warningAlerts = alerts.filter(a => a.severity === 'warning')
  const infoAlerts = alerts.filter(a => a.severity === 'info')

  // ─── Render ──────────────────────────────────────────────────

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-4 md:p-6"
    >
      {/* ═══════════════════════════════════════════════════════════
          SECTION 1: Header + Platform Overview
          ═══════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Cpu className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">AI System Intelligence</h1>
              <p className="text-sm text-muted-foreground">Operational reasoning about platform health</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-2 self-start">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Students */}
          <motion.div variants={cardHover} initial="rest" whileHover="hover">
            <Card className="relative overflow-hidden border-0 shadow-md">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent" />
              <CardContent className="relative p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-9 w-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <TrendIndicator value={ph.trends.enrollmentTrend} />
                </div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-3xl font-bold tracking-tight mt-0.5">{ph.totalStudents.toLocaleString()}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{ph.weeklyActiveUsers} WAU</span>
                  <span>{ph.monthlyActiveUsers} MAU</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Courses */}
          <motion.div variants={cardHover} initial="rest" whileHover="hover">
            <Card className="relative overflow-hidden border-0 shadow-md">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent" />
              <CardContent className="relative p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <TrendIndicator value={ph.trends.enrollmentTrend} />
                </div>
                <p className="text-sm text-muted-foreground">Total Courses</p>
                <p className="text-3xl font-bold tracking-tight mt-0.5">{ph.totalCourses.toLocaleString()}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{ph.totalEnrollments} enrollments</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* DAU */}
          <motion.div variants={cardHover} initial="rest" whileHover="hover">
            <Card className="relative overflow-hidden border-0 shadow-md">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 via-red-500/5 to-transparent" />
              <CardContent className="relative p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-9 w-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <TrendIndicator value={ph.trends.dauTrend} />
                </div>
                <p className="text-sm text-muted-foreground">Daily Active Users</p>
                <p className="text-3xl font-bold tracking-tight mt-0.5">{ph.dailyActiveUsers.toLocaleString()}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Retention: {ph.retentionRate}%</span>
                  <span>Avg: {ph.avgSessionDuration}m</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Completion Rate */}
          <motion.div variants={cardHover} initial="rest" whileHover="hover">
            <Card className="relative overflow-hidden border-0 shadow-md">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 via-orange-500/5 to-transparent" />
              <CardContent className="relative p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <TrendIndicator value={ph.trends.completionTrend} />
                </div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-3xl font-bold tracking-tight mt-0.5">{ph.completionRate}%</p>
                <div className="mt-2">
                  <Progress value={ph.completionRate} className="h-1.5" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      <Separator />

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2: AI Insights (Hero Section)
          ═══════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants}>
        <Card className="relative overflow-hidden border-0 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-amber-500/3 to-transparent pointer-events-none" />
          <CardHeader className="relative pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                  <Brain className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">AI Intelligence Analysis</CardTitle>
                  <CardDescription>LLM-powered reasoning about your platform</CardDescription>
                </div>
              </div>
              <Button
                onClick={handleGenerateInsights}
                disabled={generatingInsights}
                className="gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md shadow-orange-500/20"
              >
                {generatingInsights ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate AI Analysis
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <AnimatePresence mode="wait">
              {generatingInsights && (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center py-12 gap-3"
                >
                  <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
                  <span className="text-sm text-muted-foreground">Running AI analysis on platform data...</span>
                </motion.div>
              )}

              {insightsError && !generatingInsights && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400 flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {insightsError}
                </motion.div>
              )}

              {aiInsights && !generatingInsights && (
                <motion.div
                  key="insights"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 border border-orange-200/50 dark:border-orange-800/30 p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">AI-Generated Analysis</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatTimestamp(aiInsights.generatedAt)}
                    </span>
                  </div>
                  <div className="text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                    {aiInsights.insights}
                  </div>
                </motion.div>
              )}

              {!aiInsights && !generatingInsights && !insightsError && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-10 text-center"
                >
                  <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-3">
                    <Brain className="h-6 w-6 text-orange-500" />
                  </div>
                  <p className="text-sm text-muted-foreground">Click &quot;Generate AI Analysis&quot; to get LLM-powered insights</p>
                  <p className="text-xs text-muted-foreground mt-1">Analyzes platform health, alerts, and trends</p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Rule-Based Insights */}
      {insights.length > 0 && (
        <motion.div variants={itemVariants}>
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Eye className="h-5 w-5 text-orange-500" />
            Rule-Based Insights
            <Badge variant="secondary" className="ml-1">{insights.length}</Badge>
          </h2>
          <div className="max-h-96 overflow-y-auto space-y-3 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
            {insights.map(ins => (
              <Card key={ins.id} className={`border-l-4 ${InsightTypeBorder({ type: ins.type })}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      <InsightTypeIcon type={ins.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{ins.title}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">{ins.engine}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{ins.description}</p>
                      {ins.actionable && ins.actionSuggestion && (
                        <div className="mt-2 rounded-md bg-orange-50 dark:bg-orange-900/20 px-3 py-2 flex items-start gap-2">
                          <Zap className="h-3.5 w-3.5 text-orange-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-orange-700 dark:text-orange-300 font-medium">{ins.actionSuggestion}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      )}

      <Separator />

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3: Alerts
          ═══════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <ShieldCheck className="h-5 w-5 text-orange-500" />
          Alert Center
          {alerts.length > 0 && (
            <Badge variant="secondary" className="ml-1">{alerts.length} active</Badge>
          )}
        </h2>

        {alerts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="h-6 w-6 text-emerald-500" />
              </div>
              <p className="text-sm font-medium">All Clear</p>
              <p className="text-xs text-muted-foreground mt-1">No active alerts detected across the platform</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Critical Alerts */}
            <Card className={`border-red-200 dark:border-red-800 ${criticalAlerts.length > 0 ? 'shadow-md shadow-red-500/5' : ''}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                  </div>
                  Critical
                  <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30">{criticalAlerts.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="max-h-64 overflow-y-auto space-y-2.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
                  {criticalAlerts.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No critical alerts</p>
                  ) : criticalAlerts.map(a => (
                    <div
                      key={a.id}
                      className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 p-3 animate-pulse-subtle"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <SeverityBadge severity={a.severity} />
                        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                          <EntityIcon type={a.relatedEntityType} />
                          {a.relatedEntityType}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(a.timestamp)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Warning Alerts */}
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  </div>
                  Warning
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30">{warningAlerts.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="max-h-64 overflow-y-auto space-y-2.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
                  {warningAlerts.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No warnings</p>
                  ) : warningAlerts.map(a => (
                    <div
                      key={a.id}
                      className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-3"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <SeverityBadge severity={a.severity} />
                        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                          <EntityIcon type={a.relatedEntityType} />
                          {a.relatedEntityType}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(a.timestamp)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Info Alerts */}
            <Card className="border-sky-200 dark:border-sky-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                    <Info className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                  </div>
                  Informational
                  <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/30">{infoAlerts.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="max-h-64 overflow-y-auto space-y-2.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
                  {infoAlerts.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No informational alerts</p>
                  ) : infoAlerts.map(a => (
                    <div
                      key={a.id}
                      className="rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-900/10 p-3"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <SeverityBadge severity={a.severity} />
                        <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                          <EntityIcon type={a.relatedEntityType} />
                          {a.relatedEntityType}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{a.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(a.timestamp)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>

      <Separator />

      {/* ═══════════════════════════════════════════════════════════
          SECTION 4: Course Intelligence
          ═══════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <BookMarked className="h-5 w-5 text-orange-500" />
          Course Intelligence
          <Badge variant="secondary" className="ml-1">{ci.length} courses</Badge>
        </h2>

        {ci.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No published courses</p>
              <p className="text-xs text-muted-foreground mt-1">Course intelligence will appear once courses are published</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Sort controls */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { key: 'healthScore' as const, label: 'Health Score' },
                { key: 'completionRate' as const, label: 'Completion' },
                { key: 'avgRating' as const, label: 'Rating' },
                { key: 'enrollmentGrowth' as const, label: 'Growth' },
              ].map(s => (
                <Button
                  key={s.key}
                  variant={courseSort === s.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCourseSort(s.key)}
                  className="gap-1 text-xs h-7"
                >
                  {s.label}
                  {courseSort === s.key && (
                    courseSortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                  )}
                </Button>
              ))}
            </div>

            <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
              {sortedCourses.map((c, idx) => (
                <motion.div
                  key={c.courseId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.3 }}
                >
                  <Card className={`overflow-hidden transition-all ${c.status === 'critical' ? 'border-red-200 dark:border-red-800' : c.status === 'at_risk' ? 'border-amber-200 dark:border-amber-800' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Health Score Ring */}
                        <div className="shrink-0">
                          <HealthScoreRing score={c.healthScore} size={56} strokeWidth={4} />
                        </div>

                        {/* Main Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm truncate">{c.courseTitle}</p>
                              <p className="text-xs text-muted-foreground">by {c.instructorName}</p>
                            </div>
                            <StatusBadge status={c.status} />
                          </div>

                          {/* Metrics Row */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 mt-2.5">
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Enrollments</p>
                              <p className="text-sm font-medium">{c.enrollmentCount}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Growth</p>
                              <div className="flex items-center gap-1">
                                <p className="text-sm font-medium">{c.enrollmentGrowth > 0 ? '+' : ''}{c.enrollmentGrowth}%</p>
                                {c.enrollmentGrowth !== 0 && (
                                  c.enrollmentGrowth > 0
                                    ? <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                                    : <ArrowDownRight className="h-3 w-3 text-red-500" />
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Completion</p>
                              <p className="text-sm font-medium">{c.completionRate}%</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Rating</p>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                <p className="text-sm font-medium">{c.avgRating}</p>
                              </div>
                            </div>
                          </div>

                          {/* Expandable detail */}
                          <AnimatePresence>
                            {expandedCourse === c.courseId && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-3 pt-3 border-t border-border/50">
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    <div>
                                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Engagement Rate</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Progress value={c.engagementRate} className="h-1.5 flex-1" />
                                        <span className="text-xs font-medium">{c.engagementRate}%</span>
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Assessment Score</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Progress value={c.assessmentScore} className="h-1.5 flex-1" />
                                        <span className="text-xs font-medium">{c.assessmentScore}%</span>
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Engagement Breakdown</p>
                                      <div className="mt-1 flex gap-1">
                                        {/* Engagement breakdown from courseEngagement data */}
                                        {eng.courseEngagement.find(e => e.courseId === c.courseId) ? (
                                          <>
                                            {(() => {
                                              const ce = eng.courseEngagement.find(e => e.courseId === c.courseId)!
                                              return (
                                                <div className="flex gap-1 flex-wrap">
                                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300">Login {ce.loginScore}</span>
                                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">Activity {ce.activityScore}</span>
                                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300">Quiz {ce.quizScore}</span>
                                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300">AI {ce.aiScore}</span>
                                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-300">Community {ce.communityScore}</span>
                                                </div>
                                              )
                                            })()}
                                          </>
                                        ) : (
                                          <span className="text-xs text-muted-foreground">N/A</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Expand Toggle */}
                          <button
                            onClick={() => setExpandedCourse(expandedCourse === c.courseId ? null : c.courseId)}
                            className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {expandedCourse === c.courseId ? (
                              <>Less detail <ChevronUp className="h-3 w-3" /></>
                            ) : (
                              <>More detail <ChevronDown className="h-3 w-3" /></>
                            )}
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </motion.div>

      <Separator />

      {/* ═══════════════════════════════════════════════════════════
          SECTION 5: Instructor Intelligence (Leaderboard)
          ═══════════════════════════════════════════════════════════ */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <UserCheck className="h-5 w-5 text-orange-500" />
          Instructor Effectiveness
          <Badge variant="secondary" className="ml-1">{ii.length} instructors</Badge>
        </h2>

        {ii.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No instructors</p>
              <p className="text-xs text-muted-foreground mt-1">Instructor intelligence will appear once there are instructors</p>
            </CardContent>
          </Card>
        ) : (
          <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
            {rankedInstructors.map((inst, idx) => {
              const isTop = idx === 0
              return (
                <motion.div
                  key={inst.instructorId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.3 }}
                >
                  <Card className={`overflow-hidden transition-all ${isTop ? 'border-amber-300 dark:border-amber-700 shadow-md shadow-amber-500/10' : inst.warnings.length > 0 ? 'border-amber-200/50 dark:border-amber-800/50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Rank Badge */}
                        <div className="shrink-0 flex flex-col items-center">
                          {isTop ? (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                              <Award className="h-5 w-5 text-white" />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-sm font-bold text-muted-foreground">#{idx + 1}</span>
                            </div>
                          )}
                          {isTop && <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-1">TOP</span>}
                        </div>

                        {/* Instructor Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={`font-semibold text-sm ${isTop ? 'text-amber-700 dark:text-amber-300' : ''}`}>{inst.instructorName}</p>
                                {inst.warnings.length > 0 && (
                                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 h-5 text-[10px]">
                                    <MessageSquareWarning className="h-2.5 w-2.5 mr-0.5" />
                                    {inst.warnings.length}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{inst.courseCount} courses &middot; {inst.totalStudents} students</p>
                            </div>
                            {/* Effectiveness Score */}
                            <div className="text-right shrink-0">
                              <p className="text-2xl font-bold tracking-tight">{inst.effectivenessScore}</p>
                              <p className="text-[10px] text-muted-foreground">Effectiveness</p>
                            </div>
                          </div>

                          {/* Metrics */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5">
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Completion</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Progress value={inst.completionRate} className="h-1 flex-1" />
                                <span className="text-xs font-medium">{inst.completionRate}%</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Rating</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                <span className="text-xs font-medium">{inst.avgRating}/5</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Success Rate</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Progress value={inst.studentSuccessRate} className="h-1 flex-1" />
                                <span className="text-xs font-medium">{inst.studentSuccessRate}%</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Engagement</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Progress value={inst.engagementScore} className="h-1 flex-1" />
                                <span className="text-xs font-medium">{inst.engagementScore}%</span>
                              </div>
                            </div>
                          </div>

                          {/* Warnings */}
                          {inst.warnings.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {inst.warnings.map((w, wIdx) => (
                                <span
                                  key={wIdx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[10px] rounded-md border border-amber-200 dark:border-amber-800"
                                >
                                  <AlertTriangle className="h-2.5 w-2.5" />
                                  {w}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Bottom spacer */}
      <div className="h-4" />
    </motion.div>
  )
}
