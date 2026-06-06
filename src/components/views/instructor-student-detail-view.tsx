'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Send, FileCheck, StickyNote, BookOpen, Award,
  Clock, Target, CheckCircle2, AlertTriangle, X, Loader2,
  Zap, Trophy, Calendar, MessageSquare, ChevronDown, ChevronUp,
  Shield, Star, TrendingUp, Activity, FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'

// ============================================================
// Types
// ============================================================
interface StudentInfo {
  id: string
  name: string
  email: string
  avatar: string | null
  bio: string | null
  xp: number
  level: number
  shijlCoins: number
  streak: number
  longestStreak: number
  lastActiveAt: string
  createdAt: string
  status: string
  engagementScore: number
  riskLevel: 'low' | 'medium' | 'high'
}

interface EnrolledCourseDetail {
  courseId: string
  courseTitle: string
  category: string
  level: string
  thumbnail: string | null
  progress: number
  enrolledAt: string
  lastAccessed: string
  completedAt: string | null
  completedLessons: number
  totalLessons: number
  totalTimeSpent: number
  lessons: Array<{
    id: string
    title: string
    status: string
    timeSpent: number
    completedAt: string | null
  }>
}

interface QuizAttemptDetail {
  id: string
  quizTitle: string
  score: number
  maxScore: number
  percentage: number
  passed: boolean
  startedAt: string
  completedAt: string | null
  xpEarned: number
}

interface SubmissionDetail {
  id: string
  assignmentTitle: string
  status: string
  score: number | null
  maxScore: number
  submittedAt: string
  gradedAt: string | null
  feedback: string | null
}

interface CertificateDetail {
  id: string
  courseTitle: string
  userName: string
  instructorName: string | null
  score: number
  issuedAt: string
  certificateId: string
  templateType: string
}

interface BadgeDetail {
  id: string
  name: string
  description: string
  icon: string
  category: string
  earnedAt: string
}

interface TimelineItem {
  type: string
  title: string
  date: string
  description?: string
}

interface StudentDetailData {
  student: StudentInfo
  stats: {
    totalCoursesEnrolled: number
    averageProgress: number
    totalLearningTime: number
    lessonsCompleted: number
    totalLessons: number
    quizPassRate: number
    assignmentsSubmitted: number
    completedCourses: number
  }
  enrolledCourses: EnrolledCourseDetail[]
  quizAttempts: QuizAttemptDetail[]
  quizStats: { total: number; passed: number; avgScore: number }
  submissions: SubmissionDetail[]
  assignmentStats: { total: number; submitted: number; graded: number; returned: number }
  certificates: CertificateDetail[]
  badges: BadgeDetail[]
  instructorNotes: Array<{ note: string; instructorName: string; date: string }>
  timeline: TimelineItem[]
}

// ============================================================
// Constants
// ============================================================
const avatarGradients = [
  'from-emerald-400 to-teal-500',
  'from-teal-400 to-cyan-500',
  'from-emerald-500 to-green-600',
  'from-green-400 to-emerald-500',
  'from-cyan-400 to-teal-500',
  'from-teal-500 to-emerald-400',
]

const spring = { type: 'spring' as const, stiffness: 400, damping: 25 }

const statusConfig: Record<string, { label: string; color: string; dotColor: string }> = {
  active: {
    label: 'Active',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
  },
  completed: {
    label: 'Completed',
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400',
    dotColor: 'bg-teal-500',
  },
  dropped: {
    label: 'At Risk',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    dotColor: 'bg-amber-500',
  },
  inactive: {
    label: 'Inactive',
    color: 'bg-gray-100 text-gray-600 dark:bg-gray-800/60 dark:text-gray-400',
    dotColor: 'bg-gray-400',
  },
}

