'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  Sparkles,
  Bell,
  Flame,
  Target,
  BarChart3,
  BookOpen,
  Brain,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Loader2,
  RefreshCw,
  Send,
  MessageSquare,
  Trophy,
  Zap,
  Eye,
  EyeOff,
  Play,
  CircleDot,
  Route,
  Timer,
  ChevronRight,
  Circle,
  X,
} from 'lucide-react'
import { ShijlAIText } from '@/components/ui/brand-text'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface LearningCompanionProps {
  userId: string
  onAskShijlAI?: (context: string) => void
}

interface FocusTopic {
  topic: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  masteryScore?: number
  courseId?: string
}

interface CompanionInsight {
  id: string
  message: string
  type: 'inactivity_alert' | 'weak_topic' | 'study_plan_missed' | 'exam_approaching' | 'achievement' | 'recommendation' | 'check_in' | 'motivation'
  priority: 'urgent' | 'high' | 'normal' | 'low'
  isRead: boolean
  actionType: 'review_lesson' | 'take_quiz' | 'continue_path' | 'reschedule_plan' | 'start_session' | 'none'
  actionData: Record<string, string | number | boolean | null>
  createdAt: string
}

interface SuggestedAction {
  type: 'review_lesson' | 'take_quiz' | 'continue_path' | 'reschedule_plan' | 'start_session'
  label: string
  description: string
  courseId?: string
  lessonId?: string
  quizId?: string
  pathId?: string
  xpReward?: number
}

interface CompanionStats {
  totalInsights: number
  unreadCount: number
  streakDays: number
  avgMastery: number
  weeklyProgress: number
  coursesActive: number
  quizzesThisWeek: number
  lessonsCompleted: number
}

interface CompanionChat {
  greeting: string
  personality: 'coach' | 'mentor' | 'advisor'
}

interface CompanionDashboardResponse {
  todaysFocus: FocusTopic[]
  insights: CompanionInsight[]
  suggestedActions: SuggestedAction[]
  stats: CompanionStats
  companionChat: CompanionChat
  skillContextForAI: string
}

interface CompanionChatMessage {
  id: string
  role: 'user' | 'companion'
  content: string
  timestamp: number
}

/* ═══════════════════════════════════════════════════════
   CONFIG — COLORS & MAPPINGS
   ═══════════════════════════════════════════════════════ */

const priorityConfig: Record<string, {
  dot: string
  bg: string
  border: string
  text: string
  badgeBg: string
  badgeText: string
  label: string
}> = {
  urgent: {
    dot: 'bg-red-500',
    bg: 'bg-red-500/5',
    border: 'border-red-500/20',
    text: 'text-red-600 dark:text-red-400',
    badgeBg: 'bg-red-500/15',
    badgeText: 'text-red-600 dark:text-red-400',
    label: 'Urgent',
  },
  high: {
    dot: 'bg-amber-500',
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-600 dark:text-amber-400',
    label: 'High',
  },
  normal: {
    dot: 'bg-sky-500',
    bg: 'bg-sky-500/5',
    border: 'border-sky-500/20',
    text: 'text-sky-600 dark:text-sky-400',
    badgeBg: 'bg-sky-500/15',
    badgeText: 'text-sky-600 dark:text-sky-400',
    label: 'Normal',
  },
  low: {
    dot: 'bg-slate-400',
    bg: 'bg-slate-500/5',
    border: 'border-slate-500/20',
    text: 'text-slate-500 dark:text-slate-400',
    badgeBg: 'bg-slate-500/15',
    badgeText: 'text-slate-500 dark:text-slate-400',
    label: 'Low',
  },
}

