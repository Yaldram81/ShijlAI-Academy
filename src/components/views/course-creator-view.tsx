'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ArrowRight, Check, Loader2,
  PenTool, Layers, BookOpen, DollarSign,
  Search, Rocket, Sparkles, Save, X,
  ChevronDown, Clock, AlertCircle, CheckCircle2,
  GraduationCap, Eye, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

// Step components
import { Step1Basics } from '@/components/creator/step1-basics'
import { Step2Curriculum } from '@/components/creator/step2-curriculum'
import { Step3Content } from '@/components/creator/step3-content'
import { Step4Pricing } from '@/components/creator/step4-pricing'
import { Step5Seo } from '@/components/creator/step5-seo'
import { Step6Review } from '@/components/creator/step6-review'
import { AIPanel } from '@/components/creator/ai-panel'

// Types & Constants
import type { CourseFormData, StepStatus, AIMessage, AutoSaveState } from '@/components/creator/types'
import { STEPS, EMPTY_FORM_DATA, SPRING } from '@/components/creator/constants'

// ============================================================
// Step Icon Mapping
// ============================================================

const STEP_ICONS: Record<string, React.ReactNode> = {
  PenTool: <PenTool className="size-4" />,
  Layers: <Layers className="size-4" />,
  BookOpen: <BookOpen className="size-4" />,
  DollarSign: <DollarSign className="size-4" />,
  Search: <Search className="size-4" />,
  Rocket: <Rocket className="size-4" />,
}

// ============================================================
// Main Course Creator View
// ============================================================

