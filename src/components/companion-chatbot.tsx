'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  Send,
  X,
  Sparkles,
  Brain,
  Target,
  Flame,
  BarChart3,
  Minimize2,
  Loader2,
  BookOpen,
  Zap,
  Route,
  CalendarClock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface CompanionChatMessage {
  id: string
  role: 'user' | 'companion'
  content: string
  timestamp: number
}

interface CompanionChatbotProps {
  userId: string
  /** Optional: personality mode for the companion */
  personality?: 'coach' | 'mentor' | 'advisor'
  /** Optional: initial greeting from companion */
  greeting?: string
  /** Position offset from bottom-right corner */
  bottomOffset?: number
  rightOffset?: number
}

/* ═══════════════════════════════════════════════════════
   QUICK PROMPTS CONFIG
   ═══════════════════════════════════════════════════════ */

const quickPrompts = [
  { label: 'How am I doing?', icon: BarChart3, prompt: 'How am I doing overall? Give me a summary of my learning progress.' },
  { label: 'What to focus on?', icon: Target, prompt: 'What should I focus on today? Based on my weak topics and upcoming plans.' },
  { label: 'Am I on track?', icon: Route, prompt: 'Am I on track with my study plans and learning goals? Any red flags?' },
  { label: 'Motivate me!', icon: Flame, prompt: 'I need some motivation. What progress have I made recently?' },
]

const personalityConfig = {
  coach: {
    emoji: '💪',
    label: 'Coach',
    tagline: 'Pushes you to excel',
    gradient: 'from-sky-500 to-blue-600',
    bgGlow: 'shadow-sky-500/25',
    hoverGlow: 'hover:shadow-sky-500/30',
  },
  mentor: {
    emoji: '🧭',
    label: 'Mentor',
    tagline: 'Guides your journey',
    gradient: 'from-sky-500 to-blue-600',
    bgGlow: 'shadow-sky-500/25',
    hoverGlow: 'hover:shadow-sky-500/30',
  },
  advisor: {
    emoji: '📊',
    label: 'Advisor',
    tagline: 'Data-driven insights',
    gradient: 'from-sky-500 to-blue-600',
    bgGlow: 'shadow-sky-500/25',
    hoverGlow: 'hover:shadow-sky-500/30',
  },
}

/* ═══════════════════════════════════════════════════════
   COMPANION CHATBOT COMPONENT
   ═══════════════════════════════════════════════════════ */

