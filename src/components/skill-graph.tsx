'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Network,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  BookOpen,
  Brain,
  ArrowRight,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react'
import { ShijlAIText } from '@/components/ui/brand-text'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface SkillTreeNode {
  id: string
  name: string
  slug: string
  category: string
  icon: string | null
  description: string | null
  masteryScore: number
  status: string
  trend: string
  quizScore: number
  assignmentScore: number
  practiceScore: number
  completionScore: number
  tutorSignal: number
  parentId: string | null
  children: SkillTreeNode[]
  topics: { id: string; name: string; masteryScore: number; status: string; trend: string; source: string }[]
  aiInsight: string | null
  sourceCourses: { id: string; title: string; thumbnail: string | null }[]
  prerequisites: { id: string; name: string; status: string }[]
  nextStudyRecommendation: string | null
}

interface SkillGraphResponse {
  tree: SkillTreeNode[]
  totalSkills: number
  masteredCount: number
  strongCount: number
  learningCount: number
  weakCount: number
  notStartedCount: number
  averageMastery: number
  overallInsight: string
  skillContextForAI: string
}

interface SkillGraphTabProps {
  userId: string
  onAskShijlAI?: (context: string) => void
}

/* ═══════════════════════════════════════════════════════
   STATUS CONFIG — CRITICAL COLOR CODING
   ═══════════════════════════════════════════════════════ */

const statusConfig: Record<string, {
  dot: string
  bar: string
  text: string
  badgeBg: string
  badgeText: string
  label: string
  emoji: string
}> = {
  mastered: {
    dot: 'bg-emerald-500',
    bar: '[&>div]:bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    label: 'MASTERED',
    emoji: '🟢',
  },
  strong: {
    dot: 'bg-teal-500',
    bar: '[&>div]:bg-teal-500',
    text: 'text-teal-600 dark:text-teal-400',
    badgeBg: 'bg-teal-500/15',
    badgeText: 'text-teal-600 dark:text-teal-400',
    label: 'STRONG',
    emoji: '🟢',
  },
  learning: {
    dot: 'bg-amber-500',
    bar: '[&>div]:bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-600 dark:text-amber-400',
    label: 'LEARNING',
    emoji: '🟡',
  },
  weak: {
    dot: 'bg-orange-500',
    bar: '[&>div]:bg-orange-500',
    text: 'text-orange-600 dark:text-orange-400',
    badgeBg: 'bg-orange-500/15',
    badgeText: 'text-orange-600 dark:text-orange-400',
    label: 'WEAK',
    emoji: '🔴',
  },
  not_started: {
    dot: 'bg-red-500',
    bar: '[&>div]:bg-red-500',
    text: 'text-red-600 dark:text-red-400',
    badgeBg: 'bg-red-500/15',
    badgeText: 'text-red-600 dark:text-red-400',
    label: 'NOT STARTED',
    emoji: '⚪',
  },
}

const categoryConfig: Record<string, { label: string; emoji: string; color: string }> = {
  programming: { label: 'Programming', emoji: '💻', color: 'text-violet-600 dark:text-violet-400' },
  data: { label: 'Data', emoji: '📊', color: 'text-cyan-600 dark:text-cyan-400' },
  web: { label: 'Web', emoji: '🌐', color: 'text-teal-600 dark:text-teal-400' },
  'soft-skills': { label: 'Problem Solving', emoji: '🧩', color: 'text-amber-600 dark:text-amber-400' },
  math: { label: 'Math', emoji: '📐', color: 'text-pink-600 dark:text-pink-400' },
  devops: { label: 'DevOps', emoji: '⚙️', color: 'text-slate-600 dark:text-slate-400' },
  science: { label: 'Science', emoji: '🔬', color: 'text-emerald-600 dark:text-emerald-400' },
  design: { label: 'Design', emoji: '🎨', color: 'text-rose-600 dark:text-rose-400' },
}

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */

function getStatusConfig(status: string) {
  return statusConfig[status] || statusConfig.not_started
}

function getTrendIcon(trend: string) {
  if (trend === 'improving') return <TrendingUp className="size-3 text-emerald-500" />
  if (trend === 'declining') return <TrendingDown className="size-3 text-red-500" />
  return <Minus className="size-3 text-muted-foreground" />
}

