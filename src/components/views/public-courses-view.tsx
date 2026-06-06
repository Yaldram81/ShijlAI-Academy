'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { PublicNav } from '@/components/public-nav'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Monitor, Briefcase, Palette, MessageCircle, Microscope, Tv, Book, FileText, Globe2, Cloud, Code, LayoutTemplate, Terminal, Library,
  Search,
  Star,
  Heart,
  Users,
  X,
  Sparkles,
  Clock,
  ChevronRight,
  SlidersHorizontal,
  BookOpen,
  ArrowRight,
  Check,
  Gift,
  Zap,
  Eye,
  Award,
  Flame,
  SearchX,
  RefreshCw,
  GraduationCap,
  Share2,
  Square,
  ArrowLeftRight,
  Trash2,
  Globe,
  BadgeCheck,
  Crown,
  Timer,
  Tag,
  Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { CourseCarouselRow } from '@/components/course-carousel-row'
import type { Course, CourseLevel } from '@/lib/types'
import { ShijlAIBrand } from '@/components/ui/brand-text'
import { ShijlAILogo } from '@/components/ui/shijlai-logo'

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

interface CategoryInfo {
  name: string
  count: number
  icon: string
}

interface FacetData {
  categories: { name: string; count: number }[]
  levels: { name: string; count: number }[]
  languages: { name: string; count: number }[]
  priceRange: { free: number; paid: number }
  certificates: number
}

interface CatalogSection {
  courses: CourseWithExtras[]
  reason: string
}

interface CategorySection {
  name: string
  icon: string
  count: number
  section: CatalogSection
}

type ViewMode = 'grid' | 'list'

interface FilterState {
  search: string
  categories: string[]
  levels: string[]
  languages: string[]
  price: string[]
  duration: string[]
  rating: string
  certificate: boolean
  hasFreeLessons: boolean
  staffPick: boolean
  featured: boolean
  sort: string
}

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

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

const categoryIcons: Record<string, any> = {
  Tech: Monitor,
  Business: Briefcase,
  Design: Palette,
  Language: MessageCircle,
  Sciences: Microscope,
  Arts: Tv,
  IB: Book,
  'O-Levels': FileText,
  'A-Levels': GraduationCap,
  IELTS: Globe2,
  AWS: Cloud,
  Programming: Code,
  'Web Dev': LayoutTemplate,
  Python: Terminal,
}

const levelColors: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
}

const levelDotColors: Record<string, string> = {
  beginner: 'bg-emerald-500',
  intermediate: 'bg-amber-500',
  advanced: 'bg-red-500',
}

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

const popularSearchTags = [
  'Python', 'Web Dev', 'IELTS', 'AWS', 'IB', 'AP', 'React', 'Machine Learning', 'Data Science',
]

const priceOptions = [
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
  { value: 'under_1000', label: 'Under \u20A8 1,000' },
  { value: 'under_2000', label: 'Under \u20A8 2,000' },
  { value: 'under_5000', label: 'Under \u20A8 5,000' },
]

const durationOptions = [
  { value: 'under_2h', label: 'Under 2h' },
  { value: '2-5h', label: '2\u20135h' },
  { value: '5-10h', label: '5\u201310h' },
  { value: '10h_plus', label: '10h+' },
]

const ratingOptions = [
  { value: '4.5', label: '4.5+' },
  { value: '4.0', label: '4.0+' },
  { value: '3.5', label: '3.5+' },
]

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'ur', label: 'Urdu' },
  { value: 'ar', label: 'Arabic' },
]

const sortOptions = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'highest_rated', label: 'Highest Rated' },
  { value: 'price_low', label: 'Price: Low \u2192 High' },
  { value: 'price_high', label: 'Price: High \u2192 Low' },
]

const pageSizeOptions = [12, 24, 48]

const defaultFilters: FilterState = {
  search: '',
  categories: [],
  levels: [],
  languages: [],
  price: [],
  duration: [],
  rating: '',
  certificate: false,
  hasFreeLessons: false,
  staffPick: false,
  featured: false,
  sort: 'relevance',
}

/* ═══════════════════════════════════════════════════════════════
   HELPER FUNCTIONS
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

function formatEnrollmentCount(count: number): string {
  if (!count) return '0'
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
  return count.toString()
}

/* ═══════════════════════════════════════════════════════════════
   STAR RATING
   ═══════════════════════════════════════════════════════════════ */

function StarRating({ rating, showNumeric = true, size = 'sm' }: { rating: number; showNumeric?: boolean; size?: 'sm' | 'md' }) {
  const starSize = size === 'md' ? 'size-4' : 'size-3.5'
  const textSize = size === 'md' ? 'text-[14px]' : 'text-[12px]'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            starSize,
            star <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-muted text-muted-foreground/30'
          )}
        />
      ))}
      {showNumeric && (
        <span className={cn('ml-1 font-semibold text-foreground', textSize)}>
          {(rating ?? 0).toFixed(1)}
        </span>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SKELETONS
   ═══════════════════════════════════════════════════════════════ */

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
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
    </div>
  )
}

