'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, AlertTriangle, Lock, Key, Eye, EyeOff, Plus, X, Save, Loader2,
  CheckCircle, XCircle, Users, UserPlus, Ban, Globe, Clock, Search, Copy,
  RefreshCw, Fingerprint, Settings, Monitor, Smartphone, Tablet,
  FingerprintIcon, Activity, Zap, Timer, Mail, Bell, Server, Download,
  ArrowUpRight, ArrowDownRight, FileText, ShieldCheck, ShieldAlert
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

// ─── Types ──────────────────────────────────────────────────────────────────

interface SecuritySettings {
  id: string
  // Auth / Password
  userPasswordMinLength: number
  userPasswordUppercase: boolean
  userPasswordLowercase: boolean
  userPasswordNumber: boolean
  userPasswordSpecial: boolean
  adminPasswordMinLength: number
  adminPasswordUppercase: boolean
  adminPasswordNumber: boolean
  adminPasswordSpecial: boolean
  passwordExpiryDays: number
  passwordPreventReuseCount: number
  // MFA
  enableMFA: boolean
  force2FAForAdmins: boolean
  enforceMFAForInstructors: boolean
  mfaMethod: string
  // Rate Limiting
  rateLimitingEnabled: boolean
  maxRequestsPerMinute: number
  loginAttemptThreshold: number
  lockDurationMinutes: number
  ipBasedRateLimiting: boolean
  apiRateLimitPerHour: number
  maxFailedLogins: number
  // Session
  sessionTimeoutMinutes: number
  maxConcurrentSessions: number
  rememberMeDuration: number
  enforceSingleSession: boolean
  idleTimeoutMinutes: number
  // IP
  ipWhitelistEnabled: boolean
  ipWhitelist: string | null
  // Alerts
  loginAlertsEnabled: boolean
  alertEmail: string | null
  alertOnSuspiciousIp: boolean
  alertOnNewDevice: boolean
  alertOnFailedLogin: boolean
  failedLoginThreshold: number
  // CORS
  corsEnabled: boolean
  corsAllowedOrigins: string | null
  // Meta
  lastSecurityScanAt: string
  updatedAt: string
}

interface SecurityRole {
  id: string
  name: string
  permissions: string
  isDefault: boolean
  description: string | null
  createdAt: string
  updatedAt: string
}

interface ApiKeyItem {
  id: string
  name: string
  keyPrefix: string
  keyLastFour: string
  permission: string
  isActive: boolean
  lastUsedAt: string | null
  createdAt: string
  revokedAt: string | null
  fullKey?: string
}

interface BlockedIp {
  id: string
  ip: string
  reason: string
  blockedBy: string | null
  expiresAt: string | null
  createdAt: string
}

interface LoginAlertItem {
  id: string
  userId: string | null
  userName: string | null
  userEmail: string | null
  userRole: string | null
  ip: string
  userAgent: string | null
  location: string | null
  eventType: string
  isSuspicious: boolean
  createdAt: string
}

interface AdminTeamMember {
  id: string
  name: string
  email: string
  role: string
  lastLoginAt: string | null
}

interface SecurityOverview {
  failedLoginsToday: number
  accountsLockedToday: number
  suspiciousIpsFlagged: number
  activeAdminSessions: number
  failedLoginThreshold: number
}

