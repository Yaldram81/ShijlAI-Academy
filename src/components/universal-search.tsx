'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Search, BookOpen, Users, GraduationCap, FileText, Calendar,
  MessageSquare, Bot, ClipboardList, Newspaper, CreditCard, Layers,
  ChevronRight, Sparkles, Shield, X, Loader2,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ShijlAIText } from '@/components/ui/brand-text'

export type SearchScope = 'public' | 'student' | 'instructor' | 'admin'

interface SearchResultItem {
  id: string
  title: string
  subtitle?: string
  icon: React.ReactNode
  badge?: string
  badgeColor?: string
  viewId?: string
}

interface SearchResultGroup {
  heading: string
  items: SearchResultItem[]
}

// Scope-specific config
const scopeConfig: Record<SearchScope, { label: React.ReactNode; placeholder: string; accentColor: string }> = {
  public: { label: <><ShijlAIText /> Academy</>, placeholder: 'Search courses, instructors...', accentColor: 'emerald' },
  student: { label: 'Student Portal', placeholder: 'Search courses, assignments...', accentColor: 'emerald' },
  instructor: { label: 'Instructor Portal', placeholder: 'Search courses, students...', accentColor: 'emerald' },
  admin: { label: 'Admin Panel', placeholder: 'Search users, courses...', accentColor: 'blue' },
}

// Helper to get initials
function getInitials(name?: string | null) {
  if (!name || typeof name !== 'string') return '??'
  return name.trim().split(/\s+/).filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'
}

function formatPrice(price: number) {
  if (price === 0) return 'Free'
  return `$${price}`
}

