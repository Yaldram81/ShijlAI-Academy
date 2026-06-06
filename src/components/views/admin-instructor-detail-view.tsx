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
  Youtube, Twitter, FileText, Sparkles, Wallet, Banknote,
  Percent, BadgeCheck, ClipboardCheck, RotateCcw, Power,
  MessageCircleMore, ThumbsUp, ThumbsDown, CircleDot,
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

interface InstructorCourse {
  id: string
  title: string
  category: string | null
  thumbnail: string | null
  enrollmentCount: number
  rating: number
  price: number
  isPublished: boolean
  reviewStatus: string | null
  isFeatured: boolean
}

interface PayoutMethod {
  id: string
  type: string
  details: string
  isDefault: boolean
}

interface RecentPayout {
  id: string
  date: string
  amount: number
  method: string
  status: string
  period: string
}

interface StudentByCourse {
  courseId: string
  courseTitle: string
  studentCount: number
}

interface TopStudent {
  id: string
  name: string
  avatar: string | null
  courseTitle: string
  progress: number
  enrolledAt: string
}

interface RecentEnrollment {
  id: string
  studentName: string
  studentAvatar: string | null
  courseTitle: string
  enrolledAt: string
}

interface InstructorDetail {
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
    youtube: string | null
    twitter: string | null
    ntn: string | null
    ntnVerified: boolean
    expertise: string | null
    applicationStatus: string | null
    cnic: string | null
    topicProposal: string | null
    sampleOutline: string | null
    appliedAt: string | null
    reviewedAt: string | null
    reviewedBy: string | null
    rejectionReason: string | null
    commissionRate: number | null
  } | null
  payoutInfo: { type: string; last4: string; bankName: string | null } | null
  performance: {
    totalEarnings?: number
    thisMonthEarnings?: number
    lastMonthEarnings?: number
    avgMonthlyEarnings?: number
    platformCut?: number
    payoutCount?: number
    totalStudents?: number
    avgCompletionRate?: number
    questionsReceived?: number
    answerRate?: number
    totalCourses?: number
    publishedCourses?: number
    draftCourses?: number
    avgRating?: number
  } | null
  recentActivity: Array<{
    id: string
    type: string
    title: string
    description: string | null
    icon: string
    createdAt: string
  }>
  adminNotes: Array<{ note: string; adminName: string; date: string }>
  accountAge?: number
  riskScore?: number
  courses?: InstructorCourse[]
  payoutMethods?: PayoutMethod[]
  recentPayouts?: RecentPayout[]
  studentsByCourse?: StudentByCourse[]
  recentEnrollments?: RecentEnrollment[]
  topStudents?: TopStudent[]
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

