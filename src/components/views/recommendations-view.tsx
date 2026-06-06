'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  BookOpen,
  Brain,
  Calendar,
  Target,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  TrendingUp,
  AlertTriangle,
  Zap,
  Route,
  BarChart3,
  ArrowRight,
  Loader2,
  Lightbulb,
  GraduationCap,
  Layers,
  Star,
  ExternalLink,
  SortAsc,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  Bookmark,
  BookmarkCheck,
  RotateCcw,
  Shield,
  Trophy,
  Send,
  MessageSquare,
  Plus,
  X,
  Flame,
  TrendingDown,
  Minus,
  Play,
  Network,
  CircleDot,
  ChevronRight,
} from 'lucide-react'
import { ShijlAIText } from '@/components/ui/brand-text'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { AiMessageRenderer } from '@/components/ai/ai-message-renderer'
import { ResizableSidepanel } from '@/components/resizable-sidepanel'
import { SkillGraphTab } from '@/components/skill-graph'
import { LearningPathTab } from '@/components/learning-path-tab'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

/* ─── Types ─── */
interface Recommendation {
  id: string
  type: string
  title: string
  description: string | null
  reason: string | null
  priority: string
  priorityScore: number
  status: string
  sourceEvent: string | null
  recommendedTopicId: string | null
  recommendedCourseId: string | null
  relatedId: string | null
  relatedType: string | null
  createdAt: string
}

interface LearningProfile {
  level: string
  engagementScore: number
  consistencyScore: number
  learningSpeedScore: number
  dropRiskScore: number
  completionRate: number
  averageQuizScore: number
  weakTopics: string[]
  strongTopics: string[]
  studyStreakDays: number
  totalLessonsCompleted: number
}

interface TopicMastery {
  id: string
  topicId: string
  topicName: string
  courseId?: string | null
  skillId?: string | null
  quizScore: number       // Quiz performance (50% weight)
  assignmentScore: number  // Assignment performance (25% weight)
  practiceScore: number    // Practice quiz results (15% weight)
  completionScore: number  // Lesson completion (10% weight)
  masteryScore: number
  status: string          // not_started, weak, learning, strong, mastered
  questionsAttempted: number
  questionsCorrect: number
  attemptCount: number
  trend: string
  lastAttempted: string
}

interface SkillMastery {
  skillId: string
  skillName: string
  category: string
  skillScore: number
  status: string
  topicCount: number
  topics: {
    topicId: string
    topicName: string
    masteryScore: number
    status: string
    trend: string
  }[]
}

interface MasteryInsight {
  totalTopics: number
  averageMastery: number
  insights: string[]
  weakTopics: { topicId: string; name: string; score: number; status: string; trend: string; questionsAttempted: number; questionsCorrect: number }[]
  strongTopics: { topicId: string; name: string; score: number; status: string; trend: string }[]
  mistakeConcentration: number | null
}

