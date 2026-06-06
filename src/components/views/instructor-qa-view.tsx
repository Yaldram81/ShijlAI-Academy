'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Search, Pin, PinOff, Flag, FlagOff, ChevronDown,
  ChevronUp, Sparkles, Bold, Italic, Code2, Link2, Send,
  Loader2, AlertCircle, CheckCircle2, Clock, ArrowUpNarrowWide,
  ThumbsUp, BookOpen, Pencil, Trash2, X,
  RotateCcw, Settings2, Mail, UsersRound, Bot, MessageCircle,
  ShieldAlert, Download, Filter, TrendingUp, TrendingDown, Minus,
  ChevronLeft, ChevronRight, Check, Square,
  SquareCheckBig, ShieldCheck, Timer, BarChart3, Hash,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { InstructorStatCard, InstructorStatCardGrid } from '@/components/instructor/instructor-stat-card'
import { MobileFilterSheet, MobileFilterGroup } from '@/components/mobile-filter-sheet'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

interface QAUser {
  id: string
  name: string
  email: string
  avatar: string | null
  role?: string
}

interface QAAnswer {
  id: string
  content: string
  userId: string
  questionId: string
  isAiGenerated: boolean
  isInstructorAnswer?: boolean
  isAccepted?: boolean
  isEdited: boolean
  createdAt: string
  updatedAt: string
  user: QAUser
  upvoteCount?: number
  upvotes?: Array<{ id: string; userId: string }>
}

interface QALesson {
  id: string
  title: string
  label: string
  courseId: string
}

interface QAQuestion {
  id: string
  question: string
  courseId: string
  lessonId: string | null
  userId: string
  isAnswered: boolean
  isPinned: boolean
  isFlagged: boolean
  upvotes: number
  upvoteCount?: number
  upvoteRecords?: Array<{ id: string; userId: string }>
  createdAt: string
  updatedAt: string
  user: QAUser
  course: { id: string; title: string }
  lesson: QALesson | null
  answers: QAAnswer[]
  aiDraftAnswer?: string
}

interface QASummary {
  totalQuestions: number
  unanswered: number
  answered: number
  flagged: number
  pinned: number
}

interface QACourse {
  id: string
  title: string
}

interface QASettings {
  autoAnswer: boolean
  emailNotifications: 'immediately' | 'daily' | 'off'
  allowStudentReplies: boolean
  requireApproval: boolean
  maxQuestionsPerDay: number
}

interface QAStats {
  avgResponseTime: number | null
  responseRate: number
  questionsTrend: number
}

interface QAPagination {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

type StatusFilter = 'all' | 'unanswered' | 'answered' | 'flagged' | 'pinned'
type SortOption = 'newest' | 'oldest' | 'most-upvoted' | 'unanswered-first'

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const spring = { type: 'spring' as const, stiffness: 400, damping: 25 }
const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100]

// ═══════════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════════

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  const weeks = Math.floor(days / 7)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  if (weeks < 4) return `${weeks}w ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatResponseTime(ms: number | null): string {
  if (ms === null) return 'N/A'
  const minutes = Math.floor(ms / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m`
  return '<1m'
}

/** Mini sparkline from a single trend value */
function MicroSparkline({ value, className }: { value: number; className?: string }) {
  const isPositive = value > 0
  const isNeutral = value === 0
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-[11px] font-semibold', className)}>
      {isPositive ? (
        <TrendingUp className="size-3" />
      ) : isNeutral ? (
        <Minus className="size-3" />
      ) : (
        <TrendingDown className="size-3" />
      )}
      {value > 0 ? '+' : ''}{value}%
    </span>
  )
}

/** Get initials from a name */
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

/** Avatar gradient colors based on name hash */
function getAvatarGradient(name: string): string {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const gradients = [
    'from-emerald-400 to-teal-500',
    'from-teal-400 to-cyan-500',
    'from-cyan-400 to-sky-500',
    'from-emerald-500 to-cyan-500',
    'from-teal-500 to-emerald-400',
  ]
  return gradients[hash % gradients.length]
}

// ═══════════════════════════════════════════════════════════════════════════════
// Loading Skeleton
// ═══════════════════════════════════════════════════════════════════════════════

function QASkeleton() {
  return (
    <div className="space-y-6 pb-4">
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-card ios-shadow-sm p-4 space-y-2">
            <Skeleton className="h-4 w-20 rounded-lg" />
            <Skeleton className="h-7 w-16 rounded-lg" />
            <Skeleton className="h-3 w-12 rounded-md" />
          </div>
        ))}
      </div>

      {/* Filter bar skeleton */}
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-36 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
        <Skeleton className="h-9 w-44 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* Question cards skeleton */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-card ios-shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24 rounded-lg" />
            <Skeleton className="h-4 w-48 rounded-lg" />
          </div>
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4 rounded-lg" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}



// ═══════════════════════════════════════════════════════════════════════════════
// Formatting Toolbar Component
// ═══════════════════════════════════════════════════════════════════════════════

