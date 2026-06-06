'use client'

import { motion } from 'framer-motion'
import {
  Zap,
  AlertTriangle,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldCheck,
  Shield,
  ShieldAlert,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/* ─── Types ─── */
interface EnhancedWelcomeProps {
  userName: string
  recommendations: Array<{
    id: string
    title: string
    priority: string
    reason: string | null
  }>
  weakTopics: string[]
  learningSpeedScore: number
  engagementScore: number
  dropRiskScore: number
  streakDays: number
  currentMode: {
    label: string
    color: string
    bgColor: string
    borderColor: string
    gradientFrom: string
    gradientTo: string
    icon: React.ElementType
    description: string
    suggestedQuestions: Array<{ label: string; icon: React.ReactNode }>
  }
  onSendSuggestion: (text: string) => void
  onStartRecommendation: (rec: { id: string; title: string; priority: string; reason: string | null }) => void
}

/* ─── Drop Risk Mini Badge ─── */
function DropRiskMini({ score }: { score: number }) {
  let label: string
  let colorClass: string
  let Icon: typeof ShieldCheck

  if (score <= 30) {
    label = 'Safe'
    colorClass = 'text-emerald-600 dark:text-emerald-400'
    Icon = ShieldCheck
  } else if (score <= 60) {
    label = 'Warning'
    colorClass = 'text-amber-600 dark:text-amber-400'
    Icon = Shield
  } else {
    label = 'High Risk'
    colorClass = 'text-red-600 dark:text-red-400'
    Icon = ShieldAlert
  }

  return (
    <div className="flex items-center gap-1">
      <Icon className={cn('size-3.5', colorClass)} />
      <span className={cn('text-[11px] font-medium', colorClass)}>{label}</span>
    </div>
  )
}

export function EnhancedWelcome({
  userName,
  recommendations,
  weakTopics,
  learningSpeedScore,
  engagementScore,
  dropRiskScore,
  streakDays,
  currentMode,
  onSendSuggestion,
  onStartRecommendation,
}: EnhancedWelcomeProps) {
  const ModeIcon = currentMode.icon

  const topRecs = recommendations.slice(0, 3)

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-8">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6">

        {/* AI Logo */}
        <motion.div
          key={currentMode.label}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="relative"
        >
          <div className={cn(
            'flex size-16 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-lg',
            currentMode.gradientFrom, currentMode.gradientTo
          )}>
            <ModeIcon className="size-8" />
          </div>
        </motion.div>

        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center max-w-md"
        >
          <h2 className="text-[24px] font-bold text-foreground">
            {`Hello, ${userName}! 👋`}
          </h2>
          <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">
            {currentMode.description}
          </p>
        </motion.div>

        {/* Mode Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-2"
        >
          <Badge variant="outline" className={cn('gap-1.5 text-[11px] px-3 py-1', currentMode.bgColor, currentMode.color, currentMode.borderColor)}>
            <ModeIcon className="size-3" />
            {currentMode.label} Mode
          </Badge>
        </motion.div>

        {/* ─── Your Learning Path Today ─── */}
        {topRecs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full"
          >
            <div className="flex items-center gap-2 mb-3">
              <Target className="size-4 text-emerald-500" />
              <h3 className="text-[14px] font-semibold text-foreground">Your Learning Path Today</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {topRecs.map((rec, i) => {
                const priorityColors: Record<string, string> = {
                  high: 'border-red-500/30 bg-red-500/5',
                  medium: 'border-amber-500/30 bg-amber-500/5',
                  low: 'border-emerald-500/30 bg-emerald-500/5',
                }
                return (
                  <motion.button
                    key={rec.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.06 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onStartRecommendation(rec)}
                    className={cn(
                      'flex flex-col items-start rounded-2xl border p-3 text-left transition-all hover:shadow-sm',
                      priorityColors[rec.priority] || 'border-border/40 bg-card'
                    )}
                  >
                    <Badge variant="outline" className={cn(
                      'text-[8px] px-1 py-0 mb-1.5',
                      rec.priority === 'high' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' :
                      rec.priority === 'medium' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    )}>
                      {rec.priority}
                    </Badge>
                    <span className="text-[12px] font-semibold text-foreground leading-tight">{rec.title}</span>
                    {rec.reason && (
                      <span className="text-[10px] text-muted-foreground/60 mt-1 line-clamp-2">{rec.reason}</span>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ─── Quick Stats ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="w-full grid grid-cols-3 gap-2"
        >
          {/* Learning Speed */}
          <div className="rounded-2xl border border-border/40 bg-card p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Zap className="size-3.5 text-emerald-500" />
              <span className="text-[10px] font-medium text-muted-foreground/60">Learning Speed</span>
            </div>
            <p className="text-[18px] font-bold text-foreground">{Math.round(learningSpeedScore)}</p>
            <div className="h-1 rounded-full bg-muted/30 mt-1.5 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${learningSpeedScore}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
              />
            </div>
          </div>

          {/* Engagement */}
          <div className="rounded-2xl border border-border/40 bg-card p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="size-3.5 text-violet-500" />
              <span className="text-[10px] font-medium text-muted-foreground/60">Engagement</span>
            </div>
            <p className="text-[18px] font-bold text-foreground">{Math.round(engagementScore)}</p>
            <div className="h-1 rounded-full bg-muted/30 mt-1.5 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-violet-500"
                initial={{ width: 0 }}
                animate={{ width: `${engagementScore}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.55 }}
              />
            </div>
          </div>

          {/* Drop Risk */}
          <div className="rounded-2xl border border-border/40 bg-card p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertTriangle className={cn(
                'size-3.5',
                dropRiskScore <= 30 ? 'text-emerald-500' : dropRiskScore <= 60 ? 'text-amber-500' : 'text-red-500'
              )} />
              <span className="text-[10px] font-medium text-muted-foreground/60">Drop Risk</span>
            </div>
            <p className={cn(
              'text-[18px] font-bold',
              dropRiskScore <= 30 ? 'text-emerald-600' : dropRiskScore <= 60 ? 'text-amber-600' : 'text-red-600'
            )}>
              {Math.round(dropRiskScore)}
            </p>
            <DropRiskMini score={dropRiskScore} />
          </div>
        </motion.div>

        {/* ─── Topics to Focus On ─── */}
        {weakTopics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="size-3.5 text-amber-500" />
              <span className="text-[12px] font-semibold text-muted-foreground/70">Topics to Focus On</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {weakTopics.slice(0, 6).map((topic) => (
                <motion.button
                  key={topic}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSendSuggestion(`Help me review ${topic}`)}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors"
                >
                  <AlertTriangle className="size-3" />
                  {topic}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ─── Suggested Questions Grid ─── */}
        <motion.div
          key={`questions-${currentMode.label}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2"
        >
          {currentMode.suggestedQuestions.map((question, i) => (
            <motion.button
              key={question.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.06 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSendSuggestion(question.label)}
              className={cn(
                'flex items-center gap-3 rounded-2xl border border-border/40 bg-card px-4 py-3.5 text-left transition-all hover:shadow-sm group',
                `hover:${currentMode.bgColor}`
              )}
            >
              <span className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors',
                `group-hover:${currentMode.bgColor}`,
                `group-hover:${currentMode.color}`
              )}>
                {question.icon}
              </span>
              <span className="text-[13px] font-medium text-foreground">{question.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Streak indicator */}
        {streakDays > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-2 text-[12px] text-amber-500"
          >
            <span className="text-lg">🔥</span>
            <span className="font-medium">{streakDays}-day streak! Keep it going!</span>
          </motion.div>
        )}
      </div>
    </div>
  )
}
