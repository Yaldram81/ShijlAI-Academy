'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Bookmark,
  MessageSquare,
  FileText,
  BookOpen,
  CheckCircle2,
  Circle,
  Lock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  Download,
  Clock,
  Video,
  HelpCircle,
  Sparkles,
  Send,
  Bot,
  ThumbsUp,
  ThumbsDown,
  Star,
  X,
  Subtitles,
  PenLine,
  ExternalLink,
  Zap,
  Keyboard,
  FileQuestion,
  ClipboardList,
  Award,
  PanelRightOpen,
  PanelRightClose,
} from 'lucide-react'
import { ShijlAIText } from '@/components/ui/brand-text'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import type { Course, Module, Lesson, LessonProgress, Enrollment } from '@/lib/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

type ActiveTab = 'overview' | 'notes' | 'resources' | 'qa' | 'ai-tutor'
type PlaybackRate = 0.75 | 1 | 1.25 | 1.5 | 2

const PLAYBACK_RATES: PlaybackRate[] = [0.75, 1, 1.25, 1.5, 2]

const TAB_ITEMS: { key: ActiveTab; label: React.ReactNode; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Overview', icon: BookOpen },
  { key: 'notes', label: 'Notes', icon: PenLine },
  { key: 'resources', label: 'Resources', icon: FileText },
  { key: 'qa', label: 'Q&A', icon: MessageSquare },
  { key: 'ai-tutor', label: <>Ask <ShijlAIText /></>, icon: Sparkles },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlayerModule {
  id: string
  title: string
  order: number
  lessons: PlayerLesson[]
}

interface PlayerLesson {
  id: string
  title: string
  type: string
  duration: number
  order: number
  moduleId: string
  description: string | null
  content: string
  objectives: string | null
  resources: string | null
  transcript: string | null
  slideUrl: string | null
  videoUrl: string | null
  isPublished: boolean
  isFree: boolean
}

interface PlayerLessonProgress {
  id: string
  lessonId: string
  status: 'not_started' | 'in_progress' | 'completed'
  timeSpent: number
  completedAt: string | null
}

interface PlayerData {
  enrollment: {
    id: string
    progress: number
    lastAccessed: string
  }
  course: {
    id: string
    title: string
    thumbnail: string | null
    category: string
    instructor: { id: string; name: string; avatar: string | null }
  }
  modules: PlayerModule[]
  lessonProgress: PlayerLessonProgress[]
  currentLesson: PlayerLesson
  notes: PlayerNote[]
  bookmarks: PlayerBookmark[]
  overallProgress: number
}

interface PlayerNote {
  id: string
  content: string
  timestamp: number | null
  color: string
  createdAt: string
  updatedAt: string
}

interface PlayerBookmark {
  id: string
  timestamp: number
  label: string
  createdAt: string
}

interface QAQuestion {
  id: string
  userId: string
  userName: string
  userAvatar: string | null
  lessonId: string
  question: string
  upvotes: number
  isAnswered: boolean
  answerCount: number
  answers: QAAnswer[]
  createdAt: string
}

interface QAAnswer {
  id: string
  userId: string
  userName: string
  userAvatar: string | null
  content: string
  isAiGenerated: boolean
  isEdited: boolean
  createdAt: string
}

interface QuizResult {
  score: number
  maxScore: number
  percentage: number
  passed: boolean
  xpEarned: number
  gradedAnswers: Array<{
    questionId: string
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
    explanation: string | null
    points: number
  }>
}

interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

function getModuleStatus(
  lessons: PlayerLesson[],
  progressMap: Map<string, PlayerLessonProgress>
): 'completed' | 'in_progress' | 'locked' {
  const statuses = lessons.map((l) => progressMap.get(l.id)?.status || 'not_started')
  if (statuses.every((s) => s === 'completed')) return 'completed'
  if (statuses.some((s) => s === 'in_progress' || s === 'completed')) return 'in_progress'
  return 'locked'
}

function getLessonIcon(
  status: 'completed' | 'in_progress' | 'not_started' | 'locked',
  isCurrent: boolean
) {
  if (isCurrent) return <Play className="size-3.5 text-emerald-500 fill-emerald-500" />
  if (status === 'completed') return <CheckCircle2 className="size-3.5 text-emerald-500" />
  if (status === 'locked') return <Lock className="size-3.5 text-muted-foreground/40" />
  return <Circle className="size-3.5 text-muted-foreground/60" />
}

function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'pdf': return <FileText className="size-4 text-rose-500" />
    case 'py': return <FileText className="size-4 text-sky-500" />
    case 'js': case 'ts': return <FileText className="size-4 text-amber-500" />
    case 'zip': return <FileText className="size-4 text-violet-500" />
    case 'md': return <FileText className="size-4 text-gray-500" />
    default: return <FileText className="size-4 text-muted-foreground" />
  }
}

// ─── Lesson Type Icon Helper ─────────────────────────────────────────────────

function getLessonTypeIcon(type: string) {
  switch (type) {
    case 'video': return <Video className="size-3.5 text-blue-500" />
    case 'text': return <FileText className="size-3.5 text-amber-500" />
    case 'quiz': return <FileQuestion className="size-3.5 text-violet-500" />
    case 'assignment': return <ClipboardList className="size-3.5 text-rose-500" />
    case 'interactive': return <Sparkles className="size-3.5 text-purple-500" />
    case 'download': return <Download className="size-3.5 text-cyan-500" />
    case 'live-session': return <span className="relative"><Video className="size-3.5 text-blue-500" /><span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-red-500" /></span>
    default: return <Video className="size-3.5 text-blue-500" />
  }
}

function getLessonTypeBg(type: string) {
  switch (type) {
    case 'video': return 'bg-blue-100 dark:bg-blue-950/40'
    case 'text': return 'bg-amber-100 dark:bg-amber-950/40'
    case 'quiz': return 'bg-violet-100 dark:bg-violet-950/40'
    case 'assignment': return 'bg-rose-100 dark:bg-rose-950/40'
    case 'interactive': return 'bg-purple-100 dark:bg-purple-950/40'
    case 'download': return 'bg-cyan-100 dark:bg-cyan-950/40'
    case 'live-session': return 'bg-blue-100 dark:bg-blue-950/40'
    default: return 'bg-blue-100 dark:bg-blue-950/40'
  }
}

// ─── Circular Progress Component ─────────────────────────────────────────────

