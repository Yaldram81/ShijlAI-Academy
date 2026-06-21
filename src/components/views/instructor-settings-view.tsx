'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings, User, Bell, CreditCard, Lock, Globe, Link2,
  Trash2, ExternalLink, Plus, X, Check, Sparkles,
  Loader2, Eye, EyeOff, Shield, Smartphone, Mail, Key,
  Video, MessageSquare, Webhook, Zap,
  Upload, Save, AlertTriangle, Search, Palette,
  Monitor, Moon, Sun, Clock, Languages, Currency,
  FileText, VideoIcon, ToggleLeft, ToggleRight,
  ChevronDown, Info, RefreshCw, LogOut, Fingerprint,
  EyeClosed, Users, DollarSign, Heart, BookOpen, Camera,
  Layout, Type, PanelLeft, CircleDot
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { ShijlAIText } from '@/components/ui/brand-text'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

/* ─── Types ─── */
type SettingsTab = 'profile' | 'account' | 'notifications' | 'appearance' | 'privacy' | 'payout' | 'integrations' | 'preferences'

interface ExpertiseTag { id: string; label: string }
interface LanguageTag { id: string; label: string; verified: boolean }

interface NotificationSetting {
  id: string; event: string; description: React.ReactNode; icon: React.ReactNode
  inApp: boolean; email: 'immediately' | 'daily' | 'weekly' | 'off'
}

interface SessionInfo {
  id: string; deviceName: string; deviceType: string; browser: string
  os: string; ipAddress: string; location: string; isActive: boolean
  lastActivity: string; isCurrent: boolean; createdAt: string
}

/* ─── Constants ─── */
const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

const defaultProfile = {
  displayName: '', headline: '', bio: '',
  website: '', linkedin: '', twitter: '', youtube: '',
}

const defaultAppearance = {
  theme: 'system' as string, compactMode: false,
  sidebarPosition: 'left' as string, fontSize: 'medium' as string,
}

const defaultPrivacy = {
  profileVisibility: 'public' as string, showEmail: false,
  showPhone: false, showRevenue: false, showStudentCount: true,
}

const defaultPreferences = {
  timezone: 'UTC', dateFormat: 'DD/MM/YYYY', currency: 'USD',
  preferredLanguage: 'en', autoSaveDrafts: true,
  defaultCourseLanguage: 'en', videoQuality: '1080p',
  emailDigest: 'daily' as string, marketingEmails: true,
  securityAlertEmails: true, courseUpdateEmails: true,
}

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET, UTC-5)' },
  { value: 'Europe/London', label: 'London (GMT/BST, UTC+0)' },
  { value: 'Asia/Dubai', label: 'UAE (GST, UTC+4)' },
  { value: 'Asia/Kolkata', label: 'India (IST, UTC+5:30)' },
  { value: 'Asia/Riyadh', label: 'Saudi Arabia (AST, UTC+3)' },
  { value: 'America/Los_Angeles', label: 'US Pacific (PST/PDT)' },
  { value: 'Asia/Tokyo', label: 'Japan (JST, UTC+9)' },
  { value: 'Asia/Shanghai', label: 'China (CST, UTC+8)' },
  { value: 'Australia/Sydney', label: 'Australia (AEST/AEDT)' },
]

const CURRENCIES = [
  { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'GBP', label: 'GBP - British Pound', symbol: '£' },
  { value: 'AED', label: 'AED - UAE Dirham', symbol: 'د.إ' },
  { value: 'SAR', label: 'SAR - Saudi Riyal', symbol: '﷼' },
  { value: 'INR', label: 'INR - Indian Rupee', symbol: '₹' },
  { value: 'CAD', label: 'CAD - Canadian Dollar', symbol: 'C$' },
  { value: 'AUD', label: 'AUD - Australian Dollar', symbol: 'A$' },
]

/* ─── Auto-save Hook ─── */
function useAutoSave(callback: () => Promise<void>, delay = 1500) {
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const trigger = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setSaving(true)
      try {
        await callbackRef.current()
        setLastSaved(new Date())
      } catch { /* error handled in callback */ } finally {
        setSaving(false)
      }
    }, delay)
  }, [delay])

  const saveNow = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setSaving(true)
    try {
      await callbackRef.current()
      setLastSaved(new Date())
    } catch { /* error handled in callback */ } finally {
      setSaving(false)
    }
  }, [])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  return { saving, lastSaved, trigger, saveNow }
}

