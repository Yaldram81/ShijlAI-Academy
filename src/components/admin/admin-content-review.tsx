'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Search, AlertTriangle, CheckCircle, XCircle,
  Eye, EyeOff, Clock, Ban, MessageSquare, HelpCircle,
  ChevronLeft, ChevronRight, FileText, Star, Loader2,
  AlertCircle, X, Send, Zap, Flame, BarChart3,
  MessageCircle, Filter, Trash2, BookmarkPlus, GraduationCap,
  BookOpen, Award, Activity, ExternalLink, FileDown,
  ShieldAlert, ShieldCheck, ShieldX, Sparkles, Users,
  ToggleLeft, Settings, ListFilter, Hash, PenLine,
  Mail, UserX, UserCheck, Bell, Info,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from '@/components/ui/dropdown-menu'

// ─── Types ──────────────────────────────────────────────────────────────────

interface FlaggedItem {
  id: string
  type: 'qa_question' | 'qa_answer' | 'discussion_post' | 'discussion_reply' | 'review'
  content: string
  title: string | null
  user: { id: string; name: string; avatar: string | null; email: string; createdAt: string; status: string }
  course: { id: string; title: string } | null
  isFlagged: boolean
  flaggedReason: string | null
  flagCount: number
  aiAssessment: string | null
  moderationStatus: string
  createdAt: string
  rating: number | null
  flaggedBy: string | null
}

interface ContentStats {
  courseReviews: number
  qaReports: number
  communityPosts: number
  reviews: number
}

interface ModerationSettings {
  id: string
  autoRemoveProfanity: boolean
  autoFlagExternalLinks: boolean
  aiContentScreening: boolean
  requireEmailVerification: boolean
  minimumAccountAgeDays: number
  blocklistWordCount: number
  blocklistWords: string[] | null
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

// ─── Type Badge Config ─────────────────────────────────────────────────────

type FlaggedItemType = FlaggedItem['type']

const TYPE_BADGE_CONFIG: Record<FlaggedItemType, { label: string; badgeClass: string; icon: React.ReactNode }> = {
  qa_question: {
    label: 'Q&A',
    badgeClass: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
    icon: <HelpCircle className="size-3" />,
  },
  qa_answer: {
    label: 'Q&A',
    badgeClass: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
    icon: <HelpCircle className="size-3" />,
  },
  discussion_post: {
    label: 'Community',
    badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
    icon: <MessageCircle className="size-3" />,
  },
  discussion_reply: {
    label: 'Community',
    badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
    icon: <MessageCircle className="size-3" />,
  },
  review: {
    label: 'Review',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    icon: <Star className="size-3" />,
  },
}

const MODERATION_STATUS_CONFIG: Record<string, { label: string; badgeClass: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    icon: <Clock className="size-3.5 text-amber-500" />,
  },
  reviewed: {
    label: 'Reviewed',
    badgeClass: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
    icon: <Eye className="size-3.5 text-sky-500" />,
  },
  actioned: {
    label: 'Actioned',
    badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    icon: <CheckCircle className="size-3.5 text-emerald-500" />,
  },
  dismissed: {
    label: 'Dismissed',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
    icon: <XCircle className="size-3.5 text-slate-400" />,
  },
  escalated: {
    label: 'Escalated',
    badgeClass: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
    icon: <AlertTriangle className="size-3.5 text-red-500" />,
  },
}

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

// ─── Main Component ─────────────────────────────────────────────────────────

