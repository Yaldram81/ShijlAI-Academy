'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { PublicNav } from '@/components/public-nav'
import { motion, useInView } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { ShijlAIBrand, ShijlAIText } from '@/components/ui/brand-text'
import { ShijlAILogo } from '@/components/ui/shijlai-logo'
import {
  GraduationCap, ArrowRight, Target, Lightbulb,
  Heart, Users, Globe, BookOpen, Award, Star,
  Shield, Sparkles, Zap, ChevronRight, Clock,
  Newspaper, CheckCircle, Linkedin, Twitter,
  Send, MessageSquare, Building2, Handshake,
  BadgeCheck, Landmark, University, GraduationCapIcon
} from 'lucide-react'

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

// Animated Counter Hook
function useCountUp(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })
  const hasStarted = useRef(false)

  useEffect(() => {
    if (startOnView && !isInView) return
    if (hasStarted.current) return
    hasStarted.current = true

    let startTime: number | null = null
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setCount(Math.floor(eased * end))
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [end, duration, isInView, startOnView])

  return { count, ref }
}

function CountUpNumber({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const { count, ref } = useCountUp(end, duration)
  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  )
}

// Mission & Vision
function MissionSection() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50/30 to-transparent dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-transparent" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-4 py-1.5 text-[13px] font-medium text-emerald-700 dark:text-emerald-400 mb-4">
            <Target className="size-3.5" />
            Our Mission
          </div>
          <h1 className="text-[28px] sm:text-[34px] lg:text-[44px] font-bold tracking-tight leading-[1.15]">
            Making quality education accessible to every student worldwide through{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              AI
            </span>
          </h1>
          <p className="mt-4 text-[17px] text-muted-foreground leading-relaxed">
            We believe that where you live shouldn&apos;t determine the quality of education you receive. <ShijlAIBrand variant="compact" /> uses cutting-edge AI to deliver personalized, world-class learning experiences to students across the globe.
          </p>
        </motion.div>

        {/* Vision cards */}
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {[
            {
              icon: Globe,
              title: 'Global-First',
              description: 'Built for international curricula, aligned with global examination boards, and designed for diverse learning contexts.',
              color: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
            },
            {
              icon: BookOpen,
              title: 'Local Curriculum',
              description: 'IB, AP, Cambridge, and more — all aligned with the latest international syllabi and examination standards.',
              color: 'bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400',
            },
            {
              icon: Sparkles,
              title: 'Multilingual',
              description: 'Learning in multiple languages. We\'re making education accessible in the language you\'re most comfortable with.',
              color: 'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400',
            },
          ].map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: i * 0.1 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="rounded-2xl ios-shadow-sm bg-card p-6"
            >
              <div className={`flex size-12 items-center justify-center rounded-xl ${card.color} mb-4`}>
                <card.icon className="size-6" />
              </div>
              <h3 className="text-[17px] font-semibold mb-2">{card.title}</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{card.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Founding Story
function FoundingStorySection() {
  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-muted/30 to-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-4 py-1.5 text-[13px] font-medium text-emerald-700 dark:text-emerald-400 mb-4">
              <Lightbulb className="size-3.5" />
              Our Story
            </div>
            <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight">
              Born from a{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                Real Problem
              </span>
            </h2>
            <div className="mt-4 space-y-4 text-[15px] text-muted-foreground leading-relaxed">
              <p>
                In 2024, our founders — students themselves — experienced firsthand the gap in education quality worldwide. While students in major cities had access to top tutors, millions in underserved areas were left behind.
              </p>
              <p>
                They asked: &ldquo;What if AI could give every student a personal tutor, available 24/7, at a fraction of the cost?&rdquo;
              </p>
              <p>
                That question became <ShijlAIBrand variant="compact" /> — a platform where AI meets global education, ensuring every student, regardless of location, has access to world-class learning.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl ios-shadow-sm bg-card p-6 space-y-4"
          >
            <h3 className="text-[17px] font-semibold">Key Milestones</h3>
            {[
              { year: '2024 Q1', event: 'ShijlAI Academy founded in Islamabad' },
              { year: '2024 Q2', event: 'First 1,000 students onboarded' },
              { year: '2024 Q3', event: 'ShijlAI Academy launched with IB/AP support' },
              { year: '2024 Q4', event: '50,000+ students, 500+ courses' },
              { year: '2025 Q1', event: 'Multilingual support launched' },
            ].map((milestone) => (
              <div key={milestone.year} className="flex items-start gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40">
                  <CheckCircle className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-primary">{milestone.year}</span>
                  <p className="text-[13px] text-muted-foreground">{milestone.event}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// Team Section (Enhanced with hover effects and social links)
function TeamSection() {
  const founders = [
    {
      name: 'Muhammad Shijl',
      role: 'CEO & Co-Founder',
      bio: 'Former AI researcher at LUMS. Passionate about democratizing education through technology.',
      initials: 'MS',
      gradient: 'from-emerald-400 to-teal-500',
      linkedin: '#',
      twitter: '#',
    },
    {
      name: 'Ayesha Rahman',
      role: 'CTO & Co-Founder',
      bio: 'ML engineer with experience at top tech companies. Building AI that understands global education.',
      initials: 'AR',
      gradient: 'from-teal-400 to-emerald-500',
      linkedin: '#',
      twitter: '#',
    },
    {
      name: 'Hassan Ali',
      role: 'Head of Content',
      bio: 'Former top scorer and educator. Ensures every course meets international curriculum standards.',
      initials: 'HA',
      gradient: 'from-emerald-500 to-teal-600',
      linkedin: '#',
      twitter: '#',
    },
    {
      name: 'Sara Khan',
      role: 'Head of AI',
      bio: 'NLP specialist focused on making AI assistants understand multilingual students worldwide.',
      initials: 'SK',
      gradient: 'from-teal-500 to-emerald-600',
      linkedin: '#',
      twitter: '#',
    },
  ]

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight">
            Meet the{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              Team
            </span>
          </h2>
          <p className="mt-2 text-[17px] text-muted-foreground">
            The people behind <ShijlAIBrand variant="compact" />
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {founders.map((founder, i) => (
            <motion.div
              key={founder.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...springTransition, delay: i * 0.08 }}
              whileHover={{ y: -6, transition: { duration: 0.25 } }}
              className="group rounded-2xl ios-shadow-sm bg-card p-6 text-center relative overflow-hidden"
            >
              {/* Hover gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative">
                <div className={`mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br ${founder.gradient} text-white ios-shadow transition-transform duration-300 group-hover:scale-110`}>
                  <span className="text-[20px] font-bold">{founder.initials}</span>
                </div>
                <h3 className="text-[17px] font-semibold">{founder.name}</h3>
                <p className="text-[11px] font-medium text-primary mt-0.5">{founder.role}</p>
                <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">{founder.bio}</p>

                {/* Social links */}
                <div className="mt-4 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  <a
                    href={founder.linkedin}
                    className="flex size-8 items-center justify-center rounded-full bg-muted/80 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    aria-label={`${founder.name} LinkedIn profile`}
                  >
                    <Linkedin className="size-3.5" />
                  </a>
                  <a
                    href={founder.twitter}
                    className="flex size-8 items-center justify-center rounded-full bg-muted/80 hover:bg-teal-100 dark:hover:bg-teal-950/40 text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                    aria-label={`${founder.name} Twitter profile`}
                  >
                    <Twitter className="size-3.5" />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Stats Section (with animated counters)
function AboutStatsSection() {
  const stats = [
    { value: 50000, suffix: '+', label: 'Active Students', icon: Users },
    { value: 500, suffix: '+', label: 'Courses', icon: BookOpen },
    { value: 200, suffix: '+', label: 'Instructors', icon: Award },
    { value: 15000, suffix: '+', label: 'Certificates Issued', icon: Star },
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
                <p className="text-[28px] sm:text-[34px] font-bold text-white">
                  <CountUpNumber end={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-[13px] text-emerald-200">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// Values Section
function ValuesSection() {
  const values = [
    {
      icon: Heart,
      title: 'Accessibility',
      description: 'Every student worldwide deserves world-class education, regardless of location or income.',
      color: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    },
    {
      icon: Lightbulb,
      title: 'Innovation',
      description: 'We push the boundaries of AI to create learning experiences that were never possible before.',
      color: 'bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400',
    },
    {
      icon: Star,
      title: 'Quality',
      description: 'Every course, every lesson, every AI response meets the highest standards of educational quality.',
      color: 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'We build for and with our community. Student and instructor feedback shapes every feature.',
      color: 'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400',
    },
  ]

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight">
            Our{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              Values
            </span>
          </h2>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value, i) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...springTransition, delay: i * 0.08 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="rounded-2xl ios-shadow-sm bg-card p-6"
            >
              <div className={`flex size-12 items-center justify-center rounded-xl ${value.color} mb-4`}>
                <value.icon className="size-6" />
              </div>
              <h3 className="text-[17px] font-semibold mb-2">{value.title}</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{value.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Partners & Accreditations Section
function PartnersSection() {
  const partners = [
    { name: 'IB Organization', icon: Landmark, description: 'Authorized by' },
    { name: 'College Board', icon: BadgeCheck, description: 'AP Aligned' },
    { name: 'AKU-EB', icon: University, description: 'Board Partner' },
    { name: 'LUMS', icon: GraduationCapIcon, description: 'Academic Partner' },
    { name: 'PSEB', icon: Building2, description: 'Registered With' },
    { name: 'NITB', icon: Handshake, description: 'Endorsed By' },
  ]

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-muted/30 to-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight">
            Trusted{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              Partners
            </span>{' '}
            & Accreditations
          </h2>
          <p className="mt-2 text-[17px] text-muted-foreground">
            Recognized and aligned with the world&apos;s leading educational institutions
          </p>
        </motion.div>

        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {partners.map((partner, i) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ ...springTransition, delay: i * 0.06 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group rounded-2xl ios-shadow-sm bg-card p-5 text-center flex flex-col items-center gap-2"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-950/50 transition-colors">
                <partner.icon className="size-6" />
              </div>
              <div>
                <p className="text-[13px] font-semibold">{partner.name}</p>
                <p className="text-[11px] text-muted-foreground">{partner.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Press Section
function PressSection() {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight">
            As Seen In
          </h2>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-6">
          {[
            'TechCrunch',
            'Dawn',
            'Express Tribune',
            'EdSurge',
            'EdTech Review',
          ].map((publication) => (
            <div
              key={publication}
              className="rounded-2xl ios-shadow-sm bg-card px-6 py-3 flex items-center gap-2"
            >
              <Newspaper className="size-4 text-muted-foreground" />
              <span className="text-[13px] font-medium text-muted-foreground">{publication}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// FAQ Section
function FAQSection() {
  const faqs = [
    {
      question: <>Is <ShijlAIBrand variant="compact" /> free to use?</>,
      answer: 'We offer a generous free tier that gives you access to select courses and Ask ShijlAI with limited daily usage. Premium plans unlock unlimited access to all courses, full Ask ShijlAI capabilities, certificates, and more.',
    },
    {
      question: 'Are the courses aligned with international curricula?',
      answer: 'Yes! All our IB, AP, Cambridge, and IELTS courses are meticulously aligned with the latest syllabi from international examination boards. Our content team includes former examiners and top educators.',
    },
    {
      question: 'How does Ask ShijlAI work?',
      answer: 'Ask ShijlAI uses advanced language models fine-tuned on international curricula. It can explain concepts in multiple languages, solve problems step-by-step, generate practice questions, and adapt its teaching style to your learning pace.',
    },
    {
      question: <>Can I become an instructor on <ShijlAIBrand variant="compact" />?</>,
      answer: 'Absolutely! We welcome qualified instructors who want to share their knowledge. You can apply through our instructor program. We provide tools for course creation, AI-assisted content generation, and a revenue-sharing model.',
    },
    {
      question: 'Do you offer certificates upon course completion?',
      answer: 'Yes, we provide verifiable digital certificates for all completed courses. These certificates include a unique verification code and can be shared on LinkedIn or added to your professional portfolio.',
    },
    {
      question: 'Is the platform available in multiple languages?',
      answer: 'Yes, our platform supports multiple languages including English, Arabic, and more. Course content, Ask ShijlAI interactions, and the interface can be used in various languages. We are continuously expanding our multilingual support.',
    },
  ]

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-muted/30 to-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-4 py-1.5 text-[13px] font-medium text-emerald-700 dark:text-emerald-400 mb-4">
              <MessageSquare className="size-3.5" />
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

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-100 dark:bg-teal-950/40 px-4 py-1.5 text-[13px] font-medium text-teal-700 dark:text-teal-400 mb-4">
              <Send className="size-3.5" />
              Contact Us
            </div>
            <h2 className="text-[28px] sm:text-[34px] font-bold tracking-tight mb-2">
              Get in{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                Touch
              </span>
            </h2>
            <p className="text-[15px] text-muted-foreground mb-6">
              Have a question that&apos;s not answered above? We&apos;d love to hear from you.
            </p>

            <ContactForm />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// Contact Form Component
function ContactForm() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
      setFormState({ name: '', email: '', subject: '', message: '' })
      setTimeout(() => setSubmitted(false), 3000)
    }, 1000)
  }, [])

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl ios-shadow-sm bg-card p-6 space-y-4">
      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-[13px] font-medium text-emerald-700 dark:text-emerald-400"
        >
          <CheckCircle className="size-4" />
          Message sent successfully! We&apos;ll get back to you soon.
        </motion.div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name" className="text-[13px]">Full Name</Label>
          <Input
            id="contact-name"
            placeholder="Your name"
            value={formState.name}
            onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
            required
            className="text-[13px]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email" className="text-[13px]">Email</Label>
          <Input
            id="contact-email"
            type="email"
            placeholder="you@example.com"
            value={formState.email}
            onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
            required
            className="text-[13px]"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-subject" className="text-[13px]">Subject</Label>
        <Input
          id="contact-subject"
          placeholder="How can we help?"
          value={formState.subject}
          onChange={(e) => setFormState(prev => ({ ...prev, subject: e.target.value }))}
          required
          className="text-[13px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message" className="text-[13px]">Message</Label>
        <Textarea
          id="contact-message"
          placeholder="Tell us more..."
          value={formState.message}
          onChange={(e) => setFormState(prev => ({ ...prev, message: e.target.value }))}
          required
          rows={4}
          className="text-[13px] resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md ios-press"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="inline-block size-4 border-2 border-white/30 border-t-white rounded-full"
            />
            Sending...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Send className="size-4" />
            Send Message
          </span>
        )}
      </Button>
    </form>
  )
}

// CTA Section
function CTASection() {
  const { setCurrentView } = useAppStore()

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl overflow-hidden ios-shadow"
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700" />

          {/* Decorative elements */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />

          <div className="relative px-6 py-12 sm:px-10 sm:py-16 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm px-4 py-1.5 text-[13px] font-medium text-white/90 mb-6">
                <Zap className="size-3.5" />
                Start your journey today
              </div>
              <h2 className="text-[28px] sm:text-[36px] lg:text-[44px] font-bold text-white tracking-tight leading-[1.15]">
                Ready to Start Learning?
              </h2>
              <p className="mt-4 text-[17px] text-emerald-100 max-w-2xl mx-auto leading-relaxed">
                Join 50,000+ students worldwide already transforming their education with AI-powered personalized learning.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  size="lg"
                  onClick={() => setCurrentView('public-courses')}
                  className="rounded-full bg-white text-emerald-700 hover:bg-white/90 shadow-lg px-8 h-12 text-[15px] font-semibold ios-press"
                >
                  Explore Courses
                  <ChevronRight className="size-4 ml-1" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setCurrentView('instructors')}
                  className="rounded-full border-white/30 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:text-white px-8 h-12 text-[15px] font-semibold ios-press"
                >
                  Become an Instructor
                  <ArrowRight className="size-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// Footer
function AboutFooter() {
  const { setCurrentView } = useAppStore()

  return (
    <footer className="border-t bg-muted/30 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShijlAILogo size="xs" className="shrink-0" />
            <span className="text-[14px] font-semibold"><ShijlAIBrand variant="compact" /></span>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: 'Privacy', view: 'landing' as const },
              { label: 'Terms', view: 'landing' as const },
              { label: 'Contact', view: 'about' as const },
            ].map((link) => (
              <button
                key={link.label}
                onClick={() => setCurrentView(link.view)}
                className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </button>
            ))}
          </div>
          <p className="text-[12px] text-muted-foreground">
            2025 <ShijlAIBrand variant="compact" />. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export function AboutView() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav activeView="about" />
      <div className="flex-1">
        <MissionSection />
        <FoundingStorySection />
        <AboutStatsSection />
        <TeamSection />
        <PartnersSection />
        <ValuesSection />
        <PressSection />
        <FAQSection />
        <CTASection />
      </div>
      <AboutFooter />
    </div>
  )
}
