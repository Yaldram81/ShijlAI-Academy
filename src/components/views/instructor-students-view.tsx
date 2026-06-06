'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Search, Filter, Download, MessageSquare,
  GraduationCap, BookOpen, Award, Clock, Star, Zap,
  CheckCircle2, AlertTriangle, X, ArrowUpDown,
  Send, RotateCcw, UserMinus,
  Loader2, Eye, Megaphone, Ban, DollarSign,
  FileCheck, MapPin, Timer, LayoutGrid, List, CreditCard,
  TrendingUp, UserPlus, Shield, Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { InstructorStatCard, InstructorStatCardGrid } from '@/components/instructor/instructor-stat-card'
import { MobileFilterSheet, MobileFilterGroup } from '@/components/mobile-filter-sheet'

// ============================================================
// Types
// ============================================================
interface EnrolledCourse {
  courseId: string
  courseTitle: string
  progress: number
  enrolledAt: string
  lastAccessed: string
  completedAt: string | null
}

interface Student {
  id: string
  name: string
  email: string
  avatar: string | null
  enrolledCourses: EnrolledCourse[]
  overallProgress: number
  totalCoursesEnrolled: number
  completedCourses: number
  lastActiveDate: string
  status: string
  xp: number
  level: number
}

interface StudentSummary {
  totalStudents: number
  activeStudents: number
  completedStudents: number
  avgProgress: number
  topCourse: { courseId: string; title: string; enrollmentCount: number } | null
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

type StatusFilter = 'all' | 'active' | 'completed' | 'at-risk' | 'inactive'
type SortOption = 'name-asc' | 'name-desc' | 'progress-desc' | 'progress-asc' | 'lastActive-desc' | 'newest' | 'oldest'
type ViewMode = 'table' | 'grid' | 'cards'

// ============================================================
// Constants
// ============================================================
const statusConfig: Record<string, { label: string; color: string; dotColor: string; bgColor: string; icon?: React.ElementType }> = {
  active: {
    label: 'Active',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
  },
  completed: {
    label: 'Completed',
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400',
    dotColor: 'bg-teal-500',
    bgColor: 'bg-teal-50 dark:bg-teal-950/20',
    icon: CheckCircle2,
  },
  dropped: {
    label: 'At Risk',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    dotColor: 'bg-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    icon: AlertTriangle,
  },
  inactive: {
    label: 'Inactive',
    color: 'bg-gray-100 text-gray-600 dark:bg-gray-800/60 dark:text-gray-400',
    dotColor: 'bg-gray-400',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
  },
}

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'name-asc', label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
  { value: 'progress-desc', label: 'Progress (High→Low)' },
  { value: 'progress-asc', label: 'Progress (Low→High)' },
  { value: 'lastActive-desc', label: 'Recently Active' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
]

const avatarGradients = [
  'from-emerald-400 to-teal-500',
  'from-teal-400 to-cyan-500',
  'from-emerald-500 to-green-600',
  'from-green-400 to-emerald-500',
  'from-cyan-400 to-teal-500',
  'from-teal-500 to-emerald-400',
]

const spring = { type: 'spring' as const, stiffness: 400, damping: 25 }
const cardSpring = { type: 'spring' as const, stiffness: 300, damping: 24 }

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

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
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

function getEngagementColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-red-400'
}

function getRiskFromProgress(progress: number, lastActive: string): 'low' | 'medium' | 'high' {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const isActive = new Date(lastActive) >= thirtyDaysAgo
  if (progress >= 60 && isActive) return 'low'
  if (progress >= 30 || isActive) return 'medium'
  return 'high'
}

