'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import {
  Settings,
  User,
  Globe,
  Bell,
  Palette,
  Info,
  Shield,
  GraduationCap,
  Languages,
  Check,
  Sun,
  Moon,
  Monitor,
  ChevronRight,
  BookOpen,
  Zap,
  Flame,
  Coins,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ShijlAIBrand, ShijlAIText } from '@/components/ui/brand-text'
import { ShijlAILogo } from '@/components/ui/shijlai-logo'

// iOS Settings-style row component
function SettingsRow({
  icon,
  iconColor,
  label,
  value,
  chevron = true,
  children,
}: {
  icon: React.ReactNode
  iconColor: string
  label: string
  value?: string
  chevron?: boolean
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div className={`flex size-8 items-center justify-center rounded-lg ${iconColor}`}>
        {icon}
      </div>
      <span className="flex-1 text-[17px]">{label}</span>
      {value && <span className="text-[17px] text-muted-foreground">{value}</span>}
      {children}
      {chevron && !children && <ChevronRight className="size-4 text-muted-foreground/60" />}
    </div>
  )
}

export function SettingsView() {
  const { currentUser, language, setLanguage } = useAppStore()
  const { theme, setTheme } = useTheme()

  const [notifications, setNotifications] = useState({
    courseUpdates: true,
    quizReminders: true,
    achievementAlerts: true,
    emailDigest: false,
    weeklyProgress: true,
    newCourseAnnouncements: true,
  })

  if (!currentUser) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-[34px] font-bold">Settings</h2>
        <p className="text-[15px] text-muted-foreground">Manage your profile and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="rounded-2xl ios-shadow-sm bg-card p-4">
        <div className="flex items-center gap-4 py-2">
          <Avatar className="size-16 ring-2 ring-primary/20 rounded-2xl">
            <AvatarImage src={currentUser.avatar || undefined} alt={currentUser.name} />
            <AvatarFallback className="text-lg bg-primary/10 text-primary font-semibold rounded-2xl">
              {currentUser.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-[22px] font-semibold truncate">{currentUser.name}</h3>
            <p className="text-[15px] text-muted-foreground truncate">{currentUser.email}</p>
            <Badge variant="secondary" className="mt-1 text-[11px] capitalize rounded-xl">{currentUser.role}</Badge>
          </div>
          <ChevronRight className="size-5 text-muted-foreground/60 shrink-0" />
        </div>
      </div>

      {/* Gamification Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Level', value: currentUser.level, icon: <GraduationCap className="size-4 text-emerald-600" />, bg: 'bg-emerald-100 dark:bg-emerald-950/40' },
          { label: 'XP', value: currentUser.xp.toLocaleString(), icon: <Zap className="size-4 text-amber-600" />, bg: 'bg-amber-100 dark:bg-amber-950/40' },
          { label: 'Streak', value: `${currentUser.streak}d`, icon: <Flame className="size-4 text-orange-600" />, bg: 'bg-orange-100 dark:bg-orange-950/40' },
          { label: 'Coins', value: currentUser.shijlCoins, icon: <Coins className="size-4 text-yellow-600" />, bg: 'bg-yellow-100 dark:bg-yellow-950/40' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl ios-shadow-sm bg-card p-3 text-center">
            <div className={`mx-auto mb-1.5 flex size-8 items-center justify-center rounded-xl ${stat.bg}`}>
              {stat.icon}
            </div>
            <p className="text-[17px] font-bold">{stat.value}</p>
            <p className="text-[11px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Account Section */}
      <div>
        <p className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">Account</p>
        <div className="rounded-2xl ios-shadow-sm bg-card px-4 divide-y divide-border/40">
          <SettingsRow
            icon={<User className="size-4 text-white" />}
            iconColor="bg-emerald-500"
            label="Full Name"
            value={currentUser.name}
            chevron={false}
          />
          <SettingsRow
            icon={<Globe className="size-4 text-white" />}
            iconColor="bg-teal-500"
            label="Email"
            value={currentUser.email}
            chevron={false}
          />
          <SettingsRow
            icon={<Shield className="size-4 text-white" />}
            iconColor="bg-amber-500"
            label="Account Type"
            value={currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)}
            chevron={false}
          />
        </div>
      </div>

      {/* Language Section */}
      <div>
        <p className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">Language</p>
        <div className="rounded-2xl ios-shadow-sm bg-card px-4 divide-y divide-border/40">
          <button
            onClick={() => setLanguage('en')}
            className="flex w-full items-center gap-3 py-3 first:pt-0 last:pb-0 ios-press"
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <Languages className="size-4 text-primary" />
            </div>
            <span className="flex-1 text-[17px] text-left">English</span>
            {language === 'en' && (
              <div className="flex size-6 items-center justify-center rounded-full bg-primary text-white">
                <Check className="size-3.5" />
              </div>
            )}
          </button>
          <button
            onClick={() => setLanguage('ur')}
            className="flex w-full items-center gap-3 py-3 first:pt-0 last:pb-0 ios-press"
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-[13px] font-bold">اردو</span>
            </div>
            <span className="flex-1 text-[17px] text-left">اردو</span>
            {language === 'ur' && (
              <div className="flex size-6 items-center justify-center rounded-full bg-primary text-white">
                <Check className="size-3.5" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Appearance Section */}
      <div>
        <p className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">Appearance</p>
        <div className="grid gap-3 grid-cols-3">
          {[
            { value: 'light', label: 'Light', icon: Sun },
            { value: 'dark', label: 'Dark', icon: Moon },
            { value: 'system', label: 'System', icon: Monitor },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={`flex flex-col items-center gap-2 rounded-2xl p-4 transition-all ios-press ${
                theme === option.value
                  ? 'bg-card ios-shadow-sm ring-2 ring-primary'
                  : 'bg-muted/40 hover:bg-muted/60'
              }`}
            >
              <option.icon className={`size-6 ${theme === option.value ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-[13px] font-medium ${theme === option.value ? 'text-primary' : 'text-muted-foreground'}`}>{option.label}</span>
              {theme === option.value && (
                <Badge className="bg-primary text-[9px] border-0 rounded-lg">Active</Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications Section */}
      <div>
        <p className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">Notifications</p>
        <div className="rounded-2xl ios-shadow-sm bg-card px-4 divide-y divide-border/40">
          {[
            { key: 'courseUpdates' as const, label: 'Course Updates', icon: <BookOpen className="size-4 text-white" />, iconColor: 'bg-emerald-500' },
            { key: 'quizReminders' as const, label: 'Quiz Reminders', icon: <Zap className="size-4 text-white" />, iconColor: 'bg-amber-500' },
            { key: 'achievementAlerts' as const, label: 'Achievement Alerts', icon: <GraduationCap className="size-4 text-white" />, iconColor: 'bg-teal-500' },
            { key: 'emailDigest' as const, label: 'Email Digest', icon: <Globe className="size-4 text-white" />, iconColor: 'bg-cyan-500' },
            { key: 'weeklyProgress' as const, label: 'Weekly Progress', icon: <Flame className="size-4 text-white" />, iconColor: 'bg-orange-500' },
            { key: 'newCourseAnnouncements' as const, label: 'New Courses', icon: <Bell className="size-4 text-white" />, iconColor: 'bg-rose-500' },
          ].map((item) => (
            <div key={item.key} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className={`flex size-8 items-center justify-center rounded-lg ${item.iconColor}`}>
                {item.icon}
              </div>
              <span className="flex-1 text-[17px]">{item.label}</span>
              <Switch
                checked={notifications[item.key]}
                onCheckedChange={(checked) =>
                  setNotifications((prev) => ({ ...prev, [item.key]: checked }))
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* About Section */}
      <div>
        <p className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">About</p>
        <div className="rounded-2xl ios-shadow-sm bg-card p-4">
          <div className="flex items-center gap-4 mb-4">
            <ShijlAILogo size="lg" className="shrink-0" />
            <div>
              <h3 className="text-[22px] font-bold"><ShijlAIBrand /></h3>
              <p className="text-[13px] text-muted-foreground">AI-Powered Learning for Everyone</p>
            </div>
          </div>

          <p className="text-[15px] text-muted-foreground leading-relaxed mb-4">
            <ShijlAIText /> Academy is an AI-powered e-learning platform designed to make quality education accessible to everyone. 
            We offer courses across IB, AP, Cambridge, AWS certifications, IELTS preparation, and programming — all enhanced by 
            Ask ShijlAI, gamification, and personalized learning paths.
          </p>

          <div className="h-px bg-border/60 mb-4" />

          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Version', value: '1.0.0' },
              { label: 'Build', value: '2025.05.04' },
              { label: 'Framework', value: 'Next.js 16' },
              { label: 'UI', value: 'shadcn/ui' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-muted/40 p-3">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{item.label}</p>
                <p className="text-[15px] font-medium">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="h-px bg-border/60 mb-4" />

          <div className="space-y-2 mb-4">
            <h4 className="text-[13px] font-medium">Features</h4>
            <div className="flex flex-wrap gap-2">
              {[
                'Ask ShijlAI',
                'Gamification',
                'Certificates',
                'Multi-language',
                'Dark Mode',
                'Responsive Design',
                'Real-time Analytics',
                'Progress Tracking',
              ].map((feature) => (
                <Badge key={feature} variant="secondary" className="text-[11px] rounded-xl border-0">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-center text-muted-foreground">
            © 2025 <ShijlAIBrand variant="compact" />. All rights reserved.
          </p>
        </div>
      </div>

      {/* Account Info */}
      <div>
        <p className="text-[13px] font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">Account Details</p>
        <div className="rounded-2xl ios-shadow-sm bg-card px-4 divide-y divide-border/40">
          <SettingsRow
            icon={<Shield className="size-4 text-white" />}
            iconColor="bg-emerald-500"
            label="Member Since"
            value={new Date(currentUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            chevron={false}
          />
          <SettingsRow
            icon={<Info className="size-4 text-white" />}
            iconColor="bg-muted-foreground/60"
            label="Last Active"
            value={new Date(currentUser.lastActiveAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            chevron={false}
          />
          <SettingsRow
            icon={<User className="size-4 text-white" />}
            iconColor="bg-teal-500"
            label="User ID"
            value={currentUser.id.substring(0, 12) + '...'}
            chevron={false}
          />
        </div>
      </div>

      <p className="text-[11px] text-center text-muted-foreground pb-4">
        Profile editing will be available in a future update.
      </p>
    </motion.div>
  )
}
