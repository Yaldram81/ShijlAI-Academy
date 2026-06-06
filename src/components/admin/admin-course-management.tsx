'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Search, Eye, Edit3, Ban, CheckCircle,
  XCircle, AlertTriangle, Clock, Shield, MoreHorizontal,
  ChevronLeft, ChevronRight, Star, MessageSquare,
  Trash2, DollarSign, Crown, Award, Activity,
  Loader2, AlertCircle, X, Send, GraduationCap, Zap,
  BarChart3, FileDown,
  Archive, ArchiveRestore,
  EyeOff, TrendingUp, Copy, Sparkles,
  LayoutGrid, List, RefreshCw, Users,
  Video, FileCheck, Flag, CircleDot, CircleSlash,
  CircleAlert, ThumbsUp, ThumbsDown, MinusCircle,
  LayoutList, Settings, StickyNote, PlayCircle,
  Lock, Globe, ArrowLeft, ChevronDown, Tag, Target, MapPin, Languages, Calendar, Info,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { useCurrency } from '@/components/admin/currency-provider'
import { CurrencyProvider } from '@/components/admin/currency-provider'
import { MobileFilterSheet, MobileFilterGroup } from '@/components/mobile-filter-sheet'

// ─── Types ──────────────────────────────────────────────────────────────────

interface CourseItem {
  id: string
  title: string
  description: string
  category: string
  level: string
  language: string
  thumbnail: string | null
  price: number
  overridePrice: number | null
  overridePriceUntil: string | null
  isPublished: boolean
  isArchived: boolean
  enrollmentCount: number
  rating: number
  featured: boolean
  staffPick: boolean
  reviewStatus: string
  ageRestriction: string
  regionRestricted: boolean
  flaggedReason: string | null
  submittedForReviewAt: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  instructor: { id: string; name: string; avatar: string | null; email: string }
  _count: { modules: number; enrollments: number }
}

interface CourseStats {
  total: number
  published: number
  underReview: number
  draft: number
  archived: number
  flagged: number
}

interface CourseDetail extends CourseItem {
  estimatedDuration: number
  certificateEnabled: boolean
  completionThreshold: number
  learningObjectives: string | null
  prerequisites: string | null
  targetAudience: string | null
  tags: string | null
  reviewNote: string | null
  reviewChecklist: Record<string, string> | null
  adminNotes: Array<{ note: string; adminName: string; date: string }> | null
  reviewedBy: string | null
  promoVideoUrl: string | null
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
  _count: { modules: number; enrollments: number; reviews: number; quizzes: number; assignments: number }
  totalDuration: number
  totalLessons: number
  recentReviews: Array<{ id: string; rating: number; content: string; isAnonymous: boolean; createdAt: string; user: { id: string; name: string; avatar: string | null } }>
  recentEnrollments: Array<{ id: string; progress: number; status: string; enrolledAt: string; user: { id: string; name: string; avatar: string | null } }>
  revenue: { total: number; platformFee: number; instructorEarning: number; transactionCount: number }
  analytics: { avgProgress: number; totalEnrollments: number; completedEnrollments: number; completionRate: number }
}

interface AnalyticsOverview {
  totalCourses: number
  publishedCourses: number
  draftCourses: number
  underReviewCourses: number
  archivedCourses: number
  flaggedCourses: number
  totalEnrollments: number
  totalRevenue: number
  platformFeeTotal: number
  avgRating: number
  avgCompletionRate: number
}

interface AnalyticsData {
  overview: AnalyticsOverview
  enrollmentTrend: Array<{ month: string; count: number }>
  categoryDistribution: Array<{ category: string; count: number }>
  topCourses: Array<{ id: string; title: string; enrollmentCount: number; rating: number; revenue: number }>
  revenueByMonth: Array<{ month: string; revenue: number; platformFee: number }>
  reviewQueueStats: { pendingReviews: number; avgReviewTime: number }
}

interface ToastItem {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatNumber(num: number): string {
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

function formatDuration(minutes: number): string {
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

// ─── Status Config ──────────────────────────────────────────────────────────

type CourseStatusKey = 'published' | 'under_review' | 'draft' | 'archived' | 'flagged' | 'rejected' | 'changes_requested'

function getCourseStatus(course: CourseItem): CourseStatusKey {
  if (course.isArchived) return 'archived'
  if (course.isPublished) return 'published'
  if (course.reviewStatus === 'under_review') return 'under_review'
  if (course.reviewStatus === 'rejected') return 'rejected'
  if (course.reviewStatus === 'changes_requested') return 'changes_requested'
  if (course.reviewStatus === 'flagged' || course.flaggedReason) return 'flagged'
  return 'draft'
}

const STATUS_CONFIG: Record<CourseStatusKey, { label: string; badgeClass: string; icon: React.ReactNode }> = {
  published: {
    label: 'Published',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    icon: <CheckCircle className="size-3.5 text-emerald-500" />,
  },
  under_review: {
    label: 'Under Review',
    badgeClass: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
    icon: <Clock className="size-3.5 text-sky-500 animate-pulse" />,
  },
  draft: {
    label: 'Draft',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
    icon: <Edit3 className="size-3.5 text-slate-400" />,
  },
  archived: {
    label: 'Archived',
    badgeClass: 'bg-slate-100 text-slate-500 line-through dark:bg-slate-800 dark:text-slate-500',
    icon: <Archive className="size-3.5 text-slate-400" />,
  },
  flagged: {
    label: 'Flagged',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    icon: <AlertTriangle className="size-3.5 text-amber-500" />,
  },
  rejected: {
    label: 'Rejected',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
    icon: <XCircle className="size-3.5 text-red-500" />,
  },
  changes_requested: {
    label: 'Changes Requested',
    badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
    icon: <AlertCircle className="size-3.5 text-orange-500" />,
  },
}

const CATEGORY_OPTIONS = [
  'IB', 'AP', 'Cambridge', 'IELTS', 'AWS', 'Programming',
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English',
  'Computer Science', 'General',
]

const LEVEL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced']

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'most_enrolled', label: 'Most Enrolled' },
  { value: 'highest_rated', label: 'Highest Rated' },
  { value: 'most_revenue', label: 'Most Revenue' },
  { value: 'title_asc', label: 'Title A-Z' },
  { value: 'title_desc', label: 'Title Z-A' },
]

const REVIEW_CHECKLIST_ITEMS = [
  { key: 'complete_description', label: 'Complete Description' },
  { key: 'video_quality', label: 'Video Content Quality' },
  { key: 'clear_objectives', label: 'Learning Objectives Clear' },
  { key: 'appropriate_pricing', label: 'Appropriate Pricing' },
  { key: 'no_plagiarism', label: 'No Plagiarism' },
  { key: 'proper_categorization', label: 'Proper Categorization' },
  { key: 'thumbnail_quality', label: 'Thumbnail Quality' },
] as const

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

// ─── Main Component ─────────────────────────────────────────────────────────

export function AdminCourseManagement() {
  const { currentUser } = useAppStore()
  const { formatAmount } = useCurrency()

  // ── State: Courses List ──
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [stats, setStats] = useState<CourseStats | null>(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── State: Analytics ──
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  // ── State: Filters ──
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [sortFilter, setSortFilter] = useState('newest')
  const [activeStatusTab, setActiveStatusTab] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [featuredFilter, setFeaturedFilter] = useState(false)
  const [staffPickFilter, setStaffPickFilter] = useState(false)

  // ── State: Selection ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // ── State: Detail Panel ──
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailCourse, setDetailCourse] = useState<CourseDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailTab, setDetailTab] = useState('overview')

  // ── State: Review Note ──
  const [reviewNote, setReviewNote] = useState('')

  // ── State: Review Checklist ──
  const [checklistState, setChecklistState] = useState<Record<string, string>>({})

  // ── State: Action loading ──
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // ── State: Override Form ──
  const [overrideForm, setOverrideForm] = useState({
    featured: false,
    staffPick: false,
    overridePrice: '' as string,
    overridePriceUntil: '' as string,
    ageRestriction: 'none',
    regionRestricted: false,
  })

  // ── State: Delete Confirm ──
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // ── State: Admin Note ──
  const [newAdminNote, setNewAdminNote] = useState('')

  // ── State: Expanded Modules (Content tab) ──
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  // ── State: Flag Dialog ──
  const [showFlagDialog, setShowFlagDialog] = useState(false)
  const [flagReason, setFlagReason] = useState('')
  const [flagCourseId, setFlagCourseId] = useState<string | null>(null)

  // ── State: Duplicate Dialog ──
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [duplicateCourseId, setDuplicateCourseId] = useState<string | null>(null)
  const [duplicateCourseTitle, setDuplicateCourseTitle] = useState('')

  // ── State: Toasts ──
  const [toasts, setToasts] = useState<ToastItem[]>([])

