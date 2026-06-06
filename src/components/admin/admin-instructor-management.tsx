'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, Search, Download, Plus, Eye, Ban, CheckCircle,
  XCircle, AlertTriangle, Clock, Shield, MoreHorizontal,
  ChevronLeft, ChevronRight, Mail, Trash2, Loader2, AlertCircle,
  X, Send, ArrowUpDown, ArrowUp, ArrowDown, FileDown,
  Flag, Bell, ShieldCheck, UserX, ShieldAlert, TrendingUp,
  Calendar, Users, Star, CircleDollarSign, BookOpen, FlagOff,
  MessageSquare, FileText, ExternalLink, Columns3, ChevronDown,
  RefreshCw,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { toast } from 'sonner'
import { AdminStatCard, AdminStatCardGrid } from './admin-stat-card'
import { MobileFilterSheet, MobileFilterGroup } from '@/components/mobile-filter-sheet'

// ─── Types ──────────────────────────────────────────────────────────────────

interface InstructorItem {
  id: string
  name: string
  email: string
  avatar: string | null
  phone: string | null
  bio: string | null
  status: string
  isVerified: boolean
  flaggedReason: string | null
  lastActiveAt: string | null
  createdAt: string
  headline: string | null
  expertise: string | null
  applicationStatus: string | null
  ntn: string | null
  ntnVerified: boolean
  cnic: string | null
  linkedin: string | null
  website: string | null
  topicProposal: string | null
  appliedAt: string | null
  rejectionReason: string | null
  courseCount: number
  studentCount: number
  totalEarnings: number
  avgRating: number | null
}

interface InstructorStats {
  totalInstructors: number
  activeInstructors: number
  pendingApplications: number
  approvedThisMonth: number
  totalCourses: number
  totalStudents: number
  totalEarnings: number
  avgRating: number
}

interface ApplicationItem {
  id: string
  instructorId: string
  name: string
  email: string
  avatar: string | null
  phone: string | null
  headline: string | null
  linkedin: string | null
  website: string | null
  expertise: string | null
  ntn: string | null
  ntnVerified: boolean
  cnic: string | null
  topicProposal: string | null
  sampleOutline: string | null
  applicationStatus: string
  appliedAt: string
  reviewedAt: string | null
  rejectionReason: string | null
}

type InstructorTab = 'all' | 'applications' | 'flagged'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatNumber(num: number | undefined | null): string {
  if (num == null) return '0'
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return num.toLocaleString()
}

function formatCurrency(amount: number | undefined | null): string {
  return `$${formatNumber(amount)}`
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

// ─── Config Maps ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { dot: string; label: string; icon: React.ReactNode; color: string }> = {
  active: {
    dot: 'bg-emerald-500',
    label: 'Active',
    icon: <div className="size-2.5 rounded-full bg-emerald-500" />,
    color: 'text-emerald-600',
  },
  suspended: {
    dot: 'bg-amber-500',
    label: 'Suspended',
    icon: <div className="size-2.5 rounded-full bg-amber-500" />,
    color: 'text-amber-600',
  },
  banned: {
    dot: 'bg-red-600',
    label: 'Banned',
    icon: <XCircle className="size-3.5 text-red-600" />,
    color: 'text-red-600',
  },
  pending_verification: {
    dot: 'bg-teal-500',
    label: 'Pending',
    icon: <Clock className="size-3.5 text-teal-500" />,
    color: 'text-teal-600',
  },
  flagged: {
    dot: 'bg-orange-500',
    label: 'Flagged',
    icon: <AlertTriangle className="size-3.5 text-orange-500" />,
    color: 'text-orange-600',
  },
}

