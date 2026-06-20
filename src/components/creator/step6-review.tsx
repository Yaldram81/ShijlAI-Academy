'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Rocket, CheckCircle2, AlertTriangle, XCircle, ChevronDown,
  Check, X, Sparkles, Loader2, Clock, BookOpen, Layers,
  DollarSign, Search, Award, Shield, Users, Globe,
  Video, FileText, Calendar, Eye, ArrowRight, Info,
  AlertCircle, Play, Timer, GraduationCap, Tag, Lock,
  Send, Save, CalendarClock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { AdminStatCard, AdminStatCardGrid } from '@/components/admin/admin-stat-card'
import type { CourseFormData, HealthCheckItem } from './types'
import { SPRING, CARD_SPRING } from './constants'

// ─── Props ───

export interface Step6ReviewProps {
  form: CourseFormData
  onFormChange: (updates: Partial<CourseFormData>) => void
  onPrevious: () => void
  onSubmit: () => void
  onPreview: () => void
}

// ─── Circular Progress ───

function CircularScore({ score, size = 120 }: { score: number; size?: number }) {
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Work'
  const color = score >= 80 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-red-500'
  const strokeColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/30"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <motion.span
          className={cn('text-[28px] font-bold', color)}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
        >
          {score}
        </motion.span>
        <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
      </div>
    </div>
  )
}

// ─── Health Check Item ───

function HealthCheckRow({
  item,
  onAction,
}: {
  item: HealthCheckItem
  onAction?: (action: string) => void
}) {
  const icons = {
    pass: <CheckCircle2 className="size-4 text-emerald-500" />,
    warning: <AlertTriangle className="size-4 text-amber-500" />,
    fail: <XCircle className="size-4 text-red-500" />,
  }

  const bgColors = {
    pass: 'bg-emerald-50 dark:bg-emerald-950/20',
    warning: 'bg-amber-50 dark:bg-amber-950/20',
    fail: 'bg-red-50 dark:bg-red-950/20',
  }

  return (
    <motion.div
      layout={SPRING}
      className={cn(
        'flex items-center gap-3 rounded-xl p-2.5 transition-colors',
        bgColors[item.status]
      )}
    >
      {icons[item.status]}
      <span className={cn(
        'text-[13px] font-medium flex-1',
        item.status === 'pass' ? 'text-emerald-700 dark:text-emerald-400' :
        item.status === 'warning' ? 'text-amber-700 dark:text-amber-400' :
        'text-red-700 dark:text-red-400'
      )}>
        {item.label}
      </span>
      {item.status !== 'pass' && item.action && item.actionLabel && onAction && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            'rounded-xl h-7 text-[11px] gap-1 ios-press shrink-0',
            item.status === 'warning'
              ? 'text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-950/40'
              : 'text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-950/40'
          )}
          onClick={() => onAction(item.action!)}
        >
          {item.actionLabel}
          <ArrowRight className="size-3" />
        </Button>
      )}
    </motion.div>
  )
}

// ─── Confirmation Dialog ───

