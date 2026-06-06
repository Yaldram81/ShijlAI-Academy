'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { PublicNav } from '@/components/public-nav'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Star,
  Users,
  Clock,
  BookOpen,
  Video,
  FileText,
  HelpCircle,
  PlayCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
  GraduationCap,
  Award,
  Shield,
  CheckCircle2,
  Globe,
  Play,
  Lock,
  ArrowRight,
  Heart,
  Share2,
  Copy,
  Gift,
  Smartphone,
  Tv,
  Infinity,
  MessageSquare,
  ThumbsUp,
  ChevronUp,
  Tag,
  Sparkles,
  BadgeCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import type { Module } from '@/lib/types'

// ─── Constants & Types ──────────────────────────────────────────────────────

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

interface PublicLesson {
  id: string
  title: string
  description: string | null
  type: string
  duration: number
  order: number
  videoUrl: string | null
  moduleId: string
  createdAt: string
  updatedAt: string
}

interface PublicModule extends Omit<Module, 'lessons'> {
  lessons: PublicLesson[]
}

interface PublicCourseDetail {
  id: string
  title: string
  description: string
  category: string
  level: string
  language: string
  thumbnail: string | null
  price: number
  isPublished: boolean
  enrollmentCount: number
  rating: number
  createdAt: string
  updatedAt: string
  instructorId: string
  instructor: {
    id: string
    name: string
    avatar: string | null
    bio: string | null
    _count: { coursesCreated: number }
  }
  modules: PublicModule[]
  _count: { enrollments: number; modules: number }
  totalMinutes: number
  totalLessons: number
  instructorStats: {
    coursesCreated: number
    totalStudents: number
    averageRating: number
  }
  freePreviewLesson: {
    id: string
    title: string
    content: string
  } | null
  learningObjectives?: string
  prerequisites?: string
  targetAudience?: string
  tags?: string[]
  estimatedDuration?: number
  certificateEnabled?: boolean
  completionThreshold?: number
}

interface Review {
  id: string
  userName: string
  avatar: string | null
  rating: number
  date: string
  content: string
  helpful: number
}

const lessonTypeIcons: Record<string, React.ReactNode> = {
  video: <Video className="size-4 text-rose-500" />,
  text: <FileText className="size-4 text-sky-500" />,
  interactive: <PlayCircle className="size-4 text-amber-500" />,
  quiz: <HelpCircle className="size-4 text-violet-500" />,
}

const levelColors: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-red-100 text-red-700',
}

const languageLabels: Record<string, string> = {
  en: 'English',
  ur: '\u0627\u0631\u062F\u0648',
}

const categoryGradients: Record<string, string> = {
  IB: 'from-emerald-600 to-teal-700',
  Programming: 'from-teal-600 to-emerald-700',
  'O-Levels': 'from-emerald-500 to-teal-600',
  'A-Levels': 'from-teal-500 to-emerald-600',
  IELTS: 'from-emerald-700 to-teal-800',
  AWS: 'from-teal-700 to-emerald-800',
}

type TabId = 'overview' | 'curriculum' | 'instructor' | 'reviews'

const faqItems = [
  { q: 'What will I learn in this course?', a: 'This course covers comprehensive topics from fundamentals to advanced concepts. You\'ll gain practical, hands-on experience through real-world projects and exercises, preparing you for real applications of the knowledge.' },
  { q: 'Is there a certificate of completion?', a: 'Yes! Upon completing all required lessons and achieving the minimum completion threshold, you\'ll receive a verified certificate of completion that you can share on LinkedIn and with potential employers.' },
  { q: 'How long do I have access to the course?', a: 'You get full lifetime access to the course content, including any future updates. Once you enroll, the course is yours forever.' },
  { q: 'Can I access the course on mobile devices?', a: 'Absolutely! Our platform is fully responsive and works on all devices including smartphones, tablets, and desktop computers. Learn anywhere, anytime.' },
  { q: 'What if I\'m not satisfied with the course?', a: 'We offer a 30-day money-back guarantee. If you\'re not completely satisfied with the course within the first 30 days of purchase, you can request a full refund.' },
  { q: 'Are there any prerequisites?', a: 'Prerequisites vary by course level. Beginner courses require no prior knowledge, while intermediate and advanced courses may require foundational understanding. Check the requirements section for details.' },
]

// Sample reviews for placeholder
const sampleReviews: Review[] = [
  { id: '1', userName: 'Ahmed Khan', avatar: null, rating: 5, date: '2025-12-15', content: 'Excellent course! The instructor explains everything clearly and the hands-on projects really helped solidify my understanding. Highly recommended for anyone starting out.', helpful: 24 },
  { id: '2', userName: 'Sara Ali', avatar: null, rating: 5, date: '2025-11-28', content: 'Best investment I\'ve made in my education. The curriculum is well-structured and the content quality is top-notch. I went from beginner to confident in just a few weeks.', helpful: 18 },
  { id: '3', userName: 'Usman Malik', avatar: null, rating: 4, date: '2025-11-10', content: 'Great course overall. The video quality is excellent and the explanations are thorough. I would have liked a few more advanced exercises, but the content covered is comprehensive.', helpful: 12 },
  { id: '4', userName: 'Fatima Noor', avatar: null, rating: 5, date: '2025-10-22', content: 'This course exceeded my expectations. The step-by-step approach makes complex topics easy to understand. The certificate of completion was a nice bonus too!', helpful: 31 },
  { id: '5', userName: 'Hassan Raza', avatar: null, rating: 4, date: '2025-10-05', content: 'Very informative and well-paced. The quizzes after each section helped me check my understanding. Would definitely take another course from this instructor.', helpful: 9 },
]

// ─── Helper Functions ────────────────────────────────────────────────────────

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

function formatHours(minutes: number): string {
  return `${Math.round(minutes / 60 * 10) / 10}`
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function getInitials(name: string): string {
  return name.trim().split(/\s+/).filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function parseJSONField<T>(field: string | null | undefined, fallback: T): T {
  if (!field) return fallback
  try {
    return JSON.parse(field) as T
  } catch {
    return fallback
  }
}

// Wishlist helpers
function getWishlist(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem('shijlai-wishlist') || '[]')
  } catch {
    return []
  }
}

