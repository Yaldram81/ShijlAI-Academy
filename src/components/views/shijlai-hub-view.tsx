'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Brain,
  Calendar,
  Mic,
  BookOpen,
  Send,
  Loader2,
  GraduationCap,
  MessageSquare,
  Plus,
  X,
  TrendingUp,
  Target,
  Zap,
  Lightbulb,
  ChevronRight,
  ChevronDown,
  Layers,
  PenTool,
  Headphones,
  ArrowRight,
  Star,
  Shield,
  Flame,
  Award,
  Coffee,
  Trash2,
  CheckCircle2,
  Timer,
  RefreshCw,
  AlertTriangle,
  Route,
  Trophy,
  Clock,
  Bot,
} from 'lucide-react'
import { ShijlAIText } from '@/components/ui/brand-text'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { AiMessageRenderer } from '@/components/ai/ai-message-renderer'
import { ResizableSidepanel } from '@/components/resizable-sidepanel'
import { LearningCompanionView } from '@/components/views/learning-companion-view'
import { MockInterviewTab } from '@/components/ai-mock-interview'

import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

/* ─── Types ─── */
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface StudyPlanTaskItem {
  id: string
  date: string
  dayNumber: number
  taskType: 'study' | 'quiz' | 'revision' | 'practice' | 'mock_exam' | 'ai_discussion' | 'break'
  title: string
  description?: string | null
  duration: number
  topic?: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  orderIndex: number
}

interface StudyPlanWithTasks {
  id: string
  title: string
  courseName?: string | null
  examDate: string | null
  targetGrade?: string | null
  currentGrade?: string | null
  dailyHours: number
  totalDays: number
  completedTasks: number
  totalTasks: number
  progress: number
  status: 'active' | 'completed' | 'abandoned'
  tasks: StudyPlanTaskItem[]
  createdAt?: string
}

type HubTab = 'study-planner' | 'mock-interview' | 'companion'

/* ─── Tab Config ─── */
const hubTabConfig: { id: HubTab; label: string; icon: typeof Brain; description: string; gradient: string; iconBg: string; accent: string }[] = [
  {
    id: 'study-planner',
    label: 'Study Planner',
    icon: Calendar,
    description: 'Create AI-powered study plans with personalized daily schedules, milestones, and progress tracking.',
    gradient: 'from-emerald-500/10 via-teal-500/10 to-cyan-500/10',
    iconBg: 'from-emerald-500 to-teal-600',
    accent: 'emerald',
  },
  {
    id: 'mock-interview',
    label: 'AI Mock Interview',
    icon: Mic,
    description: 'Practice interviews with an AI interviewer. Get real-time feedback and improve your confidence.',
    gradient: 'from-amber-500/10 via-orange-500/10 to-red-500/10',
    iconBg: 'from-amber-500 to-orange-600',
    accent: 'amber',
  },
  {
    id: 'companion',
    label: 'ShijlAI Companion',
    icon: Bot,
    description: 'Your proactive AI mentor that analyzes your learning data and provides personalized guidance.',
    gradient: 'from-sky-500/10 via-teal-500/10 to-cyan-500/10',
    iconBg: 'from-sky-500 to-teal-600',
    accent: 'sky',
  },
]

