'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import {
  Search,
  Bell,
  User,
  LogOut,
  Shield,
  GraduationCap,
  BookOpen,
  Target,
  Flame,
  Coins,
  Trophy,
  Megaphone,
  CheckCheck,
  Download,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { UserRole } from '@/lib/types'

const roleLabels: Record<UserRole, string> = {
  student: 'Student',
  instructor: 'Instructor',
  admin: 'Admin',
  parent: 'Parent',
}

const roleIcons: Record<UserRole, React.ReactNode> = {
  student: <GraduationCap className="size-4" />,
  instructor: <BookOpen className="size-4" />,
  admin: <Shield className="size-4" />,
  parent: <User className="size-4" />,
}

interface Notification {
  id: string
  icon: React.ReactNode
  text: string
  timestamp: string
  unread: boolean
}

const mockNotifications: Notification[] = [
  { id: '1', icon: <Target className="size-4 text-emerald-500" />, text: 'New quiz: IB Math Ch.3', timestamp: '2m ago', unread: true },
  { id: '2', icon: <Flame className="size-4 text-orange-500" />, text: '12-day streak on fire!', timestamp: '1h ago', unread: true },
  { id: '3', icon: <BookOpen className="size-4 text-teal-500" />, text: 'Completed "Intro to Python"', timestamp: '3h ago', unread: true },
  { id: '4', icon: <Trophy className="size-4 text-amber-500" />, text: 'Earned "7-Day Streak" badge', timestamp: 'Yesterday', unread: false },
  { id: '5', icon: <Megaphone className="size-4 text-cyan-500" />, text: 'New: AWS Cloud Practitioner', timestamp: '2d ago', unread: false },
]

export function Header() {
  const { currentUser, setCurrentUser } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [downloading, setDownloading] = useState(false)

  const handleDownloadProject = async () => {
    setDownloading(true)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 120000) // 2 min timeout

      const res = await fetch('/api/download', { signal: controller.signal })
      clearTimeout(timeout)

      if (!res.ok) throw new Error(`Download failed: ${res.status}`)

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const match = res.headers.get('content-disposition')?.match(/filename="(.+?)"/)
      a.download = match?.[1] || 'shijlai-academy.zip'
      document.body.appendChild(a)
      a.click()
      a.remove()
      // Delay revoking to ensure download starts
      setTimeout(() => window.URL.revokeObjectURL(url), 5000)
    } catch (err) {
      console.error('Download failed:', err)
      alert('Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const unreadCount = notifications.filter((n) => n.unread).length

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const handleSwitchRole = async (role: UserRole) => {
    if (!currentUser) return
    try {
      const res = await fetch(`/api/users/me?role=${role}`)
      if (res.ok) {
        const data = await res.json()
        if (data.user) setCurrentUser(data.user)
      }
    } catch {
      setCurrentUser({
        ...currentUser,
        role,
        name: role === 'admin' ? 'Shijl Admin' : role === 'instructor' ? 'Dr. Sara Malik' : role === 'parent' ? 'Parent User' : 'Ahmed Khan',
      })
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-[52px] items-center gap-3 ios-glass-thick border-b border-border/40 px-4 md:px-5">
      {/* Search bar - iOS style with rounded pill */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          type="search"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-[36px] bg-muted/60 border-0 rounded-[10px] text-[13px] placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary/20"
        />
      </div>

      {/* Download Project Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownloadProject}
            disabled={downloading}
            className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all duration-200 text-[12px] font-semibold"
          >
            {downloading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            {downloading ? 'Zipping...' : 'Download'}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="rounded-xl">Download project source code</TooltipContent>
      </Tooltip>

      {/* Mobile Download Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDownloadProject}
        disabled={downloading}
        className="sm:hidden size-9 rounded-full hover:bg-accent"
      >
        {downloading ? (
          <Loader2 className="size-[18px] animate-spin text-emerald-500" />
        ) : (
          <Download className="size-[18px]" />
        )}
      </Button>

      {/* Right section */}
      <div className="flex items-center gap-2.5">
        {/* Streak */}
        {currentUser && currentUser.streak > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-1">
                <Flame className="size-3.5 text-orange-500 streak-fire" />
                <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
                  {currentUser.streak}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="rounded-xl">{currentUser.streak}-day streak</TooltipContent>
          </Tooltip>
        )}

        <Separator orientation="vertical" className="hidden sm:block h-4 opacity-40" />

        {/* XP */}
        {currentUser && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden sm:flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  ⚡ {currentUser.xp.toLocaleString()}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="rounded-xl">Experience: {currentUser.xp} XP</TooltipContent>
          </Tooltip>
        )}

        {/* Coins */}
        {currentUser && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden sm:flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1">
                <Coins className="size-3 text-amber-600 dark:text-amber-400" />
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  {currentUser.shijlCoins}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="rounded-xl">ShijlCoins: {currentUser.shijlCoins}</TooltipContent>
          </Tooltip>
        )}

        {/* Notifications - iOS style */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative size-9 rounded-full hover:bg-accent">
              <Bell className="size-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-[18px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 rounded-2xl ios-shadow-lg overflow-hidden" align="end">
            <div className="flex items-center justify-between px-4 py-3">
              <h4 className="text-[15px] font-semibold">Notifications</h4>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-[13px] text-primary hover:text-primary/80"
                  onClick={handleMarkAllRead}
                >
                  <CheckCheck className="mr-1 size-3.5" />
                  Mark all read
                </Button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
              <div className="divide-y divide-border/40">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 transition-colors',
                      n.unread && 'bg-primary/5'
                    )}
                  >
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted/60">
                      {n.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        'text-[13px] leading-snug',
                        n.unread ? 'font-medium' : 'text-muted-foreground'
                      )}>
                        {n.text}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground/60">{n.timestamp}</p>
                    </div>
                    {n.unread && <div className="mt-2 size-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* User menu */}
        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative size-9 rounded-full p-0 hover:bg-accent">
                <Avatar className="size-9 ring-2 ring-primary/15">
                  <AvatarImage src={currentUser.avatar || undefined} alt={currentUser.name} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-bold">
                    {currentUser.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-2xl ios-shadow-lg" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-[13px] font-medium">{currentUser.name}</p>
                  <p className="text-[11px] text-muted-foreground">{currentUser.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[11px] text-muted-foreground">Switch Role (Demo)</DropdownMenuLabel>
              <DropdownMenuGroup>
                {(Object.entries(roleLabels) as [UserRole, string][]).map(([role, label]) => (
                  <DropdownMenuItem
                    key={role}
                    onClick={() => handleSwitchRole(role)}
                    className={cn('gap-2 rounded-[10px]', currentUser.role === role && 'bg-primary/10')}
                  >
                    {roleIcons[role]}
                    <span className="text-[13px]">{label}</span>
                    {currentUser.role === role && <span className="ml-auto text-xs text-primary">✓</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 rounded-[10px]">
                <User className="size-4" />
                <span className="text-[13px]">Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 rounded-[10px] text-destructive focus:text-destructive">
                <LogOut className="size-4" />
                <span className="text-[13px]">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
