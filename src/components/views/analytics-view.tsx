'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Target, Clock, TrendingUp, TrendingDown, Award, Activity,
  CheckCircle, AlertTriangle, Lightbulb, BookOpen, GraduationCap,
  Loader2, BarChart3, Users, Star, Shield, AlertCircle, Flame,
  ChevronDown, ChevronUp, Zap, RefreshCw, Minus, MessageSquare,
  DollarSign, UserCheck, UserX, BookMarked, FileText, ExternalLink,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts'
import { useAppStore } from '@/lib/store'
import { ChartContainer, type ChartConfig } from '@/components/ui/chart'
import { ShijlAIText } from '@/components/ui/brand-text'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

// ── Chart configs ──────────────────────────────────────────
const weeklyTrendConfig: ChartConfig = {
  score: { label: 'Quiz Score', color: '#10b981' },
  lessonsCompleted: { label: 'Lessons', color: '#14b8a6' },
  studyHours: { label: 'Study Hours', color: '#06b6d4' },
}

const difficultyBarConfig: ChartConfig = {
  difficultyScore: { label: 'Difficulty', color: '#f59e0b' },
  completionRate: { label: 'Completion %', color: '#10b981' },
}

// ── Type definitions for API response ──────────────────────
interface Insight {
  id: string
  type: 'strength' | 'weakness' | 'trend' | 'warning' | 'achievement' | 'suggestion' | 'opportunity'
  title: string
  description: string
  category: string
  severity: 'info' | 'warning' | 'critical' | 'positive'
  actionable: boolean
  actionSuggestion?: string
  relatedMetric?: string
  metricValue?: number
}

interface Recommendation {
  id: string
  type: 'lesson' | 'quiz' | 'course' | 'topic' | 'study_plan'
  title: string
  description: string
  reason: string
  priority: 'low' | 'medium' | 'high'
  relatedId?: string
  relatedType?: string
}

interface TopicEntry {
  topicId?: string
  topicName: string
  masteryScore: number
  trend: string
  courseId?: string
}

interface StudentMetrics {
  averageQuizScore: number
  courseCompletionRate: number
  averageSessionDuration: number
  weeklyStudyHours: number
  assignmentAverage: number
  lessonCompletionRate: number
  aiUsageFrequency: number
  totalStudyTime: number
  totalLessonsCompleted: number
  totalQuizzesTaken: number
  currentStreak: number
  xpEarned: number
}

interface LearningProfile {
  learningLevel: string
  engagementScore: number
  consistencyScore: number
  learningSpeedScore: number
  dropRiskScore: number
  learningSpeed: string
}

interface InstructorMetrics {
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
  trend: string
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

interface InstructorSuggestion {
  id: string
  type: 'add_revision' | 'create_quiz' | 'update_module' | 'review_content' | 'engage_students'
  title: string
  description: string
  targetId?: string
  targetType?: string
  priority: 'low' | 'medium' | 'high'
}

interface AdminMetrics {
  totalUsers: number
  activeUsers: number
  dailyActiveUsers: number
  totalCourses: number
  totalRevenue: number
  completionRates: number
  instructorCount: number
  studentCount: number
}

interface CourseHealth {
  courseId: string
  courseTitle: string
  instructorName: string
  enrollments: number
  completions: number
  completionRate: number
  rating: number
  engagement: number
  healthScore: number
  status: 'healthy' | 'at_risk' | 'critical'
}

interface InstructorPerf {
  instructorId: string
  instructorName: string
  courseCount: number
  totalStudents: number
  avgCompletionRate: number
  avgRating: number
  engagementScore: number
  performanceScore: number
}

interface RiskAlert {
  id: string
  type: 'high_dropout' | 'inactive_students' | 'inactive_instructor' | 'low_engagement' | 'declining_revenue'
  title: string
  description: string
  severity: 'warning' | 'critical'
  targetId?: string
  targetName?: string
  metric: string
  value: number
  threshold: number
}

// ── Utility helpers ────────────────────────────────────────
function getInsightIcon(type: string) {
  switch (type) {
    case 'strength': return CheckCircle
    case 'weakness': return AlertTriangle
    case 'trend': return TrendingUp
    case 'warning': return AlertCircle
    case 'achievement': return Award
    case 'suggestion': return Lightbulb
    case 'opportunity': return Zap
    default: return Brain
  }
}

function getSeverityColors(severity: string) {
  switch (severity) {
    case 'positive': return { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', icon: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' }
    case 'warning': return { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', icon: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' }
    case 'critical': return { bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800', icon: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' }
    default: return { bg: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-200 dark:border-cyan-800', icon: 'text-cyan-600 dark:text-cyan-400', badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' }
  }
}

function getTrendIcon(trend: string) {
  if (trend === 'improving') return <ArrowUpRight className="size-3.5 text-emerald-500" />
  if (trend === 'declining') return <ArrowDownRight className="size-3.5 text-rose-500" />
  return <Minus className="size-3.5 text-muted-foreground" />
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case 'high': return <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 text-[10px] rounded-md px-1.5">High</Badge>
    case 'medium': return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] rounded-md px-1.5">Med</Badge>
    default: return <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 text-[10px] rounded-md px-1.5">Low</Badge>
  }
}

