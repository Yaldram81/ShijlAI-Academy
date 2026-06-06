'use client'

import { useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Star,
  Heart,
  Users,
  Clock,
  Award,
  Check,
  Gift,
  ChevronRight,
  ChevronLeft,
  Crown,
  Flame,
  Zap,
  BadgeCheck,
  ArrowRight,
  Sparkles,
  TrendingUp,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Course, CourseLevel } from '@/lib/types'

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const categoryGradients: Record<string, string> = {
  Tech: 'from-cyan-500 to-teal-600',
  Business: 'from-amber-500 to-orange-600',
  Design: 'from-pink-500 to-rose-600',
  Language: 'from-teal-500 to-emerald-600',
  Sciences: 'from-emerald-500 to-green-600',
  Arts: 'from-rose-500 to-pink-600',
  IB: 'from-emerald-500 to-teal-600',
  'O-Levels': 'from-teal-500 to-emerald-600',
  'A-Levels': 'from-emerald-400 to-teal-500',
  IELTS: 'from-emerald-600 to-teal-700',
  AWS: 'from-teal-600 to-emerald-700',
  Programming: 'from-teal-500 to-cyan-600',
  'Web Dev': 'from-teal-400 to-emerald-500',
  Python: 'from-amber-500 to-teal-600',
}

const categoryEmojis: Record<string, string> = {
  Tech: '\u{1F4BB}',
  Business: '\u{1F4BC}',
  Design: '\u{1F3A8}',
  Language: '\u{1F5E3}',
  Sciences: '\u{1F52C}',
  Arts: '\u{1F3AD}',
  IB: '\u{1F4DA}',
  'O-Levels': '\u{1F3EB}',
  'A-Levels': '\u{1F393}',
  IELTS: '\u{1F30D}',
  AWS: '\u{2601}',
  Programming: '\u{1F4BB}',
  'Web Dev': '\u{1F310}',
  Python: '\u{1F40D}',
}

const levelColors: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
}

const sectionIcons: Record<string, React.ReactNode> = {
  featured: <Crown className="size-5" />,
  top: <TrendingUp className="size-5" />,
  recommended: <Sparkles className="size-5" />,
  trending: <Flame className="size-5" />,
  free: <Gift className="size-5" />,
  newest: <Zap className="size-5" />,
}