interface UserSessionItem {
  id: string
  userId: string
  userName: string
  userEmail: string
  userAvatar: string | null
  userRole: string
  deviceName: string | null
  deviceType: string
  browser: string | null
  os: string | null
  ipAddress: string | null
  location: string | null
  isActive: boolean
  lastActivity: string
  expiresAt: string
  createdAt: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return num.toLocaleString()
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ALL_PERMISSIONS = [
  { key: 'dashboard.view', label: 'View Dashboard', category: 'Dashboard' },
  { key: 'users.view', label: 'View Users', category: 'Users' },
  { key: 'users.edit', label: 'Edit Users', category: 'Users' },
  { key: 'users.delete', label: 'Delete Users', category: 'Users' },
  { key: 'courses.view', label: 'View Courses', category: 'Courses' },
  { key: 'courses.edit', label: 'Edit Courses', category: 'Courses' },
  { key: 'courses.delete', label: 'Delete Courses', category: 'Courses' },
  { key: 'content.review', label: 'Review Content', category: 'Content' },
  { key: 'content.moderate', label: 'Moderate Content', category: 'Content' },
  { key: 'finance.view', label: 'View Finance', category: 'Finance' },
  { key: 'finance.manage', label: 'Manage Finance', category: 'Finance' },
  { key: 'payouts.manage', label: 'Manage Payouts', category: 'Finance' },
  { key: 'notifications.send', label: 'Send Notifications', category: 'Notifications' },
  { key: 'notifications.manage', label: 'Manage Templates', category: 'Notifications' },
  { key: 'security.view', label: 'View Security', category: 'Security' },
  { key: 'security.manage', label: 'Manage Security', category: 'Security' },
  { key: 'settings.manage', label: 'Manage Settings', category: 'Settings' },
  { key: 'gamification.manage', label: 'Manage Gamification', category: 'Settings' },
  { key: 'api.keys', label: 'Manage API Keys', category: 'Security' },
  { key: 'roles.manage', label: 'Manage Roles', category: 'Security' },
]

const ROLE_COLOR_MAP: Record<string, string> = {
  'Super Admin': 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
  'Admin': 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  'Moderator': 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  'Support Agent': 'bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400',
  'Finance Admin': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
}

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  failed_login: { label: 'Failed Login', color: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' },
  locked_account: { label: 'Locked Account', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' },
  suspicious_ip: { label: 'Suspicious IP', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
  admin_login: { label: 'Admin Login', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' },
  successful_login: { label: 'Successful Login', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function SectionCard({ icon: Icon, iconBg, iconColor, title, description, children, className }: {
  icon: React.ComponentType<{ className?: string }>
  iconBg: string; iconColor: string; title: string; description?: string
  children: React.ReactNode; className?: string
}) {
  return (
    <Card className={cn('rounded-2xl ios-shadow-sm border-0 shadow-sm', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={cn('flex size-10 items-center justify-center rounded-xl bg-gradient-to-br', iconBg)}>
            <Icon className={cn('size-5', iconColor)} />
          </div>
          <div>
            <CardTitle className="text-[16px] font-bold">{title}</CardTitle>
            {description && <p className="text-[12px] text-muted-foreground">{description}</p>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

function SettingRow({ label, description, children }: {
  label: string; description?: string; children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border p-3.5">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold">{label}</p>
        {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function NumberField({ label, value, onChange, min, max, unit }: {
  label: string; value: number; onChange: (v: number) => void
  min?: number; max?: number; unit?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-semibold">{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          type="number" value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="rounded-xl w-24" min={min} max={max}
        />
        {unit && <span className="text-[12px] text-muted-foreground">{unit}</span>}
      </div>
    </div>
  )
}

function SaveRow({ saving, onSave }: { saving: boolean; onSave: () => void }) {
  return (
    <div className="flex justify-end pt-2">
      <Button onClick={onSave} disabled={saving} className="rounded-xl gap-2 bg-rose-600 hover:bg-rose-700 text-white">
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function AdminSecurity() {
  const [activeTab, setActiveTab] = useState('authentication')

  // ── Toast ──
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const toastTimeout = useRef<NodeJS.Timeout | null>(null)
  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    if (toastTimeout.current) clearTimeout(toastTimeout.current)
    toastTimeout.current = setTimeout(() => setToast(null), 4000)
  }, [])

  // ── Data ──
  const [settings, setSettings] = useState<SecuritySettings | null>(null)
  const [overview, setOverview] = useState<SecurityOverview | null>(null)
  const [roles, setRoles] = useState<SecurityRole[]>([])
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([])
  const [blockedIps, setBlockedIps] = useState<BlockedIp[]>([])
  const [loginAlerts, setLoginAlerts] = useState<LoginAlertItem[]>([])
  const [adminTeam, setAdminTeam] = useState<AdminTeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)

  // ── Alerts ──
  const [alertFilter, setAlertFilter] = useState('all')
  const [alertsLoading, setAlertsLoading] = useState(false)
  const [alertsPage, setAlertsPage] = useState(1)
  const [alertsTotal, setAlertsTotal] = useState(0)

  // ── Dialogs ──
  const [createRoleOpen, setCreateRoleOpen] = useState(false)
  const [editRoleOpen, setEditRoleOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<SecurityRole | null>(null)
  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissions: [] as string[] })
  const [deleteRoleOpen, setDeleteRoleOpen] = useState(false)
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null)

  const [generateKeyOpen, setGenerateKeyOpen] = useState(false)
  const [keyForm, setKeyForm] = useState({ name: '', permission: 'full_access' })
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [revokeKeyOpen, setRevokeKeyOpen] = useState(false)
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null)

  const [blockIpOpen, setBlockIpOpen] = useState(false)
  const [blockIpForm, setBlockIpForm] = useState({ ip: '', reason: '', expiresAt: '' })
  const [unblockIpOpen, setUnblockIpOpen] = useState(false)
  const [unblockingIpId, setUnblockingIpId] = useState<string | null>(null)

  // ── Sessions ──
  const [sessions, setSessions] = useState<UserSessionItem[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [terminateSessionOpen, setTerminateSessionOpen] = useState(false)
  const [terminatingSessionId, setTerminatingSessionId] = useState<string | null>(null)
  const [terminateAllUserOpen, setTerminateAllUserOpen] = useState(false)
  const [terminatingUserId, setTerminatingUserId] = useState<string | null>(null)

  // ── CORS ──
  const [corsOriginsText, setCorsOriginsText] = useState('')

  // ── Default settings (used when API returns null for new fields) ──
  const defaultSettings: SecuritySettings = {
    id: '', userPasswordMinLength: 8, userPasswordUppercase: true, userPasswordLowercase: false,
    userPasswordNumber: true, userPasswordSpecial: false, adminPasswordMinLength: 12,
    adminPasswordUppercase: true, adminPasswordNumber: true, adminPasswordSpecial: true,
    passwordExpiryDays: 90, passwordPreventReuseCount: 5,
    enableMFA: false, force2FAForAdmins: false, enforceMFAForInstructors: false, mfaMethod: 'totp',
    rateLimitingEnabled: true, maxRequestsPerMinute: 60, loginAttemptThreshold: 5,
    lockDurationMinutes: 15, ipBasedRateLimiting: true, apiRateLimitPerHour: 1000, maxFailedLogins: 5,
    sessionTimeoutMinutes: 60, maxConcurrentSessions: 3, rememberMeDuration: 30,
    enforceSingleSession: false, idleTimeoutMinutes: 30,
    ipWhitelistEnabled: false, ipWhitelist: null,
    loginAlertsEnabled: true, alertEmail: null, alertOnSuspiciousIp: true,
    alertOnNewDevice: true, alertOnFailedLogin: true, failedLoginThreshold: 500,
    corsEnabled: false, corsAllowedOrigins: null,
    lastSecurityScanAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }

  // ── Fetch ──
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/security')
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      // Merge with defaults to handle missing new fields
      const mergedSettings = { ...defaultSettings, ...json.settings }
      setSettings(mergedSettings)
      setOverview(json.overview)
      setRoles(json.roles || [])
      setApiKeys(json.apiKeys || [])
      setBlockedIps(json.blockedIps || [])
      setAdminTeam(json.adminTeam || [])
    } catch {
      showToast('error', 'Failed to load security data')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Fetch login alerts on tab switch ──
  const fetchLoginAlerts = useCallback(async (page = 1) => {
    setAlertsLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', filter: alertFilter })
      const res = await fetch(`/api/admin/security/login-alerts?${params}`)
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      setLoginAlerts(json.alerts || [])
      setAlertsTotal(json.total || 0)
      setAlertsPage(page)
    } catch {
      showToast('error', 'Failed to load login alerts')
    } finally {
      setAlertsLoading(false)
    }
  }, [alertFilter, showToast])

  useEffect(() => {
    if (activeTab === 'login-alerts') fetchLoginAlerts(1)
  }, [activeTab, alertFilter, fetchLoginAlerts])

  // ── Fetch sessions on tab switch ──
  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true)
    try {
      const res = await fetch('/api/admin/security/sessions')
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      setSessions(json.sessions || [])
    } catch {
      showToast('error', 'Failed to load sessions')
    } finally {
      setSessionsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (activeTab === 'session-management') fetchSessions()
  }, [activeTab, fetchSessions])

  // ── Settings helpers ──
  const updateSettings = useCallback(<K extends keyof SecuritySettings>(key: K, value: SecuritySettings[K]) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : prev)
  }, [])

  const handleSaveSettings = useCallback(async () => {
    if (!settings) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/security', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      setSettings(json.settings)
      showToast('success', 'Security settings saved successfully')
    } catch {
      showToast('error', 'Failed to save security settings')
    } finally {
      setSaving(false)
    }
  }, [settings, showToast])

  // ── Security scan ──
  const handleSecurityScan = useCallback(async () => {
    setScanning(true)
    try {
      const res = await fetch('/api/admin/security/seed')
      if (!res.ok) throw new Error('Failed')
      showToast('success', 'Security scan completed — data refreshed')
      fetchData()
    } catch {
      showToast('error', 'Security scan failed')
    } finally {
      setScanning(false)
    }
  }, [fetchData, showToast])

  // ── Export report ──
  const handleExportReport = useCallback(() => {
    if (!settings) return
    const report = { settings, overview, roles, apiKeys, blockedIps, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `security-report-${new Date().toISOString().split('T')[0]}.json`; a.click()
    URL.revokeObjectURL(url)
    showToast('success', 'Security report exported')
  }, [settings, overview, roles, apiKeys, blockedIps, showToast])

  // ── Role actions ──
  const togglePermission = useCallback((key: string) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key) ? prev.permissions.filter(p => p !== key) : [...prev.permissions, key]
    }))
  }, [])

  const openEditRole = useCallback((role: SecurityRole) => {
    setEditingRole(role)
    try { setRoleForm({ name: role.name, description: role.description || '', permissions: JSON.parse(role.permissions || '[]') }) }
    catch { setRoleForm({ name: role.name, description: role.description || '', permissions: [] }) }
    setEditRoleOpen(true)
  }, [])

  const handleCreateRole = useCallback(async () => {
    if (!roleForm.name.trim()) return
    try {
      const res = await fetch('/api/admin/security/roles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(roleForm) })
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      setRoles(prev => [...prev, json.role])
      setCreateRoleOpen(false)
      setRoleForm({ name: '', description: '', permissions: [] })
      showToast('success', `Role "${roleForm.name}" created`)
    } catch { showToast('error', 'Failed to create role') }
  }, [roleForm, showToast])

  const handleEditRole = useCallback(async () => {
    if (!editingRole || !roleForm.name.trim()) return
    try {
      const res = await fetch('/api/admin/security/roles', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingRole.id, ...roleForm }) })
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      setRoles(prev => prev.map(r => r.id === editingRole.id ? json.role : r))
      setEditRoleOpen(false); setEditingRole(null)
      setRoleForm({ name: '', description: '', permissions: [] })
      showToast('success', `Role "${roleForm.name}" updated`)
    } catch { showToast('error', 'Failed to update role') }
  }, [editingRole, roleForm, showToast])

  const handleDeleteRole = useCallback(async () => {
    if (!deletingRoleId) return
    try {
      const res = await fetch('/api/admin/security/roles', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: deletingRoleId }) })
      if (!res.ok) throw new Error('Failed')
      setRoles(prev => prev.filter(r => r.id !== deletingRoleId))
      setDeleteRoleOpen(false); setDeletingRoleId(null)
      showToast('success', 'Role deleted')
    } catch { showToast('error', 'Failed to delete role') }
  }, [deletingRoleId, showToast])

  // ── API Key actions ──
  const handleGenerateKey = useCallback(async () => {
    if (!keyForm.name.trim()) return
    try {
      const res = await fetch('/api/admin/security/api-keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(keyForm) })
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      setApiKeys(prev => [json.apiKey, ...prev])
      setNewlyCreatedKey(json.fullKey || null)
      setGenerateKeyOpen(false)
      setKeyForm({ name: '', permission: 'full_access' })
      showToast('success', 'API key generated — copy it now')
    } catch { showToast('error', 'Failed to generate API key') }
  }, [keyForm, showToast])

  const handleRevokeKey = useCallback(async () => {
    if (!revokingKeyId) return
    try {
      const res = await fetch('/api/admin/security/api-keys', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: revokingKeyId }) })
      if (!res.ok) throw new Error('Failed')
      setApiKeys(prev => prev.map(k => k.id === revokingKeyId ? { ...k, isActive: false, revokedAt: new Date().toISOString() } : k))
      setRevokeKeyOpen(false); setRevokingKeyId(null)
      showToast('success', 'API key revoked')
    } catch { showToast('error', 'Failed to revoke API key') }
  }, [revokingKeyId, showToast])

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
    showToast('success', 'Copied to clipboard')
  }, [showToast])

  // ── Blocked IP actions ──
  const handleBlockIp = useCallback(async () => {
    if (!blockIpForm.ip.trim()) return
    try {
      const res = await fetch('/api/admin/security/blocked-ips', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(blockIpForm) })
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      setBlockedIps(prev => [json.blockedIp, ...prev])
      setBlockIpOpen(false)
      setBlockIpForm({ ip: '', reason: '', expiresAt: '' })
      showToast('success', `IP ${blockIpForm.ip} blocked`)
    } catch { showToast('error', 'Failed to block IP') }
  }, [blockIpForm, showToast])

  const handleUnblockIp = useCallback(async () => {
    if (!unblockingIpId) return
    try {
      const res = await fetch('/api/admin/security/blocked-ips', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: unblockingIpId }) })
      if (!res.ok) throw new Error('Failed')
      setBlockedIps(prev => prev.filter(ip => ip.id !== unblockingIpId))
      setUnblockIpOpen(false); setUnblockingIpId(null)
      showToast('success', 'IP unblocked')
    } catch { showToast('error', 'Failed to unblock IP') }
  }, [unblockingIpId, showToast])

  // ── Session actions ──
  const handleTerminateSession = useCallback(async () => {
    if (!terminatingSessionId) return
    try {
      const res = await fetch('/api/admin/security/sessions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: terminatingSessionId }) })
      if (!res.ok) throw new Error('Failed')
      setSessions(prev => prev.filter(s => s.id !== terminatingSessionId))
      setTerminateSessionOpen(false); setTerminatingSessionId(null)
      showToast('success', 'Session terminated')
    } catch { showToast('error', 'Failed to terminate session') }
  }, [terminatingSessionId, showToast])

  const handleTerminateAllUserSessions = useCallback(async () => {
    if (!terminatingUserId) return
    try {
      const res = await fetch('/api/admin/security/sessions', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: terminatingUserId, terminateAll: true }) })
      if (!res.ok) throw new Error('Failed')
      setSessions(prev => prev.filter(s => s.userId !== terminatingUserId))
      setTerminateAllUserOpen(false); setTerminatingUserId(null)
      showToast('success', 'All sessions terminated for user')
    } catch { showToast('error', 'Failed to terminate sessions') }
  }, [terminatingUserId, showToast])

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
  // LOADING
  // ═══════════════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-12 rounded-2xl" />
          <div className="space-y-2"><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-72" /></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  if (!settings) return null

  // ═══════════════════════════════════════════════════════════════
  // TAB 1: AUTHENTICATION
  // ═══════════════════════════════════════════════════════════════

  const renderAuthenticationTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      {/* Password Policy - Users */}
      <SectionCard icon={Lock} iconBg="from-rose-500/20 to-red-500/20" iconColor="text-rose-600 dark:text-rose-400" title="User Password Policy" description="Configure password requirements for all users">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="Minimum Length" value={settings.userPasswordMinLength} onChange={v => updateSettings('userPasswordMinLength', v)} min={6} max={32} unit="chars" />
          <NumberField label="Password Expiry" value={settings.passwordExpiryDays} onChange={v => updateSettings('passwordExpiryDays', v)} min={0} max={365} unit="days" />
          <NumberField label="Prevent Reuse" value={settings.passwordPreventReuseCount} onChange={v => updateSettings('passwordPreventReuseCount', v)} min={0} max={24} unit="past passwords" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SettingRow label="Uppercase" description="A-Z required"><Switch checked={settings.userPasswordUppercase} onCheckedChange={v => updateSettings('userPasswordUppercase', v)} /></SettingRow>
          <SettingRow label="Lowercase" description="a-z required"><Switch checked={settings.userPasswordLowercase} onCheckedChange={v => updateSettings('userPasswordLowercase', v)} /></SettingRow>
          <SettingRow label="Numbers" description="0-9 required"><Switch checked={settings.userPasswordNumber} onCheckedChange={v => updateSettings('userPasswordNumber', v)} /></SettingRow>
          <SettingRow label="Special" description="!@#$ required"><Switch checked={settings.userPasswordSpecial} onCheckedChange={v => updateSettings('userPasswordSpecial', v)} /></SettingRow>
        </div>
      </SectionCard>

      {/* Password Policy - Admins */}
      <SectionCard icon={ShieldAlert} iconBg="from-red-500/20 to-orange-500/20" iconColor="text-red-600 dark:text-red-400" title="Admin Password Policy" description="Stricter requirements for admin accounts">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField label="Minimum Length" value={settings.adminPasswordMinLength} onChange={v => updateSettings('adminPasswordMinLength', v)} min={8} max={64} unit="chars" />
          <NumberField label="Prevent Reuse" value={settings.passwordPreventReuseCount} onChange={v => updateSettings('passwordPreventReuseCount', v)} min={0} max={24} unit="past passwords" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <SettingRow label="Uppercase"><Switch checked={settings.adminPasswordUppercase} onCheckedChange={v => updateSettings('adminPasswordUppercase', v)} /></SettingRow>
          <SettingRow label="Numbers"><Switch checked={settings.adminPasswordNumber} onCheckedChange={v => updateSettings('adminPasswordNumber', v)} /></SettingRow>
          <SettingRow label="Special"><Switch checked={settings.adminPasswordSpecial} onCheckedChange={v => updateSettings('adminPasswordSpecial', v)} /></SettingRow>
        </div>
      </SectionCard>

      {/* MFA Settings */}
      <SectionCard icon={Fingerprint} iconBg="from-violet-500/20 to-purple-500/20" iconColor="text-violet-600 dark:text-violet-400" title="Multi-Factor Authentication" description="Configure MFA settings for the platform">
        <SettingRow label="Enable MFA" description="Allow users to enable two-factor authentication">
          <Switch checked={settings.enableMFA} onCheckedChange={v => updateSettings('enableMFA', v)} />
        </SettingRow>
        <SettingRow label="Enforce for Admins" description="Require 2FA for all admin accounts">
          <Switch checked={settings.force2FAForAdmins} onCheckedChange={v => updateSettings('force2FAForAdmins', v)} />
        </SettingRow>
        <SettingRow label="Enforce for Instructors" description="Require 2FA for all instructor accounts">
          <Switch checked={settings.enforceMFAForInstructors} onCheckedChange={v => updateSettings('enforceMFAForInstructors', v)} />
        </SettingRow>
        <div className="space-y-1.5">
          <Label className="text-[13px] font-semibold">Default MFA Method</Label>
          <Select value={settings.mfaMethod} onValueChange={v => updateSettings('mfaMethod', v)}>
            <SelectTrigger className="rounded-xl w-full max-w-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="totp">Authenticator App (TOTP)</SelectItem>
              <SelectItem value="sms">SMS Verification</SelectItem>
              <SelectItem value="email">Email Verification</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SectionCard>

      <SaveRow saving={saving} onSave={handleSaveSettings} />
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // TAB 2: RATE LIMITING
  // ═══════════════════════════════════════════════════════════════

  const renderRateLimitingTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <SectionCard icon={Zap} iconBg="from-amber-500/20 to-orange-500/20" iconColor="text-amber-600 dark:text-amber-400" title="Rate Limiting Configuration" description="Control request rates and brute-force protection">
        <SettingRow label="Enable Rate Limiting" description="Limit the number of requests per time window">
          <Switch checked={settings.rateLimitingEnabled} onCheckedChange={v => updateSettings('rateLimitingEnabled', v)} />
        </SettingRow>
        <SettingRow label="IP-Based Rate Limiting" description="Apply limits per IP address instead of per user">
          <Switch checked={settings.ipBasedRateLimiting} onCheckedChange={v => updateSettings('ipBasedRateLimiting', v)} />
        </SettingRow>
        <Separator />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumberField label="Max Requests / Minute" value={settings.maxRequestsPerMinute} onChange={v => updateSettings('maxRequestsPerMinute', v)} min={10} max={10000} unit="req/min" />
          <NumberField label="Login Attempt Threshold" value={settings.loginAttemptThreshold} onChange={v => updateSettings('loginAttemptThreshold', v)} min={1} max={50} unit="attempts" />
          <NumberField label="Lockout Duration" value={settings.lockDurationMinutes} onChange={v => updateSettings('lockDurationMinutes', v)} min={1} max={1440} unit="minutes" />
          <NumberField label="Max Failed Logins" value={settings.maxFailedLogins} onChange={v => updateSettings('maxFailedLogins', v)} min={1} max={50} unit="attempts" />
          <NumberField label="API Rate Limit / Hour" value={settings.apiRateLimitPerHour} onChange={v => updateSettings('apiRateLimitPerHour', v)} min={100} max={100000} unit="req/hr" />
        </div>
      </SectionCard>

      {/* Quick summary card */}
      <Card className="rounded-2xl ios-shadow-sm border-0 shadow-sm bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950/40">
            <Activity className="size-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-amber-800 dark:text-amber-300">
              {settings.rateLimitingEnabled ? 'Rate limiting is active' : 'Rate limiting is disabled'}
            </p>
            <p className="text-[12px] text-amber-600/70 dark:text-amber-400/70">
              {settings.rateLimitingEnabled
                ? `${settings.maxRequestsPerMinute} req/min · ${settings.apiRateLimitPerHour} API req/hr · ${settings.lockDurationMinutes}min lockout`
                : 'Enable rate limiting to protect against brute force attacks'}
            </p>
          </div>
        </CardContent>
      </Card>

      <SaveRow saving={saving} onSave={handleSaveSettings} />
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // TAB 3: SESSION MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  const renderSessionManagementTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <SectionCard icon={Timer} iconBg="from-teal-500/20 to-cyan-500/20" iconColor="text-teal-600 dark:text-teal-400" title="Session Configuration" description="Configure session timeout and concurrency policies">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NumberField label="Session Timeout" value={settings.sessionTimeoutMinutes} onChange={v => updateSettings('sessionTimeoutMinutes', v)} min={5} max={1440} unit="minutes" />
          <NumberField label="Max Concurrent Sessions" value={settings.maxConcurrentSessions} onChange={v => updateSettings('maxConcurrentSessions', v)} min={1} max={20} unit="per user" />
          <NumberField label="Remember Me Duration" value={settings.rememberMeDuration} onChange={v => updateSettings('rememberMeDuration', v)} min={1} max={365} unit="days" />
          <NumberField label="Idle Timeout" value={settings.idleTimeoutMinutes} onChange={v => updateSettings('idleTimeoutMinutes', v)} min={5} max={1440} unit="minutes" />
        </div>
        <SettingRow label="Enforce Single Session" description="Only allow one active session per user at a time">
          <Switch checked={settings.enforceSingleSession} onCheckedChange={v => updateSettings('enforceSingleSession', v)} />
        </SettingRow>
      </SectionCard>

      {/* Active Sessions Table */}
      <SectionCard icon={Monitor} iconBg="from-blue-500/20 to-indigo-500/20" iconColor="text-blue-600 dark:text-blue-400" title="Active Sessions" description={`${sessions.length} active session${sessions.length !== 1 ? 's' : ''}`}>
        <div className="flex justify-end mb-2">
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-8 text-[12px]" onClick={fetchSessions} disabled={sessionsLoading}>
            {sessionsLoading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />} Refresh
          </Button>
        </div>
        {sessionsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3"><Skeleton className="size-9 rounded-xl" /><div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-40 rounded-lg" /><Skeleton className="h-3 w-56 rounded-lg" /></div></div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Monitor className="size-8 text-muted-foreground/30" />
            <p className="text-[13px] text-muted-foreground">No active sessions</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[12px]">User</TableHead>
                  <TableHead className="text-[12px]">Device</TableHead>
                  <TableHead className="text-[12px]">IP / Location</TableHead>
                  <TableHead className="text-[12px]">Last Activity</TableHead>
                  <TableHead className="text-[12px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium truncate">{s.userName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{s.userEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {s.deviceType === 'mobile' ? <Smartphone className="size-3.5 text-muted-foreground" /> : s.deviceType === 'tablet' ? <Tablet className="size-3.5 text-muted-foreground" /> : <Monitor className="size-3.5 text-muted-foreground" />}
                        <span className="text-[12px]">{s.browser || s.deviceType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-[12px] font-mono">{s.ipAddress || '—'}</p>
                      <p className="text-[11px] text-muted-foreground">{s.location || '—'}</p>
                    </TableCell>
                    <TableCell className="text-[12px] text-muted-foreground">{timeAgo(s.lastActivity)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="rounded-lg h-7 text-[11px] gap-1 text-red-500 hover:text-red-600" onClick={() => { setTerminatingSessionId(s.id); setTerminateSessionOpen(true) }}>
                        <X className="size-3" /> Terminate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </SectionCard>

      <SaveRow saving={saving} onSave={handleSaveSettings} />
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // TAB 4: IP MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  const renderIpManagementTab = () => {
    let whitelistIps: string[] = []
    try { whitelistIps = settings.ipWhitelist ? JSON.parse(settings.ipWhitelist) : [] } catch {}

    return (
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
        {/* IP Whitelist */}
        <SectionCard icon={ShieldCheck} iconBg="from-emerald-500/20 to-teal-500/20" iconColor="text-emerald-600 dark:text-emerald-400" title="IP Whitelist" description="Only allow access from these IP addresses">
          <SettingRow label="Enable IP Whitelist" description="Restrict admin access to whitelisted IPs only">
            <Switch checked={settings.ipWhitelistEnabled} onCheckedChange={v => updateSettings('ipWhitelistEnabled', v)} />
          </SettingRow>
          <div className="space-y-1.5">
            <Label className="text-[13px] font-semibold">Whitelisted IPs</Label>
            <Textarea
              className="rounded-xl font-mono text-[12px] min-h-[100px]"
              placeholder={"192.168.1.0/24\n10.0.0.1\n172.16.0.0/16"}
              value={corsOriginsText || whitelistIps.join('\n')}
              onChange={e => {
                setCorsOriginsText(e.target.value)
                const ips = e.target.value.split('\n').map(i => i.trim()).filter(Boolean)
                updateSettings('ipWhitelist', JSON.stringify(ips))
              }}
            />
            <p className="text-[11px] text-muted-foreground">One IP per line. Supports CIDR notation (e.g., 192.168.1.0/24)</p>
          </div>
        </SectionCard>

        {/* Blocked IPs */}
        <SectionCard icon={Ban} iconBg="from-red-500/20 to-rose-500/20" iconColor="text-red-600 dark:text-red-400" title="Blocked IPs" description={`${blockedIps.length} blocked IP address${blockedIps.length !== 1 ? 'es' : ''}`}>
          <div className="flex justify-end mb-2">
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-8 text-[12px]" onClick={() => { setBlockIpForm({ ip: '', reason: '', expiresAt: '' }); setBlockIpOpen(true) }}>
              <Plus className="size-3" /> Block IP
            </Button>
          </div>
          {blockedIps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Globe className="size-8 text-muted-foreground/30" />
              <p className="text-[13px] text-muted-foreground">No blocked IPs</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[12px]">IP Address</TableHead>
                    <TableHead className="text-[12px]">Reason</TableHead>
                    <TableHead className="text-[12px]">Date</TableHead>
                    <TableHead className="text-[12px]">Expires</TableHead>
                    <TableHead className="text-[12px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blockedIps.map(b => (
                    <TableRow key={b.id}>
                      <TableCell className="text-[13px] font-mono">{b.ip}</TableCell>
                      <TableCell className="text-[12px] max-w-[200px] truncate">{b.reason}</TableCell>
                      <TableCell className="text-[12px] text-muted-foreground">{formatDateTime(b.createdAt)}</TableCell>
                      <TableCell className="text-[12px] text-muted-foreground">{b.expiresAt ? formatDateTime(b.expiresAt) : 'Permanent'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" className="rounded-lg h-7 text-[11px] gap-1" onClick={() => { setUnblockingIpId(b.id); setUnblockIpOpen(true) }}>
                          <CheckCircle className="size-3" /> Unblock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </SectionCard>

        <SaveRow saving={saving} onSave={handleSaveSettings} />
      </motion.div>
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // TAB 5: API KEYS
  // ═══════════════════════════════════════════════════════════════

  const renderApiKeysTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <SectionCard icon={Key} iconBg="from-emerald-500/20 to-green-500/20" iconColor="text-emerald-600 dark:text-emerald-400" title="API Keys" description={`${apiKeys.filter(k => k.isActive).length} active · ${apiKeys.filter(k => !k.isActive).length} revoked`}>
        <div className="flex justify-end mb-2">
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-8 text-[12px]" onClick={() => { setKeyForm({ name: '', permission: 'full_access' }); setNewlyCreatedKey(null); setGenerateKeyOpen(true) }}>
            <Plus className="size-3" /> Create API Key
          </Button>
        </div>

        {/* Newly created key banner */}
        <AnimatePresence>
          {newlyCreatedKey && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
              <div className="rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-[14px] font-semibold text-emerald-800 dark:text-emerald-300">API Key Generated</p>
                </div>
                <p className="text-[12px] text-emerald-600/70 dark:text-emerald-400/70">Copy this key now — it won&apos;t be shown again.</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 px-3 py-2 text-[13px] font-mono break-all select-all">{newlyCreatedKey}</code>
                  <Button variant="outline" size="icon" className="size-8 rounded-lg shrink-0" onClick={() => copyToClipboard(newlyCreatedKey)}><Copy className="size-3.5" /></Button>
                </div>
                <Button variant="ghost" size="sm" className="rounded-lg h-7 text-[12px]" onClick={() => setNewlyCreatedKey(null)}>Dismiss</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {apiKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Key className="size-8 text-muted-foreground/30" />
            <p className="text-[13px] text-muted-foreground">No API keys yet</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[12px]">Name</TableHead>
                  <TableHead className="text-[12px]">Key</TableHead>
                  <TableHead className="text-[12px]">Permissions</TableHead>
                  <TableHead className="text-[12px]">Status</TableHead>
                  <TableHead className="text-[12px]">Last Used</TableHead>
                  <TableHead className="text-[12px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map(k => (
                  <TableRow key={k.id} className={cn(!k.isActive && 'opacity-50')}>
                    <TableCell className="text-[13px] font-medium">{k.name}</TableCell>
                    <TableCell><code className="text-[12px] font-mono text-muted-foreground">{k.keyPrefix}{'•'.repeat(12)}{k.keyLastFour}</code></TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn('text-[10px] rounded-lg', k.permission === 'full_access' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400')}>
                        {k.permission === 'full_access' ? 'Full Access' : 'Read Only'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {k.isActive ? (
                        <Badge variant="secondary" className="text-[10px] rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] rounded-lg bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">Revoked</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-[12px] text-muted-foreground">{k.lastUsedAt ? timeAgo(k.lastUsedAt) : 'Never'}</TableCell>
                    <TableCell className="text-right">
                      {k.isActive && (
                        <Button variant="ghost" size="sm" className="rounded-lg h-7 text-[11px] gap-1 text-red-500 hover:text-red-600" onClick={() => { setRevokingKeyId(k.id); setRevokeKeyOpen(true) }}>
                          <XCircle className="size-3" /> Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </SectionCard>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // TAB 6: ROLES & PERMISSIONS
  // ═══════════════════════════════════════════════════════════════

  const renderRolesTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      <SectionCard icon={Fingerprint} iconBg="from-purple-500/20 to-violet-500/20" iconColor="text-purple-600 dark:text-purple-400" title="Roles & Permissions" description={`${roles.length} role${roles.length !== 1 ? 's' : ''} defined`}>
        <div className="flex justify-end mb-2">
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-8 text-[12px]" onClick={() => { setRoleForm({ name: '', description: '', permissions: [] }); setCreateRoleOpen(true) }}>
            <Plus className="size-3" /> Create Role
          </Button>
        </div>
        <ScrollArea className="max-h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[12px]">Role Name</TableHead>
                <TableHead className="text-[12px]">Description</TableHead>
                <TableHead className="text-[12px]">Permissions</TableHead>
                <TableHead className="text-[12px]">Default</TableHead>
                <TableHead className="text-[12px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map(role => {
                const roleColor = ROLE_COLOR_MAP[role.name] || 'bg-slate-100 text-slate-700 dark:bg-slate-950/40 dark:text-slate-400'
                let perms: string[] = []
                try { perms = JSON.parse(role.permissions || '[]') } catch {}
                return (
                  <TableRow key={role.id}>
                    <TableCell>
                      <Badge variant="secondary" className={cn('text-[12px] rounded-lg font-semibold', roleColor)}>{role.name}</Badge>
                    </TableCell>
                    <TableCell className="text-[12px] text-muted-foreground max-w-[200px] truncate">{role.description || '—'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[300px]">
                        {perms.slice(0, 3).map(p => {
                          const perm = ALL_PERMISSIONS.find(ap => ap.key === p)
                          return <Badge key={p} variant="outline" className="text-[10px] rounded-md px-1.5 py-0">{perm?.label || p}</Badge>
                        })}
                        {perms.length > 3 && <Badge variant="outline" className="text-[10px] rounded-md px-1.5 py-0">+{perms.length - 3} more</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {role.isDefault && <Badge variant="secondary" className="text-[10px] rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">Default</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="sm" className="rounded-lg h-7 text-[12px] gap-1" onClick={() => openEditRole(role)}><Settings className="size-3" /> Edit</Button>
                        {!role.isDefault && (
                          <Button variant="ghost" size="sm" className="rounded-lg h-7 text-[12px] gap-1 text-red-500 hover:text-red-600" onClick={() => { setDeletingRoleId(role.id); setDeleteRoleOpen(true) }}><X className="size-3" /> Delete</Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </SectionCard>

      {/* Admin Team */}
      <SectionCard icon={Users} iconBg="from-teal-500/20 to-cyan-500/20" iconColor="text-teal-600 dark:text-teal-400" title="Admin Team" description={`${adminTeam.length} admin member${adminTeam.length !== 1 ? 's' : ''}`}>
        {adminTeam.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Users className="size-8 text-muted-foreground/30" />
            <p className="text-[13px] text-muted-foreground">No admin team members</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[12px]">Name</TableHead>
                  <TableHead className="text-[12px]">Role</TableHead>
                  <TableHead className="text-[12px]">Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminTeam.map(m => {
                  const roleColor = ROLE_COLOR_MAP[m.role] || 'bg-slate-100 text-slate-700 dark:bg-slate-950/40 dark:text-slate-400'
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="min-w-0"><p className="text-[13px] font-medium">{m.name}</p><p className="text-[11px] text-muted-foreground">{m.email}</p></div>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className={cn('text-[11px] rounded-lg', roleColor)}>{m.role}</Badge></TableCell>
                      <TableCell className="text-[12px] text-muted-foreground">{timeAgo(m.lastLoginAt)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </SectionCard>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // TAB 7: LOGIN ALERTS
  // ═══════════════════════════════════════════════════════════════

  const renderLoginAlertsTab = () => (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="space-y-4">
      {/* Alert Configuration */}
      <SectionCard icon={Bell} iconBg="from-rose-500/20 to-red-500/20" iconColor="text-rose-600 dark:text-rose-400" title="Alert Configuration" description="Configure when and how to receive security alerts">
        <SettingRow label="Enable Login Alerts" description="Send notifications for security events">
          <Switch checked={settings.loginAlertsEnabled} onCheckedChange={v => updateSettings('loginAlertsEnabled', v)} />
        </SettingRow>
        <div className="space-y-1.5">
          <Label className="text-[13px] font-semibold">Alert Email</Label>
          <Input
            className="rounded-xl max-w-md"
            placeholder="security@yourplatform.com"
            value={settings.alertEmail || ''}
            onChange={e => updateSettings('alertEmail', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SettingRow label="Suspicious IP" description="Alert when suspicious IP detected">
            <Switch checked={settings.alertOnSuspiciousIp} onCheckedChange={v => updateSettings('alertOnSuspiciousIp', v)} />
          </SettingRow>
          <SettingRow label="New Device" description="Alert on login from new device">
            <Switch checked={settings.alertOnNewDevice} onCheckedChange={v => updateSettings('alertOnNewDevice', v)} />
          </SettingRow>
          <SettingRow label="Failed Login" description="Alert on failed login attempts">
            <Switch checked={settings.alertOnFailedLogin} onCheckedChange={v => updateSettings('alertOnFailedLogin', v)} />
          </SettingRow>
        </div>
      </SectionCard>

      <SaveRow saving={saving} onSave={handleSaveSettings} />

      {/* Recent Alerts */}
      <SectionCard icon={AlertTriangle} iconBg="from-red-500/20 to-orange-500/20" iconColor="text-red-600 dark:text-red-400" title="Recent Alerts" description={`${alertsTotal} alert${alertsTotal !== 1 ? 's' : ''} found`}>
        {/* Filter buttons */}
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            { key: 'all', label: 'All' }, { key: 'failed_login', label: 'Failed Login' },
            { key: 'locked_account', label: 'Locked' }, { key: 'suspicious_ip', label: 'Suspicious IP' },
            { key: 'admin_login', label: 'Admin Login' },
          ].map(f => (
            <button key={f.key} onClick={() => setAlertFilter(f.key)} className={cn(
              'rounded-xl px-3.5 py-1.5 text-[13px] font-medium transition-all border',
              alertFilter === f.key ? 'bg-foreground text-background border-foreground' : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-foreground/20'
            )}>{f.label}</button>
          ))}
        </div>

        {alertsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3"><Skeleton className="size-9 rounded-xl" /><div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-40 rounded-lg" /><Skeleton className="h-3 w-56 rounded-lg" /></div></div>
            ))}
          </div>
        ) : loginAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Shield className="size-8 text-muted-foreground/30" />
            <p className="text-[13px] text-muted-foreground">No alerts found</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[12px]">User</TableHead>
                  <TableHead className="text-[12px]">IP Address</TableHead>
                  <TableHead className="text-[12px]">Event</TableHead>
                  <TableHead className="text-[12px]">Location</TableHead>
                  <TableHead className="text-[12px]">Time</TableHead>
                  <TableHead className="text-[12px]">Suspicious</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loginAlerts.map(alert => {
                  const evtConfig = EVENT_TYPE_CONFIG[alert.eventType] || EVENT_TYPE_CONFIG.failed_login
                  return (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <div className="min-w-0"><p className="text-[13px] font-medium truncate">{alert.userName || 'Unknown'}</p><p className="text-[11px] text-muted-foreground truncate">{alert.userEmail || '—'}</p></div>
                      </TableCell>
                      <TableCell className="text-[13px] font-mono">{alert.ip}</TableCell>
                      <TableCell><Badge variant="secondary" className={cn('text-[11px] rounded-lg', evtConfig.color)}>{evtConfig.label}</Badge></TableCell>
                      <TableCell className="text-[12px] text-muted-foreground">{alert.location || '—'}</TableCell>
                      <TableCell className="text-[12px] text-muted-foreground">{timeAgo(alert.createdAt)}</TableCell>
                      <TableCell>
                        {alert.isSuspicious ? (
                          <Badge variant="secondary" className="text-[11px] rounded-lg bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"><AlertTriangle className="size-3 mr-1" /> Yes</Badge>
                        ) : <span className="text-[12px] text-muted-foreground">No</span>}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
        {loginAlerts.length > 0 && alertsTotal > 20 && (
          <div className="flex justify-center mt-3">
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => fetchLoginAlerts(alertsPage + 1)} disabled={alertsLoading}>
              {alertsLoading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />} Load more
            </Button>
          </div>
        )}
      </SectionCard>
    </motion.div>
  )

  // ═══════════════════════════════════════════════════════════════
  // DIALOGS
  // ═══════════════════════════════════════════════════════════════

  const renderRoleDialog = (isOpen: boolean, setIsOpen: (v: boolean) => void, onSubmit: () => void, title: string) => (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="rounded-2xl max-w-lg max-h-[80vh]">
        <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>Set the role name, description, and permissions.</DialogDescription></DialogHeader>
        <ScrollArea className="max-h-[50vh] pr-2">
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Role Name</Label><Input className="rounded-xl" value={roleForm.name} onChange={e => setRoleForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Content Manager" /></div>
            <div className="space-y-1.5"><Label>Description</Label><Input className="rounded-xl" value={roleForm.description} onChange={e => setRoleForm(p => ({ ...p, description: e.target.value }))} placeholder="What this role can do" /></div>
            <Separator />
            <Label className="text-[13px] font-semibold">Permissions</Label>
            {(() => {
              const categories = [...new Set(ALL_PERMISSIONS.map(p => p.category))]
              return categories.map(cat => (
                <div key={cat} className="space-y-2">
                  <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">{cat}</p>
                  {ALL_PERMISSIONS.filter(p => p.category === cat).map(perm => (
                    <label key={perm.key} className="flex items-center gap-2.5 rounded-lg border px-3 py-2 cursor-pointer hover:bg-muted/50">
                      <Checkbox checked={roleForm.permissions.includes(perm.key)} onCheckedChange={() => togglePermission(perm.key)} />
                      <span className="text-[13px]">{perm.label}</span>
                    </label>
                  ))}
                </div>
              ))
            })()}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" className="rounded-xl" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white" onClick={onSubmit}>{roleForm.name ? `Save "${roleForm.name}"` : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )

  const renderDialogs = () => (
    <>
      {renderRoleDialog(createRoleOpen, setCreateRoleOpen, handleCreateRole, 'Create New Role')}
      {renderRoleDialog(editRoleOpen, setEditRoleOpen, handleEditRole, 'Edit Role')}

      {/* Delete Role */}
      <Dialog open={deleteRoleOpen} onOpenChange={setDeleteRoleOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Delete Role</DialogTitle><DialogDescription>Are you sure you want to delete this role? This action cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleteRoleOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-red-600 hover:bg-red-700 text-white" onClick={handleDeleteRole}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate API Key */}
      <Dialog open={generateKeyOpen} onOpenChange={setGenerateKeyOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Create API Key</DialogTitle><DialogDescription>Generate a new API key for external integrations.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Key Name</Label><Input className="rounded-xl" value={keyForm.name} onChange={e => setKeyForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Production API" /></div>
            <div className="space-y-1.5">
              <Label>Permission Level</Label>
              <Select value={keyForm.permission} onValueChange={v => setKeyForm(p => ({ ...p, permission: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_access">Full Access</SelectItem>
                  <SelectItem value="read_only">Read Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setGenerateKeyOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white" onClick={handleGenerateKey}>Generate Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Key */}
      <Dialog open={revokeKeyOpen} onOpenChange={setRevokeKeyOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Revoke API Key</DialogTitle><DialogDescription>Are you sure? Any application using this key will lose access immediately.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setRevokeKeyOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-red-600 hover:bg-red-700 text-white" onClick={handleRevokeKey}>Revoke Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block IP */}
      <Dialog open={blockIpOpen} onOpenChange={setBlockIpOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Block IP Address</DialogTitle><DialogDescription>Block an IP address from accessing the platform.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>IP Address</Label><Input className="rounded-xl font-mono" value={blockIpForm.ip} onChange={e => setBlockIpForm(p => ({ ...p, ip: e.target.value }))} placeholder="e.g. 192.168.1.100" /></div>
            <div className="space-y-1.5"><Label>Reason</Label><Input className="rounded-xl" value={blockIpForm.reason} onChange={e => setBlockIpForm(p => ({ ...p, reason: e.target.value }))} placeholder="e.g. Brute force attack" /></div>
            <div className="space-y-1.5"><Label>Expires At (optional)</Label><Input type="datetime-local" className="rounded-xl" value={blockIpForm.expiresAt} onChange={e => setBlockIpForm(p => ({ ...p, expiresAt: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setBlockIpOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-red-600 hover:bg-red-700 text-white" onClick={handleBlockIp}>Block IP</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unblock IP */}
      <Dialog open={unblockIpOpen} onOpenChange={setUnblockIpOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Unblock IP</DialogTitle><DialogDescription>This IP will regain access to the platform. Are you sure?</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setUnblockIpOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleUnblockIp}>Unblock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terminate Session */}
      <Dialog open={terminateSessionOpen} onOpenChange={setTerminateSessionOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Terminate Session</DialogTitle><DialogDescription>This will immediately end the user&apos;s session. They will need to log in again.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setTerminateSessionOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-red-600 hover:bg-red-700 text-white" onClick={handleTerminateSession}>Terminate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terminate All User Sessions */}
      <Dialog open={terminateAllUserOpen} onOpenChange={setTerminateAllUserOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader><DialogTitle>Terminate All Sessions</DialogTitle><DialogDescription>This will end all active sessions for this user. They will need to log in again on all devices.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setTerminateAllUserOpen(false)}>Cancel</Button>
            <Button className="rounded-xl bg-red-600 hover:bg-red-700 text-white" onClick={handleTerminateAllUserSessions}>Terminate All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )

  // ═══════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {renderToast()}

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={springTransition} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-red-500/20">
            <Shield className="size-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight">Security Center</h1>
            <p className="text-[14px] text-muted-foreground">Manage authentication, access controls, and security policies</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-9 text-[13px]" onClick={handleExportReport}>
            <Download className="size-3.5" /> Export Report
          </Button>
          <Button size="sm" className="rounded-xl gap-1.5 h-9 text-[13px] bg-rose-600 hover:bg-rose-700 text-white" onClick={handleSecurityScan} disabled={scanning}>
            {scanning ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />} Run Security Scan
          </Button>
        </div>
      </motion.div>

      {/* ── Overview Stats ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springTransition, delay: 0.05 }}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Failed Logins Today', value: overview?.failedLoginsToday ?? 0, sub: `Threshold: ${settings.failedLoginThreshold}`, icon: AlertTriangle, gradient: 'from-red-500/20 to-orange-500/20', iconColor: 'text-red-600 dark:text-red-400', trend: overview?.failedLoginsToday ?? 0 > (settings.failedLoginThreshold * 0.8) ? 'up' as const : 'neutral' as const },
            { label: 'Accounts Locked', value: overview?.accountsLockedToday ?? 0, sub: 'Auto-locked today', icon: Lock, gradient: 'from-orange-500/20 to-amber-500/20', iconColor: 'text-orange-600 dark:text-orange-400', trend: 'neutral' as const },
            { label: 'Suspicious IPs', value: overview?.suspiciousIpsFlagged ?? 0, sub: 'Flagged for review', icon: Globe, gradient: 'from-amber-500/20 to-yellow-500/20', iconColor: 'text-amber-600 dark:text-amber-400', trend: (overview?.suspiciousIpsFlagged ?? 0) > 0 ? 'up' as const : 'neutral' as const },
            { label: 'Active Admin Sessions', value: overview?.activeAdminSessions ?? 0, sub: 'Currently online', icon: Users, gradient: 'from-teal-500/20 to-emerald-500/20', iconColor: 'text-teal-600 dark:text-teal-400', trend: 'neutral' as const },
          ].map(card => {
            const IconComp = card.icon
            return (
              <Card key={card.label} className="rounded-2xl ios-shadow-sm border-0 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className={cn('flex size-10 items-center justify-center rounded-xl bg-gradient-to-br', card.gradient)}>
                      <IconComp className={cn('size-5', card.iconColor)} />
                    </div>
                    {card.trend === 'up' ? (
                      <ArrowUpRight className="size-4 text-red-500" />
                    ) : (
                      <Badge variant="secondary" className="rounded-lg text-[11px] font-bold bg-muted text-muted-foreground">
                        {formatNumber(card.value)}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-[20px] font-bold">{formatNumber(card.value)}</p>
                    <p className="text-[12px] text-muted-foreground">{card.sub}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </motion.div>

      {/* ── Status Banner ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springTransition, delay: 0.1 }}>
        <Card className={cn(
          'rounded-2xl ios-shadow-sm border-0 shadow-sm',
          (overview?.failedLoginsToday ?? 0) > (settings.failedLoginThreshold * 0.8)
            ? 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20'
            : 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20'
        )}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn(
              'flex size-10 items-center justify-center rounded-xl',
              (overview?.failedLoginsToday ?? 0) > (settings.failedLoginThreshold * 0.8)
                ? 'bg-red-100 dark:bg-red-950/40'
                : 'bg-emerald-100 dark:bg-emerald-950/40'
            )}>
              {(overview?.failedLoginsToday ?? 0) > (settings.failedLoginThreshold * 0.8)
                ? <ShieldAlert className="size-5 text-red-600 dark:text-red-400" />
                : <CheckCircle className="size-5 text-emerald-600 dark:text-emerald-400" />
              }
            </div>
            <div className="flex-1">
              <p className={cn(
                'text-[14px] font-semibold',
                (overview?.failedLoginsToday ?? 0) > (settings.failedLoginThreshold * 0.8)
                  ? 'text-red-800 dark:text-red-300'
                  : 'text-emerald-800 dark:text-emerald-300'
              )}>
                {(overview?.failedLoginsToday ?? 0) > (settings.failedLoginThreshold * 0.8)
                  ? 'Elevated threat level detected'
                  : 'All systems secure'
                }
              </p>
              <p className={cn(
                'text-[12px]',
                (overview?.failedLoginsToday ?? 0) > (settings.failedLoginThreshold * 0.8)
                  ? 'text-red-600/70 dark:text-red-400/70'
                  : 'text-emerald-600/70 dark:text-emerald-400/70'
              )}>
                Last security scan: {timeAgo(settings.lastSecurityScanAt)}
              </p>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-8 text-[12px]" onClick={fetchData}>
              <RefreshCw className="size-3" /> Refresh
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 rounded-2xl p-1.5">
          {[
            { value: 'authentication', label: 'Authentication', icon: Lock },
            { value: 'rate-limiting', label: 'Rate Limiting', icon: Zap },
            { value: 'session-management', label: 'Sessions', icon: Timer },
            { value: 'ip-management', label: 'IP Management', icon: Globe },
            { value: 'api-keys', label: 'API Keys', icon: Key },
            { value: 'roles', label: 'Roles & Permissions', icon: Fingerprint },
            { value: 'login-alerts', label: 'Login Alerts', icon: Bell },
          ].map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="rounded-xl gap-1.5 text-[12px] data-[state=active]:bg-rose-600 data-[state=active]:text-white px-3 py-1.5">
              <tab.icon className="size-3.5" /> {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="authentication">{renderAuthenticationTab()}</TabsContent>
        <TabsContent value="rate-limiting">{renderRateLimitingTab()}</TabsContent>
        <TabsContent value="session-management">{renderSessionManagementTab()}</TabsContent>
        <TabsContent value="ip-management">{renderIpManagementTab()}</TabsContent>
        <TabsContent value="api-keys">{renderApiKeysTab()}</TabsContent>
        <TabsContent value="roles">{renderRolesTab()}</TabsContent>
        <TabsContent value="login-alerts">{renderLoginAlertsTab()}</TabsContent>
      </Tabs>

      {renderDialogs()}
    </div>
  )
}

export function AdminSecurityWrapped() {
  return <AdminSecurity />
}
