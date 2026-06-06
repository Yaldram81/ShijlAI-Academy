'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import {
  Bot, BookOpen, HelpCircle, Languages, ClipboardList,
  PenLine, Image as ImageIcon, MessageSquare, BarChart3, Sparkles,
  Loader2, Send, Copy, Check, Download, ChevronRight, ArrowLeft,
  RotateCcw, Wand2, Zap, Star, StarOff,
  Search, Trash2, Eye, MoreVertical, Plus,
  Save, Bookmark, TrendingUp, Clock,
  X, AlertTriangle, RefreshCw, Settings2, History,
  FileText, Lightbulb, Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel,
} from '@/components/ui/alert-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
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
  tips?: string[]
  exampleOutputs?: string
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

// ── Tool Configs (enhanced with tips and examples) ──
const TOOLS: ToolConfig[] = [
  {
    id: 'curriculum', title: 'Curriculum Generator', subtitle: 'Full section + lesson outline',
    description: 'Describe your course topic and audience. Get a full section + lesson outline with learning objectives, lesson details, and suggested activities.',
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
    tips: ['Be specific with your topic for better results', 'Include the curriculum standard (IB, AP, etc.) for alignment', 'Specify the target age group for age-appropriate content'],
    exampleOutputs: 'Structured curriculum with sections, lessons, learning objectives, and estimated durations',
  },
  {
    id: 'quiz', title: 'Quiz Generator', subtitle: 'MCQ, True/False, Fill-in',
    description: 'Generate quizzes with multiple question types. Paste your content or describe a topic, and get ready-to-use quiz questions with answers and explanations.',
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
    tips: ['Paste source text for questions closely aligned with your content', 'Mix difficulties for a balanced assessment', 'Use 5-10 questions for optimal quiz length'],
    exampleOutputs: 'Quiz questions with type, options, correct answers, and explanations',
  },
  {
    id: 'caption', title: 'Auto Caption & Translate', subtitle: 'Multilingual captions',
    description: 'Generate captions for your content and translate them into multiple languages. Perfect for making your courses accessible globally.',
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
    tips: ['Use short, clear sentences for better caption timing', 'Select Video Script for time-synced captions', 'Review auto-generated captions for accuracy'],
    exampleOutputs: 'Time-synced captions with optional translations in multiple languages',
  },
  {
    id: 'assignment', title: 'Assignment + Rubric Builder', subtitle: 'Brief + grading rubric',
    description: 'Create comprehensive assignment briefs with detailed grading rubrics. Specify the skill and type, and get a ready-to-publish assignment.',
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
    tips: ['Include learning objectives for clearer rubrics', 'Specify assignment type for tailored output', 'Add course context for better alignment'],
    exampleOutputs: 'Assignment brief with instructions, deliverables, and a detailed grading rubric',
  },
  {
    id: 'description', title: 'Course Description Writer', subtitle: 'SEO-optimized copy',
    description: 'Generate SEO-optimized course descriptions with compelling titles, subtitles, learning outcomes, and marketing copy that converts.',
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
    tips: ['Include relevant keywords for better SEO', 'Choose a tone that matches your audience', 'Specify unique selling points in keywords'],
    exampleOutputs: 'Course title, subtitle, SEO description, learning outcomes, and target audience',
  },
  {
    id: 'thumbnail', title: 'Thumbnail Generator', subtitle: '4 AI thumbnail options',
    description: 'Generate professional course thumbnails with AI. Enter your course title and choose a style to get 4 unique thumbnail options.',
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
    tips: ['Use your exact course title for text on thumbnails', 'Try different styles to find the best match', 'Download and use the highest quality option'],
    exampleOutputs: '4 unique thumbnail images in 1344x768 resolution',
  },
  {
    id: 'qa-responder', title: 'Q&A Auto-Responder', subtitle: 'Draft answers instantly',
    description: 'Get AI-drafted answers to student questions. Review, edit, and post — saving hours every week on Q&A management.',
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
    tips: ['Include course context for more accurate answers', 'Review and personalize AI-drafted answers', 'Add references to specific course materials'],
    exampleOutputs: 'Detailed answer with explanation, examples, and references',
  },
  {
    id: 'feedback-analyzer', title: 'Student Feedback Analyzer', subtitle: 'Praise, issues & tips',
    description: 'Analyze student feedback at scale. Get summaries of top praise, recurring issues, and actionable improvement tips.',
    icon: <BarChart3 className="size-5" />, gradient: 'from-slate-500 to-gray-600',
    iconBg: 'bg-slate-100 text-slate-600 dark:bg-slate-950/40 dark:text-slate-400',
    formFields: [
      { name: 'reviews', label: 'Student Reviews *', type: 'textarea', placeholder: 'Paste all your reviews here...', rows: 8, required: true },
    ],
    apiEndpoint: '/api/instructor/ai/analyze-feedback', generateLabel: 'Analyze Feedback',
    apiBodyBuilder: v => ({ reviews: v.reviews?.trim() }),
    resultParser: d => String(d.content || d.analysis || 'No result generated'),
    validate: v => v.reviews?.trim() ? null : 'Please paste student reviews',
    tips: ['Paste multiple reviews for meaningful patterns', 'Include both positive and negative feedback', 'Re-analyze after making changes to track improvement'],
    exampleOutputs: 'Summary of key themes, top praise, issues, and actionable recommendations',
  },
]

