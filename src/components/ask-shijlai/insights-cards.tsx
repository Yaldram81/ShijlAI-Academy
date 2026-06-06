'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Trophy,
  Clock,
  Brain,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* ─── Types ─── */
interface Insight {
  id: string
  type: string // strength, weakness, trend, suggestion, warning, achievement
  title: string
  description: string
  category: string // general, academic, study_habits, time_management, quiz_performance
  severity: string // info, warning, critical
  isActionable: boolean
  actionSuggestion: string | null
  isRead: boolean
  createdAt: string
}

interface InsightsCardsProps {
  userId: string
  maxItems?: number
}

/* ─── Insight type config ─── */
const insightTypeConfig: Record<string, { icon: typeof Lightbulb; colorClass: string; bgClass: string; borderClass: string }> = {
  strength: { icon: Trophy, colorClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-500/5', borderClass: 'border-emerald-500/20' },
  achievement: { icon: Trophy, colorClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-500/5', borderClass: 'border-emerald-500/20' },
  weakness: { icon: AlertTriangle, colorClass: 'text-red-600 dark:text-red-400', bgClass: 'bg-red-500/5', borderClass: 'border-red-500/20' },
  warning: { icon: AlertTriangle, colorClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-500/5', borderClass: 'border-amber-500/20' },
  trend: { icon: TrendingUp, colorClass: 'text-violet-600 dark:text-violet-400', bgClass: 'bg-violet-500/5', borderClass: 'border-violet-500/20' },
  suggestion: { icon: Lightbulb, colorClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-500/5', borderClass: 'border-amber-500/20' },
}

const severityConfig: Record<string, string> = {
  info: 'border-l-blue-400',
  warning: 'border-l-amber-400',
  critical: 'border-l-red-400',
}

export function InsightsCards({ userId, maxItems = 5 }: InsightsCardsProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadInsights()
  }, [userId])

  const loadInsights = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/ai/shijlai/insights?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.insights && data.insights.length > 0) {
          setInsights(data.insights.slice(0, maxItems))
        } else {
          // Fallback demo insights
          setInsights([
            {
              id: 'demo-1',
              type: 'warning',
              title: 'Quiz scores dropped this week',
              description: 'Your quiz scores dropped 15% this week - consider reviewing basics',
              category: 'quiz_performance',
              severity: 'warning',
              isActionable: true,
              actionSuggestion: 'Review foundational concepts before moving to advanced topics',
              isRead: false,
              createdAt: new Date().toISOString(),
            },
            {
              id: 'demo-2',
              type: 'achievement',
              title: 'You\'re on a 3-day streak!',
              description: 'Keep it up! Consistency is key to learning',
              category: 'study_habits',
              severity: 'info',
              isActionable: false,
              actionSuggestion: null,
              isRead: false,
              createdAt: new Date().toISOString(),
            },
            {
              id: 'demo-3',
              type: 'weakness',
              title: 'Calculus mastery declining',
              description: 'You haven\'t studied Calculus in 7 days - your mastery is declining',
              category: 'academic',
              severity: 'critical',
              isActionable: true,
              actionSuggestion: 'Spend 20 minutes reviewing Calculus today',
              isRead: false,
              createdAt: new Date().toISOString(),
            },
          ])
        }
      } else {
        setInsights([])
      }
    } catch {
      setInsights([])
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]))
    // Mark as read via API
    fetch('/api/ai/shijlai/insights', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ insightId: id, isRead: true }),
    }).catch(() => {})
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map(i => (
          <div key={i} className="h-14 rounded-lg bg-muted/20 animate-pulse" />
        ))}
      </div>
    )
  }

  const visibleInsights = insights.filter(i => !dismissed.has(i.id))
  if (visibleInsights.length === 0) return null

  return (
    <div className="space-y-1.5">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="size-3.5 text-amber-500" />
        <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
          Insights
        </span>
      </div>

      {/* Insight Cards */}
      <AnimatePresence>
        {visibleInsights.map((insight, i) => {
          const config = insightTypeConfig[insight.type] || insightTypeConfig.suggestion
          const Icon = config.icon
          const severityBorder = severityConfig[insight.severity] || severityConfig.info

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 50, height: 0, marginBottom: 0 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
              className={cn(
                'group relative rounded-xl border-l-[3px] border border-border/30 p-2.5',
                config.bgClass,
                severityBorder,
              )}
            >
              <div className="flex items-start gap-2">
                <div className={cn('shrink-0 mt-0.5', config.colorClass)}>
                  <Icon className="size-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-foreground leading-tight">
                    {insight.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-relaxed">
                    {insight.description}
                  </p>
                  {insight.isActionable && insight.actionSuggestion && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5">
                      <Lightbulb className="size-2.5" />
                      {insight.actionSuggestion}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDismiss(insight.id)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted/50"
                >
                  <X className="size-3 text-muted-foreground/40" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
