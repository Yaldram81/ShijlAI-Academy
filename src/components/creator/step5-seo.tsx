'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Sparkles, Loader2, Plus, X, Check, ChevronDown,
  Globe, Tag, Target, ListChecks, Users, BookOpen, Eye,
  ExternalLink, Link, FileText, Hash, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import type { CourseFormData } from './types'
import { SPRING, CARD_SPRING } from './constants'

// ─── Props ───

export interface Step5SeoProps {
  form: CourseFormData
  onFormChange: (updates: Partial<CourseFormData>) => void
  onPrevious: () => void
  onNext: () => void
}

// ─── Helpers ───

function CharCounter({ current, max }: { current: number; max: number }) {
  return (
    <span className={cn(
      'text-[11px] font-medium tabular-nums',
      current > max ? 'text-destructive' :
      current > max * 0.9 ? 'text-amber-600' :
      'text-muted-foreground'
    )}>
      {current}/{max}
    </span>
  )
}

function QualityBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.min((value / max) * 100, 100)
  const quality = pct >= 80 ? 'Excellent' : pct >= 50 ? 'Good' : 'Poor'
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-400'
  const textColor = pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className={cn('text-[11px] font-semibold', textColor)}>{quality}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn('h-full rounded-full', color)}
        />
      </div>
    </div>
  )
}

// ─── Bullet List Input ───

