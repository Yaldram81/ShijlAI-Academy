'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, Download, Plus, Eye, Ban, CheckCircle,
  XCircle, AlertTriangle, Clock, Shield, MoreHorizontal,
  ChevronLeft, ChevronRight, FileText, Mail, MessageSquare,
  Trash2, Loader2, AlertCircle, X, Send, GraduationCap,
  ArrowUpDown, ArrowUp, ArrowDown, FileDown,
  UserCog, Flag, Bell, KeyRound, ExternalLink,
  ShieldCheck, UserX, ShieldAlert, TrendingUp, Calendar,
  Globe2, Smartphone, ChevronDown, Columns3, Coins,
  BookOpen, Zap, Activity, RefreshCw,
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
import { toast } from 'sonner'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminStatCard, AdminStatCardGrid } from './admin-stat-card'
import { MobileFilterSheet, MobileFilterGroup } from '@/components/mobile-filter-sheet'


// ─── Types ──────────────────────────────────────────────────────────────────

interface UserItem {
  id: string
  name: string
  email: string
  avatar: string | null
  role: string
  status: string
  isVerified: boolean
  mfaEnabled: boolean
  authProvider: string
  flaggedReason: string | null
  lastActiveAt: string | null
  lastLoginAt: string | null
  createdAt: string
  enrollmentCount: number
  courseCount: number
  instructorApplicationStatus: string | null
  ntnVerified: boolean | null
  phone: string | null
  shijlCoins: number
  streak: number
}

interface UserStats {
  totalUsers: number
  totalStudents: number
  totalInstructors: number
  totalAdmins: number
  activeUsers: number
  suspendedUsers: number
  bannedUsers: number
  pendingVerification: number
  flaggedUsers: number
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
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

const ROLE_BADGE: Record<string, string> = {
  student: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400',
  instructor: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
  admin: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
  parent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
}

const AUTH_PROVIDER_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  email: { label: 'Email', icon: <Mail className="size-3.5" /> },
  google: { label: 'Google', icon: <Globe2 className="size-3.5" /> },
  facebook: { label: 'Facebook', icon: <Globe2 className="size-3.5" /> },
  apple: { label: 'Apple', icon: <Smartphone className="size-3.5" /> },
}

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

type SortField = 'name' | 'email' | 'createdAt' | 'lastActiveAt'
type SortOrder = 'asc' | 'desc'
type UserTab = 'all' | 'flagged' | 'recent'



// ─── Main Component ─────────────────────────────────────────────────────────

