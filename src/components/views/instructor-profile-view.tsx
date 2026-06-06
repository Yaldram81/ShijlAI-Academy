'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Camera, Star, BookOpen, Users, DollarSign, TrendingUp,
  Edit3, Share2, Plus, CheckCircle2, Shield, BadgeCheck,
  Globe, Linkedin, Twitter, Youtube, Phone, Mail,
  Trash2, Loader2, Sparkles, X, ExternalLink, ChevronRight,
  Award, Clock, BarChart3, Wallet, CreditCard, Settings,
  Bell, Lock, Palette, Webhook, FileText, MessageSquare,
  ArrowUpRight, ArrowDownRight, GraduationCap, Layers,
  AlertCircle, Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { InstructorStatCard, InstructorStatCardGrid } from '@/components/instructor/instructor-stat-card'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

// ═══════════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════════

interface ProfileData {
  displayName: string
  headline: string
  bio: string
  website: string
  linkedin: string
  twitter: string
  youtube: string
  phone: string
  avatar: string | null
  expertise: string[]
  languages: Array<{ name: string; verified: boolean }>
  email: string
  emailVerified: boolean
  mfaEnabled: boolean
  ntn: string | null
  ntnVerified: boolean
  cnic: string | null
  topicProposal: string | null
}

interface CourseItem {
  id: string
  title: string
  category: string
  level: string
  thumbnail: string | null
  price: number
  enrollmentCount: number
  rating: number
  status: 'published' | 'draft' | 'under_review'
  reviewStatus: string
}

interface RevenueOverview {
  totalEarned: number
  thisMonth: number
  availableBalance: number
  totalPaidOut: number
  monthlyBreakdown: Array<{ month: string; earnings: number }>
  defaultPayoutMethod: string | null
}

interface ReviewItem {
  id: string
  studentName: string
  studentAvatar: string | null
  courseName: string
  rating: number
  comment: string
  createdAt: string
}

interface ReviewSummary {
  averageRating: number
  totalReviews: number
  breakdown: { 5: number; 4: number; 3: number; 2: number; 1: number }
}

interface TeachingStats {
  totalRevenue: number
  avgCourseRating: number
  totalStudents: number
  avgCompletionRate: number
  totalCourses: number
  publishedCourses: number
}

interface FullProfileData {
  profile: ProfileData
  teachingStats: TeachingStats
  courses: CourseItem[]
  revenue: RevenueOverview
  reviews: ReviewItem[]
  reviewSummary: ReviewSummary
  profileCompletion: number
}

type ProfileTab = 'overview' | 'courses' | 'professional' | 'earnings' | 'reviews' | 'settings'
type CourseFilter = 'all' | 'published' | 'draft' | 'under_review'

// ═══════════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════════

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

const EXPERTISE_COLORS: Record<string, string> = {
  'Python': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  'JavaScript': 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  'React': 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
  'Data Science': 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
  'Machine Learning': 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
  'Web Development': 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400',
  'Mathematics': 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
  'Physics': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400',
  'AWS': 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
  'DevOps': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400',
}

const DEFAULT_EXPERTISE_COLOR = 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400'

