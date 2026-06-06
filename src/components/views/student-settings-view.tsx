'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from 'next-themes'
import {
  Settings, User, GraduationCap, Bell, Shield, CreditCard,
  Camera, Trash2, Check, Globe, MapPin, Link, Linkedin,
  ExternalLink, Clock, Video, Languages, Bot, Download,
  Play, Subtitles, Mail, Lock, Phone, Smartphone,
  Chrome, Facebook, Apple, FileDown, AlertTriangle,
  ChevronRight, CreditCard as CardIcon,
  Wallet, Receipt, ArrowUpRight, ShieldCheck, Eye, EyeOff,
  BadgeCheck, Sparkles, Search, Palette, Type, Monitor,
  SidebarOpen, Moon, Sun, Loader2, RotateCcw,
  Target, Brain, Zap, X, Save, MessageSquare,
} from 'lucide-react'
import { ShijlAIText } from '@/components/ui/brand-text'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */
interface StudentSettingsData {
  // Profile
  headline: string | null
  location: string | null
  website: string | null
  linkedin: string | null
  learningGoalType: 'career' | 'skill' | 'personal'
  // Learning
  dailyGoalMinutes: number
  reminderTime: string
  videoQuality: 'auto' | '1080p' | '720p' | '480p'
  playbackSpeed: '0.75x' | '1x' | '1.25x' | '1.5x' | '2x'
  preferredLang: 'en' | 'ur' | 'ask'
  aiTutorMode: 'socratic' | 'direct'
  offlineDownloads: 'wifi' | 'always' | 'disabled'
  autoPlay: boolean
  showSubtitles: boolean
  focusMode: boolean
  spacedRepetition: boolean
  // Notifications
  notifyDailyReminder: boolean
  notifyAssignmentDue: boolean
  notifyInstructorReply: boolean
  notifyLiveSession: boolean
  notifyNewCourse: boolean
  notifyStreakRisk: boolean
  notifyCertificate: boolean
  notifyPlatformUpdates: boolean
  emailDailyReminder: string
  emailAssignmentDue: string
  emailInstructorReply: string
  emailLiveSession: string
  emailNewCourse: string
  emailStreakRisk: string
  emailCertificate: string
  emailPlatformUpdates: string
  // Privacy
  profileVisibility: 'public' | 'students' | 'private'
  showProgress: boolean
  showOnLeaderboard: boolean
  showCertificates: boolean
  showOnlineStatus: boolean
  allowMessages: 'everyone' | 'instructors' | 'nobody'
  dataSharing: boolean
  // Appearance
  theme: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'default' | 'large'
  compactMode: boolean
  reducedMotion: boolean
  sidebarPosition: 'left' | 'right'
}

interface UserData {
  id: string
  email: string
  name: string
  avatar: string | null
  bio: string | null
  language: string
  phone: string | null
  authProvider: string
  mfaEnabled: boolean
  createdAt: string
  lastLoginAt: string | null
  lastActiveAt: string
}

interface TransactionData {
  id: string
  amount: number
  currency: string
  status: string
  description: string | null
  paymentMethod: string
  createdAt: string
  courseId: string | null
  course: { title: string } | null
}

const DEFAULT_SETTINGS: StudentSettingsData = {
  headline: null,
  location: null,
  website: null,
  linkedin: null,
  learningGoalType: 'career',
  dailyGoalMinutes: 30,
  reminderTime: '20:00',
  videoQuality: 'auto',
  playbackSpeed: '1x',
  preferredLang: 'en',
  aiTutorMode: 'socratic',
  offlineDownloads: 'wifi',
  autoPlay: true,
  showSubtitles: true,
  focusMode: false,
  spacedRepetition: true,
  notifyDailyReminder: true,
  notifyAssignmentDue: true,
  notifyInstructorReply: true,
  notifyLiveSession: true,
  notifyNewCourse: true,
  notifyStreakRisk: true,
  notifyCertificate: true,
  notifyPlatformUpdates: false,
  emailDailyReminder: 'off',
  emailAssignmentDue: '1_day_before',
  emailInstructorReply: 'immediately',
  emailLiveSession: '1_hour_before',
  emailNewCourse: 'weekly_digest',
  emailStreakRisk: 'off',
  emailCertificate: 'immediately',
  emailPlatformUpdates: 'off',
  profileVisibility: 'public',
  showProgress: true,
  showOnLeaderboard: true,
  showCertificates: true,
  showOnlineStatus: true,
  allowMessages: 'instructors',
  dataSharing: false,
  theme: 'system',
  fontSize: 'default',
  compactMode: false,
  reducedMotion: false,
  sidebarPosition: 'left',
}

/* ─── Tab Config ─── */
type SettingsTab = 'profile' | 'account' | 'learning' | 'notifications' | 'privacy' | 'appearance' | 'billing'

const TABS: { id: SettingsTab; label: string; icon: React.ElementType; keywords: string[] }[] = [
  { id: 'profile', label: 'Profile', icon: User, keywords: ['name', 'bio', 'photo', 'headline', 'location', 'website', 'linkedin', 'goal'] },
  { id: 'account', label: 'Account', icon: Shield, keywords: ['email', 'password', 'phone', '2fa', 'two-factor', 'connected', 'google', 'delete', 'export'] },
  { id: 'learning', label: 'Learning', icon: GraduationCap, keywords: ['daily', 'goal', 'video', 'quality', 'speed', 'language', 'ai', 'tutor', 'download', 'autoplay', 'subtitles', 'focus', 'spaced', 'repetition'] },
  { id: 'notifications', label: 'Notifications', icon: Bell, keywords: ['notify', 'email', 'reminder', 'assignment', 'instructor', 'live', 'course', 'streak', 'certificate', 'platform'] },
  { id: 'privacy', label: 'Privacy', icon: Eye, keywords: ['visibility', 'progress', 'leaderboard', 'certificates', 'online', 'messages', 'data', 'sharing'] },
  { id: 'appearance', label: 'Appearance', icon: Palette, keywords: ['theme', 'dark', 'light', 'font', 'size', 'compact', 'motion', 'sidebar'] },
  { id: 'billing', label: 'Billing', icon: CreditCard, keywords: ['plan', 'payment', 'purchase', 'refund', 'invoice', 'card', 'jazzcash', 'easypaisa'] },
]

const EMAIL_OPTIONS = [
  { value: 'off', label: 'Off' },
  { value: 'immediately', label: 'Immediately' },
  { value: '1_hour_before', label: '1 hour before' },
  { value: '1_day_before', label: '1 day before' },
  { value: 'weekly_digest', label: 'Weekly digest' },
]

/* ═══════════════════════════════════════════════════════════
   DEEP COMPARE UTILITY
   ═══════════════════════════════════════════════════════════ */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a == null || b == null) return a === b
  if (typeof a !== 'object' || typeof b !== 'object') return a === b
  const keysA = Object.keys(a as Record<string, unknown>)
  const keysB = Object.keys(b as Record<string, unknown>)
  if (keysA.length !== keysB.length) return false
  return keysA.every(key => deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]))
}

/* ═══════════════════════════════════════════════════════════
   STUDENT SETTINGS VIEW
   ═══════════════════════════════════════════════════════════ */
