'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Camera, Pencil, Share2, ExternalLink, MapPin, Link as LinkIcon,
  Linkedin, Phone, BookOpen, Clock, Brain, FileText, Trophy, Target,
  Flame, Zap, GraduationCap, Coins, Award, Star, Lock, CheckCircle2,
  ChevronRight, Loader2, Play, X, Upload, Trash2, Timer, Calendar,
  TrendingUp, Activity, Sparkles, Shield, BarChart3, CircleDot,
  MessageSquare, ArrowRight, Eye,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import type {
  User as UserType,
  XpActivity,
  SkillProgress,
  BadgeWithStatus,
  Certificate,
  LearningGoal,
  ProgressOverview,
} from '@/lib/types'
import { StudentStatCard, StudentStatCardGrid } from '@/components/student/student-stat-card'

// ─── Constants ────────────────────────────────────────────────────────────────

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

const PROFILE_COMPLETION_FIELDS = [
  'name', 'bio', 'avatar', 'headline', 'location', 'website', 'linkedin', 'phone',
]

// ─── API Response Types ───────────────────────────────────────────────────────

interface StudentProfileData {
  user: UserType & {
    headline: string | null
    location: string | null
    website: string | null
    linkedin: string | null
    phone: string | null
    profileCompletion: number
  }
  stats: {
    totalLearningTime: number
    coursesCompleted: number
    coursesInProgress: number
    averageQuizScore: number
    assignmentsSubmitted: number
  }
  recentActivity: XpActivity[]
  skills: SkillProgress[]
  badges: BadgeWithStatus[]
  certificates: Certificate[]
  goals: LearningGoal[]
  activity: XpActivity[]
  overview: ProgressOverview | null
}

interface EditProfileFormData {
  name: string
  headline: string
  bio: string
  location: string
  website: string
  linkedin: string
  phone: string
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function formatTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)
  const diffWeek = Math.floor(diffDay / 7)
  const diffMonth = Math.floor(diffDay / 30)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`
  if (diffWeek < 5) return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`
  if (diffMonth < 12) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function getSkillLevelColor(level: string): string {
  switch (level) {
    case 'expert': return 'text-purple-600 dark:text-purple-400'
    case 'advanced': return 'text-blue-600 dark:text-blue-400'
    case 'intermediate': return 'text-emerald-600 dark:text-emerald-400'
    case 'beginner': return 'text-teal-600 dark:text-teal-400'
    default: return 'text-muted-foreground'
  }
}

function getSkillLevelBg(level: string): string {
  switch (level) {
    case 'expert': return 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400'
    case 'advanced': return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
    case 'intermediate': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
    case 'beginner': return 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400'
    default: return 'bg-muted text-muted-foreground'
  }
}

function getSkillProgressColor(level: string): string {
  switch (level) {
    case 'expert': return 'bg-purple-500'
    case 'advanced': return 'bg-blue-500'
    case 'intermediate': return 'bg-emerald-500'
    case 'beginner': return 'bg-teal-500'
    default: return 'bg-primary'
  }
}

function getGoalTypeIcon(type: string) {
  switch (type) {
    case 'weekly_xp': return Zap
    case 'weekly_time': return Clock
    case 'weekly_lessons': return BookOpen
    case 'monthly_xp': return TrendingUp
    case 'monthly_courses': return GraduationCap
    case 'custom': return Target
    default: return Target
  }
}

function getGoalPeriodBg(period: string): string {
  switch (period) {
    case 'weekly': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
    case 'monthly': return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
    case 'custom': return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
    default: return 'bg-muted text-muted-foreground'
  }
}

function getActivityIcon(action: string) {
  const a = action.toLowerCase()
  if (a.includes('lesson') || a.includes('complete')) return BookOpen
  if (a.includes('quiz') || a.includes('test')) return Brain
  if (a.includes('streak')) return Flame
  if (a.includes('badge') || a.includes('achievement')) return Award
  if (a.includes('certificate')) return Shield
  if (a.includes('assignment')) return FileText
  if (a.includes('course')) return GraduationCap
  if (a.includes('coin')) return Coins
  return Activity
}

function getBadgeCategoryFilter(category: string): string {
  switch (category) {
    case 'learning': return 'Learning'
    case 'streak': return 'Streak'
    case 'social': return 'Social'
    case 'achievement': return 'Achievement'
    default: return category
  }
}

// ─── Skeleton Components ─────────────────────────────────────────────────────

function ProfileHeroSkeleton() {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="h-40 bg-gradient-to-r from-emerald-500/20 to-teal-500/20" />
      <div className="px-6 pb-6 -mt-12">
        <div className="flex items-end gap-4">
          <Skeleton className="size-24 rounded-full border-4 border-background" />
          <div className="flex-1 space-y-2 pb-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <Skeleton className="h-3 w-full max-w-md" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>
          <div className="flex gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-24 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function TabContentSkeleton() {
  return (
    <div className="space-y-4 p-1">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  )
}