export function CourseCreatorView() {
  const { currentUser, editingCourseId, setEditingCourseId, setCurrentView } = useAppStore()

  // ─── State ───
  const [currentStep, setCurrentStep] = useState(0)
  const [form, setForm] = useState<CourseFormData>(EMPTY_FORM_DATA())
  const [courseId, setCourseId] = useState<string | null>(editingCourseId)
  const [editingLesson, setEditingLesson] = useState<{ moduleId: string; lessonId: string } | null>(null)
  const [mode, setMode] = useState<'guided' | 'power'>('guided')
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([])
  const [autoSave, setAutoSave] = useState<AutoSaveState>({
    lastSaved: null,
    isSaving: false,
    hasUnsavedChanges: false,
  })

  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasUnsavedRef = useRef(false)

  // ─── Form Management ───

  const handleFormChange = useCallback((updates: Partial<CourseFormData>) => {
    setForm((prev) => {
      const next = { ...prev, ...updates }
      // Auto-generate URL slug from title
      if (updates.title && !prev.urlSlug) {
        next.urlSlug = updates.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .slice(0, 80)
      }
      // Auto-generate SEO title from title
      if (updates.title && !prev.seoTitle) {
        next.seoTitle = updates.title.length > 65
          ? updates.title.slice(0, 62) + '...'
          : updates.title
      }
      return next
    })
    hasUnsavedRef.current = true
    setAutoSave((prev) => ({ ...prev, hasUnsavedChanges: true }))
  }, [])

  // ─── Step Status Computation ───

  const getStepStatus = useCallback((stepId: number): StepStatus => {
    switch (stepId) {
      case 0: { // Basics
        const hasTitle = form.title.trim().length > 0
        const hasDesc = form.description.trim().length >= 10
        const hasCat = form.category.trim().length > 0
        const hasLevel = !!form.difficultyLevel
        if (hasTitle && hasDesc && hasCat && hasLevel) return 'complete'
        if (hasTitle || hasDesc || hasCat) return 'in_progress'
        return 'not_started'
      }
      case 1: { // Structure
        const hasModules = form.modules.length > 0
        const hasLessons = form.modules.some((m) => m.lessons.length > 0)
        if (hasModules && hasLessons) return 'complete'
        if (hasModules) return 'in_progress'
        return 'not_started'
      }
      case 2: { // Content
        const lessonsWithContent = form.modules.reduce(
          (acc, m) => acc + m.lessons.filter((l) => l.content.trim().length > 0).length, 0
        )
        const totalLessons = form.modules.reduce((acc, m) => acc + m.lessons.length, 0)
        if (totalLessons === 0) return 'not_started'
        if (lessonsWithContent === totalLessons) return 'complete'
        if (lessonsWithContent > 0) return 'in_progress'
        return 'not_started'
      }
      case 3: { // Pricing
        if (form.pricingModel === 'free') return 'complete'
        if (form.pricingModel === 'paid' && form.priceUSD > 0) return 'complete'
        if (form.pricingModel !== 'free' && form.priceUSD === 0) return 'in_progress'
        return 'not_started'
      }
      case 4: { // SEO
        const hasSeoTitle = form.seoTitle.trim().length > 0
        const hasMeta = form.metaDescription.trim().length > 0
        const hasSlug = form.urlSlug.trim().length > 0
        if (hasSeoTitle && hasMeta && hasSlug) return 'complete'
        if (hasSeoTitle || hasMeta || hasSlug) return 'in_progress'
        return 'not_started'
      }
      case 5: { // Review - compute inline to avoid self-reference
        const s0 = form.title.trim().length > 0 && form.description.trim().length >= 10 && form.category.trim().length > 0
        const s1 = form.modules.length > 0 && form.modules.some((m) => m.lessons.length > 0)
        const s3 = form.pricingModel === 'free' || form.priceUSD > 0
        const s4 = form.seoTitle.trim().length > 0 && form.metaDescription.trim().length > 0 && form.urlSlug.trim().length > 0
        if (s0 && s1 && s3 && s4) return 'complete'
        return 'in_progress'
      }
      default:
        return 'not_started'
    }
  }, [form])

  // ─── Overall Progress ───

  const overallProgress = (() => {
    const statuses = STEPS.map((s) => getStepStatus(s.id))
    const completed = statuses.filter((s) => s === 'complete').length
    const inProgress = statuses.filter((s) => s === 'in_progress').length
    return Math.round(((completed + inProgress * 0.5) / STEPS.length) * 100)
  })()

  // ─── Auto-Save ───

  // ─── Sync course content (modules & lessons) to DB ───

  const syncCourseContent = useCallback(async (targetCourseId: string) => {
    try {
      const res = await fetch(`/api/instructor/courses/${targetCourseId}/sync-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules: form.modules }),
      })
      if (res.ok) {
        const data = await res.json()
        // Update local form state with real DB IDs
        const moduleIdMap = data.moduleIdMap as Record<string, string>
        const lessonIdMap = data.lessonIdMap as Record<string, string>

        if (Object.keys(moduleIdMap).length > 0 || Object.keys(lessonIdMap).length > 0) {
          const updatedModules = form.modules.map(mod => {
            const newModId = moduleIdMap[mod.id] || mod.id
            return {
              ...mod,
              id: newModId,
              lessons: mod.lessons.map(lesson => ({
                ...lesson,
                id: lessonIdMap[lesson.id] || lesson.id,
              })),
            }
          })
          setForm(prev => ({ ...prev, modules: updatedModules }))
        }
        return true
      }
      return false
    } catch {
      return false
    }
  }, [form.modules])

  const saveDraft = useCallback(async () => {
    if (!hasUnsavedRef.current || !currentUser?.id) return

    setAutoSave((prev) => ({ ...prev, isSaving: true }))
    try {
      let currentCourseId = courseId

      if (currentCourseId) {
        // Update existing course
        const res = await fetch(`/api/instructor/courses/${currentCourseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title || 'Untitled Course',
            description: form.description,
            category: form.category || 'Other',
            level: form.difficultyLevel,
            language: form.language,
            thumbnail: form.thumbnail || null,
            price: form.priceUSD,
            certificateEnabled: form.certificateEnabled,
            completionThreshold: form.completionThreshold,
            estimatedDuration: form.modules.reduce(
              (acc, m) => acc + m.lessons.reduce((a, l) => a + l.duration, 0), 0
            ),
            learningObjectives: JSON.stringify(form.whatYouLearn),
            prerequisites: JSON.stringify(form.requirements),
            targetAudience: form.targetAudience.join(', '),
            tags: JSON.stringify(form.searchTags),
          }),
        })
        if (res.ok) {
          // Sync modules & lessons to DB
          await syncCourseContent(currentCourseId)
          hasUnsavedRef.current = false
          setAutoSave({ lastSaved: new Date(), isSaving: false, hasUnsavedChanges: false })
        } else {
          setAutoSave((prev) => ({ ...prev, isSaving: false }))
        }
      } else if (form.title.trim()) {
        // Create new course
        const res = await fetch('/api/instructor/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instructorId: currentUser.id,
            title: form.title,
            description: form.description || 'Course description pending',
            category: form.category || 'Other',
            level: form.difficultyLevel,
            language: form.language === 'both' ? 'en' : form.language,
            thumbnail: form.thumbnail || null,
            price: form.priceUSD,
            certificateEnabled: form.certificateEnabled,
            completionThreshold: form.completionThreshold,
          }),
        })
        if (res.ok) {
          const data = await res.json()
          const newCourseId = data.course?.id || data.id
          setCourseId(newCourseId)
          // Sync modules & lessons to the new course
          await syncCourseContent(newCourseId)
          hasUnsavedRef.current = false
          setAutoSave({ lastSaved: new Date(), isSaving: false, hasUnsavedChanges: false })
        } else {
          setAutoSave((prev) => ({ ...prev, isSaving: false }))
        }
      } else {
        setAutoSave((prev) => ({ ...prev, isSaving: false }))
      }
    } catch {
      setAutoSave((prev) => ({ ...prev, isSaving: false }))
    }
  }, [courseId, form, currentUser?.id, syncCourseContent])

  // Auto-save timer (every 30 seconds)
  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => {
      if (hasUnsavedRef.current) {
        saveDraft()
      }
    }, 30000)

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
    }
  }, [saveDraft])

  // ─── Beforeunload Protection ───

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // ─── Load Existing Course Data ───

  useEffect(() => {
    if (!editingCourseId) return

    const loadCourse = async () => {
      try {
        const res = await fetch(`/api/instructor/courses?instructorId=${currentUser?.id}`)
        if (!res.ok) return
        const data = await res.json()
        const course = (data.courses || []).find((c: { id: string }) => c.id === editingCourseId)
        if (!course) return

        // Load modules
        const modulesRes = await fetch(`/api/instructor/courses/${editingCourseId}/modules`)
        const modulesData = modulesRes.ok ? await modulesRes.json() : { modules: [] }

        setForm({
          ...EMPTY_FORM_DATA(),
          title: course.title || '',
          subtitle: '',
          description: course.description || '',
          category: course.category || '',
          difficultyLevel: course.level || 'beginner',
          language: course.language || 'en',
          thumbnail: course.thumbnail || '',
          priceUSD: course.price || 0,
          certificateEnabled: course.certificateEnabled ?? true,
          completionThreshold: course.completionThreshold || 80,
          estimatedDuration: course.estimatedDuration || 0,
          whatYouLearn: course.learningObjectives
            ? JSON.parse(course.learningObjectives)
            : [],
          requirements: course.prerequisites
            ? JSON.parse(course.prerequisites)
            : [],
          searchTags: course.tags ? JSON.parse(course.tags) : [],
          modules: (modulesData.modules || []).map((mod: Record<string, unknown>) => ({
            id: mod.id as string,
            title: (mod.title as string) || '',
            description: (mod.description as string) || '',
            order: (mod.order as number) || 0,
            learningObjectives: mod.learningObjectives
              ? JSON.parse(mod.learningObjectives as string)
              : [],
            isPublished: (mod.isPublished as boolean) || false,
            lessons: ((mod.lessons as Array<Record<string, unknown>>) || []).map((l) => ({
              id: l.id as string,
              title: (l.title as string) || '',
              description: (l.description as string) || '',
              content: (l.content as string) || '',
              type: (l.type as string) || 'text',
              videoUrl: (l.videoUrl as string) || '',
              duration: (l.duration as number) || 0,
              order: (l.order as number) || 0,
              resources: l.resources ? JSON.parse(l.resources as string) : [],
              objectives: l.objectives ? JSON.parse(l.objectives as string) : [],
              isFree: (l.isFree as boolean) || false,
              isPublished: (l.isPublished as boolean) ?? true,
              transcript: (l.transcript as string) || '',
              slideUrl: (l.slideUrl as string) || '',
            })),
            quizzes: [],
          })),
        })
        setCourseId(editingCourseId)
      } catch (err) {
        console.error('Failed to load course:', err)
      }
    }

    loadCourse()
  }, [editingCourseId, currentUser?.id])

  // ─── Navigation ───

  const goToStep = useCallback((step: number) => {
    if (mode === 'power') {
      // Power mode: free navigation
      setCurrentStep(step)
      setEditingLesson(null)
      return
    }
    // Guided mode: validate
    if (step <= currentStep) {
      setCurrentStep(step)
      setEditingLesson(null)
      return
    }
    for (let i = currentStep; i < step; i++) {
      const status = getStepStatus(i)
      if (status === 'not_started') {
        toast.error(`Please complete Step ${i + 1}: ${STEPS[i].title} first`)
        return
      }
    }
    setCurrentStep(step)
    setEditingLesson(null)
  }, [currentStep, getStepStatus, mode])

  const goNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
      setEditingLesson(null)
    }
  }, [currentStep])

  const goPrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
      setEditingLesson(null)
    }
  }, [currentStep])

  const handleEditLesson = useCallback((moduleId: string, lessonId: string) => {
    setEditingLesson({ moduleId, lessonId })
    setCurrentStep(2) // Jump to Content Editor
  }, [])

  const handleBackToDashboard = useCallback(() => {
    // Save before leaving
    if (hasUnsavedRef.current) {
      saveDraft()
    }
    setEditingCourseId(null)
    setCurrentView('instructor-courses')
  }, [saveDraft, setEditingCourseId, setCurrentView])

  const handleSubmit = useCallback(async () => {
    if (!courseId) {
      toast.error('Please save the course first')
      return
    }

    // Validate all steps
    const step0 = form.title.trim().length > 0 && form.description.trim().length >= 10 && form.category.trim().length > 0
    if (!step0) {
      toast.error('Step 1 (Basics) is incomplete', { description: 'Title, description, and category are required' })
      goToStep(0)
      return
    }

    const step1 = form.modules.length > 0 && form.modules.some(m => m.lessons.length > 0)
    if (!step1) {
      toast.error('Step 2 (Structure) is incomplete', { description: 'Add at least one module with one lesson' })
      goToStep(1)
      return
    }

    const step3 = form.pricingModel === 'free' || form.priceUSD > 0
    if (!step3) {
      toast.error('Step 4 (Pricing) is incomplete', { description: 'Set a price or make the course free' })
      goToStep(3)
      return
    }

    try {
      await syncCourseContent(courseId)
      const res = await fetch(`/api/instructor/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewStatus: 'pending', submittedForReviewAt: new Date().toISOString() }),
      })
      if (res.ok) {
        toast.success('Course submitted for review! 🎉')
        setEditingCourseId(null)
        setCurrentView('instructor-courses')
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Failed to submit course')
      }
    } catch {
      toast.error('Failed to submit course')
    }
  }, [courseId, form, goToStep, setEditingCourseId, setCurrentView, syncCourseContent])

  const handlePreview = useCallback(() => {
    if (!courseId) {
      toast.error('Save the course first to preview it')
      return
    }
    toast.info('Preview will be available after publishing', { description: 'Your course data has been saved' })
  }, [courseId])

  // ─── AI Panel Handlers ───

  const handleAIQuickAction = useCallback(async (action: string) => {
    const userMsg: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: `Please ${action.toLowerCase()} for my course "${form.title || 'Untitled Course'}"`,
      timestamp: new Date(),
    }
    setAiMessages((prev) => [...prev, userMsg])

    try {
      const res = await fetch('/api/instructor/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${action} for course: "${form.title || 'Untitled Course'}". Category: ${form.category}. Level: ${form.difficultyLevel}`,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const aiMsg: AIMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.response || data.content || `I've processed your request for "${action}". Check the relevant step for updates.`,
          timestamp: new Date(),
        }
        setAiMessages((prev) => [...prev, aiMsg])
      } else {
        throw new Error('Failed')
      }
    } catch {
      const aiMsg: AIMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: `I'll help you with "${action}". This feature is being enhanced — for now, you can manually make changes in the relevant step.`,
        timestamp: new Date(),
      }
      setAiMessages((prev) => [...prev, aiMsg])
    }
  }, [form.title, form.category, form.difficultyLevel])

  const handleAISendMessage = useCallback(async (message: string) => {
    const userMsg: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    }
    setAiMessages((prev) => [...prev, userMsg])

    try {
      const res = await fetch('/api/instructor/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const aiMsg: AIMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.response || data.content || 'I understand your question. Let me help you with that.',
          timestamp: new Date(),
        }
        setAiMessages((prev) => [...prev, aiMsg])
      } else {
        throw new Error('Failed')
      }
    } catch {
      const aiMsg: AIMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: `I'm having trouble connecting right now. Please try again in a moment.`,
        timestamp: new Date(),
      }
      setAiMessages((prev) => [...prev, aiMsg])
    }
  }, [])

  // ─── Render Step Content ───

  const renderStepContent = () => {
    // If editing a lesson in step 2, switch to step 3
    const activeStep = editingLesson ? 2 : currentStep

    switch (activeStep) {
      case 0:
        return (
          <Step1Basics
            form={form}
            onFormChange={handleFormChange}
            onNext={goNext}
          />
        )
      case 1:
        return (
          <Step2Curriculum
            form={form}
            onFormChange={handleFormChange}
            onEditLesson={handleEditLesson}
            onPrevious={goPrevious}
            onNext={goNext}
            courseId={courseId}
          />
        )
      case 2:
        return (
          <Step3Content
            form={form}
            onFormChange={handleFormChange}
            editingLesson={editingLesson}
            onEditLesson={handleEditLesson}
            onBack={() => {
              setEditingLesson(null)
              setCurrentStep(1)
            }}
            onNext={goNext}
            onPrevious={goPrevious}
            courseId={courseId}
          />
        )
      case 3:
        return (
          <Step4Pricing
            form={form}
            onFormChange={handleFormChange}
            onPrevious={goPrevious}
            onNext={goNext}
          />
        )
      case 4:
        return (
          <Step5Seo
            form={form}
            onFormChange={handleFormChange}
            onPrevious={goPrevious}
            onNext={goNext}
          />
        )
      case 5:
        return (
          <Step6Review
            form={form}
            onFormChange={handleFormChange}
            onPrevious={goPrevious}
            onSubmit={handleSubmit}
            onPreview={handlePreview}
          />
        )
      default:
        return null
    }
  }

  // ─── Time Since Last Save ───

  const timeSinceSave = (() => {
    if (!autoSave.lastSaved) return null
    const diffMs = Date.now() - autoSave.lastSaved.getTime()
    const diffSec = Math.floor(diffMs / 1000)
    if (diffSec < 5) return 'just now'
    if (diffSec < 60) return `${diffSec}s ago`
    const diffMin = Math.floor(diffSec / 60)
    return `${diffMin}m ago`
  })()

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* ─── Global Top Bar ─── */}
      <div className="shrink-0 border-b border-border/60 bg-card/80 backdrop-blur-xl">
        {/* Top Row: Back + Title + Auto-save + Actions */}
        <div className="flex items-center gap-3 px-4 py-2.5">
          {/* Back to Dashboard */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-[13px] rounded-xl ios-press shrink-0"
            onClick={handleBackToDashboard}
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Button>

          <Separator orientation="vertical" className="h-5 shrink-0" />

          {/* Course Title (editable inline) */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleFormChange({ title: e.target.value })}
              className="bg-transparent text-[15px] font-semibold text-foreground placeholder:text-muted-foreground/50 outline-none truncate flex-1 min-w-0"
              placeholder="Untitled Course"
            />
            {!form.title.trim() && (
              <Badge variant="outline" className="text-[10px] rounded-lg text-amber-600 border-amber-200 shrink-0">
                Unnamed
              </Badge>
            )}
          </div>

          {/* Auto-save Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            {autoSave.isSaving ? (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                Saving...
              </div>
            ) : autoSave.hasUnsavedChanges ? (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-600">
                <AlertCircle className="size-3" />
                Unsaved
              </div>
            ) : timeSinceSave ? (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600">
                <CheckCircle2 className="size-3" />
                Auto-saved {timeSinceSave}
              </div>
            ) : null}
          </div>

          {/* Mode Toggle */}
          <div className="hidden md:flex items-center rounded-xl bg-muted/60 p-0.5 shrink-0">
            <button
              onClick={() => setMode('guided')}
              className={cn(
                'rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all',
                mode === 'guided'
                  ? 'bg-card ios-shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Guided
            </button>
            <button
              onClick={() => setMode('power')}
              className={cn(
                'rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all',
                mode === 'power'
                  ? 'bg-card ios-shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Power
            </button>
          </div>

          {/* Save Draft */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-[12px] rounded-xl ios-press shrink-0"
            onClick={saveDraft}
            disabled={autoSave.isSaving}
          >
            {autoSave.isSaving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            <span className="hidden sm:inline">Save Draft</span>
          </Button>

          {/* AI Toggle */}
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-8 gap-1.5 text-[12px] rounded-xl ios-press shrink-0',
              aiPanelOpen && 'bg-primary/10 text-primary border-primary/30'
            )}
            onClick={() => setAiPanelOpen(!aiPanelOpen)}
          >
            <Sparkles className="size-3.5" />
            <span className="hidden sm:inline">AI</span>
          </Button>

          {/* Exit */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-[12px] rounded-xl shrink-0 text-muted-foreground hover:text-foreground"
            onClick={handleBackToDashboard}
          >
            <X className="size-3.5" />
          </Button>
        </div>

        {/* Step Navigation Bar - Prominent Numbered Circles */}
        <div className="px-4 py-3">
          <div className="flex items-center w-full">
            {STEPS.map((step, idx) => {
              const status = getStepStatus(step.id)
              const isActive = currentStep === step.id

              return (
                <div key={step.id} className="flex items-center flex-1 last:flex-none">
                  {/* Step Circle + Label */}
                  <button
                    onClick={() => goToStep(step.id)}
                    className="flex flex-col items-center gap-1 group shrink-0"
                  >
                    <motion.div
                      className={cn(
                        'flex size-10 items-center justify-center rounded-full text-[14px] font-bold transition-all border-2',
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary ios-shadow-lg scale-110'
                          : status === 'complete'
                          ? 'bg-emerald-500 text-white border-emerald-500 ios-shadow-sm group-hover:scale-105'
                          : status === 'in_progress'
                          ? 'bg-amber-100 text-amber-700 border-amber-400 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-600 group-hover:scale-105'
                          : 'bg-muted/60 text-muted-foreground border-border group-hover:bg-muted group-hover:border-muted-foreground/30 group-hover:scale-105'
                      )}
                      whileTap={{ scale: 0.95 }}
                    >
                      {status === 'complete' && !isActive ? (
                        <Check className="size-5" />
                      ) : (
                        step.id + 1
                      )}
                    </motion.div>
                    <span className={cn(
                      'text-[10px] font-semibold whitespace-nowrap transition-colors',
                      isActive
                        ? 'text-primary'
                        : status === 'complete'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : status === 'in_progress'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-muted-foreground'
                    )}>
                      <span className="hidden sm:inline">{step.title}</span>
                      <span className="sm:hidden">{step.id + 1}</span>
                    </span>
                  </button>

                  {/* Connector Line */}
                  {idx < STEPS.length - 1 && (
                    <div className="flex-1 mx-1 sm:mx-2 h-[2px] mt-[-14px] relative">
                      <div className={cn(
                        'h-full rounded-full transition-all',
                        status === 'complete'
                          ? 'bg-emerald-400 dark:bg-emerald-600'
                          : status === 'in_progress'
                          ? 'bg-gradient-to-r from-emerald-400 to-amber-300 dark:from-emerald-600 dark:to-amber-500'
                          : 'bg-border'
                      )} />
                    </div>
                  )}
                </div>
              )
            })}

            {/* Progress */}
            <div className="flex items-center gap-2 ml-4 shrink-0">
              <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden hidden md:block">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${overallProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground">
                {overallProgress}%
              </span>
            </div>
          </div>
        </div>

        {/* Power Mode Banner */}
        {mode === 'power' && (
          <div className="px-4 py-1.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800">
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1.5">
              <Zap className="size-3" />
              Power Mode: Free navigation enabled — steps won't enforce sequential completion
            </p>
          </div>
        )}
      </div>

      {/* ─── Main Content Area ─── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Step Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'max-w-5xl mx-auto',
                currentStep === 2 ? 'h-full p-3' : 'p-4 md:p-6 lg:p-8'
              )}
            >
              {/* Step Header */}
              {currentStep !== 2 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                      {STEP_ICONS[STEPS[currentStep].icon]}
                    </div>
                    <div>
                      <h2 className="text-[20px] font-bold text-foreground">
                        STEP {currentStep + 1} OF {STEPS.length} — {STEPS[currentStep].title}
                      </h2>
                    </div>
                  </div>
                  <p className="text-[13px] text-muted-foreground mt-1">
                    {currentStep === 0 && "Let's start with the fundamentals. You can edit any of this later."}
                    {currentStep === 1 && 'Build your modules and lessons. Drag to reorder anything.'}
                    {currentStep === 2 && 'Click any lesson to edit its content, resources, and settings.'}
                    {currentStep === 3 && 'Set your pricing model, enrollment rules, and access controls.'}
                    {currentStep === 4 && 'Help students find your course on search engines and inside the platform.'}
                    {currentStep === 5 && 'Review your course quality score and submit for publishing.'}
                  </p>
                </div>
              )}

              {/* Step Component */}
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* AI Assistant Panel */}
        <AIPanel
          currentStep={currentStep}
          onQuickAction={handleAIQuickAction}
          onSendMessage={handleAISendMessage}
          messages={aiMessages}
          isOpen={aiPanelOpen}
          onToggle={() => setAiPanelOpen(!aiPanelOpen)}
        />
      </div>
    </div>
  )
}