function FormattingToolbar({ onFormat }: { onFormat: (type: 'bold' | 'italic' | 'code' | 'link') => void }) {
  const tools = [
    { icon: Bold, type: 'bold' as const, label: 'Bold' },
    { icon: Italic, type: 'italic' as const, label: 'Italic' },
    { icon: Code2, type: 'code' as const, label: 'Code' },
    { icon: Link2, type: 'link' as const, label: 'Link' },
  ]

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-muted/60 p-1">
      {tools.map(tool => (
        <TooltipProvider key={tool.type}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => onFormat(tool.type)}
                className="flex size-7 items-center justify-center rounded-md hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
              >
                <tool.icon className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-[12px]">
              {tool.label}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Answer Item Component
// ═══════════════════════════════════════════════════════════════════════════════

function AnswerItem({
  answer,
  isEditing,
  editText,
  onEditTextChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onAccept,
  onUpvote,
  savingEdit,
  currentUserId,
}: {
  answer: QAAnswer
  isEditing: boolean
  editText: string
  onEditTextChange: (t: string) => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onDelete: () => void
  onAccept: () => void
  onUpvote: () => void
  savingEdit: boolean
  currentUserId?: string
}) {
  const isInstructor = answer.isInstructorAnswer || answer.user.role === 'instructor' || answer.user.role === 'INSTRUCTOR'
  const isOwn = answer.userId === currentUserId
  const upvoteCount = answer.upvoteCount ?? (answer.upvotes?.length ?? 0)

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={spring}
      className={cn(
        'relative rounded-xl p-4 space-y-2',
        isInstructor
          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40'
          : 'bg-muted/40 border border-border/40'
      )}
    >
      {/* Answer header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            'flex size-7 items-center justify-center rounded-full text-[10px] font-bold text-white',
            `bg-gradient-to-br ${getAvatarGradient(answer.user.name)}`
          )}>
            {getInitials(answer.user.name)}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[13px] font-semibold">{answer.user.name}</span>
            {isInstructor && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] rounded-md border-0 px-1.5 py-0 font-semibold">
                <CheckCircle2 className="size-2.5 mr-0.5" />
                Instructor
              </Badge>
            )}
            {answer.isAccepted && (
              <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 text-[10px] rounded-md border-0 px-1.5 py-0 font-semibold">
                <Check className="size-2.5 mr-0.5" />
                Accepted
              </Badge>
            )}
            {answer.isAiGenerated && (
              <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 text-[10px] rounded-md border-0 px-1.5 py-0 font-semibold">
                <Bot className="size-2.5 mr-0.5" />
                AI Draft
              </Badge>
            )}
            {answer.isEdited && (
              <span className="text-[11px] text-muted-foreground">(edited)</span>
            )}
          </div>
        </div>
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">{formatRelativeTime(answer.createdAt)}</span>
      </div>

      {/* Answer content */}
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editText}
            onChange={(e) => onEditTextChange(e.target.value)}
            className="min-h-[80px] rounded-xl text-[13px] resize-none"
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={onCancelEdit} className="rounded-lg h-8 text-[12px]">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={onSaveEdit}
              disabled={savingEdit || !editText.trim()}
              className="rounded-lg h-8 text-[12px] bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
            >
              {savingEdit ? <Loader2 className="size-3 mr-1 animate-spin" /> : <Check className="size-3 mr-1" />}
              Save
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{answer.content}</p>
      )}

      {/* Answer actions */}
      {!isEditing && (
        <div className="flex items-center gap-1.5 pt-1">
          {/* Upvote */}
          <button
            type="button"
            onClick={onUpvote}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors"
          >
            <ThumbsUp className="size-3" />
            <span>{upvoteCount}</span>
          </button>

          {/* Accept answer */}
          {isInstructor && !answer.isAccepted && (
            <button
              type="button"
              onClick={onAccept}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
            >
              <Check className="size-3" />
              <span>Accept</span>
            </button>
          )}

          {/* Edit (own answer) */}
          {isOwn && (
            <button
              type="button"
              onClick={onStartEdit}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] text-muted-foreground hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 transition-colors"
            >
              <Pencil className="size-3" />
              <span>Edit</span>
            </button>
          )}

          {/* Delete (own answer) */}
          {isOwn && (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              <Trash2 className="size-3" />
              <span>Delete</span>
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Question Card Component
// ═══════════════════════════════════════════════════════════════════════════════

function QuestionCard({
  question,
  index,
  answeringQuestionId,
  setAnsweringQuestionId,
  answerTexts,
  setAnswerTexts,
  postingAnswer,
  postAnswer,
  expandedAiDrafts,
  toggleAiDraft,
  togglePin,
  toggleFlag,
  pinLoading,
  flagLoading,
  editingAnswerId,
  editAnswerText,
  setEditAnswerText,
  startEditAnswer,
  cancelEditAnswer,
  saveEditAnswer,
  savingEdit,
  setDeletingAnswerId,
  setDeletingQuestionId,
  acceptAnswer,
  upvoteAnswer,
  selectedQuestions,
  toggleQuestionSelection,
  currentUserId,
}: {
  question: QAQuestion
  index: number
  answeringQuestionId: string | null
  setAnsweringQuestionId: (id: string | null) => void
  answerTexts: Record<string, string>
  setAnswerTexts: React.Dispatch<React.SetStateAction<Record<string, string>>>
  postingAnswer: string | null
  postAnswer: (questionId: string, content: string, isAiGenerated?: boolean) => Promise<void>
  expandedAiDrafts: Record<string, boolean>
  toggleAiDraft: (questionId: string) => void
  togglePin: (questionId: string, currentlyPinned: boolean) => Promise<void>
  toggleFlag: (questionId: string, currentlyFlagged: boolean) => Promise<void>
  pinLoading: string | null
  flagLoading: string | null
  editingAnswerId: string | null
  editAnswerText: string
  setEditAnswerText: (text: string) => void
  startEditAnswer: (answer: QAAnswer) => void
  cancelEditAnswer: () => void
  saveEditAnswer: () => Promise<void>
  savingEdit: boolean
  setDeletingAnswerId: (id: string | null) => void
  setDeletingQuestionId: (id: string | null) => void
  acceptAnswer: (answerId: string) => Promise<void>
  upvoteAnswer: (answerId: string) => Promise<void>
  selectedQuestions: Set<string>
  toggleQuestionSelection: (id: string) => void
  currentUserId?: string
}) {
  const isAnswering = answeringQuestionId === question.id
  const isPosting = postingAnswer === question.id
  const isEditingThis = editingAnswerId && question.answers.some(a => a.id === editingAnswerId)
  const isSelected = selectedQuestions.has(question.id)
  const hasInstructorAnswer = question.answers.some(a => a.isInstructorAnswer || a.user.role === 'instructor' || a.user.role === 'INSTRUCTOR')
  const hasAcceptedAnswer = question.answers.some(a => a.isAccepted)
  const upvoteCount = question.upvoteCount ?? question.upvotes ?? 0

  // Status badge config
  const getStatusBadge = () => {
    if (question.isFlagged) {
      return (
        <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 text-[10px] rounded-md border-0 px-2 py-0.5 font-semibold">
          <ShieldAlert className="size-2.5 mr-0.5" />
          FLAGGED
        </Badge>
      )
    }
    if (question.isAnswered) {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] rounded-md border-0 px-2 py-0.5 font-semibold">
          <CheckCircle2 className="size-2.5 mr-0.5" />
          ANSWERED
        </Badge>
      )
    }
    return (
      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 text-[10px] rounded-md border-0 px-2 py-0.5 font-semibold">
        <Clock className="size-2.5 mr-0.5" />
        UNANSWERED
      </Badge>
    )
  }

  const lessonLabel = question.lesson ? question.lesson.label : 'General'

  // Answer form textarea ref
  const answerTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Insert formatting
  const handleFormat = (type: 'bold' | 'italic' | 'code' | 'link') => {
    const textarea = answerTextareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = answerTexts[question.id] || ''
    const selectedText = text.slice(start, end) || 'text'

    const wrapMap: Record<string, [string, string]> = {
      bold: ['**', '**'],
      italic: ['_', '_'],
      code: ['`', '`'],
      link: ['[', '](url)'],
    }
    const [pre, suf] = wrapMap[type]
    const newText = text.slice(0, start) + pre + selectedText + suf + text.slice(end)
    setAnswerTexts(prev => ({ ...prev, [question.id]: newText }))
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ ...spring, delay: index * 0.02 }}
      className={cn(
        'rounded-2xl bg-card ios-shadow-sm overflow-hidden group',
        question.isFlagged && 'border-l-4 border-l-rose-400 dark:border-l-rose-600',
        question.isPinned && 'ring-1 ring-cyan-300/80 dark:ring-cyan-700/60',
        isSelected && 'ring-2 ring-teal-400 dark:ring-teal-600 bg-teal-50/30 dark:bg-teal-950/10'
      )}
    >
      <div className="p-5 space-y-3">
        {/* Top: Selection checkbox + Status badges + Pin indicator */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Selection checkbox */}
            <button
              type="button"
              onClick={() => toggleQuestionSelection(question.id)}
              className="flex items-center justify-center size-5 shrink-0 mt-0.5"
            >
              {isSelected ? (
                <SquareCheckBig className="size-4 text-teal-600 dark:text-teal-400" />
              ) : (
                <Square className="size-4 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
              )}
            </button>

            {getStatusBadge()}
            {question.isPinned && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring}>
                <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 text-[10px] rounded-md border-0 px-2 py-0.5 font-semibold">
                  <Pin className="size-2.5 mr-0.5" />
                  PINNED
                </Badge>
              </motion.div>
            )}
            {hasInstructorAnswer && !question.isFlagged && (
              <Badge className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 text-[10px] rounded-md border-0 px-2 py-0.5 font-semibold">
                <ShieldCheck className="size-2.5 mr-0.5" />
                Instructor Answered
              </Badge>
            )}
            {hasAcceptedAnswer && (
              <Badge className="bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400 text-[10px] rounded-md border-0 px-2 py-0.5 font-semibold">
                <Check className="size-2.5 mr-0.5" />
                Accepted
              </Badge>
            )}
          </div>

          {/* Timestamp */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap cursor-default">
                  {formatRelativeTime(question.createdAt)}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-[12px]">
                {formatDate(question.createdAt)}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Question text */}
        <p className="text-[14px] leading-relaxed font-medium">{question.question}</p>

        {/* Course + Lesson context */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[11px] rounded-lg px-2 py-0.5 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">
            <BookOpen className="size-2.5 mr-1" />
            {question.course.title}
          </Badge>
          <Badge variant="outline" className="text-[11px] rounded-lg px-2 py-0.5 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/20">
            <MessageCircle className="size-2.5 mr-1" />
            {lessonLabel}
          </Badge>
          {/* Upvote count */}
          <div className="flex items-center gap-0.5 text-[12px] text-muted-foreground">
            <ThumbsUp className="size-3" />
            <span>{upvoteCount}</span>
          </div>
          {/* Answer count */}
          <div className="flex items-center gap-0.5 text-[12px] text-muted-foreground">
            <MessageSquare className="size-3" />
            <span>{question.answers.length}</span>
          </div>
        </div>

        {/* Student info */}
        <div className="flex items-center gap-2">
          <div className={cn(
            'flex size-6 items-center justify-center rounded-full text-[9px] font-bold text-white',
            `bg-gradient-to-br ${getAvatarGradient(question.user.name)}`
          )}>
            {getInitials(question.user.name)}
          </div>
          <span className="text-[12px] text-muted-foreground font-medium">{question.user.name}</span>
        </div>

        {/* AI Draft section */}
        {question.aiDraftAnswer && !question.isAnswered && (
          <Collapsible
            open={expandedAiDrafts[question.id]}
            onOpenChange={() => toggleAiDraft(question.id)}
          >
            <CollapsibleTrigger asChild>
              <div role="button" tabIndex={0} className="flex items-center gap-2 text-[12px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors cursor-pointer">
                <Sparkles className="size-3.5" />
                <span className="font-medium">AI Draft Answer</span>
                {expandedAiDrafts[question.id] ? (
                  <ChevronUp className="size-3" />
                ) : (
                  <ChevronDown className="size-3" />
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={spring}
                className="mt-2 rounded-xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200/60 dark:border-cyan-800/40 p-3"
              >
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{question.aiDraftAnswer}</p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 rounded-lg text-[12px] bg-gradient-to-r from-cyan-500 to-teal-500 text-white"
                    onClick={() => postAnswer(question.id, question.aiDraftAnswer!, true)}
                    disabled={isPosting}
                  >
                    {isPosting ? <Loader2 className="size-3 mr-1 animate-spin" /> : <Send className="size-3 mr-1" />}
                    Post as Answer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-lg text-[12px]"
                    onClick={() => {
                      setAnswerTexts(prev => ({ ...prev, [question.id]: question.aiDraftAnswer || '' }))
                      setAnsweringQuestionId(question.id)
                    }}
                  >
                    <Pencil className="size-3 mr-1" />
                    Edit & Post
                  </Button>
                </div>
              </motion.div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Existing answers */}
        {question.answers.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground">
              <MessageSquare className="size-3" />
              {question.answers.length} Answer{question.answers.length !== 1 ? 's' : ''}
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
              {question.answers.map(answer => (
                <AnswerItem
                  key={answer.id}
                  answer={answer}
                  isEditing={editingAnswerId === answer.id}
                  editText={editAnswerText}
                  onEditTextChange={setEditAnswerText}
                  onStartEdit={() => startEditAnswer(answer)}
                  onCancelEdit={cancelEditAnswer}
                  onSaveEdit={saveEditAnswer}
                  onDelete={() => setDeletingAnswerId(answer.id)}
                  onAccept={() => acceptAnswer(answer.id)}
                  onUpvote={() => upvoteAnswer(answer.id)}
                  savingEdit={savingEdit}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          </div>
        )}

        {/* Answer form */}
        <AnimatePresence>
          {isAnswering && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={spring}
              className="overflow-hidden"
            >
              <div className="space-y-2 pt-2">
                <Separator />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[12px] font-semibold text-muted-foreground">Write your answer</span>
                  <FormattingToolbar onFormat={handleFormat} />
                </div>
                <Textarea
                  ref={answerTextareaRef}
                  placeholder="Type your answer here..."
                  value={answerTexts[question.id] || ''}
                  onChange={(e) => setAnswerTexts(prev => ({ ...prev, [question.id]: e.target.value }))}
                  className="min-h-[100px] rounded-xl text-[13px] resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setAnsweringQuestionId(null)
                      setAnswerTexts(prev => {
                        const next = { ...prev }
                        delete next[question.id]
                        return next
                      })
                    }}
                    className="rounded-lg h-8 text-[12px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => postAnswer(question.id, answerTexts[question.id] || '')}
                    disabled={isPosting || !(answerTexts[question.id] || '').trim()}
                    className="rounded-lg h-8 text-[12px] bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                  >
                    {isPosting ? (
                      <Loader2 className="size-3 mr-1 animate-spin" />
                    ) : (
                      <Send className="size-3 mr-1" />
                    )}
                    {isPosting ? 'Posting...' : 'Post Answer'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action bar */}
        <div className="flex items-center gap-1.5 pt-1 flex-wrap">
          {!isAnswering && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 rounded-lg text-[12px] border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              onClick={() => setAnsweringQuestionId(question.id)}
            >
              <MessageCircle className="size-3 mr-1" />
              Answer
            </Button>
          )}

          {/* Pin toggle */}
          <Button
            size="sm"
            variant="outline"
            className={cn(
              'h-7 rounded-lg text-[12px]',
              question.isPinned
                ? 'border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/30'
                : 'border-border/60 text-muted-foreground hover:text-foreground'
            )}
            onClick={() => togglePin(question.id, question.isPinned)}
            disabled={pinLoading === question.id}
          >
            {pinLoading === question.id ? (
              <Loader2 className="size-3 mr-1 animate-spin" />
            ) : question.isPinned ? (
              <PinOff className="size-3 mr-1" />
            ) : (
              <Pin className="size-3 mr-1" />
            )}
            {question.isPinned ? 'Unpin' : 'Pin'}
          </Button>

          {/* Flag toggle */}
          <Button
            size="sm"
            variant="outline"
            className={cn(
              'h-7 rounded-lg text-[12px]',
              question.isFlagged
                ? 'border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                : 'border-border/60 text-muted-foreground hover:text-foreground'
            )}
            onClick={() => toggleFlag(question.id, question.isFlagged)}
            disabled={flagLoading === question.id}
          >
            {flagLoading === question.id ? (
              <Loader2 className="size-3 mr-1 animate-spin" />
            ) : question.isFlagged ? (
              <FlagOff className="size-3 mr-1" />
            ) : (
              <Flag className="size-3 mr-1" />
            )}
            {question.isFlagged ? 'Unflag' : 'Flag'}
          </Button>

          {/* Delete question */}
          <Button
            size="sm"
            variant="outline"
            className="h-7 rounded-lg text-[12px] border-border/60 text-muted-foreground hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-800"
            onClick={() => setDeletingQuestionId(question.id)}
          >
            <Trash2 className="size-3 mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════

export function InstructorQAView() {
  const { currentUser } = useAppStore()

  // ─── State ──────────────────────────────────────────────────────────────
  const [questions, setQuestions] = useState<QAQuestion[]>([])
  const [summary, setSummary] = useState<QASummary>({ totalQuestions: 0, unanswered: 0, answered: 0, flagged: 0, pinned: 0 })
  const [courses, setCourses] = useState<QACourse[]>([])
  const [lessons, setLessons] = useState<QALesson[]>([])
  const [stats, setStats] = useState<QAStats>({ avgResponseTime: null, responseRate: 0, questionsTrend: 0 })
  const [pagination, setPagination] = useState<QAPagination>({ page: 1, limit: 20, totalItems: 0, totalPages: 0, hasNext: false, hasPrev: false })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Interaction state
  const [answeringQuestionId, setAnsweringQuestionId] = useState<string | null>(null)
  const [answerTexts, setAnswerTexts] = useState<Record<string, string>>({})
  const [postingAnswer, setPostingAnswer] = useState<string | null>(null)
  const [expandedAiDrafts, setExpandedAiDrafts] = useState<Record<string, boolean>>({})
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null)
  const [editAnswerText, setEditAnswerText] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingAnswerId, setDeletingAnswerId] = useState<string | null>(null)
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null)
  const [pinLoading, setPinLoading] = useState<string | null>(null)
  const [flagLoading, setFlagLoading] = useState<string | null>(null)

  // Bulk selection
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set())
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  // Settings
  const [settings, setSettings] = useState<QASettings>({
    autoAnswer: false,
    emailNotifications: 'immediately',
    allowStudentReplies: true,
    requireApproval: false,
    maxQuestionsPerDay: 10,
  })
  const [savingSettings, setSavingSettings] = useState(false)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)

  // ─── Fetch Data ─────────────────────────────────────────────────────────
  const fetchData = useCallback(async (page?: number) => {
    if (!currentUser?.id) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ instructorId: currentUser.id })
      if (courseFilter !== 'all') params.set('courseId', courseFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (sortOption !== 'newest') params.set('sortBy', sortOption)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      params.set('page', String(page ?? pagination.page))
      params.set('limit', String(pagination.limit))

      const res = await fetch(`/api/instructor/qa?${params.toString()}`)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to fetch Q&A data')
      }
      const json = await res.json()

      setQuestions(json.questions || [])
      setSummary(json.summary || { totalQuestions: 0, unanswered: 0, answered: 0, flagged: 0, pinned: 0 })
      setCourses(json.courses || [])
      setLessons(json.lessons || [])
      setStats(json.stats || { avgResponseTime: null, responseRate: 0, questionsTrend: 0 })
      setPagination(json.pagination || { page: 1, limit: 20, totalItems: 0, totalPages: 0, hasNext: false, hasPrev: false })

      // Apply settings from API
      if (json.qaSettings) {
        setSettings({
          autoAnswer: json.qaSettings.autoAnswer ?? false,
          emailNotifications: json.qaSettings.emailNotifications ?? 'immediately',
          allowStudentReplies: json.qaSettings.allowStudentReplies ?? true,
          requireApproval: json.qaSettings.requireApproval ?? false,
          maxQuestionsPerDay: json.qaSettings.maxQuestionsPerDay ?? 10,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Q&A data')
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id, courseFilter, statusFilter, sortOption, searchQuery, pagination.page, pagination.limit])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ─── Active filter count ─────────────────────────────────────────────────
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (courseFilter !== 'all') count++
    if (statusFilter !== 'all') count++
    if (searchQuery.trim()) count++
    return count
  }, [courseFilter, statusFilter, searchQuery])

  // ─── API Actions ────────────────────────────────────────────────────────
  const postAnswer = async (questionId: string, content: string, isAiGenerated = false) => {
    if (!content.trim()) {
      toast.error('Please write an answer before posting.')
      return
    }
    setPostingAnswer(questionId)
    try {
      const res = await fetch('/api/instructor/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'answer',
          questionId,
          content,
          userId: currentUser?.id,
          isAiGenerated,
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to post answer')
      }
      toast.success('Answer posted successfully!')
      fetchData()
      setAnswerTexts(prev => {
        const next = { ...prev }
        delete next[questionId]
        return next
      })
      setAnsweringQuestionId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to post answer')
    } finally {
      setPostingAnswer(null)
    }
  }

  const togglePin = async (questionId: string, currentlyPinned: boolean) => {
    setPinLoading(questionId)
    try {
      const res = await fetch('/api/instructor/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pin', questionId, isPinned: !currentlyPinned }),
      })
      if (!res.ok) throw new Error('Failed to update pin status')
      toast.success(currentlyPinned ? 'Question unpinned' : 'Question pinned')
      fetchData()
    } catch {
      toast.error('Failed to update pin status')
    } finally {
      setPinLoading(null)
    }
  }

  const toggleFlag = async (questionId: string, currentlyFlagged: boolean) => {
    setFlagLoading(questionId)
    try {
      const res = await fetch('/api/instructor/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'flag', questionId, isFlagged: !currentlyFlagged }),
      })
      if (!res.ok) throw new Error('Failed to update flag status')
      toast.success(currentlyFlagged ? 'Question unflagged' : 'Question flagged')
      fetchData()
    } catch {
      toast.error('Failed to update flag status')
    } finally {
      setFlagLoading(null)
    }
  }

  const saveEditAnswer = async () => {
    if (!editingAnswerId || !editAnswerText.trim()) {
      toast.error('Answer cannot be empty.')
      return
    }
    setSavingEdit(true)
    try {
      const res = await fetch('/api/instructor/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit-answer', answerId: editingAnswerId, content: editAnswerText }),
      })
      if (!res.ok) throw new Error('Failed to update answer')
      toast.success('Answer updated')
      fetchData()
      setEditingAnswerId(null)
      setEditAnswerText('')
    } catch {
      toast.error('Failed to update answer')
    } finally {
      setSavingEdit(false)
    }
  }

  const deleteAnswer = async (answerId: string) => {
    setSavingEdit(true)
    try {
      const res = await fetch('/api/instructor/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-answer', answerId }),
      })
      if (!res.ok) throw new Error('Failed to delete answer')
      toast.success('Answer deleted')
      fetchData()
      setDeletingAnswerId(null)
    } catch {
      toast.error('Failed to delete answer')
    } finally {
      setSavingEdit(false)
    }
  }

  const deleteQuestion = async (questionId: string) => {
    try {
      const res = await fetch('/api/instructor/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-question', questionId, instructorId: currentUser?.id }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to delete question')
      }
      toast.success('Question deleted')
      fetchData()
      setDeletingQuestionId(null)
      setSelectedQuestions(prev => {
        const next = new Set(prev)
        next.delete(questionId)
        return next
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete question')
    }
  }

  const acceptAnswer = async (answerId: string) => {
    try {
      const res = await fetch('/api/instructor/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept-answer', answerId }),
      })
      if (!res.ok) throw new Error('Failed to accept answer')
      toast.success('Answer accepted')
      fetchData()
    } catch {
      toast.error('Failed to accept answer')
    }
  }

  const upvoteAnswer = async (answerId: string) => {
    try {
      const res = await fetch('/api/instructor/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upvote-answer', answerId, userId: currentUser?.id }),
      })
      if (!res.ok) throw new Error('Failed to upvote answer')
      fetchData()
    } catch {
      toast.error('Failed to upvote answer')
    }
  }

  const saveSettings = async () => {
    setSavingSettings(true)
    try {
      const res = await fetch('/api/instructor/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save-settings',
          instructorId: currentUser?.id,
          ...settings,
        }),
      })
      if (!res.ok) throw new Error('Failed to save settings')
      toast.success('Q&A settings saved!')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSavingSettings(false)
    }
  }

  // ─── Bulk Actions ───────────────────────────────────────────────────────
  const toggleQuestionSelection = useCallback((id: string) => {
    setSelectedQuestions(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedQuestions.size === questions.length && questions.length > 0) {
      setSelectedQuestions(new Set())
    } else {
      setSelectedQuestions(new Set(questions.map(q => q.id)))
    }
  }, [questions, selectedQuestions])

  const bulkApprove = async () => {
    setBulkActionLoading(true)
    try {
      const res = await fetch('/api/instructor/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk-approve',
          questionIds: Array.from(selectedQuestions),
          instructorId: currentUser?.id,
        }),
      })
      if (!res.ok) throw new Error('Failed to approve questions')
      const data = await res.json()
      toast.success(`${data.approvedCount || selectedQuestions.size} question(s) approved`)
      setSelectedQuestions(new Set())
      fetchData()
    } catch {
      toast.error('Failed to approve questions')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const bulkDelete = async () => {
    setBulkActionLoading(true)
    try {
      // Delete questions one by one (no bulk delete endpoint)
      await Promise.all(
        Array.from(selectedQuestions).map(questionId =>
          fetch('/api/instructor/qa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete-question', questionId, instructorId: currentUser?.id }),
          })
        )
      )
      toast.success(`${selectedQuestions.size} question(s) deleted`)
      setSelectedQuestions(new Set())
      fetchData()
    } catch {
      toast.error('Failed to delete questions')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const bulkPin = async (pin: boolean) => {
    setBulkActionLoading(true)
    try {
      await Promise.all(
        Array.from(selectedQuestions).map(questionId =>
          fetch('/api/instructor/qa', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'pin', questionId, isPinned: pin }),
          })
        )
      )
      toast.success(`${selectedQuestions.size} question(s) ${pin ? 'pinned' : 'unpinned'}`)
      setSelectedQuestions(new Set())
      fetchData()
    } catch {
      toast.error(`Failed to ${pin ? 'pin' : 'unpin'} questions`)
    } finally {
      setBulkActionLoading(false)
    }
  }

  // ─── Export CSV ─────────────────────────────────────────────────────────
  const exportCSV = useCallback(() => {
    if (questions.length === 0) {
      toast.error('No questions to export')
      return
    }

    const headers = ['Question', 'Course', 'Lesson', 'Student', 'Status', 'Upvotes', 'Answers', 'Created At', 'Pinned', 'Flagged']
    const rows = questions.map(q => [
      `"${q.question.replace(/"/g, '""')}"`,
      `"${q.course.title.replace(/"/g, '""')}"`,
      `"${q.lesson?.title || 'General'}"`,
      `"${q.user.name.replace(/"/g, '""')}"`,
      q.isAnswered ? 'Answered' : 'Unanswered',
      String(q.upvoteCount ?? q.upvotes),
      String(q.answers.length),
      new Date(q.createdAt).toISOString(),
      q.isPinned ? 'Yes' : 'No',
      q.isFlagged ? 'Yes' : 'No',
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `qa-questions-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Q&A exported as CSV')
  }, [questions])

  // ─── Clear all filters ──────────────────────────────────────────────────
  const clearAllFilters = () => {
    setCourseFilter('all')
    setStatusFilter('all')
    setSearchQuery('')
    setSortOption('newest')
  }

  // ─── Handlers ───────────────────────────────────────────────────────────
  const handleCourseFilterChange = (value: string) => {
    setCourseFilter(value)
  }

  const toggleAiDraft = (questionId: string) => {
    setExpandedAiDrafts(prev => ({ ...prev, [questionId]: !prev[questionId] }))
  }

  const startEditAnswer = (answer: QAAnswer) => {
    setEditingAnswerId(answer.id)
    setEditAnswerText(answer.content)
  }

  const cancelEditAnswer = () => {
    setEditingAnswerId(null)
    setEditAnswerText('')
  }

  const handlePageChange = (newPage: number) => {
    fetchData(newPage)
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  // ─── Loading State ──────────────────────────────────────────────────────
  if (loading && questions.length === 0) {
    return (
      <div className="space-y-6 pb-4">
        <QASkeleton />
      </div>
    )
  }

  // ─── Error State (with retry) ───────────────────────────────────────────
  if (error && questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/40">
          <AlertCircle className="size-8 text-rose-500" />
        </div>
        <p className="text-[15px] font-medium text-foreground">{error}</p>
        <p className="text-[13px] text-muted-foreground">Something went wrong while fetching Q&A data.</p>
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => fetchData()}>
          <RotateCcw className="size-3.5 mr-1.5" />
          Try Again
        </Button>
      </div>
    )
  }

  const hasAnyQuestions = summary.totalQuestions > 0
  const hasActiveFilters = activeFilterCount > 0

  return (
    <div className="space-y-5 pb-4">
      {/* ═══════════════════════════════════════════════════════════════════
          1. HEADER SECTION with gradient
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="rounded-2xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-600 p-5 text-white ios-shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <MessageSquare className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-[24px] font-bold tracking-tight">Q&A Management</h1>
                <Badge className="bg-white/20 text-white text-[11px] rounded-lg font-semibold border-0 px-2 py-0.5 backdrop-blur-sm">
                  {summary.unanswered} unanswered
                </Badge>
              </div>
              <p className="text-[13px] text-white/80">
                Manage questions across all your courses
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg text-[12px] bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm"
              onClick={exportCSV}
            >
              <Download className="size-3.5 mr-1" />
              Export CSV
            </Button>
            <Button
              size="sm"
              className="h-8 rounded-lg text-[12px] bg-white/20 border border-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
              onClick={() => setSettingsOpen(!settingsOpen)}
            >
              <Settings2 className="size-3.5 mr-1" />
              Settings
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. STATS DASHBOARD CARDS
          ═══════════════════════════════════════════════════════════════════ */}
      <InstructorStatCardGrid columns={6}>
        <InstructorStatCard
          icon={Hash}
          label="Total Questions"
          value={summary.totalQuestions}
          color="emerald"
          trend={stats.questionsTrend}
          index={0}
        />
        <InstructorStatCard
          icon={Clock}
          label="Unanswered"
          value={summary.unanswered}
          color="amber"
          index={1}
        />
        <InstructorStatCard
          icon={CheckCircle2}
          label="Answered"
          value={summary.answered}
          color="teal"
          index={2}
        />
        <InstructorStatCard
          icon={BarChart3}
          label="Response Rate"
          value={`${stats.responseRate}%`}
          color="cyan"
          trend={stats.responseRate >= 80 ? 5 : stats.responseRate >= 50 ? 0 : -5}
          index={3}
        />
        <InstructorStatCard
          icon={Timer}
          label="Avg Response"
          value={formatResponseTime(stats.avgResponseTime)}
          color="teal"
          index={4}
        />
        <InstructorStatCard
          icon={Flag}
          label="Flagged"
          value={summary.flagged}
          color="rose"
          index={5}
        />
      </InstructorStatCardGrid>

      {/* ═══════════════════════════════════════════════════════════════════
          3. FILTER PANEL
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        {/* Mobile: Search bar full-width */}
        <div className="relative w-full md:hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 rounded-xl text-[13px] bg-card shadow-sm border-0 pl-9 pr-9 w-full"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Mobile: Filter button + Sheet */}
        <div className="flex items-center gap-2 md:hidden">
          <MobileFilterSheet
            activeCount={activeFilterCount}
            onClearAll={clearAllFilters}
          >
            <MobileFilterGroup label="Course">
              <Select value={courseFilter} onValueChange={handleCourseFilterChange}>
                <SelectTrigger className="w-full h-10 text-[13px] rounded-lg">
                  <BookOpen className="size-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </MobileFilterGroup>
            <MobileFilterGroup label="Status">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-full h-10 text-[13px] rounded-lg">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unanswered">Unanswered</SelectItem>
                  <SelectItem value="answered">Answered</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                  <SelectItem value="pinned">Pinned</SelectItem>
                </SelectContent>
              </Select>
            </MobileFilterGroup>
            <MobileFilterGroup label="Sort By">
              <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                <SelectTrigger className="w-full h-10 text-[13px] rounded-lg">
                  <ArrowUpNarrowWide className="size-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="most-upvoted">Most Upvoted</SelectItem>
                  <SelectItem value="unanswered-first">Unanswered First</SelectItem>
                </SelectContent>
              </Select>
            </MobileFilterGroup>
          </MobileFilterSheet>

          {/* Mobile: Clear All */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors shrink-0 h-8"
            >
              <Filter className="size-3" />
              Clear
            </button>
          )}
        </div>

        {/* Desktop: Single row with all filters */}
        <div className="hidden md:flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 rounded-xl text-[13px] bg-card shadow-sm border-0 pl-9 pr-9 w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Course Filter */}
          <Select value={courseFilter} onValueChange={handleCourseFilterChange}>
            <SelectTrigger className="h-9 rounded-xl text-[13px] bg-card shadow-sm border-0 w-[160px]">
              <BookOpen className="size-3.5 mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="h-9 rounded-xl text-[13px] bg-card shadow-sm border-0 w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unanswered">Unanswered</SelectItem>
              <SelectItem value="answered">Answered</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
              <SelectItem value="pinned">Pinned</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
            <SelectTrigger className="h-9 rounded-xl text-[13px] bg-card shadow-sm border-0 w-[160px]">
              <ArrowUpNarrowWide className="size-3.5 mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="most-upvoted">Most Upvoted</SelectItem>
              <SelectItem value="unanswered-first">Unanswered First</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear all filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-xl text-[13px] text-muted-foreground hover:text-rose-600"
              onClick={clearAllFilters}
            >
              <X className="size-3.5 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          4. BULK ACTIONS BAR
          ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedQuestions.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={spring}
            className="sticky top-0 z-20 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 ios-shadow-sm p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-white">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1.5"
                >
                  {selectedQuestions.size === questions.length ? (
                    <SquareCheckBig className="size-4" />
                  ) : (
                    <Square className="size-4" />
                  )}
                  <span className="text-[13px] font-semibold">
                    {selectedQuestions.size} selected
                  </span>
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Bulk Approve (unflag) */}
                <Button
                  size="sm"
                  className="h-8 rounded-lg text-[12px] bg-white/20 text-white hover:bg-white/30 border-white/20"
                  onClick={bulkApprove}
                  disabled={bulkActionLoading}
                >
                  {bulkActionLoading ? <Loader2 className="size-3 mr-1 animate-spin" /> : <ShieldCheck className="size-3 mr-1" />}
                  Approve
                </Button>
                {/* Bulk Pin */}
                <Button
                  size="sm"
                  className="h-8 rounded-lg text-[12px] bg-white/20 text-white hover:bg-white/30 border-white/20"
                  onClick={() => bulkPin(true)}
                  disabled={bulkActionLoading}
                >
                  <Pin className="size-3 mr-1" />
                  Pin
                </Button>
                {/* Bulk Unpin */}
                <Button
                  size="sm"
                  className="h-8 rounded-lg text-[12px] bg-white/20 text-white hover:bg-white/30 border-white/20"
                  onClick={() => bulkPin(false)}
                  disabled={bulkActionLoading}
                >
                  <PinOff className="size-3 mr-1" />
                  Unpin
                </Button>
                {/* Bulk Delete */}
                <Button
                  size="sm"
                  className="h-8 rounded-lg text-[12px] bg-rose-500/80 text-white hover:bg-rose-500"
                  onClick={() => setConfirmBulkDelete(true)}
                  disabled={bulkActionLoading}
                >
                  {bulkActionLoading ? <Loader2 className="size-3 mr-1 animate-spin" /> : <Trash2 className="size-3 mr-1" />}
                  Delete
                </Button>
                {/* Clear selection */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 rounded-lg text-[12px] text-white/80 hover:text-white hover:bg-white/10"
                  onClick={() => setSelectedQuestions(new Set())}
                >
                  <X className="size-3 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════
          5. QUESTION CARDS
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        {/* Select all row */}
        {questions.length > 0 && (
          <div className="flex items-center gap-2 px-1">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {selectedQuestions.size === questions.length && questions.length > 0 ? (
                <SquareCheckBig className="size-3.5 text-teal-600 dark:text-teal-400" />
              ) : (
                <Square className="size-3.5" />
              )}
              Select all ({questions.length})
            </button>
            <span className="text-[12px] text-muted-foreground">
              · Showing {questions.length} of {pagination.totalItems}
            </span>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {!hasAnyQuestions && !hasActiveFilters ? (
            // ─── Empty State: No questions at all ────────────────────────
            <motion.div
              key="empty-all"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border border-dashed border-border/60 bg-card p-16 text-center"
            >
              <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-100 to-teal-100 dark:from-cyan-950/40 dark:to-teal-950/40 mb-5">
                <MessageCircle className="size-10 text-teal-500/60" />
              </div>
              <h3 className="text-xl font-bold mb-2">No Questions Yet</h3>
              <p className="text-[14px] text-muted-foreground max-w-md mx-auto">
                When students ask questions in your courses, they&apos;ll appear here. Start by encouraging students to engage with the Q&A feature.
              </p>
            </motion.div>
          ) : questions.length === 0 && hasActiveFilters ? (
            // ─── Empty State: No questions matching filters ──────────────
            <motion.div
              key="empty-filters"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border border-dashed border-border/60 bg-card p-12 text-center"
            >
              <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/30 mb-4">
                <Filter className="size-8 text-amber-500/60" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No questions match your filters</h3>
              <p className="text-[14px] text-muted-foreground max-w-md mx-auto mb-4">
                Try adjusting your filters or search terms to find what you&apos;re looking for.
              </p>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={clearAllFilters}
              >
                <RotateCcw className="size-3.5 mr-1.5" />
                Clear All Filters
              </Button>
            </motion.div>
          ) : (
            // ─── Question list ────────────────────────────────────────────
            questions.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question}
                index={index}
                answeringQuestionId={answeringQuestionId}
                setAnsweringQuestionId={setAnsweringQuestionId}
                answerTexts={answerTexts}
                setAnswerTexts={setAnswerTexts}
                postingAnswer={postingAnswer}
                postAnswer={postAnswer}
                expandedAiDrafts={expandedAiDrafts}
                toggleAiDraft={toggleAiDraft}
                togglePin={togglePin}
                toggleFlag={toggleFlag}
                pinLoading={pinLoading}
                flagLoading={flagLoading}
                editingAnswerId={editingAnswerId}
                editAnswerText={editAnswerText}
                setEditAnswerText={setEditAnswerText}
                startEditAnswer={startEditAnswer}
                cancelEditAnswer={cancelEditAnswer}
                saveEditAnswer={saveEditAnswer}
                savingEdit={savingEdit}
                setDeletingAnswerId={setDeletingAnswerId}
                setDeletingQuestionId={setDeletingQuestionId}
                acceptAnswer={acceptAnswer}
                upvoteAnswer={upvoteAnswer}
                selectedQuestions={selectedQuestions}
                toggleQuestionSelection={toggleQuestionSelection}
                currentUserId={currentUser?.id}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          6. PAGINATION
          ═══════════════════════════════════════════════════════════════════ */}
      {pagination.totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="flex items-center justify-between gap-3 rounded-2xl bg-card ios-shadow-sm p-4"
        >
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground">Items per page</span>
            <Select
              value={String(pagination.limit)}
              onValueChange={(v) => {
                setPagination(prev => ({ ...prev, limit: Number(v), page: 1 }))
              }}
            >
              <SelectTrigger className="h-8 rounded-lg text-[12px] w-[70px] border-0 bg-muted/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEMS_PER_PAGE_OPTIONS.map(opt => (
                  <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-muted-foreground mr-2">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 rounded-lg"
              disabled={!pagination.hasPrev}
              onClick={() => handlePageChange(1)}
            >
              <ChevronLeft className="size-3" />
              <ChevronLeft className="size-3 -ml-2" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 rounded-lg"
              disabled={!pagination.hasPrev}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              <ChevronLeft className="size-3" />
            </Button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, i) => {
              let pageNum: number
              if (pagination.totalPages <= 5) {
                pageNum = i + 1
              } else if (pagination.page <= 3) {
                pageNum = i + 1
              } else if (pagination.page >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i
              } else {
                pageNum = pagination.page - 2 + i
              }
              return (
                <Button
                  key={pageNum}
                  size="sm"
                  variant={pageNum === pagination.page ? 'default' : 'outline'}
                  className={cn(
                    'h-8 w-8 p-0 rounded-lg text-[12px]',
                    pageNum === pagination.page && 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0'
                  )}
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            })}

            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 rounded-lg"
              disabled={!pagination.hasNext}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              <ChevronRight className="size-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 rounded-lg"
              disabled={!pagination.hasNext}
              onClick={() => handlePageChange(pagination.totalPages)}
            >
              <ChevronRight className="size-3" />
              <ChevronRight className="size-3 -ml-2" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          7. Q&A SETTINGS PANEL (collapsible)
          ═══════════════════════════════════════════════════════════════════ */}
      <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
        <CollapsibleContent>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={spring}
            className="rounded-2xl bg-card ios-shadow-sm overflow-hidden"
          >
            {/* Settings Header */}
            <div className="flex items-center justify-between p-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-950/40">
                  <Settings2 className="size-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold">Q&A Settings</h3>
                  <p className="text-[12px] text-muted-foreground">Configure how Q&A works for your courses</p>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 space-y-5">
              {/* Auto-answer with AI */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950/40 mt-0.5">
                    <Bot className="size-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <Label className="text-[14px] font-medium cursor-pointer">Auto-answer with AI</Label>
                    <p className="text-[12px] text-muted-foreground mt-0.5">AI generates draft answers — you review before posting</p>
                  </div>
                </div>
                <Switch
                  checked={settings.autoAnswer}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoAnswer: checked }))}
                />
              </div>

              <Separator />

              {/* Email notifications */}
              <div className="flex items-start gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40 mt-0.5">
                  <Mail className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <Label className="text-[14px] font-medium">Email me new questions</Label>
                  <RadioGroup
                    value={settings.emailNotifications}
                    onValueChange={(v) => setSettings(prev => ({ ...prev, emailNotifications: v as QASettings['emailNotifications'] }))}
                    className="flex flex-col gap-2 mt-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <RadioGroupItem value="immediately" id="email-immediately" />
                      <Label htmlFor="email-immediately" className="text-[13px] font-normal cursor-pointer">Immediately</Label>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <RadioGroupItem value="daily" id="email-daily" />
                      <Label htmlFor="email-daily" className="text-[13px] font-normal cursor-pointer">Daily digest</Label>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <RadioGroupItem value="off" id="email-off" />
                      <Label htmlFor="email-off" className="text-[13px] font-normal cursor-pointer">Off</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <Separator />

              {/* Allow student-to-student replies */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40 mt-0.5">
                    <UsersRound className="size-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <Label className="text-[14px] font-medium cursor-pointer">Allow student-to-student replies</Label>
                    <p className="text-[12px] text-muted-foreground mt-0.5">Students can reply to each other&apos;s questions</p>
                  </div>
                </div>
                <Switch
                  checked={settings.allowStudentReplies}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowStudentReplies: checked }))}
                />
              </div>

              <Separator />

              {/* Require approval */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/40 mt-0.5">
                    <ShieldCheck className="size-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <Label className="text-[14px] font-medium cursor-pointer">Require approval</Label>
                    <p className="text-[12px] text-muted-foreground mt-0.5">New questions need your approval before they&apos;re visible</p>
                  </div>
                </div>
                <Switch
                  checked={settings.requireApproval}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireApproval: checked }))}
                />
              </div>

              <Separator />

              {/* Max questions per day per student */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40 mt-0.5">
                    <Hash className="size-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <Label className="text-[14px] font-medium">Max questions per day per student</Label>
                    <p className="text-[12px] text-muted-foreground mt-0.5">Limit how many questions each student can ask daily</p>
                  </div>
                </div>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={settings.maxQuestionsPerDay}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxQuestionsPerDay: Math.max(1, parseInt(e.target.value) || 1) }))}
                  className="w-20 h-9 rounded-xl text-[13px] text-center"
                />
              </div>

              <Separator />

              {/* Save button */}
              <div className="flex justify-end pt-1">
                <Button
                  onClick={saveSettings}
                  disabled={savingSettings}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                >
                  {savingSettings ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4 mr-2" />
                  )}
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>
          </motion.div>
        </CollapsibleContent>
      </Collapsible>

      {/* ═══════════════════════════════════════════════════════════════════
          DELETE ANSWER CONFIRMATION DIALOG
          ═══════════════════════════════════════════════════════════════════ */}
      <AlertDialog open={!!deletingAnswerId} onOpenChange={(open) => { if (!open) setDeletingAnswerId(null) }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-rose-500" />
              Delete Answer
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The answer will be permanently removed from the question thread. If this was the only answer, the question will be marked as unanswered again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingAnswerId && deleteAnswer(deletingAnswerId)}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete Answer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══════════════════════════════════════════════════════════════════
          DELETE QUESTION CONFIRMATION DIALOG
          ═══════════════════════════════════════════════════════════════════ */}
      <AlertDialog open={!!deletingQuestionId} onOpenChange={(open) => { if (!open) setDeletingQuestionId(null) }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-rose-500" />
              Delete Question
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The question and all its answers will be permanently deleted. Students will no longer be able to see this question.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingQuestionId && deleteQuestion(deletingQuestionId)}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete Question
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══════════════════════════════════════════════════════════════════
          BULK DELETE CONFIRMATION DIALOG
          ═══════════════════════════════════════════════════════════════════ */}
      <AlertDialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-rose-500" />
              Delete {selectedQuestions.size} Question{selectedQuestions.size !== 1 ? 's' : ''}
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedQuestions.size} question{selectedQuestions.size !== 1 ? 's' : ''} and all their answers. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { bulkDelete(); setConfirmBulkDelete(false) }}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