function BulletListInput({
  items,
  onItemsChange,
  addLabel,
  placeholder,
  icon: Icon,
  minRecommended,
  aiLabel,
  onAI,
  aiLoading,
}: {
  items: string[]
  onItemsChange: (items: string[]) => void
  addLabel: string
  placeholder: string
  icon: React.ElementType
  minRecommended?: number
  aiLabel?: string
  onAI?: () => void
  aiLoading?: boolean
}) {
  const [newItem, setNewItem] = useState('')

  const handleAdd = () => {
    if (!newItem.trim()) return
    onItemsChange([...items, newItem.trim()])
    setNewItem('')
  }

  const updateItem = (idx: number, value: string) => {
    const updated = [...items]
    updated[idx] = value
    onItemsChange(updated)
  }

  const removeItem = (idx: number) => {
    onItemsChange(items.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-[14px] font-semibold flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          {addLabel}
        </Label>
        <div className="flex items-center gap-2">
          {minRecommended && (
            <span className={cn(
              'text-[11px] font-medium',
              items.length >= minRecommended ? 'text-emerald-600' : 'text-amber-600'
            )}>
              {items.length}/{minRecommended} recommended
            </span>
          )}
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
      </div>

      {items.length > 0 && (
        <div className="space-y-2">
          <AnimatePresence>
            {items.map((item, idx) => (
              <motion.div
                key={`${idx}-${item}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10, height: 0 }}
                transition={SPRING}
                className="flex items-start gap-2 group"
              >
                <div className="flex size-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 shrink-0 mt-1.5">
                  <Check className="size-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <Input
                    value={item}
                    onChange={(e) => updateItem(idx, e.target.value)}
                    className="h-9 rounded-xl text-[13px]"
                    placeholder={placeholder}
                  />
                </div>
                <button
                  onClick={() => removeItem(idx)}
                  className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 mt-1.5 opacity-0 group-hover:opacity-100"
                >
                  <X className="size-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-4 rounded-xl border-2 border-dashed border-border">
          <Icon className="mx-auto size-5 text-muted-foreground/40" />
          <p className="mt-1.5 text-[12px] text-muted-foreground">No items yet</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          className="h-9 rounded-xl text-[13px] flex-1"
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl h-9 ios-press"
          onClick={handleAdd}
          disabled={!newItem.trim()}
        >
          <Plus className="size-3.5 mr-1" />
          Add
        </Button>
      </div>
    </div>
  )
}

// ─── Tag Input with AI Suggestions ───

function TagInputWithSuggestions({
  tags,
  onTagsChange,
  aiSuggestedTags,
  onAIGenerate,
  aiLoading,
}: {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  aiSuggestedTags: string[]
  onAIGenerate: () => void
  aiLoading: boolean
}) {
  const [input, setInput] = useState('')

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onTagsChange([...tags, trimmed])
    }
  }

  const removeTag = (tag: string) => {
    onTagsChange(tags.filter(t => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const tag = input.trim().replace(/,$/g, '')
      if (tag) addTag(tag)
      setInput('')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-[14px] font-semibold flex items-center gap-2">
          <Tag className="size-4 text-primary" />
          Search Tags
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-xl h-8 gap-1.5 text-primary hover:bg-primary/10 ios-press"
          onClick={onAIGenerate}
          disabled={aiLoading}
        >
          {aiLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
          AI Suggest
        </Button>
      </div>

      {/* Current Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <AnimatePresence>
            {tags.map((tag) => (
              <motion.div
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={SPRING}
              >
                <Badge
                  variant="secondary"
                  className="rounded-lg text-[12px] pr-1 gap-1 bg-primary/10 text-primary hover:bg-primary/20"
                >
                  <Hash className="size-2.5" />
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="flex size-4 items-center justify-center rounded-full hover:bg-primary/30 transition-colors"
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="h-10 rounded-2xl text-[14px]"
        placeholder="Type a tag and press Enter..."
        onKeyDown={handleKeyDown}
      />

      {/* AI Suggested Tags */}
      {aiSuggestedTags.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="size-3" />
            AI Suggested tags — click to add
          </p>
          <div className="flex flex-wrap gap-1.5">
            {aiSuggestedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                disabled={tags.includes(tag)}
                className={cn(
                  'rounded-lg px-2.5 py-1 text-[12px] font-medium transition-all border ios-press',
                  tags.includes(tag)
                    ? 'bg-primary/5 border-primary/20 text-primary/50 cursor-not-allowed'
                    : 'bg-card border-border hover:border-primary/30 hover:bg-primary/5 text-foreground'
                )}
              >
                <Hash className="inline size-2.5 mr-0.5" />
                {tag}
                {tags.includes(tag) && <Check className="inline size-2.5 ml-0.5" />}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">Press Enter or comma to add a tag. Helps students discover your course.</p>
    </div>
  )
}

// ─── Social Share Preview ───

function SocialSharePreview({ form }: { form: CourseFormData }) {
  return (
    <div className="space-y-2">
      <Label className="text-[14px] font-semibold flex items-center gap-2">
        <Eye className="size-4 text-primary" />
        Social Share Preview
      </Label>
      <div className="rounded-2xl ios-shadow-sm bg-card border border-border overflow-hidden max-w-md">
        {/* Thumbnail */}
        <div className="aspect-video bg-gradient-to-br from-emerald-600 to-teal-600 relative overflow-hidden">
          {form.thumbnail ? (
            <img
              src={form.thumbnail}
              alt="Course thumbnail"
              className="size-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          ) : (
            <div className="flex items-center justify-center size-full">
              <BookOpen className="size-12 text-white/30" />
            </div>
          )}
        </div>
        {/* Content */}
        <div className="p-3 space-y-1">
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Globe className="size-3" />
            shijlai.academy/courses/{form.urlSlug || 'your-course-slug'}
          </p>
          <p className="text-[14px] font-semibold line-clamp-2">
            {form.seoTitle || form.title || 'Your Course Title'}
          </p>
          <p className="text-[12px] text-muted-foreground line-clamp-2">
            {form.metaDescription || form.description?.slice(0, 160) || 'Course description will appear here...'}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───

export function Step5Seo({ form, onFormChange, onPrevious, onNext }: Step5SeoProps) {
  const [aiLoadingTitle, setAiLoadingTitle] = useState(false)
  const [aiLoadingDesc, setAiLoadingDesc] = useState(false)
  const [aiLoadingTags, setAiLoadingTags] = useState(false)
  const [aiLoadingLearn, setAiLoadingLearn] = useState(false)
  const [aiSuggestedTags, setAiSuggestedTags] = useState<string[]>([])

  // ─── Slug Generation ───

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60)
  }

  // ─── SEO Quality Calculations ───

  const seoTitleQuality = useMemo(() => {
    const len = form.seoTitle.length
    if (len === 0) return 0
    if (len >= 30 && len <= 65) return 100
    if (len < 30) return Math.round((len / 30) * 70)
    return Math.max(0, 100 - (len - 65) * 3)
  }, [form.seoTitle])

  const metaDescQuality = useMemo(() => {
    const len = form.metaDescription.length
    if (len === 0) return 0
    if (len >= 120 && len <= 160) return 100
    if (len < 120) return Math.round((len / 120) * 70)
    return Math.max(0, 100 - (len - 160) * 2)
  }, [form.metaDescription])

  // ─── AI Handlers ───

  const handleAIOptimizeTitle = async () => {
    setAiLoadingTitle(true)
    await new Promise(r => setTimeout(r, 1500))
    const base = form.title || 'Complete Course'
    const optimized = `${base} | ShijlAI Academy`
    const finalTitle = optimized.length > 65 ? optimized.slice(0, 62) + '...' : optimized
    onFormChange({ seoTitle: finalTitle })
    toast.success('SEO title optimized!', { description: finalTitle })
    setAiLoadingTitle(false)
  }

  const handleAIWriteDescription = async () => {
    setAiLoadingDesc(true)
    await new Promise(r => setTimeout(r, 2000))
    const desc = `Master ${form.category || 'the subject'} with this comprehensive ${form.difficultyLevel}-level course on ShijlAI Academy. Learn through engaging video lectures, hands-on exercises, and real-world projects. Perfect for ${form.difficultyLevel === 'beginner' ? 'those starting their journey' : form.difficultyLevel === 'intermediate' ? 'learners with some experience' : 'experienced practitioners'}. Enroll now and start learning today!`
    onFormChange({ metaDescription: desc.slice(0, 160) })
    toast.success('Meta description generated!')
    setAiLoadingDesc(false)
  }

  const handleAISuggestTags = async () => {
    setAiLoadingTags(true)
    await new Promise(r => setTimeout(r, 1500))
    const suggested = [
      form.category?.toLowerCase() || 'education',
      form.difficultyLevel,
      `${form.category || 'course'}-tutorial`,
      'online-learning',
      'international-education',
      'shijlai',
      form.language === 'en' ? 'english-course' : `${form.language}-course`,
      `${form.difficultyLevel}-level`,
      'self-paced',
      'certificate-course',
    ].filter(Boolean) as string[]
    setAiSuggestedTags(suggested)
    toast.success(`${suggested.length} tags suggested!`)
    setAiLoadingTags(false)
  }

  const handleAIGenerateOutcomes = async () => {
    setAiLoadingLearn(true)
    await new Promise(r => setTimeout(r, 2000))
    const outcomes = [
      `Understand the core principles of ${form.category || 'the subject'}`,
      `Apply ${form.difficultyLevel === 'beginner' ? 'fundamental' : 'advanced'} concepts in real-world scenarios`,
      `Build practical skills through hands-on exercises and projects`,
      `Gain confidence to solve problems independently`,
      `Earn a certificate of completion to showcase your expertise`,
    ]
    onFormChange({ whatYouLearn: outcomes })
    toast.success('Learning outcomes generated!')
    setAiLoadingLearn(false)
  }

  // ─── Validation ───

  const canProceed = form.seoTitle.trim().length > 0 && form.urlSlug.trim().length > 0

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="space-y-6"
      >
        {/* ─── SEO Title ─── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[14px] font-semibold flex items-center gap-2">
              <Search className="size-4 text-primary" />
              SEO Title <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <CharCounter current={form.seoTitle.length} max={65} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-xl h-8 gap-1.5 text-primary hover:bg-primary/10 ios-press"
                onClick={handleAIOptimizeTitle}
                disabled={aiLoadingTitle}
              >
                {aiLoadingTitle ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                AI Optimize
              </Button>
            </div>
          </div>
          <Input
            value={form.seoTitle}
            onChange={(e) => onFormChange({ seoTitle: e.target.value.slice(0, 100) })}
            className={cn(
              'h-12 rounded-2xl text-[15px] transition-all',
              form.seoTitle.length > 65 ? 'border-amber-400 focus-visible:ring-amber-400/30' : ''
            )}
            placeholder="Optimized title for search engines (30-65 characters)"
            maxLength={100}
          />
          <QualityBar value={form.seoTitle.length} max={65} label="Title quality" />
        </div>

        {/* ─── Meta Description ─── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[14px] font-semibold flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              Meta Description <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <CharCounter current={form.metaDescription.length} max={160} />
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
          </div>
          <Textarea
            value={form.metaDescription}
            onChange={(e) => onFormChange({ metaDescription: e.target.value.slice(0, 200) })}
            className={cn(
              'rounded-2xl text-[14px] min-h-[100px] resize-y transition-all',
              form.metaDescription.length > 160 ? 'border-amber-400 focus-visible:ring-amber-400/30' : ''
            )}
            placeholder="A compelling description for search results (120-160 characters)"
            maxLength={200}
          />
          <QualityBar value={form.metaDescription.length} max={160} label="Description quality" />
        </div>

        <Separator />

        {/* ─── Course URL Slug ─── */}
        <div className="space-y-2">
          <Label className="text-[14px] font-semibold flex items-center gap-2">
            <Link className="size-4 text-primary" />
            Course URL Slug <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-0">
            <div className="rounded-l-2xl border border-r-0 bg-muted/50 px-3 py-2.5 text-[13px] text-muted-foreground whitespace-nowrap">
              shijlai.academy/courses/
            </div>
            <Input
              value={form.urlSlug}
              onChange={(e) => onFormChange({ urlSlug: e.target.value.replace(/[^a-z0-9-]/g, '').slice(0, 60) })}
              className="h-11 rounded-l-0 rounded-r-2xl text-[14px]"
              placeholder="your-course-slug"
              maxLength={60}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-muted-foreground">Lowercase letters, numbers, and hyphens only</p>
            {form.title && !form.urlSlug && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-xl h-6 text-[11px] gap-1 text-primary"
                onClick={() => onFormChange({ urlSlug: generateSlug(form.title) })}
              >
                <Sparkles className="size-2.5" />
                Auto-generate from title
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* ─── Search Tags ─── */}
        <TagInputWithSuggestions
          tags={form.searchTags}
          onTagsChange={(tags) => onFormChange({ searchTags: tags })}
          aiSuggestedTags={aiSuggestedTags}
          onAIGenerate={handleAISuggestTags}
          aiLoading={aiLoadingTags}
        />

        <Separator />

        {/* ─── What You'll Learn ─── */}
        <BulletListInput
          items={form.whatYouLearn}
          onItemsChange={(items) => onFormChange({ whatYouLearn: items })}
          addLabel="What You'll Learn"
          placeholder="Students will be able to..."
          icon={ListChecks}
          minRecommended={4}
          aiLabel="AI Generate"
          onAI={handleAIGenerateOutcomes}
          aiLoading={aiLoadingLearn}
        />

        <Separator />

        {/* ─── Target Audience ─── */}
        <BulletListInput
          items={form.targetAudience}
          onItemsChange={(items) => onFormChange({ targetAudience: items })}
          addLabel="Target Audience"
          placeholder="Who is this course for..."
          icon={Target}
          minRecommended={3}
        />

        <Separator />

        {/* ─── Requirements / Prerequisites ─── */}
        <BulletListInput
          items={form.requirements}
          onItemsChange={(items) => onFormChange({ requirements: items })}
          addLabel="Requirements / Prerequisites"
          placeholder="What students should know before enrolling..."
          icon={BookOpen}
          minRecommended={2}
        />

        <Separator />

        {/* ─── Social Share Preview ─── */}
        <SocialSharePreview form={form} />

        {/* ─── Navigation ─── */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            className="rounded-2xl ios-press gap-2"
            onClick={onPrevious}
          >
            <ChevronDown className="size-4 rotate-90" />
            Previous
          </Button>
          <Button
            onClick={() => {
              if (!canProceed) {
                toast.error('Please fill in the SEO title and URL slug')
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
          >
            Next: Review
            <ChevronDown className="size-4 -rotate-90" />
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default Step5Seo
