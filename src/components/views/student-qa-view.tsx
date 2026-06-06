'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Search, ChevronDown, ChevronUp, Send,
  Loader2, AlertCircle, CheckCircle2, Clock,
  ThumbsUp, BookOpen, X, RotateCcw, Pin,
  Bot, MessageCircle, Sparkles, Plus, Filter,
  ArrowUpNarrowWide, GraduationCap, HelpCircle,
  ShieldCheck, PenLine, Hash,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { MobileFilterSheet, MobileFilterGroup } from '@/components/mobile-filter-sheet'

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

interface QAAnswer {
  id: string
  questionId: string
  userId: string
  userName: string
  userAvatar: string | null
  content: string
  isAiGenerated: boolean
  isInstructorAnswer: boolean
  isEdited: boolean
  isAccepted: boolean
  upvoteCount: number
  hasUpvoted: boolean
  createdAt: string
  updatedAt: string
}

interface QAQuestion {
  id: string
  userId: string
  userName: string
  userAvatar: string | null
  lessonId: string | null
  question: string
  isAnswered: boolean
  isPinned: boolean
  isFlagged: boolean
  upvotes: number
  hasUpvoted: boolean
  aiDraftAnswer: string | null
  createdAt: string
  updatedAt: string
  answers: QAAnswer[]
}

interface QASettings {
  id?: string
  autoAnswer: boolean
  emailNotifications: string
  allowStudentReplies: boolean
  requireApproval: boolean
  maxQuestionsPerDay: number
}

interface Pagination {
  page: number
  limit: number
  totalItems: number
  totalPages: number
  hasNext: boolean
}

interface EnrolledCourse {
  id: string
  title: string
  category: string
  thumbnail: string | null
  instructor: { id: string; name: string; avatar: string | null }
}

interface LessonOption {
  id: string
  title: string
  moduleTitle: string
  order: number
}

type SortOption = 'newest' | 'most-upvoted' | 'unanswered-first'

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const spring = { type: 'spring' as const, stiffness: 400, damping: 25 }
const MAX_QUESTION_CHARS = 500
const PAGE_SIZE = 20

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

// ═══════════════════════════════════════════════════════════════════════════════
// Loading Skeleton
// ═══════════════════════════════════════════════════════════════════════════════

