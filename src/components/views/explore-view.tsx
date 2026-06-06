'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Star,
  Heart,
  Users,
  Filter,
  X,
  AlertCircle,
  Sparkles,
  TrendingUp,
  Clock,
  ChevronRight,
  SlidersHorizontal,
  BookOpen,
  ArrowRight,
  Check,
  Gift,
  Zap,
  LayoutGrid,
  List,
  Eye,
  Award,
  Flame,
  SearchX,
  RefreshCw,
  Hash,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { toast } from 'sonner'
import { MobileFilterSheet, MobileFilterGroup } from '@/components/mobile-filter-sheet'
import type { Course, CourseLevel } from '@/lib/types'

/* ─── Types ─── */
interface CourseWithExtras extends Course {
  instructor?: {
    id: string
    name: string
    avatar: string | null
  }
  _count?: {
    enrollments: number
    modules: number
    reviews: number
  }
  isWishlisted?: boolean
  isEnrolled?: boolean
}

interface CatalogSection {
  courses: CourseWithExtras[]
  reason: string
}

interface CatalogData {
  recommended: CatalogSection
  trending: CatalogSection
  free: CatalogSection
  newest: CatalogSection
}

interface CategoryInfo {
  name: string
  count: number
  icon: string
}

/* ─── View Mode ─── */
type ViewMode = 'grid' | 'list'

/* ─── Constants ─── */
const categories = ['All', 'Tech', 'Business', 'Design', 'Language', 'Sciences', 'Arts', 'IB', 'AP', 'Cambridge', 'IELTS', 'AWS', 'Programming', 'Web Dev', 'Python']
const levels: Array<{ value: string; label: string }> = [
  { value: 'All', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const priceOptions = [
  { value: 'All', label: 'All Prices' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
  { value: 'under_10', label: 'Under $10' },
  { value: 'under_25', label: 'Under $25' },
]

const sortOptions = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'highest_rated', label: 'Highest Rated' },
  { value: 'price_low', label: 'Price: Low → High' },
  { value: 'price_high', label: 'Price: High → Low' },
]

const popularSearches = [
  'Python',
  'Web Development',
  'IELTS Preparation',
  'AWS Cloud',
  'IB Physics',
  'Machine Learning',
  'O-Level Math',
  'React',
]

const categoryGradients: Record<string, string> = {
  Tech: 'from-cyan-500 to-blue-600',
  Business: 'from-amber-500 to-orange-600',
  Design: 'from-pink-500 to-rose-600',
  Language: 'from-violet-500 to-purple-600',
  Sciences: 'from-emerald-500 to-green-600',
  Arts: 'from-fuchsia-500 to-pink-600',
  IB: 'from-emerald-500 to-teal-600',
  'O-Levels': 'from-teal-500 to-emerald-600',
  'A-Levels': 'from-teal-400 to-emerald-500',
  IELTS: 'from-emerald-600 to-teal-700',
  AWS: 'from-teal-600 to-emerald-700',
  Programming: 'from-cyan-500 to-blue-600',
  'Web Dev': 'from-sky-500 to-indigo-600',
  Python: 'from-yellow-500 to-amber-600',
}

const categoryEmojis: Record<string, string> = {
  Tech: '💻',
  Business: '💼',
  Design: '🎨',
  Language: '🗣️',
  Sciences: '🔬',
  Arts: '🎭',
  IB: '📚',
  'O-Levels': '🏫',
  'A-Levels': '🎓',
  IELTS: '🌍',
  AWS: '☁️',
  Programming: '💻',
  'Web Dev': '🌐',
  Python: '🐍',
}

const levelColors: Record<CourseLevel, string> = {
  beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
}

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

/* ─── Determine course badge ─── */
function getCourseBadge(course: CourseWithExtras): { label: string; className: string } | null {
  const enrollmentCount = course._count?.enrollments ?? course.enrollmentCount ?? 0
  const daysSinceCreated = (Date.now() - new Date(course.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  if (enrollmentCount >= 50 && course.rating >= 4.5) {
    return { label: 'Bestseller', className: 'bg-amber-500 text-white' }
  }
  if (daysSinceCreated <= 14) {
    return { label: 'New', className: 'bg-emerald-500 text-white' }
  }
  return null
}

/* ─── Get instructor initials ─── */
function getInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return '??'
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??'
}

/* ─── Skeletons ─── */
function CourseCardSkeleton({ viewMode = 'grid' }: { viewMode?: ViewMode }) {
  if (viewMode === 'list') {
    return (
      <div className="flex gap-4 rounded-2xl ios-shadow-sm bg-card overflow-hidden p-4">
        <Skeleton className="h-24 w-40 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className="rounded-2xl ios-shadow-sm bg-card overflow-hidden">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </div>
  )
}

function SectionSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

/* ─── Star Rating ─── */
function StarRating({ rating, showNumeric = true }: { rating: number; showNumeric?: boolean }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'size-3.5',
            star <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-muted text-muted-foreground/30'
          )}
        />
      ))}
      {showNumeric && (
        <span className="ml-1 text-[12px] font-semibold text-foreground">
          {(rating ?? 0).toFixed(1)}
        </span>
      )}
    </div>
  )
}

