'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  Send,
  Trash2,
  Sparkles,
  BookOpen,
  ChevronDown,
  Loader2,
  X,
  Mic,
  MicOff,
  MessageSquare,
  Plus,
  Clock,
  Lightbulb,
  TestTube2,
  Languages,
  ListPlus,
  Globe,
  Check,
  Download,
  User,
  GraduationCap,
  Atom,
  FlaskConical,
  Dna,
  Code2,
  BarChart3,
  Brain,
  Palette,
  PanelLeftClose,
  PanelLeft,
  Pencil,
  CheckCheck,
  Archive,
  MoreHorizontal,
  RotateCcw,
  Settings2,
  Hash,
  FolderOpen,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { ShijlAIText } from '@/components/ui/brand-text'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { AiMessageRenderer } from '@/components/ai/ai-message-renderer'

/* ─── Types ─── */
interface ChatMsg {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  language?: string
}

interface PastSession {
  id: string
  title: string
  context: string | null
  language: string
  createdAt: string
  updatedAt: string
  lastMessage: string | null
}

/* ─── Subject Options ─── */
const SUBJECTS = [
  { value: 'general', label: 'General', icon: Sparkles, color: 'text-violet-500' },
  { value: 'mathematics', label: 'Mathematics', icon: BarChart3, color: 'text-blue-500' },
  { value: 'physics', label: 'Physics', icon: Atom, color: 'text-orange-500' },
  { value: 'chemistry', label: 'Chemistry', icon: FlaskConical, color: 'text-green-500' },
  { value: 'biology', label: 'Biology', icon: Dna, color: 'text-pink-500' },
  { value: 'computer-science', label: 'Computer Science', icon: Code2, color: 'text-cyan-500' },
  { value: 'english', label: 'English', icon: GraduationCap, color: 'text-amber-500' },
  { value: 'web-development', label: 'Web Development', icon: Code2, color: 'text-emerald-500' },
  { value: 'data-science', label: 'Data Science & AI', icon: Brain, color: 'text-purple-500' },
  { value: 'test-prep', label: 'Test Prep', icon: GraduationCap, color: 'text-red-500' },
]

const QUICK_ACTIONS = [
  { id: 'explain_simpler', label: 'Explain simpler', icon: <Lightbulb className="size-3.5" /> },
  { id: 'more_examples', label: 'More examples', icon: <ListPlus className="size-3.5" /> },
  { id: 'test_me', label: 'Test me', icon: <TestTube2 className="size-3.5" /> },
  { id: 'simplify', label: 'Simplify answer', icon: <Languages className="size-3.5" /> },
]

const SUGGESTED_QUESTIONS = [
  { label: 'Explain closures in JavaScript', icon: <Code2 className="size-4" />, subject: 'web-development' },
  { label: 'Help me with quadratic equations', icon: <BarChart3 className="size-4" />, subject: 'mathematics' },
  { label: 'How does photosynthesis work?', icon: <FlaskConical className="size-4" />, subject: 'biology' },
  { label: "What is Newton's Second Law?", icon: <Atom className="size-4" />, subject: 'physics' },
]

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🌐' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
]

