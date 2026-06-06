'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Palette, Type, Layout, Mail, Award, Monitor,
  Save, Loader2, CheckCircle, XCircle, Upload,
  Eye, GripVertical, Code, Sun, Moon, Laptop,
  Paintbrush, ImageIcon, Globe, MoveUp, MoveDown,
  PenTool, Users, BarChart3, MessageSquare, BookOpen, Star,
  Shield, Navigation, Footer, Share2, FileCode, Settings,
  Megaphone, Droplets, Download, UploadCloud, RotateCcw,
  Twitter, Facebook, Instagram, Linkedin, Youtube, Music,
  Clock, ChevronDown, Info, AlertTriangle, CheckCircle2,
  Sparkles, MonitorSmartphone, Hash, ExternalLink,
  Smartphone
} from 'lucide-react'
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
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Types ──────────────────────────────────────────────────────────────────

interface AppearanceConfig {
  id: string
  platformName: string
  tagline: string
  logoLightUrl: string | null
  logoDarkUrl: string | null
  faviconUrl: string | null
  appleTouchIconUrl: string | null
  ogImageUrl: string | null
  primaryColor: string
  secondaryColor: string
  accentColor: string
  successColor: string
  warningColor: string
  errorColor: string
  fontFamily: string
  headingFontFamily: string
  baseFontSize: string
  lineHeight: string
  themePreset: string
  darkPrimaryColor: string
  darkSecondaryColor: string
  darkAccentColor: string
  darkBgColor: string
  darkCardColor: string
  lightBgColor: string
  lightCardColor: string
  navStyle: string
  navShowSearch: boolean
  navShowNotifications: boolean
  navTransparentOnLanding: boolean
  footerVisible: boolean
  footerContent: string | null
  footerSocialLinks: string | null
  footerCopyrightText: string
  ogTitle: string | null
  ogDescription: string | null
  twitterHandle: string | null
  heroVisible: boolean
  heroContent: string | null
  featuredCoursesVisible: boolean
  featuredCourseIds: string | null
  trendingVisible: boolean
  instructorSpotlightVisible: boolean
  spotlightInstructorIds: string | null
  testimonialsVisible: boolean
  testimonialsContent: string | null
  statsCounterVisible: boolean
  statsMode: string
  statsManualContent: string | null
  blogPreviewVisible: boolean
  homepageSectionOrder: string
  certTemplate: string
  certLogoPosition: string
  certSignatureUrl: string | null
  certSignatoryName: string
  certBackgroundUrl: string | null
  certBgColor: string
  emailHeaderBgColor: string
  emailFooterText: string
  emailFontFamily: string
  emailButtonRadius: string
  defaultTheme: string
  borderRadius: string
  enableCustomCss: boolean
  customCss: string | null
  enableCustomJs: boolean
  customJs: string | null
  enableAnimations: boolean
  compactMode: boolean
  enableWatermark: boolean
  watermarkText: string | null
  watermarkOpacity: string
  watermarkPosition: string
  bannerEnabled: boolean
  bannerMessage: string | null
  bannerType: string
  bannerDismissible: boolean
  bannerLinkUrl: string | null
  bannerLinkText: string | null
  bannerBgColor: string
  bannerTextColor: string
  updatedAt: string
}

interface HistoryEntry {
  id: string
  snapshot: string
  presetName: string | null
  changeDescription: string | null
  createdAt: string
}

interface ThemePreset {
  name: string
  label: string
  colors: {
    primary: string
    secondary: string
    accent: string
    bg: string
    card: string
  }
}

// ─── Constants ──────────────────────────────────────────────────────────────

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Raleway', label: 'Raleway' },
]

const CERT_TEMPLATES = [
  { value: 'classic', label: 'Classic', desc: 'Traditional border with ornate details', icon: Award },
  { value: 'modern', label: 'Modern', desc: 'Clean lines with bold typography', icon: Star },
  { value: 'minimal', label: 'Minimal', desc: 'Simple and elegant with white space', icon: Shield },
  { value: 'custom', label: 'Custom', desc: 'Upload your own template design', icon: Upload },
]

const HOMEPAGE_SECTIONS = [
  { key: 'hero', label: 'Hero Section', icon: Layout, visibleKey: 'heroVisible' as const, hasEdit: true },
  { key: 'featured', label: 'Featured Courses', icon: Star, visibleKey: 'featuredCoursesVisible' as const, hasEdit: true },
  { key: 'trending', label: 'Trending Section', icon: BarChart3, visibleKey: 'trendingVisible' as const, hasEdit: false },
  { key: 'instructor_spotlight', label: 'Instructor Spotlight', icon: Users, visibleKey: 'instructorSpotlightVisible' as const, hasEdit: true },
  { key: 'testimonials', label: 'Testimonials', icon: MessageSquare, visibleKey: 'testimonialsVisible' as const, hasEdit: true },
  { key: 'stats', label: 'Stats Counter', icon: BarChart3, visibleKey: 'statsCounterVisible' as const, hasEdit: true },
  { key: 'blog', label: 'Blog Preview', icon: BookOpen, visibleKey: 'blogPreviewVisible' as const, hasEdit: false },
]

const THEME_PRESETS: ThemePreset[] = [
  {
    name: 'ocean',
    label: 'Ocean',
    colors: { primary: '#0EA5E9', secondary: '#06B6D4', accent: '#F59E0B', bg: '#0C1222', card: '#1A2332' },
  },
  {
    name: 'forest',
    label: 'Forest',
    colors: { primary: '#16A34A', secondary: '#15803D', accent: '#EAB308', bg: '#0A1F0A', card: '#163016' },
  },
  {
    name: 'sunset',
    label: 'Sunset',
    colors: { primary: '#F97316', secondary: '#EF4444', accent: '#A855F7', bg: '#1A0A0A', card: '#2A1515' },
  },
  {
    name: 'midnight',
    label: 'Midnight',
    colors: { primary: '#6366F1', secondary: '#8B5CF6', accent: '#EC4899', bg: '#0F0B1A', card: '#1E1530' },
  },
  {
    name: 'minimal',
    label: 'Minimal',
    colors: { primary: '#18181B', secondary: '#71717A', accent: '#F59E0B', bg: '#09090B', card: '#18181B' },
  },
  {
    name: 'custom',
    label: 'Custom',
    colors: { primary: '#7F77DD', secondary: '#1D9E75', accent: '#F59E0B', bg: '#0F172A', card: '#1E293B' },
  },
]

const NAV_STYLES = [
  { value: 'sticky', label: 'Sticky', desc: 'Stays at top on scroll', icon: Monitor },
  { value: 'fixed', label: 'Fixed', desc: 'Always visible, overlays content', icon: MonitorSmartphone },
  { value: 'transparent', label: 'Transparent', desc: 'See-through over hero', icon: Eye },
  { value: 'hidden', label: 'Hidden', desc: 'No navigation bar', icon: Smartphone },
]

const WATERMARK_POSITIONS = [
  { value: 'top_left', label: 'Top Left' },
  { value: 'top_right', label: 'Top Right' },
  { value: 'center', label: 'Center' },
  { value: 'bottom_left', label: 'Bottom Left' },
  { value: 'bottom_right', label: 'Bottom Right' },
]

