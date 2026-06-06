'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { PublicNav } from '@/components/public-nav'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  GraduationCap, ArrowRight, Clock, BookOpen, Sparkles,
  TrendingUp, Code, ChevronRight, Calendar, Search,
  TrendingUp as TrendingIcon, Mail, Share2, Eye, Heart,
  MessageCircle, LayoutGrid, List, X, ChevronLeft,
  ChevronRight as ChevronRightIcon, Filter, RefreshCw,
  Newspaper, Tag, PenLine, ArrowUpRight
} from 'lucide-react'
import {
  articles as staticArticles, categoryColors,
  allCategories,
} from '@/lib/blog-data'
import { toast } from 'sonner'
import { ShijlAIBrand } from '@/components/ui/brand-text'
import { ShijlAILogo } from '@/components/ui/shijlai-logo'

// ─── Types ───────────────────────────────────────────────────────────

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  tags: string
  coverImage: string | null
  gradient: string
  authorId: string | null
  authorName: string
  authorAvatar: string
  authorBio: string
  status: string
  featured: boolean
  trending: boolean
  allowComments: boolean
  readTime: string
  estimatedMinutes: number
  viewCount: number
  shareCount: number
  likeCount: number
  commentCount: number
  seoTitle: string | null
  seoDescription: string | null
  publishedAt: string
  createdAt: string
  updatedAt: string
}

interface FacetItem { name: string; count: number }
interface PaginationInfo { total: number; limit: number; offset: number; hasMore: boolean }
interface BlogResponse {
  posts: BlogPost[]
  pagination: PaginationInfo
  facets: { categories: FacetItem[]; tags: FacetItem[] }
}

// ─── Constants ───────────────────────────────────────────────────────

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

const categoryIconMap: Record<string, React.ElementType> = {
  'Study Tips': BookOpen,
  'Subject Guides': Sparkles,
  'Career': TrendingUp,
  'AI & Tech': Code,
}

const categoryGradients: Record<string, string> = {
  'Study Tips': 'from-emerald-500 to-emerald-600',
  'Subject Guides': 'from-teal-500 to-teal-600',
  'Career': 'from-amber-500 to-orange-500',
  'AI & Tech': 'from-cyan-500 to-teal-500',
}

const popularSearchTags = ['AI', 'IB', 'IELTS', 'Python', 'Study Tips', 'Career', 'AWS', 'EdTech']

const ITEMS_PER_PAGE = 9

// ─── Helpers ─────────────────────────────────────────────────────────

