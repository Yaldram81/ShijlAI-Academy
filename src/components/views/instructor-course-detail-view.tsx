'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, BookOpen, Users, Star, Clock, DollarSign, TrendingUp,
  CheckCircle2, AlertCircle, Loader2, ChevronRight, Edit3,
  BarChart3, FileText, Calendar, Award, Play, Archive,
  Copy, Trash2, ExternalLink, Eye, MessageSquare,
  Settings, Search, ChevronDown, Video, Type, MousePointer,
  HelpCircle, ArchiveRestore, Send, Globe, GraduationCap,
  ShieldCheck, Sparkles, UserPlus, Activity, RefreshCw,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

// ============================================================
// Types
// ============================================================
interface LessonData {
  id: string
  title: string
  type: string
  duration: number
  order: number
  isPublished: boolean
  isFree: boolean
}

interface ModuleData {
  id: string
  title: string
  description: string | null
  order: number
  lessons: LessonData[]
  lessonCount: number
  totalDuration: number
}

interface EnrollmentData {
  id: string
  userId: string
  name: string
  avatar: string | null
  progress: number
  status: string
  enrolledAt: string
}

interface ReviewData {
  id: string
  userId: string
  name: string
  avatar: string | null
  rating: number
  content: string | null
  createdAt: string
}

interface CourseAnalytics {
  totalEnrollments: number
  recentEnrollments: number
  avgProgress: number
  completionRate: number
  totalLessons: number
  totalDuration: number
  totalRevenue: number
  enrollmentTrend: Array<{ date: string; count: number }>
  ratingBreakdown: Array<{ star: number; count: number }>
}

interface CourseData {
  id: string
  title: string
  description: string
  category: string
  level: string
  language: string
  thumbnail: string | null
  price: number
  isPublished: boolean
  isArchived: boolean
  enrollmentCount: number
  rating: number
  reviewStatus: string
  reviewNote: string | null
  certificateEnabled: boolean
  completionThreshold: number
  estimatedDuration: number
  learningObjectives: string | null
  prerequisites: string | null
  targetAudience: string | null
  tags: string | null
  createdAt: string
  updatedAt: string
  submittedForReviewAt: string | null
  reviewedAt: string | null
}

interface CourseDetailResponse {
  course: CourseData
  modules: ModuleData[]
  recentEnrollments: EnrollmentData[]
  analytics: CourseAnalytics
  quizzes: Array<{ id: string; title: string; type: string; passingScore: number; isPublished: boolean }>
  recentReviews: ReviewData[]
}

// ============================================================
// Helpers
// ============================================================
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
  return formatDate(dateStr)
}

function getLevelColor(level: string) {
  switch (level) {
    case 'beginner': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
    case 'intermediate': return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
    case 'advanced': return 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
    default: return 'bg-muted text-muted-foreground'
  }
}

function getLessonTypeIcon(type: string) {
  switch (type) {
    case 'video': return Video
    case 'text': return Type
    case 'interactive': return MousePointer
    case 'quiz': return HelpCircle
    case 'assignment': return FileText
    default: return FileText
  }
}

function getStatusConfig(course: CourseData) {
  if (course.isArchived) return { label: 'Archived', color: 'bg-slate-100 text-slate-700 dark:bg-slate-950/40 dark:text-slate-400', icon: Archive }
  if (course.reviewStatus === 'pending') return { label: 'Pending Review', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400', icon: Clock }
  if (course.reviewStatus === 'under_review') return { label: 'Under Review', color: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400', icon: Eye }
  if (course.reviewStatus === 'changes_requested') return { label: 'Changes Requested', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400', icon: AlertCircle }
  if (course.reviewStatus === 'rejected') return { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400', icon: AlertCircle }
  if (!course.isPublished) return { label: 'Draft', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400', icon: Edit3 }
  return { label: 'Published', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400', icon: CheckCircle2 }
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            size <= 12 ? 'size-3' : size <= 14 ? 'size-3.5' : 'size-4',
            i < Math.floor(rating)
              ? 'text-amber-500 fill-amber-500'
              : i < rating
                ? 'text-amber-500 fill-amber-500/50'
                : 'text-muted-foreground/30'
          )}
        />
      ))}
    </div>
  )
}

