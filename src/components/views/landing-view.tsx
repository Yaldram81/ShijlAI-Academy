'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, useInView } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { PublicNav } from '@/components/public-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CourseCarouselRow } from '@/components/course-carousel-row'
import type { Course } from '@/lib/types'
import { ShijlAIBrand, ShijlAIText } from '@/components/ui/brand-text'
import { ShijlAILogo } from '@/components/ui/shijlai-logo'
import { PublicFooter } from '@/components/layout/public-footer'
import {
  Brain, Bot, Sparkles, Trophy, GraduationCap, Star,
  ArrowRight, Play, Users, BookOpen, Award, Zap,
  Globe, Clock, Shield, CheckCircle,
  MessageCircle, Quote, Flame, Twitter, Linkedin,
  Youtube, Github, Mail, TrendingUp, UserPlus, Target,
  Code, Cpu, Languages, BarChart3, Eye
} from 'lucide-react'

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

// Animated counter hook
function useCountUp(end: number, duration = 2000) {
  const [count, setCount] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inView = useInView(containerRef, { once: true })

  useEffect(() => {
    if (!inView) return
    let start = 0
    const increment = end / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [inView, end, duration])

  return { count, containerRef }
}

// Hero Section
function HeroSection({ studentCount }: { studentCount?: number }) {
  const { setCurrentView, isAuthenticated } = useAppStore()
  return (
    <section className="relative overflow-hidden pt-4 sm:pt-6 lg:pt-8 pb-10 sm:pb-14">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50/30 to-transparent dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-transparent" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-4 py-1.5 text-[13px] font-medium text-emerald-700 dark:text-emerald-400">
              <Zap className="size-3.5" />
              The World&apos;s #1 AI Learning Platform
            </div>
            <h1 className="text-[34px] sm:text-[44px] lg:text-[52px] font-bold tracking-tight leading-[1.1]">
              Learn Smarter,{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                Not Harder
              </span>
              {' '}— Powered by AI
            </h1>
            <p className="text-[17px] text-muted-foreground leading-relaxed max-w-lg">
              Personalized learning paths, 24/7 AI assistance, and gamified experiences designed for students worldwide. Master IB, AP, Cambridge, IELTS, and more.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {isAuthenticated ? (
                <Button
                  size="lg"
                  onClick={() => setCurrentView('dashboard')}
                  className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl transition-all ios-press h-12 px-8 text-[15px] font-semibold"
                >
                  Continue Learning
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    onClick={() => setCurrentView('register')}
                    className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl transition-all ios-press h-12 px-8 text-[15px] font-semibold"
                  >
                    Get Started Free
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full h-12 px-8 text-[15px] font-medium ios-press border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                  >
                    <Play className="size-4 text-primary" />
                    Watch Demo
                  </Button>
                </>
              )}
            </div>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-2">
                {['SA', 'AK', 'FH', 'MR'].map((initials, i) => (
                  <div
                    key={i}
                    className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-[10px] font-bold text-white ring-2 ring-background"
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <div className="text-[13px]">
                <span className="font-semibold text-foreground">{studentCount !== undefined ? (studentCount - 1).toLocaleString() : '...'}</span>{'+ '}
                <span className="text-muted-foreground">students already learning</span>
              </div>
            </div>
          </motion.div>

          {/* Animated mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              {/* Main card */}
              <div className="rounded-3xl ios-shadow-lg bg-card p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <Brain className="size-5" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold">Ask <span style={{ fontFamily: "ScriptMTBold, cursive", fontWeight: "bold" }}>Shijl</span><span style={{ fontFamily: "LatinModernRoman, serif", fontWeight: "bold" }}>AI</span> Active</p>
                    <p className="text-[11px] text-muted-foreground">Personalized session in progress</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-1">
                    <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Live</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-accent/50 p-4 space-y-2">
                  <div className="flex gap-2 justify-end">
                    <div className="rounded-2xl rounded-tr-md bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-3 max-w-[80%]">
                      <p className="text-[13px]">What&apos;s the derivative of x²?</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="size-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                      <Bot className="size-3.5 text-white" />
                    </div>
                    <div className="flex-1 rounded-2xl rounded-tl-md bg-card ios-shadow-sm p-3">
                      <p className="text-[13px]">Great question! The derivative of x² is 2x. Here&apos;s a step-by-step explanation...</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: Trophy, label: '1,250 XP', sub: 'Earned today' },
                    { icon: Flame, label: '7 Day', sub: 'Streak' },
                    { icon: Award, label: 'Level 5', sub: 'Rank' },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl bg-accent/40 p-2.5 text-center">
                      <stat.icon className="size-4 text-primary mx-auto" />
                      <p className="text-[13px] font-bold mt-1">{stat.label}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating badges */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-4 -right-4 rounded-2xl ios-shadow bg-card p-3 flex items-center gap-2"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40">
                  <Trophy className="size-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold">Badge Unlocked!</p>
                  <p className="text-[10px] text-muted-foreground">7-Day Streak</p>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -bottom-3 -left-3 rounded-2xl ios-shadow bg-card p-3 flex items-center gap-2"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40">
                  <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold">AI Adaptive</p>
                  <p className="text-[10px] text-muted-foreground">Smart learning</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// Stat counter item (extracted to avoid hooks-in-callback issue)
function StatCounterItem({ stat, index }: { stat: { value: number; suffix: string; label: string; icon: React.ComponentType<{ className?: string }>; decimal?: boolean }; index: number }) {
  const { count, containerRef } = useCountUp(stat.decimal ? Math.round(stat.value * 10) : stat.value, 2000)
  const displayValue = stat.decimal
    ? (count / 10).toFixed(1)
    : count.toLocaleString()

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ ...springTransition, delay: index * 0.1 }}
      className="text-center"
    >
      <stat.icon className="size-6 text-white/80 mx-auto mb-2" />
      <p className="text-[34px] sm:text-[40px] font-bold text-white">
        {displayValue}{stat.suffix}
      </p>
      <p className="text-[13px] font-medium text-emerald-200">{stat.label}</p>
    </motion.div>
  )
}

// Social Proof Stats
function StatsSection({ stats }: { stats?: any }) {
  const defaultStats = [
    { value: 0, suffix: '+', label: 'Students', icon: Users },
    { value: 0, suffix: '+', label: 'Courses', icon: BookOpen },
    { value: 0, suffix: '', label: 'Rating', icon: Star, decimal: true },
    { value: 0, suffix: '+', label: 'Certificates', icon: Award },
  ]

  const displayStats = stats ? [
    { value: stats.totalStudents, suffix: '+', label: 'Students', icon: Users },
    { value: stats.totalCourses, suffix: '+', label: 'Courses', icon: BookOpen },
    { value: stats.avgRating, suffix: '', label: 'Rating', icon: Star, decimal: true },
    { value: stats.totalCertificates, suffix: '+', label: 'Certificates', icon: Award },
  ] : defaultStats

  return (
    <section className="py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 p-8 sm:p-10 ios-shadow relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
          <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {displayStats.map((stat, i) => (
              <StatCounterItem key={stat.label} stat={stat} index={i} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// Features Section
function FeaturesSection() {
  const features = [
    {
      icon: Brain,
      title: 'Adaptive Learning',
      description: 'AI analyzes your strengths and weaknesses to create a personalized learning path that adapts in real-time.',
      gradient: 'from-emerald-500 to-teal-600',
      bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20',
    },
    {
      icon: Bot,
      title: 'Ask ShijlAI 24/7',
      description: 'Get instant help anytime. Our AI assistant explains concepts, solves problems, and guides you step-by-step.',
      gradient: 'from-teal-500 to-emerald-600',
      bgGradient: 'from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/20',
    },
    {
      icon: Sparkles,
      title: 'Smart Content',
      description: 'AI-curated study materials, practice questions, and summaries tailored to your curriculum and level.',
      gradient: 'from-emerald-400 to-teal-500',
      bgGradient: 'from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/20 dark:to-teal-950/10',
    },
    {
      icon: Trophy,
      title: 'Gamification',
      description: 'Earn XP, unlock badges, maintain streaks, and compete on leaderboards. Learning has never been this fun!',
      gradient: 'from-teal-400 to-emerald-500',
      bgGradient: 'from-teal-50/80 to-emerald-50/80 dark:from-teal-950/20 dark:to-emerald-950/10',
    },
  ]

  return (
    <section className="py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-4 py-1.5 text-[13px] font-medium text-emerald-700 dark:text-emerald-400 mb-3">
            <Sparkles className="size-3.5" />
            Why <ShijlAIBrand variant="compact" />?
          </div>
          <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight">
            Learning Reimagined with{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              AI Power
            </span>
          </h2>
          <p className="mt-3 text-[17px] text-muted-foreground max-w-2xl mx-auto">
            Four pillars that make <ShijlAIBrand variant="compact" /> the most effective learning platform for students worldwide.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...springTransition, delay: i * 0.08 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`rounded-2xl ios-shadow-sm bg-gradient-to-br ${feature.bgGradient} p-6 group cursor-default`}
            >
              <div className={`mb-4 flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} text-white ios-shadow-sm group-hover:scale-110 transition-transform`}>
                <feature.icon className="size-6" />
              </div>
              <h3 className="text-[17px] font-semibold mb-2">{feature.title}</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Dynamic Course Carousels Section — Trending, Recommended, Top 3 Categories
interface CourseWithExtras extends Course {
  instructor?: { id: string; name: string; avatar: string | null }
  _count?: { enrollments: number; modules: number; reviews: number }
  isWishlisted?: boolean
  isEnrolled?: boolean
}

function DynamicCourseCarousels() {
  const { setCurrentView, currentUser } = useAppStore()
  const [trendingCourses, setTrendingCourses] = useState<CourseWithExtras[]>([])
  const [recommendedCourses, setRecommendedCourses] = useState<CourseWithExtras[]>([])
  const [categorySections, setCategorySections] = useState<{ name: string; icon: string; courses: CourseWithExtras[] }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCatalog() {
      try {
        const catalogRes = await fetch('/api/courses/catalog?includeCategories=true')
        if (catalogRes.ok) {
          const data = await catalogRes.json()
          // API returns: { trending: { courses, reason }, recommended: { courses, reason }, categories: [{ name, icon, section: { courses, reason } }] }
          setTrendingCourses(data.trending?.courses ?? [])
          setRecommendedCourses(data.recommended?.courses ?? [])

          // Extract top 3 category sections from the categories array
          const catSections: { name: string; icon: string; courses: CourseWithExtras[] }[] = []
          const categories = data.categories || []
          for (const cat of categories) {
            if (catSections.length >= 3) break
            const courses = cat.section?.courses || []
            if (courses.length > 0) {
              catSections.push({ name: cat.name, icon: cat.icon || '📚', courses })
            }
          }
          setCategorySections(catSections)
        }
      } catch (err) {
        console.error('Failed to fetch catalog:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchCatalog()
  }, [])

  const handleCourseClick = useCallback((course: CourseWithExtras) => {
    setCurrentView('course-detail', { courseId: course.id })
  }, [setCurrentView])

  const handleWishlist = useCallback(async (courseId: string, isWishlisted: boolean) => {
    if (!currentUser) return
    try {
      if (isWishlisted) {
        await fetch(`/api/courses/${courseId}/wishlist`, { method: 'DELETE' })
      } else {
        await fetch(`/api/courses/${courseId}/wishlist`, { method: 'POST' })
      }
    } catch { }
  }, [currentUser])

  const handleEnroll = useCallback((courseId: string) => {
    setCurrentView('course-detail', { courseId })
  }, [setCurrentView])

  return (
    <section className="py-6 sm:py-8 bg-gradient-to-b from-muted/30 to-transparent">
      {/* Trending */}
      <CourseCarouselRow
        title="Trending Now"
        subtitle="Most popular courses this week"
        sectionKey="trending"
        courses={trendingCourses}
        loading={loading}
        onCourseClick={handleCourseClick}
        onWishlist={handleWishlist}
        onEnroll={handleEnroll}
        onViewAll={() => setCurrentView('public-courses')}
      />

      {/* Recommended */}
      <CourseCarouselRow
        title="Recommended for You"
        subtitle="Personalized picks based on your interests"
        sectionKey="recommended"
        courses={recommendedCourses}
        loading={loading}
        onCourseClick={handleCourseClick}
        onWishlist={handleWishlist}
        onEnroll={handleEnroll}
        onViewAll={() => setCurrentView('public-courses')}
      />

      {/* Top 3 Category Carousels */}
      {categorySections.map((cat) => (
        <CourseCarouselRow
          key={cat.name}
          title={`${cat.name} Courses`}
          subtitle={`Top courses in ${cat.name}`}
          sectionKey="top"
          courses={cat.courses}
          loading={loading}
          onCourseClick={handleCourseClick}
          onWishlist={handleWishlist}
          onEnroll={handleEnroll}
          onViewAll={() => setCurrentView('public-courses')}
          categoryIcon={cat.icon}
        />
      ))}

      {/* View All button */}
      <div className="text-center mt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentView('public-courses')}
          className="rounded-full border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 ios-press"
        >
          View All Courses
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </section>
  )
}

// How It Works Section
function HowItWorksSection() {
  const { setCurrentView, isAuthenticated } = useAppStore()
  const steps = [
    {
      number: 1,
      title: 'Sign Up & Choose Your Path',
      description: 'Create your free account and tell us your goals. Our AI will recommend the perfect learning path tailored to your needs.',
      icon: UserPlus,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      number: 2,
      title: 'Learn with AI Assistance',
      description: 'Dive into interactive lessons with Ask ShijlAI. Get instant explanations, practice problems, and real-time feedback.',
      icon: Bot,
      gradient: 'from-teal-500 to-emerald-600',
    },
    {
      number: 3,
      title: 'Achieve Your Goals',
      description: 'Earn certificates, build streaks, unlock achievements, and reach your academic or career milestones with confidence.',
      icon: Trophy,
      gradient: 'from-emerald-400 to-teal-500',
    },
  ]

  return (
    <section className="py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-4 py-1.5 text-[13px] font-medium text-emerald-700 dark:text-emerald-400 mb-3">
            <Zap className="size-3.5" />
            Simple Process
          </div>
          <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight">
            How It{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="mt-3 text-[17px] text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to transform your learning journey
          </p>
        </motion.div>

        {/* Desktop: horizontal layout */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 relative">
          {/* Connecting lines (desktop only) */}
          <div className="absolute top-14 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-emerald-300 via-teal-300 to-emerald-300 dark:from-emerald-700 dark:via-teal-700 dark:to-emerald-700 z-0" />
          <div className="absolute top-14 left-[16.67%] h-3 w-3 rounded-full bg-emerald-400 dark:bg-emerald-600 -translate-x-1/2 -translate-y-1/2 z-10" />
          <div className="absolute top-14 left-[50%] h-3 w-3 rounded-full bg-teal-400 dark:bg-teal-600 -translate-x-1/2 -translate-y-1/2 z-10" />
          <div className="absolute top-14 right-[16.67%] h-3 w-3 rounded-full bg-emerald-400 dark:bg-emerald-600 translate-x-1/2 -translate-y-1/2 z-10" />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...springTransition, delay: i * 0.15 }}
              className="relative z-10 flex flex-col items-center text-center"
            >
              {/* Numbered circle */}
              <div className={`flex size-28 items-center justify-center rounded-full bg-gradient-to-br ${step.gradient} text-white ios-shadow mb-6`}>
                <step.icon className="size-10" />
              </div>
              {/* Step number badge */}
              <div className="absolute top-0 right-auto -mt-2 flex size-8 items-center justify-center rounded-full bg-card ios-shadow-sm border border-border/50 text-[13px] font-bold text-primary">
                {step.number}
              </div>
              <h3 className="text-[17px] font-semibold mb-2">{step.title}</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[280px]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Mobile: vertical layout */}
        <div className="md:hidden space-y-6 relative">
          {/* Vertical connecting line */}
          <div className="absolute top-8 left-[39px] bottom-8 w-0.5 bg-gradient-to-b from-emerald-300 via-teal-300 to-emerald-300 dark:from-emerald-700 dark:via-teal-700 dark:to-emerald-700 z-0" />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ ...springTransition, delay: i * 0.15 }}
              className="relative z-10 flex gap-4 items-start"
            >
              {/* Numbered circle */}
              <div className={`flex-shrink-0 flex size-20 items-center justify-center rounded-full bg-gradient-to-br ${step.gradient} text-white ios-shadow`}>
                <step.icon className="size-7" />
              </div>
              {/* Step number badge */}
              <div className="absolute left-[12px] -top-1 flex size-6 items-center justify-center rounded-full bg-card ios-shadow-sm border border-border/50 text-[11px] font-bold text-primary">
                {step.number}
              </div>
              <div className="pt-1">
                <h3 className="text-[17px] font-semibold mb-1">{step.title}</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          {!isAuthenticated && (
            <Button
              size="lg"
              onClick={() => setCurrentView('register')}
              className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl transition-all ios-press h-12 px-8 text-[15px] font-semibold"
            >
              Start Your Journey
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </section>
  )
}

// Curriculum Showcase
function CurriculumSection() {
  const { setCurrentView } = useAppStore()
  const subjects = [
    { name: 'IB', sub: 'Math, Physics, Chemistry', gradient: 'from-emerald-500 to-teal-600' },
    { name: 'AP', sub: 'Advanced Placement curriculum', gradient: 'from-teal-500 to-emerald-600' },
    { name: 'IELTS', sub: 'English proficiency', gradient: 'from-emerald-400 to-teal-500' },
    { name: 'AWS', sub: 'Cloud certification', gradient: 'from-teal-400 to-emerald-500' },
    { name: 'Python', sub: 'Programming basics', gradient: 'from-emerald-600 to-teal-700' },
    { name: 'Web Dev', sub: 'Full-stack skills', gradient: 'from-teal-600 to-emerald-700' },
  ]

  return (
    <section className="py-8 sm:py-10 bg-gradient-to-b from-muted/30 to-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight">
            Popular{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              Subjects
            </span>
          </h2>
          <p className="mt-3 text-[17px] text-muted-foreground">
            Aligned with international curricula and global standards
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-3">
          {subjects.map((subject, i) => (
            <motion.button
              key={subject.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ ...springTransition, delay: i * 0.05 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setCurrentView('public-courses')}
              className={`rounded-full bg-gradient-to-r ${subject.gradient} px-5 py-2.5 text-white ios-shadow-sm ios-press`}
            >
              <span className="text-[15px] font-semibold">{subject.name}</span>
              <span className="text-[11px] text-white/70 ml-1.5">{subject.sub}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  )
}

// Instructor Spotlights
function InstructorSpotlights({ instructors }: { instructors?: any[] }) {
  // Use real DB instructors, fallback to mock if none returned or loading
  const displayInstructors = instructors?.length ? instructors : [
    {
      name: 'Dr. Fatima Khan',
      subject: 'IB Mathematics',
      rating: 4.9,
      studentCount: 3200,
      initials: 'FK',
    },
    {
      name: 'Prof. Ahmad Raza',
      subject: 'O/A Level Physics',
      rating: 4.8,
      studentCount: 2800,
      initials: 'AR',
    },
    {
      name: 'Sarah Malik',
      subject: 'IELTS Preparation',
      rating: 4.9,
      studentCount: 4100,
      initials: 'SM',
    },
  ]

  // Assign consistent colors to instructors based on their index
  const colors = [
    'from-emerald-400 to-teal-500',
    'from-teal-400 to-emerald-500',
    'from-emerald-500 to-teal-600'
  ]

  return (
    <section className="py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight">
            Top{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              Instructors
            </span>
          </h2>
          <p className="mt-3 text-[17px] text-muted-foreground">
            Learn from the world&apos;s best educators
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-3">
          {displayInstructors.map((instructor, i) => (
            <motion.div
              key={instructor.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...springTransition, delay: i * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="rounded-2xl ios-shadow-sm bg-card p-6 text-center"
            >
              <div className={`mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br ${colors[i % colors.length]} text-white ios-shadow`}>
                <span className="text-[22px] font-bold">{instructor.initials}</span>
              </div>
              <h3 className="text-[17px] font-semibold">{instructor.name}</h3>
              <p className="text-[13px] text-muted-foreground mt-1">{instructor.subject}</p>
              <div className="mt-3 flex items-center justify-center gap-4">
                <div className="flex items-center gap-1">
                  <Star className="size-4 fill-amber-500 text-amber-500" />
                  <span className="text-[13px] font-semibold">{instructor.rating}</span>
                </div>
                <div className="flex items-center gap-1 text-[13px] text-muted-foreground">
                  <Users className="size-3.5" />
                  {instructor.studentCount.toLocaleString()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Student Testimonials (Enhanced)
function TestimonialsSection() {
  const testimonials: { quote: React.ReactNode; name: string; course: string; rating: number; initials: string; gradient: string }[] = [
    {
      quote: <><ShijlAIText /> completely transformed my IB preparation. Ask <span style={{ fontFamily: "ScriptMTBold, cursive", fontWeight: "bold" }}>Shijl</span><span style={{ fontFamily: "LatinModernRoman, serif", fontWeight: "bold" }}>AI</span> helped me understand complex calculus concepts that I struggled with for months.</>,
      name: 'Ahmed Hassan',
      course: 'IB Mathematics',
      rating: 5,
      initials: 'AH',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      quote: <>I scored 8.5 on IELTS thanks to <ShijlAIText />'s personalized study plan. The AI identified my weak areas and focused on improving them.</>,
      name: 'Zainab Ali',
      course: 'IELTS Preparation',
      rating: 5,
      initials: 'ZA',
      gradient: 'from-teal-500 to-emerald-600',
    },
    {
      quote: 'The gamification features kept me motivated. I maintained a 45-day streak and earned my AWS certification. Absolutely worth it!',
      name: 'Bilal Siddiqui',
      course: 'AWS Cloud Practitioner',
      rating: 5,
      initials: 'BS',
      gradient: 'from-emerald-400 to-teal-500',
    },
  ]

  return (
    <section className="py-8 sm:py-10 bg-gradient-to-b from-muted/30 to-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight">
            What Students{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              Say
            </span>
          </h2>
          <p className="mt-3 text-[17px] text-muted-foreground">
            Join thousands of successful learners
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...springTransition, delay: i * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="relative rounded-2xl ios-shadow-sm bg-card p-6 overflow-hidden group"
            >
              {/* Gradient left accent */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${testimonial.gradient}`} />

              {/* Large decorative quote mark */}
              <div className="absolute -top-1 -right-1 opacity-[0.06] pointer-events-none select-none">
                <Quote className="size-24 text-foreground" />
              </div>

              {/* Prominent star rating */}
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: testimonial.rating }).map((_, j) => (
                  <Star key={j} className="size-4 fill-amber-500 text-amber-500" />
                ))}
                <span className="ml-1.5 text-[13px] font-semibold text-amber-600 dark:text-amber-400">
                  {testimonial.rating}.0
                </span>
              </div>

              <p className="text-[15px] leading-relaxed text-muted-foreground relative z-10">{testimonial.quote}</p>

              <div className="mt-4 flex items-center gap-3 pt-3 border-t border-border/50">
                <div className={`flex size-9 items-center justify-center rounded-full bg-gradient-to-br ${testimonial.gradient} text-[11px] font-bold text-white`}>
                  {testimonial.initials}
                </div>
                <div>
                  <p className="text-[13px] font-semibold">{testimonial.name}</p>
                  <p className="text-[11px] text-muted-foreground">{testimonial.course}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Final CTA
function FinalCTA({ studentCount }: { studentCount?: number }) {
  const { setCurrentView, isAuthenticated } = useAppStore()
  return (
    <section className="py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 p-8 sm:p-10 ios-shadow-lg text-center overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
          <div className="relative">
            <h2 className="text-[28px] sm:text-[34px] font-bold text-white">
              {isAuthenticated ? 'Continue Your Learning Journey' : 'Start Your Learning Journey Today'}
            </h2>
            <p className="mt-3 text-[17px] text-emerald-200 max-w-xl mx-auto">
              {isAuthenticated
                ? 'Pick up where you left off and keep mastering new skills with AI-powered education.'
                : `Join ${studentCount !== undefined ? studentCount.toLocaleString() : '...'} students worldwide who are already learning smarter with AI-powered education.`}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              {isAuthenticated ? (
                <Button
                  size="lg"
                  onClick={() => setCurrentView('dashboard')}
                  className="rounded-full bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg h-12 px-8 text-[15px] font-semibold ios-press"
                >
                  Go to Dashboard
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={() => setCurrentView('register')}
                  className="rounded-full bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg h-12 px-8 text-[15px] font-semibold ios-press"
                >
                  Get Started Free
                  <ArrowRight className="size-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentView('public-courses')}
                className="rounded-full border-white/30 text-white hover:bg-white/10 h-12 px-8 text-[15px] font-medium ios-press"
              >
                Browse Courses
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// Removed LandingFooter inline definition in favor of PublicFooter

export function LandingView() {
  const [landingData, setLandingData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/public/landing-stats')
      .then(res => res.json())
      .then(data => setLandingData(data))
      .catch(err => console.error('Failed to load landing stats:', err))
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <PublicNav activeView="landing" />
      <HeroSection studentCount={landingData?.stats?.totalStudents} />
      <StatsSection stats={landingData?.stats} />
      <FeaturesSection />
      <DynamicCourseCarousels />
      <HowItWorksSection />
      <CurriculumSection />
      <InstructorSpotlights instructors={landingData?.topInstructors} />
      <TestimonialsSection />
      <FinalCTA studentCount={landingData?.stats?.totalStudents} />
      <PublicFooter />
    </div>
  )
}
