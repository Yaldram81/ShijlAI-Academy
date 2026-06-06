'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, HelpCircle, ClipboardList, MessageSquare, PenLine, BarChart3,
  Sparkles, Loader2, Copy, Check, ChevronRight, ChevronDown, RotateCcw,
  Save, Wand2, ArrowLeft, Download, Star, StarOff, Bookmark, Clock,
  Lightbulb, Target, CheckCircle2, AlertTriangle, TrendingUp, Zap,
  FileText, ListChecks, ThumbsUp, ThumbsDown, Minus, Info, Languages,
  Award, Layers, GraduationCap, Gauge, ArrowUpRight, Flame
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'

// ── Types ──
type ToolId = 'curriculum' | 'quiz' | 'assignment' | 'description' | 'qa-responder' | 'feedback-analyzer' | 'outcomes' | 'lesson-content' | 'rubric' | 'insights' | 'caption'

interface ToolConfig {
  id: ToolId
  title: string
  subtitle: string
  description: string
  icon: React.ReactNode
  gradient: string
  iconBg: string
  badge?: string
  tips: string[]
}

interface FormField {
  name: string; label: string; type: 'input' | 'textarea' | 'select'
  placeholder?: string; options?: { value: string; label: string }[]
  required?: boolean; rows?: number
}

// ── Tool Configs ──
const TOOLS: ToolConfig[] = [
  {
    id: 'curriculum', title: 'Course Outline Generator', subtitle: 'Full module + lesson outline',
    description: 'Describe your course topic and audience. AI generates a complete curriculum with modules, lessons, and objectives.',
    icon: <BookOpen className="size-5" />, gradient: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400', badge: 'Popular',
    tips: ['Include specific curriculum standards (IB, AP, Cambridge) for best results', 'Specify the number of modules you want', 'Mention if you need specific lesson types like quizzes or assignments'],
  },
  {
    id: 'outcomes', title: 'Learning Outcome Generator', subtitle: 'Measurable, aligned outcomes',
    description: 'Enter a course topic and framework. AI generates specific, measurable learning outcomes aligned with Bloom\'s Taxonomy.',
    icon: <Target className="size-5" />, gradient: 'from-cyan-500 to-sky-600',
    iconBg: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400',
    tips: ['Outcomes start with action verbs, never "understand" or "know"', 'Choose Bloom\'s Taxonomy for progressive cognitive levels', 'Include assessment methods for each outcome'],
  },
  {
    id: 'lesson-content', title: 'Lesson Content Generator', subtitle: 'Rich lesson with exercises',
    description: 'Enter a topic and style. AI generates comprehensive lesson content with key concepts, examples, and exercises.',
    icon: <FileText className="size-5" />, gradient: 'from-sky-500 to-blue-600',
    iconBg: 'bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
    tips: ['Paste an outline to keep the content structured', 'Choose a style that matches your teaching approach', 'Each concept includes an analogy for better understanding'],
  },
  {
    id: 'quiz', title: 'Quiz Generator', subtitle: 'MCQ, True/False, Fill-in',
    description: 'Enter a topic or paste lesson content. AI generates diverse quiz questions with answers and explanations.',
    icon: <HelpCircle className="size-5" />, gradient: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
    tips: ['Paste your lesson content for questions tailored to your material', 'Mix question types for better assessment', 'Use higher difficulty for advanced learners'],
  },
  {
    id: 'assignment', title: 'Assignment + Rubric Builder', subtitle: 'Brief + grading rubric',
    description: 'Describe the skill or topic. AI generates a complete assignment brief with a detailed grading rubric.',
    icon: <ClipboardList className="size-5" />, gradient: 'from-amber-500 to-orange-600',
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    tips: ['Specify the assignment type for tailored output', 'Include the course name for context-aware results', 'The rubric will have 4 performance levels per criterion'],
  },
  {
    id: 'rubric', title: 'Rubric Generator', subtitle: 'Standalone grading rubric',
    description: 'Create a detailed, standalone grading rubric with weighted criteria, performance levels, and specific indicators.',
    icon: <Award className="size-5" />, gradient: 'from-orange-500 to-red-600',
    iconBg: 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400',
    tips: ['Weights auto-total to 100 points', 'Each level includes specific indicators for clarity', 'Choose the assignment type for tailored criteria'],
  },
  {
    id: 'description', title: 'Course Description Writer', subtitle: 'SEO-optimized copy',
    description: 'Enter your course topic and keywords. AI generates SEO-optimized title, description, and learning outcomes.',
    icon: <PenLine className="size-5" />, gradient: 'from-rose-500 to-pink-600',
    iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400', badge: 'AI',
    tips: ['Include target keywords for better SEO', 'Choose a tone that matches your audience', 'The output includes a subtitle and keyword suggestions'],
  },
  {
    id: 'caption', title: 'Auto Caption & Translate', subtitle: 'Timestamped captions',
    description: 'Paste your video transcript or text. AI generates timestamped captions and translates them to your target language.',
    icon: <Languages className="size-5" />, gradient: 'from-lime-500 to-green-600',
    iconBg: 'bg-lime-100 text-lime-600 dark:bg-lime-950/40 dark:text-lime-400',
    tips: ['Works with video transcripts or plain text', 'Captions include timestamps for easy sync', 'Choose your target language for translation'],
  },
  {
    id: 'qa-responder', title: 'Q&A Auto-Responder', subtitle: 'Draft answers instantly',
    description: 'Paste a student question. AI drafts a clear, educational answer you can review and post.',
    icon: <MessageSquare className="size-5" />, gradient: 'from-teal-500 to-emerald-600',
    iconBg: 'bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400',
    tips: ['Add course context for more accurate answers', 'The answer includes key points and related topics', 'Review and personalize before posting'],
  },
  {
    id: 'feedback-analyzer', title: 'Student Feedback Analyzer', subtitle: 'Insights & action tips',
    description: 'Paste student reviews. AI analyzes sentiment, highlights praise and issues, and provides improvement tips.',
    icon: <BarChart3 className="size-5" />, gradient: 'from-slate-500 to-gray-600',
    iconBg: 'bg-slate-100 text-slate-600 dark:bg-slate-950/40 dark:text-slate-400',
    tips: ['Include at least 5 reviews for meaningful analysis', 'Works with any format of student feedback', 'Each tip includes a priority level'],
  },
  {
    id: 'insights', title: 'Course Improvement Insights', subtitle: 'Actionable recommendations',
    description: 'AI analyzes your course data and provides specific, prioritized improvement recommendations with quick wins.',
    icon: <TrendingUp className="size-5" />, gradient: 'from-fuchsia-500 to-pink-600',
    iconBg: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-950/40 dark:text-fuchsia-400', badge: 'New',
    tips: ['Provide a course name for more targeted insights', 'Focus on a specific area for deeper analysis', 'Insights include both quick wins and long-term goals'],
  },
]

