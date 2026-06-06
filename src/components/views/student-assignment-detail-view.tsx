'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Clock, CheckCircle2, Send, AlertCircle, Upload, FileText,
  Code2, Sparkles, Download, X, Loader2, Calendar, PenTool, File,
  Trash2, MessageSquare, ChevronRight, Timer, BookOpen, AlertTriangle,
  Users, Zap, RotateCcw, ExternalLink, Flag, MoreHorizontal, Eye,
  Play, PenLine, ThumbsUp, Bot, History, ChevronDown, Copy,
  CheckCheck, Bookmark, Share2, Printer,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { ShijlAIText } from '@/components/ui/brand-text'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogDescription, DialogClose,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'

/* ─── Types ─── */
interface RubricItem {
  criterion: string
  description: string
  maxPoints: number
  score: number | null
}

interface AssignmentDetail {
  id: string
  title: string
  description: string
  instructions: string
  type: string
  submissionType: string
  courseId: string
  courseName: string
  instructorName: string
  maxScore: number
  dueDate: string | null
  isOverdue: boolean
  daysLeft: number | null
  rubric: RubricItem[]
  resources: { title: string; url: string; type: string }[]
  wordLimit: number | null
  order: number
  submissionId: string | null
  status: 'pending' | 'submitted' | 'graded'
  submittedAt: string | null
  score: number | null
  scorePercentage: number | null
  letterGrade: string | null
  feedback: string | null
  gradedAt: string | null
  gradedBy: string | null
  fileUrls: { name: string; url: string; type: string; size: number }[]
  content: string | null
  attempt: number
}

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

/* ─── Helpers ─── */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'No due date'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function getDaysLeftText(daysLeft: number | null, isOverdue: boolean): string {
  if (daysLeft === null) return 'No due date'
  if (isOverdue) return `${Math.abs(daysLeft)} days overdue`
  if (daysLeft === 0) return 'Due today'
  if (daysLeft === 1) return 'Due tomorrow'
  return `${daysLeft} days left`
}

function getDaysLeftColor(daysLeft: number | null, isOverdue: boolean): string {
  if (daysLeft === null) return 'text-muted-foreground'
  if (isOverdue) return 'text-rose-600 dark:text-rose-400'
  if (daysLeft <= 1) return 'text-rose-600 dark:text-rose-400'
  if (daysLeft <= 3) return 'text-amber-600 dark:text-amber-400'
  if (daysLeft <= 7) return 'text-orange-500 dark:text-orange-400'
  return 'text-emerald-600 dark:text-emerald-400'
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'coding': return Code2
    case 'written': return PenTool
    case 'project': return FileText
    case 'peer-review': return Users
    default: return FileText
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'coding': return 'Coding'
    case 'written': return 'Written'
    case 'project': return 'Project'
    case 'peer-review': return 'Peer Review'
    default: return 'Assignment'
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'coding': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400'
    case 'written': return 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400'
    case 'project': return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
    case 'peer-review': return 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
    default: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
  }
}

function getScoreColor(pct: number | null): string {
  if (pct === null) return 'text-muted-foreground'
  if (pct >= 90) return 'text-emerald-600 dark:text-emerald-400'
  if (pct >= 80) return 'text-teal-600 dark:text-teal-400'
  if (pct >= 70) return 'text-amber-600 dark:text-amber-400'
  if (pct >= 60) return 'text-orange-600 dark:text-orange-400'
  return 'text-rose-600 dark:text-rose-400'
}

function getLetterGradeColor(grade: string | null): string {
  if (!grade) return ''
  if (grade.startsWith('A')) return 'from-emerald-500 to-teal-500'
  if (grade.startsWith('B')) return 'from-teal-500 to-cyan-500'
  if (grade.startsWith('C')) return 'from-amber-500 to-orange-500'
  if (grade.startsWith('D')) return 'from-orange-500 to-red-500'
  return 'from-rose-500 to-red-500'
}

