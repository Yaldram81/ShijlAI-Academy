'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings, Globe, UserPlus, BookOpen, CreditCard, Puzzle,
  FileText, Wrench, Save, Loader2, CheckCircle, XCircle, AlertTriangle,
  RefreshCw, X, Plus, Shield, Zap, Mail, Clock, ExternalLink,
  ToggleLeft, ToggleRight, ChevronRight, Info, Smartphone,
  Monitor, Wifi, WifiOff, Eye, EyeOff, Edit3, Search, Send,
  Server, Lock, Database, Gavel, Webhook, Trash2, Activity,
  Signal, Fingerprint, Cookie, ScanLine, Link2, ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// ─── Types ──────────────────────────────────────────────────────────────────

interface PlatformSettings {
  id: string
  platformName: string
  platformUrl: string
  supportEmail: string
  defaultTimezone: string
  defaultCurrency: string
  showUsdAlso: boolean
  platformStatus: string
  openRegistration: boolean
  emailVerificationRequired: boolean
  socialLoginGoogle: boolean
  socialLoginFacebook: boolean
  socialLoginApple: boolean
  instructorSelfRegister: boolean
  captchaOnSignup: boolean
  minimumStudentAge: number
  adminReviewBeforePublish: boolean
  maxReviewTimeHours: number
  minimumLessonsPerCourse: number
  minimumVideoDurationMinutes: number
  promoVideoRequired: boolean
  quizPerSectionRequired: boolean
  maxVideoFileSizeGb: number
  maxDocFileSizeMb: number
  supportedLanguages: string
  defaultLanguage: string
  autoDetectLanguage: boolean
  maintenanceMode: boolean
  maintenanceMessage: string
  maintenanceWhitelistIps: string | null
  maintenanceScheduledStart: string | null
  maintenanceScheduledEnd: string | null
  maintenanceNotifyUsers: boolean
  maintenanceNotifyHoursBefore: number
  smtpHost: string | null
  smtpPort: number
  smtpSecure: boolean
  smtpUser: string | null
  smtpPass: string | null
  smtpFromName: string
  smtpFromEmail: string
  smtpReplyTo: string | null
  emailHeaderImageUrl: string | null
  emailTemplateBody: string | null
  seoMetaTitle: string | null
  seoMetaDescription: string | null
  seoKeywords: string | null
  seoRobotsTxt: string
  seoCanonicalUrl: string | null
  seoSitemapEnabled: boolean
  seoGoogleSiteVerification: string | null
  dataRetentionDays: number
  gdprEnabled: boolean
  gdprDataExportEnabled: boolean
  gdprRightToBeForgotten: boolean
  gdprCookieConsent: boolean
  gdprPrivacyPolicyUrl: string | null
  anonymizeDeletedUsers: boolean
  rateLimitEnabled: boolean
  rateLimitApiPerMinute: number
  rateLimitLoginPerHour: number
  rateLimitUploadPerHour: number
  moderationAutoFlag: boolean
  moderationAiAssistance: boolean
  moderationProfanityFilter: boolean
  moderationLinkFilter: boolean
  moderationMediaScan: boolean
  moderationQueueThreshold: number
  allowedOrigins: string | null
  corsEnabled: boolean
  updatedAt: string
}

interface PaymentMethodConfig {
  id: string
  name: string
  displayName: string
  isConnected: boolean
  isActive: boolean
  config: string | null
  icon: string | null
  order: number
  createdAt: string
  updatedAt: string
}

interface IntegrationItem {
  id: string
  name: string
  displayName: string
  category: string
  isConnected: boolean
  config: string | null
  usageInfo: string | null
  icon: string | null
  order: number
  createdAt: string
  updatedAt: string
}

interface LegalPageItem {
  id: string
  name: string
  displayName: string
  content: string
  lastUpdatedAt: string
  createdAt: string
  updatedAt: string
}

interface WebhookConfig {
  id: string
  name: string
  url: string
  secret: string | null
  events: string
  isActive: boolean
  lastTriggeredAt: string | null
  lastResponseStatus: number | null
  failureCount: number
  createdAt: string
  updatedAt: string
}

// ─── Constants ──────────────────────────────────────────────────────────────

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

const TIMEZONE_OPTIONS = [
  { value: 'Asia/Karachi', label: 'Asia/Karachi (PKT +5)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST +4)' },
  { value: 'Asia/Riyadh', label: 'Asia/Riyadh (AST +3)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST +5:30)' },
  { value: 'Europe/London', label: 'Europe/London (GMT +0)' },
  { value: 'America/New_York', label: 'America/New_York (EST -5)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST -8)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST +8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST +9)' },
  { value: 'UTC', label: 'UTC' },
]

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — British Pound' },
]

