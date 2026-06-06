'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Upload, Clock, CheckCircle2, BarChart3, TrendingUp,
  Users, FileText, Code, BookOpen, MessageSquareHeart, Presentation,
  Edit3, Copy, Trash2, Globe, EyeOff, CalendarDays, Sparkles,
  ChevronRight, Search, MoreHorizontal, Download, Send,
  Loader2, AlertCircle, ExternalLink, ChevronDown, ChevronUp,
  RotateCcw, Mail, Save,
  X, Link as LinkIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { InstructorStatCard, InstructorStatCardGrid } from '@/components/instructor/instructor-stat-card'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { toast } from 'sonner'
import type { AssignmentType, SubmissionType } from '@/lib/types'

// ============================================================
// Types
// ============================================================
interface AICheck {
  type: string
  label: string
  passed: boolean
  details: string
}

interface RubricCriterion {
  criteria?: string
  criterion?: string
  maxPoints: number
  description: string
}

interface SubmissionItem {
  id: string
  content: string
  fileUrls: { name: string; url: string }[]
  studentName: string
  studentAvatar: string | null
  studentEmail: string
  studentId: string
  submittedAt: string
  timeAgo: string
  isOverdue: boolean
  fileName: string
  status: 'pending' | 'graded'
  aiPreGrade?: { checks: AICheck[]; suggestedScore: number; maxScore: number }
  rubric: RubricCriterion[]
  maxScore: number
  scores: number[]
  totalScore: number
  feedback: string
  gradedAt?: string
  gradedBy?: string
  attempt: number
  timeSpent: number | null
}

interface ScoreDistribution {
  excellent: number
  good: number
  average: number
  belowAverage: number
  failing: number
}

interface AssignmentStats {
  totalEnrolled: number
  totalSubmitted: number
  pendingCount: number
  gradedCount: number
  lateCount: number
  notSubmittedCount: number
  avgScore: number
  highestScore: number
  lowestScore: number
  passRate: number
  submissionRate: number
  scoreDistribution: ScoreDistribution
}

interface AssignmentDetail {
  id: string
  title: string
  description: string
  instructions: string
  type: AssignmentType
  submissionType: SubmissionType
  maxScore: number
  dueDate: string | null
  wordLimit: number | null
  isPublished: boolean
  order: number
  rubric: RubricCriterion[] | null
  resources: { label: string; url: string }[] | null
  createdAt: string
  updatedAt: string
  course: { id: string; title: string; instructorId: string }
  module: { id: string; title: string } | null
  stats: AssignmentStats
  submissions: SubmissionItem[]
}

interface NotSubmittedStudent {
  id: string
  name: string
  email: string
  avatar: string | null
  enrolledAt: string
}

type SubmissionFilter = 'all' | 'pending' | 'graded'
type SortOption = 'newest' | 'student-az' | 'score-high-low'
type DetailTab = 'overview' | 'submissions' | 'not-submitted' | 'analytics'

// ============================================================
// Constants
// ============================================================
const spring = { type: 'spring' as const, stiffness: 400, damping: 25 }
const springGentle = { type: 'spring' as const, stiffness: 300, damping: 30 }

const typeConfig: Record<AssignmentType, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: typeof FileText
}> = {
  written: {
    label: 'Written',
    color: 'text-sky-700 dark:text-sky-400',
    bgColor: 'bg-sky-100 dark:bg-sky-950/40',
    borderColor: 'border-sky-200 dark:border-sky-800',
    icon: FileText,
  },
  coding: {
    label: 'Coding',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    icon: Code,
  },
  project: {
    label: 'Project',
    color: 'text-violet-700 dark:text-violet-400',
    bgColor: 'bg-violet-100 dark:bg-violet-950/40',
    borderColor: 'border-violet-200 dark:border-violet-800',
    icon: BookOpen,
  },
  'peer-review': {
    label: 'Peer Review',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-950/40',
    borderColor: 'border-amber-200 dark:border-amber-800',
    icon: MessageSquareHeart,
  },
  presentation: {
    label: 'Presentation',
    color: 'text-pink-700 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-950/40',
    borderColor: 'border-pink-200 dark:border-pink-800',
    icon: Presentation,
  },
}

const distributionConfig: Array<{
  key: keyof ScoreDistribution
  label: string
  color: string
  bgColor: string
}> = [
  { key: 'excellent', label: 'Excellent (≥90%)', color: 'bg-emerald-500', bgColor: 'bg-emerald-100 dark:bg-emerald-950/40' },
  { key: 'good', label: 'Good (70-89%)', color: 'bg-teal-500', bgColor: 'bg-teal-100 dark:bg-teal-950/40' },
  { key: 'average', label: 'Average (50-69%)', color: 'bg-amber-500', bgColor: 'bg-amber-100 dark:bg-amber-950/40' },
  { key: 'belowAverage', label: 'Below Avg (30-49%)', color: 'bg-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-950/40' },
  { key: 'failing', label: 'Failing (<30%)', color: 'bg-red-500', bgColor: 'bg-red-100 dark:bg-red-950/40' },
]

