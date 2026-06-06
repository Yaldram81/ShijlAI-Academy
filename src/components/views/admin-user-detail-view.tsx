'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, User, Mail, Phone, Globe, Shield, Lock, KeyRound,
  Clock, Calendar, CheckCircle, XCircle, AlertTriangle, Ban,
  Eye, EyeOff, Send, Edit3, MoreHorizontal, UserCog, Flag,
  FlagOff, ToggleLeft, CircleDollarSign, Zap, Flame, BookOpen, Award,
  Star, BarChart3, MessageSquare, StickyNote, Bell, Trash2,
  Loader2, Activity, Monitor, Smartphone, Globe2, MapPin,
  ChevronDown, Copy, ExternalLink, Search, GraduationCap,
  DollarSign, CreditCard, Users, TrendingUp, Target,
  HelpCircle, MessageCircle, Server, X, Plus,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { AdminStatCard, AdminStatCardGrid } from '@/components/admin/admin-stat-card'

// ─── Types ──────────────────────────────────────────────────────────────────

interface UserSession {
  id: string
  deviceName: string | null
  deviceType: string
  browser: string | null
  os: string | null
  ipAddress: string | null
  location: string | null
  lastActivity: string
  createdAt: string
}

interface UserDetail {
  id: string
  name: string
  email: string
  avatar: string | null
  role: string
  bio: string | null
  language: string
  phone: string | null
  status: string
  dbStatus: string
  isVerified: boolean
  mfaEnabled: boolean
  authProvider: string
  flaggedReason: string | null
  xp: number
  level: number
  shijlCoins: number
  streak: number
  lastActiveAt: string | null
  lastLoginAt: string | null
  lastLoginIp: string | null
  createdAt: string
  updatedAt: string
  instructorProfile: {
    headline: string | null
    linkedin: string | null
    website: string | null
    ntn: string | null
    ntnVerified: boolean
    expertise: string | null
    applicationStatus: string | null
    cnic: string | null
    topicProposal: string | null
    sampleOutline: string | null
    appliedAt: string | null
    reviewedAt: string | null
    rejectionReason: string | null
  } | null
  payoutInfo: { type: string; last4: string; bankName: string | null } | null
  performance: any
  recentActivity: Array<{
    id: string
    type: string
    title: string
    description: string | null
    icon: string
    createdAt: string
  }>
  adminNotes: Array<{ note: string; adminName: string; date: string }>
  activeSessions?: UserSession[]
  loginHistory?: Array<{ id: string; title: string; description: string | null; createdAt: string }>
  recentNotifications?: Array<{ id: string; title: string; content: string; isRead: boolean; createdAt: string }>
  accountAge?: number
  riskScore?: number
  enrollments?: Array<{ id: string; courseTitle: string; progress: number; status: string; enrolledAt: string }>
  courses?: Array<{ id: string; title: string; enrollmentCount: number; rating: number; isPublished: boolean }>
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
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

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return num.toLocaleString()
}

// ─── Configs ────────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, string> = {
  student: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  instructor: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
  admin: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  parent: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400',
}