const INTEGRATION_CATEGORIES: Record<string, { label: string; color: string }> = {
  ai: { label: 'AI & Machine Learning', color: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400' },
  video: { label: 'Video & Media', color: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' },
  analytics: { label: 'Analytics', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
  marketing: { label: 'Marketing', color: 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400' },
  communication: { label: 'Communication', color: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400' },
  automation: { label: 'Automation', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' },
}

const WEBHOOK_EVENTS = [
  { id: 'user.created', label: 'User Created', description: 'New user registers' },
  { id: 'enrollment.created', label: 'Enrollment Created', description: 'User enrolls in course' },
  { id: 'payment.completed', label: 'Payment Completed', description: 'Payment successfully processed' },
  { id: 'course.published', label: 'Course Published', description: 'Course goes live' },
  { id: 'assignment.submitted', label: 'Assignment Submitted', description: 'Student submits assignment' },
  { id: 'review.posted', label: 'Review Posted', description: 'Student posts a review' },
  { id: 'user.suspended', label: 'User Suspended', description: 'User account suspended' },
  { id: 'refund.requested', label: 'Refund Requested', description: 'Refund request submitted' },
  { id: 'instructor.applied', label: 'Instructor Applied', description: 'Instructor application submitted' },
  { id: 'certificate.issued', label: 'Certificate Issued', description: 'Certificate generated' },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function maskConfig(config: string | null): string {
  if (!config) return 'Not configured'
  try {
    const parsed = JSON.parse(config)
    const keys = Object.keys(parsed)
    if (keys.length === 0) return 'Empty configuration'
    return keys.map(k => {
      const val = String(parsed[k])
      if (val.length <= 4) return `${k}: ****`
      return `${k}: ${val.slice(0, 3)}...${val.slice(-2)}`
    }).join(', ')
  } catch {
    return 'Invalid configuration'
  }
}

function maskSecret(secret: string | null): string {
  if (!secret) return ''
  if (secret.length <= 4) return '****'
  return `${secret.slice(0, 3)}${'*'.repeat(Math.min(secret.length - 4, 12))}${secret.slice(-2)}`
}

// ─── Loading Skeleton ───────────────────────────────────────────────────────

function PlatformSettingsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-lg flex-shrink-0" />
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}

// ─── Shared Section Card Component ──────────────────────────────────────────

function SectionCard({ icon, iconBg, title, subtitle, children }: {
  icon: React.ReactNode
  iconBg: string
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={cn('flex size-10 items-center justify-center rounded-xl', iconBg)}>
            {icon}
          </div>
          <div>
            <CardTitle className="text-[16px] font-bold">{title}</CardTitle>
            <p className="text-[12px] text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

function SettingsRow({ label, description, children }: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border p-3 gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

function NumberField({ label, value, onChange, unit, min, max, className }: {
  label: string
  value: number
  onChange: (v: number) => void
  unit?: string
  min?: number
  max?: number
  className?: string
}) {
  return (
    <div className="space-y-2">
      <Label className="text-[13px] font-medium">{label}</Label>
      <div className="flex items-center gap-3">
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className={cn('rounded-xl h-10', className || 'w-28')}
          min={min}
          max={max}
        />
        {unit && <span className="text-[13px] text-muted-foreground">{unit}</span>}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function AdminPlatformSettingsWrapped() {
  return <AdminPlatformSettings />
}

export function AdminPlatformSettings() {
  // ── Active Tab ──
  const [activeTab, setActiveTab] = useState('general')

  // ── Toast State ──
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const toastTimeout = useRef<NodeJS.Timeout | null>(null)

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    toastTimeout.current = setTimeout(() => setToast(null), 4000)
  }, [])

  // ── Data State ──
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>([])
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([])
  const [legalPages, setLegalPages] = useState<LegalPageItem[]>([])
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // ── Reveal passwords ──
  const [revealSmtpPass, setRevealSmtpPass] = useState(false)
  const [revealWebhookSecret, setRevealWebhookSecret] = useState<string | null>(null)

  // ── Dialog States ──
  const [configurePaymentOpen, setConfigurePaymentOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<PaymentMethodConfig | null>(null)
  const [paymentConfigForm, setPaymentConfigForm] = useState<Record<string, string>>({})

  const [configureIntegrationOpen, setConfigureIntegrationOpen] = useState(false)
  const [editingIntegration, setEditingIntegration] = useState<IntegrationItem | null>(null)
  const [integrationConfigForm, setIntegrationConfigForm] = useState<Record<string, string>>({})
  const [revealIntegrationConfig, setRevealIntegrationConfig] = useState(false)

  const [editLegalPageOpen, setEditLegalPageOpen] = useState(false)
  const [editingLegalPage, setEditingLegalPage] = useState<LegalPageItem | null>(null)
  const [legalPageContent, setLegalPageContent] = useState('')

  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null)
  const [webhookForm, setWebhookForm] = useState({ name: '', url: '', secret: '', events: [] as string[], isActive: true })
  const [deleteWebhookOpen, setDeleteWebhookOpen] = useState(false)
  const [deletingWebhook, setDeletingWebhook] = useState<WebhookConfig | null>(null)
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null)

  const [systemHealthOpen, setSystemHealthOpen] = useState(false)
  const [systemHealth, setSystemHealth] = useState<Record<string, unknown> | null>(null)

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings')
      if (!res.ok) throw new Error('Failed to fetch settings')
      const json = await res.json()
      setSettings(json.settings)
      setPaymentMethods(json.paymentMethods || [])
      setIntegrations(json.integrations || [])
      setLegalPages(json.legalPages || [])
      setWebhooks(json.webhooks || [])
    } catch {
      showToast('error', 'Failed to load platform settings')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Settings update helper ──
  const updateSettings = useCallback(<K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : prev)
  }, [])

  // ── Save settings ──
  const handleSaveSettings = useCallback(async () => {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'settings', ...settings }),
      })
      if (!res.ok) throw new Error('Failed to save settings')
      const json = await res.json()
      setSettings(json.settings)
      showToast('success', 'Platform settings saved successfully')
    } catch {
      showToast('error', 'Failed to save platform settings')
    } finally {
      setSaving(false)
    }
  }, [settings, showToast])

  // ── Payment method actions ──
  const handleTogglePaymentActive = useCallback(async (pm: PaymentMethodConfig) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'paymentMethod', id: pm.id, isActive: !pm.isActive }),
      })
      if (!res.ok) throw new Error('Failed to update payment method')
      const json = await res.json()
      setPaymentMethods(prev => prev.map(p => p.id === pm.id ? json.paymentMethod : p))
      showToast('success', `${pm.displayName} ${pm.isActive ? 'disabled' : 'enabled'}`)
    } catch {
      showToast('error', 'Failed to update payment method')
    }
  }, [showToast])

  const openConfigurePayment = useCallback((pm: PaymentMethodConfig) => {
    setEditingPayment(pm)
    try {
      const parsed = pm.config ? JSON.parse(pm.config) : {}
      setPaymentConfigForm(parsed)
    } catch {
      setPaymentConfigForm({})
    }
    setConfigurePaymentOpen(true)
  }, [])

  const handleSavePaymentConfig = useCallback(async () => {
    if (!editingPayment) return
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'paymentMethod',
          id: editingPayment.id,
          config: JSON.stringify(paymentConfigForm),
          isConnected: true,
        }),
      })
      if (!res.ok) throw new Error('Failed to save payment config')
      const json = await res.json()
      setPaymentMethods(prev => prev.map(p => p.id === editingPayment.id ? json.paymentMethod : p))
      setConfigurePaymentOpen(false)
      setEditingPayment(null)
      showToast('success', `${editingPayment.displayName} configuration saved`)
    } catch {
      showToast('error', 'Failed to save payment configuration')
    }
  }, [editingPayment, paymentConfigForm, showToast])

  // ── Integration actions ──
  const openConfigureIntegration = useCallback((ig: IntegrationItem) => {
    setEditingIntegration(ig)
    try {
      const parsed = ig.config ? JSON.parse(ig.config) : {}
      setIntegrationConfigForm(parsed)
    } catch {
      setIntegrationConfigForm({})
    }
    setRevealIntegrationConfig(false)
    setConfigureIntegrationOpen(true)
  }, [])

  const handleSaveIntegrationConfig = useCallback(async () => {
    if (!editingIntegration) return
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'integration',
          id: editingIntegration.id,
          config: JSON.stringify(integrationConfigForm),
          isConnected: true,
        }),
      })
      if (!res.ok) throw new Error('Failed to save integration config')
      const json = await res.json()
      setIntegrations(prev => prev.map(i => i.id === editingIntegration.id ? json.integration : i))
      setConfigureIntegrationOpen(false)
      setEditingIntegration(null)
      showToast('success', `${editingIntegration.displayName} configuration saved`)
    } catch {
      showToast('error', 'Failed to save integration configuration')
    }
  }, [editingIntegration, integrationConfigForm, showToast])

  const handleDisconnectIntegration = useCallback(async (ig: IntegrationItem) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'integration',
          id: ig.id,
          isConnected: false,
          config: null,
        }),
      })
      if (!res.ok) throw new Error('Failed to disconnect integration')
      const json = await res.json()
      setIntegrations(prev => prev.map(i => i.id === ig.id ? json.integration : i))
      setConfigureIntegrationOpen(false)
      setEditingIntegration(null)
      showToast('success', `${ig.displayName} disconnected`)
    } catch {
      showToast('error', 'Failed to disconnect integration')
    }
  }, [showToast])

  // ── Legal page actions ──
  const openEditLegalPage = useCallback((lp: LegalPageItem) => {
    setEditingLegalPage(lp)
    setLegalPageContent(lp.content)
    setEditLegalPageOpen(true)
  }, [])

  const handleSaveLegalPage = useCallback(async () => {
    if (!editingLegalPage) return
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'legalPage',
          id: editingLegalPage.id,
          content: legalPageContent,
        }),
      })
      if (!res.ok) throw new Error('Failed to save legal page')
      const json = await res.json()
      setLegalPages(prev => prev.map(lp => lp.id === editingLegalPage.id ? json.legalPage : lp))
      setEditLegalPageOpen(false)
      setEditingLegalPage(null)
      showToast('success', `${editingLegalPage.displayName} updated`)
    } catch {
      showToast('error', 'Failed to save legal page')
    }
  }, [editingLegalPage, legalPageContent, showToast])

  // ── Webhook actions ──
  const openCreateWebhook = useCallback(() => {
    setEditingWebhook(null)
    setWebhookForm({ name: '', url: '', secret: '', events: [], isActive: true })
    setWebhookDialogOpen(true)
  }, [])

  const openEditWebhook = useCallback((wh: WebhookConfig) => {
    setEditingWebhook(wh)
    let events: string[] = []
    try { events = JSON.parse(wh.events) } catch { /* empty */ }
    setWebhookForm({
      name: wh.name,
      url: wh.url,
      secret: wh.secret || '',
      events,
      isActive: wh.isActive,
    })
    setWebhookDialogOpen(true)
  }, [])

  const handleSaveWebhook = useCallback(async () => {
    if (!webhookForm.name.trim() || !webhookForm.url.trim()) {
      showToast('error', 'Webhook name and URL are required')
      return
    }
    try {
      if (editingWebhook) {
        const res = await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'webhook',
            action: 'update',
            id: editingWebhook.id,
            name: webhookForm.name,
            url: webhookForm.url,
            secret: webhookForm.secret || null,
            events: JSON.stringify(webhookForm.events),
            isActive: webhookForm.isActive,
          }),
        })
        if (!res.ok) throw new Error('Failed to update webhook')
        const json = await res.json()
        setWebhooks(prev => prev.map(w => w.id === editingWebhook.id ? json.webhook : w))
        showToast('success', `Webhook "${webhookForm.name}" updated`)
      } else {
        const res = await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'webhook',
            action: 'create',
            name: webhookForm.name,
            url: webhookForm.url,
            secret: webhookForm.secret || null,
            events: JSON.stringify(webhookForm.events),
            isActive: webhookForm.isActive,
          }),
        })
        if (!res.ok) throw new Error('Failed to create webhook')
        const json = await res.json()
        setWebhooks(prev => [json.webhook, ...prev])
        showToast('success', `Webhook "${webhookForm.name}" created`)
      }
      setWebhookDialogOpen(false)
    } catch {
      showToast('error', 'Failed to save webhook')
    }
  }, [editingWebhook, webhookForm, showToast])

  const handleDeleteWebhook = useCallback(async () => {
    if (!deletingWebhook) return
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'webhook', action: 'delete', id: deletingWebhook.id }),
      })
      if (!res.ok) throw new Error('Failed to delete webhook')
      setWebhooks(prev => prev.filter(w => w.id !== deletingWebhook.id))
      setDeleteWebhookOpen(false)
      setDeletingWebhook(null)
      showToast('success', `Webhook "${deletingWebhook.name}" deleted`)
    } catch {
      showToast('error', 'Failed to delete webhook')
    }
  }, [deletingWebhook, showToast])

  const handleTestWebhook = useCallback(async (wh: WebhookConfig) => {
    setTestingWebhook(wh.id)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'webhook', action: 'test', id: wh.id }),
      })
      if (!res.ok) throw new Error('Failed to test webhook')
      const json = await res.json()
      if (json.success) {
        showToast('success', json.message)
      } else {
        showToast('error', json.message)
      }
      // Refresh webhooks to get updated status
      const freshRes = await fetch('/api/admin/settings')
      if (freshRes.ok) {
        const freshJson = await freshRes.json()
        setWebhooks(freshJson.webhooks || [])
      }
    } catch {
      showToast('error', 'Failed to test webhook')
    } finally {
      setTestingWebhook(null)
    }
  }, [showToast])

  const handleToggleWebhookActive = useCallback(async (wh: WebhookConfig) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'webhook',
          action: 'update',
          id: wh.id,
          isActive: !wh.isActive,
        }),
      })
      if (!res.ok) throw new Error('Failed to toggle webhook')
      const json = await res.json()
      setWebhooks(prev => prev.map(w => w.id === wh.id ? json.webhook : w))
      showToast('success', `Webhook "${wh.name}" ${wh.isActive ? 'disabled' : 'enabled'}`)
    } catch {
      showToast('error', 'Failed to toggle webhook')
    }
  }, [showToast])

  // ── Test Email ──
  const [sendingTestEmail, setSendingTestEmail] = useState(false)
  const handleTestEmail = useCallback(async () => {
    setSendingTestEmail(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'testEmail' }),
      })
      if (!res.ok) throw new Error('Failed to send test email')
      const json = await res.json()
      showToast('success', json.message || 'Test email sent successfully')
    } catch {
      showToast('error', 'Failed to send test email')
    } finally {
      setSendingTestEmail(false)
    }
  }, [showToast])

  // ── System Health ──
  const [loadingHealth, setLoadingHealth] = useState(false)
  const handleSystemHealth = useCallback(async () => {
    setLoadingHealth(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'systemHealth' }),
      })
      if (!res.ok) throw new Error('Failed to get system health')
      const json = await res.json()
      setSystemHealth(json)
      setSystemHealthOpen(true)
    } catch {
      showToast('error', 'Failed to check system health')
    } finally {
      setLoadingHealth(false)
    }
  }, [showToast])

  // ── Clear Cache ──
  const handleClearCache = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'clearCache' }),
      })
      if (!res.ok) throw new Error('Failed to clear cache')
      showToast('success', 'Application cache cleared successfully')
    } catch {
      showToast('error', 'Failed to clear cache')
    }
  }, [showToast])

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TOAST
  // ═══════════════════════════════════════════════════════════════

  const renderToast = () => (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className={cn(
            'fixed top-6 left-1/2 z-[100] flex items-center gap-2 rounded-2xl px-5 py-3 ios-shadow-lg text-[14px] font-medium',
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          )}
        >
          {toast.type === 'success' ? <CheckCircle className="size-4" /> : <XCircle className="size-4" />}
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: LOADING
  // ═══════════════════════════════════════════════════════════════

  if (loading) return <PlatformSettingsLoadingSkeleton />
  if (!settings) return null

  // ═══════════════════════════════════════════════════════════════
  // TAB 1 — GENERAL
  // ═══════════════════════════════════════════════════════════════

  const renderGeneralTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <SectionCard
        icon={<Globe className="size-5 text-slate-600 dark:text-slate-400" />}
        iconBg="bg-gradient-to-br from-slate-500/20 to-gray-500/20"
        title="Platform Information"
        subtitle="Core platform identity and URLs"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[13px] font-medium">Platform Name</Label>
            <Input value={settings.platformName} onChange={(e) => updateSettings('platformName', e.target.value)} className="rounded-xl h-10" placeholder="ShijlAI Academy" />
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] font-medium">Platform URL</Label>
            <Input value={settings.platformUrl} onChange={(e) => updateSettings('platformUrl', e.target.value)} className="rounded-xl h-10" placeholder="https://shijlai.academy" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[13px] font-medium">Support Email</Label>
            <Input value={settings.supportEmail} onChange={(e) => updateSettings('supportEmail', e.target.value)} className="rounded-xl h-10" placeholder="support@shijlai.academy" type="email" />
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] font-medium">Default Timezone</Label>
            <Select value={settings.defaultTimezone} onValueChange={(v) => updateSettings('defaultTimezone', v)}>
              <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map(tz => <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={<CreditCard className="size-5 text-emerald-600 dark:text-emerald-400" />}
        iconBg="bg-gradient-to-br from-emerald-500/20 to-green-500/20"
        title="Currency & Display"
        subtitle="Pricing currency and display preferences"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[13px] font-medium">Default Currency</Label>
            <Select value={settings.defaultCurrency} onValueChange={(v) => updateSettings('defaultCurrency', v)}>
              <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <SettingsRow label="Show USD Also" description="Display USD equivalent alongside local currency">
            <Switch checked={settings.showUsdAlso} onCheckedChange={(v) => updateSettings('showUsdAlso', v)} />
          </SettingsRow>
        </div>
      </SectionCard>

      <SectionCard
        icon={<Monitor className="size-5 text-teal-600 dark:text-teal-400" />}
        iconBg="bg-gradient-to-br from-teal-500/20 to-cyan-500/20"
        title="Platform Status"
        subtitle="Control platform availability"
      >
        <div className="flex gap-2">
          <button
            onClick={() => updateSettings('platformStatus', 'online')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-all border',
              settings.platformStatus === 'online'
                ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                : 'bg-card text-muted-foreground border-border hover:text-foreground'
            )}
          >
            <Wifi className="size-4" /> Online
          </button>
          <button
            onClick={() => updateSettings('platformStatus', 'maintenance')}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-all border',
              settings.platformStatus === 'maintenance'
                ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800'
                : 'bg-card text-muted-foreground border-border hover:text-foreground'
            )}
          >
            <WifiOff className="size-4" /> Maintenance Mode
          </button>
        </div>
        {settings.platformStatus === 'maintenance' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-[12px] text-amber-700 dark:text-amber-400">Platform is in maintenance mode. Users will see the maintenance page. Configure details in the Legal &amp; Maintenance tab.</p>
          </motion.div>
        )}
      </SectionCard>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button onClick={handleSaveSettings} disabled={saving} className="rounded-xl px-6">
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
          Save General Settings
        </Button>
      </div>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // TAB 2 — REGISTRATION
  // ═══════════════════════════════════════════════════════════════

  const renderRegistrationTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <SectionCard
        icon={<UserPlus className="size-5 text-violet-600 dark:text-violet-400" />}
        iconBg="bg-gradient-to-br from-violet-500/20 to-purple-500/20"
        title="Registration Settings"
        subtitle="Control how users sign up on the platform"
      >
        <div className="space-y-2">
          <Label className="text-[13px] font-medium">Open Registration</Label>
          <div className="flex gap-2">
            <button onClick={() => updateSettings('openRegistration', true)} className={cn('flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium transition-all border', settings.openRegistration ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' : 'bg-card text-muted-foreground border-border hover:text-foreground')}>
              <ToggleRight className="size-4" /> Yes — Anyone can register
            </button>
            <button onClick={() => updateSettings('openRegistration', false)} className={cn('flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium transition-all border', !settings.openRegistration ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800' : 'bg-card text-muted-foreground border-border hover:text-foreground')}>
              <ToggleLeft className="size-4" /> No — Invite only
            </button>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-[13px] font-medium">Email Verification Required</Label>
          <div className="flex gap-2">
            <button onClick={() => updateSettings('emailVerificationRequired', true)} className={cn('flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium transition-all border', settings.emailVerificationRequired ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' : 'bg-card text-muted-foreground border-border hover:text-foreground')}>
              <Mail className="size-4" /> Yes — Verify before access
            </button>
            <button onClick={() => updateSettings('emailVerificationRequired', false)} className={cn('flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium transition-all border', !settings.emailVerificationRequired ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' : 'bg-card text-muted-foreground border-border hover:text-foreground')}>
              <X className="size-4" /> No — Skip verification
            </button>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label className="text-[13px] font-medium">Social Login Providers</Label>
          <p className="text-[11px] text-muted-foreground">Enable third-party authentication methods</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { key: 'socialLoginGoogle' as const, label: 'Google', icon: '🔵', desc: 'Sign in with Google' },
              { key: 'socialLoginFacebook' as const, label: 'Facebook', icon: '📘', desc: 'Sign in with Facebook' },
              { key: 'socialLoginApple' as const, label: 'Apple', icon: '🍎', desc: 'Sign in with Apple' },
            ].map(provider => (
              <div key={provider.key} className="flex items-center gap-3 rounded-xl border p-3">
                <span className="text-[18px]">{provider.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium">{provider.label}</p>
                  <p className="text-[11px] text-muted-foreground">{provider.desc}</p>
                </div>
                <Switch checked={settings[provider.key]} onCheckedChange={(v) => updateSettings(provider.key, v)} />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-[13px] font-medium">Instructor Registration</Label>
          <div className="flex gap-2">
            <button onClick={() => updateSettings('instructorSelfRegister', true)} className={cn('flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium transition-all border', settings.instructorSelfRegister ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' : 'bg-card text-muted-foreground border-border hover:text-foreground')}>
              <ToggleRight className="size-4" /> Self-register
            </button>
            <button onClick={() => updateSettings('instructorSelfRegister', false)} className={cn('flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium transition-all border', !settings.instructorSelfRegister ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' : 'bg-card text-muted-foreground border-border hover:text-foreground')}>
              <Shield className="size-4" /> Apply & approval required
            </button>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[13px] font-medium">CAPTCHA on Signup</Label>
            <div className="flex gap-2">
              <button onClick={() => updateSettings('captchaOnSignup', true)} className={cn('flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium transition-all border', settings.captchaOnSignup ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' : 'bg-card text-muted-foreground border-border hover:text-foreground')}>
                <Shield className="size-4" /> Yes
              </button>
              <button onClick={() => updateSettings('captchaOnSignup', false)} className={cn('flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium transition-all border', !settings.captchaOnSignup ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' : 'bg-card text-muted-foreground border-border hover:text-foreground')}>
                <X className="size-4" /> No
              </button>
            </div>
          </div>
          <NumberField label="Minimum Student Age" value={settings.minimumStudentAge} onChange={(v) => updateSettings('minimumStudentAge', v)} unit="years old" min={0} max={100} className="w-24" />
        </div>
      </SectionCard>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSaveSettings} disabled={saving} className="rounded-xl px-6">
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
          Save Registration Settings
        </Button>
      </div>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // TAB 3 — COURSE RULES
  // ═══════════════════════════════════════════════════════════════

  const renderCourseRulesTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <SectionCard
        icon={<BookOpen className="size-5 text-amber-600 dark:text-amber-400" />}
        iconBg="bg-gradient-to-br from-amber-500/20 to-orange-500/20"
        title="Review & Publishing"
        subtitle="Course review workflow and publishing rules"
      >
        <div className="space-y-2">
          <Label className="text-[13px] font-medium">Course Publishing</Label>
          <div className="flex gap-2">
            <button onClick={() => updateSettings('adminReviewBeforePublish', true)} className={cn('flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium transition-all border', settings.adminReviewBeforePublish ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800' : 'bg-card text-muted-foreground border-border hover:text-foreground')}>
              <Shield className="size-4" /> Admin review required
            </button>
            <button onClick={() => updateSettings('adminReviewBeforePublish', false)} className={cn('flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium transition-all border', !settings.adminReviewBeforePublish ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800' : 'bg-card text-muted-foreground border-border hover:text-foreground')}>
              <Zap className="size-4" /> Auto-publish
            </button>
          </div>
        </div>
        {settings.adminReviewBeforePublish && (
          <div className="space-y-2">
            <NumberField label="Max Review Time (SLA)" value={settings.maxReviewTimeHours} onChange={(v) => updateSettings('maxReviewTimeHours', v)} unit="hours" min={1} />
            <p className="text-[11px] text-muted-foreground">Instructors will be notified if review exceeds this time</p>
          </div>
        )}
      </SectionCard>

      <SectionCard
        icon={<FileText className="size-5 text-teal-600 dark:text-teal-400" />}
        iconBg="bg-gradient-to-br from-teal-500/20 to-cyan-500/20"
        title="Content Requirements"
        subtitle="Minimum standards for course content"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumberField label="Minimum Lessons Per Course" value={settings.minimumLessonsPerCourse} onChange={(v) => updateSettings('minimumLessonsPerCourse', v)} unit="lessons" min={1} />
          <NumberField label="Minimum Video Duration" value={settings.minimumVideoDurationMinutes} onChange={(v) => updateSettings('minimumVideoDurationMinutes', v)} unit="minutes" min={1} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SettingsRow label="Promo Video Required" description="Instructors must upload a promo video">
            <Switch checked={settings.promoVideoRequired} onCheckedChange={(v) => updateSettings('promoVideoRequired', v)} />
          </SettingsRow>
          <SettingsRow label="Quiz Per Section Required" description="Each section must have a quiz">
            <Switch checked={settings.quizPerSectionRequired} onCheckedChange={(v) => updateSettings('quizPerSectionRequired', v)} />
          </SettingsRow>
        </div>
      </SectionCard>

      <SectionCard
        icon={<Server className="size-5 text-rose-600 dark:text-rose-400" />}
        iconBg="bg-gradient-to-br from-rose-500/20 to-pink-500/20"
        title="File Size Limits"
        subtitle="Maximum allowed file sizes for uploads"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumberField label="Max Video File Size" value={settings.maxVideoFileSizeGb} onChange={(v) => updateSettings('maxVideoFileSizeGb', v)} unit="GB" min={1} max={50} />
          <NumberField label="Max Document File Size" value={settings.maxDocFileSizeMb} onChange={(v) => updateSettings('maxDocFileSizeMb', v)} unit="MB" min={1} max={500} />
        </div>
      </SectionCard>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSaveSettings} disabled={saving} className="rounded-xl px-6">
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
          Save Course Rules
        </Button>
      </div>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // TAB 4 — EMAIL & SMTP
  // ═══════════════════════════════════════════════════════════════

  const renderEmailTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <SectionCard
        icon={<Mail className="size-5 text-sky-600 dark:text-sky-400" />}
        iconBg="bg-gradient-to-br from-sky-500/20 to-blue-500/20"
        title="SMTP Configuration"
        subtitle="Configure your outgoing email server"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[13px] font-medium">SMTP Host</Label>
            <Input value={settings.smtpHost || ''} onChange={(e) => updateSettings('smtpHost', e.target.value || null)} className="rounded-xl h-10" placeholder="smtp.gmail.com" />
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] font-medium">SMTP Port</Label>
            <Input type="number" value={settings.smtpPort} onChange={(e) => updateSettings('smtpPort', parseInt(e.target.value) || 587)} className="rounded-xl h-10" placeholder="587" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[13px] font-medium">SMTP Username</Label>
            <Input value={settings.smtpUser || ''} onChange={(e) => updateSettings('smtpUser', e.target.value || null)} className="rounded-xl h-10" placeholder="your@gmail.com" />
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] font-medium">SMTP Password</Label>
            <div className="relative">
              <Input
                type={revealSmtpPass ? 'text' : 'password'}
                value={settings.smtpPass || ''}
                onChange={(e) => updateSettings('smtpPass', e.target.value || null)}
                className="rounded-xl h-10 pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setRevealSmtpPass(!revealSmtpPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {revealSmtpPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        </div>
        <SettingsRow label="Use TLS/Secure Connection" description="Enable TLS for SMTP connection">
          <Switch checked={settings.smtpSecure} onCheckedChange={(v) => updateSettings('smtpSecure', v)} />
        </SettingsRow>
      </SectionCard>

      <SectionCard
        icon={<Send className="size-5 text-emerald-600 dark:text-emerald-400" />}
        iconBg="bg-gradient-to-br from-emerald-500/20 to-green-500/20"
        title="Email Sender Details"
        subtitle="Configure how emails appear to recipients"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[13px] font-medium">From Name</Label>
            <Input value={settings.smtpFromName} onChange={(e) => updateSettings('smtpFromName', e.target.value)} className="rounded-xl h-10" placeholder="ShijlAI Academy" />
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] font-medium">From Email</Label>
            <Input value={settings.smtpFromEmail} onChange={(e) => updateSettings('smtpFromEmail', e.target.value)} className="rounded-xl h-10" placeholder="noreply@shijlai.academy" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[13px] font-medium">Reply-To Email</Label>
            <Input value={settings.smtpReplyTo || ''} onChange={(e) => updateSettings('smtpReplyTo', e.target.value || null)} className="rounded-xl h-10" placeholder="support@shijlai.academy" />
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] font-medium">Email Header Image URL</Label>
            <Input value={settings.emailHeaderImageUrl || ''} onChange={(e) => updateSettings('emailHeaderImageUrl', e.target.value || null)} className="rounded-xl h-10" placeholder="https://example.com/logo.png" />
          </div>
        </div>
      </SectionCard>

      <div className="flex items-center justify-between gap-4">
        <Button onClick={handleTestEmail} disabled={sendingTestEmail} variant="outline" className="rounded-xl">
          {sendingTestEmail ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Send className="size-4 mr-2" />}
          Send Test Email to {settings.supportEmail}
        </Button>
        <Button onClick={handleSaveSettings} disabled={saving} className="rounded-xl px-6">
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
          Save Email Settings
        </Button>
      </div>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // TAB 5 — SEO
  // ═══════════════════════════════════════════════════════════════

  const renderSeoTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <SectionCard
        icon={<Search className="size-5 text-orange-600 dark:text-orange-400" />}
        iconBg="bg-gradient-to-br from-orange-500/20 to-amber-500/20"
        title="Meta Information"
        subtitle="Default SEO meta tags for the platform"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[13px] font-medium">Meta Title</Label>
            <Input value={settings.seoMetaTitle || ''} onChange={(e) => updateSettings('seoMetaTitle', e.target.value || null)} className="rounded-xl h-10" placeholder="ShijlAI Academy — Learn AI, Programming & More" />
            <p className="text-[11px] text-muted-foreground">{(settings.seoMetaTitle || '').length}/60 characters recommended</p>
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] font-medium">Meta Description</Label>
            <Textarea value={settings.seoMetaDescription || ''} onChange={(e) => updateSettings('seoMetaDescription', e.target.value || null)} className="rounded-xl min-h-[80px]" placeholder="The world's leading AI-powered learning platform..." />
            <p className="text-[11px] text-muted-foreground">{(settings.seoMetaDescription || '').length}/160 characters recommended</p>
          </div>
          <div className="space-y-2">
            <Label className="text-[13px] font-medium">Keywords</Label>
            <Input value={settings.seoKeywords || ''} onChange={(e) => updateSettings('seoKeywords', e.target.value || null)} className="rounded-xl h-10" placeholder="AI, programming, courses, global, education" />
            <p className="text-[11px] text-muted-foreground">Comma-separated keywords</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={<Globe className="size-5 text-cyan-600 dark:text-cyan-400" />}
        iconBg="bg-gradient-to-br from-cyan-500/20 to-teal-500/20"
        title="Technical SEO"
        subtitle="Robots.txt, sitemap, and verification"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[13px] font-medium">robots.txt</Label>
            <Textarea value={settings.seoRobotsTxt} onChange={(e) => updateSettings('seoRobotsTxt', e.target.value)} className="rounded-xl min-h-[120px] font-mono text-[12px]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Canonical URL</Label>
              <Input value={settings.seoCanonicalUrl || ''} onChange={(e) => updateSettings('seoCanonicalUrl', e.target.value || null)} className="rounded-xl h-10" placeholder="https://shijlai.academy" />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Google Site Verification</Label>
              <Input value={settings.seoGoogleSiteVerification || ''} onChange={(e) => updateSettings('seoGoogleSiteVerification', e.target.value || null)} className="rounded-xl h-10" placeholder="_verification_code" />
            </div>
          </div>
          <SettingsRow label="Sitemap Enabled" description="Auto-generate and serve sitemap.xml">
            <Switch checked={settings.seoSitemapEnabled} onCheckedChange={(v) => updateSettings('seoSitemapEnabled', v)} />
          </SettingsRow>
        </div>
      </SectionCard>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSaveSettings} disabled={saving} className="rounded-xl px-6">
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
          Save SEO Settings
        </Button>
      </div>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // TAB 6 — PAYMENT METHODS
  // ═══════════════════════════════════════════════════════════════

  const renderPaymentTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <SectionCard
        icon={<CreditCard className="size-5 text-emerald-600 dark:text-emerald-400" />}
        iconBg="bg-gradient-to-br from-emerald-500/20 to-green-500/20"
        title="Payment Methods"
        subtitle="Configure payment gateways and methods"
      >
        <div className="space-y-3">
          {paymentMethods.map(pm => (
            <div key={pm.id} className="flex items-center gap-3 rounded-xl border p-3">
              <span className="text-[20px]">{pm.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-medium">{pm.displayName}</p>
                  <Badge variant={pm.isConnected ? 'default' : 'secondary'} className={cn('text-[10px] px-2 py-0', pm.isConnected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : '')}>
                    {pm.isConnected ? 'Connected' : 'Not Connected'}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{maskConfig(pm.config)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-lg h-8 text-[12px]" onClick={() => openConfigurePayment(pm)}>
                  Configure
                </Button>
                <Switch checked={pm.isActive} onCheckedChange={() => handleTogglePaymentActive(pm)} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // TAB 7 — INTEGRATIONS
  // ═══════════════════════════════════════════════════════════════

  const renderIntegrationsTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      {Object.entries(INTEGRATION_CATEGORIES).map(([catKey, catInfo]) => {
        const categoryIntegrations = integrations.filter(ig => ig.category === catKey)
        if (categoryIntegrations.length === 0) return null
        return (
          <SectionCard
            key={catKey}
            icon={<Puzzle className="size-5 text-violet-600 dark:text-violet-400" />}
            iconBg="bg-gradient-to-br from-violet-500/20 to-purple-500/20"
            title={catInfo.label}
            subtitle={`${categoryIntegrations.length} integration${categoryIntegrations.length > 1 ? 's' : ''}`}
          >
            <div className="space-y-3">
              {categoryIntegrations.map(ig => (
                <div key={ig.id} className="flex items-center gap-3 rounded-xl border p-3">
                  <span className="text-[20px]">{ig.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium">{ig.displayName}</p>
                      <Badge variant={ig.isConnected ? 'default' : 'secondary'} className={cn('text-[10px] px-2 py-0', ig.isConnected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : '')}>
                        {ig.isConnected ? 'Connected' : 'Not Connected'}
                      </Badge>
                    </div>
                    {ig.usageInfo && <p className="text-[11px] text-muted-foreground mt-0.5">{ig.usageInfo}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {ig.isConnected ? (
                      <>
                        <Button variant="outline" size="sm" className="rounded-lg h-8 text-[12px]" onClick={() => openConfigureIntegration(ig)}>
                          Configure
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-lg h-8 text-[12px] text-red-500 hover:text-red-600" onClick={() => handleDisconnectIntegration(ig)}>
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" className="rounded-lg h-8 text-[12px]" onClick={() => openConfigureIntegration(ig)}>
                        <Plus className="size-3 mr-1" /> Connect
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )
      })}
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // TAB 8 — WEBHOOKS
  // ═══════════════════════════════════════════════════════════════

  const renderWebhooksTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <SectionCard
        icon={<Webhook className="size-5 text-fuchsia-600 dark:text-fuchsia-400" />}
        iconBg="bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20"
        title="Webhook Endpoints"
        subtitle={`${webhooks.length} webhook${webhooks.length !== 1 ? 's' : ''} configured`}
      >
        <div className="flex justify-end">
          <Button onClick={openCreateWebhook} size="sm" className="rounded-xl">
            <Plus className="size-4 mr-1" /> Add Webhook
          </Button>
        </div>

        {webhooks.length === 0 ? (
          <div className="text-center py-8">
            <Webhook className="size-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-[14px] font-medium text-muted-foreground">No webhooks configured</p>
            <p className="text-[12px] text-muted-foreground mt-1">Add a webhook endpoint to receive real-time event notifications</p>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[12px]">Name</TableHead>
                  <TableHead className="text-[12px]">URL</TableHead>
                  <TableHead className="text-[12px]">Events</TableHead>
                  <TableHead className="text-[12px]">Status</TableHead>
                  <TableHead className="text-[12px]">Last Triggered</TableHead>
                  <TableHead className="text-[12px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map(wh => {
                  let events: string[] = []
                  try { events = JSON.parse(wh.events) } catch { /* empty */ }
                  return (
                    <TableRow key={wh.id}>
                      <TableCell className="text-[13px] font-medium">{wh.name}</TableCell>
                      <TableCell className="text-[12px] text-muted-foreground max-w-[200px] truncate">{wh.url}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {events.slice(0, 2).map(ev => (
                            <Badge key={ev} variant="secondary" className="text-[10px] px-1.5 py-0">{ev}</Badge>
                          ))}
                          {events.length > 2 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">+{events.length - 2}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch checked={wh.isActive} onCheckedChange={() => handleToggleWebhookActive(wh)} />
                          {wh.failureCount > 0 && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              {wh.failureCount} fail{wh.failureCount > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-[12px] text-muted-foreground">
                        {wh.lastTriggeredAt ? formatDate(wh.lastTriggeredAt) : 'Never'}
                        {wh.lastResponseStatus !== null && (
                          <Badge variant={wh.lastResponseStatus >= 200 && wh.lastResponseStatus < 300 ? 'default' : 'destructive'} className="ml-1 text-[9px] px-1 py-0">
                            {wh.lastResponseStatus}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => handleTestWebhook(wh)} disabled={testingWebhook === wh.id}>
                            {testingWebhook === wh.id ? <Loader2 className="size-3 animate-spin" /> : <Activity className="size-3" />}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={() => openEditWebhook(wh)}>
                            <Edit3 className="size-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] text-red-500" onClick={() => { setDeletingWebhook(wh); setDeleteWebhookOpen(true) }}>
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </SectionCard>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // TAB 9 — DATA & PRIVACY
  // ═══════════════════════════════════════════════════════════════

  const renderDataPrivacyTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <SectionCard
        icon={<Shield className="size-5 text-indigo-600 dark:text-indigo-400" />}
        iconBg="bg-gradient-to-br from-indigo-500/20 to-violet-500/20"
        title="Data Retention & GDPR"
        subtitle="Data retention policies and GDPR compliance"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <NumberField label="Data Retention Period" value={settings.dataRetentionDays} onChange={(v) => updateSettings('dataRetentionDays', v)} unit="days" min={1} />
            {settings.dataRetentionDays < 90 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-2">
                <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <p className="text-[11px] text-amber-700 dark:text-amber-400">Warning: Short retention period may conflict with GDPR requirements</p>
              </motion.div>
            )}
          </div>
          <SettingsRow label="GDPR Enabled" description="Enable GDPR compliance features">
            <Switch checked={settings.gdprEnabled} onCheckedChange={(v) => updateSettings('gdprEnabled', v)} />
          </SettingsRow>
          <SettingsRow label="Data Export Enabled" description="Allow users to export their data">
            <Switch checked={settings.gdprDataExportEnabled} onCheckedChange={(v) => updateSettings('gdprDataExportEnabled', v)} />
          </SettingsRow>
          <SettingsRow label="Right to be Forgotten" description="Allow users to request account deletion">
            <Switch checked={settings.gdprRightToBeForgotten} onCheckedChange={(v) => updateSettings('gdprRightToBeForgotten', v)} />
          </SettingsRow>
          <SettingsRow label="Cookie Consent Banner" description="Show cookie consent banner to visitors">
            <Switch checked={settings.gdprCookieConsent} onCheckedChange={(v) => updateSettings('gdprCookieConsent', v)} />
          </SettingsRow>
          <SettingsRow label="Anonymize Deleted Users" description="Anonymize data instead of deleting when users are removed">
            <Switch checked={settings.anonymizeDeletedUsers} onCheckedChange={(v) => updateSettings('anonymizeDeletedUsers', v)} />
          </SettingsRow>
          <div className="space-y-2">
            <Label className="text-[13px] font-medium">Privacy Policy URL</Label>
            <Input value={settings.gdprPrivacyPolicyUrl || ''} onChange={(e) => updateSettings('gdprPrivacyPolicyUrl', e.target.value || null)} className="rounded-xl h-10" placeholder="https://shijlai.academy/privacy-policy" />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={<Lock className="size-5 text-rose-600 dark:text-rose-400" />}
        iconBg="bg-gradient-to-br from-rose-500/20 to-red-500/20"
        title="Rate Limiting"
        subtitle="API and authentication rate limits"
      >
        <div className="space-y-4">
          <SettingsRow label="Rate Limiting Enabled" description="Enforce rate limits on API and authentication endpoints">
            <Switch checked={settings.rateLimitEnabled} onCheckedChange={(v) => updateSettings('rateLimitEnabled', v)} />
          </SettingsRow>
          {settings.rateLimitEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <NumberField label="API Requests / min" value={settings.rateLimitApiPerMinute} onChange={(v) => updateSettings('rateLimitApiPerMinute', v)} unit="req/min" min={1} max={1000} />
              <NumberField label="Login Attempts / hour" value={settings.rateLimitLoginPerHour} onChange={(v) => updateSettings('rateLimitLoginPerHour', v)} unit="attempts" min={1} max={100} />
              <NumberField label="Uploads / hour" value={settings.rateLimitUploadPerHour} onChange={(v) => updateSettings('rateLimitUploadPerHour', v)} unit="uploads" min={1} max={100} />
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        icon={<ScanLine className="size-5 text-purple-600 dark:text-purple-400" />}
        iconBg="bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20"
        title="Content Moderation"
        subtitle="Automated content filtering and moderation"
      >
        <div className="space-y-3">
          <SettingsRow label="Auto-Flag Content" description="Automatically flag suspicious content">
            <Switch checked={settings.moderationAutoFlag} onCheckedChange={(v) => updateSettings('moderationAutoFlag', v)} />
          </SettingsRow>
          <SettingsRow label="AI Assistance" description="Use AI to help moderate content">
            <Switch checked={settings.moderationAiAssistance} onCheckedChange={(v) => updateSettings('moderationAiAssistance', v)} />
          </SettingsRow>
          <SettingsRow label="Profanity Filter" description="Filter profane language in user content">
            <Switch checked={settings.moderationProfanityFilter} onCheckedChange={(v) => updateSettings('moderationProfanityFilter', v)} />
          </SettingsRow>
          <SettingsRow label="Link Filter" description="Filter suspicious links in user content">
            <Switch checked={settings.moderationLinkFilter} onCheckedChange={(v) => updateSettings('moderationLinkFilter', v)} />
          </SettingsRow>
          <SettingsRow label="Media Scan" description="Scan uploaded media for inappropriate content">
            <Switch checked={settings.moderationMediaScan} onCheckedChange={(v) => updateSettings('moderationMediaScan', v)} />
          </SettingsRow>
          <NumberField label="Moderation Queue Threshold" value={settings.moderationQueueThreshold} onChange={(v) => updateSettings('moderationQueueThreshold', v)} unit="flags before quarantine" min={1} max={20} />
        </div>
      </SectionCard>

      <SectionCard
        icon={<Link2 className="size-5 text-teal-600 dark:text-teal-400" />}
        iconBg="bg-gradient-to-br from-teal-500/20 to-cyan-500/20"
        title="CORS Configuration"
        subtitle="Cross-origin resource sharing settings"
      >
        <div className="space-y-4">
          <SettingsRow label="CORS Enabled" description="Allow cross-origin requests from specified domains">
            <Switch checked={settings.corsEnabled} onCheckedChange={(v) => updateSettings('corsEnabled', v)} />
          </SettingsRow>
          {settings.corsEnabled && (
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Allowed Origins</Label>
              <Textarea
                value={settings.allowedOrigins || ''}
                onChange={(e) => updateSettings('allowedOrigins', e.target.value || null)}
                className="rounded-xl min-h-[100px] font-mono text-[12px]"
                placeholder={"https://shijlai.academy\nhttps://app.shijlai.academy\nhttps://admin.shijlai.academy"}
              />
              <p className="text-[11px] text-muted-foreground">One origin per line. Use * to allow all origins (not recommended for production).</p>
            </div>
          )}
        </div>
      </SectionCard>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSaveSettings} disabled={saving} className="rounded-xl px-6">
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
          Save Data & Privacy Settings
        </Button>
      </div>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // TAB 10 — LEGAL & MAINTENANCE
  // ═══════════════════════════════════════════════════════════════

  const renderLegalMaintenanceTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <SectionCard
        icon={<Gavel className="size-5 text-amber-600 dark:text-amber-400" />}
        iconBg="bg-gradient-to-br from-amber-500/20 to-yellow-500/20"
        title="Legal Pages"
        subtitle="Edit legal documents and policies"
      >
        <div className="space-y-3">
          {legalPages.map(lp => (
            <div key={lp.id} className="flex items-center gap-3 rounded-xl border p-3">
              <FileText className="size-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium">{lp.displayName}</p>
                <p className="text-[11px] text-muted-foreground">Last updated: {formatDate(lp.lastUpdatedAt)}</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-lg h-8 text-[12px]" onClick={() => openEditLegalPage(lp)}>
                <Edit3 className="size-3 mr-1" /> Edit
              </Button>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        icon={<Wrench className="size-5 text-rose-600 dark:text-rose-400" />}
        iconBg="bg-gradient-to-br from-rose-500/20 to-red-500/20"
        title="Maintenance Mode"
        subtitle="Control platform maintenance window"
      >
        <div className="space-y-4">
          <SettingsRow label="Enable Maintenance Mode" description="Show maintenance page to all users">
            <Switch checked={settings.maintenanceMode} onCheckedChange={(v) => updateSettings('maintenanceMode', v)} />
          </SettingsRow>

          {settings.maintenanceMode && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-[12px] text-amber-700 dark:text-amber-400">Maintenance mode is active. All users will see the maintenance page.</p>
            </motion.div>
          )}

          <div className="space-y-2">
            <Label className="text-[13px] font-medium">Maintenance Message</Label>
            <Textarea
              value={settings.maintenanceMessage}
              onChange={(e) => updateSettings('maintenanceMessage', e.target.value)}
              className="rounded-xl min-h-[80px]"
              placeholder="We're upgrading ShijlAI Academy. Back in 2 hours!"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[13px] font-medium">Whitelist IPs</Label>
            <Textarea
              value={settings.maintenanceWhitelistIps || ''}
              onChange={(e) => updateSettings('maintenanceWhitelistIps', e.target.value || null)}
              className="rounded-xl min-h-[60px] font-mono text-[12px]"
              placeholder={"192.168.1.1\n10.0.0.1"}
            />
            <p className="text-[11px] text-muted-foreground">One IP per line. These IPs will bypass the maintenance page.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Scheduled Start</Label>
              <Input
                type="datetime-local"
                value={settings.maintenanceScheduledStart ? new Date(settings.maintenanceScheduledStart).toISOString().slice(0, 16) : ''}
                onChange={(e) => updateSettings('maintenanceScheduledStart', e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="rounded-xl h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Scheduled End</Label>
              <Input
                type="datetime-local"
                value={settings.maintenanceScheduledEnd ? new Date(settings.maintenanceScheduledEnd).toISOString().slice(0, 16) : ''}
                onChange={(e) => updateSettings('maintenanceScheduledEnd', e.target.value ? new Date(e.target.value).toISOString() : null)}
                className="rounded-xl h-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingsRow label="Notify Users" description="Send notification before maintenance">
              <Switch checked={settings.maintenanceNotifyUsers} onCheckedChange={(v) => updateSettings('maintenanceNotifyUsers', v)} />
            </SettingsRow>
            {settings.maintenanceNotifyUsers && (
              <NumberField label="Notify Hours Before" value={settings.maintenanceNotifyHoursBefore} onChange={(v) => updateSettings('maintenanceNotifyHoursBefore', v)} unit="hours" min={1} max={168} />
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={<Server className="size-5 text-slate-600 dark:text-slate-400" />}
        iconBg="bg-gradient-to-br from-slate-500/20 to-gray-500/20"
        title="System Actions"
        subtitle="Cache, health check, and system utilities"
      >
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="rounded-xl" onClick={handleClearCache}>
            <RefreshCw className="size-4 mr-2" /> Clear Cache
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={handleSystemHealth} disabled={loadingHealth}>
            {loadingHealth ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Activity className="size-4 mr-2" />}
            System Health Check
          </Button>
        </div>
      </SectionCard>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSaveSettings} disabled={saving} className="rounded-xl px-6">
          {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
          Save Legal & Maintenance Settings
        </Button>
      </div>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // TAB CONFIG
  // ═══════════════════════════════════════════════════════════════

  const TABS = [
    { value: 'general', label: 'General', icon: Globe },
    { value: 'registration', label: 'Registration', icon: UserPlus },
    { value: 'course-rules', label: 'Course Rules', icon: BookOpen },
    { value: 'email', label: 'Email & SMTP', icon: Mail },
    { value: 'seo', label: 'SEO', icon: Search },
    { value: 'payment', label: 'Payments', icon: CreditCard },
    { value: 'integrations', label: 'Integrations', icon: Puzzle },
    { value: 'webhooks', label: 'Webhooks', icon: Webhook },
    { value: 'data-privacy', label: 'Data & Privacy', icon: Shield },
    { value: 'legal-maintenance', label: 'Legal & Maintenance', icon: Gavel },
  ]

  // ═══════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {renderToast()}

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-600/20 to-gray-600/20">
          <Settings className="size-6 text-slate-700 dark:text-slate-300" />
        </div>
        <div>
          <h2 className="text-[20px] font-bold">Platform Settings</h2>
          <p className="text-[13px] text-muted-foreground">Configure platform-wide settings, integrations, and policies</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className={cn(
            'text-[11px] rounded-xl',
            settings.platformStatus === 'online'
              ? 'border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400'
              : 'border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400'
          )}>
            {settings.platformStatus === 'online' ? (
              <><Signal className="size-3 mr-1" /> Online</>
            ) : (
              <><WifiOff className="size-3 mr-1" /> Maintenance</>
            )}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto pb-1 -mx-1 px-1">
          <TabsList className="inline-flex w-max min-w-full bg-muted/50 p-1 rounded-xl gap-0.5">
            {TABS.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-lg text-[12px] px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:ios-shadow-sm"
              >
                <tab.icon className="size-3.5 mr-1.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="general" className="mt-4">{renderGeneralTab()}</TabsContent>
        <TabsContent value="registration" className="mt-4">{renderRegistrationTab()}</TabsContent>
        <TabsContent value="course-rules" className="mt-4">{renderCourseRulesTab()}</TabsContent>
        <TabsContent value="email" className="mt-4">{renderEmailTab()}</TabsContent>
        <TabsContent value="seo" className="mt-4">{renderSeoTab()}</TabsContent>
        <TabsContent value="payment" className="mt-4">{renderPaymentTab()}</TabsContent>
        <TabsContent value="integrations" className="mt-4">{renderIntegrationsTab()}</TabsContent>
        <TabsContent value="webhooks" className="mt-4">{renderWebhooksTab()}</TabsContent>
        <TabsContent value="data-privacy" className="mt-4">{renderDataPrivacyTab()}</TabsContent>
        <TabsContent value="legal-maintenance" className="mt-4">{renderLegalMaintenanceTab()}</TabsContent>
      </Tabs>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* DIALOGS                                                      */}
      {/* ═══════════════════════════════════════════════════════════ */}

      {/* ── Configure Payment Method Dialog ── */}
      <Dialog open={configurePaymentOpen} onOpenChange={setConfigurePaymentOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[16px]">Configure {editingPayment?.displayName}</DialogTitle>
            <DialogDescription>Enter the configuration details for this payment method</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto py-2">
            {Object.keys(paymentConfigForm).length === 0 && (
              <div className="space-y-3">
                {editingPayment?.name === 'stripe' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-medium">API Key</Label>
                      <Input value={paymentConfigForm.apiKey || ''} onChange={(e) => setPaymentConfigForm(prev => ({ ...prev, apiKey: e.target.value }))} className="rounded-xl h-10" placeholder="sk_live_..." />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-medium">Webhook Secret</Label>
                      <Input value={paymentConfigForm.webhookSecret || ''} onChange={(e) => setPaymentConfigForm(prev => ({ ...prev, webhookSecret: e.target.value }))} className="rounded-xl h-10" placeholder="whsec_..." />
                    </div>
                  </>
                )}
                {(editingPayment?.name === 'jazzcash' || editingPayment?.name === 'easypaisa') && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-medium">Merchant ID</Label>
                      <Input value={paymentConfigForm.merchantId || ''} onChange={(e) => setPaymentConfigForm(prev => ({ ...prev, merchantId: e.target.value }))} className="rounded-xl h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-medium">Password</Label>
                      <Input type="password" value={paymentConfigForm.password || ''} onChange={(e) => setPaymentConfigForm(prev => ({ ...prev, password: e.target.value }))} className="rounded-xl h-10" />
                    </div>
                  </>
                )}
                {editingPayment?.name === 'payoneer' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-medium">API Key</Label>
                      <Input value={paymentConfigForm.apiKey || ''} onChange={(e) => setPaymentConfigForm(prev => ({ ...prev, apiKey: e.target.value }))} className="rounded-xl h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-medium">Account Email</Label>
                      <Input value={paymentConfigForm.accountEmail || ''} onChange={(e) => setPaymentConfigForm(prev => ({ ...prev, accountEmail: e.target.value }))} className="rounded-xl h-10" />
                    </div>
                  </>
                )}
                {editingPayment?.name === 'bank_transfer' && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-medium">Bank Name</Label>
                      <Input value={paymentConfigForm.bankName || ''} onChange={(e) => setPaymentConfigForm(prev => ({ ...prev, bankName: e.target.value }))} className="rounded-xl h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-medium">Account Number</Label>
                      <Input value={paymentConfigForm.accountNumber || ''} onChange={(e) => setPaymentConfigForm(prev => ({ ...prev, accountNumber: e.target.value }))} className="rounded-xl h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-medium">IBAN</Label>
                      <Input value={paymentConfigForm.iban || ''} onChange={(e) => setPaymentConfigForm(prev => ({ ...prev, iban: e.target.value }))} className="rounded-xl h-10" />
                    </div>
                  </>
                )}
              </div>
            )}
            {Object.keys(paymentConfigForm).length > 0 && (
              <div className="space-y-3">
                {Object.entries(paymentConfigForm).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label className="text-[13px] font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                    <Input
                      value={value}
                      onChange={(e) => setPaymentConfigForm(prev => ({ ...prev, [key]: e.target.value }))}
                      className="rounded-xl h-10"
                      type={key.toLowerCase().includes('password') || key.toLowerCase().includes('secret') ? 'password' : 'text'}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigurePaymentOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSavePaymentConfig} className="rounded-xl">
              <Save className="size-4 mr-2" /> Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Configure Integration Dialog ── */}
      <Dialog open={configureIntegrationOpen} onOpenChange={setConfigureIntegrationOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[16px]">{editingIntegration?.isConnected ? 'Configure' : 'Connect'} {editingIntegration?.displayName}</DialogTitle>
            <DialogDescription>Enter the configuration details for this integration</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto py-2">
            {Object.entries(integrationConfigForm).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <Label className="text-[13px] font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                <div className="relative">
                  <Input
                    value={revealIntegrationConfig ? value : (key.toLowerCase().includes('key') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('token') || key.toLowerCase().includes('password')) ? maskSecret(value) : value}
                    onChange={(e) => setIntegrationConfigForm(prev => ({ ...prev, [key]: e.target.value }))}
                    className="rounded-xl h-10"
                    type={revealIntegrationConfig ? 'text' : (key.toLowerCase().includes('key') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('token') || key.toLowerCase().includes('password')) ? 'password' : 'text'}
                  />
                </div>
              </div>
            ))}
            {Object.keys(integrationConfigForm).length === 0 && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium">API Key</Label>
                  <Input value={integrationConfigForm.apiKey || ''} onChange={(e) => setIntegrationConfigForm(prev => ({ ...prev, apiKey: e.target.value }))} className="rounded-xl h-10" placeholder="Enter API key" />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            {editingIntegration?.isConnected && (
              <Button variant="destructive" onClick={() => editingIntegration && handleDisconnectIntegration(editingIntegration)} className="rounded-xl mr-auto">
                Disconnect
              </Button>
            )}
            <Button variant="outline" onClick={() => setConfigureIntegrationOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSaveIntegrationConfig} className="rounded-xl">
              <Save className="size-4 mr-2" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Legal Page Dialog ── */}
      <Dialog open={editLegalPageOpen} onOpenChange={setEditLegalPageOpen}>
        <DialogContent className="rounded-2xl max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[16px]">Edit {editingLegalPage?.displayName}</DialogTitle>
            <DialogDescription>Edit the markdown content for this legal page</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              value={legalPageContent}
              onChange={(e) => setLegalPageContent(e.target.value)}
              className="rounded-xl min-h-[400px] font-mono text-[12px]"
              placeholder="Write your legal page content in markdown..."
            />
            <p className="text-[11px] text-muted-foreground">Supports markdown formatting. Changes will be reflected immediately on the platform.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLegalPageOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSaveLegalPage} className="rounded-xl">
              <Save className="size-4 mr-2" /> Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Webhook Create/Edit Dialog ── */}
      <Dialog open={webhookDialogOpen} onOpenChange={setWebhookDialogOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[16px]">{editingWebhook ? 'Edit' : 'Add'} Webhook</DialogTitle>
            <DialogDescription>{editingWebhook ? 'Update webhook endpoint configuration' : 'Create a new webhook endpoint to receive event notifications'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto py-2">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Webhook Name</Label>
              <Input
                value={webhookForm.name}
                onChange={(e) => setWebhookForm(prev => ({ ...prev, name: e.target.value }))}
                className="rounded-xl h-10"
                placeholder="My Webhook Endpoint"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Endpoint URL</Label>
              <Input
                value={webhookForm.url}
                onChange={(e) => setWebhookForm(prev => ({ ...prev, url: e.target.value }))}
                className="rounded-xl h-10"
                placeholder="https://example.com/webhooks/shijlai"
                type="url"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Signing Secret</Label>
              <div className="relative">
                <Input
                  type={revealWebhookSecret === 'form' ? 'text' : 'password'}
                  value={webhookForm.secret}
                  onChange={(e) => setWebhookForm(prev => ({ ...prev, secret: e.target.value }))}
                  className="rounded-xl h-10 pr-10"
                  placeholder="Optional signing secret"
                />
                <button
                  type="button"
                  onClick={() => setRevealWebhookSecret(revealWebhookSecret === 'form' ? null : 'form')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {revealWebhookSecret === 'form' ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">Used to verify webhook authenticity via HMAC signature</p>
            </div>
            <div className="space-y-3">
              <Label className="text-[13px] font-medium">Events</Label>
              <p className="text-[11px] text-muted-foreground">Select which events this webhook should listen to</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {WEBHOOK_EVENTS.map(event => (
                  <div key={event.id} className="flex items-start gap-2 rounded-lg border p-2">
                    <Checkbox
                      id={`event-${event.id}`}
                      checked={webhookForm.events.includes(event.id)}
                      onCheckedChange={(checked) => {
                        setWebhookForm(prev => ({
                          ...prev,
                          events: checked
                            ? [...prev.events, event.id]
                            : prev.events.filter(e => e !== event.id)
                        }))
                      }}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <Label htmlFor={`event-${event.id}`} className="text-[12px] font-medium cursor-pointer">{event.label}</Label>
                      <p className="text-[10px] text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <SettingsRow label="Active" description="Enable this webhook endpoint">
              <Switch checked={webhookForm.isActive} onCheckedChange={(v) => setWebhookForm(prev => ({ ...prev, isActive: v }))} />
            </SettingsRow>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWebhookDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSaveWebhook} className="rounded-xl">
              <Save className="size-4 mr-2" /> {editingWebhook ? 'Update' : 'Create'} Webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Webhook Confirmation Dialog ── */}
      <Dialog open={deleteWebhookOpen} onOpenChange={setDeleteWebhookOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[16px]">Delete Webhook</DialogTitle>
            <DialogDescription>Are you sure you want to delete the webhook &quot;{deletingWebhook?.name}&quot;? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteWebhookOpen(false)} className="rounded-xl">Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteWebhook} className="rounded-xl">
              <Trash2 className="size-4 mr-2" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── System Health Dialog ── */}
      <Dialog open={systemHealthOpen} onOpenChange={setSystemHealthOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[16px]">System Health</DialogTitle>
            <DialogDescription>Current system status and health metrics</DialogDescription>
          </DialogHeader>
          {systemHealth && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3">
                <CheckCircle className="size-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="text-[13px] font-medium text-emerald-700 dark:text-emerald-400">System Healthy</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-500">All systems operational</p>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Database', value: `${(systemHealth.database as Record<string, unknown>)?.status} (${(systemHealth.database as Record<string, unknown>)?.latency})` },
                  { label: 'Uptime', value: `${Math.floor((systemHealth.uptime as number) / 3600)}h ${Math.floor(((systemHealth.uptime as number) % 3600) / 60)}m` },
                  { label: 'Users', value: String((systemHealth.stats as Record<string, number>)?.users ?? 0) },
                  { label: 'Courses', value: String((systemHealth.stats as Record<string, number>)?.courses ?? 0) },
                  { label: 'Enrollments', value: String((systemHealth.stats as Record<string, number>)?.enrollments ?? 0) },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg border px-3 py-2">
                    <span className="text-[12px] text-muted-foreground">{item.label}</span>
                    <span className="text-[12px] font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setSystemHealthOpen(false)} className="rounded-xl">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
