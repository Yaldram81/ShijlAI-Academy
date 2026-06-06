'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot, BookOpen, HelpCircle, Languages, ClipboardList,
  PenLine, Image as ImageIcon, MessageSquare, BarChart3, Sparkles,
  Loader2, Send, Copy, Check, Download, ChevronRight,
  RotateCcw, Wand2, Zap, Star, StarOff,
  Search, Trash2, Eye, MoreVertical, Plus,
  Save, Bookmark, TrendingUp, TrendingDown, Clock,
  X, AlertTriangle, RefreshCw
} from 'lucide-react'
import { ShijlAIText } from '@/components/ui/brand-text'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { InstructorStatCard, InstructorStatCardGrid } from '@/components/instructor/instructor-stat-card'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'

// ── Types ──
type ToolId = 'curriculum' | 'quiz' | 'caption' | 'assignment' | 'description' | 'thumbnail' | 'qa-responder' | 'feedback-analyzer'

interface FormField {
  name: string; label: string; type: 'input' | 'textarea' | 'select'; placeholder?: string
  options?: { value: string; label: string }[]; required?: boolean; rows?: number
}
interface ToolConfig {
  id: ToolId; title: string; subtitle: string; description: string; icon: React.ReactNode
  gradient: string; iconBg: string; badge?: string
  formFields: FormField[]; apiEndpoint: string; generateLabel: string
  apiBodyBuilder: (v: Record<string, string>) => Record<string, unknown>
  resultParser: (d: Record<string, unknown>) => string
  validate: (v: Record<string, string>) => string | null
  titleField?: string
}
interface AIGeneration {
  id: string; instructorId: string; toolType: string; title: string
  inputParams: Record<string, unknown>; resultContent: string; resultImages: string[]
  tags: string[]; isFavorite: boolean; courseId: string | null; createdAt: string; updatedAt: string
}
interface AITemplate {
  id: string; instructorId: string; toolType: string; name: string
  description: string | null; inputParams: Record<string, unknown>
  isDefault: boolean; usageCount: number; createdAt: string; updatedAt: string
}
interface AIAssistantMsg { id: string; instructorId: string; role: 'user' | 'assistant'; content: string; createdAt: string }
interface UsageStats {
  totalGenerations: number; favoriteCount: number; templatesCount: number
  assistantMessagesCount: number; byTool: { toolType: string; count: number }[]
  recentActivity: AIGeneration[]; thisMonth: number; lastMonth: number
}
interface ChatMessage { role: 'user' | 'assistant'; content: string; timestamp: Date; id?: string }