function ConfirmSubmitDialog({
  open,
  onClose,
  onConfirm,
  publishOption,
  scheduledDate,
  scheduledTime,
  courseName,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  publishOption: string
  scheduledDate: string
  scheduledTime: string
  courseName: string
}) {
  if (!open) return null

  const isDraft = publishOption === 'draft'
  const isScheduled = publishOption === 'scheduled'

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={SPRING}
            className="w-full max-w-md rounded-2xl bg-card border border-border ios-shadow-lg p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="flex justify-center">
              <div className={cn(
                'flex size-16 items-center justify-center rounded-2xl',
                isDraft
                  ? 'bg-slate-100 text-slate-600 dark:bg-slate-900/40 dark:text-slate-400'
                  : isScheduled
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                  : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
              )}>
                {isDraft ? <Save className="size-7" /> : isScheduled ? <CalendarClock className="size-7" /> : <Send className="size-7" />}
              </div>
            </div>

            {/* Title */}
            <div className="text-center space-y-1.5">
              <h3 className="text-[18px] font-bold">
                {isDraft ? 'Save as Draft?' : isScheduled ? 'Submit & Schedule?' : 'Submit for Review?'}
              </h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                {isDraft ? (
                  <>Your course <span className="font-semibold text-foreground">&quot;{courseName}&quot;</span> will be saved as a draft. You can continue editing and submit for review later.</>
                ) : isScheduled ? (
                  <>Your course <span className="font-semibold text-foreground">&quot;{courseName}&quot;</span> will be submitted to an admin for review. Once approved, it will go live on <span className="font-semibold text-foreground">{scheduledDate}</span> at <span className="font-semibold text-foreground">{scheduledTime || '12:00'}</span>.</>
                ) : (
                  <>Your course <span className="font-semibold text-foreground">&quot;{courseName}&quot;</span> will be submitted to an admin for review before going live.</>
                )}
              </p>
            </div>

            {/* Info Banner */}
            {!isDraft && !isScheduled && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 p-3 flex items-start gap-2.5">
                <Shield className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[12px] text-amber-700 dark:text-amber-400">
                  Admin review typically takes 24–48 hours. You&apos;ll receive a notification once your course is approved or if changes are requested.
                </p>
              </div>
            )}
            
            {isScheduled && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 p-3 flex items-start gap-2.5">
                <Shield className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[12px] text-amber-700 dark:text-amber-400">
                  Admin review typically takes 24–48 hours. You&apos;ll receive a notification once your course is approved or if changes are requested.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-11 text-[13px] font-semibold ios-press"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                className={cn(
                  'flex-1 rounded-xl h-11 text-[13px] font-semibold ios-press gap-2',
                  isDraft
                    ? 'bg-slate-700 hover:bg-slate-800 text-white dark:bg-slate-600 dark:hover:bg-slate-700'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                )}
                onClick={onConfirm}
              >
                {isDraft ? <Save className="size-4" /> : <Send className="size-4" />}
                {isDraft ? 'Save Draft' : 'Confirm & Submit'}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Main Component ───

