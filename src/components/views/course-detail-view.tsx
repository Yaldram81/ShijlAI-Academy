'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import {
  ArrowLeft,
  Star,
  Users,
  Clock,
  BookOpen,
  Video,
  FileText,
  HelpCircle,
  CheckCircle2,
  PlayCircle,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Loader2,
  GraduationCap,
  Award,
  Lock,
  Zap,
  Timer,
  Target,
  Sparkles,
  ArrowRight,
  Globe,
  BarChart3,
  MessageSquare,
  Download,
  ExternalLink,
  Bookmark,
  StickyNote,
  ThumbsUp,
  Send,
  X,
  Maximize2,
  Eye,
  ListChecks,
  Shield,
  Infinity,
  Smartphone,
  Tv,
  Tag,
  MessageCircle,
} from 'lucide-react'
import { ShijlAIText } from '@/components/ui/brand-text'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { StudentStatCard, StudentStatCardGrid } from '@/components/student/student-stat-card'
import type { Course, Module, Lesson, LessonType, Enrollment, LessonProgress, Quiz } from '@/lib/types'

// ─── Types ──────────────────────────────────────────────────────────────────

interface CourseDetail {
  course: Course & {
    instructor: {
      id: string
      name: string
      avatar: string | null
      bio: string | null
    }
    modules: Module[]
    quizzes: Array<{
      id: string
      title: string
      type: string
      timeLimit: number
      passingScore: number
    }>
    _count: {
      enrollments: number
    }
  }
  enrollment: (Enrollment & { lessonProgress: LessonProgress[] }) | null
}

type TabId = 'overview' | 'curriculum' | 'resources' | 'qa' | 'reviews'

interface QAPost {
  id: string
  userName: string
  avatar: string | null
  question: string
  date: string
  replies: number
  resolved: boolean
}

interface ReviewData {
  id: string
  userName: string
  avatar: string | null
  rating: number
  date: string
  content: string
  helpful: number
}

// ─── Constants ──────────────────────────────────────────────────────────────

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

const lessonTypeIcons: Record<string, React.ReactNode> = {
  video: <Video className="size-4 text-rose-500" />,
  text: <FileText className="size-4 text-sky-500" />,
  interactive: <PlayCircle className="size-4 text-amber-500" />,
  quiz: <HelpCircle className="size-4 text-violet-500" />,
  assignment: <Target className="size-4 text-orange-500" />,
  'live-session': <Globe className="size-4 text-cyan-500" />,
  download: <Download className="size-4 text-emerald-500" />,
}

const lessonTypeBg: Record<string, string> = {
  video: 'bg-rose-50',
  text: 'bg-sky-50',
  interactive: 'bg-amber-50',
  quiz: 'bg-violet-50',
  assignment: 'bg-orange-50',
  'live-session': 'bg-cyan-50',
  download: 'bg-emerald-50',
}

const levelColors: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
}

const categoryGradients: Record<string, string> = {
  IB: 'from-emerald-500 to-teal-600',
  Programming: 'from-teal-500 to-emerald-600',
  'O-Levels': 'from-emerald-400 to-teal-500',
  'A-Levels': 'from-teal-400 to-emerald-500',
  IELTS: 'from-emerald-600 to-teal-700',
  AWS: 'from-teal-600 to-emerald-700',
  Mathematics: 'from-emerald-500 to-teal-600',
  Physics: 'from-teal-500 to-cyan-600',
  Chemistry: 'from-emerald-400 to-teal-500',
  Biology: 'from-teal-400 to-emerald-500',
  English: 'from-emerald-600 to-teal-700',
  'Computer Science': 'from-teal-600 to-cyan-700',
  'Data Science': 'from-cyan-500 to-teal-600',
  'Web Development': 'from-teal-500 to-cyan-600',
  Tech: 'from-teal-500 to-cyan-600',
  Django: 'from-emerald-500 to-teal-600',
  Git: 'from-teal-400 to-emerald-500',
}

const relatedCourses = [
  { id: 'r1', title: 'Advanced Mathematics for IB', category: 'Mathematics', rating: 4.8, students: 1200, price: 0, level: 'intermediate' },
  { id: 'r2', title: 'Physics Lab Practicals', category: 'Physics', rating: 4.6, students: 890, price: 0, level: 'beginner' },
  { id: 'r3', title: 'English Grammar Masterclass', category: 'English', rating: 4.5, students: 2300, price: 0, level: 'beginner' },
  { id: 'r4', title: 'Chemistry Made Easy', category: 'Chemistry', rating: 4.7, students: 670, price: 0, level: 'intermediate' },
]

const sampleQA: QAPost[] = [
  { id: 'q1', userName: 'Ahmed K.', avatar: null, question: 'How do I access the supplementary materials for Module 3?', date: '2025-12-20', replies: 3, resolved: true },
  { id: 'q2', userName: 'Sara A.', avatar: null, question: 'Is there a practice exam available before the final assessment?', date: '2025-12-18', replies: 5, resolved: false },
  { id: 'q3', userName: 'Usman M.', avatar: null, question: 'Can I download the video lectures for offline viewing?', date: '2025-12-15', replies: 2, resolved: true },
]