// ── Tool Configs ──
const TOOLS: ToolConfig[] = [
  {
    id: 'curriculum', title: 'Curriculum Generator', subtitle: 'Full section + lesson outline',
    description: 'Describe your course topic and audience. Get a full section + lesson outline in secs.',
    icon: <BookOpen className="size-5" />, gradient: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400', badge: 'Popular',
    formFields: [
      { name: 'topic', label: 'Course Topic *', type: 'input', placeholder: 'e.g., IB Physics Chapter 5 — Oscillations', required: true },
      { name: 'audience', label: 'Target Audience', type: 'input', placeholder: 'e.g., IB Year 1 students, ages 16-18' },
      { name: 'level', label: 'Difficulty Level', type: 'select', options: [{ value: 'beginner', label: 'Beginner' }, { value: 'intermediate', label: 'Intermediate' }, { value: 'advanced', label: 'Advanced' }] },
      { name: 'sections', label: 'Number of Sections', type: 'select', options: [{ value: '3', label: '3 Sections' }, { value: '4', label: '4 Sections' }, { value: '6', label: '6 Sections' }, { value: '8', label: '8 Sections' }] },
    ],
    apiEndpoint: '/api/instructor/ai/generate-curriculum', generateLabel: 'Generate Curriculum', titleField: 'topic',
    apiBodyBuilder: v => ({ topic: v.topic?.trim(), audience: v.audience?.trim(), level: v.level, sections: parseInt(v.sections || '4') }),
    resultParser: d => String(d.content || d.curriculum || 'No result generated'),
    validate: v => v.topic?.trim() ? null : 'Please enter a course topic',
  },
  {
    id: 'quiz', title: 'Quiz Generator', subtitle: 'MCQ, True/False, Fill-in',
    description: 'Upload a video, PDF or paste text. Get MCQ, True/False, Fill-in-blank quizzes instantly.',
    icon: <HelpCircle className="size-5" />, gradient: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
    formFields: [
      { name: 'topic', label: 'Topic *', type: 'input', placeholder: "e.g., Newton's Laws of Motion", required: true },
      { name: 'sourceText', label: 'Or paste source text', type: 'textarea', placeholder: 'Paste your lesson content here...', rows: 4 },
      { name: 'count', label: 'Number of Questions', type: 'select', options: [{ value: '3', label: '3 Questions' }, { value: '5', label: '5 Questions' }, { value: '10', label: '10 Questions' }, { value: '15', label: '15 Questions' }] },
      { name: 'difficulty', label: 'Difficulty', type: 'select', options: [{ value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }] },
    ],
    apiEndpoint: '/api/instructor/ai/generate-quiz', generateLabel: 'Generate Quiz', titleField: 'topic',
    apiBodyBuilder: v => ({ topic: v.topic?.trim() || 'Custom topic from text', count: parseInt(v.count || '5'), difficulty: v.difficulty, sourceText: v.sourceText?.trim() || undefined }),
    resultParser: d => JSON.stringify(d.questions, null, 2),
    validate: v => (v.topic?.trim() || v.sourceText?.trim()) ? null : 'Please enter a topic or source text',
  },
  {
    id: 'caption', title: 'Auto Caption & Translate', subtitle: 'Multilingual captions',
    description: 'Upload video, get multilingual captions auto-generated and synced to timeline.',
    icon: <Languages className="size-5" />, gradient: 'from-sky-500 to-cyan-600',
    iconBg: 'bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400', badge: 'New',
    formFields: [
      { name: 'sourceText', label: 'Content to Caption *', type: 'textarea', placeholder: 'Paste the text you want captioned and translated...', rows: 6, required: true },
      { name: 'sourceType', label: 'Source Type', type: 'select', options: [{ value: 'text', label: 'Text' }, { value: 'video', label: 'Video Script' }] },
    ],
    apiEndpoint: '/api/instructor/ai/auto-caption', generateLabel: 'Generate Captions',
    apiBodyBuilder: v => ({ content: v.sourceText?.trim(), sourceType: v.sourceType || 'text' }),
    resultParser: d => String(d.captions || d.content || 'No result generated'),
    validate: v => v.sourceText?.trim() ? null : 'Please enter content to caption',
  },
  {
    id: 'assignment', title: 'Assignment + Rubric Builder', subtitle: 'Brief + grading rubric',
    description: 'Describe the skill. Get a full assignment brief + grading rubric ready to publish.',
    icon: <ClipboardList className="size-5" />, gradient: 'from-amber-500 to-orange-600',
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    formFields: [
      { name: 'skill', label: 'Skill / Topic *', type: 'input', placeholder: 'e.g., Data analysis with Python', required: true },
      { name: 'course', label: 'Course (optional)', type: 'input', placeholder: 'e.g., Introduction to Computer Science' },
      { name: 'type', label: 'Assignment Type', type: 'select', options: [{ value: 'written', label: 'Written' }, { value: 'coding', label: 'Coding' }, { value: 'project', label: 'Project' }, { value: 'presentation', label: 'Presentation' }, { value: 'peer-review', label: 'Peer Review' }] },
    ],
    apiEndpoint: '/api/instructor/ai/generate-assignment', generateLabel: 'Generate Assignment', titleField: 'skill',
    apiBodyBuilder: v => ({ skill: v.skill?.trim(), type: v.type || 'written', course: v.course?.trim() }),
    resultParser: d => String(d.content || d.assignment || 'No result generated'),
    validate: v => v.skill?.trim() ? null : 'Please describe the skill',
  },
  {
    id: 'description', title: 'Course Description Writer', subtitle: 'SEO-optimized copy',
    description: 'Enter topic + keywords. Get SEO-optimized title, subtitle, description, and learning outcomes.',
    icon: <PenLine className="size-5" />, gradient: 'from-rose-500 to-pink-600',
    iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400', badge: 'AI',
    formFields: [
      { name: 'topic', label: 'Course Topic *', type: 'input', placeholder: 'e.g., Machine Learning for Beginners', required: true },
      { name: 'keywords', label: 'Keywords (comma-separated)', type: 'input', placeholder: 'e.g., Python, scikit-learn, neural networks' },
      { name: 'tone', label: 'Tone', type: 'select', options: [{ value: 'professional', label: 'Professional' }, { value: 'friendly', label: 'Friendly & Conversational' }, { value: 'academic', label: 'Academic' }, { value: 'inspiring', label: 'Inspiring & Motivational' }] },
    ],
    apiEndpoint: '/api/instructor/ai/generate-description', generateLabel: 'Generate Description', titleField: 'topic',
    apiBodyBuilder: v => ({ topic: v.topic?.trim(), keywords: v.keywords?.trim(), tone: v.tone || 'professional' }),
    resultParser: d => String(d.content || d.description || 'No result generated'),
    validate: v => v.topic?.trim() ? null : 'Please enter a course topic',
  },
  {
    id: 'thumbnail', title: 'Thumbnail Generator', subtitle: '4 AI thumbnail options',
    description: 'Enter course title. AI generates 4 thumbnail options. Pick and download instantly.',
    icon: <ImageIcon className="size-5" />, gradient: 'from-fuchsia-500 to-pink-600',
    iconBg: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-950/40 dark:text-fuchsia-400', badge: 'Visual',
    formFields: [
      { name: 'title', label: 'Course Title *', type: 'input', placeholder: 'e.g., Complete IB Physics Guide', required: true },
      { name: 'style', label: 'Thumbnail Style', type: 'select', options: [{ value: 'modern', label: 'Modern & Clean' }, { value: 'gradient', label: 'Gradient Vibrant' }, { value: 'minimal', label: 'Minimalist' }, { value: 'illustration', label: 'Illustration Style' }] },
    ],
    apiEndpoint: '/api/instructor/ai/generate-thumbnail', generateLabel: 'Generate Thumbnails', titleField: 'title',
    apiBodyBuilder: v => ({ title: v.title?.trim(), style: v.style || 'modern' }),
    resultParser: () => '4 thumbnail images generated',
    validate: v => v.title?.trim() ? null : 'Please enter a course title',
  },
  {
    id: 'qa-responder', title: 'Q&A Auto-Responder', subtitle: 'Draft answers instantly',
    description: 'AI drafts answers to student questions. You review & post. Save hours every week.',
    icon: <MessageSquare className="size-5" />, gradient: 'from-teal-500 to-emerald-600',
    iconBg: 'bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400',
    formFields: [
      { name: 'question', label: 'Student Question *', type: 'textarea', placeholder: 'e.g., What is the difference between speed and velocity?', rows: 3, required: true },
      { name: 'context', label: 'Course Context (optional)', type: 'textarea', placeholder: 'e.g., IB Physics Chapter 3 — Motion', rows: 2 },
    ],
    apiEndpoint: '/api/instructor/ai/auto-respond', generateLabel: 'Draft Answer', titleField: 'question',
    apiBodyBuilder: v => ({ question: v.question?.trim(), context: v.context?.trim() }),
    resultParser: d => String(d.content || d.answer || 'No result generated'),
    validate: v => v.question?.trim() ? null : 'Please enter a student question',
  },
  {
    id: 'feedback-analyzer', title: 'Student Feedback Analyzer', subtitle: 'Praise, issues & tips',
    description: 'Paste all your reviews. Get a summary of top praise and top issues with actionable tips.',
    icon: <BarChart3 className="size-5" />, gradient: 'from-slate-500 to-gray-600',
    iconBg: 'bg-slate-100 text-slate-600 dark:bg-slate-950/40 dark:text-slate-400',
    formFields: [
      { name: 'reviews', label: 'Student Reviews *', type: 'textarea', placeholder: 'Paste all your reviews here...', rows: 8, required: true },
    ],
    apiEndpoint: '/api/instructor/ai/analyze-feedback', generateLabel: 'Analyze Feedback',
    apiBodyBuilder: v => ({ reviews: v.reviews?.trim() }),
    resultParser: d => String(d.content || d.analysis || 'No result generated'),
    validate: v => v.reviews?.trim() ? null : 'Please paste student reviews',
  },
]

const toolGradients: Record<string, string> = Object.fromEntries(TOOLS.map(t => [t.id, t.gradient]))
const toolIconBgs: Record<string, string> = Object.fromEntries(TOOLS.map(t => [t.id, t.iconBg]))
const toolLabels: Record<string, string> = Object.fromEntries(TOOLS.map(t => [t.id, t.title.split(' ')[0]]))

function relativeTime(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1) return 'Just now'; if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
  const dy = Math.floor(h / 24); if (dy < 7) return `${dy}d ago`
  return new Date(d).toLocaleDateString()
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({ opacity: 1, y: 0, scale: 1, transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }),
}

// ── Small Helpers ──
function CopyBtn({ text }: { text: string }) {
  const [c, setC] = useState(false)
  return <Button variant="ghost" size="sm" onClick={async () => { await navigator.clipboard.writeText(text); setC(true); toast.success('Copied'); setTimeout(() => setC(false), 2000) }} className="h-7 gap-1 text-xs">
    {c ? <Check className="size-3" /> : <Copy className="size-3" />}{c ? 'Copied' : 'Copy'}
  </Button>
}

