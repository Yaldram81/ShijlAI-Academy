'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Play, FileText, HelpCircle, ClipboardList, Radio,
  Download, Loader2, Sparkles, Clock, BookOpen, Layers,
  ChevronDown, X, Check, Plus, Trash2, PenTool, Upload,
  Eye, SwitchCamera, GripVertical, Image, Video, AlertCircle,
  Settings, Award, EyeOff, Gamepad2, Link, File,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type {
  CourseFormData, WizardModule, WizardLesson, WizardQuiz,
  WizardQuestion, WizardAssignment, RubricItem, WizardResource,
  CaptionSetting,
} from './types'
import {
  CATEGORIES, SUBCATEGORIES, LEVELS, LANGUAGES,
  LESSON_TYPES, QUIZ_TYPES, ASSIGNMENT_TYPES, QUESTION_TYPES,
  SUBMISSION_TYPES, SPRING, CARD_SPRING, generateId,
} from './constants'

// ─── Props ───

export interface Step3ContentProps {
  form: CourseFormData
  onFormChange: (updates: Partial<CourseFormData>) => void
  editingLesson: { moduleId: string; lessonId: string } | null
  onEditLesson: (moduleId: string, lessonId: string) => void
  onBack: () => void
  onNext: () => void
  onPrevious: () => void
  courseId: string | null
}

// ─── Helpers ───

// generateId imported from constants

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

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

// ─── Resource Item ───

function ResourceItem({
  resource,
  onUpdate,
  onRemove,
}: {
  resource: WizardResource
  onUpdate: (r: WizardResource) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-background border border-border p-2">
      <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-[11px] font-bold shrink-0">
        {resource.type === 'pdf' ? 'PDF' :
         resource.type === 'video' ? '▶' :
         resource.type === 'link' ? '🔗' :
         resource.type === 'code' ? '</>' :
         resource.type === 'image' ? '🖼' : 'DOC'}
      </div>
      <div className="min-w-0 flex-1">
        <Input
          value={resource.title}
          onChange={(e) => onUpdate({ ...resource, title: e.target.value })}
          className="h-7 rounded-lg text-[12px] border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
          placeholder="Resource title"
        />
      </div>
      <Input
        value={resource.url}
        onChange={(e) => onUpdate({ ...resource, url: e.target.value })}
        className="h-7 rounded-lg text-[11px] border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 flex-1 min-w-0"
        placeholder="URL"
      />
      <button
        onClick={onRemove}
        className="flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
      >
        <Trash2 className="size-3" />
      </button>
    </div>
  )
}

// ─── Question Editor ───

