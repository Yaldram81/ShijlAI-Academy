'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, CheckCircle, XCircle, AlertCircle, Flag, MoreHorizontal,
  BookOpen, Clock, Eye, Star, ChevronDown, ChevronUp, Video,
  FileCheck, Edit3, CircleDot, Loader2, X, Sparkles, UserPlus,
  ArrowUpRight, MessageSquare, Globe, DollarSign, Calendar,
  Shield, StickyNote, PlayCircle, Lock, Users, Tag, Target,
  MapPin, Languages, Info, Award, ThumbsUp, ThumbsDown, MinusCircle,
  ExternalLink,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

// ─── Types ──────────────────────────────────────────────────────────────────

interface CourseDetailData {
  id: string
  title: string
  description: string
  category: string
  level: string
  language: string
  thumbnail: string | null
  price: number
  overridePrice: number | null
  isPublished: boolean
  isArchived: boolean
  enrollmentCount: number
  rating: number
  reviewStatus: string
  reviewNote: string | null
  reviewChecklist: Record<string, string> | null
  adminNotes: Array<{ note: string; adminName: string; date: string }> | null
  reviewedBy: string | null
  flaggedReason: string | null
  submittedForReviewAt: string | null
  reviewedAt: string | null
  estimatedDuration: number
  certificateEnabled: boolean
  completionThreshold: number
  learningObjectives: string | null
  prerequisites: string | null
  targetAudience: string | null
  tags: string | null
  promoVideoUrl: string | null
  createdAt: string
  updatedAt: string
  instructor: {
    id: string
    name: string
    avatar: string | null
    email: string
    instructorProfile?: { headline: string | null; expertise: string | null } | null
  }
  modules: Array<{
    id: string
    title: string
    order: number
    isPublished: boolean
    lessons: Array<{ id: string; title: string; type: string; duration: number; order: number; isPublished: boolean; isFree: boolean }>
  }>
  _count: { modules: number; enrollments: number; reviews: number }
  totalDuration: number
  totalLessons: number
  recentReviews: Array<{ id: string; rating: number; content: string; isAnonymous: boolean; createdAt: string; user: { id: string; name: string; avatar: string | null } }>
  reviewHistory: Array<{
    id: string
    action: string
    reviewerName: string | null
    note: string | null
    previousStatus: string | null
    newStatus: string | null
    createdAt: string
  }>
}

interface AIAnalysisResult {
  overallScore: number
  contentQuality: number
  structureAssessment: number
  pricingAssessment: number
  issues: string[]
  recommendations: string[]
  suggestedDecision: string
  confidence: number
}

