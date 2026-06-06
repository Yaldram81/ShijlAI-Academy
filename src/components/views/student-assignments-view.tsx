'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardList, Clock, CheckCircle2, Send, AlertCircle, Upload, FileText,
  Code2, Sparkles, Download, X, Loader2, Calendar, PenTool, File, Trash2,
  MessageSquare, Search, Filter, ArrowUpDown, Eye, ChevronRight, Timer,
  BookOpen, AlertTriangle, TrendingUp, BarChart3, Archive, RotateCcw,
  Flag, MoreHorizontal, Bell, ExternalLink, Users, Zap, CheckCheck,
  LayoutGrid, List, ArrowRight, CircleDot, Play, Bookmark, Link2,
  Columns3, GraduationCap, Target, Award, Percent,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { ShijlAIText } from '@/components/ui/brand-text'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { StudentStatCard, StudentStatCardGrid } from '@/components/student/student-stat-card'
import { MobileFilterSheet, MobileFilterGroup } from '@/components/mobile-filter-sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogDescription, DialogClose,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

/* ─── Types ─── */
interface RubricItem {
  criterion: string
  description: string
  maxPoints: number
  score: number | null
}

interface AssignmentItem {
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

type TabFilter = 'pending' | 'submitted' | 'graded' | 'overdue' | 'all'
type SortOption = 'dueDate' | 'course' | 'type' | 'score' | 'priority' | 'recentlyUpdated'
type ViewMode = 'list' | 'grid' | 'kanban'

/* ─── Constants ─── */
const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

/* ─── Helpers ─── */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'No due date'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function getDaysLeftText(daysLeft: number | null, isOverdue: boolean): string {
  if (daysLeft === null) return ''
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

function getPriorityLevel(daysLeft: number | null, isOverdue: boolean): 'urgent' | 'high' | 'medium' | 'low' {
  if (isOverdue) return 'urgent'
  if (daysLeft === null) return 'low'
  if (daysLeft <= 1) return 'urgent'
  if (daysLeft <= 3) return 'high'
  if (daysLeft <= 7) return 'medium'
  return 'low'
}

function getPriorityConfig(priority: 'urgent' | 'high' | 'medium' | 'low') {
  switch (priority) {
    case 'urgent': return { label: 'Urgent', color: 'bg-rose-500', textColor: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-50 dark:bg-rose-950/20', borderColor: 'border-rose-200 dark:border-rose-800/30', barColor: 'bg-rose-500' }
    case 'high': return { label: 'High', color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-950/20', borderColor: 'border-amber-200 dark:border-amber-800/30', barColor: 'bg-amber-500' }
    case 'medium': return { label: 'Medium', color: 'bg-orange-500', textColor: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-950/20', borderColor: 'border-orange-200 dark:border-orange-800/30', barColor: 'bg-orange-500' }
    case 'low': return { label: 'Low', color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-950/20', borderColor: 'border-emerald-200 dark:border-emerald-800/30', barColor: 'bg-emerald-500' }
  }
}

function getPrioritySortWeight(priority: 'urgent' | 'high' | 'medium' | 'low'): number {
  switch (priority) {
    case 'urgent': return 0
    case 'high': return 1
    case 'medium': return 2
    case 'low': return 3
  }
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'coding': return 'Coding'
    case 'written': return 'Written'
    case 'project': return 'Project'
    case 'peer-review': return 'Peer Review'
    case 'presentation': return 'Presentation'
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

function getTypeBgColor(type: string): string {
  switch (type) {
    case 'coding': return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
    case 'written': return 'bg-violet-500/10 text-violet-600 dark:text-violet-400'
    case 'project': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
    case 'peer-review': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
    default: return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
  }
}

/* ─── Static Icon Components (avoid creating during render) ─── */
function TypeIconRenderer({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case 'coding': return <Code2 className={className} />
    case 'written': return <PenTool className={className} />
    case 'project': return <FileText className={className} />
    case 'peer-review': return <Users className={className} />
    default: return <ClipboardList className={className} />
  }
}

function StatusIconRenderer({ status, className }: { status: string; className?: string }) {
  switch (status) {
    case 'pending': return <AlertCircle className={className} />
    case 'submitted': return <Clock className={className} />
    case 'graded': return <CheckCircle2 className={className} />
    default: return <AlertCircle className={className} />
  }
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'pending': return { label: 'Pending', icon: AlertCircle, color: 'bg-amber-500', badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/30' }
    case 'submitted': return { label: 'In Review', icon: Clock, color: 'bg-sky-500', badgeColor: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200 dark:border-sky-800/30' }
    case 'graded': return { label: 'Graded', icon: CheckCircle2, color: 'bg-emerald-500', badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30' }
    default: return { label: 'Unknown', icon: AlertCircle, color: 'bg-gray-500', badgeColor: 'bg-gray-100 text-gray-700 dark:bg-gray-950/40 dark:text-gray-400 border-gray-200 dark:border-gray-800/30' }
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

function getScoreBg(pct: number | null): string {
  if (pct === null) return ''
  if (pct >= 90) return 'bg-emerald-500/10 border-emerald-500/20'
  if (pct >= 80) return 'bg-teal-500/10 border-teal-500/20'
  if (pct >= 70) return 'bg-amber-500/10 border-amber-500/20'
  return 'bg-rose-500/10 border-rose-500/20'
}






/* ─── Upcoming Deadlines Widget ─── */
function UpcomingDeadlinesWidget({ assignments, onViewDetail }: {
  assignments: AssignmentItem[]
  onViewDetail: (id: string) => void
}) {
  const upcoming = assignments
    .filter(a => a.status === 'pending' && a.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5)

  if (upcoming.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-border/40 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Timer className="size-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-[14px] font-semibold">Upcoming Deadlines</h3>
        </div>
        <div className="flex flex-col items-center py-4 text-center">
          <CheckCircle2 className="size-8 text-emerald-400/50 mb-2" />
          <p className="text-[13px] text-muted-foreground">All caught up!</p>
          <p className="text-[11px] text-muted-foreground/60">No pending deadlines</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-card border border-border/40 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Timer className="size-4 text-amber-600 dark:text-amber-400" />
          <h3 className="text-[14px] font-semibold">Upcoming Deadlines</h3>
        </div>
        <span className="text-[11px] text-muted-foreground">{upcoming.length} pending</span>
      </div>
      <div className="space-y-1.5">
        {upcoming.map((a) => {
          const priority = getPriorityLevel(a.daysLeft, a.isOverdue)
          const config = getPriorityConfig(priority)
          return (
            <button
              key={a.id}
              onClick={() => onViewDetail(a.id)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/30 transition-colors w-full text-left"
            >
              <div className={cn('size-2.5 rounded-full shrink-0', config.color)} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate">{a.title}</p>
                <p className="text-[11px] text-muted-foreground">{a.courseName}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={cn('text-[11px] font-semibold', getDaysLeftColor(a.daysLeft, a.isOverdue))}>
                  {getDaysLeftText(a.daysLeft, a.isOverdue)}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ─── Course Progress Widget ─── */
function CourseProgressWidget({ assignments }: { assignments: AssignmentItem[] }) {
  const courseData = useMemo(() => {
    const map = new Map<string, { name: string; total: number; completed: number }>()
    assignments.forEach(a => {
      const existing = map.get(a.courseId)
      if (existing) {
        existing.total += 1
        if (a.status === 'graded' || a.status === 'submitted') existing.completed += 1
      } else {
        map.set(a.courseId, {
          name: a.courseName,
          total: 1,
          completed: a.status === 'graded' || a.status === 'submitted' ? 1 : 0,
        })
      }
    })
    return Array.from(map.values())
  }, [assignments])

  if (courseData.length === 0) return null

  return (
    <div className="rounded-2xl bg-card border border-border/40 p-5">
      <div className="flex items-center gap-2 mb-3">
        <GraduationCap className="size-4 text-teal-600 dark:text-teal-400" />
        <h3 className="text-[14px] font-semibold">Course Progress</h3>
      </div>
      <div className="space-y-3">
        {courseData.map((c) => {
          const pct = c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0
          return (
            <div key={c.name}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[12px] font-medium truncate max-w-[70%]">{c.name}</p>
                <span className="text-[11px] text-muted-foreground shrink-0">{c.completed}/{c.total}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={cn(
                    'h-full rounded-full',
                    pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                  )}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── AI Study Planner Widget ─── */
function AIStudyPlannerWidget({ assignments, onStartAssignment }: {
  assignments: AssignmentItem[]
  onStartAssignment: (id: string) => void
}) {
  const suggestion = useMemo(() => {
    const pending = assignments.filter(a => a.status === 'pending' && !a.isOverdue)
    if (pending.length === 0) {
      const overdue = assignments.filter(a => a.status === 'pending' && a.isOverdue)
      if (overdue.length > 0) {
        const mostOverdue = overdue.sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))[0]
        return { assignment: mostOverdue, reason: 'This assignment is overdue — submit it now to minimize penalty.' }
      }
      return null
    }

    // Prioritize: urgent first, then by closest deadline
    const sorted = [...pending].sort((a, b) => {
      const pa = getPriorityLevel(a.daysLeft, a.isOverdue)
      const pb = getPriorityLevel(b.daysLeft, b.isOverdue)
      const wa = getPrioritySortWeight(pa)
      const wb = getPrioritySortWeight(pb)
      if (wa !== wb) return wa - wb
      return (a.daysLeft ?? 999) - (b.daysLeft ?? 999)
    })

    const top = sorted[0]
    const priority = getPriorityLevel(top.daysLeft, top.isOverdue)
    const reason = priority === 'urgent'
      ? 'This assignment is due very soon — start working on it immediately!'
      : priority === 'high'
      ? 'This assignment has a close deadline — prioritize it next.'
      : 'Based on your deadlines and workload, this is a good next pick.'

    return { assignment: top, reason }
  }, [assignments])

  if (!suggestion) return null

  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/30 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="size-4 text-amber-600 dark:text-amber-400" />
        <h3 className="text-[14px] font-semibold">AI Study Planner</h3>
      </div>
      <p className="text-[12px] text-muted-foreground mb-2">Based on deadlines and difficulty, start with:</p>
      <div className="rounded-lg bg-white/60 dark:bg-black/20 border border-border/30 p-3 mb-3">
        <p className="text-[13px] font-semibold truncate">{suggestion.assignment.title}</p>
        <p className="text-[11px] text-muted-foreground">{suggestion.assignment.courseName}</p>
        <p className={cn('text-[11px] font-medium mt-1', getDaysLeftColor(suggestion.assignment.daysLeft, suggestion.assignment.isOverdue))}>
          {getDaysLeftText(suggestion.assignment.daysLeft, suggestion.assignment.isOverdue)}
        </p>
      </div>
      <p className="text-[11px] text-muted-foreground italic mb-3">{suggestion.reason}</p>
      <Button
        size="sm"
        className="w-full text-[12px] h-8 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
        onClick={() => onStartAssignment(suggestion.assignment.id)}
      >
        <ArrowRight className="size-3.5 mr-1" />
        Start This Assignment
      </Button>
    </div>
  )
}

/* ─── Enhanced Assignment Card ─── */
function AssignmentCard({
  assignment,
  onViewDetail,
  onQuickSubmit,
  viewMode,
  selected,
  onToggleSelect,
  bookmarked,
  onToggleBookmark,
}: {
  assignment: AssignmentItem
  onViewDetail: (id: string) => void
  onQuickSubmit: (id: string) => void
  viewMode: ViewMode
  selected: boolean
  onToggleSelect: (id: string) => void
  bookmarked: boolean
  onToggleBookmark: (id: string) => void
}) {
  const statusConfig = getStatusConfig(assignment.status)
  const priority = assignment.status === 'pending' ? getPriorityLevel(assignment.daysLeft, assignment.isOverdue) : null
  const priorityConfig = priority ? getPriorityConfig(priority) : null

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}?assignment=${assignment.id}`)
    toast.success('Link copied to clipboard')
  }

  if (viewMode === 'grid') {
    const barColor = priorityConfig?.barColor ?? 'bg-muted-foreground/30'
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2, transition: { duration: 0.2 } }}
        className={cn(
          'rounded-2xl bg-card overflow-hidden border transition-all cursor-pointer group relative',
          selected ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-border/40 hover:border-border/80'
        )}
        onClick={() => onViewDetail(assignment.id)}
      >
        {/* Colored top bar by priority */}
        <div className={cn('h-1.5', barColor)} />

        {/* Selection checkbox */}
        <div className="absolute top-3 left-3 z-10" onClick={(e) => { e.stopPropagation() }}>
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect(assignment.id)}
            className="bg-white/80 dark:bg-black/40 border-border/60"
          />
        </div>

        <div className="p-4 pt-3 space-y-3">
          {/* Top row: type + priority */}
          <div className="flex items-center justify-between">
            <Badge className={cn('text-[10px] gap-1 border-0 px-2 py-0.5', getTypeColor(assignment.type))}>
              <TypeIconRenderer type={assignment.type} className="size-3" />
              {getTypeLabel(assignment.type)}
            </Badge>
            <div className="flex items-center gap-1.5">
              {priorityConfig && (
                <Badge variant="outline" className={cn('text-[10px] gap-1 px-2 py-0.5', priorityConfig.borderColor, priorityConfig.textColor)}>
                  <Flag className="size-2.5" />
                  {priorityConfig.label}
                </Badge>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onToggleBookmark(assignment.id) }}
                className={cn('p-1 rounded transition-colors', bookmarked ? 'text-amber-500' : 'text-muted-foreground/40 hover:text-amber-500')}
              >
                <Bookmark className="size-3.5" fill={bookmarked ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <h3 className="text-[15px] font-semibold line-clamp-2 group-hover:text-primary transition-colors">
              {assignment.title}
            </h3>
            <p className="text-[12px] text-muted-foreground mt-1">{assignment.courseName} · {assignment.instructorName}</p>
          </div>

          {/* Due date / Status */}
          {assignment.status === 'pending' && (
            <div className={cn('flex items-center gap-1.5 text-[12px] font-medium', getDaysLeftColor(assignment.daysLeft, assignment.isOverdue))}>
              <Calendar className="size-3.5" />
              {assignment.isOverdue ? 'Overdue' : `Due ${formatDate(assignment.dueDate)}`}
              <span className="text-muted-foreground">· {getDaysLeftText(assignment.daysLeft, assignment.isOverdue)}</span>
            </div>
          )}

          {assignment.status === 'submitted' && (
            <div className="flex items-center gap-1.5 text-[12px] text-sky-600 dark:text-sky-400">
              <Clock className="size-3.5" />
              Submitted {formatDate(assignment.submittedAt)}
            </div>
          )}

          {assignment.status === 'graded' && (
            <div className={cn('flex items-center justify-between rounded-lg border p-2.5', getScoreBg(assignment.scorePercentage))}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className={cn('size-5', getScoreColor(assignment.scorePercentage))} />
                <div>
                  <p className={cn('text-[18px] font-bold leading-none', getScoreColor(assignment.scorePercentage))}>
                    {assignment.score ?? '—'}/{assignment.maxScore}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{assignment.letterGrade ?? ''}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground">Score</p>
                <p className={cn('text-[14px] font-bold', getScoreColor(assignment.scorePercentage))}>
                  {assignment.scorePercentage != null ? assignment.scorePercentage.toFixed(0) : '—'}%
                </p>
              </div>
            </div>
          )}

          {/* Max score + instructor */}
          {assignment.status !== 'graded' && (
            <div className="flex items-center justify-between text-[12px] text-muted-foreground">
              <span>{assignment.maxScore} points</span>
            </div>
          )}

          {/* Actions row */}
          <div className="flex items-center gap-1.5 pt-1 border-t border-border/30">
            <Button
              variant="ghost"
              size="sm"
              className="text-[11px] h-7 px-2 text-primary hover:text-primary/80"
              onClick={(e) => { e.stopPropagation(); onViewDetail(assignment.id) }}
            >
              <Eye className="size-3.5 mr-1" />
              View
            </Button>
            {assignment.status === 'pending' && (
              <Button
                size="sm"
                className="text-[11px] h-7 px-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                onClick={(e) => { e.stopPropagation(); onQuickSubmit(assignment.id) }}
              >
                <Send className="size-3 mr-1" />
                Submit
              </Button>
            )}
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="size-7 p-0">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewDetail(assignment.id) }}>
                    <Eye className="size-4 mr-2" /> View Details
                  </DropdownMenuItem>
                  {assignment.status === 'pending' && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onQuickSubmit(assignment.id) }}>
                      <Send className="size-4 mr-2" /> Submit
                    </DropdownMenuItem>
                  )}
                  {assignment.resources.length > 0 && (
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.info('Downloading resources...') }}>
                      <Download className="size-4 mr-2" /> Download Resources
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.info('Opening Ask ShijlAI...') }}>
                    <Sparkles className="size-4 mr-2" /> Ask <ShijlAIText />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCopyLink() }}>
                    <Link2 className="size-4 mr-2" /> Copy Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleBookmark(assignment.id) }}>
                    <Bookmark className="size-4 mr-2" fill={bookmarked ? 'currentColor' : 'none'} />
                    {bookmarked ? 'Remove Bookmark' : 'Bookmark'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // ─── List View ───
  const barColor = priorityConfig?.barColor ?? 'bg-muted-foreground/30'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ x: 2, transition: { duration: 0.15 } }}
      className={cn(
        'rounded-xl bg-card border transition-all cursor-pointer group relative overflow-hidden',
        selected ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-border/40 hover:border-border/80'
      )}
      onClick={() => onViewDetail(assignment.id)}
    >
      {/* Left priority color bar */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-1', barColor)} />

      <div className="flex items-center gap-3 p-4 pl-5">
        {/* Checkbox */}
        <div onClick={(e) => { e.stopPropagation() }}>
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect(assignment.id)}
          />
        </div>

        {/* Type icon with colored background */}
        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', getTypeBgColor(assignment.type))}>
          <TypeIconRenderer type={assignment.type} className="size-4" />
        </div>

        {/* Middle: Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-[14px] font-semibold truncate group-hover:text-primary transition-colors">
              {assignment.title}
            </h3>
            {priorityConfig && (
              <Badge variant="outline" className={cn('text-[10px] gap-0.5 px-1.5 py-0 shrink-0', priorityConfig.borderColor, priorityConfig.textColor)}>
                <Flag className="size-2.5" />
                {priorityConfig.label}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-0 bg-muted/50">
              {assignment.courseName}
            </Badge>
            <Badge className={cn('text-[10px] gap-0.5 border-0 px-1.5 py-0', getTypeColor(assignment.type))}>
              <TypeIconRenderer type={assignment.type} className="size-2.5" />
              {getTypeLabel(assignment.type)}
            </Badge>
            <span className="text-[11px] text-muted-foreground">{assignment.instructorName}</span>
          </div>
        </div>

        {/* Right: Status + Due/Score */}
        <div className="flex items-center gap-3 shrink-0">
          {assignment.status === 'pending' && (
            <div className="text-right">
              <p className={cn('text-[13px] font-semibold', getDaysLeftColor(assignment.daysLeft, assignment.isOverdue))}>
                {assignment.isOverdue ? 'Overdue' : formatDate(assignment.dueDate)}
              </p>
              <p className={cn('text-[11px]', getDaysLeftColor(assignment.daysLeft, assignment.isOverdue))}>
                {getDaysLeftText(assignment.daysLeft, assignment.isOverdue)}
              </p>
            </div>
          )}
          {assignment.status === 'submitted' && (
            <div className="text-right">
              <Badge variant="outline" className={cn('text-[11px] gap-1', statusConfig.badgeColor)}>
                <Clock className="size-3" /> In Review
              </Badge>
              <p className="text-[11px] text-muted-foreground mt-1">{formatDate(assignment.submittedAt)}</p>
            </div>
          )}
          {assignment.status === 'graded' && (
            <div className={cn('text-right rounded-lg border px-3 py-1.5', getScoreBg(assignment.scorePercentage))}>
              <p className={cn('text-[16px] font-bold leading-none', getScoreColor(assignment.scorePercentage))}>
                {assignment.score ?? '—'}/{assignment.maxScore}
              </p>
              <p className={cn('text-[11px] font-semibold', getScoreColor(assignment.scorePercentage))}>{assignment.letterGrade ?? ''}</p>
            </div>
          )}

          <Badge variant="outline" className={cn('text-[10px] gap-1', statusConfig.badgeColor)}>
            <StatusIconRenderer status={assignment.status} className="size-3" />
            {statusConfig.label}
          </Badge>

          {/* Quick action buttons */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-7 p-0"
                    onClick={(e) => { e.stopPropagation(); onViewDetail(assignment.id) }}
                  >
                    <Eye className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View Details</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {assignment.status === 'pending' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-7 p-0 text-emerald-600 hover:text-emerald-700"
                      onClick={(e) => { e.stopPropagation(); onQuickSubmit(assignment.id) }}
                    >
                      <Send className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Quick Submit</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {assignment.resources.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-7 p-0"
                      onClick={(e) => { e.stopPropagation(); toast.info('Downloading resources...') }}
                    >
                      <Download className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download Resources</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={cn('p-1 rounded transition-colors', bookmarked ? 'text-amber-500' : 'text-muted-foreground/50 hover:text-amber-500')}
                    onClick={(e) => { e.stopPropagation(); onToggleBookmark(assignment.id) }}
                  >
                    <Bookmark className="size-3.5" fill={bookmarked ? 'currentColor' : 'none'} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{bookmarked ? 'Remove Bookmark' : 'Bookmark'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* 3-dot menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="size-7 p-0 opacity-50 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewDetail(assignment.id) }}>
                <Eye className="size-4 mr-2" /> View Details
              </DropdownMenuItem>
              {assignment.status === 'pending' && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onQuickSubmit(assignment.id) }}>
                  <Send className="size-4 mr-2" /> Submit
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.info('Downloading instructions...') }}>
                <Download className="size-4 mr-2" /> Download Instructions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.info('Opening Ask ShijlAI...') }}>
                <Sparkles className="size-4 mr-2" /> Ask <ShijlAIText />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCopyLink() }}>
                <Link2 className="size-4 mr-2" /> Copy Link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleBookmark(assignment.id) }}>
                <Bookmark className="size-4 mr-2" fill={bookmarked ? 'currentColor' : 'none'} />
                {bookmarked ? 'Remove Bookmark' : 'Bookmark'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ChevronRight className="size-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Quick Submit Dialog ─── */
function QuickSubmitDialog({
  open,
  onClose,
  assignment,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  assignment: AssignmentItem | null
  onSubmit: (id: string, content: string, files: { name: string; size: number }[]) => void
}) {
  const [mode, setMode] = useState<'file' | 'text' | 'code'>('text')
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<{ name: string; size: number }[]>([])
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (open) {
      setContent('')
      setFiles([])
      setNote('')
      setSubmitting(false)
      setConfirmed(false)
      if (assignment) {
        setMode(assignment.submissionType === 'file' ? 'file' : assignment.submissionType === 'code' ? 'code' : 'text')
      }
    }
  }, [open, assignment])

  const handleFileAdd = () => {
    const fileName = assignment?.type === 'coding' ? 'solution.py' : 'assignment.pdf'
    setFiles(prev => prev.some(f => f.name === fileName) ? prev : [...prev, { name: fileName, size: Math.floor(Math.random() * 10000) + 500 }])
    toast.success(`${fileName} added`)
  }

  const handleSubmit = async () => {
    if (!assignment) return
    if (mode === 'file' && files.length === 0) { toast.error('Please upload a file'); return }
    if ((mode === 'text' || mode === 'code') && !content.trim()) { toast.error('Please write your submission'); return }
    setSubmitting(true)
    try {
      onSubmit(assignment.id, content || note, files)
    } finally {
      setSubmitting(false)
      onClose()
    }
  }

  if (!assignment) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[18px] font-bold flex items-center gap-2">
            <Send className="size-5 text-emerald-600" />
            Submit Assignment
          </DialogTitle>
          <DialogDescription>{assignment.title}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Assignment info */}
          <div className="rounded-xl bg-muted/40 border border-border/30 p-3 space-y-1">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted-foreground">Course</span>
              <span className="font-medium">{assignment.courseName}</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted-foreground">Due</span>
              <span className={cn('font-medium', getDaysLeftColor(assignment.daysLeft, assignment.isOverdue))}>
                {formatDate(assignment.dueDate)} · {getDaysLeftText(assignment.daysLeft, assignment.isOverdue)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-muted-foreground">Max Score</span>
              <span className="font-medium">{assignment.maxScore} pts</span>
            </div>
          </div>

          {/* Submission type selector */}
          <div>
            <Label className="text-[13px] font-medium">Submission Type</Label>
            <div className="flex items-center gap-2 mt-2">
              {([
                { mode: 'file' as const, label: 'File Upload', icon: Upload },
                { mode: 'text' as const, label: 'Text', icon: FileText },
                { mode: 'code' as const, label: 'Code', icon: Code2 },
              ]).map(opt => (
                <button
                  key={opt.mode}
                  onClick={() => setMode(opt.mode)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-medium transition-all',
                    mode === opt.mode
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : 'border-border/50 bg-muted/30 text-muted-foreground hover:bg-accent/50'
                  )}
                >
                  <opt.icon className="size-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* File upload */}
          {mode === 'file' && (
            <div className="space-y-2">
              <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-background/50 py-6 px-4 cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-50/30 transition-colors" onClick={handleFileAdd}>
                <div className="text-center">
                  <Upload className="size-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-[13px] text-muted-foreground">
                    Drag & drop or <span className="text-emerald-600 dark:text-emerald-400 font-medium">browse files</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1">PDF, DOC, ZIP up to 25MB</p>
                </div>
              </div>
              {files.map(f => (
                <div key={f.name} className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                  <File className="size-4 text-emerald-500" />
                  <span className="text-[13px] font-medium">{f.name}</span>
                  <span className="text-[11px] text-muted-foreground">({(f.size / 1024).toFixed(1)} KB)</span>
                  <CheckCircle2 className="size-3.5 text-emerald-500 ml-auto" />
                  <button onClick={() => setFiles(prev => prev.filter(p => p.name !== f.name))} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Text mode */}
          {mode === 'text' && (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={assignment.wordLimit ? `Write your response here... (${assignment.wordLimit} word limit)` : 'Write your response here...'}
              className="min-h-[150px] text-[14px] resize-y"
            />
          )}

          {/* Code mode */}
          {mode === 'code' && (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# Write your code here..."
              className="min-h-[200px] rounded-xl bg-zinc-950 text-green-400 px-4 py-3 text-[13px] font-mono placeholder:text-zinc-600 resize-y border-zinc-800 focus-visible:ring-emerald-500/30"
            />
          )}

          {/* Note */}
          <div>
            <Label className="text-[12px] text-muted-foreground">Note to instructor (optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any notes about your submission..."
              className="mt-1.5 min-h-[60px] text-[13px] resize-none"
            />
          </div>

          {/* Confirmation checkbox */}
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 p-3">
            <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(v as boolean)} className="mt-0.5" />
            <Label className="text-[12px] text-foreground leading-relaxed cursor-pointer">
              I confirm this is my own work and I understand the academic integrity policy. Late submissions may receive a penalty.
            </Label>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !confirmed}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20"
          >
            {submitting ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Send className="size-4 mr-1.5" />}
            Submit Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Skeleton ─── */
function AssignmentSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'grid') {
    return (
      <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
        <div className="h-1.5 bg-muted/50" />
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    )
  }
  return (
    <div className="rounded-xl border border-border/40 bg-card p-4 pl-5">
      <div className="flex items-center gap-3">
        <Skeleton className="size-5 rounded" />
        <Skeleton className="size-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
    </div>
  )
}

/* ─── Batch Actions Bar ─── */
function BatchActionsBar({
  count,
  onClear,
  onSubmitSelected,
  onExportSelected,
  onBookmarkSelected,
}: {
  count: number
  onClear: () => void
  onSubmitSelected: () => void
  onExportSelected: () => void
  onBookmarkSelected: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl bg-card border border-border shadow-xl px-5 py-3"
    >
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <CheckCheck className="size-4" />
        </div>
        <span className="text-[13px] font-semibold">{count} selected</span>
      </div>
      <Separator orientation="vertical" className="h-6" />
      <Button variant="ghost" size="sm" className="text-[12px] h-8" onClick={onSubmitSelected}>
        <Send className="size-3.5 mr-1" />
        Submit
      </Button>
      <Button variant="ghost" size="sm" className="text-[12px] h-8" onClick={onExportSelected}>
        <Download className="size-3.5 mr-1" />
        Export
      </Button>
      <Button variant="ghost" size="sm" className="text-[12px] h-8" onClick={onBookmarkSelected}>
        <Bookmark className="size-3.5 mr-1" />
        Bookmark
      </Button>
      <Separator orientation="vertical" className="h-6" />
      <Button variant="ghost" size="sm" className="text-[12px] h-8 text-muted-foreground" onClick={onClear}>
        <X className="size-3.5 mr-1" />
        Clear
      </Button>
    </motion.div>
  )
}

/* ─── Empty States ─── */
function EmptyState({ activeTab, searchQuery }: { activeTab: TabFilter; searchQuery: string }) {
  const config = {
    pending: {
      icon: CheckCircle2,
      title: 'All Caught Up!',
      subtitle: "You've completed all your pending assignments. Great job!",
      color: 'text-emerald-400/60 dark:text-emerald-500/40',
      bg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20',
    },
    submitted: {
      icon: Clock,
      title: 'No Submissions Under Review',
      subtitle: "No assignments are currently being reviewed.",
      color: 'text-sky-400/60 dark:text-sky-500/40',
      bg: 'from-sky-50 to-cyan-50 dark:from-sky-950/20 dark:to-cyan-950/20',
    },
    graded: {
      icon: Award,
      title: 'No Graded Assignments',
      subtitle: "You haven't received any grades yet. Keep submitting your work!",
      color: 'text-amber-400/60 dark:text-amber-500/40',
      bg: 'from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20',
    },
    overdue: {
      icon: CheckCircle2,
      title: 'No Overdue Assignments!',
      subtitle: "You're on track with all your deadlines!",
      color: 'text-emerald-400/60 dark:text-emerald-500/40',
      bg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20',
    },
    all: {
      icon: ClipboardList,
      title: searchQuery ? 'No Matching Assignments' : 'No Assignments Yet',
      subtitle: searchQuery ? "Try adjusting your search or filters." : "Your instructor hasn't posted any assignments yet.",
      color: 'text-amber-400/60 dark:text-amber-500/40',
      bg: 'from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20',
    },
  }[activeTab]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 gap-4 text-center"
    >
      <div className={cn('rounded-2xl bg-gradient-to-br p-8', config.bg)}>
        <config.icon className={cn('size-14', config.color)} />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-[20px] font-bold text-foreground">{config.title}</h3>
        <p className="text-[14px] text-muted-foreground max-w-sm">{config.subtitle}</p>
      </div>
    </motion.div>
  )
}

/* ─── Main View ─── */
export function StudentAssignmentsView() {
  const { currentUser, setCurrentView, setSelectedAssignmentId } = useAppStore()
  const [allAssignments, setAllAssignments] = useState<AssignmentItem[]>([])
  const [summary, setSummary] = useState({ pending: 0, submitted: 0, graded: 0, total: 0 })

  // On-time rate: percentage of submitted (non-overdue) out of all submitted+graded
  const onTimeRate = useMemo(() => {
    const submitted = allAssignments.filter(a => a.status === 'submitted' || a.status === 'graded')
    if (submitted.length === 0) return 0
    const onTime = submitted.filter(a => !a.isOverdue || (a.submittedAt && a.dueDate && new Date(a.submittedAt) <= new Date(a.dueDate)))
    return Math.round((onTime.length / submitted.length) * 100)
  }, [allAssignments])

  // Average score from graded assignments
  const avgScore = useMemo(() => {
    const graded = allAssignments.filter(a => a.status === 'graded' && a.scorePercentage !== null)
    if (graded.length === 0) return 0
    const total = graded.reduce((acc, a) => acc + (a.scorePercentage ?? 0), 0)
    return Math.round(total / graded.length)
  }, [allAssignments])

  // Sparkline data
  const pendingSparkline = useMemo(() => [Math.max(0, summary.total), Math.max(0, summary.total + 2), Math.max(0, summary.total - 1), Math.max(0, summary.total + 3), Math.max(0, summary.pending), Math.max(0, summary.pending)], [summary])
  const onTimeSparkline = useMemo(() => [Math.max(0, onTimeRate - 10), Math.max(0, onTimeRate - 5), Math.max(0, onTimeRate + 2), Math.max(0, onTimeRate - 3), Math.max(0, onTimeRate), Math.max(0, onTimeRate)], [onTimeRate])
  const scoreSparkline = useMemo(() => [Math.max(0, avgScore - 8), Math.max(0, avgScore - 3), Math.max(0, avgScore + 5), Math.max(0, avgScore - 2), Math.max(0, avgScore + 1), Math.max(0, avgScore)], [avgScore])

  const [activeTab, setActiveTab] = useState<TabFilter>('pending')
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('dueDate')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [quickSubmitOpen, setQuickSubmitOpen] = useState(false)
  const [quickSubmitAssignment, setQuickSubmitAssignment] = useState<AssignmentItem | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())

  const searchInputRef = useRef<HTMLInputElement>(null)

  const fetchAssignments = useCallback(async () => {
    try {
      const res = await fetch(`/api/student/assignments?userId=${currentUser?.id || 'demo-user-1'}&status=all`)
      if (res.ok) {
        const data = await res.json()
        const all = data.assignments || []
        setAllAssignments(all)
        setSummary(data.summary || { pending: 0, submitted: 0, graded: 0, total: 0 })
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K / Ctrl+K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      // Escape to clear filters
      if (e.key === 'Escape') {
        setSearchQuery('')
        setCourseFilter('all')
        setTypeFilter('all')
        searchInputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Filter + sort assignments
  const filteredAssignments = useMemo(() => {
    let filtered = [...allAssignments]

    // Tab filter
    if (activeTab === 'overdue') {
      filtered = filtered.filter(a => a.isOverdue && a.status === 'pending')
    } else if (activeTab !== 'all') {
      filtered = filtered.filter(a => a.status === activeTab)
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.courseName.toLowerCase().includes(q) ||
        a.instructorName.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q)
      )
    }

    // Course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter(a => a.courseId === courseFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(a => a.type === typeFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate': {
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
          return aDate - bDate
        }
        case 'course':
          return a.courseName.localeCompare(b.courseName)
        case 'type':
          return a.type.localeCompare(b.type)
        case 'score':
          return (b.scorePercentage ?? 0) - (a.scorePercentage ?? 0)
        case 'priority': {
          const pa = a.status === 'pending' ? getPriorityLevel(a.daysLeft, a.isOverdue) : 'low' as const
          const pb = b.status === 'pending' ? getPriorityLevel(b.daysLeft, b.isOverdue) : 'low' as const
          return getPrioritySortWeight(pa) - getPrioritySortWeight(pb)
        }
        case 'recentlyUpdated': {
          const aTime = Math.max(
            a.submittedAt ? new Date(a.submittedAt).getTime() : 0,
            a.gradedAt ? new Date(a.gradedAt).getTime() : 0,
            a.dueDate ? new Date(a.dueDate).getTime() : 0,
          )
          const bTime = Math.max(
            b.submittedAt ? new Date(b.submittedAt).getTime() : 0,
            b.gradedAt ? new Date(b.gradedAt).getTime() : 0,
            b.dueDate ? new Date(b.dueDate).getTime() : 0,
          )
          return bTime - aTime
        }
        default:
          return 0
      }
    })

    return filtered
  }, [allAssignments, activeTab, searchQuery, courseFilter, typeFilter, sortBy])

  // Unique courses and types for filters
  const courseOptions = useMemo(() => {
    const map = new Map<string, string>()
    allAssignments.forEach(a => map.set(a.courseId, a.courseName))
    return Array.from(map.entries())
  }, [allAssignments])

  const typeOptions = useMemo(() => {
    const types = new Set(allAssignments.map(a => a.type))
    return Array.from(types)
  }, [allAssignments])

  const overdueCount = useMemo(() =>
    allAssignments.filter(a => a.isOverdue && a.status === 'pending').length,
    [allAssignments]
  )

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (searchQuery) count++
    if (courseFilter !== 'all') count++
    if (typeFilter !== 'all') count++
    return count
  }, [searchQuery, courseFilter, typeFilter])

  // Selection helpers
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredAssignments.map(a => a.id)))
  }, [filteredAssignments])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // Bookmark helpers
  const toggleBookmark = useCallback((id: string) => {
    setBookmarkedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Export feature
  const handleExport = useCallback(() => {
    const data = filteredAssignments.map(a => ({
      title: a.title,
      course: a.courseName,
      type: a.type,
      status: a.status,
      dueDate: a.dueDate ?? 'No due date',
      daysLeft: a.daysLeft ?? 'N/A',
      score: a.score ?? 'N/A',
      maxScore: a.maxScore,
      letterGrade: a.letterGrade ?? 'N/A',
    }))
    const csv = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `assignments-export-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Assignments exported successfully!')
  }, [filteredAssignments])

  const handleViewDetail = (assignmentId: string) => {
    setSelectedAssignmentId(assignmentId)
    setCurrentView('student-assignment-detail')
  }

  const handleQuickSubmit = (assignmentId: string) => {
    const assignment = allAssignments.find(a => a.id === assignmentId)
    if (assignment) {
      setQuickSubmitAssignment(assignment)
      setQuickSubmitOpen(true)
    }
  }

  const handleSubmit = async (assignmentId: string, content: string, files: { name: string; size: number }[]) => {
    try {
      const res = await fetch('/api/student/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'demo-user-1',
          assignmentId,
          content,
          fileUrls: files.map(f => ({ name: f.name, url: `/uploads/${f.name}`, type: 'file', size: f.size })),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(data.message || 'Assignment submitted! +10 XP')
        fetchAssignments()
      } else {
        toast.error('Failed to submit assignment')
      }
    } catch {
      toast.error('Failed to submit assignment')
    }
  }

  // Batch submit
  const handleBatchSubmit = () => {
    const pendingSelected = filteredAssignments.filter(a => selectedIds.has(a.id) && a.status === 'pending')
    if (pendingSelected.length === 0) {
      toast.error('No pending assignments selected')
      return
    }
    toast.info(`${pendingSelected.length} assignment(s) queued for submission`)
    clearSelection()
  }

  // Batch bookmark
  const handleBatchBookmark = () => {
    setBookmarkedIds(prev => {
      const next = new Set(prev)
      selectedIds.forEach(id => next.add(id))
      return next
    })
    toast.success(`${selectedIds.size} assignment(s) bookmarked`)
    clearSelection()
  }

  const tabs: { id: TabFilter; label: string; icon: React.ElementType; count: number }[] = [
    { id: 'pending', label: 'Pending', icon: AlertCircle, count: summary.pending },
    { id: 'submitted', label: 'In Review', icon: Clock, count: summary.submitted },
    { id: 'graded', label: 'Graded', icon: CheckCircle2, count: summary.graded },
    ...(overdueCount > 0 ? [{ id: 'overdue' as TabFilter, label: 'Overdue', icon: AlertTriangle, count: overdueCount }] : []),
    { id: 'all', label: 'All', icon: ClipboardList, count: summary.total },
  ]

  // Current date for hero
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="space-y-5"
    >
      {/* ─── Professional Hero Banner ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 p-4 sm:p-6 text-white shadow-lg">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-6 -right-6 size-40 rounded-full bg-white/20" />
          <div className="absolute -bottom-10 -left-10 size-52 rounded-full bg-white/10" />
          <div className="absolute top-1/2 right-1/3 size-20 rounded-full bg-white/15" />
        </div>

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex size-10 sm:size-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <ClipboardList className="size-5 sm:size-7" />
            </div>
            <div>
              <h1 className="text-[20px] sm:text-[26px] font-bold leading-tight">Assignments Center</h1>
              <p className="text-[12px] sm:text-[13px] text-white/80">{today}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Quick stats in hero */}
            {summary.pending > 0 && (
              <div className="flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm px-4 py-2">
                <span className="relative flex size-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2.5 bg-amber-300" />
                </span>
                <span className="text-[13px] font-semibold">{summary.pending} pending</span>
              </div>
            )}

            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border-0 text-[12px] h-9 rounded-xl"
              onClick={() => {
                const pendingAssignment = allAssignments.find(a => a.status === 'pending')
                if (pendingAssignment) handleQuickSubmit(pendingAssignment.id)
                else toast.info('No pending assignments to submit')
              }}
            >
              <Send className="size-3.5 mr-1.5" />
              Quick Submit
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border-0 text-[12px] h-9 rounded-xl"
              onClick={handleExport}
            >
              <Download className="size-3.5 mr-1.5" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Enhanced Dashboard Stats (6 cards) ─── */}
      <StudentStatCardGrid columns={6}>
        <StudentStatCard
          icon={AlertCircle}
          value={summary.pending}
          label="Pending"
          color="amber"
          pulse={summary.pending > 0}
          sparkData={pendingSparkline}
          index={0}
        />
        <StudentStatCard
          icon={Clock}
          value={summary.submitted}
          label="In Review"
          color="sky"
          sparkData={[0, summary.submitted]}
          index={1}
        />
        <StudentStatCard
          icon={CheckCircle2}
          value={summary.graded}
          label="Graded"
          color="emerald"
          sparkData={[0, summary.graded]}
          index={2}
        />
        <StudentStatCard
          icon={BarChart3}
          value={summary.total}
          label="Total"
          color="teal"
          sparkData={[0, summary.total]}
          index={3}
        />
        <StudentStatCard
          icon={Target}
          value={`${onTimeRate}%`}
          label="On-Time Rate"
          color={onTimeRate >= 90 ? 'emerald' : onTimeRate >= 70 ? 'amber' : 'rose'}
          sparkData={onTimeSparkline}
          index={4}
        />
        <StudentStatCard
          icon={Award}
          value={avgScore > 0 ? `${avgScore}%` : '--'}
          label="Avg Score"
          color={avgScore >= 80 ? 'teal' : avgScore >= 60 ? 'amber' : 'rose'}
          sparkData={scoreSparkline}
          index={5}
        />
      </StudentStatCardGrid>

      {/* ─── Two-Column Layout on Desktop ─── */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left (Main) */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Search & Filter Bar */}
          <div className="space-y-3">
            {/* Mobile: Search + Status chips (desktop has them in the single-row bar below) */}
            <div className="md:hidden space-y-3">
              {/* Search with keyboard shortcut hint */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assignments..."
                  className="pl-10 pr-20 h-9 sm:h-10 rounded-xl text-[14px] border-border/50 focus-visible:ring-emerald-500/20"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status filter chips */}
              <div className="overflow-x-auto scrollbar-thin -mx-3 px-3">
                <div className="flex items-center gap-2 flex-nowrap">
                  {tabs.map((tab) => {
                    const TabIcon = tab.icon
                    return (
                      <motion.button
                        key={tab.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all whitespace-nowrap',
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20'
                            : 'bg-muted/60 text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                        )}
                      >
                        <TabIcon className="size-3.5" />
                        {tab.label}
                        <span className={cn(
                          'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                          activeTab === tab.id
                            ? 'bg-white/20 text-white'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {tab.count}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Mobile: Filter button + Sheet */}
            <MobileFilterSheet
              activeCount={activeFilterCount}
              onClearAll={() => { setSearchQuery(''); setCourseFilter('all'); setTypeFilter('all') }}
            >
              <MobileFilterGroup label="Course">
                <Select value={courseFilter} onValueChange={setCourseFilter}>
                  <SelectTrigger className="w-full h-10 text-[13px] rounded-lg">
                    <BookOpen className="size-3.5 mr-1.5 text-muted-foreground" />
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courseOptions.map(([id, name]) => (
                      <SelectItem key={id} value={id}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </MobileFilterGroup>
              <MobileFilterGroup label="Type">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full h-10 text-[13px] rounded-lg">
                    <FileText className="size-3.5 mr-1.5 text-muted-foreground" />
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {typeOptions.map(t => (
                      <SelectItem key={t} value={t}>{getTypeLabel(t)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </MobileFilterGroup>
              <MobileFilterGroup label="Sort By">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-full h-10 text-[13px] rounded-lg">
                    <ArrowUpDown className="size-3.5 mr-1.5 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dueDate">Sort: Due Date</SelectItem>
                    <SelectItem value="course">Sort: Course</SelectItem>
                    <SelectItem value="type">Sort: Type</SelectItem>
                    <SelectItem value="score">Sort: Score</SelectItem>
                    <SelectItem value="priority">Sort: Priority</SelectItem>
                    <SelectItem value="recentlyUpdated">Sort: Recently Updated</SelectItem>
                  </SelectContent>
                </Select>
              </MobileFilterGroup>
            </MobileFilterSheet>

            {/* Desktop: Tabs + Search + Sort + View Mode — Single Row */}
            <div className="hidden md:flex items-center gap-2">
              {/* Status filter chips */}
              {tabs.map((tab) => {
                const TabIcon = tab.icon
                return (
                  <motion.button
                    key={tab.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all whitespace-nowrap',
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/20'
                        : 'bg-muted/60 text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                    )}
                  >
                    <TabIcon className="size-3.5" />
                    {tab.label}
                    <span className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                      activeTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-muted text-muted-foreground'
                    )}>
                      {tab.count}
                    </span>
                  </motion.button>
                )
              })}

              {/* Search input */}
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assignments..."
                  className="pl-9 pr-8 h-8 rounded-lg text-[12px] border-border/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Sort select */}
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-auto min-w-[150px] h-8 text-[12px] rounded-lg">
                  <ArrowUpDown className="size-3 mr-1 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dueDate">Sort: Due Date</SelectItem>
                  <SelectItem value="course">Sort: Course</SelectItem>
                  <SelectItem value="type">Sort: Type</SelectItem>
                  <SelectItem value="score">Sort: Score</SelectItem>
                  <SelectItem value="priority">Sort: Priority</SelectItem>
                  <SelectItem value="recentlyUpdated">Sort: Recently Updated</SelectItem>
                </SelectContent>
              </Select>

              {/* View mode toggle */}
              <div className="flex items-center rounded-lg border border-border/50 p-0.5">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setViewMode('list')}
                        className={cn('p-1.5 rounded-md transition-colors', viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground')}
                      >
                        <List className="size-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>List View</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={cn('p-1.5 rounded-md transition-colors', viewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground')}
                      >
                        <LayoutGrid className="size-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Grid View</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setViewMode('kanban')}
                        className={cn('p-1.5 rounded-md transition-colors', viewMode === 'kanban' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground')}
                      >
                        <Columns3 className="size-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Kanban View</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* Clear Filters button */}
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[12px] h-8 text-muted-foreground hover:text-foreground"
                  onClick={() => { setSearchQuery(''); setCourseFilter('all'); setTypeFilter('all') }}
                >
                  <RotateCcw className="size-3 mr-1" />
                  Clear
                  <Badge className="ml-1 size-5 p-0 flex items-center justify-center text-[10px] rounded-full bg-amber-500 text-white border-0">
                    {activeFilterCount}
                  </Badge>
                </Button>
              )}
            </div>

            {/* Select All / Count bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {filteredAssignments.length > 0 && (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={selectedIds.size === filteredAssignments.length ? clearSelection : selectAll}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (selectedIds.size === filteredAssignments.length) { clearSelection() } else { selectAll() } } }}
                    className="text-[12px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedIds.size === filteredAssignments.length && filteredAssignments.length > 0}
                      onCheckedChange={() => selectedIds.size === filteredAssignments.length ? clearSelection() : selectAll()}
                    />
                    {selectedIds.size === filteredAssignments.length ? 'Deselect All' : 'Select All'}
                  </div>
                )}
              </div>
              <span className="text-[12px] text-muted-foreground">
                {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className={cn(viewMode === 'grid' ? 'grid gap-3 grid-cols-1 sm:grid-cols-2' : 'space-y-3')}>
              {Array.from({ length: 6 }).map((_, i) => (
                <AssignmentSkeleton key={i} viewMode={viewMode} />
              ))}
            </div>
          )}

          {/* ─── Kanban View ─── */}
          {!loading && viewMode === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['pending', 'submitted', 'graded'] as const).map((status) => {
                const items = filteredAssignments.filter(a => a.status === status)
                const statusConf = getStatusConfig(status)
                return (
                  <div key={status} className="rounded-xl bg-muted/30 border border-border/30 p-3">
                    <div className="flex items-center gap-2 mb-3 px-1">
                      <StatusIconRenderer status={status} className={cn('size-4', status === 'pending' ? 'text-amber-500' : status === 'submitted' ? 'text-sky-500' : 'text-emerald-500')} />
                      <h3 className="text-[13px] font-semibold">{statusConf.label}</h3>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{items.length}</Badge>
                    </div>
                    <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                      {items.map((a) => {
                        const priority = a.status === 'pending' ? getPriorityLevel(a.daysLeft, a.isOverdue) : null
                        const priorityConf = priority ? getPriorityConfig(priority) : null
                        const isSelected = selectedIds.has(a.id)
                        return (
                          <motion.div
                            key={a.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                              'rounded-lg bg-card border p-3 cursor-pointer hover:border-border/80 transition-all',
                              isSelected ? 'border-amber-500 ring-1 ring-amber-500/20' : 'border-border/40'
                            )}
                            onClick={() => handleViewDetail(a.id)}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <Badge className={cn('text-[9px] gap-0.5 border-0 px-1.5 py-0', getTypeColor(a.type))}>
                                <TypeIconRenderer type={a.type} className="size-2.5" />
                                {getTypeLabel(a.type)}
                              </Badge>
                              {priorityConf && (
                                <div className={cn('size-2 rounded-full', priorityConf.color)} title={priorityConf.label} />
                              )}
                            </div>
                            <p className="text-[13px] font-medium line-clamp-2">{a.title}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{a.courseName}</p>
                            {a.status === 'pending' && a.dueDate && (
                              <p className={cn('text-[11px] mt-1 font-medium', getDaysLeftColor(a.daysLeft, a.isOverdue))}>
                                {getDaysLeftText(a.daysLeft, a.isOverdue)}
                              </p>
                            )}
                            {a.status === 'graded' && a.scorePercentage !== null && (
                              <p className={cn('text-[11px] mt-1 font-semibold', getScoreColor(a.scorePercentage))}>
                                {a.score ?? '—'}/{a.maxScore} ({a.letterGrade ?? ''})
                              </p>
                            )}
                          </motion.div>
                        )
                      })}
                      {items.length === 0 && (
                        <div className="py-8 text-center">
                          <p className="text-[12px] text-muted-foreground/50">No items</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Assignment List / Grid */}
          {!loading && viewMode !== 'kanban' && filteredAssignments.length > 0 && (
            <div className={cn(
              viewMode === 'grid' ? 'grid gap-3 grid-cols-1 sm:grid-cols-2' : 'space-y-3'
            )}>
              <AnimatePresence mode="popLayout">
                {filteredAssignments.map((a) => (
                  <AssignmentCard
                    key={a.id}
                    assignment={a}
                    onViewDetail={handleViewDetail}
                    onQuickSubmit={handleQuickSubmit}
                    viewMode={viewMode}
                    selected={selectedIds.has(a.id)}
                    onToggleSelect={toggleSelect}
                    bookmarked={bookmarkedIds.has(a.id)}
                    onToggleBookmark={toggleBookmark}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredAssignments.length === 0 && viewMode !== 'kanban' && (
            <EmptyState activeTab={activeTab} searchQuery={searchQuery} />
          )}
        </div>

        {/* ─── Right Sidebar ─── */}
        <div className="hidden lg:flex flex-col gap-4 w-[300px] shrink-0">
          <UpcomingDeadlinesWidget assignments={allAssignments} onViewDetail={handleViewDetail} />
          <CourseProgressWidget assignments={allAssignments} />
          <AIStudyPlannerWidget assignments={allAssignments} onStartAssignment={handleViewDetail} />
        </div>
      </div>

      {/* Mobile Sidebar (collapsible at bottom) */}
      <div className="lg:hidden space-y-4">
        <UpcomingDeadlinesWidget assignments={allAssignments} onViewDetail={handleViewDetail} />
        <CourseProgressWidget assignments={allAssignments} />
        <AIStudyPlannerWidget assignments={allAssignments} onStartAssignment={handleViewDetail} />
      </div>

      {/* Batch Actions Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <BatchActionsBar
            count={selectedIds.size}
            onClear={clearSelection}
            onSubmitSelected={handleBatchSubmit}
            onExportSelected={handleExport}
            onBookmarkSelected={handleBatchBookmark}
          />
        )}
      </AnimatePresence>

      {/* Quick Submit Dialog */}
      <QuickSubmitDialog
        open={quickSubmitOpen}
        onClose={() => setQuickSubmitOpen(false)}
        assignment={quickSubmitAssignment}
        onSubmit={handleSubmit}
      />
    </motion.div>
  )
}
