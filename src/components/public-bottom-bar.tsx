'use client'

import {
  Home,
  BookOpen,
  DollarSign,
  FileText,
  GraduationCap,
  Info,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { MobileBottomBar } from '@/components/mobile-bottom-bar'
import type { BottomBarItem, MoreMenuAction } from '@/components/mobile-bottom-bar'

/* ─── Public Bottom Bar Items ─── */
const publicBottomItems: BottomBarItem[] = [
  { id: 'landing', label: 'Home', icon: <Home className="size-[22px]" /> },
  { id: 'public-courses', label: 'Courses', icon: <BookOpen className="size-[22px]" /> },
  { id: 'instructors', label: 'Teach', icon: <GraduationCap className="size-[22px]" /> },
  { id: 'about', label: 'About', icon: <Info className="size-[22px]" /> },
]

const publicMoreItems: MoreMenuAction[] = [
  { id: 'pricing', label: 'Pricing', icon: <DollarSign className="size-[18px]" />, iconColor: 'text-emerald-500', onClick: () => useAppStore.getState().setCurrentView('pricing') },
  { id: 'blog', label: 'Blog', icon: <FileText className="size-[18px]" />, iconColor: 'text-sky-500', onClick: () => useAppStore.getState().setCurrentView('blog') },
]

/* ─── View key mapping: some views should highlight a parent tab ─── */
const viewKeyMap: Record<string, string> = {
  'landing': 'landing',
  'public-courses': 'public-courses',
  'public-course-detail': 'public-courses',
  'pricing': 'pricing',
  'instructors': 'instructors',
  'about': 'about',
  'blog': 'blog',
  'blog-detail': 'blog',
}

/* ─── Component ─── */
export function PublicBottomBar() {
  const { currentView, setCurrentView } = useAppStore()

  // Map the current view to a bottom bar tab for active highlighting
  const mappedView = currentView ? (viewKeyMap[currentView] || currentView) : undefined

  return (
    <MobileBottomBar
      items={publicBottomItems}
      moreItems={publicMoreItems}
      accent="emerald"
      activeView={mappedView}
      onItemSelect={(id) => setCurrentView(id as any)}
      moreTitle="Explore"
    />
  )
}