export function CompanionChatbot({
  userId,
  personality = 'coach',
  greeting,
  bottomOffset = 80,
  rightOffset = 24,
}: CompanionChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<CompanionChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasGreeted, setHasGreeted] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const pConfig = personalityConfig[personality]

  // Show greeting as first message when opened for the first time
  useEffect(() => {
    if (isOpen && !hasGreeted && messages.length === 0) {
      const greetingText = greeting || getDefaultGreeting(personality)
      setMessages([{
        id: 'companion-greeting',
        role: 'companion',
        content: greetingText,
        timestamp: Date.now(),
      }])
      setHasGreeted(true)
    }
  }, [isOpen, hasGreeted, messages.length, greeting, personality])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200)
      setUnreadCount(0)
    }
  }, [isOpen])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleSend = useCallback(async (messageText?: string) => {
    const text = messageText || input.trim()
    if (!text || isLoading) return

    const userMsg: CompanionChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/ai/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          userId,
          message: text,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const responseText = typeof data.message === 'string'
          ? data.message
          : data.message?.content || data.response || "I'd love to help! What would you like to focus on?"

        const companionMsg: CompanionChatMessage = {
          id: `companion-${Date.now()}`,
          role: 'companion',
          content: responseText,
          timestamp: Date.now(),
        }
        setMessages(prev => [...prev, companionMsg])

        // If chat is closed, increment unread
        if (!isOpen) {
          setUnreadCount(prev => prev + 1)
        }
      } else {
        setMessages(prev => [...prev, {
          id: `companion-${Date.now()}`,
          role: 'companion',
          content: "I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: Date.now(),
        }])
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `companion-${Date.now()}`,
        role: 'companion',
        content: "Connection issue — please try again.",
        timestamp: Date.now(),
      }])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, userId, isOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* ═══ FLOATING CHAT BUBBLE BUTTON ═══ */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="companion-fab"
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => setIsOpen(true)}
            className={cn(
              'fixed z-50 flex items-center gap-2.5',
              'px-4 py-3 rounded-2xl',
              'bg-gradient-to-r text-white',
              pConfig.gradient,
              'shadow-lg hover:shadow-xl',
              pConfig.bgGlow, pConfig.hoverGlow,
              'transition-all active:scale-95 group cursor-pointer',
            )}
            style={{ bottom: bottomOffset, right: rightOffset }}
            title="Open AI Learning Companion"
          >
            <div className="relative">
              <div className="flex size-8 items-center justify-center rounded-xl bg-white/20 shrink-0 group-hover:bg-white/30 transition-colors">
                <Bot className="size-4.5" />
              </div>
              {/* Online indicator */}
              <div className="absolute -top-0.5 -right-0.5 size-3 rounded-full bg-emerald-400 border-2 border-white dark:border-card animate-pulse" />
              {/* Unread badge */}
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold border-2 border-white dark:border-card"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.div>
              )}
            </div>
            <div className="text-left">
              <span className="text-[13px] font-semibold block leading-tight">
                Learning Companion
              </span>
              <span className="text-[9px] opacity-80 font-medium">
                {pConfig.emoji} {pConfig.label} · {pConfig.tagline}
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ═══ CHAT PANEL ═══ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="companion-chat-panel"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn(
              'fixed z-50 flex flex-col',
              'w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-6rem)]',
              'rounded-2xl overflow-hidden',
              'bg-card border border-border/40',
              'shadow-2xl shadow-sky-500/10',
            )}
            style={{ bottom: bottomOffset, right: rightOffset }}
          >
            {/* ── Header ── */}
            <div className="shrink-0 bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-indigo-500/10 border-b border-sky-500/15 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shrink-0">
                    <Bot className="size-4.5" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 border-2 border-card" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-[13px] font-bold text-foreground">Learning Companion</h3>
                    <Badge className="bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[8px] px-1.5 py-0 border-0">
                      {pConfig.emoji} {pConfig.label}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Knows your skills, progress & study plans</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    title="Minimize"
                  >
                    <Minimize2 className="size-3.5" />
                  </button>
                  <button
                    onClick={() => { setIsOpen(false); setMessages([]); setHasGreeted(false); }}
                    className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    title="Close"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* ── Messages ── */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-3"
            >
              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-500 mb-3">
                    <Brain className="size-7" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground mb-1">Your AI Learning Companion</h4>
                  <p className="text-[11px] text-muted-foreground max-w-[240px] leading-relaxed">
                    I know your mastery scores, skill gaps, study plans, and learning patterns. Ask me anything!
                  </p>
                </div>
              )}

              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    'flex',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-sky-500 text-white rounded-br-md shadow-sm'
                        : 'bg-muted/40 border border-border/30 text-foreground rounded-bl-md'
                    )}
                  >
                    {msg.role === 'companion' && (
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className="flex size-4 items-center justify-center rounded bg-sky-500/15 shrink-0">
                          <Bot className="size-2.5 text-sky-500" />
                        </div>
                        <span className="text-[9px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">Companion</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted/40 border border-border/30 rounded-2xl rounded-bl-md px-3.5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex size-4 items-center justify-center rounded bg-sky-500/15 shrink-0">
                        <Bot className="size-2.5 text-sky-500" />
                      </div>
                      <div className="flex gap-1">
                        <span className="size-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="size-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="size-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* ── Quick Prompts ── */}
            {messages.length <= 1 && !isLoading && (
              <div className="shrink-0 px-4 pb-2">
                <div className="grid grid-cols-2 gap-1.5">
                  {quickPrompts.map(qp => {
                    const Icon = qp.icon
                    return (
                      <button
                        key={qp.label}
                        onClick={() => handleSend(qp.prompt)}
                        className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-sky-500/15 bg-sky-500/5 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/25 transition-all text-left group"
                      >
                        <Icon className="size-3.5 shrink-0 text-sky-500 group-hover:text-sky-600 transition-colors" />
                        <span className="text-[10px] font-medium leading-tight">{qp.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Input ── */}
            <div className="shrink-0 border-t border-border/30 p-3">
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask your companion..."
                  disabled={isLoading}
                  className="h-9 text-[12px] border-sky-500/15 focus:ring-sky-500/30 focus:border-sky-500/30 bg-background"
                />
                <Button
                  size="sm"
                  disabled={!input.trim() || isLoading}
                  onClick={() => handleSend()}
                  className="h-9 px-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white shrink-0 rounded-lg"
                >
                  {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                </Button>
              </div>
              <div className="flex items-center justify-between mt-1.5 px-0.5">
                <span className="text-[9px] text-muted-foreground/50">Powered by your learning data</span>
                <button
                  onClick={() => { setMessages([]); setHasGreeted(false); }}
                  className="text-[9px] text-muted-foreground/50 hover:text-muted-foreground transition-colors flex items-center gap-0.5"
                >
                  <Zap className="size-2.5" />
                  New chat
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/* ═══════════════════════════════════════════════════════
   HELPER: Default greeting based on personality
   ═══════════════════════════════════════════════════════ */

function getDefaultGreeting(personality: 'coach' | 'mentor' | 'advisor'): string {
  const hour = new Date().getHours()
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const greetings: Record<string, string> = {
    coach: `${timeGreeting}! 💪 I've been analyzing your learning patterns. I can see your progress across courses and skills. Ready to push your limits today? Tell me what you want to work on, or I can suggest the best focus areas based on your current mastery.`,
    mentor: `${timeGreeting}! 🧭 I'm here to guide your learning journey. I can see your skill progress, study plans, and areas that need attention. What would you like to explore? I can help you chart the best path forward.`,
    advisor: `${timeGreeting}! 📊 I've reviewed your learning analytics. I have insights on your mastery trends, skill gaps, and study consistency. Ask me anything about your progress, or I can provide a data-driven recommendation for what to focus on next.`,
  }

  return greetings[personality]
}
