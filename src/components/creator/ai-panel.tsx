'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Send, X, Layers,
  FileText, HelpCircle, Image, Search, ClipboardList,
  Bot, Zap, Lightbulb, Loader2, User, RotateCcw
} from 'lucide-react'
import { ShijlAIText } from '@/components/ui/brand-text'
import { AiMessageRenderer } from '@/components/ai/ai-message-renderer'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { AIMessage } from './types'
import { SPRING, STEPS } from './constants'

// ─── Props ───

export interface AIPanelProps {
  currentStep: number
  onQuickAction: (action: string) => void
  onSendMessage: (message: string) => void
  messages: AIMessage[]
  isOpen: boolean
  onToggle: () => void
}

// ─── Quick Actions Config ───

const QUICK_ACTIONS = [
  { id: 'generate-curriculum', label: 'Generate curriculum', icon: Layers, color: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'write-description', label: 'Write description', icon: FileText, color: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'create-quiz', label: 'Create quiz', icon: HelpCircle, color: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'suggest-thumbnail', label: 'Suggest thumbnail', icon: Image, color: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'optimize-seo', label: 'Optimize SEO', icon: Search, color: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'generate-rubric', label: 'Generate rubric', icon: ClipboardList, color: 'text-emerald-600 dark:text-emerald-400' },
]

// ─── Context Suggestions per Step ───

const STEP_SUGGESTIONS: Record<number, string[]> = {
  0: [
    'Need help writing a catchy course title?',
    'I can generate a course description for you!',
    'Want me to suggest topic tags based on your category?',
  ],
  1: [
    'Let me help structure your curriculum!',
    'I can generate a full module outline from a topic.',
    'Want suggestions for lesson types per module?',
  ],
  2: [
    'Need help writing lesson content?',
    'I can generate quiz questions from your lesson text.',
    'Want me to create an assignment rubric?',
  ],
  3: [
    'Not sure how to price your course? I can help!',
    'I can suggest discount code strategies.',
    'Want me to recommend enrollment settings?',
  ],
  4: [
    'Let me optimize your SEO title and meta description!',
    'I can suggest search tags for better discoverability.',
    'Need help writing learning outcomes?',
  ],
  5: [
    'Almost there! Let me run a quality check.',
    'I can help you polish your course before publishing.',
    'Want a final review of your course setup?',
  ],
}

// ─── Panel Width ───

const PANEL_WIDTH = 380

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-3 px-1 py-2"
    >
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white mt-0.5">
        <Bot className="size-3.5" />
      </div>
      <div className="flex items-center gap-1.5 pt-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="size-1.5 rounded-full bg-foreground/40"
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
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

// ─── Main Component ───