// ─── Build search result groups from API response ───
const buildGroups = (data: Record<string, any[]>, searchScope: SearchScope): SearchResultGroup[] => {
  const groups: SearchResultGroup[] = []

  if (searchScope === 'public') {
    if (data.courses?.length) groups.push({ heading: 'Courses', items: data.courses.map((c: any) => ({ id: `course-${c.id}`, title: c.title, subtitle: `${c.category} · ${c.level} · ${formatPrice(c.price)}`, icon: <BookOpen className="size-4 text-emerald-500" />, badge: c.rating > 0 ? `${c.rating}★` : undefined, badgeColor: 'amber', viewId: 'public-courses' })) })
    if (data.instructors?.length) groups.push({ heading: 'Instructors', items: data.instructors.map((i: any) => ({ id: `instructor-${i.id}`, title: i.name, subtitle: i.instructorProfile?.headline || `${i._count?.coursesCreated || 0} courses`, icon: <GraduationCap className="size-4 text-teal-500" />, viewId: 'instructors' })) })
    if (data.blogs?.length) groups.push({ heading: 'Blog Posts', items: data.blogs.map((b: any) => ({ id: `blog-${b.id}`, title: b.title, subtitle: `${b.category} · ${b.authorName}`, icon: <Newspaper className="size-4 text-sky-500" />, viewId: 'blog' })) })
    if (data.categories?.length) groups.push({ heading: 'Subjects & Categories', items: data.categories.map((c: any, idx: number) => ({ id: `cat-${idx}`, title: c.category, subtitle: `${c._count?.enrollments || 0} enrollments`, icon: <Layers className="size-4 text-violet-500" />, viewId: 'public-courses' })) })
  }

  if (searchScope === 'student') {
    if (data.enrolledCourses?.length) groups.push({ heading: 'My Courses', items: data.enrolledCourses.map((e: any) => ({ id: `enrolled-${e.id}`, title: e.course.title, subtitle: `${e.course.category} · ${Math.round(e.progress)}% complete`, icon: <BookOpen className="size-4 text-emerald-500" />, badge: e.status === 'completed' ? 'Done' : `${Math.round(e.progress)}%`, badgeColor: e.status === 'completed' ? 'emerald' : 'sky', viewId: 'courses' })) })
    if (data.exploreCourses?.length) groups.push({ heading: 'Explore Courses', items: data.exploreCourses.map((c: any) => ({ id: `explore-${c.id}`, title: c.title, subtitle: `${c.category} · ${c.level}`, icon: <Search className="size-4 text-teal-500" />, badge: c.rating > 0 ? `${c.rating}★` : undefined, badgeColor: 'amber', viewId: 'explore' })) })
    if (data.assignments?.length) groups.push({ heading: 'Assignments', items: data.assignments.map((a: any) => ({ id: `assign-${a.id}`, title: a.title, subtitle: `${a.course?.title || ''} · ${a.type}`, icon: <ClipboardList className="size-4 text-amber-500" />, badge: a.submissions?.[0]?.status || 'Pending', badgeColor: a.submissions?.[0]?.status === 'graded' ? 'emerald' : 'amber', viewId: 'student-assignments' })) })
    if (data.qaQuestions?.length) groups.push({ heading: 'Q&A', items: data.qaQuestions.map((q: any) => ({ id: `qa-${q.id}`, title: q.question.length > 80 ? q.question.slice(0, 80) + '...' : q.question, subtitle: `${q.course?.title || ''} · ${q._count?.answers || 0} answers`, icon: <MessageSquare className="size-4 text-sky-500" />, badge: q.isAnswered ? 'Answered' : 'Open', badgeColor: q.isAnswered ? 'emerald' : 'orange', viewId: 'student-qa' })) })
    if (data.schedule?.length) groups.push({ heading: 'Schedule', items: data.schedule.map((s: any) => ({ id: `sched-${s.id}`, title: s.title, subtitle: `${s.type} · ${new Date(s.startDate).toLocaleDateString()}`, icon: <Calendar className="size-4 text-indigo-500" />, viewId: 'student-schedule' })) })
  }

  if (searchScope === 'instructor') {
    if (data.courses?.length) groups.push({ heading: 'My Courses', items: data.courses.map((c: any) => ({ id: `course-${c.id}`, title: c.title, subtitle: `${c.category} · ${c.enrollmentCount} students`, icon: <BookOpen className="size-4 text-emerald-500" />, badge: c.isPublished ? 'Published' : 'Draft', badgeColor: c.isPublished ? 'emerald' : 'amber', viewId: 'instructor-courses' })) })
    if (data.students?.length) groups.push({ heading: 'Students', items: data.students.map((s: any) => ({ id: `student-${s.user?.id}`, title: s.user?.name || 'Unknown', subtitle: `${s.course?.title || ''} · ${Math.round(s.progress)}%`, icon: <GraduationCap className="size-4 text-teal-500" />, viewId: 'instructor-students' })) })
    if (data.qaQuestions?.length) groups.push({ heading: 'Q&A', items: data.qaQuestions.map((q: any) => ({ id: `qa-${q.id}`, title: q.question.length > 80 ? q.question.slice(0, 80) + '...' : q.question, subtitle: `${q.course?.title || ''} · ${q._count?.answers || 0} answers`, icon: <MessageSquare className="size-4 text-sky-500" />, badge: q.isAnswered ? 'Answered' : 'Unanswered', badgeColor: q.isAnswered ? 'emerald' : 'rose', viewId: 'instructor-qa' })) })
    if (data.assignments?.length) groups.push({ heading: 'Assignments', items: data.assignments.map((a: any) => ({ id: `assign-${a.id}`, title: a.title, subtitle: `${a.course?.title || ''} · ${a._count?.submissions || 0} submissions`, icon: <ClipboardList className="size-4 text-amber-500" />, viewId: 'instructor-assignments' })) })
  }

  if (searchScope === 'admin') {
    if (data.users?.length) groups.push({ heading: 'Users', items: data.users.map((u: any) => ({ id: `user-${u.id}`, title: u.name, subtitle: `${u.email} · ${u.role}`, icon: <Users className="size-4 text-violet-500" />, badge: u.status, badgeColor: u.status === 'active' ? 'emerald' : u.status === 'suspended' ? 'rose' : 'amber', viewId: 'admin-users' })) })
    if (data.instructors?.length) groups.push({ heading: 'Instructors', items: data.instructors.map((i: any) => ({ id: `instructor-${i.id}`, title: i.name, subtitle: `${i._count?.coursesCreated || 0} courses`, icon: <GraduationCap className="size-4 text-teal-500" />, viewId: 'admin-instructors' })) })
    if (data.courses?.length) groups.push({ heading: 'Courses', items: data.courses.map((c: any) => ({ id: `course-${c.id}`, title: c.title, subtitle: `${c.category} · ${c.instructor?.name || 'Unknown'}`, icon: <BookOpen className="size-4 text-emerald-500" />, badge: c.reviewStatus, badgeColor: c.reviewStatus === 'approved' ? 'emerald' : c.reviewStatus === 'rejected' ? 'rose' : 'amber', viewId: 'admin-courses' })) })
    if (data.blogs?.length) groups.push({ heading: 'Blog Posts', items: data.blogs.map((b: any) => ({ id: `blog-${b.id}`, title: b.title, subtitle: `${b.category} · ${b.status}`, icon: <Newspaper className="size-4 text-sky-500" />, viewId: 'admin-blog' })) })
  }

  return groups
}

