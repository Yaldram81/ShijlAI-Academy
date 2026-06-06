'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot, Sparkles, Send, AlertTriangle, TrendingUp, Users, BookOpen,
  GraduationCap, Shield, Plus, Loader2, MessageSquare, ArrowUp,
  BarChart3, Lightbulb, Zap, X, ChevronRight, Clock, RefreshCw,
  Activity, Eye, Circle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { MarkdownRenderer } from '@/components/ai/ai-message-renderer'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */

interface CopilotMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  intent?: string
  timestamp: Date
  recommendations?: string[]
}

interface CriticalAlert {
  id: string
  type: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  entity?: string
  entityType?: 'course' | 'instructor' | 'student' | 'platform'
  timestamp: string
}

interface RecentQuery {
  id: string
  query: string
  intent: string
  timestamp: string
}

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════ */

const DEFAULT_SUGGESTIONS = [
  'Which courses need attention?',
  'Show at-risk students',
  'Generate weekly report',
  'Why are enrollments declining?',
  'What requires immediate attention?',
  'Which instructors need review?',
  'How many students are inactive?',
  'Platform summary this week',
]

const intentColors: Record<string, string> = {
  course_analysis: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
  instructor_analysis: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400',
  student_analysis: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  engagement_analysis: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  enrollment_analysis: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  risk_analysis: 'bg-red-500/10 text-red-600 dark:text-red-400',
  report_generation: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  search: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
  platform_overview: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
}

const intentLabels: Record<string, string> = {
  course_analysis: 'Course Analysis',
  instructor_analysis: 'Instructor Analysis',
  student_analysis: 'Student Analysis',
  engagement_analysis: 'Engagement Analysis',
  enrollment_analysis: 'Enrollment Analysis',
  risk_analysis: 'Risk Analysis',
  report_generation: 'Report',
  search: 'Search',
  platform_overview: 'Platform Overview',
}

const QUICK_ACTIONS = [
  { label: 'Courses', icon: BookOpen, color: 'text-teal-500' },
  { label: 'Students', icon: Users, color: 'text-violet-500' },
  { label: 'Instructors', icon: GraduationCap, color: 'text-fuchsia-500' },
  { label: 'Risks', icon: Shield, color: 'text-red-500' },
  { label: 'Report', icon: BarChart3, color: 'text-amber-500' },
]

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatRelativeTime(ts: string): string {
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString()
}

function getIntentBadge(intent?: string) {
  if (!intent) return null
  const color = intentColors[intent] || 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
  const label = intentLabels[intent] || intent.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  return { color, label }
}

/* ═══════════════════════════════════════════════════════════
   TYPING INDICATOR
   ═══════════════════════════════════════════════════════════ */

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3 px-4 md:px-6 py-3"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
        <Bot className="size-4" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-muted/40 border border-border/30 px-4 py-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Loader2 className="size-3.5 animate-spin text-blue-500" />
          <span className="text-[12px] text-muted-foreground font-medium">
            Copilot is analyzing platform data...
          </span>
        </div>
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="size-1.5 rounded-full bg-blue-400"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   WELCOME SCREEN
   ═══════════════════════════════════════════════════════════ */