const STATUS_CONFIG: Record<string, { dot: string; label: string; color: string }> = {
  active: { dot: 'bg-emerald-500', label: 'Active', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
  suspended: { dot: 'bg-red-500', label: 'Suspended', color: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' },
  banned: { dot: 'bg-red-700', label: 'Banned', color: 'bg-red-200 text-red-800 dark:bg-red-950/60 dark:text-red-300' },
  pending_verification: { dot: 'bg-amber-500', label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
  flagged: { dot: 'bg-orange-500', label: 'Flagged', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' },
}

const ACTIVITY_ICON_MAP: Record<string, React.ReactNode> = {
  login: <KeyRound className="size-4" />,
  enrollment: <BookOpen className="size-4" />,
  completion: <CheckCircle className="size-4" />,
  certificate: <Award className="size-4" />,
  quiz: <Target className="size-4" />,
  assignment: <Edit3 className="size-4" />,
  payment: <CreditCard className="size-4" />,
  profile: <User className="size-4" />,
  admin: <Shield className="size-4" />,
  default: <Activity className="size-4" />,
}

const ACTIVITY_COLOR_MAP: Record<string, string> = {
  login: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
  enrollment: 'bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400',
  completion: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400',
  certificate: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  quiz: 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
  assignment: 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
  payment: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
  profile: 'bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
  admin: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  default: 'bg-slate-100 text-slate-600 dark:bg-slate-950/40 dark:text-slate-400',
}

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  desktop: <Monitor className="size-4" />,
  mobile: <Smartphone className="size-4" />,
  tablet: <Smartphone className="size-4" />,
  unknown: <Monitor className="size-4" />,
}

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

// ─── Confirmation Dialog Hook ───────────────────────────────────────────────

function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean
    title: string
    description: string
    confirmLabel: string
    variant: 'default' | 'destructive'
    onConfirm: () => void
  } | null>(null)

  const confirm = useCallback((opts: {
    title: string
    description: string
    confirmLabel?: string
    variant?: 'default' | 'destructive'
    onConfirm: () => void
  }) => {
    setState({
      open: true,
      title: opts.title,
      description: opts.description,
      confirmLabel: opts.confirmLabel || 'Confirm',
      variant: opts.variant || 'default',
      onConfirm: opts.onConfirm,
    })
  }, [])

  const handleClose = useCallback(() => {
    setState(null)
  }, [])

  return { confirmState: state, confirm, handleClose }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function AdminUserDetailView() {
  const { selectedUserId, setCurrentView, currentUser } = useAppStore()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Dialog states
  const { confirmState, confirm, handleClose } = useConfirmDialog()
  const [suspendReasonOpen, setSuspendReasonOpen] = useState(false)
  const [banReasonOpen, setBanReasonOpen] = useState(false)
  const [flagReasonOpen, setFlagReasonOpen] = useState(false)
  const [changeRoleOpen, setChangeRoleOpen] = useState(false)
  const [adjustCoinsOpen, setAdjustCoinsOpen] = useState(false)
  const [adjustXpOpen, setAdjustXpOpen] = useState(false)
  const [resetPwOpen, setResetPwOpen] = useState(false)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [sendNotifOpen, setSendNotifOpen] = useState(false)

  // Form states
  const [reasonText, setReasonText] = useState('')
  const [newRole, setNewRole] = useState('')
  const [coinAmount, setCoinAmount] = useState('')
  const [coinReason, setCoinReason] = useState('')
  const [xpAmount, setXpAmount] = useState('')
  const [xpReason, setXpReason] = useState('')
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [editForm, setEditForm] = useState({ name: '', email: '', bio: '', phone: '' })
  const [notifForm, setNotifForm] = useState({ title: '', content: '', icon: '🔔', link: '' })

  // ── Fetch User Detail ──
  const fetchUser = useCallback(async () => {
    if (!selectedUserId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/users/${selectedUserId}`)
      if (!res.ok) throw new Error('Failed to fetch user details')
      const data = await res.json()
      setUser(data.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user')
    } finally {
      setLoading(false)
    }
  }, [selectedUserId])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  // ── Admin Action Handler ──
  const handleAction = useCallback(async (action: string, data?: any, successMsg?: string) => {
    if (!selectedUserId) return
    setActionLoading(action)
    try {
      const res = await fetch(`/api/admin/users/${selectedUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Action "${action}" failed`)
      }
      const result = await res.json()
      toast.success(successMsg || `Action "${action}" completed successfully`)
      // Refresh user data
      fetchUser()
      return result
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }, [selectedUserId, fetchUser])

  // ── Delete Account ──
  const handleDeleteAccount = useCallback(async () => {
    if (!selectedUserId) return
    setActionLoading('delete')
    try {
      const res = await fetch(`/api/admin/users/${selectedUserId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete account')
      toast.success('Account deleted successfully')
      setCurrentView('admin-users')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setActionLoading(null)
    }
  }, [selectedUserId, setCurrentView])

  // ── Populate edit form when opening ──
  useEffect(() => {
    if (editProfileOpen && user) {
      setEditForm({ name: user.name, email: user.email, bio: user.bio || '', phone: user.phone || '' })
    }
  }, [editProfileOpen, user])

  // ── No user selected ──
  if (!selectedUserId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="flex flex-col items-center justify-center py-20 gap-4"
      >
        <User className="size-16 text-muted-foreground/30" />
        <h2 className="text-[22px] font-bold">No User Selected</h2>
        <p className="text-[15px] text-muted-foreground">Select a user from the management list to view details.</p>
        <Button variant="outline" className="rounded-xl gap-2" onClick={() => setCurrentView('admin-users')}>
          <ArrowLeft className="size-4" /> Back to Users
        </Button>
      </motion.div>
    )
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-20 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  // ── Error ──
  if (error || !user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="flex flex-col items-center justify-center py-20 gap-4"
      >
        <AlertTriangle className="size-16 text-red-400" />
        <h2 className="text-[22px] font-bold">Failed to Load User</h2>
        <p className="text-[15px] text-muted-foreground">{error || 'User not found'}</p>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => setCurrentView('admin-users')}>
            <ArrowLeft className="size-4" /> Back to Users
          </Button>
          <Button className="rounded-xl gap-2" onClick={fetchUser}>
            <Loader2 className={cn('size-4', actionLoading && 'animate-spin')} /> Retry
          </Button>
        </div>
      </motion.div>
    )
  }

  const statusConf = STATUS_CONFIG[user.dbStatus] || STATUS_CONFIG[user.status] || STATUS_CONFIG.active
  const roleBadgeClass = ROLE_BADGE[user.role] || ROLE_BADGE.student
  const riskScore = user.riskScore ?? 0
  const riskColor = riskScore < 30 ? 'text-emerald-500' : riskScore < 60 ? 'text-amber-500' : 'text-red-500'
  const riskBg = riskScore < 30 ? 'bg-emerald-500' : riskScore < 60 ? 'bg-amber-500' : 'bg-red-500'

  // ── Compute risk factors ──
  const riskFactors: Array<{ label: string; active: boolean }> = [
    { label: 'No MFA enabled', active: !user.mfaEnabled },
    { label: 'Account flagged', active: !!user.flaggedReason },
    { label: 'Account locked/suspended', active: user.dbStatus === 'suspended' || user.dbStatus === 'banned' },
    { label: 'Not verified', active: !user.isVerified },
    { label: 'Multiple active sessions', active: (user.activeSessions?.length ?? 0) > 3 },
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
      {/* ═══════════ 1. HEADER BAR ═══════════ */}
      <div className="space-y-4">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl gap-2 text-muted-foreground hover:text-foreground -ml-2"
          onClick={() => setCurrentView('admin-users')}
        >
          <ArrowLeft className="size-4" /> Back to Users
        </Button>

        {/* User header card */}
        <Card className="rounded-2xl shadow-sm border-0 bg-gradient-to-r from-card via-card to-muted/30">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-5 items-start md:items-center">
              {/* Avatar */}
              <Avatar className="size-20 rounded-2xl ring-2 ring-background shadow-lg">
                <AvatarImage src={user.avatar || undefined} />
                <AvatarFallback className="text-[22px] bg-primary/10 rounded-2xl font-bold">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-[26px] font-bold">{user.name}</h1>
                  <Badge variant="secondary" className={cn('text-[11px] rounded-lg gap-1', roleBadgeClass)}>
                    {user.role === 'instructor' && user.isVerified && <CheckCircle className="size-3" />}
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                  <Badge variant="secondary" className={cn('text-[11px] rounded-lg gap-1', statusConf.color)}>
                    <div className={cn('size-2 rounded-full', statusConf.dot)} />
                    {statusConf.label}
                  </Badge>
                  {user.isVerified && (
                    <Badge variant="secondary" className="text-[11px] rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 gap-1">
                      <CheckCircle className="size-3" /> Verified
                    </Badge>
                  )}
                  {user.flaggedReason && (
                    <Badge variant="secondary" className="text-[11px] rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 gap-1">
                      <AlertTriangle className="size-3" /> Flagged
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Mail className="size-3.5" /> {user.email}</span>
                  {user.phone && <span className="flex items-center gap-1"><Phone className="size-3.5" /> {user.phone}</span>}
                  <span className="flex items-center gap-1"><Clock className="size-3.5" /> Last active {timeAgo(user.lastActiveAt)}</span>
                  <span className="flex items-center gap-1"><Calendar className="size-3.5" /> Joined {formatDate(user.createdAt)}</span>
                  {user.accountAge !== undefined && <span>{user.accountAge} days old</span>}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-1.5"
                      onClick={() => handleAction('impersonate', undefined, 'Impersonation session started')}
                      disabled={actionLoading === 'impersonate'}
                    >
                      {actionLoading === 'impersonate' ? <Loader2 className="size-3.5 animate-spin" /> : <Eye className="size-3.5" />}
                      Impersonate
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Log in as this user</TooltipContent>
                </Tooltip>

                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5"
                  onClick={() => setSendNotifOpen(true)}
                >
                  <Send className="size-3.5" /> Notify
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5"
                  onClick={() => setEditProfileOpen(true)}
                >
                  <Edit3 className="size-3.5" /> Edit
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)} className="gap-2">
                      <Copy className="size-3.5" /> Copy User ID
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.email)} className="gap-2">
                      <Mail className="size-3.5" /> Copy Email
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setResetPwOpen(true)} className="gap-2">
                      <KeyRound className="size-3.5" /> Reset Password
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction('toggle_mfa')} className="gap-2">
                      {user.mfaEnabled ? <Lock className="size-3.5" /> : <ToggleLeft className="size-3.5" />}
                      {user.mfaEnabled ? 'Disable MFA' : 'Enable MFA'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
                      onClick={() => confirm({
                        title: 'Delete Account',
                        description: `This will permanently delete ${user.name}'s account and all associated data. This action cannot be undone.`,
                        confirmLabel: 'Delete Account',
                        variant: 'destructive',
                        onConfirm: handleDeleteAccount,
                      })}
                    >
                      <Trash2 className="size-3.5" /> Delete Account
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════ 2. STATS OVERVIEW ROW ═══════════ */}
      <AdminStatCardGrid columns={4}>
        {user.role === 'student' && (
          <>
            <AdminStatCard icon={BookOpen} label="Enrolled Courses" value={String(user.enrollments?.length ?? 0)} color="emerald" index={0} />
            <AdminStatCard icon={CheckCircle} label="Completed" value={String(user.enrollments?.filter(e => e.status === 'completed').length ?? 0)} color="teal" index={1} />
            <AdminStatCard icon={Zap} label="XP / Level" value={`${formatNumber(user.xp)} / Lv.${user.level}`} color="amber" index={2} />
            <AdminStatCard icon={Flame} label="Streak" value={`${user.streak} days`} color="orange" index={3} />
          </>
        )}
        {user.role === 'instructor' && (
          <>
            <AdminStatCard icon={GraduationCap} label="Published Courses" value={String(user.courses?.filter(c => c.isPublished).length ?? 0)} color="violet" index={0} />
            <AdminStatCard icon={Users} label="Total Students" value={String(user.courses?.reduce((a, c) => a + c.enrollmentCount, 0) ?? 0)} color="emerald" index={1} />
            <AdminStatCard icon={Star} label="Avg Rating" value={user.courses?.length ? (user.courses.reduce((a, c) => a + c.rating, 0) / user.courses.length).toFixed(1) : 'N/A'} color="amber" index={2} />
            <AdminStatCard icon={DollarSign} label="Total Earnings" value={user.performance?.totalEarnings ? `$${formatNumber(user.performance.totalEarnings)}` : 'N/A'} color="teal" index={3} />
          </>
        )}
        {user.role === 'admin' && (
          <>
            <AdminStatCard icon={Shield} label="Managed Actions" value={String(user.performance?.managedActions ?? 0)} color="amber" index={0} />
            <AdminStatCard icon={Monitor} label="Active Sessions" value={String(user.activeSessions?.length ?? 0)} color="emerald" index={1} />
            <AdminStatCard icon={Server} label="System Status" value="Operational" color="teal" index={2} />
            <AdminStatCard icon={Clock} label="Last Active" value={timeAgo(user.lastActiveAt)} color="violet" index={3} />
          </>
        )}
        {user.role !== 'student' && user.role !== 'instructor' && user.role !== 'admin' && (
          <>
            <AdminStatCard icon={BookOpen} label="Enrolled Courses" value={String(user.enrollments?.length ?? 0)} color="emerald" index={0} />
            <AdminStatCard icon={CheckCircle} label="Completed" value={String(user.enrollments?.filter(e => e.status === 'completed').length ?? 0)} color="teal" index={1} />
            <AdminStatCard icon={Zap} label="XP / Level" value={`${formatNumber(user.xp)} / Lv.${user.level}`} color="amber" index={2} />
            <AdminStatCard icon={Flame} label="Streak" value={`${user.streak} days`} color="orange" index={3} />
          </>
        )}
      </AdminStatCardGrid>

      {/* ═══════════ 3. TABBED CONTENT ═══════════ */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="w-full justify-start h-auto p-1 bg-muted/60 rounded-xl gap-0.5">
            {[
              { value: 'profile', label: 'Profile', icon: User },
              { value: 'activity', label: 'Activity', icon: Activity },
              { value: 'sessions', label: 'Sessions', icon: Monitor },
              { value: 'performance', label: 'Performance', icon: BarChart3 },
              { value: 'actions', label: 'Admin Actions', icon: Shield },
              { value: 'notes', label: 'Notes', icon: StickyNote },
              { value: 'notifications', label: 'Notifications', icon: Bell },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-lg px-3 py-2 text-[13px] font-medium gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"
              >
                <tab.icon className="size-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ─── Tab 1: Profile ─── */}
        <TabsContent value="profile" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Personal Info */}
            <Card className="rounded-2xl shadow-sm border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                  <User className="size-4 text-violet-500" /> Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Full Name', value: user.name, icon: User },
                  { label: 'Email', value: user.email, icon: Mail },
                  { label: 'Phone', value: user.phone || 'Not provided', icon: Phone },
                  { label: 'Bio', value: user.bio || 'Not provided', icon: MessageSquare },
                  { label: 'Language', value: user.language === 'en' ? 'English' : user.language === 'ur' ? 'Urdu' : user.language === 'ar' ? 'Arabic' : user.language, icon: Globe },
                  { label: 'Auth Provider', value: user.authProvider || 'credentials', icon: KeyRound },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-3 py-1">
                    <item.icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                      <p className="text-[14px] break-words">{item.value}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Account Details */}
            <Card className="rounded-2xl shadow-sm border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                  <Shield className="size-4 text-emerald-500" /> Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Account Status', value: statusConf.label, icon: <div className={cn('size-2.5 rounded-full', statusConf.dot)} /> },
                  { label: 'Email Verified', value: user.isVerified ? 'Yes' : 'No', icon: user.isVerified ? <CheckCircle className="size-4 text-emerald-500" /> : <XCircle className="size-4 text-red-500" /> },
                  { label: 'MFA Enabled', value: user.mfaEnabled ? 'Yes' : 'No', icon: user.mfaEnabled ? <Lock className="size-4 text-emerald-500" /> : <AlertTriangle className="size-4 text-amber-500" /> },
                  { label: 'Account Age', value: user.accountAge ? `${user.accountAge} days` : 'N/A', icon: <Calendar className="size-4 text-muted-foreground" /> },
                  { label: 'Last Login', value: formatDateTime(user.lastLoginAt), icon: <Clock className="size-4 text-muted-foreground" /> },
                  { label: 'Last Login IP', value: user.lastLoginIp || 'N/A', icon: <Globe2 className="size-4 text-muted-foreground" /> },
                  { label: 'Created', value: formatDateTime(user.createdAt), icon: <Plus className="size-4 text-muted-foreground" /> },
                  { label: 'Updated', value: formatDateTime(user.updatedAt), icon: <Edit3 className="size-4 text-muted-foreground" /> },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                    <span className="text-[13px] text-muted-foreground flex items-center gap-2">
                      {item.icon} {item.label}
                    </span>
                    <span className="text-[14px] font-medium text-right">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Risk Score Card */}
          <Card className="rounded-2xl shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-500" /> Risk Assessment
              </CardTitle>
              <CardDescription>Account security risk score based on various factors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] text-muted-foreground">Risk Score</span>
                    <span className={cn('text-[24px] font-bold', riskColor)}>{riskScore}</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${riskScore}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={cn('h-full rounded-full', riskBg)}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-emerald-500">Low</span>
                    <span className="text-[10px] text-amber-500">Medium</span>
                    <span className="text-[10px] text-red-500">High</span>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-[13px] font-medium">Risk Factors</p>
                {riskFactors.map(factor => (
                  <div key={factor.label} className="flex items-center gap-2">
                    {factor.active ? (
                      <XCircle className="size-4 text-red-500" />
                    ) : (
                      <CheckCircle className="size-4 text-emerald-500" />
                    )}
                    <span className={cn('text-[13px]', factor.active ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground')}>
                      {factor.label}
                    </span>
                  </div>
                ))}
              </div>
              {user.flaggedReason && (
                <>
                  <Separator />
                  <div className="rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 p-3">
                    <p className="text-[13px] font-medium text-orange-700 dark:text-orange-400 flex items-center gap-2">
                      <Flag className="size-4" /> Flag Reason
                    </p>
                    <p className="text-[13px] text-orange-600 dark:text-orange-300 mt-1">{user.flaggedReason}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Instructor Profile (if applicable) */}
          {user.role === 'instructor' && user.instructorProfile && (
            <Card className="rounded-2xl shadow-sm border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                  <GraduationCap className="size-4 text-violet-500" /> Instructor Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    { label: 'Headline', value: user.instructorProfile.headline },
                    { label: 'Expertise', value: user.instructorProfile.expertise },
                    { label: 'LinkedIn', value: user.instructorProfile.linkedin },
                    { label: 'Website', value: user.instructorProfile.website },
                    { label: 'NTN', value: user.instructorProfile.ntn },
                    { label: 'NTN Verified', value: user.instructorProfile.ntnVerified ? 'Yes' : 'No' },
                    { label: 'CNIC', value: user.instructorProfile.cnic },
                    { label: 'Application Status', value: user.instructorProfile.applicationStatus },
                  ].filter(item => item.value).map(item => (
                    <div key={item.label} className="py-1">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                      <p className="text-[14px]">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── Tab 2: Activity Timeline ─── */}
        <TabsContent value="activity" className="space-y-4">
          <Card className="rounded-2xl shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                <Activity className="size-4 text-teal-500" /> Recent Activity
              </CardTitle>
              <CardDescription>Timeline of user actions and events</CardDescription>
            </CardHeader>
            <CardContent>
              {user.recentActivity && user.recentActivity.length > 0 ? (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-0">
                    {user.recentActivity.map((activity, i) => {
                      const icon = ACTIVITY_ICON_MAP[activity.type] || ACTIVITY_ICON_MAP.default
                      const color = ACTIVITY_COLOR_MAP[activity.type] || ACTIVITY_COLOR_MAP.default
                      return (
                        <motion.div
                          key={activity.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03, ...springTransition }}
                          className="flex items-start gap-4 py-3 relative"
                        >
                          <div className={cn('flex size-10 items-center justify-center rounded-xl z-10 bg-background', color)}>
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-[14px] font-medium">{activity.title}</p>
                            {activity.description && (
                              <p className="text-[13px] text-muted-foreground mt-0.5">{activity.description}</p>
                            )}
                            <p className="text-[11px] text-muted-foreground mt-1">{formatDateTime(activity.createdAt)}</p>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-12 gap-3">
                  <Activity className="size-10 text-muted-foreground/30" />
                  <p className="text-[15px] text-muted-foreground">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab 3: Sessions ─── */}
        <TabsContent value="sessions" className="space-y-4">
          {/* Active Sessions */}
          <Card className="rounded-2xl shadow-sm border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                    <Monitor className="size-4 text-violet-500" /> Active Sessions
                  </CardTitle>
                  <CardDescription>{user.activeSessions?.length ?? 0} active sessions</CardDescription>
                </div>
                {user.activeSessions && user.activeSessions.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => confirm({
                      title: 'Revoke All Sessions',
                      description: 'This will log the user out of all devices. They will need to sign in again.',
                      confirmLabel: 'Revoke All',
                      variant: 'destructive',
                      onConfirm: () => handleAction('clear_sessions', undefined, 'All sessions revoked'),
                    })}
                    disabled={actionLoading === 'clear_sessions'}
                  >
                    {actionLoading === 'clear_sessions' ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                    Revoke All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {user.activeSessions && user.activeSessions.length > 0 ? (
                <div className="space-y-3">
                  {user.activeSessions.map(session => (
                    <div key={session.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
                        {DEVICE_ICONS[session.deviceType] || DEVICE_ICONS.unknown}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-medium">{session.deviceName || session.deviceType}</p>
                          {session.browser && <Badge variant="secondary" className="text-[10px] rounded-lg">{session.browser}</Badge>}
                          {session.os && <Badge variant="secondary" className="text-[10px] rounded-lg">{session.os}</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[12px] text-muted-foreground">
                          {session.ipAddress && <span className="flex items-center gap-1"><Globe2 className="size-3" /> {session.ipAddress}</span>}
                          {session.location && <span className="flex items-center gap-1"><MapPin className="size-3" /> {session.location}</span>}
                          <span className="flex items-center gap-1"><Clock className="size-3" /> {timeAgo(session.lastActivity)}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 shrink-0"
                        onClick={() => confirm({
                          title: 'Revoke Session',
                          description: 'This will log the user out of this device.',
                          confirmLabel: 'Revoke',
                          variant: 'destructive',
                          onConfirm: () => handleAction('clear_sessions', { sessionId: session.id }, 'Session revoked'),
                        })}
                      >
                        Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-12 gap-3">
                  <Monitor className="size-10 text-muted-foreground/30" />
                  <p className="text-[15px] text-muted-foreground">No active sessions</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Login History */}
          <Card className="rounded-2xl shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                <KeyRound className="size-4 text-emerald-500" /> Login History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.loginHistory && user.loginHistory.length > 0 ? (
                <ScrollArea className="max-h-96">
                  <div className="space-y-0 divide-y divide-border/40">
                    {user.loginHistory.map(entry => (
                      <div key={entry.id} className="flex items-center gap-3 py-3">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                          <KeyRound className="size-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium">{entry.title}</p>
                          {entry.description && (
                            <p className="text-[12px] text-muted-foreground">{entry.description}</p>
                          )}
                        </div>
                        <span className="text-[12px] text-muted-foreground shrink-0">{formatDateTime(entry.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center py-12 gap-3">
                  <KeyRound className="size-10 text-muted-foreground/30" />
                  <p className="text-[15px] text-muted-foreground">No login history</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab 4: Performance ─── */}
        <TabsContent value="performance" className="space-y-4">
          {user.role === 'student' && (
            <>
              {/* Learning Progress */}
              <Card className="rounded-2xl shadow-sm border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                    <BookOpen className="size-4 text-emerald-500" /> Learning Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {user.enrollments && user.enrollments.length > 0 ? (
                    <ScrollArea className="max-h-96">
                      <div className="space-y-3">
                        {user.enrollments.map(enrollment => (
                          <div key={enrollment.id} className="p-3 rounded-xl bg-muted/30">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[14px] font-medium truncate flex-1 mr-2">{enrollment.courseTitle}</p>
                              <Badge variant="secondary" className={cn(
                                'text-[10px] rounded-lg shrink-0',
                                enrollment.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                  : enrollment.status === 'active'
                                  ? 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-950/40 dark:text-slate-400'
                              )}>
                                {enrollment.status}
                              </Badge>
                            </div>
                            <Progress value={enrollment.progress} className="h-2 rounded-full" />
                            <div className="flex justify-between mt-1">
                              <span className="text-[11px] text-muted-foreground">{enrollment.progress}% complete</span>
                              <span className="text-[11px] text-muted-foreground">Enrolled {formatDate(enrollment.enrolledAt)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex flex-col items-center py-12 gap-3">
                      <BookOpen className="size-10 text-muted-foreground/30" />
                      <p className="text-[15px] text-muted-foreground">No enrollments yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Student Stats */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="rounded-2xl shadow-sm border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                      <Target className="size-4 text-violet-500" /> Quiz & Assignment Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {user.performance ? (
                      <>
                        <div className="flex justify-between py-1.5 border-b border-border/30">
                          <span className="text-[13px] text-muted-foreground">Quizzes Taken</span>
                          <span className="text-[14px] font-medium">{user.performance.quizStats?.total ?? 0}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-border/30">
                          <span className="text-[13px] text-muted-foreground">Pass Rate</span>
                          <span className="text-[14px] font-medium">{user.performance.quizStats?.passRate ?? 0}%</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-border/30">
                          <span className="text-[13px] text-muted-foreground">Avg Score</span>
                          <span className="text-[14px] font-medium">{user.performance.quizStats?.avgScore ?? 0}%</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-border/30">
                          <span className="text-[13px] text-muted-foreground">Assignments Submitted</span>
                          <span className="text-[14px] font-medium">{user.performance.assignmentStats?.submitted ?? 0}</span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-[13px] text-muted-foreground">Assignments Graded</span>
                          <span className="text-[14px] font-medium">{user.performance.assignmentStats?.graded ?? 0}</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-[13px] text-muted-foreground text-center py-4">No performance data available</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                      <Zap className="size-4 text-amber-500" /> XP & Coins
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
                        <Zap className="size-6 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-[24px] font-bold text-amber-700 dark:text-amber-400">{formatNumber(user.xp)}</p>
                        <p className="text-[13px] text-amber-600 dark:text-amber-500">Level {user.level}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                        <CircleDollarSign className="size-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-[24px] font-bold text-emerald-700 dark:text-emerald-400">{formatNumber(user.shijlCoins)}</p>
                        <p className="text-[13px] text-emerald-600 dark:text-emerald-500">Shijl Coins</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20">
                      <div className="flex size-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/40">
                        <Flame className="size-6 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-[24px] font-bold text-orange-700 dark:text-orange-400">{user.streak}</p>
                        <p className="text-[13px] text-orange-600 dark:text-orange-500">Day Streak</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {user.role === 'instructor' && (
            <>
              {/* Course Performance Table */}
              <Card className="rounded-2xl shadow-sm border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                    <GraduationCap className="size-4 text-violet-500" /> Course Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {user.courses && user.courses.length > 0 ? (
                    <ScrollArea className="max-h-96">
                      <div className="space-y-0 divide-y divide-border/40">
                        {user.courses.map(course => (
                          <div key={course.id} className="flex items-center gap-4 py-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-[14px] font-medium truncate">{course.title}</p>
                                <Badge variant="secondary" className={cn(
                                  'text-[10px] rounded-lg shrink-0',
                                  course.isPublished
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-950/40 dark:text-slate-400'
                                )}>
                                  {course.isPublished ? 'Published' : 'Draft'}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 shrink-0 text-[13px] text-muted-foreground">
                              <span className="flex items-center gap-1"><Users className="size-3" /> {course.enrollmentCount}</span>
                              <span className="flex items-center gap-1 text-amber-500"><Star className="size-3" /> {course.rating.toFixed(1)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex flex-col items-center py-12 gap-3">
                      <GraduationCap className="size-10 text-muted-foreground/30" />
                      <p className="text-[15px] text-muted-foreground">No courses published yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Instructor Metrics */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="rounded-2xl shadow-sm border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                      <Users className="size-4 text-emerald-500" /> Student Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {user.performance ? (
                      <>
                        <div className="flex justify-between py-1.5 border-b border-border/30">
                          <span className="text-[13px] text-muted-foreground">Total Unique Students</span>
                          <span className="text-[14px] font-medium">{user.performance.totalStudents ?? 0}</span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-[13px] text-muted-foreground">Avg Completion Rate</span>
                          <span className="text-[14px] font-medium">{user.performance.avgCompletionRate ?? 0}%</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-[13px] text-muted-foreground text-center py-4">No metrics available</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                      <DollarSign className="size-4 text-teal-500" /> Revenue Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {user.performance ? (
                      <>
                        <div className="flex justify-between py-1.5 border-b border-border/30">
                          <span className="text-[13px] text-muted-foreground">Total Earnings</span>
                          <span className="text-[14px] font-medium">${formatNumber(user.performance.totalEarnings ?? 0)}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-border/30">
                          <span className="text-[13px] text-muted-foreground">Platform Cut</span>
                          <span className="text-[14px] font-medium">${formatNumber(user.performance.platformCut ?? 0)}</span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-[13px] text-muted-foreground">Payout History</span>
                          <span className="text-[14px] font-medium">{user.performance.payoutCount ?? 0} payouts</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-[13px] text-muted-foreground text-center py-4">No revenue data available</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Q&A Metrics */}
              <Card className="rounded-2xl shadow-sm border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                    <HelpCircle className="size-4 text-cyan-500" /> Q&A Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {user.performance ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex justify-between py-1.5">
                        <span className="text-[13px] text-muted-foreground">Questions Received</span>
                        <span className="text-[14px] font-medium">{user.performance.questionsReceived ?? 0}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-[13px] text-muted-foreground">Answer Rate</span>
                        <span className="text-[14px] font-medium">{user.performance.answerRate ?? 0}%</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[13px] text-muted-foreground text-center py-4">No Q&A data available</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {user.role === 'admin' && (
            <Card className="rounded-2xl shadow-sm border-0">
              <CardContent className="py-12 flex flex-col items-center gap-3">
                <Shield className="size-10 text-muted-foreground/30" />
                <p className="text-[15px] text-muted-foreground">Admin performance metrics are tracked in the audit log</p>
                <Button variant="outline" className="rounded-xl gap-2" onClick={() => setCurrentView('admin-audit-log')}>
                  <ExternalLink className="size-4" /> View Audit Log
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── Tab 5: Admin Actions ─── */}
        <TabsContent value="actions" className="space-y-4">
          <Card className="rounded-2xl shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                <Shield className="size-4 text-violet-500" /> Quick Actions
              </CardTitle>
              <CardDescription>Administrative actions for this user account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {/* Suspend / Unsuspend */}
                {user.dbStatus !== 'suspended' ? (
                  <Button
                    variant="outline"
                    className="justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-200 dark:hover:border-red-800 group"
                    onClick={() => { setReasonText(''); setSuspendReasonOpen(true) }}
                    disabled={actionLoading === 'suspend'}
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 group-hover:bg-red-200 dark:group-hover:bg-red-900/60">
                      {actionLoading === 'suspend' ? <Loader2 className="size-4 animate-spin" /> : <Ban className="size-4" />}
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-medium">Suspend Account</p>
                      <p className="text-[11px] text-muted-foreground">Temporarily disable access</p>
                    </div>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/20 group"
                    onClick={() => handleAction('unsuspend', undefined, 'Account unsuspended')}
                    disabled={actionLoading === 'unsuspend'}
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                      {actionLoading === 'unsuspend' ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-medium">Unsuspend Account</p>
                      <p className="text-[11px] text-muted-foreground">Restore account access</p>
                    </div>
                  </Button>
                )}

                {/* Ban / Unban */}
                {user.dbStatus !== 'banned' ? (
                  <Button
                    variant="outline"
                    className="justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 group"
                    onClick={() => { setReasonText(''); setBanReasonOpen(true) }}
                    disabled={actionLoading === 'ban'}
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-red-200 text-red-700 dark:bg-red-950/60 dark:text-red-300 group-hover:bg-red-300">
                      {actionLoading === 'ban' ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-medium">Ban Account</p>
                      <p className="text-[11px] text-muted-foreground">Permanently restrict access</p>
                    </div>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/20 group"
                    onClick={() => handleAction('unsuspend', undefined, 'Account reactivated')}
                    disabled={actionLoading === 'unsuspend'}
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                      <CheckCircle className="size-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-medium">Reactivate Account</p>
                      <p className="text-[11px] text-muted-foreground">Restore banned account</p>
                    </div>
                  </Button>
                )}

                {/* Verify Account */}
                {!user.isVerified && (
                  <Button
                    variant="outline"
                    className="justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/20 group"
                    onClick={() => confirm({
                      title: 'Verify Account',
                      description: `Manually verify ${user.name}'s email address.`,
                      confirmLabel: 'Verify',
                      onConfirm: () => handleAction('verify', undefined, 'Account verified'),
                    })}
                    disabled={actionLoading === 'verify'}
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                      {actionLoading === 'verify' ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-medium">Verify Account</p>
                      <p className="text-[11px] text-muted-foreground">Manually verify email</p>
                    </div>
                  </Button>
                )}

                {/* Change Role */}
                <Button
                  variant="outline"
                  className="justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-950/20 group"
                  onClick={() => { setNewRole(user.role); setChangeRoleOpen(true) }}
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
                    <UserCog className="size-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-medium">Change Role</p>
                    <p className="text-[11px] text-muted-foreground">Current: {user.role}</p>
                  </div>
                </Button>

                {/* Reset Password */}
                <Button
                  variant="outline"
                  className="justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/20 group"
                  onClick={() => { setTempPassword(null); setResetPwOpen(true) }}
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                    <KeyRound className="size-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-medium">Reset Password</p>
                    <p className="text-[11px] text-muted-foreground">Generate new temp password</p>
                  </div>
                </Button>

                {/* Flag / Unflag */}
                {!user.flaggedReason ? (
                  <Button
                    variant="outline"
                    className="justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/20 group"
                    onClick={() => { setReasonText(''); setFlagReasonOpen(true) }}
                    disabled={actionLoading === 'flag'}
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                      {actionLoading === 'flag' ? <Loader2 className="size-4 animate-spin" /> : <Flag className="size-4" />}
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-medium">Flag User</p>
                      <p className="text-[11px] text-muted-foreground">Mark for review</p>
                    </div>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/20 group"
                    onClick={() => handleAction('unflag', undefined, 'User unflagged')}
                    disabled={actionLoading === 'unflag'}
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                      {actionLoading === 'unflag' ? <Loader2 className="size-4 animate-spin" /> : <FlagOff className="size-4" />}
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-medium">Unflag User</p>
                      <p className="text-[11px] text-muted-foreground">Remove flag</p>
                    </div>
                  </Button>
                )}

                {/* Toggle MFA */}
                <Button
                  variant="outline"
                  className="justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-cyan-50 dark:hover:bg-cyan-950/20 group"
                  onClick={() => confirm({
                    title: user.mfaEnabled ? 'Disable MFA' : 'Enable MFA',
                    description: user.mfaEnabled
                      ? `This will disable multi-factor authentication for ${user.name}.`
                      : `This will enable multi-factor authentication for ${user.name}.`,
                    confirmLabel: user.mfaEnabled ? 'Disable' : 'Enable',
                    variant: user.mfaEnabled ? 'destructive' : 'default',
                    onConfirm: () => handleAction('toggle_mfa', undefined, `MFA ${user.mfaEnabled ? 'disabled' : 'enabled'}`),
                  })}
                  disabled={actionLoading === 'toggle_mfa'}
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400">
                    {actionLoading === 'toggle_mfa' ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-medium">Toggle MFA</p>
                    <p className="text-[11px] text-muted-foreground">Currently {user.mfaEnabled ? 'enabled' : 'disabled'}</p>
                  </div>
                </Button>

                {/* Adjust Coins */}
                <Button
                  variant="outline"
                  className="justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/20 group"
                  onClick={() => { setCoinAmount(''); setCoinReason(''); setAdjustCoinsOpen(true) }}
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <CircleDollarSign className="size-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-medium">Adjust Coins</p>
                    <p className="text-[11px] text-muted-foreground">Current: {formatNumber(user.shijlCoins)}</p>
                  </div>
                </Button>

                {/* Adjust XP */}
                <Button
                  variant="outline"
                  className="justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/20 group"
                  onClick={() => { setXpAmount(''); setXpReason(''); setAdjustXpOpen(true) }}
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                    <Zap className="size-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-medium">Adjust XP</p>
                    <p className="text-[11px] text-muted-foreground">Current: {formatNumber(user.xp)}</p>
                  </div>
                </Button>

                {/* Clear All Sessions */}
                <Button
                  variant="outline"
                  className="justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-950/20 group"
                  onClick={() => confirm({
                    title: 'Clear All Sessions',
                    description: `This will log ${user.name} out of all devices.`,
                    confirmLabel: 'Clear All',
                    variant: 'destructive',
                    onConfirm: () => handleAction('clear_sessions', undefined, 'All sessions cleared'),
                  })}
                  disabled={actionLoading === 'clear_sessions'}
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400">
                    {actionLoading === 'clear_sessions' ? <Loader2 className="size-4 animate-spin" /> : <Monitor className="size-4" />}
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-medium">Clear Sessions</p>
                    <p className="text-[11px] text-muted-foreground">{user.activeSessions?.length ?? 0} active</p>
                  </div>
                </Button>

                {/* Delete Account */}
                <Button
                  variant="outline"
                  className="justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-200 dark:hover:border-red-800 group"
                  onClick={() => confirm({
                    title: 'Delete Account',
                    description: `This will permanently delete ${user.name}'s account and all associated data. This action cannot be undone.`,
                    confirmLabel: 'Delete Account',
                    variant: 'destructive',
                    onConfirm: handleDeleteAccount,
                  })}
                  disabled={actionLoading === 'delete'}
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 group-hover:bg-red-200">
                    {actionLoading === 'delete' ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-medium text-red-600 dark:text-red-400">Delete Account</p>
                    <p className="text-[11px] text-red-500/70">Permanent — cannot be undone</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab 6: Notes ─── */}
        <TabsContent value="notes" className="space-y-4">
          {/* Add Note Form */}
          <Card className="rounded-2xl shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                <StickyNote className="size-4 text-violet-500" /> Add Note
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Textarea
                  placeholder="Write an admin note about this user..."
                  className="flex-1 rounded-xl min-h-[80px] resize-none"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <Button
                  className="rounded-xl self-end"
                  disabled={!noteText.trim() || actionLoading === 'add_note'}
                  onClick={async () => {
                    if (!noteText.trim()) return
                    setActionLoading('add_note')
                    try {
                      await fetch(`/api/admin/users/${selectedUserId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'add_note',
                          data: { note: noteText.trim(), adminName: currentUser?.name || 'Admin' },
                        }),
                      })
                      toast.success('Note added')
                      setNoteText('')
                      fetchUser()
                    } catch {
                      toast.error('Failed to add note')
                    } finally {
                      setActionLoading(null)
                    }
                  }}
                >
                  {actionLoading === 'add_note' ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notes List */}
          <Card className="rounded-2xl shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                <MessageCircle className="size-4 text-teal-500" /> Admin Notes
              </CardTitle>
              <CardDescription>{user.adminNotes?.length ?? 0} notes</CardDescription>
            </CardHeader>
            <CardContent>
              {user.adminNotes && user.adminNotes.length > 0 ? (
                <div className="space-y-3">
                  {[...user.adminNotes].reverse().map((note, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 group">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 shrink-0">
                        <StickyNote className="size-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px]">{note.note}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[11px] text-muted-foreground">by {note.adminName}</span>
                          <span className="text-[11px] text-muted-foreground">· {formatDate(note.date)}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => confirm({
                          title: 'Delete Note',
                          description: 'Are you sure you want to delete this note?',
                          confirmLabel: 'Delete',
                          variant: 'destructive',
                          onConfirm: () => handleAction('delete_note', { index: user.adminNotes.length - 1 - index }, 'Note deleted'),
                        })}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-12 gap-3">
                  <StickyNote className="size-10 text-muted-foreground/30" />
                  <p className="text-[15px] text-muted-foreground">No admin notes yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab 7: Notifications ─── */}
        <TabsContent value="notifications" className="space-y-4">
          {/* Send Notification Form */}
          <Card className="rounded-2xl shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                <Send className="size-4 text-violet-500" /> Send Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Title</Label>
                  <Input
                    placeholder="Notification title..."
                    className="rounded-xl"
                    value={notifForm.title}
                    onChange={(e) => setNotifForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px]">Icon (emoji)</Label>
                  <Input
                    placeholder="🔔"
                    className="rounded-xl"
                    value={notifForm.icon}
                    onChange={(e) => setNotifForm(prev => ({ ...prev, icon: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[13px]">Content</Label>
                <Textarea
                  placeholder="Notification message..."
                  className="rounded-xl min-h-[60px] resize-none"
                  value={notifForm.content}
                  onChange={(e) => setNotifForm(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  className="rounded-xl gap-2"
                  disabled={!notifForm.title.trim() || !notifForm.content.trim() || actionLoading === 'send_notification'}
                  onClick={async () => {
                    if (!notifForm.title.trim() || !notifForm.content.trim()) return
                    setActionLoading('send_notification')
                    try {
                      await fetch(`/api/admin/users/${selectedUserId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'send_notification',
                          data: { title: notifForm.title, content: notifForm.content, icon: notifForm.icon || '🔔' },
                        }),
                      })
                      toast.success('Notification sent')
                      setNotifForm({ title: '', content: '', icon: '🔔', link: '' })
                      fetchUser()
                    } catch {
                      toast.error('Failed to send notification')
                    } finally {
                      setActionLoading(null)
                    }
                  }}
                >
                  {actionLoading === 'send_notification' ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  Send Notification
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card className="rounded-2xl shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                <Bell className="size-4 text-amber-500" /> Recent Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.recentNotifications && user.recentNotifications.length > 0 ? (
                <ScrollArea className="max-h-96">
                  <div className="space-y-2">
                    {user.recentNotifications.map(notif => (
                      <div key={notif.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 shrink-0">
                          <Bell className="size-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[14px] font-medium">{notif.title}</p>
                            {!notif.isRead && (
                              <Badge variant="secondary" className="text-[10px] rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400">
                                Unread
                              </Badge>
                            )}
                          </div>
                          <p className="text-[13px] text-muted-foreground mt-0.5">{notif.content}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">{formatDateTime(notif.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center py-12 gap-3">
                  <Bell className="size-10 text-muted-foreground/30" />
                  <p className="text-[15px] text-muted-foreground">No notifications sent</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══════════ DIALOGS ═══════════ */}

      {/* Global Confirm Dialog */}
      <AlertDialog open={!!confirmState} onOpenChange={(open) => { if (!open) handleClose() }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmState?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmState?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" onClick={handleClose}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn('rounded-xl', confirmState?.variant === 'destructive' && 'bg-red-600 hover:bg-red-700')}
              onClick={() => {
                confirmState?.onConfirm()
                handleClose()
              }}
            >
              {confirmState?.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend Reason Dialog */}
      <Dialog open={suspendReasonOpen} onOpenChange={setSuspendReasonOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Suspend Account</DialogTitle>
            <DialogDescription>Provide a reason for suspending {user.name}&apos;s account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="Reason for suspension..."
              className="rounded-xl min-h-[80px] resize-none"
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setSuspendReasonOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl bg-red-600 hover:bg-red-700"
              disabled={!reasonText.trim() || actionLoading === 'suspend'}
              onClick={() => {
                handleAction('suspend', { reason: reasonText.trim() }, 'Account suspended')
                setSuspendReasonOpen(false)
              }}
            >
              {actionLoading === 'suspend' ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Suspend Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Reason Dialog */}
      <Dialog open={banReasonOpen} onOpenChange={setBanReasonOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Ban Account</DialogTitle>
            <DialogDescription>Provide a reason for banning {user.name}&apos;s account. This is a serious action.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="Reason for ban..."
              className="rounded-xl min-h-[80px] resize-none"
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setBanReasonOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl bg-red-600 hover:bg-red-700"
              disabled={!reasonText.trim() || actionLoading === 'ban'}
              onClick={() => {
                handleAction('ban', { reason: reasonText.trim() }, 'Account banned')
                setBanReasonOpen(false)
              }}
            >
              {actionLoading === 'ban' ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Ban Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Flag Reason Dialog */}
      <Dialog open={flagReasonOpen} onOpenChange={setFlagReasonOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Flag User</DialogTitle>
            <DialogDescription>Provide a reason for flagging {user.name} for review.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="Reason for flagging..."
              className="rounded-xl min-h-[80px] resize-none"
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setFlagReasonOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl bg-orange-600 hover:bg-orange-700"
              disabled={!reasonText.trim() || actionLoading === 'flag'}
              onClick={() => {
                handleAction('flag', { reason: reasonText.trim() }, 'User flagged')
                setFlagReasonOpen(false)
              }}
            >
              {actionLoading === 'flag' ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Flag User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={changeRoleOpen} onOpenChange={setChangeRoleOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>Change {user.name}&apos;s role from {user.role} to:</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="instructor">Instructor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setChangeRoleOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl"
              disabled={newRole === user.role || actionLoading === 'change_role'}
              onClick={() => {
                handleAction('change_role', { role: newRole }, `Role changed to ${newRole}`)
                setChangeRoleOpen(false)
              }}
            >
              {actionLoading === 'change_role' ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Change Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPwOpen} onOpenChange={setResetPwOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              {tempPassword
                ? 'A temporary password has been generated. Share it securely with the user.'
                : `Generate a new temporary password for ${user.name}.`}
            </DialogDescription>
          </DialogHeader>
          {tempPassword ? (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-4">
              <p className="text-[13px] text-emerald-700 dark:text-emerald-400 font-medium mb-2">Temporary Password</p>
              <div className="flex items-center gap-2">
                <code className="text-[16px] font-mono font-bold text-emerald-800 dark:text-emerald-300 flex-1 break-all">{tempPassword}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-lg shrink-0"
                  onClick={() => navigator.clipboard.writeText(tempPassword)}
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3">
              <p className="text-[13px] text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <AlertTriangle className="size-4" /> This will invalidate the current password.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => { setResetPwOpen(false); setTempPassword(null) }}>
              {tempPassword ? 'Close' : 'Cancel'}
            </Button>
            {!tempPassword && (
              <Button
                className="rounded-xl"
                disabled={actionLoading === 'reset_password'}
                onClick={async () => {
                  setActionLoading('reset_password')
                  try {
                    const result = await handleAction('reset_password', undefined, 'Password reset')
                    if (result?.tempPassword) {
                      setTempPassword(result.tempPassword)
                    } else {
                      setResetPwOpen(false)
                    }
                  } finally {
                    setActionLoading(null)
                  }
                }}
              >
                {actionLoading === 'reset_password' ? <Loader2 className="size-4 animate-spin mr-2" /> : <KeyRound className="size-4 mr-2" />}
                Reset Password
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>Update {user.name}&apos;s profile information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Name</Label>
              <Input
                className="rounded-xl"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Email</Label>
              <Input
                className="rounded-xl"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Phone</Label>
              <Input
                className="rounded-xl"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Bio</Label>
              <Textarea
                className="rounded-xl min-h-[60px] resize-none"
                value={editForm.bio}
                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setEditProfileOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl"
              disabled={actionLoading === 'update_profile'}
              onClick={() => {
                handleAction('update_profile', editForm, 'Profile updated')
                setEditProfileOpen(false)
              }}
            >
              {actionLoading === 'update_profile' ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Coins Dialog */}
      <Dialog open={adjustCoinsOpen} onOpenChange={setAdjustCoinsOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Adjust Shijl Coins</DialogTitle>
            <DialogDescription>Current balance: {formatNumber(user.shijlCoins)} coins. Use negative numbers to deduct.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Amount</Label>
              <Input
                type="number"
                placeholder="e.g., 100 or -50"
                className="rounded-xl"
                value={coinAmount}
                onChange={(e) => setCoinAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Reason</Label>
              <Input
                placeholder="Reason for adjustment..."
                className="rounded-xl"
                value={coinReason}
                onChange={(e) => setCoinReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setAdjustCoinsOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl"
              disabled={!coinAmount || !coinReason.trim() || actionLoading === 'adjust_coins'}
              onClick={() => {
                handleAction('adjust_coins', { amount: parseInt(coinAmount), reason: coinReason.trim() }, `Coins adjusted by ${coinAmount}`)
                setAdjustCoinsOpen(false)
              }}
            >
              {actionLoading === 'adjust_coins' ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Adjust Coins
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust XP Dialog */}
      <Dialog open={adjustXpOpen} onOpenChange={setAdjustXpOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Adjust XP</DialogTitle>
            <DialogDescription>Current XP: {formatNumber(user.xp)}. Use negative numbers to deduct.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Amount</Label>
              <Input
                type="number"
                placeholder="e.g., 500 or -100"
                className="rounded-xl"
                value={xpAmount}
                onChange={(e) => setXpAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Reason</Label>
              <Input
                placeholder="Reason for adjustment..."
                className="rounded-xl"
                value={xpReason}
                onChange={(e) => setXpReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setAdjustXpOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl"
              disabled={!xpAmount || !xpReason.trim() || actionLoading === 'adjust_xp'}
              onClick={() => {
                handleAction('adjust_xp', { amount: parseInt(xpAmount), reason: xpReason.trim() }, `XP adjusted by ${xpAmount}`)
                setAdjustXpOpen(false)
              }}
            >
              {actionLoading === 'adjust_xp' ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Adjust XP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Notification Dialog (from header) */}
      <Dialog open={sendNotifOpen} onOpenChange={setSendNotifOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>Send a notification to {user.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Title</Label>
              <Input
                placeholder="Notification title..."
                className="rounded-xl"
                value={notifForm.title}
                onChange={(e) => setNotifForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Content</Label>
              <Textarea
                placeholder="Notification message..."
                className="rounded-xl min-h-[60px] resize-none"
                value={notifForm.content}
                onChange={(e) => setNotifForm(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px]">Icon</Label>
              <Input
                placeholder="🔔"
                className="rounded-xl w-24"
                value={notifForm.icon}
                onChange={(e) => setNotifForm(prev => ({ ...prev, icon: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setSendNotifOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl gap-2"
              disabled={!notifForm.title.trim() || !notifForm.content.trim() || actionLoading === 'send_notification'}
              onClick={async () => {
                if (!notifForm.title.trim() || !notifForm.content.trim()) return
                setActionLoading('send_notification')
                try {
                  await fetch(`/api/admin/users/${selectedUserId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: 'send_notification',
                      data: { title: notifForm.title, content: notifForm.content, icon: notifForm.icon || '🔔' },
                    }),
                  })
                  toast.success('Notification sent')
                  setNotifForm({ title: '', content: '', icon: '🔔', link: '' })
                  setSendNotifOpen(false)
                  fetchUser()
                } catch {
                  toast.error('Failed to send notification')
                } finally {
                  setActionLoading(null)
                }
              }}
            >
              {actionLoading === 'send_notification' ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