function QuestionEditor({
  question,
  index,
  onUpdate,
  onRemove,
}: {
  question: WizardQuestion
  index: number
  onUpdate: (q: WizardQuestion) => void
  onRemove: () => void
}) {
  const updateOption = (optIdx: number, value: string) => {
    const newOptions = [...question.options]
    newOptions[optIdx] = value
    onUpdate({ ...question, options: newOptions })
  }

  const addOption = () => {
    if (question.options.length >= 6) return
    onUpdate({ ...question, options: [...question.options, `Option ${question.options.length + 1}`] })
  }

  const removeOption = (optIdx: number) => {
    if (question.options.length <= 2) return
    const newOptions = question.options.filter((_, i) => i !== optIdx)
    if (question.correctAnswer === question.options[optIdx]) {
      onUpdate({ ...question, options: newOptions, correctAnswer: newOptions[0] })
    } else {
      onUpdate({ ...question, options: newOptions })
    }
  }

  return (
    <motion.div
      layout={SPRING}
      className="rounded-2xl ios-shadow-sm bg-card p-4 space-y-3 border border-border"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-[11px]">
            {index + 1}
          </div>
          <Select
            value={question.type}
            onValueChange={(v) => onUpdate({ ...question, type: v as WizardQuestion['type'] })}
          >
            <SelectTrigger className="h-7 rounded-lg text-[11px] w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_TYPES.map((qt) => (
                <SelectItem key={qt.value} value={qt.value}>{qt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={question.points}
            onChange={(e) => onUpdate({ ...question, points: Math.max(1, parseInt(e.target.value) || 1) })}
            className="h-7 w-16 rounded-lg text-[11px] text-center"
            min={1}
          />
          <span className="text-[11px] text-muted-foreground">pts</span>
        </div>
        <button
          onClick={onRemove}
          className="flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="size-3" />
        </button>
      </div>

      {/* Question Text */}
      <Input
        value={question.text}
        onChange={(e) => onUpdate({ ...question, text: e.target.value })}
        className="h-9 rounded-xl text-[13px]"
        placeholder="Enter your question..."
      />

      {/* Options (for MCQ / True-False / Fill-blank) */}
      {(question.type === 'mcq' || question.type === 'true_false' || question.type === 'fill_blank') && (
        <div className="space-y-1.5">
          {question.type === 'true_false' ? (
            <div className="flex gap-2">
              {['True', 'False'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onUpdate({ ...question, correctAnswer: opt, options: ['True', 'False'] })}
                  className={cn(
                    'rounded-xl px-4 py-2 text-[12px] font-medium transition-all border flex-1',
                    question.correctAnswer === opt
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-700'
                      : 'bg-background border-border hover:border-emerald-300'
                  )}
                >
                  {question.correctAnswer === opt && <Check className="inline size-3 mr-1" />}
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {question.options.map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdate({ ...question, correctAnswer: opt })}
                    className={cn(
                      'flex size-6 items-center justify-center rounded-full border-2 shrink-0 transition-colors',
                      question.correctAnswer === opt
                        ? 'border-emerald-500 bg-emerald-100 text-emerald-600 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'border-border hover:border-emerald-300'
                    )}
                  >
                    {question.correctAnswer === opt && <Check className="size-3" />}
                  </button>
                  <Input
                    value={opt}
                    onChange={(e) => updateOption(oIdx, e.target.value)}
                    className="h-8 rounded-xl text-[12px] flex-1"
                    placeholder={`Option ${oIdx + 1}`}
                  />
                  {question.options.length > 2 && (
                    <button
                      onClick={() => removeOption(oIdx)}
                      className="flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              ))}
              {question.type === 'mcq' && question.options.length < 6 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl h-7 text-[11px] gap-1 text-primary"
                  onClick={addOption}
                >
                  <Plus className="size-3" />
                  Add Option
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Short Answer correct answer */}
      {question.type === 'short_answer' && (
        <Input
          value={question.correctAnswer}
          onChange={(e) => onUpdate({ ...question, correctAnswer: e.target.value })}
          className="h-9 rounded-xl text-[13px]"
          placeholder="Model answer (for reference)..."
        />
      )}

      {/* Explanation */}
      <div className="space-y-1">
        <Label className="text-[11px] font-medium text-muted-foreground">Explanation</Label>
        <Textarea
          value={question.explanation}
          onChange={(e) => onUpdate({ ...question, explanation: e.target.value })}
          className="rounded-xl text-[12px] min-h-[50px] resize-y"
          placeholder="Explain why this is the correct answer..."
        />
      </div>
    </motion.div>
  )
}

// ─── Rubric Table ───

function RubricTable({
  rubric,
  onRubricChange,
}: {
  rubric: RubricItem[]
  onRubricChange: (r: RubricItem[]) => void
}) {
  const addCriteria = () => {
    onRubricChange([
      ...rubric,
      {
        id: generateId('rubric'),
        criteria: '',
        description: '',
        maxPoints: 10,
      },
    ])
  }

  const updateItem = (idx: number, updates: Partial<RubricItem>) => {
    const updated = [...rubric]
    updated[idx] = { ...updated[idx], ...updates }
    onRubricChange(updated)
  }

  const removeItem = (idx: number) => {
    onRubricChange(rubric.filter((_, i) => i !== idx))
  }

  const totalPoints = rubric.reduce((a, r) => a + r.maxPoints, 0)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-[13px] font-semibold">Grading Rubric</Label>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] h-5 rounded-lg">
            Total: {totalPoints} pts
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl h-7 text-[11px] gap-1 text-primary"
            onClick={addCriteria}
          >
            <Plus className="size-3" />
            Add Criteria
          </Button>
        </div>
      </div>

      {rubric.length === 0 ? (
        <div className="text-center py-4 rounded-xl border-2 border-dashed border-border">
          <ClipboardList className="mx-auto size-5 text-muted-foreground/40" />
          <p className="mt-1 text-[12px] text-muted-foreground">No grading criteria yet</p>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl mt-2 text-[11px] gap-1"
            onClick={addCriteria}
          >
            <Plus className="size-3" />
            Add Criteria
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-[1fr_2fr_80px_32px] gap-2 px-3">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Criteria</span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Description</span>
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Points</span>
            <span />
          </div>
          {rubric.map((item, idx) => (
            <div key={item.id} className="grid grid-cols-[1fr_2fr_80px_32px] gap-2 items-center">
              <Input
                value={item.criteria}
                onChange={(e) => updateItem(idx, { criteria: e.target.value })}
                className="h-8 rounded-lg text-[12px]"
                placeholder="Criteria name"
              />
              <Input
                value={item.description}
                onChange={(e) => updateItem(idx, { description: e.target.value })}
                className="h-8 rounded-lg text-[12px]"
                placeholder="Description of expectations"
              />
              <Input
                type="number"
                value={item.maxPoints}
                onChange={(e) => updateItem(idx, { maxPoints: Math.max(1, parseInt(e.target.value) || 1) })}
                className="h-8 rounded-lg text-[12px] text-center"
                min={1}
              />
              <button
                onClick={() => removeItem(idx)}
                className="flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Video Lesson Editor ───

function VideoLessonEditor({
  lesson,
  onLessonUpdate,
}: {
  lesson: WizardLesson
  onLessonUpdate: (updates: Partial<WizardLesson>) => void
}) {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [captionMode, setCaptionMode] = useState<CaptionSetting['mode']>(lesson.captions?.mode || 'none')
  const [aiNotesLoading, setAiNotesLoading] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const videoInputRef = useRef<HTMLInputElement>(null)
  const srtInputRef = useRef<HTMLInputElement>(null)

  const handleVideoUpload = async (file: File) => {
    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload MP4, WebM, MOV, or AVI files.')
      return
    }

    // Validate file size (500MB)
    if (file.size > 500 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 500MB.')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setUploadedFileName(file.name)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'video')
      formData.append('lessonId', lesson.id)

      // Use XMLHttpRequest for progress tracking
      const xhr = new XMLHttpRequest()

      const uploadPromise = new Promise<{ url: string; duration: number; fileSize: string }>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100)
            setUploadProgress(percent)
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText)
              resolve({
                url: response.url,
                duration: response.duration || 0,
                fileSize: response.fileSizeFormatted || '',
              })
            } catch {
              reject(new Error('Invalid response'))
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.statusText}`))
          }
        })

        xhr.addEventListener('error', () => reject(new Error('Network error')))
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')))

        xhr.open('POST', '/api/upload')
        xhr.send(formData)
      })

      const result = await uploadPromise
      onLessonUpdate({
        videoUrl: result.url,
        duration: result.duration || lesson.duration,
      })
      toast.success(`Video uploaded successfully! (${result.fileSize})`)
    } catch (error) {
      console.error('Video upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files[0]
    if (file) handleVideoUpload(file)
  }

  const handleVideoDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleSrtUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'subtitle')
      formData.append('lessonId', lesson.id)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json()
      onLessonUpdate({ captions: { mode: 'upload_srt', languages: [...(lesson.captions?.languages || []), 'en'] } })
      toast.success('Subtitle file uploaded!')
    } catch {
      toast.error('Failed to upload subtitle file')
    }
  }

  const handleDeleteVideo = async () => {
    if (lesson.videoUrl && lesson.videoUrl.startsWith('/uploads/')) {
      try {
        await fetch(`/api/upload?url=${encodeURIComponent(lesson.videoUrl)}`, { method: 'DELETE' })
      } catch {
        // Silently fail - file may not exist
      }
    }
    onLessonUpdate({ videoUrl: '', duration: 0 })
  }

  const handleAINotes = async () => {
    setAiNotesLoading(true)
    await new Promise(r => setTimeout(r, 2000))
    onLessonUpdate({
      transcript: 'This is an AI-generated transcript/notes for the lesson. Key points covered:\n\n1. Introduction to the topic\n2. Core concepts and fundamentals\n3. Practical applications\n4. Common pitfalls to avoid\n5. Summary and next steps'
    })
    toast.success('Notes generated!')
    setAiNotesLoading(false)
  }

  // Resources management
  const [resources, setResources] = useState<WizardResource[]>(lesson.resources || [])
  const resourceInputRef = useRef<HTMLInputElement>(null)

  const addResource = () => {
    const newRes: WizardResource = {
      id: generateId('res'),
      title: '',
      url: '',
      type: 'pdf',
    }
    const updated = [...resources, newRes]
    setResources(updated)
    onLessonUpdate({ resources: updated })
  }

  const handleResourceUpload = async (file: File) => {
    // Determine type from file extension
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const typeMap: Record<string, WizardResource['type']> = {
      pdf: 'pdf',
      doc: 'document', docx: 'document',
      mp4: 'video', webm: 'video', mov: 'video',
      jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', svg: 'image',
      js: 'code', ts: 'code', py: 'code', html: 'code', css: 'code', json: 'code',
    }
    const resourceType = typeMap[ext] || 'document'

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', resourceType === 'video' ? 'video' : resourceType === 'image' ? 'image' : 'document')
      formData.append('lessonId', lesson.id)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json()
      const newRes: WizardResource = {
        id: generateId('res'),
        title: file.name,
        url: data.url,
        type: resourceType,
      }
      const updated = [...resources, newRes]
      setResources(updated)
      onLessonUpdate({ resources: updated })
      toast.success(`File "${file.name}" uploaded!`)
    } catch {
      toast.error('Failed to upload file')
    }
  }

  const updateResource = (idx: number, r: WizardResource) => {
    const updated = [...resources]
    updated[idx] = r
    setResources(updated)
    onLessonUpdate({ resources: updated })
  }

  const removeResource = async (idx: number) => {
    const res = resources[idx]
    // Delete from server if it's an uploaded file
    if (res.url.startsWith('/uploads/')) {
      try {
        await fetch(`/api/upload?url=${encodeURIComponent(res.url)}`, { method: 'DELETE' })
      } catch { /* silently fail */ }
    }
    const updated = resources.filter((_, i) => i !== idx)
    setResources(updated)
    onLessonUpdate({ resources: updated })
  }

  return (
    <div className="space-y-5">
      {/* Hidden file inputs */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleVideoUpload(file)
          e.target.value = ''
        }}
      />
      <input
        ref={srtInputRef}
        type="file"
        accept=".srt,.vtt,.txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleSrtUpload(file)
          e.target.value = ''
        }}
      />
      <input
        ref={resourceInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.mp4,.png,.jpg,.jpeg,.gif,.webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleResourceUpload(file)
          e.target.value = ''
        }}
      />

      {/* Video Upload */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-[13px] font-semibold flex items-center gap-2">
            <Video className="size-4 text-primary" />
            Video Source
          </Label>

          {lesson.videoUrl ? (
            <div className="rounded-2xl ios-shadow-sm bg-card p-3 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 shrink-0">
                <Play className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium truncate">
                  {uploadedFileName || (lesson.videoUrl.match(/^(https?:\/\/)/) && !lesson.videoUrl.startsWith('/uploads/') ? 'External Video URL' : 'Video uploaded')}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {lesson.videoUrl.match(/^(https?:\/\/)/) && !lesson.videoUrl.startsWith('/uploads/') ? lesson.videoUrl : formatDuration(lesson.duration)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl text-muted-foreground shrink-0"
                onClick={handleDeleteVideo}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                onClick={() => videoInputRef.current?.click()}
                onDrop={handleVideoDrop}
                onDragOver={handleVideoDragOver}
                className={cn(
                  'rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all',
                  uploading ? 'border-primary/40 bg-primary/5 pointer-events-none' : 'border-border hover:border-primary/40 hover:bg-muted/30'
                )}
              >
                {uploading ? (
                  <div className="space-y-3">
                    <Loader2 className="mx-auto size-8 text-primary animate-spin" />
                    <p className="text-[13px] font-medium">Uploading {uploadedFileName}... {Math.min(Math.round(uploadProgress), 100)}%</p>
                    <Progress value={Math.min(uploadProgress, 100)} className="h-2 max-w-xs mx-auto" />
                    <p className="text-[11px] text-muted-foreground">Please don&apos;t close this page</p>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto size-8 text-muted-foreground/40" />
                    <p className="mt-2 text-[13px] font-medium">
                      Drag & drop or <span className="text-primary">browse</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">MP4, WebM, MOV, AVI • Max 500MB</p>
                  </>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center text-[10px] font-semibold uppercase tracking-wider">
                  <span className="bg-background px-2 text-muted-foreground">Or embed from URL</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-xl bg-muted/50 shrink-0">
                  <Link className="size-4 text-muted-foreground" />
                </div>
                <Input
                  placeholder="Paste YouTube or Vimeo URL here..."
                  className="h-9 rounded-xl text-[13px] flex-1 border-border/60"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const val = (e.target as HTMLInputElement).value.trim()
                      if (val && (val.includes('youtube.com') || val.includes('youtu.be') || val.includes('vimeo.com'))) {
                        onLessonUpdate({ videoUrl: val, duration: 0 })
                      } else if (val) {
                        toast.error('Please enter a valid YouTube or Vimeo URL')
                      }
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim()
                    if (val && (val.includes('youtube.com') || val.includes('youtu.be') || val.includes('vimeo.com'))) {
                      onLessonUpdate({ videoUrl: val, duration: 0 })
                    } else if (val) {
                      toast.error('Please enter a valid YouTube or Vimeo URL')
                      e.target.value = ''
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lesson Notes / Transcript */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[13px] font-semibold flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            Lesson Notes / Transcript
          </Label>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl h-7 text-[11px] gap-1 text-primary hover:bg-primary/10"
            onClick={handleAINotes}
            disabled={aiNotesLoading}
          >
            {aiNotesLoading ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
            AI Generate
          </Button>
        </div>
        <Textarea
          value={lesson.transcript}
          onChange={(e) => onLessonUpdate({ transcript: e.target.value })}
          className="rounded-2xl text-[13px] min-h-[150px] resize-y"
          placeholder="Add lesson notes, transcript, or key takeaways..."
        />
      </div>

      {/* Attachments / Resources */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[13px] font-semibold flex items-center gap-2">
            <File className="size-4 text-primary" />
            Attachments & Resources
          </Label>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl h-7 text-[11px] gap-1 text-primary hover:bg-primary/10"
              onClick={() => resourceInputRef.current?.click()}
            >
              <Upload className="size-3" />
              Upload
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl h-7 text-[11px] gap-1 text-primary hover:bg-primary/10"
              onClick={addResource}
            >
              <Plus className="size-3" />
              Link
            </Button>
          </div>
        </div>
        {resources.length > 0 && (
          <div className="space-y-1.5">
            {resources.map((res, idx) => (
              <ResourceItem
                key={res.id}
                resource={res}
                onUpdate={(r) => updateResource(idx, r)}
                onRemove={() => removeResource(idx)}
              />
            ))}
          </div>
        )}
        {resources.length === 0 && (
          <div
            onClick={() => resourceInputRef.current?.click()}
            className="text-center py-3 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/30 hover:bg-muted/20 transition-colors"
          >
            <Upload className="mx-auto size-4 text-muted-foreground/40" />
            <p className="text-[12px] text-muted-foreground mt-1">Upload files or add links</p>
          </div>
        )}
      </div>

      {/* Captions / Subtitles */}
      <div className="space-y-2">
        <Label className="text-[13px] font-semibold flex items-center gap-2">
          <Settings className="size-4 text-primary" />
          Captions / Subtitles
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'none' as const, label: 'None', desc: 'No captions' },
            { value: 'auto_generate' as const, label: 'Auto-generate', desc: 'AI creates captions' },
            { value: 'upload_srt' as const, label: 'Upload SRT', desc: 'Manual upload' },
          ]).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setCaptionMode(opt.value)
                if (opt.value === 'upload_srt') {
                  srtInputRef.current?.click()
                } else {
                  onLessonUpdate({ captions: { mode: opt.value, languages: lesson.captions?.languages || [] } })
                }
              }}
              className={cn(
                'rounded-xl px-3 py-2.5 text-[11px] font-medium transition-all border text-center',
                captionMode === opt.value
                  ? 'bg-primary text-primary-foreground border-primary ios-shadow-sm'
                  : 'bg-card border-border hover:border-primary/50 text-card-foreground'
              )}
            >
              <div className="font-semibold text-[12px]">{opt.label}</div>
              <div className="opacity-80 mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Free Preview Toggle */}
      <div className="flex items-center justify-between rounded-2xl ios-shadow-sm bg-card p-3">
        <div>
          <p className="text-[13px] font-semibold flex items-center gap-2">
            {lesson.isFree ? <Eye className="size-4 text-emerald-600" /> : <EyeOff className="size-4 text-muted-foreground" />}
            Free Preview
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {lesson.isFree
              ? 'This lesson is visible to non-enrolled students'
              : 'Only enrolled students can access this lesson'}
          </p>
        </div>
        <Switch
          checked={lesson.isFree}
          onCheckedChange={(v) => onLessonUpdate({ isFree: v })}
        />
      </div>
    </div>
  )
}

// ─── Text Lesson Editor ───

function TextLessonEditor({
  lesson,
  onLessonUpdate,
}: {
  lesson: WizardLesson
  onLessonUpdate: (updates: Partial<WizardLesson>) => void
}) {
  const [resources, setResources] = useState<WizardResource[]>(lesson.resources || [])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addResource = () => {
    const newRes: WizardResource = {
      id: generateId('res'),
      title: '',
      url: '',
      type: 'document',
    }
    const updated = [...resources, newRes]
    setResources(updated)
    onLessonUpdate({ resources: updated })
  }

  const handleFileUpload = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const typeMap: Record<string, WizardResource['type']> = {
      pdf: 'pdf',
      doc: 'document', docx: 'document',
      jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image',
      js: 'code', ts: 'code', py: 'code', html: 'code', css: 'code',
    }
    const resourceType = typeMap[ext] || 'document'

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', resourceType === 'image' ? 'image' : 'document')
      formData.append('lessonId', lesson.id)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json()
      const newRes: WizardResource = {
        id: generateId('res'),
        title: file.name,
        url: data.url,
        type: resourceType,
      }
      const updated = [...resources, newRes]
      setResources(updated)
      onLessonUpdate({ resources: updated })
      toast.success(`File "${file.name}" uploaded!`)
    } catch {
      toast.error('Failed to upload file')
    }
  }

  const updateResource = (idx: number, r: WizardResource) => {
    const updated = [...resources]
    updated[idx] = r
    setResources(updated)
    onLessonUpdate({ resources: updated })
  }

  const removeResource = async (idx: number) => {
    const res = resources[idx]
    if (res.url.startsWith('/uploads/')) {
      try {
        await fetch(`/api/upload?url=${encodeURIComponent(res.url)}`, { method: 'DELETE' })
      } catch { /* silently fail */ }
    }
    const updated = resources.filter((_, i) => i !== idx)
    setResources(updated)
    onLessonUpdate({ resources: updated })
  }

  return (
    <div className="space-y-5">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg,.jpeg,.gif,.webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileUpload(file)
          e.target.value = ''
        }}
      />

      {/* Rich Text Content */}
      <div className="space-y-2">
        <Label className="text-[13px] font-semibold flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          Lesson Content
        </Label>
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-1.5 rounded-t-2xl border border-b-0 bg-muted/30">
          {['B', 'I', 'U', 'H1', 'H2', '•', '1.', '""', '—', '</>'].map((tool) => (
            <button
              key={tool}
              type="button"
              className="flex size-7 items-center justify-center rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
              onClick={() => toast.info(`${tool} formatting applied`)}
            >
              {tool}
            </button>
          ))}
        </div>
        <Textarea
          value={lesson.content}
          onChange={(e) => onLessonUpdate({ content: e.target.value })}
          className="rounded-t-0 rounded-b-2xl text-[14px] min-h-[300px] resize-y"
          placeholder="Write your lesson content here...&#10;&#10;Use the toolbar above for formatting, or use Markdown syntax.&#10;&#10;Tip: Break your content into sections with clear headings for better readability."
        />
        <div className="flex justify-between">
          <span className="text-[11px] text-muted-foreground">
            {lesson.content.trim().split(/\s+/).filter(Boolean).length} words
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl h-6 text-[10px] gap-1 text-primary"
            onClick={() => {
              onLessonUpdate({
                content: lesson.content + '\n\n## Key Takeaways\n\n1. \n2. \n3. \n\n---\n\n**Next:** Continue to the next lesson →'
              })
            }}
          >
            <Sparkles className="size-2.5" />
            Add Template
          </Button>
        </div>
      </div>

      {/* Attachments */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[13px] font-semibold">Attachments</Label>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="rounded-xl h-7 text-[11px] gap-1 text-primary" onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-3" /> Upload
            </Button>
            <Button variant="ghost" size="sm" className="rounded-xl h-7 text-[11px] gap-1 text-primary" onClick={addResource}>
              <Plus className="size-3" /> Link
            </Button>
          </div>
        </div>
        {resources.map((res, idx) => (
          <ResourceItem key={res.id} resource={res} onUpdate={(r) => updateResource(idx, r)} onRemove={() => removeResource(idx)} />
        ))}
        {resources.length === 0 && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="text-center py-3 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/30 hover:bg-muted/20 transition-colors"
          >
            <Upload className="mx-auto size-4 text-muted-foreground/40" />
            <p className="text-[12px] text-muted-foreground mt-1">Upload files or add links</p>
          </div>
        )}
      </div>

      <Separator />

      {/* Free Preview */}
      <div className="flex items-center justify-between rounded-2xl ios-shadow-sm bg-card p-3">
        <div>
          <p className="text-[13px] font-semibold flex items-center gap-2">
            {lesson.isFree ? <Eye className="size-4 text-emerald-600" /> : <EyeOff className="size-4 text-muted-foreground" />}
            Free Preview
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {lesson.isFree ? 'Visible to non-enrolled students' : 'Only enrolled students can access'}
          </p>
        </div>
        <Switch checked={lesson.isFree} onCheckedChange={(v) => onLessonUpdate({ isFree: v })} />
      </div>
    </div>
  )
}

// ─── Quiz Builder ───

function QuizBuilder({
  lesson,
  onLessonUpdate,
  modules,
  editingModuleId,
}: {
  lesson: WizardLesson
  onLessonUpdate: (updates: Partial<WizardLesson>) => void
  modules: WizardModule[]
  editingModuleId: string
}) {
  const mod = modules.find(m => m.id === editingModuleId)
  const quiz = mod?.quizzes.find(q => q.id === lesson.id)

  // Use lesson content to store quiz data as JSON if no quiz exists
  const [localQuiz, setLocalQuiz] = useState<WizardQuiz>(() => {
    if (quiz) return quiz
    // Try to parse from lesson content
    try {
      const parsed = JSON.parse(lesson.content)
      if (parsed.questions) return parsed as WizardQuiz
    } catch { /* empty */ }
    return {
      id: lesson.id,
      title: lesson.title,
      description: '',
      type: 'practice',
      timeLimit: 30,
      passingScore: 70,
      maxAttempts: 3,
      randomizeQuestions: false,
      showCorrectAnswers: 'after_submission',
      questions: [],
      isNew: true,
    }
  })

  const updateQuiz = (updates: Partial<WizardQuiz>) => {
    const updated = { ...localQuiz, ...updates }
    setLocalQuiz(updated)
    onLessonUpdate({ content: JSON.stringify(updated) })
  }

  const updateQuestion = (idx: number, q: WizardQuestion) => {
    const questions = [...localQuiz.questions]
    questions[idx] = q
    updateQuiz({ questions })
  }

  const removeQuestion = (idx: number) => {
    updateQuiz({ questions: localQuiz.questions.filter((_, i) => i !== idx) })
  }

  const addQuestion = (type: WizardQuestion['type']) => {
    const newQ: WizardQuestion = {
      id: generateId('q'),
      text: '',
      type,
      options: type === 'true_false' ? ['True', 'False'] : type === 'mcq' ? ['Option 1', 'Option 2', 'Option 3', 'Option 4'] : [],
      correctAnswer: type === 'true_false' ? 'True' : '',
      explanation: '',
      points: 10,
      order: localQuiz.questions.length + 1,
    }
    updateQuiz({ questions: [...localQuiz.questions, newQ] })
  }

  const [aiGenerating, setAiGenerating] = useState(false)

  const handleAIGenerate = async () => {
    setAiGenerating(true)
    await new Promise(r => setTimeout(r, 2500))
    const aiQuestions: WizardQuestion[] = [
      { id: generateId('q'), text: 'What is the main concept covered in this lesson?', type: 'mcq', options: ['Concept A', 'Concept B', 'Concept C', 'Concept D'], correctAnswer: 'Concept A', explanation: 'This is the primary concept introduced in the lesson.', points: 10, order: 1 },
      { id: generateId('q'), text: 'The techniques discussed can be applied in real-world scenarios.', type: 'true_false', options: ['True', 'False'], correctAnswer: 'True', explanation: 'The lesson emphasizes practical application of all techniques.', points: 10, order: 2 },
      { id: generateId('q'), text: 'Name one key benefit of using this approach.', type: 'short_answer', options: [], correctAnswer: 'Improved efficiency and accuracy', explanation: 'This approach streamlines the process.', points: 10, order: 3 },
    ]
    updateQuiz({ questions: [...localQuiz.questions, ...aiQuestions] })
    toast.success(`AI generated ${aiQuestions.length} questions!`)
    setAiGenerating(false)
  }

  return (
    <div className="space-y-5">
      {/* Quiz Settings */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-4 space-y-3">
        <h4 className="text-[13px] font-semibold flex items-center gap-2">
          <Settings className="size-4 text-primary" />
          Quiz Settings
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium">Time Limit (min)</Label>
            <Input
              type="number"
              value={localQuiz.timeLimit}
              onChange={(e) => updateQuiz({ timeLimit: Math.max(1, parseInt(e.target.value) || 1) })}
              className="h-8 rounded-xl text-[12px]"
              min={1}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium">Passing Score (%)</Label>
            <Input
              type="number"
              value={localQuiz.passingScore}
              onChange={(e) => updateQuiz({ passingScore: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) })}
              className="h-8 rounded-xl text-[12px]"
              min={0} max={100}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-medium">Max Attempts</Label>
            <Input
              type="number"
              value={localQuiz.maxAttempts}
              onChange={(e) => updateQuiz({ maxAttempts: Math.max(1, parseInt(e.target.value) || 1) })}
              className="h-8 rounded-xl text-[12px]"
              min={1}
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              checked={localQuiz.randomizeQuestions}
              onCheckedChange={(v) => updateQuiz({ randomizeQuestions: v })}
            />
            <span className="text-[12px]">Randomize questions</span>
          </div>
          <Select
            value={localQuiz.showCorrectAnswers}
            onValueChange={(v) => updateQuiz({ showCorrectAnswers: v as WizardQuiz['showCorrectAnswers'] })}
          >
            <SelectTrigger className="h-7 rounded-lg text-[11px] w-[180px]">
              <SelectValue placeholder="Show answers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="after_submission">Show after submission</SelectItem>
              <SelectItem value="after_course">Show after course</SelectItem>
              <SelectItem value="never">Never show</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[13px] font-semibold flex items-center gap-2">
            <HelpCircle className="size-4 text-amber-600" />
            Questions ({localQuiz.questions.length})
          </h4>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl h-7 text-[11px] gap-1 text-primary hover:bg-primary/10"
            onClick={handleAIGenerate}
            disabled={aiGenerating}
          >
            {aiGenerating ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
            AI Generate
          </Button>
        </div>

        {localQuiz.questions.length === 0 && (
          <div className="text-center py-8 rounded-2xl border-2 border-dashed border-border">
            <HelpCircle className="mx-auto size-8 text-muted-foreground/30" />
            <p className="mt-2 text-[13px] font-medium text-muted-foreground">No questions yet</p>
            <p className="text-[11px] text-muted-foreground/70">Add questions or use AI to generate them</p>
          </div>
        )}

        <AnimatePresence>
          {localQuiz.questions.map((q, idx) => (
            <QuestionEditor
              key={q.id}
              question={q}
              index={idx}
              onUpdate={(updated) => updateQuestion(idx, updated)}
              onRemove={() => removeQuestion(idx)}
            />
          ))}
        </AnimatePresence>

        {/* Add Question Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl ios-press gap-1.5 text-[11px] h-8"
            onClick={() => addQuestion('mcq')}
          >
            <Plus className="size-3" />
            Add MCQ
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl ios-press gap-1.5 text-[11px] h-8"
            onClick={() => addQuestion('true_false')}
          >
            <Plus className="size-3" />
            True/False
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl ios-press gap-1.5 text-[11px] h-8"
            onClick={() => addQuestion('fill_blank')}
          >
            <Plus className="size-3" />
            Fill in Blank
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl ios-press gap-1.5 text-[11px] h-8"
            onClick={() => addQuestion('short_answer')}
          >
            <Plus className="size-3" />
            Short Answer
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Assignment Builder ───

function AssignmentBuilder({
  lesson,
  onLessonUpdate,
}: {
  lesson: WizardLesson
  onLessonUpdate: (updates: Partial<WizardLesson>) => void
}) {
  // Parse assignment data from lesson content
  const [assignment, setAssignment] = useState(() => {
    try {
      const parsed = JSON.parse(lesson.content)
      return {
        instructions: parsed.instructions || '',
        submissionType: parsed.submissionType || 'text' as const,
        allowedFileTypes: parsed.allowedFileTypes || ['pdf', 'doc', 'docx'],
        maxFileSize: parsed.maxFileSize || 10,
        dueDate: parsed.dueDate || '',
        gradingType: parsed.gradingType || 'instructor' as const,
        rubric: parsed.rubric || [],
      }
    } catch {
      return {
        instructions: '',
        submissionType: 'text' as const,
        allowedFileTypes: ['pdf', 'doc', 'docx'],
        maxFileSize: 10,
        dueDate: '',
        gradingType: 'instructor' as const,
        rubric: [] as RubricItem[],
      }
    }
  })

  const [aiRubricLoading, setAiRubricLoading] = useState(false)

  const updateAssignment = (updates: Partial<typeof assignment>) => {
    const updated = { ...assignment, ...updates }
    setAssignment(updated)
    onLessonUpdate({ content: JSON.stringify(updated) })
  }

  const handleAIRubric = async () => {
    setAiRubricLoading(true)
    await new Promise(r => setTimeout(r, 2000))
    const rubric: RubricItem[] = [
      { id: generateId('rubric'), criteria: 'Understanding', description: 'Demonstrates comprehension of core concepts', maxPoints: 25 },
      { id: generateId('rubric'), criteria: 'Application', description: 'Applies concepts correctly to solve problems', maxPoints: 25 },
      { id: generateId('rubric'), criteria: 'Quality', description: 'Work is well-organized and clearly presented', maxPoints: 25 },
      { id: generateId('rubric'), criteria: 'Originality', description: 'Shows independent thinking and creativity', maxPoints: 25 },
    ]
    updateAssignment({ rubric })
    toast.success('Rubric generated!')
    setAiRubricLoading(false)
  }

  const FILE_TYPE_OPTIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'txt', 'py', 'js', 'java', 'cpp', 'html', 'css']
  const [showFilePicker, setShowFilePicker] = useState(false)

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="space-y-2">
        <Label className="text-[13px] font-semibold">Assignment Title</Label>
        <Input
          value={lesson.title}
          onChange={(e) => onLessonUpdate({ title: e.target.value })}
          className="h-10 rounded-2xl text-[14px]"
          placeholder="Assignment title..."
        />
      </div>

      {/* Instructions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[13px] font-semibold">Instructions</Label>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl h-7 text-[11px] gap-1 text-primary hover:bg-primary/10"
            onClick={() => {
              updateAssignment({
                instructions: '## Assignment Overview\n\nIn this assignment, you will:\n\n1. \n2. \n3. \n\n## Requirements\n\n- \n- \n\n## Submission\n\nPlease submit your work by [deadline]. Late submissions will incur a 10% penalty per day.'
              })
            }}
          >
            <Sparkles className="size-3" />
            Use Template
          </Button>
        </div>
        <Textarea
          value={assignment.instructions}
          onChange={(e) => updateAssignment({ instructions: e.target.value })}
          className="rounded-2xl text-[13px] min-h-[150px] resize-y"
          placeholder="Provide detailed instructions for the assignment..."
        />
      </div>

      <Separator />

      {/* Submission Type */}
      <div className="space-y-2">
        <Label className="text-[13px] font-semibold">Submission Type</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {([
            { value: 'file' as const, label: 'File Upload', icon: Upload },
            { value: 'text' as const, label: 'Text', icon: FileText },
            { value: 'url' as const, label: 'Link', icon: Link },
            { value: 'multiple' as const, label: 'Code Editor', icon: Gamepad2 },
          ]).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateAssignment({ submissionType: opt.value })}
              className={cn(
                'rounded-xl px-3 py-2.5 text-[11px] font-medium transition-all border text-center',
                assignment.submissionType === opt.value
                  ? 'bg-primary text-primary-foreground border-primary ios-shadow-sm'
                  : 'bg-card border-border hover:border-primary/50 text-card-foreground'
              )}
            >
              <opt.icon className="size-4 mx-auto mb-1" />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* File Settings (when file upload selected) */}
      {assignment.submissionType === 'file' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-[12px] font-medium">Allowed File Types</Label>
            <div className="flex flex-wrap gap-1.5">
              {assignment.allowedFileTypes.map((ft) => (
                <Badge key={ft} variant="secondary" className="rounded-lg text-[11px] pr-1 gap-1">
                  .{ft}
                  <button
                    onClick={() => updateAssignment({
                      allowedFileTypes: assignment.allowedFileTypes.filter(t => t !== ft)
                    })}
                    className="flex size-3.5 items-center justify-center rounded-full hover:bg-destructive/20"
                  >
                    <X className="size-2" />
                  </button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg h-5 text-[10px] gap-0.5 text-primary px-1.5"
                onClick={() => setShowFilePicker(!showFilePicker)}
              >
                <Plus className="size-2.5" /> Add
              </Button>
            </div>
            <AnimatePresence>
              {showFilePicker && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-1 p-2 rounded-xl bg-muted/30 border">
                    {FILE_TYPE_OPTIONS.filter(ft => !assignment.allowedFileTypes.includes(ft)).map((ft) => (
                      <button
                        key={ft}
                        type="button"
                        onClick={() => updateAssignment({
                          allowedFileTypes: [...assignment.allowedFileTypes, ft]
                        })}
                        className="rounded-lg px-2 py-0.5 text-[10px] bg-background border hover:border-primary/50"
                      >
                        .{ft}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-medium">Max File Size (MB)</Label>
            <Input
              type="number"
              value={assignment.maxFileSize}
              onChange={(e) => updateAssignment({ maxFileSize: Math.max(1, parseInt(e.target.value) || 1) })}
              className="h-8 rounded-xl text-[12px]"
              min={1}
            />
          </div>
        </div>
      )}

      {/* Due Date */}
      <div className="space-y-1.5">
        <Label className="text-[12px] font-medium">Due Date (optional)</Label>
        <Input
          type="date"
          value={assignment.dueDate}
          onChange={(e) => updateAssignment({ dueDate: e.target.value })}
          className="h-9 rounded-xl text-[12px]"
        />
      </div>

      <Separator />

      {/* Grading Type */}
      <div className="space-y-2">
        <Label className="text-[13px] font-semibold">Grading Type</Label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'instructor' as const, label: 'Instructor Manual', desc: 'You grade manually' },
            { value: 'ai_assisted' as const, label: 'AI-Assisted', desc: 'AI suggests grades' },
            { value: 'peer_review' as const, label: 'Peer Review', desc: 'Students grade each other' },
          ]).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateAssignment({ gradingType: opt.value })}
              className={cn(
                'rounded-xl px-3 py-2 text-[11px] font-medium transition-all border text-center',
                assignment.gradingType === opt.value
                  ? 'bg-primary text-primary-foreground border-primary ios-shadow-sm'
                  : 'bg-card border-border hover:border-primary/50 text-card-foreground'
              )}
            >
              <div className="font-semibold text-[12px]">{opt.label}</div>
              <div className="opacity-80 mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Rubric */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div />
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl h-7 text-[11px] gap-1 text-primary hover:bg-primary/10"
            onClick={handleAIRubric}
            disabled={aiRubricLoading}
          >
            {aiRubricLoading ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
            AI Generate Rubric
          </Button>
        </div>
        <RubricTable
          rubric={assignment.rubric}
          onRubricChange={(rubric) => updateAssignment({ rubric })}
        />
      </div>
    </div>
  )
}

// ─── Live Preview (Student View) ───

function LivePreview({ lesson }: { lesson: WizardLesson | null }) {
  if (!lesson) {
    return (
      <div className="h-full flex items-center justify-center text-center p-6">
        <div>
          <Eye className="mx-auto size-10 text-muted-foreground/20" />
          <p className="mt-3 text-[14px] font-semibold text-muted-foreground">Student Preview</p>
          <p className="text-[12px] text-muted-foreground/70 mt-1">Select a lesson to preview how students will see it</p>
        </div>
      </div>
    )
  }

  const lessonType = LESSON_TYPES.find(lt => lt.value === lesson.type)

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Preview Header */}
        <div className="rounded-2xl ios-shadow-sm bg-gradient-to-r from-primary/10 to-teal-500/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ContentIcon type={lesson.type} />
            <Badge variant="outline" className="text-[10px] h-5 rounded-lg">
              {lessonType?.label || lesson.type}
            </Badge>
            {lesson.isFree && (
              <Badge className="text-[10px] h-5 rounded-lg bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
                Free Preview
              </Badge>
            )}
          </div>
          <h3 className="text-[17px] font-bold">{lesson.title || 'Untitled Lesson'}</h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" />
              {formatDuration(lesson.duration)}
            </span>
          </div>
        </div>

        {/* Preview Content based on type */}
        {lesson.type === 'video' && (
          <div className="rounded-2xl bg-muted aspect-video flex items-center justify-center">
            <div className="text-center">
              <Play className="size-12 text-muted-foreground/30 mx-auto" />
              <p className="text-[12px] text-muted-foreground mt-2">Video Player</p>
              {lesson.videoUrl && (
                <p className="text-[10px] text-emerald-600 mt-1">✓ Video uploaded</p>
              )}
            </div>
          </div>
        )}

        {lesson.type === 'text' && (
          <div className="rounded-2xl bg-card p-4 ios-shadow-sm">
            {lesson.content ? (
              <div className="text-[13px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {lesson.content.slice(0, 500)}
                {lesson.content.length > 500 && (
                  <span className="text-muted-foreground">... (truncated in preview)</span>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="size-8 text-muted-foreground/20 mx-auto" />
                <p className="text-[12px] text-muted-foreground mt-2">No content yet</p>
              </div>
            )}
          </div>
        )}

        {lesson.type === 'quiz' && (
          <div className="rounded-2xl bg-card p-4 ios-shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="size-5 text-amber-600" />
              <span className="text-[14px] font-semibold">Quiz</span>
            </div>
            {(() => {
              try {
                const quizData = JSON.parse(lesson.content)
                return (
                  <div className="space-y-2">
                    <p className="text-[12px] text-muted-foreground">
                      {quizData.questions?.length || 0} question{quizData.questions?.length !== 1 ? 's' : ''} • {quizData.timeLimit || 30} min • Pass: {quizData.passingScore || 70}%
                    </p>
                    {(quizData.questions || []).slice(0, 3).map((q: WizardQuestion, i: number) => (
                      <div key={q.id} className="rounded-xl bg-background p-3 border">
                        <p className="text-[12px] font-medium">{i + 1}. {q.text || 'Untitled question'}</p>
                      </div>
                    ))}
                    {(quizData.questions?.length || 0) > 3 && (
                      <p className="text-[11px] text-muted-foreground">
                        +{(quizData.questions?.length || 0) - 3} more questions
                      </p>
                    )}
                  </div>
                )
              } catch {
                return <p className="text-[12px] text-muted-foreground">No questions added yet</p>
              }
            })()}
          </div>
        )}

        {lesson.type === 'assignment' && (
          <div className="rounded-2xl bg-card p-4 ios-shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="size-5 text-teal-600" />
              <span className="text-[14px] font-semibold">Assignment</span>
            </div>
            {(() => {
              try {
                const data = JSON.parse(lesson.content)
                return (
                  <div className="space-y-2">
                    {data.instructions && (
                      <p className="text-[12px] text-muted-foreground line-clamp-4">{data.instructions}</p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-[10px] rounded-lg">
                        {SUBMISSION_TYPES.find(s => s.value === data.submissionType)?.label || 'Text'}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] rounded-lg">
                        Max: {data.maxFileSize || 10}MB
                      </Badge>
                      {data.dueDate && (
                        <Badge variant="outline" className="text-[10px] rounded-lg">
                          Due: {data.dueDate}
                        </Badge>
                      )}
                    </div>
                    {data.rubric?.length > 0 && (
                      <p className="text-[11px] text-muted-foreground">
                        Grading rubric: {data.rubric.length} criteria ({data.rubric.reduce((a: number, r: RubricItem) => a + r.maxPoints, 0)} total pts)
                      </p>
                    )}
                  </div>
                )
              } catch {
                return <p className="text-[12px] text-muted-foreground">No instructions yet</p>
              }
            })()}
          </div>
        )}

        {(lesson.type === 'interactive' || lesson.type === 'live-session' || lesson.type === 'download') && (
          <div className="rounded-2xl bg-card p-4 ios-shadow-sm text-center">
            <ContentIcon type={lesson.type} className="mx-auto size-12" />
            <p className="text-[13px] font-medium mt-3">
              {lesson.type === 'interactive' ? 'Interactive Code Lab' :
               lesson.type === 'live-session' ? 'Live Session' : 'Downloadable Resource'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Content will be configured in the editor
            </p>
          </div>
        )}

        {/* Transcript/Notes Preview */}
        {lesson.transcript && lesson.type === 'video' && (
          <div className="rounded-2xl bg-card p-4 ios-shadow-sm">
            <p className="text-[12px] font-semibold mb-1">Lesson Notes</p>
            <p className="text-[12px] text-muted-foreground line-clamp-5">{lesson.transcript}</p>
          </div>
        )}

        {/* Resources Preview */}
        {lesson.resources && lesson.resources.length > 0 && (
          <div className="rounded-2xl bg-card p-4 ios-shadow-sm">
            <p className="text-[12px] font-semibold mb-2">Resources ({lesson.resources.length})</p>
            {lesson.resources.map((r) => (
              <div key={r.id} className="flex items-center gap-2 py-1">
                <div className="flex size-5 items-center justify-center rounded-md bg-primary/10 text-primary text-[9px] font-bold">
                  {r.type.toUpperCase().slice(0, 3)}
                </div>
                <span className="text-[12px] text-foreground">{r.title || 'Untitled resource'}</span>
              </div>
            ))}
          </div>
        )}

        {/* Nav */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Button variant="ghost" size="sm" className="rounded-xl text-[11px]">
            <ArrowLeft className="size-3 mr-1" />
            Previous
          </Button>
          <Button size="sm" className="rounded-xl text-[11px] gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            Next
            <ArrowLeft className="size-3 rotate-180" />
          </Button>
        </div>
      </div>
    </ScrollArea>
  )
}

// ─── Main Component ───

export function Step3Content({
  form,
  onFormChange,
  editingLesson,
  onEditLesson,
  onBack,
  onNext,
  onPrevious,
  courseId,
}: Step3ContentProps) {
  const modules = form.modules

  // Find the current lesson being edited
  const currentModule = editingLesson ? modules.find(m => m.id === editingLesson.moduleId) : null
  const currentLesson = editingLesson && currentModule
    ? currentModule.lessons.find(l => l.id === editingLesson.lessonId)
    : null

  // Use currentLesson directly as the editable source (derived from form data)
  // No need for separate local state since updateLesson pushes to form immediately
  const lessonContent = currentLesson

  // Update lesson in form data (lessonContent is derived, no local state needed)
  const updateLesson = useCallback((updates: Partial<WizardLesson>) => {
    if (!lessonContent || !editingLesson) return

    const updated = { ...lessonContent, ...updates }

    onFormChange({
      modules: modules.map(m =>
        m.id === editingLesson.moduleId
          ? {
              ...m,
              lessons: m.lessons.map(l =>
                l.id === editingLesson.lessonId ? updated : l
              )
            }
          : m
      )
    })
  }, [lessonContent, editingLesson, modules, onFormChange])

  // ─── Content Progress Stats ───
  const contentStats = (() => {
    let total = 0
    let withContent = 0
    modules.forEach(m => {
      m.lessons.forEach(l => {
        total++
        if (l.content.trim().length > 0 || l.videoUrl) withContent++
      })
    })
    return { total, withContent, percent: total > 0 ? Math.round((withContent / total) * 100) : 0 }
  })()

  // If no lesson is selected, show lesson picker
  if (!editingLesson || !currentLesson) {
    return (
      <div className="flex flex-col h-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
          className="flex flex-col h-full"
        >
          {/* ─── Header with Progress Summary ─── */}
          <div className="shrink-0 space-y-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[17px] font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="size-5 text-primary" />
                  Content Editor
                </h3>
                <p className="text-[13px] text-muted-foreground mt-0.5">
                  Click any lesson below to edit its content, or go back to add more lessons
                </p>
              </div>
              <Button
                variant="outline"
                onClick={onBack}
                className="rounded-xl ios-press gap-2 shrink-0"
              >
                <ArrowLeft className="size-3.5" />
                Curriculum
              </Button>
            </div>

            {/* Progress bar */}
            {contentStats.total > 0 && (
              <div className="rounded-2xl ios-shadow-sm bg-card border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] font-semibold">Content Progress</span>
                  <span className="text-[12px] text-muted-foreground">
                    <span className={cn(
                      'font-bold',
                      contentStats.percent === 100 ? 'text-emerald-600' :
                      contentStats.percent >= 50 ? 'text-amber-600' : 'text-red-500'
                    )}>
                      {contentStats.withContent}
                    </span>
                    {' / '}{contentStats.total} lessons have content
                  </span>
                </div>
                <Progress
                  value={contentStats.percent}
                  className="h-2"
                />
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600">
                    <div className="size-2 rounded-full bg-emerald-500" />
                    Complete ({contentStats.withContent})
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-600">
                    <div className="size-2 rounded-full bg-amber-400" />
                    Needs content ({contentStats.total - contentStats.withContent})
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── Lesson Grid by Module ─── */}
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
            {modules.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border-2 border-dashed border-border">
                <Layers className="mx-auto size-12 text-muted-foreground/20" />
                <h4 className="mt-3 text-[15px] font-semibold text-muted-foreground">No Modules Yet</h4>
                <p className="text-[12px] text-muted-foreground/70 mt-1 max-w-[280px] mx-auto">
                  Go back to the Structure step to create modules and add lessons
                </p>
                <Button
                  onClick={onBack}
                  className="rounded-2xl ios-press mt-4 gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                >
                  <ArrowLeft className="size-4" />
                  Back to Structure
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                {modules.map((mod, modIdx) => {
                  const modLessonsWithContent = mod.lessons.filter(l => l.content.trim().length > 0 || l.videoUrl).length
                  const modProgress = mod.lessons.length > 0 ? Math.round((modLessonsWithContent / mod.lessons.length) * 100) : 0

                  return (
                    <div key={mod.id} className="space-y-2.5">
                      {/* Module Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-[12px] font-bold">
                            {modIdx + 1}
                          </div>
                          <div>
                            <h4 className="text-[14px] font-semibold">{mod.title || 'Untitled Module'}</h4>
                            <p className="text-[11px] text-muted-foreground">
                              {mod.lessons.length} lesson{mod.lessons.length !== 1 ? 's' : ''} • {modLessonsWithContent} with content
                            </p>
                          </div>
                        </div>
                        {mod.lessons.length > 0 && (
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] h-5 rounded-lg',
                              modProgress === 100
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                                : modProgress > 0
                                ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800'
                                : 'bg-red-50 text-red-500 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800'
                            )}
                          >
                            {modProgress}% done
                          </Badge>
                        )}
                      </div>

                      {/* Lesson Cards */}
                      {mod.lessons.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {mod.lessons.map((lesson, lessonIdx) => {
                            const hasContent = lesson.content.trim().length > 0 || lesson.videoUrl
                            return (
                              <motion.button
                                key={lesson.id}
                                whileHover={{ scale: 1.01, y: -1 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => onEditLesson(mod.id, lesson.id)}
                                className={cn(
                                  'w-full rounded-xl ios-shadow-sm bg-card p-3.5 flex items-center gap-3 border-2 transition-all text-left group',
                                  hasContent
                                    ? 'border-emerald-200/50 dark:border-emerald-800/30 hover:border-emerald-400/60'
                                    : 'border-amber-200/50 dark:border-amber-800/30 hover:border-amber-400/60'
                                )}
                              >
                                <ContentIcon type={lesson.type} />
                                <div className="min-w-0 flex-1">
                                  <p className="text-[13px] font-semibold truncate group-hover:text-primary transition-colors">
                                    {lesson.title || 'Untitled Lesson'}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-muted-foreground">
                                      {formatDuration(lesson.duration)}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">•</span>
                                    <span className="text-[10px] text-muted-foreground">
                                      {LESSON_TYPES.find(lt => lt.value === lesson.type)?.label}
                                    </span>
                                  </div>
                                </div>
                                {hasContent ? (
                                  <div className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 shrink-0">
                                    <Check className="size-3.5" />
                                  </div>
                                ) : (
                                  <div className="flex size-6 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 shrink-0">
                                    <PenTool className="size-3" />
                                  </div>
                                )}
                              </motion.button>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-5 rounded-xl border-2 border-dashed border-border">
                          <p className="text-[12px] text-muted-foreground/60">
                            No lessons in this module — add some in the Structure step
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ─── Navigation ─── */}
          <div className="flex items-center justify-between pt-4 mt-3 shrink-0 border-t border-border/60">
            <Button variant="outline" className="rounded-2xl ios-press gap-2" onClick={onPrevious}>
              <ChevronDown className="size-4 rotate-90" />
              Previous
            </Button>
            <Button
              onClick={onNext}
              className="rounded-2xl ios-press gap-2 min-w-[160px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
            >
              Next: Pricing
              <ChevronDown className="size-4 -rotate-90" />
            </Button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* ─── Top Bar ─── */}
      <div className="rounded-2xl ios-shadow-sm bg-card border border-border p-2 px-3 mb-3 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-xl ios-press gap-1.5 shrink-0"
              onClick={onBack}
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Curriculum</span>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <ContentIcon type={currentLesson.type} />
            <div className="min-w-0">
              <p className="text-[14px] font-semibold truncate">
                {currentLesson.title || 'Untitled Lesson'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {currentModule.title} • {formatDuration(currentLesson.duration)}
              </p>
            </div>
          </div>

          {/* Lesson Type Tabs */}
          <div className="hidden sm:flex items-center gap-1 bg-muted/40 rounded-xl p-1">
            {LESSON_TYPES.filter(lt => ['video', 'text', 'quiz', 'assignment'].includes(lt.value)).map((lt) => (
              <button
                key={lt.value}
                onClick={() => updateLesson({ type: lt.value as WizardLesson['type'] })}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all',
                  currentLesson.type === lt.value
                    ? 'bg-primary text-primary-foreground ios-shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <span className="mr-1">{lt.icon}</span>
                {lt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Split View: 60/40 ─── */}
      <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-0">
        {/* Left Panel (60%) - Editor */}
        <div className="lg:w-[60%] min-w-0 min-h-0 flex flex-col">
          <div className="rounded-2xl ios-shadow-sm bg-card border border-border overflow-hidden flex-1 flex flex-col">
            {/* Editor Header */}
            <div className="p-2 px-3 border-b bg-muted/20 flex items-center gap-2 shrink-0">
              <ContentIcon type={currentLesson.type} className="size-4" />
              <span className="text-[13px] font-semibold">
                {currentLesson.type === 'video' ? 'Video Lesson Editor' :
                 currentLesson.type === 'text' ? 'Text Lesson Editor' :
                 currentLesson.type === 'quiz' ? 'Quiz Builder' :
                 currentLesson.type === 'assignment' ? 'Assignment Builder' :
                 'Content Editor'}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <div className="p-4">
                <motion.div
                  key={currentLesson.type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={SPRING}
                >
                  {currentLesson.type === 'video' && lessonContent && (
                    <VideoLessonEditor
                      lesson={lessonContent}
                      onLessonUpdate={updateLesson}
                    />
                  )}

                  {currentLesson.type === 'text' && lessonContent && (
                    <TextLessonEditor
                      lesson={lessonContent}
                      onLessonUpdate={updateLesson}
                    />
                  )}

                  {currentLesson.type === 'quiz' && lessonContent && (
                    <QuizBuilder
                      lesson={lessonContent}
                      onLessonUpdate={updateLesson}
                      modules={modules}
                      editingModuleId={editingLesson.moduleId}
                    />
                  )}

                  {currentLesson.type === 'assignment' && lessonContent && (
                    <AssignmentBuilder
                      lesson={lessonContent}
                      onLessonUpdate={updateLesson}
                    />
                  )}

                  {(currentLesson.type === 'interactive' || currentLesson.type === 'live-session' || currentLesson.type === 'download') && lessonContent && (
                    <div className="space-y-5">
                      <div className="text-center py-8 rounded-2xl border-2 border-dashed border-border">
                        <ContentIcon type={currentLesson.type} className="mx-auto size-16" />
                        <p className="mt-3 text-[15px] font-semibold">
                          {currentLesson.type === 'interactive' ? 'Interactive Code Lab' :
                           currentLesson.type === 'live-session' ? 'Live Session' : 'Downloadable Resource'}
                        </p>
                        <p className="text-[12px] text-muted-foreground mt-1">
                          This content type will be configured after course setup
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[13px] font-semibold">Description</Label>
                        <Textarea
                          value={lessonContent.description}
                          onChange={(e) => updateLesson({ description: e.target.value })}
                          className="rounded-2xl text-[13px] min-h-[100px] resize-y"
                          placeholder="Describe this content..."
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-2xl ios-shadow-sm bg-muted/30 p-3">
                        <div>
                          <p className="text-[13px] font-semibold flex items-center gap-2">
                            {lessonContent.isFree ? <Eye className="size-4 text-emerald-600" /> : <EyeOff className="size-4 text-muted-foreground" />}
                            Free Preview
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {lessonContent.isFree ? 'Visible to non-enrolled students' : 'Only enrolled students can access'}
                          </p>
                        </div>
                        <Switch checked={lessonContent.isFree} onCheckedChange={(v) => updateLesson({ isFree: v })} />
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel (40%) - Live Preview */}
        <div className="lg:w-[40%] min-w-0 min-h-0 flex flex-col">
          <div className="rounded-2xl ios-shadow-sm bg-card border border-border overflow-hidden flex-1 flex flex-col">
            <div className="p-2 px-3 border-b bg-muted/20 flex items-center gap-2 shrink-0">
              <Eye className="size-4 text-primary" />
              <span className="text-[13px] font-semibold">Student Preview</span>
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 rounded-md ml-auto">
                Live
              </Badge>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <LivePreview lesson={lessonContent} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Navigation ─── */}
      <div className="flex items-center justify-between pt-3 mt-2 shrink-0 border-t border-border/60">
        <Button variant="outline" className="rounded-2xl ios-press gap-2" onClick={onPrevious}>
          <ChevronDown className="size-4 rotate-90" />
          Previous
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="rounded-2xl ios-press gap-1.5"
            onClick={onBack}
          >
            <Layers className="size-4" />
            All Lessons
          </Button>
          <Button
            onClick={onNext}
            className="rounded-2xl ios-press gap-2 min-w-[160px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
          >
            Next: Pricing
            <ChevronDown className="size-4 -rotate-90" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Step3Content
