'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  Loader2, TrendingUp, TrendingDown, Users, BookOpen, DollarSign,
  UserPlus, GraduationCap, Star, AlertTriangle, ArrowRight,
  RefreshCw, Database, Activity, Shield, Server, Megaphone,
  Wrench, Download, Search, Flag, Wallet, Info, Sparkles,
  Heart, Gamepad2, Settings, Trash2, Eye, Radio, CheckCircle2,
  Zap, Clock, Bell, Award, Brain, Target, Flame, BarChart3,
  AlertCircle, FileCheck, Timer, Trophy, ExternalLink,
  MessageSquare, GitBranch,
} from 'lucide-react'
import { ShijlAIBrand, ShijlAIText } from '@/components/ui/brand-text'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Area, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  ComposedChart,
} from 'recharts'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { AdminStatCard } from './admin-stat-card'

// ─── Types ─────────────────────────────────────────────────────

interface PlatformHealth {
  totalUsers: number; totalUsersChange: number; totalStudents: number
  activeToday: number; activeTodayChange: number; totalCourses: number
  publishedCourses: number; grossRevenue: number; grossRevenueChange: number
  newSignups: number; newSignupsChange: number; enrollments: number
  enrollmentsChange: number; completionRate: number; completionRateChange: number
  avgRating: number; totalReviews: number
  totalCertificates: number; pendingReviews: number; activeSubscriptions: number; churnRate: number
}

interface RevenueChartItem { month: string; revenue: number; enrollments: number }
interface UrgentItem { id: string; label: string; action: string; view: string; count: number; severity?: string }

interface PlatformPulse {
  usersOnline: number; watchingLesson: number; takingQuiz: number
  inLiveSession: number; usingAITutor: number; activeLiveSessions: number
  serverStatus: 'operational' | 'degraded' | 'down'; apiLatency: number
}

interface TopCourse { id: string; title: string; category?: string; instructorName?: string; students: number; rating: number; revenue: number; completionRate: number }
interface ActivityItem { id: string; icon: string; type: string; title: string; description?: string; userName?: string; timeAgo: string }

interface TopInstructor { id: string; name: string; avatar?: string; courseCount: number; totalStudents: number; rating: number; revenue: number }
interface EnrollmentTrendItem { date: string; enrollments: number; revenue: number }

interface EngagementMetrics {
  avgSessionDuration: number; avgLessonsPerDay: number; quizPassRate: number
  avgQuizScore: number; activeStreaks: number; certificatesIssued: number; certificatesThisMonth: number
}

interface AIUsageStats {
  totalTutorSessions: number; tutorSessionsThisMonth: number
  totalAIGenerations: number; aiGenerationsThisMonth: number; totalChatMessages: number
}

interface SystemAlert { id: string; type: 'warning' | 'error' | 'info' | 'critical'; message: string; time: string; resolved: boolean }
interface InstructorAppItem { id: string; name: string; email: string; appliedAt: string; status: string }

interface DashboardData {
  period: number; platformHealth: PlatformHealth; revenueChart: RevenueChartItem[]
  platformCut: number; instructorPayouts: number; urgentItems: UrgentItem[]
  platformPulse: PlatformPulse; topPerformingCourses: TopCourse[]; recentActivity: ActivityItem[]
  userDistribution: { students: number; instructors: number; admins: number; parents: number }
  categoryDistribution: { category: string; courses: number; enrollments: number }[]
  recentSignups: { id: string; name: string; email: string; role: string; avatar?: string; date: string }[]
  dailyActivity: { date: string; activeUsers: number; xpEarned: number; lessonsCompleted: number; quizzesTaken: number }[]
  contentModeration: { pendingReviews: number; reportedContent: number; flaggedUsers: number }
  revenueBreakdown: { source: string; amount: number }[]
  instructorApplications: number
  systemHealth: { uptimeSeconds: number; dbQueryTimeMs: number; status: string }
  // Enhanced fields
  topInstructors: TopInstructor[]
  enrollmentTrends: EnrollmentTrendItem[]
  engagementMetrics: EngagementMetrics
  aiUsageStats: AIUsageStats
  userGrowthChart: { month: string; users: number; students: number; instructors: number }[]
  systemAlerts: SystemAlert[]
  instructorApplicationsList: InstructorAppItem[]
}

interface FeatureFlag {
  id: string; name: string; key: string; description: string
  enabled: boolean; rollout: number; category: string
}

interface Announcement {
  id: string; title: string; message: string
  type: 'info' | 'warning' | 'success' | 'critical'
  target: 'all' | 'students' | 'instructors' | 'admins'
  createdAt: string; expiresAt?: string; active: boolean
}

// ─── Format Helpers ────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`
  return n.toLocaleString()
}

function formatUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  return `${days}d ${hours}h`
}

function formatShortDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch { return dateStr }
}

// ─── Hooks ─────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1200, inView = true) {
  const [count, setCount] = useState(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!inView || hasAnimated.current) return
    hasAnimated.current = true
    const start = performance.now()
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [target, duration, inView])

  return count
}

function useInViewState(ref: React.RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [ref])
  return inView
}

// ─── KPICard ───────────────────────────────────────────────────

