'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy,
  Flame,
  Coins,
  Medal,
  Star,
  Lock,
  TrendingUp,
  Target,
  Zap,
  Crown,
  CheckCircle2,
  Loader2,
  BookOpen,
  Award,
  BarChart3,
  ChevronRight,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts'

interface BadgeData {
  id: string
  name: string
  description: string
  icon: string
  category: string
  xpReward: number
  coinReward: number
  requirement: string
  earned: boolean
  earnedAt: string | null
}

interface GamificationData {
  gamification: {
    xp: number
    level: number
    levelProgress: number
    xpToNextLevel: number
    coins: number
    streak: number
    longestStreak: number
  }
  badges: BadgeData[]
  stats: {
    totalQuizzes: number
    passedQuizzes: number
    perfectQuizzes: number
    enrollmentCount: number
    completedCourses: number
  }
  leaderboard: {
    id: string
    name: string
    avatar: string | null
    xp: number
    level: number
    streak: number
  }[]
}

interface DailyChallenge {
  id: string
  title: string
  description: string
  progress: number
  target: number
  icon: React.ReactNode
  xpReward: number
}

const DAILY_CHALLENGES: DailyChallenge[] = [
  {
    id: 'dc1',
    title: 'Complete 2 Lessons',
    description: 'Finish any 2 lessons today',
    progress: 1,
    target: 2,
    icon: <BookOpen className="size-4" />,
    xpReward: 25,
  },
  {
    id: 'dc2',
    title: 'Score 80%+ on a Quiz',
    description: 'Get at least 80% on any quiz',
    progress: 0,
    target: 1,
    icon: <Target className="size-4" />,
    xpReward: 30,
  },
  {
    id: 'dc3',
    title: 'Maintain Your Streak',
    description: 'Stay active today to keep your streak',
    progress: 1,
    target: 1,
    icon: <Flame className="size-4" />,
    xpReward: 15,
  },
]

const XP_BREAKDOWN = [
  { name: 'Lessons', value: 450, color: '#10b981' },
  { name: 'Quizzes', value: 320, color: '#14b8a6' },
  { name: 'Streaks', value: 180, color: '#f59e0b' },
  { name: 'Badges', value: 250, color: '#8b5cf6' },
]

// Fallback data when API is not available
const FALLBACK_DATA: GamificationData = {
  gamification: {
    xp: 2450,
    level: 5,
    levelProgress: 63,
    xpToNextLevel: 110,
    coins: 320,
    streak: 7,
    longestStreak: 14,
  },
  badges: [
    { id: '1', name: 'First Steps', description: 'Complete your first lesson', icon: '🚀', category: 'learning', xpReward: 50, coinReward: 10, requirement: '{"type":"lessons","value":1,"description":"Complete 1 lesson"}', earned: true, earnedAt: '2025-01-20T10:00:00Z' },
    { id: '2', name: 'Bookworm', description: 'Complete 10 lessons', icon: '📚', category: 'learning', xpReward: 100, coinReward: 25, requirement: '{"type":"lessons","value":10,"description":"Complete 10 lessons"}', earned: true, earnedAt: '2025-02-15T14:30:00Z' },
    { id: '3', name: 'Brain Power', description: 'Score 90%+ on 5 quizzes', icon: '🧠', category: 'achievement', xpReward: 150, coinReward: 30, requirement: '{"type":"quiz_score","value":90,"description":"Score 90%+ on 5 quizzes"}', earned: true, earnedAt: '2025-03-01T09:00:00Z' },
    { id: '4', name: 'On Fire', description: 'Maintain a 7-day streak', icon: '🔥', category: 'streak', xpReward: 200, coinReward: 50, requirement: '{"type":"streak","value":7,"description":"Maintain a 7-day streak"}', earned: true, earnedAt: '2025-03-10T08:00:00Z' },
    { id: '5', name: 'Quick Learner', description: 'Complete 3 lessons in one day', icon: '⚡', category: 'achievement', xpReward: 100, coinReward: 20, requirement: '{"type":"daily_lessons","value":3,"description":"Complete 3 lessons in one day"}', earned: false, earnedAt: null },
    { id: '6', name: 'Champion', description: 'Reach the top of the leaderboard', icon: '🏆', category: 'achievement', xpReward: 500, coinReward: 100, requirement: '{"type":"leaderboard","value":1,"description":"Reach rank 1 on leaderboard"}', earned: false, earnedAt: null },
    { id: '7', name: 'Graduate', description: 'Complete your first course', icon: '🎓', category: 'learning', xpReward: 300, coinReward: 75, requirement: '{"type":"courses","value":1,"description":"Complete 1 course"}', earned: false, earnedAt: null },
    { id: '8', name: 'Scholar', description: 'Earn 5000 XP total', icon: '📜', category: 'achievement', xpReward: 250, coinReward: 60, requirement: '{"type":"xp","value":5000,"description":"Earn 5000 XP"}', earned: false, earnedAt: null },
  ],
  stats: {
    totalQuizzes: 12,
    passedQuizzes: 8,
    perfectQuizzes: 2,
    enrollmentCount: 3,
    completedCourses: 0,
  },
  leaderboard: [
    { id: 'u1', name: 'Fatima Khan', avatar: null, xp: 5200, level: 8, streak: 21 },
    { id: 'u2', name: 'Hassan Ali', avatar: null, xp: 4100, level: 7, streak: 14 },
    { id: 'u3', name: 'Ayesha Malik', avatar: null, xp: 3800, level: 7, streak: 10 },
    { id: 'demo-user-1', name: 'Ahmad Ali', avatar: null, xp: 2450, level: 5, streak: 7 },
    { id: 'u5', name: 'Sara Ahmed', avatar: null, xp: 2100, level: 4, streak: 5 },
    { id: 'u6', name: 'Omar Farooq', avatar: null, xp: 1800, level: 4, streak: 3 },
    { id: 'u7', name: 'Zainab Hussain', avatar: null, xp: 1500, level: 3, streak: 8 },
    { id: 'u8', name: 'Bilal Siddiqui', avatar: null, xp: 1200, level: 3, streak: 2 },
    { id: 'u9', name: 'Maryam Nawaz', avatar: null, xp: 900, level: 2, streak: 4 },
    { id: 'u10', name: 'Usman Sheikh', avatar: null, xp: 600, level: 2, streak: 1 },
  ],
}

