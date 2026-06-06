'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3, AlertCircle, Loader2, BookOpen, CheckCircle2,
  TrendingUp, TrendingDown, Minus, Target, Brain, Lightbulb,
  ChevronDown, ChevronRight, Sparkles, Plus, X, Link2,
  ArrowRight, AlertTriangle, Award, CircleDot, Eye,
  FileText, Users, Zap, RefreshCw, Info, ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

interface CourseItem {
  id: string
  title: string
}

interface QuestionAnalytics {
  questionId: string
  questionText: string
  questionType: string
  successRate: number
  attempts: number
  correctAnswer: string
  options: string[]
  quizTitle: string
  quizId: string
}

interface QuestionAnalyticsResponse {
  questions: QuestionAnalytics[]
  summary: {
    totalQuestions: number
    avgSuccessRate: number
    distribution: {
      tooDifficult: number
      difficult: number
      normal: number
      easy: number
      tooEasy: number
    }
  }
}

interface DistractorOption {
  label: string
  text: string
  selectionCount: number
  selectionRate: number
  isCorrect: boolean
}

interface DistractorAnalysis {
  questionId: string
  questionText: string
  questionType: string
  correctAnswer: string
  options: DistractorOption[]
  totalAttempts: number
  weakDistractorCount: number
  totalDistractors: number
  recommendation: string
}

interface LearningOutcome {
  id: string
  title: string
  description: string
  linkedQuestionCount: number
  avgMastery: number
  masteryLevel: 'strong' | 'moderate' | 'weak'
  linkedQuestions: Array<{
    questionId: string
    questionText: string
  }>
}

interface OutcomesResponse {
  outcomes: LearningOutcome[]
}

interface QualityScoreItem {
  quizId: string
  quizTitle: string
  overallScore: number
  difficultyBalance: number
  questionVariety: number
  outcomeCoverage: number
  avgCompletionTime: number
  totalQuestions: number
  totalAttempts: number
}

interface QualityScoresResponse {
  scores: QualityScoreItem[]
}

interface InsightItem {
  type: 'positive' | 'warning' | 'info' | 'action'
  title: string
  description: string
  metric?: string
  value?: string
}