function CircularProgress({ value, size = 36, strokeWidth = 3, className }: { value: number; size?: number; strokeWidth?: number; className?: string }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <svg width={size} height={size} className={className} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/30"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#progressGradient)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ─── Skeleton Components ─────────────────────────────────────────────────────

function PlayerSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-xl" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CoursePlayerView() {
  const { currentUser, selectedCourse, selectedLesson, setSelectedLesson, setCurrentView, setSelectedCourse } = useAppStore()

  // ─── Data State ────────────────────────────────────────────────────────
  const [courseData, setCourseData] = useState<PlayerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ─── Tab State ─────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')

  // ─── Video Player State ────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState<PlaybackRate>(1)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showCaptions, setShowCaptions] = useState(false)

  // ─── Notes State ───────────────────────────────────────────────────────
  const [noteContent, setNoteContent] = useState('')
  const [noteSaving, setNoteSaving] = useState(false)
  const [notes, setNotes] = useState<PlayerNote[]>([])

  // ─── Q&A State ─────────────────────────────────────────────────────────
  const [qaQuestion, setQaQuestion] = useState('')
  const [qaQuestions, setQaQuestions] = useState<QAQuestion[]>([])
  const [qaLoading, setQaLoading] = useState(false)

  // ─── Ask ShijlAI State ────────────────────────────────────────────────────
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([])
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  // ─── Sidebar State ─────────────────────────────────────────────────────
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())

  // ─── Notes Panel State ────────────────────────────────────────────────
  const [notesPanelOpen, setNotesPanelOpen] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  // ─── Feedback State ───────────────────────────────────────────────────
  const [helpfulFeedback, setHelpfulFeedback] = useState<'up' | 'down' | null>(null)

  // ─── Keyboard Shortcuts State ─────────────────────────────────────────
  const [showShortcuts, setShowShortcuts] = useState(false)

  // ─── Content Display State ────────────────────────────────────────────
  const [showFullContent, setShowFullContent] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({})

  // ─── Quiz State ──────────────────────────────────────────────────────
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizResults, setQuizResults] = useState<QuizResult | null>(null)

  // ─── Assignment State ────────────────────────────────────────────────
  const [assignmentContent, setAssignmentContent] = useState('')
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false)
  const [assignmentSubmitted, setAssignmentSubmitted] = useState(false)

  // ─── Q&A Expanded State ──────────────────────────────────────────────
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)

  // ─── Notes Selection State ───────────────────────────────────────────
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [noteColor, setNoteColor] = useState('default')

  // ─── Refs ──────────────────────────────────────────────────────────────
  const playerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const noteDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const aiScrollRef = useRef<HTMLDivElement>(null)
  const progressSaveRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Derived State ─────────────────────────────────────────────────────
  const currentLesson = courseData?.currentLesson
  const progressMap = new Map(
    courseData?.lessonProgress?.map((lp) => [lp.lessonId, lp]) || []
  )
  const enrollmentId = courseData?.enrollment?.id

  // ─── Fetch Player Data ─────────────────────────────────────────────────
  const fetchPlayerData = useCallback(async () => {
    if (!selectedCourse || !currentUser) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/student/course-player?courseId=${selectedCourse.id}&userId=${currentUser.id}${selectedLesson ? `&lessonId=${selectedLesson.id}` : ''}`)
      if (!res.ok) throw new Error('Failed to fetch course data')
      const data = await res.json()

      // Map API response to our PlayerData format
      // API returns lessonProgress embedded in each lesson, flatten it
      const lessonProgressList: PlayerLessonProgress[] = []
      const modulesWithLessonFields: PlayerModule[] = (data.modules || []).map((mod: Record<string, unknown>) => {
        const lessons: PlayerLesson[] = ((mod.lessons || []) as Record<string, unknown>[]).map((lesson: Record<string, unknown>) => {
          const progress = lesson.progress as { status?: string; timeSpent?: number; completedAt?: string | null } | null
          if (progress) {
            lessonProgressList.push({
              id: `${data.enrollment.id}-${lesson.id}`,
              lessonId: lesson.id as string,
              status: (progress.status || 'not_started') as 'not_started' | 'in_progress' | 'completed',
              timeSpent: progress.timeSpent || 0,
              completedAt: progress.completedAt || null,
            })
          }
          return {
            id: lesson.id as string,
            title: lesson.title as string,
            type: lesson.type as string,
            duration: lesson.duration as number,
            order: lesson.order as number,
            moduleId: mod.id as string,
            description: lesson.description as string | null,
            content: (lesson.content as string) || '',
            objectives: lesson.objectives as string | null,
            resources: lesson.resources as string | null,
            transcript: lesson.transcript as string | null,
            slideUrl: (lesson.slideUrl as string) || null,
            videoUrl: lesson.videoUrl as string | null,
            isPublished: lesson.isPublished !== false,
            isFree: lesson.isFree === true,
          }
        })
        return {
          id: mod.id as string,
          title: mod.title as string,
          order: mod.order as number,
          lessons,
        }
      })

      // Determine the current lesson
      let currentLesson: PlayerLesson | null = null
      if (selectedLesson) {
        currentLesson = modulesWithLessonFields.flatMap(m => m.lessons).find(l => l.id === selectedLesson.id) || null
      }
      if (!currentLesson && modulesWithLessonFields.length > 0 && modulesWithLessonFields[0].lessons.length > 0) {
        // Find first in-progress or not-started lesson
        const allLessonsFlat = modulesWithLessonFields.flatMap(m => m.lessons)
        currentLesson = allLessonsFlat.find(l => {
          const lp = lessonProgressList.find(p => p.lessonId === l.id)
          return lp?.status === 'in_progress' || !lp
        }) || allLessonsFlat[0]
      }

      const notesList: PlayerNote[] = Array.isArray(data.currentNotes)
        ? data.currentNotes.map((n: Record<string, unknown>) => ({
            id: n.id as string,
            content: (n.content as string) || '',
            timestamp: n.timestamp as number | null,
            color: (n.color as string) || 'default',
            createdAt: n.createdAt ? new Date(n.createdAt as string).toISOString() : new Date().toISOString(),
            updatedAt: n.updatedAt ? new Date(n.updatedAt as string).toISOString() : new Date().toISOString(),
          }))
        : []

      const bookmarksList: PlayerBookmark[] = Array.isArray(data.currentBookmarks)
        ? data.currentBookmarks.map((b: Record<string, unknown>) => ({
            id: b.id as string,
            timestamp: b.timestamp as number,
            label: (b.label as string) || '',
            createdAt: b.createdAt ? new Date(b.createdAt as string).toISOString() : new Date().toISOString(),
          }))
        : []

      setCourseData({
        enrollment: {
          id: data.enrollment.id,
          progress: data.enrollment.progress,
          lastAccessed: data.enrollment.lastAccessed,
        },
        course: {
          id: data.course.id,
          title: data.course.title,
          thumbnail: data.course.thumbnail,
          category: data.course.category,
          instructor: data.course.instructor,
        },
        modules: modulesWithLessonFields,
        lessonProgress: lessonProgressList,
        currentLesson: currentLesson!,
        notes: notesList,
        bookmarks: bookmarksList,
        overallProgress: data.enrollment.progress,
      })
      setNotes(notesList)
      if (currentLesson) {
        setDuration(currentLesson.duration * 60)
        // Load note content from first note if exists
        if (notesList.length > 0) {
          setSelectedNoteId(notesList[0].id)
          setNoteContent(notesList[0].content || '')
          setNoteColor(notesList[0].color || 'default')
        } else {
          setSelectedNoteId(null)
          setNoteContent('')
          setNoteColor('default')
        }
      }
    } catch {
      setError('Failed to load course player. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [selectedCourse, selectedLesson, currentUser])

  useEffect(() => {
    fetchPlayerData()
  }, [fetchPlayerData])

  // ─── Video Element Sync ────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (isPlaying) {
      video.play().catch(() => setIsPlaying(false))
    } else {
      video.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = playbackRate
  }, [playbackRate])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.volume = volume / 100
    video.muted = isMuted
  }, [volume, isMuted])

  // ─── Simulated Video Playback (fallback when no videoUrl) ──────────────
  useEffect(() => {
    if (currentLesson?.videoUrl) return // Real video handles playback
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current)
      playIntervalRef.current = null
    }

    if (isPlaying && duration > 0) {
      playIntervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + playbackRate
          if (next >= duration) {
            setIsPlaying(false)
            // Auto-mark as completed
            if (enrollmentId && currentLesson) {
              fetch('/api/progress', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  enrollmentId,
                  lessonId: currentLesson.id,
                  status: 'completed',
                  timeSpent: Math.floor(duration / 60),
                }),
              }).then(() => {
                toast.success('Lesson completed! 🎉')
                fetchPlayerData()
              }).catch(() => {})
            }
            return duration
          }
          return next
        })
      }, 1000)
    }

    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current)
    }
  }, [isPlaying, playbackRate, duration, enrollmentId, currentLesson, fetchPlayerData])

  // ─── Auto-hide Controls ────────────────────────────────────────────────
  const resetControlsTimer = useCallback(() => {
    setShowControls(true)
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3000)
  }, [isPlaying])

  useEffect(() => {
    return () => {
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current)
    }
  }, [])

  // ─── Save Progress Periodically ────────────────────────────────────────
  useEffect(() => {
    if (progressSaveRef.current) clearInterval(progressSaveRef.current)
    if (enrollmentId && currentLesson && isPlaying) {
      progressSaveRef.current = setInterval(() => {
        fetch('/api/progress', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            enrollmentId,
            lessonId: currentLesson.id,
            status: 'in_progress',
            timeSpent: Math.floor(currentTime / 60),
          }),
        }).catch(() => {})
      }, 30000)
    }
    return () => {
      if (progressSaveRef.current) clearInterval(progressSaveRef.current)
    }
  }, [enrollmentId, currentLesson, isPlaying, currentTime])

  // ─── Fetch Q&A ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'qa' && selectedCourse) {
      setQaLoading(true)
      fetch(`/api/student/qa?courseId=${selectedCourse.id}${currentLesson ? `&lessonId=${currentLesson.id}` : ''}`)
        .then((res) => res.json())
        .then((data) => setQaQuestions(data.questions || []))
        .catch(() => setQaQuestions([]))
        .finally(() => setQaLoading(false))
    }
  }, [activeTab, selectedCourse, currentLesson])

  // ─── Note Auto-Save (Debounced) ────────────────────────────────────────
  useEffect(() => {
    if (noteDebounceRef.current) clearTimeout(noteDebounceRef.current)
    if (!noteContent.trim() || !enrollmentId || !currentLesson) return

    noteDebounceRef.current = setTimeout(async () => {
      setNoteSaving(true)
      try {
        if (selectedNoteId) {
          // PATCH existing note
          await fetch('/api/student/notes', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              noteId: selectedNoteId,
              content: noteContent,
              timestamp: Math.floor(currentTime),
              color: noteColor,
            }),
          })
        } else {
          // POST new note
          const res = await fetch('/api/student/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser?.id,
              enrollmentId,
              lessonId: currentLesson.id,
              content: noteContent,
              timestamp: Math.floor(currentTime),
              color: noteColor,
            }),
          })
          if (res.ok) {
            const data = await res.json()
            if (data.note?.id) {
              setSelectedNoteId(data.note.id)
              setNotes(prev => [...prev, {
                id: data.note.id,
                content: noteContent,
                timestamp: Math.floor(currentTime),
                color: noteColor,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }])
            }
          }
        }
        setLastSavedAt(new Date())
      } catch {
        // Silent fail for auto-save
      } finally {
        setNoteSaving(false)
      }
    }, 1000)

    return () => {
      if (noteDebounceRef.current) clearTimeout(noteDebounceRef.current)
    }
  }, [noteContent, enrollmentId, currentLesson, currentTime, selectedNoteId, noteColor, currentUser])

  // ─── AI Auto-scroll ────────────────────────────────────────────────────
  useEffect(() => {
    if (aiScrollRef.current) {
      aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight
    }
  }, [aiMessages, aiLoading])

  // ─── Initialize Expanded Modules ───────────────────────────────────────
  useEffect(() => {
    if (courseData) {
      // Auto-expand the module containing the current lesson
      const currentModId = courseData.currentLesson?.moduleId
      if (currentModId) {
        setExpandedModules(new Set([currentModId]))
      } else if (courseData.modules.length > 0) {
        setExpandedModules(new Set([courseData.modules[0].id]))
      }
    }
  }, [courseData])

  // ─── Keyboard Shortcuts ────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if user is typing in an input
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          handlePlayPause()
          break
        case 'ArrowRight':
          if (e.shiftKey) handleNextLesson()
          else handleSkip(10)
          break
        case 'ArrowLeft':
          if (e.shiftKey) {
            // Previous lesson
            const all = courseData?.modules.flatMap(m => m.lessons) || []
            const idx = all.findIndex(l => l.id === currentLesson?.id)
            if (idx > 0) handleLessonSelect(all[idx - 1])
          } else {
            handleSkip(-10)
          }
          break
        case 'n':
        case 'N':
          setNotesPanelOpen(prev => !prev)
          break
        case '?':
          setShowShortcuts(prev => !prev)
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, currentLesson, courseData])

  // ─── Handlers ──────────────────────────────────────────────────────────
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
    resetControlsTimer()
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = Math.max(0, Math.min(1, x / rect.width))
    const seekTime = pct * duration
    setCurrentTime(seekTime)
    if (videoRef.current) videoRef.current.currentTime = seekTime
    resetControlsTimer()
  }

  const handleSkip = (seconds: number) => {
    setCurrentTime((prev) => {
      const next = Math.max(0, Math.min(duration, prev + seconds))
      if (videoRef.current) videoRef.current.currentTime = next
      return next
    })
    resetControlsTimer()
  }

  const handleBookmark = async () => {
    if (!enrollmentId || !currentLesson) return
    try {
      const res = await fetch('/api/student/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          enrollmentId,
          lessonId: currentLesson.id,
          timestamp: Math.floor(currentTime),
          label: `Bookmark at ${formatTime(currentTime)}`,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(`🔖 Bookmark added at ${formatTime(currentTime)}`)
    } catch {
      toast.error('Failed to add bookmark')
    }
  }

  const handleFullscreen = () => {
    if (!playerRef.current) return
    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  const handleLessonSelect = (lesson: PlayerLesson) => {
    if (progressMap.get(lesson.id)?.status === 'locked') return
    setSelectedLesson(lesson as unknown as Lesson)
    setIsPlaying(false)
    setCurrentTime(0)
    setActiveTab('overview')
    setShowFullContent(false)
    setQuizAnswers({})
    setQuizSubmitted(false)
    setQuizResults(null)
    setAssignmentContent('')
    setAssignmentSubmitting(false)
    setAssignmentSubmitted(false)
    setExpandedQuestion(null)
    fetchPlayerData()
  }

  const handleMarkComplete = async () => {
    if (!enrollmentId || !currentLesson) return
    try {
      const res = await fetch('/api/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId,
          lessonId: currentLesson.id,
          status: 'completed',
          timeSpent: Math.floor(currentTime / 60) || currentLesson.duration,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Lesson completed! 🎉')
      fetchPlayerData()
    } catch {
      toast.error('Failed to mark lesson as complete')
    }
  }

  const handleNextLesson = () => {
    if (!courseData) return
    const allLessons = courseData.modules.flatMap((m) => m.lessons)
    const currentIdx = allLessons.findIndex((l) => l.id === currentLesson?.id)
    if (currentIdx < allLessons.length - 1) {
      const next = allLessons[currentIdx + 1]
      handleLessonSelect(next)
    }
  }

  const handleAddTimestampNote = () => {
    setNoteContent((prev) =>
      prev + (prev ? '\n' : '') + `[${formatTime(currentTime)}] `
    )
    setActiveTab('notes')
  }

  const handleExportNotes = () => {
    if (notes.length === 0 && !noteContent.trim()) {
      toast.error('No notes to export')
      return
    }
    let content = `Notes for: ${currentLesson?.title || 'Lesson'}\n`
    content += `Course: ${courseData?.course.title || ''}\n`
    content += `Exported: ${new Date().toLocaleDateString()}\n\n`
    notes.forEach((n) => {
      content += n.timestamp !== null ? `[${formatTime(n.timestamp)}] ` : ''
      content += `${n.content}\n\n`
    })
    if (noteContent.trim()) {
      content += `[${formatTime(currentTime)}] ${noteContent}\n`
    }
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `notes-${currentLesson?.title?.replace(/\s+/g, '-') || 'lesson'}.txt`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Notes exported!')
  }

  const handleAskQuestion = async () => {
    if (!qaQuestion.trim() || !selectedCourse || !currentLesson) return
    try {
      const res = await fetch('/api/student/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id,
          courseId: selectedCourse.id,
          lessonId: currentLesson.id,
          question: qaQuestion,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Question submitted!')
      setQaQuestion('')
      // Refresh Q&A list
      setQaLoading(true)
      fetch(`/api/student/qa?courseId=${selectedCourse.id}&lessonId=${currentLesson.id}`)
        .then((r) => r.json())
        .then((d) => setQaQuestions(d.questions || []))
        .catch(() => {})
        .finally(() => setQaLoading(false))
    } catch {
      toast.error('Failed to submit question')
    }
  }

  const handleAiSend = async () => {
    if (!aiInput.trim() || aiLoading) return
    const userMsg: AIMessage = {
      id: `ai-${Date.now()}`,
      role: 'user',
      content: aiInput.trim(),
      timestamp: new Date(),
    }
    setAiMessages((prev) => [...prev, userMsg])
    setAiInput('')
    setAiLoading(true)

    try {
      const res = await fetch('/api/ai/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.id || 'demo-user',
          message: aiInput.trim(),
          context: `lesson:${currentLesson?.id || ''}:course:${selectedCourse?.id || ''}`,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setAiMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}-resp`,
          role: 'assistant',
          content: data.message || "I'm here to help! Could you rephrase your question?",
          timestamp: new Date(),
        },
      ])
    } catch {
      setAiMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}-err`,
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please try again. 🙏",
          timestamp: new Date(),
        },
      ])
    } finally {
      setAiLoading(false)
    }
  }

  const handleBack = () => {
    setSelectedCourse(null)
    setSelectedLesson(null)
    setCurrentView('courses')
  }

  // ─── Loading / Error States ────────────────────────────────────────────
  if (loading) return <PlayerSkeleton />

  if (error || !courseData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-card p-12 text-center ios-shadow-sm"
      >
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <BookOpen className="size-8 text-destructive" />
        </div>
        <h3 className="text-[22px] font-bold">Course not found</h3>
        <p className="text-[13px] text-muted-foreground">{error || 'Unable to load course player.'}</p>
        <Button variant="outline" className="rounded-2xl active:scale-[0.97]" onClick={handleBack}>
          Back to My Learning
        </Button>
      </motion.div>
    )
  }

  // ─── Computed Values ───────────────────────────────────────────────────
  const currentLessonProgress = progressMap.get(currentLesson?.id || '')
  const isLessonCompleted = currentLessonProgress?.status === 'completed'
  const allLessons = courseData.modules.flatMap((m) => m.lessons)
  const currentLessonIndex = allLessons.findIndex((l) => l.id === currentLesson?.id)
  const currentModule = courseData.modules.find((m) => m.id === currentLesson?.moduleId)
  const hasNextLesson = currentLessonIndex < allLessons.length - 1

  // Determine module lock status
  let previousModuleCompleted = true
  const moduleStatuses: Map<string, 'completed' | 'in_progress' | 'locked'> = new Map()
  courseData.modules.forEach((mod) => {
    const status = getModuleStatus(mod.lessons, progressMap)
    if (previousModuleCompleted) {
      moduleStatuses.set(mod.id, status)
    } else {
      moduleStatuses.set(mod.id, 'locked')
    }
    previousModuleCompleted = status === 'completed'
  })

  // Parse lesson objectives
  let objectives: string[] = []
  try {
    objectives = currentLesson?.objectives ? JSON.parse(currentLesson.objectives) : []
  } catch {
    objectives = currentLesson?.objectives?.split('\n').filter(Boolean) || []
  }

  // Parse resources - normalize both {name, url, type} and {title/id, url, type} formats
  let resources: Array<{ name: string; url: string; type: string }> = []
  try {
    const raw = currentLesson?.resources ? JSON.parse(currentLesson.resources) : []
    resources = (Array.isArray(raw) ? raw : []).map((res: Record<string, unknown>) => ({
      name: (res.name as string) || (res.title as string) || 'Untitled Resource',
      url: (res.url as string) || '',
      type: (res.type as string) || 'file',
    }))
  } catch {
    resources = []
  }

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ ...springTransition }}
      className="h-full flex flex-col"
    >
      {/* ═══════════════════════════════════════════════════════════════════
          PROGRESS HEADER BAR
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="shrink-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/40 px-4 md:px-5 lg:px-6 py-2.5">
        <div className="flex items-center gap-3">
          {/* Left: Back + Breadcrumb */}
          <div className="flex items-center gap-2 text-[13px] min-w-0 flex-1">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors active:scale-[0.97] shrink-0"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">My Learning</span>
            </button>
            <ChevronRight className="size-3 text-muted-foreground/50 shrink-0" />
            <span className="text-foreground font-medium truncate max-w-[120px] sm:max-w-[180px]">
              {courseData.course.title}
            </span>
            <ChevronRight className="size-3 text-muted-foreground/50 shrink-0" />
            <span className="text-emerald-600 dark:text-emerald-400 font-medium truncate max-w-[80px] sm:max-w-none">
              {currentModule?.order}.{currentLesson?.order} — {currentLesson?.title}
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Circular Progress */}
            <div className="relative hidden sm:flex items-center">
              <CircularProgress value={courseData.overallProgress} size={32} strokeWidth={3} />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                {Math.round(courseData.overallProgress)}
              </span>
            </div>

            {/* XP Badge */}
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-0 text-[11px] rounded-full px-2 py-0.5 gap-1 hidden sm:inline-flex">
              <Zap className="size-3" />
              +{isLessonCompleted ? currentLesson?.duration * 5 : Math.floor(currentTime / 60) * 5} XP
            </Badge>

            {/* Notes Panel Toggle */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={notesPanelOpen ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNotesPanelOpen(!notesPanelOpen)}
                    className={cn(
                      'rounded-full h-8 gap-1.5 text-[12px] active:scale-[0.97]',
                      notesPanelOpen && 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0'
                    )}
                  >
                    {notesPanelOpen ? <PanelRightClose className="size-3.5" /> : <PanelRightOpen className="size-3.5" />}
                    <span className="hidden md:inline">Notes</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle notes panel (N)</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Mark Complete / Completed */}
            {isLessonCompleted ? (
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0 text-[12px] rounded-full px-3 py-1 gap-1">
                <CheckCircle2 className="size-3.5" />
                Completed
              </Badge>
            ) : (
              <Button
                onClick={handleMarkComplete}
                size="sm"
                className="rounded-full h-8 gap-1.5 text-[12px] bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white active:scale-[0.97]"
              >
                <CheckCircle2 className="size-3.5" />
                <span className="hidden sm:inline">Complete</span>
              </Button>
            )}

            {/* Next Lesson */}
            {hasNextLesson && (
              <Button
                onClick={handleNextLesson}
                variant="outline"
                size="sm"
                className="rounded-full h-8 gap-1.5 text-[12px] active:scale-[0.97]"
              >
                <SkipForward className="size-3.5" />
                <span className="hidden sm:inline">Next</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN LAYOUT: Course Sidebar (LEFT) + Video/Tabs (RIGHT)
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0 overflow-hidden bg-muted/10">
        {/* ─── LEFT: Course Content Sidebar (desktop) ──────────────────────── */}
        <aside className="hidden lg:flex shrink-0 w-[320px] xl:w-[360px] border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm rounded-3xl flex-col overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Sidebar header */}
            <div className="p-4 pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="size-4 text-emerald-500" />
                  <h3 className="text-[15px] font-semibold">Course Content</h3>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {allLessons.length} lessons
                </span>
              </div>
              {/* Overall progress mini bar */}
              <div className="mt-2">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-muted-foreground">{Math.round(courseData.overallProgress)}% complete</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {courseData.lessonProgress.filter(lp => lp.status === 'completed').length}/{allLessons.length}
                  </span>
                </div>
                <Progress value={courseData.overallProgress} className="h-1.5 bg-muted/50 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-teal-500" />
              </div>
            </div>

            {/* Scrollable lesson list with collapsible modules */}
            <ScrollArea className="flex-1 scrollbar-thin">
              <div className="p-2">
                {courseData.modules.map((mod) => {
                  const moduleStatus = moduleStatuses.get(mod.id) || 'locked'
                  const isExpanded = expandedModules.has(mod.id)
                  const completedInModule = mod.lessons.filter(l => progressMap.get(l.id)?.status === 'completed').length
                  const moduleProgress = mod.lessons.length > 0 ? (completedInModule / mod.lessons.length) * 100 : 0

                  return (
                    <div key={mod.id} className="mb-1">
                      <Collapsible
                        open={isExpanded}
                        onOpenChange={(open) => {
                          setExpandedModules(prev => {
                            const next = new Set(prev)
                            if (open) next.add(mod.id)
                            else next.delete(mod.id)
                            return next
                          })
                        }}
                      >
                        {/* Module header with collapsible trigger */}
                        <CollapsibleTrigger asChild>
                          <button className="w-full px-3 py-2.5 rounded-lg hover:bg-muted/30 transition-colors text-left group/mod">
                            <div className="flex items-center gap-2">
                              {/* Module status icon */}
                              <div className={cn(
                                'flex size-5 items-center justify-center rounded-full shrink-0',
                                moduleStatus === 'completed' ? 'bg-emerald-100 dark:bg-emerald-950/40' :
                                moduleStatus === 'in_progress' ? 'bg-amber-100 dark:bg-amber-950/40' :
                                'bg-muted/50'
                              )}>
                                {moduleStatus === 'completed' ? (
                                  <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                                ) : moduleStatus === 'in_progress' ? (
                                  <Circle className="size-3 text-amber-500 fill-amber-500/30" />
                                ) : (
                                  <Lock className="size-2.5 text-muted-foreground/50" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[12px] font-semibold text-foreground line-clamp-2 leading-snug pr-2">
                                  Module {mod.order}: {mod.title}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {completedInModule} of {mod.lessons.length} lessons completed
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {/* Module progress mini ring */}
                                <div className="relative">
                                  <CircularProgress value={moduleProgress} size={20} strokeWidth={2} />
                                  <span className="absolute inset-0 flex items-center justify-center text-[6px] font-bold text-emerald-600 dark:text-emerald-400">
                                    {Math.round(moduleProgress)}
                                  </span>
                                </div>
                                <motion.div
                                  animate={{ rotate: isExpanded ? 180 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ChevronDown className="size-3.5 text-muted-foreground/60 group-hover/mod:text-foreground transition-colors" />
                                </motion.div>
                              </div>
                            </div>
                            {/* Module progress bar */}
                            <div className="mt-1.5 ml-7 mr-8">
                              <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${moduleProgress}%` }}
                                  transition={{ duration: 0.5, ease: 'easeOut' }}
                                />
                              </div>
                            </div>
                          </button>
                        </CollapsibleTrigger>

                        {/* Collapsible lessons */}
                        <CollapsibleContent>
                          <div className="space-y-0.5 pl-3 pr-1 py-1">
                            {mod.lessons.map((lesson) => {
                              const lp = progressMap.get(lesson.id)
                              const status: 'completed' | 'in_progress' | 'not_started' | 'locked' =
                                moduleStatus === 'locked' ? 'locked' :
                                lp?.status === 'completed' ? 'completed' :
                                lp?.status === 'in_progress' ? 'in_progress' : 'not_started'
                              const isCurrent = lesson.id === currentLesson?.id

                              return (
                                <motion.button
                                  key={lesson.id}
                                  onClick={() => handleLessonSelect(lesson)}
                                  disabled={status === 'locked'}
                                  whileHover={status !== 'locked' ? { x: 2 } : {}}
                                  whileTap={status !== 'locked' ? { scale: 0.98 } : {}}
                                  className={cn(
                                    'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-all',
                                    isCurrent
                                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 shadow-sm'
                                      : status === 'locked'
                                      ? 'text-muted-foreground/40 cursor-not-allowed'
                                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                                    status === 'completed' && !isCurrent && 'text-emerald-600 dark:text-emerald-400'
                                  )}
                                >
                                  {/* Lesson type icon with color coding */}
                                  <div className={cn(
                                    'flex size-6 items-center justify-center rounded-md shrink-0',
                                    getLessonTypeBg(lesson.type)
                                  )}>
                                    {getLessonTypeIcon(lesson.type)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className={cn(
                                      'line-clamp-2 leading-snug text-[13px] pr-1',
                                      isCurrent ? 'font-semibold' : 'font-medium'
                                    )}>
                                      {lesson.title}
                                    </p>
                                    {isCurrent && (
                                      <div className="flex items-center gap-1 mt-0.5">
                                        <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                          Now Playing
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {/* Completion checkmark */}
                                    {status === 'completed' && !isCurrent && (
                                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                                    )}
                                    {/* Current playing icon */}
                                    {isCurrent && (
                                      <div className="flex items-center gap-0.5">
                                        {[0, 1, 2].map((i) => (
                                          <motion.div
                                            key={i}
                                            className="size-0.5 rounded-full bg-emerald-500"
                                            animate={{ scaleY: [1, 2, 1] }}
                                            transition={{
                                              duration: 0.5,
                                              repeat: Infinity,
                                              delay: i * 0.1,
                                              ease: 'easeInOut',
                                            }}
                                          />
                                        ))}
                                      </div>
                                    )}
                                    <span className="text-[11px] text-muted-foreground">
                                      {lesson.duration}m
                                    </span>
                                    {lesson.isFree && (
                                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0 text-[9px] rounded-full px-1.5 py-0 h-4 shrink-0">
                                        Free
                                      </Badge>
                                    )}
                                  </div>
                                </motion.button>
                              )
                            })}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            {/* Bottom section */}
            <div className="border-t border-border/40 p-4 space-y-4 shrink-0">
              {/* Next lesson button */}
              {hasNextLesson && (
                <Button
                  onClick={handleNextLesson}
                  className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white active:scale-[0.97] h-10 text-[14px] font-semibold"
                >
                  <Play className="size-4 mr-2 fill-white" />
                  Next lesson
                </Button>
              )}

              {/* Ask ShijlAI card */}
              <button
                onClick={() => setActiveTab('ai-tutor')}
                className="w-full rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-3 text-left hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-950/50 dark:hover:to-teal-950/50 transition-colors active:scale-[0.97] border border-emerald-200/50 dark:border-emerald-800/30"
              >
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <Sparkles className="size-4" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-emerald-700 dark:text-emerald-400">✦ Ask <ShijlAIText /></p>
                    <p className="text-[11px] text-muted-foreground">Ask a question</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </aside>

        {/* ─── RIGHT: Video + Tabs ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 overflow-y-auto border border-border/40 bg-card/80 backdrop-blur-xl shadow-sm rounded-3xl flex flex-col scrollbar-thin">
          {/* ═══════════════════════════════════════════════════════════════
              VIDEO PLAYER
              ═══════════════════════════════════════════════════════════════ */}
          <div
            ref={playerRef}
            className="relative bg-black aspect-video w-full shrink-0 overflow-hidden group rounded-b-3xl shadow-sm border-b border-border/40"
            onMouseMove={resetControlsTimer}
            onMouseLeave={() => isPlaying && setShowControls(false)}
          >
            {/* Real video or simulated background */}
            {currentLesson?.videoUrl ? (
              <video
                ref={videoRef}
                src={currentLesson.videoUrl}
                className="absolute inset-0 w-full h-full object-contain bg-black"
                onClick={handlePlayPause}
                onTimeUpdate={() => {
                  if (videoRef.current) setCurrentTime(videoRef.current.currentTime)
                }}
                onLoadedMetadata={() => {
                  if (videoRef.current) setDuration(videoRef.current.duration)
                }}
                onEnded={() => {
                  setIsPlaying(false)
                  if (enrollmentId && currentLesson) {
                    fetch('/api/progress', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        enrollmentId,
                        lessonId: currentLesson.id,
                        status: 'completed',
                        timeSpent: Math.floor(duration / 60),
                      }),
                    }).then(() => {
                      toast.success('Lesson completed! 🎉')
                      fetchPlayerData()
                    }).catch(() => {})
                  }
                }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute top-1/3 -left-full w-[300%] h-px bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent animate-[shimmer_8s_ease-in-out_infinite]" />
                  <div className="absolute top-2/3 -left-full w-[300%] h-px bg-gradient-to-r from-transparent via-teal-500/10 to-transparent animate-[shimmer_12s_ease-in-out_infinite_2s]" />
                </div>
              </div>
            )}

            {/* Center play icon when paused */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                {!currentLesson?.videoUrl && (
                  <>
                    <div className="absolute size-24 rounded-full border-2 border-white/20 animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="absolute size-20 rounded-full border border-white/10 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.3s' }} />
                  </>
                )}
                <motion.button
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handlePlayPause}
                  className="relative flex size-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors shadow-2xl"
                >
                  <Play className="size-7 ml-1 fill-white" />
                </motion.button>
              </div>
            )}

            {/* Lesson info overlay */}
            {showControls && (
              <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10">
                <div className="flex items-center gap-2 rounded-lg bg-black/50 backdrop-blur-sm px-3 py-1.5">
                  <Video className="size-4 text-emerald-400" />
                  <span className="text-[12px] font-medium text-white">
                    {currentModule?.order}.{currentLesson?.order} — {currentLesson?.title}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-black/50 backdrop-blur-sm px-3 py-1.5">
                  <Clock className="size-3.5 text-white/60" />
                  <span className="text-[12px] font-mono tabular-nums text-white/90">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              </div>
            )}

            {/* Captions overlay */}
            {showCaptions && currentLesson?.transcript && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-[80%] rounded-lg bg-black/70 backdrop-blur-sm px-4 py-2 text-center">
                <p className="text-[14px] text-white leading-relaxed">
                  {currentLesson.transcript.substring(0, 200)}...
                </p>
              </div>
            )}

            {/* Always-visible thin progress bar at the very bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-10">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-300"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>

            {/* ═══ VIDEO CONTROLS ═══ */}
            <AnimatePresence>
              {showControls && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-1 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16 pb-3 px-4"
                >
                  {/* Progress bar */}
                  <div
                    className="h-1.5 rounded-full bg-white/20 cursor-pointer group/progress mb-3 hover:h-2.5 transition-all"
                    onClick={handleSeek}
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 relative transition-all"
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    >
                      <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 size-3.5 rounded-full bg-white opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-lg" />
                    </div>
                  </div>

                  {/* Controls row */}
                  <div className="flex items-center gap-2">
                    {/* Left controls */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handlePlayPause}
                        className="flex size-8 items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors active:scale-[0.97]"
                      >
                        {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 ml-0.5 fill-white" />}
                      </button>
                      <button
                        onClick={() => handleSkip(-10)}
                        className="flex size-8 items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors active:scale-[0.97]"
                      >
                        <SkipBack className="size-4" />
                      </button>
                      <button
                        onClick={() => handleSkip(10)}
                        className="flex size-8 items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors active:scale-[0.97]"
                      >
                        <SkipForward className="size-4" />
                      </button>
                      {/* Volume */}
                      <div className="flex items-center gap-1.5 ml-1">
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className="flex size-8 items-center justify-center rounded-full text-white hover:bg-white/10 transition-colors active:scale-[0.97]"
                        >
                          {isMuted || volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={isMuted ? 0 : volume}
                          onChange={(e) => {
                            setVolume(Number(e.target.value))
                            setIsMuted(false)
                          }}
                          className="w-16 h-1 rounded-full appearance-none bg-white/20 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white cursor-pointer"
                        />
                      </div>
                      {/* Time */}
                      <span className="text-[12px] text-white/80 ml-2 font-mono tabular-nums">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-1 ml-auto">
                      {/* Playback rate */}
                      <div className="hidden sm:flex items-center gap-0.5">
                        {PLAYBACK_RATES.map((rate) => (
                          <button
                            key={rate}
                            onClick={() => setPlaybackRate(rate)}
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors active:scale-[0.97]',
                              playbackRate === rate
                                ? 'bg-emerald-500 text-white'
                                : 'text-white/60 hover:text-white hover:bg-white/10'
                            )}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                      {/* CC */}
                      <button
                        onClick={() => setShowCaptions(!showCaptions)}
                        className={cn(
                          'flex size-8 items-center justify-center rounded-full transition-colors active:scale-[0.97]',
                          showCaptions ? 'text-emerald-400 bg-emerald-400/20' : 'text-white/60 hover:text-white hover:bg-white/10'
                        )}
                        title="Captions"
                      >
                        <Subtitles className="size-4" />
                      </button>
                      {/* Notes */}
                      <button
                        onClick={handleAddTimestampNote}
                        className="flex size-8 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors active:scale-[0.97]"
                        title="Add note at timestamp"
                      >
                        <PenLine className="size-4" />
                      </button>
                      {/* Bookmark */}
                      <button
                        onClick={handleBookmark}
                        className="flex size-8 items-center justify-center rounded-full text-white/60 hover:text-amber-300 hover:bg-white/10 transition-colors active:scale-[0.97]"
                        title="Bookmark"
                      >
                        <Bookmark className="size-4" />
                      </button>
                      {/* Fullscreen */}
                      <button
                        onClick={handleFullscreen}
                        className="flex size-8 items-center justify-center rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors active:scale-[0.97]"
                        title="Fullscreen"
                      >
                        {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              LESSON TITLE + TABS
              ═══════════════════════════════════════════════════════════════ */}
          <div className="px-4 md:px-5 lg:px-6 py-4">
            {/* Lesson title */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-[20px] font-bold text-foreground leading-tight">
                  Lesson {currentModule?.order}.{currentLesson?.order} — {currentLesson?.title}
                </h2>
                <div className="flex items-center gap-3 mt-1.5 text-[12px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {currentLesson?.duration} min
                  </span>
                  <Badge variant="outline" className="text-[11px] capitalize rounded-full px-2 py-0">
                    {currentLesson?.type}
                  </Badge>
                  {currentLesson?.isFree && (
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0 text-[11px] rounded-full px-2 py-0">
                      Free Preview
                    </Badge>
                  )}
                  {isLessonCompleted && (
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0 text-[11px] rounded-full px-2 py-0">
                      <CheckCircle2 className="size-3 mr-0.5" />
                      Completed
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Tab bar */}
            <div className="border-b border-border/60">
              <div className="flex gap-0 overflow-x-auto scrollbar-thin">
                {TAB_ITEMS.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        'flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors border-b-2',
                        activeTab === tab.key
                          ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500'
                          : 'text-muted-foreground hover:text-foreground border-transparent'
                      )}
                    >
                      <Icon className="size-3.5" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                TAB CONTENT
                ═══════════════════════════════════════════════════════════════ */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="py-4"
              >
                {/* ─── OVERVIEW TAB ─────────────────────────────────────────── */}
                {activeTab === 'overview' && (
                  <div className="space-y-5">
                    {/* Description */}
                    {currentLesson?.description && (
                      <div>
                        <h3 className="text-[15px] font-semibold mb-2">About this lesson</h3>
                        <p className="text-[14px] text-muted-foreground leading-relaxed">
                          {currentLesson.description}
                        </p>
                      </div>
                    )}

                    {/* What you'll learn */}
                    {(objectives.length > 0 || (currentLesson?.content && !currentLesson.objectives)) && (
                      <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 p-4">
                        <h3 className="text-[15px] font-semibold text-emerald-700 dark:text-emerald-400 mb-2">
                          What you&apos;ll learn
                        </h3>
                        <ul className="space-y-1.5">
                          {objectives.length > 0 ? (
                            objectives.map((obj: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-[13px] text-emerald-800 dark:text-emerald-300">
                                <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-500" />
                                <span>{obj}</span>
                              </li>
                            ))
                          ) : (
                            currentLesson?.content && (() => {
                              // Extract first 2-3 sentences as summary when objectives is empty
                              const sentences = currentLesson.content
                                .replace(/\n+/g, '. ')
                                .split(/(?<=[.!?])\s+/)
                                .filter((s: string) => s.trim().length > 10)
                                .slice(0, 3)
                              return sentences.map((sentence: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-[13px] text-emerald-800 dark:text-emerald-300">
                                  <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-500" />
                                  <span>{sentence.trim()}</span>
                                </li>
                              ))
                            })()
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Lesson-type-specific content rendering */}
                    {currentLesson?.type === 'video' && currentLesson?.content && (
                      <div className="rounded-xl bg-blue-50 dark:bg-blue-950/20 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Video className="size-4 text-blue-500" />
                          <h3 className="text-[15px] font-semibold text-blue-700 dark:text-blue-400">Video Lesson</h3>
                        </div>
                        <p className="text-[14px] text-muted-foreground leading-relaxed">
                          Watch the video above to learn this lesson. {currentLesson.content !== currentLesson.description ? 'Additional details are available in the description.' : ''}
                        </p>
                      </div>
                    )}

                    {currentLesson?.type === 'text' && currentLesson?.content && (
                      <div>
                        <h3 className="text-[15px] font-semibold mb-2">Lesson Content</h3>
                        <motion.div
                          className="text-[14px] text-muted-foreground leading-relaxed whitespace-pre-wrap rounded-xl bg-muted/30 p-4 overflow-hidden"
                          animate={{ maxHeight: showFullContent ? 2000 : 320 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                        >
                          {showFullContent ? currentLesson.content : currentLesson.content.substring(0, 2000)}
                        </motion.div>
                        {currentLesson.content.length > 500 && (
                          <button
                            onClick={() => setShowFullContent(!showFullContent)}
                            className="mt-2 text-[13px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            {showFullContent ? 'Show less' : currentLesson.content.length > 2000 ? 'Read more' : 'Read more'}
                          </button>
                        )}
                      </div>
                    )}

                    {currentLesson?.type === 'quiz' && currentLesson?.content && (() => {
                      let quizData: { quizId?: string; questions?: Array<{ id?: string; question: string; options?: string[]; answer?: string | number }> } = {}
                      try {
                        quizData = JSON.parse(currentLesson.content)
                      } catch {
                        // Content is not valid JSON, show as text
                      }
                      const questions = Array.isArray(quizData.questions) ? quizData.questions : []
                      const quizId = quizData.quizId || currentLesson.id
                      if (questions.length === 0) {
                        return (
                          <div>
                            <h3 className="text-[15px] font-semibold mb-2">Quiz</h3>
                            <div className="text-[14px] text-muted-foreground leading-relaxed whitespace-pre-wrap rounded-xl bg-muted/30 p-4">
                              {currentLesson.content}
                            </div>
                          </div>
                        )
                      }

                      const handleSubmitQuiz = async () => {
                        const answers = questions.map((q) => ({
                          questionId: q.id || String(questions.indexOf(q)),
                          answer: quizAnswers[`${q.id || questions.indexOf(q)}-0`] || quizAnswers[`${q.id || questions.indexOf(q)}`] || '',
                        })).filter(a => a.answer)
                        if (answers.length === 0) {
                          toast.error('Please answer at least one question')
                          return
                        }
                        try {
                          const res = await fetch(`/api/quizzes/${quizId}/attempt`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: currentUser?.id, answers }),
                          })
                          if (!res.ok) throw new Error('Failed')
                          const data = await res.json()
                          setQuizResults(data.attempt ? {
                            score: data.attempt.score,
                            maxScore: data.attempt.maxScore,
                            percentage: data.attempt.percentage,
                            passed: data.attempt.passed,
                            xpEarned: data.attempt.xpEarned,
                            gradedAnswers: data.gradedAnswers || [],
                          } : null)
                          setQuizSubmitted(true)
                          if (data.attempt?.xpEarned) {
                            toast.success(`Quiz completed! +${data.attempt.xpEarned} XP earned 🎉`)
                          }
                        } catch {
                          toast.error('Failed to submit quiz')
                        }
                      }

                      const handleRetakeQuiz = () => {
                        setQuizAnswers({})
                        setQuizSubmitted(false)
                        setQuizResults(null)
                      }

                      const getGradedAnswer = (questionId: string) => {
                        return quizResults?.gradedAnswers?.find(ga => ga.questionId === questionId)
                      }

                      return (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <FileQuestion className="size-4 text-violet-500" />
                            <h3 className="text-[15px] font-semibold">Quiz — {questions.length} Question{questions.length !== 1 ? 's' : ''}</h3>
                          </div>

                          {/* Quiz Results Banner */}
                          {quizSubmitted && quizResults && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={cn(
                                'rounded-2xl p-4 mb-4 border',
                                quizResults.passed
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  'flex size-10 items-center justify-center rounded-full',
                                  quizResults.passed ? 'bg-emerald-100 dark:bg-emerald-950/50' : 'bg-rose-100 dark:bg-rose-950/50'
                                )}>
                                  {quizResults.passed ? (
                                    <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                                  ) : (
                                    <X className="size-5 text-rose-600 dark:text-rose-400" />
                                  )}
                                </div>
                                <div>
                                  <p className={cn('text-[15px] font-bold', quizResults.passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400')}>
                                    {quizResults.passed ? 'Passed!' : 'Not Passed'}
                                  </p>
                                  <p className="text-[13px] text-muted-foreground">
                                    Score: {quizResults.score}/{quizResults.maxScore} ({Math.round(quizResults.percentage)}%)
                                    {quizResults.xpEarned > 0 && <span className="text-amber-600 dark:text-amber-400 font-medium ml-2">+{quizResults.xpEarned} XP</span>}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}

                          <div className="space-y-4">
                            {questions.map((q, qi) => {
                              const gradedAnswer = quizSubmitted ? getGradedAnswer(q.id || String(qi)) : null
                              return (
                                <div key={q.id || qi} className={cn(
                                  'rounded-xl p-4 border',
                                  quizSubmitted && gradedAnswer
                                    ? gradedAnswer.isCorrect
                                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                                      : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
                                    : 'bg-muted/30 border-transparent'
                                )}>
                                  <p className="text-[14px] font-medium mb-3">
                                    {qi + 1}. {q.question}
                                    {quizSubmitted && gradedAnswer && (
                                      gradedAnswer.isCorrect
                                        ? <CheckCircle2 className="size-4 text-emerald-500 inline ml-2" />
                                        : <X className="size-4 text-rose-500 inline ml-2" />
                                    )}
                                  </p>
                                  {Array.isArray(q.options) && q.options.length > 0 && (
                                    <div className="space-y-2">
                                      {q.options.map((opt: string, oi: number) => {
                                        const optionKey = `${q.id || qi}-${oi}`
                                        const isSelected = quizAnswers[optionKey] === opt
                                        const isCorrectOption = quizSubmitted && gradedAnswer && gradedAnswer.correctAnswer === opt
                                        const isWrongSelection = quizSubmitted && gradedAnswer && isSelected && !gradedAnswer.isCorrect
                                        return (
                                          <div
                                            key={oi}
                                            onClick={() => !quizSubmitted && setQuizAnswers(prev => ({ ...prev, [optionKey]: opt }))}
                                            className={cn(
                                              'flex w-full items-center gap-3 rounded-lg border p-3 text-left text-[13px] transition-all',
                                              !quizSubmitted && 'cursor-pointer active:scale-[0.99]',
                                              isCorrectOption && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
                                              isWrongSelection && 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400',
                                              !isCorrectOption && !isWrongSelection && isSelected && !quizSubmitted && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
                                              !isCorrectOption && !isWrongSelection && !isSelected && 'border-border/40 hover:border-emerald-300 hover:bg-muted/50',
                                            )}
                                          >
                                            <span className={cn(
                                              'flex size-6 items-center justify-center rounded-full border-2 text-[11px] font-bold shrink-0',
                                              isCorrectOption && 'border-emerald-500 bg-emerald-500 text-white',
                                              isWrongSelection && 'border-rose-500 bg-rose-500 text-white',
                                              !isCorrectOption && !isWrongSelection && isSelected && 'border-emerald-500 bg-emerald-500 text-white',
                                              !isCorrectOption && !isWrongSelection && !isSelected && 'border-muted-foreground/30 text-muted-foreground'
                                            )}>
                                              {String.fromCharCode(65 + oi)}
                                            </span>
                                            <span>{opt}</span>
                                            {isCorrectOption && <CheckCircle2 className="size-4 text-emerald-500 ml-auto shrink-0" />}
                                            {isWrongSelection && <X className="size-4 text-rose-500 ml-auto shrink-0" />}
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}
                                  {/* Show explanation after grading */}
                                  {quizSubmitted && gradedAnswer?.explanation && (
                                    <div className="mt-3 rounded-lg bg-muted/50 p-3">
                                      <p className="text-[12px] font-semibold text-muted-foreground mb-1">Explanation</p>
                                      <p className="text-[13px] text-muted-foreground leading-relaxed">{gradedAnswer.explanation}</p>
                                    </div>
                                  )}
                                  {/* Show correct answer for wrong answers */}
                                  {quizSubmitted && gradedAnswer && !gradedAnswer.isCorrect && gradedAnswer.correctAnswer && (
                                    <div className="mt-2 text-[12px] text-emerald-600 dark:text-emerald-400">
                                      Correct answer: <span className="font-semibold">{gradedAnswer.correctAnswer}</span>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                            {!quizSubmitted ? (
                              <Button
                                onClick={handleSubmitQuiz}
                                disabled={Object.keys(quizAnswers).length === 0}
                                className="rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white active:scale-[0.97] h-10 text-[14px] font-semibold"
                              >
                                <CheckCircle2 className="size-4 mr-2" />
                                Submit Quiz
                              </Button>
                            ) : (
                              <Button
                                onClick={handleRetakeQuiz}
                                variant="outline"
                                className="rounded-2xl active:scale-[0.97] h-10 text-[14px] font-semibold"
                              >
                                Retake Quiz
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    })()}

                    {currentLesson?.type === 'assignment' && currentLesson?.content && (() => {
                      let assignmentId = currentLesson.id
                      try {
                        const parsed = JSON.parse(currentLesson.content)
                        if (parsed.assignmentId) assignmentId = parsed.assignmentId
                      } catch {
                        // Content is not JSON, use lesson id
                      }

                      const handleSubmitAssignment = async () => {
                        if (!assignmentContent.trim()) {
                          toast.error('Please write your answer before submitting')
                          return
                        }
                        setAssignmentSubmitting(true)
                        try {
                          const res = await fetch('/api/student/assignments', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              userId: currentUser?.id,
                              assignmentId,
                              content: assignmentContent,
                            }),
                          })
                          if (!res.ok) throw new Error('Failed')
                          const data = await res.json()
                          setAssignmentSubmitted(true)
                          if (data.xpEarned) {
                            toast.success(`Assignment submitted! +${data.xpEarned} XP earned 🎉`)
                          } else {
                            toast.success('Assignment submitted successfully!')
                          }
                        } catch {
                          toast.error('Failed to submit assignment')
                        } finally {
                          setAssignmentSubmitting(false)
                        }
                      }

                      return (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <ClipboardList className="size-4 text-rose-500" />
                            <h3 className="text-[15px] font-semibold">Assignment</h3>
                          </div>
                          <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <Award className="size-4 text-rose-500" />
                              <span className="text-[13px] font-semibold text-rose-700 dark:text-rose-400">Instructions</span>
                            </div>
                            <div className="text-[14px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {(() => {
                                try {
                                  const parsed = JSON.parse(currentLesson.content)
                                  return parsed.instructions || parsed.content || currentLesson.content
                                } catch {
                                  return currentLesson.content
                                }
                              })()}
                            </div>

                            {assignmentSubmitted ? (
                              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                                  <div>
                                    <p className="text-[14px] font-semibold text-emerald-700 dark:text-emerald-400">Assignment Submitted</p>
                                    <p className="text-[12px] text-muted-foreground">Your submission is pending review by the instructor.</p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <Textarea
                                  placeholder="Write your answer here..."
                                  value={assignmentContent}
                                  onChange={(e) => setAssignmentContent(e.target.value)}
                                  className="min-h-[120px] resize-none rounded-xl text-[14px]"
                                  disabled={assignmentSubmitting}
                                />
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full text-[12px] h-8 gap-1.5 active:scale-[0.97]"
                                    onClick={() => toast.info('File upload coming soon!')}
                                  >
                                    <Download className="size-3" />
                                    Attach files
                                  </Button>
                                  <Button
                                    onClick={handleSubmitAssignment}
                                    disabled={assignmentSubmitting || !assignmentContent.trim()}
                                    className="rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white active:scale-[0.97] h-10 text-[14px] font-semibold"
                                  >
                                    {assignmentSubmitting ? (
                                      <><Loader2 className="size-4 mr-2 animate-spin" />Submitting...</>
                                    ) : (
                                      <><Send className="size-4 mr-2" />Submit Assignment</>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })()}

                    {currentLesson?.type === 'interactive' && currentLesson?.content && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-0 text-[11px] rounded-full px-2 py-0.5 gap-1">
                            <Sparkles className="size-3" />
                            Interactive Lesson
                          </Badge>
                        </div>
                        <div className="text-[14px] text-muted-foreground leading-relaxed whitespace-pre-wrap rounded-xl bg-purple-50 dark:bg-purple-950/20 p-4">
                          {currentLesson.content}
                        </div>
                      </div>
                    )}

                    {currentLesson?.type === 'download' && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Download className="size-4 text-cyan-500" />
                          <h3 className="text-[15px] font-semibold">Downloadable Resources</h3>
                        </div>
                        {resources.length > 0 ? (
                          <div className="space-y-2">
                            {resources.map((res: { name: string; url: string; type: string }, i: number) => (
                              <div
                                key={i}
                                className="flex items-center gap-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/20 p-4 hover:bg-cyan-100 dark:hover:bg-cyan-950/30 transition-colors"
                              >
                                {getFileIcon(res.name || res.type)}
                                <div className="min-w-0 flex-1">
                                  <p className="text-[14px] font-medium truncate">{res.name}</p>
                                  <p className="text-[12px] text-muted-foreground">{res.type} file</p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="shrink-0 rounded-full active:scale-[0.97] text-[12px] h-8 text-cyan-600 border-cyan-200 dark:border-cyan-800 hover:bg-cyan-50"
                                  onClick={() => {
                                    if (res.url) {
                                      window.open(res.url, '_blank')
                                    } else {
                                      toast.info('Download starting...')
                                    }
                                  }}
                                >
                                  <Download className="size-3 mr-1" />
                                  Download
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : currentLesson?.content ? (
                          <div className="text-[14px] text-muted-foreground leading-relaxed whitespace-pre-wrap rounded-xl bg-muted/30 p-4">
                            {currentLesson.content}
                          </div>
                        ) : (
                          <p className="text-[13px] text-muted-foreground">No downloadable resources available for this lesson.</p>
                        )}
                      </div>
                    )}

                    {/* Attachments (for non-download lesson types) */}
                    {currentLesson?.type !== 'download' && resources.length > 0 && (
                      <div>
                        <h3 className="text-[15px] font-semibold mb-2">Attachments</h3>
                        <div className="space-y-2">
                          {resources.map((res: { name: string; url: string; type: string }, i: number) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 rounded-xl bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
                            >
                              {getFileIcon(res.name || res.type)}
                              <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-medium truncate">{res.name}</p>
                                <p className="text-[11px] text-muted-foreground">{res.type}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="shrink-0 rounded-full active:scale-[0.97] text-emerald-600"
                                onClick={() => toast.info('Download starting...')}
                              >
                                <Download className="size-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mark as Complete */}
                    {!isLessonCompleted && (
                      <div className="pt-2">
                        <Button
                          onClick={handleMarkComplete}
                          className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white active:scale-[0.97] h-11 text-[15px] font-semibold"
                        >
                          <CheckCircle2 className="size-4 mr-2" />
                          Mark as Complete
                        </Button>
                      </div>
                    )}

                    {/* Was this helpful? */}
                    <div className="pt-3 border-t border-border/40">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] text-muted-foreground">Was this lesson helpful?</p>
                        <div className="flex items-center gap-1.5">
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => { setHelpfulFeedback('up'); toast.success('Thanks for your feedback!') }}
                            className={cn(
                              'flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all',
                              helpfulFeedback === 'up'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-muted/50 text-muted-foreground hover:bg-muted/80'
                            )}
                          >
                            <ThumbsUp className="size-3.5" />
                            Helpful
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => { setHelpfulFeedback('down'); toast.success('We\'ll improve this lesson!') }}
                            className={cn(
                              'flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all',
                              helpfulFeedback === 'down'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                                : 'bg-muted/50 text-muted-foreground hover:bg-muted/80'
                            )}
                          >
                            <ThumbsDown className="size-3.5" />
                            Not really
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── NOTES TAB ─────────────────────────────────────────────── */}
                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[15px] font-semibold">Your Notes</h3>
                      <div className="flex items-center gap-2">
                        {noteSaving && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Loader2 className="size-3 animate-spin" />
                            Saving...
                          </span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedNoteId(null)
                            setNoteContent('')
                            setNoteColor('default')
                          }}
                          className="rounded-full active:scale-[0.97] text-[12px] h-8 gap-1"
                        >
                          <PenLine className="size-3" />
                          New
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExportNotes}
                          className="rounded-full active:scale-[0.97] text-[12px] h-8"
                        >
                          <Download className="size-3 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>

                    {/* Note editor */}
                    <div className="space-y-2">
                      {/* Color picker */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground mr-1">Color:</span>
                        {['default', 'yellow', 'green', 'blue', 'pink', 'purple'].map((c) => (
                          <button
                            key={c}
                            onClick={() => setNoteColor(c)}
                            className={cn(
                              'size-5 rounded-full border-2 transition-all active:scale-[0.95]',
                              noteColor === c ? 'border-foreground scale-110' : 'border-transparent hover:scale-105',
                              c === 'default' && 'bg-muted',
                              c === 'yellow' && 'bg-yellow-200 dark:bg-yellow-700',
                              c === 'green' && 'bg-green-200 dark:bg-green-700',
                              c === 'blue' && 'bg-blue-200 dark:bg-blue-700',
                              c === 'pink' && 'bg-pink-200 dark:bg-pink-700',
                              c === 'purple' && 'bg-purple-200 dark:bg-purple-700',
                            )}
                          />
                        ))}
                      </div>
                      <div className="relative">
                        <Textarea
                          placeholder="Take notes here... (auto-saved)"
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          className={cn(
                            'min-h-[120px] resize-none rounded-2xl text-[14px]',
                            noteColor === 'yellow' && 'bg-yellow-50 dark:bg-yellow-950/20',
                            noteColor === 'green' && 'bg-green-50 dark:bg-green-950/20',
                            noteColor === 'blue' && 'bg-blue-50 dark:bg-blue-950/20',
                            noteColor === 'pink' && 'bg-pink-50 dark:bg-pink-950/20',
                            noteColor === 'purple' && 'bg-purple-50 dark:bg-purple-950/20',
                          )}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleAddTimestampNote}
                          className="absolute bottom-2 right-2 rounded-full active:scale-[0.97] text-[11px] h-7 bg-muted/50"
                        >
                          <Clock className="size-3 mr-1" />
                          Add timestamp
                        </Button>
                      </div>
                    </div>

                    {/* Saved notes */}
                    {notes.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[13px] font-medium text-muted-foreground">Saved Notes ({notes.length})</h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                          {notes.map((note) => (
                            <div
                              key={note.id}
                              onClick={() => {
                                setSelectedNoteId(note.id)
                                setNoteContent(note.content)
                                setNoteColor(note.color || 'default')
                              }}
                              className={cn(
                                'rounded-xl p-3 cursor-pointer transition-all hover:ring-1 hover:ring-emerald-300',
                                selectedNoteId === note.id
                                  ? 'ring-2 ring-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                                  : 'bg-muted/30 hover:bg-muted/50',
                                note.color === 'yellow' && 'bg-yellow-50/50 dark:bg-yellow-950/10',
                                note.color === 'green' && 'bg-green-50/50 dark:bg-green-950/10',
                                note.color === 'blue' && 'bg-blue-50/50 dark:bg-blue-950/10',
                                note.color === 'pink' && 'bg-pink-50/50 dark:bg-pink-950/10',
                                note.color === 'purple' && 'bg-purple-50/50 dark:bg-purple-950/10',
                              )}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {note.timestamp !== null && (
                                  <Badge variant="outline" className="text-[10px] rounded-full px-1.5 py-0 h-5 font-mono">
                                    {formatTime(note.timestamp)}
                                  </Badge>
                                )}
                                {/* Color indicator dot */}
                                {note.color && note.color !== 'default' && (
                                  <div className={cn(
                                    'size-2 rounded-full',
                                    note.color === 'yellow' && 'bg-yellow-400',
                                    note.color === 'green' && 'bg-green-400',
                                    note.color === 'blue' && 'bg-blue-400',
                                    note.color === 'pink' && 'bg-pink-400',
                                    note.color === 'purple' && 'bg-purple-400',
                                  )} />
                                )}
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
                                </span>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation()
                                    try {
                                      await fetch('/api/student/notes', {
                                        method: 'DELETE',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ noteId: note.id }),
                                      })
                                      setNotes(prev => prev.filter(n => n.id !== note.id))
                                      if (selectedNoteId === note.id) {
                                        setSelectedNoteId(null)
                                        setNoteContent('')
                                        setNoteColor('default')
                                      }
                                      toast.success('Note deleted')
                                    } catch {
                                      toast.error('Failed to delete note')
                                    }
                                  }}
                                  className="ml-auto text-muted-foreground/40 hover:text-rose-500 transition-colors active:scale-[0.95]"
                                >
                                  <X className="size-3.5" />
                                </button>
                              </div>
                              <p className="text-[13px] text-foreground line-clamp-2">{note.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {notes.length === 0 && !noteContent && (
                      <div className="flex flex-col items-center gap-3 py-8 text-center">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/50">
                          <PenLine className="size-5 text-muted-foreground" />
                        </div>
                        <p className="text-[13px] text-muted-foreground">
                          No notes yet. Start typing above to take notes.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── RESOURCES TAB ─────────────────────────────────────────── */}
                {activeTab === 'resources' && (
                  <div className="space-y-4">
                    <h3 className="text-[15px] font-semibold">Resources</h3>

                    {/* Downloadable files */}
                    {resources.length > 0 ? (
                      <div className="space-y-2">
                        {resources.map((res: { name: string; url: string; type: string }, i: number) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 rounded-xl bg-muted/30 p-4 hover:bg-muted/50 transition-colors"
                          >
                            {getFileIcon(res.name || res.type)}
                            <div className="min-w-0 flex-1">
                              <p className="text-[14px] font-medium truncate">{res.name}</p>
                              <p className="text-[12px] text-muted-foreground">{res.type} file</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="shrink-0 rounded-full active:scale-[0.97] text-[12px] h-8"
                              onClick={() => toast.info('Download starting...')}
                            >
                              <Download className="size-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3 py-8 text-center">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/50">
                          <FileText className="size-5 text-muted-foreground" />
                        </div>
                        <p className="text-[13px] text-muted-foreground">
                          No downloadable resources for this lesson.
                        </p>
                      </div>
                    )}

                    {/* Course slides */}
                    {currentLesson?.slideUrl && (
                      <div className="rounded-xl bg-muted/30 p-4">
                        <div className="flex items-center gap-3">
                          <ExternalLink className="size-5 text-emerald-500" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[14px] font-medium">Course Slides</p>
                            <p className="text-[12px] text-muted-foreground truncate">{currentLesson.slideUrl}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 rounded-full active:scale-[0.97] text-[12px] h-8"
                            onClick={() => window.open(currentLesson.slideUrl!, '_blank')}
                          >
                            Open
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Transcript */}
                    {currentLesson?.transcript && (
                      <div>
                        <h4 className="text-[13px] font-semibold mb-2">Transcript</h4>
                        <div className="rounded-xl bg-muted/30 p-4 max-h-48 overflow-y-auto scrollbar-thin">
                          <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {currentLesson.transcript}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── Q&A TAB ──────────────────────────────────────────────── */}
                {activeTab === 'qa' && (
                  <div className="space-y-4">
                    <h3 className="text-[15px] font-semibold">Questions & Answers</h3>

                    {/* Ask question */}
                    <div className="space-y-3">
                      <div className="relative">
                        <Input
                          placeholder="Ask a question about this lesson..."
                          value={qaQuestion}
                          onChange={(e) => setQaQuestion(e.target.value)}
                          className="rounded-2xl pr-20 text-[14px]"
                          onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                        />
                        <Button
                          size="sm"
                          onClick={handleAskQuestion}
                          disabled={!qaQuestion.trim()}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full active:scale-[0.97] text-[12px] h-7 bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                        >
                          Ask instructor
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-[12px]">
                        <Sparkles className="size-3 text-emerald-500" />
                        <span className="text-muted-foreground">
                          Check <button onClick={() => setActiveTab('ai-tutor')} className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">Ask <ShijlAIText /></button> first for instant answers
                        </span>
                      </div>
                    </div>

                    {/* Questions list */}
                    {qaLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="rounded-xl bg-muted/30 p-4 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                          </div>
                        ))}
                      </div>
                    ) : qaQuestions.length > 0 ? (
                      <ScrollArea className="max-h-96">
                        <div className="space-y-2">
                          {qaQuestions.map((q) => (
                            <div key={q.id} className="rounded-xl bg-muted/30 p-3 hover:bg-muted/50 transition-colors">
                              <div className="flex items-start gap-3">
                                <div className="flex flex-col items-center gap-0.5 pt-0.5">
                                  <button
                                    onClick={async () => {
                                      try {
                                        await fetch('/api/student/qa', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ action: 'upvote', questionId: q.id }),
                                        })
                                        setQaQuestions(prev => prev.map(pq =>
                                          pq.id === q.id ? { ...pq, upvotes: pq.upvotes + 1 } : pq
                                        ))
                                      } catch {
                                        toast.error('Failed to upvote')
                                      }
                                    }}
                                    className="text-muted-foreground hover:text-emerald-500 transition-colors active:scale-[0.97]"
                                  >
                                    <ThumbsUp className="size-3.5" />
                                  </button>
                                  <span className="text-[11px] font-medium text-muted-foreground">{q.upvotes}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <button
                                    onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                                    className="text-left w-full"
                                  >
                                    <p className="text-[13px] text-foreground leading-snug">{q.question}</p>
                                  </button>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[11px] text-muted-foreground">{q.userName}</span>
                                    {q.isAnswered && (
                                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0 text-[10px] rounded-full px-1.5 py-0 h-4">
                                        Answered
                                      </Badge>
                                    )}
                                    <span className="text-[11px] text-muted-foreground">{q.answerCount} answer{q.answerCount !== 1 ? 's' : ''}</span>
                                    <button
                                      onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                                      className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                                    >
                                      {expandedQuestion === q.id ? 'Hide answers' : 'View answers'}
                                    </button>
                                  </div>

                                  {/* Expanded answers */}
                                  <AnimatePresence>
                                    {expandedQuestion === q.id && q.answers && q.answers.length > 0 && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="mt-3 space-y-2 overflow-hidden"
                                      >
                                        {q.answers.map((answer) => (
                                          <div key={answer.id} className="rounded-lg bg-background/60 border border-border/40 p-3">
                                            <div className="flex items-center gap-2 mb-1.5">
                                              <div className="flex size-5 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                                                {answer.isAiGenerated ? (
                                                  <Bot className="size-3 text-emerald-600 dark:text-emerald-400" />
                                                ) : (
                                                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                                                    {answer.userName?.charAt(0)?.toUpperCase() || '?'}
                                                  </span>
                                                )}
                                              </div>
                                              <span className="text-[11px] font-medium text-foreground">{answer.userName}</span>
                                              {answer.isAiGenerated && (
                                                <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 border-0 text-[9px] rounded-full px-1.5 py-0 h-4 gap-0.5">
                                                  <Sparkles className="size-2.5" />
                                                  AI
                                                </Badge>
                                              )}
                                              <span className="text-[10px] text-muted-foreground">
                                                {new Date(answer.createdAt).toLocaleDateString()}
                                              </span>
                                            </div>
                                            <p className="text-[12px] text-muted-foreground leading-relaxed">{answer.content}</p>
                                          </div>
                                        ))}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>

                                  {/* No answers yet */}
                                  <AnimatePresence>
                                    {expandedQuestion === q.id && (!q.answers || q.answers.length === 0) && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-3 text-center py-3"
                                      >
                                        <p className="text-[12px] text-muted-foreground">No answers yet. The instructor or AI will respond soon.</p>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="flex flex-col items-center gap-3 py-8 text-center">
                        <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/50">
                          <HelpCircle className="size-5 text-muted-foreground" />
                        </div>
                        <p className="text-[13px] text-muted-foreground">
                          No questions yet. Be the first to ask!
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── ASK SHIJLAI TAB ─────────────────────────────────────────── */}
                {activeTab === 'ai-tutor' && (
                  <div className="space-y-0 -m-4">
                    <div className="flex flex-col h-[400px]">
                      {/* Messages */}
                      <div ref={aiScrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
                        {aiMessages.length === 0 && (
                          <div className="flex flex-col items-center gap-4 py-8 text-center">
                            <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white ios-shadow-sm">
                              <Bot className="size-7" />
                            </div>
                            <div>
                              <h3 className="text-[17px] font-bold text-foreground">✦ Ask <ShijlAIText /></h3>
                              <p className="text-[13px] text-muted-foreground mt-1 max-w-xs">
                                Ask me anything about this lesson. I can explain concepts, give examples, and quiz you!
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center">
                              <button
                                onClick={() => setAiInput('Explain this concept differently')}
                                className="rounded-full bg-muted/60 px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-muted/80 transition-colors active:scale-[0.97]"
                              >
                                Explain differently
                              </button>
                              <button
                                onClick={() => setAiInput('Ask in another language 🌐')}
                                className="rounded-full bg-muted/60 px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-muted/80 transition-colors active:scale-[0.97]"
                              >
                                Ask in another language 🌐
                              </button>
                              <button
                                onClick={() => setAiInput('Give me a practice problem')}
                                className="rounded-full bg-muted/60 px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:bg-muted/80 transition-colors active:scale-[0.97]"
                              >
                                Practice problem
                              </button>
                            </div>
                          </div>
                        )}

                        {aiMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={cn(
                              'flex gap-2',
                              msg.role === 'user' ? 'justify-end' : 'justify-start'
                            )}
                          >
                            {msg.role === 'assistant' && (
                              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white mt-0.5">
                                <Bot className="size-3.5" />
                              </div>
                            )}
                            <div
                              className={cn(
                                'max-w-[80%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed',
                                msg.role === 'user'
                                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-md'
                                  : 'bg-muted text-foreground rounded-bl-md'
                              )}
                            >
                              {msg.role === 'assistant' && (
                                <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1">✦ Ask <ShijlAIText /></p>
                              )}
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          </div>
                        ))}

                        {/* Typing indicator */}
                        {aiLoading && (
                          <div className="flex gap-2 justify-start">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white mt-0.5">
                              <Bot className="size-3.5" />
                            </div>
                            <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                {[0, 1, 2].map((i) => (
                                  <motion.div
                                    key={i}
                                    className="size-2 rounded-full bg-emerald-500"
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{
                                      duration: 0.6,
                                      repeat: Infinity,
                                      delay: i * 0.15,
                                      ease: 'easeInOut',
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* AI input */}
                      <div className="border-t border-border/40 p-3">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            handleAiSend()
                          }}
                          className="flex items-center gap-2"
                        >
                          <Input
                            placeholder="Ask about this lesson..."
                            value={aiInput}
                            onChange={(e) => setAiInput(e.target.value)}
                            className="rounded-full text-[14px] h-9"
                            disabled={aiLoading}
                          />
                          <Button
                            type="submit"
                            size="sm"
                            disabled={!aiInput.trim() || aiLoading}
                            className="shrink-0 rounded-full active:scale-[0.97] h-9 w-9 p-0 bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                          >
                            {aiLoading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                          </Button>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ─── Mobile: Course Content Toggle ───────────────────────────────── */}
        {/* Mobile toggle - shows button to open course content drawer */}
        <div className="lg:hidden px-4 py-2">
          <Button
            variant="outline"
            onClick={() => setMobileSidebarOpen(true)}
            className="w-full rounded-xl active:scale-[0.97] text-[13px]"
          >
            <BookOpen className="size-4 mr-2" />
            Show Course Content
          </Button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar drawer — slides from left like the desktop sidebar */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ ...springTransition }}
            className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-[320px] bg-card shadow-2xl overflow-y-auto scrollbar-thin"
          >
            {/* Close button */}
            <div className="flex items-center justify-between p-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-emerald-500" />
                <h3 className="text-[15px] font-semibold">Course Content</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileSidebarOpen(false)}
                className="size-8 rounded-full active:scale-[0.97]"
              >
                <X className="size-4" />
              </Button>
            </div>

            {/* Same sidebar content for mobile - with collapsible modules */}
            <div className="p-2">
              {courseData.modules.map((mod) => {
                const moduleStatus = moduleStatuses.get(mod.id) || 'locked'
                const isExpanded = expandedModules.has(mod.id)
                const completedInModule = mod.lessons.filter(l => progressMap.get(l.id)?.status === 'completed').length

                return (
                  <div key={mod.id} className="mb-1">
                    <div className="px-3 py-2">
                      <button
                        onClick={() => {
                          setExpandedModules(prev => {
                            const next = new Set(prev)
                            if (next.has(mod.id)) next.delete(mod.id)
                            else next.add(mod.id)
                            return next
                          })
                        }}
                        className="w-full flex items-center gap-2 text-left"
                      >
                        <div className={cn(
                          'flex size-5 items-center justify-center rounded-full shrink-0',
                          moduleStatus === 'completed' ? 'bg-emerald-100 dark:bg-emerald-950/40' :
                          moduleStatus === 'in_progress' ? 'bg-amber-100 dark:bg-amber-950/40' :
                          'bg-muted/50'
                        )}>
                          {moduleStatus === 'completed' ? (
                            <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                          ) : moduleStatus === 'in_progress' ? (
                            <Circle className="size-3 text-amber-500 fill-amber-500/30" />
                          ) : (
                            <Lock className="size-2.5 text-muted-foreground/50" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-semibold truncate">Module {mod.order}: {mod.title}</p>
                          <p className="text-[10px] text-muted-foreground">{completedInModule}/{mod.lessons.length} completed</p>
                        </div>
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown className="size-3.5 text-muted-foreground/60" />
                        </motion.div>
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="space-y-0.5 pl-3 pr-1 py-1">
                        {mod.lessons.map((lesson) => {
                          const lp = progressMap.get(lesson.id)
                          const status: 'completed' | 'in_progress' | 'not_started' | 'locked' =
                            moduleStatus === 'locked' ? 'locked' :
                            lp?.status === 'completed' ? 'completed' :
                            lp?.status === 'in_progress' ? 'in_progress' : 'not_started'
                          const isCurrent = lesson.id === currentLesson?.id

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => {
                                handleLessonSelect(lesson)
                                setMobileSidebarOpen(false)
                              }}
                              disabled={status === 'locked'}
                              className={cn(
                                'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-all active:scale-[0.97]',
                                isCurrent
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400'
                                  : status === 'locked'
                                  ? 'text-muted-foreground/40 cursor-not-allowed'
                                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                                status === 'completed' && !isCurrent && 'text-emerald-600 dark:text-emerald-400'
                              )}
                            >
                              <div className={cn(
                                'flex size-6 items-center justify-center rounded-md shrink-0',
                                getLessonTypeBg(lesson.type)
                              )}>
                                {getLessonTypeIcon(lesson.type)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={cn('truncate text-[13px]', isCurrent ? 'font-semibold' : 'font-medium')}>
                                  {lesson.title}
                                </p>
                              </div>
                              {status === 'completed' && !isCurrent && (
                                <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                              )}
                              <span className="text-[11px] text-muted-foreground shrink-0">{lesson.duration}m</span>
                              {lesson.isFree && (
                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0 text-[9px] rounded-full px-1.5 py-0 h-4 shrink-0">
                                  Free
                                </Badge>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Mobile bottom actions */}
            <div className="border-t border-border/40 p-4 space-y-3">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{Math.round(courseData.overallProgress)}%</span>
              </div>
              <Progress value={courseData.overallProgress} className="h-2 bg-muted/50 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-teal-500" />
              {hasNextLesson && (
                <Button
                  onClick={() => {
                    handleNextLesson()
                    setMobileSidebarOpen(false)
                  }}
                  className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white active:scale-[0.97] h-10 text-[14px] font-semibold"
                >
                  <Play className="size-4 mr-2 fill-white" />
                  Next lesson
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════
          NOTES PANEL (Collapsible Side Panel)
          ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {notesPanelOpen && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-[360px] max-w-[90vw] bg-card border-l border-border/40 shadow-2xl flex flex-col"
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                  <PenLine className="size-3.5" />
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold">Lesson Notes</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {currentLesson?.title}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Auto-save indicator */}
                <div className="flex items-center gap-1">
                  {noteSaving ? (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Loader2 className="size-3 animate-spin" />
                      Saving...
                    </span>
                  ) : lastSavedAt ? (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="size-3" />
                      Saved ✓
                    </span>
                  ) : null}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNotesPanelOpen(false)}
                  className="size-8 rounded-full active:scale-[0.97]"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {/* Timestamp info */}
            {lastSavedAt && (
              <div className="px-4 py-1.5 bg-muted/30 border-b border-border/20">
                <p className="text-[10px] text-muted-foreground">
                  Last saved: {lastSavedAt.toLocaleTimeString()}
                </p>
              </div>
            )}

            {/* Note Editor */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto scrollbar-thin">
              {/* Color picker + New note */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {['default', 'yellow', 'green', 'blue', 'pink', 'purple'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setNoteColor(c)}
                      className={cn(
                        'size-4 rounded-full border-2 transition-all active:scale-[0.95]',
                        noteColor === c ? 'border-foreground scale-110' : 'border-transparent hover:scale-105',
                        c === 'default' && 'bg-muted',
                        c === 'yellow' && 'bg-yellow-200 dark:bg-yellow-700',
                        c === 'green' && 'bg-green-200 dark:bg-green-700',
                        c === 'blue' && 'bg-blue-200 dark:bg-blue-700',
                        c === 'pink' && 'bg-pink-200 dark:bg-pink-700',
                        c === 'purple' && 'bg-purple-200 dark:bg-purple-700',
                      )}
                    />
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedNoteId(null)
                    setNoteContent('')
                    setNoteColor('default')
                  }}
                  className="rounded-full text-[11px] h-7 gap-1 active:scale-[0.97]"
                >
                  <PenLine className="size-3" />
                  New
                </Button>
              </div>
              <div className="relative">
                <Textarea
                  placeholder="Take notes here... (auto-saved)"
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className={cn(
                    'min-h-[200px] resize-none rounded-xl text-[14px] leading-relaxed',
                    noteColor === 'yellow' && 'bg-yellow-50 dark:bg-yellow-950/20',
                    noteColor === 'green' && 'bg-green-50 dark:bg-green-950/20',
                    noteColor === 'blue' && 'bg-blue-50 dark:bg-blue-950/20',
                    noteColor === 'pink' && 'bg-pink-50 dark:bg-pink-950/20',
                    noteColor === 'purple' && 'bg-purple-50 dark:bg-purple-950/20',
                  )}
                />
              </div>

              {/* Saved notes list in panel */}
              {notes.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Saved Notes</h4>
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => {
                        setSelectedNoteId(note.id)
                        setNoteContent(note.content)
                        setNoteColor(note.color || 'default')
                      }}
                      className={cn(
                        'rounded-lg p-2 cursor-pointer transition-all text-[12px]',
                        selectedNoteId === note.id
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 ring-1 ring-emerald-300'
                          : 'bg-muted/30 hover:bg-muted/50',
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        {note.timestamp !== null && (
                          <span className="text-[10px] font-mono text-muted-foreground">{formatTime(note.timestamp)}</span>
                        )}
                        {note.color && note.color !== 'default' && (
                          <div className={cn(
                            'size-1.5 rounded-full',
                            note.color === 'yellow' && 'bg-yellow-400',
                            note.color === 'green' && 'bg-green-400',
                            note.color === 'blue' && 'bg-blue-400',
                            note.color === 'pink' && 'bg-pink-400',
                            note.color === 'purple' && 'bg-purple-400',
                          )} />
                        )}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            try {
                              await fetch('/api/student/notes', {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ noteId: note.id }),
                              })
                              setNotes(prev => prev.filter(n => n.id !== note.id))
                              if (selectedNoteId === note.id) {
                                setSelectedNoteId(null)
                                setNoteContent('')
                                setNoteColor('default')
                              }
                              toast.success('Note deleted')
                            } catch {
                              toast.error('Failed to delete note')
                            }
                          }}
                          className="ml-auto text-muted-foreground/40 hover:text-rose-500 transition-colors"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                      <p className="line-clamp-2 text-muted-foreground mt-0.5">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Panel Footer */}
            <div className="border-t border-border/40 p-4 space-y-3">
              {/* Quick actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddTimestampNote}
                  className="rounded-full text-[12px] h-8 gap-1.5 active:scale-[0.97] flex-1"
                >
                  <Clock className="size-3" />
                  Add timestamp
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportNotes}
                  className="rounded-full text-[12px] h-8 gap-1.5 active:scale-[0.97] flex-1"
                >
                  <Download className="size-3" />
                  Download
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Press <kbd className="px-1 py-0.5 rounded bg-muted text-[9px] font-mono">N</kbd> to toggle this panel
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes panel backdrop */}
      <AnimatePresence>
        {notesPanelOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setNotesPanelOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════
          KEYBOARD SHORTCUTS FLOATING HINT
          ═══════════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-6 right-6 z-40">
        <AnimatePresence>
          {showShortcuts && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-14 right-0 w-56 rounded-2xl bg-card border border-border/60 shadow-2xl p-4 space-y-3"
            >
              <h4 className="text-[13px] font-semibold flex items-center gap-1.5">
                <Keyboard className="size-4 text-emerald-500" />
                Keyboard Shortcuts
              </h4>
              <div className="space-y-2">
                {[
                  { key: 'Space', desc: 'Play / Pause' },
                  { key: '← →', desc: 'Rewind / Forward 10s' },
                  { key: 'Shift+← →', desc: 'Previous / Next lesson' },
                  { key: 'N', desc: 'Toggle notes panel' },
                  { key: '?', desc: 'Toggle this help' },
                ].map((shortcut) => (
                  <div key={shortcut.key} className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">{shortcut.desc}</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono font-medium text-foreground">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowShortcuts(prev => !prev)}
          className={cn(
            'flex size-10 items-center justify-center rounded-full shadow-lg transition-colors',
            showShortcuts
              ? 'bg-emerald-500 text-white'
              : 'bg-card border border-border/60 text-muted-foreground hover:text-foreground'
          )}
        >
          <HelpCircle className="size-5" />
        </motion.button>
      </div>
    </motion.div>
  )
}