interface Enrollment {
  id: string
  courseId: string
  progress: number
  enrolledAt: string
  lastAccessed: string
  course?: {
    id: string
    title: string
    category: string
    level: string
    thumbnail: string | null
    estimatedDuration: number
    modules?: {
      id: string
      title: string
      order: number
      lessons?: {
        id: string
        title: string
        order: number
        duration: number
      }[]
    }[]
  }
  lessonProgress?: {
    id: string
    status: string
    lesson?: {
      id: string
      title: string
      moduleId: string
    }
  }[]
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

/* ─── Config ─── */
const priorityConfig: Record<string, { color: string; bgColor: string; borderColor: string; label: string; glow: string }> = {
  high: { color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20', label: 'High Priority', glow: 'shadow-red-500/5' },
  medium: { color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20', label: 'Medium Priority', glow: 'shadow-amber-500/5' },
  low: { color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', label: 'Low Priority', glow: 'shadow-emerald-500/5' },
}

const typeConfig: Record<string, { icon: typeof BookOpen; color: string; bgColor: string; label: string }> = {
  lesson: { icon: BookOpen, color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-500/10', label: 'Lesson' },
  quiz: { icon: Brain, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10', label: 'Quiz' },
  course: { icon: Target, color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-500/10', label: 'Course' },
  topic: { icon: Sparkles, color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-500/10', label: 'Topic' },
  study_plan: { icon: Calendar, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10', label: 'Study Plan' },
}

const statusConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  active: { color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10', label: 'Active' },
  pending: { color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10', label: 'Pending' },
  viewed: { color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-500/10', label: 'Viewed' },
  dismissed: { color: 'text-slate-500', bgColor: 'bg-slate-500/10', label: 'Dismissed' },
  completed: { color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10', label: 'Completed' },
}

type FilterStatus = 'all' | 'active' | 'completed' | 'dismissed'
type FilterPriority = 'all' | 'high' | 'medium' | 'low'
type FilterType = 'all' | 'lesson' | 'quiz' | 'course' | 'topic' | 'study_plan'
type SortBy = 'priority' | 'date' | 'type'
type ViewMode = 'grid' | 'list'
type InsightTab = 'topic-mastery' | 'skills-graph' | 'recommendations' | 'learning-path'

const tabConfig: { id: InsightTab; label: string; icon: typeof Lightbulb }[] = [
  { id: 'topic-mastery', label: 'Topic Mastery', icon: BarChart3 },
  { id: 'skills-graph', label: 'Skills Graph', icon: Network },
  { id: 'recommendations', label: 'Recommendations', icon: Lightbulb },
  { id: 'learning-path', label: 'Learning Path', icon: Route },
]

/* ─── Helpers ─── */
function timeAgo(dateStr: string): string {
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

function getDropRiskLevel(score: number): { label: string; color: string; bgColor: string } {
  if (score < 30) return { label: 'Safe', color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10' }
  if (score < 60) return { label: 'Warning', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10' }
  return { label: 'High Risk', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-500/10' }
}

function getMasteryColor(score: number): { text: string; bar: string; bg: string } {
  if (score >= 90) return { text: 'text-emerald-600 dark:text-emerald-400', bar: '[&>div]:bg-emerald-500', bg: 'bg-emerald-500/10' }
  if (score >= 75) return { text: 'text-teal-600 dark:text-teal-400', bar: '[&>div]:bg-teal-500', bg: 'bg-teal-500/10' }
  if (score >= 50) return { text: 'text-amber-600 dark:text-amber-400', bar: '[&>div]:bg-amber-500', bg: 'bg-amber-500/10' }
  if (score >= 25) return { text: 'text-orange-600 dark:text-orange-400', bar: '[&>div]:bg-orange-500', bg: 'bg-orange-500/10' }
  return { text: 'text-red-600 dark:text-red-400', bar: '[&>div]:bg-red-500', bg: 'bg-red-500/10' }
}

function getStatusColor(status: string): { text: string; bg: string; border: string; dot: string } {
  switch (status) {
    case 'mastered': return { text: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-500' }
    case 'strong': return { text: 'text-teal-700 dark:text-teal-300', bg: 'bg-teal-500/10', border: 'border-teal-500/20', dot: 'bg-teal-500' }
    case 'learning': return { text: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/20', dot: 'bg-amber-500' }
    case 'weak': return { text: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-500/10', border: 'border-orange-500/20', dot: 'bg-orange-500' }
    default: return { text: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', dot: 'bg-slate-400' }
  }
}

function getTrendIcon(trend: string) {
  if (trend === 'improving') return <TrendingUp className="size-3 text-emerald-500" />
  if (trend === 'declining') return <TrendingDown className="size-3 text-red-500" />
  return <Minus className="size-3 text-slate-400" />
}

function getTrendLabel(trend: string): string {
  if (trend === 'improving') return 'Improving'
  if (trend === 'declining') return 'Declining'
  return 'Stable'
}



/* ═══════════════════════════════════════════════════════════
   AI INSIGHTS VIEW — Tabbed Page with Ask ShijlAI Sidepanel
   ═══════════════════════════════════════════════════════════ */
export function RecommendationsView() {
  const { currentUser } = useAppStore()
  const userId = currentUser?.id || 'demo-user-1'

  // Tab state
  const [activeTab, setActiveTab] = useState<InsightTab>('topic-mastery')

  // Recommendations state
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [allRecommendations, setAllRecommendations] = useState<Recommendation[]>([])
  const [profile, setProfile] = useState<LearningProfile | null>(null)
  const [topicMasteries, setTopicMasteries] = useState<TopicMastery[]>([])
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('all')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [sortBy, setSortBy] = useState<SortBy>('priority')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())

  // Learning Path state
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false)

  // Mastery state (for dedicated tab)
  const [masteryLoading, setMasteryLoading] = useState(false)
  const [skillMasteries, setSkillMasteries] = useState<SkillMastery[]>([])
  const [masteryInsights, setMasteryInsights] = useState<MasteryInsight | null>(null)
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null)
  const [masteryFilter, setMasteryFilter] = useState<'all' | 'weak' | 'learning' | 'strong' | 'mastered'>('all')


  // Sidepanel chat state
  const [mobileChatOpen, setMobileChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatSessionId, setChatSessionId] = useState<string | null>(null)
  const [chatMode, setChatMode] = useState<'tutor' | 'quiz' | 'study_planner'>('tutor')
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Load data
  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [recsRes, profileRes] = await Promise.all([
        fetch(`/api/ai/shijlai/recommendations?userId=${userId}&status=active`),
        fetch(`/api/ai/shijlai/profile?userId=${userId}`),
      ])

      if (recsRes.ok) {
        const data = await recsRes.json()
        const recs = data.recommendations && data.recommendations.length > 0
          ? data.recommendations
          : getDemoRecommendations()
        setRecommendations(recs)
        setAllRecommendations(recs)
      } else {
        const demo = getDemoRecommendations()
        setRecommendations(demo)
        setAllRecommendations(demo)
      }

      if (profileRes.ok) {
        const data = await profileRes.json()
        const rawProfile = data.profile
        if (rawProfile) {
          let weakTopicsArr: string[] = []
          let strongTopicsArr: string[] = []
          try { weakTopicsArr = JSON.parse(rawProfile.weakTopics || '[]') } catch { /* empty */ }
          try { strongTopicsArr = JSON.parse(rawProfile.strongTopics || '[]') } catch { /* empty */ }
          setProfile({
            level: rawProfile.learningLevel || 'intermediate',
            engagementScore: rawProfile.engagementScore || 45,
            consistencyScore: rawProfile.consistencyScore || 55,
            learningSpeedScore: rawProfile.learningSpeedScore || 60,
            dropRiskScore: rawProfile.dropRiskScore || 25,
            completionRate: rawProfile.completionRate || 0,
            averageQuizScore: rawProfile.averageQuizScore || 0,
            weakTopics: weakTopicsArr,
            strongTopics: strongTopicsArr,
            studyStreakDays: rawProfile.studyStreakDays || 0,
            totalLessonsCompleted: rawProfile.totalLessonsCompleted || 0,
          })
        } else {
          setProfile(getDemoProfile())
        }

        if (data.topicMasteries) {
          setTopicMasteries(data.topicMasteries)
        }
      } else {
        setProfile(getDemoProfile())
      }
    } catch {
      const demo = getDemoRecommendations()
      setRecommendations(demo)
      setAllRecommendations(demo)
      setProfile(getDemoProfile())
    } finally {
      setLoading(false)
    }
  }


  // Load enrollments for Learning Path tab
  useEffect(() => {
    if (activeTab === 'learning-path' && enrollments.length === 0) {
      loadEnrollments()
    }
  }, [activeTab])

  const loadEnrollments = async () => {
    setEnrollmentsLoading(true)
    try {
      const res = await fetch(`/api/enrollments?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setEnrollments(data.enrollments || data || [])
      } else {
        setEnrollments(getDemoEnrollments())
      }
    } catch {
      setEnrollments(getDemoEnrollments())
    } finally {
      setEnrollmentsLoading(false)
    }
  }

  // Load mastery for dedicated tab
  useEffect(() => {
    if (activeTab === 'topic-mastery' && topicMasteries.length === 0) {
      loadMastery()
    }
  }, [activeTab])

  const loadMastery = async () => {
    setMasteryLoading(true)
    try {
      const res = await fetch(`/api/ai/shijlai/mastery?userId=${userId}&include=skills,insights`)
      if (res.ok) {
        const data = await res.json()
        if (data.masteries && data.masteries.length > 0) {
          setTopicMasteries(data.masteries)
        } else {
          // Try seeding first
          const seedRes = await fetch('/api/ai/shijlai/mastery/seed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          })
          if (seedRes.ok) {
            // Reload after seeding
            const retryRes = await fetch(`/api/ai/shijlai/mastery?userId=${userId}&include=skills,insights`)
            if (retryRes.ok) {
              const retryData = await retryRes.json()
              setTopicMasteries(retryData.masteries || getDemoMasteries())
              setSkillMasteries(retryData.skills || [])
              setMasteryInsights(retryData.insights || null)
            }
          } else {
            setTopicMasteries(getDemoMasteries())
          }
        }
        if (data.skills) setSkillMasteries(data.skills)
        if (data.insights) setMasteryInsights(data.insights)
      } else {
        setTopicMasteries(getDemoMasteries())
      }
    } catch {
      setTopicMasteries(getDemoMasteries())
    } finally {
      setMasteryLoading(false)
    }
  }

  // Also load dismissed/completed for filtering
  useEffect(() => {
    if (filterStatus !== 'all' && filterStatus !== 'active') {
      loadArchivedRecommendations()
    }
  }, [filterStatus])

  const loadArchivedRecommendations = async () => {
    try {
      const res = await fetch(`/api/ai/shijlai/recommendations?userId=${userId}&status=${filterStatus}`)
      if (res.ok) {
        const data = await res.json()
        setRecommendations(data.recommendations || [])
      }
    } catch {
      // silently fail
    }
  }

  // Apply filters
  useEffect(() => {
    let filtered = filterStatus === 'all' ? allRecommendations : recommendations

    if (filterPriority !== 'all') {
      filtered = filtered.filter(r => r.priority === filterPriority)
    }
    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.type === filterType)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        (r.reason || '').toLowerCase().includes(q)
      )
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'priority') return (b.priorityScore || 0) - (a.priorityScore || 0)
      if (sortBy === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'type') return a.type.localeCompare(b.type)
      return 0
    })

    setRecommendations(sorted)
  }, [filterPriority, filterType, sortBy, searchQuery])

  // Actions
  const handleDismiss = async (recId: string) => {
    try {
      await fetch('/api/ai/shijlai/recommendations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId: recId, status: 'dismissed' }),
      })
      setRecommendations(prev => prev.filter(r => r.id !== recId))
      setAllRecommendations(prev => prev.filter(r => r.id !== recId))
      toast.success('Recommendation dismissed')
    } catch {
      toast.error('Failed to dismiss')
    }
  }

  const handleComplete = async (recId: string) => {
    try {
      await fetch('/api/ai/shijlai/recommendations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId: recId, status: 'completed' }),
      })
      setRecommendations(prev => prev.map(r => r.id === recId ? { ...r, status: 'completed' } : r))
      setAllRecommendations(prev => prev.map(r => r.id === recId ? { ...r, status: 'completed' } : r))
      toast.success('Great job! Recommendation marked as completed 🎉')
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleStart = (rec: Recommendation) => {
    fetch('/api/ai/shijlai/recommendations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recommendationId: rec.id, status: 'viewed' }),
    }).catch(() => {})

    if (rec.recommendedCourseId) {
      useAppStore.getState().setCurrentView('course-detail')
      toast.success(`Opening: ${rec.title}`)
    } else {
      const promptMap: Record<string, string> = {
        quiz: `I'd like to practice with a quiz about: ${rec.title}. ${rec.reason ? `Context: ${rec.reason}` : ''}`,
        study_plan: `Help me create a study plan for: ${rec.title}. ${rec.reason ? `Context: ${rec.reason}` : ''}`,
        topic: `Help me understand: ${rec.title}. ${rec.reason ? `Context: ${rec.reason}` : ''}`,
        lesson: `I want to learn about: ${rec.title}. ${rec.reason ? `Context: ${rec.reason}` : ''}`,
      }
      const chatPrompt = promptMap[rec.type] || `Help me with: ${rec.title}. ${rec.reason ? `Context: ${rec.reason}` : ''}`

      if (rec.type === 'quiz') setChatMode('quiz')
      else if (rec.type === 'study_plan') setChatMode('study_planner')
      else setChatMode('tutor')

      sendChatMessage(chatPrompt)
      toast.success(`Asking ShijlAI about: ${rec.title}`)
    }
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const res = await fetch('/api/ai/shijlai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.recommendations && data.recommendations.length > 0) {
          setRecommendations(data.recommendations)
          setAllRecommendations(data.recommendations)
          toast.success(`Generated ${data.recommendations.length} new recommendations`)
        } else {
          toast.info('No new recommendations at this time')
        }
      }
    } catch {
      toast.error('Failed to regenerate recommendations')
    } finally {
      setRegenerating(false)
    }
  }

  const handleRestore = async (recId: string) => {
    try {
      await fetch('/api/ai/shijlai/recommendations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId: recId, status: 'active' }),
      })
      setRecommendations(prev => prev.map(r => r.id === recId ? { ...r, status: 'active' } : r))
      toast.success('Recommendation restored')
    } catch {
      toast.error('Failed to restore')
    }
  }

  const toggleBookmark = (recId: string) => {
    setBookmarkedIds(prev => {
      const next = new Set(prev)
      if (next.has(recId)) {
        next.delete(recId)
        toast.info('Bookmark removed')
      } else {
        next.add(recId)
        toast.success('Bookmarked!')
      }
      return next
    })
  }

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

  // Stats
  const activeRecs = allRecommendations.filter(r => r.status === 'active')
  const highPriorityCount = activeRecs.filter(r => r.priority === 'high').length
  const completedCount = allRecommendations.filter(r => r.status === 'completed').length
  const riskLevel = profile ? getDropRiskLevel(profile.dropRiskScore) : null


  /* ═══ RENDER ═══ */
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
            <Brain className="size-7 animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin text-emerald-500" />
            <span className="text-sm text-muted-foreground">Analyzing your learning patterns...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* ═══ LEFT: Main Content (scrollable) ═══ */}
      <div className="flex-1 min-w-0 overflow-y-auto scrollbar-thin p-4 md:p-6">
        <div className="space-y-6 pb-8">
          {/* ═══ HEADER ═══ */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
                  <Brain className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">AI Insights</h1>
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] px-2 py-0.5">&#10022; AI-powered</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Personalized learning intelligence based on your unique profile</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={handleRegenerate}
                disabled={regenerating}
                variant="outline"
                className="gap-2 rounded-xl border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10"
              >
                <RefreshCw className={cn('size-4', regenerating && 'animate-spin')} />
                {regenerating ? 'Analyzing...' : 'Refresh'}
              </Button>
            </div>
          </div>

      {/* ═══ STATS ROW ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-border/40 bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Route className="size-4" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Active</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{activeRecs.length}</p>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">recommendations</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border/40 bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
              <AlertTriangle className="size-4" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Urgent</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{highPriorityCount}</p>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">high priority</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-border/40 bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <CheckCircle2 className="size-4" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Done</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{completedCount}</p>
          <p className="text-[11px] text-muted-foreground/70 mt-0.5">completed</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border/40 bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn('flex size-8 items-center justify-center rounded-lg', riskLevel?.bgColor || 'bg-amber-500/10', riskLevel?.color || 'text-amber-600')}>
              <Shield className="size-4" />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Risk</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{Math.round(profile?.dropRiskScore || 0)}%</p>
          <p className={cn('text-[11px] mt-0.5', riskLevel?.color || 'text-muted-foreground')}>{riskLevel?.label || 'Unknown'}</p>
        </motion.div>
      </div>

      {/* ═══ TAB BAR ═══ */}
      <div className="border-b border-border/40">
        <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabConfig.map(tab => {
            const TabIcon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
                  isActive
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
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

          {/* ═══ TAB CONTENT ═══ */}
          <AnimatePresence mode="wait">
            {/* ─── Tab 1: Recommendations ─── */}
            {activeTab === 'recommendations' && (
              <motion.div
                key="recommendations"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Filters Bar */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                    <input
                      type="text"
                      placeholder="Search recommendations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-border/40 bg-card pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 transition-all"
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
                      <SelectTrigger className="w-[120px] h-10 rounded-xl text-xs">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="dismissed">Dismissed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as FilterPriority)}>
                      <SelectTrigger className="w-[120px] h-10 rounded-xl text-xs">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
                      <SelectTrigger className="w-[120px] h-10 rounded-xl text-xs">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="lesson">Lessons</SelectItem>
                        <SelectItem value="quiz">Quizzes</SelectItem>
                        <SelectItem value="course">Courses</SelectItem>
                        <SelectItem value="topic">Topics</SelectItem>
                        <SelectItem value="study_plan">Study Plans</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center border border-border/40 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setViewMode('list')}
                        className={cn('p-2 transition-colors', viewMode === 'list' ? 'bg-emerald-500/10 text-emerald-600' : 'text-muted-foreground hover:text-foreground')}
                      >
                        <List className="size-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={cn('p-2 transition-colors', viewMode === 'grid' ? 'bg-emerald-500/10 text-emerald-600' : 'text-muted-foreground hover:text-foreground')}
                      >
                        <LayoutGrid className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Results count + sort */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Showing {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''}
                    {filterPriority !== 'all' && ` · ${filterPriority} priority`}
                    {filterType !== 'all' && ` · ${filterType}`}
                  </p>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                    <SelectTrigger className="w-[140px] h-8 rounded-lg text-[11px] border-0 bg-muted/50">
                      <SortAsc className="size-3 mr-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="priority">By Priority</SelectItem>
                      <SelectItem value="date">By Date</SelectItem>
                      <SelectItem value="type">By Type</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Recommendation Cards */}
                {recommendations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-border/40">
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4">
                      <Lightbulb className="size-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">No recommendations yet</h3>
                    <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
                      Start learning and <ShijlAIText /> will analyze your patterns to provide personalized recommendations.
                    </p>
                    <Button
                      onClick={handleRegenerate}
                      disabled={regenerating}
                      variant="outline"
                      className="gap-2 rounded-xl"
                    >
                      <RefreshCw className={cn('size-4', regenerating && 'animate-spin')} />
                      Generate Recommendations
                    </Button>
                  </div>
                ) : (
                  <div className={cn(
                    viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-3'
                  )}>
                    <AnimatePresence mode="popLayout">
                      {recommendations.map((rec, i) => (
                        <RecommendationCard
                          key={rec.id}
                          rec={rec}
                          index={i}
                          viewMode={viewMode}
                          expanded={expandedId === rec.id}
                          bookmarked={bookmarkedIds.has(rec.id)}
                          onToggleExpand={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
                          onToggleBookmark={() => toggleBookmark(rec.id)}
                          onStart={() => handleStart(rec)}
                          onDismiss={() => handleDismiss(rec.id)}
                          onComplete={() => handleComplete(rec.id)}
                          onRestore={() => handleRestore(rec.id)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── Tab 2: Learning Path ─── */}
            {activeTab === 'learning-path' && (
              <motion.div
                key="learning-path"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <LearningPathTab
                  userId={userId}
                  onAskShijlAI={(ctx) => sendChatMessage(ctx)}
                />
              </motion.div>
            )}

            {/* ─── Tab 3: Topic Mastery ─── */}
            {activeTab === 'topic-mastery' && (
              <motion.div
                key="topic-mastery"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Intelligent Insights Banner */}
                {masteryInsights && masteryInsights.insights.length > 0 && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-cyan-500/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm shrink-0">
                        <Brain className="size-4" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-[12px] font-bold text-foreground">AI Insights</h4>
                        {masteryInsights.insights.map((insight, i) => (
                          <p key={i} className="text-[11px] text-muted-foreground leading-relaxed">{insight}</p>
                        ))}
                        {masteryInsights.mistakeConcentration !== null && masteryInsights.mistakeConcentration > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 max-w-[200px]">
                              <div className="flex items-center justify-between text-[10px] mb-1">
                                <span className="text-muted-foreground">Mistake Concentration</span>
                                <span className="font-bold text-orange-600">{masteryInsights.mistakeConcentration}%</span>
                              </div>
                              <Progress value={masteryInsights.mistakeConcentration} className="h-1.5 [&>div]:bg-orange-500" />
                            </div>
                            <span className="text-[10px] text-muted-foreground">from weak topics</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Status Distribution */}
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { status: 'mastered', label: 'Mastered', range: '90-100%', emoji: '🟢' },
                    { status: 'strong', label: 'Strong', range: '75-90%', emoji: '🔵' },
                    { status: 'learning', label: 'Learning', range: '50-75%', emoji: '🟡' },
                    { status: 'weak', label: 'Weak', range: '25-50%', emoji: '🔴' },
                    { status: 'not_started', label: 'New', range: '0-25%', emoji: '⚪' },
                  ].map(s => {
                    const count = topicMasteries.filter(t => t.status === s.status).length
                    const sc = getStatusColor(s.status)
                    const isActive = masteryFilter === s.status
                    return (
                      <button
                        key={s.status}
                        onClick={() => setMasteryFilter(isActive ? 'all' : s.status as typeof masteryFilter)}
                        className={cn(
                          'rounded-xl border p-2.5 text-center transition-all',
                          isActive ? cn(sc.border, sc.bg, 'ring-1 ring-current') : 'border-border/40 bg-card hover:border-border/70'
                        )}
                      >
                        <p className={cn('text-lg font-bold', isActive ? sc.text : 'text-foreground')}>{count}</p>
                        <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">{s.label}</p>
                        <p className="text-[8px] text-muted-foreground/50">{s.range}</p>
                      </button>
                    )
                  })}
                </div>

                {/* Weighted Formula Legend */}
                <div className="rounded-xl border border-border/30 bg-muted/30 px-4 py-2.5 flex items-center gap-4 text-[10px]">
                  <span className="font-semibold text-muted-foreground">Mastery Formula:</span>
                  <span className="text-emerald-600">Quiz 50%</span>
                  <span className="text-muted-foreground/30">+</span>
                  <span className="text-violet-600">Assign 25%</span>
                  <span className="text-muted-foreground/30">+</span>
                  <span className="text-cyan-600">Practice 15%</span>
                  <span className="text-muted-foreground/30">+</span>
                  <span className="text-amber-600">Complete 10%</span>
                </div>

                {masteryLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="rounded-xl border border-border/40 bg-card p-4 animate-pulse">
                        <div className="h-4 bg-muted/50 rounded w-1/3 mb-3" />
                        <div className="h-2 bg-muted/30 rounded w-full" />
                      </div>
                    ))}
                  </div>
                ) : topicMasteries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-dashed border-border/40">
                    <BarChart3 className="size-10 text-muted-foreground/30 mb-3" />
                    <h3 className="text-sm font-semibold text-foreground mb-1">No mastery data yet</h3>
                    <p className="text-xs text-muted-foreground">Complete quizzes and lessons to build your mastery profile</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topicMasteries
                      .filter(t => masteryFilter === 'all' || t.status === masteryFilter)
                      .sort((a, b) => a.masteryScore - b.masteryScore)
                      .map((tm) => {
                        const colors = getMasteryColor(tm.masteryScore)
                        const sc = getStatusColor(tm.status)
                        const isExpanded = expandedTopicId === tm.id
                        const accuracy = tm.questionsAttempted > 0 ? Math.round((tm.questionsCorrect / tm.questionsAttempted) * 100) : 0
                        return (
                          <div key={tm.id} className="rounded-xl border border-border/40 bg-card overflow-hidden">
                            {/* Topic Header Row */}
                            <button
                              onClick={() => setExpandedTopicId(isExpanded ? null : tm.id)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
                            >
                              <div className={cn('size-2.5 rounded-full shrink-0', sc.dot)} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[12px] font-medium text-foreground truncate">{tm.topicName}</span>
                                  {getTrendIcon(tm.trend)}
                                </div>
                                <Progress value={tm.masteryScore} className={cn('h-1.5 mt-1.5', colors.bar)} />
                              </div>
                              <span className={cn('text-[12px] font-bold shrink-0 w-10 text-right', colors.text)}>
                                {Math.round(tm.masteryScore)}%
                              </span>
                              <Badge variant="outline" className={cn('text-[9px] px-1.5 py-0 shrink-0', sc.text, sc.bg, sc.border)}>
                                {tm.status.replace('_', ' ')}
                              </Badge>
                              <ChevronDown className={cn('size-3.5 text-muted-foreground shrink-0 transition-transform', isExpanded && 'rotate-180')} />
                            </button>

                            {/* Expanded: Weighted Breakdown */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-4 pb-3 pt-1 border-t border-border/20 space-y-3">
                                    {/* Weighted Breakdown */}
                                    <div className="grid grid-cols-4 gap-2">
                                      {[
                                        { label: 'Quiz', score: tm.quizScore, weight: '50%', color: 'text-emerald-600', bar: '[&>div]:bg-emerald-500', bg: 'bg-emerald-500/10' },
                                        { label: 'Assignment', score: tm.assignmentScore, weight: '25%', color: 'text-violet-600', bar: '[&>div]:bg-violet-500', bg: 'bg-violet-500/10' },
                                        { label: 'Practice', score: tm.practiceScore, weight: '15%', color: 'text-cyan-600', bar: '[&>div]:bg-cyan-500', bg: 'bg-cyan-500/10' },
                                        { label: 'Completion', score: tm.completionScore, weight: '10%', color: 'text-amber-600', bar: '[&>div]:bg-amber-500', bg: 'bg-amber-500/10' },
                                      ].map(comp => (
                                        <div key={comp.label} className={cn('rounded-lg p-2', comp.bg)}>
                                          <div className="flex items-center justify-between mb-1">
                                            <span className={cn('text-[10px] font-medium', comp.color)}>{comp.label}</span>
                                            <span className="text-[9px] text-muted-foreground">×{comp.weight}</span>
                                          </div>
                                          <Progress value={comp.score} className={cn('h-1', comp.bar)} />
                                          <p className={cn('text-[11px] font-bold mt-1', comp.color)}>{Math.round(comp.score)}%</p>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Questions Stats + Actions */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                        <span>{tm.questionsAttempted} questions attempted</span>
                                        <span>{tm.questionsCorrect} correct</span>
                                        <span className={cn('font-medium', accuracy >= 75 ? 'text-emerald-600' : accuracy >= 50 ? 'text-amber-600' : 'text-red-600')}>
                                          {accuracy}% accuracy
                                        </span>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 text-[10px] gap-1 text-emerald-600 hover:bg-emerald-500/10"
                                        onClick={() => {
                                          setChatMode('tutor')
                                          sendChatMessage(`Help me understand ${tm.topicName}. My current mastery is ${Math.round(tm.masteryScore)}% and I struggle most with the ${tm.quizScore < tm.completionScore ? 'quiz' : 'application'} aspects.`)
                                        }}
                                      >
                                        <Lightbulb className="size-3" />
                                        Get Help
                                      </Button>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )
                      })}
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── Tab: Skills Graph ─── */}
            {activeTab === 'skills-graph' && (
              <motion.div
                key="skills-graph"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <SkillGraphTab
                  userId={userId}
                  onAskShijlAI={(context) => {
                    sendChatMessage(`Based on my skill profile: ${context}`)
                  }}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ═══ RIGHT: Ask ShijlAI Sidepanel (resizable on desktop) ═══ */}
      <ResizableSidepanel
        defaultWidth={340} minWidth={280} maxWidth={600} storageKey="ai-insights"
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
                  const tabLabel = tabConfig.find(t => t.id === activeTab)?.label || 'this topic'
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

      {/* ═══ MOBILE: Floating Ask ShijlAI FAB + Overlay ═══ */}
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-[11px] text-emerald-600 hover:bg-emerald-500/10 h-8"
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Recommendation Card ─── */
function RecommendationCard({
  rec,
  index,
  viewMode,
  expanded,
  bookmarked,
  onToggleExpand,
  onToggleBookmark,
  onStart,
  onDismiss,
  onComplete,
  onRestore,
}: {
  rec: Recommendation
  index: number
  viewMode: ViewMode
  expanded: boolean
  bookmarked: boolean
  onToggleExpand: () => void
  onToggleBookmark: () => void
  onStart: () => void
  onDismiss: () => void
  onComplete: () => void
  onRestore: () => void
}) {
  const priority = priorityConfig[rec.priority] || priorityConfig.medium
  const type = typeConfig[rec.type] || typeConfig.topic
  const TypeIcon = type.icon
  const isCompleted = rec.status === 'completed'
  const isDismissed = rec.status === 'dismissed'
  const isInactive = isCompleted || isDismissed

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.03 }}
      className={cn(
        'group rounded-2xl border bg-card transition-all overflow-hidden',
        isInactive ? 'border-border/20 opacity-60' : `border-border/40 hover:border-border/60 hover:shadow-lg ${priority.glow}`,
        isCompleted && 'border-emerald-500/20',
        isDismissed && 'border-slate-500/20',
      )}
    >
      <div className="p-4 sm:p-5">
        {/* Top row: Type icon + Title + Priority badge + Bookmark */}
        <div className="flex items-start gap-3">
          <div className={cn(
            'flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors',
            isInactive ? 'bg-muted/50' : type.bgColor
          )}>
            <TypeIcon className={cn('size-5', isInactive ? 'text-muted-foreground/40' : type.color)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={cn(
                'text-sm font-semibold truncate',
                isInactive ? 'text-muted-foreground line-through' : 'text-foreground'
              )}>
                {rec.title}
              </h3>
              <Badge variant="outline" className={cn('text-[10px] px-2 py-0 shrink-0', priority.bgColor, priority.color, priority.borderColor, 'border')}>
                {priority.label}
              </Badge>
            </div>

            {/* Type + time */}
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground/70">
              <span className="flex items-center gap-1">
                <Layers className="size-3" />
                {type.label}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {timeAgo(rec.createdAt)}
              </span>
              {rec.priorityScore > 0 && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Star className="size-3" />
                    Score: {Math.round(rec.priorityScore)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Bookmark */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleBookmark}
                className="shrink-0 p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                {bookmarked ? (
                  <BookmarkCheck className="size-4 text-emerald-500" />
                ) : (
                  <Bookmark className="size-4 text-muted-foreground/40 hover:text-muted-foreground" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent className="rounded-xl">
              {bookmarked ? 'Remove bookmark' : 'Bookmark'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Description */}
        {rec.description && (
          <p className={cn(
            'mt-3 text-[13px] leading-relaxed',
            isInactive ? 'text-muted-foreground/50' : 'text-muted-foreground'
          )}>
            {rec.description}
          </p>
        )}

        {/* Reason - expandable */}
        {rec.reason && (
          <button
            onClick={onToggleExpand}
            className="mt-2 flex items-center gap-1 text-[12px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
          >
            <Lightbulb className="size-3" />
            Why this recommendation?
            {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
        )}

        <AnimatePresence>
          {expanded && rec.reason && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 px-3 py-2">
                <p className="text-[12px] text-foreground/80 leading-relaxed">{rec.reason}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/20">
          <div className="flex items-center gap-1.5">
            {isDismissed ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRestore}
                className="gap-1.5 text-[12px] h-8 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
              >
                <RotateCcw className="size-3.5" />
                Restore
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={onStart}
                  disabled={isInactive}
                  className={cn(
                    'gap-1.5 text-[12px] h-8 rounded-xl font-medium',
                    isInactive
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-500/20'
                  )}
                >
                  <ArrowRight className="size-3.5" />
                  Start Now
                </Button>
                {!isCompleted && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onComplete}
                    className="gap-1.5 text-[12px] h-8 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <CheckCircle2 className="size-3.5" />
                    Done
                  </Button>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            {!isInactive && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onDismiss}
                    className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
                  >
                    <XCircle className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="rounded-xl">Dismiss</TooltipContent>
              </Tooltip>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50 transition-colors">
                  <ExternalLink className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem className="gap-2 text-[12px] rounded-lg" onClick={onStart}>
                  <GraduationCap className="size-3.5" />
                  Discuss with <ShijlAIText />
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 text-[12px] rounded-lg" onClick={() => useAppStore.getState().setCurrentView('achievements')}>
                  <BarChart3 className="size-3.5" />
                  View My Progress
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Metric Bar ─── */
function MetricBar({ label, value, color, inverted = false }: { label: string; value: number; color: string; inverted?: boolean }) {
  const displayValue = Math.round(value)
  const barColor = color === 'violet' ? '[&>div]:bg-violet-500' :
    color === 'emerald' ? '[&>div]:bg-emerald-500' :
    color === 'teal' ? '[&>div]:bg-teal-500' :
    color === 'cyan' ? '[&>div]:bg-cyan-500' :
    color === 'red' ? '[&>div]:bg-red-500' :
    color === 'amber' ? '[&>div]:bg-amber-500' : '[&>div]:bg-slate-500'

  const valueColor = color === 'violet' ? 'text-violet-600 dark:text-violet-400' :
    color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
    color === 'teal' ? 'text-teal-600 dark:text-teal-400' :
    color === 'cyan' ? 'text-cyan-600 dark:text-cyan-400' :
    color === 'red' ? 'text-red-600 dark:text-red-400' :
    color === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        <span className={cn('text-[11px] font-bold', valueColor)}>
          {displayValue}{inverted && displayValue > 60 ? ' ⚠️' : ''}
        </span>
      </div>
      <Progress value={displayValue} className={cn('h-1.5', barColor)} />
    </div>
  )
}

/* ─── Demo Data ─── */
function getDemoRecommendations(): Recommendation[] {
  return [
    {
      id: 'demo-1',
      type: 'topic',
      title: 'Review Calculus Fundamentals',
      description: 'Focus on limits and derivatives — these are foundational for your upcoming assessments.',
      reason: 'Your quiz scores dropped 15% this week in Calculus topics. The system detected a pattern of declining performance in derivative-related questions.',
      priority: 'high',
      priorityScore: 82,
      status: 'active',
      sourceEvent: 'engine_computed',
      recommendedTopicId: 'calculus-101',
      recommendedCourseId: null,
      relatedId: null,
      relatedType: null,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'demo-2',
      type: 'quiz',
      title: 'Practice Organic Chemistry',
      description: 'Take a diagnostic quiz to identify gaps in your understanding of organic reactions.',
      reason: 'You haven\'t studied this topic in 7 days, and your mastery score has decayed from 65% to 48%.',
      priority: 'medium',
      priorityScore: 64,
      status: 'active',
      sourceEvent: 'engine_computed',
      recommendedTopicId: 'organic-chem',
      recommendedCourseId: null,
      relatedId: null,
      relatedType: null,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: 'demo-3',
      type: 'lesson',
      title: 'Advanced Data Structures',
      description: 'Continue where you left off with trees and graphs — you were making great progress!',
      reason: 'Your mastery is improving steadily (72% → 78% this week). Keep the momentum going!',
      priority: 'low',
      priorityScore: 35,
      status: 'active',
      sourceEvent: 'engine_computed',
      recommendedTopicId: 'data-structures-adv',
      recommendedCourseId: null,
      relatedId: null,
      relatedType: null,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'demo-4',
      type: 'study_plan',
      title: 'Create a Weekly Study Schedule',
      description: 'Your activity has been inconsistent. A structured plan can help you maintain momentum.',
      reason: 'Your consistency score dropped from 70% to 45% over the past two weeks. A study plan can help you stay on track.',
      priority: 'high',
      priorityScore: 76,
      status: 'active',
      sourceEvent: 'drop_risk',
      recommendedTopicId: null,
      recommendedCourseId: null,
      relatedId: null,
      relatedType: null,
      createdAt: new Date(Date.now() - 10800000).toISOString(),
    },
    {
      id: 'demo-5',
      type: 'course',
      title: 'Advanced Linear Algebra',
      description: 'You\'ve mastered the basics — ready for more advanced matrix operations and eigenvalues?',
      reason: 'Your Linear Algebra mastery is 88% — you\'re ready for the next level. Consider taking an advanced course.',
      priority: 'low',
      priorityScore: 28,
      status: 'active',
      sourceEvent: 'engine_computed',
      recommendedTopicId: 'linear-algebra',
      recommendedCourseId: null,
      relatedId: null,
      relatedType: null,
      createdAt: new Date(Date.now() - 172800000).toISOString(),
    },
  ]
}

function getDemoProfile(): LearningProfile {
  return {
    level: 'intermediate',
    engagementScore: 45,
    consistencyScore: 55,
    learningSpeedScore: 60,
    dropRiskScore: 35,
    completionRate: 62,
    averageQuizScore: 71,
    weakTopics: ['Calculus', 'Organic Chemistry', 'Thermodynamics'],
    strongTopics: ['JavaScript', 'Algebra', 'Data Structures'],
    studyStreakDays: 3,
    totalLessonsCompleted: 24,
  }
}

function getDemoEnrollments(): Enrollment[] {
  return [
    {
      id: 'demo-enr-1',
      courseId: 'course-1',
      progress: 72,
      enrolledAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      lastAccessed: new Date(Date.now() - 86400000).toISOString(),
      course: {
        id: 'course-1',
        title: 'Introduction to Computer Science',
        category: 'Computer Science',
        level: 'beginner',
        thumbnail: null,
        estimatedDuration: 40,
        modules: [
          { id: 'm1', title: 'Basics', order: 1, lessons: [{ id: 'l1', title: 'Variables & Data Types', order: 1, duration: 15 }] },
        ],
      },
      lessonProgress: [
        { id: 'lp1', status: 'completed', lesson: { id: 'l1', title: 'Variables & Data Types', moduleId: 'm1' } },
        { id: 'lp2', status: 'in_progress', lesson: { id: 'l2', title: 'Control Flow', moduleId: 'm1' } },
      ],
    },
    {
      id: 'demo-enr-2',
      courseId: 'course-2',
      progress: 35,
      enrolledAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      lastAccessed: new Date(Date.now() - 3 * 86400000).toISOString(),
      course: {
        id: 'course-2',
        title: 'Calculus I: Limits & Derivatives',
        category: 'Mathematics',
        level: 'intermediate',
        thumbnail: null,
        estimatedDuration: 60,
        modules: [],
      },
      lessonProgress: [
        { id: 'lp3', status: 'in_progress', lesson: { id: 'l3', title: 'Limit Theorems', moduleId: 'm2' } },
      ],
    },
    {
      id: 'demo-enr-3',
      courseId: 'course-3',
      progress: 95,
      enrolledAt: new Date(Date.now() - 45 * 86400000).toISOString(),
      lastAccessed: new Date(Date.now() - 86400000).toISOString(),
      course: {
        id: 'course-3',
        title: 'JavaScript Fundamentals',
        category: 'Web Development',
        level: 'beginner',
        thumbnail: null,
        estimatedDuration: 30,
        modules: [],
      },
      lessonProgress: [],
    },
  ]
}

function getDemoMasteries(): TopicMastery[] {
  return [
    { id: 'tm-1', topicId: 'py-variables', topicName: 'Variables & Data Types', skillId: 'python-programming', quizScore: 90, assignmentScore: 92, practiceScore: 88, completionScore: 100, masteryScore: 93, status: 'mastered', questionsAttempted: 25, questionsCorrect: 23, attemptCount: 25, trend: 'improving', lastAttempted: new Date(Date.now() - 86400000).toISOString() },
    { id: 'tm-2', topicId: 'py-loops', topicName: 'Loops & Iteration', skillId: 'python-programming', quizScore: 85, assignmentScore: 88, practiceScore: 82, completionScore: 100, masteryScore: 88, status: 'strong', questionsAttempted: 20, questionsCorrect: 17, attemptCount: 20, trend: 'improving', lastAttempted: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: 'tm-3', topicId: 'py-functions', topicName: 'Functions & Scope', skillId: 'python-programming', quizScore: 70, assignmentScore: 75, practiceScore: 68, completionScore: 85, masteryScore: 73, status: 'learning', questionsAttempted: 18, questionsCorrect: 13, attemptCount: 18, trend: 'stable', lastAttempted: new Date(Date.now() - 86400000).toISOString() },
    { id: 'tm-4', topicId: 'py-classes', topicName: 'Classes & OOP', skillId: 'python-programming', quizScore: 40, assignmentScore: 45, practiceScore: 35, completionScore: 60, masteryScore: 43, status: 'weak', questionsAttempted: 15, questionsCorrect: 6, attemptCount: 15, trend: 'declining', lastAttempted: new Date(Date.now() - 7 * 86400000).toISOString() },
    { id: 'tm-5', topicId: 'ml-regression', topicName: 'Regression', skillId: 'machine-learning', quizScore: 82, assignmentScore: 90, practiceScore: 75, completionScore: 100, masteryScore: 86, status: 'strong', questionsAttempted: 20, questionsCorrect: 16, attemptCount: 20, trend: 'improving', lastAttempted: new Date(Date.now() - 86400000).toISOString() },
    { id: 'tm-6', topicId: 'ml-classification', topicName: 'Classification', skillId: 'machine-learning', quizScore: 30, assignmentScore: 35, practiceScore: 25, completionScore: 50, masteryScore: 33, status: 'weak', questionsAttempted: 10, questionsCorrect: 3, attemptCount: 10, trend: 'declining', lastAttempted: new Date(Date.now() - 8 * 86400000).toISOString() },
    { id: 'tm-7', topicId: 'ml-neural-nets', topicName: 'Neural Networks', skillId: 'machine-learning', quizScore: 22, assignmentScore: 18, practiceScore: 15, completionScore: 35, masteryScore: 21, status: 'not_started', questionsAttempted: 8, questionsCorrect: 2, attemptCount: 8, trend: 'declining', lastAttempted: new Date(Date.now() - 5 * 86400000).toISOString() },
    { id: 'tm-8', topicId: 'web-javascript', topicName: 'JavaScript', skillId: 'web-development', quizScore: 72, assignmentScore: 78, practiceScore: 68, completionScore: 90, masteryScore: 76, status: 'strong', questionsAttempted: 22, questionsCorrect: 16, attemptCount: 22, trend: 'improving', lastAttempted: new Date(Date.now() - 3 * 86400000).toISOString() },
  ]
}