// ============================================================
// Empty State Component
// ============================================================
function EmptyState({
  type,
  onAction,
}: {
  type: 'no-students' | 'no-matching'
  onAction?: () => void
}) {
  const config = {
    'no-students': {
      icon: Users,
      title: 'No students enrolled yet',
      description: 'Students will appear here once they enroll in your courses. Share your courses to attract learners!',
      actionLabel: undefined,
      gradient: 'from-emerald-500 to-teal-600',
    },
    'no-matching': {
      icon: Search,
      title: 'No students match your criteria',
      description: 'Try adjusting your search or filter settings to find the students you\'re looking for.',
      actionLabel: 'Clear Filters',
      gradient: 'from-amber-500 to-orange-600',
    },
  }

  const cfg = config[type]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={spring}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <div className={cn(
        'flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br text-white shadow-lg mb-5',
        cfg.gradient
      )}>
        <cfg.icon className="size-10" />
      </div>
      <h3 className="text-[20px] font-bold text-foreground text-center">{cfg.title}</h3>
      <p className="text-[14px] text-muted-foreground mt-2 text-center max-w-sm">{cfg.description}</p>
      {cfg.actionLabel && onAction && (
        <Button
          className="mt-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
          onClick={onAction}
        >
          {cfg.actionLabel}
        </Button>
      )}
    </motion.div>
  )
}

// ============================================================
// Loading Skeletons
// ============================================================
function TableSkeleton() {
  return (
    <div className="rounded-2xl bg-card shadow-sm overflow-hidden border border-border/50">
      <div className="flex items-center gap-4 px-4 py-3 border-b border-border/50 bg-muted/30">
        <Skeleton className="size-4 rounded" />
        <Skeleton className="h-4 w-6 rounded" />
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-4 w-40 rounded hidden md:block" />
        <Skeleton className="h-4 w-20 rounded hidden md:block" />
        <Skeleton className="h-4 w-16 rounded hidden sm:block" />
        <Skeleton className="h-4 w-16 rounded hidden sm:block" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-border/30 last:border-0">
          <Skeleton className="size-4 rounded" />
          <Skeleton className="h-4 w-6 rounded" />
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Skeleton className="size-9 rounded-full shrink-0" />
            <div className="space-y-1.5 min-w-0">
              <Skeleton className="h-3.5 w-28 rounded" />
              <Skeleton className="h-2.5 w-40 rounded" />
            </div>
          </div>
          <Skeleton className="h-4 w-32 rounded hidden md:block" />
          <div className="hidden md:flex items-center gap-2 w-[120px]">
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-3 w-8 rounded" />
          </div>
          <Skeleton className="h-4 w-14 rounded hidden sm:block" />
          <Skeleton className="h-5 w-16 rounded-full hidden sm:block" />
        </div>
      ))}
    </div>
  )
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-card border border-border/50 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-full" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-3 w-40 rounded" />
            </div>
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// Bulk Action Bar
// ============================================================
function BulkActionBar({
  selectedCount,
  onSendAnnouncement,
  onExportSelected,
  onRevokeAccess,
  onClearSelection,
}: {
  selectedCount: number
  onSendAnnouncement: () => void
  onExportSelected: () => void
  onRevokeAccess: () => void
  onClearSelection: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-2xl bg-foreground text-background px-5 py-3 shadow-2xl"
    >
      <span className="text-[13px] font-semibold whitespace-nowrap">{selectedCount} selected</span>
      <div className="w-px h-5 bg-background/20" />
      <Button
        size="sm"
        variant="ghost"
        className="text-background hover:bg-background/20 h-8 rounded-lg gap-1.5 text-[12px]"
        onClick={onSendAnnouncement}
      >
        <Megaphone className="size-3.5" />
        Send announcement
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-background hover:bg-background/20 h-8 rounded-lg gap-1.5 text-[12px]"
        onClick={onExportSelected}
      >
        <Download className="size-3.5" />
        Export
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="text-red-300 hover:text-red-200 hover:bg-red-500/20 h-8 rounded-lg gap-1.5 text-[12px]"
        onClick={onRevokeAccess}
      >
        <Ban className="size-3.5" />
        Revoke access
      </Button>
      <div className="w-px h-5 bg-background/20" />
      <Button
        size="icon"
        variant="ghost"
        className="text-background/70 hover:text-background hover:bg-background/20 size-7 rounded-lg"
        onClick={onClearSelection}
      >
        <X className="size-4" />
      </Button>
    </motion.div>
  )
}

