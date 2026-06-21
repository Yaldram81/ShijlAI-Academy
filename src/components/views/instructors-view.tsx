'use client'

import { useState, useCallback } from 'react'
import { PublicNav } from '@/components/public-nav'
import { motion, AnimatePresence } from 'framer-motion'
import { ShijlAIBrand, ShijlAIText } from '@/components/ui/brand-text'
import { ShijlAILogo } from '@/components/ui/shijlai-logo'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'

import {
  GraduationCap, ArrowRight, DollarSign, Bot,
  BarChart3, Clock, CheckCircle, Star, Users,
  BookOpen, Sparkles, Award, MessageCircle,
  Phone, Linkedin, Globe, FileText, Loader2,
  PenTool, Eye, ClipboardCheck, UserPlus, Search,
  Zap, Shield, Heart,
  Mic, CalendarCheck, Rocket, TrendingUp,
  Copy, ExternalLink, AlertCircle, ChevronLeft,
  Twitter, Youtube, Github, Mail,
} from 'lucide-react'

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection() {
  const { setCurrentView } = useAppStore()

  return (
    <section className="relative overflow-hidden py-16 sm:py-24 lg:py-28">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50/30 to-transparent dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-transparent" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-4 py-1.5 text-[13px] font-medium text-emerald-700 dark:text-emerald-400">
              <Sparkles className="size-3.5" />
              Become an Instructor
            </div>
            <h1 className="text-[34px] sm:text-[44px] lg:text-[52px] font-bold tracking-tight leading-[1.1]">
              Share Your Knowledge,{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                Earn Revenue
              </span>
            </h1>
            <p className="text-[17px] text-muted-foreground leading-relaxed max-w-lg">
              Join 200+ instructors on the world&apos;s fastest-growing AI learning platform. Create courses, reach thousands of students, and earn competitive revenue with the best split in the market.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={() => {
                  const el = document.getElementById('apply-form')
                  el?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl transition-all ios-press h-12 px-8 text-[15px] font-semibold"
              >
                Apply Now
                <ArrowRight className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentView('public-courses')}
                className="rounded-full h-12 px-8 text-[15px] font-medium ios-press border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                <BookOpen className="size-4 text-primary" />
                Explore Courses
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <DollarSign className="size-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[13px]"><span className="font-semibold">70/30</span> Revenue Split</span>
              </div>
              <div className="flex items-center gap-2">
                <Bot className="size-4 text-teal-600 dark:text-teal-400" />
                <span className="text-[13px]"><span className="font-semibold">AI-Powered</span> Tools</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="size-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-[13px]"><span className="font-semibold">50K+</span> Students</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative hidden lg:block"
          >
            <div className="relative">
              <div className="rounded-3xl ios-shadow-lg bg-card p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <Award className="size-5" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold">Instructor Dashboard</p>
                    <p className="text-[11px] text-muted-foreground">Your earnings at a glance</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-1">
                    <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Active</span>
                  </div>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Revenue', value: 'Rs85K+', icon: DollarSign },
                      { label: 'Students', value: '2,500+', icon: Users },
                      { label: 'Rating', value: '4.8', icon: Star },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl bg-card p-3 text-center ios-shadow-sm">
                        <stat.icon className="size-4 text-primary mx-auto" />
                        <p className="text-[15px] font-bold mt-1">{stat.value}</p>
                        <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-accent/50 p-3">
                  <div className="flex items-center gap-2">
                    <Bot className="size-4 text-primary" />
                    <span className="text-[13px] font-medium">AI Content Assistant</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">New</Badge>
                </div>
              </div>

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-4 -right-4 rounded-2xl ios-shadow bg-card p-3 flex items-center gap-2"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40">
                  <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold">+32% Revenue</p>
                  <p className="text-[10px] text-muted-foreground">This month</p>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -bottom-3 -left-3 rounded-2xl ios-shadow bg-card p-3 flex items-center gap-2"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-950/40">
                  <Sparkles className="size-4 text-teal-600 dark:text-teal-400" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold">AI Generated</p>
                  <p className="text-[10px] text-muted-foreground">12 quizzes today</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─── Benefits Section ─────────────────────────────────────────────────────────
function BenefitsSection() {
  const benefits = [
    {
      icon: DollarSign,
      title: '70/30 Revenue Split',
      description: 'You keep 70% of all course revenue. The best split in the global ed-tech market, with monthly payouts.',
      color: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      icon: Bot,
      title: 'AI Content Tools',
      description: 'Use our AI assistant to create quizzes, summaries, adaptive content, and personalized learning paths.',
      color: 'bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400',
      gradient: 'from-teal-500 to-emerald-600',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Track student engagement, completion rates, revenue, and detailed analytics to optimize your courses.',
      color: 'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400',
      gradient: 'from-cyan-500 to-teal-600',
    },
    {
      icon: Clock,
      title: 'Flexible Schedule',
      description: 'Create content on your own time. No deadlines, no minimum hours. You are in control of your schedule.',
      color: 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
      gradient: 'from-amber-500 to-orange-600',
    },
  ]

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-4 py-1.5 text-[13px] font-medium text-emerald-700 dark:text-emerald-400 mb-4">
            <Zap className="size-3.5" />
            Instructor Benefits
          </div>
          <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight">
            Why Teach on{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              <ShijlAIText gradient />
            </span>
            ?
          </h2>
          <p className="mt-3 text-[17px] text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create, teach, and earn — powered by AI
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, i) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...springTransition, delay: i * 0.08 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="rounded-2xl ios-shadow-sm bg-card p-6 group cursor-default"
            >
              <div className={`flex size-12 items-center justify-center rounded-xl ${benefit.color} mb-4 group-hover:scale-110 transition-transform`}>
                <benefit.icon className="size-6" />
              </div>
              <h3 className="text-[17px] font-semibold mb-2">{benefit.title}</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── How It Works Section ─────────────────────────────────────────────────────
function HowItWorksSection() {
  const steps = [
    {
      number: 1,
      title: 'Apply',
      description: 'Submit your application with your expertise, experience, and teaching vision.',
      icon: PenTool,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      number: 2,
      title: 'Review',
      description: 'Our team reviews your application, qualifications, and sample lesson within 48 hours.',
      icon: Eye,
      gradient: 'from-teal-500 to-emerald-600',
    },
    {
      number: 3,
      title: 'Interview',
      description: 'Selected candidates are invited for a brief interview to discuss teaching approach.',
      icon: Mic,
      gradient: 'from-emerald-400 to-teal-500',
    },
    {
      number: 4,
      title: 'Approved',
      description: 'Upon approval, receive your instructor account and access to all creation tools.',
      icon: ClipboardCheck,
      gradient: 'from-teal-400 to-emerald-500',
    },
    {
      number: 5,
      title: 'Create Courses',
      description: 'Use AI-powered tools to build engaging lessons, quizzes, and start earning revenue.',
      icon: Rocket,
      gradient: 'from-emerald-600 to-teal-700',
    },
  ]

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-muted/30 to-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-4 py-1.5 text-[13px] font-medium text-emerald-700 dark:text-emerald-400 mb-4">
            <UserPlus className="size-3.5" />
            Simple Process
          </div>
          <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight">
            How It{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="mt-3 text-[17px] text-muted-foreground max-w-2xl mx-auto">
            From application to earning — a clear path to becoming a <ShijlAIText /> instructor
          </p>
        </motion.div>

        {/* Desktop: horizontal layout */}
        <div className="hidden md:flex items-start justify-center gap-0 relative">
          {steps.map((step, i) => (
            <div key={step.number} className="flex items-start">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...springTransition, delay: i * 0.12 }}
                className="relative flex flex-col items-center text-center w-44"
              >
                <div className={`flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br ${step.gradient} text-white ios-shadow-sm mb-4`}>
                  <step.icon className="size-7" />
                </div>
                <div className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-card ios-shadow-sm border border-border/50 text-[11px] font-bold text-primary">
                  {step.number}
                </div>
                <h3 className="text-[15px] font-semibold mb-1">{step.title}</h3>
                <p className="text-[12px] text-muted-foreground leading-relaxed">{step.description}</p>
              </motion.div>
              {i < steps.length - 1 && (
                <div className="flex items-center justify-center w-16 pt-6">
                  <div className="h-0.5 w-full bg-gradient-to-r from-emerald-300 to-teal-300 dark:from-emerald-700 dark:to-teal-700" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: vertical layout */}
        <div className="md:hidden space-y-6 relative">
          <div className="absolute top-8 left-[27px] bottom-8 w-0.5 bg-gradient-to-b from-emerald-300 via-teal-300 to-emerald-300 dark:from-emerald-700 dark:via-teal-700 dark:to-emerald-700 z-0" />
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ ...springTransition, delay: i * 0.1 }}
              className="relative z-10 flex gap-4 items-start"
            >
              <div className={`flex-shrink-0 flex size-14 items-center justify-center rounded-xl bg-gradient-to-br ${step.gradient} text-white ios-shadow-sm`}>
                <step.icon className="size-6" />
              </div>
              <div className="pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold text-primary bg-emerald-100 dark:bg-emerald-950/40 rounded-full px-2 py-0.5">Step {step.number}</span>
                  <h3 className="text-[15px] font-semibold">{step.title}</h3>
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Requirements Section ──────────────────────────────────────────────────────
function RequirementsSection() {
  const requirements = [
    {
      icon: Shield,
      title: 'Deep Expertise',
      description: 'Strong command of your subject area with verifiable credentials or significant teaching experience.',
    },
    {
      icon: Heart,
      title: 'Passion for Teaching',
      description: 'Genuine enthusiasm for helping students learn and a commitment to their academic success.',
    },
    {
      icon: MessageCircle,
      title: 'Communication Skills',
      description: 'Ability to explain complex concepts clearly and create engaging, structured content.',
    },
    {
      icon: CalendarCheck,
      title: 'Commitment',
      description: 'Dedication to maintaining course quality, responding to student queries, and updating content regularly.',
    },
  ]

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-100 dark:bg-teal-950/40 px-4 py-1.5 text-[13px] font-medium text-teal-700 dark:text-teal-400 mb-4">
            <ClipboardCheck className="size-3.5" />
            What We Look For
          </div>
          <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight">
            Instructor{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              Requirements
            </span>
          </h2>
          <p className="mt-3 text-[17px] text-muted-foreground max-w-2xl mx-auto">
            We seek educators who are passionate, knowledgeable, and committed to student success
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {requirements.map((req, i) => (
            <motion.div
              key={req.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...springTransition, delay: i * 0.08 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="rounded-2xl ios-shadow-sm bg-card p-6"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white mb-4">
                <req.icon className="size-5" />
              </div>
              <h3 className="text-[15px] font-semibold mb-2">{req.title}</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{req.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Instructor Stats Bar ──────────────────────────────────────────────────────
function InstructorStatsSection() {
  const stats = [
    { value: '200+', label: 'Active Instructors', icon: Users },
    { value: 'Rs85K+', label: 'Avg. Earnings', icon: DollarSign },
    { value: '4.8', label: 'Avg. Rating', icon: Star },
    { value: '70%', label: 'Revenue Share', icon: TrendingUp },
  ]

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-muted/30 to-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 p-8 sm:p-10 ios-shadow relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
          <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ ...springTransition, delay: i * 0.08 }}
                className="text-center"
              >
                <stat.icon className="size-5 text-white/70 mx-auto mb-2" />
                <p className="text-[28px] sm:text-[34px] font-bold text-white">{stat.value}</p>
                <p className="text-[13px] text-emerald-200">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Testimonials Section ─────────────────────────────────────────────────────
function InstructorTestimonials() {
  const testimonials = [
    {
      quote: <><ShijlAIText />'s AI tools helped me create a complete IB Physics course in just 2 weeks. The revenue sharing is the best I've seen globally.</>,
      name: 'Dr. Usman Ali',
      subject: 'IB Physics',
      rating: 5,
      initials: 'UA',
      earnings: '$1.2K/month',
    },
    {
      quote: 'I was amazed by the analytics dashboard. I can see exactly where students struggle and improve my content accordingly. This platform is a game-changer.',
      name: 'Ayesha Khan',
      subject: 'IELTS English',
      rating: 5,
      initials: 'AK',
      earnings: 'Rs95K/month',
    },
    {
      quote: <>Teaching on <ShijlAIText /> has been life-changing. The flexible schedule lets me balance my university job and online courses perfectly. Highly recommended.</>,
      name: 'Prof. Imran Siddiqui',
      subject: 'A-Level Mathematics',
      rating: 5,
      initials: 'IS',
      earnings: 'Rs78K/month',
    },
  ]

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-4 py-1.5 text-[13px] font-medium text-emerald-700 dark:text-emerald-400 mb-4">
            <MessageCircle className="size-3.5" />
            Instructor Stories
          </div>
          <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight">
            Hear from Our{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              Instructors
            </span>
          </h2>
          <p className="mt-3 text-[17px] text-muted-foreground max-w-2xl mx-auto">
            Real stories from educators who transformed their careers on <ShijlAIText />
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
              className="rounded-2xl ios-shadow-sm bg-card p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <MessageCircle className="size-5 text-primary/20" />
                <Badge variant="secondary" className="text-[10px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-0">
                  {testimonial.earnings}
                </Badge>
              </div>
              <p className="text-[14px] leading-relaxed text-muted-foreground">{testimonial.quote}</p>
              <div className="mt-4 flex items-center gap-1">
                {Array.from({ length: testimonial.rating }).map((_, j) => (
                  <Star key={j} className="size-3.5 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3 pt-3 border-t border-border/50">
                <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-[11px] font-bold text-white">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="text-[13px] font-semibold">{testimonial.name}</p>
                  <p className="text-[11px] text-muted-foreground">{testimonial.subject}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Multi-Step Form ──────────────────────────────────────────────────────────
interface FormErrors {
  fullName?: string
  email?: string
  phone?: string
  expertise?: string
  experience?: string
  motivation?: string
  linkedinProfile?: string
  portfolioUrl?: string
  sampleLessonDesc?: string
  teachingApproach?: string
  expectedTimeline?: string
}

function FormStepIndicator({ currentStep }: { currentStep: number }) {
  const steps = [
    { label: 'Personal Info', icon: UserPlus },
    { label: 'Background', icon: Shield },
    { label: 'Teaching Vision', icon: Sparkles },
  ]

  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, i) => {
        const isCompleted = i < currentStep
        const isCurrent = i === currentStep
        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex size-10 sm:size-11 items-center justify-center rounded-xl transition-all duration-300 ${
                  isCompleted
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white ios-shadow-sm'
                    : isCurrent
                    ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/30'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="size-5" />
                ) : (
                  <step.icon className="size-5" />
                )}
              </div>
              <span
                className={`mt-1.5 text-[11px] sm:text-[12px] font-medium ${
                  isCompleted || isCurrent
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`mx-2 sm:mx-3 h-0.5 w-8 sm:w-16 rounded-full transition-colors duration-300 mb-5 ${
                  isCompleted ? 'bg-emerald-500' : 'bg-border'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function ProgressBar({ currentStep }: { currentStep: number }) {
  const progress = ((currentStep + 1) / 3) * 100
  return (
    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mb-6">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600"
      />
    </div>
  )
}

function ApplyForm() {
  const { setCurrentView } = useAppStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [applicationCode, setApplicationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [copied, setCopied] = useState(false)

  // Form fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [expertise, setExpertise] = useState('')
  const [experience, setExperience] = useState('')
  const [linkedinProfile, setLinkedinProfile] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [motivation, setMotivation] = useState('')
  const [sampleLessonDesc, setSampleLessonDesc] = useState('')
  const [teachingApproach, setTeachingApproach] = useState('')
  const [expectedTimeline, setExpectedTimeline] = useState('')

  // Touched state
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Errors
  const [errors, setErrors] = useState<FormErrors>({})

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    setErrors(validate())
  }

  const validate = useCallback((): FormErrors => {
    const newErrors: FormErrors = {}
    if (!fullName.trim()) newErrors.fullName = 'Full name is required'
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (linkedinProfile.trim() && !linkedinProfile.trim().startsWith('http')) {
      newErrors.linkedinProfile = 'Please enter a valid URL'
    }
    if (portfolioUrl.trim() && !portfolioUrl.trim().startsWith('http')) {
      newErrors.portfolioUrl = 'Please enter a valid URL'
    }
    if (!expertise.trim()) newErrors.expertise = 'Area of expertise is required'
    if (!motivation.trim()) {
      newErrors.motivation = 'Please tell us why you want to teach on ShijlAI'
    } else if (motivation.trim().length < 20) {
      newErrors.motivation = 'Please provide at least 20 characters'
    }
    return newErrors
  }, [fullName, email, phone, expertise, experience, motivation, linkedinProfile, portfolioUrl, sampleLessonDesc, teachingApproach, expectedTimeline])

  const validateStep = (step: number): boolean => {
    const allErrors = validate()
    const stepErrors: FormErrors = {}

    if (step === 0) {
      if (allErrors.fullName) stepErrors.fullName = allErrors.fullName
      if (allErrors.email) stepErrors.email = allErrors.email
      if (allErrors.linkedinProfile) stepErrors.linkedinProfile = allErrors.linkedinProfile
      if (allErrors.portfolioUrl) stepErrors.portfolioUrl = allErrors.portfolioUrl
      // Touch step fields
      setTouched(prev => ({ ...prev, fullName: true, email: true, linkedinProfile: !!linkedinProfile, portfolioUrl: !!portfolioUrl }))
    } else if (step === 1) {
      if (allErrors.expertise) stepErrors.expertise = allErrors.expertise
      setTouched(prev => ({ ...prev, expertise: true }))
    } else if (step === 2) {
      if (allErrors.motivation) stepErrors.motivation = allErrors.motivation
      setTouched(prev => ({ ...prev, motivation: true }))
    }

    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 2))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError('')

    if (!validateStep(2)) return

    // Also validate all previous steps
    const allErrors = validate()
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      setTouched({
        fullName: true,
        email: true,
        expertise: true,
        motivation: true,
        linkedinProfile: !!linkedinProfile,
        portfolioUrl: !!portfolioUrl,
      })
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/instructor-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          expertise: expertise.trim(),
          experience: experience || undefined,
          motivation: motivation.trim(),
          linkedinProfile: linkedinProfile.trim() || undefined,
          portfolioUrl: portfolioUrl.trim() || undefined,
          sampleLessonDesc: sampleLessonDesc.trim() || undefined,
          teachingApproach: teachingApproach.trim() || undefined,
          expectedTimeline: expectedTimeline || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setServerError(data.error || 'Failed to submit application')
        return
      }

      setApplicationCode(data.applicationCode)
      setSubmitted(true)
    } catch {
      setServerError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(applicationCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Success State ──
  if (submitted) {
    return (
      <section className="py-16 sm:py-20 bg-gradient-to-b from-muted/30 to-transparent">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...springTransition }}
          >
            <Card className="border-0 ios-shadow-sm">
              <CardContent className="p-6 sm:p-8">
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ ...springTransition, delay: 0.2 }}
                    className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 mx-auto mb-4 ios-shadow"
                  >
                    <CheckCircle className="size-10 text-white" />
                  </motion.div>
                  <h3 className="text-[24px] font-bold">Application Submitted</h3>
                  <p className="mt-2 text-[15px] text-muted-foreground">
                    Thank you for applying to become a <ShijlAIText /> instructor
                  </p>
                </div>

                {/* Tracking Code */}
                <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-900/30 p-5 mb-6">
                  <p className="text-[12px] font-medium text-emerald-700 dark:text-emerald-400 mb-2 uppercase tracking-wider">
                    Your Tracking Code
                  </p>
                  <div className="flex items-center gap-3">
                    <code className="text-[22px] sm:text-[26px] font-bold font-mono text-emerald-800 dark:text-emerald-300 tracking-wider">
                      {applicationCode}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyCode}
                      className="size-9 rounded-lg border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/40"
                      aria-label="Copy tracking code"
                    >
                      {copied ? <CheckCircle className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                    </Button>
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-2">
                    Save this code to track your application status
                  </p>
                </div>

                {/* What Happens Next Timeline */}
                <div className="mb-6">
                  <h4 className="text-[15px] font-semibold mb-4">What Happens Next?</h4>
                  <div className="space-y-4">
                    {[
                      { step: '1', title: 'Application Review', desc: 'Our team reviews your application within 48 hours.', icon: Eye, color: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' },
                      { step: '2', title: 'Interview', desc: 'If selected, you will be invited for a brief interview.', icon: Mic, color: 'bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400' },
                      { step: '3', title: 'Decision', desc: 'You will receive a decision within 5-7 business days.', icon: ClipboardCheck, color: 'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400' },
                      { step: '4', title: 'Onboard', desc: 'Once approved, get your account and start creating courses.', icon: Rocket, color: 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' },
                    ].map((item) => (
                      <div key={item.step} className="flex items-start gap-3">
                        <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${item.color}`}>
                          <item.icon className="size-4" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-foreground">{item.title}</p>
                          <p className="text-[12px] text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-muted/50 p-4 mb-6">
                  <div className="flex items-start gap-2">
                    <Clock className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[13px] font-medium">Expected Timeline</p>
                      <p className="text-[12px] text-muted-foreground">5-7 business days from submission to decision</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <TrackApplicationDialog>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl ios-press"
                    >
                      <Search className="size-4" />
                      Track Application Status
                    </Button>
                  </TrackApplicationDialog>
                  <Button
                    onClick={() => setCurrentView('landing')}
                    className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white ios-press"
                  >
                    Back to Home
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <section id="apply-form" className="py-16 sm:py-20 bg-gradient-to-b from-muted/30 to-transparent">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-4 py-1.5 text-[13px] font-medium text-emerald-700 dark:text-emerald-400 mb-4">
            <PenTool className="size-3.5" />
            Instructor Application
          </div>
          <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight">
            Apply to{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              Teach
            </span>
          </h2>
          <p className="mt-2 text-[17px] text-muted-foreground">
            Start your journey as a <ShijlAIText /> instructor
          </p>
        </motion.div>

        <FormStepIndicator currentStep={currentStep} />
        <ProgressBar currentStep={currentStep} />

        <motion.form
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          noValidate
          className="rounded-2xl ios-shadow-sm bg-card p-6 space-y-5"
        >
          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 p-3.5 text-[13px] text-red-600 dark:text-red-400 flex items-start gap-2"
            >
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              {serverError}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* Step 1: Personal Info */}
            {currentStep === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <UserPlus className="size-5 text-primary" />
                  <h3 className="text-[17px] font-semibold">Personal Information</h3>
                </div>
                <p className="text-[13px] text-muted-foreground">Tell us about yourself so we can get to know you.</p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-[13px] font-medium">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      placeholder="Dr. Ahmad Khan"
                      className={`h-11 rounded-xl ${touched.fullName && errors.fullName ? 'border-red-500 focus-visible:ring-red-500/30' : ''}`}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onBlur={() => handleBlur('fullName')}
                    />
                    {touched.fullName && errors.fullName && (
                      <p className="text-[11px] text-red-500">{errors.fullName}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-[13px] font-medium">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="ahmad@example.com"
                      className={`h-11 rounded-xl ${touched.email && errors.email ? 'border-red-500 focus-visible:ring-red-500/30' : ''}`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => handleBlur('email')}
                    />
                    {touched.email && errors.email && (
                      <p className="text-[11px] text-red-500">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-[13px] font-medium">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+92 300 1234567"
                      className="h-11 rounded-xl pl-10"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Professional Background */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="size-5 text-primary" />
                  <h3 className="text-[17px] font-semibold">Professional Background</h3>
                </div>
                <p className="text-[13px] text-muted-foreground">Share your expertise and professional credentials.</p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="expertise" className="text-[13px] font-medium">
                      Area of Expertise <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="expertise"
                      placeholder="IB Mathematics, IELTS, AWS..."
                      className={`h-11 rounded-xl ${touched.expertise && errors.expertise ? 'border-red-500 focus-visible:ring-red-500/30' : ''}`}
                      value={expertise}
                      onChange={(e) => setExpertise(e.target.value)}
                      onBlur={() => handleBlur('expertise')}
                    />
                    {touched.expertise && errors.expertise && (
                      <p className="text-[11px] text-red-500">{errors.expertise}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-medium">Years of Experience</Label>
                    <Select value={experience} onValueChange={setExperience}>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Select experience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0-1">0-1 years</SelectItem>
                        <SelectItem value="1-3">1-3 years</SelectItem>
                        <SelectItem value="3-5">3-5 years</SelectItem>
                        <SelectItem value="5-10">5-10 years</SelectItem>
                        <SelectItem value="10+">10+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="linkedin" className="text-[13px] font-medium">LinkedIn Profile</Label>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="linkedin"
                        placeholder="https://linkedin.com/in/yourname"
                        className={`h-11 rounded-xl pl-10 ${touched.linkedinProfile && errors.linkedinProfile ? 'border-red-500 focus-visible:ring-red-500/30' : ''}`}
                        value={linkedinProfile}
                        onChange={(e) => setLinkedinProfile(e.target.value)}
                        onBlur={() => handleBlur('linkedinProfile')}
                      />
                    </div>
                    {touched.linkedinProfile && errors.linkedinProfile && (
                      <p className="text-[11px] text-red-500">{errors.linkedinProfile}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="portfolio" className="text-[13px] font-medium">Portfolio / Website URL</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="portfolio"
                        placeholder="https://yoursite.com"
                        className={`h-11 rounded-xl pl-10 ${touched.portfolioUrl && errors.portfolioUrl ? 'border-red-500 focus-visible:ring-red-500/30' : ''}`}
                        value={portfolioUrl}
                        onChange={(e) => setPortfolioUrl(e.target.value)}
                        onBlur={() => handleBlur('portfolioUrl')}
                      />
                    </div>
                    {touched.portfolioUrl && errors.portfolioUrl && (
                      <p className="text-[11px] text-red-500">{errors.portfolioUrl}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Teaching Vision */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="size-5 text-primary" />
                  <h3 className="text-[17px] font-semibold">Teaching Vision</h3>
                </div>
                <p className="text-[13px] text-muted-foreground">Share your teaching philosophy and what you want to create.</p>

                <div className="space-y-1.5">
                  <Label htmlFor="motivation" className="text-[13px] font-medium">
                    Why do you want to teach on <ShijlAIText />? <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="motivation"
                    placeholder="Tell us about your teaching experience and what courses you'd like to create..."
                    className={`rounded-xl min-h-[100px] resize-none ${touched.motivation && errors.motivation ? 'border-red-500 focus-visible:ring-red-500/30' : ''}`}
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    onBlur={() => handleBlur('motivation')}
                  />
                  <div className="flex items-center justify-between">
                    {touched.motivation && errors.motivation ? (
                      <p className="text-[11px] text-red-500">{errors.motivation}</p>
                    ) : (
                      <span />
                    )}
                    <span className={`text-[11px] ${motivation.trim().length < 20 ? 'text-muted-foreground' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {motivation.trim().length}/20 min characters
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sampleLesson" className="text-[13px] font-medium">
                    Sample Lesson Description
                  </Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 size-4 text-muted-foreground" />
                    <Textarea
                      id="sampleLesson"
                      placeholder="Describe a sample lesson you would create. What topic, format, and teaching approach would you use?"
                      className="rounded-xl min-h-[80px] resize-none pl-10"
                      value={sampleLessonDesc}
                      onChange={(e) => setSampleLessonDesc(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="teachingApproach" className="text-[13px] font-medium">
                      Teaching Approach
                    </Label>
                    <Select value={teachingApproach} onValueChange={setTeachingApproach}>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Select approach" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lecture">Lecture-Based</SelectItem>
                        <SelectItem value="interactive">Interactive / Hands-on</SelectItem>
                        <SelectItem value="project">Project-Based</SelectItem>
                        <SelectItem value="flipped">Flipped Classroom</SelectItem>
                        <SelectItem value="adaptive">Adaptive / Personalized</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="timeline" className="text-[13px] font-medium">
                      Expected Timeline
                    </Label>
                    <Select value={expectedTimeline} onValueChange={setExpectedTimeline}>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="When can you start?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediately">Immediately</SelectItem>
                        <SelectItem value="1-2-weeks">1-2 Weeks</SelectItem>
                        <SelectItem value="1-month">Within 1 Month</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-2">
            {currentStep > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="rounded-xl ios-press"
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 2 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white ios-press px-6"
              >
                Next Step
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white ios-press px-6 h-11 text-[15px] font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.form>
      </div>
    </section>
  )
}

// ─── Track Application Dialog ─────────────────────────────────────────────────
function TrackApplicationDialog({ children }: { children: React.ReactNode }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    applicationCode: string
    fullName: string
    status: string
    expertise: string
    createdAt: string
    timeline: Array<{ event: string; title: string; description: string; createdAt: string }>
  } | null>(null)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  const handleSearch = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(`/api/instructor-applications?code=${encodeURIComponent(code.trim())}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Application not found')
        return
      }

      setResult(data.application)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400'
      case 'under_review': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
      case 'interview_scheduled': return 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400'
      case 'approved': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400'
      case 'onboarded': return 'bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending Review',
      under_review: 'Under Review',
      info_requested: 'More Info Requested',
      info_provided: 'Info Provided',
      interview_scheduled: 'Interview Scheduled',
      interview_completed: 'Interview Completed',
      approved: 'Approved',
      rejected: 'Not Selected',
      onboarded: 'Onboarded',
    }
    return labels[status] || status
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="size-5 text-primary" />
            Track Application Status
          </DialogTitle>
          <DialogDescription>
            Enter your application tracking code to check your status
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="flex gap-2">
            <Input
              placeholder="INS-2025-XXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="h-11 rounded-xl font-mono"
            />
            <Button
              onClick={handleSearch}
              disabled={loading || !code.trim()}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            </Button>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 p-3 text-[13px] text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-semibold">{result.fullName}</p>
                  <p className="text-[12px] text-muted-foreground">{result.expertise}</p>
                </div>
                <Badge className={`${getStatusColor(result.status)} border-0 text-[11px]`}>
                  {getStatusLabel(result.status)}
                </Badge>
              </div>

              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[11px] text-muted-foreground">Application Code</p>
                <code className="text-[14px] font-bold font-mono">{result.applicationCode}</code>
              </div>

              {result.timeline && result.timeline.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[12px] font-medium text-muted-foreground">Recent Activity</p>
                  {result.timeline.slice(0, 3).map((entry, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-[12px] font-medium">{entry.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="size-3" />
                Submitted {new Date(result.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── FAQ Section ──────────────────────────────────────────────────────────────
function FAQSection() {
  const faqs = [
    {
      question: 'What qualifications do I need to become an instructor?',
      answer: 'We look for deep expertise in your subject area, demonstrated through academic credentials, professional experience, or teaching history. While formal qualifications are valued, we also consider practical expertise and passion for teaching.',
    },
    {
      question: 'How does the 70/30 revenue split work?',
      answer: 'You receive 70% of all revenue generated from your courses. Payouts are processed monthly. There are no hidden fees — the 30% covers platform maintenance, AI tool costs, payment processing, and marketing.',
    },
    {
      question: 'How long does the application process take?',
      answer: 'The complete process typically takes 5-7 business days. This includes application review (48 hours), possible interview, and final decision. You can track your status using the application code provided upon submission.',
    },
    {
      question: 'What kind of courses can I create?',
      answer: 'You can create courses in any subject area aligned with global education needs: IB, AP, Cambridge, IELTS, professional certifications, programming, and more. Our AI tools help you create engaging content regardless of the subject.',
    },
    {
      question: 'Do I need to create content from scratch?',
      answer: 'Not entirely. Our AI-powered content tools can help generate quizzes, summaries, practice questions, and adaptive learning paths. You provide the expertise and teaching vision — AI handles the repetitive work.',
    },
    {
      question: 'What if my application is not approved?',
      answer: 'If your application is not approved, we provide detailed feedback on areas for improvement. You can reapply after the specified cooldown period, typically 30 days. Many successful instructors were approved on their second application.',
    },
    {
      question: 'Can I teach in multiple languages?',
      answer: <>Yes! <ShijlAIText /> supports multiple languages including English, Arabic, and more. You can create courses in any supported language or even multilingual courses. We believe in making education accessible in the language students are most comfortable with.</>,
    },
    {
      question: 'Is there a minimum time commitment?',
      answer: 'No. There is no minimum teaching hours or content creation deadlines. However, we do expect instructors to respond to student queries within a reasonable timeframe and keep course content up to date.',
    },
  ]

  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-4 py-1.5 text-[13px] font-medium text-emerald-700 dark:text-emerald-400 mb-4">
              <MessageCircle className="size-3.5" />
              FAQ
            </div>
            <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight mb-6">
              Frequently Asked{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                Questions
              </span>
            </h2>

            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-[14px] font-medium text-left hover:no-underline hover:text-emerald-600 dark:hover:text-emerald-400">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-[13px] text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-5"
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-100 dark:bg-teal-950/40 px-4 py-1.5 text-[13px] font-medium text-teal-700 dark:text-teal-400 mb-4">
              <ExternalLink className="size-3.5" />
              Quick Actions
            </div>
            <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight mb-2">
              Need{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                Help?
              </span>
            </h2>
            <p className="text-[15px] text-muted-foreground mb-6">
              Already applied? Track your status or start a new application.
            </p>

            <Card className="border-0 ios-shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
                    <Search className="size-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold">Track Your Application</p>
                    <p className="text-[12px] text-muted-foreground">Check the status of your submission</p>
                  </div>
                </div>
                <TrackApplicationDialog>
                  <Button variant="outline" className="w-full rounded-xl border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 ios-press">
                    <Search className="size-4" />
                    Look Up Status
                  </Button>
                </TrackApplicationDialog>
              </CardContent>
            </Card>

            <Card className="border-0 ios-shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-950/40">
                    <Mail className="size-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold">Contact Our Team</p>
                    <p className="text-[12px] text-muted-foreground">Have questions? We are here to help</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full rounded-xl border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/30 ios-press"
                  onClick={() => window.open('mailto:instructors@shijlai.com', '_blank')}
                >
                  <Mail className="size-4" />
                  instructors@shijlai.com
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 ios-shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20">
              <CardContent className="p-5">
                <p className="text-[15px] font-semibold mb-1">Average Response Time</p>
                <p className="text-[24px] font-bold text-emerald-600 dark:text-emerald-400">48 Hours</p>
                <p className="text-[12px] text-muted-foreground mt-1">For application review and email responses</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function InstructorsView() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav activeView="instructors" />
      <div className="flex-1">
        <HeroSection />
        <BenefitsSection />
        <InstructorStatsSection />
        <HowItWorksSection />
        <RequirementsSection />
        <InstructorTestimonials />
        <ApplyForm />
        <FAQSection />
      </div>
      <PublicFooter />
    </div>
  )
}