const sectionIconColors: Record<string, string> = {
  featured: 'from-amber-500 to-orange-600',
  top: 'from-emerald-500 to-teal-600',
  recommended: 'from-violet-500 to-purple-600',
  trending: 'from-rose-500 to-pink-600',
  free: 'from-emerald-500 to-green-600',
  newest: 'from-cyan-500 to-teal-600',
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

function formatPrice(price: number): string {
  if (price === 0) return 'Free'
  return `\u20A8${(price ?? 0).toLocaleString()}`
}

function formatDuration(hours: number): string {
  if (!hours || hours === 0) return ''
  if (hours < 1) return `${Math.round(hours * 60)}min`
  return `${hours}h`
}

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

function formatEnrollmentCount(count: number): string {
  if (!count) return '0'
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return count.toString()
}

function getCourseBadge(course: CourseWithExtras): { label: string; className: string } | null {
  const enrollmentCount = course._count?.enrollments ?? course.enrollmentCount ?? 0
  const daysSinceCreated = (Date.now() - new Date(course.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  if (enrollmentCount >= 50 && course.rating >= 4.5) {
    return { label: 'Bestseller', className: 'bg-amber-500 text-white' }
  }
  if (daysSinceCreated <= 14) {
    return { label: 'New', className: 'bg-emerald-500 text-white' }
  }
  if (course.rating >= 4.7 && enrollmentCount >= 20) {
    return { label: 'Featured', className: 'bg-teal-600 text-white' }
  }
  if (enrollmentCount >= 100) {
    return { label: 'Staff Pick', className: 'bg-rose-500 text-white' }
  }
  return null
}

/* ═══════════════════════════════════════════════════════════════
   CAROUSEL CARD — Compact card for carousel rows
   ═══════════════════════════════════════════════════════════════ */

function CarouselCourseCard({
  course,
  onCourseClick,
  onWishlist,
  onEnroll,
}: {
  course: CourseWithExtras
  onCourseClick: (course: CourseWithExtras) => void
  onWishlist: (courseId: string, isWishlisted: boolean) => void
  onEnroll: (courseId: string) => void
}) {
  const { enrollments } = useAppStore()
  const gradient = categoryGradients[course.category] || 'from-emerald-500 to-teal-600'
  const emoji = categoryEmojis[course.category] || '\u{1F4D6}'
  const isEnrolled = course.isEnrolled || enrollments.some((e) => e.courseId === course.id)
  const enrollmentCount = course._count?.enrollments ?? course.enrollmentCount ?? 0
  const badge = getCourseBadge(course)

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: '0 16px 32px -8px rgba(0,0,0,0.12)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group cursor-pointer rounded-2xl overflow-hidden bg-card border border-border/30 hover:border-primary/20 transition-all duration-300 w-[260px] shrink-0"
      onClick={() => onCourseClick(course)}
    >
      {/* Thumbnail */}
      <div className="relative h-36 overflow-hidden">
        {course.thumbnail ? (
          <div
            className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
            style={{ backgroundImage: `url(${course.thumbnail})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        ) : (
          <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br relative', gradient)}>
            <span className="text-4xl opacity-40 select-none">{emoji}</span>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute top-3 right-3 size-16 rounded-full bg-white/10 blur-xl" />
          </div>
        )}

        {/* Category badge */}
        <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 dark:bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur-sm flex items-center gap-0.5 z-10">
          <span className="text-[9px]">{emoji}</span>
          {course.category}
        </span>

        {/* Level badge */}
        <span className={cn('absolute right-2.5 top-2.5 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize z-10', levelColors[course.level as CourseLevel] || 'bg-muted text-muted-foreground')}>
          {course.level}
        </span>

        {/* Badge */}
        {badge && (
          <span className={cn('absolute left-2.5 bottom-2.5 rounded-full px-2 py-0.5 text-[10px] font-bold flex items-center gap-0.5 z-10', badge.className)}>
            {badge.label === 'Bestseller' && <Flame className="size-2.5" />}
            {badge.label === 'New' && <Zap className="size-2.5" />}
            {badge.label === 'Featured' && <Crown className="size-2.5" />}
            {badge.label === 'Staff Pick' && <BadgeCheck className="size-2.5" />}
            {badge.label}
          </span>
        )}

        {/* Price badge */}
        <span className={cn(
          'absolute right-2.5 bottom-2.5 rounded-full px-2 py-0.5 text-[11px] font-bold backdrop-blur-sm z-10',
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
            'absolute top-2.5 right-12 flex size-7 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200 z-10',
            course.isWishlisted
              ? 'bg-rose-500/90 text-white opacity-100'
              : 'bg-white/90 dark:bg-black/70 text-foreground opacity-0 group-hover:opacity-100'
          )}
        >
          <Heart className={cn('size-3.5', course.isWishlisted && 'fill-current')} />
        </button>
      </div>

      {/* Content */}
      <div className="p-3.5 space-y-2">
        {/* Title */}
        <h3 className="text-[14px] font-semibold leading-snug text-card-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>

        {/* Instructor */}
        {course.instructor && (
          <div className="flex items-center gap-1.5">
            <div className="flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-[9px] font-bold text-white shrink-0 overflow-hidden">
              {course.instructor.avatar ? (
                <img src={course.instructor.avatar} alt="" className="size-5 rounded-full object-cover" />
              ) : (
                getInitials(course.instructor.name)
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {course.instructor.name}
            </p>
          </div>
        )}

        {/* Rating & Enrollment */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            <span className="text-[12px] font-semibold text-foreground">{(course.rating ?? 0).toFixed(1)}</span>
            <span className="text-[10px] text-muted-foreground">({course._count?.reviews ?? 0})</span>
          </div>
          <div className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
            <Users className="size-3" />
            <span>{formatEnrollmentCount(enrollmentCount)}</span>
          </div>
        </div>

        {/* Duration & Certificate */}
        {course.estimatedDuration > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="size-3" />
            <span>{formatDuration(course.estimatedDuration)}</span>
            {course.certificateEnabled && (
              <>
                <span className="text-muted-foreground/40">&middot;</span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <Award className="size-2.5" />
                  Certificate
                </span>
              </>
            )}
          </div>
        )}

        {/* Action */}
        <div className="pt-0.5">
          {isEnrolled ? (
            <div className="flex items-center justify-center gap-1 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[12px] font-medium">
              <Check className="size-3.5" />
              Enrolled
            </div>
          ) : (
            <Button
              className="w-full h-8 rounded-lg text-[12px] font-semibold"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEnroll(course.id)
              }}
            >
              {course.price === 0 ? (
                <><Gift className="size-3 mr-1" /> Enroll Free</>
              ) : (
                <>View Course <ChevronRight className="size-3 ml-0.5" /></>
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   CAROUSEL SKELETON
   ═══════════════════════════════════════════════════════════════ */

function CarouselSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="w-[260px] shrink-0 rounded-2xl overflow-hidden bg-card border border-border/30">
          <Skeleton className="h-36 w-full rounded-none" />
          <div className="p-3.5 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   COURSE CAROUSEL ROW
   ═══════════════════════════════════════════════════════════════ */

interface CourseCarouselRowProps {
  title: string
  subtitle?: string
  sectionKey: string
  courses: CourseWithExtras[]
  loading?: boolean
  onCourseClick: (course: CourseWithExtras) => void
  onWishlist: (courseId: string, isWishlisted: boolean) => void
  onEnroll: (courseId: string) => void
  onViewAll?: () => void
  categoryIcon?: string
}

export function CourseCarouselRow({
  title,
  subtitle,
  sectionKey,
  courses,
  loading = false,
  onCourseClick,
  onWishlist,
  onEnroll,
  onViewAll,
  categoryIcon,
}: CourseCarouselRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  const scroll = useCallback((direction: 'left' | 'right') => {
    const el = scrollContainerRef.current
    if (!el) return
    const scrollAmount = 280 * 2 // scroll by ~2 cards
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
    // Check scroll position after animation
    setTimeout(checkScroll, 400)
  }, [checkScroll])

  // Check on mount and when courses change
  const handleRef = useCallback((node: HTMLDivElement | null) => {
    (scrollContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = node
    if (node) {
      checkScroll()
      node.addEventListener('scroll', checkScroll, { passive: true })
    }
  }, [checkScroll, courses])

  const iconColor = sectionIconColors[sectionKey] || 'from-emerald-500 to-teal-600'
  const sectionIconEl = sectionIcons[sectionKey] || <BookOpen className="size-5" />

  // Don't render if no courses and not loading
  if (!loading && courses.length === 0) return null

  return (
    <section className="py-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Section icon */}
            <div className={cn(
              'flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm shrink-0',
              iconColor
            )}>
              {categoryIcon ? (
                <span className="text-lg">{categoryIcon}</span>
              ) : (
                sectionIconEl
              )}
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-foreground">{title}</h2>
              {subtitle && (
                <p className="text-[13px] text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Scroll arrows */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className={cn(
                  'flex size-8 items-center justify-center rounded-full border border-border/50 transition-all duration-200',
                  canScrollLeft
                    ? 'bg-card hover:bg-muted/50 text-foreground shadow-sm'
                    : 'text-muted-foreground/30 cursor-not-allowed'
                )}
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className={cn(
                  'flex size-8 items-center justify-center rounded-full border border-border/50 transition-all duration-200',
                  canScrollRight
                    ? 'bg-card hover:bg-muted/50 text-foreground shadow-sm'
                    : 'text-muted-foreground/30 cursor-not-allowed'
                )}
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* View All button */}
            {onViewAll && (
              <Button
                variant="ghost"
                size="sm"
                className="text-[13px] font-medium text-primary hover:text-primary/80 gap-1"
                onClick={onViewAll}
              >
                View All
                <ArrowRight className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Carousel */}
        <div className="relative group/carousel">
          {/* Left gradient fade */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          )}

          {/* Scrollable container */}
          {loading ? (
            <CarouselSkeleton />
          ) : (
            <div
              ref={handleRef}
              className="flex flex-nowrap gap-4 overflow-x-auto scrollbar-none scroll-smooth pb-2 -mx-1 px-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {courses.map((course) => (
                <CarouselCourseCard
                  key={course.id}
                  course={course}
                  onCourseClick={onCourseClick}
                  onWishlist={onWishlist}
                  onEnroll={onEnroll}
                />
              ))}
            </div>
          )}

          {/* Right gradient fade */}
          {canScrollRight && !loading && (
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          )}

          {/* Mobile scroll hint arrows */}
          <div className="flex sm:hidden items-center justify-center gap-2 mt-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className={cn(
                'flex size-7 items-center justify-center rounded-full border border-border/50 transition-all',
                canScrollLeft ? 'bg-card text-foreground' : 'text-muted-foreground/30'
              )}
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="text-[11px] text-muted-foreground">Scroll to see more</span>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className={cn(
                'flex size-7 items-center justify-center rounded-full border border-border/50 transition-all',
                canScrollRight ? 'bg-card text-foreground' : 'text-muted-foreground/30'
              )}
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
