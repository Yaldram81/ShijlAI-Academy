'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardList, Search, Plus, LayoutGrid, List, MoreHorizontal,
  Eye, Edit3, Trash2, Copy, Globe, EyeOff, Clock, BookOpen,
  FileText, Code, Users, Presentation, MessageSquareHeart,
  CalendarDays, ArrowUpDown, Filter, X, Loader2, CheckCircle2,
  AlertCircle, Sparkles, Link, ChevronDown, Zap,
  GraduationCap, BarChart3, GripVertical,
} from 'lucide-react'
import { MobileFilterSheet, MobileFilterGroup } from '@/components/mobile-filter-sheet'
import { cn } from '@/lib/utils'
import { InstructorStatCard, InstructorStatCardGrid } from '@/components/instructor/instructor-stat-card'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'
import type { AssignmentType, SubmissionType } from '@/lib/types'

// ============================================================
// Types
// ============================================================
interface AssignmentItem {
  id: string
  title: string
  description: string
  instructions: string
  type: AssignmentType
  submissionType: SubmissionType
  maxScore: number
  dueDate: string | null
  wordLimit: number | null
  isPublished: boolean
  order: number
  createdAt: string
  updatedAt: string
  course: { id: string; title: string }
  module: { id: string; title: string | null } | null
  submissionCount: number
}

interface AssignmentSummary {
  totalAssignments: number
  publishedCount: number
  draftCount: number
  byType: Record<AssignmentType, number>
}

interface SubmissionSummary {
  pending: number
  graded: number
  total: number
}

interface CourseOption {
  id: string
  title: string
}

interface ModuleOption {
  id: string
  title: string
  courseId: string
}

interface RubricCriterion {
  name: string
  maxPoints: number
  description: string
}

interface ResourceLink {
  label: string
  url: string
}

type TabFilter = 'all' | 'published' | 'drafts' | 'pending-grading'
type SortOption = 'newest' | 'title-az' | 'due-date' | 'type'
type ViewMode = 'grid' | 'list'

// ============================================================
// Constants
// ============================================================
const spring = { type: 'spring' as const, stiffness: 400, damping: 25 }
const springGentle = { type: 'spring' as const, stiffness: 300, damping: 30 }

const typeConfig: Record<AssignmentType, {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: typeof FileText
}> = {
  written: {
    label: 'Written',
    color: 'text-sky-700 dark:text-sky-400',
    bgColor: 'bg-sky-100 dark:bg-sky-950/40',
    borderColor: 'border-sky-200 dark:border-sky-800',
    icon: FileText,
  },
  coding: {
    label: 'Coding',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    icon: Code,
  },
  project: {
    label: 'Project',
    color: 'text-violet-700 dark:text-violet-400',
    bgColor: 'bg-violet-100 dark:bg-violet-950/40',
    borderColor: 'border-violet-200 dark:border-violet-800',
    icon: BookOpen,
  },
  'peer-review': {
    label: 'Peer Review',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-950/40',
    borderColor: 'border-amber-200 dark:border-amber-800',
    icon: MessageSquareHeart,
  },
  presentation: {
    label: 'Presentation',
    color: 'text-pink-700 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-950/40',
    borderColor: 'border-pink-200 dark:border-pink-800',
    icon: Presentation,
  },
}

const typeGradients: Record<AssignmentType, string> = {
  written: 'from-sky-500 to-sky-600',
  coding: 'from-emerald-500 to-emerald-600',
  project: 'from-violet-500 to-violet-600',
  'peer-review': 'from-amber-500 to-amber-600',
  presentation: 'from-pink-500 to-pink-600',
}

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'newest', label: 'Newest First' },
  { value: 'title-az', label: 'Title A–Z' },
  { value: 'due-date', label: 'Due Date' },
  { value: 'type', label: 'By Type' },
]

const statusConfig = {
  published: {
    label: 'Published',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
  },
  draft: {
    label: 'Draft',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    dotColor: 'bg-amber-500',
  },
}

// ============================================================
// Helpers
// ============================================================
function getDueDateInfo(dueDate: string | null): {
  label: string
  isOverdue: boolean
  isUrgent: boolean
  daysLeft: number | null
} {
  if (!dueDate) return { label: 'No due date', isOverdue: false, isUrgent: false, daysLeft: null }
  const now = new Date()
  const due = new Date(dueDate)
  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { label: `${Math.abs(diffDays)}d overdue`, isOverdue: true, isUrgent: true, daysLeft: diffDays }
  }
  if (diffDays === 0) return { label: 'Due today', isOverdue: false, isUrgent: true, daysLeft: 0 }
  if (diffDays === 1) return { label: 'Due tomorrow', isOverdue: false, isUrgent: true, daysLeft: 1 }
  if (diffDays <= 7) return { label: `${diffDays}d left`, isOverdue: false, isUrgent: false, daysLeft: diffDays }
  return {
    label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    isOverdue: false,
    isUrgent: false,
    daysLeft: diffDays,
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ============================================================
// Empty State Component
// ============================================================
function EmptyState({
  type,
  onAction,
  actionLabel,
}: {
  type: 'no-assignments' | 'no-matching'
  onAction?: () => void
  actionLabel?: string
}) {
  const config = {
    'no-assignments': {
      icon: ClipboardList,
      title: 'Create Your First Assignment',
      description:
        'Build engaging assignments with rubrics, resources, and multiple submission types. Track student progress and provide feedback.',
      gradient: 'from-emerald-500 to-teal-600',
    },
    'no-matching': {
      icon: Search,
      title: 'No assignments match your filters',
      description:
        "Try adjusting your search or filter criteria to find what you're looking for.",
      gradient: 'from-amber-500 to-orange-600',
    },
  }

  const c = config[type]
  const Icon = c.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springGentle}
      className="flex flex-col items-center justify-center py-20 px-6"
    >
      <div
        className={cn(
          'flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br text-white shadow-lg mb-6',
          c.gradient
        )}
      >
        <Icon className="size-10" />
      </div>
      <h3 className="text-[22px] font-bold text-foreground mb-2">{c.title}</h3>
      <p className="text-[14px] text-muted-foreground text-center max-w-md mb-6">
        {c.description}
      </p>
      {onAction && actionLabel && (
        <Button
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
          onClick={onAction}
        >
          <Plus className="mr-2 size-4" />
          {actionLabel}
        </Button>
      )}
    </motion.div>
  )
}