export function Step6Review({
  form,
  onFormChange,
  onPrevious,
  onSubmit,
  onPreview,
}: Step6ReviewProps) {
  const [aiQualityLoading, setAiQualityLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // ─── Compute Course Stats ───

  const totalLessons = useMemo(() =>
    form.modules.reduce((acc, m) => acc + m.lessons.length, 0),
    [form.modules]
  )

  const totalDuration = useMemo(() =>
    form.modules.reduce((acc, m) =>
      acc + m.lessons.reduce((a, l) => a + l.duration, 0), 0),
    [form.modules]
  )

  const totalQuizzes = useMemo(() =>
    form.modules.reduce((acc, m) => acc + m.quizzes.length, 0),
    [form.modules]
  )

  // ─── Health Score ───

  const healthChecks = useMemo((): HealthCheckItem[] => {
    const checks: HealthCheckItem[] = [
      {
        id: 'title-desc',
        label: 'Title & Description',
        status: form.title.trim().length >= 3 && form.description.trim().length >= 50 ? 'pass' :
                form.title.trim().length >= 3 ? 'warning' : 'fail',
        action: 'step-0',
        actionLabel: form.title.trim().length < 3 ? 'Fix now' : 'Improve',
      },
      {
        id: 'thumbnail',
        label: 'Course Thumbnail',
        status: form.thumbnail ? 'pass' : 'warning',
        action: 'step-0',
        actionLabel: 'Add now',
      },
      {
        id: 'modules',
        label: `${form.modules.length} Module${form.modules.length !== 1 ? 's' : ''} / ${totalLessons} Lesson${totalLessons !== 1 ? 's' : ''}`,
        status: form.modules.length >= 2 && totalLessons >= 5 ? 'pass' :
                form.modules.length >= 1 && totalLessons >= 3 ? 'warning' : 'fail',
        action: 'step-1',
        actionLabel: form.modules.length === 0 ? 'Add modules' : 'Add lessons',
      },
      {
        id: 'promo-video',
        label: 'Promo Video',
        status: form.promoVideoUrl ? 'pass' : 'warning',
        action: 'step-0',
        actionLabel: 'Add video',
      },
      {
        id: 'captions',
        label: 'Video Captions / Transcripts',
        status: form.modules.some(m => m.lessons.some(l => l.captions?.mode !== 'none')) ? 'pass' : 'warning',
        action: 'step-2',
        actionLabel: 'Enable captions',
      },
      {
        id: 'pricing',
        label: 'Pricing Configuration',
        status: form.pricingModel === 'free' || form.priceUSD > 0 ? 'pass' : 'warning',
        action: 'step-3',
        actionLabel: 'Set price',
      },
      {
        id: 'seo',
        label: 'SEO & Discoverability',
        status: form.seoTitle && form.urlSlug && form.metaDescription ? 'pass' :
                form.seoTitle || form.urlSlug ? 'warning' : 'fail',
        action: 'step-4',
        actionLabel: form.seoTitle ? 'Complete SEO' : 'Set up SEO',
      },
    ]
    return checks
  }, [form, totalLessons])

  const healthScore = useMemo(() => {
    const weights = { pass: 1, warning: 0.5, fail: 0 }
    const total = healthChecks.reduce((acc, item) => acc + weights[item.status], 0)
    return Math.round((total / healthChecks.length) * 100)
  }, [healthChecks])

  // ─── AI Quality Check ───

  const handleAIQualityCheck = async () => {
    setAiQualityLoading(true)
    await new Promise(r => setTimeout(r, 2500))
    toast.success('AI Quality Check complete!', {
      description: `Your course scores ${healthScore}/100. ${healthScore >= 80 ? 'Great work!' : 'Some areas need improvement.'}`,
    })
    setAiQualityLoading(false)
  }

  // ─── Price Display ───

  const priceDisplay = useMemo(() => {
    if (form.pricingModel === 'free') return 'Free'
    if (form.pricingModel === 'subscription') return 'Pro Subscription'
    if (form.pricingModel === 'freemium') return `Freemium ($${form.priceUSD.toLocaleString()})`
    if (form.pricingModel === 'cohort') return 'Cohort Bundle'
    return `$${form.priceUSD.toLocaleString()}`
  }, [form])

  // ─── Duration Display ───

  const durationDisplay = useMemo(() => {
    if (totalDuration < 60) return `${totalDuration}m`
    const h = Math.floor(totalDuration / 60)
    const m = totalDuration % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }, [totalDuration])

  // ─── Publish Option Handler ───

  const handleAction = (action: string) => {
    toast.info(`Navigate to ${action} to fix this item`)
  }

  // ─── Submit Handler ───

  const handleSubmitClick = () => {
    setShowConfirm(true)
  }

  const handleConfirmSubmit = () => {
    setShowConfirm(false)
    onSubmit()
  }

  // ─── Submit Button Label ───

  const submitButtonLabel = useMemo(() => {
    if (form.publishOption === 'draft') return 'Save as Draft'
    if (form.publishOption === 'scheduled') return 'Submit & Schedule'
    return 'Submit for Review'
  }, [form.publishOption])

  const submitButtonIcon = useMemo(() => {
    if (form.publishOption === 'draft') return <Save className="size-4" />
    if (form.publishOption === 'scheduled') return <CalendarClock className="size-4" />
    return <Send className="size-4" />
  }, [form.publishOption])

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="space-y-6"
      >
        {/* ─── Course Health Score ─── */}
        <div className="rounded-2xl ios-shadow-sm bg-card border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[16px] font-bold flex items-center gap-2">
                <Shield className="size-5 text-primary" />
                Course Health Score
              </h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Review your course readiness before submitting
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl h-8 gap-1.5 text-primary hover:bg-primary/10 ios-press"
              onClick={handleAIQualityCheck}
              disabled={aiQualityLoading}
            >
              {aiQualityLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              AI Quality Check
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Score Circle */}
            <CircularScore score={healthScore} />

            {/* Checklist */}
            <div className="flex-1 w-full space-y-2">
              {healthChecks.map((item) => (
                <HealthCheckRow
                  key={item.id}
                  item={item}
                  onAction={handleAction}
                />
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* ─── Full Course Summary ─── */}
        <div className="space-y-3">
          <h3 className="text-[16px] font-bold flex items-center gap-2">
            <BookOpen className="size-5 text-primary" />
            Course Summary
          </h3>

          <div className="rounded-2xl ios-shadow-sm bg-card border border-border p-5 space-y-4">
            {/* Title & Category */}
            <div>
              <h4 className="text-[17px] font-bold truncate">
                {form.title || 'Untitled Course'}
              </h4>
              {form.subtitle && (
                <p className="text-[13px] text-muted-foreground mt-0.5">{form.subtitle}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                {form.category && (
                  <Badge variant="outline" className="text-[11px] h-5 rounded-lg bg-primary/5 text-primary border-primary/20">
                    {form.category}
                  </Badge>
                )}
                {form.subcategory && (
                  <Badge variant="outline" className="text-[11px] h-5 rounded-lg">
                    {form.subcategory}
                  </Badge>
                )}
                <Badge variant="outline" className="text-[11px] h-5 rounded-lg capitalize">
                  {form.difficultyLevel}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Stats Grid */}
            <AdminStatCardGrid columns={4}>
              <AdminStatCard icon={Layers} label="Modules" value={String(form.modules.length)} color="teal" index={0} />
              <AdminStatCard icon={BookOpen} label="Lessons" value={String(totalLessons)} color="emerald" index={1} />
              <AdminStatCard icon={Timer} label="Duration" value={durationDisplay} color="cyan" index={2} />
              <AdminStatCard icon={Globe} label="Language" value={form.language === 'en' ? 'English' : form.language === 'ur' ? 'Urdu' : form.language === 'ar' ? 'Arabic' : 'Multilingual'} color="blue" index={3} />
              <AdminStatCard icon={GraduationCap} label="Level" value={form.difficultyLevel.charAt(0).toUpperCase() + form.difficultyLevel.slice(1)} color="violet" index={4} />
              <AdminStatCard icon={DollarSign} label="Price" value={priceDisplay} color="amber" index={5} />
              <AdminStatCard icon={Award} label="Certificate" value={form.certificateEnabled ? 'Yes' : 'No'} color="green" index={6} />
              <AdminStatCard icon={Lock} label="Access" value={form.accessDuration === 'lifetime' ? 'Lifetime' : `${form.accessDurationMonths} months`} color="orange" index={7} />
            </AdminStatCardGrid>

            {/* Quizzes count */}
            {totalQuizzes > 0 && (
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <FileText className="size-4" />
                {totalQuizzes} quiz{totalQuizzes !== 1 ? 'zes' : ''} included
              </div>
            )}

            {/* Drip content notice */}
            {form.dripContent && (
              <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 flex items-center gap-2">
                <Clock className="size-4 text-primary shrink-0" />
                <span className="text-[12px] font-medium text-primary">
                  Drip content enabled — modules release on schedule
                </span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* ─── Submission Options ─── */}
        <div className="space-y-4">
          <div>
            <h3 className="text-[16px] font-bold flex items-center gap-2">
              <Rocket className="size-5 text-primary" />
              Submission Options
            </h3>
            <p className="text-[12px] text-muted-foreground mt-1">
              Choose how you want to proceed with your course
            </p>
          </div>

          <RadioGroup
            value={form.publishOption}
            onValueChange={(v) => onFormChange({ publishOption: v as 'review' | 'scheduled' | 'draft' })}
            className="space-y-4"
          >
            {/* ─── Option 1: Submit for Admin Review ─── */}
            <motion.div
              whileTap={{ scale: 0.998 }}
              className={cn(
                'rounded-2xl border-2 p-5 cursor-pointer transition-all',
                form.publishOption === 'review'
                  ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20 ios-shadow'
                  : 'border-border hover:border-emerald-300/50 ios-shadow-sm'
              )}
              onClick={() => onFormChange({ publishOption: 'review' })}
            >
              <div className="flex items-start gap-4">
                <RadioGroupItem value="review" id="review" className="mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex size-10 items-center justify-center rounded-xl shrink-0',
                      form.publishOption === 'review'
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    )}>
                      <Send className="size-5" />
                    </div>
                    <Label htmlFor="review" className="cursor-pointer">
                      <span className="text-[15px] font-bold block">Submit for Review</span>
                      <span className="text-[12px] text-muted-foreground block mt-0.5">
                        Your course will be submitted to admins for review and approval
                      </span>
                    </Label>
                  </div>

                  <AnimatePresence>
                    {form.publishOption === 'review' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={SPRING}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 ml-[52px] rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/30 p-3 space-y-2">
                          <div className="flex items-center gap-2 text-[12px] text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="size-3.5 shrink-0" />
                            <span>Course will be reviewed by admin</span>
                          </div>
                          <div className="flex items-center gap-2 text-[12px] text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="size-3.5 shrink-0" />
                            <span>Available to students after approval</span>
                          </div>
                          <div className="flex items-center gap-2 text-[12px] text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="size-3.5 shrink-0" />
                            <span>Admin review typically takes 24–48 hours</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* ─── Option 2: Schedule Publication ─── */}
            <motion.div
              whileTap={{ scale: 0.998 }}
              className={cn(
                'rounded-2xl border-2 p-5 cursor-pointer transition-all',
                form.publishOption === 'scheduled'
                  ? 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20 ios-shadow'
                  : 'border-border hover:border-blue-300/50 ios-shadow-sm'
              )}
              onClick={() => onFormChange({ publishOption: 'scheduled' })}
            >
              <div className="flex items-start gap-4">
                <RadioGroupItem value="scheduled" id="scheduled" className="mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex size-10 items-center justify-center rounded-xl shrink-0',
                      form.publishOption === 'scheduled'
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                        : 'bg-muted text-muted-foreground'
                    )}>
                      <CalendarClock className="size-5" />
                    </div>
                    <Label htmlFor="scheduled" className="cursor-pointer">
                      <span className="text-[15px] font-bold block">Schedule Publication</span>
                      <span className="text-[12px] text-muted-foreground block mt-0.5">
                        Submit for review now, go live at a specific date after approval
                      </span>
                    </Label>
                  </div>

                  <AnimatePresence>
                    {form.publishOption === 'scheduled' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={SPRING}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 ml-[52px] space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="space-y-1.5 flex-1">
                              <Label className="text-[12px] font-semibold">Go-Live Date</Label>
                              <Input
                                type="date"
                                value={form.scheduledDate}
                                onChange={(e) => onFormChange({ scheduledDate: e.target.value })}
                                className="h-10 rounded-xl text-[13px]"
                              />
                            </div>
                            <div className="space-y-1.5 flex-1">
                              <Label className="text-[12px] font-semibold">Go-Live Time</Label>
                              <Input
                                type="time"
                                value={form.scheduledTime}
                                onChange={(e) => onFormChange({ scheduledTime: e.target.value })}
                                className="h-10 rounded-xl text-[13px]"
                              />
                            </div>
                          </div>
                          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/30 p-3">
                            <p className="text-[12px] text-blue-700 dark:text-blue-400 flex items-start gap-2">
                              <Info className="size-3.5 shrink-0 mt-0.5" />
                              Your course will be submitted for review now. After admin approval, it will automatically go live at the scheduled date and time.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* ─── Option 3: Save as Draft ─── */}
            <motion.div
              whileTap={{ scale: 0.998 }}
              className={cn(
                'rounded-2xl border-2 p-5 cursor-pointer transition-all',
                form.publishOption === 'draft'
                  ? 'border-slate-400/50 bg-slate-50/50 dark:bg-slate-900/30 ios-shadow'
                  : 'border-border hover:border-slate-300/50 ios-shadow-sm'
              )}
              onClick={() => onFormChange({ publishOption: 'draft' })}
            >
              <div className="flex items-start gap-4">
                <RadioGroupItem value="draft" id="draft" className="mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'flex size-10 items-center justify-center rounded-xl shrink-0',
                      form.publishOption === 'draft'
                        ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        : 'bg-muted text-muted-foreground'
                    )}>
                      <Save className="size-5" />
                    </div>
                    <Label htmlFor="draft" className="cursor-pointer">
                      <span className="text-[15px] font-bold block">Save as Draft</span>
                      <span className="text-[12px] text-muted-foreground block mt-0.5">
                        Continue working later — only you can see draft courses
                      </span>
                    </Label>
                  </div>

                  <AnimatePresence>
                    {form.publishOption === 'draft' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={SPRING}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 ml-[52px] rounded-xl bg-slate-100 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/40 p-3 space-y-2">
                          <div className="flex items-center gap-2 text-[12px] text-slate-600 dark:text-slate-400">
                            <Info className="size-3.5 shrink-0" />
                            <span>Draft is auto-saved every 30 seconds</span>
                          </div>
                          <div className="flex items-center gap-2 text-[12px] text-slate-600 dark:text-slate-400">
                            <Info className="size-3.5 shrink-0" />
                            <span>Not visible to students or admins</span>
                          </div>
                          <div className="flex items-center gap-2 text-[12px] text-slate-600 dark:text-slate-400">
                            <Info className="size-3.5 shrink-0" />
                            <span>Submit for review when you&apos;re ready</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </RadioGroup>
        </div>

        {/* ─── Admin Review Notice ─── */}
        {form.publishOption === 'scheduled' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING}
            className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 shrink-0">
                <Shield className="size-4" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-amber-700 dark:text-amber-400">
                  Admin Review Required for Scheduling
                </p>
                <p className="text-[12px] text-amber-600/80 dark:text-amber-400/70 mt-0.5">
                  Scheduled courses go through an admin review before becoming visible. Review typically takes 24–48 hours.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Action Buttons ─── */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-2xl h-12 ios-press gap-2 text-[14px] font-semibold"
              onClick={onPreview}
            >
              <Eye className="size-4" />
              Preview as Student
            </Button>
            <Button
              type="button"
              className={cn(
                'rounded-2xl h-12 ios-press gap-2 text-[14px] font-semibold',
                form.publishOption === 'draft'
                  ? 'bg-slate-700 hover:bg-slate-800 text-white dark:bg-slate-600 dark:hover:bg-slate-700'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
              )}
              onClick={handleSubmitClick}
            >
              {submitButtonIcon}
              {submitButtonLabel}
            </Button>
          </div>

          {form.publishOption === 'draft' && (
            <p className="text-[12px] text-muted-foreground text-center flex items-center justify-center gap-1">
              <Info className="size-3" />
              Drafts are saved automatically and can be resumed anytime
            </p>
          )}
        </div>

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
          <div />
        </div>
      </motion.div>

      {/* ─── Confirmation Dialog ─── */}
      <ConfirmSubmitDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSubmit}
        publishOption={form.publishOption}
        scheduledDate={form.scheduledDate}
        scheduledTime={form.scheduledTime}
        courseName={form.title || 'Untitled Course'}
      />
    </div>
  )
}

export default Step6Review
