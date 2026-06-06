'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { PublicNav } from '@/components/public-nav'
import { motion } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  GraduationCap, ArrowRight, ArrowLeft, Clock, BookOpen, Sparkles,
  TrendingUp, Code, Calendar, Share2, Eye, Heart,
  Bookmark, Copy, Twitter, Linkedin, Check, Mail,
  Facebook, ArrowUpRight,
} from 'lucide-react'
import {
  type Article,
  categoryColors,
  getArticleById,
  getRelatedArticles,
  getArticlesByAuthor,
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

interface TocHeading {
  id: string
  text: string
  level: number
}

// ─── Constants ───────────────────────────────────────────────────────

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }

const categoryIconMap: Record<string, React.ElementType> = {
  'Study Tips': BookOpen,
  'Subject Guides': Sparkles,
  'Career': TrendingUp,
  'AI & Tech': Code,
}

type FontSize = 'small' | 'medium' | 'large'

const fontSizeConfig: Record<FontSize, { proseClass: string }> = {
  small: { proseClass: 'prose-sm' },
  medium: { proseClass: '' },
  large: { proseClass: 'prose-lg' },
}

// ─── Helpers ─────────────────────────────────────────────────────────

function parseTags(tagsJson: string | undefined | null): string[] {
  if (!tagsJson) return []
  try {
    return JSON.parse(tagsJson) as string[]
  } catch {
    return []
  }
}

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return ''
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

