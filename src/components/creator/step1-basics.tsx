'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PenTool, Sparkles, Upload, Image, Video, Link, X, FileText,
  ChevronDown, Check, Globe, BookOpen, Clock, AlertCircle,
  Loader2, Plus, Trash2, GripVertical, Languages, BarChart3,
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
import type { CourseFormData, WizardResource } from './types'
import { CATEGORIES, SUBCATEGORIES, LEVELS, LANGUAGES, SPRING, CARD_SPRING } from './constants'

// ─── Props ───

export interface Step1BasicsProps {
  form: CourseFormData
  onFormChange: (updates: Partial<CourseFormData>) => void
  onNext: () => void
}

// ─── Sub-components ───

function CharCounter({ current, max, warnAt }: { current: number; max: number; warnAt?: number }) {
  const threshold = warnAt ?? max * 0.9
  return (
    <span className={cn(
      'text-[11px] font-medium tabular-nums',
      current > max ? 'text-destructive' :
      current > threshold ? 'text-amber-600' :
      'text-muted-foreground'
    )}>
      {current}/{max}
    </span>
  )
}

function WordCounter({ text, min }: { text: string; min: number }) {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const pct = Math.min((words / min) * 100, 100)
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className={cn(
          'text-[11px] font-medium',
          words >= min ? 'text-emerald-600' : 'text-amber-600'
        )}>
          {words} word{words !== 1 ? 's' : ''} (min {min})
        </span>
        {words >= min && (
          <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <Check className="size-3" /> Meets minimum
          </span>
        )}
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  )
}

function AISuggestionButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="rounded-xl h-8 gap-1.5 text-primary hover:text-primary hover:bg-primary/10 ios-press"
      onClick={onClick}
      disabled={loading}
    >
      {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
      AI Suggest
    </Button>
  )
}