// ─── Empty State Component ────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, description, action }: {
  icon: React.ElementType
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-10 text-center"
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50 mb-4">
        <Icon className="size-7 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function StudentProfileView() {
  const { currentUser, setCurrentUser, setCurrentView } = useAppStore()

  // Data state
  const [profileData, setProfileData] = useState<StudentProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Edit profile dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState<EditProfileFormData>({
    name: '', headline: '', bio: '', location: '', website: '', linkedin: '', phone: '',
  })
  const [saving, setSaving] = useState(false)

  // Avatar upload
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarDeleteDialogOpen, setAvatarDeleteDialogOpen] = useState(false)

  // Badge filter
  const [badgeFilter, setBadgeFilter] = useState<string>('all')

  // Activity pagination
  const [activityPage, setActivityPage] = useState(1)
  const ACTIVITY_PAGE_SIZE = 10

  // Share dialog
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  // ─── Fetch Profile Data ─────────────────────────────────────────────────

  const fetchProfile = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/student/profile?studentId=${currentUser.id}`)
      if (res.ok) {
        const json = await res.json()

        // Transform API response to component data shape
        // API returns: { personalInfo, settings, learningStats, gamification, skills, badges, certificates, learningGoals, recentActivity, profileCompletionScore }
        // Component expects: { user, stats, recentActivity, skills, badges, certificates, goals, activity, overview }
        const pi = json.personalInfo || {}
        const st = json.settings || {}
        const ls = json.learningStats || {}
        const gm = json.gamification || {}

        const transformed: StudentProfileData = {
          user: {
            ...currentUser,
            name: pi.name || currentUser.name,
            email: pi.email || currentUser.email,
            avatar: pi.avatar || currentUser.avatar,
            bio: pi.bio ?? currentUser.bio,
            headline: st.headline || null,
            location: st.location || null,
            website: st.website || null,
            linkedin: st.linkedin || null,
            phone: pi.phone || null,
            profileCompletion: json.profileCompletionScore || 0,
          },
          stats: {
            totalLearningTime: ls.totalLearningTimeSeconds || ls.totalLearningTime || 0,
            coursesCompleted: ls.coursesCompleted || 0,
            coursesInProgress: ls.coursesInProgress || 0,
            averageQuizScore: ls.averageQuizScore || 0,
            assignmentsSubmitted: ls.assignmentsSubmitted || 0,
          },
          recentActivity: (json.recentActivity || []).map((a: any) => ({
            id: a.id,
            userId: a.userId || currentUser.id,
            action: a.action || '',
            xpAmount: a.xpAmount || a.xpEarned || 0,
            coinAmount: a.coinAmount || a.coinReward || 0,
            description: a.description || '',
            metadata: a.metadata || null,
            createdAt: a.createdAt || new Date().toISOString(),
          })),
          skills: (json.skills || []).map((s: any) => ({
            id: s.id,
            skillId: s.skillId || s.id,
            name: s.skill?.name || s.name || '',
            category: s.skill?.category || s.category || '',
            icon: s.skill?.icon || s.icon || null,
            level: s.level || 'beginner',
            progress: s.progress || 0,
            xpEarned: s.xpEarned || 0,
          })),
          badges: (json.badges || []).map((b: any) => ({
            id: b.id,
            name: b.badge?.name || b.name || '',
            description: b.badge?.description || b.description || '',
            icon: b.badge?.icon || b.icon || '🏆',
            category: b.badge?.category || b.category || 'achievement',
            xpReward: b.badge?.xpReward || b.xpReward || 0,
            coinReward: b.badge?.coinReward || b.coinReward || 0,
            earned: true,
            earnedAt: b.earnedAt || null,
            requirement: b.badge?.requirement || b.requirement,
          })),
          certificates: json.certificates || [],
          goals: (json.learningGoals || []),
          activity: (json.recentActivity || []).map((a: any) => ({
            id: a.id,
            userId: a.userId || currentUser.id,
            action: a.action || '',
            xpAmount: a.xpAmount || a.xpEarned || 0,
            coinAmount: a.coinAmount || a.coinReward || 0,
            description: a.description || '',
            metadata: a.metadata || null,
            createdAt: a.createdAt || new Date().toISOString(),
          })),
          overview: ls ? {
            totalLearningTime: ls.totalLearningTimeSeconds || ls.totalLearningTime || 0,
            thisMonthTime: 0,
            totalLessonsCompleted: ls.coursesCompleted || 0,
            thisMonthLessons: 0,
            quizStats: {
              total: ls.quizzesTotal || 0,
              passed: ls.quizzesPassed || 0,
              passRate: ls.averageQuizScore || 0,
            },
            assignmentStats: {
              total: ls.assignmentsTotal || ls.assignmentsGraded || 0,
              submitted: ls.assignmentsSubmitted || 0,
              rate: (ls.assignmentsTotal || ls.assignmentsGraded) ? Math.round((ls.assignmentsSubmitted / (ls.assignmentsTotal || ls.assignmentsGraded)) * 100) : 0,
            },
          } : null,
        }

        setProfileData(transformed)
      } else {
        // Use fallback data derived from currentUser
        setProfileData({
          user: {
            ...currentUser,
            headline: null,
            location: null,
            website: null,
            linkedin: null,
            phone: null,
            profileCompletion: 40,
          },
          stats: {
            totalLearningTime: 0,
            coursesCompleted: 0,
            coursesInProgress: 0,
            averageQuizScore: 0,
            assignmentsSubmitted: 0,
          },
          recentActivity: [],
          skills: [],
          badges: [],
          certificates: [],
          goals: [],
          activity: [],
          overview: null,
        })
      }
    } catch {
      setError('Failed to load profile data. Please try again.')
      setProfileData({
        user: {
          ...currentUser,
          headline: null,
          location: null,
          website: null,
          linkedin: null,
          phone: null,
          profileCompletion: 40,
        },
        stats: {
          totalLearningTime: 0,
          coursesCompleted: 0,
          coursesInProgress: 0,
          averageQuizScore: 0,
          assignmentsSubmitted: 0,
        },
        recentActivity: [],
        skills: [],
        badges: [],
        certificates: [],
        goals: [],
        activity: [],
        overview: null,
      })
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // ─── Edit Profile Handlers ──────────────────────────────────────────────

  const openEditDialog = useCallback(() => {
    if (!profileData) return
    const { user } = profileData
    setEditForm({
      name: user.name || '',
      headline: user.headline || '',
      bio: user.bio || '',
      location: user.location || '',
      website: user.website || '',
      linkedin: user.linkedin || '',
      phone: user.phone || '',
    })
    setEditDialogOpen(true)
  }, [profileData])

  const handleSaveProfile = useCallback(async () => {
    if (!currentUser) return
    setSaving(true)
    try {
      const payload = { studentId: currentUser.id, ...editForm }
      if (payload.website && !/^https?:\/\//i.test(payload.website)) payload.website = `https://${payload.website}`
      if (payload.linkedin && !/^https?:\/\//i.test(payload.linkedin)) payload.linkedin = `https://${payload.linkedin}`

      const res = await fetch('/api/student/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const updated = await res.json()
        // Re-build transformed user from API response
        const pi = updated.personalInfo || {}
        const st = updated.settings || {}
        const updatedUser = {
          ...currentUser,
          name: pi.name || currentUser.name,
          bio: pi.bio ?? currentUser.bio,
        }
        setCurrentUser(updatedUser as typeof currentUser)
        setProfileData(prev => prev ? {
          ...prev,
          user: {
            ...prev.user,
            name: pi.name || prev.user.name,
            bio: pi.bio ?? prev.user.bio,
            phone: pi.phone ?? prev.user.phone,
            headline: st.headline ?? prev.user.headline,
            location: st.location ?? prev.user.location,
            website: st.website ?? prev.user.website,
            linkedin: st.linkedin ?? prev.user.linkedin,
          },
        } : prev)
        setEditDialogOpen(false)
        toast.success('Profile updated successfully!')
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to update profile')
      }
    } catch {
      toast.error('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }, [currentUser, editForm, setCurrentUser])

  // ─── Avatar Upload Handler ──────────────────────────────────────────────

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    setAvatarUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = async () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 400
          const MAX_HEIGHT = 400
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          const base64 = canvas.toDataURL('image/jpeg', 0.8)

          try {
            const res = await fetch('/api/student/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ studentId: currentUser.id, avatar: base64 }),
            })
            if (res.ok) {
              const json = await res.json()
              setProfileData(prev => prev ? { ...prev, user: { ...prev.user, avatar: json.avatar } } : prev)
              // Sync to global store so header avatar updates
              setCurrentUser({ ...currentUser, avatar: json.avatar })
              toast.success('Profile photo updated!')
            } else {
              const err = await res.json().catch(() => ({}))
              toast.error(err.error || 'Failed to upload photo')
            }
          } catch {
            toast.error('Failed to upload photo')
          } finally {
            setAvatarUploading(false)
          }
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    } catch {
      setAvatarUploading(false)
      toast.error('Failed to read image file')
    }
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }, [currentUser, setCurrentUser])

  const handleAvatarDelete = useCallback(async () => {
    if (!currentUser) return
    setAvatarUploading(true)
    try {
      const res = await fetch('/api/student/profile', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: currentUser.id }),
      })
      if (res.ok) {
        setProfileData(prev => prev ? { ...prev, user: { ...prev.user, avatar: null } } : prev)
        setCurrentUser({ ...currentUser, avatar: null })
        toast.success('Profile photo removed')
      } else {
        toast.error('Failed to remove photo')
      }
    } catch {
      toast.error('Failed to remove photo')
    } finally {
      setAvatarUploading(false)
      setAvatarDeleteDialogOpen(false)
    }
  }, [currentUser, setCurrentUser])

  // ─── Share Handler ──────────────────────────────────────────────────────

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: `${profileData?.user.name || 'Student'} — ShijlAI Academy Profile`,
        text: `Check out my learning profile on ShijlAI Academy!`,
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      setShareDialogOpen(true)
      setTimeout(() => setShareDialogOpen(false), 2000)
    }
  }, [profileData])

  // ─── Derived Data ───────────────────────────────────────────────────────

  const user = profileData?.user
  const stats = profileData?.stats
  const recentActivity = profileData?.recentActivity || []
  const skills = profileData?.skills || []
  const badges = profileData?.badges || []
  const certificates = profileData?.certificates || []
  const goals = profileData?.goals || []
  const allActivity = profileData?.activity || []

  const earnedBadges = badges.filter(b => b.earned)
  const lockedBadges = badges.filter(b => !b.earned)

  const filteredBadges = badgeFilter === 'all'
    ? badges
    : badges.filter(b => b.category === badgeFilter)

  const paginatedActivity = allActivity.slice(0, activityPage * ACTIVITY_PAGE_SIZE)
  const hasMoreActivity = allActivity.length > activityPage * ACTIVITY_PAGE_SIZE

  const profileCompletion = user?.profileCompletion ?? 40

  // ─── Loading State ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-5 pb-4">
        <ProfileHeroSkeleton />
        <div className="px-1">
          <div className="flex gap-2 mb-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-20 rounded-lg" />
            ))}
          </div>
          <TabContentSkeleton />
        </div>
      </div>
    )
  }

  if (error && !profileData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
          <X className="size-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold">Failed to Load Profile</h3>
        <p className="text-sm text-muted-foreground max-w-sm text-center">{error}</p>
        <Button onClick={fetchProfile} variant="outline">
          <Activity className="size-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  if (!user) return null

  // ─── User Initials ──────────────────────────────────────────────────────

  const initials = user.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'S'

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-5 pb-4">
        {/* Hidden file input for avatar */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
        />

        {/* ═══════════════════════════════════════════════════════════════════
            HEADER: Hero Card
            ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
          className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden"
        >
          {/* Cover gradient */}
          <div className="relative h-40 bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 overflow-hidden">
            {/* Decorative pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />
            <div className="absolute -top-12 -right-12 size-48 rounded-full bg-white/5" />
            <div className="absolute -bottom-10 -left-10 size-40 rounded-full bg-white/5" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-72 rounded-full bg-white/3" />
          </div>

          {/* Profile content */}
          <div className="px-6 pb-6 -mt-12">
            {/* Avatar + Name row */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              {/* Avatar */}
              <div className="relative group shrink-0">
                <Avatar className="size-24 border-4 border-background shadow-lg ring-2 ring-emerald-500/20">
                  <AvatarImage src={user.avatar || undefined} alt={user.name} />
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-emerald-400 to-teal-500 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {/* Camera overlay */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    >
                      {avatarUploading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Camera className="size-4" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Change photo</TooltipContent>
                </Tooltip>
                {/* Avatar options on hover */}
                {user.avatar && (
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setAvatarDeleteDialogOpen(true)}
                          className="flex size-6 items-center justify-center rounded-full bg-destructive/90 text-white shadow-sm hover:bg-destructive transition-colors"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Remove photo</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>

              {/* Name, headline, location */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold tracking-tight truncate">{user.name}</h1>
                  <Badge variant="secondary" className="capitalize bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0 text-xs">
                    {user.role}
                  </Badge>
                </div>
                {user.headline && (
                  <p className="text-sm text-muted-foreground mt-0.5 truncate">{user.headline}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground flex-wrap">
                  {user.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      {user.location}
                    </span>
                  )}
                  {user.website && (
                    <a
                      href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <LinkIcon className="size-3.5" />
                      Website
                    </a>
                  )}
                  {user.linkedin && (
                    <a
                      href={user.linkedin.startsWith('http') ? user.linkedin : `https://linkedin.com/in/${user.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Linkedin className="size-3.5" />
                      LinkedIn
                    </a>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    Joined {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile completion */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Profile completion</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{profileCompletion}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${profileCompletion}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <Button
                onClick={openEditDialog}
                className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm"
              >
                <Pencil className="size-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline" onClick={handleShare} className="rounded-lg">
                <Share2 className="size-4 mr-2" />
                Share Profile
              </Button>
              <Button variant="outline" className="rounded-lg">
                <ExternalLink className="size-4 mr-2" />
                View Public Profile
              </Button>
            </div>

            {/* Quick stats row */}
            <div className="mt-5">
              <StudentStatCardGrid columns={5}>
                <StudentStatCard
                  icon={BookOpen}
                  value={(stats?.coursesInProgress ?? 0) + (stats?.coursesCompleted ?? 0)}
                  label="Courses"
                  color="emerald"
                  index={0}
                />
                <StudentStatCard
                  icon={Zap}
                  value={(user.xp ?? 0).toLocaleString()}
                  label="XP"
                  color="amber"
                  index={1}
                />
                <StudentStatCard
                  icon={Flame}
                  value={`${user.streak ?? 0}d`}
                  label="Streak"
                  color="orange"
                  index={2}
                />
                <StudentStatCard
                  icon={GraduationCap}
                  value={user.level ?? 1}
                  label="Level"
                  color="cyan"
                  index={3}
                />
                <StudentStatCard
                  icon={Coins}
                  value={(user.shijlCoins ?? 0).toLocaleString()}
                  label="Coins"
                  color="amber"
                  index={4}
                />
              </StudentStatCardGrid>
            </div>
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════
            TABS SECTION
            ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springTransition, delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent border-b rounded-none gap-0 overflow-x-auto">
              {[
                { value: 'overview', label: 'Overview' },
                { value: 'skills', label: 'Skills' },
                { value: 'achievements', label: 'Achievements' },
                { value: 'certificates', label: 'Certificates' },
                { value: 'goals', label: 'Goals' },
                { value: 'activity', label: 'Activity' },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="relative px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:text-primary data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none transition-all"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ─── Tab 1: Overview ─────────────────────────────────────────── */}
            <TabsContent value="overview" className="mt-5 space-y-5">
              {/* Bio */}
              {user.bio && (
                <Card className="rounded-xl border shadow-sm">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">About</h3>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{user.bio}</p>
                  </CardContent>
                </Card>
              )}

              {/* Learning Stats Grid */}
              <StudentStatCardGrid columns={4}>
                <StudentStatCard
                  icon={Clock}
                  value={formatDuration(stats?.totalLearningTime ?? 0)}
                  label="Learning Time"
                  color="emerald"
                  subLabel="Total time invested"
                  index={0}
                />
                <StudentStatCard
                  icon={GraduationCap}
                  value={`${stats?.coursesCompleted ?? 0} / ${stats?.coursesInProgress ?? 0}`}
                  label="Courses"
                  color="teal"
                  subLabel="Completed / In Progress"
                  index={1}
                />
                <StudentStatCard
                  icon={Brain}
                  value={`${Math.round(stats?.averageQuizScore ?? 0)}%`}
                  label="Avg Quiz Score"
                  color="cyan"
                  subLabel="Across all quizzes"
                  index={2}
                />
                <StudentStatCard
                  icon={FileText}
                  value={(stats?.assignmentsSubmitted ?? 0).toLocaleString()}
                  label="Assignments"
                  color="violet"
                  subLabel="Submitted"
                  index={3}
                  cardBgOverride="bg-blue-50/70 dark:bg-blue-950/30 backdrop-blur-xl"
                  iconBgOverride="bg-blue-100 dark:bg-blue-950/40"
                  iconColorOverride="text-blue-600 dark:text-blue-400"
                  valueColor="text-blue-700 dark:text-blue-400"
                />
              </StudentStatCardGrid>

              {/* Recent Activity Timeline */}
              <Card className="rounded-xl border shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Activity className="size-4 text-emerald-600 dark:text-emerald-400" />
                      Recent Activity
                    </CardTitle>
                    {recentActivity.length > 0 && (
                      <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => setActiveTab('activity')}>
                        View All <ChevronRight className="size-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {recentActivity.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      No recent activity yet. Start learning to see your progress here!
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {recentActivity.slice(0, 5).map((activity, i) => {
                        const ActivityIcon = getActivityIcon(activity.action)
                        return (
                          <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ ...springTransition, delay: 0.05 * i }}
                            className="flex items-start gap-3 py-3 relative"
                          >
                            {/* Timeline dot + line */}
                            <div className="flex flex-col items-center shrink-0">
                              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40">
                                <ActivityIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              {i < Math.min(recentActivity.length, 5) - 1 && (
                                <div className="w-px h-full min-h-[16px] bg-border/50 mt-1" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <p className="text-sm font-medium leading-snug">{activity.description}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {activity.xpAmount > 0 && (
                                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                    +{activity.xpAmount} XP
                                  </span>
                                )}
                                {activity.coinAmount > 0 && (
                                  <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                    +{activity.coinAmount} coins
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {formatTimeAgo(activity.createdAt)}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── Tab 2: Skills ───────────────────────────────────────────── */}
            <TabsContent value="skills" className="mt-5 space-y-4">
              {skills.length === 0 ? (
                <EmptyState
                  icon={BarChart3}
                  title="No Skills Yet"
                  description="Your skills will appear here as you complete courses and quizzes. Start learning to build your skill profile!"
                  action={
                    <Button
                      onClick={() => setCurrentView('courses')}
                      className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                    >
                      <BookOpen className="size-4 mr-2" />
                      Explore Courses
                    </Button>
                  }
                />
              ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  {skills.map((skill, i) => (
                    <motion.div
                      key={skill.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...springTransition, delay: 0.03 * i }}
                    >
                      <Card className="rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="flex size-10 items-center justify-center rounded-xl bg-muted/50 shrink-0">
                                {skill.icon ? (
                                  <span className="text-lg">{skill.icon}</span>
                                ) : (
                                  <CircleDot className="size-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-semibold truncate">{skill.name}</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 border-0 bg-muted/60">
                                    {skill.category}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <Badge className={`text-[10px] px-2 py-0.5 border-0 capitalize ${getSkillLevelBg(skill.level)}`}>
                              {skill.level}
                            </Badge>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className={getSkillLevelColor(skill.level)}>{skill.progress}%</span>
                              <span className="text-muted-foreground">{skill.xpEarned.toLocaleString()} XP</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${skill.progress}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 + i * 0.05 }}
                                className={`h-full rounded-full ${getSkillProgressColor(skill.level)}`}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ─── Tab 3: Achievements ─────────────────────────────────────── */}
            <TabsContent value="achievements" className="mt-5 space-y-5">
              {/* Stats summary */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="size-5 text-primary" />
                  <h3 className="text-base font-semibold">Badges</h3>
                  <Badge variant="secondary" className="text-xs border-0">
                    {earnedBadges.length} / {badges.length} earned
                  </Badge>
                </div>
              </div>

              {/* Category filter */}
              <div className="flex items-center gap-2 flex-wrap">
                {['all', 'learning', 'streak', 'social', 'achievement'].map((cat) => (
                  <Button
                    key={cat}
                    variant={badgeFilter === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBadgeFilter(cat)}
                    className={`rounded-lg text-xs capitalize ${
                      badgeFilter === cat
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        : ''
                    }`}
                  >
                    {cat === 'all' ? 'All' : getBadgeCategoryFilter(cat)}
                  </Button>
                ))}
              </div>

              {/* Badges grid */}
              {filteredBadges.length === 0 ? (
                <EmptyState
                  icon={Award}
                  title="No Badges in This Category"
                  description="Keep learning and completing challenges to earn badges!"
                />
              ) : (
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {filteredBadges.map((badge, i) => {
                    const isEarned = badge.earned
                    return (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ ...springTransition, delay: 0.03 * i }}
                        className={`rounded-xl border bg-card p-4 text-center transition-all hover:shadow-md relative ${
                          isEarned ? '' : 'opacity-50 grayscale'
                        }`}
                      >
                        {!isEarned && (
                          <div className="absolute top-2 right-2">
                            <Lock className="size-3.5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="text-3xl mb-2">
                          {isEarned ? badge.icon : '🔒'}
                        </div>
                        <h4 className={`text-xs font-semibold truncate ${isEarned ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {badge.name}
                        </h4>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5 min-h-[2.5em]">
                          {badge.description}
                        </p>
                        {isEarned && badge.earnedAt && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 block">
                            {formatTimeAgo(badge.earnedAt)}
                          </span>
                        )}
                        <div className="flex items-center justify-center gap-2 mt-2">
                          {badge.xpReward > 0 && (
                            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                              +{badge.xpReward} XP
                            </span>
                          )}
                          {badge.coinReward > 0 && (
                            <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                              +{badge.coinReward}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            {/* ─── Tab 4: Certificates ─────────────────────────────────────── */}
            <TabsContent value="certificates" className="mt-5 space-y-4">
              {certificates.length === 0 ? (
                <EmptyState
                  icon={Shield}
                  title="No Certificates Yet"
                  description="Complete courses with certificate enabled to earn your first certificate!"
                  action={
                    <Button
                      onClick={() => setCurrentView('courses')}
                      className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                    >
                      <BookOpen className="size-4 mr-2" />
                      Browse Courses
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {certificates.map((cert, i) => (
                    <motion.div
                      key={cert.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...springTransition, delay: 0.05 * i }}
                    >
                      <Card className="rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        <div className="flex flex-col sm:flex-row">
                          {/* Certificate icon area */}
                          <div className="flex items-center justify-center bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600 p-6 sm:w-40 shrink-0">
                            <div className="text-center">
                              <Shield className="size-10 text-white/80 mx-auto" />
                              <p className="text-xs font-bold text-white/90 mt-2 uppercase tracking-wider">Verified</p>
                            </div>
                          </div>
                          {/* Content */}
                          <CardContent className="flex-1 p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h4 className="text-base font-semibold">{cert.courseTitle}</h4>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {cert.instructorName && `by ${cert.instructorName}`}
                                </p>
                              </div>
                              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 border-0 capitalize shrink-0">
                                {cert.templateType}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-3 flex-wrap">
                              <div className="flex items-center gap-1.5 text-sm">
                                <Star className="size-4 text-amber-500" />
                                <span className="font-semibold">{cert.score}%</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Calendar className="size-3.5" />
                                {new Date(cert.issuedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Shield className="size-3.5" />
                                {cert.certificateId}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                              <Button variant="outline" size="sm" className="rounded-lg text-xs">
                                <Eye className="size-3.5 mr-1.5" />
                                View Certificate
                              </Button>
                              <Button variant="ghost" size="sm" className="rounded-lg text-xs text-primary">
                                <ExternalLink className="size-3.5 mr-1.5" />
                                Verify
                              </Button>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ─── Tab 5: Goals ────────────────────────────────────────────── */}
            <TabsContent value="goals" className="mt-5 space-y-4">
              {/* Active goals only */}
              {goals.filter(g => g.status === 'active').length === 0 ? (
                <EmptyState
                  icon={Target}
                  title="No Active Goals"
                  description="Set learning goals to stay motivated and track your progress over time!"
                  action={
                    <Button
                      onClick={() => setCurrentView('analytics')}
                      className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                    >
                      <Target className="size-4 mr-2" />
                      Set a Goal
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-3">
                  {goals.filter(g => g.status === 'active').map((goal, i) => {
                    const GoalIcon = getGoalTypeIcon(goal.type)
                    const progressPercent = Math.min(Math.round((goal.current / goal.target) * 100), 100)
                    const isComplete = goal.current >= goal.target

                    return (
                      <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...springTransition, delay: 0.05 * i }}
                      >
                        <Card className={`rounded-xl border shadow-sm hover:shadow-md transition-shadow ${isComplete ? 'border-emerald-200 dark:border-emerald-800' : ''}`}>
                          <CardContent className="p-5">
                            <div className="flex items-start gap-3">
                              <div className={`flex size-10 items-center justify-center rounded-xl shrink-0 ${
                                isComplete
                                  ? 'bg-emerald-100 dark:bg-emerald-950/40'
                                  : 'bg-muted/60'
                              }`}>
                                {isComplete ? (
                                  <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                                ) : (
                                  <GoalIcon className="size-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className="text-sm font-semibold truncate">{goal.title}</h4>
                                  <Badge className={`text-[10px] px-2 py-0.5 border-0 capitalize ${getGoalPeriodBg(goal.period)}`}>
                                    {goal.period}
                                  </Badge>
                                </div>
                                <div className="mt-2">
                                  <div className="flex items-center justify-between text-xs mb-1.5">
                                    <span className="text-muted-foreground">
                                      {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}
                                    </span>
                                    <span className={`font-semibold ${isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                                      {progressPercent}%
                                    </span>
                                  </div>
                                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${progressPercent}%` }}
                                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 + i * 0.05 }}
                                      className={`h-full rounded-full ${
                                        isComplete
                                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                          : 'bg-gradient-to-r from-emerald-400 to-teal-400'
                                      }`}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="size-3" />
                                    Due {new Date(goal.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                  {!isComplete && (
                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                      {(goal.target - goal.current).toLocaleString()} {goal.unit} remaining
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              )}

              {/* Completed/Other goals */}
              {goals.filter(g => g.status !== 'active').length > 0 && (
                <div className="mt-6">
                  <Separator className="mb-4" />
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">Past Goals</h4>
                  <div className="space-y-2">
                    {goals.filter(g => g.status !== 'active').map((goal) => {
                      const GoalIcon = getGoalTypeIcon(goal.type)
                      return (
                        <div
                          key={goal.id}
                          className="flex items-center gap-3 rounded-xl border bg-card/50 p-3 opacity-70"
                        >
                          <div className="flex size-8 items-center justify-center rounded-lg bg-muted/50 shrink-0">
                            <GoalIcon className="size-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{goal.title}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-2 py-0.5 capitalize ${
                              goal.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0'
                                : 'bg-muted text-muted-foreground border-0'
                            }`}
                          >
                            {goal.status}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ─── Tab 6: Activity ─────────────────────────────────────────── */}
            <TabsContent value="activity" className="mt-5 space-y-3">
              {allActivity.length === 0 ? (
                <EmptyState
                  icon={Activity}
                  title="No Activity Yet"
                  description="Your learning activity will be tracked here as you progress through courses."
                  action={
                    <Button
                      onClick={() => setCurrentView('courses')}
                      className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                    >
                      <Play className="size-4 mr-2" />
                      Start Learning
                    </Button>
                  }
                />
              ) : (
                <>
                  <Card className="rounded-xl border shadow-sm">
                    <CardContent className="p-0">
                      <ScrollArea className="max-h-[600px]">
                        <div className="divide-y divide-border/50">
                          {paginatedActivity.map((activity, i) => {
                            const ActivityIcon = getActivityIcon(activity.action)
                            return (
                              <motion.div
                                key={activity.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ ...springTransition, delay: Math.min(0.03 * i, 0.3) }}
                                className="flex items-center gap-3 px-5 py-3.5 hover:bg-accent/30 transition-colors"
                              >
                                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40 shrink-0">
                                  <ActivityIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium leading-snug truncate">{activity.description}</p>
                                  <span className="text-xs text-muted-foreground">{formatTimeAgo(activity.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  {activity.xpAmount > 0 && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-0.5">
                                          <Zap className="size-3 text-emerald-600 dark:text-emerald-400" />
                                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+{activity.xpAmount}</span>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>XP earned</TooltipContent>
                                    </Tooltip>
                                  )}
                                  {activity.coinAmount > 0 && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/40 px-2.5 py-0.5">
                                          <Coins className="size-3 text-amber-600 dark:text-amber-400" />
                                          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">+{activity.coinAmount}</span>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>Coins earned</TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Load more */}
                  {hasMoreActivity && (
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActivityPage(prev => prev + 1)}
                        className="rounded-lg text-xs"
                      >
                        Load More Activity
                        <ChevronRight className="size-3.5 ml-1" />
                      </Button>
                    </div>
                  )}

                  <p className="text-center text-xs text-muted-foreground">
                    Showing {Math.min(paginatedActivity.length, allActivity.length)} of {allActivity.length} activities
                  </p>
                </>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════
            EDIT PROFILE DIALOG
            ═══════════════════════════════════════════════════════════════════ */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-lg rounded-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Pencil className="size-5 text-primary" />
                Edit Profile
              </DialogTitle>
              <DialogDescription>
                Update your profile information. Changes will be saved immediately.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-sm font-medium">
                  <User className="size-3.5 inline mr-1.5 text-muted-foreground" />
                  Full Name
                </Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Your full name"
                  className="rounded-lg"
                />
              </div>

              {/* Headline */}
              <div className="space-y-2">
                <Label htmlFor="edit-headline" className="text-sm font-medium">
                  <Sparkles className="size-3.5 inline mr-1.5 text-muted-foreground" />
                  Headline
                </Label>
                <Input
                  id="edit-headline"
                  value={editForm.headline}
                  onChange={(e) => setEditForm(prev => ({ ...prev, headline: e.target.value }))}
                  placeholder="e.g. CS Student & AI Enthusiast"
                  className="rounded-lg"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="edit-bio" className="text-sm font-medium">
                  <MessageSquare className="size-3.5 inline mr-1.5 text-muted-foreground" />
                  Bio
                </Label>
                <Textarea
                  id="edit-bio"
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  className="rounded-lg min-h-[100px] resize-y"
                />
              </div>

              <Separator />

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="edit-location" className="text-sm font-medium">
                  <MapPin className="size-3.5 inline mr-1.5 text-muted-foreground" />
                  Location
                </Label>
                <Input
                  id="edit-location"
                  value={editForm.location}
                  onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. London, UK"
                  className="rounded-lg"
                />
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="edit-website" className="text-sm font-medium">
                  <LinkIcon className="size-3.5 inline mr-1.5 text-muted-foreground" />
                  Website
                </Label>
                <Input
                  id="edit-website"
                  value={editForm.website}
                  onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://yoursite.com"
                  className="rounded-lg"
                />
              </div>

              {/* LinkedIn */}
              <div className="space-y-2">
                <Label htmlFor="edit-linkedin" className="text-sm font-medium">
                  <Linkedin className="size-3.5 inline mr-1.5 text-muted-foreground" />
                  LinkedIn
                </Label>
                <Input
                  id="edit-linkedin"
                  value={editForm.linkedin}
                  onChange={(e) => setEditForm(prev => ({ ...prev, linkedin: e.target.value }))}
                  placeholder="linkedin.com/in/yourprofile"
                  className="rounded-lg"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="edit-phone" className="text-sm font-medium">
                  <Phone className="size-3.5 inline mr-1.5 text-muted-foreground" />
                  Phone
                </Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+92 300 1234567"
                  className="rounded-lg"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="rounded-lg"
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ═══════════════════════════════════════════════════════════════════
            AVATAR DELETE CONFIRMATION DIALOG
            ═══════════════════════════════════════════════════════════════════ */}
        <Dialog open={avatarDeleteDialogOpen} onOpenChange={setAvatarDeleteDialogOpen}>
          <DialogContent className="sm:max-w-sm rounded-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="size-5 text-destructive" />
                Remove Photo
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to remove your profile photo? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setAvatarDeleteDialogOpen(false)}
                className="rounded-lg"
                disabled={avatarUploading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleAvatarDelete}
                disabled={avatarUploading}
                className="rounded-lg"
              >
                {avatarUploading ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="size-4 mr-2" />
                )}
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ═══════════════════════════════════════════════════════════════════
            SHARE CONFIRMATION DIALOG
            ═══════════════════════════════════════════════════════════════════ */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="sm:max-w-sm rounded-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-600" />
                Link Copied!
              </DialogTitle>
              <DialogDescription>
                Profile link has been copied to your clipboard. Share it with friends!
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
