'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AiMessageRenderer } from '@/components/ai/ai-message-renderer'
import {
  Send,
  Trash2,
  BookOpen,
  ChevronDown,
  Loader2,
  Mic,
  MicOff,
  MessageSquare,
  Plus,
  Lightbulb,
  ListPlus,
  TestTube2,
  Languages,
  Globe,
  Check,
  Download,
  User,
  GraduationCap,
  Brain,
  ClipboardList,
  Calendar,
  Compass,
  RotateCcw,
  Settings2,
  Hash,
  FolderOpen,
  Target,
  Briefcase,
  LayoutList,
  CheckSquare,
  FileText,
  Timer,
  CalendarDays,
  Route,
  Award,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Pencil,
  X,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useLearningEvents } from '@/hooks/use-learning-events'
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
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ShijlAIBrand, ShijlAIText } from '@/components/ui/brand-text'


/* ─── Types ─── */
type AIMode = 'tutor' | 'quiz' | 'assignment' | 'planner' | 'career'

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
  mode?: AIMode
  createdAt: string
  updatedAt: string
  lastMessage: string | null
}

interface LearningProfile {
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  weakTopics: string[]
  strongTopics: string[]
  totalSessions: number
  streakDays: number
  consistencyScore?: number
  learningSpeedScore?: number
  dropRiskScore?: number
  engagementScore?: number
  learningLevel?: string
}

interface Recommendation {
  id: string
  type: string
  title: string
  description: string | null
  reason: string | null
  priority: string
  status: string
  createdAt: string
}

