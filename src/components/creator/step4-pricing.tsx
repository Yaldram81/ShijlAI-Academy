'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign, Tag, Users, Clock, Shield, Gift, Calendar,
  ChevronDown, Check, X, Plus, Trash2, Sparkles, Loader2,
  AlertCircle, Infinity, Lock, Unlock, Award, BookOpen,
  ToggleLeft, ToggleRight, GraduationCap, Timer,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { CourseFormData, DiscountCode, DripScheduleItem } from './types'
import { PRICING_MODELS, SPRING, CARD_SPRING, generateId } from './constants'
import { useAppStore } from '@/lib/store'

// ─── Props ───

export interface Step4PricingProps {
  form: CourseFormData
  onFormChange: (updates: Partial<CourseFormData>) => void
  onPrevious: () => void
  onNext: () => void
}

// ─── Helpers ───

// generateId imported from constants

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

// ─── Pricing Model Card ───

function PricingModelCard({
  model,
  isSelected,
  onClick,
}: {
  model: typeof PRICING_MODELS[number]
  isSelected: boolean
  onClick: () => void
}) {
  const icons: Record<string, React.ReactNode> = {
    free: <Gift className="size-5" />,
    paid: <DollarSign className="size-5" />,
    subscription: <Clock className="size-5" />,
    freemium: <Unlock className="size-5" />,
    cohort: <Users className="size-5" />,
  }

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        'rounded-2xl p-4 text-left transition-all border ios-press relative',
        isSelected
          ? 'bg-primary/5 border-primary/30 ios-shadow'
          : 'bg-card border-border hover:border-primary/20 ios-shadow-sm'
      )}
    >
      {isSelected && (
        <div className="absolute top-3 right-3">
          <div className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="size-3" />
          </div>
        </div>
      )}
      <div className={cn(
        'flex size-10 items-center justify-center rounded-xl mb-3 transition-colors',
        isSelected
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground'
      )}>
        {icons[model.value]}
      </div>
      <p className={cn(
        'text-[14px] font-semibold',
        isSelected ? 'text-primary' : 'text-foreground'
      )}>
        {model.label}
      </p>
      <p className="text-[12px] text-muted-foreground mt-1 leading-tight">
        {model.desc}
      </p>
    </motion.button>
  )
}

// ─── Discount Code Dialog ───

function DiscountCodeRow({
  code,
  onRemove,
}: {
  code: DiscountCode
  onRemove: () => void
}) {
  return (
    <motion.div
      layout={SPRING}
      className="grid grid-cols-[1fr_80px_80px_100px_60px_32px] gap-2 items-center py-2 px-3 rounded-xl hover:bg-muted/30 transition-colors"
    >
      <span className="text-[13px] font-mono font-medium truncate">{code.code}</span>
      <span className="text-[13px] font-medium">
        {code.type === 'percentage' ? `${code.discount}%` :
         code.type === 'fixed' ? `$${code.discount}` :
         'Free'}
      </span>
      <Badge
        variant="outline"
        className={cn(
          'text-[10px] h-5 rounded-lg justify-center',
          code.type === 'percentage' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400' :
          code.type === 'fixed' ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/30 dark:text-teal-400' :
          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400'
        )}
      >
        {code.type}
      </Badge>
      <span className="text-[12px] text-muted-foreground">
        {code.expiryDate || 'Never'}
      </span>
      <span className="text-[12px] text-muted-foreground text-center">
        {code.usedCount}/{code.maxUses || '∞'}
      </span>
      <button
        onClick={onRemove}
        className="flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        <Trash2 className="size-3" />
      </button>
    </motion.div>
  )
}

// ─── Drip Schedule Row ───

function DripScheduleRow({
  item,
  index,
  onUpdate,
  onRemove,
}: {
  item: DripScheduleItem
  index: number
  onUpdate: (updates: Partial<DripScheduleItem>) => void
  onRemove: () => void
}) {
  return (
    <motion.div
      layout={SPRING}
      className="flex items-center gap-3 rounded-xl bg-card ios-shadow-sm p-3"
    >
      <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-[12px] shrink-0">
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium truncate">{item.moduleTitle}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[12px] text-muted-foreground">Day</span>
        <Input
          type="number"
          value={item.releaseAfterDays}
          onChange={(e) => onUpdate({ releaseAfterDays: Math.max(0, parseInt(e.target.value) || 0) })}
          className="h-8 w-16 rounded-xl text-[13px] text-center"
          min={0}
        />
      </div>
      <button
        onClick={onRemove}
        className="flex size-6 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
      >
        <X className="size-3" />
      </button>
    </motion.div>
  )
}