function toggleWishlistItem(courseId: string): boolean {
  const wishlist = getWishlist()
  const isInWishlist = wishlist.includes(courseId)
  if (isInWishlist) {
    localStorage.setItem('shijlai-wishlist', JSON.stringify(wishlist.filter(id => id !== courseId)))
    return false
  } else {
    localStorage.setItem('shijlai-wishlist', JSON.stringify([...wishlist, courseId]))
    return true
  }
}

// ─── Star Rating Component ──────────────────────────────────────────────────

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'size-6' : size === 'md' ? 'size-5' : 'size-4'
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const fill = rating - i
        return (
          <Star
            key={i}
            className={cn(
              sizeClass,
              fill >= 1
                ? 'fill-amber-400 text-amber-400'
                : fill > 0
                  ? 'fill-amber-400/50 text-amber-400'
                  : 'fill-muted-foreground/20 text-muted-foreground/20'
            )}
          />
        )
      })}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function PublicCourseDetailView() {
  const { selectedCourse, setCurrentView, isAuthenticated, currentUser, setEnrollments } = useAppStore()
  const [course, setCourse] = useState<PublicCourseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [expandedModules, setExpandedModules] = useState<string[]>([])
  const [enrolling, setEnrolling] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [descriptionExpanded, setDescriptionExpanded] = useState(false)

  const fetchCourse = useCallback(async () => {
    if (!selectedCourse) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/courses/${selectedCourse.id}/public`)
      if (!res.ok) throw new Error('Failed to fetch course')
      const data = await res.json()
      setCourse(data.course)
      if (data.course?.modules?.length) {
        setExpandedModules([data.course.modules[0].id])
      }
    } catch {
      setError('Failed to load course details.')
    } finally {
      setLoading(false)
    }
  }, [selectedCourse])

  useEffect(() => {
    fetchCourse()
  }, [fetchCourse])

  // Initialize wishlist state
  useEffect(() => {
    if (selectedCourse) {
      setIsWishlisted(getWishlist().includes(selectedCourse.id))
    }
  }, [selectedCourse])

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      setCurrentView('register')
      return
    }
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
      setCurrentView('course-detail')
    } catch (err) {
      console.error('Enrollment error:', err)
      toast.error('Failed to enroll. Please try again.')
    } finally {
      setEnrolling(false)
    }
  }

  const handleWishlist = () => {
    if (!selectedCourse) return
    const added = toggleWishlistItem(selectedCourse.id)
    setIsWishlisted(added)
    toast.success(added ? 'Added to wishlist' : 'Removed from wishlist')
  }

  const handleShare = () => {
    setShareOpen(true)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied to clipboard!')
    setShareOpen(false)
  }

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) return
    // Simulated coupon logic
    if (couponCode.toUpperCase() === 'LEARN2025') {
      setCouponApplied(true)
      toast.success('Coupon applied! 20% discount')
    } else {
      toast.error('Invalid coupon code')
    }
  }

  const handleBack = () => {
    setCurrentView('public-courses')
  }

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    )
  }

  const expandAll = () => {
    if (!course) return
    setExpandedModules(course.modules.map(m => m.id))
  }

  const collapseAll = () => {
    setExpandedModules([])
  }

  // ─── Computed Values (must be before early returns for hooks rules) ────

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
    const reqs: string[] = []
    if (course.level === 'intermediate' || course.level === 'advanced') {
      reqs.push('Basic understanding of the subject')
    }
    if (course.level === 'advanced') {
      reqs.push('Prior experience with foundational concepts')
    }
    reqs.push('A device with internet access')
    reqs.push('Enthusiasm and dedication to learn')
    return reqs
  }, [course])

  const targetAudience = useMemo(() => {
    if (!course) return []
    const parsed = parseJSONField<string[] | null>(course.targetAudience, null)
    if (parsed && parsed.length > 0) return parsed
    return [
      `Students interested in ${course.category}`,
      `${course.level === 'beginner' ? 'Beginners' : course.level === 'intermediate' ? 'Intermediate learners' : 'Advanced practitioners'} looking to improve their skills`,
      'Anyone preparing for exams or certifications',
      'Professionals seeking to expand their knowledge',
    ]
  }, [course])

  const tags = useMemo(() => {
    if (!course) return []
    const parsed = parseJSONField<string[] | null>(course.tags as unknown as string | null, null)
    if (parsed && parsed.length > 0) return parsed
    return [course.category, course.level, course.language === 'en' ? 'English' : 'Multilingual', 'Online Learning']
  }, [course])

  // ─── Loading State ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <PublicNav activeView="public-course-detail" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
          <Skeleton className="h-8 w-32 rounded-xl" />
          <div className="h-72 w-full rounded-2xl bg-gradient-to-r from-emerald-100 to-teal-100 animate-pulse" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-12 w-64 rounded-xl" />
              <Skeleton className="h-6 w-full rounded-lg" />
              <Skeleton className="h-6 w-3/4 rounded-lg" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
            <Skeleton className="h-[500px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  // ─── Error State ────────────────────────────────────────────────────────

  if (error || !course) {
    return (
      <div className="min-h-screen bg-white">
        <PublicNav activeView="public-course-detail" />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-auto max-w-7xl px-4 sm:px-6 py-20 flex flex-col items-center justify-center gap-4 text-center"
        >
          <div className="flex size-20 items-center justify-center rounded-full bg-red-50">
            <BookOpen className="size-10 text-red-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-foreground">Course Not Found</h3>
            <p className="text-muted-foreground max-w-md">{error || 'Unable to load course details. The course may have been removed or is temporarily unavailable.'}</p>
          </div>
          <Button variant="outline" className="rounded-full mt-2" onClick={handleBack}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Courses
          </Button>
        </motion.div>
      </div>
    )
  }

  // ─── Remaining Computed Values ─────────────────────────────────────────

  const gradient = categoryGradients[course.category] || 'from-emerald-600 to-teal-700'
  const totalHours = formatHours(course.totalMinutes)
  const videoLessonCount = course.modules.reduce((acc, mod) => acc + mod.lessons.filter(l => l.type === 'video').length, 0)
  const textLessonCount = course.modules.reduce((acc, mod) => acc + mod.lessons.filter(l => l.type === 'text').length, 0)
  const quizLessonCount = course.modules.reduce((acc, mod) => acc + mod.lessons.filter(l => l.type === 'quiz').length, 0)
  const totalVideoMinutes = course.modules.reduce(
    (acc, mod) => acc + mod.lessons.filter(l => l.type === 'video').reduce((a, l) => a + l.duration, 0), 0
  )
  const totalVideoHours = formatHours(totalVideoMinutes)
  const originalPrice = course.price > 0 ? Math.round(course.price * 1.35) : 0
  const discountPercent = originalPrice > 0 ? Math.round((1 - course.price / originalPrice) * 100) : 0
  const displayPrice = couponApplied ? Math.round(course.price * 0.8) : course.price

  const studentCount = course._count.enrollments || course.enrollmentCount
  const allExpanded = course.modules.length > 0 && expandedModules.length === course.modules.length

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'curriculum', label: 'Curriculum', count: course.totalLessons },
    { id: 'instructor', label: 'Instructor' },
    { id: 'reviews', label: 'Reviews' },
  ]

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicNav activeView="public-course-detail" />

      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className={cn('absolute inset-0 bg-gradient-to-br', gradient)} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
          {/* Back button + Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-[14px] font-medium text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back to Courses
            </button>
            <div className="flex items-center gap-1.5 mt-2 text-[13px] text-white/60">
              <button onClick={() => setCurrentView('public-courses')} className="hover:text-white transition-colors">Courses</button>
              <ChevronRight className="size-3" />
              <span>{course.category}</span>
              <ChevronRight className="size-3" />
              <span className="text-white/90 truncate max-w-[200px]">{course.title}</span>
            </div>
          </motion.div>

          <div className="flex flex-col lg:flex-row lg:items-start lg:gap-12">
            {/* Left content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1 min-w-0"
            >
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className="rounded-full bg-white/20 text-white text-[11px] font-semibold border-0 backdrop-blur-sm hover:bg-white/30">
                  {course.category}
                </Badge>
                <Badge className={cn('rounded-full text-[11px] font-semibold border-0', levelColors[course.level])}>
                  {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                </Badge>
                <Badge className="rounded-full bg-white/20 text-white text-[11px] font-semibold border-0 backdrop-blur-sm hover:bg-white/30 flex items-center gap-1">
                  <Globe className="size-3" />
                  {languageLabels[course.language] || course.language}
                </Badge>
              </div>

              {/* Title */}
              <h1 className="text-[28px] sm:text-[36px] lg:text-[40px] font-bold text-white leading-tight tracking-tight">
                {course.title}
              </h1>

              {/* Rating and stats */}
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[14px] text-white/80">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-300 text-[16px]">{course.rating.toFixed(1)}</span>
                  <StarRating rating={course.rating} size="sm" />
                  <span className="text-white/60">({studentCount.toLocaleString()})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="size-4" />
                  <span>{studentCount.toLocaleString()} students</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="size-4" />
                  <span>{totalHours} hours</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BookOpen className="size-4" />
                  <span>{course.totalLessons} lessons</span>
                </div>
              </div>

              {/* Instructor mini-card */}
              <div className="mt-5 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-[13px] font-bold text-white ring-2 ring-white/20">
                  {course.instructor.avatar ? (
                    <img src={course.instructor.avatar} alt={course.instructor.name} className="size-10 rounded-full object-cover" />
                  ) : (
                    getInitials(course.instructor.name)
                  )}
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-white">{course.instructor.name}</p>
                  <p className="text-[13px] text-white/70">Course Instructor · {course.instructorStats.coursesCreated} course{course.instructorStats.coursesCreated !== 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Last updated */}
              <p className="mt-3 text-[12px] text-white/50">
                Last updated {formatDate(course.updatedAt)}
              </p>

              {/* Mobile price + CTA */}
              <div className="mt-6 lg:hidden">
                <div className="flex items-center gap-3">
                  <span className="text-[28px] font-bold text-white">
                    {displayPrice === 0 ? 'Free' : `\u20A8${displayPrice.toLocaleString()}`}
                  </span>
                  {originalPrice > 0 && (
                    <span className="text-[16px] text-white/50 line-through">
                      \u20A8{originalPrice.toLocaleString()}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <Badge className="bg-amber-400 text-amber-900 border-0 rounded-full text-[11px] font-bold">
                      {discountPercent}% OFF
                    </Badge>
                  )}
                </div>
                <Button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full mt-4 rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 h-14 text-[17px] font-bold shadow-lg"
                >
                  {enrolling ? (
                    <Loader2 className="mr-2 size-5 animate-spin" />
                  ) : (
                    <GraduationCap className="mr-2 size-5" />
                  )}
                  {isAuthenticated ? 'Enroll Now' : 'Enroll Now \u2014 Create Account'}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Main Content Area ──────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 lg:py-10 flex-1">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left content */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Tab navigation */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-1 border-b border-border overflow-x-auto"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative whitespace-nowrap px-5 py-3 text-[14px] font-medium transition-colors',
                    activeTab === tab.id
                      ? 'text-emerald-600'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={cn(
                      'ml-1.5 text-[11px]',
                      activeTab === tab.id ? 'text-emerald-500' : 'text-muted-foreground/60'
                    )}>
                      ({tab.count})
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"
                    />
                  )}
                </button>
              ))}
            </motion.div>

            {/* Tab content */}
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
                    descriptionExpanded={descriptionExpanded}
                    setDescriptionExpanded={setDescriptionExpanded}
                  />
                )}
                {activeTab === 'curriculum' && (
                  <CurriculumTab
                    course={course}
                    expandedModules={expandedModules}
                    toggleModule={toggleModule}
                    expandAll={expandAll}
                    collapseAll={collapseAll}
                    allExpanded={allExpanded}
                    onPreviewOpen={() => setPreviewOpen(true)}
                  />
                )}
                {activeTab === 'instructor' && (
                  <InstructorTab course={course} />
                )}
                {activeTab === 'reviews' && (
                  <ReviewsTab course={course} reviews={sampleReviews} />
                )}
              </motion.div>
            </AnimatePresence>

            {/* ─── Social Proof Section ──────────────────────────────────── */}
            <SocialProofSection course={course} />

            {/* ─── FAQ Section ───────────────────────────────────────────── */}
            <FAQSection />
          </div>

          {/* ─── Sidebar (Desktop) ────────────────────────────────────────── */}
          <div className="hidden lg:block w-[360px] shrink-0">
            <SidebarCard
              course={course}
              totalVideoHours={totalVideoHours}
              textLessonCount={textLessonCount}
              quizLessonCount={quizLessonCount}
              videoLessonCount={videoLessonCount}
              enrolling={enrolling}
              onEnroll={handleEnroll}
              isWishlisted={isWishlisted}
              onWishlist={handleWishlist}
              onShare={handleShare}
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              couponApplied={couponApplied}
              onApplyCoupon={handleApplyCoupon}
              displayPrice={displayPrice}
              originalPrice={originalPrice}
              discountPercent={discountPercent}
            />
          </div>
        </div>
      </div>

      {/* ─── Footer CTA ────────────────────────────────────────────────────── */}
      <FooterCTA
        course={course}
        displayPrice={displayPrice}
        originalPrice={originalPrice}
        enrolling={enrolling}
        onEnroll={handleEnroll}
      />

      {/* ─── Mobile Sticky CTA ─────────────────────────────────────────────── */}
      <MobileStickyBar
        course={course}
        displayPrice={displayPrice}
        originalPrice={originalPrice}
        enrolling={enrolling}
        onEnroll={handleEnroll}
      />

      {/* ─── Free Preview Dialog ───────────────────────────────────────────── */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="size-5 text-emerald-600" />
              Free Preview: {course.freePreviewLesson?.title || 'Course Preview'}
            </DialogTitle>
            <DialogDescription>
              Get a sneak peek of the course content before enrolling.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {course.freePreviewLesson ? (
              <div
                className="prose prose-sm max-w-none text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: course.freePreviewLesson.content || '<p>Preview content available after enrollment.</p>' }}
              />
            ) : (
              <p className="text-muted-foreground">No preview content available for this course.</p>
            )}
          </div>
          <div className="mt-6 flex gap-3">
            <Button
              onClick={() => { setPreviewOpen(false); handleEnroll() }}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
            >
              <GraduationCap className="mr-2 size-4" />
              {isAuthenticated ? 'Enroll Now' : 'Sign Up & Enroll'}
            </Button>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Share Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="size-5 text-emerald-600" />
              Share This Course
            </DialogTitle>
            <DialogDescription>
              Help others discover this amazing course.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="flex gap-2">
              <Input value={typeof window !== 'undefined' ? window.location.href : ''} readOnly className="text-[13px]" />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                <Copy className="size-4" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Button variant="outline" className="h-12 text-[13px]" onClick={handleCopyLink}>
                <Copy className="mr-2 size-4" />
                Copy Link
              </Button>
              <Button variant="outline" className="h-12 text-[13px]" onClick={() => { toast.info('Shared to WhatsApp'); setShareOpen(false) }}>
                <MessageSquare className="mr-2 size-4 text-green-500" />
                WhatsApp
              </Button>
              <Button variant="outline" className="h-12 text-[13px]" onClick={() => { toast.info('Shared to Twitter'); setShareOpen(false) }}>
                <Sparkles className="mr-2 size-4 text-sky-500" />
                Twitter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Overview Tab ──────────────────────────────────────────────────────────

function OverviewTab({
  course,
  learningObjectives,
  prerequisites,
  targetAudience,
  tags,
  descriptionExpanded,
  setDescriptionExpanded,
}: {
  course: PublicCourseDetail
  learningObjectives: string[]
  prerequisites: string[]
  targetAudience: string[]
  tags: string[]
  descriptionExpanded: boolean
  setDescriptionExpanded: (v: boolean) => void
}) {
  return (
    <div className="space-y-8">
      {/* What You'll Learn */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100/50 p-6 sm:p-8"
      >
        <h2 className="text-xl font-bold flex items-center gap-2 text-emerald-800">
          <Award className="size-5 text-emerald-600" />
          What You&apos;ll Learn
        </h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {learningObjectives.map((point, i) => (
            <div key={i} className="flex items-start gap-3">
              <CheckCircle2 className="size-5 text-emerald-500 mt-0.5 shrink-0" />
              <p className="text-[14px] text-emerald-900/80 leading-relaxed">{point}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Course Description */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-border/60 bg-white p-6 sm:p-8"
      >
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BookOpen className="size-5 text-emerald-600" />
          Course Description
        </h2>
        <div className={cn(
          'mt-4 text-[15px] text-muted-foreground leading-relaxed whitespace-pre-line',
          !descriptionExpanded && 'max-h-40 overflow-hidden relative'
        )}>
          {course.description}
          {!descriptionExpanded && course.description.length > 300 && (
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
          )}
        </div>
        {course.description.length > 300 && (
          <Button
            variant="link"
            className="mt-2 p-0 h-auto text-emerald-600 font-medium"
            onClick={() => setDescriptionExpanded(!descriptionExpanded)}
          >
            {descriptionExpanded ? 'Show less' : 'Show more'}
            {descriptionExpanded ? <ChevronUp className="ml-1 size-4" /> : <ChevronDown className="ml-1 size-4" />}
          </Button>
        )}
      </motion.section>

      {/* Course Stats Bar */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border/60 bg-white p-5"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{(course._count.enrollments || course.enrollmentCount).toLocaleString()}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">Students Enrolled</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{languageLabels[course.language] || course.language}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">Language</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{formatDate(course.updatedAt)}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">Last Updated</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{course.certificateEnabled !== false ? 'Yes' : 'No'}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">Certificate</p>
          </div>
        </div>
      </motion.section>

      {/* Target Audience */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-border/60 bg-white p-6 sm:p-8"
      >
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Users className="size-5 text-emerald-600" />
          Who This Course Is For
        </h2>
        <ul className="mt-4 space-y-3">
          {targetAudience.map((aud, i) => (
            <li key={i} className="flex items-start gap-3 text-[15px] text-muted-foreground">
              <CheckCircle2 className="size-5 text-emerald-500 mt-0.5 shrink-0" />
              {aud}
            </li>
          ))}
        </ul>
      </motion.section>

      {/* Requirements */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border/60 bg-white p-6 sm:p-8"
      >
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Shield className="size-5 text-emerald-600" />
          Requirements
        </h2>
        <ul className="mt-4 space-y-3">
          {prerequisites.map((req, i) => (
            <li key={i} className="flex items-start gap-3 text-[15px] text-muted-foreground">
              <span className="size-2 rounded-full bg-emerald-400 mt-2 shrink-0" />
              {req}
            </li>
          ))}
        </ul>
      </motion.section>

      {/* Tags */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl border border-border/60 bg-white p-6 sm:p-8"
      >
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Tag className="size-5 text-emerald-600" />
          Tags
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="rounded-full px-3 py-1 text-[13px] font-medium cursor-pointer hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </motion.section>
    </div>
  )
}

// ─── Curriculum Tab ────────────────────────────────────────────────────────

function CurriculumTab({
  course,
  expandedModules,
  toggleModule,
  expandAll,
  collapseAll,
  allExpanded,
  onPreviewOpen,
}: {
  course: PublicCourseDetail
  expandedModules: string[]
  toggleModule: (id: string) => void
  expandAll: () => void
  collapseAll: () => void
  allExpanded: boolean
  onPreviewOpen: () => void
}) {
  return (
    <div className="space-y-5">
      {/* Stats summary bar */}
      <div className="rounded-xl bg-emerald-50 border border-emerald-100/50 p-4 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-emerald-600" />
          <span className="text-[14px] font-semibold text-emerald-800">{course.modules.length} Modules</span>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-emerald-600" />
          <span className="text-[14px] font-semibold text-emerald-800">{course.totalLessons} Lessons</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="size-4 text-emerald-600" />
          <span className="text-[14px] font-semibold text-emerald-800">{formatHours(course.totalMinutes)} Hours Total</span>
        </div>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            className="text-[13px] text-emerald-600 font-medium"
            onClick={allExpanded ? collapseAll : expandAll}
          >
            {allExpanded ? 'Collapse All' : 'Expand All'}
            <ChevronDown className={cn('ml-1 size-4 transition-transform', allExpanded && 'rotate-180')} />
          </Button>
        </div>
      </div>

      {/* Module accordion */}
      <div className="space-y-3">
        {course.modules.map((mod, modIndex) => {
          const moduleLessons = mod.lessons
          const moduleDuration = moduleLessons.reduce((acc, l) => acc + l.duration, 0)
          const isExpanded = expandedModules.includes(mod.id)
          const isFirstModule = modIndex === 0

          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: modIndex * 0.03 }}
              className="rounded-xl border border-border/60 bg-white overflow-hidden"
            >
              {/* Module header */}
              <button
                onClick={() => toggleModule(mod.id)}
                className="flex w-full items-center gap-3 p-4 sm:p-5 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[13px] font-bold shrink-0">
                  {modIndex + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold truncate">{mod.title}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {moduleLessons.length} lesson{moduleLessons.length !== 1 ? 's' : ''} &middot; {formatMinutes(moduleDuration)}
                  </p>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={springTransition}
                >
                  <ChevronDown className="size-5 text-muted-foreground shrink-0" />
                </motion.div>
              </button>

              {/* Lessons list */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={springTransition}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/40">
                      {moduleLessons.map((lesson, lessonIndex) => {
                        const isFreePreview = isFirstModule && lessonIndex === 0
                        return (
                          <div
                            key={lesson.id}
                            className={cn(
                              'flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-gray-50/50 transition-colors',
                              isFreePreview && 'cursor-pointer'
                            )}
                            onClick={isFreePreview ? onPreviewOpen : undefined}
                          >
                            <div className="shrink-0">
                              {isFreePreview ? (
                                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100">
                                  <Play className="size-4 text-emerald-600" />
                                </div>
                              ) : (
                                <div className="flex size-8 items-center justify-center rounded-lg bg-gray-100">
                                  {lessonTypeIcons[lesson.type] || <FileText className="size-4 text-gray-400" />}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[14px] font-medium truncate">{lesson.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-muted-foreground">{formatMinutes(lesson.duration)}</span>
                                <span className="text-[11px] text-muted-foreground capitalize">{lesson.type}</span>
                              </div>
                            </div>
                            {isFreePreview ? (
                              <Badge className="text-[10px] font-bold bg-emerald-100 text-emerald-700 border-0 rounded-full px-2.5 py-0.5 hover:bg-emerald-200">
                                Free Preview
                              </Badge>
                            ) : (
                              <Lock className="size-4 text-gray-300 shrink-0" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Total curriculum summary */}
      <div className="rounded-xl bg-gray-50 border border-border/40 p-5 text-center">
        <p className="text-[14px] text-muted-foreground">
          <span className="font-semibold text-foreground">{course.modules.length}</span> modules &middot;{' '}
          <span className="font-semibold text-foreground">{course.totalLessons}</span> lessons &middot;{' '}
          <span className="font-semibold text-foreground">{formatHours(course.totalMinutes)}</span> hours of content
        </p>
      </div>
    </div>
  )
}

// ─── Instructor Tab ────────────────────────────────────────────────────────

function InstructorTab({ course }: { course: PublicCourseDetail }) {
  const { setCurrentView } = useAppStore()
  const stats = course.instructorStats

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border/60 bg-white p-6 sm:p-8"
      >
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar with gradient ring */}
          <div className="p-[3px] rounded-full bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 shrink-0">
            {course.instructor.avatar ? (
              <img
                src={course.instructor.avatar}
                alt={course.instructor.name}
                className="size-24 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-24 items-center justify-center rounded-full bg-white text-[32px] font-bold text-emerald-600">
                {getInitials(course.instructor.name)}
              </div>
            )}
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{course.instructor.name}</h2>
              <BadgeCheck className="size-5 text-emerald-500" />
            </div>
            <p className="text-[15px] text-emerald-600 font-medium">Course Instructor</p>
            {course.instructor.bio && (
              <p className="text-[15px] text-muted-foreground leading-relaxed mt-2">{course.instructor.bio}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl bg-emerald-50 border border-emerald-100/50 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{stats.coursesCreated}</p>
            <p className="text-[12px] text-muted-foreground mt-1">Courses Created</p>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-100/50 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">{stats.totalStudents.toLocaleString()}</p>
            <p className="text-[12px] text-muted-foreground mt-1">Total Students</p>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-100/50 p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <p className="text-2xl font-bold text-emerald-700">{stats.averageRating}</p>
              <Star className="size-4 fill-amber-400 text-amber-400" />
            </div>
            <p className="text-[12px] text-muted-foreground mt-1">Average Rating</p>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-100/50 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-700">&lt; 24h</p>
            <p className="text-[12px] text-muted-foreground mt-1">Response Time</p>
          </div>
        </div>

        <Button
          variant="outline"
          className="mt-6 rounded-xl w-full h-12 text-[15px] font-medium border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          onClick={() => setCurrentView('public-courses')}
        >
          <BookOpen className="mr-2 size-4" />
          View All Courses by This Instructor
        </Button>
      </motion.div>
    </div>
  )
}

// ─── Reviews Tab ───────────────────────────────────────────────────────────

function ReviewsTab({ course, reviews }: { course: PublicCourseDetail; reviews: Review[] }) {
  const [filter, setFilter] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)
  const studentCount = course._count.enrollments || course.enrollmentCount

  // Rating distribution (simulated based on average)
  const distribution = useMemo(() => {
    const r = course.rating
    return [
      { stars: 5, percent: Math.round(50 + (r - 3) * 15) },
      { stars: 4, percent: Math.round(25 + (r - 3) * 5) },
      { stars: 3, percent: Math.round(12 - (r - 3) * 3) },
      { stars: 2, percent: Math.round(8 - (r - 3) * 2) },
      { stars: 1, percent: Math.round(5 - (r - 3) * 1) },
    ].map(d => ({ ...d, percent: Math.max(0, Math.min(100, d.percent)) }))
  }, [course.rating])

  const filteredReviews = filter
    ? reviews.filter(r => r.rating === filter)
    : reviews

  const displayedReviews = showAll ? filteredReviews : filteredReviews.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Rating summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border/60 bg-white p-6 sm:p-8"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10">
          {/* Big number */}
          <div className="text-center shrink-0">
            <p className="text-[56px] font-bold text-foreground leading-none">{course.rating.toFixed(1)}</p>
            <StarRating rating={course.rating} size="md" />
            <p className="text-[14px] text-muted-foreground mt-2">
              {studentCount.toLocaleString()} ratings
            </p>
          </div>

          {/* Distribution bars */}
          <div className="flex-1 w-full space-y-2">
            {distribution.map(({ stars, percent }) => (
              <button
                key={stars}
                onClick={() => setFilter(filter === stars ? null : stars)}
                className={cn(
                  'flex items-center gap-2 w-full group',
                  filter === stars && 'opacity-100',
                  filter !== null && filter !== stars && 'opacity-50'
                )}
              >
                <span className="text-[13px] text-muted-foreground w-6 text-right font-medium">{stars}</span>
                <Star className="size-3.5 fill-amber-400 text-amber-400" />
                <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.8, delay: (5 - stars) * 0.1 }}
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                  />
                </div>
                <span className="text-[12px] text-muted-foreground w-10">{percent}%</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filter pills */}
        <div className="mt-5 flex flex-wrap gap-2 pt-5 border-t border-border/40">
          <Badge
            variant={filter === null ? 'default' : 'outline'}
            className={cn(
              'rounded-full cursor-pointer',
              filter === null && 'bg-emerald-600 text-white border-0'
            )}
            onClick={() => setFilter(null)}
          >
            All
          </Badge>
          {[5, 4, 3, 2, 1].map(s => (
            <Badge
              key={s}
              variant={filter === s ? 'default' : 'outline'}
              className={cn(
                'rounded-full cursor-pointer',
                filter === s && 'bg-emerald-600 text-white border-0'
              )}
              onClick={() => setFilter(filter === s ? null : s)}
            >
              {s} Star{s !== 1 ? 's' : ''}
            </Badge>
          ))}
        </div>
      </motion.div>

      {/* Individual reviews */}
      {displayedReviews.length > 0 ? (
        <div className="space-y-4">
          {displayedReviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border/60 bg-white p-5 sm:p-6"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-[13px] font-bold text-emerald-700 shrink-0">
                  {review.avatar ? (
                    <img src={review.avatar} alt={review.userName} className="size-10 rounded-full object-cover" />
                  ) : (
                    getInitials(review.userName)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-semibold">{review.userName}</p>
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{formatDate(review.date)}</p>
                  <p className="mt-3 text-[14px] text-muted-foreground leading-relaxed">{review.content}</p>
                  <button className="mt-3 flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-emerald-600 transition-colors">
                    <ThumbsUp className="size-3.5" />
                    Helpful ({review.helpful})
                  </button>
                </div>
              </div>
            </motion.div>
          ))}

          {filteredReviews.length > 3 && (
            <Button
              variant="outline"
              className="w-full rounded-xl h-11 text-[14px] font-medium"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less' : `Show More Reviews (${filteredReviews.length - 3} more)`}
              <ChevronDown className={cn('ml-1 size-4 transition-transform', showAll && 'rotate-180')} />
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-white p-10 text-center">
          <Users className="mx-auto size-12 text-gray-200" />
          <h3 className="mt-4 text-[17px] font-semibold text-foreground">Student Reviews</h3>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Reviews will appear once students complete this course.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Sidebar Card ──────────────────────────────────────────────────────────

function SidebarCard({
  course,
  totalVideoHours,
  textLessonCount,
  quizLessonCount,
  videoLessonCount,
  enrolling,
  onEnroll,
  isWishlisted,
  onWishlist,
  onShare,
  couponCode,
  setCouponCode,
  couponApplied,
  onApplyCoupon,
  displayPrice,
  originalPrice,
  discountPercent,
}: {
  course: PublicCourseDetail
  totalVideoHours: string
  textLessonCount: number
  quizLessonCount: number
  videoLessonCount: number
  enrolling: boolean
  onEnroll: () => void
  isWishlisted: boolean
  onWishlist: () => void
  onShare: () => void
  couponCode: string
  setCouponCode: (v: string) => void
  couponApplied: boolean
  onApplyCoupon: () => void
  displayPrice: number
  originalPrice: number
  discountPercent: number
}) {
  const { isAuthenticated } = useAppStore()

  return (
    <div className="sticky top-20 space-y-4">
      {/* Price & Enroll card */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border/60 bg-white shadow-lg overflow-hidden"
      >
        {/* Thumbnail preview */}
        <div className={cn('relative h-44 bg-gradient-to-br', categoryGradients[course.category] || 'from-emerald-600 to-teal-700', 'flex items-center justify-center')}>
          {course.thumbnail ? (
            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <GraduationCap className="size-12 text-white/50 mx-auto" />
              <p className="text-[13px] text-white/50 mt-2">Course Preview</p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>

        <div className="p-6 space-y-4">
          {/* Price */}
          <div>
            <div className="flex items-baseline gap-3">
              <span className="text-[36px] font-bold text-foreground leading-none">
                {displayPrice === 0 ? 'Free' : `\u20A8${displayPrice.toLocaleString()}`}
              </span>
              {originalPrice > 0 && (
                <span className="text-[16px] text-muted-foreground line-through">
                  \u20A8{originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            {discountPercent > 0 && !couponApplied && (
              <Badge className="mt-2 bg-emerald-100 text-emerald-700 border-0 rounded-full text-[12px] font-bold">
                {discountPercent}% OFF
              </Badge>
            )}
            {couponApplied && (
              <Badge className="mt-2 bg-amber-100 text-amber-700 border-0 rounded-full text-[12px] font-bold">
                Coupon Applied \u2014 20% OFF
              </Badge>
            )}
          </div>

          {/* Enroll CTA */}
          <Button
            onClick={onEnroll}
            disabled={enrolling}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white h-14 text-[17px] font-bold shadow-md hover:shadow-lg transition-all"
          >
            {enrolling ? (
              <Loader2 className="mr-2 size-5 animate-spin" />
            ) : (
              <GraduationCap className="mr-2 size-5" />
            )}
            {isAuthenticated ? 'Enroll Now' : 'Enroll Now'}
          </Button>

          {/* Wishlist + Share */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl h-11 text-[14px] font-medium"
              onClick={onWishlist}
            >
              <Heart className={cn('mr-2 size-4', isWishlisted && 'fill-red-500 text-red-500')} />
              {isWishlisted ? 'Wishlisted' : 'Wishlist'}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-xl h-11 w-11"
              onClick={onShare}
            >
              <Share2 className="size-4" />
            </Button>
          </div>

          {!isAuthenticated && (
            <p className="text-center text-[12px] text-muted-foreground">
              You&apos;ll need to create a free account to enroll
            </p>
          )}
        </div>

        <Separator />

        {/* Course includes */}
        <div className="p-6">
          <h4 className="text-[13px] font-semibold text-foreground mb-3">This course includes:</h4>
          <ul className="space-y-3">
            {videoLessonCount > 0 && (
              <li className="flex items-center gap-3 text-[13px] text-muted-foreground">
                <Video className="size-4 text-emerald-600" />
                {totalVideoHours} hours of video content
              </li>
            )}
            {textLessonCount > 0 && (
              <li className="flex items-center gap-3 text-[13px] text-muted-foreground">
                <FileText className="size-4 text-emerald-600" />
                {textLessonCount} article{textLessonCount !== 1 ? 's' : ''}
              </li>
            )}
            {quizLessonCount > 0 && (
              <li className="flex items-center gap-3 text-[13px] text-muted-foreground">
                <HelpCircle className="size-4 text-emerald-600" />
                {quizLessonCount} quiz{quizLessonCount !== 1 ? 'zes' : ''}
              </li>
            )}
            <li className="flex items-center gap-3 text-[13px] text-muted-foreground">
              <Award className="size-4 text-emerald-600" />
              Certificate of completion
            </li>
            <li className="flex items-center gap-3 text-[13px] text-muted-foreground">
              <Infinity className="size-4 text-emerald-600" />
              Full lifetime access
            </li>
            <li className="flex items-center gap-3 text-[13px] text-muted-foreground">
              <Smartphone className="size-4 text-emerald-600" />
              Access on mobile &amp; TV
            </li>
            <li className="flex items-center gap-3 text-[13px] text-muted-foreground">
              <Globe className="size-4 text-emerald-600" />
              {languageLabels[course.language] || course.language}
            </li>
          </ul>
        </div>

        <Separator />

        {/* Coupon input */}
        <div className="p-6">
          <h4 className="text-[13px] font-semibold text-foreground mb-2">Apply Coupon</h4>
          <div className="flex gap-2">
            <Input
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="text-[13px] h-10"
              disabled={couponApplied}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-4 text-[13px] font-medium shrink-0"
              onClick={onApplyCoupon}
              disabled={couponApplied}
            >
              {couponApplied ? 'Applied' : 'Apply'}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Share + Gift */}
        <div className="p-6 flex flex-col gap-2">
          <button
            onClick={onShare}
            className="flex items-center gap-2 text-[13px] text-emerald-600 font-medium hover:text-emerald-700 transition-colors"
          >
            <Share2 className="size-4" />
            Share this course
          </button>
          <button className="flex items-center gap-2 text-[13px] text-muted-foreground font-medium hover:text-foreground transition-colors">
            <Gift className="size-4" />
            Gift this course
          </button>
        </div>
      </motion.div>

      {/* Money-back guarantee */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl bg-emerald-50 border border-emerald-100/50 p-4 flex items-center gap-3"
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 shrink-0">
          <Shield className="size-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-emerald-800">30-Day Money-Back Guarantee</p>
          <p className="text-[11px] text-emerald-600/70">Not satisfied? Get a full refund within 30 days.</p>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Social Proof Section ──────────────────────────────────────────────────

function SocialProofSection({ course }: { course: PublicCourseDetail }) {
  const { setCurrentView, setSelectedCourse } = useAppStore()

  // Related courses (hardcoded fallback)
  const relatedCourses = [
    { id: 'related-1', title: `Advanced ${course.category}`, category: course.category, rating: 4.7, students: 1250, price: Math.round(course.price * 1.2), level: 'advanced' },
    { id: 'related-2', title: `${course.category} Fundamentals`, category: course.category, rating: 4.5, students: 3200, price: Math.round(course.price * 0.8), level: 'beginner' },
    { id: 'related-3', title: `Master ${course.category} in 30 Days`, category: course.category, rating: 4.8, students: 890, price: course.price, level: 'intermediate' },
    { id: 'related-4', title: `${course.category} Practice Tests`, category: course.category, rating: 4.3, students: 560, price: Math.round(course.price * 0.5), level: 'intermediate' },
  ]

  const handleRelatedClick = (relatedCourse: typeof relatedCourses[0]) => {
    // Set the selected course so the detail page can fetch it
    setSelectedCourse({ id: relatedCourse.id } as any)
    setCurrentView('public-course-detail')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="space-y-6"
    >
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Sparkles className="size-5 text-emerald-600" />
        Students Also Viewed
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {relatedCourses.map((rc, i) => (
          <motion.div
            key={rc.id}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            onClick={() => handleRelatedClick(rc)}
            className="rounded-xl border border-border/60 bg-white p-4 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group"
          >
            <div className="flex gap-4">
              <div className={cn(
                'w-20 h-20 rounded-lg bg-gradient-to-br shrink-0 flex items-center justify-center',
                categoryGradients[rc.category] || 'from-emerald-600 to-teal-700'
              )}>
                <BookOpen className="size-6 text-white/60" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-[14px] font-semibold truncate group-hover:text-emerald-600 transition-colors">{rc.title}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[12px] font-bold text-amber-500">{rc.rating}</span>
                  <StarRating rating={rc.rating} size="sm" />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[12px] text-muted-foreground">{rc.students.toLocaleString()} students</span>
                  <span className="text-[14px] font-bold text-foreground">{rc.price === 0 ? 'Free' : `\u20A8${rc.price.toLocaleString()}`}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Featured review highlight */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100/50 p-6"
      >
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-200 text-[14px] font-bold text-emerald-700 shrink-0">
            AK
          </div>
          <div>
            <div className="flex items-center gap-2">
              <StarRating rating={5} size="sm" />
              <span className="text-[12px] text-muted-foreground">Featured Review</span>
            </div>
            <p className="mt-2 text-[14px] text-emerald-900/80 leading-relaxed italic">
              &ldquo;This course completely transformed my understanding of {course.category}. The instructor&apos;s teaching style is engaging and the content is incredibly well-structured. I went from zero knowledge to feeling confident in just a few weeks.&rdquo;
            </p>
            <p className="mt-2 text-[13px] font-semibold text-emerald-700">\u2014 Ahmed K.</p>
          </div>
        </div>
      </motion.div>
    </motion.section>
  )
}

// ─── FAQ Section ───────────────────────────────────────────────────────────

function FAQSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="space-y-5"
    >
      <h2 className="text-xl font-bold flex items-center gap-2">
        <HelpCircle className="size-5 text-emerald-600" />
        Frequently Asked Questions
      </h2>

      <Accordion type="single" collapsible className="space-y-3">
        {faqItems.map((faq, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="rounded-xl border border-border/60 bg-white px-6 data-[state=open]:border-emerald-200 data-[state=open]:bg-emerald-50/30 transition-colors"
          >
            <AccordionTrigger className="text-[15px] font-semibold text-left hover:no-underline py-4">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-[14px] text-muted-foreground leading-relaxed pb-4">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </motion.section>
  )
}

// ─── Footer CTA ────────────────────────────────────────────────────────────

function FooterCTA({
  course,
  displayPrice,
  originalPrice,
  enrolling,
  onEnroll,
}: {
  course: PublicCourseDetail
  displayPrice: number
  originalPrice: number
  enrolling: boolean
  onEnroll: () => void
}) {
  return (
    <section className="bg-gradient-to-r from-emerald-600 to-teal-700 py-16 mt-8">
      <div className="mx-auto max-w-3xl text-center px-4">
        <h2 className="text-3xl font-bold text-white">Ready to Start Learning?</h2>
        <p className="mt-3 text-emerald-100 text-[16px] max-w-lg mx-auto">
          Join {(course._count.enrollments || course.enrollmentCount).toLocaleString()}+ students already enrolled. Get lifetime access and start your journey today.
        </p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <span className="text-[36px] font-bold text-white">
            {displayPrice === 0 ? 'Free' : `\u20A8${displayPrice.toLocaleString()}`}
          </span>
          {originalPrice > 0 && (
            <span className="text-[18px] text-white/50 line-through">
              \u20A8{originalPrice.toLocaleString()}
            </span>
          )}
        </div>
        <Button
          onClick={onEnroll}
          disabled={enrolling}
          size="lg"
          className="mt-6 rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 h-14 px-10 text-[17px] font-bold shadow-lg"
        >
          {enrolling ? (
            <Loader2 className="mr-2 size-5 animate-spin" />
          ) : (
            <GraduationCap className="mr-2 size-5" />
          )}
          Enroll Now
        </Button>
        <p className="mt-4 text-[13px] text-emerald-200 flex items-center justify-center gap-1.5">
          <Shield className="size-4" />
          30-Day Money-Back Guarantee
        </p>
      </div>
    </section>
  )
}

// ─── Mobile Sticky Bar ─────────────────────────────────────────────────────

function MobileStickyBar({
  course,
  displayPrice,
  originalPrice,
  enrolling,
  onEnroll,
}: {
  course: PublicCourseDetail
  displayPrice: number
  originalPrice: number
  enrolling: boolean
  onEnroll: () => void
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-border/40 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] p-3 lg:hidden">
      <div className="flex items-center gap-3 max-w-7xl mx-auto">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-[20px] font-bold text-foreground">
              {displayPrice === 0 ? 'Free' : `\u20A8${displayPrice.toLocaleString()}`}
            </span>
            {originalPrice > 0 && (
              <span className="text-[13px] text-muted-foreground line-through">
                \u20A8{originalPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <Button
          onClick={onEnroll}
          disabled={enrolling}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white h-12 px-6 text-[15px] font-bold shadow-md"
        >
          {enrolling ? (
            <Loader2 className="mr-2 size-5 animate-spin" />
          ) : (
            <GraduationCap className="mr-2 size-5" />
          )}
          Enroll Now
        </Button>
      </div>
    </div>
  )
}
