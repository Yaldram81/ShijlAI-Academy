'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Star,
  Users,
  BookOpen,
  GraduationCap,
  Filter,
  X,
  Loader2,
  AlertCircle,
  Sparkles,
  Clock,
  ArrowRight,
  TrendingUp,
  Zap,
  Flame,
  CheckCircle2,
  Layers,
  Play,
  Crown,
  Gem,
  Code2,
  Languages,
  Cloud,
  Calculator,
  FlaskConical,
  Atom,
  Palette,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import type { Course, CourseLevel } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CourseWithInstructor extends Course {
  instructor?: {
    id: string
    name: string
    avatar: string | null
  }
  _count?: {
    enrollments: number
    modules: number
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const categories = ['All', 'IB', 'AP', 'Cambridge', 'IELTS', 'AWS', 'Programming']

const levels: Array<{ value: string; label: string }> = [
  { value: 'All', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const categoryGradients: Record<string, string> = {
  IB: 'from-emerald-500 to-teal-600',
  Programming: 'from-teal-500 to-emerald-600',
  'O-Levels': 'from-emerald-400 to-teal-500',
  'A-Levels': 'from-teal-400 to-emerald-500',
  IELTS: 'from-emerald-600 to-teal-700',
  AWS: 'from-teal-600 to-emerald-700',
}

const categoryDotColors: Record<string, string> = {
  IB: 'bg-emerald-500',
  Programming: 'bg-teal-500',
  'O-Levels': 'bg-emerald-400',
  'A-Levels': 'bg-teal-400',
  IELTS: 'bg-emerald-600',
  AWS: 'bg-teal-600',
}

const categoryIcons: Record<string, React.ElementType> = {
  IB: Calculator,
  Programming: Code2,
  'O-Levels': FlaskConical,
  'A-Levels': Atom,
  IELTS: Languages,
  AWS: Cloud,
}

const levelColors: Record<CourseLevel, string> = {
  beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
}

const levelDotColors: Record<string, string> = {
  beginner: 'bg-emerald-500',
  intermediate: 'bg-amber-500',
  advanced: 'bg-red-500',
}

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

// ─── Helper Functions ─────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  if (price === 0) return 'Free'
  return `USD ${price.toLocaleString()}`
}

function formatDuration(minutes: number): string {
  if (!minutes) return ''
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ─── Skeleton Components ─────────────────────────────────────────────────────

function CourseCardSkeleton() {
  return (
    <div className="rounded-2xl ios-shadow-sm bg-card overflow-hidden">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
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
        {rating.toFixed(1)}
      </span>
    </div>
  )
}

// ─── Category Showcase ────────────────────────────────────────────────────────

function CategoryShowcase({
  selectedCategory,
  onSelect,
  courseCounts,
}: {
  selectedCategory: string
  onSelect: (cat: string) => void
  courseCounts: Record<string, number>
}) {
  const displayCategories = categories.filter(c => c !== 'All')

  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
      {displayCategories.map((cat, i) => {
        const Icon = categoryIcons[cat] || BookOpen
        const gradient = categoryGradients[cat] || 'from-emerald-500 to-teal-600'
        const isSelected = selectedCategory === cat
        const count = courseCounts[cat] || 0

        return (
          <motion.button
            key={cat}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.04 }}
            onClick={() => onSelect(isSelected ? 'All' : cat)}
            className={cn(
              'relative flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all duration-200 ios-press overflow-hidden',
              isSelected
                ? 'bg-gradient-to-br text-white ios-shadow-md ' + gradient
                : 'bg-card hover:bg-muted/50 ios-shadow-sm border border-border/50'
            )}
          >
            <div className={cn(
              'flex size-8 items-center justify-center rounded-lg',
              isSelected
                ? 'bg-white/20'
                : 'bg-muted/60'
            )}>
              <Icon className={cn('size-4', isSelected ? 'text-white' : 'text-muted-foreground')} />
            </div>
            <span className={cn(
              'text-[11px] font-semibold',
              isSelected ? 'text-white' : 'text-foreground'
            )}>
              {cat}
            </span>
            <span className={cn(
              'text-[9px] font-medium',
              isSelected ? 'text-white/70' : 'text-muted-foreground'
            )}>
              {count} course{count !== 1 ? 's' : ''}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}

// ─── Course Card ──────────────────────────────────────────────────────────────

function CourseCard({
  course,
  index,
  onClick,
  isEnrolledCourse,
  progress,
}: {
  course: CourseWithInstructor
  index: number
  onClick: () => void
  isEnrolledCourse: boolean
  progress: number | null
}) {
  const gradient = categoryGradients[course.category] || 'from-emerald-500 to-teal-600'
  const enrollmentCount = course._count?.enrollments ?? course.enrollmentCount ?? 0
  const isPopular = enrollmentCount >= 5
  const isNew = (() => {
    if (!course.createdAt) return false
    const created = new Date(course.createdAt)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 14
  })()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ ...springTransition, delay: index * 0.04 }}
    >
      <div
        className="group cursor-pointer rounded-2xl overflow-hidden ios-shadow-sm bg-card transition-all duration-300 hover:ios-shadow-lg"
        onClick={onClick}
      >
        {/* Thumbnail */}
        <div className="relative h-40 overflow-hidden">
          {course.thumbnail ? (
            <div
              className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{ backgroundImage: `url(${course.thumbnail})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            </div>
          ) : (
            <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br relative', gradient)}>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
              <GraduationCap className="size-12 text-white/50" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
          )}

          {/* Top badges */}
          <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
            <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur-sm dark:bg-black/70 dark:text-white">
              {course.category}
            </span>
            {isNew && (
              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                New
              </span>
            )}
            {isPopular && !isNew && (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white flex items-center gap-0.5">
                <Flame className="size-2.5" />
                Popular
              </span>
            )}
          </div>

          {/* Level badge - top right */}
          <span
            className={cn(
              'absolute right-2.5 top-2.5 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize',
              levelColors[course.level]
            )}
          >
            {course.level}
          </span>

          {/* Bottom overlay info */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
            {/* Enrolled badge */}
            {isEnrolledCourse && (
              <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 backdrop-blur-sm dark:bg-black/70 dark:text-emerald-400">
                <CheckCircle2 className="size-2.5" />
                Enrolled
              </span>
            )}
            {/* Price */}
            <span className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm ml-auto',
              course.price === 0
                ? 'bg-emerald-500/90 text-white'
                : 'bg-white/90 text-foreground dark:bg-black/70 dark:text-white'
            )}>
              {formatPrice(course.price)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3.5 space-y-2">
          {/* Title */}
          <h3 className="text-[14px] font-semibold leading-snug text-card-foreground line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {course.title}
          </h3>

          {/* Instructor */}
          {course.instructor && (
            <p className="text-[12px] text-muted-foreground">
              by {course.instructor.name}
            </p>
          )}

          {/* Rating & Students & Duration */}
          <div className="flex items-center justify-between">
            <StarRating rating={course.rating} />
            <div className="flex items-center gap-1 text-[12px] text-muted-foreground">
              <Users className="size-3" />
              <span>{enrollmentCount}</span>
            </div>
          </div>

          {/* Duration & Modules */}
          {(course.estimatedDuration || course._count?.modules) && (
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              {course.estimatedDuration > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {formatDuration(course.estimatedDuration)}
                </span>
              )}
              {course._count?.modules && (
                <span className="flex items-center gap-1">
                  <Layers className="size-3" />
                  {course._count.modules} modules
                </span>
              )}
            </div>
          )}

          {/* Progress bar if enrolled */}
          {isEnrolledCourse && progress !== null && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                />
              </div>
            </div>
          )}

          {/* CTA Button */}
          <Button
            size="sm"
            className={cn(
              'w-full rounded-full ios-press h-8 text-[12px] mt-1',
              isEnrolledCourse
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white'
                : 'bg-muted/60 hover:bg-muted/80 text-foreground'
            )}
          >
            {isEnrolledCourse ? (
              <>
                <Play className="size-3 mr-1" />
                Continue Learning
              </>
            ) : (
              <>
                <BookOpen className="size-3 mr-1" />
                View Course
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function CoursesView() {
  const { setSelectedCourse, setCurrentView, currentUser, enrollments } = useAppStore()

  const [courses, setCourses] = useState<CourseWithInstructor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedLevel, setSelectedLevel] = useState('All')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'All') params.set('category', selectedCategory)
      if (selectedLevel !== 'All') params.set('level', selectedLevel)
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())

      const res = await fetch(`/api/courses?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch courses')
      const data = await res.json()
      setCourses(data.courses || [])
    } catch {
      setError('Failed to load courses. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, selectedLevel, debouncedSearch])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const handleCourseClick = (course: CourseWithInstructor) => {
    setSelectedCourse(course as unknown as Course)
    setCurrentView('course-detail')
  }

  const getEnrollmentProgress = (courseId: string) => {
    const enrollment = enrollments.find((e) => e.courseId === courseId)
    return enrollment?.progress ?? null
  }

  const isEnrolled = (courseId: string) => {
    return enrollments.some((e) => e.courseId === courseId)
  }

  // Compute course counts per category
  const courseCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    categories.forEach(cat => {
      if (cat === 'All') return
      counts[cat] = courses.filter(c => c.category === cat).length
    })
    return counts
  }, [courses])

  // Compute stats
  const totalCourses = courses.length
  const freeCourses = courses.filter(c => c.price === 0).length
  const enrolledCount = courses.filter(c => isEnrolled(c.id)).length
  const avgRating = courses.length > 0
    ? (courses.reduce((sum, c) => sum + c.rating, 0) / courses.length).toFixed(1)
    : '0.0'

  const hasActiveFilters = selectedCategory !== 'All' || selectedLevel !== 'All' || debouncedSearch !== ''

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* ═══════════════════════════════════════════════════════════════════════
          Hero Banner
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl ios-shadow-lg">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700" />

        {/* Pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />

        {/* Floating decorative elements */}
        <motion.div
          animate={{ y: [-8, 8, -8], x: [-3, 3, -3] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-6 right-20 size-20 rounded-full bg-white/8 blur-sm"
        />
        <motion.div
          animate={{ y: [5, -5, 5], x: [3, -3, 3] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-8 right-40 size-14 rounded-full bg-white/8 blur-sm"
        />

        <div className="relative z-10 p-4 sm:p-6">
          {/* Top badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 sm:px-3 sm:py-1 backdrop-blur-sm">
                <Sparkles className="size-3 sm:size-3.5 text-emerald-200" />
                <span className="text-[11px] sm:text-[12px] font-medium text-emerald-100">Explore & Learn</span>
              </div>
            </div>
            <h1 className="text-[22px] sm:text-[30px] font-bold text-white leading-tight">
              Explore Courses
            </h1>
            <p className="mt-1 max-w-lg text-[13px] sm:text-[14px] text-emerald-100/80 line-clamp-2 sm:line-clamp-none">
              Discover courses across IB, AP, Cambridge, IELTS, AWS, and Programming to accelerate your learning.
            </p>
          </motion.div>

          {/* Quick Stats Row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 sm:mt-4"
          >
            <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 sm:px-3 sm:py-1 backdrop-blur-sm">
              <BookOpen className="size-3 text-emerald-200" />
              <span className="text-[10px] sm:text-[11px] font-medium text-white/80">{totalCourses} Courses</span>
            </div>
            {freeCourses > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 sm:px-3 sm:py-1 backdrop-blur-sm">
                <Gem className="size-3 text-emerald-200" />
                <span className="text-[10px] sm:text-[11px] font-medium text-white/80">{freeCourses} Free</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 sm:px-3 sm:py-1 backdrop-blur-sm">
              <Star className="size-3 text-amber-300" />
              <span className="text-[10px] sm:text-[11px] font-medium text-white/80">{avgRating} Avg</span>
            </div>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-3 sm:mt-4 max-w-xl"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/50" />
              <Input
                type="search"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 sm:h-10 rounded-xl border-0 bg-white/15 pl-9 pr-8 sm:pl-10 sm:pr-9 text-[13px] sm:text-[14px] text-white placeholder:text-white/40 backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-white/25"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-white/50 hover:text-white ios-press"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          Category Showcase
          ═══════════════════════════════════════════════════════════════════════ */}
      {!debouncedSearch && (
        <CategoryShowcase
          selectedCategory={selectedCategory}
          onSelect={(cat) => {
            setSelectedCategory(cat)
            setSelectedLevel('All')
          }}
          courseCounts={courseCounts}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          Filter Bar — Level pills + Active filter summary
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2">
        {/* Level pills — horizontally scrollable on mobile */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin pb-0.5 flex-1 min-w-0 -mx-3 px-3 sm:mx-0 sm:px-0">
          <div className="flex size-7 items-center justify-center rounded-md bg-muted/60 shrink-0">
            <Filter className="size-3.5 text-muted-foreground" />
          </div>
          {levels.map((lvl) => (
            <button
              key={lvl.value}
              onClick={() => setSelectedLevel(lvl.value)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all duration-200 ios-press flex items-center gap-1.5',
                selectedLevel === lvl.value
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white ios-shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted/80'
              )}
            >
              {lvl.value !== 'All' && (
                <span className={cn(
                  'size-1.5 rounded-full',
                  selectedLevel === lvl.value ? 'bg-white/70' : levelDotColors[lvl.value] || 'bg-muted-foreground'
                )} />
              )}
              {lvl.label}
            </button>
          ))}
        </div>

        {/* Active filter summary + clear */}
        <div className="flex items-center gap-2 shrink-0">
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('All')
                setSelectedLevel('All')
              }}
              className="flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted/80 ios-press transition-colors"
            >
              <X className="size-3" />
              Clear
            </button>
          )}
          {!loading && courses.length > 0 && (
            <span className="text-[11px] text-muted-foreground shrink-0 hidden sm:inline">
              {courses.length} course{courses.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          Course Grid
          ═══════════════════════════════════════════════════════════════════════ */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CourseCardSkeleton key={i} />
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
            onClick={fetchCourses}
            className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-medium text-white ios-press"
          >
            Try Again
          </button>
        </motion.div>
      ) : courses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-card p-12 text-center ios-shadow-sm"
        >
          <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/30">
            <BookOpen className="size-8 text-emerald-500" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-[17px] font-semibold text-card-foreground">
              {hasActiveFilters ? 'No matching courses' : 'No courses available'}
            </h3>
            <p className="text-[14px] text-muted-foreground max-w-sm">
              {hasActiveFilters
                ? 'Try adjusting your filters or search to find what you\'re looking for.'
                : 'Check back soon — new courses are being added regularly!'}
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('All')
                setSelectedLevel('All')
              }}
              className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2 text-[13px] font-medium text-white ios-press"
            >
              Clear All Filters
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {courses.map((course, index) => (
              <CourseCard
                key={course.id}
                course={course}
                index={index}
                onClick={() => handleCourseClick(course)}
                isEnrolledCourse={isEnrolled(course.id)}
                progress={getEnrollmentProgress(course.id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  )
}
