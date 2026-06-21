'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  FileText, Plus, Database, Download, Search, Eye, Heart, Star,
  MoreHorizontal, Edit, Trash2, StarOff, Send, Archive,
  Loader2, PenLine, AlertTriangle, ChevronLeft, ChevronRight,
  Newspaper, TrendingUp, MessageSquare,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { MobileFilterSheet, MobileFilterGroup } from '@/components/mobile-filter-sheet'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AdminStatCard, AdminStatCardGrid } from './admin-stat-card'
import { RichTextEditor } from '@/components/ui/rich-text-editor'

/* ─── Constants ─── */
const CATEGORIES = ['AI & Tech', 'Study Tips', 'Subject Guides', 'Career', 'EdTech', 'Science', 'General']

const GRADIENT_PRESETS = [
  { value: 'from-emerald-500 to-teal-600', label: 'Emerald → Teal', preview: 'bg-gradient-to-r from-emerald-500 to-teal-600' },
  { value: 'from-violet-500 to-purple-600', label: 'Violet → Purple', preview: 'bg-gradient-to-r from-violet-500 to-purple-600' },
  { value: 'from-rose-500 to-pink-600', label: 'Rose → Pink', preview: 'bg-gradient-to-r from-rose-500 to-pink-600' },
  { value: 'from-amber-500 to-orange-600', label: 'Amber → Orange', preview: 'bg-gradient-to-r from-amber-500 to-orange-600' },
  { value: 'from-cyan-500 to-blue-600', label: 'Cyan → Blue', preview: 'bg-gradient-to-r from-cyan-500 to-blue-600' },
  { value: 'from-teal-500 to-emerald-600', label: 'Teal → Emerald', preview: 'bg-gradient-to-r from-teal-500 to-emerald-600' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'most_viewed', label: 'Most Viewed' },
  { value: 'most_liked', label: 'Most Liked' },
]

const PAGE_SIZES = [10, 20, 50]

/* ─── Types ─── */
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
  authorId: string
  authorName: string
  authorAvatar: string | null
  authorBio: string | null
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
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  author?: {
    id: string
    name: string
    avatar: string | null
  }
}

interface BlogStats {
  total: number
  published: number
  draft: number
  archived: number
  featured: number
  totalViews: number
  totalLikes: number
}

interface PaginationInfo {
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

/* ─── Helpers ─── */
function parseTags(tagsJson: string | null | undefined): string[] {
  if (!tagsJson) return []
  try {
    const parsed = JSON.parse(tagsJson)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function safeNumber(val: unknown, fallback = 0): number {
  if (typeof val === 'number' && !isNaN(val)) return val
  if (typeof val === 'string') {
    const parsed = parseInt(val, 10)
    return isNaN(parsed) ? fallback : parsed
  }
  return fallback
}

function formatNumber(num: number | string | undefined | null): string {
  const n = safeNumber(num)
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return n.toString()
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return '—'
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'published':
      return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-0 text-[11px] font-semibold rounded-md">Published</Badge>
    case 'draft':
      return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-0 text-[11px] font-semibold rounded-md">Draft</Badge>
    case 'archived':
      return <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-0 text-[11px] font-semibold rounded-md">Archived</Badge>
    default:
      return <Badge variant="secondary" className="text-[11px] rounded-md">{status}</Badge>
  }
}

/* ─── Form State ─── */
interface PostFormData {
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  tagsInput: string
  coverImage: string
  gradient: string
  status: string
  featured: boolean
  trending: boolean
  allowComments: boolean
  readTime: string
  estimatedMinutes: number
  seoTitle: string
  seoDescription: string
}

const emptyFormData: PostFormData = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: '',
  tagsInput: '',
  coverImage: '',
  gradient: 'from-emerald-500 to-teal-600',
  status: 'draft',
  featured: false,
  trending: false,
  allowComments: true,
  readTime: '5 min read',
  estimatedMinutes: 5,
  seoTitle: '',
  seoDescription: '',
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export function AdminBlogManagement() {
  const { currentUser } = useAppStore()

  // ─── Data State ───
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [stats, setStats] = useState<BlogStats | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({ total: 0, limit: 10, offset: 0, hasMore: false })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // ─── Filter State ───
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // ─── Selection State ───
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // ─── Dialog State ───
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null)
  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null)
  const [formData, setFormData] = useState<PostFormData>(emptyFormData)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [saving, setSaving] = useState(false)