/* ─── Settings Fetch Hook ─── */
function useInstructorSettings(instructorId: string | undefined) {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    if (!instructorId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/instructor/settings?instructorId=${instructorId}`)
      if (res.ok) {
        const data = await res.json()
        setSettings(data.settings || {})
      }
    } catch { /* silent */ } finally { setLoading(false) }
  }, [instructorId])

  useEffect(() => { fetchSettings() }, [fetchSettings])
  return { settings, loading, refetch: fetchSettings, setSettings }
}

/* ─── Profile Completion Calculator ─── */
function calcProfileCompletion(profile: typeof defaultProfile, expertise: ExpertiseTag[], langs: LanguageTag[], photoUrl: string) {
  let score = 0
  if (photoUrl) score += 15
  if (profile.displayName.trim()) score += 15
  if (profile.headline.trim()) score += 15
  if (profile.bio.trim()) score += 20
  if (expertise.length > 0) score += 10
  if (langs.length > 0) score += 10
  if (profile.website || profile.linkedin || profile.twitter || profile.youtube) score += 15
  return Math.min(score, 100)
}

/* ═══════════════════════════════════════════════════════════
   PROFILE TAB
   ═══════════════════════════════════════════════════════════ */
function ProfileTab() {
  const { currentUser, setCurrentUser } = useAppStore()
  const [profile, setProfile] = useState(defaultProfile)
  const [expertise, setExpertise] = useState<ExpertiseTag[]>([])
  const [langs, setLangs] = useState<LanguageTag[]>([])
  const [newTag, setNewTag] = useState('')
  const [newLang, setNewLang] = useState('')
  const [improvingBio, setImprovingBio] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoUrl, setPhotoUrl] = useState(currentUser?.avatar || '')

  const completion = useMemo(() => calcProfileCompletion(profile, expertise, langs, photoUrl), [profile, expertise, langs, photoUrl])

  const completionTips = useMemo(() => {
    const tips: string[] = []
    if (!photoUrl) tips.push('Add a profile photo')
    if (!profile.displayName.trim()) tips.push('Set your display name')
    if (!profile.headline.trim()) tips.push('Add a professional headline')
    if (!profile.bio.trim()) tips.push('Write a bio')
    if (expertise.length === 0) tips.push('Add at least one expertise tag')
    if (langs.length === 0) tips.push('Add your spoken languages')
    if (!profile.website && !profile.linkedin && !profile.twitter && !profile.youtube) tips.push('Link at least one social profile')
    return tips
  }, [profile, expertise, langs, photoUrl])

  // Fetch profile on mount
  useEffect(() => {
    if (!currentUser?.id) return
    const fetchProfile = async () => {
      setLoadingProfile(true)
      try {
        const res = await fetch(`/api/instructor/profile?instructorId=${currentUser.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.profile) {
            setProfile({
              displayName: data.profile.displayName || '',
              headline: data.profile.headline || '',
              bio: data.profile.bio || '',
              website: data.profile.website || '',
              linkedin: data.profile.linkedin || '',
              twitter: data.profile.twitter || '',
              youtube: data.profile.youtube || '',
            })
            if (data.profile.expertise?.length > 0) {
              setExpertise(data.profile.expertise.map((label: string, i: number) => ({ id: String(i + 1), label })))
            }
            if (data.profile.languages?.length > 0) {
              setLangs(data.profile.languages.map((l: { name: string; verified: boolean }, i: number) => ({ id: String(i + 1), label: l.name, verified: l.verified })))
            }
            if (data.profile.avatar) setPhotoUrl(data.profile.avatar)
          }
        }
      } catch { /* silent */ } finally { setLoadingProfile(false) }
    }
    fetchProfile()
  }, [currentUser?.id])

  const handleImproveBio = async () => {
    setImprovingBio(true)
    try {
      const res = await fetch('/api/instructor/ai/improve-bio', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: profile.bio, headline: profile.headline }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to improve bio')
      setProfile(prev => ({ ...prev, bio: data.content || data.bio || prev.bio }))
      toast.success('Bio improved by AI!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to improve bio')
    } finally { setImprovingBio(false) }
  }

  const handleSave = async () => {
    try {
      const res = await fetch('/api/instructor/profile', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId: currentUser?.id, displayName: profile.displayName,
          headline: profile.headline, bio: profile.bio, website: profile.website,
          linkedin: profile.linkedin, twitter: profile.twitter, youtube: profile.youtube,
          expertise: expertise.map(t => t.label),
          languages: langs.map(l => ({ name: l.label, verified: l.verified })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save profile')
      toast.success('Profile saved successfully!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save profile')
    }
  }

  const handlePhotoUpload = () => fileInputRef.current?.click()

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return }
    setUploadingPhoto(true)
    try {
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string
        const res = await fetch('/api/instructor/settings/avatar', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser?.id, avatarData: base64 }),
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || 'Failed to upload photo')
        }
        setPhotoUrl(base64)
        if (currentUser) setCurrentUser({ ...currentUser, avatar: base64 })
        toast.success('Photo uploaded & saved!')
      }
      reader.readAsDataURL(file)
    } catch { toast.error('Failed to upload photo') } finally { setUploadingPhoto(false) }
  }

  const handleRemovePhoto = async () => {
    try {
      const res = await fetch('/api/instructor/settings/avatar', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id }),
      })
      if (!res.ok) throw new Error('Failed to remove photo')
      setPhotoUrl('')
      if (currentUser) setCurrentUser({ ...currentUser, avatar: undefined })
      toast.success('Photo removed')
    } catch { toast.error('Failed to remove photo') }
  }

  const addExpertise = () => {
    if (!newTag.trim()) return
    if (expertise.some(t => t.label.toLowerCase() === newTag.trim().toLowerCase())) { toast.error('Tag already exists'); return }
    setExpertise(prev => [...prev, { id: Date.now().toString(), label: newTag.trim() }])
    setNewTag('')
  }
  const removeExpertise = (id: string) => setExpertise(prev => prev.filter(t => t.id !== id))

  const addLanguage = () => {
    if (!newLang.trim()) return
    if (langs.some(l => l.label.toLowerCase() === newLang.trim().toLowerCase())) { toast.error('Language already added'); return }
    setLangs(prev => [...prev, { id: Date.now().toString(), label: newLang.trim(), verified: false }])
    setNewLang('')
  }
  const removeLanguage = (id: string) => setLangs(prev => prev.filter(l => l.id !== id))

  if (loadingProfile) return <ProfileSkeleton />

  return (
    <div className="space-y-6">
      {/* Profile Completion */}
      <div className="rounded-2xl bg-card border border-border/30 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-lg text-[10px] px-2">Profile Completion</Badge>
            <span className="text-sm font-bold">{completion}%</span>
          </div>
          {completion < 100 && (
            <Button variant="ghost" size="sm" className="rounded-xl text-xs text-primary" onClick={handleSave}>
              Complete profile <ChevronDown className="size-3 rotate-180" />
            </Button>
          )}
        </div>
        <Progress value={completion} className="h-2 rounded-full" />
        {completionTips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {completionTips.map(tip => (
              <Badge key={tip} variant="outline" className="rounded-lg text-[10px] gap-1 px-2 py-0.5 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                <AlertTriangle className="size-2.5" /> {tip}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Profile Photo */}
      <div className="rounded-2xl bg-card border border-border/30 p-5 space-y-4">
        <Label className="text-[13px] font-semibold">Profile Photo</Label>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Avatar className="size-20 ring-2 ring-primary/20 rounded-2xl">
              <AvatarImage src={photoUrl || undefined} alt={profile.displayName} />
              <AvatarFallback className="text-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold rounded-2xl">
                {profile.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'IN'}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={handlePhotoUpload}
              className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="size-6 text-white" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePhotoUpload} disabled={uploadingPhoto} className="rounded-xl gap-1.5 text-xs">
                {uploadingPhoto ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />} Upload new
              </Button>
              {photoUrl && (
                <Button variant="ghost" size="sm" onClick={handleRemovePhoto} className="rounded-xl gap-1.5 text-xs text-destructive hover:text-destructive">
                  <Trash2 className="size-3.5" /> Remove
                </Button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">JPG, PNG. Max 2MB. Square recommended.</p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </div>
      </div>

      {/* Display Name & Headline */}
      <div className="rounded-2xl bg-card border border-border/30 p-5 space-y-4">
        <div className="space-y-2">
          <Label className="text-[13px] font-semibold">Display Name</Label>
          <Input value={profile.displayName} onChange={(e) => setProfile(prev => ({ ...prev, displayName: e.target.value }))} className="rounded-xl" placeholder="Your full name" />
        </div>
        <div className="space-y-2">
          <Label className="text-[13px] font-semibold">Headline</Label>
          <Input value={profile.headline} onChange={(e) => setProfile(prev => ({ ...prev, headline: e.target.value }))} className="rounded-xl" placeholder="e.g., Senior Python Developer & Educator" />
          <p className="text-[10px] text-muted-foreground">Appears under your name on your public profile</p>
        </div>
      </div>

      {/* Bio with AI Improve */}
      <div className="rounded-2xl bg-card border border-border/30 p-5 space-y-2">
        <Label className="text-[13px] font-semibold">Bio</Label>
        <div className="relative">
          <Textarea value={profile.bio} onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))} rows={5} className="rounded-xl pr-28" placeholder="Tell students about yourself, your experience, and teaching style..." />
          <Button variant="ghost" size="sm" onClick={handleImproveBio} disabled={improvingBio || !profile.bio.trim()} className="absolute top-2 right-2 h-7 gap-1 text-xs text-primary hover:text-primary rounded-lg bg-primary/5 hover:bg-primary/10">
            {improvingBio ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />} AI Improve
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">{profile.bio.length}/2000 characters</p>
      </div>

      {/* Social Links */}
      <div className="rounded-2xl bg-card border border-border/30 p-5 space-y-4">
        <Label className="text-[13px] font-semibold">Social Links</Label>
        <div className="space-y-3">
          {[
            { key: 'website' as const, icon: <Globe className="size-4" />, placeholder: 'https://yourwebsite.com', bg: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400', label: 'Web' },
            { key: 'linkedin' as const, icon: <span className="text-xs font-bold">in</span>, placeholder: 'https://linkedin.com/in/yourname', bg: 'bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400', label: 'in' },
            { key: 'twitter' as const, icon: <span className="text-xs font-bold">X</span>, placeholder: '@handle', bg: 'bg-slate-100 text-slate-600 dark:bg-slate-950/40 dark:text-slate-400', label: 'X' },
            { key: 'youtube' as const, icon: <span className="text-xs font-bold">YT</span>, placeholder: 'YouTube channel URL', bg: 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400', label: 'YT' },
          ].map(link => (
            <div key={link.key} className="flex items-center gap-3">
              <div className={cn('flex size-9 items-center justify-center rounded-lg shrink-0', link.bg)}>{link.icon}</div>
              <Input value={profile[link.key]} onChange={(e) => setProfile(prev => ({ ...prev, [link.key]: e.target.value }))} placeholder={link.placeholder} className="rounded-xl flex-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Expertise Tags */}
      <div className="rounded-2xl bg-card border border-border/30 p-5 space-y-3">
        <Label className="text-[13px] font-semibold">Expertise Tags</Label>
        <div className="flex flex-wrap gap-2">
          {expertise.map(tag => (
            <Badge key={tag.id} variant="secondary" className="rounded-lg px-3 py-1.5 gap-1.5 text-xs font-medium">
              {tag.label}
              <button onClick={() => removeExpertise(tag.id)} className="hover:text-destructive transition-colors"><X className="size-3" /></button>
            </Badge>
          ))}
          <div className="flex items-center gap-1">
            <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addExpertise()} placeholder="Add tag" className="h-8 w-24 rounded-lg text-xs" />
            <Button variant="ghost" size="sm" onClick={addExpertise} className="h-8 w-8 p-0 rounded-lg"><Plus className="size-3.5" /></Button>
          </div>
        </div>
      </div>

      {/* Languages */}
      <div className="rounded-2xl bg-card border border-border/30 p-5 space-y-3">
        <Label className="text-[13px] font-semibold">Languages</Label>
        <div className="flex flex-wrap gap-2">
          {langs.map(lang => (
            <Badge key={lang.id} variant="secondary" className="rounded-lg px-3 py-1.5 gap-1.5 text-xs font-medium">
              {lang.label}
              {lang.verified && <Check className="size-3 text-emerald-500" />}
              <button onClick={() => removeLanguage(lang.id)} className="hover:text-destructive transition-colors"><X className="size-3" /></button>
            </Badge>
          ))}
          <div className="flex items-center gap-1">
            <Input value={newLang} onChange={(e) => setNewLang(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addLanguage()} placeholder="Add language" className="h-8 w-28 rounded-lg text-xs" />
            <Button variant="ghost" size="sm" onClick={addLanguage} className="h-8 w-8 p-0 rounded-lg"><Plus className="size-3.5" /></Button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} className="rounded-xl gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
          <Save className="size-4" /> Save Profile
        </Button>
        <Button variant="outline" onClick={() => setPreviewOpen(true)} className="rounded-xl gap-2">
          <Eye className="size-4" /> Preview
        </Button>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Public Profile Preview</DialogTitle>
            <DialogDescription>This is how students see your profile.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-4">
              <Avatar className="size-16 ring-2 ring-primary/20 rounded-2xl">
                <AvatarImage src={photoUrl || undefined} alt={profile.displayName} />
                <AvatarFallback className="text-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold rounded-2xl">
                  {profile.displayName ? profile.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'IN'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-bold">{profile.displayName || 'Your Name'}</h3>
                <p className="text-sm text-muted-foreground">{profile.headline || 'Your headline'}</p>
              </div>
            </div>
            <Separator />
            <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio || 'Your bio will appear here...'}</p>
            <div className="flex flex-wrap gap-1.5">
              {expertise.map(tag => <Badge key={tag.id} variant="secondary" className="rounded-lg text-[10px]">{tag.label}</Badge>)}
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              {langs.map(l => <span key={l.id} className="flex items-center gap-0.5">{l.label} {l.verified && '✓'}</span>)}
            </div>
            <div className="flex gap-2 text-xs">
              {profile.website && <a href={profile.website} className="text-primary hover:underline flex items-center gap-0.5"><Globe className="size-3" /> Website</a>}
              {profile.linkedin && <a href={profile.linkedin} className="text-primary hover:underline flex items-center gap-0.5"><ExternalLink className="size-3" /> LinkedIn</a>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   ACCOUNT TAB
   ═══════════════════════════════════════════════════════════ */
function AccountTab() {
  const { currentUser } = useAppStore()
  const [showPassword, setShowPassword] = useState(false)
  const [changeEmailOpen, setChangeEmailOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false)
  const [twoFADialogOpen, setTwoFADialogOpen] = useState(false)
  const [sessionsDialogOpen, setSessionsDialogOpen] = useState(false)
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState(currentUser?.phone || '')
  const [newPhone, setNewPhone] = useState('')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [saving, setSaving] = useState(false)
  const [twoFAEnabled, setTwoFAEnabled] = useState(currentUser?.mfaEnabled || false)
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [accountInfo, setAccountInfo] = useState<{ phone?: string; twoFAEnabled?: boolean; status?: string } | null>(null)

  // Fetch account info
  useEffect(() => {
    if (!currentUser?.id) return
    const fetchAccount = async () => {
      try {
        const res = await fetch(`/api/instructor/settings/account?instructorId=${currentUser.id}`)
        if (res.ok) {
          const data = await res.json()
          const acc = data.account || data
          setAccountInfo(acc)
          setTwoFAEnabled(acc.mfaEnabled ?? false)
          setPhone(acc.phone || currentUser?.phone || '')
        }
      } catch { /* silent */ }
    }
    fetchAccount()
  }, [currentUser?.id, currentUser?.phone])

  const fetchSessions = useCallback(async () => {
    if (!currentUser?.id) return
    setLoadingSessions(true)
    try {
      const res = await fetch(`/api/instructor/settings/sessions?userId=${currentUser.id}`)
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions || [])
      }
    } catch { /* silent */ } finally { setLoadingSessions(false) }
  }, [currentUser?.id])

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) { toast.error('Enter new email'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/users/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser?.id, email: newEmail }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to change email')
      setChangeEmailOpen(false); setNewEmail(''); toast.success('Email updated successfully!')
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to change email') } finally { setSaving(false) }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { toast.error('Fill all fields'); return }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/instructor/settings/account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ instructorId: currentUser?.id, currentPassword, newPassword }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to change password')
      setChangePasswordOpen(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); toast.success('Password changed successfully!')
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to change password') } finally { setSaving(false) }
  }

  const handleUpdatePhone = async () => {
    if (!newPhone.trim()) { toast.error('Enter phone number'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/instructor/settings/account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ instructorId: currentUser?.id, phone: newPhone }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update phone')
      setPhone(newPhone); setPhoneDialogOpen(false); setNewPhone(''); toast.success('Phone number updated!')
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to update phone') } finally { setSaving(false) }
  }

  const handleToggle2FA = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/instructor/settings/account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ instructorId: currentUser?.id, enable2FA: !twoFAEnabled }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to toggle 2FA')
      setTwoFAEnabled(!twoFAEnabled); setTwoFADialogOpen(false); toast.success(twoFAEnabled ? '2FA disabled' : '2FA enabled successfully!')
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to toggle 2FA') } finally { setSaving(false) }
  }

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const res = await fetch('/api/instructor/settings/sessions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser?.id, sessionId }) })
      if (!res.ok) throw new Error('Failed to revoke session')
      toast.success('Session revoked'); fetchSessions()
    } catch { toast.error('Failed to revoke session') }
  }

  const handleRevokeAllSessions = async () => {
    try {
      const res = await fetch('/api/instructor/settings/sessions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser?.id, revokeAll: true }) })
      if (!res.ok) throw new Error('Failed to revoke sessions')
      toast.success('All other sessions revoked'); fetchSessions()
    } catch { toast.error('Failed to revoke sessions') }
  }

  const handleDeactivate = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/instructor/settings/account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ instructorId: currentUser?.id, action: 'deactivate' }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to deactivate')
      setDeactivateDialogOpen(false); toast.success('Account deactivated. You can reactivate later.')
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to deactivate') } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (deleteConfirmText !== 'DELETE') { toast.error('Type DELETE to confirm'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/instructor/settings/account', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ instructorId: currentUser?.id, action: 'delete' }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete account')
      toast.success('Account deletion scheduled')
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to delete account') } finally { setSaving(false) }
  }

  const activeSessionCount = sessions.filter(s => s.isActive).length

  return (
    <div className="space-y-4">
      {/* Email */}
      <div className="rounded-2xl bg-card border border-border/30 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"><Mail className="size-5" /></div>
            <div>
              <Label className="text-[13px] font-semibold">Email</Label>
              <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
              {currentUser?.isVerified && <Badge variant="secondary" className="rounded text-[9px] gap-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"><Check className="size-2.5" /> Verified</Badge>}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setChangeEmailOpen(true)} className="rounded-xl text-xs">Change email</Button>
        </div>
      </div>

      {/* Password */}
      <div className="rounded-2xl bg-card border border-border/30 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"><Key className="size-5" /></div>
            <div>
              <Label className="text-[13px] font-semibold">Password</Label>
              <p className="text-sm text-muted-foreground">Last changed recently</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setChangePasswordOpen(true)} className="rounded-xl text-xs">Change password</Button>
        </div>
      </div>

      {/* Phone */}
      <div className="rounded-2xl bg-card border border-border/30 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"><Smartphone className="size-5" /></div>
            <div>
              <Label className="text-[13px] font-semibold">Phone</Label>
              <p className="text-sm text-muted-foreground">{phone || 'Not set'}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setNewPhone(phone); setPhoneDialogOpen(true) }} className="rounded-xl text-xs gap-1.5">
            {phone ? 'Change' : 'Add phone'}
          </Button>
        </div>
      </div>

      {/* 2FA */}
      <div className="rounded-2xl bg-card border border-border/30 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"><Fingerprint className="size-5" /></div>
            <div>
              <Label className="text-[13px] font-semibold">Two-factor authentication</Label>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn('size-2 rounded-full', twoFAEnabled ? 'bg-emerald-500' : 'bg-amber-500')} />
                <span className={cn('text-sm font-medium', twoFAEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
                  {twoFAEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setTwoFADialogOpen(true)} className="rounded-xl text-xs">
            {twoFAEnabled ? 'Manage' : 'Enable'}
          </Button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="rounded-2xl bg-card border border-border/30 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"><Monitor className="size-5" /></div>
            <div>
              <Label className="text-[13px] font-semibold">Active sessions</Label>
              <p className="text-sm text-muted-foreground">{activeSessionCount || '—'} device{activeSessionCount !== 1 ? 's' : ''} currently signed in</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => { fetchSessions(); setSessionsDialogOpen(true) }} className="rounded-xl text-xs">View & revoke</Button>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Danger Zone */}
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 space-y-3">
        <Label className="text-[13px] font-semibold text-destructive">Danger Zone</Label>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={() => setDeactivateDialogOpen(true)} className="rounded-xl text-xs text-destructive border-destructive/30 hover:bg-destructive/10">
            Deactivate account
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)} className="rounded-xl text-xs gap-1.5">
            <AlertTriangle className="size-3.5" /> Delete account
          </Button>
        </div>
      </div>

      {/* ─── Dialogs ─── */}
      {/* Change Email */}
      <Dialog open={changeEmailOpen} onOpenChange={setChangeEmailOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Change Email</DialogTitle><DialogDescription>Enter your new email address.</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2"><Label>New Email</Label><Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email" placeholder="newemail@example.com" className="rounded-xl" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeEmailOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleChangeEmail} disabled={saving} className="rounded-xl gap-2">{saving ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}Update Email</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password */}
      <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Change Password</DialogTitle><DialogDescription>Enter your current password and choose a new one.</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2"><Label>Current Password</Label><Input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" className="rounded-xl" /></div>
            <div className="space-y-2"><Label>New Password</Label><Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" className="rounded-xl" /></div>
            <div className="space-y-2"><Label>Confirm New Password</Label><Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" className="rounded-xl" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePasswordOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleChangePassword} disabled={saving} className="rounded-xl gap-2">{saving ? <Loader2 className="size-4 animate-spin" /> : <Key className="size-4" />}Change Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phone Dialog */}
      <Dialog open={phoneDialogOpen} onOpenChange={setPhoneDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Update Phone Number</DialogTitle><DialogDescription>Add or update your phone number for account security.</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2"><Label>Phone Number</Label><Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} type="tel" placeholder="+92-3XX-XXXXXXX" className="rounded-xl" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPhoneDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleUpdatePhone} disabled={saving} className="rounded-xl gap-2">{saving ? <Loader2 className="size-4 animate-spin" /> : <Smartphone className="size-4" />}Save Phone</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2FA Dialog */}
      <Dialog open={twoFADialogOpen} onOpenChange={setTwoFADialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{twoFAEnabled ? 'Manage Two-Factor Authentication' : 'Enable Two-Factor Authentication'}</DialogTitle>
            <DialogDescription>{twoFAEnabled ? 'You can disable 2FA, but this reduces account security.' : '2FA adds an extra layer of security to your account.'}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {twoFAEnabled ? (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-4 flex items-center gap-3">
                <Shield className="size-8 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">2FA is currently enabled</p>
                  <p className="text-xs text-muted-foreground">Your account is protected with authenticator app verification.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 flex items-center gap-3">
                  <Shield className="size-8 text-amber-600" />
                  <div>
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">2FA is disabled</p>
                    <p className="text-xs text-muted-foreground">Enable 2FA to protect your account with an authenticator app.</p>
                  </div>
                </div>
                <div className="rounded-xl bg-muted/30 p-4 space-y-2">
                  <p className="text-xs font-semibold">How it works:</p>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Install an authenticator app (Google Authenticator, Authy)</li>
                    <li>Scan the QR code with your authenticator app</li>
                    <li>Enter the 6-digit code to verify setup</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTwoFADialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleToggle2FA} disabled={saving} variant={twoFAEnabled ? 'destructive' : 'default'} className={cn('rounded-xl gap-2', !twoFAEnabled && 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white')}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Shield className="size-4" />}
              {twoFAEnabled ? 'Disable 2FA' : 'Enable 2FA'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sessions Dialog */}
      <Dialog open={sessionsDialogOpen} onOpenChange={setSessionsDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Active Sessions</DialogTitle>
            <DialogDescription>Manage devices signed in to your account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {loadingSessions ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No active sessions found</p>
            ) : sessions.map(session => (
              <div key={session.id} className={cn('rounded-xl border p-3 flex items-center gap-3', session.isCurrent ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/10' : 'border-border/30')}>
                <div className={cn('flex size-10 items-center justify-center rounded-lg shrink-0', session.deviceType === 'mobile' ? 'bg-sky-100 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-950/40 dark:text-slate-400')}>
                  {session.deviceType === 'mobile' ? <Smartphone className="size-5" /> : <Monitor className="size-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium truncate">{session.deviceName || session.browser}</p>
                    {session.isCurrent && <Badge variant="secondary" className="rounded text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">Current</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{session.location || session.ipAddress} · {session.lastActivity}</p>
                </div>
                {!session.isCurrent && (
                  <Button variant="ghost" size="sm" onClick={() => handleRevokeSession(session.id)} className="rounded-lg text-xs text-destructive hover:text-destructive h-8"><LogOut className="size-3.5" /></Button>
                )}
              </div>
            ))}
          </div>
          {sessions.length > 1 && (
            <DialogFooter>
              <Button variant="outline" onClick={handleRevokeAllSessions} className="rounded-xl text-xs text-destructive gap-1.5">
                <LogOut className="size-3.5" /> Revoke all other sessions
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Deactivate Dialog */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Your account will be hidden and you won&apos;t be able to access it. Students won&apos;t see your courses. You can reactivate anytime by logging back in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate} disabled={saving} className="rounded-xl">
              {saving ? <Loader2 className="size-4 animate-spin" /> : null} Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Account Permanently</DialogTitle>
            <DialogDescription>This action cannot be undone. All your data will be permanently removed.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4 space-y-2">
              <p className="text-xs font-semibold text-destructive">This will permanently delete:</p>
              <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                <li>All your courses and course content</li>
                <li>Student enrollment data</li>
                <li>Revenue history and payout records</li>
                <li>Q&A answers and reviews</li>
                <li>Messages and notifications</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Label>Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm</Label>
              <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="DELETE" className="rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeleteConfirmText('') }} className="rounded-xl">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving || deleteConfirmText !== 'DELETE'} className="rounded-xl gap-2">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <AlertTriangle className="size-4" />} Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   NOTIFICATIONS TAB
   ═══════════════════════════════════════════════════════════ */
function NotificationsTab() {
  const { currentUser } = useAppStore()
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    { id: '1', event: 'New enrollment', description: 'When a student enrolls in your course', icon: <Users className="size-4" />, inApp: true, email: 'daily' },
    { id: '2', event: 'New Q&A question', description: 'When a student asks a question', icon: <MessageSquare className="size-4" />, inApp: true, email: 'immediately' },
    { id: '3', event: 'New review posted', description: 'When a student reviews your course', icon: <Heart className="size-4" />, inApp: true, email: 'immediately' },
    { id: '4', event: 'Assignment submitted', description: 'When a student submits an assignment', icon: <FileText className="size-4" />, inApp: true, email: 'daily' },
    { id: '5', event: 'New message', description: 'When a student sends you a message', icon: <Mail className="size-4" />, inApp: true, email: 'immediately' },
    { id: '6', event: 'Course approved', description: 'When admin approves your course', icon: <Check className="size-4" />, inApp: true, email: 'immediately' },
    { id: '7', event: 'Payout processed', description: 'When a payout is completed', icon: <CreditCard className="size-4" />, inApp: true, email: 'immediately' },
    { id: '8', event: 'Promotional tips', description: <>Marketing and platform tips from <ShijlAIText /></>, icon: <Sparkles className="size-4" />, inApp: false, email: 'off' },
  ])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!currentUser?.id) return
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/instructor/settings?instructorId=${currentUser.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.settings?.integrations) { /* already loaded above */ }
          const nMap: Record<string, { inApp?: boolean; email?: string }> = {}
          try { const parsed = JSON.parse(data.settings?.integrations || '{}'); Object.assign(nMap, parsed) } catch { /* */ }
          // Apply saved notification settings from the notifyXxx fields
          const s = data.settings
          const keyMap: Record<string, string> = { '1': 'enrollment', '2': 'qa', '3': 'review', '4': 'assignment', '5': 'message', '6': 'courseApproved', '7': 'payout', '8': 'promotion' }
          const fieldMap: Record<string, string> = { enrollment: 'notifyEnrollment', qa: 'notifyQA', review: 'notifyReview', assignment: 'notifyAssignment', message: 'notifyMessage', courseApproved: 'notifyCourseApproved', payout: 'notifyPayout', promotion: 'notifyPromotion' }
          setNotifications(prev => prev.map(item => {
            const key = keyMap[item.id]
            const field = key ? fieldMap[key] : undefined
            if (field && s[field]) {
              const val = s[field] as string
              return { ...item, inApp: val !== 'off', email: val === 'email' ? 'immediately' : val === 'off' ? 'off' : item.email }
            }
            return item
          }))
        }
      } catch { /* silent */ }
    }
    fetchSettings()
  }, [currentUser?.id])

  const saveNotifications = useCallback(async (updated: NotificationSetting[]) => {
    if (!currentUser?.id) return
    setSaving(true)
    try {
      const keyMap: Record<string, string> = { '1': 'enrollment', '2': 'qa', '3': 'review', '4': 'assignment', '5': 'message', '6': 'courseApproved', '7': 'payout', '8': 'promotion' }
      const fieldMap: Record<string, string> = { enrollment: 'notifyEnrollment', qa: 'notifyQA', review: 'notifyReview', assignment: 'notifyAssignment', message: 'notifyMessage', courseApproved: 'notifyCourseApproved', payout: 'notifyPayout', promotion: 'notifyPromotion' }
      const updates: Record<string, string> = {}
      for (const item of updated) {
        const key = keyMap[item.id]
        const field = key ? fieldMap[key] : undefined
        if (field) {
          const val = !item.inApp && item.email === 'off' ? 'off' : item.email !== 'off' ? 'email' : 'in-app'
          updates[field] = val
        }
      }
      const res = await fetch('/api/instructor/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorId: currentUser.id, ...updates }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Notification preferences updated')
    } catch { toast.error('Failed to save notification preferences') } finally { setSaving(false) }
  }, [currentUser?.id])

  const toggleInApp = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, inApp: !n.inApp } : n)
    setNotifications(updated); saveNotifications(updated)
  }
  const changeEmail = (id: string, value: NotificationSetting['email']) => {
    const updated = notifications.map(n => n.id === id ? { ...n, email: value } : n)
    setNotifications(updated); saveNotifications(updated)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card border border-border/30 overflow-hidden">
        {/* Desktop table */}
        <div className="hidden sm:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30 bg-muted/30">
                <th className="text-left text-[12px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Event</th>
                <th className="text-center text-[12px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">In-app</th>
                <th className="text-left text-[12px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Email</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n, i) => (
                <tr key={n.id} className={cn('border-b border-border/20 last:border-0', i % 2 === 0 ? '' : 'bg-muted/10')}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{n.icon}</span>
                      <div><p className="text-[13px] font-medium">{n.event}</p><p className="text-[10px] text-muted-foreground">{n.description}</p></div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-center"><Switch checked={n.inApp} onCheckedChange={() => toggleInApp(n.id)} /></td>
                  <td className="px-5 py-3.5">
                    <Select value={n.email} onValueChange={(v) => changeEmail(n.id, v as NotificationSetting['email'])}>
                      <SelectTrigger className="w-36 rounded-lg text-xs h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediately">Immediately</SelectItem>
                        <SelectItem value="daily">Daily digest</SelectItem>
                        <SelectItem value="weekly">Weekly digest</SelectItem>
                        <SelectItem value="off">Off</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-border/30">
          {notifications.map(n => (
            <div key={n.id} className="p-4 space-y-3">
              <div className="flex items-center gap-2"><span className="text-muted-foreground">{n.icon}</span><p className="text-[13px] font-medium">{n.event}</p></div>
              <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">In-app</span><Switch checked={n.inApp} onCheckedChange={() => toggleInApp(n.id)} /></div>
              <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Email</span>
                <Select value={n.email} onValueChange={(v) => changeEmail(n.id, v as NotificationSetting['email'])}>
                  <SelectTrigger className="w-32 rounded-lg text-xs h-7"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="immediately">Immediately</SelectItem><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="off">Off</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground text-center">{saving ? 'Saving...' : 'Notification preferences are saved automatically.'}</p>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   APPEARANCE TAB
   ═══════════════════════════════════════════════════════════ */
function AppearanceTab() {
  const { currentUser } = useAppStore()
  const [appearance, setAppearance] = useState(defaultAppearance)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!currentUser?.id) return
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/instructor/settings?instructorId=${currentUser.id}`)
        if (res.ok) {
          const data = await res.json()
          const s = data.settings
          setAppearance({
            theme: s.theme || 'system', compactMode: s.compactMode ?? false,
            sidebarPosition: s.sidebarPosition || 'left', fontSize: s.fontSize || 'medium',
          })
        }
      } catch { /* silent */ }
    }
    fetchSettings()
  }, [currentUser?.id])

  const saveField = async (field: string, value: unknown) => {
    setSaving(true)
    try {
      const res = await fetch('/api/instructor/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorId: currentUser?.id, [field]: value }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Appearance updated')
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      {/* Theme */}
      <div className="rounded-2xl bg-card border border-border/30 p-5 space-y-4">
        <Label className="text-[13px] font-semibold">Theme</Label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', label: 'Light', icon: <Sun className="size-5" /> },
            { id: 'dark', label: 'Dark', icon: <Moon className="size-5" /> },
            { id: 'system', label: 'System', icon: <Monitor className="size-5" /> },
          ].map(opt => (
            <button key={opt.id} onClick={() => { setAppearance(p => ({ ...p, theme: opt.id })); saveField('theme', opt.id) }}
              className={cn('flex flex-col items-center gap-2 rounded-xl p-4 border transition-all',
                appearance.theme === opt.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border/30 hover:border-border/60')}>
              {opt.icon}<span className="text-xs font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div className="rounded-2xl bg-card border border-border/30 p-5 space-y-4">
        <Label className="text-[13px] font-semibold">Font Size</Label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'small', label: 'Small', sample: 'text-xs' },
            { id: 'medium', label: 'Medium', sample: 'text-sm' },
            { id: 'large', label: 'Large', sample: 'text-base' },
          ].map(opt => (
            <button key={opt.id} onClick={() => { setAppearance(p => ({ ...p, fontSize: opt.id })); saveField('fontSize', opt.id) }}
              className={cn('flex flex-col items-center gap-2 rounded-xl p-4 border transition-all',
                appearance.fontSize === opt.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border/30 hover:border-border/60')}>
              <span className={cn(opt.sample, 'font-medium')}>Aa</span><span className="text-[11px] text-muted-foreground">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Compact Mode */}
      <div className="rounded-2xl bg-card border border-border/30 p-5">
        <div className="flex items-center justify-between">
          <div><Label className="text-[13px] font-semibold">Compact Mode</Label><p className="text-[11px] text-muted-foreground mt-0.5">Reduce spacing for more content on screen</p></div>
          <Switch checked={appearance.compactMode} onCheckedChange={(v) => { setAppearance(p => ({ ...p, compactMode: v })); saveField('compactMode', v) }} />
        </div>
      </div>

      {/* Sidebar Position */}
      <div className="rounded-2xl bg-card border border-border/30 p-5 space-y-4">
        <Label className="text-[13px] font-semibold">Sidebar Position</Label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'left', label: 'Left', icon: <PanelLeft className="size-5" /> },
            { id: 'right', label: 'Right', icon: <PanelLeft className="size-5 rotate-180" /> },
          ].map(opt => (
            <button key={opt.id} onClick={() => { setAppearance(p => ({ ...p, sidebarPosition: opt.id })); saveField('sidebarPosition', opt.id) }}
              className={cn('flex items-center gap-3 rounded-xl p-4 border transition-all',
                appearance.sidebarPosition === opt.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border/30 hover:border-border/60')}>
              {opt.icon}<span className="text-xs font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {saving && <p className="text-[11px] text-muted-foreground text-center animate-pulse">Saving...</p>}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   PRIVACY TAB
   ═══════════════════════════════════════════════════════════ */
function PrivacyTab() {
  const { currentUser } = useAppStore()
  const [privacy, setPrivacy] = useState(defaultPrivacy)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!currentUser?.id) return
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/instructor/settings?instructorId=${currentUser.id}`)
        if (res.ok) {
          const s = (await res.json()).settings
          setPrivacy({
            profileVisibility: s.profileVisibility || 'public', showEmail: s.showEmail ?? false,
            showPhone: s.showPhone ?? false, showRevenue: s.showRevenue ?? false,
            showStudentCount: s.showStudentCount ?? true,
          })
        }
      } catch { /* silent */ }
    }
    fetchSettings()
  }, [currentUser?.id])

  const saveField = async (field: string, value: unknown) => {
    setSaving(true)
    try {
      const res = await fetch('/api/instructor/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorId: currentUser?.id, [field]: value }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Privacy setting updated')
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      {/* Profile Visibility */}
      <div className="rounded-2xl bg-card border border-border/30 p-5 space-y-4">
        <div><Label className="text-[13px] font-semibold">Profile Visibility</Label><p className="text-[11px] text-muted-foreground mt-0.5">Control who can see your instructor profile</p></div>
        <div className="grid gap-3">
          {[
            { id: 'public', label: 'Public', desc: 'Anyone can find and view your profile', icon: <Globe className="size-4" /> },
            { id: 'limited', label: 'Limited', desc: 'Only enrolled students can see full profile', icon: <EyeClosed className="size-4" /> },
            { id: 'private', label: 'Private', desc: 'Profile hidden, only you can see it', icon: <Lock className="size-4" /> },
          ].map(opt => (
            <button key={opt.id} onClick={() => { setPrivacy(p => ({ ...p, profileVisibility: opt.id })); saveField('profileVisibility', opt.id) }}
              className={cn('flex items-center gap-3 rounded-xl p-4 border transition-all text-left',
                privacy.profileVisibility === opt.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border/30 hover:border-border/60')}>
              <div className="text-muted-foreground">{opt.icon}</div>
              <div><p className="text-[13px] font-medium">{opt.label}</p><p className="text-[11px] text-muted-foreground">{opt.desc}</p></div>
            </button>
          ))}
        </div>
      </div>

      {/* Show/Hide Fields */}
      <div className="rounded-2xl bg-card border border-border/30 p-5 space-y-4">
        <Label className="text-[13px] font-semibold">Profile Field Visibility</Label>
        <div className="space-y-4">
          {[
            { key: 'showEmail' as const, label: 'Show email address', desc: 'Let students see your email on your public profile', icon: <Mail className="size-4" /> },
            { key: 'showPhone' as const, label: 'Show phone number', desc: 'Display your phone number on your profile', icon: <Smartphone className="size-4" /> },
            { key: 'showRevenue' as const, label: 'Show revenue stats', desc: 'Display your total earnings publicly', icon: <DollarSign className="size-4" /> },
            { key: 'showStudentCount' as const, label: 'Show student count', desc: 'Show total number of enrolled students', icon: <Users className="size-4" /> },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-muted-foreground">{item.icon}</div>
                <div><p className="text-[13px] font-medium">{item.label}</p><p className="text-[11px] text-muted-foreground">{item.desc}</p></div>
              </div>
              <Switch checked={privacy[item.key]} onCheckedChange={(v) => { setPrivacy(p => ({ ...p, [item.key]: v })); saveField(item.key, v) }} />
            </div>
          ))}
        </div>
      </div>

      {saving && <p className="text-[11px] text-muted-foreground text-center animate-pulse">Saving...</p>}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   PAYOUT TAB
   ═══════════════════════════════════════════════════════════ */
function PayoutTab() {
  const { currentUser } = useAppStore()
  const [payoutMethod, setPayoutMethod] = useState('bank')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [branchCode, setBranchCode] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [payoneerEmail, setPayoneerEmail] = useState('')
  const [stripeEmail, setStripeEmail] = useState('')
  const [schedule, setSchedule] = useState('monthly')
  const [minThreshold, setMinThreshold] = useState('5000')
  const [saving, setSaving] = useState(false)
  const [loadingPayout, setLoadingPayout] = useState(true)

  useEffect(() => {
    if (!currentUser?.id) return
    const fetchPayout = async () => {
      setLoadingPayout(true)
      try {
        const [payoutRes, settingsRes] = await Promise.all([
          fetch(`/api/instructor/payout-methods?instructorId=${currentUser.id}`),
          fetch(`/api/instructor/settings?instructorId=${currentUser.id}`),
        ])
        if (payoutRes.ok) {
          const data = await payoutRes.json()
          const defaultMethod = data.payoutMethods?.find((m: { isDefault: boolean }) => m.isDefault)
          if (defaultMethod) {
            const typeMap: Record<string, string> = { bank_transfer: 'bank', jazzcash: 'jazzcash', easypaisa: 'easypaisa', payoneer: 'payoneer', stripe: 'stripe' }
            setPayoutMethod(typeMap[defaultMethod.type] || 'bank')
            setBankName(defaultMethod.bankName || '')
            setAccountNumber(defaultMethod.accountNumber || '')
            setAccountHolder(defaultMethod.accountHolder || '')
            setBranchCode(defaultMethod.branchCode || '')
            setPhoneNumber(defaultMethod.phoneNumber || '')
            setPayoneerEmail(defaultMethod.email || '')
            setStripeEmail(defaultMethod.email || '')
          }
        }
        if (settingsRes.ok) {
          const s = (await settingsRes.json()).settings
          setSchedule(s.payoutSchedule || 'monthly')
          setMinThreshold(String(s.payoutThreshold || 5000))
        }
      } catch { /* silent */ } finally { setLoadingPayout(false) }
    }
    fetchPayout()
  }, [currentUser?.id])

  const payoutMethods = [
    { id: 'bank', label: 'Bank Transfer', icon: '🏦', desc: 'Direct deposit to your bank account' },
    { id: 'jazzcash', label: 'JazzCash', icon: '📱', desc: 'Mobile wallet transfer' },
    { id: 'easypaisa', label: 'Easypaisa', icon: '📲', desc: 'Mobile wallet transfer' },
    { id: 'payoneer', label: 'Payoneer', icon: '💳', desc: 'International wire transfer' },
    { id: 'stripe', label: 'Stripe', icon: '💵', desc: 'Direct to your Stripe account' },
  ]

  const handleSave = async () => {
    setSaving(true)
    try {
      const typeMap: Record<string, string> = { bank: 'bank_transfer', jazzcash: 'jazzcash', easypaisa: 'easypaisa', payoneer: 'payoneer', stripe: 'stripe' }
      // Save payout method
      const methodRes = await fetch('/api/instructor/payout-methods', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructorId: currentUser?.id, type: typeMap[payoutMethod] || 'bank_transfer',
          bankName, accountNumber, accountHolder, branchCode, phoneNumber,
          email: payoutMethod === 'payoneer' ? payoneerEmail : payoutMethod === 'stripe' ? stripeEmail : undefined,
          isDefault: true,
        }),
      })
      if (!methodRes.ok) { const d = await methodRes.json(); throw new Error(d.error || 'Failed to save payout method') }

      // Save schedule & threshold
      const settingsRes = await fetch('/api/instructor/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorId: currentUser?.id, payoutSchedule: schedule, payoutThreshold: parseInt(minThreshold) }),
      })
      if (!settingsRes.ok) throw new Error('Failed to save payout schedule')

      toast.success('Payout settings saved!')
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Failed to save payout settings') } finally { setSaving(false) }
  }

  if (loadingPayout) return <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-[13px] font-semibold">Payout Method</Label>
        {payoutMethods.map(method => (
          <button key={method.id} onClick={() => setPayoutMethod(method.id)}
            className={cn('flex items-center gap-3 w-full rounded-xl p-4 border transition-all text-left',
              payoutMethod === method.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border/30 bg-card hover:border-border/60')}>
            <span className="text-xl">{method.icon}</span>
            <div className="flex-1"><p className="text-[13px] font-medium">{method.label}</p><p className="text-[11px] text-muted-foreground">{method.desc}</p></div>
            <div className={cn('size-5 rounded-full border-2 flex items-center justify-center transition-all', payoutMethod === method.id ? 'border-primary' : 'border-muted-foreground/30')}>
              {payoutMethod === method.id && <div className="size-2.5 rounded-full bg-primary" />}
            </div>
          </button>
        ))}
      </div>

      {payoutMethod === 'bank' && (
        <div className="rounded-2xl bg-card border border-border/30 p-5 space-y-4">
          <Label className="text-[13px] font-semibold">Bank Account Details</Label>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2"><Label className="text-xs">Bank Name</Label><Input value={bankName} onChange={(e) => setBankName(e.target.value)} className="rounded-xl" /></div>
            <div className="space-y-2"><Label className="text-xs">Branch Code</Label><Input value={branchCode} onChange={(e) => setBranchCode(e.target.value)} className="rounded-xl" placeholder="e.g., 0123" /></div>
            <div className="space-y-2"><Label className="text-xs">Account Number</Label><Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="rounded-xl" /></div>
            <div className="space-y-2"><Label className="text-xs">Account Holder Name</Label><Input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} className="rounded-xl" /></div>
          </div>
        </div>
      )}

      {(payoutMethod === 'jazzcash' || payoutMethod === 'easypaisa') && (
        <div className="rounded-2xl bg-card border border-border/30 p-5 space-y-4">
          <Label className="text-[13px] font-semibold">{payoutMethod === 'jazzcash' ? 'JazzCash' : 'Easypaisa'} Account</Label>
          <div className="space-y-2"><Label className="text-xs">Mobile Number</Label><Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+92-3XX-XXXXXXX" className="rounded-xl" /></div>
        </div>
      )}

      {payoutMethod === 'payoneer' && (
        <div className="rounded-2xl bg-card border border-border/30 p-5 space-y-4">
          <Label className="text-[13px] font-semibold">Payoneer Account</Label>
          <div className="space-y-2"><Label className="text-xs">Payoneer Email</Label><Input value={payoneerEmail} onChange={(e) => setPayoneerEmail(e.target.value)} type="email" placeholder="your@payoneer.com" className="rounded-xl" /></div>
        </div>
      )}

      {payoutMethod === 'stripe' && (
        <div className="rounded-2xl bg-card border border-border/30 p-5 space-y-4">
          <Label className="text-[13px] font-semibold">Stripe Account</Label>
          <div className="space-y-2"><Label className="text-xs">Stripe Email</Label><Input value={stripeEmail} onChange={(e) => setStripeEmail(e.target.value)} type="email" placeholder="your@stripe.com" className="rounded-xl" /></div>
        </div>
      )}

      <div className="rounded-2xl bg-card border border-border/30 p-5 space-y-4">
        <Label className="text-[13px] font-semibold">Payout Schedule</Label>
        <div className="flex gap-3">
          {[
            { id: 'monthly', label: 'Monthly', desc: '1st of each month' },
            { id: 'on_request', label: 'On Request', desc: 'Manual payout trigger' },
          ].map(opt => (
            <button key={opt.id} onClick={() => setSchedule(opt.id)}
              className={cn('flex-1 rounded-xl p-4 border text-left transition-all',
                schedule === opt.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border/30 hover:border-border/60')}>
              <p className="text-[13px] font-medium">{opt.label}</p><p className="text-[11px] text-muted-foreground">{opt.desc}</p>
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Minimum Payout Threshold (USD)</Label>
          <Select value={minThreshold} onValueChange={setMinThreshold}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="20">$20</SelectItem><SelectItem value="50">$50</SelectItem>
              <SelectItem value="100">$100</SelectItem><SelectItem value="250">$250</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="rounded-xl gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Save Payout Settings
      </Button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   INTEGRATIONS TAB
   ═══════════════════════════════════════════════════════════ */
function IntegrationsTab() {
  const { currentUser } = useAppStore()
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookAdded, setWebhookAdded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [integrations, setIntegrations] = useState([
    { id: 'zoom', name: 'Zoom', icon: <Video className="size-5" />, description: 'Schedule & manage live sessions', connected: false, iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' },
    { id: 'google-meet', name: 'Google Meet', icon: <Video className="size-5" />, description: 'Auto-link Google Meet sessions', connected: false, iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' },
    { id: 'mailchimp', name: 'Mailchimp', icon: <Mail className="size-5" />, description: 'Sync students to mailing list', connected: false, iconBg: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-400' },
    { id: 'zapier', name: 'Zapier', icon: <Zap className="size-5" />, description: 'Automate with 3000+ apps', connected: false, iconBg: 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400' },
    { id: 'webhook', name: 'Custom Webhook', icon: <Webhook className="size-5" />, description: 'Fire events to your backend', connected: false, iconBg: 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400' },
  ])

  useEffect(() => {
    if (!currentUser?.id) return
    const fetchIntegrations = async () => {
      try {
        const res = await fetch(`/api/instructor/settings?instructorId=${currentUser.id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.settings?.integrations) {
            let parsed: Record<string, { connected?: boolean; webhookUrl?: string }> = {}
            try { parsed = JSON.parse(data.settings.integrations) } catch { /* */ }
            setIntegrations(prev => prev.map(i => {
              if (parsed[i.id]) {
                if (i.id === 'webhook' && parsed[i.id].webhookUrl) { setWebhookUrl(parsed[i.id].webhookUrl || ''); setWebhookAdded(parsed[i.id].connected ?? false) }
                return { ...i, connected: parsed[i.id].connected ?? false }
              }
              return i
            }))
          }
        }
      } catch { /* silent */ }
    }
    fetchIntegrations()
  }, [currentUser?.id])

  const saveIntegrations = useCallback(async (updated: typeof integrations) => {
    if (!currentUser?.id) return
    setSaving(true)
    try {
      const integrationsMap = updated.reduce((acc, i) => {
        acc[i.id] = { connected: i.connected, webhookUrl: i.id === 'webhook' ? webhookUrl : undefined }
        return acc
      }, {} as Record<string, { connected: boolean; webhookUrl?: string }>)
      const res = await fetch('/api/instructor/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorId: currentUser.id, integrations: integrationsMap }),
      })
      if (!res.ok) throw new Error('Failed to save')
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }, [currentUser?.id, webhookUrl])

  const handleConnect = (id: string) => {
    const updated = integrations.map(i => i.id === id ? { ...i, connected: !i.connected } : i)
    setIntegrations(updated)
    const integration = integrations.find(i => i.id === id)
    toast.success(integration?.connected ? `${integration.name} disconnected` : `${integration?.name} connected!`)
    saveIntegrations(updated)
  }

  const handleAddWebhook = () => {
    if (!webhookUrl.trim()) { toast.error('Enter webhook URL'); return }
    setWebhookAdded(true)
    const updated = integrations.map(i => i.id === 'webhook' ? { ...i, connected: true } : i)
    setIntegrations(updated)
    toast.success('Webhook added!'); saveIntegrations(updated)
  }

  return (
    <div className="space-y-3">
      {integrations.map(integration => (
        <div key={integration.id} className="rounded-2xl bg-card border border-border/30 p-5">
          <div className="flex items-center gap-3">
            <div className={cn('flex size-10 items-center justify-center rounded-xl shrink-0', integration.iconBg)}>{integration.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-semibold">{integration.name}</p>
                {integration.connected && <Badge variant="secondary" className="rounded-lg text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 gap-0.5 px-1.5"><Check className="size-2.5" /> Connected</Badge>}
              </div>
              <p className="text-[11px] text-muted-foreground">{integration.description}</p>
            </div>
            <div className="shrink-0">
              <Button variant={integration.connected ? 'outline' : 'default'} size="sm" onClick={() => handleConnect(integration.id)}
                className={cn('rounded-xl text-xs gap-1.5', !integration.connected && 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white')}>
                {integration.connected ? <><X className="size-3.5" /> Disconnect</> : <><Link2 className="size-3.5" /> Connect</>}
              </Button>
            </div>
          </div>
          {integration.id === 'webhook' && !integration.connected && !webhookAdded && (
            <div className="mt-3 flex gap-2">
              <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://your-backend.com/webhook" className="rounded-xl flex-1 text-xs" />
              <Button size="sm" onClick={handleAddWebhook} className="rounded-xl text-xs gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white"><Plus className="size-3.5" /> Add</Button>
            </div>
          )}
          {integration.id === 'webhook' && webhookAdded && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/40 p-2.5">
              <span className="text-xs text-muted-foreground truncate flex-1">{webhookUrl}</span>
              <Button variant="ghost" size="sm" onClick={() => { setWebhookAdded(false); setWebhookUrl(''); handleConnect('webhook') }} className="h-6 text-xs text-destructive hover:text-destructive">Remove</Button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   PREFERENCES TAB
   ═══════════════════════════════════════════════════════════ */
function PreferencesTab() {
  const { currentUser } = useAppStore()
  const [prefs, setPrefs] = useState(defaultPreferences)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!currentUser?.id) return
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/instructor/settings?instructorId=${currentUser.id}`)
        if (res.ok) {
          const s = (await res.json()).settings
          setPrefs({
            timezone: s.timezone || 'UTC', dateFormat: s.dateFormat || 'DD/MM/YYYY',
            currency: s.currency || 'USD', preferredLanguage: s.preferredLanguage || 'en',
            autoSaveDrafts: s.autoSaveDrafts ?? true, defaultCourseLanguage: s.defaultCourseLanguage || 'en',
            videoQuality: s.videoQuality || '1080p', emailDigest: s.emailDigest || 'daily',
            marketingEmails: s.marketingEmails ?? true, securityAlertEmails: s.securityAlertEmails ?? true,
            courseUpdateEmails: s.courseUpdateEmails ?? true,
          })
        }
      } catch { /* silent */ }
    }
    fetchSettings()
  }, [currentUser?.id])

  const saveField = async (field: string, value: unknown) => {
    setSaving(true)
    try {
      const res = await fetch('/api/instructor/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructorId: currentUser?.id, [field]: value }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Preference updated')
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">
      {/* Regional */}
      <div className="rounded-2xl bg-card border border-border/30 p-5 space-y-4">
        <Label className="text-[13px] font-semibold flex items-center gap-2"><Globe className="size-4" /> Regional & Format</Label>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Timezone</Label>
            <Select value={prefs.timezone} onValueChange={(v) => { setPrefs(p => ({ ...p, timezone: v })); saveField('timezone', v) }}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{TIMEZONES.map(tz => <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Date Format</Label>
            <Select value={prefs.dateFormat} onValueChange={(v) => { setPrefs(p => ({ ...p, dateFormat: v })); saveField('dateFormat', v) }}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Currency</Label>
            <Select value={prefs.currency} onValueChange={(v) => { setPrefs(p => ({ ...p, currency: v })); saveField('currency', v) }}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Preferred Language</Label>
            <Select value={prefs.preferredLanguage} onValueChange={(v) => { setPrefs(p => ({ ...p, preferredLanguage: v })); saveField('preferredLanguage', v) }}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ur">اردو (Urdu)</SelectItem>
                <SelectItem value="ar">العربية (Arabic)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Course Defaults */}
      <div className="rounded-2xl bg-card border border-border/30 p-5 space-y-4">
        <Label className="text-[13px] font-semibold flex items-center gap-2"><BookOpen className="size-4" /> Course & Editor</Label>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Default Course Language</Label>
            <Select value={prefs.defaultCourseLanguage} onValueChange={(v) => { setPrefs(p => ({ ...p, defaultCourseLanguage: v })); saveField('defaultCourseLanguage', v) }}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="ur">Urdu</SelectItem><SelectItem value="ar">Arabic</SelectItem><SelectItem value="fr">French</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Video Upload Quality</Label>
            <Select value={prefs.videoQuality} onValueChange={(v) => { setPrefs(p => ({ ...p, videoQuality: v })); saveField('videoQuality', v) }}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="720p">720p HD</SelectItem><SelectItem value="1080p">1080p Full HD</SelectItem><SelectItem value="4k">4K Ultra HD</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between pt-2">
          <div><p className="text-[13px] font-medium">Auto-save drafts</p><p className="text-[11px] text-muted-foreground">Automatically save course content as you edit</p></div>
          <Switch checked={prefs.autoSaveDrafts} onCheckedChange={(v) => { setPrefs(p => ({ ...p, autoSaveDrafts: v })); saveField('autoSaveDrafts', v) }} />
        </div>
      </div>

      {/* Email Preferences */}
      <div className="rounded-2xl bg-card border border-border/30 p-5 space-y-4">
        <Label className="text-[13px] font-semibold flex items-center gap-2"><Mail className="size-4" /> Email Preferences</Label>
        <div className="space-y-2">
          <Label className="text-xs">Email Digest Frequency</Label>
          <Select value={prefs.emailDigest} onValueChange={(v) => { setPrefs(p => ({ ...p, emailDigest: v })); saveField('emailDigest', v) }}>
            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="immediately">Immediately</SelectItem><SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem><SelectItem value="off">Off</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-4 pt-2">
          {[
            { key: 'marketingEmails' as const, label: 'Marketing & promotional emails', desc: 'Tips, offers, and platform updates' },
            { key: 'securityAlertEmails' as const, label: 'Security alert emails', desc: 'Login alerts and security notifications' },
            { key: 'courseUpdateEmails' as const, label: 'Course update emails', desc: 'Notifications about your course activity' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between">
              <div><p className="text-[13px] font-medium">{item.label}</p><p className="text-[11px] text-muted-foreground">{item.desc}</p></div>
              <Switch checked={prefs[item.key]} onCheckedChange={(v) => { setPrefs(p => ({ ...p, [item.key]: v })); saveField(item.key, v) }} />
            </div>
          ))}
        </div>
      </div>

      {saving && <p className="text-[11px] text-muted-foreground text-center animate-pulse">Saving...</p>}
    </div>
  )
}

/* ─── Skeletons ─── */
function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-card border border-border/30 p-5 space-y-3">
        <Skeleton className="h-4 w-32" /><Skeleton className="h-2 w-full" />
      </div>
      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN VIEW
   ═══════════════════════════════════════════════════════════ */
export function InstructorSettingsView() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode; keywords: string[] }[] = [
    { id: 'profile', label: 'Profile', icon: <User className="size-3.5" />, keywords: ['name', 'photo', 'bio', 'headline', 'social', 'expertise', 'languages'] },
    { id: 'account', label: 'Account', icon: <Lock className="size-3.5" />, keywords: ['email', 'password', 'phone', '2fa', 'security', 'sessions', 'delete', 'deactivate'] },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="size-3.5" />, keywords: ['notify', 'alert', 'email', 'digest', 'in-app'] },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="size-3.5" />, keywords: ['theme', 'dark', 'light', 'font', 'compact', 'sidebar'] },
    { id: 'privacy', label: 'Privacy', icon: <EyeClosed className="size-3.5" />, keywords: ['visibility', 'show', 'hide', 'public', 'private'] },
    { id: 'payout', label: 'Payout', icon: <CreditCard className="size-3.5" />, keywords: ['bank', 'jazzcash', 'easypaisa', 'payoneer', 'stripe', 'schedule', 'threshold'] },
    { id: 'integrations', label: 'Integrations', icon: <Link2 className="size-3.5" />, keywords: ['zoom', 'meet', 'mailchimp', 'zapier', 'webhook', 'connect'] },
    { id: 'preferences', label: 'Preferences', icon: <Settings className="size-3.5" />, keywords: ['timezone', 'language', 'currency', 'date', 'format', 'video', 'auto-save'] },
  ]

  const filteredTabs = searchQuery.trim()
    ? tabs.filter(t => t.label.toLowerCase().includes(searchQuery.toLowerCase()) || t.keywords.some(k => k.includes(searchQuery.toLowerCase())))
    : tabs

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springTransition}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
              <Settings className="size-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          </div>
          <p className="text-muted-foreground text-[14px] pl-[52px]">Manage your profile, account, and preferences.</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true) }}
            placeholder="Search settings..." className="pl-9 rounded-xl text-sm h-9" />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setSearchOpen(false) }} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="size-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springTransition, delay: 0.05 }}>
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as SettingsTab); setSearchQuery('') }} className="space-y-6">
          <div className="overflow-x-auto scrollbar-none -mx-1 px-1">
            <TabsList className="bg-muted/40 h-auto p-1.5 rounded-xl gap-0.5">
              {filteredTabs.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id}
                  className="rounded-lg gap-1.5 text-[12px] font-medium px-3 py-2 data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground">
                  {tab.icon}<span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
              <TabsContent value="profile" className="mt-0"><ProfileTab /></TabsContent>
              <TabsContent value="account" className="mt-0"><AccountTab /></TabsContent>
              <TabsContent value="notifications" className="mt-0"><NotificationsTab /></TabsContent>
              <TabsContent value="appearance" className="mt-0"><AppearanceTab /></TabsContent>
              <TabsContent value="privacy" className="mt-0"><PrivacyTab /></TabsContent>
              <TabsContent value="payout" className="mt-0"><PayoutTab /></TabsContent>
              <TabsContent value="integrations" className="mt-0"><IntegrationsTab /></TabsContent>
              <TabsContent value="preferences" className="mt-0"><PreferencesTab /></TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </div>
  )
}