const STATUS_CONFIG: Record<string, { label: string; color: string; dotColor: string }> = {
  published: { label: 'Published', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400', dotColor: 'bg-emerald-500' },
  draft: { label: 'Draft', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400', dotColor: 'bg-amber-500' },
  under_review: { label: 'Under Review', color: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400', dotColor: 'bg-sky-500' },
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
}

const COMMON_LANGUAGES = [
  'English', 'Arabic', 'Hindi', 'French', 'Spanish', 'German',
  'French', 'German', 'Spanish', 'Mandarin', 'Japanese', 'Korean',
  'Turkish', 'Persian', 'Pashto', 'Bengali',
]

const SETTINGS_LINKS = [
  { title: 'Account Settings', description: 'Email, password, phone, 2FA', icon: Settings, view: 'instructor-settings' as const, gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-100 dark:bg-violet-950/40', iconColor: 'text-violet-600 dark:text-violet-400' },
  { title: 'Notification Preferences', description: 'Email, push, and in-app alerts', icon: Bell, view: 'instructor-settings' as const, gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-100 dark:bg-amber-950/40', iconColor: 'text-amber-600 dark:text-amber-400' },
  { title: 'Payout Settings', description: 'Bank accounts, payout schedule', icon: CreditCard, view: 'instructor-settings' as const, gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-100 dark:bg-emerald-950/40', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  { title: 'Privacy Settings', description: 'Profile visibility, data sharing', icon: Lock, view: 'instructor-settings' as const, gradient: 'from-rose-500 to-pink-600', bg: 'bg-rose-100 dark:bg-rose-950/40', iconColor: 'text-rose-600 dark:text-rose-400' },
  { title: 'Integration Settings', description: 'Webhooks, API keys, third-party', icon: Webhook, view: 'instructor-settings' as const, gradient: 'from-cyan-500 to-blue-600', bg: 'bg-cyan-100 dark:bg-cyan-950/40', iconColor: 'text-cyan-600 dark:text-cyan-400' },
]

// ═══════════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════════

function formatUSD(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1000000) return `${sign}$${(abs / 1000000).toFixed(1)}M`
  if (abs >= 1000) return `${sign}$${abs.toLocaleString()}`
  return `${sign}$${abs.toLocaleString()}`
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
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

function renderStars(rating: number, size = 'size-3.5'): React.ReactNode[] {
  const stars: React.ReactNode[] = []
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(<Star key={i} className={`${size} fill-amber-400 text-amber-400`} />)
    } else if (i - rating < 1 && i - rating > 0) {
      stars.push(<Star key={i} className={`${size} fill-amber-400/50 text-amber-400`} />)
    } else {
      stars.push(<Star key={i} className={`${size} text-muted-foreground/30`} />)
    }
  }
  return stars
}

function calcProfileCompletion(profile: ProfileData): number {
  let score = 0
  if (profile.avatar) score += 15
  if (profile.displayName.trim()) score += 15
  if (profile.headline.trim()) score += 15
  if (profile.bio.trim()) score += 20
  if (profile.expertise.length > 0) score += 10
  if (profile.languages.length > 0) score += 10
  if (profile.website || profile.linkedin || profile.twitter || profile.youtube) score += 15
  return Math.min(score, 100)
}

// ═══════════════════════════════════════════════════════════════════════════════
// Loading Skeleton
// ═══════════════════════════════════════════════════════════════════════════════

function ProfileSkeleton() {
  return (
    <div className="space-y-6 pb-4">
      {/* Hero skeleton */}
      <div className="rounded-2xl overflow-hidden">
        <Skeleton className="h-32 w-full" />
        <div className="bg-card p-6 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="size-24 rounded-2xl -mt-16 ring-4 ring-card" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
            <Skeleton className="h-9 w-36 rounded-xl" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center space-y-1">
                <Skeleton className="h-6 w-12 mx-auto" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Tab content skeleton */}
      <div className="space-y-4">
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-card p-5 space-y-3">
              <Skeleton className="size-10 rounded-xl" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Star Rating Display
// ═══════════════════════════════════════════════════════════════════════════════

function RatingDisplay({ rating, count, size = 'size-4' }: { rating: number; count?: number; size?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">{renderStars(rating, size)}</div>
      <span className="text-sm font-semibold text-foreground">{rating.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-xs text-muted-foreground">({count.toLocaleString()})</span>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Mini Course Card
// ═══════════════════════════════════════════════════════════════════════════════

function MiniCourseCard({ course }: { course: CourseItem }) {
  const { setCurrentView, setSelectedCourse } = useAppStore()
  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="rounded-xl border bg-card overflow-hidden cursor-pointer group shadow-sm hover:shadow-md transition-shadow"
      onClick={() => {
        setSelectedCourse({ id: course.id } as any)
        setCurrentView('course-detail')
      }}
    >
      <div className="h-28 bg-gradient-to-br from-violet-500/20 to-purple-600/20 relative overflow-hidden">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <BookOpen className="size-8 text-violet-400/40" />
          </div>
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <h4 className="text-[13px] font-semibold line-clamp-1 group-hover:text-primary transition-colors">{course.title}</h4>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">{renderStars(course.rating, 'size-2.5')}<span className="text-[11px] text-muted-foreground">{course.rating.toFixed(1)}</span></div>
          <span className="text-[11px] text-muted-foreground">{course.enrollmentCount} students</span>
        </div>
      </div>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Review Breakdown Bar Chart
// ═══════════════════════════════════════════════════════════════════════════════

function ReviewBreakdown({ breakdown, totalReviews }: { breakdown: ReviewSummary['breakdown']; totalReviews: number }) {
  const rows = [5, 4, 3, 2, 1] as const
  return (
    <div className="space-y-2.5">
      {rows.map(star => {
        const count = breakdown[star] || 0
        const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0
        return (
          <div key={star} className="flex items-center gap-3">
            <span className="text-sm font-medium w-3 text-right">{star}</span>
            <Star className="size-3.5 fill-amber-400 text-amber-400 shrink-0" />
            <div className="flex-1 h-2.5 rounded-full bg-muted/60 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: (5 - star) * 0.08 }}
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
              />
            </div>
            <span className="text-xs text-muted-foreground w-10 text-right">{count}</span>
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Edit Profile Dialog
// ═══════════════════════════════════════════════════════════════════════════════

function EditProfileDialog({
  open,
  onOpenChange,
  profile,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: ProfileData
  onSave: (data: Partial<ProfileData>) => Promise<void>
}) {
  const [form, setForm] = useState({
    displayName: profile.displayName,
    headline: profile.headline,
    bio: profile.bio,
    website: profile.website,
    linkedin: profile.linkedin,
    twitter: profile.twitter,
    youtube: profile.youtube,
    phone: profile.phone,
  })
  const [expertise, setExpertise] = useState<string[]>(profile.expertise)
  const [languages, setLanguages] = useState<Array<{ name: string; verified: boolean }>>(profile.languages)
  const [newTag, setNewTag] = useState('')
  const [newLang, setNewLang] = useState('')
  const [improvingBio, setImprovingBio] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({
        displayName: profile.displayName,
        headline: profile.headline,
        bio: profile.bio,
        website: profile.website,
        linkedin: profile.linkedin,
        twitter: profile.twitter,
        youtube: profile.youtube,
        phone: profile.phone,
      })
      setExpertise(profile.expertise)
      setLanguages(profile.languages)
    }
  }, [open, profile])

  const handleImproveBio = async () => {
    setImprovingBio(true)
    try {
      const res = await fetch('/api/instructor/ai/improve-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: form.bio, headline: form.headline }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to improve bio')
      setForm(prev => ({ ...prev, bio: data.content || data.bio || prev.bio }))
      toast.success('Bio improved by AI!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to improve bio')
    } finally {
      setImprovingBio(false)
    }
  }

  const addExpertise = () => {
    if (!newTag.trim()) return
    if (expertise.some(t => t.toLowerCase() === newTag.trim().toLowerCase())) {
      toast.error('Tag already exists')
      return
    }
    setExpertise(prev => [...prev, newTag.trim()])
    setNewTag('')
  }

  const removeExpertise = (tag: string) => setExpertise(prev => prev.filter(t => t !== tag))

  const addLanguage = () => {
    if (!newLang.trim()) return
    if (languages.some(l => l.name.toLowerCase() === newLang.trim().toLowerCase())) {
      toast.error('Language already added')
      return
    }
    setLanguages(prev => [...prev, { name: newLang.trim(), verified: false }])
    setNewLang('')
  }

  const removeLanguage = (name: string) => setLanguages(prev => prev.filter(l => l.name !== name))

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({
        ...form,
        expertise,
        languages,
      })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl p-0 overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-600 p-6 text-white">
          <DialogTitle className="text-[20px] font-bold text-white">Edit Profile</DialogTitle>
          <DialogDescription className="text-violet-200 text-[13px] mt-1">
            Update your public instructor profile information
          </DialogDescription>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6 space-y-5">
          {/* Display Name & Headline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[13px] font-semibold">Display Name</Label>
              <Input
                value={form.displayName}
                onChange={(e) => setForm(prev => ({ ...prev, displayName: e.target.value }))}
                className="rounded-xl"
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-semibold">Headline</Label>
              <Input
                value={form.headline}
                onChange={(e) => setForm(prev => ({ ...prev, headline: e.target.value }))}
                className="rounded-xl"
                placeholder="e.g., Senior Python Developer & Educator"
              />
            </div>
          </div>

          {/* Bio with AI Improve */}
          <div className="space-y-2">
            <Label className="text-[13px] font-semibold">Bio</Label>
            <div className="relative">
              <Textarea
                value={form.bio}
                onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
                rows={5}
                className="rounded-xl pr-28"
                placeholder="Tell students about yourself, your experience, and teaching style..."
                maxLength={2000}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleImproveBio}
                disabled={improvingBio || !form.bio.trim()}
                className="absolute top-2 right-2 h-7 gap-1 text-xs text-primary hover:text-primary rounded-lg bg-primary/5 hover:bg-primary/10"
              >
                {improvingBio ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />} AI Improve
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">{form.bio.length}/2000 characters</p>
          </div>

          <Separator />

          {/* Social Links */}
          <div className="space-y-3">
            <Label className="text-[13px] font-semibold">Social Links</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'website' as const, icon: <Globe className="size-4" />, placeholder: 'https://yourwebsite.com', bg: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' },
                { key: 'linkedin' as const, icon: <Linkedin className="size-4" />, placeholder: 'https://linkedin.com/in/yourname', bg: 'bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400' },
                { key: 'twitter' as const, icon: <Twitter className="size-4" />, placeholder: '@handle', bg: 'bg-slate-100 text-slate-600 dark:bg-slate-950/40 dark:text-slate-400' },
                { key: 'youtube' as const, icon: <Youtube className="size-4" />, placeholder: 'YouTube channel URL', bg: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' },
              ].map(link => (
                <div key={link.key} className="flex items-center gap-2.5">
                  <div className={cn('flex size-9 items-center justify-center rounded-lg shrink-0', link.bg)}>{link.icon}</div>
                  <Input
                    value={form[link.key]}
                    onChange={(e) => setForm(prev => ({ ...prev, [link.key]: e.target.value }))}
                    placeholder={link.placeholder}
                    className="rounded-xl flex-1"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label className="text-[13px] font-semibold">Phone</Label>
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg shrink-0 bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <Phone className="size-4" />
              </div>
              <Input
                value={form.phone}
                onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+92 300 1234567"
                className="rounded-xl flex-1"
              />
            </div>
          </div>

          <Separator />

          {/* Expertise Tags */}
          <div className="space-y-2">
            <Label className="text-[13px] font-semibold">Expertise Tags</Label>
            <div className="flex flex-wrap gap-2">
              {expertise.map(tag => (
                <Badge key={tag} variant="secondary" className="rounded-lg px-3 py-1.5 gap-1.5 text-xs font-medium">
                  {tag}
                  <button onClick={() => removeExpertise(tag)} className="hover:text-destructive transition-colors"><X className="size-3" /></button>
                </Badge>
              ))}
              <div className="flex items-center gap-1">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addExpertise()}
                  placeholder="Add tag"
                  className="h-8 w-28 rounded-lg text-xs"
                />
                <Button variant="ghost" size="sm" onClick={addExpertise} className="h-8 w-8 p-0 rounded-lg">
                  <Plus className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Languages */}
          <div className="space-y-2">
            <Label className="text-[13px] font-semibold">Languages</Label>
            <div className="flex flex-wrap gap-2">
              {languages.map(lang => (
                <Badge key={lang.name} variant="secondary" className="rounded-lg px-3 py-1.5 gap-1.5 text-xs font-medium">
                  {lang.name}
                  {lang.verified && <CheckCircle2 className="size-3 text-emerald-500" />}
                  <button onClick={() => removeLanguage(lang.name)} className="hover:text-destructive transition-colors"><X className="size-3" /></button>
                </Badge>
              ))}
              <div className="flex items-center gap-1">
                <Input
                  value={newLang}
                  onChange={(e) => setNewLang(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addLanguage()}
                  placeholder="Add language"
                  className="h-8 w-28 rounded-lg text-xs"
                  list="common-languages"
                />
                <datalist id="common-languages">
                  {COMMON_LANGUAGES.filter(l => !languages.some(cl => cl.name.toLowerCase() === l.toLowerCase())).map(l => (
                    <option key={l} value={l} />
                  ))}
                </datalist>
                <Button variant="ghost" size="sm" onClick={addLanguage} className="h-8 w-8 p-0 rounded-lg">
                  <Plus className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component: InstructorProfileView
// ═══════════════════════════════════════════════════════════════════════════════

export function InstructorProfileView() {
  const { currentUser, setCurrentView, setEditingCourseId } = useAppStore()

  // ─── State ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<FullProfileData | null>(null)
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [courseFilter, setCourseFilter] = useState<CourseFilter>('all')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Fetch profile data ───────────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    if (!currentUser?.id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/instructor/profile-full?instructorId=${currentUser.id}`)
      if (!res.ok) {
        // Fallback: compose from multiple endpoints
        const [profileRes, coursesRes, dashboardRes, revenueRes] = await Promise.allSettled([
          fetch(`/api/instructor/profile?instructorId=${currentUser.id}`),
          fetch(`/api/instructor/courses?instructorId=${currentUser.id}`),
          fetch(`/api/instructor/dashboard?instructorId=${currentUser.id}&period=30d`),
          fetch(`/api/instructor/revenue?instructorId=${currentUser.id}`),
        ])

        const profileData: ProfileData = {
          displayName: currentUser.name,
          headline: '',
          bio: currentUser.bio || '',
          website: '',
          linkedin: '',
          twitter: '',
          youtube: '',
          phone: '',
          avatar: currentUser.avatar,
          expertise: [],
          languages: [],
          email: currentUser.email,
          emailVerified: false,
          mfaEnabled: false,
          ntn: null,
          ntnVerified: false,
          cnic: null,
          topicProposal: null,
        }

        if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
          const p = await profileRes.value.json()
          if (p.profile) {
            profileData.displayName = p.profile.displayName || currentUser.name
            profileData.headline = p.profile.headline || ''
            profileData.bio = p.profile.bio || ''
            profileData.website = p.profile.website || ''
            profileData.linkedin = p.profile.linkedin || ''
            profileData.twitter = p.profile.twitter || ''
            profileData.youtube = p.profile.youtube || ''
            profileData.phone = p.profile.phone || ''
            profileData.avatar = p.profile.avatar || currentUser.avatar
            profileData.expertise = p.profile.expertise || []
            profileData.languages = p.profile.languages || []
            profileData.ntn = p.profile.ntn || null
            profileData.ntnVerified = p.profile.ntnVerified || false
          }
        }

        let teachingStats: TeachingStats = {
          totalRevenue: 0, avgCourseRating: 0, totalStudents: 0,
          avgCompletionRate: 0, totalCourses: 0, publishedCourses: 0,
        }
        if (dashboardRes.status === 'fulfilled' && dashboardRes.value.ok) {
          const d = await dashboardRes.value.json()
          if (d.stats) {
            teachingStats = {
              totalRevenue: d.stats.totalRevenue || 0,
              avgCourseRating: d.stats.avgRating || 0,
              totalStudents: d.stats.totalStudents || 0,
              avgCompletionRate: d.stats.completionRate || 0,
              totalCourses: d.stats.totalCourses || 0,
              publishedCourses: d.stats.activeCourses || 0,
            }
          }
        }

        let courses: CourseItem[] = []
        if (coursesRes.status === 'fulfilled' && coursesRes.value.ok) {
          const c = await coursesRes.value.json()
          courses = (c.courses || []).map((course: any) => ({
            id: course.id,
            title: course.title,
            category: course.category,
            level: course.level,
            thumbnail: course.thumbnail,
            price: course.price,
            enrollmentCount: course.enrollmentCount,
            rating: course.rating,
            status: course.isPublished ? 'published' : (course.reviewStatus === 'under_review' ? 'under_review' : 'draft'),
            reviewStatus: course.reviewStatus || 'draft',
          }))
        }

        let revenue: RevenueOverview = {
          totalEarned: 0, thisMonth: 0, availableBalance: 0,
          totalPaidOut: 0, monthlyBreakdown: [], defaultPayoutMethod: null,
        }
        if (revenueRes.status === 'fulfilled' && revenueRes.value.ok) {
          const r = await revenueRes.value.json()
          revenue = {
            totalEarned: r.overview?.allTimeEarnings || 0,
            thisMonth: r.overview?.earnedThisMonth || 0,
            availableBalance: r.overview?.availableForPayout || 0,
            totalPaidOut: r.overview?.totalPaidOut || 0,
            monthlyBreakdown: r.monthlyEarnings || [],
            defaultPayoutMethod: r.payoutMethods?.find((m: any) => m.active)?.label || null,
          }
        }

        const completion = calcProfileCompletion(profileData)
        const reviewSummary: ReviewSummary = { averageRating: teachingStats.avgCourseRating, totalReviews: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }

        setData({ profile: profileData, teachingStats, courses, revenue, reviews: [], reviewSummary, profileCompletion: completion })
        return
      }

      const json = await res.json()

      // Transform API response to component data shape
      // API returns: { personalInfo, instructorProfile, teachingStats, courseShowcase, payoutSummary, verificationStatus, profileCompletion }
      // Component expects: { profile, teachingStats, courses, revenue, reviews, reviewSummary, profileCompletion }
      const p = json.personalInfo || {}
      const ip = json.instructorProfile || {}
      const ts = json.teachingStats || {}
      const cs = json.courseShowcase || []
      const ps = json.payoutSummary || {}
      const vs = json.verificationStatus || {}
      const pc = json.profileCompletion || {}

      const transformedProfile: ProfileData = {
        displayName: p.name || currentUser.name,
        headline: ip.headline || '',
        bio: p.bio || currentUser.bio || '',
        website: ip.website || '',
        linkedin: ip.linkedin || '',
        twitter: ip.twitter || '',
        youtube: ip.youtube || '',
        phone: p.phone || '',
        avatar: p.avatar || currentUser.avatar || null,
        expertise: Array.isArray(ip.expertise) ? ip.expertise : [],
        languages: Array.isArray(ip.languages) ? ip.languages : [],
        email: p.email || currentUser.email,
        emailVerified: vs.isVerified || false,
        mfaEnabled: vs.mfaEnabled || false,
        ntn: ip.ntn || null,
        ntnVerified: ip.ntnVerified || false,
        cnic: ip.cnic || null,
        topicProposal: ip.topicProposal || null,
      }

      const transformedTeachingStats: TeachingStats = {
        totalRevenue: ts.totalRevenue || 0,
        avgCourseRating: ts.avgCourseRating || 0,
        totalStudents: ts.totalStudents || 0,
        avgCompletionRate: ts.avgCompletionRate || 0,
        totalCourses: ts.totalCourses || 0,
        publishedCourses: ts.publishedCourses || 0,
      }

      const transformedCourses: CourseItem[] = (cs || []).map((c: any) => ({
        id: c.id,
        title: c.title,
        category: c.category,
        level: c.level,
        thumbnail: c.thumbnail,
        price: c.price,
        enrollmentCount: c.enrollmentCount,
        rating: c.rating,
        status: c.isPublished ? 'published' : (c.reviewStatus === 'under_review' ? 'under_review' : 'draft'),
        reviewStatus: c.reviewStatus || 'draft',
      }))

      const transformedRevenue: RevenueOverview = {
        totalEarned: ps.totalEarned || 0,
        thisMonth: ts.thisMonthRevenue || 0,
        availableBalance: ps.availableBalance || 0,
        totalPaidOut: ps.totalPaidOut || 0,
        monthlyBreakdown: [],
        defaultPayoutMethod: ps.defaultPayoutMethod?.type || null,
      }

      const transformedReviewSummary: ReviewSummary = {
        averageRating: ts.avgCourseRating || 0,
        totalReviews: ts.totalReviews || 0,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      }

      const transformedCompletion = pc.score ?? calcProfileCompletion(transformedProfile)

      setData({
        profile: transformedProfile,
        teachingStats: transformedTeachingStats,
        courses: transformedCourses,
        revenue: transformedRevenue,
        reviews: [],
        reviewSummary: transformedReviewSummary,
        profileCompletion: transformedCompletion,
      })
    } catch (err) {
      console.error('Failed to load profile:', err)
      toast.error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSaveProfile = async (updates: Partial<ProfileData>) => {
    if (!currentUser?.id) return
    try {
      const res = await fetch('/api/instructor/profile-full', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId: currentUser.id,
          displayName: updates.displayName,
          headline: updates.headline,
          bio: updates.bio,
          website: updates.website,
          linkedin: updates.linkedin,
          twitter: updates.twitter,
          youtube: updates.youtube,
          phone: updates.phone,
          expertise: updates.expertise,
          languages: updates.languages,
        }),
      })
      if (!res.ok) {
        // Fallback to standard profile endpoint
        const fallbackRes = await fetch('/api/instructor/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instructorId: currentUser.id,
            displayName: updates.displayName,
            headline: updates.headline,
            bio: updates.bio,
            website: updates.website,
            linkedin: updates.linkedin,
            twitter: updates.twitter,
            youtube: updates.youtube,
            expertise: updates.expertise,
            languages: updates.languages,
          }),
        })
        if (!fallbackRes.ok) throw new Error('Failed to save profile')
      }
      toast.success('Profile updated successfully!')
      fetchProfile()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save profile')
    }
  }

  const handleAvatarUpload = () => fileInputRef.current?.click()

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return }
    setUploadingAvatar(true)
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string
        const res = await fetch('/api/instructor/profile-full/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instructorId: currentUser?.id, avatarData: base64 }),
        })
        if (!res.ok) {
          // Fallback
          const fallbackRes = await fetch('/api/instructor/settings/avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser?.id, avatarData: base64 }),
          })
          if (!fallbackRes.ok) throw new Error('Failed to upload photo')
        }
        // Update local state immediately
        if (data) {
          setData(prev => prev ? { ...prev, profile: { ...prev.profile, avatar: base64 } } : prev)
        }
        toast.success('Photo uploaded!')
      }
      reader.readAsDataURL(file)
    } catch {
      toast.error('Failed to upload photo')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!currentUser?.id) return
    try {
      const res = await fetch('/api/instructor/profile-full/avatar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorId: currentUser.id }),
      })
      if (!res.ok) {
        const fallbackRes = await fetch('/api/instructor/settings/avatar', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id }),
        })
        if (!fallbackRes.ok) throw new Error('Failed to remove photo')
      }
      if (data) {
        setData(prev => prev ? { ...prev, profile: { ...prev.profile, avatar: null } } : prev)
      }
      toast.success('Photo removed')
    } catch {
      toast.error('Failed to remove photo')
    }
  }

  const handleShareProfile = () => {
    const url = `${window.location.origin}/instructor/${currentUser?.id}`
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Profile link copied to clipboard!')
      setShareDialogOpen(false)
    }).catch(() => {
      toast.error('Failed to copy link')
    })
  }

  const handleCreateCourse = () => {
    setEditingCourseId(null)
    setCurrentView('course-creator')
  }

  // ─── Computed ─────────────────────────────────────────────────────────────

  const filteredCourses = useMemo(() => {
    if (!data?.courses) return []
    if (courseFilter === 'all') return data.courses
    return data.courses.filter(c => c.status === courseFilter)
  }, [data?.courses, courseFilter])

  const completionTips = useMemo(() => {
    if (!data?.profile) return []
    const tips: string[] = []
    if (!data.profile.avatar) tips.push('Add a profile photo')
    if (!data.profile.displayName.trim()) tips.push('Set your display name')
    if (!data.profile.headline.trim()) tips.push('Add a professional headline')
    if (!data.profile.bio.trim()) tips.push('Write a bio')
    if (data.profile.expertise.length === 0) tips.push('Add expertise tags')
    if (data.profile.languages.length === 0) tips.push('Add languages')
    if (!data.profile.website && !data.profile.linkedin && !data.profile.twitter && !data.profile.youtube) tips.push('Link social profiles')
    return tips
  }, [data?.profile])

  // ─── Loading State ────────────────────────────────────────────────────────
  if (loading || !data) return <ProfileSkeleton />

  const { profile, teachingStats, courses, revenue, reviews, reviewSummary, profileCompletion } = data

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6 pb-4">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

      {/* ═══════════════════════════════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springTransition}
        className="rounded-2xl overflow-hidden shadow-sm border"
      >
        {/* Cover gradient */}
        <div className="relative h-32 sm:h-40 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(255,255,255,0.1),_transparent_50%)]" />
          {/* Decorative shapes */}
          <div className="absolute top-4 right-8 size-20 rounded-full bg-white/5 blur-xl" />
          <div className="absolute bottom-0 left-16 size-32 rounded-full bg-white/5 blur-2xl" />
        </div>

        {/* Profile info */}
        <div className="relative bg-card px-5 sm:px-8 pb-6">
          {/* Avatar */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-14">
            <div className="relative group shrink-0">
              <Avatar className="size-24 sm:size-[96px] ring-4 ring-card rounded-2xl shadow-lg">
                <AvatarImage src={profile.avatar || undefined} alt={profile.displayName} />
                <AvatarFallback className="text-2xl bg-gradient-to-br from-violet-400 to-purple-500 text-white font-bold rounded-2xl">
                  {getInitials(profile.displayName || 'IN')}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={handleAvatarUpload}
                className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {uploadingAvatar ? (
                  <Loader2 className="size-6 text-white animate-spin" />
                ) : (
                  <Camera className="size-6 text-white" />
                )}
              </button>
              {profile.avatar && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleRemoveAvatar}
                        className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 transition-colors"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Remove photo</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Name, headline, badges */}
            <div className="flex-1 min-w-0 pt-2 sm:pt-0 sm:pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight">{profile.displayName || 'Instructor'}</h1>
                <div className="flex items-center gap-1.5">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className="gap-1 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-[10px] px-2 py-0.5 border-0">
                          <CheckCircle2 className="size-3" /> Verified
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>Email verified</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {profile.ntnVerified && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className="gap-1 rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400 text-[10px] px-2 py-0.5 border-0">
                            <BadgeCheck className="size-3" /> NTN Verified
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>NTN tax verification confirmed</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
              <p className="text-[14px] text-muted-foreground mt-0.5">{profile.headline || 'Add a professional headline'}</p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:pb-1">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5 text-xs"
                onClick={() => setEditDialogOpen(true)}
              >
                <Edit3 className="size-3.5" /> Edit Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5 text-xs"
                onClick={() => setShareDialogOpen(true)}
              >
                <Share2 className="size-3.5" /> Share
              </Button>
              <Button
                size="sm"
                className="rounded-xl gap-1.5 text-xs bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700 shadow-md shadow-violet-500/20"
                onClick={handleCreateCourse}
              >
                <Plus className="size-3.5" /> Create Course
              </Button>
            </div>
          </div>

          {/* Profile completion */}
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-semibold text-muted-foreground">Profile Completion</span>
                <span className="text-[12px] font-bold text-primary">{profileCompletion}%</span>
              </div>
              {completionTips.length > 0 && (
                <span className="text-[11px] text-muted-foreground">{completionTips.length} item{completionTips.length !== 1 ? 's' : ''} to complete</span>
              )}
            </div>
            <Progress value={profileCompletion} className="h-2 rounded-full" />
            {completionTips.length > 0 && profileCompletion < 100 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {completionTips.map(tip => (
                  <Badge key={tip} variant="outline" className="rounded-lg text-[10px] gap-1 px-2 py-0.5 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                    <AlertCircle className="size-2.5" /> {tip}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-xl bg-muted/30 p-4">
            {[
              { label: 'Courses', value: teachingStats.totalCourses, icon: BookOpen, color: 'text-violet-600 dark:text-violet-400' },
              { label: 'Students', value: teachingStats.totalStudents, icon: Users, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Revenue', value: formatUSD(teachingStats.totalRevenue), icon: DollarSign, color: 'text-teal-600 dark:text-teal-400', isString: true },
              { label: 'Rating', value: teachingStats.avgCourseRating.toFixed(1), icon: Star, color: 'text-amber-600 dark:text-amber-400', isString: true },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springTransition, delay: 0.1 + i * 0.05 }}
                className="text-center space-y-1"
              >
                <stat.icon className={cn('size-4 mx-auto', stat.color)} />
                <p className="text-[18px] sm:text-[22px] font-bold tracking-tight">
                  {stat.isString ? stat.value : (stat.value as number).toLocaleString()}
                </p>
                <p className="text-[11px] text-muted-foreground font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          TABS
          ═══════════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springTransition, delay: 0.15 }}
      >
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProfileTab)}>
          {/* Tab Navigation - pill style */}
          <div className="flex items-center rounded-full bg-muted/60 p-0.5 overflow-x-auto no-scrollbar">
            {[
              { key: 'overview', label: 'Overview', icon: User },
              { key: 'courses', label: 'Courses', icon: BookOpen },
              { key: 'professional', label: 'Professional', icon: Award },
              { key: 'earnings', label: 'Earnings', icon: DollarSign },
              { key: 'reviews', label: 'Reviews', icon: Star },
              { key: 'settings', label: 'Settings', icon: Settings },
            ].map(tab => {
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-semibold transition-all whitespace-nowrap shrink-0',
                    isActive
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <tab.icon className="size-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.slice(0, 3)}</span>
                </button>
              )
            })}
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              TAB 1: OVERVIEW
              ═══════════════════════════════════════════════════════════════ */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Bio */}
            {profile.bio && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springTransition, delay: 0.1 }}
                className="rounded-xl border bg-card p-5 shadow-sm"
              >
                <h3 className="text-[15px] font-semibold mb-2">About</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
              </motion.div>
            )}

            {/* Teaching Stats Grid */}
            <InstructorStatCardGrid columns={4}>
              <InstructorStatCard
                label="Total Revenue"
                value={formatUSD(teachingStats.totalRevenue)}
                icon={DollarSign}
                color="emerald"
                index={0}
              />
              <InstructorStatCard
                label="Avg. Course Rating"
                value={teachingStats.avgCourseRating.toFixed(1)}
                icon={Star}
                color="amber"
               
                extra={<div className="flex items-center gap-0.5 mt-1">{renderStars(teachingStats.avgCourseRating, 'size-2.5')}</div>}
                index={1}
              />
              <InstructorStatCard
                label="Total Students"
                value={teachingStats.totalStudents.toLocaleString()}
                icon={Users}
                color="violet"
               
                index={2}
              />
              <InstructorStatCard
                label="Avg. Completion Rate"
                value={`${teachingStats.avgCompletionRate}%`}
                icon={TrendingUp}
                color="teal"
               
                index={3}
              />
            </InstructorStatCardGrid>

            {/* Course Showcase */}
            {courses.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springTransition, delay: 0.4 }}
                className="rounded-xl border bg-card p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[15px] font-semibold">Top Courses</h3>
                  <Button variant="ghost" size="sm" className="text-xs text-primary gap-1" onClick={() => setActiveTab('courses')}>
                    View all <ChevronRight className="size-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {courses
                    .filter(c => c.status === 'published')
                    .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
                    .slice(0, 4)
                    .map(course => (
                      <MiniCourseCard key={course.id} course={course} />
                    ))}
                </div>
                {courses.filter(c => c.status === 'published').length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="size-8 mx-auto mb-2 opacity-30" />
                    <p className="text-[13px]">No published courses yet</p>
                    <Button variant="outline" size="sm" className="mt-3 rounded-xl gap-1.5 text-xs" onClick={handleCreateCourse}>
                      <Plus className="size-3.5" /> Create your first course
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Verification Status */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.5 }}
              className="rounded-xl border bg-card p-5 shadow-sm"
            >
              <h3 className="text-[15px] font-semibold mb-4">Verification Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Email', verified: profile.emailVerified, icon: Mail },
                  { label: 'Two-Factor Auth', verified: profile.mfaEnabled, icon: Shield },
                  { label: 'NTN', verified: profile.ntnVerified, icon: BadgeCheck },
                ].map(item => (
                  <div
                    key={item.label}
                    className={cn(
                      'flex items-center gap-3 rounded-xl p-3.5 transition-colors',
                      item.verified ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-amber-50 dark:bg-amber-950/30'
                    )}
                  >
                    <div className={cn(
                      'flex size-9 items-center justify-center rounded-xl shrink-0',
                      item.verified
                        ? 'bg-emerald-100 dark:bg-emerald-950/40'
                        : 'bg-amber-100 dark:bg-amber-950/40'
                    )}>
                      <item.icon className={cn(
                        'size-4',
                        item.verified
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      )} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold">{item.label}</p>
                      <p className={cn(
                        'text-[11px] font-medium',
                        item.verified
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      )}>
                        {item.verified ? 'Verified' : 'Not verified'}
                      </p>
                    </div>
                    {item.verified && <CheckCircle2 className="size-4 text-emerald-500 ml-auto shrink-0" />}
                  </div>
                ))}
              </div>
            </motion.div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════
              TAB 2: COURSES
              ═══════════════════════════════════════════════════════════════ */}
          <TabsContent value="courses" className="mt-6 space-y-4">
            {/* Filter tabs + CTA */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center rounded-full bg-muted/60 p-0.5">
                {(['all', 'published', 'draft', 'under_review'] as CourseFilter[]).map(filter => {
                  const isActive = courseFilter === filter
                  const label = filter === 'all' ? 'All' : filter === 'under_review' ? 'Under Review' : filter.charAt(0).toUpperCase() + filter.slice(1)
                  const count = filter === 'all' ? courses.length : courses.filter(c => c.status === filter).length
                  return (
                    <button
                      key={filter}
                      onClick={() => setCourseFilter(filter)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all',
                        isActive ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {label}
                      <span className={cn(
                        'flex size-4 items-center justify-center rounded-full text-[9px] font-bold',
                        isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                      )}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
              <Button
                size="sm"
                className="gap-1.5 rounded-xl text-xs bg-gradient-to-r from-violet-500 to-purple-600 text-white"
                onClick={handleCreateCourse}
              >
                <Plus className="size-3.5" /> Create New Course
              </Button>
            </div>

            {/* Courses grid */}
            {filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCourses.map((course, i) => {
                  const status = STATUS_CONFIG[course.status] || STATUS_CONFIG.draft
                  return (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...springTransition, delay: i * 0.05 }}
                      className="rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                    >
                      {/* Thumbnail */}
                      <div className="h-32 bg-gradient-to-br from-violet-500/20 to-purple-600/20 relative overflow-hidden">
                        {course.thumbnail ? (
                          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Layers className="size-8 text-violet-400/40" />
                          </div>
                        )}
                        <Badge className={cn('absolute top-2 right-2 text-[10px] rounded-lg gap-1 px-2 border-0', status.color)}>
                          <div className={cn('size-1.5 rounded-full', status.dotColor)} />
                          {status.label}
                        </Badge>
                      </div>
                      <div className="p-4 space-y-2">
                        <h4 className="text-[14px] font-semibold line-clamp-1 group-hover:text-primary transition-colors">{course.title}</h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] rounded-lg">{course.category}</Badge>
                          <Badge className={cn('text-[10px] rounded-lg border-0', LEVEL_COLORS[course.level] || LEVEL_COLORS.beginner)}>
                            {course.level}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[13px] font-bold text-primary">{course.price === 0 ? 'Free' : `$${course.price.toLocaleString()}`}</span>
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                              <Users className="size-3" /> {course.enrollmentCount}
                            </span>
                            <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                              <Star className="size-3 fill-amber-400 text-amber-400" /> {course.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-16 rounded-xl border-2 border-dashed">
                <BookOpen className="size-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-[15px] font-medium text-muted-foreground">
                  {courseFilter === 'all' ? 'No courses yet' : `No ${STATUS_CONFIG[courseFilter]?.label || courseFilter} courses`}
                </p>
                <p className="text-[13px] text-muted-foreground/60 mt-1">Create your first course to start teaching</p>
                <Button className="mt-4 rounded-xl gap-1.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white" onClick={handleCreateCourse}>
                  <Plus className="size-4" /> Create Course
                </Button>
              </div>
            )}
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════
              TAB 3: PROFESSIONAL
              ═══════════════════════════════════════════════════════════════ */}
          <TabsContent value="professional" className="mt-6 space-y-6">
            {/* Expertise */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.1 }}
              className="rounded-xl border bg-card p-5 shadow-sm"
            >
              <h3 className="text-[15px] font-semibold mb-3">Expertise</h3>
              {profile.expertise.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.expertise.map(tag => (
                    <Badge
                      key={tag}
                      className={cn('rounded-lg px-3 py-1.5 text-xs font-medium border-0', EXPERTISE_COLORS[tag] || DEFAULT_EXPERTISE_COLOR)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground">No expertise tags added yet. <button className="text-primary hover:underline" onClick={() => setEditDialogOpen(true)}>Add some</button></p>
              )}
            </motion.div>

            {/* Languages */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.15 }}
              className="rounded-xl border bg-card p-5 shadow-sm"
            >
              <h3 className="text-[15px] font-semibold mb-3">Languages</h3>
              {profile.languages.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map(lang => (
                    <Badge key={lang.name} variant="secondary" className="rounded-lg px-3 py-1.5 text-xs font-medium gap-1.5">
                      {lang.name}
                      {lang.verified && <CheckCircle2 className="size-3 text-emerald-500" />}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-muted-foreground">No languages added. <button className="text-primary hover:underline" onClick={() => setEditDialogOpen(true)}>Add languages</button></p>
              )}
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.2 }}
              className="rounded-xl border bg-card p-5 shadow-sm"
            >
              <h3 className="text-[15px] font-semibold mb-3">Social Links</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Website', value: profile.website, icon: Globe, href: profile.website, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-950/40' },
                  { label: 'LinkedIn', value: profile.linkedin, icon: Linkedin, href: profile.linkedin, color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-100 dark:bg-sky-950/40' },
                  { label: 'Twitter / X', value: profile.twitter, icon: Twitter, href: profile.twitter, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-950/40' },
                  { label: 'YouTube', value: profile.youtube, icon: Youtube, href: profile.youtube, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-950/40' },
                ].map(link => (
                  <div key={link.label} className={cn(
                    'flex items-center gap-3 rounded-xl p-3 transition-colors',
                    link.value ? 'bg-muted/30 hover:bg-muted/50' : 'bg-muted/10'
                  )}>
                    <div className={cn('flex size-9 items-center justify-center rounded-xl shrink-0', link.bg)}>
                      <link.icon className={cn('size-4', link.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-muted-foreground">{link.label}</p>
                      {link.value ? (
                        <a
                          href={link.href?.startsWith('http') ? link.href : `https://${link.href}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[13px] font-medium text-primary hover:underline truncate block"
                        >
                          {link.value}
                        </a>
                      ) : (
                        <p className="text-[13px] text-muted-foreground/60">Not set</p>
                      )}
                    </div>
                    {link.value && <ExternalLink className="size-3.5 text-muted-foreground/40 shrink-0" />}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Topic Proposal */}
            {profile.topicProposal && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springTransition, delay: 0.25 }}
                className="rounded-xl border bg-card p-5 shadow-sm"
              >
                <h3 className="text-[15px] font-semibold mb-2">Topic Proposal</h3>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{profile.topicProposal}</p>
              </motion.div>
            )}

            {/* NTN / CNIC Info */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.3 }}
              className="rounded-xl border bg-card p-5 shadow-sm"
            >
              <h3 className="text-[15px] font-semibold mb-4">Tax & Identity</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={cn(
                  'flex items-center gap-3 rounded-xl p-3.5',
                  profile.ntnVerified ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-muted/30'
                )}>
                  <div className={cn(
                    'flex size-9 items-center justify-center rounded-xl shrink-0',
                    profile.ntnVerified ? 'bg-emerald-100 dark:bg-emerald-950/40' : 'bg-muted/60'
                  )}>
                    <BadgeCheck className={cn(
                      'size-4',
                      profile.ntnVerified ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div>
                    <p className="text-[12px] text-muted-foreground">NTN</p>
                    <p className="text-[13px] font-semibold">{profile.ntn || 'Not provided'}</p>
                    {profile.ntnVerified && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Verified</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl p-3.5 bg-muted/30">
                  <div className="flex size-9 items-center justify-center rounded-xl shrink-0 bg-muted/60">
                    <FileText className="size-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[12px] text-muted-foreground">CNIC</p>
                    <p className="text-[13px] font-semibold">{profile.cnic || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════
              TAB 4: EARNINGS
              ═══════════════════════════════════════════════════════════════ */}
          <TabsContent value="earnings" className="mt-6 space-y-6">
            {/* Revenue Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Total Earned', value: revenue.totalEarned, icon: DollarSign, bg: 'bg-emerald-50 dark:bg-emerald-950/30', iconBg: 'bg-emerald-100 dark:bg-emerald-950/40', iconColor: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'This Month', value: revenue.thisMonth, icon: TrendingUp, bg: 'bg-teal-50 dark:bg-teal-950/30', iconBg: 'bg-teal-100 dark:bg-teal-950/40', iconColor: 'text-teal-600 dark:text-teal-400' },
                { label: 'Available Balance', value: revenue.availableBalance, icon: Wallet, bg: 'bg-violet-50 dark:bg-violet-950/30', iconBg: 'bg-violet-100 dark:bg-violet-950/40', iconColor: 'text-violet-600 dark:text-violet-400' },
                { label: 'Total Paid Out', value: revenue.totalPaidOut, icon: CreditCard, bg: 'bg-cyan-50 dark:bg-cyan-950/30', iconBg: 'bg-cyan-100 dark:bg-cyan-950/40', iconColor: 'text-cyan-600 dark:text-cyan-400' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springTransition, delay: i * 0.06 }}
                  className={cn('rounded-xl border p-4', stat.bg)}
                >
                  <div className={cn('flex size-9 items-center justify-center rounded-xl mb-3', stat.iconBg)}>
                    <stat.icon className={cn('size-4', stat.iconColor)} />
                  </div>
                  <p className="text-[22px] font-bold tracking-tight">{formatUSD(stat.value)}</p>
                  <p className="text-[12px] text-muted-foreground font-medium mt-0.5">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Default Payout Method */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.3 }}
              className="rounded-xl border bg-card p-5 shadow-sm"
            >
              <h3 className="text-[15px] font-semibold mb-3">Default Payout Method</h3>
              {revenue.defaultPayoutMethod ? (
                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
                    <CreditCard className="size-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold">{revenue.defaultPayoutMethod}</p>
                    <p className="text-[11px] text-muted-foreground">Active payout method</p>
                  </div>
                  <CheckCircle2 className="size-4 text-emerald-500 ml-auto" />
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3.5">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/40">
                    <AlertCircle className="size-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold">No payout method configured</p>
                    <Button variant="link" size="sm" className="text-[11px] p-0 h-auto text-primary" onClick={() => setCurrentView('instructor-settings')}>
                      Set up in Settings
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Monthly Earnings Chart Placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.4 }}
              className="rounded-xl border bg-card p-5 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-semibold">Monthly Earnings</h3>
                <Button variant="outline" size="sm" className="text-xs rounded-xl gap-1" onClick={() => setCurrentView('instructor-revenue')}>
                  <BarChart3 className="size-3.5" /> Full Report
                </Button>
              </div>
              {revenue.monthlyBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {revenue.monthlyBreakdown.slice(-6).map((item, i) => {
                    const maxEarning = Math.max(...revenue.monthlyBreakdown.map(m => m.earnings), 1)
                    const pct = (item.earnings / maxEarning) * 100
                    return (
                      <div key={item.month} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] font-medium text-muted-foreground">{item.month}</span>
                          <span className="text-[12px] font-bold">{formatUSD(item.earnings)}</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-muted/40 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut', delay: i * 0.1 }}
                            className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="size-8 mx-auto mb-2 opacity-30" />
                    <p className="text-[13px]">Earnings data will appear here</p>
                    <p className="text-[11px] text-muted-foreground/60">Start creating and selling courses</p>
                  </div>
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════
              TAB 5: REVIEWS
              ═══════════════════════════════════════════════════════════════ */}
          <TabsContent value="reviews" className="mt-6 space-y-6">
            {/* Average Rating Card */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.1 }}
              className="rounded-xl border bg-card p-5 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Big rating */}
                <div className="text-center shrink-0">
                  <p className="text-[48px] font-bold tracking-tight leading-none">{reviewSummary.averageRating.toFixed(1)}</p>
                  <div className="flex items-center gap-0.5 justify-center mt-2">
                    {renderStars(reviewSummary.averageRating, 'size-5')}
                  </div>
                  <p className="text-[13px] text-muted-foreground mt-1.5">
                    {reviewSummary.totalReviews.toLocaleString()} review{reviewSummary.totalReviews !== 1 ? 's' : ''}
                  </p>
                </div>
                {/* Breakdown */}
                <div className="flex-1 w-full sm:w-auto">
                  <ReviewBreakdown breakdown={reviewSummary.breakdown} totalReviews={reviewSummary.totalReviews} />
                </div>
              </div>
            </motion.div>

            {/* Reviews List */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.2 }}
              className="rounded-xl border bg-card p-5 shadow-sm"
            >
              <h3 className="text-[15px] font-semibold mb-4">Latest Reviews</h3>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.slice(0, 10).map((review, i) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...springTransition, delay: 0.3 + i * 0.05 }}
                      className="flex gap-3 pb-4 border-b border-border/40 last:border-0 last:pb-0"
                    >
                      <Avatar className="size-9 rounded-xl shrink-0">
                        <AvatarImage src={review.studentAvatar || undefined} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-violet-400 to-purple-500 text-white rounded-xl">
                          {getInitials(review.studentName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[13px] font-semibold">{review.studentName}</p>
                          <span className="text-[11px] text-muted-foreground shrink-0">{formatRelativeTime(review.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {renderStars(review.rating, 'size-2.5')}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">on {review.courseName}</p>
                        <p className="text-[13px] text-muted-foreground mt-1.5 line-clamp-3">{review.comment}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="size-8 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-[13px] text-muted-foreground">No reviews yet</p>
                  <p className="text-[11px] text-muted-foreground/60">Reviews from students will appear here</p>
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════
              TAB 6: SETTINGS QUICK LINKS
              ═══════════════════════════════════════════════════════════════ */}
          <TabsContent value="settings" className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SETTINGS_LINKS.map((link, i) => (
                <motion.div
                  key={link.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...springTransition, delay: i * 0.06 }}
                >
                  <button
                    onClick={() => setCurrentView(link.view)}
                    className="w-full text-left rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn('flex size-10 items-center justify-center rounded-xl shrink-0', link.bg)}>
                        <link.icon className={cn('size-5', link.iconColor)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-semibold group-hover:text-primary transition-colors">{link.title}</h4>
                        <p className="text-[12px] text-muted-foreground mt-0.5">{link.description}</p>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary shrink-0 mt-1 transition-colors" />
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Quick note */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springTransition, delay: 0.4 }}
              className="rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/40 p-4 flex items-start gap-3"
            >
              <Eye className="size-5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-semibold text-violet-700 dark:text-violet-400">Looking for more settings?</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  All settings including account, notifications, payouts, privacy, and integrations are available in the{' '}
                  <button className="text-primary hover:underline font-medium" onClick={() => setCurrentView('instructor-settings')}>
                    Settings page
                  </button>.
                </p>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════════════
          EDIT PROFILE DIALOG
          ═══════════════════════════════════════════════════════════════════ */}
      <EditProfileDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        profile={profile}
        onSave={handleSaveProfile}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          SHARE PROFILE DIALOG
          ═══════════════════════════════════════════════════════════════════ */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950/40">
                <Share2 className="size-4 text-violet-600 dark:text-violet-400" />
              </div>
              Share Your Profile
            </DialogTitle>
            <DialogDescription>Share your instructor profile with students and colleagues.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-muted/30 p-4 flex items-center gap-3">
              <Avatar className="size-12 rounded-xl">
                <AvatarImage src={profile.avatar || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-violet-400 to-purple-500 text-white font-bold rounded-xl">
                  {getInitials(profile.displayName || 'IN')}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-bold truncate">{profile.displayName}</p>
                <p className="text-[12px] text-muted-foreground truncate">{profile.headline || 'Instructor at ShijlAI Academy'}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[12px] font-semibold">Profile Link</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/instructor/${currentUser?.id}`}
                  className="rounded-xl text-[12px]"
                />
                <Button size="sm" className="rounded-xl shrink-0 gap-1.5" onClick={handleShareProfile}>
                  <Share2 className="size-3.5" /> Copy
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)} className="rounded-xl">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
