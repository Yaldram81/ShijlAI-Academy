'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, MoreVertical, Star, Users, Clock, BookOpen,
  Eye, EyeOff, Trash2, Edit3, BarChart3,
  TrendingUp, DollarSign, GraduationCap, Sparkles,
  ChevronDown, ChevronUp, Copy, Loader2, CheckCircle2,
  X, ArrowRight, ArrowUpDown, LayoutGrid, List, Rocket, PenTool, Layers, Share,
  AlertCircle, Settings, Archive, ArchiveRestore, Hash,
  Columns3, Download, GripVertical,
  Calendar, RefreshCw, Image, MessageSquare,
} from 'lucide-react'
import { MobileFilterSheet, MobileFilterGroup } from '@/components/mobile-filter-sheet'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { CATEGORIES } from '@/components/creator/constants'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { toast } from 'sonner'
import type { CourseLevel } from '@/lib/types'
import { InstructorStatCard, InstructorStatCardGrid } from '@/components/instructor/instructor-stat-card'

// ============================================================
// Types
// ============================================================
interface InstructorModule {
  id: string
  title: string
  description: string | null
  order: number
  lessonCount: number
  totalDuration: number
}

interface CourseAnalytics {
  totalEnrollments: number
  recentEnrollments: number
  avgProgress: number
  completionRate: number
  totalLessons: number
  totalDuration: number
  totalRevenue: number
}

interface InstructorCourse {
  id: string
  title: string
  description: string
  category: string
  level: string
  language: string
  thumbnail: string | null
  price: number
  isPublished: boolean
  isArchived: boolean
  enrollmentCount: number
  rating: number
  reviewStatus: string
  reviewNote: string | null
  createdAt: string
  updatedAt: string
  modules: InstructorModule[]
  quizzes: Array<{ id: string; title: string; type: string }>
  analytics: CourseAnalytics
}

interface InstructorSummary {
  totalCourses: number
  publishedCourses: number
  draftCourses: number
  archivedCourses: number
  totalStudents: number
  totalRevenue: number
  avgRating: string
  avgCompletionRate: number
}

type StatusFilter = 'all' | 'published' | 'draft' | 'under-review' | 'archived'
type SortOption = 'updatedAt-desc' | 'updatedAt-asc' | 'title-asc' | 'title-desc' | 'students-desc' | 'revenue-desc' | 'rating-desc' | 'createdAt-desc' | 'createdAt-asc'
type ViewMode = 'grid' | 'list' | 'kanban'

// ============================================================
// Constants
// ============================================================
const levels: Array<{ value: CourseLevel; label: string }> = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const categoryGradients: Record<string, string> = {
  IB: 'from-emerald-500 to-teal-600',
  'O-Levels': 'from-emerald-400 to-teal-500',
  'A-Levels': 'from-teal-400 to-emerald-500',
  IELTS: 'from-emerald-600 to-teal-700',
  AWS: 'from-teal-600 to-emerald-700',
  Technology: 'from-blue-500 to-indigo-600',
  Programming: 'from-teal-500 to-emerald-600',
  'Web Dev': 'from-emerald-500 to-green-600',
  'Data Science': 'from-teal-500 to-cyan-600',
  Business: 'from-amber-500 to-orange-600',
  Science: 'from-purple-500 to-violet-600',
  Mathematics: 'from-rose-500 to-pink-600',
  Languages: 'from-sky-500 to-blue-600',
  'Arts & Design': 'from-fuchsia-500 to-purple-600',
  Health: 'from-red-500 to-rose-600',
  'Social Sciences': 'from-orange-500 to-amber-600',
  Engineering: 'from-slate-500 to-gray-600',
  Other: 'from-emerald-500 to-teal-600',
}

const levelColors: Record<string, string> = {
  beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
}

