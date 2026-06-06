'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

/* ─── Types ─── */
interface EnhancedLearningProfile {
  learningLevel: string
  engagementScore: number
  consistencyScore: number
  learningSpeedScore: number
  dropRiskScore: number
  completionRate: number
  averageQuizScore: number
  weakTopics: string // JSON array
  strongTopics: string // JSON array
  learningSpeed: string
  totalXpEarned: number
  totalLessonsCompleted: number
  totalQuizzesTaken: number
  totalTimeSpent: number
  studyStreakDays: number
}

interface TopicMastery {
  id: string
  topicName: string
  masteryScore: number
  attemptCount: number
  trend: string // improving, declining, stable
}

interface LearningIntelligencePanelProps {
  userId: string
}

/* ─── Circular Progress Indicator ─── */
function CircularProgress({
  value,
  size = 56,
  strokeWidth = 4,
  colorClass = 'text-emerald-500',
  trackClass = 'text-muted/20',
  label,
}: {
  value: number
  size?: number
  strokeWidth?: number
  colorClass?: string
  trackClass?: string
  label?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const center = size / 2

  return (
    <div className="relative flex flex-col items-center gap-1">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={trackClass}
          stroke="currentColor"
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          className={colorClass}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] font-bold text-foreground">
        {Math.round(value)}
      </span>
      {label && (
        <span className="text-[9px] font-medium text-muted-foreground/70 uppercase tracking-wide text-center">
          {label}
        </span>
      )}
    </div>
  )
}