function QASkeleton() {
  return (
    <div className="space-y-6 pb-4">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-2xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-40 rounded-xl" />
          <Skeleton className="h-4 w-56 rounded-lg" />
        </div>
      </div>

      {/* Filter bar skeleton */}
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-36 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
        <Skeleton className="h-9 w-44 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>

      {/* Question cards skeleton */}
      {Array.from({ length: 4 }).map((_, i) => (
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
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════

export function StudentQAView() {
  const { currentUser } = useAppStore()

  // ─── State ──────────────────────────────────────────────────────────────
  const [courses, setCourses] = useState<EnrolledCourse[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [lessons, setLessons] = useState<LessonOption[]>([])
  const [questions, setQuestions] = useState<QAQuestion[]>([])
  const [qaSettings, setQaSettings] = useState<QASettings | null>(null)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    totalItems: 0,
    totalPages: 0,
    hasNext: false,
  })
  const [loading, setLoading] = useState(true)
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [lessonFilter, setLessonFilter] = useState<string>('all')
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [myQuestionsOnly, setMyQuestionsOnly] = useState(false)

  // Ask question modal
  const [showAskModal, setShowAskModal] = useState(false)
  const [askQuestionText, setAskQuestionText] = useState('')
  const [askLessonId, setAskLessonId] = useState<string>('')
  const [askSubmitting, setAskSubmitting] = useState(false)
  const [rateLimitRemaining, setRateLimitRemaining] = useState<number | null>(null)

  // Interaction states
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replySubmitting, setReplySubmitting] = useState(false)
  const [upvotingQuestions, setUpvotingQuestions] = useState<Set<string>>(new Set())
  const [upvotingAnswers, setUpvotingAnswers] = useState<Set<string>>(new Set())
  const [acceptingAnswer, setAcceptingAnswer] = useState<string | null>(null)

  // ─── Fetch enrolled courses ─────────────────────────────────────────────
  const fetchCourses = useCallback(async () => {
    if (!currentUser?.id) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/student/learning?userId=${currentUser.id}&status=active`)
      if (!res.ok) throw new Error('Failed to fetch courses')
      const json = await res.json()
      const enrolledCourses: EnrolledCourse[] = (json.enrollments || []).map(
        (e: Record<string, unknown>) => ({
          id: e.courseId as string,
          title: (e.course as Record<string, unknown>)?.title as string || 'Unknown Course',
          category: (e.course as Record<string, unknown>)?.category as string || '',
          thumbnail: (e.course as Record<string, unknown>)?.thumbnail as string || null,
          instructor: ((e.course as Record<string, unknown>)?.instructor || { id: '', name: 'Unknown', avatar: null }) as { id: string; name: string; avatar: string | null },
        })
      )
      setCourses(enrolledCourses)

      // Auto-select last selected course or first course
      const lastSelected = localStorage.getItem('student-qa-course-id')
      if (lastSelected && enrolledCourses.some((c) => c.id === lastSelected)) {
        setSelectedCourseId(lastSelected)
      } else if (enrolledCourses.length > 0) {
        setSelectedCourseId(enrolledCourses[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch courses')
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  // ─── Fetch lessons for selected course ──────────────────────────────────
  const fetchLessons = useCallback(async (courseId: string) => {
    try {
      const res = await fetch(`/api/student/learning?userId=${currentUser?.id}&status=active`)
      if (!res.ok) return
      const json = await res.json()
      // Get modules/lessons from the course-player API
      const courseRes = await fetch(`/api/student/course-player?courseId=${courseId}&userId=${currentUser?.id}`)
      if (courseRes.ok) {
        const courseJson = await courseRes.json()
        const lessonOptions: LessonOption[] = []
        const modules = courseJson.course?.modules || []
        for (const mod of modules) {
          for (const lesson of mod.lessons || []) {
            lessonOptions.push({
              id: lesson.id,
              title: lesson.title,
              moduleTitle: mod.title,
              order: lesson.order || 0,
            })
          }
        }
        setLessons(lessonOptions)
      } else {
        setLessons([])
      }
    } catch {
      setLessons([])
    }
  }, [currentUser?.id])

  useEffect(() => {
    if (selectedCourseId) {
      fetchLessons(selectedCourseId)
      setLessonFilter('all')
    } else {
      setLessons([])
    }
  }, [selectedCourseId, fetchLessons])

  // ─── Fetch Q&A questions ───────────────────────────────────────────────
  const fetchQuestions = useCallback(async (page = 1) => {
    if (!selectedCourseId || !currentUser?.id) return
    setQuestionsLoading(true)
    try {
      const params = new URLSearchParams({
        courseId: selectedCourseId,
        userId: currentUser.id,
        page: String(page),
        limit: String(PAGE_SIZE),
      })
      if (lessonFilter !== 'all') {
        params.set('lessonId', lessonFilter)
      }

      const res = await fetch(`/api/student/qa?${params}`)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to fetch questions')
      }
      const json = await res.json()

      if (page === 1) {
        setQuestions(json.questions || [])
      } else {
        setQuestions((prev) => [...prev, ...(json.questions || [])])
      }
      setPagination(
        json.pagination || {
          page: 1,
          limit: PAGE_SIZE,
          totalItems: 0,
          totalPages: 0,
          hasNext: false,
        }
      )
      if (json.qaSettings) {
        setQaSettings(json.qaSettings)
        setRateLimitRemaining(json.qaSettings.maxQuestionsPerDay)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch questions')
    } finally {
      setQuestionsLoading(false)
    }
  }, [selectedCourseId, currentUser?.id, lessonFilter])

  useEffect(() => {
    if (selectedCourseId) {
      fetchQuestions(1)
    }
  }, [selectedCourseId, fetchQuestions])

  // ─── Filtered & Sorted Questions ────────────────────────────────────────
  const filteredQuestions = useMemo(() => {
    let result = [...questions]

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (q) =>
          q.question.toLowerCase().includes(query) ||
          q.userName.toLowerCase().includes(query)
      )
    }

    // My questions only
    if (myQuestionsOnly && currentUser?.id) {
      result = result.filter((q) => q.userId === currentUser.id)
    }

    // Sort — pinned first, then by selected sort
    const pinned = result.filter((q) => q.isPinned)
    const unpinned = result.filter((q) => !q.isPinned)

    const sortFn = (a: QAQuestion, b: QAQuestion): number => {
      switch (sortOption) {
        case 'most-upvoted':
          return b.upvotes - a.upvotes
        case 'unanswered-first': {
          if (a.isAnswered !== b.isAnswered) return a.isAnswered ? 1 : -1
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        }
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    }

    return [...pinned.sort(sortFn), ...unpinned.sort(sortFn)]
  }, [questions, searchQuery, myQuestionsOnly, sortOption, currentUser?.id])

  // ─── API Actions ────────────────────────────────────────────────────────

  const toggleQuestionUpvote = async (questionId: string) => {
    if (!currentUser?.id) return
    setUpvotingQuestions((prev) => new Set(prev).add(questionId))
    try {
      const res = await fetch('/api/student/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upvote', questionId, userId: currentUser.id }),
      })
      if (!res.ok) throw new Error('Failed to toggle upvote')
      const data = await res.json()
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? { ...q, upvotes: data.upvotes, hasUpvoted: data.hasUpvoted }
            : q
        )
      )
    } catch {
      toast.error('Failed to toggle upvote')
    } finally {
      setUpvotingQuestions((prev) => {
        const next = new Set(prev)
        next.delete(questionId)
        return next
      })
    }
  }

  const toggleAnswerUpvote = async (answerId: string) => {
    if (!currentUser?.id) return
    setUpvotingAnswers((prev) => new Set(prev).add(answerId))
    try {
      const res = await fetch('/api/student/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upvote-answer', answerId, userId: currentUser.id }),
      })
      if (!res.ok) throw new Error('Failed to toggle upvote')
      const data = await res.json()
      setQuestions((prev) =>
        prev.map((q) => ({
          ...q,
          answers: q.answers.map((a) =>
            a.id === answerId
              ? { ...a, upvoteCount: data.upvoteCount, hasUpvoted: data.hasUpvoted }
              : a
          ),
        }))
      )
    } catch {
      toast.error('Failed to toggle upvote')
    } finally {
      setUpvotingAnswers((prev) => {
        const next = new Set(prev)
        next.delete(answerId)
        return next
      })
    }
  }

  const submitQuestion = async () => {
    if (!currentUser?.id || !selectedCourseId || !askQuestionText.trim()) {
      toast.error('Please write your question before submitting.')
      return
    }
    setAskSubmitting(true)
    try {
      const res = await fetch('/api/student/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          courseId: selectedCourseId,
          lessonId: askLessonId || undefined,
          question: askQuestionText.trim(),
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to submit question')
      }
      const data = await res.json()
      toast.success('Question submitted! The instructor will be notified.')
      if (data.rateLimit) {
        setRateLimitRemaining(data.rateLimit.remaining)
      }
      setShowAskModal(false)
      setAskQuestionText('')
      setAskLessonId('')
      fetchQuestions(1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit question')
    } finally {
      setAskSubmitting(false)
    }
  }

  const submitReply = async (questionId: string) => {
    if (!currentUser?.id || !selectedCourseId || !replyText.trim()) {
      toast.error('Please write your reply before submitting.')
      return
    }
    setReplySubmitting(true)
    try {
      const res = await fetch('/api/student/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          questionId,
          content: replyText.trim(),
          userId: currentUser.id,
          courseId: selectedCourseId,
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to submit reply')
      }
      toast.success('Reply submitted!')
      setReplyingTo(null)
      setReplyText('')
      fetchQuestions(1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit reply')
    } finally {
      setReplySubmitting(false)
    }
  }

  const acceptAnswer = async (answerId: string) => {
    if (!currentUser?.id) return
    setAcceptingAnswer(answerId)
    try {
      const res = await fetch('/api/student/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept-answer', answerId, userId: currentUser.id }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to accept answer')
      }
      toast.success('Answer accepted!')
      // Optimistically update
      setQuestions((prev) =>
        prev.map((q) => ({
          ...q,
          answers: q.answers.map((a) => ({
            ...a,
            isAccepted: a.id === answerId,
          })),
        }))
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept answer')
    } finally {
      setAcceptingAnswer(null)
    }
  }

  // ─── Toggle question expansion ──────────────────────────────────────────
  const toggleExpanded = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(questionId)) next.delete(questionId)
      else next.add(questionId)
      return next
    })
  }

  // ─── Course selection handler ───────────────────────────────────────────
  const handleCourseSelect = (courseId: string) => {
    setSelectedCourseId(courseId)
    localStorage.setItem('student-qa-course-id', courseId)
    setSearchQuery('')
    setMyQuestionsOnly(false)
    setLessonFilter('all')
    setExpandedQuestions(new Set())
  }

  // ─── Lesson filter handler ─────────────────────────────────────────────
  const handleLessonFilterChange = (value: string) => {
    setLessonFilter(value)
  }

  // ─── Refresh handler ────────────────────────────────────────────────────
  const handleRefresh = () => {
    if (selectedCourseId) {
      fetchQuestions(1)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  // ─── Initial Loading State (courses fetch) ──────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 pb-4">
        <QASkeleton />
      </div>
    )
  }

  // ─── Error State ────────────────────────────────────────────────────────
  if (error && courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <AlertCircle className="size-10 text-rose-500" />
        <p className="text-[15px] font-medium text-foreground">{error}</p>
        <p className="text-[13px] text-muted-foreground">Something went wrong while loading your courses.</p>
        <Button variant="outline" size="sm" className="rounded-full" onClick={fetchCourses}>
          <RotateCcw className="size-3.5 mr-1.5" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-4">
      {/* ═══════════════════════════════════════════════════════════════════
          1. HEADER SECTION
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white ios-shadow-sm">
            <MessageSquare className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[28px] font-bold tracking-tight">Q&A Forum</h1>
              {pagination.totalItems > 0 && (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[11px] rounded-lg font-semibold border-0 px-2 py-0.5">
                  {pagination.totalItems} {pagination.totalItems === 1 ? 'question' : 'questions'}
                </Badge>
              )}
            </div>
            <p className="text-[13px] text-muted-foreground">
              Ask questions, get answers from your instructor and peers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {selectedCourseId && (
            <Button
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white ios-press shadow-sm"
              onClick={() => setShowAskModal(true)}
            >
              <Plus className="size-4 mr-1.5" />
              Ask a Question
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl h-9 w-9"
            onClick={handleRefresh}
            disabled={questionsLoading}
          >
            <RotateCcw className={cn('size-3.5', questionsLoading && 'animate-spin')} />
          </Button>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          2. COURSE SELECTION (if no course selected, or showing selector)
          ═══════════════════════════════════════════════════════════════════ */}
      {!selectedCourseId && courses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.05 }}
          className="rounded-2xl bg-card ios-shadow-sm p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="size-5 text-emerald-500" />
            <h2 className="text-[17px] font-semibold">Select a Course</h2>
          </div>
          <p className="text-[13px] text-muted-foreground mb-4">
            Choose a course to view and ask questions. Your instructor and peers are here to help!
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <motion.div
                key={course.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => handleCourseSelect(course.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleCourseSelect(course.id)
                  }}
                  className="rounded-2xl border border-border/60 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/10 dark:to-teal-950/10 p-4 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shrink-0">
                      <BookOpen className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14px] font-semibold line-clamp-2">{course.title}</h3>
                      {course.category && (
                        <Badge variant="secondary" className="mt-1.5 text-[10px] bg-emerald-100/60 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0">
                          {course.category}
                        </Badge>
                      )}
                      {course.instructor && (
                        <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                          <GraduationCap className="size-3" />
                          {course.instructor.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Course selector dropdown when course is already selected */}
      {selectedCourseId && courses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.03 }}
          className="flex items-center gap-2"
        >
          <Select value={selectedCourseId} onValueChange={handleCourseSelect}>
            <SelectTrigger className="h-9 rounded-xl text-[13px] bg-card shadow-sm border-0 w-[220px]">
              <BookOpen className="size-3.5 mr-1.5 text-emerald-500 shrink-0" />
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>
      )}

      {/* No enrolled courses empty state */}
      {courses.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-dashed border-border/60 bg-card p-12 text-center"
        >
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 mb-4">
            <BookOpen className="size-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No Courses Yet</h3>
          <p className="text-[14px] text-muted-foreground max-w-md mx-auto">
            Enroll in a course to start asking questions and getting help from instructors and peers.
          </p>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          3. FILTER TOOLBAR
          ═══════════════════════════════════════════════════════════════════ */}
      {selectedCourseId && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.05 }}
          className="flex flex-wrap items-center gap-2"
        >
          {/* Search — always visible, compact on mobile */}
          <div className="relative flex-1 min-w-[140px] sm:min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 sm:h-9 rounded-xl text-[13px] bg-card shadow-sm border-0 pl-8 pr-3"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* My Questions toggle — always visible */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setMyQuestionsOnly(!myQuestionsOnly)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setMyQuestionsOnly(!myQuestionsOnly)
            }}
            className={cn(
              'flex items-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl text-[13px] font-medium cursor-pointer transition-all shadow-sm',
              myQuestionsOnly
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                : 'bg-card text-muted-foreground hover:text-foreground'
            )}
          >
            <HelpCircle className="size-3.5" />
            <span className="hidden sm:inline">My Questions</span>
            <span className="sm:hidden">Mine</span>
          </div>

          {/* Desktop: Lesson filter + Sort selects */}
          <div className="hidden md:flex items-center gap-2">
            {/* Lesson filter */}
            <Select value={lessonFilter} onValueChange={handleLessonFilterChange}>
              <SelectTrigger className="h-9 rounded-xl text-[13px] bg-card shadow-sm border-0 w-[170px]">
                <Filter className="size-3.5 mr-1.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="All Lessons" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lessons</SelectItem>
                {lessons.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    <span className="truncate max-w-[180px]">{l.title}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
              <SelectTrigger className="h-9 rounded-xl text-[13px] bg-card shadow-sm border-0 w-[160px]">
                <ArrowUpNarrowWide className="size-3.5 mr-1.5 text-muted-foreground shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Most Recent</SelectItem>
                <SelectItem value="most-upvoted">Most Upvoted</SelectItem>
                <SelectItem value="unanswered-first">Unanswered First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mobile: Filter sheet button */}
          <MobileFilterSheet
            activeCount={[lessonFilter !== 'all', sortOption !== 'newest'].filter(Boolean).length}
            onClearAll={() => { setLessonFilter('all'); setSortOption('newest') }}
            title="Q&A Filters"
          >
            <MobileFilterGroup label="Lesson">
              <Select value={lessonFilter} onValueChange={handleLessonFilterChange}>
                <SelectTrigger className="w-full rounded-xl h-10 text-[13px]">
                  <SelectValue placeholder="All Lessons" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lessons</SelectItem>
                  {lessons.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      <span className="truncate max-w-[240px]">{l.title}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </MobileFilterGroup>
            <MobileFilterGroup label="Sort">
              <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                <SelectTrigger className="w-full rounded-xl h-10 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Most Recent</SelectItem>
                  <SelectItem value="most-upvoted">Most Upvoted</SelectItem>
                  <SelectItem value="unanswered-first">Unanswered First</SelectItem>
                </SelectContent>
              </Select>
            </MobileFilterGroup>
          </MobileFilterSheet>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          4. QUESTIONS LIST
          ═══════════════════════════════════════════════════════════════════ */}
      {selectedCourseId && (
        <div className="space-y-4">
          {/* Questions loading overlay */}
          {questionsLoading && questions.length === 0 ? (
            <QASkeleton />
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredQuestions.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-2xl border border-dashed border-border/60 bg-card p-12 text-center"
                >
                  <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/40 mb-4">
                    <MessageCircle className="size-8 text-emerald-500/40" />
                  </div>
                  {searchQuery || lessonFilter !== 'all' || myQuestionsOnly ? (
                    <>
                      <h3 className="text-lg font-semibold mb-1">No questions match your filters</h3>
                      <p className="text-[14px] text-muted-foreground max-w-md mx-auto mb-4">
                        Try adjusting your filters or search terms to find what you&apos;re looking for.
                      </p>
                      <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={() => {
                          setSearchQuery('')
                          setLessonFilter('all')
                          setMyQuestionsOnly(false)
                        }}
                      >
                        Clear Filters
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold mb-1">No questions yet</h3>
                      <p className="text-[14px] text-muted-foreground max-w-md mx-auto mb-4">
                        Be the first to ask a question! Your instructor and peers are here to help.
                      </p>
                      <Button
                        className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                        onClick={() => setShowAskModal(true)}
                      >
                        <Sparkles className="size-4 mr-1.5" />
                        Ask the First Question
                      </Button>
                    </>
                  )}
                </motion.div>
              ) : (
                filteredQuestions.map((question, index) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    index={index}
                    currentUserId={currentUser?.id || ''}
                    isExpanded={expandedQuestions.has(question.id)}
                    toggleExpanded={() => toggleExpanded(question.id)}
                    upvotingQuestion={upvotingQuestions.has(question.id)}
                    toggleUpvote={() => toggleQuestionUpvote(question.id)}
                    replyingTo={replyingTo}
                    setReplyingTo={setReplyingTo}
                    replyText={replyText}
                    setReplyText={setReplyText}
                    replySubmitting={replySubmitting}
                    submitReply={submitReply}
                    upvotingAnswers={upvotingAnswers}
                    toggleAnswerUpvote={toggleAnswerUpvote}
                    acceptAnswer={acceptAnswer}
                    acceptingAnswer={acceptingAnswer}
                    allowStudentReplies={qaSettings?.allowStudentReplies ?? true}
                    lessons={lessons}
                  />
                ))
              )}
            </AnimatePresence>
          )}

          {/* Load More */}
          {pagination.hasNext && !questionsLoading && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => fetchQuestions(pagination.page + 1)}
                disabled={questionsLoading}
              >
                {questionsLoading ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <ChevronDown className="size-4 mr-2" />
                )}
                Load More Questions
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          5. ASK QUESTION DIALOG
          ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={showAskModal} onOpenChange={setShowAskModal}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <MessageSquare className="size-4" />
              </div>
              Ask a Question
            </DialogTitle>
            <DialogDescription>
              Your question will be visible to the instructor and other students in the course.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Course indicator */}
            {selectedCourseId && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/40 dark:border-emerald-800/20">
                <BookOpen className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[13px] font-medium text-emerald-700 dark:text-emerald-400">
                  {courses.find((c) => c.id === selectedCourseId)?.title || 'Selected Course'}
                </span>
              </div>
            )}

            {/* Lesson selector */}
            {lessons.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium">Related Lesson (optional)</Label>
                <Select value={askLessonId} onValueChange={setAskLessonId}>
                  <SelectTrigger className="rounded-xl h-9 text-[13px]">
                    <SelectValue placeholder="Select a lesson..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (General)</SelectItem>
                    {lessons.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Question text area */}
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium">Your Question</Label>
              <Textarea
                placeholder="What would you like to ask? Be specific for better answers..."
                value={askQuestionText}
                onChange={(e) => setAskQuestionText(e.target.value.slice(0, MAX_QUESTION_CHARS))}
                className="rounded-xl min-h-[120px] text-[14px] resize-none"
                maxLength={MAX_QUESTION_CHARS}
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  Be clear and specific for the best answers
                </span>
                <span
                  className={cn(
                    'text-[11px] font-medium',
                    askQuestionText.length >= MAX_QUESTION_CHARS * 0.9
                      ? 'text-amber-600'
                      : 'text-muted-foreground'
                  )}
                >
                  {askQuestionText.length}/{MAX_QUESTION_CHARS}
                </span>
              </div>
            </div>

            {/* Rate limit indicator */}
            {rateLimitRemaining !== null && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/50 border border-border/50">
                <Hash className="size-3.5 text-muted-foreground" />
                <span className="text-[12px] text-muted-foreground">
                  <span className="font-semibold text-foreground">{rateLimitRemaining}</span> question{rateLimitRemaining !== 1 ? 's' : ''} remaining today
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => {
                setShowAskModal(false)
                setAskQuestionText('')
                setAskLessonId('')
              }}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
              onClick={submitQuestion}
              disabled={askSubmitting || !askQuestionText.trim()}
            >
              {askSubmitting ? (
                <Loader2 className="size-4 mr-2 animate-spin" />
              ) : (
                <Send className="size-4 mr-2" />
              )}
              {askSubmitting ? 'Submitting...' : 'Submit Question'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// QuestionCard Component
// ═══════════════════════════════════════════════════════════════════════════════

function QuestionCard({
  question,
  index,
  currentUserId,
  isExpanded,
  toggleExpanded,
  upvotingQuestion,
  toggleUpvote,
  replyingTo,
  setReplyingTo,
  replyText,
  setReplyText,
  replySubmitting,
  submitReply,
  upvotingAnswers,
  toggleAnswerUpvote,
  acceptAnswer,
  acceptingAnswer,
  allowStudentReplies,
  lessons,
}: {
  question: QAQuestion
  index: number
  currentUserId: string
  isExpanded: boolean
  toggleExpanded: () => void
  upvotingQuestion: boolean
  toggleUpvote: () => void
  replyingTo: string | null
  setReplyingTo: (id: string | null) => void
  replyText: string
  setReplyText: (text: string) => void
  replySubmitting: boolean
  submitReply: (questionId: string) => Promise<void>
  upvotingAnswers: Set<string>
  toggleAnswerUpvote: (answerId: string) => void
  acceptAnswer: (answerId: string) => Promise<void>
  acceptingAnswer: string | null
  allowStudentReplies: boolean
  lessons: LessonOption[]
}) {
  const isOwner = question.userId === currentUserId
  const hasAcceptedAnswer = question.answers.some((a) => a.isAccepted)
  const hasInstructorAnswer = question.answers.some((a) => a.isInstructorAnswer)
  const isReplying = replyingTo === question.id

  // Sort answers: Accepted first, then instructor answers, then by upvotes
  const sortedAnswers = useMemo(() => {
    return [...question.answers].sort((a, b) => {
      if (a.isAccepted !== b.isAccepted) return a.isAccepted ? -1 : 1
      if (a.isInstructorAnswer !== b.isInstructorAnswer) return a.isInstructorAnswer ? -1 : 1
      return b.upvoteCount - a.upvoteCount
    })
  }, [question.answers])

  // Status badge config
  const getStatusBadge = () => {
    if (question.isPinned) {
      return (
        <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 text-[10px] rounded-md border-0 px-2 py-0.5 font-semibold">
          <Pin className="size-2.5 mr-1" />
          PINNED
        </Badge>
      )
    }
    if (question.isAnswered) {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[11px] rounded-lg border-0 px-2.5 py-0.5 font-semibold">
          <CheckCircle2 className="size-3 mr-1" />
          ANSWERED
        </Badge>
      )
    }
    return (
      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 text-[11px] rounded-lg border-0 px-2.5 py-0.5 font-semibold">
        <Clock className="size-3 mr-1" />
        UNANSWERED
      </Badge>
    )
  }

  // Find lesson name
  const lessonName = question.lessonId
    ? lessons.find((l) => l.id === question.lessonId)?.title || 'Unknown Lesson'
    : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ ...spring, delay: index * 0.03 }}
      className={cn(
        'rounded-2xl bg-card ios-shadow-sm overflow-hidden',
        question.isPinned && 'ring-1 ring-cyan-300 dark:ring-cyan-700'
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={toggleExpanded}>
        <div className="p-5 space-y-3">
          {/* Top row: status + badges */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge()}
              {hasInstructorAnswer && (
                <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 text-[10px] rounded-md border-0 px-2 py-0.5 font-semibold">
                  <GraduationCap className="size-2.5 mr-1" />
                  INSTRUCTOR REPLIED
                </Badge>
              )}
              {hasAcceptedAnswer && (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] rounded-md border-0 px-2 py-0.5 font-semibold">
                  <ShieldCheck className="size-2.5 mr-1" />
                  ACCEPTED
                </Badge>
              )}
            </div>
            {lessonName && (
              <Badge variant="outline" className="text-[10px] rounded-md px-2 py-0.5 border-border/50 text-muted-foreground">
                {lessonName}
              </Badge>
            )}
          </div>

          {/* Question text */}
          <p className="text-[14px] leading-relaxed text-foreground whitespace-pre-wrap">
            {question.question}
          </p>

          {/* AI Draft Answer (collapsed) */}
          {question.aiDraftAnswer && !question.isAnswered && !isExpanded && (
            <div className="rounded-xl bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200/40 dark:border-cyan-800/20 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Bot className="size-3.5 text-cyan-600 dark:text-cyan-400" />
                <span className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-400">AI Draft Answer</span>
              </div>
              <p className="text-[12px] text-muted-foreground line-clamp-2">
                {question.aiDraftAnswer}
              </p>
            </div>
          )}

          {/* Author + time + action row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Avatar className="size-6">
                <AvatarImage src={question.userAvatar || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-[9px] font-bold">
                  {getInitials(question.userName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[12px] font-medium text-foreground">{question.userName}</span>
              {isOwner && (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[9px] rounded-md border-0 px-1.5 py-0">
                  YOU
                </Badge>
              )}
              <span className="text-[11px] text-muted-foreground">·</span>
              <span className="text-[11px] text-muted-foreground">
                {formatRelativeTime(question.createdAt)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Upvote button */}
              <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleUpvote()
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation()
                    toggleUpvote()
                  }
                }}
                className={cn(
                  'flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-all cursor-pointer',
                  question.hasUpvoted
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
                  upvotingQuestion && 'opacity-50 pointer-events-none'
                )}
              >
                <ThumbsUp className={cn('size-3.5', question.hasUpvoted && 'fill-current')} />
                {question.upvotes}
              </div>

              {/* Answer count / expand */}
              <CollapsibleTrigger asChild>
                <div
                  role="button"
                  tabIndex={0}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
                >
                  <MessageCircle className="size-3.5" />
                  {question.answers.length}
                  {isExpanded ? (
                    <ChevronUp className="size-3" />
                  ) : (
                    <ChevronDown className="size-3" />
                  )}
                </div>
              </CollapsibleTrigger>

              {/* Reply button */}
              {allowStudentReplies && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (!isExpanded) toggleExpanded()
                    setReplyingTo(isReplying ? null : question.id)
                    setReplyText('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation()
                      if (!isExpanded) toggleExpanded()
                      setReplyingTo(isReplying ? null : question.id)
                      setReplyText('')
                    }
                  }}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-medium bg-muted/50 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-400 transition-all cursor-pointer"
                >
                  <PenLine className="size-3.5" />
                  Reply
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════ Expanded Answers Section ═══════ */}
        <CollapsibleContent>
          <div className="border-t border-border/40">
            {/* Answers list */}
            {sortedAnswers.length > 0 && (
              <div className="divide-y divide-border/30">
                {sortedAnswers.map((answer) => (
                  <AnswerCard
                    key={answer.id}
                    answer={answer}
                    questionOwnerId={question.userId}
                    currentUserId={currentUserId}
                    upvoting={upvotingAnswers.has(answer.id)}
                    toggleUpvote={() => toggleAnswerUpvote(answer.id)}
                    acceptAnswer={() => acceptAnswer(answer.id)}
                    accepting={acceptingAnswer === answer.id}
                  />
                ))}
              </div>
            )}

            {/* No answers yet */}
            {sortedAnswers.length === 0 && (
              <div className="p-6 text-center">
                <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-amber-100/50 dark:bg-amber-950/20 mb-2">
                  <MessageCircle className="size-5 text-amber-500/50" />
                </div>
                <p className="text-[13px] text-muted-foreground">
                  No answers yet. {allowStudentReplies ? 'Be the first to reply!' : 'Waiting for the instructor to respond.'}
                </p>
              </div>
            )}

            {/* Reply form */}
            {isReplying && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 border-t border-border/30 bg-muted/20"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="size-7 mt-0.5">
                    <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-[9px] font-bold">
                      {getInitials('You')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Write your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="rounded-xl min-h-[80px] text-[13px] resize-none"
                      maxLength={1000}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-lg text-[12px] h-8"
                        onClick={() => {
                          setReplyingTo(null)
                          setReplyText('')
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white h-8 text-[12px]"
                        onClick={() => submitReply(question.id)}
                        disabled={replySubmitting || !replyText.trim()}
                      >
                        {replySubmitting ? (
                          <Loader2 className="size-3.5 mr-1 animate-spin" />
                        ) : (
                          <Send className="size-3.5 mr-1" />
                        )}
                        {replySubmitting ? 'Posting...' : 'Post Reply'}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Show reply button if not already replying and replies are allowed */}
            {!isReplying && allowStudentReplies && (
              <div className="p-3 border-t border-border/30">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setReplyingTo(question.id)
                    setReplyText('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setReplyingTo(question.id)
                      setReplyText('')
                    }
                  }}
                  className="flex items-center gap-2 p-2 rounded-xl text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all cursor-pointer"
                >
                  <PenLine className="size-3.5" />
                  Write a reply...
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// AnswerCard Component
// ═══════════════════════════════════════════════════════════════════════════════

function AnswerCard({
  answer,
  questionOwnerId,
  currentUserId,
  upvoting,
  toggleUpvote,
  acceptAnswer,
  accepting,
}: {
  answer: QAAnswer
  questionOwnerId: string
  currentUserId: string
  upvoting: boolean
  toggleUpvote: () => void
  acceptAnswer: () => Promise<void>
  accepting: boolean
}) {
  const canAccept = currentUserId === questionOwnerId
  const isOwner = answer.userId === currentUserId

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'p-4 space-y-3',
        answer.isAccepted && 'bg-emerald-50/40 dark:bg-emerald-950/10',
        answer.isInstructorAnswer && !answer.isAccepted && 'bg-teal-50/30 dark:bg-teal-950/10'
      )}
    >
      {/* Author row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar className="size-7">
            <AvatarImage src={answer.userAvatar || undefined} />
            <AvatarFallback
              className={cn(
                'text-[9px] font-bold',
                answer.isInstructorAnswer
                  ? 'bg-gradient-to-br from-teal-400 to-emerald-500 text-white'
                  : 'bg-gradient-to-br from-slate-400 to-slate-500 text-white'
              )}
            >
              {getInitials(answer.userName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-medium">{answer.userName}</span>
            {answer.isInstructorAnswer ? (
              <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 text-[9px] rounded-md border-0 px-1.5 py-0 font-semibold">
                <GraduationCap className="size-2.5 mr-0.5" />
                INSTRUCTOR
              </Badge>
            ) : (
              <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 text-[9px] rounded-md border-0 px-1.5 py-0 font-semibold">
                STUDENT
              </Badge>
            )}
            {isOwner && (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[9px] rounded-md border-0 px-1.5 py-0">
                YOU
              </Badge>
            )}
            {answer.isAiGenerated && (
              <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 text-[9px] rounded-md border-0 px-1.5 py-0 font-semibold">
                <Bot className="size-2.5 mr-0.5" />
                AI
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {answer.isAccepted && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring}>
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] rounded-lg border-0 px-2 py-0.5 font-semibold">
                <CheckCircle2 className="size-3 mr-1" />
                Accepted
              </Badge>
            </motion.div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pl-9">
        <p className="text-[13px] leading-relaxed text-foreground whitespace-pre-wrap">
          {answer.content}
        </p>
        <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
          <span>{formatRelativeTime(answer.createdAt)}</span>
          {answer.isEdited && (
            <>
              <span>·</span>
              <span className="italic">edited</span>
            </>
          )}
        </div>
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-2 pl-9">
        {/* Upvote */}
        <div
          role="button"
          tabIndex={0}
          onClick={toggleUpvote}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') toggleUpvote()
          }}
          className={cn(
            'flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium transition-all cursor-pointer',
            answer.hasUpvoted
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
            upvoting && 'opacity-50 pointer-events-none'
          )}
        >
          <ThumbsUp className={cn('size-3', answer.hasUpvoted && 'fill-current')} />
          {answer.upvoteCount}
        </div>

        {/* Accept button (only for question owner) */}
        {canAccept && !answer.isAccepted && (
          <div
            role="button"
            tabIndex={0}
            onClick={acceptAnswer}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') acceptAnswer()
            }}
            className={cn(
              'flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium transition-all cursor-pointer',
              accepting
                ? 'opacity-50 pointer-events-none'
                : 'bg-muted/50 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-400'
            )}
          >
            {accepting ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <CheckCircle2 className="size-3" />
            )}
            Accept
          </div>
        )}
      </div>

      {/* Accepted answer separator */}
      {answer.isAccepted && (
        <div className="pl-9">
          <Separator className="bg-emerald-200/50 dark:bg-emerald-800/30" />
        </div>
      )}
    </motion.div>
  )
}