// ─── Main Component ───

export function Step4Pricing({ form, onFormChange, onPrevious, onNext }: Step4PricingProps) {
  const [showNewDiscount, setShowNewDiscount] = useState(false)
  const [newDiscount, setNewDiscount] = useState({
    code: '',
    discount: 10,
    type: 'percentage' as DiscountCode['type'],
    expiryDate: '',
    maxUses: 100,
  })
  const [aiSuggestingPrice, setAiSuggestingPrice] = useState(false)

  // ─── Financial Settings (dynamic commission rates) ───
  const { currentUser } = useAppStore()
  const [commissionRate, setCommissionRate] = useState(20) // platform fee %
  const [payoutRate, setPayoutRate] = useState(80)       // instructor earnings %

  useEffect(() => {
    if (!currentUser?.id) return
    const fetchFinancialSettings = async () => {
      try {
        const res = await fetch(`/api/instructor/financial-settings?instructorId=${currentUser.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.effectiveRates) {
            setCommissionRate(data.effectiveRates.platformCommissionRate)
            setPayoutRate(data.effectiveRates.instructorPayoutRate)
          }
        }
      } catch {
        // Silently fail - use defaults (20/80)
      }
    }
    fetchFinancialSettings()
  }, [currentUser?.id])

  // ─── AI Price Suggestion ───

  const handleAISuggestPrice = async () => {
    setAiSuggestingPrice(true)
    await new Promise(r => setTimeout(r, 1500))
    const suggestedUSD = form.difficultyLevel === 'beginner' ? 12 :
                         form.difficultyLevel === 'intermediate' ? 20 : 29
    onFormChange({ priceUSD: suggestedUSD })
    toast.success('AI price suggestion applied!', {
      description: `$${suggestedUSD} based on course level`
    })
    setAiSuggestingPrice(false)
  }

  // ─── Discount Code CRUD ───

  const addDiscountCode = () => {
    if (!newDiscount.code.trim()) {
      toast.error('Please enter a discount code')
      return
    }
    const code: DiscountCode = {
      id: generateId('dc'),
      code: newDiscount.code.trim().toUpperCase(),
      discount: newDiscount.discount,
      type: newDiscount.type,
      expiryDate: newDiscount.expiryDate,
      maxUses: newDiscount.maxUses,
      usedCount: 0,
    }
    onFormChange({ discountCodes: [...form.discountCodes, code] })
    setNewDiscount({ code: '', discount: 10, type: 'percentage', expiryDate: '', maxUses: 100 })
    setShowNewDiscount(false)
    toast.success('Discount code created!')
  }

  const removeDiscountCode = (id: string) => {
    onFormChange({ discountCodes: form.discountCodes.filter(dc => dc.id !== id) })
    toast.success('Discount code removed')
  }

  // ─── Drip Schedule ───

  const updateDripItem = (index: number, updates: Partial<DripScheduleItem>) => {
    const updated = [...form.dripSchedule]
    updated[index] = { ...updated[index], ...updates }
    onFormChange({ dripSchedule: updated })
  }

  const removeDripItem = (index: number) => {
    onFormChange({ dripSchedule: form.dripSchedule.filter((_, i) => i !== index) })
  }

  // Initialize drip schedule from modules when toggled on
  const handleDripToggle = (enabled: boolean) => {
    onFormChange({ dripContent: enabled })
    if (enabled && form.dripSchedule.length === 0 && form.modules.length > 0) {
      const schedule: DripScheduleItem[] = form.modules.map((m, i) => ({
        moduleId: m.id,
        moduleTitle: m.title,
        releaseAfterDays: i * 7,
      }))
      onFormChange({ dripSchedule: schedule })
    }
  }

  // ─── Prerequisite Courses ───

  const [prereqInput, setPrereqInput] = useState('')

  const addPrerequisite = () => {
    if (!prereqInput.trim()) return
    if (form.prerequisiteCourses.includes(prereqInput.trim())) {
      toast.error('This prerequisite is already added')
      return
    }
    onFormChange({ prerequisiteCourses: [...form.prerequisiteCourses, prereqInput.trim()] })
    setPrereqInput('')
  }

  const removePrerequisite = (course: string) => {
    onFormChange({ prerequisiteCourses: form.prerequisiteCourses.filter(c => c !== course) })
  }

  // ─── Price Range Suggestion ───

  const priceRange = useMemo(() => {
    if (form.pricingModel !== 'paid') return null
    const ranges: Record<string, { min: number; max: number; minUSD: number; maxUSD: number }> = {
      beginner: { min: 999, max: 2999, minUSD: 8, maxUSD: 18 },
      intermediate: { min: 2499, max: 4999, minUSD: 15, maxUSD: 30 },
      advanced: { min: 3999, max: 7999, minUSD: 25, maxUSD: 50 },
    }
    return ranges[form.difficultyLevel] || ranges.beginner
  }, [form.pricingModel, form.difficultyLevel])

  // ─── Validation ───

  const canProceed = form.pricingModel === 'free' || form.priceUSD > 0

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING}
        className="space-y-6"
      >
        {/* ─── Pricing Model ─── */}
        <div className="space-y-3">
          <Label className="text-[14px] font-semibold flex items-center gap-2">
            <DollarSign className="size-4 text-primary" />
            Pricing Model <span className="text-destructive">*</span>
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {PRICING_MODELS.map((model) => (
              <PricingModelCard
                key={model.value}
                model={model}
                isSelected={form.pricingModel === model.value}
                onClick={() => onFormChange({ pricingModel: model.value })}
              />
            ))}
          </div>
        </div>

        {/* ─── Price Inputs (shown for paid/freemium) ─── */}
        <AnimatePresence>
          {(form.pricingModel === 'paid' || form.pricingModel === 'freemium') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={SPRING}
              className="overflow-hidden"
            >
              <div className="rounded-2xl ios-shadow-sm bg-card p-4 space-y-4 border border-primary/10">
                <div className="flex items-center justify-between">
                  <Label className="text-[14px] font-semibold flex items-center gap-2">
                    <Tag className="size-4 text-primary" />
                    Course Price
                  </Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-xl h-8 gap-1.5 text-primary hover:bg-primary/10 ios-press"
                    onClick={handleAISuggestPrice}
                    disabled={aiSuggestingPrice}
                  >
                    {aiSuggestingPrice ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                    AI Suggest Price
                  </Button>
                </div>

                {/* AI Suggested Range */}
                {priceRange && (
                  <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
                    <p className="text-[12px] font-medium text-primary flex items-center gap-1.5">
                      <Sparkles className="size-3" />
                      AI Suggested Range for {form.difficultyLevel} level
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <div>
                        <span className="text-[11px] text-muted-foreground">USD</span>
                        <p className="text-[14px] font-semibold">${priceRange.minUSD} – ${priceRange.maxUSD}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-[13px] font-medium">Price (USD)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px] font-semibold text-muted-foreground">$</span>
                    <Input
                      type="number"
                      value={form.priceUSD || ''}
                      onChange={(e) => onFormChange({ priceUSD: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="h-11 rounded-2xl text-[15px] pl-8"
                      placeholder="0"
                      min={0}
                    />
                  </div>
                </div>

                {/* Revenue Split Preview */}
                {form.priceUSD > 0 && (
                  <div className="rounded-xl bg-muted/50 p-3 space-y-2">
                    <p className="text-[12px] font-medium text-muted-foreground">Revenue Split Preview ({payoutRate}/{commissionRate})</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span>Your earnings</span>
                          <span className="font-semibold text-emerald-600">${Math.round(form.priceUSD * payoutRate / 100).toLocaleString()}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${payoutRate}%` }} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-[11px] mb-1">
                          <span>Platform fee</span>
                          <span className="font-semibold text-muted-foreground">${Math.round(form.priceUSD * commissionRate / 100).toLocaleString()}</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-muted-foreground/30" style={{ width: `${commissionRate}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Separator />

        {/* ─── Discount / Coupon Codes ─── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-[14px] font-semibold flex items-center gap-2">
              <Gift className="size-4 text-primary" />
              Discount / Coupon Codes
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl h-8 gap-1.5 ios-press"
              onClick={() => setShowNewDiscount(true)}
              disabled={showNewDiscount}
            >
              <Plus className="size-3.5" />
              Create New
            </Button>
          </div>

          {form.discountCodes.length > 0 && (
            <div className="rounded-2xl ios-shadow-sm bg-card border border-border overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-[1fr_80px_80px_100px_60px_32px] gap-2 items-center py-2 px-3 bg-muted/30 border-b border-border">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Code</span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Discount</span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Type</span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Expiry</span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase text-center">Uses</span>
                <span />
              </div>
              <ScrollArea className="max-h-48">
                {form.discountCodes.map((dc) => (
                  <DiscountCodeRow
                    key={dc.id}
                    code={dc}
                    onRemove={() => removeDiscountCode(dc.id)}
                  />
                ))}
              </ScrollArea>
            </div>
          )}

          {form.discountCodes.length === 0 && !showNewDiscount && (
            <div className="text-center py-6 rounded-2xl border-2 border-dashed border-border">
              <Gift className="mx-auto size-6 text-muted-foreground/40" />
              <p className="mt-2 text-[13px] text-muted-foreground">No discount codes yet</p>
              <p className="text-[11px] text-muted-foreground/70">Create coupon codes to offer promotions</p>
            </div>
          )}

          {/* New Discount Code Form */}
          <AnimatePresence>
            {showNewDiscount && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={SPRING}
                className="overflow-hidden"
              >
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-primary flex items-center gap-2">
                      <Plus className="size-4" />
                      Create Discount Code
                    </span>
                    <Button variant="ghost" size="icon" className="size-7 rounded-xl" onClick={() => setShowNewDiscount(false)}>
                      <X className="size-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[12px] font-medium">Code *</Label>
                      <Input
                        value={newDiscount.code}
                        onChange={(e) => setNewDiscount(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                        className="h-9 rounded-xl text-[13px] font-mono"
                        placeholder="e.g. SUMMER2024"
                        maxLength={20}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[12px] font-medium">Type</Label>
                      <Select
                        value={newDiscount.type}
                        onValueChange={(v) => setNewDiscount(prev => ({ ...prev, type: v as DiscountCode['type'] }))}
                      >
                        <SelectTrigger className="h-9 rounded-xl text-[13px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage (%)</SelectItem>
                          <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                          <SelectItem value="full">100% Off (Free)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[12px] font-medium">Discount Value</Label>
                      <Input
                        type="number"
                        value={newDiscount.discount}
                        onChange={(e) => setNewDiscount(prev => ({ ...prev, discount: Math.max(0, parseInt(e.target.value) || 0) }))}
                        className="h-9 rounded-xl text-[13px]"
                        min={0}
                        max={newDiscount.type === 'percentage' ? 100 : undefined}
                        disabled={newDiscount.type === 'full'}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[12px] font-medium">Expiry Date</Label>
                      <Input
                        type="date"
                        value={newDiscount.expiryDate}
                        onChange={(e) => setNewDiscount(prev => ({ ...prev, expiryDate: e.target.value }))}
                        className="h-9 rounded-xl text-[13px]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[12px] font-medium">Max Uses</Label>
                      <Input
                        type="number"
                        value={newDiscount.maxUses || ''}
                        onChange={(e) => setNewDiscount(prev => ({ ...prev, maxUses: Math.max(1, parseInt(e.target.value) || 0) }))}
                        className="h-9 rounded-xl text-[13px]"
                        placeholder="Unlimited"
                        min={1}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl ios-press" onClick={() => setShowNewDiscount(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-xl ios-press gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                      onClick={addDiscountCode}
                      disabled={!newDiscount.code.trim()}
                    >
                      <Check className="size-3.5" />
                      Create Code
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Separator />

        {/* ─── Enrollment Settings ─── */}
        <div className="space-y-4">
          <Label className="text-[14px] font-semibold flex items-center gap-2">
            <Users className="size-4 text-primary" />
            Enrollment Settings
          </Label>

          <div className="rounded-2xl ios-shadow-sm bg-card p-4 space-y-4">
            {/* Enrollment Deadline */}
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Enrollment Deadline</Label>
              <RadioGroup
                value={form.enrollmentDeadline}
                onValueChange={(v) => onFormChange({ enrollmentDeadline: v as 'always' | 'set_date' })}
                className="flex flex-col sm:flex-row gap-2"
              >
                <div className="flex items-center gap-2 rounded-xl border border-border p-3 flex-1 cursor-pointer hover:border-primary/30 transition-colors">
                  <RadioGroupItem value="always" id="always" />
                  <Label htmlFor="always" className="cursor-pointer flex-1">
                    <span className="text-[13px] font-medium">Always Open</span>
                    <span className="block text-[11px] text-muted-foreground">Students can enroll anytime</span>
                  </Label>
                  <Infinity className="size-4 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-border p-3 flex-1 cursor-pointer hover:border-primary/30 transition-colors">
                  <RadioGroupItem value="set_date" id="set_date" />
                  <Label htmlFor="set_date" className="cursor-pointer flex-1">
                    <span className="text-[13px] font-medium">Set Closing Date</span>
                    <span className="block text-[11px] text-muted-foreground">Close enrollment after a date</span>
                  </Label>
                  <Calendar className="size-4 text-muted-foreground" />
                </div>
              </RadioGroup>
              <AnimatePresence>
                {form.enrollmentDeadline === 'set_date' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={SPRING}
                    className="overflow-hidden"
                  >
                    <Input
                      type="date"
                      value={form.enrollmentDeadlineDate}
                      onChange={(e) => onFormChange({ enrollmentDeadlineDate: e.target.value })}
                      className="h-10 rounded-xl text-[13px] max-w-xs"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Separator />

            {/* Student Limit */}
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Student Limit</Label>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => onFormChange({ studentLimitEnabled: false })}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border p-3 flex-1 text-left transition-all',
                    !form.studentLimitEnabled
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border hover:border-primary/20'
                  )}
                >
                  <Infinity className={cn('size-4', !form.studentLimitEnabled ? 'text-primary' : 'text-muted-foreground')} />
                  <div>
                    <span className="text-[13px] font-medium">Unlimited</span>
                    <span className="block text-[11px] text-muted-foreground">No cap on enrollments</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onFormChange({ studentLimitEnabled: true })}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border p-3 flex-1 text-left transition-all',
                    form.studentLimitEnabled
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border hover:border-primary/20'
                  )}
                >
                  <Users className={cn('size-4', form.studentLimitEnabled ? 'text-primary' : 'text-muted-foreground')} />
                  <div>
                    <span className="text-[13px] font-medium">Cap at N students</span>
                    <span className="block text-[11px] text-muted-foreground">Limit total enrollments</span>
                  </div>
                </button>
              </div>
              <AnimatePresence>
                {form.studentLimitEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={SPRING}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-3">
                      <Label className="text-[12px] text-muted-foreground shrink-0">Max students:</Label>
                      <Input
                        type="number"
                        value={form.studentLimit || ''}
                        onChange={(e) => onFormChange({ studentLimit: Math.max(1, parseInt(e.target.value) || 0) })}
                        className="h-9 w-24 rounded-xl text-[13px]"
                        min={1}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Separator />

            {/* Certificate Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[13px] font-semibold flex items-center gap-2">
                  <Award className="size-4 text-primary" />
                  Certificate on Completion
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Issue a certificate when students complete the course
                </p>
              </div>
              <Switch
                checked={form.certificateEnabled}
                onCheckedChange={(v) => onFormChange({ certificateEnabled: v })}
              />
            </div>

            <Separator />

            {/* Prerequisite Courses */}
            <div className="space-y-2">
              <Label className="text-[13px] font-medium flex items-center gap-2">
                <GraduationCap className="size-4 text-primary" />
                Prerequisite Courses
              </Label>
              {form.prerequisiteCourses.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.prerequisiteCourses.map((course) => (
                    <Badge
                      key={course}
                      variant="secondary"
                      className="rounded-lg text-[12px] pr-1 gap-1 bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      {course}
                      <button
                        onClick={() => removePrerequisite(course)}
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
                  value={prereqInput}
                  onChange={(e) => setPrereqInput(e.target.value)}
                  className="h-9 rounded-xl text-[13px] flex-1"
                  placeholder="Course name or ID..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addPrerequisite()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-9 ios-press"
                  onClick={addPrerequisite}
                  disabled={!prereqInput.trim()}
                >
                  <Plus className="size-3.5 mr-1" />
                  Add
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">Students must complete these courses before enrolling</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* ─── Access Duration ─── */}
        <div className="space-y-3">
          <Label className="text-[14px] font-semibold flex items-center gap-2">
            <Timer className="size-4 text-primary" />
            Access Duration
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => onFormChange({ accessDuration: 'lifetime' })}
              className={cn(
                'rounded-2xl p-4 text-left transition-all border ios-press',
                form.accessDuration === 'lifetime'
                  ? 'bg-primary/5 border-primary/30 ios-shadow'
                  : 'bg-card border-border hover:border-primary/20 ios-shadow-sm'
              )}
            >
              <div className={cn(
                'flex size-9 items-center justify-center rounded-xl mb-2 transition-colors',
                form.accessDuration === 'lifetime' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                <Infinity className="size-4" />
              </div>
              <p className="text-[13px] font-semibold">Lifetime Access</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Students can access forever</p>
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => onFormChange({ accessDuration: 'limited' })}
              className={cn(
                'rounded-2xl p-4 text-left transition-all border ios-press',
                form.accessDuration === 'limited'
                  ? 'bg-primary/5 border-primary/30 ios-shadow'
                  : 'bg-card border-border hover:border-primary/20 ios-shadow-sm'
              )}
            >
              <div className={cn(
                'flex size-9 items-center justify-center rounded-xl mb-2 transition-colors',
                form.accessDuration === 'limited' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                <Clock className="size-4" />
              </div>
              <p className="text-[13px] font-semibold">Limited Access</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Expires after N months</p>
            </motion.button>
          </div>
          <AnimatePresence>
            {form.accessDuration === 'limited' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={SPRING}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
                  <Label className="text-[13px] font-medium shrink-0">Access for</Label>
                  <Input
                    type="number"
                    value={form.accessDurationMonths || ''}
                    onChange={(e) => onFormChange({ accessDurationMonths: Math.max(1, parseInt(e.target.value) || 0) })}
                    className="h-9 w-20 rounded-xl text-[13px] text-center"
                    min={1}
                    max={60}
                  />
                  <span className="text-[13px] text-muted-foreground">months after enrollment</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Separator />

        {/* ─── Drip Content ─── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-[14px] font-semibold flex items-center gap-2">
                <BookOpen className="size-4 text-primary" />
                Drip Content
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Release modules gradually over time instead of all at once
              </p>
            </div>
            <Switch
              checked={form.dripContent}
              onCheckedChange={handleDripToggle}
            />
          </div>

          <AnimatePresence>
            {form.dripContent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={SPRING}
                className="overflow-hidden"
              >
                <div className="space-y-3">
                  {form.dripSchedule.length > 0 ? (
                    <div className="space-y-2">
                      {form.dripSchedule.map((item, idx) => (
                        <DripScheduleRow
                          key={item.moduleId}
                          item={item}
                          index={idx}
                          onUpdate={(updates) => updateDripItem(idx, updates)}
                          onRemove={() => removeDripItem(idx)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 rounded-2xl border-2 border-dashed border-border">
                      <BookOpen className="mx-auto size-6 text-muted-foreground/40" />
                      <p className="mt-2 text-[13px] text-muted-foreground">No modules to schedule</p>
                      <p className="text-[11px] text-muted-foreground/70">Add modules in the Curriculum step first</p>
                    </div>
                  )}

                  {form.dripSchedule.length > 0 && (
                    <div className="rounded-xl bg-primary/5 border border-primary/10 p-3">
                      <p className="text-[12px] font-medium text-primary flex items-center gap-1.5">
                        <AlertCircle className="size-3" />
                        Day 0 = Available immediately upon enrollment
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
          <Button
            onClick={() => {
              if (!canProceed && form.pricingModel !== 'free') {
                toast.error('Please set a price for your course')
                return
              }
              onNext()
            }}
            className={cn(
              'rounded-2xl ios-press gap-2 min-w-[160px]',
              canProceed || form.pricingModel === 'free'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white'
                : ''
            )}
          >
            Next: SEO
            <ChevronDown className="size-4 -rotate-90" />
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default Step4Pricing