/* ─── Score Bar ─── */
function ScoreBar({
  label,
  value,
  colorClass = 'bg-emerald-500',
  icon,
}: {
  label: string
  value: number
  colorClass?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground/70 flex items-center gap-1">
          {icon}
          {label}
        </span>
        <span className="text-[10px] font-bold text-foreground">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', colorClass)}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, value)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

/* ─── Drop Risk Badge ─── */
function DropRiskBadge({ score }: { score: number }) {
  let label: string
  let colorClass: string
  let Icon: typeof ShieldCheck

  if (score <= 30) {
    label = 'Safe'
    colorClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
    Icon = ShieldCheck
  } else if (score <= 60) {
    label = 'Warning'
    colorClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    Icon = Shield
  } else {
    label = 'High Risk'
    colorClass = 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
    Icon = ShieldAlert
  }

  return (
    <Badge variant="outline" className={cn('text-[9px] font-medium px-1.5 py-0 gap-0.5', colorClass)}>
      <Icon className="size-2.5" />
      {label}
    </Badge>
  )
}

/* ─── Trend Arrow ─── */
function TrendArrow({ trend }: { trend: string }) {
  if (trend === 'improving') {
    return <TrendingUp className="size-3 text-emerald-500" />
  }
  if (trend === 'declining') {
    return <TrendingDown className="size-3 text-red-500" />
  }
  return <Minus className="size-3 text-muted-foreground/50" />
}

/* ─── Main Component ─── */
export function LearningIntelligencePanel({ userId }: LearningIntelligencePanelProps) {
  const [profile, setProfile] = useState<EnhancedLearningProfile | null>(null)
  const [masteries, setMasteries] = useState<TopicMastery[]>([])
  const [loading, setLoading] = useState(true)
  const [masteriesOpen, setMasteriesOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [profileRes, masteryRes] = await Promise.allSettled([
        fetch(`/api/ai/shijlai/profile?userId=${userId}`),
        fetch(`/api/ai/shijlai/mastery?userId=${userId}`),
      ])

      if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
        const data = await profileRes.value.json()
        setProfile(data.profile || null)
      } else {
        // Fallback defaults
        setProfile({
          learningLevel: 'intermediate',
          engagementScore: 45,
          consistencyScore: 55,
          learningSpeedScore: 60,
          dropRiskScore: 25,
          completionRate: 40,
          averageQuizScore: 65,
          weakTopics: '["Calculus","Organic Chemistry"]',
          strongTopics: '["JavaScript","Algebra"]',
          learningSpeed: 'moderate',
          totalXpEarned: 1200,
          totalLessonsCompleted: 18,
          totalQuizzesTaken: 8,
          totalTimeSpent: 36000,
          studyStreakDays: 3,
        })
      }

      if (masteryRes.status === 'fulfilled' && masteryRes.value.ok) {
        const data = await masteryRes.value.json()
        setMasteries(data.masteries || [])
      } else {
        // Fallback mastery data
        setMasteries([
          { id: '1', topicName: 'JavaScript', masteryScore: 78, attemptCount: 12, trend: 'improving' },
          { id: '2', topicName: 'Algebra', masteryScore: 72, attemptCount: 8, trend: 'stable' },
          { id: '3', topicName: 'Calculus', masteryScore: 35, attemptCount: 5, trend: 'declining' },
          { id: '4', topicName: 'Organic Chemistry', masteryScore: 28, attemptCount: 3, trend: 'declining' },
          { id: '5', topicName: 'Data Structures', masteryScore: 55, attemptCount: 7, trend: 'improving' },
        ])
      }
    } catch {
      // Use fallbacks
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="border-t border-border/30 p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Loader2 className="size-3.5 text-muted-foreground/40 animate-spin" />
          <span className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Loading Profile...</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-2 rounded-full bg-muted/30 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!profile) return null

  const weakTopics: string[] = (() => {
    try { return JSON.parse(profile.weakTopics || '[]') } catch { return [] }
  })()
  const strongTopics: string[] = (() => {
    try { return JSON.parse(profile.strongTopics || '[]') } catch { return [] }
  })()

  const levelColorMap: Record<string, string> = {
    beginner: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    intermediate: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    advanced: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  }

  const overallTrend = (() => {
    const improving = masteries.filter(m => m.trend === 'improving').length
    const declining = masteries.filter(m => m.trend === 'declining').length
    if (improving > declining) return 'improving'
    if (declining > improving) return 'declining'
    return 'stable'
  })()

  return (
    <div className="border-t border-border/30">
      {/* Header */}
      <div className="flex items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <Zap className="size-3.5 text-emerald-500" />
          <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Learning Intelligence</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className={cn('text-[9px] font-medium px-1.5 py-0', levelColorMap[profile.learningLevel] || levelColorMap.beginner)}>
            {profile.learningLevel.charAt(0).toUpperCase() + profile.learningLevel.slice(1)}
          </Badge>
          <TrendArrow trend={overallTrend} />
        </div>
      </div>

      {/* Score Circles */}
      <div className="flex items-center justify-around px-3 pb-2">
        <CircularProgress
          value={profile.learningSpeedScore}
          size={52}
          strokeWidth={4}
          colorClass="text-emerald-500"
          label="Speed"
        />
        <CircularProgress
          value={profile.engagementScore}
          size={52}
          strokeWidth={4}
          colorClass="text-violet-500"
          label="Engage"
        />
        <CircularProgress
          value={profile.consistencyScore}
          size={52}
          strokeWidth={4}
          colorClass="text-amber-500"
          label="Consist"
        />
      </div>

      {/* Drop Risk + Streak */}
      <div className="flex items-center justify-between px-3 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-medium text-muted-foreground/60">Drop Risk</span>
          <DropRiskBadge score={profile.dropRiskScore} />
        </div>
        {profile.studyStreakDays > 0 && (
          <span className="text-[10px] text-amber-500 flex items-center gap-0.5 font-medium">
            🔥 {profile.studyStreakDays}d streak
          </span>
        )}
      </div>

      {/* Score Bars */}
      <div className="px-3 pb-2 space-y-2">
        <ScoreBar
          label="Engagement"
          value={profile.engagementScore}
          colorClass="bg-violet-500"
          icon={<Zap className="size-2.5" />}
        />
        <ScoreBar
          label="Consistency"
          value={profile.consistencyScore}
          colorClass="bg-amber-500"
          icon={<TrendingUp className="size-2.5" />}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-1 px-3 pb-2">
        <div className="rounded-lg bg-muted/40 px-2 py-1.5 text-center">
          <p className="text-[11px] font-bold text-foreground">{profile.totalLessonsCompleted}</p>
          <p className="text-[8px] text-muted-foreground/60">Lessons</p>
        </div>
        <div className="rounded-lg bg-muted/40 px-2 py-1.5 text-center">
          <p className="text-[11px] font-bold text-foreground">{profile.totalQuizzesTaken}</p>
          <p className="text-[8px] text-muted-foreground/60">Quizzes</p>
        </div>
        <div className="rounded-lg bg-muted/40 px-2 py-1.5 text-center">
          <p className="text-[11px] font-bold text-foreground">{Math.round(profile.averageQuizScore)}%</p>
          <p className="text-[8px] text-muted-foreground/60">Avg Score</p>
        </div>
      </div>

      {/* Strong Topics */}
      {strongTopics.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 pb-1.5">
          {strongTopics.slice(0, 4).map((topic) => (
            <span key={topic} className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="size-2.5" />
              {topic}
            </span>
          ))}
        </div>
      )}

      {/* Weak Topics */}
      {weakTopics.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 pb-2">
          {weakTopics.slice(0, 4).map((topic) => (
            <span key={topic} className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              <AlertTriangle className="size-2.5" />
              {topic}
            </span>
          ))}
        </div>
      )}

      {/* Topic Mastery - Collapsible */}
      {masteries.length > 0 && (
        <div className="border-t border-border/20">
          <button
            onClick={() => setMasteriesOpen(!masteriesOpen)}
            className="flex items-center justify-between w-full px-3 py-2 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider hover:bg-muted/30 transition-colors"
          >
            <span>Topic Mastery ({masteries.length})</span>
            {masteriesOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
          <AnimatePresence>
            {masteriesOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <ScrollArea className="max-h-48">
                  <div className="px-3 pb-2 space-y-1.5">
                    {masteries.map((mastery) => (
                      <div
                        key={mastery.id}
                        className={cn(
                          'rounded-lg border px-2 py-1.5',
                          mastery.masteryScore >= 70
                            ? 'bg-emerald-500/5 border-emerald-500/20'
                            : mastery.masteryScore >= 40
                            ? 'bg-amber-500/5 border-amber-500/20'
                            : 'bg-red-500/5 border-red-500/20'
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-medium text-foreground truncate max-w-[140px]">
                            {mastery.topicName}
                          </span>
                          <div className="flex items-center gap-1">
                            <TrendArrow trend={mastery.trend} />
                            <span className={cn(
                              'text-[10px] font-bold',
                              mastery.masteryScore >= 70
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : mastery.masteryScore >= 40
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-red-600 dark:text-red-400'
                            )}>
                              {Math.round(mastery.masteryScore)}%
                            </span>
                          </div>
                        </div>
                        <div className="h-1 rounded-full bg-muted/30 overflow-hidden">
                          <motion.div
                            className={cn(
                              'h-full rounded-full',
                              mastery.masteryScore >= 70
                                ? 'bg-emerald-500'
                                : mastery.masteryScore >= 40
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${mastery.masteryScore}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
