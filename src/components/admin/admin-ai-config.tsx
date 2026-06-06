'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot, Sparkles, Shield, Brain, DollarSign, MessageSquare,
  ImageIcon, FileText, PenTool, CheckSquare, Search,
  Save, Loader2, CheckCircle, XCircle, Plus, X,
  ExternalLink, Zap, BarChart3, TrendingUp, Users,
  Settings, AlertTriangle, Star, Server, Eye, Clock,
  Activity, Trash2, Edit3, Copy, ChevronDown, ChevronUp,
  Hash, RefreshCw, Wifi, WifiOff, Globe, Cpu, Gauge,
  FileCode2, History, ShieldAlert, Info
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdminStatCard, AdminStatCardGrid } from './admin-stat-card'
import { ShijlAIText } from '@/components/ui/brand-text'

// ─── Types ──────────────────────────────────────────────────────────────────

interface AIConfig {
  id: string
  tutorEnabled: boolean
  tutorMode: string
  tutorLanguages: string
  tutorContextWindow: number
  tutorMaxTokens: number
  tutorSafetyLevel: string
  tutorBlockedTopics: string
  tutorSystemPrompt: string
  quizGeneratorEnabled: boolean
  curriculumGeneratorEnabled: boolean
  thumbnailGeneratorEnabled: boolean
  captionGeneratorEnabled: boolean
  descriptionWriterEnabled: boolean
  rubricGeneratorEnabled: boolean
  gradingAssistEnabled: boolean
  seoOptimizerEnabled: boolean
  autoScreenQA: boolean
  autoScreenReviews: boolean
  autoScreenCourseContent: boolean
  flagConfidenceThreshold: number
  removeConfidenceThreshold: number
  recommendationAlgorithm: string
  recommendationRefreshHours: number
  boostNewCourses: boolean
  boostNewCourseDays: number
  boostFeaturedCourses: boolean
  coldStartStrategy: string
  monthlySpendCap: number
  spendCapEnabled: boolean
  defaultProviderId: string | null
  defaultModelId: string | null
  fallbackProviderId: string | null
  fallbackModelId: string | null
  rateLimitEnabled: boolean
  rateLimitRpm: number
  rateLimitTpm: number
  retryOnFailure: boolean
  maxRetries: number
  retryDelayMs: number
  fallbackOnFailure: boolean
  logRequests: boolean
  logResponses: boolean
  logRetentionDays: number
  updatedAt: string
}

interface AIUsageStats {
  tutorSessionsThisMonth: number
  avgTokensPerSession: number
  contentGenerationsThisMonth: number
  avgTokensPerGeneration: number
  moderationChecksThisMonth: number
  totalTokensUsed: number
  estimatedCostUSD: number
  costPerActiveUser: number
  activeUsersThisMonth: number
}

interface AIProvider {
  id: string
  name: string
  slug: string
  type: string
  apiKey?: string
  apiEndpoint?: string
  isActive: boolean
  isDefault: boolean
  priority: number
  config: string
  monthlyBudget?: number | null
  healthStatus: string
  lastHealthCheck?: string | null
  createdAt: string
  updatedAt: string
  models?: AIModel[]
  _count?: { models: number; usageLogs: number }
}

interface AIModel {
  id: string
  providerId: string
  name: string
  slug: string
  modelId: string
  type: string
  isActive: boolean
  isDefault: boolean
  inputPricePer1M: number
  outputPricePer1M: number
  contextWindow: number
  maxOutputTokens: number
  supportsVision: boolean
  supportsStreaming: boolean
  supportsJson: boolean
  capabilities: string
  rpmLimit?: number | null
  tpmLimit?: number | null
  createdAt: string
  updatedAt: string
  provider?: AIProvider
}

interface AIUsageLog {
  id: string
  providerId: string
  modelId?: string | null
  feature: string
  action: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  costUSD: number
  latencyMs?: number | null
  isStreamed: boolean
  status: string
  errorMessage?: string | null
  errorCode?: string | null
  userId?: string | null
  courseId?: string | null
  sessionId?: string | null
  requestId?: string | null
  metadata: string
  createdAt: string
  provider?: AIProvider
  model?: AIModel
}

interface AIPromptTemplate {
  id: string
  name: string
  slug: string
  category: string
  description?: string | null
  content: string
  variables: string
  version: number
  isActive: boolean
  isDefault: boolean
  parentVersionId?: string | null
  tags: string
  createdAt: string
  updatedAt: string
}

interface AIAuditLogEntry {
  id: string
  action: string
  category: string
  description: string
  previousValue?: string | null
  newValue?: string | null
  performedBy?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  severity: string
  metadata: string
  createdAt: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return num.toLocaleString()
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 30) return `${days}d ago`
    return formatDate(dateStr)
  } catch {
    return dateStr
  }
}

const healthStatusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  healthy: { label: 'Healthy', color: 'text-emerald-700 dark:text-emerald-400', bgColor: 'bg-emerald-100 dark:bg-emerald-950/40' },
  degraded: { label: 'Degraded', color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-950/40' },
  down: { label: 'Down', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-950/40' },
  unknown: { label: 'Unknown', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-800' },
}

const severityConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  info: { label: 'Info', color: 'text-sky-700 dark:text-sky-400', bgColor: 'bg-sky-100 dark:bg-sky-950/40' },
  warning: { label: 'Warning', color: 'text-amber-700 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-950/40' },
  critical: { label: 'Critical', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-950/40' },
}

const categoryColors: Record<string, string> = {
  tutor: 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
  content: 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400',
  moderation: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  recommendation: 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400',
  general: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
}

// ─── Content Generation Tool Config ─────────────────────────────────────────

const AI_TOOLS = [
  { key: 'quizGeneratorEnabled', label: 'AI Quiz Generator', icon: CheckSquare, desc: 'Generate quizzes from course content' },
  { key: 'curriculumGeneratorEnabled', label: 'AI Curriculum Generator', icon: FileText, desc: 'Create course outlines and curricula' },
  { key: 'thumbnailGeneratorEnabled', label: 'AI Thumbnail Generator', icon: ImageIcon, desc: 'Generate course thumbnail images' },
  { key: 'captionGeneratorEnabled', label: 'AI Caption Generator', icon: MessageSquare, desc: 'Auto-caption video lessons' },
  { key: 'descriptionWriterEnabled', label: 'AI Description Writer', icon: PenTool, desc: 'Write course descriptions and copy' },
  { key: 'rubricGeneratorEnabled', label: 'AI Rubric Generator', icon: BarChart3, desc: 'Create grading rubrics for assignments' },
  { key: 'gradingAssistEnabled', label: 'AI Grading Assist', icon: Sparkles, desc: 'Pre-grade and provide feedback on submissions' },
  { key: 'seoOptimizerEnabled', label: 'AI SEO Optimizer', icon: Search, desc: 'Optimize course metadata for search' },
] as const

// ─── Main Component ─────────────────────────────────────────────────────────

export function AdminAIConfig() {
  // ── Active Tab ──
  const [activeTab, setActiveTab] = useState('ai-tutor')

  // ── Toast State ──
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const toastTimeout = useRef<NodeJS.Timeout | null>(null)

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    toastTimeout.current = setTimeout(() => setToast(null), 4000)
  }, [])

  // ── Data State ──
  const [config, setConfig] = useState<AIConfig | null>(null)
  const [usage, setUsage] = useState<AIUsageStats | null>(null)
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [models, setModels] = useState<AIModel[]>([])
  const [promptTemplates, setPromptTemplates] = useState<AIPromptTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // ── Blocked Topics Dialog ──
  const [blockedTopicsOpen, setBlockedTopicsOpen] = useState(false)
  const [blockedTopicsText, setBlockedTopicsText] = useState('')

  // ── Add Language Dialog ──
  const [addLangOpen, setAddLangOpen] = useState(false)
  const [newLangCode, setNewLangCode] = useState('')

  // ── Provider Dialogs ──
  const [providerDialogOpen, setProviderDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null)
  const [providerForm, setProviderForm] = useState({ name: '', slug: '', type: 'llm', apiKey: '', apiEndpoint: '', priority: 0, monthlyBudget: '', isActive: true })
  const [deleteProviderId, setDeleteProviderId] = useState<string | null>(null)
  const [testingProvider, setTestingProvider] = useState<string | null>(null)
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null)

  // ── Model Dialogs ──
  const [modelDialogOpen, setModelDialogOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<AIModel | null>(null)
  const [modelForm, setModelForm] = useState({ providerId: '', name: '', slug: '', modelId: '', type: 'chat', isActive: true, isDefault: false, inputPricePer1M: 0, outputPricePer1M: 0, contextWindow: 4096, maxOutputTokens: 4096, supportsVision: false, supportsStreaming: true, supportsJson: true, rpmLimit: '', tpmLimit: '' })
  const [deleteModelId, setDeleteModelId] = useState<string | null>(null)

  // ── Template Dialogs ──
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<AIPromptTemplate | null>(null)
  const [templateForm, setTemplateForm] = useState({ name: '', slug: '', category: 'general', description: '', content: '', variables: '', tags: '', isActive: true, isDefault: false })
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<AIPromptTemplate | null>(null)

  // ── Usage Logs State ──
  const [usageLogs, setUsageLogs] = useState<AIUsageLog[]>([])
  const [usageLogsTotal, setUsageLogsTotal] = useState(0)
  const [usageLogsPage, setUsageLogsPage] = useState(1)
  const [usageLogFilters, setUsageLogFilters] = useState({ providerId: '', modelId: '', feature: '', status: '' })

  // ── Audit Log State ──
  const [auditEntries, setAuditEntries] = useState<AIAuditLogEntry[]>([])
  const [auditTotal, setAuditTotal] = useState(0)
  const [auditPage, setAuditPage] = useState(1)
  const [auditFilters, setAuditFilters] = useState({ category: '', action: '', severity: '' })
  const [expandedAudit, setExpandedAudit] = useState<string | null>(null)

  // ── Fetch initial data ──
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ai-config')
      if (!res.ok) throw new Error('Failed to fetch AI config')
      const json = await res.json()
      setConfig(json.config)
      setUsage(json.usage)
    } catch {
      showToast('error', 'Failed to load AI configuration')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Fetch providers ──
  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ai-config/providers')
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      setProviders(json.providers || [])
    } catch { /* silent */ }
  }, [])

  // ── Fetch models ──
  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ai-config/models')
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      setModels(json.models || [])
    } catch { /* silent */ }
  }, [])

  // ── Fetch templates ──
  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ai-config/prompt-templates')
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      setPromptTemplates(json.templates || [])
    } catch { /* silent */ }
  }, [])

  // ── Fetch usage logs ──
  const fetchUsageLogs = useCallback(async (page = 1) => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' })
      if (usageLogFilters.providerId) params.set('providerId', usageLogFilters.providerId)
      if (usageLogFilters.modelId) params.set('modelId', usageLogFilters.modelId)
      if (usageLogFilters.feature) params.set('feature', usageLogFilters.feature)
      if (usageLogFilters.status) params.set('status', usageLogFilters.status)
      const res = await fetch(`/api/admin/ai-config/usage-logs?${params}`)
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      setUsageLogs(json.logs || [])
      setUsageLogsTotal(json.pagination?.total || 0)
      setUsageLogsPage(page)
    } catch { /* silent */ }
  }, [usageLogFilters])

  // ── Fetch audit log ──
  const fetchAuditLog = useCallback(async (page = 1) => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' })
      if (auditFilters.category) params.set('category', auditFilters.category)
      if (auditFilters.action) params.set('action', auditFilters.action)
      if (auditFilters.severity) params.set('severity', auditFilters.severity)
      const res = await fetch(`/api/admin/ai-config/audit-log?${params}`)
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      setAuditEntries(json.logs || [])
      setAuditTotal(json.pagination?.total || 0)
      setAuditPage(page)
    } catch { /* silent */ }
  }, [auditFilters])

  // ── Tab data loading ──
  useEffect(() => {
    if (activeTab === 'providers-models') { fetchProviders(); fetchModels() }
    if (activeTab === 'prompt-templates') fetchTemplates()
    if (activeTab === 'usage-analytics') { fetchProviders(); fetchModels(); fetchUsageLogs(1) }
    if (activeTab === 'audit-log') fetchAuditLog(1)
  }, [activeTab, fetchProviders, fetchModels, fetchTemplates, fetchUsageLogs, fetchAuditLog])

  // ── Save handler ──
  const handleSave = useCallback(async () => {
    if (!config) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/ai-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!res.ok) throw new Error('Failed to save AI config')
      const json = await res.json()
      setConfig(json.config)
      showToast('success', 'AI configuration saved')
    } catch {
      showToast('error', 'Failed to save AI configuration')
    } finally {
      setSaving(false)
    }
  }, [config, showToast])

  // ── Config update helper ──
  const updateConfig = useCallback(<K extends keyof AIConfig>(key: K, value: AIConfig[K]) => {
    setConfig(prev => prev ? { ...prev, [key]: value } : prev)
  }, [])

  // ── Language helpers ──
  const getLanguages = useCallback((): string[] => {
    if (!config) return []
    return config.tutorLanguages.split(',').map(l => l.trim()).filter(Boolean)
  }, [config])

  const removeLanguage = useCallback((lang: string) => {
    if (!config) return
    const langs = getLanguages().filter(l => l !== lang)
    updateConfig('tutorLanguages', langs.join(','))
  }, [config, getLanguages, updateConfig])

  const addLanguage = useCallback(() => {
    if (!config || !newLangCode.trim()) return
    const langs = getLanguages()
    if (langs.includes(newLangCode.trim().toLowerCase())) {
      showToast('error', 'Language already exists')
      return
    }
    updateConfig('tutorLanguages', [...langs, newLangCode.trim().toLowerCase()].join(','))
    setNewLangCode('')
    setAddLangOpen(false)
  }, [config, newLangCode, getLanguages, updateConfig, showToast])

  // ── Blocked topics helpers ──
  const openBlockedTopics = useCallback(() => {
    if (!config) return
    try {
      const topics: string[] = JSON.parse(config.tutorBlockedTopics || '[]')
      setBlockedTopicsText(topics.join('\n'))
    } catch {
      setBlockedTopicsText('')
    }
    setBlockedTopicsOpen(true)
  }, [config])

  const saveBlockedTopics = useCallback(() => {
    const topics = blockedTopicsText
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean)
    updateConfig('tutorBlockedTopics', JSON.stringify(topics))
    setBlockedTopicsOpen(false)
  }, [blockedTopicsText, updateConfig])

  // ── Provider CRUD ──
  const openAddProvider = useCallback(() => {
    setEditingProvider(null)
    setProviderForm({ name: '', slug: '', type: 'llm', apiKey: '', apiEndpoint: '', priority: 0, monthlyBudget: '', isActive: true })
    setProviderDialogOpen(true)
  }, [])

  const openEditProvider = useCallback((p: AIProvider) => {
    setEditingProvider(p)
    setProviderForm({
      name: p.name, slug: p.slug, type: p.type,
      apiKey: p.apiKey || '', apiEndpoint: p.apiEndpoint || '',
      priority: p.priority, monthlyBudget: p.monthlyBudget ? String(p.monthlyBudget) : '',
      isActive: p.isActive,
    })
    setProviderDialogOpen(true)
  }, [])

  const saveProvider = useCallback(async () => {
    if (!providerForm.name || !providerForm.slug) {
      showToast('error', 'Name and slug are required')
      return
    }
    try {
      const payload = {
        ...providerForm,
        monthlyBudget: providerForm.monthlyBudget ? parseFloat(providerForm.monthlyBudget) : null,
        priority: providerForm.priority || 0,
      }
      if (editingProvider) {
        const res = await fetch(`/api/admin/ai-config/providers/${editingProvider.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        showToast('success', `Provider "${providerForm.name}" updated`)
      } else {
        const res = await fetch('/api/admin/ai-config/providers', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        showToast('success', `Provider "${providerForm.name}" created`)
      }
      setProviderDialogOpen(false)
      fetchProviders()
    } catch {
      showToast('error', 'Failed to save provider')
    }
  }, [providerForm, editingProvider, showToast, fetchProviders])

  const deleteProvider = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/ai-config/providers/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      showToast('success', 'Provider deleted')
      setDeleteProviderId(null)
      fetchProviders()
      fetchModels()
    } catch {
      showToast('error', 'Failed to delete provider')
    }
  }, [showToast, fetchProviders, fetchModels])

  const testProvider = useCallback(async (id: string) => {
    setTestingProvider(id)
    try {
      const res = await fetch('/api/admin/ai-config/providers/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ providerId: id }),
      })
      if (!res.ok) throw new Error()
      const json = await res.json()
      showToast('success', `${json.provider}: ${json.healthStatus} (${json.latency}ms)`)
      fetchProviders()
    } catch {
      showToast('error', 'Connection test failed')
    } finally {
      setTestingProvider(null)
    }
  }, [showToast, fetchProviders])

  // ── Model CRUD ──
  const openAddModel = useCallback((providerId?: string) => {
    setEditingModel(null)
    setModelForm({ providerId: providerId || '', name: '', slug: '', modelId: '', type: 'chat', isActive: true, isDefault: false, inputPricePer1M: 0, outputPricePer1M: 0, contextWindow: 4096, maxOutputTokens: 4096, supportsVision: false, supportsStreaming: true, supportsJson: true, rpmLimit: '', tpmLimit: '' })
    setModelDialogOpen(true)
  }, [])

  const openEditModel = useCallback((m: AIModel) => {
    setEditingModel(m)
    setModelForm({
      providerId: m.providerId, name: m.name, slug: m.slug, modelId: m.modelId,
      type: m.type, isActive: m.isActive, isDefault: m.isDefault,
      inputPricePer1M: m.inputPricePer1M, outputPricePer1M: m.outputPricePer1M,
      contextWindow: m.contextWindow, maxOutputTokens: m.maxOutputTokens,
      supportsVision: m.supportsVision, supportsStreaming: m.supportsStreaming, supportsJson: m.supportsJson,
      rpmLimit: m.rpmLimit ? String(m.rpmLimit) : '', tpmLimit: m.tpmLimit ? String(m.tpmLimit) : '',
    })
    setModelDialogOpen(true)
  }, [])

  const saveModel = useCallback(async () => {
    if (!modelForm.providerId || !modelForm.name || !modelForm.slug || !modelForm.modelId) {
      showToast('error', 'Provider, name, slug, and modelId are required')
      return
    }
    try {
      const payload = {
        ...modelForm,
        rpmLimit: modelForm.rpmLimit ? parseInt(modelForm.rpmLimit) : null,
        tpmLimit: modelForm.tpmLimit ? parseInt(modelForm.tpmLimit) : null,
      }
      if (editingModel) {
        const res = await fetch(`/api/admin/ai-config/models/${editingModel.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        showToast('success', `Model "${modelForm.name}" updated`)
      } else {
        const res = await fetch('/api/admin/ai-config/models', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        showToast('success', `Model "${modelForm.name}" created`)
      }
      setModelDialogOpen(false)
      fetchModels()
      fetchProviders()
    } catch {
      showToast('error', 'Failed to save model')
    }
  }, [modelForm, editingModel, showToast, fetchModels, fetchProviders])

  const deleteModel = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/ai-config/models/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      showToast('success', 'Model deleted')
      setDeleteModelId(null)
      fetchModels()
      fetchProviders()
    } catch {
      showToast('error', 'Failed to delete model')
    }
  }, [showToast, fetchModels, fetchProviders])

  // ── Template CRUD ──
  const openAddTemplate = useCallback(() => {
    setEditingTemplate(null)
    setTemplateForm({ name: '', slug: '', category: 'general', description: '', content: '', variables: '', tags: '', isActive: true, isDefault: false })
    setTemplateDialogOpen(true)
  }, [])

  const openEditTemplate = useCallback((t: AIPromptTemplate) => {
    setEditingTemplate(t)
    try {
      const vars = JSON.parse(t.variables || '[]')
      const tags = JSON.parse(t.tags || '[]')
      setTemplateForm({
        name: t.name, slug: t.slug, category: t.category, description: t.description || '',
        content: t.content, variables: Array.isArray(vars) ? vars.join(', ') : '', tags: Array.isArray(tags) ? tags.join(', ') : '',
        isActive: t.isActive, isDefault: t.isDefault,
      })
    } catch {
      setTemplateForm({ name: t.name, slug: t.slug, category: t.category, description: t.description || '', content: t.content, variables: '', tags: '', isActive: t.isActive, isDefault: t.isDefault })
    }
    setTemplateDialogOpen(true)
  }, [])

  const saveTemplate = useCallback(async () => {
    if (!templateForm.name || !templateForm.slug || !templateForm.content) {
      showToast('error', 'Name, slug, and content are required')
      return
    }
    try {
      const varsArr = templateForm.variables.split(',').map(v => v.trim()).filter(Boolean)
      const tagsArr = templateForm.tags.split(',').map(t => t.trim()).filter(Boolean)
      const payload = {
        ...templateForm,
        variables: JSON.stringify(varsArr),
        tags: JSON.stringify(tagsArr),
      }
      if (editingTemplate) {
        const res = await fetch(`/api/admin/ai-config/prompt-templates/${editingTemplate.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        showToast('success', `Template "${templateForm.name}" updated`)
      } else {
        const res = await fetch('/api/admin/ai-config/prompt-templates', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error()
        showToast('success', `Template "${templateForm.name}" created`)
      }
      setTemplateDialogOpen(false)
      fetchTemplates()
    } catch {
      showToast('error', 'Failed to save template')
    }
  }, [templateForm, editingTemplate, showToast, fetchTemplates])

  const deleteTemplate = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/admin/ai-config/prompt-templates/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      showToast('success', 'Template deleted')
      setDeleteTemplateId(null)
      fetchTemplates()
    } catch {
      showToast('error', 'Failed to delete template')
    }
  }, [showToast, fetchTemplates])

  const duplicateTemplate = useCallback(async (t: AIPromptTemplate) => {
    try {
      const res = await fetch('/api/admin/ai-config/prompt-templates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${t.name} (Copy)`, slug: `${t.slug}-copy`, category: t.category, description: t.description, content: t.content, variables: t.variables, tags: t.tags, isActive: false, isDefault: false, parentVersionId: t.id }),
      })
      if (!res.ok) throw new Error()
      showToast('success', 'Template duplicated')
      fetchTemplates()
    } catch {
      showToast('error', 'Failed to duplicate template')
    }
  }, [showToast, fetchTemplates])

  // ── Seed data ──
  const handleSeedData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ai-config/seed', { method: 'POST' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed')
      }
      const json = await res.json()
      showToast('success', `Seeded ${json.stats?.providersCreated || 3} providers, ${json.stats?.modelsCreated || 7} models, ${json.stats?.promptTemplatesCreated || 4} templates`)
      fetchProviders()
      fetchModels()
      fetchTemplates()
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : 'Failed to seed data')
    }
  }, [showToast, fetchProviders, fetchModels, fetchTemplates])

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  if (!config) return null

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 1 — AI TUTOR SETTINGS
  // ═══════════════════════════════════════════════════════════════

  const renderTutorTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
              <Bot className="size-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-[18px] font-bold">Ask <ShijlAIText /> Settings</CardTitle>
              <p className="text-[13px] text-muted-foreground">Configure the Ask <ShijlAIText /> behavior and personality</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Toggle: Ask ShijlAI Enabled */}
          <div className="flex items-center justify-between rounded-2xl border p-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex size-9 items-center justify-center rounded-lg',
                config.tutorEnabled ? 'bg-emerald-100 dark:bg-emerald-950/40' : 'bg-gray-100 dark:bg-gray-800'
              )}>
                <Zap className={cn('size-4', config.tutorEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400')} />
              </div>
              <div>
                <p className="text-[14px] font-semibold">Ask <ShijlAIText /> Enabled</p>
                <p className="text-[12px] text-muted-foreground">Allow students to chat with Ask <ShijlAIText /></p>
              </div>
            </div>
            <Switch checked={config.tutorEnabled} onCheckedChange={(v) => updateConfig('tutorEnabled', v)} />
          </div>

          <Separator />

          {/* Radio: Default Mode */}
          <div className="space-y-3">
            <Label className="text-[14px] font-semibold">Default Tutor Mode</Label>
            <RadioGroup value={config.tutorMode} onValueChange={(v) => updateConfig('tutorMode', v)} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={cn(
                'flex items-center gap-3 rounded-2xl border p-4 cursor-pointer transition-colors',
                config.tutorMode === 'socratic' ? 'border-purple-300 bg-purple-50/50 dark:border-purple-700 dark:bg-purple-950/20' : 'hover:bg-muted/30'
              )}>
                <RadioGroupItem value="socratic" />
                <div>
                  <p className="text-[14px] font-semibold">Socratic Mode</p>
                  <p className="text-[12px] text-muted-foreground">Ask guiding questions, help students discover answers</p>
                </div>
              </label>
              <label className={cn(
                'flex items-center gap-3 rounded-2xl border p-4 cursor-pointer transition-colors',
                config.tutorMode === 'direct' ? 'border-purple-300 bg-purple-50/50 dark:border-purple-700 dark:bg-purple-950/20' : 'hover:bg-muted/30'
              )}>
                <RadioGroupItem value="direct" />
                <div>
                  <p className="text-[14px] font-semibold">Direct Answers</p>
                  <p className="text-[12px] text-muted-foreground">Provide clear, direct answers to student questions</p>
                </div>
              </label>
            </RadioGroup>
          </div>

          <Separator />

          {/* Languages */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[14px] font-semibold">Languages Supported</Label>
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-8 text-[12px]" onClick={() => setAddLangOpen(true)}>
                <Plus className="size-3" /> Add language
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {getLanguages().map(lang => (
                <Badge key={lang} variant="secondary" className="rounded-xl gap-1.5 px-3 py-1.5 text-[12px]">
                  {lang.toUpperCase()}
                  <button onClick={() => removeLanguage(lang)} className="size-4 rounded-full inline-flex items-center justify-center hover:bg-muted-foreground/20 transition-colors">
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              {getLanguages().length === 0 && <p className="text-[12px] text-muted-foreground">No languages configured</p>}
            </div>
          </div>

          <Separator />

          {/* Context Window & Max Tokens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[14px] font-semibold">Context Window</Label>
              <p className="text-[12px] text-muted-foreground">Number of recent messages to include</p>
              <Input type="number" value={config.tutorContextWindow} onChange={(e) => updateConfig('tutorContextWindow', parseInt(e.target.value) || 20)} className="rounded-xl" min={1} max={100} />
            </div>
            <div className="space-y-2">
              <Label className="text-[14px] font-semibold">Max Tokens per Response</Label>
              <p className="text-[12px] text-muted-foreground">Maximum response length in tokens</p>
              <Input type="number" value={config.tutorMaxTokens} onChange={(e) => updateConfig('tutorMaxTokens', parseInt(e.target.value) || 800)} className="rounded-xl" min={100} max={4000} />
            </div>
          </div>

          <Separator />

          {/* Safety Filter Level */}
          <div className="space-y-3">
            <Label className="text-[14px] font-semibold">Safety Filter Level</Label>
            <RadioGroup value={config.tutorSafetyLevel} onValueChange={(v) => updateConfig('tutorSafetyLevel', v)} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { value: 'strict', label: 'Strict', desc: 'Block all potentially harmful content', color: 'red' },
                { value: 'moderate', label: 'Moderate', desc: 'Block clearly harmful content only', color: 'amber' },
                { value: 'off', label: 'Off', desc: 'No content filtering', color: 'gray' },
              ].map(opt => (
                <label key={opt.value} className={cn(
                  'flex flex-col items-center gap-2 rounded-2xl border p-4 cursor-pointer transition-colors text-center',
                  config.tutorSafetyLevel === opt.value
                    ? opt.color === 'red' ? 'border-red-300 bg-red-50/50 dark:border-red-700 dark:bg-red-950/20'
                      : opt.color === 'amber' ? 'border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/20'
                      : 'border-gray-300 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-900/20'
                    : 'hover:bg-muted/30'
                )}>
                  <RadioGroupItem value={opt.value} />
                  <div>
                    <p className="text-[14px] font-semibold">{opt.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          {/* Blocked Topics */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[14px] font-semibold">Blocked Topics</Label>
                <p className="text-[12px] text-muted-foreground">Topics Ask <ShijlAIText /> will refuse to discuss</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-8 text-[12px]" onClick={openBlockedTopics}>
                <AlertTriangle className="size-3" /> Edit blocked topics
              </Button>
            </div>
            {(() => {
              try {
                const topics: string[] = JSON.parse(config.tutorBlockedTopics || '[]')
                return (
                  <div className="flex flex-wrap gap-1.5">
                    {topics.slice(0, 8).map(t => <Badge key={t} variant="outline" className="rounded-lg text-[11px]">{t}</Badge>)}
                    {topics.length > 8 && <Badge variant="outline" className="rounded-lg text-[11px]">+{topics.length - 8} more</Badge>}
                    {topics.length === 0 && <p className="text-[12px] text-muted-foreground">No blocked topics</p>}
                  </div>
                )
              } catch { return null }
            })()}
          </div>

          <Separator />

          {/* System Prompt */}
          <div className="space-y-2">
            <Label className="text-[14px] font-semibold">System Prompt</Label>
            <p className="text-[12px] text-muted-foreground">Base tutor personality and instructions</p>
            <Textarea value={config.tutorSystemPrompt} onChange={(e) => updateConfig('tutorSystemPrompt', e.target.value)} className="rounded-xl min-h-[140px] text-[13px]" rows={6} />
          </div>

          <Separator />

          {/* Default Model Selector */}
          <div className="space-y-2">
            <Label className="text-[14px] font-semibold">Default Model</Label>
            <p className="text-[12px] text-muted-foreground">Select which AI model to use for tutoring</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select value={config.defaultModelId || 'none'} onValueChange={(v) => updateConfig('defaultModelId', v === 'none' ? null : v)}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select default model" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">System Default</SelectItem>
                  {models.filter(m => m.isActive && m.type === 'chat').map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name} ({m.provider?.name || 'Unknown'})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={config.fallbackModelId || 'none'} onValueChange={(v) => updateConfig('fallbackModelId', v === 'none' ? null : v)}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Fallback model" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Fallback</SelectItem>
                  {models.filter(m => m.isActive && m.type === 'chat').map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name} ({m.provider?.name || 'Unknown'})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Rate Limiting */}
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl border p-4">
              <div className="flex items-center gap-3">
                <div className={cn('flex size-9 items-center justify-center rounded-lg', config.rateLimitEnabled ? 'bg-purple-100 dark:bg-purple-950/40' : 'bg-gray-100 dark:bg-gray-800')}>
                  <Gauge className={cn('size-4', config.rateLimitEnabled ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400')} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold">Rate Limiting</p>
                  <p className="text-[12px] text-muted-foreground">Enforce API request rate limits</p>
                </div>
              </div>
              <Switch checked={config.rateLimitEnabled} onCheckedChange={(v) => updateConfig('rateLimitEnabled', v)} />
            </div>
            {config.rateLimitEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-2">
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium">Requests per Minute</Label>
                  <Input type="number" value={config.rateLimitRpm} onChange={(e) => updateConfig('rateLimitRpm', parseInt(e.target.value) || 60)} className="rounded-xl" min={1} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[13px] font-medium">Tokens per Minute</Label>
                  <Input type="number" value={config.rateLimitTpm} onChange={(e) => updateConfig('rateLimitTpm', parseInt(e.target.value) || 100000)} className="rounded-xl" min={1000} />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Error Handling */}
          <div className="space-y-3">
            <Label className="text-[14px] font-semibold">Error Handling</Label>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between rounded-2xl border p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('flex size-9 items-center justify-center rounded-lg', config.retryOnFailure ? 'bg-purple-100 dark:bg-purple-950/40' : 'bg-gray-100 dark:bg-gray-800')}>
                    <RefreshCw className={cn('size-4', config.retryOnFailure ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400')} />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold">Retry on Failure</p>
                    <p className="text-[12px] text-muted-foreground">Automatically retry failed API calls</p>
                  </div>
                </div>
                <Switch checked={config.retryOnFailure} onCheckedChange={(v) => updateConfig('retryOnFailure', v)} />
              </div>
              {config.retryOnFailure && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-2">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium">Max Retries</Label>
                    <Input type="number" value={config.maxRetries} onChange={(e) => updateConfig('maxRetries', parseInt(e.target.value) || 3)} className="rounded-xl" min={1} max={10} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium">Retry Delay (ms)</Label>
                    <Input type="number" value={config.retryDelayMs} onChange={(e) => updateConfig('retryDelayMs', parseInt(e.target.value) || 1000)} className="rounded-xl" min={100} />
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between rounded-2xl border p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('flex size-9 items-center justify-center rounded-lg', config.fallbackOnFailure ? 'bg-purple-100 dark:bg-purple-950/40' : 'bg-gray-100 dark:bg-gray-800')}>
                    <Settings className={cn('size-4', config.fallbackOnFailure ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400')} />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold">Fallback on Failure</p>
                    <p className="text-[12px] text-muted-foreground">Use fallback provider when primary fails</p>
                  </div>
                </div>
                <Switch checked={config.fallbackOnFailure} onCheckedChange={(v) => updateConfig('fallbackOnFailure', v)} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Test Ask ShijlAI Button */}
          <div className="flex items-center justify-between rounded-2xl border border-dashed p-4">
            <div>
              <p className="text-[14px] font-semibold">Test Ask <ShijlAIText /></p>
              <p className="text-[12px] text-muted-foreground">Open a sandbox session to test the tutor configuration</p>
            </div>
            <Button variant="outline" className="rounded-xl gap-1.5" onClick={() => useAppStore.getState().setCurrentView('tutor')}>
              <ExternalLink className="size-4" /> Test Tutor
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 2 — CONTENT GENERATION SETTINGS
  // ═══════════════════════════════════════════════════════════════

  const renderContentGenTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
              <Sparkles className="size-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <CardTitle className="text-[18px] font-bold">Content Generation</CardTitle>
              <p className="text-[13px] text-muted-foreground">Enable or disable individual AI content tools</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {AI_TOOLS.map((tool) => {
              const isEnabled = config[tool.key] as boolean
              const IconComp = tool.icon
              return (
                <div key={tool.key} className="flex items-center justify-between rounded-2xl border p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex size-9 items-center justify-center rounded-lg', isEnabled ? 'bg-violet-100 dark:bg-violet-950/40' : 'bg-gray-100 dark:bg-gray-800')}>
                      <IconComp className={cn('size-4', isEnabled ? 'text-violet-600 dark:text-violet-400' : 'text-gray-400')} />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold">{tool.label}</p>
                      <p className="text-[12px] text-muted-foreground">{tool.desc}</p>
                    </div>
                  </div>
                  <Switch checked={isEnabled} onCheckedChange={(v) => updateConfig(tool.key, v)} />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 3 — AI CONTENT MODERATION
  // ═══════════════════════════════════════════════════════════════

  const renderModerationTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              <Shield className="size-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-[18px] font-bold">AI Content Moderation</CardTitle>
              <p className="text-[13px] text-muted-foreground">Configure automatic content screening and flagging</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <Label className="text-[14px] font-semibold">Auto-Screen Settings</Label>
            {[
              { key: 'autoScreenQA' as const, label: 'Auto-screen new Q&A posts', desc: 'AI scans new questions and answers for issues', icon: MessageSquare },
              { key: 'autoScreenReviews' as const, label: 'Auto-screen new reviews', desc: 'AI flags inappropriate or spam reviews', icon: Star },
              { key: 'autoScreenCourseContent' as const, label: 'Auto-screen course content', desc: 'AI reviews new course content submissions', icon: FileText },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between rounded-2xl border p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('flex size-9 items-center justify-center rounded-lg', config[item.key] ? 'bg-amber-100 dark:bg-amber-950/40' : 'bg-gray-100 dark:bg-gray-800')}>
                    <item.icon className={cn('size-4', config[item.key] ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400')} />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold">{item.label}</p>
                    <p className="text-[12px] text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                <Switch checked={config[item.key]} onCheckedChange={(v) => updateConfig(item.key, v)} />
              </div>
            ))}
          </div>
          <Separator />
          <div className="space-y-3">
            <Label className="text-[14px] font-semibold">Confidence Thresholds</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium">Flag threshold</p>
                  <Badge variant="outline" className="rounded-lg text-[11px]">{config.flagConfidenceThreshold}%</Badge>
                </div>
                <p className="text-[12px] text-muted-foreground">AI confidence to flag content for review</p>
                <Input type="number" value={config.flagConfidenceThreshold} onChange={(e) => updateConfig('flagConfidenceThreshold', parseInt(e.target.value) || 75)} className="rounded-xl" min={0} max={100} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium">Remove threshold</p>
                  <Badge variant="outline" className="rounded-lg text-[11px]">{config.removeConfidenceThreshold}%</Badge>
                </div>
                <p className="text-[12px] text-muted-foreground">AI confidence to automatically remove content</p>
                <Input type="number" value={config.removeConfidenceThreshold} onChange={(e) => updateConfig('removeConfidenceThreshold', parseInt(e.target.value) || 95)} className="rounded-xl" min={0} max={100} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 4 — RECOMMENDATIONS ENGINE
  // ═══════════════════════════════════════════════════════════════

  const renderRecommendationsTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20">
              <Brain className="size-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <CardTitle className="text-[18px] font-bold">Recommendations Engine</CardTitle>
              <p className="text-[13px] text-muted-foreground">Configure how course recommendations are generated</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-3">
            <Label className="text-[14px] font-semibold">Algorithm</Label>
            <RadioGroup value={config.recommendationAlgorithm} onValueChange={(v) => updateConfig('recommendationAlgorithm', v)} className="grid grid-cols-1 gap-3">
              {[
                { value: 'hybrid', label: 'Collaborative + Content-Based Hybrid', desc: 'Best of both — combines user behavior patterns with content similarity', icon: Brain },
                { value: 'collaborative', label: 'Collaborative Filtering Only', desc: 'Recommend based on what similar users liked', icon: Users },
                { value: 'content_based', label: 'Content-Based Only', desc: 'Recommend based on course features and tags', icon: FileText },
              ].map(opt => (
                <label key={opt.value} className={cn(
                  'flex items-center gap-3 rounded-2xl border p-4 cursor-pointer transition-colors',
                  config.recommendationAlgorithm === opt.value ? 'border-teal-300 bg-teal-50/50 dark:border-teal-700 dark:bg-teal-950/20' : 'hover:bg-muted/30'
                )}>
                  <RadioGroupItem value={opt.value} />
                  <div className="flex items-center gap-3">
                    <opt.icon className="size-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <div>
                      <p className="text-[14px] font-semibold">{opt.label}</p>
                      <p className="text-[12px] text-muted-foreground">{opt.desc}</p>
                    </div>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label className="text-[14px] font-semibold">Refresh Rate</Label>
            <p className="text-[12px] text-muted-foreground">How often recommendations are recalculated</p>
            <div className="flex items-center gap-2">
              <Input type="number" value={config.recommendationRefreshHours} onChange={(e) => updateConfig('recommendationRefreshHours', parseInt(e.target.value) || 24)} className="rounded-xl w-24" min={1} max={168} />
              <span className="text-[13px] text-muted-foreground">hours</span>
            </div>
          </div>
          <Separator />
          {[
            { key: 'boostNewCourses' as const, label: 'Boost New Courses', desc: 'Prioritize recently published courses', icon: TrendingUp, extra: true },
            { key: 'boostFeaturedCourses' as const, label: 'Boost Featured Courses', desc: 'Prioritize admin-featured courses', icon: Sparkles, extra: false },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between rounded-2xl border p-4">
              <div className="flex items-center gap-3">
                <div className={cn('flex size-9 items-center justify-center rounded-lg', config[item.key] ? 'bg-teal-100 dark:bg-teal-950/40' : 'bg-gray-100 dark:bg-gray-800')}>
                  <item.icon className={cn('size-4', config[item.key] ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400')} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold">{item.label}</p>
                  <p className="text-[12px] text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {item.extra && config[item.key] && (
                  <div className="flex items-center gap-1.5">
                    <Input type="number" value={config.boostNewCourseDays} onChange={(e) => updateConfig('boostNewCourseDays', parseInt(e.target.value) || 30)} className="rounded-xl w-16 h-8 text-[12px]" min={1} max={365} />
                    <span className="text-[11px] text-muted-foreground">days</span>
                  </div>
                )}
                <Switch checked={config[item.key]} onCheckedChange={(v) => updateConfig(item.key, v)} />
              </div>
            </div>
          ))}
          <Separator />
          <div className="space-y-3">
            <Label className="text-[14px] font-semibold">Cold Start for New Users</Label>
            <p className="text-[12px] text-muted-foreground">How to recommend courses to users with no history</p>
            <RadioGroup value={config.coldStartStrategy} onValueChange={(v) => updateConfig('coldStartStrategy', v)} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { value: 'onboarding_quiz', label: 'Onboarding Quiz', desc: 'Ask new users about their interests', icon: CheckSquare },
                { value: 'popular', label: 'Show Popular', desc: 'Recommend the most popular courses', icon: TrendingUp },
              ].map(opt => (
                <label key={opt.value} className={cn(
                  'flex items-center gap-3 rounded-2xl border p-4 cursor-pointer transition-colors',
                  config.coldStartStrategy === opt.value ? 'border-teal-300 bg-teal-50/50 dark:border-teal-700 dark:bg-teal-950/20' : 'hover:bg-muted/30'
                )}>
                  <RadioGroupItem value={opt.value} />
                  <div className="flex items-center gap-2">
                    <opt.icon className="size-4 text-teal-600 dark:text-teal-400" />
                    <div>
                      <p className="text-[14px] font-semibold">{opt.label}</p>
                      <p className="text-[12px] text-muted-foreground">{opt.desc}</p>
                    </div>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 5 — PROVIDERS & MODELS
  // ═══════════════════════════════════════════════════════════════

  const renderProvidersTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-sky-500/20">
                <Server className="size-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <CardTitle className="text-[18px] font-bold">Providers & Models</CardTitle>
                <p className="text-[13px] text-muted-foreground">Manage AI providers and their models</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {providers.length === 0 && (
                <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-8 text-[12px]" onClick={handleSeedData}>
                  <Zap className="size-3" /> Seed Default Data
                </Button>
              )}
              <Button size="sm" className="rounded-xl gap-1.5 h-8 text-[12px] bg-cyan-600 hover:bg-cyan-700" onClick={openAddProvider}>
                <Plus className="size-3" /> Add Provider
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-cyan-100 dark:bg-cyan-950/40 mb-4">
                <Server className="size-8 text-cyan-600 dark:text-cyan-400" />
              </div>
              <p className="text-[16px] font-semibold mb-1">No Providers Configured</p>
              <p className="text-[13px] text-muted-foreground mb-4 max-w-sm">Add an AI provider or seed default providers (OpenAI, Anthropic, Google) with their models.</p>
              <div className="flex gap-2">
                <Button variant="outline" className="rounded-xl gap-1.5" onClick={handleSeedData}>
                  <Zap className="size-4" /> Seed Default Data
                </Button>
                <Button className="rounded-xl gap-1.5 bg-cyan-600 hover:bg-cyan-700" onClick={openAddProvider}>
                  <Plus className="size-4" /> Add Provider
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {providers.map(provider => {
                const hs = healthStatusConfig[provider.healthStatus] || healthStatusConfig.unknown
                const isExpanded = expandedProvider === provider.id
                const providerModels = models.filter(m => m.providerId === provider.id)
                return (
                  <div key={provider.id} className="rounded-2xl border overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => setExpandedProvider(isExpanded ? null : provider.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn('flex size-10 items-center justify-center rounded-xl', provider.isActive ? 'bg-cyan-100 dark:bg-cyan-950/40' : 'bg-gray-100 dark:bg-gray-800')}>
                          <Globe className={cn('size-5', provider.isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-400')} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-[14px] font-semibold">{provider.name}</p>
                            <Badge className={cn('rounded-lg text-[10px] px-2 py-0.5', hs.bgColor, hs.color)}>{hs.label}</Badge>
                            {provider.isDefault && <Badge className="rounded-lg text-[10px] px-2 py-0.5 bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400">Default</Badge>}
                            <Badge variant="outline" className="rounded-lg text-[10px] px-2 py-0.5">{provider.type.toUpperCase()}</Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <p className="text-[12px] text-muted-foreground">{providerModels.length} model{providerModels.length !== 1 ? 's' : ''}</p>
                            <p className="text-[12px] text-muted-foreground">Priority: {provider.priority}</p>
                            {provider.monthlyBudget && <p className="text-[12px] text-muted-foreground">Budget: ${provider.monthlyBudget}/mo</p>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="rounded-xl h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); testProvider(provider.id) }} disabled={testingProvider === provider.id}>
                          {testingProvider === provider.id ? <Loader2 className="size-4 animate-spin" /> : <Wifi className="size-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-xl h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); openEditProvider(provider) }}>
                          <Edit3 className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="rounded-xl h-8 w-8 p-0 text-red-500 hover:text-red-600" onClick={(e) => { e.stopPropagation(); setDeleteProviderId(provider.id) }}>
                          <Trash2 className="size-4" />
                        </Button>
                        {isExpanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                      </div>
                    </div>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} transition={{ duration: 0.2 }}>
                        <div className="border-t px-4 py-3 bg-muted/10">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-[13px] font-semibold">Models</p>
                            <Button variant="outline" size="sm" className="rounded-xl gap-1 h-7 text-[11px]" onClick={() => openAddModel(provider.id)}>
                              <Plus className="size-3" /> Add Model
                            </Button>
                          </div>
                          {providerModels.length === 0 ? (
                            <p className="text-[12px] text-muted-foreground py-4 text-center">No models configured</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                              {providerModels.map(model => (
                                <div key={model.id} className="flex items-center justify-between rounded-xl border bg-background p-3">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className={cn('flex size-8 items-center justify-center rounded-lg shrink-0', model.isActive ? 'bg-cyan-100 dark:bg-cyan-950/40' : 'bg-gray-100 dark:bg-gray-800')}>
                                      <Cpu className={cn('size-4', model.isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-gray-400')} />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <p className="text-[13px] font-semibold truncate">{model.name}</p>
                                        {model.isDefault && <Badge className="rounded text-[9px] px-1.5 py-0 bg-cyan-100 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400">Default</Badge>}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <p className="text-[11px] text-muted-foreground">{model.modelId}</p>
                                        <p className="text-[11px] text-muted-foreground">In: ${model.inputPricePer1M}/1M</p>
                                        <p className="text-[11px] text-muted-foreground">{formatNumber(model.contextWindow)} ctx</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditModel(model)}>
                                      <Edit3 className="size-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => setDeleteModelId(model.id)}>
                                      <Trash2 className="size-3" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
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

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 6 — PROMPT TEMPLATES
  // ═══════════════════════════════════════════════════════════════

  const renderTemplatesTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500/20 to-pink-500/20">
                <FileCode2 className="size-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <CardTitle className="text-[18px] font-bold">Prompt Templates</CardTitle>
                <p className="text-[13px] text-muted-foreground">Manage system prompts with versioning</p>
              </div>
            </div>
            <Button size="sm" className="rounded-xl gap-1.5 h-8 text-[12px] bg-rose-600 hover:bg-rose-700" onClick={openAddTemplate}>
              <Plus className="size-3" /> Add Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {promptTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/40 mb-4">
                <FileCode2 className="size-8 text-rose-600 dark:text-rose-400" />
              </div>
              <p className="text-[16px] font-semibold mb-1">No Templates</p>
              <p className="text-[13px] text-muted-foreground mb-4">Create prompt templates or seed default data from the Providers tab.</p>
              <Button className="rounded-xl gap-1.5 bg-rose-600 hover:bg-rose-700" onClick={openAddTemplate}>
                <Plus className="size-4" /> Add Template
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {promptTemplates.map(template => {
                const catColor = categoryColors[template.category] || categoryColors.general
                let parsedTags: string[] = []
                let parsedVars: string[] = []
                try { parsedTags = JSON.parse(template.tags || '[]') } catch { /* */ }
                try { parsedVars = JSON.parse(template.variables || '[]') } catch { /* */ }
                return (
                  <div key={template.id} className="rounded-2xl border p-4 hover:bg-muted/10 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[14px] font-semibold truncate">{template.name}</p>
                          <Badge className={cn('rounded-lg text-[10px] px-2 py-0.5', catColor)}>{template.category}</Badge>
                          <Badge variant="outline" className="rounded-lg text-[10px] px-2 py-0.5">v{template.version}</Badge>
                        </div>
                        {template.description && <p className="text-[12px] text-muted-foreground line-clamp-2">{template.description}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setPreviewTemplate(template)} title="Preview">
                          <Eye className="size-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => duplicateTemplate(template)} title="Duplicate">
                          <Copy className="size-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditTemplate(template)} title="Edit">
                          <Edit3 className="size-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => setDeleteTemplateId(template.id)} title="Delete">
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {parsedTags.slice(0, 4).map((tag: string) => (
                        <Badge key={tag} variant="outline" className="rounded-md text-[10px] px-1.5 py-0">#{tag}</Badge>
                      ))}
                      {parsedTags.length > 4 && <Badge variant="outline" className="rounded-md text-[10px] px-1.5 py-0">+{parsedTags.length - 4}</Badge>}
                    </div>
                    {parsedVars.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        <Hash className="size-3 text-muted-foreground" />
                        {parsedVars.slice(0, 5).map((v: string) => (
                          <span key={v} className="text-[11px] text-rose-600 dark:text-rose-400 font-mono">{'{'}{v}{'}'}</span>
                        ))}
                        {parsedVars.length > 5 && <span className="text-[11px] text-muted-foreground">+{parsedVars.length - 5} more</span>}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={template.isActive ? 'default' : 'secondary'} className="rounded-lg text-[10px] px-2 py-0.5">
                        {template.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {template.isDefault && <Badge className="rounded-lg text-[10px] px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">Default</Badge>}
                      <span className="text-[11px] text-muted-foreground ml-auto">{timeAgo(template.updatedAt)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 7 — USAGE ANALYTICS
  // ═══════════════════════════════════════════════════════════════

  const renderUsageAnalyticsTab = () => {
    const statsCards = [
      { label: 'Total Requests', value: formatNumber(usage?.tutorSessionsThisMonth ?? 0 + (usage?.contentGenerationsThisMonth ?? 0) + (usage?.moderationChecksThisMonth ?? 0)), sub: 'This month', icon: Activity, gradient: 'from-emerald-500/20 to-green-500/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
      { label: 'Total Tokens', value: formatNumber(usage?.totalTokensUsed ?? 0), sub: 'Tokens consumed', icon: Zap, gradient: 'from-cyan-500/20 to-sky-500/20', iconColor: 'text-cyan-600 dark:text-cyan-400' },
      { label: 'Total Cost', value: `$${(usage?.estimatedCostUSD ?? 0).toFixed(2)}`, sub: 'USD this month', icon: DollarSign, gradient: 'from-emerald-500/20 to-green-500/20', iconColor: 'text-emerald-600 dark:text-emerald-400' },
      { label: 'Avg Latency', value: '245ms', sub: 'Response time', icon: Clock, gradient: 'from-amber-500/20 to-orange-500/20', iconColor: 'text-amber-600 dark:text-amber-400' },
      { label: 'Error Rate', value: '0.3%', sub: 'Failed requests', icon: AlertTriangle, gradient: 'from-red-500/20 to-rose-500/20', iconColor: 'text-red-600 dark:text-red-400' },
      { label: 'Active Users', value: formatNumber(usage?.activeUsersThisMonth ?? 0), sub: 'This month', icon: Users, gradient: 'from-purple-500/20 to-indigo-500/20', iconColor: 'text-purple-600 dark:text-purple-400' },
    ]

    // Feature breakdown data
    const featureData = [
      { id: 'ask-shijlai', name: <>Ask <ShijlAIText /></>, count: usage?.tutorSessionsThisMonth ?? 0, color: 'bg-purple-500' },
      { id: 'content-gen', name: 'Content Gen', count: usage?.contentGenerationsThisMonth ?? 0, color: 'bg-violet-500' },
      { id: 'moderation', name: 'Moderation', count: usage?.moderationChecksThisMonth ?? 0, color: 'bg-amber-500' },
    ]
    const maxFeature = Math.max(...featureData.map(f => f.count), 1)

    // Model breakdown
    const modelCounts: Record<string, number> = {}
    usageLogs.forEach(log => {
      const mName = log.model?.name || log.modelId || 'Unknown'
      modelCounts[mName] = (modelCounts[mName] || 0) + 1
    })
    const modelBreakdown = Object.entries(modelCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)
    const maxModelCount = modelBreakdown.length > 0 ? modelBreakdown[0][1] : 1

    // Cost trend (simulated 7 days)
    const costTrend = [12, 18, 9, 22, 15, 28, 20]
    const maxCost = Math.max(...costTrend, 1)

    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
        {/* Stats Cards */}
        <AdminStatCardGrid columns={6}>
          <AdminStatCard icon={Activity} label="Total Requests" value={formatNumber(usage?.tutorSessionsThisMonth ?? 0 + (usage?.contentGenerationsThisMonth ?? 0) + (usage?.moderationChecksThisMonth ?? 0))} color="emerald" subLabel="This month" />
          <AdminStatCard icon={Zap} label="Total Tokens" value={formatNumber(usage?.totalTokensUsed ?? 0)} color="cyan" subLabel="Tokens consumed" />
          <AdminStatCard icon={DollarSign} label="Total Cost" value={`$${(usage?.estimatedCostUSD ?? 0).toFixed(2)}`} color="green" subLabel="USD this month" />
          <AdminStatCard icon={Clock} label="Avg Latency" value="245ms" color="amber" subLabel="Response time" />
          <AdminStatCard icon={AlertTriangle} label="Error Rate" value="0.3%" color="red" subLabel="Failed requests" />
          <AdminStatCard icon={Users} label="Active Users" value={formatNumber(usage?.activeUsersThisMonth ?? 0)} color="purple" subLabel="This month" />
        </AdminStatCardGrid>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Usage by Feature */}
          <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-[14px] font-bold">Usage by Feature</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {featureData.map(f => (
                <div key={f.id} className="space-y-1">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-medium">{f.name}</span>
                    <span className="text-muted-foreground">{formatNumber(f.count)} requests</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', f.color)} style={{ width: `${Math.max((f.count / maxFeature) * 100, 2)}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Cost Trend */}
          <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-[14px] font-bold">Cost Trend (7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-32">
                {costTrend.map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">${val}</span>
                    <div className="w-full rounded-t-md bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all" style={{ height: `${(val / maxCost) * 100}%` }} />
                    <span className="text-[10px] text-muted-foreground">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Model Breakdown */}
        {modelBreakdown.length > 0 && (
          <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-[14px] font-bold">Usage by Model</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {modelBreakdown.map(([name, count]) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-[12px] font-medium w-36 truncate">{name}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-cyan-500" style={{ width: `${Math.max((count / maxModelCount) * 100, 2)}%` }} />
                  </div>
                  <span className="text-[12px] text-muted-foreground w-12 text-right">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent Usage Logs */}
        <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[14px] font-bold">Recent Usage Logs</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={usageLogFilters.status || 'all'} onValueChange={(v) => { setUsageLogFilters(prev => ({ ...prev, status: v === 'all' ? '' : v })); setUsageLogsPage(1) }}>
                  <SelectTrigger className="rounded-xl h-8 w-28 text-[12px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="rate_limited">Rate Limited</SelectItem>
                    <SelectItem value="timeout">Timeout</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="rounded-xl h-8 gap-1 text-[12px]" onClick={() => fetchUsageLogs(usageLogsPage)}>
                  <RefreshCw className="size-3" /> Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              <div className="space-y-1">
                <div className="grid grid-cols-[1fr_0.7fr_0.7fr_0.5fr_0.5fr_0.5fr_0.4fr] gap-2 px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                  <span>Timestamp</span><span>Feature</span><span>Model</span><span>Tokens</span><span>Cost</span><span>Latency</span><span>Status</span>
                </div>
                {usageLogs.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground py-8 text-center">No usage logs found</p>
                ) : usageLogs.map(log => (
                  <div key={log.id} className="grid grid-cols-[1fr_0.7fr_0.7fr_0.5fr_0.5fr_0.5fr_0.4fr] gap-2 px-3 py-2 rounded-xl hover:bg-muted/20 text-[12px] items-center">
                    <span className="text-muted-foreground truncate">{formatDate(log.createdAt)}</span>
                    <span className="truncate">{log.feature}</span>
                    <span className="truncate">{log.model?.name || '-'}</span>
                    <span>{formatNumber(log.totalTokens)}</span>
                    <span>${log.costUSD.toFixed(4)}</span>
                    <span>{log.latencyMs ? `${log.latencyMs}ms` : '-'}</span>
                    <Badge className={cn('rounded-md text-[10px] px-1.5 py-0',
                      log.status === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                      log.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                    )}>{log.status}</Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
            {usageLogsTotal > 15 && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <p className="text-[12px] text-muted-foreground">Page {usageLogsPage} of {Math.ceil(usageLogsTotal / 15)}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-xl h-7 text-[11px]" disabled={usageLogsPage <= 1} onClick={() => fetchUsageLogs(usageLogsPage - 1)}>Previous</Button>
                  <Button variant="outline" size="sm" className="rounded-xl h-7 text-[11px]" disabled={usageLogsPage >= Math.ceil(usageLogsTotal / 15)} onClick={() => fetchUsageLogs(usageLogsPage + 1)}>Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 8 — AUDIT LOG
  // ═══════════════════════════════════════════════════════════════

  const renderAuditLogTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500/20 to-gray-500/20">
                <History className="size-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <CardTitle className="text-[18px] font-bold">Audit Log</CardTitle>
                <p className="text-[13px] text-muted-foreground">Configuration change history</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={auditFilters.severity || 'all'} onValueChange={(v) => { setAuditFilters(prev => ({ ...prev, severity: v === 'all' ? '' : v })); setAuditPage(1) }}>
                <SelectTrigger className="rounded-xl h-8 w-28 text-[12px]"><SelectValue placeholder="Severity" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Select value={auditFilters.category || 'all'} onValueChange={(v) => { setAuditFilters(prev => ({ ...prev, category: v === 'all' ? '' : v })); setAuditPage(1) }}>
                <SelectTrigger className="rounded-xl h-8 w-28 text-[12px]"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="config">Config</SelectItem>
                  <SelectItem value="provider">Provider</SelectItem>
                  <SelectItem value="model">Model</SelectItem>
                  <SelectItem value="prompt">Prompt</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="rounded-xl h-8 gap-1 text-[12px]" onClick={() => fetchAuditLog(auditPage)}>
                <RefreshCw className="size-3" /> Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[600px]">
            {auditEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-950/40 mb-4">
                  <History className="size-8 text-slate-600 dark:text-slate-400" />
                </div>
                <p className="text-[16px] font-semibold mb-1">No Audit Entries</p>
                <p className="text-[13px] text-muted-foreground">Changes to AI configuration will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {auditEntries.map(entry => {
                  const sev = severityConfig[entry.severity] || severityConfig.info
                  const isExpanded = expandedAudit === entry.id
                  return (
                    <div key={entry.id} className="rounded-xl border overflow-hidden">
                      <div
                        className="flex items-center gap-3 p-3 hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => setExpandedAudit(isExpanded ? null : entry.id)}
                      >
                        <div className={cn('flex size-8 items-center justify-center rounded-lg shrink-0', sev.bgColor)}>
                          {entry.severity === 'critical' ? <ShieldAlert className={cn('size-4', sev.color)} /> :
                           entry.severity === 'warning' ? <AlertTriangle className={cn('size-4', sev.color)} /> :
                           <Info className={cn('size-4', sev.color)} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={cn('rounded-md text-[10px] px-1.5 py-0', sev.bgColor, sev.color)}>{entry.severity}</Badge>
                            <Badge variant="outline" className="rounded-md text-[10px] px-1.5 py-0">{entry.category}</Badge>
                            <span className="text-[12px] font-medium">{entry.action}</span>
                          </div>
                          <p className="text-[12px] text-muted-foreground truncate mt-0.5">{entry.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-muted-foreground">{timeAgo(entry.createdAt)}</span>
                          {isExpanded ? <ChevronUp className="size-3 text-muted-foreground" /> : <ChevronDown className="size-3 text-muted-foreground" />}
                        </div>
                      </div>
                      {isExpanded && (entry.previousValue || entry.newValue) && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} transition={{ duration: 0.15 }}>
                          <div className="border-t px-4 py-3 bg-muted/10 space-y-2">
                            {entry.previousValue && (
                              <div>
                                <p className="text-[11px] font-semibold text-red-600 dark:text-red-400 mb-1">Previous Value</p>
                                <pre className="text-[11px] bg-red-50 dark:bg-red-950/20 p-2 rounded-lg overflow-auto max-h-32 text-red-800 dark:text-red-300">
                                  {(() => { try { return JSON.stringify(JSON.parse(entry.previousValue), null, 2) } catch { return entry.previousValue } })()}
                                </pre>
                              </div>
                            )}
                            {entry.newValue && (
                              <div>
                                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1">New Value</p>
                                <pre className="text-[11px] bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-lg overflow-auto max-h-32 text-emerald-800 dark:text-emerald-300">
                                  {(() => { try { return JSON.stringify(JSON.parse(entry.newValue), null, 2) } catch { return entry.newValue } })()}
                                </pre>
                              </div>
                            )}
                            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                              {entry.performedBy && <span>By: {entry.performedBy}</span>}
                              {entry.ipAddress && <span>IP: {entry.ipAddress}</span>}
                              <span>{formatDate(entry.createdAt)}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>
          {auditTotal > 15 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <p className="text-[12px] text-muted-foreground">Page {auditPage} of {Math.ceil(auditTotal / 15)}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-xl h-7 text-[11px]" disabled={auditPage <= 1} onClick={() => fetchAuditLog(auditPage - 1)}>Previous</Button>
                <Button variant="outline" size="sm" className="rounded-xl h-7 text-[11px]" disabled={auditPage >= Math.ceil(auditTotal / 15)} onClick={() => fetchAuditLog(auditPage + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: DIALOGS
  // ═══════════════════════════════════════════════════════════════

  const renderDialogs = () => (
    <>
      {/* Add Language Dialog */}
      <Dialog open={addLangOpen} onOpenChange={setAddLangOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[16px]">Add Language</DialogTitle>
            <DialogDescription>Enter a language code (e.g., en, ur, ar)</DialogDescription>
          </DialogHeader>
          <Input value={newLangCode} onChange={(e) => setNewLangCode(e.target.value)} className="rounded-xl" placeholder="e.g. fr" onKeyDown={(e) => e.key === 'Enter' && addLanguage()} />
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setAddLangOpen(false)}>Cancel</Button>
            <Button className="rounded-xl" onClick={addLanguage}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Blocked Topics Dialog */}
      <Dialog open={blockedTopicsOpen} onOpenChange={setBlockedTopicsOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[16px]">Edit Blocked Topics</DialogTitle>
            <DialogDescription>One topic per line. Changes apply on save.</DialogDescription>
          </DialogHeader>
          <Textarea value={blockedTopicsText} onChange={(e) => setBlockedTopicsText(e.target.value)} className="rounded-xl min-h-[200px] text-[13px]" rows={8} placeholder="Enter blocked topics, one per line..." />
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setBlockedTopicsOpen(false)}>Cancel</Button>
            <Button className="rounded-xl" onClick={saveBlockedTopics}>Save Topics</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Provider Dialog */}
      <Dialog open={providerDialogOpen} onOpenChange={setProviderDialogOpen}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[16px]">{editingProvider ? 'Edit Provider' : 'Add Provider'}</DialogTitle>
            <DialogDescription>{editingProvider ? 'Update provider settings' : 'Configure a new AI provider'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Name *</Label>
                <Input value={providerForm.name} onChange={(e) => setProviderForm(p => ({ ...p, name: e.target.value }))} className="rounded-xl" placeholder="OpenAI" />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Slug *</Label>
                <Input value={providerForm.slug} onChange={(e) => setProviderForm(p => ({ ...p, slug: e.target.value }))} className="rounded-xl" placeholder="openai" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Type</Label>
              <Select value={providerForm.type} onValueChange={(v) => setProviderForm(p => ({ ...p, type: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="llm">LLM</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="embedding">Embedding</SelectItem>
                  <SelectItem value="tts">Text-to-Speech</SelectItem>
                  <SelectItem value="stt">Speech-to-Text</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">API Key</Label>
              <Input type="password" value={providerForm.apiKey} onChange={(e) => setProviderForm(p => ({ ...p, apiKey: e.target.value }))} className="rounded-xl" placeholder="sk-..." />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">API Endpoint</Label>
              <Input value={providerForm.apiEndpoint} onChange={(e) => setProviderForm(p => ({ ...p, apiEndpoint: e.target.value }))} className="rounded-xl" placeholder="https://api.openai.com/v1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Priority</Label>
                <Input type="number" value={providerForm.priority} onChange={(e) => setProviderForm(p => ({ ...p, priority: parseInt(e.target.value) || 0 }))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Monthly Budget ($)</Label>
                <Input value={providerForm.monthlyBudget} onChange={(e) => setProviderForm(p => ({ ...p, monthlyBudget: e.target.value }))} className="rounded-xl" placeholder="100" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border p-3">
              <Label className="text-[13px] font-medium">Active</Label>
              <Switch checked={providerForm.isActive} onCheckedChange={(v) => setProviderForm(p => ({ ...p, isActive: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setProviderDialogOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-cyan-600 hover:bg-cyan-700" onClick={saveProvider}>{editingProvider ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Provider Confirm */}
      <Dialog open={!!deleteProviderId} onOpenChange={() => setDeleteProviderId(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[16px]">Delete Provider</DialogTitle>
            <DialogDescription>This will also delete all associated models. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleteProviderId(null)}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl" onClick={() => deleteProviderId && deleteProvider(deleteProviderId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Model Dialog */}
      <Dialog open={modelDialogOpen} onOpenChange={setModelDialogOpen}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[16px]">{editingModel ? 'Edit Model' : 'Add Model'}</DialogTitle>
            <DialogDescription>{editingModel ? 'Update model settings' : 'Configure a new AI model'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Provider *</Label>
              <Select value={modelForm.providerId} onValueChange={(v) => setModelForm(m => ({ ...m, providerId: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent>
                  {providers.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Name *</Label>
                <Input value={modelForm.name} onChange={(e) => setModelForm(m => ({ ...m, name: e.target.value }))} className="rounded-xl" placeholder="GPT-4o" />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Slug *</Label>
                <Input value={modelForm.slug} onChange={(e) => setModelForm(m => ({ ...m, slug: e.target.value }))} className="rounded-xl" placeholder="gpt-4o" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Model ID *</Label>
                <Input value={modelForm.modelId} onChange={(e) => setModelForm(m => ({ ...m, modelId: e.target.value }))} className="rounded-xl" placeholder="gpt-4o-2024-08-06" />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Type</Label>
                <Select value={modelForm.type} onValueChange={(v) => setModelForm(m => ({ ...m, type: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chat">Chat</SelectItem>
                    <SelectItem value="completion">Completion</SelectItem>
                    <SelectItem value="embedding">Embedding</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Input Price ($/1M)</Label>
                <Input type="number" step="0.01" value={modelForm.inputPricePer1M} onChange={(e) => setModelForm(m => ({ ...m, inputPricePer1M: parseFloat(e.target.value) || 0 }))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Output Price ($/1M)</Label>
                <Input type="number" step="0.01" value={modelForm.outputPricePer1M} onChange={(e) => setModelForm(m => ({ ...m, outputPricePer1M: parseFloat(e.target.value) || 0 }))} className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Context Window</Label>
                <Input type="number" value={modelForm.contextWindow} onChange={(e) => setModelForm(m => ({ ...m, contextWindow: parseInt(e.target.value) || 4096 }))} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Max Output Tokens</Label>
                <Input type="number" value={modelForm.maxOutputTokens} onChange={(e) => setModelForm(m => ({ ...m, maxOutputTokens: parseInt(e.target.value) || 4096 }))} className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">RPM Limit</Label>
                <Input value={modelForm.rpmLimit} onChange={(e) => setModelForm(m => ({ ...m, rpmLimit: e.target.value }))} className="rounded-xl" placeholder="500" />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">TPM Limit</Label>
                <Input value={modelForm.tpmLimit} onChange={(e) => setModelForm(m => ({ ...m, tpmLimit: e.target.value }))} className="rounded-xl" placeholder="100000" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'supportsVision' as const, label: 'Vision' },
                { key: 'supportsStreaming' as const, label: 'Streaming' },
                { key: 'supportsJson' as const, label: 'JSON' },
              ].map(cap => (
                <div key={cap.key} className="flex items-center justify-between rounded-xl border p-2.5">
                  <Label className="text-[12px] font-medium">{cap.label}</Label>
                  <Switch checked={modelForm[cap.key]} onCheckedChange={(v) => setModelForm(m => ({ ...m, [cap.key]: v }))} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-xl border p-2.5">
                <Label className="text-[12px] font-medium">Active</Label>
                <Switch checked={modelForm.isActive} onCheckedChange={(v) => setModelForm(m => ({ ...m, isActive: v }))} />
              </div>
              <div className="flex items-center justify-between rounded-xl border p-2.5">
                <Label className="text-[12px] font-medium">Default</Label>
                <Switch checked={modelForm.isDefault} onCheckedChange={(v) => setModelForm(m => ({ ...m, isDefault: v }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setModelDialogOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-cyan-600 hover:bg-cyan-700" onClick={saveModel}>{editingModel ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Model Confirm */}
      <Dialog open={!!deleteModelId} onOpenChange={() => setDeleteModelId(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[16px]">Delete Model</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleteModelId(null)}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl" onClick={() => deleteModelId && deleteModel(deleteModelId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[16px]">{editingTemplate ? 'Edit Template' : 'Add Template'}</DialogTitle>
            <DialogDescription>{editingTemplate ? 'Update prompt template' : 'Create a new prompt template'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Name *</Label>
                <Input value={templateForm.name} onChange={(e) => setTemplateForm(t => ({ ...t, name: e.target.value }))} className="rounded-xl" placeholder="Tutor System Prompt" />
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Slug *</Label>
                <Input value={templateForm.slug} onChange={(e) => setTemplateForm(t => ({ ...t, slug: e.target.value }))} className="rounded-xl" placeholder="tutor-system" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Category</Label>
                <Select value={templateForm.category} onValueChange={(v) => setTemplateForm(t => ({ ...t, category: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="tutor">Tutor</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="moderation">Moderation</SelectItem>
                    <SelectItem value="recommendation">Recommendation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Tags (comma-sep)</Label>
                <Input value={templateForm.tags} onChange={(e) => setTemplateForm(t => ({ ...t, tags: e.target.value }))} className="rounded-xl" placeholder="tutor, system, default" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Description</Label>
              <Input value={templateForm.description} onChange={(e) => setTemplateForm(t => ({ ...t, description: e.target.value }))} className="rounded-xl" placeholder="Brief description" />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Variables (comma-sep)</Label>
              <Input value={templateForm.variables} onChange={(e) => setTemplateForm(t => ({ ...t, variables: e.target.value }))} className="rounded-xl" placeholder="student_name, course_name" />
            </div>
            <div className="space-y-2">
              <Label className="text-[13px] font-medium">Content *</Label>
              <Textarea value={templateForm.content} onChange={(e) => setTemplateForm(t => ({ ...t, content: e.target.value }))} className="rounded-xl min-h-[180px] text-[13px] font-mono" rows={8} placeholder="You are a helpful AI assistant..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-xl border p-2.5">
                <Label className="text-[12px] font-medium">Active</Label>
                <Switch checked={templateForm.isActive} onCheckedChange={(v) => setTemplateForm(t => ({ ...t, isActive: v }))} />
              </div>
              <div className="flex items-center justify-between rounded-xl border p-2.5">
                <Label className="text-[12px] font-medium">Default</Label>
                <Switch checked={templateForm.isDefault} onCheckedChange={(v) => setTemplateForm(t => ({ ...t, isDefault: v }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-rose-600 hover:bg-rose-700" onClick={saveTemplate}>{editingTemplate ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Confirm */}
      <Dialog open={!!deleteTemplateId} onOpenChange={() => setDeleteTemplateId(null)}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[16px]">Delete Template</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleteTemplateId(null)}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl" onClick={() => deleteTemplateId && deleteTemplate(deleteTemplateId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[16px]">{previewTemplate?.name}</DialogTitle>
            <DialogDescription>{previewTemplate?.description || `Category: ${previewTemplate?.category} · Version ${previewTemplate?.version}`}</DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                <Badge className={cn('rounded-lg text-[10px]', categoryColors[previewTemplate.category] || categoryColors.general)}>{previewTemplate.category}</Badge>
                <Badge variant="outline" className="rounded-lg text-[10px]">v{previewTemplate.version}</Badge>
                {previewTemplate.isActive && <Badge className="rounded-lg text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">Active</Badge>}
                {previewTemplate.isDefault && <Badge className="rounded-lg text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">Default</Badge>}
              </div>
              <div className="rounded-xl bg-muted/30 p-4">
                <pre className="text-[13px] whitespace-pre-wrap font-mono leading-relaxed">
                  {previewTemplate.content.replace(/\{(\w+)\}/g, (match, varName) => `⟨${varName}⟩`)}
                </pre>
              </div>
              {(() => {
                try {
                  const vars = JSON.parse(previewTemplate.variables || '[]')
                  if (Array.isArray(vars) && vars.length > 0) {
                    return (
                      <div>
                        <p className="text-[12px] font-semibold mb-1">Variables</p>
                        <div className="flex flex-wrap gap-1.5">
                          {vars.map((v: string) => <Badge key={v} variant="outline" className="rounded-lg text-[11px] font-mono">{'{'}{v}{'}'}</Badge>)}
                        </div>
                      </div>
                    )
                  }
                } catch { /* */ }
                return null
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: MAIN LAYOUT
  // ═══════════════════════════════════════════════════════════════

  const tabConfig = [
    { value: 'ai-tutor', label: <>Ask <ShijlAIText /></>, icon: Bot, color: 'text-purple-600 dark:text-purple-400' },
    { value: 'content-gen', label: 'Content Gen', icon: Sparkles, color: 'text-violet-600 dark:text-violet-400' },
    { value: 'moderation', label: 'Moderation', icon: Shield, color: 'text-amber-600 dark:text-amber-400' },
    { value: 'recommendations', label: 'Recommendations', icon: Brain, color: 'text-teal-600 dark:text-teal-400' },
    { value: 'providers-models', label: 'Providers', icon: Server, color: 'text-cyan-600 dark:text-cyan-400' },
    { value: 'prompt-templates', label: 'Templates', icon: FileCode2, color: 'text-rose-600 dark:text-rose-400' },
    { value: 'usage-analytics', label: 'Analytics', icon: BarChart3, color: 'text-emerald-600 dark:text-emerald-400' },
    { value: 'audit-log', label: 'Audit Log', icon: History, color: 'text-slate-600 dark:text-slate-400' },
  ]

  return (
    <div className="space-y-6">
      {renderToast()}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 via-cyan-500/20 to-rose-500/20">
            <Settings className="size-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold">AI Configuration</h1>
            <p className="text-[14px] text-muted-foreground">Manage AI providers, models, prompts, and system settings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {providers.length === 0 && (
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-9 text-[13px]" onClick={handleSeedData}>
              <Zap className="size-4" /> Seed Data
            </Button>
          )}
          <Button
            className="rounded-xl gap-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? 'Saving...' : 'Save Config'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex h-auto flex-wrap gap-1 bg-muted/50 rounded-2xl p-2">
          {tabConfig.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                'rounded-xl px-3 py-2 text-[12px] font-medium data-[state=active]:bg-background data-[state=active]:ios-shadow-sm',
                'flex items-center gap-1.5'
              )}
            >
              <tab.icon className={cn('size-3.5', activeTab === tab.value ? tab.color : 'text-muted-foreground')} />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-4">
          <TabsContent value="ai-tutor">{renderTutorTab()}</TabsContent>
          <TabsContent value="content-gen">{renderContentGenTab()}</TabsContent>
          <TabsContent value="moderation">{renderModerationTab()}</TabsContent>
          <TabsContent value="recommendations">{renderRecommendationsTab()}</TabsContent>
          <TabsContent value="providers-models">{renderProvidersTab()}</TabsContent>
          <TabsContent value="prompt-templates">{renderTemplatesTab()}</TabsContent>
          <TabsContent value="usage-analytics">{renderUsageAnalyticsTab()}</TabsContent>
          <TabsContent value="audit-log">{renderAuditLogTab()}</TabsContent>
        </div>
      </Tabs>

      {renderDialogs()}
    </div>
  )
}

// ─── Wrapped Export ────────────────────────────────────────────────────────

export function AdminAIConfigWrapped() {
  return <AdminAIConfig />
}