export function AdminContentReview() {
  const { currentUser } = useAppStore()

  // ── State: Flagged Items ──
  const [items, setItems] = useState<FlaggedItem[]>([])
  const [stats, setStats] = useState<ContentStats | null>(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── State: Tab & Search ──
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // ── State: Action Loading ──
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // ── State: Moderation Settings ──
  const [settings, setSettings] = useState<ModerationSettings | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  // ── State: Blocklist Dialog ──
  const [showBlocklistDialog, setShowBlocklistDialog] = useState(false)
  const [blocklistText, setBlocklistText] = useState('')

  // ── State: Confirm Dialog ──
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    itemId: string
    itemType: string
    action: string
    label: string
    description: string
  } | null>(null)

  // ── State: Item Detail Sheet ──
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailItem, setDetailItem] = useState<FlaggedItem | null>(null)

  // ── Refs ──
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)

  // ── Tab Mapping ──
  const getTabParam = useCallback((tab: string): string => {
    switch (tab) {
      case 'course_reviews': return 'qa_question'
      case 'qa_reports': return 'qa'
      case 'community_posts': return 'discussion'
      case 'reviews': return 'review'
      default: return 'all'
    }
  }, [])

  // ── Fetch Items ──
  const fetchItems = useCallback(async (page = 1) => {
    setLoading(true)
    setError(null)
    try {
      const tabParam = getTabParam(activeTab)
      const params = new URLSearchParams({
        tab: tabParam,
        page: String(page),
        limit: '20',
        search,
      })
      const res = await fetch(`/api/admin/content-review?${params}`)
      if (!res.ok) throw new Error('Failed to fetch flagged content')
      const data = await res.json()
      setItems(data.items || [])
      setStats(data.stats || null)
      setPagination(data.pagination || { page, limit: 20, total: 0, totalPages: 0 })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load flagged content')
    } finally {
      setLoading(false)
    }
  }, [activeTab, search, getTabParam])

  // ── Fetch Settings ──
  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true)
    try {
      const res = await fetch('/api/admin/content-review/settings')
      if (!res.ok) throw new Error('Failed to fetch settings')
      const data = await res.json()
      setSettings(data)
      setBlocklistText((data.blocklistWords || []).join('\n'))
    } catch {
      setSettings(null)
    } finally {
      setSettingsLoading(false)
    }
  }, [])

  // ── Effects ──
  useEffect(() => {
    fetchItems(1)
  }, [fetchItems])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // ── Debounced Search ──
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setSearch(value)
    }, 400)
  }, [])

  // ── Tab Click ──
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
  }, [])

  // ── Pagination ──
  const goToPage = useCallback((page: number) => {
    fetchItems(page)
  }, [fetchItems])

  // ── Handle Action ──
  const handleAction = useCallback(async (itemId: string, itemType: string, action: string) => {
    setActionLoading(`${itemId}-${action}`)
    try {
      const res = await fetch(`/api/admin/content-review/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: itemType, action }),
      })
      if (!res.ok) throw new Error(`Action "${action}" failed`)
      fetchItems(pagination.page)
      if (detailOpen && detailItem?.id === itemId) {
        setDetailOpen(false)
        setDetailItem(null)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
      setConfirmDialog(null)
    }
  }, [fetchItems, pagination.page, detailOpen, detailItem?.id])

  // ── Confirm & Execute Action ──
  const handleConfirmAction = useCallback(() => {
    if (!confirmDialog) return
    handleAction(confirmDialog.itemId, confirmDialog.itemType, confirmDialog.action)
  }, [confirmDialog, handleAction])

  // ── Request Confirm for Destructive ──
  const requestAction = useCallback((itemId: string, itemType: string, action: string) => {
    const destructiveActions: Record<string, { label: string; description: string }> = {
      remove_post: {
        label: 'Remove Post',
        description: 'This will permanently remove the flagged post from the platform. This action cannot be undone.',
      },
      remove_review: {
        label: 'Remove Review',
        description: 'This will permanently remove the flagged review. The course rating will be recalculated.',
      },
      suspend_user: {
        label: 'Suspend User',
        description: 'The user will be suspended and unable to access the platform until reinstated.',
      },
      ban_user: {
        label: 'Ban User',
        description: 'The user will be permanently banned from the platform. This is irreversible.',
      },
      ban_account: {
        label: 'Ban Account',
        description: 'This account will be permanently banned from the platform. This is irreversible.',
      },
    }

    if (destructiveActions[action]) {
      setConfirmDialog({
        open: true,
        itemId,
        itemType,
        action,
        label: destructiveActions[action].label,
        description: destructiveActions[action].description,
      })
    } else {
      handleAction(itemId, itemType, action)
    }
  }, [handleAction])

  // ── Save Settings ──
  const handleSaveSettings = useCallback(async () => {
    if (!settings) return
    setSettingsSaving(true)
    try {
      const res = await fetch('/api/admin/content-review/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoRemoveProfanity: settings.autoRemoveProfanity,
          autoFlagExternalLinks: settings.autoFlagExternalLinks,
          aiContentScreening: settings.aiContentScreening,
          requireEmailVerification: settings.requireEmailVerification,
          minimumAccountAgeDays: settings.minimumAccountAgeDays,
        }),
      })
      if (!res.ok) throw new Error('Failed to save settings')
      setSettingsSaved(true)
      setTimeout(() => setSettingsSaved(false), 2000)
    } catch (err) {
      console.error(err)
    } finally {
      setSettingsSaving(false)
    }
  }, [settings])

  // ── Save Blocklist ──
  const handleSaveBlocklist = useCallback(async () => {
    setSettingsSaving(true)
    try {
      const words = blocklistText
        .split('\n')
        .map((w) => w.trim())
        .filter((w) => w.length > 0)
      const res = await fetch('/api/admin/content-review/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocklistWords: words }),
      })
      if (!res.ok) throw new Error('Failed to save blocklist')
      setShowBlocklistDialog(false)
      fetchSettings()
    } catch (err) {
      console.error(err)
    } finally {
      setSettingsSaving(false)
    }
  }, [blocklistText, fetchSettings])

  // ── View Item Detail ──
  const handleViewItem = useCallback((item: FlaggedItem) => {
    setDetailItem(item)
    setDetailOpen(true)
  }, [])

  // ── Get Type Badge ──
  const getTypeBadge = useCallback((type: FlaggedItemType) => {
    return TYPE_BADGE_CONFIG[type] || TYPE_BADGE_CONFIG.qa_question
  }, [])

  // ── Get Type Label ──
  const getTypeLabel = useCallback((type: FlaggedItemType): string => {
    return TYPE_BADGE_CONFIG[type]?.label || 'Unknown'
  }, [])

  // ── Get Action Buttons ──
  const getActionButtons = useCallback((item: FlaggedItem) => {
    const isReview = item.type === 'review'
    const isQA = item.type === 'qa_question' || item.type === 'qa_answer'
    const isCommunity = item.type === 'discussion_post' || item.type === 'discussion_reply'

    if (isReview) {
      return [
        {
          key: 'remove_review',
          label: 'Remove review',
          icon: <Trash2 className="size-3.5" />,
          variant: 'outline' as const,
          colorClass: 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-800',
        },
        {
          key: 'keep_review',
          label: 'Keep review',
          icon: <CheckCircle className="size-3.5" />,
          variant: 'outline' as const,
          colorClass: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
        },
        {
          key: 'ban_account',
          label: 'Ban account',
          icon: <ShieldX className="size-3.5" />,
          variant: 'outline' as const,
          colorClass: 'text-red-700 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-300 dark:border-red-800',
        },
        {
          key: 'investigate_account',
          label: 'Investigate account',
          icon: <Search className="size-3.5" />,
          variant: 'outline' as const,
          colorClass: 'text-slate-600 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-950/30 border-slate-200 dark:border-slate-700',
        },
      ]
    }

    // Q&A and Community actions
    return [
      {
        key: 'remove_post',
        label: 'Remove post',
        icon: <Trash2 className="size-3.5" />,
        variant: 'outline' as const,
        colorClass: 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-800',
      },
      {
        key: 'keep_post',
        label: 'Keep post',
        icon: <CheckCircle className="size-3.5" />,
        variant: 'outline' as const,
        colorClass: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800',
      },
      {
        key: 'warn_user',
        label: 'Warn user',
        icon: <AlertTriangle className="size-3.5" />,
        variant: 'outline' as const,
        colorClass: 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 border-amber-200 dark:border-amber-800',
      },
      {
        key: 'suspend_user',
        label: 'Suspend user',
        icon: <Ban className="size-3.5" />,
        variant: 'outline' as const,
        colorClass: 'text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/30 border-orange-200 dark:border-orange-800',
      },
      {
        key: 'ban_user',
        label: 'Ban user',
        icon: <ShieldX className="size-3.5" />,
        variant: 'outline' as const,
        colorClass: 'text-red-700 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-300 dark:border-red-800',
      },
      ...(isQA ? [{
        key: 'contact_instructor',
        label: 'Contact instructor',
        icon: <Mail className="size-3.5" />,
        variant: 'outline' as const,
        colorClass: 'text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-950/30 border-sky-200 dark:border-sky-800',
      }] : []),
      {
        key: 'add_watchlist',
        label: 'Add to watchlist',
        icon: <BookmarkPlus className="size-3.5" />,
        variant: 'outline' as const,
        colorClass: 'text-slate-600 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-950/30 border-slate-200 dark:border-slate-700',
      },
    ]
  }, [])

  // ── Tab Data ──
  const tabs = [
    { key: 'all', label: 'All', count: (stats?.courseReviews ?? 0) + (stats?.qaReports ?? 0) + (stats?.communityPosts ?? 0) + (stats?.reviews ?? 0) },
    { key: 'course_reviews', label: 'Course Reviews', count: stats?.courseReviews ?? 0 },
    { key: 'qa_reports', label: 'Q&A Reports', count: stats?.qaReports ?? 0 },
    { key: 'community_posts', label: 'Community Posts', count: stats?.communityPosts ?? 0 },
    { key: 'reviews', label: 'Reviews', count: stats?.reviews ?? 0 },
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
      className="space-y-6"
    >
      {/* ─── Header Section ─── */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 ios-shadow-sm">
            <ShieldAlert className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-foreground flex items-center gap-3">
              Content Review &amp; Moderation
              <Badge variant="secondary" className="text-[11px] rounded-xl px-2.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                {formatNumber(tabs[0].count)} flagged
              </Badge>
            </h1>
            <p className="text-[15px] text-muted-foreground">Review flagged content, manage reports, and configure moderation rules</p>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex rounded-xl bg-muted/60 p-1 gap-0.5 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                'flex-1 min-w-fit rounded-lg px-3 py-2 text-[13px] font-medium transition-all ios-press whitespace-nowrap',
                activeTab === tab.key
                  ? 'bg-card ios-shadow-sm text-foreground border-b-2 border-amber-500'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}{' '}
              <span className="text-[11px] opacity-70">({formatNumber(tab.count)})</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Search Bar ─── */}
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search flagged content by text, user, or reason..."
                className="pl-9 rounded-xl h-9"
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-9" onClick={() => fetchItems(pagination.page)}>
                    <Activity className="size-3.5" />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh content list</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Flagged Items List ─── */}
      <div className="space-y-4">
        {loading ? (
          // Loading skeletons
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-20 rounded-lg" />
                    <Skeleton className="h-5 w-16 rounded-lg" />
                    <Skeleton className="h-5 w-32 rounded-lg" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-8 rounded-xl" />
                    <Skeleton className="h-4 w-40 rounded-lg" />
                  </div>
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full rounded-lg" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-24 rounded-lg" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
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
                <p className="text-[15px] font-medium">Failed to load flagged content</p>
                <p className="text-[13px] text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => fetchItems(1)}>
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : items.length === 0 ? (
          <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center gap-3">
                <ShieldCheck className="size-10 text-emerald-400" />
                <p className="text-[15px] font-medium">No flagged content</p>
                <p className="text-[13px] text-muted-foreground">All clear! No content requires review at this time.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => {
                const typeConf = getTypeBadge(item.type)
                const modStatusConf = MODERATION_STATUS_CONFIG[item.moderationStatus] || MODERATION_STATUS_CONFIG.pending
                const actionButtons = getActionButtons(item)

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: i * 0.04, ...springTransition }}
                  >
                    <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-5 space-y-3">
                        {/* ── Card Header ── */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle className="size-4 text-amber-500" />
                              <span className="text-[12px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                FLAGGED
                              </span>
                            </div>
                            <Badge variant="secondary" className={cn('text-[11px] rounded-lg gap-1 font-medium', typeConf.badgeClass)}>
                              {typeConf.icon}
                              {typeConf.label}
                            </Badge>
                            {item.course && (
                              <Badge variant="secondary" className="text-[11px] rounded-lg gap-1 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                <BookOpen className="size-3" />
                                {item.course.title}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={cn('text-[10px] rounded-lg gap-1', modStatusConf.badgeClass)}>
                              {modStatusConf.icon}
                              {modStatusConf.label}
                            </Badge>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 rounded-lg"
                                  onClick={() => handleViewItem(item)}
                                >
                                  <Eye className="size-3.5 text-muted-foreground" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>View details</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>

                        {/* ── Meta: Posted by, Date, Flag count ── */}
                        <div className="flex items-center gap-2 flex-wrap text-[13px] text-muted-foreground">
                          <span>Posted by:</span>
                          <div className="flex items-center gap-1.5">
                            <Avatar className="size-5 rounded-md">
                              <AvatarImage src={item.user.avatar || undefined} />
                              <AvatarFallback className="text-[8px] bg-primary/10 rounded-md">
                                {getInitials(item.user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-foreground">{item.user.name}</span>
                          </div>
                          <span className="text-border">·</span>
                          <span>{formatDate(item.createdAt)}</span>
                          <span className="text-border">·</span>
                          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="size-3" />
                            <span className="font-medium">Flagged by {item.flagCount} user{item.flagCount !== 1 ? 's' : ''}</span>
                          </div>
                          {item.rating !== null && item.type === 'review' && (
                            <>
                              <span className="text-border">·</span>
                              <div className="flex items-center gap-1">
                                <Star className="size-3 text-amber-500 fill-amber-500" />
                                <span className="font-medium">{item.rating}/5</span>
                              </div>
                            </>
                          )}
                          {item.flaggedBy && item.type === 'review' && (
                            <>
                              <span className="text-border">·</span>
                              <div className="flex items-center gap-1">
                                <Users className="size-3" />
                                <span>Flagged by: {item.flaggedBy}</span>
                              </div>
                            </>
                          )}
                        </div>

                        {/* ── Content Block ── */}
                        {item.title && (
                          <p className="text-[14px] font-semibold text-foreground">{item.title}</p>
                        )}
                        <div className="border-l-4 border-amber-400 dark:border-amber-600 pl-3 py-1 bg-amber-50/50 dark:bg-amber-950/20 rounded-r-lg">
                          <p className="text-[13px] text-foreground/90 leading-relaxed line-clamp-4">
                            &ldquo;{item.content}&rdquo;
                          </p>
                        </div>

                        {/* ── Flagged Reason ── */}
                        {item.flaggedReason && (
                          <div className="flex items-start gap-2 bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2">
                            <AlertTriangle className="size-3.5 text-red-500 mt-0.5 shrink-0" />
                            <div>
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                                Flag Reason
                              </span>
                              <p className="text-[13px] text-red-700 dark:text-red-300 mt-0.5">{item.flaggedReason}</p>
                            </div>
                          </div>
                        )}

                        {/* ── AI Assessment ── */}
                        {item.aiAssessment && (
                          <div className="flex items-start gap-2 bg-sky-50 dark:bg-sky-950/20 rounded-lg px-3 py-2 border border-sky-100 dark:border-sky-900/40">
                            <Sparkles className="size-3.5 text-sky-500 mt-0.5 shrink-0" />
                            <div>
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                                AI Assessment
                              </span>
                              <p className="text-[13px] text-sky-700 dark:text-sky-300 mt-0.5">{item.aiAssessment}</p>
                            </div>
                          </div>
                        )}

                        {/* ── Action Buttons ── */}
                        <Separator className="my-1" />
                        <div className="flex flex-wrap gap-2">
                          {actionButtons.map((btn) => (
                            <Tooltip key={btn.key}>
                              <TooltipTrigger asChild>
                                <Button
                                  variant={btn.variant}
                                  size="sm"
                                  className={cn(
                                    'rounded-xl gap-1.5 h-8 text-[12px] font-medium ios-press',
                                    btn.colorClass
                                  )}
                                  onClick={() => requestAction(item.id, item.type, btn.key)}
                                  disabled={actionLoading === `${item.id}-${btn.key}`}
                                >
                                  {actionLoading === `${item.id}-${btn.key}` ? (
                                    <Loader2 className="size-3.5 animate-spin" />
                                  ) : (
                                    btn.icon
                                  )}
                                  <span className="hidden sm:inline">{btn.label}</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{btn.label}</TooltipContent>
                            </Tooltip>
                          ))}
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
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, pagination.page - 2) + i
                        if (pageNum > pagination.totalPages) return null
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === pagination.page ? 'default' : 'outline'}
                            size="icon"
                            className={cn(
                              'size-8 rounded-lg text-[13px]',
                              pageNum === pagination.page && 'bg-amber-500 hover:bg-amber-600 text-white'
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

      {/* ─── Content Moderation Settings ─── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, ...springTransition }}
      >
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <Settings className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-[18px] font-bold">Content Moderation Settings</CardTitle>
                <p className="text-[13px] text-muted-foreground">Configure automated moderation and content screening rules</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {settingsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-48 rounded-lg" />
                      <Skeleton className="h-3 w-64 rounded-lg" />
                    </div>
                    <Skeleton className="size-8 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : settings ? (
              <>
                {/* Toggle Settings */}
                <div className="space-y-4">
                  {/* Auto-remove profanity */}
                  <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950/40 shrink-0 mt-0.5">
                        <ShieldX className="size-4 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium">Auto-remove posts with profanity</p>
                        <p className="text-[12px] text-muted-foreground">Automatically remove content that contains profane language</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.autoRemoveProfanity}
                      onCheckedChange={(checked) => setSettings({ ...settings, autoRemoveProfanity: checked })}
                    />
                  </div>

                  {/* Auto-flag external links */}
                  <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40 shrink-0 mt-0.5">
                        <ExternalLink className="size-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium">Auto-flag external links in Q&amp;A</p>
                        <p className="text-[12px] text-muted-foreground">Automatically flag Q&amp;A posts containing external URLs</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.autoFlagExternalLinks}
                      onCheckedChange={(checked) => setSettings({ ...settings, autoFlagExternalLinks: checked })}
                    />
                  </div>

                  {/* AI content screening */}
                  <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950/40 shrink-0 mt-0.5">
                        <Sparkles className="size-4 text-sky-600 dark:text-sky-400" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium">AI content screening on new posts</p>
                        <p className="text-[12px] text-muted-foreground">Use AI to screen new content for policy violations before publishing</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.aiContentScreening}
                      onCheckedChange={(checked) => setSettings({ ...settings, aiContentScreening: checked })}
                    />
                  </div>

                  {/* Require email verification */}
                  <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40 shrink-0 mt-0.5">
                        <Mail className="size-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium">Require email verification to post</p>
                        <p className="text-[12px] text-muted-foreground">Users must verify their email before posting content</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.requireEmailVerification}
                      onCheckedChange={(checked) => setSettings({ ...settings, requireEmailVerification: checked })}
                    />
                  </div>
                </div>

                <Separator />

                {/* Minimum Account Age */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-muted/30">
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/40 shrink-0 mt-0.5">
                      <Clock className="size-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium">Minimum account age to post</p>
                      <p className="text-[12px] text-muted-foreground">New accounts must be at least this many days old to post</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={365}
                      value={settings.minimumAccountAgeDays}
                      onChange={(e) => setSettings({ ...settings, minimumAccountAgeDays: parseInt(e.target.value) || 0 })}
                      className="w-20 rounded-xl h-9 text-center"
                    />
                    <span className="text-[13px] text-muted-foreground">days</span>
                  </div>
                </div>

                {/* Blocklist */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-muted/30">
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                      <ListFilter className="size-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium">Content blocklist</p>
                      <p className="text-[12px] text-muted-foreground">Block content containing specific words or phrases</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-1.5 h-9"
                    onClick={() => {
                      setBlocklistText((settings.blocklistWords || []).join('\n'))
                      setShowBlocklistDialog(true)
                    }}
                  >
                    <PenLine className="size-3.5" />
                    Edit blocklist — {settings.blocklistWordCount} words
                  </Button>
                </div>

                <Separator />

                {/* Save Button */}
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-muted-foreground">
                    Changes are applied immediately after saving
                  </p>
                  <motion.div
                    animate={settingsSaved ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <Button
                      className="rounded-xl gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                      onClick={handleSaveSettings}
                      disabled={settingsSaving}
                    >
                      {settingsSaving ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : settingsSaved ? (
                        <CheckCircle className="size-4" />
                      ) : (
                        <Shield className="size-4" />
                      )}
                      {settingsSaved ? 'Settings Saved!' : 'Save Settings'}
                    </Button>
                  </motion.div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <AlertCircle className="size-8 text-muted-foreground/30" />
                <p className="text-[14px] text-muted-foreground">Unable to load moderation settings</p>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={fetchSettings}>
                  Retry
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Confirm Action Dialog ─── */}
      <Dialog
        open={confirmDialog?.open ?? false}
        onOpenChange={(open) => {
          if (!open) setConfirmDialog(null)
        }}
      >
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="size-5" />
              {confirmDialog?.label}
            </DialogTitle>
            <DialogDescription className="text-[14px] pt-2">
              {confirmDialog?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-3 mt-2">
            <div className="flex items-start gap-2">
              <Info className="size-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-[12px] text-red-600 dark:text-red-400">
                This is a significant moderation action. Please confirm you want to proceed.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setConfirmDialog(null)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white gap-1.5"
              onClick={handleConfirmAction}
              disabled={actionLoading === `${confirmDialog?.itemId}-${confirmDialog?.action}`}
            >
              {actionLoading === `${confirmDialog?.itemId}-${confirmDialog?.action}` ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <AlertTriangle className="size-4" />
              )}
              Confirm {confirmDialog?.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Blocklist Dialog ─── */}
      <Dialog open={showBlocklistDialog} onOpenChange={setShowBlocklistDialog}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListFilter className="size-5 text-amber-600 dark:text-amber-400" />
              Edit Content Blocklist
            </DialogTitle>
            <DialogDescription className="text-[14px]">
              Enter words or phrases to block, one per line. Content containing these terms will be automatically flagged or removed depending on your settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="size-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-[12px] text-amber-700 dark:text-amber-400">
                Words are case-insensitive and matched as substrings. Be careful not to block common innocent words.
              </p>
            </div>
            <Textarea
              placeholder="Enter blocked words, one per line..."
              className="rounded-xl min-h-[240px] font-mono text-[13px] resize-none"
              value={blocklistText}
              onChange={(e) => setBlocklistText(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-muted-foreground">
                {blocklistText.split('\n').filter((w) => w.trim().length > 0).length} word(s) entered
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setBlocklistText('')}
                >
                  Clear All
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setShowBlocklistDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xl gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              onClick={handleSaveBlocklist}
              disabled={settingsSaving}
            >
              {settingsSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle className="size-4" />
              )}
              Save Blocklist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Item Detail Sheet ─── */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-hidden">
          {detailItem ? (
            <ScrollArea className="h-full">
              <div className="space-y-6 p-6">
                {/* Header */}
                <SheetHeader className="p-0">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/40 shrink-0">
                      <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <SheetTitle className="text-[18px] font-bold">
                        {detailItem.title || `${getTypeLabel(detailItem.type)} Content`}
                      </SheetTitle>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge variant="secondary" className={cn('text-[11px] rounded-lg gap-1', getTypeBadge(detailItem.type).badgeClass)}>
                          {getTypeBadge(detailItem.type).icon}
                          {getTypeBadge(detailItem.type).label}
                        </Badge>
                        <Badge variant="secondary" className={cn('text-[10px] rounded-lg', MODERATION_STATUS_CONFIG[detailItem.moderationStatus]?.badgeClass)}>
                          {MODERATION_STATUS_CONFIG[detailItem.moderationStatus]?.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </SheetHeader>

                <Separator />

                {/* User Info */}
                <div className="space-y-3">
                  <h3 className="text-[15px] font-semibold flex items-center gap-2">
                    <Users className="size-4 text-muted-foreground" /> Posted By
                  </h3>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                    <Avatar className="size-10 rounded-xl">
                      <AvatarImage src={detailItem.user.avatar || undefined} />
                      <AvatarFallback className="text-[11px] bg-primary/10 rounded-xl">
                        {getInitials(detailItem.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold">{detailItem.user.name}</p>
                      <p className="text-[12px] text-muted-foreground truncate">{detailItem.user.email}</p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px] rounded-lg',
                        detailItem.user.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : detailItem.user.status === 'suspended'
                          ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      )}
                    >
                      {detailItem.user.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground px-1">
                    <span>Joined: {formatDate(detailItem.user.createdAt)}</span>
                    <span>Posted: {formatDateTime(detailItem.createdAt)}</span>
                    {detailItem.course && <span>Course: {detailItem.course.title}</span>}
                  </div>
                </div>

                <Separator />

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-[15px] font-semibold flex items-center gap-2">
                    <FileText className="size-4 text-muted-foreground" /> Content
                  </h3>
                  <div className="border-l-4 border-amber-400 dark:border-amber-600 pl-3 py-2 bg-amber-50/50 dark:bg-amber-950/20 rounded-r-lg">
                    <p className="text-[13px] text-foreground/90 leading-relaxed">
                      {detailItem.content}
                    </p>
                  </div>
                </div>

                {/* Flag Details */}
                {detailItem.flaggedReason && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-[15px] font-semibold flex items-center gap-2">
                        <AlertTriangle className="size-4 text-red-500" /> Flag Details
                      </h3>
                      <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-semibold text-red-600 dark:text-red-400">Reason:</span>
                          <span className="text-[13px] text-red-700 dark:text-red-300">{detailItem.flaggedReason}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-semibold text-red-600 dark:text-red-400">Flag count:</span>
                          <span className="text-[13px] text-red-700 dark:text-red-300">{detailItem.flagCount} user{detailItem.flagCount !== 1 ? 's' : ''}</span>
                        </div>
                        {detailItem.flaggedBy && (
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold text-red-600 dark:text-red-400">Flagged by:</span>
                            <span className="text-[13px] text-red-700 dark:text-red-300">{detailItem.flaggedBy}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* AI Assessment */}
                {detailItem.aiAssessment && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-[15px] font-semibold flex items-center gap-2">
                        <Sparkles className="size-4 text-sky-500" /> AI Assessment
                      </h3>
                      <div className="bg-sky-50 dark:bg-sky-950/20 rounded-xl p-3 border border-sky-100 dark:border-sky-900/40">
                        <p className="text-[13px] text-sky-700 dark:text-sky-300 leading-relaxed">
                          {detailItem.aiAssessment}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {/* Review-specific info */}
                {detailItem.type === 'review' && detailItem.rating !== null && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h3 className="text-[15px] font-semibold flex items-center gap-2">
                        <Star className="size-4 text-amber-500" /> Review Rating
                      </h3>
                      <div className="flex items-center gap-1.5 p-3 rounded-xl bg-muted/30">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={cn(
                              'size-5',
                              idx < detailItem.rating!
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-slate-300 dark:text-slate-600'
                            )}
                          />
                        ))}
                        <span className="ml-2 text-[14px] font-medium">{detailItem.rating}/5</span>
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Quick Actions in Detail */}
                <div className="space-y-3">
                  <h3 className="text-[15px] font-semibold flex items-center gap-2">
                    <Zap className="size-4 text-amber-500" /> Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {getActionButtons(detailItem).map((btn) => (
                      <Button
                        key={btn.key}
                        variant={btn.variant}
                        size="sm"
                        className={cn(
                          'rounded-xl gap-1.5 h-9 text-[12px] font-medium ios-press justify-start',
                          btn.colorClass
                        )}
                        onClick={() => requestAction(detailItem.id, detailItem.type, btn.key)}
                        disabled={actionLoading === `${detailItem.id}-${btn.key}`}
                      >
                        {actionLoading === `${detailItem.id}-${btn.key}` ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          btn.icon
                        )}
                        {btn.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* User History Context */}
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-[15px] font-semibold flex items-center gap-2">
                    <Activity className="size-4 text-muted-foreground" /> User Context
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-muted/30 text-center">
                      <p className="text-[18px] font-bold text-foreground">{detailItem.flagCount}</p>
                      <p className="text-[11px] text-muted-foreground">Times Flagged</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 text-center">
                      <p className="text-[18px] font-bold text-foreground capitalize">{detailItem.moderationStatus}</p>
                      <p className="text-[11px] text-muted-foreground">Status</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 text-center">
                      <p className="text-[18px] font-bold text-foreground">{getTypeLabel(detailItem.type)}</p>
                      <p className="text-[11px] text-muted-foreground">Content Type</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 text-center">
                      <p className="text-[18px] font-bold text-foreground capitalize">{detailItem.user.status}</p>
                      <p className="text-[11px] text-muted-foreground">User Status</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="size-8 animate-spin text-amber-500" />
              <p className="text-[13px] text-muted-foreground">Loading item details...</p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  )
}