export function StudentSettingsView() {
  const { currentUser, setCurrentUser, language, setLanguage } = useAppStore()
  const { theme: activeTheme, setTheme } = useTheme()

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [settings, setSettings] = useState<StudentSettingsData>(DEFAULT_SETTINGS)
  const [initialSettings, setInitialSettings] = useState<StudentSettingsData>(DEFAULT_SETTINGS)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [transactions, setTransactions] = useState<TransactionData[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [autoSave, setAutoSave] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [pendingTab, setPendingTab] = useState<SettingsTab | null>(null)
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Profile fields tracked separately for user updates
  const [profileName, setProfileName] = useState('')
  const [profileBio, setProfileBio] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [initialProfileName, setInitialProfileName] = useState('')
  const [initialProfileBio, setInitialProfileBio] = useState('')
  const [initialProfilePhone, setInitialProfilePhone] = useState('')

  // Fetch settings on mount
  useEffect(() => {
    if (!currentUser) return
    const fetchSettings = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/student/settings?studentId=${currentUser.id}`)
        if (!res.ok) throw new Error('Failed to fetch settings')
        const data = await res.json()
        if (!data.user) {
          toast.error('Failed to load user data')
          return
        }
        const s = { ...DEFAULT_SETTINGS, ...data.settings }
        setSettings(s)
        setInitialSettings(s)
        setUserData(data.user)
        setTransactions(data.transactions || [])
        setProfileName(data.user.name || '')
        setProfileBio(data.user.bio || '')
        setProfilePhone(data.user.phone || '')
        setInitialProfileName(data.user.name || '')
        setInitialProfileBio(data.user.bio || '')
        setInitialProfilePhone(data.user.phone || '')
      } catch (err) {
        console.error('Failed to fetch settings:', err)
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [currentUser])

  // Dirty detection
  const isDirty = useMemo(() => {
    const settingsChanged = !deepEqual(settings, initialSettings)
    const profileChanged = profileName !== initialProfileName || profileBio !== initialProfileBio || profilePhone !== initialProfilePhone
    return settingsChanged || profileChanged
  }, [settings, initialSettings, profileName, profileBio, profilePhone, initialProfileName, initialProfileBio, initialProfilePhone])

  // Auto-save effect
  useEffect(() => {
    if (!autoSave || !isDirty || !currentUser) return
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    autoSaveTimerRef.current = setTimeout(() => {
      handleSave(activeTab, true)
    }, 1500)
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [autoSave, isDirty, settings, profileName, profileBio, profilePhone])

  // Save handler
  const handleSave = useCallback(async (tab: SettingsTab, isAutoSave = false) => {
    if (!currentUser) return
    setSaving(true)
    try {
      const body: Record<string, unknown> = { studentId: currentUser.id }

      // Always send all changed settings
      const changedKeys = Object.keys(settings).filter(
        key => !deepEqual(settings[key as keyof StudentSettingsData], initialSettings[key as keyof StudentSettingsData])
      )
      for (const key of changedKeys) {
        body[key] = settings[key as keyof StudentSettingsData]
      }

      // Profile fields (sent at top level as the API expects)
      if (profileName !== initialProfileName) body.name = profileName
      if (profileBio !== initialProfileBio) body.bio = profileBio
      if (profilePhone !== initialProfilePhone) body.phone = profilePhone

      const res = await fetch('/api/student/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save settings')
      }

      // Update local state
      setInitialSettings({ ...settings })
      setInitialProfileName(profileName)
      setInitialProfileBio(profileBio)
      setInitialProfilePhone(profilePhone)

      // Update Zustand store if name/bio changed
      if (currentUser && (profileName !== currentUser.name || profileBio !== (currentUser.bio || ''))) {
        setCurrentUser({ ...currentUser, name: profileName, bio: profileBio })
      }

      // Update language in store if changed
      if (settings.preferredLang !== initialSettings.preferredLang) {
        if (settings.preferredLang === 'ur' || settings.preferredLang === 'en') {
          setLanguage(settings.preferredLang)
        }
      }

      if (!isAutoSave) {
        toast.success('Settings saved successfully')
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save settings'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }, [currentUser, settings, initialSettings, profileName, profileBio, profilePhone, initialProfileName, initialProfileBio, initialProfilePhone, setCurrentUser, setLanguage])

  // Tab switching with unsaved changes guard
  const handleTabSwitch = useCallback((tab: SettingsTab) => {
    if (isDirty) {
      setPendingTab(tab)
      setShowDiscardDialog(true)
    } else {
      setActiveTab(tab)
    }
  }, [isDirty])

  const handleDiscardChanges = useCallback(() => {
    setSettings({ ...initialSettings })
    setProfileName(initialProfileName)
    setProfileBio(initialProfileBio)
    setProfilePhone(initialProfilePhone)
    setShowDiscardDialog(false)
    if (pendingTab) {
      setActiveTab(pendingTab)
      setPendingTab(null)
    }
  }, [initialSettings, initialProfileName, initialProfileBio, initialProfilePhone, pendingTab])

  const handleKeepEditing = useCallback(() => {
    setShowDiscardDialog(false)
    setPendingTab(null)
  }, [])

  // Update settings helper
  const updateSetting = useCallback(<K extends keyof StudentSettingsData>(key: K, value: StudentSettingsData[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return TABS.filter(tab =>
      tab.keywords.some(kw => kw.includes(q)) || tab.label.toLowerCase().includes(q)
    ).map(tab => tab.id)
  }, [searchQuery])

  if (!currentUser) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 ios-shadow-sm">
            <Settings className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-foreground">Settings</h1>
            <p className="text-[15px] text-muted-foreground">Manage your profile, learning preferences, and account</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Auto-save toggle */}
          <div className="hidden sm:flex items-center gap-2 text-[12px] text-muted-foreground">
            <Switch checked={autoSave} onCheckedChange={setAutoSave} className="scale-75" />
            Auto-save
          </div>
          {/* Search */}
          <Button
            variant="outline"
            size="icon"
            className="size-9 rounded-xl"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="size-4" />
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-xl h-10 text-[14px] pl-9 pr-9"
                placeholder="Search settings..."
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            {searchResults.length > 0 && searchQuery.trim() && (
              <div className="mt-2 flex flex-wrap gap-2">
                {searchResults.map(tabId => {
                  const tab = TABS.find(t => t.id === tabId)!
                  const Icon = tab.icon
                  return (
                    <button
                      key={tabId}
                      onClick={() => { handleTabSwitch(tabId); setSearchQuery(''); setShowSearch(false) }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-medium bg-muted/60 hover:bg-muted transition-colors"
                    >
                      <Icon className="size-3.5" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unsaved indicator */}
      {isDirty && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 text-[13px] text-amber-700 dark:text-amber-300"
        >
          <div className="size-2 rounded-full bg-amber-500 animate-pulse" />
          You have unsaved changes
          <button
            onClick={() => handleSave(activeTab)}
            className="ml-auto text-[12px] font-medium text-amber-600 dark:text-amber-400 hover:underline"
          >
            Save now
          </button>
        </motion.div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabSwitch(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 whitespace-nowrap shrink-0',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {loading ? (
        <SettingsSkeleton />
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'profile' && (
              <ProfileTab
                settings={settings}
                updateSetting={updateSetting}
                user={userData}
                profileName={profileName}
                setProfileName={setProfileName}
                profileBio={profileBio}
                setProfileBio={setProfileBio}
                currentUser={currentUser}
                saving={saving}
                onSave={() => handleSave('profile')}
              />
            )}
            {activeTab === 'account' && (
              <AccountTab
                user={userData}
                settings={settings}
                updateSetting={updateSetting}
                profilePhone={profilePhone}
                setProfilePhone={setProfilePhone}
                studentId={currentUser.id}
                saving={saving}
                onSave={() => handleSave('account')}
              />
            )}
            {activeTab === 'learning' && (
              <LearningTab
                settings={settings}
                updateSetting={updateSetting}
                saving={saving}
                onSave={() => handleSave('learning')}
                setLanguage={setLanguage}
              />
            )}
            {activeTab === 'notifications' && (
              <NotificationsTab
                settings={settings}
                updateSetting={updateSetting}
                saving={saving}
                onSave={() => handleSave('notifications')}
              />
            )}
            {activeTab === 'privacy' && (
              <PrivacyTab
                settings={settings}
                updateSetting={updateSetting}
                saving={saving}
                onSave={() => handleSave('privacy')}
              />
            )}
            {activeTab === 'appearance' && (
              <AppearanceTab
                settings={settings}
                updateSetting={updateSetting}
                saving={saving}
                onSave={() => handleSave('appearance')}
              />
            )}
            {activeTab === 'billing' && (
              <BillingTab
                user={userData}
                transactions={transactions}
                studentId={currentUser.id}
              />
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Discard Changes Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Switching tabs will discard all changes you&apos;ve made. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleKeepEditing} className="rounded-xl">Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardChanges} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SKELETON LOADER
   ═══════════════════════════════════════════════════════════ */
function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2].map(i => (
        <div key={i} className="rounded-2xl ios-shadow-sm bg-card p-5 space-y-4">
          <Skeleton className="h-6 w-40 rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-24 rounded-lg" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-4 w-32 rounded-lg" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SAVE BUTTON COMPONENT
   ═══════════════════════════════════════════════════════════ */
function SaveButton({ saving, onSave, label }: { saving: boolean; onSave: () => void; label: string }) {
  return (
    <Button
      onClick={onSave}
      disabled={saving}
      className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm min-w-[140px]"
    >
      {saving ? (
        <Loader2 className="size-4 mr-1.5 animate-spin" />
      ) : (
        <Check className="size-4 mr-1.5" />
      )}
      {saving ? 'Saving...' : label}
    </Button>
  )
}

/* ═══════════════════════════════════════════════════════════
   PROFILE TAB
   ═══════════════════════════════════════════════════════════ */
function ProfileTab({
  settings,
  updateSetting,
  user,
  profileName,
  setProfileName,
  profileBio,
  setProfileBio,
  currentUser,
  saving,
  onSave,
}: {
  settings: StudentSettingsData
  updateSetting: <K extends keyof StudentSettingsData>(key: K, value: StudentSettingsData[K]) => void
  user: UserData | null
  profileName: string
  setProfileName: (v: string) => void
  profileBio: string
  setProfileBio: (v: string) => void
  currentUser: { name: string; avatar: string | null }
  saving: boolean
  onSave: () => void
}) {
  return (
    <div className="space-y-6">
      {/* Profile Photo */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-5">
        <h3 className="text-[16px] font-semibold mb-4">Profile Photo</h3>
        <div className="flex items-center gap-4">
          <Avatar className="size-20 ring-2 ring-primary/20 rounded-2xl">
            <AvatarImage src={currentUser.avatar || undefined} alt={profileName} />
            <AvatarFallback className="text-xl bg-primary/10 text-primary font-semibold rounded-2xl">
              {profileName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" className="rounded-xl text-[13px] gap-2">
              <Camera className="size-4" />
              Upload new
            </Button>
            <Button variant="ghost" size="sm" className="rounded-xl text-[13px] gap-2 text-muted-foreground hover:text-destructive">
              <Trash2 className="size-4" />
              Remove
            </Button>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-5 space-y-4">
        <h3 className="text-[16px] font-semibold">Basic Information</h3>

        <div className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium">Full Name</Label>
            <Input
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="rounded-xl h-10 text-[14px]"
              placeholder="Your full name"
            />
          </div>

          {/* Username (read-only display) */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium">Username</Label>
            <Input
              value={'@' + profileName.toLowerCase().replace(/\s+/g, '.')}
              readOnly
              className="rounded-xl h-10 text-[14px] bg-muted/50"
            />
            <p className="text-[11px] text-muted-foreground">Based on your name</p>
          </div>

          {/* Headline */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium">Headline</Label>
            <Input
              value={settings.headline || ''}
              onChange={(e) => updateSetting('headline', e.target.value || null)}
              className="rounded-xl h-10 text-[14px]"
              placeholder="A short tagline about you"
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium">Bio</Label>
            <Textarea
              value={profileBio}
              onChange={(e) => setProfileBio(e.target.value)}
              className="rounded-xl text-[14px] min-h-[80px] resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>

          {/* Location */}
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
              <Input
                value={settings.location || ''}
                onChange={(e) => updateSetting('location', e.target.value || null)}
                className="rounded-xl h-10 text-[14px] pl-9"
                placeholder="City, Country"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Website */}
            <div className="space-y-1.5 flex-1">
              <Label className="text-[13px] font-medium">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                <Input
                  value={settings.website || ''}
                  onChange={(e) => updateSetting('website', e.target.value || null)}
                  className="rounded-xl h-10 text-[14px] pl-9"
                  placeholder="https://yoursite.com"
                />
              </div>
              {settings.website && !/^https?:\/\/.+/.test(settings.website) && (
                <p className="text-[11px] text-destructive">Please enter a valid URL starting with http:// or https://</p>
              )}
            </div>

            {/* LinkedIn */}
            <div className="space-y-1.5 flex-1">
              <Label className="text-[13px] font-medium">LinkedIn</Label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
                <Input
                  value={settings.linkedin || ''}
                  onChange={(e) => updateSetting('linkedin', e.target.value || null)}
                  className="rounded-xl h-10 text-[14px] pl-9"
                  placeholder="linkedin.com/in/yourprofile"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Goal */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-5">
        <h3 className="text-[16px] font-semibold mb-4">Learning Goal</h3>
        <RadioGroup
          value={settings.learningGoalType}
          onValueChange={(v) => updateSetting('learningGoalType', v as 'career' | 'skill' | 'personal')}
          className="space-y-3"
        >
          {[
            { value: 'career', label: 'Career change', desc: 'Switching to a new career path in tech', icon: Target },
            { value: 'skill', label: 'Skill upgrade', desc: 'Improving existing skills for current role', icon: Zap },
            { value: 'personal', label: 'Personal interest', desc: 'Learning for fun and personal growth', icon: Sparkles },
          ].map((option) => {
            const Icon = option.icon
            return (
              <label
                key={option.value}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200',
                  settings.learningGoalType === option.value
                    ? 'bg-primary/8 ring-1 ring-primary/20'
                    : 'bg-muted/30 hover:bg-muted/50'
                )}
              >
                <RadioGroupItem value={option.value} className="mt-0.5" />
                <Icon className={cn(
                  'size-5 mt-0.5 shrink-0',
                  settings.learningGoalType === option.value ? 'text-primary' : 'text-muted-foreground'
                )} />
                <div>
                  <p className="text-[14px] font-medium">{option.label}</p>
                  <p className="text-[12px] text-muted-foreground">{option.desc}</p>
                </div>
              </label>
            )
          })}
        </RadioGroup>
      </div>

      {/* Session Info */}
      {user && (
        <div className="rounded-2xl ios-shadow-sm bg-card p-5">
          <h3 className="text-[16px] font-semibold mb-3">Session Info</h3>
          <div className="flex flex-col sm:flex-row gap-4 text-[13px]">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="size-4" />
              Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            {user.lastLoginAt && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="size-4" />
                Last login {new Date(user.lastLoginAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <SaveButton saving={saving} onSave={onSave} label="Save Profile" />
        <Button variant="outline" className="rounded-xl text-[13px] gap-1.5">
          <ExternalLink className="size-3.5" />
          View public profile
        </Button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   ACCOUNT TAB
   ═══════════════════════════════════════════════════════════ */
function AccountTab({
  user,
  settings,
  updateSetting,
  profilePhone,
  setProfilePhone,
  studentId,
  saving,
  onSave,
}: {
  user: UserData | null
  settings: StudentSettingsData
  updateSetting: <K extends keyof StudentSettingsData>(key: K, value: StudentSettingsData[K]) => void
  profilePhone: string
  setProfilePhone: (v: string) => void
  studentId: string
  saving: boolean
  onSave: () => void
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [show2faDialog, setShow2faDialog] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [emailValue, setEmailValue] = useState('')
  const [passwordCurrent, setPasswordCurrent] = useState('')
  const [passwordNew, setPasswordNew] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const handleEmailChange = async () => {
    if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      toast.error('Please enter a valid email address')
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch('/api/student/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, newEmail: emailValue }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to change email')
      toast.success('Email changed successfully')
      setShowEmailDialog(false)
      setEmailValue('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to change email')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!passwordCurrent || !passwordNew || !passwordConfirm) {
      toast.error('All password fields are required')
      return
    }
    if (passwordNew.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    if (passwordNew !== passwordConfirm) {
      toast.error('New passwords do not match')
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch('/api/student/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, currentPassword: passwordCurrent, newPassword: passwordNew }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to change password')
      toast.success('Password changed successfully')
      setShowPasswordDialog(false)
      setPasswordCurrent('')
      setPasswordNew('')
      setPasswordConfirm('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Type DELETE to confirm account deletion')
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch('/api/student/settings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete account')
      toast.success('Account deleted successfully')
      window.location.reload()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete account')
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggle2FA = async () => {
    if (!user) return
    setActionLoading(true)
    try {
      const newValue = !user?.mfaEnabled
      const res = await fetch('/api/student/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, mfaEnabled: newValue }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update 2FA')
      toast.success(newValue ? '2FA enabled successfully' : '2FA disabled')
      setShow2faDialog(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update 2FA')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDataExport = () => {
    const exportData = {
      user,
      settings,
      exportDate: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shijlai-data-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Data exported successfully')
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Email */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/30">
              <Mail className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-[13px] text-muted-foreground">Email</p>
              <p className="text-[15px] font-medium">{user.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-[13px]"
            onClick={() => { setEmailValue(user.email); setShowEmailDialog(true) }}
          >
            Change
          </Button>
        </div>
      </div>

      {/* Password */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/30">
              <Lock className="size-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-[13px] text-muted-foreground">Password</p>
              <p className="text-[15px] font-medium font-mono tracking-widest">••••••••••</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-[13px]"
            onClick={() => setShowPasswordDialog(true)}
          >
            Change
          </Button>
        </div>
      </div>

      {/* Phone */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/30">
              <Phone className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[13px] text-muted-foreground">Phone</p>
              <p className="text-[15px] font-medium">{profilePhone || 'Not set'}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-[13px] gap-1.5"
            onClick={() => setProfilePhone(profilePhone || '')}
          >
            <BadgeCheck className="size-3.5" />
            {profilePhone ? 'Update' : 'Add'}
          </Button>
        </div>
        {profilePhone !== undefined && (
          <div className="mt-3 space-y-1.5">
            <Label className="text-[13px] font-medium">Phone Number</Label>
            <Input
              value={profilePhone}
              onChange={(e) => setProfilePhone(e.target.value)}
              className="rounded-xl h-10 text-[14px]"
              placeholder="+92-3XX-XXXXXXX"
            />
          </div>
        )}
      </div>

      {/* 2FA */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-950/30">
              <ShieldCheck className="size-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-[14px] font-medium">Two-Factor Authentication</p>
              <p className="text-[12px] text-muted-foreground">
                {user.mfaEnabled ? 'Enabled — extra security for your account' : 'Add an extra layer of security to your account'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={cn(
              'text-[11px] rounded-lg',
              user.mfaEnabled
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground'
            )}>
              {user.mfaEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
            <Button
              variant={user.mfaEnabled ? 'ghost' : 'outline'}
              size="sm"
              className="rounded-xl text-[13px]"
              onClick={() => setShow2faDialog(true)}
            >
              {user.mfaEnabled ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-5">
        <h3 className="text-[16px] font-semibold mb-4">Connected Accounts</h3>
        <div className="space-y-3">
          {[
            { icon: Chrome, label: 'Google', connected: user.authProvider === 'google', color: 'bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400' },
            { icon: Facebook, label: 'Facebook', connected: user.authProvider === 'facebook', color: 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400' },
            { icon: Apple, label: 'Apple', connected: user.authProvider === 'apple', color: 'bg-gray-100 dark:bg-gray-950/30 text-gray-600 dark:text-gray-400' },
          ].map((account) => {
            const Icon = account.icon
            return (
              <div key={account.label} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className={cn('flex size-9 items-center justify-center rounded-xl', account.color)}>
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium">{account.label}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {account.connected ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                {account.connected ? (
                  <Badge variant="secondary" className="text-[11px] rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                    Connected
                  </Badge>
                ) : (
                  <Button variant="outline" size="sm" className="rounded-xl text-[13px]">
                    Connect
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Data Export */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-950/30">
              <FileDown className="size-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div>
              <p className="text-[14px] font-medium">Export Your Data</p>
              <p className="text-[12px] text-muted-foreground">Download a copy of all your data in JSON format</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="rounded-xl text-[13px] gap-1.5" onClick={handleDataExport}>
            <FileDown className="size-3.5" />
            Export
          </Button>
        </div>
      </div>

      {/* Session Info */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-5">
        <h3 className="text-[16px] font-semibold mb-3">Account Info</h3>
        <div className="flex flex-col gap-2 text-[13px]">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-4" />
            Account created: {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          {user.lastLoginAt && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="size-4" />
              Last login: {new Date(user.lastLoginAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Account */}
      <div className="rounded-2xl ios-shadow-sm bg-destructive/5 border border-destructive/20 p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 shrink-0">
              <AlertTriangle className="size-5 text-destructive" />
            </div>
            <div>
              <p className="text-[14px] font-medium text-destructive">Delete Account</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Permanently delete your account and all data. This action cannot be undone.
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            className="rounded-xl text-[13px]"
            onClick={() => setShowDeleteDialog(true)}
          >
            Delete Account
          </Button>
        </div>
      </div>

      {/* Save Phone */}
      <div className="flex items-center gap-3">
        <SaveButton saving={saving} onSave={onSave} label="Save Changes" />
      </div>

      {/* Email Change Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Change Email Address</DialogTitle>
            <DialogDescription>Enter your new email address. You may need to verify it.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium">Current email</Label>
              <Input value={user.email} readOnly className="rounded-xl h-10 text-[14px] bg-muted/50" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium">New email</Label>
              <Input
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
                className="rounded-xl h-10 text-[14px]"
                placeholder="newemail@example.com"
                type="email"
              />
              {emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue) && (
                <p className="text-[11px] text-destructive">Please enter a valid email address</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)} className="rounded-xl">Cancel</Button>
            <Button
              onClick={handleEmailChange}
              disabled={actionLoading || !emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)}
              className="rounded-xl"
            >
              {actionLoading && <Loader2 className="size-4 mr-1.5 animate-spin" />}
              Change Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium">Current password</Label>
              <div className="relative">
                <Input
                  value={passwordCurrent}
                  onChange={(e) => setPasswordCurrent(e.target.value)}
                  className="rounded-xl h-10 text-[14px] pr-9"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium">New password</Label>
              <Input
                value={passwordNew}
                onChange={(e) => setPasswordNew(e.target.value)}
                className="rounded-xl h-10 text-[14px]"
                type="password"
                placeholder="At least 8 characters"
              />
              {passwordNew && passwordNew.length < 8 && (
                <p className="text-[11px] text-destructive">Password must be at least 8 characters</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-medium">Confirm new password</Label>
              <Input
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="rounded-xl h-10 text-[14px]"
                type="password"
                placeholder="Re-enter new password"
              />
              {passwordConfirm && passwordNew !== passwordConfirm && (
                <p className="text-[11px] text-destructive">Passwords do not match</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)} className="rounded-xl">Cancel</Button>
            <Button
              onClick={handlePasswordChange}
              disabled={actionLoading || !passwordCurrent || !passwordNew || passwordNew.length < 8 || passwordNew !== passwordConfirm}
              className="rounded-xl"
            >
              {actionLoading && <Loader2 className="size-4 mr-1.5 animate-spin" />}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2FA Confirmation Dialog */}
      <AlertDialog open={show2faDialog} onOpenChange={setShow2faDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{user.mfaEnabled ? 'Disable Two-Factor Authentication?' : 'Enable Two-Factor Authentication?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {user.mfaEnabled
                ? 'Disabling 2FA removes an extra layer of security from your account. Are you sure?'
                : 'Enabling 2FA adds an extra layer of security. You will need an authenticator app to generate codes.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggle2FA}
              disabled={actionLoading}
              className={cn('rounded-xl', user.mfaEnabled && 'bg-destructive text-destructive-foreground hover:bg-destructive/90')}
            >
              {actionLoading && <Loader2 className="size-4 mr-1.5 animate-spin" />}
              {user.mfaEnabled ? 'Disable 2FA' : 'Enable 2FA'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete Account Permanently</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account, all your courses, progress, certificates, and data. This action <strong>cannot be undone</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Label className="text-[13px] font-medium">
              Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm
            </Label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="rounded-xl h-10 text-[14px] mt-1.5"
              placeholder="DELETE"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText('')} className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={actionLoading || deleteConfirmText !== 'DELETE'}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading && <Loader2 className="size-4 mr-1.5 animate-spin" />}
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   LEARNING TAB
   ═══════════════════════════════════════════════════════════ */
function LearningTab({
  settings,
  updateSetting,
  saving,
  onSave,
  setLanguage,
}: {
  settings: StudentSettingsData
  updateSetting: <K extends keyof StudentSettingsData>(key: K, value: StudentSettingsData[K]) => void
  saving: boolean
  onSave: () => void
  setLanguage: (lang: 'en' | 'ur') => void
}) {
  // Immediately update language in store when changed
  const handleLanguageChange = (value: 'en' | 'ur' | 'ask') => {
    updateSetting('preferredLang', value)
    if (value === 'en' || value === 'ur') {
      setLanguage(value)
    }
  }

  return (
    <div className="space-y-6">
      {/* Daily Learning Goal */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-5">
        <h3 className="text-[16px] font-semibold mb-4">Daily Learning Goal</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="space-y-1.5 flex-1">
            <Label className="text-[13px] font-medium">Time per day</Label>
            <Select value={String(settings.dailyGoalMinutes)} onValueChange={(v) => updateSetting('dailyGoalMinutes', parseInt(v))}>
              <SelectTrigger className="rounded-xl h-10 text-[14px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="45">45 min</SelectItem>
                <SelectItem value="60">60 min</SelectItem>
                <SelectItem value="90">90 min</SelectItem>
                <SelectItem value="120">120 min</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 flex-1">
            <Label className="text-[13px] font-medium">Set reminder</Label>
            <Select value={settings.reminderTime} onValueChange={(v) => updateSetting('reminderTime', v)}>
              <SelectTrigger className="rounded-xl h-10 text-[14px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {['06:00','07:00','08:00','12:00','18:00','19:00','20:00','21:00','22:00'].map(t => (
                  <SelectItem key={t} value={t}>
                    {new Date(`2000-01-01T${t}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Video Preferences */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-5">
        <h3 className="text-[16px] font-semibold mb-4">Video Preferences</h3>
        <div className="space-y-5">
          {/* Default Quality */}
          <div className="space-y-2.5">
            <Label className="text-[13px] font-medium flex items-center gap-2">
              <Video className="size-4 text-muted-foreground" />
              Default quality
            </Label>
            <RadioGroup
              value={settings.videoQuality}
              onValueChange={(v) => updateSetting('videoQuality', v as StudentSettingsData['videoQuality'])}
              className="flex flex-wrap gap-2"
            >
              {[
                { value: 'auto', label: 'Auto' },
                { value: '1080p', label: '1080p' },
                { value: '720p', label: '720p' },
                { value: '480p', label: '480p (save data)' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-xl cursor-pointer transition-all duration-200 text-[13px]',
                    settings.videoQuality === option.value
                      ? 'bg-primary/8 ring-1 ring-primary/20 font-medium'
                      : 'bg-muted/30 hover:bg-muted/50 text-muted-foreground'
                  )}
                >
                  <RadioGroupItem value={option.value} className="scale-90" />
                  {option.label}
                </label>
              ))}
            </RadioGroup>
          </div>

          <Separator className="opacity-40" />

          {/* Default Speed */}
          <div className="space-y-2.5">
            <Label className="text-[13px] font-medium flex items-center gap-2">
              <Play className="size-4 text-muted-foreground" />
              Default playback speed
            </Label>
            <RadioGroup
              value={settings.playbackSpeed}
              onValueChange={(v) => updateSetting('playbackSpeed', v as StudentSettingsData['playbackSpeed'])}
              className="flex flex-wrap gap-2"
            >
              {[
                { value: '0.75x', label: '0.75x' },
                { value: '1x', label: '1x' },
                { value: '1.25x', label: '1.25x' },
                { value: '1.5x', label: '1.5x' },
                { value: '2x', label: '2x' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 rounded-xl cursor-pointer transition-all duration-200 text-[13px]',
                    settings.playbackSpeed === option.value
                      ? 'bg-primary/8 ring-1 ring-primary/20 font-medium'
                      : 'bg-muted/30 hover:bg-muted/50 text-muted-foreground'
                  )}
                >
                  <RadioGroupItem value={option.value} className="scale-90" />
                  {option.label}
                </label>
              ))}
            </RadioGroup>
          </div>
        </div>
      </div>

      {/* Language & AI Preferences */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-5 space-y-5">
        {/* Preferred Language */}
        <div className="space-y-2.5">
          <h3 className="text-[16px] font-semibold flex items-center gap-2">
            <Languages className="size-4 text-muted-foreground" />
            Preferred Language
          </h3>
          <RadioGroup
            value={settings.preferredLang}
            onValueChange={(v) => handleLanguageChange(v as 'en' | 'ur' | 'ask')}
            className="space-y-2"
          >
            {[
              { value: 'en', label: 'English', desc: 'Courses and AI in English' },
              { value: 'ur', label: 'Urdu', desc: 'Courses and AI in Urdu' },
              { value: 'ar', label: 'Arabic', desc: 'Courses and AI in Arabic' },
              { value: 'ask', label: 'Ask per course', desc: 'Choose language when starting each course' },
            ].map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200',
                  settings.preferredLang === option.value
                    ? 'bg-primary/8 ring-1 ring-primary/20'
                    : 'bg-muted/30 hover:bg-muted/50'
                )}
              >
                <RadioGroupItem value={option.value} className="mt-0.5" />
                <div>
                  <p className="text-[14px] font-medium">{option.label}</p>
                  <p className="text-[12px] text-muted-foreground">{option.desc}</p>
                </div>
              </label>
            ))}
          </RadioGroup>
        </div>

        <Separator className="opacity-40" />

        {/* Ask ShijlAI Mode */}
        <div className="space-y-2.5">
          <h3 className="text-[16px] font-semibold flex items-center gap-2">
            <Bot className="size-4 text-muted-foreground" />
            Ask <ShijlAIText /> Mode
          </h3>
          <RadioGroup
            value={settings.aiTutorMode}
            onValueChange={(v) => updateSetting('aiTutorMode', v as 'socratic' | 'direct')}
            className="space-y-2"
          >
            {[
              { value: 'socratic', label: 'Socratic (guides me)', desc: 'The AI asks questions to help you discover answers yourself, building deeper understanding' },
              { value: 'direct', label: 'Direct (gives answers)', desc: 'The AI provides clear, direct answers and explanations when you are stuck' },
            ].map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200',
                  settings.aiTutorMode === option.value
                    ? 'bg-primary/8 ring-1 ring-primary/20'
                    : 'bg-muted/30 hover:bg-muted/50'
                )}
              >
                <RadioGroupItem value={option.value} className="mt-0.5" />
                <div>
                  <p className="text-[14px] font-medium">{option.label}</p>
                  <p className="text-[12px] text-muted-foreground">{option.desc}</p>
                </div>
              </label>
            ))}
          </RadioGroup>
        </div>
      </div>

      {/* Download & Playback Preferences */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-5 space-y-5">
        {/* Offline Downloads */}
        <div className="space-y-2.5">
          <h3 className="text-[16px] font-semibold flex items-center gap-2">
            <Download className="size-4 text-muted-foreground" />
            Offline Downloads
          </h3>
          <RadioGroup
            value={settings.offlineDownloads}
            onValueChange={(v) => updateSetting('offlineDownloads', v as 'wifi' | 'always' | 'disabled')}
            className="space-y-2"
          >
            {[
              { value: 'wifi', label: 'Enabled (WiFi only)', desc: 'Download lessons only when connected to WiFi to save mobile data' },
              { value: 'always', label: 'Always', desc: 'Download over any connection including mobile data' },
              { value: 'disabled', label: 'Disabled', desc: 'No offline downloads; stream all content' },
            ].map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200',
                  settings.offlineDownloads === option.value
                    ? 'bg-primary/8 ring-1 ring-primary/20'
                    : 'bg-muted/30 hover:bg-muted/50'
                )}
              >
                <RadioGroupItem value={option.value} className="mt-0.5" />
                <div>
                  <p className="text-[14px] font-medium">{option.label}</p>
                  <p className="text-[12px] text-muted-foreground">{option.desc}</p>
                </div>
              </label>
            ))}
          </RadioGroup>
        </div>

        <Separator className="opacity-40" />

        {/* Toggle switches */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[14px] font-medium">Auto-play next lesson</p>
              <p className="text-[12px] text-muted-foreground">Automatically continue to the next lesson when current one ends</p>
            </div>
            <Switch checked={settings.autoPlay} onCheckedChange={(v) => updateSetting('autoPlay', v)} />
          </div>

          <Separator className="opacity-40" />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[14px] font-medium flex items-center gap-2">
                <Subtitles className="size-4 text-muted-foreground" />
                Show subtitles by default
              </p>
              <p className="text-[12px] text-muted-foreground">Display subtitles on video lessons automatically</p>
            </div>
            <Switch checked={settings.showSubtitles} onCheckedChange={(v) => updateSetting('showSubtitles', v)} />
          </div>

          <Separator className="opacity-40" />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[14px] font-medium flex items-center gap-2">
                <Target className="size-4 text-muted-foreground" />
                Focus Mode
              </p>
              <p className="text-[12px] text-muted-foreground">Distraction-free learning mode that hides sidebar and recommendations</p>
            </div>
            <Switch checked={settings.focusMode} onCheckedChange={(v) => updateSetting('focusMode', v)} />
          </div>

          <Separator className="opacity-40" />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[14px] font-medium flex items-center gap-2">
                <Brain className="size-4 text-muted-foreground" />
                Spaced Repetition
              </p>
              <p className="text-[12px] text-muted-foreground">AI-powered review reminders at optimal intervals for better retention</p>
            </div>
            <Switch checked={settings.spacedRepetition} onCheckedChange={(v) => updateSetting('spacedRepetition', v)} />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <SaveButton saving={saving} onSave={onSave} label="Save Learning Preferences" />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   NOTIFICATIONS TAB
   ═══════════════════════════════════════════════════════════ */
function NotificationsTab({
  settings,
  updateSetting,
  saving,
  onSave,
}: {
  settings: StudentSettingsData
  updateSetting: <K extends keyof StudentSettingsData>(key: K, value: StudentSettingsData[K]) => void
  saving: boolean
  onSave: () => void
}) {
  const notificationEvents = [
    { key: 'DailyReminder', label: 'Daily learning reminder', icon: Clock },
    { key: 'AssignmentDue', label: 'Assignment due reminder', icon: GraduationCap },
    { key: 'InstructorReply', label: 'Instructor replied to my Q&A', icon: MessageSquare },
    { key: 'LiveSession', label: 'Live session starting soon', icon: Video },
    { key: 'NewCourse', label: 'New course from instructor', icon: GraduationCap },
    { key: 'StreakRisk', label: 'Streak at risk', icon: Zap },
    { key: 'Certificate', label: 'Certificate earned', icon: BadgeCheck },
    { key: 'PlatformUpdates', label: 'Platform updates & offers', icon: Globe },
  ] as const

  const enableAll = () => {
    notificationEvents.forEach(e => {
      updateSetting(`notify${e.key}` as keyof StudentSettingsData, true)
    })
  }

  const disableAll = () => {
    notificationEvents.forEach(e => {
      updateSetting(`notify${e.key}` as keyof StudentSettingsData, false)
      updateSetting(`email${e.key}` as keyof StudentSettingsData, 'off')
    })
  }

  return (
    <div className="space-y-6">
      {/* Bulk Actions */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" className="rounded-xl text-[13px] gap-1.5" onClick={enableAll}>
          <Check className="size-3.5" />
          Enable all notifications
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl text-[13px] gap-1.5" onClick={disableAll}>
          <X className="size-3.5" />
          Disable all notifications
        </Button>
      </div>

      <div className="rounded-2xl ios-shadow-sm bg-card overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_80px_140px] gap-4 px-5 py-3 bg-muted/30 border-b border-border/40">
          <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Event</span>
          <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider text-center">In-app</span>
          <span className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider text-center">Email</span>
        </div>

        {/* Rows */}
        {notificationEvents.map((event, idx) => {
          const notifyKey = `notify${event.key}` as keyof StudentSettingsData
          const emailKey = `email${event.key}` as keyof StudentSettingsData
          const Icon = event.icon
          return (
            <div
              key={event.key}
              className={cn(
                'grid grid-cols-[1fr_80px_140px] gap-4 px-5 py-3.5 items-center',
                idx < notificationEvents.length - 1 && 'border-b border-border/30'
              )}
            >
              {/* Event */}
              <div className="flex items-center gap-2.5">
                <Icon className="size-4 text-muted-foreground shrink-0" />
                <span className="text-[14px] font-medium">{event.label}</span>
              </div>

              {/* In-app */}
              <div className="flex justify-center">
                <Switch
                  checked={settings[notifyKey] as boolean}
                  onCheckedChange={(v) => updateSetting(notifyKey, v)}
                  className="scale-90"
                />
              </div>

              {/* Email */}
              <div className="flex justify-center">
                <Select
                  value={settings[emailKey] as string}
                  onValueChange={(v) => updateSetting(emailKey, v)}
                >
                  <SelectTrigger className="h-8 text-[12px] rounded-lg border-0 bg-muted/40 w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {EMAIL_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-[12px]">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )
        })}
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <SaveButton saving={saving} onSave={onSave} label="Save Notification Preferences" />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   PRIVACY TAB
   ═══════════════════════════════════════════════════════════ */
function PrivacyTab({
  settings,
  updateSetting,
  saving,
  onSave,
}: {
  settings: StudentSettingsData
  updateSetting: <K extends keyof StudentSettingsData>(key: K, value: StudentSettingsData[K]) => void
  saving: boolean
  onSave: () => void
}) {
  return (
    <div className="space-y-6">
      {/* Profile Visibility */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-5">
        <h3 className="text-[16px] font-semibold mb-4">Profile Visibility</h3>
        <RadioGroup
          value={settings.profileVisibility}
          onValueChange={(v) => updateSetting('profileVisibility', v as 'public' | 'students' | 'private')}
          className="space-y-2"
        >
          {[
            { value: 'public', label: 'Public', desc: 'Anyone can view your profile' },
            { value: 'students', label: 'Students only', desc: 'Only enrolled students can see your profile' },
            { value: 'private', label: 'Private', desc: 'Only you can see your profile' },
          ].map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200',
                settings.profileVisibility === option.value
                  ? 'bg-primary/8 ring-1 ring-primary/20'
                  : 'bg-muted/30 hover:bg-muted/50'
              )}
            >
              <RadioGroupItem value={option.value} className="mt-0.5" />
              <div>
                <p className="text-[14px] font-medium">{option.label}</p>
                <p className="text-[12px] text-muted-foreground">{option.desc}</p>
              </div>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Activity Sharing */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-5 space-y-5">
        <h3 className="text-[16px] font-semibold">Activity Sharing</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[14px] font-medium">Show learning progress</p>
              <p className="text-[12px] text-muted-foreground">Let others see your course progress and completion status</p>
            </div>
            <Switch checked={settings.showProgress} onCheckedChange={(v) => updateSetting('showProgress', v)} />
          </div>

          <Separator className="opacity-40" />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[14px] font-medium">Show on leaderboard</p>
              <p className="text-[12px] text-muted-foreground">Display your name and XP on the community leaderboard</p>
            </div>
            <Switch checked={settings.showOnLeaderboard} onCheckedChange={(v) => updateSetting('showOnLeaderboard', v)} />
          </div>

          <Separator className="opacity-40" />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[14px] font-medium">Show certificates</p>
              <p className="text-[12px] text-muted-foreground">Display earned certificates on your public profile</p>
            </div>
            <Switch checked={settings.showCertificates} onCheckedChange={(v) => updateSetting('showCertificates', v)} />
          </div>

          <Separator className="opacity-40" />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[14px] font-medium">Show online status</p>
              <p className="text-[12px] text-muted-foreground">Let others see when you are currently online</p>
            </div>
            <Switch checked={settings.showOnlineStatus} onCheckedChange={(v) => updateSetting('showOnlineStatus', v)} />
          </div>
        </div>
      </div>

      {/* Messaging Permissions */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-5">
        <h3 className="text-[16px] font-semibold mb-4">Messaging Permissions</h3>
        <RadioGroup
          value={settings.allowMessages}
          onValueChange={(v) => updateSetting('allowMessages', v as 'everyone' | 'instructors' | 'nobody')}
          className="space-y-2"
        >
          {[
            { value: 'everyone', label: 'Everyone', desc: 'Any student or instructor can message you' },
            { value: 'instructors', label: 'Instructors only', desc: 'Only your course instructors can message you' },
            { value: 'nobody', label: 'Nobody', desc: 'No one can send you direct messages' },
          ].map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200',
                settings.allowMessages === option.value
                  ? 'bg-primary/8 ring-1 ring-primary/20'
                  : 'bg-muted/30 hover:bg-muted/50'
              )}
            >
              <RadioGroupItem value={option.value} className="mt-0.5" />
              <div>
                <p className="text-[14px] font-medium">{option.label}</p>
                <p className="text-[12px] text-muted-foreground">{option.desc}</p>
              </div>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Data Sharing */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[14px] font-medium">Data Sharing</p>
            <p className="text-[12px] text-muted-foreground">Allow anonymized usage data to help improve the platform</p>
          </div>
          <Switch checked={settings.dataSharing} onCheckedChange={(v) => updateSetting('dataSharing', v)} />
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <SaveButton saving={saving} onSave={onSave} label="Save Privacy Settings" />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   APPEARANCE TAB (NEW)
   ═══════════════════════════════════════════════════════════ */
function AppearanceTab({
  settings,
  updateSetting,
  saving,
  onSave,
}: {
  settings: StudentSettingsData
  updateSetting: <K extends keyof StudentSettingsData>(key: K, value: StudentSettingsData[K]) => void
  saving: boolean
  onSave: () => void
}) {
  const { setTheme } = useTheme()

  // Apply theme immediately when changed
  const handleThemeChange = (value: 'light' | 'dark' | 'system') => {
    updateSetting('theme', value)
    setTheme(value)
  }

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-5">
        <h3 className="text-[16px] font-semibold mb-4 flex items-center gap-2">
          <Monitor className="size-4 text-muted-foreground" />
          Theme
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'light' as const, label: 'Light', icon: Sun, preview: 'bg-white border-2' },
            { value: 'dark' as const, label: 'Dark', icon: Moon, preview: 'bg-gray-900 border-2' },
            { value: 'system' as const, label: 'System', icon: Monitor, preview: 'bg-gradient-to-r from-white to-gray-900 border-2' },
          ].map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.value}
                onClick={() => handleThemeChange(option.value)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200',
                  settings.theme === option.value
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'bg-muted/30 hover:bg-muted/50'
                )}
              >
                <div className={cn(
                  'w-full h-16 rounded-lg overflow-hidden',
                  option.preview,
                  settings.theme === option.value ? 'border-primary' : 'border-border'
                )}>
                  <div className="h-full flex items-center justify-center">
                    <Icon className={cn(
                      'size-6',
                      option.value === 'light' ? 'text-gray-800' : option.value === 'dark' ? 'text-gray-200' : 'text-gray-500'
                    )} />
                  </div>
                </div>
                <span className="text-[13px] font-medium">{option.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Font Size */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-5">
        <h3 className="text-[16px] font-semibold mb-4 flex items-center gap-2">
          <Type className="size-4 text-muted-foreground" />
          Font Size
        </h3>
        <RadioGroup
          value={settings.fontSize}
          onValueChange={(v) => updateSetting('fontSize', v as 'small' | 'default' | 'large')}
          className="flex gap-3"
        >
          {[
            { value: 'small', label: 'Small', sample: 'text-[12px]' },
            { value: 'default', label: 'Default', sample: 'text-[14px]' },
            { value: 'large', label: 'Large', sample: 'text-[16px]' },
          ].map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl cursor-pointer transition-all duration-200',
                settings.fontSize === option.value
                  ? 'bg-primary/8 ring-1 ring-primary/20'
                  : 'bg-muted/30 hover:bg-muted/50'
              )}
            >
              <RadioGroupItem value={option.value} className="scale-90" />
              <span className={cn(option.sample, 'font-medium')}>{option.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Display Options */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-5 space-y-5">
        <h3 className="text-[16px] font-semibold">Display Options</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[14px] font-medium">Compact Mode</p>
              <p className="text-[12px] text-muted-foreground">Reduce spacing and show more content on screen</p>
            </div>
            <Switch checked={settings.compactMode} onCheckedChange={(v) => updateSetting('compactMode', v)} />
          </div>

          <Separator className="opacity-40" />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-[14px] font-medium">Reduced Motion</p>
              <p className="text-[12px] text-muted-foreground">Minimize animations for accessibility</p>
            </div>
            <Switch checked={settings.reducedMotion} onCheckedChange={(v) => updateSetting('reducedMotion', v)} />
          </div>
        </div>
      </div>

      {/* Sidebar Position */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-5">
        <h3 className="text-[16px] font-semibold mb-4 flex items-center gap-2">
          <SidebarOpen className="size-4 text-muted-foreground" />
          Sidebar Position
        </h3>
        <RadioGroup
          value={settings.sidebarPosition}
          onValueChange={(v) => updateSetting('sidebarPosition', v as 'left' | 'right')}
          className="flex gap-3"
        >
          {[
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
          ].map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 p-3 rounded-xl cursor-pointer transition-all duration-200',
                settings.sidebarPosition === option.value
                  ? 'bg-primary/8 ring-1 ring-primary/20 font-medium'
                  : 'bg-muted/30 hover:bg-muted/50 text-muted-foreground'
              )}
            >
              <RadioGroupItem value={option.value} className="scale-90" />
              {option.label}
            </label>
          ))}
        </RadioGroup>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <SaveButton saving={saving} onSave={onSave} label="Save Appearance" />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   BILLING TAB
   ═══════════════════════════════════════════════════════════ */
function BillingTab({
  user,
  transactions,
  studentId,
}: {
  user: UserData | null
  transactions: TransactionData[]
  studentId: string
}) {
  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950/30 dark:to-orange-950/30">
              <Sparkles className="size-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[18px] font-bold">Current Plan:</h3>
                <Badge variant="secondary" className="text-[13px] rounded-xl px-3 py-0.5 bg-muted font-semibold">Free</Badge>
              </div>
              <p className="text-[13px] text-muted-foreground mt-0.5">Access free courses and community features</p>
            </div>
          </div>
          <Button className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-sm gap-1.5">
            <ArrowUpRight className="size-4" />
            Upgrade to Pro
          </Button>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-5">
        <h3 className="text-[16px] font-semibold mb-4">Payment Methods</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="rounded-xl text-[13px] gap-2 h-10">
            <CardIcon className="size-4" />
            Add card
          </Button>
          <Button variant="outline" className="rounded-xl text-[13px] gap-2 h-10">
            <Wallet className="size-4" />
            Add JazzCash
          </Button>
          <Button variant="outline" className="rounded-xl text-[13px] gap-2 h-10">
            <Smartphone className="size-4" />
            Add Easypaisa
          </Button>
        </div>
      </div>

      {/* Purchase History */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-5">
        <h3 className="text-[16px] font-semibold mb-4">Purchase History</h3>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="size-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-[14px] text-muted-foreground">No purchases yet</p>
            <p className="text-[12px] text-muted-foreground/70">Your enrollment transactions will appear here</p>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-border/30 max-h-96 overflow-y-auto">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    'flex size-9 items-center justify-center rounded-xl shrink-0',
                    transaction.status === 'completed'
                      ? 'bg-emerald-100 dark:bg-emerald-950/30'
                      : 'bg-muted/50'
                  )}>
                    <Receipt className={cn(
                      'size-4',
                      transaction.status === 'completed'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-muted-foreground'
                    )} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium truncate">{transaction.course?.title || transaction.description || 'Purchase'}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {new Date(transaction.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-[14px] font-semibold">{transaction.currency} {(transaction.amount ?? 0).toLocaleString()}</p>
                    <Badge variant="secondary" className={cn(
                      'text-[10px] rounded-lg px-1.5 py-0',
                      transaction.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : transaction.status === 'refunded'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                          : 'bg-muted text-muted-foreground'
                    )}>
                      {transaction.status === 'completed' ? '✓ Paid' : transaction.status === 'refunded' ? '↩ Refunded' : transaction.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Refund Notice */}
      <div className="rounded-2xl ios-shadow-sm bg-amber-50 dark:bg-amber-950/20 p-4 border border-amber-200/50 dark:border-amber-800/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[14px] font-medium text-amber-800 dark:text-amber-200">Request refund</p>
            <p className="text-[13px] text-amber-700/80 dark:text-amber-300/70 mt-0.5">
              You can request a refund on eligible purchases within 7 days of the transaction.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
