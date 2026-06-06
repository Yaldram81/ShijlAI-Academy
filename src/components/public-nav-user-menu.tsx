'use client'

import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import {
  ArrowRight, GraduationCap, BookOpen, Shield, LogOut,
  LayoutDashboard, Settings,
} from 'lucide-react'
import { toast } from 'sonner'

// Helper to get dashboard view for a role
function getDashboardView(role: string): string {
  switch (role) {
    case 'admin': return 'admin'
    case 'instructor': return 'instructor-dashboard'
    case 'student': return 'dashboard'
    default: return 'dashboard'
  }
}

// Helper to get role display name
function getRoleDisplayName(role: string): string {
  switch (role) {
    case 'admin': return 'Admin'
    case 'instructor': return 'Instructor'
    case 'student': return 'Student'
    case 'parent': return 'Parent'
    default: return 'User'
  }
}

// Helper to get initials
function getInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return '??'
  return name.trim().split(/\s+/).filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'
}

/**
 * Reusable component for public pages' navbar user section.
 * - When NOT logged in: Shows "Log In" ghost button + "Get Started" CTA button
 * - When logged in: Shows "Dashboard" button + Profile avatar dropdown
 */
export function PublicNavUserSection() {
  const { setCurrentView, currentUser, isAuthenticated } = useAppStore()

  if (isAuthenticated && currentUser) {
    return (
      <div className="hidden md:flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentView(getDashboardView(currentUser.role) as any)}
          className="text-[13px] font-medium rounded-full gap-1.5"
        >
          <LayoutDashboard className="size-4" />
          Dashboard
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-accent/50 transition-colors">
              <Avatar className="size-8 ring-2 ring-emerald-500/20">
                <AvatarImage src={currentUser.avatar || undefined} alt={currentUser.name} />
                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[11px] font-bold">
                  {getInitials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[13px] font-medium text-foreground max-w-[160px] truncate">
                {currentUser.name}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 rounded-2xl ios-shadow-lg" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-[13px] font-medium">{currentUser.name}</p>
                <p className="text-[11px] text-muted-foreground">{currentUser.email}</p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex size-4 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                    {currentUser.role === 'admin' ? <Shield className="size-2.5 text-emerald-600" /> :
                     currentUser.role === 'instructor' ? <GraduationCap className="size-2.5 text-emerald-600" /> :
                     <BookOpen className="size-2.5 text-emerald-600" />}
                  </div>
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">{getRoleDisplayName(currentUser.role)}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="gap-2 rounded-[10px]" onClick={() => setCurrentView(getDashboardView(currentUser.role) as any)}>
                <LayoutDashboard className="size-4" />
                <span className="text-[13px]">Go to Dashboard</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 rounded-[10px]" onClick={() => setCurrentView('settings' as any)}>
                <Settings className="size-4" />
                <span className="text-[13px]">Settings</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 rounded-[10px] text-destructive focus:text-destructive" onClick={() => {
              useAppStore.getState().logout()
              toast.success('Logged out successfully')
            }}>
              <LogOut className="size-4" />
              <span className="text-[13px]">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  return (
    <div className="hidden md:flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setCurrentView('login')}
        className="text-[13px] font-medium rounded-full"
      >
        Log In
      </Button>
      <Button
        size="sm"
        onClick={() => setCurrentView('register')}
        className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md hover:shadow-lg transition-all ios-press"
      >
        Get Started
        <ArrowRight className="size-3.5" />
      </Button>
    </div>
  )
}

/**
 * Mobile version of the user section for sheet drawers.
 */
export function PublicNavMobileUserSection({ onClose }: { onClose: () => void }) {
  const { setCurrentView, currentUser, isAuthenticated } = useAppStore()

  if (isAuthenticated && currentUser) {
    return (
      <div className="mt-6 px-4 flex flex-col gap-2">
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30 p-3 mb-2">
          <div className="flex items-center gap-3">
            <Avatar className="size-10 ring-2 ring-emerald-500/20">
              <AvatarImage src={currentUser.avatar || undefined} alt={currentUser.name} />
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[12px] font-bold">
                {getInitials(currentUser.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold truncate">{currentUser.name}</p>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">{getRoleDisplayName(currentUser.role)}</span>
            </div>
          </div>
        </div>
        <Button
          size="sm"
          className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white h-9"
          onClick={() => {
            setCurrentView(getDashboardView(currentUser.role) as any)
            onClose()
          }}
        >
          <LayoutDashboard className="size-4 mr-1.5" />
          Go to Dashboard
        </Button>
        <Button
          variant="outline"
          className="w-full rounded-xl gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
          onClick={() => {
            useAppStore.getState().logout()
            toast.success('Logged out successfully')
            onClose()
          }}
        >
          <LogOut className="size-4" />
          Log out
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-6 px-4 flex flex-col gap-3">
      <Button
        variant="outline"
        className="w-full rounded-full"
        onClick={() => {
          setCurrentView('login')
          onClose()
        }}
      >
        Log In
      </Button>
      <Button
        className="w-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
        onClick={() => {
          setCurrentView('register')
          onClose()
        }}
      >
        Get Started Free
        <ArrowRight className="size-4" />
      </Button>
    </div>
  )
}
