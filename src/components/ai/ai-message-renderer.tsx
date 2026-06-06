'use client'

import { useState, useMemo, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import {
  Check,
  Copy,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Brain,
  Calendar,
  Clock,
  Target,
  Lightbulb,
  Briefcase,
  GraduationCap,
  BookOpen,
  Award,
  Route,
  ListChecks,
  Timer,
  ArrowRight,
  Circle,
  Star,
  Flame,
  Trophy,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */

export type AIMode = 'tutor' | 'quiz' | 'assignment' | 'planner' | 'career' | 'companion'

interface QuizOption {
  label: string
  text: string
  isCorrect?: boolean
}

interface QuizQuestion {
  id: string
  questionNumber: number
  question: string
  options: QuizOption[]
  correctAnswer?: string
  explanation?: string
}

interface StepItem {
  number: number
  title: string
  description: string
  duration?: string
  status?: 'pending' | 'active' | 'completed'
}

interface PlanDay {
  dayNumber: number
  label: string
  tasks: PlanTask[]
}

interface PlanTask {
  time?: string
  title: string
  description?: string
  duration?: string
  type: 'study' | 'quiz' | 'revision' | 'practice' | 'break' | 'review'
}

interface CareerMilestone {
  step: number
  title: string
  timeframe: string
  skills: string[]
  description?: string
}

/* ═══════════════════════════════════════════════════════════
   CONTENT PARSING UTILITIES
   ═══════════════════════════════════════════════════════════ */

/** Detect if content looks like a quiz with numbered options */
function parseQuizQuestions(content: string): QuizQuestion[] | null {
  const questions: QuizQuestion[] = []

  // Split content into individual question blocks by detecting question headers
  // Handles: **Question 1:**, **Q1.**, Q1., Question 1:, etc.
  const questionPattern = /(?:\*\*)?(?:Q(\d+)|Question\s+(\d+))[.:]\s*\**/gi

  // Find all question header positions
  const headerPositions: { index: number; number: number }[] = []
  let headerMatch
  while ((headerMatch = questionPattern.exec(content)) !== null) {
    const qNum = parseInt(headerMatch[1] || headerMatch[2] || '1')
    headerPositions.push({ index: headerMatch.index, number: qNum })
  }

  // If no standard headers, try numbered list pattern: 1. **Question text**
  if (headerPositions.length === 0) {
    const numberedPattern = /(\d+)\.\s+\*\*[^*]+\*\*/g
    let numMatch
    while ((numMatch = numberedPattern.exec(content)) !== null) {
      headerPositions.push({ index: numMatch.index, number: parseInt(numMatch[1]) })
    }
  }

  if (headerPositions.length === 0) return null

  // Extract each question block from header to next header (or end of content)
  for (let i = 0; i < headerPositions.length; i++) {
    const startPos = headerPositions[i].index
    const endPos = i + 1 < headerPositions.length ? headerPositions[i + 1].index : content.length
    const block = content.slice(startPos, endPos)

    // Extract question text (between the header and the first option)
    const qTextMatch = block.match(/(?:\*\*)?(?:Q\d+|Question\s+\d+)[.:]\s*\**(.+?)(?=\n\s*(?:[A-Da-d][\).]|\d+[\).]))/is)
    if (!qTextMatch) continue

    const questionText = qTextMatch[1].replace(/\*\*/g, '').trim()
    if (!questionText) continue

    const questionNumber = headerPositions[i].number

    // Extract options - line-by-line approach for accuracy
    const options: QuizOption[] = []
    const lines = block.split('\n')
    for (const line of lines) {
      const optMatch = line.match(/^\s*([A-Da-d])[\).]\s*(?:\*\*)?(.+?)(?:\*\*)?\s*$/)
      if (optMatch) {
        const label = optMatch[1].toUpperCase()
        const text = optMatch[2].replace(/\*\*/g, '').trim()
        // Make sure we're not accidentally capturing the next question
        if (text && !text.match(/^(?:Q\d+|Question\s+\d+)[.:]/i)) {
          options.push({ label, text })
        }
      }
    }

    // Extract correct answer from the block
    let correctAnswer: string | undefined
    const ansMatch = block.match(/(?:Answer|Correct(?:\s+Answer)?|✅)[:\s]+(?:\*\*)?([A-Da-d])(?:\*\*)?/i)
    if (ansMatch) {
      correctAnswer = ansMatch[1].toUpperCase()
    }

    // Extract explanation
    let explanation: string | undefined
    const expMatch = block.match(/(?:Explanation|Why|Reasoning)[:\s]+(.+?)(?=\n\n|\n\s*(?:Q\d|Question\s+\d)|$)/is)
    if (expMatch) {
      explanation = expMatch[1].replace(/\*\*/g, '').trim()
    }

    if (options.length >= 2) {
      questions.push({
        id: `q-${questionNumber}`,
        questionNumber,
        question: questionText,
        options: options.map(o => ({
          ...o,
          isCorrect: correctAnswer ? o.label === correctAnswer : undefined,
        })),
        correctAnswer,
        explanation,
      })
    }
  }

  return questions.length > 0 ? questions : null
}