// ============================================================
// Main Component
// ============================================================
export function InstructorStudentsView() {
  const { currentUser, setCurrentView, setSelectedAssignmentId } = useAppStore()

  // Data state
  const [students, setStudents] = useState<Student[]>([])
  const [summary, setSummary] = useState<StudentSummary | null>(null)
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 })
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([])

  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('lastActive-desc')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Fetch students
  const fetchStudents = useCallback(async () => {
    if (!currentUser?.id) return
    setLoading(true)
    setError(null)

    try {
      const sortMap: Record<SortOption, { sortBy: string; sortOrder: string }> = {
        'name-asc': { sortBy: 'name', sortOrder: 'asc' },
        'name-desc': { sortBy: 'name', sortOrder: 'desc' },
        'progress-desc': { sortBy: 'progress', sortOrder: 'desc' },
        'progress-asc': { sortBy: 'progress', sortOrder: 'asc' },
        'lastActive-desc': { sortBy: 'lastActive', sortOrder: 'desc' },
        'newest': { sortBy: 'enrolledAt', sortOrder: 'desc' },
        'oldest': { sortBy: 'enrolledAt', sortOrder: 'asc' },
      }

      const sort = sortMap[sortBy] || sortMap['lastActive-desc']
      const statusParam = statusFilter === 'at-risk' ? 'dropped' : statusFilter === 'all' ? '' : statusFilter

      const params = new URLSearchParams({
        instructorId: currentUser.id,
        ...(search && { search }),
        ...(courseFilter !== 'all' && { courseId: courseFilter }),
        ...(statusParam && { status: statusParam }),
        sortBy: sort.sortBy,
        sortOrder: sort.sortOrder,
        page: '1',
        limit: '50',
      })

      const res = await fetch(`/api/instructor/students?${params}`)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        if (res.status === 404) {
          setStudents([])
          setSummary(null)
          setPagination({ total: 0, page: 1, limit: 20, totalPages: 0 })
          return
        }
        throw new Error(errData.error || 'Failed to fetch students')
      }
      const data = await res.json()

      setStudents(data.students || [])
      setSummary(data.summary || null)
      setPagination(data.pagination || { total: 0, page: 1, limit: 20, totalPages: 0 })
    } catch (err) {
      console.error('Error fetching students:', err)
      setError(err instanceof Error ? err.message : 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id, search, courseFilter, statusFilter, sortBy])

  // Fetch instructor courses for filter dropdown
  const fetchCourses = useCallback(async () => {
    if (!currentUser?.id) return
    try {
      const res = await fetch(`/api/instructor/courses?instructorId=${currentUser.id}`)
      if (res.ok) {
        const data = await res.json()
        setCourses((data.courses || []).map((c: { id: string; title: string }) => ({ id: c.id, title: c.title })))
      }
    } catch {
      // Silently fail
    }
  }, [currentUser?.id])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  // Client-side filtering
  const filteredStudents = useMemo(() => {
    let result = students

    // Inactive status filter
    if (statusFilter === 'inactive') {
      result = result.filter((s) => s.overallProgress === 0 && s.status !== 'completed')
    }

    return result
  }, [students, statusFilter])

  // Navigate to student detail view
  const handleViewProfile = useCallback((student: Student) => {
    setSelectedAssignmentId(student.id)
    setCurrentView('instructor-student-detail')
  }, [setCurrentView, setSelectedAssignmentId])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearch('')
    setCourseFilter('all')
    setStatusFilter('all')
    setSortBy('lastActive-desc')
  }, [])

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (courseFilter !== 'all') count++
    if (statusFilter !== 'all') count++
    if (sortBy !== 'lastActive-desc') count++
    return count
  }, [courseFilter, statusFilter, sortBy])

  // Bulk selection
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredStudents.map((s) => s.id)))
    }
  }, [selectedIds.size, filteredStudents])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // Export CSV
  const handleExport = useCallback((exportStudents?: Student[]) => {
    const dataToExport = exportStudents || filteredStudents
    if (dataToExport.length === 0) {
      toast.error('No students to export')
      return
    }

    const csv = [
      ['Name', 'Email', 'Course', 'Progress', 'XP', 'Level', 'Joined', 'Status'].join(','),
      ...dataToExport.map((s) =>
        [
          `"${s.name}"`,
          s.email,
          `"${s.enrolledCourses[0]?.courseTitle || 'N/A'}"`,
          `${s.overallProgress}%`,
          s.xp,
          s.level,
          s.enrolledCourses[0]?.enrolledAt ? formatDateShort(s.enrolledCourses[0].enrolledAt) : 'N/A',
          s.status,
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'students-export.csv'
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
    toast.success(`Exported ${dataToExport.length} student${dataToExport.length !== 1 ? 's' : ''}`)
  }, [filteredStudents])

  // Bulk actions
  const handleBulkAnnouncement = useCallback(async () => {
    if (!currentUser?.id) return
    try {
      const selectedStudents = filteredStudents.filter(s => selectedIds.has(s.id))
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedStudents.map(s => s.id),
          type: 'announcement',
          title: 'Announcement from Instructor',
          content: 'Your instructor has sent you an announcement.',
          senderId: currentUser.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send announcement')
      toast.success(`Announcement sent to ${selectedIds.size} student${selectedIds.size !== 1 ? 's' : ''}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send announcement')
    }
    clearSelection()
  }, [currentUser?.id, filteredStudents, selectedIds, clearSelection])

  const handleBulkExport = useCallback(() => {
    const selected = filteredStudents.filter((s) => selectedIds.has(s.id))
    handleExport(selected)
    clearSelection()
  }, [filteredStudents, selectedIds, handleExport, clearSelection])

  const handleBulkRevoke = useCallback(async () => {
    if (!currentUser?.id) return
    try {
      const selectedStudents = filteredStudents.filter(s => selectedIds.has(s.id))
      for (const student of selectedStudents) {
        const primaryCourse = student.enrolledCourses[0]
        if (primaryCourse) {
          await fetch('/api/instructor/refund', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: student.id, courseId: primaryCourse.courseId, instructorId: currentUser.id }),
          })
        }
      }
      toast.success(`Access revoked for ${selectedIds.size} student${selectedIds.size !== 1 ? 's' : ''}`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke access')
    }
    clearSelection()
  }, [currentUser?.id, filteredStudents, selectedIds, clearSelection])

  const hasFilters = search || activeFilterCount > 0
  const hasNoStudents = !loading && students.length === 0 && !hasFilters
  const hasNoMatches = !loading && filteredStudents.length === 0 && hasFilters

  const allSelected = filteredStudents.length > 0 && selectedIds.size === filteredStudents.length
  const someSelected = selectedIds.size > 0 && !allSelected

  // Compute at-risk count
  const atRiskCount = useMemo(() => students.filter(s => s.status === 'dropped').length, [students])
  // New this month count
  const newThisMonth = useMemo(() => {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    return students.filter(s => s.enrolledCourses[0]?.enrolledAt && new Date(s.enrolledCourses[0].enrolledAt) >= startOfMonth).length
  }, [students])

  return (
    <div className="space-y-6">
      {/* ─── Header Section ─── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
              <Users className="size-5" />
            </div>
            <h1 className="text-[28px] font-bold text-foreground tracking-tight">Students</h1>
          </div>
          <p className="text-[14px] text-muted-foreground ml-[52px]">
            {summary
              ? `Total: ${summary.totalStudents.toLocaleString()} student${summary.totalStudents !== 1 ? 's' : ''}`
              : 'Loading student data...'}
          </p>
        </div>
      </motion.div>

      {/* ─── Summary Dashboard Cards ─── */}
      <InstructorStatCardGrid columns={6}>
        <InstructorStatCard
          icon={Users}
          label="Total Students"
          value={summary?.totalStudents ?? 0}
          color="emerald"
          index={0}
        />
        <InstructorStatCard
          icon={Activity}
          label="Active Students"
          value={summary?.activeStudents ?? 0}
          color="teal"
          subLabel="Last 30 days"
          index={1}
        />
        <InstructorStatCard
          icon={CheckCircle2}
          label="Completed"
          value={summary?.completedStudents ?? 0}
          color="cyan"
          index={2}
        />
        <InstructorStatCard
          icon={TrendingUp}
          label="Avg Progress"
          value={`${summary?.avgProgress ?? 0}%`}
          color="amber"
          index={3}
        />
        <InstructorStatCard
          icon={AlertTriangle}
          label="At Risk"
          value={atRiskCount}
          color="orange"
          index={4}
        />
        <InstructorStatCard
          icon={UserPlus}
          label="New This Month"
          value={newThisMonth}
          color="violet"
          index={5}
        />
      </InstructorStatCardGrid>

      {/* ─── Filter Toolbar ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.1 }}
        className="space-y-3"
      >
        {/* Mobile: Search bar full-width */}
        <div className="relative flex-1 w-full md:hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-10 pr-10 rounded-xl text-[13px] bg-card shadow-sm border-0 w-full"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 size-5 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <X className="size-3 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Mobile: Filter button + Sheet */}
        <div className="flex items-center gap-2 md:hidden">
          <MobileFilterSheet
            activeCount={activeFilterCount}
            onClearAll={clearFilters}
          >
            <MobileFilterGroup label="Course">
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-full h-10 text-[13px] rounded-lg">
                  <BookOpen className="size-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </MobileFilterGroup>
            <MobileFilterGroup label="Status">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-full h-10 text-[13px] rounded-lg">
                  <Users className="size-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="at-risk">At Risk</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </MobileFilterGroup>
            <MobileFilterGroup label="Sort By">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-full h-10 text-[13px] rounded-lg">
                  <ArrowUpDown className="size-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </MobileFilterGroup>
          </MobileFilterSheet>

          {/* Mobile: Clear All */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors shrink-0 h-8"
            >
              <Filter className="size-3" />
              Clear
            </button>
          )}
        </div>

        {/* Desktop: Single row with all filters */}
        <div className="hidden md:flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9 pr-8 rounded-xl text-[13px] bg-card shadow-sm border-0 w-full"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 size-5 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              >
                <X className="size-3 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Course Filter */}
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="h-9 rounded-xl text-[13px] w-[170px] bg-card shadow-sm border-0">
              <BookOpen className="size-3.5 mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="h-9 rounded-xl text-[13px] w-[150px] bg-card shadow-sm border-0">
              <Users className="size-3.5 mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="at-risk">At Risk</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="h-9 rounded-xl text-[13px] w-[170px] bg-card shadow-sm border-0">
              <ArrowUpDown className="size-3.5 mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl bg-card shadow-sm border-0 p-0.5 gap-0.5">
            {[
              { mode: 'table' as ViewMode, icon: List, label: 'Table' },
              { mode: 'grid' as ViewMode, icon: LayoutGrid, label: 'Grid' },
              { mode: 'cards' as ViewMode, icon: CreditCard, label: 'Cards' },
            ].map(({ mode, icon: Icon, label }) => (
              <Tooltip key={mode}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'size-8 rounded-lg',
                      viewMode === mode
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                    onClick={() => setViewMode(mode)}
                  >
                    <Icon className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="rounded-xl">{label}</TooltipContent>
              </Tooltip>
            ))}
          </div>

          {/* Export */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="rounded-xl gap-2 text-[13px] h-9 shadow-sm border-0 bg-card"
                onClick={() => handleExport()}
                disabled={loading || filteredStudents.length === 0}
              >
                <Download className="size-4" />
                Export
              </Button>
            </TooltipTrigger>
            <TooltipContent className="rounded-xl">Export student data as CSV</TooltipContent>
          </Tooltip>

          {/* Clear All */}
          {hasFilters && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={clearFilters}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors shrink-0 h-9"
            >
              <Filter className="size-3" />
              Clear All
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* ─── Error State ─── */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-red-50 dark:bg-red-950/30 p-6 flex flex-col items-center text-center"
        >
          <div className="flex size-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/50 mb-3">
            <AlertTriangle className="size-7 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-[16px] font-bold text-red-700 dark:text-red-400">Failed to load students</h3>
          <p className="text-[13px] text-red-600/70 dark:text-red-400/70 mt-1">{error}</p>
          <Button
            variant="outline"
            className="mt-4 rounded-xl text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/50"
            onClick={fetchStudents}
          >
            <RotateCcw className="size-4 mr-2" />
            Retry
          </Button>
        </motion.div>
      )}

      {/* ─── Student Content ─── */}
      {!error && (
        <>
          {loading ? (
            viewMode === 'table' ? <TableSkeleton /> : <GridSkeleton />
          ) : hasNoStudents ? (
            <EmptyState type="no-students" />
          ) : hasNoMatches ? (
            <EmptyState type="no-matching" onAction={clearFilters} />
          ) : (
            <>
              {/* ─── TABLE VIEW ─── */}
              {viewMode === 'table' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: 0.15 }}
                  className="rounded-2xl bg-card shadow-sm overflow-hidden border border-border/50"
                >
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30 border-border/50">
                        <TableHead className="w-10 px-3">
                          <Checkbox
                            checked={allSelected}
                            {...(someSelected && { 'data-state': 'indeterminate' as const })}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Select all students"
                          />
                        </TableHead>
                        <TableHead className="w-10 text-center">#</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead className="hidden md:table-cell">Course</TableHead>
                        <TableHead className="hidden md:table-cell">Progress</TableHead>
                        <TableHead className="hidden lg:table-cell">Engagement</TableHead>
                        <TableHead className="hidden lg:table-cell">Risk</TableHead>
                        <TableHead className="hidden sm:table-cell">Joined</TableHead>
                        <TableHead className="hidden sm:table-cell">Status</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {filteredStudents.map((student, index) => {
                          const statusInfo = statusConfig[student.status] || (student.overallProgress === 0 ? statusConfig.inactive : statusConfig.active)
                          const primaryCourse = student.enrolledCourses[0]
                          const isSelected = selectedIds.has(student.id)
                          const StatusIcon = statusInfo.icon
                          const risk = getRiskFromProgress(student.overallProgress, student.lastActiveDate)
                          const engagementScore = Math.min(100, Math.round(
                            (student.overallProgress * 0.4) +
                            (student.status === 'active' ? 30 : student.status === 'completed' ? 25 : 5) +
                            (student.xp > 100 ? 20 : student.xp > 0 ? 10 : 0)
                          ))
                          const riskColors = { low: 'bg-emerald-500', medium: 'bg-amber-500', high: 'bg-red-500' }

                          return (
                            <motion.tr
                              key={student.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{ ...cardSpring, delay: index * 0.02 }}
                              onClick={() => handleViewProfile(student)}
                              className={cn(
                                'cursor-pointer group transition-colors',
                                isSelected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50'
                              )}
                            >
                              <TableCell className="px-3" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleSelect(student.id)}
                                  aria-label={`Select ${student.name}`}
                                />
                              </TableCell>
                              <TableCell className="text-center text-[12px] text-muted-foreground font-medium">
                                {index + 1}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3 min-w-0">
                                  <Avatar className="size-9 ring-1 ring-primary/10 shrink-0">
                                    <AvatarImage src={student.avatar || undefined} alt={student.name} />
                                    <AvatarFallback className={cn('bg-gradient-to-br text-white text-xs font-bold', getAvatarGradient(student.name))}>
                                      {getInitials(student.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <p className="text-[13px] font-semibold truncate group-hover:text-primary transition-colors">{student.name}</p>
                                    <p className="text-[11px] text-muted-foreground truncate">{student.email}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <span className="text-[13px] text-foreground truncate block max-w-[200px]">
                                  {primaryCourse?.courseTitle || '—'}
                                </span>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className="flex items-center gap-2 min-w-[120px]">
                                  <div className={cn('h-2 rounded-full flex-1 overflow-hidden', getProgressTrackColor(student.overallProgress))}>
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${student.overallProgress}%` }}
                                      transition={{ duration: 0.6, delay: index * 0.03, ease: 'easeOut' }}
                                      className={cn('h-full rounded-full', getProgressColor(student.overallProgress))}
                                    />
                                  </div>
                                  <span className="text-[12px] font-semibold text-foreground w-9 text-right shrink-0">
                                    {student.overallProgress}%
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                <div className="flex items-center gap-2">
                                  <div className={cn('size-2.5 rounded-full', getEngagementColor(engagementScore))} />
                                  <span className="text-[12px] text-muted-foreground">{engagementScore}%</span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                <div className="flex items-center gap-1.5">
                                  <div className={cn('size-2 rounded-full', riskColors[risk])} />
                                  <span className={cn(
                                    'text-[11px] font-medium',
                                    risk === 'low' ? 'text-emerald-600 dark:text-emerald-400' :
                                    risk === 'medium' ? 'text-amber-600 dark:text-amber-400' :
                                    'text-red-600 dark:text-red-400'
                                  )}>
                                    {risk.charAt(0).toUpperCase() + risk.slice(1)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <span className="text-[12px] text-muted-foreground">
                                  {primaryCourse?.enrolledAt ? formatDateShort(primaryCourse.enrolledAt) : '—'}
                                </span>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <Badge className={cn('text-[11px] font-semibold rounded-lg gap-1', statusInfo.color)}>
                                  {StatusIcon && <StatusIcon className="size-3" />}
                                  {statusInfo.label}
                                </Badge>
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                                  onClick={() => handleViewProfile(student)}
                                >
                                  <Eye className="size-4" />
                                </Button>
                              </TableCell>
                            </motion.tr>
                          )
                        })}
                      </AnimatePresence>
                    </TableBody>
                  </Table>

                  {/* Pagination Info */}
                  {pagination.total > 0 && (
                    <div className="flex items-center justify-between py-3 px-4 border-t border-border/50 text-[12px] text-muted-foreground">
                      <span>
                        Showing {filteredStudents.length} of {pagination.total} student{pagination.total !== 1 ? 's' : ''}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">Page {pagination.page} of {Math.max(pagination.totalPages, 1)}</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ─── GRID VIEW ─── */}
              {viewMode === 'grid' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: 0.15 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {filteredStudents.map((student, index) => {
                    const statusInfo = statusConfig[student.status] || statusConfig.active
                    const primaryCourse = student.enrolledCourses[0]
                    const risk = getRiskFromProgress(student.overallProgress, student.lastActiveDate)
                    const riskColors = { low: 'bg-emerald-500', medium: 'bg-amber-500', high: 'bg-red-500' }
                    const StatusIcon = statusInfo.icon

                    return (
                      <motion.div
                        key={student.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ ...cardSpring, delay: index * 0.03 }}
                        className="rounded-2xl bg-card border border-border/50 p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                        onClick={() => handleViewProfile(student)}
                      >
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar className="size-12 ring-2 ring-primary/10 group-hover:ring-primary/20 transition-all">
                            <AvatarImage src={student.avatar || undefined} alt={student.name} />
                            <AvatarFallback className={cn('bg-gradient-to-br text-white text-sm font-bold', getAvatarGradient(student.name))}>
                              {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="text-[14px] font-semibold truncate group-hover:text-primary transition-colors">{student.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{student.email}</p>
                          </div>
                          <div className={cn('size-2.5 rounded-full shrink-0', riskColors[risk])} title={`${risk} risk`} />
                        </div>

                        {/* Primary Course + Progress */}
                        {primaryCourse && (
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center justify-between">
                              <p className="text-[12px] text-muted-foreground truncate max-w-[180px]">{primaryCourse.courseTitle}</p>
                              <span className="text-[12px] font-semibold shrink-0">{student.overallProgress}%</span>
                            </div>
                            <div className={cn('h-2 rounded-full overflow-hidden', getProgressTrackColor(student.overallProgress))}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${student.overallProgress}%` }}
                                transition={{ duration: 0.6, delay: index * 0.03 }}
                                className={cn('h-full rounded-full', getProgressColor(student.overallProgress))}
                              />
                            </div>
                          </div>
                        )}

                        {/* Badges */}
                        <div className="flex items-center gap-2 flex-wrap mb-4">
                          <Badge className={cn('text-[10px] rounded-lg gap-1', statusInfo.color)}>
                            {StatusIcon && <StatusIcon className="size-3" />}
                            {statusInfo.label}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] rounded-lg gap-1">
                            <Zap className="size-3" />
                            {student.xp} XP
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] rounded-lg">
                            Lv.{student.level}
                          </Badge>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 rounded-xl gap-1.5 text-[11px] h-8"
                            onClick={(e) => { e.stopPropagation(); handleViewProfile(student) }}
                          >
                            <Eye className="size-3.5" />
                            View Profile
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="size-8 rounded-xl"
                            onClick={(e) => { e.stopPropagation(); setCurrentView('instructor-messages') }}
                          >
                            <Send className="size-3.5" />
                          </Button>
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}

              {/* ─── CARD VIEW ─── */}
              {viewMode === 'cards' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...spring, delay: 0.15 }}
                  className="space-y-2"
                >
                  {filteredStudents.map((student, index) => {
                    const statusInfo = statusConfig[student.status] || statusConfig.active
                    const primaryCourse = student.enrolledCourses[0]
                    const risk = getRiskFromProgress(student.overallProgress, student.lastActiveDate)
                    const riskColors = { low: 'bg-emerald-500', medium: 'bg-amber-500', high: 'bg-red-500' }
                    const engagementScore = Math.min(100, Math.round(
                      (student.overallProgress * 0.4) +
                      (student.status === 'active' ? 30 : student.status === 'completed' ? 25 : 5) +
                      (student.xp > 100 ? 20 : student.xp > 0 ? 10 : 0)
                    ))

                    return (
                      <motion.div
                        key={student.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ ...cardSpring, delay: index * 0.03 }}
                        className="rounded-2xl bg-card border border-border/50 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => handleViewProfile(student)}
                      >
                        <div className="flex items-center gap-4">
                          {/* Engagement dot */}
                          <div className="flex flex-col items-center gap-1">
                            <div className={cn('size-3 rounded-full', getEngagementColor(engagementScore))} />
                            <span className="text-[9px] text-muted-foreground">{engagementScore}</span>
                          </div>

                          {/* Avatar */}
                          <Avatar className="size-10 ring-1 ring-primary/10 shrink-0">
                            <AvatarImage src={student.avatar || undefined} alt={student.name} />
                            <AvatarFallback className={cn('bg-gradient-to-br text-white text-xs font-bold', getAvatarGradient(student.name))}>
                              {getInitials(student.name)}
                            </AvatarFallback>
                          </Avatar>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-[14px] font-semibold truncate group-hover:text-primary transition-colors">{student.name}</p>
                              <Badge className={cn('text-[10px] rounded-lg shrink-0', statusInfo.color)}>
                                {statusInfo.label}
                              </Badge>
                              <div className={cn('size-2 rounded-full shrink-0', riskColors[risk])} title={`${risk} risk`} />
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                              <span className="truncate">{student.email}</span>
                              <span className="shrink-0">{primaryCourse?.courseTitle || '—'}</span>
                            </div>
                          </div>

                          {/* Progress */}
                          <div className="hidden sm:flex items-center gap-2 min-w-[120px] shrink-0">
                            <div className={cn('h-2 rounded-full flex-1 overflow-hidden', getProgressTrackColor(student.overallProgress))}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${student.overallProgress}%` }}
                                transition={{ duration: 0.6, delay: index * 0.03 }}
                                className={cn('h-full rounded-full', getProgressColor(student.overallProgress))}
                              />
                            </div>
                            <span className="text-[12px] font-semibold w-10 text-right shrink-0">{student.overallProgress}%</span>
                          </div>

                          {/* XP */}
                          <div className="hidden md:flex items-center gap-1 shrink-0">
                            <Zap className="size-3 text-amber-500" />
                            <span className="text-[12px] font-medium">{student.xp}</span>
                          </div>

                          {/* Action */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg text-muted-foreground hover:text-foreground shrink-0"
                            onClick={(e) => { e.stopPropagation(); handleViewProfile(student) }}
                          >
                            <Eye className="size-4" />
                          </Button>
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}
            </>
          )}
        </>
      )}

      {/* ─── Bulk Action Bar ─── */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <BulkActionBar
            selectedCount={selectedIds.size}
            onSendAnnouncement={handleBulkAnnouncement}
            onExportSelected={handleBulkExport}
            onRevokeAccess={handleBulkRevoke}
            onClearSelection={clearSelection}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