const insightTypeConfig: Record<string, {
  icon: typeof Bell
  label: string
  badgeBg: string
  badgeText: string
}> = {
  inactivity_alert: { icon: Clock, label: 'Inactivity', badgeBg: 'bg-red-500/15', badgeText: 'text-red-600 dark:text-red-400' },
  weak_topic: { icon: AlertTriangle, label: 'Weak Topic', badgeBg: 'bg-amber-500/15', badgeText: 'text-amber-600 dark:text-amber-400' },
  study_plan_missed: { icon: CalendarClock, label: 'Plan Missed', badgeBg: 'bg-orange-500/15', badgeText: 'text-orange-600 dark:text-orange-400' },
  exam_approaching: { icon: Zap, label: 'Exam Alert', badgeBg: 'bg-sky-500/15', badgeText: 'text-sky-600 dark:text-sky-400' },
  achievement: { icon: Trophy, label: 'Achievement', badgeBg: 'bg-emerald-500/15', badgeText: 'text-emerald-600 dark:text-emerald-400' },
  recommendation: { icon: Sparkles, label: 'Recommendation', badgeBg: 'bg-violet-500/15', badgeText: 'text-violet-600 dark:text-violet-400' },
  check_in: { icon: MessageSquare, label: 'Check-in', badgeBg: 'bg-sky-500/15', badgeText: 'text-sky-600 dark:text-sky-400' },
  motivation: { icon: Flame, label: 'Motivation', badgeBg: 'bg-rose-500/15', badgeText: 'text-rose-600 dark:text-rose-400' },
}

const actionTypeConfig: Record<string, {
  icon: typeof BookOpen
  label: string
  color: string
}> = {
  review_lesson: { icon: BookOpen, label: 'Review Lesson', color: 'text-sky-600 dark:text-sky-400' },
  take_quiz: { icon: Brain, label: 'Take Quiz', color: 'text-violet-600 dark:text-violet-400' },
  continue_path: { icon: Route, label: 'Continue Path', color: 'text-teal-600 dark:text-teal-400' },
  reschedule_plan: { icon: CalendarClock, label: 'Reschedule', color: 'text-amber-600 dark:text-amber-400' },
  start_session: { icon: Timer, label: 'Start Session', color: 'text-emerald-600 dark:text-emerald-400' },
  none: { icon: Sparkles, label: 'View', color: 'text-muted-foreground' },
}

const suggestedActionConfig: Record<string, {
  icon: typeof BookOpen
  gradient: string
  iconBg: string
  borderColor: string
}> = {
  review_lesson: {
    icon: BookOpen,
    gradient: 'from-sky-500/10 to-blue-500/10',
    iconBg: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
    borderColor: 'border-sky-500/20',
  },
  take_quiz: {
    icon: Brain,
    gradient: 'from-violet-500/10 to-purple-500/10',
    iconBg: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
    borderColor: 'border-violet-500/20',
  },
  continue_path: {
    icon: Route,
    gradient: 'from-teal-500/10 to-cyan-500/10',
    iconBg: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
    borderColor: 'border-teal-500/20',
  },
  start_session: {
    icon: Timer,
    gradient: 'from-emerald-500/10 to-green-500/10',
    iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    borderColor: 'border-emerald-500/20',
  },
  reschedule_plan: {
    icon: CalendarClock,
    gradient: 'from-amber-500/10 to-yellow-500/10',
    iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-500/20',
  },
}

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getMasteryColor(score: number): { text: string; bar: string } {
  if (score >= 90) return { text: 'text-emerald-600 dark:text-emerald-400', bar: '[&>div]:bg-emerald-500' }
  if (score >= 75) return { text: 'text-teal-600 dark:text-teal-400', bar: '[&>div]:bg-teal-500' }
  if (score >= 50) return { text: 'text-amber-600 dark:text-amber-400', bar: '[&>div]:bg-amber-500' }
  if (score >= 25) return { text: 'text-orange-600 dark:text-orange-400', bar: '[&>div]:bg-orange-500' }
  return { text: 'text-red-600 dark:text-red-400', bar: '[&>div]:bg-red-500' }
}

function getPriorityBadge(priority: string): 'high' | 'medium' | 'low' {
  if (priority === 'high' || priority === 'urgent') return 'high'
  if (priority === 'normal') return 'medium'
  return 'low'
}