function ResultDisplay({ content, isLoading }: { content: string; isLoading: boolean }) {
  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="relative"><div className="size-12 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center"><Loader2 className="size-6 animate-spin text-emerald-500" /></div><Sparkles className="size-4 text-amber-500 absolute -top-1 -right-1 animate-pulse" /></div>
      <p className="text-sm text-muted-foreground font-medium">AI is generating...</p>
    </div>
  )
  if (!content) return null
  return <div className="prose prose-sm dark:prose-invert max-w-none text-[13px] leading-relaxed">
    {content.split('\n').map((line, i) => {
      const t = line.trim(); if (!t) return <br key={i} />
      if (t.startsWith('### ')) return <h3 key={i} className="text-base font-bold mt-4 mb-2">{t.slice(4)}</h3>
      if (t.startsWith('## ')) return <h2 key={i} className="text-lg font-bold mt-5 mb-2">{t.slice(3)}</h2>
      if (t.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mt-6 mb-3">{t.slice(2)}</h1>
      if (t.startsWith('- ') || t.startsWith('* ')) return <li key={i} className="ml-4">{t.slice(2)}</li>
      if (t.startsWith('• ')) return <li key={i} className="ml-4">{t.slice(2)}</li>
      if (/^\d+\.\s/.test(t)) return <li key={i} className="ml-4 list-decimal">{t.replace(/^\d+\.\s/, '')}</li>
      if (t.startsWith('**') && t.endsWith('**')) return <p key={i} className="font-semibold">{t.slice(2, -2)}</p>
      return <p key={i} className="mb-1">{t}</p>
    })}
  </div>
}

