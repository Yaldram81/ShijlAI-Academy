'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Brain, CheckCircle2, Clock, Lock, Star, ArrowRight,
  Loader2, RefreshCw, Route, BookOpen, Target, Zap, Trophy,
  ChevronRight, Play, Shield, Flame, ChevronDown, ChevronUp,
} from 'lucide-react'
import { ShijlAIText } from '@/components/ui/brand-text'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/* ═══════════════════════════════════════════════════════
   TYPES — matches API response
   ═══════════════════════════════════════════════════════ */

interface PathNode {
  id: string
  title: string
  description: string
  type: 'lesson' | 'quiz' | 'assignment' | 'project' | 'practice' | 'milestone'
  status: 'locked' | 'available' | 'in_progress' | 'completed' | 'skipped' | 'recommended'
  priority: 'critical' | 'high' | 'normal'
  masteryScore: number
  masteryRequired: number
  xpReward: number
  durationMinutes: number
  sequenceOrder: number
  unlockRequirement: string | null
}

interface LearningPathData {
  id: string
  title: string
  description: string
  status: 'active' | 'completed' | 'paused'
  progress: number
  courseId: string | null
  careerPathId: string | null
  generatedAt: string
  nodes: PathNode[]
}

interface CareerRoadmap {
  id: string
  title: string
  icon: string
  description: string
  category: string
  skillRoadmap: { skill: string; requiredLevel: string; estimatedHours: number }[]
  progress: number
  matchPercentage: number
  totalSteps: number
  completedSteps: number
}

interface LearningPathResponse {
  paths: LearningPathData[]
  careerPaths: CareerRoadmap[]
  aiInsight: string
  stats: {
    totalNodes: number
    completed: number
    available: number
    inProgress: number
    locked: number
    recommended: number
  }
  skillContextForAI: string
}

interface KnowledgePrereq {
  topic: string
  requires: { name: string; met: boolean }[]
}

interface LearningPathTabProps {
  userId: string
  onAskShijlAI: (context: string) => void
}

type SubTab = 'my-path' | 'career-paths'

/* ═══════════════════════════════════════════════════════
   STATUS CONFIG
   ═══════════════════════════════════════════════════════ */

const nodeStatusConfig: Record<string, {
  dot: string; bg: string; border: string; text: string; barColor: string; label: string; iconColor: string
}> = {
  completed: { dot: 'bg-emerald-500', bg: 'bg-emerald-500/8', border: 'border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', barColor: '[&>div]:bg-emerald-500', label: 'Completed', iconColor: 'text-emerald-500' },
  in_progress: { dot: 'bg-amber-500', bg: 'bg-amber-500/8', border: 'border-amber-500/20', text: 'text-amber-600 dark:text-amber-400', barColor: '[&>div]:bg-amber-500', label: 'In Progress', iconColor: 'text-amber-500' },
  available: { dot: 'bg-teal-500', bg: 'bg-teal-500/8', border: 'border-teal-500/20', text: 'text-teal-600 dark:text-teal-400', barColor: '[&>div]:bg-teal-500', label: 'Available', iconColor: 'text-teal-500' },
  recommended: { dot: 'bg-cyan-500', bg: 'bg-cyan-500/8', border: 'border-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-400', barColor: '[&>div]:bg-cyan-500', label: 'Recommended', iconColor: 'text-cyan-500' },
  locked: { dot: 'bg-slate-400', bg: 'bg-slate-500/5', border: 'border-slate-500/15', text: 'text-slate-500 dark:text-slate-400', barColor: '[&>div]:bg-slate-400', label: 'Locked', iconColor: 'text-slate-400' },
  skipped: { dot: 'bg-gray-400', bg: 'bg-gray-500/5', border: 'border-gray-500/15', text: 'text-gray-500', barColor: '[&>div]:bg-gray-400', label: 'Skipped', iconColor: 'text-gray-400' },
}

const nodeTypeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  lesson: { label: 'Lesson', color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-500/10' },
  quiz: { label: 'Quiz', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10' },
  practice: { label: 'Practice', color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-500/10' },
  project: { label: 'Project', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10' },
  milestone: { label: 'Milestone', color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-500/10' },
  assignment: { label: 'Assignment', color: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-500/10' },
}

const priorityConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  critical: { color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-500/10', label: 'Critical' },
  high: { color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10', label: 'High' },
  normal: { color: 'text-slate-500 dark:text-slate-400', bgColor: 'bg-slate-500/10', label: 'Normal' },
}

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

/** Derive knowledge prerequisites from locked nodes' unlock requirements */
function derivePrereqs(paths: LearningPathData[]): KnowledgePrereq[] {
  const allNodes = paths.flatMap(p => p.nodes)
  const completedSet = new Set(allNodes.filter(n => n.status === 'completed').map(n => n.title))
  const prereqs: KnowledgePrereq[] = []

  for (const node of allNodes) {
    if (node.unlockRequirement && (node.status === 'locked' || node.status === 'available')) {
      const reqNames = node.unlockRequirement.split('+').map(s => s.replace(/^Complete\s*/i, '').trim())
      prereqs.push({
        topic: node.title,
        requires: reqNames.map(name => ({ name, met: completedSet.has(name) })),
      })
    }
  }
  return prereqs.slice(0, 8)
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENT: AI Insight Banner
   ═══════════════════════════════════════════════════════ */

function AIInsightBanner({ insight, onAsk }: { insight: string; onAsk: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/8 via-teal-500/8 to-cyan-500/8 p-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shrink-0">
          <Brain className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-foreground">AI Learning Intelligence</h3>
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] px-1.5 py-0 border-0">✦ AI</Badge>
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">&ldquo;{insight}&rdquo;</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-7 text-[11px] gap-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-500/10 px-2"
            onClick={onAsk}
          >
            <Sparkles className="size-3" />
            Ask <ShijlAIText /> about my learning path
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENT: Stats Row
   ═══════════════════════════════════════════════════════ */

function StatsRow({ stats }: { stats: LearningPathResponse['stats'] }) {
  const items = [
    { label: 'Total Steps', value: stats.totalNodes, icon: Route, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'In Progress', value: stats.inProgress + stats.available, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Locked', value: stats.locked, icon: Lock, color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-500/10' },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item, i) => (
        <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="rounded-xl border border-border/40 bg-card p-3.5">
          <div className="flex items-center gap-2 mb-1.5">
            <div className={cn('flex size-7 items-center justify-center rounded-lg', item.bg, item.color)}>
              <item.icon className="size-3.5" />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{item.label}</span>
          </div>
          <p className="text-xl font-bold text-foreground">{item.value}</p>
        </motion.div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENT: Path Timeline Node
   ═══════════════════════════════════════════════════════ */

function PathNodeCard({ node, isLast, onStart }: { node: PathNode; isLast: boolean; onStart: (node: PathNode) => void }) {
  const sc = nodeStatusConfig[node.status] || nodeStatusConfig.locked
  const tc = nodeTypeConfig[node.type] || nodeTypeConfig.lesson
  const pc = priorityConfig[node.priority] || priorityConfig.normal
  const isActionable = node.status === 'available' || node.status === 'in_progress' || node.status === 'recommended'
  const isSkipped = node.status === 'skipped'

  return (
    <div className="relative flex gap-4">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full border-2',
            node.status === 'completed' && 'border-emerald-500 bg-emerald-500',
            node.status === 'in_progress' && 'border-amber-500 bg-amber-500/10',
            node.status === 'available' && 'border-teal-500 bg-teal-500/10',
            node.status === 'recommended' && 'border-cyan-500 bg-cyan-500/10',
            node.status === 'locked' && 'border-slate-400/50 bg-slate-500/5',
            node.status === 'skipped' && 'border-gray-400/50 bg-gray-500/5',
          )}
        >
          {node.status === 'completed' ? (
            <CheckCircle2 className="size-4 text-white" />
          ) : node.status === 'recommended' ? (
            <Star className="size-4 text-cyan-500" />
          ) : node.status === 'locked' ? (
            <Lock className="size-3.5 text-slate-400" />
          ) : (
            <Play className={cn('size-3.5', sc.iconColor)} />
          )}
        </motion.div>
        {!isLast && (
          <div className={cn('w-0.5 flex-1 my-1 min-h-[16px]', node.status === 'completed' ? 'bg-emerald-500/30' : 'bg-border/40')} />
        )}
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: node.sequenceOrder * 0.03 }}
        className={cn(
          'flex-1 rounded-xl border p-4 mb-2 transition-all',
          sc.border, sc.bg,
          isActionable && 'cursor-pointer hover:shadow-md',
          isSkipped && 'opacity-50',
        )}
        onClick={() => isActionable && onStart(node)}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={cn('text-[13px] font-semibold', isSkipped ? 'line-through text-muted-foreground' : 'text-foreground')}>
                {node.title}
              </h4>
              <Badge className={cn('text-[8px] px-1.5 py-0 border-0 font-bold tracking-wider', tc.bgColor, tc.color)}>{tc.label}</Badge>
              {node.priority !== 'normal' && (
                <Badge className={cn('text-[8px] px-1.5 py-0 border-0 font-bold tracking-wider', pc.bgColor, pc.color)}>{pc.label}</Badge>
              )}
              {node.status === 'recommended' && (
                <Badge className="text-[8px] px-1.5 py-0 border-0 font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">⭐ AI Pick</Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{node.description}</p>
          </div>
        </div>

        {/* Mastery progress */}
        <div className="flex items-center gap-2 mb-2">
          <Progress value={node.masteryScore} className={cn('h-1.5 flex-1', sc.barColor)} />
          <span className={cn('text-[10px] font-bold shrink-0', sc.text)}>
            {Math.round(node.masteryScore)}% / {node.masteryRequired}%
          </span>
        </div>

        {/* Footer badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 gap-1 border-amber-500/20 text-amber-600 dark:text-amber-400">
            <Zap className="size-2.5" /> {node.xpReward} XP
          </Badge>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 gap-1 border-border/30 text-muted-foreground">
            <Clock className="size-2.5" /> {formatDuration(node.durationMinutes)}
          </Badge>
          {node.unlockRequirement && node.status === 'locked' && (
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <Lock className="size-2.5" /> Requires: {node.unlockRequirement}
            </span>
          )}
          {isActionable && (
            <Button
              variant="ghost" size="sm"
              className="ml-auto h-6 text-[10px] gap-1 px-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
              onClick={(e) => { e.stopPropagation(); onStart(node) }}
            >
              <Play className="size-2.5" /> {node.status === 'in_progress' ? 'Continue' : 'Start'}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENT: Path Group (collapsible per learning path)
   ═══════════════════════════════════════════════════════ */

function PathGroup({ path, onStart, defaultExpanded }: { path: LearningPathData; onStart: (n: PathNode) => void; defaultExpanded: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const completedCount = path.nodes.filter(n => n.status === 'completed').length

  return (
    <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/20 transition-colors text-left"
      >
        <div className={cn(
          'flex size-9 items-center justify-center rounded-xl shrink-0',
          path.careerPathId ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        )}>
          {path.careerPathId ? <Target className="size-4" /> : <BookOpen className="size-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-foreground truncate">{path.title}</span>
            <Badge className={cn(
              'text-[8px] px-1.5 py-0 border-0 font-bold',
              path.status === 'active' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-slate-500/15 text-slate-500'
            )}>
              {path.status.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={path.progress} className="h-1.5 flex-1 [&>div]:bg-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">{path.progress}%</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {completedCount}/{path.nodes.length} steps completed
          </p>
        </div>
        <div className="shrink-0">
          {expanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded timeline */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-border/15">
              {path.nodes.length === 0 ? (
                <p className="text-[11px] text-muted-foreground py-3 text-center">No steps in this path yet</p>
              ) : (
                <div className="space-y-0 mt-2">
                  {path.nodes.map((node, i) => (
                    <PathNodeCard key={node.id} node={node} isLast={i === path.nodes.length - 1} onStart={onStart} />
                  ))}
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
   SUB-COMPONENT: Career Path Card
   ═══════════════════════════════════════════════════════ */

function CareerPathCard({ career, onStart }: { career: CareerRoadmap; onStart: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/40 bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 text-lg shrink-0">
            {career.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[13px] font-bold text-foreground">{career.title}</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{career.description}</p>
          </div>
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] px-1.5 py-0.5 border-0 shrink-0 font-bold">
            {career.matchPercentage}% Match
          </Badge>
        </div>
      </div>

      {/* Skill Roadmap */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {career.skillRoadmap.map((step, i) => (
            <div key={step.skill} className="flex items-center gap-1.5 shrink-0">
              <span className={cn(
                'text-[10px] font-medium px-2 py-0.5 rounded-full border',
                i < Math.ceil(career.progress / (100 / career.skillRoadmap.length))
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-muted/30 text-muted-foreground border-border/30'
              )}>
                {step.skill}
              </span>
              {i < career.skillRoadmap.length - 1 && (
                <ChevronRight className="size-3 text-muted-foreground/40 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Progress + Actions */}
      <div className="px-4 pb-4 border-t border-border/15 pt-3">
        <div className="flex items-center gap-3 mb-2.5">
          <Progress value={career.progress} className="h-2 flex-1 [&>div]:bg-emerald-500" />
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">{career.progress}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">{career.completedSteps}/{career.totalSteps} steps completed</span>
          <Button size="sm" className="h-7 text-[10px] gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onStart(career.id)}>
            <Target className="size-3" /> Start Path
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENT: Knowledge Graph Section
   ═══════════════════════════════════════════════════════ */

function KnowledgeGraphSection({ prereqs }: { prereqs: KnowledgePrereq[] }) {
  if (prereqs.length === 0) return null
  return (
    <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/15">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-teal-500" />
          <h3 className="text-[13px] font-bold text-foreground">Knowledge Prerequisites</h3>
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">What you need before unlocking each topic</p>
      </div>
      <div className="divide-y divide-border/10">
        {prereqs.map(prereq => (
          <div key={prereq.topic} className="px-4 py-2.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold text-foreground">{prereq.topic}</span>
              <span className="text-[9px] text-muted-foreground">requires:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 ml-1">
              {prereq.requires.map(req => (
                <span key={req.name} className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full border font-medium',
                  req.met ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                )}>
                  {req.met ? '✓' : '✗'} {req.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   LOADING SKELETON
   ═══════════════════════════════════════════════════════ */

function LearningPathSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/20 p-5">
        <div className="flex items-start gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-3/4" /></div>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/20 p-4 space-y-3">
          <div className="flex items-center gap-3"><Skeleton className="size-9 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-2 w-full rounded-full" /></div></div>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT: LearningPathTab
   ═══════════════════════════════════════════════════════ */

export function LearningPathTab({ userId, onAskShijlAI }: LearningPathTabProps) {
  const [data, setData] = useState<LearningPathResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subTab, setSubTab] = useState<SubTab>('my-path')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/ai/learning-paths?userId=${userId}`)
      if (!res.ok) throw new Error(`Failed to fetch learning paths: ${res.status}`)
      const json: LearningPathResponse = await res.json()
      setData(json)
    } catch (err) {
      console.error('[LearningPathTab] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load learning path')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchData() }, [fetchData])

  const handleStartNode = (node: PathNode) => {
    const context = `I want to start "${node.title}" (${node.type}). My mastery is ${node.masteryScore}%/${node.masteryRequired}%. ${node.unlockRequirement ? `Unlock requirement: ${node.unlockRequirement}` : ''}`
    onAskShijlAI(context)
  }

  const handleStartCareer = (careerId: string) => {
    const career = data?.careerPaths.find(c => c.id === careerId)
    if (career) {
      onAskShijlAI(`I'm interested in the ${career.title} career path. Current match: ${career.matchPercentage}%, progress: ${career.progress}%. Help me plan my next steps.`)
    }
  }

  // Derive knowledge prerequisites from path data
  const knowledgePrereqs = data ? derivePrereqs(data.paths) : []

  // Overall progress across all paths
  const overallProgress = data
    ? data.stats.totalNodes > 0
      ? Math.round((data.stats.completed / data.stats.totalNodes) * 100)
      : 0
    : 0

  /* ─── RENDER ─── */

  if (loading) return <LearningPathSkeleton />

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-border/40">
        <Route className="size-10 text-muted-foreground/30 mb-3" />
        <h3 className="text-sm font-semibold text-foreground mb-1">Failed to load learning path</h3>
        <p className="text-xs text-muted-foreground mb-3">{error}</p>
        <Button variant="outline" size="sm" className="h-8 text-[11px] gap-1.5" onClick={fetchData}>
          <RefreshCw className="size-3" /> Retry
        </Button>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-4">
      {/* ─── AI Insight Banner ─── */}
      <AIInsightBanner insight={data.aiInsight} onAsk={() => onAskShijlAI(data.skillContextForAI)} />

      {/* ─── Stats Row ─── */}
      <StatsRow stats={data.stats} />

      {/* ─── Overall Progress ─── */}
      <div className="rounded-xl border border-border/40 bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-emerald-500" />
            <span className="text-[12px] font-semibold text-foreground">Overall Path Progress</span>
          </div>
          <span className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-2.5 [&>div]:bg-emerald-500" />
        <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Flame className="size-3 text-orange-500" /> Keep going!</span>
          <span>{data.stats.completed} of {data.stats.totalNodes} steps done</span>
          {data.stats.recommended > 0 && (
            <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
              <Star className="size-3" /> {data.stats.recommended} AI recommended
            </span>
          )}
        </div>
      </div>

      {/* ─── Sub-Tab Bar ─── */}
      <div className="border-b border-border/40">
        <div className="flex items-center gap-1">
          {([
            { id: 'my-path' as SubTab, label: 'My Path', icon: Route },
            { id: 'career-paths' as SubTab, label: 'Career Paths', icon: Target },
          ]).map(tab => {
            const isActive = subTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-[12px] font-medium border-b-2 transition-all whitespace-nowrap',
                  isActive ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border/40'
                )}
              >
                <tab.icon className="size-3.5" />{tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ─── Sub-Tab Content ─── */}
      <AnimatePresence mode="wait">
        {subTab === 'my-path' && (
          <motion.div key="my-path" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-3">
            {data.paths.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-border/40">
                <Route className="size-10 text-muted-foreground/30 mb-3" />
                <h3 className="text-sm font-semibold text-foreground mb-1">No learning paths yet</h3>
                <p className="text-xs text-muted-foreground mb-3">Start learning and your path will be generated</p>
              </div>
            ) : (
              data.paths.map((path, i) => (
                <PathGroup key={path.id} path={path} onStart={handleStartNode} defaultExpanded={i === 0} />
              ))
            )}
          </motion.div>
        )}

        {subTab === 'career-paths' && (
          <motion.div key="career-paths" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.careerPaths.map(career => (
                <CareerPathCard key={career.id} career={career} onStart={handleStartCareer} />
              ))}
            </div>
            <KnowledgeGraphSection prereqs={knowledgePrereqs} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
