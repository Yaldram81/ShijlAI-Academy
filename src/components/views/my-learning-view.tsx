'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  GraduationCap,
  Star,
  Play,
  Clock,
  Award,
  Archive,
  ArchiveRestore,
  Trash2,
  Heart,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pause,
  Eye,
  Download,
  MessageSquare,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Package,
  Zap,
  TrendingUp,
  Timer,
  ArrowRight,
  Trophy,
  SearchX,
  Layers,
  Search,
  LayoutGrid,
  List,
  X,
  Flame,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { Course } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface LearningEnrollment {
  id: string
  userId: string
  courseId: string
  progress: number
  status: 'active' | 'completed' | 'archived'
  enrolledAt: string
  completedAt: string | null
  lastAccessed: string
  course: {
    id: string
    title: string
    description: string
    category: string
    level: string
    thumbnail: string | null
    rating: number
    estimatedDuration: number
    price: number
    instructor: { id: string; name: string; avatar: string | null }
  }
  totalLessons: number
  completedLessons: number
  progressPercentage: number
  nextLesson: { id: string; title: string; moduleOrder: number; lessonOrder: number } | null
  hasReview: boolean
  certificate: { id: string; certificateId: string } | null
}

interface WishlistItem {
  id: string
  courseId: string
  course: {
    id: string
    title: string
    thumbnail: string | null
    category: string
    level: string
    rating: number
    price: number
    instructor: { name: string }
  }
  isEnrolled: boolean
  createdAt: string
}

type TabType = 'all' | 'in-progress' | 'completed' | 'not-started' | 'wishlist' | 'archived'
type SortType = 'last_accessed' | 'progress' | 'enrolled_date' | 'title'

// ─── Constants ────────────────────────────────────────────────────────────────

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

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

// Category dot colors for filter chips
const categoryDotColors: Record<string, string> = {
  IB: 'bg-emerald-500',
  Programming: 'bg-teal-500',
  'O-Levels': 'bg-emerald-400',
  'A-Levels': 'bg-teal-400',
  IELTS: 'bg-emerald-600',
  AWS: 'bg-teal-600',
  Mathematics: 'bg-emerald-500',
  Physics: 'bg-teal-500',
  Chemistry: 'bg-emerald-400',
  Biology: 'bg-teal-400',
  English: 'bg-emerald-600',
  'Computer Science': 'bg-teal-600',
  'Data Science': 'bg-cyan-500',
  'Web Development': 'bg-teal-500',
  Tech: 'bg-teal-500',
  Django: 'bg-emerald-500',
  Git: 'bg-teal-400',
}

const tabs: { key: TabType; label: string; icon?: React.ElementType }[] = [
  { key: 'all', label: 'All', icon: Layers },
  { key: 'in-progress', label: 'In Progress', icon: Play },
  { key: 'completed', label: 'Completed', icon: CheckCircle2 },
  { key: 'not-started', label: 'Not Started', icon: BookOpen },
  { key: 'wishlist', label: 'Wishlist', icon: Heart },
  { key: 'archived', label: 'Archived', icon: Archive },
]

// ─── InView Hook ──────────────────────────────────────────────────────────────

function useInView() {
  const ref = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsInView(true); obs.disconnect() }
    }, { threshold: 0.15 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return { ref, isInView }
}

// ─── CountUp Component ────────────────────────────────────────────────────────

function CountUp({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const { ref, isInView } = useInView()

  useEffect(() => {
    if (!isInView) return
    const startTime = performance.now()
    const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      setCount(Math.round(easeOutExpo(progress) * target))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [isInView, target, duration])

  return <span ref={ref}>{count}</span>
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    return `Today ${timeStr}`
  }
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`
}

function formatPrice(price: number): string {
  return `$${(price ?? 0).toLocaleString()}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatHours(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ─── Skeleton Components ─────────────────────────────────────────────────────

function EnrollmentCardSkeleton() {
  return (
    <div className="rounded-2xl ios-shadow-sm bg-card overflow-hidden">
      <div className="flex flex-col sm:flex-row">
        <Skeleton className="h-36 sm:h-auto sm:w-44 rounded-none" />
        <div className="flex-1 p-5 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

function WishlistCardSkeleton() {
  return (
    <div className="rounded-2xl ios-shadow-sm bg-card overflow-hidden">
      <Skeleton className="h-28 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-8 w-full rounded-full" />
      </div>
    </div>
  )
}

// ─── Review Dialog ────────────────────────────────────────────────────────────

function ReviewDialog({
  open,
  onClose,
  courseId,
  enrollmentId,
  userId,
  onSubmitted,
}: {
  open: boolean
  onClose: () => void
  courseId: string
  enrollmentId: string
  userId: string
  onSubmitted: () => void
}) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [content, setContent] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/student/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          courseId,
          enrollmentId,
          rating,
          content,
          anonymous,
        }),
      })
      if (!res.ok) throw new Error('Failed to submit review')
      toast.success('Review submitted successfully!')
      onSubmitted()
      onClose()
      setRating(0)
      setContent('')
      setAnonymous(false)
    } catch {
      toast.error('Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leave a Review</DialogTitle>
          <DialogDescription>
            Share your experience to help other students
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <p className="text-[13px] font-medium text-muted-foreground">Rating</p>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="ios-press transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'size-8 transition-colors',
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'fill-muted text-muted'
                    )}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-[13px] font-medium text-muted-foreground">
                  {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent'}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[13px] font-medium text-muted-foreground">Your review</p>
            <Textarea
              placeholder="What did you like about this course? What could be improved?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
            <div>
              <p className="text-[13px] font-medium">Post anonymously</p>
              <p className="text-[11px] text-muted-foreground">Your name won&apos;t be shown publicly</p>
            </div>
            <Switch checked={anonymous} onCheckedChange={setAnonymous} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 mr-1.5 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Review'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Star Rating Display ─────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'size-3',
            star <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-muted text-muted'
          )}
        />
      ))}
      <span className="ml-1 text-[11px] font-medium text-muted-foreground">
        {(rating ?? 0).toFixed(1)}
      </span>
    </div>
  )
}