const KPI_THEMES = [
  { border: 'border-l-blue-500', iconBg: 'bg-gradient-to-br from-blue-400 to-blue-600' },
  { border: 'border-l-emerald-500', iconBg: 'bg-gradient-to-br from-emerald-400 to-emerald-600' },
  { border: 'border-l-violet-500', iconBg: 'bg-gradient-to-br from-violet-400 to-violet-600' },
  { border: 'border-l-amber-500', iconBg: 'bg-gradient-to-br from-amber-400 to-amber-600' },
  { border: 'border-l-teal-500', iconBg: 'bg-gradient-to-br from-teal-400 to-teal-600' },
  { border: 'border-l-pink-500', iconBg: 'bg-gradient-to-br from-pink-400 to-pink-600' },
  { border: 'border-l-cyan-500', iconBg: 'bg-gradient-to-br from-cyan-400 to-cyan-600' },
  { border: 'border-l-yellow-500', iconBg: 'bg-gradient-to-br from-yellow-400 to-yellow-600' },
  { border: 'border-l-rose-500', iconBg: 'bg-gradient-to-br from-rose-400 to-rose-600' },
  { border: 'border-l-orange-500', iconBg: 'bg-gradient-to-br from-orange-400 to-orange-600' },
  { border: 'border-l-indigo-500', iconBg: 'bg-gradient-to-br from-indigo-400 to-indigo-600' },
  { border: 'border-l-lime-500', iconBg: 'bg-gradient-to-br from-lime-400 to-lime-600' },
] as const

function KPICard({ label, value, numericValue, subValue, change, icon, themeIndex = 0, delay = 0 }: {
  label: string; value: string; numericValue?: number; subValue?: string
  change?: number; icon: React.ReactNode; themeIndex?: number; delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInViewState(ref)
  const theme = KPI_THEMES[themeIndex % KPI_THEMES.length]
  const isPositive = change !== undefined && change >= 0
  const target = numericValue ?? 0
  const animated = useCountUp(target, 1400, inView)

  const displayValue = target > 0 && inView
    ? value.includes('$') ? `$${animated.toLocaleString()}`
      : value.includes('%') ? `${animated}%`
        : value.includes('/ 5') ? `${(animated / 10).toFixed(1)} / 5`
          : formatNumber(animated)
    : value

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.025, y: -2 }}
      className={cn(
        'rounded-2xl border border-border/50 bg-card p-4 border-l-4 transition-shadow duration-200',
        theme.border, 'hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 cursor-default'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-muted-foreground truncate">{label}</p>
          <p className="mt-1 text-[20px] font-extrabold text-foreground tracking-tight">{displayValue}</p>
          {subValue && <p className="mt-0.5 text-[10px] text-muted-foreground">{subValue}</p>}
        </div>
        <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl shadow-sm', theme.iconBg)}>
          <div className="text-white text-[14px]">{icon}</div>
        </div>
      </div>
      {change !== undefined && (
        <div className="mt-2 flex items-center gap-1.5">
          {isPositive ? (
            <div className="flex items-center gap-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5">
              <TrendingUp className="size-2.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">↑{Math.abs(change)}%</span>
            </div>
          ) : (
            <div className="flex items-center gap-0.5 rounded-full bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5">
              <TrendingDown className="size-2.5 text-red-500" />
              <span className="text-[10px] font-semibold text-red-500">↓{Math.abs(change)}%</span>
            </div>
          )}
          <span className="text-[10px] text-muted-foreground">vs prev period</span>
        </div>
      )}
    </motion.div>
  )
}

// ─── QuickActionsBar ───────────────────────────────────────────

function QuickActionsBar({ onNavigate, onSendAnnouncement, onToggleMaintenance, onClearCache, onProcessPayouts, onExportReport, maintenanceLoading }: {
  onNavigate: (view: string) => void; onSendAnnouncement: () => void
  onToggleMaintenance: () => void; onClearCache: () => void
  onProcessPayouts: () => void; onExportReport: () => void; maintenanceLoading: boolean
}) {
  const [cacheLoading, setCacheLoading] = useState(false)
  const [payoutLoading, setPayoutLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  const wrap = (fn: () => Promise<void>, setter: (v: boolean) => void) => async () => {
    setter(true); await fn(); setter(false)
  }

  const actions = [
    { label: 'Send Announcement', icon: Megaphone, gradient: 'from-amber-500 to-orange-600', action: onSendAnnouncement, loading: false },
    { label: 'Toggle Maintenance', icon: Wrench, gradient: 'from-red-500 to-rose-600', action: onToggleMaintenance, loading: maintenanceLoading },
    { label: 'Clear Cache', icon: RefreshCw, gradient: 'from-teal-500 to-cyan-600', action: wrap(onClearCache, setCacheLoading), loading: cacheLoading },
    { label: 'Process Payouts', icon: Wallet, gradient: 'from-emerald-500 to-green-600', action: wrap(onProcessPayouts, setPayoutLoading), loading: payoutLoading },
    { label: 'Add User', icon: UserPlus, gradient: 'from-blue-500 to-blue-600', action: () => onNavigate('admin-users'), loading: false },
    { label: 'Export Report', icon: Download, gradient: 'from-violet-500 to-purple-600', action: wrap(onExportReport, setExportLoading), loading: exportLoading },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a, idx) => (
        <motion.button
          key={a.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.06 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={a.action}
          disabled={a.loading}
          className={cn(
            'flex items-center gap-2 rounded-xl px-3.5 py-2 text-white shadow-md bg-gradient-to-r',
            'hover:shadow-lg hover:shadow-black/10 dark:hover:shadow-black/25',
            'disabled:opacity-70 disabled:cursor-not-allowed transition-shadow duration-200', a.gradient
          )}
        >
          {a.loading ? <Loader2 className="size-3.5 shrink-0 animate-spin" /> : <a.icon className="size-3.5 shrink-0" />}
          <span className="text-[12px] font-semibold whitespace-nowrap">{a.label}</span>
        </motion.button>
      ))}
    </div>
  )
}

// ─── SystemStatusWidget ────────────────────────────────────────