function getHealthStatusStyle(status: string) {
  switch (status) {
    case 'healthy': return { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', label: 'Healthy' }
    case 'at_risk': return { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', label: 'At Risk' }
    case 'critical': return { bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300', label: 'Critical' }
    default: return { bg: '', border: '', badge: '', label: status }
  }
}

function formatRevenue(value: number) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
  return `$${value}`
}

// ── Shared sub-components ──────────────────────────────────
function MetricCard({ icon: Icon, label, value, subtext, color, trend }: {
  icon: React.ElementType; label: string; value: string | number
  subtext?: string; color: string; trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }} className="rounded-2xl bg-card p-4 border border-border/40 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`flex size-10 items-center justify-center rounded-xl ${color}`}><Icon className="size-5" /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[22px] font-bold leading-tight">{value}</p>
            {trend === 'up' && <TrendingUp className="size-3.5 text-emerald-500" />}
            {trend === 'down' && <TrendingDown className="size-3.5 text-rose-500" />}
          </div>
          <p className="text-[13px] text-muted-foreground">{label}</p>
          {subtext && <p className="text-[11px] text-emerald-600 dark:text-emerald-400">{subtext}</p>}
        </div>
      </div>
    </motion.div>
  )
}

function InsightsPanel({ insights, defaultOpen = true }: { insights: Insight[]; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  if (!insights.length) return null
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border-border/40 shadow-sm">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer pb-2 hover:bg-muted/30 transition-colors rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600"><Brain className="size-4 text-white" /></div>
                <div><CardTitle className="text-[15px]"><ShijlAIText /> Insights</CardTitle><p className="text-[11px] text-muted-foreground">AI-powered analysis of your data</p></div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 text-[10px]">{insights.length} insights</Badge>
                {open ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-2 pb-4 space-y-2">
            {insights.map((insight) => {
              const Icon = getInsightIcon(insight.type)
              const colors = getSeverityColors(insight.severity)
              return (
                <motion.div key={insight.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className={`rounded-xl border p-3 ${colors.bg} ${colors.border}`}>
                  <div className="flex items-start gap-2.5">
                    <Icon className={`size-4 mt-0.5 shrink-0 ${colors.icon}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[13px] font-semibold">{insight.title}</span>
                        <Badge className={`${colors.badge} text-[9px] px-1.5 py-0`}>{insight.severity}</Badge>
                      </div>
                      <p className="text-[12px] text-muted-foreground leading-relaxed">{insight.description}</p>
                      {insight.actionable && insight.actionSuggestion && (
                        <div className="mt-2 flex items-center gap-2">
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex-1">{insight.actionSuggestion}</p>
                          <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 shrink-0">
                            <MessageSquare className="size-3 mr-1" />Ask <ShijlAIText />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function ScoreRing({ value, label, color, size = 64 }: { value: number; label: string; color: string; size?: number }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(value, 100) / 100) * circumference
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={5} className="text-muted/30" />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={5} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[14px] font-bold">{value}</span>
      </div>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  )
}

function HeatmapGrid({ data }: { data: { date: string; xp: number }[] }) {
  const weeks = useMemo(() => {
    const result: { date: string; xp: number }[][] = []
    for (let i = 0; i < data.length; i += 7) result.push(data.slice(i, i + 7))
    return result
  }, [data])
  const getColor = (xp: number) => {
    if (xp === 0) return 'bg-muted/60'
    if (xp < 25) return 'bg-emerald-200 dark:bg-emerald-900'
    if (xp < 75) return 'bg-emerald-400 dark:bg-emerald-700'
    if (xp < 120) return 'bg-emerald-600 dark:bg-emerald-500'
    return 'bg-emerald-800 dark:bg-emerald-300'
  }
  return (
    <div className="flex gap-[3px] overflow-x-auto pb-2">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[3px]">
          {week.map((day, di) => (
            <div key={`${wi}-${di}`} className={`size-[12px] rounded-[3px] ${getColor(day.xp)} transition-colors`} title={`${day.date}: ${day.xp} XP`} />
          ))}
        </div>
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// STUDENT INTELLIGENT ANALYTICS
// ════════════════════════════════════════════════════════════
function StudentAnalytics({ data }: { data: Record<string, unknown> }) {
  const metrics = (data.metrics || {}) as StudentMetrics
  const topicMastery = (data.topicMastery || { strong: [], weak: [], improving: [], all: [] }) as { strong: TopicEntry[]; weak: TopicEntry[]; improving: TopicEntry[]; all: TopicEntry[] }
  const insights = (data.insights || []) as Insight[]
  const recommendations = (data.recommendations || []) as Recommendation[]
  const learningProfile = (data.learningProfile || {}) as LearningProfile
  const activityHeatmap = (data.activityHeatmap || []) as { date: string; xp: number; lessons: number; quizzes: number; timeSpent: number }[]
  const weeklyTrend = (data.weeklyTrend || []) as { week: string; score: number; lessonsCompleted: number; studyHours: number }[]
  const [recFilter, setRecFilter] = useState<string>('all')

  const filteredRecs = useMemo(() => {
    if (recFilter === 'all') return recommendations
    return recommendations.filter(r => r.type === recFilter)
  }, [recommendations, recFilter])

  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={Target} label="Avg Quiz Score" value={`${metrics.averageQuizScore || 0}%`} subtext={`${metrics.totalQuizzesTaken || 0} quizzes`} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" trend={metrics.averageQuizScore >= 70 ? 'up' : metrics.averageQuizScore < 50 ? 'down' : 'neutral'} />
        <MetricCard icon={GraduationCap} label="Completion Rate" value={`${metrics.courseCompletionRate || 0}%`} subtext="Course completion" color="bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400" trend={metrics.courseCompletionRate >= 50 ? 'up' : 'down'} />
        <MetricCard icon={Clock} label="Weekly Study" value={`${metrics.weeklyStudyHours || 0}h`} subtext="This week" color="bg-cyan-100 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400" trend={metrics.weeklyStudyHours >= 5 ? 'up' : metrics.weeklyStudyHours < 2 ? 'down' : 'neutral'} />
        <MetricCard icon={Flame} label="Current Streak" value={metrics.currentStreak || 0} subtext="days" color="bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" trend={(metrics.currentStreak || 0) >= 7 ? 'up' : 'neutral'} />
      </div>

      {/* AI Insights Panel */}
      <InsightsPanel insights={insights} defaultOpen={true} />

      {/* Topic Mastery */}
      <Card className="border-border/40 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-[15px] flex items-center gap-2"><BookOpen className="size-4 text-teal-500" />Topic Mastery</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Strong Topics */}
            <div>
              <h4 className="text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5"><CheckCircle className="size-3.5" />Strong Topics</h4>
              <div className="space-y-2 max-h-52 overflow-y-auto scrollbar-thin pr-1">
                {topicMastery.strong.length > 0 ? topicMastery.strong.slice(0, 8).map(t => (
                  <div key={t.topicId || t.topicName} className="flex items-center gap-2">
                    <span className="text-[12px] flex-1 truncate">{t.topicName}</span>
                    {getTrendIcon(t.trend)}
                    <span className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400 w-8 text-right">{t.masteryScore}%</span>
                  </div>
                )) : <p className="text-[12px] text-muted-foreground">No strong topics yet. Keep studying!</p>}
              </div>
            </div>
            {/* Weak Topics */}
            <div>
              <h4 className="text-[13px] font-semibold text-rose-600 dark:text-rose-400 mb-2 flex items-center gap-1.5"><AlertTriangle className="size-3.5" />Weak Topics</h4>
              <div className="space-y-2 max-h-52 overflow-y-auto scrollbar-thin pr-1">
                {topicMastery.weak.length > 0 ? topicMastery.weak.slice(0, 8).map(t => (
                  <div key={t.topicId || t.topicName} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] flex-1 truncate">{t.topicName}</span>
                      {getTrendIcon(t.trend)}
                      <span className="text-[12px] font-medium text-rose-600 dark:text-rose-400 w-8 text-right">{t.masteryScore}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-rose-400 to-amber-400" style={{ width: `${t.masteryScore}%` }} />
                    </div>
                  </div>
                )) : <p className="text-[12px] text-muted-foreground">No weak topics detected. Great job!</p>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-border/40 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[15px] flex items-center gap-2"><Lightbulb className="size-4 text-amber-500" />AI Recommendations</CardTitle>
            <div className="flex gap-1">
              {['all', 'lesson', 'quiz', 'course', 'study_plan'].map(f => (
                <Button key={f} size="sm" variant={recFilter === f ? 'default' : 'ghost'} className={`h-6 text-[10px] px-2 ${recFilter === f ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`} onClick={() => setRecFilter(f)}>{f === 'all' ? 'All' : f === 'study_plan' ? 'Plans' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}</Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
            {filteredRecs.length > 0 ? filteredRecs.map(rec => (
              <motion.div key={rec.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border/60 p-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[13px] font-medium">{rec.title}</span>
                      {getPriorityBadge(rec.priority)}
                    </div>
                    <p className="text-[12px] text-muted-foreground">{rec.description}</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">{rec.reason}</p>
                  </div>
                  <Button size="sm" className="h-7 text-[11px] px-3 bg-emerald-600 hover:bg-emerald-700 shrink-0">Start</Button>
                </div>
              </motion.div>
            )) : <p className="text-[12px] text-muted-foreground text-center py-4">No recommendations for this category</p>}
          </div>
        </CardContent>
      </Card>

      {/* Learning Profile Card */}
      <Card className="border-border/40 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-[15px] flex items-center gap-2"><Shield className="size-4 text-cyan-500" />Learning Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap justify-center gap-6 py-2">
            <ScoreRing value={learningProfile.engagementScore || 0} label="Engagement" color="#10b981" size={72} />
            <ScoreRing value={learningProfile.consistencyScore || 0} label="Consistency" color="#14b8a6" size={72} />
            <div className="flex flex-col items-center gap-1">
              <div className="flex size-[72px] items-center justify-center rounded-full border-2 border-cyan-400 dark:border-cyan-600">
                <span className="text-[16px] font-bold text-cyan-600 dark:text-cyan-400">{learningProfile.learningSpeedScore || 0}</span>
              </div>
              <span className="text-[11px] text-muted-foreground">Speed</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className={`flex size-[72px] items-center justify-center rounded-full border-2 ${(learningProfile.dropRiskScore || 0) > 60 ? 'border-rose-400 dark:border-rose-600' : (learningProfile.dropRiskScore || 0) > 30 ? 'border-amber-400 dark:border-amber-600' : 'border-emerald-400 dark:border-emerald-600'}`}>
                <span className={`text-[16px] font-bold ${(learningProfile.dropRiskScore || 0) > 60 ? 'text-rose-600 dark:text-rose-400' : (learningProfile.dropRiskScore || 0) > 30 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{learningProfile.dropRiskScore || 0}</span>
              </div>
              <span className="text-[11px] text-muted-foreground">Drop Risk</span>
              {(learningProfile.dropRiskScore || 0) > 60 && <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 text-[9px] px-1.5">High Risk</Badge>}
              {(learningProfile.dropRiskScore || 0) > 30 && (learningProfile.dropRiskScore || 0) <= 60 && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-[9px] px-1.5">Moderate</Badge>}
            </div>
          </div>
          {learningProfile.learningLevel && (
            <div className="text-center mt-2">
              <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">Level: {learningProfile.learningLevel}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Heatmap */}
      {activityHeatmap.length > 0 && (
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] flex items-center gap-2"><Activity className="size-4 text-emerald-500" />Activity Heatmap</CardTitle>
            <p className="text-[11px] text-muted-foreground">Last 30 days of learning activity</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span>Less</span>
                <div className="size-[12px] rounded-[3px] bg-muted/60" />
                <div className="size-[12px] rounded-[3px] bg-emerald-200 dark:bg-emerald-900" />
                <div className="size-[12px] rounded-[3px] bg-emerald-400 dark:bg-emerald-700" />
                <div className="size-[12px] rounded-[3px] bg-emerald-600 dark:bg-emerald-500" />
                <div className="size-[12px] rounded-[3px] bg-emerald-800 dark:bg-emerald-300" />
                <span>More</span>
              </div>
              <HeatmapGrid data={activityHeatmap} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Trend Chart */}
      {weeklyTrend.length > 0 && (
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] flex items-center gap-2"><BarChart3 className="size-4 text-teal-500" />Weekly Trend</CardTitle>
            <p className="text-[11px] text-muted-foreground">Score, lessons & study hours over 8 weeks</p>
          </CardHeader>
          <CardContent>
            <ChartContainer config={weeklyTrendConfig} className="h-[220px] w-full">
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.3)" />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
                <Line type="monotone" dataKey="lessonsCompleted" stroke="#14b8a6" strokeWidth={2} dot={{ fill: '#14b8a6', r: 3 }} />
                <Line type="monotone" dataKey="studyHours" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4', r: 3 }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// INSTRUCTOR INTELLIGENT ANALYTICS
// ════════════════════════════════════════════════════════════
function InstructorAnalytics({ data }: { data: Record<string, unknown> }) {
  const metrics = (data.metrics || {}) as InstructorMetrics
  const insights = (data.insights || []) as Insight[]
  const difficultLessons = (data.difficultLessons || []) as DifficultLesson[]
  const studentStruggles = (data.studentStruggles || []) as StudentStruggle[]
  const moduleDrops = (data.moduleDrops || []) as ModuleDrop[]
  const suggestions = (data.suggestions || []) as InstructorSuggestion[]

  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <MetricCard icon={Users} label="Total Students" value={metrics.totalStudents || 0} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" />
        <MetricCard icon={GraduationCap} label="Completion Rate" value={`${metrics.courseCompletionRate || 0}%`} color="bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400" trend={metrics.courseCompletionRate >= 60 ? 'up' : 'down'} />
        <MetricCard icon={Target} label="Avg Score" value={`${metrics.averageStudentScore || 0}%`} color="bg-cyan-100 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400" />
        <MetricCard icon={Activity} label="Avg Engagement" value={`${metrics.averageEngagement || 0}%`} color="bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" />
        <MetricCard icon={FileText} label="Avg Assignment" value={`${metrics.averageAssignmentScore || 0}%`} color="bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400" />
        <MetricCard icon={Star} label="Course Rating" value={metrics.courseRating || 0} subtext="out of 5" color="bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" trend={metrics.courseRating >= 4 ? 'up' : metrics.courseRating < 3 ? 'down' : 'neutral'} />
      </div>

      {/* AI Insights */}
      <InsightsPanel insights={insights} defaultOpen={true} />

      {/* Difficult Lessons */}
      {difficultLessons.length > 0 && (
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] flex items-center gap-2"><AlertTriangle className="size-4 text-amber-500" />Difficult Lessons Detected</CardTitle>
            <p className="text-[11px] text-muted-foreground">{difficultLessons.length} lessons with high difficulty scores</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin pr-1">
              {difficultLessons.slice(0, 10).map(lesson => (
                <div key={lesson.lessonId} className="rounded-xl border border-border/60 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[13px] font-medium">{lesson.lessonTitle}</p>
                      <p className="text-[11px] text-muted-foreground">{lesson.courseTitle} &middot; {lesson.moduleTitle}</p>
                    </div>
                    <Badge className={`text-[10px] ${lesson.difficultyScore > 70 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                      {lesson.difficultyScore}/100
                    </Badge>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500" style={{ width: `${lesson.difficultyScore}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="text-[11px]"><span className="font-medium text-emerald-600">{lesson.completionRate}%</span> completion</div>
                    <div className="text-[11px]"><span className="font-medium text-amber-600">{lesson.dropoffRate}%</span> dropoff</div>
                    <div className="text-[11px]"><span className="font-medium text-cyan-600">{lesson.studentCount}</span> students</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 border-teal-300 dark:border-teal-700 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40">
                      <BookOpen className="size-3 mr-1" />Review Content
                    </Button>
                    <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40">
                      <FileText className="size-3 mr-1" />Add Revision
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student Struggle Areas */}
      {studentStruggles.length > 0 && (
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] flex items-center gap-2"><AlertCircle className="size-4 text-rose-500" />Student Struggle Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin pr-1">
              {studentStruggles.slice(0, 10).map((s, i) => (
                <div key={s.topic + i} className="flex items-center gap-3 rounded-xl border border-border/60 p-2.5 hover:bg-muted/30 transition-colors">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950/40 text-[11px] font-bold text-rose-600 dark:text-rose-400">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{s.topic}</p>
                    <p className="text-[11px] text-muted-foreground">{s.strugglingStudents}/{s.totalStudents} struggling</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {getTrendIcon(s.trend)}
                    <span className="text-[13px] font-medium text-rose-600 dark:text-rose-400">{s.avgMastery}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Module Performance Drops */}
      {moduleDrops.length > 0 && (
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] flex items-center gap-2"><TrendingDown className="size-4 text-rose-500" />Module Performance Drops</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {moduleDrops.slice(0, 6).map((m, i) => (
                <div key={m.moduleTitle + i} className="rounded-xl border border-border/60 p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[13px] font-medium">{m.moduleTitle}</p>
                      <p className="text-[11px] text-muted-foreground">{m.courseTitle}</p>
                    </div>
                    <Badge className={`text-[10px] ${m.dropPercent > 20 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                      -{m.dropPercent}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-emerald-600">{m.previousAvgScore}%</span>
                    <span className="text-muted-foreground">&rarr;</span>
                    <span className="text-rose-600">{m.currentAvgScore}%</span>
                    <span className="text-muted-foreground ml-auto">{m.studentCount} students</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] flex items-center gap-2"><Zap className="size-4 text-amber-500" />AI Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
              {suggestions.map(sug => {
                const typeIcon = sug.type === 'add_revision' ? FileText : sug.type === 'create_quiz' ? Target : sug.type === 'update_module' ? BookMarked : sug.type === 'review_content' ? BookOpen : Users
                const TypeIcon = typeIcon
                return (
                  <div key={sug.id} className="flex items-start gap-3 rounded-xl border border-border/60 p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/40 shrink-0"><TypeIcon className="size-3.5 text-teal-600 dark:text-teal-400" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[13px] font-medium">{sug.title}</span>
                        {getPriorityBadge(sug.priority)}
                      </div>
                      <p className="text-[12px] text-muted-foreground">{sug.description}</p>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 shrink-0 border-teal-300 dark:border-teal-700 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40">Action</Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// ADMIN INTELLIGENT ANALYTICS
// ════════════════════════════════════════════════════════════
function AdminAnalytics({ data }: { data: Record<string, unknown> }) {
  const metrics = (data.metrics || {}) as AdminMetrics
  const insights = (data.insights || []) as Insight[]
  const courseHealth = (data.courseHealth || []) as CourseHealth[]
  const instructorPerformance = (data.instructorPerformance || []) as InstructorPerf[]
  const riskAlerts = (data.riskAlerts || []) as RiskAlert[]

  return (
    <div className="space-y-6">
      {/* Platform Metrics Row */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-8">
        <MetricCard icon={Users} label="Total Users" value={metrics.totalUsers || 0} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" />
        <MetricCard icon={UserCheck} label="Active (7d)" value={metrics.activeUsers || 0} color="bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400" trend={(metrics.activeUsers || 0) > (metrics.totalUsers || 1) * 0.3 ? 'up' : 'down'} />
        <MetricCard icon={Activity} label="DAU" value={metrics.dailyActiveUsers || 0} color="bg-cyan-100 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400" />
        <MetricCard icon={BookOpen} label="Courses" value={metrics.totalCourses || 0} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" />
        <MetricCard icon={DollarSign} label="Revenue" value={formatRevenue(metrics.totalRevenue || 0)} color="bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" trend="up" />
        <MetricCard icon={GraduationCap} label="Completion" value={`${metrics.completionRates || 0}%`} color="bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400" />
        <MetricCard icon={Star} label="Instructors" value={metrics.instructorCount || 0} color="bg-cyan-100 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400" />
        <MetricCard icon={Users} label="Students" value={metrics.studentCount || 0} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" />
      </div>

      {/* AI Insights */}
      <InsightsPanel insights={insights} defaultOpen={true} />

      {/* Platform Risk Alerts */}
      {riskAlerts.length > 0 && (
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] flex items-center gap-2"><Shield className="size-4 text-rose-500" />Platform Risk Alerts</CardTitle>
            <p className="text-[11px] text-muted-foreground">{riskAlerts.length} active alerts</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
              {riskAlerts.map(alert => {
                const isCritical = alert.severity === 'critical'
                const alertIcon = alert.type === 'high_dropout' ? TrendingDown : alert.type === 'inactive_students' ? UserX : alert.type === 'inactive_instructor' ? UserX : alert.type === 'low_engagement' ? Activity : DollarSign
                const AlertIcon = alertIcon
                return (
                  <div key={alert.id} className={`rounded-xl border p-3 ${isCritical ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800' : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'}`}>
                    <div className="flex items-start gap-2.5">
                      <AlertIcon className={`size-4 mt-0.5 shrink-0 ${isCritical ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[13px] font-semibold">{alert.title}</span>
                          <Badge className={`text-[9px] px-1.5 py-0 ${isCritical ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>{alert.severity}</Badge>
                        </div>
                        <p className="text-[12px] text-muted-foreground">{alert.description}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                          <span>Value: <strong>{alert.value}</strong></span>
                          <span>Threshold: <strong>{alert.threshold}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Health Analysis */}
      {courseHealth.length > 0 && (
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[15px] flex items-center gap-2"><BookOpen className="size-4 text-emerald-500" />Course Health Analysis</CardTitle>
              <div className="flex gap-2 text-[11px]">
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-500" />Healthy ({courseHealth.filter(c => c.status === 'healthy').length})</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-amber-500" />At Risk ({courseHealth.filter(c => c.status === 'at_risk').length})</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-rose-500" />Critical ({courseHealth.filter(c => c.status === 'critical').length})</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin pr-1">
              {courseHealth.slice(0, 15).map(course => {
                const style = getHealthStatusStyle(course.status)
                return (
                  <div key={course.courseId} className={`rounded-xl border p-3 ${style.bg} ${style.border}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[13px] font-medium truncate">{course.courseTitle}</span>
                          <Badge className={`${style.badge} text-[9px] px-1.5 py-0`}>{style.label}</Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">Instructor: {course.instructorName}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[16px] font-bold">{course.healthScore}</p>
                        <p className="text-[10px] text-muted-foreground">Health Score</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-2 text-center">
                      <div><p className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400">{course.enrollments}</p><p className="text-[10px] text-muted-foreground">Enrolled</p></div>
                      <div><p className="text-[12px] font-medium text-teal-600 dark:text-teal-400">{course.completionRate}%</p><p className="text-[10px] text-muted-foreground">Completion</p></div>
                      <div><p className="text-[12px] font-medium text-amber-600 dark:text-amber-400">{course.rating}</p><p className="text-[10px] text-muted-foreground">Rating</p></div>
                      <div><p className="text-[12px] font-medium text-cyan-600 dark:text-cyan-400">{course.engagement}%</p><p className="text-[10px] text-muted-foreground">Engagement</p></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructor Performance Ranking */}
      {instructorPerformance.length > 0 && (
        <Card className="border-border/40 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-[15px] flex items-center gap-2"><Award className="size-4 text-amber-500" />Instructor Performance Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin pr-1">
              {instructorPerformance.slice(0, 15).map((inst, i) => (
                <div key={inst.instructorId} className="flex items-center gap-3 rounded-xl border border-border/60 p-2.5 hover:bg-muted/30 transition-colors">
                  <div className={`flex size-8 items-center justify-center rounded-xl font-bold text-[12px] ${i < 3 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' : 'bg-muted text-muted-foreground'}`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{inst.instructorName}</p>
                    <p className="text-[11px] text-muted-foreground">{inst.courseCount} courses &middot; {inst.totalStudents} students</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-center">
                    <div><p className="text-[13px] font-bold text-emerald-600">{inst.performanceScore}</p><p className="text-[9px] text-muted-foreground">Score</p></div>
                    <div><p className="text-[12px] font-medium text-amber-600">{inst.avgRating}</p><p className="text-[9px] text-muted-foreground">Rating</p></div>
                    <div><p className="text-[12px] font-medium text-teal-600">{inst.avgCompletionRate}%</p><p className="text-[9px] text-muted-foreground">Comp.</p></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// MAIN ANALYTICS VIEW EXPORT
// ════════════════════════════════════════════════════════════
export function AnalyticsView() {
  const { currentUser } = useAppStore()
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    if (!currentUser) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/analytics/intelligent?userId=${currentUser.id}&role=${currentUser.role}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      } else {
        setError('Failed to load intelligent analytics')
      }
    } catch {
      setError('Network error loading analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [currentUser])

  // ── Loading State ────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div><Skeleton className="h-7 w-48 mb-1" /><Skeleton className="h-4 w-64" /></div>
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  // ── Error State ──────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/30">
          <BarChart3 className="size-8 text-rose-400" />
        </div>
        <p className="text-[15px] font-medium text-rose-600 dark:text-rose-400">{error}</p>
        <Button onClick={fetchData} variant="outline" className="gap-2 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40">
          <RefreshCw className="size-4" />Retry
        </Button>
      </div>
    )
  }

  const role = currentUser?.role || 'student'

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
          <Brain className="size-5 text-white" />
        </div>
        <div>
          <h2 className="text-[28px] font-bold leading-tight">Intelligent Analytics</h2>
          <p className="text-[14px] text-muted-foreground">
            {role === 'student' && 'AI-powered insights into your learning journey'}
            {role === 'instructor' && 'AI-powered insights into your courses and students'}
            {role === 'admin' && 'AI-powered platform-wide insights and risk detection'}
          </p>
        </div>
      </div>

      {/* Role-based rendering */}
      {role === 'student' && <StudentAnalytics data={data || {}} />}
      {role === 'instructor' && <InstructorAnalytics data={data || {}} />}
      {role === 'admin' && <AdminAnalytics data={data || {}} />}
    </motion.div>
  )
}
