'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  BookOpen,
  Target,
  ClipboardList,
  Activity,
  TrendingUp,
  Trophy,
  Lock,
  Star,
  Flame,
  Zap,
  Crown,
  Award,
  Loader2,
  ChevronRight,
  BarChart3,
  Brain,
  GraduationCap,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  Users,
  ArrowUp,
  ArrowDown,
  Minus,
  Medal,
  Pencil,
  Trash2,
  Plus,
  Gift,
  Snowflake,
  CalendarDays,
  Rocket,
  Timer,
  ListChecks,
  CircleDot,
  Search,
  Filter,
  LayoutGrid,
  TrendingDown,
  CircleCheck,
  CircleX,
  Circle,
  Hash,
  Swords,
  Coins,
  ZapOff,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type {
  ProgressData,
  SkillProgress,
  BadgeWithStatus,
  CourseProgress,
  EnhancedProgressData,
  LearningGoal,
  DailyChallenge,
  XpActivity,
  StreakInfo,
  WeeklyReport,
  LeaderboardEntry,
} from '@/lib/types'

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}min`
  return `${minutes}min`
}

function getSkillLevelLabel(level: string): { label: string; color: string; icon: React.ReactNode } {
  switch (level) {
    case 'expert': return { label: 'Expert', color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30', icon: <Crown className="size-3" /> }
    case 'advanced': return { label: 'Advanced', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30', icon: <CheckCircle2 className="size-3" /> }
    case 'intermediate': return { label: 'Intermediate', color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30', icon: <TrendingUp className="size-3" /> }
    default: return { label: 'Beginner', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30', icon: <ArrowUpRight className="size-3" /> }
  }
}

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'hard': return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
    case 'medium': return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
    default: return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
  }
}

function getChangeIcon(percent: number) {
  if (percent > 0) return <ArrowUp className="size-3 text-emerald-500" />
  if (percent < 0) return <ArrowDown className="size-3 text-red-500" />
  return <Minus className="size-3 text-muted-foreground" />
}

function getChangeColor(percent: number): string {
  if (percent > 0) return 'text-emerald-600 dark:text-emerald-400'
  if (percent < 0) return 'text-red-600 dark:text-red-400'
  return 'text-muted-foreground'
}

function getChallengeIcon(type: string) {
  switch (type) {
    case 'lesson': return <BookOpen className="size-4" />
    case 'quiz': return <Target className="size-4" />
    case 'streak': return <Flame className="size-4" />
    case 'xp': return <Zap className="size-4" />
    case 'time': return <Timer className="size-4" />
    case 'assignment': return <ClipboardList className="size-4" />
    default: return <CircleDot className="size-4" />
  }
}

function getGoalTypeLabel(type: string): string {
  switch (type) {
    case 'weekly_xp': return 'Weekly XP'
    case 'weekly_time': return 'Weekly Time'
    case 'weekly_lessons': return 'Weekly Lessons'
    case 'monthly_xp': return 'Monthly XP'
    case 'monthly_courses': return 'Monthly Courses'
    case 'custom': return 'Custom'
    default: return type
  }
}

function getXpActivityIcon(action: string) {
  const a = action.toLowerCase()
  if (a.includes('quiz')) return <Target className="size-4 text-teal-500" />
  if (a.includes('lesson')) return <BookOpen className="size-4 text-emerald-500" />
  if (a.includes('streak')) return <Flame className="size-4 text-orange-500" />
  if (a.includes('badge') || a.includes('achievement')) return <Award className="size-4 text-purple-500" />
  if (a.includes('assignment')) return <ClipboardList className="size-4 text-amber-500" />
  if (a.includes('course')) return <GraduationCap className="size-4 text-blue-500" />
  return <Zap className="size-4 text-yellow-500" />
}

// ═══════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════

// ─── Segmented Control ───
function SegmentedControl({ options, value, onChange }: { options: { value: string; label: string; icon?: React.ReactNode; count?: number }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex rounded-xl bg-muted/60 p-1 overflow-x-auto scrollbar-none gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[12px] font-medium transition-all ios-press ${
            value === opt.value
              ? 'bg-card ios-shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {opt.icon}
          {opt.label}
          {opt.count !== undefined && opt.count > 0 && (
            <span className={`min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1 ${
              value === opt.value ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {opt.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ─── Metric Card ───
function MetricCard({ icon: Icon, label, value, subtext, color, index = 0 }: { icon: React.ElementType; label: string; value: string | number; subtext?: string; color: string; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 400, damping: 25 }}
      className="rounded-2xl ios-shadow-sm bg-card p-4 relative overflow-hidden"
    >
      <div className="flex items-start gap-3">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[22px] font-bold leading-tight">{value}</p>
          <p className="text-[13px] text-muted-foreground">{label}</p>
          {subtext && <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">{subtext}</p>}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Heatmap Grid ───
function HeatmapGrid({ data }: { data: { date: string; xp: number; active: boolean }[] }) {
  const weeks = useMemo(() => {
    const result: { date: string; xp: number; active: boolean }[][] = []
    for (let i = 0; i < data.length; i += 7) {
      result.push(data.slice(i, i + 7))
    }
    return result
  }, [data])

  const getColor = (xp: number, active: boolean) => {
    if (!active && xp === 0) return 'bg-muted/50'
    if (xp === 0) return 'bg-muted/60'
    if (xp < 25) return 'bg-emerald-200 dark:bg-emerald-900'
    if (xp < 75) return 'bg-emerald-400 dark:bg-emerald-700'
    if (xp < 120) return 'bg-emerald-600 dark:bg-emerald-500'
    return 'bg-emerald-800 dark:bg-emerald-300'
  }

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const monthLabels = useMemo(() => {
    const labels: { label: string; weekIndex: number }[] = []
    let lastMonth = ''
    weeks.forEach((week, wi) => {
      const firstDay = week[0]
      if (firstDay) {
        const d = new Date(firstDay.date)
        const month = d.toLocaleString('en', { month: 'short' })
        if (month !== lastMonth) {
          labels.push({ label: month, weekIndex: wi })
          lastMonth = month
        }
      }
    })
    return labels
  }, [weeks])

  return (
    <div className="space-y-2">
      <div className="flex gap-[3px] pl-7">
        {weeks.map((_, wi) => {
          const ml = monthLabels.find(m => m.weekIndex === wi)
          return (
            <div key={wi} className="w-[14px] text-[9px] text-muted-foreground overflow-visible">
              {ml ? ml.label : ''}
            </div>
          )
        })}
      </div>
      <div className="flex gap-1">
        <div className="flex flex-col gap-[3px] shrink-0">
          {dayLabels.map((d, i) => (
            <div key={i} className="h-[14px] flex items-center">
              <span className="text-[9px] text-muted-foreground w-6 text-right pr-1">{i % 2 === 0 ? d : ''}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-[3px] overflow-x-auto scrollbar-thin pb-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((day, di) => (
                <div
                  key={`${wi}-${di}`}
                  className={`size-[14px] rounded-[3px] ${getColor(day.xp, day.active)} transition-colors`}
                  title={`${day.date}: ${day.xp} XP`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pl-7">
        <span>Less</span>
        <div className="size-[12px] rounded-[3px] bg-muted/60" />
        <div className="size-[12px] rounded-[3px] bg-emerald-200 dark:bg-emerald-900" />
        <div className="size-[12px] rounded-[3px] bg-emerald-400 dark:bg-emerald-700" />
        <div className="size-[12px] rounded-[3px] bg-emerald-600 dark:bg-emerald-500" />
        <div className="size-[12px] rounded-[3px] bg-emerald-800 dark:bg-emerald-300" />
        <span>More</span>
      </div>
    </div>
  )
}

// ─── Skill Bar ───
function SkillBar({ skill, index }: { skill: SkillProgress; index: number }) {
  const levelInfo = getSkillLevelLabel(skill.level)
  const isMaxed = skill.progress >= 100

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 400, damping: 25 }}
      className="rounded-2xl ios-shadow-sm bg-card p-4 space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">{skill.icon || '📚'}</span>
          <span className="text-[15px] font-semibold truncate">{skill.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[13px] font-bold">{skill.progress}%</span>
          <Badge variant="secondary" className={`rounded-lg text-[10px] font-semibold gap-1 px-1.5 py-0 ${levelInfo.color}`}>
            {levelInfo.icon}
            {levelInfo.label}
            {isMaxed && <CheckCircle2 className="size-3" />}
          </Badge>
        </div>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${skill.progress}%` }}
          transition={{ delay: index * 0.05 + 0.2, duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${
            isMaxed
              ? 'bg-gradient-to-r from-purple-500 to-purple-600'
              : skill.progress >= 66
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
              : skill.progress >= 33
              ? 'bg-gradient-to-r from-teal-500 to-cyan-500'
              : 'bg-gradient-to-r from-amber-400 to-amber-500'
          }`}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{skill.xpEarned} XP earned</span>
        {skill.progress < 100 && (
          <span>{100 - skill.progress}% to {skill.level === 'beginner' ? 'Intermediate' : skill.level === 'intermediate' ? 'Advanced' : 'Expert'}</span>
        )}
      </div>
    </motion.div>
  )
}

// ─── Badge Card ───
function BadgeCard({ badge, onClick, index }: { badge: BadgeWithStatus; onClick: () => void; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 400, damping: 25 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`cursor-pointer rounded-2xl ios-shadow-sm bg-card p-4 transition-all text-center ${
        badge.earned ? '' : 'opacity-50 grayscale-[50%]'
      }`}
    >
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[32px] leading-none">{badge.earned ? badge.icon : '🔒'}</span>
        <p className={`text-[12px] font-semibold leading-tight ${badge.earned ? 'text-foreground' : 'text-muted-foreground'}`}>
          {badge.name}
        </p>
        {!badge.earned && badge.requirement ? (
          <p className="text-[10px] text-muted-foreground leading-tight">
            {(() => { try { return JSON.parse(badge.requirement).description } catch { return badge.description } })()}
          </p>
        ) : (
          <p className="text-[10px] text-muted-foreground leading-tight">{badge.description}</p>
        )}
        {badge.earned && (
          <span className="text-[10px] text-emerald-500 font-medium">
            {badge.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : 'Earned'}
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ─── Course Progress Card ───
function CourseCard({ course, index }: { course: CourseProgress; index: number }) {
  const hoursSpent = Math.round(course.totalTimeSpent / 3600)
  const minutesSpent = Math.round((course.totalTimeSpent % 3600) / 60)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 400, damping: 25 }}
      className="rounded-2xl ios-shadow-sm bg-card p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-[15px] font-semibold truncate">{course.courseTitle}</h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-[10px] rounded-lg">{course.category}</Badge>
            <Badge variant="secondary" className="text-[10px] rounded-lg capitalize">{course.level}</Badge>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[22px] font-bold text-emerald-600 dark:text-emerald-400">{Math.round(course.progress)}%</p>
          <p className="text-[11px] text-muted-foreground">Progress</p>
        </div>
      </div>

      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${course.progress}%` }}
          transition={{ delay: index * 0.06 + 0.2, duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${
            course.progress >= 100
              ? 'bg-gradient-to-r from-purple-500 to-purple-600'
              : course.progress >= 60
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
              : 'bg-gradient-to-r from-teal-400 to-cyan-500'
          }`}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-muted/40 p-2 text-center">
          <p className="text-[15px] font-bold">{course.completedLessons}/{course.totalLessons}</p>
          <p className="text-[10px] text-muted-foreground">Lessons</p>
        </div>
        <div className="rounded-xl bg-muted/40 p-2 text-center">
          <p className="text-[15px] font-bold">{course.quizStats?.avgScore ?? 0}%</p>
          <p className="text-[10px] text-muted-foreground">Quiz Avg</p>
        </div>
        <div className="rounded-xl bg-muted/40 p-2 text-center">
          <p className="text-[15px] font-bold">{hoursSpent > 0 ? `${hoursSpent}h` : `${minutesSpent}m`}</p>
          <p className="text-[10px] text-muted-foreground">Time</p>
        </div>
      </div>

      {course.status === 'completed' && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2">
          <CheckCircle2 className="size-4 text-emerald-500" />
          <span className="text-[13px] font-medium text-emerald-700 dark:text-emerald-400">Course Completed!</span>
          <span className="text-[11px] text-muted-foreground ml-auto">+{course.totalXpEarned} XP</span>
        </div>
      )}
    </motion.div>
  )
}

// ─── Weekly Report Card ───
function WeeklyReportCard({ report }: { report: WeeklyReport }) {
  const metrics = [
    { label: 'XP Earned', current: report.currentWeek?.xpEarned ?? 0, change: report.change?.xpPercent ?? 0, icon: Zap, format: (v: number) => v.toLocaleString() + ' XP' },
    { label: 'Lessons', current: report.currentWeek?.lessonsCompleted ?? 0, change: report.change?.lessonsPercent ?? 0, icon: BookOpen, format: (v: number) => v.toString() },
    { label: 'Time Spent', current: report.currentWeek?.timeSpent ?? 0, change: report.change?.timePercent ?? 0, icon: Clock, format: (v: number) => formatTime(v) },
    { label: 'Quizzes', current: report.currentWeek?.quizzesTaken ?? 0, change: report.change?.quizzesPercent ?? 0, icon: Target, format: (v: number) => v.toString() },
    { label: 'Active Days', current: report.currentWeek?.activeDays ?? 0, change: report.change?.activeDaysPercent ?? 0, icon: CalendarDays, format: (v: number) => `${v}/7` },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 25 }}
      className="rounded-2xl ios-shadow-sm bg-card p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
            <TrendingUp className="size-4.5" />
          </div>
          <div>
            <h3 className="text-[17px] font-semibold">Weekly Report</h3>
            <p className="text-[11px] text-muted-foreground">vs. previous week</p>
          </div>
        </div>
        {report.topSkill && (
          <Badge variant="secondary" className="rounded-lg text-[11px] gap-1">
            <Sparkles className="size-3" />
            Top: {report.topSkill}
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {metrics.map((m) => (
          <div key={m.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <m.icon className="size-4 text-muted-foreground" />
              <span className="text-[13px] text-muted-foreground">{m.label}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[14px] font-semibold">{m.format(m.current)}</span>
              <div className={`flex items-center gap-0.5 text-[12px] font-medium ${getChangeColor(m.change)}`}>
                {getChangeIcon(m.change)}
                {Math.abs(Math.round(m.change))}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {report.streakDaysThisWeek > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-orange-50 dark:bg-orange-950/20 px-3 py-2.5">
          <Flame className="size-4 text-orange-500 streak-fire" />
          <span className="text-[13px] font-medium text-orange-700 dark:text-orange-400">
            {report.streakDaysThisWeek} streak day{report.streakDaysThisWeek !== 1 ? 's' : ''} this week
          </span>
        </div>
      )}
    </motion.div>
  )
}

// ─── Daily Challenge Card ───
function DailyChallengeCard({ challenge, onClaim, isClaiming }: { challenge: DailyChallenge; onClaim: (id: string) => void; isClaiming: boolean }) {
  const progress = challenge.userProgress?.progress ?? 0
  const isCompleted = challenge.userProgress?.completed ?? false
  const progressPercent = challenge.target > 0 ? Math.min(100, (progress / challenge.target) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl ios-shadow-sm bg-card p-4 space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            {getChallengeIcon(challenge.type)}
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-semibold truncate">{challenge.title}</p>
            <p className="text-[11px] text-muted-foreground line-clamp-2">{challenge.description}</p>
          </div>
        </div>
        <Badge className={`rounded-lg text-[10px] font-semibold shrink-0 ${getDifficultyColor(challenge.difficulty)}`}>
          {challenge.difficulty}
        </Badge>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-muted-foreground">{progress}/{challenge.target} {challenge.unit}</span>
          <span className="font-semibold">{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              isCompleted
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : 'bg-gradient-to-r from-teal-400 to-cyan-500'
            }`}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
            <Zap className="size-3" />+{challenge.xpReward} XP
          </div>
          <div className="flex items-center gap-1 text-[11px] text-orange-600 dark:text-orange-400">
            <Coins className="size-3" />+{challenge.coinReward}
          </div>
        </div>
        {isCompleted ? (
          <Badge className="rounded-lg text-[11px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CheckCircle2 className="size-3 mr-1" />
            Completed
          </Badge>
        ) : progressPercent >= 100 ? (
          <Button
            size="sm"
            className="rounded-xl text-[12px] h-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
            onClick={() => onClaim(challenge.id)}
            disabled={isClaiming}
          >
            {isClaiming ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Gift className="size-3.5 mr-1" />}
            Claim
          </Button>
        ) : (
          <Badge variant="outline" className="rounded-lg text-[11px]">
            In Progress
          </Badge>
        )}
      </div>
    </motion.div>
  )
}

// ─── Active Goals Summary ───
function ActiveGoalsSummary({ goals }: { goals: LearningGoal[] }) {
  const activeGoals = goals.filter(g => g.status === 'active')
  if (activeGoals.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl ios-shadow-sm bg-card p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400">
            <Target className="size-4.5" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold">Active Goals</h3>
            <p className="text-[11px] text-muted-foreground">{activeGoals.length} goal{activeGoals.length !== 1 ? 's' : ''} in progress</p>
          </div>
        </div>
      </div>
      <div className="space-y-2.5">
        {activeGoals.slice(0, 3).map((goal) => {
          const percent = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0
          return (
            <div key={goal.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium truncate">{goal.title}</span>
                <span className="text-[12px] text-muted-foreground shrink-0">{goal.current}/{goal.target} {goal.unit}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    percent >= 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-teal-400 to-cyan-500'
                  }`}
                />
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ─── XP Activity Feed ───
function XpActivityFeed({ activities }: { activities: XpActivity[] }) {
  if (activities.length === 0) return null

  return (
    <div className="space-y-0">
      {activities.slice(0, 15).map((activity, i) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.03, type: 'spring', stiffness: 400, damping: 25 }}
          className="flex items-start gap-3 py-2.5"
        >
          <div className="flex flex-col items-center">
            <div className="flex size-8 items-center justify-center rounded-lg bg-muted/60 shrink-0">
              {getXpActivityIcon(activity.action)}
            </div>
            {i < activities.length - 1 && i < 14 && (
              <div className="w-px h-full bg-border mt-1" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium truncate">{activity.description}</p>
            <p className="text-[11px] text-muted-foreground">{new Date(activity.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className={`text-[13px] font-bold ${activity.xpAmount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
              {activity.xpAmount > 0 ? `+${activity.xpAmount}` : activity.xpAmount} XP
            </p>
            {activity.coinAmount > 0 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400">+{activity.coinAmount} coins</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Podium Slot (extracted for rules-of-hooks) ───
function PodiumSlot({ entry, rank, height, color, icon }: { entry: LeaderboardEntry; rank: number; height: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <div className={`size-12 rounded-full ${color} flex items-center justify-center text-white font-bold text-[18px]`}>
          {entry.userName?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-white dark:bg-card ios-shadow-sm text-[10px] font-bold">
          {icon}
        </div>
      </div>
      <p className="text-[12px] font-semibold text-center max-w-[80px] truncate">{entry.userName}</p>
      <p className="text-[11px] text-muted-foreground">{(entry.xp ?? 0).toLocaleString()} XP</p>
      <div className={`w-20 rounded-t-lg ${color} flex items-center justify-center`} style={{ height }}>
        <span className="text-white font-bold text-[20px]">#{rank}</span>
      </div>
    </div>
  )
}

// ─── Leaderboard Podium ───
function LeaderboardPodium({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length < 3) return null
  const [first, second, third] = entries

  return (
    <div className="flex items-end justify-center gap-3 py-4">
      <PodiumSlot entry={second} rank={2} height="60px" color="bg-gray-400" icon={<Medal className="size-3 text-gray-500" />} />
      <PodiumSlot entry={first} rank={1} height="80px" color="bg-amber-500" icon={<Crown className="size-3 text-amber-600" />} />
      <PodiumSlot entry={third} rank={3} height="48px" color="bg-amber-700" icon={<Medal className="size-3 text-amber-800" />} />
    </div>
  )
}

// ─── Leaderboard Table ───
function LeaderboardTable({ entries, currentUserId }: { entries: LeaderboardEntry[]; currentUserId: string }) {
  return (
    <div className="space-y-1.5">
      {entries.map((entry, i) => {
        const isCurrentUser = entry.userId === currentUserId || entry.isCurrentUser
        return (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`flex items-center gap-3 rounded-xl p-3 transition-all ${
              isCurrentUser
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30'
                : 'bg-muted/30 hover:bg-muted/50'
            }`}
          >
            <div className={`flex size-8 items-center justify-center rounded-lg text-[13px] font-bold shrink-0 ${
              entry.rank === 1 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
              entry.rank === 2 ? 'bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-400' :
              entry.rank === 3 ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' :
              'bg-muted/60 text-muted-foreground'
            }`}>
              {entry.rank <= 3 ? (
                entry.rank === 1 ? <Crown className="size-4" /> :
                entry.rank === 2 ? <Medal className="size-4" /> :
                <Medal className="size-4" />
              ) : `#${entry.rank}`}
            </div>
            <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-[13px] font-bold shrink-0">
              {entry.userName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold truncate">
                {entry.userName}
                {isCurrentUser && <span className="text-emerald-600 dark:text-emerald-400 ml-1.5 text-[11px] font-medium">(You)</span>}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>Lv.{entry.level}</span>
                {entry.streak > 0 && (
                  <span className="flex items-center gap-0.5 text-orange-500">
                    <Flame className="size-3 streak-fire" />{entry.streak}d
                  </span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[14px] font-bold">{(entry.xp ?? 0).toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">XP</p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ─── Goal Card ───
function GoalCard({ goal, onEdit, onDelete, index }: { goal: LearningGoal; onEdit: (g: LearningGoal) => void; onDelete: (id: string) => void; index: number }) {
  const percent = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0
  const isComplete = goal.status === 'completed' || percent >= 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 400, damping: 25 }}
      className={`rounded-2xl ios-shadow-sm bg-card p-4 space-y-3 ${isComplete ? 'border border-emerald-200 dark:border-emerald-800/30' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-[14px] font-semibold truncate">{goal.title}</h4>
            {isComplete && <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-[10px] rounded-lg">{getGoalTypeLabel(goal.type)}</Badge>
            <Badge variant="secondary" className="text-[10px] rounded-lg capitalize">{goal.period}</Badge>
          </div>
        </div>
        {goal.status === 'active' && (
          <div className="flex items-center gap-1 shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="size-8 rounded-lg p-0" onClick={() => onEdit(goal)}>
                    <Pencil className="size-3.5 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit goal</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="size-8 rounded-lg p-0" onClick={() => onDelete(goal.id)}>
                    <Trash2 className="size-3.5 text-red-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete goal</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-muted-foreground">{goal.current}/{goal.target} {goal.unit}</span>
          <span className="font-semibold">{Math.round(percent)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              isComplete
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : percent >= 66
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500'
                : 'bg-gradient-to-r from-amber-400 to-amber-500'
            }`}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Started {new Date(goal.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        <span>Due {new Date(goal.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      </div>
    </motion.div>
  )
}

// ─── Create Goal Dialog ───
function CreateGoalDialog({ open, onOpenChange, userId, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; userId: string; onCreated: () => void }) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<string>('weekly_xp')
  const [target, setTarget] = useState('')
  const [period, setPeriod] = useState<string>('weekly')
  const [saving, setSaving] = useState(false)

  const unitMap: Record<string, string> = {
    weekly_xp: 'xp',
    weekly_time: 'minutes',
    weekly_lessons: 'lessons',
    monthly_xp: 'xp',
    monthly_courses: 'courses',
    custom: 'xp',
  }

  const handleSubmit = async () => {
    if (!title || !target) return
    setSaving(true)
    try {
      const now = new Date()
      const end = new Date()
      if (period === 'weekly') end.setDate(end.getDate() + 7)
      else if (period === 'monthly') end.setMonth(end.getMonth() + 1)
      else end.setDate(end.getDate() + 30)

      await fetch('/api/student/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title,
          type,
          target: parseInt(target),
          unit: unitMap[type] || 'xp',
          period,
          startDate: now.toISOString(),
          endDate: end.toISOString(),
        }),
      })
      setTitle('')
      setTarget('')
      setType('weekly_xp')
      setPeriod('weekly')
      onOpenChange(false)
      onCreated()
    } catch {
      // Silently handle errors
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl ios-shadow-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <Target className="size-4.5" />
            </div>
            Create New Goal
          </DialogTitle>
          <DialogDescription>Set a learning target to stay motivated</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-[13px] font-medium">Goal Title</label>
            <Input
              placeholder="e.g., Earn 500 XP this week"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-[13px] font-medium">Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly_xp">Weekly XP</SelectItem>
                  <SelectItem value="weekly_time">Weekly Time</SelectItem>
                  <SelectItem value="weekly_lessons">Weekly Lessons</SelectItem>
                  <SelectItem value="monthly_xp">Monthly XP</SelectItem>
                  <SelectItem value="monthly_courses">Monthly Courses</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-medium">Period</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-medium">Target ({unitMap[type] || 'xp'})</label>
            <Input
              type="number"
              placeholder={`Enter target ${unitMap[type] || 'xp'}`}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="rounded-xl"
              min={1}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!title || !target || saving}
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
          >
            {saving ? <Loader2 className="size-4 animate-spin mr-1" /> : <Plus className="size-4 mr-1" />}
            Create Goal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Streak Management Card ───
function StreakManagementCard({ streakInfo, onFreeze, isFreezing }: { streakInfo: StreakInfo; onFreeze: () => void; isFreezing: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl ios-shadow-sm bg-card p-5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
          <Flame className="size-4.5 streak-fire" />
        </div>
        <div>
          <h3 className="text-[17px] font-semibold">Streak Management</h3>
          <p className="text-[11px] text-muted-foreground">Keep your streak alive</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 p-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <Flame className="size-5 text-orange-500 streak-fire" />
            <span className="text-[28px] font-bold text-orange-600 dark:text-orange-400">{streakInfo.current}</span>
          </div>
          <p className="text-[12px] text-muted-foreground mt-1">Current Streak</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 p-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <Trophy className="size-5 text-amber-500" />
            <span className="text-[28px] font-bold text-amber-600 dark:text-amber-400">{streakInfo.longest}</span>
          </div>
          <p className="text-[12px] text-muted-foreground mt-1">Longest Streak</p>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Snowflake className="size-4 text-blue-500" />
            <span className="text-[13px] font-medium">Streak Freeze</span>
          </div>
          <span className="text-[12px] text-muted-foreground">
            {streakInfo.freezesUsedThisMonth}/{streakInfo.maxFreezesPerMonth} used this month
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-blue-50 dark:bg-blue-950/20 p-3">
          <div>
            <p className="text-[13px] font-medium">Protect your streak for a day</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Coins className="size-3 text-amber-500" />
              <span className="text-[12px] text-muted-foreground">Cost: {streakInfo.freezeCost} coins</span>
              <span className="text-[12px] text-muted-foreground mx-1">|</span>
              <span className="text-[12px] text-muted-foreground">Balance: {streakInfo.userCoins} coins</span>
            </div>
          </div>
          <Button
            size="sm"
            className="rounded-xl text-[12px] h-8 bg-blue-500 hover:bg-blue-600 text-white shrink-0"
            onClick={onFreeze}
            disabled={!streakInfo.canFreeze || isFreezing}
          >
            {isFreezing ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Snowflake className="size-3.5 mr-1" />}
            Freeze
          </Button>
        </div>
      </div>

      {streakInfo.lastActiveDate && (
        <p className="text-[11px] text-muted-foreground">
          Last active: {new Date(streakInfo.lastActiveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      )}
    </motion.div>
  )
}

// ─── Goal Templates ───
const GOAL_TEMPLATES = [
  { title: 'Earn 500 XP this week', type: 'weekly_xp' as const, target: 500, unit: 'xp' as const, period: 'weekly' as const },
  { title: 'Complete 10 lessons this week', type: 'weekly_lessons' as const, target: 10, unit: 'lessons' as const, period: 'weekly' as const },
  { title: 'Study for 5 hours this week', type: 'weekly_time' as const, target: 300, unit: 'minutes' as const, period: 'weekly' as const },
  { title: 'Earn 2000 XP this month', type: 'monthly_xp' as const, target: 2000, unit: 'xp' as const, period: 'monthly' as const },
  { title: 'Complete 2 courses this month', type: 'monthly_courses' as const, target: 2, unit: 'courses' as const, period: 'monthly' as const },
]

function GoalTemplates({ userId, onCreated }: { userId: string; onCreated: () => void }) {
  const [creating, setCreating] = useState<string | null>(null)

  const handleCreateFromTemplate = async (template: typeof GOAL_TEMPLATES[0]) => {
    setCreating(template.title)
    try {
      const now = new Date()
      const end = new Date()
      if (template.period === 'weekly') end.setDate(end.getDate() + 7)
      else if (template.period === 'monthly') end.setMonth(end.getMonth() + 1)

      await fetch('/api/student/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: template.title,
          type: template.type,
          target: template.target,
          unit: template.unit,
          period: template.period,
          startDate: now.toISOString(),
          endDate: end.toISOString(),
        }),
      })
      onCreated()
    } catch {
      // Silently handle
    } finally {
      setCreating(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-violet-500" />
        <h4 className="text-[15px] font-semibold">Goal Suggestions</h4>
      </div>
      <div className="space-y-2">
        {GOAL_TEMPLATES.map((template) => (
          <div
            key={template.title}
            className="flex items-center justify-between rounded-xl bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-[13px] font-medium">{template.title}</p>
              <p className="text-[11px] text-muted-foreground">{getGoalTypeLabel(template.type)} | {template.period}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xl text-[11px] h-7 shrink-0"
              onClick={() => handleCreateFromTemplate(template)}
              disabled={creating === template.title}
            >
              {creating === template.title ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Filter Pills ───
function FilterPills({ options, value, onChange }: { options: { value: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all ${
            value === opt.value
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export function ProgressAnalyticsView() {
  const { currentUser } = useAppStore()
  const [data, setData] = useState<EnhancedProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithStatus | null>(null)

  // Tab-specific state
  const [courseSort, setCourseSort] = useState<'progress' | 'recent' | 'name'>('recent')
  const [courseFilter, setCourseFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [skillCategoryFilter, setSkillCategoryFilter] = useState('all')
  const [badgeCategoryFilter, setBadgeCategoryFilter] = useState('all')
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'week' | 'month' | 'all'>('week')

  // Goals state
  const [goals, setGoals] = useState<LearningGoal[]>([])
  const [showCreateGoal, setShowCreateGoal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<LearningGoal | null>(null)

  // Challenge state
  const [claimingChallenge, setClaimingChallenge] = useState<string | null>(null)

  // Streak state
  const [isFreezing, setIsFreezing] = useState(false)

  // Deleting goal
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null)

  // Fetch main data
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/student/progress?userId=${currentUser?.id || ''}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
        if (json.goals) setGoals(json.goals)
      } else {
        setError('Failed to load progress data')
      }
    } catch {
      setError('Network error loading progress')
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id])

  // Fetch goals separately
  const fetchGoals = useCallback(async () => {
    if (!currentUser?.id) return
    try {
      const res = await fetch(`/api/student/goals?userId=${currentUser.id}`)
      if (res.ok) {
        const json = await res.json()
        setGoals(json.goals || json || [])
      }
    } catch {
      // Silently handle
    }
  }, [currentUser?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Challenge claim
  const handleClaimChallenge = async (challengeId: string) => {
    if (!currentUser?.id) return
    setClaimingChallenge(challengeId)
    try {
      const res = await fetch('/api/student/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, challengeId }),
      })
      if (res.ok) {
        // Refresh data
        await fetchData()
      }
    } catch {
      // Silently handle
    } finally {
      setClaimingChallenge(null)
    }
  }

  // Streak freeze
  const handleStreakFreeze = async () => {
    if (!currentUser?.id) return
    setIsFreezing(true)
    try {
      const res = await fetch('/api/student/streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      })
      if (res.ok) {
        await fetchData()
      }
    } catch {
      // Silently handle
    } finally {
      setIsFreezing(false)
    }
  }

  // Delete goal
  const handleDeleteGoal = async (goalId: string) => {
    setDeletingGoalId(goalId)
    try {
      await fetch(`/api/student/goals?goalId=${goalId}&userId=${currentUser?.id || ''}`, {
        method: 'DELETE',
      })
      await fetchGoals()
    } catch {
      // Silently handle
    } finally {
      setDeletingGoalId(null)
    }
  }

  // ── Derived data (must be before early returns for rules-of-hooks) ──
  const courses = data?.courses ?? []
  const skills = data?.skills ?? []
  const achievements = data?.achievements ?? { earned: [], locked: [] }
  const heatmap = data?.heatmap ?? []
  const overview = data?.overview ?? { totalLearningTime: 0, thisMonthTime: 0, totalLessonsCompleted: 0, thisMonthLessons: 0, quizStats: { total: 0, passed: 0, passRate: 0 }, assignmentStats: { total: 0, submitted: 0, rate: 0 } }
  const xp = data?.xp ?? { total: 0, level: 1, levelProgress: 0, xpToNextLevel: 0, coins: 0, streak: 0, longestStreak: 0, leaderboardRank: 0, totalStudents: 0 }

  const earnedCount = achievements.earned.length
  const lockedCount = achievements.locked.length

  // Course sort/filter
  const filteredCourses = useMemo(() => {
    let result = [...courses]
    if (courseFilter === 'active') result = result.filter(c => c.status !== 'completed')
    if (courseFilter === 'completed') result = result.filter(c => c.status === 'completed')
    if (courseSort === 'progress') result.sort((a, b) => b.progress - a.progress)
    else if (courseSort === 'name') result.sort((a, b) => a.courseTitle.localeCompare(b.courseTitle))
    else result.sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
    return result
  }, [courses, courseSort, courseFilter])

  // Skill categories
  const skillCategories = useMemo(() => {
    const cats = [...new Set(skills.map(s => s.category))]
    return [{ value: 'all', label: 'All' }, ...cats.map(c => ({ value: c, label: c }))]
  }, [skills])

  const filteredSkills = useMemo(() => {
    if (skillCategoryFilter === 'all') return skills
    return skills.filter(s => s.category === skillCategoryFilter)
  }, [skills, skillCategoryFilter])

  // Badge categories
  const badgeCategories = [
    { value: 'all', label: 'All' },
    { value: 'learning', label: 'Learning' },
    { value: 'streak', label: 'Streak' },
    { value: 'social', label: 'Social' },
    { value: 'achievement', label: 'Achievement' },
  ]

  const filteredEarnedBadges = useMemo(() => {
    if (badgeCategoryFilter === 'all') return achievements.earned
    return achievements.earned.filter(b => b.category === badgeCategoryFilter)
  }, [achievements.earned, badgeCategoryFilter])

  const filteredLockedBadges = useMemo(() => {
    if (badgeCategoryFilter === 'all') return achievements.locked
    return achievements.locked.filter(b => b.category === badgeCategoryFilter)
  }, [achievements.locked, badgeCategoryFilter])

  // Active/completed goals
  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')

  // Overall skill level
  const overallSkillLevel = useMemo(() => {
    if (skills.length === 0) return 'N/A'
    const avgProgress = skills.reduce((sum, s) => sum + s.progress, 0) / skills.length
    if (avgProgress >= 85) return 'Expert'
    if (avgProgress >= 65) return 'Advanced'
    if (avgProgress >= 35) return 'Intermediate'
    return 'Beginner'
  }, [skills])

  // Course progress summary
  const courseSummary = useMemo(() => {
    const total = courses.length
    const completed = courses.filter(c => c.status === 'completed').length
    const avgProgress = total > 0 ? courses.reduce((sum, c) => sum + c.progress, 0) / total : 0
    return { total, completed, avgProgress }
  }, [courses])

  // Leaderboard
  const leaderboard = data?.leaderboard ?? []

  // ── Loading state ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
        <p className="text-[13px] text-muted-foreground">Loading your progress...</p>
      </div>
    )
  }

  // ── Error state ──
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <BarChart3 className="size-12 text-muted-foreground/30" />
        <p className="text-[13px] text-muted-foreground">{error || 'No data available'}</p>
        <Button variant="outline" onClick={fetchData} className="rounded-xl mt-2">
          Retry
        </Button>
      </div>
    )
  }

  // ── Tabs config ──
  const tabs = [
    { value: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="size-3.5" /> },
    { value: 'courses', label: 'Courses', icon: <BookOpen className="size-3.5" />, count: courses.length },
    { value: 'skills', label: 'Skills', icon: <Brain className="size-3.5" />, count: skills.length },
    { value: 'achievements', label: 'Badges', icon: <Award className="size-3.5" />, count: earnedCount },
    { value: 'leaderboard', label: 'Rank', icon: <Trophy className="size-3.5" /> },
    { value: 'goals', label: 'Goals', icon: <Target className="size-3.5" />, count: activeGoals.length },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="space-y-6"
    >
      {/* Title */}
      <div>
        <h2 className="text-[34px] font-bold">My Progress</h2>
        <p className="text-[15px] text-muted-foreground">Track your learning journey and achievements</p>
      </div>

      {/* XP & Level Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 25 }}
        className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white ios-shadow"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-medium text-white/70">Level</p>
              <span className="flex size-8 items-center justify-center rounded-xl bg-white/20 text-[17px] font-bold">{xp.level}</span>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1.5">
                <Zap className="size-4" />
                <span className="text-[17px] font-bold">{xp.total.toLocaleString()} XP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame className="size-4 streak-fire" />
                <span className="text-[15px] font-medium">{xp.streak}d streak</span>
              </div>
            </div>
          </div>
          <div className="flex size-14 items-center justify-center rounded-2xl bg-white/20">
            <Trophy className="size-7" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-[13px]">
            <span className="text-white/70">{xp.total.toLocaleString()} XP</span>
            <span className="text-white/70">{xp.xpToNextLevel.toLocaleString()} XP to Level {xp.level + 1}</span>
          </div>
          <div className="h-3 rounded-full bg-white/20 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xp.levelProgress}%` }}
              transition={{ delay: 0.3, duration: 1, type: 'spring', stiffness: 100, damping: 20 }}
              className="h-full rounded-full bg-white xp-glow"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-white/60">
            <span>Leaderboard rank: <span className="text-white font-semibold">#{xp.leaderboardRank}</span> out of {xp.totalStudents.toLocaleString()} students</span>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <SegmentedControl options={tabs} value={activeTab} onChange={setActiveTab} />

      {/* ═══════════════════════════════════════════════════
          TAB 1: DASHBOARD
      ═════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {activeTab === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Key metrics */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              <MetricCard
                icon={Clock}
                label="Learning Time"
                value={formatTime(overview.totalLearningTime)}
                subtext="this month"
                color="bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                index={0}
              />
              <MetricCard
                icon={BookOpen}
                label="Lessons Done"
                value={overview.thisMonthLessons}
                subtext="this month"
                color="bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400"
                index={1}
              />
              <MetricCard
                icon={Target}
                label="Quizzes Passed"
                value={`${overview.quizStats.passed} / ${overview.quizStats.total}`}
                subtext={`(${overview.quizStats.passRate}% pass)`}
                color="bg-cyan-100 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400"
                index={2}
              />
              <MetricCard
                icon={ClipboardList}
                label="Assignments"
                value={`${overview.assignmentStats.submitted} / ${overview.assignmentStats.total}`}
                subtext={`(${overview.assignmentStats.rate}%)`}
                color="bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                index={3}
              />
            </div>

            {/* Weekly Report */}
            {data.weeklyReport && <WeeklyReportCard report={data.weeklyReport} />}

            {/* Daily Challenges */}
            {data.challenges && data.challenges.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
                      <Swords className="size-4.5" />
                    </div>
                    <div>
                      <h3 className="text-[17px] font-semibold">Daily Challenges</h3>
                      <p className="text-[11px] text-muted-foreground">Complete challenges for bonus rewards</p>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {data.challenges.slice(0, 3).map((challenge) => (
                    <DailyChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onClaim={handleClaimChallenge}
                      isClaiming={claimingChallenge === challenge.id}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Active Goals Summary */}
            {goals.length > 0 && <ActiveGoalsSummary goals={goals} />}

            {/* Learning Time Heatmap */}
            <div className="rounded-2xl ios-shadow-sm bg-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="size-4 text-emerald-500" />
                <h3 className="text-[17px] font-semibold">Learning Time Heatmap</h3>
                <span className="text-[12px] text-muted-foreground ml-auto">Last 3 months</span>
              </div>
              <HeatmapGrid data={heatmap} />
            </div>

            {/* Quick stats summary */}
            <div className="grid gap-3 grid-cols-2">
              <div className="rounded-2xl ios-shadow-sm bg-card p-4 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                  <Brain className="size-5" />
                </div>
                <div>
                  <p className="text-[17px] font-bold">{skills.length}</p>
                  <p className="text-[13px] text-muted-foreground">Skills Building</p>
                </div>
              </div>
              <div className="rounded-2xl ios-shadow-sm bg-card p-4 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
                  <Award className="size-5" />
                </div>
                <div>
                  <p className="text-[17px] font-bold">{earnedCount}</p>
                  <p className="text-[13px] text-muted-foreground">Badges Earned</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB 2: COURSES
        ═════════════════════════════════════════════════════ */}
        {activeTab === 'courses' && (
          <motion.div
            key="courses"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Course Progress Summary Bar */}
            <div className="rounded-2xl ios-shadow-sm bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[15px] font-semibold">Course Progress</h3>
                <span className="text-[12px] text-muted-foreground">{courseSummary.completed}/{courseSummary.total} completed</span>
              </div>
              <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${courseSummary.avgProgress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                />
              </div>
              <div className="flex items-center justify-between text-[12px] text-muted-foreground">
                <span>Average: {Math.round(courseSummary.avgProgress)}%</span>
                <span>{courseSummary.total - courseSummary.completed} in progress</span>
              </div>
            </div>

            {/* Sort & Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-muted-foreground" />
                <Select value={courseFilter} onValueChange={(v) => setCourseFilter(v as typeof courseFilter)}>
                  <SelectTrigger className="rounded-xl h-8 text-[12px] w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    <SelectItem value="active">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-muted-foreground" />
                <Select value={courseSort} onValueChange={(v) => setCourseSort(v as typeof courseSort)}>
                  <SelectTrigger className="rounded-xl h-8 text-[12px] w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">By Recent</SelectItem>
                    <SelectItem value="progress">By Progress</SelectItem>
                    <SelectItem value="name">By Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Course Cards */}
            {filteredCourses.length > 0 ? (
              <div className="space-y-3">
                {filteredCourses.map((course, i) => (
                  <CourseCard key={course.courseId} course={course} index={i} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-12 gap-3">
                <GraduationCap className="size-12 text-muted-foreground/30" />
                <p className="text-[15px] text-muted-foreground">
                  {courseFilter === 'completed' ? 'No completed courses yet' : courseFilter === 'active' ? 'No courses in progress' : 'No courses enrolled yet'}
                </p>
                <p className="text-[13px] text-muted-foreground">Start learning to see your course progress</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB 3: SKILLS
        ═════════════════════════════════════════════════════ */}
        {activeTab === 'skills' && (
          <motion.div
            key="skills"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Overall Skill Level */}
            <div className="rounded-2xl ios-shadow-sm bg-card p-4 flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                <Brain className="size-6" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Overall Skill Level</p>
                <p className="text-[20px] font-bold">{overallSkillLevel}</p>
                <p className="text-[12px] text-muted-foreground">{skills.length} skills tracked</p>
              </div>
            </div>

            {/* Skill Category Filter */}
            {skillCategories.length > 2 && (
              <FilterPills options={skillCategories} value={skillCategoryFilter} onChange={setSkillCategoryFilter} />
            )}

            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Brain className="size-4 text-emerald-500" />
              <span>Skills you&apos;re building <span className="text-emerald-600 dark:text-emerald-400 font-medium">(AI-tracked from your course content)</span></span>
            </div>

            {filteredSkills.length > 0 ? (
              <div className="space-y-3">
                {filteredSkills.map((skill, i) => (
                  <SkillBar key={skill.id} skill={skill} index={i} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-12 gap-3">
                <Brain className="size-12 text-muted-foreground/30" />
                <p className="text-[15px] text-muted-foreground">No skills tracked yet</p>
                <p className="text-[13px] text-muted-foreground">Complete lessons to build your skill profile</p>
              </div>
            )}

            {/* AI Career Insight */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-200/50 dark:border-violet-800/30 p-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-violet-500" />
                <span className="text-[15px] font-semibold text-violet-700 dark:text-violet-400">AI Career Insight</span>
              </div>
              <p className="text-[13px] text-foreground/80 leading-relaxed">
                {skills.length > 0 ? (
                  <>
                    Based on your skills, you&apos;re on track for a <span className="font-semibold text-violet-700 dark:text-violet-400">Junior {skills.find(s => s.progress >= 50)?.name || 'Software'} Developer</span> role.
                    {skills.some(s => s.progress < 30) && (
                      <> Adding <span className="font-semibold text-violet-700 dark:text-violet-400">{skills.filter(s => s.progress < 30).map(s => s.name).join(', ')}</span> would strengthen your profile.</>
                    )}
                  </>
                ) : (
                  'Start completing courses to get personalized career insights based on your developing skills.'
                )}
              </p>
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-[13px] border-violet-200 dark:border-violet-800/50 text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30">
                Explore recommended courses
                <ChevronRight className="size-3.5" />
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB 4: ACHIEVEMENTS
        ═════════════════════════════════════════════════════ */}
        {activeTab === 'achievements' && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Badge Category Filter */}
            <FilterPills options={badgeCategories} value={badgeCategoryFilter} onChange={setBadgeCategoryFilter} />

            {/* Earned Badges */}
            {filteredEarnedBadges.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[17px] font-semibold">Earned Badges</h3>
                  <Badge variant="secondary" className="rounded-lg text-[11px]">
                    <Award className="size-3 mr-1" />
                    {filteredEarnedBadges.length}
                  </Badge>
                </div>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {filteredEarnedBadges.map((badge, i) => (
                    <BadgeCard key={badge.id} badge={badge} onClick={() => setSelectedBadge(badge)} index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Locked Badges */}
            {filteredLockedBadges.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[17px] font-semibold">Locked Badges</h3>
                  <span className="text-[12px] text-muted-foreground">Earn these next</span>
                </div>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {filteredLockedBadges.map((badge, i) => (
                    <BadgeCard key={badge.id} badge={badge} onClick={() => setSelectedBadge(badge)} index={earnedCount + i} />
                  ))}
                </div>
              </div>
            )}

            {filteredEarnedBadges.length === 0 && filteredLockedBadges.length === 0 && (
              <div className="flex flex-col items-center py-12 gap-3">
                <Trophy className="size-12 text-muted-foreground/30" />
                <p className="text-[15px] text-muted-foreground">No badges in this category</p>
              </div>
            )}

            {/* XP & Level Summary */}
            <div className="rounded-2xl ios-shadow-sm bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-amber-500" />
                <h3 className="text-[17px] font-semibold">XP & Level</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white text-[22px] font-bold">
                  {xp.level}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="font-medium">{xp.total.toLocaleString()} / {((xp.level + 1) * 500).toLocaleString()} XP</span>
                    <span className="text-muted-foreground">Level {xp.level + 1}</span>
                  </div>
                  <Progress value={xp.levelProgress} className="h-3" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="rounded-xl bg-muted/40 p-2.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-[15px] font-bold text-orange-600 dark:text-orange-400">
                    <Flame className="size-3.5 streak-fire" />
                    {xp.streak}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Streak</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-2.5 text-center">
                  <p className="text-[15px] font-bold text-amber-600 dark:text-amber-400">🏅 {xp.longestStreak}</p>
                  <p className="text-[11px] text-muted-foreground">Best Streak</p>
                </div>
                <div className="rounded-xl bg-muted/40 p-2.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-[15px] font-bold text-emerald-600 dark:text-emerald-400">
                    <Users className="size-3.5" />
                    #{xp.leaderboardRank}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Rank</p>
                </div>
              </div>
            </div>

            {/* Recent XP Activity Feed */}
            {data.xpActivity && data.xpActivity.length > 0 && (
              <div className="rounded-2xl ios-shadow-sm bg-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-emerald-500" />
                  <h3 className="text-[17px] font-semibold">Recent XP Activity</h3>
                  <Badge variant="secondary" className="rounded-lg text-[10px] ml-auto">
                    {data.xpActivity.length} entries
                  </Badge>
                </div>
                <ScrollArea className="max-h-96">
                  <XpActivityFeed activities={data.xpActivity} />
                </ScrollArea>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB 5: LEADERBOARD
        ═════════════════════════════════════════════════════ */}
        {activeTab === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Period Filter */}
            <div className="flex items-center gap-2">
              <Trophy className="size-4 text-amber-500" />
              <h3 className="text-[17px] font-semibold">Leaderboard</h3>
              <div className="ml-auto">
                <Select value={leaderboardPeriod} onValueChange={(v) => setLeaderboardPeriod(v as typeof leaderboardPeriod)}>
                  <SelectTrigger className="rounded-xl h-8 text-[12px] w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {leaderboard.length > 0 ? (
              <>
                {/* Top 3 Podium */}
                {leaderboard.length >= 3 && (
                  <div className="rounded-2xl ios-shadow-sm bg-card p-4">
                    <LeaderboardPodium entries={leaderboard} />
                  </div>
                )}

                {/* Full Leaderboard Table */}
                <div className="rounded-2xl ios-shadow-sm bg-card p-4">
                  <ScrollArea className="max-h-[500px]">
                    <LeaderboardTable entries={leaderboard} currentUserId={currentUser?.id || ''} />
                  </ScrollArea>
                </div>

                {/* Current User Rank Card (if not in top 20) */}
                {(() => {
                  const userEntry = leaderboard.find(e => e.userId === currentUser?.id || e.isCurrentUser)
                  if (userEntry && userEntry.rank > 3) {
                    return (
                      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/30 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold">
                            {currentUser?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold">Your Ranking</p>
                            <p className="text-[12px] text-muted-foreground">Keep going to climb the ranks!</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[22px] font-bold text-emerald-600 dark:text-emerald-400">#{userEntry.rank}</p>
                            <p className="text-[11px] text-muted-foreground">{userEntry.xp.toLocaleString()} XP</p>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                })()}
              </>
            ) : (
              <div className="flex flex-col items-center py-12 gap-3">
                <Users className="size-12 text-muted-foreground/30" />
                <p className="text-[15px] text-muted-foreground">No leaderboard data available</p>
                <p className="text-[13px] text-muted-foreground">Start learning to appear on the leaderboard</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB 6: GOALS
        ═════════════════════════════════════════════════════ */}
        {activeTab === 'goals' && (
          <motion.div
            key="goals"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Header with Create button */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[17px] font-semibold">Learning Goals</h3>
                <p className="text-[12px] text-muted-foreground">{activeGoals.length} active, {completedGoals.length} completed</p>
              </div>
              <Button
                onClick={() => setShowCreateGoal(true)}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white gap-1.5"
              >
                <Plus className="size-4" />
                New Goal
              </Button>
            </div>

            {/* Streak Management */}
            {data.streakInfo && (
              <StreakManagementCard
                streakInfo={data.streakInfo}
                onFreeze={handleStreakFreeze}
                isFreezing={isFreezing}
              />
            )}

            {/* Active Goals */}
            {activeGoals.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[15px] font-semibold flex items-center gap-2">
                  <Rocket className="size-4 text-emerald-500" />
                  Active Goals
                </h4>
                <div className="space-y-3">
                  {activeGoals.map((goal, i) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={(g) => setEditingGoal(g)}
                      onDelete={handleDeleteGoal}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Goal Templates */}
            {activeGoals.length < 3 && (
              <GoalTemplates userId={currentUser?.id || ''} onCreated={fetchGoals} />
            )}

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-[15px] font-semibold flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" />
                  Completed Goals
                </h4>
                <div className="space-y-3">
                  {completedGoals.map((goal, i) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onEdit={() => {}}
                      onDelete={() => {}}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            )}

            {activeGoals.length === 0 && completedGoals.length === 0 && (
              <div className="flex flex-col items-center py-12 gap-3">
                <Target className="size-12 text-muted-foreground/30" />
                <p className="text-[15px] text-muted-foreground">No goals set yet</p>
                <p className="text-[13px] text-muted-foreground">Create a goal to stay motivated and track your progress</p>
                <Button
                  onClick={() => setShowCreateGoal(true)}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white gap-1.5 mt-2"
                >
                  <Plus className="size-4" />
                  Create Your First Goal
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Badge Detail Dialog ═══ */}
      <Dialog open={!!selectedBadge} onOpenChange={(open) => !open && setSelectedBadge(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl ios-shadow-lg">
          {selectedBadge && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className={`flex size-14 items-center justify-center rounded-2xl text-[32px] ${
                    selectedBadge.earned ? 'bg-accent/50' : 'bg-muted'
                  }`}>
                    {selectedBadge.earned ? selectedBadge.icon : <Lock className="size-6 text-muted-foreground" />}
                  </span>
                  <div className="text-left">
                    <span className="text-[22px] font-bold">{selectedBadge.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="rounded-full bg-accent/50 px-2 py-0.5 text-[11px] font-medium capitalize">
                        {selectedBadge.category}
                      </span>
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <p className="text-[15px] text-muted-foreground">{selectedBadge.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-emerald-50 p-4 text-center dark:bg-emerald-950/20">
                    <p className="text-[28px] font-bold text-emerald-600 dark:text-emerald-400">+{selectedBadge.xpReward}</p>
                    <p className="text-[13px] text-muted-foreground">XP Reward</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-4 text-center dark:bg-amber-950/20">
                    <p className="text-[28px] font-bold text-amber-600 dark:text-amber-400">+{selectedBadge.coinReward}</p>
                    <p className="text-[13px] text-muted-foreground">Coin Reward</p>
                  </div>
                </div>
                {selectedBadge.earned && selectedBadge.earnedAt ? (
                  <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-950/20">
                    <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <CheckCircle2 className="size-5" />
                    </div>
                    <div>
                      <p className="text-[17px] font-semibold text-emerald-700 dark:text-emerald-400">Earned!</p>
                      <p className="text-[13px] text-muted-foreground">
                        {new Date(selectedBadge.earnedAt).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Lock className="size-5" />
                    </div>
                    <div>
                      <p className="text-[17px] font-semibold text-foreground">Not yet earned</p>
                      <p className="text-[13px] text-muted-foreground">
                        {(() => { try { return selectedBadge.requirement ? JSON.parse(selectedBadge.requirement).description : 'Keep learning to unlock!' } catch { return 'Keep learning to unlock!' } })()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Create Goal Dialog ═══ */}
      <CreateGoalDialog
        open={showCreateGoal}
        onOpenChange={setShowCreateGoal}
        userId={currentUser?.id || ''}
        onCreated={fetchGoals}
      />

      {/* ═══ Edit Goal Dialog ═══ */}
      <Dialog open={!!editingGoal} onOpenChange={(open) => !open && setEditingGoal(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl ios-shadow-lg">
          {editingGoal && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Pencil className="size-4" />
                  Edit Goal
                </DialogTitle>
                <DialogDescription>Update your learning goal</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <p className="text-[14px] font-semibold">{editingGoal.title}</p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{editingGoal.current}/{editingGoal.target} {editingGoal.unit}</span>
                  </div>
                  <Progress value={editingGoal.target > 0 ? Math.min(100, (editingGoal.current / editingGoal.target) * 100) : 0} className="h-3" />
                </div>
                <div className="grid grid-cols-2 gap-3 text-[12px] text-muted-foreground">
                  <div>Started: {new Date(editingGoal.startDate).toLocaleDateString()}</div>
                  <div>Due: {new Date(editingGoal.endDate).toLocaleDateString()}</div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditingGoal(null)}
                  className="rounded-xl"
                >
                  Close
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await fetch(`/api/student/goals?goalId=${editingGoal.id}&userId=${currentUser?.id || ''}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'completed' }),
                      })
                      await fetchGoals()
                      setEditingGoal(null)
                    } catch {
                      // Silently handle
                    }
                  }}
                  className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                >
                  <CheckCircle2 className="size-4 mr-1" />
                  Mark Complete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