function renderCompanionMessage(content: string): string {
  // Simple markdown-ish rendering for companion messages
  return content
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENT: AIInsightBanner
   ═══════════════════════════════════════════════════════ */

function AIInsightBanner({
  greeting,
  personality,
  onAskShijlAI,
}: {
  greeting: string
  personality: 'coach' | 'mentor' | 'advisor'
  onAskShijlAI?: (context: string) => void
}) {
  const personalityLabel = personality === 'coach' ? 'Coach' : personality === 'mentor' ? 'Mentor' : 'Advisor'

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-sky-500/20 bg-gradient-to-r from-sky-500/8 via-blue-500/8 to-indigo-500/8 p-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shrink-0">
          <Bot className="size-5" />
          <Sparkles className="size-2.5 absolute -top-0.5 -right-0.5 text-yellow-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-foreground">Your AI Companion</h3>
            <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[9px] px-1.5 py-0 border-0">
              ✦ {personalityLabel}
            </Badge>
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">&ldquo;{greeting}&rdquo;</p>
          {onAskShijlAI && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-7 text-[11px] gap-1.5 text-sky-600 dark:text-sky-400 hover:text-sky-700 hover:bg-sky-500/10 px-2"
              onClick={() => onAskShijlAI('Ask about my overall learning progress and what I should focus on next')}
            >
              <Sparkles className="size-3" />
              Ask about my progress
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENT: CompanionStatsRow
   ═══════════════════════════════════════════════════════ */

function CompanionStatsRow({ stats }: { stats: CompanionStats }) {
  const statCards = [
    {
      label: 'Unread Insights',
      value: stats.unreadCount,
      icon: Bell,
      iconBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
      subtext: stats.unreadCount > 0 ? 'Needs attention' : 'All caught up',
      urgency: stats.unreadCount >= 3 ? 'text-red-500' : stats.unreadCount >= 1 ? 'text-amber-500' : 'text-emerald-500',
    },
    {
      label: 'Active Streak',
      value: `${stats.streakDays}`,
      icon: Flame,
      iconBg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      subtext: stats.streakDays >= 7 ? '🔥 On fire!' : stats.streakDays > 0 ? 'Keep going!' : 'Start today',
      urgency: '',
    },
    {
      label: 'Avg Mastery',
      value: `${stats.avgMastery}%`,
      icon: BarChart3,
      iconBg: getMasteryColor(stats.avgMastery).text.includes('emerald') ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        : getMasteryColor(stats.avgMastery).text.includes('amber') ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
        : 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
      subtext: stats.avgMastery >= 70 ? 'Great progress' : 'Room to grow',
      urgency: '',
    },
    {
      label: "Today's Focus",
      value: stats.coursesActive,
      icon: Target,
      iconBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
      subtext: `active course${stats.coursesActive !== 1 ? 's' : ''}`,
      urgency: '',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statCards.map((stat, i) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border/40 bg-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('flex size-8 items-center justify-center rounded-lg', stat.iconBg)}>
                <Icon className="size-4" />
              </div>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              {stat.urgency && (
                <div className={cn('size-2 rounded-full ml-auto', stat.urgency, 'animate-pulse')} />
              )}
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">{stat.subtext}</p>
          </motion.div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENT: TodaysFocusSection
   ═══════════════════════════════════════════════════════ */

function TodaysFocusSection({
  focusTopics,
  onAskShijlAI,
}: {
  focusTopics: FocusTopic[]
  onAskShijlAI?: (context: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (focusTopics.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Target className="size-4 text-sky-500" />
        <h3 className="text-sm font-bold text-foreground">Today&apos;s Focus</h3>
        <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[9px] px-1.5 py-0 border-0">
          {focusTopics.length} items
        </Badge>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin"
      >
        {focusTopics.map((topic, i) => {
          const masteryColor = getMasteryColor(topic.masteryScore ?? 0)
          const priorityConf = topic.priority === 'high'
            ? { bg: 'bg-red-500/15', text: 'text-red-600 dark:text-red-400', label: 'High' }
            : topic.priority === 'medium'
              ? { bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400', label: 'Medium' }
              : { bg: 'bg-sky-500/15', text: 'text-sky-600 dark:text-sky-400', label: 'Low' }

          return (
            <motion.button
              key={topic.topic}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => onAskShijlAI?.(`Help me improve ${topic.topic}. Current mastery: ${topic.masteryScore ?? 0}%. ${topic.reason}`)}
              className="flex-shrink-0 w-56 rounded-2xl border border-border/40 bg-card p-4 hover:border-sky-500/30 hover:bg-sky-500/5 transition-all text-left group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                  {topic.topic}
                </span>
                <Badge className={cn('text-[8px] px-1.5 py-0 border-0 font-bold', priorityConf.bg, priorityConf.text)}>
                  {priorityConf.label}
                </Badge>
              </div>

              {topic.masteryScore !== undefined && (
                <div className="flex items-center gap-2 mb-2">
                  <Progress value={topic.masteryScore} className={cn('h-1.5 flex-1', masteryColor.bar)} />
                  <span className={cn('text-[11px] font-bold', masteryColor.text)}>{topic.masteryScore}%</span>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{topic.reason}</p>

              <div className="flex items-center gap-1 mt-2 text-[10px] text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Sparkles className="size-3" />
                <span>Ask Companion</span>
                <ChevronRight className="size-3" />
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENT: InsightCard
   ═══════════════════════════════════════════════════════ */

function InsightCard({
  insight,
  onMarkRead,
  onAction,
}: {
  insight: CompanionInsight
  onMarkRead: (id: string) => void
  onAction: (insight: CompanionInsight) => void
}) {
  const pConf = priorityConfig[insight.priority] || priorityConfig.normal
  const tConf = insightTypeConfig[insight.type] || insightTypeConfig.check_in
  const aConf = actionTypeConfig[insight.actionType] || actionTypeConfig.none
  const ActionIcon = aConf.icon
  const TypeIcon = tConf.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: insight.isRead ? 0.65 : 1, y: 0 }}
      className={cn(
        'rounded-xl border p-4 transition-all',
        insight.isRead ? 'border-border/20 bg-muted/20' : cn('bg-card', pConf.border),
        !insight.isRead && 'hover:border-sky-500/30'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Priority dot */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <div className={cn('size-2.5 rounded-full shrink-0', pConf.dot, !insight.isRead && 'animate-pulse')} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <Badge className={cn('text-[8px] px-1.5 py-0 border-0 font-semibold', tConf.badgeBg, tConf.badgeText)}>
              <TypeIcon className="size-2.5 mr-0.5" />
              {tConf.label}
            </Badge>
            <Badge className={cn('text-[8px] px-1.5 py-0 border-0 font-bold', pConf.badgeBg, pConf.badgeText)}>
              {pConf.label}
            </Badge>
            {!insight.isRead && (
              <Badge className="text-[8px] px-1.5 py-0 border-0 bg-sky-500/15 text-sky-600 dark:text-sky-400 font-semibold">
                New
              </Badge>
            )}
            <span className="text-[10px] text-muted-foreground/60 ml-auto">{timeAgo(insight.createdAt)}</span>
          </div>

          <p className={cn(
            'text-[12px] leading-relaxed',
            insight.isRead ? 'text-muted-foreground' : 'text-foreground'
          )}>
            {insight.message}
          </p>

          {/* Action row */}
          <div className="flex items-center gap-2 mt-3">
            {insight.actionType !== 'none' && !insight.isRead && (
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'h-7 text-[10px] gap-1.5 border-sky-500/30 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10'
                )}
                onClick={() => onAction(insight)}
              >
                <ActionIcon className="size-3" />
                {aConf.label}
              </Button>
            )}

            {!insight.isRead && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => onMarkRead(insight.id)}
              >
                <Eye className="size-3" />
                Mark as read
              </Button>
            )}

            {insight.isRead && (
              <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                <CheckCircle2 className="size-3" />
                Read
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENT: AIInsightsFeed
   ═══════════════════════════════════════════════════════ */

function AIInsightsFeed({
  insights,
  onMarkRead,
  onAction,
}: {
  insights: CompanionInsight[]
  onMarkRead: (id: string) => void
  onAction: (insight: CompanionInsight) => void
}) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all')

  const filteredInsights = insights.filter(insight => {
    if (filter === 'unread') return !insight.isRead
    if (filter === 'urgent') return insight.priority === 'urgent' || insight.priority === 'high'
    return true
  })

  const unreadCount = insights.filter(i => !i.isRead).length
  const urgentCount = insights.filter(i => i.priority === 'urgent' || i.priority === 'high').length

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Bell className="size-4 text-sky-500" />
        <h3 className="text-sm font-bold text-foreground">AI Insights</h3>
        {unreadCount > 0 && (
          <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[9px] px-1.5 py-0 border-0">
            {unreadCount} new
          </Badge>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5">
        {[
          { key: 'all' as const, label: 'All', count: insights.length },
          { key: 'unread' as const, label: 'Unread', count: unreadCount },
          { key: 'urgent' as const, label: 'Urgent', count: urgentCount },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'text-[10px] px-2.5 py-1 rounded-full font-medium transition-all border',
              filter === tab.key
                ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                : 'bg-card text-muted-foreground border-border/40 hover:border-sky-500/30 hover:text-foreground'
            )}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Insight cards */}
      <div className="space-y-2.5 max-h-96 overflow-y-auto scrollbar-thin pr-1">
        {filteredInsights.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle2 className="size-8 text-emerald-500/40 mb-2" />
            <p className="text-[12px] text-muted-foreground">No insights match this filter</p>
          </div>
        ) : (
          <AnimatePresence>
            {filteredInsights.map(insight => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onMarkRead={onMarkRead}
                onAction={onAction}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENT: SuggestedActionsSection
   ═══════════════════════════════════════════════════════ */

function SuggestedActionsSection({
  actions,
  onAskShijlAI,
}: {
  actions: SuggestedAction[]
  onAskShijlAI?: (context: string) => void
}) {
  if (actions.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="size-4 text-sky-500" />
        <h3 className="text-sm font-bold text-foreground">Suggested Actions</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((action, i) => {
          const conf = suggestedActionConfig[action.type] || suggestedActionConfig.review_lesson
          const Icon = conf.icon

          return (
            <motion.div
              key={action.type + action.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn(
                'rounded-xl border bg-gradient-to-br p-4 transition-all hover:shadow-sm',
                conf.borderColor,
                conf.gradient
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn('flex size-9 items-center justify-center rounded-lg shrink-0', conf.iconBg)}>
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[12px] font-semibold text-foreground mb-0.5">{action.label}</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{action.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        'h-7 text-[10px] gap-1',
                        conf.borderColor,
                        conf.iconBg.replace('bg-', 'text-').replace('/15', ''),
                        'hover:opacity-80'
                      )}
                      onClick={() => onAskShijlAI?.(`I want to ${action.label}. ${action.description}`)}
                    >
                      <Play className="size-3" />
                      Start
                    </Button>
                    {action.xpReward && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-0.5">
                        <Zap className="size-3" />
                        +{action.xpReward} XP
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENT: CompanionChatSection
   ═══════════════════════════════════════════════════════ */

function CompanionChatSection({
  userId,
  greeting,
  personality,
  onAskShijlAI,
}: {
  userId: string
  greeting: string
  personality: 'coach' | 'mentor' | 'advisor'
  onAskShijlAI?: (context: string) => void
}) {
  const [messages, setMessages] = useState<CompanionChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Show greeting as first companion message
  useEffect(() => {
    if (messages.length === 0 && greeting) {
      setMessages([{
        id: 'companion-greeting',
        role: 'companion',
        content: greeting,
        timestamp: Date.now(),
      }])
    }
  }, [greeting])

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMsg: CompanionChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          userId,
          message: input.trim(),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const responseText = typeof data.message === 'string'
          ? data.message
          : data.message?.content || data.response || "I'd love to help! What would you like to focus on?"

        setMessages(prev => [...prev, {
          id: `companion-${Date.now()}`,
          role: 'companion',
          content: responseText,
          timestamp: Date.now(),
        }])
      } else {
        setMessages(prev => [...prev, {
          id: `companion-${Date.now()}`,
          role: 'companion',
          content: "I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: Date.now(),
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `companion-${Date.now()}`,
        role: 'companion',
        content: "Connection issue — please try again.",
        timestamp: Date.now(),
      }])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, userId])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickPrompts = [
    'How am I doing?',
    "What should I focus on?",
    'Am I on track?',
  ]

  const personalityEmoji = personality === 'coach' ? '💪' : personality === 'mentor' ? '🧭' : '📊'

  return (
    <div className="rounded-2xl border border-sky-500/15 bg-gradient-to-b from-sky-500/5 to-blue-500/5 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => {
          setIsExpanded(!isExpanded)
          if (!isExpanded) setTimeout(() => inputRef.current?.focus(), 100)
        }}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-sky-500/5 transition-colors"
      >
        <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 text-white shrink-0">
          <Bot className="size-4" />
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-semibold text-foreground">Ask your Companion</span>
            <span className="text-[10px]">{personalityEmoji}</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Knows your skills, progress & planner</span>
        </div>
        <ChevronRight className={cn(
          'size-4 text-muted-foreground transition-transform',
          isExpanded && 'rotate-90'
        )} />
      </button>

      {/* Chat area */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-sky-500/10 pt-3">
              {/* Messages */}
              <div className="max-h-64 overflow-y-auto scrollbar-thin space-y-2.5 pr-1">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-xl px-3 py-2 text-[11px] leading-relaxed',
                        msg.role === 'user'
                          ? 'bg-sky-500 text-white rounded-br-sm'
                          : 'bg-card border border-border/30 text-foreground rounded-bl-sm'
                      )}
                    >
                      {msg.role === 'companion' && (
                        <div className="flex items-center gap-1 mb-1">
                          <Bot className="size-3 text-sky-500" />
                          <span className="text-[9px] font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">Companion</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-card border border-border/30 rounded-xl rounded-bl-sm px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <Bot className="size-3 text-sky-500" />
                        <div className="flex gap-1">
                          <span className="size-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="size-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="size-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Quick prompts */}
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => {
                      setInput(prompt)
                      // Auto-send quick prompts
                      setTimeout(() => {
                        const userMsg: CompanionChatMessage = {
                          id: `user-${Date.now()}`,
                          role: 'user',
                          content: prompt,
                          timestamp: Date.now(),
                        }
                        setMessages(prev => [...prev, userMsg])
                        setIsLoading(true)

                        fetch('/api/ai/companion', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'chat', userId, message: prompt }),
                        })
                          .then(res => res.json())
                          .then(data => {
                            const responseText = typeof data.message === 'string'
                              ? data.message
                              : data.message?.content || data.response || "I'd love to help!"
                            setMessages(prev => [...prev, {
                              id: `companion-${Date.now()}`,
                              role: 'companion',
                              content: responseText,
                              timestamp: Date.now(),
                            }])
                          })
                          .catch(() => {
                            setMessages(prev => [...prev, {
                              id: `companion-${Date.now()}`,
                              role: 'companion',
                              content: "Connection issue — please try again.",
                              timestamp: Date.now(),
                            }])
                          })
                          .finally(() => setIsLoading(false))
                        setInput('')
                      }, 50)
                    }}
                    className="text-[10px] px-2.5 py-1 rounded-full border border-sky-500/20 bg-sky-500/5 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask your companion anything..."
                  disabled={isLoading}
                  className="h-9 text-[12px] border-sky-500/20 focus:ring-sky-500/30 focus:border-sky-500/30 bg-card"
                />
                <Button
                  size="sm"
                  disabled={!input.trim() || isLoading}
                  onClick={handleSend}
                  className="h-9 px-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shrink-0"
                >
                  <Send className="size-3.5" />
                </Button>
              </div>

              {/* ShijlAI link */}
              {onAskShijlAI && (
                <div className="flex items-center gap-1 pt-1">
                  <span className="text-[9px] text-muted-foreground/60">Need deeper help?</span>
                  <button
                    onClick={() => onAskShijlAI('I need detailed help with my learning progress. Can you provide more in-depth guidance?')}
                    className="text-[9px] text-sky-500 hover:text-sky-600 underline underline-offset-2"
                  >
                    Ask <ShijlAIText />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   LOADING SKELETON
   ═══════════════════════════════════════════════════════ */

function CompanionSkeleton() {
  return (
    <div className="space-y-4">
      {/* Banner skeleton */}
      <div className="rounded-2xl border border-border/20 p-5">
        <div className="flex items-start gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/20 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="size-8 rounded-lg" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Focus skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="w-56 h-32 rounded-2xl flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Insights skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-1.5">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/20 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20 rounded-full" />
              <Skeleton className="h-4 w-12 rounded-full" />
              <Skeleton className="h-3 w-12 ml-auto" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>

      {/* Actions skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Chat skeleton */}
      <Skeleton className="h-14 rounded-2xl" />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT: LearningCompanionTab
   ═══════════════════════════════════════════════════════ */

export function LearningCompanionTab({ userId, onAskShijlAI }: LearningCompanionProps) {
  // Data state
  const [data, setData] = useState<CompanionDashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [insights, setInsights] = useState<CompanionInsight[]>([])

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/ai/companion?userId=${userId}`)
      if (!res.ok) throw new Error(`Failed to fetch companion data: ${res.status}`)
      const json: CompanionDashboardResponse = await res.json()
      setData(json)
      setInsights(json.insights)
    } catch (err) {
      console.error('[LearningCompanionTab] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load companion data')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Mark insight as read
  const handleMarkRead = useCallback(async (messageId: string) => {
    // Optimistic update
    setInsights(prev => prev.map(i => i.id === messageId ? { ...i, isRead: true } : i))

    // API call
    try {
      await fetch('/api/ai/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', userId, messageId }),
      })
    } catch {
      // Silently fail — optimistic update already applied
    }
  }, [userId])

  // Handle insight action
  const handleInsightAction = useCallback((insight: CompanionInsight) => {
    const actionContextMap: Record<string, string> = {
      review_lesson: `I want to review a lesson. ${insight.message}`,
      take_quiz: `I want to take a quiz. ${insight.message}`,
      continue_path: `I want to continue my learning path. ${insight.message}`,
      reschedule_plan: `I need to reschedule my study plan. ${insight.message}`,
      start_session: `I want to start a study session. ${insight.message}`,
    }

    // Mark as read
    handleMarkRead(insight.id)

    // Trigger action
    const context = actionContextMap[insight.actionType] || insight.message
    onAskShijlAI?.(context)
  }, [handleMarkRead, onAskShijlAI])

  /* ─── RENDER ─── */

  // Loading state
  if (loading) {
    return <CompanionSkeleton />
  }

  // Error state
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-border/40">
        <Bot className="size-10 text-muted-foreground/30 mb-3" />
        <h3 className="text-sm font-semibold text-foreground mb-1">Failed to load AI Companion</h3>
        <p className="text-xs text-muted-foreground mb-3">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-[11px] gap-1.5"
          onClick={fetchData}
        >
          <RefreshCw className="size-3" />
          Retry
        </Button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-5">
      {/* ─── 1. AI Insight Banner ─── */}
      <AIInsightBanner
        greeting={data.companionChat.greeting}
        personality={data.companionChat.personality}
        onAskShijlAI={onAskShijlAI ? () => onAskShijlAI(data.skillContextForAI) : undefined}
      />

      {/* ─── 2. Stats Row ─── */}
      <CompanionStatsRow stats={data.stats} />

      {/* ─── 3. Today's Focus Section ─── */}
      {data.todaysFocus.length > 0 && (
        <TodaysFocusSection
          focusTopics={data.todaysFocus}
          onAskShijlAI={onAskShijlAI}
        />
      )}

      {/* ─── 4. AI Insights Feed (MAIN SECTION) ─── */}
      <AIInsightsFeed
        insights={insights}
        onMarkRead={handleMarkRead}
        onAction={handleInsightAction}
      />

      {/* ─── 5. Suggested Actions Section ─── */}
      {data.suggestedActions.length > 0 && (
        <SuggestedActionsSection
          actions={data.suggestedActions}
          onAskShijlAI={onAskShijlAI}
        />
      )}

      {/* ─── 6. Companion Chat (inline) ─── */}
      <CompanionChatSection
        userId={userId}
        greeting={data.companionChat.greeting}
        personality={data.companionChat.personality}
        onAskShijlAI={onAskShijlAI}
      />
    </div>
  )
}