  // ── Refs ──
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // ── Toast Helpers ──
  const addToast = useCallback((type: ToastItem['type'], message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    setToasts(prev => [...prev, { id, type, message }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Auto-remove toasts after 3s
  useEffect(() => {
    if (toasts.length === 0) return
    const timer = setTimeout(() => {
      setToasts(prev => prev.slice(1))
    }, 3000)
    return () => clearTimeout(timer)
  }, [toasts])

  // ── Fetch Analytics ──
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    try {
      const res = await fetch('/api/admin/courses/analytics')
      if (!res.ok) throw new Error('Failed to fetch analytics')
      const data = await res.json()
      setAnalytics(data)
    } catch {
      // Silently fail analytics
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  // ── Fetch Courses ──
  const fetchCourses = useCallback(async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        search,
        status: statusFilter,
        category: categoryFilter,
        level: levelFilter,
        sort: sortFilter,
        ...(featuredFilter ? { featured: 'true' } : {}),
        ...(staffPickFilter ? { staff_pick: 'true' } : {}),
      })
      const res = await fetch(`/api/admin/courses?${params}`)
      if (!res.ok) throw new Error('Failed to fetch courses')
      const data = await res.json()
      setCourses(data.courses || [])
      setStats(data.stats || null)
      setPagination(data.pagination || { page, limit: 20, total: 0, totalPages: 0 })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, categoryFilter, levelFilter, sortFilter, featuredFilter, staffPickFilter])

  // ── Fetch Course Detail ──
  const fetchCourseDetail = useCallback(async (courseId: string) => {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`)
      if (!res.ok) throw new Error('Failed to fetch course details')
      const data = await res.json()
      setDetailCourse(data)
      setOverrideForm({
        featured: data.featured ?? false,
        staffPick: data.staffPick ?? false,
        overridePrice: data.overridePrice != null ? String(data.overridePrice) : '',
        overridePriceUntil: data.overridePriceUntil ? new Date(data.overridePriceUntil).toISOString().split('T')[0] : '',
        ageRestriction: data.ageRestriction || 'none',
        regionRestricted: data.regionRestricted ?? false,
      })
      setReviewNote(data.reviewNote || '')
      setNewAdminNote('')
      // Init checklist from existing or defaults
      const existing = data.reviewChecklist || {}
      const init: Record<string, string> = {}
      REVIEW_CHECKLIST_ITEMS.forEach(item => {
        init[item.key] = existing[item.key] || 'unset'
      })
      setChecklistState(init)
    } catch {
      setDetailCourse(null)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  // ── Effects ──
  useEffect(() => {
    fetchCourses(1)
  }, [fetchCourses])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // ── Debounced search ──
  const handleSearchChange = useCallback((value: string) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setSearch(value)
    }, 300)
  }, [])

  // ── Status tab click ──
  const handleStatusTabChange = useCallback((status: string) => {
    setActiveStatusTab(status)
    setStatusFilter(status)
  }, [])

  // ── Pagination ──
  const goToPage = useCallback((page: number) => {
    fetchCourses(page)
  }, [fetchCourses])

  // ── Selection ──
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === courses.length && courses.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(courses.map(c => c.id)))
    }
  }, [courses, selectedIds.size])

  // ── View Course Detail ──
  const handleViewCourse = useCallback((courseId: string) => {
    setDetailOpen(true)
    setDetailTab('overview')
    fetchCourseDetail(courseId)
  }, [fetchCourseDetail])

  // ── Review Action ──
  const handleReviewAction = useCallback(async (action: 'approve' | 'reject' | 'request_changes') => {
    if (!detailCourse) return
    if ((action === 'reject' || action === 'request_changes') && !reviewNote.trim()) {
      addToast('error', 'Please add a review note for this action')
      return
    }
    setActionLoading(`review-${action}`)
    try {
      const res = await fetch(`/api/admin/courses/${detailCourse.id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reviewNote: reviewNote.trim() || undefined }),
      })
      if (!res.ok) throw new Error(`Review action "${action}" failed`)
      addToast('success', `Course ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'changes requested'} successfully`)
      fetchCourseDetail(detailCourse.id)
      fetchCourses(pagination.page)
      fetchAnalytics()
    } catch {
      addToast('error', `Failed to ${action} course`)
    } finally {
      setActionLoading(null)
    }
  }, [detailCourse, reviewNote, fetchCourseDetail, fetchCourses, fetchAnalytics, pagination.page, addToast])

  // ── Save Checklist ──
  const handleSaveChecklist = useCallback(async () => {
    if (!detailCourse) return
    setActionLoading('save-checklist')
    try {
      const res = await fetch(`/api/admin/courses/${detailCourse.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_checklist', checklist: checklistState }),
      })
      if (!res.ok) throw new Error('Failed to save checklist')
      addToast('success', 'Review checklist saved')
      fetchCourseDetail(detailCourse.id)
    } catch {
      addToast('error', 'Failed to save checklist')
    } finally {
      setActionLoading(null)
    }
  }, [detailCourse, checklistState, fetchCourseDetail, addToast])

  // ── Update Overrides ──
  const handleUpdateOverrides = useCallback(async () => {
    if (!detailCourse) return
    setActionLoading('update-overrides')
    try {
      const body: Record<string, unknown> = { action: 'update_overrides' }
      body.featured = overrideForm.featured
      body.staffPick = overrideForm.staffPick
      body.overridePrice = overrideForm.overridePrice ? parseFloat(overrideForm.overridePrice) : null
      body.overridePriceUntil = overrideForm.overridePriceUntil || null
      body.ageRestriction = overrideForm.ageRestriction
      body.regionRestricted = overrideForm.regionRestricted
      const res = await fetch(`/api/admin/courses/${detailCourse.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to update overrides')
      addToast('success', 'Admin overrides updated')
      fetchCourseDetail(detailCourse.id)
      fetchCourses(pagination.page)
    } catch {
      addToast('error', 'Failed to update overrides')
    } finally {
      setActionLoading(null)
    }
  }, [detailCourse, overrideForm, fetchCourseDetail, fetchCourses, pagination.page, addToast])

  // ── Status Action ──
  const handleStatusAction = useCallback(async (status: string) => {
    if (!detailCourse) return
    if (status === 'delete') {
      setShowDeleteConfirm(true)
      setDeleteConfirmText('')
      return
    }
    setActionLoading(`status-${status}`)
    try {
      const res = await fetch(`/api/admin/courses/${detailCourse.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', status }),
      })
      if (!res.ok) throw new Error(`Status action "${status}" failed`)
      addToast('success', `Course ${status}ed successfully`)
      fetchCourseDetail(detailCourse.id)
      fetchCourses(pagination.page)
      fetchAnalytics()
    } catch {
      addToast('error', `Failed to ${status} course`)
    } finally {
      setActionLoading(null)
    }
  }, [detailCourse, fetchCourseDetail, fetchCourses, fetchAnalytics, pagination.page, addToast])

  // ── Confirm Hard Delete ──
  const handleConfirmDelete = useCallback(async () => {
    if (!detailCourse) return
    setActionLoading('delete-confirm')
    try {
      const res = await fetch(`/api/admin/courses/${detailCourse.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', status: 'delete' }),
      })
      if (!res.ok) throw new Error('Delete failed')
      addToast('success', 'Course deleted permanently')
      setShowDeleteConfirm(false)
      setDetailOpen(false)
      setDetailCourse(null)
      fetchCourses(pagination.page)
      fetchAnalytics()
    } catch {
      addToast('error', 'Failed to delete course')
    } finally {
      setActionLoading(null)
    }
  }, [detailCourse, fetchCourses, fetchAnalytics, pagination.page, addToast])

  // ── Bulk Action ──
  const handleBulkAction = useCallback(async (action: string) => {
    if (selectedIds.size === 0) return
    setActionLoading(`bulk-${action}`)
    try {
      const res = await fetch('/api/admin/courses/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseIds: Array.from(selectedIds), action }),
      })
      if (!res.ok) throw new Error(`Bulk action "${action}" failed`)
      addToast('success', `Bulk ${action} completed for ${selectedIds.size} course(s)`)
      setSelectedIds(new Set())
      fetchCourses(pagination.page)
      fetchAnalytics()
    } catch {
      addToast('error', `Bulk ${action} failed`)
    } finally {
      setActionLoading(null)
    }
  }, [selectedIds, fetchCourses, fetchAnalytics, pagination.page, addToast])

  // ── Export CSV ──
  const handleExport = useCallback(() => {
    const params = new URLSearchParams({
      status: statusFilter,
      search,
      category: categoryFilter,
      level: levelFilter,
    })
    window.open(`/api/admin/courses/export?${params}`, '_blank')
    addToast('info', 'CSV export started')
  }, [statusFilter, search, categoryFilter, levelFilter, addToast])

  // ── Add Admin Note ──
  const handleAddNote = useCallback(async () => {
    if (!newAdminNote.trim() || !detailCourse) return
    setActionLoading('add-note')
    try {
      const res = await fetch(`/api/admin/courses/${detailCourse.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_note',
          note: newAdminNote.trim(),
          adminName: currentUser?.name || 'Admin',
        }),
      })
      if (!res.ok) throw new Error('Failed to add note')
      addToast('success', 'Note added')
      setNewAdminNote('')
      fetchCourseDetail(detailCourse.id)
    } catch {
      addToast('error', 'Failed to add note')
    } finally {
      setActionLoading(null)
    }
  }, [newAdminNote, detailCourse, currentUser?.name, fetchCourseDetail, addToast])

  // ── Flag Course ──
  const handleFlagCourse = useCallback(async () => {
    if (!flagCourseId || !flagReason.trim()) return
    setActionLoading('flag')
    try {
      const res = await fetch(`/api/admin/courses/${flagCourseId}/flag`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'flag', reason: flagReason.trim(), adminName: currentUser?.name || 'Admin' }),
      })
      if (!res.ok) throw new Error('Flag failed')
      addToast('success', 'Course flagged')
      setShowFlagDialog(false)
      setFlagReason('')
      setFlagCourseId(null)
      fetchCourses(pagination.page)
      fetchAnalytics()
      if (detailCourse?.id === flagCourseId) fetchCourseDetail(flagCourseId)
    } catch {
      addToast('error', 'Failed to flag course')
    } finally {
      setActionLoading(null)
    }
  }, [flagCourseId, flagReason, currentUser?.name, fetchCourses, fetchAnalytics, detailCourse, fetchCourseDetail, addToast])

  // ── Unflag Course ──
  const handleUnflagCourse = useCallback(async (courseId: string) => {
    setActionLoading('unflag')
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/flag`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unflag', reason: '', adminName: currentUser?.name || 'Admin' }),
      })
      if (!res.ok) throw new Error('Unflag failed')
      addToast('success', 'Course unflagged')
      fetchCourses(pagination.page)
      fetchAnalytics()
      if (detailCourse?.id === courseId) fetchCourseDetail(courseId)
    } catch {
      addToast('error', 'Failed to unflag course')
    } finally {
      setActionLoading(null)
    }
  }, [currentUser?.name, fetchCourses, fetchAnalytics, detailCourse, fetchCourseDetail, addToast])

  // ── Duplicate Course ──
  const handleDuplicateCourse = useCallback(async () => {
    if (!duplicateCourseId) return
    setActionLoading('duplicate')
    try {
      const res = await fetch(`/api/admin/courses/${duplicateCourseId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('Duplicate failed')
      addToast('success', 'Course duplicated successfully')
      setShowDuplicateDialog(false)
      setDuplicateCourseId(null)
      setDuplicateCourseTitle('')
      fetchCourses(pagination.page)
      fetchAnalytics()
    } catch {
      addToast('error', 'Failed to duplicate course')
    } finally {
      setActionLoading(null)
    }
  }, [duplicateCourseId, fetchCourses, fetchAnalytics, addToast])

  // ── Quick Row Action ──
  const handleQuickAction = useCallback(async (courseId: string, action: string, courseTitle?: string) => {
    if (action === 'view') {
      handleViewCourse(courseId)
      return
    }
    if (action === 'flag') {
      setFlagCourseId(courseId)
      setFlagReason('')
      setShowFlagDialog(true)
      return
    }
    if (action === 'unflag') {
      handleUnflagCourse(courseId)
      return
    }
    if (action === 'duplicate') {
      setDuplicateCourseId(courseId)
      setDuplicateCourseTitle(courseTitle || 'this course')
      setShowDuplicateDialog(true)
      return
    }
    setActionLoading(`${courseId}-${action}`)
    try {
      if (action === 'feature' || action === 'unfeature') {
        const res = await fetch(`/api/admin/courses/${courseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_overrides', featured: action === 'feature' }),
        })
        if (!res.ok) throw new Error('Action failed')
        addToast('success', `Course ${action === 'feature' ? 'featured' : 'unfeatured'}`)
      } else if (action === 'publish' || action === 'unpublish' || action === 'archive' || action === 'unarchive') {
        const res = await fetch(`/api/admin/courses/${courseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_status', status: action }),
        })
        if (!res.ok) throw new Error('Action failed')
        addToast('success', `Course ${action}ed`)
      }
      fetchCourses(pagination.page)
      fetchAnalytics()
    } catch {
      addToast('error', 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }, [handleViewCourse, handleUnflagCourse, fetchCourses, fetchAnalytics, pagination.page, addToast])

  // ── Status tabs data ──
  const statusTabs = [
    { key: 'all', label: 'All', count: stats?.total ?? 0 },
    { key: 'published', label: 'Published', count: stats?.published ?? 0 },
    { key: 'under_review', label: 'Under Review', count: stats?.underReview ?? 0 },
    { key: 'draft', label: 'Draft', count: stats?.draft ?? 0 },
    { key: 'archived', label: 'Archived', count: stats?.archived ?? 0 },
    { key: 'flagged', label: 'Flagged', count: stats?.flagged ?? 0 },
  ]

  // ── Computed: Analytics overview ──
  const ov = analytics?.overview

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

      <AnimatePresence mode="wait">
        {detailOpen ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={springTransition}
            className="space-y-6"
          >
            {/* ─── Top Bar: Back + Actions ─── */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => { setDetailOpen(false); setDetailCourse(null); }}>
                <ArrowLeft className="size-4" />
                Back to Courses
              </Button>
              {detailCourse && (
                <div className="flex items-center gap-2 flex-wrap">
                  {!detailCourse.isPublished && (
                    <Button size="sm" className="rounded-xl gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-[12px]" disabled={!!actionLoading?.startsWith('status')} onClick={() => handleStatusAction('publish')}>
                      <CheckCircle className="size-3.5" /> Publish
                    </Button>
                  )}
                  {detailCourse.isPublished && (
                    <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-8 text-[12px]" disabled={!!actionLoading?.startsWith('status')} onClick={() => handleStatusAction('unpublish')}>
                      <EyeOff className="size-3.5" /> Unpublish
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-8 text-[12px]" disabled={!!actionLoading?.startsWith('status')} onClick={() => handleStatusAction(detailCourse.isArchived ? 'unarchive' : 'archive')}>
                    {detailCourse.isArchived ? <><ArchiveRestore className="size-3.5" /> Unarchive</> : <><Archive className="size-3.5" /> Archive</>}
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-8 text-[12px]" disabled={!!actionLoading} onClick={() => handleQuickAction(detailCourse.id, 'duplicate', detailCourse.title)}>
                    <Copy className="size-3.5" /> Duplicate
                  </Button>
                  {!detailCourse.flaggedReason ? (
                    <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-8 text-[12px] border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400" disabled={!!actionLoading} onClick={() => handleQuickAction(detailCourse.id, 'flag', detailCourse.title)}>
                      <Flag className="size-3.5" /> Flag
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-8 text-[12px]" disabled={!!actionLoading} onClick={() => handleUnflagCourse(detailCourse.id)}>
                      <Flag className="size-3.5" /> Unflag
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-8 text-[12px] border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30" disabled={!!actionLoading} onClick={() => handleStatusAction('delete')}>
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </div>
              )}
            </div>

            {/* ─── Detail Content ─── */}
            {detailLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="size-8 text-teal-500 animate-spin" />
              </div>
            ) : detailCourse ? (
              <div className="space-y-6">
                {/* ─── Hero Banner ─── */}
                <div className="flex items-start gap-6 p-6 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 border shadow-sm">
                  <div className="size-[120px] rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/40 dark:to-emerald-900/40 flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                    {detailCourse.thumbnail ? (
                      <img src={detailCourse.thumbnail} alt={detailCourse.title} className="size-full object-cover rounded-2xl" />
                    ) : (
                      <BookOpen className="size-14 text-teal-600 dark:text-teal-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-3">
                    <h1 className="text-2xl font-bold leading-tight">{detailCourse.title}</h1>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Avatar className="size-8 rounded-lg">
                        <AvatarImage src={detailCourse.instructor.avatar || undefined} />
                        <AvatarFallback className="text-[10px] bg-primary/10 rounded-lg">{getInitials(detailCourse.instructor.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium">{detailCourse.instructor.name}</span>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          {detailCourse.instructor.instructorProfile?.headline && <span className="truncate max-w-[200px]">{detailCourse.instructor.instructorProfile.headline}</span>}
                          {detailCourse.instructor.instructorProfile?.headline && <span>·</span>}
                          <span>{detailCourse.instructor.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Meta Badges Row */}
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const status = getCourseStatus(detailCourse)
                        const conf = STATUS_CONFIG[status]
                        return <Badge className={cn("text-[12px] rounded-lg px-2.5 py-0.5 gap-1 font-medium", conf.badgeClass)}>{conf.icon} {conf.label}</Badge>
                      })()}
                      <Badge variant="secondary" className="text-[11px] rounded-lg px-2 py-0.5 bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400">
                        {detailCourse.category}
                      </Badge>
                      <Badge variant="secondary" className="text-[11px] rounded-lg px-2 py-0.5">
                        {detailCourse.level}
                      </Badge>
                      {detailCourse.featured && <Badge className="text-[11px] rounded-lg px-2 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 gap-0.5"><Star className="size-3 fill-amber-500" /> Featured</Badge>}
                      {detailCourse.staffPick && <Badge className="text-[11px] rounded-lg px-2 py-0.5 bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 gap-0.5"><Award className="size-3" /> Staff Pick</Badge>}
                      {detailCourse.flaggedReason && <Badge className="text-[11px] rounded-lg px-2 py-0.5 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 gap-0.5"><AlertTriangle className="size-3" /> Flagged</Badge>}
                    </div>

                    {/* Description */}
                    {detailCourse.description && (
                      <p className="text-[13px] text-muted-foreground line-clamp-2 leading-relaxed">{detailCourse.description}</p>
                    )}

                    {/* Meta Row */}
                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap">
                      {detailCourse.language && <span className="flex items-center gap-1"><Languages className="size-3" /> {detailCourse.language}</span>}
                      {detailCourse.certificateEnabled && <span className="flex items-center gap-1"><Award className="size-3 text-emerald-500" /> Certificate</span>}
                      <span className="flex items-center gap-1"><Calendar className="size-3" /> Created {formatDate(detailCourse.createdAt)}</span>
                      <span className="flex items-center gap-1"><Clock className="size-3" /> Updated {timeAgo(detailCourse.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* ─── Stats Row: 5 cards ─── */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {/* Students */}
                  <Card className="rounded-2xl shadow-sm border-l-4 border-l-teal-500 border-y border-r">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1">
                        <Users className="size-3.5 text-teal-500" /> Students
                      </div>
                      <p className="text-[22px] font-bold">{formatNumber(detailCourse.enrollmentCount || detailCourse._count.enrollments)}</p>
                      <p className="text-[10px] text-muted-foreground">enrolled</p>
                    </CardContent>
                  </Card>
                  {/* Revenue */}
                  <Card className="rounded-2xl shadow-sm border-l-4 border-l-emerald-500 border-y border-r">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1">
                        <DollarSign className="size-3.5 text-emerald-500" /> Revenue
                      </div>
                      <p className="text-[22px] font-bold">{formatAmount(detailCourse.revenue?.total || 0)}</p>
                      <p className="text-[10px] text-muted-foreground">total earned</p>
                    </CardContent>
                  </Card>
                  {/* Rating */}
                  <Card className="rounded-2xl shadow-sm border-l-4 border-l-amber-500 border-y border-r">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1">
                        <Star className="size-3.5 text-amber-500" /> Rating
                      </div>
                      <p className="text-[22px] font-bold flex items-center gap-1.5">
                        {detailCourse.rating > 0 ? <>{detailCourse.rating.toFixed(1)} <Star className="size-4 text-amber-500 fill-amber-500" /></> : '—'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">average</p>
                    </CardContent>
                  </Card>
                  {/* Progress */}
                  <Card className="rounded-2xl shadow-sm border-l-4 border-l-sky-500 border-y border-r">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1">
                        <TrendingUp className="size-3.5 text-sky-500" /> Progress
                      </div>
                      <p className="text-[22px] font-bold">{Math.round(detailCourse.analytics?.avgProgress || 0)}%</p>
                      <Progress value={Math.round(detailCourse.analytics?.avgProgress || 0)} className="h-1.5 mt-1" />
                    </CardContent>
                  </Card>
                  {/* Content */}
                  <Card className="rounded-2xl shadow-sm border-l-4 border-l-violet-500 border-y border-r">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1">
                        <BookOpen className="size-3.5 text-violet-500" /> Content
                      </div>
                      <p className="text-[22px] font-bold">{detailCourse._count.modules}</p>
                      <p className="text-[10px] text-muted-foreground">{detailCourse.totalLessons || 0} lessons · {formatDuration(detailCourse.totalDuration || detailCourse.estimatedDuration || 0)}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* ─── Two-Column Layout: Main + Sidebar ─── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* ─── Main Column (2/3) ─── */}
                  <div className="lg:col-span-2">
                    <Tabs value={detailTab} onValueChange={setDetailTab} className="w-full">
                      <div className="border-b">
                        <TabsList className="bg-transparent h-10 p-0 gap-0 w-full justify-start">
                          <TabsTrigger value="overview" className="rounded-b-none text-[12px] px-4 data-[state=active]:border-b-2 data-[state=active]:border-teal-500 data-[state=active]:shadow-none">Overview</TabsTrigger>
                          <TabsTrigger value="content" className="rounded-b-none text-[12px] px-4 data-[state=active]:border-b-2 data-[state=active]:border-teal-500 data-[state=active]:shadow-none">Content</TabsTrigger>
                          <TabsTrigger value="analytics" className="rounded-b-none text-[12px] px-4 data-[state=active]:border-b-2 data-[state=active]:border-teal-500 data-[state=active]:shadow-none">Analytics</TabsTrigger>
                          <TabsTrigger value="activity" className="rounded-b-none text-[12px] px-4 data-[state=active]:border-b-2 data-[state=active]:border-teal-500 data-[state=active]:shadow-none">Activity</TabsTrigger>
                        </TabsList>
                      </div>

                      {/* ── Tab: Overview ── */}
                      <TabsContent value="overview" className="p-4 space-y-6 m-0">
                        {/* Course Description */}
                        {detailCourse.description && (
                          <div className="space-y-2">
                            <h4 className="text-[13px] font-semibold flex items-center gap-2"><Info className="size-4 text-teal-500" /> Description</h4>
                            <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-line">{detailCourse.description}</p>
                          </div>
                        )}

                        {/* Learning Objectives */}
                        {detailCourse.learningObjectives && (
                          <div className="space-y-2">
                            <h4 className="text-[13px] font-semibold flex items-center gap-2"><Target className="size-4 text-teal-500" /> Learning Objectives</h4>
                            <ul className="space-y-1.5">
                              {(typeof detailCourse.learningObjectives === 'string' ? JSON.parse(detailCourse.learningObjectives) : detailCourse.learningObjectives).map((obj: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                                  <CheckCircle className="size-3.5 text-teal-500 mt-0.5 shrink-0" />
                                  <span>{obj}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Prerequisites */}
                        {detailCourse.prerequisites && (
                          <div className="space-y-2">
                            <h4 className="text-[13px] font-semibold flex items-center gap-2"><AlertCircle className="size-4 text-amber-500" /> Prerequisites</h4>
                            <ul className="space-y-1.5">
                              {(typeof detailCourse.prerequisites === 'string' ? JSON.parse(detailCourse.prerequisites) : detailCourse.prerequisites).map((pre: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                                  <Clock className="size-3.5 text-amber-500 mt-0.5 shrink-0" />
                                  <span>{pre}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Target Audience */}
                        {detailCourse.targetAudience && (
                          <div className="space-y-2">
                            <h4 className="text-[13px] font-semibold flex items-center gap-2"><MapPin className="size-4 text-violet-500" /> Target Audience</h4>
                            <p className="text-[13px] text-muted-foreground">{detailCourse.targetAudience}</p>
                          </div>
                        )}

                        {/* Tags */}
                        {detailCourse.tags && (
                          <div className="space-y-2">
                            <h4 className="text-[13px] font-semibold flex items-center gap-2"><Tag className="size-4 text-teal-500" /> Tags</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {(typeof detailCourse.tags === 'string' ? JSON.parse(detailCourse.tags) : detailCourse.tags).map((tag: string, i: number) => (
                                <Badge key={i} variant="secondary" className="text-[11px] rounded-lg px-2 py-0.5">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      {/* ── Tab: Content (Collapsible Modules) ── */}
                      <TabsContent value="content" className="p-4 space-y-4 m-0">
                        <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
                          <span className="flex items-center gap-1"><BookOpen className="size-3" /> {detailCourse._count.modules} modules</span>
                          <span className="flex items-center gap-1"><PlayCircle className="size-3" /> {detailCourse.totalLessons || detailCourse._count.modules} lessons</span>
                          <span className="flex items-center gap-1"><Clock className="size-3" /> {formatDuration(detailCourse.totalDuration || detailCourse.estimatedDuration || 0)}</span>
                        </div>

                        {detailCourse.modules && detailCourse.modules.length > 0 ? (
                          <div className="space-y-2">
                            {detailCourse.modules.map((mod) => {
                              const isExpanded = expandedModules.has(mod.id)
                              return (
                                <div key={mod.id} className="rounded-xl border bg-card overflow-hidden">
                                  <button
                                    className="flex items-center justify-between p-3.5 w-full text-left hover:bg-muted/30 transition-colors"
                                    onClick={() => setExpandedModules(prev => {
                                      const next = new Set(prev)
                                      if (next.has(mod.id)) next.delete(mod.id)
                                      else next.add(mod.id)
                                      return next
                                    })}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className={cn(
                                        "size-7 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0",
                                        mod.isPublished ? "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                      )}>
                                        {mod.order}
                                      </div>
                                      <span className="text-[13px] font-medium truncate">{mod.title}</span>
                                      {!mod.isPublished && <Badge variant="secondary" className="text-[9px] h-4 px-1">Draft</Badge>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] text-muted-foreground">{mod.lessons.length} lessons</span>
                                      {isExpanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                                    </div>
                                  </button>
                                  {isExpanded && mod.lessons.length > 0 && (
                                    <div className="border-t divide-y bg-muted/10">
                                      {mod.lessons.map((lesson) => (
                                        <div key={lesson.id} className="flex items-center gap-3 px-4 py-2.5 text-[12px]">
                                          {getLessonTypeIcon(lesson.type)}
                                          <span className="flex-1 truncate">{lesson.title}</span>
                                          {lesson.isFree && <Badge className="text-[9px] h-4 px-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">Free</Badge>}
                                          <span className="text-muted-foreground">{formatDuration(lesson.duration)}</span>
                                          {!lesson.isPublished && <EyeOff className="size-3 text-muted-foreground" />}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center py-8 gap-2 text-muted-foreground">
                            <BookOpen className="size-8 opacity-30" />
                            <p className="text-[13px]">No modules yet</p>
                          </div>
                        )}
                      </TabsContent>

                      {/* ── Tab: Analytics ── */}
                      <TabsContent value="analytics" className="p-4 space-y-5 m-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Revenue Card */}
                          <Card className="rounded-2xl border-0 shadow-sm">
                            <CardContent className="p-4">
                              <h4 className="text-[13px] font-semibold mb-3 flex items-center gap-2">
                                <DollarSign className="size-4 text-teal-500" /> Revenue Breakdown
                              </h4>
                              <div className="grid grid-cols-3 gap-3">
                                <div className="text-center p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                                  <p className="text-[16px] font-bold text-emerald-600 dark:text-emerald-400">{formatAmount(detailCourse.revenue?.total || 0)}</p>
                                  <p className="text-[10px] text-muted-foreground">Total</p>
                                </div>
                                <div className="text-center p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30">
                                  <p className="text-[16px] font-bold text-amber-600 dark:text-amber-400">{formatAmount(detailCourse.revenue?.platformFee || 0)}</p>
                                  <p className="text-[10px] text-muted-foreground">Platform Fee</p>
                                </div>
                                <div className="text-center p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30">
                                  <p className="text-[16px] font-bold text-sky-600 dark:text-sky-400">{formatAmount(detailCourse.revenue?.instructorEarning || 0)}</p>
                                  <p className="text-[10px] text-muted-foreground">Instructor</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Enrollment Stats */}
                          <Card className="rounded-2xl border-0 shadow-sm">
                            <CardContent className="p-4">
                              <h4 className="text-[13px] font-semibold mb-3 flex items-center gap-2">
                                <Users className="size-4 text-teal-500" /> Enrollment Stats
                              </h4>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-2.5 rounded-xl bg-muted/30">
                                  <p className="text-[18px] font-bold">{detailCourse.analytics?.totalEnrollments || 0}</p>
                                  <p className="text-[10px] text-muted-foreground">Total Enrollments</p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-muted/30">
                                  <p className="text-[18px] font-bold text-emerald-600">{detailCourse.analytics?.completedEnrollments || 0}</p>
                                  <p className="text-[10px] text-muted-foreground">Completed</p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-muted/30">
                                  <p className="text-[18px] font-bold">{Math.round(detailCourse.analytics?.avgProgress || 0)}%</p>
                                  <p className="text-[10px] text-muted-foreground">Avg Progress</p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-muted/30">
                                  <p className="text-[18px] font-bold">{Math.round(detailCourse.analytics?.completionRate || 0)}%</p>
                                  <p className="text-[10px] text-muted-foreground">Completion Rate</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Recent Enrollments */}
                          <div className="space-y-2">
                            <h4 className="text-[13px] font-semibold">Recent Enrollments</h4>
                            {detailCourse.recentEnrollments && detailCourse.recentEnrollments.length > 0 ? (
                              <div className="space-y-2 max-h-80 overflow-y-auto">
                                {detailCourse.recentEnrollments.map((enr) => (
                                  <div key={enr.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30">
                                    <Avatar className="size-7 rounded-lg shrink-0">
                                      <AvatarImage src={enr.user.avatar || undefined} />
                                      <AvatarFallback className="text-[9px] bg-primary/10 rounded-lg">{getInitials(enr.user.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[12px] font-medium truncate">{enr.user.name}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <Progress value={enr.progress} className="h-1 flex-1" />
                                        <span className="text-[10px] text-muted-foreground">{enr.progress}%</span>
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <Badge variant="secondary" className="text-[9px] h-4 px-1">{enr.status}</Badge>
                                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(enr.enrolledAt)}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[12px] text-muted-foreground text-center py-4">No enrollments yet</p>
                            )}
                          </div>

                          {/* Recent Reviews */}
                          <div className="space-y-2">
                            <h4 className="text-[13px] font-semibold">Recent Reviews</h4>
                            {detailCourse.recentReviews && detailCourse.recentReviews.length > 0 ? (
                              <div className="space-y-2 max-h-80 overflow-y-auto">
                                {detailCourse.recentReviews.map((rev) => (
                                  <div key={rev.id} className="p-2.5 rounded-xl bg-muted/30 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5">
                                        <Avatar className="size-5 rounded-md">
                                          <AvatarImage src={rev.user.avatar || undefined} />
                                          <AvatarFallback className="text-[7px] bg-primary/10 rounded-md">{getInitials(rev.user.name)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-[11px] font-medium">{rev.isAnonymous ? 'Anonymous' : rev.user.name}</span>
                                      </div>
                                      <div className="flex items-center gap-0.5">
                                        {Array.from({ length: 5 }).map((_, si) => (
                                          <Star key={si} className={cn("size-2.5", si < rev.rating ? "text-amber-500 fill-amber-500" : "text-slate-200")} />
                                        ))}
                                      </div>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground line-clamp-2">{rev.content}</p>
                                    <p className="text-[9px] text-muted-foreground">{formatDate(rev.createdAt)}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[12px] text-muted-foreground text-center py-4">No reviews yet</p>
                            )}
                          </div>
                        </div>
                      </TabsContent>

                      {/* ── Tab: Activity (Notes Timeline) ── */}
                      <TabsContent value="activity" className="p-4 space-y-5 m-0">
                        {/* Add Note */}
                        <div className="space-y-2">
                          <h4 className="text-[13px] font-semibold flex items-center gap-2">
                            <StickyNote className="size-4 text-teal-500" /> Add Note
                          </h4>
                          <div className="flex gap-2">
                            <Textarea
                              placeholder="Write an admin note... (Ctrl+Enter to send)"
                              className="rounded-xl text-[12px] min-h-[60px] flex-1"
                              value={newAdminNote}
                              onChange={(e) => setNewAdminNote(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddNote()
                              }}
                            />
                            <Button
                              size="sm"
                              className="rounded-xl gap-1 bg-teal-500 hover:bg-teal-600 text-white self-end"
                              disabled={!!actionLoading || !newAdminNote.trim()}
                              onClick={handleAddNote}
                            >
                              {actionLoading === 'add-note' ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                            </Button>
                          </div>
                        </div>

                        {/* Notes Timeline */}
                        <div className="space-y-3">
                          <h4 className="text-[13px] font-semibold">Notes History</h4>
                          {detailCourse.adminNotes && detailCourse.adminNotes.length > 0 ? (
                            <div className="relative pl-6 space-y-4 max-h-[500px] overflow-y-auto">
                              {/* Timeline line */}
                              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-teal-200 dark:bg-teal-800/40" />
                              {detailCourse.adminNotes.map((note, idx) => (
                                <div key={idx} className="relative flex gap-3">
                                  {/* Timeline dot */}
                                  <div className="absolute -left-6 top-3 size-3 rounded-full bg-teal-500 border-2 border-white dark:border-background z-10" />
                                  <div className="flex-1 p-3 rounded-xl bg-muted/30 border">
                                    <p className="text-[13px] leading-relaxed">{note.note}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="text-[11px] font-medium text-teal-600 dark:text-teal-400">{note.adminName}</span>
                                      <span className="text-[11px] text-muted-foreground">{formatDateTime(note.date)}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[12px] text-muted-foreground text-center py-4">No notes yet</p>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  {/* ─── Sidebar (1/3) ─── */}
                  <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
                    {/* Review & Approval Card */}
                    {(detailCourse.reviewStatus === 'under_review' || detailCourse.reviewStatus === 'changes_requested' || detailCourse.reviewStatus === 'rejected') && (
                      <Card className="rounded-2xl shadow-sm">
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-[13px] font-semibold flex items-center gap-2">
                            <Shield className="size-4 text-teal-500" /> Review & Approval
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-3">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const status = getCourseStatus(detailCourse)
                              const conf = STATUS_CONFIG[status]
                              return (
                                <>
                                  <div className={cn("size-2.5 rounded-full", status === 'under_review' ? 'bg-sky-500 animate-pulse' : status === 'changes_requested' ? 'bg-orange-500' : 'bg-red-500')} />
                                  <span className="text-[12px] font-medium">{conf.label}</span>
                                </>
                              )
                            })()}
                          </div>
                          <Textarea
                            placeholder="Add review note..."
                            className="rounded-xl text-[12px] min-h-[70px]"
                            value={reviewNote}
                            onChange={(e) => setReviewNote(e.target.value)}
                          />
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              className="rounded-xl gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white w-full"
                              disabled={!!actionLoading}
                              onClick={() => handleReviewAction('approve')}
                            >
                              {actionLoading === 'review-approve' ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle className="size-3.5" />}
                              Approve
                            </Button>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl gap-1.5 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
                                disabled={!!actionLoading || !reviewNote.trim()}
                                onClick={() => handleReviewAction('reject')}
                              >
                                {actionLoading === 'review-reject' ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5" />}
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-xl gap-1.5 text-orange-600 border-orange-200 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950/30"
                                disabled={!!actionLoading || !reviewNote.trim()}
                                onClick={() => handleReviewAction('request_changes')}
                              >
                                {actionLoading === 'review-request_changes' ? <Loader2 className="size-3.5 animate-spin" /> : <AlertCircle className="size-3.5" />}
                                Changes
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Review Checklist Card */}
                    <Card className="rounded-2xl shadow-sm">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-[13px] font-semibold flex items-center gap-2">
                            <FileCheck className="size-4 text-teal-500" /> Review Checklist
                          </CardTitle>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl gap-1.5 h-7 text-[11px]"
                            disabled={!!actionLoading}
                            onClick={handleSaveChecklist}
                          >
                            {actionLoading === 'save-checklist' ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle className="size-3" />}
                            Save
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-2">
                        {REVIEW_CHECKLIST_ITEMS.map((item) => {
                          const current = checklistState[item.key] || 'unset'
                          return (
                            <div key={item.key} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                              <span className="text-[12px] font-medium">{item.label}</span>
                              <div className="flex gap-1">
                                {(['pass', 'warn', 'fail', 'unset'] as const).map((state) => (
                                  <button
                                    key={state}
                                    onClick={() => setChecklistState(prev => ({ ...prev, [item.key]: state }))}
                                    className={cn(
                                      'size-7 rounded-md flex items-center justify-center transition-all',
                                      current === state ? 'ring-2 ring-offset-1' : 'opacity-40 hover:opacity-70',
                                      state === 'pass' && 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
                                      state === 'pass' && current === state && 'ring-emerald-500',
                                      state === 'warn' && 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
                                      state === 'warn' && current === state && 'ring-amber-500',
                                      state === 'fail' && 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400',
                                      state === 'fail' && current === state && 'ring-red-500',
                                      state === 'unset' && 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
                                      state === 'unset' && current === state && 'ring-slate-400',
                                    )}
                                    title={state === 'pass' ? 'Pass' : state === 'warn' ? 'Warning' : state === 'fail' ? 'Fail' : 'Not set'}
                                  >
                                    {state === 'pass' && <ThumbsUp className="size-3" />}
                                    {state === 'warn' && <CircleAlert className="size-3" />}
                                    {state === 'fail' && <ThumbsDown className="size-3" />}
                                    {state === 'unset' && <MinusCircle className="size-3" />}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </CardContent>
                    </Card>

                    {/* Quick Overrides Card */}
                    <Card className="rounded-2xl shadow-sm">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[13px] font-semibold flex items-center gap-2">
                          <Settings className="size-4 text-teal-500" /> Quick Overrides
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-3">
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
                          <div className="flex items-center gap-2">
                            <Star className="size-3.5 text-amber-500" />
                            <div>
                              <span className="text-[12px] font-medium">Featured</span>
                              <p className="text-[10px] text-muted-foreground">Feature on homepage</p>
                            </div>
                          </div>
                          <Switch checked={overrideForm.featured} onCheckedChange={(v) => setOverrideForm(prev => ({ ...prev, featured: v }))} />
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
                          <div className="flex items-center gap-2">
                            <Award className="size-3.5 text-violet-500" />
                            <div>
                              <span className="text-[12px] font-medium">Staff Pick</span>
                              <p className="text-[10px] text-muted-foreground">Recommended by staff</p>
                            </div>
                          </div>
                          <Switch checked={overrideForm.staffPick} onCheckedChange={(v) => setOverrideForm(prev => ({ ...prev, staffPick: v }))} />
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <DollarSign className="size-3.5 text-teal-500" />
                            <span className="text-[12px] font-medium">Price Override</span>
                          </div>
                          <Input
                            type="number"
                            placeholder="Override price"
                            className="rounded-xl h-8 text-[12px]"
                            value={overrideForm.overridePrice}
                            onChange={(e) => setOverrideForm(prev => ({ ...prev, overridePrice: e.target.value }))}
                          />
                          <Input
                            type="date"
                            className="rounded-xl h-8 text-[12px]"
                            value={overrideForm.overridePriceUntil}
                            onChange={(e) => setOverrideForm(prev => ({ ...prev, overridePriceUntil: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Shield className="size-3.5 text-teal-500" />
                            <span className="text-[12px] font-medium">Age Restriction</span>
                          </div>
                          <Select value={overrideForm.ageRestriction} onValueChange={(v) => setOverrideForm(prev => ({ ...prev, ageRestriction: v }))}>
                            <SelectTrigger className="rounded-xl h-8 text-[12px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="13+">13+</SelectItem>
                              <SelectItem value="18+">18+</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/30">
                          <div className="flex items-center gap-2">
                            <Globe className="size-3.5 text-teal-500" />
                            <div>
                              <span className="text-[12px] font-medium">Region Restricted</span>
                              <p className="text-[10px] text-muted-foreground">Restrict access by region</p>
                            </div>
                          </div>
                          <Switch checked={overrideForm.regionRestricted} onCheckedChange={(v) => setOverrideForm(prev => ({ ...prev, regionRestricted: v }))} />
                        </div>
                        <Button
                          size="sm"
                          className="rounded-xl gap-1.5 bg-teal-500 hover:bg-teal-600 text-white w-full"
                          disabled={!!actionLoading}
                          onClick={handleUpdateOverrides}
                        >
                          {actionLoading === 'update-overrides' ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle className="size-3.5" />}
                          Save Overrides
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Danger Zone Card */}
                    <Card className="rounded-2xl shadow-sm border-red-200 dark:border-red-800/40">
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-[13px] font-semibold flex items-center gap-2 text-red-600 dark:text-red-400">
                          <AlertTriangle className="size-4" /> Danger Zone
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl gap-1.5 h-9 text-[12px] w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                          disabled={!!actionLoading}
                          onClick={() => handleStatusAction('delete')}
                        >
                          <Trash2 className="size-3.5" /> Delete Course Permanently
                        </Button>
                        {!detailCourse.flaggedReason ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl gap-1.5 h-9 text-[12px] w-full border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400"
                            disabled={!!actionLoading}
                            onClick={() => handleQuickAction(detailCourse.id, 'flag', detailCourse.title)}
                          >
                            <Flag className="size-3.5" /> Flag Course
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl gap-1.5 h-9 text-[12px] w-full"
                            disabled={!!actionLoading}
                            onClick={() => handleUnflagCourse(detailCourse.id)}
                          >
                            <Flag className="size-3.5" /> Remove Flag
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
                <AlertCircle className="size-8" />
                <p className="text-[14px]">Failed to load course details</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={springTransition}
            className="space-y-6"
          >

      {/* ─── Header Section ─── */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 ios-shadow-sm">
            <BookOpen className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-foreground flex items-center gap-3">
              Course Management
              <Badge variant="secondary" className="text-[11px] rounded-xl px-2.5 py-0.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Total: {formatNumber(stats?.total ?? 0)} courses
              </Badge>
            </h1>
            <p className="text-[15px] text-muted-foreground">Review, manage, and moderate all platform courses</p>
          </div>
        </div>
      </div>

      {/* ─── Analytics Overview Section ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {analyticsLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="rounded-2xl border-0 shadow-sm">
              <CardContent className="p-4">
                <Skeleton className="h-3 w-20 rounded mb-2" />
                <Skeleton className="h-7 w-16 rounded mb-1" />
                <Skeleton className="h-3 w-24 rounded" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            {/* Total Courses */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Courses</span>
                    <BookOpen className="size-4 text-teal-500" />
                  </div>
                  <p className="text-[22px] font-bold">{formatNumber(ov?.totalCourses ?? 0)}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    <span className="text-emerald-600">{ov?.publishedCourses ?? 0} published</span> · {ov?.draftCourses ?? 0} draft
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Total Enrollments */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Enrollments</span>
                    <Users className="size-4 text-teal-500" />
                  </div>
                  <p className="text-[22px] font-bold">{formatNumber(ov?.totalEnrollments ?? 0)}</p>
                  <p className="text-[11px] text-emerald-600 mt-0.5 flex items-center gap-0.5">
                    <TrendingUp className="size-3" /> Active trend
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Total Revenue */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Revenue</span>
                    <DollarSign className="size-4 text-teal-500" />
                  </div>
                  <p className="text-[22px] font-bold">{formatAmount(ov?.totalRevenue ?? 0)}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Fee: {formatAmount(ov?.platformFeeTotal ?? 0)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Avg Rating */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Avg Rating</span>
                    <Star className="size-4 text-amber-500 fill-amber-500" />
                  </div>
                  <p className="text-[22px] font-bold">{(ov?.avgRating ?? 0).toFixed(1)}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Across all courses</p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Completion Rate */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Completion</span>
                    <GraduationCap className="size-4 text-teal-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[22px] font-bold">{Math.round(ov?.avgCompletionRate ?? 0)}%</p>
                  </div>
                  <Progress value={ov?.avgCompletionRate ?? 0} className="h-1.5 mt-1.5" />
                </CardContent>
              </Card>
            </motion.div>

            {/* Pending Reviews */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Pending</span>
                    <Clock className={cn("size-4", (ov?.underReviewCourses ?? 0) > 5 ? "text-red-500 animate-pulse" : "text-amber-500")} />
                  </div>
                  <p className="text-[22px] font-bold">{ov?.underReviewCourses ?? 0}</p>
                  <p className="text-[11px] mt-0.5">
                    {(ov?.underReviewCourses ?? 0) > 5
                      ? <span className="text-red-600 font-medium">Needs attention</span>
                      : <span className="text-muted-foreground">In review queue</span>
                    }
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      {/* ─── Status Tab Bar ─── */}
      <div className="flex rounded-xl bg-muted/60 p-1 gap-0.5 overflow-x-auto">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleStatusTabChange(tab.key)}
            className={cn(
              'flex-1 min-w-fit rounded-lg px-3 py-2 text-[13px] font-medium transition-all whitespace-nowrap',
              activeStatusTab === tab.key
                ? 'bg-card shadow-sm text-foreground border-b-2 border-teal-500'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}{' '}
            <span className="text-[11px] opacity-70">({formatNumber(tab.count)})</span>
          </button>
        ))}
      </div>

      {/* ─── Search & Filter Bar ─── */}
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="space-y-2">
            {/* Search + Filters Row */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative w-full md:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses by title, description, instructor..."
                  className="pl-9 rounded-xl h-9"
                  defaultValue={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>

              {/* Mobile Filter Sheet */}
              <MobileFilterSheet
                activeCount={[
                  categoryFilter ? 1 : 0,
                  levelFilter ? 1 : 0,
                  sortFilter !== 'newest' ? 1 : 0,
                  featuredFilter ? 1 : 0,
                  staffPickFilter ? 1 : 0,
                ].reduce((a, b) => a + b, 0)}
                onClearAll={() => {
                  setCategoryFilter('')
                  setLevelFilter('')
                  setSortFilter('newest')
                  setFeaturedFilter(false)
                  setStaffPickFilter(false)
                }}
                title="Course Filters"
              >
                <MobileFilterGroup label="Category">
                  <Select value={categoryFilter || '_all'} onValueChange={(v) => setCategoryFilter(v === '_all' ? '' : v)}>
                    <SelectTrigger className="rounded-xl h-9">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">All Categories</SelectItem>
                      {CATEGORY_OPTIONS.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </MobileFilterGroup>

                <MobileFilterGroup label="Level">
                  <Select value={levelFilter || '_all'} onValueChange={(v) => setLevelFilter(v === '_all' ? '' : v)}>
                    <SelectTrigger className="rounded-xl h-9">
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">All Levels</SelectItem>
                      {LEVEL_OPTIONS.map((lvl) => (
                        <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </MobileFilterGroup>

                <MobileFilterGroup label="Sort By">
                  <Select value={sortFilter} onValueChange={setSortFilter}>
                    <SelectTrigger className="rounded-xl h-9">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </MobileFilterGroup>

                <MobileFilterGroup label="Featured">
                  <Select value={featuredFilter ? 'yes' : 'all'} onValueChange={(v) => setFeaturedFilter(v === 'yes')}>
                    <SelectTrigger className="rounded-xl h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      <SelectItem value="yes">Featured Only</SelectItem>
                    </SelectContent>
                  </Select>
                </MobileFilterGroup>

                <MobileFilterGroup label="Staff Pick">
                  <Select value={staffPickFilter ? 'yes' : 'all'} onValueChange={(v) => setStaffPickFilter(v === 'yes')}>
                    <SelectTrigger className="rounded-xl h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      <SelectItem value="yes">Staff Picks Only</SelectItem>
                    </SelectContent>
                  </Select>
                </MobileFilterGroup>
              </MobileFilterSheet>

              {/* Desktop: Inline Filter Selects */}
              <div className="hidden md:flex gap-2 items-center">
                {/* Category Filter */}
                <Select value={categoryFilter || '_all'} onValueChange={(v) => setCategoryFilter(v === '_all' ? '' : v)}>
                  <SelectTrigger className="w-[120px] rounded-xl h-9" size="sm">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">All Categories</SelectItem>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort Select */}
                <Select value={sortFilter} onValueChange={setSortFilter}>
                  <SelectTrigger className="w-[130px] rounded-xl h-9" size="sm">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="flex rounded-xl border h-9 overflow-hidden">
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'flex items-center justify-center px-2.5 transition-colors',
                      viewMode === 'list' ? 'bg-teal-500 text-white' : 'bg-background text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <List className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'flex items-center justify-center px-2.5 transition-colors',
                      viewMode === 'grid' ? 'bg-teal-500 text-white' : 'bg-background text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <LayoutGrid className="size-3.5" />
                  </button>
                </div>

                {/* Refresh */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl size-9 p-0"
                      onClick={() => { fetchCourses(pagination.page); fetchAnalytics(); }}
                    >
                      <RefreshCw className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh data</TooltipContent>
                </Tooltip>

                {/* Clear Filters */}
                {(categoryFilter || levelFilter || sortFilter !== 'newest' || featuredFilter || staffPickFilter) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl h-9 gap-1.5 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setCategoryFilter('')
                          setLevelFilter('')
                          setSortFilter('newest')
                          setFeaturedFilter(false)
                          setStaffPickFilter(false)
                        }}
                      >
                        <X className="size-3.5" />
                        Clear
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Clear all filters</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-9" onClick={handleExport}>
                    <FileDown className="size-3.5" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export courses as CSV</TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-1.5 h-9"
                    disabled={selectedIds.size === 0}
                  >
                    <Zap className="size-3.5" />
                    <span className="hidden sm:inline">Bulk</span>
                    {selectedIds.size > 0 && (
                      <Badge className="ml-1 size-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-teal-500 text-white">
                        {selectedIds.size}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  <DropdownMenuLabel className="text-[12px] text-muted-foreground">
                    {selectedIds.size} course(s) selected
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBulkAction('publish')} className="gap-2">
                    <CheckCircle className="size-3.5 text-emerald-500" /> Publish
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('unpublish')} className="gap-2">
                    <EyeOff className="size-3.5 text-slate-500" /> Unpublish
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBulkAction('archive')} className="gap-2">
                    <Archive className="size-3.5 text-slate-500" /> Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('unarchive')} className="gap-2">
                    <ArchiveRestore className="size-3.5 text-slate-500" /> Unarchive
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBulkAction('feature')} className="gap-2">
                    <Star className="size-3.5 text-amber-500" /> Feature
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('unfeature')} className="gap-2">
                    <Star className="size-3.5 text-slate-400" /> Unfeature
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBulkAction('delete')} className="gap-2 text-red-600 focus:text-red-600">
                    <Trash2 className="size-3.5" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Bulk Actions Bar ─── */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="rounded-2xl ios-shadow-sm border-2 border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/20">
              <CardContent className="p-3 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedIds.size === courses.length && courses.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-[13px] font-medium">{selectedIds.size} selected</span>
                </div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-8 text-[12px]" onClick={() => handleBulkAction('publish')} disabled={!!actionLoading?.startsWith('bulk')}>
                    <CheckCircle className="size-3" /> Publish
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-8 text-[12px]" onClick={() => handleBulkAction('unpublish')} disabled={!!actionLoading?.startsWith('bulk')}>
                    <EyeOff className="size-3" /> Unpublish
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-8 text-[12px]" onClick={() => handleBulkAction('archive')} disabled={!!actionLoading?.startsWith('bulk')}>
                    <Archive className="size-3" /> Archive
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-8 text-[12px] text-amber-600 hover:text-amber-700" onClick={() => handleBulkAction('feature')} disabled={!!actionLoading?.startsWith('bulk')}>
                    <Star className="size-3" /> Feature
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-8 text-[12px] text-red-600 hover:text-red-700" onClick={() => handleBulkAction('delete')} disabled={!!actionLoading?.startsWith('bulk')}>
                    <Trash2 className="size-3" /> Delete
                  </Button>
                  <Button size="sm" variant="ghost" className="rounded-xl gap-1.5 h-8 text-[12px]" onClick={() => setSelectedIds(new Set())}>
                    <X className="size-3" /> Clear
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Course Grid View ─── */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="rounded-2xl border-0 shadow-sm">
                <Skeleton className="h-36 rounded-t-2xl" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                  <Skeleton className="h-3 w-2/3 rounded" />
                </CardContent>
              </Card>
            ))
          ) : error ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3">
              <AlertCircle className="size-10 text-red-400" />
              <p className="text-[15px] font-medium">Failed to load courses</p>
              <p className="text-[13px] text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => fetchCourses(1)}>
                Retry
              </Button>
            </div>
          ) : courses.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3">
              <BookOpen className="size-10 text-muted-foreground/30" />
              <p className="text-[15px] font-medium">No courses found</p>
              <p className="text-[13px] text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {courses.map((course, i) => {
                const status = getCourseStatus(course)
                const statusConf = STATUS_CONFIG[status]
                return (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.03, ...springTransition }}
                  >
                    <Card
                      className={cn(
                        "rounded-2xl border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden",
                        selectedIds.has(course.id) && 'ring-2 ring-teal-500'
                      )}
                      onClick={() => handleViewCourse(course.id)}
                    >
                      {/* Thumbnail */}
                      <div className="relative h-36 bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/40 dark:to-emerald-900/40 overflow-hidden">
                        {course.thumbnail ? (
                          <img src={course.thumbnail} alt={course.title} className="size-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <BookOpen className="size-10 text-teal-600/40 dark:text-teal-400/40" />
                          </div>
                        )}
                        {/* Overlay actions */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <Button size="sm" variant="secondary" className="rounded-lg gap-1 h-7 text-[11px]" onClick={(e) => { e.stopPropagation(); handleViewCourse(course.id) }}>
                            <Eye className="size-3" /> View
                          </Button>
                          <Button size="sm" variant="secondary" className="rounded-lg gap-1 h-7 text-[11px]" onClick={(e) => { e.stopPropagation(); handleQuickAction(course.id, course.featured ? 'unfeature' : 'feature', course.title) }}>
                            <Star className={cn("size-3", course.featured && "fill-amber-500 text-amber-500")} /> {course.featured ? 'Unfeature' : 'Feature'}
                          </Button>
                        </div>
                        {/* Badges overlay */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          <Badge className={cn("text-[10px] rounded-md px-1.5 py-0 h-5 gap-1", statusConf.badgeClass)}>
                            {statusConf.icon} {statusConf.label}
                          </Badge>
                        </div>
                        <div className="absolute top-2 right-2 flex gap-1">
                          {course.featured && <Star className="size-4 text-amber-500 fill-amber-500 drop-shadow-sm" />}
                          {course.staffPick && <Award className="size-4 text-violet-500 drop-shadow-sm" />}
                          {course.flaggedReason && <AlertTriangle className="size-4 text-amber-500 drop-shadow-sm" />}
                        </div>
                      </div>

                      <CardContent className="p-4">
                        {/* Category & Level */}
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-[10px] rounded-md px-1.5 py-0 h-4 bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400">
                            {course.category}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">{course.level}</span>
                        </div>

                        {/* Title */}
                        <h3 className="text-[14px] font-semibold line-clamp-2 mb-2 leading-snug">{course.title}</h3>

                        {/* Instructor */}
                        <div className="flex items-center gap-2 mb-3">
                          <Avatar className="size-5 rounded-md shrink-0">
                            <AvatarImage src={course.instructor.avatar || undefined} />
                            <AvatarFallback className="text-[8px] bg-primary/10 rounded-md">
                              {getInitials(course.instructor.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-[12px] text-muted-foreground truncate">{course.instructor.name}</span>
                        </div>

                        {/* Stats Row */}
                        <div className="flex items-center justify-between text-[12px]">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Users className="size-3" /> {formatNumber(course.enrollmentCount)}
                            </span>
                            {course.rating > 0 && (
                              <span className="flex items-center gap-0.5">
                                <Star className="size-3 text-amber-500 fill-amber-500" /> {course.rating.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <span className="font-semibold text-teal-600 dark:text-teal-400">
                            {course.overridePrice != null && (!course.overridePriceUntil || new Date(course.overridePriceUntil) > new Date())
                              ? formatAmount(course.overridePrice)
                              : formatAmount(course.price)
                            }
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* ─── Course List View ─── */}
      {viewMode === 'list' && (
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="hidden lg:grid lg:grid-cols-[40px_48px_1fr_130px_80px_70px_80px_120px_60px] gap-2 items-center px-4 py-3 bg-muted/40 border-b text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
            <div>
              <Checkbox
                checked={selectedIds.size === courses.length && courses.length > 0}
                onCheckedChange={toggleSelectAll}
              />
            </div>
            <div>#</div>
            <div>Course</div>
            <div>Instructor</div>
            <div>Students</div>
            <div>Rating</div>
            <div>Price</div>
            <div>Status</div>
            <div className="text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-border/40">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="size-10 rounded-xl" />
                  <Skeleton className="size-10 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-48 rounded-lg" />
                    <Skeleton className="h-3 w-32 rounded-lg" />
                  </div>
                  <Skeleton className="h-5 w-20 rounded-lg" />
                  <Skeleton className="h-5 w-16 rounded-lg" />
                  <Skeleton className="h-5 w-20 rounded-lg" />
                  <div className="flex gap-1">
                    <Skeleton className="size-8 rounded-lg" />
                    <Skeleton className="size-8 rounded-lg" />
                  </div>
                </div>
              ))
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <AlertCircle className="size-10 text-red-400" />
                <p className="text-[15px] font-medium">Failed to load courses</p>
                <p className="text-[13px] text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => fetchCourses(1)}>
                  Retry
                </Button>
              </div>
            ) : courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <BookOpen className="size-10 text-muted-foreground/30" />
                <p className="text-[15px] font-medium">No courses found</p>
                <p className="text-[13px] text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {courses.map((course, i) => {
                  const status = getCourseStatus(course)
                  const statusConf = STATUS_CONFIG[status]
                  const rowIndex = (pagination.page - 1) * pagination.limit + i + 1

                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ delay: i * 0.03, ...springTransition }}
                      onClick={() => handleViewCourse(course.id)}
                      className={cn(
                        'grid grid-cols-1 lg:grid-cols-[40px_48px_1fr_130px_80px_70px_80px_120px_60px] gap-2 items-center px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer',
                        selectedIds.has(course.id) && 'bg-teal-50/50 dark:bg-teal-950/10'
                      )}
                    >
                      {/* Checkbox (desktop) */}
                      <div className="hidden lg:block" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.has(course.id)}
                          onCheckedChange={() => toggleSelect(course.id)}
                        />
                      </div>

                      {/* Row # */}
                      <div className="hidden lg:block text-[12px] text-muted-foreground font-mono">
                        {rowIndex}
                      </div>

                      {/* Course Info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <Checkbox
                          checked={selectedIds.has(course.id)}
                          onCheckedChange={() => toggleSelect(course.id)}
                          className="lg:hidden shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="size-10 rounded-lg bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/40 dark:to-emerald-900/40 flex items-center justify-center shrink-0 overflow-hidden">
                          {course.thumbnail ? (
                            <img src={course.thumbnail} alt={course.title} className="size-full object-cover rounded-lg" />
                          ) : (
                            <BookOpen className="size-5 text-teal-600 dark:text-teal-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[14px] font-semibold truncate">{course.title}</p>
                            {course.featured && (
                              <Tooltip><TooltipTrigger><Star className="size-3.5 text-amber-500 fill-amber-500 shrink-0" /></TooltipTrigger><TooltipContent>Featured</TooltipContent></Tooltip>
                            )}
                            {course.staffPick && (
                              <Tooltip><TooltipTrigger><Award className="size-3.5 text-violet-500 shrink-0" /></TooltipTrigger><TooltipContent>Staff Pick</TooltipContent></Tooltip>
                            )}
                            {course.flaggedReason && (
                              <Tooltip><TooltipTrigger><AlertTriangle className="size-3.5 text-amber-500 shrink-0" /></TooltipTrigger><TooltipContent>{course.flaggedReason}</TooltipContent></Tooltip>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="secondary" className="text-[10px] rounded-md px-1.5 py-0 h-4 bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400">
                              {course.category}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">{course.level}</span>
                          </div>
                        </div>
                      </div>

                      {/* Instructor */}
                      <div className="hidden lg:flex items-center gap-2 min-w-0">
                        <Avatar className="size-6 rounded-lg shrink-0">
                          <AvatarImage src={course.instructor.avatar || undefined} />
                          <AvatarFallback className="text-[9px] bg-primary/10 rounded-lg">
                            {getInitials(course.instructor.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[13px] text-muted-foreground truncate">{course.instructor.name}</span>
                      </div>

                      {/* Students */}
                      <div className="hidden lg:block text-[13px] text-muted-foreground">
                        {formatNumber(course.enrollmentCount)}
                      </div>

                      {/* Rating */}
                      <div className="hidden lg:flex items-center gap-1">
                        {course.rating > 0 ? (
                          <>
                            <Star className="size-3 text-amber-500 fill-amber-500" />
                            <span className="text-[13px]">{course.rating.toFixed(1)}</span>
                          </>
                        ) : (
                          <span className="text-[13px] text-muted-foreground">—</span>
                        )}
                      </div>

                      {/* Price */}
                      <div className="hidden lg:block text-[13px]">
                        {course.overridePrice != null && (!course.overridePriceUntil || new Date(course.overridePriceUntil) > new Date()) ? (
                          <div>
                            <span className="line-through text-muted-foreground text-[11px]">{formatAmount(course.price)}</span>
                            <span className="font-medium text-teal-600 dark:text-teal-400 ml-1">{formatAmount(course.overridePrice)}</span>
                          </div>
                        ) : (
                          <span className="font-medium">{formatAmount(course.price)}</span>
                        )}
                      </div>

                      {/* Status */}
                      <div className="hidden lg:block">
                        <Badge className={cn("text-[11px] rounded-md px-2 py-0.5 gap-1 font-medium", statusConf.badgeClass)}>
                          {statusConf.icon} {statusConf.label}
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="hidden lg:flex justify-end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="size-8 p-0 rounded-lg">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem onClick={() => handleViewCourse(course.id)} className="gap-2">
                              <Eye className="size-3.5" /> View Detail
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleQuickAction(course.id, course.featured ? 'unfeature' : 'feature', course.title)} className="gap-2">
                              <Star className={cn("size-3.5", course.featured ? "text-amber-500 fill-amber-500" : "text-slate-400")} /> {course.featured ? 'Unfeature' : 'Feature'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleQuickAction(course.id, course.flaggedReason ? 'unflag' : 'flag', course.title)} className="gap-2">
                              <Flag className="size-3.5 text-amber-500" /> {course.flaggedReason ? 'Unflag' : 'Flag'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleQuickAction(course.id, 'duplicate', course.title)} className="gap-2">
                              <Copy className="size-3.5" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleQuickAction(course.id, course.isPublished ? 'unpublish' : 'publish', course.title)} className="gap-2">
                              {course.isPublished ? <><EyeOff className="size-3.5" /> Unpublish</> : <><CheckCircle className="size-3.5 text-emerald-500" /> Publish</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleQuickAction(course.id, 'archive', course.title)} className="gap-2">
                              <Archive className="size-3.5" /> Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
              <span className="text-[12px] text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl size-8 p-0"
                  disabled={pagination.page <= 1}
                  onClick={() => goToPage(pagination.page - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, idx) => {
                  let pageNum: number
                  if (pagination.totalPages <= 5) {
                    pageNum = idx + 1
                  } else if (pagination.page <= 3) {
                    pageNum = idx + 1
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + idx
                  } else {
                    pageNum = pagination.page - 2 + idx
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={pagination.page === pageNum ? 'default' : 'outline'}
                      size="sm"
                      className={cn("rounded-xl size-8 p-0 text-[12px]", pagination.page === pageNum && "bg-teal-500 hover:bg-teal-600")}
                      onClick={() => goToPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl size-8 p-0"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => goToPage(pagination.page + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Grid View Pagination */}
      {viewMode === 'grid' && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-1"
            disabled={pagination.page <= 1}
            onClick={() => goToPage(pagination.page - 1)}
          >
            <ChevronLeft className="size-4" /> Previous
          </Button>
          <span className="text-[13px] text-muted-foreground px-2">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-1"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => goToPage(pagination.page + 1)}
          >
            Next <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Flag Course Dialog ─── */}
      <Dialog open={showFlagDialog} onOpenChange={setShowFlagDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="size-5 text-amber-500" /> Flag Course
            </DialogTitle>
            <DialogDescription>
              Flag this course for review. Provide a clear reason for flagging.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter reason for flagging this course..."
            className="rounded-xl min-h-[80px]"
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
          />
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => { setShowFlagDialog(false); setFlagReason(''); setFlagCourseId(null); }}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
              disabled={!flagReason.trim() || !!actionLoading}
              onClick={handleFlagCourse}
            >
              {actionLoading === 'flag' ? <Loader2 className="size-3.5 animate-spin" /> : <Flag className="size-3.5" />}
              Flag Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Duplicate Course Dialog ─── */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="size-5 text-teal-500" /> Duplicate Course
            </DialogTitle>
            <DialogDescription>
              This will create a copy of <strong>&quot;{duplicateCourseTitle}&quot;</strong> with all modules and lessons. The duplicate will be created as a draft.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => { setShowDuplicateDialog(false); setDuplicateCourseId(null); setDuplicateCourseTitle(''); }}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-teal-500 hover:bg-teal-600 text-white gap-1.5"
              disabled={!!actionLoading}
              onClick={handleDuplicateCourse}
            >
              {actionLoading === 'duplicate' ? <Loader2 className="size-3.5 animate-spin" /> : <Copy className="size-3.5" />}
              Duplicate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ─── */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="size-5" /> Delete Course Permanently
            </DialogTitle>
            <DialogDescription className="text-red-600/80">
              This will permanently delete <strong>&quot;{detailCourse?.title}&quot;</strong> and all associated data (modules, lessons, enrollments, reviews). This action <strong>cannot be undone</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
              <p className="text-[12px] text-red-700 dark:text-red-400">
                Type <strong>DELETE</strong> to confirm:
              </p>
              <Input
                className="rounded-xl h-9 mt-2 text-[13px] border-red-200 focus:border-red-500 dark:border-red-800"
                placeholder='Type "DELETE" to confirm'
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white gap-1.5"
              disabled={deleteConfirmText !== 'DELETE' || !!actionLoading}
              onClick={handleConfirmDelete}
            >
              {actionLoading === 'delete-confirm' ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Wrapped Component with CurrencyProvider ────────────────────────────────

export function AdminCourseManagementWrapped() {
  return (
    <CurrencyProvider>
      <AdminCourseManagement />
    </CurrencyProvider>
  )
}