const statusConfig: Record<string, { label: string; color: string; dotColor: string }> = {
  published: { label: 'Published', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400', dotColor: 'bg-emerald-500' },
  draft: { label: 'Draft', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400', dotColor: 'bg-amber-500' },
  pending: { label: 'Pending Review', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400', dotColor: 'bg-blue-500' },
  'under-review': { label: 'Under Review', color: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400', dotColor: 'bg-sky-500' },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', dotColor: 'bg-gray-400' },
}

const reviewStatusConfig: Record<string, { label: string; color: string; icon: typeof AlertCircle }> = {
  draft: { label: 'Draft', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400', icon: PenTool },
  pending: { label: 'Pending Review', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400', icon: Clock },
  under_review: { label: 'Under Review', color: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400', icon: Clock },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400', icon: AlertCircle },
  changes_requested: { label: 'Changes Requested', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400', icon: MessageSquare },
  flagged: { label: 'Flagged', color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400', icon: AlertCircle },
}

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'updatedAt-desc', label: 'Last Updated' },
  { value: 'updatedAt-asc', label: 'Oldest Updated' },
  { value: 'title-asc', label: 'Title A-Z' },
  { value: 'title-desc', label: 'Title Z-A' },
  { value: 'students-desc', label: 'Students (High-Low)' },
  { value: 'revenue-desc', label: 'Revenue' },
  { value: 'rating-desc', label: 'Rating' },
  { value: 'createdAt-desc', label: 'Newest' },
  { value: 'createdAt-asc', label: 'Oldest' },
]

const spring = { type: 'spring' as const, stiffness: 400, damping: 25 }

// ============================================================
// Helpers
// ============================================================
function computeReadinessScore(course: InstructorCourse): number {
  let score = 0
  if (course.modules.length > 0) score += 25
  const totalLessons = course.modules.reduce((a, m) => a + m.lessonCount, 0)
  if (totalLessons > 0) score += 25
  if (course.description && course.description.trim().length > 10) score += 25
  if (course.thumbnail) score += 25
  return score
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatRelativeDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// ============================================================
// Course Creation Wizard
// ============================================================
function CourseCreationWizard({
  onClose,
  onCreated,
  instructorId,
}: {
  onClose: () => void
  onCreated: (course: InstructorCourse) => void
  instructorId: string
}) {
  const [step, setStep] = useState(0)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'IB',
    level: 'beginner' as CourseLevel,
    language: 'en',
    price: 0,
    thumbnail: '',
  })

  const steps = [
    { title: 'Basic Info', icon: PenTool, desc: 'Title & description' },
    { title: 'Category & Level', icon: Layers, desc: 'Target audience' },
    { title: 'Pricing', icon: DollarSign, desc: 'Set your price' },
    { title: 'Review', icon: CheckCircle2, desc: 'Confirm details' },
  ]

  const canProceed = () => {
    switch (step) {
      case 0: return form.title.trim().length >= 3 && form.description.trim().length >= 10
      case 1: return !!form.category && !!form.level
      case 2: return form.price >= 0
      case 3: return true
      default: return false
    }
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/instructor/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId,
          ...form,
          thumbnail: form.thumbnail || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create course')
      }
      const data = await res.json()
      toast.success('Course created! Start adding modules and lessons.')
      onCreated(data.course)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create course')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="rounded-3xl p-0 overflow-hidden max-w-2xl max-h-[90vh]">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
          <DialogTitle className="text-[22px] font-bold text-white">Create New Course</DialogTitle>
          <DialogDescription className="text-emerald-100 text-[14px] mt-1">
            Follow the steps to set up your course
          </DialogDescription>
          <div className="flex items-center gap-2 mt-5">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => i < step && setStep(i)}
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full text-[13px] font-bold transition-all shrink-0',
                    i < step ? 'bg-white text-emerald-600' :
                    i === step ? 'bg-white/30 text-white ring-2 ring-white' :
                    'bg-white/10 text-white/50'
                  )}
                >
                  {i < step ? <CheckCircle2 className="size-4" /> : i + 1}
                </button>
                <div className="min-w-0 hidden sm:block">
                  <p className={cn('text-[12px] font-semibold truncate', i === step ? 'text-white' : 'text-white/60')}>
                    {s.title}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div className={cn('flex-1 h-0.5 rounded-full', i < step ? 'bg-white' : 'bg-white/20')} />
                )}
              </div>
            ))}
          </div>
        </div>

        <ScrollArea className="max-h-[60vh] p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {step === 0 && (
                <>
                  <div className="space-y-2">
                    <Label className="text-[14px] font-semibold">Course Title *</Label>
                    <Input
                      placeholder="e.g. IB Mathematics - Part 1"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="h-12 rounded-xl text-[15px]"
                      maxLength={100}
                    />
                    <p className="text-[12px] text-muted-foreground">
                      {form.title.length}/100 characters
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[14px] font-semibold">Course Description *</Label>
                    <Textarea
                      placeholder="Describe what students will learn..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="rounded-xl text-[15px] min-h-[120px] resize-y"
                      maxLength={2000}
                    />
                    <p className="text-[12px] text-muted-foreground">
                      {form.description.length}/2000 characters
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[14px] font-semibold">Thumbnail URL</Label>
                    <Input
                      placeholder="https://example.com/thumbnail.jpg"
                      value={form.thumbnail}
                      onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                      className="h-11 rounded-xl text-[14px]"
                    />
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <div className="space-y-3">
                    <Label className="text-[14px] font-semibold">Category *</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setForm({ ...form, category: cat })}
                          className={cn(
                            'rounded-xl px-4 py-3 text-[13px] font-medium transition-all border',
                            form.category === cat
                              ? 'bg-primary text-primary-foreground border-primary ios-shadow-sm'
                              : 'bg-card border-border hover:border-primary/50 text-card-foreground'
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[14px] font-semibold">Level *</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {levels.map((lvl) => (
                        <button
                          key={lvl.value}
                          onClick={() => setForm({ ...form, level: lvl.value })}
                          className={cn(
                            'rounded-xl px-4 py-3 text-[13px] font-medium transition-all border',
                            form.level === lvl.value
                              ? 'bg-primary text-primary-foreground border-primary ios-shadow-sm'
                              : 'bg-card border-border hover:border-primary/50 text-card-foreground'
                          )}
                        >
                          {lvl.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[14px] font-semibold">Language</Label>
                    <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ur">Urdu</SelectItem>
                        <SelectItem value="ar">Arabic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-5 text-emerald-600" />
                      <h3 className="text-[15px] font-bold text-emerald-700 dark:text-emerald-400">Pricing Strategy</h3>
                    </div>
                    <p className="text-[13px] text-muted-foreground">
                      Free courses get 5x more enrollments. Consider a free tier to build your audience.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[14px] font-semibold">Price (USD)</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-semibold text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min={0}
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="h-12 rounded-xl pl-10 text-[17px] font-semibold"
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      {[0, 499, 999, 1499, 2499].map((p) => (
                        <button
                          key={p}
                          onClick={() => setForm({ ...form, price: p })}
                          className={cn(
                            'rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all border',
                            form.price === p
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card border-border hover:border-primary/50'
                          )}
                        >
                          {p === 0 ? 'Free' : `$${p}`}
                        </button>
                      ))}
                    </div>
                  </div>
                  {form.price > 0 && (
                    <div className="rounded-2xl border border-border p-4 space-y-2">
                      <div className="flex justify-between text-[13px]">
                        <span className="text-muted-foreground">Course Price</span>
                        <span className="font-medium">${form.price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span className="text-muted-foreground">Platform Fee (30%)</span>
                        <span className="font-medium text-red-500">-${Math.round(form.price * 0.3).toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-[14px] font-semibold">
                        <span>You Earn</span>
                        <span className="text-emerald-600">${Math.round(form.price * 0.7).toLocaleString()}/student</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {step === 3 && (
                <>
                  <div className="rounded-2xl ios-shadow-sm bg-card p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('flex size-12 items-center justify-center rounded-xl bg-gradient-to-br text-white', categoryGradients[form.category] || 'from-emerald-500 to-teal-600')}>
                        <GraduationCap className="size-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[17px] font-bold truncate">{form.title || 'Untitled Course'}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[11px] capitalize rounded-lg">{form.level}</Badge>
                          <Badge variant="outline" className="text-[11px] rounded-lg">{form.category}</Badge>
                          <Badge variant="outline" className="text-[11px] rounded-lg">
                            {form.price === 0 ? 'Free' : `$${form.price.toLocaleString()}`}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <p className="text-[13px] text-muted-foreground line-clamp-3">
                      {form.description || 'No description provided'}
                    </p>
                    <Separator />
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 rounded-xl bg-accent/30">
                        <p className="text-[11px] text-muted-foreground">Modules</p>
                        <p className="text-[17px] font-bold">0</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-accent/30">
                        <p className="text-[11px] text-muted-foreground">Lessons</p>
                        <p className="text-[17px] font-bold">0</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-accent/30">
                        <p className="text-[11px] text-muted-foreground">Duration</p>
                        <p className="text-[17px] font-bold">0h</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 p-4 flex items-start gap-3">
                    <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-[13px]">
                      <p className="font-semibold text-amber-700 dark:text-amber-400">Course will be created as Draft</p>
                      <p className="text-muted-foreground mt-0.5">Add modules and lessons, then publish when ready.</p>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>

        <div className="p-6 pt-4 flex items-center justify-between border-t">
          <Button
            variant="outline"
            className="rounded-xl ios-press"
            onClick={step === 0 ? onClose : () => setStep(step - 1)}
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          <div className="flex items-center gap-3">
            {step < 3 ? (
              <Button
                className="rounded-xl bg-primary text-primary-foreground ios-press"
                disabled={!canProceed()}
                onClick={() => setStep(step + 1)}
              >
                Continue
                <ArrowRight className="ml-2 size-4" />
              </Button>
            ) : (
              <Button
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white ios-press"
                disabled={creating}
                onClick={handleCreate}
              >
                {creating ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Rocket className="mr-2 size-4" />
                )}
                Create Course
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Course Editor Dialog (Modules & Lessons)
// ============================================================
function CourseEditorDialog({
  course,
  onClose,
  onUpdated,
}: {
  course: InstructorCourse
  onClose: () => void
  onUpdated: () => void
}) {
  const [modules, setModules] = useState(course.modules)
  const [loading, setLoading] = useState(false)
  const [addingModule, setAddingModule] = useState(false)
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [addingLesson, setAddingLesson] = useState<string | null>(null)
  const [newLesson, setNewLesson] = useState({ title: '', type: 'text' as const, duration: 15 })

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return
    setAddingModule(true)
    try {
      const res = await fetch(`/api/instructor/courses/${course.id}/modules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newModuleTitle }),
      })
      if (!res.ok) throw new Error('Failed to add module')
      const data = await res.json()
      setModules([...modules, { ...data.module, lessonCount: 0, totalDuration: 0 }])
      setNewModuleTitle('')
      toast.success('Module added!')
      onUpdated()
    } catch {
      toast.error('Failed to add module')
    } finally {
      setAddingModule(false)
    }
  }

  const handleAddLesson = async (moduleId: string) => {
    if (!newLesson.title.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/instructor/modules/${moduleId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newLesson.title,
          type: newLesson.type,
          duration: newLesson.duration,
          content: '# New Lesson\n\nStart writing your lesson content here...',
        }),
      })
      if (!res.ok) throw new Error('Failed to add lesson')
      toast.success('Lesson added!')
      setAddingLesson(null)
      setNewLesson({ title: '', type: 'text', duration: 15 })
      onUpdated()
    } catch {
      toast.error('Failed to add lesson')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="rounded-3xl p-0 overflow-hidden max-w-3xl max-h-[90vh]">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
          <DialogTitle className="text-[20px] font-bold text-white">Course Content Editor</DialogTitle>
          <DialogDescription className="text-emerald-100 text-[13px] mt-1">
            {course.title} - {modules.length} modules
          </DialogDescription>
        </div>

        <ScrollArea className="max-h-[60vh] p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="New module title..."
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                className="h-11 rounded-xl flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAddModule()}
              />
              <Button
                onClick={handleAddModule}
                disabled={addingModule || !newModuleTitle.trim()}
                className="rounded-xl bg-primary ios-press h-11"
              >
                {addingModule ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                <span className="ml-1.5">Add Module</span>
              </Button>
            </div>

            {modules.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border-2 border-dashed border-border">
                <Layers className="mx-auto size-10 text-muted-foreground/40" />
                <p className="mt-3 text-[15px] font-medium text-muted-foreground">No modules yet</p>
                <p className="text-[13px] text-muted-foreground/70">Add your first module above to start building course content</p>
              </div>
            ) : (
              <Accordion type="multiple" defaultValue={modules.map((m) => m.id)} className="space-y-2">
                {modules.map((mod, idx) => (
                  <AccordionItem
                    key={mod.id}
                    value={mod.id}
                    className="rounded-2xl ios-shadow-sm bg-card border-0 overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 flex-1 text-left">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-[13px] shrink-0">
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-semibold truncate">{mod.title}</p>
                          <p className="text-[12px] text-muted-foreground">
                            {mod.lessonCount} lesson{mod.lessonCount !== 1 ? 's' : ''} - {mod.totalDuration} min
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-2">
                        {addingLesson === mod.id ? (
                          <div className="rounded-xl bg-accent/30 p-3 space-y-2">
                            <Input
                              placeholder="Lesson title..."
                              value={newLesson.title}
                              onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                              className="h-9 rounded-lg text-[13px]"
                              onKeyDown={(e) => e.key === 'Enter' && handleAddLesson(mod.id)}
                            />
                            <div className="flex items-center gap-2">
                              <Select value={newLesson.type} onValueChange={(v) => setNewLesson({ ...newLesson, type: v as 'video' | 'text' | 'interactive' | 'quiz' })}>
                                <SelectTrigger className="h-8 rounded-lg text-[12px] w-[130px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Text</SelectItem>
                                  <SelectItem value="video">Video</SelectItem>
                                  <SelectItem value="interactive">Interactive</SelectItem>
                                  <SelectItem value="quiz">Quiz</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                type="number"
                                placeholder="Min"
                                value={newLesson.duration}
                                onChange={(e) => setNewLesson({ ...newLesson, duration: parseInt(e.target.value) || 0 })}
                                className="h-8 rounded-lg text-[12px] w-[80px]"
                              />
                              <Button size="sm" className="rounded-lg ios-press h-8 text-[12px]" onClick={() => handleAddLesson(mod.id)} disabled={loading}>
                                {loading ? <Loader2 className="size-3 animate-spin" /> : 'Add'}
                              </Button>
                              <Button size="sm" variant="ghost" className="rounded-lg h-8 text-[12px]" onClick={() => { setAddingLesson(null); setNewLesson({ title: '', type: 'text', duration: 15 }) }}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddingLesson(mod.id)}
                            className="flex items-center gap-2 w-full rounded-xl border-2 border-dashed border-border px-4 py-2.5 text-[13px] text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors ios-press"
                          >
                            <Plus className="size-4" />
                            Add Lesson
                          </button>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
        </ScrollArea>

        <div className="p-6 pt-4 border-t flex justify-between items-center">
          <p className="text-[12px] text-muted-foreground">
            {modules.reduce((acc, m) => acc + m.lessonCount, 0)} lessons across {modules.length} modules
          </p>
          <Button className="rounded-xl ios-press" onClick={onClose}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Analytics Dialog Component
// ============================================================
function AnalyticsDialog({
  course,
  onClose,
}: {
  course: InstructorCourse
  onClose: () => void
}) {
  const a = course.analytics
  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="rounded-3xl p-0 overflow-hidden max-w-lg">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
          <DialogTitle className="text-[20px] font-bold text-white">Course Analytics</DialogTitle>
          <DialogDescription className="text-emerald-100 text-[13px] mt-1 truncate">
            {course.title}
          </DialogDescription>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3">
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Avg. Progress</p>
              <p className="text-[20px] font-bold text-emerald-700 dark:text-emerald-300">{a.avgProgress}%</p>
              <Progress value={a.avgProgress} className="h-1.5 mt-1.5" />
            </div>
            <div className="rounded-xl bg-teal-50 dark:bg-teal-950/30 p-3">
              <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">Completion Rate</p>
              <p className="text-[20px] font-bold text-teal-700 dark:text-teal-300">{a.completionRate}%</p>
              <Progress value={a.completionRate} className="h-1.5 mt-1.5" />
            </div>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3">
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">This Week</p>
              <p className="text-[20px] font-bold text-amber-700 dark:text-amber-300">+{a.recentEnrollments}</p>
              <p className="text-[11px] text-muted-foreground">new students</p>
            </div>
            <div className="rounded-xl bg-primary/5 dark:bg-primary/10 p-3">
              <p className="text-[11px] text-primary font-medium">Revenue</p>
              <p className="text-[20px] font-bold text-primary">${a.totalRevenue.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">lifetime</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-accent/30 p-3 text-center">
              <p className="text-[11px] text-muted-foreground">Total Students</p>
              <p className="text-[17px] font-bold">{a.totalEnrollments}</p>
            </div>
            <div className="rounded-xl bg-accent/30 p-3 text-center">
              <p className="text-[11px] text-muted-foreground">Lessons</p>
              <p className="text-[17px] font-bold">{a.totalLessons}</p>
            </div>
            <div className="rounded-xl bg-accent/30 p-3 text-center">
              <p className="text-[11px] text-muted-foreground">Duration</p>
              <p className="text-[17px] font-bold">{Math.round(a.totalDuration / 60)}h</p>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6">
          <Button className="w-full rounded-xl ios-press" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Delete Confirmation Dialog
// ============================================================
function DeleteConfirmDialog({
  course,
  deleting,
  onConfirm,
  onCancel,
}: {
  course: InstructorCourse
  deleting: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Dialog open onOpenChange={() => onCancel()}>
      <DialogContent className="rounded-3xl max-w-md">
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: [0, -8, 8, -4, 4, 0] }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/40">
                <Trash2 className="size-6 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle className="text-[20px]">Delete Course?</DialogTitle>
            </div>
            <DialogDescription className="text-[14px]">
              Are you sure you want to delete <strong className="text-foreground">{course.title}</strong>?
              {course.enrollmentCount > 0 && (
                <span className="block mt-2 text-red-600 dark:text-red-400 font-medium">
                  This course has {course.enrollmentCount} enrolled student{course.enrollmentCount !== 1 ? 's' : ''}.
                  You cannot delete courses with active enrollments - unpublish instead.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
        </motion.div>
        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" className="rounded-xl ios-press" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="rounded-xl ios-press"
            disabled={deleting || course.enrollmentCount > 0}
            onClick={onConfirm}
          >
            {deleting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />}
            Delete Course
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Course Edit Info Dialog (NEW)
// ============================================================
function CourseEditInfoDialog({
  course,
  onClose,
  onUpdated,
}: {
  course: InstructorCourse
  onClose: () => void
  onUpdated: () => void
}) {
  const [form, setForm] = useState({
    title: course.title,
    description: course.description,
    category: course.category,
    level: course.level,
    price: course.price,
    thumbnail: course.thumbnail || '',
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/instructor/courses/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          category: form.category,
          level: form.level,
          price: form.price,
          thumbnail: form.thumbnail || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update course')
      }
      toast.success('Course updated successfully!')
      onUpdated()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update course')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="rounded-3xl p-0 overflow-hidden max-w-lg max-h-[90vh]">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
          <DialogTitle className="text-[20px] font-bold text-white">Edit Course Info</DialogTitle>
          <DialogDescription className="text-emerald-100 text-[13px] mt-1">
            Update basic course details
          </DialogDescription>
        </div>
        <ScrollArea className="max-h-[60vh] p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[14px] font-semibold">Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="h-11 rounded-xl"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[14px] font-semibold">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="rounded-xl min-h-[100px] resize-y"
                maxLength={2000}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[14px] font-semibold">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[14px] font-semibold">Level</Label>
                <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v })}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.map((lvl) => (
                      <SelectItem key={lvl.value} value={lvl.value}>{lvl.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[14px] font-semibold">Price (USD)</Label>
              <Input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Math.max(0, parseInt(e.target.value) || 0) })}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[14px] font-semibold">Thumbnail URL</Label>
              <Input
                value={form.thumbnail}
                onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="h-11 rounded-xl"
              />
            </div>
          </div>
        </ScrollArea>
        <div className="p-6 pt-4 border-t flex justify-end gap-3">
          <Button variant="outline" className="rounded-xl ios-press" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white ios-press"
            disabled={saving || !form.title.trim()}
            onClick={handleSave}
          >
            {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Bulk Action Bar
// ============================================================
function BulkActionBar({
  selectedCount,
  onPublish,
  onUnpublish,
  onArchive,
  onUnarchive,
  onDelete,
  onClear,
  processing,
}: {
  selectedCount: number
  onPublish: () => void
  onUnpublish: () => void
  onArchive: () => void
  onUnarchive: () => void
  onDelete: () => void
  onClear: () => void
  processing: boolean
}) {
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl ios-shadow-lg bg-card border border-border px-5 py-3 flex items-center gap-2 flex-wrap justify-center"
    >
      <span className="text-[14px] font-semibold whitespace-nowrap">{selectedCount} selected</span>
      <Separator orientation="vertical" className="h-6" />
      <Button size="sm" variant="ghost" className="rounded-lg text-[13px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 h-8" onClick={onPublish} disabled={processing}>
        <Eye className="mr-1.5 size-3.5" />Publish
      </Button>
      <Button size="sm" variant="ghost" className="rounded-lg text-[13px] text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 h-8" onClick={onUnpublish} disabled={processing}>
        <EyeOff className="mr-1.5 size-3.5" />Unpublish
      </Button>
      <Button size="sm" variant="ghost" className="rounded-lg text-[13px] text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 h-8" onClick={onArchive} disabled={processing}>
        <Archive className="mr-1.5 size-3.5" />Archive
      </Button>
      <Button size="sm" variant="ghost" className="rounded-lg text-[13px] text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30 h-8" onClick={onUnarchive} disabled={processing}>
        <ArchiveRestore className="mr-1.5 size-3.5" />Unarchive
      </Button>
      <Button size="sm" variant="ghost" className="rounded-lg text-[13px] text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 h-8" onClick={onDelete} disabled={processing}>
        <Trash2 className="mr-1.5 size-3.5" />Delete
      </Button>
      <Separator orientation="vertical" className="h-6" />
      <Button size="sm" variant="ghost" className="rounded-lg h-8" onClick={onClear} disabled={processing}>
        <X className="size-4" />
      </Button>
    </motion.div>
  )
}

// ============================================================
// Empty State Component
// ============================================================
function EmptyState({
  type,
  onAction,
}: {
  type: 'no-courses' | 'no-matching' | 'no-archived'
  onAction?: () => void
}) {
  const config = {
    'no-courses': {
      icon: GraduationCap,
      title: 'Create Your First Course',
      description: 'Share your knowledge with students. Start building your course today!',
      actionLabel: 'Create Course',
      gradient: 'from-emerald-500 to-teal-600',
    },
    'no-matching': {
      icon: Search,
      title: 'No courses match your filters',
      description: 'Try adjusting your search or filter criteria.',
      actionLabel: 'Clear Filters',
      gradient: 'from-amber-500 to-orange-600',
    },
    'no-archived': {
      icon: Archive,
      title: 'No archived courses',
      description: 'Archived courses will appear here.',
      actionLabel: undefined,
      gradient: 'from-gray-500 to-gray-600',
    },
  }

  const c = config[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6"
    >
      <div className={cn('flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br text-white mb-6', c.gradient)}>
        <c.icon className="size-10" />
      </div>
      <h3 className="text-[20px] font-bold text-foreground mb-2">{c.title}</h3>
      <p className="text-[14px] text-muted-foreground text-center max-w-md mb-6">{c.description}</p>
      {c.actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white ios-press"
        >
          <Plus className="mr-2 size-4" />
          {c.actionLabel}
        </Button>
      )}
    </motion.div>
  )
}

// ============================================================
// Readiness Score Indicator
// ============================================================
function ReadinessIndicator({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 75) return 'text-emerald-600 dark:text-emerald-400'
    if (score >= 50) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }
  const getBarColor = () => {
    if (score >= 75) return '[&>div]:bg-emerald-500'
    if (score >= 50) return '[&>div]:bg-amber-500'
    return '[&>div]:bg-red-500'
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground">Readiness</span>
        <span className={cn('text-[12px] font-bold', getColor())}>{score}%</span>
      </div>
      <Progress value={score} className={cn('h-1.5 rounded-full', getBarColor())} />
    </div>
  )
}

// ============================================================
// Review Status Badge
// ============================================================
function ReviewStatusBadge({ status, note }: { status: string; note?: string | null }) {
  const config = reviewStatusConfig[status] || reviewStatusConfig.draft
  const Icon = config.icon

  return (
    <div className="flex items-center gap-1.5">
      <Badge className={cn('text-[10px] font-medium rounded-full gap-1', config.color)}>
        <Icon className="size-3" />
        {config.label}
      </Badge>
      {note && (
        <span className="text-[10px] text-muted-foreground truncate max-w-[120px]" title={note}>
          ({note})
        </span>
      )}
    </div>
  )
}

// ============================================================
// Main Instructor Courses View
// ============================================================
export function InstructorCoursesView() {
  const { currentUser, setCurrentView, setEditingCourseId, setCreatorStep, setSelectedCourseId } = useAppStore()
  const [courses, setCourses] = useState<InstructorCourse[]>([])
  const [summary, setSummary] = useState<InstructorSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortOption, setSortOption] = useState<SortOption>('updatedAt-desc')
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  const [showCreateWizard, setShowCreateWizard] = useState(false)
  const [editingCourse, setEditingCourse] = useState<InstructorCourse | null>(null)
  const [editInfoCourse, setEditInfoCourse] = useState<InstructorCourse | null>(null)
  const [analyticsCourse, setAnalyticsCourse] = useState<InstructorCourse | null>(null)
  const [publishing, setPublishing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState<InstructorCourse | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)

  const fetchCourses = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        instructorId: currentUser.id,
        status: statusFilter,
        sort: sortOption,
      })
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      const res = await fetch(`/api/instructor/courses?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch courses')
      const data = await res.json()
      setCourses(data.courses || [])
      setSummary(data.summary || null)
    } catch {
      toast.error('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }, [currentUser, statusFilter, searchQuery, sortOption])

  useEffect(() => {
    const timer = setTimeout(fetchCourses, searchQuery ? 300 : 0)
    return () => clearTimeout(timer)
  }, [fetchCourses, searchQuery])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [statusFilter, searchQuery])

  // Compute course status with review status support
  const getCourseStatus = (course: InstructorCourse): 'published' | 'draft' | 'pending' | 'under-review' | 'archived' => {
    if (course.isArchived) return 'archived'
    if (course.isPublished) return 'published'
    if (course.reviewStatus === 'pending') return 'pending'
    if (course.reviewStatus === 'under_review') return 'under-review'
    if (course.reviewStatus === 'changes_requested') return 'draft'
    if (course.reviewStatus === 'rejected') return 'draft'
    const totalLessons = course.modules.reduce((acc, m) => acc + m.lessonCount, 0)
    if (totalLessons > 0) return 'under-review'
    return 'draft'
  }

  // Compute draft completion percentage
  const getDraftCompletion = (course: InstructorCourse): number => {
    if (course.modules.length === 0) return 0
    const modulesWithLessons = course.modules.filter(m => m.lessonCount > 0).length
    return Math.round((modulesWithLessons / course.modules.length) * 100)
  }

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      if (statusFilter !== 'all' && getCourseStatus(course) !== statusFilter) return false
      return true
    })
  }, [courses, statusFilter])

  // Compute tab counts from the full courses array
  const tabCounts = useMemo(() => ({
    all: courses.length,
    published: courses.filter(c => getCourseStatus(c) === 'published').length,
    draft: courses.filter(c => getCourseStatus(c) === 'draft').length,
    'under-review': courses.filter(c => getCourseStatus(c) === 'under-review').length,
    archived: courses.filter(c => getCourseStatus(c) === 'archived').length,
  }), [courses])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (statusFilter !== 'all') count++
    if (searchQuery.trim()) count++
    return count
  }, [statusFilter, searchQuery])

  const selectedCount = selectedIds.size

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCourses.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredCourses.map(c => c.id)))
    }
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handlePublishToggle = async (course: InstructorCourse) => {
    setPublishing(course.id)
    try {
      const res = await fetch(`/api/instructor/courses/${course.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorId: currentUser.id, isPublished: !course.isPublished, reviewStatus: !course.isPublished ? 'approved' : 'draft' }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update')
      }
      toast.success(course.isPublished ? 'Course unpublished' : 'Course published!')
      fetchCourses()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setPublishing(null)
    }
  }

  const handleArchiveToggle = async (course: InstructorCourse) => {
    setPublishing(course.id)
    try {
      const res = await fetch(`/api/instructor/courses/${course.id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !course.isArchived }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to archive')
      }
      toast.success(course.isArchived ? 'Course unarchived' : 'Course archived')
      fetchCourses()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to archive')
    } finally {
      setPublishing(null)
    }
  }

  const handleDuplicate = async (course: InstructorCourse) => {
    setPublishing(course.id)
    try {
      const res = await fetch(`/api/instructor/courses/${course.id}/duplicate`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to duplicate')
      }
      const data = await res.json()
      toast.success(`Course duplicated! ${data.stats?.modulesCopied || 0} modules copied`)
      fetchCourses()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to duplicate')
    } finally {
      setPublishing(null)
    }
  }

  const handleDelete = async (course: InstructorCourse) => {
    setDeleting(course.id)
    try {
      const res = await fetch(`/api/instructor/courses/${course.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete')
      }
      toast.success('Course deleted')
      setShowDeleteDialog(null)
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(course.id); return n })
      fetchCourses()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  // Enhanced bulk action using the bulk API endpoint
  const handleBulkAction = async (action: 'publish' | 'unpublish' | 'archive' | 'unarchive' | 'delete') => {
    if (selectedIds.size === 0 || !currentUser) return
    setBulkProcessing(true)
    try {
      const ids = Array.from(selectedIds)
      if (action === 'delete') {
        // Delete uses individual calls since there's no bulk delete
        const results = await Promise.allSettled(
          ids.map(async (id) => {
            const res = await fetch(`/api/instructor/courses/${id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed')
          })
        )
        const failed = results.filter((r) => r.status === 'rejected').length
        if (failed > 0) {
          toast.warning(`${ids.length - failed} deleted, ${failed} failed (courses with enrollments can't be deleted)`)
        } else {
          toast.success(`${ids.length} course${ids.length !== 1 ? 's' : ''} deleted`)
        }
      } else {
        // Use bulk API for publish, unpublish, archive, unarchive
        const res = await fetch('/api/instructor/courses/bulk', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instructorId: currentUser.id,
            courseIds: ids,
            action,
          }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Bulk action failed')
        }
        const data = await res.json()
        toast.success(data.message || `${ids.length} course${ids.length !== 1 ? 's' : ''} ${action}d`)
      }
      setSelectedIds(new Set())
      setShowBulkDeleteDialog(false)
      fetchCourses()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Bulk action failed')
    } finally {
      setBulkProcessing(false)
    }
  }

  const handleCreateNew = () => {
    setEditingCourseId(null)
    setCreatorStep(0)
    setCurrentView('course-creator')
  }

  const handleEditCourse = (course: InstructorCourse) => {
    setEditingCourseId(course.id)
    setCreatorStep(0)
    setCurrentView('course-creator')
  }

  const handleManageCourse = (courseId: string) => {
    setSelectedCourseId(courseId)
    setCurrentView('instructor-course-detail')
  }

  const handleNavigateToDetail = (course: InstructorCourse) => {
    setSelectedCourseId(course.id)
    setCurrentView('instructor-course-detail')
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setSortOption('updatedAt-desc')
  }

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Title', 'Category', 'Level', 'Price', 'Status', 'Students', 'Rating', 'Revenue', 'Created', 'Updated']
    const rows = filteredCourses.map(c => [
      `"${c.title.replace(/"/g, '""')}"`,
      c.category,
      c.level,
      c.price,
      getCourseStatus(c),
      c.enrollmentCount,
      c.rating,
      c.analytics.totalRevenue,
      new Date(c.createdAt).toLocaleDateString(),
      new Date(c.updatedAt).toLocaleDateString(),
    ])

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'courses-export.csv'
    link.click()
    URL.revokeObjectURL(link.href)
    toast.success(`Exported ${filteredCourses.length} courses to CSV`)
  }

  // ============================================================
  // Render: Summary Dashboard Cards
  // ============================================================
  const renderSummaryCards = () => {
    if (!summary || summary.totalCourses === 0) return null

    return (
      <InstructorStatCardGrid columns={6}>
        <InstructorStatCard
          icon={BookOpen}
          label="Total Courses"
          value={summary.totalCourses}
          color="emerald"
          subLabel={`${summary.publishedCourses} published / ${summary.draftCourses} draft`}
          index={0}
        />
        <InstructorStatCard
          icon={Users}
          label="Total Students"
          value={summary.totalStudents.toLocaleString()}
          color="teal"
          subLabel="across all courses"
          index={1}
        />
        <InstructorStatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`$${summary.totalRevenue.toLocaleString()}`}
          color="amber"
          subLabel="lifetime earnings"
          index={2}
        />
        <InstructorStatCard
          icon={Star}
          label="Avg Rating"
          value={summary.avgRating}
          color="rose"
          subLabel="across all courses"
          index={3}
        />
        <InstructorStatCard
          icon={TrendingUp}
          label="Completion Rate"
          value={`${summary.avgCompletionRate}%`}
          color="violet"
          subLabel="average completion"
          index={4}
        />
        <InstructorStatCard
          icon={GraduationCap}
          label="Active This Month"
          value={summary.publishedCourses}
          color="cyan"
          subLabel="published courses"
          index={5}
        />
      </InstructorStatCardGrid>
    )
  }

  // ============================================================
  // Render: Tab Filters with Counts
  // ============================================================
  const renderTabFilters = () => {
    const tabs: Array<{ key: StatusFilter; label: string }> = [
      { key: 'all', label: 'All' },
      { key: 'published', label: 'Published' },
      { key: 'draft', label: 'Draft' },
      { key: 'under-review', label: 'Under Review' },
      { key: 'archived', label: 'Archived' },
    ]

    return (
      <div className="overflow-x-auto scrollbar-thin -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-2 flex-nowrap">
          {tabs.map((tab) => (
            <motion.button
              key={tab.key}
              whileTap={{ scale: 0.97 }}
              onClick={() => setStatusFilter(tab.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-all whitespace-nowrap',
                statusFilter === tab.key
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {tab.label}
              <span className={cn(
                'inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none min-w-[20px]',
                statusFilter === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-muted text-muted-foreground'
              )}>
                {tabCounts[tab.key]}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    )
  }

  // ============================================================
  // Render: Search, Sort, View Toggle Toolbar
  // ============================================================
  const renderToolbar = () => (
    <div className="space-y-3">
      {/* Mobile: Search bar full-width */}
      <div className="relative flex-1 md:hidden">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10 rounded-xl pl-10 pr-4 text-[14px] bg-card border-border w-full"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Mobile: Filter button + Sheet */}
      <div className="flex items-center gap-2 md:hidden">
        <MobileFilterSheet
          activeCount={activeFilterCount}
          onClearAll={clearFilters}
        >
          <MobileFilterGroup label="Sort By">
            <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
              <SelectTrigger className="w-full h-10 text-[13px] rounded-lg">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </MobileFilterGroup>
        </MobileFilterSheet>

        {activeFilterCount > 0 && (
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
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 rounded-xl pl-9 pr-8 text-[13px] bg-card border-0 shadow-sm"
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

        {/* Sort */}
        <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
          <SelectTrigger className="h-9 rounded-xl text-[13px] w-[170px] bg-card shadow-sm border-0">
            <ArrowUpDown className="size-3.5 mr-1.5 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Export CSV */}
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl h-9 gap-2 text-[13px]"
          onClick={handleExportCSV}
          disabled={filteredCourses.length === 0}
        >
          <Download className="size-4" />
          Export
        </Button>

        {/* View mode toggle */}
        <div className="flex items-center rounded-xl bg-card shadow-sm border-0 p-0.5 gap-0.5">
          {[
            { mode: 'grid' as ViewMode, icon: LayoutGrid, label: 'Grid' },
            { mode: 'list' as ViewMode, icon: List, label: 'List' },
            { mode: 'kanban' as ViewMode, icon: Columns3, label: 'Kanban' },
          ].map((v) => (
            <button
              key={v.mode}
              onClick={() => setViewMode(v.mode)}
              className={cn(
                'flex items-center justify-center size-8 rounded-lg transition-colors',
                viewMode === v.mode
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
              title={v.label}
            >
              <v.icon className="size-4" />
            </button>
          ))}
        </div>

        {/* Create Course */}
        <Button
          className="rounded-xl h-9 bg-gradient-to-r from-emerald-500 to-teal-600 text-white gap-2 text-[13px]"
          onClick={() => setShowCreateWizard(true)}
        >
          <Plus className="size-4" />
          Create Course
        </Button>
      </div>
    </div>
  )

  // ============================================================
  // Render: More Actions Dropdown
  // ============================================================
  const renderMoreDropdown = (course: InstructorCourse) => {
    const isPublishing = publishing === course.id
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="ghost" className="rounded-lg h-8 w-8 p-0 shrink-0 hover:bg-muted">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-xl">
          <DropdownMenuItem onClick={() => setEditInfoCourse(course)} disabled={isPublishing}>
            <Edit3 className="mr-2 size-4" />Edit Info
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditingCourse(course)} disabled={isPublishing}>
            <Layers className="mr-2 size-4" />Modules & Lessons
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDuplicate(course)} disabled={isPublishing}>
            <Copy className="mr-2 size-4" />Duplicate course
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleArchiveToggle(course)} disabled={isPublishing}>
            {course.isArchived ? (
              <><ArchiveRestore className="mr-2 size-4" />Unarchive</>
            ) : (
              <><Archive className="mr-2 size-4" />Archive</>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => {
            const url = `${window.location.origin}/courses/${course.id}`
            navigator.clipboard.writeText(url)
            toast.success('Course link copied!')
          }}>
            <Hash className="mr-2 size-4" />Copy course link
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
            onClick={() => setShowDeleteDialog(course)}
          >
            <Trash2 className="mr-2 size-4" />Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // ============================================================
  // Render: Thumbnail Component
  // ============================================================
  const renderThumbnail = (course: InstructorCourse, size: 'sm' | 'md' | 'lg' = 'sm') => {
    const sizes = { sm: 'w-20 h-20 rounded-xl', md: 'w-32 h-32 rounded-2xl', lg: 'w-full h-40 rounded-t-2xl' }
    const iconSizes = { sm: 'size-8', md: 'size-12', lg: 'size-16' }

    return (
      <div className={cn(
        'shrink-0 flex items-center justify-center bg-gradient-to-br text-white overflow-hidden',
        sizes[size],
        categoryGradients[course.category] || 'from-emerald-500 to-teal-600'
      )}>
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <GraduationCap className={iconSizes[size]} />
        )}
      </div>
    )
  }

  // ============================================================
  // Render: Grid View Card
  // ============================================================
  const renderGridCard = (course: InstructorCourse, index: number) => {
    const status = getCourseStatus(course)
    const readiness = computeReadinessScore(course)
    const totalLessons = course.modules.reduce((acc, m) => acc + m.lessonCount, 0)
    const totalDuration = course.modules.reduce((acc, m) => acc + m.totalDuration, 0)
    const isSelected = selectedIds.has(course.id)

    return (
      <motion.div
        key={course.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.03, duration: 0.25 }}
        className={cn(
          'group rounded-2xl bg-card border border-border/60 overflow-hidden transition-all hover:shadow-lg cursor-pointer',
          status === 'published' && 'hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-emerald-600/5',
          status === 'draft' && 'hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-amber-600/5',
          status === 'under-review' && 'hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-sky-600/5',
          status === 'archived' && 'opacity-75 hover:opacity-100',
          isSelected && 'ring-2 ring-primary ring-offset-2'
        )}
        onClick={() => handleNavigateToDetail(course)}
      >
        {/* Thumbnail with status badge overlay */}
        <div className="relative">
          {renderThumbnail(course, 'lg')}
          {/* Status badge overlay */}
          <div className="absolute top-3 left-3">
            <Badge className={cn('text-[10px] font-medium rounded-full gap-1 shadow-sm', statusConfig[status].color)}>
              <span className={cn('size-1.5 rounded-full', statusConfig[status].dotColor)} />
              {statusConfig[status].label}
            </Badge>
          </div>
          {/* Checkbox */}
          <div className="absolute top-3 right-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => toggleSelect(course.id)}
              className="size-5 rounded-md bg-white/90 dark:bg-gray-800/90 border-2"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          {/* Quick actions on hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button size="sm" variant="secondary" className="rounded-lg h-8 text-[12px] shadow-md" onClick={(e) => { e.stopPropagation(); handleEditCourse(course) }}>
              <Edit3 className="mr-1 size-3" />Edit
            </Button>
            <Button size="sm" variant="secondary" className="rounded-lg h-8 text-[12px] shadow-md" onClick={(e) => { e.stopPropagation(); setAnalyticsCourse(course) }}>
              <BarChart3 className="mr-1 size-3" />Analytics
            </Button>
            {!course.isArchived && (
              <Button size="sm" variant="secondary" className="rounded-lg h-8 text-[12px] shadow-md" onClick={(e) => { e.stopPropagation(); handlePublishToggle(course) }} disabled={publishing === course.id}>
                {course.isPublished ? <EyeOff className="mr-1 size-3" /> : <Eye className="mr-1 size-3" />}
                {course.isPublished ? 'Unpublish' : 'Publish'}
              </Button>
            )}
          </div>
        </div>

        {/* Card content */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="text-[14px] font-bold text-foreground truncate">{course.title}</h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <Badge variant="outline" className="text-[10px] rounded-md h-5">{course.category}</Badge>
              <Badge className={cn('text-[10px] rounded-md h-5', levelColors[course.level] || levelColors.beginner)}>
                {course.level}
              </Badge>
              {course.price === 0 ? (
                <Badge className="text-[10px] rounded-md h-5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">Free</Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] rounded-md h-5">${course.price.toLocaleString()}</Badge>
              )}
            </div>
          </div>

          {/* Review status for non-published courses */}
          {(status === 'draft' || status === 'under-review') && (
            <ReviewStatusBadge status={course.reviewStatus} note={course.reviewNote} />
          )}

          {/* Readiness score for drafts */}
          {status === 'draft' && <ReadinessIndicator score={readiness} />}

          {/* Quick stats */}
          <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="size-3" />
              {course.enrollmentCount}
            </span>
            <span className="flex items-center gap-1">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              {course.rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {formatDuration(totalDuration)}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="size-3" />
              {totalLessons}
            </span>
          </div>

          {/* Revenue for published */}
          {status === 'published' && (
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted-foreground">Revenue</span>
              <span className="text-[14px] font-bold text-emerald-600">${course.analytics.totalRevenue.toLocaleString()}</span>
            </div>
          )}

          {/* More actions */}
          <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
            {renderMoreDropdown(course)}
          </div>
        </div>
      </motion.div>
    )
  }

  // ============================================================
  // Render: List View Cards (existing design)
  // ============================================================
  const renderListCard = (course: InstructorCourse, index: number) => {
    const status = getCourseStatus(course)
    const totalLessons = course.modules.reduce((acc, m) => acc + m.lessonCount, 0)
    const totalDuration = course.modules.reduce((acc, m) => acc + m.totalDuration, 0)
    const readiness = computeReadinessScore(course)
    const isSelected = selectedIds.has(course.id)

    return (
      <motion.div
        key={course.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        className={cn(
          'group rounded-2xl bg-card border border-border/60 p-4 sm:p-5 transition-all cursor-pointer',
          status === 'published' && 'hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg hover:shadow-emerald-600/5',
          status === 'draft' && 'hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-lg hover:shadow-amber-600/5',
          status === 'under-review' && 'hover:border-sky-300 dark:hover:border-sky-700 hover:shadow-lg hover:shadow-sky-600/5',
          status === 'archived' && 'opacity-75 hover:opacity-100',
          isSelected && 'ring-2 ring-primary ring-offset-2'
        )}
        onClick={() => handleNavigateToDetail(course)}
      >
        <div className="flex gap-4">
          {/* Checkbox */}
          <div className="flex items-start pt-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => toggleSelect(course.id)}
              className="size-5 rounded-md"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Thumbnail */}
          {renderThumbnail(course)}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-[16px] font-bold text-foreground truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {course.title}
                </h3>
                {/* Badges */}
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <Badge className={cn('text-[10px] font-medium rounded-full gap-1', statusConfig[status].color)}>
                    <span className={cn('size-1.5 rounded-full', statusConfig[status].dotColor)} />
                    {statusConfig[status].label}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] rounded-md h-5">{course.category}</Badge>
                  <Badge className={cn('text-[10px] rounded-md h-5', levelColors[course.level] || levelColors.beginner)}>{course.level}</Badge>
                  {/* Review status */}
                  {(status === 'draft' || status === 'under-review') && (
                    <ReviewStatusBadge status={course.reviewStatus} note={course.reviewNote} />
                  )}
                </div>
              </div>
              <div onClick={(e) => e.stopPropagation()}>{renderMoreDropdown(course)}</div>
            </div>

            {/* Readiness for drafts */}
            {status === 'draft' && (
              <div className="mt-2 max-w-xs">
                <ReadinessIndicator score={readiness} />
              </div>
            )}

            {/* Review info for under-review */}
            {status === 'under-review' && (
              <div className="mt-2 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50 px-3 py-2">
                <div className="flex items-center gap-2 text-[13px]">
                  <Clock className="size-3.5 text-sky-600 dark:text-sky-400" />
                  <span className="text-sky-700 dark:text-sky-300 font-medium">
                    Submitted for review {formatRelativeDate(course.updatedAt)}
                  </span>
                </div>
                {course.reviewNote && (
                  <p className="text-[12px] text-sky-600/70 dark:text-sky-400/70 mt-1 ml-5.5">{course.reviewNote}</p>
                )}
              </div>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-3 mt-1.5 text-[13px] text-muted-foreground flex-wrap">
              {status === 'published' && (
                <>
                  <span className="flex items-center gap-1">
                    <Star className="size-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-medium text-foreground">{course.rating.toFixed(1)}</span>
                  </span>
                  <span className="text-border">-</span>
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" />
                    {course.enrollmentCount.toLocaleString()} students
                  </span>
                  <span className="text-border">-</span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="size-3.5" />
                    ${course.analytics.totalRevenue.toLocaleString()} revenue
                  </span>
                </>
              )}
              <span className="flex items-center gap-1">
                <BookOpen className="size-3.5" />
                {totalLessons} lessons
              </span>
              <span className="text-border">-</span>
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {formatDuration(totalDuration)}
              </span>
              <span className="text-border">-</span>
              <span>{course.price === 0 ? <span className="text-emerald-600 font-semibold">Free</span> : `$${course.price.toLocaleString()}`}</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-3 flex-wrap" onClick={(e) => e.stopPropagation()}>
              {status === 'published' && (
                <>
                  <Button size="sm" variant="outline" className="rounded-lg h-8 text-[12px] font-medium hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400 dark:hover:border-emerald-700" onClick={() => handleEditCourse(course)}>
                    <Edit3 className="mr-1.5 size-3" />Edit Course
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-lg h-8 text-[12px] font-medium" onClick={() => setAnalyticsCourse(course)}>
                    <BarChart3 className="mr-1.5 size-3" />Analytics
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-lg h-8 text-[12px] font-medium" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/courses/${course.id}`); toast.success('Link copied!') }}>
                    <Share className="mr-1.5 size-3" />Share
                  </Button>
                </>
              )}
              {status === 'draft' && (
                <>
                  <Button size="sm" className="rounded-lg h-8 text-[12px] font-medium bg-amber-500 hover:bg-amber-600 text-white" onClick={() => handleEditCourse(course)}>
                    <PenTool className="mr-1.5 size-3" />Continue Editing
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-lg h-8 text-[12px] font-medium" onClick={() => setEditInfoCourse(course)}>
                    <Edit3 className="mr-1.5 size-3" />Edit Info
                  </Button>
                  <Button size="sm" variant="ghost" className="rounded-lg h-8 text-[12px] font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => setShowDeleteDialog(course)}>
                    <Trash2 className="mr-1.5 size-3" />Discard
                  </Button>
                </>
              )}
              {status === 'under-review' && (
                <>
                  <Button size="sm" variant="outline" className="rounded-lg h-8 text-[12px] font-medium hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 dark:hover:bg-sky-950/30 dark:hover:text-sky-400 dark:hover:border-sky-700" onClick={() => setAnalyticsCourse(course)}>
                    <Eye className="mr-1.5 size-3" />View Submission
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-lg h-8 text-[12px] font-medium" onClick={() => handleEditCourse(course)}>
                    <Edit3 className="mr-1.5 size-3" />Edit While Waiting
                  </Button>
                </>
              )}
              {status === 'archived' && (
                <>
                  <Button size="sm" variant="outline" className="rounded-lg h-8 text-[12px] font-medium" onClick={() => handleArchiveToggle(course)}>
                    <ArchiveRestore className="mr-1.5 size-3" />Unarchive
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-lg h-8 text-[12px] font-medium" onClick={() => handleEditCourse(course)}>
                    <Edit3 className="mr-1.5 size-3" />Edit Course
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // ============================================================
  // Render: Kanban View
  // ============================================================
  const renderKanbanView = () => {
    const columns: Array<{ key: 'draft' | 'under-review' | 'published' | 'archived'; label: string; color: string; headerBg: string }> = [
      { key: 'draft', label: 'Draft', color: 'border-amber-300 dark:border-amber-700', headerBg: 'bg-amber-50 dark:bg-amber-950/30' },
      { key: 'under-review', label: 'Under Review', color: 'border-sky-300 dark:border-sky-700', headerBg: 'bg-sky-50 dark:bg-sky-950/30' },
      { key: 'published', label: 'Published', color: 'border-emerald-300 dark:border-emerald-700', headerBg: 'bg-emerald-50 dark:bg-emerald-950/30' },
      { key: 'archived', label: 'Archived', color: 'border-gray-300 dark:border-gray-600', headerBg: 'bg-gray-50 dark:bg-gray-900/30' },
    ]

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[400px]">
        {columns.map((col) => {
          const colCourses = filteredCourses.filter(c => getCourseStatus(c) === col.key)
          return (
            <div key={col.key} className={cn('rounded-2xl border-t-4 flex flex-col', col.color)}>
              {/* Column header */}
              <div className={cn('px-4 py-3 rounded-t-xl', col.headerBg)}>
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-bold">{col.label}</h3>
                  <Badge variant="outline" className="text-[11px] h-5 rounded-full">{colCourses.length}</Badge>
                </div>
              </div>

              {/* Column cards */}
              <ScrollArea className="flex-1 max-h-[60vh]">
                <div className="p-3 space-y-2">
                  {colCourses.length === 0 ? (
                    <div className="text-center py-8 text-[12px] text-muted-foreground">
                      No courses
                    </div>
                  ) : (
                    colCourses.map((course) => {
                      const isSelected = selectedIds.has(course.id)
                      return (
                        <motion.div
                          key={course.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            'rounded-xl bg-card border border-border/60 p-3 space-y-2 cursor-pointer hover:shadow-md transition-all',
                            isSelected && 'ring-2 ring-primary'
                          )}
                          onClick={() => handleNavigateToDetail(course)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-[13px] font-semibold line-clamp-2 leading-tight">{course.title}</h4>
                            <div onClick={(e) => e.stopPropagation()}>{renderMoreDropdown(course)}</div>
                          </div>
                          <div className="flex items-center gap-1 flex-wrap">
                            <Badge variant="outline" className="text-[9px] h-4 rounded px-1.5">{course.category}</Badge>
                            <Badge className={cn('text-[9px] h-4 rounded px-1.5', levelColors[course.level] || levelColors.beginner)}>{course.level}</Badge>
                          </div>
                          {/* Review status */}
                          {(col.key === 'draft' || col.key === 'under-review') && (
                            <ReviewStatusBadge status={course.reviewStatus} note={course.reviewNote} />
                          )}
                          {/* Readiness for drafts */}
                          {col.key === 'draft' && <ReadinessIndicator score={computeReadinessScore(course)} />}
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="size-3" />
                              {course.enrollmentCount}
                            </span>
                            <span>{course.price === 0 ? 'Free' : `$${course.price.toLocaleString()}`}</span>
                          </div>
                          {/* Quick actions */}
                          <div className="flex items-center gap-1 pt-1 border-t border-border/40">
                            {col.key === 'draft' && (
                              <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 rounded hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30" onClick={(e) => { e.stopPropagation(); handlePublishToggle(course) }} disabled={publishing === course.id}>
                                <Eye className="mr-1 size-3" />Publish
                              </Button>
                            )}
                            {col.key === 'published' && (
                              <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 rounded hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30" onClick={(e) => { e.stopPropagation(); handlePublishToggle(course) }} disabled={publishing === course.id}>
                                <EyeOff className="mr-1 size-3" />Unpublish
                              </Button>
                            )}
                            {col.key === 'archived' && (
                              <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 rounded hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-950/30" onClick={(e) => { e.stopPropagation(); handleArchiveToggle(course) }} disabled={publishing === course.id}>
                                <ArchiveRestore className="mr-1 size-3" />Unarchive
                              </Button>
                            )}
                            {!course.isArchived && col.key !== 'archived' && (
                              <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 rounded hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-800" onClick={(e) => { e.stopPropagation(); handleArchiveToggle(course) }} disabled={publishing === course.id}>
                                <Archive className="mr-1 size-3" />Archive
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2 rounded ml-auto" onClick={(e) => { e.stopPropagation(); setEditInfoCourse(course) }}>
                              <Edit3 className="size-3" />
                            </Button>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          )
        })}
      </div>
    )
  }

  // ============================================================
  // Render: Loading skeletons
  // ============================================================
  const renderSkeletons = () => {
    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-card border border-border/60 overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-16 rounded-md" />
                  <Skeleton className="h-5 w-16 rounded-md" />
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (viewMode === 'kanban') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/60 p-3 space-y-2">
              <Skeleton className="h-6 w-24" />
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="rounded-xl bg-card border border-border/60 p-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>
          ))}
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-card border border-border/60 p-4 sm:p-5">
            <div className="flex gap-4">
              <Skeleton className="shrink-0 w-5 h-5 rounded-md mt-2" />
              <Skeleton className="shrink-0 w-20 h-20 rounded-xl" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-56" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-72" />
                <Skeleton className="h-4 w-48" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24 rounded-lg" />
                  <Skeleton className="h-8 w-28 rounded-lg" />
                  <Skeleton className="h-8 w-16 rounded-lg" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ============================================================
  // Render: Main
  // ============================================================
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-foreground">My Courses</h1>
          <p className="text-[14px] text-muted-foreground mt-0.5">
            Create, manage, and track your courses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl h-10 gap-2"
            onClick={fetchCourses}
            disabled={loading}
          >
            <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
          </Button>
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              onClick={handleCreateNew}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 h-10 font-semibold shadow-md shadow-emerald-600/20"
            >
              <Plus className="mr-1.5 size-4" />
              New Course
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Summary Dashboard Cards */}
      {renderSummaryCards()}

      {/* Tab Filters with Counts */}
      {renderTabFilters()}

      {/* Search, Sort, View Toggle Toolbar */}
      {renderToolbar()}

      {/* Select All bar */}
      {filteredCourses.length > 0 && viewMode !== 'kanban' && (
        <div className="flex items-center gap-3 px-1">
          <Checkbox
            checked={selectedIds.size === filteredCourses.length && filteredCourses.length > 0}
            onCheckedChange={toggleSelectAll}
            className="size-4 rounded"
          />
          <span className="text-[12px] text-muted-foreground">
            {selectedIds.size > 0 ? `${selectedIds.size} of ${filteredCourses.length} selected` : `Select all ${filteredCourses.length} courses`}
          </span>
        </div>
      )}

      {/* Content area */}
      <div className="min-h-[300px]">
        {loading ? (
          renderSkeletons()
        ) : filteredCourses.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border/60">
            {statusFilter === 'archived' ? (
              <EmptyState type="no-archived" />
            ) : statusFilter !== 'all' || searchQuery || activeFilterCount > 0 ? (
              <EmptyState type="no-matching" onAction={clearFilters} />
            ) : (
              <EmptyState type="no-courses" onAction={handleCreateNew} />
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredCourses.map((course, i) => renderGridCard(course, i))}
            </AnimatePresence>
          </div>
        ) : viewMode === 'kanban' ? (
          renderKanbanView()
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredCourses.map((course, i) => renderListCard(course, i))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <BulkActionBar
            selectedCount={selectedCount}
            onPublish={() => handleBulkAction('publish')}
            onUnpublish={() => handleBulkAction('unpublish')}
            onArchive={() => handleBulkAction('archive')}
            onUnarchive={() => handleBulkAction('unarchive')}
            onDelete={() => setShowBulkDeleteDialog(true)}
            onClear={clearSelection}
            processing={bulkProcessing}
          />
        )}
      </AnimatePresence>

      {/* Bulk Delete Confirmation */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/40">
                <Trash2 className="size-6 text-red-600 dark:text-red-400" />
              </div>
              <DialogTitle className="text-[20px]">Delete {selectedCount} Course{selectedCount !== 1 ? 's' : ''}?</DialogTitle>
            </div>
            <DialogDescription className="text-[14px]">
              This action cannot be undone. Courses with active enrollments cannot be deleted and will be skipped.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" className="rounded-xl ios-press" onClick={() => setShowBulkDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl ios-press"
              disabled={bulkProcessing}
              onClick={() => handleBulkAction('delete')}
            >
              {bulkProcessing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />}
              Delete {selectedCount} Course{selectedCount !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialogs */}
      {showCreateWizard && currentUser && (
        <CourseCreationWizard
          onClose={() => setShowCreateWizard(false)}
          onCreated={() => fetchCourses()}
          instructorId={currentUser.id}
        />
      )}

      {editingCourse && (
        <CourseEditorDialog
          course={editingCourse}
          onClose={() => setEditingCourse(null)}
          onUpdated={fetchCourses}
        />
      )}

      {editInfoCourse && (
        <CourseEditInfoDialog
          course={editInfoCourse}
          onClose={() => setEditInfoCourse(null)}
          onUpdated={fetchCourses}
        />
      )}

      {analyticsCourse && (
        <AnalyticsDialog
          course={analyticsCourse}
          onClose={() => setAnalyticsCourse(null)}
        />
      )}

      {showDeleteDialog && (
        <DeleteConfirmDialog
          course={showDeleteDialog}
          deleting={deleting === showDeleteDialog.id}
          onConfirm={() => handleDelete(showDeleteDialog)}
          onCancel={() => setShowDeleteDialog(null)}
        />
      )}
    </motion.div>
  )
}