// ============================================================
// Assignment Card (Grid View)
// ============================================================
function AssignmentCard({
  assignment,
  index,
  onViewDetails,
  onEdit,
  onDuplicate,
  onDelete,
  onTogglePublish,
}: {
  assignment: AssignmentItem
  index: number
  onViewDetails: (id: string) => void
  onEdit: (id: string) => void
  onDuplicate: (a: AssignmentItem) => void
  onDelete: (a: AssignmentItem) => void
  onTogglePublish: (a: AssignmentItem) => void
}) {
  const tc = typeConfig[assignment.type]
  const TypeIcon = tc.icon
  const dueInfo = getDueDateInfo(assignment.dueDate)
  const statusKey = assignment.isPublished ? 'published' : 'draft'
  const status = statusConfig[statusKey]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: index * 0.04 }}
      className={cn(
        'rounded-2xl border bg-card overflow-hidden',
        'hover:shadow-lg transition-all duration-200 group'
      )}
    >
      {/* Card Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Badge
              className={cn(
                'rounded-lg text-[11px] px-2 py-0.5 h-6 border-0 shrink-0',
                tc.bgColor,
                tc.color
              )}
            >
              <TypeIcon className="mr-1 size-3" />
              {tc.label}
            </Badge>
            <Badge
              className={cn(
                'rounded-lg text-[11px] px-2 py-0.5 h-6 border-0',
                status.color
              )}
            >
              <span
                className={cn(
                  'size-1.5 rounded-full mr-1.5',
                  status.dotColor
                )}
              />
              {status.label}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="size-8 rounded-lg p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem
                onClick={() => onViewDetails(assignment.id)}
                className="gap-2"
              >
                <Eye className="size-4" /> View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onEdit(assignment.id)}
                className="gap-2"
              >
                <Edit3 className="size-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDuplicate(assignment)}
                className="gap-2"
              >
                <Copy className="size-4" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onTogglePublish(assignment)}
                className="gap-2"
              >
                {assignment.isPublished ? (
                  <>
                    <EyeOff className="size-4" /> Unpublish
                  </>
                ) : (
                  <>
                    <Globe className="size-4" /> Publish
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(assignment)}
                className="gap-2 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
              >
                <Trash2 className="size-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title - clickable */}
        <button
          onClick={() => onViewDetails(assignment.id)}
          className="text-[15px] font-bold text-left hover:text-primary transition-colors line-clamp-2 w-full"
        >
          {assignment.title}
        </button>

        {/* Course / Module */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
          <BookOpen className="size-3 shrink-0" />
          <span className="truncate font-medium">{assignment.course.title}</span>
          {assignment.module?.title && (
            <>
              <span className="text-muted-foreground/50">·</span>
              <span className="truncate">{assignment.module.title}</span>
            </>
          )}
        </div>
      </div>

      {/* Due Date */}
      <div className="px-4 pb-3">
        <div
          className={cn(
            'flex items-center gap-1.5 text-[12px]',
            dueInfo.isOverdue
              ? 'text-red-600 dark:text-red-400'
              : dueInfo.isUrgent
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-muted-foreground'
          )}
        >
          <Clock className="size-3.5 shrink-0" />
          <span className="font-medium">{dueInfo.label}</span>
          {dueInfo.isOverdue && (
            <Badge
              variant="destructive"
              className="rounded-lg text-[10px] px-1.5 py-0 h-4 ml-1"
            >
              Overdue
            </Badge>
          )}
        </div>
      </div>

      {/* Submission Progress */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between text-[12px] mb-1.5">
          <span className="text-muted-foreground">
            {assignment.submissionCount} submitted
          </span>
          <span className="font-medium">
            {assignment.submissionCount > 0
              ? Math.round(
                  (assignment.submissionCount /
                    Math.max(assignment.submissionCount, 1)) *
                    100
                )
              : 0}
            %
          </span>
        </div>
        <Progress
          value={Math.min(
            (assignment.submissionCount /
              Math.max(assignment.submissionCount, 1)) *
              100,
            100
          )}
          className="h-1.5"
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-muted/30 flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <GraduationCap className="size-3.5" />
          <span>{assignment.maxScore} pts</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CalendarDays className="size-3.5" />
          <span>{formatDate(assignment.createdAt)}</span>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================
// Assignment Row (List View)
// ============================================================
function AssignmentRow({
  assignment,
  index,
  onViewDetails,
  onEdit,
  onDuplicate,
  onDelete,
  onTogglePublish,
}: {
  assignment: AssignmentItem
  index: number
  onViewDetails: (id: string) => void
  onEdit: (id: string) => void
  onDuplicate: (a: AssignmentItem) => void
  onDelete: (a: AssignmentItem) => void
  onTogglePublish: (a: AssignmentItem) => void
}) {
  const tc = typeConfig[assignment.type]
  const TypeIcon = tc.icon
  const dueInfo = getDueDateInfo(assignment.dueDate)
  const statusKey = assignment.isPublished ? 'published' : 'draft'
  const status = statusConfig[statusKey]

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...spring, delay: index * 0.03 }}
      className={cn(
        'rounded-xl border bg-card p-3 sm:p-4 flex items-center gap-3 sm:gap-4',
        'hover:shadow-md transition-all group'
      )}
    >
      {/* Type Icon */}
      <div
        className={cn(
          'hidden sm:flex size-10 items-center justify-center rounded-xl shrink-0',
          tc.bgColor
        )}
      >
        <TypeIcon className={cn('size-5', tc.color)} />
      </div>

      {/* Main Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onViewDetails(assignment.id)}
            className="text-[14px] font-bold hover:text-primary transition-colors truncate text-left"
          >
            {assignment.title}
          </button>
          <Badge
            className={cn(
              'rounded-lg text-[10px] px-1.5 py-0 h-5 border-0 shrink-0',
              tc.bgColor,
              tc.color
            )}
          >
            {tc.label}
          </Badge>
          <Badge
            className={cn(
              'rounded-lg text-[10px] px-1.5 py-0 h-5 border-0 shrink-0',
              status.color
            )}
          >
            {status.label}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-1 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="size-3" />
            {assignment.course.title}
          </span>
          {assignment.module?.title && (
            <span className="truncate">· {assignment.module.title}</span>
          )}
          <span className="flex items-center gap-1">
            <GraduationCap className="size-3" />
            {assignment.maxScore} pts
          </span>
        </div>
      </div>

      {/* Due Date */}
      <div
        className={cn(
          'hidden md:flex items-center gap-1.5 text-[12px] shrink-0 min-w-[110px]',
          dueInfo.isOverdue
            ? 'text-red-600 dark:text-red-400'
            : dueInfo.isUrgent
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-muted-foreground'
        )}
      >
        <Clock className="size-3.5" />
        <span className="font-medium truncate">{dueInfo.label}</span>
      </div>

      {/* Submission Progress */}
      <div className="hidden lg:flex items-center gap-2 shrink-0 min-w-[100px]">
        <Progress
          value={Math.min(
            (assignment.submissionCount /
              Math.max(assignment.submissionCount, 1)) *
              100,
            100
          )}
          className="h-1.5 flex-1"
        />
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">
          {assignment.submissionCount}
        </span>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="size-8 rounded-lg p-0 shrink-0"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-xl">
          <DropdownMenuItem
            onClick={() => onViewDetails(assignment.id)}
            className="gap-2"
          >
            <Eye className="size-4" /> View Details
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onEdit(assignment.id)}
            className="gap-2"
          >
            <Edit3 className="size-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onDuplicate(assignment)}
            className="gap-2"
          >
            <Copy className="size-4" /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onTogglePublish(assignment)}
            className="gap-2"
          >
            {assignment.isPublished ? (
              <>
                <EyeOff className="size-4" /> Unpublish
              </>
            ) : (
              <>
                <Globe className="size-4" /> Publish
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDelete(assignment)}
            className="gap-2 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
          >
            <Trash2 className="size-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  )
}