/* ─── Countdown Timer ─── */
function CountdownTimer({ dueDate, isOverdue }: { dueDate: string | null; isOverdue: boolean }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    if (!dueDate) return
    const target = new Date(dueDate).getTime()
    const interval = setInterval(() => {
      const now = Date.now()
      const diff = isOverdue ? now - target : target - now
      if (diff <= 0 && !isOverdue) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
        return
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [dueDate, isOverdue])

  if (!dueDate) return null

  return (
    <div className="flex items-center gap-2">
      {[
        { value: timeLeft.days, label: 'Days' },
        { value: timeLeft.hours, label: 'Hrs' },
        { value: timeLeft.minutes, label: 'Min' },
        { value: timeLeft.seconds, label: 'Sec' },
      ].map((unit, i) => (
        <div key={unit.label} className="flex items-center gap-1.5">
          <div className={cn(
            'flex flex-col items-center rounded-lg px-2.5 py-1.5 min-w-[48px]',
            isOverdue ? 'bg-rose-100 dark:bg-rose-950/30' : 'bg-amber-100 dark:bg-amber-950/30'
          )}>
            <span className={cn(
              'text-[18px] font-bold tabular-nums leading-none',
              isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-amber-700 dark:text-amber-400'
            )}>
              {String(unit.value).padStart(2, '0')}
            </span>
            <span className="text-[9px] font-medium text-muted-foreground uppercase">{unit.label}</span>
          </div>
          {i < 3 && <span className="text-[18px] font-bold text-muted-foreground/40">:</span>}
        </div>
      ))}
    </div>
  )
}

/* ─── Main View ─── */
export function StudentAssignmentDetailView() {
  const { currentUser, selectedAssignmentId, setCurrentView, setSelectedAssignmentId } = useAppStore()
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'instructions' | 'submit' | 'feedback' | 'history'>('instructions')

  // Submission states
  const [submissionMode, setSubmissionMode] = useState<'file' | 'text' | 'code'>('text')
  const [textContent, setTextContent] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: number }[]>([])
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [extensionDialogOpen, setExtensionDialogOpen] = useState(false)
  const [extensionReason, setExtensionReason] = useState('')

  const fetchAssignment = useCallback(async () => {
    if (!selectedAssignmentId || !currentUser) return
    setLoading(true)
    try {
      const res = await fetch(`/api/student/assignments?userId=${currentUser.id}&status=all`)
      if (res.ok) {
        const data = await res.json()
        const found = (data.assignments || []).find((a: AssignmentDetail) => a.id === selectedAssignmentId)
        if (found) {
          setAssignment(found)
          setSubmissionMode(found.submissionType === 'file' ? 'file' : found.submissionType === 'code' ? 'code' : 'text')
          // Auto-navigate to submit if pending
          if (found.status === 'pending') setActiveSection('instructions')
          else if (found.status === 'graded') setActiveSection('feedback')
          else setActiveSection('instructions')
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [selectedAssignmentId, currentUser])

  useEffect(() => {
    fetchAssignment()
  }, [fetchAssignment])

  const handleFileUpload = () => {
    const fileName = assignment?.type === 'coding' ? 'solution.py' : 'assignment.pdf'
    setUploadedFiles(prev => {
      if (prev.some(f => f.name === fileName)) return prev
      return [...prev, { name: fileName, size: Math.floor(Math.random() * 10000) + 500 }]
    })
    toast.success(`${fileName} added`)
  }

  const removeFile = (name: string) => {
    setUploadedFiles(prev => prev.filter(f => f.name !== name))
  }

  const handleSubmit = async () => {
    if (!assignment || !currentUser) return
    if (submissionMode === 'file' && uploadedFiles.length === 0) { toast.error('Please upload a file'); return }
    if ((submissionMode === 'text' || submissionMode === 'code') && !textContent.trim()) { toast.error('Please write your submission'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/student/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          assignmentId: assignment.id,
          content: textContent || note,
          fileUrls: uploadedFiles.map(f => ({ name: f.name, url: `/uploads/${f.name}`, type: 'file', size: f.size })),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(data.message || 'Assignment submitted! +10 XP 🎉')
        fetchAssignment()
      } else {
        toast.error('Failed to submit assignment')
      }
    } catch {
      toast.error('Failed to submit assignment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRequestExtension = () => {
    if (!extensionReason.trim()) {
      toast.error('Please provide a reason for the extension request')
      return
    }
    toast.success('Extension request submitted to instructor')
    setExtensionDialogOpen(false)
    setExtensionReason('')
  }

  const handleBack = () => {
    setSelectedAssignmentId(null)
    setCurrentView('student-assignments')
  }

  // Loading
  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-60 w-full rounded-2xl" />
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <AlertCircle className="size-14 text-muted-foreground/40" />
        <h3 className="text-[18px] font-bold">Assignment Not Found</h3>
        <p className="text-[14px] text-muted-foreground">This assignment may have been removed.</p>
        <Button onClick={handleBack} variant="outline" className="rounded-xl">Go Back</Button>
      </div>
    )
  }

  const TypeIcon = getTypeIcon(assignment.type)
  const isSubmitted = assignment.status === 'submitted'
  const isGraded = assignment.status === 'graded'
  const isPending = assignment.status === 'pending'

  const sections = [
    { id: 'instructions' as const, label: 'Instructions', icon: BookOpen },
    ...(isPending ? [{ id: 'submit' as const, label: 'Submit', icon: Send }] : []),
    ...(isGraded ? [{ id: 'feedback' as const, label: 'Feedback', icon: MessageSquare }] : []),
    { id: 'history' as const, label: 'History', icon: History },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="space-y-5"
    >
      {/* Breadcrumb & Back */}
      <div className="flex items-center gap-2 text-[13px]">
        <button onClick={handleBack} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
          Assignments
        </button>
        <ChevronRight className="size-3.5 text-muted-foreground/40" />
        <span className="text-foreground font-medium truncate">{assignment.title}</span>
      </div>

      {/* Hero Header */}
      <div className="rounded-2xl overflow-hidden ios-shadow-lg">
        {/* Gradient bar */}
        <div className={cn(
          'h-2',
          isGraded ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
          assignment.isOverdue ? 'bg-gradient-to-r from-rose-500 to-red-500' :
          isSubmitted ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
          'bg-gradient-to-r from-amber-500 to-orange-500'
        )} />

        <div className="bg-card p-5 md:p-6 space-y-4">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className={cn(
                'flex size-12 shrink-0 items-center justify-center rounded-xl',
                isGraded ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                assignment.isOverdue ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                isSubmitted ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              )}>
                <TypeIcon className="size-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-[22px] sm:text-[26px] font-bold text-foreground leading-tight">{assignment.title}</h1>
                <div className="flex items-center gap-2 flex-wrap mt-1.5">
                  <Badge className={cn('text-[11px] gap-1 border-0', getTypeColor(assignment.type))}>
                    <TypeIcon className="size-3" />
                    {getTypeLabel(assignment.type)}
                  </Badge>
                  <Badge variant="outline" className="text-[11px] gap-1">
                    <BookOpen className="size-3" />
                    {assignment.courseName}
                  </Badge>
                  <span className="text-[12px] text-muted-foreground">by {assignment.instructorName}</span>
                </div>
              </div>
            </div>

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <MoreHorizontal className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!') }}>
                  <Copy className="size-4 mr-2" /> Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info('Printing...')}>
                  <Printer className="size-4 mr-2" /> Print Assignment
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setCurrentView('tutor'); toast.info('Ask ShijlAI about this assignment!') }}>
                  <Bot className="size-4 mr-2" /> Ask <ShijlAIText />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Meta info bar */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Status badge */}
            {isGraded && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0 gap-1">
                <CheckCircle2 className="size-3" /> Graded
              </Badge>
            )}
            {isSubmitted && (
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-0 gap-1">
                <Clock className="size-3" /> Under Review
              </Badge>
            )}
            {isPending && !assignment.isOverdue && (
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-0 gap-1">
                <AlertCircle className="size-3" /> Pending
              </Badge>
            )}
            {assignment.isOverdue && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="size-3" /> Overdue
              </Badge>
            )}

            {/* Max score */}
            <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Zap className="size-3.5 text-amber-500" />
              <span className="font-medium">{assignment.maxScore} points</span>
            </div>

            {/* Attempt */}
            {assignment.attempt > 0 && (
              <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <RotateCcw className="size-3.5" />
                <span>Attempt #{assignment.attempt}</span>
              </div>
            )}

            {/* Word limit */}
            {assignment.wordLimit && (
              <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <PenLine className="size-3.5" />
                <span>{assignment.wordLimit} word limit</span>
              </div>
            )}
          </div>

          {/* Countdown timer */}
          {assignment.dueDate && isPending && (
            <div className="rounded-xl bg-muted/40 border border-border/40 p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {assignment.isOverdue ? 'Time Overdue' : 'Time Remaining'}
                  </p>
                  <p className={cn('text-[14px] font-medium mt-0.5', getDaysLeftColor(assignment.daysLeft, assignment.isOverdue))}>
                    Due {formatDate(assignment.dueDate)}
                  </p>
                </div>
                <CountdownTimer dueDate={assignment.dueDate} isOverdue={assignment.isOverdue} />
              </div>
            </div>
          )}

          {/* Graded score card */}
          {isGraded && assignment.scorePercentage !== null && (
            <div className={cn('rounded-xl border p-5 flex items-center gap-6', 
              assignment.scorePercentage >= 70 ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30' :
              assignment.scorePercentage >= 50 ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30' :
              'bg-rose-50 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-800/30'
            )}>
              {/* Grade circle */}
              <div className={cn('flex size-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg',
                getLetterGradeColor(assignment.letterGrade)
              )}>
                <span className="text-[32px] font-bold">{assignment.letterGrade ?? 'N/A'}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className={cn('text-[28px] font-bold', getScoreColor(assignment.scorePercentage))}>
                    {assignment.score ?? '—'}/{assignment.maxScore}
                  </span>
                  <span className={cn('text-[16px] font-semibold', getScoreColor(assignment.scorePercentage))}>
                    ({assignment.scorePercentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress
                  value={assignment.scorePercentage}
                  className="h-3 rounded-full"
                />
                <div className="flex items-center gap-4 mt-2 text-[12px] text-muted-foreground">
                  {assignment.gradedAt && <span>Graded on {formatDateTime(assignment.gradedAt)}</span>}
                  {assignment.gradedBy && <span>by {assignment.gradedBy}</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-border/30">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-all',
              activeSection === section.id
                ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <section.icon className="size-4" />
            {section.label}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* ─── Instructions Section ─── */}
          {activeSection === 'instructions' && (
            <div className="space-y-5">
              {/* Description */}
              {assignment.description && (
                <div className="rounded-2xl ios-shadow-sm bg-card p-5">
                  <h3 className="text-[16px] font-semibold mb-3">Overview</h3>
                  <p className="text-[14px] text-muted-foreground leading-relaxed">{assignment.description}</p>
                </div>
              )}

              {/* Instructions */}
              <div className="rounded-2xl ios-shadow-sm bg-card p-5">
                <h3 className="text-[16px] font-semibold mb-3">Instructions</h3>
                <div className="text-[14px] text-foreground leading-relaxed whitespace-pre-wrap">{assignment.instructions}</div>
              </div>

              {/* Rubric */}
              {assignment.rubric.length > 0 && (
                <div className="rounded-2xl ios-shadow-sm bg-card p-5">
                  <h3 className="text-[16px] font-semibold mb-3">Grading Rubric</h3>
                  <div className="space-y-3">
                    {assignment.rubric.map((r, i) => {
                      const scorePct = r.maxPoints > 0 && r.score != null ? (r.score / r.maxPoints) * 100 : 0
                      const isGradedCriterion = r.score != null
                      return (
                        <div key={i} className="rounded-xl border border-border/30 p-3.5 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[14px] font-medium">{r.criterion}</p>
                              {r.description && <p className="text-[12px] text-muted-foreground mt-0.5">{r.description}</p>}
                            </div>
                            <div className="text-right shrink-0">
                              {isGradedCriterion ? (
                                <span className={cn('text-[15px] font-bold', getScoreColor(scorePct))}>
                                  {r.score}/{r.maxPoints}
                                </span>
                              ) : (
                                <span className="text-[13px] text-muted-foreground">{r.maxPoints} pts</span>
                              )}
                            </div>
                          </div>
                          <Progress
                            value={isGradedCriterion ? scorePct : 0}
                            className={cn('h-2 rounded-full', isGradedCriterion && scorePct < 80 ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500')}
                          />
                          {isGradedCriterion ? (
                            <span className="text-[11px] text-muted-foreground tabular-nums">{scorePct.toFixed(0)}%</span>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">—</span>
                          )}
                        </div>
                      )
                    })}
                    <div className="flex items-center justify-between text-[14px] font-semibold pt-2 border-t border-border/30">
                      <span>Total</span>
                      <span>{assignment.maxScore} points</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Resources */}
              {assignment.resources.length > 0 && (
                <div className="rounded-2xl ios-shadow-sm bg-card p-5">
                  <h3 className="text-[16px] font-semibold mb-3">Resources</h3>
                  <div className="space-y-2">
                    {assignment.resources.map((r, i) => (
                      <a
                        key={i}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl border border-border/30 p-3 hover:bg-accent/30 transition-colors group"
                      >
                        <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {r.type === 'pdf' ? <FileText className="size-4" /> :
                           r.type === 'video' ? <Play className="size-4" /> :
                           r.type === 'link' ? <ExternalLink className="size-4" /> :
                           <Download className="size-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium group-hover:text-primary transition-colors">{r.title}</p>
                          <p className="text-[11px] text-muted-foreground capitalize">{r.type}</p>
                        </div>
                        <Download className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Ask ShijlAI Help */}
              <div className="rounded-2xl ios-shadow-sm bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border border-violet-200/50 dark:border-violet-800/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md">
                    <Bot className="size-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-semibold text-violet-700 dark:text-violet-400">Need help with this assignment?</p>
                    <p className="text-[12px] text-violet-600/70 dark:text-violet-400/60">Ask <ShijlAIText /> for guidance — it won't do the work for you, but will help you understand</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-violet-300 text-violet-700 dark:border-violet-700 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-950/30"
                    onClick={() => { setCurrentView('tutor'); toast.info('Ask ShijlAI about this assignment!') }}
                  >
                    <Sparkles className="size-3.5 mr-1" />
                    Ask <ShijlAIText />
                  </Button>
                </div>
              </div>

              {/* Request Extension (if pending) */}
              {isPending && (
                <div className="flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[12px] text-muted-foreground hover:text-foreground"
                    onClick={() => setExtensionDialogOpen(true)}
                  >
                    <Timer className="size-3.5 mr-1" />
                    Request Extension
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ─── Submit Section ─── */}
          {activeSection === 'submit' && isPending && !assignment.submissionId && (
            <div className="space-y-5">
              {/* Already submitted notice */}
              {assignment.submissionId && (
                <div className="flex items-center gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
                  <Clock className="size-5 text-amber-500" />
                  <div>
                    <p className="text-[14px] font-medium">Already Submitted</p>
                    <p className="text-[12px] text-muted-foreground">Submitted on {formatDateTime(assignment.submittedAt)} · Attempt #{assignment.attempt}</p>
                  </div>
                </div>
              )}

              {/* Submission area */}
              <div className="rounded-2xl ios-shadow-sm bg-card p-5 space-y-4">
                <h3 className="text-[16px] font-semibold">Your Submission</h3>

                {/* Submission type selector */}
                <div>
                  <Label className="text-[13px] font-medium">How would you like to submit?</Label>
                  <div className="flex items-center gap-2 mt-2">
                    {([
                      { mode: 'file' as const, label: 'File Upload', icon: Upload, desc: 'PDF, DOC, ZIP, etc.' },
                      { mode: 'text' as const, label: 'Text Response', icon: FileText, desc: 'Write directly' },
                      { mode: 'code' as const, label: 'Code Editor', icon: Code2, desc: 'Write code' },
                    ]).map(opt => (
                      <button
                        key={opt.mode}
                        onClick={() => setSubmissionMode(opt.mode)}
                        className={cn(
                          'flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition-all flex-1',
                          submissionMode === opt.mode
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-500/30'
                            : 'border-border/50 bg-muted/20 hover:bg-accent/30'
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <opt.icon className={cn('size-4', submissionMode === opt.mode ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')} />
                          <span className={cn('text-[13px] font-medium', submissionMode === opt.mode ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground')}>
                            {opt.label}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground ml-5.5">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* File upload */}
                {submissionMode === 'file' && (
                  <div className="space-y-2">
                    <div
                      className="flex items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-background/50 py-8 px-4 cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-50/30 transition-colors"
                      onClick={handleFileUpload}
                    >
                      <div className="text-center">
                        <Upload className="size-10 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-[14px] text-muted-foreground">
                          Drag & drop your file or <span className="text-emerald-600 dark:text-emerald-400 font-medium">browse</span>
                        </p>
                        <p className="text-[12px] text-muted-foreground/50 mt-1">PDF, DOC, DOCX, ZIP up to 25MB</p>
                      </div>
                    </div>
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-1.5">
                        {uploadedFiles.map(f => (
                          <div key={f.name} className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                            <File className="size-4 text-emerald-500" />
                            <span className="text-[13px] font-medium">{f.name}</span>
                            <span className="text-[11px] text-muted-foreground">({(f.size / 1024).toFixed(1)} KB)</span>
                            <CheckCircle2 className="size-3.5 text-emerald-500 ml-auto" />
                            <button onClick={() => removeFile(f.name)} className="text-muted-foreground hover:text-destructive">
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Text mode */}
                {submissionMode === 'text' && (
                  <div className="space-y-2">
                    <Textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder={assignment.wordLimit ? `Write your response here... (${assignment.wordLimit} word limit)` : 'Write your response here...'}
                      className="min-h-[200px] text-[14px] resize-y"
                    />
                    {assignment.wordLimit && (
                      <p className="text-[11px] text-muted-foreground text-right">
                        {textContent.trim().split(/\s+/).filter(Boolean).length}/{assignment.wordLimit} words
                      </p>
                    )}
                  </div>
                )}

                {/* Code mode */}
                {submissionMode === 'code' && (
                  <div className="space-y-2">
                    <Textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder={`# Write your ${assignment.type === 'coding' ? 'solution' : 'code'} here...\n# Make sure to include comments\n`}
                      className="min-h-[250px] rounded-xl bg-zinc-950 text-green-400 px-4 py-3 text-[13px] font-mono placeholder:text-zinc-600 resize-y border-zinc-800 focus-visible:ring-emerald-500/30"
                    />
                  </div>
                )}

                {/* Note to instructor */}
                <div>
                  <Label className="text-[12px] text-muted-foreground">Note to instructor (optional)</Label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Any notes about your submission..."
                    className="mt-1.5 min-h-[60px] text-[13px] resize-none"
                  />
                </div>

                {/* Academic integrity confirmation */}
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 p-3">
                  <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(v as boolean)} className="mt-0.5" />
                  <Label className="text-[12px] text-foreground leading-relaxed cursor-pointer">
                    I confirm this is my own original work and I understand the academic integrity policy. Late submissions may receive a penalty.
                  </Label>
                </div>

                {/* Submit button */}
                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[12px] text-muted-foreground"
                    onClick={() => setActiveSection('instructions')}
                  >
                    <ArrowLeft className="size-3.5 mr-1" />
                    Back to Instructions
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || !confirmed}
                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20 px-6"
                  >
                    {submitting ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Send className="size-4 mr-1.5" />}
                    Submit Assignment
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ─── Feedback Section ─── */}
          {activeSection === 'feedback' && isGraded && (
            <div className="space-y-5">
              {/* Instructor feedback */}
              {assignment.feedback && (
                <div className="rounded-2xl ios-shadow-sm bg-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-[16px] font-semibold">Instructor Feedback</h3>
                  </div>
                  <div className="rounded-xl bg-muted/40 border border-border/30 p-4">
                    <p className="text-[14px] text-foreground leading-relaxed italic">&ldquo;{assignment.feedback}&rdquo;</p>
                  </div>
                  {assignment.gradedAt && (
                    <p className="text-[12px] text-muted-foreground mt-3">
                      Graded on {formatDateTime(assignment.gradedAt)} by {assignment.gradedBy || assignment.instructorName}
                    </p>
                  )}
                </div>
              )}

              {/* Rubric breakdown */}
              {assignment.rubric.length > 0 && assignment.rubric.some(r => r.score !== null) && (
                <div className="rounded-2xl ios-shadow-sm bg-card p-5">
                  <h3 className="text-[16px] font-semibold mb-3">Rubric Breakdown</h3>
                  <div className="space-y-3">
                    {assignment.rubric.map((r, i) => {
                      const scorePct = r.maxPoints > 0 && r.score != null ? (r.score / r.maxPoints) * 100 : 0
                      const isLow = r.score != null && r.maxPoints > 0 && (r.score / r.maxPoints) < 0.7
                      return (
                        <div key={i} className="space-y-1.5">
                          <div className="flex items-center justify-between text-[13px]">
                            <div>
                              <span className="font-medium text-foreground">{r.criterion}</span>
                              {r.description && <span className="text-muted-foreground ml-2">— {r.description}</span>}
                            </div>
                            <span className={cn('font-semibold', getScoreColor(scorePct))}>
                              {r.score ?? 0}/{r.maxPoints}
                              {isLow && <span className="ml-1.5 text-[11px] text-amber-500">← needs improvement</span>}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={scorePct}
                              className={cn('h-2.5 rounded-full flex-1', isLow ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500')}
                            />
                            <span className="text-[11px] text-muted-foreground tabular-nums w-10 text-right">{r.score != null ? `${scorePct.toFixed(0)}%` : '—'}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                {assignment.fileUrls.length > 0 && (
                  <Button variant="outline" className="rounded-xl gap-1.5" onClick={() => toast.info('Downloading your submission...')}>
                    <Download className="size-4" />
                    Download My Submission
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="rounded-xl gap-1.5 text-violet-600 dark:text-violet-400 border-violet-300 dark:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                  onClick={() => { setCurrentView('tutor'); toast.info('Ask ShijlAI about your feedback!') }}
                >
                  <Bot className="size-4" />
                  Ask <ShijlAIText /> About Feedback
                </Button>
                {isPending === false && (
                  <Button
                    variant="outline"
                    className="rounded-xl gap-1.5"
                    onClick={() => { setCurrentView('tutor'); toast.info('Discuss with Ask ShijlAI') }}
                  >
                    <RotateCcw className="size-4" />
                    Re-attempt (if allowed)
                  </Button>
                )}
              </div>

              {!assignment.feedback && (
                <div className="rounded-2xl bg-muted/30 border border-border/30 p-6 text-center">
                  <MessageSquare className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-[15px] font-medium text-muted-foreground">No written feedback provided</p>
                  <p className="text-[13px] text-muted-foreground/60 mt-1">Your instructor graded this assignment but didn't leave written feedback.</p>
                </div>
              )}
            </div>
          )}

          {/* ─── History Section ─── */}
          {activeSection === 'history' && (
            <div className="space-y-4">
              <div className="rounded-2xl ios-shadow-sm bg-card p-5">
                <h3 className="text-[16px] font-semibold mb-4">Submission History</h3>

                {/* Timeline */}
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border/50" />

                  <div className="space-y-4">
                    {/* Assignment created */}
                    <div className="flex items-start gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted/50 border border-border/50 z-10">
                        <FileText className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium">Assignment Created</p>
                        <p className="text-[12px] text-muted-foreground">{assignment.courseName} · {getTypeLabel(assignment.type)}</p>
                      </div>
                    </div>

                    {/* Submitted */}
                    {assignment.submittedAt && (
                      <div className="flex items-start gap-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20 z-10">
                          <Send className="size-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-[14px] font-medium">Submitted</p>
                          <p className="text-[12px] text-muted-foreground">
                            {formatDateTime(assignment.submittedAt)} · Attempt #{assignment.attempt}
                          </p>
                          {assignment.fileUrls.length > 0 && (
                            <div className="flex items-center gap-2 mt-1.5">
                              {assignment.fileUrls.map((f, i) => (
                                <Badge key={i} variant="outline" className="text-[10px] gap-1">
                                  <File className="size-2.5" /> {f.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {assignment.content && (
                            <p className="text-[12px] text-muted-foreground mt-1 line-clamp-2 italic">&ldquo;{assignment.content.slice(0, 100)}...&rdquo;</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Graded */}
                    {assignment.gradedAt && (
                      <div className="flex items-start gap-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 z-10">
                          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-[14px] font-medium">Graded</p>
                          <p className="text-[12px] text-muted-foreground">
                            {formatDateTime(assignment.gradedAt)} · Score: {assignment.score ?? '—'}/{assignment.maxScore} ({assignment.letterGrade ?? 'N/A'})
                          </p>
                          {assignment.feedback && (
                            <div className="rounded-lg bg-muted/30 border border-border/20 p-2.5 mt-2">
                              <p className="text-[12px] text-muted-foreground italic">&ldquo;{assignment.feedback}&rdquo;</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Overdue notice */}
                    {assignment.isOverdue && !assignment.submittedAt && (
                      <div className="flex items-start gap-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20 z-10">
                          <AlertTriangle className="size-4 text-rose-600 dark:text-rose-400" />
                        </div>
                        <div>
                          <p className="text-[14px] font-medium text-rose-600 dark:text-rose-400">Overdue</p>
                          <p className="text-[12px] text-muted-foreground">
                            Due date was {formatDate(assignment.dueDate)} — {getDaysLeftText(assignment.daysLeft, true)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Extension Request Dialog */}
      <Dialog open={extensionDialogOpen} onOpenChange={setExtensionDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-[17px] font-bold flex items-center gap-2">
              <Timer className="size-5 text-amber-600" />
              Request Extension
            </DialogTitle>
            <DialogDescription>
              Request additional time for &ldquo;{assignment.title}&rdquo;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 p-3">
              <p className="text-[13px] text-amber-700 dark:text-amber-400">
                <strong>Current due date:</strong> {formatDate(assignment.dueDate)} ({getDaysLeftText(assignment.daysLeft, assignment.isOverdue)})
              </p>
            </div>

            <div>
              <Label className="text-[13px] font-medium">Reason for extension</Label>
              <Textarea
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                placeholder="Explain why you need more time..."
                className="mt-1.5 min-h-[80px] text-[13px] resize-none"
              />
            </div>

            <div>
              <Label className="text-[13px] font-medium">Requested additional time</Label>
              <Select defaultValue="2days">
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1day">1 Day</SelectItem>
                  <SelectItem value="2days">2 Days</SelectItem>
                  <SelectItem value="3days">3 Days</SelectItem>
                  <SelectItem value="1week">1 Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setExtensionDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button
              onClick={handleRequestExtension}
              disabled={!extensionReason.trim()}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white"
            >
              <Send className="size-4 mr-1.5" />
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