function FilterSidebarSkeleton() {
  return (
    <div className="space-y-6 p-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-5 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════════════════ */

function EmptyState({ onBrowseAll, onClearFilters }: { onBrowseAll: () => void; onClearFilters: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-6 rounded-3xl bg-gradient-to-br from-muted/30 via-muted/10 to-muted/30 p-12 text-center border border-dashed border-muted-foreground/20"
    >
      <div className="relative">
        <div className="flex size-28 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40">
          <SearchX className="size-14 text-emerald-500/70 dark:text-emerald-400/70" />
        </div>
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

/* ═══════════════════════════════════════════════════════════════
   FILTER CHECKBOX ITEM
   ═══════════════════════════════════════════════════════════════ */

function FilterCheckbox({
  checked,
  onToggle,
  label,
  count,
  dotColor,
}: {
  checked: boolean
  onToggle: () => void
  label: string
  count?: number
  dotColor?: string
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex items-center gap-2.5 w-full py-1.5 px-2 rounded-lg transition-colors text-left group',
        checked ? 'bg-primary/5' : 'hover:bg-muted/50'
      )}
    >
      <div className={cn(
        'flex size-4.5 items-center justify-center rounded border transition-colors shrink-0',
        checked
          ? 'bg-primary border-primary text-primary-foreground'
          : 'border-muted-foreground/30 group-hover:border-primary/50'
      )} style={{ width: 18, height: 18 }}>
        {checked && <Check className="size-3" />}
      </div>
      {dotColor && (
        <div className={cn('size-2 rounded-full shrink-0', dotColor)} />
      )}
      <span className={cn(
        'text-[13px] flex-1',
        checked ? 'font-medium text-foreground' : 'text-muted-foreground group-hover:text-foreground'
      )}>
        {label}
      </span>
      {count !== undefined && (
        <span className="text-[11px] text-muted-foreground/60 tabular-nums">{count}</span>
      )}
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════
   FILTER SIDEBAR CONTENT (shared between desktop & mobile sheet)
   ═══════════════════════════════════════════════════════════════ */

function FilterSidebarContent({
  filters,
  onFilterChange,
  facets,
  categoryData,
  activeFilterCount,
  onClearAll,
}: {
  filters: FilterState
  onFilterChange: (updates: Partial<FilterState>) => void
  facets: FacetData | null
  categoryData: CategoryInfo[]
  activeFilterCount: number
  onClearAll: () => void
}) {
  const levelFacetMap = useMemo(() => {
    const m = new Map<string, number>()
    if (facets?.levels) {
      facets.levels.forEach((l) => m.set(l.name, l.count))
    }
    return m
  }, [facets])

  const categoryFacetMap = useMemo(() => {
    const m = new Map<string, number>()
    if (facets?.categories) {
      facets.categories.forEach((c) => m.set(c.name, c.count))
    }
    return m
  }, [facets])

  const languageFacetMap = useMemo(() => {
    const m = new Map<string, number>()
    if (facets?.languages) {
      facets.languages.forEach((l) => m.set(l.name, l.count))
    }
    return m
  }, [facets])

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between px-2 pb-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-primary" />
          <span className="text-[15px] font-semibold">Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[11px] rounded-full bg-primary/10 text-primary">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={onClearAll}
            className="text-[12px] font-medium text-primary hover:text-primary/80 transition-colors ios-press"
          >
            Clear all
          </button>
        )}
      </div>

      <Accordion
        type="multiple"
        defaultValue={['level', 'price', 'duration', 'rating', 'language', 'certificate']}
        className="w-full"
      >
        {/* Level */}
        <AccordionItem value="level" className="border-b border-border/30">
          <AccordionTrigger className="py-3 text-[13px] font-semibold hover:no-underline">
            <div className="flex items-center gap-2">
              <Layers className="size-3.5 text-muted-foreground" />
              Level
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="space-y-0.5">
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <FilterCheckbox
                  key={level}
                  checked={filters.levels.includes(level)}
                  onToggle={() => {
                    const next = filters.levels.includes(level)
                      ? filters.levels.filter((l) => l !== level)
                      : [...filters.levels, level]
                    onFilterChange({ levels: next })
                  }}
                  label={level.charAt(0).toUpperCase() + level.slice(1)}
                  count={levelFacetMap.get(level)}
                  dotColor={levelDotColors[level]}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price */}
        <AccordionItem value="price" className="border-b border-border/30">
          <AccordionTrigger className="py-3 text-[13px] font-semibold hover:no-underline">
            <div className="flex items-center gap-2">
              <Tag className="size-3.5 text-muted-foreground" />
              Price
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="space-y-0.5">
              {priceOptions.map((opt) => (
                <FilterCheckbox
                  key={opt.value}
                  checked={filters.price.includes(opt.value)}
                  onToggle={() => {
                    const next = filters.price.includes(opt.value)
                      ? filters.price.filter((p) => p !== opt.value)
                      : [...filters.price, opt.value]
                    onFilterChange({ price: next })
                  }}
                  label={opt.label}
                  count={
                    opt.value === 'free' ? facets?.priceRange.free :
                    opt.value === 'paid' ? facets?.priceRange.paid :
                    undefined
                  }
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Duration */}
        <AccordionItem value="duration" className="border-b border-border/30">
          <AccordionTrigger className="py-3 text-[13px] font-semibold hover:no-underline">
            <div className="flex items-center gap-2">
              <Timer className="size-3.5 text-muted-foreground" />
              Duration
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="space-y-0.5">
              {durationOptions.map((opt) => (
                <FilterCheckbox
                  key={opt.value}
                  checked={filters.duration.includes(opt.value)}
                  onToggle={() => {
                    const next = filters.duration.includes(opt.value)
                      ? filters.duration.filter((d) => d !== opt.value)
                      : [...filters.duration, opt.value]
                    onFilterChange({ duration: next })
                  }}
                  label={opt.label}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Rating */}
        <AccordionItem value="rating" className="border-b border-border/30">
          <AccordionTrigger className="py-3 text-[13px] font-semibold hover:no-underline">
            <div className="flex items-center gap-2">
              <Star className="size-3.5 text-muted-foreground" />
              Rating
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="space-y-0.5">
              {ratingOptions.map((opt) => (
                <FilterCheckbox
                  key={opt.value}
                  checked={filters.rating === opt.value}
                  onToggle={() => {
                    onFilterChange({ rating: filters.rating === opt.value ? '' : opt.value })
                  }}
                  label={`${opt.label} stars`}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Language */}
        <AccordionItem value="language" className="border-b border-border/30">
          <AccordionTrigger className="py-3 text-[13px] font-semibold hover:no-underline">
            <div className="flex items-center gap-2">
              <Globe className="size-3.5 text-muted-foreground" />
              Language
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="space-y-0.5">
              {languageOptions.map((opt) => (
                <FilterCheckbox
                  key={opt.value}
                  checked={filters.languages.includes(opt.value)}
                  onToggle={() => {
                    const next = filters.languages.includes(opt.value)
                      ? filters.languages.filter((l) => l !== opt.value)
                      : [...filters.languages, opt.value]
                    onFilterChange({ languages: next })
                  }}
                  label={opt.label}
                  count={languageFacetMap.get(opt.value)}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Certificate */}
        <AccordionItem value="certificate" className="border-b border-border/30">
          <AccordionTrigger className="py-3 text-[13px] font-semibold hover:no-underline">
            <div className="flex items-center gap-2">
              <BadgeCheck className="size-3.5 text-muted-foreground" />
              Certificate
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="flex items-center justify-between py-1.5 px-2">
              <span className="text-[13px] text-muted-foreground">Certificate included</span>
              <Switch
                checked={filters.certificate}
                onCheckedChange={(checked) => onFilterChange({ certificate: checked })}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Features */}
        <AccordionItem value="features" className="border-b-0">
          <AccordionTrigger className="py-3 text-[13px] font-semibold hover:no-underline">
            <div className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-muted-foreground" />
              Features
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-3">
            <div className="space-y-0.5">
              <FilterCheckbox
                checked={filters.hasFreeLessons}
                onToggle={() => onFilterChange({ hasFreeLessons: !filters.hasFreeLessons })}
                label="Has free lessons"
              />
              <FilterCheckbox
                checked={filters.staffPick}
                onToggle={() => onFilterChange({ staffPick: !filters.staffPick })}
                label="Staff Pick"
              />
              <FilterCheckbox
                checked={filters.featured}
                onToggle={() => onFilterChange({ featured: !filters.featured })}
                label="Featured"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   COURSE CARD — GRID VIEW
   ═══════════════════════════════════════════════════════════════ */

function CourseCardGrid({
  course,
  index,
  onEnroll,
  onWishlist,
  onCourseClick,
  onQuickPreview,
  onCompareToggle,
  isCompareSelected,
  onShare,
}: {
  course: CourseWithExtras
  index: number
  onEnroll: (courseId: string) => void
  onWishlist: (courseId: string, isWishlisted: boolean) => void
  onCourseClick: (course: CourseWithExtras) => void
  onQuickPreview: (course: CourseWithExtras) => void
  onCompareToggle: (courseId: string) => void
  isCompareSelected: boolean
  onShare: (course: CourseWithExtras) => void
}) {
  const { enrollments } = useAppStore()
  const gradient = categoryGradients[course.category] || 'from-emerald-500 to-teal-600'
  const IconComponent = categoryIcons[course.category] || BookOpen
  const isEnrolled = course.isEnrolled || enrollments.some((e) => e.courseId === course.id)
  const enrollmentCount = course._count?.enrollments ?? course.enrollmentCount ?? 0
  const badge = getCourseBadge(course)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ ...springTransition, delay: Math.min(index * 0.04, 0.4) }}
      className="group"
    >
      <motion.div
        whileHover={{ y: -6, boxShadow: '0 20px 40px -12px rgba(0,0,0,0.15)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={cn(
          'cursor-pointer rounded-2xl overflow-hidden ios-shadow-sm bg-card transition-colors duration-300 relative',
          isCompareSelected && 'ring-2 ring-primary ring-offset-2'
        )}
        onClick={() => onCourseClick(course)}
      >
        {/* Compare checkbox */}
        <div
          className="absolute top-3 left-3 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onCompareToggle(course.id)}
            className={cn(
              'flex size-6 items-center justify-center rounded-md backdrop-blur-sm transition-all duration-200',
              isCompareSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-white/80 dark:bg-black/50 text-foreground opacity-0 group-hover:opacity-100'
            )}
          >
            {isCompareSelected ? <Check className="size-3.5" /> : <Square className="size-3.5" />}
          </button>
        </div>

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
              <IconComponent className="size-12 opacity-40 select-none text-white/50" strokeWidth={1.5} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute top-4 right-4 size-20 rounded-full bg-white/10 blur-xl" />
              <div className="absolute bottom-8 left-4 size-16 rounded-full bg-white/10 blur-lg" />
            </div>
          )}

          {/* Category badge */}
          <span className="absolute left-12 top-3 rounded-full bg-white/90 dark:bg-black/70 px-2.5 py-0.5 text-[11px] font-semibold text-foreground backdrop-blur-sm flex items-center gap-1 z-10">
            <IconComponent className="size-3 text-white/80" strokeWidth={2} />
            {course.category}
          </span>

          {/* Level badge */}
          <span className={cn('absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize z-10', levelColors[course.level as CourseLevel] || 'bg-muted text-muted-foreground')}>
            {course.level}
          </span>

          {/* Bestseller / New / Featured / Staff Pick badge */}
          {badge && (
            <span className={cn('absolute left-3 bottom-3 rounded-full px-2.5 py-0.5 text-[11px] font-bold flex items-center gap-1 z-10', badge.className)}>
              {badge.label === 'Bestseller' && <Flame className="size-3" />}
              {badge.label === 'New' && <Zap className="size-3" />}
              {badge.label === 'Featured' && <Crown className="size-3" />}
              {badge.label === 'Staff Pick' && <BadgeCheck className="size-3" />}
              {badge.label}
            </span>
          )}

          {/* Price badge */}
          <span className={cn(
            'absolute right-3 bottom-3 rounded-full px-3 py-0.5 text-[12px] font-bold backdrop-blur-sm z-10',
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
              'absolute top-3 right-14 flex size-8 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200 z-10',
              course.isWishlisted
                ? 'bg-rose-500/90 text-white opacity-100'
                : 'bg-white/90 dark:bg-black/70 text-foreground opacity-0 group-hover:opacity-100'
            )}
          >
            <Heart className={cn('size-4', course.isWishlisted && 'fill-current')} />
          </button>

          {/* Hover overlay with Quick Preview & View Course */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center z-[5]">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onQuickPreview(course)
                }}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/95 dark:bg-black/80 px-4 py-2 text-[13px] font-semibold text-foreground backdrop-blur-sm shadow-lg hover:scale-105 transition-transform ios-press"
              >
                <Eye className="size-4" />
                Quick Preview
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onShare(course)
                }}
                className="inline-flex items-center justify-center size-9 rounded-full bg-white/95 dark:bg-black/80 backdrop-blur-sm shadow-lg hover:scale-105 transition-transform ios-press"
              >
                <Share2 className="size-4 text-foreground" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-2.5">
          {/* Title */}
          <h3 className="text-[15px] font-semibold leading-snug text-card-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>

          {/* Instructor */}
          {course.instructor && (
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-[10px] font-bold text-white shrink-0 overflow-hidden">
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
              <span>{formatEnrollmentCount(enrollmentCount)}</span>
            </div>
          </div>

          {/* Duration & Certificate */}
          {course.estimatedDuration > 0 && (
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <Clock className="size-3" />
              <span>{formatDuration(course.estimatedDuration)}</span>
              {course.certificateEnabled && (
                <>
                  <span className="text-muted-foreground/40">&middot;</span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                    <Award className="size-3" />
                    Certificate
                  </span>
                </>
              )}
            </div>
          )}

          {/* Action */}
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
                  <>View Course <ChevronRight className="size-3.5 ml-0.5" /></>
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   COURSE CARD — LIST VIEW
   ═══════════════════════════════════════════════════════════════ */

function CourseCardList({
  course,
  index,
  onEnroll,
  onWishlist,
  onCourseClick,
  onQuickPreview,
  onCompareToggle,
  isCompareSelected,
  onShare,
}: {
  course: CourseWithExtras
  index: number
  onEnroll: (courseId: string) => void
  onWishlist: (courseId: string, isWishlisted: boolean) => void
  onCourseClick: (course: CourseWithExtras) => void
  onQuickPreview: (course: CourseWithExtras) => void
  onCompareToggle: (courseId: string) => void
  isCompareSelected: boolean
  onShare: (course: CourseWithExtras) => void
}) {
  const { enrollments } = useAppStore()
  const gradient = categoryGradients[course.category] || 'from-emerald-500 to-teal-600'
  const IconComponent = categoryIcons[course.category] || BookOpen
  const isEnrolled = course.isEnrolled || enrollments.some((e) => e.courseId === course.id)
  const enrollmentCount = course._count?.enrollments ?? course.enrollmentCount ?? 0
  const badge = getCourseBadge(course)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ ...springTransition, delay: Math.min(index * 0.03, 0.3) }}
      className="group"
    >
      <motion.div
        whileHover={{ y: -2, boxShadow: '0 12px 30px -8px rgba(0,0,0,0.12)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={cn(
          'cursor-pointer flex flex-col sm:flex-row gap-4 rounded-2xl overflow-hidden ios-shadow-sm bg-card p-4 transition-colors duration-300 relative',
          isCompareSelected && 'ring-2 ring-primary ring-offset-2'
        )}
        onClick={() => onCourseClick(course)}
      >
        {/* Compare checkbox */}
        <div
          className="absolute top-3 left-3 z-20 sm:static sm:z-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onCompareToggle(course.id)}
            className={cn(
              'flex size-6 items-center justify-center rounded-md backdrop-blur-sm transition-all duration-200',
              isCompareSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-white/80 dark:bg-black/50 text-foreground opacity-0 group-hover:opacity-100'
            )}
          >
            {isCompareSelected ? <Check className="size-3.5" /> : <Square className="size-3.5" />}
          </button>
        </div>

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
              <IconComponent className="size-8 opacity-40 select-none text-white/50" strokeWidth={1.5} />
            </div>
          )}
          <span className="absolute left-2 top-2 rounded-full bg-white/90 dark:bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur-sm">
            {course.category}
          </span>
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
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onShare(course)
                }}
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Share2 className="size-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onWishlist(course.id, course.isWishlisted || false)
                }}
                className={cn(
                  'flex size-7 items-center justify-center rounded-full transition-all duration-200 ios-press',
                  course.isWishlisted
                    ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-500'
                    : 'text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                )}
              >
                <Heart className={cn('size-3.5', course.isWishlisted && 'fill-current')} />
              </button>
            </div>
          </div>

          {/* Instructor */}
          {course.instructor && (
            <div className="flex items-center gap-2">
              <div className="flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-[9px] font-bold text-white shrink-0 overflow-hidden">
                {course.instructor.avatar ? (
                  <img src={course.instructor.avatar} alt="" className="size-5 rounded-full object-cover" />
                ) : (
                  getInitials(course.instructor.name)
                )}
              </div>
              <p className="text-[12px] text-muted-foreground truncate">{course.instructor.name}</p>
            </div>
          )}

          {/* Description snippet */}
          <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed hidden sm:block">
            {course.description}
          </p>

          {/* Meta row */}
          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
            <StarRating rating={course.rating} />
            <div className="flex items-center gap-1">
              <Users className="size-3.5" />
              <span>{formatEnrollmentCount(enrollmentCount)} students</span>
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
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onQuickPreview(course)
                }}
                className="hidden sm:flex items-center gap-1 text-[12px] font-medium text-primary hover:text-primary/80 transition-colors ios-press"
              >
                <Eye className="size-3.5" />
                Preview
              </button>
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
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   QUICK PREVIEW DIALOG
   ═══════════════════════════════════════════════════════════════ */