function injectHeadingIds(html: string): { html: string; headings: TocHeading[] } {
  const headings: TocHeading[] = []
  let counter = 0

  const result = html.replace(/<(h[23])>(.*?)<\/\1>/g, (_match, tag, text) => {
    const plainText = text.replace(/<[^>]*>/g, '')
    const id = `heading-${counter}-${plainText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
    counter++
    headings.push({ id, text: plainText, level: tag === 'h3' ? 3 : 2 })
    return `<${tag} id="${id}">${text}</${tag}>`
  })

  return { html: result, headings }
}

function staticArticleToBlogPost(article: Article): BlogPost {
  const seed = parseInt(article.id) * 371
  return {
    id: article.id,
    title: article.title,
    slug: article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    excerpt: article.excerpt,
    content: article.content,
    category: article.category,
    tags: JSON.stringify(article.tags),
    coverImage: null,
    gradient: article.gradient,
    authorId: null,
    authorName: article.author,
    authorAvatar: article.authorAvatar,
    authorBio: article.authorBio,
    status: 'published',
    featured: article.featured,
    trending: article.trending,
    allowComments: true,
    readTime: article.readTime,
    estimatedMinutes: parseInt(article.readTime) || 5,
    viewCount: (seed % 5000) + 500,
    shareCount: article.shareCount,
    likeCount: Math.floor(article.shareCount * 0.6),
    commentCount: Math.floor(article.shareCount * 0.15),
    seoTitle: article.title,
    seoDescription: article.excerpt,
    publishedAt: new Date(article.date).toISOString(),
    createdAt: new Date(article.date).toISOString(),
    updatedAt: new Date(article.date).toISOString(),
  }
}

// ─── Reading Progress Bar ────────────────────────────────────────────

function ReadingProgressBar() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight > 0) {
        setProgress((scrollTop / docHeight) * 100)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-transparent">
      <motion.div
        className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.1, ease: 'linear' }}
      />
    </div>
  )
}

// ─── Table of Contents ───────────────────────────────────────────────

function TableOfContents({ headings }: { headings: TocHeading[] }) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-100px 0px -60% 0px' }
    )

    headings.forEach((h) => {
      const el = document.getElementById(h.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings])

  const handleClick = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <nav className="space-y-0.5">
      <h4 className="text-[13px] font-semibold text-foreground mb-3 flex items-center gap-2">
        <BookOpen className="size-3.5 text-primary" />
        Table of Contents
      </h4>
      {headings.map((h) => (
        <button
          key={h.id}
          onClick={() => handleClick(h.id)}
          className={cn(
            'block w-full text-left text-[12px] leading-snug py-1.5 transition-colors rounded-md px-2',
            h.level === 3 ? 'pl-6' : 'pl-2',
            activeId === h.id
              ? 'text-primary font-medium bg-emerald-50 dark:bg-emerald-950/30'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          )}
        >
          {h.text}
        </button>
      ))}
    </nav>
  )
}

// ─── Share Buttons ───────────────────────────────────────────────────

function ShareButtons({ title, variant = 'inline' }: { title: string; variant?: 'inline' | 'sidebar' }) {
  const [copied, setCopied] = useState(false)

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}`
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`

  if (variant === 'sidebar') {
    return (
      <div className="rounded-xl bg-card border border-border/50 p-4">
        <h4 className="text-[13px] font-semibold text-foreground mb-3">Share this article</h4>
        <div className="space-y-1">
          <button
            onClick={handleCopyLink}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Twitter className="size-3.5" />
            Share on Twitter
          </a>
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Facebook className="size-3.5" />
            Share on Facebook
          </a>
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Linkedin className="size-3.5" />
            Share on LinkedIn
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopyLink}
        className="flex items-center gap-1.5 rounded-full bg-card border border-border/50 px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:border-border transition-all ios-press"
      >
        {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
        {copied ? 'Copied' : 'Copy Link'}
      </button>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-full bg-card border border-border/50 px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:border-border transition-all ios-press"
      >
        <Twitter className="size-3" />
        Twitter
      </a>
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden sm:flex items-center gap-1.5 rounded-full bg-card border border-border/50 px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:border-border transition-all ios-press"
      >
        <Linkedin className="size-3" />
        LinkedIn
      </a>
    </div>
  )
}

// ─── Action Bar (sticky below nav) ──────────────────────────────────

function ActionBar({
  post,
  liked,
  likeCount,
  onToggleLike,
  bookmarked,
  onToggleBookmark,
  fontSize,
  onFontSizeChange,
}: {
  post: BlogPost
  liked: boolean
  likeCount: number
  onToggleLike: () => void
  bookmarked: boolean
  onToggleBookmark: () => void
  fontSize: FontSize
  onFontSizeChange: (size: FontSize) => void
}) {
  return (
    <div className="sticky top-[57px] z-40 border-b border-border/30 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Like, Bookmark, Share */}
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onToggleLike}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ios-press border',
              liked
                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                : 'bg-card border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <Heart className={cn('size-3', liked && 'fill-current')} />
            {safeNumber(likeCount)}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onToggleBookmark}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ios-press border',
              bookmarked
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                : 'bg-card border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            <Bookmark className={cn('size-3', bookmarked && 'fill-current')} />
            <span className="hidden sm:inline">{bookmarked ? 'Saved' : 'Save'}</span>
          </motion.button>

          <ShareButtons title={post.title} variant="inline" />
        </div>

        {/* Right: Reading time + Font size */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Clock className="size-3" />
            {post.readTime}
          </div>

          <Separator orientation="vertical" className="h-5 hidden sm:block" />

          <div className="flex items-center gap-1 rounded-full border border-border/50 bg-card p-0.5">
            {(['small', 'medium', 'large'] as FontSize[]).map((size) => (
              <button
                key={size}
                onClick={() => onFontSizeChange(size)}
                className={cn(
                  'flex items-center justify-center size-6 rounded-full text-[10px] font-bold transition-all',
                  fontSize === size
                    ? 'bg-emerald-500 text-white'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {size === 'small' ? 'S' : size === 'medium' ? 'M' : 'L'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Article Content ─────────────────────────────────────────────────

function ArticleContent({ content, fontSize }: { content: string; fontSize: FontSize }) {
  const sizeClass = fontSizeConfig[fontSize].proseClass

  return (
    <div
      className={cn(
        'prose prose-neutral dark:prose-invert max-w-none',
        sizeClass,
        'prose-headings:font-semibold prose-headings:tracking-tight prose-headings:scroll-mt-24',
        'prose-h2:text-[22px] prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-border/30',
        'prose-h3:text-[18px] prose-h3:mt-8 prose-h3:mb-3',
        'prose-p:text-[inherit] prose-p:leading-[1.8] prose-p:text-muted-foreground',
        'prose-li:text-[inherit] prose-li:text-muted-foreground',
        'prose-strong:text-foreground prose-strong:font-semibold',
        'prose-code:text-[13px] prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none',
        'prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/30 prose-pre:rounded-xl',
        'prose-ul:my-4 prose-ol:my-4 prose-ul:space-y-2 prose-ol:space-y-2',
        'prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium',
        'prose-img:rounded-xl prose-img:shadow-md',
        'prose-blockquote:border-l-emerald-500 prose-blockquote:bg-emerald-50/50 dark:prose-blockquote:bg-emerald-950/20 prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:not-italic',
        'prose-hr:border-border/30'
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

// ─── Related Article Card ────────────────────────────────────────────

function RelatedArticleCard({ post, index }: { post: BlogPost; index: number }) {
  const { setCurrentView, setSelectedArticleId } = useAppStore()
  const Icon = categoryIconMap[post.category] || BookOpen

  const handleClick = () => {
    setSelectedArticleId(post.id)
    setCurrentView('blog-detail')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ ...springTransition, delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={handleClick}
      className="rounded-2xl ios-shadow-sm bg-card overflow-hidden group cursor-pointer"
    >
      <div className={`h-32 bg-gradient-to-br ${post.gradient} p-4 flex items-center justify-center relative overflow-hidden`}>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
        {post.trending && (
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white shadow">
            <TrendingUp className="size-2.5" /> Trending
          </div>
        )}
        <div className="relative flex size-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-white">
          <Icon className="size-6" />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge className={`rounded-full text-[10px] font-medium border-0 ${categoryColors[post.category] || ''}`}>
            {post.category}
          </Badge>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
            <Clock className="size-2.5" />
            {post.readTime}
          </span>
        </div>
        <h3 className="text-[14px] font-semibold line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="flex size-5 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[7px] font-bold text-white">
              {post.authorAvatar}
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">{post.authorName}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-0.5"><Eye className="size-2.5" />{safeNumber(post.viewCount)}</span>
            <span className="flex items-center gap-0.5"><Heart className="size-2.5" />{safeNumber(post.likeCount)}</span>
          </div>
        </div>
      </div>
    </motion.div>
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
                  <Check className="size-7 text-white" />
                </div>
                <h2 className="text-[24px] sm:text-[30px] font-bold text-white">You&apos;re Subscribed!</h2>
                <p className="mt-2 text-[15px] text-white/80 max-w-lg mx-auto">
                  Welcome aboard! You&apos;ll receive our latest articles and insights directly in your inbox.
                </p>
              </motion.div>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-1.5 text-[13px] font-medium text-white mb-5">
                  <Mail className="size-3.5" />
                  Newsletter
                </div>
                <h2 className="text-[24px] sm:text-[30px] font-bold text-white">Enjoyed this article?</h2>
                <p className="mt-2 text-[15px] text-white/80 max-w-lg mx-auto leading-relaxed">
                  Get more insights delivered to your inbox. Join thousands of learners who stay ahead with our weekly newsletter.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                    className="rounded-full h-11 text-[14px] bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30"
                  />
                  <Button
                    onClick={handleSubscribe}
                    disabled={subscribing}
                    className="rounded-full bg-white text-emerald-700 h-11 px-6 font-semibold hover:bg-white/90 ios-press shrink-0"
                  >
                    {subscribing ? 'Subscribing...' : 'Subscribe'}
                    {!subscribing && <ArrowRight className="size-3.5 ml-1" />}
                  </Button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </section>
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
            &copy; {new Date().getFullYear()} <ShijlAIBrand variant="compact" />. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

// ─── Loading Skeleton ────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <PublicNav activeView="blog" />
      <ReadingProgressBar />

      {/* Hero skeleton */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/30 via-teal-50/20 to-transparent dark:from-emerald-950/10 dark:via-teal-950/5 dark:to-transparent" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 pt-8 pb-6 sm:pt-12 sm:pb-8">
          <Skeleton className="h-8 w-32 mb-6 rounded-full" />
          <Skeleton className="h-6 w-24 mb-4 rounded-full" />
          <Skeleton className="h-10 w-full mb-2 rounded-lg" />
          <Skeleton className="h-10 w-3/4 mb-6 rounded-lg" />
          <div className="flex items-center gap-4">
            <Skeleton className="size-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>
      </section>

      <Separator />

      {/* Content skeleton */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex gap-8 lg:gap-12">
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-2/3 rounded-lg" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
            <Skeleton className="h-8 w-1/2 rounded-lg mt-8" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-4/5 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-8 w-1/2 rounded-lg mt-8" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-3/4 rounded" />
          </div>
          <div className="hidden lg:block w-64 shrink-0 space-y-6">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </section>
    </div>
  )
}

// ─── Not Found State ─────────────────────────────────────────────────

function NotFoundState() {
  const { setCurrentView } = useAppStore()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PublicNav activeView="blog" />
      <ReadingProgressBar />
      <div className="flex-1 flex flex-col items-center justify-center py-32 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springTransition}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center size-20 rounded-2xl bg-muted mb-6">
            <BookOpen className="size-10 text-muted-foreground/40" />
          </div>
          <h2 className="text-[24px] font-bold text-foreground">Article not found</h2>
          <p className="mt-2 text-[15px] text-muted-foreground max-w-md mx-auto">
            The article you are looking for does not exist or may have been removed.
          </p>
          <Button
            onClick={() => setCurrentView('blog')}
            className="mt-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white ios-press"
          >
            <ArrowLeft className="size-4 mr-1" />
            Back to Blog
          </Button>
        </motion.div>
      </div>
      <BlogFooter />
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────

export function BlogDetailView() {
  const { selectedArticleId, setCurrentView, setSelectedArticleId } = useAppStore()

  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [fontSize, setFontSize] = useState<FontSize>('medium')
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [authorPosts, setAuthorPosts] = useState<BlogPost[]>([])

  // ── Fetch article data ──────────────────────────────────────────────
  useEffect(() => {
    if (!selectedArticleId) {
      setNotFound(true)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setNotFound(false)
    const articleId = selectedArticleId

    async function fetchData() {
      try {
        const res = await fetch(`/api/blog/${articleId}`)
        if (!res.ok) {
          // Fallback to static data
          const staticArticle = getArticleById(articleId)
          if (staticArticle && !cancelled) {
            const blogPost = staticArticleToBlogPost(staticArticle)
            setPost(blogPost)
            setLikeCount(blogPost.likeCount)
          } else {
            setNotFound(true)
          }
        } else {
          const data = await res.json()
          if (!cancelled) {
            setPost(data.post)
            setLikeCount(data.post?.likeCount ?? 0)
          }
        }
      } catch {
        // Fallback to static data on network error
        const staticArticle = getArticleById(articleId)
        if (staticArticle && !cancelled) {
          const blogPost = staticArticleToBlogPost(staticArticle)
          setPost(blogPost)
          setLikeCount(blogPost.likeCount)
        } else {
          setNotFound(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [selectedArticleId])

  // ── Fetch related articles ──────────────────────────────────────────
  useEffect(() => {
    if (!post) return
    const currentPost = post

    async function fetchRelated() {
      try {
        const res = await fetch(`/api/blog?category=${encodeURIComponent(currentPost.category)}&limit=4`)
        if (res.ok) {
          const data = await res.json()
          const filtered = (data.posts as BlogPost[]).filter((p) => p.id !== currentPost.id).slice(0, 3)
          setRelatedPosts(filtered)
          return
        }
      } catch {
        // fall through to static
      }
      const staticRelated = getRelatedArticles(currentPost.id, 3)
      setRelatedPosts(staticRelated.map(staticArticleToBlogPost))
    }

    fetchRelated()
  }, [post])

  // ── Fetch author articles ───────────────────────────────────────────
  useEffect(() => {
    if (!post) return
    const currentPost = post

    async function fetchAuthorPosts() {
      try {
        const res = await fetch(`/api/blog?limit=10`)
        if (res.ok) {
          const data = await res.json()
          const filtered = (data.posts as BlogPost[])
            .filter((p) => p.id !== currentPost.id && p.authorName === currentPost.authorName)
            .slice(0, 3)
          setAuthorPosts(filtered)
          return
        }
      } catch {
        // fall through to static
      }
      const staticAuthor = getArticlesByAuthor(currentPost.authorName, currentPost.id)
      setAuthorPosts(staticAuthor.map(staticArticleToBlogPost))
    }

    fetchAuthorPosts()
  }, [post])

  // ── Reset state on article change ───────────────────────────────────
  useEffect(() => {
    setLiked(false)
    setBookmarked(false)
    setFontSize('medium')
    window.scrollTo({ top: 0 })
  }, [selectedArticleId])

  // ── Process content: inject heading IDs ─────────────────────────────
  const { contentWithIds, tocHeadings } = useMemo(() => {
    if (!post) return { contentWithIds: '', tocHeadings: [] as TocHeading[] }
    const result = injectHeadingIds(post.content)
    return { contentWithIds: result.html, tocHeadings: result.headings }
  }, [post])

  // ── Parse tags ──────────────────────────────────────────────────────
  const tagList = useMemo(() => parseTags(post?.tags), [post])

  // ── Toggle like (client-side only) ──────────────────────────────────
  const handleToggleLike = useCallback(() => {
    setLiked((prev) => {
      setLikeCount((c) => prev ? c - 1 : c + 1)
      return !prev
    })
  }, [])

  // ── Toggle bookmark ─────────────────────────────────────────────────
  const handleToggleBookmark = useCallback(() => {
    setBookmarked((prev) => {
      if (!prev) {
        toast.success('Article bookmarked!')
      }
      return !prev
    })
  }, [])

  // ── Navigate to article ─────────────────────────────────────────────
  const navigateToArticle = useCallback((id: string) => {
    setSelectedArticleId(id)
    setCurrentView('blog-detail')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [setCurrentView, setSelectedArticleId])

  // ── Loading state ───────────────────────────────────────────────────
  if (loading) return <DetailSkeleton />

  // ── Not found state ─────────────────────────────────────────────────
  if (notFound || !post) return <NotFoundState />

  const Icon = categoryIconMap[post.category] || BookOpen

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ReadingProgressBar />
      <PublicNav activeView="blog" />

      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${post.gradient} opacity-[0.07] dark:opacity-[0.04]`} />
        <div className="absolute top-0 right-[10%] w-72 h-72 rounded-full bg-emerald-200/10 dark:bg-emerald-800/5 blur-3xl" />
        <div className="absolute bottom-0 left-[5%] w-56 h-56 rounded-full bg-teal-200/10 dark:bg-teal-800/5 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 pt-8 pb-6 sm:pt-12 sm:pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ...springTransition }}
          >
            {/* Back button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView('blog')}
              className="mb-6 -ml-2 rounded-full text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back to Blog
            </Button>

            {/* Category & Featured/Trending badges */}
            <div className="flex items-center gap-3 mb-4">
              <Badge className={`rounded-full text-[11px] font-medium border-0 ${categoryColors[post.category] || ''}`}>
                <span className="mr-1">{<Icon className="inline size-3" />}</span>
                {post.category}
              </Badge>
              {post.featured && (
                <Badge className="rounded-full text-[11px] font-medium border-0 bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                  ★ Featured
                </Badge>
              )}
              {post.trending && (
                <Badge className="rounded-full text-[11px] font-medium border-0 bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                  <TrendingUp className="size-3 mr-0.5" />
                  Trending
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-[26px] sm:text-[32px] lg:text-[38px] font-bold tracking-tight leading-[1.2]">
              {post.title}
            </h1>

            {/* Author & Meta Row */}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[13px] font-bold text-white ring-2 ring-white dark:ring-background">
                  {post.authorAvatar}
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-foreground">{post.authorName}</p>
                  <p className="text-[11px] text-muted-foreground">Author</p>
                </div>
              </div>
              <Separator orientation="vertical" className="h-8 hidden sm:block" />
              <div className="flex flex-wrap items-center gap-4 text-[13px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  {formatDate(post.publishedAt)}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  {post.readTime}
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye className="size-3.5" />
                  {safeNumber(post.viewCount)}
                </div>
                <div className="flex items-center gap-1.5">
                  <Heart className="size-3.5" />
                  {safeNumber(post.likeCount)}
                </div>
                <div className="flex items-center gap-1.5">
                  <Share2 className="size-3.5" />
                  {safeNumber(post.shareCount)}
                </div>
              </div>
            </div>

            {/* Tags as pills */}
            {tagList.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {tagList.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted transition-colors"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Action Bar (sticky) ───────────────────────────────────────── */}
      <ActionBar
        post={post}
        liked={liked}
        likeCount={likeCount}
        onToggleLike={handleToggleLike}
        bookmarked={bookmarked}
        onToggleBookmark={handleToggleBookmark}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
      />

      {/* ── Content Area with Sidebar ─────────────────────────────────── */}
      <section className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex gap-8 lg:gap-12">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ...springTransition }}
            className="flex-1 min-w-0 max-w-3xl"
          >
            <ArticleContent content={contentWithIds} fontSize={fontSize} />

            {/* Bottom Action Bar */}
            <div className="mt-10 pt-6 border-t">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={handleToggleLike}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-all ios-press border',
                      liked
                        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400'
                        : 'bg-card border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
                    )}
                  >
                    <Heart className={cn('size-4', liked && 'fill-current')} />
                    {liked ? 'Liked' : 'Like'} &middot; {safeNumber(likeCount)}
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={handleToggleBookmark}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-all ios-press border',
                      bookmarked
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                        : 'bg-card border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
                    )}
                  >
                    <Bookmark className={cn('size-4', bookmarked && 'fill-current')} />
                    {bookmarked ? 'Saved' : 'Bookmark'}
                  </motion.button>
                </div>
                <ShareButtons title={post.title} variant="inline" />
              </div>
            </div>

            {/* ── Author Card ──────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ...springTransition }}
              className="mt-10 rounded-2xl bg-card border border-border/50 p-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[18px] font-bold text-white ring-2 ring-emerald-100 dark:ring-emerald-900">
                  {post.authorAvatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[17px] font-semibold">{post.authorName}</h3>
                    <Badge className="rounded-full text-[10px] font-medium border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      Author
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-[14px] text-muted-foreground leading-relaxed">{post.authorBio}</p>
                  {authorPosts.length > 0 && (
                    <div className="mt-5">
                      <p className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                        More from this author
                      </p>
                      <div className="space-y-2">
                        {authorPosts.map((a) => (
                          <button
                            key={a.id}
                            onClick={() => navigateToArticle(a.id)}
                            className="flex items-center gap-2 text-[13px] text-primary hover:underline w-full text-left group"
                          >
                            <ArrowRight className="size-3 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                            {a.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* ── Sidebar - Desktop Only ─────────────────────────────────── */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-[120px] space-y-6">
              {/* Table of Contents */}
              {tocHeadings.length > 0 && (
                <div className="rounded-xl bg-card border border-border/50 p-4">
                  <TableOfContents headings={tocHeadings} />
                </div>
              )}

              {/* Share Sidebar */}
              <ShareButtons title={post.title} variant="sidebar" />

              {/* Tags */}
              {tagList.length > 0 && (
                <div className="rounded-xl bg-card border border-border/50 p-4">
                  <h4 className="text-[13px] font-semibold text-foreground mb-3 flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary" />
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {tagList.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted transition-colors cursor-default"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Related in Sidebar (compact) */}
              {relatedPosts.length > 0 && (
                <div className="rounded-xl bg-card border border-border/50 p-4">
                  <h4 className="text-[13px] font-semibold text-foreground mb-3 flex items-center gap-2">
                    <BookOpen className="size-3.5 text-primary" />
                    Related
                  </h4>
                  <div className="space-y-3">
                    {relatedPosts.slice(0, 2).map((relPost) => {
                      const RelIcon = categoryIconMap[relPost.category] || BookOpen
                      return (
                        <button
                          key={relPost.id}
                          onClick={() => navigateToArticle(relPost.id)}
                          className="flex items-start gap-2.5 w-full text-left group"
                        >
                          <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${relPost.gradient} text-white`}>
                            <RelIcon className="size-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-medium line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                              {relPost.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{relPost.readTime}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      {/* ── Related Articles Section ──────────────────────────────────── */}
      {relatedPosts.length > 0 && (
        <section className="border-t bg-muted/30 py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ...springTransition }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="size-4 text-primary" />
                  <h2 className="text-[20px] font-bold">Related Articles</h2>
                </div>
                <button
                  onClick={() => setCurrentView('blog')}
                  className="flex items-center gap-1 text-[13px] font-medium text-primary hover:underline ios-press"
                >
                  View All <ArrowUpRight className="size-3" />
                </button>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPosts.map((relPost, i) => (
                  <RelatedArticleCard key={relPost.id} post={relPost} index={i} />
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* ── Newsletter CTA ────────────────────────────────────────────── */}
      <NewsletterSection />

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <BlogFooter />
    </div>
  )
}