const toolMap = Object.fromEntries(TOOLS.map(t => [t.id, t]))
const toolLabels: Record<string, string> = Object.fromEntries(TOOLS.map(t => [t.id, t.title.split(' ')[0]]))

function relativeTime(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1) return 'Just now'; if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
  const dy = Math.floor(h / 24); if (dy < 7) return `${dy}d ago`
  return new Date(d).toLocaleDateString()
}

// ── Main Component ──
export function InstructorAIToolDetailView() {
  const { selectedAIToolId, setSelectedAIToolId, setCurrentView, currentUser } = useAppStore()
  const tool = toolMap[selectedAIToolId || ''] || TOOLS[0]
  const instructorId = currentUser?.id || ''
  const [showSidebar, setShowSidebar] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  // Form state
  const defaults = Object.fromEntries(tool.formFields.map(f => [f.name, f.options?.[0]?.value || '']))
  const [vals, setVals] = useState<Record<string, string>>(defaults)
  const [result, setResult] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [questions, setQuestions] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(false)

  // History
  const [history, setHistory] = useState<AIGeneration[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Templates
  const [templates, setTemplates] = useState<AITemplate[]>([])

  // Load templates
  useEffect(() => {
    if (!instructorId) return
    fetch(`/api/instructor/ai/templates?instructorId=${instructorId}&toolType=${tool.id}`)
      .then(r => r.json())
      .then(d => setTemplates(d.templates || []))
      .catch(() => {})
  }, [tool.id, instructorId])

  // Load history
  const fetchHistory = useCallback(async () => {
    if (!instructorId) return
    setHistoryLoading(true)
    try {
      const p = new URLSearchParams({ instructorId, toolType: tool.id, limit: '10' })
      const d = await (await fetch(`/api/instructor/ai/generations?${p}`)).json()
      setHistory(d.generations || [])
    } catch { /* ignore */ } finally { setHistoryLoading(false) }
  }, [instructorId, tool.id])
  useEffect(() => { fetchHistory() }, [fetchHistory])

  // Reset form when tool changes
  useEffect(() => {
    const newDefaults = Object.fromEntries(tool.formFields.map(f => [f.name, f.options?.[0]?.value || '']))
    setVals(newDefaults)
    setResult(''); setImages([]); setQuestions([])
  }, [tool.id, tool.formFields])

  const set = (k: string, v: string) => setVals(prev => ({ ...prev, [k]: v }))

  const handleGenerate = async () => {
    const err = tool.validate(vals); if (err) { toast.error(err); return }
    setLoading(true); setResult(''); setImages([]); setQuestions([])
    try {
      const res = await fetch(tool.apiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tool.apiBodyBuilder(vals)) })
      const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Generation failed')
      if (tool.id === 'quiz') {
        setQuestions(data.questions || []); setResult(JSON.stringify(data.questions, null, 2))
        toast.success(`${data.questions?.length || 0} quiz questions generated!`)
      } else if (tool.id === 'thumbnail') {
        setImages(data.images || []); toast.success('Thumbnails generated!')
      } else {
        setResult(tool.resultParser(data)); toast.success(`${tool.title.split(' ')[0]} generated!`)
      }
      fetchHistory() // refresh history
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed to generate') } finally { setLoading(false) }
  }

  const handleReset = () => {
    const newDefaults = Object.fromEntries(tool.formFields.map(f => [f.name, f.options?.[0]?.value || '']))
    setVals(newDefaults); setResult(''); setImages([]); setQuestions([])
  }

  const handleSave = async () => {
    const titleVal = tool.titleField ? vals[tool.titleField] || '' : tool.title
    const inputParams = { ...vals }
    const resultContent = result || '4 thumbnail images generated'
    try {
      const r = await fetch('/api/instructor/ai/generations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorId, toolType: tool.id, title: titleVal || `${toolLabels[tool.id]} - ${new Date().toLocaleDateString()}`, inputParams, resultContent, resultImages: images.length ? images : undefined })
      })
      if (!r.ok) throw new Error()
      toast.success('Generation saved!'); fetchHistory()
    } catch { toast.error('Failed to save') }
  }

  const handleSaveTemplate = async (name: string) => {
    try {
      const r = await fetch('/api/instructor/ai/templates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorId, toolType: tool.id, name: name.trim(), inputParams: { ...vals } })
      })
      if (!r.ok) throw new Error()
      toast.success('Template saved!')
      // Refresh templates
      const d = await (await fetch(`/api/instructor/ai/templates?instructorId=${instructorId}&toolType=${tool.id}`)).json()
      setTemplates(d.templates || [])
    } catch { toast.error('Failed to save template') }
  }

  const handleApplyTemplate = (tpl: AITemplate) => {
    const u = { ...vals }
    for (const f of tool.formFields) { if (tpl.inputParams[f.name] != null) u[f.name] = String(tpl.inputParams[f.name]) }
    setVals(u)
    toast.success(`Template "${tpl.name}" applied`)
    fetch(`/api/instructor/ai/templates/${tpl.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ incrementUsage: true, instructorId }) }).catch(() => {})
  }

  const handleDeleteGeneration = async () => {
    if (!deleteId) return
    try {
      await fetch(`/api/instructor/ai/generations/${deleteId}?instructorId=${instructorId}`, { method: 'DELETE' })
      setHistory(p => p.filter(g => g.id !== deleteId)); toast.success('Deleted'); setDeleteId(null)
    } catch { toast.error('Failed to delete') }
  }

  const handleLoadGeneration = (gen: AIGeneration) => {
    const u = { ...vals }
    for (const f of tool.formFields) { if (gen.inputParams[f.name] != null) u[f.name] = String(gen.inputParams[f.name]) }
    setVals(u); setResult(gen.resultContent)
    if (gen.resultImages?.length) setImages(gen.resultImages)
    if (tool.id === 'quiz' && gen.resultContent) {
      try { setQuestions(JSON.parse(gen.resultContent)) } catch { /* ignore */ }
    }
    setShowHistory(false)
    toast.success('Generation loaded')
  }

  const titleVal = tool.titleField ? vals[tool.titleField] || '' : tool.title
  const hasResult = !!(result || images.length || questions.length)
  const isValid = !tool.validate(vals)
  const otherTools = TOOLS.filter(t => t.id !== tool.id)

  return (
    <div className="flex flex-col h-full -m-4 md:-m-5 lg:-m-6">
      {/* ── Header ── */}
      <div className={cn('flex items-center justify-between px-4 md:px-6 py-3 border-b bg-gradient-to-r text-white', tool.gradient)}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setCurrentView('instructor-ai-tools')} className="text-white/90 hover:text-white hover:bg-white/10 gap-1.5">
            <ArrowLeft className="size-4" /><span className="hidden sm:inline">All Tools</span>
          </Button>
          <div className="h-5 w-px bg-white/30" />
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">{tool.icon}</div>
            <div>
              <h1 className="font-bold text-[15px] leading-tight">{tool.title}</h1>
              <p className="text-white/80 text-[11px] hidden sm:block">{tool.subtitle}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {hasResult && (
            <>
              <TooltipProvider><Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={handleSave} className="text-white/90 hover:text-white hover:bg-white/10 gap-1.5 h-8">
                  <Save className="size-3.5" /><span className="hidden sm:inline text-xs">Save</span>
                </Button>
              </TooltipTrigger><TooltipContent>Save Generation</TooltipContent></Tooltip></TooltipProvider>
              <TooltipProvider><Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={async () => { await navigator.clipboard.writeText(result); toast.success('Copied!') }} className="text-white/90 hover:text-white hover:bg-white/10 gap-1.5 h-8">
                  <Copy className="size-3.5" /><span className="hidden sm:inline text-xs">Copy</span>
                </Button>
              </TooltipTrigger><TooltipContent>Copy Result</TooltipContent></Tooltip></TooltipProvider>
              <TooltipProvider><Tooltip><TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={handleReset} className="text-white/90 hover:text-white hover:bg-white/10 gap-1.5 h-8">
                  <RotateCcw className="size-3.5" /><span className="hidden sm:inline text-xs">New</span>
                </Button>
              </TooltipTrigger><TooltipContent>Start Over</TooltipContent></Tooltip></TooltipProvider>
            </>
          )}
          <TooltipProvider><Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)} className={cn('text-white/90 hover:text-white hover:bg-white/10 gap-1.5 h-8', showHistory && 'bg-white/20')}>
              <History className="size-3.5" /><span className="hidden sm:inline text-xs">History</span>
            </Button>
          </TooltipTrigger><TooltipContent>Recent Generations</TooltipContent></Tooltip></TooltipProvider>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Config */}
        <AnimatePresence initial={false}>
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="border-r bg-muted/20 overflow-hidden flex-shrink-0"
            >
              <ScrollArea className="h-full">
                <div className="p-4 space-y-5 w-[340px]">
                  {/* Template Selector */}
                  {templates.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Bookmark className="size-3" />Templates
                      </Label>
                      <Select onValueChange={val => {
                        const t = templates.find(x => x.id === val)
                        if (t) handleApplyTemplate(t)
                      }}>
                        <SelectTrigger className="rounded-xl text-sm"><SelectValue placeholder="Apply a template..." /></SelectTrigger>
                        <SelectContent>{templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name} • Used {t.usageCount}x</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Form Fields */}
                  {tool.formFields.map(f => (
                    <div key={f.name} className="space-y-2">
                      <Label className="text-sm font-medium">{f.label}</Label>
                      {f.type === 'input' && <Input placeholder={f.placeholder} value={vals[f.name] || ''} onChange={e => set(f.name, e.target.value)} className="rounded-xl" />}
                      {f.type === 'textarea' && <Textarea placeholder={f.placeholder} value={vals[f.name] || ''} onChange={e => set(f.name, e.target.value)} rows={f.rows || 4} className="rounded-xl resize-none" />}
                      {f.type === 'select' && <Select value={vals[f.name] || f.options?.[0]?.value} onValueChange={v => set(f.name, v)}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>{f.options?.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                      </Select>}
                    </div>
                  ))}

                  {/* Generate Button */}
                  <Button onClick={handleGenerate} disabled={loading || !isValid} className={cn('w-full rounded-xl gap-2 bg-gradient-to-r text-white font-semibold py-5 text-sm', tool.gradient)}>
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                    {loading ? 'Generating...' : tool.generateLabel}
                  </Button>

                  {/* Save as Template */}
                  <SaveTemplateInline onSave={handleSaveTemplate} />

                  {/* Tips */}
                  {tool.tips && tool.tips.length > 0 && (
                    <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 p-3.5 space-y-2">
                      <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                        <Lightbulb className="size-3.5" />
                        <span className="text-xs font-semibold">Tips</span>
                      </div>
                      <ul className="space-y-1.5">
                        {tool.tips.map((tip, i) => (
                          <li key={i} className="text-[11px] text-amber-600 dark:text-amber-400/80 leading-relaxed flex gap-1.5">
                            <span className="shrink-0">•</span>{tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Other Tools */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Other Tools</Label>
                    <div className="space-y-1">
                      {otherTools.map(t => (
                        <button key={t.id} onClick={() => setSelectedAIToolId(t.id)}
                          className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/60 transition-colors text-left group">
                          <div className={cn('flex size-7 items-center justify-center rounded-lg shrink-0', t.iconBg)}>{t.icon}</div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-medium truncate group-hover:text-foreground transition-colors">{t.title}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{t.subtitle}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Output Area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Sidebar Toggle */}
          <button onClick={() => setShowSidebar(!showSidebar)}
            className="absolute top-3 left-3 z-20 flex size-8 items-center justify-center rounded-lg bg-background border border-border shadow-sm hover:bg-muted transition-colors">
            {showSidebar ? <PanelLeftClose className="size-3.5" /> : <PanelLeftOpen className="size-3.5" />}
          </button>

          {/* Output Content */}
          <ScrollArea className="flex-1">
            <div className="p-6 pt-14 max-w-4xl mx-auto">
              {/* Empty State */}
              {!hasResult && !loading && (
                <div className="flex flex-col items-center justify-center py-20 gap-6">
                  <div className={cn('size-20 rounded-2xl flex items-center justify-center bg-gradient-to-br text-white shadow-lg', tool.gradient)}>
                    {tool.icon}
                  </div>
                  <div className="text-center space-y-2 max-w-md">
                    <h2 className="text-xl font-bold">{tool.title}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">{tool.description}</p>
                  </div>
                  {tool.exampleOutputs && (
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/50 border border-border/40">
                      <FileText className="size-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Output: {tool.exampleOutputs}</span>
                    </div>
                  )}
                  <Button onClick={handleGenerate} disabled={!isValid} className={cn('rounded-xl gap-2 bg-gradient-to-r text-white font-semibold px-8 py-5', tool.gradient)}>
                    <Wand2 className="size-4" />{tool.generateLabel}
                  </Button>
                  {!isValid && <p className="text-xs text-muted-foreground">Fill in the required fields to get started</p>}
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="relative">
                    <div className={cn('size-20 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg', tool.gradient, 'opacity-30')}>
                      {tool.icon}
                    </div>
                    <Loader2 className={cn('size-10 animate-spin absolute inset-0 m-auto', {
                      'text-emerald-500': tool.id === 'curriculum',
                      'text-violet-500': tool.id === 'quiz',
                      'text-sky-500': tool.id === 'caption',
                      'text-amber-500': tool.id === 'assignment',
                      'text-rose-500': tool.id === 'description',
                      'text-fuchsia-500': tool.id === 'thumbnail',
                      'text-teal-500': tool.id === 'qa-responder',
                      'text-slate-500': tool.id === 'feedback-analyzer',
                    })} />
                    <Sparkles className="size-5 text-amber-500 absolute -top-2 -right-2 animate-pulse" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="font-semibold text-sm">Generating your {tool.title.split(' ')[0].toLowerCase()}...</p>
                    <p className="text-xs text-muted-foreground">This usually takes 10-30 seconds</p>
                  </div>
                </div>
              )}

              {/* Result: Thumbnails */}
              {tool.id === 'thumbnail' && images.length > 0 && !loading && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold">Generated Thumbnails</h2>
                      <p className="text-xs text-muted-foreground">Click to download. Hover for options.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {images.map((img, i) => (
                      <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.12 }}
                        className="group relative rounded-2xl overflow-hidden border-2 border-border/40 cursor-pointer hover:ring-2 hover:ring-fuchsia-500/50 hover:border-fuchsia-500/30 transition-all shadow-sm hover:shadow-md">
                        <img src={`data:image/png;base64,${img}`} alt={`Thumbnail ${i + 1}`} className="w-full aspect-video object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => { const a = document.createElement('a'); a.href = `data:image/png;base64,${img}`; a.download = `thumbnail-${i + 1}.png`; a.click(); toast.success('Downloaded!') }}
                              className="rounded-xl gap-1.5 bg-white text-black hover:bg-white/90 shadow-lg">
                              <Download className="size-3.5" />Download
                            </Button>
                          </div>
                        </div>
                        <Badge className="absolute top-3 left-3 rounded-lg text-[10px] shadow-sm">Option {i + 1}</Badge>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Result: Quiz Questions */}
              {tool.id === 'quiz' && questions.length > 0 && !loading && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold">Generated Quiz Questions</h2>
                      <p className="text-xs text-muted-foreground">{questions.length} questions • Review and edit before publishing</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {questions.map((q, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="rounded-xl bg-card p-5 border border-border/40 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <span className="flex size-7 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 text-xs font-bold shrink-0">{i + 1}</span>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start gap-2">
                              <Badge variant="secondary" className="shrink-0 rounded-lg text-[10px]">{String(q.type)}</Badge>
                              <p className="text-sm font-medium leading-relaxed">{String(q.text)}</p>
                            </div>
                            {Array.isArray(q.options) && q.options.length > 0 && (
                              <div className="ml-1 space-y-1.5">
                                {q.options.map((opt: unknown, oi: number) => (
                                  <div key={oi} className={cn('flex items-center gap-2 text-[13px] px-3 py-1.5 rounded-lg transition-colors',
                                    opt === q.correctAnswer
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 font-medium border border-emerald-200/50 dark:border-emerald-800/30'
                                      : 'bg-muted/40 text-muted-foreground'
                                  )}>
                                    <span className="shrink-0 size-5 flex items-center justify-center rounded text-[10px] font-bold">{String.fromCharCode(65 + oi)}</span>
                                    {String(opt)}
                                    {opt === q.correctAnswer && <Check className="size-3.5 ml-auto text-emerald-500" />}
                                  </div>
                                ))}
                              </div>
                            )}
                            {q.explanation && <p className="text-[12px] text-muted-foreground mt-2 pl-1 italic flex gap-1.5"><span>💡</span>{String(q.explanation)}</p>}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Result: Text Content (Markdown) */}
              {tool.id !== 'thumbnail' && tool.id !== 'quiz' && result && !loading && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold">Generated Result</h2>
                      <p className="text-xs text-muted-foreground">Review, copy, or save your generation</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-card p-6 border border-border/40 shadow-sm">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{result}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* History Panel (slide-over) */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="absolute inset-y-0 right-0 w-[380px] max-w-full bg-background border-l shadow-xl z-30 flex flex-col"
              >
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-semibold text-sm">Recent Generations</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowHistory(false)} className="size-7 p-0"><X className="size-3.5" /></Button>
                </div>
                <ScrollArea className="flex-1">
                  {historyLoading && <div className="p-4 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>}
                  {!historyLoading && history.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <History className="size-8 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No generations yet</p>
                    </div>
                  )}
                  {!historyLoading && history.length > 0 && (
                    <div className="p-3 space-y-2">
                      {history.map(gen => (
                        <div key={gen.id} className="rounded-xl border border-border/40 p-3 hover:bg-muted/30 transition-colors group cursor-pointer" onClick={() => handleLoadGeneration(gen)}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-medium truncate">{gen.title}</p>
                              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{gen.resultContent}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" className="size-6 p-0" onClick={(e) => { e.stopPropagation(); setDeleteId(gen.id) }}>
                                <Trash2 className="size-3 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1"><Clock className="size-2.5" />{relativeTime(gen.createdAt)}</span>
                            {gen.isFavorite && <Star className="size-2.5 fill-amber-400 text-amber-400" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <AlertDialog open={!!deleteId} onOpenChange={v => { if (!v) setDeleteId(null) }}>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Delete Generation?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDeleteGeneration}>Delete</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ── Save Template Inline ──
function SaveTemplateInline({ onSave }: { onSave: (name: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  if (expanded) return (
    <div className="flex items-center gap-2">
      <Input value={name} onChange={e => setName(e.target.value)} placeholder="Template name" className="h-8 text-xs rounded-lg" onKeyDown={e => {
        if (e.key === 'Enter' && name.trim()) { setSaving(true); onSave(name); setSaving(false); setExpanded(false); setName('') }
        if (e.key === 'Escape') setExpanded(false)
      }} autoFocus />
      <Button size="sm" onClick={() => { if (!name.trim()) { toast.error('Enter a name'); return } setSaving(true); onSave(name); setSaving(false); setExpanded(false); setName('') }} disabled={saving} className="h-8 text-xs gap-1">
        {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setExpanded(false)} className="h-8"><X className="size-3" /></Button>
    </div>
  )

  return (
    <Button variant="outline" size="sm" onClick={() => setExpanded(true)} className="w-full rounded-xl gap-1.5 text-xs h-8">
      <Bookmark className="size-3" />Save as Template
    </Button>
  )
}