// ── Form field configs ──
const TOOL_FORM_FIELDS: Record<ToolId, FormField[]> = {
  curriculum: [
    { name: 'topic', label: 'Course Topic *', type: 'input', placeholder: 'e.g., IB Physics — Oscillations & Waves', required: true },
    { name: 'audience', label: 'Target Audience', type: 'input', placeholder: 'e.g., IB Year 1 students, ages 16-18' },
    { name: 'level', label: 'Difficulty Level', type: 'select', options: [{ value: 'beginner', label: 'Beginner' }, { value: 'intermediate', label: 'Intermediate' }, { value: 'advanced', label: 'Advanced' }] },
    { name: 'sections', label: 'Number of Modules', type: 'select', options: [{ value: '3', label: '3 Modules' }, { value: '4', label: '4 Modules' }, { value: '5', label: '5 Modules' }, { value: '6', label: '6 Modules' }, { value: '8', label: '8 Modules' }] },
  ],
  outcomes: [
    { name: 'topic', label: 'Course Topic *', type: 'input', placeholder: 'e.g., Data Structures & Algorithms', required: true },
    { name: 'framework', label: 'Framework', type: 'select', options: [{ value: "Bloom's Taxonomy", label: "Bloom's Taxonomy" }, { value: 'Competency-Based', label: 'Competency-Based' }, { value: 'Backward Design', label: 'Backward Design' }] },
    { name: 'level', label: 'Level', type: 'select', options: [{ value: 'introductory', label: 'Introductory' }, { value: 'intermediate', label: 'Intermediate' }, { value: 'advanced', label: 'Advanced' }] },
    { name: 'count', label: 'Number of Outcomes', type: 'select', options: [{ value: '5', label: '5 Outcomes' }, { value: '8', label: '8 Outcomes' }, { value: '10', label: '10 Outcomes' }, { value: '12', label: '12 Outcomes' }] },
  ],
  'lesson-content': [
    { name: 'topic', label: 'Lesson Topic *', type: 'input', placeholder: 'e.g., Binary Search Trees — Insertion & Deletion', required: true },
    { name: 'outline', label: 'Paste Outline (optional)', type: 'textarea', placeholder: 'Paste your lesson outline or structure here...', rows: 4 },
    { name: 'style', label: 'Content Style', type: 'select', options: [{ value: 'Lecture Notes', label: 'Lecture Notes' }, { value: 'Interactive Tutorial', label: 'Interactive Tutorial' }, { value: 'Case Study', label: 'Case Study' }, { value: 'Lab Guide', label: 'Lab Guide' }] },
    { name: 'audience', label: 'Audience', type: 'select', options: [{ value: 'High School', label: 'High School' }, { value: 'Undergraduate', label: 'Undergraduate' }, { value: 'Graduate', label: 'Graduate' }, { value: 'Professional', label: 'Professional' }] },
  ],
  quiz: [
    { name: 'topic', label: 'Topic *', type: 'input', placeholder: "e.g., Newton's Laws of Motion", required: true },
    { name: 'sourceText', label: 'Or paste source text', type: 'textarea', placeholder: 'Paste your lesson content here for tailored questions...', rows: 4 },
    { name: 'count', label: 'Number of Questions', type: 'select', options: [{ value: '3', label: '3 Questions' }, { value: '5', label: '5 Questions' }, { value: '10', label: '10 Questions' }, { value: '15', label: '15 Questions' }] },
    { name: 'difficulty', label: 'Difficulty', type: 'select', options: [{ value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'hard', label: 'Hard' }] },
  ],
  assignment: [
    { name: 'skill', label: 'Skill / Topic *', type: 'input', placeholder: 'e.g., Data analysis with Python', required: true },
    { name: 'course', label: 'Course (optional)', type: 'input', placeholder: 'e.g., Introduction to Computer Science' },
    { name: 'type', label: 'Assignment Type', type: 'select', options: [{ value: 'written', label: 'Written' }, { value: 'coding', label: 'Coding' }, { value: 'project', label: 'Project' }, { value: 'presentation', label: 'Presentation' }, { value: 'peer-review', label: 'Peer Review' }] },
  ],
  rubric: [
    { name: 'topic', label: 'Rubric Topic *', type: 'input', placeholder: 'e.g., Research Paper on Climate Change', required: true },
    { name: 'assignmentType', label: 'Assignment Type', type: 'select', options: [{ value: 'Essay', label: 'Essay' }, { value: 'Project', label: 'Project' }, { value: 'Presentation', label: 'Presentation' }, { value: 'Lab Report', label: 'Lab Report' }, { value: 'Portfolio', label: 'Portfolio' }] },
    { name: 'criteriaCount', label: 'Number of Criteria', type: 'select', options: [{ value: '3', label: '3 Criteria' }, { value: '4', label: '4 Criteria' }, { value: '5', label: '5 Criteria' }, { value: '6', label: '6 Criteria' }] },
    { name: 'gradingScale', label: 'Grading Scale', type: 'select', options: [{ value: '4-Point', label: '4-Point Scale' }, { value: '5-Point', label: '5-Point Scale' }, { value: 'Percentage', label: 'Percentage-Based' }] },
  ],
  'qa-responder': [
    { name: 'question', label: 'Student Question *', type: 'textarea', placeholder: 'e.g., What is the difference between speed and velocity?', rows: 3, required: true },
    { name: 'context', label: 'Course Context (optional)', type: 'textarea', placeholder: 'e.g., IB Physics Chapter 3 — Motion', rows: 2 },
  ],
  description: [
    { name: 'topic', label: 'Course Topic *', type: 'input', placeholder: 'e.g., Machine Learning for Beginners', required: true },
    { name: 'keywords', label: 'Keywords (comma-separated)', type: 'input', placeholder: 'e.g., Python, scikit-learn, neural networks' },
    { name: 'tone', label: 'Tone', type: 'select', options: [{ value: 'professional', label: 'Professional' }, { value: 'friendly', label: 'Friendly & Conversational' }, { value: 'academic', label: 'Academic' }, { value: 'inspiring', label: 'Inspiring & Motivational' }] },
  ],
  caption: [
    { name: 'content', label: 'Transcript / Text *', type: 'textarea', placeholder: 'Paste your video transcript or text content here...', rows: 6, required: true },
    { name: 'sourceType', label: 'Source Type', type: 'select', options: [{ value: 'video', label: 'Video Transcript' }, { value: 'text', label: 'Text Document' }] },
    { name: 'targetLanguage', label: 'Target Language', type: 'select', options: [{ value: 'en', label: 'English' }, { value: 'es', label: 'Spanish' }, { value: 'fr', label: 'French' }, { value: 'de', label: 'German' }, { value: 'ar', label: 'Arabic' }, { value: 'zh', label: 'Chinese' }, { value: 'ja', label: 'Japanese' }, { value: 'pt', label: 'Portuguese' }, { value: 'hi', label: 'Hindi' }, { value: 'ur', label: 'Urdu' }] },
  ],
  'feedback-analyzer': [
    { name: 'reviews', label: 'Student Reviews *', type: 'textarea', placeholder: 'Paste all your student reviews/feedback here...', rows: 8, required: true },
  ],
  insights: [
    { name: 'courseName', label: 'Course Name (optional)', type: 'input', placeholder: 'e.g., Introduction to Machine Learning' },
    { name: 'focus', label: 'Focus Area', type: 'select', options: [{ value: 'All Areas', label: 'All Areas' }, { value: 'Student Engagement', label: 'Student Engagement' }, { value: 'Content Quality', label: 'Content Quality' }, { value: 'Assessment Design', label: 'Assessment Design' }, { value: 'Accessibility', label: 'Accessibility' }] },
  ],
}

