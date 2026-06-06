'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GripVertical, Plus, Trash2, PenTool, ChevronDown, ChevronUp,
  ChevronRight, Play, FileText, HelpCircle, ClipboardList, Radio,
  Download, Loader2, Sparkles, Clock, BookOpen, Layers,
  ArrowUp, ArrowDown, X, Check, AlertCircle, Gamepad2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { CourseFormData, WizardModule, WizardLesson, WizardQuiz, WizardQuestion, WizardAssignment } from './types'
import { CATEGORIES, SUBCATEGORIES, LEVELS, LANGUAGES, LESSON_TYPES, QUIZ_TYPES, ASSIGNMENT_TYPES, QUESTION_TYPES, SUBMISSION_TYPES, SPRING, CARD_SPRING, generateId } from './constants'

// ─── Props ───

export interface Step2CurriculumProps {
  form: CourseFormData
  onFormChange: (updates: Partial<CourseFormData>) => void
  onEditLesson: (moduleId: string, lessonId: string) => void
  onPrevious: () => void
  onNext: () => void
  courseId: string | null
}

// ─── Helpers ───

// generateId imported from constants

function ContentIcon({ type, className }: { type: string; className?: string }) {
  const config: Record<string, { icon: React.ReactNode; color: string }> = {
    video: { icon: <Play className="size-3.5" />, color: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400' },
    text: { icon: <FileText className="size-3.5" />, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
    interactive: { icon: <Gamepad2 className="size-3.5" />, color: 'bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400' },
    quiz: { icon: <HelpCircle className="size-3.5" />, color: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' },
    assignment: { icon: <ClipboardList className="size-3.5" />, color: 'bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400' },
    'live-session': { icon: <Radio className="size-3.5" />, color: 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' },
    download: { icon: <Download className="size-3.5" />, color: 'bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400' },
  }
  const c = config[type] || config.text
  return (
    <div className={cn('flex size-7 items-center justify-center rounded-lg', c.color, className)}>
      {c.icon}
    </div>
  )
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

// ─── Add Lesson Form ───

function AddLessonForm({
  moduleId,
  onAdd,
  onCancel,
}: {
  moduleId: string
  onAdd: (moduleId: string, lesson: WizardLesson) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<WizardLesson['type']>('video')
  const [duration, setDuration] = useState(15)
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Lesson title is required')
      return
    }
    setSaving(true)
    const lesson: WizardLesson = {
      id: generateId('lesson'),
      title: title.trim(),
      description,
      content: '',
      type,
      videoUrl: '',
      duration,
      order: 0, // will be set by parent
      resources: [],
      objectives: [],
      isFree: false,
      isPublished: false,
      transcript: '',
      slideUrl: '',
      captions: { mode: 'none', languages: [] },
    }
    setTimeout(() => {
      onAdd(moduleId, lesson)
      setSaving(false)
    }, 300)
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={SPRING}
      className="overflow-hidden"
    >
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-primary flex items-center gap-2">
            <Plus className="size-4" />
            Add New Lesson
          </span>
          <Button variant="ghost" size="icon" className="size-7 rounded-xl" onClick={onCancel}>
            <X className="size-3.5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium">Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 rounded-xl text-[13px]"
              placeholder="Lesson title..."
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as WizardLesson['type'])}>
              <SelectTrigger className="h-9 rounded-xl text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LESSON_TYPES.map((lt) => (
                  <SelectItem key={lt.value} value={lt.value}>
                    <span className="mr-2">{lt.icon}</span>
                    {lt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium">Duration (min)</Label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 0))}
              className="h-9 rounded-xl text-[13px]"
              min={1}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium">Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-9 rounded-xl text-[13px]"
              placeholder="Brief description..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" className="rounded-xl ios-press" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="rounded-xl ios-press gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
            Add Lesson
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Add Quiz Form ───

function AddQuizForm({
  moduleId,
  onAdd,
  onCancel,
}: {
  moduleId: string
  onAdd: (moduleId: string, quiz: WizardQuiz) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<WizardQuiz['type']>('practice')
  const [timeLimit, setTimeLimit] = useState(30)
  const [passingScore, setPassingScore] = useState(70)
  const [saving, setSaving] = useState(false)

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Quiz title is required')
      return
    }
    setSaving(true)
    const quiz: WizardQuiz = {
      id: generateId('quiz'),
      title: title.trim(),
      description: '',
      type,
      timeLimit,
      passingScore,
      maxAttempts: 3,
      randomizeQuestions: false,
      showCorrectAnswers: 'after_submission',
      questions: [],
      isNew: true,
    }
    setTimeout(() => {
      onAdd(moduleId, quiz)
      setSaving(false)
    }, 300)
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={SPRING}
      className="overflow-hidden"
    >
      <div className="rounded-2xl border border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2">
            <HelpCircle className="size-4" />
            Add New Quiz
          </span>
          <Button variant="ghost" size="icon" className="size-7 rounded-xl" onClick={onCancel}>
            <X className="size-3.5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium">Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 rounded-xl text-[13px]"
              placeholder="Quiz title..."
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as WizardQuiz['type'])}>
              <SelectTrigger className="h-9 rounded-xl text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUIZ_TYPES.map((qt) => (
                  <SelectItem key={qt.value} value={qt.value}>{qt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium">Time Limit (min)</Label>
            <Input
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(Math.max(1, parseInt(e.target.value) || 0))}
              className="h-9 rounded-xl text-[13px]"
              min={1}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium">Passing Score (%)</Label>
            <Input
              type="number"
              value={passingScore}
              onChange={(e) => setPassingScore(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              className="h-9 rounded-xl text-[13px]"
              min={0}
              max={100}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" className="rounded-xl ios-press" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="rounded-xl ios-press gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
            Add Quiz
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Add Assignment Form ───

function AddAssignmentForm({
  moduleId,
  onAdd,
  onCancel,
}: {
  moduleId: string
  onAdd: (moduleId: string, assignment: WizardAssignment) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<WizardAssignment['type']>('written')
  const [instructions, setInstructions] = useState('')
  const [maxScore, setMaxScore] = useState(100)
  const [saving, setSaving] = useState(false)

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Assignment title is required')
      return
    }
    setSaving(true)
    const assignment: WizardAssignment = {
      id: generateId('assign'),
      title: title.trim(),
      description: '',
      instructions,
      type,
      moduleId,
      maxScore,
      dueDate: '',
      rubric: [],
      resources: [],
      submissionType: 'text',
      allowedFileTypes: [],
      maxFileSize: 10,
      gradingType: 'instructor',
      wordLimit: null,
      order: 0,
    }
    setTimeout(() => {
      onAdd(moduleId, assignment)
      setSaving(false)
    }, 300)
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={SPRING}
      className="overflow-hidden"
    >
      <div className="rounded-2xl border border-teal-300/40 bg-teal-50/50 dark:bg-teal-950/20 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-teal-700 dark:text-teal-400 flex items-center gap-2">
            <ClipboardList className="size-4" />
            Add New Assignment
          </span>
          <Button variant="ghost" size="icon" className="size-7 rounded-xl" onClick={onCancel}>
            <X className="size-3.5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium">Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 rounded-xl text-[13px]"
              placeholder="Assignment title..."
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as WizardAssignment['type'])}>
              <SelectTrigger className="h-9 rounded-xl text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNMENT_TYPES.map((at) => (
                  <SelectItem key={at.value} value={at.value}>{at.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[12px] font-medium">Instructions</Label>
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="rounded-xl text-[13px] min-h-[80px] resize-y"
            placeholder="What should students do for this assignment?"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium">Max Score</Label>
            <Input
              type="number"
              value={maxScore}
              onChange={(e) => setMaxScore(Math.max(1, parseInt(e.target.value) || 0))}
              className="h-9 rounded-xl text-[13px]"
              min={1}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium">Submission Type</Label>
            <Select defaultValue="text">
              <SelectTrigger className="h-9 rounded-xl text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUBMISSION_TYPES.map((st) => (
                  <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" className="rounded-xl ios-press" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="rounded-xl ios-press gap-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
            onClick={handleSubmit}
            disabled={saving || !title.trim()}
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
            Add Assignment
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Module Card ───

function ModuleCard({
  module,
  index,
  isExpanded,
  onToggle,
  onTitleChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddLesson,
  onAddQuiz,
  onAddAssignment,
  onEditLesson,
  onDeleteLesson,
  onDeleteQuiz,
  canMoveUp,
  canMoveDown,
  addingType,
  onAddLessonSubmit,
  onAddQuizSubmit,
  onAddAssignmentSubmit,
  onCancelAdd,
  aiGenerating,
  onAIGenerate,
}: {
  module: WizardModule
  index: number
  isExpanded: boolean
  onToggle: () => void
  onTitleChange: (title: string) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onAddLesson: () => void
  onAddQuiz: () => void
  onAddAssignment: () => void
  onEditLesson: (lessonId: string) => void
  onDeleteLesson: (lessonId: string) => void
  onDeleteQuiz: (quizId: string) => void
  canMoveUp: boolean
  canMoveDown: boolean
  addingType: 'lesson' | 'quiz' | 'assignment' | null
  onAddLessonSubmit: (moduleId: string, lesson: WizardLesson) => void
  onAddQuizSubmit: (moduleId: string, quiz: WizardQuiz) => void
  onAddAssignmentSubmit: (moduleId: string, assignment: WizardAssignment) => void
  onCancelAdd: () => void
  aiGenerating: boolean
  onAIGenerate: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(module.title)

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      onTitleChange(editTitle.trim())
    }
    setEditing(false)
  }

  const totalDuration = module.lessons.reduce((a, l) => a + l.duration, 0)

  return (
    <motion.div
      layout={SPRING}
      className={cn(
        'rounded-2xl border transition-all',
        isExpanded ? 'ios-shadow border-primary/20 bg-card' : 'ios-shadow-sm border-border bg-card hover:border-primary/10'
      )}
    >
      {/* Module Header */}
      <div
        className="flex items-center gap-2 p-3 cursor-pointer select-none"
        onClick={onToggle}
      >
        {/* Drag Handle */}
        <div className="flex size-8 items-center justify-center text-muted-foreground cursor-grab active:cursor-grabbing shrink-0 hover:text-foreground transition-colors">
          <GripVertical className="size-4" />
        </div>

        {/* Module Number */}
        <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-[12px] shrink-0">
          {index + 1}
        </div>

        {/* Title */}
        <div className="min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
          {editing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle()
                if (e.key === 'Escape') setEditing(false)
              }}
              className="h-8 rounded-xl text-[14px] font-semibold"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <button
              onClick={() => {
                setEditing(true)
                setEditTitle(module.title)
              }}
              className="text-[14px] font-semibold text-foreground hover:text-primary transition-colors text-left truncate block max-w-full"
            >
              {module.title}
              <PenTool className="inline size-3 ml-1.5 text-muted-foreground opacity-0 group-hover:opacity-100" />
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <BookOpen className="size-3" />
            {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}
          </span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Clock className="size-3" />
            {formatDuration(totalDuration)}
          </span>
          {module.quizzes.length > 0 && (
            <Badge variant="outline" className="text-[10px] h-5 rounded-lg bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
              {module.quizzes.length} quiz{module.quizzes.length !== 1 ? 'zes' : ''}
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp}
            className="flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30"
          >
            <ArrowUp className="size-3" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown}
            className="flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30"
          >
            <ArrowDown className="size-3" />
          </button>
          <button
            onClick={onDelete}
            className="flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="size-3" />
          </button>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={SPRING}
          >
            <ChevronDown className="size-4 text-muted-foreground" />
          </motion.div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SPRING}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              <Separator className="mb-2" />

              {/* Lessons */}
              {module.lessons.length > 0 && (
                <div className="space-y-1.5">
                  {module.lessons.map((lesson, lIdx) => (
                    <motion.div
                      key={lesson.id}
                      layout={SPRING}
                      className="rounded-xl ios-shadow-sm bg-background p-2.5 flex items-center gap-2.5 group cursor-pointer hover:border-primary/30 border border-transparent transition-colors"
                      onClick={() => onEditLesson(lesson.id)}
                    >
                      <ContentIcon type={lesson.type} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium truncate">{lesson.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="size-2.5" />
                            {formatDuration(lesson.duration)}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {LESSON_TYPES.find(lt => lt.value === lesson.type)?.label || lesson.type}
                          </span>
                          {lesson.isFree && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1 rounded-md bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
                              Free
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditLesson(lesson.id) }}
                          className="flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <PenTool className="size-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteLesson(lesson.id) }}
                          className="flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Quizzes */}
              {module.quizzes.length > 0 && (
                <div className="space-y-1.5">
                  {module.quizzes.map((quiz) => (
                    <motion.div
                      key={quiz.id}
                      layout={SPRING}
                      className="rounded-xl ios-shadow-sm bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 p-2.5 flex items-center gap-2.5 group"
                    >
                      <ContentIcon type="quiz" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium truncate">{quiz.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-amber-600 dark:text-amber-400">
                            {QUIZ_TYPES.find(qt => qt.value === quiz.type)?.label || quiz.type}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {quiz.questions.length} question{quiz.questions.length !== 1 ? 's' : ''}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            Pass: {quiz.passingScore}%
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => onDeleteQuiz(quiz.id)}
                        className="flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {module.lessons.length === 0 && module.quizzes.length === 0 && addingType === null && (
                <div className="text-center py-4 rounded-xl border-2 border-dashed border-border">
                  <BookOpen className="mx-auto size-5 text-muted-foreground/40" />
                  <p className="mt-1.5 text-[12px] text-muted-foreground">No content yet</p>
                  <p className="text-[11px] text-muted-foreground/70">Add lessons, quizzes, or assignments</p>
                </div>
              )}

              {/* Add Forms */}
              <AnimatePresence>
                {addingType === 'lesson' && (
                  <AddLessonForm
                    moduleId={module.id}
                    onAdd={onAddLessonSubmit}
                    onCancel={onCancelAdd}
                  />
                )}
                {addingType === 'quiz' && (
                  <AddQuizForm
                    moduleId={module.id}
                    onAdd={onAddQuizSubmit}
                    onCancel={onCancelAdd}
                  />
                )}
                {addingType === 'assignment' && (
                  <AddAssignmentForm
                    moduleId={module.id}
                    onAdd={onAddAssignmentSubmit}
                    onCancel={onCancelAdd}
                  />
                )}
              </AnimatePresence>

              {/* Add Buttons */}
              {addingType === null && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl ios-press gap-1.5 text-[12px] h-8"
                    onClick={onAddLesson}
                  >
                    <Plus className="size-3" />
                    Add Lesson
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl ios-press gap-1.5 text-[12px] h-8 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
                    onClick={onAddQuiz}
                  >
                    <Plus className="size-3" />
                    Add Quiz
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl ios-press gap-1.5 text-[12px] h-8 border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-400 dark:hover:bg-teal-950/30"
                    onClick={onAddAssignment}
                  >
                    <Plus className="size-3" />
                    Add Assignment
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl ios-press gap-1.5 text-[12px] h-8 border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/30"
                    onClick={() => toast.info('Live sessions can be scheduled after publishing the course')}
                  >
                    <Plus className="size-3" />
                    Add Live Session
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main Component ───

export function Step2Curriculum({
  form,
  onFormChange,
  onEditLesson,
  onPrevious,
  onNext,
  courseId,
}: Step2CurriculumProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [addingType, setAddingType] = useState<Record<string, 'lesson' | 'quiz' | 'assignment' | null>>({})
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiGenerating, setAiGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  const modules = form.modules

  // Computed: if no modules expanded but modules exist, treat first as expanded
  const effectiveExpanded = useMemo(() => {
    if (expandedModules.size === 0 && modules.length > 0) {
      return new Set([modules[0].id])
    }
    return expandedModules
  }, [expandedModules, modules])

  const toggleModule = (id: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ─── Module CRUD ───

  const addModule = () => {
    if (!newModuleTitle.trim()) return
    const newMod: WizardModule = {
      id: generateId('mod'),
      title: newModuleTitle.trim(),
      description: '',
      order: modules.length + 1,
      learningObjectives: [],
      isPublished: false,
      lessons: [],
      quizzes: [],
      expanded: true,
    }
    onFormChange({ modules: [...modules, newMod] })
    setExpandedModules(new Set([...effectiveExpanded, newMod.id]))
    setNewModuleTitle('')
    toast.success('Module added!')
  }

  const updateModuleTitle = (moduleId: string, title: string) => {
    onFormChange({
      modules: modules.map(m => m.id === moduleId ? { ...m, title } : m)
    })
  }

  const deleteModule = (moduleId: string) => {
    onFormChange({ modules: modules.filter(m => m.id !== moduleId) })
    setExpandedModules((prev) => {
      const next = new Set(prev)
      next.delete(moduleId)
      return next
    })
    toast.success('Module deleted')
  }

  const moveModule = (moduleId: string, direction: 'up' | 'down') => {
    const idx = modules.findIndex(m => m.id === moduleId)
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === modules.length - 1)) return
    const updated = [...modules]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    ;[updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]]
    updated.forEach((m, i) => { m.order = i + 1 })
    onFormChange({ modules: updated })
  }

  // ─── Lesson CRUD ───

  const addLessonToModule = (moduleId: string, lesson: WizardLesson) => {
    const mod = modules.find(m => m.id === moduleId)
    if (!mod) return
    lesson.order = mod.lessons.length + 1
    onFormChange({
      modules: modules.map(m =>
        m.id === moduleId ? { ...m, lessons: [...m.lessons, lesson] } : m
      )
    })
    setAddingType(prev => ({ ...prev, [moduleId]: null }))
    toast.success('Lesson added!')
  }

  const deleteLesson = (moduleId: string, lessonId: string) => {
    onFormChange({
      modules: modules.map(m =>
        m.id === moduleId ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) } : m
      )
    })
    toast.success('Lesson removed')
  }

  // ─── Quiz CRUD ───

  const addQuizToModule = (moduleId: string, quiz: WizardQuiz) => {
    onFormChange({
      modules: modules.map(m =>
        m.id === moduleId ? { ...m, quizzes: [...m.quizzes, quiz] } : m
      )
    })
    setAddingType(prev => ({ ...prev, [moduleId]: null }))
    toast.success('Quiz added!')
  }

  const deleteQuiz = (moduleId: string, quizId: string) => {
    onFormChange({
      modules: modules.map(m =>
        m.id === moduleId ? { ...m, quizzes: m.quizzes.filter(q => q.id !== quizId) } : m
      )
    })
    toast.success('Quiz removed')
  }

  // ─── Assignment CRUD ───

  const addAssignmentToModule = (moduleId: string, assignment: WizardAssignment) => {
    // Assignments are stored as lessons with type 'assignment'
    const lesson: WizardLesson = {
      id: assignment.id,
      title: assignment.title,
      description: assignment.instructions,
      content: assignment.instructions,
      type: 'assignment',
      videoUrl: '',
      duration: 0,
      order: (modules.find(m => m.id === moduleId)?.lessons.length || 0) + 1,
      resources: [],
      objectives: [],
      isFree: false,
      isPublished: false,
      transcript: '',
      slideUrl: '',
      captions: { mode: 'none', languages: [] },
    }
    addLessonToModule(moduleId, lesson)
    toast.success('Assignment added!')
  }

  // ─── AI Curriculum Generation ───

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please describe the curriculum you want to generate')
      return
    }
    setAiGenerating(true)
    try {
      const res = await fetch('/api/instructor/ai/generate-curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          title: form.title,
          category: form.category,
          level: form.difficultyLevel,
          sections: 5,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.modules && Array.isArray(data.modules)) {
          const generatedModules: WizardModule[] = data.modules.map((mod: any, idx: number) => ({
            id: generateId('mod'),
            title: mod.title || `Module ${idx + 1}`,
            description: mod.description || '',
            order: modules.length + idx + 1,
            learningObjectives: mod.objectives || [],
            isPublished: false,
            lessons: (mod.lessons || []).map((l: any, lIdx: number) => ({
              id: generateId('lesson'),
              title: l.title || `Lesson ${lIdx + 1}`,
              description: l.description || '',
              content: l.content || '',
              type: l.type || 'text',
              videoUrl: '',
              duration: l.duration || 15,
              order: lIdx + 1,
              resources: [],
              objectives: [],
              isFree: lIdx === 0,
              isPublished: false,
              transcript: '',
              slideUrl: '',
              captions: { mode: 'none', languages: [] },
            })),
            quizzes: [],
          }))
          onFormChange({ modules: [...modules, ...generatedModules] })
          setExpandedModules(new Set([...effectiveExpanded, ...generatedModules.map(m => m.id)]))
          setAiPrompt('')
          toast.success(`Generated ${generatedModules.length} modules!`, {
            description: `${generatedModules.reduce((a, m) => a + m.lessons.length, 0)} lessons created. Feel free to edit or reorder.`
          })
        } else {
          // API returned text instead of structured JSON — fallback to template
          throw new Error('Unexpected API response format')
        }
      } else {
        throw new Error('Failed to generate curriculum')
      }
    } catch {
      toast.error('AI curriculum generation failed', { description: 'Falling back to template...' })
      // Fallback: generate a simple template
      const generatedModules: WizardModule[] = [
        {
          id: generateId('mod'),
          title: 'Introduction & Fundamentals',
          description: 'Get started with the core concepts',
          order: modules.length + 1,
          learningObjectives: ['Understand the basics', 'Set up your environment'],
          isPublished: false,
          lessons: [
            { id: generateId('lesson'), title: 'Welcome & Course Overview', description: '', content: '', type: 'video', videoUrl: '', duration: 10, order: 1, resources: [], objectives: [], isFree: true, isPublished: false, transcript: '', slideUrl: '', captions: { mode: 'none', languages: [] } },
            { id: generateId('lesson'), title: 'Core Concepts', description: '', content: '', type: 'text', videoUrl: '', duration: 15, order: 2, resources: [], objectives: [], isFree: false, isPublished: false, transcript: '', slideUrl: '', captions: { mode: 'none', languages: [] } },
          ],
          quizzes: [],
        },
      ]
      onFormChange({ modules: [...modules, ...generatedModules] })
      setExpandedModules(new Set([...effectiveExpanded, ...generatedModules.map(m => m.id)]))
      setAiPrompt('')
    } finally {
      setAiGenerating(false)
    }
  }

  // ─── Computed ───

  const totalLessons = useMemo(() => modules.reduce((a, m) => a + m.lessons.length, 0), [modules])
  const totalDuration = useMemo(() => modules.reduce((a, m) => a + m.lessons.reduce((b, l) => b + l.duration, 0), 0), [modules])
  const totalQuizzes = useMemo(() => modules.reduce((a, m) => a + m.quizzes.length, 0), [modules])

  const canProceed = modules.length > 0 && totalLessons > 0

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
      >
        {/* ─── AI Curriculum Generator ─── */}
        <div className="rounded-2xl ios-shadow-sm bg-gradient-to-r from-primary/5 to-teal-500/5 border border-primary/10 p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="size-5 text-primary" />
            <span className="text-[14px] font-semibold">AI Curriculum Generator</span>
            <Badge variant="outline" className="text-[10px] h-5 rounded-lg bg-primary/10 text-primary border-primary/20">
              Beta
            </Badge>
          </div>
          <p className="text-[12px] text-muted-foreground mb-3">
            Describe your course topic and audience, and AI will generate a complete curriculum structure.
          </p>
          <div className="flex gap-2">
            <Input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="h-10 rounded-xl text-[13px] flex-1"
              placeholder="e.g. A Python programming course for beginners covering basics to OOP..."
              onKeyDown={(e) => e.key === 'Enter' && handleAIGenerate()}
            />
            <Button
              onClick={handleAIGenerate}
              disabled={aiGenerating || !aiPrompt.trim()}
              className="rounded-xl ios-press gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            >
              {aiGenerating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Generate
            </Button>
          </div>
        </div>

        {/* ─── Stats Strip ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Modules', value: modules.length, icon: Layers, color: 'text-primary' },
            { label: 'Lessons', value: totalLessons, icon: BookOpen, color: 'text-emerald-600' },
            { label: 'Quizzes', value: totalQuizzes, icon: HelpCircle, color: 'text-amber-600' },
            { label: 'Duration', value: formatDuration(totalDuration), icon: Clock, color: 'text-teal-600' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl ios-shadow-sm bg-card p-3 text-center">
              <stat.icon className={cn('size-4 mx-auto mb-1', stat.color)} />
              <p className="text-[17px] font-bold">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ─── Modules List ─── */}
        <div className="space-y-2">
          <AnimatePresence>
            {modules.map((mod, idx) => (
              <ModuleCard
                key={mod.id}
                module={mod}
                index={idx}
                isExpanded={effectiveExpanded.has(mod.id)}
                onToggle={() => toggleModule(mod.id)}
                onTitleChange={(title) => updateModuleTitle(mod.id, title)}
                onDelete={() => deleteModule(mod.id)}
                onMoveUp={() => moveModule(mod.id, 'up')}
                onMoveDown={() => moveModule(mod.id, 'down')}
                onAddLesson={() => setAddingType(prev => ({ ...prev, [mod.id]: 'lesson' }))}
                onAddQuiz={() => setAddingType(prev => ({ ...prev, [mod.id]: 'quiz' }))}
                onAddAssignment={() => setAddingType(prev => ({ ...prev, [mod.id]: 'assignment' }))}
                onEditLesson={(lessonId) => onEditLesson(mod.id, lessonId)}
                onDeleteLesson={(lessonId) => deleteLesson(mod.id, lessonId)}
                onDeleteQuiz={(quizId) => deleteQuiz(mod.id, quizId)}
                canMoveUp={idx > 0}
                canMoveDown={idx < modules.length - 1}
                addingType={addingType[mod.id] || null}
                onAddLessonSubmit={addLessonToModule}
                onAddQuizSubmit={addQuizToModule}
                onAddAssignmentSubmit={addAssignmentToModule}
                onCancelAdd={() => setAddingType(prev => ({ ...prev, [mod.id]: null }))}
                aiGenerating={aiGenerating}
                onAIGenerate={handleAIGenerate}
              />
            ))}
          </AnimatePresence>

          {/* Empty State */}
          {modules.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={SPRING}
              className="text-center py-12 rounded-2xl border-2 border-dashed border-border"
            >
              <Layers className="mx-auto size-10 text-muted-foreground/30" />
              <p className="mt-3 text-[15px] font-semibold text-muted-foreground">No modules yet</p>
              <p className="text-[12px] text-muted-foreground/70 mt-1">
                Add your first module below, or use AI to generate a curriculum
              </p>
            </motion.div>
          )}
        </div>

        {/* ─── Add New Module ─── */}
        <div className="mt-4 flex items-center gap-2">
          <Input
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            className="h-10 rounded-xl text-[13px] flex-1"
            placeholder="New module title..."
            onKeyDown={(e) => e.key === 'Enter' && addModule()}
          />
          <Button
            onClick={addModule}
            disabled={!newModuleTitle.trim()}
            className="rounded-xl ios-press gap-1.5"
          >
            <Plus className="size-4" />
            Add Module
          </Button>
        </div>

        {/* ─── Lesson Type Legend ─── */}
        <div className="mt-6 rounded-2xl ios-shadow-sm bg-card p-4">
          <p className="text-[12px] font-semibold text-muted-foreground mb-2">Lesson Types</p>
          <div className="flex flex-wrap gap-3">
            {LESSON_TYPES.map((lt) => (
              <div key={lt.value} className="flex items-center gap-1.5">
                <div className={cn('flex size-5 items-center justify-center rounded-md text-[10px]', lt.color)}>
                  {lt.icon}
                </div>
                <span className="text-[11px] text-muted-foreground">{lt.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Estimated Total Duration ─── */}
        {totalDuration > 0 && (
          <div className="mt-3 rounded-2xl ios-shadow-sm bg-gradient-to-r from-primary/5 to-teal-500/5 border border-primary/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="size-5 text-primary" />
                <span className="text-[14px] font-semibold">Estimated Total Duration</span>
              </div>
              <span className="text-[20px] font-bold text-primary">{formatDuration(totalDuration)}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Based on {totalLessons} lesson{totalLessons !== 1 ? 's' : ''} across {modules.length} module{modules.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* ─── Navigation ─── */}
        <div className="flex items-center justify-between pt-4 mt-4">
          <Button
            variant="outline"
            className="rounded-2xl ios-press"
            onClick={onPrevious}
          >
            <ChevronUp className="size-4 mr-1 rotate-[-90deg]" />
            Previous
          </Button>
          <Button
            onClick={() => {
              if (!canProceed) {
                toast.error('Please add at least one module with a lesson')
                return
              }
              onNext()
            }}
            disabled={!canProceed}
            className={cn(
              'rounded-2xl ios-press gap-2 min-w-[160px]',
              canProceed
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                : ''
            )}
          >
            Next: Content
            <ChevronDown className="size-4 -rotate-90" />
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default Step2Curriculum