interface ToastItem {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

interface AdminCourseReviewDetailProps {
  courseId: string
  onBack: () => void
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatNumber(num: number | undefined | null): string {
  if (num == null) return '0'
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return num.toLocaleString()
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(dateStr)
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

function formatDuration(minutes: number | undefined | null): string {
  if (!minutes) return '0m'
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function getLessonTypeIcon(type: string) {
  switch (type) {
    case 'video': return <Video className="size-3.5 text-teal-500" />
    case 'quiz': return <FileCheck className="size-3.5 text-amber-500" />
    case 'assignment': return <Edit3 className="size-3.5 text-violet-500" />
    case 'text': return <BookOpen className="size-3.5 text-sky-500" />
    default: return <CircleDot className="size-3.5 text-slate-400" />
  }
}

function parseJsonList(jsonStr: string | null): string[] {
  if (!jsonStr) return []
  try {
    const parsed = JSON.parse(jsonStr)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

// ─── Status Config ──────────────────────────────────────────────────────────

const REVIEW_STATUS_CONFIG: Record<string, { label: string; badgeClass: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending Review',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    icon: <Clock className="size-3.5 text-amber-500" />,
  },
  under_review: {
    label: 'Under Review',
    badgeClass: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
    icon: <Eye className="size-3.5 text-sky-500 animate-pulse" />,
  },
  approved: {
    label: 'Approved',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    icon: <CheckCircle className="size-3.5 text-emerald-500" />,
  },
  changes_requested: {
    label: 'Changes Requested',
    badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
    icon: <AlertCircle className="size-3.5 text-orange-500" />,
  },
  rejected: {
    label: 'Rejected',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
    icon: <XCircle className="size-3.5 text-red-500" />,
  },
  flagged: {
    label: 'Flagged',
    badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
    icon: <Flag className="size-3.5 text-rose-500" />,
  },
  draft: {
    label: 'Draft',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
    icon: <Edit3 className="size-3.5 text-slate-400" />,
  },
}

// ─── Checklist Items ────────────────────────────────────────────────────────

const CHECKLIST_ITEMS = [
  { key: 'complete_description', label: 'Complete Description' },
  { key: 'video_quality', label: 'Video Content Quality' },
  { key: 'clear_objectives', label: 'Clear Learning Objectives' },
  { key: 'appropriate_pricing', label: 'Appropriate Pricing' },
  { key: 'no_plagiarism', label: 'No Plagiarism' },
  { key: 'proper_categorization', label: 'Proper Categorization' },
  { key: 'thumbnail_quality', label: 'Thumbnail Quality' },
  { key: 'course_structure', label: 'Course Structure & Flow' },
  { key: 'adequate_content', label: 'Adequate Content Length' },
  { key: 'prerequisites_listed', label: 'Proper Prerequisites Listed' },
] as const

// ─── Review History Action Config ───────────────────────────────────────────

const HISTORY_ACTION_CONFIG: Record<string, { label: string; icon: React.ReactNode; colorClass: string }> = {
  submitted: { label: 'Submitted for Review', icon: <BookOpen className="size-4 text-amber-500" />, colorClass: 'text-amber-600 dark:text-amber-400' },
  approved: { label: 'Approved', icon: <CheckCircle className="size-4 text-emerald-500" />, colorClass: 'text-emerald-600 dark:text-emerald-400' },
  rejected: { label: 'Rejected', icon: <XCircle className="size-4 text-red-500" />, colorClass: 'text-red-600 dark:text-red-400' },
  changes_requested: { label: 'Changes Requested', icon: <AlertCircle className="size-4 text-orange-500" />, colorClass: 'text-orange-600 dark:text-orange-400' },
  flagged: { label: 'Flagged', icon: <Flag className="size-4 text-rose-500" />, colorClass: 'text-rose-600 dark:text-rose-400' },
  unflagged: { label: 'Unflagged', icon: <Shield className="size-4 text-slate-500" />, colorClass: 'text-slate-600 dark:text-slate-400' },
  assigned: { label: 'Assigned Reviewer', icon: <UserPlus className="size-4 text-sky-500" />, colorClass: 'text-sky-600 dark:text-sky-400' },
  escalated: { label: 'Escalated', icon: <ArrowUpRight className="size-4 text-amber-500" />, colorClass: 'text-amber-600 dark:text-amber-400' },
  note_added: { label: 'Note Added', icon: <MessageSquare className="size-4 text-violet-500" />, colorClass: 'text-violet-600 dark:text-violet-400' },
  start_review: { label: 'Review Started', icon: <Eye className="size-4 text-sky-500" />, colorClass: 'text-sky-600 dark:text-sky-400' },
}

// ─── Circular Progress Component ────────────────────────────────────────────

function CircularProgress({ value, size = 80, strokeWidth = 6, color = '#14b8a6' }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference
  const center = size / 2

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-muted/30" />
        <circle cx={center} cy={center} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <span className="absolute text-[18px] font-bold" style={{ color }}>{value}</span>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AdminCourseReviewDetail({ courseId, onBack }: AdminCourseReviewDetailProps) {
  const { currentUser } = useAppStore()

  // ── State: Course Detail ──
  const [course, setCourse] = useState<CourseDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── State: Checklist ──
  const [checklistState, setChecklistState] = useState<Record<string, string>>({})

  // ── State: Expanded Modules ──
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  // ── State: Review Note ──
  const [reviewNote, setReviewNote] = useState('')

  // ── State: Admin Note ──
  const [newAdminNote, setNewAdminNote] = useState('')

  // ── State: Action loading ──
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // ── State: AI Analysis ──
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  // ── State: Dialogs ──
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [approveNote, setApproveNote] = useState('')
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [showChangesDialog, setShowChangesDialog] = useState(false)
  const [changesNote, setChangesNote] = useState('')
  const [showFlagDialog, setShowFlagDialog] = useState(false)
  const [flagReason, setFlagReason] = useState('')
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [assignName, setAssignName] = useState('')

  // ── State: Toasts ──
  const [toasts, setToasts] = useState<ToastItem[]>([])

  // ── Toast Helpers ──
  const addToast = useCallback((type: ToastItem['type'], message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setToasts(prev => [...prev, { id, type, message }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Auto-remove toasts
  useEffect(() => {
    if (toasts.length === 0) return
    const timer = setTimeout(() => {
      setToasts(prev => prev.slice(1))
    }, 3000)
    return () => clearTimeout(timer)
  }, [toasts])

  // ── Fetch Course Detail ──
  const fetchCourseDetail = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/course-review/${courseId}`)
      if (!res.ok) throw new Error('Failed to fetch course details')
      const data = await res.json()
      const courseData = data.course || data
      setCourse(courseData)
      setReviewNote(courseData.reviewNote || '')
      setNewAdminNote('')
      // Init checklist from existing or defaults
      const existing = courseData.reviewChecklist || {}
      const init: Record<string, string> = {}
      CHECKLIST_ITEMS.forEach(item => {
        init[item.key] = existing[item.key] || 'unset'
      })
      setChecklistState(init)
      // Expand first module
      if (courseData.modules?.length > 0) {
        setExpandedModules(new Set([courseData.modules[0].id]))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course details')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    fetchCourseDetail()
  }, [fetchCourseDetail])

  // ── Toggle module expansion ──
  const toggleModule = useCallback((moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }, [])

  // ── Update checklist item ──
  const updateChecklistItem = useCallback((key: string, value: string) => {
    setChecklistState(prev => ({ ...prev, [key]: value }))
  }, [])

  // ── Save Checklist ──
  const handleSaveChecklist = useCallback(async () => {
    if (!course) return
    setActionLoading('save-checklist')
    try {
      const res = await fetch(`/api/admin/course-review/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_checklist', checklist: checklistState }),
      })
      if (!res.ok) throw new Error('Failed to save checklist')
      addToast('success', 'Review checklist saved')
      fetchCourseDetail()
    } catch {
      addToast('error', 'Failed to save checklist')
    } finally {
      setActionLoading(null)
    }
  }, [course, checklistState, fetchCourseDetail, addToast])

  // ── Approve Course ──
  const handleApprove = useCallback(async () => {
    if (!course) return
    setActionLoading('approve')
    try {
      const res = await fetch(`/api/admin/course-review/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', reviewNote: approveNote.trim() || undefined }),
      })
      if (!res.ok) throw new Error('Approve failed')
      addToast('success', 'Course approved successfully')
      setShowApproveDialog(false)
      setApproveNote('')
      fetchCourseDetail()
    } catch {
      addToast('error', 'Failed to approve course')
    } finally {
      setActionLoading(null)
    }
  }, [course, approveNote, fetchCourseDetail, addToast])

  // ── Reject Course ──
  const handleReject = useCallback(async () => {
    if (!course || !rejectNote.trim()) return
    setActionLoading('reject')
    try {
      const res = await fetch(`/api/admin/course-review/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reviewNote: rejectNote.trim() }),
      })
      if (!res.ok) throw new Error('Reject failed')
      addToast('success', 'Course rejected')
      setShowRejectDialog(false)
      setRejectNote('')
      fetchCourseDetail()
    } catch {
      addToast('error', 'Failed to reject course')
    } finally {
      setActionLoading(null)
    }
  }, [course, rejectNote, fetchCourseDetail, addToast])

  // ── Request Changes ──
  const handleRequestChanges = useCallback(async () => {
    if (!course || !changesNote.trim()) return
    setActionLoading('request_changes')
    try {
      const res = await fetch(`/api/admin/course-review/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_changes', reviewNote: changesNote.trim(), checklist: checklistState }),
      })
      if (!res.ok) throw new Error('Request changes failed')
      addToast('success', 'Changes requested')
      setShowChangesDialog(false)
      setChangesNote('')
      fetchCourseDetail()
    } catch {
      addToast('error', 'Failed to request changes')
    } finally {
      setActionLoading(null)
    }
  }, [course, changesNote, checklistState, fetchCourseDetail, addToast])

  // ── Flag Course ──
  const handleFlag = useCallback(async () => {
    if (!course || !flagReason.trim()) return
    setActionLoading('flag')
    try {
      const res = await fetch(`/api/admin/course-review/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'flag', reason: flagReason.trim(), adminName: currentUser?.name || 'Admin' }),
      })
      if (!res.ok) throw new Error('Flag failed')
      addToast('success', 'Course flagged')
      setShowFlagDialog(false)
      setFlagReason('')
      fetchCourseDetail()
    } catch {
      addToast('error', 'Failed to flag course')
    } finally {
      setActionLoading(null)
    }
  }, [course, flagReason, currentUser?.name, fetchCourseDetail, addToast])

  // ── Assign Reviewer ──
  const handleAssign = useCallback(async () => {
    if (!course || !assignName.trim()) return
    setActionLoading('assign')
    try {
      const res = await fetch(`/api/admin/course-review/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign', assignName: assignName.trim(), adminName: currentUser?.name || 'Admin' }),
      })
      if (!res.ok) throw new Error('Assign failed')
      addToast('success', `Assigned to ${assignName.trim()}`)
      setShowAssignDialog(false)
      setAssignName('')
      fetchCourseDetail()
    } catch {
      addToast('error', 'Failed to assign reviewer')
    } finally {
      setActionLoading(null)
    }
  }, [course, assignName, currentUser?.name, fetchCourseDetail, addToast])

  // ── Save Review Note ──
  const handleSaveReviewNote = useCallback(async () => {
    if (!course || !reviewNote.trim()) return
    setActionLoading('save-note')
    try {
      const res = await fetch(`/api/admin/course-review/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_review_note', reviewNote: reviewNote.trim() }),
      })
      if (!res.ok) throw new Error('Save note failed')
      addToast('success', 'Review note saved')
      fetchCourseDetail()
    } catch {
      addToast('error', 'Failed to save review note')
    } finally {
      setActionLoading(null)
    }
  }, [course, reviewNote, fetchCourseDetail, addToast])

  // ── Add Admin Note ──
  const handleAddAdminNote = useCallback(async () => {
    if (!course || !newAdminNote.trim()) return
    setActionLoading('add-admin-note')
    try {
      const res = await fetch(`/api/admin/course-review/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_note', note: newAdminNote.trim(), adminName: currentUser?.name || 'Admin' }),
      })
      if (!res.ok) throw new Error('Add note failed')
      addToast('success', 'Admin note added')
      setNewAdminNote('')
      fetchCourseDetail()
    } catch {
      addToast('error', 'Failed to add note')
    } finally {
      setActionLoading(null)
    }
  }, [course, newAdminNote, currentUser?.name, fetchCourseDetail, addToast])

  // ── Run AI Analysis ──
  const handleRunAiAnalysis = useCallback(async () => {
    if (!course) return
    setAiLoading(true)
    setAiAnalysis(null)
    try {
      const res = await fetch(`/api/admin/course-review/${course.id}/ai-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('AI analysis failed')
      const data = await res.json()
      setAiAnalysis(data)
    } catch {
      addToast('error', 'AI analysis failed. Try again.')
    } finally {
      setAiLoading(false)
    }
  }, [course, addToast])

  // ── Escalate ──
  const handleEscalate = useCallback(async () => {
    if (!course) return
    setActionLoading('escalate')
    try {
      const res = await fetch(`/api/admin/course-review/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'escalate', adminName: currentUser?.name || 'Admin' }),
      })
      if (!res.ok) throw new Error('Escalate failed')
      addToast('success', 'Course escalated')
      fetchCourseDetail()
    } catch {
      addToast('error', 'Failed to escalate')
    } finally {
      setActionLoading(null)
    }
  }, [course, currentUser?.name, fetchCourseDetail, addToast])

  // ── Start Review ──
  const handleStartReview = useCallback(async () => {
    if (!course) return
    setActionLoading('start_review')
    try {
      const res = await fetch(`/api/admin/course-review/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_review', adminName: currentUser?.name || 'Admin' }),
      })
      if (!res.ok) throw new Error('Start review failed')
      addToast('success', 'Review started')
      fetchCourseDetail()
    } catch {
      addToast('error', 'Failed to start review')
    } finally {
      setActionLoading(null)
    }
  }, [course, currentUser?.name, fetchCourseDetail, addToast])

  // ── Computed ──
  const statusConf = REVIEW_STATUS_CONFIG[course?.reviewStatus || 'pending'] || REVIEW_STATUS_CONFIG.pending
  const objectives = parseJsonList(course?.learningObjectives || null)
  const prerequisites = parseJsonList(course?.prerequisites || null)
  const adminNotes = course?.adminNotes || []

  // ── Checklist stats ──
  const checklistStats = {
    pass: Object.values(checklistState).filter(v => v === 'pass').length,
    warn: Object.values(checklistState).filter(v => v === 'warn').length,
    fail: Object.values(checklistState).filter(v => v === 'fail').length,
    unset: Object.values(checklistState).filter(v => v === 'unset').length,
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <>
      {/* ─── Toast Container ─── */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-[13px] font-medium min-w-[280px] max-w-[400px]',
                toast.type === 'success' && 'bg-emerald-600 text-white',
                toast.type === 'error' && 'bg-red-600 text-white',
                toast.type === 'info' && 'bg-sky-600 text-white',
              )}
            >
              {toast.type === 'success' && <CheckCircle className="size-4 shrink-0" />}
              {toast.type === 'error' && <XCircle className="size-4 shrink-0" />}
              {toast.type === 'info' && <AlertCircle className="size-4 shrink-0" />}
              <span className="flex-1">{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} className="shrink-0 hover:opacity-70 transition-opacity">
                <X className="size-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={springTransition}
        className="space-y-6"
      >
        {/* ─── Top Bar ─── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={onBack}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <div className="min-w-0">
              <h1 className="text-[20px] font-bold text-foreground leading-tight truncate max-w-[400px]">
                {course?.title || 'Course Review'}
              </h1>
            </div>
            {course && (
              <Badge className={cn('text-[12px] rounded-lg px-2.5 py-0.5 gap-1 font-medium shrink-0', statusConf.badgeClass)}>
                {statusConf.icon} {statusConf.label}
              </Badge>
            )}
          </div>
          {course && (
            <div className="flex items-center gap-2 flex-wrap">
              {course.reviewStatus === 'pending' && (
                <Button size="sm" className="rounded-xl gap-1.5 h-8 text-[12px] bg-sky-600 hover:bg-sky-700 text-white" disabled={!!actionLoading} onClick={handleStartReview}>
                  <Eye className="size-3.5" /> Start Review
                </Button>
              )}
              <Button size="sm" className="rounded-xl gap-1.5 h-8 text-[12px] bg-emerald-600 hover:bg-emerald-700 text-white" disabled={!!actionLoading} onClick={() => { setApproveNote(''); setShowApproveDialog(true) }}>
                <CheckCircle className="size-3.5" /> Approve
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-8 text-[12px] border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400" disabled={!!actionLoading} onClick={() => { setChangesNote(''); setShowChangesDialog(true) }}>
                <AlertCircle className="size-3.5" /> Request Changes
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-8 text-[12px] border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400" disabled={!!actionLoading} onClick={() => { setRejectNote(''); setShowRejectDialog(true) }}>
                <XCircle className="size-3.5" /> Reject
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-8 text-[12px] border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400" disabled={!!actionLoading} onClick={() => { setFlagReason(''); setShowFlagDialog(true) }}>
                <Flag className="size-3.5" /> Flag
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-xl h-8 text-[12px] gap-1">
                    <MoreHorizontal className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuItem onClick={() => { setAssignName(''); setShowAssignDialog(true) }}>
                    <UserPlus className="size-3.5 mr-2 text-sky-500" /> Assign Reviewer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleEscalate} disabled={!!actionLoading}>
                    <ArrowUpRight className="size-3.5 mr-2 text-amber-500" /> Escalate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { setNewAdminNote('') }}>
                    <StickyNote className="size-3.5 mr-2 text-violet-500" /> Add Note
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* ─── Loading State ─── */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="size-8 text-teal-500 animate-spin" />
          </div>
        ) : error ? (
          <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center gap-3">
                <AlertCircle className="size-10 text-red-400" />
                <p className="text-[15px] font-medium">Failed to load course details</p>
                <p className="text-[13px] text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={fetchCourseDetail}>
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : course ? (
          /* ─── Two-Column Layout ─── */
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* ─── Left Column (60%) ─── */}
            <div className="lg:col-span-3 space-y-6">
              {/* ─── Course Overview Card ─── */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, ...springTransition }}>
                <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-[16px] font-bold flex items-center gap-2">
                      <BookOpen className="size-4 text-teal-500" /> Course Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="size-[100px] rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/40 dark:to-emerald-900/40 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                        {course.thumbnail ? (
                          <img src={course.thumbnail} alt={course.title} className="size-full object-cover rounded-2xl" />
                        ) : (
                          <BookOpen className="size-12 text-teal-600 dark:text-teal-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <h2 className="text-[18px] font-bold leading-tight">{course.title}</h2>
                        <p className="text-[13px] text-muted-foreground line-clamp-3">{course.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-[11px] rounded-lg px-2 py-0.5 bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400">{course.category}</Badge>
                          <Badge variant="secondary" className="text-[11px] rounded-lg px-2 py-0.5">{course.level}</Badge>
                          <Badge variant="secondary" className="text-[11px] rounded-lg px-2 py-0.5 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 gap-1">
                            <Globe className="size-3" /> {course.language === 'en' ? 'English' : course.language === 'ur' ? 'Urdu' : course.language === 'ar' ? 'Arabic' : 'Multilingual'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    {/* Key info grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="flex items-center gap-2 text-[13px]">
                        <DollarSign className="size-4 text-emerald-500" />
                        <div>
                          <p className="text-muted-foreground text-[11px]">Price</p>
                          <p className="font-semibold">Rs {formatNumber(course.price)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[13px]">
                        <Clock className="size-4 text-sky-500" />
                        <div>
                          <p className="text-muted-foreground text-[11px]">Duration</p>
                          <p className="font-semibold">{formatDuration(course.estimatedDuration * 60 || course.totalDuration || 0)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[13px]">
                        <Award className="size-4 text-amber-500" />
                        <div>
                          <p className="text-muted-foreground text-[11px]">Certificate</p>
                          <p className="font-semibold">{course.certificateEnabled ? 'Enabled' : 'Disabled'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-[13px]">
                        <Calendar className="size-4 text-violet-500" />
                        <div>
                          <p className="text-muted-foreground text-[11px]">Submitted</p>
                          <p className="font-semibold">{timeAgo(course.submittedForReviewAt)}</p>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    {/* Instructor info */}
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10 rounded-xl">
                        <AvatarImage src={course.instructor.avatar || undefined} />
                        <AvatarFallback className="text-[11px] bg-primary/10 rounded-xl">{getInitials(course.instructor.name)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold">{course.instructor.name}</p>
                        <p className="text-[12px] text-muted-foreground truncate">{course.instructor.email}</p>
                        {course.instructor.instructorProfile?.headline && (
                          <p className="text-[12px] text-muted-foreground truncate">{course.instructor.instructorProfile.headline}</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-7 text-[11px] ml-auto shrink-0">
                        <ExternalLink className="size-3" /> View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* ─── Course Content Preview Card ─── */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, ...springTransition }}>
                <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-[16px] font-bold flex items-center gap-2">
                      <PlayCircle className="size-4 text-sky-500" /> Course Content
                      <Badge variant="secondary" className="text-[11px] rounded-lg px-2 py-0.5 font-normal">
                        {course._count.modules} modules · {course.totalLessons} lessons
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {course.modules.length === 0 ? (
                      <p className="text-[13px] text-muted-foreground text-center py-4">No modules created yet</p>
                    ) : (
                      <ScrollArea className="max-h-96">
                        <div className="space-y-2">
                          {course.modules.map((mod) => (
                            <Collapsible key={mod.id} open={expandedModules.has(mod.id)} onOpenChange={() => toggleModule(mod.id)}>
                              <CollapsibleTrigger asChild>
                                <button className="w-full flex items-center justify-between gap-2 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {expandedModules.has(mod.id) ? <ChevronUp className="size-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="size-4 shrink-0 text-muted-foreground" />}
                                    <span className="text-[13px] font-semibold truncate">{mod.title}</span>
                                    <Badge variant="secondary" className="text-[10px] rounded-lg px-1.5 py-0 shrink-0">
                                      {mod.lessons.length} lesson{mod.lessons.length !== 1 ? 's' : ''}
                                    </Badge>
                                    {!mod.isPublished && (
                                      <Badge className="text-[10px] rounded-lg px-1.5 py-0 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">Draft</Badge>
                                    )}
                                  </div>
                                </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="ml-6 space-y-1 mt-1 mb-2">
                                  {mod.lessons.sort((a, b) => a.order - b.order).map((lesson) => (
                                    <div key={lesson.id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors">
                                      {getLessonTypeIcon(lesson.type)}
                                      <span className="text-[12px] flex-1 truncate">{lesson.title}</span>
                                      <span className="text-[11px] text-muted-foreground">{formatDuration(lesson.duration)}</span>
                                      {lesson.isFree && (
                                        <Badge className="text-[9px] rounded-md px-1.5 py-0 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">Free</Badge>
                                      )}
                                      {!lesson.isPublished && (
                                        <Badge className="text-[9px] rounded-md px-1.5 py-0 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                          <Lock className="size-2.5" />
                                        </Badge>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* ─── Learning Objectives & Prerequisites Card ─── */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, ...springTransition }}>
                <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-[16px] font-bold flex items-center gap-2">
                      <Target className="size-4 text-amber-500" /> Learning Objectives & Prerequisites
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="text-[13px] font-semibold mb-2 flex items-center gap-1.5">
                        <Target className="size-3.5 text-teal-500" /> Learning Objectives
                      </h4>
                      {objectives.length === 0 ? (
                        <p className="text-[12px] text-muted-foreground italic">No learning objectives defined</p>
                      ) : (
                        <ul className="space-y-1">
                          {objectives.map((obj, i) => (
                            <li key={i} className="flex items-start gap-2 text-[13px]">
                              <CheckCircle className="size-3.5 text-teal-500 mt-0.5 shrink-0" />
                              <span>{obj}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <Separator />
                    <div>
                      <h4 className="text-[13px] font-semibold mb-2 flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-sky-500" /> Prerequisites
                      </h4>
                      {prerequisites.length === 0 ? (
                        <p className="text-[12px] text-muted-foreground italic">No prerequisites defined</p>
                      ) : (
                        <ul className="space-y-1">
                          {prerequisites.map((prereq, i) => (
                            <li key={i} className="flex items-start gap-2 text-[13px]">
                              <Info className="size-3.5 text-sky-500 mt-0.5 shrink-0" />
                              <span>{prereq}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {course.targetAudience && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-[13px] font-semibold mb-2 flex items-center gap-1.5">
                            <Users className="size-3.5 text-violet-500" /> Target Audience
                          </h4>
                          <p className="text-[13px] text-muted-foreground">{course.targetAudience}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* ─── Student Feedback Card ─── */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, ...springTransition }}>
                <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-[16px] font-bold flex items-center gap-2">
                      <Star className="size-4 text-amber-500" /> Student Feedback
                      <Badge variant="secondary" className="text-[11px] rounded-lg px-2 py-0.5 font-normal">
                        {course._count.reviews} review{course._count.reviews !== 1 ? 's' : ''}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {course.recentReviews.length === 0 ? (
                      <p className="text-[13px] text-muted-foreground text-center py-4">No student reviews yet</p>
                    ) : (
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {course.recentReviews.map((review) => (
                          <div key={review.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                            <Avatar className="size-8 rounded-lg shrink-0">
                              <AvatarImage src={review.user.avatar || undefined} />
                              <AvatarFallback className="text-[9px] bg-primary/10 rounded-lg">{getInitials(review.user.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-medium">{review.isAnonymous ? 'Anonymous' : review.user.name}</span>
                                <div className="flex items-center gap-0.5">
                                  {Array.from({ length: 5 }).map((_, si) => (
                                    <Star key={si} className={cn('size-3', si < review.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-600')} />
                                  ))}
                                </div>
                              </div>
                              {review.content && (
                                <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">{review.content}</p>
                              )}
                              <p className="text-[11px] text-muted-foreground mt-0.5">{timeAgo(review.createdAt)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* ─── Right Column (40%) ─── */}
            <div className="lg:col-span-2 space-y-6">
              {/* ─── Review Checklist Card ─── */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, ...springTransition }}>
                <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[16px] font-bold flex items-center gap-2">
                        <FileCheck className="size-4 text-teal-500" /> Review Checklist
                      </CardTitle>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-emerald-600 font-medium">{checklistStats.pass} pass</span>
                        <span className="text-amber-600 font-medium">{checklistStats.warn} warn</span>
                        <span className="text-red-600 font-medium">{checklistStats.fail} fail</span>
                      </div>
                    </div>
                    <Progress value={(checklistStats.pass / CHECKLIST_ITEMS.length) * 100} className="h-1.5 rounded-full" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {CHECKLIST_ITEMS.map((item) => {
                      const value = checklistState[item.key] || 'unset'
                      return (
                        <div key={item.key} className="flex items-center justify-between gap-2 p-2.5 rounded-xl hover:bg-muted/30 transition-colors">
                          <span className="text-[13px] font-medium min-w-0 truncate">{item.label}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {(['pass', 'warn', 'fail'] as const).map((state) => {
                              const isActive = value === state
                              const stateConfig = {
                                pass: { icon: <ThumbsUp className="size-3" />, class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800', activeClass: 'bg-emerald-500 text-white border-emerald-500' },
                                warn: { icon: <MinusCircle className="size-3" />, class: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300 dark:border-amber-800', activeClass: 'bg-amber-500 text-white border-amber-500' },
                                fail: { icon: <ThumbsDown className="size-3" />, class: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-300 dark:border-red-800', activeClass: 'bg-red-500 text-white border-red-500' },
                              }[state]
                              return (
                                <Tooltip key={state}>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => updateChecklistItem(item.key, isActive ? 'unset' : state)}
                                      className={cn(
                                        'flex items-center justify-center size-7 rounded-lg border transition-all',
                                        isActive ? stateConfig.activeClass : stateConfig.class
                                      )}
                                    >
                                      {stateConfig.icon}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>{state.charAt(0).toUpperCase() + state.slice(1)}</TooltipContent>
                                </Tooltip>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                    <Button className="w-full rounded-xl mt-3 bg-teal-600 hover:bg-teal-700 text-white gap-1.5" disabled={!!actionLoading} onClick={handleSaveChecklist}>
                      {actionLoading === 'save-checklist' ? <Loader2 className="size-4 animate-spin" /> : <FileCheck className="size-4" />}
                      Save Checklist
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* ─── AI Analysis Card ─── */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, ...springTransition }}>
                <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-[16px] font-bold flex items-center gap-2">
                      <Sparkles className="size-4 text-violet-500" /> AI Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!aiAnalysis && !aiLoading && (
                      <div className="flex flex-col items-center gap-3 py-4">
                        <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-950/40 dark:to-purple-950/40">
                          <Sparkles className="size-7 text-violet-500" />
                        </div>
                        <p className="text-[13px] text-muted-foreground text-center">Run an AI-powered analysis of this course to get quality insights and recommendations.</p>
                        <Button className="rounded-xl gap-1.5 bg-violet-600 hover:bg-violet-700 text-white" onClick={handleRunAiAnalysis}>
                          <Sparkles className="size-4" /> Run AI Analysis
                        </Button>
                      </div>
                    )}
                    {aiLoading && (
                      <div className="flex flex-col items-center gap-3 py-6">
                        <Loader2 className="size-8 text-violet-500 animate-spin" />
                        <p className="text-[13px] text-muted-foreground">Analyzing course content...</p>
                      </div>
                    )}
                    {aiAnalysis && !aiLoading && (
                      <div className="space-y-4">
                        {/* Overall Score */}
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20">
                          <CircularProgress value={aiAnalysis.overallScore} color="#8b5cf6" />
                          <div>
                            <p className="text-[14px] font-bold">Overall Score</p>
                            <p className="text-[12px] text-muted-foreground">AI quality assessment</p>
                          </div>
                        </div>
                        {/* Sub Scores */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 rounded-xl bg-muted/30 text-center">
                            <p className="text-[18px] font-bold text-teal-600">{aiAnalysis.contentQuality}</p>
                            <p className="text-[11px] text-muted-foreground">Content</p>
                          </div>
                          <div className="p-3 rounded-xl bg-muted/30 text-center">
                            <p className="text-[18px] font-bold text-sky-600">{aiAnalysis.structureAssessment}</p>
                            <p className="text-[11px] text-muted-foreground">Structure</p>
                          </div>
                          <div className="p-3 rounded-xl bg-muted/30 text-center">
                            <p className="text-[18px] font-bold text-amber-600">{aiAnalysis.pricingAssessment}</p>
                            <p className="text-[11px] text-muted-foreground">Pricing</p>
                          </div>
                        </div>
                        {/* Issues */}
                        {aiAnalysis.issues.length > 0 && (
                          <div>
                            <h4 className="text-[13px] font-semibold mb-2 flex items-center gap-1.5 text-red-600 dark:text-red-400">
                              <XCircle className="size-3.5" /> Issues ({aiAnalysis.issues.length})
                            </h4>
                            <ul className="space-y-1">
                              {aiAnalysis.issues.map((issue, i) => (
                                <li key={i} className="flex items-start gap-2 text-[12px] text-red-700 dark:text-red-300">
                                  <span className="text-red-400 mt-0.5">•</span>
                                  <span>{issue}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {/* Recommendations */}
                        {aiAnalysis.recommendations.length > 0 && (
                          <div>
                            <h4 className="text-[13px] font-semibold mb-2 flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
                              <Info className="size-3.5" /> Recommendations ({aiAnalysis.recommendations.length})
                            </h4>
                            <ul className="space-y-1">
                              {aiAnalysis.recommendations.map((rec, i) => (
                                <li key={i} className="flex items-start gap-2 text-[12px] text-sky-700 dark:text-sky-300">
                                  <span className="text-sky-400 mt-0.5">•</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {/* AI Suggested Decision */}
                        <div className="p-3 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/20">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">AI Suggested Decision</p>
                              <p className="text-[14px] font-bold mt-0.5 capitalize">{aiAnalysis.suggestedDecision.replace(/_/g, ' ')}</p>
                            </div>
                            <Badge className="text-[12px] rounded-lg px-2.5 py-0.5 bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400">
                              {aiAnalysis.confidence}% confidence
                            </Badge>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full rounded-xl gap-1.5" onClick={handleRunAiAnalysis} disabled={aiLoading}>
                          <Sparkles className="size-4" /> Re-run Analysis
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* ─── Review Notes Card ─── */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, ...springTransition }}>
                <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-[16px] font-bold flex items-center gap-2">
                      <MessageSquare className="size-4 text-orange-500" /> Review Note
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-[12px] text-muted-foreground">This note will be sent to the instructor.</p>
                    <Textarea
                      placeholder="Write a review note for the instructor..."
                      className="rounded-xl min-h-[80px] resize-none"
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                    />
                    <Button className="w-full rounded-xl gap-1.5 bg-orange-600 hover:bg-orange-700 text-white" disabled={!!actionLoading || !reviewNote.trim()} onClick={handleSaveReviewNote}>
                      {actionLoading === 'save-note' ? <Loader2 className="size-4 animate-spin" /> : <MessageSquare className="size-4" />}
                      Save Note
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* ─── Admin Notes Card ─── */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, ...springTransition }}>
                <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-[16px] font-bold flex items-center gap-2">
                      <StickyNote className="size-4 text-violet-500" /> Admin Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {adminNotes.length === 0 ? (
                      <p className="text-[12px] text-muted-foreground italic">No admin notes yet</p>
                    ) : (
                      <ScrollArea className="max-h-48">
                        <div className="space-y-2">
                          {adminNotes.map((note, i) => (
                            <div key={i} className="p-3 rounded-xl bg-muted/30 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[12px] font-medium">{note.adminName}</span>
                                <span className="text-[11px] text-muted-foreground">{formatDate(note.date)}</span>
                              </div>
                              <p className="text-[12px] text-muted-foreground">{note.note}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a note..."
                        className="rounded-xl h-9 text-[13px]"
                        value={newAdminNote}
                        onChange={(e) => setNewAdminNote(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && newAdminNote.trim()) handleAddAdminNote() }}
                      />
                      <Button size="sm" className="rounded-xl gap-1 shrink-0" disabled={!!actionLoading || !newAdminNote.trim()} onClick={handleAddAdminNote}>
                        {actionLoading === 'add-admin-note' ? <Loader2 className="size-3.5 animate-spin" /> : <StickyNote className="size-3.5" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* ─── Review History Card ─── */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, ...springTransition }}>
                <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-[16px] font-bold flex items-center gap-2">
                      <Clock className="size-4 text-sky-500" /> Review History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {course.reviewHistory.length === 0 ? (
                      <p className="text-[12px] text-muted-foreground italic">No review history</p>
                    ) : (
                      <ScrollArea className="max-h-64">
                        <div className="relative space-y-0">
                          {/* Timeline line */}
                          <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border" />
                          {course.reviewHistory.map((entry, i) => {
                            const conf = HISTORY_ACTION_CONFIG[entry.action] || HISTORY_ACTION_CONFIG.note_added
                            return (
                              <div key={entry.id || i} className="flex items-start gap-3 relative pl-1 py-2">
                                <div className="flex size-8 items-center justify-center rounded-full bg-card z-10 shrink-0 border shadow-sm">
                                  {conf.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={cn('text-[13px] font-medium', conf.colorClass)}>{conf.label}</p>
                                  {entry.reviewerName && (
                                    <p className="text-[11px] text-muted-foreground">by {entry.reviewerName}</p>
                                  )}
                                  {entry.note && (
                                    <p className="text-[12px] text-muted-foreground mt-0.5 line-clamp-2">{entry.note}</p>
                                  )}
                                  {(entry.previousStatus && entry.newStatus) && (
                                    <div className="flex items-center gap-1.5 mt-0.5 text-[11px]">
                                      <Badge variant="secondary" className="text-[10px] rounded-md px-1.5 py-0">
                                        {entry.previousStatus.replace(/_/g, ' ')}
                                      </Badge>
                                      <span>→</span>
                                      <Badge variant="secondary" className="text-[10px] rounded-md px-1.5 py-0">
                                        {entry.newStatus.replace(/_/g, ' ')}
                                      </Badge>
                                    </div>
                                  )}
                                  <p className="text-[11px] text-muted-foreground mt-0.5">{formatDateTime(entry.createdAt)}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        ) : null}
      </motion.div>

      {/* ─── Approve Dialog ─── */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="size-5 text-emerald-500" /> Approve Course
            </DialogTitle>
            <DialogDescription>This course will be approved and can be published to students.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder="Optional note to instructor..."
              className="rounded-xl min-h-[80px] resize-none"
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowApproveDialog(false)}>Cancel</Button>
            <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" disabled={!!actionLoading} onClick={handleApprove}>
              {actionLoading === 'approve' ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Reject Dialog ─── */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="size-5 text-red-500" /> Reject Course
            </DialogTitle>
            <DialogDescription>This course will be rejected. The instructor will be notified with your reason.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder="Reason for rejection (required)..."
              className="rounded-xl min-h-[80px] resize-none"
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button className="rounded-xl bg-red-600 hover:bg-red-700 text-white gap-1.5" disabled={!!actionLoading || !rejectNote.trim()} onClick={handleReject}>
              {actionLoading === 'reject' ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Request Changes Dialog ─── */}
      <Dialog open={showChangesDialog} onOpenChange={setShowChangesDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-orange-500" /> Request Changes
            </DialogTitle>
            <DialogDescription>Request changes to this course. The instructor will be notified.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder="Describe required changes (required)..."
              className="rounded-xl min-h-[80px] resize-none"
              value={changesNote}
              onChange={(e) => setChangesNote(e.target.value)}
            />
            {/* Checklist summary */}
            {checklistStats.fail > 0 && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20">
                <p className="text-[12px] font-semibold text-red-600 dark:text-red-400">{checklistStats.fail} checklist item(s) marked as fail:</p>
                <ul className="mt-1 space-y-0.5">
                  {CHECKLIST_ITEMS.filter(item => checklistState[item.key] === 'fail').map(item => (
                    <li key={item.key} className="text-[12px] text-red-600 dark:text-red-300">• {item.label}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowChangesDialog(false)}>Cancel</Button>
            <Button className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white gap-1.5" disabled={!!actionLoading || !changesNote.trim()} onClick={handleRequestChanges}>
              {actionLoading === 'request_changes' ? <Loader2 className="size-4 animate-spin" /> : <AlertCircle className="size-4" />}
              Request Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Flag Dialog ─── */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="size-5 text-rose-500" /> Flag Course
            </DialogTitle>
            <DialogDescription>Flag this course for further investigation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder="Reason for flagging (required)..."
              className="rounded-xl min-h-[80px] resize-none"
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowFlagDialog(false)}>Cancel</Button>
            <Button className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white gap-1.5" disabled={!!actionLoading || !flagReason.trim()} onClick={handleFlag}>
              {actionLoading === 'flag' ? <Loader2 className="size-4 animate-spin" /> : <Flag className="size-4" />}
              Flag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Assign Dialog ─── */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-5 text-sky-500" /> Assign Reviewer
            </DialogTitle>
            <DialogDescription>Assign this course to a specific reviewer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              placeholder="Reviewer name or ID..."
              className="rounded-xl h-10"
              value={assignName}
              onChange={(e) => setAssignName(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowAssignDialog(false)}>Cancel</Button>
            <Button className="rounded-xl bg-sky-600 hover:bg-sky-700 text-white gap-1.5" disabled={!!actionLoading || !assignName.trim()} onClick={handleAssign}>
              {actionLoading === 'assign' ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