/* ─── Helpers ─── */
function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' })
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function groupSessionsByDate(sessions: PastSession[]): { label: string; sessions: PastSession[] }[] {
  const groups: Record<string, PastSession[]> = {}
  for (const session of sessions) {
    const label = formatSessionDate(session.updatedAt)
    if (!groups[label]) groups[label] = []
    groups[label].push(session)
  }
  return Object.entries(groups).map(([label, sessions]) => ({ label, sessions }))
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
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
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
   MAIN TUTOR VIEW — ChatGPT-style Layout
   ═══════════════════════════════════════════════════════════ */
export function TutorView() {
  const { currentUser, enrollments, selectedCourse } = useAppStore()
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [context, setContext] = useState<string | null>(null)
  const [language, setLanguage] = useState('en')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [pastSessions, setPastSessions] = useState<PastSession[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState('general')
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Set context from selected course
  useEffect(() => {
    if (selectedCourse && !context) {
      setContext(selectedCourse.title)
      setSelectedCourseId(selectedCourse.id)
    }
  }, [selectedCourse, context])

  // Load past sessions on mount
  useEffect(() => {
    loadPastSessions()
  }, [])

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

  // ─── Data Loading ───
  const loadPastSessions = async () => {
    try {
      const res = await fetch(`/api/ai/tutor/sessions?userId=${currentUser?.id || 'demo-user-1'}`)
      if (res.ok) {
        const data = await res.json()
        setPastSessions(data.sessions || [])
      }
    } catch {
      // silently fail
    }
  }

  const loadSession = async (sessId: string) => {
    try {
      const res = await fetch(`/api/ai/tutor/sessions/${sessId}`)
      if (res.ok) {
        const data = await res.json()
        const session = data.session
        setSessionId(session.id)
        setContext(session.context)
        setLanguage(session.language || 'en')
        setMessages(
          session.messages.map((m: { id: string; role: string; content: string; language: string; createdAt: string }) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: new Date(m.createdAt),
            language: m.language,
          }))
        )
      }
    } catch {
      toast.error('Failed to load session')
    }
  }

  const startNewChat = () => {
    setMessages([])
    setSessionId(null)
    inputRef.current?.focus()
  }

  // ─── Send Message ───
  const sendMessage = async (text: string, quickAction?: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: ChatMsg = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
      language,
    }

    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setIsLoading(true)

    try {
      // Build the messages array for the AI API
      const chatMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: text.trim() },
      ]

      // If quickAction, append a note
      if (quickAction) {
        const actionMap: Record<string, string> = {
          explain_simpler: ' [Please explain the previous topic in simpler terms]',
          more_examples: ' [Please give me more examples of the previous topic]',
          test_me: ' [Please test me on the previous topic]',
          simplify: ' [Please rephrase the previous explanation in simpler terms]',
        }
        chatMessages[chatMessages.length - 1].content += actionMap[quickAction] || ''
      }

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: chatMessages,
          subject: selectedSubject !== 'general' ? selectedSubject : undefined,
          course: selectedCourseInfo ? {
            id: selectedCourseInfo.id,
            title: selectedCourseInfo.title,
            category: selectedCourseInfo.category,
            level: selectedCourseInfo.level,
          } : undefined,
          context: context || undefined,
          language,
        }),
      })

      if (!res.ok) throw new Error('Failed to get response')

      const data = await res.json()

      const aiMsg: ChatMsg = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: data.message || "I'm here to help! Could you rephrase your question?",
        timestamp: new Date(),
        language,
      }

      setMessages((prev) => [...prev, aiMsg])

      // Save to database via the tutor API for session persistence
      try {
        const tutorRes = await fetch('/api/ai/tutor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser?.id || 'demo-user-1',
            message: text.trim(),
            context: context || undefined,
            sessionId: sessionId || undefined,
            language,
            quickAction: quickAction || undefined,
          }),
        })
        if (tutorRes.ok) {
          const tutorData = await tutorRes.json()
          // Capture the sessionId from the response
          if (tutorData.sessionId && !sessionId) {
            setSessionId(tutorData.sessionId)
          }
        }
        loadPastSessions()
      } catch {
        // Background save - don't block on this
      }
    } catch {
      const errorMsg: ChatMsg = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        language,
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

  const handleQuickAction = (actionId: string) => {
    const lastAiMessage = [...messages].reverse().find((m) => m.role === 'assistant')
    if (lastAiMessage) {
      sendMessage(`Continue from where we left off`, actionId)
    } else {
      sendMessage('Help me get started!', actionId)
    }
  }

  const clearChat = () => {
    setMessages([])
    setSessionId(null)
    toast.success('Chat cleared')
  }

  const deleteSession = async (sessId: string) => {
    try {
      const res = await fetch(`/api/ai/tutor/sessions/${sessId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Session deleted')
        loadPastSessions()
        if (sessionId === sessId) {
          setMessages([])
          setSessionId(null)
        }
      }
    } catch {
      toast.error('Failed to delete session')
    }
    setDeleteConfirmId(null)
  }

  const archiveSession = async (sessId: string) => {
    try {
      const res = await fetch(`/api/ai/tutor/sessions/${sessId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: true }),
      })
      if (res.ok) {
        toast.success('Session archived')
        loadPastSessions()
        if (sessionId === sessId) {
          setMessages([])
          setSessionId(null)
        }
      }
    } catch {
      toast.error('Failed to archive session')
    }
  }

  const exportChat = () => {
    if (messages.length === 0) {
      toast.error('No messages to export')
      return
    }

    const subjectInfo = SUBJECTS.find(s => s.value === selectedSubject)
    const courseInfo = selectedCourseInfo
    const header = `ShijlAI Academy - Ask ShijlAI Chat Export
Subject: ${subjectInfo?.label || 'General'}${courseInfo ? `\nCourse: ${courseInfo.title} (${courseInfo.category} · ${courseInfo.level || 'All levels'})` : ''}
Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
${'═'.repeat(60)}

`
    const chatContent = messages
      .map((msg) => {
        const role = msg.role === 'user' ? '👤 You' : '🤖 Ask ShijlAI'
        const time = formatTimestamp(msg.timestamp)
        return `[${time}] ${role}:\n${msg.content}\n`
      })
      .join('\n' + '─'.repeat(60) + '\n\n')

    const footer = `\n\n${'═'.repeat(60)}\nExported from ShijlAI Academy`

    const fullContent = header + chatContent + footer

    const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shijlai-chat-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Chat exported successfully!')
  }

  const toggleVoiceInput = () => {
    if (isRecording) {
      setIsRecording(false)
      toast.info('Voice input stopped')
    } else {
      setIsRecording(true)
      toast.info('Listening... (demo mode)')
      setTimeout(() => {
        setIsRecording(false)
        setInputValue('Can you explain this concept in simpler terms?')
        toast.success('Voice captured!')
      }, 2000)
    }
  }

  const regenerateResponse = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUserMsg) {
      // Remove the last AI response
      setMessages(prev => prev.slice(0, -1))
      sendMessage(lastUserMsg.content)
    }
  }

  const enrolledCourses = useMemo(() =>
    enrollments
      .filter((e) => e.course)
      .map((e) => ({ id: e.courseId, title: e.course!.title, category: e.course!.category || '', level: e.course!.level || '' })),
    [enrollments]
  )

  const selectedCourseInfo = useMemo(() =>
    enrolledCourses.find(c => c.id === selectedCourseId) || null,
    [enrolledCourses, selectedCourseId]
  )

  // Update context when course dropdown changes
  useEffect(() => {
    if (selectedCourseId) {
      const course = enrolledCourses.find(c => c.id === selectedCourseId)
      if (course) setContext(course.title)
    } else {
      setContext(null)
    }
  }, [selectedCourseId, enrolledCourses])

  const showWelcome = messages.length === 0
  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0]
  const currentSubject = SUBJECTS.find((s) => s.value === selectedSubject)!
  const sessionGroups = useMemo(() => groupSessionsByDate(pastSessions), [pastSessions])

  /* ═══ RENDER ═══ */
  return (
    <div className="flex h-full rounded-2xl border border-border/40 overflow-hidden bg-background">

      {/* ═══ LEFT SIDEBAR — Chat History (ChatGPT-style) ═══ */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="flex flex-col border-r border-border/40 bg-muted/30 shrink-0 overflow-hidden"
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-border/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={startNewChat}
                className="gap-2 text-[13px] font-medium rounded-xl px-3 flex-1 justify-start hover:bg-emerald-500/10 hover:text-emerald-600"
              >
                <Plus className="size-4" />
                New chat
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => setSidebarOpen(false)}
              >
                <PanelLeftClose className="size-4" />
              </Button>
            </div>

            {/* Sessions List */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-2">
                {sessionGroups.length > 0 ? (
                  sessionGroups.map((group) => (
                    <div key={group.label} className="mb-3">
                      <p className="px-2 py-1 text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                        {group.label}
                      </p>
                      <div className="space-y-0.5">
                        {group.sessions.map((session) => (
                          <div
                            key={session.id}
                            className={cn(
                              'group/item relative flex items-center gap-2 rounded-xl px-2.5 py-2 cursor-pointer transition-all',
                              sessionId === session.id
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                : 'hover:bg-muted text-foreground'
                            )}
                            onClick={() => loadSession(session.id)}
                          >
                            <MessageSquare className="size-3.5 shrink-0 text-muted-foreground/60" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium truncate leading-tight">{session.title}</p>
                              {session.context && (
                                <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5">{session.context}</p>
                              )}
                            </div>
                            {/* Actions on hover */}
                            <div className="shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="size-6 rounded-lg text-muted-foreground hover:text-foreground">
                                    <MoreHorizontal className="size-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl w-44">
                                  <DropdownMenuItem className="gap-2 text-[13px] rounded-lg" onClick={(e) => { e.stopPropagation(); archiveSession(session.id) }}>
                                    <Archive className="size-3.5" /> Archive
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="gap-2 text-[13px] rounded-lg text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); deleteSession(session.id) }}>
                                    <Trash2 className="size-3.5" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 px-4">
                    <MessageSquare className="size-8 text-muted-foreground/20" />
                    <p className="text-[12px] text-muted-foreground text-center">No conversations yet</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Sidebar Footer — Subject quick switch */}
            <div className="border-t border-border/30 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="size-3.5 text-muted-foreground/60" />
                <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">Subject</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {SUBJECTS.filter(s => s.value !== 'general').slice(0, 6).map((subject) => (
                  <button
                    key={subject.value}
                    onClick={() => setSelectedSubject(subject.value)}
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-all',
                      selectedSubject === subject.value
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                        : 'bg-muted/60 text-muted-foreground border border-transparent hover:bg-accent/50'
                    )}
                  >
                    <subject.icon className={`size-2.5 ${subject.color}`} />
                    {subject.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ MAIN CHAT AREA ═══ */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* ─── Top Bar (minimal, ChatGPT-style) ─── */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            {/* Toggle sidebar */}
            {!sidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={() => setSidebarOpen(true)}
              >
                <PanelLeft className="size-4" />
              </Button>
            )}

            {/* Subject selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-[14px] font-semibold text-foreground hover:bg-muted transition-colors">
                  <div className="flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <Sparkles className="size-3" />
                  </div>
                  <span>{currentSubject.label}</span>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="rounded-2xl w-56 shadow-lg">
                {SUBJECTS.map((subject) => (
                  <DropdownMenuItem
                    key={subject.value}
                    onClick={() => setSelectedSubject(subject.value)}
                    className={cn(
                      'gap-2.5 rounded-xl text-[13px]',
                      selectedSubject === subject.value && 'bg-emerald-500/10 text-emerald-600'
                    )}
                  >
                    <subject.icon className={`size-4 ${subject.color}`} />
                    <span className="flex-1">{subject.label}</span>
                    {selectedSubject === subject.value && <Check className="size-3.5 text-emerald-500" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Course selector — prominent beside subject */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-1.5 text-[13px] font-medium transition-colors",
                  selectedCourseInfo
                    ? "text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}>
                  <BookOpen className="size-3.5" />
                  <span className="max-w-[140px] truncate">{selectedCourseInfo ? selectedCourseInfo.title : 'Select Course'}</span>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="rounded-2xl w-72 shadow-lg">
                <div className="px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Related Courses
                </div>
                <DropdownMenuItem
                  onClick={() => { setSelectedCourseId(null); setContext(null); }}
                  className="gap-2 rounded-xl"
                >
                  <Hash className="size-3.5 text-muted-foreground" />
                  <span className="text-[13px]">No course context</span>
                  {!selectedCourseId && <Check className="size-3.5 ml-auto text-emerald-500" />}
                </DropdownMenuItem>
                <Separator className="my-1" />
                {enrolledCourses.length > 0 ? (
                  enrolledCourses.map((course) => (
                    <DropdownMenuItem
                      key={course.id}
                      onClick={() => setSelectedCourseId(course.id)}
                      className={cn(
                        "gap-2.5 rounded-xl",
                        selectedCourseId === course.id && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      )}
                    >
                      <BookOpen className="size-3.5 text-emerald-500" />
                      <div className="flex-1 min-w-0">
                        <span className="truncate text-[13px] block">{course.title}</span>
                        {course.category && (
                          <span className="text-[10px] text-muted-foreground">{course.category} · {course.level || 'All levels'}</span>
                        )}
                      </div>
                      {selectedCourseId === course.id && <Check className="size-3.5 text-emerald-500 shrink-0" />}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-3 py-4 text-center text-[12px] text-muted-foreground">
                    <FolderOpen className="size-5 mx-auto mb-1 text-muted-foreground/40" />
                    No enrolled courses yet
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Language indicator */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
              className="flex items-center gap-1 rounded-full bg-muted/50 border border-border/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Globe className="size-3" />
              {currentLang.flag}
            </button>
          </div>

          <div className="flex items-center gap-1">
            {/* Settings — Language & Quick Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground hover:text-foreground">
                  <Settings2 className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl w-56 shadow-lg">
                <div className="px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Language
                </div>
                {LANGUAGES.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className="gap-2 rounded-xl"
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                    {language === lang.code && <Check className="size-3.5 ml-auto text-emerald-500" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export */}
            <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground hover:text-foreground" onClick={exportChat}>
              <Download className="size-4" />
            </Button>

            {/* Clear/Delete chat */}
            {messages.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl">
                  <DialogHeader>
                    <DialogTitle>Clear Chat?</DialogTitle>
                  </DialogHeader>
                  <p className="text-[14px] text-muted-foreground">
                    This will start a fresh conversation. Your past sessions are saved separately.
                  </p>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" className="rounded-full">Cancel</Button>
                    <Button variant="destructive" onClick={clearChat} className="rounded-full">Clear Chat</Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* ─── Chat Messages / Welcome ─── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
          {showWelcome ? (
            /* ─── Welcome Screen (ChatGPT-style centered) ─── */
            <div className="flex flex-col items-center justify-center min-h-full px-4 py-8">
              <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8">
                {/* AI Logo */}
                <div className="relative">
                  <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
                    <Sparkles className="size-8" />
                  </div>
                </div>

                {/* Greeting */}
                <div className="text-center max-w-md">
                  <h2 className="text-[24px] font-bold text-foreground">
                    {`Hello, ${currentUser?.name?.split(' ')[0] || 'Student'}! 👋`}
                  </h2>
                  <p className="mt-2 text-[15px] text-muted-foreground leading-relaxed">
                    {"I'm your AI assistant. Ask me anything about your courses and I'll guide you step by step."}
                  </p>
                </div>

                {/* Suggested Questions Grid */}
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTED_QUESTIONS.map((question, i) => (
                    <motion.button
                      key={question.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedSubject(question.subject)
                        sendMessage(question.label)
                      }}
                      className="flex items-center gap-3 rounded-2xl border border-border/40 bg-card px-4 py-3.5 text-left transition-all hover:border-emerald-500/30 hover:shadow-sm hover:bg-emerald-500/5 group"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground group-hover:bg-emerald-500/10 group-hover:text-emerald-600 transition-colors">
                        {question.icon}
                      </span>
                      <span className="text-[13px] font-medium text-foreground">{question.label}</span>
                    </motion.button>
                  ))}
                  {/* Dynamic course-based suggestions */}
                  {enrolledCourses.slice(0, 2).map((course, i) => (
                    <motion.button
                      key={course.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (SUGGESTED_QUESTIONS.length + i) * 0.06 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedCourseId(course.id)
                        sendMessage(`Help me study ${course.title}`)
                      }}
                      className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3.5 text-left transition-all hover:border-emerald-500/40 hover:shadow-sm hover:bg-emerald-500/10 group"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/20 transition-colors">
                        <BookOpen className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <span className="text-[13px] font-medium text-foreground block truncate">{course.title}</span>
                        <span className="text-[11px] text-muted-foreground">Ask about this course</span>
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Capabilities */}
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {[
                    { label: 'Explain concepts', icon: <Lightbulb className="size-3" /> },
                    { label: 'Code help', icon: <Code2 className="size-3" /> },
                    { label: 'Quiz me', icon: <TestTube2 className="size-3" /> },
                    { label: 'Multilingual', icon: <Languages className="size-3" /> },
                  ].map((cap) => (
                    <span key={cap.label} className="flex items-center gap-1.5 rounded-full bg-muted/60 border border-border/30 px-3 py-1 text-[11px] text-muted-foreground">
                      {cap.icon}
                      {cap.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ─── Messages (ChatGPT-style centered) ─── */
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
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white mt-0.5">
                          <Bot className="size-4" />
                        </div>
                      )}

                      {/* Message content */}
                      <div className={cn('max-w-[85%] min-w-0', isUser ? 'order-first' : '')}>
                        {isUser ? (
                          <div className="rounded-2xl rounded-br-md bg-emerald-600 dark:bg-emerald-700 text-white px-4 py-2.5 shadow-sm">
                            <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        ) : (
                          <AiMessageRenderer content={msg.content} mode="tutor" />
                        )}
                      </div>

                      {/* User Avatar */}
                      {isUser && (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-400 to-slate-500 text-white mt-0.5">
                          <User className="size-4" />
                        </div>
                      )}
                    </motion.div>
                  )
                })}

                {/* Typing indicator */}
                {isLoading && <TypingIndicator />}

                {/* Bottom spacer for scroll */}
                <div className="h-4" />
              </div>
            </div>
          )}
        </div>

        {/* ─── Quick Actions (after AI response) ─── */}
        <AnimatePresence>
          {!showWelcome && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="border-t border-border/20 px-4 py-2"
            >
              <div className="max-w-3xl mx-auto flex flex-wrap gap-1.5">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action.id)}
                    className="flex items-center gap-1.5 rounded-full border border-border/50 bg-card px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-all hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30"
                  >
                    {action.icon}
                    {action.label}
                  </button>
                ))}
                <button
                  onClick={regenerateResponse}
                  className="flex items-center gap-1.5 rounded-full border border-border/50 bg-card px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-all hover:bg-muted"
                >
                  <RotateCcw className="size-3.5" />
                  Regenerate
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Input Area (ChatGPT-style, centered) ─── */}
        <div className="border-t border-border/30 px-4 py-3 bg-background">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="relative flex items-end rounded-2xl border border-border/50 bg-card shadow-sm focus-within:border-emerald-500/30 focus-within:shadow-emerald-500/5 focus-within:shadow-md transition-all">
              {/* Text input */}
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Ask ShijlAI..."
                disabled={isLoading}
                rows={1}
                className="flex-1 resize-none bg-transparent px-4 py-3 pr-2 text-[14px] text-foreground placeholder:text-muted-foreground/50 outline-none disabled:opacity-50 max-h-32 overflow-y-auto scrollbar-thin"
                style={{ minHeight: '46px' }}
              />

              {/* Right-side actions */}
              <div className="flex items-center gap-0.5 pr-2 pb-2">
                {/* Voice input */}
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={cn(
                    'flex size-8 items-center justify-center rounded-lg transition-all',
                    isRecording
                      ? 'text-red-500 bg-red-500/10'
                      : 'text-muted-foreground/50 hover:text-muted-foreground'
                  )}
                >
                  {isRecording ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                </button>

                {/* Send button */}
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className={cn(
                    'flex size-8 items-center justify-center rounded-lg transition-all',
                    inputValue.trim() && !isLoading
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'text-muted-foreground/30'
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="mt-1.5 text-center text-[10px] text-muted-foreground/40">
              <ShijlAIText /> may make mistakes. Verify important information.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
