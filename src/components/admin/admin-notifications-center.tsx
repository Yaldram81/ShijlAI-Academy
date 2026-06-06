'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Send, FileText, Clock, Settings, Search, Sparkles,
  Mail, MessageSquare, Smartphone, Globe, Users, GraduationCap,
  BookOpen, Edit3, Eye, Plus, ChevronLeft, ChevronRight,
  Loader2, AlertCircle, CheckCircle, XCircle, ExternalLink,
  Calendar, Zap, Shield, BarChart3, TrendingUp, EyeOff,
  Megaphone, Gift, AlertTriangle, Heart, Star, Info,
  Inbox, Pin, Archive, Trash2, CheckCheck, Filter,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

// ─── Types ──────────────────────────────────────────────────────────────────

interface NotificationTemplate {
  id: string
  name: string
  title: string
  subject: string
  body: string
  type: string
  category: string
  isActive: boolean
  variables: string[]
  icon: string | null
  link: string | null
  usageCount: number
  createdAt: string
  updatedAt: string
}

interface NotificationLog {
  id: string
  title: string
  message: string
  type: string
  targetAudience: string
  targetDetails: Record<string, string> | null
  priority: string
  link: string | null
  sentCount: number
  openedCount: number
  clickCount: number
  openRate: number
  ctr: number
  status: string
  scheduledAt: string | null
  sentAt: string | null
  templateId: string | null
  createdBy: string | null
  createdAt: string
}

interface HistoryStats {
  totalSent: number
  avgOpenRate: number
  avgCtr: number
  totalLogs: number
}

// ─── My Notification Type (for admin's own notifications) ───────────────────

interface MyNotification {
  id: string
  userId: string
  type: string
  title: string
  content: string
  icon: string | null
  priority: string
  category: string | null
  actionLabel: string | null
  actionUrl: string | null
  dismissLabel: string | null
  isRead: boolean
  readAt: string | null
  isArchived: boolean
  archivedAt: string | null
  isPinned: boolean
  pinnedAt: string | null
  expiresAt: string | null
  createdAt: string
}

interface NotificationSettings {
  id: string
  enableInApp: boolean
  enableEmail: boolean
  enablePush: boolean
  enableSms: boolean
  maxNotificationsPerDay: number
  maxBulkNotificationsPerDay: number
  quietHoursStart: string
  quietHoursEnd: string
  availableSegments: string[]
  senderName: string
  senderEmail: string
  updatedAt: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return num.toLocaleString()
}

