'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Send, X, ChevronLeft, ChevronRight, Layers,
  FileText, HelpCircle, Image, Search, ClipboardList,
  Bot, MessageSquare, Zap, Lightbulb, Loader2,
} from 'lucide-react'
import { ShijlAIText } from '@/components/ui/brand-text'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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
  { id: 'generate-curriculum', label: 'Generate curriculum', icon: Layers, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
  { id: 'write-description', label: 'Write description', icon: FileText, color: 'bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400' },
  { id: 'create-quiz', label: 'Create quiz from video', icon: HelpCircle, color: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' },
  { id: 'suggest-thumbnail', label: 'Suggest thumbnail', icon: Image, color: 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' },
  { id: 'optimize-seo', label: 'Optimize SEO title', icon: Search, color: 'bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400' },
  { id: 'generate-rubric', label: 'Generate rubric', icon: ClipboardList, color: 'bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400' },
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

const PANEL_WIDTH = 340

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
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

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

  const handleQuickAction = (actionId: string) => {
    onQuickAction(actionId)
    toast.success('AI action started!', {
      description: QUICK_ACTIONS.find(a => a.id === actionId)?.label,
    })
  }

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
            className="fixed right-4 bottom-6 z-50 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white ios-shadow-lg hover:from-emerald-700 hover:to-teal-700 transition-all ios-press"
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
            className="fixed right-0 top-0 bottom-0 z-50 flex flex-col ios-glass-thick border-l border-border/50"
            style={{ width: PANEL_WIDTH }}
          >
            {/* ─── Header ─── */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                  <Bot className="size-5" />
                </div>
                <div>
                  <h3 className="text-[14px] font-bold flex items-center gap-1">
                    ✦ <ShijlAIText /> Assistant
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Your AI course co-creator</p>
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
            <div className="px-4 py-2.5 bg-muted/30 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] h-5 rounded-lg bg-primary/5 text-primary border-primary/20">
                  Step {currentStep + 1}
                </Badge>
                <span className="text-[11px] font-medium text-muted-foreground truncate">
                  {currentStepInfo.title}
                </span>
              </div>
            </div>

            {/* ─── Scrollable Content ─── */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-5">
                {/* ─── Quick Actions ─── */}
                <div className="space-y-2.5">
                  <h4 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="size-3" />
                    Quick Actions
                  </h4>
                  <div className="space-y-1.5">
                    {QUICK_ACTIONS.map((action) => (
                      <motion.button
                        key={action.id}
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleQuickAction(action.id)}
                        className={cn(
                          'w-full flex items-center gap-2.5 rounded-xl p-2.5 text-left transition-all',
                          'hover:bg-muted/50 ios-press border border-transparent hover:border-border'
                        )}
                      >
                        <div className={cn('flex size-7 items-center justify-center rounded-lg shrink-0', action.color)}>
                          <action.icon className="size-3.5" />
                        </div>
                        <span className="text-[12px] font-medium">{action.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* ─── AI Suggestions ─── */}
                <div className="space-y-2.5">
                  <h4 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="size-3" />
                    Suggestions
                  </h4>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={SPRING}
                      className="space-y-2"
                    >
                      {suggestions.map((suggestion, idx) => (
                        <motion.button
                          key={idx}
                          type="button"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.08, ...SPRING }}
                          onClick={() => {
                            setInput(suggestion)
                            inputRef.current?.focus()
                          }}
                          className="w-full text-left rounded-xl p-2.5 bg-primary/5 border border-primary/10 text-[12px] text-primary hover:bg-primary/10 transition-colors ios-press"
                        >
                          {suggestion}
                        </motion.button>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* ─── Chat Messages ─── */}
                {messages.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2.5">
                      <h4 className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="size-3" />
                        Conversation
                      </h4>
                      <div ref={scrollRef} className="space-y-2 max-h-64 overflow-y-auto">
                        {messages.map((msg) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={SPRING}
                            className={cn(
                              'rounded-2xl p-2.5 text-[12px] leading-relaxed',
                              msg.role === 'user'
                                ? 'bg-primary text-primary-foreground ml-6'
                                : 'bg-muted mr-6'
                            )}
                          >
                            {msg.content}
                          </motion.div>
                        ))}
                        {isSending && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2 text-[12px] text-muted-foreground ml-2"
                          >
                            <Loader2 className="size-3 animate-spin" />
                            Thinking...
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* ─── Empty State ─── */}
                {messages.length === 0 && (
                  <div className="text-center py-4">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 mx-auto mb-2">
                      <Sparkles className="size-6 text-primary" />
                    </div>
                    <p className="text-[13px] font-medium text-foreground">How can I help?</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Ask me anything about creating your course
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* ─── Chat Input ─── */}
            <div className="p-3 border-t border-border/50 bg-background/80">
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="h-10 rounded-2xl text-[13px] flex-1 bg-muted/30"
                  placeholder="Ask the AI assistant..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  className="rounded-2xl size-10 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white ios-press shrink-0"
                  onClick={handleSend}
                  disabled={!input.trim() || isSending}
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default AIPanel