  // ─── Bulk Delete Dialog ───
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)

  /* ─── Fetch Posts ─── */
  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      if (categoryFilter && categoryFilter !== 'all') params.set('category', categoryFilter)
      if (sort) params.set('sort', sort)
      if (featuredOnly) params.set('featured', 'true')
      params.set('limit', String(pageSize))
      params.set('offset', String((currentPage - 1) * pageSize))

      const res = await fetch(`/api/admin/blog?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setPosts(data.posts || [])
      setStats(data.stats || null)
      setPagination(data.pagination || { total: 0, limit: pageSize, offset: 0, hasMore: false })
    } catch (err) {
      console.error('Fetch error:', err)
      toast.error('Failed to load blog posts')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, categoryFilter, sort, featuredOnly, pageSize, currentPage])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, categoryFilter, sort, featuredOnly, pageSize])

  /* ─── Computed ─── */
  const totalPages = Math.max(1, Math.ceil(safeNumber(pagination.total) / pageSize))
  const allSelected = posts.length > 0 && posts.every(p => selectedIds.has(p.id))

  /* ─── Handlers ─── */
  const handleSearch = useCallback((val: string) => {
    setSearch(val)
  }, [])

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleToggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(posts.map(p => p.id)))
    }
  }

  const handleSeed = async () => {
    setActionLoading('seed')
    try {
      const res = await fetch('/api/blog/seed', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Blog data seeded: ${data.created} created, ${data.skipped} skipped`)
        fetchPosts()
      } else {
        toast.error(data.error || 'Failed to seed blog data')
      }
    } catch {
      toast.error('Failed to seed blog data')
    } finally {
      setActionLoading(null)
    }
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(posts, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `blog-posts-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Blog posts exported')
  }

  const handleCreatePost = () => {
    setFormData(emptyFormData)
    setEditingPostId(null)
    setSlugManuallyEdited(false)
    setShowCreateDialog(true)
  }

  const handleEditPost = (post: BlogPost) => {
    const tags = parseTags(post.tags)
    setFormData({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      category: post.category || '',
      tagsInput: tags.join(', '),
      coverImage: post.coverImage || '',
      gradient: post.gradient || 'from-emerald-500 to-teal-600',
      status: post.status || 'draft',
      featured: post.featured || false,
      trending: post.trending || false,
      allowComments: post.allowComments ?? true,
      readTime: post.readTime || '5 min read',
      estimatedMinutes: safeNumber(post.estimatedMinutes, 5),
      seoTitle: post.seoTitle || '',
      seoDescription: post.seoDescription || '',
    })
    setEditingPostId(post.id)
    setSlugManuallyEdited(true)
    setShowEditDialog(true)
  }

  const handlePreviewPost = (post: BlogPost) => {
    setPreviewPost(post)
    setShowPreviewDialog(true)
  }

  const handleDeleteClick = (post: BlogPost) => {
    setDeleteTarget(post)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setActionLoading(deleteTarget.id)
    try {
      const res = await fetch(`/api/admin/blog/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Blog post deleted')
        fetchPosts()
        setSelectedIds(prev => {
          const next = new Set(prev)
          next.delete(deleteTarget.id)
          return next
        })
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete')
      }
    } catch {
      toast.error('Failed to delete blog post')
    } finally {
      setActionLoading(null)
      setShowDeleteDialog(false)
      setDeleteTarget(null)
    }
  }

  const handleToggleFeatured = async (post: BlogPost) => {
    setActionLoading(post.id)
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured: !post.featured }),
      })
      if (res.ok) {
        toast.success(post.featured ? 'Removed from featured' : 'Marked as featured')
        fetchPosts()
      } else {
        toast.error('Failed to update')
      }
    } catch {
      toast.error('Failed to update post')
    } finally {
      setActionLoading(null)
    }
  }

  const handleStatusChange = async (post: BlogPost, newStatus: string) => {
    setActionLoading(post.id)
    try {
      const res = await fetch(`/api/admin/blog/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        const statusLabel = newStatus === 'published' ? 'Published' : newStatus === 'draft' ? 'Moved to draft' : 'Archived'
        toast.success(statusLabel)
        fetchPosts()
      } else {
        toast.error('Failed to update status')
      }
    } catch {
      toast.error('Failed to update status')
    } finally {
      setActionLoading(null)
    }
  }

  const handleBulkAction = async (action: 'publish' | 'archive' | 'delete' | 'feature') => {
    if (selectedIds.size === 0) return

    if (action === 'delete') {
      setShowBulkDeleteDialog(true)
      return
    }

    setActionLoading('bulk')
    try {
      const updates = Array.from(selectedIds).map(id => {
        const body: Record<string, unknown> = {}
        if (action === 'publish') body.status = 'published'
        else if (action === 'archive') body.status = 'archived'
        else if (action === 'feature') body.featured = true

        return fetch(`/api/admin/blog/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      })

      await Promise.all(updates)
      toast.success(`${selectedIds.size} post(s) updated`)
      setSelectedIds(new Set())
      fetchPosts()
    } catch {
      toast.error('Bulk action failed')
    } finally {
      setActionLoading(null)
    }
  }

  const handleBulkDeleteConfirm = async () => {
    setActionLoading('bulk')
    try {
      const deletes = Array.from(selectedIds).map(id =>
        fetch(`/api/admin/blog/${id}`, { method: 'DELETE' })
      )
      await Promise.all(deletes)
      toast.success(`${selectedIds.size} post(s) deleted`)
      setSelectedIds(new Set())
      fetchPosts()
    } catch {
      toast.error('Bulk delete failed')
    } finally {
      setActionLoading(null)
      setShowBulkDeleteDialog(false)
    }
  }

  /* ─── Save Post (Create or Update) ─── */
  const handleSavePost = async (publishStatus?: string) => {
    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }
    if (!formData.category) {
      toast.error('Category is required')
      return
    }

    setSaving(true)
    try {
      const tags = formData.tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean)

      const payload: Record<string, unknown> = {
        title: formData.title.trim(),
        slug: formData.slug.trim() || generateSlug(formData.title),
        excerpt: formData.excerpt.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags,
        coverImage: formData.coverImage.trim() || null,
        gradient: formData.gradient,
        status: publishStatus || formData.status,
        featured: formData.featured,
        trending: formData.trending,
        allowComments: formData.allowComments,
        readTime: formData.readTime.trim() || '5 min read',
        estimatedMinutes: safeNumber(formData.estimatedMinutes, 5),
        seoTitle: formData.seoTitle.trim() || null,
        seoDescription: formData.seoDescription.trim() || null,
      }

      let res: Response

      if (editingPostId) {
        res = await fetch(`/api/admin/blog/${editingPostId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        payload.authorId = currentUser?.id || 'admin'
        payload.authorName = currentUser?.name || 'Admin'
        payload.authorAvatar = currentUser?.avatar || null
        payload.authorBio = null

        res = await fetch('/api/blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (res.ok) {
        toast.success(editingPostId ? 'Post updated' : 'Post created')
        setShowCreateDialog(false)
        setShowEditDialog(false)
        fetchPosts()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to save post')
      }
    } catch {
      toast.error('Failed to save post')
    } finally {
      setSaving(false)
    }
  }

  /* ─── Form Handlers ─── */
  const updateForm = <K extends keyof PostFormData>(key: K, value: PostFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
    if (key === 'title' && !slugManuallyEdited) {
      setFormData(prev => ({ ...prev, slug: generateSlug(value as string) }))
    }
  }

  const handleSlugEdit = (val: string) => {
    setSlugManuallyEdited(true)
    setFormData(prev => ({ ...prev, slug: val }))
  }

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="space-y-6"
      >
        {/* ─── Page Header ─── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
              <Newspaper className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-[28px] font-bold text-foreground">Blog Management</h1>
              <p className="text-[15px] text-muted-foreground">
                {stats ? `${stats.total} total posts · ${stats.published} published · ${stats.draft} drafts` : 'Loading stats...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button onClick={handleCreatePost} className="rounded-xl gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-sm">
              <Plus className="size-4" />
              New Post
            </Button>
            <Button variant="outline" onClick={handleSeed} disabled={actionLoading === 'seed'} className="rounded-xl gap-2">
              {actionLoading === 'seed' ? <Loader2 className="size-4 animate-spin" /> : <Database className="size-4" />}
              Seed Data
            </Button>
            <Button variant="outline" onClick={handleExport} className="rounded-xl gap-2">
              <Download className="size-4" />
              Export
            </Button>
          </div>
        </div>

        {/* ─── Stats Cards ─── */}
        {loading && !stats ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="rounded-2xl">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <AdminStatCardGrid columns={6}>
              <AdminStatCard icon={FileText} label="Total Posts" value={stats.total} color="emerald" iconBgOverride="bg-gradient-to-br from-emerald-500 to-teal-600" iconColorOverride="text-white" />
              <AdminStatCard icon={Send} label="Published" value={stats.published} color="green" iconBgOverride="bg-gradient-to-br from-green-500 to-emerald-600" iconColorOverride="text-white" valueColor="text-emerald-600 dark:text-emerald-400" />
              <AdminStatCard icon={PenLine} label="Drafts" value={stats.draft} color="amber" iconBgOverride="bg-gradient-to-br from-amber-500 to-orange-600" iconColorOverride="text-white" valueColor="text-amber-600 dark:text-amber-400" />
              <AdminStatCard icon={Archive} label="Archived" value={stats.archived} color="rose" iconBgOverride="bg-gradient-to-br from-gray-500 to-gray-600" iconColorOverride="text-white" valueColor="text-gray-600 dark:text-gray-400" />
              <AdminStatCard icon={Eye} label="Total Views" value={formatNumber(stats.totalViews)} color="cyan" iconBgOverride="bg-gradient-to-br from-cyan-500 to-teal-600" iconColorOverride="text-white" />
              <AdminStatCard icon={Heart} label="Total Likes" value={formatNumber(stats.totalLikes)} color="rose" iconBgOverride="bg-gradient-to-br from-rose-500 to-pink-600" iconColorOverride="text-white" />
            </AdminStatCardGrid>
          </motion.div>
        ) : null}

        {/* ─── Filter Bar ─── */}
        <Card className="rounded-2xl p-4">
          <div className="space-y-3">
            {/* Search + Mobile Filter Row */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative w-full md:max-w-sm md:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  className="pl-9 rounded-xl"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>

              {/* Mobile Filter Sheet */}
              <MobileFilterSheet
                activeCount={[
                  statusFilter !== 'all' ? 1 : 0,
                  categoryFilter !== 'all' ? 1 : 0,
                  sort !== 'newest' ? 1 : 0,
                  featuredOnly ? 1 : 0,
                ].reduce((a, b) => a + b, 0)}
                onClearAll={() => {
                  setStatusFilter('all')
                  setCategoryFilter('all')
                  setSort('newest')
                  setFeaturedOnly(false)
                }}
                title="Blog Filters"
              >
                <MobileFilterGroup label="Status">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="rounded-xl h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </MobileFilterGroup>

                <MobileFilterGroup label="Category">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="rounded-xl h-9">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </MobileFilterGroup>

                <MobileFilterGroup label="Sort By">
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger className="rounded-xl h-9">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </MobileFilterGroup>

                <MobileFilterGroup label="Featured">
                  <Select value={featuredOnly ? 'yes' : 'all'} onValueChange={(v) => setFeaturedOnly(v === 'yes')}>
                    <SelectTrigger className="rounded-xl h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Posts</SelectItem>
                      <SelectItem value="yes">Featured Only</SelectItem>
                    </SelectContent>
                  </Select>
                </MobileFilterGroup>
              </MobileFilterSheet>
            </div>

            {/* Desktop Filters */}
            <div className="hidden md:flex md:items-center gap-3">
              {/* Status Tabs */}
              <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
                <TabsList className="rounded-xl">
                  <TabsTrigger value="all" className="text-xs px-3 rounded-lg">All</TabsTrigger>
                  <TabsTrigger value="published" className="text-xs px-3 rounded-lg">Published</TabsTrigger>
                  <TabsTrigger value="draft" className="text-xs px-3 rounded-lg">Draft</TabsTrigger>
                  <TabsTrigger value="archived" className="text-xs px-3 rounded-lg">Archived</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px] rounded-xl">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[160px] rounded-xl">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Featured Toggle */}
              <div className="flex items-center gap-2">
                <Switch checked={featuredOnly} onCheckedChange={setFeaturedOnly} id="featured-toggle" />
                <Label htmlFor="featured-toggle" className="text-xs text-muted-foreground whitespace-nowrap">Featured only</Label>
              </div>
            </div>
          </div>
        </Card>

        {/* ─── Bulk Actions Bar ─── */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3"
            >
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                {selectedIds.size} selected
              </span>
              <Separator orientation="vertical" className="h-5" />
              <Button size="sm" variant="outline" className="rounded-lg text-xs gap-1.5" onClick={() => handleBulkAction('publish')} disabled={actionLoading === 'bulk'}>
                <Send className="size-3" /> Publish
              </Button>
              <Button size="sm" variant="outline" className="rounded-lg text-xs gap-1.5" onClick={() => handleBulkAction('archive')} disabled={actionLoading === 'bulk'}>
                <Archive className="size-3" /> Archive
              </Button>
              <Button size="sm" variant="outline" className="rounded-lg text-xs gap-1.5" onClick={() => handleBulkAction('feature')} disabled={actionLoading === 'bulk'}>
                <Star className="size-3" /> Feature
              </Button>
              <Button size="sm" variant="destructive" className="rounded-lg text-xs gap-1.5" onClick={() => handleBulkAction('delete')} disabled={actionLoading === 'bulk'}>
                <Trash2 className="size-3" /> Delete
              </Button>
              <Button size="sm" variant="ghost" className="rounded-lg text-xs ml-auto" onClick={() => setSelectedIds(new Set())}>
                Clear
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Posts Table ─── */}
        <Card className="rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            /* ─── Empty States ─── */
            <div className="flex flex-col items-center justify-center py-20 gap-5">
              {stats?.total === 0 ? (
                <>
                  <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-8 dark:from-emerald-950/20 dark:to-teal-950/20">
                    <FileText className="size-14 text-emerald-400/60 dark:text-emerald-500/40" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-[22px] font-bold">No Blog Posts Yet</h3>
                    <p className="text-[15px] text-muted-foreground max-w-md">
                      Create your first blog post to get started. You can also seed sample data to see how it looks.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreatePost} className="rounded-xl gap-2">
                      <Plus className="size-4" /> Create First Post
                    </Button>
                    <Button variant="outline" onClick={handleSeed} className="rounded-xl gap-2">
                      <Database className="size-4" /> Seed Sample Data
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-slate-50 p-8 dark:from-gray-900/20 dark:to-slate-900/20">
                    <Search className="size-14 text-gray-400/60 dark:text-gray-500/40" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-[22px] font-bold">No Posts Match Your Filters</h3>
                    <p className="text-[15px] text-muted-foreground max-w-md">
                      Try adjusting your search or filter criteria.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      setSearch('')
                      setStatusFilter('all')
                      setCategoryFilter('all')
                      setFeaturedOnly(false)
                    }}
                  >
                    Reset Filters
                  </Button>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10">
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={handleToggleAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead className="min-w-[280px]">Title & Category</TableHead>
                      <TableHead className="hidden lg:table-cell">Author</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Featured</TableHead>
                      <TableHead className="hidden md:table-cell">Views</TableHead>
                      <TableHead className="hidden lg:table-cell">Likes</TableHead>
                      <TableHead className="hidden md:table-cell">Date</TableHead>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post, idx) => {
                      const tags = parseTags(post.tags)
                      const isSelected = selectedIds.has(post.id)
                      const isLoading = actionLoading === post.id

                      return (
                        <motion.tr
                          key={post.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.02, duration: 0.2 }}
                          className={cn(
                            'group cursor-pointer transition-colors border-b border-border/40',
                            isSelected && 'bg-emerald-50/50 dark:bg-emerald-950/10',
                            'hover:bg-muted/50'
                          )}
                          onClick={() => handleEditPost(post)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleSelect(post.id)}
                              aria-label={`Select ${post.title}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-sm text-foreground line-clamp-1">{post.title}</p>
                                {post.trending && (
                                  <TrendingUp className="size-3.5 text-amber-500 shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1">{post.excerpt}</p>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Badge variant="secondary" className="text-[10px] rounded-md px-1.5 py-0 h-4 font-medium">
                                  {post.category}
                                </Badge>
                                {tags.slice(0, 3).map(tag => (
                                  <Badge key={tag} variant="outline" className="text-[10px] rounded-md px-1.5 py-0 h-4 font-normal text-muted-foreground">
                                    {tag}
                                  </Badge>
                                ))}
                                {tags.length > 3 && (
                                  <span className="text-[10px] text-muted-foreground">+{tags.length - 3}</span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <span className="text-sm text-muted-foreground">{post.authorName}</span>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {getStatusBadge(post.status)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleToggleFeatured(post)}
                                  disabled={isLoading}
                                  className={cn(
                                    'p-1 rounded-lg transition-colors',
                                    post.featured
                                      ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                                      : 'text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted'
                                  )}
                                >
                                  {isLoading ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <Star className={cn('size-4', post.featured && 'fill-current')} />
                                  )}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>{post.featured ? 'Unfeature' : 'Feature'}</TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Eye className="size-3" />
                              {formatNumber(post.viewCount)}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Heart className="size-3" />
                              {formatNumber(post.likeCount)}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                            {formatDate(post.publishedAt || post.createdAt)}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8 rounded-lg" disabled={isLoading}>
                                  {isLoading ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl">
                                <DropdownMenuItem onClick={() => handleEditPost(post)} className="gap-2 rounded-lg">
                                  <Edit className="size-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePreviewPost(post)} className="gap-2 rounded-lg">
                                  <Eye className="size-4" /> Preview
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleFeatured(post)} className="gap-2 rounded-lg">
                                  {post.featured ? <StarOff className="size-4" /> : <Star className="size-4" />}
                                  {post.featured ? 'Unfeature' : 'Feature'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {post.status !== 'published' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(post, 'published')} className="gap-2 rounded-lg">
                                    <Send className="size-4" /> Publish
                                  </DropdownMenuItem>
                                )}
                                {post.status !== 'draft' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(post, 'draft')} className="gap-2 rounded-lg">
                                    <PenLine className="size-4" /> Move to Draft
                                  </DropdownMenuItem>
                                )}
                                {post.status !== 'archived' && (
                                  <DropdownMenuItem onClick={() => handleStatusChange(post, 'archived')} className="gap-2 rounded-lg">
                                    <Archive className="size-4" /> Archive
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDeleteClick(post)} className="gap-2 rounded-lg text-destructive focus:text-destructive">
                                  <Trash2 className="size-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* ─── Pagination ─── */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    Showing {Math.min((currentPage - 1) * pageSize + 1, safeNumber(pagination.total))}–{Math.min(currentPage * pageSize, safeNumber(pagination.total))} of {safeNumber(pagination.total)} posts
                  </span>
                  <Separator orientation="vertical" className="h-4" />
                  <Select value={String(pageSize)} onValueChange={(val) => setPageSize(Number(val))}>
                    <SelectTrigger className="w-[70px] h-8 rounded-lg text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZES.map(size => (
                        <SelectItem key={size} value={String(size)}>{size}/page</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-lg"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(1)}
                  >
                    <ChevronLeft className="size-3" />
                    <ChevronLeft className="size-3 -ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-lg"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="size-3" />
                  </Button>

                  {/* Page numbers */}
                  {(() => {
                    const pages: number[] = []
                    const startPage = Math.max(1, currentPage - 2)
                    const endPage = Math.min(totalPages, currentPage + 2)
                    for (let i = startPage; i <= endPage; i++) pages.push(i)
                    return pages.map(page => (
                      <Button
                        key={page}
                        variant={page === currentPage ? 'default' : 'outline'}
                        size="icon"
                        className={cn('size-8 rounded-lg text-xs', page === currentPage && 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white')}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))
                  })()}

                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-lg"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="size-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 rounded-lg"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    <ChevronRight className="size-3" />
                    <ChevronRight className="size-3 -ml-2" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* ─── Create/Edit Post Dialog ─── */}
        <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false)
            setShowEditDialog(false)
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingPostId ? 'Edit Post' : 'Create New Post'}
              </DialogTitle>
              <DialogDescription>
                {editingPostId ? 'Update the blog post details below.' : 'Fill in the details to create a new blog post.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              {/* Title */}
              <div className="grid gap-2">
                <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                <Input
                  id="title"
                  placeholder="Enter post title..."
                  className="rounded-xl"
                  value={formData.title}
                  onChange={(e) => updateForm('title', e.target.value)}
                />
              </div>

              {/* Slug */}
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="slug"
                    placeholder="auto-generated-from-title"
                    className="rounded-xl flex-1"
                    value={formData.slug}
                    onChange={(e) => handleSlugEdit(e.target.value)}
                  />
                  {!slugManuallyEdited && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">Auto-generated</span>
                  )}
                </div>
              </div>

              {/* Excerpt */}
              <div className="grid gap-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  placeholder="Brief description of the post..."
                  className="rounded-xl min-h-[80px]"
                  value={formData.excerpt}
                  onChange={(e) => updateForm('excerpt', e.target.value)}
                />
              </div>

              {/* Content */}
              <div className="grid gap-2">
                <Label htmlFor="content">Content</Label>
                <div className="border rounded-xl overflow-hidden bg-background">
                  <RichTextEditor
                    content={formData.content}
                    onChange={(content) => updateForm('content', content)}
                  />
                </div>
              </div>

              {/* Category & Read Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Category <span className="text-destructive">*</span></Label>
                  <Select value={formData.category} onValueChange={(val) => updateForm('category', val)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="readTime">Read Time</Label>
                  <Input
                    id="readTime"
                    placeholder="e.g. 5 min read"
                    className="rounded-xl"
                    value={formData.readTime}
                    onChange={(e) => updateForm('readTime', e.target.value)}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="e.g. AI, EdTech, IB"
                  className="rounded-xl"
                  value={formData.tagsInput}
                  onChange={(e) => updateForm('tagsInput', e.target.value)}
                />
                {formData.tagsInput && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {formData.tagsInput.split(',').map((t, i) => t.trim() && (
                      <Badge key={i} variant="secondary" className="text-xs rounded-md">
                        {t.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Cover Image & Gradient */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="coverImage">Cover Image URL</Label>
                  <Input
                    id="coverImage"
                    placeholder="https://..."
                    className="rounded-xl"
                    value={formData.coverImage}
                    onChange={(e) => updateForm('coverImage', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Gradient</Label>
                  <Select value={formData.gradient} onValueChange={(val) => updateForm('gradient', val)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADIENT_PRESETS.map(g => (
                        <SelectItem key={g.value} value={g.value}>
                          <div className="flex items-center gap-2">
                            <div className={cn('size-4 rounded-full', g.preview)} />
                            <span>{g.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Gradient Preview */}
              {formData.gradient && (
                <div className="rounded-xl overflow-hidden">
                  <div className={cn('h-8 rounded-xl', `bg-gradient-to-r ${formData.gradient}`)} />
                </div>
              )}

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center justify-between rounded-xl border border-border/40 px-4 py-3">
                  <Label htmlFor="featured-toggle-form" className="text-sm cursor-pointer">Featured</Label>
                  <Switch id="featured-toggle-form" checked={formData.featured} onCheckedChange={(val) => updateForm('featured', val)} />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/40 px-4 py-3">
                  <Label htmlFor="trending-toggle-form" className="text-sm cursor-pointer">Trending</Label>
                  <Switch id="trending-toggle-form" checked={formData.trending} onCheckedChange={(val) => updateForm('trending', val)} />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/40 px-4 py-3">
                  <Label htmlFor="comments-toggle-form" className="text-sm cursor-pointer">Allow Comments</Label>
                  <Switch id="comments-toggle-form" checked={formData.allowComments} onCheckedChange={(val) => updateForm('allowComments', val)} />
                </div>
              </div>

              <Separator />

              {/* SEO Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">SEO Settings</h3>
                <div className="grid gap-2">
                  <Label htmlFor="seoTitle">SEO Title</Label>
                  <Input
                    id="seoTitle"
                    placeholder="Custom title for search engines..."
                    className="rounded-xl"
                    value={formData.seoTitle}
                    onChange={(e) => updateForm('seoTitle', e.target.value)}
                  />
                  {formData.seoTitle && (
                    <p className="text-xs text-muted-foreground">{formData.seoTitle.length}/60 characters</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="seoDescription">SEO Description</Label>
                  <Textarea
                    id="seoDescription"
                    placeholder="Meta description for search engines..."
                    className="rounded-xl min-h-[60px]"
                    value={formData.seoDescription}
                    onChange={(e) => updateForm('seoDescription', e.target.value)}
                  />
                  {formData.seoDescription && (
                    <p className="text-xs text-muted-foreground">{formData.seoDescription.length}/160 characters</p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => {
                setShowCreateDialog(false)
                setShowEditDialog(false)
              }}>
                Cancel
              </Button>
              <Button
                variant="outline"
                className="rounded-xl gap-2"
                onClick={() => handleSavePost('draft')}
                disabled={saving}
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <PenLine className="size-4" />}
                Save as Draft
              </Button>
              <Button
                className="rounded-xl gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                onClick={() => handleSavePost('published')}
                disabled={saving}
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Publish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ─── Delete Confirmation Dialog ─── */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-destructive" />
                Delete Post
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>&quot;{deleteTarget?.title}&quot;</strong>? This action cannot be undone. The post will be permanently removed from the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDeleteConfirm}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ─── Bulk Delete Confirmation Dialog ─── */}
        <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-destructive" />
                Delete {selectedIds.size} Posts
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{selectedIds.size} post(s)</strong>? This action cannot be undone. All selected posts will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleBulkDeleteConfirm}
              >
                Delete All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ─── Post Preview Dialog ─── */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">{previewPost?.title}</DialogTitle>
              <DialogDescription className="flex items-center gap-3 flex-wrap">
                <span>{previewPost?.category}</span>
                <span>·</span>
                <span>{previewPost?.authorName}</span>
                <span>·</span>
                <span>{formatDate(previewPost?.publishedAt || previewPost?.createdAt)}</span>
                <span>·</span>
                <span>{previewPost?.readTime}</span>
              </DialogDescription>
            </DialogHeader>

            {/* Gradient header */}
            <div className={cn('h-3 rounded-full', `bg-gradient-to-r ${previewPost?.gradient}`)} />

            {/* Stats row */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="size-3.5" />
                {formatNumber(previewPost?.viewCount)} views
              </div>
              <div className="flex items-center gap-1">
                <Heart className="size-3.5" />
                {formatNumber(previewPost?.likeCount)} likes
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="size-3.5" />
                {formatNumber(previewPost?.commentCount)} comments
              </div>
            </div>

            {/* Content */}
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: previewPost?.content || '<p>No content</p>' }}
            />

            {/* Tags */}
            {previewPost && parseTags(previewPost.tags).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/40">
                {parseTags(previewPost.tags).map(tag => (
                  <Badge key={tag} variant="outline" className="rounded-lg text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </TooltipProvider>
  )
}



export default AdminBlogManagement