function flattenTree(nodes: SkillTreeNode[]): SkillTreeNode[] {
  const result: SkillTreeNode[] = []
  for (const node of nodes) {
    result.push(node)
    if (node.children.length > 0) {
      result.push(...flattenTree(node.children))
    }
  }
  return result
}

function findNodeById(tree: SkillTreeNode[], id: string): SkillTreeNode | null {
  for (const node of tree) {
    if (node.id === id) return node
    if (node.children.length > 0) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return null
}

function findParentOfNode(tree: SkillTreeNode[], childId: string): SkillTreeNode | null {
  for (const parent of tree) {
    if (parent.children.some(c => c.id === childId)) return parent
  }
  return null
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENT: SkillAIBanner
   ═══════════════════════════════════════════════════════ */

function SkillAIBanner({
  insight,
  onAskShijlAI,
}: {
  insight: string
  onAskShijlAI?: (context: string) => void
}) {
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
            <h3 className="text-sm font-bold text-foreground">AI Skill Intelligence</h3>
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] px-1.5 py-0 border-0">
              ✦ AI
            </Badge>
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">&ldquo;{insight}&rdquo;</p>
          {onAskShijlAI && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-7 text-[11px] gap-1.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-500/10 px-2"
              onClick={() => onAskShijlAI('What should I study next based on my skill graph?')}
            >
              <Sparkles className="size-3" />
              Ask <ShijlAIText />: What should I study next?
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENT: SkillGraphStats
   ═══════════════════════════════════════════════════════ */

function SkillGraphStats({
  data,
}: {
  data: SkillGraphResponse
}) {
  const stats = [
    { label: 'Mastered', count: data.masteredCount, emoji: '🟢', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Strong', count: data.strongCount, emoji: '🟢', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10' },
    { label: 'Learning', count: data.learningCount, emoji: '🟡', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Weak', count: data.weakCount, emoji: '🔴', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Not Started', count: data.notStartedCount, emoji: '⚪', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-2">
      {stats.map(stat => (
        <div
          key={stat.label}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border border-border/30',
            stat.bg
          )}
        >
          <span className="text-[11px]">{stat.emoji}</span>
          <span className={cn('text-[11px] font-semibold', stat.color)}>{stat.count}</span>
          <span className="text-[10px] text-muted-foreground">{stat.label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 bg-primary/5 border border-border/30 ml-auto">
        <span className="text-[11px]">📈</span>
        <span className="text-[11px] text-muted-foreground">Avg</span>
        <span className="text-[11px] font-bold text-foreground">{data.averageMastery}%</span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENT: SkillFilterBar
   ═══════════════════════════════════════════════════════ */

type CategoryFilter = 'all' | string
type StatusFilter = 'all' | 'mastered' | 'strong' | 'learning' | 'weak' | 'not_started'
type SortMode = 'weakest' | 'strongest' | 'name'

function SkillFilterBar({
  categories,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  sortMode,
  setSortMode,
  searchQuery,
  setSearchQuery,
}: {
  categories: string[]
  categoryFilter: CategoryFilter
  setCategoryFilter: (f: CategoryFilter) => void
  statusFilter: StatusFilter
  setStatusFilter: (f: StatusFilter) => void
  sortMode: SortMode
  setSortMode: (s: SortMode) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
}) {
  return (
    <div className="space-y-2.5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search skills..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full h-8 pl-9 pr-3 rounded-lg border border-border/40 bg-card text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
        />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setCategoryFilter('all')}
          className={cn(
            'text-[10px] px-2.5 py-1 rounded-full font-medium transition-all border',
            categoryFilter === 'all'
              ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
              : 'bg-card text-muted-foreground border-border/40 hover:border-emerald-500/30 hover:text-foreground'
          )}
        >
          All
        </button>
        {categories.map(cat => {
          const conf = categoryConfig[cat]
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                'text-[10px] px-2.5 py-1 rounded-full font-medium transition-all border',
                categoryFilter === cat
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                  : 'bg-card text-muted-foreground border-border/40 hover:border-emerald-500/30 hover:text-foreground'
              )}
            >
              {conf?.emoji} {conf?.label || cat}
            </button>
          )
        })}
      </div>

      {/* Status + Sort row */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {(['all', 'mastered', 'strong', 'learning', 'weak', 'not_started'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'text-[9px] px-2 py-0.5 rounded-full font-medium transition-all border',
                statusFilter === s
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-card text-muted-foreground border-border/30 hover:text-foreground'
              )}
            >
              {s === 'all' ? 'All' : s === 'not_started' ? 'Not Started' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <span className="text-[9px] text-muted-foreground">Sort:</span>
          {([
            { key: 'weakest' as SortMode, label: 'Weakest' },
            { key: 'strongest' as SortMode, label: 'Strongest' },
            { key: 'name' as SortMode, label: 'Name' },
          ]).map(opt => (
            <button
              key={opt.key}
              onClick={() => setSortMode(opt.key)}
              className={cn(
                'text-[9px] px-2 py-0.5 rounded-full font-medium transition-all',
                sortMode === opt.key
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENT: SkillChildNode
   ═══════════════════════════════════════════════════════ */

function SkillChildNode({
  node,
  onClick,
}: {
  node: SkillTreeNode
  onClick: () => void
}) {
  const sc = getStatusConfig(node.status)
  const isWeak = node.status === 'weak' || node.status === 'not_started'

  return (
    <motion.button
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-muted/40 transition-colors text-left group"
      onClick={onClick}
    >
      {/* Status dot */}
      <div className={cn('size-2 rounded-full shrink-0', sc.dot)} />

      {/* Name + progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-medium text-foreground truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {node.icon && <span className="mr-0.5">{node.icon}</span>}
            {node.name}
          </span>
          {isWeak && (
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertTriangle className="size-3 text-orange-500 shrink-0" />
              </TooltipTrigger>
              <TooltipContent className="text-[11px]">
                This skill needs attention — it may be holding back your progress
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Progress value={node.masteryScore} className={cn('h-1 flex-1', sc.bar)} />
          <span className={cn('text-[10px] font-bold shrink-0', sc.text)}>{node.masteryScore}%</span>
        </div>
      </div>

      {/* Badge */}
      <Badge
        className={cn(
          'text-[8px] px-1.5 py-0 border-0 shrink-0 font-bold tracking-wider',
          sc.badgeBg,
          sc.badgeText
        )}
      >
        {sc.label}
      </Badge>

      {/* Chevron */}
      <ChevronRight className="size-3 text-muted-foreground/50 shrink-0 group-hover:text-emerald-500 transition-colors" />
    </motion.button>
  )
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENT: SkillParentNode
   ═══════════════════════════════════════════════════════ */

function SkillParentNode({
  node,
  expanded,
  onToggle,
  onChildClick,
  onAskShijlAI,
}: {
  node: SkillTreeNode
  expanded: boolean
  onToggle: () => void
  onChildClick: (child: SkillTreeNode) => void
  onAskShijlAI?: (context: string) => void
}) {
  const sc = getStatusConfig(node.status)
  const catConf = categoryConfig[node.category]
  const weakChildren = node.children.filter(c => c.status === 'weak' || c.status === 'not_started')

  // Find the weakest child for the study recommendation
  const weakestChild = node.children.length > 0
    ? node.children.reduce((a, b) => a.masteryScore < b.masteryScore ? a : b)
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/40 bg-card overflow-hidden"
    >
      {/* Parent Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/20 transition-colors text-left"
      >
        {/* Icon */}
        <div className={cn(
          'flex size-10 items-center justify-center rounded-xl text-lg shrink-0',
          sc.badgeBg
        )}>
          {node.icon || catConf?.emoji || '📚'}
        </div>

        {/* Name + Progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold text-foreground truncate">{node.name}</span>
            <Badge
              className={cn(
                'text-[8px] px-1.5 py-0 border-0 font-bold tracking-wider',
                sc.badgeBg,
                sc.badgeText
              )}
            >
              {sc.label}
            </Badge>
            {node.trend === 'improving' && <TrendingUp className="size-3 text-emerald-500" />}
            {node.trend === 'declining' && <TrendingDown className="size-3 text-red-500" />}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <Progress value={node.masteryScore} className={cn('h-2 flex-1', sc.bar)} />
            <span className={cn('text-[13px] font-bold shrink-0', sc.text)}>{node.masteryScore}%</span>
          </div>
        </div>

        {/* Expand toggle */}
        <div className="shrink-0">
          {expanded ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Children */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-border/20">
              {/* Children list */}
              <div className="space-y-0.5 mt-1">
                {node.children.length > 0 ? (
                  node.children.map(child => (
                    <SkillChildNode
                      key={child.id}
                      node={child}
                      onClick={() => onChildClick(child)}
                    />
                  ))
                ) : (
                  <p className="text-[11px] text-muted-foreground py-3 text-center">
                    No sub-skills tracked yet
                  </p>
                )}
              </div>

              {/* AI Insight */}
              {node.aiInsight && (
                <div className="mt-3 rounded-xl bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 border border-emerald-500/10 p-3">
                  <div className="flex items-start gap-2">
                    <Sparkles className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">AI Insight</span>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                        &ldquo;{node.aiInsight}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mt-3">
                {weakestChild && weakestChild.masteryScore < 75 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                    onClick={() => onChildClick(weakestChild)}
                  >
                    <BookOpen className="size-3" />
                    Study {weakestChild.name}
                  </Button>
                )}
                {onAskShijlAI && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] gap-1 border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10"
                    onClick={() => onAskShijlAI(`Help me with ${node.name}. My current mastery is ${node.masteryScore}%. ${weakChildren.length > 0 ? `I struggle most with ${weakChildren.map(c => c.name).join(', ')}.` : ''}`)}
                  >
                    <Brain className="size-3" />
                    Ask <ShijlAIText />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENT: SkillDetailPanel
   ═══════════════════════════════════════════════════════ */

function SkillDetailPanel({
  node,
  parentName,
  onBack,
  onAskShijlAI,
}: {
  node: SkillTreeNode
  parentName: string
  onBack: () => void
  onAskShijlAI?: (context: string) => void
}) {
  const sc = getStatusConfig(node.status)
  const catConf = categoryConfig[node.category]

  // Score breakdown items with weights
  const scoreBreakdown = [
    { label: 'Quiz Performance', score: node.quizScore, weight: '50%', barColor: 'bg-emerald-500' },
    { label: 'Assignments', score: node.assignmentScore, weight: '25%', barColor: 'bg-teal-500' },
    { label: 'Practice Tests', score: node.practiceScore, weight: '15%', barColor: 'bg-cyan-500' },
    { label: 'Lesson Completion', score: node.completionScore, weight: '10%', barColor: 'bg-amber-500' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-border/40 bg-card overflow-hidden"
    >
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 px-4 py-2.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-full text-left hover:bg-muted/20 border-b border-border/20"
      >
        <ChevronRight className="size-3 rotate-180" />
        Back to {parentName}
      </button>

      {/* Header */}
      <div className="px-5 pt-4 pb-4">
        <div className="flex items-start gap-3">
          <div className={cn('flex size-11 items-center justify-center rounded-xl text-lg shrink-0', sc.badgeBg)}>
            {node.icon || catConf?.emoji || '📚'}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-bold text-foreground">{node.name}</h3>
            {node.description && (
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{node.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Progress value={node.masteryScore} className={cn('h-2.5 flex-1', sc.bar)} />
              <span className={cn('text-[14px] font-bold shrink-0', sc.text)}>{node.masteryScore}%</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge className={cn('text-[8px] px-1.5 py-0 border-0 font-bold tracking-wider', sc.badgeBg, sc.badgeText)}>
                {sc.label}
              </Badge>
              <div className="flex items-center gap-1">
                {getTrendIcon(node.trend)}
                <span className="text-[10px] text-muted-foreground capitalize">{node.trend}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="px-5 pb-4 border-t border-border/15 pt-3">
        <h4 className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2.5">Score Breakdown</h4>
        <div className="space-y-2.5">
          {scoreBreakdown.map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground w-32 shrink-0">{item.label}</span>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', item.barColor)}
                    style={{ width: `${Math.min(100, Math.max(0, item.score))}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-foreground w-8 text-right">{Math.round(item.score)}%</span>
              </div>
              <span className="text-[9px] text-muted-foreground/60 w-8 text-right">({item.weight})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Topic Sources */}
      {node.topics.length > 0 && (
        <div className="px-5 pb-4 border-t border-border/15 pt-3">
          <h4 className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2.5">Topic Sources</h4>
          <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
            {node.topics.map(topic => {
              const tc = getStatusConfig(topic.status)
              return (
                <div
                  key={topic.id}
                  className="flex items-center gap-2 rounded-lg bg-muted/20 px-2.5 py-1.5"
                >
                  <div className={cn('size-1.5 rounded-full shrink-0', tc.dot)} />
                  <span className="text-[10px] text-foreground truncate flex-1">{topic.name}</span>
                  <span className={cn('text-[10px] font-bold shrink-0', tc.text)}>{topic.masteryScore}%</span>
                  {getTrendIcon(topic.trend)}
                  <Badge
                    variant="outline"
                    className="text-[7px] px-1 py-0 border-border/30 capitalize"
                  >
                    {topic.source}
                  </Badge>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Prerequisites */}
      {node.prerequisites.length > 0 && (
        <div className="px-5 pb-4 border-t border-border/15 pt-3">
          <h4 className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2.5">Prerequisites</h4>
          <div className="flex flex-wrap gap-1.5">
            {node.prerequisites.map(prereq => {
              const pc = getStatusConfig(prereq.status)
              return (
                <Badge
                  key={prereq.id}
                  variant="outline"
                  className={cn('text-[9px] px-2 py-0.5 gap-1', pc.badgeBg, pc.badgeText, 'border-0')}
                >
                  <div className={cn('size-1.5 rounded-full', pc.dot)} />
                  {prereq.name}
                </Badge>
              )
            })}
          </div>
        </div>
      )}

      {/* Source Courses */}
      {node.sourceCourses.length > 0 && (
        <div className="px-5 pb-4 border-t border-border/15 pt-3">
          <h4 className="text-[11px] font-semibold text-foreground uppercase tracking-wider mb-2.5">Related Courses</h4>
          <div className="space-y-1.5">
            {node.sourceCourses.map(course => (
              <div
                key={course.id}
                className="flex items-center gap-2 rounded-lg bg-muted/20 px-2.5 py-1.5"
              >
                <BookOpen className="size-3 text-muted-foreground shrink-0" />
                <span className="text-[10px] text-foreground truncate">{course.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insight */}
      {node.aiInsight && (
        <div className="px-5 pb-4 border-t border-border/15 pt-3">
          <div className="rounded-xl bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 border border-emerald-500/10 p-3">
            <div className="flex items-start gap-2">
              <Sparkles className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">AI Insight</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                  &ldquo;{node.aiInsight}&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next Study Recommendation */}
      {node.nextStudyRecommendation && (
        <div className="px-5 pb-4 border-t border-border/15 pt-3">
          <div className="flex items-start gap-2">
            <ArrowRight className="size-3.5 text-teal-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400">Next Step</span>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                {node.nextStudyRecommendation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="px-5 pb-4 pt-1 flex flex-wrap gap-2">
        {node.sourceCourses.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] gap-1 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
          >
            <BookOpen className="size-3" />
            Study {node.sourceCourses[0].title}
          </Button>
        )}
        {node.quizScore > 0 && node.quizScore < 80 && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
          >
            ❓ Retake Quiz
          </Button>
        )}
        {onAskShijlAI && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] gap-1 border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10"
            onClick={() => onAskShijlAI(`Help me with ${node.name}. My current mastery is ${node.masteryScore}%. Quiz: ${Math.round(node.quizScore)}%, Assignments: ${Math.round(node.assignmentScore)}%, Practice: ${Math.round(node.practiceScore)}%, Completion: ${Math.round(node.completionScore)}%.${node.aiInsight ? ` AI says: ${node.aiInsight}` : ''}`)}
          >
            <Brain className="size-3" />
            Ask <ShijlAIText /> about {node.name}
          </Button>
        )}
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   LOADING SKELETON
   ═══════════════════════════════════════════════════════ */

function SkillGraphSkeleton() {
  return (
    <div className="space-y-4">
      {/* Banner skeleton */}
      <div className="rounded-2xl border border-border/20 p-5">
        <div className="flex items-start gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-lg" />
        ))}
      </div>

      {/* Filter skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-full rounded-lg" />
        <div className="flex gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-20 rounded-full" />
          ))}
        </div>
      </div>

      {/* Card skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/20 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT: SkillGraphTab
   ═══════════════════════════════════════════════════════ */

export function SkillGraphTab({ userId, onAskShijlAI }: SkillGraphTabProps) {
  // Data state
  const [data, setData] = useState<SkillGraphResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // UI state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [selectedChild, setSelectedChild] = useState<SkillTreeNode | null>(null)
  const [selectedParentName, setSelectedParentName] = useState<string>('')

  // Filter state
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortMode, setSortMode] = useState<SortMode>('weakest')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/skill-graph?userId=${userId}`)
      if (!res.ok) throw new Error(`Failed to fetch skill graph: ${res.status}`)
      const json: SkillGraphResponse = await res.json()
      setData(json)
    } catch (err) {
      console.error('[SkillGraphTab] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load skill graph')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Toggle expand/collapse
  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Handle child click — show detail panel
  const handleChildClick = (child: SkillTreeNode, parentName: string) => {
    setSelectedChild(child)
    setSelectedParentName(parentName)
  }

  // Handle back from detail panel
  const handleBack = () => {
    setSelectedChild(null)
    setSelectedParentName('')
  }

  // Auto-expand weak parent nodes on first load
  const hasAutoExpanded = useRef(false)
  useEffect(() => {
    if (data && !hasAutoExpanded.current) {
      hasAutoExpanded.current = true
      const weakParentIds = data.tree
        .filter(n => n.masteryScore < 75)
        .map(n => n.id)
      if (weakParentIds.length > 0) {
        setExpandedIds(new Set(weakParentIds.slice(0, 3)))
      } else if (data.tree.length > 0) {
        setExpandedIds(new Set([data.tree[0].id]))
      }
    }
  }, [data])

  // Extract unique categories
  const categories = data
    ? [...new Set(data.tree.map(n => n.category))].filter(Boolean)
    : []

  // Filter & sort the tree
  const filteredTree = data ? data.tree
    .filter(node => {
      if (categoryFilter !== 'all' && node.category !== categoryFilter) return false
      if (statusFilter !== 'all' && node.status !== statusFilter) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchesParent = node.name.toLowerCase().includes(q)
        const matchesChild = node.children.some(c => c.name.toLowerCase().includes(q))
        if (!matchesParent && !matchesChild) return false
      }
      return true
    })
    .sort((a, b) => {
      if (sortMode === 'weakest') return a.masteryScore - b.masteryScore
      if (sortMode === 'strongest') return b.masteryScore - a.masteryScore
      return a.name.localeCompare(b.name)
    })
    : []

  /* ─── RENDER ─── */

  // Loading state
  if (loading) {
    return <SkillGraphSkeleton />
  }

  // Error state
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-border/40">
        <Network className="size-10 text-muted-foreground/30 mb-3" />
        <h3 className="text-sm font-semibold text-foreground mb-1">Failed to load skill graph</h3>
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
    <div className="space-y-4">
      {/* ─── AI Banner ─── */}
      <SkillAIBanner
        insight={data.overallInsight}
        onAskShijlAI={onAskShijlAI ? () => onAskShijlAI(data.skillContextForAI) : undefined}
      />

      {/* ─── Stats Bar ─── */}
      <SkillGraphStats data={data} />

      {/* ─── Filter Bar ─── */}
      <SkillFilterBar
        categories={categories}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortMode={sortMode}
        setSortMode={setSortMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* ─── Detail Panel or Skill Tree ─── */}
      <AnimatePresence mode="wait">
        {selectedChild ? (
          <SkillDetailPanel
            key={`detail-${selectedChild.id}`}
            node={selectedChild}
            parentName={selectedParentName}
            onBack={handleBack}
            onAskShijlAI={onAskShijlAI}
          />
        ) : (
          <motion.div
            key="tree"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {filteredTree.length > 0 ? (
              filteredTree.map(node => (
                <SkillParentNode
                  key={node.id}
                  node={node}
                  expanded={expandedIds.has(node.id)}
                  onToggle={() => toggleExpand(node.id)}
                  onChildClick={(child) => handleChildClick(child, node.name)}
                  onAskShijlAI={onAskShijlAI}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-border/40">
                <Search className="size-8 text-muted-foreground/30 mb-2" />
                <h3 className="text-sm font-semibold text-foreground mb-1">No skills match your filters</h3>
                <p className="text-xs text-muted-foreground">Try adjusting your filters or search query</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Bottom Ask ShijlAI CTA ─── */}
      {onAskShijlAI && !selectedChild && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-[11px] gap-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
            onClick={() => onAskShijlAI(data.skillContextForAI)}
          >
            <Brain className="size-3.5" />
            Ask <ShijlAIText /> about your skill profile
          </Button>
        </div>
      )}
    </div>
  )
}