function DropZone({
  accept,
  label,
  icon: Icon,
  specs,
  file,
  onFileChange,
  onClear,
  aiLabel,
  onAI,
  aiLoading,
}: {
  accept: string
  label: string
  icon: React.ElementType
  specs: string[]
  file: File | null
  onFileChange: (file: File | null) => void
  onClear: () => void
  aiLabel?: string
  onAI?: () => void
  aiLoading?: boolean
}) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) onFileChange(dropped)
  }, [onFileChange])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-[14px] font-semibold flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          {label}
        </Label>
        {aiLabel && onAI && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-xl h-8 gap-1.5 text-primary hover:bg-primary/10 ios-press"
            onClick={onAI}
            disabled={aiLoading}
          >
            {aiLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            {aiLabel}
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFileChange(f)
        }}
      />

      {file ? (
        <div className="rounded-2xl ios-shadow-sm bg-card p-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium truncate">{file.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={onClear}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <motion.div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ios-press',
            dragOver
              ? 'border-primary bg-primary/5 ios-shadow'
              : 'border-border hover:border-primary/40 hover:bg-muted/30'
          )}
        >
          <div className={cn(
            'mx-auto flex size-12 items-center justify-center rounded-2xl mb-3 transition-colors',
            dragOver ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
          )}>
            <Upload className="size-5" />
          </div>
          <p className="text-[13px] font-medium text-foreground">
            Drag & drop or <span className="text-primary">browse</span>
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
            {specs.map((s) => (
              <span key={s} className="text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-lg">
                {s}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ─── Main Component ───

export function Step1Basics({ form, onFormChange, onNext }: Step1BasicsProps) {
  const [aiLoadingTitle, setAiLoadingTitle] = useState(false)
  const [aiLoadingDesc, setAiLoadingDesc] = useState(false)
  const [aiLoadingThumb, setAiLoadingThumb] = useState(false)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [promoFile, setPromoFile] = useState<File | null>(null)
  const [promoLink, setPromoLink] = useState('')
  const [promoMode, setPromoMode] = useState<'upload' | 'link'>('upload')
  const [subLanguages, setSubLanguages] = useState<string[]>(form.subtitleLanguages)
  const [showSubLangPicker, setShowSubLangPicker] = useState(false)
  const [topicInput, setTopicInput] = useState('')
  const [topicTags, setTopicTags] = useState<string[]>(
    form.topicTag ? form.topicTag.split(',').map(t => t.trim()).filter(Boolean) : []
  )

  const SUB_LANG_OPTIONS = ['English', 'Arabic', 'Chinese', 'French', 'German', 'Spanish', 'Hindi', 'Turkish', 'Japanese', 'Korean']

  // ─── AI Handlers (real API) ───

  const handleAISuggestTitle = async () => {
    setAiLoadingTitle(true)
    try {
      const res = await fetch('/api/instructor/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Generate a compelling course title for a ${form.difficultyLevel} level ${form.category || 'professional'} course. Return ONLY the title, nothing else.`,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const title = (data.response || data.content || '').replace(/^["]["']|["]["']$/g, '').trim()
        if (title) {
          onFormChange({ title: title.slice(0, 100) })
          toast.success('Title suggested!', { description: title })
        }
      } else {
        throw new Error('Failed to generate title')
      }
    } catch {
      toast.error('AI suggestion failed', { description: 'Please try again' })
    } finally {
      setAiLoadingTitle(false)
    }
  }

  const handleAIWriteDescription = async () => {
    setAiLoadingDesc(true)
    try {
      const res = await fetch('/api/instructor/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          level: form.difficultyLevel,
          language: form.language,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const desc = data.description || data.content || ''
        if (desc) {
          onFormChange({ description: desc })
          toast.success('Description generated!', { description: 'Feel free to edit and customize' })
        }
      } else {
        throw new Error('Failed to generate description')
      }
    } catch {
      toast.error('AI generation failed', { description: 'Please try again' })
    } finally {
      setAiLoadingDesc(false)
    }
  }

  const handleAIThumbnail = async () => {
    if (!form.title.trim()) {
      toast.error('Please enter a course title first')
      return
    }
    setAiLoadingThumb(true)
    try {
      const res = await fetch('/api/instructor/ai/generate-thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          style: 'modern',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.images && data.images.length > 0) {
          // Use the first generated image (base64)
          const imageUrl = `data:image/png;base64,${data.images[0]}`
          onFormChange({ thumbnail: imageUrl })
          toast.success('Thumbnail generated!', { description: `${data.images.length} variant${data.images.length > 1 ? 's' : ''} created` })
        } else {
          throw new Error('No images returned')
        }
      } else {
        throw new Error('Failed to generate thumbnail')
      }
    } catch {
      toast.error('AI thumbnail generation failed', { description: 'Please try again or upload an image manually' })
    } finally {
      setAiLoadingThumb(false)
    }
  }

  // ─── Topic Tags ───

  const addTopicTag = () => {
    const tag = topicInput.trim().replace(/,$/g, '')
    if (tag && !topicTags.includes(tag)) {
      const newTags = [...topicTags, tag]
      setTopicTags(newTags)
      onFormChange({ topicTag: newTags.join(', ') })
      setTopicInput('')
    }
  }

  const removeTopicTag = (tag: string) => {
    const newTags = topicTags.filter(t => t !== tag)
    setTopicTags(newTags)
    onFormChange({ topicTag: newTags.join(', ') })
  }

  // ─── Subtitle Languages ───

  const toggleSubLang = (lang: string) => {
    const updated = subLanguages.includes(lang)
      ? subLanguages.filter(l => l !== lang)
      : [...subLanguages, lang]
    setSubLanguages(updated)
    onFormChange({ subtitleLanguages: updated })
  }

  // ─── Validation ───

  const canProceed = form.title.trim().length >= 3 && form.description.trim().length >= 10 && form.category.trim() !== ''

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="space-y-6"
      >
        {/* ─── Course Title ─── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[14px] font-semibold flex items-center gap-2">
              <PenTool className="size-4 text-primary" />
              Course Title <span className="text-destructive">*</span>
            </Label>
            <AISuggestionButton onClick={handleAISuggestTitle} loading={aiLoadingTitle} />
          </div>
          <Input
            value={form.title}
            onChange={(e) => onFormChange({ title: e.target.value.slice(0, 100) })}
            className={cn(
              'h-12 rounded-2xl text-[15px] transition-all',
              form.title.length > 90 ? 'border-amber-400 focus-visible:ring-amber-400/30' : ''
            )}
            placeholder="e.g. IB Mathematics – Complete Course"
            maxLength={100}
          />
          <div className="flex justify-between items-center">
            <p className="text-[11px] text-muted-foreground">Make it descriptive and searchable</p>
            <CharCounter current={form.title.length} max={100} />
          </div>
        </div>

        {/* ─── Course Subtitle ─── */}
        <div className="space-y-2">
          <Label className="text-[14px] font-semibold">Course Subtitle</Label>
          <Input
            value={form.subtitle}
            onChange={(e) => onFormChange({ subtitle: e.target.value.slice(0, 150) })}
            className="h-11 rounded-2xl text-[14px]"
            placeholder="A brief tagline that appears below the title"
            maxLength={150}
          />
          <div className="flex justify-between items-center">
            <p className="text-[11px] text-muted-foreground">Appears below the title on course cards</p>
            <CharCounter current={form.subtitle.length} max={150} />
          </div>
        </div>

        {/* ─── Course Description ─── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[14px] font-semibold flex items-center gap-2">
              <BookOpen className="size-4 text-primary" />
              Course Description <span className="text-destructive">*</span>
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-xl h-8 gap-1.5 text-primary hover:bg-primary/10 ios-press"
              onClick={handleAIWriteDescription}
              disabled={aiLoadingDesc}
            >
              {aiLoadingDesc ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              AI Write
            </Button>
          </div>
          <Textarea
            value={form.description}
            onChange={(e) => onFormChange({ description: e.target.value })}
            className={cn(
              'rounded-2xl text-[14px] min-h-[180px] resize-y transition-all',
              form.description.trim().split(/\s+/).filter(Boolean).length < 200 ? '' : 'border-emerald-300 focus-visible:ring-emerald-400/30'
            )}
            placeholder="Describe what students will learn, who this course is for, and what makes it unique. Include learning outcomes, prerequisites, and course structure overview..."
          />
          <WordCounter text={form.description} min={200} />
        </div>

        <Separator />

        {/* ─── Category & Subcategory ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[14px] font-semibold flex items-center gap-2">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.category}
              onValueChange={(v) => onFormChange({ category: v, subcategory: '' })}
            >
              <SelectTrigger className="h-11 rounded-2xl">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[14px] font-semibold">Sub-category</Label>
            <Select
              value={form.subcategory}
              onValueChange={(v) => onFormChange({ subcategory: v })}
              disabled={!form.category}
            >
              <SelectTrigger className="h-11 rounded-2xl">
                <SelectValue placeholder={form.category ? 'Select sub-category' : 'Select category first'} />
              </SelectTrigger>
              <SelectContent>
                {(SUBCATEGORIES[form.category] || []).map((sub) => (
                  <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ─── Topic Tags ─── */}
        <div className="space-y-2">
          <Label className="text-[14px] font-semibold flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Topic Tags
          </Label>
          {topicTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {topicTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="rounded-lg text-[12px] pr-1 gap-1 bg-primary/10 text-primary hover:bg-primary/20"
                >
                  {tag}
                  <button
                    onClick={() => removeTopicTag(tag)}
                    className="flex size-4 items-center justify-center rounded-full hover:bg-primary/30 transition-colors"
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              className="h-10 rounded-xl text-[13px] flex-1"
              placeholder="Type a topic tag and press Enter..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  addTopicTag()
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl h-10 ios-press"
              onClick={addTopicTag}
              disabled={!topicInput.trim()}
            >
              <Plus className="size-3.5 mr-1" />
              Add
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">Press Enter or comma to add a tag. Helps students discover your course.</p>
        </div>

        <Separator />

        {/* ─── Language & Level ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Language */}
          <div className="space-y-2">
            <Label className="text-[14px] font-semibold flex items-center gap-2">
              <Globe className="size-4 text-primary" />
              Language <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.language}
              onValueChange={(v) => onFormChange({ language: v })}
            >
              <SelectTrigger className="h-11 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty Level */}
          <div className="space-y-2">
            <Label className="text-[14px] font-semibold flex items-center gap-2">
              <BarChart3 className="size-4 text-primary" />
              Difficulty Level <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {LEVELS.map((lvl) => (
                <motion.button
                  key={lvl.value}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onFormChange({ difficultyLevel: lvl.value })}
                  className={cn(
                    'rounded-xl px-3 py-2.5 text-[12px] font-medium transition-all border ios-press text-center',
                    form.difficultyLevel === lvl.value
                      ? 'bg-primary text-primary-foreground border-primary ios-shadow-sm'
                      : 'bg-card border-border hover:border-primary/50 text-card-foreground'
                  )}
                >
                  <div className="font-semibold">{lvl.label}</div>
                  <div className="text-[10px] mt-0.5 opacity-80 leading-tight">{lvl.desc}</div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Subtitle Languages (optional) ─── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[14px] font-semibold flex items-center gap-2">
              <Languages className="size-4 text-primary" />
              Subtitle Languages
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-xl h-8 text-[12px] text-muted-foreground"
              onClick={() => setShowSubLangPicker(!showSubLangPicker)}
            >
              {subLanguages.length > 0 ? `${subLanguages.length} selected` : 'Optional'}
              <ChevronDown className={cn('size-3.5 transition-transform', showSubLangPicker && 'rotate-180')} />
            </Button>
          </div>

          {subLanguages.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {subLanguages.map((lang) => (
                <Badge
                  key={lang}
                  variant="secondary"
                  className="rounded-lg text-[12px] pr-1 gap-1 bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400"
                >
                  {lang}
                  <button
                    onClick={() => toggleSubLang(lang)}
                    className="flex size-4 items-center justify-center rounded-full hover:bg-teal-300 dark:hover:bg-teal-800 transition-colors"
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <AnimatePresence>
            {showSubLangPicker && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={SPRING}
                className="overflow-hidden"
              >
                <div className="rounded-2xl ios-shadow-sm bg-card p-3 flex flex-wrap gap-2">
                  {SUB_LANG_OPTIONS.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleSubLang(lang)}
                      className={cn(
                        'rounded-xl px-3 py-1.5 text-[12px] font-medium transition-all border ios-press',
                        subLanguages.includes(lang)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:border-primary/50 text-foreground'
                      )}
                    >
                      {subLanguages.includes(lang) && <Check className="inline size-3 mr-1" />}
                      {lang}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Separator />

        {/* ─── Course Thumbnail ─── */}
        <DropZone
          accept="image/jpeg,image/png"
          label="Course Thumbnail"
          icon={Image}
          specs={['1280 × 720', 'JPG/PNG', '< 2MB']}
          file={thumbnailFile}
          onFileChange={(f) => {
            setThumbnailFile(f)
            if (f) {
              const url = URL.createObjectURL(f)
              onFormChange({ thumbnail: url })
              toast.success('Thumbnail uploaded!', { description: f.name })
            }
          }}
          onClear={() => {
            setThumbnailFile(null)
            onFormChange({ thumbnail: '' })
          }}
          aiLabel="AI Generate"
          onAI={handleAIThumbnail}
          aiLoading={aiLoadingThumb}
        />

        {/* Thumbnail Preview */}
        {form.thumbnail && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={SPRING}
            className="rounded-2xl overflow-hidden ios-shadow-sm border border-border aspect-video max-w-md"
          >
            <img
              src={form.thumbnail}
              alt="Course thumbnail preview"
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </motion.div>
        )}

        {/* ─── Promo Video ─── */}
        <div className="space-y-2">
          <Label className="text-[14px] font-semibold flex items-center gap-2">
            <Video className="size-4 text-primary" />
            Promo Video
          </Label>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => setPromoMode('upload')}
              className={cn(
                'rounded-xl px-4 py-2 text-[12px] font-medium transition-all border',
                promoMode === 'upload'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border hover:border-primary/50 text-card-foreground'
              )}
            >
              <Upload className="inline size-3 mr-1" />
              Upload
            </button>
            <button
              type="button"
              onClick={() => setPromoMode('link')}
              className={cn(
                'rounded-xl px-4 py-2 text-[12px] font-medium transition-all border',
                promoMode === 'link'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border hover:border-primary/50 text-card-foreground'
              )}
            >
              <Link className="inline size-3 mr-1" />
              Paste Link
            </button>
          </div>

          <AnimatePresence mode="wait">
            {promoMode === 'upload' ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={SPRING}
              >
                <DropZone
                  accept="video/*"
                  label=""
                  icon={Video}
                  specs={['MP4/WebM', '2-3 min recommended', '< 500MB']}
                  file={promoFile}
                  onFileChange={(f) => {
                    setPromoFile(f)
                    if (f) toast.success('Video uploaded!', { description: f.name })
                  }}
                  onClear={() => setPromoFile(null)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="link"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={SPRING}
                className="space-y-2"
              >
                <Input
                  value={promoLink}
                  onChange={(e) => {
                    setPromoLink(e.target.value)
                    onFormChange({ promoVideoUrl: e.target.value })
                  }}
                  className="h-11 rounded-2xl text-[14px]"
                  placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                />
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Link className="size-3" />
                  Supports YouTube and Vimeo links
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Separator />

        {/* ─── Validation Summary ─── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl ios-shadow-sm bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="size-4 text-primary" />
            <span className="text-[13px] font-semibold">Required Fields</span>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Course Title', done: form.title.trim().length >= 3 },
              { label: 'Course Description', done: form.description.trim().length >= 10 },
              { label: 'Category', done: form.category.trim() !== '' },
              { label: 'Difficulty Level', done: form.difficultyLevel.trim() !== '' },
              { label: 'Language', done: form.language.trim() !== '' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={cn(
                  'flex size-5 items-center justify-center rounded-full transition-colors',
                  item.done ? 'bg-emerald-100 text-emerald-600' : 'bg-muted text-muted-foreground'
                )}>
                  {item.done ? <Check className="size-3" /> : <span className="size-1.5 rounded-full bg-current" />}
                </div>
                <span className={cn(
                  'text-[12px] font-medium',
                  item.done ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─── Navigation ─── */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            className="rounded-2xl ios-press opacity-50 cursor-not-allowed"
            disabled
          >
            Previous
          </Button>
          <Button
            onClick={() => {
              if (!canProceed) {
                toast.error('Please fill in all required fields')
                return
              }
              onNext()
            }}
            className={cn(
              'rounded-2xl ios-press gap-2 min-w-[160px]',
              canProceed
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                : ''
            )}
            disabled={!canProceed}
          >
            Next: Structure
            <ChevronDown className="size-4 -rotate-90" />
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default Step1Basics
