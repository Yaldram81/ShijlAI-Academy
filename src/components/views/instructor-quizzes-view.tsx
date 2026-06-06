'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Plus, HelpCircle, Sparkles, LayoutGrid, List,
  BookOpen, Clock, Target, RotateCcw, ChevronDown,
  CheckCircle2, X, ArrowRight, PenTool, Eye, Trash2,
  Copy, Loader2, BarChart3, Users, Award, Zap,
  FileText, Type, ToggleLeft, MessageSquare, Lightbulb,
  ChevronRight, AlertCircle, Settings, PlayCircle,
  TrendingUp, Hash,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { InstructorStatCard, InstructorStatCardGrid } from '@/components/instructor/instructor-stat-card'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import type { QuizType, QuestionType } from '@/lib/types'

// ============================================================
// Types
// ============================================================
interface QuizAttemptStats {
  totalAttempts: number
  completedAttempts: number
  passRate: number
  avgScore: number
}

interface InstructorQuiz {
  id: string
  title: string
  description: string | null
  type: QuizType
  timeLimit: number
  passingScore: number
  maxAttempts: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
  course: { id: string; title: string }
  questionCount: number
  attemptStats: QuizAttemptStats
}

interface QuizSummary {
  totalQuizzes: number
  publishedCount: number
  draftCount: number
  byType: {
    practice: number
    assessment: number
    diagnostic: number
    certification: number
  }
  avgPassRate: number
  totalAttempts: number
}

interface QuizQuestion {
  id?: string
  text: string
  type: QuestionType
  options: string[]
  correctAnswer: string
  explanation: string
  points: number
  order: number
}

type TypeFilter = 'all' | QuizType
type StatusFilter = 'all' | 'published' | 'draft'
type SortOption = 'createdAt' | 'title' | 'passingScore' | 'updatedAt'
type ViewMode = 'grid' | 'list'

// ============================================================
// Constants
// ============================================================
const typeConfig: Record<QuizType, { label: string; color: string; bgColor: string; icon: typeof BookOpen }> = {
  practice: {
    label: 'Practice',
    color: 'text-teal-700 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-950/40',
    icon: BookOpen,
  },
  assessment: {
    label: 'Assessment',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950/40',
    icon: Target,
  },
  diagnostic: {
    label: 'Diagnostic',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-950/40',
    icon: Zap,
  },
  certification: {
    label: 'Certification',
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-950/40',
    icon: Award,
  },
}

const typeGradients: Record<QuizType, string> = {
  practice: 'from-teal-500 to-teal-600',
  assessment: 'from-emerald-500 to-emerald-600',
  diagnostic: 'from-amber-500 to-amber-600',
  certification: 'from-purple-500 to-purple-600',
}

const statusConfig: Record<string, { label: string; color: string; dotColor: string }> = {
  published: { label: 'Published', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400', dotColor: 'bg-emerald-500' },
  draft: { label: 'Draft', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400', dotColor: 'bg-amber-500' },
}

const questionTypeConfig: Record<QuestionType, { label: string; icon: typeof Type }> = {
  mcq: { label: 'Multiple Choice', icon: List },
  true_false: { label: 'True / False', icon: ToggleLeft },
  fill_blank: { label: 'Fill in the Blank', icon: Type },
  short_answer: { label: 'Short Answer', icon: MessageSquare },
}

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'title', label: 'Title' },
  { value: 'passingScore', label: 'Pass Rate' },
  { value: 'updatedAt', label: 'Last Updated' },
]

const spring = { type: 'spring' as const, stiffness: 400, damping: 25 }
const springGentle = { type: 'spring' as const, stiffness: 300, damping: 30 }

// ============================================================
// Circular Score Indicator
// ============================================================
function CircularScore({ value, size = 56, strokeWidth = 4, colorClass = 'text-emerald-500' }: {
  value: number
  size?: number
  strokeWidth?: number
  colorClass?: string
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          strokeLinecap="round"
          className={colorClass}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[12px] font-bold">{value}%</span>
      </div>
    </div>
  )
}

