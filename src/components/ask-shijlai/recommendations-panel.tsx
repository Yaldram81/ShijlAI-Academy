'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Loader2,
  BookOpen,
  Brain,
  Calendar,
  Target,
  Route,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'

/* ─── Types ─── */
interface Recommendation {
  id: string
  type: string // lesson, quiz, course, topic, study_plan
  title: string
  description: string | null
  reason: string | null
  priority: string // low, medium, high
  status: string // active, pending, viewed, dismissed, completed
  relatedId?: string | null
  recommendedCourseId?: string | null
  createdAt: string
}

interface RecommendationsPanelProps {
  userId: string
  onStartRecommendation?: (rec: Recommendation) => void
  compact?: boolean
}

/* ─── Priority config ─── */
const priorityConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  high: { color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-500/10 border-red-500/20', label: 'High' },
  medium: { color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20', label: 'Medium' },
  low: { color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20', label: 'Low' },
}

const typeIconMap: Record<string, typeof BookOpen> = {
  lesson: BookOpen,
  quiz: Brain,
  course: Target,
  topic: Sparkles,
  study_plan: Calendar,
}

export function RecommendationsPanel({ userId, onStartRecommendation, compact = false }: RecommendationsPanelProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const { setCurrentView } = useAppStore()

  useEffect(() => {
    loadRecommendations()
  }, [userId])

  const loadRecommendations = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/ai/shijlai/recommendations?userId=${userId}&status=active`)
      if (res.ok) {
        const data = await res.json()
        setRecommendations(data.recommendations || [])
      } else {
        // Fallback demo data
        setRecommendations([
          {
            id: 'demo-1',
            type: 'topic',
            title: 'Review Calculus Fundamentals',
            description: 'Focus on limits and derivatives',
            reason: 'Your quiz scores dropped 15% this week in Calculus topics',
            priority: 'high',
            status: 'active',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'demo-2',
            type: 'quiz',
            title: 'Practice Organic Chemistry',
            description: 'Take a diagnostic quiz to identify gaps',
            reason: 'You haven\'t studied this topic in 7 days',
            priority: 'medium',
            status: 'active',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'demo-3',
            type: 'lesson',
            title: 'Advanced Data Structures',
            description: 'Continue where you left off',
            reason: 'Your mastery is improving - keep the momentum!',
            priority: 'low',
            status: 'active',
            createdAt: new Date().toISOString(),
          },
        ])
      }
    } catch {
      setRecommendations([])
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = async (recId: string) => {
    try {
      await fetch('/api/ai/shijlai/recommendations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId: recId, status: 'dismissed' }),
      })
      setRecommendations(prev => prev.filter(r => r.id !== recId))
    } catch {
      // Silently fail
    }
  }

  const handleStart = (rec: Recommendation) => {
    if (onStartRecommendation) {
      onStartRecommendation(rec)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2 p-3">
        <div className="flex items-center gap-2">
          <Loader2 className="size-3.5 text-muted-foreground/40 animate-spin" />
          <span className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-wider">Loading Path...</span>
        </div>
        {[1, 2].map(i => (
          <div key={i} className="h-12 rounded-lg bg-muted/20 animate-pulse" />
        ))}
      </div>
    )
  }

  if (recommendations.length === 0) return null

  const displayRecs = compact ? recommendations.slice(0, 3) : recommendations

  return (
    <div className={cn(compact ? 'space-y-2' : 'space-y-2')}>
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <Route className="size-3.5 text-emerald-500" />
        <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
          Your Learning Path
        </span>
        <Badge variant="outline" className="text-[8px] px-1 py-0 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
          {recommendations.length}
        </Badge>
      </div>

      {/* Recommendations */}
      <ScrollArea className={cn(!compact && 'max-h-64')}>
        <div className="space-y-1.5">
          {displayRecs.map((rec, i) => {
            const priority = priorityConfig[rec.priority] || priorityConfig.medium
            const TypeIcon = typeIconMap[rec.type] || Sparkles

            return (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group rounded-xl border border-border/40 bg-card/50 hover:bg-card hover:border-border/60 transition-all"
              >
                <div className="p-2.5">
                  <div className="flex items-start gap-2">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <TypeIcon className="size-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[12px] font-semibold text-foreground truncate">
                          {rec.title}
                        </span>
                        <Badge variant="outline" className={cn('text-[8px] px-1 py-0 shrink-0', priority.bgColor, priority.color)}>
                          {priority.label}
                        </Badge>
                      </div>
                      {rec.reason && (
                        <p className="text-[10px] text-muted-foreground/70 line-clamp-2 leading-relaxed">
                          {rec.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 mt-1.5">
                    <button
                      onClick={() => handleDismiss(rec.id)}
                      className="flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
                    >
                      <XCircle className="size-2.5" />
                      Dismiss
                    </button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleStart(rec)}
                      className="h-6 rounded-md gap-1 text-[10px] font-medium px-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <ChevronRight className="size-3" />
                      Start
                    </Button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </ScrollArea>

      {/* View All link */}
      {recommendations.length > 0 && (
        <button
          onClick={() => setCurrentView('recommendations')}
          className="flex items-center gap-1.5 w-full rounded-lg px-2 py-2 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
        >
          <ExternalLink className="size-3" />
          View AI Insights
        </button>
      )}
    </div>
  )
}