function parseExpertise(expertise: string | null): string[] {
  if (!expertise) return []
  try {
    const parsed = JSON.parse(expertise)
    if (Array.isArray(parsed)) return parsed
    return [String(parsed)]
  } catch {
    return expertise.split(',').map((s: string) => s.trim()).filter(Boolean)
  }
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

const APPLICATION_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending Review', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' },
  info_requested: { label: 'Info Requested', color: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400' },
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
  course_created: <GraduationCap className="size-4" />,
  course_published: <BookOpen className="size-4" />,
  payout_requested: <Wallet className="size-4" />,
  profile_updated: <Edit3 className="size-4" />,
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
  course_created: 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
  course_published: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
  payout_requested: 'bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400',
  profile_updated: 'bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
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

export function AdminInstructorDetailView() {
  const { selectedInstructorId, setCurrentView, currentUser } = useAppStore()
  const [instructor, setInstructor] = useState<InstructorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Dialog states
  const { confirmState, confirm, handleClose } = useConfirmDialog()
  const [suspendReasonOpen, setSuspendReasonOpen] = useState(false)
  const [banReasonOpen, setBanReasonOpen] = useState(false)
  const [flagReasonOpen, setFlagReasonOpen] = useState(false)
  const [adjustCoinsOpen, setAdjustCoinsOpen] = useState(false)
  const [adjustXpOpen, setAdjustXpOpen] = useState(false)
  const [adjustCommissionOpen, setAdjustCommissionOpen] = useState(false)
  const [resetPwOpen, setResetPwOpen] = useState(false)
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [sendNotifOpen, setSendNotifOpen] = useState(false)
  const [approveAppOpen, setApproveAppOpen] = useState(false)
  const [rejectAppOpen, setRejectAppOpen] = useState(false)
  const [requestInfoOpen, setRequestInfoOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)

  // Form states
  const [reasonText, setReasonText] = useState('')
  const [coinAmount, setCoinAmount] = useState('')
  const [coinReason, setCoinReason] = useState('')
  const [xpAmount, setXpAmount] = useState('')
  const [xpReason, setXpReason] = useState('')
  const [commissionRate, setCommissionRate] = useState('')
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [editForm, setEditForm] = useState({ name: '', email: '', bio: '', phone: '' })
  const [notifForm, setNotifForm] = useState({ title: '', content: '', icon: '🔔', link: '' })

  // ── Fetch Instructor Detail ──
  const fetchInstructor = useCallback(async () => {
    if (!selectedInstructorId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/instructors/${selectedInstructorId}`)
      if (!res.ok) throw new Error('Failed to fetch instructor details')
      const data = await res.json()
      setInstructor(data.instructor || data.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load instructor')
    } finally {
      setLoading(false)
    }
  }, [selectedInstructorId])

  useEffect(() => {
    fetchInstructor()
  }, [fetchInstructor])

  // ── Admin Action Handler ──
  const handleAction = useCallback(async (action: string, data?: any, successMsg?: string) => {
    if (!selectedInstructorId) return
    setActionLoading(action)
    try {
      const res = await fetch(`/api/admin/instructors/${selectedInstructorId}`, {
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
      fetchInstructor()
      return result
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActionLoading(null)
    }
  }, [selectedInstructorId, fetchInstructor])

  // ── Delete Account ──
  const handleDeleteAccount = useCallback(async () => {
    if (!selectedInstructorId) return
    setActionLoading('delete')
    try {
      const res = await fetch(`/api/admin/instructors/${selectedInstructorId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete account')
      toast.success('Account deleted successfully')
      setCurrentView('admin-instructors')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setActionLoading(null)
    }
  }, [selectedInstructorId, setCurrentView])

  // ── Populate edit form when opening ──
  useEffect(() => {
    if (editProfileOpen && instructor) {
      setEditForm({ name: instructor.name, email: instructor.email, bio: instructor.bio || '', phone: instructor.phone || '' })
    }
  }, [editProfileOpen, instructor])

  // ── No instructor selected ──
  if (!selectedInstructorId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="flex flex-col items-center justify-center py-20 gap-4"
      >
        <GraduationCap className="size-16 text-muted-foreground/30" />
        <h2 className="text-[22px] font-bold">No Instructor Selected</h2>
        <p className="text-[15px] text-muted-foreground">Select an instructor from the management list to view details.</p>
        <Button variant="outline" className="rounded-xl gap-2" onClick={() => setCurrentView('admin-instructors')}>
          <ArrowLeft className="size-4" /> Back to Instructors
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
  if (error || !instructor) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="flex flex-col items-center justify-center py-20 gap-4"
      >
        <AlertTriangle className="size-16 text-red-400" />
        <h2 className="text-[22px] font-bold">Failed to Load Instructor</h2>
        <p className="text-[15px] text-muted-foreground">{error || 'Instructor not found'}</p>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => setCurrentView('admin-instructors')}>
            <ArrowLeft className="size-4" /> Back to Instructors
          </Button>
          <Button className="rounded-xl gap-2" onClick={fetchInstructor}>
            <Loader2 className={cn('size-4', actionLoading && 'animate-spin')} /> Retry
          </Button>
        </div>
      </motion.div>
    )
  }

  const statusConf = STATUS_CONFIG[instructor.dbStatus] || STATUS_CONFIG[instructor.status] || STATUS_CONFIG.active
  const roleBadgeClass = ROLE_BADGE[instructor.role] || ROLE_BADGE.instructor
  const ip = instructor.instructorProfile
  const expertiseList = parseExpertise(ip?.expertise ?? null)
  const appStatusConf = ip?.applicationStatus ? APPLICATION_STATUS_CONFIG[ip.applicationStatus] : null



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
          onClick={() => setCurrentView('admin-instructors')}
        >
          <ArrowLeft className="size-4" /> Back to Instructors
        </Button>

        {/* Instructor header card */}
        <Card className="rounded-2xl shadow-sm border-0 bg-gradient-to-r from-card via-card to-muted/30">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-5 items-start md:items-center">
              {/* Avatar */}
              <Avatar className="size-20 rounded-2xl ring-2 ring-background shadow-lg">
                <AvatarImage src={instructor.avatar || undefined} />
                <AvatarFallback className="text-[22px] bg-violet-500/10 rounded-2xl font-bold text-violet-600">
                  {getInitials(instructor.name)}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-[26px] font-bold">{instructor.name}</h1>
                  <Badge variant="secondary" className={cn('text-[11px] rounded-lg gap-1', roleBadgeClass)}>
                    {instructor.isVerified && <CheckCircle className="size-3" />}
                    Instructor
                  </Badge>
                  <Badge variant="secondary" className={cn('text-[11px] rounded-lg gap-1', statusConf.color)}>
                    <div className={cn('size-2 rounded-full', statusConf.dot)} />
                    {statusConf.label}
                  </Badge>
                  {instructor.isVerified && (
                    <Badge variant="secondary" className="text-[11px] rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 gap-1">
                      <CheckCircle className="size-3" /> Verified
                    </Badge>
                  )}
                  {instructor.flaggedReason && (
                    <Badge variant="secondary" className="text-[11px] rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400 gap-1">
                      <AlertTriangle className="size-3" /> Flagged
                    </Badge>
                  )}
                  {appStatusConf && (
                    <Badge variant="secondary" className={cn('text-[11px] rounded-lg gap-1', appStatusConf.color)}>
                      {appStatusConf.label}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
                  <span className="flex items-center gap-1"><Mail className="size-3.5" /> {instructor.email}</span>
                  {ip?.headline && <span className="flex items-center gap-1"><GraduationCap className="size-3.5" /> {ip.headline}</span>}
                  <span className="flex items-center gap-1"><Clock className="size-3.5" /> Last active {timeAgo(instructor.lastActiveAt)}</span>
                  <span className="flex items-center gap-1"><Calendar className="size-3.5" /> Joined {formatDate(instructor.createdAt)}</span>
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
                  <TooltipContent>Log in as this instructor</TooltipContent>
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
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(instructor.id)} className="gap-2">
                      <Copy className="size-3.5" /> Copy ID
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(instructor.email)} className="gap-2">
                      <Mail className="size-3.5" /> Copy Email
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setResetPwOpen(true)} className="gap-2">
                      <KeyRound className="size-3.5" /> Reset Password
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAction('toggle_mfa')} className="gap-2">
                      {instructor.mfaEnabled ? <Lock className="size-3.5" /> : <ToggleLeft className="size-3.5" />}
                      {instructor.mfaEnabled ? 'Disable MFA' : 'Enable MFA'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
                      onClick={() => confirm({
                        title: 'Delete Account',
                        description: `This will permanently delete ${instructor.name}'s account and all associated data. This action cannot be undone.`,
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
        <AdminStatCard
          icon={GraduationCap}
          label="Published Courses"
          value={String(instructor.courses?.filter(c => c.isPublished).length ?? instructor.performance?.publishedCourses ?? 0)}
          color="violet"
          index={0}
        />
        <AdminStatCard
          icon={Users}
          label="Total Students"
          value={String(instructor.performance?.totalStudents ?? instructor.courses?.reduce((a, c) => a + c.enrollmentCount, 0) ?? 0)}
          color="emerald"
         
          index={1}
        />
        <AdminStatCard
          icon={Star}
          label="Average Rating"
          value={(() => {
            const courses = instructor.courses
            if (courses && courses.length > 0) {
              const avg = courses.reduce((a, c) => a + c.rating, 0) / courses.length
              return avg.toFixed(1)
            }
            return instructor.performance?.avgRating?.toFixed(1) ?? 'N/A'
          })()}
          color="amber"
         
          index={2}
        />
        <AdminStatCard
          icon={DollarSign}
          label="Total Earnings (USD)"
          value={instructor.performance?.totalEarnings ? `$${formatNumber(instructor.performance.totalEarnings)}` : '$0'}
          color="teal"
         
          index={3}
        />
      </AdminStatCardGrid>

      {/* ═══════════ 3. TABBED CONTENT ═══════════ */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="w-full justify-start h-auto p-1 bg-muted/60 rounded-xl gap-0.5">
            {[
              { value: 'profile', label: 'Profile', icon: User },
              { value: 'courses', label: 'Courses', icon: GraduationCap },
              { value: 'earnings', label: 'Earnings & Payouts', icon: DollarSign },
              { value: 'students', label: 'Students', icon: Users },
              { value: 'activity', label: 'Activity', icon: Activity },
              { value: 'actions', label: 'Admin Actions', icon: Shield },
              { value: 'notes', label: 'Notes', icon: StickyNote },
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
            {/* Personal Information */}
            <Card className="rounded-2xl shadow-sm border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                  <User className="size-4 text-violet-500" /> Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Full Name', value: instructor.name, icon: User },
                  { label: 'Email', value: instructor.email, icon: Mail },
                  { label: 'Phone', value: instructor.phone || 'Not provided', icon: Phone },
                  { label: 'Bio', value: instructor.bio || 'Not provided', icon: MessageSquare },
                  { label: 'Language', value: instructor.language === 'en' ? 'English' : instructor.language === 'ur' ? 'Urdu' : instructor.language === 'ar' ? 'Arabic' : instructor.language, icon: Globe },
                  { label: 'Auth Provider', value: instructor.authProvider || 'credentials', icon: KeyRound },
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

            {/* Instructor Profile */}
            <Card className="rounded-2xl shadow-sm border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                  <GraduationCap className="size-4 text-violet-500" /> Instructor Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ip ? (
                  <>
                    {[
                      { label: 'Headline', value: ip.headline, icon: GraduationCap },
                      { label: 'LinkedIn', value: ip.linkedin, icon: ExternalLink },
                      { label: 'Website', value: ip.website, icon: Globe },
                      { label: 'YouTube', value: ip.youtube, icon: Youtube },
                      { label: 'Twitter', value: ip.twitter, icon: Twitter },
                      { label: 'NTN', value: ip.ntn, icon: FileText },
                      { label: 'NTN Verified', value: ip.ntnVerified ? 'Yes ✓' : 'No', icon: ip.ntnVerified ? BadgeCheck : XCircle },
                      { label: 'CNIC', value: ip.cnic, icon: ClipboardCheck },
                      { label: 'Topic Proposal', value: ip.topicProposal, icon: FileText },
                      { label: 'Sample Outline', value: ip.sampleOutline, icon: FileText },
                    ].filter(item => item.value).map(item => (
                      <div key={item.label} className="flex items-start gap-3 py-1">
                        <item.icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                          <p className="text-[14px] break-words">{item.value}</p>
                        </div>
                      </div>
                    ))}
                    {expertiseList.length > 0 && (
                      <div className="flex items-start gap-3 py-1">
                        <Sparkles className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Expertise</p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {expertiseList.map((skill: string) => (
                              <Badge key={skill} variant="secondary" className="text-[11px] rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-[13px] text-muted-foreground text-center py-4">No instructor profile data</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Application Status */}
          {ip && (
            <Card className="rounded-2xl shadow-sm border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                  <ClipboardCheck className="size-4 text-amber-500" /> Application Status
                </CardTitle>
                <CardDescription>Instructor application review details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <div className="py-1">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Current Status</p>
                    {appStatusConf ? (
                      <Badge variant="secondary" className={cn('text-[11px] rounded-lg mt-1', appStatusConf.color)}>
                        {appStatusConf.label}
                      </Badge>
                    ) : (
                      <p className="text-[14px] mt-1">N/A</p>
                    )}
                  </div>
                  <div className="py-1">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Applied Date</p>
                    <p className="text-[14px]">{formatDate(ip.appliedAt)}</p>
                  </div>
                  <div className="py-1">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Reviewed Date</p>
                    <p className="text-[14px]">{formatDate(ip.reviewedAt)}</p>
                  </div>
                  <div className="py-1">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Reviewer</p>
                    <p className="text-[14px]">{ip.reviewedBy || 'N/A'}</p>
                  </div>
                </div>
                {ip.rejectionReason && (
                  <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3">
                    <p className="text-[13px] font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                      <XCircle className="size-4" /> Rejection Reason
                    </p>
                    <p className="text-[13px] text-red-600 dark:text-red-300 mt-1">{ip.rejectionReason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
                { label: 'Email Verified', value: instructor.isVerified ? 'Yes' : 'No', icon: instructor.isVerified ? <CheckCircle className="size-4 text-emerald-500" /> : <XCircle className="size-4 text-red-500" /> },
                { label: 'MFA Enabled', value: instructor.mfaEnabled ? 'Yes' : 'No', icon: instructor.mfaEnabled ? <Lock className="size-4 text-emerald-500" /> : <AlertTriangle className="size-4 text-amber-500" /> },
                { label: 'Account Age', value: instructor.accountAge ? `${instructor.accountAge} days` : 'N/A', icon: <Calendar className="size-4 text-muted-foreground" /> },
                { label: 'Last Login', value: formatDateTime(instructor.lastLoginAt), icon: <Clock className="size-4 text-muted-foreground" /> },
                { label: 'Last Login IP', value: instructor.lastLoginIp || 'N/A', icon: <Globe2 className="size-4 text-muted-foreground" /> },
                { label: 'Created', value: formatDateTime(instructor.createdAt), icon: <Plus className="size-4 text-muted-foreground" /> },
                { label: 'Updated', value: formatDateTime(instructor.updatedAt), icon: <Edit3 className="size-4 text-muted-foreground" /> },
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
        </TabsContent>

        {/* ─── Tab 2: Courses ─── */}
        <TabsContent value="courses" className="space-y-4">
          {/* Quick Stats */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Courses', value: instructor.courses?.length ?? instructor.performance?.totalCourses ?? 0, color: 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400', icon: GraduationCap },
              { label: 'Published', value: instructor.courses?.filter(c => c.isPublished).length ?? instructor.performance?.publishedCourses ?? 0, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400', icon: CheckCircle },
              { label: 'Draft', value: instructor.courses?.filter(c => !c.isPublished).length ?? instructor.performance?.draftCourses ?? 0, color: 'bg-slate-100 text-slate-600 dark:bg-slate-950/40 dark:text-slate-400', icon: Edit3 },
              { label: 'Avg Rating', value: (() => {
                const courses = instructor.courses
                if (courses && courses.length > 0) return (courses.reduce((a, c) => a + c.rating, 0) / courses.length).toFixed(1)
                return instructor.performance?.avgRating?.toFixed(1) ?? 'N/A'
              })(), color: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400', icon: Star },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, ...springTransition }}
              >
                <Card className="rounded-2xl shadow-sm border-0 h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('flex size-9 items-center justify-center rounded-xl', stat.color)}>
                        <stat.icon className="size-4" />
                      </div>
                      <div>
                        <p className="text-[18px] font-bold">{stat.value}</p>
                        <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Course List */}
          <Card className="rounded-2xl shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                <GraduationCap className="size-4 text-violet-500" /> Instructor Courses
              </CardTitle>
              <CardDescription>{instructor.courses?.length ?? 0} courses total</CardDescription>
            </CardHeader>
            <CardContent>
              {instructor.courses && instructor.courses.length > 0 ? (
                <ScrollArea className="max-h-[480px]">
                  <div className="space-y-3">
                    {instructor.courses.map(course => (
                      <div key={course.id} className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                        {/* Thumbnail placeholder */}
                        <div className="flex size-14 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400 shrink-0">
                          <GraduationCap className="size-6" />
                        </div>

                        {/* Course Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[14px] font-medium truncate">{course.title}</p>
                            <Badge variant="secondary" className={cn(
                              'text-[10px] rounded-lg shrink-0',
                              course.isPublished
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-950/40 dark:text-slate-400'
                            )}>
                              {course.isPublished ? 'Published' : 'Draft'}
                            </Badge>
                            {course.reviewStatus && (
                              <Badge variant="secondary" className="text-[10px] rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 shrink-0">
                                {course.reviewStatus}
                              </Badge>
                            )}
                            {course.isFeatured && (
                              <Badge variant="secondary" className="text-[10px] rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 shrink-0">
                                ⭐ Featured
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[12px] text-muted-foreground">
                            {course.category && <span>{course.category}</span>}
                            <span className="flex items-center gap-1"><Users className="size-3" /> {course.enrollmentCount}</span>
                            <span className="flex items-center gap-1 text-amber-500"><Star className="size-3" /> {course.rating.toFixed(1)}</span>
                            <span>${course.price.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="size-8 rounded-lg"
                                onClick={() => {
                                  navigator.clipboard.writeText(course.id)
                                  toast.success('Course ID copied')
                                }}
                              >
                                <Eye className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Course</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="size-8 rounded-lg"
                                onClick={() => {
                                  useAppStore.getState().setCurrentView('admin-courses')
                                }}
                              >
                                <Edit3 className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit Course</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn('size-8 rounded-lg', course.isFeatured ? 'text-amber-500' : '')}
                                onClick={() => handleAction(
                                  course.isFeatured ? 'unfeature_course' : 'feature_course',
                                  { courseId: course.id },
                                  course.isFeatured ? 'Course unfeatured' : 'Course featured'
                                )}
                              >
                                <Star className="size-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{course.isFeatured ? 'Unfeature' : 'Feature'}</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center py-12 gap-3">
                  <GraduationCap className="size-10 text-muted-foreground/30" />
                  <p className="text-[15px] text-muted-foreground">No courses created yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab 3: Earnings & Payouts ─── */}
        <TabsContent value="earnings" className="space-y-4">
          {/* Earnings Summary */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Earnings', value: `$${formatNumber(instructor.performance?.totalEarnings ?? 0)}`, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400', icon: DollarSign },
              { label: 'This Month', value: `$${formatNumber(instructor.performance?.thisMonthEarnings ?? 0)}`, color: 'bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400', icon: TrendingUp },
              { label: 'Last Month', value: `$${formatNumber(instructor.performance?.lastMonthEarnings ?? 0)}`, color: 'bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400', icon: BarChart3 },
              { label: 'Avg Monthly', value: `$${formatNumber(instructor.performance?.avgMonthlyEarnings ?? 0)}`, color: 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400', icon: Target },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, ...springTransition }}
              >
                <Card className="rounded-2xl shadow-sm border-0 h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('flex size-9 items-center justify-center rounded-xl', stat.color)}>
                        <stat.icon className="size-4" />
                      </div>
                      <div>
                        <p className="text-[16px] font-bold">{stat.value}</p>
                        <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Earnings Breakdown Chart Placeholder */}
          <Card className="rounded-2xl shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                <BarChart3 className="size-4 text-teal-500" /> Earnings Breakdown
              </CardTitle>
              <CardDescription>Monthly earnings trend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-48 rounded-xl bg-muted/30 border border-dashed border-border">
                <div className="text-center">
                  <BarChart3 className="size-10 text-muted-foreground/30 mx-auto" />
                  <p className="text-[13px] text-muted-foreground mt-2">Earnings chart visualization</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Commission Override Info */}
          <Card className="rounded-2xl shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                <Percent className="size-4 text-violet-500" /> Commission Rate
              </CardTitle>
              <CardDescription>Instructor revenue share configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950/40">
                    <Percent className="size-6 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <p className="text-[24px] font-bold text-violet-700 dark:text-violet-400">
                      {ip?.commissionRate ?? 80}%
                    </p>
                    <p className="text-[13px] text-muted-foreground">
                      {ip?.commissionRate ? 'Custom rate (default: 80%)' : 'Default rate'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5"
                  onClick={() => {
                    setCommissionRate(String(ip?.commissionRate ?? 80))
                    setAdjustCommissionOpen(true)
                  }}
                >
                  <Edit3 className="size-3.5" /> Adjust Commission
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payout Methods */}
          <Card className="rounded-2xl shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                <Wallet className="size-4 text-emerald-500" /> Payout Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              {instructor.payoutMethods && instructor.payoutMethods.length > 0 ? (
                <div className="space-y-2">
                  {instructor.payoutMethods.map(method => (
                    <div key={method.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                        {method.type === 'bank' ? <Banknote className="size-4" /> : <CreditCard className="size-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-[14px] font-medium">{method.type.charAt(0).toUpperCase() + method.type.slice(1)}</p>
                        <p className="text-[12px] text-muted-foreground">{method.details}</p>
                      </div>
                      {method.isDefault && (
                        <Badge variant="secondary" className="text-[10px] rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                          Default
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 gap-3">
                  <Wallet className="size-10 text-muted-foreground/30" />
                  <p className="text-[15px] text-muted-foreground">No payout methods configured</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Payouts */}
          <Card className="rounded-2xl shadow-sm border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                    <Banknote className="size-4 text-teal-500" /> Recent Payouts
                  </CardTitle>
                  <CardDescription>{instructor.recentPayouts?.length ?? 0} payouts</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5"
                  onClick={() => handleAction('process_payout', undefined, 'Payout processing initiated')}
                  disabled={actionLoading === 'process_payout'}
                >
                  {actionLoading === 'process_payout' ? <Loader2 className="size-3.5 animate-spin" /> : <Wallet className="size-3.5" />}
                  Process Payout
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {instructor.recentPayouts && instructor.recentPayouts.length > 0 ? (
                <ScrollArea className="max-h-72">
                  <div className="space-y-0">
                    <div className="grid grid-cols-5 gap-2 py-2 px-3 text-[11px] text-muted-foreground uppercase tracking-wider border-b border-border/40">
                      <span>Date</span>
                      <span>Amount</span>
                      <span>Method</span>
                      <span>Status</span>
                      <span>Period</span>
                    </div>
                    {instructor.recentPayouts.map(payout => (
                      <div key={payout.id} className="grid grid-cols-5 gap-2 py-3 px-3 border-b border-border/20 last:border-0 items-center">
                        <span className="text-[13px]">{formatDate(payout.date)}</span>
                        <span className="text-[13px] font-medium">${formatNumber(payout.amount)}</span>
                        <span className="text-[13px] text-muted-foreground">{payout.method}</span>
                        <Badge variant="secondary" className={cn(
                          'text-[10px] rounded-lg w-fit',
                          payout.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : payout.status === 'pending'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                            : payout.status === 'failed'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-950/40 dark:text-slate-400'
                        )}>
                          {payout.status}
                        </Badge>
                        <span className="text-[12px] text-muted-foreground">{payout.period}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center py-8 gap-3">
                  <Banknote className="size-10 text-muted-foreground/30" />
                  <p className="text-[15px] text-muted-foreground">No payout history</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab 4: Students ─── */}
        <TabsContent value="students" className="space-y-4">
          {/* Total Students Count */}
          <Card className="rounded-2xl shadow-sm border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <Users className="size-7" />
                </div>
                <div>
                  <p className="text-[32px] font-bold">{instructor.performance?.totalStudents ?? 0}</p>
                  <p className="text-[14px] text-muted-foreground">Total Students Enrolled</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Students by Course */}
          <Card className="rounded-2xl shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                <BookOpen className="size-4 text-violet-500" /> Students by Course
              </CardTitle>
            </CardHeader>
            <CardContent>
              {instructor.studentsByCourse && instructor.studentsByCourse.length > 0 ? (
                <div className="space-y-3">
                  {instructor.studentsByCourse.map(item => {
                    const maxStudents = Math.max(...instructor.studentsByCourse!.map(s => s.studentCount), 1)
                    const pct = Math.round((item.studentCount / maxStudents) * 100)
                    return (
                      <div key={item.courseId} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[14px] font-medium truncate flex-1 mr-4">{item.courseTitle}</p>
                          <span className="text-[13px] font-medium shrink-0">{item.studentCount} students</span>
                        </div>
                        <Progress value={pct} className="h-2 rounded-full" />
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center py-12 gap-3">
                  <BookOpen className="size-10 text-muted-foreground/30" />
                  <p className="text-[15px] text-muted-foreground">No student data by course</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Enrollment Activity */}
          <Card className="rounded-2xl shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                <Activity className="size-4 text-teal-500" /> Recent Enrollments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {instructor.recentEnrollments && instructor.recentEnrollments.length > 0 ? (
                <ScrollArea className="max-h-72">
                  <div className="space-y-2">
                    {instructor.recentEnrollments.map(enrollment => (
                      <div key={enrollment.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30">
                        <Avatar className="size-8 rounded-lg">
                          <AvatarImage src={enrollment.studentAvatar || undefined} />
                          <AvatarFallback className="text-[10px] rounded-lg">{getInitials(enrollment.studentName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium truncate">{enrollment.studentName}</p>
                          <p className="text-[11px] text-muted-foreground truncate">enrolled in {enrollment.courseTitle}</p>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(enrollment.enrolledAt)}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center py-8 gap-3">
                  <Activity className="size-10 text-muted-foreground/30" />
                  <p className="text-[15px] text-muted-foreground">No recent enrollments</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Performing Students */}
          <Card className="rounded-2xl shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                <Award className="size-4 text-amber-500" /> Top Performing Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              {instructor.topStudents && instructor.topStudents.length > 0 ? (
                <div className="space-y-2">
                  {instructor.topStudents.map((student, index) => (
                    <div key={student.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30">
                      <div className={cn(
                        'flex size-7 items-center justify-center rounded-lg text-[12px] font-bold shrink-0',
                        index === 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                        index === 1 ? 'bg-slate-200 text-slate-700 dark:bg-slate-950/40 dark:text-slate-400' :
                        index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {index + 1}
                      </div>
                      <Avatar className="size-8 rounded-lg">
                        <AvatarImage src={student.avatar || undefined} />
                        <AvatarFallback className="text-[10px] rounded-lg">{getInitials(student.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate">{student.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{student.courseTitle}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-medium">{student.progress}%</p>
                        <p className="text-[10px] text-muted-foreground">progress</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 gap-3">
                  <Award className="size-10 text-muted-foreground/30" />
                  <p className="text-[15px] text-muted-foreground">No top student data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Tab 5: Activity Timeline ─── */}
        <TabsContent value="activity" className="space-y-4">
          <Card className="rounded-2xl shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                <Activity className="size-4 text-teal-500" /> Recent Activity
              </CardTitle>
              <CardDescription>Timeline of instructor actions and events</CardDescription>
            </CardHeader>
            <CardContent>
              {instructor.recentActivity && instructor.recentActivity.length > 0 ? (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-0">
                    {instructor.recentActivity.map((activity, i) => {
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

        {/* ─── Tab 6: Admin Actions ─── */}
        <TabsContent value="actions" className="space-y-4">
          <Card className="rounded-2xl shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-[16px] font-semibold flex items-center gap-2">
                <Shield className="size-4 text-violet-500" /> Admin Actions
              </CardTitle>
              <CardDescription>Administrative actions for this instructor account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {/* Suspend / Unsuspend */}
                {instructor.dbStatus !== 'suspended' ? (
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

                {/* Ban */}
                {instructor.dbStatus !== 'banned' ? (
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

                {/* Flag / Unflag */}
                {!instructor.flaggedReason ? (
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
                      <p className="text-[13px] font-medium">Flag Instructor</p>
                      <p className="text-[11px] text-muted-foreground">Mark for review</p>
                    </div>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/20 group"
                    onClick={() => handleAction('unflag', undefined, 'Instructor unflagged')}
                    disabled={actionLoading === 'unflag'}
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                      {actionLoading === 'unflag' ? <Loader2 className="size-4 animate-spin" /> : <FlagOff className="size-4" />}
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-medium">Unflag Instructor</p>
                      <p className="text-[11px] text-muted-foreground">Remove flag</p>
                    </div>
                  </Button>
                )}

                {/* Verify Instructor */}
                {!instructor.isVerified && (
                  <Button
                    variant="outline"
                    className="justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/20 group"
                    onClick={() => confirm({
                      title: 'Verify Instructor',
                      description: `Manually verify ${instructor.name} as a verified instructor.`,
                      confirmLabel: 'Verify',
                      onConfirm: () => handleAction('verify', undefined, 'Instructor verified'),
                    })}
                    disabled={actionLoading === 'verify'}
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                      {actionLoading === 'verify' ? <Loader2 className="size-4 animate-spin" /> : <BadgeCheck className="size-4" />}
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-medium">Verify Instructor</p>
                      <p className="text-[11px] text-muted-foreground">Manually verify account</p>
                    </div>
                  </Button>
                )}

                {/* Approve Application */}
                {ip?.applicationStatus === 'pending' && (
                  <Button
                    variant="outline"
                    className="justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/20 group"
                    onClick={() => { setReasonText(''); setApproveAppOpen(true) }}
                    disabled={actionLoading === 'approve_application'}
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                      {actionLoading === 'approve_application' ? <Loader2 className="size-4 animate-spin" /> : <ThumbsUp className="size-4" />}
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-medium">Approve Application</p>
                      <p className="text-[11px] text-muted-foreground">Accept instructor application</p>
                    </div>
                  </Button>
                )}

                {/* Reject Application */}
                {ip?.applicationStatus === 'pending' && (
                  <Button
                    variant="outline"
                    className="justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 group"
                    onClick={() => { setReasonText(''); setRejectAppOpen(true) }}
                    disabled={actionLoading === 'reject_application'}
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                      {actionLoading === 'reject_application' ? <Loader2 className="size-4 animate-spin" /> : <ThumbsDown className="size-4" />}
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-medium">Reject Application</p>
                      <p className="text-[11px] text-muted-foreground">Decline instructor application</p>
                    </div>
                  </Button>
                )}

                {/* Request More Info */}
                {(ip?.applicationStatus === 'pending' || ip?.applicationStatus === 'info_requested') && (
                  <Button
                    variant="outline"
                    className="justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-sky-50 dark:hover:bg-sky-950/20 group"
                    onClick={() => { setReasonText(''); setRequestInfoOpen(true) }}
                    disabled={actionLoading === 'request_info'}
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
                      {actionLoading === 'request_info' ? <Loader2 className="size-4 animate-spin" /> : <MessageCircleMore className="size-4" />}
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-medium">Request More Info</p>
                      <p className="text-[11px] text-muted-foreground">Ask for additional details</p>
                    </div>
                  </Button>
                )}

                {/* Adjust Commission */}
                <Button
                  variant="outline"
                  className="justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-950/20 group"
                  onClick={() => {
                    setCommissionRate(String(ip?.commissionRate ?? 80))
                    setAdjustCommissionOpen(true)
                  }}
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
                    <Percent className="size-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-medium">Adjust Commission</p>
                    <p className="text-[11px] text-muted-foreground">Current: {ip?.commissionRate ?? 80}%</p>
                  </div>
                </Button>

                {/* Adjust ShijlCoins */}
                <Button
                  variant="outline"
                  className="justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/20 group"
                  onClick={() => { setCoinAmount(''); setCoinReason(''); setAdjustCoinsOpen(true) }}
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <CircleDollarSign className="size-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-medium">Adjust ShijlCoins</p>
                    <p className="text-[11px] text-muted-foreground">Current: {formatNumber(instructor.shijlCoins)}</p>
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
                    <p className="text-[11px] text-muted-foreground">Current: {formatNumber(instructor.xp)}</p>
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

                {/* Toggle MFA */}
                <Button
                  variant="outline"
                  className="justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-cyan-50 dark:hover:bg-cyan-950/20 group"
                  onClick={() => confirm({
                    title: instructor.mfaEnabled ? 'Disable MFA' : 'Enable MFA',
                    description: instructor.mfaEnabled
                      ? `This will disable multi-factor authentication for ${instructor.name}.`
                      : `This will enable multi-factor authentication for ${instructor.name}.`,
                    confirmLabel: instructor.mfaEnabled ? 'Disable' : 'Enable',
                    variant: instructor.mfaEnabled ? 'destructive' : 'default',
                    onConfirm: () => handleAction('toggle_mfa', undefined, `MFA ${instructor.mfaEnabled ? 'disabled' : 'enabled'}`),
                  })}
                  disabled={actionLoading === 'toggle_mfa'}
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400">
                    {actionLoading === 'toggle_mfa' ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
                  </div>
                  <div className="text-left">
                    <p className="text-[13px] font-medium">Toggle MFA</p>
                    <p className="text-[11px] text-muted-foreground">Currently {instructor.mfaEnabled ? 'enabled' : 'disabled'}</p>
                  </div>
                </Button>

                {/* Clear All Sessions */}
                <Button
                  variant="outline"
                  className="justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-950/20 group"
                  onClick={() => confirm({
                    title: 'Clear All Sessions',
                    description: `This will log ${instructor.name} out of all devices.`,
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
                    <p className="text-[11px] text-muted-foreground">Log out all devices</p>
                  </div>
                </Button>

                {/* Deactivate / Reactivate */}
                {instructor.dbStatus === 'active' ? (
                  <Button
                    variant="outline"
                    className="justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-950/20 group"
                    onClick={() => { setReasonText(''); setDeactivateOpen(true) }}
                    disabled={actionLoading === 'deactivate'}
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-950/40 dark:text-slate-400">
                      {actionLoading === 'deactivate' ? <Loader2 className="size-4 animate-spin" /> : <Power className="size-4" />}
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-medium">Deactivate Account</p>
                      <p className="text-[11px] text-muted-foreground">Soft-disable the account</p>
                    </div>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/20 group"
                    onClick={() => handleAction('reactivate', undefined, 'Account reactivated')}
                    disabled={actionLoading === 'reactivate'}
                  >
                    <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                      {actionLoading === 'reactivate' ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
                    </div>
                    <div className="text-left">
                      <p className="text-[13px] font-medium">Reactivate Account</p>
                      <p className="text-[11px] text-muted-foreground">Restore deactivated account</p>
                    </div>
                  </Button>
                )}

                {/* Delete Account */}
                <Button
                  variant="outline"
                  className="justify-start gap-3 h-auto py-3 px-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-200 dark:hover:border-red-800 group"
                  onClick={() => confirm({
                    title: 'Delete Account',
                    description: `This will permanently delete ${instructor.name}'s account and all associated data. This action cannot be undone.`,
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

        {/* ─── Tab 7: Notes ─── */}
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
                  placeholder="Write an admin note about this instructor..."
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
                      await fetch(`/api/admin/instructors/${selectedInstructorId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'add_note',
                          data: { note: noteText.trim(), adminName: currentUser?.name || 'Admin' },
                        }),
                      })
                      toast.success('Note added')
                      setNoteText('')
                      fetchInstructor()
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
              <CardDescription>{instructor.adminNotes?.length ?? 0} notes</CardDescription>
            </CardHeader>
            <CardContent>
              {instructor.adminNotes && instructor.adminNotes.length > 0 ? (
                <div className="space-y-3">
                  {[...instructor.adminNotes].reverse().map((note, index) => (
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
                          onConfirm: () => handleAction('delete_note', { index: instructor.adminNotes.length - 1 - index }, 'Note deleted'),
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
            <DialogDescription>Provide a reason for suspending {instructor.name}&apos;s account.</DialogDescription>
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
            <DialogDescription>Provide a reason for banning {instructor.name}&apos;s account. This is a serious action.</DialogDescription>
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
            <DialogTitle>Flag Instructor</DialogTitle>
            <DialogDescription>Provide a reason for flagging {instructor.name} for review.</DialogDescription>
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
                handleAction('flag', { reason: reasonText.trim() }, 'Instructor flagged')
                setFlagReasonOpen(false)
              }}
            >
              {actionLoading === 'flag' ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Flag Instructor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Application Dialog */}
      <Dialog open={approveAppOpen} onOpenChange={setApproveAppOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Approve Instructor Application</DialogTitle>
            <DialogDescription>Approve {instructor.name}&apos;s instructor application.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="Optional approval note..."
              className="rounded-xl min-h-[80px] resize-none"
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setApproveAppOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
              disabled={actionLoading === 'approve_application'}
              onClick={() => {
                handleAction('approve_application', { reason: reasonText.trim() }, 'Application approved')
                setApproveAppOpen(false)
              }}
            >
              {actionLoading === 'approve_application' ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Approve Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Application Dialog */}
      <Dialog open={rejectAppOpen} onOpenChange={setRejectAppOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reject Instructor Application</DialogTitle>
            <DialogDescription>Reject {instructor.name}&apos;s instructor application. Please provide a reason.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="Reason for rejection..."
              className="rounded-xl min-h-[80px] resize-none"
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setRejectAppOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl bg-red-600 hover:bg-red-700"
              disabled={!reasonText.trim() || actionLoading === 'reject_application'}
              onClick={() => {
                handleAction('reject_application', { reason: reasonText.trim() }, 'Application rejected')
                setRejectAppOpen(false)
              }}
            >
              {actionLoading === 'reject_application' ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request More Info Dialog */}
      <Dialog open={requestInfoOpen} onOpenChange={setRequestInfoOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Request More Information</DialogTitle>
            <DialogDescription>Request additional information from {instructor.name} for their application.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="What information do you need..."
              className="rounded-xl min-h-[80px] resize-none"
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setRequestInfoOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl bg-sky-600 hover:bg-sky-700"
              disabled={!reasonText.trim() || actionLoading === 'request_info'}
              onClick={() => {
                handleAction('request_info', { reason: reasonText.trim() }, 'Info requested')
                setRequestInfoOpen(false)
              }}
            >
              {actionLoading === 'request_info' ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Request Info
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Commission Dialog */}
      <Dialog open={adjustCommissionOpen} onOpenChange={setAdjustCommissionOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Adjust Commission Rate</DialogTitle>
            <DialogDescription>Current rate: {ip?.commissionRate ?? 80}%. Default rate: 80%. Set the instructor&apos;s revenue share percentage.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[13px]">Commission Rate (%)</Label>
              <Input
                type="number"
                placeholder="e.g., 85"
                min={0}
                max={100}
                className="rounded-xl"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setAdjustCommissionOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl"
              disabled={!commissionRate || actionLoading === 'adjust_commission'}
              onClick={() => {
                handleAction('adjust_commission', { rate: parseInt(commissionRate) }, `Commission rate set to ${commissionRate}%`)
                setAdjustCommissionOpen(false)
              }}
            >
              {actionLoading === 'adjust_commission' ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Update Commission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Account Dialog */}
      <Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Deactivate Account</DialogTitle>
            <DialogDescription>Deactivate {instructor.name}&apos;s account. The account can be reactivated later.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="Reason for deactivation..."
              className="rounded-xl min-h-[80px] resize-none"
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDeactivateOpen(false)}>Cancel</Button>
            <Button
              className="rounded-xl"
              disabled={!reasonText.trim() || actionLoading === 'deactivate'}
              onClick={() => {
                handleAction('deactivate', { reason: reasonText.trim() }, 'Account deactivated')
                setDeactivateOpen(false)
              }}
            >
              {actionLoading === 'deactivate' ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Deactivate Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Coins Dialog */}
      <Dialog open={adjustCoinsOpen} onOpenChange={setAdjustCoinsOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Adjust Shijl Coins</DialogTitle>
            <DialogDescription>Current balance: {formatNumber(instructor.shijlCoins)} coins. Use negative numbers to deduct.</DialogDescription>
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
            <DialogDescription>Current XP: {formatNumber(instructor.xp)}. Use negative numbers to deduct.</DialogDescription>
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

      {/* Reset Password Dialog */}
      <Dialog open={resetPwOpen} onOpenChange={setResetPwOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              {tempPassword
                ? 'A temporary password has been generated. Share it securely with the instructor.'
                : `Generate a new temporary password for ${instructor.name}.`}
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
            <DialogDescription>Update {instructor.name}&apos;s profile information.</DialogDescription>
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

      {/* Send Notification Dialog (from header) */}
      <Dialog open={sendNotifOpen} onOpenChange={setSendNotifOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>Send a notification to {instructor.name}</DialogDescription>
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
                  await fetch(`/api/admin/instructors/${selectedInstructorId}`, {
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
                  fetchInstructor()
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