function WelcomeScreen({ onSuggestionClick }: { onSuggestionClick: (q: string) => void }) {
  const { currentUser } = useAppStore()

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto px-6 py-12">
      {/* AI Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 mb-6"
      >
        <Sparkles className="size-8" />
      </motion.div>

      {/* Greeting */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl font-bold text-foreground mb-2"
      >
        Hello, {currentUser?.name?.split(' ')[0] || 'Admin'}
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-muted-foreground text-[15px] mb-4 text-center"
      >
        I&apos;m your AI Admin Copilot — ask me anything about your platform and I&apos;ll analyze the data for you.
      </motion.p>

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Badge variant="outline" className="mb-8 border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5">
          <Sparkles className="size-3 mr-1" />
          Decision Intelligence
        </Badge>
      </motion.div>

      {/* Suggested Questions Grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg"
      >
        {DEFAULT_SUGGESTIONS.map((q, i) => (
          <button
            key={i}
            onClick={() => onSuggestionClick(q)}
            className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-card px-4 py-3 text-[13px] text-foreground/80 transition-all text-left hover:shadow-sm hover:border-blue-500/20 hover:text-blue-600 dark:hover:text-blue-400 group"
          >
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/50 group-hover:text-blue-500 transition-colors" />
            <span className="truncate">{q}</span>
          </button>
        ))}
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   RIGHT SIDEBAR
   ═══════════════════════════════════════════════════════════ */

function RightSidebar({
  suggestedQuestions,
  recentQueries,
  criticalAlerts,
  onSuggestionClick,
  onRecentQueryClick,
  isLoading,
}: {
  suggestedQuestions: string[]
  recentQueries: RecentQuery[]
  criticalAlerts: CriticalAlert[]
  onSuggestionClick: (q: string) => void
  onRecentQueryClick: (q: string) => void
  isLoading: boolean
}) {
  return (
    <div className="hidden md:flex w-[30%] min-w-[280px] max-w-[400px] flex-col border-l border-border/30 bg-muted/20">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">

          {/* ─── Suggested Questions ─── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="size-4 text-blue-500" />
              <span className="text-[12px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Suggested Questions
              </span>
            </div>
            <div className="space-y-1.5">
              {(suggestedQuestions.length > 0 ? suggestedQuestions : DEFAULT_SUGGESTIONS).map((q, i) => (
                <button
                  key={`sq-${i}-${q.slice(0, 20)}`}
                  onClick={() => onSuggestionClick(q)}
                  className="flex items-center gap-2 w-full rounded-lg border border-border/30 bg-card px-3 py-2 text-[12px] text-foreground/80 hover:bg-blue-500/5 hover:border-blue-500/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left group"
                >
                  <ChevronRight className="size-3 shrink-0 text-muted-foreground/50 group-hover:text-blue-500 transition-colors" />
                  <span className="truncate">{q}</span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* ─── Recent Insights ─── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="size-4 text-blue-500" />
              <span className="text-[12px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Recent Insights
              </span>
              {recentQueries.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-auto">
                  {recentQueries.length}
                </Badge>
              )}
            </div>
            {recentQueries.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/40 p-4 text-center">
                <MessageSquare className="size-5 text-muted-foreground/40 mx-auto mb-1.5" />
                <p className="text-[11px] text-muted-foreground">No recent queries yet</p>
                <p className="text-[10px] text-muted-foreground/60">Ask a question to get started</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentQueries.slice(0, 3).map((rq) => {
                  const badge = getIntentBadge(rq.intent)
                  return (
                    <button
                      key={rq.id}
                      onClick={() => onRecentQueryClick(rq.query)}
                      className="flex items-start gap-2 w-full rounded-lg border border-border/30 bg-card px-3 py-2.5 text-left hover:bg-blue-500/5 hover:border-blue-500/20 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-foreground/80 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {rq.query}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {badge && (
                            <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', badge.color)}>
                              {badge.label}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {formatRelativeTime(rq.timestamp)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="size-3 text-muted-foreground/50 shrink-0 mt-1 group-hover:text-blue-500 transition-colors" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* ─── Critical Alerts ─── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="size-4 text-red-500" />
              <span className="text-[12px] font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">
                Critical Alerts
              </span>
              {criticalAlerts.length > 0 && (
                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 text-[10px] px-1.5 py-0 h-4 ml-auto">
                  {criticalAlerts.length}
                </Badge>
              )}
            </div>
            {criticalAlerts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/40 p-4 text-center">
                <Shield className="size-5 text-emerald-500/40 mx-auto mb-1.5" />
                <p className="text-[11px] text-muted-foreground">No critical alerts</p>
                <p className="text-[10px] text-muted-foreground/60">Platform is running smoothly</p>
              </div>
            ) : (
              <div className="space-y-2">
                {criticalAlerts.map((alert, i) => (
                  <div
                    key={alert.id || `alert-${i}-${alert.title}`}
                    className={cn(
                      'rounded-lg border p-2.5',
                      alert.severity === 'critical'
                        ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10'
                        : alert.severity === 'warning'
                          ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10'
                          : 'border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-sky-900/10'
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {alert.severity === 'critical' ? (
                        <AlertTriangle className="size-3 text-red-500" />
                      ) : alert.severity === 'warning' ? (
                        <AlertTriangle className="size-3 text-amber-500" />
                      ) : (
                        <Eye className="size-3 text-sky-500" />
                      )}
                      <span className={cn(
                        'text-[10px] font-semibold uppercase',
                        alert.severity === 'critical' ? 'text-red-600 dark:text-red-400'
                          : alert.severity === 'warning' ? 'text-amber-600 dark:text-amber-400'
                            : 'text-sky-600 dark:text-sky-400'
                      )}>
                        {alert.severity}
                      </span>
                      {alert.entityType && (
                        <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-0.5">
                          {alert.entityType === 'course' && <BookOpen className="size-2.5" />}
                          {alert.entityType === 'instructor' && <GraduationCap className="size-2.5" />}
                          {alert.entityType === 'student' && <Users className="size-2.5" />}
                          {alert.entityType === 'platform' && <Activity className="size-2.5" />}
                          {alert.entityType}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] font-medium text-foreground">{alert.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{alert.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border/20">
        <div className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-2.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="size-3 text-blue-500" />
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">Copilot Intelligence</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Analyzes platform data, enrollment trends, course health, and student risk factors in real-time.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT — AI ADMIN COPILOT VIEW
   ═══════════════════════════════════════════════════════════ */

export function AdminCopilotView() {
  const { currentUser } = useAppStore()
  const adminId = currentUser?.id || 'admin-demo-1'

  /* ─── State ─── */
  const [messages, setMessages] = useState<CopilotMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlert[]>([])
  const [recentQueries, setRecentQueries] = useState<RecentQuery[]>([])
  const [sidebarLoading, setSidebarLoading] = useState(true)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  /* ─── Auto-scroll ─── */
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  /* ─── Load sidebar data ─── */
  const fetchSidebarData = useCallback(async () => {
    setSidebarLoading(true)
    try {
      const res = await fetch(`/api/admin/copilot?adminId=${adminId}`)
      if (!res.ok) throw new Error('Failed to fetch sidebar data')
      const data = await res.json()
      setSuggestedQuestions(data.suggestedQuestions || [])
      setCriticalAlerts(data.criticalAlerts || [])
      setRecentQueries(data.recentQueries || [])
    } catch {
      // Silently fail — sidebar will show defaults
      setSuggestedQuestions(DEFAULT_SUGGESTIONS)
      setCriticalAlerts([
        {
          id: 'alert-1',
          type: 'low_engagement',
          severity: 'warning',
          title: 'Low Engagement in ML Course',
          description: 'Student engagement dropped 23% this week in "Machine Learning Fundamentals". Consider reviewing content difficulty.',
          entityType: 'course',
          timestamp: new Date().toISOString(),
        },
        {
          id: 'alert-2',
          type: 'instructor_inactive',
          severity: 'info',
          title: 'Instructor Review Pending',
          description: '2 new instructor applications awaiting review. Average response time: 3 days.',
          entityType: 'instructor',
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setSidebarLoading(false)
    }
  }, [adminId])

  useEffect(() => {
    fetchSidebarData()
  }, [fetchSidebarData])

  /* ─── Send message ─── */
  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: CopilotMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/admin/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, query: text.trim() }),
      })

      if (!res.ok) throw new Error('Failed to get copilot response')

      const data = await res.json()

      const aiMsg: CopilotMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: data.message || 'I was unable to analyze the data. Please try again.',
        intent: data.intent,
        timestamp: new Date(),
        recommendations: data.recommendations,
      }

      setMessages((prev) => [...prev, aiMsg])

      // Update recent queries with the new query
      const intent = data.intent || 'search'
      setRecentQueries((prev) => [
        {
          id: `rq-${Date.now()}`,
          query: text.trim(),
          intent,
          timestamp: new Date().toISOString(),
        },
        ...prev.slice(0, 4),
      ])
    } catch {
      const errorMsg: CopilotMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: 'I encountered an error analyzing the platform data. Please try again or rephrase your question.',
        intent: 'search',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
      toast.error('Failed to get AI response. Please try again.')
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputValue)
    }
  }

  const clearChat = () => {
    setMessages([])
    toast.success('Chat cleared')
  }

  const handleQuickAction = (action: string) => {
    const queries: Record<string, string> = {
      Courses: 'Which courses need attention right now?',
      Students: 'Show me at-risk students and their status',
      Instructors: 'Which instructors need review?',
      Risks: 'What are the current platform risks?',
      Report: 'Generate a platform summary report',
    }
    sendMessage(queries[action] || `Tell me about ${action.toLowerCase()}`)
  }

  const showWelcome = messages.length === 0

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="flex h-full rounded-2xl border border-border/40 overflow-hidden bg-background">

      {/* ═══ LEFT: Main Chat Area (~70%) ═══ */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* ─── Header ─── */}
        <div className="flex items-center justify-between px-3 md:px-4 py-2.5 border-b border-border/30 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-violet-500/5 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm shrink-0">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-foreground">AI Admin Copilot</h2>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5">
                  <Bot className="size-2.5 mr-0.5" />
                  Intelligence
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">Your intelligence assistant — ask anything about your platform</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="text-[12px] text-muted-foreground hover:text-foreground gap-1"
              >
                <Plus className="size-3.5" />
                <span className="hidden sm:inline">New Chat</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchSidebarData}
              className="text-[12px] text-muted-foreground hover:text-foreground gap-1"
              disabled={sidebarLoading}
            >
              <RefreshCw className={cn('size-3.5', sidebarLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* ─── Chat Messages / Welcome ─── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
          {showWelcome ? (
            <WelcomeScreen onSuggestionClick={sendMessage} />
          ) : (
            <div className="max-w-3xl mx-auto px-4 md:px-6 py-4">
              <div className="space-y-1 pb-4">
                {messages.map((msg) => {
                  const isUser = msg.role === 'user'
                  const badge = getIntentBadge(msg.intent)
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className={cn(
                        'flex gap-3 py-3',
                        isUser ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {/* AI Avatar */}
                      {!isUser && (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm mt-0.5">
                          <Bot className="size-4" />
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div className={cn(
                        'max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3',
                        isUser
                          ? 'bg-blue-500/10 border border-blue-500/20 rounded-tr-sm'
                          : 'bg-muted/30 border border-border/30 rounded-tl-sm'
                      )}>
                        {/* Intent Badge */}
                        {!isUser && badge && (
                          <div className="mb-2">
                            <span className={cn('inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium', badge.color)}>
                              <Zap className="size-2.5" />
                              {badge.label}
                            </span>
                          </div>
                        )}

                        {/* Content */}
                        {isUser ? (
                          <p className="text-[14px] leading-relaxed text-foreground whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <MarkdownRenderer content={msg.content} />
                        )}

                        {/* Recommendations */}
                        {!isUser && msg.recommendations && msg.recommendations.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-border/20">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <TrendingUp className="size-3 text-blue-500" />
                              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">Recommendations</span>
                            </div>
                            <div className="space-y-1">
                              {msg.recommendations.map((rec, i) => (
                                <button
                                  key={i}
                                  onClick={() => sendMessage(rec)}
                                  className="flex items-center gap-1.5 w-full rounded-md bg-blue-500/5 border border-blue-500/10 px-2.5 py-1.5 text-[12px] text-foreground/80 hover:bg-blue-500/10 hover:border-blue-500/20 transition-colors text-left group"
                                >
                                  <ChevronRight className="size-3 text-blue-500/60 group-hover:text-blue-500 shrink-0 transition-colors" />
                                  <span className="truncate">{rec}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Timestamp */}
                        <div className={cn(
                          'text-[10px] mt-1.5',
                          isUser ? 'text-blue-500/50' : 'text-muted-foreground/40'
                        )}>
                          {formatTimestamp(msg.timestamp)}
                        </div>
                      </div>

                      {/* User Avatar */}
                      {isUser && (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-sm mt-0.5">
                          <span className="text-[11px] font-bold">
                            {currentUser?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'A'}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  )
                })}

                {/* Typing Indicator */}
                <AnimatePresence>
                  {isLoading && <TypingIndicator />}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* ─── Mobile Suggestion Chips (visible only on mobile when no messages) ─── */}
        {showWelcome && (
          <div className="md:hidden flex items-center gap-1.5 px-3 pb-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {DEFAULT_SUGGESTIONS.slice(0, 5).map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="flex items-center gap-1.5 rounded-full border border-border/40 bg-card px-3 py-1.5 text-[11px] text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/20 transition-colors whitespace-nowrap shrink-0"
              >
                <Circle className="size-1.5 fill-current" />
                {q}
              </button>
            ))}
          </div>
        )}

        {/* ─── Chat Input ─── */}
        <div className="border-t border-border/30 bg-background/80 backdrop-blur-sm px-3 md:px-4 py-3">
          <form onSubmit={handleSubmit} className="flex items-end gap-2 max-w-3xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your platform..."
                rows={1}
                className={cn(
                  'w-full resize-none rounded-xl border border-border/50 bg-card px-4 py-2.5 text-[14px]',
                  'placeholder:text-muted-foreground/60',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30',
                  'transition-all min-h-[42px] max-h-[120px]'
                )}
                style={{ height: 'auto', overflow: 'hidden' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px'
                }}
              />
            </div>
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className={cn(
                'rounded-xl h-[42px] w-[42px] p-0 gap-0 shrink-0',
                'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'shadow-sm shadow-blue-500/20'
              )}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowUp className="size-4" />
              )}
            </Button>
          </form>

          {/* Quick Action Chips */}
          <div className="flex items-center gap-1.5 mt-2 max-w-3xl mx-auto overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {QUICK_ACTIONS.map((action) => {
              const ActionIcon = action.icon
              return (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.label)}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 rounded-full border border-border/40 bg-card px-3 py-1.5 text-[11px] text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/20 transition-colors whitespace-nowrap shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ActionIcon className={cn('size-3', action.color)} />
                  {action.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ═══ RIGHT: Sidebar (~30%, hidden on mobile) ═══ */}
      <RightSidebar
        suggestedQuestions={suggestedQuestions}
        recentQueries={recentQueries}
        criticalAlerts={criticalAlerts}
        onSuggestionClick={sendMessage}
        onRecentQueryClick={sendMessage}
        isLoading={sidebarLoading}
      />
    </div>
  )
}

export default AdminCopilotView