function SystemStatusWidget({ pulse, systemHealth }: { pulse: PlatformPulse; systemHealth: DashboardData['systemHealth'] }) {
  const dbStatus = pulse.serverStatus === 'operational' ? 'Healthy' : 'Degraded'
  const apiLatency = systemHealth.dbQueryTimeMs

  const items = [
    { icon: <Server className="size-3.5" />, label: 'Uptime', value: formatUptime(systemHealth.uptimeSeconds), statusColor: 'text-emerald-600 dark:text-emerald-400', dotColor: 'bg-emerald-500', pulse: true },
    { icon: <Database className="size-3.5" />, label: 'Database', value: dbStatus, statusColor: pulse.serverStatus === 'operational' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400', dotColor: pulse.serverStatus === 'operational' ? 'bg-emerald-500' : 'bg-amber-500', pulse: pulse.serverStatus === 'operational' },
    { icon: <Zap className="size-3.5" />, label: 'API', value: `${apiLatency}ms`, statusColor: apiLatency < 150 ? 'text-emerald-600 dark:text-emerald-400' : apiLatency < 300 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500', dotColor: apiLatency < 150 ? 'bg-emerald-500' : apiLatency < 300 ? 'bg-amber-500' : 'bg-red-500', pulse: false },
    { icon: <Users className="size-3.5" />, label: 'Online', value: formatNumber(pulse.usersOnline), statusColor: 'text-blue-600 dark:text-blue-400', dotColor: 'bg-blue-500', pulse: true },
  ]

  return (
    <Card className="rounded-2xl border-border/50">
      <CardContent className="p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {items.map((item, idx) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
              className="flex items-center gap-2.5 rounded-xl bg-muted/30 p-3">
              <div className="relative flex items-center justify-center">
                <div className="flex size-8 items-center justify-center rounded-lg bg-background shadow-sm">
                  <div className="text-muted-foreground">{item.icon}</div>
                </div>
                {item.pulse && (
                  <span className="absolute -top-0.5 -right-0.5 flex size-2">
                    <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', item.dotColor)} />
                    <span className={cn('relative inline-flex rounded-full size-2', item.dotColor)} />
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground truncate">{item.label}</p>
                <p className={cn('text-[13px] font-bold', item.statusColor)}>{item.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── EnhancedActivityFeed ──────────────────────────────────────

const ACTIVITY_STYLES: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  enrollment: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950/30', icon: <GraduationCap className="size-3.5" /> },
  course: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950/30', icon: <BookOpen className="size-3.5" /> },
  payment: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/30', icon: <DollarSign className="size-3.5" /> },
  review: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-950/30', icon: <Star className="size-3.5" /> },
  security: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-950/30', icon: <Shield className="size-3.5" /> },
  user: { color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-100 dark:bg-violet-950/30', icon: <UserPlus className="size-3.5" /> },
  default: { color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-950/30', icon: <Activity className="size-3.5" /> },
}

function getActivityStyle(type: string) {
  const lower = type.toLowerCase()
  for (const key of Object.keys(ACTIVITY_STYLES)) { if (lower.includes(key)) return ACTIVITY_STYLES[key] }
  return ACTIVITY_STYLES.default
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

const AVATAR_GRADIENTS = ['from-blue-400 to-cyan-400', 'from-emerald-400 to-teal-400', 'from-violet-400 to-purple-400', 'from-amber-400 to-orange-400', 'from-pink-400 to-rose-400', 'from-cyan-400 to-sky-400']

function EnhancedActivityFeed({ activities, onViewAll }: { activities: ActivityItem[]; onViewAll: () => void }) {
  return (
    <Card className="rounded-2xl border-border/50 overflow-hidden">
      <CardHeader className="pb-2 px-5 pt-4">
        <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
          <Activity className="size-4 text-muted-foreground" /> Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-80 overflow-y-auto custom-scrollbar">
          <ul>
            {activities.map((item, idx) => {
              const style = getActivityStyle(item.type)
              return (
                <motion.li key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
                  className="flex items-center gap-2.5 px-5 py-3 hover:bg-muted/20 transition-colors">
                  <div className={cn('flex size-7 shrink-0 items-center justify-center rounded-full', style.bg)}>
                    <div className={style.color}>{style.icon}</div>
                  </div>
                  <div className={cn('flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white text-[10px] font-bold', AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length])}>
                    {getInitials(item.userName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-foreground leading-snug">
                      {item.userName && <span className="font-semibold">{item.userName}</span>}{' '}
                      <span className="text-muted-foreground">{item.title}</span>
                    </p>
                    {item.description && <p className="text-[10px] text-muted-foreground/70 truncate mt-0.5">{item.description}</p>}
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 shrink-0 whitespace-nowrap">{item.timeAgo}</span>
                </motion.li>
              )
            })}
          </ul>
        </div>
        {activities.length > 0 && (
          <div className="px-5 py-2.5 border-t border-border/30">
            <Button variant="ghost" size="sm" className="w-full h-8 gap-2 text-[12px] text-blue-600 dark:text-blue-400 rounded-xl" onClick={onViewAll}>
              View full activity log <ArrowRight className="size-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── FeatureFlagsSection ───────────────────────────────────────

const FLAG_CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  general: { label: 'General', icon: <Settings className="size-4" />, color: 'text-slate-600 dark:text-slate-400' },
  ai: { label: 'AI Features', icon: <Sparkles className="size-4" />, color: 'text-amber-600 dark:text-amber-400' },
  community: { label: 'Community', icon: <Heart className="size-4" />, color: 'text-pink-600 dark:text-pink-400' },
  gamification: { label: 'Gamification', icon: <Gamepad2 className="size-4" />, color: 'text-violet-600 dark:text-violet-400' },
  finance: { label: 'Finance', icon: <Wallet className="size-4" />, color: 'text-emerald-600 dark:text-emerald-400' },
  security: { label: 'Security', icon: <Shield className="size-4" />, color: 'text-red-600 dark:text-red-400' },
}

function FeatureFlagsSection({ flags: initialFlags }: { flags: FeatureFlag[] }) {
  const [flags, setFlags] = useState<FeatureFlag[]>(initialFlags)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => { setFlags(initialFlags) }, [initialFlags])

  const categories = ['all', ...Array.from(new Set(flags.map(f => f.category)))]
  const filtered = flags.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) || f.description.toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'all' || f.category === activeCategory
    return matchSearch && matchCat
  })

  const grouped = categories.filter(c => c !== 'all').reduce((acc, cat) => {
    acc[cat] = filtered.filter(f => f.category === cat)
    return acc
  }, {} as Record<string, FeatureFlag[]>)

  const handleToggle = async (flag: FeatureFlag) => {
    const newEnabled = !flag.enabled
    setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, enabled: newEnabled } : f))
    setUpdatingId(flag.id)
    try {
      const res = await fetch('/api/admin/feature-flags', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: flag.id, enabled: newEnabled }) })
      if (!res.ok) throw new Error()
      toast.success(`${flag.name} ${newEnabled ? 'enabled' : 'disabled'}`)
    } catch {
      setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, enabled: flag.enabled } : f))
      toast.error(`Failed to update ${flag.name}`)
    } finally { setUpdatingId(null) }
  }

  const handleRolloutChange = async (flag: FeatureFlag, rollout: number) => {
    setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, rollout } : f))
    try {
      const res = await fetch('/api/admin/feature-flags', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: flag.id, rollout }) })
      if (!res.ok) throw new Error()
      toast.success(`${flag.name} rollout set to ${rollout}%`)
    } catch {
      setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, rollout: flag.rollout } : f))
      toast.error(`Failed to update rollout for ${flag.name}`)
    }
  }

  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-[16px] font-semibold">Feature Flags</CardTitle>
            <p className="text-[12px] text-muted-foreground mt-0.5">Control platform features and rollout percentage</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input placeholder="Search flags..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-8 w-[200px] rounded-lg text-[13px]" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={cn('px-3 py-1 rounded-full text-[12px] font-medium transition-colors', activeCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted')}>
              {cat === 'all' ? 'All' : FLAG_CATEGORY_META[cat]?.label || cat}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {(activeCategory === 'all' ? Object.entries(grouped) : [[activeCategory, filtered] as [string, FeatureFlag[]]])
            .filter(([, items]) => items && items.length > 0)
            .map(([category, items]) => (
              <div key={category}>
                {activeCategory === 'all' && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className={FLAG_CATEGORY_META[category]?.color || 'text-slate-500'}>{FLAG_CATEGORY_META[category]?.icon || <Flag className="size-4" />}</div>
                    <span className="text-[13px] font-semibold text-foreground">{FLAG_CATEGORY_META[category]?.label || category}</span>
                    <Separator className="flex-1" />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items?.map((flag, idx) => (
                    <motion.div key={flag.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                      className={cn('rounded-xl border p-4 transition-colors', flag.enabled ? 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/10' : 'border-border/40 bg-muted/20')}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-semibold text-foreground truncate">{flag.name}</p>
                            {updatingId === flag.id && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{flag.description}</p>
                        </div>
                        <Switch checked={flag.enabled} onCheckedChange={() => handleToggle(flag)} disabled={updatingId === flag.id} />
                      </div>
                      {flag.enabled && (
                        <div className="mt-3 pt-3 border-t border-border/30">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] text-muted-foreground">Rollout</span>
                            <span className="text-[11px] font-semibold text-foreground">{flag.rollout}%</span>
                          </div>
                          <Slider value={[flag.rollout]} min={0} max={100} step={5}
                            onValueChange={([val]) => setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, rollout: val } : f))}
                            onValueCommit={([val]) => handleRolloutChange(flag, val)} className="w-full" />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          {filtered.length === 0 && <div className="text-center py-8 text-muted-foreground text-[13px]">No feature flags found</div>}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── AnnouncementsManager ──────────────────────────────────────

const ANNOUNCEMENT_TYPE_COLORS: Record<string, string> = {
  info: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  critical: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
}

function AnnouncementsManager({ announcements: initial, onCreate, onDelete }: {
  announcements: Announcement[]; onCreate: (data: { title: string; message: string; type: string; target: string }) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initial)
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('info')
  const [target, setTarget] = useState('all')
  const [creating, setCreating] = useState(false)

  useEffect(() => { setAnnouncements(initial) }, [initial])

  const handleCreate = async () => {
    if (!title.trim() || !message.trim()) { toast.error('Title and message are required'); return }
    setCreating(true)
    try {
      await onCreate({ title, message, type, target })
      setTitle(''); setMessage(''); setType('info'); setTarget('all'); setShowCreate(false)
    } finally { setCreating(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id)
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, active: false } : a))
    } catch { /* error handled by parent */ }
  }

  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-[16px] font-semibold">Announcements</CardTitle>
            <p className="text-[12px] text-muted-foreground mt-0.5">Manage platform-wide announcements</p>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)} className="gap-2 rounded-xl">
            <Megaphone className="size-3.5" /> New
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar">
          {announcements.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-[13px]">No announcements yet</div>
          )}
          {announcements.map((a, idx) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
              className={cn('rounded-xl border p-3 transition-colors', a.active ? 'border-border/50 bg-card' : 'border-border/30 bg-muted/20 opacity-60')}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold', ANNOUNCEMENT_TYPE_COLORS[a.type])}>{a.type}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</span>
                    {!a.active && <Badge variant="outline" className="text-[9px] h-4">Inactive</Badge>}
                  </div>
                  <p className="text-[12px] font-semibold text-foreground">{a.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{a.message}</p>
                </div>
                {a.active && (
                  <Button variant="ghost" size="sm" className="shrink-0 h-7 w-7 p-0 text-muted-foreground hover:text-red-500" onClick={() => handleDelete(a.id)}>
                    <Trash2 className="size-3" />
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
              <DialogDescription>Send a platform-wide announcement to users</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[13px]">Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title" className="rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px]">Message</Label>
                <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Announcement message" rows={3} className="rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-[13px]">Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px]">Target</Label>
                  <Select value={target} onValueChange={setTarget}>
                    <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="students">Students</SelectItem>
                      <SelectItem value="instructors">Instructors</SelectItem>
                      <SelectItem value="admins">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-lg">Cancel</Button>
              <Button onClick={handleCreate} disabled={creating} className="rounded-lg gap-2">
                {creating ? <Loader2 className="size-3.5 animate-spin" /> : <Megaphone className="size-3.5" />} Send
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

// ─── Revenue Chart Tooltip ─────────────────────────────────────

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const enrollments = payload.find((p: any) => p.dataKey === 'enrollments')
  return (
    <div className="rounded-xl border border-border/50 bg-card px-4 py-3 shadow-xl shadow-black/10 dark:shadow-black/25">
      <p className="text-[12px] font-medium text-muted-foreground mb-1">{label}</p>
      <p className="text-[15px] font-bold text-foreground">{formatUSD(payload[0].value)}</p>
      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">Revenue</p>
      {enrollments && <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5">{enrollments.value} enrollments</p>}
    </div>
  )
}

// ─── Alert Badge Colors ────────────────────────────────────────

const ALERT_STYLES: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  critical: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-950/30', icon: <AlertCircle className="size-3.5" /> },
  error: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-950/30', icon: <AlertCircle className="size-3.5" /> },
  warning: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/30', icon: <AlertTriangle className="size-3.5" /> },
  info: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950/30', icon: <Info className="size-3.5" /> },
}

// ─── Main Component ────────────────────────────────────────────

export function AdminDashboardV2() {
  const { setCurrentView } = useAppStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [maintenanceLoading, setMaintenanceLoading] = useState(false)
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  // Fetch main dashboard data
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/dashboard?period=30')
      if (!res.ok) throw new Error('Failed to fetch dashboard data')
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch feature flags
  const fetchFlags = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/feature-flags')
      if (res.ok) { const json = await res.json(); setFeatureFlags(json.flags || []) }
    } catch { /* non-critical */ }
  }, [])

  // Fetch announcements
  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/announcements')
      if (res.ok) { const json = await res.json(); setAnnouncements(json.announcements || []) }
    } catch { /* non-critical */ }
  }, [])

  // Initial load + auto-refresh every 60s
  useEffect(() => {
    fetchData()
    fetchFlags()
    fetchAnnouncements()
    const interval = setInterval(fetchData, 60_000)
    return () => clearInterval(interval)
  }, [fetchData, fetchFlags, fetchAnnouncements])

  // ─── Action Handlers ────────────────────────────────────────

  const postAction = async (action: string) => {
    const res = await fetch('/api/admin/dashboard/actions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }),
    })
    const json = await res.json()
    if (!res.ok || !json.success) throw new Error(json.error || json.message || 'Action failed')
    return json
  }

  const handleToggleMaintenance = async () => {
    setMaintenanceLoading(true)
    try {
      const result = await postAction('toggle_maintenance')
      toast.success(result.message || 'Maintenance mode toggled')
      fetchData()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to toggle maintenance') }
    finally { setMaintenanceLoading(false) }
  }

  const handleClearCache = async () => {
    try { const result = await postAction('clear_cache'); toast.success(result.message || 'Cache cleared') }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to clear cache') }
  }

  const handleProcessPayouts = async () => {
    try { const result = await postAction('process_payouts'); toast.success(result.message || 'Payouts processed') }
    catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to process payouts') }
  }

  const handleExportReport = async () => {
    try {
      const res = await fetch('/api/admin/export-report', { method: 'POST' })
      if (!res.ok) throw new Error('Export failed')
      toast.success('Report exported successfully')
    } catch { toast.error('Failed to export report') }
  }

  const handleSendAnnouncement = () => {
    const announcementsTab = document.querySelector('[data-value="system"]') as HTMLElement
    announcementsTab?.click()
  }

  const handleCreateAnnouncement = async (annData: { title: string; message: string; type: string; target: string }) => {
    const res = await fetch('/api/admin/announcements', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(annData),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to create announcement')
    toast.success('Announcement sent successfully')
    fetchAnnouncements()
  }

  const handleDeleteAnnouncement = async (id: string) => {
    const res = await fetch('/api/admin/announcements', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Failed to delete announcement')
    toast.success('Announcement deactivated')
    fetchAnnouncements()
  }

  // ─── Loading / Error States ─────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-[14px] text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="size-10 text-amber-500" />
          <p className="text-[14px] text-muted-foreground">{error || 'Failed to load dashboard data'}</p>
          <Button onClick={fetchData} variant="outline" className="gap-2 rounded-xl">
            <RefreshCw className="size-4" /> Retry
          </Button>
        </div>
      </div>
    )
  }

  const { platformHealth: h, platformPulse: pulse, engagementMetrics: eng, aiUsageStats: ai } = data

  // ─── KPI Cards Config (12 cards) ────────────────────────────

  const kpiCards = [
    { label: 'Total Users', value: formatNumber(h.totalUsers), numericValue: h.totalUsers, change: h.totalUsersChange, icon: <Users className="size-4" />, themeIndex: 0, subValue: `${h.totalStudents} students` },
    { label: 'Gross Revenue', value: formatUSD(h.grossRevenue), numericValue: h.grossRevenue, change: h.grossRevenueChange, icon: <DollarSign className="size-4" />, themeIndex: 3 },
    { label: 'Active Today', value: formatNumber(h.activeToday), numericValue: h.activeToday, change: h.activeTodayChange, icon: <Eye className="size-4" />, themeIndex: 4 },
    { label: 'New Signups', value: formatNumber(h.newSignups), numericValue: h.newSignups, change: h.newSignupsChange, icon: <UserPlus className="size-4" />, themeIndex: 5 },
    { label: 'Enrollments', value: formatNumber(h.enrollments), numericValue: h.enrollments, change: h.enrollmentsChange, icon: <GraduationCap className="size-4" />, themeIndex: 2 },
    { label: 'Total Courses', value: formatNumber(h.totalCourses), numericValue: h.totalCourses, icon: <BookOpen className="size-4" />, themeIndex: 1, subValue: `${h.publishedCourses} published` },
    { label: 'Completion Rate', value: `${h.completionRate}%`, numericValue: h.completionRate, change: h.completionRateChange, icon: <CheckCircle2 className="size-4" />, themeIndex: 6 },
    { label: 'Avg Rating', value: `${h.avgRating} / 5`, numericValue: Math.round(h.avgRating * 10), icon: <Star className="size-4" />, themeIndex: 7, subValue: `${h.totalReviews} reviews` },
    { label: 'Certificates', value: formatNumber(h.totalCertificates), numericValue: h.totalCertificates, icon: <Award className="size-4" />, themeIndex: 8, subValue: `${eng.certificatesThisMonth} this month` },
    { label: 'Active Subs', value: formatNumber(h.activeSubscriptions), numericValue: h.activeSubscriptions, icon: <GitBranch className="size-4" />, themeIndex: 9 },
    { label: 'Churn Rate', value: `${h.churnRate}%`, numericValue: Math.round(h.churnRate * 10), icon: <TrendingDown className="size-4" />, themeIndex: 10 },
    { label: 'Pending Reviews', value: formatNumber(h.pendingReviews), numericValue: h.pendingReviews, icon: <Clock className="size-4" />, themeIndex: 11 },
  ]

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5"><ShijlAIBrand variant="compact" /> — Enterprise platform overview &amp; controls</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[11px] gap-1.5 h-7 rounded-lg">
            <span className={cn('size-1.5 rounded-full', pulse.serverStatus === 'operational' ? 'bg-emerald-500' : 'bg-amber-500')} />
            {pulse.serverStatus === 'operational' ? 'All Systems Operational' : 'System Degraded'}
          </Badge>
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-2 rounded-xl h-7 text-[12px]">
            <RefreshCw className="size-3" /> Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
          <TabsTrigger value="system" data-value="system" className="rounded-lg">System</TabsTrigger>
        </TabsList>

        {/* ═══ OVERVIEW TAB ═══════════════════════════════════ */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards - 3 rows of 4 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {kpiCards.map((card, idx) => (
              <KPICard key={card.label} {...card} delay={idx * 0.04} />
            ))}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-[13px] font-semibold text-muted-foreground mb-2">Quick Actions</h2>
            <QuickActionsBar
              onNavigate={setCurrentView}
              onSendAnnouncement={handleSendAnnouncement}
              onToggleMaintenance={handleToggleMaintenance}
              onClearCache={handleClearCache}
              onProcessPayouts={handleProcessPayouts}
              onExportReport={handleExportReport}
              maintenanceLoading={maintenanceLoading}
            />
          </div>

          {/* System Health */}
          <SystemStatusWidget pulse={pulse} systemHealth={data.systemHealth} />

          {/* Revenue Chart + Platform Pulse + Engagement Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Chart */}
            <Card className="lg:col-span-2 rounded-2xl border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-[14px] font-semibold">Revenue &amp; Enrollments — Last 6 Months</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.revenueChart} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <YAxis yAxisId="revenue" tickFormatter={v => formatUSD(v)} tick={{ fontSize: 10 }} className="text-muted-foreground" width={70} />
                      <YAxis yAxisId="enrollments" orientation="right" tick={{ fontSize: 10 }} className="text-muted-foreground" width={40} />
                      <RechartsTooltip content={<RevenueTooltip />} />
                      <Area yAxisId="revenue" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revenueGrad)" />
                      <Bar yAxisId="enrollments" dataKey="enrollments" fill="#06b6d4" opacity={0.4} radius={[2, 2, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Platform Pulse + Engagement */}
            <div className="space-y-4">
              <Card className="rounded-2xl border-border/50">
                <CardHeader className="pb-1 px-4 pt-3">
                  <CardTitle className="text-[13px] font-semibold flex items-center gap-2">
                    <Radio className="size-3.5 text-emerald-500" /> Platform Pulse
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="space-y-2.5">
                    {[
                      { icon: <Users className="size-3.5 text-emerald-500" />, key: 'users-online', label: 'Users Online' as React.ReactNode, value: formatNumber(pulse.usersOnline) },
                      { icon: <Eye className="size-3.5 text-blue-500" />, key: 'watching-lesson', label: 'Watching Lesson' as React.ReactNode, value: formatNumber(pulse.watchingLesson) },
                      { icon: <BookOpen className="size-3.5 text-violet-500" />, key: 'taking-quiz', label: 'Taking Quiz' as React.ReactNode, value: formatNumber(pulse.takingQuiz) },
                      { icon: <Radio className="size-3.5 text-amber-500" />, key: 'live-sessions', label: 'Live Sessions' as React.ReactNode, value: formatNumber(pulse.activeLiveSessions) },
                      { icon: <Sparkles className="size-3.5 text-pink-500" />, key: 'ask-shijlai', label: <>Ask <ShijlAIText /></>, value: formatNumber(pulse.usingAITutor) },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {item.icon}
                          <span className="text-[12px] text-muted-foreground">{item.label}</span>
                        </div>
                        <span className="text-[14px] font-bold text-foreground">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl border-border/50">
                <CardHeader className="pb-1 px-4 pt-3">
                  <CardTitle className="text-[13px] font-semibold flex items-center gap-2">
                    <Target className="size-3.5 text-violet-500" /> Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="grid grid-cols-2 gap-2">
                    <AdminStatCard icon={Timer} label="Avg Session" value={`${eng.avgSessionDuration}m`} color="blue" />
                    <AdminStatCard icon={BookOpen} label="Lessons/Day" value={`${eng.avgLessonsPerDay}`} color="emerald" />
                    <AdminStatCard icon={CheckCircle2} label="Quiz Pass" value={`${eng.quizPassRate}%`} color="violet" />
                    <AdminStatCard icon={Target} label="Avg Score" value={`${eng.avgQuizScore}%`} color="amber" />
                    <AdminStatCard icon={Flame} label="Streaks" value={`${eng.activeStreaks}`} color="orange" />
                    <AdminStatCard icon={Award} label="Certs this Month" value={`${eng.certificatesThisMonth}`} color="cyan" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Urgent Items + Recent Activity + Recent Signups */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Urgent Items */}
            <div>
              <h2 className="text-[13px] font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <AlertTriangle className="size-3.5 text-amber-500" /> Urgent Items
              </h2>
              {data.urgentItems.length === 0 ? (
                <Card className="rounded-2xl border-border/50">
                  <CardContent className="p-6 text-center">
                    <CheckCircle2 className="size-7 text-emerald-500 mx-auto mb-2" />
                    <p className="text-[12px] text-muted-foreground">All clear! No urgent items.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {data.urgentItems.map((item, idx) => (
                    <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}>
                      <Card className="rounded-xl border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/10 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setCurrentView(item.view)}>
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                              <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <p className="text-[12px] font-medium text-foreground">{item.label}</p>
                          </div>
                          <Button variant="ghost" size="sm" className="text-[11px] text-amber-600 dark:text-amber-400 h-7 gap-1">
                            {item.action} <ArrowRight className="size-2.5" />
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div>
              <EnhancedActivityFeed activities={data.recentActivity} onViewAll={() => setCurrentView('admin-audit-log')} />
            </div>

            {/* Recent Signups */}
            <Card className="rounded-2xl border-border/50 overflow-hidden">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
                  <UserPlus className="size-4 text-blue-500" /> Recent Signups
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {data.recentSignups.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-[12px]">No recent signups</div>
                  ) : (
                    data.recentSignups.map((user, idx) => (
                      <div key={user.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors border-b border-border/20 last:border-0">
                        <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white text-[10px] font-bold', AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length])}>
                          {getInitials(user.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-semibold text-foreground truncate">{user.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5">{user.role}</Badge>
                          <p className="text-[9px] text-muted-foreground mt-0.5">{formatShortDate(user.date)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Moderation + AI Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-2xl border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
                  <Shield className="size-4 text-amber-500" /> Content Moderation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 p-3 text-center">
                    <p className="text-[20px] font-bold text-amber-600 dark:text-amber-400">{data.contentModeration.pendingReviews}</p>
                    <p className="text-[10px] text-muted-foreground">Pending Reviews</p>
                  </div>
                  <div className="rounded-xl bg-red-50 dark:bg-red-950/20 p-3 text-center">
                    <p className="text-[20px] font-bold text-red-600 dark:text-red-400">{data.contentModeration.reportedContent}</p>
                    <p className="text-[10px] text-muted-foreground">Reported</p>
                  </div>
                  <div className="rounded-xl bg-violet-50 dark:bg-violet-950/20 p-3 text-center">
                    <p className="text-[20px] font-bold text-violet-600 dark:text-violet-400">{data.contentModeration.flaggedUsers}</p>
                    <p className="text-[10px] text-muted-foreground">Flagged Users</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3 h-8 text-[12px] rounded-xl gap-2" onClick={() => setCurrentView('admin-content-review')}>
                  Go to Content Review <ArrowRight className="size-3" />
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
                  <Brain className="size-4 text-pink-500" /> AI Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <AdminStatCard icon={Brain} label="Tutor Sessions" value={`${ai.totalTutorSessions}`} color="pink" subLabel={`${ai.tutorSessionsThisMonth} this month`} />
                  <AdminStatCard icon={Sparkles} label="AI Generations" value={`${ai.totalAIGenerations}`} color="violet" subLabel={`${ai.aiGenerationsThisMonth} this month`} />
                  <AdminStatCard icon={MessageSquare} label="Chat Messages" value={`${ai.totalChatMessages}`} color="blue" />
                  <AdminStatCard icon={Radio} label="Active AI Now" value={`${pulse.usingAITutor}`} color="emerald" />
                </div>
                <Button variant="outline" size="sm" className="w-full mt-3 h-8 text-[12px] rounded-xl gap-2" onClick={() => setCurrentView('admin-ai-config')}>
                  AI Configuration <ArrowRight className="size-3" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ SYSTEM TAB ════════════════════════════════════ */}
        <TabsContent value="system" className="space-y-6">
          {/* System Alerts */}
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
                    <Bell className="size-4 text-amber-500" /> System Alerts
                  </CardTitle>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Recent system events requiring attention</p>
                </div>
                <Badge variant="outline" className="text-[11px]">{data.systemAlerts.length} alerts</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2">
                {data.systemAlerts.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-[12px]">
                    <CheckCircle2 className="size-6 text-emerald-500 mx-auto mb-1" />
                    No system alerts
                  </div>
                ) : (
                  data.systemAlerts.map((alert, idx) => {
                    const style = ALERT_STYLES[alert.type] || ALERT_STYLES.warning
                    return (
                      <motion.div key={alert.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}
                        className="flex items-start gap-2.5 rounded-xl border border-border/40 p-2.5">
                        <div className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg', style.bg)}>
                          <div className={style.color}>{style.icon}</div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] text-foreground">{alert.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{formatShortDate(alert.time)}</p>
                        </div>
                        <Badge variant="outline" className={cn('text-[9px] h-4 shrink-0', alert.type === 'critical' ? 'border-red-500/30 text-red-500' : alert.type === 'error' ? 'border-red-500/30 text-red-500' : 'border-amber-500/30 text-amber-500')}>
                          {alert.type}
                        </Badge>
                      </motion.div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Usage Stats Detail */}
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
                <Brain className="size-4 text-pink-500" /> AI Platform Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="rounded-xl bg-pink-50 dark:bg-pink-950/20 p-3 text-center">
                  <Brain className="size-5 text-pink-500 mx-auto mb-1" />
                  <p className="text-[16px] font-bold text-foreground">{formatNumber(ai.totalTutorSessions)}</p>
                  <p className="text-[10px] text-muted-foreground">Total Tutor Sessions</p>
                  <p className="text-[9px] text-emerald-600 dark:text-emerald-400">{ai.tutorSessionsThisMonth} this month</p>
                </div>
                <div className="rounded-xl bg-violet-50 dark:bg-violet-950/20 p-3 text-center">
                  <Sparkles className="size-5 text-violet-500 mx-auto mb-1" />
                  <p className="text-[16px] font-bold text-foreground">{formatNumber(ai.totalAIGenerations)}</p>
                  <p className="text-[10px] text-muted-foreground">AI Generations</p>
                  <p className="text-[9px] text-emerald-600 dark:text-emerald-400">{ai.aiGenerationsThisMonth} this month</p>
                </div>
                <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 p-3 text-center">
                  <MessageSquare className="size-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-[16px] font-bold text-foreground">{formatNumber(ai.totalChatMessages)}</p>
                  <p className="text-[10px] text-muted-foreground">Chat Messages</p>
                </div>
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 p-3 text-center">
                  <FileCheck className="size-5 text-emerald-500 mx-auto mb-1" />
                  <p className="text-[16px] font-bold text-foreground">{formatNumber(eng.certificatesIssued)}</p>
                  <p className="text-[10px] text-muted-foreground">Certificates</p>
                  <p className="text-[9px] text-emerald-600 dark:text-emerald-400">{eng.certificatesThisMonth} this month</p>
                </div>
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 p-3 text-center">
                  <Flame className="size-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-[16px] font-bold text-foreground">{formatNumber(eng.activeStreaks)}</p>
                  <p className="text-[10px] text-muted-foreground">Active Streaks</p>
                  <p className="text-[9px] text-muted-foreground">users learning daily</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-3 h-8 text-[12px] rounded-xl gap-2" onClick={() => setCurrentView('admin-ai-config')}>
                Manage AI Configuration <ExternalLink className="size-3" />
              </Button>
            </CardContent>
          </Card>

          {/* Instructor Applications */}
          {data.instructorApplicationsList.length > 0 && (
            <Card className="rounded-2xl border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
                      <GraduationCap className="size-4 text-teal-500" /> Instructor Applications
                    </CardTitle>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{data.instructorApplications} pending applications</p>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-[11px] rounded-lg gap-1" onClick={() => setCurrentView('admin-instructor-applications')}>
                    View All <ArrowRight className="size-2.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                  <div className="space-y-1.5">
                    {data.instructorApplicationsList.slice(0, 5).map((app) => (
                      <div key={app.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                        <div>
                          <p className="text-[12px] font-medium text-foreground">{app.name}</p>
                          <p className="text-[10px] text-muted-foreground">{app.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn('text-[9px] h-4',
                            app.status === 'pending' ? 'border-amber-500/30 text-amber-600 dark:text-amber-400' :
                            app.status === 'approved' ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400' :
                            'border-red-500/30 text-red-500'
                          )}>{app.status}</Badge>
                          <span className="text-[9px] text-muted-foreground">{formatShortDate(app.appliedAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feature Flags + Announcements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FeatureFlagsSection flags={featureFlags} />
            <AnnouncementsManager announcements={announcements} onCreate={handleCreateAnnouncement} onDelete={handleDeleteAnnouncement} />
          </div>

          {/* Quick Settings Access */}
          <Card className="rounded-2xl border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-semibold">Platform Settings Quick Access</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { label: 'Security', icon: Shield, view: 'admin-security', color: 'text-red-500 bg-red-50 dark:bg-red-950/20' },
                  { label: 'Appearance', icon: Settings, view: 'admin-appearance', color: 'text-violet-500 bg-violet-50 dark:bg-violet-950/20' },
                  { label: 'Finance', icon: Wallet, view: 'admin-revenue', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
                  { label: 'Platform', icon: Server, view: 'admin-platform-settings', color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
                  { label: 'Gamification', icon: Trophy, view: 'admin-gamification', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
                  { label: 'Notifications', icon: Bell, view: 'admin-notifications', color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/20' },
                  { label: 'Audit Log', icon: BarChart3, view: 'admin-audit-log', color: 'text-slate-500 bg-slate-50 dark:bg-slate-950/20' },
                  { label: 'Dev Tools', icon: Wrench, view: 'admin-dev-tools', color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20' },
                ].map((item) => (
                  <button key={item.label} onClick={() => setCurrentView(item.view)}
                    className={cn('flex flex-col items-center gap-2 rounded-xl p-3 transition-all hover:shadow-md', item.color)}>
                    <item.icon className="size-5" />
                    <span className="text-[11px] font-semibold">{item.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminDashboardV2