// ═══════════════════════════════════════════════════════════
// Inline Search Component — replaces CommandDialog approach
// ═══════════════════════════════════════════════════════════

interface InlineSearchProps {
  scope: SearchScope
  /** Enable keyboard shortcut (Cmd+K / Ctrl+K) */
  shortcutEnabled?: boolean
  className?: string
}

export function InlineSearch({ scope, shortcutEnabled = true, className }: InlineSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResultGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const { currentUser, setCurrentView } = useAppStore()
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const config = scopeConfig[scope]

  const showDropdown = focused && query.trim().length >= 1

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    if (!shortcutEnabled) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcutEnabled])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({ q: searchQuery.trim(), scope, limit: '5' })
      if (currentUser?.id) params.set('userId', currentUser.id)
      const res = await fetch(`/api/search?${params}`)
      if (res.ok) {
        const data = await res.json()
        setResults(buildGroups(data.results || {}, scope))
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [scope, currentUser?.id])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) { setResults([]); setLoading(false); return }
    setLoading(true)
    debounceRef.current = setTimeout(() => performSearch(query), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, performSearch])

  const handleSelect = useCallback((item: SearchResultItem) => {
    setQuery('')
    setResults([])
    setFocused(false)
    inputRef.current?.blur()
    if (item.viewId) setCurrentView(item.viewId as any)
  }, [setCurrentView])

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Search Input */}
      <div className={cn(
        'flex items-center gap-2 rounded-xl border bg-background/80 backdrop-blur-sm transition-all duration-200',
        focused
          ? 'border-primary/40 shadow-sm shadow-primary/5 ring-2 ring-primary/10'
          : 'border-border/40 hover:border-border/60',
        scope === 'admin' && focused
          ? 'border-blue-500/40 shadow-sm shadow-blue-500/5 ring-2 ring-blue-500/10'
          : scope === 'admin' && !focused && 'hover:border-border/60'
      )}>
        <Search className="size-4 text-muted-foreground shrink-0 ml-3" />
        <input
          ref={inputRef}
          type="text"
          placeholder={config.placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          className="flex-1 bg-transparent py-2 pr-2 text-[13px] placeholder:text-muted-foreground/60 outline-none"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}
            className="flex size-6 items-center justify-center rounded-md hover:bg-accent/50 mr-1 transition-colors"
          >
            <X className="size-3.5 text-muted-foreground" />
          </button>
        )}
        {!query && (
          <kbd className="hidden md:flex items-center mr-2 rounded border border-border/50 bg-muted/50 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/60">
            ⌘K
          </kbd>
        )}
        {loading && <Loader2 className="size-3.5 animate-spin text-muted-foreground mr-3" />}
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <div className={cn(
          'absolute top-full left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-xl shadow-black/10',
          'max-h-[min(400px,60vh)] overflow-y-auto'
        )}>
          {loading && (
            <div className="flex items-center justify-center py-6 gap-2">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span className="text-[13px] text-muted-foreground">Searching...</span>
            </div>
          )}

          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
              <Search className="size-6 mb-1.5 opacity-30" />
              <p className="text-[13px]">No results for &ldquo;{query}&rdquo;</p>
            </div>
          )}

          {!loading && query.trim().length < 2 && (
            <div className="flex flex-col items-center justify-center py-5 text-muted-foreground">
              <Search className="size-6 mb-1.5 opacity-30" />
              <p className="text-[12px]">Type at least 2 characters to search</p>
            </div>
          )}

          {!loading && results.map((group) => (
            <div key={group.heading}>
              <div className="px-3 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {group.heading}
                </span>
              </div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-accent/50 transition-colors"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium truncate">{item.title}</p>
                    {item.subtitle && (
                      <p className="text-[10px] text-muted-foreground truncate">{item.subtitle}</p>
                    )}
                  </div>
                  {item.badge && (
                    <Badge variant="secondary" className="text-[9px] font-semibold shrink-0 rounded-md px-1.5 py-0 h-4">
                      {item.badge}
                    </Badge>
                  )}
                  <ChevronRight className="size-3 text-muted-foreground/40 shrink-0" />
                </button>
              ))}
            </div>
          ))}

          {/* Footer */}
          <div className="border-t border-border/30 px-3 py-1.5 flex items-center gap-1.5">
            <div className={cn('size-1.5 rounded-full', scope === 'admin' ? 'bg-blue-500' : 'bg-emerald-500')} />
            <span className="text-[10px] text-muted-foreground/60">Searching in {config.label}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Search Trigger Button (desktop) ───