/* ─── Mode Configuration ─── */
const AI_MODES: Record<AIMode, {
  id: AIMode
  label: string
  icon: typeof GraduationCap
  color: string
  bgColor: string
  borderColor: string
  gradientFrom: string
  gradientTo: string
  description: string
  systemPrompt: string
  quickActions: { id: string; label: string; icon: React.ReactNode }[]
  suggestedQuestions: { label: string; icon: React.ReactNode }[]
}> = {
  tutor: {
    id: 'tutor',
    label: 'Tutor',
    icon: GraduationCap,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-teal-600',
    description: "I'm your AI assistant. Ask me anything about your courses and I'll guide you step by step.",
    systemPrompt: 'You are Ask ShijlAI, a helpful AI assistant. Explain concepts clearly, provide examples, and guide students step by step. Be encouraging and thorough.',
    quickActions: [
      { id: 'explain_simpler', label: 'Explain simpler', icon: <Lightbulb className="size-3.5" /> },
      { id: 'more_examples', label: 'More examples', icon: <ListPlus className="size-3.5" /> },
      { id: 'test_me', label: 'Test me', icon: <TestTube2 className="size-3.5" /> },
      { id: 'simplify', label: 'Simplify', icon: <Languages className="size-3.5" /> },
    ],
    suggestedQuestions: [
      { label: 'Explain closures in JavaScript', icon: <GraduationCap className="size-4" /> },
      { label: 'Help me with quadratic equations', icon: <Brain className="size-4" /> },
      { label: 'How does photosynthesis work?', icon: <GraduationCap className="size-4" /> },
      { label: "What is Newton's Second Law?", icon: <GraduationCap className="size-4" /> },
    ],
  },
  quiz: {
    id: 'quiz',
    label: 'Quiz',
    icon: Brain,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-purple-600',
    description: "Test your knowledge with AI-generated quizzes. I'll create questions tailored to your level.",
    systemPrompt: 'You are a quiz generator AI. Create varied questions (MCQs, True/False, short answer) to test the student. Provide correct answers and explanations after they respond. Adjust difficulty based on performance.',
    quickActions: [
      { id: 'generate_mcqs', label: 'Generate MCQs', icon: <CheckSquare className="size-3.5" /> },
      { id: 'generate_tf', label: 'True/False', icon: <ListPlus className="size-3.5" /> },
      { id: 'generate_short', label: 'Short questions', icon: <FileText className="size-3.5" /> },
      { id: 'test_me_topic', label: 'Test me on this', icon: <TestTube2 className="size-3.5" /> },
    ],
    suggestedQuestions: [
      { label: 'Quiz me on Python basics', icon: <Brain className="size-4" /> },
      { label: 'Generate 5 MCQs about photosynthesis', icon: <Brain className="size-4" /> },
      { label: 'True/False questions on World War II', icon: <Brain className="size-4" /> },
      { label: 'Test me on data structures', icon: <Brain className="size-4" /> },
    ],
  },
  assignment: {
    id: 'assignment',
    label: 'Assignment Helper',
    icon: ClipboardList,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-600',
    description: "Get help understanding assignments, breaking down tasks, and planning your approach.",
    systemPrompt: 'You are an assignment helper AI. Help students understand requirements, break tasks into manageable steps, suggest approaches and resources. Do NOT write entire assignments for them - guide them to do the work themselves.',
    quickActions: [
      { id: 'break_down', label: 'Break down task', icon: <LayoutList className="size-3.5" /> },
      { id: 'suggest_approach', label: 'Suggest approach', icon: <Target className="size-3.5" /> },
      { id: 'check_understanding', label: 'Check my understanding', icon: <Check className="size-3.5" /> },
      { id: 'give_tips', label: 'Give me tips', icon: <Lightbulb className="size-3.5" /> },
    ],
    suggestedQuestions: [
      { label: 'Help me understand this assignment', icon: <ClipboardList className="size-4" /> },
      { label: 'Break down this project into steps', icon: <ClipboardList className="size-4" /> },
      { label: 'What approach should I take?', icon: <ClipboardList className="size-4" /> },
      { label: 'Tips for writing a research paper', icon: <ClipboardList className="size-4" /> },
    ],
  },
  planner: {
    id: 'planner',
    label: 'Study Planner',
    icon: Calendar,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-indigo-600',
    description: "Create personalized study schedules based on your goals and timeline.",
    systemPrompt: 'You are a study planner AI. Create personalized, realistic study schedules based on student goals, timeline, and subjects. Consider spaced repetition, breaks, and balanced workload. Provide actionable day-by-day plans.',
    quickActions: [
      { id: 'create_plan', label: 'Create study plan', icon: <CalendarDays className="size-3.5" /> },
      { id: 'exam_prep', label: 'Exam prep schedule', icon: <Timer className="size-3.5" /> },
      { id: 'weekly_planner', label: 'Weekly planner', icon: <Calendar className="size-3.5" /> },
      { id: 'revision_plan', label: 'Revision plan', icon: <RotateCcw className="size-3.5" /> },
    ],
    suggestedQuestions: [
      { label: 'Plan my study for the next 2 weeks', icon: <Calendar className="size-4" /> },
      { label: 'Create an exam prep schedule', icon: <Calendar className="size-4" /> },
      { label: 'Weekly study plan for 3 subjects', icon: <Calendar className="size-4" /> },
      { label: 'Revision plan before finals', icon: <Calendar className="size-4" /> },
    ],
  },
  career: {
    id: 'career',
    label: 'Career Advisor',
    icon: Compass,
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    gradientFrom: 'from-rose-500',
    gradientTo: 'to-pink-600',
    description: "Get career guidance, roadmaps, and skill development recommendations.",
    systemPrompt: 'You are a career advisor AI. Provide guidance on career paths, required skills, job market trends, and skill development roadmaps. Give practical, actionable advice for students exploring careers.',
    quickActions: [
      { id: 'career_roadmap', label: 'Career roadmap', icon: <Route className="size-3.5" /> },
      { id: 'skill_gap', label: 'Skill gap analysis', icon: <Target className="size-3.5" /> },
      { id: 'job_prep', label: 'Job preparation', icon: <Briefcase className="size-3.5" /> },
      { id: 'interview_tips', label: 'Interview tips', icon: <Award className="size-3.5" /> },
    ],
    suggestedQuestions: [
      { label: 'I want to become a data scientist', icon: <Compass className="size-4" /> },
      { label: 'Skills needed for web development', icon: <Compass className="size-4" /> },
      { label: 'Career roadmap for ML engineer', icon: <Compass className="size-4" /> },
      { label: 'How to prepare for tech interviews', icon: <Compass className="size-4" /> },
    ],
  },
}

const MODE_LIST: AIMode[] = ['tutor', 'quiz', 'assignment', 'planner', 'career']

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