/** Parse step-by-step task breakdown */
function parseSteps(content: string): StepItem[] | null {
  const steps: StepItem[] = []

  // Match numbered steps like:
  // Step 1: / 1. **Title** - Description
  const lines = content.split('\n')
  let currentStep: StepItem | null = null

  for (const line of lines) {
    const stepMatch = line.match(/(?:Step\s+)?(\d+)[.:)]\s+(?:\*\*)?(.+?)(?:\*\*)?(?:\s*[-–—]\s*(.+))?$/i)
    if (stepMatch) {
      if (currentStep) steps.push(currentStep)
      currentStep = {
        number: parseInt(stepMatch[1]),
        title: stepMatch[2].replace(/\*\*/g, '').trim(),
        description: stepMatch[3]?.replace(/\*\*/g, '').trim() || '',
        status: 'pending',
      }
    } else if (currentStep && line.trim()) {
      // Additional description line
      const durationMatch = line.match(/\((\d+[-–]\d+\s*(?:min|hour|hr|day|week))\)/i)
        || line.match(/(\d+[-–]?\d*\s*(?:min|minutes?|hour|hr|hours?|day|days?|week|weeks?))/i)
      if (durationMatch) {
        currentStep.duration = durationMatch[1]
      }
      const desc = line.replace(/^[-–•*]\s*/, '').replace(/\*\*/g, '').trim()
      if (desc && !currentStep.description) {
        currentStep.description = desc
      }
    }
  }
  if (currentStep) steps.push(currentStep)

  return steps.length >= 2 ? steps : null
}