function StatWidget({
  icon,
  label,
  value,
  color,
  iconBg,
  delay,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  color?: string
  iconBg: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 400, damping: 25 }}
      className="rounded-2xl ios-shadow-sm bg-card p-4 ios-press relative overflow-hidden"
    >
      {/* Icon in top-right */}
      <div className={`absolute top-3 right-3 flex size-8 items-center justify-center rounded-full ${iconBg}`}>
        {icon}
      </div>
      <p className="text-[28px] font-bold text-foreground">{value}</p>
      <p className="text-[13px] text-muted-foreground mt-0.5">{label}</p>
    </motion.div>
  )
}

function BadgeCard({
  badgeData,
  onClick,
  index,
}: {
  badgeData: BadgeData
  onClick: () => void
  index: number
}) {
  const isEarned = badgeData.earned

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 400, damping: 25 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`cursor-pointer rounded-2xl ios-shadow-sm bg-card p-4 transition-all relative ${
        isEarned ? '' : 'opacity-50 grayscale'
      }`}
    >
      {/* Lock overlay for unearned */}
      {!isEarned && (
        <div className="absolute top-2 right-2">
          <Lock className="size-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="text-[32px]">
          {isEarned ? badgeData.icon : '🔒'}
        </div>
        <div>
          <p className={`text-[13px] font-semibold ${isEarned ? 'text-foreground' : 'text-muted-foreground'}`}>
            {badgeData.name}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
            {badgeData.description}
          </p>
        </div>
        {isEarned && badgeData.earnedAt && (
          <span className="text-[11px] text-emerald-500 font-medium">
            {new Date(badgeData.earnedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </motion.div>
  )
}

function LeaderboardRow({
  entry,
  rank,
  isCurrentUser,
  delay,
}: {
  entry: { id: string; name: string; avatar: string | null; xp: number; level: number; streak: number }
  rank: number
  isCurrentUser: boolean
  delay: number
}) {
  const rankColors: Record<number, string> = {
    1: 'bg-yellow-400 text-yellow-900',
    2: 'bg-gray-300 text-gray-700',
    3: 'bg-amber-600 text-amber-100',
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, type: 'spring', stiffness: 400, damping: 25 }}
      className={`flex items-center gap-3 p-3 ios-press transition-all ${
        isCurrentUser
          ? 'rounded-xl bg-primary/10'
          : rank <= 3
          ? ''
          : ''
      }`}
    >
      {/* Rank number circle */}
      <div className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
        rankColors[rank] || 'bg-muted text-muted-foreground'
      }`}>
        {rank}
      </div>

      {/* Avatar */}
      <Avatar className="size-9 shrink-0">
        <AvatarImage src={entry.avatar || undefined} alt={entry.name} />
        <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-bold dark:bg-emerald-900/40 dark:text-emerald-400">
          {entry.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className={`truncate text-[17px] font-medium ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
            {entry.name}
          </p>
          {isCurrentUser && (
            <Badge className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0 rounded-full">You</Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <span>Lv.{entry.level}</span>
          {entry.streak > 0 && (
            <>
              <span>·</span>
              <span>🔥 {entry.streak}</span>
            </>
          )}
        </div>
      </div>

      {/* XP */}
      <div className="shrink-0 text-right">
        <p className="text-[17px] font-bold text-primary">
          {entry.xp.toLocaleString()}
        </p>
        <p className="text-[11px] text-muted-foreground">XP</p>
      </div>
    </motion.div>
  )
}

function DailyChallengeCard({
  challenge,
  delay,
}: {
  challenge: DailyChallenge
  delay: number
}) {
  const progressPercent = Math.round((challenge.progress / challenge.target) * 100)
  const isComplete = challenge.progress >= challenge.target

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, type: 'spring', stiffness: 400, damping: 25 }}
      className="rounded-2xl bg-accent/30 p-4"
    >
      <div className="flex items-center gap-3">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
          isComplete
            ? 'bg-emerald-500 text-white'
            : 'bg-muted text-muted-foreground'
        }`}>
          {isComplete ? <CheckCircle2 className="size-5" /> : challenge.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="text-[17px] font-medium text-foreground">{challenge.title}</p>
            <span className="text-[13px] font-bold text-primary">+{challenge.xpReward} XP</span>
          </div>
          <p className="text-[13px] text-muted-foreground">{challenge.description}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ delay: delay + 0.2, duration: 0.8, type: 'spring', stiffness: 100, damping: 20 }}
                className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-primary'}`}
              />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground">
              {challenge.progress}/{challenge.target}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Custom label for the pie chart