function TemplateSelector({ toolType, instructorId, onApply }: { toolType: string; instructorId: string; onApply: (p: Record<string, unknown>) => void }) {
  const [tpls, setTpls] = useState<AITemplate[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!instructorId) return
    fetch(`/api/instructor/ai/templates?instructorId=${instructorId}&toolType=${toolType}`).then(r => r.json()).then(d => setTpls(d.templates || [])).catch(() => {}).finally(() => setLoading(false))
  }, [toolType, instructorId])
  if (loading) return <Skeleton className="h-9 w-full rounded-xl" />
  if (!tpls.length) return null
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Apply Template</Label>
    <Select onValueChange={val => {
      const t = tpls.find(x => x.id === val)
      if (t) { onApply(t.inputParams); toast.success(`Template "${t.name}" applied`); fetch(`/api/instructor/ai/templates/${t.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ incrementUsage: true, instructorId }) }).catch(() => {}) }
    }}>
      <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a template..." /></SelectTrigger>
      <SelectContent>{tpls.map(t => <SelectItem key={t.id} value={t.id}>{t.name} {t.isDefault ? '(Default)' : ''} • Used {t.usageCount}x</SelectItem>)}</SelectContent>
    </Select>
  </div>
}

function SaveGenBtn({ instructorId, toolType, title, inputParams, resultContent, resultImages, onSaved }: {
  instructorId: string; toolType: string; title: string; inputParams: Record<string, unknown>; resultContent: string; resultImages?: string[]; onSaved?: () => void
}) {
  const [s, setS] = useState(false)
  return <Button variant="ghost" size="sm" onClick={async () => { setS(true); try { const r = await fetch('/api/instructor/ai/generations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ instructorId, toolType, title: title || `${toolLabels[toolType] || toolType} - ${new Date().toLocaleDateString()}`, inputParams, resultContent, resultImages }) }); if (!r.ok) throw new Error(); toast.success('Generation saved!'); onSaved?.() } catch { toast.error('Failed to save') } finally { setS(false) } }} disabled={s} className="h-7 gap-1 text-xs">
    {s ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}Save
  </Button>
}

function SaveTplBtn({ instructorId, toolType, inputParams }: { instructorId: string; toolType: string; inputParams: Record<string, unknown> }) {
  const [s, setS] = useState(false); const [naming, setNaming] = useState(false); const [name, setName] = useState('')
  const save = async () => { if (!name.trim()) { toast.error('Enter a name'); return } setS(true); try { const r = await fetch('/api/instructor/ai/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ instructorId, toolType, name: name.trim(), inputParams }) }); if (!r.ok) throw new Error(); toast.success('Template saved!'); setNaming(false); setName('') } catch { toast.error('Failed to save') } finally { setS(false) } }
  if (naming) return <div className="flex items-center gap-1"><Input value={name} onChange={e => setName(e.target.value)} placeholder="Template name" className="h-7 text-xs rounded-lg w-32" onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setNaming(false) }} autoFocus /><Button size="sm" onClick={save} disabled={s} className="h-7 text-xs gap-1">{s ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}</Button><Button size="sm" variant="ghost" onClick={() => setNaming(false)} className="h-7 text-xs"><X className="size-3" /></Button></div>
  return <Button variant="ghost" size="sm" onClick={() => setNaming(true)} className="h-7 gap-1 text-xs"><Bookmark className="size-3" />Template</Button>
}

// ── Generic ToolDialog ──
function ToolDialog({ tool, open, onOpenChange, instructorId, prefilledParams, onGenerationSaved }: {
  tool: ToolConfig; open: boolean; onOpenChange: (v: boolean) => void; instructorId: string; prefilledParams?: Record<string, unknown>; onGenerationSaved?: () => void
}) {
  const defaults = Object.fromEntries(tool.formFields.map(f => [f.name, f.options?.[0]?.value || '']))
  const [vals, setVals] = useState<Record<string, string>>(defaults)
  const [result, setResult] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [questions, setQuestions] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (prefilledParams && open) {
      const updated = { ...defaults }
      for (const f of tool.formFields) { if (prefilledParams[f.name] != null) updated[f.name] = String(prefilledParams[f.name]) }
      setVals(updated)
    }
  }, [prefilledParams, open])

  const set = (k: string, v: string) => setVals(prev => ({ ...prev, [k]: v }))

  const handleGenerate = async () => {
    const err = tool.validate(vals); if (err) { toast.error(err); return }
    setLoading(true); setResult(''); setImages([]); setQuestions([])
    try {
      const res = await fetch(tool.apiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tool.apiBodyBuilder(vals)) })
      const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Generation failed')
      if (tool.id === 'quiz') { setQuestions(data.questions || []); setResult(JSON.stringify(data.questions, null, 2)); toast.success(`${data.questions?.length || 0} quiz questions generated!`) }
      else if (tool.id === 'thumbnail') { setImages(data.images || []); toast.success('Thumbnails generated!') }
      else { setResult(tool.resultParser(data)); toast.success(`${tool.title.split(' ')[0]} generated!`) }
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : `Failed to generate`) } finally { setLoading(false) }
  }

  const handleReset = () => { setVals(defaults); setResult(''); setImages([]); setQuestions([]) }
  const titleVal = tool.titleField ? vals[tool.titleField] || '' : tool.title
  const inputParams = { ...vals }
  const hasResult = !!(result || images.length || questions.length)
  const isValid = !tool.validate(vals)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={cn('flex size-8 items-center justify-center rounded-lg', tool.iconBg)}>{tool.icon}</div>
            {tool.title}
          </DialogTitle>
          <DialogDescription>{tool.description}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-2">
          <div className="space-y-4 pb-4">
            {!hasResult && !loading ? (
              <>
                <TemplateSelector toolType={tool.id} instructorId={instructorId} onApply={p => { const u = { ...vals }; for (const f of tool.formFields) { if (p[f.name] != null) u[f.name] = String(p[f.name]) } setVals(u) }} />
                {tool.formFields.map(f => (
                  <div key={f.name} className="space-y-2">
                    <Label>{f.label}</Label>
                    {f.type === 'input' && <Input placeholder={f.placeholder} value={vals[f.name] || ''} onChange={e => set(f.name, e.target.value)} />}
                    {f.type === 'textarea' && <Textarea placeholder={f.placeholder} value={vals[f.name] || ''} onChange={e => set(f.name, e.target.value)} rows={f.rows || 4} className="rounded-xl" />}
                    {f.type === 'select' && <Select value={vals[f.name] || f.options?.[0]?.value} onValueChange={v => set(f.name, v)}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{f.options?.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>}
                  </div>
                ))}
              </>
            ) : tool.id === 'thumbnail' && images.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex gap-1 flex-wrap">
                    <SaveGenBtn instructorId={instructorId} toolType={tool.id} title={titleVal} inputParams={inputParams} resultContent="4 thumbnail images generated" resultImages={images} onSaved={onGenerationSaved} />
                    <SaveTplBtn instructorId={instructorId} toolType={tool.id} inputParams={inputParams} />
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 gap-1 text-xs"><RotateCcw className="size-3" />New</Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {images.map((img, i) => (
                    <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                      className="group relative rounded-xl overflow-hidden border border-border/40 cursor-pointer hover:ring-2 hover:ring-fuchsia-500/50 transition-all">
                      <img src={`data:image/png;base64,${img}`} alt={`Thumbnail ${i + 1}`} className="w-full aspect-video object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button size="sm" onClick={() => { const a = document.createElement('a'); a.href = `data:image/png;base64,${img}`; a.download = `thumbnail-${i + 1}.png`; a.click(); toast.success('Downloaded!') }} className="rounded-xl gap-1.5 bg-white text-black hover:bg-white/90"><Download className="size-3.5" />Download</Button>
                      </div>
                      <Badge className="absolute top-2 left-2 rounded-lg text-[10px]">Option {i + 1}</Badge>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : tool.id === 'thumbnail' && loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="relative"><div className="size-16 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 flex items-center justify-center"><Loader2 className="size-8 animate-spin text-fuchsia-500" /></div><Sparkles className="size-5 text-amber-500 absolute -top-2 -right-2 animate-pulse" /></div>
                <p className="text-sm font-medium text-muted-foreground">Generating 4 thumbnails...</p>
              </div>
            ) : tool.id === 'quiz' && questions.length > 0 ? (
              <div className="relative">
                <div className="absolute top-2 right-2 z-10 flex gap-1 flex-wrap justify-end">
                  <SaveGenBtn instructorId={instructorId} toolType="quiz" title={titleVal || 'Quiz'} inputParams={inputParams} resultContent={result} onSaved={onGenerationSaved} />
                  <SaveTplBtn instructorId={instructorId} toolType="quiz" inputParams={inputParams} />
                  <CopyBtn text={result} />
                  <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 gap-1 text-xs"><RotateCcw className="size-3" />New</Button>
                </div>
                <div className="space-y-3">
                  {questions.map((q, i) => (
                    <div key={i} className="rounded-xl bg-muted/40 p-4 border border-border/40">
                      <div className="flex items-start gap-2"><Badge variant="secondary" className="shrink-0 rounded-lg text-[10px]">{String(q.type)}</Badge><p className="text-[13px] font-medium">{String(q.text)}</p></div>
                      {Array.isArray(q.options) && q.options.length > 0 && <div className="mt-2 ml-8 space-y-1">{q.options.map((opt: unknown, oi: number) => <p key={oi} className={cn('text-[12px] px-2 py-1 rounded-lg', opt === q.correctAnswer ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium' : 'text-muted-foreground')}>{String.fromCharCode(65 + oi)}. {String(opt)}</p>)}</div>}
                      {q.explanation && <p className="mt-2 text-[11px] text-muted-foreground ml-8 italic">💡 {String(q.explanation)}</p>}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute top-2 right-2 z-10 flex gap-1 flex-wrap justify-end">
                  <SaveGenBtn instructorId={instructorId} toolType={tool.id} title={titleVal} inputParams={inputParams} resultContent={result} onSaved={onGenerationSaved} />
                  <SaveTplBtn instructorId={instructorId} toolType={tool.id} inputParams={inputParams} />
                  <CopyBtn text={result} />
                  <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 gap-1 text-xs"><RotateCcw className="size-3" />New</Button>
                </div>
                <div className="rounded-xl bg-muted/40 p-4 border border-border/40"><ResultDisplay content={result} isLoading={loading} /></div>
              </div>
            )}
          </div>
        </ScrollArea>
        {!hasResult && !loading && (
          <div className="flex justify-end pt-2">
            <Button onClick={handleGenerate} disabled={loading || !isValid} className={cn('rounded-xl gap-2 bg-gradient-to-r text-white', tool.gradient)}>
              <Wand2 className="size-4" />{tool.generateLabel}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── My Generations Tab ──
function MyGenerationsTab({ instructorId, onOpenTool }: { instructorId: string; onOpenTool: (id: ToolId, p?: Record<string, unknown>) => void }) {
  const [gens, setGens] = useState<AIGeneration[]>([])
  const [page, setPage] = useState(1); const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState(''); const [toolFilter, setToolFilter] = useState('all')
  const [favOnly, setFavOnly] = useState(false); const [loading, setLoading] = useState(true)
  const [viewGen, setViewGen] = useState<AIGeneration | null>(null); const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchGens = useCallback(async () => {
    setLoading(true); try {
      const p = new URLSearchParams({ instructorId, page: String(page), limit: '12' })
      if (search) p.set('search', search); if (toolFilter !== 'all') p.set('toolType', toolFilter); if (favOnly) p.set('favorite', 'true')
      const d = await (await fetch(`/api/instructor/ai/generations?${p}`)).json()
      setGens(d.generations || []); setTotalPages(d.totalPages || 1)
    } catch { toast.error('Failed to load') } finally { setLoading(false) }
  }, [instructorId, page, search, toolFilter, favOnly])
  useEffect(() => { fetchGens() }, [fetchGens])

  const toggleFav = async (g: AIGeneration) => {
    try { await fetch(`/api/instructor/ai/generations/${g.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isFavorite: !g.isFavorite, instructorId }) }); setGens(p => p.map(x => x.id === g.id ? { ...x, isFavorite: !x.isFavorite } : x)); toast.success(g.isFavorite ? 'Removed from favorites' : 'Added to favorites') } catch { toast.error('Failed') }
  }

  const handleDelete = async () => { if (!deleteId) return; try { await fetch(`/api/instructor/ai/generations/${deleteId}?instructorId=${instructorId}`, { method: 'DELETE' }); setGens(p => p.filter(g => g.id !== deleteId)); toast.success('Deleted'); if (viewGen?.id === deleteId) setViewGen(null); setDeleteId(null) } catch { toast.error('Failed') } }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" /><Input placeholder="Search generations..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="pl-9 rounded-xl" /></div>
        <Select value={toolFilter} onValueChange={v => { setToolFilter(v); setPage(1) }}><SelectTrigger className="w-[160px] rounded-xl"><SelectValue placeholder="Filter by tool" /></SelectTrigger><SelectContent><SelectItem value="all">All Tools</SelectItem>{TOOLS.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent></Select>
        <Button variant={favOnly ? 'default' : 'outline'} size="sm" onClick={() => { setFavOnly(!favOnly); setPage(1) }} className="rounded-xl gap-1.5"><Star className={cn('size-3.5', favOnly && 'fill-amber-400 text-amber-400')} />Favs</Button>
      </div>
      {loading && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Card key={i} className="rounded-2xl"><CardContent className="p-4 space-y-3"><Skeleton className="h-5 w-24 rounded-lg" /><Skeleton className="h-4 w-3/4" /><Skeleton className="h-16 w-full" /></CardContent></Card>)}</div>}
      {!loading && gens.length === 0 && <div className="flex flex-col items-center justify-center py-16 gap-4"><div className="size-16 rounded-2xl bg-muted/40 flex items-center justify-center"><BarChart3 className="size-8 text-muted-foreground/40" /></div><p className="font-semibold text-muted-foreground">No generations found</p><Button variant="outline" onClick={() => onOpenTool('curriculum')} className="rounded-xl gap-2"><Wand2 className="size-4" />Try a Tool</Button></div>}
      {!loading && gens.length > 0 && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{gens.map((g, i) => (
        <motion.div key={g.id} custom={i} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="rounded-2xl hover:shadow-md transition-shadow border border-border/30">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <Badge className={cn('rounded-lg text-[10px] font-semibold bg-gradient-to-r text-white', toolGradients[g.toolType] || 'from-gray-500 to-gray-600')}>{toolLabels[g.toolType] || g.toolType}</Badge>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="size-7 p-0" onClick={() => toggleFav(g)}>{g.isFavorite ? <Star className="size-3.5 fill-amber-400 text-amber-400" /> : <Star className="size-3.5 text-muted-foreground" />}</Button>
                  <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="size-7 p-0"><MoreVertical className="size-3.5" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewGen(g)}><Eye className="size-3.5 mr-2" />View</DropdownMenuItem>
                      <DropdownMenuItem onClick={async () => { await navigator.clipboard.writeText(g.resultContent); toast.success('Copied') }}><Copy className="size-3.5 mr-2" />Copy</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(g.id)}><Trash2 className="size-3.5 mr-2" />Delete</DropdownMenuItem>
                    </DropdownMenuContent></DropdownMenu>
                </div>
              </div>
              <div><p className="font-medium text-sm line-clamp-1">{g.title}</p><p className="text-xs text-muted-foreground line-clamp-3 mt-1">{g.resultContent}</p></div>
              <div className="flex items-center justify-between pt-1"><span className="text-[11px] text-muted-foreground/60 flex items-center gap-1"><Clock className="size-3" />{relativeTime(g.createdAt)}</span><Button variant="ghost" size="sm" onClick={() => setViewGen(g)} className="h-6 text-[11px] gap-1">View<ChevronRight className="size-3" /></Button></div>
            </CardContent>
          </Card>
        </motion.div>
      ))}</div>}
      {totalPages > 1 && <div className="flex items-center justify-center gap-2 pt-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-xl gap-1">Prev</Button><span className="text-sm text-muted-foreground px-3">Page {page} of {totalPages}</span><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="rounded-xl gap-1">Next</Button></div>}

      <Sheet open={!!viewGen} onOpenChange={v => { if (!v) setViewGen(null) }}>
        <SheetContent className="sm:max-w-xl overflow-y-auto"><SheetHeader><SheetTitle className="flex items-center gap-2">{viewGen && <><Badge className={cn('rounded-lg text-[10px] font-semibold bg-gradient-to-r text-white', toolGradients[viewGen.toolType] || 'from-gray-500 to-gray-600')}>{toolLabels[viewGen.toolType] || viewGen.toolType}</Badge>{viewGen.title}</>}</SheetTitle></SheetHeader>
          {viewGen && <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="size-3" />{new Date(viewGen.createdAt).toLocaleString()}{viewGen.isFavorite && <Star className="size-3 fill-amber-400 text-amber-400" />}</div>
            {viewGen.tags?.length > 0 && <div className="flex flex-wrap gap-1">{viewGen.tags.map((tag, i) => <Badge key={i} variant="outline" className="text-[10px] rounded-lg">{tag}</Badge>)}</div>}
            <Separator /><div className="rounded-xl bg-muted/40 p-4 border border-border/40"><ResultDisplay content={viewGen.resultContent} isLoading={false} /></div>
            {viewGen.resultImages?.length > 0 && <div className="grid grid-cols-2 gap-2">{viewGen.resultImages.map((img, i) => <img key={i} src={`data:image/png;base64,${img}`} alt={`Result ${i + 1}`} className="rounded-xl w-full aspect-video object-cover border border-border/40" />)}</div>}
            <div className="flex gap-2 pt-2">
              <CopyBtn text={viewGen.resultContent} />
              <Button variant="outline" size="sm" onClick={() => toggleFav(viewGen)} className="h-7 gap-1 text-xs rounded-xl">{viewGen.isFavorite ? <StarOff className="size-3" /> : <Star className="size-3" />}{viewGen.isFavorite ? 'Unfavorite' : 'Favorite'}</Button>
              <Button variant="outline" size="sm" onClick={() => { onOpenTool(viewGen.toolType as ToolId, viewGen.inputParams); setViewGen(null) }} className="h-7 gap-1 text-xs rounded-xl"><RefreshCw className="size-3" />Re-generate</Button>
              <Button variant="destructive" size="sm" onClick={() => { setDeleteId(viewGen.id); setViewGen(null) }} className="h-7 gap-1 text-xs rounded-xl ml-auto"><Trash2 className="size-3" />Delete</Button>
            </div>
          </div>}
        </SheetContent>
      </Sheet>
      <AlertDialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null) }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="size-5 text-destructive" />Delete Generation</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  )
}

