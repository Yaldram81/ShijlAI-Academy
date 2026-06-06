'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardCheck, Search, Clock, Eye, AlertTriangle,
  CheckCircle, XCircle, BookOpen, ChevronLeft, ChevronRight,
  MoreHorizontal, Flag, UserPlus, ArrowUpRight, Loader2,
  AlertCircle, X, RefreshCw, Star, Shield, FileCheck,
  MessageSquare, ChevronDown, Video, Users,
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AdminStatCard, AdminStatCardGrid } from './admin-stat-card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminCourseReviewDetail } from '@/components/admin/admin-course-review-detail'

// ─── Types ──────────────────────────────────────────────────────────────────

interface ReviewCourseItem {
  id: string
  title: string
  description: string
  category: string
  level: string
  language: string
  thumbnail: string | null
  price: number
  isPublished: boolean
  isArchived: boolean
  enrollmentCount: number
  rating: number
  reviewStatus: string
  flaggedReason: string | null
  reviewNote: string | null
  submittedForReviewAt: string | null
  reviewedAt: string | null
  reviewedBy: string | null
  createdAt: string
  updatedAt: string
  instructor: { id: string; name: string; avatar: string | null; email: string }
  previousReviewer: { name: string } | null
  _count: { modules: number; lessons: number; enrollments: number }
}