const RADIAN = Math.PI / 180
function renderCustomizedLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
}) {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  if (percent < 0.1) return null

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-[11px] font-bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function AchievementsView() {
  const { currentUser } = useAppStore()
  const [data, setData] = useState<GamificationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/gamification?userId=${currentUser?.id || 'demo-user-1'}`)
        if (res.ok) {
          const json = await res.json()
          // Add rank to leaderboard
          const leaderboardWithRank = json.leaderboard.map(
            (entry: { id: string; name: string; avatar: string | null; xp: number; level: number; streak: number }, i: number) => ({
              ...entry,
              rank: i + 1,
            })
          )
          setData({ ...json, leaderboard: leaderboardWithRank })
        } else {
          setData(FALLBACK_DATA)
        }
      } catch {
        setData(FALLBACK_DATA)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentUser?.id])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-[17px] text-muted-foreground">Loading achievements...</p>
        </motion.div>
      </div>
    )
  }

  if (!data) return null

  const { gamification, badges, leaderboard } = data
  const earnedBadges = badges.filter((b) => b.earned)
  const lockedBadges = badges.filter((b) => !b.earned)

  // Find current user rank in leaderboard
  const currentUserRank = leaderboard.findIndex(
    (entry) => entry.id === currentUser?.id || entry.id === 'demo-user-1'
  ) + 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="space-y-6"
    >
      {/* iOS Large Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <h1 className="text-[34px] font-bold text-foreground">Achievements</h1>
      </motion.div>

      {/* Stats Row - 2x2 iOS widget grid */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <StatWidget
          icon={<Zap className="size-4 text-emerald-600" />}
          label="Total XP"
          value={gamification.xp.toLocaleString()}
          iconBg="bg-emerald-100 dark:bg-emerald-950/40"
          delay={0}
        />
        <StatWidget
          icon={<Star className="size-4 text-amber-500" />}
          label="Level"
          value={gamification.level}
          iconBg="bg-amber-100 dark:bg-amber-950/40"
          delay={0.05}
        />
        <StatWidget
          icon={<Flame className="size-4 text-red-500 streak-fire" />}
          label="Current Streak"
          value={`${gamification.streak}d`}
          iconBg="bg-red-100 dark:bg-red-950/40"
          delay={0.1}
        />
        <StatWidget
          icon={<Coins className="size-4 text-amber-500" />}
          label="ShijlCoins"
          value={gamification.coins}
          iconBg="bg-amber-100 dark:bg-amber-950/40"
          delay={0.15}
        />
      </div>

      {/* Level Progress Card - Prominent gradient card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 25 }}
        className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white ios-shadow"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[13px] font-medium text-white/70">Current Level</p>
            <p className="text-[34px] font-bold leading-none mt-1">{gamification.level}</p>
          </div>
          <div className="flex size-14 items-center justify-center rounded-2xl bg-white/20">
            <Star className="size-7 text-white" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-[13px]">
            <span className="text-white/70">{gamification.xp.toLocaleString()} XP</span>
            <span className="text-white/70">{gamification.xpToNextLevel} XP to Level {gamification.level + 1}</span>
          </div>
          <div className="h-3 rounded-full bg-white/20 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${gamification.levelProgress}%` }}
              transition={{ delay: 0.4, duration: 1, type: 'spring', stiffness: 100, damping: 20 }}
              className="h-full rounded-full bg-white xp-glow"
            />
          </div>
        </div>
      </motion.div>

      {/* Badges Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[22px] font-bold text-foreground">Badges</h2>
          <div className="flex items-center gap-1.5 rounded-full bg-accent/50 px-3 py-1">
            <Award className="size-3.5 text-primary" />
            <span className="text-[13px] font-medium text-primary">{earnedBadges.length}/{badges.length}</span>
          </div>
        </div>

        {/* All badges in one grid */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {/* Earned badges first */}
          {earnedBadges.map((badge, i) => (
            <BadgeCard
              key={badge.id}
              badgeData={badge}
              onClick={() => setSelectedBadge(badge)}
              index={i}
            />
          ))}
          {/* Locked badges */}
          {lockedBadges.map((badge, i) => (
            <BadgeCard
              key={badge.id}
              badgeData={badge}
              onClick={() => setSelectedBadge(badge)}
              index={earnedBadges.length + i}
            />
          ))}
        </div>
      </div>

      {/* Daily Challenges */}
      <div>
        <h2 className="text-[22px] font-bold text-foreground mb-4">Daily Challenges</h2>
        <div className="space-y-3">
          {DAILY_CHALLENGES.map((challenge, i) => (
            <DailyChallengeCard key={challenge.id} challenge={challenge} delay={i * 0.1} />
          ))}
        </div>
      </div>

      {/* Two column: Leaderboard + XP Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leaderboard - iOS contact list style */}
        <div>
          <h2 className="text-[22px] font-bold text-foreground mb-4 flex items-center gap-2">
            <Crown className="size-5 text-yellow-500" />
            Leaderboard
          </h2>
          <div className="rounded-2xl bg-card ios-shadow-sm overflow-hidden">
            <div className="max-h-96 overflow-y-auto scrollbar-thin divide-y divide-border/30">
              {leaderboard.map((entry, i) => (
                <LeaderboardRow
                  key={entry.id}
                  entry={entry}
                  rank={i + 1}
                  isCurrentUser={entry.id === currentUser?.id || entry.id === 'demo-user-1'}
                  delay={i * 0.05}
                />
              ))}
            </div>
          </div>
        </div>

        {/* XP Breakdown */}
        <div>
          <h2 className="text-[22px] font-bold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="size-5 text-primary" />
            XP Breakdown
          </h2>
          <div className="rounded-2xl ios-shadow-sm bg-card p-4">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={XP_BREAKDOWN}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {XP_BREAKDOWN.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
                      fontSize: '13px',
                    }}
                    formatter={(value: number) => [`${value} XP`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-4">
              {XP_BREAKDOWN.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[13px] text-muted-foreground">
                    {item.name}: <span className="font-medium text-foreground">{item.value} XP</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Badge Detail Dialog - iOS style */}
      <Dialog open={!!selectedBadge} onOpenChange={(open) => !open && setSelectedBadge(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl ios-shadow-lg">
          {selectedBadge && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className={`flex size-14 items-center justify-center rounded-2xl text-[32px] ${
                    selectedBadge.earned
                      ? 'bg-accent/50'
                      : 'bg-muted'
                  }`}>
                    {selectedBadge.earned ? selectedBadge.icon : <Lock className="size-6 text-muted-foreground" />}
                  </span>
                  <div className="text-left">
                    <span className="text-[22px] font-bold">{selectedBadge.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="rounded-full bg-accent/50 px-2 py-0.5 text-[11px] font-medium text-primary">
                        {selectedBadge.category}
                      </span>
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <p className="text-[17px] text-muted-foreground">{selectedBadge.description}</p>

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
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
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
                        {(() => {
                          try {
                            const req = JSON.parse(selectedBadge.requirement)
                            return req.description || 'Keep learning to unlock this badge!'
                          } catch {
                            return 'Keep learning to unlock this badge!'
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