/** Parse study plan / schedule */
function parsePlanDays(content: string): PlanDay[] | null {
  const days: PlanDay[] = []

  // Match Day 1:, Week 1:, Monday:, etc.
  const dayBlocks = content.split(/(?:^|\n)(?=(?:\*\*)?(?:Day\s+\d+|Week\s+\d+|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday))/i)

  for (const block of dayBlocks) {
    if (!block.trim()) continue

    const dayMatch = block.match(/(?:\*\*)?(Day\s+\d+|Week\s+\d+|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)(?:\*\*)?/i)
    if (!dayMatch) continue

    const label = dayMatch[1]
    const dayNumber = parseInt(label.match(/\d+/)?.[0] || '1')

    const tasks: PlanTask[] = []

    // Parse tasks within this day
    const taskLines = block.split('\n').slice(1)
    for (const tLine of taskLines) {
      const trimmed = tLine.trim()
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('---')) continue

      const taskMatch = trimmed.match(/[-–•*]\s+(?:\*\*)?(.+?)(?:\*\*)?(?:\s*[-–—]\s*(.+))?$/)
      if (taskMatch) {
        const title = taskMatch[1].replace(/\*\*/g, '').trim()
        const desc = taskMatch[2]?.replace(/\*\*/g, '').trim()

        // Detect task type
        let type: PlanTask['type'] = 'study'
        const lowerTitle = title.toLowerCase()
        if (lowerTitle.includes('quiz') || lowerTitle.includes('test') || lowerTitle.includes('practice test')) type = 'quiz'
        else if (lowerTitle.includes('revision') || lowerTitle.includes('review') || lowerTitle.includes('recap')) type = 'revision'
        else if (lowerTitle.includes('practice') || lowerTitle.includes('exercise')) type = 'practice'
        else if (lowerTitle.includes('break') || lowerTitle.includes('rest') || lowerTitle.includes('relax')) type = 'break'
        else if (lowerTitle.includes('review') || lowerTitle.includes('check')) type = 'review'

        // Extract time/duration
        const timeMatch = title.match(/(\d{1,2}[:.]\d{2}\s*(?:am|pm)?)\s*[-–]/i)
          || desc?.match(/(\d+[-–]?\d*\s*(?:min|hour|hr))/i)
        const time = timeMatch?.[1]
        const durationMatch = (title + ' ' + (desc || '')).match(/(\d+[-–]?\d*\s*(?:min|minutes?|hour|hr|hours?))/i)
        const duration = durationMatch?.[1]

        tasks.push({ time, title: title.replace(/^\d{1,2}[:.]\d{2}\s*(?:am|pm)?\s*[-–]\s*/i, ''), description: desc, duration, type })
      }
    }

    if (tasks.length > 0) {
      days.push({ dayNumber, label, tasks })
    }
  }

  return days.length > 0 ? days : null
}

/** Parse career roadmap milestones */
function parseCareerMilestones(content: string): CareerMilestone[] | null {
  const milestones: CareerMilestone[] = []

  const lines = content.split('\n')
  let step = 0

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Match patterns like: Step 1:, Phase 1:, Year 1:, Level 1:, 1. **Title**
    const match = trimmed.match(/(?:Step|Phase|Year|Level|Stage)\s+(\d+)[:.]\s+(?:\*\*)?(.+?)(?:\*\*)?$/i)
      || trimmed.match(/(\d+)\.\s+\*\*(.+?)\*\*\s*$/)

    if (match) {
      step = parseInt(match[1])
      const title = match[2].replace(/\*\*/g, '').trim()

      // Extract timeframe from next lines or inline
      const timeMatch = trimmed.match(/\((.+?(?:month|year|week|day).+?)\)/i)
        || (trimmed.match(/(\d+[-–]\d+\s*(?:months?|years?|weeks?))/i))
      const timeframe = timeMatch?.[1] || ''

      // Extract skills (usually bullet points following)
      const skills: string[] = []

      milestones.push({
        step,
        title,
        timeframe,
        skills,
      })
    } else if (milestones.length > 0) {
      // Add skills/description to last milestone
      const lastMile = milestones[milestones.length - 1]
      const skillMatch = trimmed.match(/^[-–•*]\s+(?:\*\*)?(.+?)(?:\*\*)?$/)
      if (skillMatch) {
        const skill = skillMatch[1].replace(/\*\*/g, '').trim()
        if (skill.toLowerCase().includes('skill') || skill.toLowerCase().includes('learn') || skill.toLowerCase().includes('tool') || skill.toLowerCase().includes('language') || skill.length < 40) {
          lastMile.skills.push(skill)
        } else if (!lastMile.description) {
          lastMile.description = skill
        }
      } else if (trimmed.startsWith('(') && !lastMile.timeframe) {
        lastMile.timeframe = trimmed.replace(/[()]/g, '').trim()
      } else if (!lastMile.description && trimmed.length > 20) {
        lastMile.description = trimmed.replace(/\*\*/g, '').trim()
      }
    }
  }

  return milestones.length >= 2 ? milestones : null
}

/* ═══════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════ */

/** Code block with syntax highlighting */
function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group my-2 rounded-xl overflow-hidden border border-border/30">
      <div className="flex items-center justify-between bg-zinc-900 dark:bg-zinc-950 px-4 py-1.5">
        <span className="text-[11px] font-mono text-zinc-400">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'python'}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '13px',
          padding: '12px 16px',
          background: '#1a1a2e',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