export function AdminUserManagement() {
  const { setCurrentView } = useAppStore()
  const setSelectedUserId = (useAppStore as any).getState?.().setSelectedUserId ?? ((id: string) => {})

  // ── State: Active Tab ──
  const [activeTab, setActiveTab] = useState<UserTab>('all')

  // ── State: Users List ──
  const [users, setUsers] = useState<UserItem[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── State: Filters ──
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [authProviderFilter, setAuthProviderFilter] = useState('all')
  const [mfaFilter, setMfaFilter] = useState('all')
  const [verificationFilter, setVerificationFilter] = useState('all')
  const [joinedAfter, setJoinedAfter] = useState('')
  const [joinedBefore, setJoinedBefore] = useState('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // ── State: Selection ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // ── State: Add User Dialog ──
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [addUserForm, setAddUserForm] = useState({
    name: '', email: '', role: 'student', phone: '', bio: '', language: 'en', sendWelcomeEmail: true,
  })
  const [addUserSubmitting, setAddUserSubmitting] = useState(false)
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

  // ── State: Action loading ──
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // ── State: More filters expanded ──
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false)

  // ── Refs ──
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // ── Active filter count ──
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (roleFilter && roleFilter !== 'all') count++
    if (statusFilter && statusFilter !== 'all') count++
    if (authProviderFilter && authProviderFilter !== 'all') count++
    if (mfaFilter && mfaFilter !== 'all') count++
    if (verificationFilter && verificationFilter !== 'all') count++
    if (joinedAfter) count++
    if (joinedBefore) count++
    if (debouncedSearch) count++
    return count
  }, [roleFilter, statusFilter, authProviderFilter, mfaFilter, verificationFilter, joinedAfter, joinedBefore, debouncedSearch])

  // ── Fetch Users ──
  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
        search: debouncedSearch,
        role: roleFilter === 'all' ? '' : roleFilter,
        status: statusFilter === 'all' ? '' : statusFilter,
        authProvider: authProviderFilter === 'all' ? '' : authProviderFilter,
        mfa: mfaFilter === 'all' ? '' : mfaFilter,
        verification: verificationFilter === 'all' ? '' : verificationFilter,
        joinedAfter,
        joinedBefore,
        sortField,
        sortOrder,
      })
      const res = await fetch(`/api/admin/users?${params}`)
      if (!res.ok) throw new Error('Failed to fetch users')
      const data = await res.json()
      setUsers(data.users || [])
      setStats(data.stats || null)
      setPagination(prev => data.pagination ? { ...prev, ...data.pagination } : { ...prev, page, total: 0, totalPages: 0 })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, roleFilter, statusFilter, authProviderFilter, mfaFilter, verificationFilter, joinedAfter, joinedBefore, sortField, sortOrder, pagination.limit])

  // ── Effects ──
  useEffect(() => {
    fetchUsers(1)
  }, [fetchUsers])

  // ── Tab change handler ──
  const handleTabChange = useCallback((tab: string) => {
    const newTab = tab as UserTab
    setActiveTab(newTab)
    setSelectedIds(new Set())

    if (newTab === 'flagged') {
      setStatusFilter('flagged')
      setRoleFilter('all')
      setJoinedAfter('')
      setJoinedBefore('')
    } else if (newTab === 'recent') {
      setStatusFilter('all')
      setRoleFilter('all')
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      setJoinedAfter(sevenDaysAgo.toISOString().split('T')[0])
      setJoinedBefore('')
    } else {
      setStatusFilter('all')
      setRoleFilter('all')
      setJoinedAfter('')
      setJoinedBefore('')
    }
  }, [])

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
    setRoleFilter('all')
    setStatusFilter('all')
    setAuthProviderFilter('all')
    setMfaFilter('all')
    setVerificationFilter('all')
    setJoinedAfter('')
    setJoinedBefore('')
    setSortField('createdAt')
    setSortOrder('desc')
    setActiveTab('all')
  }, [])

  // ── Pagination ──
  const goToPage = useCallback((page: number) => {
    fetchUsers(page)
  }, [fetchUsers])

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
    if (selectedIds.size === users.length && users.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(users.map(u => u.id)))
    }
  }, [users, selectedIds.size])

  const allSelected = users.length > 0 && selectedIds.size === users.length

  // ── Navigate to user detail ──
  const handleViewUser = useCallback((userId: string) => {
    try {
      const store = useAppStore.getState() as any
      if (store.setSelectedUserId) store.setSelectedUserId(userId)
    } catch {}
    setCurrentView('admin-user-detail' as any)
  }, [setCurrentView])

  // ── Admin Action on User ──
  const handleUserAction = useCallback(async (userId: string, action: string, data?: any) => {
    setActionLoading(`${userId}-${action}`)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data }),
      })
      if (!res.ok) throw new Error(`Action "${action}" failed`)
      const result = await res.json()
      toast.success(`User ${action} successful`)
      fetchUsers(pagination.page)
      return result
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Action "${action}" failed`)
    } finally {
      setActionLoading(null)
    }
  }, [fetchUsers, pagination.page])

  // ── Confirm Action ──
  const confirmAction = useCallback((title: string, description: string, onConfirm: () => void, variant: 'default' | 'destructive' = 'destructive', confirmLabel = 'Confirm') => {
    setConfirmDialog({ open: true, title, description, confirmLabel, variant, onConfirm })
  }, [])

  // ── Suspend user ──
  const handleSuspend = useCallback((user: UserItem) => {
    confirmAction(
      'Suspend User',
      `Are you sure you want to suspend ${user.name}? They will lose access immediately.`,
      () => handleUserAction(user.id, 'suspend'),
      'destructive',
      'Suspend'
    )
  }, [confirmAction, handleUserAction])

  // ── Ban user ──
  const handleBan = useCallback((user: UserItem) => {
    confirmAction(
      'Ban User',
      `Are you sure you want to ban ${user.name}? This is a permanent action.`,
      () => handleUserAction(user.id, 'ban'),
      'destructive',
      'Ban'
    )
  }, [confirmAction, handleUserAction])

  // ── Delete user ──
  const handleDelete = useCallback((user: UserItem) => {
    confirmAction(
      'Delete User',
      `Are you sure you want to delete ${user.name}? This cannot be undone.`,
      () => handleUserAction(user.id, 'delete'),
      'destructive',
      'Delete'
    )
  }, [confirmAction, handleUserAction])

  // ── Bulk Action ──
  const handleBulkAction = useCallback(async (action: string) => {
    if (selectedIds.size === 0) return
    const actionLabels: Record<string, string> = {
      suspend: 'Suspend', unsuspend: 'Unsuspend', verify: 'Verify',
      delete: 'Delete', export: 'Export', send_notification: 'Send Notification',
      change_role: 'Change Role', flag: 'Flag',
    }
    confirmAction(
      `Bulk ${actionLabels[action] || action}`,
      `Apply ${actionLabels[action] || action} to ${selectedIds.size} users?`,
      async () => {
        setActionLoading(`bulk-${action}`)
        try {
          const res = await fetch('/api/admin/users/bulk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, userIds: Array.from(selectedIds) }),
          })
          if (!res.ok) throw new Error(`Bulk action "${action}" failed`)
          toast.success(`Bulk ${actionLabels[action] || action} applied to ${selectedIds.size} users`)
          setSelectedIds(new Set())
          fetchUsers(pagination.page)
        } catch (err) {
          toast.error(err instanceof Error ? err.message : `Bulk action "${action}" failed`)
        } finally {
          setActionLoading(null)
        }
      },
      action === 'delete' || action === 'suspend' ? 'destructive' : 'default',
      actionLabels[action] || 'Confirm'
    )
  }, [selectedIds, fetchUsers, pagination.page, confirmAction])

  // ── Add User ──
  const handleAddUser = useCallback(async () => {
    if (!addUserForm.name.trim() || !addUserForm.email.trim()) {
      toast.error('Name and email are required')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(addUserForm.email)) {
      toast.error('Please enter a valid email address')
      return
    }
    setAddUserSubmitting(true)
    setCreatedPassword(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addUserForm),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to add user')
      }
      const data = await res.json()
      if (data.temporaryPassword) {
        setCreatedPassword(data.temporaryPassword)
      }
      toast.success(`User ${addUserForm.name} created successfully`)
      fetchUsers(1)
      if (!data.temporaryPassword) {
        setAddUserOpen(false)
        setAddUserForm({ name: '', email: '', role: 'student', phone: '', bio: '', language: 'en', sendWelcomeEmail: true })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add user')
    } finally {
      setAddUserSubmitting(false)
    }
  }, [addUserForm, fetchUsers])

  // ── Export ──
  const handleExport = useCallback((format: 'csv' | 'json') => {
    const params = new URLSearchParams({
      format,
      role: roleFilter === 'all' ? '' : roleFilter,
      status: statusFilter === 'all' ? '' : statusFilter,
      search: debouncedSearch,
    })
    window.open(`/api/admin/users/export?${params}`, '_blank')
    toast.success(`Exporting users as ${format.toUpperCase()}...`)
  }, [roleFilter, statusFilter, debouncedSearch])

  // ── Send Notification ──
  const handleSendNotification = useCallback(async () => {
    if (!notifyForm.title.trim() || !notifyForm.content.trim()) {
      toast.error('Title and content are required')
      return
    }
    setNotifySending(true)
    try {
      const res = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_notification',
          userIds: Array.from(selectedIds),
          notification: notifyForm,
        }),
      })
      if (!res.ok) throw new Error('Failed to send notification')
      toast.success(`Notification sent to ${selectedIds.size} users`)
      setNotifyOpen(false)
      setNotifyForm({ title: '', content: '', icon: '📢' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send notification')
    } finally {
      setNotifySending(false)
    }
  }, [notifyForm, selectedIds])

  // ── EMOJI picker options ──
  const emojiOptions = ['📢', '🔔', '🎉', '⚠️', '💡', '📝', '🚀', '❤️', '🎯', '✅', '📢', '🎓']

  // ── Page numbers ──
  const pageNumbers = useMemo(() => {
    const pages: number[] = []
    const start = Math.max(1, pagination.page - 2)
    const end = Math.min(pagination.totalPages, pagination.page + 2)
    for (let i = start; i <= end; i++) pages.push(i)
    return pages
  }, [pagination.page, pagination.totalPages])

  // ── Role pill options ──
  const roleOptions = [
    { value: 'all', label: 'All' },
    { value: 'student', label: 'Students' },
    { value: 'instructor', label: 'Instructors' },
    { value: 'admin', label: 'Admins' },
    { value: 'parent', label: 'Parents' },
  ]

  // ── Status pill options ──
  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'banned', label: 'Banned' },
    { value: 'pending_verification', label: 'Pending' },
    { value: 'flagged', label: 'Flagged' },
  ]

  // ── Row action dropdown (shared) ──
  const renderUserActions = (user: UserItem) => (
    <DropdownMenuContent align="end" className="w-48">
      <DropdownMenuLabel className="text-[11px] text-muted-foreground">{user.name}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => handleViewUser(user.id)} className="gap-2">
        <Eye className="size-3.5" /> View Details
      </DropdownMenuItem>
      {user.status === 'active' && (
        <DropdownMenuItem onClick={() => handleSuspend(user)} disabled={actionLoading === `${user.id}-suspend`} className="gap-2">
          {actionLoading === `${user.id}-suspend` ? <Loader2 className="size-3.5 animate-spin" /> : <Ban className="size-3.5" />}
          Suspend User
        </DropdownMenuItem>
      )}
      {(user.status === 'suspended' || user.status === 'pending_verification') && (
        <DropdownMenuItem onClick={() => handleUserAction(user.id, 'unsuspend')} disabled={actionLoading === `${user.id}-unsuspend`} className="gap-2">
          {actionLoading === `${user.id}-unsuspend` ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle className="size-3.5" />}
          {user.status === 'suspended' ? 'Unsuspend User' : 'Activate User'}
        </DropdownMenuItem>
      )}
      {!user.isVerified && (
        <DropdownMenuItem onClick={() => handleUserAction(user.id, 'verify')} className="gap-2">
          <ShieldCheck className="size-3.5" /> Verify Email
        </DropdownMenuItem>
      )}
      {(user.status === 'flagged' || user.status === 'suspended') && (
        <DropdownMenuItem onClick={() => handleBan(user)} disabled={actionLoading === `${user.id}-ban`} variant="destructive" className="gap-2">
          {actionLoading === `${user.id}-ban` ? <Loader2 className="size-3.5 animate-spin" /> : <Ban className="size-3.5" />}
          Ban User
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => handleDelete(user)} disabled={actionLoading === `${user.id}-delete`} variant="destructive" className="gap-2">
        {actionLoading === `${user.id}-delete` ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
        Delete User
      </DropdownMenuItem>
    </DropdownMenuContent>
  )

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
            <Users className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">User Management</h1>
            <p className="text-sm text-muted-foreground">Manage students, instructors, and platform accounts</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-9" onClick={() => handleExport('csv')}>
            <FileDown className="size-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button size="sm" className="rounded-xl gap-1.5 h-9" onClick={() => { setAddUserOpen(true); setCreatedPassword(null) }}>
            <Plus className="size-3.5" />
            Add User
          </Button>
        </div>
      </div>

      {/* ─── Compact Stats Section ─── */}
      <AdminStatCardGrid columns={4}>
        <AdminStatCard
          icon={Users}
          label="Total Users"
          value={formatNumber(stats?.totalUsers ?? 0)}
          color="violet"
          subLabel={`+${stats?.newUsersToday ?? 0} today`}
          trend={12}
        />
        <AdminStatCard
          icon={Activity}
          label="Active Users"
          value={formatNumber(stats?.activeUsers ?? 0)}
          color="emerald"
          subLabel={`${stats?.totalUsers ? Math.round(((stats.activeUsers ?? 0) / stats.totalUsers) * 100) : 0}% of total`}
          trend={8}
        />
        <AdminStatCard
          icon={AlertTriangle}
          label="Flagged"
          value={formatNumber(stats?.flaggedUsers ?? 0)}
          color="orange"
          subLabel={`${stats?.suspendedUsers ?? 0} suspended`}
          trend={-3}
        />
        <AdminStatCard
          icon={Zap}
          label="New This Week"
          value={formatNumber(stats?.newUsersThisWeek ?? 0)}
          color="cyan"
          subLabel={`${stats?.newUsersThisMonth ?? 0} this month`}
          trend={15}
        />
      </AdminStatCardGrid>

      {/* ─── Tabs ─── */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="bg-muted/50 rounded-xl h-10 p-1">
          <TabsTrigger value="all" className="rounded-lg text-[13px] gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            All Users
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 rounded-md ml-1">
              {stats?.totalUsers ?? 0}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="flagged" className="rounded-lg text-[13px] gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Flagged
            {(stats?.flaggedUsers ?? 0) > 0 && (
              <Badge className="text-[10px] h-4 px-1.5 rounded-md bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 ml-1">
                {stats?.flaggedUsers ?? 0}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="recent" className="rounded-lg text-[13px] gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Recent
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 rounded-md ml-1">
              7d
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ═══════ TAB CONTENT: ALL / FLAGGED / RECENT ═══════ */}
        <TabsContent value={activeTab} className="space-y-4 mt-4">

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
                  <MobileFilterGroup label="Role">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-full h-10 text-[13px] rounded-lg">
                        <SelectValue placeholder="All Roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="student">Students</SelectItem>
                        <SelectItem value="instructor">Instructors</SelectItem>
                        <SelectItem value="admin">Admins</SelectItem>
                        <SelectItem value="parent">Parents</SelectItem>
                      </SelectContent>
                    </Select>
                  </MobileFilterGroup>
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
                  <MobileFilterGroup label="Verification">
                    <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                      <SelectTrigger className="w-full h-10 text-[13px] rounded-lg">
                        <SelectValue placeholder="All Verified" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Verified</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="unverified">Unverified</SelectItem>
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
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="createdAt">Join Date</SelectItem>
                        <SelectItem value="lastActiveAt">Last Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </MobileFilterGroup>
                  <MobileFilterGroup label="Auth Provider">
                    <Select value={authProviderFilter} onValueChange={setAuthProviderFilter}>
                      <SelectTrigger className="w-full h-10 text-[13px] rounded-lg">
                        <SelectValue placeholder="All Providers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Providers</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="google">Google</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="apple">Apple</SelectItem>
                      </SelectContent>
                    </Select>
                  </MobileFilterGroup>
                  <MobileFilterGroup label="MFA">
                    <Select value={mfaFilter} onValueChange={setMfaFilter}>
                      <SelectTrigger className="w-full h-10 text-[13px] rounded-lg">
                        <SelectValue placeholder="All MFA" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All MFA</SelectItem>
                        <SelectItem value="enabled">Enabled</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
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
                  {/* Role Filter */}
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[120px] rounded-xl h-9" size="sm">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="student">Students</SelectItem>
                      <SelectItem value="instructor">Instructors</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                      <SelectItem value="parent">Parents</SelectItem>
                    </SelectContent>
                  </Select>

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
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="createdAt">Join Date</SelectItem>
                      <SelectItem value="lastActiveAt">Last Active</SelectItem>
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
                        onClick={() => fetchUsers(pagination.page)}
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

          {/* ─── Bulk Actions Bar ─── */}
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
                      <Button size="sm" variant="outline" className="rounded-lg gap-1.5 h-8 text-[12px]" onClick={() => handleBulkAction('change_role')} disabled={actionLoading?.startsWith('bulk')}>
                        <UserCog className="size-3" /> Role
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

          {/* ─── Users Table (Desktop) ─── */}
          <Card className="rounded-xl shadow-sm overflow-hidden hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[40px] pl-4">
                    <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                  </TableHead>
                  <TableHead className="min-w-[220px]">
                    <button className="flex items-center gap-1 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors" onClick={() => handleSort('name')}>
                      User <SortIcon field="name" />
                    </button>
                  </TableHead>
                  <TableHead className="w-[90px]">
                    <span className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Role</span>
                  </TableHead>
                  <TableHead className="w-[100px]">
                    <span className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Status</span>
                  </TableHead>
                  <TableHead className="w-[80px] hidden xl:table-cell">
                    <span className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Courses</span>
                  </TableHead>
                  <TableHead className="w-[90px] hidden xl:table-cell">
                    <span className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Coins</span>
                  </TableHead>
                  <TableHead className="w-[105px] hidden lg:table-cell">
                    <button className="flex items-center gap-1 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors" onClick={() => handleSort('createdAt')}>
                      Joined <SortIcon field="createdAt" />
                    </button>
                  </TableHead>
                  <TableHead className="w-[105px] hidden lg:table-cell">
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
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-4"><Skeleton className="size-4 rounded" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="size-9 rounded-lg" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-4 w-32 rounded" />
                            <Skeleton className="h-3 w-48 rounded" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16 rounded" /></TableCell>
                      <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-8 rounded" /></TableCell>
                      <TableCell className="hidden xl:table-cell"><Skeleton className="h-4 w-12 rounded" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-20 rounded" /></TableCell>
                      <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-16 rounded" /></TableCell>
                      <TableCell><Skeleton className="size-8 rounded-lg ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <AlertCircle className="size-10 text-red-400" />
                        <p className="text-[15px] font-medium">Failed to load users</p>
                        <p className="text-[13px] text-muted-foreground">{error}</p>
                        <Button variant="outline" size="sm" className="rounded-lg" onClick={() => fetchUsers(1)}>
                          Retry
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Users className="size-10 text-muted-foreground/30" />
                        <p className="text-[15px] font-medium">No users found</p>
                        <p className="text-[13px] text-muted-foreground">Try adjusting your search or filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user, i) => {
                    const statusConf = STATUS_CONFIG[user.status] || STATUS_CONFIG.active
                    const roleBadgeClass = ROLE_BADGE[user.role] || ROLE_BADGE.student
                    const isSelected = selectedIds.has(user.id)
                    const authConf = AUTH_PROVIDER_CONFIG[user.authProvider] || AUTH_PROVIDER_CONFIG.email

                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.015 }}
                        className={cn(
                          'group cursor-pointer',
                          isSelected && 'bg-violet-50/60 dark:bg-violet-950/15 hover:bg-violet-50/80 dark:hover:bg-violet-950/25'
                        )}
                        onClick={() => handleViewUser(user.id)}
                      >
                        {/* Checkbox */}
                        <TableCell className="pl-4" onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(user.id)} />
                        </TableCell>

                        {/* User (Avatar + Name + Email + Auth provider icon) */}
                        <TableCell>
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="size-9 rounded-lg shrink-0">
                              <AvatarImage src={user.avatar || undefined} />
                              <AvatarFallback className="text-[11px] bg-primary/10 rounded-lg">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-[13px] font-semibold truncate">{user.name}</p>
                                {user.flaggedReason && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <AlertTriangle className="size-3 text-orange-500 shrink-0" />
                                    </TooltipTrigger>
                                    <TooltipContent>{user.flaggedReason}</TooltipContent>
                                  </Tooltip>
                                )}
                                <Tooltip>
                                  <TooltipTrigger>
                                    <span className={cn('text-muted-foreground shrink-0', user.mfaEnabled && 'text-emerald-600')}>
                                      {authConf.icon}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {authConf.label}{user.mfaEnabled ? ' · MFA On' : ''}
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Role */}
                        <TableCell>
                          <Badge variant="secondary" className={cn('text-[10px] rounded-md gap-0.5', roleBadgeClass)}>
                            {user.role === 'instructor' && user.isVerified && <CheckCircle className="size-2.5" />}
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {statusConf.icon}
                            <span className={cn('text-[11px] font-medium', statusConf.color)}>{statusConf.label}</span>
                          </div>
                        </TableCell>

                        {/* Enrollment Count */}
                        <TableCell className="hidden xl:table-cell">
                          <span className="text-[12px] text-muted-foreground tabular-nums">{user.enrollmentCount}</span>
                        </TableCell>

                        {/* Coins/XP */}
                        <TableCell className="hidden xl:table-cell">
                          <div className="flex items-center gap-1">
                            <Coins className="size-3 text-amber-500" />
                            <span className="text-[12px] text-muted-foreground tabular-nums">{formatNumber(user.shijlCoins)}</span>
                          </div>
                        </TableCell>

                        {/* Joined */}
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-[12px] text-muted-foreground">{formatDate(user.createdAt)}</span>
                        </TableCell>

                        {/* Last Active */}
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-[12px] text-muted-foreground">{timeAgo(user.lastActiveAt)}</span>
                        </TableCell>

                        {/* Actions Dropdown */}
                        <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            {renderUserActions(user)}
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    )
                  })
                )}
              </TableBody>
            </Table>

            {/* Pagination + Stats footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t gap-3">
              <div className="flex items-center gap-3">
                <p className="text-[12px] text-muted-foreground">
                  {pagination.total > 0 ? (
                    <>Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {formatNumber(pagination.total)} users &bull; Page {pagination.page} of {pagination.totalPages || 1}</>
                  ) : (
                    'No users'
                  )}
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

          {/* ─── Mobile Cards View ─── */}
          <div className="md:hidden space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-10 rounded-lg" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-32 rounded" />
                        <Skeleton className="h-3 w-48 rounded" />
                      </div>
                      <Skeleton className="size-8 rounded-lg" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : error ? (
              <Card className="rounded-xl">
                <CardContent className="p-8 flex flex-col items-center justify-center gap-3">
                  <AlertCircle className="size-10 text-red-400" />
                  <p className="text-[15px] font-medium">Failed to load users</p>
                  <p className="text-[13px] text-muted-foreground">{error}</p>
                  <Button variant="outline" size="sm" className="rounded-lg" onClick={() => fetchUsers(1)}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : users.length === 0 ? (
              <Card className="rounded-xl">
                <CardContent className="p-8 flex flex-col items-center justify-center gap-3">
                  <Users className="size-10 text-muted-foreground/30" />
                  <p className="text-[15px] font-medium">No users found</p>
                  <p className="text-[13px] text-muted-foreground">Try adjusting your search or filters</p>
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence mode="popLayout">
                {users.map((user, i) => {
                  const statusConf = STATUS_CONFIG[user.status] || STATUS_CONFIG.active
                  const roleBadgeClass = ROLE_BADGE[user.role] || ROLE_BADGE.student
                  const isSelected = selectedIds.has(user.id)
                  const authConf = AUTH_PROVIDER_CONFIG[user.authProvider] || AUTH_PROVIDER_CONFIG.email

                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ delay: i * 0.02, ...springTransition }}
                    >
                      <Card className={cn(
                        'rounded-xl cursor-pointer hover:shadow-md transition-shadow',
                        isSelected && 'ring-2 ring-violet-300 dark:ring-violet-700 bg-violet-50/50 dark:bg-violet-950/20'
                      )} onClick={() => handleViewUser(user.id)}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                              <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(user.id)} />
                            </div>

                            {/* Avatar */}
                            <Avatar className="size-10 rounded-lg shrink-0">
                              <AvatarImage src={user.avatar || undefined} />
                              <AvatarFallback className="text-[11px] bg-primary/10 rounded-lg">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-[14px] font-semibold truncate">{user.name}</p>
                                {user.flaggedReason && <AlertTriangle className="size-3 text-orange-500 shrink-0" />}
                              </div>
                              <p className="text-[12px] text-muted-foreground truncate">{user.email}</p>
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge variant="secondary" className={cn('text-[10px] rounded-md gap-0.5', roleBadgeClass)}>
                                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                </Badge>
                                <div className="flex items-center gap-1">
                                  {statusConf.icon}
                                  <span className={cn('text-[11px] font-medium', statusConf.color)}>{statusConf.label}</span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Coins className="size-3 text-amber-500" />
                                  <span className="text-[11px]">{formatNumber(user.shijlCoins)}</span>
                                </div>
                              </div>
                              {/* Second row of stats */}
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <BookOpen className="size-3" /> {user.enrollmentCount} courses
                                </span>
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <Calendar className="size-3" /> {formatDate(user.createdAt)}
                                </span>
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <Activity className="size-3" /> {timeAgo(user.lastActiveAt)}
                                </span>
                              </div>
                            </div>

                            {/* Actions Dropdown */}
                            <div onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="size-8 rounded-lg">
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                {renderUserActions(user)}
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}

            {/* Mobile Pagination */}
            {!loading && users.length > 0 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-[12px] text-muted-foreground">
                  {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {formatNumber(pagination.total)} &bull; Page {pagination.page}/{pagination.totalPages || 1}
                </p>
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
                    <span className="text-[12px] font-medium px-2">{pagination.page} / {pagination.totalPages}</span>
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
            )}
          </div>

        </TabsContent>
      </Tabs>

      {/* ─── Add User Dialog ─── */}
      <Dialog open={addUserOpen} onOpenChange={(open) => { setAddUserOpen(open); if (!open) setCreatedPassword(null) }}>
        <DialogContent className="sm:max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="size-5 text-violet-500" />
              Add New User
            </DialogTitle>
            <DialogDescription>Create a new user account on the platform.</DialogDescription>
          </DialogHeader>

          {createdPassword ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-5 text-emerald-600" />
                  <p className="text-[14px] font-semibold text-emerald-700 dark:text-emerald-400">User Created Successfully</p>
                </div>
                <p className="text-[13px] text-emerald-600 dark:text-emerald-400">
                  A temporary password has been generated. Share it with the user securely.
                </p>
                <div className="rounded-lg bg-white dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-3 flex items-center justify-between">
                  <code className="text-[14px] font-mono font-bold text-foreground">{createdPassword}</code>
                  <Button variant="ghost" size="sm" className="h-7 text-[11px] rounded-lg" onClick={() => { navigator.clipboard.writeText(createdPassword); toast.success('Password copied to clipboard') }}>
                    Copy
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button className="rounded-lg" onClick={() => { setAddUserOpen(false); setCreatedPassword(null); setAddUserForm({ name: '', email: '', role: 'student', phone: '', bio: '', language: 'en', sendWelcomeEmail: true }) }}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[12px] font-medium">Full Name *</Label>
                    <Input
                      className="rounded-lg h-9"
                      placeholder="John Doe"
                      value={addUserForm.name}
                      onChange={(e) => setAddUserForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[12px] font-medium">Email *</Label>
                    <Input
                      className="rounded-lg h-9"
                      type="email"
                      placeholder="john@example.com"
                      value={addUserForm.email}
                      onChange={(e) => setAddUserForm(f => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[12px] font-medium">Role</Label>
                    <Select value={addUserForm.role} onValueChange={(v) => setAddUserForm(f => ({ ...f, role: v }))}>
                      <SelectTrigger className="rounded-lg h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="instructor">Instructor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[12px] font-medium">Phone</Label>
                    <Input
                      className="rounded-lg h-9"
                      placeholder="+92 300 1234567"
                      value={addUserForm.phone}
                      onChange={(e) => setAddUserForm(f => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[12px] font-medium">Language</Label>
                    <Select value={addUserForm.language} onValueChange={(v) => setAddUserForm(f => ({ ...f, language: v }))}>
                      <SelectTrigger className="rounded-lg h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ur">اردو (Urdu)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2 pb-0.5">
                    <Switch
                      checked={addUserForm.sendWelcomeEmail}
                      onCheckedChange={(checked) => setAddUserForm(f => ({ ...f, sendWelcomeEmail: checked }))}
                      id="welcome-email"
                    />
                    <Label htmlFor="welcome-email" className="text-[12px] font-medium cursor-pointer">Send welcome email</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[12px] font-medium">Bio</Label>
                  <Textarea
                    className="rounded-lg min-h-[80px] resize-none"
                    placeholder="Brief description..."
                    value={addUserForm.bio}
                    onChange={(e) => setAddUserForm(f => ({ ...f, bio: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" className="rounded-lg" onClick={() => setAddUserOpen(false)}>Cancel</Button>
                <Button
                  className="rounded-lg"
                  onClick={handleAddUser}
                  disabled={addUserSubmitting || !addUserForm.name.trim() || !addUserForm.email.trim()}
                >
                  {addUserSubmitting ? <><Loader2 className="size-4 animate-spin mr-2" /> Creating...</> : 'Create User'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Confirmation Dialog ─── */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent className="rounded-xl">
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
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn('rounded-lg', confirmDialog.variant === 'destructive' && 'bg-red-600 hover:bg-red-700 text-white')}
              onClick={confirmDialog.onConfirm}
            >
              {confirmDialog.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Send Notification Dialog ─── */}
      <Dialog open={notifyOpen} onOpenChange={setNotifyOpen}>
        <DialogContent className="sm:max-w-lg rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="size-5 text-violet-500" />
              Send Notification
            </DialogTitle>
            <DialogDescription>
              Send a notification to {selectedIds.size} selected user{selectedIds.size !== 1 ? 's' : ''}.
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

            {/* Preview */}
            {(notifyForm.title || notifyForm.content) && (
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
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-lg" onClick={() => setNotifyOpen(false)}>Cancel</Button>
            <Button
              className="rounded-lg"
              onClick={handleSendNotification}
              disabled={notifySending || !notifyForm.title.trim() || !notifyForm.content.trim()}
            >
              {notifySending ? <><Loader2 className="size-4 animate-spin mr-2" /> Sending...</> : <><Send className="size-4 mr-2" /> Send</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