export function AIPanel({
  currentStep,
  onQuickAction,
  onSendMessage,
  messages,
  isOpen,
  onToggle,
}: AIPanelProps) {
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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
  }, [messages, isSending, scrollToBottom])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // Contextual suggestions based on current step
  const suggestions = useMemo(() => STEP_SUGGESTIONS[currentStep] || STEP_SUGGESTIONS[0], [currentStep])
  const currentStepInfo = useMemo(() => STEPS[currentStep] || STEPS[0], [currentStep])

  const handleSend = () => {
    if (!input.trim() || isSending) return
    setIsSending(true)
    onSendMessage(input.trim())
    setInput('')
    // Simulate AI response delay
    setTimeout(() => setIsSending(false), 800)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleQuickAction = (actionId: string) => {
    onQuickAction(actionId)
    toast.success('AI action started!', {
      description: QUICK_ACTIONS.find(a => a.id === actionId)?.label,
    })
  }

  const regenerateResponse = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUserMsg) {
      onSendMessage(`Please regenerate your previous response regarding: ${lastUserMsg.content}`)
    }
  }

  const showWelcome = messages.length === 0

  return (
    <>
      {/* ─── Toggle Button (when panel is closed) ─── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={SPRING}
            onClick={onToggle}
            className="fixed right-4 bottom-6 z-50 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white ios-shadow-lg hover:from-emerald-600 hover:to-teal-700 transition-all ios-press"
            aria-label="Open AI Assistant"
          >
            <Sparkles className="size-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── Slide-in Panel ─── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: PANEL_WIDTH + 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: PANEL_WIDTH + 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col ios-glass-thick border-l border-border/50 bg-background shadow-2xl"
            style={{ width: PANEL_WIDTH }}
          >
            {/* ─── Header ─── */}
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-background/80 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                  <Bot className="size-5" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold flex items-center gap-1">
                    ✦ <ShijlAIText /> Assistant
                  </h3>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    Course Co-creator
                  </p>
                </div>
              </div>
              <button
                onClick={onToggle}
                className="flex size-8 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close AI Assistant"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* ─── Current Step Context ─── */}
            <div className="px-4 py-2 bg-emerald-500/5 border-b border-border/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] h-5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                    Step {currentStep + 1}
                  </Badge>
                  <span className="text-[11px] font-medium text-muted-foreground truncate">
                    {currentStepInfo.title}
                  </span>
                </div>
              </div>
            </div>

            {/* ─── Scrollable Content ─── */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
              {showWelcome ? (
                <div className="flex flex-col h-full px-5 py-8">
                  {/* AI Logo & Greeting */}
                  <div className="flex flex-col items-center text-center mb-8">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg mb-4"
                    >
                      <Bot className="size-7" />
                    </motion.div>
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-lg font-bold text-foreground mb-1.5"
                    >
                      Course Co-creator
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      className="text-muted-foreground text-[13px]"
                    >
                      I can help you build your course faster. Let's get started!
                    </motion.p>
                  </div>

                  {/* Contextual Suggestions */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-2 mb-6"
                  >
                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 ml-1 mb-2">
                      <Lightbulb className="size-3" />
                      Suggestions for this step
                    </h4>
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInput(suggestion)
                          inputRef.current?.focus()
                        }}
                        className="w-full text-left rounded-xl p-3 bg-emerald-500/5 border border-emerald-500/10 text-[12px] text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors ios-press"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </motion.div>

                  {/* Quick Actions Grid */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-2 mt-auto"
                  >
                    <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 ml-1 mb-2">
                      <Zap className="size-3" />
                      Quick Tools
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {QUICK_ACTIONS.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => handleQuickAction(action.id)}
                          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border/50 bg-card p-3 text-center transition-all hover:bg-emerald-500/5 hover:border-emerald-500/30 ios-press"
                        >
                          <action.icon className={cn("size-4 opacity-80", action.color)} />
                          <span className="text-[11px] font-medium leading-tight">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {/* Chat Messages */}
                  {messages.map((msg) => {
                    const isUser = msg.role === 'user'
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className={cn(
                          'flex gap-3',
                          isUser ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {/* AI Avatar */}
                        {!isUser && (
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white mt-0.5">
                            <Bot className="size-3.5" />
                          </div>
                        )}

                        {/* Message Content */}
                        <div className={cn('max-w-[85%] min-w-0', isUser ? 'order-first' : '')}>
                          {isUser ? (
                            <div className="rounded-2xl rounded-br-md text-white px-3.5 py-2 shadow-sm bg-emerald-600 dark:bg-emerald-700">
                              <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          ) : (
                            <div className="rounded-2xl rounded-bl-md bg-muted/40 border border-border/40 px-3.5 py-2">
                              <AiMessageRenderer content={msg.content} mode="tutor" />
                            </div>
                          )}
                        </div>

                        {/* User Avatar */}
                        {isUser && (
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-400 to-slate-500 text-white mt-0.5">
                            <User className="size-3.5" />
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                  
                  {isSending && <TypingIndicator />}
                  
                  <div className="h-2" />
                </div>
              )}
            </div>

            {/* ─── Inline Quick Actions (when chatting) ─── */}
            <AnimatePresence>
              {!showWelcome && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && !isSending && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="border-t border-border/20 px-3 py-2 bg-muted/10"
                >
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                    {QUICK_ACTIONS.slice(0, 3).map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleQuickAction(action.id)}
                        className="flex items-center gap-1.5 shrink-0 rounded-full border border-border/50 bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-all hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30"
                      >
                        <action.icon className="size-3" />
                        {action.label}
                      </button>
                    ))}
                    <button
                      onClick={regenerateResponse}
                      className="flex items-center gap-1.5 shrink-0 rounded-full border border-border/50 bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-all hover:bg-muted"
                    >
                      <RotateCcw className="size-3" />
                      Regenerate
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ─── Chat Input ─── */}
            <div className="p-3 border-t border-border/30 bg-background">
              <div className={cn(
                'relative flex items-end rounded-2xl border bg-card shadow-sm transition-all',
                'border-border/50 focus-within:border-emerald-500/50 focus-within:shadow-emerald-500/5'
              )}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSending}
                  rows={1}
                  className="flex-1 resize-none bg-transparent px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none disabled:opacity-50 max-h-24 overflow-y-auto scrollbar-thin min-h-[44px]"
                  placeholder="Ask ShijlAI Assistant..."
                />
                <div className="flex items-center pr-1.5 pb-1.5">
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!input.trim() || isSending}
                    className={cn(
                      'flex size-8 items-center justify-center rounded-xl transition-all',
                      input.trim() && !isSending
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm hover:opacity-90 ios-press'
                        : 'text-muted-foreground/30 bg-transparent'
                    )}
                  >
                    {isSending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Send className="size-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default AIPanel