/** Interactive quiz question card */
function QuizCard({ quiz, modeColor = 'emerald' }: { quiz: QuizQuestion; modeColor?: string }) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)

  const colorMap: Record<string, { bg: string; border: string; text: string; ring: string; correctBg: string; wrongBg: string }> = {
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-500/30', correctBg: 'bg-emerald-500/15', wrongBg: 'bg-red-500/15' },
    violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-600 dark:text-violet-400', ring: 'ring-violet-500/30', correctBg: 'bg-violet-500/15', wrongBg: 'bg-red-500/15' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-600 dark:text-amber-400', ring: 'ring-amber-500/30', correctBg: 'bg-amber-500/15', wrongBg: 'bg-red-500/15' },
  }
  const colors = colorMap[modeColor] || colorMap.emerald

  const handleSelect = (label: string) => {
    if (selectedOption) return // Already answered
    setSelectedOption(label)
    if (quiz.explanation) {
      setTimeout(() => setShowExplanation(true), 500)
    }
  }

  const isCorrect = selectedOption === quiz.correctAnswer
  const hasAnswered = selectedOption !== null

  return (
    <div className={cn(
      'rounded-xl border p-4 my-3 transition-all',
      hasAnswered
        ? isCorrect ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-red-500/40 bg-red-500/5'
        : cn('border-border/40 bg-card hover:border-', colors.border)
    )}>
      {/* Question header */}
      <div className="flex items-start gap-2.5 mb-3">
        <div className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg text-white font-bold text-xs', colors.bg, colors.text)}>
          {quiz.questionNumber}
        </div>
        <p className="text-[14px] font-medium text-foreground leading-relaxed pt-0.5">
          {quiz.question}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2 ml-9">
        {quiz.options.map((opt) => {
          const isSelected = selectedOption === opt.label
          const isCorrectOption = opt.label === quiz.correctAnswer
          const showCorrect = hasAnswered && isCorrectOption
          const showWrong = hasAnswered && isSelected && !isCorrectOption

          return (
            <button
              key={opt.label}
              onClick={() => handleSelect(opt.label)}
              disabled={hasAnswered}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-all text-[13px]',
                !hasAnswered && 'hover:bg-muted/50 hover:border-border cursor-pointer',
                showCorrect && 'border-emerald-500/50 bg-emerald-500/10',
                showWrong && 'border-red-500/50 bg-red-500/10',
                hasAnswered && !isSelected && !isCorrectOption && 'opacity-50',
              )}
            >
              <span className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all',
                showCorrect && 'border-emerald-500 bg-emerald-500 text-white',
                showWrong && 'border-red-500 bg-red-500 text-white',
                !hasAnswered && 'border-border text-muted-foreground',
                hasAnswered && !isSelected && !isCorrectOption && 'border-border/50 text-muted-foreground/50',
              )}>
                {showCorrect ? <CheckCircle2 className="size-3.5" /> : showWrong ? <XCircle className="size-3.5" /> : opt.label}
              </span>
              <span className={cn(
                'flex-1',
                showCorrect && 'text-emerald-700 dark:text-emerald-300 font-medium',
                showWrong && 'text-red-700 dark:text-red-300',
              )}>
                {opt.text}
              </span>
            </button>
          )
        })}
      </div>

      {/* Result feedback */}
      {hasAnswered && (
        <div className="ml-9 mt-3">
          <div className={cn(
            'flex items-center gap-2 text-[13px] font-medium',
            isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
          )}>
            {isCorrect ? <><CheckCircle2 className="size-4" /> Correct!</> : <><XCircle className="size-4" /> Incorrect</>}
            {!isCorrect && quiz.correctAnswer && (
              <span className="text-muted-foreground font-normal">
                — The correct answer is <strong>{quiz.correctAnswer}</strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Explanation */}
      {showExplanation && quiz.explanation && (
        <div className="ml-9 mt-2 rounded-lg bg-muted/50 border border-border/30 p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Lightbulb className="size-3.5 text-amber-500" />
            <span className="text-[12px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Explanation</span>
          </div>
          <p className="text-[13px] text-muted-foreground leading-relaxed">{quiz.explanation}</p>
        </div>
      )}
    </div>
  )
}

/** Step-by-step task breakdown card */
function StepCard({ steps, modeColor = 'amber' }: { steps: StepItem[]; modeColor?: string }) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([1]))

  const toggleExpand = (num: number) => {
    setExpandedSteps(prev => {
      const next = new Set(prev)
      if (next.has(num)) next.delete(num)
      else next.add(num)
      return next
    })
  }

  return (
    <div className="my-3 space-y-0">
      {steps.map((step, idx) => {
        const isExpanded = expandedSteps.has(step.number)
        const isLast = idx === steps.length - 1

        return (
          <div key={`step-${idx}-${step.number}`} className="relative flex gap-3">
            {/* Vertical line connector */}
            {!isLast && (
              <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-border/40" />
            )}

            {/* Step circle */}
            <button
              onClick={() => toggleExpand(step.number)}
              className="flex size-[30px] shrink-0 items-center justify-center rounded-full border-2 border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-colors z-10 mt-0.5"
            >
              {step.number}
            </button>

            {/* Step content */}
            <div className={cn('flex-1 pb-4', isLast && 'pb-0')}>
              <button
                onClick={() => toggleExpand(step.number)}
                className="flex items-center gap-2 w-full text-left"
              >
                <span className="text-[14px] font-semibold text-foreground">{step.title}</span>
                {step.duration && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-amber-500/20 text-amber-600 dark:text-amber-400">
                    <Timer className="size-2.5 mr-0.5" /> {step.duration}
                  </Badge>
                )}
                {isExpanded ? <ChevronDown className="size-3.5 text-muted-foreground ml-auto" /> : <ChevronRight className="size-3.5 text-muted-foreground ml-auto" />}
              </button>

              {isExpanded && step.description && (
                <MotionDiv
                  className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed pl-0"
                >
                  {step.description}
                </MotionDiv>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/** Simple motion-less div wrapper to avoid framer-motion import in shared comp */
function MotionDiv({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}

/** Study plan day card */
function PlanDayCard({ day, isLast }: { day: PlanDay; isLast: boolean }) {
  const [expanded, setExpanded] = useState(true)

  const taskTypeConfig: Record<PlanTask['type'], { icon: typeof BookOpen; color: string; bgColor: string }> = {
    study: { icon: BookOpen, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-500/10' },
    quiz: { icon: Brain, color: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-500/10' },
    revision: { icon: RotateCcw, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10' },
    practice: { icon: Target, color: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-500/10' },
    break: { icon: CoffeeIcon, color: 'text-slate-500', bgColor: 'bg-slate-500/10' },
    review: { icon: CheckCircle2, color: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-500/10' },
  }

  return (
    <div className="relative flex gap-3">
      {/* Vertical connector */}
      {!isLast && <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-border/40" />}

      {/* Day marker */}
      <div className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-[10px] font-bold z-10">
        {day.dayNumber}
      </div>

      {/* Day content */}
      <div className="flex-1 pb-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 w-full text-left mb-2"
        >
          <span className="text-[14px] font-semibold text-foreground">{day.label}</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
            {day.tasks.length} task{day.tasks.length > 1 ? 's' : ''}
          </Badge>
          {expanded ? <ChevronDown className="size-3.5 text-muted-foreground ml-auto" /> : <ChevronRight className="size-3.5 text-muted-foreground ml-auto" />}
        </button>

        {expanded && (
          <div className="space-y-1.5 ml-0">
            {day.tasks.map((task, ti) => {
              const config = taskTypeConfig[task.type] || taskTypeConfig.study
              const TaskIcon = config.icon
              return (
                <div key={ti} className="flex items-start gap-2.5 rounded-lg bg-muted/30 border border-border/20 px-3 py-2">
                  <div className={cn('flex size-6 shrink-0 items-center justify-center rounded-md mt-0.5', config.bgColor)}>
                    <TaskIcon className={cn('size-3.5', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {task.time && <span className="text-[10px] font-mono text-muted-foreground">{task.time}</span>}
                      <span className="text-[13px] font-medium text-foreground">{task.title}</span>
                      {task.duration && (
                        <span className="text-[10px] text-muted-foreground">({task.duration})</span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-[12px] text-muted-foreground mt-0.5">{task.description}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function RotateCcw({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
}

function CoffeeIcon({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></svg>
}

/** Career roadmap milestone card */
function CareerMilestoneCard({ milestone, isLast }: { milestone: CareerMilestone; isLast: boolean }) {
  const [expanded, setExpanded] = useState(true)

  const stepColors = [
    'from-emerald-500 to-teal-500',
    'from-cyan-500 to-blue-500',
    'from-violet-500 to-purple-500',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-pink-500',
  ]
  const gradient = stepColors[(milestone.step - 1) % stepColors.length]

  return (
    <div className="relative flex gap-3">
      {/* Vertical connector */}
      {!isLast && <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-border/40" />}

      {/* Step marker */}
      <div className={cn('flex size-[30px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white text-[10px] font-bold z-10', gradient)}>
        {milestone.step}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 w-full text-left"
        >
          <span className="text-[14px] font-semibold text-foreground">{milestone.title}</span>
          {milestone.timeframe && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-violet-500/20 text-violet-600 dark:text-violet-400">
              <Clock className="size-2.5 mr-0.5" /> {milestone.timeframe}
            </Badge>
          )}
          {expanded ? <ChevronDown className="size-3.5 text-muted-foreground ml-auto" /> : <ChevronRight className="size-3.5 text-muted-foreground ml-auto" />}
        </button>

        {expanded && (
          <div className="mt-2 space-y-2">
            {milestone.description && (
              <p className="text-[13px] text-muted-foreground leading-relaxed">{milestone.description}</p>
            )}
            {milestone.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {milestone.skills.map((skill, si) => (
                  <Badge key={si} variant="secondary" className="text-[11px] px-2 py-0.5 rounded-full">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN RENDERER COMPONENT
   ═══════════════════════════════════════════════════════════ */

interface AiMessageRendererProps {
  content: string
  mode?: AIMode
  modeColor?: string
}

export function AiMessageRenderer({ content, mode = 'tutor', modeColor }: AiMessageRendererProps) {
  const [copied, setCopied] = useState(false)

  // Ensure content is always a string
  const safeContent = typeof content === 'string' ? content : String(content ?? '')

  // Determine mode-specific color
  const colorMap: Record<AIMode, string> = {
    tutor: 'emerald',
    quiz: 'violet',
    assignment: 'amber',
    planner: 'emerald',
    career: 'emerald',
    companion: 'emerald',
  }
  const activeColor = modeColor || colorMap[mode] || 'emerald'

  // Parse structured content based on mode
  const parsedContent = useMemo(() => {
    if (mode === 'quiz') {
      const questions = parseQuizQuestions(safeContent)
      if (questions && questions.length > 0) return { type: 'quiz' as const, data: questions }
    }
    if (mode === 'planner') {
      const days = parsePlanDays(safeContent)
      if (days && days.length > 0) return { type: 'plan' as const, data: days }

      // Fallback: try steps
      const steps = parseSteps(safeContent)
      if (steps && steps.length >= 2) return { type: 'steps' as const, data: steps }
    }
    if (mode === 'assignment') {
      const steps = parseSteps(safeContent)
      if (steps && steps.length >= 2) return { type: 'steps' as const, data: steps }
    }
    if (mode === 'career') {
      const milestones = parseCareerMilestones(safeContent)
      if (milestones && milestones.length >= 2) return { type: 'career' as const, data: milestones }

      // Fallback: try steps
      const steps = parseSteps(safeContent)
      if (steps && steps.length >= 2) return { type: 'steps' as const, data: steps }
    }

    // For tutor and companion modes, render as conversational markdown
    // Do NOT auto-parse into Step-by-Step Plan boxes — these modes should feel like chatting with a friend
    if (mode === 'tutor' || mode === 'companion') {
      // Only detect quiz content if it genuinely looks like a quiz
      const questions = parseQuizQuestions(safeContent)
      if (questions && questions.length > 0) return { type: 'quiz' as const, data: questions }

      // Everything else renders as nice conversational markdown
      return { type: 'markdown' as const, data: null }
    }

    return { type: 'markdown' as const, data: null }
  }, [safeContent, mode])

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(safeContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ─── Render structured content ───
  if (parsedContent.type === 'quiz') {
    const questions = parsedContent.data
    // Check if there's intro text before the first question
    const firstQIndex = safeContent.search(/(?:Q\d+|Question\s+\d+)[.:]/i)
    const introText = firstQIndex > 0 ? safeContent.slice(0, firstQIndex).trim() : ''

    return (
      <div className="group/msg relative">
        {introText && (
          <div className="mb-3">
            <MarkdownRenderer content={introText} />
          </div>
        )}
        <div className="space-y-2">
          {questions.map((q) => (
            <QuizCard key={q.id} quiz={q} modeColor={activeColor} />
          ))}
        </div>
        {/* Copy button */}
        <div className="absolute -bottom-6 left-0 opacity-0 group-hover/msg:opacity-100 transition-opacity">
          <button
            onClick={handleCopyMessage}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    )
  }

  if (parsedContent.type === 'steps') {
    const steps = parsedContent.data
    const firstStepIndex = safeContent.search(/(?:Step\s+)?\d+[.:)]\s+(?:\*\*)?/i)
    const introText = firstStepIndex > 0 ? safeContent.slice(0, firstStepIndex).trim() : ''

    return (
      <div className="group/msg relative">
        {introText && (
          <div className="mb-3">
            <MarkdownRenderer content={introText} />
          </div>
        )}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ListChecks className="size-4 text-amber-600 dark:text-amber-400" />
            <span className="text-[13px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Step-by-Step Plan</span>
          </div>
          <StepCard steps={steps} modeColor={activeColor} />
        </div>
        <div className="absolute -bottom-6 left-0 opacity-0 group-hover/msg:opacity-100 transition-opacity">
          <button
            onClick={handleCopyMessage}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    )
  }

  if (parsedContent.type === 'plan') {
    const days = parsedContent.data
    const firstDayIndex = safeContent.search(/(?:Day\s+\d+|Week\s+\d+|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i)
    const introText = firstDayIndex > 0 ? safeContent.slice(0, firstDayIndex).trim() : ''

    return (
      <div className="group/msg relative">
        {introText && (
          <div className="mb-3">
            <MarkdownRenderer content={introText} />
          </div>
        )}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="size-4 text-blue-600 dark:text-blue-400" />
            <span className="text-[13px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Study Plan</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-blue-500/20 text-blue-600 dark:text-blue-400">
              {days.length} day{days.length > 1 ? 's' : ''}
            </Badge>
          </div>
          <div className="space-y-0">
            {days.map((day, i) => (
              <PlanDayCard key={day.dayNumber} day={day} isLast={i === days.length - 1} />
            ))}
          </div>
        </div>
        <div className="absolute -bottom-6 left-0 opacity-0 group-hover/msg:opacity-100 transition-opacity">
          <button
            onClick={handleCopyMessage}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    )
  }

  if (parsedContent.type === 'career') {
    const milestones = parsedContent.data
    const firstMileIndex = safeContent.search(/(?:Step|Phase|Year|Level|Stage)\s+\d+/i)
    const introText = firstMileIndex > 0 ? safeContent.slice(0, firstMileIndex).trim() : ''

    return (
      <div className="group/msg relative">
        {introText && (
          <div className="mb-3">
            <MarkdownRenderer content={introText} />
          </div>
        )}
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Route className="size-4 text-violet-600 dark:text-violet-400" />
            <span className="text-[13px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Career Roadmap</span>
          </div>
          <div className="space-y-0">
            {milestones.map((milestone, i) => (
              <CareerMilestoneCard key={milestone.step} milestone={milestone} isLast={i === milestones.length - 1} />
            ))}
          </div>
        </div>
        <div className="absolute -bottom-6 left-0 opacity-0 group-hover/msg:opacity-100 transition-opacity">
          <button
            onClick={handleCopyMessage}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    )
  }

  // ─── Default: Render with enhanced ReactMarkdown ───
  return (
    <div className="group/msg relative">
      <MarkdownRenderer content={safeContent} />
      <div className="absolute -bottom-6 left-0 opacity-0 group-hover/msg:opacity-100 transition-opacity">
        <button
          onClick={handleCopyMessage}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   ENHANCED MARKDOWN RENDERER
   ═══════════════════════════════════════════════════════════ */

export function MarkdownRenderer({ content }: { content: string }) {
  const safeContent = typeof content === 'string' ? content : String(content ?? '')

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none
      prose-headings:text-foreground prose-headings:font-bold
      prose-h1:text-xl prose-h1:mt-4 prose-h1:mb-2
      prose-h2:text-lg prose-h2:mt-3 prose-h2:mb-1.5
      prose-h3:text-base prose-h3:mt-2.5 prose-h3:mb-1
      prose-strong:text-foreground prose-strong:font-semibold
      prose-em:text-foreground/80
      prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-emerald-700 dark:prose-code:text-emerald-400 prose-code:text-[13px] prose-code:font-mono
      prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0 prose-pre:border-0 prose-pre:rounded-none
      prose-a:text-emerald-600 dark:prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
      prose-p:my-1.5 prose-p:text-[14px] prose-p:leading-relaxed
      prose-ul:my-1.5 prose-ol:my-1.5
      prose-li:my-0.5
      prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-500/5 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-3
      prose-hr:border-border/40
      prose-table:text-[13px]
      prose-th:bg-muted prose-th:px-3 prose-th:py-1.5
      prose-td:px-3 prose-td:py-1.5
    ">
      <ReactMarkdown
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const codeString = String(children).replace(/\n$/, '')
            if (match) {
              return <CodeBlock code={codeString} language={match[1]} />
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
          pre({ children }) {
            return <>{children}</>
          },
          h1({ children }) {
            return <h1 className="text-xl font-bold text-foreground mt-4 mb-2 first:mt-0">{children}</h1>
          },
          h2({ children }) {
            return <h2 className="text-lg font-bold text-foreground mt-3 mb-1.5 first:mt-0">{children}</h2>
          },
          h3({ children }) {
            return <h3 className="text-base font-semibold text-foreground mt-2.5 mb-1 first:mt-0">{children}</h3>
          },
          strong({ children }) {
            return <strong className="font-semibold text-foreground">{children}</strong>
          },
          em({ children }) {
            return <em className="italic text-foreground/80">{children}</em>
          },
          blockquote({ children }) {
            return <blockquote className="border-l-3 border-emerald-500 bg-emerald-500/5 rounded-r-lg py-1 px-3 my-2">{children}</blockquote>
          },
          ul({ children }) {
            return <ul className="my-1.5 space-y-0.5">{children}</ul>
          },
          ol({ children }) {
            return <ol className="my-1.5 space-y-0.5">{children}</ol>
          },
          li({ children }) {
            return <li className="text-[14px] leading-relaxed">{children}</li>
          },
          p({ children }) {
            return <p className="my-1.5 text-[14px] leading-relaxed">{children}</p>
          },
          table({ children }) {
            return (
              <div className="my-2 overflow-x-auto rounded-lg border border-border/40">
                <table className="w-full text-[13px]">{children}</table>
              </div>
            )
          },
          th({ children }) {
            return <th className="bg-muted px-3 py-1.5 text-left font-semibold text-foreground">{children}</th>
          },
          td({ children }) {
            return <td className="px-3 py-1.5 border-t border-border/30">{children}</td>
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                {children}
              </a>
            )
          },
        }}
      >
        {safeContent}
      </ReactMarkdown>
    </div>
  )
}