// ─── Animated Progress Bar ────────────────────────────────────────────────────

function AnimatedProgressBar({
  percentage,
  delay = 0,
  showCompletion = false,
  thin = false,
}: {
  percentage: number
  delay?: number
  showCompletion?: boolean
  thin?: boolean
}) {
  const isComplete = percentage >= 100
  return (
    <div className={cn('rounded-full bg-muted/50 overflow-hidden relative', thin ? 'h-1.5' : 'h-2.5')}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(percentage, 100)}%` }}
        transition={{ duration: 0.8, ease: 'easeOut', delay }}
        className={cn(
          'h-full rounded-full',
          isComplete
            ? 'bg-gradient-to-r from-teal-500 to-emerald-500'
            : 'bg-gradient-to-r from-emerald-500 to-teal-500'
        )}
      />
      {isComplete && showCompletion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          style={{ animation: 'shimmer 2s infinite' }}
        />
      )}
    </div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'active' | 'completed' | 'archived' }) {
  if (status === 'active') {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0 gap-1 text-[11px] px-2 py-0.5">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        In Progress
      </Badge>
    )
  }
  if (status === 'completed') {
    return (
      <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border-0 gap-1 text-[11px] px-2 py-0.5">
        <CheckCircle2 className="size-3" />
        Completed
      </Badge>
    )
  }
  return (
    <Badge className="bg-muted text-muted-foreground border-0 gap-1 text-[11px] px-2 py-0.5">
      <Package className="size-3" />
      Archived
    </Badge>
  )
}

// ─── Weekly Activity Heatmap ──────────────────────────────────────────────────

function WeeklyActivity({ streak }: { streak: number }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  // Simulate activity based on streak: last N days are active
  const activityDays = useMemo(() => {
    const today = new Date().getDay() // 0=Sun, 1=Mon, ...
    const adjustedToday = today === 0 ? 6 : today - 1 // Convert to Mon=0 index
    const result = Array(7).fill(false)

    if (streak > 0) {
      // Fill in activity for the last `streak` days (capped at 7)
      const daysToFill = Math.min(streak, 7)
      for (let i = 0; i < daysToFill; i++) {
        const dayIndex = adjustedToday - i
        if (dayIndex >= 0) {
          result[dayIndex] = true
        }
      }
    }

    return result
  }, [streak])

  return (
    <div className="flex items-center gap-1.5">
      {days.map((day, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div
            className={cn(
              'size-3 rounded-full transition-colors duration-300',
              activityDays[i]
                ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30'
                : 'bg-muted-foreground/20'
            )}
          />
          <span className="text-[8px] text-muted-foreground font-medium">{day}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Continue Learning Hero ───────────────────────────────────────────────────

function ContinueLearningHero({
  enrollment,
  onContinue,
}: {
  enrollment: LearningEnrollment
  onContinue: () => void
}) {
  const { course } = enrollment
  const gradient = categoryGradients[course.category] || 'from-emerald-500 to-teal-600'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="relative rounded-2xl overflow-hidden ios-shadow-lg">
        {/* Gradient background */}
        <div className={cn('absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 opacity-95')} />

        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />

        {/* Floating decorative elements */}
        <motion.div
          animate={{ y: [-6, 6, -6], x: [-2, 2, -2] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-4 right-16 size-16 rounded-full bg-white/10 blur-sm"
        />
        <motion.div
          animate={{ y: [4, -4, 4], x: [2, -2, 2] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-4 right-32 size-10 rounded-full bg-white/10 blur-sm"
        />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 sm:p-6">
          {/* Course thumbnail */}
          <div className={cn(
            'relative size-16 sm:size-20 shrink-0 rounded-xl bg-gradient-to-br flex items-center justify-center overflow-hidden',
            gradient
          )}>
            {course.thumbnail ? (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${course.thumbnail})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>
            ) : (
              <GraduationCap className="size-8 text-white/80" />
            )}
          </div>

          {/* Course info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-white/20 text-white border-0 gap-1 text-[10px] px-2 py-0.5 backdrop-blur-sm">
                <Play className="size-2.5" />
                Continue Learning
              </Badge>
              <span className="text-[11px] text-white/70">
                {formatRelativeTime(enrollment.lastAccessed)}
              </span>
            </div>
            <h3 className="text-[17px] sm:text-[19px] font-bold text-white line-clamp-1">
              {course.title}
            </h3>
            <p className="text-[13px] text-white/80">
              by {course.instructor.name}
            </p>

            {/* Next lesson */}
            {enrollment.nextLesson && (
              <div className="flex items-center gap-2 text-[12px] text-white/70">
                <ArrowRight className="size-3" />
                <span className="truncate">
                  Next: {enrollment.nextLesson.moduleOrder}.{enrollment.nextLesson.lessonOrder} — {enrollment.nextLesson.title}
                </span>
              </div>
            )}

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-white/70">
                  {enrollment.completedLessons} of {enrollment.totalLessons} lessons
                </span>
                <span className="font-bold text-white">
                  {Math.round(enrollment.progressPercentage)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(enrollment.progressPercentage, 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  className="h-full rounded-full bg-white/90"
                />
              </div>
            </div>
          </div>

          {/* Continue button */}
          <Button
            size="lg"
            onClick={onContinue}
            className="shrink-0 rounded-full bg-white text-emerald-700 hover:bg-white/90 ios-press shadow-lg shadow-black/10 h-11 px-6 font-semibold"
          >
            <Play className="size-4 mr-1.5" />
            Continue
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Continue Learning Carousel ──────────────────────────────────────────────

function ContinueLearningCarousel({
  enrollments,
  onContinue,
}: {
  enrollments: LearningEnrollment[]
  onContinue: (enrollment: LearningEnrollment) => void
}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [direction, setDirection] = useState<1 | -1>(1)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const total = enrollments.length
  // Clamp index into valid range whenever enrollments shrink
  const safeIndex = Math.min(currentIndex, Math.max(total - 1, 0))
  const current = enrollments[safeIndex]

  // Auto-rotate every 3 seconds
  useEffect(() => {
    if (isPaused || total <= 1) return

    intervalRef.current = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % total)
    }, 3000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isPaused, total])

  const goTo = (index: number) => {
    setDirection(index > safeIndex ? 1 : -1)
    setCurrentIndex(index)
  }

  const goPrev = () => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + total) % total)
  }

  const goNext = () => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % total)
  }

  if (!current) return null

  const slideVariants = {
    enter: (dir: 1 | -1) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: 1 | -1) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
    }),
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: 'easeInOut' }}
        >
          <ContinueLearningHero
            enrollment={current}
            onContinue={() => onContinue(current)}
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows — only show if more than 1 */}
      {total > 1 && (
        <>
          {/* Prev / Next buttons */}
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors ios-press z-10"
            aria-label="Previous course"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors ios-press z-10"
            aria-label="Next course"
          >
            <ChevronRight className="size-4" />
          </button>

          {/* Dots indicator + pause icon */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {enrollments.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={cn(
                  'rounded-full transition-all duration-300',
                  i === safeIndex
                    ? 'w-5 h-1.5 bg-white'
                    : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/60'
                )}
                aria-label={`Go to course ${i + 1}`}
              />
            ))}
            {/* Pause indicator */}
            {isPaused && (
              <div className="ml-1 flex items-center gap-0.5 text-white/50">
                <Pause className="size-2.5" />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Enrollment Card ─────────────────────────────────────────────────────────

function EnrollmentCard({
  enrollment,
  index,
  onContinue,
  onArchive,
  onRestore,
  onReview,
  onCourseOverview,
}: {
  enrollment: LearningEnrollment
  index: number
  onContinue: () => void
  onArchive: () => void
  onRestore: () => void
  onReview: () => void
  onCourseOverview: () => void
}) {
  const { course } = enrollment
  const gradient = categoryGradients[course.category] || 'from-emerald-500 to-teal-600'
  const isActive = enrollment.status === 'active'
  const isCompleted = enrollment.status === 'completed'
  const isArchived = enrollment.status === 'archived'
  const is100 = enrollment.progressPercentage >= 100

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ ...springTransition, delay: index * 0.05 }}
    >
      <div className="rounded-2xl ios-shadow-sm bg-card overflow-hidden hover:ios-shadow-lg transition-shadow duration-300 group">
        <div className="flex flex-col sm:flex-row">
          {/* Gradient Thumbnail with category badge */}
          <div
            className={cn(
              'relative h-36 sm:h-auto sm:w-44 shrink-0 bg-gradient-to-br flex items-center justify-center',
              gradient
            )}
          >
            {course.thumbnail ? (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${course.thumbnail})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </div>
            ) : (
              <>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
                <GraduationCap className="size-10 text-white/70" />
              </>
            )}
            {/* Category badge */}
            <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur-sm dark:bg-black/70 dark:text-white">
              {course.category}
            </span>
            {/* Completion badge overlay */}
            {is100 && (
              <div className="absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
                <CheckCircle2 className="size-4 text-white" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 sm:p-5 space-y-3">
            {/* Title + Instructor */}
            <div>
              <h3 className="text-[15px] font-semibold leading-snug text-card-foreground line-clamp-2">
                {course.title}
              </h3>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                by {course.instructor.name}
              </p>
            </div>

            {/* Status + Rating + Last accessed */}
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={enrollment.status} />
              <StarRating rating={course.rating} />
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="size-3" />
                {formatRelativeTime(enrollment.lastAccessed)}
              </span>
            </div>

            {/* Progress bar with percentage */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">
                  {enrollment.completedLessons} of {enrollment.totalLessons} lessons done
                </span>
                <span className={cn(
                  'font-bold',
                  is100 ? 'text-teal-600 dark:text-teal-400' : 'text-emerald-600 dark:text-emerald-400'
                )}>
                  {Math.round(enrollment.progressPercentage)}%
                </span>
              </div>
              <AnimatedProgressBar percentage={enrollment.progressPercentage} delay={0.3 + index * 0.05} showCompletion />
            </div>

            {/* Next lesson indicator with Continue button for active courses */}
            {isActive && enrollment.nextLesson && (
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 dark:bg-emerald-950/20 p-2.5">
                <div className="min-w-0 flex-1 mr-2">
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wide">
                    Next Lesson
                  </p>
                  <p className="text-[12px] text-card-foreground truncate mt-0.5">
                    {enrollment.nextLesson.moduleOrder}.{enrollment.nextLesson.lessonOrder} — {enrollment.nextLesson.title}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={onContinue}
                  className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white ios-press h-7 text-[11px] px-3 shrink-0"
                >
                  <Play className="size-3 mr-0.5" />
                  Continue
                </Button>
              </div>
            )}

            {/* Completion info for completed courses */}
            {isCompleted && (
              <div className="flex items-center gap-3 text-[12px]">
                <span className="text-muted-foreground">
                  Completed {formatDate(enrollment.completedAt!)}
                </span>
                {enrollment.certificate && (
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-0 gap-1 text-[11px] px-2 py-0.5">
                    <Award className="size-3" />
                    Certificate earned
                  </Badge>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {isActive && (
                <>
                  <Button
                    size="sm"
                    onClick={onContinue}
                    className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white ios-press h-8 text-[12px] px-4"
                  >
                    <Play className="size-3 mr-1" />
                    Continue
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onCourseOverview}
                    className="rounded-full ios-press h-8 text-[12px] px-3"
                  >
                    <Eye className="size-3 mr-1" />
                    Course overview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full ios-press h-8 text-[12px] px-3"
                    onClick={() => toast.info('Download starting...')}
                  >
                    <Download className="size-3 mr-1" />
                    Materials
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onReview}
                    className="rounded-full ios-press h-8 text-[12px] px-3"
                  >
                    <MessageSquare className="size-3 mr-1" />
                    {enrollment.hasReview ? 'Edit review' : 'Leave review'}
                  </Button>
                </>
              )}
              {isCompleted && (
                <>
                  {enrollment.certificate && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full ios-press h-8 text-[12px] px-3 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/20"
                      onClick={() => toast.info('Opening certificate...')}
                    >
                      <Award className="size-3 mr-1" />
                      View certificate
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onReview}
                    className="rounded-full ios-press h-8 text-[12px] px-3"
                  >
                    <MessageSquare className="size-3 mr-1" />
                    {enrollment.hasReview ? 'Edit review' : 'Review course'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full ios-press h-8 text-[12px] px-3"
                    onClick={onContinue}
                  >
                    <RotateCcw className="size-3 mr-1" />
                    Re-watch
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onArchive}
                    className="rounded-full ios-press h-8 text-[12px] px-3"
                  >
                    <Archive className="size-3 mr-1" />
                    Archive
                  </Button>
                </>
              )}
              {isArchived && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onRestore}
                    className="rounded-full ios-press h-8 text-[12px] px-3"
                  >
                    <ArchiveRestore className="size-3 mr-1" />
                    Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onCourseOverview}
                    className="rounded-full ios-press h-8 text-[12px] px-3"
                  >
                    <Eye className="size-3 mr-1" />
                    Course overview
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Enrollment Grid Card (compact) ──────────────────────────────────────────

function EnrollmentGridCard({
  enrollment,
  index,
  onContinue,
  onArchive,
  onRestore,
  onReview,
}: {
  enrollment: LearningEnrollment
  index: number
  onContinue: () => void
  onArchive: () => void
  onRestore: () => void
  onReview: () => void
}) {
  const { course } = enrollment
  const gradient = categoryGradients[course.category] || 'from-emerald-500 to-teal-600'
  const isActive = enrollment.status === 'active'
  const isCompleted = enrollment.status === 'completed'
  const is100 = enrollment.progressPercentage >= 100

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ ...springTransition, delay: index * 0.04 }}
    >
      <div className="rounded-2xl ios-shadow-sm bg-card overflow-hidden hover:ios-shadow-lg transition-shadow duration-300 group">
        {/* Thumbnail */}
        <div
          className={cn(
            'relative h-28 bg-gradient-to-br flex items-center justify-center',
            gradient
          )}
        >
          {course.thumbnail ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${course.thumbnail})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
          ) : (
            <>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
              <GraduationCap className="size-8 text-white/70" />
            </>
          )}
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur-sm dark:bg-black/70 dark:text-white">
            {course.category}
          </span>
          {is100 && (
            <div className="absolute right-2.5 top-2.5 flex size-6 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
              <CheckCircle2 className="size-3.5 text-white" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3.5 space-y-2.5">
          <div>
            <h3 className="text-[13px] font-semibold leading-snug text-card-foreground line-clamp-1">
              {course.title}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              by {course.instructor.name}
            </p>
          </div>

          {/* Progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">
                {enrollment.completedLessons}/{enrollment.totalLessons}
              </span>
              <span className={cn(
                'font-bold',
                is100 ? 'text-teal-600 dark:text-teal-400' : 'text-emerald-600 dark:text-emerald-400'
              )}>
                {Math.round(enrollment.progressPercentage)}%
              </span>
            </div>
            <AnimatedProgressBar percentage={enrollment.progressPercentage} delay={0.2 + index * 0.04} thin />
          </div>

          {/* Action */}
          {isActive ? (
            <Button
              size="sm"
              onClick={onContinue}
              className="w-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white ios-press h-7 text-[11px]"
            >
              <Play className="size-3 mr-1" />
              Continue
            </Button>
          ) : isCompleted ? (
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={onContinue}
                className="flex-1 rounded-full ios-press h-7 text-[10px] px-2"
              >
                <RotateCcw className="size-2.5 mr-0.5" />
                Re-watch
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onReview}
                className="flex-1 rounded-full ios-press h-7 text-[10px] px-2"
              >
                <MessageSquare className="size-2.5 mr-0.5" />
                Review
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={onRestore}
              className="w-full rounded-full ios-press h-7 text-[11px]"
            >
              <ArchiveRestore className="size-3 mr-1" />
              Restore
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Wishlist Card ────────────────────────────────────────────────────────────

function WishlistCard({
  item,
  index,
  onRemove,
  onEnroll,
}: {
  item: WishlistItem
  index: number
  onRemove: () => void
  onEnroll: () => void
}) {
  const { course } = item
  const gradient = categoryGradients[course.category] || 'from-emerald-500 to-teal-600'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ ...springTransition, delay: index * 0.05 }}
    >
      <div className="rounded-2xl ios-shadow-sm bg-card overflow-hidden hover:ios-shadow-lg transition-shadow duration-300 group">
        <div
          className={cn(
            'relative h-28 bg-gradient-to-br flex items-center justify-center',
            gradient
          )}
        >
          {course.thumbnail ? (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${course.thumbnail})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
          ) : (
            <>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
              <GraduationCap className="size-8 text-white/70" />
            </>
          )}
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur-sm dark:bg-black/70 dark:text-white">
            {course.category}
          </span>
          <button
            onClick={onRemove}
            className="absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-full bg-black/40 text-white/80 hover:bg-red-500/90 hover:text-white transition-colors ios-press"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>

        <div className="p-4 space-y-2.5">
          <h3 className="text-[14px] font-semibold leading-snug text-card-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>
          <p className="text-[12px] text-muted-foreground">
            by {course.instructor.name}
          </p>
          <div className="flex items-center justify-between">
            <StarRating rating={course.rating} />
            <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400">
              {formatPrice(course.price)}
            </span>
          </div>
          {item.isEnrolled ? (
            <Badge className="w-full justify-center bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0 text-[12px] py-1">
              <CheckCircle2 className="size-3 mr-1" />
              Enrolled
            </Badge>
          ) : (
            <Button
              size="sm"
              onClick={onEnroll}
              className="w-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white ios-press h-8 text-[12px]"
            >
              Enroll Now
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Enhanced Empty State ─────────────────────────────────────────────────────

function EnhancedEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ElementType
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-card p-12 text-center ios-shadow-sm"
    >
      {/* Decorative background */}
      <div className="relative">
        <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 blur-xl" />
        <div className="relative flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40">
          <Icon className="size-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        {/* Floating decorative dots */}
        <motion.div
          animate={{ y: [-4, 4, -4] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-1 -right-1 size-3 rounded-full bg-teal-400"
        />
        <motion.div
          animate={{ y: [4, -4, 4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          className="absolute -bottom-2 -left-2 size-2.5 rounded-full bg-emerald-400"
        />
      </div>
      <div className="space-y-2">
        <h3 className="text-[20px] font-bold text-card-foreground">{title}</h3>
        <p className="text-[15px] text-muted-foreground max-w-sm">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 px-6 py-2.5 text-[14px] font-semibold text-white ios-press shadow-lg shadow-emerald-500/20"
        >
          {actionLabel}
          <ArrowRight className="ml-2 size-4" />
        </Button>
      )}
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MyLearningView() {
  const { currentUser, setSelectedCourse, setCurrentView, setEnrollments } = useAppStore()

  // State
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [sortBy, setSortBy] = useState<SortType>('last_accessed')
  const [enrollments, setLocalEnrollments] = useState<LearningEnrollment[]>([])
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [counts, setCounts] = useState({ all: 0, inProgress: 0, completed: 0, archived: 0, wishlist: 0 })
  const [loading, setLoading] = useState(true)
  const [wishlistLoading, setWishlistLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // New state for enhancements
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  // Debounce search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Review dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewEnrollment, setReviewEnrollment] = useState<LearningEnrollment | null>(null)

  // Fetch enrollments
  const fetchEnrollments = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    setError(null)
    try {
      const statusParam = activeTab === 'all' ? '' : activeTab === 'in-progress' ? 'active' : activeTab === 'not-started' ? '' : activeTab
      const params = new URLSearchParams()
      params.set('userId', currentUser.id)
      if (statusParam && activeTab !== 'wishlist' && activeTab !== 'not-started') params.set('status', statusParam)
      params.set('sort', sortBy)

      const res = await fetch(`/api/student/learning?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch enrollments')
      const data = await res.json()
      let fetchedEnrollments = data.enrollments || []

      // Client-side filter for "not-started" tab
      if (activeTab === 'not-started') {
        fetchedEnrollments = fetchedEnrollments.filter((e: LearningEnrollment) => e.progressPercentage === 0 && e.status === 'active')
      }

      setLocalEnrollments(fetchedEnrollments)
      if (data.counts) {
        setCounts(data.counts)
      }
    } catch {
      setError('Failed to load your courses. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [currentUser, activeTab, sortBy])

  // Fetch wishlist
  const fetchWishlist = useCallback(async () => {
    if (!currentUser) return
    setWishlistLoading(true)
    try {
      const res = await fetch(`/api/student/wishlist?userId=${currentUser.id}`)
      if (!res.ok) throw new Error('Failed to fetch wishlist')
      const data = await res.json()
      setWishlist(data.wishlist || [])
    } catch {
      // Wishlist errors are non-critical
    } finally {
      setWishlistLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    fetchEnrollments()
  }, [fetchEnrollments])

  useEffect(() => {
    fetchWishlist()
  }, [fetchWishlist])

  // Handlers
  const handleContinue = (enrollment: LearningEnrollment) => {
    setSelectedCourse(enrollment.course as unknown as Course)
    setCurrentView('course-player')
  }

  const handleCourseOverview = (enrollment: LearningEnrollment) => {
    setSelectedCourse(enrollment.course as unknown as Course)
    setCurrentView('course-detail')
  }

  const handleArchive = async (enrollmentId: string) => {
    try {
      const res = await fetch('/api/student/learning', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId, action: 'archive' }),
      })
      if (!res.ok) throw new Error('Failed to archive')
      toast.success('Course archived')
      fetchEnrollments()
    } catch {
      toast.error('Failed to archive course')
    }
  }

  const handleRestore = async (enrollmentId: string) => {
    try {
      const res = await fetch('/api/student/learning', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId, action: 'restore' }),
      })
      if (!res.ok) throw new Error('Failed to restore')
      toast.success('Course restored')
      fetchEnrollments()
    } catch {
      toast.error('Failed to restore course')
    }
  }

  const handleReview = (enrollment: LearningEnrollment) => {
    setReviewEnrollment(enrollment)
    setReviewDialogOpen(true)
  }

  const handleRemoveWishlist = async (courseId: string) => {
    if (!currentUser) return
    try {
      const res = await fetch('/api/student/wishlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, courseId }),
      })
      if (!res.ok) throw new Error('Failed to remove')
      toast.success('Removed from wishlist')
      fetchWishlist()
    } catch {
      toast.error('Failed to remove from wishlist')
    }
  }

  const handleEnrollFromWishlist = async (courseId: string) => {
    if (!currentUser) return
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, courseId }),
      })
      if (!res.ok) throw new Error('Failed to enroll')
      toast.success('Enrolled successfully!')
      fetchWishlist()
      fetchEnrollments()
    } catch {
      toast.error('Failed to enroll. Please try again.')
    }
  }

  const handleReviewSubmitted = () => {
    fetchEnrollments()
  }

  // ─── Computed values ──────────────────────────────────────────────────────

  // Filter enrollments by search query and category
  const filteredEnrollments = useMemo(() => {
    return enrollments.filter(e => {
      const matchesSearch = !debouncedSearch || e.course.title.toLowerCase().includes(debouncedSearch.toLowerCase())
      const matchesCategory = !selectedCategory || e.course.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [enrollments, debouncedSearch, selectedCategory])

  // Extract unique categories from enrollments
  const categories = useMemo(() => {
    return [...new Set(enrollments.map(e => e.course.category))].sort()
  }, [enrollments])

  // Find all in-progress courses for the carousel hero
  const continueLearningCourses = useMemo(() => {
    return enrollments
      .filter(e => e.status === 'active' && e.progressPercentage > 0 && e.nextLesson)
      .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())
  }, [enrollments])

  // Computed stats
  const totalCourses = enrollments.length
  const completedCount = enrollments.filter(e => e.status === 'completed' || e.progressPercentage >= 100).length
  const inProgressCount = enrollments.filter(e => e.status === 'active' && e.progressPercentage > 0 && e.progressPercentage < 100).length
  const totalEstimatedHours = enrollments.reduce((acc, e) => acc + (e.course.estimatedDuration || 0), 0)
  const streak = currentUser?.streak ?? 0

  // Count for tab badges
  const getTabCount = (tab: TabType): number => {
    switch (tab) {
      case 'all': return counts.all
      case 'in-progress': return counts.inProgress
      case 'completed': return counts.completed
      case 'not-started': return Math.max(0, counts.inProgress - inProgressCount)
      case 'wishlist': return counts.wishlist
      case 'archived': return counts.archived
    }
  }

  const statItems = [
    { label: 'Total Courses', value: totalCourses, icon: Layers, color: 'text-emerald-600 dark:text-emerald-400', bg: 'from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20', border: 'border-l-emerald-500', trend: 'active' as const },
    { label: 'Completed', value: completedCount, icon: Trophy, color: 'text-teal-600 dark:text-teal-400', bg: 'from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20', border: 'border-l-teal-500', trend: 'this week' as const },
    { label: 'In Progress', value: inProgressCount, icon: TrendingUp, color: 'text-amber-600 dark:text-amber-400', bg: 'from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20', border: 'border-l-amber-500', trend: 'active' as const },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          Header Section — with Search, Sort, and View Toggle
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-3">
        {/* Title row */}
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40">
            <BookOpen className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-[24px] font-bold tracking-tight">My Learning</h1>
        </div>

        {/* Search + Sort + View Toggle row */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search your courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-9 rounded-full bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-emerald-500/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 size-4 flex items-center justify-center rounded-full bg-muted-foreground/20 text-muted-foreground hover:bg-muted-foreground/30 transition-colors"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center rounded-full bg-muted/60 p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex items-center justify-center size-8 rounded-full transition-all duration-200',
                  viewMode === 'list'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white ios-shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <List className="size-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'flex items-center justify-center size-8 rounded-full transition-all duration-200',
                  viewMode === 'grid'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white ios-shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <LayoutGrid className="size-4" />
              </button>
            </div>

            {/* Sort dropdown */}
            <Select
              value={sortBy}
              onValueChange={(val) => setSortBy(val as SortType)}
            >
              <SelectTrigger size="sm" className="w-[180px] rounded-full">
                <ChevronDown className="size-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_accessed">Recent</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="enrolled_date">Enrolled date</SelectItem>
                <SelectItem value="title">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          a) SUMMARY STATS BAR — Total, completed, in progress, streak (compact)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {statItems.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.05 }}
            className={cn(
              'rounded-lg bg-gradient-to-br px-3 py-2.5 border-l-[3px] ios-shadow-sm',
              stat.bg,
              stat.border
            )}
          >
            <div className="flex items-center gap-2">
              <div className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-lg',
                stat.color,
                'bg-white/60 dark:bg-white/10'
              )}>
                <stat.icon className="size-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide truncate">{stat.label}</p>
                <p className={cn('text-[18px] font-extrabold leading-tight', stat.color)}>
                  <CountUp target={stat.value} />
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Learning Streak Card (compact) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 + 3 * 0.05 }}
          className={cn(
            'rounded-lg bg-gradient-to-br px-3 py-2.5 border-l-[3px] ios-shadow-sm',
            'from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20',
            'border-l-orange-500'
          )}
        >
          <div className="flex items-center gap-2">
            <div className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-lg text-orange-600 dark:text-orange-400 bg-white/60 dark:bg-white/10'
            )}>
              <Flame className="size-3.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide truncate">Streak</p>
              <div className="flex items-center gap-1 leading-tight">
                <p className="text-[18px] font-extrabold text-orange-600 dark:text-orange-400">
                  <CountUp target={streak} />
                </p>
                {streak > 0 && (
                  <span className="text-[12px]" role="img" aria-label="fire">
                    🔥
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          Continue Learning Carousel Section
          ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {continueLearningCourses.length > 0 && !loading && (
          <ContinueLearningCarousel
            enrollments={continueLearningCourses}
            onContinue={handleContinue}
          />
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════════════
          b) FILTER TABS — with count badges and active styling
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-1">
        {tabs.map((tab) => {
          const TabIcon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key)
                setSelectedCategory(null)
              }}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-all duration-200 ios-press flex items-center gap-1.5',
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white ios-shadow-sm shadow-emerald-500/10'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted/80'
              )}
            >
              {TabIcon && <TabIcon className="size-3.5" />}
              {tab.label}
              <span
                className={cn(
                  'inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold min-w-[20px]',
                  activeTab === tab.key
                    ? 'bg-white/20 text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {getTabCount(tab.key)}
              </span>
            </button>
          )
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          Category Filter Chips
          ═══════════════════════════════════════════════════════════════════════ */}
      {categories.length > 1 && activeTab !== 'wishlist' && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex gap-2 overflow-x-auto scrollbar-thin pb-1"
        >
          {/* "All" chip */}
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              'shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all duration-200 ios-press flex items-center gap-1.5 border',
              !selectedCategory
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-transparent ios-shadow-sm'
                : 'bg-muted/40 text-muted-foreground border-transparent hover:bg-muted/60'
            )}
          >
            <Layers className="size-3" />
            All
          </button>

          {/* Category chips */}
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all duration-200 ios-press flex items-center gap-1.5 border',
                selectedCategory === category
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-transparent ios-shadow-sm'
                  : 'bg-muted/40 text-muted-foreground border-transparent hover:bg-muted/60'
              )}
            >
              <span className={cn(
                'size-2 rounded-full',
                selectedCategory === category
                  ? 'bg-white/80'
                  : categoryDotColors[category] || 'bg-emerald-500'
              )} />
              {category}
            </button>
          ))}
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          Content Area
          ═══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {activeTab === 'wishlist' ? (
          <motion.div
            key="wishlist"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {wishlistLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <WishlistCardSkeleton key={i} />
                ))}
              </div>
            ) : wishlist.length === 0 ? (
              <EnhancedEmptyState
                icon={Heart}
                title="Your wishlist is empty"
                description="Save courses you're interested in to easily find them later."
                actionLabel="Explore Courses"
                onAction={() => setCurrentView('courses')}
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {wishlist.map((item, index) => (
                    <WishlistCard
                      key={item.id}
                      item={item}
                      index={index}
                      onRemove={() => handleRemoveWishlist(item.courseId)}
                      onEnroll={() => handleEnrollFromWishlist(item.courseId)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {!wishlistLoading && wishlist.length > 0 && (
              <p className="mt-4 text-center text-[13px] text-muted-foreground">
                {wishlist.length} course{wishlist.length !== 1 ? 's' : ''} in wishlist
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key={activeTab + selectedCategory + debouncedSearch}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <EnrollmentCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-card p-12 text-center ios-shadow-sm"
              >
                <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
                  <AlertCircle className="size-8 text-destructive" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-[17px] font-semibold text-card-foreground">Something went wrong</h3>
                  <p className="text-[15px] text-muted-foreground">{error}</p>
                </div>
                <button
                  onClick={fetchEnrollments}
                  className="rounded-full bg-primary px-5 py-2 text-[13px] font-medium text-primary-foreground ios-press"
                >
                  Try Again
                </button>
              </motion.div>
            ) : filteredEnrollments.length === 0 ? (
              enrollments.length === 0 ? (
                <EnhancedEmptyState
                  icon={activeTab === 'completed' ? Trophy : activeTab === 'archived' ? Package : activeTab === 'not-started' ? BookOpen : SearchX}
                  title={
                    activeTab === 'in-progress'
                      ? 'No courses in progress'
                      : activeTab === 'completed'
                      ? 'No completed courses yet'
                      : activeTab === 'archived'
                      ? 'No archived courses'
                      : activeTab === 'not-started'
                      ? 'All your courses have been started!'
                      : 'Start your learning journey'
                  }
                  description={
                    activeTab === 'in-progress'
                      ? 'Begin a course to see it here. Each course you start will track your progress.'
                      : activeTab === 'completed'
                      ? 'Complete your courses to see them here. Keep going!'
                      : activeTab === 'archived'
                      ? 'Archived courses will appear here when you archive them.'
                      : activeTab === 'not-started'
                      ? 'Every course you\'re enrolled in has been started. Great job!'
                      : 'Enroll in courses to start your learning journey. Explore our catalog and find the perfect course for you.'
                  }
                  actionLabel={activeTab === 'not-started' ? 'Explore More Courses' : 'Explore Courses'}
                  onAction={() => setCurrentView('courses')}
                />
              ) : (
                <EnhancedEmptyState
                  icon={Search}
                  title="No matching courses"
                  description="Try adjusting your search or category filter to find what you're looking for."
                  actionLabel="Clear Filters"
                  onAction={() => {
                    setSearchQuery('')
                    setSelectedCategory(null)
                  }}
                />
              )
            ) : viewMode === 'grid' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <AnimatePresence mode="popLayout">
                  {filteredEnrollments.map((enrollment, index) => (
                    <EnrollmentGridCard
                      key={enrollment.id}
                      enrollment={enrollment}
                      index={index}
                      onContinue={() => handleContinue(enrollment)}
                      onArchive={() => handleArchive(enrollment.id)}
                      onRestore={() => handleRestore(enrollment.id)}
                      onReview={() => handleReview(enrollment)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {filteredEnrollments.map((enrollment, index) => (
                    <EnrollmentCard
                      key={enrollment.id}
                      enrollment={enrollment}
                      index={index}
                      onContinue={() => handleContinue(enrollment)}
                      onArchive={() => handleArchive(enrollment.id)}
                      onRestore={() => handleRestore(enrollment.id)}
                      onReview={() => handleReview(enrollment)}
                      onCourseOverview={() => handleCourseOverview(enrollment)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {!loading && filteredEnrollments.length > 0 && (
              <p className="mt-4 text-center text-[13px] text-muted-foreground">
                {filteredEnrollments.length} course{filteredEnrollments.length !== 1 ? 's' : ''}
                {(debouncedSearch || selectedCategory) && enrollments.length !== filteredEnrollments.length && (
                  <span> (filtered from {enrollments.length})</span>
                )}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Dialog */}
      {reviewEnrollment && currentUser && (
        <ReviewDialog
          open={reviewDialogOpen}
          onClose={() => {
            setReviewDialogOpen(false)
            setReviewEnrollment(null)
          }}
          courseId={reviewEnrollment.courseId}
          enrollmentId={reviewEnrollment.id}
          userId={currentUser.id}
          onSubmitted={handleReviewSubmitted}
        />
      )}
    </motion.div>
  )
}
