'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import {
  Users, BookOpen, MessageSquare, DollarSign,
  CreditCard, Receipt, Megaphone, Bell, Calendar, Trophy,
  Bot, Palette, Shield, Settings, ClipboardList, Wrench,
  Construction, ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAppStore } from '@/lib/store'
import { AdminCourseManagementWrapped } from '@/components/admin/admin-course-management'
import { AdminPayoutsWrapped } from '@/components/admin/admin-payouts'
import { AdminRevenueFinanceWrapped } from '@/components/admin/admin-revenue-finance'
import { AdminNotificationsCenterWrapped } from '@/components/admin/admin-notifications-center'
import { AdminGamificationWrapped } from '@/components/admin/admin-gamification'
import { AdminAIConfigWrapped } from '@/components/admin/admin-ai-config'
import { AdminAppearanceWrapped } from '@/components/admin/admin-appearance'
import { AdminPlatformSettingsWrapped } from '@/components/admin/admin-platform-settings'
import { AdminAuditLogWrapped } from '@/components/admin/admin-audit-log'

// Lazy load the security component to reduce initial bundle size
const AdminSecurityWrapped = dynamic(
  () => import('@/components/admin/admin-security').then(mod => ({ default: mod.AdminSecurityWrapped })),
  { loading: () => <SecurityLoadingSkeleton /> }
)

function SecurityLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="size-12 rounded-2xl bg-muted animate-pulse" />
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-72 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />)}
      </div>
      <div className="h-96 rounded-2xl bg-muted animate-pulse" />
    </div>
  )
}

/* ─── Shared wrapper for placeholder views ─── */
function AdminPlaceholderView({
  icon,
  iconGradient,
  title,
  description,
}: {
  icon: React.ReactNode
  iconGradient: string
  title: string
  description: string
}) {
  const { currentUser } = useAppStore()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${iconGradient} ios-shadow-sm`}>
          {icon}
        </div>
        <div>
          <h1 className="text-[28px] font-bold text-foreground">{title}</h1>
          <p className="text-[15px] text-muted-foreground">{description}</p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="flex flex-col items-center justify-center py-20 gap-5">
        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-8 dark:from-blue-950/20 dark:to-indigo-950/20">
          <Construction className="size-14 text-blue-400/60 dark:text-blue-500/40" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-[22px] font-bold">Coming Soon</h3>
          <p className="text-[15px] text-muted-foreground max-w-md">
            This section is under active development. Check back soon for full {title.toLowerCase()} management capabilities.
          </p>
        </div>
        <Button
          variant="outline"
          className="rounded-xl gap-2"
          onClick={() => {
            const { setCurrentView } = useAppStore.getState()
            setCurrentView('admin')
          }}
        >
          Back to Dashboard
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   ADMIN PLACEHOLDER VIEWS
   ═══════════════════════════════════════════════════════════ */

export function AdminUsersView() {
  return (
    <AdminPlaceholderView
      icon={<Users className="size-6 text-white" />}
      iconGradient="from-violet-500 to-purple-600"
      title="Users"
      description="Manage students, instructors, and platform users"
    />
  )
}

export function AdminCoursesView() {
  return <AdminCourseManagementWrapped />
}

export function AdminQAReportsView() {
  return (
    <AdminPlaceholderView
      icon={<MessageSquare className="size-6 text-white" />}
      iconGradient="from-sky-500 to-blue-600"
      title="Q&A & Reports"
      description="Monitor Q&A discussions and user reports"
    />
  )
}

export function AdminRevenueView() {
  return <AdminRevenueFinanceWrapped />
}

export function AdminPayoutsView() {
  return <AdminPayoutsWrapped />
}

export function AdminRefundsView() {
  return (
    <AdminPlaceholderView
      icon={<Receipt className="size-6 text-white" />}
      iconGradient="from-orange-500 to-red-500"
      title="Refunds"
      description="Process and track refund requests"
    />
  )
}

export function AdminMarketingView() {
  return (
    <AdminPlaceholderView
      icon={<Megaphone className="size-6 text-white" />}
      iconGradient="from-rose-500 to-pink-600"
      title="Marketing"
      description="Manage campaigns, promotions, and announcements"
    />
  )
}

export function AdminNotificationsView() {
  return <AdminNotificationsCenterWrapped />
}

export function AdminLiveSessionsView() {
  return (
    <AdminPlaceholderView
      icon={<Calendar className="size-6 text-white" />}
      iconGradient="from-cyan-500 to-blue-600"
      title="Live Sessions"
      description="Schedule and manage live session events"
    />
  )
}

export function AdminGamificationView() {
  return <AdminGamificationWrapped />
}

export function AdminAIConfigView() {
  return <AdminAIConfigWrapped />
}

export function AdminAppearanceView() {
  // Redirect to settings with appearance tab
  return <AdminSettingsView initialTab="appearance" />
}

export function AdminSecurityView() {
  // Redirect to settings with security tab
  return <AdminSettingsView initialTab="security" />
}

export function AdminSettingsView({ initialTab = 'general' }: { initialTab?: string }) {
  const [activeTab, setActiveTab] = useState(initialTab)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-500/20 to-gray-500/20 ios-shadow-sm">
          <Settings className="size-6 text-slate-600 dark:text-slate-400" />
        </div>
        <div>
          <h1 className="text-[28px] font-bold text-foreground">Settings</h1>
          <p className="text-[15px] text-muted-foreground">Platform configuration, appearance, and security</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="h-11 rounded-xl bg-muted/50 p-1">
          <TabsTrigger value="general" className="rounded-lg text-[13px] font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 px-4">
            <Settings className="size-3.5" />
            General
          </TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-lg text-[13px] font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 px-4">
            <Palette className="size-3.5" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg text-[13px] font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 px-4">
            <Shield className="size-3.5" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <AdminPlatformSettingsWrapped />
        </TabsContent>
        <TabsContent value="appearance" className="mt-4">
          <AdminAppearanceWrapped />
        </TabsContent>
        <TabsContent value="security" className="mt-4">
          <AdminSecurityWrapped />
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}

export function AdminAuditLogView() {
  return <AdminAuditLogWrapped />
}

const AdminDevToolsWrapped = dynamic(
  () => import('@/components/admin/admin-dev-tools').then(mod => ({ default: mod.AdminDevToolsWrapped })),
  { loading: () => <DevToolsLoadingSkeleton /> }
)

function DevToolsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="size-12 rounded-2xl bg-muted animate-pulse" />
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-72 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-lg bg-muted animate-pulse flex-shrink-0" />
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />)}
      </div>
      <div className="h-96 rounded-2xl bg-muted animate-pulse" />
    </div>
  )
}

export function AdminDevToolsView() {
  return <AdminDevToolsWrapped />
}
