'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, Brain, Sparkles, ChevronRight, ChevronDown, ChevronUp,
  Loader2, RefreshCw, Clock, Trophy, Target, Flame, Star,
  CheckCircle2, XCircle, AlertTriangle, BookOpen, ArrowRight,
  BarChart3, MessageSquare, Zap, Play, RotateCcw, Home,
  FileText, Lightbulb, TrendingUp, Eye, EyeOff, Timer,
} from 'lucide-react'
import { ShijlAIText } from '@/components/ui/brand-text'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/* ═══════════════════════════════════════════════════════
   TYPES — matches API response shapes
   ═══════════════════════════════════════════════════════ */

interface DomainInfo {
  id: string
  name: string
  icon: string
  sessions: number
  avgScore: number
  weakAreas: string[]
}

interface RecentSession {
  id: string
  domain: string
  difficulty: string
  type: string
  score: number
  completedAt: string
}

interface DashboardData {
  stats: {
    totalSessions: number
    avgScore: number
    bestScore: number
    domainsPracticed: string[]
  }
  recentSessions: RecentSession[]
  domains: DomainInfo[]
  personalization: {
    focusTopics: string[]
    reason: string
  }
  skillContextForAI: string
}

interface InterviewQuestion {
  id: string
  question: string
  questionType: 'conceptual' | 'practical' | 'scenario' | 'behavioral' | 'definition' | 'comparison'
  topic: string
  difficulty: string
  orderIndex: number
}

interface InterviewSession {
  id: string
  domain: string
  difficulty: string
  type: string
  status: string
  questions: InterviewQuestion[]
}

interface EvaluationResult {
  score: number
  feedback: string
  idealAnswer: string
}

interface InterviewReport {
  overallScore: number
  accuracy: number
  completeness: number
  clarity: number
  confidence: number
  strengths: string[]
  weaknesses: string[]
  feedback: string
  recommendations: {
    type: 'lesson' | 'quiz' | 'practice' | 'revision'
    topic: string
    reason: string
  }[]
  skillUpdates: {
    topic: string
    previousMastery: number
    newMastery: number
    direction: 'improved' | 'needs_revision'
  }[]
}

interface MockInterviewProps {
  userId: string
  onAskShijlAI?: (context: string) => void
}

type ViewState = 'dashboard' | 'setup' | 'interview' | 'report'
type Difficulty = 'beginner' | 'intermediate' | 'advanced'
type InterviewType = 'technical' | 'behavioral' | 'mixed' | 'viva'

/* ═══════════════════════════════════════════════════════
   CONFIG & HELPERS
   ═══════════════════════════════════════════════════════ */

const DOMAIN_CONFIG: Record<string, { name: string; icon: string }> = {
  python: { name: 'Python', icon: '💻' },
  machine_learning: { name: 'Machine Learning', icon: '🧠' },
  web_development: { name: 'Web Development', icon: '🌐' },
  data_science: { name: 'Data Science', icon: '📊' },
}

const questionTypeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  conceptual: { label: 'Conceptual', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10' },
  practical: { label: 'Practical', color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-500/10' },
  scenario: { label: 'Scenario', color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-500/10' },
  behavioral: { label: 'Behavioral', color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-500/10' },
  definition: { label: 'Definition', color: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-500/10' },
  comparison: { label: 'Comparison', color: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-500/10' },
}

const recommendationTypeConfig: Record<string, { label: string; icon: typeof BookOpen; color: string; bgColor: string }> = {
  lesson: { label: 'Lesson', icon: BookOpen, color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-500/10' },
  quiz: { label: 'Quiz', icon: Target, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10' },
  practice: { label: 'Practice', icon: Zap, color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-500/10' },
  revision: { label: 'Revision', icon: RotateCcw, color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-500/10' },
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 60) return 'text-amber-600 dark:text-amber-400'
  if (score >= 40) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return '[&>div]:bg-emerald-500'
  if (score >= 60) return '[&>div]:bg-amber-500'
  if (score >= 40) return '[&>div]:bg-orange-500'
  return '[&>div]:bg-red-500'
}

function getScoreCircleColor(score: number): string {
  if (score >= 80) return 'stroke-emerald-500'
  if (score >= 60) return 'stroke-amber-500'
  if (score >= 40) return 'stroke-orange-500'
  return 'stroke-red-500'
}

/* ═══════════════════════════════════════════════════════
   CIRCULAR SCORE COMPONENT
   ═══════════════════════════════════════════════════════ */

function CircularScore({ score, size = 120, strokeWidth = 8, label }: { score: number; size?: number; strokeWidth?: number; label?: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const center = size / 2

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={getScoreCircleColor(score)}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-2xl font-bold', getScoreColor(score))}>{score}</span>
        {label && <span className="text-[9px] text-muted-foreground font-medium">{label}</span>}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENT: AI Insight Banner (amber/orange accent)
   ═══════════════════════════════════════════════════════ */

function InterviewAIBanner({
  insight,
  focusTopics,
  onAskShijlAI,
}: {
  insight: string
  focusTopics: string[]
  onAskShijlAI?: (context: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/8 via-orange-500/8 to-amber-600/8 p-5"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shrink-0">
          <Mic className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-foreground">AI Interview Intelligence</h3>
            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] px-1.5 py-0 border-0">
              ✦ AI
            </Badge>
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            &ldquo;{insight}&rdquo;
          </p>
          {focusTopics.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {focusTopics.map(topic => (
                <Badge
                  key={topic}
                  className="text-[9px] px-2 py-0.5 border-0 bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium"
                >
                  🎯 {topic}
                </Badge>
              ))}
            </div>
          )}
          {onAskShijlAI && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-7 text-[11px] gap-1.5 text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-500/10 px-2"
              onClick={() => onAskShijlAI(`Help me prepare for my interview. Focus areas: ${focusTopics.join(', ')}`)}
            >
              <Sparkles className="size-3" />
              Ask <ShijlAIText />: Help me prepare
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENT: Dashboard Stats Row
   ═══════════════════════════════════════════════════════ */

function DashboardStats({ stats }: { stats: DashboardData['stats'] }) {
  const items = [
    { label: 'Sessions Done', value: stats.totalSessions, icon: FileText, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Avg Score', value: `${stats.avgScore}%`, icon: BarChart3, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Best Score', value: `${stats.bestScore}%`, icon: Trophy, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Domains', value: stats.domainsPracticed.length, icon: Target, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-xl border border-border/40 bg-card p-3.5"
        >
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
   SUB-COMPONENT: Domain Card
   ═══════════════════════════════════════════════════════ */

function DomainCard({
  domain,
  onClick,
}: {
  domain: DomainInfo
  onClick: () => void
}) {
  const hasActivity = domain.sessions > 0
  const progress = Math.min(100, domain.avgScore)

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full rounded-xl border border-border/40 bg-card p-4 text-left transition-all hover:border-amber-500/30 hover:shadow-md group"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/8 text-xl shrink-0 group-hover:bg-amber-500/15 transition-colors">
          {domain.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-[13px] font-bold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {domain.name}
            </h4>
            <ChevronRight className="size-4 text-muted-foreground/50 group-hover:text-amber-500 transition-colors shrink-0" />
          </div>

          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] text-muted-foreground">
              {domain.sessions} session{domain.sessions !== 1 ? 's' : ''}
            </span>
            {hasActivity && (
              <span className={cn('text-[10px] font-bold', getScoreColor(domain.avgScore))}>
                Avg: {domain.avgScore}%
              </span>
            )}
          </div>

          {hasActivity && (
            <div className="flex items-center gap-2 mt-2">
              <Progress value={progress} className={cn('h-1.5 flex-1', getScoreBarColor(domain.avgScore))} />
              <span className={cn('text-[10px] font-bold shrink-0', getScoreColor(domain.avgScore))}>
                {domain.avgScore}%
              </span>
            </div>
          )}

          {domain.weakAreas.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {domain.weakAreas.map(area => (
                <Badge key={area} className="text-[8px] px-1.5 py-0 border-0 bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium">
                  ⚠ {area}
                </Badge>
              ))}
            </div>
          )}

          {!hasActivity && (
            <p className="text-[10px] text-muted-foreground mt-1.5 italic">Not practiced yet — start now!</p>
          )}
        </div>
      </div>
    </motion.button>
  )
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENT: Recent Sessions List
   ═══════════════════════════════════════════════════════ */

function RecentSessionsList({
  sessions,
  onViewReport,
}: {
  sessions: RecentSession[]
  onViewReport: (session: RecentSession) => void
}) {
  if (sessions.length === 0) return null

  return (
    <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border/15">
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-amber-500" />
          <h3 className="text-[13px] font-bold text-foreground">Recent Sessions</h3>
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto scrollbar-thin divide-y divide-border/10">
        {sessions.map(session => {
          const domainConf = DOMAIN_CONFIG[session.domain]
          return (
            <div key={session.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors">
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/8 text-sm shrink-0">
                {domainConf?.icon || '🎯'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-foreground truncate">
                    {domainConf?.name || session.domain}
                  </span>
                  <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-border/30 capitalize">
                    {session.type}
                  </Badge>
                  <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-border/30 capitalize">
                    {session.difficulty}
                  </Badge>
                </div>
                <span className="text-[10px] text-muted-foreground">{formatTimeAgo(session.completedAt)}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn('text-[12px] font-bold', getScoreColor(session.score))}>
                  {session.score}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[9px] gap-1 px-2 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                  onClick={() => onViewReport(session)}
                >
                  <Eye className="size-2.5" /> View
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENT: Interview Setup Modal
   ═══════════════════════════════════════════════════════ */

function InterviewSetup({
  preselectedDomain,
  focusTopics,
  onStart,
  onBack,
}: {
  preselectedDomain: string | null
  focusTopics: string[]
  onStart: (domain: string, difficulty: Difficulty, interviewType: InterviewType) => void
  onBack: () => void
}) {
  const [domain, setDomain] = useState(preselectedDomain || 'machine_learning')
  const [difficulty, setDifficulty] = useState<Difficulty>('intermediate')
  const [interviewType, setInterviewType] = useState<InterviewType>('technical')

  const domainConf = DOMAIN_CONFIG[domain]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="rounded-2xl border border-amber-500/20 bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/15 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-amber-600/5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shrink-0">
            <Mic className="size-5" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold text-foreground">Interview Setup</h2>
            <p className="text-[11px] text-muted-foreground">Configure your mock interview session</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Domain Selector */}
        <div>
          <h3 className="text-[12px] font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <Target className="size-3.5 text-amber-500" /> Domain
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(DOMAIN_CONFIG).map(([id, conf]) => (
              <button
                key={id}
                onClick={() => setDomain(id)}
                className={cn(
                  'flex items-center gap-2 rounded-xl border p-3 text-left transition-all',
                  domain === id
                    ? 'border-amber-500/50 bg-amber-500/10 shadow-sm'
                    : 'border-border/30 hover:border-amber-500/20 hover:bg-amber-500/5'
                )}
              >
                <span className="text-lg">{conf.icon}</span>
                <span className={cn(
                  'text-[11px] font-medium truncate',
                  domain === id ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
                )}>
                  {conf.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div>
          <h3 className="text-[12px] font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <BarChart3 className="size-3.5 text-amber-500" /> Difficulty
          </h3>
          <RadioGroup value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)} className="flex flex-wrap gap-2">
            {([
              { value: 'beginner' as Difficulty, label: 'Beginner', desc: '5 questions', emoji: '🌱' },
              { value: 'intermediate' as Difficulty, label: 'Intermediate', desc: '6 questions', emoji: '📈' },
              { value: 'advanced' as Difficulty, label: 'Advanced', desc: '8 questions', emoji: '🔥' },
            ]).map(opt => (
              <Label
                key={opt.value}
                htmlFor={`diff-${opt.value}`}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-4 py-2.5 cursor-pointer transition-all',
                  difficulty === opt.value
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : 'border-border/30 hover:border-amber-500/20'
                )}
              >
                <RadioGroupItem value={opt.value} id={`diff-${opt.value}`} className="sr-only" />
                <span className="text-sm">{opt.emoji}</span>
                <div>
                  <span className={cn(
                    'text-[11px] font-semibold block',
                    difficulty === opt.value ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
                  )}>
                    {opt.label}
                  </span>
                  <span className="text-[9px] text-muted-foreground">{opt.desc}</span>
                </div>
              </Label>
            ))}
          </RadioGroup>
        </div>

        {/* Interview Type */}
        <div>
          <h3 className="text-[12px] font-semibold text-foreground mb-2 flex items-center gap-1.5">
            <MessageSquare className="size-3.5 text-amber-500" /> Interview Type
          </h3>
          <RadioGroup value={interviewType} onValueChange={(v) => setInterviewType(v as InterviewType)} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {([
              { value: 'technical' as InterviewType, label: 'Technical', desc: 'Concepts & coding', emoji: '💻' },
              { value: 'behavioral' as InterviewType, label: 'Behavioral', desc: 'Soft skills', emoji: '🤝' },
              { value: 'mixed' as InterviewType, label: 'Mixed', desc: 'Both combined', emoji: '🔄' },
              { value: 'viva' as InterviewType, label: 'Viva', desc: 'Quick oral exam', emoji: '🎓' },
            ]).map(opt => (
              <Label
                key={opt.value}
                htmlFor={`type-${opt.value}`}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl border p-3 cursor-pointer transition-all text-center',
                  interviewType === opt.value
                    ? 'border-amber-500/50 bg-amber-500/10'
                    : 'border-border/30 hover:border-amber-500/20'
                )}
              >
                <RadioGroupItem value={opt.value} id={`type-${opt.value}`} className="sr-only" />
                <span className="text-lg">{opt.emoji}</span>
                <span className={cn(
                  'text-[11px] font-semibold',
                  interviewType === opt.value ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
                )}>
                  {opt.label}
                </span>
                <span className="text-[9px] text-muted-foreground">{opt.desc}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>

        {/* Focus Areas */}
        {focusTopics.length > 0 && (
          <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Brain className="size-3.5 text-amber-500" />
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">AI Focus Areas</span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-2">
              Based on your Topic Mastery, questions will target these areas:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {focusTopics.map(topic => (
                <Badge key={topic} className="text-[9px] px-2 py-0.5 border-0 bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium">
                  🎯 {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-[11px] gap-1.5"
            onClick={onBack}
          >
            <ChevronRight className="size-3 rotate-180" />
            Back
          </Button>
          <Button
            size="sm"
            className="h-9 text-[11px] gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md flex-1"
            onClick={() => onStart(domain, difficulty, interviewType)}
          >
            <Play className="size-3.5" />
            Start {domainConf?.name || 'Interview'} ({difficulty === 'advanced' ? 8 : difficulty === 'intermediate' ? 6 : 5} Qs)
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENT: Active Interview Session
   ═══════════════════════════════════════════════════════ */

function ActiveInterview({
  session,
  onSubmitAnswer,
  onCompleteInterview,
  submitting,
  evaluation,
  onAcknowledgeEvaluation,
}: {
  session: InterviewSession
  onSubmitAnswer: (questionId: string, answer: string) => void
  onCompleteInterview: () => void
  submitting: boolean
  evaluation: EvaluationResult | null
  onAcknowledgeEvaluation: () => void
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [showIdealAnswer, setShowIdealAnswer] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentQuestion = session.questions[currentQuestionIndex]
  const totalQuestions = session.questions.length
  const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1)
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Pause timer during evaluation
  useEffect(() => {
    if (evaluation && timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    } else if (!evaluation && !timerRef.current) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
    }
  }, [evaluation])

  const isLastQuestion = currentQuestionIndex === totalQuestions - 1

  const handleSubmit = () => {
    if (!answer.trim() || submitting) return
    onSubmitAnswer(currentQuestion.id, answer.trim())
  }

  const handleNext = () => {
    setAnswer('')
    setShowIdealAnswer(false)
    onAcknowledgeEvaluation()
    if (isLastQuestion) {
      // Last question done — complete the interview
      onCompleteInterview()
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const qTypeConf = currentQuestion ? questionTypeConfig[currentQuestion.questionType] : null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      {/* Top Bar: Progress + Timer */}
      <div className="rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-amber-600/5 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Mic className="size-4 text-amber-500" />
            <span className="text-[12px] font-bold text-foreground">
              {DOMAIN_CONFIG[session.domain]?.name || session.domain} Interview
            </span>
            <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-amber-500/20 text-amber-600 dark:text-amber-400 capitalize">
              {session.difficulty}
            </Badge>
            <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-amber-500/20 text-amber-600 dark:text-amber-400 capitalize">
              {session.type}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <Timer className="size-3.5" />
            <span className="text-[12px] font-mono font-bold">{formatElapsed(elapsedSeconds)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={progressPercent} className="h-2 flex-1 [&>div]:bg-amber-500" />
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
            {currentQuestionIndex + 1} / {totalQuestions}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!evaluation ? (
          /* ─── Question + Answer ─── */
          <motion.div
            key={`q-${currentQuestionIndex}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border border-border/40 bg-card overflow-hidden"
          >
            {/* Question Display */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                {qTypeConf && (
                  <Badge className={cn('text-[8px] px-1.5 py-0 border-0 font-bold', qTypeConf.bgColor, qTypeConf.color)}>
                    {qTypeConf.label}
                  </Badge>
                )}
                <Badge className="text-[8px] px-1.5 py-0 border-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                  🎯 {currentQuestion.topic}
                </Badge>
              </div>
              <h3 className="text-[15px] font-bold text-foreground leading-relaxed">
                {currentQuestion.question}
              </h3>
            </div>

            {/* Answer Area */}
            <div className="px-5 pb-5">
              <Textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type your answer here... Be thorough and use examples where possible."
                className="min-h-[160px] text-[13px] leading-relaxed resize-y border-border/40 focus:border-amber-500/40 focus:ring-amber-500/20"
                disabled={submitting}
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-[10px] text-muted-foreground">
                  {answer.trim().length} characters
                </span>
                <Button
                  size="sm"
                  disabled={!answer.trim() || submitting}
                  className="h-9 text-[11px] gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md"
                  onClick={handleSubmit}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-3.5" />
                      Submit Answer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ─── Evaluation Card ─── */
          <motion.div
            key={`eval-${currentQuestionIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl border border-border/40 bg-card overflow-hidden"
          >
            <div className="p-5">
              {/* Score + Feedback Header */}
              <div className="flex items-start gap-5">
                <CircularScore score={evaluation.score} size={90} strokeWidth={6} />
                <div className="flex-1 min-w-0">
                  <h3 className="text-[13px] font-bold text-foreground mb-1">Evaluation</h3>
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    {evaluation.feedback}
                  </p>
                </div>
              </div>

              {/* Ideal Answer (collapsible) */}
              <div className="mt-4 rounded-xl border border-amber-500/15 bg-amber-500/5 overflow-hidden">
                <button
                  onClick={() => setShowIdealAnswer(!showIdealAnswer)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-amber-500/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb className="size-3.5 text-amber-500" />
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">Ideal Answer</span>
                  </div>
                  {showIdealAnswer ? (
                    <EyeOff className="size-3.5 text-muted-foreground" />
                  ) : (
                    <Eye className="size-3.5 text-muted-foreground" />
                  )}
                </button>
                <AnimatePresence>
                  {showIdealAnswer && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3">
                        <p className="text-[12px] text-muted-foreground leading-relaxed">
                          {evaluation.idealAnswer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Next / View Report button */}
              <div className="flex items-center justify-end mt-4">
                <Button
                  size="sm"
                  className="h-9 text-[11px] gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md"
                  onClick={handleNext}
                >
                  {isLastQuestion ? (
                    <>
                      <FileText className="size-3.5" />
                      View Report
                    </>
                  ) : (
                    <>
                      <ArrowRight className="size-3.5" />
                      Next Question
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   SUB-COMPONENT: Interview Report
   ═══════════════════════════════════════════════════════ */

function InterviewReportView({
  report,
  onPracticeAgain,
  onBackToDashboard,
  onAskShijlAI,
}: {
  report: InterviewReport
  onPracticeAgain: () => void
  onBackToDashboard: () => void
  onAskShijlAI?: (context: string) => void
}) {
  const scoreBreakdown = [
    { label: 'Technical Accuracy', weight: '40%', score: report.accuracy, barColor: 'bg-amber-500' },
    { label: 'Concept Coverage', weight: '30%', score: report.completeness, barColor: 'bg-orange-500' },
    { label: 'Communication', weight: '20%', score: report.clarity, barColor: 'bg-teal-500' },
    { label: 'Use of Examples', weight: '10%', score: report.confidence, barColor: 'bg-cyan-500' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="space-y-4"
    >
      {/* Overall Score */}
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-amber-600/5 p-6 text-center">
        <div className="flex items-center justify-center mb-3">
          <CircularScore score={report.overallScore} size={140} strokeWidth={10} label="Overall" />
        </div>
        <h2 className="text-[16px] font-bold text-foreground">Interview Report</h2>
        <p className="text-[12px] text-muted-foreground mt-1">
          {report.overallScore >= 80
            ? '🌟 Excellent performance!'
            : report.overallScore >= 60
              ? '💪 Good effort — keep practicing!'
              : '📈 Room to grow — review and try again!'}
        </p>
      </div>

      {/* Score Breakdown */}
      <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/15">
          <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="size-4 text-amber-500" />
            Score Breakdown
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {scoreBreakdown.map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-[11px] text-muted-foreground w-32 shrink-0">{item.label}</span>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 h-2.5 rounded-full bg-muted/50 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.max(0, item.score))}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={cn('h-full rounded-full', item.barColor)}
                  />
                </div>
                <span className={cn('text-[11px] font-bold w-10 text-right', getScoreColor(item.score))}>
                  {item.score}%
                </span>
              </div>
              <span className="text-[9px] text-muted-foreground/60 w-8 text-right">({item.weight})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Strengths */}
        <div className="rounded-xl border border-emerald-500/20 bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-emerald-500/10 bg-emerald-500/5">
            <h4 className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" /> Strengths
            </h4>
          </div>
          <div className="p-3 flex flex-wrap gap-1.5">
            {report.strengths.map(s => (
              <Badge key={s} className="text-[9px] px-2 py-0.5 border-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ {s}
              </Badge>
            ))}
          </div>
        </div>

        {/* Weaknesses */}
        <div className="rounded-xl border border-red-500/20 bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-red-500/10 bg-red-500/5">
            <h4 className="text-[12px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <XCircle className="size-3.5" /> Areas to Improve
            </h4>
          </div>
          <div className="p-3 flex flex-wrap gap-1.5">
            {report.weaknesses.map(w => (
              <Badge key={w} className="text-[9px] px-2 py-0.5 border-0 bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium">
                ⚠ {w}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* AI Feedback */}
      <div className="rounded-2xl border border-amber-500/15 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-amber-600/5 p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
            <Brain className="size-4" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">AI Feedback</span>
            <p className="text-[12px] text-muted-foreground leading-relaxed mt-1">
              {report.feedback}
            </p>
          </div>
        </div>
      </div>

      {/* Skill Updates */}
      {report.skillUpdates.length > 0 && (
        <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/15">
            <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="size-4 text-amber-500" />
              Skill Updates
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Your mastery was updated based on this interview</p>
          </div>
          <div className="p-4 space-y-3">
            {report.skillUpdates.map(update => (
              <div key={update.topic} className="flex items-center gap-3">
                <span className="text-[11px] font-medium text-foreground w-32 shrink-0 truncate" title={update.topic}>
                  {update.topic}
                </span>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-red-500 w-10 text-right">{update.previousMastery}%</span>
                  <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden relative">
                    <div
                      className="absolute h-full rounded-full bg-red-400/30 transition-all"
                      style={{ width: `${Math.min(100, update.previousMastery)}%` }}
                    />
                    <motion.div
                      initial={{ width: `${Math.min(100, update.previousMastery)}%` }}
                      animate={{ width: `${Math.min(100, update.newMastery)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={cn(
                        'h-full rounded-full relative z-10',
                        update.direction === 'improved' ? 'bg-emerald-500' : 'bg-orange-500'
                      )}
                    />
                  </div>
                  <span className={cn(
                    'text-[10px] font-bold w-10',
                    update.direction === 'improved' ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'
                  )}>
                    {update.newMastery}%
                  </span>
                </div>
                <span className={cn(
                  'text-[9px] font-medium',
                  update.direction === 'improved' ? 'text-emerald-500' : 'text-orange-500'
                )}>
                  {update.direction === 'improved' ? '↑' : '→'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div className="rounded-2xl border border-border/40 bg-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/15">
            <h3 className="text-[13px] font-bold text-foreground flex items-center gap-2">
              <Lightbulb className="size-4 text-amber-500" />
              Recommendations
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Auto-recommended next steps to improve</p>
          </div>
          <div className="p-4 space-y-2">
            {report.recommendations.map((rec, i) => {
              const recConf = recommendationTypeConfig[rec.type]
              const RecIcon = recConf?.icon || BookOpen
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 rounded-xl border border-border/20 p-3 hover:bg-muted/20 transition-colors"
                >
                  <div className={cn('flex size-8 items-center justify-center rounded-lg shrink-0', recConf?.bgColor, recConf?.color)}>
                    <RecIcon className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-foreground">{rec.topic}</span>
                      <Badge className={cn('text-[8px] px-1.5 py-0 border-0 font-bold', recConf?.bgColor, recConf?.color)}>
                        {recConf?.label || rec.type}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{rec.reason}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[9px] gap-1 px-2 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 shrink-0"
                    onClick={() => onAskShijlAI?.(`Help me with ${rec.topic}. Recommendation: ${rec.reason}`)}
                  >
                    <Play className="size-2.5" /> Start
                  </Button>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="h-9 text-[11px] gap-1.5"
          onClick={onBackToDashboard}
        >
          <Home className="size-3.5" />
          Back to Dashboard
        </Button>
        <Button
          size="sm"
          className="h-9 text-[11px] gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md flex-1"
          onClick={onPracticeAgain}
        >
          <RotateCcw className="size-3.5" />
          Practice Again
        </Button>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   LOADING SKELETON
   ═══════════════════════════════════════════════════════ */

function MockInterviewSkeleton() {
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>

      {/* Domain cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/20 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent sessions skeleton */}
      <div className="rounded-2xl border border-border/20 p-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT: MockInterviewTab
   ═══════════════════════════════════════════════════════ */

export function MockInterviewTab({ userId, onAskShijlAI }: MockInterviewProps) {
  // Data state
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // View state
  const [viewState, setViewState] = useState<ViewState>('dashboard')
  const [setupDomain, setSetupDomain] = useState<string | null>(null)

  // Interview session state
  const [session, setSession] = useState<InterviewSession | null>(null)
  const [currentEvaluation, setCurrentEvaluation] = useState<EvaluationResult | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Report state
  const [report, setReport] = useState<InterviewReport | null>(null)

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/ai/mock-interview?userId=${userId}`)
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)
      const json: DashboardData = await res.json()
      setDashboardData(json)
    } catch (err) {
      console.error('[MockInterviewTab] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load mock interview')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  // Start Interview
  const handleStartInterview = async (domain: string, difficulty: Difficulty, interviewType: InterviewType) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/ai/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          userId,
          domain,
          difficulty,
          interviewType,
        }),
      })
      if (!res.ok) throw new Error(`Failed to start: ${res.status}`)
      const json = await res.json()
      setSession(json.interview)
      setViewState('interview')
      setCurrentEvaluation(null)
    } catch (err) {
      console.error('[MockInterviewTab] Start error:', err)
      setError(err instanceof Error ? err.message : 'Failed to start interview')
    } finally {
      setSubmitting(false)
    }
  }

  // Submit Answer
  const handleSubmitAnswer = async (questionId: string, answer: string) => {
    if (!session) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/ai/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_answer',
          userId,
          interviewId: session.id,
          questionId,
          answer,
        }),
      })
      if (!res.ok) throw new Error(`Failed to submit: ${res.status}`)
      const json = await res.json()
      setCurrentEvaluation(json.evaluation)
    } catch (err) {
      console.error('[MockInterviewTab] Submit error:', err)
      // Provide fallback evaluation
      setCurrentEvaluation({
        score: 55,
        feedback: 'Your answer was received. There was an issue with the evaluation engine — please try again for a detailed score.',
        idealAnswer: 'Evaluation unavailable. Please try submitting again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Complete Interview & Get Report
  const handleCompleteInterview = async () => {
    if (!session) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/ai/mock-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          userId,
          interviewId: session.id,
        }),
      })
      if (!res.ok) throw new Error(`Failed to complete: ${res.status}`)
      const json = await res.json()
      setReport(json.report)
      setViewState('report')
    } catch (err) {
      console.error('[MockInterviewTab] Complete error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate report')
    } finally {
      setSubmitting(false)
    }
  }

  // Navigation handlers
  const handleOpenSetup = (domain: string | null) => {
    setSetupDomain(domain)
    setViewState('setup')
  }

  const handleBackToDashboard = () => {
    setViewState('dashboard')
    setSession(null)
    setCurrentEvaluation(null)
    setReport(null)
    setSetupDomain(null)
    fetchDashboard()
  }

  const handlePracticeAgain = () => {
    setViewState('setup')
    setSession(null)
    setCurrentEvaluation(null)
    setReport(null)
    setSetupDomain(session?.domain || null)
  }

  const handleAcknowledgeEvaluation = () => {
    setCurrentEvaluation(null)
  }

  /* ─── RENDER ─── */

  // Loading state
  if (loading && viewState === 'dashboard') {
    return <MockInterviewSkeleton />
  }

  // Error state (only when no data at all)
  if (error && !dashboardData && viewState === 'dashboard') {
    return (
      <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-border/40">
        <Mic className="size-10 text-muted-foreground/30 mb-3" />
        <h3 className="text-sm font-semibold text-foreground mb-1">Failed to load mock interview</h3>
        <p className="text-xs text-muted-foreground mb-3">{error}</p>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-[11px] gap-1.5"
          onClick={fetchDashboard}
        >
          <RefreshCw className="size-3" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {/* ─── State 1: Dashboard ─── */}
        {viewState === 'dashboard' && dashboardData && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* AI Insight Banner */}
            <InterviewAIBanner
              insight={dashboardData.personalization.reason}
              focusTopics={dashboardData.personalization.focusTopics}
              onAskShijlAI={onAskShijlAI ? () => onAskShijlAI(dashboardData.skillContextForAI) : undefined}
            />

            {/* Stats Row */}
            <DashboardStats stats={dashboardData.stats} />

            {/* Domain Cards Grid */}
            <div>
              <h3 className="text-[13px] font-bold text-foreground mb-2.5 flex items-center gap-2">
                <Target className="size-4 text-amber-500" />
                Practice Domains
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dashboardData.domains.map(domain => (
                  <DomainCard
                    key={domain.id}
                    domain={domain}
                    onClick={() => handleOpenSetup(domain.id)}
                  />
                ))}
              </div>
            </div>

            {/* Recent Sessions */}
            <RecentSessionsList
              sessions={dashboardData.recentSessions}
              onViewReport={(s) => {
                // For now, just open setup for the domain since we don't have detailed report fetching
                onAskShijlAI?.(`Show me my interview report for ${DOMAIN_CONFIG[s.domain]?.name || s.domain}. Score: ${s.score}%, difficulty: ${s.difficulty}, type: ${s.type}.`)
              }}
            />

            {/* Start Interview CTA */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <button
                onClick={() => handleOpenSetup(null)}
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white p-4 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all group"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 group-hover:bg-white/30 transition-colors">
                  <Mic className="size-5" />
                </div>
                <div className="text-left">
                  <span className="text-[14px] font-bold block">Start Mock Interview</span>
                  <span className="text-[11px] text-white/80">Practice with AI-powered personalized questions</span>
                </div>
                <ChevronRight className="size-5 ml-auto group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </motion.div>
        )}

        {/* ─── State 2: Interview Setup ─── */}
        {viewState === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <InterviewSetup
              preselectedDomain={setupDomain}
              focusTopics={dashboardData?.personalization.focusTopics || []}
              onStart={handleStartInterview}
              onBack={handleBackToDashboard}
            />
            {submitting && (
              <div className="mt-4 flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-[12px] font-medium">Preparing your interview...</span>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── State 3: Active Interview ─── */}
        {viewState === 'interview' && session && (
          <ActiveInterview
            key={session.id}
            session={session}
            onSubmitAnswer={handleSubmitAnswer}
            onCompleteInterview={handleCompleteInterview}
            submitting={submitting}
            evaluation={currentEvaluation}
            onAcknowledgeEvaluation={handleAcknowledgeEvaluation}
          />
        )}

        {/* ─── State 4: Interview Report ─── */}
        {viewState === 'report' && report && (
          <InterviewReportView
            report={report}
            onPracticeAgain={handlePracticeAgain}
            onBackToDashboard={handleBackToDashboard}
            onAskShijlAI={onAskShijlAI}
          />
        )}
      </AnimatePresence>

      {/* Global error toast-style */}
      {error && viewState !== 'dashboard' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 rounded-xl border border-red-500/20 bg-red-500/10 backdrop-blur-sm p-3 max-w-sm z-50"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="size-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold text-red-600 dark:text-red-400">Error</p>
              <p className="text-[10px] text-muted-foreground">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-muted-foreground hover:text-foreground ml-2">
              ×
            </button>
          </div>
        </motion.div>
      )}

      {/* Loading overlay for interview/report transitions */}
      {submitting && viewState === 'interview' && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-border/40 shadow-xl">
            <Loader2 className="size-8 animate-spin text-amber-500" />
            <span className="text-[12px] font-medium text-foreground">Evaluating your answer...</span>
          </div>
        </div>
      )}
    </div>
  )
}