// ============================================================
// Create Assignment Dialog
// ============================================================
function CreateAssignmentDialog({
  open,
  onClose,
  onCreated,
  instructorId,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
  instructorId: string
}) {
  const [creating, setCreating] = useState(false)
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [modules, setModules] = useState<ModuleOption[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    instructions: '',
    type: 'written' as AssignmentType,
    courseId: '',
    moduleId: '',
    submissionType: 'text' as SubmissionType,
    maxScore: 100,
    dueDate: '',
    wordLimit: '',
    isPublished: false,
  })
  const [rubric, setRubric] = useState<RubricCriterion[]>([])
  const [resources, setResources] = useState<ResourceLink[]>([])

  // Fetch courses on open
  useEffect(() => {
    if (!open) return
    fetch(`/api/instructor/courses?instructorId=${instructorId}`)
      .then((res) => res.json())
      .then((data) =>
        setCourses(
          (data.courses || []).map((c: { id: string; title: string }) => ({
            id: c.id,
            title: c.title,
          }))
        )
      )
      .catch(() => setCourses([]))
  }, [open, instructorId])

  // Fetch modules when course changes
  useEffect(() => {
    if (!form.courseId) {
      setModules([])
      return
    }
    // Extract modules from the courses API (assuming it returns modules)
    fetch(`/api/instructor/courses?instructorId=${instructorId}`)
      .then((res) => res.json())
      .then((data) => {
        const course = (data.courses || []).find(
          (c: { id: string }) => c.id === form.courseId
        )
        if (course?.modules) {
          setModules(
            course.modules.map((m: { id: string; title: string }) => ({
              id: m.id,
              title: m.title,
              courseId: form.courseId,
            }))
          )
        } else {
          setModules([])
        }
      })
      .catch(() => setModules([]))
  }, [form.courseId, instructorId])

  const addRubricCriterion = () => {
    setRubric([
      ...rubric,
      { name: '', maxPoints: 10, description: '' },
    ])
  }

  const updateRubricCriterion = (
    index: number,
    updates: Partial<RubricCriterion>
  ) => {
    const updated = [...rubric]
    updated[index] = { ...updated[index], ...updates }
    setRubric(updated)
  }

  const removeRubricCriterion = (index: number) => {
    setRubric(rubric.filter((_, i) => i !== index))
  }

  const addResource = () => {
    setResources([...resources, { label: '', url: '' }])
  }

  const updateResource = (index: number, updates: Partial<ResourceLink>) => {
    const updated = [...resources]
    updated[index] = { ...updated[index], ...updates }
    setResources(updated)
  }

  const removeResource = (index: number) => {
    setResources(resources.filter((_, i) => i !== index))
  }

  const resetForm = useCallback(() => {
    setForm({
      title: '',
      description: '',
      instructions: '',
      type: 'written',
      courseId: '',
      moduleId: '',
      submissionType: 'text',
      maxScore: 100,
      dueDate: '',
      wordLimit: '',
      isPublished: false,
    })
    setRubric([])
    setResources([])
  }, [])

  const handleCreate = async (publish: boolean) => {
    if (!form.title.trim() || !form.courseId) {
      toast.error('Please fill in the title and select a course')
      return
    }

    setCreating(true)
    try {
      const payload = {
        instructorId,
        title: form.title.trim(),
        description: form.description,
        instructions: form.instructions,
        type: form.type,
        courseId: form.courseId,
        moduleId: form.moduleId || null,
        submissionType: form.submissionType,
        maxScore: form.maxScore,
        dueDate: form.dueDate || null,
        wordLimit: form.wordLimit ? parseInt(form.wordLimit) : null,
        isPublished: publish,
        rubric:
          rubric.length > 0
            ? JSON.stringify(
                rubric.filter((r) => r.name.trim())
              )
            : null,
        resources:
          resources.length > 0
            ? JSON.stringify(
                resources.filter((r) => r.url.trim())
              )
            : null,
      }

      const res = await fetch('/api/instructor/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create assignment')
      }

      toast.success(
        publish
          ? 'Assignment published successfully!'
          : 'Draft saved successfully!'
      )
      onCreated()
      onClose()
      resetForm()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to create assignment'
      )
    } finally {
      setCreating(false)
    }
  }

  const selectedTypeConfig = typeConfig[form.type]
  const SelectedTypeIcon = selectedTypeConfig.icon

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          onClose()
          resetForm()
        }
      }}
    >
      <DialogContent className="rounded-3xl p-0 overflow-hidden max-w-3xl max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
          <DialogTitle className="text-[22px] font-bold text-white">
            Create New Assignment
          </DialogTitle>
          <DialogDescription className="text-emerald-100 text-[14px] mt-1">
            Build an engaging assignment with rubrics and resources
          </DialogDescription>
        </div>

        <ScrollArea className="max-h-[65vh]">
          <div className="p-6 space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <Label className="text-[14px] font-semibold">
                Assignment Title *
              </Label>
              <Input
                placeholder="e.g. Chapter 5 – Essay on Climate Change"
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                className="h-12 rounded-xl text-[15px]"
                maxLength={120}
              />
              <p className="text-[12px] text-muted-foreground">
                {form.title.length}/120 characters
              </p>
            </div>

            {/* Course & Module */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[14px] font-semibold">Course *</Label>
                <Select
                  value={form.courseId}
                  onValueChange={(v) =>
                    setForm({ ...form, courseId: v, moduleId: '' })
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {courses.length === 0 && (
                  <p className="text-[12px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="size-3" /> Create a course first
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-[14px] font-semibold">Module</Label>
                <Select
                  value={form.moduleId}
                  onValueChange={(v) =>
                    setForm({ ...form, moduleId: v })
                  }
                  disabled={modules.length === 0}
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue
                      placeholder={
                        modules.length === 0
                          ? 'No modules available'
                          : 'Select a module'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No module</SelectItem>
                    {modules.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Type & Submission Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[14px] font-semibold">
                  Assignment Type
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    Object.entries(typeConfig) as [
                      AssignmentType,
                      (typeof typeConfig)[AssignmentType],
                    ][]
                  ).map(([key, cfg]) => {
                    const Icon = cfg.icon
                    return (
                      <button
                        key={key}
                        onClick={() =>
                          setForm({ ...form, type: key })
                        }
                        className={cn(
                          'rounded-xl px-3 py-2.5 text-[12px] font-medium transition-all border flex items-center gap-1.5',
                          form.type === key
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-card border-border hover:border-primary/50 text-card-foreground'
                        )}
                      >
                        <Icon className="size-3.5" />
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[14px] font-semibold">
                  Submission Type
                </Label>
                <Select
                  value={form.submissionType}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      submissionType: v as SubmissionType,
                    })
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Entry</SelectItem>
                    <SelectItem value="file">File Upload</SelectItem>
                    <SelectItem value="url">URL Submission</SelectItem>
                    <SelectItem value="multiple">Multiple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-[14px] font-semibold">Description</Label>
              <Textarea
                placeholder="Brief description of the assignment..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="rounded-xl text-[14px] min-h-[80px] resize-y"
                maxLength={1000}
              />
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <Label className="text-[14px] font-semibold">
                Instructions
              </Label>
              <Textarea
                placeholder="Detailed instructions for students..."
                value={form.instructions}
                onChange={(e) =>
                  setForm({ ...form, instructions: e.target.value })
                }
                className="rounded-xl text-[14px] min-h-[120px] resize-y"
                maxLength={5000}
              />
            </div>

            {/* Due Date, Max Score, Word Limit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-[14px] font-semibold">Due Date</Label>
                <Input
                  type="datetime-local"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                  className="h-11 rounded-xl text-[14px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[14px] font-semibold">
                  Max Score
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={1000}
                  value={form.maxScore}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maxScore: Math.max(
                        1,
                        parseInt(e.target.value) || 0
                      ),
                    })
                  }
                  className="h-11 rounded-xl text-[14px]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[14px] font-semibold">
                  Word Limit
                  <span className="text-muted-foreground font-normal ml-1">
                    (optional)
                  </span>
                </Label>
                <Input
                  type="number"
                  min={0}
                  placeholder="No limit"
                  value={form.wordLimit}
                  onChange={(e) =>
                    setForm({ ...form, wordLimit: e.target.value })
                  }
                  className="h-11 rounded-xl text-[14px]"
                />
              </div>
            </div>

            <Separator />

            {/* Rubric Builder */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[14px] font-semibold flex items-center gap-2">
                  <BarChart3 className="size-4 text-primary" />
                  Rubric Criteria
                  <span className="text-muted-foreground font-normal text-[12px]">
                    (optional)
                  </span>
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-[12px] gap-1"
                  onClick={addRubricCriterion}
                >
                  <Plus className="size-3" /> Add Criteria
                </Button>
              </div>

              {rubric.length > 0 && (
                <div className="space-y-2">
                  {rubric.map((criterion, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-xl border bg-muted/30 p-3 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="size-4 text-muted-foreground shrink-0" />
                        <Input
                          placeholder="Criteria name"
                          value={criterion.name}
                          onChange={(e) =>
                            updateRubricCriterion(idx, {
                              name: e.target.value,
                            })
                          }
                          className="h-9 rounded-lg text-[13px] flex-1"
                        />
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={criterion.maxPoints}
                          onChange={(e) =>
                            updateRubricCriterion(idx, {
                              maxPoints: Math.max(
                                1,
                                parseInt(e.target.value) || 0
                              ),
                            })
                          }
                          className="h-9 rounded-lg text-[13px] w-20 text-center"
                          placeholder="Pts"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 rounded-lg p-0 text-muted-foreground hover:text-red-500"
                          onClick={() => removeRubricCriterion(idx)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                      <Input
                        placeholder="Description (optional)"
                        value={criterion.description}
                        onChange={(e) =>
                          updateRubricCriterion(idx, {
                            description: e.target.value,
                          })
                        }
                        className="h-9 rounded-lg text-[13px]"
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              {rubric.length === 0 && (
                <div className="rounded-xl border-2 border-dashed border-border p-4 text-center">
                  <BarChart3 className="size-6 text-muted-foreground/40 mx-auto mb-1" />
                  <p className="text-[13px] text-muted-foreground">
                    Add rubric criteria to grade consistently
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Resource Links */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[14px] font-semibold flex items-center gap-2">
                  <Link className="size-4 text-primary" />
                  Resource Links
                  <span className="text-muted-foreground font-normal text-[12px]">
                    (optional)
                  </span>
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-[12px] gap-1"
                  onClick={addResource}
                >
                  <Plus className="size-3" /> Add Link
                </Button>
              </div>

              {resources.length > 0 && (
                <div className="space-y-2">
                  {resources.map((resource, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Input
                        placeholder="Label"
                        value={resource.label}
                        onChange={(e) =>
                          updateResource(idx, {
                            label: e.target.value,
                          })
                        }
                        className="h-9 rounded-lg text-[13px] w-1/3"
                      />
                      <Input
                        placeholder="https://..."
                        value={resource.url}
                        onChange={(e) =>
                          updateResource(idx, { url: e.target.value })
                        }
                        className="h-9 rounded-lg text-[13px] flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 rounded-lg p-0 text-muted-foreground hover:text-red-500"
                        onClick={() => removeResource(idx)}
                      >
                        <X className="size-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}

              {resources.length === 0 && (
                <div className="rounded-xl border-2 border-dashed border-border p-4 text-center">
                  <Link className="size-6 text-muted-foreground/40 mx-auto mb-1" />
                  <p className="text-[13px] text-muted-foreground">
                    Add reference links for students
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Publish Toggle */}
            <div className="flex items-center justify-between rounded-xl bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                {form.isPublished ? (
                  <Globe className="size-5 text-emerald-600" />
                ) : (
                  <EyeOff className="size-5 text-amber-600" />
                )}
                <div>
                  <p className="text-[14px] font-semibold">
                    {form.isPublished ? 'Published' : 'Draft'}
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    {form.isPublished
                      ? 'Students can see and submit this assignment'
                      : 'Only you can see this assignment'}
                  </p>
                </div>
              </div>
              <Switch
                checked={form.isPublished}
                onCheckedChange={(v) =>
                  setForm({ ...form, isPublished: v })
                }
              />
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-4 flex items-center justify-between gap-3 bg-muted/20">
          <div className="flex items-center gap-2">
            <SelectedTypeIcon className={cn('size-4', selectedTypeConfig.color)} />
            <Badge className={cn('text-[10px] rounded-lg border-0', selectedTypeConfig.bgColor, selectedTypeConfig.color)}>
              {selectedTypeConfig.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => handleCreate(false)}
              disabled={creating}
            >
              {creating ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <EyeOff className="mr-2 size-4" />
              )}
              Save as Draft
            </Button>
            <Button
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
              onClick={() => handleCreate(true)}
              disabled={creating}
            >
              {creating ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Globe className="mr-2 size-4" />
              )}
              Publish
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Main Component
// ============================================================
export function InstructorAssignmentsView() {
  const { currentUser, setSelectedAssignmentId, setCurrentView } =
    useAppStore()

  // Data state
  const [assignments, setAssignments] = useState<AssignmentItem[]>([])
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [submissionSummary, setSubmissionSummary] =
    useState<SubmissionSummary>({
      pending: 0,
      graded: 0,
      total: 0,
    })
  const [summary, setSummary] = useState<AssignmentSummary>({
    totalAssignments: 0,
    publishedCount: 0,
    draftCount: 0,
    byType: {
      written: 0,
      coding: 0,
      project: 0,
      'peer-review': 0,
      presentation: 0,
    },
  })

  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabFilter>('all')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AssignmentItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingPublishId, setTogglingPublishId] = useState<string | null>(
    null
  )
  const [duplicating, setDuplicating] = useState(false)

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!currentUser?.id) return
    setLoading(true)
    setError(null)
    try {
      const [assignRes, courseRes, subRes] = await Promise.all([
        fetch(`/api/instructor/assignments?instructorId=${currentUser.id}`),
        fetch(`/api/instructor/courses?instructorId=${currentUser.id}`),
        fetch(`/api/instructor/submissions?instructorId=${currentUser.id}`),
      ])

      if (assignRes.ok) {
        const assignData = await assignRes.json()
        setAssignments(assignData.assignments || [])
        if (assignData.summary) {
          setSummary(assignData.summary)
        }
      }

      if (courseRes.ok) {
        const courseData = await courseRes.json()
        setCourses(
          (courseData.courses || []).map(
            (c: { id: string; title: string }) => ({
              id: c.id,
              title: c.title,
            })
          )
        )
      }

      if (subRes.ok) {
        const subData = await subRes.json()
        if (subData.summary) {
          setSubmissionSummary(subData.summary)
        }
      }
    } catch (err) {
      console.error('Failed to fetch assignments:', err)
      setError('Failed to load assignments. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Computed values
  const pendingGradingCount = submissionSummary.pending

  const filteredAssignments = useMemo(() => {
    let filtered = [...assignments]

    // Tab filter
    if (activeTab === 'published') {
      filtered = filtered.filter((a) => a.isPublished)
    } else if (activeTab === 'drafts') {
      filtered = filtered.filter((a) => !a.isPublished)
    } else if (activeTab === 'pending-grading') {
      // Show assignments that have submissions pending grading
      filtered = filtered.filter((a) => a.submissionCount > 0)
    }

    // Course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter((a) => a.course.id === courseFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((a) => a.type === typeFilter)
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.course.title.toLowerCase().includes(q)
      )
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
        )
        break
      case 'title-az':
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'due-date':
        filtered.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return (
            new Date(a.dueDate).getTime() -
            new Date(b.dueDate).getTime()
          )
        })
        break
      case 'type':
        filtered.sort((a, b) => a.type.localeCompare(b.type))
        break
    }

    return filtered
  }, [assignments, activeTab, courseFilter, typeFilter, searchQuery, sortBy])

  const tabCounts = useMemo(
    () => ({
      all: assignments.length,
      published: assignments.filter((a) => a.isPublished).length,
      drafts: assignments.filter((a) => !a.isPublished).length,
      'pending-grading': assignments.filter((a) => a.submissionCount > 0)
        .length,
    }),
    [assignments]
  )

  // Handlers
  const handleViewDetails = useCallback(
    (id: string) => {
      setSelectedAssignmentId(id)
      setCurrentView('instructor-assignment-detail')
    },
    [setSelectedAssignmentId, setCurrentView]
  )

  const handleEdit = useCallback(
    (id: string) => {
      setSelectedAssignmentId(id)
      setCurrentView('instructor-assignment-detail')
    },
    [setSelectedAssignmentId, setCurrentView]
  )

  const handleDuplicate = useCallback(
    async (assignment: AssignmentItem) => {
      setDuplicating(true)
      try {
        const res = await fetch('/api/instructor/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instructorId: currentUser?.id,
            title: `${assignment.title} (Copy)`,
            description: assignment.description,
            instructions: assignment.instructions,
            type: assignment.type,
            courseId: assignment.course.id,
            moduleId: assignment.module?.id || null,
            submissionType: assignment.submissionType,
            maxScore: assignment.maxScore,
            dueDate: assignment.dueDate,
            wordLimit: assignment.wordLimit,
            isPublished: false,
          }),
        })
        if (!res.ok) throw new Error('Failed to duplicate')
        toast.success('Assignment duplicated!')
        fetchData()
      } catch {
        toast.error('Failed to duplicate assignment')
      } finally {
        setDuplicating(false)
      }
    },
    [currentUser?.id, fetchData]
  )

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(
        `/api/instructor/assignments/${deleteTarget.id}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instructorId: currentUser?.id }),
        }
      )
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Assignment deleted')
      setDeleteTarget(null)
      fetchData()
    } catch {
      toast.error('Failed to delete assignment')
    } finally {
      setDeleting(false)
    }
  }, [deleteTarget, currentUser?.id, fetchData])

  const handleTogglePublish = useCallback(
    async (assignment: AssignmentItem) => {
      setTogglingPublishId(assignment.id)
      try {
        const res = await fetch(
          `/api/instructor/assignments/${assignment.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              instructorId: currentUser?.id,
              isPublished: !assignment.isPublished,
            }),
          }
        )
        if (!res.ok) throw new Error('Failed to toggle publish')
        toast.success(
          assignment.isPublished ? 'Assignment unpublished' : 'Assignment published'
        )
        fetchData()
      } catch {
        toast.error('Failed to update assignment')
      } finally {
        setTogglingPublishId(null)
      }
    },
    [currentUser?.id, fetchData]
  )

  const handleGradePending = useCallback(() => {
    setActiveTab('pending-grading')
  }, [])

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setCourseFilter('all')
    setTypeFilter('all')
    setSortBy('newest')
  }, [])

  const hasActiveFilters =
    searchQuery || courseFilter !== 'all' || typeFilter !== 'all'

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className="space-y-6">
      {/* ==================== Header Section ==================== */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight">
              Assignments
            </h1>
            <p className="text-[14px] text-muted-foreground mt-1">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {summary.publishedCount} published
              </span>
              <span className="mx-1.5">·</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {summary.draftCount} drafts
              </span>
              <span className="mx-1.5">·</span>
              <span
                className={cn(
                  'font-semibold',
                  pendingGradingCount > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-muted-foreground'
                )}
              >
                {pendingGradingCount} pending grading
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-xl gap-2"
                    onClick={handleGradePending}
                    disabled={pendingGradingCount === 0}
                  >
                    <Zap
                      className={cn(
                        'size-4',
                        pendingGradingCount > 0
                          ? 'text-amber-600'
                          : 'text-muted-foreground'
                      )}
                    />
                    Grade Pending
                    {pendingGradingCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="rounded-lg text-[10px] px-1.5 py-0 h-5 ml-1"
                      >
                        {pendingGradingCount}
                      </Badge>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {pendingGradingCount > 0
                      ? `${pendingGradingCount} submissions need grading`
                      : 'No pending submissions'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="mr-2 size-4" />
              Create Assignment
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ==================== Stats Cards Row ==================== */}
      <InstructorStatCardGrid columns={4}>
        <InstructorStatCard
          label="Total Assignments"
          value={summary.totalAssignments}
          icon={ClipboardList}
          color="teal"
          index={0}
        />
        <InstructorStatCard
          label="Published"
          value={summary.publishedCount}
          icon={CheckCircle2}
          color="emerald"
          index={1}
        />
        <InstructorStatCard
          label="Drafts"
          value={summary.draftCount}
          icon={Edit3}
          color="amber"
          index={2}
        />
        <InstructorStatCard
          label="Pending Grading"
          value={pendingGradingCount}
          icon={AlertCircle}
          color={pendingGradingCount > 0 ? 'rose' : 'teal'}
          index={3}
        />
      </InstructorStatCardGrid>

      {/* ==================== Tab Filters ==================== */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.1 }}
        className="overflow-x-auto scrollbar-thin -mx-3 px-3 sm:mx-0 sm:px-0"
      >
        <div className="flex items-center gap-2 flex-nowrap">
        {(
          [
            {
              value: 'all' as TabFilter,
              label: 'All',
              count: tabCounts.all,
              activeColor:
                'bg-primary text-primary-foreground border-primary',
              badgeColor:
                'bg-primary-foreground/20 text-primary-foreground',
            },
            {
              value: 'published' as TabFilter,
              label: 'Published',
              count: tabCounts.published,
              activeColor:
                'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
              badgeColor:
                'bg-emerald-200 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300',
            },
            {
              value: 'drafts' as TabFilter,
              label: 'Drafts',
              count: tabCounts.drafts,
              activeColor:
                'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
              badgeColor:
                'bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300',
            },
            {
              value: 'pending-grading' as TabFilter,
              label: 'Pending Grading',
              count: tabCounts['pending-grading'],
              activeColor:
                'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
              badgeColor:
                'bg-red-200 dark:bg-red-900/60 text-red-800 dark:text-red-300',
            },
          ] as const
        ).map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'rounded-xl px-4 py-2 text-[13px] font-medium transition-all border whitespace-nowrap',
              activeTab === tab.value
                ? tab.activeColor + ' shadow-sm'
                : 'bg-card border-border text-card-foreground hover:border-primary/30'
            )}
          >
            {tab.label}
            <span
              className={cn(
                'ml-1.5 inline-flex items-center justify-center size-5 rounded-full text-[11px] font-bold',
                activeTab === tab.value
                  ? tab.badgeColor
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
        </div>
      </motion.div>

      {/* ==================== Filter Bar ==================== */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.15 }}
        className="space-y-3"
      >
        {/* Mobile: Search bar full-width */}
        <div className="relative md:hidden">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 rounded-xl text-[13px] pl-9 pr-8 w-full"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Mobile: Filter button + Sheet */}
        <div className="flex items-center gap-2 md:hidden">
          <MobileFilterSheet
            activeCount={(courseFilter !== 'all' ? 1 : 0) + (typeFilter !== 'all' ? 1 : 0)}
            onClearAll={clearFilters}
          >
            <MobileFilterGroup label="Course">
              <Select
                value={courseFilter}
                onValueChange={setCourseFilter}
              >
                <SelectTrigger className="w-full h-10 text-[13px] rounded-lg">
                  <BookOpen className="size-3.5 mr-1.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </MobileFilterGroup>
            <MobileFilterGroup label="Type">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full h-10 text-[13px] rounded-lg">
                  <Filter className="size-3.5 mr-1.5 text-muted-foreground shrink-0" />
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {(
                    Object.entries(typeConfig) as [
                      AssignmentType,
                      (typeof typeConfig)[AssignmentType],
                    ][]
                  ).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </MobileFilterGroup>
            <MobileFilterGroup label="Sort By">
              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as SortOption)}
              >
                <SelectTrigger className="w-full h-10 text-[13px] rounded-lg">
                  <ArrowUpDown className="size-3.5 mr-1.5 text-muted-foreground shrink-0" />
                  <SelectValue />
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

          {/* Clear Filters - mobile */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg text-[12px] gap-1 text-muted-foreground"
              onClick={clearFilters}
            >
              <X className="size-3" />
              Clear
            </Button>
          )}
        </div>

        {/* Desktop: Single row with all filters */}
        <div className="hidden md:flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 rounded-xl text-[13px] pl-9 pr-8 bg-card shadow-sm border-0 w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Course Filter */}
          <Select
            value={courseFilter}
            onValueChange={setCourseFilter}
          >
            <SelectTrigger className="h-9 w-[160px] rounded-xl text-[13px] bg-card shadow-sm border-0">
              <BookOpen className="size-3.5 mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 w-[150px] rounded-xl text-[13px] bg-card shadow-sm border-0">
              <Filter className="size-3.5 mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {(
                Object.entries(typeConfig) as [
                  AssignmentType,
                  (typeof typeConfig)[AssignmentType],
                ][]
              ).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as SortOption)}
          >
            <SelectTrigger className="h-9 w-[150px] rounded-xl text-[13px] bg-card shadow-sm border-0">
              <ArrowUpDown className="size-3.5 mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex items-center rounded-xl bg-card shadow-sm border-0 p-0.5 gap-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'flex items-center justify-center size-8 rounded-lg transition-colors',
                viewMode === 'grid'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
              title="Grid"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center justify-center size-8 rounded-lg transition-colors',
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
              title="List"
            >
              <List className="size-4" />
            </button>
          </div>

          {/* Clear Filters - desktop */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg text-[12px] gap-1 text-muted-foreground"
              onClick={clearFilters}
            >
              <X className="size-3" />
              Clear
            </Button>
          )}
        </div>
      </motion.div>

      {/* ==================== Content Area ==================== */}
      <div>
        {loading ? (
          // Loading Skeletons
          <div
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-3'
            )}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-2xl border bg-card animate-pulse',
                  viewMode === 'grid' ? 'p-4' : 'p-3 sm:p-4'
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Skeleton className="h-6 w-20 rounded-lg" />
                  <Skeleton className="h-6 w-16 rounded-lg" />
                </div>
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-3 w-1/3 mb-3" />
                <Skeleton className="h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          // Error State
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 rounded-2xl border-2 border-dashed border-red-200 dark:border-red-900"
          >
            <AlertCircle className="mx-auto size-12 text-red-400/50" />
            <h3 className="mt-4 text-[16px] font-semibold text-red-600 dark:text-red-400">
              Failed to load assignments
            </h3>
            <p className="mt-1 text-[13px] text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              className="mt-4 rounded-xl"
              onClick={fetchData}
            >
              <Loader2 className="mr-2 size-4" />
              Try Again
            </Button>
          </motion.div>
        ) : assignments.length === 0 ? (
          // No Assignments At All
          <EmptyState
            type="no-assignments"
            onAction={() => setCreateDialogOpen(true)}
            actionLabel="Create Assignment"
          />
        ) : filteredAssignments.length === 0 ? (
          // No Results For Filters
          <EmptyState
            type="no-matching"
            onAction={clearFilters}
            actionLabel="Clear Filters"
          />
        ) : (
          // Assignment Cards / Rows
          <AnimatePresence mode="popLayout">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAssignments.map((assignment, index) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    index={index}
                    onViewDetails={handleViewDetails}
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                    onDelete={setDeleteTarget}
                    onTogglePublish={handleTogglePublish}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAssignments.map((assignment, index) => (
                  <AssignmentRow
                    key={assignment.id}
                    assignment={assignment}
                    index={index}
                    onViewDetails={handleViewDetails}
                    onEdit={handleEdit}
                    onDuplicate={handleDuplicate}
                    onDelete={setDeleteTarget}
                    onTogglePublish={handleTogglePublish}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* ==================== Create Assignment Dialog ==================== */}
      <CreateAssignmentDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreated={fetchData}
        instructorId={currentUser?.id || ''}
      />

      {/* ==================== Delete Confirmation ==================== */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[18px]">
              Delete Assignment
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[14px]">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">
                {deleteTarget?.title}
              </span>
              ? This action cannot be undone. All submissions and grading data
              for this assignment will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-xl"
              disabled={deleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