function QuickPreviewDialog({
  course,
  open,
  onOpenChange,
  onEnroll,
  onCourseClick,
}: {
  course: CourseWithExtras | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEnroll: (courseId: string) => void
  onCourseClick: (course: CourseWithExtras) => void
}) {
  if (!course) return null

  const gradient = categoryGradients[course.category] || 'from-emerald-500 to-teal-600'
  const IconComponent = categoryIcons[course.category] || BookOpen
  const enrollmentCount = course._count?.enrollments ?? course.enrollmentCount ?? 0
  const moduleCount = course._count?.modules ?? 0
  const badge = getCourseBadge(course)
  const learningObjectives = course.learningObjectives
    ? (typeof course.learningObjectives === 'string'
      ? (() => { try { return JSON.parse(course.learningObjectives) } catch { return [] } })()
      : course.learningObjectives)
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto p-0">
        {/* Hero Banner */}
        <div className={cn('relative h-40 bg-gradient-to-br', gradient)}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
          <div className="absolute top-4 right-4 size-24 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-4 left-6 size-16 rounded-full bg-white/10 blur-xl" />
          <IconComponent className="size-10 opacity-30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-white/50" strokeWidth={1.5} />
          <DialogHeader className="absolute bottom-4 left-6 right-6">
            <DialogTitle className="text-white text-[17px] font-bold leading-snug line-clamp-2 drop-shadow-md">
              {course.title}
            </DialogTitle>
          </DialogHeader>
          {badge && (
            <span className={cn('absolute top-4 left-6 rounded-full px-2.5 py-0.5 text-[11px] font-bold flex items-center gap-1', badge.className)}>
              {badge.label}
            </span>
          )}
        </div>

        <div className="p-6 space-y-5">
          {/* Instructor */}
          {course.instructor && (
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-[12px] font-bold text-white shrink-0 overflow-hidden">
                {course.instructor.avatar ? (
                  <img src={course.instructor.avatar} alt="" className="size-10 rounded-full object-cover" />
                ) : (
                  getInitials(course.instructor.name)
                )}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-foreground">{course.instructor.name}</p>
                <p className="text-[12px] text-muted-foreground">Instructor</p>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <StarRating rating={course.rating} size="md" showNumeric={false} />
              <p className="mt-1 text-[15px] font-bold">{(course.rating ?? 0).toFixed(1)}</p>
              <p className="text-[11px] text-muted-foreground">{course._count?.reviews ?? 0} reviews</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <Users className="size-4 mx-auto text-primary" />
              <p className="mt-1 text-[15px] font-bold">{formatEnrollmentCount(enrollmentCount)}</p>
              <p className="text-[11px] text-muted-foreground">students</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <Layers className="size-4 mx-auto text-primary" />
              <p className="mt-1 text-[15px] font-bold">{moduleCount}</p>
              <p className="text-[11px] text-muted-foreground">modules</p>
            </div>
          </div>

          {/* Meta Row */}
          <div className="flex flex-wrap gap-2">
            <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize', levelColors[course.level as CourseLevel] || 'bg-muted text-muted-foreground')}>
              {course.level}
            </span>
            {course.estimatedDuration > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-muted/50 px-2.5 py-1 text-[11px] text-muted-foreground">
                <Clock className="size-3" />
                {formatDuration(course.estimatedDuration)}
              </span>
            )}
            {course.certificateEnabled && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <Award className="size-3" />
                Certificate
              </span>
            )}
            <span className="rounded-full bg-muted/50 px-2.5 py-1 text-[11px] text-muted-foreground">
              {course.language === 'en' ? 'English' : course.language === 'ur' ? 'Urdu' : course.language === 'ar' ? 'Arabic' : 'Multilingual'}
            </span>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-[13px] font-semibold text-foreground mb-1.5">About this course</h4>
            <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-4">
              {course.description}
            </p>
          </div>

          {/* Learning Objectives */}
          {Array.isArray(learningObjectives) && learningObjectives.length > 0 && (
            <div>
              <h4 className="text-[13px] font-semibold text-foreground mb-1.5">What you&apos;ll learn</h4>
              <ul className="space-y-1.5">
                {learningObjectives.slice(0, 5).map((obj: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                    <Check className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </li>
                ))}
                {learningObjectives.length > 5 && (
                  <li className="text-[12px] text-primary font-medium">
                    +{learningObjectives.length - 5} more
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Price & CTA */}
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <span className={cn(
                'text-[20px] font-bold',
                course.price === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
              )}>
                {formatPrice(course.price)}
              </span>
              {course.price > 0 && (
                <span className="ml-2 text-[13px] text-muted-foreground line-through">
                  {formatPrice(Math.round(course.price * 1.3))}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="rounded-xl text-[13px]"
                onClick={() => {
                  onOpenChange(false)
                  onCourseClick(course)
                }}
              >
                View Details
              </Button>
              <Button
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[13px] font-semibold shadow-lg shadow-emerald-500/20"
                onClick={() => {
                  onEnroll(course.id)
                }}
              >
                {course.price === 0 ? 'Enroll Free' : 'Enroll Now'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ═══════════════════════════════════════════════════════════════
   COMPARE DIALOG
   ═══════════════════════════════════════════════════════════════ */

function CompareDialog({
  courses,
  open,
  onOpenChange,
  onRemove,
  onClearAll,
  onCourseClick,
}: {
  courses: CourseWithExtras[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onRemove: (courseId: string) => void
  onClearAll: () => void
  onCourseClick: (course: CourseWithExtras) => void
}) {
  if (courses.length === 0) return null

  const compareFields = [
    { label: 'Instructor', render: (c: CourseWithExtras) => c.instructor?.name || 'N/A' },
    { label: 'Price', render: (c: CourseWithExtras) => (
      <span className={cn('font-semibold', c.price === 0 ? 'text-emerald-600 dark:text-emerald-400' : '')}>
        {formatPrice(c.price)}
      </span>
    )},
    { label: 'Rating', render: (c: CourseWithExtras) => (
      <div className="flex items-center gap-1">
        <Star className="size-3.5 fill-amber-400 text-amber-400" />
        <span className="font-semibold">{(c.rating ?? 0).toFixed(1)}</span>
      </div>
    )},
    { label: 'Students', render: (c: CourseWithExtras) => formatEnrollmentCount(c._count?.enrollments ?? c.enrollmentCount ?? 0) },
    { label: 'Duration', render: (c: CourseWithExtras) => c.estimatedDuration > 0 ? formatDuration(c.estimatedDuration) : 'N/A' },
    { label: 'Level', render: (c: CourseWithExtras) => (
      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize', levelColors[c.level as CourseLevel] || 'bg-muted text-muted-foreground')}>
        {c.level}
      </span>
    )},
    { label: 'Certificate', render: (c: CourseWithExtras) => c.certificateEnabled ? (
      <Check className="size-4 text-emerald-500" />
    ) : (
      <X className="size-4 text-muted-foreground/30" />
    )},
    { label: 'Modules', render: (c: CourseWithExtras) => (c._count?.modules ?? 0).toString() },
    { label: 'Language', render: (c: CourseWithExtras) => c.language === 'en' ? 'English' : c.language === 'ur' ? 'Urdu' : c.language === 'ar' ? 'Arabic' : 'Multilingual' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="size-5 text-primary" />
            Compare Courses
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[400px]">
            <thead>
              <tr>
                <th className="text-left text-[13px] font-semibold text-muted-foreground p-3 w-28"></th>
                {courses.map((c) => (
                  <th key={c.id} className="text-center p-3 min-w-[160px]">
                    <div className="space-y-2">
                      <div className={cn('mx-auto flex size-12 items-center justify-center rounded-xl bg-gradient-to-br', categoryGradients[c.category] || 'from-emerald-500 to-teal-600')}>
                        {(() => {
                          const CatIcon = categoryIcons[c.category] || BookOpen
                          return <CatIcon className="size-5" />
                        })()}
                      </div>
                      <p className="text-[13px] font-semibold text-foreground line-clamp-2 leading-tight">{c.title}</p>
                      <button
                        onClick={() => onRemove(c.id)}
                        className="text-[11px] text-rose-500 hover:text-rose-600 font-medium transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </th>
                ))}
                {/* Empty columns to fill 3 slots */}
                {Array.from({ length: Math.max(0, 3 - courses.length) }).map((_, i) => (
                  <th key={`empty-${i}`} className="p-3 min-w-[160px]">
                    <div className="flex size-12 mx-auto items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20">
                      <span className="text-[11px] text-muted-foreground/40">+</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {compareFields.map((field, i) => (
                <tr key={field.label} className={cn(i % 2 === 0 ? 'bg-muted/20' : '')}>
                  <td className="text-[12px] font-medium text-muted-foreground p-3">{field.label}</td>
                  {courses.map((c) => (
                    <td key={c.id} className="text-center p-3 text-[13px]">
                      {field.render(c)}
                    </td>
                  ))}
                  {Array.from({ length: Math.max(0, 3 - courses.length) }).map((_, j) => (
                    <td key={`empty-${j}`} className="p-3 text-center text-[12px] text-muted-foreground/30">-</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" size="sm" className="rounded-full gap-1.5 text-[13px]" onClick={onClearAll}>
            <Trash2 className="size-3.5" />
            Clear All
          </Button>
          <div className="flex gap-2">
            {courses.map((c) => (
              <Button
                key={c.id}
                size="sm"
                variant="outline"
                className="rounded-full text-[12px]"
                onClick={() => {
                  onOpenChange(false)
                  onCourseClick(c)
                }}
              >
                View {c.title.split(' ').slice(0, 2).join(' ')}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ═══════════════════════════════════════════════════════════════
   COMPARE FLOATING BAR
   ═══════════════════════════════════════════════════════════════ */

function CompareFloatingBar({
  selectedCourses,
  onOpenCompare,
  onRemove,
  onClearAll,
}: {
  selectedCourses: CourseWithExtras[]
  onOpenCompare: () => void
  onRemove: (courseId: string) => void
  onClearAll: () => void
}) {
  if (selectedCourses.length === 0) return null

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-xl"
    >
      <div className="flex items-center gap-3 rounded-2xl bg-card/95 backdrop-blur-xl ios-shadow-lg border border-border/50 p-3">
        {/* Selected course thumbnails */}
        <div className="flex -space-x-2 shrink-0">
          {selectedCourses.map((c) => (
            <div key={c.id} className="relative">
              <div className={cn(
                'flex size-10 items-center justify-center rounded-xl border-2 border-card bg-gradient-to-br text-sm',
                categoryGradients[c.category] || 'from-emerald-500 to-teal-600'
              )}>
                {(() => {
                    const CatIcon = categoryIcons[c.category] || BookOpen
                    return <CatIcon className="size-3" />
                  })()}
              </div>
              <button
                onClick={() => onRemove(c.id)}
                className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-rose-500 text-white"
              >
                <X className="size-2.5" />
              </button>
            </div>
          ))}
          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 3 - selectedCourses.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="flex size-10 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20">
              <span className="text-[10px] text-muted-foreground/40">+</span>
            </div>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground">
            {selectedCourses.length} course{selectedCourses.length > 1 ? 's' : ''} selected
          </p>
          <p className="text-[11px] text-muted-foreground">Select up to 3 courses to compare</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="text-[12px] rounded-full h-8"
            onClick={onClearAll}
          >
            Clear
          </Button>
          <Button
            size="sm"
            className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[13px] font-semibold h-8"
            disabled={selectedCourses.length < 2}
            onClick={onOpenCompare}
          >
            <ArrowLeftRight className="size-3.5 mr-1" />
            Compare
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════ */

function CoursesFooter() {
  const { setCurrentView } = useAppStore()
  return (
    <footer className="border-t border-border/30 bg-card/50 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShijlAILogo size="xs" className="shrink-0" />
            <span className="text-[14px] font-semibold"><ShijlAIBrand variant="compact" /></span>
          </div>
          <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
            <button onClick={() => setCurrentView('about')} className="hover:text-foreground transition-colors">About</button>
            <button onClick={() => setCurrentView('blog')} className="hover:text-foreground transition-colors">Blog</button>
            <button onClick={() => setCurrentView('pricing')} className="hover:text-foreground transition-colors">Pricing</button>
            <button onClick={() => setCurrentView('instructors')} className="hover:text-foreground transition-colors">Teach</button>
          </div>
          <p className="text-[11px] text-muted-foreground/60">&copy; {new Date().getFullYear()} <ShijlAIBrand variant="compact" />. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT: PUBLIC COURSES VIEW
   ═══════════════════════════════════════════════════════════════ */

export function PublicCoursesView() {
  const { currentUser, setSelectedCourse, setCurrentView, isAuthenticated, enrollments, setEnrollments } = useAppStore()

  // ─── State ───
  const [courses, setCourses] = useState<CourseWithExtras[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({ total: 0, limit: 12, offset: 0, hasMore: false })
  const [facets, setFacets] = useState<FacetData | null>(null)
  const [categoryData, setCategoryData] = useState<CategoryInfo[]>([])

  // Catalog carousel data
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [featuredSection, setFeaturedSection] = useState<CatalogSection | null>(null)
  const [topSection, setTopSection] = useState<CatalogSection | null>(null)
  const [recommendedSection, setRecommendedSection] = useState<CatalogSection | null>(null)
  const [categorySections, setCategorySections] = useState<CategorySection[]>([])
  // Filters
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [pageSize, setPageSize] = useState(12)
  const [currentPage, setCurrentPage] = useState(1)

  // Search focus
  const [searchFocused, setSearchFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Compare
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [compareDialogOpen, setCompareDialogOpen] = useState(false)

  // Quick preview
  const [previewCourse, setPreviewCourse] = useState<CourseWithExtras | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  // Mobile filter sheet
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  // ─── Computed ───
  const isFiltering = useMemo(() => {
    if (filters.search.trim()) return true
    if (filters.categories.length > 0) return true
    if (filters.levels.length > 0) return true
    if (filters.languages.length > 0) return true
    if (filters.price.length > 0) return true
    if (filters.duration.length > 0) return true
    if (filters.rating) return true
    if (filters.certificate) return true
    if (filters.hasFreeLessons) return true
    if (filters.staffPick) return true
    if (filters.featured) return true
    return false
  }, [filters])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.categories.length > 0) count++
    if (filters.levels.length > 0) count++
    if (filters.languages.length > 0) count++
    if (filters.price.length > 0) count++
    if (filters.duration.length > 0) count++
    if (filters.rating) count++
    if (filters.certificate) count++
    if (filters.hasFreeLessons) count++
    if (filters.staffPick) count++
    if (filters.featured) count++
    return count
  }, [filters])

  const activeFilterPills = useMemo(() => {
    const pills: { key: string; label: string; onRemove: () => void }[] = []

    filters.categories.forEach((cat) => {
      pills.push({ key: `cat-${cat}`, label: cat, onRemove: () => onFilterChange({ categories: filters.categories.filter((c) => c !== cat) }) })
    })
    filters.levels.forEach((level) => {
      pills.push({ key: `level-${level}`, label: level.charAt(0).toUpperCase() + level.slice(1), onRemove: () => onFilterChange({ levels: filters.levels.filter((l) => l !== level) }) })
    })
    filters.languages.forEach((lang) => {
      const label = lang === 'en' ? 'English' : lang === 'ur' ? 'Urdu' : lang === 'ar' ? 'Arabic' : lang
      pills.push({ key: `lang-${lang}`, label, onRemove: () => onFilterChange({ languages: filters.languages.filter((l) => l !== lang) }) })
    })
    filters.price.forEach((p) => {
      const opt = priceOptions.find((o) => o.value === p)
      pills.push({ key: `price-${p}`, label: opt?.label || p, onRemove: () => onFilterChange({ price: filters.price.filter((x) => x !== p) }) })
    })
    filters.duration.forEach((d) => {
      const opt = durationOptions.find((o) => o.value === d)
      pills.push({ key: `dur-${d}`, label: opt?.label || d, onRemove: () => onFilterChange({ duration: filters.duration.filter((x) => x !== d) }) })
    })
    if (filters.rating) {
      pills.push({ key: 'rating', label: `${filters.rating}+ stars`, onRemove: () => onFilterChange({ rating: '' }) })
    }
    if (filters.certificate) {
      pills.push({ key: 'cert', label: 'Certificate', onRemove: () => onFilterChange({ certificate: false }) })
    }
    if (filters.hasFreeLessons) {
      pills.push({ key: 'free-lessons', label: 'Free Lessons', onRemove: () => onFilterChange({ hasFreeLessons: false }) })
    }
    if (filters.staffPick) {
      pills.push({ key: 'staff-pick', label: 'Staff Pick', onRemove: () => onFilterChange({ staffPick: false }) })
    }
    if (filters.featured) {
      pills.push({ key: 'featured', label: 'Featured', onRemove: () => onFilterChange({ featured: false }) })
    }

    return pills
  }, [filters])

  const compareCourses = useMemo(() => {
    return courses.filter((c) => compareIds.includes(c.id))
  }, [courses, compareIds])

  // ─── Filter change handler ───
  const onFilterChange = useCallback((updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }))
    setCurrentPage(1)
  }, [])

  // ─── Fetch categories on mount ───
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

  // ─── Fetch catalog data for carousel rows ───
  useEffect(() => {
    const fetchCatalog = async () => {
      setCatalogLoading(true)
      try {
        const params = new URLSearchParams({
          limit: '10',
          includeCategories: 'true',
        })
        if (currentUser?.id) params.set('userId', currentUser.id)

        const res = await fetch(`/api/courses/catalog?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          if (data.featured) setFeaturedSection(data.featured)
          if (data.top) setTopSection(data.top)
          if (data.recommended) setRecommendedSection(data.recommended)
          if (data.categories) setCategorySections(data.categories)
        }
      } catch {
        // ignore
      } finally {
        setCatalogLoading(false)
      }
    }
    fetchCatalog()
  }, [currentUser?.id])

  // ─── Load recent searches from localStorage ───
  useEffect(() => {
    try {
      const stored = localStorage.getItem('shijlai-recent-searches')
      if (stored) {
        setRecentSearches(JSON.parse(stored).slice(0, 5))
      }
    } catch {
      // ignore
    }
  }, [])

  // ─── Fetch courses ───
  const fetchCourses = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters.search.trim()) params.set('search', filters.search.trim())
      if (filters.categories.length > 0) params.set('category', filters.categories.join(','))
      if (filters.levels.length > 0) params.set('level', filters.levels.join(','))
      if (filters.languages.length > 0) params.set('language', filters.languages.join(','))
      if (filters.price.length > 0) params.set('price', filters.price.join(','))
      if (filters.duration.length > 0) params.set('duration', filters.duration.join(','))
      if (filters.rating) params.set('rating', filters.rating)
      if (filters.certificate) params.set('certificate', 'true')
      if (filters.featured) params.set('featured', 'true')
      if (filters.staffPick) params.set('staffPick', 'true')
      if (filters.hasFreeLessons) params.set('hasFreeLessons', 'true')
      if (filters.sort && filters.sort !== 'relevance') params.set('sort', filters.sort)
      if (currentUser?.id) params.set('userId', currentUser.id)

      const offset = (currentPage - 1) * pageSize
      params.set('limit', pageSize.toString())
      params.set('offset', offset.toString())

      const res = await fetch(`/api/courses?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch courses')
      const data = await res.json()

      setCourses(data.courses || [])
      setPagination({
        total: data.pagination?.total || 0,
        limit: data.pagination?.limit || pageSize,
        offset: data.pagination?.offset || offset,
        hasMore: data.pagination?.hasMore || false,
      })
      setFacets(data.facets || null)
    } catch {
      setError('Failed to load courses. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [filters, currentPage, pageSize, currentUser?.id])

  // Debounced fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourses()
    }, filters.search ? 400 : 0)
    return () => clearTimeout(timer)
  }, [fetchCourses, filters.search])

  // ─── Enroll handler ───
  const handleEnroll = async (courseId: string) => {
    if (!isAuthenticated || !currentUser) {
      toast.error('Please log in to enroll')
      setCurrentView('register')
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
        toast.success('Enrolled successfully!')
        if (data.enrollment) {
          setEnrollments([...enrollments, data.enrollment])
        }
        fetchCourses()
      } else {
        toast.error('Failed to enroll')
      }
    } catch {
      toast.error('Failed to enroll')
    }
  }

  // ─── Wishlist handler ───
  const handleWishlist = async (courseId: string, isWishlisted: boolean) => {
    if (!isAuthenticated || !currentUser) {
      toast.error('Please log in to add to wishlist')
      setCurrentView('register')
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
        toast.success('Added to wishlist')
      }
      fetchCourses()
    } catch {
      toast.error('Failed to update wishlist')
    }
  }

  // ─── Course click ───
  const handleCourseClick = (course: CourseWithExtras) => {
    setSelectedCourse(course as unknown as Course)
    setCurrentView('public-course-detail')
  }

  // ─── Share handler ───
  const handleShare = (course: CourseWithExtras) => {
    const url = `${window.location.origin}/course/${course.id}`
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Course link copied to clipboard!')
    }).catch(() => {
      toast.error('Failed to copy link')
    })
  }

  // ─── Compare handlers ───
  const handleCompareToggle = (courseId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(courseId)) {
        return prev.filter((id) => id !== courseId)
      }
      if (prev.length >= 3) {
        toast.error('You can compare up to 3 courses at a time')
        return prev
      }
      return [...prev, courseId]
    })
  }

  const handleCompareRemove = (courseId: string) => {
    setCompareIds((prev) => prev.filter((id) => id !== courseId))
  }

  const handleCompareClearAll = () => {
    setCompareIds([])
    setCompareDialogOpen(false)
  }

  // ─── Quick preview handler ───
  const handleQuickPreview = (course: CourseWithExtras) => {
    setPreviewCourse(course)
    setPreviewOpen(true)
  }

  // ─── Carousel View All handler ───
  const handleCarouselViewAll = useCallback((sectionKey: string, categoryName?: string) => {
    if (categoryName) {
      onFilterChange({ categories: [categoryName] })
    } else {
      switch (sectionKey) {
        case 'featured':
          onFilterChange({ featured: true })
          break
        case 'top':
          onFilterChange({ sort: 'highest_rated' })
          break
        case 'recommended':
          // Just show all courses sorted by popularity
          onFilterChange({ sort: 'popular' })
          break
        default:
          break
      }
    }
  }, [onFilterChange])

  // ─── Search submit ───
  const handleSearchSubmit = (query: string) => {
    onFilterChange({ search: query })
    setShowSuggestions(false)
    // Save to recent searches
    if (query.trim()) {
      const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5)
      setRecentSearches(updated)
      try {
        localStorage.setItem('shijlai-recent-searches', JSON.stringify(updated))
      } catch {
        // ignore
      }
    }
  }

  // ─── Clear all filters ───
  const clearAllFilters = () => {
    setFilters(defaultFilters)
    setCurrentPage(1)
  }

  // ─── Keyboard shortcut (Cmd/Ctrl + K) ───
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
        setShowSuggestions(true)
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false)
        searchInputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // ─── Pagination helpers ───
  const totalPages = Math.ceil(pagination.total / pageSize)
  const showingFrom = pagination.total > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const showingTo = Math.min(currentPage * pageSize, pagination.total)

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('ellipsis')
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push('ellipsis')
      pages.push(totalPages)
    }
    return pages
  }

  // ─── Render ───
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNav activeView="public-courses" />

      {/* ═══ Hero Section ═══ */}
      <section className="relative overflow-hidden py-6 sm:py-8">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50/30 to-transparent dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-transparent" />
        {/* Decorative shapes */}
        <div className="absolute top-8 right-12 size-40 rounded-full bg-emerald-200/30 dark:bg-emerald-800/10 blur-3xl" />
        <div className="absolute bottom-4 left-8 size-32 rounded-full bg-teal-200/30 dark:bg-teal-800/10 blur-2xl" />
        <div className="absolute top-20 left-1/3 size-20 rounded-full bg-emerald-300/20 dark:bg-emerald-700/10 blur-xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.1 }}
              className="flex items-center justify-center gap-2 mb-3"
            >
              <Sparkles className="size-4 text-emerald-500" />
              <span className="text-[13px] font-medium text-emerald-600 dark:text-emerald-400">AI-Powered Learning Platform</span>
            </motion.div>
            <h1 className="text-[28px] sm:text-[34px] font-bold tracking-tight">
              Explore{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                Courses
              </span>
            </h1>
            <p className="mt-2 text-[17px] text-muted-foreground max-w-xl mx-auto">
              Discover courses across Tech, Languages, Sciences & more — designed for students worldwide with AI-powered personalized learning.
            </p>

            {/* Advanced Search Bar */}
            <div className="mt-4 max-w-2xl mx-auto relative">
              <div className={cn(
                'relative rounded-2xl transition-all duration-300',
                searchFocused
                  ? 'ring-2 ring-emerald-500/40 shadow-xl shadow-emerald-500/10'
                  : 'ring-0 ios-shadow-sm'
              )}>
                <div className="relative flex items-center bg-card rounded-2xl overflow-hidden border border-border/50">
                  <motion.div
                    animate={{ scale: searchFocused ? 1.1 : 1, rotate: searchFocused ? 10 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="pl-4"
                  >
                    <Search className="size-5 text-muted-foreground" />
                  </motion.div>
                  <Input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Search for courses, topics, or instructors..."
                    value={filters.search}
                    onChange={(e) => onFilterChange({ search: e.target.value })}
                    onFocus={() => {
                      setSearchFocused(true)
                      setShowSuggestions(true)
                    }}
                    onBlur={() => {
                      setSearchFocused(false)
                      // Delay to allow click on suggestions
                      setTimeout(() => setShowSuggestions(false), 200)
                    }}
                    className="h-12 rounded-none border-0 bg-transparent pl-3 pr-4 text-[15px] focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  {filters.search ? (
                    <button
                      onClick={() => onFilterChange({ search: '' })}
                      className="pr-3 text-muted-foreground hover:text-foreground ios-press"
                    >
                      <X className="size-4" />
                    </button>
                  ) : (
                    <div className="pr-3">
                      <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                        &cmd;K
                      </kbd>
                    </div>
                  )}
                  {/* Mobile Filter Button */}
                  <div className="lg:hidden border-l border-border/30 pl-1 pr-2">
                    <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                      <SheetTrigger asChild>
                        <button className="relative flex items-center justify-center size-9 rounded-lg hover:bg-muted/50 transition-colors ios-press">
                          <SlidersHorizontal className="size-4 text-muted-foreground" />
                          {activeFilterCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                              {activeFilterCount}
                            </span>
                          )}
                        </button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-[300px] overflow-y-auto">
                        <SheetHeader>
                          <SheetTitle>Filter Courses</SheetTitle>
                        </SheetHeader>
                        <div className="mt-4">
                          <FilterSidebarContent
                            filters={filters}
                            onFilterChange={(updates) => {
                              onFilterChange(updates)
                            }}
                            facets={facets}
                            categoryData={categoryData}
                            activeFilterCount={activeFilterCount}
                            onClearAll={clearAllFilters}
                          />
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                </div>

                {/* Search Suggestions Dropdown */}
                <AnimatePresence>
                  {showSuggestions && !filters.search && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-card border border-border/50 ios-shadow-lg overflow-hidden z-50"
                    >
                      {recentSearches.length > 0 && (
                        <div className="p-3 border-b border-border/30">
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent Searches</p>
                          <div className="space-y-1">
                            {recentSearches.map((term) => (
                              <button
                                key={term}
                                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-[13px] text-foreground hover:bg-muted/50 transition-colors text-left"
                                onClick={() => handleSearchSubmit(term)}
                              >
                                <Clock className="size-3.5 text-muted-foreground" />
                                {term}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Popular Searches</p>
                        <div className="flex flex-wrap gap-2">
                          {popularSearches.map((term) => (
                            <button
                              key={term}
                              onClick={() => handleSearchSubmit(term)}
                              className="rounded-full bg-muted/50 px-3 py-1 text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ios-press"
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Popular search tags below search */}
              <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                <span className="text-[11px] text-muted-foreground font-medium">Popular:</span>
                {popularSearchTags.slice(0, 5).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleSearchSubmit(tag)}
                    className="rounded-full bg-white/80 dark:bg-card/80 px-3 py-1 text-[12px] text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors border border-border/30 ios-press"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ Combined Layout: Filter Sidebar + Content ═══ */}
      <section className="flex-1 py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex gap-4">
            {/* Desktop Filter Sidebar */}
            <aside className="hidden lg:block w-56 shrink-0 self-start sticky top-16 z-10">
              <div className="max-h-[calc(100vh-5rem)] overflow-y-auto scrollbar-thin rounded-2xl bg-card ios-shadow-sm p-4">
                {loading && !facets ? (
                  <FilterSidebarSkeleton />
                ) : (
                  <FilterSidebarContent
                    filters={filters}
                    onFilterChange={onFilterChange}
                    facets={facets}
                    categoryData={categoryData}
                    activeFilterCount={activeFilterCount}
                    onClearAll={clearAllFilters}
                  />
                )}
              </div>
            </aside>

            {/* Right Side: Category Browser + Carousel/Filtered Results */}
            <div className="flex-1 min-w-0">
              {/* Category Browser */}
              <div className="py-2">
                <ScrollArea className="w-full whitespace-nowrap">
                  <div className="flex gap-3 pb-2">
                    {/* "All" Category */}
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        if (filters.categories.length > 0) {
                          onFilterChange({ categories: [] })
                        }
                      }}
                      className={cn(
                        'shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl transition-all duration-200 min-w-[80px] border',
                        filters.categories.length === 0
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-transparent ios-shadow-sm'
                          : 'bg-card border-border/30 hover:border-primary/30 text-muted-foreground'
                      )}
                    >
                      <Library className="size-5" />
                      <span className="text-[11px] font-semibold">All</span>
                    </motion.button>

                    {/* Category cards */}
                    {categoryData.map((cat) => {
                      const gradient = categoryGradients[cat.name] || 'from-emerald-500 to-teal-600'
                      const IconComponent = categoryIcons[cat.name] || BookOpen
                      const isActive = filters.categories.includes(cat.name)
                      return (
                        <motion.button
                          key={cat.name}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            onFilterChange({
                              categories: isActive
                                ? filters.categories.filter((c) => c !== cat.name)
                                : [...filters.categories, cat.name]
                            })
                          }}
                          className={cn(
                            'shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl transition-all duration-200 min-w-[80px] border',
                            isActive
                              ? `bg-gradient-to-br ${gradient} text-white border-transparent ios-shadow-sm`
                              : 'bg-card border-border/30 hover:border-primary/30 text-muted-foreground'
                          )}
                        >
                          <IconComponent className="size-5" />
                          <span className="text-[11px] font-semibold">{cat.name}</span>
                          <span className={cn(
                            'text-[10px] tabular-nums',
                            isActive ? 'text-white/70' : 'text-muted-foreground/60'
                          )}>
                            {cat.count}
                          </span>
                        </motion.button>
                      )
                    })}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>

              {/* Carousel Sections or Filtered Results */}
              {isFiltering ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="py-4"
                >
                  {/* Active Filter Pills */}
                  <AnimatePresence>
                    {activeFilterPills.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 overflow-hidden"
                      >
                        <div className="flex items-center flex-wrap gap-2">
                          {activeFilterPills.map((pill) => (
                            <motion.span
                              key={pill.key}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-[12px] font-medium"
                            >
                              {pill.label}
                              <button
                                onClick={pill.onRemove}
                                className="ml-0.5 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                              >
                                <X className="size-3" />
                              </button>
                            </motion.span>
                          ))}
                          <button
                            onClick={clearAllFilters}
                            className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                          >
                            Clear all
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Results count */}
                  <div className="mb-4 flex items-center gap-2">
                    <span className="text-[13px] text-muted-foreground">
                      <span className="font-semibold text-foreground">{pagination.total.toLocaleString()}</span> results found
                    </span>
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[11px] rounded-full bg-primary/10 text-primary">
                        {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>

                  {/* Error State */}
                  {error && (
                    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 p-8 text-center border border-rose-200 dark:border-rose-800/30">
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/30">
                        <SearchX className="size-7 text-rose-500" />
                      </div>
                      <p className="text-[14px] text-rose-700 dark:text-rose-300">{error}</p>
                      <Button variant="outline" size="sm" className="rounded-full" onClick={fetchCourses}>
                        <RefreshCw className="size-3.5 mr-1.5" />
                        Try Again
                      </Button>
                    </div>
                  )}

                  {/* Loading Skeletons */}
                  {!error && loading && (
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <CourseCardSkeleton key={i} viewMode="grid" />
                      ))}
                    </div>
                  )}

                  {/* Empty State */}
                  {!error && !loading && courses.length === 0 && (
                    <EmptyState
                      onBrowseAll={clearAllFilters}
                      onClearFilters={clearAllFilters}
                    />
                  )}

                  {/* Filtered Course Cards - Simple Grid */}
                  {!error && !loading && courses.length > 0 && (
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                      {courses.slice(0, 12).map((course, i) => {
                        const isCompareSelected = compareIds.includes(course.id)
                        return (
                          <CourseCardGrid
                            key={course.id}
                            course={course}
                            index={i}
                            onEnroll={handleEnroll}
                            onWishlist={handleWishlist}
                            onCourseClick={handleCourseClick}
                            onQuickPreview={handleQuickPreview}
                            onCompareToggle={handleCompareToggle}
                            isCompareSelected={isCompareSelected}
                            onShare={handleShare}
                          />
                        )
                      })}
                    </div>
                  )}

                  {/* Show more hint if there are more results */}
                  {!error && !loading && pagination.total > 12 && (
                    <div className="mt-6 text-center">
                      <p className="text-[12px] text-muted-foreground">
                        Showing top 12 of {pagination.total.toLocaleString()} results
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Featured Courses */}
                  <CourseCarouselRow
                    title="Featured Courses"
                    subtitle={featuredSection?.reason || 'Handpicked by our team'}
                    sectionKey="featured"
                    courses={featuredSection?.courses || []}
                    loading={catalogLoading}
                    onCourseClick={handleCourseClick}
                    onWishlist={handleWishlist}
                    onEnroll={handleEnroll}
                    onViewAll={() => handleCarouselViewAll('featured')}
                  />

                  {/* Top Courses */}
                  <CourseCarouselRow
                    title="Top Courses"
                    subtitle={topSection?.reason || 'Highest rated & most popular'}
                    sectionKey="top"
                    courses={topSection?.courses || []}
                    loading={catalogLoading}
                    onCourseClick={handleCourseClick}
                    onWishlist={handleWishlist}
                    onEnroll={handleEnroll}
                    onViewAll={() => handleCarouselViewAll('top')}
                  />

                  {/* Recommended Courses */}
                  <CourseCarouselRow
                    title="Recommended For You"
                    subtitle={recommendedSection?.reason || 'Courses picked for you'}
                    sectionKey="recommended"
                    courses={recommendedSection?.courses || []}
                    loading={catalogLoading}
                    onCourseClick={handleCourseClick}
                    onWishlist={handleWishlist}
                    onEnroll={handleEnroll}
                    onViewAll={() => handleCarouselViewAll('recommended')}
                  />

                  {/* Category Rows — Top 5 categories */}
                  {categorySections.map((catSection) => (
                    <CourseCarouselRow
                      key={catSection.name}
                      title={`${catSection.icon} ${catSection.name}`}
                      subtitle={catSection.section?.reason || `Top ${catSection.name} courses`}
                      sectionKey="category"
                      courses={catSection.section?.courses || []}
                      loading={catalogLoading}
                      onCourseClick={handleCourseClick}
                      onWishlist={handleWishlist}
                      onEnroll={handleEnroll}
                      onViewAll={() => handleCarouselViewAll('category', catSection.name)}
                      categoryIcon={catSection.icon}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <CoursesFooter />

      {/* ═══ Quick Preview Dialog ═══ */}
      <QuickPreviewDialog
        course={previewCourse}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onEnroll={handleEnroll}
        onCourseClick={handleCourseClick}
      />

      {/* ═══ Compare Dialog ═══ */}
      <CompareDialog
        courses={compareCourses}
        open={compareDialogOpen}
        onOpenChange={setCompareDialogOpen}
        onRemove={handleCompareRemove}
        onClearAll={handleCompareClearAll}
        onCourseClick={handleCourseClick}
      />

      {/* ═══ Compare Floating Bar ═══ */}
      <AnimatePresence>
        {compareIds.length > 0 && (
          <CompareFloatingBar
            selectedCourses={compareCourses}
            onOpenCompare={() => setCompareDialogOpen(true)}
            onRemove={handleCompareRemove}
            onClearAll={handleCompareClearAll}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