const APP_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
  approved: { label: 'Approved', color: 'text-emerald-600', bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
  rejected: { label: 'Rejected', color: 'text-red-600', bg: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' },
  more_info_requested: { label: 'Info Requested', color: 'text-teal-600', bg: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400' },
}

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

type SortField = 'name' | 'createdAt' | 'lastActiveAt' | 'courseCount' | 'studentCount' | 'totalEarnings' | 'avgRating'
type SortOrder = 'asc' | 'desc'



// ─── Main Component ─────────────────────────────────────────────────────────

export function AdminInstructorManagement() {
  const { setCurrentView, setSelectedInstructorId } = useAppStore()

  // ── State: Active Tab ──
  const [activeTab, setActiveTab] = useState<InstructorTab>('all')

  // ── State: Instructors List ──
  const [instructors, setInstructors] = useState<InstructorItem[]>([])
  const [stats, setStats] = useState<InstructorStats | null>(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── State: Applications ──
  const [applications, setApplications] = useState<ApplicationItem[]>([])
  const [appLoading, setAppLoading] = useState(true)
  const [appFilter, setAppFilter] = useState('all')

  // ── State: Filters ──
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [appStatusFilter, setAppStatusFilter] = useState('all')
  const [ntnVerifiedFilter, setNtnVerifiedFilter] = useState('all')
  const [hasCoursesFilter, setHasCoursesFilter] = useState('all')
  const [joinedAfter, setJoinedAfter] = useState('')
  const [joinedBefore, setJoinedBefore] = useState('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // ── State: Selection ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // ── State: Add Instructor Dialog ──
  const [addInstructorOpen, setAddInstructorOpen] = useState(false)
  const [addInstructorMode, setAddInstructorMode] = useState<'promote' | 'create'>('promote')
  const [addInstructorForm, setAddInstructorForm] = useState({
    name: '', email: '', phone: '', bio: '', expertise: '', headline: '', sendWelcomeEmail: true,
  })
  const [addInstructorSubmitting, setAddInstructorSubmitting] = useState(false)
  const [createdPassword, setCreatedPassword] = useState<string | null>(null)

  // ── State: Confirmation Dialog ──
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    confirmLabel: string
    variant: 'default' | 'destructive'
    onConfirm: () => void
  }>({ open: false, title: '', description: '', confirmLabel: 'Confirm', variant: 'default', onConfirm: () => {} })

  // ── State: Send Notification Dialog ──
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [notifyForm, setNotifyForm] = useState({ title: '', content: '', icon: '📢' })
  const [notifySending, setNotifySending] = useState(false)

  // ── State: Application Action Dialog ──
  const [appActionDialog, setAppActionDialog] = useState<{
    open: boolean
    action: 'approve' | 'reject' | 'request_more_info' | null
    application: ApplicationItem | null
    rejectionReason: string
  }>({ open: false, action: null, application: null, rejectionReason: '' })
  const [appActionLoading, setAppActionLoading] = useState(false)

  // ── State: Action loading ──
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // ── State: Row action dropdown ──
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)

  // ── State: More filters expanded ──
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false)

  // ── Refs ──
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // ── Active filter count ──
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (statusFilter && statusFilter !== 'all') count++
    if (appStatusFilter && appStatusFilter !== 'all') count++
    if (ntnVerifiedFilter && ntnVerifiedFilter !== 'all') count++
    if (hasCoursesFilter && hasCoursesFilter !== 'all') count++
    if (joinedAfter) count++
    if (joinedBefore) count++
    if (debouncedSearch) count++
    return count
  }, [statusFilter, appStatusFilter, ntnVerifiedFilter, hasCoursesFilter, joinedAfter, joinedBefore, debouncedSearch])

  // ── Fetch Instructors ──
  const fetchInstructors = useCallback(async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
        search: debouncedSearch,
        status: statusFilter === 'all' ? '' : statusFilter,
        applicationStatus: appStatusFilter === 'all' ? '' : appStatusFilter,
        ntnVerified: ntnVerifiedFilter === 'all' ? '' : ntnVerifiedFilter,
        hasCourses: hasCoursesFilter === 'all' ? '' : hasCoursesFilter,
        joinedAfter,
        joinedBefore,
        sortField,
        sortOrder,
      })
      const res = await fetch(`/api/admin/instructors?${params}`)
      if (!res.ok) throw new Error('Failed to fetch instructors')
      const data = await res.json()
      const mapped: InstructorItem[] = (data.instructors || []).map((inst: Record<string, any>) => ({
        id: inst.id,
        name: inst.name,
        email: inst.email,
        avatar: inst.avatar ?? null,
        phone: inst.phone ?? null,
        bio: inst.bio ?? null,
        status: inst.status ?? 'active',
        isVerified: inst.isVerified ?? false,
        flaggedReason: inst.flaggedReason ?? null,
        lastActiveAt: inst.lastActiveAt ?? null,
        createdAt: inst.createdAt,
        headline: inst.instructorProfile?.headline ?? null,
        expertise: inst.instructorProfile?.expertise ?? null,
        applicationStatus: inst.instructorProfile?.applicationStatus ?? null,
        ntn: inst.instructorProfile?.ntn ?? null,
        ntnVerified: inst.instructorProfile?.ntnVerified ?? false,
        cnic: inst.instructorProfile?.cnic ?? null,
        linkedin: inst.instructorProfile?.linkedin ?? null,
        website: inst.instructorProfile?.website ?? null,
        topicProposal: inst.instructorProfile?.topicProposal ?? null,
        appliedAt: inst.instructorProfile?.appliedAt ?? null,
        rejectionReason: inst.instructorProfile?.rejectionReason ?? null,
        courseCount: inst.courseStats?.totalCourses ?? 0,
        studentCount: inst.totalStudents ?? 0,
        totalEarnings: inst.totalEarnings ?? 0,
        avgRating: inst.courseStats?.avgRating ?? 0,
      }))
      setInstructors(mapped)
      const rawStats = data.stats || {}
      setStats({
        totalInstructors: rawStats.totalInstructors ?? 0,
        activeInstructors: rawStats.activeInstructors ?? 0,
        pendingApplications: rawStats.pendingApplications ?? 0,
        approvedThisMonth: rawStats.approvedThisMonth ?? 0,
        totalCourses: rawStats.totalCourses ?? 0,
        totalStudents: rawStats.totalStudents ?? 0,
        totalEarnings: rawStats.totalEarnings ?? 0,
        avgRating: rawStats.avgRating ?? 0,
      })
      setPagination(prev => data.pagination ? { ...prev, ...data.pagination } : { ...prev, page, total: 0, totalPages: 0 })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load instructors')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter, appStatusFilter, ntnVerifiedFilter, hasCoursesFilter, joinedAfter, joinedBefore, sortField, sortOrder, pagination.limit])

  // ── Fetch Applications ──
  const fetchApplications = useCallback(async () => {
    setAppLoading(true)
    try {
      const res = await fetch('/api/admin/instructor-applications')
      if (!res.ok) throw new Error('Failed to fetch applications')
      const data = await res.json()
      setApplications(data.applications || [])
    } catch (err) {
      toast.error('Failed to load applications')
    } finally {
      setAppLoading(false)
    }
  }, [])

  // ── Effects ──
  useEffect(() => {
    fetchInstructors(1)
  }, [fetchInstructors])

  useEffect(() => {
    if (activeTab === 'applications') {
      fetchApplications()
    }
  }, [activeTab, fetchApplications])

  // ── Debounced search ──
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(value)
    }, 300)
  }, [])

  // ── Sort handler ──
  const handleSort = useCallback((field: SortField) => {
    setSortField(prev => {
      if (prev === field) {
        setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
        return field
      }
      setSortOrder('desc')
      return field
    })
  }, [])

  // ── Sort icon ──
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="size-3 opacity-40" />
    return sortOrder === 'asc' ? <ArrowUp className="size-3 text-violet-600" /> : <ArrowDown className="size-3 text-violet-600" />
  }

  // ── Clear all filters ──
  const clearAllFilters = useCallback(() => {
    setSearch('')
    setDebouncedSearch('')
    setStatusFilter('all')
    setAppStatusFilter('all')
    setNtnVerifiedFilter('all')
    setHasCoursesFilter('all')
    setJoinedAfter('')
    setJoinedBefore('')
    setSortField('createdAt')
    setSortOrder('desc')
  }, [])

  // ── Pagination ──
  const goToPage = useCallback((page: number) => {
    fetchInstructors(page)
  }, [fetchInstructors])

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
    if (selectedIds.size === instructors.length && instructors.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(instructors.map(u => u.id)))
    }
  }, [instructors, selectedIds.size])

  const allSelected = instructors.length > 0 && selectedIds.size === instructors.length

  // ── Navigate to instructor detail ──
  const handleViewInstructor = useCallback((instructorId: string) => {
    setSelectedInstructorId(instructorId)
    setCurrentView('admin-instructor-detail' as any)
  }, [setCurrentView, setSelectedInstructorId])

  // ── Instructor Action ──
  const handleInstructorAction = useCallback(async (instructorId: string, action: string, data?: any) => {
    setActionLoading(`${instructorId}-${action}`)
    try {
      const res = await fetch(`/api/admin/instructors/${instructorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Action "${action}" failed`)
      }
      const result = await res.json()
      toast.success(`Instructor ${action} successful`)
      if (action === 'delete') {
        setSelectedIds(prev => {
          const next = new Set(prev)
          next.delete(instructorId)
          return next
        })
      }
      fetchInstructors(pagination.page)
      return result
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Action "${action}" failed`)
    } finally {
      setActionLoading(null)
    }
  }, [fetchInstructors, pagination.page])

  // ── Confirm Action ──
  const confirmAction = useCallback((title: string, description: string, onConfirm: () => void, variant: 'default' | 'destructive' = 'destructive', confirmLabel = 'Confirm') => {
    setConfirmDialog({ open: true, title, description, confirmLabel, variant, onConfirm })
  }, [])

  // ── Suspend ──
  const handleSuspend = useCallback((inst: InstructorItem) => {
    confirmAction(
      'Suspend Instructor',
      `Are you sure you want to suspend ${inst.name}? They will lose access immediately and their courses will remain published.`,
      () => handleInstructorAction(inst.id, 'suspend'),
      'destructive',
      'Suspend'
    )
  }, [confirmAction, handleInstructorAction])

  // ── Delete ──
  const handleDelete = useCallback((inst: InstructorItem) => {
    confirmAction(
      'Delete Instructor',
      `Are you sure you want to delete ${inst.name}? All their courses will be archived. This cannot be undone.`,
      () => handleInstructorAction(inst.id, 'delete'),
      'destructive',
      'Delete'
    )
  }, [confirmAction, handleInstructorAction])

  // ── Bulk Action ──
  const handleBulkAction = useCallback(async (action: string) => {
    if (selectedIds.size === 0) return
    const actionLabels: Record<string, string> = {
      suspend: 'Suspend', unsuspend: 'Unsuspend', verify: 'Verify',
      delete: 'Delete', export: 'Export', send_notification: 'Send Notification',
      flag: 'Flag',
    }
    confirmAction(
      `Bulk ${actionLabels[action] || action}`,
      `Apply ${actionLabels[action] || action} to ${selectedIds.size} instructors?`,
      async () => {
        setActionLoading(`bulk-${action}`)
        try {
          const res = await fetch('/api/admin/instructors/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, instructorIds: Array.from(selectedIds) }),
          })
          if (!res.ok) throw new Error(`Bulk action "${action}" failed`)
          toast.success(`Bulk ${actionLabels[action] || action} applied to ${selectedIds.size} instructors`)
          setSelectedIds(new Set())
          fetchInstructors(pagination.page)
        } catch (err) {
          toast.error(err instanceof Error ? err.message : `Bulk action "${action}" failed`)
        } finally {
          setActionLoading(null)
        }
      },
      action === 'delete' || action === 'suspend' ? 'destructive' : 'default',
      actionLabels[action] || 'Confirm'
    )
  }, [selectedIds, fetchInstructors, pagination.page, confirmAction])

  // ── Add Instructor ──
  const handleAddInstructor = useCallback(async () => {
    if (addInstructorMode === 'promote') {
      if (!addInstructorForm.email.trim()) {
        toast.error('Email is required to promote a user')
        return
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(addInstructorForm.email)) {
        toast.error('Please enter a valid email address')
        return
      }
    } else {
      if (!addInstructorForm.name.trim() || !addInstructorForm.email.trim()) {
        toast.error('Name and email are required')
        return
      }
    }
    setAddInstructorSubmitting(true)
    setCreatedPassword(null)
    try {
      const res = await fetch('/api/admin/instructors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: addInstructorMode,
          name: addInstructorForm.name,
          email: addInstructorForm.email,
          phone: addInstructorForm.phone,
          bio: addInstructorForm.bio,
          expertise: addInstructorForm.expertise,
          headline: addInstructorForm.headline,
          sendWelcomeEmail: addInstructorForm.sendWelcomeEmail,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to add instructor')
      }
      const data = await res.json()
      if (data.temporaryPassword) {
        setCreatedPassword(data.temporaryPassword)
      }
      toast.success(data.message || `Instructor ${addInstructorMode === 'promote' ? 'promoted' : 'created'} successfully`)
      fetchInstructors(1)
      if (!data.temporaryPassword) {
        setAddInstructorOpen(false)
        setAddInstructorForm({ name: '', email: '', phone: '', bio: '', expertise: '', headline: '', sendWelcomeEmail: true })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add instructor')
    } finally {
      setAddInstructorSubmitting(false)
    }
  }, [addInstructorForm, addInstructorMode, fetchInstructors])

  // ── Export ──
  const handleExport = useCallback((format: 'csv' | 'json') => {
    const params = new URLSearchParams({
      format,
      status: statusFilter === 'all' ? '' : statusFilter,
      applicationStatus: appStatusFilter === 'all' ? '' : appStatusFilter,
      search: debouncedSearch,
    })
    window.open(`/api/admin/users/export?${params}&role=instructor`, '_blank')
    toast.success(`Exporting instructors as ${format.toUpperCase()}...`)
  }, [statusFilter, appStatusFilter, debouncedSearch])

  // ── Send Notification ──
  const handleSendNotification = useCallback(async () => {
    if (!notifyForm.title.trim() || !notifyForm.content.trim()) {
      toast.error('Title and content are required')
      return
    }
    setNotifySending(true)
    try {
      const res = await fetch('/api/admin/instructors/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_notification',
          instructorIds: Array.from(selectedIds),
          notification: notifyForm,
        }),
      })
      if (!res.ok) throw new Error('Failed to send notification')
      toast.success(`Notification sent to ${selectedIds.size} instructors`)
      setNotifyOpen(false)
      setNotifyForm({ title: '', content: '', icon: '📢' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send notification')
    } finally {
      setNotifySending(false)
    }
  }, [notifyForm, selectedIds])

  // ── Application Actions ──
  const handleApplicationAction = useCallback(async () => {
    if (!appActionDialog.action || !appActionDialog.application) return
    if (appActionDialog.action === 'reject' && !appActionDialog.rejectionReason.trim()) {
      toast.error('Rejection reason is required')
      return
    }
    setAppActionLoading(true)
    try {
      const res = await fetch(`/api/admin/instructor-applications/${appActionDialog.application.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: appActionDialog.action,
          rejectionReason: appActionDialog.action === 'reject' ? appActionDialog.rejectionReason : undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to process application')
      }
      const result = await res.json()
      toast.success(result.message || `Application ${appActionDialog.action} successful`)
      setAppActionDialog({ open: false, action: null, application: null, rejectionReason: '' })
      fetchApplications()
      fetchInstructors(pagination.page)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to process application')
    } finally {
      setAppActionLoading(false)
    }
  }, [appActionDialog, fetchApplications, fetchInstructors, pagination.page])

  // ── Emoji picker options ──
  const emojiOptions = ['📢', '🔔', '🎉', '⚠️', '💡', '📝', '🚀', '❤️', '🎯', '✅', '🎓', '💼']

  // ── Page numbers ──
  const pageNumbers = useMemo(() => {
    const pages: number[] = []
    const start = Math.max(1, pagination.page - 2)
    const end = Math.min(pagination.totalPages, pagination.page + 2)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }, [pagination.page, pagination.totalPages])

  // ── Filtered applications ──
  const filteredApplications = useMemo(() => {
    if (appFilter === 'all') return applications
    return applications.filter(app => app.applicationStatus === appFilter)
  }, [applications, appFilter])

  // ── Flagged instructors ──
  const flaggedInstructors = useMemo(() => {
    return instructors.filter(inst => inst.status === 'flagged' || inst.flaggedReason)
  }, [instructors])

  // ── Status pill options ──
  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'banned', label: 'Banned' },
    { value: 'pending_verification', label: 'Pending' },
    { value: 'flagged', label: 'Flagged' },
  ]

  // ── App status pill options ──
  const appStatusOptions = [
    { value: 'all', label: 'All' },
    { value: 'approved', label: 'Approved' },
    { value: 'pending', label: 'Pending' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'more_info_requested', label: 'Info Needed' },
  ]

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={springTransition}
      className="space-y-5"
    >
      {/* ─── Header Section ─── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-sm">
            <GraduationCap className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Instructor Management</h1>
            <p className="text-sm text-muted-foreground">Manage instructors, applications, and performance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-lg gap-1.5 h-9" onClick={() => handleExport('csv')}>
            <FileDown className="size-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button size="sm" className="rounded-lg gap-1.5 h-9" onClick={() => { setAddInstructorOpen(true); setCreatedPassword(null) }}>
            <Plus className="size-3.5" />
            Add Instructor
          </Button>
        </div>
      </div>

      {/* ─── Compact Stats Section (4 cards matching users page) ─── */}
      <AdminStatCardGrid columns={4}>
        <AdminStatCard
          icon={GraduationCap}
          label="Total Instructors"
          value={formatNumber(stats?.totalInstructors ?? 0)}
          color="violet"
          subLabel={`Active: ${stats?.activeInstructors ?? 0}`}
          trend={8}
        />
        <AdminStatCard
          icon={Clock}
          label="Pending Applications"
          value={formatNumber(stats?.pendingApplications ?? 0)}
          color="amber"
          trend={-5}
        />
        <AdminStatCard
          icon={BookOpen}
          label="Total Courses"
          value={formatNumber(stats?.totalCourses ?? 0)}
          color="teal"
          trend={10}
        />
        <AdminStatCard
          icon={CircleDollarSign}
          label="Total Earnings"
          value={formatNumber(stats?.totalEarnings ?? 0)}
          color="emerald"
          subLabel="USD"
          trend={22}
        />
      </AdminStatCardGrid>

      {/* ─── Tabs ─── */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as InstructorTab)}>
        <TabsList className="bg-muted/50 rounded-xl h-10 p-1">
          <TabsTrigger value="all" className="rounded-lg text-[13px] gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            All Instructors
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 rounded-md ml-1">
              {stats?.totalInstructors ?? 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="applications" className="rounded-lg text-[13px] gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Applications
            {(stats?.pendingApplications ?? 0) > 0 && (
              <Badge className="text-[10px] h-4 px-1.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 ml-1">
                {stats?.pendingApplications ?? 0}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="flagged" className="rounded-lg text-[13px] gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Flagged
          </TabsTrigger>
        </TabsList>

        {/* ═══════ TAB 1: All Instructors ═══════ */}
        <TabsContent value="all" className="space-y-4 mt-4">
          {/* ─── Search & Filter Bar ─── */}
          <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative w-full md:flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    className="pl-9 rounded-xl h-9"
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>

                {/* Mobile: Filter button + Sheet */}
                <MobileFilterSheet
                  activeCount={activeFilterCount}
                  onClearAll={clearAllFilters}
                >
                  <MobileFilterGroup label="Status">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full h-10 text-[13px] rounded-lg">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="banned">Banned</SelectItem>
                        <SelectItem value="pending_verification">Pending</SelectItem>
                        <SelectItem value="flagged">Flagged</SelectItem>
                      </SelectContent>
                    </Select>
                  </MobileFilterGroup>
                  <MobileFilterGroup label="Application Status">
                    <Select value={appStatusFilter} onValueChange={setAppStatusFilter}>
                      <SelectTrigger className="w-full h-10 text-[13px] rounded-lg">
                        <SelectValue placeholder="All Apps" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Apps</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="more_info_requested">Info Needed</SelectItem>
                      </SelectContent>
                    </Select>
                  </MobileFilterGroup>
                  <MobileFilterGroup label="Has Courses">
                    <Select value={hasCoursesFilter} onValueChange={setHasCoursesFilter}>
                      <SelectTrigger className="w-full h-10 text-[13px] rounded-lg">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="true">Has Courses</SelectItem>
                        <SelectItem value="false">No Courses</SelectItem>
                      </SelectContent>
                    </Select>
                  </MobileFilterGroup>
                  <MobileFilterGroup label="Sort By">
                    <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
                      <SelectTrigger className="w-full h-10 text-[13px] rounded-lg">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="createdAt">Join Date</SelectItem>
                        <SelectItem value="lastActiveAt">Last Active</SelectItem>
                        <SelectItem value="courseCount">Courses</SelectItem>
                        <SelectItem value="studentCount">Students</SelectItem>
                        <SelectItem value="totalEarnings">Earnings</SelectItem>
                        <SelectItem value="avgRating">Rating</SelectItem>
                      </SelectContent>
                    </Select>
                  </MobileFilterGroup>
                  <MobileFilterGroup label="NTN Verified">
                    <Select value={ntnVerifiedFilter} onValueChange={setNtnVerifiedFilter}>
                      <SelectTrigger className="w-full h-10 text-[13px] rounded-lg">
                        <SelectValue placeholder="All NTN" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="true">Verified</SelectItem>
                        <SelectItem value="false">Unverified</SelectItem>
                      </SelectContent>
                    </Select>
                  </MobileFilterGroup>
                  <MobileFilterGroup label="Joined After">
                    <Input
                      type="date"
                      value={joinedAfter}
                      onChange={(e) => setJoinedAfter(e.target.value)}
                      className="w-full h-10 text-[13px] rounded-lg"
                    />
                  </MobileFilterGroup>
                  <MobileFilterGroup label="Joined Before">
                    <Input
                      type="date"
                      value={joinedBefore}
                      onChange={(e) => setJoinedBefore(e.target.value)}
                      className="w-full h-10 text-[13px] rounded-lg"
                    />
                  </MobileFilterGroup>
                </MobileFilterSheet>

                {/* Desktop: Inline Filter Selects */}
                <div className="hidden md:flex gap-2 items-center">
                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[120px] rounded-xl h-9" size="sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="banned">Banned</SelectItem>
                      <SelectItem value="pending_verification">Pending</SelectItem>
                      <SelectItem value="flagged">Flagged</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort Select */}
                  <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
                    <SelectTrigger className="w-[130px] rounded-xl h-9" size="sm">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="createdAt">Join Date</SelectItem>
                      <SelectItem value="lastActiveAt">Last Active</SelectItem>
                      <SelectItem value="courseCount">Courses</SelectItem>
                      <SelectItem value="studentCount">Students</SelectItem>
                      <SelectItem value="totalEarnings">Earnings</SelectItem>
                      <SelectItem value="avgRating">Rating</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort Order Toggle */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className={cn(
                          'size-9 rounded-xl shrink-0',
                          sortOrder === 'asc' && 'text-violet-600 border-violet-300 dark:border-violet-700'
                        )}
                        onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                      >
                        {sortOrder === 'asc' ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Sort {sortOrder === 'asc' ? 'Ascending' : 'Descending'}</TooltipContent>
                  </Tooltip>

                  {/* Refresh */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl size-9 p-0"
                        onClick={() => fetchInstructors(pagination.page)}
                      >
                        <RefreshCw className="size-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Refresh data</TooltipContent>
                  </Tooltip>

                  {/* Clear Filters */}
                  {activeFilterCount > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl h-9 gap-1.5 text-muted-foreground hover:text-foreground"
                          onClick={clearAllFilters}
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


            </CardContent>
          </Card>

          {/* ─── Bulk Actions Bar (violet accent, matching users page) ─── */}
          <AnimatePresence>
            {selectedIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="overflow-hidden"
              >
                <Card className="rounded-xl shadow-sm border-2 border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20">
                  <CardContent className="p-3 flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                      <span className="text-[13px] font-medium">{selectedIds.size} selected</span>
                      <Button variant="ghost" size="sm" className="h-7 text-[11px] rounded-lg" onClick={() => setSelectedIds(new Set())}>
                        Deselect all
                      </Button>
                    </div>
                    <Separator orientation="vertical" className="h-6" />
                    <div className="flex gap-1.5 flex-wrap">
                      <Button size="sm" variant="outline" className="rounded-lg gap-1.5 h-8 text-[12px]" onClick={() => handleBulkAction('suspend')} disabled={actionLoading?.startsWith('bulk')}>
                        <Ban className="size-3" /> Suspend
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-lg gap-1.5 h-8 text-[12px]" onClick={() => handleBulkAction('unsuspend')} disabled={actionLoading?.startsWith('bulk')}>
                        <CheckCircle className="size-3" /> Unsuspend
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-lg gap-1.5 h-8 text-[12px]" onClick={() => handleBulkAction('verify')} disabled={actionLoading?.startsWith('bulk')}>
                        <ShieldCheck className="size-3" /> Verify
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-lg gap-1.5 h-8 text-[12px]" onClick={() => handleBulkAction('flag')} disabled={actionLoading?.startsWith('bulk')}>
                        <Flag className="size-3" /> Flag
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-lg gap-1.5 h-8 text-[12px]" onClick={() => setNotifyOpen(true)} disabled={actionLoading?.startsWith('bulk')}>
                        <Bell className="size-3" /> Notify
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-lg gap-1.5 h-8 text-[12px]" onClick={() => handleExport('csv')}>
                        <Download className="size-3" /> Export
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-lg gap-1.5 h-8 text-[12px] text-red-600 hover:text-red-700" onClick={() => handleBulkAction('delete')} disabled={actionLoading?.startsWith('bulk')}>
                        <Trash2 className="size-3" /> Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Instructors Table (Desktop - md:block) ─── */}
          <Card className="rounded-xl shadow-sm overflow-hidden hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[40px] pl-4">
                    <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                  </TableHead>
                  <TableHead className="min-w-[220px]">
                    <button className="flex items-center gap-1 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors" onClick={() => handleSort('name')}>
                      Instructor <SortIcon field="name" />
                    </button>
                  </TableHead>
                  <TableHead className="w-[90px]">
                    <span className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Status</span>
                  </TableHead>
                  <TableHead className="w-[140px] hidden xl:table-cell">
                    <button className="flex items-center gap-1 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors" onClick={() => handleSort('courseCount')}>
                      Courses/Students <SortIcon field="courseCount" />
                    </button>
                  </TableHead>
                  <TableHead className="w-[100px] hidden lg:table-cell">
                    <button className="flex items-center gap-1 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors" onClick={() => handleSort('totalEarnings')}>
                      Earnings <SortIcon field="totalEarnings" />
                    </button>
                  </TableHead>
                  <TableHead className="w-[70px] hidden xl:table-cell">
                    <button className="flex items-center gap-1 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors" onClick={() => handleSort('avgRating')}>
                      Rating <SortIcon field="avgRating" />
                    </button>
                  </TableHead>
                  <TableHead className="w-[90px] hidden xl:table-cell">
                    <span className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">NTN</span>
                  </TableHead>
                  <TableHead className="w-[100px] hidden lg:table-cell">
                    <button className="flex items-center gap-1 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors" onClick={() => handleSort('lastActiveAt')}>
                      Last Active <SortIcon field="lastActiveAt" />
                    </button>
                  </TableHead>
                  <TableHead className="w-[50px] text-right pr-4">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-4"><Skeleton className="size-4 rounded" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-9 rounded-xl" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-4 w-32 rounded-lg" />
                            <Skeleton className="h-3 w-48 rounded-lg" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded-lg" /></TableCell>
                      <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-24 rounded-lg" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20 rounded-lg" /></TableCell>
                      <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-12 rounded-lg" /></TableCell>
                      <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-16 rounded-lg" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-16 rounded-lg" /></TableCell>
                      <TableCell className="text-right pr-4"><Skeleton className="size-7 rounded-lg ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <AlertCircle className="size-10 text-red-400" />
                        <p className="text-[15px] font-medium">Failed to load instructors</p>
                        <p className="text-[13px] text-muted-foreground">{error}</p>
                        <Button variant="outline" size="sm" className="rounded-lg" onClick={() => fetchInstructors(1)}>
                          Retry
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : instructors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <GraduationCap className="size-10 text-muted-foreground/30" />
                        <p className="text-[15px] font-medium">No instructors found</p>
                        <p className="text-[13px] text-muted-foreground">Try adjusting your search or filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {instructors.map((inst, i) => {
                      const statusConf = STATUS_CONFIG[inst.status] || STATUS_CONFIG.active
                      const appStatusConf = APP_STATUS_CONFIG[inst.applicationStatus || 'pending'] || APP_STATUS_CONFIG.pending
                      const isSelected = selectedIds.has(inst.id)

                      return (
                        <TableRow
                          key={inst.id}
                          className={cn(
                            'cursor-pointer transition-colors',
                            isSelected && 'bg-violet-50/60 dark:bg-violet-950/15',
                            'hover:bg-muted/30'
                          )}
                          onClick={() => handleViewInstructor(inst.id)}
                        >
                          {/* Checkbox */}
                          <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                            <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(inst.id)} />
                          </TableCell>

                          {/* Avatar + Name + Email + Headline */}
                          <TableCell>
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="size-9 rounded-xl shrink-0">
                                <AvatarImage src={inst.avatar || undefined} />
                                <AvatarFallback className="text-[11px] bg-violet-500/10 text-violet-600 rounded-xl">
                                  {getInitials(inst.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-[13px] font-semibold truncate">{inst.name}</p>
                                  {inst.flaggedReason && (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <AlertTriangle className="size-3 text-orange-500 shrink-0" />
                                      </TooltipTrigger>
                                      <TooltipContent>{inst.flaggedReason}</TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate">{inst.email}</p>
                                {inst.headline && (
                                  <p className="text-[10px] text-muted-foreground/70 truncate">{inst.headline}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {statusConf.icon}
                              <span className={cn('text-[11px] font-medium', statusConf.color)}>{statusConf.label}</span>
                            </div>
                          </TableCell>

                          {/* Courses/Students */}
                          <TableCell className="hidden xl:table-cell">
                            <span className="text-[12px] font-medium">
                              {inst.courseCount} courses • {formatNumber(inst.studentCount)} students
                            </span>
                          </TableCell>

                          {/* Earnings */}
                          <TableCell className="hidden lg:table-cell">
                            <span className="text-[12px] font-medium text-emerald-600">{formatCurrency(inst.totalEarnings)}</span>
                          </TableCell>

                          {/* Rating */}
                          <TableCell className="hidden xl:table-cell">
                            <div className="flex items-center gap-0.5">
                              <Star className="size-3 text-amber-400 fill-amber-400" />
                              <span className="text-[12px] font-medium">{(inst.avgRating ?? 0).toFixed(1)}</span>
                            </div>
                          </TableCell>

                          {/* NTN */}
                          <TableCell className="hidden xl:table-cell">
                            {inst.ntnVerified ? (
                              <Badge className="text-[10px] rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 gap-0.5">
                                <ShieldCheck className="size-2.5" /> Verified
                              </Badge>
                            ) : inst.ntn ? (
                              <Badge className="text-[10px] rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 gap-0.5">
                                <Shield className="size-2.5" /> Unverified
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">None</span>
                            )}
                          </TableCell>

                          {/* Last Active */}
                          <TableCell className="hidden lg:table-cell">
                            <span className="text-[11px] text-muted-foreground">{timeAgo(inst.lastActiveAt)}</span>
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu open={openDropdownId === inst.id} onOpenChange={(open) => setOpenDropdownId(open ? inst.id : null)}>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-7 rounded-lg">
                                  <MoreHorizontal className="size-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl w-48">
                                <DropdownMenuItem className="gap-2 text-[13px]" onClick={() => handleViewInstructor(inst.id)}>
                                  <Eye className="size-3.5" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 text-[13px]" onClick={() => handleViewInstructor(inst.id)}>
                                  <ExternalLink className="size-3.5" /> Edit Profile
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {inst.status === 'active' && (
                                  <DropdownMenuItem className="gap-2 text-[13px] text-amber-600" onClick={() => handleSuspend(inst)} disabled={actionLoading === `${inst.id}-suspend`}>
                                    {actionLoading === `${inst.id}-suspend` ? <Loader2 className="size-3.5 animate-spin" /> : <Ban className="size-3.5" />} Suspend
                                  </DropdownMenuItem>
                                )}
                                {inst.status === 'suspended' && (
                                  <DropdownMenuItem className="gap-2 text-[13px] text-emerald-600" onClick={() => handleInstructorAction(inst.id, 'unsuspend')} disabled={actionLoading === `${inst.id}-unsuspend`}>
                                    {actionLoading === `${inst.id}-unsuspend` ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle className="size-3.5" />} Unsuspend
                                  </DropdownMenuItem>
                                )}
                                {!inst.isVerified && (
                                  <DropdownMenuItem className="gap-2 text-[13px] text-teal-600" onClick={() => handleInstructorAction(inst.id, 'verify')} disabled={actionLoading === `${inst.id}-verify`}>
                                    {actionLoading === `${inst.id}-verify` ? <Loader2 className="size-3.5 animate-spin" /> : <ShieldCheck className="size-3.5" />} Verify NTN
                                  </DropdownMenuItem>
                                )}
                                {inst.status !== 'flagged' ? (
                                  <DropdownMenuItem className="gap-2 text-[13px] text-orange-600" onClick={() => handleInstructorAction(inst.id, 'flag', { reason: 'Flagged by admin' })} disabled={actionLoading === `${inst.id}-flag`}>
                                    {actionLoading === `${inst.id}-flag` ? <Loader2 className="size-3.5 animate-spin" /> : <Flag className="size-3.5" />} Flag
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem className="gap-2 text-[13px] text-emerald-600" onClick={() => handleInstructorAction(inst.id, 'unflag')} disabled={actionLoading === `${inst.id}-unflag`}>
                                    {actionLoading === `${inst.id}-unflag` ? <Loader2 className="size-3.5 animate-spin" /> : <FlagOff className="size-3.5" />} Unflag
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="gap-2 text-[13px]" onClick={() => handleInstructorAction(inst.id, 'reset_password')} disabled={actionLoading === `${inst.id}-reset_password`}>
                                  {actionLoading === `${inst.id}-reset_password` ? <Loader2 className="size-3.5 animate-spin" /> : <Shield className="size-3.5" />} Reset Password
                                </DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 text-[13px] text-red-600" onClick={() => handleDelete(inst)} disabled={actionLoading === `${inst.id}-delete`}>
                                  {actionLoading === `${inst.id}-delete` ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />} Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </>
                )}
              </TableBody>
            </Table>

            {/* Pagination + Summary */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t gap-3">
              <div className="flex items-center gap-3">
                <p className="text-[12px] text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {formatNumber(pagination.total)} instructors • Page {pagination.page} of {pagination.totalPages || 1}
                </p>
                <Select
                  value={String(pagination.limit)}
                  onValueChange={(v) => {
                    setPagination(prev => ({ ...prev, limit: Number(v), page: 1 }))
                  }}
                >
                  <SelectTrigger className="w-[80px] rounded-lg h-8 text-[12px]" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / page</SelectItem>
                    <SelectItem value="20">20 / page</SelectItem>
                    <SelectItem value="50">50 / page</SelectItem>
                    <SelectItem value="100">100 / page</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {pagination.totalPages > 1 && (
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
                  {pagination.page > 3 && (
                    <>
                      <Button variant="outline" size="icon" className="size-8 rounded-lg text-[12px]" onClick={() => goToPage(1)}>1</Button>
                      {pagination.page > 4 && <span className="px-1 text-muted-foreground text-[12px]">...</span>}
                    </>
                  )}
                  {pageNumbers.map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.page ? 'default' : 'outline'}
                      size="icon"
                      className="size-8 rounded-lg text-[12px]"
                      onClick={() => goToPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  ))}
                  {pagination.page < pagination.totalPages - 2 && (
                    <>
                      {pagination.page < pagination.totalPages - 3 && <span className="px-1 text-muted-foreground text-[12px]">...</span>}
                      <Button variant="outline" size="icon" className="size-8 rounded-lg text-[12px]" onClick={() => goToPage(pagination.totalPages)}>{pagination.totalPages}</Button>
                    </>
                  )}
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
              )}
            </div>
          </Card>

          {/* ─── Mobile Card Layout (md:hidden) ─── */}
          <div className="md:hidden space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="rounded-xl shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-10 rounded-xl" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-32 rounded-lg" />
                        <Skeleton className="h-3 w-48 rounded-lg" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16 rounded-lg" />
                      <Skeleton className="h-5 w-16 rounded-lg" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : instructors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <GraduationCap className="size-10 text-muted-foreground/30" />
                <p className="text-[15px] font-medium">No instructors found</p>
                <p className="text-[13px] text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            ) : (
              instructors.map((inst, i) => {
                const statusConf = STATUS_CONFIG[inst.status] || STATUS_CONFIG.active
                const appStatusConf = APP_STATUS_CONFIG[inst.applicationStatus || 'pending'] || APP_STATUS_CONFIG.pending
                const isSelected = selectedIds.has(inst.id)

                return (
                  <motion.div
                    key={inst.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, ...springTransition }}
                  >
                    <Card className={cn('rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow', isSelected && 'border-2 border-violet-300 dark:border-violet-700 bg-violet-50/30 dark:bg-violet-950/10')}>
                      <CardContent className="p-4 space-y-3">
                        {/* Header */}
                        <div className="flex items-start gap-3">
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(inst.id)} />
                          </div>
                          <Avatar className="size-10 rounded-xl shrink-0" onClick={() => handleViewInstructor(inst.id)}>
                            <AvatarImage src={inst.avatar || undefined} />
                            <AvatarFallback className="text-[11px] bg-violet-500/10 text-violet-600 rounded-xl">
                              {getInitials(inst.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0" onClick={() => handleViewInstructor(inst.id)}>
                            <div className="flex items-center gap-2">
                              <p className="text-[14px] font-semibold truncate">{inst.name}</p>
                              {inst.flaggedReason && <AlertTriangle className="size-3.5 text-orange-500 shrink-0" />}
                            </div>
                            <p className="text-[12px] text-muted-foreground truncate">{inst.email}</p>
                            {inst.headline && <p className="text-[11px] text-muted-foreground/70 truncate">{inst.headline}</p>}
                          </div>
                          <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu open={openDropdownId === inst.id} onOpenChange={(open) => setOpenDropdownId(open ? inst.id : null)}>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8 rounded-lg">
                                  <MoreHorizontal className="size-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl w-48">
                                <DropdownMenuItem className="gap-2 text-[13px]" onClick={() => handleViewInstructor(inst.id)}>
                                  <Eye className="size-3.5" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {inst.status === 'active' && (
                                  <DropdownMenuItem className="gap-2 text-[13px] text-amber-600" onClick={() => handleSuspend(inst)}>
                                    <Ban className="size-3.5" /> Suspend
                                  </DropdownMenuItem>
                                )}
                                {inst.status === 'suspended' && (
                                  <DropdownMenuItem className="gap-2 text-[13px] text-emerald-600" onClick={() => handleInstructorAction(inst.id, 'unsuspend')}>
                                    <CheckCircle className="size-3.5" /> Unsuspend
                                  </DropdownMenuItem>
                                )}
                                {!inst.isVerified && (
                                  <DropdownMenuItem className="gap-2 text-[13px] text-teal-600" onClick={() => handleInstructorAction(inst.id, 'verify')}>
                                    <ShieldCheck className="size-3.5" /> Verify NTN
                                  </DropdownMenuItem>
                                )}
                                {inst.status !== 'flagged' ? (
                                  <DropdownMenuItem className="gap-2 text-[13px] text-orange-600" onClick={() => handleInstructorAction(inst.id, 'flag', { reason: 'Flagged by admin' })}>
                                    <Flag className="size-3.5" /> Flag
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem className="gap-2 text-[13px] text-emerald-600" onClick={() => handleInstructorAction(inst.id, 'unflag')}>
                                    <FlagOff className="size-3.5" /> Unflag
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="gap-2 text-[13px] text-red-600" onClick={() => handleDelete(inst)}>
                                  <Trash2 className="size-3.5" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Info Row */}
                        <div className="flex flex-wrap items-center gap-2 pl-8" onClick={() => handleViewInstructor(inst.id)}>
                          <div className="flex items-center gap-1.5">
                            {statusConf.icon}
                            <span className={cn('text-[11px] font-medium', statusConf.color)}>{statusConf.label}</span>
                          </div>
                          <Separator orientation="vertical" className="h-3" />
                          <span className="text-[11px] text-muted-foreground">{inst.courseCount} courses • {formatNumber(inst.studentCount)} students</span>
                          <Separator orientation="vertical" className="h-3" />
                          <div className="flex items-center gap-0.5">
                            <Star className="size-3 text-amber-400 fill-amber-400" />
                            <span className="text-[11px] font-medium">{(inst.avgRating ?? 0).toFixed(1)}</span>
                          </div>
                        </div>

                        {/* Earnings & NTN & Last Active */}
                        <div className="flex flex-wrap items-center gap-2 pl-8" onClick={() => handleViewInstructor(inst.id)}>
                          <span className="text-[11px] font-medium text-emerald-600">{formatCurrency(inst.totalEarnings)}</span>
                          <Separator orientation="vertical" className="h-3" />
                          {inst.ntnVerified ? (
                            <span className="text-[11px] text-emerald-600 flex items-center gap-0.5"><ShieldCheck className="size-3" /> NTN</span>
                          ) : inst.ntn ? (
                            <span className="text-[11px] text-amber-600 flex items-center gap-0.5"><Shield className="size-3" /> NTN</span>
                          ) : null}
                          <Separator orientation="vertical" className="h-3" />
                          <span className="text-[11px] text-muted-foreground">{timeAgo(inst.lastActiveAt)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })
            )}
          </div>

        </TabsContent>

        {/* ═══════ TAB 2: Applications ═══════ */}
        <TabsContent value="applications" className="space-y-4 mt-4">
          {/* Filter Bar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-medium text-muted-foreground shrink-0 mr-1">Filter</span>
              {[{ value: 'all', label: 'All' }, { value: 'pending', label: 'Pending' }, { value: 'more_info_requested', label: 'Info Needed' }, { value: 'rejected', label: 'Rejected' }].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setAppFilter(opt.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors',
                    appFilter === opt.value
                      ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="rounded-lg gap-1.5 h-9" onClick={fetchApplications}>
              <Loader2 className={cn('size-3.5', appLoading && 'animate-spin')} />
              Refresh
            </Button>
          </div>

          {appLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="rounded-xl shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-10 rounded-xl" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-4 w-32 rounded-lg" />
                        <Skeleton className="h-3 w-48 rounded-lg" />
                      </div>
                    </div>
                    <Skeleton className="h-3 w-full rounded-lg" />
                    <Skeleton className="h-3 w-3/4 rounded-lg" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-20 rounded-lg" />
                      <Skeleton className="h-8 w-20 rounded-lg" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <FileText className="size-10 text-muted-foreground/30" />
              <p className="text-[15px] font-medium">No applications found</p>
              <p className="text-[13px] text-muted-foreground">
                {appFilter === 'all' ? 'There are no instructor applications at this time' : `No ${appFilter.replace('_', ' ')} applications`}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredApplications.map((app, i) => {
                const appStatusConf = APP_STATUS_CONFIG[app.applicationStatus] || APP_STATUS_CONFIG.pending
                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, ...springTransition }}
                  >
                    <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <CardContent className="p-4 space-y-3">
                        {/* Header */}
                        <div className="flex items-start gap-3">
                          <Avatar className="size-10 rounded-xl shrink-0">
                            <AvatarImage src={app.avatar || undefined} />
                            <AvatarFallback className="text-[11px] bg-violet-500/10 text-violet-600 rounded-xl">
                              {getInitials(app.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[14px] font-semibold truncate">{app.name}</p>
                              <Badge variant="secondary" className={cn('text-[10px] rounded-lg', appStatusConf.bg)}>
                                {appStatusConf.label}
                              </Badge>
                            </div>
                            <p className="text-[12px] text-muted-foreground truncate">{app.email}</p>
                            {app.phone && <p className="text-[11px] text-muted-foreground">{app.phone}</p>}
                          </div>
                        </div>

                        {/* Details - more info-rich */}
                        <div className="space-y-1.5">
                          {app.headline && (
                            <div className="flex items-start gap-2">
                              <span className="text-[11px] text-muted-foreground min-w-[70px]">Headline:</span>
                              <span className="text-[12px] text-foreground">{app.headline}</span>
                            </div>
                          )}
                          {app.expertise && (
                            <div className="flex items-start gap-2">
                              <span className="text-[11px] text-muted-foreground min-w-[70px]">Expertise:</span>
                              <span className="text-[12px] text-foreground">{app.expertise}</span>
                            </div>
                          )}
                          {app.topicProposal && (
                            <div className="flex items-start gap-2">
                              <span className="text-[11px] text-muted-foreground min-w-[70px]">Topic:</span>
                              <span className="text-[12px] text-foreground line-clamp-2">{app.topicProposal}</span>
                            </div>
                          )}
                          {app.sampleOutline && (
                            <div className="flex items-start gap-2">
                              <span className="text-[11px] text-muted-foreground min-w-[70px]">Outline:</span>
                              <span className="text-[12px] text-foreground line-clamp-2">{app.sampleOutline}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground min-w-[70px]">Applied:</span>
                            <span className="text-[12px] text-foreground">{timeAgo(app.appliedAt)}</span>
                            <span className="text-[10px] text-muted-foreground">({formatDate(app.appliedAt)})</span>
                          </div>
                          {app.reviewedAt && (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-muted-foreground min-w-[70px]">Reviewed:</span>
                              <span className="text-[12px] text-foreground">{formatDate(app.reviewedAt)}</span>
                            </div>
                          )}
                          {app.ntn && (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-muted-foreground min-w-[70px]">NTN:</span>
                              <span className="text-[12px] text-foreground">{app.ntn}</span>
                              {app.ntnVerified ? (
                                <Badge className="text-[9px] rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 gap-0.5">
                                  <ShieldCheck className="size-2.5" /> Verified
                                </Badge>
                              ) : (
                                <Badge className="text-[9px] rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 gap-0.5">
                                  <Shield className="size-2.5" /> Unverified
                                </Badge>
                              )}
                            </div>
                          )}
                          {app.cnic && (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-muted-foreground min-w-[70px]">CNIC:</span>
                              <span className="text-[12px] text-foreground">{app.cnic}</span>
                            </div>
                          )}
                          {(app.linkedin || app.website) && (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-muted-foreground min-w-[70px]">Links:</span>
                              <div className="flex items-center gap-2">
                                {app.linkedin && (
                                  <a href={app.linkedin} target="_blank" rel="noopener noreferrer" className="text-[11px] text-violet-600 hover:underline flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                                    <ExternalLink className="size-2.5" /> LinkedIn
                                  </a>
                                )}
                                {app.website && (
                                  <a href={app.website} target="_blank" rel="noopener noreferrer" className="text-[11px] text-violet-600 hover:underline flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                                    <ExternalLink className="size-2.5" /> Website
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                          {app.rejectionReason && (
                            <div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-2 mt-1">
                              <p className="text-[11px] text-red-600 dark:text-red-400 font-medium">Rejection Reason:</p>
                              <p className="text-[12px] text-red-600/80 dark:text-red-400/80">{app.rejectionReason}</p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {(app.applicationStatus === 'pending' || app.applicationStatus === 'more_info_requested') && (
                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              className="rounded-lg gap-1 h-8 text-[12px] flex-1"
                              onClick={() => setAppActionDialog({ open: true, action: 'approve', application: app, rejectionReason: '' })}
                              disabled={appActionLoading}
                            >
                              <CheckCircle className="size-3" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg gap-1 h-8 text-[12px] flex-1 text-red-600 hover:text-red-700 border-red-200 dark:border-red-800"
                              onClick={() => setAppActionDialog({ open: true, action: 'reject', application: app, rejectionReason: '' })}
                              disabled={appActionLoading}
                            >
                              <XCircle className="size-3" /> Reject
                            </Button>
                          </div>
                        )}
                        {app.applicationStatus === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg gap-1 h-8 text-[12px] w-full"
                            onClick={() => setAppActionDialog({ open: true, action: 'request_more_info', application: app, rejectionReason: '' })}
                            disabled={appActionLoading}
                          >
                            <MessageSquare className="size-3" /> Request More Info
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="rounded-lg gap-1 h-8 text-[12px] w-full"
                          onClick={() => {
                            setSelectedInstructorId(app.instructorId)
                            setCurrentView('admin-instructor-detail' as any)
                          }}
                        >
                          <Eye className="size-3" /> View Details
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══════ TAB 3: Flagged ═══════ */}
        <TabsContent value="flagged" className="space-y-4 mt-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="rounded-xl shadow-sm">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Skeleton className="size-10 rounded-xl" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-40 rounded-lg" />
                      <Skeleton className="h-3 w-56 rounded-lg" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-20 rounded-lg" />
                      <Skeleton className="h-8 w-20 rounded-lg" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : flaggedInstructors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <FlagOff className="size-10 text-muted-foreground/30" />
              <p className="text-[15px] font-medium">No flagged instructors</p>
              <p className="text-[13px] text-muted-foreground">All instructors are in good standing</p>
            </div>
          ) : (
            <div className="space-y-3">
              {flaggedInstructors.map((inst, i) => {
                const statusConf = STATUS_CONFIG[inst.status] || STATUS_CONFIG.flagged
                return (
                  <motion.div
                    key={inst.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, ...springTransition }}
                  >
                    <Card className="rounded-xl shadow-sm border-l-4 border-l-orange-400">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="size-10 rounded-xl shrink-0">
                            <AvatarImage src={inst.avatar || undefined} />
                            <AvatarFallback className="text-[11px] bg-violet-500/10 text-violet-600 rounded-xl">
                              {getInitials(inst.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[14px] font-semibold">{inst.name}</p>
                              <Badge variant="secondary" className="text-[10px] rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
                                <AlertTriangle className="size-2.5 mr-0.5" /> Flagged
                              </Badge>
                            </div>
                            <p className="text-[12px] text-muted-foreground">{inst.email}</p>
                            {inst.flaggedReason && (
                              <p className="text-[11px] text-orange-600 dark:text-orange-400 mt-0.5">
                                Reason: {inst.flaggedReason}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[11px] text-muted-foreground">{inst.courseCount} courses</span>
                              <span className="text-[11px] text-muted-foreground">{formatNumber(inst.studentCount)} students</span>
                              <span className="text-[11px] text-muted-foreground">Joined {formatDate(inst.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg gap-1.5 h-8 text-[12px]"
                              onClick={() => handleInstructorAction(inst.id, 'unflag')}
                              disabled={actionLoading === `${inst.id}-unflag`}
                            >
                              {actionLoading === `${inst.id}-unflag` ? <Loader2 className="size-3 animate-spin" /> : <FlagOff className="size-3" />}
                              Unflag
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg gap-1.5 h-8 text-[12px]"
                              onClick={() => handleViewInstructor(inst.id)}
                            >
                              <Eye className="size-3" /> View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg gap-1.5 h-8 text-[12px] text-amber-600 hover:text-amber-700"
                              onClick={() => handleSuspend(inst)}
                              disabled={actionLoading === `${inst.id}-suspend`}
                            >
                              {actionLoading === `${inst.id}-suspend` ? <Loader2 className="size-3 animate-spin" /> : <Ban className="size-3" />}
                              Suspend
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ─── Add Instructor Dialog ─── */}
      <Dialog open={addInstructorOpen} onOpenChange={(open) => { setAddInstructorOpen(open); if (!open) setCreatedPassword(null) }}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-5 text-violet-500" />
              Add Instructor
            </DialogTitle>
            <DialogDescription>Promote an existing user to instructor or create a new instructor account.</DialogDescription>
          </DialogHeader>

          {createdPassword ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-5 text-emerald-600" />
                  <p className="text-[14px] font-semibold text-emerald-700 dark:text-emerald-400">Instructor Created Successfully</p>
                </div>
                <p className="text-[13px] text-emerald-600 dark:text-emerald-400">
                  A temporary password has been generated. Share it with the instructor securely.
                </p>
                <div className="rounded-lg bg-white dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-3 flex items-center justify-between">
                  <code className="text-[14px] font-mono font-bold text-foreground">{createdPassword}</code>
                  <Button variant="ghost" size="sm" className="h-7 text-[11px] rounded-lg" onClick={() => { navigator.clipboard.writeText(createdPassword); toast.success('Password copied to clipboard') }}>
                    Copy
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button className="rounded-xl" onClick={() => {
                  setAddInstructorOpen(false)
                  setCreatedPassword(null)
                  setAddInstructorForm({ name: '', email: '', phone: '', bio: '', expertise: '', headline: '', sendWelcomeEmail: true })
                }}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-2">
                {/* Mode Selection */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className={cn(
                      'rounded-xl p-3 text-center border-2 transition-all',
                      addInstructorMode === 'promote'
                        ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/30'
                        : 'border-border hover:border-violet-200'
                    )}
                    onClick={() => setAddInstructorMode('promote')}
                  >
                    <GraduationCap className="size-5 mx-auto mb-1 text-violet-500" />
                    <p className="text-[13px] font-medium">Promote User</p>
                    <p className="text-[11px] text-muted-foreground">Upgrade existing user</p>
                  </button>
                  <button
                    className={cn(
                      'rounded-xl p-3 text-center border-2 transition-all',
                      addInstructorMode === 'create'
                        ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/30'
                        : 'border-border hover:border-violet-200'
                    )}
                    onClick={() => setAddInstructorMode('create')}
                  >
                    <Plus className="size-5 mx-auto mb-1 text-violet-500" />
                    <p className="text-[13px] font-medium">Create New</p>
                    <p className="text-[11px] text-muted-foreground">New instructor account</p>
                  </button>
                </div>

                {addInstructorMode === 'promote' ? (
                  <div className="space-y-2">
                    <Label className="text-[12px] font-medium">User Email *</Label>
                    <Input
                      className="rounded-lg h-9"
                      type="email"
                      placeholder="Enter existing user email"
                      value={addInstructorForm.email}
                      onChange={(e) => setAddInstructorForm(f => ({ ...f, email: e.target.value }))}
                    />
                    <p className="text-[11px] text-muted-foreground">The user with this email will be promoted to instructor role.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[12px] font-medium">Full Name *</Label>
                        <Input
                          className="rounded-lg h-9"
                          placeholder="John Doe"
                          value={addInstructorForm.name}
                          onChange={(e) => setAddInstructorForm(f => ({ ...f, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[12px] font-medium">Email *</Label>
                        <Input
                          className="rounded-lg h-9"
                          type="email"
                          placeholder="john@example.com"
                          value={addInstructorForm.email}
                          onChange={(e) => setAddInstructorForm(f => ({ ...f, email: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[12px] font-medium">Phone</Label>
                        <Input
                          className="rounded-lg h-9"
                          placeholder="+92 300 1234567"
                          value={addInstructorForm.phone}
                          onChange={(e) => setAddInstructorForm(f => ({ ...f, phone: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[12px] font-medium">Bio</Label>
                        <Input
                          className="rounded-lg h-9"
                          placeholder="Brief description..."
                          value={addInstructorForm.bio}
                          onChange={(e) => setAddInstructorForm(f => ({ ...f, bio: e.target.value }))}
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[12px] font-medium">Headline</Label>
                    <Input
                      className="rounded-lg h-9"
                      placeholder="Professional headline"
                      value={addInstructorForm.headline}
                      onChange={(e) => setAddInstructorForm(f => ({ ...f, headline: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[12px] font-medium">Expertise</Label>
                    <Input
                      className="rounded-lg h-9"
                      placeholder="e.g. Mathematics, Physics"
                      value={addInstructorForm.expertise}
                      onChange={(e) => setAddInstructorForm(f => ({ ...f, expertise: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pb-0.5">
                  <Switch
                    checked={addInstructorForm.sendWelcomeEmail}
                    onCheckedChange={(checked) => setAddInstructorForm(f => ({ ...f, sendWelcomeEmail: checked }))}
                    id="welcome-email-inst"
                  />
                  <Label htmlFor="welcome-email-inst" className="text-[12px] font-medium cursor-pointer">Send welcome notification</Label>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setAddInstructorOpen(false)}>Cancel</Button>
                <Button
                  className="rounded-xl"
                  onClick={handleAddInstructor}
                  disabled={addInstructorSubmitting || (addInstructorMode === 'promote' ? !addInstructorForm.email.trim() : !addInstructorForm.name.trim() || !addInstructorForm.email.trim())}
                >
                  {addInstructorSubmitting ? <><Loader2 className="size-4 animate-spin mr-2" /> {addInstructorMode === 'promote' ? 'Promoting...' : 'Creating...'}</> : addInstructorMode === 'promote' ? 'Promote to Instructor' : 'Create Instructor'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Confirmation Dialog ─── */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {confirmDialog.variant === 'destructive' ? (
                <AlertTriangle className="size-5 text-red-500" />
              ) : (
                <Shield className="size-5 text-violet-500" />
              )}
              {confirmDialog.title}
            </AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn('rounded-xl', confirmDialog.variant === 'destructive' && 'bg-red-600 hover:bg-red-700 text-white')}
              onClick={confirmDialog.onConfirm}
            >
              {confirmDialog.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Send Notification Dialog ─── */}
      <Dialog open={notifyOpen} onOpenChange={setNotifyOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="size-5 text-violet-500" />
              Send Notification
            </DialogTitle>
            <DialogDescription>
              Send a notification to {selectedIds.size} selected instructor{selectedIds.size !== 1 ? 's' : ''}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-[12px] font-medium">Notification Title *</Label>
              <Input
                className="rounded-lg h-9"
                placeholder="Important announcement"
                value={notifyForm.title}
                onChange={(e) => setNotifyForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[12px] font-medium">Icon</Label>
              <div className="flex flex-wrap gap-1.5">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    className={cn(
                      'size-9 rounded-lg flex items-center justify-center text-[16px] border transition-all hover:scale-110',
                      notifyForm.icon === emoji
                        ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/30 ring-2 ring-violet-200 dark:ring-violet-800'
                        : 'border-border'
                    )}
                    onClick={() => setNotifyForm(f => ({ ...f, icon: emoji }))}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[12px] font-medium">Content *</Label>
              <Textarea
                className="rounded-lg min-h-[100px] resize-none"
                placeholder="Write the notification message..."
                value={notifyForm.content}
                onChange={(e) => setNotifyForm(f => ({ ...f, content: e.target.value }))}
              />
            </div>

            {notifyForm.title || notifyForm.content ? (
              <div className="space-y-2">
                <Label className="text-[12px] font-medium">Preview</Label>
                <div className="rounded-lg bg-muted/50 border p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[16px]">{notifyForm.icon}</span>
                    <span className="text-[13px] font-semibold">{notifyForm.title || 'Title'}</span>
                  </div>
                  <p className="text-[12px] text-muted-foreground pl-7">{notifyForm.content || 'Content preview...'}</p>
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setNotifyOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl"
              onClick={handleSendNotification}
              disabled={notifySending || !notifyForm.title.trim() || !notifyForm.content.trim()}
            >
              {notifySending ? <><Loader2 className="size-4 animate-spin mr-2" /> Sending...</> : <><Send className="size-4 mr-2" /> Send</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Application Action Dialog ─── */}
      <Dialog open={appActionDialog.open} onOpenChange={(open) => setAppActionDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {appActionDialog.action === 'approve' && <CheckCircle className="size-5 text-emerald-500" />}
              {appActionDialog.action === 'reject' && <XCircle className="size-5 text-red-500" />}
              {appActionDialog.action === 'request_more_info' && <MessageSquare className="size-5 text-teal-500" />}
              {appActionDialog.action === 'approve' && 'Approve Application'}
              {appActionDialog.action === 'reject' && 'Reject Application'}
              {appActionDialog.action === 'request_more_info' && 'Request More Information'}
            </DialogTitle>
            <DialogDescription>
              {appActionDialog.application && (
                <>
                  {appActionDialog.action === 'approve' && `Approve ${appActionDialog.application.name}'s instructor application? They will be granted full instructor access.`}
                  {appActionDialog.action === 'reject' && `Reject ${appActionDialog.application.name}'s instructor application? A reason is required.`}
                  {appActionDialog.action === 'request_more_info' && `Request additional information from ${appActionDialog.application.name}? They will be notified.`}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {appActionDialog.application && (
              <div className="rounded-lg bg-muted/50 border p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <Avatar className="size-8 rounded-lg">
                    <AvatarImage src={appActionDialog.application.avatar || undefined} />
                    <AvatarFallback className="text-[10px] bg-violet-500/10 text-violet-600 rounded-lg">
                      {getInitials(appActionDialog.application.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[13px] font-semibold">{appActionDialog.application.name}</p>
                    <p className="text-[11px] text-muted-foreground">{appActionDialog.application.email}</p>
                  </div>
                </div>
              </div>
            )}

            {appActionDialog.action === 'reject' && (
              <div className="space-y-2">
                <Label className="text-[12px] font-medium">Rejection Reason *</Label>
                <Textarea
                  className="rounded-lg min-h-[100px] resize-none"
                  placeholder="Explain why the application is being rejected..."
                  value={appActionDialog.rejectionReason}
                  onChange={(e) => setAppActionDialog(prev => ({ ...prev, rejectionReason: e.target.value }))}
                />
              </div>
            )}

            {appActionDialog.action === 'approve' && (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3">
                <p className="text-[12px] text-emerald-700 dark:text-emerald-400">
                  Upon approval, the instructor will be granted full access to create and publish courses on the platform.
                  Their account will be verified automatically.
                </p>
              </div>
            )}

            {appActionDialog.action === 'request_more_info' && (
              <div className="rounded-lg bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 p-3">
                <p className="text-[12px] text-teal-700 dark:text-teal-400">
                  The applicant will be notified that additional information is required. They can update their application and resubmit.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setAppActionDialog({ open: false, action: null, application: null, rejectionReason: '' })}>
              Cancel
            </Button>
            {appActionDialog.action === 'approve' && (
              <Button
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleApplicationAction}
                disabled={appActionLoading}
              >
                {appActionLoading ? <><Loader2 className="size-4 animate-spin mr-2" /> Approving...</> : <><CheckCircle className="size-4 mr-2" /> Approve</>}
              </Button>
            )}
            {appActionDialog.action === 'reject' && (
              <Button
                className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
                onClick={handleApplicationAction}
                disabled={appActionLoading || !appActionDialog.rejectionReason.trim()}
              >
                {appActionLoading ? <><Loader2 className="size-4 animate-spin mr-2" /> Rejecting...</> : <><XCircle className="size-4 mr-2" /> Reject</>}
              </Button>
            )}
            {appActionDialog.action === 'request_more_info' && (
              <Button
                className="rounded-xl"
                onClick={handleApplicationAction}
                disabled={appActionLoading}
              >
                {appActionLoading ? <><Loader2 className="size-4 animate-spin mr-2" /> Sending...</> : <><MessageSquare className="size-4 mr-2" /> Request Info</>}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