const riskConfig = {
  low: { label: 'Low Risk', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400', icon: Shield },
  medium: { label: 'Medium Risk', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400', icon: AlertTriangle },
  high: { label: 'High Risk', color: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400', icon: AlertTriangle },
}

// ============================================================
// Utility Functions
// ============================================================
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

function getAvatarGradient(name: string): string {
  return avatarGradients[name.charCodeAt(0) % avatarGradients.length]
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatLearningTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

function getProgressColor(progress: number): string {
  if (progress >= 80) return 'bg-emerald-500'
  if (progress >= 50) return 'bg-teal-500'
  if (progress >= 25) return 'bg-amber-500'
  return 'bg-red-400'
}

function getProgressTrackColor(progress: number): string {
  if (progress >= 80) return 'bg-emerald-500/20'
  if (progress >= 50) return 'bg-teal-500/20'
  if (progress >= 25) return 'bg-amber-500/20'
  return 'bg-red-400/20'
}

// ============================================================
// Engagement Ring Component
// ============================================================
function EngagementRing({ score, size = 80 }: { score: number; size?: number }) {
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/30"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[16px] font-bold text-foreground">{score}</span>
      </div>
    </div>
  )
}

// ============================================================
// Loading Skeleton
// ============================================================
function DetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-500/10 to-teal-600/10 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-20 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      {/* Courses skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

// ============================================================
// Main Component
// ============================================================
export function InstructorStudentDetailView() {
  const { currentUser, selectedAssignmentId, setCurrentView, setSelectedAssignmentId } = useAppStore()
  const studentId = selectedAssignmentId

  const [data, setData] = useState<StudentDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [issuingCert, setIssuingCert] = useState(false)
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)

  const fetchDetail = useCallback(async () => {
    if (!studentId || !currentUser?.id) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/instructor/students/${studentId}?instructorId=${currentUser.id}`)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to fetch student detail')
      }
      const result = await res.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load student detail')
    } finally {
      setLoading(false)
    }
  }, [studentId, currentUser?.id])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  const handleBack = useCallback(() => {
    setSelectedAssignmentId(null)
    setCurrentView('instructor-students')
  }, [setCurrentView, setSelectedAssignmentId])

  const handleSaveNote = useCallback(async () => {
    if (!note.trim() || !studentId) return
    setSavingNote(true)
    try {
      const res = await fetch(`/api/instructor/students/${studentId}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note, instructorId: currentUser?.id, instructorName: currentUser?.name }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to save note')
      toast.success('Note saved')
      setNote('')
      // Refresh data to show updated notes
      fetchDetail()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save note')
    } finally {
      setSavingNote(false)
    }
  }, [note, studentId, currentUser?.id, fetchDetail])

  const handleIssueCertificate = useCallback(async (courseId: string) => {
    if (!studentId) return
    setIssuingCert(true)
    try {
      const res = await fetch('/api/instructor/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, courseId, instructorId: currentUser?.id }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to issue certificate')
      toast.success('Certificate issued')
      fetchDetail()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to issue certificate')
    } finally {
      setIssuingCert(false)
    }
  }, [studentId, currentUser?.id, fetchDetail])

  if (loading) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          className="rounded-xl gap-2 text-muted-foreground hover:text-foreground"
          onClick={handleBack}
        >
          <ArrowLeft className="size-4" />
          Back to Students
        </Button>
        <DetailSkeleton />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          className="rounded-xl gap-2 text-muted-foreground hover:text-foreground"
          onClick={handleBack}
        >
          <ArrowLeft className="size-4" />
          Back to Students
        </Button>
        <div className="rounded-2xl bg-red-50 dark:bg-red-950/30 p-6 flex flex-col items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/50 mb-3">
            <AlertTriangle className="size-7 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-[16px] font-bold text-red-700 dark:text-red-400">Failed to load student</h3>
          <p className="text-[13px] text-red-600/70 dark:text-red-400/70 mt-1">{error}</p>
          <Button variant="outline" className="mt-4 rounded-xl" onClick={fetchDetail}>
            <Loader2 className="size-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  const { student, stats, enrolledCourses, quizAttempts, quizStats, submissions, certificates, badges, instructorNotes, timeline } = data
  const statusInfo = statusConfig[student.status] || statusConfig.active
  const riskInfo = riskConfig[student.riskLevel]
  const RiskIcon = riskInfo.icon

  return (
    <div className="space-y-6">
      {/* ─── Back Button ─── */}
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={spring}>
        <Button
          variant="ghost"
          className="rounded-xl gap-2 text-muted-foreground hover:text-foreground"
          onClick={handleBack}
        >
          <ArrowLeft className="size-4" />
          Back to Students
        </Button>
      </motion.div>

      {/* ─── Profile Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="relative rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 md:p-8 text-white overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar + Engagement Ring */}
          <div className="flex items-center gap-5">
            <Avatar className="size-20 ring-4 ring-white/30 shrink-0">
              <AvatarImage src={student.avatar || undefined} alt={student.name} />
              <AvatarFallback className={cn('bg-gradient-to-br text-white text-2xl font-bold', getAvatarGradient(student.name))}>
                {getInitials(student.name)}
              </AvatarFallback>
            </Avatar>
            <EngagementRing score={student.engagementScore} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[24px] md:text-[28px] font-bold truncate">{student.name}</h1>
              <Badge className={cn('text-[11px] font-semibold rounded-lg', statusInfo.color)}>
                <span className={cn('size-2 rounded-full mr-1.5', statusInfo.dotColor)} />
                {statusInfo.label}
              </Badge>
              <Badge className={cn('text-[11px] font-semibold rounded-lg gap-1', riskInfo.color)}>
                <RiskIcon className="size-3" />
                {riskInfo.label}
              </Badge>
            </div>
            <p className="text-emerald-100 text-[14px] truncate">{student.email}</p>
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[12px] text-emerald-100">
              <span className="flex items-center gap-1">
                <Calendar className="size-3" />
                Joined {formatDate(student.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                Last active {formatRelativeTime(student.lastActiveAt)}
              </span>
              <span className="flex items-center gap-1">
                <Zap className="size-3" />
                {student.xp.toLocaleString()} XP
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="size-3" />
                Level {student.level}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-xl gap-1.5 text-[12px] h-9"
              onClick={() => setCurrentView('instructor-messages')}
            >
              <Send className="size-3.5" />
              <span className="hidden sm:inline">Message</span>
            </Button>
            <Button
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-xl gap-1.5 text-[12px] h-9"
              onClick={() => {
                if (enrolledCourses.length > 0) {
                  handleIssueCertificate(enrolledCourses[0].courseId)
                }
              }}
              disabled={issuingCert || enrolledCourses.length === 0}
            >
              {issuingCert ? <Loader2 className="size-3.5 animate-spin" /> : <FileCheck className="size-3.5" />}
              <span className="hidden sm:inline">Certificate</span>
            </Button>
            <Button
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-xl gap-1.5 text-[12px] h-9"
              onClick={() => {
                const el = document.getElementById('notes-section')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <StickyNote className="size-3.5" />
              <span className="hidden sm:inline">Add Note</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ─── Stats Cards Row ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
      >
        {[
          { label: 'Courses Enrolled', value: stats.totalCoursesEnrolled, icon: BookOpen, color: 'from-emerald-500 to-teal-600' },
          { label: 'Average Progress', value: `${stats.averageProgress}%`, icon: TrendingUp, color: 'from-teal-500 to-cyan-600' },
          { label: 'Learning Time', value: formatLearningTime(stats.totalLearningTime), icon: Clock, color: 'from-emerald-600 to-green-600' },
          { label: 'Lessons Completed', value: `${stats.lessonsCompleted}/${stats.totalLessons}`, icon: CheckCircle2, color: 'from-green-500 to-emerald-600' },
          { label: 'Quiz Pass Rate', value: `${stats.quizPassRate}%`, icon: Target, color: 'from-teal-600 to-emerald-500' },
          { label: 'Assignments', value: String(stats.assignmentsSubmitted), icon: FileText, color: 'from-cyan-500 to-teal-600' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.1 + i * 0.05 }}
            className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('flex size-8 items-center justify-center rounded-xl bg-gradient-to-br text-white', stat.color)}>
                <stat.icon className="size-4" />
              </div>
            </div>
            <p className="text-[20px] font-bold text-foreground">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* ─── Enrolled Courses Section ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.2 }}
        className="space-y-3"
      >
        <h2 className="text-[18px] font-bold text-foreground flex items-center gap-2">
          <BookOpen className="size-5 text-emerald-600" />
          Enrolled Courses
          <Badge variant="secondary" className="rounded-lg text-[11px]">{enrolledCourses.length}</Badge>
        </h2>

        {enrolledCourses.length === 0 ? (
          <div className="rounded-2xl bg-muted/30 p-6 text-center">
            <p className="text-[14px] text-muted-foreground">No courses enrolled</p>
          </div>
        ) : (
          <div className="space-y-2">
            {enrolledCourses.map((course, i) => (
              <motion.div
                key={course.courseId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...spring, delay: 0.2 + i * 0.04 }}
                className="rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedCourse(expandedCourse === course.courseId ? null : course.courseId)}
                >
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="size-12 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10 flex items-center justify-center shrink-0">
                      {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.courseTitle} className="size-12 rounded-xl object-cover" />
                      ) : (
                        <BookOpen className="size-5 text-emerald-600" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[14px] font-semibold truncate">{course.courseTitle}</p>
                        {course.completedAt && <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <Badge variant="secondary" className="text-[10px] rounded-md h-5">{course.category}</Badge>
                        <Badge variant="secondary" className="text-[10px] rounded-md h-5">{course.level}</Badge>
                        <span className="text-[11px] text-muted-foreground">{course.completedLessons}/{course.totalLessons} lessons</span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="hidden sm:flex items-center gap-3 min-w-[140px]">
                      <div className={cn('h-2.5 rounded-full flex-1 overflow-hidden', getProgressTrackColor(course.progress))}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className={cn('h-full rounded-full', getProgressColor(course.progress))}
                        />
                      </div>
                      <span className="text-[13px] font-bold w-10 text-right">{course.progress}%</span>
                    </div>

                    {/* Chevron */}
                    {expandedCourse === course.courseId ? (
                      <ChevronUp className="size-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                    )}
                  </div>

                  {/* Mobile progress */}
                  <div className="sm:hidden mt-2">
                    <div className={cn('h-2 rounded-full overflow-hidden', getProgressTrackColor(course.progress))}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${course.progress}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={cn('h-full rounded-full', getProgressColor(course.progress))}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] text-muted-foreground">{course.completedLessons}/{course.totalLessons} lessons</span>
                      <span className="text-[11px] font-semibold">{course.progress}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                    <span>Enrolled {formatDate(course.enrolledAt)}</span>
                    {course.completedAt && <span>Completed {formatDate(course.completedAt)}</span>}
                  </div>
                </div>

                {/* Expanded Lesson Breakdown */}
                <AnimatePresence>
                  {expandedCourse === course.courseId && course.lessons.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-border/50 p-4 bg-muted/20 max-h-60 overflow-y-auto scrollbar-thin">
                        <p className="text-[12px] font-semibold text-muted-foreground mb-2">
                          Lesson Breakdown ({course.completedLessons} of {course.totalLessons} completed)
                        </p>
                        <div className="space-y-1">
                          {course.lessons.map(lesson => (
                            <div key={lesson.id} className="flex items-center gap-2 text-[12px] py-1">
                              {lesson.status === 'completed' ? (
                                <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                              ) : lesson.status === 'in_progress' ? (
                                <Activity className="size-3.5 text-amber-500 shrink-0" />
                              ) : (
                                <div className="size-3.5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                              )}
                              <span className={lesson.status === 'completed' ? 'text-foreground' : 'text-muted-foreground'}>{lesson.title}</span>
                              {lesson.timeSpent > 0 && (
                                <span className="text-[10px] text-muted-foreground ml-auto">{formatLearningTime(lesson.timeSpent)}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ─── Quiz Performance Section ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.25 }}
        className="space-y-3"
      >
        <h2 className="text-[18px] font-bold text-foreground flex items-center gap-2">
          <Target className="size-5 text-teal-600" />
          Quiz Performance
          <Badge variant="secondary" className="rounded-lg text-[11px]">{quizStats.total} attempts</Badge>
        </h2>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm">
            <p className="text-[20px] font-bold">{quizStats.total}</p>
            <p className="text-[11px] text-muted-foreground">Total Attempts</p>
          </div>
          <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm">
            <p className="text-[20px] font-bold text-emerald-600">{quizStats.passed}</p>
            <p className="text-[11px] text-muted-foreground">Passed</p>
          </div>
          <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm">
            <p className="text-[20px] font-bold">{quizStats.avgScore}%</p>
            <p className="text-[11px] text-muted-foreground">Average Score</p>
          </div>
        </div>

        {quizAttempts.length === 0 ? (
          <div className="rounded-2xl bg-muted/30 p-6 text-center">
            <p className="text-[14px] text-muted-foreground">No quiz attempts yet</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-card border border-border/50 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Quiz</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">Percentage</TableHead>
                  <TableHead className="text-center">Result</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quizAttempts.map(qa => (
                  <TableRow key={qa.id}>
                    <TableCell className="text-[13px] font-medium">{qa.quizTitle}</TableCell>
                    <TableCell className="text-center text-[13px]">{qa.score}/{qa.maxScore}</TableCell>
                    <TableCell className="text-center hidden sm:table-cell">
                      <span className={cn(
                        'text-[13px] font-semibold',
                        qa.percentage >= 80 ? 'text-emerald-600' : qa.percentage >= 50 ? 'text-amber-600' : 'text-red-600'
                      )}>
                        {qa.percentage}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        'text-[10px] rounded-lg font-semibold',
                        qa.passed
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                      )}>
                        {qa.passed ? 'Pass' : 'Fail'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-[12px] text-muted-foreground">
                      {formatDate(qa.completedAt || qa.startedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>

      {/* ─── Assignment Submissions Section ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.3 }}
        className="space-y-3"
      >
        <h2 className="text-[18px] font-bold text-foreground flex items-center gap-2">
          <FileText className="size-5 text-emerald-600" />
          Assignment Submissions
          <Badge variant="secondary" className="rounded-lg text-[11px]">{submissions.length}</Badge>
        </h2>

        {submissions.length === 0 ? (
          <div className="rounded-2xl bg-muted/30 p-6 text-center">
            <p className="text-[14px] text-muted-foreground">No submissions yet</p>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {submissions.map(s => {
              const statusStyles: Record<string, string> = {
                submitted: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900',
                graded: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
                returned: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-900',
              }
              const cardBorder = s.status === 'graded' ? 'border-emerald-200 dark:border-emerald-900/30' : s.status === 'returned' ? 'border-blue-200 dark:border-blue-900/30' : 'border-amber-200 dark:border-amber-900/30'

              return (
                <div key={s.id} className={cn('rounded-2xl bg-card border p-4 shadow-sm', cardBorder)}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[14px] font-semibold truncate">{s.assignmentTitle}</p>
                    <Badge className={cn('text-[10px] rounded-lg font-semibold shrink-0', statusStyles[s.status] || statusStyles.submitted)}>
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[12px] text-muted-foreground">
                    <span>Submitted {formatDate(s.submittedAt)}</span>
                    {s.score !== null && (
                      <span className="font-semibold text-foreground">{s.score}/{s.maxScore}</span>
                    )}
                  </div>
                  {s.feedback && (
                    <p className="text-[12px] text-muted-foreground mt-2 line-clamp-2 bg-muted/30 rounded-lg p-2">
                      {s.feedback}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* ─── Certificates & Badges Section ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.35 }}
        className="space-y-6"
      >
        {/* Certificates */}
        <div className="space-y-3">
          <h2 className="text-[18px] font-bold text-foreground flex items-center gap-2">
            <Award className="size-5 text-teal-600" />
            Certificates
            <Badge variant="secondary" className="rounded-lg text-[11px]">{certificates.length}</Badge>
          </h2>

          {certificates.length === 0 ? (
            <div className="rounded-2xl bg-muted/30 p-6 text-center">
              <p className="text-[14px] text-muted-foreground">No certificates earned yet</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {certificates.map(cert => (
                <div key={cert.id} className="rounded-2xl bg-gradient-to-br from-emerald-500/5 to-teal-600/5 border border-emerald-200/50 dark:border-emerald-900/30 p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shrink-0">
                      <Award className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold truncate">{cert.courseTitle}</p>
                      <p className="text-[11px] text-muted-foreground">Score: {cert.score}%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-[11px] text-muted-foreground">
                    <span>ID: {cert.certificateId.slice(0, 12)}...</span>
                    <span>{formatDate(cert.issuedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="space-y-3">
          <h2 className="text-[18px] font-bold text-foreground flex items-center gap-2">
            <Star className="size-5 text-amber-500" />
            Badges
            <Badge variant="secondary" className="rounded-lg text-[11px]">{badges.length}</Badge>
          </h2>

          {badges.length === 0 ? (
            <div className="rounded-2xl bg-muted/30 p-6 text-center">
              <p className="text-[14px] text-muted-foreground">No badges earned yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {badges.map(badge => {
                const categoryIcons: Record<string, string> = { learning: '📚', streak: '🔥', social: '🤝', achievement: '🏆' }
                return (
                  <div key={badge.id} className="rounded-2xl bg-card border border-border/50 p-3 shadow-sm text-center hover:shadow-md transition-shadow">
                    <div className="text-[28px] mb-1">{categoryIcons[badge.category] || '🎖️'}</div>
                    <p className="text-[12px] font-semibold truncate">{badge.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(badge.earnedAt)}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── Private Notes Section ─── */}
      <motion.div
        id="notes-section"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.4 }}
        className="space-y-3"
      >
        <h2 className="text-[18px] font-bold text-foreground flex items-center gap-2">
          <StickyNote className="size-5 text-amber-500" />
          Private Notes
          <span className="text-[12px] font-normal text-muted-foreground">(only you see these)</span>
        </h2>

        <div className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm space-y-3">
          <Textarea
            placeholder="Add a private note about this student..."
            value={note}
            onChange={e => setNote(e.target.value)}
            className="min-h-[80px] resize-none rounded-xl text-[13px]"
          />
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl gap-1.5 text-[12px]"
            disabled={!note.trim() || savingNote}
            onClick={handleSaveNote}
          >
            {savingNote ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Save Note
          </Button>

          {instructorNotes.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                {instructorNotes.map((n, i) => (
                  <div key={i} className="rounded-xl bg-muted/30 p-3">
                    <p className="text-[13px] text-foreground">{n.note}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {n.instructorName} · {new Date(n.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* ─── Activity Timeline ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.45 }}
        className="space-y-3"
      >
        <h2 className="text-[18px] font-bold text-foreground flex items-center gap-2">
          <Activity className="size-5 text-emerald-600" />
          Activity Timeline
        </h2>

        {timeline.length === 0 ? (
          <div className="rounded-2xl bg-muted/30 p-6 text-center">
            <p className="text-[14px] text-muted-foreground">No activity recorded yet</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-4">
            {/* Vertical line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />

            {timeline.slice(0, 15).map((item, i) => {
              const iconMap: Record<string, { icon: React.ElementType; color: string }> = {
                enrollment: { icon: BookOpen, color: 'bg-emerald-500' },
                completion: { icon: CheckCircle2, color: 'bg-teal-500' },
                certificate: { icon: Award, color: 'bg-amber-500' },
                quiz: { icon: Target, color: 'bg-blue-500' },
              }
              const config = iconMap[item.type] || iconMap.enrollment
              const Icon = config.icon

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...spring, delay: 0.45 + i * 0.03 }}
                  className="relative flex items-start gap-3"
                >
                  {/* Dot */}
                  <div className={cn('absolute -left-6 top-1 flex size-5 items-center justify-center rounded-full text-white', config.color)}>
                    <Icon className="size-3" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground">{item.title}</p>
                    {item.description && (
                      <p className="text-[11px] text-muted-foreground">{item.description}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(item.date)}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