// ── API body builders ──
const TOOL_API: Record<ToolId, {
  endpoint: string
  bodyBuilder: (v: Record<string, string>, userId?: string) => Record<string, unknown>
  validate: (v: Record<string, string>) => string | null
}> = {
  curriculum: {
    endpoint: '/api/instructor/ai/generate-curriculum',
    bodyBuilder: v => ({ topic: v.topic?.trim(), audience: v.audience?.trim(), level: v.level, sections: parseInt(v.sections || '4') }),
    validate: v => v.topic?.trim() ? null : 'Please enter a course topic',
  },
  outcomes: {
    endpoint: '/api/instructor/ai/generate-outcomes',
    bodyBuilder: v => ({ topic: v.topic?.trim(), framework: v.framework, level: v.level, count: parseInt(v.count || '8') }),
    validate: v => v.topic?.trim() ? null : 'Please enter a course topic',
  },
  'lesson-content': {
    endpoint: '/api/instructor/ai/generate-lesson-content',
    bodyBuilder: v => ({ topic: v.topic?.trim(), outline: v.outline?.trim(), style: v.style, audience: v.audience }),
    validate: v => v.topic?.trim() ? null : 'Please enter a lesson topic',
  },
  quiz: {
    endpoint: '/api/instructor/ai/generate-quiz',
    bodyBuilder: v => ({ topic: v.topic?.trim() || 'Custom topic from text', count: parseInt(v.count || '5'), difficulty: v.difficulty, sourceText: v.sourceText?.trim() || undefined }),
    validate: v => (v.topic?.trim() || v.sourceText?.trim()) ? null : 'Please enter a topic or source text',
  },
  assignment: {
    endpoint: '/api/instructor/ai/generate-assignment',
    bodyBuilder: v => ({ skill: v.skill?.trim(), type: v.type || 'written', course: v.course?.trim() }),
    validate: v => v.skill?.trim() ? null : 'Please describe the skill or topic',
  },
  rubric: {
    endpoint: '/api/instructor/ai/generate-rubric',
    bodyBuilder: v => ({ topic: v.topic?.trim(), criteriaCount: parseInt(v.criteriaCount || '5'), gradingScale: v.gradingScale, assignmentType: v.assignmentType }),
    validate: v => v.topic?.trim() ? null : 'Please enter a rubric topic',
  },
  'qa-responder': {
    endpoint: '/api/instructor/ai/auto-respond',
    bodyBuilder: v => ({ question: v.question?.trim(), context: v.context?.trim() }),
    validate: v => v.question?.trim() ? null : 'Please enter a student question',
  },
  description: {
    endpoint: '/api/instructor/ai/generate-description',
    bodyBuilder: v => ({ topic: v.topic?.trim(), keywords: v.keywords?.trim(), tone: v.tone || 'professional' }),
    validate: v => v.topic?.trim() ? null : 'Please enter a course topic',
  },
  caption: {
    endpoint: '/api/instructor/ai/auto-caption',
    bodyBuilder: v => ({ content: v.content?.trim(), sourceType: v.sourceType, targetLanguage: v.targetLanguage }),
    validate: v => v.content?.trim() ? null : 'Please paste your transcript or text',
  },
  'feedback-analyzer': {
    endpoint: '/api/instructor/ai/analyze-feedback',
    bodyBuilder: v => ({ reviews: v.reviews?.trim() }),
    validate: v => v.reviews?.trim() ? null : 'Please paste student reviews',
  },
  insights: {
    endpoint: '/api/instructor/ai/course-insights',
    bodyBuilder: (v, userId) => ({ courseName: v.courseName?.trim(), focus: v.focus, instructorId: userId }),
    validate: () => null,
  },
}

// ── Animation variants ──
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({ opacity: 1, y: 0, scale: 1, transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }),
}

// ═══════════════════════════════════════════════════════════
// FORMATTED OUTPUT RENDERERS — No raw JSON, no raw markdown
// ═══════════════════════════════════════════════════════════