function parseTags(tagsJson: string): string[] {
  try {
    return JSON.parse(tagsJson) as string[]
  } catch {
    return []
  }
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function safeNumber(val: number | null | undefined): string {
  if (val == null) return '0'
  return val.toLocaleString()
}

// ─── Hero Section ────────────────────────────────────────────────────

function HeroSection({
  searchQuery,
  setSearchQuery,
}: {
  searchQuery: string
  setSearchQuery: (q: string) => void
}) {
  const [focused, setFocused] = useState(false)

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag)
  }

  return (
    <section className="relative overflow-hidden py-12 sm:py-16 lg:py-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50/30 to-transparent dark:from-emerald-950/20 dark:via-teal-950/10 dark:to-transparent" />
      {/* Decorative shapes */}
      <div className="absolute top-10 right-[10%] w-64 h-64 rounded-full bg-emerald-200/20 dark:bg-emerald-800/10 blur-3xl" />
      <div className="absolute bottom-0 left-[5%] w-48 h-48 rounded-full bg-teal-200/20 dark:bg-teal-800/10 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-100/10 dark:bg-emerald-900/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ...springTransition }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-4 py-1.5 text-[13px] font-medium text-emerald-700 dark:text-emerald-400 mb-5">
            <Newspaper className="size-3.5" />
            Blog & Resources
          </div>

          {/* Title */}
          <h1 className="text-[30px] sm:text-[38px] lg:text-[44px] font-bold tracking-tight leading-tight">
            Insights for{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              Every Learner
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-3 text-[15px] sm:text-[17px] text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Expert study tips, career guidance, and AI-powered learning insights to help you excel in your academic and professional journey
          </p>

          {/* Search Bar */}
          <div className="mt-7 max-w-lg mx-auto">
            <div className={cn(
              "relative flex items-center rounded-full bg-card border shadow-sm transition-all duration-300",
              focused
                ? "border-emerald-400 dark:border-emerald-600 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20"
                : "border-border/50"
            )}>
              <Search className="absolute left-4 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search articles, topics, or authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                className="pl-11 pr-10 rounded-full bg-transparent border-0 shadow-none h-11 text-[14px] focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center size-6 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* Popular Search Tags */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[12px] text-muted-foreground">Popular:</span>
            {popularSearchTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className="rounded-full bg-card border border-border/50 px-3 py-1 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:border-border transition-all ios-press"
              >
                {tag}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Stats Bar ───────────────────────────────────────────────────────

function StatsBar({
  totalArticles,
  activeFilters,
  sort,
  setSort,
  viewMode,
  setViewMode,
}: {
  totalArticles: number
  activeFilters: number
  sort: string
  setSort: (s: string) => void
  viewMode: 'grid' | 'list'
  setViewMode: (m: 'grid' | 'list') => void
}) {
  return (
    <div className="border-b border-border/40 bg-card/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-[13px]">
          <span className="font-medium text-foreground">
            {safeNumber(totalArticles)} article{totalArticles !== 1 ? 's' : ''}
          </span>
          {activeFilters > 0 && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Filter className="size-3" />
              {activeFilters} filter{activeFilters !== 1 ? 's' : ''} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[160px] h-8 text-[13px] rounded-lg border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="trending">Trending</SelectItem>
              <SelectItem value="most_viewed">Most Viewed</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center rounded-lg border border-border/50 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "flex items-center justify-center size-8 transition-colors",
                viewMode === 'grid' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="size-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "flex items-center justify-center size-8 transition-colors",
                viewMode === 'list' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Category & Tag Filters ──────────────────────────────────────────

function CategoryTagFilters({
  categories,
  tags,
  selectedCategory,
  setSelectedCategory,
  selectedTag,
  setSelectedTag,
}: {
  categories: FacetItem[]
  tags: FacetItem[]
  selectedCategory: string
  setSelectedCategory: (c: string) => void
  selectedTag: string
  setSelectedTag: (t: string) => void
}) {
  return (
    <section className="py-4 border-b border-border/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2 -mx-1 px-1 sm:mx-0 sm:px-0">
          <button
            onClick={() => { setSelectedCategory('All'); setSelectedTag('') }}
            className={cn(
              "whitespace-nowrap flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-all ios-press",
              selectedCategory === 'All' && !selectedTag
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white ios-shadow-sm'
                : 'bg-card ios-shadow-sm text-muted-foreground hover:text-foreground'
            )}
          >
            <BookOpen className="size-3.5" />
            All
          </button>
          {categories.map((cat) => {
            const Icon = categoryIconMap[cat.name]
            return (
              <button
                key={cat.name}
                onClick={() => { setSelectedCategory(cat.name); setSelectedTag('') }}
                className={cn(
                  "whitespace-nowrap flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-all ios-press",
                  selectedCategory === cat.name
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white ios-shadow-sm'
                    : 'bg-card ios-shadow-sm text-muted-foreground hover:text-foreground'
                )}
              >
                {Icon && <Icon className="size-3.5" />}
                {cat.name}
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  selectedCategory === cat.name
                    ? 'bg-white/20 text-white'
                    : 'bg-muted text-muted-foreground'
                )}>
                  {cat.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Tag cloud */}
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <Tag className="size-3 text-muted-foreground mr-1" />
            {tags.slice(0, 12).map((t) => (
              <button
                key={t.name}
                onClick={() => setSelectedTag(selectedTag === t.name ? '' : t.name)}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all ios-press",
                  selectedTag === t.name
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {t.name}
                <span className="ml-1 opacity-60">{t.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Featured Article Card ───────────────────────────────────────────

function FeaturedArticleCard({ post }: { post: BlogPost }) {
  const { setCurrentView, setSelectedArticleId } = useAppStore()
  const Icon = categoryIconMap[post.category] || BookOpen

  const handleClick = () => {
    setSelectedArticleId(post.id)
    setCurrentView('blog-detail')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ...springTransition }}
      onClick={handleClick}
      className="rounded-2xl ios-shadow-lg bg-card overflow-hidden cursor-pointer group"
    >
      <div className="grid lg:grid-cols-2">
        {/* Image side */}
        <div className={`h-56 sm:h-64 lg:h-auto min-h-[220px] bg-gradient-to-br ${post.gradient} p-8 flex items-center justify-center relative overflow-hidden`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
          {/* Badges */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            {post.featured && (
              <div className="flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
                <Star className="size-3" /> Featured
              </div>
            )}
            {post.trending && (
              <div className="flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
                <TrendingIcon className="size-3" /> Trending
              </div>
            )}
          </div>
          <div className="relative text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-white mx-auto">
              <Icon className="size-8" />
            </div>
            <p className="text-white/60 text-[13px] mt-3 font-medium">Featured Article</p>
          </div>
        </div>

        {/* Content side */}
        <div className="p-6 lg:p-8 flex flex-col justify-center">
          <Badge className={`w-fit rounded-full text-[11px] font-medium border-0 mb-3 ${categoryColors[post.category] || ''}`}>
            {post.category}
          </Badge>
          <h2 className="text-[20px] sm:text-[24px] font-bold leading-snug group-hover:text-primary transition-colors">
            {post.title}
          </h2>
          <p className="mt-2 text-[14px] sm:text-[15px] text-muted-foreground leading-relaxed line-clamp-3">
            {post.excerpt}
          </p>

          {/* Author & Meta */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[8px] font-bold text-white">
                {post.authorAvatar}
              </div>
              <span className="font-medium text-foreground">{post.authorName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3" />
              {formatDate(post.publishedAt)}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="size-3" />
              {post.readTime}
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="size-3" />
              {safeNumber(post.viewCount)}
            </div>
            <div className="flex items-center gap-1.5">
              <Share2 className="size-3" />
              {safeNumber(post.shareCount)}
            </div>
          </div>

          <Button className="mt-5 w-fit rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white ios-press" size="sm">
            Read Article
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Trending Section ────────────────────────────────────────────────

function TrendingSection({ posts }: { posts: BlogPost[] }) {
  const { setCurrentView, setSelectedArticleId } = useAppStore()
  const scrollRef = useState<HTMLDivElement | null>(null)

  const handleClick = (id: string) => {
    setSelectedArticleId(id)
    setCurrentView('blog-detail')
  }

  if (posts.length === 0) return null

  return (
    <section className="py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingIcon className="size-4 text-amber-500" />
            <h3 className="text-[17px] font-semibold">Trending Now</h3>
          </div>
          <button
            onClick={() => {
              /* Could trigger sort=trending */
            }}
            className="flex items-center gap-1 text-[13px] font-medium text-primary hover:underline ios-press"
          >
            See All Trending <ArrowUpRight className="size-3" />
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto scrollbar-thin pb-2 -mx-1 px-1 sm:mx-0 sm:px-0 snap-x snap-mandatory">
          {posts.map((post, i) => {
            const Icon = categoryIconMap[post.category] || BookOpen
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ...springTransition, delay: i * 0.05 }}
                onClick={() => handleClick(post.id)}
                className="min-w-[220px] max-w-[260px] snap-start shrink-0 rounded-2xl ios-shadow-sm bg-card overflow-hidden group cursor-pointer"
              >
                {/* Mini thumbnail */}
                <div className={`h-24 bg-gradient-to-br ${post.gradient} p-3 flex items-center justify-center relative`}>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-white">
                    <Icon className="size-4" />
                  </div>
                </div>
                <div className="p-3">
                  <Badge className={`rounded-full text-[9px] font-medium border-0 mb-1.5 ${categoryColors[post.category] || ''}`}>
                    {post.category}
                  </Badge>
                  <h4 className="text-[13px] font-semibold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {post.title}
                  </h4>
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Clock className="size-2.5" />{post.readTime}</span>
                    <span className="flex items-center gap-0.5"><Eye className="size-2.5" />{safeNumber(post.viewCount)}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── Grid Article Card ───────────────────────────────────────────────

function GridArticleCard({ post, index }: { post: BlogPost; index: number }) {
  const { setCurrentView, setSelectedArticleId } = useAppStore()
  const Icon = categoryIconMap[post.category] || BookOpen

  const handleClick = () => {
    setSelectedArticleId(post.id)
    setCurrentView('blog-detail')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ ...springTransition, delay: index * 0.04 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={handleClick}
      className="rounded-2xl ios-shadow-sm bg-card overflow-hidden group cursor-pointer relative"
    >
      {/* Badges */}
      {post.trending && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
          <TrendingIcon className="size-3" />
          Trending
        </div>
      )}
      {post.featured && !post.trending && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg">
          <Star className="size-3" />
          Featured
        </div>
      )}

      {/* Thumbnail with Gradient */}
      <div className={`h-36 bg-gradient-to-br ${post.gradient} p-4 flex items-center justify-center relative overflow-hidden`}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
        <div className="relative flex flex-col items-center gap-2">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-white">
            <Icon className="size-7" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <Badge className={`rounded-full text-[10px] font-medium border-0 ${categoryColors[post.category] || ''}`}>
            {post.category}
          </Badge>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Clock className="size-2.5" />
            {post.readTime}
          </span>
        </div>
        <h3 className="text-[15px] font-semibold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        <p className="mt-1.5 text-[13px] text-muted-foreground line-clamp-2">{post.excerpt}</p>

        {/* Author & Meta */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[9px] font-bold text-white">
              {post.authorAvatar}
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">{post.authorName}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-0.5" title="Views">
              <Eye className="size-2.5" />
              {safeNumber(post.viewCount)}
            </span>
            <span className="flex items-center gap-0.5" title="Likes">
              <Heart className="size-2.5" />
              {safeNumber(post.likeCount)}
            </span>
            <span className="flex items-center gap-0.5" title="Shares">
              <Share2 className="size-2.5" />
              {safeNumber(post.shareCount)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── List Article Card ───────────────────────────────────────────────

function ListArticleCard({ post, index }: { post: BlogPost; index: number }) {
  const { setCurrentView, setSelectedArticleId } = useAppStore()
  const Icon = categoryIconMap[post.category] || BookOpen
  const tagList = parseTags(post.tags)

  const handleClick = () => {
    setSelectedArticleId(post.id)
    setCurrentView('blog-detail')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ ...springTransition, delay: index * 0.03 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      onClick={handleClick}
      className="rounded-2xl ios-shadow-sm bg-card overflow-hidden group cursor-pointer flex flex-col sm:flex-row"
    >
      {/* Thumbnail */}
      <div className={`sm:w-56 md:w-64 lg:w-72 shrink-0 h-40 sm:h-auto bg-gradient-to-br ${post.gradient} p-4 flex items-center justify-center relative overflow-hidden`}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          {post.trending && (
            <div className="flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white shadow">
              <TrendingIcon className="size-2.5" /> Trending
            </div>
          )}
          {post.featured && (
            <div className="flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-white shadow">
              <Star className="size-2.5" /> Featured
            </div>
          )}
        </div>
        <div className="relative flex size-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm text-white">
          <Icon className="size-7" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-2">
          <Badge className={`rounded-full text-[10px] font-medium border-0 ${categoryColors[post.category] || ''}`}>
            {post.category}
          </Badge>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Clock className="size-2.5" />
            {post.readTime}
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Calendar className="size-2.5" />
            {formatDate(post.publishedAt)}
          </span>
        </div>

        <h3 className="text-[17px] font-semibold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        <p className="mt-1.5 text-[13px] text-muted-foreground line-clamp-2 leading-relaxed">{post.excerpt}</p>

        {/* Tags */}
        {tagList.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tagList.slice(0, 3).map((t) => (
              <span key={t} className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Author & Meta */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[9px] font-bold text-white">
              {post.authorAvatar}
            </div>
            <span className="text-[12px] text-muted-foreground font-medium">{post.authorName}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-0.5" title="Views">
              <Eye className="size-3" /> {safeNumber(post.viewCount)}
            </span>
            <span className="flex items-center gap-0.5" title="Likes">
              <Heart className="size-3" /> {safeNumber(post.likeCount)}
            </span>
            <span className="flex items-center gap-0.5" title="Comments">
              <MessageCircle className="size-3" /> {safeNumber(post.commentCount)}
            </span>
            <span className="flex items-center gap-0.5" title="Shares">
              <Share2 className="size-3" /> {safeNumber(post.shareCount)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Pagination ──────────────────────────────────────────────────────

function BlogPagination({
  pagination,
  currentPage,
  setCurrentPage,
}: {
  pagination: PaginationInfo
  currentPage: number
  setCurrentPage: (p: number) => void
}) {
  const totalPages = Math.ceil(pagination.total / pagination.limit)
  if (totalPages <= 1) return null

  const startItem = pagination.offset + 1
  const endItem = Math.min(pagination.offset + pagination.limit, pagination.total)

  const getPages = () => {
    const pages: (number | 'ellipsis')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('ellipsis')
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i)
      }
      if (currentPage < totalPages - 2) pages.push('ellipsis')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
      <p className="text-[13px] text-muted-foreground">
        Showing {startItem}–{endItem} of {safeNumber(pagination.total)} articles
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex items-center justify-center size-9 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors disabled:opacity-40 disabled:pointer-events-none ios-press"
        >
          <ChevronLeft className="size-4" />
        </button>

        {getPages().map((page, idx) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="flex items-center justify-center size-9 text-[13px] text-muted-foreground">...</span>
          ) : (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={cn(
                "flex items-center justify-center size-9 rounded-lg text-[13px] font-medium transition-all ios-press",
                currentPage === page
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white ios-shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="flex items-center justify-center size-9 rounded-lg border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors disabled:opacity-40 disabled:pointer-events-none ios-press"
        >
          <ChevronRightIcon className="size-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Newsletter Section ──────────────────────────────────────────────

function NewsletterSection() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  const handleSubscribe = () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }
    setSubscribing(true)
    // Simulate API call
    setTimeout(() => {
      setSubscribed(true)
      setEmail('')
      setSubscribing(false)
      toast.success('Successfully subscribed to the newsletter!')
      setTimeout(() => setSubscribed(false), 5000)
    }, 800)
  }

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ...springTransition }}
          className="relative rounded-2xl overflow-hidden ios-shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />

          <div className="relative px-6 py-10 sm:px-12 sm:py-14 text-center">
            {subscribed ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={springTransition}
              >
                <div className="inline-flex items-center justify-center size-14 rounded-full bg-white/20 backdrop-blur-sm mb-4">
                  <svg className="size-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-[24px] sm:text-[30px] font-bold text-white">You&apos;re Subscribed!</h2>
                <p className="mt-2 text-[15px] text-white/80 max-w-lg mx-auto">
                  Welcome aboard! You&apos;ll receive our latest insights and study tips every week.
                </p>
              </motion.div>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-1.5 text-[13px] font-medium text-white mb-4">
                  <Mail className="size-3.5" />
                  Newsletter
                </div>
                <h2 className="text-[24px] sm:text-[30px] font-bold text-white">
                  Stay Ahead in Your Learning
                </h2>
                <p className="mt-2 text-[15px] text-white/80 max-w-lg mx-auto">
                  Get the latest study tips, career guides, and AI-powered learning insights delivered to your inbox every week.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-full bg-white/20 backdrop-blur-sm border-white/30 text-white placeholder:text-white/60 h-11 text-[14px]"
                    onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                  />
                  <Button
                    onClick={handleSubscribe}
                    disabled={subscribing}
                    className="rounded-full bg-white text-emerald-700 font-semibold hover:bg-white/90 h-11 px-6 ios-press shrink-0"
                  >
                    {subscribing ? 'Subscribing...' : 'Subscribe'}
                    {!subscribing && <ArrowRight className="size-3.5" />}
                  </Button>
                </div>
                <p className="mt-3 text-[11px] text-white/50">No spam. Unsubscribe at any time.</p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────

function EmptyState({
  searchQuery,
  onClearFilters,
}: {
  searchQuery: string
  onClearFilters: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springTransition}
      className="py-20 text-center"
    >
      <div className="inline-flex items-center justify-center size-20 rounded-2xl bg-muted/50 mb-5">
        <PenLine className="size-9 text-muted-foreground/40" />
      </div>
      <h3 className="text-[20px] font-semibold">No articles found</h3>
      <p className="mt-2 text-[14px] text-muted-foreground max-w-md mx-auto">
        {searchQuery
          ? `We couldn't find any articles matching "${searchQuery}". Try adjusting your search or filters.`
          : "No articles match your current filters. Try removing some filters to see more results."
        }
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onClearFilters}
          className="rounded-full ios-press"
        >
          <RefreshCw className="size-3.5" />
          Try Different Filters
        </Button>
        <Button
          size="sm"
          onClick={onClearFilters}
          className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white ios-press"
        >
          <BookOpen className="size-3.5" />
          Browse All Articles
        </Button>
      </div>
    </motion.div>
  )
}

// ─── Loading Skeletons ───────────────────────────────────────────────

function GridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-card overflow-hidden ios-shadow-sm">
          <Skeleton className="h-36 w-full rounded-none" />
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3 w-8" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-card overflow-hidden ios-shadow-sm flex flex-col sm:flex-row">
          <Skeleton className="sm:w-64 h-40 sm:h-auto w-full rounded-none" />
          <div className="flex-1 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Footer ──────────────────────────────────────────────────────────

function BlogFooter() {
  const { setCurrentView } = useAppStore()

  return (
    <footer className="border-t bg-card/50 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShijlAILogo size="xs" className="shrink-0" />
            <span className="text-[13px] font-semibold text-foreground"><ShijlAIBrand variant="compact" /></span>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: 'Home', view: 'landing' as const },
              { label: 'Courses', view: 'public-courses' as const },
              { label: 'About', view: 'about' as const },
              { label: 'Contact', view: 'about' as const },
            ].map((link) => (
              <button
                key={link.label}
                onClick={() => setCurrentView(link.view)}
                className="text-[13px] text-muted-foreground hover:text-foreground transition-colors ios-press"
              >
                {link.label}
              </button>
            ))}
          </div>
          <p className="text-[12px] text-muted-foreground">
            © {new Date().getFullYear()} <ShijlAIBrand variant="compact" />. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── Star Icon (inline to avoid import conflict) ─────────────────────

function Star(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

// ─── Main BlogView ───────────────────────────────────────────────────

export function BlogView() {
  // State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedTag, setSelectedTag] = useState('')
  const [sort, setSort] = useState('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)

  // API data
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({ total: 0, limit: ITEMS_PER_PAGE, offset: 0, hasMore: false })
  const [facets, setFacets] = useState<{ categories: FacetItem[]; tags: FacetItem[] }>({ categories: [], tags: [] })

  // Fetched featured & trending from separate API calls
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null)
  const [trendingPosts, setTrendingPosts] = useState<BlogPost[]>([])

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, selectedCategory, selectedTag, sort])

  // Count active filters
  const activeFilters = useMemo(() => {
    let count = 0
    if (selectedCategory !== 'All') count++
    if (selectedTag) count++
    if (debouncedSearch) count++
    if (sort !== 'newest') count++
    return count
  }, [selectedCategory, selectedTag, debouncedSearch, sort])

  // Fetch main posts
  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('status', 'published')
      params.set('limit', String(ITEMS_PER_PAGE))
      params.set('offset', String((currentPage - 1) * ITEMS_PER_PAGE))
      params.set('sort', sort)

      if (debouncedSearch) params.set('search', debouncedSearch)
      if (selectedCategory !== 'All') params.set('category', selectedCategory)
      if (selectedTag) params.set('tag', selectedTag)

      const res = await fetch(`/api/blog?${params.toString()}`)
      if (res.ok) {
        const data: BlogResponse = await res.json()
        if (data.posts && data.posts.length > 0) {
          setPosts(data.posts)
          setPagination(data.pagination)
          setFacets(data.facets)
        } else {
          // Fallback to static data
          applyStaticFallback()
        }
      } else {
        applyStaticFallback()
      }
    } catch {
      applyStaticFallback()
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, selectedCategory, selectedTag, sort, currentPage])

  // Fetch featured
  const fetchFeatured = useCallback(async () => {
    try {
      const res = await fetch('/api/blog?featured=true&limit=1')
      if (res.ok) {
        const data: BlogResponse = await res.json()
        if (data.posts && data.posts.length > 0) {
          setFeaturedPost(data.posts[0])
        }
      }
    } catch { /* ignore */ }
  }, [])

  // Fetch trending
  const fetchTrending = useCallback(async () => {
    try {
      const res = await fetch('/api/blog?sort=trending&limit=6')
      if (res.ok) {
        const data: BlogResponse = await res.json()
        if (data.posts && data.posts.length > 0) {
          setTrendingPosts(data.posts)
        }
      }
    } catch { /* ignore */ }
  }, [])

  // Static fallback
  function applyStaticFallback() {
    let filtered = staticArticles.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      excerpt: a.excerpt,
      content: a.content,
      category: a.category,
      tags: JSON.stringify(a.tags),
      coverImage: null,
      gradient: a.gradient,
      authorId: null,
      authorName: a.author,
      authorAvatar: a.authorAvatar,
      authorBio: a.authorBio,
      status: 'published' as const,
      featured: a.featured,
      trending: a.trending,
      allowComments: true,
      readTime: a.readTime,
      estimatedMinutes: parseInt(a.readTime) || 5,
      viewCount: a.shareCount * 3,
      shareCount: a.shareCount,
      likeCount: Math.floor(a.shareCount * 0.6),
      commentCount: Math.floor(a.shareCount * 0.15),
      seoTitle: a.title,
      seoDescription: a.excerpt,
      publishedAt: new Date(a.date).toISOString(),
      createdAt: new Date(a.date).toISOString(),
      updatedAt: new Date(a.date).toISOString(),
    }))

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      filtered = filtered.filter((p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        parseTags(p.tags).some((t) => t.toLowerCase().includes(q))
      )
    }
    if (selectedCategory !== 'All') {
      filtered = filtered.filter((p) => p.category === selectedCategory)
    }
    if (selectedTag) {
      filtered = filtered.filter((p) => parseTags(p.tags).some((t) => t.toLowerCase() === selectedTag.toLowerCase()))
    }

    // Sort
    if (sort === 'popular') filtered.sort((a, b) => b.likeCount - a.likeCount)
    else if (sort === 'trending') filtered.sort((a, b) => b.shareCount - a.shareCount)
    else if (sort === 'most_viewed') filtered.sort((a, b) => b.viewCount - a.viewCount)

    const total = filtered.length
    const offset = (currentPage - 1) * ITEMS_PER_PAGE
    const paginated = filtered.slice(offset, offset + ITEMS_PER_PAGE)

    setPosts(paginated)
    setPagination({ total, limit: ITEMS_PER_PAGE, offset, hasMore: offset + ITEMS_PER_PAGE < total })

    // Compute facets
    const catMap: Record<string, number> = {}
    const tagMap: Record<string, number> = {}
    filtered.forEach((p) => {
      catMap[p.category] = (catMap[p.category] || 0) + 1
      parseTags(p.tags).forEach((t) => { tagMap[t] = (tagMap[t] || 0) + 1 })
    })
    setFacets({
      categories: Object.entries(catMap).map(([name, count]) => ({ name, count })),
      tags: Object.entries(tagMap).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
    })

    // Featured & trending from static
    const featured = staticArticles.find((a) => a.featured)
    if (featured) {
      setFeaturedPost({
        id: featured.id,
        title: featured.title,
        slug: featured.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        excerpt: featured.excerpt,
        content: featured.content,
        category: featured.category,
        tags: JSON.stringify(featured.tags),
        coverImage: null,
        gradient: featured.gradient,
        authorId: null,
        authorName: featured.author,
        authorAvatar: featured.authorAvatar,
        authorBio: featured.authorBio,
        status: 'published',
        featured: true,
        trending: featured.trending,
        allowComments: true,
        readTime: featured.readTime,
        estimatedMinutes: parseInt(featured.readTime) || 5,
        viewCount: featured.shareCount * 3,
        shareCount: featured.shareCount,
        likeCount: Math.floor(featured.shareCount * 0.6),
        commentCount: Math.floor(featured.shareCount * 0.15),
        seoTitle: featured.title,
        seoDescription: featured.excerpt,
        publishedAt: new Date(featured.date).toISOString(),
        createdAt: new Date(featured.date).toISOString(),
        updatedAt: new Date(featured.date).toISOString(),
      })
    }

    const trendingStatic = staticArticles.filter((a) => a.trending).slice(0, 6)
    setTrendingPosts(trendingStatic.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      excerpt: a.excerpt,
      content: a.content,
      category: a.category,
      tags: JSON.stringify(a.tags),
      coverImage: null,
      gradient: a.gradient,
      authorId: null,
      authorName: a.author,
      authorAvatar: a.authorAvatar,
      authorBio: a.authorBio,
      status: 'published',
      featured: a.featured,
      trending: true,
      allowComments: true,
      readTime: a.readTime,
      estimatedMinutes: parseInt(a.readTime) || 5,
      viewCount: a.shareCount * 3,
      shareCount: a.shareCount,
      likeCount: Math.floor(a.shareCount * 0.6),
      commentCount: Math.floor(a.shareCount * 0.15),
      seoTitle: a.title,
      seoDescription: a.excerpt,
      publishedAt: new Date(a.date).toISOString(),
      createdAt: new Date(a.date).toISOString(),
      updatedAt: new Date(a.date).toISOString(),
    })))
  }

  // Effects
  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  useEffect(() => {
    fetchFeatured()
    fetchTrending()
  }, [fetchFeatured, fetchTrending])

  // Clear filters
  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedCategory('All')
    setSelectedTag('')
    setSort('newest')
    setCurrentPage(1)
  }, [])

  // Show featured only on first page with no filters
  const showFeatured = featuredPost && currentPage === 1 && selectedCategory === 'All' && !debouncedSearch && !selectedTag

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicNav activeView="blog" />

      {/* Hero Section */}
      <HeroSection searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Stats Bar */}
      <StatsBar
        totalArticles={pagination.total}
        activeFilters={activeFilters}
        sort={sort}
        setSort={setSort}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Category & Tag Filters */}
      <CategoryTagFilters
        categories={facets.categories}
        tags={facets.tags}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedTag={selectedTag}
        setSelectedTag={setSelectedTag}
      />

      {/* Featured Article */}
      {showFeatured && (
        <section className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <FeaturedArticleCard post={featuredPost} />
          </div>
        </section>
      )}

      {/* Trending Section */}
      {trendingPosts.length > 0 && currentPage === 1 && !debouncedSearch && !selectedTag && selectedCategory === 'All' && (
        <TrendingSection posts={trendingPosts} />
      )}

      {/* Article Grid / List */}
      <section className="py-6 pb-8 flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Search result indicator */}
          {debouncedSearch && !loading && (
            <p className="text-[13px] text-muted-foreground mb-4">
              {safeNumber(pagination.total)} result{pagination.total !== 1 ? 's' : ''} for &quot;{debouncedSearch}&quot;
            </p>
          )}

          {loading ? (
            viewMode === 'grid' ? <GridSkeleton /> : <ListSkeleton />
          ) : posts.length === 0 ? (
            <EmptyState searchQuery={debouncedSearch} onClearFilters={clearFilters} />
          ) : (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={viewMode + '-' + currentPage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {viewMode === 'grid' ? (
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {posts.map((post, i) => (
                        <GridArticleCard key={post.id} post={post} index={i} />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {posts.map((post, i) => (
                        <ListArticleCard key={post.id} post={post} index={i} />
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Pagination */}
              <BlogPagination
                pagination={pagination}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            </>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <NewsletterSection />

      {/* Footer */}
      <BlogFooter />
    </div>
  )
}
