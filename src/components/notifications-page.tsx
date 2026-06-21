'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, CheckCircle, AlertTriangle, AlertCircle, Info,
  Archive, Trash2, Pin, Star, Search, Filter, RefreshCw,
  ChevronLeft, ChevronRight, Settings, Loader2, X,
  Inbox, Mail, MailOpen, BookmarkCheck, Shield, BookOpen,
  MessageSquare, DollarSign, Gift, Users, Megaphone,
  Clock, ExternalLink, MoreHorizontal, CheckCheck,
  Volume2, VolumeX, PinOff, ArchiveRestore,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MobileFilterSheet, MobileFilterGroup } from '@/components/mobile-filter-sheet'

// ─── Types ──────────────────────────────────────────────────────────────────

interface NotificationItem {
  id: string
  userId: string
  type: string
  title: string
  content: string
  icon: string | null
  link: string | null
  isRead: boolean
  readAt: string | null
  priority: string
  category: string
  actionUrl: string | null
  actionLabel: string | null
  dismissLabel: string | null
  isArchived: boolean
  isPinned: boolean
  pinnedAt: string | null
  expiresAt: string | null
  createdAt: string
}

interface NotificationCounts {
  total: number
  unread: number
  pinned: number
  byType: Record<string, number>
}

interface NotificationPrefs {
  enableInApp: boolean
  enableEmail: boolean
  enablePush: boolean
  enrollmentNotifications: boolean
  courseUpdateNotifications: boolean
  assignmentNotifications: boolean
  qaNotifications: boolean
  messageNotifications: boolean
  achievementNotifications: boolean
  socialNotifications: boolean
  securityNotifications: boolean
  promotionNotifications: boolean
  liveSessionNotifications: boolean
  reminderNotifications: boolean
  digestMode: string
  soundEnabled: boolean
  [key: string]: unknown
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

function timeAgo(dateStr: string): string {
  const now = new Date().getTime()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getCategoryColor(category: string) {
  const colors: Record<string, string> = {
    academic: 'bg-blue-500', financial: 'bg-emerald-500', social: 'bg-violet-500',
    system: 'bg-slate-500', security: 'bg-red-500', general: 'bg-indigo-500',
  }
  return colors[category] || 'bg-indigo-500'
}

function getTypeIcon(type: string) {
  const icons: Record<string, React.ReactNode> = {
    enrollment: <BookOpen className="size-4" />, qa: <MessageSquare className="size-4" />,
    review: <Star className="size-4" />, assignment: <BookmarkCheck className="size-4" />,
    message: <MessageSquare className="size-4" />, payout: <DollarSign className="size-4" />,
    system: <Settings className="size-4" />, promotion: <Megaphone className="size-4" />,
    achievement: <Gift className="size-4" />, reminder: <Clock className="size-4" />,
    security: <Shield className="size-4" />, social: <Users className="size-4" />,
    course_update: <BookOpen className="size-4" />, live_session: <AlertCircle className="size-4" />,
  }
  return icons[type] || <Bell className="size-4" />
}

function getPriorityBadge(priority: string) {
  if (priority === 'urgent') return <Badge className="rounded-lg text-[9px] bg-red-500 text-white h-4 px-1.5 border-0">Urgent</Badge>
  if (priority === 'high') return <Badge className="rounded-lg text-[9px] bg-amber-500 text-white h-4 px-1.5 border-0">High</Badge>
  return null
}

// ─── Filter Categories ──────────────────────────────────────────────────────

const FILTER_TABS = [
  { key: 'all', label: 'All', icon: Inbox },
  { key: 'unread', label: 'Unread', icon: Mail },
  { key: 'read', label: 'Read', icon: MailOpen },
  { key: 'pinned', label: 'Pinned', icon: Pin },
  { key: 'archived', label: 'Archived', icon: Archive },
] as const

const TYPE_FILTERS = [
  { key: 'all', label: 'All Types' },
  { key: 'enrollment', label: 'Enrollment' },
  { key: 'course_update', label: 'Course Updates' },
  { key: 'assignment', label: 'Assignments' },
  { key: 'qa', label: 'Q&A' },
  { key: 'achievement', label: 'Achievements' },
  { key: 'social', label: 'Social' },
  { key: 'payout', label: 'Payouts' },
  { key: 'security', label: 'Security' },
  { key: 'system', label: 'System' },
  { key: 'promotion', label: 'Promotions' },
  { key: 'live_session', label: 'Live Sessions' },
  { key: 'reminder', label: 'Reminders' },
] as const

// ─── Main Component ─────────────────────────────────────────────────────────

export function NotificationsPage() {
  const { currentUser } = useAppStore()

  // State
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [counts, setCounts] = useState<NotificationCounts>({ total: 0, unread: 0, pinned: 0, byType: {} })
  const [pagination, setPagination] = useState({ page: 1, limit: 30, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [detailNotif, setDetailNotif] = useState<NotificationItem | null>(null)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null)
  const [prefsSaving, setPrefsSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const toastTimeout = useRef<NodeJS.Timeout | null>(null)
  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    toastTimeout.current = setTimeout(() => setToast(null), 3000)
  }, [])

  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // Fetch notifications
  const fetchNotifications = useCallback(async (page = 1) => {
    if (!currentUser?.id) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        userId: currentUser.id,
        page: String(page),
        limit: '30',
        filter,
        type: typeFilter === 'all' ? '' : typeFilter,
        search,
        role: currentUser?.role || '',
      })
      const res = await fetch(`/api/notifications?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setNotifications(data.notifications || [])
      setCounts(data.counts || { total: 0, unread: 0, pinned: 0, byType: {} })
      setPagination(data.pagination || { page, limit: 30, total: 0, totalPages: 0 })
    } catch {
      showToast('error', 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id, currentUser?.role, filter, typeFilter, search, showToast])

  // Fetch preferences
  const fetchPrefs = useCallback(async () => {
    if (!currentUser?.id) return
    try {
      const res = await fetch(`/api/notifications/preferences?userId=${currentUser.id}`)
      if (!res.ok) return
      const data = await res.json()
      setPrefs(data.preferences)
    } catch { /* silent */ }
  }, [currentUser?.id])

  useEffect(() => { fetchNotifications(1) }, [fetchNotifications])
  useEffect(() => { fetchPrefs() }, [fetchPrefs])

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => setSearch(value), 400)
  }, [])

  // Bulk action
  const handleBulkAction = useCallback(async (action: string) => {
    if (!currentUser?.id) return
    setActionLoading(true)
    try {
      const ids = Array.from(selectedIds)
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notificationIds: ids, userId: currentUser.id }),
      })
      setSelectedIds(new Set())
      showToast('success', `Action "${action}" applied to ${ids.length} notification(s)`)
      fetchNotifications(pagination.page)
    } catch {
      showToast('error', 'Failed to apply action')
    } finally {
      setActionLoading(false)
    }
  }, [currentUser?.id, selectedIds, pagination.page, fetchNotifications, showToast])

  // Delete selected
  const handleDelete = useCallback(async () => {
    if (!currentUser?.id || selectedIds.size === 0) return
    setActionLoading(true)
    try {
      await fetch(`/api/notifications?userId=${currentUser.id}&ids=${Array.from(selectedIds).join(',')}`, {
        method: 'DELETE',
      })
      setSelectedIds(new Set())
      showToast('success', 'Notifications deleted')
      fetchNotifications(pagination.page)
    } catch {
      showToast('error', 'Failed to delete')
    } finally {
      setActionLoading(false)
    }
  }, [currentUser?.id, selectedIds, pagination.page, fetchNotifications, showToast])

  // Toggle selection
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(notifications.map(n => n.id)))
    }
  }, [notifications, selectedIds.size])

  // Save preferences
  const handleSavePrefs = useCallback(async () => {
    if (!currentUser?.id || !prefs) return
    setPrefsSaving(true)
    try {
      await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, ...prefs }),
      })
      showToast('success', 'Preferences saved')
      setPrefsOpen(false)
    } catch {
      showToast('error', 'Failed to save preferences')
    } finally {
      setPrefsSaving(false)
    }
  }, [currentUser?.id, prefs, showToast])

  const updatePref = useCallback((key: string, value: boolean | string) => {
    setPrefs(prev => prev ? { ...prev, [key]: value } : prev)
  }, [])

  // ─── Render ─────────────────────────────────────────────────────────────

  const renderToast = () => (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className={cn(
            'fixed top-6 left-1/2 z-[100] flex items-center gap-2 rounded-2xl px-5 py-3 ios-shadow-lg text-[14px] font-medium',
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          )}
        >
          {toast.type === 'success' ? <CheckCircle className="size-4" /> : <AlertCircle className="size-4" />}
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="space-y-4"
    >
      {renderToast()}

      {/* ─── Header ─── */}
      <div className="flex items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 ios-shadow-sm">
          <Bell className="size-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-[24px] font-bold">Notifications</h1>
          <p className="text-[14px] text-muted-foreground">
            {counts.unread > 0
              ? `You have ${counts.unread} unread notification${counts.unread > 1 ? 's' : ''}`
              : 'All caught up! No new notifications'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-1.5"
            onClick={() => setPrefsOpen(true)}
          >
            <Settings className="size-3.5" />
            <span className="hidden sm:inline">Preferences</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-1.5"
            onClick={() => fetchNotifications(pagination.page)}
          >
            <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Unread', value: counts.unread, icon: Mail, gradient: 'from-indigo-500 to-violet-500' },
          { label: 'Pinned', value: counts.pinned, icon: Pin, gradient: 'from-amber-500 to-orange-500' },
          { label: 'Total', value: counts.total, icon: Inbox, gradient: 'from-blue-500 to-cyan-500' },
          { label: 'This Week', value: notifications.filter(n => {
            const diff = Date.now() - new Date(n.createdAt).getTime()
            return diff < 7 * 86400000
          }).length, icon: Clock, gradient: 'from-emerald-500 to-teal-500' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl ios-shadow-sm bg-card overflow-hidden border-0 shadow-sm">
            <div className={cn('h-1.5 bg-gradient-to-r', stat.gradient)} />
            <div className="p-3.5">
              <div className="flex items-center justify-between">
                <div className={cn('flex size-8 items-center justify-center rounded-xl bg-gradient-to-br text-white', stat.gradient)}>
                  <stat.icon className="size-3.5" />
                </div>
              </div>
              <p className="text-[20px] font-bold mt-1.5">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Gmail-Style Main Area ─── */}
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="border-b px-4 py-2.5 space-y-2.5">
          {/* Search + Actions Row */}
          <div className="flex items-center gap-2">
            <Checkbox
              checked={notifications.length > 0 && selectedIds.size === notifications.length}
              onCheckedChange={toggleSelectAll}
              className="rounded shrink-0"
            />
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                className="pl-9 rounded-xl h-8 sm:h-9 text-[13px]"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            {/* Desktop: Type filter select */}
            <div className="hidden md:block">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px] rounded-xl h-9 text-[12px]">
                  <Filter className="size-3.5 mr-1" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_FILTERS.map(f => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* Mobile: Filter sheet */}
            <MobileFilterSheet
              activeCount={typeFilter !== 'all' ? 1 : 0}
              onClearAll={() => setTypeFilter('all')}
              title="Notification Filters"
            >
              <MobileFilterGroup label="Type">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full rounded-xl h-10 text-[13px]">
                    <Filter className="size-3.5 mr-1" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_FILTERS.map(f => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </MobileFilterGroup>
            </MobileFilterSheet>
          </div>

          {/* Bulk Actions + Filter Tabs */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin -mx-3 px-3 sm:mx-0 sm:px-0">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all whitespace-nowrap',
                    filter === tab.key
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <tab.icon className="size-3.5" />
                  {tab.label}
                  {tab.key === 'unread' && counts.unread > 0 && (
                    <Badge className="rounded-full text-[9px] bg-red-500 text-white h-4 min-w-[16px] px-1 border-0">
                      {counts.unread > 99 ? '99+' : counts.unread}
                    </Badge>
                  )}
                </button>
              ))}
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2">
                <span className="text-[11px] text-muted-foreground">{selectedIds.size} selected</span>
                <Button variant="outline" size="sm" className="rounded-lg h-7 text-[11px] gap-1" onClick={() => handleBulkAction('mark_read')}>
                  <CheckCheck className="size-3" /> Read
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg h-7 text-[11px] gap-1" onClick={() => handleBulkAction('archive')}>
                  <Archive className="size-3" /> Archive
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg h-7 text-[11px] gap-1 text-destructive" onClick={handleDelete}>
                  <Trash2 className="size-3" /> Delete
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Notification List */}
        <div className="min-h-[300px]">
          {loading ? (
            <div className="divide-y divide-border/30">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="size-4 rounded shrink-0" />
                  <Skeleton className="size-9 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="rounded-2xl bg-muted/40 p-4">
                <Bell className="size-8 text-muted-foreground/40" />
              </div>
              <p className="text-[14px] font-medium">No notifications</p>
              <p className="text-[12px] text-muted-foreground">
                {filter === 'unread' ? 'You\'re all caught up!' : filter === 'archived' ? 'No archived notifications' : 'Notifications will appear here'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notifications.map((notif) => {
                const isSelected = selectedIds.has(notif.id)
                const isExpired = notif.expiresAt && new Date(notif.expiresAt) < new Date()

                return (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer group',
                      !notif.isRead && 'bg-primary/[0.02]',
                      isSelected && 'bg-primary/[0.05]',
                      isExpired && 'opacity-50',
                      'hover:bg-muted/20'
                    )}
                    onClick={() => setDetailNotif(notif)}
                  >
                    <div className="pt-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(notif.id)}
                        className="rounded"
                      />
                    </div>

                    {/* Category icon */}
                    <div className={cn(
                      'flex size-9 shrink-0 items-center justify-center rounded-xl text-white mt-0.5',
                      getCategoryColor(notif.category)
                    )}>
                      {getTypeIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {!notif.isRead && (
                          <div className="size-2 shrink-0 rounded-full bg-primary" />
                        )}
                        <p className={cn(
                          'text-[13px] truncate',
                          !notif.isRead ? 'font-semibold' : 'font-medium text-muted-foreground'
                        )}>
                          {notif.title}
                        </p>
                        {getPriorityBadge(notif.priority)}
                        {notif.isPinned && <Pin className="size-3 text-amber-500 shrink-0" />}
                      </div>
                      <p className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5">{notif.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground/60">{timeAgo(notif.createdAt)}</span>
                        {notif.actionLabel && (
                          <span className="text-[10px] font-semibold text-primary hover:underline">{notif.actionLabel} →</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7 rounded-lg">
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={() => handleBulkAction(notif.isRead ? 'mark_unread' : 'mark_read')}>
                            {notif.isRead ? <Mail className="size-3.5 mr-2" /> : <MailOpen className="size-3.5 mr-2" />}
                            {notif.isRead ? 'Mark as unread' : 'Mark as read'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleBulkAction(notif.isPinned ? 'unpin' : 'pin')}>
                            {notif.isPinned ? <PinOff className="size-3.5 mr-2" /> : <Pin className="size-3.5 mr-2" />}
                            {notif.isPinned ? 'Unpin' : 'Pin'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleBulkAction(notif.isArchived ? 'unarchive' : 'archive')}>
                            {notif.isArchived ? <ArchiveRestore className="size-3.5 mr-2" /> : <Archive className="size-3.5 mr-2" />}
                            {notif.isArchived ? 'Unarchive' : 'Archive'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                            <Trash2 className="size-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-2.5 bg-muted/20">
            <p className="text-[11px] text-muted-foreground">
              Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline" size="icon" className="size-7 rounded-lg"
                disabled={pagination.page <= 1}
                onClick={() => fetchNotifications(pagination.page - 1)}
              >
                <ChevronLeft className="size-3.5" />
              </Button>
              <Button
                variant="outline" size="icon" className="size-7 rounded-lg"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchNotifications(pagination.page + 1)}
              >
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ─── Detail Dialog ─── */}
      <Dialog open={!!detailNotif} onOpenChange={() => setDetailNotif(null)}>
        <DialogContent className="rounded-2xl max-w-lg">
          {detailNotif && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'flex size-10 items-center justify-center rounded-xl text-white shrink-0',
                    getCategoryColor(detailNotif.category)
                  )}>
                    {detailNotif.icon ? <span className="text-[18px]">{detailNotif.icon}</span> : getTypeIcon(detailNotif.type)}
                  </div>
                  <div className="min-w-0">
                    <DialogTitle className="text-[16px] font-bold">{detailNotif.title}</DialogTitle>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="rounded-lg text-[10px] capitalize">{detailNotif.type.replace('_', ' ')}</Badge>
                      {getPriorityBadge(detailNotif.priority)}
                      <span className="text-[11px] text-muted-foreground">{timeAgo(detailNotif.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-[14px] text-foreground leading-relaxed">{detailNotif.content}</p>
                {detailNotif.link && (
                  <a href={detailNotif.link} className="flex items-center gap-1.5 text-[12px] text-primary hover:underline">
                    <ExternalLink className="size-3" /> {detailNotif.link}
                  </a>
                )}
                <div className="flex items-center gap-2">
                  {detailNotif.actionLabel && detailNotif.actionUrl && (
                    <Button
                      className="rounded-xl gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white"
                      onClick={() => {
                        if (detailNotif.actionUrl && !detailNotif.actionUrl.startsWith('http')) {
                          useAppStore.getState().setCurrentView(detailNotif.actionUrl as any)
                        } else if (detailNotif.actionUrl) {
                          window.open(detailNotif.actionUrl, '_blank')
                        }
                        setDetailNotif(null)
                      }}
                    >
                      <ExternalLink className="size-3.5" />
                      {detailNotif.actionLabel}
                    </Button>
                  )}
                  {detailNotif.dismissLabel && (
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => setDetailNotif(null)}
                    >
                      {detailNotif.dismissLabel}
                    </Button>
                  )}
                  {!detailNotif.isRead && (
                    <Button
                      variant="outline"
                      className="rounded-xl gap-1.5"
                      onClick={async () => {
                        await fetch('/api/notifications', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'mark_read', notificationIds: [detailNotif.id], userId: currentUser?.id }),
                        })
                        fetchNotifications(pagination.page)
                        setDetailNotif(null)
                      }}
                    >
                      <CheckCheck className="size-3.5" /> Mark as read
                    </Button>
                  )}
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  <div>Category: <span className="capitalize font-medium text-foreground">{detailNotif.category}</span></div>
                  <div>Priority: <span className="capitalize font-medium text-foreground">{detailNotif.priority}</span></div>
                  <div>Received: <span className="font-medium text-foreground">{new Date(detailNotif.createdAt).toLocaleString()}</span></div>
                  <div>Status: <span className="font-medium text-foreground">{detailNotif.isRead ? 'Read' : 'Unread'}{detailNotif.isPinned ? ' · Pinned' : ''}</span></div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Preferences Dialog ─── */}
      <Dialog open={prefsOpen} onOpenChange={setPrefsOpen}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold flex items-center gap-2">
              <Settings className="size-4" /> Notification Preferences
            </DialogTitle>
          </DialogHeader>
          {prefs && (
            <div className="space-y-5">
              {/* Channel Preferences */}
              <div className="space-y-3">
                <Label className="text-[13px] font-semibold">Delivery Channels</Label>
                {[
                  { key: 'enableInApp', label: 'In-App Notifications', desc: 'Show notifications in the app' },
                  { key: 'enableEmail', label: 'Email Notifications', desc: 'Receive email alerts' },
                  { key: 'enablePush', label: 'Push Notifications', desc: 'Mobile push alerts' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium">{item.label}</p>
                      <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={!!prefs[item.key]}
                      onCheckedChange={(v) => updatePref(item.key, v)}
                    />
                  </div>
                ))}
              </div>

              <Separator />

              {/* Type Preferences */}
              <div className="space-y-3">
                <Label className="text-[13px] font-semibold">Notification Types</Label>
                {[
                  { key: 'enrollmentNotifications', label: 'Enrollments', icon: BookOpen },
                  { key: 'courseUpdateNotifications', label: 'Course Updates', icon: Bell },
                  { key: 'assignmentNotifications', label: 'Assignments', icon: BookmarkCheck },
                  { key: 'qaNotifications', label: 'Q&A Answers', icon: MessageSquare },
                  { key: 'achievementNotifications', label: 'Achievements', icon: Gift },
                  { key: 'socialNotifications', label: 'Social', icon: Users },
                  { key: 'securityNotifications', label: 'Security Alerts', icon: Shield },
                  { key: 'payoutNotifications', label: 'Payouts', icon: DollarSign },
                  { key: 'promotionNotifications', label: 'Promotions', icon: Megaphone },
                  { key: 'liveSessionNotifications', label: 'Live Sessions', icon: AlertCircle },
                  { key: 'reminderNotifications', label: 'Reminders', icon: Clock },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon className="size-3.5 text-muted-foreground" />
                      <span className="text-[13px]">{item.label}</span>
                    </div>
                    <Switch
                      checked={!!prefs[item.key]}
                      onCheckedChange={(v) => updatePref(item.key, v)}
                    />
                  </div>
                ))}
              </div>

              <Separator />

              {/* Digest & Sound */}
              <div className="space-y-3">
                <Label className="text-[13px] font-semibold">Delivery & Display</Label>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium">Digest Mode</p>
                    <p className="text-[11px] text-muted-foreground">How often to receive notifications</p>
                  </div>
                  <Select value={prefs.digestMode} onValueChange={(v) => updatePref('digestMode', v)}>
                    <SelectTrigger className="w-[120px] rounded-xl h-8 text-[12px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instant">Instant</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium">Sound</p>
                    <p className="text-[11px] text-muted-foreground">Play sound for new notifications</p>
                  </div>
                  <Switch
                    checked={!!prefs.soundEnabled}
                    onCheckedChange={(v) => updatePref('soundEnabled', v)}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setPrefsOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white"
              onClick={handleSavePrefs}
              disabled={prefsSaving}
            >
              {prefsSaving ? <Loader2 className="size-4 animate-spin" /> : null}
              Save Preferences
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