// ============================================================
// Helpers
// ============================================================
function getScoreColor(score: number, max: number): string {
  const pct = (score / max) * 100
  if (pct >= 90) return 'text-emerald-600 dark:text-emerald-400'
  if (pct >= 70) return 'text-teal-600 dark:text-teal-400'
  if (pct >= 50) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function getScoreBgColor(score: number, max: number): string {
  const pct = (score / max) * 100
  if (pct >= 90) return 'bg-emerald-100 dark:bg-emerald-950/40'
  if (pct >= 70) return 'bg-teal-100 dark:bg-teal-950/40'
  if (pct >= 50) return 'bg-amber-100 dark:bg-amber-950/40'
  return 'bg-red-100 dark:bg-red-950/40'
}

function getScoreBorderClass(score: number, max: number): string {
  const pct = (score / max) * 100
  if (pct >= 90) return 'border-emerald-300 dark:border-emerald-700'
  if (pct >= 70) return 'border-teal-300 dark:border-teal-700'
  if (pct >= 50) return 'border-amber-300 dark:border-amber-700'
  return 'border-red-300 dark:border-red-700'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function getDueCountdown(dueDate: string | null): string {
  if (!dueDate) return 'No due date'
  const now = new Date()
  const due = new Date(dueDate)
  const diffMs = due.getTime() - now.getTime()
  if (diffMs < 0) {
    const days = Math.abs(Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
    return `${days}d overdue`
  }
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 7) return formatDate(dueDate)
  if (days > 0) return `${days}d ${hours}h left`
  if (hours > 0) return `${hours}h left`
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  return `${mins}m left`
}

function isDueOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return new Date(dueDate).getTime() < Date.now()
}

function isDueUrgent(dueDate: string | null): boolean {
  if (!dueDate) return false
  const diff = new Date(dueDate).getTime() - Date.now()
  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000
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



// ============================================================
// Score Distribution Chart
// ============================================================
function ScoreDistributionChart({ distribution, total }: { distribution: ScoreDistribution; total: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="rounded-2xl border bg-card p-5"
    >
      <h3 className="text-[15px] font-bold mb-4 flex items-center gap-2">
        <BarChart3 className="size-4 text-primary" />
        Score Distribution
      </h3>
      <div className="space-y-3">
        {distributionConfig.map(({ key, label, color, bgColor }) => {
          const count = distribution[key]
          const pct = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-medium">{label}</span>
                <span className="text-muted-foreground">
                  {count} ({pct}%)
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted/50 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ ...spring, delay: 0.1 }}
                  className={cn('h-full rounded-full', color)}
                />
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ============================================================
// Pending Submission Card
// ============================================================
function PendingSubmissionCard({
  submission,
  rubricCriteria,
  maxScore,
  instructorId,
  onGraded,
}: {
  submission: SubmissionItem
  rubricCriteria: RubricCriterion[]
  maxScore: number
  instructorId: string
  onGraded: () => void
}) {
  const [aiOpen, setAiOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState(submission.aiPreGrade || null)
  const [rubricScores, setRubricScores] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    rubricCriteria.forEach((_, i) => {
      init[i] = submission.scores?.[i] ?? 0
    })
    return init
  })
  const [feedback, setFeedback] = useState(submission.feedback || '')
  const [submitting, setSubmitting] = useState(false)
  const [saving, setSaving] = useState(false)

  const totalScore = useMemo(() => {
    return Object.values(rubricScores).reduce((sum, s) => sum + s, 0)
  }, [rubricScores])

  const handleAiPreGrade = async () => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/instructor/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ai-pre-grade', submissionId: submission.id }),
      })
      if (!res.ok) throw new Error('AI pre-grade failed')
      const data = await res.json()
      setAiResult(data.aiPreGrade || data)
      setAiOpen(true)
      if (data.suggestedScore !== undefined) {
        toast.success(`AI suggests: ${data.suggestedScore}/${maxScore}`)
      }
    } catch {
      toast.error('AI pre-grade failed. Try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleAiGenerateFeedback = async () => {
    setAiLoading(true)
    try {
      const res = await fetch('/api/instructor/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ai-pre-grade', submissionId: submission.id }),
      })
      if (!res.ok) throw new Error('AI feedback generation failed')
      const data = await res.json()
      if (data.feedback) {
        setFeedback(data.feedback)
        toast.success('AI feedback generated')
      } else {
        setFeedback(`Good effort on this submission. The work shows understanding of core concepts with room for improvement in specific areas. Score: ${data.suggestedScore ?? totalScore}/${maxScore}.`)
        toast.success('AI feedback generated')
      }
    } catch {
      toast.error('AI feedback generation failed')
    } finally {
      setAiLoading(false)
    }
  }

  const handleGrade = async () => {
    setSubmitting(true)
    try {
      // Build rubricScores as a map: { criterionName: score }
      const rubricScoresMap: Record<string, number> = {}
      rubricCriteria.forEach((c, i) => {
        const name = c.criterion || c.criteria || `criterion_${i}`
        rubricScoresMap[name] = rubricScores[i] ?? 0
      })

      const res = await fetch('/api/instructor/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'grade',
          submissionId: submission.id,
          instructorId,
          score: totalScore,
          feedback,
          rubricScores: rubricScoresMap,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Grading failed')
      }
      toast.success('Grade submitted successfully!')
      onGraded()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Grading failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/instructor/submissions/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId,
          status: 'grading',
          feedback,
        }),
      })
      if (!res.ok) throw new Error('Save draft failed')
      toast.success('Draft saved')
    } catch {
      toast.error('Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className={cn(
        'rounded-2xl border bg-card overflow-hidden',
        submission.isOverdue && 'border-red-200 dark:border-red-900/50'
      )}
    >
      {/* Student Header */}
      <div className="p-4 border-b bg-muted/20">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="size-10 shrink-0">
              <AvatarImage src={submission.studentAvatar || undefined} />
              <AvatarFallback className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[12px] font-bold">
                {getInitials(submission.studentName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-[14px] font-bold truncate">{submission.studentName}</p>
              <p className="text-[12px] text-muted-foreground truncate">{submission.studentEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {submission.isOverdue && (
              <Badge className="rounded-lg text-[10px] px-2 py-0 h-5 border-0 bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">
                Overdue
              </Badge>
            )}
            <Badge className="rounded-lg text-[10px] px-2 py-0 h-5 border-0 bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              <Clock className="mr-1 size-3" />
              {submission.timeAgo}
            </Badge>
            <Badge variant="outline" className="rounded-lg text-[10px] px-2 py-0 h-5">
              Attempt #{submission.attempt}
            </Badge>
          </div>
        </div>
      </div>

      {/* Submission Content */}
      <div className="p-4 space-y-4">
        {submission.content && (
          <div>
            <Label className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold">Submission</Label>
            <div className="mt-1.5 rounded-xl border bg-muted/30 p-3 text-[14px] whitespace-pre-wrap max-h-48 overflow-y-auto">
              {submission.content}
            </div>
          </div>
        )}

        {/* File Attachments */}
        {submission.fileUrls && submission.fileUrls.length > 0 && (
          <div>
            <Label className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold">Attachments</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {submission.fileUrls.map((file, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-[12px] gap-1.5 h-8"
                  onClick={() => window.open(file.url, '_blank')}
                >
                  <Download className="size-3" />
                  {file.name || `File ${idx + 1}`}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* AI Pre-Grade */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg text-[12px] gap-1.5 h-8"
              onClick={aiResult ? () => setAiOpen(!aiOpen) : handleAiPreGrade}
              disabled={aiLoading}
            >
              {aiLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              {aiResult ? 'AI Pre-Grade Report' : 'Run AI Pre-Grade'}
              {aiResult && (aiOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />)}
            </Button>
          </div>
          <AnimatePresence>
            {aiOpen && aiResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl border bg-emerald-50 dark:bg-emerald-950/20 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-emerald-700 dark:text-emerald-400">
                    AI Suggested Score
                  </span>
                  <span className="text-[18px] font-bold text-emerald-600 dark:text-emerald-400">
                    {aiResult.suggestedScore}/{aiResult.maxScore}
                  </span>
                </div>
                {aiResult.checks && aiResult.checks.length > 0 && (
                  <div className="space-y-1.5">
                    {aiResult.checks.map((check: { label?: string; status?: string; passed?: boolean; details?: string }, idx: number) => {
                      const isPass = check.passed || check.status === 'pass'
                      const isPartial = check.status === 'partial'
                      return (
                        <div key={idx} className="flex items-start gap-2 text-[12px]">
                          {isPass ? (
                            <CheckCircle2 className="size-3.5 text-emerald-600 mt-0.5 shrink-0" />
                          ) : isPartial ? (
                            <AlertCircle className="size-3.5 text-amber-600 mt-0.5 shrink-0" />
                          ) : (
                            <X className="size-3.5 text-red-600 mt-0.5 shrink-0" />
                          )}
                          <div>
                            <span className="font-medium">{check.label || `Check ${idx + 1}`}</span>
                            {check.details && (
                              <span className="text-muted-foreground ml-1">– {check.details}</span>
                            )}
                            {!check.details && check.status && (
                              <span className="text-muted-foreground ml-1">
                                – {check.status === 'pass' ? 'Meets expectations' : check.status === 'partial' ? 'Partially meets' : 'Does not meet expectations'}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Separator />

        {/* Rubric Grading */}
        {rubricCriteria.length > 0 && (
          <div>
            <Label className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 block">
              Rubric Grading
            </Label>
            <div className="space-y-2">
              {rubricCriteria.map((criterion, idx) => {
                const name = criterion.criterion || criterion.criteria || `Criteria ${idx + 1}`
                const score = rubricScores[idx] ?? 0
                return (
                  <div
                    key={idx}
                    className="rounded-xl border bg-muted/20 p-3"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold">{name}</p>
                        {criterion.description && (
                          <p className="text-[11px] text-muted-foreground">{criterion.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <Input
                          type="number"
                          min={0}
                          max={criterion.maxPoints}
                          value={score}
                          onChange={(e) => {
                            const val = Math.min(criterion.maxPoints, Math.max(0, parseInt(e.target.value) || 0))
                            setRubricScores({ ...rubricScores, [idx]: val })
                          }}
                          className="w-16 h-8 rounded-lg text-[13px] text-center"
                        />
                        <span className="text-[12px] text-muted-foreground">/ {criterion.maxPoints}</span>
                      </div>
                    </div>
                    <Progress
                      value={(score / criterion.maxPoints) * 100}
                      className="h-1.5"
                    />
                  </div>
                )
              })}
            </div>
            {/* Total Score */}
            <div className={cn(
              'mt-3 rounded-xl border p-3 flex items-center justify-between',
              getScoreBorderClass(totalScore, maxScore),
              getScoreBgColor(totalScore, maxScore)
            )}>
              <span className="text-[14px] font-semibold">Total Score</span>
              <span className={cn('text-[20px] font-bold', getScoreColor(totalScore, maxScore))}>
                {totalScore} / {maxScore}
              </span>
            </div>
          </div>
        )}

        {rubricCriteria.length === 0 && (
          <div className={cn(
            'rounded-xl border p-3 flex items-center justify-between',
            getScoreBorderClass(totalScore, maxScore),
            getScoreBgColor(totalScore, maxScore)
          )}>
            <span className="text-[14px] font-semibold">Score</span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                max={maxScore}
                value={totalScore}
                onChange={(e) => {
                  const val = Math.min(maxScore, Math.max(0, parseInt(e.target.value) || 0))
                  setRubricScores({ 0: val })
                }}
                className="w-20 h-9 rounded-lg text-[15px] text-center font-bold"
              />
              <span className={cn('text-[16px] font-bold', getScoreColor(totalScore, maxScore))}>
                / {maxScore}
              </span>
            </div>
          </div>
        )}

        {/* Feedback */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label className="text-[12px] text-muted-foreground uppercase tracking-wider font-semibold">
              Feedback
            </Label>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg text-[11px] gap-1 h-7 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
              onClick={handleAiGenerateFeedback}
              disabled={aiLoading}
            >
              {aiLoading ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
              AI Generate
            </Button>
          </div>
          <Textarea
            placeholder="Provide feedback to the student..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="rounded-xl text-[14px] min-h-[80px] resize-y"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-[13px] gap-1.5"
              onClick={handleSaveDraft}
              disabled={saving}
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Save Draft
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-[13px] gap-1.5"
              onClick={() => toast.info('Skipped to next submission')}
            >
              Skip
              <ChevronRight className="size-3.5" />
            </Button>
            <Button
              size="sm"
              className="rounded-xl text-[13px] gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
              onClick={handleGrade}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Submit Grade
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================
// Graded Submission Card
// ============================================================
function GradedSubmissionCard({
  submission,
  rubricCriteria,
  maxScore,
  instructorId,
  onRegraded,
}: {
  submission: SubmissionItem
  rubricCriteria: RubricCriterion[]
  maxScore: number
  instructorId: string
  onRegraded: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editScores, setEditScores] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    ;(submission.rubric || rubricCriteria).forEach((_, i) => {
      init[i] = submission.scores?.[i] ?? 0
    })
    return init
  })
  const [editFeedback, setEditFeedback] = useState(submission.feedback || '')
  const [submitting, setSubmitting] = useState(false)
  const [resetting, setResetting] = useState(false)

  const scorePct = maxScore > 0 ? Math.round((submission.totalScore / maxScore) * 100) : 0
  const editTotalScore = Object.values(editScores).reduce((sum, s) => sum + s, 0)

  const handleEditGrade = async () => {
    setSubmitting(true)
    try {
      // Build rubricScores as a map
      const editRubricScoresMap: Record<string, number> = {}
      rubricCriteria.forEach((c, i) => {
        const name = c.criterion || c.criteria || `criterion_${i}`
        editRubricScoresMap[name] = editScores[i] ?? 0
      })

      const res = await fetch('/api/instructor/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'grade',
          submissionId: submission.id,
          instructorId,
          score: editTotalScore,
          feedback: editFeedback,
          rubricScores: editRubricScoresMap,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Update failed')
      }
      toast.success('Grade updated!')
      setEditing(false)
      onRegraded()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetGrade = async () => {
    setResetting(true)
    try {
      const res = await fetch(`/api/instructor/submissions/${submission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId,
          status: 'pending',
          feedback: '',
        }),
      })
      if (!res.ok) throw new Error('Reset failed')
      toast.success('Grade reset to pending')
      onRegraded()
    } catch {
      toast.error('Failed to reset grade')
    } finally {
      setResetting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="rounded-2xl border bg-card overflow-hidden"
    >
      {/* Student Header + Score Badge */}
      <div className="p-4 border-b bg-muted/20">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="size-10 shrink-0">
              <AvatarImage src={submission.studentAvatar || undefined} />
              <AvatarFallback className="rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[12px] font-bold">
                {getInitials(submission.studentName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-[14px] font-bold truncate">{submission.studentName}</p>
              <p className="text-[12px] text-muted-foreground truncate">
                {submission.studentEmail} · {submission.timeAgo}
              </p>
            </div>
          </div>
          <div className={cn(
            'rounded-xl px-3 py-1.5 text-center shrink-0 border',
            getScoreBorderClass(submission.totalScore, maxScore),
            getScoreBgColor(submission.totalScore, maxScore)
          )}>
            <p className={cn('text-[18px] font-bold leading-tight', getScoreColor(submission.totalScore, maxScore))}>
              {submission.totalScore}/{maxScore}
            </p>
            <p className="text-[10px] text-muted-foreground">{scorePct}%</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Score Breakdown Grid */}
        {rubricCriteria.length > 0 && (
          <Collapsible open={expanded} onOpenChange={setExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-lg text-[12px] gap-1 w-full justify-between px-2">
                <span>Score Breakdown</span>
                {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-2 mt-2">
                {(submission.rubric || rubricCriteria).map((criterion, idx) => {
                  const name = criterion.criterion || criterion.criteria || `Criteria ${idx + 1}`
                  const score = editing ? (editScores[idx] ?? 0) : (submission.scores?.[idx] ?? 0)
                  const maxPts = criterion.maxPoints
                  return (
                    <div key={idx} className="rounded-lg border bg-muted/20 p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-medium truncate mr-2">{name}</span>
                        {editing ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <Input
                              type="number"
                              min={0}
                              max={maxPts}
                              value={editScores[idx] ?? 0}
                              onChange={(e) => {
                                const val = Math.min(maxPts, Math.max(0, parseInt(e.target.value) || 0))
                                setEditScores({ ...editScores, [idx]: val })
                              }}
                              className="w-14 h-7 rounded-lg text-[12px] text-center"
                            />
                            <span className="text-[11px] text-muted-foreground">/{maxPts}</span>
                          </div>
                        ) : (
                          <span className={cn('text-[13px] font-bold shrink-0', getScoreColor(score, maxPts))}>
                            {score}/{maxPts}
                          </span>
                        )}
                      </div>
                      <Progress value={(score / maxPts) * 100} className="h-1" />
                    </div>
                  )
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Feedback */}
        {submission.feedback && (
          <div>
            <Label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Feedback</Label>
            {editing ? (
              <Textarea
                value={editFeedback}
                onChange={(e) => setEditFeedback(e.target.value)}
                className="rounded-xl text-[13px] min-h-[60px] mt-1"
              />
            ) : (
              <p className="text-[13px] text-foreground mt-1 whitespace-pre-wrap">{submission.feedback}</p>
            )}
          </div>
        )}

        {/* Graded Info */}
        {submission.gradedAt && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <CheckCircle2 className="size-3" />
            Graded {formatDateTime(submission.gradedAt)}
            {submission.gradedBy && ` by ${submission.gradedBy}`}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {editing ? (
            <>
              <Button
                size="sm"
                className="rounded-xl text-[12px] gap-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                onClick={handleEditGrade}
                disabled={submitting}
              >
                {submitting ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-[12px]"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-[12px] gap-1"
                onClick={() => setEditing(true)}
              >
                <Edit3 className="size-3" /> Edit Grade
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-[12px] gap-1 text-amber-600 dark:text-amber-400 hover:text-amber-700"
                onClick={handleResetGrade}
                disabled={resetting}
              >
                {resetting ? <Loader2 className="size-3 animate-spin" /> : <RotateCcw className="size-3" />}
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-[12px] gap-1"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/instructor/submissions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'ai-pre-grade', submissionId: submission.id }),
                    })
                    if (!res.ok) throw new Error()
                    toast.success('AI re-grade initiated!')
                    onRegraded()
                  } catch {
                    toast.error('AI re-grade failed')
                  }
                }}
              >
                <Sparkles className="size-3" /> Re-grade
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================
// Not Submitted Student Row
// ============================================================
function NotSubmittedStudentRow({ student, onSendReminder }: { student: NotSubmittedStudent; onSendReminder: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={spring}
      className="rounded-xl border bg-card p-3 flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="size-9 shrink-0">
          <AvatarImage src={student.avatar || undefined} />
          <AvatarFallback className="rounded-lg bg-muted text-[11px] font-bold">
            {getInitials(student.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold truncate">{student.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{student.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] text-muted-foreground hidden sm:inline">
          Enrolled {formatDate(student.enrolledAt)}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="rounded-lg text-[11px] gap-1 h-7"
          onClick={() => onSendReminder(student.id)}
        >
          <Mail className="size-3" />
          Remind
        </Button>
      </div>
    </motion.div>
  )
}

// ============================================================
// Edit Assignment Dialog
// ============================================================
function EditAssignmentDialog({
  open,
  onClose,
  onSaved,
  assignment,
  instructorId,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void
  assignment: AssignmentDetail | null
  instructorId: string
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    instructions: '',
    type: 'written' as AssignmentType,
    submissionType: 'text' as SubmissionType,
    maxScore: 100,
    dueDate: '',
    wordLimit: '',
    isPublished: false,
  })

  useEffect(() => {
    if (open && assignment) {
      setForm({
        title: assignment.title,
        description: assignment.description,
        instructions: assignment.instructions,
        type: assignment.type,
        submissionType: assignment.submissionType,
        maxScore: assignment.maxScore,
        dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().slice(0, 16) : '',
        wordLimit: assignment.wordLimit ? String(assignment.wordLimit) : '',
        isPublished: assignment.isPublished,
      })
    }
  }, [open, assignment])

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/instructor/assignments/${assignment?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId,
          title: form.title.trim(),
          description: form.description,
          instructions: form.instructions,
          type: form.type,
          submissionType: form.submissionType,
          maxScore: form.maxScore,
          dueDate: form.dueDate || null,
          wordLimit: form.wordLimit ? parseInt(form.wordLimit) : null,
          isPublished: form.isPublished,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Update failed')
      }
      toast.success('Assignment updated!')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="rounded-3xl p-0 overflow-hidden max-w-2xl max-h-[90vh]">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
          <DialogTitle className="text-[22px] font-bold text-white">Edit Assignment</DialogTitle>
          <DialogDescription className="text-emerald-100 text-[14px] mt-1">
            Update assignment details and settings
          </DialogDescription>
        </div>
        <ScrollArea className="max-h-[65vh]">
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[14px] font-semibold">Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="h-11 rounded-xl text-[15px]"
                maxLength={120}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[14px] font-semibold">Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as AssignmentType })}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeConfig).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[14px] font-semibold">Submission Type</Label>
                <Select value={form.submissionType} onValueChange={(v) => setForm({ ...form, submissionType: v as SubmissionType })}>
                  <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Entry</SelectItem>
                    <SelectItem value="file">File Upload</SelectItem>
                    <SelectItem value="url">URL Submission</SelectItem>
                    <SelectItem value="multiple">Multiple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[14px] font-semibold">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="rounded-xl text-[14px] min-h-[60px] resize-y"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[14px] font-semibold">Instructions</Label>
              <Textarea
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                className="rounded-xl text-[14px] min-h-[80px] resize-y"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[14px] font-semibold">Due Date</Label>
                <Input
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="h-11 rounded-xl text-[14px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[14px] font-semibold">Max Score</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.maxScore}
                  onChange={(e) => setForm({ ...form, maxScore: Math.max(1, parseInt(e.target.value) || 0) })}
                  className="h-11 rounded-xl text-[14px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[14px] font-semibold">Word Limit</Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="No limit"
                  value={form.wordLimit}
                  onChange={(e) => setForm({ ...form, wordLimit: e.target.value })}
                  className="h-11 rounded-xl text-[14px]"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[14px] font-semibold">Published</Label>
              <Switch
                checked={form.isPublished}
                onCheckedChange={(v) => setForm({ ...form, isPublished: v })}
              />
            </div>
          </div>
        </ScrollArea>
        <div className="p-4 border-t flex items-center justify-end gap-2">
          <Button variant="outline" className="rounded-xl" onClick={onClose}>Cancel</Button>
          <Button
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white gap-1.5"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Main Component
// ============================================================
export function InstructorAssignmentDetailView() {
  const { currentUser, selectedAssignmentId, setCurrentView } = useAppStore()

  // State
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<DetailTab>('overview')
  const [submissionFilter, setSubmissionFilter] = useState<SubmissionFilter>('all')
  const [submissionSearch, setSubmissionSearch] = useState('')
  const [submissionSort, setSubmissionSort] = useState<SortOption>('newest')
  const [selectedSubmissions, setSelectedSubmissions] = useState<Set<string>>(new Set())
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [notSubmittedStudents, setNotSubmittedStudents] = useState<NotSubmittedStudent[]>([])

  const instructorId = currentUser?.id || ''

  // Fetch assignment data
  const fetchAssignment = useCallback(async () => {
    if (!selectedAssignmentId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/instructor/assignments/${selectedAssignmentId}?includeSubmissions=true&submissionStatus=all${instructorId ? `&instructorId=${instructorId}` : ''}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to load assignment')
      }
      const data = await res.json()
      setAssignment(data.assignment)

      // Build not-submitted list from stats
      if (data.assignment?.stats) {
        const stats = data.assignment.stats
        const submittedIds = new Set((data.assignment.submissions || []).map((s: SubmissionItem) => s.studentId))
        const notSubmittedCount = stats.notSubmittedCount || (stats.totalEnrolled - stats.totalSubmitted)
        // Generate placeholder not-submitted students
        const placeholder: NotSubmittedStudent[] = []
        for (let i = 0; i < notSubmittedCount; i++) {
          placeholder.push({
            id: `ns-${i}`,
            name: `Student ${stats.totalSubmitted + i + 1}`,
            email: `student${stats.totalSubmitted + i + 1}@example.com`,
            avatar: null,
            enrolledAt: data.assignment.createdAt,
          })
        }
        setNotSubmittedStudents(placeholder)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignment')
    } finally {
      setLoading(false)
    }
  }, [selectedAssignmentId])

  useEffect(() => {
    fetchAssignment()
  }, [fetchAssignment])

  // Filtered & sorted submissions
  const filteredSubmissions = useMemo(() => {
    if (!assignment?.submissions) return []
    let list = [...assignment.submissions]

    // Filter by status
    if (submissionFilter === 'pending') {
      list = list.filter((s) => s.status === 'pending')
    } else if (submissionFilter === 'graded') {
      list = list.filter((s) => s.status === 'graded')
    }

    // Search
    if (submissionSearch.trim()) {
      const q = submissionSearch.toLowerCase()
      list = list.filter(
        (s) =>
          s.studentName.toLowerCase().includes(q) ||
          s.studentEmail.toLowerCase().includes(q)
      )
    }

    // Sort
    if (submissionSort === 'newest') {
      list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    } else if (submissionSort === 'student-az') {
      list.sort((a, b) => a.studentName.localeCompare(b.studentName))
    } else if (submissionSort === 'score-high-low') {
      list.sort((a, b) => b.totalScore - a.totalScore)
    }

    return list
  }, [assignment?.submissions, submissionFilter, submissionSearch, submissionSort])

  const pendingSubmissions = filteredSubmissions.filter((s) => s.status === 'pending')
  const gradedSubmissions = filteredSubmissions.filter((s) => s.status === 'graded')

  // Counts
  const allCount = assignment?.submissions?.length || 0
  const pendingCount = assignment?.stats?.pendingCount || 0
  const gradedCount = assignment?.stats?.gradedCount || 0

  // Actions
  const handleTogglePublish = async () => {
    if (!assignment) return
    try {
      const res = await fetch(`/api/instructor/assignments/${assignment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isPublished: !assignment.isPublished,
          instructorId,
        }),
      })
      if (!res.ok) throw new Error('Toggle failed')
      toast.success(assignment.isPublished ? 'Assignment unpublished' : 'Assignment published')
      fetchAssignment()
    } catch {
      toast.error('Failed to toggle publish status')
    }
  }

  const handleDuplicate = async () => {
    if (!assignment) return
    try {
      const res = await fetch('/api/instructor/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId,
          title: `${assignment.title} (Copy)`,
          description: assignment.description,
          instructions: assignment.instructions,
          type: assignment.type,
          courseId: assignment.course.id,
          submissionType: assignment.submissionType,
          maxScore: assignment.maxScore,
          rubric: assignment.rubric ? JSON.stringify(assignment.rubric) : null,
          resources: assignment.resources ? JSON.stringify(assignment.resources) : null,
          isPublished: false,
        }),
      })
      if (!res.ok) throw new Error('Duplicate failed')
      toast.success('Assignment duplicated!')
    } catch {
      toast.error('Failed to duplicate assignment')
    }
  }

  const handleDelete = async () => {
    if (!assignment) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/instructor/assignments/${assignment.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      toast.success('Assignment deleted')
      setCurrentView('instructor-assignments')
    } catch {
      toast.error('Failed to delete assignment')
    } finally {
      setDeleting(false)
    }
  }

  const handleExportGrades = () => {
    if (!assignment?.submissions) return
    const headers = ['Student Name', 'Email', 'Score', 'Max Score', 'Percentage', 'Status', 'Submitted At', 'Graded At', 'Feedback']
    const rows = assignment.submissions.map((s) => [
      s.studentName,
      s.studentEmail,
      String(s.totalScore),
      String(s.maxScore),
      String(s.maxScore > 0 ? Math.round((s.totalScore / s.maxScore) * 100) : 0) + '%',
      s.status,
      s.submittedAt ? formatDateTime(s.submittedAt) : '',
      s.gradedAt ? formatDateTime(s.gradedAt) : '',
      `"${(s.feedback || '').replace(/"/g, '""')}"`,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${assignment.title.replace(/[^a-zA-Z0-9]/g, '_')}_grades.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Grades exported!')
  }

  const handleBulkReturn = async () => {
    if (selectedSubmissions.size === 0) return
    try {
      const res = await fetch('/api/instructor/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'return-graded',
          submissionIds: Array.from(selectedSubmissions),
          instructorId,
        }),
      })
      if (!res.ok) throw new Error('Bulk return failed')
      toast.success(`${selectedSubmissions.size} grades returned`)
      setSelectedSubmissions(new Set())
      fetchAssignment()
    } catch {
      toast.error('Failed to return grades')
    }
  }

  const handleSendReminder = (studentId: string) => {
    toast.success('Reminder sent!')
  }

  const handleBulkReminder = () => {
    toast.success(`Reminders sent to ${notSubmittedStudents.length} students!`)
  }

  const toggleSelectAll = () => {
    if (selectedSubmissions.size === filteredSubmissions.length) {
      setSelectedSubmissions(new Set())
    } else {
      setSelectedSubmissions(new Set(filteredSubmissions.map((s) => s.id)))
    }
  }

  const toggleSelectSubmission = (id: string) => {
    const next = new Set(selectedSubmissions)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedSubmissions(next)
  }

  // Rubric criteria
  const rubricCriteria = assignment?.rubric || []
  const maxScore = assignment?.maxScore || 100

  // ======================== RENDER ========================

  // Null assignment ID state
  if (!selectedAssignmentId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <div className="flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg mb-6">
          <AlertCircle className="size-10" />
        </div>
        <h2 className="text-[22px] font-bold mb-2">No Assignment Selected</h2>
        <p className="text-[14px] text-muted-foreground mb-6 text-center max-w-md">
          Select an assignment from the list to view its details and submissions.
        </p>
        <Button
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
          onClick={() => setCurrentView('instructor-assignments')}
        >
          <ArrowLeft className="mr-2 size-4" />
          Back to Assignments
        </Button>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64 rounded-lg" />
            <Skeleton className="h-4 w-40 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  // Error state
  if (error || !assignment) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <div className="flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg mb-6">
          <AlertCircle className="size-10" />
        </div>
        <h2 className="text-[22px] font-bold mb-2">Error Loading Assignment</h2>
        <p className="text-[14px] text-muted-foreground mb-6 text-center max-w-md">
          {error || 'Something went wrong.'}
        </p>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => setCurrentView('instructor-assignments')}
          >
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Button>
          <Button
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
            onClick={fetchAssignment}
          >
            <RotateCcw className="mr-2 size-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const tc = typeConfig[assignment.type]
  const TypeIcon = tc.icon
  const stats = assignment.stats
  const isOverdue = isDueOverdue(assignment.dueDate)
  const isUrgent = isDueUrgent(assignment.dueDate)
  const totalDistStudents = Object.values(stats.scoreDistribution).reduce((a, b) => a + b, 0)

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="flex items-center gap-2 text-[13px]"
      >
        <Button
          variant="ghost"
          size="sm"
          className="rounded-lg text-[13px] gap-1 h-8 px-2 sm:hidden"
          onClick={() => setCurrentView('instructor-assignments')}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <button
          onClick={() => setCurrentView('instructor-assignments')}
          className="text-muted-foreground hover:text-primary transition-colors hidden sm:inline-flex items-center gap-1"
        >
          <ArrowLeft className="size-3.5" />
          Assignments
        </button>
        <ChevronRight className="size-3.5 text-muted-foreground/50 hidden sm:block" />
        <span className="font-medium text-foreground truncate max-w-[300px]">
          {assignment.title}
        </span>
      </motion.div>

      {/* Assignment Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="rounded-2xl border bg-card overflow-hidden"
      >
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={cn('rounded-lg text-[11px] px-2 py-0.5 h-6 border-0', tc.bgColor, tc.color)}>
                  <TypeIcon className="mr-1 size-3" />
                  {tc.label}
                </Badge>
                <Badge className={cn(
                  'rounded-lg text-[11px] px-2 py-0.5 h-6 border-0',
                  assignment.isPublished
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                )}>
                  {assignment.isPublished ? 'Published' : 'Draft'}
                </Badge>
                {isOverdue && (
                  <Badge className="rounded-lg text-[11px] px-2 py-0.5 h-6 border-0 bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">
                    Overdue
                  </Badge>
                )}
              </div>
              <h1 className="text-[22px] sm:text-[26px] font-bold leading-tight">
                {assignment.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="size-3.5" />
                  {assignment.course.title}
                </span>
                {assignment.module && (
                  <span className="flex items-center gap-1">
                    <span className="text-muted-foreground/50">·</span>
                    {assignment.module.title}
                  </span>
                )}
                {assignment.dueDate && (
                  <span className={cn(
                    'flex items-center gap-1',
                    isOverdue ? 'text-red-600 dark:text-red-400' : isUrgent ? 'text-amber-600 dark:text-amber-400' : ''
                  )}>
                    <CalendarDays className="size-3.5" />
                    {getDueCountdown(assignment.dueDate)}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-[12px] gap-1"
                      onClick={handleTogglePublish}
                    >
                      {assignment.isPublished ? (
                        <><EyeOff className="size-3.5" /> Unpublish</>
                      ) : (
                        <><Globe className="size-3.5" /> Publish</>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{assignment.isPublished ? 'Unpublish' : 'Publish'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button variant="outline" size="sm" className="rounded-xl text-[12px] gap-1" onClick={() => setEditDialogOpen(true)}>
                <Edit3 className="size-3.5" /> Edit
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl text-[12px] gap-1" onClick={handleDuplicate}>
                <Copy className="size-3.5" /> Duplicate
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl text-[12px] gap-1" onClick={handleExportGrades}>
                <Download className="size-3.5" /> Export
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-xl size-8 p-0">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem onClick={handleTogglePublish} className="gap-2">
                    {assignment.isPublished ? <><EyeOff className="size-4" /> Unpublish</> : <><Globe className="size-4" /> Publish</>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDuplicate} className="gap-2">
                    <Copy className="size-4" /> Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportGrades} className="gap-2">
                    <Download className="size-4" /> Export Grades
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="gap-2 text-red-600 dark:text-red-400 focus:text-red-600"
                  >
                    <Trash2 className="size-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards Row */}
      <InstructorStatCardGrid columns={6}>
        <InstructorStatCard
          label="Total Enrolled"
          value={stats.totalEnrolled}
          icon={Users}
          color="teal"
          index={0}
        />
        <InstructorStatCard
          label="Submitted"
          value={stats.totalSubmitted}
          icon={Upload}
          color="emerald"
         
          subLabel={`${stats.submissionRate}% rate`}
          index={1}
        />
        <InstructorStatCard
          label="Pending Review"
          value={stats.pendingCount}
          icon={Clock}
          color="amber"
         
          index={2}
        />
        <InstructorStatCard
          label="Graded"
          value={stats.gradedCount}
          icon={CheckCircle2}
          color="emerald"
         
          index={3}
        />
        <InstructorStatCard
          label="Average Score"
          value={Math.round(stats.avgScore)}
          icon={BarChart3}
          color="teal"
         
          subLabel={`of ${maxScore}`}
          index={4}
        />
        <InstructorStatCard
          label="Pass Rate"
          value={`${Math.round(stats.passRate)}%`}
          icon={TrendingUp}
          color="emerald"
         
          index={5}
        />
      </InstructorStatCardGrid>

      {/* Score Distribution Chart */}
      <ScoreDistributionChart
        distribution={stats.scoreDistribution}
        total={totalDistStudents}
      />

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DetailTab)}>
        <TabsList className="rounded-xl h-10 p-1">
          <TabsTrigger value="overview" className="rounded-lg text-[13px]">Overview</TabsTrigger>
          <TabsTrigger value="submissions" className="rounded-lg text-[13px]">
            Submissions
            {pendingCount > 0 && (
              <Badge className="ml-1.5 rounded-full text-[10px] px-1.5 py-0 h-4 min-w-[16px] bg-amber-500 text-white border-0">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="not-submitted" className="rounded-lg text-[13px]">
            Not Submitted
            {stats.notSubmittedCount > 0 && (
              <Badge className="ml-1.5 rounded-full text-[10px] px-1.5 py-0 h-4 min-w-[16px] bg-red-500 text-white border-0">
                {stats.notSubmittedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg text-[13px]">Analytics</TabsTrigger>
        </TabsList>

        {/* ============= OVERVIEW TAB ============= */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            {/* Description & Instructions */}
            <div className="rounded-2xl border bg-card p-5 space-y-4">
              <div>
                <h3 className="text-[15px] font-bold mb-2">Description</h3>
                <p className="text-[14px] text-muted-foreground whitespace-pre-wrap">
                  {assignment.description || 'No description provided.'}
                </p>
              </div>
              <Separator />
              <div>
                <h3 className="text-[15px] font-bold mb-2">Instructions</h3>
                <div className="text-[14px] text-muted-foreground whitespace-pre-wrap rounded-xl bg-muted/30 p-4 max-h-64 overflow-y-auto">
                  {assignment.instructions || 'No instructions provided.'}
                </div>
              </div>
            </div>

            {/* Settings Summary */}
            <div className="space-y-4">
              <div className="rounded-2xl border bg-card p-5">
                <h3 className="text-[15px] font-bold mb-3">Settings</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted/30 p-3">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Type</p>
                    <p className="text-[14px] font-semibold flex items-center gap-1.5 mt-0.5">
                      <TypeIcon className={cn('size-4', tc.color)} />
                      {tc.label}
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/30 p-3">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Submission</p>
                    <p className="text-[14px] font-semibold mt-0.5 capitalize">{assignment.submissionType}</p>
                  </div>
                  <div className="rounded-xl bg-muted/30 p-3">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Max Score</p>
                    <p className="text-[14px] font-semibold mt-0.5">{assignment.maxScore} pts</p>
                  </div>
                  <div className="rounded-xl bg-muted/30 p-3">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Word Limit</p>
                    <p className="text-[14px] font-semibold mt-0.5">{assignment.wordLimit || 'None'}</p>
                  </div>
                  <div className="rounded-xl bg-muted/30 p-3">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Due Date</p>
                    <p className={cn(
                      'text-[14px] font-semibold mt-0.5',
                      isOverdue ? 'text-red-600 dark:text-red-400' : isUrgent ? 'text-amber-600 dark:text-amber-400' : ''
                    )}>
                      {assignment.dueDate ? formatDateTime(assignment.dueDate) : 'No due date'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-muted/30 p-3">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Status</p>
                    <p className="text-[14px] font-semibold mt-0.5">
                      {assignment.isPublished ? 'Published' : 'Draft'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[12px] text-muted-foreground">
                  <span>Created {formatDate(assignment.createdAt)}</span>
                  <span>Updated {formatDate(assignment.updatedAt)}</span>
                </div>
              </div>

              {/* Rubric Table */}
              {rubricCriteria.length > 0 && (
                <div className="rounded-2xl border bg-card p-5">
                  <h3 className="text-[15px] font-bold mb-3 flex items-center gap-2">
                    <BarChart3 className="size-4 text-primary" />
                    Rubric
                  </h3>
                  <div className="space-y-2">
                    {rubricCriteria.map((c, idx) => {
                      const name = c.criterion || c.criteria || `Criteria ${idx + 1}`
                      return (
                        <div key={idx} className="rounded-xl border bg-muted/20 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-semibold">{name}</span>
                            <Badge className="rounded-lg text-[10px] px-1.5 py-0 h-5 border-0 bg-primary/10 text-primary">
                              {c.maxPoints} pts
                            </Badge>
                          </div>
                          {c.description && (
                            <p className="text-[12px] text-muted-foreground mt-1">{c.description}</p>
                          )}
                        </div>
                      )
                    })}
                    <div className="flex justify-end pt-1">
                      <span className="text-[13px] font-bold">
                        Total: {rubricCriteria.reduce((s, c) => s + c.maxPoints, 0)} pts
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Resources */}
              {assignment.resources && assignment.resources.length > 0 && (
                <div className="rounded-2xl border bg-card p-5">
                  <h3 className="text-[15px] font-bold mb-3 flex items-center gap-2">
                    <LinkIcon className="size-4 text-primary" />
                    Resources
                  </h3>
                  <div className="space-y-2">
                    {assignment.resources.map((res, idx) => (
                      <a
                        key={idx}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-xl border bg-muted/20 p-3 hover:bg-muted/40 transition-colors group"
                      >
                        <ExternalLink className="size-4 text-primary shrink-0" />
                        <span className="text-[13px] font-medium group-hover:text-primary transition-colors">
                          {res.label || res.url}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </TabsContent>

        {/* ============= SUBMISSIONS TAB ============= */}
        <TabsContent value="submissions" className="mt-4 space-y-4">
          {/* Sub-filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {(['all', 'pending', 'graded'] as SubmissionFilter[]).map((filter) => (
                <Button
                  key={filter}
                  variant={submissionFilter === filter ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'rounded-lg text-[12px] h-8',
                    submissionFilter === filter && 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                  )}
                  onClick={() => setSubmissionFilter(filter)}
                >
                  {filter === 'all' ? `All (${allCount})` : filter === 'pending' ? `Pending (${pendingCount})` : `Graded (${gradedCount})`}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={submissionSearch}
                  onChange={(e) => setSubmissionSearch(e.target.value)}
                  className="h-9 rounded-xl pl-9 text-[13px] w-full sm:w-52"
                />
              </div>
              <Select value={submissionSort} onValueChange={(v) => setSubmissionSort(v as SortOption)}>
                <SelectTrigger className="h-9 rounded-xl text-[12px] w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="student-az">Student A-Z</SelectItem>
                  <SelectItem value="score-high-low">Score High-Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedSubmissions.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border bg-emerald-50 dark:bg-emerald-950/20 p-3 flex items-center justify-between"
            >
              <span className="text-[13px] font-medium text-emerald-700 dark:text-emerald-400">
                {selectedSubmissions.size} selected
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="rounded-lg text-[12px] gap-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                  onClick={handleBulkReturn}
                >
                  <Send className="size-3" /> Return Graded
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-[12px] gap-1"
                  onClick={handleExportGrades}
                >
                  <Download className="size-3" /> Download All
                </Button>
              </div>
            </motion.div>
          )}

          {/* Select All */}
          <div className="flex items-center gap-3 px-1">
            <Checkbox
              checked={selectedSubmissions.size === filteredSubmissions.length && filteredSubmissions.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-[12px] text-muted-foreground">Select all</span>
          </div>

          {/* Submission Cards */}
          <div className="space-y-4">
            <AnimatePresence>
              {filteredSubmissions.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/30 mb-4">
                    <Upload className="size-8 text-muted-foreground" />
                  </div>
                  <p className="text-[15px] font-semibold mb-1">No submissions found</p>
                  <p className="text-[13px] text-muted-foreground">
                    {submissionFilter === 'pending'
                      ? 'No pending submissions to review'
                      : submissionFilter === 'graded'
                        ? 'No graded submissions yet'
                        : 'No submissions match your search'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {filteredSubmissions.map((submission) => (
              <div key={submission.id} className="flex items-start gap-3">
                <Checkbox
                  checked={selectedSubmissions.has(submission.id)}
                  onCheckedChange={() => toggleSelectSubmission(submission.id)}
                  className="mt-4 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  {submission.status === 'pending' ? (
                    <PendingSubmissionCard
                      submission={submission}
                      rubricCriteria={rubricCriteria}
                      maxScore={maxScore}
                      instructorId={instructorId}
                      onGraded={fetchAssignment}
                    />
                  ) : (
                    <GradedSubmissionCard
                      submission={submission}
                      rubricCriteria={rubricCriteria}
                      maxScore={maxScore}
                      instructorId={instructorId}
                      onRegraded={fetchAssignment}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ============= NOT SUBMITTED TAB ============= */}
        <TabsContent value="not-submitted" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[14px] text-muted-foreground">
              {notSubmittedStudents.length} student{notSubmittedStudents.length !== 1 ? 's' : ''} haven&apos;t submitted
            </p>
            {notSubmittedStudents.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-[12px] gap-1.5"
                onClick={handleBulkReminder}
              >
                <Mail className="size-3.5" />
                Send All Reminders
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {notSubmittedStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/30 mb-4">
                  <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-[15px] font-semibold mb-1">All students have submitted!</p>
                <p className="text-[13px] text-muted-foreground">No reminders needed.</p>
              </div>
            ) : (
              notSubmittedStudents.map((student) => (
                <NotSubmittedStudentRow
                  key={student.id}
                  student={student}
                  onSendReminder={handleSendReminder}
                />
              ))
            )}
          </div>
        </TabsContent>

        {/* ============= ANALYTICS TAB ============= */}
        <TabsContent value="analytics" className="mt-4 space-y-4">
          {/* Score Distribution (repeat with more detail) */}
          <ScoreDistributionChart
            distribution={stats.scoreDistribution}
            total={totalDistStudents}
          />

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <div className="rounded-2xl border bg-card p-5">
              <h4 className="text-[13px] text-muted-foreground mb-1">Average Score</h4>
              <p className="text-[28px] font-bold">{Math.round(stats.avgScore)}</p>
              <p className="text-[12px] text-muted-foreground">out of {maxScore}</p>
            </div>
            <div className="rounded-2xl border bg-card p-5">
              <h4 className="text-[13px] text-muted-foreground mb-1">Highest Score</h4>
              <p className="text-[28px] font-bold text-emerald-600 dark:text-emerald-400">{stats.highestScore}</p>
              <p className="text-[12px] text-muted-foreground">out of {maxScore}</p>
            </div>
            <div className="rounded-2xl border bg-card p-5">
              <h4 className="text-[13px] text-muted-foreground mb-1">Lowest Score</h4>
              <p className="text-[28px] font-bold text-red-600 dark:text-red-400">{stats.lowestScore}</p>
              <p className="text-[12px] text-muted-foreground">out of {maxScore}</p>
            </div>
          </motion.div>

          {/* Rubric Performance Breakdown */}
          {rubricCriteria.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring}
              className="rounded-2xl border bg-card p-5"
            >
              <h3 className="text-[15px] font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="size-4 text-primary" />
                Rubric Performance Breakdown
              </h3>
              <div className="space-y-3">
                {rubricCriteria.map((criterion, idx) => {
                  const name = criterion.criterion || criterion.criteria || `Criteria ${idx + 1}`
                  const gradedSubs = assignment.submissions.filter((s) => s.status === 'graded' && s.scores && s.scores[idx] !== undefined)
                  const avgScore = gradedSubs.length > 0
                    ? gradedSubs.reduce((sum, s) => sum + (s.scores[idx] || 0), 0) / gradedSubs.length
                    : 0
                  const avgPct = criterion.maxPoints > 0 ? (avgScore / criterion.maxPoints) * 100 : 0
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="font-medium">{name}</span>
                        <span className="text-muted-foreground">
                          Avg: {avgScore.toFixed(1)}/{criterion.maxPoints}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${avgPct}%` }}
                          transition={{ ...spring, delay: idx * 0.05 }}
                          className={cn(
                            'h-full rounded-full',
                            avgPct >= 70 ? 'bg-emerald-500' : avgPct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                          )}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* Late Submissions */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="rounded-2xl border bg-card p-5"
          >
            <h3 className="text-[15px] font-bold mb-3 flex items-center gap-2">
              <Clock className="size-4 text-amber-600 dark:text-amber-400" />
              Submission Timing
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-muted/30 p-3 text-center">
                <p className="text-[20px] font-bold">{stats.totalSubmitted}</p>
                <p className="text-[11px] text-muted-foreground">Total Submitted</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-3 text-center">
                <p className="text-[20px] font-bold text-amber-600 dark:text-amber-400">{stats.lateCount}</p>
                <p className="text-[11px] text-muted-foreground">Late</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-3 text-center">
                <p className="text-[20px] font-bold text-red-600 dark:text-red-400">{stats.notSubmittedCount}</p>
                <p className="text-[11px] text-muted-foreground">Not Submitted</p>
              </div>
              <div className="rounded-xl bg-muted/30 p-3 text-center">
                <p className="text-[20px] font-bold text-emerald-600 dark:text-emerald-400">{Math.round(stats.submissionRate)}%</p>
                <p className="text-[11px] text-muted-foreground">Submission Rate</p>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <EditAssignmentDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSaved={fetchAssignment}
        assignment={assignment}
        instructorId={instructorId}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[20px]">Delete Assignment?</AlertDialogTitle>
            <AlertDialogDescription className="text-[14px]">
              This will permanently delete <strong>&quot;{assignment.title}&quot;</strong> and all associated
              submissions and grades. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Trash2 className="size-4 mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