/* ─── Typing Indicator ─── */
function TypingIndicator({ mode }: { mode: AIMode }) {
  const modeConfig = AI_MODES[mode]
  const ModeIcon = modeConfig.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-4 px-0 py-3"
    >
      <div className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white',
        modeConfig.gradientFrom, modeConfig.gradientTo
      )}>
        <ModeIcon className="size-4" />
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
   ASK SHIJLAI VIEW — 5-Mode AI Learning System (Minimal)
   ═══════════════════════════════════════════════════════════ */
export function AskShijlAIView() {
  const { currentUser, enrollments, selectedCourse } = useAppStore()
  const { logEvent } = useLearningEvents()
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [context, setContext] = useState<string | null>(null)
  const [language, setLanguage] = useState('en')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [pastSessions, setPastSessions] = useState<PastSession[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [activeMode, setActiveMode] = useState<AIMode>('tutor')
  const [learningProfile, setLearningProfile] = useState<LearningProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [historyOpen, setHistoryOpen] = useState(true)
  const [historySearch, setHistorySearch] = useState('')
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const currentMode = AI_MODES[activeMode]
  const ModeIcon = currentMode.icon

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
    loadLearningProfile()
    loadRecommendations()
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
    if (!currentUser?.id) return
    try {
      const res = await fetch(`/api/ai/shijlai/sessions?userId=${currentUser.id}`)
      if (res.ok) {
        const data = await res.json()
        setPastSessions(data.sessions || [])
      }
    } catch {
      // silently fail
    }
  }

  const loadLearningProfile = async () => {
    setProfileLoading(true)
    try {
      const res = await fetch(`/api/ai/shijlai/profile?userId=${currentUser?.id || ''}`)
      if (res.ok) {
        const data = await res.json()
        const rawProfile = data.profile || null
        if (rawProfile) {
          // Parse the enhanced profile from API
          let weakTopicsArr: string[] = []
          let strongTopicsArr: string[] = []
          try { weakTopicsArr = JSON.parse(rawProfile.weakTopics || '[]') } catch { /* empty */ }
          try { strongTopicsArr = JSON.parse(rawProfile.strongTopics || '[]') } catch { /* empty */ }

          setLearningProfile({
            level: (rawProfile.learningLevel || 'intermediate').charAt(0).toUpperCase() + (rawProfile.learningLevel || 'intermediate').slice(1) as 'Beginner' | 'Intermediate' | 'Advanced',
            weakTopics: weakTopicsArr,
            strongTopics: strongTopicsArr,
            totalSessions: rawProfile.totalLessonsCompleted || 0,
            streakDays: rawProfile.studyStreakDays || 0,
            consistencyScore: rawProfile.consistencyScore || 0,
            learningSpeedScore: rawProfile.learningSpeedScore || 50,
            dropRiskScore: rawProfile.dropRiskScore || 0,
            engagementScore: rawProfile.engagementScore || 0,
            learningLevel: rawProfile.learningLevel || 'intermediate',
          })
        } else {
          setLearningProfile({
            level: 'Intermediate',
            weakTopics: ['Calculus', 'Organic Chemistry'],
            strongTopics: ['JavaScript', 'Algebra'],
            totalSessions: 12,
            streakDays: 3,
            consistencyScore: 55,
            learningSpeedScore: 60,
            dropRiskScore: 25,
            engagementScore: 45,
            learningLevel: 'intermediate',
          })
        }
      } else {
        setLearningProfile({
          level: 'Intermediate',
          weakTopics: ['Calculus', 'Organic Chemistry'],
          strongTopics: ['JavaScript', 'Algebra'],
          totalSessions: 12,
          streakDays: 3,
          consistencyScore: 55,
          learningSpeedScore: 60,
          dropRiskScore: 25,
          engagementScore: 45,
          learningLevel: 'intermediate',
        })
      }
    } catch {
      setLearningProfile({
        level: 'Intermediate',
        weakTopics: ['Calculus', 'Organic Chemistry'],
        strongTopics: ['JavaScript', 'Algebra'],
        totalSessions: 12,
        streakDays: 3,
        consistencyScore: 55,
        learningSpeedScore: 60,
        dropRiskScore: 25,
        engagementScore: 45,
        learningLevel: 'intermediate',
      })
    } finally {
      setProfileLoading(false)
    }
  }

  const loadRecommendations = async () => {
    try {
      const res = await fetch(`/api/ai/shijlai/recommendations?userId=${currentUser?.id || ''}&status=active`)
      if (res.ok) {
        const data = await res.json()
        if (data.recommendations && data.recommendations.length > 0) {
          setRecommendations(data.recommendations)
        } else {
          // Fallback demo data
          setRecommendations([
            { id: 'demo-1', type: 'topic', title: 'Review Calculus Fundamentals', description: 'Focus on limits and derivatives', reason: 'Your quiz scores dropped 15% this week', priority: 'high', status: 'active', createdAt: new Date().toISOString() },
            { id: 'demo-2', type: 'quiz', title: 'Practice Organic Chemistry', description: 'Take a diagnostic quiz', reason: 'You haven\'t studied this topic in 7 days', priority: 'medium', status: 'active', createdAt: new Date().toISOString() },
            { id: 'demo-3', type: 'lesson', title: 'Advanced Data Structures', description: 'Continue where you left off', reason: 'Your mastery is improving', priority: 'low', status: 'active', createdAt: new Date().toISOString() },
          ])
        }
      }
    } catch {
      // silently fail
    }
  }

  const loadSession = async (sessId: string) => {
    try {
      const res = await fetch(`/api/ai/shijlai/sessions/${sessId}`)
      if (res.ok) {
        const data = await res.json()
        const session = data.session
        setSessionId(session.id)
        setContext(session.context)
        setLanguage(session.language || 'en')
        if (session.mode) setActiveMode(session.mode as AIMode)
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

    if (!currentUser?.id) {
      toast.error('Please log in to use Ask ShijlAI.')
      return
    }

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
      const res = await fetch('/api/ai/shijlai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          message: text.trim(),
          mode: activeMode,
          sessionId: sessionId || undefined,
          courseId: selectedCourseId || undefined,
          language,
          quickAction: quickAction || undefined,
        }),
      })

      if (!res.ok) throw new Error('Failed to get response')

      const data = await res.json()

      const rawContent = data.message || data.response || "I'm here to help! Could you rephrase your question?"
      const aiMsg: ChatMsg = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        content: typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent),
        timestamp: new Date(),
        language,
      }

      setMessages((prev) => [...prev, aiMsg])

      // Capture sessionId
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId)
      }

      // Log learning event
      logEvent({
        eventType: 'ai_tutor_used',
        courseId: selectedCourseId || undefined,
        metadata: { mode: activeMode, sessionId: data.sessionId || sessionId },
      })

      loadPastSessions()
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

  const exportChat = () => {
    if (messages.length === 0) {
      toast.error('No messages to export')
      return
    }

    const header = `ShijlAI Academy - Ask ShijlAI Chat Export
Mode: ${currentMode.label}${selectedCourseInfo ? `\nCourse: ${selectedCourseInfo.title}` : ''}
Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
${'═'.repeat(60)}

`
    const chatContent = messages
      .map((msg) => {
        const role = msg.role === 'user' ? '👤 You' : `🤖 ShijlAI ${currentMode.label}`
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
    a.download = `ask-shijlai-${activeMode}-chat-${new Date().toISOString().slice(0, 10)}.txt`
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

  // ─── Delete session ───
  const deleteSession = async (sessId: string) => {
    setDeletingSessionId(sessId)
    try {
      const res = await fetch(`/api/ai/shijlai/sessions/${sessId}`, { method: 'DELETE' })
      if (res.ok) {
        setPastSessions(prev => prev.filter(s => s.id !== sessId))
        if (sessionId === sessId) {
          setMessages([])
          setSessionId(null)
        }
        toast.success('Session deleted')
      } else {
        toast.error('Failed to delete session')
      }
    } catch {
      toast.error('Failed to delete session')
    } finally {
      setDeletingSessionId(null)
    }
  }

  // ─── Group sessions by date ───
  const groupedSessions = useMemo(() => {
    const filtered = historySearch.trim()
      ? pastSessions.filter(s =>
          s.title.toLowerCase().includes(historySearch.toLowerCase()) ||
          (s.lastMessage || '').toLowerCase().includes(historySearch.toLowerCase())
        )
      : pastSessions

    const groups: { label: string; sessions: PastSession[] }[] = []
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 86400000)
    const lastWeek = new Date(today.getTime() - 7 * 86400000)
    const lastMonth = new Date(today.getTime() - 30 * 86400000)

    const buckets: Record<string, PastSession[]> = {
      today: [],
      yesterday: [],
      last7Days: [],
      last30Days: [],
      older: [],
    }

    for (const session of filtered) {
      const sessionDate = new Date(session.updatedAt || session.createdAt)
      if (sessionDate >= today) buckets.today.push(session)
      else if (sessionDate >= yesterday) buckets.yesterday.push(session)
      else if (sessionDate >= lastWeek) buckets.last7Days.push(session)
      else if (sessionDate >= lastMonth) buckets.last30Days.push(session)
      else buckets.older.push(session)
    }

    if (buckets.today.length > 0) groups.push({ label: 'Today', sessions: buckets.today })
    if (buckets.yesterday.length > 0) groups.push({ label: 'Yesterday', sessions: buckets.yesterday })
    if (buckets.last7Days.length > 0) groups.push({ label: 'Previous 7 Days', sessions: buckets.last7Days })
    if (buckets.last30Days.length > 0) groups.push({ label: 'Previous 30 Days', sessions: buckets.last30Days })
    if (buckets.older.length > 0) groups.push({ label: 'Older', sessions: buckets.older })

    return groups
  }, [pastSessions, historySearch])

  const showWelcome = messages.length === 0
  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0]

  /* ═══ RENDER ═══ */
  return (
    <div className="flex h-full rounded-2xl border border-border/40 overflow-hidden bg-background">

      {/* ═══ COLLAPSIBLE HISTORY SIDEBAR ═══ */}
      <AnimatePresence initial={false}>
        {historyOpen && (
          <motion.aside
            key="history-sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="flex flex-col border-r border-border/40 bg-muted/20 overflow-hidden shrink-0"
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/30">
              <h3 className="text-[13px] font-semibold text-foreground">Chat History</h3>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={() => setHistoryOpen(false)}
              >
                <PanelLeftClose className="size-4" />
              </Button>
            </div>

            {/* Search + New Chat */}
            <div className="px-3 py-2 space-y-2 border-b border-border/20">
              <Button
                variant="outline"
                size="sm"
                onClick={startNewChat}
                className={cn(
                  'w-full justify-start gap-2 rounded-xl text-[13px] h-8',
                  currentMode.bgColor, currentMode.color, 'border-current/20'
                )}
              >
                <Plus className="size-3.5" />
                New Chat
              </Button>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full h-7 rounded-lg border border-border/40 bg-background pl-8 pr-2 text-[12px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                {historySearch && (
                  <button
                    onClick={() => setHistorySearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Session List */}
            <ScrollArea className="flex-1">
              <div className="px-2 py-1">
                {groupedSessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquare className="size-8 text-muted-foreground/30 mb-2" />
                    <p className="text-[12px] text-muted-foreground">
                      {historySearch ? 'No matching chats' : 'No chat history yet'}
                    </p>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                      {historySearch ? 'Try a different search term' : 'Start a conversation to see it here'}
                    </p>
                  </div>
                ) : (
                  groupedSessions.map((group) => (
                    <div key={group.label} className="mb-2">
                      <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {group.label}
                      </div>
                      {group.sessions.map((session) => {
                        const sessionMode = session.mode ? AI_MODES[session.mode] : null
                        const SessionIcon = sessionMode ? sessionMode.icon : MessageSquare
                        const isActive = sessionId === session.id
                        return (
                          <ContextMenu key={session.id}>
                            <ContextMenuTrigger asChild>
                              <button
                                onClick={() => loadSession(session.id)}
                                className={cn(
                                  'w-full flex items-start gap-2 rounded-xl px-2.5 py-2 text-left transition-colors group',
                                  isActive
                                    ? cn('bg-primary/10', currentMode.color)
                                    : 'hover:bg-muted/60 text-foreground/80'
                                )}
                              >
                                <SessionIcon className={cn('size-3.5 shrink-0 mt-0.5', sessionMode ? sessionMode.color : 'text-muted-foreground/60')} />
                                <div className="flex-1 min-w-0">
                                  <p className={cn('text-[12px] truncate leading-tight', isActive && 'font-medium')}>
                                    {session.title}
                                  </p>
                                  {session.lastMessage && (
                                    <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5 leading-tight">
                                      {session.lastMessage}
                                    </p>
                                  )}
                                </div>
                                {deletingSessionId === session.id && (
                                  <Loader2 className="size-3 shrink-0 mt-0.5 animate-spin text-muted-foreground" />
                                )}
                              </button>
                            </ContextMenuTrigger>
                            <ContextMenuContent className="rounded-xl">
                              <ContextMenuItem
                                onClick={() => loadSession(session.id)}
                                className="gap-2 text-[13px]"
                              >
                                <Pencil className="size-3.5" />
                                Open
                              </ContextMenuItem>
                              <ContextMenuItem
                                onClick={() => deleteSession(session.id)}
                                className="gap-2 text-[13px] text-destructive focus:text-destructive"
                              >
                                <Trash2 className="size-3.5" />
                                Delete
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        )
                      })}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Sidebar Footer */}
            <div className="px-3 py-2 border-t border-border/30 text-center">
              <p className="text-[10px] text-muted-foreground/60">
                {pastSessions.length} session{pastSessions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ═══ MAIN CHAT AREA ═══ */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* ─── Top Bar ─── */}
        <div className="flex items-center justify-between px-3 md:px-4 py-2 border-b border-border/30 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Mode selector dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  'flex items-center gap-1.5 md:gap-2 rounded-xl px-2 md:px-3 py-1.5 text-[13px] md:text-[14px] font-semibold text-foreground hover:bg-muted transition-colors'
                )}>
                  <div className={cn(
                    'flex size-5 items-center justify-center rounded-full bg-gradient-to-br text-white',
                    currentMode.gradientFrom, currentMode.gradientTo
                  )}>
                    <ModeIcon className="size-3" />
                  </div>
                  <span className="hidden sm:inline">{currentMode.label}</span>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="rounded-2xl w-64 shadow-lg">
                <div className="px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  AI Mode
                </div>
                {MODE_LIST.map((modeKey) => {
                  const mode = AI_MODES[modeKey]
                  const Icon = mode.icon
                  return (
                    <DropdownMenuItem
                      key={modeKey}
                      onClick={() => setActiveMode(modeKey)}
                      className={cn(
                        'gap-2.5 rounded-xl text-[13px]',
                        activeMode === modeKey && cn(mode.bgColor, mode.color)
                      )}
                    >
                      <div className={cn(
                        'flex size-6 items-center justify-center rounded-full bg-gradient-to-br text-white',
                        mode.gradientFrom, mode.gradientTo
                      )}>
                        <Icon className="size-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="block">{mode.label}</span>
                        <span className="text-[10px] text-muted-foreground line-clamp-1">{mode.description}</span>
                      </div>
                      {activeMode === modeKey && <Check className={cn('size-3.5 shrink-0', mode.color)} />}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Course selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  'hidden md:flex items-center gap-2 rounded-xl px-3 py-1.5 text-[13px] font-medium transition-colors',
                  selectedCourseInfo
                    ? cn(currentMode.bgColor, currentMode.color, `hover:${currentMode.bgColor}`)
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}>
                  <BookOpen className="size-3.5" />
                  <span className="max-w-[140px] truncate">{selectedCourseInfo ? selectedCourseInfo.title : 'Course'}</span>
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
                  {!selectedCourseId && <Check className={cn('size-3.5 ml-auto', currentMode.color)} />}
                </DropdownMenuItem>
                <Separator className="my-1" />
                {enrolledCourses.length > 0 ? (
                  enrolledCourses.map((course) => (
                    <DropdownMenuItem
                      key={course.id}
                      onClick={() => setSelectedCourseId(course.id)}
                      className={cn(
                        'gap-2.5 rounded-xl',
                        selectedCourseId === course.id && cn(currentMode.bgColor, currentMode.color)
                      )}
                    >
                      <BookOpen className={cn('size-3.5', currentMode.color)} />
                      <div className="flex-1 min-w-0">
                        <span className="truncate text-[13px] block">{course.title}</span>
                        {course.category && (
                          <span className="text-[10px] text-muted-foreground">{course.category} · {course.level || 'All levels'}</span>
                        )}
                      </div>
                      {selectedCourseId === course.id && <Check className={cn('size-3.5 shrink-0', currentMode.color)} />}
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

            {/* History sidebar toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn('gap-1.5 text-[13px]', historyOpen && cn(currentMode.bgColor, currentMode.color))}
                    onClick={() => setHistoryOpen(!historyOpen)}
                  >
                    {historyOpen ? <PanelLeftClose className="size-3.5" /> : <PanelLeftOpen className="size-3.5" />}
                    <span className="hidden sm:inline">History</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[12px]">
                  {historyOpen ? 'Close history' : 'Open chat history'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* New Chat button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={startNewChat}
              className={cn(
                'gap-1.5 text-[13px]',
                currentMode.bgColor, currentMode.color
              )}
            >
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </Button>

            {/* Language indicator */}
            <button
              onClick={() => {
                const langIdx = LANGUAGES.findIndex(l => l.code === language)
                const nextLang = LANGUAGES[(langIdx + 1) % LANGUAGES.length]
                setLanguage(nextLang.code)
              }}
              className="hidden sm:flex items-center gap-1 rounded-full bg-muted/50 border border-border/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Globe className="size-3" />
              {currentLang.flag}
            </button>
          </div>

          <div className="flex items-center gap-1">
            {/* Settings — Language */}
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
                    {language === lang.code && <Check className={cn('size-3.5 ml-auto', currentMode.color)} />}
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
            /* ─── Simple Welcome Screen ─── */
            <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto px-6 py-12">
              {/* AI Logo */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={cn(
                  'flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg mb-6',
                  currentMode.gradientFrom, currentMode.gradientTo
                )}
              >
                <ModeIcon className="size-8" />
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
                className="text-muted-foreground text-[15px] mb-4"
              >
                How can I help you today?
              </motion.p>

              {/* Mode badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Badge variant="outline" className={cn('mb-8', currentMode.borderColor, currentMode.color)}>
                  <ModeIcon className="size-3 mr-1" />
                  {currentMode.label} Mode
                </Badge>
              </motion.div>

              {/* Suggested questions grid */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg"
              >
                {currentMode.suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q.label)}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl border border-border/50 bg-card px-4 py-3 text-[13px] text-foreground/80 transition-all text-left',
                      'hover:shadow-sm',
                      currentMode.color
                    )}
                  >
                    <span className="shrink-0 opacity-60">{q.icon}</span>
                    <span className="truncate">{q.label}</span>
                  </button>
                ))}
              </motion.div>
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
                      {/* AI Avatar — mode-colored */}
                      {!isUser && (
                        <div className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white mt-0.5',
                          currentMode.gradientFrom, currentMode.gradientTo
                        )}>
                          <ModeIcon className="size-4" />
                        </div>
                      )}

                      {/* Message content */}
                      <div className={cn('max-w-[85%] min-w-0', isUser ? 'order-first' : '')}>
                        {isUser ? (
                          <div className={cn(
                            'rounded-2xl rounded-br-md text-white px-4 py-2.5 shadow-sm',
                            currentMode.gradientFrom === 'from-emerald-500'
                              ? 'bg-emerald-600 dark:bg-emerald-700'
                              : currentMode.gradientFrom === 'from-violet-500'
                              ? 'bg-violet-600 dark:bg-violet-700'
                              : currentMode.gradientFrom === 'from-amber-500'
                              ? 'bg-amber-600 dark:bg-amber-700'
                              : currentMode.gradientFrom === 'from-blue-500'
                              ? 'bg-blue-600 dark:bg-blue-700'
                              : 'bg-rose-600 dark:bg-rose-700'
                          )}>
                            <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        ) : (
                          <AiMessageRenderer content={msg.content} mode={activeMode} />
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
                {isLoading && <TypingIndicator mode={activeMode} />}

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
                {currentMode.quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border border-border/50 bg-card px-3 py-1.5 text-[12px] font-medium text-muted-foreground transition-all',
                      `hover:${currentMode.bgColor}`,
                      `hover:${currentMode.color}`,
                      `hover:${currentMode.borderColor.replace('/30', '/50')}`
                    )}
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
        <div className="border-t border-border/30 px-3 md:px-4 py-3 bg-background">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className={cn(
              'relative flex items-end rounded-2xl border bg-card shadow-sm focus-within:shadow-md transition-all',
              currentMode.borderColor.replace('/30', '/50'),
              `focus-within:${currentMode.borderColor}`,
              `focus-within:shadow-${currentMode.gradientFrom.replace('from-', '')}/5`
            )}>
              {/* Text input */}
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ShijlAI ${currentMode.label}...`}
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
                      ? cn('bg-gradient-to-br text-white hover:opacity-90', currentMode.gradientFrom, currentMode.gradientTo)
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