interface ReviewStats {
  pending: number
  underReview: number
  changesRequested: number
  rejected: number
  flagged: number
  total: number
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

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

// ─── Status Config ──────────────────────────────────────────────────────────

type ReviewStatusKey = 'pending' | 'under_review' | 'changes_requested' | 'rejected' | 'flagged'

const REVIEW_STATUS_CONFIG: Record<ReviewStatusKey, { label: string; badgeClass: string; icon: React.ReactNode }> = {
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
}

const CATEGORY_OPTIONS = [
  'IB', 'AP', 'Cambridge', 'IELTS', 'AWS', 'Programming',
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English',
  'Computer Science', 'General',
]

const LEVEL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced']

const SORT_OPTIONS = [
  { value: 'oldest', label: 'Oldest First' },
  { value: 'newest', label: 'Newest First' },
  { value: 'title_asc', label: 'Title A-Z' },
]



// ─── Main Component ─────────────────────────────────────────────────────────

export function AdminCourseReview() {
  const { currentUser } = useAppStore()

  // ── State: Courses List ──
  const [courses, setCourses] = useState<ReviewCourseItem[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── State: Filters ──
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [sortFilter, setSortFilter] = useState('oldest')

  // ── State: Selection ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // ── State: Detail View ──
  const [detailCourseId, setDetailCourseId] = useState<string | null>(null)

  // ── State: Action loading ──
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // ── State: Dialogs ──
  const [showQuickRejectDialog, setShowQuickRejectDialog] = useState(false)
  const [quickRejectNote, setQuickRejectNote] = useState('')
  const [quickRejectCourseId, setQuickRejectCourseId] = useState<string | null>(null)

  const [showQuickApproveDialog, setShowQuickApproveDialog] = useState(false)
  const [quickApproveNote, setQuickApproveNote] = useState('')
  const [quickApproveCourseId, setQuickApproveCourseId] = useState<string | null>(null)

  const [showFlagDialog, setShowFlagDialog] = useState(false)
  const [flagReason, setFlagReason] = useState('')
  const [flagCourseId, setFlagCourseId] = useState<string | null>(null)

  const [showBulkRejectDialog, setShowBulkRejectDialog] = useState(false)
  const [bulkRejectNote, setBulkRejectNote] = useState('')
  const [showBulkApproveDialog, setShowBulkApproveDialog] = useState(false)
  const [bulkApproveNote, setBulkApproveNote] = useState('')
  const [showBulkChangesDialog, setShowBulkChangesDialog] = useState(false)
  const [bulkChangesNote, setBulkChangesNote] = useState('')

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

  // Auto-remove toasts
  useEffect(() => {
    if (toasts.length === 0) return
    const timer = setTimeout(() => {
      setToasts(prev => prev.slice(1))
    }, 3000)
    return () => clearTimeout(timer)
  }, [toasts])

  // ── Fetch Courses ──
  const fetchCourses = useCallback(async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '12',
        search,
        status: statusFilter,
        category: categoryFilter,
        level: levelFilter,
        sort: sortFilter,
      })
      const res = await fetch(`/api/admin/course-review?${params}`)
      if (!res.ok) throw new Error('Failed to fetch review queue')
      const data = await res.json()
      setCourses(data.courses || [])
      setStats(data.stats || null)
      setPagination(data.pagination || { page, limit: 12, total: 0, totalPages: 0 })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load review queue')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, categoryFilter, levelFilter, sortFilter])

  // ── Effects ──
  useEffect(() => {
    fetchCourses(1)
  }, [fetchCourses])

  // ── Debounced search ──
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setSearch(value)
    }, 300)
  }, [])

  // ── Status tab click ──
  const handleStatusFilter = useCallback((status: string) => {
    setStatusFilter(status)
    setSelectedIds(new Set())
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

  // ── Quick Approve ──
  const handleQuickApprove = useCallback(async () => {
    if (!quickApproveCourseId) return
    setActionLoading('quick-approve')
    try {
      const res = await fetch(`/api/admin/course-review/${quickApproveCourseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', reviewNote: quickApproveNote.trim() || undefined }),
      })
      if (!res.ok) throw new Error('Approve failed')
      addToast('success', 'Course approved successfully')
      setShowQuickApproveDialog(false)
      setQuickApproveNote('')
      setQuickApproveCourseId(null)
      fetchCourses(pagination.page)
    } catch {
      addToast('error', 'Failed to approve course')
    } finally {
      setActionLoading(null)
    }
  }, [quickApproveCourseId, quickApproveNote, fetchCourses, pagination.page, addToast])

  // ── Quick Reject ──
  const handleQuickReject = useCallback(async () => {
    if (!quickRejectCourseId || !quickRejectNote.trim()) return
    setActionLoading('quick-reject')
    try {
      const res = await fetch(`/api/admin/course-review/${quickRejectCourseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reviewNote: quickRejectNote.trim() }),
      })
      if (!res.ok) throw new Error('Reject failed')
      addToast('success', 'Course rejected')
      setShowQuickRejectDialog(false)
      setQuickRejectNote('')
      setQuickRejectCourseId(null)
      fetchCourses(pagination.page)
    } catch {
      addToast('error', 'Failed to reject course')
    } finally {
      setActionLoading(null)
    }
  }, [quickRejectCourseId, quickRejectNote, fetchCourses, pagination.page, addToast])

  // ── Flag ──
  const handleFlag = useCallback(async () => {
    if (!flagCourseId || !flagReason.trim()) return
    setActionLoading('flag')
    try {
      const res = await fetch(`/api/admin/course-review/${flagCourseId}`, {
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
    } catch {
      addToast('error', 'Failed to flag course')
    } finally {
      setActionLoading(null)
    }
  }, [flagCourseId, flagReason, currentUser?.name, fetchCourses, pagination.page, addToast])

  // ── Bulk Action ──
  const handleBulkAction = useCallback(async (action: string, note?: string) => {
    if (selectedIds.size === 0) return
    setActionLoading(`bulk-${action}`)
    try {
      const res = await fetch('/api/admin/course-review/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseIds: Array.from(selectedIds), action, reviewNote: note }),
      })
      if (!res.ok) throw new Error(`Bulk ${action} failed`)
      addToast('success', `Bulk ${action} completed for ${selectedIds.size} course(s)`)
      setSelectedIds(new Set())
      fetchCourses(pagination.page)
    } catch {
      addToast('error', `Bulk ${action} failed`)
    } finally {
      setActionLoading(null)
    }
  }, [selectedIds, fetchCourses, pagination.page, addToast])

  // ── More Actions (Assign, Escalate, etc) ──
  const handleMoreAction = useCallback(async (courseId: string, action: string) => {
    setActionLoading(`${courseId}-${action}`)
    try {
      const res = await fetch(`/api/admin/course-review/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminName: currentUser?.name || 'Admin' }),
      })
      if (!res.ok) throw new Error(`Action "${action}" failed`)
      const labels: Record<string, string> = {
        assign: 'Assigned to you',
        escalate: 'Escalated',
        start_review: 'Review started',
      }
      addToast('success', labels[action] || `Action "${action}" completed`)
      fetchCourses(pagination.page)
    } catch {
      addToast('error', `Failed to ${action}`)
    } finally {
      setActionLoading(null)
    }
  }, [currentUser?.name, fetchCourses, pagination.page, addToast])

  // ── View Detail ──
  const handleViewDetail = useCallback((courseId: string) => {
    setDetailCourseId(courseId)
  }, [])

  const handleBackFromDetail = useCallback(() => {
    setDetailCourseId(null)
    fetchCourses(pagination.page)
  }, [fetchCourses, pagination.page])

  // ── Review Status Tabs Data ──
  const statusTabs = [
    { key: 'all', label: 'All', count: stats?.total ?? 0 },
    { key: 'pending', label: 'Pending', count: stats?.pending ?? 0 },
    { key: 'under_review', label: 'Under Review', count: stats?.underReview ?? 0 },
    { key: 'changes_requested', label: 'Changes Requested', count: stats?.changesRequested ?? 0 },
    { key: 'rejected', label: 'Rejected', count: stats?.rejected ?? 0 },
    { key: 'flagged', label: 'Flagged', count: stats?.flagged ?? 0 },
  ]

  // ── Stat cards data ──
  const statCards = [
    { key: 'pending', label: 'Pending Review', count: stats?.pending ?? 0, icon: Clock, color: 'amber' as const, gradientOverride: 'from-amber-500 to-amber-600' },
    { key: 'under_review', label: 'Under Review', count: stats?.underReview ?? 0, icon: Eye, color: 'blue' as const, gradientOverride: 'from-sky-500 to-sky-600' },
    { key: 'changes_requested', label: 'Changes Requested', count: stats?.changesRequested ?? 0, icon: AlertCircle, color: 'orange' as const, gradientOverride: 'from-orange-500 to-orange-600' },
    { key: 'rejected', label: 'Rejected', count: stats?.rejected ?? 0, icon: XCircle, color: 'red' as const, gradientOverride: 'from-red-500 to-red-600' },
    { key: 'flagged', label: 'Flagged', count: stats?.flagged ?? 0, icon: Flag, color: 'rose' as const, gradientOverride: 'from-rose-500 to-rose-600' },
  ]

  // ── Get review status config ──
  const getStatusConfig = (status: string) => {
    return REVIEW_STATUS_CONFIG[status as ReviewStatusKey] || REVIEW_STATUS_CONFIG.pending
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: Detail View
  // ═══════════════════════════════════════════════════════════════════════

  if (detailCourseId) {
    return <AdminCourseReviewDetail courseId={detailCourseId} onBack={handleBackFromDetail} />
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: Listing
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={springTransition}
        className="space-y-6"
      >
        {/* ─── Header Section ─── */}
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 ios-shadow-sm">
              <ClipboardCheck className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-[28px] font-bold text-foreground flex items-center gap-3">
                Course Review Queue
                <Badge variant="secondary" className="text-[11px] rounded-xl px-2.5 py-0.5 bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400">
                  {formatNumber(stats?.pending ?? 0)} pending
                </Badge>
              </h1>
              <p className="text-[15px] text-muted-foreground">Review and manage course submissions before they go live</p>
            </div>
          </div>
        </div>

        {/* ─── Stats Cards Row ─── */}
        <AdminStatCardGrid columns={5}>
          {statCards.map((card, i) => (
            <AdminStatCard
              key={card.key}
              icon={card.icon}
              label={card.label}
              value={formatNumber(card.count)}
              color={card.color}
              active={statusFilter === card.key}
              onClick={() => handleStatusFilter(statusFilter === card.key ? 'all' : card.key)}
              index={i}
              iconBgOverride={cn('flex size-10 items-center justify-center rounded-xl bg-gradient-to-br shrink-0', card.gradientOverride)}
              iconColorOverride="text-white"
            />
          ))}
        </AdminStatCardGrid>

        {/* ─── Tab Navigation ─── */}
        <div className="flex rounded-xl bg-muted/60 p-1 gap-0.5 overflow-x-auto">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleStatusFilter(tab.key)}
              className={cn(
                'flex-1 min-w-fit rounded-lg px-3 py-2 text-[13px] font-medium transition-all ios-press whitespace-nowrap',
                statusFilter === tab.key
                  ? 'bg-card ios-shadow-sm text-foreground border-b-2 border-teal-500'
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
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses by title, instructor..."
                  className="pl-9 rounded-xl h-9"
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              <div className="hidden md:flex gap-2 items-center">
                <Select value={categoryFilter || 'all'} onValueChange={(v) => setCategoryFilter(v === 'all' ? '' : v)}>
                  <SelectTrigger className="w-[120px] rounded-xl h-9 text-[13px]" size="sm">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortFilter} onValueChange={setSortFilter}>
                  <SelectTrigger className="w-[130px] rounded-xl h-9 text-[13px]" size="sm">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-9" onClick={() => fetchCourses(pagination.page)}>
                      <RefreshCw className="size-3.5" />
                      <span className="hidden sm:inline">Refresh</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh review queue</TooltipContent>
                </Tooltip>
                {(categoryFilter || levelFilter || sortFilter !== 'oldest' || search) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl h-9 gap-1.5 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setCategoryFilter('')
                      setLevelFilter('')
                      setSortFilter('oldest')
                      setSearch('')
                      setSearchInput('')
                    }}
                  >
                    <X className="size-3.5" />
                    Clear
                  </Button>
                )}
              </div>
              {/* Mobile-only: level & category filters shown inline */}
              <div className="flex md:hidden gap-2 flex-wrap">
                <Select value={categoryFilter || 'all'} onValueChange={(v) => setCategoryFilter(v === 'all' ? '' : v)}>
                  <SelectTrigger className="w-[140px] rounded-xl h-9 text-[13px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={levelFilter || 'all'} onValueChange={(v) => setLevelFilter(v === 'all' ? '' : v)}>
                  <SelectTrigger className="w-[130px] rounded-xl h-9 text-[13px]">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {LEVEL_OPTIONS.map((lvl) => (
                      <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortFilter} onValueChange={setSortFilter}>
                  <SelectTrigger className="w-[150px] rounded-xl h-9 text-[13px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              transition={{ duration: 0.2 }}
            >
              <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm bg-teal-50 dark:bg-teal-950/20">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedIds.size === courses.length && courses.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                      <span className="text-[13px] font-medium text-teal-700 dark:text-teal-400">
                        {selectedIds.size} selected
                      </span>
                    </div>
                    <Separator orientation="vertical" className="h-6" />
                    <Button size="sm" className="rounded-xl gap-1.5 h-8 text-[12px] bg-emerald-600 hover:bg-emerald-700 text-white" disabled={!!actionLoading} onClick={() => { setShowBulkApproveDialog(true); setBulkApproveNote('') }}>
                      <CheckCircle className="size-3.5" /> Bulk Approve
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-8 text-[12px] border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400" disabled={!!actionLoading} onClick={() => { setShowBulkChangesDialog(true); setBulkChangesNote('') }}>
                      <AlertCircle className="size-3.5" /> Request Changes
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-8 text-[12px] border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400" disabled={!!actionLoading} onClick={() => { setShowBulkRejectDialog(true); setBulkRejectNote('') }}>
                      <XCircle className="size-3.5" /> Bulk Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Course Review Cards ─── */}
        <div className="space-y-4">
          {loading ? (
            // Loading skeletons
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start gap-4">
                      <Skeleton className="size-20 rounded-2xl shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4 rounded-lg" />
                        <div className="flex gap-2">
                          <Skeleton className="h-5 w-16 rounded-lg" />
                          <Skeleton className="h-5 w-20 rounded-lg" />
                          <Skeleton className="h-5 w-24 rounded-lg" />
                        </div>
                        <div className="flex gap-3">
                          <Skeleton className="h-4 w-20 rounded-lg" />
                          <Skeleton className="h-4 w-20 rounded-lg" />
                          <Skeleton className="h-4 w-16 rounded-lg" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
              <CardContent className="p-8">
                <div className="flex flex-col items-center justify-center gap-3">
                  <AlertCircle className="size-10 text-red-400" />
                  <p className="text-[15px] font-medium">Failed to load review queue</p>
                  <p className="text-[13px] text-muted-foreground">{error}</p>
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={() => fetchCourses(1)}>
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : courses.length === 0 ? (
            <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
              <CardContent className="p-8">
                <div className="flex flex-col items-center justify-center gap-3">
                  <ClipboardCheck className="size-10 text-teal-400" />
                  <p className="text-[15px] font-medium">No courses in review queue</p>
                  <p className="text-[13px] text-muted-foreground">
                    {statusFilter !== 'all' ? 'No courses match the current filter. Try changing the filter.' : 'All courses have been reviewed! Check back later.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <AnimatePresence mode="popLayout">
                {courses.map((course, i) => {
                  const statusConf = getStatusConfig(course.reviewStatus)
                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: i * 0.04, ...springTransition }}
                    >
                      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            {/* ── Left: Thumbnail ── */}
                            <div className="flex items-center gap-3 shrink-0">
                              <Checkbox
                                checked={selectedIds.has(course.id)}
                                onCheckedChange={() => toggleSelect(course.id)}
                                className="mt-8"
                              />
                              <div className="size-20 rounded-2xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/40 dark:to-emerald-900/40 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                {course.thumbnail ? (
                                  <img src={course.thumbnail} alt={course.title} className="size-full object-cover rounded-2xl" />
                                ) : (
                                  <BookOpen className="size-8 text-teal-600 dark:text-teal-400" />
                                )}
                              </div>
                            </div>

                            {/* ── Right: Content ── */}
                            <div className="flex-1 min-w-0 space-y-2.5">
                              {/* Title + Badges */}
                              <div className="space-y-1.5">
                                <div className="flex items-start justify-between gap-2">
                                  <h3 className="text-[15px] font-semibold text-foreground leading-tight line-clamp-1">{course.title}</h3>
                                  <Badge className={cn('text-[11px] rounded-lg px-2 py-0.5 gap-1 font-medium shrink-0', statusConf.badgeClass)}>
                                    {statusConf.icon} {statusConf.label}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="secondary" className="text-[11px] rounded-lg px-2 py-0.5 bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400">
                                    {course.category}
                                  </Badge>
                                  <Badge variant="secondary" className="text-[11px] rounded-lg px-2 py-0.5">
                                    {course.level}
                                  </Badge>
                                </div>
                              </div>

                              {/* Instructor */}
                              <div className="flex items-center gap-2">
                                <Avatar className="size-6 rounded-lg">
                                  <AvatarImage src={course.instructor.avatar || undefined} />
                                  <AvatarFallback className="text-[9px] bg-primary/10 rounded-lg">{getInitials(course.instructor.name)}</AvatarFallback>
                                </Avatar>
                                <span className="text-[13px] font-medium text-foreground">{course.instructor.name}</span>
                                <span className="text-[12px] text-muted-foreground truncate max-w-[180px]">{course.instructor.email}</span>
                              </div>

                              {/* Key Metrics */}
                              <div className="flex items-center gap-4 text-[12px] text-muted-foreground flex-wrap">
                                <div className="flex items-center gap-1">
                                  <BookOpen className="size-3.5" />
                                  <span>{course._count.modules} module{course._count.modules !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Video className="size-3.5" />
                                  <span>{course._count.lessons} lesson{course._count.lessons !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold text-foreground">Rs {formatNumber(course.price)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="size-3.5" />
                                  <span>{timeAgo(course.submittedForReviewAt)}</span>
                                </div>
                              </div>

                              {/* Previous Reviewer */}
                              {course.previousReviewer && (
                                <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                                  <Users className="size-3" />
                                  <span>Previously reviewed by <span className="font-medium text-foreground">{course.previousReviewer.name}</span></span>
                                </div>
                              )}

                              {/* Flagged Reason */}
                              {course.flaggedReason && (
                                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2">
                                  <Flag className="size-3.5 text-red-500 mt-0.5 shrink-0" />
                                  <div>
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">Flagged</span>
                                    <p className="text-[13px] text-red-700 dark:text-red-300 mt-0.5">{course.flaggedReason}</p>
                                  </div>
                                </div>
                              )}

                              {/* Changes Requested Note */}
                              {course.reviewStatus === 'changes_requested' && course.reviewNote && (
                                <div className="flex items-start gap-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg px-3 py-2">
                                  <AlertCircle className="size-3.5 text-orange-500 mt-0.5 shrink-0" />
                                  <div>
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">Review Note</span>
                                    <p className="text-[13px] text-orange-700 dark:text-orange-300 mt-0.5 line-clamp-2">{course.reviewNote}</p>
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <Separator className="my-1" />
                              <div className="flex items-center gap-2 flex-wrap">
                                <Button size="sm" className="rounded-xl gap-1.5 h-8 text-[12px] bg-teal-600 hover:bg-teal-700 text-white" onClick={() => handleViewDetail(course.id)}>
                                  <Eye className="size-3.5" /> Review Now
                                </Button>
                                <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-8 text-[12px] border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400" disabled={!!actionLoading} onClick={() => { setQuickApproveCourseId(course.id); setQuickApproveNote(''); setShowQuickApproveDialog(true) }}>
                                  <CheckCircle className="size-3.5" /> Quick Approve
                                </Button>
                                <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-8 text-[12px] border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400" disabled={!!actionLoading} onClick={() => { setQuickRejectCourseId(course.id); setQuickRejectNote(''); setShowQuickRejectDialog(true) }}>
                                  <XCircle className="size-3.5" /> Quick Reject
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="rounded-xl h-8 text-[12px] gap-1" disabled={!!actionLoading?.startsWith(course.id)}>
                                      <MoreHorizontal className="size-3.5" />
                                      <ChevronDown className="size-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="rounded-xl">
                                    <DropdownMenuItem onClick={() => { setFlagCourseId(course.id); setFlagReason(''); setShowFlagDialog(true) }}>
                                      <Flag className="size-3.5 mr-2 text-rose-500" /> Flag Course
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleMoreAction(course.id, 'assign')}>
                                      <UserPlus className="size-3.5 mr-2 text-sky-500" /> Assign to Me
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleMoreAction(course.id, 'escalate')}>
                                      <ArrowUpRight className="size-3.5 mr-2 text-amber-500" /> Escalate
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleViewDetail(course.id)}>
                                      <Eye className="size-3.5 mr-2 text-teal-500" /> View Details
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>

              {/* ── Pagination ── */}
              {pagination.totalPages > 1 && (
                <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] text-muted-foreground">
                        Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {formatNumber(pagination.total)}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8 rounded-lg"
                          disabled={pagination.page <= 1}
                          onClick={() => goToPage(pagination.page - 1)}
                        >
                          <ChevronLeft className="size-4" />
                        </Button>
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, idx) => {
                          const pageNum = Math.max(1, pagination.page - 2) + idx
                          if (pageNum > pagination.totalPages) return null
                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === pagination.page ? 'default' : 'outline'}
                              size="icon"
                              className={cn(
                                'size-8 rounded-lg text-[13px]',
                                pageNum === pagination.page && 'bg-teal-500 hover:bg-teal-600 text-white'
                              )}
                              onClick={() => goToPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-8 rounded-lg"
                          disabled={pagination.page >= pagination.totalPages}
                          onClick={() => goToPage(pagination.page + 1)}
                        >
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* ─── Quick Approve Dialog ─── */}
      <Dialog open={showQuickApproveDialog} onOpenChange={setShowQuickApproveDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="size-5 text-emerald-500" /> Quick Approve Course
            </DialogTitle>
            <DialogDescription>This course will be approved and published for students.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder="Optional note to instructor..."
              className="rounded-xl min-h-[80px] resize-none"
              value={quickApproveNote}
              onChange={(e) => setQuickApproveNote(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowQuickApproveDialog(false)}>Cancel</Button>
            <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" disabled={!!actionLoading} onClick={handleQuickApprove}>
              {actionLoading === 'quick-approve' ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Quick Reject Dialog ─── */}
      <Dialog open={showQuickRejectDialog} onOpenChange={setShowQuickRejectDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="size-5 text-red-500" /> Quick Reject Course
            </DialogTitle>
            <DialogDescription>This course will be rejected. The instructor will be notified.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder="Reason for rejection (required)..."
              className="rounded-xl min-h-[80px] resize-none"
              value={quickRejectNote}
              onChange={(e) => setQuickRejectNote(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowQuickRejectDialog(false)}>Cancel</Button>
            <Button className="rounded-xl bg-red-600 hover:bg-red-700 text-white gap-1.5" disabled={!!actionLoading || !quickRejectNote.trim()} onClick={handleQuickReject}>
              {actionLoading === 'quick-reject' ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
              Reject
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

      {/* ─── Bulk Approve Dialog ─── */}
      <Dialog open={showBulkApproveDialog} onOpenChange={setShowBulkApproveDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="size-5 text-emerald-500" /> Bulk Approve ({selectedIds.size})
            </DialogTitle>
            <DialogDescription>Approve {selectedIds.size} selected course(s).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder="Optional review note..."
              className="rounded-xl min-h-[80px] resize-none"
              value={bulkApproveNote}
              onChange={(e) => setBulkApproveNote(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowBulkApproveDialog(false)}>Cancel</Button>
            <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" disabled={!!actionLoading} onClick={() => { handleBulkAction('approve', bulkApproveNote); setShowBulkApproveDialog(false) }}>
              Approve {selectedIds.size} Courses
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Bulk Reject Dialog ─── */}
      <Dialog open={showBulkRejectDialog} onOpenChange={setShowBulkRejectDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="size-5 text-red-500" /> Bulk Reject ({selectedIds.size})
            </DialogTitle>
            <DialogDescription>Reject {selectedIds.size} selected course(s).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder="Reason for rejection (required)..."
              className="rounded-xl min-h-[80px] resize-none"
              value={bulkRejectNote}
              onChange={(e) => setBulkRejectNote(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowBulkRejectDialog(false)}>Cancel</Button>
            <Button className="rounded-xl bg-red-600 hover:bg-red-700 text-white gap-1.5" disabled={!!actionLoading || !bulkRejectNote.trim()} onClick={() => { handleBulkAction('reject', bulkRejectNote); setShowBulkRejectDialog(false) }}>
              Reject {selectedIds.size} Courses
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Bulk Request Changes Dialog ─── */}
      <Dialog open={showBulkChangesDialog} onOpenChange={setShowBulkChangesDialog}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="size-5 text-orange-500" /> Request Changes ({selectedIds.size})
            </DialogTitle>
            <DialogDescription>Request changes for {selectedIds.size} selected course(s).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              placeholder="Describe required changes (required)..."
              className="rounded-xl min-h-[80px] resize-none"
              value={bulkChangesNote}
              onChange={(e) => setBulkChangesNote(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowBulkChangesDialog(false)}>Cancel</Button>
            <Button className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white gap-1.5" disabled={!!actionLoading || !bulkChangesNote.trim()} onClick={() => { handleBulkAction('request_changes', bulkChangesNote); setShowBulkChangesDialog(false) }}>
              Request Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