// ============================================================
// Empty State Component
// ============================================================
function EmptyState({ type, onAction }: { type: 'no-quizzes' | 'no-matching'; onAction?: () => void }) {
  const config = {
    'no-quizzes': {
      icon: HelpCircle,
      title: 'Create Your First Quiz',
      description: 'Build engaging quizzes with multiple question types, set passing scores, and track student performance.',
      actionLabel: 'Create Quiz',
      gradient: 'from-emerald-500 to-teal-600',
    },
    'no-matching': {
      icon: Search,
      title: 'No quizzes match your filters',
      description: 'Try adjusting your search or filter criteria to find what you\'re looking for.',
      actionLabel: 'Clear Filters',
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
      <div className={cn('flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br text-white ios-shadow-lg mb-6', c.gradient)}>
        <Icon className="size-10" />
      </div>
      <h3 className="text-[22px] font-bold text-foreground mb-2">{c.title}</h3>
      <p className="text-[14px] text-muted-foreground text-center max-w-md mb-6">{c.description}</p>
      {onAction && (
        <Button
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white ios-press"
          onClick={onAction}
        >
          <Plus className="mr-2 size-4" />
          {c.actionLabel}
        </Button>
      )}
    </motion.div>
  )
}

// ============================================================
// Quiz Detail Sheet
// ============================================================
function QuizDetailSheet({
  quiz,
  open,
  onClose,
}: {
  quiz: InstructorQuiz | null
  open: boolean
  onClose: () => void
}) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([])

  useEffect(() => {
    if (!quiz || !open) return
    let cancelled = false
    const loadQuestions = async () => {
      try {
        const res = await fetch(`/api/instructor/quizzes/${quiz!.id}`)
        if (cancelled) return
        if (res.ok) {
          const data = await res.json()
          setQuestions(data.quiz?.questions || [])
        } else {
          setQuestions([])
        }
      } catch {
        if (!cancelled) setQuestions([])
      } finally {
        if (!cancelled) setLoadingQuestions(false)
      }
    }
    setLoadingQuestions(true)
    loadQuestions()
    return () => { cancelled = true }
  }, [quiz, open])

  if (!quiz) return null

  const tc = typeConfig[quiz.type]
  const TypeIcon = tc.icon

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl p-0 rounded-l-3xl overflow-hidden">
        {/* Header */}
        <div className={cn('bg-gradient-to-r p-6 text-white', typeGradients[quiz.type])}>
          <SheetHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white/20">
                <TypeIcon className="size-5" />
              </div>
              <Badge className="bg-white/20 text-white border-0 text-[11px]">{tc.label}</Badge>
              <Badge className={cn('text-[11px] border-0', quiz.isPublished ? 'bg-emerald-600/50 text-white' : 'bg-amber-500/50 text-white')}>
                {quiz.isPublished ? 'Published' : 'Draft'}
              </Badge>
            </div>
            <SheetTitle className="text-[22px] font-bold text-white text-left">{quiz.title}</SheetTitle>
            <SheetDescription className="text-white/70 text-[13px] text-left mt-1">
              {quiz.description || 'No description provided'}
            </SheetDescription>
          </SheetHeader>
        </div>

        <ScrollArea className="h-[calc(100vh-220px)]">
          <div className="p-6 space-y-6">
            {/* Quick Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-accent/30 p-3 text-center">
                <BookOpen className="size-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-[17px] font-bold">{quiz.questionCount}</p>
                <p className="text-[11px] text-muted-foreground">Questions</p>
              </div>
              <div className="rounded-xl bg-accent/30 p-3 text-center">
                <Clock className="size-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-[17px] font-bold">{quiz.timeLimit > 0 ? `${quiz.timeLimit}m` : 'None'}</p>
                <p className="text-[11px] text-muted-foreground">Time Limit</p>
              </div>
              <div className="rounded-xl bg-accent/30 p-3 text-center">
                <Target className="size-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-[17px] font-bold">{quiz.passingScore}%</p>
                <p className="text-[11px] text-muted-foreground">Pass Score</p>
              </div>
              <div className="rounded-xl bg-accent/30 p-3 text-center">
                <RotateCcw className="size-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-[17px] font-bold">{quiz.maxAttempts || '∞'}</p>
                <p className="text-[11px] text-muted-foreground">Max Attempts</p>
              </div>
            </div>

            {/* Course & Stats */}
            <div className="rounded-2xl ios-shadow-sm bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="size-4 text-primary" />
                  <span className="text-[14px] font-medium">{quiz.course.title}</span>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="text-[11px] text-muted-foreground">Attempts</p>
                  <p className="text-[17px] font-bold">{quiz.attemptStats.totalAttempts}</p>
                </div>
                <div className="text-center">
                  <p className="text-[11px] text-muted-foreground">Pass Rate</p>
                  <p className="text-[17px] font-bold text-emerald-600 dark:text-emerald-400">{quiz.attemptStats.passRate}%</p>
                </div>
                <div className="text-center">
                  <p className="text-[11px] text-muted-foreground">Avg Score</p>
                  <p className="text-[17px] font-bold">{quiz.attemptStats.avgScore}%</p>
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-3">
              <h3 className="text-[17px] font-bold flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                Questions ({questions.length || quiz.questionCount})
              </h3>

              {loadingQuestions ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : questions.length > 0 ? (
                <Accordion
                  type="multiple"
                  value={expandedQuestions}
                  onValueChange={setExpandedQuestions}
                  className="space-y-2"
                >
                  {questions.map((q, idx) => {
                    const QtConfig = questionTypeConfig[q.type]
                    const QtIcon = QtConfig.icon
                    const parsedOptions = q.type === 'mcq' && q.options.length > 0 ? q.options : []

                    return (
                      <AccordionItem
                        key={q.id || idx}
                        value={q.id || String(idx)}
                        className="rounded-2xl ios-shadow-sm bg-card border-0 overflow-hidden"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3 flex-1 text-left">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-[12px] shrink-0">
                              {idx + 1}
                            </div>
                            <QtIcon className="size-4 text-muted-foreground shrink-0" />
                            <p className="text-[14px] font-medium truncate flex-1">{q.text}</p>
                            <Badge variant="outline" className="text-[10px] rounded-lg shrink-0">{q.points}pt</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4 space-y-3">
                          {/* MCQ Options */}
                          {parsedOptions.length > 0 && (
                            <div className="space-y-1.5">
                              {parsedOptions.map((opt, oi) => (
                                <div
                                  key={oi}
                                  className={cn(
                                    'rounded-xl px-3 py-2 text-[13px] flex items-center gap-2',
                                    opt === q.correctAnswer
                                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-medium'
                                      : 'bg-accent/30 text-muted-foreground'
                                  )}
                                >
                                  <span className="flex size-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0 bg-muted">
                                    {String.fromCharCode(65 + oi)}
                                  </span>
                                  {opt}
                                  {opt === q.correctAnswer && (
                                    <CheckCircle2 className="size-4 text-emerald-600 ml-auto shrink-0" />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* True/False */}
                          {q.type === 'true_false' && (
                            <div className="flex gap-2">
                              <div className={cn(
                                'rounded-xl px-4 py-2 text-[13px] flex items-center gap-2',
                                q.correctAnswer === 'true'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-medium'
                                  : 'bg-accent/30 text-muted-foreground'
                              )}>
                                True {q.correctAnswer === 'true' && <CheckCircle2 className="size-4" />}
                              </div>
                              <div className={cn(
                                'rounded-xl px-4 py-2 text-[13px] flex items-center gap-2',
                                q.correctAnswer === 'false'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-medium'
                                  : 'bg-accent/30 text-muted-foreground'
                              )}>
                                False {q.correctAnswer === 'false' && <CheckCircle2 className="size-4" />}
                              </div>
                            </div>
                          )}

                          {/* Fill blank / Short answer answer */}
                          {(q.type === 'fill_blank' || q.type === 'short_answer') && (
                            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-[13px]">
                              <span className="text-muted-foreground">Answer: </span>
                              <span className="font-medium text-emerald-700 dark:text-emerald-400">{q.correctAnswer}</span>
                            </div>
                          )}

                          {/* Explanation */}
                          {q.explanation && (
                            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-[12px] flex items-start gap-2">
                              <Lightbulb className="size-4 text-amber-600 shrink-0 mt-0.5" />
                              <span className="text-amber-700 dark:text-amber-400">{q.explanation}</span>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              ) : (
                <div className="text-center py-8 rounded-2xl border-2 border-dashed border-border">
                  <FileText className="mx-auto size-8 text-muted-foreground/40" />
                  <p className="mt-2 text-[14px] text-muted-foreground">No questions yet</p>
                  <p className="text-[12px] text-muted-foreground/70">Add questions to this quiz</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white ios-press">
                <PenTool className="mr-2 size-4" />
                Edit Quiz
              </Button>
              <Button variant="outline" className="flex-1 rounded-xl ios-press">
                <PlayCircle className="mr-2 size-4" />
                Preview
              </Button>
              <Button variant="outline" className="rounded-xl ios-press">
                <BarChart3 className="mr-2 size-4" />
                Attempts
              </Button>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

// ============================================================
// Create Quiz Dialog (Multi-step)
// ============================================================
function CreateQuizDialog({
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
  const [step, setStep] = useState(0)
  const [creating, setCreating] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'practice' as QuizType,
    courseId: '',
    moduleId: '',
    timeLimit: 0,
    passingScore: 70,
    maxAttempts: 0,
  })
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [aiTopic, setAiTopic] = useState('')

  // Fetch instructor courses
  useEffect(() => {
    if (open) {
      fetch(`/api/instructor/courses?instructorId=${instructorId}`)
        .then(res => res.json())
        .then(data => setCourses(data.courses?.map((c: { id: string; title: string }) => ({ id: c.id, title: c.title })) || []))
        .catch(() => setCourses([]))
    }
  }, [open, instructorId])

  const steps = [
    { title: 'Basic Info', icon: PenTool, desc: 'Title & type' },
    { title: 'Settings', icon: Settings, desc: 'Time & passing' },
    { title: 'Questions', icon: FileText, desc: 'Add questions' },
    { title: 'Review', icon: CheckCircle2, desc: 'Confirm' },
  ]

  const canProceed = () => {
    switch (step) {
      case 0: return form.title.trim().length >= 3 && !!form.courseId
      case 1: return form.passingScore > 0 && form.passingScore <= 100
      case 2: return questions.length > 0
      case 3: return true
      default: return false
    }
  }

  const addQuestion = () => {
    setQuestions([...questions, {
      text: '',
      type: 'mcq',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      points: 10,
      order: questions.length + 1,
    }])
  }

  const updateQuestion = (index: number, updates: Partial<QuizQuestion>) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], ...updates }
    // Reset options/correctAnswer when type changes
    if (updates.type) {
      if (updates.type === 'mcq') {
        updated[index].options = ['', '', '', '']
        updated[index].correctAnswer = ''
      } else if (updates.type === 'true_false') {
        updated[index].options = []
        updated[index].correctAnswer = 'true'
      } else {
        updated[index].options = []
        updated[index].correctAnswer = ''
      }
    }
    setQuestions(updated)
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index).map((q, i) => ({ ...q, order: i + 1 })))
  }

  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) return
    setAiGenerating(true)
    try {
      const res = await fetch('/api/instructor/ai/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic, type: form.type, count: 5 }),
      })
      if (!res.ok) throw new Error('AI generation failed')
      const data = await res.json()
      if (data.questions?.length) {
        setQuestions(data.questions.map((q: QuizQuestion, i: number) => ({ ...q, order: i + 1 })))
        toast.success(`Generated ${data.questions.length} questions!`)
      }
    } catch {
      // Fallback: generate sample questions
      const sampleQuestions: QuizQuestion[] = [
        { text: `What is the primary concept of ${aiTopic}?`, type: 'mcq', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctAnswer: 'Option A', explanation: `The primary concept involves the foundational principles of ${aiTopic}.`, points: 10, order: 1 },
        { text: `${aiTopic} is essential for modern education.`, type: 'true_false', options: [], correctAnswer: 'true', explanation: `This is generally considered true in the context of ${aiTopic}.`, points: 5, order: 2 },
        { text: `The key term in ${aiTopic} is _____.`, type: 'fill_blank', options: [], correctAnswer: 'foundational concept', explanation: `The foundational concept is central to understanding ${aiTopic}.`, points: 10, order: 3 },
      ]
      setQuestions(sampleQuestions)
      toast.success('Generated 3 sample questions!')
    } finally {
      setAiGenerating(false)
    }
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/instructor/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId,
          ...form,
          questions: questions.map(q => ({
            text: q.text,
            type: q.type,
            options: q.type === 'mcq' ? JSON.stringify(q.options) : '[]',
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || null,
            points: q.points,
          })),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create quiz')
      }
      toast.success('Quiz created successfully!')
      onCreated()
      onClose()
      // Reset
      setStep(0)
      setForm({ title: '', description: '', type: 'practice', courseId: '', moduleId: '', timeLimit: 0, passingScore: 70, maxAttempts: 0 })
      setQuestions([])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create quiz')
    } finally {
      setCreating(false)
    }
  }

  const totalPoints = questions.reduce((acc, q) => acc + q.points, 0)

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="rounded-3xl p-0 overflow-hidden max-w-3xl max-h-[90vh]">
        {/* Wizard Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
          <DialogTitle className="text-[22px] font-bold text-white">Create New Quiz</DialogTitle>
          <DialogDescription className="text-emerald-100 text-[14px] mt-1">
            Build an engaging quiz with multiple question types
          </DialogDescription>

          {/* Step indicators */}
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

        {/* Step Content */}
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
              {/* Step 0: Basic Info */}
              {step === 0 && (
                <>
                  <div className="space-y-2">
                    <Label className="text-[14px] font-semibold">Quiz Title *</Label>
                    <Input
                      placeholder="e.g. Chapter 5 – Organic Chemistry Review"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="h-12 rounded-xl text-[15px]"
                      maxLength={120}
                    />
                    <p className="text-[12px] text-muted-foreground">{form.title.length}/120 characters</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[14px] font-semibold">Description</Label>
                    <Textarea
                      placeholder="Brief description of this quiz..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="rounded-xl text-[15px] min-h-[80px] resize-y"
                      maxLength={500}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[14px] font-semibold">Quiz Type *</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.entries(typeConfig) as [QuizType, typeof typeConfig.practice][]).map(([key, cfg]) => {
                        const Icon = cfg.icon
                        return (
                          <button
                            key={key}
                            onClick={() => setForm({ ...form, type: key })}
                            className={cn(
                              'rounded-xl px-4 py-3 text-[13px] font-medium transition-all border flex items-center gap-2',
                              form.type === key
                                ? 'bg-primary text-primary-foreground border-primary ios-shadow-sm'
                                : 'bg-card border-border hover:border-primary/50 text-card-foreground'
                            )}
                          >
                            <Icon className="size-4" />
                            {cfg.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[14px] font-semibold">Course *</Label>
                    <Select value={form.courseId} onValueChange={(v) => setForm({ ...form, courseId: v })}>
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {courses.length === 0 && (
                      <p className="text-[12px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="size-3" /> Create a course first before adding quizzes
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Step 1: Settings */}
              {step === 1 && (
                <>
                  <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-5 text-emerald-600" />
                      <h3 className="text-[15px] font-bold text-emerald-700 dark:text-emerald-400">Quiz Settings</h3>
                    </div>
                    <p className="text-[13px] text-muted-foreground">Configure time limits, passing scores, and attempt rules.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[14px] font-semibold">Time Limit (minutes)</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={0}
                        value={form.timeLimit}
                        onChange={(e) => setForm({ ...form, timeLimit: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="h-11 rounded-xl w-32 text-[15px]"
                      />
                      <span className="text-[13px] text-muted-foreground">0 = No time limit</span>
                    </div>
                    <div className="flex gap-2 mt-1">
                      {[0, 15, 30, 45, 60, 90].map(m => (
                        <button
                          key={m}
                          onClick={() => setForm({ ...form, timeLimit: m })}
                          className={cn(
                            'rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all border',
                            form.timeLimit === m ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/50'
                          )}
                        >
                          {m === 0 ? 'None' : `${m}m`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[14px] font-semibold">Passing Score (%)</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={form.passingScore}
                        onChange={(e) => setForm({ ...form, passingScore: Math.min(100, Math.max(1, parseInt(e.target.value) || 0)) })}
                        className="h-11 rounded-xl w-32 text-[15px]"
                      />
                      <Progress value={form.passingScore} className="flex-1 h-2" />
                    </div>
                    <div className="flex gap-2 mt-1">
                      {[50, 60, 70, 80, 90, 100].map(p => (
                        <button
                          key={p}
                          onClick={() => setForm({ ...form, passingScore: p })}
                          className={cn(
                            'rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all border',
                            form.passingScore === p ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/50'
                          )}
                        >
                          {p}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[14px] font-semibold">Max Attempts</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min={0}
                        value={form.maxAttempts}
                        onChange={(e) => setForm({ ...form, maxAttempts: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="h-11 rounded-xl w-32 text-[15px]"
                      />
                      <span className="text-[13px] text-muted-foreground">0 = Unlimited attempts</span>
                    </div>
                    <div className="flex gap-2 mt-1">
                      {[0, 1, 2, 3, 5].map(a => (
                        <button
                          key={a}
                          onClick={() => setForm({ ...form, maxAttempts: a })}
                          className={cn(
                            'rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all border',
                            form.maxAttempts === a ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/50'
                          )}
                        >
                          {a === 0 ? 'Unlimited' : a}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Questions */}
              {step === 2 && (
                <>
                  {/* AI Generate Section */}
                  <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-5 text-emerald-600" />
                      <h3 className="text-[15px] font-bold text-emerald-700 dark:text-emerald-400">AI Question Generator</h3>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter a topic (e.g. Photosynthesis, Algebra...)"
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        className="h-10 rounded-xl flex-1 text-[14px]"
                        onKeyDown={(e) => e.key === 'Enter' && handleAIGenerate()}
                      />
                      <Button
                        className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white ios-press h-10"
                        onClick={handleAIGenerate}
                        disabled={aiGenerating || !aiTopic.trim()}
                      >
                        {aiGenerating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                        <span className="ml-1.5 hidden sm:inline">Generate</span>
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="text-[15px] font-bold">Questions ({questions.length})</h3>
                    <Button
                      size="sm"
                      className="rounded-xl bg-primary ios-press"
                      onClick={addQuestion}
                    >
                      <Plus className="size-4 mr-1" /> Add Question
                    </Button>
                  </div>

                  {questions.length === 0 ? (
                    <div className="text-center py-10 rounded-2xl border-2 border-dashed border-border">
                      <FileText className="mx-auto size-10 text-muted-foreground/40" />
                      <p className="mt-3 text-[15px] font-medium text-muted-foreground">No questions yet</p>
                      <p className="text-[13px] text-muted-foreground/70">Use AI to generate or add manually</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {questions.map((q, idx) => {
                        const QtConfig = questionTypeConfig[q.type]
                        const QtIcon = QtConfig.icon
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={spring}
                            className="rounded-2xl ios-shadow-sm bg-card p-4 space-y-3"
                          >
                            {/* Question Header */}
                            <div className="flex items-center gap-2">
                              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-[12px] shrink-0">
                                {idx + 1}
                              </div>
                              <Select
                                value={q.type}
                                onValueChange={(v) => updateQuestion(idx, { type: v as QuestionType })}
                              >
                                <SelectTrigger className="h-8 rounded-lg text-[12px] w-[160px]">
                                  <QtIcon className="size-3 mr-1" />
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {(Object.entries(questionTypeConfig) as [QuestionType, typeof questionTypeConfig.mcq][]).map(([key, cfg]) => (
                                    <SelectItem key={key} value={key}>
                                      <div className="flex items-center gap-1.5">
                                        <cfg.icon className="size-3" />
                                        {cfg.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="ml-auto flex items-center gap-1">
                                <Input
                                  type="number"
                                  min={1}
                                  value={q.points}
                                  onChange={(e) => updateQuestion(idx, { points: parseInt(e.target.value) || 1 })}
                                  className="h-8 rounded-lg w-16 text-[12px] text-center"
                                />
                                <span className="text-[11px] text-muted-foreground">pts</span>
                              </div>
                              <button
                                onClick={() => removeQuestion(idx)}
                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 transition-colors"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>

                            {/* Question Text */}
                            <Input
                              placeholder="Enter your question..."
                              value={q.text}
                              onChange={(e) => updateQuestion(idx, { text: e.target.value })}
                              className="h-10 rounded-xl text-[14px]"
                            />

                            {/* MCQ Options */}
                            {q.type === 'mcq' && (
                              <div className="space-y-1.5">
                                {q.options.map((opt, oi) => (
                                  <div key={oi} className="flex items-center gap-2">
                                    <button
                                      onClick={() => updateQuestion(idx, { correctAnswer: opt })}
                                      className={cn(
                                        'flex size-6 items-center justify-center rounded-full text-[10px] font-bold shrink-0 transition-all border-2',
                                        q.correctAnswer === opt
                                          ? 'bg-emerald-500 text-white border-emerald-500'
                                          : 'bg-muted text-muted-foreground border-border hover:border-emerald-300'
                                      )}
                                    >
                                      {String.fromCharCode(65 + oi)}
                                    </button>
                                    <Input
                                      placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                      value={opt}
                                      onChange={(e) => {
                                        const newOpts = [...q.options]
                                        newOpts[oi] = e.target.value
                                        // Update correct answer if it was the old value
                                        const newCorrect = q.correctAnswer === q.options[oi] ? e.target.value : q.correctAnswer
                                        updateQuestion(idx, { options: newOpts, correctAnswer: newCorrect })
                                      }}
                                      className="h-8 rounded-lg text-[13px] flex-1"
                                    />
                                    {q.correctAnswer === opt && (
                                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                                    )}
                                  </div>
                                ))}
                                <p className="text-[11px] text-muted-foreground">Click the letter to mark correct answer</p>
                              </div>
                            )}

                            {/* True/False */}
                            {q.type === 'true_false' && (
                              <div className="flex gap-2">
                                {['true', 'false'].map(val => (
                                  <button
                                    key={val}
                                    onClick={() => updateQuestion(idx, { correctAnswer: val })}
                                    className={cn(
                                      'flex-1 rounded-xl py-2 text-[13px] font-medium transition-all border',
                                      q.correctAnswer === val
                                        ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                                        : 'bg-card border-border hover:border-primary/50'
                                    )}
                                  >
                                    {val === 'true' ? 'True ✓' : 'False ✗'}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Fill in blank / Short answer */}
                            {(q.type === 'fill_blank' || q.type === 'short_answer') && (
                              <div className="space-y-1.5">
                                <Label className="text-[12px] text-muted-foreground">Correct Answer</Label>
                                <Input
                                  placeholder="Enter correct answer..."
                                  value={q.correctAnswer}
                                  onChange={(e) => updateQuestion(idx, { correctAnswer: e.target.value })}
                                  className="h-9 rounded-xl text-[13px]"
                                />
                              </div>
                            )}

                            {/* Explanation */}
                            <Input
                              placeholder="Explanation (optional)..."
                              value={q.explanation}
                              onChange={(e) => updateQuestion(idx, { explanation: e.target.value })}
                              className="h-9 rounded-xl text-[12px]"
                            />
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}

              {/* Step 3: Review */}
              {step === 3 && (
                <>
                  <div className="rounded-2xl ios-shadow-sm bg-card p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('flex size-12 items-center justify-center rounded-xl bg-gradient-to-br text-white', typeGradients[form.type])}>
                        {(() => { const I = typeConfig[form.type].icon; return <I className="size-6" /> })()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[17px] font-bold truncate">{form.title || 'Untitled Quiz'}</h3>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <Badge variant="outline" className="text-[11px] rounded-lg">{typeConfig[form.type].label}</Badge>
                          <Badge variant="outline" className="text-[11px] rounded-lg">{form.timeLimit > 0 ? `${form.timeLimit} min` : 'No limit'}</Badge>
                          <Badge variant="outline" className="text-[11px] rounded-lg">{form.passingScore}% pass</Badge>
                        </div>
                      </div>
                    </div>
                    {form.description && (
                      <p className="text-[13px] text-muted-foreground line-clamp-2">{form.description}</p>
                    )}
                    <Separator />
                    <div className="grid grid-cols-4 gap-3">
                      <div className="text-center p-3 rounded-xl bg-accent/30">
                        <p className="text-[11px] text-muted-foreground">Questions</p>
                        <p className="text-[17px] font-bold">{questions.length}</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-accent/30">
                        <p className="text-[11px] text-muted-foreground">Points</p>
                        <p className="text-[17px] font-bold">{totalPoints}</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-accent/30">
                        <p className="text-[11px] text-muted-foreground">Time</p>
                        <p className="text-[17px] font-bold">{form.timeLimit > 0 ? `${form.timeLimit}m` : '∞'}</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-accent/30">
                        <p className="text-[11px] text-muted-foreground">Attempts</p>
                        <p className="text-[17px] font-bold">{form.maxAttempts || '∞'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Questions Preview */}
                  <div className="space-y-2">
                    <h4 className="text-[14px] font-semibold">Questions Preview</h4>
                    {questions.map((q, idx) => {
                      const QtConfig = questionTypeConfig[q.type]
                      const QtIcon = QtConfig.icon
                      return (
                        <div key={idx} className="rounded-xl bg-accent/20 px-3 py-2 flex items-center gap-2">
                          <span className="text-[12px] font-bold text-primary">{idx + 1}.</span>
                          <QtIcon className="size-3.5 text-muted-foreground" />
                          <p className="text-[13px] truncate flex-1">{q.text || 'Untitled question'}</p>
                          <Badge variant="outline" className="text-[10px] rounded-lg">{q.points}pt</Badge>
                        </div>
                      )
                    })}
                  </div>

                  <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 p-4 flex items-start gap-3">
                    <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-[13px]">
                      <p className="font-semibold text-amber-700 dark:text-amber-400">Quiz will be created as Draft</p>
                      <p className="text-muted-foreground mt-0.5">Publish it when you&apos;re ready for students to access it.</p>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>

        {/* Wizard Footer */}
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
                  <CheckCircle2 className="mr-2 size-4" />
                )}
                Create Quiz
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Delete Confirmation Dialog
// ============================================================
function DeleteQuizDialog({
  quiz,
  deleting,
  onConfirm,
  onCancel,
}: {
  quiz: InstructorQuiz
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
              <DialogTitle className="text-[20px]">Delete Quiz?</DialogTitle>
            </div>
            <DialogDescription className="text-[14px]">
              Are you sure you want to delete <strong className="text-foreground">{quiz.title}</strong>?
              {quiz.attemptStats.totalAttempts > 0 && (
                <span className="block mt-2 text-red-600 dark:text-red-400 font-medium">
                  This quiz has {quiz.attemptStats.totalAttempts} attempt{quiz.attemptStats.totalAttempts !== 1 ? 's' : ''}.
                  All attempt data will be permanently deleted.
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
            disabled={deleting}
            onClick={onConfirm}
          >
            {deleting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />}
            Delete Quiz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Quiz Card Component (Grid Mode)
// ============================================================
function QuizCard({
  quiz,
  index,
  onViewDetail,
  onEditQuestions,
  onViewAttempts,
  onDuplicate,
  onDelete,
}: {
  quiz: InstructorQuiz
  index: number
  onViewDetail: (quiz: InstructorQuiz) => void
  onEditQuestions: (quiz: InstructorQuiz) => void
  onViewAttempts: (quiz: InstructorQuiz) => void
  onDuplicate: (quiz: InstructorQuiz) => void
  onDelete: (quiz: InstructorQuiz) => void
}) {
  const tc = typeConfig[quiz.type]
  const TypeIcon = tc.icon
  const sc = statusConfig[quiz.isPublished ? 'published' : 'draft']
  const scoreColorClass = quiz.attemptStats.passRate >= 70
    ? 'text-emerald-500'
    : quiz.attemptStats.passRate >= 40
    ? 'text-amber-500'
    : 'text-red-500'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: index * 0.04 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="rounded-2xl ios-shadow-sm bg-card overflow-hidden group cursor-pointer"
      onClick={() => onViewDetail(quiz)}
    >
      {/* Top gradient strip */}
      <div className={cn('h-1.5 bg-gradient-to-r', typeGradients[quiz.type])} />

      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start gap-2">
          <div className={cn('flex size-8 items-center justify-center rounded-lg shrink-0', tc.bgColor, tc.color)}>
            <TypeIcon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-bold truncate line-clamp-1">{quiz.title}</h3>
            {quiz.description && (
              <p className="text-[12px] text-muted-foreground line-clamp-1 mt-0.5">{quiz.description}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors opacity-0 group-hover:opacity-100">
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditQuestions(quiz) }}>
                <PenTool className="mr-2 size-4" /> Edit Questions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewAttempts(quiz) }}>
                <BarChart3 className="mr-2 size-4" /> View Attempts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(quiz) }}>
                <Copy className="mr-2 size-4" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 dark:text-red-400"
                onClick={(e) => { e.stopPropagation(); onDelete(quiz) }}
              >
                <Trash2 className="mr-2 size-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Course pill + Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px] rounded-lg font-medium">
            <BookOpen className="mr-1 size-3" />
            {quiz.course.title.length > 20 ? quiz.course.title.slice(0, 20) + '...' : quiz.course.title}
          </Badge>
          <Badge className={cn('text-[10px] rounded-lg border-0', sc.color)}>
            <span className={cn('size-1.5 rounded-full mr-1', sc.dotColor)} />
            {sc.label}
          </Badge>
        </div>

        {/* Info badges row */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px] rounded-lg">
            <Hash className="mr-1 size-3" />
            {quiz.questionCount} Q
          </Badge>
          {quiz.timeLimit > 0 && (
            <Badge variant="outline" className="text-[10px] rounded-lg">
              <Clock className="mr-1 size-3" />
              {quiz.timeLimit}m
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px] rounded-lg">
            <Target className="mr-1 size-3" />
            {quiz.passingScore}%
          </Badge>
          <Badge variant="outline" className="text-[10px] rounded-lg">
            <RotateCcw className="mr-1 size-3" />
            {quiz.maxAttempts || '∞'}
          </Badge>
        </div>

        <Separator />

        {/* Attempt Stats + Circular Score */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <Users className="size-3.5 text-muted-foreground" />
              <span className="text-[12px] text-muted-foreground">{quiz.attemptStats.totalAttempts} attempts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-muted-foreground" />
              <span className="text-[12px] text-muted-foreground">Avg: {quiz.attemptStats.avgScore}%</span>
            </div>
          </div>
          <CircularScore value={quiz.attemptStats.passRate} colorClass={scoreColorClass} />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 rounded-xl text-[12px] h-8 ios-press"
            onClick={(e) => { e.stopPropagation(); onEditQuestions(quiz) }}
          >
            <PenTool className="mr-1.5 size-3" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 rounded-xl text-[12px] h-8 ios-press"
            onClick={(e) => { e.stopPropagation(); onViewAttempts(quiz) }}
          >
            <Eye className="mr-1.5 size-3" />
            Attempts
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl text-[12px] h-8 ios-press px-2"
            onClick={(e) => { e.stopPropagation(); onDuplicate(quiz) }}
          >
            <Copy className="size-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="rounded-xl text-[12px] h-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-2"
            onClick={(e) => { e.stopPropagation(); onDelete(quiz) }}
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ============================================================
// Quiz List Row Component (List Mode)
// ============================================================
function QuizListRow({
  quiz,
  index,
  onViewDetail,
  onEditQuestions,
  onViewAttempts,
  onDuplicate,
  onDelete,
}: {
  quiz: InstructorQuiz
  index: number
  onViewDetail: (quiz: InstructorQuiz) => void
  onEditQuestions: (quiz: InstructorQuiz) => void
  onViewAttempts: (quiz: InstructorQuiz) => void
  onDuplicate: (quiz: InstructorQuiz) => void
  onDelete: (quiz: InstructorQuiz) => void
}) {
  const tc = typeConfig[quiz.type]
  const TypeIcon = tc.icon
  const sc = statusConfig[quiz.isPublished ? 'published' : 'draft']

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...spring, delay: index * 0.03 }}
      onClick={() => onViewDetail(quiz)}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl ios-shadow-sm bg-card hover:bg-accent/20 transition-colors cursor-pointer group"
    >
      <div className={cn('flex size-9 items-center justify-center rounded-lg shrink-0', tc.bgColor, tc.color)}>
        <TypeIcon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="text-[14px] font-semibold truncate">{quiz.title}</h4>
          <Badge className={cn('text-[9px] rounded-md border-0 px-1.5 py-0', sc.color)}>
            {sc.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-muted-foreground truncate">{quiz.course.title}</span>
          <span className="text-[11px] text-muted-foreground">·</span>
          <span className="text-[11px] text-muted-foreground">{quiz.questionCount} Q</span>
          <span className="text-[11px] text-muted-foreground">·</span>
          <span className="text-[11px] text-muted-foreground">{quiz.attemptStats.passRate}% pass</span>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-4 text-[12px] text-muted-foreground">
        {quiz.timeLimit > 0 && (
          <span className="flex items-center gap-1"><Clock className="size-3" />{quiz.timeLimit}m</span>
        )}
        <span className="flex items-center gap-1"><Users className="size-3" />{quiz.attemptStats.totalAttempts}</span>
        <span className="flex items-center gap-1"><TrendingUp className="size-3" />{quiz.attemptStats.avgScore}%</span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors opacity-0 group-hover:opacity-100">
            <ChevronDown className="size-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-xl">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEditQuestions(quiz) }}>
            <PenTool className="mr-2 size-4" /> Edit Questions
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewAttempts(quiz) }}>
            <BarChart3 className="mr-2 size-4" /> View Attempts
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(quiz) }}>
            <Copy className="mr-2 size-4" /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); onDelete(quiz) }}>
            <Trash2 className="mr-2 size-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  )
}

// ============================================================
// Main Component
// ============================================================
export function InstructorQuizzesView() {
  const { currentUser } = useAppStore()

  // Data
  const [quizzes, setQuizzes] = useState<InstructorQuiz[]>([])
  const [summary, setSummary] = useState<QuizSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState<SortOption>('createdAt')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  // Dialogs
  const [showCreate, setShowCreate] = useState(false)
  const [selectedQuiz, setSelectedQuiz] = useState<InstructorQuiz | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<InstructorQuiz | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [duplicating, setDuplicating] = useState<string | null>(null)

  // Courses for filter
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([])

  // Fetch quizzes
  const fetchQuizzes = useCallback(async () => {
    if (!currentUser?.id) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        instructorId: currentUser.id,
        ...(search && { search }),
        ...(courseFilter !== 'all' && { courseId: courseFilter }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        sortBy,
        sortOrder: 'desc',
      })
      const res = await fetch(`/api/instructor/quizzes?${params}`)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        if (res.status === 404) {
          setQuizzes([])
          setSummary(null)
          return
        }
        throw new Error(errData.error || 'Failed to fetch quizzes')
      }
      const data = await res.json()
      setQuizzes(data.quizzes || [])
      setSummary(data.summary || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quizzes')
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id, search, courseFilter, typeFilter, statusFilter, sortBy])

  // Fetch courses for filter dropdown
  useEffect(() => {
    if (currentUser?.id) {
      fetch(`/api/instructor/courses?instructorId=${currentUser.id}`)
        .then(res => res.json())
        .then(data => setCourses(data.courses?.map((c: { id: string; title: string }) => ({ id: c.id, title: c.title })) || []))
        .catch(() => setCourses([]))
    }
  }, [currentUser?.id])

  useEffect(() => {
    fetchQuizzes()
  }, [fetchQuizzes])

  // Handlers
  const handleViewDetail = (quiz: InstructorQuiz) => {
    setSelectedQuiz(quiz)
    setShowDetail(true)
  }

  const handleEditQuestions = (quiz: InstructorQuiz) => {
    setSelectedQuiz(quiz)
    setShowDetail(true)
  }

  const handleViewAttempts = (quiz: InstructorQuiz) => {
    toast.info(`Viewing attempts for "${quiz.title}" — ${quiz.attemptStats.totalAttempts} total attempts`)
  }

  const handleDuplicate = async (quiz: InstructorQuiz) => {
    setDuplicating(quiz.id)
    try {
      // Fetch full quiz with questions before duplicating
      const detailRes = await fetch(`/api/instructor/quizzes/${quiz.id}`)
      if (!detailRes.ok) throw new Error('Failed to fetch quiz details')
      const detailData = await detailRes.json()
      const existingQuestions = detailData.quiz?.questions || []

      // Map questions to the format expected by the create endpoint
      const questions = existingQuestions.map((q: { text: string; type: string; options: unknown; correctAnswer: string; explanation: string | null; points: number }) => ({
        text: q.text,
        type: q.type,
        options: typeof q.options === 'string' ? q.options : JSON.stringify(q.options || []),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        points: q.points,
      }))

      // Create a duplicate via the API
      const res = await fetch('/api/instructor/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId: currentUser?.id,
          title: `${quiz.title} (Copy)`,
          description: quiz.description,
          type: quiz.type,
          courseId: quiz.course.id,
          timeLimit: quiz.timeLimit,
          passingScore: quiz.passingScore,
          maxAttempts: quiz.maxAttempts,
          questions,
        }),
      })
      if (!res.ok) throw new Error('Failed to duplicate quiz')
      toast.success('Quiz duplicated!')
      fetchQuizzes()
    } catch {
      toast.error('Failed to duplicate quiz')
    } finally {
      setDuplicating(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/instructor/quizzes/${deleteTarget.id}?instructorId=${currentUser?.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete quiz')
      toast.success('Quiz deleted')
      setDeleteTarget(null)
      fetchQuizzes()
    } catch {
      toast.error('Failed to delete quiz')
    } finally {
      setDeleting(false)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setCourseFilter('all')
    setTypeFilter('all')
    setStatusFilter('all')
    setSortBy('createdAt')
  }

  const hasActiveFilters = search || courseFilter !== 'all' || typeFilter !== 'all' || statusFilter !== 'all'

  // Stats strip
  const statsCards = useMemo(() => {
    if (!summary) return []
    return [
      { label: 'Total Quizzes', value: summary.totalQuizzes, icon: HelpCircle, bgColor: 'bg-emerald-100 dark:bg-emerald-950/40', color: 'text-emerald-700 dark:text-emerald-400' },
      { label: 'Published', value: summary.publishedCount, icon: Eye, bgColor: 'bg-teal-100 dark:bg-teal-950/40', color: 'text-teal-700 dark:text-teal-400' },
      { label: 'Drafts', value: summary.draftCount, icon: FileText, bgColor: 'bg-amber-100 dark:bg-amber-950/40', color: 'text-amber-700 dark:text-amber-400' },
      { label: 'Practice', value: summary.byType.practice, icon: BookOpen, bgColor: 'bg-teal-100 dark:bg-teal-950/40', color: 'text-teal-700 dark:text-teal-400' },
      { label: 'Assessment', value: summary.byType.assessment, icon: Target, bgColor: 'bg-emerald-100 dark:bg-emerald-950/40', color: 'text-emerald-700 dark:text-emerald-400' },
      { label: 'Diagnostic', value: summary.byType.diagnostic, icon: Zap, bgColor: 'bg-amber-100 dark:bg-amber-950/40', color: 'text-amber-700 dark:text-amber-400' },
      { label: 'Certification', value: summary.byType.certification, icon: Award, bgColor: 'bg-purple-100 dark:bg-purple-950/40', color: 'text-purple-700 dark:text-purple-400' },
      { label: 'Avg Pass Rate', value: `${summary.avgPassRate}%`, icon: TrendingUp, bgColor: 'bg-emerald-100 dark:bg-emerald-950/40', color: 'text-emerald-700 dark:text-emerald-400' },
    ]
  }, [summary])

  // Loading skeleton
  if (loading && quizzes.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-10 w-48 rounded-xl" />
            <Skeleton className="h-5 w-64 rounded-lg mt-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/40 mb-4">
          <AlertCircle className="size-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-[20px] font-bold mb-2">Something went wrong</h3>
        <p className="text-[14px] text-muted-foreground mb-4">{error}</p>
        <Button className="rounded-xl bg-primary ios-press" onClick={fetchQuizzes}>
          <RotateCcw className="mr-2 size-4" /> Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[34px] font-bold tracking-tight">Quizzes</h1>
            <button className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors" onClick={() => toast.info('Quizzes help you assess student understanding with various question types.')}>
              <HelpCircle className="size-5 text-muted-foreground" />
            </button>
          </div>
          <p className="text-[15px] text-muted-foreground mt-1">
            {summary ? `${summary.totalQuizzes} quiz${summary.totalQuizzes !== 1 ? 'zes' : ''} across your courses` : 'Manage your quizzes'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white ios-press"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="mr-2 size-4" />
            Create Quiz
          </Button>
          <Button
            variant="outline"
            className="rounded-xl ios-press border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            onClick={() => setShowCreate(true)}
          >
            <Sparkles className="mr-2 size-4" />
            Generate with AI
          </Button>
        </div>
      </motion.div>

      {/* Stats Strip */}
      {summary && (
        <InstructorStatCardGrid columns={8}>
          {statsCards.map((stat, idx) => {
            const Icon = stat.icon
            const colorToken = stat.bgColor.includes('emerald') ? 'emerald'
              : stat.bgColor.includes('teal') ? 'teal'
              : stat.bgColor.includes('amber') ? 'amber'
              : stat.bgColor.includes('purple') ? 'violet'
              : 'teal'
            return (
              <InstructorStatCard
                key={stat.label}
                icon={Icon}
                value={stat.value}
                label={stat.label}
                color={colorToken}
                index={idx}
              />
            )
          })}
        </InstructorStatCardGrid>
      )}

      {/* Advanced Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.15 }}
        className="rounded-2xl ios-shadow-sm bg-card p-4 space-y-3"
      >
        {/* Search + Actions Row */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search quizzes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-xl pl-10 pr-9 text-[14px]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted/50"
              >
                <X className="size-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Course filter */}
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="h-10 rounded-xl w-[180px] hidden sm:flex">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="h-10 rounded-xl w-[160px] hidden md:flex">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex items-center rounded-xl border border-border p-0.5 ml-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded-lg transition-all',
                viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-1.5 rounded-lg transition-all',
                viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="size-4" />
            </button>
          </div>
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[12px] text-muted-foreground font-medium mr-1">Type:</span>
          {(['all', 'practice', 'assessment', 'diagnostic', 'certification'] as const).map(type => {
            const isActive = typeFilter === type
            const label = type === 'all' ? 'All' : typeConfig[type].label
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={cn(
                  'rounded-lg px-3 py-1 text-[12px] font-medium transition-all border',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border hover:border-primary/50 text-muted-foreground'
                )}
              >
                {label}
              </button>
            )
          })}

          <Separator orientation="vertical" className="h-5 mx-2" />

          <span className="text-[12px] text-muted-foreground font-medium mr-1">Status:</span>
          {(['all', 'published', 'draft'] as const).map(status => {
            const isActive = statusFilter === status
            const label = status === 'all' ? 'All' : statusConfig[status].label
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'rounded-lg px-3 py-1 text-[12px] font-medium transition-all border',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border hover:border-primary/50 text-muted-foreground'
                )}
              >
                {label}
              </button>
            )
          })}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="rounded-lg px-3 py-1 text-[12px] font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
            >
              Clear Filters
            </button>
          )}
        </div>
      </motion.div>

      {/* Quiz Cards / List */}
      {quizzes.length === 0 ? (
        summary && summary.totalQuizzes === 0 ? (
          <EmptyState type="no-quizzes" onAction={() => setShowCreate(true)} />
        ) : (
          <EmptyState type="no-matching" onAction={clearFilters} />
        )
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {quizzes.map((quiz, idx) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                index={idx}
                onViewDetail={handleViewDetail}
                onEditQuestions={handleEditQuestions}
                onViewAttempts={handleViewAttempts}
                onDuplicate={handleDuplicate}
                onDelete={setDeleteTarget}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {quizzes.map((quiz, idx) => (
              <QuizListRow
                key={quiz.id}
                quiz={quiz}
                index={idx}
                onViewDetail={handleViewDetail}
                onEditQuestions={handleEditQuestions}
                onViewAttempts={handleViewAttempts}
                onDuplicate={handleDuplicate}
                onDelete={setDeleteTarget}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Results count */}
      {quizzes.length > 0 && (
        <p className="text-[12px] text-muted-foreground text-center">
          Showing {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''}
          {hasActiveFilters ? ' (filtered)' : ''}
        </p>
      )}

      {/* Create Quiz Dialog */}
      <CreateQuizDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={fetchQuizzes}
        instructorId={currentUser?.id || ''}
      />

      {/* Quiz Detail Sheet */}
      <QuizDetailSheet
        quiz={selectedQuiz}
        open={showDetail}
        onClose={() => { setShowDetail(false); setSelectedQuiz(null) }}
      />

      {/* Delete Confirmation */}
      {deleteTarget && (
        <DeleteQuizDialog
          quiz={deleteTarget}
          deleting={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Duplicating overlay */}
      <AnimatePresence>
        {duplicating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-2xl ios-shadow-lg bg-card border border-border px-5 py-3 flex items-center gap-3"
          >
            <Loader2 className="size-4 animate-spin text-primary" />
            <span className="text-[14px] font-medium">Duplicating quiz...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
