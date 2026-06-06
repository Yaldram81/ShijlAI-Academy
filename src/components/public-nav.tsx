'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import {
  GraduationCap, ChevronRight, Menu,
  Twitter, Linkedin, Youtube, Github, Search,
  LayoutDashboard, LogOut,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  PublicNavUserSection,
  PublicNavMobileUserSection,
} from '@/components/public-nav-user-menu'
import {
  InlineSearch,
  MobileExpandableSearch,
} from '@/components/universal-search'
import { ShijlAIBrand } from '@/components/ui/brand-text'
import { ShijlAILogo } from '@/components/ui/shijlai-logo'

// Nav links configuration
const navLinks = [
  { label: 'Courses', view: 'public-courses' as const },
  { label: 'Pricing', view: 'pricing' as const },
  { label: 'Teach', view: 'instructors' as const },
  { label: 'About', view: 'about' as const },
  { label: 'Blog', view: 'blog' as const },
]

// Map of views to their "active" nav link label
const viewToActiveLabel: Record<string, string> = {
  'public-courses': 'Courses',
  'public-course-detail': 'Courses',
  'pricing': 'Pricing',
  'instructors': 'Teach',
  'about': 'About',
  'blog': 'Blog',
  'blog-detail': 'Blog',
}

// Helper to get initials from name
function getInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return '??'
  return name.trim().split(/\s+/).filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'
}

// Helper to get dashboard view for a role
function getDashboardView(role: string): string {
  switch (role) {
    case 'admin': return 'admin'
    case 'instructor': return 'instructor-dashboard'
    case 'student': return 'dashboard'
    default: return 'dashboard'
  }
}

interface PublicNavProps {
  /** The current view key — used to highlight the active nav link.
   *  If not provided, no link will be highlighted. */
  activeView?: string
}

export function PublicNav({ activeView }: PublicNavProps) {
  const { setCurrentView, currentUser, isAuthenticated } = useAppStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const activeLabel = activeView ? viewToActiveLabel[activeView] : undefined

  return (
    <nav className="ios-glass-thick sticky top-0 z-50 border-b border-border/30">
      <div className="mx-auto flex max-w-7xl items-center h-12 sm:h-14 px-3 sm:px-6">
        {/* LEFT: Logo */}
        <button
          onClick={() => setCurrentView('landing')}
          className="flex items-center gap-1.5 ios-press shrink-0 mr-3 md:w-[300px]"
        >
          <ShijlAILogo size="sm" className="shrink-0" />
          <div className="hidden sm:block">
            <ShijlAIBrand />
          </div>
        </button>

        {/* CENTER: Desktop search bar — starts at 300px from left */}
        <InlineSearch scope="public" className="flex-1 max-w-xs lg:max-w-sm hidden md:block" />

        {/* CENTER: Desktop nav links */}
        <div className="hidden md:flex items-center gap-6 flex-1 justify-center">
          {navLinks.map((link) => (
            <button
              key={link.view}
              onClick={() => setCurrentView(link.view)}
              className={`text-[15px] font-medium transition-colors ios-press ${
                activeLabel === link.label
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 ml-auto shrink-0">
          {/* Desktop user section */}
          <PublicNavUserSection />

          {/* Mobile: Search icon or expanded search */}
          {mobileSearchOpen ? (
            <MobileExpandableSearch scope="public" className="md:hidden" />
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden size-8 shrink-0"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Search"
            >
              <Search className="size-4 text-muted-foreground" />
            </Button>
          )}

          {/* Mobile: Profile avatar dropdown when logged in */}
          {isAuthenticated && currentUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="md:hidden shrink-0" aria-label="Profile menu">
                  <Avatar className="size-7 ring-2 ring-emerald-500/20">
                    <AvatarImage src={currentUser.avatar || undefined} alt={currentUser.name} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-[10px] font-bold">
                      {getInitials(currentUser.name)}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 rounded-2xl" align="end" forceMount>
                <DropdownMenuItem
                  className="gap-2 rounded-[10px]"
                  onClick={() => setCurrentView(getDashboardView(currentUser.role) as any)}
                >
                  <LayoutDashboard className="size-4" />
                  <span className="text-[13px]">My Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2 rounded-[10px] text-destructive focus:text-destructive"
                  onClick={() => {
                    useAppStore.getState().logout()
                    toast.success('Logged out successfully')
                  }}
                >
                  <LogOut className="size-4" />
                  <span className="text-[13px]">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden size-8 shrink-0"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Sheet Drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-[300px] sm:w-[350px]">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2 cursor-pointer" onClick={() => { setCurrentView('landing'); setMobileOpen(false) }}>
              <ShijlAILogo size="xs" className="shrink-0" />
              <ShijlAIBrand variant="compact" />
            </SheetTitle>
            <SheetDescription>
              AI-powered learning for everyone
            </SheetDescription>
          </SheetHeader>

          {/* Mobile nav links */}
          <div className="flex flex-col gap-1 px-4 mt-4">
            {navLinks.map((link, i) => (
              <motion.button
                key={link.view}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => {
                  setCurrentView(link.view)
                  setMobileOpen(false)
                }}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-[15px] font-medium transition-colors ${
                  activeLabel === link.label
                    ? 'text-primary bg-emerald-50 dark:bg-emerald-950/30'
                    : 'text-foreground hover:bg-accent/50'
                }`}
              >
                {link.label}
                <ChevronRight className="size-4 text-muted-foreground" />
              </motion.button>
            ))}
          </div>

          {/* Mobile user section */}
          <PublicNavMobileUserSection onClose={() => setMobileOpen(false)} />

          {/* Social links at bottom */}
          <div className="mt-auto px-4 pb-6">
            <div className="flex items-center justify-center gap-4 pt-6 border-t border-border/50">
              {[Twitter, Linkedin, Youtube, Github].map((Icon, i) => (
                <button
                  key={i}
                  className="flex size-9 items-center justify-center rounded-full bg-accent/50 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  aria-label="Social link"
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  )
}
