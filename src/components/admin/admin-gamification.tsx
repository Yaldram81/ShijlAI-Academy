'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy, Star, Zap, Flame, Award, Target, BarChart3, Settings,
  Edit3, Plus, CheckCircle, XCircle, Loader2, Search, Medal,
  TrendingUp, Users, BookOpen, Crown, Shield, ChevronLeft,
  ChevronRight, Info, Coins, Sparkles, ToggleLeft, ToggleRight,
  Gift, Timer, ArrowUp, ArrowDown, Hash, GraduationCap,
  Trash2, Calendar, ShoppingBag, Megaphone, Activity, RotateCcw,
  UserPlus, MoreVertical, AlertTriangle, RefreshCw, Eye,
  Download, Upload, Filter, ChevronDown,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge as BadgeUI } from '@/components/ui/badge'
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from 'sonner'
import { ShijlAIText } from '@/components/ui/brand-text'

// ─── Types ──────────────────────────────────────────────────────────────────

interface XPRule {
  id: string; action: string; label: string; xpAwarded: number; coinAwarded: number;
  category: string; isActive: boolean; order: number; description: string | null;
  createdAt: string; updatedAt: string;
}

interface BadgeItem {
  id: string; name: string; description: string; icon: string; category: string;
  xpReward: number; coinReward: number; requirement: string; isActive: boolean;
  earnCount: number; createdAt: string; updatedAt: string;
}

interface LevelConfig {
  id: string; level: number; title: string; minXp: number; maxXp: number;
  badgeIcon: string | null; coinReward: number; createdAt: string; updatedAt: string;
}

interface GamificationSettings {
  id: string; leaderboardResetFrequency: string; leaderboardShowFullName: boolean;
  topWinnerCount: number; topWinnerRewardType: string; topWinnerRewardAmount: number;
  streakXpMultiplier: number; streakFreezeEnabled: boolean; streakFreezeCost: number;
  maxStreakFreezesPerMonth: number; xpEnabled: boolean; badgesEnabled: boolean;
  leaderboardsEnabled: boolean; streaksEnabled: boolean; rewardsEnabled: boolean;
  challengesEnabled: boolean; eventsEnabled: boolean; shopEnabled: boolean; updatedAt: string;
}

interface StreakReward {
  id: string; streakDays: number; xpBonus: number; coinBonus: number;
  badgeId: string | null; badge: { id: string; name: string; icon: string } | null;
  isActive: boolean; createdAt: string; updatedAt: string;
}

interface LeaderboardEntry {
  rank: number; userId: string; userName: string; avatar: string | null;
  xp: number; level: number; streak: number; longestStreak: number; coins: number;
}

interface ChallengeItem {
  id: string; title: string; description: string; type: string; target: number;
  unit: string; xpReward: number; coinReward: number; icon: string;
  difficulty: string; date: string; isActive: boolean; participantCount: number; createdAt: string;
}

interface RewardShopItem {
  id: string; name: string; description: string; icon: string; category: string;
  coinCost: number; xpCost: number; stock: number; claimed: number; claimCount: number;
  isActive: boolean; createdAt: string; updatedAt: string;
}

interface GamificationEvent {
  id: string; type: string; title: string; description: string; icon: string;
  xpMultiplier: number; coinMultiplier: number; startDate: string; endDate: string;
  isActive: boolean; createdAt: string; updatedAt: string;
}

interface XpActivityItem {
  id: string; userId: string; action: string; xpAmount: number; coinAmount: number;
  description: string; metadata: string | null; createdAt: string;
  user: { id: string; name: string; avatar: string | null };
}

interface GamificationStats {
  totalXpDistributed: number; totalCoinsDistributed: number; totalBadgesAwarded: number;
  activeUsersWithStreak: number; avgXpPerUser: number; maxStreak: number;
  totalChallengesCreated: number; totalRewardsClaimed: number; activeEvents: number;
  levelDistribution: Record<number, number>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return (num ?? 0).toLocaleString()
}

function formatXpRange(minXp: number, maxXp: number): string {
  if (maxXp >= 999999) return `${formatNumber(minXp)}+ XP`
  return `${formatNumber(minXp)} – ${formatNumber(maxXp)} XP`
}

function formatDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateTime(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function isEventActive(event: GamificationEvent): boolean {
  const now = new Date()
  return event.isActive && new Date(event.startDate) <= now && new Date(event.endDate) >= now
}

const spring = { type: 'spring' as const, stiffness: 400, damping: 25 }

// ─── Category configs ───────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<string, { label: string; badgeClass: string; icon: React.ReactNode }> = {
  learning: { label: 'Learning', badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400', icon: <BookOpen className="size-3.5" /> },
  quiz: { label: 'Quiz', badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400', icon: <Target className="size-3.5" /> },
  assignment: { label: 'Assignment', badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400', icon: <Award className="size-3.5" /> },
  community: { label: 'Community', badgeClass: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400', icon: <Users className="size-3.5" /> },
  streak: { label: 'Streak', badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400', icon: <Flame className="size-3.5" /> },
  course: { label: 'Course', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400', icon: <GraduationCap className="size-3.5" /> },
  referral: { label: 'Referral', badgeClass: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400', icon: <Gift className="size-3.5" /> },
  live_session: { label: 'Live Session', badgeClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400', icon: <Timer className="size-3.5" /> },
  achievement: { label: 'Achievement', badgeClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400', icon: <Trophy className="size-3.5" /> },
  social: { label: 'Social', badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400', icon: <Star className="size-3.5" /> },
}

const BADGE_CATEGORY_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  learning: { label: 'Learning', badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' },
  streak: { label: 'Streak', badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' },
  social: { label: 'Social', badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' },
  achievement: { label: 'Achievement', badgeClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400' },
}

const CHALLENGE_TYPE_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  lesson: { label: 'Lesson', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
  quiz: { label: 'Quiz', badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400' },
  streak: { label: 'Streak', badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' },
  xp: { label: 'XP', badgeClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400' },
  time: { label: 'Time', badgeClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400' },
  assignment: { label: 'Assignment', badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
}

const DIFFICULTY_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  easy: { label: 'Easy', badgeClass: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400' },
  medium: { label: 'Medium', badgeClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400' },
  hard: { label: 'Hard', badgeClass: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' },
}

const SHOP_CATEGORY_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  digital: { label: 'Digital', badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' },
  physical: { label: 'Physical', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
  discount: { label: 'Discount', badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
  feature: { label: 'Feature', badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400' },
  cosmetic: { label: 'Cosmetic', badgeClass: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400' },
}

const EVENT_TYPE_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  xp_bonus: { label: 'XP Bonus', badgeClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400' },
  double_coins: { label: 'Double Coins', badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
  badge_hunt: { label: 'Badge Hunt', badgeClass: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400' },
  leaderboard_blitz: { label: 'Leaderboard Blitz', badgeClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
  streak_frenzy: { label: 'Streak Frenzy', badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' },
}

const XP_ACTION_LABELS: Record<string, string> = {
  complete_lesson: 'Complete Lesson', pass_quiz: 'Pass Quiz', earn_badge: 'Earn Badge',
  submit_assignment: 'Submit Assignment', daily_login: 'Daily Login', streak_bonus: 'Streak Bonus',
  challenge_reward: 'Challenge Reward', course_complete: 'Course Complete', admin_grant: 'Admin Grant',
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AdminGamification() {
  const { currentUser } = useAppStore()

  // ── Active Tab ──
  const [activeTab, setActiveTab] = useState('overview')

  // ── Data State ──
  const [xpRules, setXpRules] = useState<XPRule[]>([])
  const [badges, setBadges] = useState<BadgeItem[]>([])
  const [levels, setLevels] = useState<LevelConfig[]>([])
  const [settings, setSettings] = useState<GamificationSettings | null>(null)
  const [streakRewards, setStreakRewards] = useState<StreakReward[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [challenges, setChallenges] = useState<ChallengeItem[]>([])
  const [rewardShop, setRewardShop] = useState<RewardShopItem[]>([])
  const [events, setEvents] = useState<GamificationEvent[]>([])
  const [xpActivities, setXpActivities] = useState<XpActivityItem[]>([])
  const [stats, setStats] = useState<GamificationStats | null>(null)
  const [xpActivityRecent, setXpActivityRecent] = useState<{ count: number; totalXp: number }>({ count: 0, totalXp: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // ── Edit Dialogs ──
  const [editDialog, setEditDialog] = useState<string | null>(null) // 'xpRule' | 'badge' | 'level' | 'streakReward' | 'challenge' | 'rewardShop' | 'event'
  const [isAddMode, setIsAddMode] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; description: string; action: () => void }>({ open: false, title: '', description: '', action: () => {} })
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; type: string; data: unknown }>({ open: false, type: '', data: null })

  // ── Edit Forms ──
  const [xpRuleForm, setXpRuleForm] = useState({ id: '', action: '', label: '', xpAwarded: 50, coinAwarded: 0, category: 'learning', isActive: true, description: '' })
  const [badgeForm, setBadgeForm] = useState({ id: '', name: '', description: '', icon: '🏆', category: 'learning', xpReward: 50, coinReward: 0, requirement: '', isActive: true })
  const [levelForm, setLevelForm] = useState({ id: '', level: 1, title: '', minXp: 0, maxXp: 500, badgeIcon: '', coinReward: 0 })
  const [streakRewardForm, setStreakRewardForm] = useState({ id: '', streakDays: 7, xpBonus: 100, coinBonus: 10, badgeId: '', isActive: true })
  const [challengeForm, setChallengeForm] = useState({ id: '', title: '', description: '', type: 'lesson', target: 1, unit: 'lessons', xpReward: 50, coinReward: 5, icon: '🎯', difficulty: 'medium', date: new Date().toISOString().split('T')[0], isActive: true })
  const [rewardShopForm, setRewardShopForm] = useState({ id: '', name: '', description: '', icon: '🎁', category: 'digital', coinCost: 100, xpCost: 0, stock: -1, isActive: true })
  const [eventForm, setEventForm] = useState({ id: '', type: 'xp_bonus', title: '', description: '', icon: '🎉', xpMultiplier: 1.5, coinMultiplier: 1.0, startDate: '', endDate: '', isActive: true })

  // ── Leaderboard & Activity pagination ──
  const [leaderboardPage, setLeaderboardPage] = useState(0)
  const [activityPage, setActivityPage] = useState(1)
  const [activityTotal, setActivityTotal] = useState(0)
  const LEADERBOARD_PAGE_SIZE = 10

  // ── Bulk award dialog ──
  const [bulkAwardOpen, setBulkAwardOpen] = useState(false)
  const [bulkAwardForm, setBulkAwardForm] = useState({ userIds: '', xpAmount: 0, coinAmount: 0, reason: '' })

  // ── Fetch all data ──
  const fetchAllData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/gamification')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      const d = json.data
      setXpRules(d.xpRules || [])
      setBadges(d.badges || [])
      setLevels(d.levels || [])
      setSettings(d.settings || null)
      setStreakRewards(d.streakRewards || [])
      setLeaderboard(d.leaderboard || [])
      setChallenges(d.challenges || [])
      setRewardShop(d.rewardShop || [])
      setEvents(d.events || [])
      setXpActivityRecent(d.xpActivityRecent || { count: 0, totalXp: 0 })
      setStats(d.stats || null)
    } catch {
      toast.error('Failed to load gamification data')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchXpActivity = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/gamification/xp-activity?page=${activityPage}&limit=20`)
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      setXpActivities(json.data || [])
      setActivityTotal(json.pagination?.total || 0)
    } catch {
      toast.error('Failed to load XP activity')
    }
  }, [activityPage])

  useEffect(() => { fetchAllData() }, [fetchAllData])
  useEffect(() => { if (activeTab === 'xp-activity') fetchXpActivity() }, [activeTab, fetchXpActivity])

  // ═══════════════════════════════════════════════════════════════
  // GENERIC SAVE / DELETE HELPERS
  // ═══════════════════════════════════════════════════════════════

  const apiCall = useCallback(async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || `Request failed (${res.status})`)
    }
    return res.json()
  }, [])

  const handleSave = useCallback(async (endpoint: string, form: Record<string, unknown>, isAdd: boolean) => {
    setSaving(true)
    try {
      if (isAdd) {
        await apiCall(endpoint, 'POST', form)
        toast.success('Created successfully')
      } else {
        await apiCall(endpoint, 'PATCH', form)
        toast.success('Updated successfully')
      }
      setEditDialog(null)
      fetchAllData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }, [apiCall, fetchAllData])

  const handleDelete = useCallback(async (endpoint: string, id: string, name: string) => {
    setConfirmDialog({
      open: true,
      title: `Delete ${name}?`,
      description: `This action cannot be undone. All associated data will be permanently removed.`,
      action: async () => {
        try {
          await apiCall(`${endpoint}?id=${id}`, 'DELETE')
          toast.success(`${name} deleted`)
          fetchAllData()
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to delete')
        }
        setConfirmDialog(prev => ({ ...prev, open: false }))
      },
    })
  }, [apiCall, fetchAllData])

  const handleToggle = useCallback(async (endpoint: string, id: string, isActive: boolean, label: string) => {
    try {
      await apiCall(endpoint, 'PATCH', { id, isActive })
      toast.success(`${label} ${isActive ? 'activated' : 'deactivated'}`)
      fetchAllData()
    } catch {
      toast.error(`Failed to toggle ${label}`)
    }
  }, [apiCall, fetchAllData])

  // ═══════════════════════════════════════════════════════════════
  // BULK ACTIONS
  // ═══════════════════════════════════════════════════════════════

  const handleBulkAction = useCallback(async (action: string, body: Record<string, unknown> = {}) => {
    setSaving(true)
    try {
      await apiCall('/api/admin/gamification/bulk-actions', 'POST', { action, ...body })
      toast.success(`Bulk action completed`)
      fetchAllData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bulk action failed')
    } finally {
      setSaving(false)
    }
  }, [apiCall, fetchAllData])

  // ═══════════════════════════════════════════════════════════════
  // RENDER: LOADING
  // ═══════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-2xl" />
          <div className="space-y-2"><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-72" /></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 1 — OVERVIEW / ANALYTICS
  // ═══════════════════════════════════════════════════════════════

  const renderOverviewTab = () => {
    const activeEvents = events.filter(isEventActive)
    const systemHealth = [
      { label: 'XP System', enabled: settings?.xpEnabled, icon: Zap, color: 'text-yellow-500' },
      { label: 'Badges', enabled: settings?.badgesEnabled, icon: Award, color: 'text-violet-500' },
      { label: 'Leaderboards', enabled: settings?.leaderboardsEnabled, icon: BarChart3, color: 'text-emerald-500' },
      { label: 'Streaks', enabled: settings?.streaksEnabled, icon: Flame, color: 'text-orange-500' },
      { label: 'Rewards', enabled: settings?.rewardsEnabled, icon: Gift, color: 'text-pink-500' },
      { label: 'Challenges', enabled: settings?.challengesEnabled, icon: Target, color: 'text-cyan-500' },
      { label: 'Events', enabled: settings?.eventsEnabled, icon: Megaphone, color: 'text-rose-500' },
      { label: 'Shop', enabled: settings?.shopEnabled, icon: ShoppingBag, color: 'text-teal-500' },
    ]
    const topBadges = [...badges].sort((a, b) => b.earnCount - a.earnCount).slice(0, 5)

    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total XP Distributed', value: formatNumber(stats?.totalXpDistributed ?? 0), icon: Zap, gradient: 'from-yellow-500/20 to-amber-500/20', iconColor: 'text-yellow-600 dark:text-yellow-400' },
            { label: 'Total Coins Distributed', value: formatNumber(stats?.totalCoinsDistributed ?? 0), icon: Coins, gradient: 'from-amber-500/20 to-orange-500/20', iconColor: 'text-amber-600 dark:text-amber-400' },
            { label: 'Badges Awarded', value: formatNumber(stats?.totalBadgesAwarded ?? 0), icon: Award, gradient: 'from-violet-500/20 to-purple-500/20', iconColor: 'text-violet-600 dark:text-violet-400' },
            { label: 'Active Streaks', value: formatNumber(stats?.activeUsersWithStreak ?? 0), icon: Flame, gradient: 'from-orange-500/20 to-red-500/20', iconColor: 'text-orange-600 dark:text-orange-400' },
            { label: 'Avg XP / User', value: formatNumber(stats?.avgXpPerUser ?? 0), icon: TrendingUp, gradient: 'from-emerald-500/20 to-teal-500/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Max Streak', value: `${stats?.maxStreak ?? 0} days`, icon: Flame, gradient: 'from-rose-500/20 to-pink-500/20', iconColor: 'text-rose-600 dark:text-rose-400' },
            { label: '30d XP Activities', value: formatNumber(xpActivityRecent.count), icon: Activity, gradient: 'from-cyan-500/20 to-sky-500/20', iconColor: 'text-cyan-600 dark:text-cyan-400' },
            { label: 'Active Events', value: `${activeEvents.length}`, icon: Megaphone, gradient: 'from-pink-500/20 to-rose-500/20', iconColor: 'text-pink-600 dark:text-pink-400' },
          ].map((s, i) => (
            <Card key={i} className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('flex size-10 items-center justify-center rounded-xl bg-gradient-to-br shrink-0', s.gradient)}>
                    <s.icon className={cn('size-5', s.iconColor)} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] text-muted-foreground truncate">{s.label}</p>
                    <p className="text-[20px] font-bold text-foreground">{s.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* System Health */}
          <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                  <Shield className="size-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-[18px] font-bold">System Health</CardTitle>
                  <p className="text-[13px] text-muted-foreground">Module status overview</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {systemHealth.map(s => (
                  <div key={s.label} className="flex items-center justify-between rounded-xl border p-2.5">
                    <div className="flex items-center gap-2">
                      <s.icon className={cn('size-4', s.color)} />
                      <span className="text-[12px] font-medium">{s.label}</span>
                    </div>
                    <div className={cn('size-2.5 rounded-full', s.enabled ? 'bg-emerald-500' : 'bg-gray-400')} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Badges */}
          <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                  <Award className="size-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <CardTitle className="text-[18px] font-bold">Most Popular Badges</CardTitle>
                  <p className="text-[13px] text-muted-foreground">Top earned badges</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topBadges.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground text-center py-6">No badges earned yet</p>
                ) : topBadges.map((b, i) => (
                  <div key={b.id} className="flex items-center gap-3 rounded-xl border p-2.5">
                    <span className="text-lg">{b.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">{b.name}</p>
                      <p className="text-[11px] text-muted-foreground">{b.earnCount} earned</p>
                    </div>
                    <span className="text-[12px] font-bold text-yellow-600 dark:text-yellow-400">#{i + 1}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Events */}
          <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20">
                    <Megaphone className="size-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <CardTitle className="text-[18px] font-bold">Active Events</CardTitle>
                    <p className="text-[13px] text-muted-foreground">Currently running gamification events</p>
                  </div>
                </div>
                <Button className="rounded-xl gap-1.5 h-9 text-[12px]" variant="outline" onClick={() => setActiveTab('events')}>
                  View All <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeEvents.length === 0 ? (
                <div className="text-center py-6">
                  <Calendar className="size-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-[13px] text-muted-foreground">No active events</p>
                  <Button className="rounded-xl gap-1.5 h-8 text-[12px] mt-2" variant="outline" onClick={() => {
                    setEventForm({ id: '', type: 'xp_bonus', title: '', description: '', icon: '🎉', xpMultiplier: 1.5, coinMultiplier: 1.0, startDate: '', endDate: '', isActive: true })
                    setIsAddMode(true); setEditDialog('event')
                  }}>
                    <Plus className="size-3.5" /> Create Event
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeEvents.slice(0, 3).map(ev => (
                    <div key={ev.id} className="flex items-center gap-3 rounded-xl border p-3">
                      <span className="text-lg">{ev.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate">{ev.title}</p>
                        <p className="text-[11px] text-muted-foreground">{ev.xpMultiplier}x XP · Until {formatDate(ev.endDate)}</p>
                      </div>
                      <BadgeUI variant="secondary" className="rounded-lg text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">Active</BadgeUI>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Level Distribution */}
          <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20">
                  <Medal className="size-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <CardTitle className="text-[18px] font-bold">Level Distribution</CardTitle>
                  <p className="text-[13px] text-muted-foreground">Students per level</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {stats?.levelDistribution && Object.keys(stats.levelDistribution).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(stats.levelDistribution)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .slice(0, 8)
                    .map(([lvl, count]) => {
                      const maxCount = Math.max(...Object.values(stats.levelDistribution))
                      const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
                      const lvlConfig = levels.find(l => l.level === Number(lvl))
                      return (
                        <div key={lvl} className="flex items-center gap-3">
                          <div className="w-16 text-right">
                            <span className="text-[11px] font-medium">{lvlConfig?.badgeIcon || '⭐'} Lv {lvl}</span>
                          </div>
                          <div className="flex-1 h-6 bg-muted/50 rounded-lg overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.5 }}
                              className="h-full rounded-lg bg-gradient-to-r from-indigo-400 to-violet-400"
                            />
                          </div>
                          <span className="text-[12px] font-semibold text-muted-foreground w-8 text-right">{count}</span>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground text-center py-6">No level data yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500/20 to-gray-500/20">
                <Sparkles className="size-5 text-slate-600 dark:text-slate-400" />
              </div>
              <CardTitle className="text-[18px] font-bold">Quick Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button variant="outline" className="rounded-xl h-auto py-3 flex-col gap-1.5 text-[12px]" onClick={() => { setBulkAwardForm({ userIds: '', xpAmount: 100, coinAmount: 0, reason: '' }); setBulkAwardOpen(true) }}>
                <UserPlus className="size-4 text-yellow-500" /> Award XP/Coins
              </Button>
              <Button variant="outline" className="rounded-xl h-auto py-3 flex-col gap-1.5 text-[12px]" onClick={() => setConfirmDialog({ open: true, title: 'Reset Leaderboard?', description: 'This will reset all student XP and levels to 0. This cannot be undone.', action: () => { handleBulkAction('reset_leaderboard'); setConfirmDialog(prev => ({ ...prev, open: false })) } })}>
                <RotateCcw className="size-4 text-red-500" /> Reset Leaderboard
              </Button>
              <Button variant="outline" className="rounded-xl h-auto py-3 flex-col gap-1.5 text-[12px]" onClick={() => handleBulkAction('toggle_all_xp_rules', { isActive: true })}>
                <Zap className="size-4 text-yellow-500" /> Enable All XP Rules
              </Button>
              <Button variant="outline" className="rounded-xl h-auto py-3 flex-col gap-1.5 text-[12px]" onClick={() => handleBulkAction('toggle_all_xp_rules', { isActive: false })}>
                <Zap className="size-4 text-gray-500" /> Disable All XP Rules
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 2 — XP RULES
  // ═══════════════════════════════════════════════════════════════

  const renderXpRulesTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="space-y-4">
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20">
                <Zap className="size-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <CardTitle className="text-[18px] font-bold">XP Rules</CardTitle>
                <p className="text-[13px] text-muted-foreground">{xpRules.length} rules · {xpRules.filter(r => r.isActive).length} active</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" size="sm" className="rounded-xl h-9 gap-1.5"><MoreVertical className="size-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleBulkAction('toggle_all_xp_rules', { isActive: true })}><Zap className="size-3.5 mr-2 text-yellow-500" /> Enable All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkAction('toggle_all_xp_rules', { isActive: false })}><Zap className="size-3.5 mr-2 text-gray-500" /> Disable All</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button className="rounded-xl gap-1.5 h-9 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white"
                onClick={() => { setXpRuleForm({ id: '', action: '', label: '', xpAwarded: 50, coinAwarded: 0, category: 'learning', isActive: true, description: '' }); setIsAddMode(true); setEditDialog('xpRule') }}>
                <Plus className="size-4" /> Add Rule
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full text-[13px]">
              <thead><tr className="bg-muted/50 border-b">
                <th className="text-left font-semibold px-4 py-3">Action</th>
                <th className="text-left font-semibold px-4 py-3">XP</th>
                <th className="text-left font-semibold px-4 py-3">Coins</th>
                <th className="text-left font-semibold px-4 py-3">Category</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
                <th className="text-right font-semibold px-4 py-3">Actions</th>
              </tr></thead>
              <tbody>
                {xpRules.map(rule => (
                  <tr key={rule.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3"><div><p className="font-medium">{rule.label}</p><p className="text-[11px] text-muted-foreground mt-0.5">{rule.action}</p></div></td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-1 font-semibold text-yellow-600 dark:text-yellow-400"><Zap className="size-3.5" /> +{rule.xpAwarded}</span></td>
                    <td className="px-4 py-3">{rule.coinAwarded > 0 ? <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400"><Coins className="size-3" /> +{rule.coinAwarded}</span> : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-3">{CATEGORY_CONFIG[rule.category] && <span className={cn('inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold', CATEGORY_CONFIG[rule.category].badgeClass)}>{CATEGORY_CONFIG[rule.category].icon}{CATEGORY_CONFIG[rule.category].label}</span>}</td>
                    <td className="px-4 py-3"><button onClick={() => handleToggle('/api/admin/gamification/xp-rules', rule.id, !rule.isActive, 'XP rule')} className="flex items-center gap-1.5"><div className={cn('size-2.5 rounded-full', rule.isActive ? 'bg-emerald-500' : 'bg-gray-400')} /><span className={cn('text-[12px] font-medium', rule.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500')}>{rule.isActive ? 'Active' : 'Inactive'}</span></button></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="rounded-lg h-8 gap-1 text-[12px]" onClick={() => { setXpRuleForm({ id: rule.id, action: rule.action, label: rule.label, xpAwarded: rule.xpAwarded, coinAwarded: rule.coinAwarded, category: rule.category, isActive: rule.isActive, description: rule.description || '' }); setIsAddMode(false); setEditDialog('xpRule') }}><Edit3 className="size-3" />Edit</Button>
                        <Button variant="ghost" size="sm" className="rounded-lg h-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => handleDelete('/api/admin/gamification/xp-rules', rule.id, 'XP Rule')}><Trash2 className="size-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 3 — BADGES
  // ═══════════════════════════════════════════════════════════════

  const renderBadgesTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="space-y-4">
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                <Award className="size-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <CardTitle className="text-[18px] font-bold">Badges</CardTitle>
                <p className="text-[13px] text-muted-foreground">{badges.length} badges · {badges.filter(b => b.isActive).length} active</p>
              </div>
            </div>
            <Button className="rounded-xl gap-1.5 h-9 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white"
              onClick={() => { setBadgeForm({ id: '', name: '', description: '', icon: '🏆', category: 'learning', xpReward: 50, coinReward: 0, requirement: '', isActive: true }); setIsAddMode(true); setEditDialog('badge') }}>
              <Plus className="size-4" /> Create Badge
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {badges.map(badge => (
              <div key={badge.id} className="flex items-center gap-4 rounded-2xl border p-4 hover:bg-muted/30 transition-colors group">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 text-2xl shrink-0 ios-shadow-sm">{badge.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><p className="font-semibold truncate">{badge.name}</p>{BADGE_CATEGORY_CONFIG[badge.category] && <span className={cn('rounded-lg px-1.5 py-0.5 text-[10px] font-semibold shrink-0', BADGE_CATEGORY_CONFIG[badge.category].badgeClass)}>{BADGE_CATEGORY_CONFIG[badge.category].label}</span>}</div>
                  <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{badge.description}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    {badge.xpReward > 0 && <span className="text-[11px] font-medium text-yellow-600 dark:text-yellow-400">+{badge.xpReward} XP</span>}
                    {badge.coinReward > 0 && <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">+{badge.coinReward} coins</span>}
                    <span className="text-[11px] text-muted-foreground">{badge.earnCount} earned</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button onClick={() => handleToggle('/api/admin/gamification/badges', badge.id, !badge.isActive, 'Badge')} className="flex items-center gap-1.5"><div className={cn('size-2.5 rounded-full', badge.isActive ? 'bg-emerald-500' : 'bg-gray-400')} /><span className={cn('text-[11px] font-medium', badge.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500')}>{badge.isActive ? 'Active' : 'Inactive'}</span></button>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="rounded-lg h-7 gap-1 text-[11px] px-2" onClick={() => { setBadgeForm({ id: badge.id, name: badge.name, description: badge.description, icon: badge.icon, category: badge.category, xpReward: badge.xpReward, coinReward: badge.coinReward, requirement: badge.requirement, isActive: badge.isActive }); setIsAddMode(false); setEditDialog('badge') }}><Edit3 className="size-3" />Edit</Button>
                    <Button variant="ghost" size="sm" className="rounded-lg h-7 text-red-500 hover:text-red-600 px-1" onClick={() => handleDelete('/api/admin/gamification/badges', badge.id, 'Badge')}><Trash2 className="size-3" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 4 — LEADERBOARDS
  // ═══════════════════════════════════════════════════════════════

  const renderLeaderboardsTab = () => {
    const paginated = leaderboard.slice(leaderboardPage * LEADERBOARD_PAGE_SIZE, (leaderboardPage + 1) * LEADERBOARD_PAGE_SIZE)
    const totalPages = Math.ceil(leaderboard.length / LEADERBOARD_PAGE_SIZE)

    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="space-y-4">
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                  <BarChart3 className="size-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-[18px] font-bold">Leaderboard</CardTitle>
                  <p className="text-[13px] text-muted-foreground">{leaderboard.length} students ranked by XP</p>
                </div>
              </div>
              <Button variant="outline" className="rounded-xl gap-1.5 h-9 text-[12px] text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => setConfirmDialog({ open: true, title: 'Reset All Streaks?', description: 'This will set all student streaks to 0.', action: () => { handleBulkAction('reset_streaks'); setConfirmDialog(prev => ({ ...prev, open: false })) } })}>
                <RotateCcw className="size-3.5" /> Reset Streaks
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border overflow-hidden">
              <table className="w-full text-[13px]">
                <thead><tr className="bg-muted/50 border-b">
                  <th className="text-center font-semibold px-4 py-3 w-16">Rank</th>
                  <th className="text-left font-semibold px-4 py-3">User</th>
                  <th className="text-right font-semibold px-4 py-3">XP</th>
                  <th className="text-center font-semibold px-4 py-3">Level</th>
                  <th className="text-center font-semibold px-4 py-3">Streak</th>
                  <th className="text-right font-semibold px-4 py-3">Coins</th>
                </tr></thead>
                <tbody>
                  {paginated.map(entry => (
                    <tr key={entry.userId} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-center">
                        {entry.rank <= 3 ? (
                          <div className={cn('inline-flex items-center justify-center size-8 rounded-full font-bold text-white text-[13px]',
                            entry.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-amber-500' : entry.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400' : 'bg-gradient-to-br from-amber-600 to-orange-700')}>
                            {entry.rank === 1 ? <Crown className="size-4" /> : entry.rank}
                          </div>
                        ) : <span className="text-muted-foreground font-medium">#{entry.rank}</span>}
                      </td>
                      <td className="px-4 py-3"><div className="flex items-center gap-2.5">
                        <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-[11px] font-bold shrink-0">
                          {entry.userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <span className="font-medium">{settings?.leaderboardShowFullName ? entry.userName : entry.userName.split(' ')[0]}</span>
                      </div></td>
                      <td className="px-4 py-3 text-right font-semibold text-yellow-600 dark:text-yellow-400">{formatNumber(entry.xp)}</td>
                      <td className="px-4 py-3 text-center"><BadgeUI variant="secondary" className="rounded-lg text-[11px] font-semibold">{entry.level}</BadgeUI></td>
                      <td className="px-4 py-3 text-center">
                        {entry.streak > 0 ? <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium"><Flame className="size-3" />{entry.streak}</span> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-amber-600 dark:text-amber-400">{formatNumber(entry.coins)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-[12px] text-muted-foreground">Showing {leaderboardPage * LEADERBOARD_PAGE_SIZE + 1}–{Math.min((leaderboardPage + 1) * LEADERBOARD_PAGE_SIZE, leaderboard.length)} of {leaderboard.length}</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl h-8 w-8 p-0" disabled={leaderboardPage === 0} onClick={() => setLeaderboardPage(p => p - 1)}><ChevronLeft className="size-4" /></Button>
                  <span className="text-[12px] font-medium">{leaderboardPage + 1} / {totalPages}</span>
                  <Button variant="outline" size="sm" className="rounded-xl h-8 w-8 p-0" disabled={leaderboardPage >= totalPages - 1} onClick={() => setLeaderboardPage(p => p + 1)}><ChevronRight className="size-4" /></Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 5 — CHALLENGES
  // ═══════════════════════════════════════════════════════════════

  const renderChallengesTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="space-y-4">
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-sky-500/20">
                <Target className="size-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <CardTitle className="text-[18px] font-bold">Daily Challenges</CardTitle>
                <p className="text-[13px] text-muted-foreground">{challenges.length} challenges · {challenges.filter(c => c.isActive).length} active</p>
              </div>
            </div>
            <Button className="rounded-xl gap-1.5 h-9 bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-600 hover:to-sky-600 text-white"
              onClick={() => { setChallengeForm({ id: '', title: '', description: '', type: 'lesson', target: 1, unit: 'lessons', xpReward: 50, coinReward: 5, icon: '🎯', difficulty: 'medium', date: new Date().toISOString().split('T')[0], isActive: true }); setIsAddMode(true); setEditDialog('challenge') }}>
              <Plus className="size-4" /> Create Challenge
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {challenges.map(c => (
              <div key={c.id} className="flex items-center gap-4 rounded-2xl border p-4 hover:bg-muted/30 transition-colors group">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-950/20 dark:to-sky-950/20 text-xl shrink-0">{c.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><p className="font-semibold truncate">{c.title}</p>
                    {CHALLENGE_TYPE_CONFIG[c.type] && <span className={cn('rounded-lg px-1.5 py-0.5 text-[10px] font-semibold shrink-0', CHALLENGE_TYPE_CONFIG[c.type].badgeClass)}>{CHALLENGE_TYPE_CONFIG[c.type].label}</span>}
                    {DIFFICULTY_CONFIG[c.difficulty] && <span className={cn('rounded-lg px-1.5 py-0.5 text-[10px] font-semibold shrink-0', DIFFICULTY_CONFIG[c.difficulty].badgeClass)}>{DIFFICULTY_CONFIG[c.difficulty].label}</span>}
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{c.description}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px] font-medium text-yellow-600 dark:text-yellow-400">+{c.xpReward} XP</span>
                    {c.coinReward > 0 && <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">+{c.coinReward} coins</span>}
                    <span className="text-[11px] text-muted-foreground">{c.target} {c.unit}</span>
                    <span className="text-[11px] text-muted-foreground">{c.participantCount} participants</span>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Calendar className="size-3" />{c.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => handleToggle('/api/admin/gamification/challenges', c.id, !c.isActive, 'Challenge')} className="flex items-center gap-1.5"><div className={cn('size-2.5 rounded-full', c.isActive ? 'bg-emerald-500' : 'bg-gray-400')} /><span className={cn('text-[11px] font-medium', c.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500')}>{c.isActive ? 'Active' : 'Inactive'}</span></button>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="rounded-lg h-7 gap-1 text-[11px] px-2" onClick={() => { setChallengeForm({ id: c.id, title: c.title, description: c.description, type: c.type, target: c.target, unit: c.unit, xpReward: c.xpReward, coinReward: c.coinReward, icon: c.icon, difficulty: c.difficulty, date: c.date, isActive: c.isActive }); setIsAddMode(false); setEditDialog('challenge') }}><Edit3 className="size-3" /></Button>
                    <Button variant="ghost" size="sm" className="rounded-lg h-7 text-red-500 hover:text-red-600 px-1" onClick={() => handleDelete('/api/admin/gamification/challenges', c.id, 'Challenge')}><Trash2 className="size-3" /></Button>
                  </div>
                </div>
              </div>
            ))}
            {challenges.length === 0 && <div className="text-center py-10"><Target className="size-8 text-muted-foreground mx-auto mb-2" /><p className="text-[13px] text-muted-foreground">No challenges yet. Create your first daily challenge!</p></div>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 6 — REWARD SHOP
  // ═══════════════════════════════════════════════════════════════

  const renderRewardShopTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="space-y-4">
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20">
                <ShoppingBag className="size-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <CardTitle className="text-[18px] font-bold">Reward Shop</CardTitle>
                <p className="text-[13px] text-muted-foreground">{rewardShop.length} items · {rewardShop.filter(r => r.isActive).length} active</p>
              </div>
            </div>
            <Button className="rounded-xl gap-1.5 h-9 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white"
              onClick={() => { setRewardShopForm({ id: '', name: '', description: '', icon: '🎁', category: 'digital', coinCost: 100, xpCost: 0, stock: -1, isActive: true }); setIsAddMode(true); setEditDialog('rewardShop') }}>
              <Plus className="size-4" /> Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {rewardShop.map(item => (
              <div key={item.id} className="flex items-center gap-4 rounded-2xl border p-4 hover:bg-muted/30 transition-colors group">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 text-xl shrink-0">{item.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><p className="font-semibold truncate">{item.name}</p>{SHOP_CATEGORY_CONFIG[item.category] && <span className={cn('rounded-lg px-1.5 py-0.5 text-[10px] font-semibold shrink-0', SHOP_CATEGORY_CONFIG[item.category].badgeClass)}>{SHOP_CATEGORY_CONFIG[item.category].label}</span>}</div>
                  <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{item.description}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400"><Coins className="size-3" />{item.coinCost}</span>
                    {item.xpCost > 0 && <span className="text-[11px] font-medium text-yellow-600 dark:text-yellow-400">+{item.xpCost} XP</span>}
                    <span className="text-[11px] text-muted-foreground">{item.stock === -1 ? '∞ stock' : `${item.stock} left`}</span>
                    <span className="text-[11px] text-muted-foreground">{item.claimCount} claimed</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button onClick={() => handleToggle('/api/admin/gamification/reward-shop', item.id, !item.isActive, 'Item')} className="flex items-center gap-1.5"><div className={cn('size-2.5 rounded-full', item.isActive ? 'bg-emerald-500' : 'bg-gray-400')} /><span className={cn('text-[11px] font-medium', item.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500')}>{item.isActive ? 'Active' : 'Inactive'}</span></button>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="rounded-lg h-7 gap-1 text-[11px] px-2" onClick={() => { setRewardShopForm({ id: item.id, name: item.name, description: item.description, icon: item.icon, category: item.category, coinCost: item.coinCost, xpCost: item.xpCost, stock: item.stock, isActive: item.isActive }); setIsAddMode(false); setEditDialog('rewardShop') }}><Edit3 className="size-3" /></Button>
                    <Button variant="ghost" size="sm" className="rounded-lg h-7 text-red-500 hover:text-red-600 px-1" onClick={() => handleDelete('/api/admin/gamification/reward-shop', item.id, 'Shop Item')}><Trash2 className="size-3" /></Button>
                  </div>
                </div>
              </div>
            ))}
            {rewardShop.length === 0 && <div className="text-center py-10 col-span-full"><ShoppingBag className="size-8 text-muted-foreground mx-auto mb-2" /><p className="text-[13px] text-muted-foreground">No items yet. Add rewards that users can purchase with coins!</p></div>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 7 — STREAKS
  // ═══════════════════════════════════════════════════════════════

  const renderStreaksTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="space-y-4">
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20">
                <Flame className="size-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <CardTitle className="text-[18px] font-bold">Streak Rewards</CardTitle>
                <p className="text-[13px] text-muted-foreground">{streakRewards.length} milestones · {streakRewards.filter(r => r.isActive).length} active</p>
              </div>
            </div>
            <Button className="rounded-xl gap-1.5 h-9 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              onClick={() => { setStreakRewardForm({ id: '', streakDays: 7, xpBonus: 100, coinBonus: 10, badgeId: '', isActive: true }); setIsAddMode(true); setEditDialog('streakReward') }}>
              <Plus className="size-4" /> Add Milestone
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {streakRewards.map(reward => (
              <div key={reward.id} className="flex items-center gap-4 rounded-2xl border p-4 hover:bg-muted/30 transition-colors group">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 shrink-0">
                  <div className="text-center"><Flame className="size-5 text-orange-500 mx-auto" /><p className="text-[12px] font-bold text-orange-600 dark:text-orange-400 mt-0.5">{reward.streakDays}d</p></div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{reward.streakDays}-Day Streak Milestone</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-yellow-600 dark:text-yellow-400"><Zap className="size-3" />+{reward.xpBonus} XP</span>
                    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-amber-600 dark:text-amber-400"><Coins className="size-3" />+{reward.coinBonus} coins</span>
                    {reward.badge && <span className="inline-flex items-center gap-1 text-[12px] font-medium text-violet-600 dark:text-violet-400">{reward.badge.icon} {reward.badge.name}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => handleToggle('/api/admin/gamification/streak-rewards', reward.id, !reward.isActive, 'Streak reward')} className="flex items-center gap-1.5"><div className={cn('size-2.5 rounded-full', reward.isActive ? 'bg-emerald-500' : 'bg-gray-400')} /><span className={cn('text-[11px] font-medium', reward.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500')}>{reward.isActive ? 'Active' : 'Inactive'}</span></button>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="rounded-lg h-7 gap-1 text-[11px] px-2" onClick={() => { setStreakRewardForm({ id: reward.id, streakDays: reward.streakDays, xpBonus: reward.xpBonus, coinBonus: reward.coinBonus, badgeId: reward.badgeId || '', isActive: reward.isActive }); setIsAddMode(false); setEditDialog('streakReward') }}><Edit3 className="size-3" /></Button>
                    <Button variant="ghost" size="sm" className="rounded-lg h-7 text-red-500 hover:text-red-600 px-1" onClick={() => handleDelete('/api/admin/gamification/streak-rewards', reward.id, 'Streak Reward')}><Trash2 className="size-3" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 8 — EVENTS
  // ═══════════════════════════════════════════════════════════════

  const renderEventsTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="space-y-4">
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20">
                <Megaphone className="size-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <CardTitle className="text-[18px] font-bold">Gamification Events</CardTitle>
                <p className="text-[13px] text-muted-foreground">{events.length} events · {events.filter(isEventActive).length} currently active</p>
              </div>
            </div>
            <Button className="rounded-xl gap-1.5 h-9 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
              onClick={() => { setEventForm({ id: '', type: 'xp_bonus', title: '', description: '', icon: '🎉', xpMultiplier: 1.5, coinMultiplier: 1.0, startDate: '', endDate: '', isActive: true }); setIsAddMode(true); setEditDialog('event') }}>
              <Plus className="size-4" /> Create Event
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events.map(ev => {
              const active = isEventActive(ev)
              const expired = new Date(ev.endDate) < new Date()
              const upcoming = new Date(ev.startDate) > new Date()
              return (
                <div key={ev.id} className="flex items-center gap-4 rounded-2xl border p-4 hover:bg-muted/30 transition-colors group">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 text-xl shrink-0">{ev.icon}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{ev.title}</p>
                      {EVENT_TYPE_CONFIG[ev.type] && <span className={cn('rounded-lg px-1.5 py-0.5 text-[10px] font-semibold shrink-0', EVENT_TYPE_CONFIG[ev.type].badgeClass)}>{EVENT_TYPE_CONFIG[ev.type].label}</span>}
                      {active && <BadgeUI className="rounded-lg text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0">Live</BadgeUI>}
                      {upcoming && <BadgeUI className="rounded-lg text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-0">Upcoming</BadgeUI>}
                      {expired && <BadgeUI variant="secondary" className="rounded-lg text-[10px]">Ended</BadgeUI>}
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{ev.description}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {ev.xpMultiplier > 1 && <span className="text-[11px] font-medium text-yellow-600 dark:text-yellow-400"><Zap className="size-3 inline" /> {ev.xpMultiplier}x XP</span>}
                      {ev.coinMultiplier > 1 && <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400"><Coins className="size-3 inline" /> {ev.coinMultiplier}x Coins</span>}
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Calendar className="size-3" />{formatDate(ev.startDate)} – {formatDate(ev.endDate)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => handleToggle('/api/admin/gamification/events', ev.id, !ev.isActive, 'Event')} className="flex items-center gap-1.5"><div className={cn('size-2.5 rounded-full', ev.isActive ? 'bg-emerald-500' : 'bg-gray-400')} /><span className={cn('text-[11px] font-medium', ev.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500')}>{ev.isActive ? 'Active' : 'Inactive'}</span></button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="rounded-lg h-7 gap-1 text-[11px] px-2" onClick={() => { setEventForm({ id: ev.id, type: ev.type, title: ev.title, description: ev.description, icon: ev.icon, xpMultiplier: ev.xpMultiplier, coinMultiplier: ev.coinMultiplier, startDate: new Date(ev.startDate).toISOString().slice(0, 16), endDate: new Date(ev.endDate).toISOString().slice(0, 16), isActive: ev.isActive }); setIsAddMode(false); setEditDialog('event') }}><Edit3 className="size-3" /></Button>
                      <Button variant="ghost" size="sm" className="rounded-lg h-7 text-red-500 hover:text-red-600 px-1" onClick={() => handleDelete('/api/admin/gamification/events', ev.id, 'Event')}><Trash2 className="size-3" /></Button>
                    </div>
                  </div>
                </div>
              )
            })}
            {events.length === 0 && <div className="text-center py-10"><Megaphone className="size-8 text-muted-foreground mx-auto mb-2" /><p className="text-[13px] text-muted-foreground">No events yet. Create time-limited events to boost engagement!</p></div>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 9 — LEVEL CONFIG
  // ═══════════════════════════════════════════════════════════════

  const renderLevelConfigTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="space-y-4">
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20">
                <Medal className="size-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-[18px] font-bold">Level Configuration</CardTitle>
                <p className="text-[13px] text-muted-foreground">{levels.length} levels defined</p>
              </div>
            </div>
            <Button className="rounded-xl gap-1.5 h-9 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white"
              onClick={() => {
                const maxLevel = levels.length > 0 ? Math.max(...levels.map(l => l.level)) : 0
                const maxMaxXp = levels.length > 0 ? Math.max(...levels.map(l => l.maxXp)) : 500
                setLevelForm({ id: '', level: maxLevel + 1, title: '', minXp: maxMaxXp, maxXp: maxMaxXp + 5000, badgeIcon: '', coinReward: 0 }); setIsAddMode(true); setEditDialog('level')
              }}>
              <Plus className="size-4" /> Add Level
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {levels.map(lvl => (
              <div key={lvl.id} className="flex items-center gap-4 rounded-2xl border p-4 hover:bg-muted/30 transition-colors group">
                <div className="flex items-center gap-2 shrink-0"><span className="text-[22px]">{lvl.badgeIcon || '⭐'}</span><div className="text-center min-w-[50px]"><p className="text-[11px] text-muted-foreground">Level</p><p className="text-[20px] font-bold">{lvl.level}</p></div></div>
                <div className="min-w-0 flex-1"><p className="font-semibold">{lvl.title}</p><p className="text-[12px] text-muted-foreground mt-0.5">{formatXpRange(lvl.minXp, lvl.maxXp)}</p></div>
                <div className="flex items-center gap-3 shrink-0">
                  {lvl.coinReward > 0 && <span className="inline-flex items-center gap-1 text-[12px] font-medium text-amber-600 dark:text-amber-400"><Coins className="size-3" />+{lvl.coinReward}</span>}
                  <Button variant="ghost" size="sm" className="rounded-lg h-7 gap-1 text-[11px] px-2" onClick={() => { setLevelForm({ id: lvl.id, level: lvl.level, title: lvl.title, minXp: lvl.minXp, maxXp: lvl.maxXp, badgeIcon: lvl.badgeIcon || '', coinReward: lvl.coinReward }); setIsAddMode(false); setEditDialog('level') }}><Edit3 className="size-3" />Edit</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 10 — XP ACTIVITY LOG
  // ═══════════════════════════════════════════════════════════════

  const renderXpActivityTab = () => {
    const activityTotalPages = Math.ceil(activityTotal / 20)
    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="space-y-4">
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                  <Activity className="size-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <CardTitle className="text-[18px] font-bold">XP Activity Log</CardTitle>
                  <p className="text-[13px] text-muted-foreground">{activityTotal} total activities · {formatNumber(xpActivityRecent.totalXp)} XP in 30 days</p>
                </div>
              </div>
              <Button variant="outline" className="rounded-xl gap-1.5 h-9 text-[12px]" onClick={fetchXpActivity}><RefreshCw className="size-3.5" />Refresh</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border overflow-hidden">
              <table className="w-full text-[13px]">
                <thead><tr className="bg-muted/50 border-b">
                  <th className="text-left font-semibold px-4 py-3">User</th>
                  <th className="text-left font-semibold px-4 py-3">Action</th>
                  <th className="text-right font-semibold px-4 py-3">XP</th>
                  <th className="text-right font-semibold px-4 py-3">Coins</th>
                  <th className="text-left font-semibold px-4 py-3">Description</th>
                  <th className="text-right font-semibold px-4 py-3">Date</th>
                </tr></thead>
                <tbody>
                  {xpActivities.map(a => (
                    <tr key={a.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3"><div className="flex items-center gap-2">
                        <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-[10px] font-bold shrink-0">
                          {a.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'}
                        </div>
                        <span className="font-medium text-[12px]">{a.user?.name || 'Unknown'}</span>
                      </div></td>
                      <td className="px-4 py-3">{XP_ACTION_LABELS[a.action] || a.action}</td>
                      <td className="px-4 py-3 text-right"><span className={cn('font-semibold', a.xpAmount > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-muted-foreground')}>{a.xpAmount > 0 ? `+${a.xpAmount}` : '0'}</span></td>
                      <td className="px-4 py-3 text-right"><span className={cn('font-medium', a.coinAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground')}>{a.coinAmount > 0 ? `+${a.coinAmount}` : '0'}</span></td>
                      <td className="px-4 py-3 max-w-[200px] truncate text-[12px] text-muted-foreground">{a.description}</td>
                      <td className="px-4 py-3 text-right text-[12px] text-muted-foreground whitespace-nowrap">{formatDateTime(a.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {activityTotalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-[12px] text-muted-foreground">Page {activityPage} of {activityTotalPages} ({activityTotal} entries)</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl h-8 w-8 p-0" disabled={activityPage <= 1} onClick={() => setActivityPage(p => p - 1)}><ChevronLeft className="size-4" /></Button>
                  <Button variant="outline" size="sm" className="rounded-xl h-8 w-8 p-0" disabled={activityPage >= activityTotalPages} onClick={() => setActivityPage(p => p + 1)}><ChevronRight className="size-4" /></Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB — REWARDS + SETTINGS (combined)
  // ═══════════════════════════════════════════════════════════════

  const renderRewardsTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="space-y-4">
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20">
              <Gift className="size-5 text-pink-600 dark:text-pink-400" />
            </div>
            <div>
              <CardTitle className="text-[18px] font-bold">Leaderboard Rewards</CardTitle>
              <p className="text-[13px] text-muted-foreground">Monthly winner rewards and prize configuration</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-2xl border p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2"><Crown className="size-5 text-yellow-500" /><h3 className="text-[15px] font-bold">Top {settings?.topWinnerCount || 3} Winners (Monthly)</h3></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Reward Type</Label>
                <Select value={settings?.topWinnerRewardType || 'platform_credit'} onValueChange={(v) => settings && setSettings({ ...settings, topWinnerRewardType: v })}>
                  <SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="platform_credit">Platform Credit ($)</SelectItem><SelectItem value="coins">Shijl Coins</SelectItem><SelectItem value="none">No Reward</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label className="text-[13px] font-semibold">{settings?.topWinnerRewardType === 'coins' ? 'Coins per Winner' : '$ per Winner'}</Label>
                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] text-muted-foreground">{settings?.topWinnerRewardType === 'coins' ? '🪙' : '$'}</span>
                  <Input type="number" className="rounded-xl h-9 pl-8" value={settings?.topWinnerRewardAmount || 0} onChange={(e) => settings && setSettings({ ...settings, topWinnerRewardAmount: Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Number of Winners</Label>
                <Input type="number" className="rounded-xl h-9" value={settings?.topWinnerCount || 3} onChange={(e) => settings && setSettings({ ...settings, topWinnerCount: Number(e.target.value) })} min={1} max={10} />
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 rounded-xl p-3 flex items-center gap-2">
              <Info className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-[12px] text-amber-700 dark:text-amber-300">Each of the top {settings?.topWinnerCount || 3} users will receive {settings?.topWinnerRewardType === 'coins' ? <>{settings?.topWinnerRewardAmount || 0} <ShijlAIText /> Coins</> : settings?.topWinnerRewardType === 'none' ? 'no reward' : `$${settings?.topWinnerRewardAmount || 0} platform credit`}</p>
            </div>
          </div>
          <div className="rounded-2xl border p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2"><Shield className="size-5 text-blue-500" /><h3 className="text-[15px] font-bold">Streak Freeze</h3></div>
            <div className="flex items-center justify-between"><div><p className="text-[13px] font-medium">Enable Streak Freeze</p><p className="text-[12px] text-muted-foreground">Allow users to preserve streak by spending coins</p></div><Switch checked={settings?.streakFreezeEnabled ?? true} onCheckedChange={(v) => settings && setSettings({ ...settings, streakFreezeEnabled: v })} /></div>
            {settings?.streakFreezeEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div className="space-y-2"><Label className="text-[13px] font-semibold">Freeze Cost (Coins)</Label><Input type="number" className="rounded-xl h-9" value={settings?.streakFreezeCost || 50} onChange={(e) => settings && setSettings({ ...settings, streakFreezeCost: Number(e.target.value) })} /></div>
                <div className="space-y-2"><Label className="text-[13px] font-semibold">Max Freezes / Month</Label><Input type="number" className="rounded-xl h-9" value={settings?.maxStreakFreezesPerMonth || 3} onChange={(e) => settings && setSettings({ ...settings, maxStreakFreezesPerMonth: Number(e.target.value) })} /></div>
              </div>
            )}
          </div>
          <div className="rounded-2xl border p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2"><TrendingUp className="size-5 text-emerald-500" /><h3 className="text-[15px] font-bold">Streak XP Multiplier</h3></div>
            <div className="space-y-2"><Label className="text-[13px] font-semibold">XP Multiplier (1.0 = no bonus)</Label><Input type="number" step="0.1" min="1.0" max="3.0" className="rounded-xl h-9" value={settings?.streakXpMultiplier || 1.0} onChange={(e) => settings && setSettings({ ...settings, streakXpMultiplier: Number(e.target.value) })} /><p className="text-[11px] text-muted-foreground">E.g., 1.5 = 50% bonus XP for streak holders</p></div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  const renderSettingsTab = () => {
    const handleSaveSettings = async () => {
      if (!settings) return
      setSaving(true)
      try {
        await apiCall('/api/admin/gamification/settings', 'PATCH', settings)
        toast.success('Settings saved')
        fetchAllData()
      } catch { toast.error('Failed to save settings') }
      finally { setSaving(false) }
    }

    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="space-y-4">
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500/20 to-gray-500/20">
                  <Settings className="size-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <CardTitle className="text-[18px] font-bold">Gamification Settings</CardTitle>
                  <p className="text-[13px] text-muted-foreground">Master toggles and configuration</p>
                </div>
              </div>
              <Button className="rounded-xl gap-1.5 h-9 bg-gradient-to-r from-slate-600 to-gray-600 hover:from-slate-700 hover:to-gray-700 text-white" onClick={handleSaveSettings} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}{saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3"><h3 className="text-[15px] font-bold flex items-center gap-2"><ToggleRight className="size-4" /> Master Toggles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([
                  { key: 'xpEnabled', label: 'XP System', desc: 'Enable XP earning across the platform', icon: Zap, color: 'text-yellow-500' },
                  { key: 'badgesEnabled', label: 'Badges', desc: 'Enable badge earning and display', icon: Award, color: 'text-violet-500' },
                  { key: 'leaderboardsEnabled', label: 'Leaderboards', desc: 'Enable leaderboard rankings', icon: BarChart3, color: 'text-emerald-500' },
                  { key: 'streaksEnabled', label: 'Streaks', desc: 'Enable daily learning streaks', icon: Flame, color: 'text-orange-500' },
                  { key: 'rewardsEnabled', label: 'Rewards', desc: 'Enable coin rewards and redemptions', icon: Gift, color: 'text-pink-500' },
                  { key: 'challengesEnabled', label: 'Challenges', desc: 'Enable daily challenges', icon: Target, color: 'text-cyan-500' },
                  { key: 'eventsEnabled', label: 'Events', desc: 'Enable time-limited gamification events', icon: Megaphone, color: 'text-rose-500' },
                  { key: 'shopEnabled', label: 'Reward Shop', desc: 'Enable the coin-based reward shop', icon: ShoppingBag, color: 'text-teal-500' },
                ] as const).map(toggle => (
                  <div key={toggle.key} className="flex items-center justify-between rounded-xl border p-3">
                    <div className="flex items-center gap-3"><toggle.icon className={cn('size-5', toggle.color)} /><div><p className="text-[13px] font-medium">{toggle.label}</p><p className="text-[11px] text-muted-foreground">{toggle.desc}</p></div></div>
                    <Switch checked={settings?.[toggle.key] ?? true} onCheckedChange={(v) => settings && setSettings({ ...settings, [toggle.key]: v })} />
                  </div>
                ))}
              </div>
            </div>
            <Separator />
            <div className="space-y-3"><h3 className="text-[15px] font-bold flex items-center gap-2"><BarChart3 className="size-4" /> Leaderboard Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-[13px] font-semibold">Leaderboard Resets</Label>
                  <RadioGroup value={settings?.leaderboardResetFrequency || 'monthly'} onValueChange={(v) => settings && setSettings({ ...settings, leaderboardResetFrequency: v })} className="flex gap-4 mt-1">
                    <div className="flex items-center gap-2"><RadioGroupItem value="monthly" id="reset-monthly" /><Label htmlFor="reset-monthly" className="text-[13px] font-normal cursor-pointer">Monthly</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="weekly" id="reset-weekly" /><Label htmlFor="reset-weekly" className="text-[13px] font-normal cursor-pointer">Weekly</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="never" id="reset-never" /><Label htmlFor="reset-never" className="text-[13px] font-normal cursor-pointer">Never</Label></div>
                  </RadioGroup>
                </div>
                <div className="space-y-2"><Label className="text-[13px] font-semibold">Show Full Name</Label>
                  <RadioGroup value={settings?.leaderboardShowFullName ? 'yes' : 'no'} onValueChange={(v) => settings && setSettings({ ...settings, leaderboardShowFullName: v === 'yes' })} className="flex gap-4 mt-1">
                    <div className="flex items-center gap-2"><RadioGroupItem value="yes" id="name-yes" /><Label htmlFor="name-yes" className="text-[13px] font-normal cursor-pointer">Yes</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="no" id="name-no" /><Label htmlFor="name-no" className="text-[13px] font-normal cursor-pointer">Anonymous</Label></div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: DIALOGS
  // ═══════════════════════════════════════════════════════════════

  const renderDialogs = () => (
    <>
      {/* XP Rule Dialog */}
      <Dialog open={editDialog === 'xpRule'} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle className="text-[16px] font-bold">{isAddMode ? 'Add New XP Rule' : 'Edit XP Rule'}</DialogTitle><DialogDescription>{isAddMode ? 'Define a new action and its XP reward' : 'Modify the XP award for this action'}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            {isAddMode && <div className="space-y-2"><Label className="text-[13px] font-semibold">Action Key <span className="text-red-500">*</span></Label><Input className="rounded-xl h-9" placeholder="e.g., watch_video_replay" value={xpRuleForm.action} onChange={(e) => setXpRuleForm(p => ({ ...p, action: e.target.value }))} /><p className="text-[11px] text-muted-foreground">Unique identifier (snake_case)</p></div>}
            <div className="space-y-2"><Label className="text-[13px] font-semibold">Label <span className="text-red-500">*</span></Label><Input className="rounded-xl h-9" value={xpRuleForm.label} onChange={(e) => setXpRuleForm(p => ({ ...p, label: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="text-[13px] font-semibold">XP Awarded</Label><Input type="number" className="rounded-xl h-9" value={xpRuleForm.xpAwarded} onChange={(e) => setXpRuleForm(p => ({ ...p, xpAwarded: Number(e.target.value) }))} /></div>
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Coin Bonus</Label><Input type="number" className="rounded-xl h-9" value={xpRuleForm.coinAwarded} onChange={(e) => setXpRuleForm(p => ({ ...p, coinAwarded: Number(e.target.value) }))} /></div>
            </div>
            <div className="space-y-2"><Label className="text-[13px] font-semibold">Category</Label><Select value={xpRuleForm.category} onValueChange={(v) => setXpRuleForm(p => ({ ...p, category: v }))}><SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(CATEGORY_CONFIG).map(([k, c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="flex items-center justify-between"><Label className="text-[13px] font-semibold">Active</Label><Switch checked={xpRuleForm.isActive} onCheckedChange={(v) => setXpRuleForm(p => ({ ...p, isActive: v }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl h-9" onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button className="rounded-xl h-9 bg-gradient-to-r from-yellow-500 to-amber-500 text-white" onClick={() => handleSave('/api/admin/gamification/xp-rules', xpRuleForm, isAddMode)} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : isAddMode ? <Plus className="size-4" /> : <CheckCircle className="size-4" />}{isAddMode ? 'Create' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Badge Dialog */}
      <Dialog open={editDialog === 'badge'} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle className="text-[16px] font-bold">{isAddMode ? 'Create New Badge' : 'Edit Badge'}</DialogTitle><DialogDescription>{isAddMode ? 'Design a new achievement badge' : 'Modify badge details and rewards'}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Icon</Label><Input className="rounded-xl h-9 text-center text-lg" value={badgeForm.icon} onChange={(e) => setBadgeForm(p => ({ ...p, icon: e.target.value }))} /></div>
              <div className="col-span-3 space-y-2"><Label className="text-[13px] font-semibold">Name <span className="text-red-500">*</span></Label><Input className="rounded-xl h-9" value={badgeForm.name} onChange={(e) => setBadgeForm(p => ({ ...p, name: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label className="text-[13px] font-semibold">Description <span className="text-red-500">*</span></Label><Textarea className="rounded-xl min-h-[60px] resize-none" value={badgeForm.description} onChange={(e) => setBadgeForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="space-y-2"><Label className="text-[13px] font-semibold">Category</Label><Select value={badgeForm.category} onValueChange={(v) => setBadgeForm(p => ({ ...p, category: v }))}><SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(BADGE_CATEGORY_CONFIG).map(([k, c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="text-[13px] font-semibold">XP Reward</Label><Input type="number" className="rounded-xl h-9" value={badgeForm.xpReward} onChange={(e) => setBadgeForm(p => ({ ...p, xpReward: Number(e.target.value) }))} /></div>
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Coin Reward</Label><Input type="number" className="rounded-xl h-9" value={badgeForm.coinReward} onChange={(e) => setBadgeForm(p => ({ ...p, coinReward: Number(e.target.value) }))} /></div>
            </div>
            <div className="flex items-center justify-between"><Label className="text-[13px] font-semibold">Active</Label><Switch checked={badgeForm.isActive} onCheckedChange={(v) => setBadgeForm(p => ({ ...p, isActive: v }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl h-9" onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button className="rounded-xl h-9 bg-gradient-to-r from-violet-500 to-purple-500 text-white" onClick={() => handleSave('/api/admin/gamification/badges', badgeForm, isAddMode)} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : isAddMode ? <Plus className="size-4" /> : <CheckCircle className="size-4" />}{isAddMode ? 'Create' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Level Dialog */}
      <Dialog open={editDialog === 'level'} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle className="text-[16px] font-bold">{isAddMode ? 'Add New Level' : `Edit Level ${levelForm.level}`}</DialogTitle><DialogDescription>{isAddMode ? 'Define a new level threshold' : 'Modify level thresholds and title'}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Level Number</Label><Input type="number" className="rounded-xl h-9" value={levelForm.level} onChange={(e) => setLevelForm(p => ({ ...p, level: Number(e.target.value) }))} /></div>
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Title <span className="text-red-500">*</span></Label><Input className="rounded-xl h-9" value={levelForm.title} onChange={(e) => setLevelForm(p => ({ ...p, title: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Min XP</Label><Input type="number" className="rounded-xl h-9" value={levelForm.minXp} onChange={(e) => setLevelForm(p => ({ ...p, minXp: Number(e.target.value) }))} /></div>
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Max XP</Label><Input type="number" className="rounded-xl h-9" value={levelForm.maxXp} onChange={(e) => setLevelForm(p => ({ ...p, maxXp: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Badge Icon</Label><Input className="rounded-xl h-9 text-center text-lg" value={levelForm.badgeIcon} onChange={(e) => setLevelForm(p => ({ ...p, badgeIcon: e.target.value }))} /></div>
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Coin Reward</Label><Input type="number" className="rounded-xl h-9" value={levelForm.coinReward} onChange={(e) => setLevelForm(p => ({ ...p, coinReward: Number(e.target.value) }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl h-9" onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button className="rounded-xl h-9 bg-gradient-to-r from-indigo-500 to-blue-500 text-white" onClick={() => handleSave('/api/admin/gamification/levels', levelForm, isAddMode)} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : isAddMode ? <Plus className="size-4" /> : <CheckCircle className="size-4" />}{isAddMode ? 'Create' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Streak Reward Dialog */}
      <Dialog open={editDialog === 'streakReward'} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle className="text-[16px] font-bold">{isAddMode ? 'Add Streak Milestone' : 'Edit Streak Reward'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Streak Days</Label><Input type="number" className="rounded-xl h-9" value={streakRewardForm.streakDays} onChange={(e) => setStreakRewardForm(p => ({ ...p, streakDays: Number(e.target.value) }))} /></div>
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Linked Badge</Label>
                <Select value={streakRewardForm.badgeId || 'none'} onValueChange={(v) => setStreakRewardForm(p => ({ ...p, badgeId: v === 'none' ? '' : v }))}>
                  <SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">None</SelectItem>{badges.map(b => <SelectItem key={b.id} value={b.id}>{b.icon} {b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="text-[13px] font-semibold">XP Bonus</Label><Input type="number" className="rounded-xl h-9" value={streakRewardForm.xpBonus} onChange={(e) => setStreakRewardForm(p => ({ ...p, xpBonus: Number(e.target.value) }))} /></div>
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Coin Bonus</Label><Input type="number" className="rounded-xl h-9" value={streakRewardForm.coinBonus} onChange={(e) => setStreakRewardForm(p => ({ ...p, coinBonus: Number(e.target.value) }))} /></div>
            </div>
            <div className="flex items-center justify-between"><Label className="text-[13px] font-semibold">Active</Label><Switch checked={streakRewardForm.isActive} onCheckedChange={(v) => setStreakRewardForm(p => ({ ...p, isActive: v }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl h-9" onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button className="rounded-xl h-9 bg-gradient-to-r from-orange-500 to-red-500 text-white" onClick={() => handleSave('/api/admin/gamification/streak-rewards', streakRewardForm, isAddMode)} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : isAddMode ? <Plus className="size-4" /> : <CheckCircle className="size-4" />}{isAddMode ? 'Create' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Challenge Dialog */}
      <Dialog open={editDialog === 'challenge'} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader><DialogTitle className="text-[16px] font-bold">{isAddMode ? 'Create Daily Challenge' : 'Edit Challenge'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Icon</Label><Input className="rounded-xl h-9 text-center text-lg" value={challengeForm.icon} onChange={(e) => setChallengeForm(p => ({ ...p, icon: e.target.value }))} /></div>
              <div className="col-span-3 space-y-2"><Label className="text-[13px] font-semibold">Title <span className="text-red-500">*</span></Label><Input className="rounded-xl h-9" value={challengeForm.title} onChange={(e) => setChallengeForm(p => ({ ...p, title: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label className="text-[13px] font-semibold">Description</Label><Textarea className="rounded-xl min-h-[50px] resize-none" value={challengeForm.description} onChange={(e) => setChallengeForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Type</Label><Select value={challengeForm.type} onValueChange={(v) => setChallengeForm(p => ({ ...p, type: v }))}><SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(CHALLENGE_TYPE_CONFIG).map(([k, c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Target</Label><Input type="number" className="rounded-xl h-9" value={challengeForm.target} onChange={(e) => setChallengeForm(p => ({ ...p, target: Number(e.target.value) }))} /></div>
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Unit</Label><Input className="rounded-xl h-9" value={challengeForm.unit} onChange={(e) => setChallengeForm(p => ({ ...p, unit: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label className="text-[13px] font-semibold">XP Reward</Label><Input type="number" className="rounded-xl h-9" value={challengeForm.xpReward} onChange={(e) => setChallengeForm(p => ({ ...p, xpReward: Number(e.target.value) }))} /></div>
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Coin Reward</Label><Input type="number" className="rounded-xl h-9" value={challengeForm.coinReward} onChange={(e) => setChallengeForm(p => ({ ...p, coinReward: Number(e.target.value) }))} /></div>
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Difficulty</Label><Select value={challengeForm.difficulty} onValueChange={(v) => setChallengeForm(p => ({ ...p, difficulty: v }))}><SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(DIFFICULTY_CONFIG).map(([k, c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Date</Label><Input type="date" className="rounded-xl h-9" value={challengeForm.date} onChange={(e) => setChallengeForm(p => ({ ...p, date: e.target.value }))} /></div>
              <div className="space-y-2 flex items-end"><div className="flex items-center gap-2"><Switch checked={challengeForm.isActive} onCheckedChange={(v) => setChallengeForm(p => ({ ...p, isActive: v }))} /><Label className="text-[13px] font-medium">Active</Label></div></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl h-9" onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button className="rounded-xl h-9 bg-gradient-to-r from-cyan-500 to-sky-500 text-white" onClick={() => handleSave('/api/admin/gamification/challenges', challengeForm, isAddMode)} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : isAddMode ? <Plus className="size-4" /> : <CheckCircle className="size-4" />}{isAddMode ? 'Create' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reward Shop Dialog */}
      <Dialog open={editDialog === 'rewardShop'} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle className="text-[16px] font-bold">{isAddMode ? 'Add Reward Shop Item' : 'Edit Reward Item'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Icon</Label><Input className="rounded-xl h-9 text-center text-lg" value={rewardShopForm.icon} onChange={(e) => setRewardShopForm(p => ({ ...p, icon: e.target.value }))} /></div>
              <div className="col-span-3 space-y-2"><Label className="text-[13px] font-semibold">Name <span className="text-red-500">*</span></Label><Input className="rounded-xl h-9" value={rewardShopForm.name} onChange={(e) => setRewardShopForm(p => ({ ...p, name: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label className="text-[13px] font-semibold">Description</Label><Textarea className="rounded-xl min-h-[50px] resize-none" value={rewardShopForm.description} onChange={(e) => setRewardShopForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="space-y-2"><Label className="text-[13px] font-semibold">Category</Label><Select value={rewardShopForm.category} onValueChange={(v) => setRewardShopForm(p => ({ ...p, category: v }))}><SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(SHOP_CATEGORY_CONFIG).map(([k, c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Coin Cost <span className="text-red-500">*</span></Label><Input type="number" className="rounded-xl h-9" value={rewardShopForm.coinCost} onChange={(e) => setRewardShopForm(p => ({ ...p, coinCost: Number(e.target.value) }))} /></div>
              <div className="space-y-2"><Label className="text-[13px] font-semibold">XP Cost</Label><Input type="number" className="rounded-xl h-9" value={rewardShopForm.xpCost} onChange={(e) => setRewardShopForm(p => ({ ...p, xpCost: Number(e.target.value) }))} /></div>
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Stock (-1=∞)</Label><Input type="number" className="rounded-xl h-9" value={rewardShopForm.stock} onChange={(e) => setRewardShopForm(p => ({ ...p, stock: Number(e.target.value) }))} /></div>
            </div>
            <div className="flex items-center justify-between"><Label className="text-[13px] font-semibold">Active</Label><Switch checked={rewardShopForm.isActive} onCheckedChange={(v) => setRewardShopForm(p => ({ ...p, isActive: v }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl h-9" onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button className="rounded-xl h-9 bg-gradient-to-r from-teal-500 to-emerald-500 text-white" onClick={() => handleSave('/api/admin/gamification/reward-shop', rewardShopForm, isAddMode)} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : isAddMode ? <Plus className="size-4" /> : <CheckCircle className="size-4" />}{isAddMode ? 'Create' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Dialog */}
      <Dialog open={editDialog === 'event'} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle className="text-[16px] font-bold">{isAddMode ? 'Create Event' : 'Edit Event'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Icon</Label><Input className="rounded-xl h-9 text-center text-lg" value={eventForm.icon} onChange={(e) => setEventForm(p => ({ ...p, icon: e.target.value }))} /></div>
              <div className="col-span-3 space-y-2"><Label className="text-[13px] font-semibold">Title <span className="text-red-500">*</span></Label><Input className="rounded-xl h-9" value={eventForm.title} onChange={(e) => setEventForm(p => ({ ...p, title: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label className="text-[13px] font-semibold">Description</Label><Textarea className="rounded-xl min-h-[50px] resize-none" value={eventForm.description} onChange={(e) => setEventForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div className="space-y-2"><Label className="text-[13px] font-semibold">Event Type</Label><Select value={eventForm.type} onValueChange={(v) => setEventForm(p => ({ ...p, type: v }))}><SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(EVENT_TYPE_CONFIG).map(([k, c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="text-[13px] font-semibold">XP Multiplier</Label><Input type="number" step="0.1" className="rounded-xl h-9" value={eventForm.xpMultiplier} onChange={(e) => setEventForm(p => ({ ...p, xpMultiplier: Number(e.target.value) }))} /></div>
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Coin Multiplier</Label><Input type="number" step="0.1" className="rounded-xl h-9" value={eventForm.coinMultiplier} onChange={(e) => setEventForm(p => ({ ...p, coinMultiplier: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Start Date</Label><Input type="datetime-local" className="rounded-xl h-9" value={eventForm.startDate} onChange={(e) => setEventForm(p => ({ ...p, startDate: e.target.value }))} /></div>
              <div className="space-y-2"><Label className="text-[13px] font-semibold">End Date</Label><Input type="datetime-local" className="rounded-xl h-9" value={eventForm.endDate} onChange={(e) => setEventForm(p => ({ ...p, endDate: e.target.value }))} /></div>
            </div>
            <div className="flex items-center justify-between"><Label className="text-[13px] font-semibold">Active</Label><Switch checked={eventForm.isActive} onCheckedChange={(v) => setEventForm(p => ({ ...p, isActive: v }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl h-9" onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button className="rounded-xl h-9 bg-gradient-to-r from-pink-500 to-rose-500 text-white" onClick={() => handleSave('/api/admin/gamification/events', eventForm, isAddMode)} disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : isAddMode ? <Plus className="size-4" /> : <CheckCircle className="size-4" />}{isAddMode ? 'Create' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Award Dialog */}
      <Dialog open={bulkAwardOpen} onOpenChange={setBulkAwardOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle className="text-[16px] font-bold">Bulk Award XP/Coins</DialogTitle><DialogDescription>Award XP and/or coins to multiple users at once</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label className="text-[13px] font-semibold">User IDs <span className="text-red-500">*</span></Label><Textarea className="rounded-xl min-h-[80px] resize-none" placeholder="Paste user IDs, one per line" value={bulkAwardForm.userIds} onChange={(e) => setBulkAwardForm(p => ({ ...p, userIds: e.target.value }))} /><p className="text-[11px] text-muted-foreground">One user ID per line</p></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label className="text-[13px] font-semibold">XP Amount</Label><Input type="number" className="rounded-xl h-9" value={bulkAwardForm.xpAmount} onChange={(e) => setBulkAwardForm(p => ({ ...p, xpAmount: Number(e.target.value) }))} /></div>
              <div className="space-y-2"><Label className="text-[13px] font-semibold">Coin Amount</Label><Input type="number" className="rounded-xl h-9" value={bulkAwardForm.coinAmount} onChange={(e) => setBulkAwardForm(p => ({ ...p, coinAmount: Number(e.target.value) }))} /></div>
            </div>
            <div className="space-y-2"><Label className="text-[13px] font-semibold">Reason</Label><Input className="rounded-xl h-9" placeholder="e.g., Compensation for bug" value={bulkAwardForm.reason} onChange={(e) => setBulkAwardForm(p => ({ ...p, reason: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl h-9" onClick={() => setBulkAwardOpen(false)}>Cancel</Button>
            <Button className="rounded-xl h-9 bg-gradient-to-r from-yellow-500 to-amber-500 text-white" disabled={saving} onClick={async () => {
              const userIds = bulkAwardForm.userIds.split('\n').map(s => s.trim()).filter(Boolean)
              if (!userIds.length) { toast.error('Enter at least one user ID'); return }
              setSaving(true)
              try {
                await apiCall('/api/admin/gamification/bulk-actions', 'POST', { action: 'award_xp_coins', userIds, xpAmount: bulkAwardForm.xpAmount, coinAmount: bulkAwardForm.coinAmount, reason: bulkAwardForm.reason })
                toast.success(`Awarded to ${userIds.length} users`)
                setBulkAwardOpen(false)
                fetchAllData()
              } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed') }
              finally { setSaving(false) }
            }}>{saving ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />} Award</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(v) => setConfirmDialog(prev => ({ ...prev, open: v }))}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader><DialogTitle className="text-[16px] font-bold flex items-center gap-2"><AlertTriangle className="size-5 text-amber-500" />{confirmDialog.title}</DialogTitle><DialogDescription>{confirmDialog.description}</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl h-9" onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>Cancel</Button>
            <Button className="rounded-xl h-9 bg-red-600 hover:bg-red-700 text-white" onClick={confirmDialog.action}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )

  // ═══════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════

  const TABS = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'xp-rules', label: 'XP Rules', icon: Zap },
    { key: 'badges', label: 'Badges', icon: Award },
    { key: 'leaderboards', label: 'Leaderboard', icon: Crown },
    { key: 'challenges', label: 'Challenges', icon: Target },
    { key: 'reward-shop', label: 'Reward Shop', icon: ShoppingBag },
    { key: 'streaks', label: 'Streaks', icon: Flame },
    { key: 'events', label: 'Events', icon: Megaphone },
    { key: 'levels', label: 'Levels', icon: Medal },
    { key: 'xp-activity', label: 'Activity Log', icon: Activity },
    { key: 'rewards', label: 'Rewards', icon: Gift },
    { key: 'settings', label: 'Settings', icon: Settings },
  ]

  const TAB_RENDERERS: Record<string, () => React.ReactNode> = {
    'overview': renderOverviewTab,
    'xp-rules': renderXpRulesTab,
    'badges': renderBadgesTab,
    'leaderboards': renderLeaderboardsTab,
    'challenges': renderChallengesTab,
    'reward-shop': renderRewardShopTab,
    'streaks': renderStreaksTab,
    'events': renderEventsTab,
    'levels': renderLevelConfigTab,
    'xp-activity': renderXpActivityTab,
    'rewards': renderRewardsTab,
    'settings': renderSettingsTab,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20">
          <Trophy className="size-6 text-yellow-600 dark:text-yellow-400" />
        </div>
        <div>
          <h1 className="text-[22px] font-bold text-foreground">Gamification</h1>
          <p className="text-[14px] text-muted-foreground">Manage XP, badges, challenges, rewards, and engagement features</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1.5 rounded-2xl">
          {TABS.map(tab => (
            <TabsTrigger key={tab.key} value={tab.key} className="rounded-xl text-[12px] gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm px-3 py-1.5">
              <tab.icon className="size-3.5" />{tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map(tab => (
          <TabsContent key={tab.key} value={tab.key} className="mt-4">
            {TAB_RENDERERS[tab.key]?.()}
          </TabsContent>
        ))}
      </Tabs>

      {renderDialogs()}
    </div>
  )
}

export function AdminGamificationWrapped() {
  return <AdminGamification />
}