// ── Templates Tab ──
function TemplatesTab({ instructorId, onOpenTool }: { instructorId: string; onOpenTool: (id: ToolId, p?: Record<string, unknown>) => void }) {
  const [tpls, setTpls] = useState<AITemplate[]>([]); const [loading, setLoading] = useState(true)
  const [toolFilter, setToolFilter] = useState('all'); const [showCreate, setShowCreate] = useState(false)
  const [editTpl, setEditTpl] = useState<AITemplate | null>(null); const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formToolType, setFormToolType] = useState('curriculum'); const [formName, setFormName] = useState(''); const [formDesc, setFormDesc] = useState('')

  const fetchTpls = useCallback(async () => {
    setLoading(true); try { const p = new URLSearchParams({ instructorId }); if (toolFilter !== 'all') p.set('toolType', toolFilter); const d = await (await fetch(`/api/instructor/ai/templates?${p}`)).json(); setTpls(d.templates || []) } catch { toast.error('Failed to load') } finally { setLoading(false) }
  }, [instructorId, toolFilter])
  useEffect(() => { fetchTpls() }, [fetchTpls])

  const handleCreate = async () => { if (!formName.trim()) { toast.error('Enter a name'); return } try { const r = await fetch('/api/instructor/ai/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ instructorId, toolType: formToolType, name: formName.trim(), description: formDesc.trim() || undefined, inputParams: {} }) }); if (!r.ok) throw new Error(); toast.success('Template created!'); setShowCreate(false); setFormName(''); setFormDesc(''); fetchTpls() } catch { toast.error('Failed to create') } }
  const handleEdit = async () => { if (!editTpl || !formName.trim()) return; try { const r = await fetch(`/api/instructor/ai/templates/${editTpl.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: formName.trim(), description: formDesc.trim() || undefined }) }); if (!r.ok) throw new Error(); toast.success('Updated!'); setEditTpl(null); fetchTpls() } catch { toast.error('Failed to update') } }
  const handleDelete = async () => { if (!deleteId) return; try { await fetch(`/api/instructor/ai/templates/${deleteId}`, { method: 'DELETE' }); toast.success('Deleted'); setDeleteId(null); fetchTpls() } catch { toast.error('Failed') } }
  const openEdit = (t: AITemplate) => { setEditTpl(t); setFormToolType(t.toolType); setFormName(t.name); setFormDesc(t.description || '') }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <Select value={toolFilter} onValueChange={setToolFilter}><SelectTrigger className="w-[180px] rounded-xl"><SelectValue placeholder="Filter by tool" /></SelectTrigger><SelectContent><SelectItem value="all">All Tools</SelectItem>{TOOLS.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent></Select>
        <Button onClick={() => { setShowCreate(true); setFormName(''); setFormDesc(''); setFormToolType('curriculum') }} className="rounded-xl gap-2"><Plus className="size-4" />Create Template</Button>
      </div>
      {loading && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Card key={i} className="rounded-2xl"><CardContent className="p-4 space-y-3"><Skeleton className="h-5 w-24 rounded-lg" /><Skeleton className="h-4 w-3/4" /></CardContent></Card>)}</div>}
      {!loading && tpls.length === 0 && <div className="flex flex-col items-center justify-center py-16 gap-4"><div className="size-16 rounded-2xl bg-muted/40 flex items-center justify-center"><Bookmark className="size-8 text-muted-foreground/40" /></div><p className="font-semibold text-muted-foreground">No templates yet</p><Button variant="outline" onClick={() => setShowCreate(true)} className="rounded-xl gap-2"><Plus className="size-4" />Create First Template</Button></div>}
      {!loading && tpls.length > 0 && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tpls.map((t, i) => (
        <motion.div key={t.id} custom={i} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="rounded-2xl hover:shadow-md transition-shadow border border-border/30">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2"><Badge className={cn('rounded-lg text-[10px] font-semibold bg-gradient-to-r text-white', toolGradients[t.toolType] || 'from-gray-500 to-gray-600')}>{toolLabels[t.toolType] || t.toolType}</Badge>{t.isDefault && <Badge variant="outline" className="text-[9px] rounded-lg px-1.5">Default</Badge>}</div>
                <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="size-7 p-0"><MoreVertical className="size-3.5" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onOpenTool(t.toolType as ToolId, t.inputParams)}><Wand2 className="size-3.5 mr-2" />Use Template</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEdit(t)}><PenLine className="size-3.5 mr-2" />Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(t.id)}><Trash2 className="size-3.5 mr-2" />Delete</DropdownMenuItem>
                  </DropdownMenuContent></DropdownMenu>
              </div>
              <div><p className="font-medium text-sm">{t.name}</p>{t.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>}</div>
              <div className="flex items-center justify-between pt-1"><span className="text-[11px] text-muted-foreground/60">Used {t.usageCount}x</span><Button variant="ghost" size="sm" onClick={() => onOpenTool(t.toolType as ToolId, t.inputParams)} className="h-6 text-[11px] gap-1">Use<ChevronRight className="size-3" /></Button></div>
            </CardContent>
          </Card>
        </motion.div>
      ))}</div>}

      <Dialog open={showCreate} onOpenChange={setShowCreate}><DialogContent className="max-w-md rounded-2xl"><DialogHeader><DialogTitle>Create Template</DialogTitle><DialogDescription>Save a reusable configuration for any AI tool.</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Tool Type</Label><Select value={formToolType} onValueChange={setFormToolType}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{TOOLS.map(t => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label>Template Name *</Label><Input placeholder="e.g., Standard Physics Quiz" value={formName} onChange={e => setFormName(e.target.value)} className="rounded-xl" /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Optional description..." value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={3} className="rounded-xl" /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-xl">Cancel</Button><Button onClick={handleCreate} disabled={!formName.trim()} className="rounded-xl gap-2"><Save className="size-4" />Create</Button></div>
      </DialogContent></Dialog>

      <Dialog open={!!editTpl} onOpenChange={v => { if (!v) setEditTpl(null) }}><DialogContent className="max-w-md rounded-2xl"><DialogHeader><DialogTitle>Edit Template</DialogTitle><DialogDescription>Update template name and description.</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Tool Type</Label><Input value={toolLabels[formToolType] || formToolType} disabled className="rounded-xl bg-muted" /></div>
          <div className="space-y-2"><Label>Template Name *</Label><Input value={formName} onChange={e => setFormName(e.target.value)} className="rounded-xl" /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={3} className="rounded-xl" /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setEditTpl(null)} className="rounded-xl">Cancel</Button><Button onClick={handleEdit} disabled={!formName.trim()} className="rounded-xl gap-2"><Save className="size-4" />Save</Button></div>
      </DialogContent></Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null) }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="size-5 text-destructive" />Delete Template</AlertDialogTitle><AlertDialogDescription>This will permanently delete this template.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  )
}

// ── Usage Tab ──
function UsageTab({ instructorId }: { instructorId: string }) {
  const [stats, setStats] = useState<UsageStats | null>(null); const [loading, setLoading] = useState(true)
  useEffect(() => { fetch(`/api/instructor/ai/usage-stats?instructorId=${instructorId}`).then(r => r.json()).then(d => setStats(d)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)) }, [instructorId])
  const monthTrend = stats ? (stats.lastMonth > 0 ? Math.round(((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100) : stats.thisMonth > 0 ? 100 : 0) : 0
  const maxCount = stats?.byTool?.length ? Math.max(...stats.byTool.map(b => b.count), 1) : 1

  if (loading) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Card key={i} className="rounded-2xl"><CardContent className="p-4"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-8 w-16" /></CardContent></Card>)}</div>

  const statCards = [
    { label: 'Total Generations', value: stats?.totalGenerations || 0, icon: BarChart3, color: 'teal' as const },
    { label: 'Favorites', value: stats?.favoriteCount || 0, icon: Star, color: 'amber' as const },
    { label: 'Templates', value: stats?.templatesCount || 0, icon: Bookmark, color: 'violet' as const },
    { label: 'Assistant Messages', value: stats?.assistantMessagesCount || 0, icon: MessageSquare, color: 'emerald' as const },
  ]

  return (
    <div className="space-y-6">
      <InstructorStatCardGrid columns={4}>
        {statCards.map((s, i) => (
          <InstructorStatCard
            key={s.label}
            icon={s.icon}
            value={s.value}
            label={s.label}
            color={s.color}
            index={i}
          />
        ))}
      </InstructorStatCardGrid>
      <Card className="rounded-2xl"><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs font-medium text-muted-foreground">This Month</p><p className="text-2xl font-bold">{stats?.thisMonth || 0} generations</p></div>
        <div className={cn('flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium', monthTrend >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400')}>
          {monthTrend >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}{monthTrend >= 0 ? '+' : ''}{monthTrend}% vs last month
        </div></div></CardContent></Card>
      {stats?.byTool && stats.byTool.length > 0 && <Card className="rounded-2xl"><CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Tool Usage Breakdown</CardTitle></CardHeader><CardContent className="space-y-3">
        {stats.byTool.map(item => <div key={item.toolType} className="space-y-1"><div className="flex items-center justify-between text-xs"><span className="font-medium">{toolLabels[item.toolType] || item.toolType}</span><span className="text-muted-foreground">{item.count}</span></div>
          <div className="h-2 rounded-full bg-muted overflow-hidden"><div className={cn('h-full rounded-full bg-gradient-to-r', toolGradients[item.toolType] || 'from-gray-500 to-gray-600')} style={{ width: `${(item.count / maxCount) * 100}%` }} /></div></div>)}
      </CardContent></Card>}
      {stats?.recentActivity && stats.recentActivity.length > 0 && <Card className="rounded-2xl"><CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Recent Activity</CardTitle></CardHeader><CardContent><ScrollArea className="max-h-72"><div className="space-y-3">
        {stats.recentActivity.slice(0, 10).map(g => <div key={g.id} className="flex items-center gap-3 py-1.5"><div className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg', toolIconBgs[g.toolType] || 'bg-muted text-muted-foreground')}><BarChart3 className="size-3.5" /></div><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{g.title}</p><p className="text-[11px] text-muted-foreground">{toolLabels[g.toolType] || g.toolType}</p></div><span className="text-[11px] text-muted-foreground/60 shrink-0">{relativeTime(g.createdAt)}</span></div>)}
      </div></ScrollArea></CardContent></Card>}
    </div>
  )
}

// ── AI Assistant Chat Bar ──
function AIAssistantBar({ instructorId }: { instructorId: string }) {
  const [input, setInput] = useState(''); const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false); const [expanded, setExpanded] = useState(false)
  const [showClear, setShowClear] = useState(false); const [initialized, setInitialized] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (!instructorId) return; fetch(`/api/instructor/ai/assistant-messages?instructorId=${instructorId}&limit=50`).then(r => r.json()).then(d => { if (d.messages?.length) setMessages(d.messages.map((m: AIAssistantMsg) => ({ role: m.role, content: m.content, timestamp: new Date(m.createdAt), id: m.id }))) }).catch(() => {}).finally(() => setInitialized(true)) }, [instructorId])
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, [messages])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: input.trim(), timestamp: new Date() }
    setMessages(p => [...p, userMsg]); setInput(''); setLoading(true)
    try {
      await fetch('/api/instructor/ai/assistant-messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ instructorId, role: 'user', content: userMsg.content }) })
      const res = await fetch('/api/instructor/ai/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMsg.content, history: messages.filter(m => !m.content.startsWith('⚠️')).map(m => ({ role: m.role, content: m.content })) }) })
      const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Error')
      const aiContent = String(data.content || data.response || 'No response')
      setMessages(p => [...p, { role: 'assistant', content: aiContent, timestamp: new Date() }])
      await fetch('/api/instructor/ai/assistant-messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ instructorId, role: 'assistant', content: aiContent }) })
    } catch (e: unknown) { setMessages(p => [...p, { role: 'assistant', content: `⚠️ ${e instanceof Error ? e.message : 'Something went wrong'}`, timestamp: new Date() }]) } finally { setLoading(false) }
  }

  const handleClear = async () => { try { await fetch(`/api/instructor/ai/assistant-messages?instructorId=${instructorId}`, { method: 'DELETE' }); setMessages([]); toast.success('Chat cleared') } catch { toast.error('Failed') }; setShowClear(false) }

  if (!initialized) return <div className="mt-8"><div className="flex items-center gap-2 mb-3"><Skeleton className="size-8 rounded-xl" /><Skeleton className="h-4 w-24" /></div><Skeleton className="h-11 w-full rounded-xl" /></div>

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-8">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white"><Bot className="size-4" /></div>
        <div className="flex-1"><h3 className="text-[15px] font-bold flex items-center gap-1.5">AI Assistant<Badge variant="secondary" className="text-[9px] px-1.5 py-0 rounded-md">always-on</Badge></h3><p className="text-[11px] text-muted-foreground">Ask me anything about your courses, students, or content...</p></div>
        {messages.length > 0 && <Button variant="ghost" size="sm" onClick={() => setShowClear(true)} className="h-7 text-xs gap-1"><Trash2 className="size-3" />Clear</Button>}
      </div>
      <AnimatePresence>{(expanded || messages.length > 0) && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
          <div ref={scrollRef} className="max-h-64 overflow-y-auto scrollbar-thin rounded-xl bg-muted/30 border border-border/30 p-3 mb-3 space-y-3">
            {messages.length === 0 && expanded && <p className="text-center text-[12px] text-muted-foreground/60 py-4">Ask a question to get started...</p>}
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white mt-0.5"><Sparkles className="size-3" /></div>}
                <div className={cn('rounded-2xl px-3.5 py-2.5 max-w-[80%] text-[13px] leading-relaxed', msg.role === 'user' ? 'bg-primary text-primary-foreground' : msg.content.startsWith('⚠️') ? 'bg-destructive/10 border border-destructive/20 text-destructive' : 'bg-card border border-border/40')}>{msg.content}</div>
              </motion.div>
            ))}
            {loading && <div className="flex gap-2 items-start"><div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white"><Sparkles className="size-3" /></div><div className="rounded-2xl px-3.5 py-2.5 bg-card border border-border/40"><div className="flex gap-1"><span className="size-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} /><span className="size-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} /><span className="size-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} /></div></div></div>}
          </div>
        </motion.div>
      )}</AnimatePresence>
      <div className="flex gap-2 items-center">
        <div className="flex-1 relative">
          <Input placeholder='e.g. "Which of my lessons has the highest dropout?"' value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }} onFocus={() => setExpanded(true)} className="rounded-xl pr-10 h-11 text-[13px]" disabled={loading} />
          <Button size="icon" onClick={handleSend} disabled={loading || !input.trim()} className="absolute right-1 top-1/2 -translate-y-1/2 size-8 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-md">{loading ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}</Button>
        </div>
      </div>
      <AlertDialog open={showClear} onOpenChange={setShowClear}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle className="flex items-center gap-2"><AlertTriangle className="size-5 text-destructive" />Clear Chat History</AlertDialogTitle><AlertDialogDescription>This will permanently delete all your chat messages.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel><AlertDialogAction onClick={handleClear} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">Clear All</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </motion.div>
  )
}

// ── Main View ──
export function InstructorAIToolsView() {
  const currentUser = useAppStore(s => s.currentUser)
  const { setCurrentView, setSelectedAIToolId } = useAppStore()
  const instructorId = currentUser?.id || ''
  const [activeTab, setActiveTab] = useState('tools')
  const [genRefresh, setGenRefresh] = useState(0)

  const openTool = (id: ToolId, _params?: Record<string, unknown>) => {
    setSelectedAIToolId(id)
    setCurrentView('instructor-ai-tool-detail')
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm"><Sparkles className="size-5" /></div><h1 className="text-2xl font-bold tracking-tight">AI Tools Hub</h1></div><p className="text-muted-foreground text-[14px] pl-[52px]">Your intelligent co-creator. All powered by <ShijlAIText />&apos;s engine.</p></div>
        <Badge variant="secondary" className="rounded-lg gap-1 text-[11px] px-2.5"><Zap className="size-3" />8 Tools Available</Badge>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 rounded-xl">
          <TabsTrigger value="tools" className="rounded-lg gap-1.5 text-xs sm:text-sm"><Wand2 className="size-3.5" /><span className="hidden sm:inline">Tools</span></TabsTrigger>
          <TabsTrigger value="generations" className="rounded-lg gap-1.5 text-xs sm:text-sm"><BarChart3 className="size-3.5" /><span className="hidden sm:inline">My Generations</span></TabsTrigger>
          <TabsTrigger value="templates" className="rounded-lg gap-1.5 text-xs sm:text-sm"><Bookmark className="size-3.5" /><span className="hidden sm:inline">Templates</span></TabsTrigger>
          <TabsTrigger value="usage" className="rounded-lg gap-1.5 text-xs sm:text-sm"><BarChart3 className="size-3.5" /><span className="hidden sm:inline">Usage</span></TabsTrigger>
        </TabsList>

        <TabsContent value="tools" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {TOOLS.map((tool, i) => (
              <motion.div key={tool.id} custom={i} variants={cardVariants} initial="hidden" animate="visible" whileHover={{ y: -2, scale: 1.01 }} whileTap={{ scale: 0.98 }}
                className="group cursor-pointer rounded-2xl bg-card p-5 shadow-sm border border-border/30 hover:border-border/60 transition-all duration-200 relative overflow-hidden">
                <div className={cn('absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br transition-opacity duration-300', tool.gradient)} />
                <div className="relative flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className={cn('flex size-10 items-center justify-center rounded-xl transition-all duration-200', tool.iconBg, 'group-hover:scale-110')}>{tool.icon}</div>
                    <div className="flex items-center gap-1">
                      {tool.badge && <Badge variant="secondary" className="rounded-lg text-[10px] px-1.5 py-0.5 font-semibold">{tool.badge}</Badge>}
                      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="size-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}><MoreVertical className="size-3.5" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); openTool(tool.id) }}><Wand2 className="size-3.5 mr-2" />Open Tool</DropdownMenuItem>
                          <DropdownMenuItem onClick={e => { e.stopPropagation(); fetch('/api/instructor/ai/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ instructorId, toolType: tool.id, name: `${tool.title} Template`, inputParams: {} }) }).then(() => toast.success('Template created!')).catch(() => toast.error('Failed')) }}><Bookmark className="size-3.5 mr-2" />Save as Template</DropdownMenuItem>
                        </DropdownMenuContent></DropdownMenu>
                    </div>
                  </div>
                  <div onClick={() => openTool(tool.id)}><h4 className="font-semibold text-[15px] mb-0.5">{tool.title}</h4><p className="text-[11px] font-medium text-muted-foreground/70">{tool.subtitle}</p></div>
                  <p className="text-[13px] text-muted-foreground leading-relaxed" onClick={() => openTool(tool.id)}>{tool.description}</p>
                  <div className="flex items-center gap-1.5 mt-auto pt-1" onClick={() => openTool(tool.id)}><span className="text-[13px] font-semibold text-primary group-hover:text-primary/80 transition-colors">Open tool</span><ChevronRight className="size-3.5 text-primary group-hover:translate-x-0.5 transition-transform" /></div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="generations" className="mt-6"><MyGenerationsTab key={genRefresh} instructorId={instructorId} onOpenTool={(id, params) => { setActiveTab('tools'); openTool(id, params) }} /></TabsContent>
        <TabsContent value="templates" className="mt-6"><TemplatesTab instructorId={instructorId} onOpenTool={(id, params) => { setActiveTab('tools'); openTool(id, params) }} /></TabsContent>
        <TabsContent value="usage" className="mt-6"><UsageTab instructorId={instructorId} /></TabsContent>
      </Tabs>

      <AIAssistantBar instructorId={instructorId} />
    </div>
  )
}