export function SearchTrigger({
  scope,
  onClick,
  className
}: {
  scope: SearchScope
  onClick: () => void
  className?: string
}) {
  const config = scopeConfig[scope]

  return (
    <button
      onClick={onClick}
      className={className || `flex items-center gap-2 rounded-[10px] bg-muted/60 border border-border/30 px-3 py-1.5 text-[13px] text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-200`}
    >
      <Search className="size-3.5" />
      <span className="hidden sm:inline truncate max-w-[200px]">{config.placeholder}</span>
      <kbd className="hidden md:inline-flex items-center gap-0.5 rounded border border-border/60 bg-background/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/70">
        ⌘K
      </kbd>
    </button>
  )
}

// ─── Mobile Search Trigger (icon only) ───
export function MobileSearchTrigger({
  onClick,
  className
}: {
  onClick: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={className || "flex size-9 items-center justify-center rounded-full hover:bg-accent transition-colors"}
      aria-label="Search"
    >
      <Search className="size-[18px] text-muted-foreground" />
    </button>
  )
}

// ═══════════════════════════════════════════════════════════
// Mobile Expandable Search — search icon that expands inline
// ═══════════════════════════════════════════════════════════
interface MobileExpandableSearchProps {
  scope: SearchScope
  className?: string
}

export function MobileExpandableSearch({ scope, className }: MobileExpandableSearchProps) {
  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResultGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const { currentUser, setCurrentView } = useAppStore()
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const config = scopeConfig[scope]

  const showDropdown = focused && query.trim().length >= 1

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setFocused(false)
        if (!query.trim()) setExpanded(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [query])

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({ q: searchQuery.trim(), scope, limit: '5' })
      if (currentUser?.id) params.set('userId', currentUser.id)
      const res = await fetch(`/api/search?${params}`)
      if (res.ok) {
        const data = await res.json()
        setResults(buildGroups(data.results || {}, scope))
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }, [scope, currentUser?.id])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) { setResults([]); setLoading(false); return }
    setLoading(true)
    debounceRef.current = setTimeout(() => performSearch(query), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, performSearch])

  const handleSelect = useCallback((item: SearchResultItem) => {
    setQuery('')
    setResults([])
    setFocused(false)
    setExpanded(false)
    if (item.viewId) setCurrentView(item.viewId as any)
  }, [setCurrentView])

  const handleExpand = () => {
    setExpanded(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleCollapse = () => {
    setExpanded(false)
    setQuery('')
    setResults([])
    setFocused(false)
  }

  // Collapsed: just a search icon button
  if (!expanded) {
    return (
      <button
        onClick={handleExpand}
        className={cn('flex size-9 items-center justify-center rounded-full hover:bg-accent transition-colors shrink-0', className)}
        aria-label="Search"
      >
        <Search className="size-[18px] text-muted-foreground" />
      </button>
    )
  }

  // Expanded: full-width search input with dropdown
  return (
    <div ref={containerRef} className={cn('relative flex-1 flex items-center gap-2', className)}>
      <div className={cn(
        'flex-1 flex items-center gap-2 rounded-xl border bg-background/80 backdrop-blur-sm transition-all duration-200',
        focused
          ? scope === 'admin'
            ? 'border-blue-500/40 shadow-sm shadow-blue-500/5 ring-2 ring-blue-500/10'
            : 'border-primary/40 shadow-sm shadow-primary/5 ring-2 ring-primary/10'
          : 'border-border/40'
      )}>
        <Search className="size-4 text-muted-foreground shrink-0 ml-3" />
        <input
          ref={inputRef}
          type="text"
          placeholder={config.placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          className="flex-1 bg-transparent py-2 pr-2 text-[13px] placeholder:text-muted-foreground/60 outline-none min-w-0"
        />
        {loading && <Loader2 className="size-3.5 animate-spin text-muted-foreground mr-1 shrink-0" />}
        <button
          onClick={handleCollapse}
          className="flex size-7 items-center justify-center rounded-md hover:bg-accent/50 mr-1 transition-colors shrink-0"
          aria-label="Close search"
        >
          <X className="size-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <div className={cn(
          'absolute top-full left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-xl shadow-black/10',
          'max-h-[min(400px,60vh)] overflow-y-auto'
        )}>
          {loading && (
            <div className="flex items-center justify-center py-6 gap-2">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span className="text-[13px] text-muted-foreground">Searching...</span>
            </div>
          )}

          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
              <Search className="size-6 mb-1.5 opacity-30" />
              <p className="text-[13px]">No results for &ldquo;{query}&rdquo;</p>
            </div>
          )}

          {!loading && query.trim().length < 2 && (
            <div className="flex flex-col items-center justify-center py-5 text-muted-foreground">
              <Search className="size-6 mb-1.5 opacity-30" />
              <p className="text-[12px]">Type at least 2 characters to search</p>
            </div>
          )}

          {!loading && results.map((group) => (
            <div key={group.heading}>
              <div className="px-3 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {group.heading}
                </span>
              </div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-accent/50 transition-colors"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium truncate">{item.title}</p>
                    {item.subtitle && (
                      <p className="text-[10px] text-muted-foreground truncate">{item.subtitle}</p>
                    )}
                  </div>
                  {item.badge && (
                    <Badge variant="secondary" className="text-[9px] font-semibold shrink-0 rounded-md px-1.5 py-0 h-4">
                      {item.badge}
                    </Badge>
                  )}
                  <ChevronRight className="size-3 text-muted-foreground/40 shrink-0" />
                </button>
              ))}
            </div>
          ))}

          {/* Footer */}
          <div className="border-t border-border/30 px-3 py-1.5 flex items-center gap-1.5">
            <div className={cn('size-1.5 rounded-full', scope === 'admin' ? 'bg-blue-500' : 'bg-emerald-500')} />
            <span className="text-[10px] text-muted-foreground/60">Searching in {config.label}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Legacy UniversalSearch export (no-op, kept for type compat) ───
export function UniversalSearch() {
  return null
}