const categoryGradients: Record<string, string> = {
  IB: 'from-emerald-500 to-teal-600',
  'O-Levels': 'from-emerald-400 to-teal-500',
  'A-Levels': 'from-teal-400 to-emerald-500',
  IELTS: 'from-emerald-600 to-teal-700',
  AWS: 'from-teal-600 to-emerald-700',
  Technology: 'from-blue-500 to-indigo-600',
  Programming: 'from-teal-500 to-emerald-600',
  'Web Dev': 'from-emerald-500 to-green-600',
  'Data Science': 'from-teal-500 to-cyan-600',
  Business: 'from-amber-500 to-orange-600',
  Science: 'from-purple-500 to-violet-600',
  Mathematics: 'from-rose-500 to-pink-600',
  Languages: 'from-sky-500 to-blue-600',
  'Arts & Design': 'from-fuchsia-500 to-purple-600',
  Health: 'from-red-500 to-rose-600',
  'Social Sciences': 'from-orange-500 to-amber-600',
  Engineering: 'from-slate-500 to-gray-600',
  Other: 'from-emerald-500 to-teal-600',
}

// ============================================================
// Main Component
// ============================================================
export function InstructorCourseDetailView() {
  const { currentUser, setCurrentView, selectedCourseId, setEditingCourseId, setCreatorStep } = useAppStore()
  const [data, setData] = useState<CourseDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [activeTab, setActiveTab] = useState('curriculum')
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [studentSearch, setStudentSearch] = useState('')
  const [sourceView, setSourceView] = useState<string>('instructor-courses')

  // Track where user came from
  useEffect(() => {
    const currentView = useAppStore.getState().currentView
    if (currentView === 'instructor-dashboard') {
      setSourceView('instructor-dashboard')
    } else if (currentView === 'instructor-courses') {
      setSourceView('instructor-courses')
    }
  }, [])

  const fetchCourse = useCallback(async () => {
    if (!selectedCourseId || !currentUser?.id) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/instructor/courses/${selectedCourseId}?instructorId=${currentUser.id}`)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to fetch course')
      }
      const result = await res.json()
      setData(result)
      // Auto-expand all modules on load
      if (result.modules) {
        setExpandedModules(new Set(result.modules.map((m: ModuleData) => m.id)))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course')
    } finally {
      setLoading(false)
    }
  }, [selectedCourseId, currentUser?.id])

  useEffect(() => { fetchCourse() }, [fetchCourse])

  const handleEdit = () => {
    if (!data) return
    setEditingCourseId(data.course.id)
    setCreatorStep(2)
    setCurrentView('course-creator')
  }

  const handleSubmitForReview = async () => {
    if (!data || !currentUser?.id) return
    setPublishing(true)
    try {
      const res = await fetch(`/api/instructor/courses/${data.course.id}?instructorId=${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorId: currentUser.id, reviewStatus: 'pending' }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to submit for review')
      }
      toast.success('Course submitted for review!')
      fetchCourse()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit for review')
    } finally {
      setPublishing(false)
    }
  }

  const handleArchiveToggle = async () => {
    if (!data || !currentUser?.id) return
    setArchiving(true)
    try {
      const res = await fetch(`/api/instructor/courses/${data.course.id}?instructorId=${currentUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorId: currentUser.id, isArchived: !data.course.isArchived }),
      })
      if (!res.ok) throw new Error('Failed to update course')
      toast.success(data.course.isArchived ? 'Course unarchived' : 'Course archived')
      fetchCourse()
    } catch {
      toast.error('Failed to update archive status')
    } finally {
      setArchiving(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/courses/${data?.course.id}`)
    toast.success('Course link copied!')
  }

  const handlePreview = () => {
    if (!data) return
    // Navigate to public course detail view
    setCurrentView('public-course-detail')
  }

  const handleBack = () => {
    setCurrentView(sourceView as 'instructor-courses' | 'instructor-dashboard')
  }

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) next.delete(moduleId)
      else next.add(moduleId)
      return next
    })
  }

  // ==================== Loading State ====================
  if (loading) {
    return (
      <div className="space-y-5 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-48 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-10 w-96 rounded-xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    )
  }

  // ==================== Error State ====================
  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 mb-4">
          <AlertCircle className="size-8" />
        </div>
        <h2 className="text-[18px] font-bold mb-2">Course Not Found</h2>
        <p className="text-[13px] text-muted-foreground mb-4 text-center max-w-md">{error || 'The course you are looking for does not exist or you do not have access.'}</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-xl" onClick={handleBack}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Courses
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={fetchCourse}>
            <RefreshCw className="mr-2 size-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const course = data.course
  const a = data.analytics
  const statusConfig = getStatusConfig(course)
  const StatusIcon = statusConfig.icon
  const gradientClass = categoryGradients[course.category] || 'from-emerald-500 to-teal-600'

  const filteredStudents = data.recentEnrollments.filter(s =>
    !studentSearch || s.name.toLowerCase().includes(studentSearch.toLowerCase())
  )

  const totalModuleDuration = data.modules.reduce((acc, m) => acc + m.totalDuration, 0)
  const totalLessonCount = data.modules.reduce((acc, m) => acc + m.lessons.length, 0)

  return (
    <div className="space-y-5 p-4 sm:p-6 max-w-[1400px] mx-auto">
      {/* ==================== Breadcrumb ==================== */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="flex items-center gap-2 text-[13px]"
      >
        <Button variant="ghost" size="sm" className="rounded-lg text-[13px] gap-1 h-8 px-2 sm:hidden" onClick={handleBack}>
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <button onClick={handleBack} className="text-muted-foreground hover:text-primary transition-colors hidden sm:inline-flex items-center gap-1">
          <ArrowLeft className="size-3.5" />
          Courses
        </button>
        <ChevronRight className="size-3.5 text-muted-foreground/50 hidden sm:block" />
        <span className="font-medium text-foreground truncate max-w-[300px]">{course.title}</span>
      </motion.div>

      {/* ==================== Header Section ==================== */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.05 }}
        className="rounded-2xl border bg-card overflow-hidden"
      >
        <div className="relative">
          {/* Thumbnail banner */}
          <div className="relative h-40 sm:h-48 overflow-hidden">
            {course.thumbnail ? (
              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <div className={cn('w-full h-full bg-gradient-to-br flex items-center justify-center', gradientClass)}>
                <GraduationCap className="size-16 text-white/40" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            {/* Overlay info */}
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <Badge className={cn('text-[11px] px-2 py-0.5 border-0', statusConfig.color)}>
                      <StatusIcon className="size-3 mr-1" />
                      {statusConfig.label}
                    </Badge>
                    <Badge variant="outline" className={cn('text-[11px] px-2 py-0.5 border-0', getLevelColor(course.level))}>
                      {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                    </Badge>
                    <Badge variant="outline" className="text-[11px] px-2 py-0.5 bg-white/20 text-white border-0">
                      {course.category}
                    </Badge>
                    <Badge variant="outline" className="text-[11px] px-2 py-0.5 bg-white/20 text-white border-0 uppercase">
                      {course.language}
                    </Badge>
                  </div>
                  <h1 className="text-[22px] sm:text-[28px] font-bold text-white tracking-tight leading-tight drop-shadow-sm">{course.title}</h1>
                  {course.rating > 0 && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <StarRating rating={course.rating} />
                      <span className="text-[13px] text-white/90 font-medium">{course.rating.toFixed(1)}</span>
                      <span className="text-[12px] text-white/60">({a.ratingBreakdown.reduce((sum, r) => sum + r.count, 0)} reviews)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action bar below thumbnail */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-[12px] text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><Calendar className="size-3.5" /> Created {formatDate(course.createdAt)}</span>
              <span className="flex items-center gap-1"><Clock className="size-3.5" /> Updated {formatDate(course.updatedAt)}</span>
              {course.price === 0 ? (
                <Badge className="text-[11px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0">Free</Badge>
              ) : (
                <span className="font-semibold text-foreground">${course.price.toLocaleString()}</span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Button variant="outline" size="sm" className="rounded-xl text-[12px] gap-1.5" onClick={handleCopyLink}>
                <Copy className="size-3.5" />
                <span className="hidden sm:inline">Copy Link</span>
              </Button>
              <Button variant="outline" size="sm" className="rounded-xl text-[12px] gap-1.5" onClick={handlePreview}>
                <ExternalLink className="size-3.5" />
                <span className="hidden sm:inline">Preview</span>
              </Button>
              {course.reviewStatus === 'draft' && !course.isPublished && (
                <Button
                  size="sm"
                  className="rounded-xl text-[12px] gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                  onClick={handleSubmitForReview}
                  disabled={publishing}
                >
                  {publishing ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                  Submit for Review
                </Button>
              )}
              {course.reviewStatus === 'changes_requested' && (
                <Button
                  size="sm"
                  className="rounded-xl text-[12px] gap-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                  onClick={handleSubmitForReview}
                  disabled={publishing}
                >
                  {publishing ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                  Re-submit for Review
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-[12px] gap-1.5"
                onClick={handleArchiveToggle}
                disabled={archiving}
              >
                {archiving ? <Loader2 className="size-3.5 animate-spin" /> : course.isArchived ? <ArchiveRestore className="size-3.5" /> : <Archive className="size-3.5" />}
                {course.isArchived ? 'Unarchive' : 'Archive'}
              </Button>
              <Button size="sm" className="rounded-xl text-[12px] gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white" onClick={handleEdit}>
                <Edit3 className="size-3.5" />
                Edit Course
              </Button>
            </div>
          </div>

          {/* Description */}
          {course.description && (
            <div className="px-4 sm:px-5 pb-4 sm:pb-5">
              <p className="text-[14px] text-muted-foreground line-clamp-3">{course.description}</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ==================== Stats Cards Row ==================== */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        {[
          {
            label: 'Total Students',
            value: a.totalEnrollments.toLocaleString(),
            icon: Users,
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-950/30',
            sub: a.recentEnrollments > 0 ? `+${a.recentEnrollments} this week` : undefined,
          },
          {
            label: 'Avg Progress',
            value: `${a.avgProgress}%`,
            icon: TrendingUp,
            color: 'text-teal-600 dark:text-teal-400',
            bg: 'bg-teal-50 dark:bg-teal-950/30',
            progress: a.avgProgress,
          },
          {
            label: 'Completion Rate',
            value: `${a.completionRate}%`,
            icon: CheckCircle2,
            color: 'text-cyan-600 dark:text-cyan-400',
            bg: 'bg-cyan-50 dark:bg-cyan-950/30',
            progress: a.completionRate,
          },
          {
            label: 'Revenue',
            value: `$${a.totalRevenue.toLocaleString()}`,
            icon: DollarSign,
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-950/30',
          },
          {
            label: 'Rating',
            value: course.rating.toFixed(1),
            icon: Star,
            color: 'text-amber-500 dark:text-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-950/30',
            stars: course.rating,
          },
          {
            label: 'Total Duration',
            value: formatDuration(a.totalDuration),
            icon: Clock,
            color: 'text-violet-600 dark:text-violet-400',
            bg: 'bg-violet-50 dark:bg-violet-950/30',
          },
        ].map((stat) => {
          const StatIcon = stat.icon
          return (
            <Card key={stat.label} className="rounded-2xl border-border/40">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('flex size-8 items-center justify-center rounded-lg', stat.bg)}>
                    <StatIcon className={cn('size-4', stat.color)} />
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">{stat.label}</span>
                </div>
                <p className={cn('text-[20px] font-bold', stat.color)}>{stat.value}</p>
                {stat.sub && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-0.5">
                    <UserPlus className="size-3" /> {stat.sub}
                  </p>
                )}
                {stat.progress !== undefined && (
                  <Progress value={stat.progress} className="h-1.5 mt-2" />
                )}
                {stat.stars !== undefined && (
                  <div className="mt-1">
                    <StarRating rating={stat.stars} size={10} />
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </motion.div>

      {/* ==================== Main Content Area ==================== */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.15 }}
        className="grid gap-5 lg:grid-cols-[1fr_320px]"
      >
        {/* Left: Tabbed Content */}
        <div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start rounded-xl bg-muted/50 p-1 h-auto flex-wrap">
              <TabsTrigger value="curriculum" className="rounded-lg text-[13px] data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <BookOpen className="size-3.5 mr-1.5" /> Curriculum
              </TabsTrigger>
              <TabsTrigger value="students" className="rounded-lg text-[13px] data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Users className="size-3.5 mr-1.5" /> Students
              </TabsTrigger>
              <TabsTrigger value="analytics" className="rounded-lg text-[13px] data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <BarChart3 className="size-3.5 mr-1.5" /> Analytics
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-lg text-[13px] data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Star className="size-3.5 mr-1.5" /> Reviews
              </TabsTrigger>
              <TabsTrigger value="settings" className="rounded-lg text-[13px] data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Settings className="size-3.5 mr-1.5" /> Settings
              </TabsTrigger>
            </TabsList>

            {/* ==================== Curriculum Tab ==================== */}
            <TabsContent value="curriculum" className="mt-4">
              <Card className="rounded-2xl border-border/40">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
                      <BookOpen className="size-4 text-emerald-600 dark:text-emerald-400" />
                      Modules ({data.modules.length})
                    </CardTitle>
                    <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                      <span>{totalLessonCount} lessons</span>
                      <span>·</span>
                      <span>{formatDuration(totalModuleDuration)}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {data.modules.length === 0 ? (
                    <div className="flex flex-col items-center py-12 text-center">
                      <BookOpen className="size-10 text-muted-foreground/30 mb-3" />
                      <p className="text-[14px] font-medium text-muted-foreground mb-1">No modules yet</p>
                      <p className="text-[12px] text-muted-foreground/70 mb-4">Add modules and lessons to build your course content</p>
                      <Button variant="outline" size="sm" className="rounded-xl text-[12px]" onClick={handleEdit}>
                        <Edit3 className="size-3.5 mr-1" />
                        Add Modules
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.modules.map((mod, idx) => (
                        <Collapsible
                          key={mod.id}
                          open={expandedModules.has(mod.id)}
                          onOpenChange={() => toggleModule(mod.id)}
                        >
                          <div className="rounded-xl border border-border/50 overflow-hidden">
                            <CollapsibleTrigger asChild>
                              <button className="w-full flex items-center gap-3 p-3 hover:bg-accent/30 transition-colors text-left">
                                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[12px] font-bold shrink-0">
                                  {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[13px] font-medium truncate">{mod.title}</p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {mod.lessons.length} lesson{mod.lessons.length !== 1 ? 's' : ''} · {formatDuration(mod.totalDuration)}
                                  </p>
                                </div>
                                <ChevronDown className={cn(
                                  'size-4 text-muted-foreground transition-transform',
                                  expandedModules.has(mod.id) && 'rotate-180'
                                )} />
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="border-t border-border/30">
                                {mod.lessons.length === 0 ? (
                                  <div className="px-4 py-3 text-center text-[12px] text-muted-foreground">
                                    No lessons in this module yet
                                  </div>
                                ) : (
                                  <div className="divide-y divide-border/20">
                                    {mod.lessons.map((lesson) => {
                                      const LessonIcon = getLessonTypeIcon(lesson.type)
                                      return (
                                        <div key={lesson.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/20 transition-colors">
                                          <LessonIcon className="size-4 text-muted-foreground shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-[12px] font-medium truncate">{lesson.title}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                              <Badge variant="outline" className="text-[9px] h-4 px-1.5 rounded capitalize">{lesson.type}</Badge>
                                              <span className="text-[10px] text-muted-foreground">{formatDuration(lesson.duration)}</span>
                                              {lesson.isFree && (
                                                <Badge className="text-[9px] h-4 px-1.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0">Free</Badge>
                                              )}
                                            </div>
                                          </div>
                                          {lesson.isPublished ? (
                                            <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                                          ) : (
                                            <Edit3 className="size-3.5 text-amber-500 shrink-0" />
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quizzes section */}
              {data.quizzes.length > 0 && (
                <Card className="rounded-2xl border-border/40 mt-4">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
                        <Award className="size-4 text-amber-600 dark:text-amber-400" />
                        Quizzes ({data.quizzes.length})
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {data.quizzes.map((quiz) => (
                        <div key={quiz.id} className="flex items-center gap-3 p-3 rounded-xl bg-accent/30 hover:bg-accent/50 transition-colors">
                          <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40">
                            <Award className="size-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium truncate">{quiz.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[9px] h-4 px-1.5 rounded capitalize">{quiz.type}</Badge>
                              <span className="text-[10px] text-muted-foreground">Pass: {quiz.passingScore}%</span>
                            </div>
                          </div>
                          {quiz.isPublished ? (
                            <CheckCircle2 className="size-4 text-emerald-500" />
                          ) : (
                            <Edit3 className="size-4 text-amber-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ==================== Students Tab ==================== */}
            <TabsContent value="students" className="mt-4">
              <Card className="rounded-2xl border-border/40">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
                      <Users className="size-4 text-emerald-600 dark:text-emerald-400" />
                      Enrolled Students ({a.totalEnrollments})
                    </CardTitle>
                  </div>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search students..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="h-9 pl-9 rounded-xl text-[13px]"
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {data.recentEnrollments.length === 0 ? (
                    <div className="flex flex-col items-center py-12 text-center">
                      <Users className="size-10 text-muted-foreground/30 mb-3" />
                      <p className="text-[14px] font-medium text-muted-foreground mb-1">No students enrolled yet</p>
                      <p className="text-[12px] text-muted-foreground/70">Students will appear here once they enroll in your course</p>
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-8 text-[13px] text-muted-foreground">No students match your search</div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
                      {filteredStudents.map((enrollment, idx) => (
                        <div
                          key={enrollment.id}
                          className={cn(
                            'flex items-center gap-3 p-3 rounded-xl hover:bg-accent/30 transition-colors',
                            idx < 3 && enrollment.progress >= 80 && 'bg-emerald-50/50 dark:bg-emerald-950/20'
                          )}
                        >
                          <Avatar className="size-9 shrink-0">
                            <AvatarImage src={enrollment.avatar || undefined} />
                            <AvatarFallback className="text-[12px] font-semibold bg-primary/10 text-primary">
                              {enrollment.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[13px] font-medium truncate">{enrollment.name}</p>
                              {idx < 3 && enrollment.progress >= 80 && (
                                <Badge className="text-[9px] px-1.5 py-0 h-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0">Top</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={enrollment.progress} className="h-1.5 flex-1" />
                              <span className="text-[11px] text-muted-foreground font-medium w-8 text-right">{enrollment.progress}%</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] px-1.5 py-0 h-5 rounded-md capitalize',
                                enrollment.status === 'completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                                enrollment.status === 'active' ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border-sky-200 dark:border-sky-800' :
                                'bg-muted text-muted-foreground'
                              )}
                            >
                              {enrollment.status}
                            </Badge>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{formatRelativeDate(enrollment.enrolledAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ==================== Analytics Tab ==================== */}
            <TabsContent value="analytics" className="mt-4 space-y-4">
              {/* Enrollment Trend Chart */}
              <Card className="rounded-2xl border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
                    <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
                    Enrollment Trend (Last 30 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {a.enrollmentTrend.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={a.enrollmentTrend} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                          <defs>
                            <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11 }}
                            tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            className="text-muted-foreground"
                          />
                          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} className="text-muted-foreground" />
                          <Tooltip
                            contentStyle={{
                              borderRadius: '12px',
                              border: '1px solid hsl(var(--border))',
                              background: 'hsl(var(--card))',
                              fontSize: '12px',
                            }}
                            labelFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                          />
                          <Area type="monotone" dataKey="count" stroke="#10b981" fill="url(#enrollmentGradient)" strokeWidth={2} name="Enrollments" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-12 text-center">
                      <BarChart3 className="size-10 text-muted-foreground/30 mb-3" />
                      <p className="text-[13px] text-muted-foreground">No enrollment data yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Completion Funnel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="rounded-2xl border-border/40">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
                      <Activity className="size-4 text-teal-600 dark:text-teal-400" />
                      Completion Funnel
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {[
                      { label: 'Enrolled', value: a.totalEnrollments, pct: 100, color: 'bg-emerald-500' },
                      { label: 'In Progress', value: a.totalEnrollments - data.recentEnrollments.filter(e => e.status === 'completed').length, pct: a.totalEnrollments > 0 ? Math.round(((a.totalEnrollments - data.recentEnrollments.filter(e => e.status === 'completed').length) / a.totalEnrollments) * 100) : 0, color: 'bg-teal-500' },
                      { label: 'Completed', value: data.recentEnrollments.filter(e => e.status === 'completed').length, pct: a.completionRate, color: 'bg-cyan-500' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between text-[12px] mb-1">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-medium">{item.value} ({item.pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className={cn('h-full rounded-full transition-all', item.color)} style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Rating Breakdown */}
                <Card className="rounded-2xl border-border/40">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
                      <Star className="size-4 text-amber-500 fill-amber-500" />
                      Rating Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {a.ratingBreakdown.slice().reverse().map((rb) => {
                      const maxCount = Math.max(...a.ratingBreakdown.map(r => r.count), 1)
                      return (
                        <div key={rb.star} className="flex items-center gap-2">
                          <span className="text-[12px] text-muted-foreground w-6 text-right">{rb.star}</span>
                          <Star className="size-3 text-amber-500 fill-amber-500 shrink-0" />
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${(rb.count / maxCount) * 100}%` }} />
                          </div>
                          <span className="text-[12px] text-muted-foreground w-6">{rb.count}</span>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* Quick analytics summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Avg. Progress', value: `${a.avgProgress}%`, icon: TrendingUp, color: 'text-teal-600' },
                  { label: 'Completion Rate', value: `${a.completionRate}%`, icon: CheckCircle2, color: 'text-cyan-600' },
                  { label: 'Total Lessons', value: a.totalLessons, icon: BookOpen, color: 'text-emerald-600' },
                  { label: 'This Week', value: `+${a.recentEnrollments}`, icon: UserPlus, color: 'text-amber-600' },
                ].map((stat) => {
                  const StatIcon = stat.icon
                  return (
                    <div key={stat.label} className="rounded-xl bg-card border border-border/40 p-3 text-center">
                      <StatIcon className={cn('size-4 mx-auto mb-1', stat.color)} />
                      <p className="text-[18px] font-bold">{stat.value}</p>
                      <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                    </div>
                  )
                })}
              </div>
            </TabsContent>

            {/* ==================== Reviews Tab ==================== */}
            <TabsContent value="reviews" className="mt-4">
              <Card className="rounded-2xl border-border/40">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
                      <Star className="size-4 text-amber-500 fill-amber-500" />
                      Student Reviews
                    </CardTitle>
                    {course.rating > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[22px] font-bold">{course.rating.toFixed(1)}</span>
                        <StarRating rating={course.rating} />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {data.recentReviews.length === 0 ? (
                    <div className="flex flex-col items-center py-12 text-center">
                      <MessageSquare className="size-10 text-muted-foreground/30 mb-3" />
                      <p className="text-[14px] font-medium text-muted-foreground mb-1">No reviews yet</p>
                      <p className="text-[12px] text-muted-foreground/70">Reviews will appear here once students rate your course</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.recentReviews.map((review) => (
                        <div key={review.id} className="rounded-xl border border-border/40 p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="size-9 shrink-0">
                              <AvatarImage src={review.avatar || undefined} />
                              <AvatarFallback className="text-[12px] font-semibold bg-primary/10 text-primary">
                                {review.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[13px] font-medium">{review.name}</p>
                                <span className="text-[11px] text-muted-foreground shrink-0">{formatRelativeDate(review.createdAt)}</span>
                              </div>
                              <div className="mt-0.5">
                                <StarRating rating={review.rating} size={12} />
                              </div>
                              {review.content && (
                                <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">{review.content}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ==================== Settings Tab ==================== */}
            <TabsContent value="settings" className="mt-4 space-y-4">
              <Card className="rounded-2xl border-border/40">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
                    <Settings className="size-4 text-muted-foreground" />
                    Course Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-5">
                  {/* Price */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium">Price</p>
                      <p className="text-[11px] text-muted-foreground">Course pricing in USD</p>
                    </div>
                    <span className="text-[15px] font-semibold">{course.price === 0 ? 'Free' : `$${course.price.toLocaleString()}`}</span>
                  </div>
                  <Separator />

                  {/* Language */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium flex items-center gap-1.5"><Globe className="size-3.5" /> Language</p>
                      <p className="text-[11px] text-muted-foreground">Course language</p>
                    </div>
                    <Badge variant="outline" className="text-[12px] uppercase">{course.language}</Badge>
                  </div>
                  <Separator />

                  {/* Level */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium flex items-center gap-1.5"><GraduationCap className="size-3.5" /> Level</p>
                      <p className="text-[11px] text-muted-foreground">Difficulty level</p>
                    </div>
                    <Badge className={cn('text-[12px]', getLevelColor(course.level))}>{course.level.charAt(0).toUpperCase() + course.level.slice(1)}</Badge>
                  </div>
                  <Separator />

                  {/* Completion Threshold */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium flex items-center gap-1.5"><ShieldCheck className="size-3.5" /> Completion Threshold</p>
                      <p className="text-[11px] text-muted-foreground">Progress needed to complete</p>
                    </div>
                    <span className="text-[14px] font-semibold">{course.completionThreshold}%</span>
                  </div>
                  <Separator />

                  {/* Certificate */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium flex items-center gap-1.5"><Award className="size-3.5" /> Certificate</p>
                      <p className="text-[11px] text-muted-foreground">Issue certificate on completion</p>
                    </div>
                    <Switch checked={course.certificateEnabled} disabled />
                  </div>
                  <Separator />

                  {/* Estimated Duration */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium flex items-center gap-1.5"><Clock className="size-3.5" /> Estimated Duration</p>
                      <p className="text-[11px] text-muted-foreground">Total course duration</p>
                    </div>
                    <span className="text-[14px] font-semibold">{course.estimatedDuration > 0 ? `${course.estimatedDuration}h` : formatDuration(a.totalDuration)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="rounded-2xl border-red-200 dark:border-red-900/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[15px] font-semibold text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium">{course.isArchived ? 'Unarchive Course' : 'Archive Course'}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {course.isArchived ? 'Make this course active again' : 'Hide this course from public listings'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-[12px] border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                      onClick={handleArchiveToggle}
                      disabled={archiving}
                    >
                      {archiving ? <Loader2 className="size-3.5 animate-spin mr-1" /> : course.isArchived ? <ArchiveRestore className="size-3.5 mr-1" /> : <Archive className="size-3.5 mr-1" />}
                      {course.isArchived ? 'Unarchive' : 'Archive'}
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[13px] font-medium">Delete Course</p>
                      <p className="text-[11px] text-muted-foreground">
                        {a.totalEnrollments > 0 ? 'Cannot delete with active enrollments' : 'Permanently delete this course'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-[12px] border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                      disabled={a.totalEnrollments > 0}
                    >
                      <Trash2 className="size-3.5 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Edit button */}
              <Button className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white" onClick={handleEdit}>
                <Edit3 className="mr-2 size-4" />
                Edit Course in Creator
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        {/* ==================== Right Sidebar (desktop) ==================== */}
        <div className="hidden lg:block space-y-4">
          {/* Quick Actions */}
          <Card className="rounded-2xl border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <Button variant="outline" className="w-full rounded-xl text-[12px] justify-start gap-2 h-9" onClick={handleEdit}>
                <Edit3 className="size-3.5" /> Edit Course
              </Button>
              <Button variant="outline" className="w-full rounded-xl text-[12px] justify-start gap-2 h-9" onClick={handlePreview}>
                <ExternalLink className="size-3.5" /> Preview
              </Button>
              <Button variant="outline" className="w-full rounded-xl text-[12px] justify-start gap-2 h-9" onClick={handleCopyLink}>
                <Copy className="size-3.5" /> Copy Link
              </Button>
              {course.reviewStatus === 'draft' && !course.isPublished && (
                <Button
                  className="w-full rounded-xl text-[12px] justify-start gap-2 h-9 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
                  onClick={handleSubmitForReview}
                  disabled={publishing}
                >
                  {publishing ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                  Submit for Review
                </Button>
              )}
              {course.reviewStatus === 'changes_requested' && (
                <Button
                  className="w-full rounded-xl text-[12px] justify-start gap-2 h-9 bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700"
                  onClick={handleSubmitForReview}
                  disabled={publishing}
                >
                  {publishing ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                  Re-submit for Review
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Course Status */}
          <Card className="rounded-2xl border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                Course Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground">Publish Status</span>
                <Badge className={cn('text-[11px] border-0', course.isPublished ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400')}>
                  {course.isPublished ? 'Published' : 'Unpublished'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground">Review Status</span>
                <Badge className={cn('text-[11px] border-0', statusConfig.color)}>
                  {statusConfig.label}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-muted-foreground">Archive Status</span>
                <Badge className={cn('text-[11px] border-0', course.isArchived ? 'bg-slate-100 text-slate-700 dark:bg-slate-950/40 dark:text-slate-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400')}>
                  {course.isArchived ? 'Archived' : 'Active'}
                </Badge>
              </div>
              <Separator />
              {/* Timeline */}
              <div className="space-y-2">
                {course.submittedForReviewAt && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <div className="size-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-muted-foreground">Submitted: {formatRelativeDate(course.submittedForReviewAt)}</span>
                  </div>
                )}
                {course.reviewedAt && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <div className="size-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-muted-foreground">Last reviewed: {formatRelativeDate(course.reviewedAt)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-[11px]">
                  <div className="size-2 rounded-full bg-muted-foreground/40 shrink-0" />
                  <span className="text-muted-foreground">Created: {formatRelativeDate(course.createdAt)}</span>
                </div>
              </div>
              {/* Review note */}
              {course.reviewNote && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 p-3 mt-2">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MessageSquare className="size-3 text-amber-600 dark:text-amber-400" />
                    <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">Review Note</span>
                  </div>
                  <p className="text-[12px] text-muted-foreground">{course.reviewNote}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="rounded-2xl border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-semibold flex items-center gap-2">
                <Activity className="size-4 text-teal-600 dark:text-teal-400" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {data.recentEnrollments.length === 0 ? (
                <p className="text-[12px] text-muted-foreground text-center py-4">No recent activity</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
                  {data.recentEnrollments.slice(0, 5).map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center gap-2.5">
                      <Avatar className="size-7 shrink-0">
                        <AvatarImage src={enrollment.avatar || undefined} />
                        <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
                          {enrollment.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium truncate">{enrollment.name}</p>
                        <p className="text-[10px] text-muted-foreground">Enrolled {formatRelativeDate(enrollment.enrolledAt)}</p>
                      </div>
                      <UserPlus className="size-3.5 text-emerald-500 shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}
