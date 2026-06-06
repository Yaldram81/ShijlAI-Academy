'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, Loader2, Sparkles, Brain, Target, BookOpen, TrendingUp, Zap, Lightbulb, Calendar, BarChart3, MessageSquare, ChevronRight, AlertTriangle, CheckCircle2, X, Flame, GraduationCap, Shield, ArrowRight, Clock, Route } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ResizableSidepanel } from '@/components/resizable-sidepanel'
import { AiMessageRenderer } from '@/components/ai/ai-message-renderer'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

/* ─── Types ─── */
interface ChatMsg {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface CompanionInsight {
  id: string
  type: 'focus' | 'warning' | 'achievement' | 'suggestion'
  title: string
  description: string
  icon: typeof Brain
  color: string
  bgColor: string
}

interface QuickStat {
  label: string
  value: string | number
  icon: typeof Flame
  color: string
  bgColor: string
}

/* ─── Suggested Prompts ─── */
const SUGGESTED_PROMPTS = [
  { label: 'What should I focus on today?', icon: <Target className="size-4" /> },
  { label: 'Analyze my weak topics', icon: <Brain className="size-4" /> },
  { label: 'Create a study plan for my weak areas', icon: <Calendar className="size-4" /> },
  { label: 'How can I improve my quiz scores?', icon: <BarChart3 className="size-4" /> },
]

/* ─── Proactive Insights (mock data based on platform intelligence) ─── */
const MOCK_INSIGHTS: CompanionInsight[] = [
  {
    id: 'insight-1',
    type: 'focus',
    title: 'Focus on Calculus Today',
    description: 'Your quiz scores dropped 15% this week. A quick review session can help recover your momentum.',
    icon: Target,
    color: 'text-sky-600 dark:text-sky-400',
    bgColor: 'bg-sky-500/10',
  },
  {
    id: 'insight-2',
    type: 'warning',
    title: 'Organic Chemistry Gap',
    description: 'You haven\'t studied this topic in 7 days. Spaced repetition recommends a review now.',
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
  },
  {
    id: 'insight-3',
    type: 'achievement',
    title: 'JavaScript Mastery Rising',
    description: 'Your mastery increased by 12% this week. Keep going — you\'re close to Advanced level!',
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10',
  },
  {
    id: 'insight-4',
    type: 'suggestion',
    title: 'Try a Practice Quiz',
    description: 'Taking a diagnostic quiz on weak topics can boost retention by up to 30%.',
    icon: Lightbulb,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-500/10',
  },
]

const MOCK_QUICK_STATS: QuickStat[] = [
  { label: 'Study Streak', value: 12, icon: Flame, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  { label: 'XP Earned', value: '2,450', icon: Zap, color: 'text-sky-500', bgColor: 'bg-sky-500/10' },
  { label: 'Topics Mastered', value: 8, icon: GraduationCap, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  { label: 'Weak Areas', value: 3, icon: AlertTriangle, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
]

/* ─── Helpers ─── */
function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/* ─── Typing Indicator ─── */
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-4 px-0 py-3"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-teal-600 text-white">
        <Bot className="size-4" />
      </div>
      <div className="flex items-center gap-1.5 pt-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="size-2 rounded-full bg-foreground/40"
            animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   AI LEARNING COMPANION VIEW
   A dedicated proactive AI mentor that uses platform intelligence
   ═══════════════════════════════════════════════════════════ */
export function LearningCompanionView() {
  const { currentUser } = useAppStore()
  const userId = currentUser?.id || 'demo-user-1'

  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showFloatingBtn, setShowFloatingBtn] = useState(true)
  const [chatInitialized, setChatInitialized] = useState(false)
  const [insights] = useState<CompanionInsight[]>(MOCK_INSIGHTS)
  const [quickStats] = useState<QuickStat[]>(MOCK_QUICK_STATS)
  const [todayFocus] = useState({
    title: 'Calculus Fundamentals',
    description: 'Review limits & derivatives to recover your quiz performance',
    progress: 35,
    estimatedTime: '25 min',
  })

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom
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

  // Send proactive greeting on first load
  useEffect(() => {
    if (!chatInitialized) {
      setChatInitialized(true)
      setTimeout(() => {
        const greeting: ChatMsg = {
          id: `msg-greeting-${Date.now()}`,
          role: 'assistant',
          content: `Hey! 👋 I've been analyzing your learning patterns. Here's what I noticed:\n\n**📊 Quick Summary:**\n- Your **Calculus** quiz scores dropped 15% this week — let's fix that!\n- You haven't touched **Organic Chemistry** in 7 days\n- Great progress on **JavaScript** — you're close to Advanced level! 🎉\n\nI'm here to proactively guide your learning based on what your data tells me. Want me to dive deeper into any of these?`,
          timestamp: new Date(),
        }
        setMessages([greeting])
      }, 800)
    }
  }, [chatInitialized])

  // Track focus for floating button visibility
  const handleFocusInput = useCallback(() => {
    setShowFloatingBtn(false)
  }, [])

  const handleBlurInput = useCallback(() => {
    // Show floating button after a short delay when chat loses focus
    setTimeout(() => setShowFloatingBtn(true), 300)
  }, [])

  // ─── Send Message ───
  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: ChatMsg = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai/shijlai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: text.trim(),
          mode: 'companion',
          sessionId: sessionId || undefined,
        }),
      })

      if (!res.ok) throw new Error('Failed to get response')

      const data = await res.json()

      const rawContent = data.message || data.response || "I'm here to help! Could you tell me more about what you'd like to work on?"
      const aiMsg: ChatMsg = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMsg])

      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId)
      }
    } catch {
      const errorMsg: ChatMsg = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
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
    setSessionId(null)
    // Re-send greeting
    setChatInitialized(false)
    toast.success('Chat cleared')
  }

  const showWelcome = messages.length === 0

  /* ═══ RENDER ═══ */
  return (
    <div className="flex h-full rounded-2xl border border-border/40 overflow-hidden bg-background">

      {/* ═══ LEFT: Main Chat Area ═══ */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* ─── Header ─── */}
        <div className="flex items-center justify-between px-3 md:px-4 py-2.5 border-b border-border/30 bg-gradient-to-r from-sky-500/5 via-teal-500/5 to-cyan-500/5 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-teal-600 text-white shadow-sm shrink-0">
              <Bot className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-foreground">AI Learning Companion</h2>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-sky-500/30 text-sky-600 dark:text-sky-400 bg-sky-500/5">
                  <Sparkles className="size-2.5 mr-0.5" />
                  AI-powered
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">Your proactive AI mentor — powered by your learning data</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="text-[12px] text-muted-foreground hover:text-foreground gap-1"
              >
                <X className="size-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </Button>
            )}
          </div>
        </div>

        {/* ─── Chat Messages / Welcome ─── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
          {showWelcome ? (
            /* ─── Welcome Screen ─── */
            <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto px-6 py-12">
              {/* AI Logo */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-teal-600 text-white shadow-lg shadow-sky-500/20 mb-6"
              >
                <Bot className="size-8" />
              </motion.div>

              {/* Greeting */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-bold text-foreground mb-2"
              >
                Hello, {currentUser?.name?.split(' ')[0] || 'Student'}!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-muted-foreground text-[15px] mb-4 text-center"
              >
                I'm your AI Learning Companion — I proactively analyze your learning data to guide you.
              </motion.p>

              {/* Companion badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Badge variant="outline" className="mb-8 border-sky-500/30 text-sky-600 dark:text-sky-400 bg-sky-500/5">
                  <Sparkles className="size-3 mr-1" />
                  AI-powered Mentor
                </Badge>
              </motion.div>

              {/* Suggested prompts */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg"
              >
                {SUGGESTED_PROMPTS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q.label)}
                    className="flex items-center gap-2.5 rounded-xl border border-border/50 bg-card px-4 py-3 text-[13px] text-foreground/80 transition-all text-left hover:shadow-sm hover:border-sky-500/20 text-sky-600 dark:text-sky-400"
                  >
                    <span className="shrink-0 opacity-60">{q.icon}</span>
                    <span className="truncate">{q.label}</span>
                  </button>
                ))}
              </motion.div>
            </div>
          ) : (
            /* ─── Messages ─── */
            <div className="max-w-3xl mx-auto px-4 md:px-6 py-4">
              <div className="space-y-1 pb-4">
                {messages.map((msg) => {
                  const isUser = msg.role === 'user'
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className={cn(
                        'flex gap-4 py-3',
                        isUser ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {/* AI Avatar */}
                      {!isUser && (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-teal-600 text-white mt-0.5">
                          <Bot className="size-4" />
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div className={cn(
                        'max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3',
                        isUser
                          ? 'bg-gradient-to-br from-sky-500 to-teal-600 text-white rounded-tr-sm'
                          : 'bg-muted/60 border border-border/30 rounded-tl-sm'
                      )}>
                        {isUser ? (
                          <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <AiMessageRenderer content={msg.content} mode="companion" modeColor="sky" />
                        )}
                        <div className={cn(
                          'text-[10px] mt-1.5',
                          isUser ? 'text-white/60' : 'text-muted-foreground/50'
                        )}>
                          {formatTimestamp(msg.timestamp)}
                        </div>
                      </div>

                      {/* User Avatar */}
                      {isUser && (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-teal-500 text-white mt-0.5">
                          <span className="text-[11px] font-bold">
                            {currentUser?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'S'}
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

        {/* ─── Chat Input ─── */}
        <div className="border-t border-border/30 bg-background/80 backdrop-blur-sm px-3 md:px-4 py-3">
          <form onSubmit={handleSubmit} className="flex items-end gap-2 max-w-3xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={handleFocusInput}
                onBlur={handleBlurInput}
                placeholder="Ask your AI Companion anything..."
                rows={1}
                className={cn(
                  'w-full resize-none rounded-xl border border-border/50 bg-card px-4 py-2.5 text-[14px]',
                  'placeholder:text-muted-foreground/60',
                  'focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/30',
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
                'rounded-xl h-[42px] px-4 gap-1.5 shrink-0',
                'bg-gradient-to-r from-sky-500 to-teal-600 hover:from-sky-600 hover:to-teal-700 text-white',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'shadow-sm shadow-sky-500/20'
              )}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              <span className="hidden sm:inline text-[13px]">Send</span>
            </Button>
          </form>

          {/* Quick suggestions below input (when no messages) */}
          {messages.length <= 1 && (
            <div className="flex items-center gap-1.5 mt-2 max-w-3xl mx-auto overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {SUGGESTED_PROMPTS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q.label)}
                  className="flex items-center gap-1.5 rounded-full border border-border/40 bg-card px-3 py-1.5 text-[11px] text-muted-foreground hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-500/20 transition-colors whitespace-nowrap shrink-0"
                >
                  {q.icon}
                  {q.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ RIGHT: Learning Intelligence Dashboard (desktop only) ═══ */}
      <ResizableSidepanel
        defaultWidth={340}
        minWidth={280}
        maxWidth={600}
        storageKey="learning-companion"
        header={
          <div className="bg-gradient-to-r from-sky-500/10 via-teal-500/10 to-cyan-500/10 px-4 py-3 border-b border-border/30">
            <div className="flex items-center gap-2 pr-8">
              <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-teal-600 text-white shadow-sm shrink-0">
                <Brain className="size-3.5" />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-foreground">Your Learning Intelligence</h3>
                <p className="text-[10px] text-sky-600/70 dark:text-sky-400/70">Powered by platform data</p>
              </div>
            </div>
          </div>
        }
      >
        <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
          {/* ─── Today's Focus ─── */}
          <div className="px-4 py-3 border-b border-border/20">
            <div className="flex items-center gap-2 mb-3">
              <Target className="size-4 text-sky-500" />
              <span className="text-[12px] font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">Today's Focus</span>
            </div>
            <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[14px] font-semibold text-foreground">{todayFocus.title}</h4>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-sky-500/20 text-sky-600 dark:text-sky-400">
                  <Clock className="size-2.5 mr-0.5" />
                  {todayFocus.estimatedTime}
                </Badge>
              </div>
              <p className="text-[12px] text-muted-foreground mb-3">{todayFocus.description}</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-sky-600 dark:text-sky-400">{todayFocus.progress}%</span>
                </div>
                <Progress value={todayFocus.progress} className="h-1.5 bg-sky-500/10 [&>div]:bg-gradient-to-r [&>div]:from-sky-500 [&>div]:to-teal-500" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2.5 text-[12px] gap-1 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10"
                onClick={() => sendMessage(`Help me with ${todayFocus.title}`)}
              >
                <ArrowRight className="size-3" />
                Start Focus Session
              </Button>
            </div>
          </div>

          {/* ─── AI Insights ─── */}
          <div className="px-4 py-3 border-b border-border/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="size-4 text-sky-500" />
              <span className="text-[12px] font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">AI Insights</span>
            </div>
            <div className="space-y-2">
              {insights.map((insight) => {
                const InsightIcon = insight.icon
                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      'rounded-lg border border-border/30 p-2.5',
                      'hover:border-border/50 transition-colors cursor-pointer',
                      insight.bgColor
                    )}
                    onClick={() => sendMessage(`Tell me more about: ${insight.title}`)}
                  >
                    <div className="flex items-start gap-2">
                      <div className={cn('flex size-6 shrink-0 items-center justify-center rounded-md mt-0.5', insight.bgColor)}>
                        <InsightIcon className={cn('size-3.5', insight.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className={cn('text-[12px] font-semibold', insight.color)}>{insight.title}</h5>
                        <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{insight.description}</p>
                      </div>
                      <ChevronRight className="size-3.5 text-muted-foreground/50 shrink-0 mt-1" />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* ─── Suggested Actions ─── */}
          <div className="px-4 py-3 border-b border-border/20">
            <div className="flex items-center gap-2 mb-3">
              <Route className="size-4 text-sky-500" />
              <span className="text-[12px] font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">Suggested Actions</span>
            </div>
            <div className="space-y-1.5">
              {[
                { label: 'Review Calculus notes', icon: BookOpen, color: 'text-emerald-500' },
                { label: 'Take Organic Chemistry quiz', icon: Brain, color: 'text-violet-500' },
                { label: 'Practice JavaScript exercises', icon: TrendingUp, color: 'text-sky-500' },
                { label: 'Set weekly study goal', icon: Target, color: 'text-amber-500' },
              ].map((action, i) => {
                const ActionIcon = action.icon
                return (
                  <button
                    key={i}
                    onClick={() => sendMessage(`Help me ${action.label.toLowerCase()}`)}
                    className="flex items-center gap-2.5 w-full rounded-lg border border-border/30 bg-card px-3 py-2 text-[12px] text-foreground hover:bg-muted/50 hover:border-border/50 transition-colors text-left"
                  >
                    <ActionIcon className={cn('size-3.5 shrink-0', action.color)} />
                    <span className="flex-1 truncate">{action.label}</span>
                    <ArrowRight className="size-3 text-muted-foreground/50 shrink-0" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* ─── Quick Stats ─── */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="size-4 text-sky-500" />
              <span className="text-[12px] font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">Quick Stats</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {quickStats.map((stat, i) => {
                const StatIcon = stat.icon
                return (
                  <div
                    key={i}
                    className="rounded-lg border border-border/30 bg-card p-2.5 text-center"
                  >
                    <div className={cn('flex size-7 items-center justify-center rounded-lg mx-auto mb-1.5', stat.bgColor)}>
                      <StatIcon className={cn('size-3.5', stat.color)} />
                    </div>
                    <div className="text-[16px] font-bold text-foreground">{stat.value}</div>
                    <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ─── Learning Companion Info ─── */}
          <div className="mt-auto px-4 py-3 border-t border-border/20">
            <div className="rounded-lg bg-sky-500/5 border border-sky-500/10 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Shield className="size-3.5 text-sky-500" />
                <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">Privacy Note</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Your AI Companion analyzes your learning data privately. Insights are generated locally and never shared with third parties.
              </p>
            </div>
          </div>
        </div>
      </ResizableSidepanel>

      {/* ═══ Floating Companion Button (desktop only, shown when chat not focused) ═══ */}
      <AnimatePresence>
        {showFloatingBtn && messages.length > 0 && (
          <motion.button
            key="companion-fab"
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => {
              inputRef.current?.focus()
              setShowFloatingBtn(false)
            }}
            className="fixed bottom-6 right-6 z-50 hidden lg:flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-teal-600 text-white shadow-lg shadow-sky-500/25 hover:shadow-xl hover:shadow-sky-500/30 hover:from-sky-600 hover:to-teal-700 transition-all active:scale-95 group cursor-pointer"
            title="Open AI Companion"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-white/20 shrink-0 group-hover:bg-white/30 transition-colors">
              <Bot className="size-4" />
            </div>
            <span className="text-[13px] font-semibold whitespace-nowrap">
              AI Companion
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ═══ MOBILE: Floating FAB ═══ */}
      <button
        onClick={() => inputRef.current?.focus()}
        className="fixed bottom-6 right-6 z-40 lg:hidden flex size-14 items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-teal-600 text-white shadow-lg shadow-sky-500/30 hover:from-sky-600 hover:to-teal-700 transition-all active:scale-95"
      >
        <MessageSquare className="size-6" />
      </button>
    </div>
  )
}

export default LearningCompanionView