const sampleReviews: ReviewData[] = [
  { id: 'rv1', userName: 'Fatima Noor', avatar: null, rating: 5, date: '2025-12-15', content: 'Excellent course! The instructor explains everything clearly and the hands-on projects really helped solidify my understanding.', helpful: 24 },
  { id: 'rv2', userName: 'Hassan Raza', avatar: null, rating: 4, date: '2025-11-28', content: 'Great course overall. The video quality is excellent and the explanations are thorough. Would have liked a few more advanced exercises.', helpful: 18 },
  { id: 'rv3', userName: 'Ayesha Khan', avatar: null, rating: 5, date: '2025-11-10', content: 'This course exceeded my expectations. The step-by-step approach makes complex topics easy to understand.', helpful: 12 },
  { id: 'rv4', userName: 'Bilal Siddiqui', avatar: null, rating: 4, date: '2025-10-22', content: 'Very informative and well-paced. The quizzes after each section helped me check my understanding.', helpful: 9 },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

function parseJSONField<T>(field: string | null | undefined, fallback: T): T {
  if (!field) return fallback
  try {
    return JSON.parse(field) as T
  } catch {
    return fallback
  }
}

function getInitials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// ─── Circular Progress ──────────────────────────────────────────────────────

function CircularProgress({ percentage, size = 56, strokeWidth = 4 }: { percentage: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-white/20" />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-white transition-all duration-700"
        style={{ stroke: 'url(#progressGradientDetail)' }}
      />
      <defs>
        <linearGradient id="progressGradientDetail" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ─── Star Rating ────────────────────────────────────────────────────────────

function StarRating({ rating, size = 'sm', interactive = false, onChange }: { rating: number; size?: 'sm' | 'md'; interactive?: boolean; onChange?: (r: number) => void }) {
  const sizeClass = size === 'md' ? 'size-5' : 'size-4'
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = rating - i
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(i + 1)}
            className={cn(interactive && 'cursor-pointer hover:scale-110 transition-transform')}
          >
            <Star
              className={cn(
                sizeClass,
                fill >= 1
                  ? 'fill-amber-400 text-amber-400'
                  : fill > 0
                    ? 'fill-amber-400/50 text-amber-400'
                    : 'fill-muted-foreground/20 text-muted-foreground/20'
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function CourseDetailView() {
  const {
    selectedCourse,
    setCurrentView,
    currentUser,
    selectedLesson,
    setSelectedLesson,
    setSelectedQuiz,
    setEnrollments,
  } = useAppStore()

  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enrolling, setEnrolling] = useState(false)
  const [markingComplete, setMarkingComplete] = useState(false)
  const [showEnrollDialog, setShowEnrollDialog] = useState(false)
  const [expandedModules, setExpandedModules] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [viewingLesson, setViewingLesson] = useState<Lesson | null>(null)
  const [notesOpen, setNotesOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)

  const fetchCourseDetail = useCallback(async () => {
    if (!selectedCourse) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (currentUser) params.set('userId', currentUser.id)
      const res = await fetch(`/api/courses/${selectedCourse.id}?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch course')
      const data = await res.json()
      setCourseDetail(data)
      // Auto-expand first incomplete module, or first module
      if (data.course?.modules?.length) {
        const firstIncomplete = data.course.modules.find((m: Module) => {
          const lessons = m.lessons || []
          return lessons.some((l: Lesson) => !data.enrollment?.lessonProgress?.some((lp: LessonProgress) => lp.lessonId === l.id && lp.status === 'completed'))
        })
        setExpandedModules([firstIncomplete?.id || data.course.modules[0].id])
      }
    } catch {
      setError('Failed to load course details.')
    } finally {
      setLoading(false)
    }
  }, [selectedCourse, currentUser])

  useEffect(() => {
    fetchCourseDetail()
  }, [fetchCourseDetail])

  const handleEnroll = async () => {
    if (!currentUser || !selectedCourse) return
    setEnrolling(true)
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, courseId: selectedCourse.id }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to enroll')
      }
      const enrollRes = await fetch(`/api/enrollments?userId=${currentUser.id}`)
      if (enrollRes.ok) {
        const enrollData = await enrollRes.json()
        setEnrollments(enrollData.enrollments || [])
      }
      await fetchCourseDetail()
      setShowEnrollDialog(false)
    } catch (err) {
      console.error('Enrollment error:', err)
    } finally {
      setEnrolling(false)
    }
  }

  const handleMarkComplete = async (lesson: Lesson) => {
    if (!courseDetail?.enrollment) return
    setMarkingComplete(true)
    try {
      const res = await fetch('/api/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollmentId: courseDetail.enrollment.id,
          lessonId: lesson.id,
          status: 'completed',
          timeSpent: lesson.duration || 5,
        }),
      })
      if (!res.ok) throw new Error('Failed to update progress')
      await fetchCourseDetail()
    } catch {
      console.error('Progress update error')
    } finally {
      setMarkingComplete(false)
    }
  }

  const isLessonCompleted = useCallback((lessonId: string) => {
    return courseDetail?.enrollment?.lessonProgress?.some(
      (lp) => lp.lessonId === lessonId && lp.status === 'completed'
    ) || false
  }, [courseDetail?.enrollment?.lessonProgress])

  const isLessonStarted = useCallback((lessonId: string) => {
    return courseDetail?.enrollment?.lessonProgress?.some(
      (lp) => lp.lessonId === lessonId && lp.status === 'in_progress'
    ) || false
  }, [courseDetail?.enrollment?.lessonProgress])

  const handleTakeQuiz = (quizId: string) => {
    const quiz = courseDetail?.course.quizzes?.find((q) => q.id === quizId)
    if (quiz) {
      setSelectedQuiz(quiz as unknown as Quiz)
      setCurrentView('quiz')
    }
  }

  const handleSelectLesson = (lesson: Lesson) => {
    if (!courseDetail?.enrollment && !lesson.isFree) return
    setViewingLesson(lesson)
    setSelectedLesson(lesson)
  }

  const handleStartPlayer = () => {
    if (viewingLesson) {
      setSelectedLesson(viewingLesson)
      setCurrentView('course-player')
    } else {
      const firstIncomplete = courseDetail?.course.modules
        ?.flatMap((m) => m.lessons || [])
        .find((l) => !isLessonCompleted(l.id))
      if (firstIncomplete) {
        setSelectedLesson(firstIncomplete)
      }
      setCurrentView('course-player')
    }
  }

  const handleBack = () => {
    setSelectedLesson(null)
    setCurrentView('courses')
  }

  // ─── Computed Values ─────────────────────────────────────────────────────

  const course = courseDetail?.course
  const enrollment = courseDetail?.enrollment
  const isEnrolled = !!enrollment

  const totalLessons = useMemo(() =>
    course?.modules?.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0) || 0,
    [course?.modules]
  )

  const completedLessons = useMemo(() =>
    enrollment?.lessonProgress?.filter((lp) => lp.status === 'completed').length || 0,
    [enrollment?.lessonProgress]
  )

  const progressPercent = enrollment?.progress ?? 0

  const totalDuration = useMemo(() =>
    course?.modules?.reduce(
      (acc, mod) => acc + (mod.lessons?.reduce((la, l) => la + (l.duration || 0), 0) || 0), 0
    ) || 0,
    [course?.modules]
  )

  const xpEarned = useMemo(() =>
    enrollment?.lessonProgress?.reduce((acc, lp) => acc + (lp.xpEarned || 0), 0) || 0,
    [enrollment?.lessonProgress]
  )

  const gradient = course ? (categoryGradients[course.category] || 'from-emerald-500 to-teal-600') : ''

  const getModuleProgress = useCallback((mod: Module) => {
    const moduleLessons = mod.lessons || []
    if (moduleLessons.length === 0) return 0
    const completed = moduleLessons.filter((l) => isLessonCompleted(l.id)).length
    return Math.round((completed / moduleLessons.length) * 100)
  }, [isLessonCompleted])

  const learningObjectives = useMemo(() => {
    if (!course) return []
    const parsed = parseJSONField<string[] | null>(course.learningObjectives, null)
    if (parsed && parsed.length > 0) return parsed
    return course.description
      .split(/[.\n]/)
      .filter(s => s.trim().length > 10)
      .slice(0, 8)
      .map(s => s.trim())
  }, [course])

  const prerequisites = useMemo(() => {
    if (!course) return []
    const parsed = parseJSONField<string[] | null>(course.prerequisites, null)
    if (parsed && parsed.length > 0) return parsed
    return ['A device with internet access', 'Enthusiasm and dedication to learn']
  }, [course])

  const targetAudience = useMemo(() => {
    if (!course) return []
    const parsed = parseJSONField<string[] | null>(course.targetAudience, null)
    if (parsed && parsed.length > 0) return parsed
    return [
      `Students interested in ${course.category}`,
      `${course.level === 'beginner' ? 'Beginners' : course.level === 'intermediate' ? 'Intermediate learners' : 'Advanced practitioners'}`,
      'Anyone preparing for exams or certifications',
    ]
  }, [course])

  const tags = useMemo(() => {
    if (!course) return []
    const parsed = parseJSONField<string[] | null>(course.tags, null)
    if (parsed && parsed.length > 0) return parsed
    return [course.category, course.level]
  }, [course])

  // ─── Lesson navigation helpers ───────────────────────────────────────────

  const allLessons = useMemo(() =>
    course?.modules?.flatMap((m) => m.lessons || []) || [],
    [course?.modules]
  )

  const currentLessonIndex = useMemo(() =>
    viewingLesson ? allLessons.findIndex(l => l.id === viewingLesson.id) : -1,
    [viewingLesson, allLessons]
  )

  const prevLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null
  const nextLesson = currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null

  const tabs: { id: TabId; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <BookOpen className="size-4" /> },
    { id: 'curriculum', label: 'Curriculum', icon: <ListChecks className="size-4" />, count: totalLessons },
    { id: 'resources', label: 'Resources', icon: <Download className="size-4" /> },
    { id: 'qa', label: 'Q&A', icon: <MessageCircle className="size-4" /> },
    { id: 'reviews', label: 'Reviews', icon: <Star className="size-4" /> },
  ]

  // ─── Loading State ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !courseDetail || !course) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-card p-12 text-center"
      >
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <BookOpen className="size-8 text-destructive" />
        </div>
        <div className="space-y-1">
          <h3 className="text-[22px] font-bold">Course not found</h3>
          <p className="text-[13px] text-muted-foreground">{error || 'Unable to load course details.'}</p>
        </div>
        <Button variant="outline" className="rounded-2xl" onClick={handleBack}>
          Back to Courses
        </Button>
      </motion.div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={springTransition}
      className="space-y-6"
    >
      {/* ─── Breadcrumb ─────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Courses
        </button>
        <ChevronRight className="size-3" />
        <span className="text-foreground font-medium truncate max-w-[200px]">{course.title}</span>
      </nav>

      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          'relative rounded-3xl overflow-hidden shadow-lg',
          `bg-gradient-to-br ${gradient}`
        )}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl" />

        <div className="relative p-6 md:p-8">
          {/* Top row: back button + badges */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-white hover:bg-white/20 rounded-xl"
              onClick={handleBack}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Badge className="text-[11px] bg-white/20 text-white border-0 backdrop-blur-sm">
                {course.category}
              </Badge>
              <Badge className={cn('text-[11px] capitalize border-0', levelColors[course.level] || 'bg-gray-100 text-gray-700')}>
                {course.level}
              </Badge>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-[26px] md:text-[32px] font-bold text-white leading-tight mb-2">
            {course.title}
          </h1>

          {/* Instructor */}
          {course.instructor && (
            <p className="text-[15px] text-white/80 mb-4">
              by <span className="font-semibold text-white">{course.instructor.name}</span>
            </p>
          )}

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-4 mb-5">
            <div className="flex items-center gap-1.5 text-[14px] text-white/90">
              <Star className="size-4 fill-amber-300 text-amber-300" />
              <span className="font-semibold">{course.rating.toFixed(1)}</span>
              <span className="text-white/60">rating</span>
            </div>
            <div className="flex items-center gap-1.5 text-[14px] text-white/90">
              <Users className="size-4" />
              <span className="font-semibold">{course._count?.enrollments ?? course.enrollmentCount}</span>
              <span className="text-white/60">students</span>
            </div>
            <div className="flex items-center gap-1.5 text-[14px] text-white/90">
              <Clock className="size-4" />
              <span className="font-semibold">{formatMinutes(totalDuration)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[14px] text-white/90">
              <BookOpen className="size-4" />
              <span className="font-semibold">{totalLessons}</span>
              <span className="text-white/60">lessons</span>
            </div>
            <div className="flex items-center gap-1.5 text-[14px] text-white/90">
              <BarChart3 className="size-4" />
              <span className="font-semibold">{course.modules?.length || 0}</span>
              <span className="text-white/60">modules</span>
            </div>
          </div>

          {/* Description */}
          <p className={cn(
            'text-[15px] leading-relaxed text-white/85 mb-5',
            !descriptionExpanded && 'line-clamp-3'
          )}>
            {course.description}
          </p>
          {course.description.length > 200 && (
            <button
              onClick={() => setDescriptionExpanded(!descriptionExpanded)}
              className="text-[13px] text-white/70 hover:text-white transition-colors mb-4"
            >
              {descriptionExpanded ? 'Show less' : 'Read more'}
            </button>
          )}

          {/* ─── Progress Tracker (Enrolled) ────────────────────────────── */}
          {isEnrolled && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-white/10 backdrop-blur-sm p-4 mb-2"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <CircularProgress percentage={progressPercent} size={52} strokeWidth={4} />
                    <span className="absolute text-[13px] font-bold text-white">{progressPercent}%</span>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-white">
                      {completedLessons}/{totalLessons} lessons completed
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-[12px] text-amber-300">
                        <Zap className="size-3" />
                        {xpEarned} XP earned
                      </span>
                      {progressPercent === 100 && (
                        <span className="flex items-center gap-1 text-[12px] text-emerald-300">
                          <CheckCircle2 className="size-3" />
                          Complete!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  className="rounded-2xl bg-white text-emerald-700 hover:bg-emerald-50 h-11 text-[15px] font-semibold shadow-lg"
                  onClick={handleStartPlayer}
                >
                  <PlayCircle className="mr-2 size-5" />
                  {progressPercent > 0 ? 'Continue' : 'Start'}
                </Button>
              </div>
              <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full rounded-full bg-white"
                />
              </div>
            </motion.div>
          )}

          {/* ─── Enroll CTA (Not Enrolled) ──────────────────────────────── */}
          {!isEnrolled && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3"
            >
              <Button
                className="rounded-2xl bg-white text-emerald-700 hover:bg-emerald-50 h-12 text-[17px] font-semibold shadow-lg"
                onClick={() => setShowEnrollDialog(true)}
              >
                <GraduationCap className="mr-2 size-5" />
                Enroll Now — {course.price === 0 ? 'Free' : `$${course.price}`}
              </Button>
              <div className="flex items-center gap-1.5 text-[13px] text-white/70">
                <Sparkles className="size-3.5 text-amber-300" />
                +50 XP on enrollment
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ─── Main Content Grid ──────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Tabbed Content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Lesson Content Panel (when viewing a lesson) */}
          <AnimatePresence mode="wait">
            {viewingLesson ? (
              <motion.div
                key={viewingLesson.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={springTransition}
              >
                <LessonContentPanel
                  lesson={viewingLesson}
                  isCompleted={isLessonCompleted(viewingLesson.id)}
                  isStarted={isLessonStarted(viewingLesson.id)}
                  isEnrolled={isEnrolled}
                  markingComplete={markingComplete}
                  onMarkComplete={() => handleMarkComplete(viewingLesson)}
                  onOpenPlayer={handleStartPlayer}
                  onPrevious={prevLesson ? () => handleSelectLesson(prevLesson) : undefined}
                  onNext={nextLesson ? () => handleSelectLesson(nextLesson) : undefined}
                  hasPrev={!!prevLesson}
                  hasNext={!!nextLesson}
                  notesOpen={notesOpen}
                  onToggleNotes={() => setNotesOpen(!notesOpen)}
                  noteText={noteText}
                  onNoteTextChange={setNoteText}
                  onClose={() => setViewingLesson(null)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="tabs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Tab Navigation */}
                <div className="flex gap-1 border-b border-border overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'relative flex items-center gap-1.5 whitespace-nowrap px-4 py-3 text-[14px] font-medium transition-colors',
                        activeTab === tab.id
                          ? 'text-emerald-600'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {tab.icon}
                      {tab.label}
                      {tab.count !== undefined && (
                        <span className={cn(
                          'text-[11px]',
                          activeTab === tab.id ? 'text-emerald-500' : 'text-muted-foreground/60'
                        )}>
                          ({tab.count})
                        </span>
                      )}
                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="course-detail-tab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === 'overview' && (
                      <OverviewTab
                        course={course}
                        learningObjectives={learningObjectives}
                        prerequisites={prerequisites}
                        targetAudience={targetAudience}
                        tags={tags}
                      />
                    )}
                    {activeTab === 'curriculum' && (
                      <CurriculumTab
                        course={course}
                        enrollment={enrollment}
                        isEnrolled={isEnrolled}
                        expandedModules={expandedModules}
                        setExpandedModules={setExpandedModules}
                        isLessonCompleted={isLessonCompleted}
                        isLessonStarted={isLessonStarted}
                        getModuleProgress={getModuleProgress}
                        totalLessons={totalLessons}
                        totalDuration={totalDuration}
                        onSelectLesson={handleSelectLesson}
                        onStartPlayer={handleStartPlayer}
                      />
                    )}
                    {activeTab === 'resources' && (
                      <ResourcesTab course={course} isEnrolled={isEnrolled} />
                    )}
                    {activeTab === 'qa' && (
                      <QATab isEnrolled={isEnrolled} />
                    )}
                    {activeTab === 'reviews' && (
                      <ReviewsTab
                        reviews={sampleReviews}
                        isEnrolled={isEnrolled}
                        course={course}
                        onWriteReview={() => setReviewOpen(true)}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Right Column - Sticky Sidebar ──────────────────────────────── */}
        <div className="lg:col-span-1 space-y-4">
          {/* Course Content Navigator */}
          <div className="sticky top-20 rounded-2xl bg-card shadow-sm overflow-hidden">
            <div className="p-4 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="size-4 text-primary" />
                  <h3 className="text-[17px] font-semibold">Course Content</h3>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {totalLessons} lessons · {formatMinutes(totalDuration)}
                </span>
              </div>
            </div>
            <Separator />
            <ScrollArea className="max-h-[50vh]">
              <div className="p-2">
                {course.modules?.map((mod, modIndex) => {
                  const moduleLessons = mod.lessons || []
                  const moduleCompleted = moduleLessons.filter((l) => isLessonCompleted(l.id)).length
                  const moduleProgress = getModuleProgress(mod)
                  const isExpanded = expandedModules.includes(mod.id)

                  return (
                    <div key={mod.id} className="mb-1">
                      <button
                        onClick={() =>
                          setExpandedModules((prev) =>
                            isExpanded ? prev.filter((id) => id !== mod.id) : [...prev, mod.id]
                          )
                        }
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left hover:bg-muted/50 transition-colors"
                      >
                        <div className={cn(
                          'flex size-6 items-center justify-center rounded-full shrink-0',
                          moduleProgress === 100
                            ? 'bg-emerald-100'
                            : moduleProgress > 0
                            ? 'bg-amber-100'
                            : 'bg-muted'
                        )}>
                          {moduleProgress === 100 ? (
                            <CheckCircle2 className="size-3.5 text-emerald-600" />
                          ) : (
                            <span className="text-[10px] font-bold text-muted-foreground">{modIndex + 1}</span>
                          )}
                        </div>

                        <motion.div
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={springTransition}
                          className="shrink-0"
                        >
                          <ChevronRight className="size-4 text-muted-foreground" />
                        </motion.div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-medium">{mod.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[11px] text-muted-foreground">
                              {moduleCompleted}/{moduleLessons.length} lessons
                            </p>
                            {moduleProgress > 0 && (
                              <span className={cn(
                                'text-[10px] font-semibold',
                                moduleProgress === 100 ? 'text-emerald-600' : 'text-amber-600'
                              )}>
                                {moduleProgress}%
                              </span>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* Module progress bar */}
                      {moduleProgress > 0 && (
                        <div className="mx-3 mb-1 h-1 rounded-full bg-muted/50 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${moduleProgress}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className={cn(
                              'h-full rounded-full',
                              moduleProgress === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                            )}
                          />
                        </div>
                      )}

                      {/* Lesson items */}
                      <AnimatePresence>
                        {isExpanded && moduleLessons.map((lesson, lessonIndex) => {
                          const completed = isLessonCompleted(lesson.id)
                          const started = isLessonStarted(lesson.id)
                          const isViewing = viewingLesson?.id === lesson.id

                          return (
                            <motion.button
                              key={lesson.id}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ delay: lessonIndex * 0.02 }}
                              onClick={() => handleSelectLesson(lesson)}
                              disabled={!isEnrolled && !lesson.isFree}
                              className={cn(
                                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors ml-4',
                                isViewing
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : completed
                                  ? 'hover:bg-emerald-50/50'
                                  : 'hover:bg-muted/50',
                                (!isEnrolled && !lesson.isFree) && 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              {/* Status indicator */}
                              {completed ? (
                                <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                              ) : started ? (
                                <div className="size-4 rounded-full border-2 border-amber-400 shrink-0 flex items-center justify-center">
                                  <div className="size-1.5 rounded-full bg-amber-400" />
                                </div>
                              ) : (
                                <div className="size-4 rounded-full border border-muted-foreground/30 shrink-0" />
                              )}

                              {/* Lesson type icon */}
                              <span className="shrink-0">
                                {lessonTypeIcons[lesson.type] || lessonTypeIcons.text}
                              </span>

                              <div className="min-w-0 flex-1">
                                <p className={cn(
                                  'truncate text-[12px]',
                                  completed ? 'text-muted-foreground line-through' : 'font-medium'
                                )}>
                                  {lesson.title}
                                </p>
                              </div>

                              <span className="text-[10px] text-muted-foreground shrink-0">
                                {lesson.duration}m
                              </span>

                              {lesson.isFree && !isEnrolled && (
                                <Badge className="text-[8px] bg-emerald-50 text-emerald-600 border-0 px-1 py-0 shrink-0">
                                  FREE
                                </Badge>
                              )}
                            </motion.button>
                          )
                        })}
                      </AnimatePresence>
                    </div>
                  )
                })}

                {/* Quizzes in sidebar */}
                {course.quizzes && course.quizzes.length > 0 && isEnrolled && (
                  <>
                    <Separator className="my-2" />
                    <div className="px-3 py-2">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quizzes</p>
                      {course.quizzes.map((quiz) => (
                        <button
                          key={quiz.id}
                          onClick={() => handleTakeQuiz(quiz.id)}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-muted/50 transition-colors"
                        >
                          <Award className="size-4 text-violet-500 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12px] font-medium">{quiz.title}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {quiz.timeLimit} min · {quiz.passingScore}% to pass
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Quick Stats Card */}
          {isEnrolled && (
            <StudentStatCardGrid columns={2} size="sm">
              <StudentStatCard
                icon={Zap}
                value={xpEarned}
                label="XP Earned"
                color="amber"
                subLabel="Keep going!"
              />
              <StudentStatCard
                icon={CheckCircle2}
                value={completedLessons}
                label="Completed"
                color="emerald"
                subLabel={`of ${totalLessons}`}
              />
              <StudentStatCard
                icon={Clock}
                value={formatMinutes(totalDuration)}
                label="Duration"
                color="teal"
              />
              <StudentStatCard
                icon={BarChart3}
                value={`${progressPercent}%`}
                label="Progress"
                color="cyan"
                subLabel={progressPercent === 100 ? 'Complete!' : 'In progress'}
              />
            </StudentStatCardGrid>
          )}

          {/* Course Includes */}
          <div className="rounded-2xl bg-card shadow-sm p-4">
            <h4 className="text-[14px] font-semibold mb-3">This course includes</h4>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-[13px]">
                <Video className="size-4 text-rose-500" />
                <span className="text-muted-foreground">
                  {course.modules?.reduce((a, m) => a + (m.lessons?.filter(l => l.type === 'video').length || 0), 0) || 0} video lessons
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-[13px]">
                <FileText className="size-4 text-sky-500" />
                <span className="text-muted-foreground">
                  {course.modules?.reduce((a, m) => a + (m.lessons?.filter(l => l.type === 'text').length || 0), 0) || 0} text lessons
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-[13px]">
                <Award className="size-4 text-violet-500" />
                <span className="text-muted-foreground">
                  {course.quizzes?.length || 0} quizzes
                </span>
              </div>
              {course.certificateEnabled && (
                <div className="flex items-center gap-2.5 text-[13px]">
                  <Shield className="size-4 text-emerald-500" />
                  <span className="text-muted-foreground">Certificate of completion</span>
                </div>
              )}
              <div className="flex items-center gap-2.5 text-[13px]">
                <Infinity className="size-4 text-teal-500" />
                <span className="text-muted-foreground">Lifetime access</span>
              </div>
              <div className="flex items-center gap-2.5 text-[13px]">
                <Smartphone className="size-4 text-cyan-500" />
                <span className="text-muted-foreground">Mobile & desktop access</span>
              </div>
              <div className="flex items-center gap-2.5 text-[13px]">
                <Tv className="size-4 text-amber-500" />
                <span className="text-muted-foreground">Offline viewing</span>
              </div>
            </div>
          </div>

          {/* Instructor Mini Card */}
          {course.instructor && (
            <div className="rounded-2xl bg-card shadow-sm p-4">
              <h4 className="text-[14px] font-semibold mb-3 flex items-center gap-2">
                <GraduationCap className="size-4 text-primary" />
                Instructor
              </h4>
              <div className="flex items-center gap-3">
                <div className="shrink-0 flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold text-[14px]">
                  {course.instructor.avatar ? (
                    <img src={course.instructor.avatar} alt={course.instructor.name} className="size-10 rounded-xl object-cover" />
                  ) : (
                    getInitials(course.instructor.name)
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold truncate">{course.instructor.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      {course.rating.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Users className="size-3" />
                      {course._count?.enrollments ?? course.enrollmentCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ask ShijlAI Button */}
          {isEnrolled && (
            <Button
              variant="outline"
              className="w-full rounded-2xl h-12 text-[15px] font-semibold border-dashed border-primary/30 hover:bg-primary/5 hover:border-primary/50 transition-colors"
              onClick={() => setCurrentView('tutor')}
            >
              <Sparkles className="mr-2 size-5 text-primary" />
              Ask <ShijlAIText />
            </Button>
          )}

          {/* Related Courses */}
          <div className="rounded-2xl bg-card shadow-sm p-4">
            <h4 className="text-[14px] font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="size-4 text-amber-500" />
              Related Courses
            </h4>
            <div className="space-y-3">
              {relatedCourses.slice(0, 3).map((rc) => (
                <div
                  key={rc.id}
                  className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  <div className={cn(
                    'shrink-0 flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-white/80',
                    categoryGradients[rc.category] || 'from-emerald-500 to-teal-600'
                  )}>
                    <GraduationCap className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium truncate group-hover:text-primary transition-colors">{rc.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <Star className="size-2.5 fill-amber-400 text-amber-400" />
                        {rc.rating}
                      </span>
                      <Badge className={cn('text-[9px] capitalize border-0 px-1.5 py-0', levelColors[rc.level] || 'bg-gray-100 text-gray-700')}>
                        {rc.level}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 shrink-0">
                    {rc.price === 0 ? 'Free' : `$${rc.price}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Enroll Dialog ──────────────────────────────────────────────── */}
      <Dialog open={showEnrollDialog} onOpenChange={setShowEnrollDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="size-5 text-emerald-600" />
              Enroll in Course
            </DialogTitle>
            <DialogDescription>
              Start your learning journey with &ldquo;{course.title}&rdquo;
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium">Course Price</span>
                <span className="text-[22px] font-bold text-emerald-700">
                  {course.price === 0 ? 'Free' : `$${course.price}`}
                </span>
              </div>
              {course.certificateEnabled && (
                <p className="mt-2 text-[12px] text-emerald-600 flex items-center gap-1">
                  <Shield className="size-3" />
                  Includes certificate of completion
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Sparkles className="size-4 text-amber-500" />
              Earn +50 XP upon enrollment
            </div>
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Infinity className="size-4 text-teal-500" />
              Lifetime access included
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowEnrollDialog(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={handleEnroll}
              disabled={enrolling}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
            >
              {enrolling ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <GraduationCap className="mr-2 size-4" />
              )}
              {enrolling ? 'Enrolling...' : 'Confirm Enrollment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Review Dialog ──────────────────────────────────────────────── */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="size-5 text-amber-500" />
              Write a Review
            </DialogTitle>
            <DialogDescription>
              Share your experience with this course
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div>
              <label className="text-[14px] font-medium mb-2 block">Your Rating</label>
              <StarRating rating={reviewRating} size="md" interactive onChange={setReviewRating} />
            </div>
            <div>
              <label className="text-[14px] font-medium mb-2 block">Your Review</label>
              <Textarea
                placeholder="What did you like or dislike about this course?"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
                className="rounded-xl resize-none"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setReviewOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={() => setReviewOpen(false)}
              disabled={!reviewRating || !reviewText.trim()}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
            >
              <Send className="mr-2 size-4" />
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}

// ─── Lesson Content Panel ───────────────────────────────────────────────────

function LessonContentPanel({
  lesson,
  isCompleted,
  isStarted,
  isEnrolled,
  markingComplete,
  onMarkComplete,
  onOpenPlayer,
  onPrevious,
  onNext,
  hasPrev,
  hasNext,
  notesOpen,
  onToggleNotes,
  noteText,
  onNoteTextChange,
  onClose,
}: {
  lesson: Lesson
  isCompleted: boolean
  isStarted: boolean
  isEnrolled: boolean
  markingComplete: boolean
  onMarkComplete: () => void
  onOpenPlayer: () => void
  onPrevious?: () => void
  onNext?: () => void
  hasPrev: boolean
  hasNext: boolean
  notesOpen: boolean
  onToggleNotes: () => void
  noteText: string
  onNoteTextChange: (text: string) => void
  onClose: () => void
}) {
  return (
    <div className="rounded-2xl bg-card shadow-sm overflow-hidden">
      {/* Lesson Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="size-8 rounded-lg" onClick={onClose}>
              <X className="size-4" />
            </Button>
            <Badge className={cn('text-[11px] capitalize', lessonTypeBg[lesson.type] || 'bg-gray-50', 'border-0')}>
              {lesson.type}
            </Badge>
            {isCompleted && (
              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[11px]">
                <CheckCircle2 className="mr-1 size-3" />
                Completed
              </Badge>
            )}
            {isStarted && !isCompleted && (
              <Badge className="bg-amber-100 text-amber-700 border-0 text-[11px]">
                In Progress
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-8 rounded-lg" onClick={onToggleNotes}>
              <StickyNote className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" className="size-8 rounded-lg" onClick={onOpenPlayer}>
              <Maximize2 className="size-4" />
            </Button>
          </div>
        </div>

        <h2 className="text-[22px] font-bold mb-1">{lesson.title}</h2>
        {lesson.description && (
          <p className="text-[13px] text-muted-foreground">{lesson.description}</p>
        )}

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-2">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {lesson.duration} min
          </span>
          {lesson.objectives && (
            <span className="flex items-center gap-1">
              <Target className="size-3" />
              Has objectives
            </span>
          )}
        </div>
      </div>

      <Separator />

      {/* Lesson Objectives */}
      {lesson.objectives && (
        <div className="px-6 py-3 bg-emerald-50/50">
          <p className="text-[12px] font-semibold text-emerald-700 mb-1 flex items-center gap-1">
            <Target className="size-3" />
            Lesson Objectives
          </p>
          <div className="prose prose-sm max-w-none text-[12px] text-emerald-800/80">
            <ReactMarkdown>{lesson.objectives}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Video Placeholder */}
      {lesson.type === 'video' && (
        <div className="mx-6 mt-4 flex aspect-video items-center justify-center rounded-2xl bg-gradient-to-br from-muted to-muted/60 cursor-pointer" onClick={onOpenPlayer}>
          <div className="text-center">
            <Video className="mx-auto size-12 text-muted-foreground/50" />
            <p className="mt-2 text-[14px] font-medium text-muted-foreground">Click to open video player</p>
            {lesson.videoUrl && (
              <p className="mt-1 text-[11px] text-muted-foreground/70">{lesson.videoUrl}</p>
            )}
          </div>
        </div>
      )}

      {/* Markdown Content */}
      <div className="p-6">
        <div className="prose prose-sm max-w-none text-[15px]">
          <ReactMarkdown>{lesson.content}</ReactMarkdown>
        </div>
      </div>

      {/* Notes Panel */}
      <AnimatePresence>
        {notesOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-4">
              <div className="rounded-xl bg-amber-50 p-4">
                <p className="text-[13px] font-semibold text-amber-800 mb-2 flex items-center gap-1">
                  <StickyNote className="size-4" />
                  Your Notes
                </p>
                <Textarea
                  placeholder="Write your notes for this lesson..."
                  value={noteText}
                  onChange={(e) => onNoteTextChange(e.target.value)}
                  rows={4}
                  className="rounded-xl resize-none bg-white border-amber-200 focus:border-amber-400"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Separator />

      {/* Action buttons */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isEnrolled && !isCompleted && (
            <Button
              onClick={onMarkComplete}
              disabled={markingComplete}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {markingComplete ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 size-4" />
              )}
              Mark as Complete
            </Button>
          )}
          {isCompleted && (
            <Badge className="bg-emerald-100 text-emerald-700 border-0 rounded-xl px-3 py-1 text-[13px]">
              <CheckCircle2 className="mr-1.5 size-4" />
              Completed
            </Badge>
          )}
          <Button variant="outline" className="rounded-xl" onClick={onOpenPlayer}>
            <PlayCircle className="mr-2 size-4" />
            Open in Player
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <Button
          variant="ghost"
          className="rounded-xl"
          disabled={!hasPrev}
          onClick={onPrevious}
        >
          <ChevronLeft className="mr-1 size-4" />
          Previous
        </Button>
        <Button
          variant="ghost"
          className="rounded-xl"
          disabled={!hasNext}
          onClick={onNext}
        >
          Next
          <ChevronRight className="ml-1 size-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Overview Tab ───────────────────────────────────────────────────────────

function OverviewTab({
  course,
  learningObjectives,
  prerequisites,
  targetAudience,
  tags,
}: {
  course: CourseDetail['course']
  learningObjectives: string[]
  prerequisites: string[]
  targetAudience: string[]
  tags: string[]
}) {
  return (
    <div className="space-y-6">
      {/* What You'll Learn */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/50 p-6">
        <h2 className="text-[18px] font-bold flex items-center gap-2 text-emerald-800">
          <Award className="size-5 text-emerald-600" />
          What You&apos;ll Learn
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {learningObjectives.map((point, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle2 className="size-5 text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-[14px] text-emerald-900/80 leading-relaxed">{point}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Learning Objectives (Markdown) */}
      {course.learningObjectives && (
        <div className="rounded-2xl bg-card shadow-sm p-6">
          <h3 className="text-[16px] font-semibold flex items-center gap-2 mb-3">
            <Target className="size-5 text-primary" />
            Learning Objectives
          </h3>
          <div className="prose prose-sm max-w-none text-[14px] text-muted-foreground">
            <ReactMarkdown>{course.learningObjectives}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Prerequisites */}
      <div className="rounded-2xl bg-card shadow-sm p-6">
        <h3 className="text-[16px] font-semibold flex items-center gap-2 mb-3">
          <BookOpen className="size-5 text-muted-foreground" />
          Prerequisites
        </h3>
        {course.prerequisites ? (
          <div className="prose prose-sm max-w-none text-[14px] text-muted-foreground">
            <ReactMarkdown>{course.prerequisites}</ReactMarkdown>
          </div>
        ) : (
          <ul className="space-y-2">
            {prerequisites.map((prereq, i) => (
              <li key={i} className="flex items-center gap-2 text-[14px] text-muted-foreground">
                <div className="size-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                {prereq}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Target Audience */}
      <div className="rounded-2xl bg-card shadow-sm p-6">
        <h3 className="text-[16px] font-semibold flex items-center gap-2 mb-3">
          <Users className="size-5 text-primary" />
          Target Audience
        </h3>
        <ul className="space-y-2">
          {targetAudience.map((audience, i) => (
            <li key={i} className="flex items-center gap-2 text-[14px] text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
              {audience}
            </li>
          ))}
        </ul>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="rounded-2xl bg-card shadow-sm p-6">
          <h3 className="text-[16px] font-semibold flex items-center gap-2 mb-3">
            <Tag className="size-5 text-muted-foreground" />
            Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="rounded-lg text-[12px]">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Instructor Card */}
      {course.instructor && (
        <div className="rounded-2xl bg-card shadow-sm p-6">
          <h3 className="text-[16px] font-semibold mb-4 flex items-center gap-2">
            <GraduationCap className="size-5 text-primary" />
            Your Instructor
          </h3>
          <div className="flex items-start gap-4">
            <div className="shrink-0 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold text-[18px] shadow-lg">
              {course.instructor.avatar ? (
                <img src={course.instructor.avatar} alt={course.instructor.name} className="size-14 rounded-2xl object-cover" />
              ) : (
                getInitials(course.instructor.name)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-[16px] font-semibold">{course.instructor.name}</h4>
              {course.instructor.bio && (
                <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed line-clamp-3">{course.instructor.bio}</p>
              )}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <BookOpen className="size-3.5 text-emerald-500" />
                  <span>Course Creator</span>
                </div>
                <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  <span>{course.rating.toFixed(1)} avg rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Curriculum Tab ─────────────────────────────────────────────────────────

function CurriculumTab({
  course,
  enrollment,
  isEnrolled,
  expandedModules,
  setExpandedModules,
  isLessonCompleted,
  isLessonStarted,
  getModuleProgress,
  totalLessons,
  totalDuration,
  onSelectLesson,
  onStartPlayer,
}: {
  course: CourseDetail['course']
  enrollment: CourseDetail['enrollment']
  isEnrolled: boolean
  expandedModules: string[]
  setExpandedModules: (fn: (prev: string[]) => string[]) => void
  isLessonCompleted: (id: string) => boolean
  isLessonStarted: (id: string) => boolean
  getModuleProgress: (mod: Module) => number
  totalLessons: number
  totalDuration: number
  onSelectLesson: (lesson: Lesson) => void
  onStartPlayer: () => void
}) {
  const videoCount = course.modules?.reduce((a, m) => a + (m.lessons?.filter(l => l.type === 'video').length || 0), 0) || 0
  const textCount = course.modules?.reduce((a, m) => a + (m.lessons?.filter(l => l.type === 'text').length || 0), 0) || 0
  const quizCount = course.modules?.reduce((a, m) => a + (m.lessons?.filter(l => l.type === 'quiz').length || 0), 0) || 0

  return (
    <div className="space-y-6">
      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-card shadow-sm p-3 text-center">
          <p className="text-[18px] font-bold">{course.modules?.length || 0}</p>
          <p className="text-[11px] text-muted-foreground">Modules</p>
        </div>
        <div className="rounded-xl bg-card shadow-sm p-3 text-center">
          <p className="text-[18px] font-bold">{totalLessons}</p>
          <p className="text-[11px] text-muted-foreground">Lessons</p>
        </div>
        <div className="rounded-xl bg-card shadow-sm p-3 text-center">
          <p className="text-[18px] font-bold">{formatMinutes(totalDuration)}</p>
          <p className="text-[11px] text-muted-foreground">Duration</p>
        </div>
        <div className="rounded-xl bg-card shadow-sm p-3 text-center">
          <p className="text-[18px] font-bold">{videoCount + textCount + quizCount}</p>
          <p className="text-[11px] text-muted-foreground">Activities</p>
        </div>
      </div>

      {/* Expand/Collapse All */}
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-semibold">Course Curriculum</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-[12px] h-8 rounded-lg"
            onClick={() => setExpandedModules(() => course.modules?.map(m => m.id) || [])}
          >
            <ChevronDown className="mr-1 size-3" />
            Expand All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[12px] h-8 rounded-lg"
            onClick={() => setExpandedModules(() => [])}
          >
            <ChevronRight className="mr-1 size-3" />
            Collapse All
          </Button>
        </div>
      </div>

      {/* Module Accordion */}
      <div className="space-y-3">
        {course.modules?.map((mod, modIndex) => {
          const moduleLessons = mod.lessons || []
          const moduleCompleted = moduleLessons.filter((l) => isLessonCompleted(l.id)).length
          const moduleProgress = getModuleProgress(mod)
          const isExpanded = expandedModules.includes(mod.id)

          // Find first incomplete lesson in module
          const firstIncomplete = moduleLessons.find(l => !isLessonCompleted(l.id))

          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: modIndex * 0.05 }}
              className="rounded-2xl bg-card shadow-sm overflow-hidden"
            >
              {/* Module Header */}
              <button
                onClick={() =>
                  setExpandedModules((prev) =>
                    isExpanded ? prev.filter((id) => id !== mod.id) : [...prev, mod.id]
                  )
                }
                className="flex w-full items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
              >
                <div className={cn(
                  'flex size-8 items-center justify-center rounded-full shrink-0',
                  moduleProgress === 100
                    ? 'bg-emerald-100'
                    : moduleProgress > 0
                    ? 'bg-amber-100'
                    : 'bg-muted'
                )}>
                  {moduleProgress === 100 ? (
                    <CheckCircle2 className="size-4 text-emerald-600" />
                  ) : (
                    <span className="text-[12px] font-bold text-muted-foreground">{modIndex + 1}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-semibold truncate">{mod.title}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[12px] text-muted-foreground">
                      {moduleCompleted}/{moduleLessons.length} lessons
                    </p>
                    {mod.description && (
                      <p className="text-[12px] text-muted-foreground truncate">· {mod.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {moduleProgress > 0 && (
                    <span className={cn(
                      'text-[12px] font-semibold',
                      moduleProgress === 100 ? 'text-emerald-600' : 'text-amber-600'
                    )}>
                      {moduleProgress}%
                    </span>
                  )}
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={springTransition}
                  >
                    <ChevronDown className="size-5 text-muted-foreground" />
                  </motion.div>
                </div>
              </button>

              {/* Module Progress Bar */}
              {moduleProgress > 0 && (
                <div className="mx-4 mb-2 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${moduleProgress}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={cn(
                      'h-full rounded-full',
                      moduleProgress === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                    )}
                  />
                </div>
              )}

              {/* Lesson Items */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {moduleLessons.map((lesson, lessonIndex) => {
                      const completed = isLessonCompleted(lesson.id)
                      const started = isLessonStarted(lesson.id)
                      const locked = !isEnrolled && !lesson.isFree

                      return (
                        <motion.div
                          key={lesson.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: lessonIndex * 0.03 }}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors border-t border-border/40',
                            locked && 'opacity-50',
                            completed && 'bg-emerald-50/30'
                          )}
                        >
                          {/* Status */}
                          {completed ? (
                            <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                          ) : started ? (
                            <div className="size-5 rounded-full border-2 border-amber-400 shrink-0 flex items-center justify-center">
                              <div className="size-2 rounded-full bg-amber-400" />
                            </div>
                          ) : locked ? (
                            <Lock className="size-5 text-muted-foreground/50 shrink-0" />
                          ) : (
                            <div className="size-5 rounded-full border border-muted-foreground/30 shrink-0 flex items-center justify-center">
                              <span className="text-[9px] text-muted-foreground">{lessonIndex + 1}</span>
                            </div>
                          )}

                          {/* Lesson Type Icon */}
                          <span className={cn('shrink-0 p-1.5 rounded-lg', lessonTypeBg[lesson.type] || 'bg-gray-50')}>
                            {lessonTypeIcons[lesson.type] || lessonTypeIcons.text}
                          </span>

                          {/* Title & Duration */}
                          <div className="min-w-0 flex-1">
                            <p className={cn(
                              'text-[13px] truncate',
                              completed ? 'text-muted-foreground' : 'font-medium'
                            )}>
                              {lesson.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {lesson.duration} min
                              {lesson.isFree && !isEnrolled && ' · Free preview'}
                            </p>
                          </div>

                          {/* Action */}
                          {!locked && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="shrink-0 rounded-lg h-8 text-[12px]"
                              onClick={() => onSelectLesson(lesson)}
                            >
                              {completed ? (
                                <Eye className="size-4 mr-1" />
                              ) : (
                                <PlayCircle className="size-4 mr-1" />
                              )}
                              {completed ? 'Review' : started ? 'Continue' : 'Start'}
                            </Button>
                          )}
                        </motion.div>
                      )
                    })}

                    {/* Start Module Button */}
                    {firstIncomplete && isEnrolled && (
                      <div className="px-4 py-3 border-t border-border/40">
                        <Button
                          className="rounded-xl w-full"
                          onClick={() => {
                            onSelectLesson(firstIncomplete)
                          }}
                        >
                          <PlayCircle className="mr-2 size-4" />
                          {moduleProgress === 0 ? 'Start Module' : 'Continue Module'}
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Quizzes Section */}
      {course.quizzes && course.quizzes.length > 0 && (
        <div className="rounded-2xl bg-card shadow-sm p-6">
          <h3 className="text-[16px] font-semibold mb-4 flex items-center gap-2">
            <Award className="size-5 text-violet-500" />
            Course Quizzes
          </h3>
          <div className="space-y-3">
            {course.quizzes.map((quiz) => (
              <div key={quiz.id} className="flex items-center justify-between rounded-xl border border-border/50 p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-violet-50">
                    <Award className="size-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium">{quiz.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Timer className="size-3" />
                        {quiz.timeLimit} min
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {quiz.passingScore}% to pass
                      </span>
                    </div>
                  </div>
                </div>
                {isEnrolled ? (
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      // Navigate to quiz
                      const quizStore = useAppStore.getState()
                      quizStore.setSelectedQuiz(quiz as unknown as Quiz)
                      quizStore.setCurrentView('quiz')
                    }}
                  >
                    Take Quiz
                    <ArrowRight className="ml-1 size-4" />
                  </Button>
                ) : (
                  <Badge variant="secondary" className="text-[11px]">
                    <Lock className="mr-1 size-3" />
                    Enroll to access
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Resources Tab ──────────────────────────────────────────────────────────

function ResourcesTab({ course, isEnrolled }: { course: CourseDetail['course']; isEnrolled: boolean }) {
  // Collect all resources from lessons
  const allResources = course.modules?.flatMap((mod) =>
    (mod.lessons || []).flatMap((lesson) => {
      const resources: Array<{ lessonId: string; lessonTitle: string; moduleId: string; moduleTitle: string; type: string; url: string; title: string }> = []
      if (lesson.resources) {
        try {
          const parsed = JSON.parse(lesson.resources)
          if (Array.isArray(parsed)) {
            parsed.forEach((r: { title?: string; url?: string; type?: string }, i: number) => {
              resources.push({
                lessonId: lesson.id,
                lessonTitle: lesson.title,
                moduleId: mod.id,
                moduleTitle: mod.title,
                type: r.type || 'link',
                url: r.url || '#',
                title: r.title || `Resource ${i + 1}`,
              })
            })
          }
        } catch {
          // Not JSON, treat as text description
          if (lesson.resources.trim()) {
            resources.push({
              lessonId: lesson.id,
              lessonTitle: lesson.title,
              moduleId: mod.id,
              moduleTitle: mod.title,
              type: 'text',
              url: '#',
              title: lesson.resources.slice(0, 100),
            })
          }
        }
      }
      if (lesson.videoUrl) {
        resources.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          moduleId: mod.id,
          moduleTitle: mod.title,
          type: 'video',
          url: lesson.videoUrl,
          title: `${lesson.title} - Video`,
        })
      }
      if (lesson.transcript) {
        resources.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          moduleId: mod.id,
          moduleTitle: mod.title,
          type: 'transcript',
          url: '#',
          title: `${lesson.title} - Transcript`,
        })
      }
      return resources
    })
  ) || []

  const downloadableResources = allResources.filter(r => r.type === 'download' || r.type === 'pdf' || r.type === 'document')
  const videoResources = allResources.filter(r => r.type === 'video')
  const transcriptResources = allResources.filter(r => r.type === 'transcript')
  const externalResources = allResources.filter(r => r.type === 'link' || r.type === 'external')

  return (
    <div className="space-y-6">
      {!isEnrolled && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
          <p className="text-[14px] text-amber-800 flex items-center gap-2">
            <Lock className="size-4" />
            Enroll in this course to access all resources
          </p>
        </div>
      )}

      {allResources.length === 0 ? (
        <div className="rounded-2xl bg-card shadow-sm p-12 text-center">
          <Download className="mx-auto size-10 text-muted-foreground/30" />
          <h3 className="mt-3 text-[16px] font-semibold">No Resources Yet</h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Resources will be available as you progress through the course.
          </p>
        </div>
      ) : (
        <>
          {/* Downloadable Resources */}
          {downloadableResources.length > 0 && (
            <div className="rounded-2xl bg-card shadow-sm p-6">
              <h3 className="text-[16px] font-semibold mb-4 flex items-center gap-2">
                <Download className="size-5 text-emerald-500" />
                Downloadable Resources
              </h3>
              <div className="space-y-2">
                {downloadableResources.map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-border/50 p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50">
                        <Download className="size-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium">{r.title}</p>
                        <p className="text-[11px] text-muted-foreground">{r.lessonTitle}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="rounded-lg h-8" disabled={!isEnrolled}>
                      <Download className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video Resources */}
          {videoResources.length > 0 && (
            <div className="rounded-2xl bg-card shadow-sm p-6">
              <h3 className="text-[16px] font-semibold mb-4 flex items-center gap-2">
                <Video className="size-5 text-rose-500" />
                Video Content
              </h3>
              <div className="space-y-2">
                {videoResources.map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-border/50 p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-rose-50">
                        <Video className="size-4 text-rose-500" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium">{r.title}</p>
                        <p className="text-[11px] text-muted-foreground">{r.moduleTitle}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="rounded-lg h-8" disabled={!isEnrolled}>
                      <PlayCircle className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transcripts */}
          {transcriptResources.length > 0 && (
            <div className="rounded-2xl bg-card shadow-sm p-6">
              <h3 className="text-[16px] font-semibold mb-4 flex items-center gap-2">
                <FileText className="size-5 text-sky-500" />
                Transcripts
              </h3>
              <div className="space-y-2">
                {transcriptResources.map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-border/50 p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-sky-50">
                        <FileText className="size-4 text-sky-500" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium">{r.title}</p>
                        <p className="text-[11px] text-muted-foreground">{r.lessonTitle}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="rounded-lg h-8" disabled={!isEnrolled}>
                      <Eye className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* External Links */}
          {externalResources.length > 0 && (
            <div className="rounded-2xl bg-card shadow-sm p-6">
              <h3 className="text-[16px] font-semibold mb-4 flex items-center gap-2">
                <ExternalLink className="size-5 text-teal-500" />
                Additional Reading
              </h3>
              <div className="space-y-2">
                {externalResources.map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-border/50 p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-teal-50">
                        <ExternalLink className="size-4 text-teal-500" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium">{r.title}</p>
                        <p className="text-[11px] text-muted-foreground">{r.lessonTitle}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="rounded-lg h-8" disabled={!isEnrolled}>
                      <ExternalLink className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Q&A Tab ────────────────────────────────────────────────────────────────

function QATab({ isEnrolled }: { isEnrolled: boolean }) {
  const [questionText, setQuestionText] = useState('')

  return (
    <div className="space-y-6">
      {/* Ask a Question */}
      {isEnrolled && (
        <div className="rounded-2xl bg-card shadow-sm p-6">
          <h3 className="text-[16px] font-semibold mb-3 flex items-center gap-2">
            <MessageCircle className="size-5 text-primary" />
            Ask a Question
          </h3>
          <div className="flex gap-3">
            <Input
              placeholder="Type your question here..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="rounded-xl"
            />
            <Button className="rounded-xl shrink-0" disabled={!questionText.trim()}>
              <Send className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {!isEnrolled && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
          <p className="text-[14px] text-amber-800 flex items-center gap-2">
            <Lock className="size-4" />
            Enroll in this course to participate in Q&A
          </p>
        </div>
      )}

      {/* Questions List */}
      {sampleQA.length > 0 ? (
        <div className="space-y-3">
          {sampleQA.map((qa) => (
            <div key={qa.id} className="rounded-2xl bg-card shadow-sm p-4 hover:bg-muted/20 transition-colors cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-muted shrink-0 text-[12px] font-bold">
                  {qa.userName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium leading-snug">{qa.question}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[11px] text-muted-foreground">{qa.userName}</span>
                    <span className="text-[11px] text-muted-foreground">{qa.date}</span>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MessageSquare className="size-3" />
                      {qa.replies} replies
                    </span>
                    {qa.resolved && (
                      <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] px-1.5 py-0">
                        <CheckCircle2 className="mr-0.5 size-3" />
                        Resolved
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-card shadow-sm p-12 text-center">
          <MessageCircle className="mx-auto size-10 text-muted-foreground/30" />
          <h3 className="mt-3 text-[16px] font-semibold">No Questions Yet</h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Be the first to ask a question about this course.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Reviews Tab ────────────────────────────────────────────────────────────

function ReviewsTab({
  reviews,
  isEnrolled,
  course,
  onWriteReview,
}: {
  reviews: ReviewData[]
  isEnrolled: boolean
  course: CourseDetail['course']
  onWriteReview: () => void
}) {
  // Rating distribution
  const distribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percent: reviews.length > 0 ? Math.round((reviews.filter(r => r.rating === star).length / reviews.length) * 100) : 0,
  }))

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0'

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="rounded-2xl bg-card shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Average */}
          <div className="text-center sm:text-left shrink-0">
            <p className="text-[48px] font-bold leading-none">{avgRating}</p>
            <StarRating rating={parseFloat(avgRating)} size="md" />
            <p className="mt-1 text-[13px] text-muted-foreground">{reviews.length} reviews</p>
          </div>

          {/* Distribution */}
          <div className="flex-1 space-y-1.5">
            {distribution.map(({ star, count, percent }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-[12px] text-muted-foreground w-4 shrink-0">{star}</span>
                <Star className="size-3 fill-amber-400 text-amber-400 shrink-0" />
                <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground w-8 shrink-0 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Write a Review */}
        {isEnrolled && (
          <div className="mt-4 pt-4 border-t border-border/40">
            <Button
              variant="outline"
              className="rounded-xl w-full"
              onClick={onWriteReview}
            >
              <Star className="mr-2 size-4" />
              Write a Review
            </Button>
          </div>
        )}
      </div>

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl bg-card shadow-sm p-5">
              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-[12px] font-bold shrink-0">
                  {getInitials(review.userName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-semibold">{review.userName}</p>
                      <StarRating rating={review.rating} size="sm" />
                    </div>
                    <span className="text-[11px] text-muted-foreground">{review.date}</span>
                  </div>
                  <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">{review.content}</p>
                  <button className="mt-2 flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors">
                    <ThumbsUp className="size-3" />
                    Helpful ({review.helpful})
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-card shadow-sm p-12 text-center">
          <Star className="mx-auto size-10 text-muted-foreground/30" />
          <h3 className="mt-3 text-[16px] font-semibold">No Reviews Yet</h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Be the first to review this course.
          </p>
        </div>
      )}
    </div>
  )
}
