'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Star, Eye, ChevronRight, Filter, Search, X as XIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { springTransition, CATEGORY_COLORS } from './constants'
import { useCurrency } from './currency-provider'
import type { PopularCourse } from './types'

type DateRange = '7d' | '30d' | '3m' | 'all'
type EnrollmentStatus = 'all' | 'active' | 'completed' | 'dropped'

interface PopularCoursesTableProps {
  courses: PopularCourse[]
}

export function PopularCoursesTable({ courses }: PopularCoursesTableProps) {
  const { formatAmount } = useCurrency()
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [category, setCategory] = useState<string>('all')
  const [status, setStatus] = useState<EnrollmentStatus>('all')
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Client-side filtering
  const filteredCourses = useMemo(() => {
    let result = [...courses]

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.instructor.toLowerCase().includes(q)
      )
    }

    if (category !== 'all') {
      result = result.filter(c => c.category === category)
    }

    // Simulate date/status filtering (mock logic)
    if (dateRange === '7d') {
      result = result.slice(0, Math.max(3, Math.floor(result.length * 0.4)))
    } else if (dateRange === '30d') {
      result = result.slice(0, Math.max(5, Math.floor(result.length * 0.7)))
    } else if (dateRange === '3m') {
      result = result.slice(0, Math.max(7, Math.floor(result.length * 0.9)))
    }

    if (status !== 'all') {
      // Mock: show subset based on status
      if (status === 'active') result = result.filter((_, i) => i % 3 !== 2)
      if (status === 'completed') result = result.filter((_, i) => i % 3 === 0)
      if (status === 'dropped') result = result.filter((_, i) => i % 3 === 2)
    }

    return result
  }, [courses, dateRange, category, status, search])

  const activeFilterCount = [dateRange !== 'all', category !== 'all', status !== 'all', search.trim() !== ''].filter(Boolean).length

  const categories = useMemo(() => {
    const cats = new Set(courses.map(c => c.category))
    return Array.from(cats)
  }, [courses])

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, ...springTransition }}
      className="rounded-2xl ios-shadow-sm bg-card overflow-hidden"
    >
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-[17px] font-semibold flex items-center gap-2">
              <BookOpen className="size-4 text-teal-500" />
              Popular Courses
            </h3>
            <p className="text-[13px] text-muted-foreground">
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} shown
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className={`gap-1.5 rounded-xl active:scale-[0.97] ${activeFilterCount > 0 ? 'border-emerald-500 text-emerald-600' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="size-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-1 size-5 p-0 flex items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] border-0">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl active:scale-[0.97]">
              View All <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-4 rounded-xl bg-muted/30 space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-muted-foreground">Enrollment Filters</p>
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[11px] gap-1 text-emerald-600"
                  onClick={() => { setDateRange('all'); setCategory('all'); setStatus('all'); setSearch('') }}
                >
                  Clear all <XIcon className="size-3" />
                </Button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Date Range</label>
                <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
                  <SelectTrigger className="rounded-xl h-9 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="3m">Last 3 months</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="rounded-xl h-9 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Status</label>
                <Select value={status} onValueChange={(v) => setStatus(v as EnrollmentStatus)}>
                  <SelectTrigger className="rounded-xl h-9 text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="dropped">Dropped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground mb-1 block">Search Student</label>
                <div className="relative">
                  <Search className="size-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Name..."
                    className="rounded-xl h-9 text-[13px] pl-8"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="h-px bg-border/60" />
      <div className="max-h-96 overflow-y-auto scrollbar-thin">
        {/* Desktop table */}
        <div className="hidden sm:block">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr className="text-left text-[12px] text-muted-foreground">
                <th className="px-5 py-2.5 font-medium">#</th>
                <th className="px-5 py-2.5 font-medium">Title</th>
                <th className="px-5 py-2.5 font-medium">Category</th>
                <th className="px-5 py-2.5 font-medium">Instructor</th>
                <th className="px-5 py-2.5 font-medium text-right">Enrollments</th>
                <th className="px-5 py-2.5 font-medium text-center">Rating</th>
                <th className="px-5 py-2.5 font-medium text-right">Revenue</th>
                <th className="px-5 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredCourses.map((course, i) => (
                <tr key={course.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3 text-[13px] text-muted-foreground">{i + 1}</td>
                  <td className="px-5 py-3">
                    <p className="text-[14px] font-medium line-clamp-1">{course.title}</p>
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      variant="secondary"
                      className="text-[11px] rounded-xl border-0"
                      style={{
                        backgroundColor: `${CATEGORY_COLORS[course.category] || '#6b7280'}20`,
                        color: CATEGORY_COLORS[course.category] || '#6b7280',
                      }}
                    >
                      {course.category}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-[13px] text-muted-foreground line-clamp-1">{course.instructor}</td>
                  <td className="px-5 py-3 text-[14px] font-medium text-right">{course.enrollmentCount.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="size-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-[13px] font-medium">{course.rating}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[14px] font-medium text-right">{formatAmount(course.revenue)}</td>
                  <td className="px-5 py-3">
                    <Button variant="ghost" size="sm" className="gap-1 rounded-lg active:scale-[0.97] text-[12px]">
                      <Eye className="size-3.5" /> View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile list */}
        <div className="sm:hidden divide-y divide-border/40">
          {filteredCourses.map((course, i) => (
            <div key={course.id} className="px-4 py-3 hover:bg-muted/20 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground font-mono w-4">{i + 1}.</span>
                    <p className="text-[14px] font-medium line-clamp-1">{course.title}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 ml-6">
                    <Badge
                      variant="secondary"
                      className="text-[10px] rounded-lg border-0"
                      style={{
                        backgroundColor: `${CATEGORY_COLORS[course.category] || '#6b7280'}20`,
                        color: CATEGORY_COLORS[course.category] || '#6b7280',
                      }}
                    >
                      {course.category}
                    </Badge>
                    <span className="text-[12px] text-muted-foreground line-clamp-1">{course.instructor}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    <span className="text-[13px] font-medium">{course.rating}</span>
                  </div>
                  <p className="text-[12px] text-muted-foreground">{course.enrollmentCount.toLocaleString()} enrolled</p>
                  <p className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400">{formatAmount(course.revenue)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