/* ─── Format Price ─── */
function formatPrice(price: number): string {
  if (price === 0) return 'Free'
  return `$${(price ?? 0).toLocaleString()}`
}

/* ─── Format Duration ─── */
function formatDuration(hours: number): string {
  if (hours === 0) return ''
  if (hours < 1) return `${Math.round(hours * 60)}min`
  return `${hours}h`
}

/* ─── Course Card (Grid) ─── */
function CourseCardGrid({
  course,
  index,
  onEnroll,
  onWishlist,
  onCourseClick,
}: {
  course: CourseWithExtras
  index: number
  onEnroll: (courseId: string) => void
  onWishlist: (courseId: string, isWishlisted: boolean) => void
  onCourseClick: (course: CourseWithExtras) => void
}) {
  const { currentUser, enrollments } = useAppStore()
  const gradient = categoryGradients[course.category] || 'from-emerald-500 to-teal-600'
  const emoji = categoryEmojis[course.category] || '📖'
  const isEnrolled = course.isEnrolled || enrollments.some(e => e.courseId === course.id)
  const enrollmentCount = course._count?.enrollments ?? course.enrollmentCount ?? 0
  const badge = getCourseBadge(course)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ ...springTransition, delay: index * 0.04 }}
      className="group"
    >
      <motion.div
        whileHover={{ y: -6, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.15)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="cursor-pointer rounded-2xl overflow-hidden ios-shadow-sm bg-card transition-colors duration-300"
        onClick={() => onCourseClick(course)}
      >
        {/* Thumbnail */}
        <div className="relative h-44 overflow-hidden">
          {course.thumbnail ? (
            <div
              className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{ backgroundImage: `url(${course.thumbnail})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          ) : (
            <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br relative', gradient)}>
              <span className="text-5xl opacity-40 select-none">{emoji}</span>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              {/* Decorative shapes */}
              <div className="absolute top-4 right-4 size-20 rounded-full bg-white/10 blur-xl" />
              <div className="absolute bottom-8 left-4 size-16 rounded-full bg-white/10 blur-lg" />
            </div>
          )}

          {/* Category badge */}
          <span className="absolute left-3 top-3 rounded-full bg-white/90 dark:bg-black/70 px-2.5 py-0.5 text-[11px] font-semibold text-foreground backdrop-blur-sm flex items-center gap-1">
            <span className="text-[10px]">{emoji}</span>
            {course.category}
          </span>

          {/* Level badge */}
          <span className={cn('absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize', levelColors[course.level as CourseLevel] || 'bg-muted text-muted-foreground')}>
            {course.level}
          </span>

          {/* Bestseller / New badge */}
          {badge && (
            <span className={cn('absolute left-3 bottom-3 rounded-full px-2.5 py-0.5 text-[11px] font-bold flex items-center gap-1', badge.className)}>
              {badge.label === 'Bestseller' && <Flame className="size-3" />}
              {badge.label === 'New' && <Zap className="size-3" />}
              {badge.label}
            </span>
          )}

          {/* Price badge */}
          <span className={cn(
            'absolute right-3 bottom-3 rounded-full px-3 py-0.5 text-[12px] font-bold backdrop-blur-sm',
            course.price === 0
              ? 'bg-emerald-500/90 text-white'
              : 'bg-white/90 dark:bg-black/70 text-foreground'
          )}>
            {formatPrice(course.price)}
          </span>

          {/* Wishlist button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onWishlist(course.id, course.isWishlisted || false)
            }}
            className={cn(
              'absolute top-3 left-1/2 -translate-x-1/2 flex size-8 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100 ios-press',
              course.isWishlisted
                ? 'bg-rose-500/90 text-white'
                : 'bg-white/90 dark:bg-black/70 text-foreground'
            )}
          >
            <Heart className={cn('size-4', course.isWishlisted && 'fill-current')} />
          </button>

          {/* Hover overlay with "View Course" */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileHover={{ opacity: 1, scale: 1 }}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 dark:bg-black/80 px-4 py-2 text-[13px] font-semibold text-foreground backdrop-blur-sm shadow-lg">
                <Eye className="size-4" />
                View Course
              </span>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2.5">
          {/* Title */}
          <h3 className="text-[15px] font-semibold leading-snug text-card-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>

          {/* Instructor with avatar */}
          {course.instructor && (
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-[10px] font-bold text-white shrink-0">
                {course.instructor.avatar ? (
                  <img src={course.instructor.avatar} alt="" className="size-6 rounded-full object-cover" />
                ) : (
                  getInitials(course.instructor.name)
                )}
              </div>
              <p className="text-[12px] text-muted-foreground truncate">
                {course.instructor.name}
              </p>
            </div>
          )}

          {/* Rating & Enrollment */}
          <div className="flex items-center justify-between">
            <StarRating rating={course.rating} />
            <div className="flex items-center gap-1 text-[12px] text-muted-foreground">
              <Users className="size-3.5" />
              <span>{enrollmentCount >= 1000 ? `${(enrollmentCount / 1000).toFixed(1)}k` : enrollmentCount}</span>
            </div>
          </div>

          {/* Duration */}
          {course.estimatedDuration > 0 && (
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <Clock className="size-3" />
              <span>{formatDuration(course.estimatedDuration)}</span>
              {course.certificateEnabled && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                    <Award className="size-3" />
                    Certificate
                  </span>
                </>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-1">
            {isEnrolled ? (
              <div className="flex items-center justify-center gap-1.5 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[13px] font-medium">
                <Check className="size-4" />
                Enrolled
              </div>
            ) : (
              <Button
                className="w-full h-9 rounded-xl text-[13px] font-semibold"
                onClick={(e) => {
                  e.stopPropagation()
                  onEnroll(course.id)
                }}
              >
                {course.price === 0 ? (
                  <><Gift className="size-3.5 mr-1" /> Enroll Free</>
                ) : (
                  <>Enroll — {formatPrice(course.price)}</>
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Course Card (List) ─── */
function CourseCardList({
  course,
  index,
  onEnroll,
  onWishlist,
  onCourseClick,
}: {
  course: CourseWithExtras
  index: number
  onEnroll: (courseId: string) => void
  onWishlist: (courseId: string, isWishlisted: boolean) => void
  onCourseClick: (course: CourseWithExtras) => void
}) {
  const { currentUser, enrollments } = useAppStore()
  const gradient = categoryGradients[course.category] || 'from-emerald-500 to-teal-600'
  const emoji = categoryEmojis[course.category] || '📖'
  const isEnrolled = course.isEnrolled || enrollments.some(e => e.courseId === course.id)
  const enrollmentCount = course._count?.enrollments ?? course.enrollmentCount ?? 0
  const badge = getCourseBadge(course)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ ...springTransition, delay: index * 0.03 }}
      className="group"
    >
      <motion.div
        whileHover={{ y: -2, boxShadow: '0 12px 30px -8px rgba(0,0,0,0.12)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="cursor-pointer flex flex-col sm:flex-row gap-4 rounded-2xl overflow-hidden ios-shadow-sm bg-card p-4 transition-colors duration-300"
        onClick={() => onCourseClick(course)}
      >
        {/* Thumbnail */}
        <div className="relative h-32 sm:h-24 sm:w-40 rounded-xl overflow-hidden shrink-0">
          {course.thumbnail ? (
            <div
              className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{ backgroundImage: `url(${course.thumbnail})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
          ) : (
            <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br', gradient)}>
              <span className="text-3xl opacity-40 select-none">{emoji}</span>
            </div>
          )}
          {/* Category badge */}
          <span className="absolute left-2 top-2 rounded-full bg-white/90 dark:bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur-sm">
            {course.category}
          </span>
          {/* Badge */}
          {badge && (
            <span className={cn('absolute left-2 bottom-2 rounded-full px-2 py-0.5 text-[10px] font-bold', badge.className)}>
              {badge.label}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[15px] font-semibold leading-snug text-card-foreground line-clamp-2 group-hover:text-primary transition-colors">
              {course.title}
            </h3>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onWishlist(course.id, course.isWishlisted || false)
              }}
              className={cn(
                'shrink-0 flex size-8 items-center justify-center rounded-full transition-all duration-200 ios-press',
                course.isWishlisted
                  ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-500'
                  : 'text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30'
              )}
            >
              <Heart className={cn('size-4', course.isWishlisted && 'fill-current')} />
            </button>
          </div>

          {/* Instructor */}
          {course.instructor && (
            <div className="flex items-center gap-2">
              <div className="flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-[9px] font-bold text-white shrink-0">
                {course.instructor.avatar ? (
                  <img src={course.instructor.avatar} alt="" className="size-5 rounded-full object-cover" />
                ) : (
                  getInitials(course.instructor.name)
                )}
              </div>
              <p className="text-[12px] text-muted-foreground truncate">{course.instructor.name}</p>
            </div>
          )}

          {/* Meta row */}
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <StarRating rating={course.rating} />
            </div>
            <div className="flex items-center gap-1">
              <Users className="size-3.5" />
              <span>{enrollmentCount >= 1000 ? `${(enrollmentCount / 1000).toFixed(1)}k` : enrollmentCount} students</span>
            </div>
            {course.estimatedDuration > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="size-3" />
                <span>{formatDuration(course.estimatedDuration)}</span>
              </div>
            )}
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize', levelColors[course.level as CourseLevel] || 'bg-muted text-muted-foreground')}>
              {course.level}
            </span>
            {course.certificateEnabled && (
              <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                <Award className="size-3" />
                Certificate
              </span>
            )}
          </div>

          {/* Price & Action */}
          <div className="flex items-center justify-between pt-1">
            <span className={cn(
              'text-[14px] font-bold',
              course.price === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
            )}>
              {formatPrice(course.price)}
            </span>
            {isEnrolled ? (
              <span className="flex items-center gap-1 text-[12px] font-medium text-emerald-600 dark:text-emerald-400">
                <Check className="size-3.5" /> Enrolled
              </span>
            ) : (
              <Button
                size="sm"
                className="h-8 rounded-lg text-[12px] font-semibold"
                onClick={(e) => {
                  e.stopPropagation()
                  onEnroll(course.id)
                }}
              >
                {course.price === 0 ? 'Enroll Free' : 'Enroll Now'}
                <ArrowRight className="size-3.5 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Unified Course Card ─── */
function CourseCard({
  course,
  index,
  onEnroll,
  onWishlist,
  onCourseClick,
  viewMode,
}: {
  course: CourseWithExtras
  index: number
  onEnroll: (courseId: string) => void
  onWishlist: (courseId: string, isWishlisted: boolean) => void
  onCourseClick: (course: CourseWithExtras) => void
  viewMode: ViewMode
}) {
  if (viewMode === 'list') {
    return (
      <CourseCardList
        course={course}
        index={index}
        onEnroll={onEnroll}
        onWishlist={onWishlist}
        onCourseClick={onCourseClick}
      />
    )
  }
  return (
    <CourseCardGrid
      course={course}
      index={index}
      onEnroll={onEnroll}
      onWishlist={onWishlist}
      onCourseClick={onCourseClick}
    />
  )
}

/* ─── Section Row ─── */
function SectionRow({
  title,
  subtitle,
  courses,
  onEnroll,
  onWishlist,
  onCourseClick,
  onSeeAll,
  icon,
}: {
  title: string
  subtitle?: string
  courses: CourseWithExtras[]
  onEnroll: (courseId: string) => void
  onWishlist: (courseId: string, isWishlisted: boolean) => void
  onCourseClick: (course: CourseWithExtras) => void
  onSeeAll?: () => void
  icon?: React.ReactNode
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (courses.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <h2 className="text-[18px] font-bold text-foreground">{title}</h2>
            {subtitle && (
              <p className="text-[12px] text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="flex items-center gap-1 text-[13px] font-medium text-primary hover:text-primary/80 transition-colors ios-press"
          >
            See all
            <ChevronRight className="size-4" />
          </button>
        )}
      </div>

      {/* Horizontal scroll on mobile, grid on desktop */}
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-thin pb-2 md:pb-0 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:overflow-visible">
        {courses.map((course, index) => (
          <div key={course.id} className="min-w-[260px] md:min-w-0">
            <CourseCardGrid
              course={course}
              index={index}
              onEnroll={onEnroll}
              onWishlist={onWishlist}
              onCourseClick={onCourseClick}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Empty State Component ─── */
function EmptyState({ onBrowseAll, onClearFilters }: { onBrowseAll: () => void; onClearFilters: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-6 rounded-3xl bg-gradient-to-br from-muted/30 via-muted/10 to-muted/30 p-12 text-center border border-dashed border-muted-foreground/20"
    >
      {/* Illustration */}
      <div className="relative">
        <div className="flex size-28 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40">
          <SearchX className="size-14 text-emerald-500/70 dark:text-emerald-400/70" />
        </div>
        {/* Decorative floating dots */}
        <div className="absolute -top-2 -right-2 size-4 rounded-full bg-teal-400/40 animate-pulse" />
        <div className="absolute -bottom-1 -left-3 size-3 rounded-full bg-emerald-400/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-0 -left-5 size-2 rounded-full bg-cyan-400/40 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="space-y-2 max-w-sm">
        <h3 className="text-[20px] font-bold text-foreground">No courses found</h3>
        <p className="text-[15px] text-muted-foreground">
          We couldn&apos;t find any courses matching your current filters. Try adjusting your search or browse our full catalog.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onClearFilters}
          variant="outline"
          className="rounded-full gap-2"
        >
          <RefreshCw className="size-4" />
          Try Different Filters
        </Button>
        <Button
          onClick={onBrowseAll}
          className="rounded-full gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20"
        >
          <BookOpen className="size-4" />
          Browse All Courses
        </Button>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   EXPLORE VIEW — Main Component
   ═══════════════════════════════════════════════════════════ */
export function ExploreView() {
  const { currentUser, setSelectedCourse, setCurrentView, enrollments, setEnrollments } = useAppStore()

  // Catalog section data
  const [catalog, setCatalog] = useState<CatalogData | null>(null)
  const [catalogLoading, setCatalogLoading] = useState(true)

  // Search/filter results
  const [searchResults, setSearchResults] = useState<CourseWithExtras[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [totalResults, setTotalResults] = useState(0)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedLevel, setSelectedLevel] = useState('All')
  const [selectedPrice, setSelectedPrice] = useState('All')
  const [selectedSort, setSelectedSort] = useState('relevance')

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Search focus state
  const [searchFocused, setSearchFocused] = useState(false)

  // Category data from API
  const [categoryData, setCategoryData] = useState<CategoryInfo[]>([])

  // Track if user has active filters
  const hasActiveFilters = searchQuery.trim() !== '' ||
    selectedCategory !== 'All' ||
    selectedLevel !== 'All' ||
    selectedPrice !== 'All'

  // Fetch catalog sections on mount
  useEffect(() => {
    const fetchCatalog = async () => {
      setCatalogLoading(true)
      try {
        const params = new URLSearchParams()
        if (currentUser?.id) params.set('userId', currentUser.id)
        params.set('limit', '8')

        const res = await fetch(`/api/courses/catalog?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setCatalog(data)
        }
      } catch (error) {
        console.error('Error fetching catalog:', error)
      } finally {
        setCatalogLoading(false)
      }
    }

    fetchCatalog()
  }, [currentUser?.id])

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/courses/categories')
        if (res.ok) {
          const data = await res.json()
          setCategoryData(data.categories || [])
        }
      } catch {
        // ignore
      }
    }
    fetchCategories()
  }, [])

  // Search/filter courses
  const fetchFilteredCourses = useCallback(async () => {
    if (!hasActiveFilters) {
      setSearchResults([])
      setTotalResults(0)
      return
    }

    setSearchLoading(true)
    setSearchError(null)

    try {
      const params = new URLSearchParams()
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      if (selectedCategory !== 'All') params.set('category', selectedCategory)
      if (selectedLevel !== 'All') params.set('level', selectedLevel)
      if (selectedPrice !== 'All') params.set('price', selectedPrice)
      if (selectedSort !== 'relevance') params.set('sort', selectedSort)
      if (currentUser?.id) params.set('userId', currentUser.id)
      params.set('limit', '40')

      const res = await fetch(`/api/courses?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch courses')
      const data = await res.json()
      setSearchResults(data.courses || [])
      setTotalResults(data.pagination?.total || 0)
    } catch {
      setSearchError('Failed to load courses. Please try again.')
    } finally {
      setSearchLoading(false)
    }
  }, [searchQuery, selectedCategory, selectedLevel, selectedPrice, selectedSort, currentUser?.id, hasActiveFilters])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFilteredCourses()
    }, searchQuery ? 400 : 0)
    return () => clearTimeout(timer)
  }, [fetchFilteredCourses, searchQuery])

  // Enroll handler
  const handleEnroll = async (courseId: string) => {
    if (!currentUser) {
      toast.error('Please log in to enroll')
      return
    }
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, courseId }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success('Enrolled successfully! 🎉')
        // Update local enrollment cache
        if (data.enrollment) {
          setEnrollments([...enrollments, data.enrollment])
        }
        // Refresh catalog
        fetchFilteredCourses()
      } else {
        toast.error('Failed to enroll')
      }
    } catch {
      toast.error('Failed to enroll')
    }
  }

  // Wishlist handler
  const handleWishlist = async (courseId: string, isWishlisted: boolean) => {
    if (!currentUser) {
      toast.error('Please log in to add to wishlist')
      return
    }
    try {
      if (isWishlisted) {
        const res = await fetch('/api/student/wishlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id, courseId }),
        })
        if (!res.ok) throw new Error('Failed to remove from wishlist')
        toast.success('Removed from wishlist')
      } else {
        const res = await fetch('/api/student/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id, courseId }),
        })
        if (!res.ok) throw new Error('Failed to add to wishlist')
        toast.success('Added to wishlist ❤️')
      }
      // Refresh data
      fetchFilteredCourses()
    } catch {
      toast.error('Failed to update wishlist')
    }
  }

  // Course click handler
  const handleCourseClick = (course: CourseWithExtras) => {
    setSelectedCourse(course as unknown as Course)
    setCurrentView('course-detail')
  }

  // "See all" handler — sets a category filter
  const handleSeeAll = (section: string) => {
    if (section === 'free') {
      setSelectedPrice('free')
    } else if (section === 'trending') {
      setSelectedSort('popular')
    } else if (section === 'newest') {
      setSelectedSort('newest')
    } else if (section === 'recommended') {
      // Don't set any specific filter, just show all
    }
  }

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedCategory('All')
    setSelectedLevel('All')
    setSelectedPrice('All')
    setSelectedSort('relevance')
  }

  // Count active filters
  const activeFilterCount = [
    selectedCategory !== 'All',
    selectedLevel !== 'All',
    selectedPrice !== 'All',
  ].filter(Boolean).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* ═══ Hero Banner with Enhanced Search ═══ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-600 p-4 md:p-6 lg:p-8 ios-shadow-lg">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        {/* Decorative floating shapes */}
        <div className="absolute top-6 right-8 size-32 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute bottom-4 left-10 size-24 rounded-full bg-white/10 blur-xl" />

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springTransition, delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-1 md:mb-2">
              <Sparkles className="size-4 md:size-5 text-cyan-200" />
              <span className="text-[11px] md:text-[13px] font-medium text-cyan-200">Personalized for you</span>
            </div>
            <h1 className="text-[22px] md:text-[28px] font-bold text-white">
              Explore Courses
            </h1>
            <p className="mt-0.5 md:mt-1 max-w-lg text-[13px] md:text-[15px] text-cyan-100">
              Discover courses across Tech, Business, Design, Languages & more — tailored to your learning journey.
            </p>
          </motion.div>

          {/* Enhanced Search Bar */}
          <div className="mt-3 md:mt-5 max-w-2xl">
            <div className={cn(
              'relative rounded-2xl transition-all duration-300',
              searchFocused
                ? 'ring-2 ring-white/50 shadow-xl shadow-black/10'
                : 'ring-0'
            )}>
              <div className={cn(
                'absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-300 via-emerald-300 to-teal-300 transition-opacity duration-300 -z-10 blur-sm',
                searchFocused ? 'opacity-60' : 'opacity-0'
              )} />
              <div className="relative flex items-center bg-white/20 backdrop-blur-sm rounded-2xl overflow-hidden">
                <motion.div
                  animate={{ scale: searchFocused ? 1.1 : 1, rotate: searchFocused ? 10 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className="pl-4"
                >
                  <Search className="size-4 md:size-5 text-white/70" />
                </motion.div>
                <Input
                  type="search"
                  placeholder="Search for anything — Python, Web Dev, Design..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="h-9 md:h-13 rounded-none border-0 bg-transparent pl-3 pr-4 text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:ring-offset-0 text-[13px] md:text-[15px]"
                />
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="pr-3 text-white/60 hover:text-white ios-press"
                  >
                    <X className="size-4" />
                  </button>
                ) : (
                  <div className="pr-3">
                    <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-white/20 bg-white/10 px-1.5 text-[10px] font-medium text-white/60">
                      ⌘K
                    </kbd>
                  </div>
                )}
                {/* Filter button with badge */}
                <Sheet>
                  <SheetTrigger asChild>
                    <button className="flex items-center gap-1.5 px-4 py-2.5 border-l border-white/20 hover:bg-white/10 transition-colors">
                      <SlidersHorizontal className="size-4 text-white/70" />
                      {activeFilterCount > 0 && (
                        <span className="flex size-5 items-center justify-center rounded-full bg-white text-teal-700 text-[10px] font-bold">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                  </SheetTrigger>
                  <SheetContent className="w-[340px] sm:w-[400px]">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <SlidersHorizontal className="size-5" />
                        Filters
                        {activeFilterCount > 0 && (
                          <Badge variant="secondary" className="rounded-full">{activeFilterCount} active</Badge>
                        )}
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-6">
                      {/* Level */}
                      <div className="space-y-2">
                        <label className="text-[13px] font-semibold">Level</label>
                        <div className="flex flex-wrap gap-2">
                          {levels.map((lvl) => (
                            <button
                              key={lvl.value}
                              onClick={() => setSelectedLevel(lvl.value)}
                              className={cn(
                                'rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all',
                                selectedLevel === lvl.value
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted/60 text-muted-foreground hover:bg-muted/80'
                              )}
                            >
                              {lvl.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* Price */}
                      <div className="space-y-2">
                        <label className="text-[13px] font-semibold">Price</label>
                        <div className="flex flex-wrap gap-2">
                          {priceOptions.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setSelectedPrice(opt.value)}
                              className={cn(
                                'rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all',
                                selectedPrice === opt.value
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted/60 text-muted-foreground hover:bg-muted/80'
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {hasActiveFilters && (
                        <Button
                          variant="outline"
                          className="w-full rounded-full gap-2"
                          onClick={clearAllFilters}
                        >
                          <X className="size-4" />
                          Clear All Filters
                        </Button>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Popular Searches */}
            <div className="mt-2 md:mt-3 flex items-center gap-1.5 md:gap-2 overflow-x-auto scrollbar-thin pb-0.5">
              <Hash className="size-3 md:size-3.5 text-white/50 shrink-0" />
              <span className="text-[11px] md:text-[12px] text-white/50 shrink-0">Popular:</span>
              {popularSearches.map((term) => (
                <motion.button
                  key={term}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSearchQuery(term)}
                  className="shrink-0 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm px-2.5 md:px-3 py-0.5 md:py-1 text-[11px] md:text-[12px] font-medium text-white/80 transition-colors"
                >
                  {term}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CATEGORY FILTER CHIPS ═══ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 shrink-0">
            <Filter className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 overflow-x-auto scrollbar-thin">
            <div className="flex gap-2 pb-1">
              {categories.map((cat) => {
                const catInfo = categoryData.find(c => c.name === cat)
                const isActive = selectedCategory === cat
                return (
                  <motion.button
                    key={cat}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(selectedCategory === cat ? 'All' : cat)}
                    className={cn(
                      'shrink-0 rounded-full px-3 md:px-4 py-1.5 md:py-2 text-[12px] md:text-[13px] font-medium transition-all duration-200 ios-press flex items-center gap-1 md:gap-1.5 border',
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                        : 'bg-card text-muted-foreground border-border/50 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
                    )}
                  >
                    {cat !== 'All' && catInfo?.icon && <span className="text-[11px] md:text-[12px]">{catInfo.icon}</span>}
                    {cat}
                    {cat !== 'All' && catInfo && (
                      <span className={cn(
                        'rounded-full px-1 md:px-1.5 py-0.5 text-[9px] md:text-[10px] font-bold min-w-[16px] md:min-w-[18px] text-center',
                        isActive
                          ? 'bg-white/25 text-white'
                          : 'bg-muted/60 text-muted-foreground'
                      )}>
                        {catInfo.count}
                      </span>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Advanced Filters Row — Desktop: Single Row */}
        <div className="hidden md:flex items-center gap-2">
          {/* Search input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 rounded-full pl-9 pr-3 text-[13px] border-border/50"
            />
          </div>

          {/* Category filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[140px] h-9 rounded-full text-[13px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat} className="text-[13px]">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Level filter */}
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-[140px] h-9 rounded-full text-[13px]">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {levels.map((lvl) => (
                <SelectItem key={lvl.value} value={lvl.value} className="text-[13px]">
                  {lvl.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Price filter */}
          <Select value={selectedPrice} onValueChange={setSelectedPrice}>
            <SelectTrigger className="w-[140px] h-9 rounded-full text-[13px]">
              <SelectValue placeholder="Price" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {priceOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-[13px]">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={selectedSort} onValueChange={setSelectedSort}>
            <SelectTrigger className="w-[155px] h-9 rounded-full text-[13px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-[13px]">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear all */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-[13px] font-medium text-destructive hover:text-destructive/80 transition-colors ios-press shrink-0"
            >
              <X className="size-3.5" />
              Clear all
            </button>
          )}
        </div>

        {/* Advanced Filters — Mobile (Sheet Drawer) */}
        <MobileFilterSheet
          activeCount={activeFilterCount}
          onClearAll={clearAllFilters}
          title="Filter & Sort"
        >
          <MobileFilterGroup label="Level">
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-full h-10 rounded-xl text-[14px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {levels.map((lvl) => (
                  <SelectItem key={lvl.value} value={lvl.value} className="text-[14px]">
                    {lvl.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </MobileFilterGroup>

          <MobileFilterGroup label="Price">
            <Select value={selectedPrice} onValueChange={setSelectedPrice}>
              <SelectTrigger className="w-full h-10 rounded-xl text-[14px]">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {priceOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-[14px]">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </MobileFilterGroup>

          <MobileFilterGroup label="Sort By">
            <Select value={selectedSort} onValueChange={setSelectedSort}>
              <SelectTrigger className="w-full h-10 rounded-xl text-[14px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-[14px]">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </MobileFilterGroup>
        </MobileFilterSheet>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      {hasActiveFilters ? (
        /* ─── Filtered Search Results ─── */
        <div className="space-y-4">
          {/* Results header with counter, view toggle, and sort */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-bold text-foreground">Search Results</h2>
              {!searchLoading && (
                <span className="text-[13px] text-muted-foreground">
                  Showing {searchResults.length} of {totalResults} course{totalResults !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* View Toggle + Sort (only show when there are results) */}
            <div className="flex items-center gap-3">
              {/* Grid/List Toggle */}
              <div className="flex items-center rounded-full border border-border bg-muted/30 p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'flex items-center justify-center size-8 rounded-full transition-all',
                    viewMode === 'grid'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title="Grid view"
                >
                  <LayoutGrid className="size-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'flex items-center justify-center size-8 rounded-full transition-all',
                    viewMode === 'list'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  title="List view"
                >
                  <List className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {searchLoading ? (
            viewMode === 'list' ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CourseCardSkeleton key={i} viewMode="list" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <CourseCardSkeleton key={i} viewMode="grid" />
                ))}
              </div>
            )
          ) : searchError ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-card p-12 text-center ios-shadow-sm"
            >
              <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
                <AlertCircle className="size-8 text-destructive" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[17px] font-semibold">Something went wrong</h3>
                <p className="text-[15px] text-muted-foreground">{searchError}</p>
              </div>
              <button
                onClick={fetchFilteredCourses}
                className="rounded-full bg-primary px-5 py-2 text-[13px] font-medium text-primary-foreground ios-press"
              >
                Try Again
              </button>
            </motion.div>
          ) : searchResults.length === 0 ? (
            <EmptyState
              onBrowseAll={clearAllFilters}
              onClearFilters={clearAllFilters}
            />
          ) : (
            <>
              {viewMode === 'list' ? (
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {searchResults.map((course, index) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        index={index}
                        onEnroll={handleEnroll}
                        onWishlist={handleWishlist}
                        onCourseClick={handleCourseClick}
                        viewMode="list"
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  <AnimatePresence mode="popLayout">
                    {searchResults.map((course, index) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        index={index}
                        onEnroll={handleEnroll}
                        onWishlist={handleWishlist}
                        onCourseClick={handleCourseClick}
                        viewMode="grid"
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* ─── Catalog Sections ─── */
        <div className="space-y-8">
          {catalogLoading ? (
            <>
              <SectionSkeleton />
              <SectionSkeleton />
              <SectionSkeleton />
            </>
          ) : catalog ? (
            <>
              {/* ✦ Recommended for you */}
              <SectionRow
                title="Recommended for you"
                subtitle={catalog.recommended?.reason || 'Based on your learning history'}
                courses={catalog.recommended?.courses || []}
                onEnroll={handleEnroll}
                onWishlist={handleWishlist}
                onCourseClick={handleCourseClick}
                onSeeAll={() => handleSeeAll('recommended')}
                icon={<Sparkles className="size-5 text-amber-500" />}
              />

              {/* Trending worldwide */}
              <SectionRow
                title="Trending worldwide 🌐"
                subtitle={catalog.trending?.reason || 'Popular right now'}
                courses={catalog.trending?.courses || []}
                onEnroll={handleEnroll}
                onWishlist={handleWishlist}
                onCourseClick={handleCourseClick}
                onSeeAll={() => handleSeeAll('trending')}
                icon={<TrendingUp className="size-5 text-rose-500" />}
              />

              {/* Free courses */}
              <SectionRow
                title="Free courses"
                subtitle="Learn without spending a rupee"
                courses={catalog.free?.courses || []}
                onEnroll={handleEnroll}
                onWishlist={handleWishlist}
                onCourseClick={handleCourseClick}
                onSeeAll={() => handleSeeAll('free')}
                icon={<Gift className="size-5 text-emerald-500" />}
              />

              {/* Newest */}
              <SectionRow
                title="Recently added"
                subtitle="Fresh courses just published"
                courses={catalog.newest?.courses || []}
                onEnroll={handleEnroll}
                onWishlist={handleWishlist}
                onCourseClick={handleCourseClick}
                onSeeAll={() => handleSeeAll('newest')}
                icon={<Zap className="size-5 text-violet-500" />}
              />

              {/* Browse by Category */}
              {categoryData.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-[18px] font-bold text-foreground flex items-center gap-2">
                    <BookOpen className="size-5 text-primary" />
                    Browse by Category
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {categoryData.map((cat, i) => {
                      const gradient = categoryGradients[cat.name] || 'from-emerald-500 to-teal-600'
                      return (
                        <motion.button
                          key={cat.name}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          whileTap={{ scale: 0.97 }}
                          whileHover={{ y: -4, boxShadow: '0 12px 24px -8px rgba(0,0,0,0.12)' }}
                          onClick={() => setSelectedCategory(cat.name)}
                          className="group flex flex-col items-center gap-2 rounded-2xl bg-card p-4 ios-shadow-sm hover:ios-shadow-md transition-all duration-200 ios-press border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800"
                        >
                          <div className={cn(
                            'flex size-12 items-center justify-center rounded-xl bg-gradient-to-br text-2xl shadow-sm',
                            gradient
                          )}>
                            {cat.icon}
                          </div>
                          <div className="text-center">
                            <p className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">
                              {cat.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {cat.count} course{cat.count !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </motion.div>
  )
}