const BANNER_TYPES = [
  { value: 'info', label: 'Info', color: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' },
  { value: 'warning', label: 'Warning', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  { value: 'success', label: 'Success', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
  { value: 'error', label: 'Error', color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' },
]

const SOCIAL_PLATFORMS = [
  { key: 'twitter', label: 'Twitter / X', icon: Twitter, placeholder: 'https://twitter.com/...' },
  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/...' },
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/...' },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/...' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/...' },
  { key: 'tiktok', label: 'TikTok', icon: Music, placeholder: 'https://tiktok.com/...' },
]

// ─── Color Input Helper ─────────────────────────────────────────────────────

function ColorInput({
  label,
  value,
  onChange,
  description,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  description?: string
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[13px] font-medium">{label}</p>
      {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 rounded-lg border cursor-pointer shrink-0"
        />
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-lg flex-1 font-mono text-[13px]"
          maxLength={7}
          placeholder="#000000"
        />
      </div>
    </div>
  )
}

// ─── Section Header Helper ──────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  description,
}: {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  title: string
  description: string
}) {
  return (
    <CardHeader className="pb-3">
      <div className="flex items-center gap-3">
        <div className={cn('flex size-10 items-center justify-center rounded-xl', iconBg)}>
          <Icon className={cn('size-5', iconColor)} />
        </div>
        <div>
          <CardTitle className="text-[18px] font-bold">{title}</CardTitle>
          <p className="text-[13px] text-muted-foreground">{description}</p>
        </div>
      </div>
    </CardHeader>
  )
}

// ─── Save Button Row ────────────────────────────────────────────────────────

function SaveRow({
  saving,
  onSave,
  accentColor = 'bg-purple-600 hover:bg-purple-700',
  label = 'Save Changes',
}: {
  saving: boolean
  onSave: () => void
  accentColor?: string
  label?: string
}) {
  return (
    <div className="flex items-center justify-end pt-2">
      <Button
        className={cn('rounded-xl gap-1.5 text-white', accentColor)}
        onClick={onSave}
        disabled={saving}
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {label}
      </Button>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AdminAppearanceWrapped() {
  return <AdminAppearance />
}

export function AdminAppearance() {
  const [activeTab, setActiveTab] = useState('branding')

  // ── Toast State ──
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const toastTimeout = useRef<NodeJS.Timeout | null>(null)

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    toastTimeout.current = setTimeout(() => setToast(null), 4000)
  }, [])

  // ── Data State ──
  const [config, setConfig] = useState<AppearanceConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sectionOrder, setSectionOrder] = useState<string[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // ── Import Dialog State ──
  const [importOpen, setImportOpen] = useState(false)
  const [importJson, setImportJson] = useState('')
  const [importing, setImporting] = useState(false)

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/appearance')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setConfig(json.config)
      if (json.config?.homepageSectionOrder) {
        setSectionOrder(json.config.homepageSectionOrder.split(',').filter(Boolean))
      }
    } catch {
      showToast('error', 'Failed to load appearance configuration')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Fetch history ──
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/admin/appearance/history')
      if (!res.ok) throw new Error('Failed to fetch history')
      const json = await res.json()
      setHistory(json.history || [])
    } catch {
      showToast('error', 'Failed to load appearance history')
    } finally {
      setHistoryLoading(false)
    }
  }, [showToast])

  // ── Save handler ──
  const handleSave = useCallback(async () => {
    if (!config) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/appearance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (!res.ok) throw new Error('Failed to save')
      const json = await res.json()
      setConfig(json.config)
      showToast('success', 'Appearance configuration saved')
    } catch {
      showToast('error', 'Failed to save appearance configuration')
    } finally {
      setSaving(false)
    }
  }, [config, showToast])

  // ── Config update helper ──
  const updateConfig = useCallback(<K extends keyof AppearanceConfig>(key: K, value: AppearanceConfig[K]) => {
    setConfig(prev => prev ? { ...prev, [key]: value } : prev)
  }, [])

  // ── Section reorder helpers ──
  const moveSectionUp = useCallback((index: number) => {
    if (index === 0) return
    const newOrder = [...sectionOrder]
    const temp = newOrder[index]
    newOrder[index] = newOrder[index - 1]
    newOrder[index - 1] = temp
    setSectionOrder(newOrder)
    updateConfig('homepageSectionOrder', newOrder.join(','))
  }, [sectionOrder, updateConfig])

  const moveSectionDown = useCallback((index: number) => {
    if (index === sectionOrder.length - 1) return
    const newOrder = [...sectionOrder]
    const temp = newOrder[index]
    newOrder[index] = newOrder[index + 1]
    newOrder[index + 1] = temp
    setSectionOrder(newOrder)
    updateConfig('homepageSectionOrder', newOrder.join(','))
  }, [sectionOrder, updateConfig])

  // ── File upload handler (simulated) ──
  const handleFileUpload = useCallback((key: string) => {
    showToast('success', `File upload for ${key} — feature coming soon`)
  }, [showToast])

  // ── Export handler ──
  const handleExport = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/appearance?action=export')
      if (!res.ok) throw new Error('Failed to export')
      const json = await res.json()
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `appearance-theme-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast('success', 'Theme exported successfully')
    } catch {
      showToast('error', 'Failed to export theme')
    }
  }, [showToast])

  // ── Import handler ──
  const handleImport = useCallback(async () => {
    if (!importJson.trim()) {
      showToast('error', 'Please paste a valid JSON configuration')
      return
    }
    setImporting(true)
    try {
      const snapshot = JSON.parse(importJson)
      const res = await fetch('/api/admin/appearance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import', snapshot }),
      })
      if (!res.ok) throw new Error('Failed to import')
      const json = await res.json()
      setConfig(json.config)
      if (json.config?.homepageSectionOrder) {
        setSectionOrder(json.config.homepageSectionOrder.split(',').filter(Boolean))
      }
      setImportOpen(false)
      setImportJson('')
      showToast('success', 'Theme imported successfully')
    } catch {
      showToast('error', 'Invalid JSON or import failed')
    } finally {
      setImporting(false)
    }
  }, [importJson, showToast])

  // ── Restore from history ──
  const handleRestore = useCallback(async (entry: HistoryEntry) => {
    try {
      const res = await fetch('/api/admin/appearance/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', id: entry.id }),
      })
      if (!res.ok) throw new Error('Failed to restore')
      const json = await res.json()
      setConfig(json.config)
      if (json.config?.homepageSectionOrder) {
        setSectionOrder(json.config.homepageSectionOrder.split(',').filter(Boolean))
      }
      showToast('success', 'Configuration restored from history')
      fetchHistory()
    } catch {
      showToast('error', 'Failed to restore from history')
    }
  }, [showToast, fetchHistory])

  // ── Apply theme preset ──
  const applyPreset = useCallback((preset: ThemePreset) => {
    const updates: Partial<AppearanceConfig> = { themePreset: preset.name }
    if (preset.name !== 'custom') {
      updates.primaryColor = preset.colors.primary
      updates.secondaryColor = preset.colors.secondary
      updates.accentColor = preset.colors.accent
      updates.darkBgColor = preset.colors.bg
      updates.darkCardColor = preset.colors.card
    }
    setConfig(prev => prev ? { ...prev, ...updates } : prev)
  }, [])

  // ── Parse social links JSON ──
  const getSocialLinks = useCallback((): Record<string, string> => {
    if (!config?.footerSocialLinks) return {}
    try {
      return JSON.parse(config.footerSocialLinks)
    } catch {
      return {}
    }
  }, [config?.footerSocialLinks])

  const updateSocialLink = useCallback((key: string, value: string) => {
    const current = getSocialLinks()
    const updated = { ...current, [key]: value }
    updateConfig('footerSocialLinks', JSON.stringify(updated))
  }, [getSocialLinks, updateConfig])

  // ── Parse footer columns JSON ──
  const getFooterColumns = useCallback((): string => {
    return config?.footerContent || ''
  }, [config?.footerContent])

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
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
        <Skeleton className="h-12 w-full max-w-4xl rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  if (!config) return null

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 1 — BRANDING
  // ═══════════════════════════════════════════════════════════════

  const renderBrandingTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <SectionHeader
          icon={Palette}
          iconBg="bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20"
          iconColor="text-purple-600 dark:text-purple-400"
          title="Branding"
          description="Configure your platform name, logos, fonts, and colors"
        />
        <CardContent className="space-y-6">
          {/* Platform Name & Tagline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[14px] font-semibold">Platform Name</Label>
              <p className="text-[12px] text-muted-foreground">Displayed in the header and browser tab</p>
              <Input
                value={config.platformName}
                onChange={(e) => updateConfig('platformName', e.target.value)}
                className="rounded-xl"
                placeholder="ShijlAI Academy"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[14px] font-semibold">Tagline</Label>
              <p className="text-[12px] text-muted-foreground">Short description shown on the homepage</p>
              <Input
                value={config.tagline}
                onChange={(e) => updateConfig('tagline', e.target.value)}
                className="rounded-xl"
                placeholder="Learn smarter. Powered by AI."
              />
            </div>
          </div>

          <Separator />

          {/* Logo Uploads */}
          <div className="space-y-3">
            <Label className="text-[14px] font-semibold">Logos & Icons</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { key: 'logoLightUrl', label: 'Logo (Light)', bg: 'bg-white', placeholderIcon: ImageIcon, desc: 'For light backgrounds' },
                { key: 'logoDarkUrl', label: 'Logo (Dark)', bg: 'bg-gray-900', placeholderIcon: ImageIcon, desc: 'For dark backgrounds' },
                { key: 'faviconUrl', label: 'Favicon', bg: '', placeholderIcon: Globe, desc: '32×32 ICO or PNG' },
                { key: 'appleTouchIconUrl', label: 'Apple Touch Icon', bg: '', placeholderIcon: Smartphone, desc: '180×180 PNG' },
              ].map(item => {
                const url = config[item.key as keyof AppearanceConfig] as string | null
                const PlaceholderIcon = item.placeholderIcon
                return (
                  <div key={item.key} className="space-y-2">
                    <p className="text-[13px] font-medium">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    <div className="flex items-center gap-3">
                      {url ? (
                        <div className={cn('size-12 rounded-xl border flex items-center justify-center overflow-hidden', item.bg)}>
                          <img src={url} alt={item.label} className="size-8 object-contain" />
                        </div>
                      ) : (
                        <div className={cn('size-12 rounded-xl border-2 border-dashed flex items-center justify-center', item.bg)}>
                          <PlaceholderIcon className="size-5 text-gray-300" />
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl gap-1.5 h-8 text-[12px]"
                        onClick={() => handleFileUpload(item.key)}
                      >
                        <Upload className="size-3" /> Upload
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* OG Image */}
          <div className="space-y-2">
            <Label className="text-[14px] font-semibold">Open Graph Image</Label>
            <p className="text-[12px] text-muted-foreground">Default share image for social media (1200×630 recommended)</p>
            <div className="flex items-center gap-3">
              {config.ogImageUrl ? (
                <div className="size-12 rounded-xl border flex items-center justify-center overflow-hidden">
                  <img src={config.ogImageUrl} alt="OG Image" className="size-10 object-cover" />
                </div>
              ) : (
                <div className="size-12 rounded-xl border-2 border-dashed flex items-center justify-center">
                  <Share2 className="size-5 text-gray-300" />
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5 h-8 text-[12px]"
                onClick={() => handleFileUpload('ogImageUrl')}
              >
                <Upload className="size-3" /> Upload
              </Button>
            </div>
          </div>

          <Separator />

          {/* Font Settings */}
          <div className="space-y-4">
            <Label className="text-[14px] font-semibold">Typography</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-[13px] font-medium">Body Font Family</p>
                <Select value={config.fontFamily} onValueChange={(v) => updateConfig('fontFamily', v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-[13px] font-medium">Heading Font Family</p>
                <Select value={config.headingFontFamily} onValueChange={(v) => updateConfig('headingFontFamily', v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium">Base Font Size</p>
                  <Badge variant="outline" className="rounded-lg text-[11px]">{config.baseFontSize}px</Badge>
                </div>
                <Slider
                  value={[parseInt(config.baseFontSize) || 16]}
                  onValueChange={(v) => updateConfig('baseFontSize', String(v[0]))}
                  min={12}
                  max={24}
                  step={1}
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>12px</span><span>24px</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium">Line Height</p>
                  <Badge variant="outline" className="rounded-lg text-[11px]">{config.lineHeight}</Badge>
                </div>
                <Slider
                  value={[parseFloat(config.lineHeight) || 1.6]}
                  onValueChange={(v) => updateConfig('lineHeight', v[0].toFixed(1))}
                  min={1.0}
                  max={2.4}
                  step={0.1}
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>1.0</span><span>2.4</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />
          <SaveRow saving={saving} onSave={handleSave} label="Save Branding" />
        </CardContent>
      </Card>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 2 — COLORS & THEME
  // ═══════════════════════════════════════════════════════════════

  const renderColorsTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <SectionHeader
          icon={Paintbrush}
          iconBg="bg-gradient-to-br from-rose-500/20 to-pink-500/20"
          iconColor="text-rose-600 dark:text-rose-400"
          title="Colors & Theme"
          description="Choose a theme preset or customize your color palette"
        />
        <CardContent className="space-y-6">
          {/* Theme Presets */}
          <div className="space-y-3">
            <Label className="text-[14px] font-semibold">Theme Presets</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {THEME_PRESETS.map(preset => {
                const isSelected = config.themePreset === preset.name
                return (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-2xl border p-3 cursor-pointer transition-all',
                      isSelected
                        ? 'border-rose-300 bg-rose-50/50 dark:border-rose-700 dark:bg-rose-950/20 ring-2 ring-rose-300/50'
                        : 'hover:bg-muted/30 hover:border-muted-foreground/20'
                    )}
                  >
                    {/* Color swatch preview */}
                    <div className="flex gap-0.5 rounded-lg overflow-hidden">
                      <div className="size-5" style={{ backgroundColor: preset.colors.primary }} />
                      <div className="size-5" style={{ backgroundColor: preset.colors.secondary }} />
                      <div className="size-5" style={{ backgroundColor: preset.colors.accent }} />
                      <div className="size-5" style={{ backgroundColor: preset.colors.bg }} />
                    </div>
                    <p className="text-[12px] font-semibold">{preset.label}</p>
                    {isSelected && <Badge className="rounded-lg text-[9px] bg-rose-600 h-4 px-1.5">Active</Badge>}
                  </button>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Core Brand Colors */}
          <div className="space-y-3">
            <Label className="text-[14px] font-semibold">Brand Colors</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <ColorInput label="Primary" value={config.primaryColor} onChange={(v) => updateConfig('primaryColor', v)} description="Main brand color" />
              <ColorInput label="Secondary" value={config.secondaryColor} onChange={(v) => updateConfig('secondaryColor', v)} description="Supporting color" />
              <ColorInput label="Accent" value={config.accentColor} onChange={(v) => updateConfig('accentColor', v)} description="Highlight color" />
            </div>
          </div>

          <Separator />

          {/* Extended Palette */}
          <div className="space-y-3">
            <Label className="text-[14px] font-semibold">Extended Palette</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <ColorInput label="Success" value={config.successColor} onChange={(v) => updateConfig('successColor', v)} description="Positive states" />
              <ColorInput label="Warning" value={config.warningColor} onChange={(v) => updateConfig('warningColor', v)} description="Caution states" />
              <ColorInput label="Error" value={config.errorColor} onChange={(v) => updateConfig('errorColor', v)} description="Error states" />
            </div>
          </div>

          <Separator />

          {/* Dark Mode Colors */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Moon className="size-4 text-muted-foreground" />
              <Label className="text-[14px] font-semibold">Dark Mode Colors</Label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <ColorInput label="Dark Primary" value={config.darkPrimaryColor} onChange={(v) => updateConfig('darkPrimaryColor', v)} />
              <ColorInput label="Dark Secondary" value={config.darkSecondaryColor} onChange={(v) => updateConfig('darkSecondaryColor', v)} />
              <ColorInput label="Dark Accent" value={config.darkAccentColor} onChange={(v) => updateConfig('darkAccentColor', v)} />
              <ColorInput label="Dark Background" value={config.darkBgColor} onChange={(v) => updateConfig('darkBgColor', v)} />
              <ColorInput label="Dark Card" value={config.darkCardColor} onChange={(v) => updateConfig('darkCardColor', v)} />
            </div>
          </div>

          <Separator />

          {/* Light Mode Colors */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sun className="size-4 text-muted-foreground" />
              <Label className="text-[14px] font-semibold">Light Mode Colors</Label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <ColorInput label="Light Background" value={config.lightBgColor} onChange={(v) => updateConfig('lightBgColor', v)} />
              <ColorInput label="Light Card" value={config.lightCardColor} onChange={(v) => updateConfig('lightCardColor', v)} />
            </div>
          </div>

          <Separator />

          {/* Default Theme & Border Radius */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[14px] font-semibold">Default Theme</Label>
              <Select value={config.defaultTheme} onValueChange={(v) => updateConfig('defaultTheme', v)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system"><span className="flex items-center gap-2"><Laptop className="size-3.5" /> System</span></SelectItem>
                  <SelectItem value="light"><span className="flex items-center gap-2"><Sun className="size-3.5" /> Light</span></SelectItem>
                  <SelectItem value="dark"><span className="flex items-center gap-2"><Moon className="size-3.5" /> Dark</span></SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[14px] font-semibold">Border Radius</Label>
                <Badge variant="outline" className="rounded-lg text-[11px]">{config.borderRadius}px</Badge>
              </div>
              <Slider
                value={[parseInt(config.borderRadius) || 12]}
                onValueChange={(v) => updateConfig('borderRadius', String(v[0]))}
                min={0}
                max={24}
                step={1}
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>0px (Sharp)</span><span>24px (Round)</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Color Preview */}
          <div className="space-y-3">
            <Label className="text-[14px] font-semibold">Color Preview</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border p-4 space-y-2" style={{ backgroundColor: config.lightBgColor }}>
                <p className="text-[12px] font-medium text-gray-600">Light Mode Preview</p>
                <div className="flex gap-2">
                  <div className="h-8 flex-1 rounded-lg" style={{ backgroundColor: config.primaryColor }} />
                  <div className="h-8 flex-1 rounded-lg" style={{ backgroundColor: config.secondaryColor }} />
                  <div className="h-8 flex-1 rounded-lg" style={{ backgroundColor: config.accentColor }} />
                </div>
                <div className="h-10 rounded-lg" style={{ backgroundColor: config.lightCardColor, border: '1px solid #e5e7eb' }}>
                  <div className="p-2">
                    <div className="h-2 w-16 rounded" style={{ backgroundColor: config.primaryColor }} />
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border p-4 space-y-2" style={{ backgroundColor: config.darkBgColor }}>
                <p className="text-[12px] font-medium text-gray-400">Dark Mode Preview</p>
                <div className="flex gap-2">
                  <div className="h-8 flex-1 rounded-lg" style={{ backgroundColor: config.darkPrimaryColor }} />
                  <div className="h-8 flex-1 rounded-lg" style={{ backgroundColor: config.darkSecondaryColor }} />
                  <div className="h-8 flex-1 rounded-lg" style={{ backgroundColor: config.darkAccentColor }} />
                </div>
                <div className="h-10 rounded-lg" style={{ backgroundColor: config.darkCardColor }}>
                  <div className="p-2">
                    <div className="h-2 w-16 rounded" style={{ backgroundColor: config.darkPrimaryColor }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />
          <SaveRow saving={saving} onSave={handleSave} accentColor="bg-rose-600 hover:bg-rose-700" label="Save Colors & Theme" />
        </CardContent>
      </Card>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 3 — NAVIGATION
  // ═══════════════════════════════════════════════════════════════

  const renderNavigationTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <SectionHeader
          icon={Navigation}
          iconBg="bg-gradient-to-br from-sky-500/20 to-blue-500/20"
          iconColor="text-sky-600 dark:text-sky-400"
          title="Navigation"
          description="Configure the navigation bar style and features"
        />
        <CardContent className="space-y-6">
          {/* Nav Style */}
          <div className="space-y-3">
            <Label className="text-[14px] font-semibold">Navigation Style</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {NAV_STYLES.map(style => {
                const IconComp = style.icon
                const isSelected = config.navStyle === style.value
                return (
                  <button
                    key={style.value}
                    onClick={() => updateConfig('navStyle', style.value)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-2xl border p-4 cursor-pointer transition-colors text-center',
                      isSelected
                        ? 'border-sky-300 bg-sky-50/50 dark:border-sky-700 dark:bg-sky-950/20'
                        : 'hover:bg-muted/30'
                    )}
                  >
                    <div className={cn(
                      'flex size-10 items-center justify-center rounded-xl',
                      isSelected ? 'bg-sky-100 dark:bg-sky-950/40' : 'bg-gray-100 dark:bg-gray-800'
                    )}>
                      <IconComp className={cn('size-5', isSelected ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400')} />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold">{style.label}</p>
                      <p className="text-[11px] text-muted-foreground">{style.desc}</p>
                    </div>
                    {isSelected && <Badge className="rounded-lg text-[9px] bg-sky-600 h-4 px-1.5">Active</Badge>}
                  </button>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Nav Toggles */}
          <div className="space-y-4">
            <Label className="text-[14px] font-semibold">Navigation Features</Label>
            {[
              { key: 'navShowSearch' as const, label: 'Show Search Bar', desc: 'Display search input in the navigation', icon: Hash },
              { key: 'navShowNotifications' as const, label: 'Show Notifications', desc: 'Display notification bell icon', icon: Megaphone },
              { key: 'navTransparentOnLanding' as const, label: 'Transparent on Landing', desc: 'Make nav transparent over hero section', icon: Eye },
            ].map(item => {
              const IconComp = item.icon
              return (
                <div key={item.key} className="flex items-center justify-between rounded-2xl border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950/40">
                      <IconComp className="size-4 text-sky-600 dark:text-sky-400" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold">{item.label}</p>
                      <p className="text-[12px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={config[item.key] as boolean}
                    onCheckedChange={(v) => updateConfig(item.key, v)}
                  />
                </div>
              )
            })}
          </div>

          <Separator />
          <SaveRow saving={saving} onSave={handleSave} accentColor="bg-sky-600 hover:bg-sky-700" label="Save Navigation" />
        </CardContent>
      </Card>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 4 — FOOTER
  // ═══════════════════════════════════════════════════════════════

  const renderFooterTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <SectionHeader
          icon={Layout}
          iconBg="bg-gradient-to-br from-emerald-500/20 to-green-500/20"
          iconColor="text-emerald-600 dark:text-emerald-400"
          title="Footer"
          description="Configure footer visibility, social links, and columns"
        />
        <CardContent className="space-y-6">
          {/* Footer Visibility */}
          <div className="flex items-center justify-between rounded-2xl border p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40">
                <Eye className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-[14px] font-semibold">Footer Visible</p>
                <p className="text-[12px] text-muted-foreground">Show or hide the site footer</p>
              </div>
            </div>
            <Switch
              checked={config.footerVisible}
              onCheckedChange={(v) => updateConfig('footerVisible', v)}
            />
          </div>

          {config.footerVisible && (
            <>
              <Separator />

              {/* Copyright Text */}
              <div className="space-y-2">
                <Label className="text-[14px] font-semibold">Copyright Text</Label>
                <Input
                  value={config.footerCopyrightText}
                  onChange={(e) => updateConfig('footerCopyrightText', e.target.value)}
                  className="rounded-xl"
                  placeholder="© 2024 ShijlAI Academy. All rights reserved."
                />
              </div>

              <Separator />

              {/* Social Links */}
              <div className="space-y-3">
                <Label className="text-[14px] font-semibold">Social Links</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SOCIAL_PLATFORMS.map(platform => {
                    const IconComp = platform.icon
                    const links = getSocialLinks()
                    return (
                      <div key={platform.key} className="flex items-center gap-2">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-muted shrink-0">
                          <IconComp className="size-4 text-muted-foreground" />
                        </div>
                        <Input
                          value={links[platform.key] || ''}
                          onChange={(e) => updateSocialLink(platform.key, e.target.value)}
                          className="rounded-xl text-[13px]"
                          placeholder={platform.placeholder}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              <Separator />

              {/* Footer Columns JSON */}
              <div className="space-y-2">
                <Label className="text-[14px] font-semibold">Footer Columns</Label>
                <p className="text-[12px] text-muted-foreground">
                  JSON structure for footer link columns: {`{ "columns": [{ "title": "...", "links": [{ "label": "...", "url": "..." }] }] }`}
                </p>
                <Textarea
                  value={getFooterColumns()}
                  onChange={(e) => updateConfig('footerContent', e.target.value)}
                  className="rounded-xl min-h-[160px] text-[12px] font-mono"
                  placeholder='{"columns":[{"title":"Company","links":[{"label":"About","url":"/about"},{"label":"Careers","url":"/careers"}]}]}'
                  rows={8}
                />
              </div>
            </>
          )}

          <Separator />
          <SaveRow saving={saving} onSave={handleSave} accentColor="bg-emerald-600 hover:bg-emerald-700" label="Save Footer" />
        </CardContent>
      </Card>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 5 — HOMEPAGE LAYOUT
  // ═══════════════════════════════════════════════════════════════

  const renderHomepageTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <SectionHeader
          icon={Layout}
          iconBg="bg-gradient-to-br from-teal-500/20 to-emerald-500/20"
          iconColor="text-teal-600 dark:text-teal-400"
          title="Homepage Layout"
          description="Toggle sections and reorder their appearance"
        />
        <CardContent className="space-y-5">
          {/* Drag reorder hint */}
          <div className="flex items-center gap-2 rounded-2xl bg-muted/40 p-3">
            <GripVertical className="size-4 text-muted-foreground" />
            <p className="text-[12px] text-muted-foreground">Use the arrows to reorder sections. Drag-to-reorder coming soon.</p>
          </div>

          {/* Section List */}
          <div className="space-y-2">
            {sectionOrder.map((sectionKey, index) => {
              const sectionDef = HOMEPAGE_SECTIONS.find(s => s.key === sectionKey)
              if (!sectionDef) return null
              const isVisible = config[sectionDef.visibleKey]
              const IconComp = sectionDef.icon

              return (
                <div
                  key={sectionKey}
                  className={cn(
                    'flex items-center justify-between rounded-2xl border p-4 transition-colors',
                    !isVisible && 'opacity-60'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveSectionUp(index)}
                        disabled={index === 0}
                        className="size-5 rounded-md flex items-center justify-center hover:bg-muted-foreground/10 transition-colors disabled:opacity-30"
                      >
                        <MoveUp className="size-3" />
                      </button>
                      <button
                        onClick={() => moveSectionDown(index)}
                        disabled={index === sectionOrder.length - 1}
                        className="size-5 rounded-md flex items-center justify-center hover:bg-muted-foreground/10 transition-colors disabled:opacity-30"
                      >
                        <MoveDown className="size-3" />
                      </button>
                    </div>
                    <div className={cn(
                      'flex size-9 items-center justify-center rounded-lg',
                      isVisible ? 'bg-teal-100 dark:bg-teal-950/40' : 'bg-gray-100 dark:bg-gray-800'
                    )}>
                      <IconComp className={cn('size-4', isVisible ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400')} />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold">{sectionDef.label}</p>
                      <p className="text-[12px] text-muted-foreground">
                        {isVisible ? 'Visible on homepage' : 'Hidden from homepage'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {sectionDef.hasEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl gap-1.5 h-8 text-[12px]"
                        onClick={() => showToast('success', `Edit ${sectionDef.label} — dialog coming soon`)}
                      >
                        <PenTool className="size-3" /> Edit
                      </Button>
                    )}
                    <Switch
                      checked={isVisible}
                      onCheckedChange={(v) => updateConfig(sectionDef.visibleKey, v)}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Stats Mode */}
          {config.statsCounterVisible && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-[14px] font-semibold">Stats Counter Mode</Label>
                <RadioGroup
                  value={config.statsMode}
                  onValueChange={(v) => updateConfig('statsMode', v)}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  <label className={cn(
                    'flex items-center gap-3 rounded-2xl border p-4 cursor-pointer transition-colors',
                    config.statsMode === 'auto' ? 'border-teal-300 bg-teal-50/50 dark:border-teal-700 dark:bg-teal-950/20' : 'hover:bg-muted/30'
                  )}>
                    <RadioGroupItem value="auto" />
                    <div>
                      <p className="text-[14px] font-semibold">Auto</p>
                      <p className="text-[12px] text-muted-foreground">Stats are calculated from platform data</p>
                    </div>
                  </label>
                  <label className={cn(
                    'flex items-center gap-3 rounded-2xl border p-4 cursor-pointer transition-colors',
                    config.statsMode === 'manual' ? 'border-teal-300 bg-teal-50/50 dark:border-teal-700 dark:bg-teal-950/20' : 'hover:bg-muted/30'
                  )}>
                    <RadioGroupItem value="manual" />
                    <div>
                      <p className="text-[14px] font-semibold">Manual</p>
                      <p className="text-[12px] text-muted-foreground">Enter custom stat values</p>
                    </div>
                  </label>
                </RadioGroup>
                {config.statsMode === 'manual' && (
                  <div className="space-y-2">
                    <Label className="text-[13px] font-medium">Manual Stats Content</Label>
                    <Textarea
                      value={config.statsManualContent || ''}
                      onChange={(e) => updateConfig('statsManualContent', e.target.value)}
                      className="rounded-xl min-h-[80px] text-[13px]"
                      placeholder="e.g., 10,000+ Students | 500+ Courses | 50+ Instructors"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          <Separator />
          <SaveRow saving={saving} onSave={handleSave} accentColor="bg-teal-600 hover:bg-teal-700" label="Save Layout" />
        </CardContent>
      </Card>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 6 — CERTIFICATE
  // ═══════════════════════════════════════════════════════════════

  const renderCertificateTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <SectionHeader
          icon={Award}
          iconBg="bg-gradient-to-br from-rose-500/20 to-pink-500/20"
          iconColor="text-rose-600 dark:text-rose-400"
          title="Certificate Design"
          description="Customize the look of completion certificates"
        />
        <CardContent className="space-y-6">
          {/* Template Selector */}
          <div className="space-y-3">
            <Label className="text-[14px] font-semibold">Certificate Template</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {CERT_TEMPLATES.map(tmpl => {
                const IconComp = tmpl.icon
                const isSelected = config.certTemplate === tmpl.value
                return (
                  <button
                    key={tmpl.value}
                    onClick={() => updateConfig('certTemplate', tmpl.value)}
                    className={cn(
                      'flex flex-col items-center gap-3 rounded-2xl border p-4 cursor-pointer transition-colors text-center',
                      isSelected
                        ? 'border-rose-300 bg-rose-50/50 dark:border-rose-700 dark:bg-rose-950/20'
                        : 'hover:bg-muted/30'
                    )}
                  >
                    <div className={cn(
                      'flex size-12 items-center justify-center rounded-xl',
                      isSelected ? 'bg-rose-100 dark:bg-rose-950/40' : 'bg-gray-100 dark:bg-gray-800'
                    )}>
                      <IconComp className={cn('size-5', isSelected ? 'text-rose-600 dark:text-rose-400' : 'text-gray-400')} />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold">{tmpl.label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{tmpl.desc}</p>
                    </div>
                    {isSelected && <Badge className="rounded-lg text-[10px] bg-rose-600">Selected</Badge>}
                  </button>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Logo Position */}
          <div className="space-y-3">
            <Label className="text-[14px] font-semibold">Logo Position</Label>
            <RadioGroup
              value={config.certLogoPosition}
              onValueChange={(v) => updateConfig('certLogoPosition', v)}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {[
                { value: 'top_center', label: 'Top Center', desc: 'Centered at the top' },
                { value: 'top_left', label: 'Top Left', desc: 'Aligned to the left' },
                { value: 'top_right', label: 'Top Right', desc: 'Aligned to the right' },
              ].map(opt => (
                <label key={opt.value} className={cn(
                  'flex flex-col items-center gap-1.5 rounded-2xl border p-4 cursor-pointer transition-colors text-center',
                  config.certLogoPosition === opt.value
                    ? 'border-rose-300 bg-rose-50/50 dark:border-rose-700 dark:bg-rose-950/20'
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

          {/* Signature & Signatory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[14px] font-semibold">Signature Image</Label>
              <p className="text-[12px] text-muted-foreground">Upload a signature for the certificate</p>
              <div className="flex items-center gap-3">
                {config.certSignatureUrl ? (
                  <div className="size-12 rounded-xl border flex items-center justify-center overflow-hidden">
                    <img src={config.certSignatureUrl} alt="Signature" className="size-10 object-contain" />
                  </div>
                ) : (
                  <div className="size-12 rounded-xl border-2 border-dashed flex items-center justify-center">
                    <PenTool className="size-5 text-gray-300" />
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5 h-8 text-[12px]"
                  onClick={() => handleFileUpload('certSignatureUrl')}
                >
                  <Upload className="size-3" /> Upload
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[14px] font-semibold">Signatory Name</Label>
              <p className="text-[12px] text-muted-foreground">Name and title under the signature</p>
              <Input
                value={config.certSignatoryName}
                onChange={(e) => updateConfig('certSignatoryName', e.target.value)}
                className="rounded-xl"
                placeholder="Ahmad Hassan — CEO, ShijlAI Academy"
              />
            </div>
          </div>

          <Separator />

          {/* Background */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[13px] font-medium">Background Image</p>
              <div className="flex items-center gap-3">
                {config.certBackgroundUrl ? (
                  <div className="size-12 rounded-xl border flex items-center justify-center overflow-hidden">
                    <img src={config.certBackgroundUrl} alt="Bg" className="size-10 object-cover" />
                  </div>
                ) : (
                  <div className="size-12 rounded-xl border-2 border-dashed flex items-center justify-center">
                    <ImageIcon className="size-5 text-gray-300" />
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl gap-1.5 h-8 text-[12px]"
                  onClick={() => handleFileUpload('certBackgroundUrl')}
                >
                  <Upload className="size-3" /> Upload
                </Button>
              </div>
            </div>
            <ColorInput label="Background Color" value={config.certBgColor} onChange={(v) => updateConfig('certBgColor', v)} />
          </div>

          <Separator />
          <SaveRow saving={saving} onSave={handleSave} accentColor="bg-rose-600 hover:bg-rose-700" label="Save Certificate" />
        </CardContent>
      </Card>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 7 — EMAIL TEMPLATES
  // ═══════════════════════════════════════════════════════════════

  const renderEmailTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <SectionHeader
          icon={Mail}
          iconBg="bg-gradient-to-br from-amber-500/20 to-orange-500/20"
          iconColor="text-amber-600 dark:text-amber-400"
          title="Email Templates"
          description="Customize the appearance of system emails"
        />
        <CardContent className="space-y-6">
          {/* Email Header Background Color */}
          <div className="space-y-2">
            <ColorInput label="Header Background Color" value={config.emailHeaderBgColor} onChange={(v) => updateConfig('emailHeaderBgColor', v)} description="Background color of the email header banner" />
          </div>

          <Separator />

          {/* Email Header Image */}
          <div className="space-y-2">
            <Label className="text-[14px] font-semibold">Email Header Image</Label>
            <p className="text-[12px] text-muted-foreground">Optional image displayed at the top of emails</p>
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-xl border-2 border-dashed flex items-center justify-center">
                <ImageIcon className="size-5 text-gray-300" />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5 h-8 text-[12px]"
                onClick={() => handleFileUpload('emailHeaderImage')}
              >
                <Upload className="size-3" /> Upload
              </Button>
            </div>
          </div>

          <Separator />

          {/* Email Footer Text */}
          <div className="space-y-2">
            <Label className="text-[14px] font-semibold">Footer Text</Label>
            <p className="text-[12px] text-muted-foreground">Text displayed at the bottom of all emails</p>
            <Input
              value={config.emailFooterText}
              onChange={(e) => updateConfig('emailFooterText', e.target.value)}
              className="rounded-xl"
              placeholder="© 2024 ShijlAI Academy. All rights reserved."
            />
          </div>

          <Separator />

          {/* Email Font Family */}
          <div className="space-y-2">
            <Label className="text-[14px] font-semibold">Email Font Family</Label>
            <Select value={config.emailFontFamily} onValueChange={(v) => updateConfig('emailFontFamily', v)}>
              <SelectTrigger className="rounded-xl w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Button Border Radius */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-[14px] font-semibold">Button Border Radius</Label>
                <p className="text-[12px] text-muted-foreground">Roundness of email CTA buttons</p>
              </div>
              <Badge variant="outline" className="rounded-lg text-[11px]">{config.emailButtonRadius}px</Badge>
            </div>
            <Slider
              value={[parseInt(config.emailButtonRadius) || 8]}
              onValueChange={(v) => updateConfig('emailButtonRadius', String(v[0]))}
              min={0}
              max={24}
              step={1}
              className="w-full max-w-md"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground max-w-md">
              <span>0px (Square)</span><span>24px (Round)</span>
            </div>
          </div>

          <Separator />

          {/* Email Preview */}
          <div className="space-y-3">
            <Label className="text-[14px] font-semibold">Email Preview</Label>
            <div className="rounded-2xl border overflow-hidden max-w-md mx-auto">
              {/* Header */}
              <div className="p-4" style={{ backgroundColor: config.emailHeaderBgColor }}>
                <p className="text-white font-bold text-[14px]">{config.platformName}</p>
              </div>
              {/* Body */}
              <div className="p-4 bg-white space-y-3">
                <div className="h-3 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-full rounded bg-gray-100" />
                <div className="h-3 w-2/3 rounded bg-gray-100" />
                <div className="flex justify-center pt-2">
                  <div
                    className="px-6 py-2 text-white text-[12px] font-medium"
                    style={{
                      backgroundColor: config.emailHeaderBgColor,
                      borderRadius: `${config.emailButtonRadius}px`,
                    }}
                  >
                    Call to Action
                  </div>
                </div>
              </div>
              {/* Footer */}
              <div className="p-3 bg-gray-50 border-t">
                <p className="text-[10px] text-gray-500 text-center">{config.emailFooterText}</p>
              </div>
            </div>
          </div>

          <Separator />
          <SaveRow saving={saving} onSave={handleSave} accentColor="bg-amber-600 hover:bg-amber-700" label="Save Email Template" />
        </CardContent>
      </Card>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 8 — SOCIAL & OG
  // ═══════════════════════════════════════════════════════════════

  const renderSocialOGTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <SectionHeader
          icon={Share2}
          iconBg="bg-gradient-to-br from-violet-500/20 to-purple-500/20"
          iconColor="text-violet-600 dark:text-violet-400"
          title="Social & Open Graph"
          description="Configure how your site appears when shared on social media"
        />
        <CardContent className="space-y-6">
          {/* OG Title */}
          <div className="space-y-2">
            <Label className="text-[14px] font-semibold">OG Title</Label>
            <p className="text-[12px] text-muted-foreground">Custom title for social shares (leave empty to use platform name)</p>
            <Input
              value={config.ogTitle || ''}
              onChange={(e) => updateConfig('ogTitle', e.target.value || null)}
              className="rounded-xl"
              placeholder={config.platformName}
            />
          </div>

          <Separator />

          {/* OG Description */}
          <div className="space-y-2">
            <Label className="text-[14px] font-semibold">OG Description</Label>
            <p className="text-[12px] text-muted-foreground">Custom description for social shares (leave empty to use tagline)</p>
            <Textarea
              value={config.ogDescription || ''}
              onChange={(e) => updateConfig('ogDescription', e.target.value || null)}
              className="rounded-xl min-h-[80px] text-[13px]"
              placeholder={config.tagline}
              rows={3}
            />
          </div>

          <Separator />

          {/* OG Image */}
          <div className="space-y-2">
            <Label className="text-[14px] font-semibold">OG Image</Label>
            <p className="text-[12px] text-muted-foreground">Default share image (1200×630 recommended)</p>
            <div className="flex items-center gap-3">
              {config.ogImageUrl ? (
                <div className="size-16 rounded-xl border flex items-center justify-center overflow-hidden">
                  <img src={config.ogImageUrl} alt="OG" className="size-14 object-cover" />
                </div>
              ) : (
                <div className="size-16 rounded-xl border-2 border-dashed flex items-center justify-center">
                  <Share2 className="size-6 text-gray-300" />
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-1.5 h-8 text-[12px]"
                onClick={() => handleFileUpload('ogImageUrl')}
              >
                <Upload className="size-3" /> Upload
              </Button>
            </div>
          </div>

          <Separator />

          {/* Twitter Handle */}
          <div className="space-y-2">
            <Label className="text-[14px] font-semibold">Twitter Handle</Label>
            <p className="text-[12px] text-muted-foreground">Your Twitter username for Twitter card metadata</p>
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted shrink-0">
                <Twitter className="size-4 text-muted-foreground" />
              </div>
              <Input
                value={config.twitterHandle || ''}
                onChange={(e) => updateConfig('twitterHandle', e.target.value || null)}
                className="rounded-xl text-[13px]"
                placeholder="@username"
              />
            </div>
          </div>

          <Separator />

          {/* Share Preview */}
          <div className="space-y-3">
            <Label className="text-[14px] font-semibold">Share Preview</Label>
            <div className="rounded-2xl border overflow-hidden max-w-md mx-auto">
              <div className="h-32 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                {config.ogImageUrl ? (
                  <img src={config.ogImageUrl} alt="OG Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="size-10 text-muted-foreground/30" />
                )}
              </div>
              <div className="p-3 bg-muted/30">
                <p className="text-[12px] text-muted-foreground uppercase tracking-wide">{typeof window !== 'undefined' ? window.location.hostname : 'yoursite.com'}</p>
                <p className="text-[14px] font-semibold">{config.ogTitle || config.platformName}</p>
                <p className="text-[12px] text-muted-foreground line-clamp-2">{config.ogDescription || config.tagline}</p>
              </div>
            </div>
          </div>

          <Separator />
          <SaveRow saving={saving} onSave={handleSave} accentColor="bg-violet-600 hover:bg-violet-700" label="Save Social & OG" />
        </CardContent>
      </Card>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 9 — CUSTOM CODE
  // ═══════════════════════════════════════════════════════════════

  const renderCustomCodeTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <SectionHeader
          icon={FileCode}
          iconBg="bg-gradient-to-br from-gray-500/20 to-slate-500/20"
          iconColor="text-gray-600 dark:text-gray-400"
          title="Custom Code"
          description="Add custom CSS, JavaScript, and toggle animations"
        />
        <CardContent className="space-y-6">
          {/* Custom CSS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/40">
                  <Code className="size-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold">Custom CSS</p>
                  <p className="text-[12px] text-muted-foreground">Inject custom styles into the platform</p>
                </div>
              </div>
              <Switch
                checked={config.enableCustomCss}
                onCheckedChange={(v) => updateConfig('enableCustomCss', v)}
              />
            </div>
            {config.enableCustomCss && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={springTransition}>
                <Textarea
                  value={config.customCss || ''}
                  onChange={(e) => updateConfig('customCss', e.target.value)}
                  className="rounded-xl min-h-[200px] text-[12px] font-mono bg-gray-50 dark:bg-gray-900"
                  placeholder={`/* Custom CSS */\n:root {\n  --custom-color: #ff0000;\n}\n\n.my-custom-class {\n  color: var(--custom-color);\n}`}
                  rows={12}
                />
              </motion.div>
            )}
          </div>

          <Separator />

          {/* Custom JS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40">
                  <FileCode className="size-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold">Custom JavaScript</p>
                  <p className="text-[12px] text-muted-foreground">Inject custom scripts into the platform</p>
                </div>
              </div>
              <Switch
                checked={config.enableCustomJs}
                onCheckedChange={(v) => updateConfig('enableCustomJs', v)}
              />
            </div>
            {config.enableCustomJs && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={springTransition}>
                <Textarea
                  value={config.customJs || ''}
                  onChange={(e) => updateConfig('customJs', e.target.value)}
                  className="rounded-xl min-h-[200px] text-[12px] font-mono bg-gray-50 dark:bg-gray-900"
                  placeholder={`// Custom JavaScript\nconsole.log('Custom script loaded');\n\nfunction initCustomFeature() {\n  // Your code here\n}`}
                  rows={12}
                />
              </motion.div>
            )}
          </div>

          <Separator />

          {/* Animations Toggle */}
          <div className="flex items-center justify-between rounded-2xl border p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40">
                <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-[14px] font-semibold">Enable Animations</p>
                <p className="text-[12px] text-muted-foreground">Toggle platform-wide animations and transitions</p>
              </div>
            </div>
            <Switch
              checked={config.enableAnimations}
              onCheckedChange={(v) => updateConfig('enableAnimations', v)}
            />
          </div>

          {/* Compact Mode */}
          <div className="flex items-center justify-between rounded-2xl border p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <MonitorSmartphone className="size-4 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-[14px] font-semibold">Compact Mode</p>
                <p className="text-[12px] text-muted-foreground">Reduce spacing for information-dense layouts</p>
              </div>
            </div>
            <Switch
              checked={config.compactMode}
              onCheckedChange={(v) => updateConfig('compactMode', v)}
            />
          </div>

          <Separator />
          <SaveRow saving={saving} onSave={handleSave} accentColor="bg-gray-700 hover:bg-gray-800" label="Save Custom Code" />
        </CardContent>
      </Card>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // RENDER: TAB 10 — ADVANCED
  // ═══════════════════════════════════════════════════════════════

  const renderAdvancedTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      {/* Watermark Settings */}
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <SectionHeader
          icon={Droplets}
          iconBg="bg-gradient-to-br from-cyan-500/20 to-teal-500/20"
          iconColor="text-cyan-600 dark:text-cyan-400"
          title="Watermark"
          description="Add a watermark overlay to your platform content"
        />
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-950/40">
                <Droplets className="size-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <p className="text-[14px] font-semibold">Enable Watermark</p>
                <p className="text-[12px] text-muted-foreground">Show watermark on course content and certificates</p>
              </div>
            </div>
            <Switch
              checked={config.enableWatermark}
              onCheckedChange={(v) => updateConfig('enableWatermark', v)}
            />
          </div>

          {config.enableWatermark && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={springTransition} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[14px] font-semibold">Watermark Text</Label>
                  <Input
                    value={config.watermarkText || ''}
                    onChange={(e) => updateConfig('watermarkText', e.target.value || null)}
                    className="rounded-xl"
                    placeholder={config.platformName}
                  />
                  <p className="text-[11px] text-muted-foreground">Leave empty to use platform name</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-[14px] font-semibold">Position</Label>
                  <Select value={config.watermarkPosition} onValueChange={(v) => updateConfig('watermarkPosition', v)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WATERMARK_POSITIONS.map(pos => (
                        <SelectItem key={pos.value} value={pos.value}>{pos.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[14px] font-semibold">Opacity</Label>
                  <Badge variant="outline" className="rounded-lg text-[11px]">{Math.round(parseFloat(config.watermarkOpacity || '0.05') * 100)}%</Badge>
                </div>
                <Slider
                  value={[parseFloat(config.watermarkOpacity || '0.05') * 100]}
                  onValueChange={(v) => updateConfig('watermarkOpacity', (v[0] / 100).toFixed(2))}
                  min={1}
                  max={50}
                  step={1}
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>1% (Subtle)</span><span>50% (Bold)</span>
                </div>
              </div>

              {/* Watermark Preview */}
              <div className="rounded-2xl border p-6 bg-gray-50 dark:bg-gray-900 relative overflow-hidden min-h-[100px] flex items-center justify-center">
                <p className="text-[12px] text-gray-400">Content area</p>
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{
                    opacity: parseFloat(config.watermarkOpacity || '0.05'),
                    transform: config.watermarkPosition?.includes('top') ? 'translateY(-30%)' :
                      config.watermarkPosition?.includes('bottom') ? 'translateY(30%)' : 'none',
                    justifyContent: config.watermarkPosition?.includes('left') ? 'flex-start' :
                      config.watermarkPosition?.includes('right') ? 'flex-end' : 'center',
                    paddingLeft: config.watermarkPosition?.includes('left') ? '24px' : undefined,
                    paddingRight: config.watermarkPosition?.includes('right') ? '24px' : undefined,
                  }}
                >
                  <span className="text-[28px] font-bold text-gray-900 select-none" style={{ transform: 'rotate(-25deg)' }}>
                    {config.watermarkText || config.platformName}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Announcement Banner */}
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <SectionHeader
          icon={Megaphone}
          iconBg="bg-gradient-to-br from-orange-500/20 to-red-500/20"
          iconColor="text-orange-600 dark:text-orange-400"
          title="Announcement Banner"
          description="Display a site-wide announcement banner to all users"
        />
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950/40">
                <Megaphone className="size-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-[14px] font-semibold">Enable Banner</p>
                <p className="text-[12px] text-muted-foreground">Show announcement banner at the top of the site</p>
              </div>
            </div>
            <Switch
              checked={config.bannerEnabled}
              onCheckedChange={(v) => updateConfig('bannerEnabled', v)}
            />
          </div>

          {config.bannerEnabled && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={springTransition} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[14px] font-semibold">Banner Message</Label>
                <Textarea
                  value={config.bannerMessage || ''}
                  onChange={(e) => updateConfig('bannerMessage', e.target.value || null)}
                  className="rounded-xl min-h-[60px] text-[13px]"
                  placeholder="Announcement message..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[14px] font-semibold">Banner Type</Label>
                  <Select value={config.bannerType} onValueChange={(v) => updateConfig('bannerType', v)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BANNER_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <Switch
                    checked={config.bannerDismissible}
                    onCheckedChange={(v) => updateConfig('bannerDismissible', v)}
                  />
                  <div>
                    <p className="text-[13px] font-medium">Dismissible</p>
                    <p className="text-[11px] text-muted-foreground">Users can close the banner</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[14px] font-semibold">Link URL</Label>
                  <Input
                    value={config.bannerLinkUrl || ''}
                    onChange={(e) => updateConfig('bannerLinkUrl', e.target.value || null)}
                    className="rounded-xl"
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[14px] font-semibold">Link Text</Label>
                  <Input
                    value={config.bannerLinkText || ''}
                    onChange={(e) => updateConfig('bannerLinkText', e.target.value || null)}
                    className="rounded-xl"
                    placeholder="Learn More"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ColorInput label="Background Color" value={config.bannerBgColor} onChange={(v) => updateConfig('bannerBgColor', v)} />
                <ColorInput label="Text Color" value={config.bannerTextColor} onChange={(v) => updateConfig('bannerTextColor', v)} />
              </div>

              {/* Banner Preview */}
              <div className="space-y-2">
                <Label className="text-[13px] font-medium">Banner Preview</Label>
                <div
                  className="rounded-xl px-4 py-2.5 flex items-center justify-between"
                  style={{ backgroundColor: config.bannerBgColor, color: config.bannerTextColor }}
                >
                  <div className="flex items-center gap-2">
                    {config.bannerType === 'warning' ? <AlertTriangle className="size-4" /> :
                      config.bannerType === 'error' ? <XCircle className="size-4" /> :
                        config.bannerType === 'success' ? <CheckCircle2 className="size-4" /> :
                          <Info className="size-4" />}
                    <span className="text-[13px] font-medium">
                      {config.bannerMessage || 'Your announcement message here'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {config.bannerLinkText && (
                      <span className="text-[12px] underline font-medium flex items-center gap-1">
                        {config.bannerLinkText} <ExternalLink className="size-3" />
                      </span>
                    )}
                    {config.bannerDismissible && <XCircle className="size-4 opacity-60 cursor-pointer" />}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Export / Import */}
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <SectionHeader
          icon={Download}
          iconBg="bg-gradient-to-br from-indigo-500/20 to-blue-500/20"
          iconColor="text-indigo-600 dark:text-indigo-400"
          title="Export / Import Theme"
          description="Download or upload a theme configuration file"
        />
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="rounded-xl gap-1.5 h-12"
              onClick={handleExport}
            >
              <Download className="size-4" /> Export Theme as JSON
            </Button>
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-xl gap-1.5 h-12"
                >
                  <UploadCloud className="size-4" /> Import Theme from JSON
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle>Import Theme</DialogTitle>
                  <DialogDescription>Paste a valid JSON theme configuration to import.</DialogDescription>
                </DialogHeader>
                <Textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  className="rounded-xl min-h-[200px] font-mono text-[12px]"
                  placeholder='Paste your JSON configuration here...'
                  rows={10}
                />
                <DialogFooter>
                  <Button variant="outline" className="rounded-xl" onClick={() => setImportOpen(false)}>Cancel</Button>
                  <Button
                    className="rounded-xl gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleImport}
                    disabled={importing}
                  >
                    {importing ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
                    Import
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Appearance History */}
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
        <SectionHeader
          icon={Clock}
          iconBg="bg-gradient-to-br from-gray-500/20 to-zinc-500/20"
          iconColor="text-gray-600 dark:text-gray-400"
          title="Appearance History"
          description="View recent changes and restore previous configurations"
        />
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-1.5 text-[12px]"
            onClick={fetchHistory}
          >
            <Clock className="size-3.5" /> Load History
          </Button>

          {historyLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="size-8 mx-auto mb-2 opacity-40" />
              <p className="text-[13px]">No history entries yet</p>
              <p className="text-[12px]">History is recorded when you save changes</p>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-2">
                {history.map(entry => (
                  <div key={entry.id} className="flex items-center justify-between rounded-2xl border p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0">
                        <Clock className="size-3.5 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium truncate">
                          {entry.changeDescription || 'Appearance settings updated'}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleString()}
                          {entry.presetName && ` · ${entry.presetName}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-1.5 h-7 text-[11px] shrink-0 ml-2"
                      onClick={() => handleRestore(entry)}
                    >
                      <RotateCcw className="size-3" /> Restore
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Save all advanced */}
      <div className="flex justify-end">
        <Button
          className="rounded-xl gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Save Advanced Settings
        </Button>
      </div>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // TAB DEFINITIONS
  // ═══════════════════════════════════════════════════════════════

  const tabDefs = [
    { value: 'branding', label: 'Branding', icon: Palette },
    { value: 'colors', label: 'Colors & Theme', icon: Paintbrush },
    { value: 'navigation', label: 'Navigation', icon: Navigation },
    { value: 'footer', label: 'Footer', icon: Layout },
    { value: 'homepage', label: 'Homepage', icon: Layout },
    { value: 'certificate', label: 'Certificate', icon: Award },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'social', label: 'Social & OG', icon: Share2 },
    { value: 'code', label: 'Custom Code', icon: FileCode },
    { value: 'advanced', label: 'Advanced', icon: Settings },
  ]

  // ═══════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {renderToast()}

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20">
          <Palette className="size-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-[22px] font-bold">Appearance & Branding</h1>
          <p className="text-[14px] text-muted-foreground">Customize the look, feel, and branding of your platform</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <ScrollArea className="w-full">
          <TabsList className="rounded-2xl bg-muted/50 p-1.5 h-auto flex-wrap gap-1 inline-flex">
            {tabDefs.map(tab => {
              const IconComp = tab.icon
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-xl gap-1.5 text-[12px] data-[state=active]:bg-white data-[state=active]:ios-shadow-sm dark:data-[state=active]:bg-gray-800 px-3 py-1.5"
                >
                  <IconComp className="size-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </ScrollArea>

        <TabsContent value="branding">{renderBrandingTab()}</TabsContent>
        <TabsContent value="colors">{renderColorsTab()}</TabsContent>
        <TabsContent value="navigation">{renderNavigationTab()}</TabsContent>
        <TabsContent value="footer">{renderFooterTab()}</TabsContent>
        <TabsContent value="homepage">{renderHomepageTab()}</TabsContent>
        <TabsContent value="certificate">{renderCertificateTab()}</TabsContent>
        <TabsContent value="email">{renderEmailTab()}</TabsContent>
        <TabsContent value="social">{renderSocialOGTab()}</TabsContent>
        <TabsContent value="code">{renderCustomCodeTab()}</TabsContent>
        <TabsContent value="advanced">{renderAdvancedTab()}</TabsContent>
      </Tabs>
    </div>
  )
}