/* ─── Accent helpers ─── */
function getAccentClasses(accent: string) {
  const map: Record<string, { text: string; bg: string; border: string; hover: string; solid: string; solidHover: string; badge: string }> = {
    emerald: { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', hover: 'hover:bg-emerald-500/20', solid: 'bg-emerald-500', solidHover: 'hover:bg-emerald-600', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
    violet: { text: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', hover: 'hover:bg-violet-500/20', solid: 'bg-violet-500', solidHover: 'hover:bg-violet-600', badge: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' },
    amber: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', hover: 'hover:bg-amber-500/20', solid: 'bg-amber-500', solidHover: 'hover:bg-amber-600', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
    sky: { text: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', hover: 'hover:bg-sky-500/20', solid: 'bg-sky-500', solidHover: 'hover:bg-sky-600', badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' },
  }
  return map[accent] || map.emerald
}

/* ═══════════════════════════════════════════════════════════
   SHIJLAI HUB VIEW
   ═══════════════════════════════════════════════════════════ */
export function ShijlAIHubView() {
  const { currentUser } = useAppStore()
  const userId = currentUser?.id || 'demo-user-1'

  const [activeTab, setActiveTab] = useState<HubTab>('study-planner')

  // Sidepanel chat state
  const [mobileChatOpen, setMobileChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatSessionId, setChatSessionId] = useState<string | null>(null)
  const [chatMode, setChatMode] = useState<'tutor' | 'quiz' | 'study_planner'>('tutor')
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Study Planner state
  const [studyPlans, setStudyPlans] = useState<StudyPlanWithTasks[]>([])
  const [studyPlansLoading, setStudyPlansLoading] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [planForm, setPlanForm] = useState({
    examDate: '',
    courseId: '',
    courseName: '',
    dailyHours: 2,
    targetGrade: '',
    currentGrade: '',
    weakTopics: [] as string[],
    strongTopics: [] as string[],
  })
  const [newTopicInput, setNewTopicInput] = useState({ weak: '', strong: '' })
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set())

  // Study Planner load function
  const loadStudyPlans = useCallback(async () => {
    setStudyPlansLoading(true)
    try {
      const res = await fetch(`/api/ai/study-planner?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setStudyPlans(data.plans || [])
      } else {
        setStudyPlans([])
      }
    } catch {
      setStudyPlans([])
    } finally {
      setStudyPlansLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (activeTab === 'study-planner') {
      loadStudyPlans()
    }
  }, [activeTab, loadStudyPlans])

  // Chat handlers
  const sendChatMessage = useCallback(async (text: string) => {
    if (!text.trim() || chatLoading) return
    const userMsg: ChatMessage = { id: `msg-${Date.now()}`, role: 'user', content: text }
    setChatMessages(prev => [...prev, userMsg])
    setChatLoading(true)

    try {
      const res = await fetch('/api/ai/shijlai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: text,
          mode: chatMode,
          sessionId: chatSessionId,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const aiContent = typeof data.message === 'string' ? data.message : (data.message?.content || data.response || 'I understand. Let me help you with that.')
        const aiMsg: ChatMessage = { id: `msg-${Date.now()}-ai`, role: 'assistant', content: aiContent }
        setChatMessages(prev => [...prev, aiMsg])
        if (data.sessionId && !chatSessionId) {
          setChatSessionId(data.sessionId)
        }
      } else {
        setChatMessages(prev => [...prev, { id: `msg-${Date.now()}-ai`, role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }])
      }
    } catch {
      setChatMessages(prev => [...prev, { id: `msg-${Date.now()}-ai`, role: 'assistant', content: 'Connection error. Please try again.' }])
    } finally {
      setChatLoading(false)
    }
  }, [chatLoading, chatMode, chatSessionId, userId])

  const handleChatSend = useCallback(() => {
    if (!chatInput.trim() || chatLoading) return
    sendChatMessage(chatInput)
    setChatInput('')
  }, [chatInput, chatLoading, sendChatMessage])

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const currentTabConfig = hubTabConfig.find(t => t.id === activeTab)!
  const accent = getAccentClasses(currentTabConfig.accent)

  /* ─── Shared header & tab bar (used in both layout branches) ─── */
  const headerSection = (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight"><ShijlAIText /> Hub</h1>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] px-2 py-0.5">&#10022; AI-powered</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Your intelligent learning command center</p>
          </div>
        </div>
      </div>
    </div>
  )

  const tabBarSection = (
    <div className="border-b border-border/40">
      <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {hubTabConfig.map(tab => {
          const TabIcon = tab.icon
          const isActive = activeTab === tab.id
          const tabAccent = getAccentClasses(tab.accent)
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                isActive
                  ? cn(tabAccent.text, `border-current`)
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border/40'
              )}
            >
              <TabIcon className="size-4" />
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )

  /* ═══ RENDER ═══ */
  return (
    <div className="flex h-full">
      {activeTab === 'companion' ? (
        /* ═══ Companion layout: header + tab bar + full companion view, no sidepanel ═══ */
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="shrink-0 px-4 md:px-6 pt-4 md:pt-6">
            {headerSection}
          </div>
          <div className="shrink-0 px-4 md:px-6">
            {tabBarSection}
          </div>
          <div className="flex-1 overflow-hidden">
            <LearningCompanionView />
          </div>
        </div>
      ) : (
        /* ═══ Normal layout: scrollable content + sidepanel ═══ */
        <>
          <div className="flex-1 min-w-0 overflow-y-auto scrollbar-thin p-4 md:p-6">
            <div className="space-y-6 pb-8">
              {/* ═══ HEADER ═══ */}
              {headerSection}

              {/* ═══ TAB BAR ═══ */}
              {tabBarSection}

              {/* ═══ TAB CONTENT ═══ */}
              <AnimatePresence mode="wait">
            {/* ─── Tab: Study Planner ─── */}
            {activeTab === 'study-planner' && (
              <motion.div
                key="study-planner"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Tab description */}
                <div className={cn('rounded-2xl border bg-gradient-to-r p-5', currentTabConfig.gradient, accent.border)}>
                  <div className="flex items-start gap-3">
                    <div className={cn('flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md shrink-0', currentTabConfig.iconBg)}>
                      <Calendar className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">AI Study Planner</h3>
                      <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{currentTabConfig.description}</p>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Active Plans', value: String(studyPlans.filter(p => p.status === 'active').length), icon: Calendar, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Tasks Completed', value: String(studyPlans.reduce((sum, p) => sum + p.completedTasks, 0)), icon: CheckCircle2, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-500/10' },
                    { label: 'Days Until Exam', value: studyPlans.filter(p => p.status === 'active' && p.examDate).length > 0 ? String(Math.min(...studyPlans.filter(p => p.status === 'active' && p.examDate).map(p => Math.ceil((new Date(p.examDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))))) : '—', icon: Timer, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
                    { label: 'Avg Progress', value: studyPlans.length > 0 ? `${Math.round(studyPlans.reduce((sum, p) => sum + p.progress, 0) / studyPlans.length)}%` : '—', icon: TrendingUp, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10' },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-2xl border border-border/40 bg-card p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn('flex size-7 items-center justify-center rounded-lg', stat.bg, stat.color)}>
                          <stat.icon className="size-3.5" />
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                      </div>
                      <p className="text-xl font-bold text-foreground">{stat.value}</p>
                    </motion.div>
                  ))}
                </div>

                {(() => {
                  // ─── Task type config ───
                  const TASK_TYPE_CONFIG: Record<string, { icon: typeof BookOpen; color: string; bg: string; label: string }> = {
                    study: { icon: BookOpen, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10', label: 'Study' },
                    quiz: { icon: Target, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10', label: 'Quiz' },
                    revision: { icon: RefreshCw, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10', label: 'Revision' },
                    practice: { icon: Brain, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-500/10', label: 'Practice' },
                    mock_exam: { icon: Award, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10', label: 'Mock Exam' },
                    ai_discussion: { icon: Sparkles, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', label: 'AI Discussion' },
                    break: { icon: Coffee, color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-500/10', label: 'Break' },
                  }

                  const selectedPlan = studyPlans.find(p => p.id === selectedPlanId)
                  const activePlans = studyPlans.filter(p => p.status === 'active')
                  const hasPlans = studyPlans.length > 0

                  // ─── Generate plan handler ───
                  const handleGeneratePlan = async () => {
                    if (!planForm.examDate) {
                      toast.error('Please select an exam date')
                      return
                    }
                    setGeneratingPlan(true)
                    try {
                      const res = await fetch('/api/ai/study-planner', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          userId,
                          courseId: planForm.courseId,
                          courseName: planForm.courseName,
                          examDate: planForm.examDate,
                          targetGrade: planForm.targetGrade || undefined,
                          currentGrade: planForm.currentGrade || undefined,
                          dailyHours: planForm.dailyHours,
                          weakTopics: planForm.weakTopics,
                          strongTopics: planForm.strongTopics,
                        }),
                      })
                      if (res.ok) {
                        const data = await res.json()
                        toast.success('Study plan generated! 🎉')
                        setShowCreateForm(false)
                        setPlanForm({
                          examDate: '',
                          courseId: '',
                          courseName: '',
                          dailyHours: 2,
                          targetGrade: '',
                          currentGrade: '',
                          weakTopics: planForm.weakTopics,
                          strongTopics: planForm.strongTopics,
                        })
                        await loadStudyPlans()
                        if (data.plan?.id) setSelectedPlanId(data.plan.id)
                      } else {
                        toast.error('Failed to generate study plan')
                      }
                    } catch {
                      toast.error('Something went wrong')
                    } finally {
                      setGeneratingPlan(false)
                    }
                  }

                  // ─── Toggle task status ───
                  const handleToggleTask = async (taskId: string, currentStatus: string) => {
                    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
                    // Optimistic update
                    setStudyPlans(prev => prev.map(plan => ({
                      ...plan,
                      tasks: plan.tasks.map(t =>
                        t.id === taskId ? { ...t, status: newStatus as StudyPlanTaskItem['status'] } : t
                      ),
                      completedTasks: plan.tasks.filter(t => t.id === taskId ? newStatus === 'completed' : t.status === 'completed').length,
                      progress: Math.round(
                        (plan.tasks.filter(t => t.id === taskId ? newStatus === 'completed' : t.status === 'completed').length / plan.totalTasks) * 100
                      ),
                    })))

                    try {
                      await fetch('/api/ai/study-planner', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ taskId, status: newStatus }),
                      })
                    } catch {
                      toast.error('Failed to update task')
                      loadStudyPlans() // Revert on error
                    }
                  }

                  // ─── Abandon plan ───
                  const handleAbandonPlan = async (planId: string) => {
                    try {
                      await fetch('/api/ai/study-planner', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ planId, status: 'abandoned' }),
                      })
                      toast.success('Plan abandoned')
                      setSelectedPlanId(null)
                      await loadStudyPlans()
                    } catch {
                      toast.error('Failed to abandon plan')
                    }
                  }

                  // ─── Delete plan ───
                  const handleDeletePlan = async (planId: string) => {
                    try {
                      await fetch('/api/ai/study-planner', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ planId, userId }),
                      })
                      toast.success('Plan deleted')
                      setSelectedPlanId(null)
                      await loadStudyPlans()
                    } catch {
                      toast.error('Failed to delete plan')
                    }
                  }

                  // ─── Group tasks by day ───
                  const getTasksByDay = (tasks: StudyPlanTaskItem[]) => {
                    return tasks.reduce((acc, task) => {
                      const day = task.dayNumber
                      if (!acc[day]) acc[day] = []
                      acc[day].push(task)
                      return acc
                    }, {} as Record<number, StudyPlanTaskItem[]>)
                  }

                  // ─── Get countdown days ───
                  const getCountdown = (examDate: string | null) => {
                    if (!examDate) return null
                    const diff = Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    return diff
                  }

                  // ─── Weekly goals from tasks ───
                  const getWeeklyGoals = (tasks: StudyPlanTaskItem[]) => {
                    const weeks: { weekNum: number; tasks: StudyPlanTaskItem[]; label: string }[] = []
                    const maxDay = Math.max(...tasks.map(t => t.dayNumber), 0)
                    for (let w = 1; w <= Math.ceil(maxDay / 7); w++) {
                      const weekTasks = tasks.filter(t => t.dayNumber > (w - 1) * 7 && t.dayNumber <= w * 7)
                      if (weekTasks.length > 0) {
                        weeks.push({ weekNum: w, tasks: weekTasks, label: `Week ${w}` })
                      }
                    }
                    return weeks
                  }

                  // ─── Milestones ───
                  const getMilestones = (tasks: StudyPlanTaskItem[]) => {
                    return tasks.filter(t => ['quiz', 'mock_exam', 'revision'].includes(t.taskType) && t.taskType !== 'break')
                  }

                  // ─── Today's date string ───
                  const todayStr = new Date().toISOString().split('T')[0]

                  // ──────────────────────────────────────
                  // STATE 1: No plans & no selected plan → Create Form
                  // ──────────────────────────────────────
                  if (!hasPlans || showCreateForm) {
                    return (
                      <div className="space-y-4">
                        {/* Create Plan Header */}
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 overflow-hidden">
                          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 px-5 py-4 border-b border-emerald-500/20">
                            <div className="flex items-center gap-2.5">
                              <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                                <Sparkles className="size-4" />
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-foreground">Create Your Study Plan</h3>
                                <p className="text-[11px] text-muted-foreground">AI will craft a personalized daily schedule for you</p>
                              </div>
                            </div>
                          </div>

                          <div className="p-5 space-y-5">
                            {/* Exam Date */}
                            <div className="space-y-2">
                              <Label className="text-[12px] font-medium flex items-center gap-1.5">
                                <Calendar className="size-3.5 text-emerald-500" />
                                Exam Date <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                type="date"
                                value={planForm.examDate}
                                onChange={e => setPlanForm(prev => ({ ...prev, examDate: e.target.value }))}
                                min={new Date().toISOString().split('T')[0]}
                                className="rounded-xl h-10 text-sm"
                              />
                            </div>

                            {/* Course Name */}
                            <div className="space-y-2">
                              <Label className="text-[12px] font-medium flex items-center gap-1.5">
                                <BookOpen className="size-3.5 text-emerald-500" />
                                Course Name
                              </Label>
                              <Input
                                placeholder="e.g., Data Structures, Calculus II"
                                value={planForm.courseName}
                                onChange={e => setPlanForm(prev => ({ ...prev, courseName: e.target.value }))}
                                className="rounded-xl h-10 text-sm"
                              />
                            </div>

                            {/* Daily Study Hours */}
                            <div className="space-y-2">
                              <Label className="text-[12px] font-medium flex items-center gap-1.5">
                                <Clock className="size-3.5 text-emerald-500" />
                                Daily Study Hours: <span className="text-emerald-600 font-bold">{planForm.dailyHours}h</span>
                              </Label>
                              <Slider
                                value={[planForm.dailyHours]}
                                onValueChange={([v]) => setPlanForm(prev => ({ ...prev, dailyHours: v }))}
                                min={1}
                                max={8}
                                step={1}
                                className="py-2"
                              />
                              <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>1h</span><span>4h</span><span>8h</span>
                              </div>
                            </div>

                            {/* Target & Current Grade */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label className="text-[12px] font-medium flex items-center gap-1.5">
                                  <Target className="size-3.5 text-emerald-500" />
                                  Target Grade
                                </Label>
                                <Input
                                  placeholder="e.g., A, 90%"
                                  value={planForm.targetGrade}
                                  onChange={e => setPlanForm(prev => ({ ...prev, targetGrade: e.target.value }))}
                                  className="rounded-xl h-10 text-sm"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[12px] font-medium flex items-center gap-1.5">
                                  <TrendingUp className="size-3.5 text-emerald-500" />
                                  Current Grade
                                </Label>
                                <Input
                                  placeholder="e.g., B, 75%"
                                  value={planForm.currentGrade}
                                  onChange={e => setPlanForm(prev => ({ ...prev, currentGrade: e.target.value }))}
                                  className="rounded-xl h-10 text-sm"
                                />
                              </div>
                            </div>

                            {/* Weak Topics Tags */}
                            <div className="space-y-2">
                              <Label className="text-[12px] font-medium flex items-center gap-1.5">
                                <AlertTriangle className="size-3.5 text-amber-500" />
                                Weak Topics
                              </Label>
                              <div className="flex flex-wrap gap-1.5 mb-1.5">
                                {planForm.weakTopics.map((topic, i) => (
                                  <Badge key={i} variant="outline" className="gap-1 text-[11px] bg-amber-500/10 text-amber-600 border-amber-500/20 px-2 py-0.5">
                                    {topic}
                                    <button onClick={() => setPlanForm(prev => ({ ...prev, weakTopics: prev.weakTopics.filter((_, idx) => idx !== i) }))} className="hover:text-amber-800">
                                      <X className="size-2.5" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex gap-1.5">
                                <Input
                                  placeholder="Add weak topic..."
                                  value={newTopicInput.weak}
                                  onChange={e => setNewTopicInput(prev => ({ ...prev, weak: e.target.value }))}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter' && newTopicInput.weak.trim()) {
                                      setPlanForm(prev => ({ ...prev, weakTopics: [...prev.weakTopics, newTopicInput.weak.trim()] }))
                                      setNewTopicInput(prev => ({ ...prev, weak: '' }))
                                    }
                                  }}
                                  className="rounded-xl h-8 text-[11px]"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2.5 rounded-xl"
                                  onClick={() => {
                                    if (newTopicInput.weak.trim()) {
                                      setPlanForm(prev => ({ ...prev, weakTopics: [...prev.weakTopics, newTopicInput.weak.trim()] }))
                                      setNewTopicInput(prev => ({ ...prev, weak: '' }))
                                    }
                                  }}
                                >
                                  <Plus className="size-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Strong Topics Tags */}
                            <div className="space-y-2">
                              <Label className="text-[12px] font-medium flex items-center gap-1.5">
                                <CheckCircle2 className="size-3.5 text-emerald-500" />
                                Strong Topics
                              </Label>
                              <div className="flex flex-wrap gap-1.5 mb-1.5">
                                {planForm.strongTopics.map((topic, i) => (
                                  <Badge key={i} variant="outline" className="gap-1 text-[11px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-2 py-0.5">
                                    {topic}
                                    <button onClick={() => setPlanForm(prev => ({ ...prev, strongTopics: prev.strongTopics.filter((_, idx) => idx !== i) }))} className="hover:text-emerald-800">
                                      <X className="size-2.5" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex gap-1.5">
                                <Input
                                  placeholder="Add strong topic..."
                                  value={newTopicInput.strong}
                                  onChange={e => setNewTopicInput(prev => ({ ...prev, strong: e.target.value }))}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter' && newTopicInput.strong.trim()) {
                                      setPlanForm(prev => ({ ...prev, strongTopics: [...prev.strongTopics, newTopicInput.strong.trim()] }))
                                      setNewTopicInput(prev => ({ ...prev, strong: '' }))
                                    }
                                  }}
                                  className="rounded-xl h-8 text-[11px]"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-2.5 rounded-xl"
                                  onClick={() => {
                                    if (newTopicInput.strong.trim()) {
                                      setPlanForm(prev => ({ ...prev, strongTopics: [...prev.strongTopics, newTopicInput.strong.trim()] }))
                                      setNewTopicInput(prev => ({ ...prev, strong: '' }))
                                    }
                                  }}
                                >
                                  <Plus className="size-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Generate Button */}
                            <Button
                              onClick={handleGeneratePlan}
                              disabled={generatingPlan || !planForm.examDate}
                              className="w-full h-12 rounded-2xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/20 gap-2"
                            >
                              {generatingPlan ? (
                                <>
                                  <Loader2 className="size-4 animate-spin" />
                                  AI is crafting your study plan...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="size-4" />
                                  Generate AI Study Plan
                                </>
                              )}
                            </Button>
                          </div>
                        </motion.div>
                      </div>
                    )
                  }

                  // ──────────────────────────────────────
                  // STATE 2: Plans exist — show plan list or selected plan detail
                  // ──────────────────────────────────────
                  return (
                    <div className="space-y-4">
                      {/* ─── PLAN LIST VIEW (no plan selected) ─── */}
                      {!selectedPlan && (
                        <>
                          {/* Header */}
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                              <Calendar className="size-4 text-emerald-500" />
                              Your Study Plans
                              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">{activePlans.length} active</Badge>
                            </h3>
                            <Button
                              size="sm"
                              onClick={() => {
                                setPlanForm(prev => ({
                                  ...prev,
                                  examDate: '',
                                  courseId: '',
                                  courseName: '',
                                  dailyHours: 2,
                                  targetGrade: '',
                                  currentGrade: '',
                                  weakTopics: planForm.weakTopics,
                                  strongTopics: planForm.strongTopics,
                                }))
                                setShowCreateForm(true)
                              }}
                              className="gap-1.5 text-[12px] h-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-500/20"
                            >
                              <Plus className="size-3.5" />
                              New Plan
                            </Button>
                          </div>

                          {studyPlansLoading ? (
                            <div className="flex items-center justify-center py-12">
                              <Loader2 className="size-5 animate-spin text-emerald-500" />
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {studyPlans.map((plan, i) => {
                                const countdown = getCountdown(plan.examDate)
                                return (
                                  <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => {
                                      setSelectedPlanId(plan.id)
                                      setExpandedDays(new Set())
                                    }}
                                    className={cn(
                                      'rounded-2xl border bg-card p-4 cursor-pointer transition-all hover:shadow-md',
                                      plan.status === 'active' ? 'border-emerald-500/20 hover:border-emerald-500/40' :
                                      plan.status === 'completed' ? 'border-teal-500/20' : 'border-border/40 opacity-70'
                                    )}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className={cn(
                                        'flex size-11 shrink-0 items-center justify-center rounded-xl',
                                        plan.status === 'active' ? 'bg-emerald-500/10' :
                                        plan.status === 'completed' ? 'bg-teal-500/10' : 'bg-slate-500/10'
                                      )}>
                                        <Calendar className={cn(
                                          'size-5',
                                          plan.status === 'active' ? 'text-emerald-600' :
                                          plan.status === 'completed' ? 'text-teal-600' : 'text-slate-500'
                                        )} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <h4 className="text-sm font-semibold text-foreground truncate">{plan.courseName || plan.title}</h4>
                                          <Badge variant="outline" className={cn(
                                            'text-[9px] px-1.5 py-0 shrink-0 border',
                                            plan.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                            plan.status === 'completed' ? 'bg-teal-500/10 text-teal-600 border-teal-500/20' :
                                            'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                          )}>
                                            {plan.status}
                                          </Badge>
                                        </div>
                                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                          {countdown !== null && (
                                            <span className="flex items-center gap-1">
                                              <Timer className="size-3 text-amber-500" />
                                              <span className={countdown <= 7 ? 'text-red-600 font-semibold' : ''}>{countdown} days left</span>
                                            </span>
                                          )}
                                          <span className="flex items-center gap-1">
                                            <Clock className="size-3" />
                                            {plan.dailyHours}h/day
                                          </span>
                                          {plan.targetGrade && (
                                            <span className="flex items-center gap-1">
                                              <Target className="size-3" />
                                              {plan.targetGrade}
                                            </span>
                                          )}
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="mt-2.5">
                                          <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] text-muted-foreground">{plan.completedTasks}/{plan.totalTasks} tasks</span>
                                            <span className="text-[10px] font-medium text-emerald-600">{Math.round(plan.progress)}%</span>
                                          </div>
                                          <Progress value={plan.progress} className="h-1.5 [&>div]:bg-emerald-500" />
                                        </div>
                                      </div>
                                      <ChevronRight className="size-4 text-muted-foreground/50 shrink-0 mt-1" />
                                    </div>
                                  </motion.div>
                                )
                              })}
                            </div>
                          )}
                        </>
                      )}

                      {/* ─── SELECTED PLAN DETAIL VIEW ─── */}
                      {selectedPlan && (() => {
                        const plan = selectedPlan
                        const countdown = getCountdown(plan.examDate)
                        const tasksByDay = getTasksByDay(plan.tasks)
                        const todayTasks = plan.tasks.filter(t => t.date === todayStr)
                        const weeklyGoals = getWeeklyGoals(plan.tasks)
                        const milestones = getMilestones(plan.tasks)
                        const completedMilestones = milestones.filter(m => m.status === 'completed')

                        return (
                          <div className="space-y-4">
                            {/* Back button */}
                            <button
                              onClick={() => setSelectedPlanId(null)}
                              className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <ChevronRight className="size-3.5 rotate-180" />
                              Back to plans
                            </button>

                            {/* ═══ PLAN HEADER BAR ═══ */}
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-cyan-500/5 overflow-hidden">
                              <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 px-5 py-4 border-b border-emerald-500/20">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2.5">
                                    <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                                      <Calendar className="size-4" />
                                    </div>
                                    <div>
                                      <h3 className="text-sm font-bold text-foreground">{plan.courseName || plan.title}</h3>
                                      <p className="text-[11px] text-muted-foreground">AI-generated study schedule</p>
                                    </div>
                                  </div>
                                  {plan.status === 'active' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleAbandonPlan(plan.id)}
                                      className="gap-1.5 text-[11px] h-7 rounded-lg border-red-500/20 text-red-500 hover:bg-red-500/10"
                                    >
                                      <Trash2 className="size-3" />
                                      Abandon
                                    </Button>
                                  )}
                                  {plan.status === 'abandoned' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeletePlan(plan.id)}
                                      className="gap-1.5 text-[11px] h-7 rounded-lg border-red-500/20 text-red-500 hover:bg-red-500/10"
                                    >
                                      <Trash2 className="size-3" />
                                      Delete
                                    </Button>
                                  )}
                                </div>
                              </div>

                              <div className="p-5">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                  {/* Exam Countdown */}
                                  <div className="text-center p-3 rounded-xl bg-card border border-border/40">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                      <Timer className="size-3.5 text-amber-500" />
                                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Exam In</span>
                                    </div>
                                    <p className={cn(
                                      'text-2xl font-bold',
                                      countdown !== null && countdown <= 7 ? 'text-red-600' : 'text-foreground'
                                    )}>
                                      {countdown !== null ? countdown : '—'}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">days</p>
                                  </div>
                                  {/* Daily Hours */}
                                  <div className="text-center p-3 rounded-xl bg-card border border-border/40">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                      <Clock className="size-3.5 text-teal-500" />
                                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Daily</span>
                                    </div>
                                    <p className="text-2xl font-bold text-foreground">{plan.dailyHours}h</p>
                                    <p className="text-[10px] text-muted-foreground">per day</p>
                                  </div>
                                  {/* Grades */}
                                  <div className="text-center p-3 rounded-xl bg-card border border-border/40">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                      <Target className="size-3.5 text-emerald-500" />
                                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Grades</span>
                                    </div>
                                    <p className="text-lg font-bold text-foreground">
                                      {plan.currentGrade || '—'} → {plan.targetGrade || '—'}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">current → target</p>
                                  </div>
                                  {/* Overall Progress */}
                                  <div className="text-center p-3 rounded-xl bg-card border border-border/40">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                      <TrendingUp className="size-3.5 text-emerald-500" />
                                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Progress</span>
                                    </div>
                                    <p className="text-2xl font-bold text-emerald-600">{Math.round(plan.progress)}%</p>
                                    <p className="text-[10px] text-muted-foreground">{plan.completedTasks}/{plan.totalTasks} tasks</p>
                                  </div>
                                </div>

                                {/* Overall Progress Bar */}
                                <div className="mt-4">
                                  <Progress value={plan.progress} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-teal-500" />
                                </div>
                              </div>
                            </motion.div>

                            {/* ═══ TODAY'S TASKS ═══ */}
                            {todayTasks.length > 0 && plan.status === 'active' && (
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                                  <Flame className="size-4 text-orange-500" />
                                  Today&apos;s Tasks
                                  <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-[10px]">{todayTasks.filter(t => t.status === 'completed').length}/{todayTasks.length} done</Badge>
                                </h4>
                                <div className="space-y-2">
                                  {todayTasks.map(task => {
                                    const config = TASK_TYPE_CONFIG[task.taskType] || TASK_TYPE_CONFIG.study
                                    const Icon = config.icon
                                    return (
                                      <div
                                        key={task.id}
                                        className={cn(
                                          'flex items-center gap-3 rounded-xl border p-3 transition-all',
                                          task.status === 'completed' ? 'bg-muted/30 border-border/30 opacity-60' : 'bg-card border-border/40 hover:border-emerald-500/20'
                                        )}
                                      >
                                        <button
                                          onClick={() => handleToggleTask(task.id, task.status)}
                                          className={cn(
                                            'flex size-7 shrink-0 items-center justify-center rounded-lg border-2 transition-all',
                                            task.status === 'completed'
                                              ? 'bg-emerald-500 border-emerald-500 text-white'
                                              : 'border-muted-foreground/30 hover:border-emerald-500'
                                          )}
                                        >
                                          {task.status === 'completed' && <CheckCircle2 className="size-4" />}
                                        </button>
                                        <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', config.bg)}>
                                          <Icon className={cn('size-4', config.color)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className={cn('text-[12px] font-medium', task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground')}>
                                            {task.title}
                                          </p>
                                          {task.topic && <p className="text-[10px] text-muted-foreground">{task.topic}</p>}
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <Clock className="size-3 text-muted-foreground/50" />
                                          <span className="text-[11px] text-muted-foreground">{task.duration}min</span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </motion.div>
                            )}

                            {/* ═══ DAILY SCHEDULE TIMELINE ═══ */}
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                                <Route className="size-4 text-emerald-500" />
                                Daily Schedule Timeline
                              </h4>
                              <div className="space-y-1">
                                {Object.entries(tasksByDay)
                                  .sort(([a], [b]) => Number(a) - Number(b))
                                  .map(([dayNum, dayTasks]) => {
                                    const numDay = Number(dayNum)
                                    const isToday = dayTasks.some(t => t.date === todayStr)
                                    const isPast = dayTasks.every(t => t.date < todayStr)
                                    const allCompleted = dayTasks.every(t => t.status === 'completed')
                                    const isExpanded = expandedDays.has(numDay)

                                    return (
                                      <div key={dayNum} className={cn(
                                        'rounded-xl border transition-all',
                                        isToday ? 'border-emerald-500/30 bg-emerald-500/5' :
                                        isPast && allCompleted ? 'border-border/20 opacity-50' :
                                        'border-border/40 bg-card'
                                      )}>
                                        {/* Day header */}
                                        <button
                                          onClick={() => {
                                            setExpandedDays(prev => {
                                              const next = new Set(prev)
                                              if (next.has(numDay)) next.delete(numDay)
                                              else next.add(numDay)
                                              return next
                                            })
                                          }}
                                          className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/20 rounded-xl transition-colors"
                                        >
                                          {/* Day number circle */}
                                          <div className={cn(
                                            'flex size-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold',
                                            isToday ? 'bg-emerald-500 text-white' :
                                            allCompleted ? 'bg-teal-500/10 text-teal-600' :
                                            'bg-muted/50 text-muted-foreground'
                                          )}>
                                            {allCompleted ? <CheckCircle2 className="size-4" /> : numDay}
                                          </div>

                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                              <span className={cn(
                                                'text-[12px] font-medium',
                                                isToday ? 'text-emerald-600' : 'text-foreground'
                                              )}>
                                                Day {numDay}
                                              </span>
                                              {isToday && (
                                                <Badge className="bg-emerald-500 text-white text-[9px] px-1.5 py-0">Today</Badge>
                                              )}
                                              {allCompleted && !isToday && (
                                                <Badge className="bg-teal-500/10 text-teal-600 text-[9px] px-1.5 py-0">Completed</Badge>
                                              )}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">
                                              {dayTasks[0]?.date ? new Date(dayTasks[0].date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}
                                              {' · '}{dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}
                                              {' · '}{dayTasks.reduce((sum, t) => sum + t.duration, 0)}min
                                            </p>
                                          </div>

                                          {isExpanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                                        </button>

                                        {/* Expanded tasks */}
                                        <AnimatePresence>
                                          {isExpanded && (
                                            <motion.div
                                              initial={{ height: 0, opacity: 0 }}
                                              animate={{ height: 'auto', opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }}
                                              transition={{ duration: 0.15 }}
                                              className="overflow-hidden"
                                            >
                                              <div className="px-3 pb-3 space-y-1.5">
                                                {dayTasks.map(task => {
                                                  const config = TASK_TYPE_CONFIG[task.taskType] || TASK_TYPE_CONFIG.study
                                                  const Icon = config.icon
                                                  return (
                                                    <div
                                                      key={task.id}
                                                      className={cn(
                                                        'flex items-center gap-2.5 rounded-lg p-2.5 transition-all',
                                                        task.status === 'completed' ? 'bg-muted/20 opacity-60' : 'bg-muted/30 hover:bg-muted/50'
                                                      )}
                                                    >
                                                      <button
                                                        onClick={() => handleToggleTask(task.id, task.status)}
                                                        className={cn(
                                                          'flex size-5 shrink-0 items-center justify-center rounded border-2 transition-all',
                                                          task.status === 'completed'
                                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                                            : 'border-muted-foreground/30 hover:border-emerald-500'
                                                        )}
                                                      >
                                                        {task.status === 'completed' && <CheckCircle2 className="size-3" />}
                                                      </button>
                                                      <div className={cn('flex size-6 shrink-0 items-center justify-center rounded', config.bg)}>
                                                        <Icon className={cn('size-3', config.color)} />
                                                      </div>
                                                      <div className="flex-1 min-w-0">
                                                        <p className={cn(
                                                          'text-[11px] font-medium truncate',
                                                          task.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'
                                                        )}>
                                                          {task.title}
                                                        </p>
                                                        {task.description && (
                                                          <p className="text-[10px] text-muted-foreground truncate">{task.description}</p>
                                                        )}
                                                      </div>
                                                      <div className="flex items-center gap-1 shrink-0">
                                                        <Badge className={cn('text-[9px] px-1 py-0', config.bg, config.color, 'border-0')}>
                                                          {config.label}
                                                        </Badge>
                                                        <span className="text-[10px] text-muted-foreground">{task.duration}m</span>
                                                      </div>
                                                    </div>
                                                  )
                                                })}
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    )
                                  })}
                              </div>
                            </motion.div>

                            {/* ═══ WEEKLY GOALS ═══ */}
                            {weeklyGoals.length > 0 && (
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                                  <Layers className="size-4 text-emerald-500" />
                                  Weekly Goals
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {weeklyGoals.map(week => {
                                    const completedInWeek = week.tasks.filter(t => t.status === 'completed').length
                                    const weekProgress = week.tasks.length > 0 ? Math.round((completedInWeek / week.tasks.length) * 100) : 0
                                    const topicsInWeek = [...new Set(week.tasks.map(t => t.topic).filter(Boolean))]
                                    return (
                                      <div key={week.weekNum} className="rounded-xl border border-border/40 bg-card p-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-[12px] font-semibold text-foreground">{week.label}</span>
                                          <span className={cn(
                                            'text-[10px] font-medium',
                                            weekProgress >= 100 ? 'text-teal-600' : 'text-emerald-600'
                                          )}>
                                            {weekProgress}%
                                          </span>
                                        </div>
                                        <Progress value={weekProgress} className="h-1.5 mb-2 [&>div]:bg-emerald-500" />
                                        {topicsInWeek.length > 0 && (
                                          <div className="flex flex-wrap gap-1">
                                            {topicsInWeek.slice(0, 3).map((topic, i) => (
                                              <Badge key={i} variant="outline" className="text-[9px] px-1.5 py-0 bg-muted/30 border-border/30">
                                                {topic}
                                              </Badge>
                                            ))}
                                            {topicsInWeek.length > 3 && (
                                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-muted/30 border-border/30">
                                                +{topicsInWeek.length - 3}
                                              </Badge>
                                            )}
                                          </div>
                                        )}
                                        <p className="text-[10px] text-muted-foreground mt-1.5">
                                          {completedInWeek}/{week.tasks.length} tasks · {week.tasks.reduce((s, t) => s + t.duration, 0)}min total
                                        </p>
                                      </div>
                                    )
                                  })}
                                </div>
                              </motion.div>
                            )}

                            {/* ═══ MILESTONES ═══ */}
                            {milestones.length > 0 && (
                              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                                  <Trophy className="size-4 text-emerald-500" />
                                  Milestones
                                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">{completedMilestones.length}/{milestones.length}</Badge>
                                </h4>
                                <div className="relative">
                                  {/* Progress line */}
                                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border/40" />
                                  <div
                                    className="absolute left-4 top-0 w-0.5 bg-emerald-500 transition-all"
                                    style={{ height: milestones.length > 0 ? `${(completedMilestones.length / milestones.length) * 100}%` : '0%' }}
                                  />
                                  <div className="space-y-3">
                                    {milestones.map((milestone, i) => {
                                      const config = TASK_TYPE_CONFIG[milestone.taskType] || TASK_TYPE_CONFIG.study
                                      const Icon = config.icon
                                      const isCompleted = milestone.status === 'completed'
                                      return (
                                        <div key={milestone.id} className="flex items-start gap-3 relative">
                                          <div className={cn(
                                            'flex size-8 shrink-0 items-center justify-center rounded-full border-2 z-10 bg-card',
                                            isCompleted ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-border/40'
                                          )}>
                                            {isCompleted ? <CheckCircle2 className="size-4" /> : <Icon className={cn('size-3.5', config.color)} />}
                                          </div>
                                          <div className={cn(
                                            'flex-1 rounded-lg p-2.5 border',
                                            isCompleted ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-card border-border/40'
                                          )}>
                                            <div className="flex items-center gap-2">
                                              <span className={cn(
                                                'text-[11px] font-medium',
                                                isCompleted ? 'text-emerald-600 line-through' : 'text-foreground'
                                              )}>
                                                {milestone.title}
                                              </span>
                                              <Badge className={cn('text-[9px] px-1 py-0 border-0', config.bg, config.color)}>
                                                {config.label}
                                              </Badge>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                              Day {milestone.dayNumber} · {milestone.duration}min
                                              {milestone.topic && ` · ${milestone.topic}`}
                                            </p>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              </motion.div>
                            )}

                            {/* ═══ CREATE ANOTHER PLAN ═══ */}
                            {plan.status !== 'active' && (
                              <div className="flex justify-center pt-2">
                                <Button
                                  onClick={() => {
                                    setPlanForm(prev => ({
                                      ...prev,
                                      examDate: '',
                                      courseId: '',
                                      courseName: '',
                                      dailyHours: 2,
                                      targetGrade: '',
                                      currentGrade: '',
                                      weakTopics: planForm.weakTopics,
                                      strongTopics: planForm.strongTopics,
                                    }))
                                    setShowCreateForm(true)
                                    setSelectedPlanId(null)
                                  }}
                                  className="gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/20"
                                >
                                  <Plus className="size-4" />
                                  Create Another Plan
                                </Button>
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  )
                })()}
              </motion.div>
            )}

            {/* ─── Tab: AI Mock Interview ─── */}
            {activeTab === 'mock-interview' && (
              <motion.div
                key="mock-interview"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <MockInterviewTab userId={userId} onAskShijlAI={(ctx) => sendChatMessage(ctx)} />
              </motion.div>
            )}


          </AnimatePresence>
            </div>
          </div>

          {/* ═══ RIGHT: Ask ShijlAI Sidepanel (resizable on desktop) ═══ */}
          <ResizableSidepanel
        defaultWidth={340} minWidth={280} maxWidth={600} storageKey="shijlai-hub"
        header={
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 px-4 py-3 border-b border-border/30">
            <div className="flex items-center gap-2 pr-8">
              <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shrink-0">
                <GraduationCap className="size-3.5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[13px] font-bold text-foreground">Ask <ShijlAIText /></h3>
                <p className="text-[10px] text-muted-foreground">Your AI study companion</p>
              </div>
            </div>
          </div>
        }
      >
        {/* Mode Selector */}
        <div className="px-4 py-2 border-b border-border/20 shrink-0">
          <div className="flex items-center gap-1">
            {(['tutor', 'quiz', 'study_planner'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setChatMode(mode)}
                className={cn(
                  'text-[10px] px-2.5 py-1 rounded-full font-medium transition-all',
                  chatMode === mode
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                )}
              >
                {mode === 'tutor' ? 'Tutor' : mode === 'quiz' ? 'Quiz' : 'Planner'}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-3 space-y-3">
            {chatMessages.length === 0 && (
              <div className="text-center py-6">
                <GraduationCap className="size-8 text-emerald-500/30 mx-auto mb-2" />
                <p className="text-[11px] text-muted-foreground">Ask me anything about your learning!</p>
              </div>
            )}
            {chatMessages.map(msg => (
              <div key={msg.id} className={cn(
                'rounded-xl px-3 py-2 text-[12px] leading-relaxed max-w-[90%]',
                msg.role === 'user'
                  ? 'bg-emerald-500/10 text-foreground ml-auto'
                  : 'bg-muted/30 text-muted-foreground mr-auto'
              )}>
                {msg.role === 'assistant' ? (
                  <AiMessageRenderer content={msg.content} mode={chatMode === 'quiz' ? 'quiz' : chatMode === 'study_planner' ? 'planner' : 'tutor'} />
                ) : (
                  msg.content
                )}
              </div>
            ))}
            {chatLoading && (
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                <span><ShijlAIText /> is thinking...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Quick Actions */}
        {chatMessages.length === 0 && (
          <div className="px-3 pb-2 shrink-0">
            <div className="flex flex-wrap gap-1.5">
              {['Explain this', 'Quiz me', 'Study plan'].map(action => (
                <button
                  key={action}
                  onClick={() => {
                    if (action === 'Quiz me') {
                      setChatMode('quiz')
                      sendChatMessage('Give me a quiz to practice')
                    } else if (action === 'Study plan') {
                      setChatMode('study_planner')
                      sendChatMessage('Create a study plan for me')
                    } else {
                      setChatMode('tutor')
                      sendChatMessage('Explain my current learning topic')
                    }
                  }}
                  className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors border border-emerald-500/10"
                >
                  {action}
                </button>
              ))}
              <button
                onClick={() => {
                  const tabLabel = hubTabConfig.find(t => t.id === activeTab)?.label || 'this topic'
                  setChatMode('tutor')
                  sendChatMessage(`Tell me more about the ${tabLabel} tab I'm viewing`)
                }}
                className="text-[10px] px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-600 hover:bg-teal-500/20 transition-colors border border-teal-500/10"
              >
                Ask about this tab
              </button>
            </div>
          </div>
        )}

        {/* Chat Input */}
        <div className="p-3 border-t border-border/30 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
              placeholder="Ask ShijlAI..."
              className="flex-1 rounded-lg border border-border/40 bg-background px-3 py-2 text-[12px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
            />
            <Button
              size="sm"
              onClick={handleChatSend}
              disabled={!chatInput.trim() || chatLoading}
              className="size-8 p-0 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shrink-0"
            >
              <Send className="size-3.5" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-[10px] text-emerald-600 hover:bg-emerald-500/10 h-7"
            onClick={() => {
              setChatMessages([])
              setChatSessionId(null)
              toast.success('Chat cleared')
            }}
          >
            <Plus className="size-3 mr-1" />
            New Chat
          </Button>
        </div>
      </ResizableSidepanel>
        </>
      )}

      {/* ═══ MOBILE: Floating Ask ShijlAI FAB + Overlay — hidden when Companion tab is active ═══ */}
      {activeTab !== 'companion' && (
        <>
          <button
            onClick={() => setMobileChatOpen(true)}
            className="fixed bottom-6 right-6 z-40 lg:hidden flex size-14 items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-teal-700 transition-all active:scale-95"
          >
            <MessageSquare className="size-6" />
          </button>

      <AnimatePresence>
        {mobileChatOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileChatOpen(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-full max-w-[360px] bg-card flex flex-col">
              {/* Mobile Sidepanel Header */}
              <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 px-4 py-3 border-b border-border/30 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
                      <GraduationCap className="size-3.5" />
                    </div>
                    <h3 className="text-[13px] font-bold text-foreground">Ask <ShijlAIText /></h3>
                  </div>
                  <button onClick={() => setMobileChatOpen(false)} className="p-1 rounded-lg hover:bg-muted/50">
                    <X className="size-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {(['tutor', 'quiz', 'study_planner'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setChatMode(mode)}
                      className={cn(
                        'text-[10px] px-2.5 py-1 rounded-full font-medium transition-all',
                        chatMode === mode
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                      )}
                    >
                      {mode === 'tutor' ? 'Tutor' : mode === 'quiz' ? 'Quiz' : 'Planner'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Chat Messages */}
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <div className="p-3 space-y-3">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-8">
                      <GraduationCap className="size-10 text-emerald-500/30 mx-auto mb-3" />
                      <p className="text-[12px] text-muted-foreground">Ask me anything about your learning!</p>
                      <div className="flex flex-wrap gap-2 justify-center mt-3">
                        {['Explain this', 'Quiz me', 'Study plan'].map(action => (
                          <button
                            key={action}
                            onClick={() => {
                              if (action === 'Quiz me') {
                                setChatMode('quiz')
                                sendChatMessage('Give me a quiz to practice')
                              } else if (action === 'Study plan') {
                                setChatMode('study_planner')
                                sendChatMessage('Create a study plan for me')
                              } else {
                                setChatMode('tutor')
                                sendChatMessage('Explain my current learning topic')
                              }
                            }}
                            className="text-[11px] px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors border border-emerald-500/10"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {chatMessages.map(msg => (
                    <div key={msg.id} className={cn(
                      'rounded-xl px-3 py-2 text-[13px] leading-relaxed max-w-[85%]',
                      msg.role === 'user'
                        ? 'bg-emerald-500/10 text-foreground ml-auto'
                        : 'bg-muted/30 text-muted-foreground mr-auto'
                    )}>
                      {msg.role === 'assistant' ? (
                        <AiMessageRenderer content={msg.content} mode={chatMode === 'quiz' ? 'quiz' : chatMode === 'study_planner' ? 'planner' : 'tutor'} />
                      ) : (
                        msg.content
                      )}
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Loader2 className="size-3 animate-spin" />
                      <span><ShijlAIText /> is thinking...</span>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </div>

              {/* Mobile Chat Input */}
              <div className="p-3 border-t border-border/30 shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                    placeholder="Ask ShijlAI..."
                    className="flex-1 rounded-lg border border-border/40 bg-background px-3 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                  />
                  <Button
                    size="sm"
                    onClick={handleChatSend}
                    disabled={!chatInput.trim() || chatLoading}
                    className="size-9 p-0 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shrink-0"
                  >
                    <Send className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
        </>
      )}
    </div>
  )
}