// ── 1. Curriculum Output: Module/lesson tree ──
function CurriculumOutput({ data }: { data: Record<string, unknown> }) {
  const modules = data.modules as Array<Record<string, unknown>> | undefined
  if (!modules || !Array.isArray(modules)) {
    return <FallbackTextOutput content={String(data.content || 'No curriculum generated')} />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="size-5 text-emerald-500" />
        <h3 className="text-lg font-bold">Generated Curriculum</h3>
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-lg text-xs">
          {modules.length} Modules
        </Badge>
      </div>
      {modules.map((mod, mi) => {
        const lessons = mod.lessons as Array<Record<string, unknown>> | undefined
        const objectives = mod.objectives as string[] | undefined
        return (
          <motion.div key={mi} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: mi * 0.08 }}>
            <Card className="rounded-xl border-l-4 border-l-emerald-500 overflow-hidden">
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0">
                    {mi + 1}
                  </div>
                  <CardTitle className="text-sm font-bold">{String(mod.title)}</CardTitle>
                </div>
                {mod.description && <p className="text-xs text-muted-foreground mt-1">{String(mod.description)}</p>}
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-0">
                {objectives && objectives.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1"><Target className="size-3" />Objectives</p>
                    <div className="flex flex-wrap gap-1">
                      {objectives.map((obj, oi) => (
                        <Badge key={oi} variant="outline" className="text-[10px] rounded-lg font-normal">{String(obj)}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {lessons && lessons.length > 0 && (
                  <div className="space-y-1.5">
                    {lessons.map((lesson, li) => {
                      const lessonType = String(lesson.type || 'video')
                      const typeColors: Record<string, string> = {
                        video: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400',
                        text: 'bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400',
                        quiz: 'bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400',
                        assignment: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
                        interactive: 'bg-teal-100 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400',
                        download: 'bg-slate-100 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400',
                      }
                      return (
                        <div key={li} className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <span className="text-[11px] text-muted-foreground font-medium w-5 shrink-0">{li + 1}.</span>
                          <span className="text-[12px] font-medium flex-1">{String(lesson.title)}</span>
                          <Badge className={cn('text-[9px] rounded-md px-1.5 py-0', typeColors[lessonType] || typeColors.text)}>
                            {lessonType}
                          </Badge>
                          {lesson.duration && <span className="text-[10px] text-muted-foreground">{String(lesson.duration)}m</span>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

// ── 2. Quiz Output: Beautiful question cards ──
function QuizOutput({ data }: { data: Record<string, unknown> }) {
  const questions = data.questions as Array<Record<string, unknown>> | undefined
  if (!questions || !Array.isArray(questions)) {
    return <FallbackTextOutput content={String(data.content || 'No quiz generated')} />
  }

  const meta = data.meta as Record<string, unknown> | undefined
  const typeColors: Record<string, string> = {
    mcq: 'bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400',
    true_false: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    fill_blank: 'bg-teal-100 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400',
    short_answer: 'bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400',
  }
  const typeLabels: Record<string, string> = { mcq: 'Multiple Choice', true_false: 'True / False', fill_blank: 'Fill in the Blank', short_answer: 'Short Answer' }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <HelpCircle className="size-5 text-violet-500" />
        <h3 className="text-lg font-bold">Generated Quiz</h3>
        <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400 rounded-lg text-xs">
          {questions.length} Questions
        </Badge>
        {meta?.difficulty && <Badge variant="outline" className="rounded-lg text-xs capitalize">{String(meta.difficulty)}</Badge>}
        {meta?.topic && <span className="text-xs text-muted-foreground">— {String(meta.topic)}</span>}
      </div>
      <div className="space-y-3">
        {questions.map((q, i) => {
          const options = q.options as string[] | undefined
          const qType = String(q.type || 'mcq')
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="rounded-xl overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60 text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={cn('text-[9px] rounded-md px-1.5 py-0', typeColors[qType] || typeColors.mcq)}>
                          {typeLabels[qType] || qType}
                        </Badge>
                        {q.points && <span className="text-[10px] text-muted-foreground">{String(q.points)} pts</span>}
                      </div>
                      <p className="text-[13px] font-medium leading-relaxed mb-3">{String(q.text)}</p>
                      {options && options.length > 0 && (
                        <div className="space-y-1.5 mb-3">
                          {options.map((opt, oi) => {
                            const isCorrect = opt === q.correctAnswer
                            return (
                              <div key={oi} className={cn(
                                'flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] transition-all',
                                isCorrect
                                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 font-medium'
                                  : 'bg-muted/30 border border-transparent'
                              )}>
                                <span className={cn(
                                  'flex size-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0',
                                  isCorrect ? 'bg-emerald-500 text-white' : 'bg-muted/60 text-muted-foreground'
                                )}>
                                  {String.fromCharCode(65 + oi)}
                                </span>
                                <span className={isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}>{String(opt)}</span>
                                {isCorrect && <CheckCircle2 className="size-3.5 text-emerald-500 ml-auto shrink-0" />}
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {q.explanation && (
                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50">
                          <Lightbulb className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">{String(q.explanation)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ── 3. Assignment Output: Structured brief + rubric table ──
function AssignmentOutput({ data }: { data: Record<string, unknown> }) {
  const assignment = data.assignment as Record<string, unknown> | undefined
  if (!assignment || typeof assignment !== 'object') {
    return <FallbackTextOutput content={String(data.content || 'No assignment generated')} />
  }

  const objectives = assignment.objectives as string[] | undefined
  const deliverables = assignment.deliverables as string[] | undefined
  const rubric = assignment.rubric as Array<Record<string, unknown>> | undefined

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <ClipboardList className="size-5 text-amber-500" />
        <h3 className="text-lg font-bold">{String(assignment.title || 'Generated Assignment')}</h3>
      </div>

      {objectives && objectives.length > 0 && (
        <Card className="rounded-xl">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5"><Target className="size-3.5 text-amber-500" />Learning Objectives</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-1.5">
              {objectives.map((obj, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-[12px]">{String(obj)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {assignment.instructions && (
        <Card className="rounded-xl">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5"><FileText className="size-3.5 text-sky-500" />Instructions</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-[12px] leading-relaxed whitespace-pre-line">{String(assignment.instructions)}</p>
          </CardContent>
        </Card>
      )}

      {deliverables && deliverables.length > 0 && (
        <Card className="rounded-xl">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5"><ListChecks className="size-3.5 text-violet-500" />Deliverables</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-1.5">
              {deliverables.map((d, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 text-[10px] font-bold shrink-0">{i + 1}</span>
                  <p className="text-[12px]">{String(d)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {assignment.wordLimit && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30">
          <Clock className="size-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground font-medium">Limit:</span>
          <span className="text-[12px] font-medium">{String(assignment.wordLimit)}</span>
        </div>
      )}

      {rubric && rubric.length > 0 && (
        <Card className="rounded-xl overflow-hidden">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5"><Star className="size-3.5 text-amber-500" />Grading Rubric</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-4">
              {rubric.map((criterion, ci) => {
                const levels = criterion.levels as Array<Record<string, string>> | undefined
                return (
                  <div key={ci} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 rounded-lg text-[10px]">{String(criterion.criterion)}</Badge>
                      {criterion.description && <span className="text-[10px] text-muted-foreground">{String(criterion.description)}</span>}
                    </div>
                    {levels && levels.length > 0 && (
                      <div className="grid grid-cols-2 gap-1.5">
                        {levels.map((level, li) => {
                          const levelColors: Record<string, string> = {
                            'Excellent': 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50',
                            'Good': 'bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800/50',
                            'Satisfactory': 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50',
                            'Needs Improvement': 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50',
                          }
                          return (
                            <div key={li} className={cn('p-2 rounded-lg border text-[11px]', levelColors[level.label] || 'bg-muted/30 border-border/40')}>
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="font-semibold">{String(level.label)}</span>
                                <Badge variant="outline" className="text-[9px] rounded-md px-1 py-0">{String(level.range)}</Badge>
                              </div>
                              <p className="text-muted-foreground leading-snug">{String(level.description)}</p>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── 4. Q&A Output: Chat-style card ──
function QAResponderOutput({ data }: { data: Record<string, unknown> }) {
  const answer = data.answer as Record<string, unknown> | undefined
  const rawContent = String(data.content || '')

  if (!answer || typeof answer !== 'object') {
    return <FallbackTextOutput content={rawContent || 'No answer generated'} />
  }

  const keyPoints = answer.keyPoints as string[] | undefined
  const relatedTopics = answer.relatedTopics as string[] | undefined
  const confidence = String(answer.confidence || 'medium')

  const confidenceColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    high: { bg: 'bg-emerald-100 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', icon: <CheckCircle2 className="size-3" /> },
    medium: { bg: 'bg-amber-100 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', icon: <Minus className="size-3" /> },
    low: { bg: 'bg-rose-100 dark:bg-rose-950/30', text: 'text-rose-700 dark:text-rose-400', icon: <AlertTriangle className="size-3" /> },
  }
  const confStyle = confidenceColors[confidence] || confidenceColors.medium

  return (
    <div className="space-y-4">
      <Card className="rounded-xl border-l-4 border-l-teal-500">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-4 text-teal-500" />
            <CardTitle className="text-xs font-semibold">AI-Drafted Answer</CardTitle>
            <Badge className={cn('rounded-md text-[9px] px-1.5 py-0', confStyle.bg, confStyle.text)}>
              <span className="flex items-center gap-1">{confStyle.icon} {confidence} confidence</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-[13px] leading-relaxed whitespace-pre-line">{String(answer.answer || rawContent)}</p>
        </CardContent>
      </Card>

      {keyPoints && keyPoints.length > 0 && (
        <Card className="rounded-xl">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5"><Zap className="size-3.5 text-amber-500" />Key Points</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-1.5">
              {keyPoints.map((pt, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[12px]">{String(pt)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {relatedTopics && relatedTopics.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Lightbulb className="size-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground font-medium">Related:</span>
          {relatedTopics.map((t, i) => (
            <Badge key={i} variant="outline" className="text-[10px] rounded-lg">{String(t)}</Badge>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 5. Description Output: Marketing page layout ──
function DescriptionOutput({ data }: { data: Record<string, unknown> }) {
  const desc = data.description as Record<string, unknown> | undefined
  if (!desc || typeof desc !== 'object') {
    return <FallbackTextOutput content={String(data.content || 'No description generated')} />
  }

  const outcomes = desc.learningOutcomes as string[] | undefined
  const keywords = desc.keywords as string[] | undefined

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-xl font-bold leading-tight">{String(desc.seoTitle || 'Generated Course Title')}</h3>
        {desc.subtitle && <p className="text-sm text-muted-foreground italic">{String(desc.subtitle)}</p>}
      </div>

      {desc.description && (
        <Card className="rounded-xl">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5"><PenLine className="size-3.5 text-rose-500" />Course Description</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-[13px] leading-relaxed whitespace-pre-line">{String(desc.description)}</p>
          </CardContent>
        </Card>
      )}

      {outcomes && outcomes.length > 0 && (
        <Card className="rounded-xl border-l-4 border-l-rose-500">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5"><Target className="size-3.5 text-rose-500" />What You'll Learn</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {outcomes.map((outcome, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="size-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-[12px]">{String(outcome)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {keywords && keywords.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Zap className="size-3.5 text-amber-500" />
          <span className="text-[11px] text-muted-foreground font-medium">SEO Keywords:</span>
          {keywords.map((kw, i) => (
            <Badge key={i} className="bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 rounded-lg text-[10px]">{String(kw)}</Badge>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 6. Feedback Analyzer Output: Dashboard-style ──
function FeedbackAnalyzerOutput({ data }: { data: Record<string, unknown> }) {
  const analysis = data.analysis as Record<string, unknown> | undefined
  if (!analysis || typeof analysis !== 'object') {
    return <FallbackTextOutput content={String(data.content || 'No analysis generated')} />
  }

  const topPraise = analysis.topPraise as string[] | undefined
  const topIssues = analysis.topIssues as string[] | undefined
  const sentiment = analysis.sentiment as { positive: number; neutral: number; negative: number; summary: string } | undefined
  const tips = analysis.improvementTips as Array<Record<string, string>> | undefined

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="size-5 text-slate-500" />
        <h3 className="text-lg font-bold">Feedback Analysis</h3>
      </div>

      {sentiment && (
        <Card className="rounded-xl">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5"><TrendingUp className="size-3.5 text-slate-500" />Sentiment Overview</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-3">
            <div className="flex gap-3 items-center">
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="size-3.5 text-emerald-500" />
                  <span className="text-[11px] font-medium w-16">Positive</span>
                  <div className="flex-1"><Progress value={sentiment.positive} className="h-2" /></div>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 w-10 text-right">{sentiment.positive}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Minus className="size-3.5 text-amber-500" />
                  <span className="text-[11px] font-medium w-16">Neutral</span>
                  <div className="flex-1"><Progress value={sentiment.neutral} className="h-2" /></div>
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 w-10 text-right">{sentiment.neutral}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <ThumbsDown className="size-3.5 text-rose-500" />
                  <span className="text-[11px] font-medium w-16">Negative</span>
                  <div className="flex-1"><Progress value={sentiment.negative} className="h-2" /></div>
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 w-10 text-right">{sentiment.negative}%</span>
                </div>
              </div>
            </div>
            {sentiment.summary && <p className="text-[11px] text-muted-foreground italic">{String(sentiment.summary)}</p>}
          </CardContent>
        </Card>
      )}

      {topPraise && topPraise.length > 0 && (
        <Card className="rounded-xl border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5"><ThumbsUp className="size-3.5 text-emerald-500" />Top Praise</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-1.5">
              {topPraise.map((p, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-[12px]">{String(p)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {topIssues && topIssues.length > 0 && (
        <Card className="rounded-xl border-l-4 border-l-rose-500">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5"><ThumbsDown className="size-3.5 text-rose-500" />Top Issues</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-1.5">
              {topIssues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="size-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-[12px]">{String(issue)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {tips && tips.length > 0 && (
        <Card className="rounded-xl border-l-4 border-l-amber-500">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5"><Lightbulb className="size-3.5 text-amber-500" />Improvement Tips</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-3">
              {tips.map((tip, i) => {
                const priorityColors: Record<string, string> = {
                  high: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400',
                  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
                  low: 'bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400',
                }
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold">{String(tip.tip)}</span>
                      <Badge className={cn('text-[9px] rounded-md px-1.5 py-0', priorityColors[tip.priority] || priorityColors.medium)}>{tip.priority}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{String(tip.description)}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── 7. Learning Outcomes Output: Beautiful outcome cards ──
function OutcomesOutput({ data }: { data: Record<string, unknown> }) {
  const outcomes = data.outcomes as Array<Record<string, unknown>> | undefined
  const summary = data.summary as string | undefined
  const alignment = data.alignment as string | undefined

  if (!outcomes || !Array.isArray(outcomes)) {
    return <FallbackTextOutput content={String(data.content || 'No outcomes generated')} />
  }

  const bloomColors: Record<string, { bg: string; text: string }> = {
    Remember: { bg: 'bg-sky-100 dark:bg-sky-950/30', text: 'text-sky-700 dark:text-sky-400' },
    Understand: { bg: 'bg-emerald-100 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
    Apply: { bg: 'bg-amber-100 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' },
    Analyze: { bg: 'bg-violet-100 dark:bg-violet-950/30', text: 'text-violet-700 dark:text-violet-400' },
    Evaluate: { bg: 'bg-rose-100 dark:bg-rose-950/30', text: 'text-rose-700 dark:text-rose-400' },
    Create: { bg: 'bg-fuchsia-100 dark:bg-fuchsia-950/30', text: 'text-fuchsia-700 dark:text-fuchsia-400' },
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Target className="size-5 text-cyan-500" />
        <h3 className="text-lg font-bold">Learning Outcomes</h3>
        <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400 rounded-lg text-xs">
          {outcomes.length} Outcomes
        </Badge>
      </div>

      {alignment && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800/50">
          <Layers className="size-3.5 text-cyan-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-cyan-700 dark:text-cyan-400 leading-relaxed">{String(alignment)}</p>
        </div>
      )}

      <div className="space-y-3">
        {outcomes.map((outcome, i) => {
          const bloomLevel = String(outcome.bloomLevel || 'Understand')
          const bloomStyle = bloomColors[bloomLevel] || bloomColors.Understand
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="rounded-xl overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-muted/60 text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={cn('text-[9px] rounded-md px-1.5 py-0', bloomStyle.bg, bloomStyle.text)}>
                          {bloomLevel}
                        </Badge>
                        {outcome.domain && <Badge variant="outline" className="text-[9px] rounded-md px-1.5 py-0">{String(outcome.domain)}</Badge>}
                        {outcome.actionVerb && (
                          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 text-[9px] rounded-md px-1.5 py-0">
                            {String(outcome.actionVerb)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[13px] font-medium leading-relaxed">{String(outcome.statement)}</p>
                      {outcome.assessmentMethod && (
                        <div className="flex items-start gap-2 p-2 rounded-lg bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/50">
                          <GraduationCap className="size-3.5 text-sky-500 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-sky-700 dark:text-sky-400 leading-relaxed">{String(outcome.assessmentMethod)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {summary && (
        <Card className="rounded-xl border-l-4 border-l-cyan-500">
          <CardContent className="p-4">
            <p className="text-[12px] text-muted-foreground leading-relaxed">{String(summary)}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── 8. Lesson Content Output: Structured lesson ──
function LessonContentOutput({ data }: { data: Record<string, unknown> }) {
  const lesson = data.lesson as Record<string, unknown> | undefined
  if (!lesson || typeof lesson !== 'object') {
    return <FallbackTextOutput content={String(data.content || 'No lesson content generated')} />
  }

  const keyConcepts = lesson.keyConcepts as Array<Record<string, string>> | undefined
  const examples = lesson.examples as Array<Record<string, string>> | undefined
  const exercises = lesson.exercises as Array<Record<string, string>> | undefined
  const furtherReading = lesson.furtherReading as string[] | undefined

  const diffColors: Record<string, string> = {
    easy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    hard: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="size-5 text-sky-500" />
        <h3 className="text-lg font-bold">{String(lesson.title || 'Generated Lesson')}</h3>
      </div>

      {lesson.introduction && (
        <Card className="rounded-xl border-l-4 border-l-sky-500">
          <CardContent className="p-4">
            <p className="text-[13px] leading-relaxed">{String(lesson.introduction)}</p>
          </CardContent>
        </Card>
      )}

      {keyConcepts && keyConcepts.length > 0 && (
        <Card className="rounded-xl">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5"><Lightbulb className="size-3.5 text-sky-500" />Key Concepts</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-3">
            {keyConcepts.map((concept, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-sky-100 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 text-[10px] font-bold shrink-0">{i + 1}</span>
                  <span className="text-[12px] font-bold">{String(concept.name)}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed ml-7">{String(concept.explanation)}</p>
                {concept.analogy && (
                  <div className="flex items-start gap-2 ml-7 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50">
                    <Lightbulb className="size-3 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed italic">{String(concept.analogy)}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {examples && examples.length > 0 && (
        <Card className="rounded-xl">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5"><BookOpen className="size-3.5 text-violet-500" />Examples</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-3">
            {examples.map((ex, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/30 space-y-1">
                <p className="text-[12px] font-semibold">{String(ex.title)}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{String(ex.content)}</p>
                {ex.takeaway && (
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="size-3 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">{String(ex.takeaway)}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {exercises && exercises.length > 0 && (
        <Card className="rounded-xl">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5"><Zap className="size-3.5 text-amber-500" />Exercises</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-3">
            {exercises.map((ex, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold">{String(ex.title)}</span>
                  {ex.difficulty && <Badge className={cn('text-[9px] rounded-md px-1.5 py-0', diffColors[ex.difficulty] || diffColors.medium)}>{ex.difficulty}</Badge>}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{String(ex.instructions)}</p>
                {ex.hint && (
                  <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50">
                    <Lightbulb className="size-3 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 italic">{String(ex.hint)}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {lesson.summary && (
        <Card className="rounded-xl border-l-4 border-l-sky-500">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5"><FileText className="size-3.5 text-sky-500" />Summary</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-[12px] leading-relaxed">{String(lesson.summary)}</p>
          </CardContent>
        </Card>
      )}

      {furtherReading && furtherReading.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <BookOpen className="size-3.5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground font-medium">Further Reading:</span>
          {furtherReading.map((r, i) => (
            <Badge key={i} variant="outline" className="text-[10px] rounded-lg">{String(r)}</Badge>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 9. Standalone Rubric Output: Professional rubric table ──
function RubricOutput({ data }: { data: Record<string, unknown> }) {
  const rubric = data.rubric as Record<string, unknown> | undefined
  if (!rubric || typeof rubric !== 'object') {
    return <FallbackTextOutput content={String(data.content || 'No rubric generated')} />
  }

  const criteria = rubric.criteria as Array<Record<string, unknown>> | undefined
  const totalPoints = rubric.totalPoints as number | undefined
  const gradingNotes = rubric.gradingNotes as string | undefined

  if (!criteria || !Array.isArray(criteria)) {
    return <FallbackTextOutput content={String(data.content || 'No rubric generated')} />
  }

  const levelColors: Record<string, string> = {
    Excellent: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50',
    Good: 'bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800/50',
    Satisfactory: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50',
    'Needs Improvement': 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50',
  }

  const severityColors: Record<string, string> = {
    high: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    low: 'bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <Award className="size-5 text-orange-500" />
        <h3 className="text-lg font-bold">{String(rubric.title || 'Generated Rubric')}</h3>
        {totalPoints && (
          <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 rounded-lg text-xs">
            {totalPoints} Points
          </Badge>
        )}
      </div>

      {rubric.description && (
        <p className="text-[12px] text-muted-foreground">{String(rubric.description)}</p>
      )}

      <div className="space-y-4">
        {criteria.map((criterion, ci) => {
          const levels = criterion.levels as Array<Record<string, unknown>> | undefined
          const indicators = criterion.indicators as string[] | undefined
          return (
            <motion.div key={ci} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.06 }}>
              <Card className="rounded-xl overflow-hidden">
                <CardHeader className="pb-2 pt-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-[10px] font-bold shrink-0">{ci + 1}</span>
                      <CardTitle className="text-[13px] font-bold">{String(criterion.name)}</CardTitle>
                    </div>
                    <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 text-[10px] rounded-md">
                      {String(criterion.weight)}%
                    </Badge>
                  </div>
                  {criterion.description && <p className="text-[11px] text-muted-foreground mt-1">{String(criterion.description)}</p>}
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  {levels && levels.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {levels.map((level, li) => {
                        const levelIndicators = level.indicators as string[] | undefined
                        return (
                          <div key={li} className={cn('p-2.5 rounded-lg border text-[11px] space-y-1', levelColors[String(level.label)] || 'bg-muted/30 border-border/40')}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-[12px]">{String(level.label)}</span>
                              <Badge variant="outline" className="text-[9px] rounded-md px-1 py-0">{String(level.score)} pts</Badge>
                            </div>
                            <p className="text-muted-foreground leading-snug">{String(level.description)}</p>
                            {levelIndicators && levelIndicators.length > 0 && (
                              <div className="space-y-0.5 mt-1">
                                {levelIndicators.map((ind, ii) => (
                                  <div key={ii} className="flex items-start gap-1">
                                    <CheckCircle2 className="size-2.5 text-emerald-500 shrink-0 mt-0.5" />
                                    <span className="text-[10px] text-muted-foreground">{String(ind)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {gradingNotes && (
        <Card className="rounded-xl border-l-4 border-l-orange-500">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5"><Info className="size-3.5 text-orange-500" />Grading Notes</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-[12px] leading-relaxed">{String(gradingNotes)}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── 10. Auto Caption & Translate Output ──
function CaptionOutput({ data }: { data: Record<string, unknown> }) {
  const captions = data.captions as string | undefined
  if (!captions) {
    return <FallbackTextOutput content={String(data.content || 'No captions generated')} />
  }

  // Parse timestamped captions
  const lines = captions.split('\n').filter(l => l.trim())
  const timestampRegex = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(.+)/

  const parsedLines = lines.map(line => {
    const match = line.match(timestampRegex)
    if (match) {
      return { timestamp: match[1], text: match[2] }
    }
    return { timestamp: null, text: line }
  })

  const hasTimestamps = parsedLines.some(l => l.timestamp)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Languages className="size-5 text-lime-600" />
        <h3 className="text-lg font-bold">Generated Captions</h3>
        <Badge className="bg-lime-100 text-lime-700 dark:bg-lime-950/30 dark:text-lime-400 rounded-lg text-xs">
          {parsedLines.length} Lines
        </Badge>
        {hasTimestamps && (
          <Badge variant="outline" className="rounded-lg text-xs">Timestamped</Badge>
        )}
      </div>

      <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
        {parsedLines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.02 }}
            className="flex items-start gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors"
          >
            {line.timestamp ? (
              <Badge className="bg-lime-100 text-lime-700 dark:bg-lime-950/30 dark:text-lime-400 text-[10px] rounded-md px-1.5 py-0 font-mono shrink-0">
                {line.timestamp}
              </Badge>
            ) : (
              <span className="w-10 shrink-0" />
            )}
            <p className="text-[12px] leading-relaxed">{line.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ── 11. Course Improvement Insights Output ──
function InsightsOutput({ data }: { data: Record<string, unknown> }) {
  const insights = data.insights as Array<Record<string, string>> | undefined
  const overallScore = data.overallScore as number | undefined
  const overallRecommendation = data.overallRecommendation as string | undefined
  const quickWins = data.quickWins as string[] | undefined
  const longTermGoals = data.longTermGoals as string[] | undefined

  if (!insights || !Array.isArray(insights)) {
    return <FallbackTextOutput content={String(data.content || 'No insights generated')} />
  }

  const severityConfig: Record<string, { bg: string; text: string; icon: React.ReactNode; border: string }> = {
    high: { bg: 'bg-rose-100 dark:bg-rose-950/30', text: 'text-rose-700 dark:text-rose-400', icon: <AlertTriangle className="size-3" />, border: 'border-l-rose-500' },
    medium: { bg: 'bg-amber-100 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', icon: <Minus className="size-3" />, border: 'border-l-amber-500' },
    low: { bg: 'bg-sky-100 dark:bg-sky-950/30', text: 'text-sky-700 dark:text-sky-400', icon: <CheckCircle2 className="size-3" />, border: 'border-l-sky-500' },
  }

  const categoryIcons: Record<string, React.ReactNode> = {
    content: <BookOpen className="size-3.5" />,
    engagement: <Zap className="size-3.5" />,
    assessment: <HelpCircle className="size-3.5" />,
    structure: <Layers className="size-3.5" />,
    accessibility: <Info className="size-3.5" />,
  }

  const effortColors: Record<string, string> = {
    low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
    medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    high: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="size-5 text-fuchsia-500" />
        <h3 className="text-lg font-bold">Course Improvement Insights</h3>
      </div>

      {overallScore != null && (
        <Card className="rounded-xl">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="relative">
              <svg className="size-16 -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted/20" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray={`${overallScore}, 100`} className="text-fuchsia-500" strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{overallScore}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Overall Course Health</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{overallRecommendation || 'Analysis complete'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {insights.map((insight, i) => {
          const severity = String(insight.severity || 'medium')
          const sev = severityConfig[severity] || severityConfig.medium
          const category = String(insight.category || 'content')
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={cn('rounded-xl border-l-4', sev.border)}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12px] font-bold flex-1">{String(insight.title)}</span>
                    <Badge className={cn('text-[9px] rounded-md px-1.5 py-0', sev.bg, sev.text)}>
                      <span className="flex items-center gap-1">{sev.icon} {severity}</span>
                    </Badge>
                    <Badge variant="outline" className="text-[9px] rounded-md px-1.5 py-0 flex items-center gap-1">
                      {categoryIcons[category] || categoryIcons.content} {category}
                    </Badge>
                    {insight.effort && (
                      <Badge className={cn('text-[9px] rounded-md px-1.5 py-0', effortColors[insight.effort] || effortColors.medium)}>
                        effort: {insight.effort}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{String(insight.description)}</p>
                  {insight.action && (
                    <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
                      <ArrowUpRight className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">Action Step</p>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">{String(insight.action)}</p>
                      </div>
                    </div>
                  )}
                  {insight.impact && (
                    <p className="text-[10px] text-muted-foreground italic">Expected impact: {String(insight.impact)}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {quickWins && quickWins.length > 0 && (
        <Card className="rounded-xl border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5"><Flame className="size-3.5 text-emerald-500" />Quick Wins</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-1.5">
              {quickWins.map((win, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-[12px]">{String(win)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {longTermGoals && longTermGoals.length > 0 && (
        <Card className="rounded-xl border-l-4 border-l-fuchsia-500">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs font-semibold flex items-center gap-1.5"><Gauge className="size-3.5 text-fuchsia-500" />Long-Term Goals</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-1.5">
              {longTermGoals.map((goal, i) => (
                <div key={i} className="flex items-start gap-2">
                  <ArrowUpRight className="size-3.5 text-fuchsia-500 shrink-0 mt-0.5" />
                  <p className="text-[12px]">{String(goal)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Fallback: Smart text renderer for unstructured output ──
function FallbackTextOutput({ content }: { content: string }) {
  if (!content) return null
  const sections = content.split(/\n(?=(?:#{1,3}\s|\*\*[^*]+\*\*\n))/)
  return (
    <div className="space-y-3">
      {sections.map((section, i) => {
        const lines = section.trim().split('\n')
        if (!lines[0]?.trim()) return null
        const firstLine = lines[0].trim()
        if (firstLine.startsWith('### ')) return <h3 key={i} className="text-sm font-bold mt-3">{firstLine.slice(4)}</h3>
        if (firstLine.startsWith('## ')) return <h2 key={i} className="text-base font-bold mt-4">{firstLine.slice(3)}</h2>
        if (firstLine.startsWith('# ')) return <h1 key={i} className="text-lg font-bold mt-5">{firstLine.slice(2)}</h1>
        if (firstLine.startsWith('**') && firstLine.endsWith('**')) return <h3 key={i} className="text-sm font-bold mt-3">{firstLine.slice(2, -2)}</h3>
        return (
          <div key={i} className="space-y-1">
            {lines.map((line, li) => {
              const t = line.trim(); if (!t) return <div key={li} className="h-1" />
              if (t.startsWith('- ') || t.startsWith('• ')) return <li key={li} className="ml-4 text-[12px]">{t.slice(2)}</li>
              if (/^\d+\.\s/.test(t)) return <li key={li} className="ml-4 text-[12px] list-decimal">{t.replace(/^\d+\.\s/, '')}</li>
              return <p key={li} className="text-[12px] leading-relaxed">{t}</p>
            })}
          </div>
        )
      })}
    </div>
  )
}

// ── Output Router: Picks the right renderer ──
function FormattedOutput({ toolId, data }: { toolId: ToolId; data: Record<string, unknown> }) {
  switch (toolId) {
    case 'curriculum': return <CurriculumOutput data={data} />
    case 'outcomes': return <OutcomesOutput data={data} />
    case 'lesson-content': return <LessonContentOutput data={data} />
    case 'quiz': return <QuizOutput data={data} />
    case 'assignment': return <AssignmentOutput data={data} />
    case 'rubric': return <RubricOutput data={data} />
    case 'qa-responder': return <QAResponderOutput data={data} />
    case 'description': return <DescriptionOutput data={data} />
    case 'caption': return <CaptionOutput data={data} />
    case 'feedback-analyzer': return <FeedbackAnalyzerOutput data={data} />
    case 'insights': return <InsightsOutput data={data} />
    default: return <FallbackTextOutput content={String(data.content || 'No result')} />
  }
}

// ═══════════════════════════════════════════════════════════
// LOADING STATE
// ═══════════════════════════════════════════════════════════
function GeneratingState({ tool }: { tool: ToolConfig }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative">
        <motion.div
          className="size-16 rounded-2xl flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` }}
        >
          <Loader2 className="size-8 animate-spin text-white" />
        </motion.div>
        <motion.div
          className="absolute -top-2 -right-2"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <Sparkles className="size-5 text-amber-500" />
        </motion.div>
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-foreground">Generating {tool.title.split(' ')[0]}...</p>
        <p className="text-xs text-muted-foreground mt-1">AI is crafting your content. This may take a moment.</p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// HUB PAGE — Grid of tool cards
// ═══════════════════════════════════════════════════════════
function HubPage({ onSelectTool }: { onSelectTool: (id: ToolId) => void }) {
  const { currentUser } = useAppStore()
  const [stats, setStats] = useState<{ total: number; thisMonth: number } | null>(null)

  useEffect(() => {
    if (!currentUser?.id) return
    fetch(`/api/instructor/ai/usage-stats?instructorId=${currentUser.id}`)
      .then(r => r.json())
      .then(d => setStats({ total: d.totalGenerations || 0, thisMonth: d.thisMonth || 0 }))
      .catch(() => {})
  }, [currentUser?.id])

  // Categorize tools
  const categories = [
    { label: 'Course Design', ids: ['curriculum', 'outcomes', 'lesson-content', 'description'] as ToolId[] },
    { label: 'Assessment', ids: ['quiz', 'assignment', 'rubric'] as ToolId[] },
    { label: 'Communication', ids: ['qa-responder', 'caption'] as ToolId[] },
    { label: 'Analytics', ids: ['feedback-analyzer', 'insights'] as ToolId[] },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="size-5 text-emerald-500" />
            AI Copilot
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Your AI-powered teaching assistant. Generate, review, edit, then publish.</p>
        </div>
        {stats && (
          <div className="flex gap-3">
            <Card className="rounded-xl px-3 py-2">
              <div className="flex items-center gap-2">
                <Wand2 className="size-3.5 text-emerald-500" />
                <div>
                  <p className="text-[10px] text-muted-foreground">Total Generations</p>
                  <p className="text-sm font-bold">{stats.total}</p>
                </div>
              </div>
            </Card>
            <Card className="rounded-xl px-3 py-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-3.5 text-amber-500" />
                <div>
                  <p className="text-[10px] text-muted-foreground">This Month</p>
                  <p className="text-sm font-bold">{stats.thisMonth}</p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Categorized Tool Grid */}
      {categories.map((cat) => {
        const catTools = TOOLS.filter(t => cat.ids.includes(t.id))
        return (
          <div key={cat.label}>
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground">{cat.label}</h3>
              <Separator className="flex-1" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {catTools.map((tool, i) => {
                const globalIndex = TOOLS.indexOf(tool)
                return (
                  <motion.button
                    key={tool.id}
                    custom={globalIndex}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectTool(tool.id)}
                    className="group text-left rounded-2xl border border-border/30 bg-card p-4 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                  >
                    <div className={cn('absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300', tool.gradient)} />
                    <div className="relative space-y-2.5">
                      <div className="flex items-start justify-between">
                        <div className={cn('flex size-9 items-center justify-center rounded-xl', tool.iconBg)}>
                          {tool.icon}
                        </div>
                        {tool.badge && (
                          <Badge className={cn('rounded-lg text-[9px] font-semibold bg-gradient-to-r text-white', tool.gradient)}>
                            {tool.badge}
                          </Badge>
                        )}
                      </div>
                      <div>
                        <h3 className="text-[13px] font-bold">{tool.title}</h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{tool.subtitle}</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground/80 leading-relaxed line-clamp-2">{tool.description}</p>
                      <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 group-hover:gap-2 transition-all">
                        Open Tool <ChevronRight className="size-3" />
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Workflow reminder */}
      <Card className="rounded-xl bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200/50 dark:border-emerald-800/30">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="size-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Generate → Review → Edit → Publish</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">AI content is never auto-published. Always review and edit before sharing with students.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// TOOL PAGE — Dedicated sub-page for each tool
// ═══════════════════════════════════════════════════════════
function ToolPage({
  toolId, onBack
}: {
  toolId: ToolId; onBack: () => void
}) {
  const { currentUser } = useAppStore()
  const tool = TOOLS.find(t => t.id === toolId)!
  const formFields = TOOL_FORM_FIELDS[toolId]
  const apiConfig = TOOL_API[toolId]

  // Form state
  const defaults = Object.fromEntries(formFields.map(f => [f.name, f.options?.[0]?.value || '']))
  const [formVals, setFormVals] = useState<Record<string, string>>(defaults)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [saved, setSaved] = useState(false)
  const [favorited, setFavorited] = useState(false)

  const set = (k: string, v: string) => setFormVals(prev => ({ ...prev, [k]: v }))
  const hasResult = !!result

  const handleGenerate = async () => {
    const err = apiConfig.validate(formVals)
    if (err) { toast.error(err); return }
    setLoading(true)
    setResult(null)
    setSaved(false)
    setFavorited(false)
    try {
      const res = await fetch(apiConfig.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiConfig.bodyBuilder(formVals, currentUser?.id)),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setResult(data)
      toast.success(`${tool.title.split(' ')[0]} generated!`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormVals(defaults)
    setResult(null)
    setSaved(false)
    setFavorited(false)
  }

  const handleCopy = async () => {
    if (!result) return
    const textToCopy = result.content ? String(result.content) : JSON.stringify(result, null, 2)
    await navigator.clipboard.writeText(textToCopy)
    toast.success('Copied to clipboard!')
  }

  const handleSave = async () => {
    if (!currentUser?.id || !result) return
    try {
      const titleField = formFields.find(f => f.required)?.name || 'topic'
      const title = formVals[titleField] || `${tool.title} - ${new Date().toLocaleDateString()}`
      const res = await fetch('/api/instructor/ai/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId: currentUser.id,
          toolType: toolId,
          title,
          inputParams: formVals,
          resultContent: result.content ? String(result.content) : JSON.stringify(result),
        }),
      })
      if (!res.ok) throw new Error()
      setSaved(true)
      toast.success('Saved to My Generations!')
    } catch {
      toast.error('Failed to save')
    }
  }

  const handleToggleFav = async () => {
    setFavorited(p => !p)
    toast.success(favorited ? 'Removed from favorites' : 'Added to favorites')
  }

  // Group "Other Tools" by category
  const otherToolsCategories = [
    { label: 'Course Design', ids: ['curriculum', 'outcomes', 'lesson-content', 'description'] as ToolId[] },
    { label: 'Assessment', ids: ['quiz', 'assignment', 'rubric'] as ToolId[] },
    { label: 'Communication', ids: ['qa-responder', 'caption'] as ToolId[] },
    { label: 'Analytics', ids: ['feedback-analyzer', 'insights'] as ToolId[] },
  ]

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0 rounded-lg">
          <ArrowLeft className="size-4" />
        </Button>
        <div className={cn('flex size-9 items-center justify-center rounded-xl', tool.iconBg)}>
          {tool.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold">{tool.title}</h2>
          <p className="text-xs text-muted-foreground">{tool.subtitle}</p>
        </div>
      </div>

      {/* Main content: 2-column layout on desktop */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left: Form */}
        <div className="lg:w-[340px] shrink-0 space-y-4">
          <Card className="rounded-xl">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                <Wand2 className="size-3.5" />
                Configure & Generate
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {formFields.map(f => (
                <div key={f.name} className="space-y-1.5">
                  <Label className="text-xs">{f.label}</Label>
                  {f.type === 'input' && (
                    <Input placeholder={f.placeholder} value={formVals[f.name] || ''} onChange={e => set(f.name, e.target.value)} className="rounded-xl text-sm" />
                  )}
                  {f.type === 'textarea' && (
                    <Textarea placeholder={f.placeholder} value={formVals[f.name] || ''} onChange={e => set(f.name, e.target.value)} rows={f.rows || 4} className="rounded-xl text-sm" />
                  )}
                  {f.type === 'select' && (
                    <Select value={formVals[f.name] || f.options?.[0]?.value} onValueChange={v => set(f.name, v)}>
                      <SelectTrigger className="rounded-xl text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{f.options?.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <Button
                  onClick={handleGenerate}
                  disabled={loading || !!apiConfig.validate(formVals)}
                  className={cn('rounded-xl gap-2 bg-gradient-to-r text-white flex-1', tool.gradient)}
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
                  {loading ? 'Generating...' : 'Generate'}
                </Button>
                {hasResult && (
                  <Button variant="outline" size="icon" onClick={handleReset} className="rounded-xl h-9 w-9">
                    <RotateCcw className="size-3.5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="rounded-xl">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                <Lightbulb className="size-3.5 text-amber-500" />
                Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="space-y-2">
                {tool.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="flex size-4 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[9px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Other Tools Quick Access — categorized */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Other Tools</p>
            {otherToolsCategories.map(cat => {
              const otherInCat = TOOLS.filter(t => cat.ids.includes(t.id) && t.id !== toolId)
              if (otherInCat.length === 0) return null
              return (
                <div key={cat.label}>
                  <p className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider px-3 py-1">{cat.label}</p>
                  {otherInCat.map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setFormVals(Object.fromEntries(TOOL_FORM_FIELDS[t.id].map(f => [f.name, f.options?.[0]?.value || ''])))
                        setResult(null)
                        setSaved(false)
                        setFavorited(false)
                        useAppStore.getState().setSelectedAIToolId(t.id)
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className={cn('flex size-6 items-center justify-center rounded-lg', t.iconBg)}>
                        {t.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium truncate">{t.title}</p>
                      </div>
                      <ChevronRight className="size-3 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Output */}
        <div className="flex-1 min-w-0">
          {loading && <GeneratingState tool={tool} />}

          {!loading && !hasResult && (
            <Card className="rounded-xl">
              <CardContent className="py-16 flex flex-col items-center justify-center gap-4">
                <div className={cn('flex size-16 items-center justify-center rounded-2xl', tool.iconBg)}>
                  {tool.icon}
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-muted-foreground">No output yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Fill in the form and click Generate to create content</p>
                </div>
              </CardContent>
            </Card>
          )}

          {!loading && hasResult && result && (
            <div className="space-y-3">
              {/* Action bar */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={handleCopy} className="rounded-lg gap-1.5 text-xs h-7">
                  <Copy className="size-3" />Copy
                </Button>
                <Button variant="outline" size="sm" onClick={handleSave} disabled={saved} className="rounded-lg gap-1.5 text-xs h-7">
                  {saved ? <Check className="size-3" /> : <Save className="size-3" />}
                  {saved ? 'Saved' : 'Save'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleToggleFav} className="rounded-lg gap-1.5 text-xs h-7">
                  {favorited ? <Star className="size-3 fill-amber-400 text-amber-400" /> : <Star className="size-3" />}
                  {favorited ? 'Favorited' : 'Favorite'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleGenerate} className="rounded-lg gap-1.5 text-xs h-7 ml-auto">
                  <RotateCcw className="size-3" />Regenerate
                </Button>
              </div>

              {/* Formatted output */}
              <Card className="rounded-xl">
                <CardContent className="p-5">
                  <FormattedOutput toolId={toolId} data={result} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════
export function InstructorCopilotView() {
  const { selectedAIToolId, setSelectedAIToolId } = useAppStore()
  const [activeTool, setActiveTool] = useState<ToolId | null>(
    (selectedAIToolId as ToolId) || null
  )

  // Sync with store
  useEffect(() => {
    if (selectedAIToolId && TOOLS.find(t => t.id === selectedAIToolId)) {
      setActiveTool(selectedAIToolId as ToolId)
    }
  }, [selectedAIToolId])

  const handleSelectTool = (id: ToolId) => {
    setActiveTool(id)
    setSelectedAIToolId(id)
  }

  const handleBack = () => {
    setActiveTool(null)
    setSelectedAIToolId(null)
  }

  return (
    <AnimatePresence mode="wait">
      {!activeTool ? (
        <motion.div key="hub" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
          <HubPage onSelectTool={handleSelectTool} />
        </motion.div>
      ) : (
        <motion.div key={`tool-${activeTool}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
          <ToolPage toolId={activeTool} onBack={handleBack} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