interface InsightsResponse {
  studentInsights: InsightItem[]
  instructorInsights: InsightItem[]
  generatedAt: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const spring = { type: 'spring' as const, stiffness: 400, damping: 25 }

function getDifficultyInfo(successRate: number): {
  label: string
  color: string
  bgColor: string
  textColor: string
  borderColor: string
  recommendation: string
} {
  if (successRate < 20) {
    return {
      label: 'Too Difficult',
      color: '#ef4444',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
      textColor: 'text-red-700 dark:text-red-400',
      borderColor: 'border-red-200 dark:border-red-800',
      recommendation: 'Consider revising this question or providing additional learning resources. Success rate is critically low.',
    }
  }
  if (successRate < 40) {
    return {
      label: 'Difficult',
      color: '#f97316',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
      textColor: 'text-orange-700 dark:text-orange-400',
      borderColor: 'border-orange-200 dark:border-orange-800',
      recommendation: 'Review the question clarity and related content. Students may need more preparation.',
    }
  }
  if (successRate < 70) {
    return {
      label: 'Normal',
      color: '#3b82f6',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      textColor: 'text-blue-700 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800',
      recommendation: 'This question is performing well within expected parameters.',
    }
  }
  if (successRate < 90) {
    return {
      label: 'Easy',
      color: '#22c55e',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      textColor: 'text-green-700 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-800',
      recommendation: 'Good performance. Consider using this question as a confidence builder.',
    }
  }
  return {
    label: 'Too Easy',
    color: '#14b8a6',
    bgColor: 'bg-teal-50 dark:bg-teal-950/30',
    textColor: 'text-teal-700 dark:text-teal-400',
    borderColor: 'border-teal-200 dark:border-teal-800',
    recommendation: 'Almost all students answer correctly. Consider increasing difficulty or replacing.',
  }
}

function getMasteryInfo(mastery: number): {
  label: string
  bgColor: string
  textColor: string
  color: string
} {
  if (mastery >= 70) {
    return { label: 'Strong', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30', textColor: 'text-emerald-700 dark:text-emerald-400', color: '#10b981' }
  }
  if (mastery >= 40) {
    return { label: 'Moderate', bgColor: 'bg-amber-50 dark:bg-amber-950/30', textColor: 'text-amber-700 dark:text-amber-400', color: '#f59e0b' }
  }
  return { label: 'Weak', bgColor: 'bg-rose-50 dark:bg-rose-950/30', textColor: 'text-rose-700 dark:text-rose-400', color: '#f43f5e' }
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 50) return 'Needs Improvement'
  return 'Poor'
}

const INSIGHT_STYLES: Record<string, { bg: string; border: string; text: string; iconBg: string; iconColor: string }> = {
  positive: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-400', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  warning: { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-400', iconBg: 'bg-amber-100 dark:bg-amber-900/40', iconColor: 'text-amber-600 dark:text-amber-400' },
  info: { bg: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-200 dark:border-cyan-800', text: 'text-cyan-700 dark:text-cyan-400', iconBg: 'bg-cyan-100 dark:bg-cyan-900/40', iconColor: 'text-cyan-600 dark:text-cyan-400' },
  action: { bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-400', iconBg: 'bg-orange-100 dark:bg-orange-900/40', iconColor: 'text-orange-600 dark:text-orange-400' },
}

// ═══════════════════════════════════════════════════════════════════════════════
// Circular Progress Component
// ═══════════════════════════════════════════════════════════════════════════════

function CircularProgress({ value, size = 120, strokeWidth = 8, color = '#10b981' }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(value, 100) / 100) * circumference
  const center = size / 2

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--muted)" strokeWidth={strokeWidth} opacity={0.3} />
        <circle
          cx={center}
          cy={center}
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
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{value}</span>
        <span className="text-[11px] text-muted-foreground">/100</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Loading Skeleton
// ═══════════════════════════════════════════════════════════════════════════════

function AssessmentSkeleton() {
  return (
    <div className="space-y-6 pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-11 rounded-2xl" />
          <div>
            <Skeleton className="h-7 w-52 rounded-xl" />
            <Skeleton className="h-4 w-72 rounded mt-1" />
          </div>
        </div>
        <Skeleton className="h-9 w-56 rounded-xl" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] rounded-2xl" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[140px] rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Empty State Component
// ═══════════════════════════════════════════════════════════════════════════════

function EmptyState({ icon: Icon, title, description, action }: { icon: React.ElementType; title: string; description: string; action?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 gap-3 text-center"
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50">
        <Icon className="size-7 text-muted-foreground" />
      </div>
      <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
      <p className="text-[13px] text-muted-foreground max-w-sm">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 1: Question Difficulty Analysis
// ═══════════════════════════════════════════════════════════════════════════════

function QuestionDifficultyTab({
  data,
  loading,
  courseId,
  instructorId,
}: {
  data: QuestionAnalyticsResponse | null
  loading: boolean
  courseId: string
  instructorId: string
}) {
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[100px] rounded-2xl" />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[160px] rounded-2xl" />
        ))}
      </div>
    )
  }

  if (!data || data.questions.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No Question Analytics"
        description="Select a course with quizzes and attempts to see question difficulty analysis."
      />
    )
  }

  const { summary, questions } = data

  const filteredQuestions = filterDifficulty === 'all'
    ? questions
    : questions.filter(q => {
        const info = getDifficultyInfo(q.successRate)
        return info.label.toLowerCase().replace(/\s+/g, '-') === filterDifficulty
      })

  return (
    <div className="space-y-5">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0 }}>
          <Card className="ios-shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex size-8 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-950/40">
                  <FileText className="size-4 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-[12px] font-medium text-muted-foreground">Total Questions</span>
              </div>
              <p className="text-2xl font-bold">{summary.totalQuestions}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.05 }}>
          <Card className="ios-shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
                  <Target className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-[12px] font-medium text-muted-foreground">Avg Success Rate</span>
              </div>
              <p className="text-2xl font-bold">{summary.avgSuccessRate}%</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.1 }}>
          <Card className="ios-shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex size-8 items-center justify-center rounded-xl bg-red-100 dark:bg-red-950/40">
                  <AlertTriangle className="size-4 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-[12px] font-medium text-muted-foreground">Problematic</span>
              </div>
              <p className="text-2xl font-bold">{summary.distribution.tooDifficult + summary.distribution.difficult}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.15 }}>
          <Card className="ios-shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex size-8 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-950/40">
                  <CheckCircle2 className="size-4 text-teal-600 dark:text-teal-400" />
                </div>
                <span className="text-[12px] font-medium text-muted-foreground">Well Balanced</span>
              </div>
              <p className="text-2xl font-bold">{summary.distribution.normal}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Distribution Badges */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.2 }}>
        <Card className="ios-shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-[13px] font-semibold mb-3">Difficulty Distribution</h3>
            <div className="flex flex-wrap gap-2">
              <Badge className={`${filterDifficulty === 'too-difficult' ? 'ring-2 ring-red-400' : ''} cursor-pointer bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-0 hover:bg-red-200 dark:hover:bg-red-950/60 text-[11px] px-3 py-1`} onClick={() => setFilterDifficulty(filterDifficulty === 'too-difficult' ? 'all' : 'too-difficult')}>
                Too Difficult: {summary.distribution.tooDifficult}
              </Badge>
              <Badge className={`${filterDifficulty === 'difficult' ? 'ring-2 ring-orange-400' : ''} cursor-pointer bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-0 hover:bg-orange-200 dark:hover:bg-orange-950/60 text-[11px] px-3 py-1`} onClick={() => setFilterDifficulty(filterDifficulty === 'difficult' ? 'all' : 'difficult')}>
                Difficult: {summary.distribution.difficult}
              </Badge>
              <Badge className={`${filterDifficulty === 'normal' ? 'ring-2 ring-blue-400' : ''} cursor-pointer bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-0 hover:bg-blue-200 dark:hover:bg-blue-950/60 text-[11px] px-3 py-1`} onClick={() => setFilterDifficulty(filterDifficulty === 'normal' ? 'all' : 'normal')}>
                Normal: {summary.distribution.normal}
              </Badge>
              <Badge className={`${filterDifficulty === 'easy' ? 'ring-2 ring-green-400' : ''} cursor-pointer bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 border-0 hover:bg-green-200 dark:hover:bg-green-950/60 text-[11px] px-3 py-1`} onClick={() => setFilterDifficulty(filterDifficulty === 'easy' ? 'all' : 'easy')}>
                Easy: {summary.distribution.easy}
              </Badge>
              <Badge className={`${filterDifficulty === 'too-easy' ? 'ring-2 ring-teal-400' : ''} cursor-pointer bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border-0 hover:bg-teal-200 dark:hover:bg-teal-950/60 text-[11px] px-3 py-1`} onClick={() => setFilterDifficulty(filterDifficulty === 'too-easy' ? 'all' : 'too-easy')}>
                Too Easy: {summary.distribution.tooEasy}
              </Badge>
            </div>
            {filterDifficulty !== 'all' && (
              <Button variant="ghost" size="sm" className="mt-2 h-7 text-[12px] rounded-lg" onClick={() => setFilterDifficulty('all')}>
                <X className="size-3 mr-1" />
                Clear Filter
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Question Cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredQuestions.map((q, index) => {
            const diffInfo = getDifficultyInfo(q.successRate)
            return (
              <motion.div
                key={q.questionId}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ ...spring, delay: index * 0.03 }}
              >
                <Card className={cn('ios-shadow-sm overflow-hidden border', diffInfo.borderColor)}>
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Question header */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-0 text-[10px] px-2 py-0.5 font-semibold">
                            {q.questionType.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-border/60 text-muted-foreground">
                            {q.quizTitle}
                          </Badge>
                        </div>

                        {/* Question text */}
                        <p className="text-[14px] font-medium leading-relaxed line-clamp-2">
                          {q.questionText}
                        </p>

                        {/* Recommendation */}
                        <div className={cn('flex items-start gap-2 rounded-lg p-2.5 text-[12px]', diffInfo.bgColor)}>
                          <Lightbulb className="size-3.5 shrink-0 mt-0.5" style={{ color: diffInfo.color }} />
                          <span className={diffInfo.textColor}>{diffInfo.recommendation}</span>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 shrink-0">
                        {/* Difficulty badge */}
                        <Badge className={cn('text-[11px] px-3 py-1 font-semibold border-0', diffInfo.bgColor, diffInfo.textColor)}>
                          {diffInfo.label}
                        </Badge>

                        {/* Success rate */}
                        <div className="text-center sm:text-right">
                          <p className="text-[11px] text-muted-foreground">Success Rate</p>
                          <p className="text-xl font-bold" style={{ color: diffInfo.color }}>{q.successRate}%</p>
                        </div>

                        {/* Attempts */}
                        <div className="flex items-center gap-1 text-[12px] text-muted-foreground">
                          <Users className="size-3" />
                          <span>{q.attempts} attempts</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${q.successRate}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: diffInfo.color }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 2: Distractor Analysis
// ═══════════════════════════════════════════════════════════════════════════════

function DistractorAnalysisTab({
  questions,
  courseId,
  instructorId,
}: {
  questions: QuestionAnalytics[] | null
  courseId: string
  instructorId: string
}) {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('')
  const [analysis, setAnalysis] = useState<DistractorAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedQuestionId || !instructorId) {
      setAnalysis(null)
      return
    }
    const fetchAnalysis = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/instructor/assessment/distractor-analysis?instructorId=${instructorId}&questionId=${selectedQuestionId}`)
        if (!res.ok) throw new Error('Failed to fetch distractor analysis')
        const json = await res.json()
        setAnalysis(json as DistractorAnalysis)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analysis')
      } finally {
        setLoading(false)
      }
    }
    fetchAnalysis()
  }, [selectedQuestionId, instructorId])

  // Auto-select first question
  useEffect(() => {
    if (questions && questions.length > 0 && !selectedQuestionId) {
      setSelectedQuestionId(questions[0].questionId)
    }
  }, [questions, selectedQuestionId])

  if (!questions || questions.length === 0) {
    return (
      <EmptyState
        icon={Eye}
        title="No Questions Available"
        description="Select a course with quiz attempts to analyze distractors."
      />
    )
  }

  return (
    <div className="space-y-5">
      {/* Question Selector */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="ios-shadow-sm">
          <CardContent className="p-4">
            <Label className="text-[12px] font-medium text-muted-foreground mb-2 block">Select a Question to Analyze</Label>
            <Select value={selectedQuestionId} onValueChange={setSelectedQuestionId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Choose a question..." />
              </SelectTrigger>
              <SelectContent>
                {questions.map(q => (
                  <SelectItem key={q.questionId} value={q.questionId}>
                    <span className="line-clamp-1 text-[13px]">{q.questionText.slice(0, 80)}{q.questionText.length > 80 ? '...' : ''}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </motion.div>

      {/* Analysis Content */}
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-[60px] rounded-2xl" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[80px] rounded-2xl" />
          ))}
        </div>
      )}

      {error && (
        <Card className="border-rose-200 dark:border-rose-800">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="size-5 text-rose-500" />
            <p className="text-[13px] text-rose-700 dark:text-rose-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {analysis && !loading && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Question info */}
          <Card className="ios-shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 border-0 text-[10px]">
                  {analysis.questionType.toUpperCase()}
                </Badge>
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  {analysis.totalAttempts} attempts
                </Badge>
              </div>
              <p className="text-[14px] font-medium leading-relaxed">{analysis.questionText}</p>
            </CardContent>
          </Card>

          {/* Distractor Summary */}
          <Card className={cn(
            'ios-shadow-sm border',
            analysis.weakDistractorCount > 0
              ? 'border-amber-200 dark:border-amber-800'
              : 'border-emerald-200 dark:border-emerald-800'
          )}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                {analysis.weakDistractorCount > 0 ? (
                  <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                ) : (
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                )}
                <span className="text-[13px] font-semibold">
                  {analysis.weakDistractorCount} of {analysis.totalDistractors} distractors are weak
                </span>
              </div>
              <p className="text-[12px] text-muted-foreground ml-6">{analysis.recommendation}</p>
            </CardContent>
          </Card>

          {/* Options Analysis */}
          <div className="space-y-3">
            {analysis.options.map((opt, idx) => (
              <motion.div
                key={opt.label}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring, delay: idx * 0.05 }}
              >
                <Card className={cn(
                  'ios-shadow-sm overflow-hidden',
                  opt.isCorrect && 'border-emerald-300 dark:border-emerald-700',
                  !opt.isCorrect && opt.selectionRate < 5 && 'border-amber-300 dark:border-amber-700'
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          {/* Option label */}
                          <div className={cn(
                            'flex size-7 items-center justify-center rounded-lg text-[12px] font-bold',
                            opt.isCorrect
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-muted/60 text-muted-foreground'
                          )}>
                            {opt.label}
                          </div>
                          {opt.isCorrect && (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0 text-[10px] px-2 py-0.5 font-semibold">
                              <ShieldCheck className="size-2.5 mr-0.5" />
                              CORRECT
                            </Badge>
                          )}
                          {!opt.isCorrect && opt.selectionRate < 5 && (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-0 text-[10px] px-2 py-0.5 font-semibold">
                              <AlertTriangle className="size-2.5 mr-0.5" />
                              WEAK DISTRACTOR
                            </Badge>
                          )}
                        </div>
                        <p className="text-[13px] leading-relaxed">{opt.text}</p>
                      </div>

                      {/* Selection stats */}
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold" style={{ color: opt.isCorrect ? '#10b981' : opt.selectionRate < 5 ? '#f59e0b' : '#6b7280' }}>
                          {opt.selectionRate}%
                        </p>
                        <p className="text-[11px] text-muted-foreground">{opt.selectionCount} selections</p>
                      </div>
                    </div>

                    {/* Selection rate bar */}
                    <div className="mt-3">
                      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${opt.selectionRate}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut', delay: idx * 0.05 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: opt.isCorrect ? '#10b981' : opt.selectionRate < 5 ? '#f59e0b' : '#94a3b8' }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 3: Learning Outcome Mapping
// ═══════════════════════════════════════════════════════════════════════════════

function LearningOutcomeTab({
  data,
  loading,
  courseId,
  instructorId,
  onRefresh,
}: {
  data: OutcomesResponse | null
  loading: boolean
  courseId: string
  instructorId: string
  onRefresh: () => void
}) {
  const [createOpen, setCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [expandedOutcomes, setExpandedOutcomes] = useState<Set<string>>(new Set())
  const [linkingQuestionId, setLinkingQuestionId] = useState<string | null>(null)
  const [linkingOutcomeId, setLinkingOutcomeId] = useState<string | null>(null)
  const [linking, setLinking] = useState(false)

  const toggleOutcome = (id: string) => {
    setExpandedOutcomes(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCreateOutcome = async () => {
    if (!newTitle.trim() || !courseId || !instructorId) return
    setCreating(true)
    try {
      const res = await fetch('/api/instructor/assessment/outcomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId,
          courseId,
          title: newTitle.trim(),
          description: newDescription.trim(),
        }),
      })
      if (!res.ok) throw new Error('Failed to create outcome')
      toast.success('Learning outcome created successfully')
      setNewTitle('')
      setNewDescription('')
      setCreateOpen(false)
      onRefresh()
    } catch {
      toast.error('Failed to create learning outcome')
    } finally {
      setCreating(false)
    }
  }

  const handleLinkQuestion = async () => {
    if (!linkingQuestionId || !linkingOutcomeId || !instructorId) return
    setLinking(true)
    try {
      const res = await fetch('/api/instructor/assessment/outcomes/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId,
          outcomeId: linkingOutcomeId,
          questionId: linkingQuestionId,
        }),
      })
      if (!res.ok) throw new Error('Failed to link question')
      toast.success('Question linked to outcome')
      setLinkingQuestionId(null)
      setLinkingOutcomeId(null)
      onRefresh()
    } catch {
      toast.error('Failed to link question')
    } finally {
      setLinking(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex justify-end">
          <Skeleton className="h-9 w-44 rounded-xl" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[140px] rounded-2xl" />
        ))}
      </div>
    )
  }

  if (!data || data.outcomes.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white">
                <Plus className="size-4 mr-1" />
                New Outcome
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Create Learning Outcome</DialogTitle>
                <DialogDescription>Define a new learning outcome for this course.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div>
                  <Label htmlFor="outcome-title">Title</Label>
                  <Input id="outcome-title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g., Understand recursion" className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label htmlFor="outcome-desc">Description</Label>
                  <Textarea id="outcome-desc" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Describe what students should be able to do..." className="rounded-xl mt-1 min-h-[80px] resize-none" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)} className="rounded-xl">Cancel</Button>
                <Button onClick={handleCreateOutcome} disabled={creating || !newTitle.trim()} className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white">
                  {creating ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Plus className="size-4 mr-1" />}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <EmptyState
          icon={Target}
          title="No Learning Outcomes"
          description="Create learning outcomes to map questions and track student mastery."
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="size-4 text-orange-500" />
          <span className="text-[13px] font-medium text-muted-foreground">{data.outcomes.length} Learning Outcomes</span>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white">
              <Plus className="size-4 mr-1" />
              New Outcome
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Create Learning Outcome</DialogTitle>
              <DialogDescription>Define a new learning outcome for this course.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label htmlFor="outcome-title2">Title</Label>
                <Input id="outcome-title2" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g., Understand recursion" className="rounded-xl mt-1" />
              </div>
              <div>
                <Label htmlFor="outcome-desc2">Description</Label>
                <Textarea id="outcome-desc2" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Describe what students should be able to do..." className="rounded-xl mt-1 min-h-[80px] resize-none" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleCreateOutcome} disabled={creating || !newTitle.trim()} className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white">
                {creating ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Plus className="size-4 mr-1" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Outcome Cards */}
      <div className="space-y-3">
        {data.outcomes.map((outcome, index) => {
          const mastery = getMasteryInfo(outcome.avgMastery)
          const isExpanded = expandedOutcomes.has(outcome.id)
          return (
            <motion.div
              key={outcome.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: index * 0.04 }}
            >
              <Card className="ios-shadow-sm overflow-hidden">
                <CardContent className="p-5">
                  {/* Outcome Header */}
                  <button
                    type="button"
                    className="w-full text-left flex items-start justify-between gap-3"
                    onClick={() => toggleOutcome(outcome.id)}
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-[14px] font-semibold">{outcome.title}</h4>
                        <Badge className={cn('text-[10px] px-2 py-0.5 font-semibold border-0', mastery.bgColor, mastery.textColor)}>
                          {mastery.label}
                        </Badge>
                      </div>
                      <p className="text-[12px] text-muted-foreground line-clamp-2">{outcome.description}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Mastery Progress */}
                      <div className="text-right hidden sm:block">
                        <p className="text-[11px] text-muted-foreground">Avg Mastery</p>
                        <p className="text-lg font-bold" style={{ color: mastery.color }}>{outcome.avgMastery}%</p>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <div className="size-10">
                          <svg width="40" height="40" className="-rotate-90">
                            <circle cx="20" cy="20" r="16" fill="none" stroke="var(--muted)" strokeWidth="3" opacity={0.3} />
                            <circle
                              cx="20" cy="20" r="16" fill="none" stroke={mastery.color} strokeWidth="3"
                              strokeDasharray={2 * Math.PI * 16}
                              strokeDashoffset={2 * Math.PI * 16 - (outcome.avgMastery / 100) * 2 * Math.PI * 16}
                              strokeLinecap="round"
                              className="transition-all duration-700"
                            />
                          </svg>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="size-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                      <FileText className="size-3" />
                      <span>{outcome.linkedQuestionCount} linked questions</span>
                    </div>
                    <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden max-w-[200px]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${outcome.avgMastery}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: mastery.color }}
                      />
                    </div>
                  </div>

                  {/* Expanded: Linked Questions */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={spring}
                        className="overflow-hidden"
                      >
                        <Separator className="my-3" />
                        <div className="space-y-2">
                          <h5 className="text-[12px] font-semibold text-muted-foreground">Linked Questions</h5>
                          {outcome.linkedQuestions.length > 0 ? (
                            <div className="space-y-2">
                              {outcome.linkedQuestions.map(lq => (
                                <div key={lq.questionId} className="flex items-start gap-2 rounded-lg bg-muted/40 p-2.5">
                                  <CircleDot className="size-3.5 shrink-0 mt-0.5 text-orange-500" />
                                  <p className="text-[12px] leading-relaxed">{lq.questionText}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[12px] text-muted-foreground italic">No questions linked yet.</p>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 rounded-lg text-[11px] mt-1"
                            onClick={() => {
                              setLinkingOutcomeId(outcome.id)
                            }}
                          >
                            <Link2 className="size-3 mr-1" />
                            Link Question
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Link Question Dialog */}
      <Dialog open={!!linkingOutcomeId} onOpenChange={(open) => { if (!open) setLinkingOutcomeId(null) }}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Link Question to Outcome</DialogTitle>
            <DialogDescription>Enter a question ID to link it to this learning outcome.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="link-qid">Question ID</Label>
            <Input
              id="link-qid"
              value={linkingQuestionId || ''}
              onChange={(e) => setLinkingQuestionId(e.target.value)}
              placeholder="Enter question ID..."
              className="rounded-xl mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkingOutcomeId(null)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleLinkQuestion} disabled={linking || !linkingQuestionId} className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white">
              {linking ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Link2 className="size-4 mr-1" />}
              Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 4: Assessment Intelligence
// ═══════════════════════════════════════════════════════════════════════════════

function AssessmentIntelligenceTab({
  courseId,
  instructorId,
}: {
  courseId: string
  instructorId: string
}) {
  const [insights, setInsights] = useState<InsightsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generated, setGenerated] = useState(false)

  const generateInsights = async () => {
    if (!courseId || !instructorId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/instructor/assessment/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorId, courseId }),
      })
      if (!res.ok) throw new Error('Failed to generate insights')
      const json = await res.json()
      setInsights(json as InsightsResponse)
      setGenerated(true)
      toast.success('Insights generated successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights')
      toast.error('Failed to generate insights')
    } finally {
      setLoading(false)
    }
  }

  const renderInsightCard = (insight: InsightItem, index: number) => {
    const styles = INSIGHT_STYLES[insight.type] || INSIGHT_STYLES.info
    const IconMap: Record<string, React.ElementType> = {
      positive: CheckCircle2,
      warning: AlertTriangle,
      info: Info,
      action: Zap,
    }
    const IconComp = IconMap[insight.type] || Info

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: index * 0.05 }}
        className={cn('rounded-xl border p-4', styles.bg, styles.border)}
      >
        <div className="flex items-start gap-3">
          <div className={cn('flex size-8 items-center justify-center rounded-lg shrink-0', styles.iconBg)}>
            <IconComp className={cn('size-4', styles.iconColor)} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={cn('text-[13px] font-semibold mb-1', styles.text)}>{insight.title}</h4>
            <p className="text-[12px] text-muted-foreground leading-relaxed">{insight.description}</p>
            {insight.metric && insight.value && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">{insight.metric}:</span>
                <span className={cn('text-[13px] font-bold', styles.text)}>{insight.value}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Generate Button */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="ios-shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold">AI-Powered Assessment Intelligence</h3>
                  <p className="text-[12px] text-muted-foreground">Analyze your assessments and get actionable recommendations</p>
                </div>
              </div>
              <Button
                onClick={generateInsights}
                disabled={loading || !courseId}
                className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-white shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 mr-1.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4 mr-1.5" />
                    {generated ? 'Regenerate Insights' : 'Generate Insights'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {error && (
        <Card className="border-rose-200 dark:border-rose-800">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="size-5 text-rose-500" />
            <p className="text-[13px] text-rose-700 dark:text-rose-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <Skeleton className="h-8 w-40 rounded-xl" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[90px] rounded-2xl" />
            ))}
          </div>
          <div className="space-y-3">
            <Skeleton className="h-8 w-40 rounded-xl" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[90px] rounded-2xl" />
            ))}
          </div>
        </div>
      )}

      {insights && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* Generated timestamp */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <RefreshCw className="size-3" />
            <span>Generated {new Date(insights.generatedAt).toLocaleString()}</span>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Student Insights Panel */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40">
                  <Users className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-[14px] font-semibold">Student Insights</h3>
              </div>
              <div className="space-y-3">
                {insights.studentInsights.map((insight, idx) => renderInsightCard(insight, idx))}
              </div>
              {insights.studentInsights.length === 0 && (
                <p className="text-[12px] text-muted-foreground italic py-4 text-center">No student insights available.</p>
              )}
            </div>

            {/* Instructor Insights Panel */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950/40">
                  <Brain className="size-3.5 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-[14px] font-semibold">Instructor Insights</h3>
              </div>
              <div className="space-y-3">
                {insights.instructorInsights.map((insight, idx) => renderInsightCard(insight, idx))}
              </div>
              {insights.instructorInsights.length === 0 && (
                <p className="text-[12px] text-muted-foreground italic py-4 text-center">No instructor insights available.</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {!insights && !loading && !error && (
        <EmptyState
          icon={Brain}
          title="Generate AI Insights"
          description="Click the button above to analyze your assessments and get AI-powered recommendations for improving question quality and student outcomes."
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Tab 5: Assessment Quality Score
// ═══════════════════════════════════════════════════════════════════════════════

function QualityScoreTab({
  data,
  loading,
}: {
  data: QualityScoresResponse | null
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[280px] rounded-2xl" />
        ))}
      </div>
    )
  }

  if (!data || data.scores.length === 0) {
    return (
      <EmptyState
        icon={Award}
        title="No Quality Scores"
        description="Select a course with quiz attempts to see assessment quality scores."
      />
    )
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="ios-shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Award className="size-5 text-orange-500" />
              <div>
                <h3 className="text-[14px] font-semibold">Assessment Quality Overview</h3>
                <p className="text-[12px] text-muted-foreground">{data.scores.length} quizzes analyzed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quiz Score Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {data.scores.map((quiz, index) => {
          const scoreColor = getScoreColor(quiz.overallScore)
          const scoreLabel = getScoreLabel(quiz.overallScore)
          return (
            <motion.div
              key={quiz.quizId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: index * 0.06 }}
            >
              <Card className="ios-shadow-sm overflow-hidden">
                <CardContent className="p-5">
                  {/* Quiz title & score */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14px] font-semibold line-clamp-1">{quiz.quizTitle}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          className="text-[10px] px-2 py-0.5 font-semibold border-0"
                          style={{
                            backgroundColor: scoreColor + '20',
                            color: scoreColor,
                          }}
                        >
                          {scoreLabel}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {quiz.totalQuestions} questions
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {quiz.totalAttempts} attempts
                        </span>
                      </div>
                    </div>

                    {/* Circular score */}
                    <CircularProgress
                      value={quiz.overallScore}
                      size={90}
                      strokeWidth={6}
                      color={scoreColor}
                    />
                  </div>

                  <Separator className="my-4" />

                  {/* Breakdown */}
                  <div className="space-y-3">
                    {/* Difficulty Balance */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-muted-foreground">Difficulty Balance</span>
                        <span className="font-semibold">{quiz.difficultyBalance}/100</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${quiz.difficultyBalance}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className="h-full rounded-full bg-orange-500"
                        />
                      </div>
                    </div>

                    {/* Question Variety */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-muted-foreground">Question Variety</span>
                        <span className="font-semibold">{quiz.questionVariety}/100</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${quiz.questionVariety}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                          className="h-full rounded-full bg-amber-500"
                        />
                      </div>
                    </div>

                    {/* Outcome Coverage */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-muted-foreground">Outcome Coverage</span>
                        <span className="font-semibold">{quiz.outcomeCoverage}/100</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${quiz.outcomeCoverage}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                          className="h-full rounded-full bg-teal-500"
                        />
                      </div>
                    </div>

                    {/* Avg Completion Time */}
                    <div className="flex items-center justify-between text-[12px] pt-1">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" />
                        Avg Completion Time
                      </span>
                      <span className="font-semibold">{quiz.avgCompletionTime} min</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// Simple Clock icon since we imported it
function Clock({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════

export function InstructorAssessmentView() {
  const { currentUser } = useAppStore()
  const instructorId = currentUser?.id || ''

  // Course selection
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [coursesLoading, setCoursesLoading] = useState(true)

  // Tab data states
  const [questionAnalytics, setQuestionAnalytics] = useState<QuestionAnalyticsResponse | null>(null)
  const [qaLoading, setQaLoading] = useState(false)

  const [outcomes, setOutcomes] = useState<OutcomesResponse | null>(null)
  const [outcomesLoading, setOutcomesLoading] = useState(false)

  const [qualityScores, setQualityScores] = useState<QualityScoresResponse | null>(null)
  const [scoresLoading, setScoresLoading] = useState(false)

  const [activeTab, setActiveTab] = useState('difficulty')

  // ─── Fetch Courses ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!instructorId) return
    const fetchCourses = async () => {
      setCoursesLoading(true)
      try {
        const res = await fetch(`/api/instructor/courses?instructorId=${instructorId}`)
        if (!res.ok) throw new Error('Failed to fetch courses')
        const json = await res.json()
        const courseList = (json.courses || json || []).map((c: { id: string; title: string }) => ({ id: c.id, title: c.title }))
        setCourses(courseList)
        if (courseList.length > 0 && !selectedCourseId) {
          setSelectedCourseId(courseList[0].id)
        }
      } catch {
        setCourses([])
      } finally {
        setCoursesLoading(false)
      }
    }
    fetchCourses()
  }, [instructorId])

  // ─── Fetch Question Analytics ───────────────────────────────────────────
  useEffect(() => {
    if (!instructorId || !selectedCourseId) return
    const fetchData = async () => {
      setQaLoading(true)
      try {
        const res = await fetch(`/api/instructor/assessment/question-analytics?instructorId=${instructorId}&courseId=${selectedCourseId}`)
        if (!res.ok) {
          setQuestionAnalytics(null)
          return
        }
        const json = await res.json()
        setQuestionAnalytics(json as QuestionAnalyticsResponse)
      } catch {
        setQuestionAnalytics(null)
      } finally {
        setQaLoading(false)
      }
    }
    fetchData()
  }, [instructorId, selectedCourseId])

  // ─── Fetch Outcomes ─────────────────────────────────────────────────────
  const fetchOutcomes = useCallback(async () => {
    if (!instructorId || !selectedCourseId) return
    setOutcomesLoading(true)
    try {
      const res = await fetch(`/api/instructor/assessment/outcomes?instructorId=${instructorId}&courseId=${selectedCourseId}`)
      if (!res.ok) {
        setOutcomes(null)
        return
      }
      const json = await res.json()
      setOutcomes(json as OutcomesResponse)
    } catch {
      setOutcomes(null)
    } finally {
      setOutcomesLoading(false)
    }
  }, [instructorId, selectedCourseId])

  useEffect(() => {
    fetchOutcomes()
  }, [fetchOutcomes])

  // ─── Fetch Quality Scores ───────────────────────────────────────────────
  useEffect(() => {
    if (!instructorId || !selectedCourseId) return
    const fetchData = async () => {
      setScoresLoading(true)
      try {
        const res = await fetch(`/api/instructor/assessment/quality-scores?instructorId=${instructorId}&courseId=${selectedCourseId}`)
        if (!res.ok) {
          setQualityScores(null)
          return
        }
        const json = await res.json()
        setQualityScores(json as QualityScoresResponse)
      } catch {
        setQualityScores(null)
      } finally {
        setScoresLoading(false)
      }
    }
    fetchData()
  }, [instructorId, selectedCourseId])

  // Memoized question list for distractor tab
  const questionList = useMemo(() => questionAnalytics?.questions || [], [questionAnalytics])

  // ─── Loading state ──────────────────────────────────────────────────────
  if (coursesLoading) {
    return (
      <div className="pb-4">
        <AssessmentSkeleton />
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6 pb-4">
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER SECTION
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
      >
        <div className="relative rounded-2xl overflow-hidden ios-shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 animate-gradient-shift opacity-10" />
          <div className="relative p-5 bg-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Title */}
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white ios-shadow-sm">
                  <BarChart3 className="size-5" />
                </div>
                <div>
                  <h1 className="text-[24px] sm:text-[28px] font-bold tracking-tight">Smart Assessment System</h1>
                  <p className="text-[13px] text-muted-foreground">
                    Are questions good? Are students learning? Which concepts are difficult?
                  </p>
                </div>
              </div>

              {/* Course Selector */}
              <div className="shrink-0">
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger className="w-[220px] rounded-xl">
                    <BookOpen className="size-4 mr-2 text-orange-500" />
                    <SelectValue placeholder="Select course..." />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <span className="text-[13px]">{c.title}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          NO COURSE SELECTED STATE
          ═══════════════════════════════════════════════════════════════════ */}
      {!selectedCourseId && courses.length === 0 && (
        <EmptyState
          icon={BookOpen}
          title="No Courses Found"
          description="Create a course first to use the Smart Assessment System."
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TABS
          ═══════════════════════════════════════════════════════════════════ */}
      {selectedCourseId && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
            <TabsList className="w-full flex h-auto p-1 rounded-xl bg-muted/50 overflow-x-auto">
              <TabsTrigger value="difficulty" className="flex-1 min-w-[140px] rounded-lg text-[12px] sm:text-[13px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
                <BarChart3 className="size-4 mr-1.5" />
                Difficulty
              </TabsTrigger>
              <TabsTrigger value="distractor" className="flex-1 min-w-[140px] rounded-lg text-[12px] sm:text-[13px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
                <Eye className="size-4 mr-1.5" />
                Distractors
              </TabsTrigger>
              <TabsTrigger value="outcomes" className="flex-1 min-w-[140px] rounded-lg text-[12px] sm:text-[13px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
                <Target className="size-4 mr-1.5" />
                Outcomes
              </TabsTrigger>
              <TabsTrigger value="intelligence" className="flex-1 min-w-[140px] rounded-lg text-[12px] sm:text-[13px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
                <Brain className="size-4 mr-1.5" />
                Intelligence
              </TabsTrigger>
              <TabsTrigger value="quality" className="flex-1 min-w-[140px] rounded-lg text-[12px] sm:text-[13px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-sm">
                <Award className="size-4 mr-1.5" />
                Quality
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Question Difficulty Analysis */}
            <TabsContent value="difficulty" className="mt-0">
              <QuestionDifficultyTab
                data={questionAnalytics}
                loading={qaLoading}
                courseId={selectedCourseId}
                instructorId={instructorId}
              />
            </TabsContent>

            {/* Tab 2: Distractor Analysis */}
            <TabsContent value="distractor" className="mt-0">
              <DistractorAnalysisTab
                questions={questionList}
                courseId={selectedCourseId}
                instructorId={instructorId}
              />
            </TabsContent>

            {/* Tab 3: Learning Outcome Mapping */}
            <TabsContent value="outcomes" className="mt-0">
              <LearningOutcomeTab
                data={outcomes}
                loading={outcomesLoading}
                courseId={selectedCourseId}
                instructorId={instructorId}
                onRefresh={fetchOutcomes}
              />
            </TabsContent>

            {/* Tab 4: Assessment Intelligence */}
            <TabsContent value="intelligence" className="mt-0">
              <AssessmentIntelligenceTab
                courseId={selectedCourseId}
                instructorId={instructorId}
              />
            </TabsContent>

            {/* Tab 5: Assessment Quality Score */}
            <TabsContent value="quality" className="mt-0">
              <QualityScoreTab
                data={qualityScores}
                loading={scoresLoading}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </div>
  )
}