function formatFullNumber(num: number): string {
  return num.toLocaleString()
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Constants ──────────────────────────────────────────────────────────────

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

const TYPE_OPTIONS = [
  { value: 'in_app', label: 'In-app', color: 'bg-violet-500', icon: Bell },
  { value: 'email', label: 'Email', color: 'bg-sky-500', icon: Mail },
  { value: 'push', label: 'Push mobile', color: 'bg-emerald-500', icon: Smartphone },
  { value: 'sms', label: 'SMS', color: 'bg-amber-500', icon: MessageSquare },
  { value: 'all', label: 'All channels', color: 'bg-gradient-to-r from-violet-500 to-indigo-500', icon: Globe },
] as const

const TARGET_OPTIONS = [
  { value: 'all_users', label: 'All users', count: '48,214' },
  { value: 'all_students', label: 'All students', count: '46,891' },
  { value: 'all_instructors', label: 'All instructors', count: '312' },
  { value: 'specific_user', label: 'Specific user' },
  { value: 'segment', label: 'Segment' },
  { value: 'course_enrollees', label: 'Course enrollees' },
] as const

const SEGMENT_OPTIONS = [
  { value: 'inactive_30d', label: 'Students inactive 30d' },
  { value: 'inactive_7d', label: 'Students inactive 7d' },
  { value: 'new_users_7d', label: 'New users 7d' },
  { value: 'top_spenders', label: 'Top spenders' },
  { value: 'free_users', label: 'Free users' },
  { value: 'paid_users', label: 'Paid users' },
] as const

const TYPE_BADGE_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  in_app: { label: 'In-app', badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400' },
  email: { label: 'Email', badgeClass: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400' },
  push: { label: 'Push', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
  sms: { label: 'SMS', badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
  both: { label: 'All', badgeClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' },
  all: { label: 'All', badgeClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' },
}

const CATEGORY_BADGE_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  system: { label: 'System', badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' },
  marketing: { label: 'Marketing', badgeClass: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400' },
  engagement: { label: 'Engagement', badgeClass: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400' },
  transactional: { label: 'Transactional', badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' },
  reminder: { label: 'Reminder', badgeClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400' },
  promotional: { label: 'Promotional', badgeClass: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-400' },
}

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  bell: <Bell className="size-4" />,
  megaphone: <Megaphone className="size-4" />,
  gift: <Gift className="size-4" />,
  'alert-triangle': <AlertTriangle className="size-4" />,
  heart: <Heart className="size-4" />,
  star: <Star className="size-4" />,
  zap: <Zap className="size-4" />,
  book: <BookOpen className="size-4" />,
  shield: <Shield className="size-4" />,
  calendar: <Calendar className="size-4" />,
  mail: <Mail className="size-4" />,
  'graduation-cap': <GraduationCap className="size-4" />,
}

const TARGET_AUDIENCE_LABELS: Record<string, string> = {
  all_users: 'All Users',
  all_students: 'All Students',
  all_instructors: 'All Instructors',
  specific_user: 'Specific User',
  segment: 'Segment',
  course_enrollees: 'Course Enrollees',
}

// ─── Admin Notification Type Config ─────────────────────────────────────────

const ADMIN_NOTIF_TYPE_CONFIG: Record<string, { label: string; badgeClass: string; icon: React.ElementType; gradient: string }> = {
  enrollment: { label: 'Enrollment', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400', icon: GraduationCap, gradient: 'from-emerald-500 to-teal-500' },
  payout: { label: 'Payout', badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400', icon: TrendingUp, gradient: 'from-amber-500 to-orange-500' },
  security: { label: 'Security', badgeClass: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400', icon: Shield, gradient: 'from-red-500 to-rose-500' },
  reminder: { label: 'Reminder', badgeClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400', icon: Clock, gradient: 'from-cyan-500 to-blue-500' },
  system: { label: 'System', badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400', icon: Settings, gradient: 'from-slate-500 to-gray-500' },
  announcement: { label: 'Announcement', badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400', icon: Megaphone, gradient: 'from-violet-500 to-indigo-500' },
}

const MY_NOTIF_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
  { value: 'pinned', label: 'Pinned' },
  { value: 'archived', label: 'Archived' },
] as const

// ─── Main Component ─────────────────────────────────────────────────────────

export function AdminNotificationsCenter() {
  const { currentUser } = useAppStore()

  // ── Active Tab ──
  const [activeTab, setActiveTab] = useState('my-notifications')

  // ── Toast State ──
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const toastTimeout = useRef<NodeJS.Timeout | null>(null)

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    toastTimeout.current = setTimeout(() => setToast(null), 4000)
  }, [])

  // ═══════════════════════════════════════════════════════════════
  // TAB 1: SEND NOTIFICATION STATE
  // ═══════════════════════════════════════════════════════════════
  const [sendForm, setSendForm] = useState({
    type: 'in_app',
    targetAudience: 'all_users',
    specificUserId: '',
    segmentName: '',
    courseId: '',
    title: '',
    message: '',
    linkType: 'none' as 'none' | 'url',
    linkUrl: '',
    priority: 'normal' as 'normal' | 'high',
    scheduleType: 'now' as 'now' | 'scheduled',
    scheduleDate: '',
    scheduleTime: '',
    scheduleTimezone: 'UTC',
  })
  const [sending, setSending] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)

  // ═══════════════════════════════════════════════════════════════
  // TAB 2: TEMPLATES STATE
  // ═══════════════════════════════════════════════════════════════
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [templatesError, setTemplatesError] = useState<string | null>(null)
  const [editTemplateOpen, setEditTemplateOpen] = useState(false)
  const [previewTemplateOpen, setPreviewTemplateOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)
  const [editForm, setEditForm] = useState({
    name: '', title: '', subject: '', body: '', type: 'in_app', category: 'system',
    variables: '', icon: 'bell', link: '',
  })
  const [templateSaving, setTemplateSaving] = useState(false)
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false)

  // ═══════════════════════════════════════════════════════════════
  // TAB 3: HISTORY STATE
  // ═══════════════════════════════════════════════════════════════
  const [history, setHistory] = useState<NotificationLog[]>([])
  const [historyStats, setHistoryStats] = useState<HistoryStats | null>(null)
  const [historyPagination, setHistoryPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [historySearch, setHistorySearch] = useState('')
  const [historySearchInput, setHistorySearchInput] = useState('')
  const [historyTypeFilter, setHistoryTypeFilter] = useState('')
  const historySearchTimeout = useRef<NodeJS.Timeout | null>(null)

  // ═══════════════════════════════════════════════════════════════
  // TAB 4: SETTINGS STATE
  // ═══════════════════════════════════════════════════════════════
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  // ═══════════════════════════════════════════════════════════════
  // TAB 0: MY NOTIFICATIONS STATE
  // ═══════════════════════════════════════════════════════════════
  const [myNotifications, setMyNotifications] = useState<MyNotification[]>([])
  const [myNotifLoading, setMyNotifLoading] = useState(true)
  const [myNotifError, setMyNotifError] = useState<string | null>(null)
  const [myNotifFilter, setMyNotifFilter] = useState('all')
  const [myNotifSearch, setMyNotifSearch] = useState('')
  const [myNotifSearchInput, setMyNotifSearchInput] = useState('')
  const [myNotifTypeFilter, setMyNotifTypeFilter] = useState('')
  const [myNotifUnread, setMyNotifUnread] = useState(0)
  const [myNotifSelected, setMyNotifSelected] = useState<Set<string>>(new Set())
  const [expandedNotifId, setExpandedNotifId] = useState<string | null>(null)
  const myNotifPollInterval = useRef<NodeJS.Timeout | null>(null)
  const myNotifSearchTimeout = useRef<NodeJS.Timeout | null>(null)
  const hasSeededRef = useRef(false)

  // ── Fetch My Notifications ──
  const fetchMyNotifications = useCallback(async () => {
    if (!currentUser?.id) return
    setMyNotifLoading(true)
    setMyNotifError(null)
    try {
      const params = new URLSearchParams({
        userId: currentUser.id,
        role: 'admin',
        filter: myNotifFilter,
        search: myNotifSearch,
        limit: '50',
      })
      if (myNotifTypeFilter) params.set('type', myNotifTypeFilter)
      const res = await fetch(`/api/notifications?${params}`)
      if (!res.ok) throw new Error('Failed to fetch notifications')
      const data = await res.json()
      setMyNotifications(data.notifications || [])
      setMyNotifUnread(data.counts?.unread || 0)
    } catch (err) {
      setMyNotifError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      setMyNotifLoading(false)
    }
  }, [currentUser?.id, myNotifFilter, myNotifSearch, myNotifTypeFilter])

  // ── Seed Admin Notifications ──
  const seedAdminNotifications = useCallback(async () => {
    if (!currentUser?.id || hasSeededRef.current) return
    try {
      const res = await fetch('/api/notifications?userId=' + currentUser.id + '&role=admin&limit=1')
      if (res.ok) {
        const data = await res.json()
        if ((data.notifications?.length || 0) === 0) {
          await fetch('/api/notifications/seed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id }),
          })
          hasSeededRef.current = true
        }
      }
    } catch {
      // Silently fail seeding
    }
  }, [currentUser?.id])

  // ── My Notif Bulk Actions ──
  const handleMyNotifAction = useCallback(async (action: string, notificationIds?: string[]) => {
    if (!currentUser?.id) return
    try {
      if (action === 'delete') {
        const ids = notificationIds || Array.from(myNotifSelected)
        if (ids.length === 0) return
        const res = await fetch(`/api/notifications?userId=${currentUser.id}&ids=${ids.join(',')}`, { method: 'DELETE' })
        if (!res.ok) throw new Error('Failed to delete')
        showToast('success', `Deleted ${ids.length} notification${ids.length > 1 ? 's' : ''}`)
      } else {
        const res = await fetch('/api/notifications', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, notificationIds: notificationIds || (myNotifSelected.size > 0 ? Array.from(myNotifSelected) : undefined), userId: currentUser.id }),
        })
        if (!res.ok) throw new Error('Failed to update')
        const labels: Record<string, string> = {
          mark_read: 'Marked as read',
          mark_unread: 'Marked as unread',
          archive: 'Archived',
          pin: 'Pinned',
          unpin: 'Unpinned',
        }
        showToast('success', labels[action] || 'Updated')
      }
      setMyNotifSelected(new Set())
      fetchMyNotifications()
    } catch {
      showToast('error', 'Failed to update notifications')
    }
  }, [currentUser?.id, myNotifSelected, fetchMyNotifications, showToast])

  // ── Toggle notification read on click ──
  const handleNotifClick = useCallback(async (notif: MyNotification) => {
    setExpandedNotifId(prev => prev === notif.id ? null : notif.id)
    if (!notif.isRead && currentUser?.id) {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', notificationIds: [notif.id], userId: currentUser.id }),
      })
      fetchMyNotifications()
    }
  }, [currentUser?.id, fetchMyNotifications])

  // ── Toggle select notification ──
  const toggleNotifSelect = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setMyNotifSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // ── Debounced my-notif search ──
  const handleMyNotifSearchChange = useCallback((value: string) => {
    setMyNotifSearchInput(value)
    if (myNotifSearchTimeout.current) clearTimeout(myNotifSearchTimeout.current)
    myNotifSearchTimeout.current = setTimeout(() => {
      setMyNotifSearch(value)
    }, 400)
  }, [])

  // ── Effects for My Notifications ──
  useEffect(() => {
    if (currentUser?.id) {
      seedAdminNotifications().then(() => fetchMyNotifications())
    }
  }, [currentUser?.id, fetchMyNotifications, seedAdminNotifications])

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (myNotifPollInterval.current) clearInterval(myNotifPollInterval.current)
    if (currentUser?.id) {
      myNotifPollInterval.current = setInterval(() => {
        fetchMyNotifications()
      }, 30000)
    }
    return () => {
      if (myNotifPollInterval.current) clearInterval(myNotifPollInterval.current)
    }
  }, [currentUser?.id, fetchMyNotifications])

  // ── Fetch Templates ──
  const fetchTemplates = useCallback(async () => {
    setTemplatesLoading(true)
    setTemplatesError(null)
    try {
      const res = await fetch('/api/admin/notifications/templates')
      if (!res.ok) throw new Error('Failed to fetch templates')
      const data = await res.json()
      setTemplates(data.data || [])
    } catch (err) {
      setTemplatesError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setTemplatesLoading(false)
    }
  }, [])

  // ── Fetch History ──
  const fetchHistory = useCallback(async (page = 1) => {
    setHistoryLoading(true)
    setHistoryError(null)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        search: historySearch,
        type: historyTypeFilter,
      })
      const res = await fetch(`/api/admin/notifications/history?${params}`)
      if (!res.ok) throw new Error('Failed to fetch history')
      const data = await res.json()
      setHistory(data.data || [])
      setHistoryStats(data.stats || null)
      setHistoryPagination(data.pagination || { page, limit: 20, total: 0, totalPages: 0 })
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setHistoryLoading(false)
    }
  }, [historySearch, historyTypeFilter])

  // ── Fetch Settings ──
  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true)
    try {
      const res = await fetch('/api/admin/notifications/settings')
      if (!res.ok) throw new Error('Failed to fetch settings')
      const data = await res.json()
      setSettings(data.data || data)
    } catch {
      setSettings(null)
    } finally {
      setSettingsLoading(false)
    }
  }, [])

  // ── Effects ──
  useEffect(() => { fetchTemplates() }, [fetchTemplates])
  useEffect(() => { fetchHistory(1) }, [fetchHistory])
  useEffect(() => { fetchSettings() }, [fetchSettings])

  // ── Debounced history search ──
  const handleHistorySearchChange = useCallback((value: string) => {
    setHistorySearchInput(value)
    if (historySearchTimeout.current) clearTimeout(historySearchTimeout.current)
    historySearchTimeout.current = setTimeout(() => {
      setHistorySearch(value)
    }, 400)
  }, [])

  // ── Send Notification ──
  const handleSend = useCallback(async () => {
    if (!sendForm.title.trim() || !sendForm.message.trim()) {
      showToast('error', 'Title and message are required')
      return
    }
    setSending(true)
    try {
      const payload: Record<string, any> = {
        type: sendForm.type,
        targetAudience: sendForm.targetAudience,
        title: sendForm.title.trim(),
        message: sendForm.message.trim(),
        priority: sendForm.priority,
        link: sendForm.linkType === 'url' ? sendForm.linkUrl : null,
        schedule: sendForm.scheduleType === 'now' ? 'now' : {
          date: sendForm.scheduleDate,
          time: sendForm.scheduleTime,
          timezone: sendForm.scheduleTimezone,
        },
      }
      if (sendForm.targetAudience === 'specific_user') {
        payload.targetDetails = { userId: sendForm.specificUserId }
      } else if (sendForm.targetAudience === 'segment') {
        payload.targetDetails = { segmentName: sendForm.segmentName }
      } else if (sendForm.targetAudience === 'course_enrollees') {
        payload.targetDetails = { courseId: sendForm.courseId }
      }
      const res = await fetch('/api/admin/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to send notification')
      }
      showToast('success', `Notification sent to ${formatNumber((await res.json()).sentCount || 0)} users`)
      setSendForm(prev => ({ ...prev, title: '', message: '', linkUrl: '' }))
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to send notification')
    } finally {
      setSending(false)
    }
  }, [sendForm, showToast])

  // ── AI Write Message ──
  const handleAiWrite = useCallback(() => {
    const sampleMessages: Record<string, string> = {
      in_app: '🎉 Exciting news! We\'ve just launched new features to enhance your learning experience. Check out the updated dashboard and let us know what you think!',
      email: 'Dear valued learner,\n\nWe\'re thrilled to announce exciting updates to ShijlAI Academy! Our team has been working hard to bring you an enhanced learning experience with new interactive features, improved course navigation, and personalized recommendations.\n\nExplore what\'s new today and take your learning journey to the next level.\n\nBest regards,\nThe ShijlAI Academy Team',
      push: '📱 New features just dropped! Explore the updated ShijlAI Academy experience now.',
      sms: 'ShijlAI Academy: New features launched! Log in now to explore the enhanced learning experience.',
      all: '🎉 Exciting updates from ShijlAI Academy! We\'ve enhanced your learning experience with new interactive features. Log in now to explore!',
    }
    setSendForm(prev => ({ ...prev, message: sampleMessages[prev.type] || sampleMessages.in_app }))
  }, [])

  // ── Template Actions ──
  const handleEditTemplate = useCallback((template: NotificationTemplate) => {
    setSelectedTemplate(template)
    setEditForm({
      name: template.name,
      title: template.title,
      subject: template.subject,
      body: template.body,
      type: template.type,
      category: template.category,
      variables: template.variables.join(', '),
      icon: template.icon || 'bell',
      link: template.link || '',
    })
    setEditTemplateOpen(true)
  }, [])

  const handlePreviewTemplate = useCallback((template: NotificationTemplate) => {
    setSelectedTemplate(template)
    setPreviewTemplateOpen(true)
  }, [])

  const handleToggleTemplateActive = useCallback(async (template: NotificationTemplate) => {
    try {
      const res = await fetch(`/api/admin/notifications/templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !template.isActive }),
      })
      if (!res.ok) throw new Error('Failed to toggle template')
      setTemplates(prev => prev.map(t => t.id === template.id ? { ...t, isActive: !t.isActive } : t))
    } catch {
      showToast('error', 'Failed to update template status')
    }
  }, [showToast])

  const handleSaveTemplate = useCallback(async (isCreate: boolean) => {
    setTemplateSaving(true)
    try {
      const payload = {
        name: editForm.name,
        title: editForm.title,
        subject: editForm.subject,
        body: editForm.body,
        type: editForm.type,
        category: editForm.category,
        variables: editForm.variables.split(',').map(v => v.trim()).filter(Boolean),
        icon: editForm.icon,
        link: editForm.link || null,
      }
      if (isCreate) {
        const res = await fetch('/api/admin/notifications/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to create template')
      } else if (selectedTemplate) {
        const res = await fetch(`/api/admin/notifications/templates/${selectedTemplate.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to update template')
      }
      showToast('success', isCreate ? 'Template created' : 'Template updated')
      setEditTemplateOpen(false)
      setCreateTemplateOpen(false)
      fetchTemplates()
    } catch {
      showToast('error', 'Failed to save template')
    } finally {
      setTemplateSaving(false)
    }
  }, [editForm, selectedTemplate, fetchTemplates, showToast])

  const handleCreateNewTemplate = useCallback(() => {
    setSelectedTemplate(null)
    setEditForm({
      name: '', title: '', subject: '', body: '', type: 'in_app', category: 'system',
      variables: '', icon: 'bell', link: '',
    })
    setCreateTemplateOpen(true)
  }, [])

  // ── Settings Save ──
  const handleSaveSettings = useCallback(async () => {
    if (!settings) return
    setSettingsSaving(true)
    try {
      const res = await fetch('/api/admin/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enableInApp: settings.enableInApp,
          enableEmail: settings.enableEmail,
          enablePush: settings.enablePush,
          enableSms: settings.enableSms,
          maxNotificationsPerDay: settings.maxNotificationsPerDay,
          maxBulkNotificationsPerDay: settings.maxBulkNotificationsPerDay,
          quietHoursStart: settings.quietHoursStart,
          quietHoursEnd: settings.quietHoursEnd,
          senderName: settings.senderName,
          senderEmail: settings.senderEmail,
        }),
      })
      if (!res.ok) throw new Error('Failed to save settings')
      setSettingsSaved(true)
      showToast('success', 'Settings saved successfully')
      setTimeout(() => setSettingsSaved(false), 3000)
    } catch {
      showToast('error', 'Failed to save settings')
    } finally {
      setSettingsSaving(false)
    }
  }, [settings, showToast])

  // ── History Pagination ──
  const goToHistoryPage = useCallback((page: number) => {
    fetchHistory(page)
  }, [fetchHistory])

  // ── Open Rate Color ──
  const getOpenRateColor = (rate: number) => {
    if (rate > 50) return 'text-emerald-600 dark:text-emerald-400'
    if (rate >= 30) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  // ── CTR Color ──
  const getCtrColor = (rate: number) => {
    if (rate > 15) return 'text-emerald-600 dark:text-emerald-400'
    if (rate >= 5) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  // ── Get Template Icon ──
  const getTemplateIcon = (iconName: string | null) => {
    if (!iconName) return <Bell className="size-4" />
    return TEMPLATE_ICONS[iconName] || <Bell className="size-4" />
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TOAST NOTIFICATION
  // ═══════════════════════════════════════════════════════════════

  const renderToast = () => (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className={cn(
            'fixed top-6 left-1/2 z-[100] flex items-center gap-2 rounded-2xl px-5 py-3 ios-shadow-lg text-[14px] font-medium',
            toast.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white'
          )}
        >
          {toast.type === 'success' ? <CheckCircle className="size-4" /> : <XCircle className="size-4" />}
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 0 — MY NOTIFICATIONS (Admin Inbox)
  // ═══════════════════════════════════════════════════════════════

  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return formatDate(dateStr)
  }

  const renderMyNotificationsTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="space-y-5"
    >
      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Inbox, value: myNotifications.length, label: 'Total', gradient: 'from-violet-500 to-indigo-500' },
          { icon: Eye, value: myNotifUnread, label: 'Unread', gradient: 'from-emerald-500 to-teal-500' },
          { icon: Pin, value: myNotifications.filter(n => n.isPinned).length, label: 'Pinned', gradient: 'from-amber-500 to-orange-500' },
          { icon: Archive, value: myNotifications.filter(n => n.isArchived).length, label: 'Archived', gradient: 'from-slate-500 to-gray-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, ...springTransition }}
            className="rounded-2xl ios-shadow-sm bg-card overflow-hidden"
          >
            <div className={cn('h-1.5 bg-gradient-to-r', stat.gradient)} />
            <div className="p-4">
              <div className={cn('flex size-9 items-center justify-center rounded-xl bg-gradient-to-br text-white', stat.gradient)}>
                <stat.icon className="size-4" />
              </div>
              <p className="text-[20px] font-bold mt-2">{stat.value}</p>
              <p className="text-[12px] text-muted-foreground">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          {/* Filter pills */}
          <div className="flex flex-wrap items-center gap-2">
            {MY_NOTIF_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMyNotifFilter(opt.value)}
                className={cn(
                  'rounded-xl px-3.5 py-1.5 text-[13px] font-medium transition-all border ios-press',
                  myNotifFilter === opt.value
                    ? 'border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/20'
                )}
              >
                {opt.label}
              </button>
            ))}

            {/* Mark all as read */}
            {myNotifUnread > 0 && (
              <button
                onClick={() => handleMyNotifAction('mark_read')}
                className="ml-auto flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
              >
                <CheckCheck className="size-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Search + Type filter row */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                className="pl-9 rounded-xl h-9"
                value={myNotifSearchInput}
                onChange={(e) => handleMyNotifSearchChange(e.target.value)}
              />
            </div>
            <Select value={myNotifTypeFilter} onValueChange={(v) => setMyNotifTypeFilter(v === 'all_types' ? '' : v)}>
              <SelectTrigger className="rounded-xl h-9 w-full sm:w-[180px]">
                <Filter className="size-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_types">All types</SelectItem>
                {Object.entries(ADMIN_NOTIF_TYPE_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bulk actions bar */}
          {myNotifSelected.size > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap items-center gap-2 pt-2 border-t"
            >
              <span className="text-[12px] text-muted-foreground mr-1">
                {myNotifSelected.size} selected
              </span>
              <Button variant="outline" size="sm" className="rounded-xl h-7 text-[12px] gap-1" onClick={() => handleMyNotifAction('mark_read')}>
                <CheckCheck className="size-3" /> Mark read
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl h-7 text-[12px] gap-1" onClick={() => handleMyNotifAction('mark_unread')}>
                <EyeOff className="size-3" /> Mark unread
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl h-7 text-[12px] gap-1" onClick={() => handleMyNotifAction('archive')}>
                <Archive className="size-3" /> Archive
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl h-7 text-[12px] gap-1 text-red-600 hover:text-red-700" onClick={() => handleMyNotifAction('delete')}>
                <Trash2 className="size-3" /> Delete
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* ── Notification List ── */}
      {myNotifLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="rounded-2xl bg-card p-4 ios-shadow-sm">
              <div className="flex items-start gap-3">
                <Skeleton className="size-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : myNotifError ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/30 mb-4">
            <AlertCircle className="size-6 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-[15px] font-semibold">{myNotifError}</p>
          <Button variant="outline" className="rounded-xl mt-3" onClick={fetchMyNotifications}>
            Try Again
          </Button>
        </div>
      ) : myNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted mb-4">
            <Inbox className="size-6 text-muted-foreground" />
          </div>
          <p className="text-[15px] font-semibold">No notifications</p>
          <p className="text-[13px] text-muted-foreground mt-1">
            {myNotifFilter === 'all' ? 'Your inbox is empty' : `No ${myNotifFilter} notifications`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {myNotifications.map((notif, i) => {
              const typeConfig = ADMIN_NOTIF_TYPE_CONFIG[notif.type] || ADMIN_NOTIF_TYPE_CONFIG.system
              const TypeIcon = typeConfig.icon
              const isExpanded = expandedNotifId === notif.id
              const isSelected = myNotifSelected.has(notif.id)

              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.02, ...springTransition }}
                  layout
                >
                  <Card
                    className={cn(
                      'rounded-2xl border-0 shadow-sm transition-all cursor-pointer group ios-press',
                      !notif.isRead && 'bg-violet-50/50 dark:bg-violet-950/10',
                      isSelected && 'ring-2 ring-violet-400 dark:ring-violet-600',
                      isExpanded && 'ios-shadow-md',
                    )}
                    onClick={() => handleNotifClick(notif)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={(e) => toggleNotifSelect(notif.id, e)}
                          className={cn(
                            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-all',
                            isSelected
                              ? 'border-violet-500 bg-violet-500 text-white'
                              : 'border-muted-foreground/30 hover:border-violet-400'
                          )}
                        >
                          {isSelected && <CheckCircle className="size-3" />}
                        </button>

                        {/* Type icon */}
                        <div className={cn(
                          'flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white',
                          typeConfig.gradient
                        )}>
                          <TypeIcon className="size-4.5" />
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className={cn(
                                  'text-[14px] leading-tight',
                                  !notif.isRead ? 'font-bold' : 'font-medium'
                                )}>
                                  {notif.title}
                                </p>
                                {notif.isPinned && (
                                  <Pin className="size-3 text-amber-500 shrink-0" />
                                )}
                                {!notif.isRead && (
                                  <div className="size-2 rounded-full bg-violet-500 shrink-0" />
                                )}
                              </div>
                              <p className={cn(
                                'text-[13px] mt-0.5 line-clamp-2',
                                !notif.isRead ? 'text-foreground/80' : 'text-muted-foreground'
                              )}>
                                {notif.content}
                              </p>
                            </div>
                            <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                              {formatRelativeTime(notif.createdAt)}
                            </span>
                          </div>

                          {/* Meta row */}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className={cn('rounded-lg px-2 py-0.5 text-[11px] font-medium', typeConfig.badgeClass)}>
                              {typeConfig.label}
                            </span>
                            {notif.priority === 'high' && (
                              <span className="rounded-lg bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 px-2 py-0.5 text-[11px] font-medium">
                                High Priority
                              </span>
                            )}
                            {notif.priority === 'urgent' && (
                              <span className="rounded-lg bg-red-200 text-red-800 dark:bg-red-950/50 dark:text-red-300 px-2 py-0.5 text-[11px] font-bold">
                                Urgent
                              </span>
                            )}
                          </div>

                          {/* Expanded detail */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-3 pt-3 border-t space-y-3">
                                  <p className="text-[13px] text-muted-foreground whitespace-pre-wrap">
                                    {notif.content}
                                  </p>
                                  <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                                    <Clock className="size-3" />
                                    {formatDate(notif.createdAt)}
                                    {notif.readAt && (
                                      <span className="ml-2">
                                        · Read {formatRelativeTime(notif.readAt)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {notif.isRead ? (
                                      <Button variant="outline" size="sm" className="rounded-xl h-7 text-[12px] gap-1" onClick={(e) => { e.stopPropagation(); handleMyNotifAction('mark_unread', [notif.id]) }}>
                                        <EyeOff className="size-3" /> Unread
                                      </Button>
                                    ) : (
                                      <Button variant="outline" size="sm" className="rounded-xl h-7 text-[12px] gap-1" onClick={(e) => { e.stopPropagation(); handleMyNotifAction('mark_read', [notif.id]) }}>
                                        <CheckCheck className="size-3" /> Read
                                      </Button>
                                    )}
                                    {notif.isPinned ? (
                                      <Button variant="outline" size="sm" className="rounded-xl h-7 text-[12px] gap-1" onClick={(e) => { e.stopPropagation(); handleMyNotifAction('unpin', [notif.id]) }}>
                                        <Pin className="size-3" /> Unpin
                                      </Button>
                                    ) : (
                                      <Button variant="outline" size="sm" className="rounded-xl h-7 text-[12px] gap-1" onClick={(e) => { e.stopPropagation(); handleMyNotifAction('pin', [notif.id]) }}>
                                        <Pin className="size-3" /> Pin
                                      </Button>
                                    )}
                                    <Button variant="outline" size="sm" className="rounded-xl h-7 text-[12px] gap-1" onClick={(e) => { e.stopPropagation(); handleMyNotifAction('archive', [notif.id]) }}>
                                      <Archive className="size-3" /> Archive
                                    </Button>
                                    <Button variant="outline" size="sm" className="rounded-xl h-7 text-[12px] gap-1 text-red-600 hover:text-red-700" onClick={(e) => { e.stopPropagation(); handleMyNotifAction('delete', [notif.id]) }}>
                                      <Trash2 className="size-3" /> Delete
                                    </Button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 1 — SEND NOTIFICATION
  // ═══════════════════════════════════════════════════════════════

  const renderSendTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="space-y-6"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, value: '48.2K', label: 'Total Users', gradient: 'from-violet-500 to-indigo-500' },
          { icon: Bell, value: '1,247', label: 'Sent Today', gradient: 'from-indigo-500 to-blue-500' },
          { icon: TrendingUp, value: '67.3%', label: 'Open Rate', gradient: 'from-blue-500 to-cyan-500' },
          { icon: BarChart3, value: '12.8%', label: 'Avg CTR', gradient: 'from-cyan-500 to-teal-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, ...springTransition }}
            className="rounded-2xl ios-shadow-sm bg-card overflow-hidden"
          >
            <div className={cn('h-1.5 bg-gradient-to-r', stat.gradient)} />
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className={cn('flex size-9 items-center justify-center rounded-xl bg-gradient-to-br text-white', stat.gradient)}>
                  <stat.icon className="size-4" />
                </div>
              </div>
              <p className="text-[20px] font-bold mt-2">{stat.value}</p>
              <p className="text-[12px] text-muted-foreground">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Send Form */}
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
              <Send className="size-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <CardTitle className="text-[18px] font-bold">Compose Notification</CardTitle>
              <p className="text-[13px] text-muted-foreground">Create and send notifications to your users</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Type Selector */}
          <div className="space-y-2">
            <Label className="text-[13px] font-semibold">Notification Type</Label>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSendForm(prev => ({ ...prev, type: opt.value }))}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-all border ios-press',
                    sendForm.type === opt.value
                      ? 'border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/20'
                  )}
                >
                  <div className={cn('size-2.5 rounded-full', opt.color)} />
                  <opt.icon className="size-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Target Selector */}
          <div className="space-y-2">
            <Label className="text-[13px] font-semibold">Target Audience</Label>
            <div className="flex flex-wrap gap-2">
              {TARGET_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSendForm(prev => ({ ...prev, targetAudience: opt.value }))}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-medium transition-all border ios-press',
                    sendForm.targetAudience === opt.value
                      ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-foreground/20'
                  )}
                >
                  {opt.label}
                  {'count' in opt && (
                    <span className="text-[11px] opacity-60">({opt.count})</span>
                  )}
                </button>
              ))}
            </div>

            {/* Conditional target fields */}
            {sendForm.targetAudience === 'specific_user' && (
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search user by name or email..."
                  className="pl-9 rounded-xl h-9"
                  value={sendForm.specificUserId}
                  onChange={(e) => setSendForm(prev => ({ ...prev, specificUserId: e.target.value }))}
                />
              </div>
            )}

            {sendForm.targetAudience === 'segment' && (
              <div className="mt-2">
                <Select value={sendForm.segmentName} onValueChange={(v) => setSendForm(prev => ({ ...prev, segmentName: v }))}>
                  <SelectTrigger className="rounded-xl h-9">
                    <SelectValue placeholder="Select segment..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SEGMENT_OPTIONS.map((seg) => (
                      <SelectItem key={seg.value} value={seg.value}>{seg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {sendForm.targetAudience === 'course_enrollees' && (
              <div className="relative mt-2">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search course by name..."
                  className="pl-9 rounded-xl h-9"
                  value={sendForm.courseId}
                  onChange={(e) => setSendForm(prev => ({ ...prev, courseId: e.target.value }))}
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Title */}
          <div className="space-y-2">
            <Label className="text-[13px] font-semibold">Title <span className="text-red-500">*</span></Label>
            <Input
              placeholder="Notification title..."
              className="rounded-xl h-10"
              value={sendForm.title}
              onChange={(e) => setSendForm(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label className="text-[13px] font-semibold">Message <span className="text-red-500">*</span></Label>
            <Textarea
              placeholder="Write your notification message..."
              className="rounded-xl min-h-[120px] resize-none"
              value={sendForm.message}
              onChange={(e) => setSendForm(prev => ({ ...prev, message: e.target.value }))}
            />
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-1.5 h-8 text-[12px]"
              onClick={handleAiWrite}
            >
              <Sparkles className="size-3.5 text-violet-500" />
              AI write message
            </Button>
          </div>

          <Separator />

          {/* Link */}
          <div className="space-y-2">
            <Label className="text-[13px] font-semibold">Link To</Label>
            <RadioGroup
              value={sendForm.linkType}
              onValueChange={(v) => setSendForm(prev => ({ ...prev, linkType: v as 'none' | 'url' }))}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="none" id="link-none" />
                <Label htmlFor="link-none" className="text-[13px] font-normal cursor-pointer">None</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="url" id="link-url" />
                <Label htmlFor="link-url" className="text-[13px] font-normal cursor-pointer">URL</Label>
              </div>
            </RadioGroup>
            {sendForm.linkType === 'url' && (
              <div className="relative mt-1">
                <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="https://..."
                  className="pl-9 rounded-xl h-9"
                  value={sendForm.linkUrl}
                  onChange={(e) => setSendForm(prev => ({ ...prev, linkUrl: e.target.value }))}
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Priority */}
          <div className="space-y-2">
            <Label className="text-[13px] font-semibold">Priority</Label>
            <div className="flex gap-2">
              {(['normal', 'high'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setSendForm(prev => ({ ...prev, priority: p }))}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium transition-all border ios-press',
                    sendForm.priority === p
                      ? p === 'high'
                        ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300'
                        : 'border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  )}
                >
                  {p === 'high' ? <AlertTriangle className="size-3.5" /> : <Info className="size-3.5" />}
                  {p === 'high' ? 'High (Banner)' : 'Normal'}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Schedule */}
          <div className="space-y-2">
            <Label className="text-[13px] font-semibold">Schedule</Label>
            <div className="flex gap-2">
              {(['now', 'scheduled'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSendForm(prev => ({ ...prev, scheduleType: s }))}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium transition-all border ios-press',
                    sendForm.scheduleType === s
                      ? 'border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground'
                  )}
                >
                  {s === 'now' ? <Zap className="size-3.5" /> : <Calendar className="size-3.5" />}
                  {s === 'now' ? 'Send now' : 'Schedule'}
                </button>
              ))}
            </div>
            {sendForm.scheduleType === 'scheduled' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                <div className="space-y-1">
                  <Label className="text-[12px]">Date</Label>
                  <Input
                    type="date"
                    className="rounded-xl h-9"
                    value={sendForm.scheduleDate}
                    onChange={(e) => setSendForm(prev => ({ ...prev, scheduleDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[12px]">Time</Label>
                  <Input
                    type="time"
                    className="rounded-xl h-9"
                    value={sendForm.scheduleTime}
                    onChange={(e) => setSendForm(prev => ({ ...prev, scheduleTime: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[12px]">Timezone</Label>
                  <Select value={sendForm.scheduleTimezone} onValueChange={(v) => setSendForm(prev => ({ ...prev, scheduleTimezone: v }))}>
                    <SelectTrigger className="rounded-xl h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">EST (UTC-5)</SelectItem>
                      <SelectItem value="PST">PST (UTC-8)</SelectItem>
                      <SelectItem value="PKT">PKT (UTC+5)</SelectItem>
                      <SelectItem value="GMT">GMT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex items-center gap-3 justify-end">
            <Button
              variant="outline"
              className="rounded-xl gap-1.5 h-10"
              onClick={() => setPreviewOpen(true)}
              disabled={!sendForm.title || !sendForm.message}
            >
              <Eye className="size-4" />
              Preview
            </Button>
            <Button
              className="rounded-xl gap-1.5 h-10 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white ios-shadow-sm"
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {sending ? 'Sending...' : 'Send Notification'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold">Notification Preview</DialogTitle>
            <DialogDescription>How this notification will appear to users</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-2xl border bg-muted/30 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className={cn(
                  'flex size-10 items-center justify-center rounded-xl text-white shrink-0',
                  sendForm.type === 'in_app' ? 'bg-violet-500' :
                  sendForm.type === 'email' ? 'bg-sky-500' :
                  sendForm.type === 'push' ? 'bg-emerald-500' :
                  sendForm.type === 'sms' ? 'bg-amber-500' :
                  'bg-gradient-to-r from-violet-500 to-indigo-500'
                )}>
                  <Bell className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-bold">{sendForm.title || 'Notification Title'}</p>
                  <p className="text-[13px] text-muted-foreground mt-1 whitespace-pre-wrap">{sendForm.message || 'Message content will appear here...'}</p>
                </div>
              </div>
              {sendForm.linkType === 'url' && sendForm.linkUrl && (
                <div className="flex items-center gap-1.5 text-[12px] text-violet-600 dark:text-violet-400">
                  <ExternalLink className="size-3" />
                  {sendForm.linkUrl}
                </div>
              )}
              {sendForm.priority === 'high' && (
                <div className="flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 dark:text-red-400">
                  <AlertTriangle className="size-3" />
                  HIGH PRIORITY BANNER
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-[12px] text-muted-foreground">
              <span>Type: {TYPE_OPTIONS.find(t => t.value === sendForm.type)?.label}</span>
              <span>Target: {TARGET_OPTIONS.find(t => t.value === sendForm.targetAudience)?.label}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 2 — TEMPLATES
  // ═══════════════════════════════════════════════════════════════

  const renderTemplatesTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="space-y-6"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: FileText, value: templates.length, label: 'Total Templates', gradient: 'from-violet-500 to-indigo-500' },
          { icon: CheckCircle, value: templates.filter(t => t.isActive).length, label: 'Active', gradient: 'from-emerald-500 to-teal-500' },
          { icon: EyeOff, value: templates.filter(t => !t.isActive).length, label: 'Inactive', gradient: 'from-slate-400 to-slate-500' },
          { icon: BarChart3, value: templates.reduce((sum, t) => sum + t.usageCount, 0), label: 'Total Usage', gradient: 'from-indigo-500 to-blue-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, ...springTransition }}
            className="rounded-2xl ios-shadow-sm bg-card overflow-hidden"
          >
            <div className={cn('h-1.5 bg-gradient-to-r', stat.gradient)} />
            <div className="p-4">
              <div className={cn('flex size-9 items-center justify-center rounded-xl bg-gradient-to-br text-white', stat.gradient)}>
                <stat.icon className="size-4" />
              </div>
              <p className="text-[20px] font-bold mt-2">{typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}</p>
              <p className="text-[12px] text-muted-foreground">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Templates List */}
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[18px] font-bold">Notification Templates</CardTitle>
              <p className="text-[13px] text-muted-foreground">Manage reusable notification templates</p>
            </div>
            <Button
              size="sm"
              className="rounded-xl gap-1.5 h-9 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
              onClick={handleCreateNewTemplate}
            >
              <Plus className="size-3.5" />
              New Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {templatesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                  <Skeleton className="size-10 rounded-xl" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-48 rounded-lg" />
                    <Skeleton className="h-3 w-32 rounded-lg" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-lg" />
                  <Skeleton className="size-8 rounded-lg" />
                  <Skeleton className="size-8 rounded-lg" />
                  <Skeleton className="size-6 rounded-lg" />
                </div>
              ))}
            </div>
          ) : templatesError ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <AlertCircle className="size-10 text-red-400" />
              <p className="text-[15px] font-medium">Failed to load templates</p>
              <p className="text-[13px] text-muted-foreground">{templatesError}</p>
              <Button variant="outline" size="sm" className="rounded-xl" onClick={fetchTemplates}>Retry</Button>
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <FileText className="size-10 text-muted-foreground/30" />
              <p className="text-[15px] font-medium">No templates yet</p>
              <p className="text-[13px] text-muted-foreground">Create your first notification template</p>
              <Button size="sm" className="rounded-xl gap-1.5" onClick={handleCreateNewTemplate}>
                <Plus className="size-3.5" /> Create Template
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              <AnimatePresence mode="popLayout">
                {templates.map((template, i) => {
                  const typeConf = TYPE_BADGE_CONFIG[template.type] || TYPE_BADGE_CONFIG.in_app
                  const catConf = CATEGORY_BADGE_CONFIG[template.category] || CATEGORY_BADGE_CONFIG.system

                  return (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ delay: i * 0.03, ...springTransition }}
                      className="flex items-center gap-3 px-3 py-3 hover:bg-muted/30 transition-colors rounded-xl"
                    >
                      {/* Icon */}
                      <div className={cn(
                        'flex size-10 items-center justify-center rounded-xl shrink-0',
                        template.isActive
                          ? 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400'
                          : 'bg-muted text-muted-foreground'
                      )}>
                        {getTemplateIcon(template.icon)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold truncate">{template.title}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <Badge variant="secondary" className={cn('text-[10px] rounded-lg gap-1 px-1.5 py-0', typeConf.badgeClass)}>
                            {typeConf.label}
                          </Badge>
                          <Badge variant="secondary" className={cn('text-[10px] rounded-lg gap-1 px-1.5 py-0', catConf.badgeClass)}>
                            {catConf.label}
                          </Badge>
                          {template.usageCount > 0 && (
                            <span className="text-[11px] text-muted-foreground">
                              Used {formatNumber(template.usageCount)}×
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-lg"
                              onClick={() => handleEditTemplate(template)}
                            >
                              <Edit3 className="size-3.5 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit template</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-lg"
                              onClick={() => handlePreviewTemplate(template)}
                            >
                              <Eye className="size-3.5 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Preview template</TooltipContent>
                        </Tooltip>

                        <Switch
                          checked={template.isActive}
                          onCheckedChange={() => handleToggleTemplateActive(template)}
                          className="scale-75"
                        />
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Template Dialog */}
      <Dialog open={editTemplateOpen} onOpenChange={setEditTemplateOpen}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold">Edit Template</DialogTitle>
            <DialogDescription>Update notification template details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Name</Label>
              <Input className="rounded-xl h-9" value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Title</Label>
              <Input className="rounded-xl h-9" value={editForm.title} onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Subject (for email)</Label>
              <Input className="rounded-xl h-9" value={editForm.subject} onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Body</Label>
              <Textarea className="rounded-xl min-h-[100px] resize-none" value={editForm.body} onChange={(e) => setEditForm(prev => ({ ...prev, body: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[13px]">Type</Label>
                <Select value={editForm.type} onValueChange={(v) => setEditForm(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_app">In-app</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="both">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">Category</Label>
                <Select value={editForm.category} onValueChange={(v) => setEditForm(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="transactional">Transactional</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Variables (comma-separated)</Label>
              <Input className="rounded-xl h-9" placeholder="e.g., userName, courseName" value={editForm.variables} onChange={(e) => setEditForm(prev => ({ ...prev, variables: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[13px]">Icon</Label>
                <Select value={editForm.icon} onValueChange={(v) => setEditForm(prev => ({ ...prev, icon: v }))}>
                  <SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(TEMPLATE_ICONS).map((key) => (
                      <SelectItem key={key} value={key}>{key.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">Link</Label>
                <Input className="rounded-xl h-9" placeholder="https://..." value={editForm.link} onChange={(e) => setEditForm(prev => ({ ...prev, link: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl h-9" onClick={() => setEditTemplateOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl h-9 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
              onClick={() => handleSaveTemplate(false)}
              disabled={templateSaving}
            >
              {templateSaving ? <Loader2 className="size-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Template Dialog */}
      <Dialog open={previewTemplateOpen} onOpenChange={setPreviewTemplateOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold">Template Preview</DialogTitle>
            <DialogDescription>Preview with sample data</DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="rounded-2xl border bg-muted/30 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 shrink-0">
                    {getTemplateIcon(selectedTemplate.icon)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold">{selectedTemplate.title}</p>
                    {selectedTemplate.subject && (
                      <p className="text-[12px] text-muted-foreground mt-0.5">Subject: {selectedTemplate.subject}</p>
                    )}
                  </div>
                </div>
                <p className="text-[13px] text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {selectedTemplate.body.replace(/\{\{(\w+)\}\}/g, (_, varName) => {
                    const sampleValues: Record<string, string> = {
                      userName: 'Alex Johnson',
                      courseName: 'Introduction to AI',
                      instructorName: 'Dr. Smith',
                      price: '$24.99',
                      discount: '20%',
                      date: 'March 15, 2025',
                      time: '3:00 PM',
                    }
                    return sampleValues[varName] || `[${varName}]`
                  })}
                </p>
                {selectedTemplate.link && (
                  <div className="flex items-center gap-1.5 text-[12px] text-violet-600 dark:text-violet-400">
                    <ExternalLink className="size-3" />
                    {selectedTemplate.link}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className={cn('text-[10px] rounded-lg', (TYPE_BADGE_CONFIG[selectedTemplate.type] || TYPE_BADGE_CONFIG.in_app).badgeClass)}>
                  {(TYPE_BADGE_CONFIG[selectedTemplate.type] || TYPE_BADGE_CONFIG.in_app).label}
                </Badge>
                <Badge variant="secondary" className={cn('text-[10px] rounded-lg', (CATEGORY_BADGE_CONFIG[selectedTemplate.category] || CATEGORY_BADGE_CONFIG.system).badgeClass)}>
                  {(CATEGORY_BADGE_CONFIG[selectedTemplate.category] || CATEGORY_BADGE_CONFIG.system).label}
                </Badge>
                {selectedTemplate.variables.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[11px] text-muted-foreground">Variables:</span>
                    {selectedTemplate.variables.map((v) => (
                      <Badge key={v} variant="outline" className="text-[10px] rounded-md px-1.5 py-0">
                        {`{{${v}}}`}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={createTemplateOpen} onOpenChange={setCreateTemplateOpen}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold">Create New Template</DialogTitle>
            <DialogDescription>Define a reusable notification template</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Name <span className="text-red-500">*</span></Label>
              <Input className="rounded-xl h-9" placeholder="e.g., welcome_email" value={editForm.name} onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Title <span className="text-red-500">*</span></Label>
              <Input className="rounded-xl h-9" placeholder="Notification title" value={editForm.title} onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Subject <span className="text-red-500">*</span></Label>
              <Input className="rounded-xl h-9" placeholder="Email subject line" value={editForm.subject} onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Body <span className="text-red-500">*</span></Label>
              <Textarea className="rounded-xl min-h-[100px] resize-none" placeholder="Use {{variable}} for dynamic content" value={editForm.body} onChange={(e) => setEditForm(prev => ({ ...prev, body: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[13px]">Type</Label>
                <Select value={editForm.type} onValueChange={(v) => setEditForm(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_app">In-app</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="both">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">Category</Label>
                <Select value={editForm.category} onValueChange={(v) => setEditForm(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="transactional">Transactional</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Variables (comma-separated)</Label>
              <Input className="rounded-xl h-9" placeholder="e.g., userName, courseName" value={editForm.variables} onChange={(e) => setEditForm(prev => ({ ...prev, variables: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[13px]">Icon</Label>
                <Select value={editForm.icon} onValueChange={(v) => setEditForm(prev => ({ ...prev, icon: v }))}>
                  <SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(TEMPLATE_ICONS).map((key) => (
                      <SelectItem key={key} value={key}>{key.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">Link</Label>
                <Input className="rounded-xl h-9" placeholder="https://..." value={editForm.link} onChange={(e) => setEditForm(prev => ({ ...prev, link: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl h-9" onClick={() => setCreateTemplateOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl h-9 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
              onClick={() => handleSaveTemplate(true)}
              disabled={templateSaving || !editForm.name || !editForm.title || !editForm.body}
            >
              {templateSaving ? <Loader2 className="size-4 animate-spin" /> : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 3 — HISTORY
  // ═══════════════════════════════════════════════════════════════

  const renderHistoryTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="space-y-6"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Send, value: formatNumber(historyStats?.totalSent ?? 0), label: 'Total Sent (lifetime)', gradient: 'from-violet-500 to-indigo-500' },
          { icon: TrendingUp, value: `${(historyStats?.avgOpenRate ?? 0).toFixed(1)}%`, label: 'Avg Open Rate', gradient: 'from-emerald-500 to-teal-500' },
          { icon: BarChart3, value: `${(historyStats?.avgCtr ?? 0).toFixed(1)}%`, label: 'Avg CTR', gradient: 'from-indigo-500 to-blue-500' },
          { icon: Mail, value: formatNumber(historyStats?.totalLogs ?? 0), label: 'Total Campaigns', gradient: 'from-blue-500 to-cyan-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, ...springTransition }}
            className="rounded-2xl ios-shadow-sm bg-card overflow-hidden"
          >
            <div className={cn('h-1.5 bg-gradient-to-r', stat.gradient)} />
            <div className="p-4">
              <div className={cn('flex size-9 items-center justify-center rounded-xl bg-gradient-to-br text-white', stat.gradient)}>
                <stat.icon className="size-4" />
              </div>
              <p className="text-[20px] font-bold mt-2">{stat.value}</p>
              <p className="text-[12px] text-muted-foreground">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter */}
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                className="pl-9 rounded-xl h-9"
                value={historySearchInput}
                onChange={(e) => handleHistorySearchChange(e.target.value)}
              />
            </div>
            <Select value={historyTypeFilter} onValueChange={(v) => { setHistoryTypeFilter(v === 'all' ? '' : v) }}>
              <SelectTrigger className="w-[130px] rounded-xl h-9">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="in_app">In-app</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="push">Push</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="hidden lg:grid lg:grid-cols-[120px_1fr_130px_100px_100px_100px] gap-3 items-center px-4 py-3 bg-muted/40 border-b text-[12px] font-medium text-muted-foreground uppercase tracking-wide">
          <div>Date</div>
          <div>Notification</div>
          <div>Target</div>
          <div className="text-right">Sent</div>
          <div className="text-right">Opened</div>
          <div className="text-right">CTR</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border/40">
          {historyLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-4 w-20 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-48 rounded-lg" />
                  <Skeleton className="h-3 w-32 rounded-lg" />
                </div>
                <Skeleton className="h-5 w-16 rounded-lg" />
                <Skeleton className="h-4 w-12 rounded-lg" />
                <Skeleton className="h-4 w-12 rounded-lg" />
                <Skeleton className="h-4 w-12 rounded-lg" />
              </div>
            ))
          ) : historyError ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <AlertCircle className="size-10 text-red-400" />
              <p className="text-[15px] font-medium">Failed to load history</p>
              <p className="text-[13px] text-muted-foreground">{historyError}</p>
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => fetchHistory(1)}>Retry</Button>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Clock className="size-10 text-muted-foreground/30" />
              <p className="text-[15px] font-medium">No notifications sent yet</p>
              <p className="text-[13px] text-muted-foreground">Send your first notification to see history here</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {history.map((log, i) => {
                const typeConf = TYPE_BADGE_CONFIG[log.type] || TYPE_BADGE_CONFIG.in_app
                const targetLabel = TARGET_AUDIENCE_LABELS[log.targetAudience] || log.targetAudience

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ delay: i * 0.02, ...springTransition }}
                    className="grid grid-cols-1 lg:grid-cols-[120px_1fr_130px_100px_100px_100px] gap-3 items-center px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    {/* Date */}
                    <div className="text-[13px] text-muted-foreground">
                      {formatShortDate(log.sentAt || log.scheduledAt || log.createdAt)}
                    </div>

                    {/* Notification */}
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold truncate">{log.title}</p>
                      <p className="text-[12px] text-muted-foreground truncate">{log.message}</p>
                      {log.priority === 'high' && (
                        <Badge variant="secondary" className="text-[10px] rounded-md mt-1 bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 gap-1 px-1.5 py-0">
                          <AlertTriangle className="size-2.5" /> HIGH
                        </Badge>
                      )}
                    </div>

                    {/* Target */}
                    <div>
                      <Badge variant="secondary" className="text-[10px] rounded-lg gap-1 px-1.5">
                        <Users className="size-2.5" />
                        {targetLabel}
                      </Badge>
                    </div>

                    {/* Sent */}
                    <div className="text-[14px] font-medium text-right">
                      {formatFullNumber(log.sentCount)}
                    </div>

                    {/* Opened % */}
                    <div className={cn('text-[14px] font-semibold text-right', getOpenRateColor(log.openRate))}>
                      {log.openRate.toFixed(1)}%
                    </div>

                    {/* CTR % */}
                    <div className={cn('text-[14px] font-semibold text-right', getCtrColor(log.ctr))}>
                      {log.ctr.toFixed(1)}%
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Pagination */}
        {historyPagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-[13px] text-muted-foreground">
              Showing {(historyPagination.page - 1) * historyPagination.limit + 1}–{Math.min(historyPagination.page * historyPagination.limit, historyPagination.total)} of {formatNumber(historyPagination.total)}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-8 rounded-lg"
                disabled={historyPagination.page <= 1}
                onClick={() => goToHistoryPage(historyPagination.page - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              {Array.from({ length: Math.min(5, historyPagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, historyPagination.page - 2) + i
                if (pageNum > historyPagination.totalPages) return null
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === historyPagination.page ? 'default' : 'outline'}
                    size="icon"
                    className={cn(
                      'size-8 rounded-lg text-[13px]',
                      pageNum === historyPagination.page && 'bg-violet-600 hover:bg-violet-700 text-white'
                    )}
                    onClick={() => goToHistoryPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                size="icon"
                className="size-8 rounded-lg"
                disabled={historyPagination.page >= historyPagination.totalPages}
                onClick={() => goToHistoryPage(historyPagination.page + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 4 — SETTINGS
  // ═══════════════════════════════════════════════════════════════

  const renderSettingsTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="space-y-6"
    >
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
              <Settings className="size-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <CardTitle className="text-[18px] font-bold">Notification Settings</CardTitle>
              <p className="text-[13px] text-muted-foreground">Configure channels, rate limits, and delivery preferences</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {settingsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-40 rounded-lg" />
                    <Skeleton className="h-3 w-56 rounded-lg" />
                  </div>
                  <Skeleton className="size-8 rounded-lg" />
                </div>
              ))}
            </div>
          ) : settings ? (
            <div className="space-y-6">
              {/* Channel Toggles */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-semibold flex items-center gap-2">
                  <Globe className="size-4 text-violet-500" /> Channel Toggles
                </h3>
                {[
                  { key: 'enableInApp' as const, label: 'In-app Notifications', desc: 'Show notifications inside the app', icon: Bell, color: 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400' },
                  { key: 'enableEmail' as const, label: 'Email Notifications', desc: 'Send notifications via email', icon: Mail, color: 'bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400' },
                  { key: 'enablePush' as const, label: 'Push Notifications', desc: 'Send push notifications to mobile devices', icon: Smartphone, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
                  { key: 'enableSms' as const, label: 'SMS Notifications', desc: 'Send notifications via SMS text message', icon: MessageSquare, color: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' },
                ].map((channel) => (
                  <div key={channel.key} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={cn('flex size-8 items-center justify-center rounded-lg shrink-0 mt-0.5', channel.color)}>
                        <channel.icon className="size-4" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium">{channel.label}</p>
                        <p className="text-[12px] text-muted-foreground">{channel.desc}</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings[channel.key]}
                      onCheckedChange={(checked) => setSettings(prev => prev ? { ...prev, [channel.key]: checked } : prev)}
                    />
                  </div>
                ))}
              </div>

              <Separator />

              {/* Rate Limiting */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-semibold flex items-center gap-2">
                  <Shield className="size-4 text-indigo-500" /> Rate Limiting
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 p-3 rounded-xl bg-muted/30">
                    <Label className="text-[13px] font-medium">Max per user per day</Label>
                    <Input
                      type="number"
                      className="rounded-xl h-9"
                      value={settings.maxNotificationsPerDay}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, maxNotificationsPerDay: parseInt(e.target.value) || 0 } : prev)}
                    />
                    <p className="text-[11px] text-muted-foreground">Maximum notifications a single user can receive per day</p>
                  </div>
                  <div className="space-y-1.5 p-3 rounded-xl bg-muted/30">
                    <Label className="text-[13px] font-medium">Max bulk per admin per day</Label>
                    <Input
                      type="number"
                      className="rounded-xl h-9"
                      value={settings.maxBulkNotificationsPerDay}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, maxBulkNotificationsPerDay: parseInt(e.target.value) || 0 } : prev)}
                    />
                    <p className="text-[11px] text-muted-foreground">Maximum bulk notifications an admin can send per day</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Quiet Hours */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-semibold flex items-center gap-2">
                  <Clock className="size-4 text-blue-500" /> Quiet Hours
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 p-3 rounded-xl bg-muted/30">
                    <Label className="text-[13px] font-medium">Start Time</Label>
                    <Input
                      type="time"
                      className="rounded-xl h-9"
                      value={settings.quietHoursStart}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, quietHoursStart: e.target.value } : prev)}
                    />
                  </div>
                  <div className="space-y-1.5 p-3 rounded-xl bg-muted/30">
                    <Label className="text-[13px] font-medium">End Time</Label>
                    <Input
                      type="time"
                      className="rounded-xl h-9"
                      value={settings.quietHoursEnd}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, quietHoursEnd: e.target.value } : prev)}
                    />
                  </div>
                </div>
                <p className="text-[12px] text-muted-foreground">Notifications will not be sent during quiet hours (user local time)</p>
              </div>

              <Separator />

              {/* Sender Info */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-semibold flex items-center gap-2">
                  <Mail className="size-4 text-sky-500" /> Sender Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 p-3 rounded-xl bg-muted/30">
                    <Label className="text-[13px] font-medium">Sender Name</Label>
                    <Input
                      className="rounded-xl h-9"
                      value={settings.senderName}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, senderName: e.target.value } : prev)}
                    />
                  </div>
                  <div className="space-y-1.5 p-3 rounded-xl bg-muted/30">
                    <Label className="text-[13px] font-medium">Sender Email</Label>
                    <Input
                      type="email"
                      className="rounded-xl h-9"
                      value={settings.senderEmail}
                      onChange={(e) => setSettings(prev => prev ? { ...prev, senderEmail: e.target.value } : prev)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Available Segments */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-semibold flex items-center gap-2">
                  <Users className="size-4 text-teal-500" /> Available Segments
                </h3>
                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-muted/30">
                  {settings.availableSegments.length > 0 ? (
                    settings.availableSegments.map((segment) => (
                      <Badge key={segment} variant="secondary" className="rounded-lg gap-1 text-[12px] bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400">
                        <Users className="size-3" />
                        {segment.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-[13px] text-muted-foreground">No segments configured</p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Save Button */}
              <div className="flex items-center justify-between">
                {settingsSaved && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-1.5 text-[13px] text-emerald-600 dark:text-emerald-400"
                  >
                    <CheckCircle className="size-4" />
                    Settings saved successfully
                  </motion.div>
                )}
                <div className="flex-1" />
                <Button
                  className="rounded-xl gap-1.5 h-10 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white ios-shadow-sm"
                  onClick={handleSaveSettings}
                  disabled={settingsSaving}
                >
                  {settingsSaving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                  {settingsSaving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <AlertCircle className="size-10 text-red-400" />
              <p className="text-[15px] font-medium">Failed to load settings</p>
              <Button variant="outline" size="sm" className="rounded-xl" onClick={fetchSettings}>Retry</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={springTransition}
      className="space-y-6"
    >
      {renderToast()}

      {/* ─── Header Section ─── */}
      <div className="flex items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 ios-shadow-sm">
          <Bell className="size-6 text-white" />
        </div>
        <div>
          <h1 className="text-[28px] font-bold text-foreground flex items-center gap-3">
            Notifications Center
            <Badge variant="secondary" className="text-[11px] rounded-xl px-2.5 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">
              Admin
            </Badge>
          </h1>
          <p className="text-[15px] text-muted-foreground">Manage notifications, templates, history, and delivery settings</p>
        </div>
      </div>

      {/* ─── Tab Navigation ─── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="rounded-xl bg-muted/60 p-1 h-auto gap-0.5 w-full sm:w-auto">
          <TabsTrigger
            value="my-notifications"
            className={cn(
              'rounded-lg px-4 py-2 text-[13px] font-medium transition-all ios-press data-[state=active]:bg-card data-[state=active]:ios-shadow-sm data-[state=active]:text-foreground gap-1.5'
            )}
          >
            <Inbox className="size-3.5" />
            <span className="hidden sm:inline">My Notifications</span>
            <span className="sm:hidden">Inbox</span>
            {myNotifUnread > 0 && (
              <Badge className="ml-1 size-5 p-0 flex items-center justify-center rounded-full bg-violet-500 text-white text-[10px] font-bold">
                {myNotifUnread > 9 ? '9+' : myNotifUnread}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="send"
            className={cn(
              'rounded-lg px-4 py-2 text-[13px] font-medium transition-all ios-press data-[state=active]:bg-card data-[state=active]:ios-shadow-sm data-[state=active]:text-foreground gap-1.5'
            )}
          >
            <Send className="size-3.5" />
            <span className="hidden sm:inline">Send Notification</span>
            <span className="sm:hidden">Send</span>
          </TabsTrigger>
          <TabsTrigger
            value="templates"
            className={cn(
              'rounded-lg px-4 py-2 text-[13px] font-medium transition-all ios-press data-[state=active]:bg-card data-[state=active]:ios-shadow-sm data-[state=active]:text-foreground gap-1.5'
            )}
          >
            <FileText className="size-3.5" />
            Templates
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className={cn(
              'rounded-lg px-4 py-2 text-[13px] font-medium transition-all ios-press data-[state=active]:bg-card data-[state=active]:ios-shadow-sm data-[state=active]:text-foreground gap-1.5'
            )}
          >
            <Clock className="size-3.5" />
            History
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className={cn(
              'rounded-lg px-4 py-2 text-[13px] font-medium transition-all ios-press data-[state=active]:bg-card data-[state=active]:ios-shadow-sm data-[state=active]:text-foreground gap-1.5'
            )}
          >
            <Settings className="size-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="my-notifications" className="mt-0">
            {renderMyNotificationsTab()}
          </TabsContent>
          <TabsContent value="send" className="mt-0">
            {renderSendTab()}
          </TabsContent>
          <TabsContent value="templates" className="mt-0">
            {renderTemplatesTab()}
          </TabsContent>
          <TabsContent value="history" className="mt-0">
            {renderHistoryTab()}
          </TabsContent>
          <TabsContent value="settings" className="mt-0">
            {renderSettingsTab()}
          </TabsContent>
        </div>
      </Tabs>
    </motion.div>
  )
}

export function AdminNotificationsCenterWrapped() {
  return <AdminNotificationsCenter />
}
