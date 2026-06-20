'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, MessageSquare, Trophy, Calendar, Star, ArrowUp, MessageCircle,
  Plus, Pin, Send, X, Search, Clock, Loader2, BookOpen, UserPlus, Eye,
  GraduationCap, CheckCircle, Bookmark, BookmarkCheck, Filter, ChevronLeft,
  Globe, Link, FileText, Video, Code, Image, ExternalLink, MapPin, UsersRound,
  Zap, Flame, Crown, Medal, Target, Settings, Share2, Flag, MoreHorizontal,
  Paperclip, Hash, Sparkles,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { InstructorStatCard, InstructorStatCardGrid } from '@/components/instructor/instructor-stat-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
  DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { Enrollment } from '@/lib/types'
import { MobileFilterSheet, MobileFilterGroup } from '@/components/mobile-filter-sheet'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DiscussionPost {
  id: string
  title: string
  content: string
  userId: string
  userName: string
  userAvatar?: string | null
  courseId: string
  courseName?: string
  lessonContext?: string
  isPinned: boolean
  upvoteCount: number
  replyCount: number
  hasUpvoted: boolean
  isBookmarked: boolean
  createdAt: string
  replies?: DiscussionReply[]
}

interface DiscussionReply {
  id: string
  content: string
  userId: string
  userName: string
  userAvatar?: string | null
  createdAt: string
}

interface StudyGroup {
  id: string
  name: string
  description: string
  emoji: string
  memberCount: number
  maxMembers?: number
  isActive: boolean
  isMember: boolean
  courseId?: string
  courseName?: string
  createdAt?: string
}

interface GroupMember {
  id: string
  name: string
  avatar: string | null
  level: number
  xp: number
  role: 'admin' | 'member'
  joinedAt: string
}

interface GroupMessage {
  id: string
  userId: string
  userName: string
  userAvatar?: string | null
  content: string
  isSystem: boolean
  isPinned: boolean
  createdAt: string
}

interface GroupResource {
  id: string
  title: string
  description: string
  type: 'link' | 'file' | 'video' | 'code' | 'image'
  url: string
  tags: string[]
  downloadCount: number
  uploadedBy: string
  createdAt: string
}

interface GroupDetail {
  id: string
  name: string
  description: string
  emoji: string
  memberCount: number
  maxMembers?: number
  isActive: boolean
  courseName?: string
  courseId?: string
  members: GroupMember[]
  recentMessages: GroupMessage[]
  resources: GroupResource[]
  stats: { totalMessages: number; totalResources: number }
}

interface CommunityEvent {
  id: string
  title: string
  description: string
  emoji: string
  type: 'workshop' | 'study-session' | 'guest-lecture' | 'hackathon' | 'meetup'
  startDate: string
  duration: number
  location?: string
  meetingUrl?: string
  maxAttendees?: number
  attendeeCount: number
  isRegistered: boolean
  isWaitlisted: boolean
  isLive: boolean
  status: 'upcoming' | 'live' | 'past'
  courseName?: string
  groupId?: string
  hostName?: string
  coverColor: string
}

interface LeaderboardEntryLocal {
  userId: string
  userName: string
  avatar: string | null
  xp: number
  level: number
  streak: number
  rank: number
  isCurrentUser?: boolean
}

interface PeerReview {
  id: string
  assignmentTitle: string
  revieweeName: string
  revieweeId: string
  submissionContent: string
  submittedAt: string
  courseName?: string
}

interface BookmarkedPost {
  id: string
  postId: string
  title: string
  content: string
  userName: string
  courseName?: string
  bookmarkedAt: string
  upvoteCount: number
  replyCount: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 25 }
const springGentle = { type: 'spring' as const, stiffness: 300, damping: 25 }
const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 } }

const TABS = [
  { id: 'discussions', label: 'Discussions', icon: MessageSquare },
  { id: 'groups', label: 'Study Groups', icon: Users },
  { id: 'events', label: 'Events', icon: Calendar },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'reviews', label: 'Peer Reviews', icon: Star },
  { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
] as const

type TabId = (typeof TABS)[number]['id']
type GroupDetailTab = 'chat' | 'members' | 'resources' | 'events'

const EMOJI_OPTIONS = ['🐍', '🌐', '💻', '📊', '🧮', '🎨', '📝', '🔬', '🌍', '🎯', '🚀', '📚', '🧠', '💡', '🎮', '⚙️']

const EVENT_EMOJIS = ['🎓', '📖', '💻', '🏆', '🤝', '🎯', '🚀', '🎤', '🧪', '💡']
const EVENT_TYPES: CommunityEvent['type'][] = ['workshop', 'study-session', 'guest-lecture', 'hackathon', 'meetup']
const EVENT_TYPE_LABELS: Record<CommunityEvent['type'], string> = {
  'workshop': 'Workshop',
  'study-session': 'Study Session',
  'guest-lecture': 'Guest Lecture',
  'hackathon': 'Hackathon',
  'meetup': 'Meetup',
}
const EVENT_TYPE_COLORS: Record<CommunityEvent['type'], string> = {
  'workshop': 'bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300',
  'study-session': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
  'guest-lecture': 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
  'hackathon': 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300',
  'meetup': 'bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300',
}
const COVER_COLORS = ['from-emerald-500 to-teal-600', 'from-violet-500 to-purple-600', 'from-amber-500 to-orange-600', 'from-sky-500 to-blue-600', 'from-rose-500 to-pink-600', 'from-teal-500 to-cyan-600']

const RESOURCE_TYPE_ICONS: Record<GroupResource['type'], typeof FileText> = {
  link: Link,
  file: FileText,
  video: Video,
  code: Code,
  image: Image,
}

// ─── Helper Functions ─────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatNumber(num: number): string {
  if (num == null) return '0'
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`
  return String(num)
}

function getInitials(name?: string | null): string {
  if (!name || typeof name !== 'string') return '??'
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??'
}

function getLevelFromXp(xp: number): number {
  return Math.floor(xp / 500) + 1
}

// ─── Fallback Data ────────────────────────────────────────────────────────────

const FALLBACK_POSTS: DiscussionPost[] = [
  {
    id: 'pin-1', title: 'Welcome & Course Rules', content: 'Welcome to the discussion board! Please be respectful, stay on topic, and help each other learn. No spam or off-topic posts. Happy learning! 🎉',
    userId: 'instructor-1', userName: 'Ahmad Ali (Instructor)', courseId: 'course-1', courseName: 'Python Bootcamp',
    isPinned: true, upvoteCount: 45, replyCount: 12, hasUpvoted: false, isBookmarked: false,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    replies: [
      { id: 'r1', content: 'Thanks for setting this up! Excited to learn 🚀', userId: 's1', userName: 'Ali Hassan', createdAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'r2', content: 'Great community! Looking forward to discussions.', userId: 's2', userName: 'Zara H.', createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: 'post-1', title: 'Why do we need closures when we have global variables?', content: 'I understand that closures capture the outer function scope, but why not just use global variables? What are the practical benefits of closures over globals?',
    userId: 'student-2', userName: 'Ali Hassan', courseId: 'course-1', courseName: 'Python Bootcamp', lessonContext: 'Lesson 3.2',
    isPinned: false, upvoteCount: 24, replyCount: 8, hasUpvoted: false, isBookmarked: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'post-2', title: 'Sharing my calculator project — feedback welcome!', content: 'Just finished the Section 2 project. Built a calculator with history and memory functions. Would love some feedback on my code structure and error handling approach!',
    userId: 'student-3', userName: 'Zara H.', courseId: 'course-1', courseName: 'Python Bootcamp', lessonContext: 'Section 2 Project',
    isPinned: false, upvoteCount: 11, replyCount: 3, hasUpvoted: false, isBookmarked: false,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'post-3', title: 'Best resources for practicing Python besides the course?', content: 'Looking for additional practice problems and coding challenges. What sites do you recommend for a beginner who wants more hands-on practice?',
    userId: 'student-4', userName: 'Bilal Khan', courseId: 'course-1', courseName: 'Python Bootcamp',
    isPinned: false, upvoteCount: 18, replyCount: 6, hasUpvoted: true, isBookmarked: false,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'post-4', title: 'How to structure a multi-file Python project?', content: 'My projects are getting bigger and single files are hard to manage. What are the best practices for organizing code across multiple files and modules?',
    userId: 'student-5', userName: 'Usman Ali', courseId: 'course-2', courseName: 'Web Development', lessonContext: 'Module 5',
    isPinned: false, upvoteCount: 15, replyCount: 4, hasUpvoted: false, isBookmarked: true,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
  },
]

const FALLBACK_GROUPS: StudyGroup[] = [
  { id: 'group-1', name: 'Python Learners Global', description: 'Daily challenges, code sharing, pair programming sessions every weekend', emoji: '🐍', memberCount: 482, maxMembers: 500, isActive: true, isMember: true, courseName: 'Python Bootcamp' },
  { id: 'group-2', name: 'Web Dev Study Circle', description: 'Weekly project reviews every Sunday 8PM. Share your projects and get feedback!', emoji: '🌐', memberCount: 234, maxMembers: 300, isActive: true, isMember: false, courseName: 'Web Development' },
  { id: 'group-3', name: 'Data Science Explorers', description: 'Share datasets, notebooks, and ML project ideas. Monthly Kaggle competitions!', emoji: '📊', memberCount: 178, maxMembers: 250, isActive: false, isMember: false, courseName: 'Data Science' },
  { id: 'group-4', name: 'AI/ML Beginners Hub', description: 'Starting your AI journey? Join us for beginner-friendly discussions and tutorials', emoji: '🤖', memberCount: 312, maxMembers: 400, isActive: true, isMember: true, courseName: 'Machine Learning' },
  { id: 'group-5', name: 'Mobile Dev Community', description: 'React Native, Flutter, and native mobile development discussions', emoji: '📱', memberCount: 89, maxMembers: 150, isActive: true, isMember: false, courseName: 'Mobile Development' },
]

const FALLBACK_GROUP_DETAIL: GroupDetail = {
  id: 'group-1', name: 'Python Learners Global', description: 'Daily challenges, code sharing, pair programming sessions every weekend', emoji: '🐍',
  memberCount: 482, maxMembers: 500, isActive: true, courseName: 'Python Bootcamp', courseId: 'course-1',
  members: [
    { id: 'u1', name: 'Ahmad Raza', avatar: null, level: 15, xp: 6200, role: 'admin', joinedAt: '2024-01-15T10:00:00Z' },
    { id: 'u2', name: 'Fatima Sheikh', avatar: null, level: 14, xp: 5980, role: 'member', joinedAt: '2024-02-01T14:30:00Z' },
    { id: 'u3', name: 'Bilal Khan', avatar: null, level: 14, xp: 5710, role: 'member', joinedAt: '2024-02-10T09:00:00Z' },
    { id: 'u4', name: 'Zara Hussain', avatar: null, level: 13, xp: 5400, role: 'member', joinedAt: '2024-03-05T11:15:00Z' },
    { id: 'u5', name: 'Usman Ali', avatar: null, level: 13, xp: 5250, role: 'member', joinedAt: '2024-03-20T16:45:00Z' },
    { id: 'u6', name: 'Aisha Noor', avatar: null, level: 12, xp: 5100, role: 'member', joinedAt: '2024-04-01T08:30:00Z' },
  ],
  recentMessages: [
    { id: 'm1', userId: 'u1', userName: 'Ahmad Raza', content: 'Hey everyone! Who\'s up for a pair programming session tonight? 🚀', isSystem: false, isPinned: true, createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
    { id: 'm2', userId: 'u2', userName: 'Fatima Sheikh', content: 'I\'m in! What topic should we cover?', isSystem: false, isPinned: false, createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString() },
    { id: 'm3', userId: 'system', userName: 'System', content: 'Zara Hussain joined the group', isSystem: true, isPinned: false, createdAt: new Date(Date.now() - 50 * 60 * 1000).toISOString() },
    { id: 'm4', userId: 'u3', userName: 'Bilal Khan', content: 'Let\'s do decorators and generators — those are tricky!', isSystem: false, isPinned: false, createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
    { id: 'm5', userId: 'u1', userName: 'Ahmad Raza', content: 'Great idea! Decorators it is. Let\'s meet at 8PM on the discord server.', isSystem: false, isPinned: false, createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString() },
  ],
  resources: [
    { id: 'res1', title: 'Python Decorators Cheat Sheet', description: 'A comprehensive guide to Python decorators with examples', type: 'file', url: '#', tags: ['python', 'decorators'], downloadCount: 142, uploadedBy: 'Ahmad Raza', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'res2', title: 'Free Python Practice Platform', description: 'Online platform with 500+ coding challenges', type: 'link', url: '#', tags: ['practice', 'challenges'], downloadCount: 89, uploadedBy: 'Fatima Sheikh', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: 'res3', title: 'OOP Concepts Tutorial', description: 'Video walkthrough of object-oriented programming in Python', type: 'video', url: '#', tags: ['oop', 'tutorial'], downloadCount: 234, uploadedBy: 'Bilal Khan', createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
  ],
  stats: { totalMessages: 1247, totalResources: 28 },
}

const FALLBACK_EVENTS: CommunityEvent[] = [
  { id: 'ev-1', title: 'Python Workshop: Decorators Deep Dive', description: 'Hands-on workshop covering advanced decorator patterns, class decorators, and real-world use cases. Bring your laptop!', emoji: '🎓', type: 'workshop', startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), duration: 120, location: 'Room 302, CS Building', maxAttendees: 40, attendeeCount: 28, isRegistered: true, isWaitlisted: false, isLive: false, status: 'upcoming', courseName: 'Python Bootcamp', hostName: 'Dr. Sarah Khan', coverColor: COVER_COLORS[0] },
  { id: 'ev-2', title: 'Weekend Study Session: Data Structures', description: 'Collaborative study session focusing on arrays, linked lists, and trees. Perfect for exam preparation!', emoji: '📖', type: 'study-session', startDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), duration: 90, meetingUrl: 'https://meet.example.com/study-ds', maxAttendees: 25, attendeeCount: 18, isRegistered: false, isWaitlisted: false, isLive: false, status: 'upcoming', courseName: 'Data Structures', hostName: 'Ali Hassan', coverColor: COVER_COLORS[1] },
  { id: 'ev-3', title: 'Guest Lecture: AI in Healthcare', description: 'Special lecture by Dr. Amira from Stanford on how AI is transforming medical diagnostics and patient care.', emoji: '🎤', type: 'guest-lecture', startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), duration: 60, location: 'Auditorium A', meetingUrl: 'https://meet.example.com/ai-health', maxAttendees: 200, attendeeCount: 156, isRegistered: true, isWaitlisted: false, isLive: false, status: 'upcoming', hostName: 'Dr. Amira Patel', coverColor: COVER_COLORS[2] },
  { id: 'ev-4', title: 'Hackathon: Build for Education', description: '48-hour hackathon to build educational tools. Teams of 2-4. Prizes worth $5000! Sponsored by TechCorp.', emoji: '🏆', type: 'hackathon', startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), duration: 2880, location: 'Innovation Hub', maxAttendees: 100, attendeeCount: 87, isRegistered: false, isWaitlisted: false, isLive: false, status: 'upcoming', hostName: 'TechCorp', coverColor: COVER_COLORS[3] },
  { id: 'ev-5', title: 'Live Coding: Building a REST API', description: 'Live coding session — we\'ll build a REST API from scratch using FastAPI. Ask questions in real-time!', emoji: '💻', type: 'workshop', startDate: new Date(Date.now() - 15 * 60 * 1000).toISOString(), duration: 90, meetingUrl: 'https://meet.example.com/live-api', maxAttendees: 50, attendeeCount: 42, isRegistered: true, isWaitlisted: false, isLive: true, status: 'live', courseName: 'Web Development', hostName: 'Ahmad Ali', coverColor: COVER_COLORS[4] },
]

const FALLBACK_LEADERBOARD: LeaderboardEntryLocal[] = [
  { userId: 'u1', userName: 'Ahmad Raza', avatar: null, xp: 6200, level: 15, streak: 30, rank: 1 },
  { userId: 'u2', userName: 'Fatima Sheikh', avatar: null, xp: 5980, level: 14, streak: 22, rank: 2 },
  { userId: 'u3', userName: 'Bilal Khan', avatar: null, xp: 5710, level: 14, streak: 18, rank: 3 },
  { userId: 'u4', userName: 'Zara Hussain', avatar: null, xp: 5400, level: 13, streak: 15, rank: 4 },
  { userId: 'u5', userName: 'Usman Ali', avatar: null, xp: 5250, level: 13, streak: 12, rank: 5 },
  { userId: 'u6', userName: 'Aisha Noor', avatar: null, xp: 5100, level: 12, streak: 20, rank: 6 },
  { userId: 'u7', userName: 'Hamza Syed', avatar: null, xp: 4950, level: 12, streak: 9, rank: 7 },
  { userId: 'u8', userName: 'Maryam Khan', avatar: null, xp: 4800, level: 12, streak: 14, rank: 8 },
  { userId: 'u9', userName: 'Omar Farooq', avatar: null, xp: 4650, level: 11, streak: 7, rank: 9 },
  { userId: 'u10', userName: 'Hina Shahid', avatar: null, xp: 4500, level: 11, streak: 11, rank: 10 },
]

const FALLBACK_REVIEWS: PeerReview[] = [
  { id: 'review-1', assignmentTitle: 'Section 2 Assignment', revieweeName: 'Usman Khan', revieweeId: 'student-5', submissionContent: 'I built a calculator app that performs basic arithmetic operations (add, subtract, multiply, divide) along with memory functions (M+, M-, MR, MC). The code uses a class-based structure with methods for each operation. Error handling includes division by zero checks and invalid input validation.', submittedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), courseName: 'Python Bootcamp' },
  { id: 'review-2', assignmentTitle: 'String Manipulation Exercise', revieweeName: 'Aisha Noor', revieweeId: 'student-6', submissionContent: 'Created functions for string reversal, palindrome checking, and anagram detection. Used Python slicing and collections.Counter for efficient implementations. All test cases pass including edge cases like empty strings and single characters.', submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), courseName: 'Python Bootcamp' },
  { id: 'review-3', assignmentTitle: 'Web Scraping Project', revieweeName: 'Hamza Syed', revieweeId: 'student-7', submissionContent: 'Built a web scraper using BeautifulSoup that extracts product information from an e-commerce site. Includes rate limiting, error handling, and data export to CSV. Scraped 500+ products successfully.', submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), courseName: 'Web Development' },
]

const FALLBACK_BOOKMARKS: BookmarkedPost[] = [
  { id: 'bm-1', postId: 'post-1', title: 'Why do we need closures when we have global variables?', content: 'I understand that closures capture the outer function scope, but why not just use global variables? What are the practical benefits?', userName: 'Ali Hassan', courseName: 'Python Bootcamp', bookmarkedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), upvoteCount: 24, replyCount: 8 },
  { id: 'bm-2', postId: 'post-4', title: 'How to structure a multi-file Python project?', content: 'My projects are getting bigger and single files are hard to manage. What are the best practices for organizing code across multiple files?', userName: 'Usman Ali', courseName: 'Web Development', bookmarkedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), upvoteCount: 15, replyCount: 4 },
  { id: 'bm-3', postId: 'ext-1', title: 'Advanced List Comprehensions Tips', content: 'Sharing some advanced techniques for list comprehensions including nested comprehensions, conditional expressions, and performance comparisons with loops.', userName: 'Sara Ahmed', courseName: 'Python Bootcamp', bookmarkedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), upvoteCount: 32, replyCount: 7 },
]

// ─── Skeleton Components ─────────────────────────────────────────────────────

function PostSkeleton() {
  return (
    <div className="rounded-2xl ios-shadow-sm bg-card p-4 space-y-3">
      <div className="flex items-center gap-3"><Skeleton className="size-9 rounded-full" /><div className="space-y-1.5 flex-1"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-28" /></div></div>
      <Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3" />
      <div className="flex gap-3 pt-1"><Skeleton className="h-7 w-16 rounded-full" /><Skeleton className="h-7 w-16 rounded-full" /></div>
    </div>
  )
}

function GroupSkeleton() {
  return (
    <div className="rounded-2xl ios-shadow-sm bg-card p-5 space-y-3">
      <div className="flex items-center gap-3"><Skeleton className="size-10 rounded-xl" /><div className="space-y-1.5 flex-1"><Skeleton className="h-5 w-40" /><Skeleton className="h-3 w-24" /></div></div>
      <Skeleton className="h-4 w-full" />
      <div className="flex gap-2"><Skeleton className="h-8 w-20 rounded-full" /><Skeleton className="h-8 w-28 rounded-full" /></div>
    </div>
  )
}

function EventSkeleton() {
  return (
    <div className="rounded-2xl ios-shadow-sm bg-card overflow-hidden">
      <div className="flex"><Skeleton className="w-1.5 min-h-full" /><div className="p-4 space-y-3 flex-1"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-full" /><div className="flex gap-2"><Skeleton className="h-6 w-20 rounded-full" /><Skeleton className="h-6 w-24 rounded-full" /></div></div></div>
    </div>
  )
}

function LeaderboardSkeleton() {
  return (
    <div className="rounded-2xl ios-shadow-sm bg-card p-5 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3"><Skeleton className="size-8 rounded-full" /><Skeleton className="size-9 rounded-full" /><div className="space-y-1.5 flex-1"><Skeleton className="h-4 w-28" /><Skeleton className="h-2 w-full" /></div><Skeleton className="h-5 w-16" /></div>
      ))}
    </div>
  )
}

function ReviewSkeleton() {
  return (
    <div className="rounded-2xl ios-shadow-sm bg-card p-5 space-y-3"><Skeleton className="h-5 w-48" /><Skeleton className="h-4 w-32" /><Skeleton className="h-16 w-full" /><Skeleton className="h-8 w-28 rounded-full" /></div>
  )
}

// ─── Star Rating Component ────────────────────────────────────────────────────

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" disabled={readonly}
          className={cn('transition-colors', readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 active:scale-95')}
          onMouseEnter={() => !readonly && setHovered(star)} onMouseLeave={() => !readonly && setHovered(0)}
          onClick={() => onChange?.(star)}
        >
          <Star className={cn('size-6 transition-colors', star <= (hovered || value) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')} />
        </button>
      ))}
    </div>
  )
}

// ─── XP Bar Component ─────────────────────────────────────────────────────────

function XPBar({ xp, maxXP }: { xp: number; maxXP: number }) {
  const pct = maxXP > 0 ? Math.min((xp / maxXP) * 100, 100) : 0
  return (
    <div className="h-2.5 rounded-full bg-muted/50 overflow-hidden flex-1 max-w-[200px]">
      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
    </div>
  )
}



// ─── Main Component ──────────────────────────────────────────────────────────

export function CommunityView() {
  const { currentUser, enrollments } = useAppStore()

  // ─── Tab state ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabId>('discussions')

  // ─── Discussion states ──────────────────────────────────────────────────
  const [posts, setPosts] = useState<DiscussionPost[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'upvoted' | 'commented'>('newest')
  const [newPostOpen, setNewPostOpen] = useState(false)
  const [newPostTitle, setNewPostTitle] = useState('')
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostLessonCtx, setNewPostLessonCtx] = useState('')
  const [newPostSubmitting, setNewPostSubmitting] = useState(false)
  const [threadOpen, setThreadOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<DiscussionPost | null>(null)
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({})
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [threadReplyText, setThreadReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)

  // ─── Study Group states ─────────────────────────────────────────────────
  const [groups, setGroups] = useState<StudyGroup[]>([])
  const [groupsLoading, setGroupsLoading] = useState(true)
  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')
  const [newGroupEmoji, setNewGroupEmoji] = useState('📚')
  const [newGroupMaxMembers, setNewGroupMaxMembers] = useState('50')
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [joiningGroup, setJoiningGroup] = useState<string | null>(null)

  // ─── Study Group Detail ─────────────────────────────────────────────────
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [groupDetail, setGroupDetail] = useState<GroupDetail | null>(null)
  const [groupDetailLoading, setGroupDetailLoading] = useState(false)
  const [groupDetailTab, setGroupDetailTab] = useState<GroupDetailTab>('chat')
  const [chatMessage, setChatMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([])
  const [groupResources, setGroupResources] = useState<GroupResource[]>([])
  const [newResourceOpen, setNewResourceOpen] = useState(false)
  const [newResTitle, setNewResTitle] = useState('')
  const [newResDesc, setNewResDesc] = useState('')
  const [newResType, setNewResType] = useState<GroupResource['type']>('link')
  const [newResUrl, setNewResUrl] = useState('')
  const [newResTags, setNewResTags] = useState('')
  const [addingResource, setAddingResource] = useState(false)

  // ─── Events states ──────────────────────────────────────────────────────
  const [events, setEvents] = useState<CommunityEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventStatusFilter, setEventStatusFilter] = useState<'upcoming' | 'live' | 'all'>('upcoming')
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all')
  const [createEventOpen, setCreateEventOpen] = useState(false)
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventDesc, setNewEventDesc] = useState('')
  const [newEventType, setNewEventType] = useState<CommunityEvent['type']>('workshop')
  const [newEventEmoji, setNewEventEmoji] = useState('🎓')
  const [newEventStartDate, setNewEventStartDate] = useState('')
  const [newEventStartTime, setNewEventStartTime] = useState('')
  const [newEventDuration, setNewEventDuration] = useState('60')
  const [newEventLocation, setNewEventLocation] = useState('')
  const [newEventMeetingUrl, setNewEventMeetingUrl] = useState('')
  const [newEventMaxAttendees, setNewEventMaxAttendees] = useState('')
  const [creatingEvent, setCreatingEvent] = useState(false)
  const [rsvpLoading, setRsvpLoading] = useState<string | null>(null)

  // ─── Leaderboard states ─────────────────────────────────────────────────
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntryLocal[]>([])
  const [lbLoading, setLbLoading] = useState(true)
  const [lbPeriod, setLbPeriod] = useState<'week' | 'month' | 'all'>('week')
  const [lbCourseId, setLbCourseId] = useState<string>('all')

  // ─── Peer Review states ─────────────────────────────────────────────────
  const [reviews, setReviews] = useState<PeerReview[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [selectedReview, setSelectedReview] = useState<PeerReview | null>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewFeedback, setReviewFeedback] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  // ─── Bookmarks states ───────────────────────────────────────────────────
  const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>([])
  const [bookmarksLoading, setBookmarksLoading] = useState(true)

  // ─── Derived data ───────────────────────────────────────────────────────
  const enrolledCourses = useMemo(() =>
    enrollments.map((e: Enrollment & { course?: { id: string; title: string } }) => ({
      id: e.courseId,
      title: e.course?.title || 'Unknown Course',
    })), [enrollments])

  const myGroupCount = useMemo(() => groups.filter(g => g.isMember).length, [groups])
  const upcomingEventCount = useMemo(() => events.filter(e => e.status === 'upcoming' || e.isLive).length, [events])
  const maxLeaderboardXp = useMemo(() => leaderboard.length > 0 ? Math.max(...leaderboard.map(e => e.xp)) : 1, [leaderboard])

  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q))
    }
    switch (sortOrder) {
      case 'upvoted': return [...filtered].sort((a, b) => b.upvoteCount - a.upvoteCount)
      case 'commented': return [...filtered].sort((a, b) => b.replyCount - a.replyCount)
      default: return [...filtered].sort((a, b) => { if (a.isPinned && !b.isPinned) return -1; if (!a.isPinned && b.isPinned) return 1; return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() })
    }
  }, [posts, searchQuery, sortOrder])

  const filteredEvents = useMemo(() => {
    let filtered = events
    if (eventStatusFilter !== 'all') {
      if (eventStatusFilter === 'live') filtered = filtered.filter(e => e.isLive || e.status === 'live')
      else if (eventStatusFilter === 'upcoming') filtered = filtered.filter(e => e.status === 'upcoming')
    }
    if (eventTypeFilter !== 'all') filtered = filtered.filter(e => e.type === eventTypeFilter)
    return filtered
  }, [events, eventStatusFilter, eventTypeFilter])

  // ─── Data Fetching ──────────────────────────────────────────────────────

  const fetchPosts = useCallback(async () => {
    if (!currentUser) return
    setPostsLoading(true)
    try {
      const params = new URLSearchParams({ userId: currentUser.id })
      if (selectedCourseId && selectedCourseId !== 'all') params.set('courseId', selectedCourseId)
      const res = await fetch(`/api/student/community/discussions?${params}`)
      if (res.ok) { const data = await res.json(); setPosts(Array.isArray(data.posts) ? data.posts : []) }
      else setPosts(FALLBACK_POSTS)
    } catch { setPosts(FALLBACK_POSTS) }
    finally { setPostsLoading(false) }
  }, [currentUser, selectedCourseId])

  const fetchGroups = useCallback(async () => {
    if (!currentUser) return
    setGroupsLoading(true)
    try {
      const res = await fetch(`/api/student/community/study-groups?userId=${currentUser.id}`)
      if (res.ok) { const data = await res.json(); setGroups(data.groups || data || []) }
      else { setGroups(FALLBACK_GROUPS) }
    } catch { setGroups(FALLBACK_GROUPS) }
    finally { setGroupsLoading(false) }
  }, [currentUser])

  const fetchGroupDetail = useCallback(async (groupId: string) => {
    if (!currentUser) return
    setGroupDetailLoading(true)
    try {
      const res = await fetch(`/api/student/community/study-groups/${groupId}?userId=${currentUser.id}`)
      if (res.ok) {
        const data = await res.json()
        const detail = data.group || data
        setGroupDetail(detail)
        setGroupMessages(detail.recentMessages || [])
        setGroupResources(detail.resources || [])
      } else {
        setGroupDetail(FALLBACK_GROUP_DETAIL)
        setGroupMessages(FALLBACK_GROUP_DETAIL.recentMessages)
        setGroupResources(FALLBACK_GROUP_DETAIL.resources)
      }
    } catch {
      setGroupDetail(FALLBACK_GROUP_DETAIL)
      setGroupMessages(FALLBACK_GROUP_DETAIL.recentMessages)
      setGroupResources(FALLBACK_GROUP_DETAIL.resources)
    }
    finally { setGroupDetailLoading(false) }
  }, [currentUser])

  const fetchEvents = useCallback(async () => {
    if (!currentUser) return
    setEventsLoading(true)
    try {
      const params = new URLSearchParams({ userId: currentUser.id })
      if (eventStatusFilter !== 'all') params.set('status', eventStatusFilter)
      if (eventTypeFilter !== 'all') params.set('type', eventTypeFilter)
      const res = await fetch(`/api/student/community/events?${params}`)
      if (res.ok) { const data = await res.json(); setEvents(data.events || data || []) }
      else setEvents(FALLBACK_EVENTS)
    } catch { setEvents(FALLBACK_EVENTS) }
    finally { setEventsLoading(false) }
  }, [currentUser, eventStatusFilter, eventTypeFilter])

  const fetchLeaderboard = useCallback(async () => {
    if (!currentUser) return
    setLbLoading(true)
    try {
      const params = new URLSearchParams({ userId: currentUser.id, period: lbPeriod })
      if (lbCourseId && lbCourseId !== 'all') params.set('courseId', lbCourseId)
      const res = await fetch(`/api/student/community/leaderboard?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLeaderboard(Array.isArray(data.leaderboard) ? data.leaderboard : [])
      } else {
        const userEntry: LeaderboardEntryLocal = { userId: currentUser.id, userName: currentUser.name, avatar: currentUser.avatar, xp: currentUser.xp ?? 4820, level: currentUser.level ?? 12, streak: currentUser.streak ?? 5, rank: 142, isCurrentUser: true }
        setLeaderboard([...FALLBACK_LEADERBOARD, userEntry])
      }
    } catch {
      const userEntry: LeaderboardEntryLocal = { userId: currentUser!.id, userName: currentUser!.name, avatar: currentUser!.avatar, xp: currentUser!.xp ?? 4820, level: currentUser!.level ?? 12, streak: currentUser!.streak ?? 5, rank: 142, isCurrentUser: true }
      setLeaderboard([...FALLBACK_LEADERBOARD, userEntry])
    }
    finally { setLbLoading(false) }
  }, [currentUser, lbPeriod, lbCourseId])

  const fetchReviews = useCallback(async () => {
    if (!currentUser) return
    setReviewsLoading(true)
    try {
      const res = await fetch(`/api/student/community/peer-reviews?userId=${currentUser.id}`)
      if (res.ok) { const data = await res.json(); setReviews(data.reviews || data || []) }
      else setReviews(FALLBACK_REVIEWS)
    } catch { setReviews(FALLBACK_REVIEWS) }
    finally { setReviewsLoading(false) }
  }, [currentUser])

  const fetchBookmarks = useCallback(async () => {
    if (!currentUser) return
    setBookmarksLoading(true)
    try {
      const res = await fetch(`/api/student/community/discussions/bookmarks?userId=${currentUser.id}`)
      if (res.ok) { const data = await res.json(); setBookmarks(data.bookmarks || data || []) }
      else setBookmarks(FALLBACK_BOOKMARKS)
    } catch { setBookmarks(FALLBACK_BOOKMARKS) }
    finally { setBookmarksLoading(false) }
  }, [currentUser])

  // ─── Effects for data fetching ──────────────────────────────────────────

  useEffect(() => { if (activeTab === 'discussions') fetchPosts() }, [activeTab, fetchPosts])
  useEffect(() => { if (activeTab === 'groups' && !selectedGroupId) fetchGroups() }, [activeTab, fetchGroups, selectedGroupId])
  useEffect(() => { if (activeTab === 'events') fetchEvents() }, [activeTab, fetchEvents])
  useEffect(() => { if (activeTab === 'leaderboard') fetchLeaderboard() }, [activeTab, fetchLeaderboard])
  useEffect(() => { if (activeTab === 'reviews') fetchReviews() }, [activeTab, fetchReviews])
  useEffect(() => { if (activeTab === 'bookmarks') fetchBookmarks() }, [activeTab, fetchBookmarks])

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleCreatePost = async () => {
    if (!currentUser || !newPostTitle.trim() || !newPostContent.trim()) { toast.error('Please fill in title and content'); return }
    setNewPostSubmitting(true)
    try {
      const res = await fetch('/api/student/community/discussions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, courseId: selectedCourseId !== 'all' ? selectedCourseId : (enrollments[0] as Enrollment & { course?: { id: string } })?.course?.id || enrollments[0]?.courseId || '', title: newPostTitle, content: newPostContent, lessonContext: newPostLessonCtx || undefined }),
      })
      if (res.ok) { toast.success('Post created! 🎉'); setNewPostOpen(false); setNewPostTitle(''); setNewPostContent(''); setNewPostLessonCtx(''); fetchPosts() }
      else toast.error('Failed to create post')
    } catch { toast.error('Network error') }
    finally { setNewPostSubmitting(false) }
  }

  const handleUpvote = async (postId: string) => {
    if (!currentUser) return
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, upvoteCount: p.hasUpvoted ? p.upvoteCount - 1 : p.upvoteCount + 1, hasUpvoted: !p.hasUpvoted } : p))
    try { await fetch(`/api/student/community/discussions/${postId}/upvote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.id }) }) }
    catch { setPosts(prev => prev.map(p => p.id === postId ? { ...p, upvoteCount: p.hasUpvoted ? p.upvoteCount - 1 : p.upvoteCount + 1, hasUpvoted: !p.hasUpvoted } : p)) }
  }

  const handleBookmark = async (postId: string, currentState: boolean) => {
    if (!currentUser) return
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isBookmarked: !currentState } : p))
    try {
      await fetch('/api/student/community/discussions/bookmarks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, postId, action: currentState ? 'remove' : 'add' }),
      })
      toast.success(currentState ? 'Bookmark removed' : 'Post bookmarked! 🔖')
    } catch { setPosts(prev => prev.map(p => p.id === postId ? { ...p, isBookmarked: currentState } : p)) }
  }

  const handleReply = async (postId: string) => {
    const text = replyTexts[postId]?.trim()
    if (!currentUser || !text) return
    setSubmittingReply(true)
    try {
      const res = await fetch(`/api/student/community/discussions/${postId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.id, content: text }) })
      if (res.ok) { toast.success('Reply posted!'); setReplyTexts(prev => ({ ...prev, [postId]: '' })); setReplyingTo(null); fetchPosts() }
      else toast.error('Failed to post reply')
    } catch { toast.error('Network error') }
    finally { setSubmittingReply(false) }
  }

  const handleViewThread = async (post: DiscussionPost) => {
    setSelectedPost(post); setThreadOpen(true); setThreadReplyText('')
    if (!currentUser) return
    try {
      const res = await fetch(`/api/student/community/discussions/${post.id}?userId=${currentUser.id}`)
      if (res.ok) { const data = await res.json(); setSelectedPost(prev => ({ ...prev!, replies: data.replies || data.post?.replies || prev?.replies || [] })) }
    } catch { /* keep existing data */ }
  }

  const handleThreadReply = async () => {
    if (!currentUser || !selectedPost || !threadReplyText.trim()) return
    setSubmittingReply(true)
    try {
      const res = await fetch(`/api/student/community/discussions/${selectedPost.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.id, content: threadReplyText }) })
      if (res.ok) {
        toast.success('Reply posted!'); setThreadReplyText('')
        const threadRes = await fetch(`/api/student/community/discussions/${selectedPost.id}?userId=${currentUser.id}`)
        if (threadRes.ok) { const data = await threadRes.json(); setSelectedPost(prev => ({ ...prev!, replies: data.replies || data.post?.replies || prev?.replies || [] })) }
        fetchPosts()
      } else toast.error('Failed to post reply')
    } catch { toast.error('Network error') }
    finally { setSubmittingReply(false) }
  }

  const handleJoinGroup = async (groupId: string) => {
    if (!currentUser) return
    setJoiningGroup(groupId)
    try {
      const res = await fetch(`/api/student/community/study-groups/${groupId}/join`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.id }) })
      if (res.ok) { toast.success('Joined group! 🎉'); setGroups(prev => prev.map(g => g.id === groupId ? { ...g, isMember: true, memberCount: g.memberCount + 1 } : g)) }
      else toast.error('Failed to join group')
    } catch { toast.error('Network error') }
    finally { setJoiningGroup(null) }
  }

  const handleLeaveGroup = async (groupId: string) => {
    if (!currentUser) return
    setJoiningGroup(groupId)
    try {
      const res = await fetch(`/api/student/community/study-groups/${groupId}/leave`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.id }) })
      if (res.ok) { toast.success('Left group'); setGroups(prev => prev.map(g => g.id === groupId ? { ...g, isMember: false, memberCount: Math.max(0, g.memberCount - 1) } : g)) }
      else toast.error('Failed to leave group')
    } catch { toast.error('Network error') }
    finally { setJoiningGroup(null) }
  }

  const handleOpenGroup = (groupId: string) => {
    setSelectedGroupId(groupId)
    setGroupDetailTab('chat')
    fetchGroupDetail(groupId)
  }

  const handleBackToGroups = () => {
    setSelectedGroupId(null)
    setGroupDetail(null)
    setGroupMessages([])
    setGroupResources([])
  }

  const handleCreateGroup = async () => {
    if (!currentUser || !newGroupName.trim() || !newGroupDesc.trim()) { toast.error('Please fill in name and description'); return }
    setCreatingGroup(true)
    try {
      const res = await fetch('/api/student/community/study-groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newGroupName, description: newGroupDesc, emoji: newGroupEmoji, userId: currentUser.id, maxMembers: parseInt(newGroupMaxMembers) || 50 }) })
      if (res.ok) { toast.success('Study group created! 🎉'); setCreateGroupOpen(false); setNewGroupName(''); setNewGroupDesc(''); setNewGroupEmoji('📚'); setNewGroupMaxMembers('50'); fetchGroups() }
      else toast.error('Failed to create group')
    } catch { toast.error('Network error') }
    finally { setCreatingGroup(false) }
  }

  const handleSendMessage = async () => {
    if (!currentUser || !selectedGroupId || !chatMessage.trim()) return
    setSendingMessage(true)
    try {
      const res = await fetch(`/api/student/community/study-groups/${selectedGroupId}/messages?userId=${currentUser.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.id, content: chatMessage }) })
      if (res.ok) {
        setChatMessage('')
        const msgsRes = await fetch(`/api/student/community/study-groups/${selectedGroupId}/messages?userId=${currentUser.id}`)
        if (msgsRes.ok) { const data = await msgsRes.json(); setGroupMessages(data.messages || data || []) }
      } else toast.error('Failed to send message')
    } catch { toast.error('Network error') }
    finally { setSendingMessage(false) }
  }

  const handleAddResource = async () => {
    if (!currentUser || !selectedGroupId || !newResTitle.trim() || !newResUrl.trim()) { toast.error('Please fill in title and URL'); return }
    setAddingResource(true)
    try {
      const res = await fetch(`/api/student/community/study-groups/${selectedGroupId}/resources?userId=${currentUser.id}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, title: newResTitle, description: newResDesc, type: newResType, url: newResUrl, tags: newResTags.split(',').map(t => t.trim()).filter(Boolean) }),
      })
      if (res.ok) { toast.success('Resource added!'); setNewResourceOpen(false); setNewResTitle(''); setNewResDesc(''); setNewResType('link'); setNewResUrl(''); setNewResTags(''); fetchGroupDetail(selectedGroupId) }
      else toast.error('Failed to add resource')
    } catch { toast.error('Network error') }
    finally { setAddingResource(false) }
  }

  const handleRSVP = async (eventId: string, action: 'register' | 'cancel') => {
    if (!currentUser) return
    setRsvpLoading(eventId)
    // Optimistic update
    setEvents(prev => prev.map(e => {
      if (e.id !== eventId) return e
      if (action === 'register') return { ...e, isRegistered: true, attendeeCount: e.attendeeCount + 1 }
      return { ...e, isRegistered: false, attendeeCount: Math.max(0, e.attendeeCount - 1) }
    }))
    try {
      const res = await fetch(`/api/student/community/events/${eventId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.id, action }) })
      if (res.ok) { toast.success(action === 'register' ? 'Registered! 🎉' : 'Registration cancelled') }
      else { toast.error('Failed to update RSVP'); setEvents(prev => prev.map(e => { if (e.id !== eventId) return e; if (action === 'register') return { ...e, isRegistered: false, attendeeCount: Math.max(0, e.attendeeCount - 1) }; return { ...e, isRegistered: true, attendeeCount: e.attendeeCount + 1 } })) }
    } catch { toast.error('Network error'); setEvents(prev => prev.map(e => { if (e.id !== eventId) return e; if (action === 'register') return { ...e, isRegistered: false, attendeeCount: Math.max(0, e.attendeeCount - 1) }; return { ...e, isRegistered: true, attendeeCount: e.attendeeCount + 1 } })) }
    finally { setRsvpLoading(null) }
  }

  const handleCreateEvent = async () => {
    if (!currentUser || !newEventTitle.trim() || !newEventDesc.trim() || !newEventStartDate) { toast.error('Please fill in required fields'); return }
    if (currentUser.role !== 'instructor' && currentUser.role !== 'admin') { toast.error('Only instructors can create events'); return }
    setCreatingEvent(true)
    try {
      const startDateTime = new Date(`${newEventStartDate}T${newEventStartTime || '10:00'}`)
      const res = await fetch('/api/student/community/events', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, title: newEventTitle, description: newEventDesc, type: newEventType, emoji: newEventEmoji, startDate: startDateTime.toISOString(), duration: parseInt(newEventDuration) || 60, location: newEventLocation, meetingUrl: newEventMeetingUrl, maxAttendees: parseInt(newEventMaxAttendees) || undefined }),
      })
      if (res.ok) { toast.success('Event created! 🎉'); setCreateEventOpen(false); resetEventForm(); fetchEvents() }
      else toast.error('Failed to create event')
    } catch { toast.error('Network error') }
    finally { setCreatingEvent(false) }
  }

  const resetEventForm = () => {
    setNewEventTitle(''); setNewEventDesc(''); setNewEventType('workshop'); setNewEventEmoji('🎓')
    setNewEventStartDate(''); setNewEventStartTime(''); setNewEventDuration('60')
    setNewEventLocation(''); setNewEventMeetingUrl(''); setNewEventMaxAttendees('')
  }

  const handleSubmitReview = async () => {
    if (!currentUser || !selectedReview || reviewRating === 0) { toast.error('Please provide a rating'); return }
    setSubmittingReview(true)
    try {
      const res = await fetch('/api/student/community/peer-reviews', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, peerReviewId: selectedReview.id, feedback: reviewFeedback, rating: reviewRating }),
      })
      if (res.ok) { toast.success('Earned 50 XP! 🎉'); setReviewDialogOpen(false); setReviewRating(0); setReviewFeedback(''); setSelectedReview(null); fetchReviews() }
      else toast.error('Failed to submit review')
    } catch { toast.error('Network error') }
    finally { setSubmittingReview(false) }
  }

  const handleRemoveBookmark = async (postId: string) => {
    if (!currentUser) return
    setBookmarks(prev => prev.filter(b => b.postId !== postId))
    try {
      await fetch('/api/student/community/discussions/bookmarks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, postId, action: 'remove' }),
      })
      toast.success('Bookmark removed')
    } catch { fetchBookmarks() }
  }

  // ─── Render: Overview Stats ─────────────────────────────────────────────

  const renderStatsHeader = () => (
    <InstructorStatCardGrid columns={4}>
      <InstructorStatCard icon={Users} value={myGroupCount} label="My Groups" color="emerald" index={0} />
      <InstructorStatCard icon={MessageSquare} value={formatNumber(posts.length)} label="Discussions" color="violet" index={1} />
      <InstructorStatCard icon={Calendar} value={upcomingEventCount} label="Upcoming Events" color="amber" index={2} />
      <InstructorStatCard icon={Zap} value={`${currentUser?.xp ?? 0} XP`} label={`Level ${currentUser?.level ?? 1}`} color="teal" index={3} />
    </InstructorStatCardGrid>
  )

  // ─── Render: Tab Navigation ─────────────────────────────────────────────

  const renderTabNav = () => (
    <div className="mb-6">
      {/* Desktop tabs */}
      <div className="hidden sm:flex items-center gap-1 bg-muted/50 rounded-xl p-1 overflow-x-auto">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap',
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
              )}>
              <Icon className="size-4" />
              {tab.label}
            </button>
          )
        })}
      </div>
      {/* Mobile scrollable pills */}
      <div className="sm:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-medium transition-all whitespace-nowrap shrink-0',
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              )}>
              <Icon className="size-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )

  // ─── Render: Discussions Tab ────────────────────────────────────────────

  const renderDiscussions = () => (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search discussions..." className="pl-9 h-8 sm:h-9 text-[13px]" />
          </div>
          {/* Desktop: Course + Sort selects */}
          <div className="hidden md:flex items-center gap-2">
            <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
              <SelectTrigger className="w-auto min-w-[140px] max-w-[200px] h-9 text-[13px]">
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {enrolledCourses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as typeof sortOrder)}>
              <SelectTrigger className="w-auto min-w-[130px] h-9 text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="upvoted">Most Upvoted</SelectItem>
                <SelectItem value="commented">Most Commented</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Mobile: Filter sheet */}
          <MobileFilterSheet
            activeCount={[selectedCourseId !== 'all', sortOrder !== 'newest'].filter(Boolean).length}
            onClearAll={() => { setSelectedCourseId('all'); setSortOrder('newest') }}
            title="Discussion Filters"
          >
            <MobileFilterGroup label="Course">
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className="w-full rounded-xl h-10 text-[13px]">
                  <SelectValue placeholder="Course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {enrolledCourses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </MobileFilterGroup>
            <MobileFilterGroup label="Sort">
              <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as typeof sortOrder)}>
                <SelectTrigger className="w-full rounded-xl h-10 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="upvoted">Most Upvoted</SelectItem>
                  <SelectItem value="commented">Most Commented</SelectItem>
                </SelectContent>
              </Select>
            </MobileFilterGroup>
          </MobileFilterSheet>
        </div>
        <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white active:scale-[0.97] shrink-0">
              <Plus className="size-3.5 mr-1" /> New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader><DialogTitle className="text-[18px] font-bold">Create New Post</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label className="text-[13px] font-medium">Title</Label><Input value={newPostTitle} onChange={(e) => setNewPostTitle(e.target.value)} placeholder="What's your question or topic?" className="mt-1.5 text-[14px]" /></div>
              <div><Label className="text-[13px] font-medium">Content</Label><Textarea value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} placeholder="Share your thoughts, questions, or findings..." className="mt-1.5 min-h-[100px] text-[14px]" /></div>
              <div><Label className="text-[13px] font-medium">Lesson Context (optional)</Label><Input value={newPostLessonCtx} onChange={(e) => setNewPostLessonCtx(e.target.value)} placeholder="e.g., Lesson 3.2, Section 2 Project" className="mt-1.5 text-[14px]" /></div>
            </div>
            <DialogFooter className="mt-4">
              <Button onClick={handleCreatePost} disabled={newPostSubmitting} className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white active:scale-[0.97]">
                {newPostSubmitting ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Send className="size-4 mr-1.5" />} Post
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Posts list */}
      {postsLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)}</div>
      ) : filteredAndSortedPosts.length === 0 ? (
        <motion.div {...fadeIn} transition={springTransition} className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-6 dark:from-emerald-950/20 dark:to-teal-950/20">
            <MessageSquare className="size-12 text-emerald-400/60 dark:text-emerald-500/40" />
          </div>
          <h3 className="text-[18px] font-bold">No Discussions Found</h3>
          <p className="text-[14px] text-muted-foreground max-w-sm">Be the first to start a discussion! Ask a question or share your thoughts.</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredAndSortedPosts.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ ...springTransition, delay: i * 0.04 }}
                className={cn('rounded-2xl ios-shadow-sm bg-card overflow-hidden', post.isPinned && 'ring-1 ring-emerald-200/50 dark:ring-emerald-800/30')}>
                <div className="p-4">
                  {post.isPinned && (
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Pin className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Pinned</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="size-7"><AvatarFallback className="text-[10px] bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 text-emerald-700 dark:text-emerald-300">{getInitials(post.userName)}</AvatarFallback></Avatar>
                    <span className="text-[12px] text-muted-foreground">by {post.userName} · {timeAgo(post.createdAt)}</span>
                    {post.courseName && <Badge variant="secondary" className="text-[10px] ml-auto bg-accent/60 text-muted-foreground border-0">{post.courseName}</Badge>}
                  </div>
                  <h3 className={cn('text-[15px] font-semibold mb-1.5', post.isPinned ? 'text-emerald-700 dark:text-emerald-300' : 'text-foreground')}>
                    {post.title}
                  </h3>
                  <p className="text-[13px] text-muted-foreground line-clamp-2 mb-2">{post.content}</p>
                  {post.lessonContext && (
                    <Badge variant="secondary" className="text-[10px] mb-2 bg-emerald-50 text-emerald-700 border-0 dark:bg-emerald-950/20 dark:text-emerald-300">
                      <BookOpen className="size-3 mr-1" /> {post.lessonContext}
                    </Badge>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    <button onClick={() => handleUpvote(post.id)}
                      className={cn('flex items-center gap-1 text-[13px] font-medium transition-colors active:scale-[0.97]', post.hasUpvoted ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400')}>
                      <ArrowUp className={cn('size-4', post.hasUpvoted && 'fill-current')} /> {post.upvoteCount}
                    </button>
                    <span className="flex items-center gap-1 text-[13px] text-muted-foreground"><MessageCircle className="size-4" /> {post.replyCount}</span>
                    <button onClick={() => handleBookmark(post.id, post.isBookmarked)}
                      className={cn('flex items-center gap-1 text-[13px] transition-colors ml-auto', post.isBookmarked ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-500')}>
                      {post.isBookmarked ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-border/30">
                    <Button variant="ghost" size="sm" className="text-[12px] h-7 px-3 text-primary hover:text-primary/80 active:scale-[0.97]" onClick={() => handleViewThread(post)}>
                      <Eye className="size-3.5 mr-1" /> View thread
                    </Button>
                    <Button variant="ghost" size="sm" className="text-[12px] h-7 px-3 text-primary hover:text-primary/80 active:scale-[0.97]" onClick={() => setReplyingTo(replyingTo === post.id ? null : post.id)}>
                      <MessageCircle className="size-3.5 mr-1" /> Reply
                    </Button>
                  </div>
                  <AnimatePresence>
                    {replyingTo === post.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={springGentle} className="overflow-hidden">
                        <div className="flex items-start gap-2 mt-3 pt-2.5 border-t border-border/30">
                          <Textarea value={replyTexts[post.id] || ''} onChange={(e) => setReplyTexts(prev => ({ ...prev, [post.id]: e.target.value }))} placeholder="Write a reply..." className="min-h-[60px] text-[13px] flex-1 resize-none" />
                          <Button size="sm" onClick={() => handleReply(post.id)} disabled={submittingReply || !(replyTexts[post.id]?.trim())} className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white active:scale-[0.97] shrink-0 mt-1">
                            {submittingReply ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Thread Dialog */}
      <Dialog open={threadOpen} onOpenChange={setThreadOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-bold pr-8">{selectedPost?.title}</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <ScrollArea className="max-h-[50vh]">
              <div className="space-y-4 pr-3">
                {/* Original post */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8"><AvatarFallback className="text-[11px] bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 text-emerald-700 dark:text-emerald-300">{getInitials(selectedPost.userName)}</AvatarFallback></Avatar>
                    <div><p className="text-[13px] font-medium">{selectedPost.userName}</p><p className="text-[11px] text-muted-foreground">{timeAgo(selectedPost.createdAt)}</p></div>
                  </div>
                  {selectedPost.lessonContext && <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border-0 dark:bg-emerald-950/20 dark:text-emerald-300"><BookOpen className="size-3 mr-1" />{selectedPost.lessonContext}</Badge>}
                  <p className="text-[14px] leading-relaxed">{selectedPost.content}</p>
                  <div className="flex items-center gap-4">
                    <button onClick={() => handleUpvote(selectedPost.id)} className={cn('flex items-center gap-1 text-[13px] font-medium', selectedPost.hasUpvoted ? 'text-emerald-600' : 'text-muted-foreground hover:text-emerald-600')}>
                      <ArrowUp className={cn('size-4', selectedPost.hasUpvoted && 'fill-current')} /> {selectedPost.upvoteCount}
                    </button>
                    <span className="flex items-center gap-1 text-[13px] text-muted-foreground"><MessageCircle className="size-4" /> {selectedPost.replyCount}</span>
                  </div>
                </div>
                <Separator />
                {/* Replies */}
                <div className="space-y-3">
                  <p className="text-[13px] font-semibold text-muted-foreground">{selectedPost.replies?.length || 0} Replies</p>
                  {selectedPost.replies?.map(reply => (
                    <div key={reply.id} className="flex gap-3 pl-2">
                      <Avatar className="size-7 mt-0.5"><AvatarFallback className="text-[10px] bg-muted">{getInitials(reply.userName)}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><span className="text-[13px] font-medium">{reply.userName}</span><span className="text-[11px] text-muted-foreground">{timeAgo(reply.createdAt)}</span></div>
                        <p className="text-[13px] text-foreground mt-0.5">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                  {(!selectedPost.replies || selectedPost.replies.length === 0) && (
                    <p className="text-[13px] text-muted-foreground text-center py-4">No replies yet. Be the first!</p>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
          <div className="flex items-start gap-2 mt-2 pt-2 border-t">
            <Textarea value={threadReplyText} onChange={(e) => setThreadReplyText(e.target.value)} placeholder="Write a reply..." className="min-h-[50px] text-[13px] flex-1 resize-none" />
            <Button size="sm" onClick={handleThreadReply} disabled={submittingReply || !threadReplyText.trim()} className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white active:scale-[0.97] shrink-0 mt-1">
              {submittingReply ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )

  // ─── Render: Study Groups Detail View ───────────────────────────────────

  const renderGroupDetail = () => {
    if (groupDetailLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <GroupSkeleton key={i} />)}</div>
    if (!groupDetail) return null

    const detailTabs: { id: GroupDetailTab; label: string; icon: typeof MessageSquare }[] = [
      { id: 'chat', label: 'Chat', icon: MessageSquare },
      { id: 'members', label: 'Members', icon: Users },
      { id: 'resources', label: 'Resources', icon: FileText },
      { id: 'events', label: 'Events', icon: Calendar },
    ]

    return (
      <div className="space-y-4">
        {/* Back button + header */}
        <button onClick={handleBackToGroups} className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline active:scale-[0.97]">
          <ChevronLeft className="size-4" /> Back to Groups
        </button>

        <div className="rounded-2xl ios-shadow-lg bg-card p-5">
          <div className="flex items-start gap-4">
            <span className="text-4xl">{groupDetail.emoji}</span>
            <div className="flex-1 min-w-0">
              <h2 className="text-[20px] font-bold">{groupDetail.name}</h2>
              <p className="text-[13px] text-muted-foreground mt-1">{groupDetail.description}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground"><Users className="size-3.5" /> {groupDetail.memberCount} members</span>
                {groupDetail.isActive && (
                  <span className="flex items-center gap-1.5 text-[12px] text-emerald-600 dark:text-emerald-400">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> Active
                  </span>
                )}
                {groupDetail.courseName && (
                  <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border-0 dark:bg-emerald-950/20 dark:text-emerald-300">
                    <GraduationCap className="size-3 mr-1" /> {groupDetail.courseName}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-3 text-[12px] text-muted-foreground">
                <span className="flex items-center gap-1"><MessageSquare className="size-3" /> {groupDetail.stats?.totalMessages ?? 0} messages</span>
                <span className="flex items-center gap-1"><FileText className="size-3" /> {groupDetail.stats?.totalResources ?? 0} resources</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detail sub-tabs */}
        <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
          {detailTabs.map(tab => {
            const Icon = tab.icon
            const isActive = groupDetailTab === tab.id
            return (
              <button key={tab.id} onClick={() => setGroupDetailTab(tab.id)}
                className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all flex-1 justify-center',
                  isActive ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80')}>
                <Icon className="size-3.5" />{tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {groupDetailTab === 'chat' && (
            <motion.div key="chat" {...fadeIn} transition={springTransition} className="space-y-3">
              <div className="rounded-2xl ios-shadow-sm bg-card p-4 max-h-96 overflow-y-auto">
                {groupMessages.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground text-center py-8">No messages yet. Start the conversation!</p>
                ) : (
                  <div className="space-y-3">
                    {groupMessages.map(msg => (
                      <div key={msg.id} className={cn('flex gap-3', msg.isSystem && 'justify-center')}>
                        {msg.isSystem ? (
                          <div className="text-[11px] text-muted-foreground bg-muted/50 rounded-full px-3 py-1">
                            {msg.content}
                          </div>
                        ) : (
                          <>
                            <Avatar className="size-7 shrink-0"><AvatarFallback className="text-[10px] bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 text-emerald-700 dark:text-emerald-300">{getInitials(msg.userName)}</AvatarFallback></Avatar>
                            <div className={cn('flex-1 min-w-0', msg.isPinned && 'bg-amber-50/50 -mx-2 px-2 py-1 rounded-lg dark:bg-amber-950/10')}>
                              {msg.isPinned && <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 mb-0.5"><Pin className="size-3" />Pinned</span>}
                              <div className="flex items-center gap-2"><span className="text-[12px] font-medium">{msg.userName}</span><span className="text-[10px] text-muted-foreground">{timeAgo(msg.createdAt)}</span></div>
                              <p className="text-[13px] mt-0.5">{msg.content}</p>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input value={chatMessage} onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
                  placeholder="Type a message..." className="flex-1 h-9 text-[13px]" />
                <Button size="sm" onClick={handleSendMessage} disabled={sendingMessage || !chatMessage.trim()} className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white active:scale-[0.97] shrink-0">
                  {sendingMessage ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </Button>
              </div>
            </motion.div>
          )}

          {groupDetailTab === 'members' && (
            <motion.div key="members" {...fadeIn} transition={springTransition}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {groupDetail.members.map(member => (
                  <div key={member.id} className="rounded-2xl ios-shadow-sm bg-card p-4 flex items-center gap-3">
                    <Avatar className="size-10"><AvatarFallback className="text-[12px] bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 text-emerald-700 dark:text-emerald-300">{getInitials(member.name)}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-medium truncate">{member.name}</span>
                        {member.role === 'admin' && <Badge className="text-[9px] px-1.5 py-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">Admin</Badge>}
                        {member.role === 'member' && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Member</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground">Lv. {member.level}</span>
                        <span className="text-[11px] text-muted-foreground">·</span>
                        <span className="text-[11px] text-muted-foreground">{formatNumber(member.xp)} XP</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Joined {new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {groupDetailTab === 'resources' && (
            <motion.div key="resources" {...fadeIn} transition={springTransition} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-semibold">{groupResources.length} Resources</span>
                <Dialog open={newResourceOpen} onOpenChange={setNewResourceOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white active:scale-[0.97]">
                      <Plus className="size-3.5 mr-1" /> Add Resource
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader><DialogTitle className="text-[16px] font-bold">Add Resource</DialogTitle></DialogHeader>
                    <div className="space-y-3 pt-2">
                      <div><Label className="text-[13px]">Title</Label><Input value={newResTitle} onChange={(e) => setNewResTitle(e.target.value)} placeholder="Resource title" className="mt-1 text-[13px]" /></div>
                      <div><Label className="text-[13px]">Description</Label><Input value={newResDesc} onChange={(e) => setNewResDesc(e.target.value)} placeholder="Brief description" className="mt-1 text-[13px]" /></div>
                      <div><Label className="text-[13px]">Type</Label>
                        <Select value={newResType} onValueChange={(v) => setNewResType(v as GroupResource['type'])}>
                          <SelectTrigger className="mt-1 text-[13px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="link">Link</SelectItem><SelectItem value="file">File</SelectItem><SelectItem value="video">Video</SelectItem><SelectItem value="code">Code</SelectItem><SelectItem value="image">Image</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label className="text-[13px]">URL</Label><Input value={newResUrl} onChange={(e) => setNewResUrl(e.target.value)} placeholder="https://..." className="mt-1 text-[13px]" /></div>
                      <div><Label className="text-[13px]">Tags (comma separated)</Label><Input value={newResTags} onChange={(e) => setNewResTags(e.target.value)} placeholder="python, tutorial" className="mt-1 text-[13px]" /></div>
                    </div>
                    <DialogFooter className="mt-4">
                      <Button onClick={handleAddResource} disabled={addingResource} className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white active:scale-[0.97]">
                        {addingResource ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Plus className="size-4 mr-1.5" />} Add
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              {groupResources.length === 0 ? (
                <p className="text-[13px] text-muted-foreground text-center py-8">No resources yet. Share something useful!</p>
              ) : (
                <div className="space-y-2">
                  {groupResources.map(res => {
                    const TypeIcon = RESOURCE_TYPE_ICONS[res.type] || FileText
                    return (
                      <div key={res.id} className="rounded-2xl ios-shadow-sm bg-card p-4 flex items-start gap-3">
                        <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/20 shrink-0"><TypeIcon className="size-4 text-emerald-600 dark:text-emerald-400" /></div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[14px] font-medium">{res.title}</h4>
                          <p className="text-[12px] text-muted-foreground mt-0.5">{res.description}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {res.tags.map(tag => <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0 border-0">#{tag}</Badge>)}
                            <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1"><ExternalLink className="size-3" />{res.downloadCount} downloads</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )}

          {groupDetailTab === 'events' && (
            <motion.div key="events" {...fadeIn} transition={springTransition}>
              <div className="space-y-3">
                {events.filter(e => e.groupId === selectedGroupId || (!e.groupId && e.courseName === groupDetail.courseName)).length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="size-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-[14px] text-muted-foreground">No group events scheduled</p>
                    <p className="text-[12px] text-muted-foreground mt-1">Check the Events tab for community-wide events</p>
                  </div>
                ) : (
                  events.filter(e => e.groupId === selectedGroupId || (!e.groupId && e.courseName === groupDetail.courseName)).map(ev => (
                    <div key={ev.id} className="rounded-2xl ios-shadow-sm bg-card p-4 flex gap-3">
                      <div className="text-2xl shrink-0">{ev.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[14px] font-semibold">{ev.title}</h4>
                        <p className="text-[12px] text-muted-foreground mt-0.5">{formatEventDate(ev.startDate)}</p>
                        <div className="mt-2">
                          <Button size="sm" variant={ev.isRegistered ? 'outline' : 'default'} className={cn('text-[11px] h-7 rounded-full', !ev.isRegistered && 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white')}
                            onClick={() => handleRSVP(ev.id, ev.isRegistered ? 'cancel' : 'register')} disabled={rsvpLoading === ev.id}>
                            {rsvpLoading === ev.id ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
                            {ev.isRegistered ? 'Cancel RSVP' : 'RSVP'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ─── Render: Study Groups Tab ───────────────────────────────────────────

  const renderStudyGroups = () => {
    if (selectedGroupId) return renderGroupDetail()

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold">Study Groups</h3>
          <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white active:scale-[0.97]">
                <Plus className="size-3.5 mr-1" /> Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader><DialogTitle className="text-[16px] font-bold">Create Study Group</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><Label className="text-[13px] font-medium">Emoji</Label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {EMOJI_OPTIONS.map(em => (
                      <button key={em} onClick={() => setNewGroupEmoji(em)}
                        className={cn('size-9 rounded-lg text-lg flex items-center justify-center transition-all', newGroupEmoji === em ? 'bg-emerald-100 ring-2 ring-emerald-500 dark:bg-emerald-950/30' : 'bg-muted/50 hover:bg-muted')}>
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
                <div><Label className="text-[13px] font-medium">Name</Label><Input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="e.g., Python Study Circle" className="mt-1.5 text-[14px]" /></div>
                <div><Label className="text-[13px] font-medium">Description</Label><Textarea value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} placeholder="What will your group focus on?" className="mt-1.5 min-h-[80px] text-[14px]" /></div>
                <div><Label className="text-[13px] font-medium">Max Members</Label><Input type="number" value={newGroupMaxMembers} onChange={(e) => setNewGroupMaxMembers(e.target.value)} className="mt-1.5 text-[14px]" /></div>
              </div>
              <DialogFooter className="mt-4">
                <Button onClick={handleCreateGroup} disabled={creatingGroup} className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white active:scale-[0.97]">
                  {creatingGroup ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Users className="size-4 mr-1.5" />} Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {groupsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <GroupSkeleton key={i} />)}</div>
        ) : groups.length === 0 ? (
          <motion.div {...fadeIn} transition={springTransition} className="flex flex-col items-center justify-center py-16 gap-4 text-center">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-6 dark:from-emerald-950/20 dark:to-teal-950/20"><Users className="size-12 text-emerald-400/60 dark:text-emerald-500/40" /></div>
            <h3 className="text-[18px] font-bold">No Study Groups</h3>
            <p className="text-[14px] text-muted-foreground max-w-sm">Create one to start collaborating with fellow students!</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {groups.map((group, i) => (
                <motion.div key={group.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ ...springTransition, delay: i * 0.05 }}
                  className="rounded-2xl ios-shadow-sm bg-card p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{group.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-[15px] font-semibold truncate">{group.name}</h4>
                        {group.isActive && <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[12px] text-muted-foreground flex items-center gap-1"><Users className="size-3" /> {group.memberCount}{group.maxMembers ? `/${group.maxMembers}` : ''}</span>
                        {group.courseName && <Badge variant="secondary" className="text-[9px] px-1.5 py-0 border-0">{group.courseName}</Badge>}
                      </div>
                    </div>
                  </div>
                  <p className="text-[13px] text-muted-foreground mt-2 line-clamp-2">{group.description}</p>
                  <div className="flex items-center gap-2 mt-3">
                    {group.isMember ? (
                      <>
                        <Button size="sm" variant="outline" className="text-[12px] h-8 rounded-full" onClick={() => handleLeaveGroup(group.id)} disabled={joiningGroup === group.id}>
                          {joiningGroup === group.id ? <Loader2 className="size-3 animate-spin mr-1" /> : <X className="size-3 mr-1" />} Leave
                        </Button>
                        <Button size="sm" className="text-[12px] h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white" onClick={() => handleOpenGroup(group.id)}>
                          <Eye className="size-3 mr-1" /> Open
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" className="text-[12px] h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white" onClick={() => handleJoinGroup(group.id)} disabled={joiningGroup === group.id}>
                        {joiningGroup === group.id ? <Loader2 className="size-3 animate-spin mr-1" /> : <UserPlus className="size-3 mr-1" />} Join
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    )
  }

  // ─── Render: Events Tab ─────────────────────────────────────────────────

  const renderEvents = () => (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1 overflow-x-auto scrollbar-thin -mx-3 px-3 sm:mx-0 sm:px-0">
          {(['upcoming', 'live', 'all'] as const).map(status => (
            <button key={status} onClick={() => setEventStatusFilter(status)}
              className={cn('px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all capitalize whitespace-nowrap',
                eventStatusFilter === status ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
              {status === 'live' && <span className="size-1.5 rounded-full bg-red-500 mr-1 inline-block animate-pulse" />}
              {status}
            </button>
          ))}
        </div>
        {/* Desktop: Event type select */}
        <div className="hidden md:block">
          <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
            <SelectTrigger className="w-auto min-w-[140px] h-9 text-[13px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{EVENT_TYPE_LABELS[t]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {/* Mobile: Filter sheet for event type */}
        <MobileFilterSheet
          activeCount={eventTypeFilter !== 'all' ? 1 : 0}
          onClearAll={() => setEventTypeFilter('all')}
          title="Event Filters"
        >
          <MobileFilterGroup label="Event Type">
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-full rounded-xl h-10 text-[13px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{EVENT_TYPE_LABELS[t]}</SelectItem>)}
              </SelectContent>
            </Select>
          </MobileFilterGroup>
        </MobileFilterSheet>
        {(currentUser?.role === 'instructor' || currentUser?.role === 'admin') && (
          <Dialog open={createEventOpen} onOpenChange={setCreateEventOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white active:scale-[0.97] ml-auto">
                <Plus className="size-3.5 mr-1" /> Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader><DialogTitle className="text-[16px] font-bold">Create Event</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2 max-h-[60vh] overflow-y-auto pr-1">
                <div><Label className="text-[13px]">Title *</Label><Input value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} placeholder="Event title" className="mt-1 text-[13px]" /></div>
                <div><Label className="text-[13px]">Description *</Label><Textarea value={newEventDesc} onChange={(e) => setNewEventDesc(e.target.value)} placeholder="Describe the event" className="mt-1 text-[13px] min-h-[80px]" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-[13px]">Type</Label>
                    <Select value={newEventType} onValueChange={(v) => setNewEventType(v as CommunityEvent['type'])}>
                      <SelectTrigger className="mt-1 text-[13px]"><SelectValue /></SelectTrigger>
                      <SelectContent>{EVENT_TYPES.map(t => <SelectItem key={t} value={t}>{EVENT_TYPE_LABELS[t]}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-[13px]">Emoji</Label>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {EVENT_EMOJIS.slice(0, 6).map(em => (
                        <button key={em} onClick={() => setNewEventEmoji(em)} className={cn('size-8 rounded-lg text-sm flex items-center justify-center transition-all', newEventEmoji === em ? 'bg-emerald-100 ring-2 ring-emerald-500 dark:bg-emerald-950/30' : 'bg-muted/50 hover:bg-muted')}>{em}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-[13px]">Start Date *</Label><Input type="date" value={newEventStartDate} onChange={(e) => setNewEventStartDate(e.target.value)} className="mt-1 text-[13px]" /></div>
                  <div><Label className="text-[13px]">Start Time</Label><Input type="time" value={newEventStartTime} onChange={(e) => setNewEventStartTime(e.target.value)} className="mt-1 text-[13px]" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-[13px]">Duration (min)</Label><Input type="number" value={newEventDuration} onChange={(e) => setNewEventDuration(e.target.value)} className="mt-1 text-[13px]" /></div>
                  <div><Label className="text-[13px]">Max Attendees</Label><Input type="number" value={newEventMaxAttendees} onChange={(e) => setNewEventMaxAttendees(e.target.value)} placeholder="Unlimited" className="mt-1 text-[13px]" /></div>
                </div>
                <div><Label className="text-[13px]">Location</Label><Input value={newEventLocation} onChange={(e) => setNewEventLocation(e.target.value)} placeholder="Room or venue" className="mt-1 text-[13px]" /></div>
                <div><Label className="text-[13px]">Meeting URL</Label><Input value={newEventMeetingUrl} onChange={(e) => setNewEventMeetingUrl(e.target.value)} placeholder="https://meet.example.com/..." className="mt-1 text-[13px]" /></div>
              </div>
              <DialogFooter className="mt-4">
                <Button onClick={handleCreateEvent} disabled={creatingEvent} className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white active:scale-[0.97]">
                  {creatingEvent ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Calendar className="size-4 mr-1.5" />} Create Event
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Events list */}
      {eventsLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <EventSkeleton key={i} />)}</div>
      ) : filteredEvents.length === 0 ? (
        <motion.div {...fadeIn} transition={springTransition} className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-6 dark:from-emerald-950/20 dark:to-teal-950/20"><Calendar className="size-12 text-emerald-400/60 dark:text-emerald-500/40" /></div>
          <h3 className="text-[18px] font-bold">No Events Found</h3>
          <p className="text-[14px] text-muted-foreground max-w-sm">Check back later for upcoming events!</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredEvents.map((ev, i) => (
              <motion.div key={ev.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ ...springTransition, delay: i * 0.05 }}
                className="rounded-2xl ios-shadow-sm bg-card overflow-hidden">
                <div className="flex">
                  {/* Color stripe */}
                  <div className={cn('w-1.5 shrink-0 bg-gradient-to-b', ev.coverColor)} />
                  <div className="p-4 flex-1 min-w-0">
                    {/* Live indicator */}
                    {ev.isLive && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="flex items-center gap-1 text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full dark:bg-red-950/20">
                          <span className="size-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE NOW
                        </span>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0">{ev.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[15px] font-semibold">{ev.title}</h4>
                        <p className="text-[13px] text-muted-foreground mt-1 line-clamp-2">{ev.description}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge className={cn('text-[10px] border-0', EVENT_TYPE_COLORS[ev.type])}>{EVENT_TYPE_LABELS[ev.type]}</Badge>
                          {ev.courseName && <Badge variant="secondary" className="text-[9px] px-1.5 py-0 border-0">{ev.courseName}</Badge>}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-[12px] text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1"><Clock className="size-3" /> {formatEventDate(ev.startDate)}</span>
                          {ev.location && <span className="flex items-center gap-1"><MapPin className="size-3" /> {ev.location}</span>}
                          {ev.meetingUrl && <span className="flex items-center gap-1"><Globe className="size-3" /> Online</span>}
                          <span className="flex items-center gap-1"><Users className="size-3" /> {ev.attendeeCount}{ev.maxAttendees ? `/${ev.maxAttendees}` : ''}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          {ev.isLive ? (
                            ev.isRegistered ? (
                              <Button size="sm" className="text-[12px] h-8 rounded-full bg-red-500 hover:bg-red-600 text-white">
                                <Globe className="size-3 mr-1" /> Join Live
                              </Button>
                            ) : (
                              <Button size="sm" onClick={() => handleRSVP(ev.id, 'register')} disabled={rsvpLoading === ev.id} className="text-[12px] h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                                {rsvpLoading === ev.id ? <Loader2 className="size-3 animate-spin mr-1" /> : null} Register & Join
                              </Button>
                            )
                          ) : ev.status === 'past' ? (
                            <Badge variant="secondary" className="text-[11px]">Ended</Badge>
                          ) : ev.isRegistered ? (
                            <Button size="sm" variant="outline" className="text-[12px] h-8 rounded-full text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/20" onClick={() => handleRSVP(ev.id, 'cancel')} disabled={rsvpLoading === ev.id}>
                              {rsvpLoading === ev.id ? <Loader2 className="size-3 animate-spin mr-1" /> : <X className="size-3 mr-1" />} Cancel RSVP
                            </Button>
                          ) : ev.maxAttendees && ev.attendeeCount >= ev.maxAttendees ? (
                            <Button size="sm" variant="outline" className="text-[12px] h-8 rounded-full" disabled>
                              <UsersRound className="size-3 mr-1" /> Waitlist
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => handleRSVP(ev.id, 'register')} disabled={rsvpLoading === ev.id} className="text-[12px] h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                              {rsvpLoading === ev.id ? <Loader2 className="size-3 animate-spin mr-1" /> : <CheckCircle className="size-3 mr-1" />} Register
                            </Button>
                          )}
                          {ev.meetingUrl && ev.isRegistered && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a href={ev.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] text-primary hover:underline flex items-center gap-1">
                                  <ExternalLink className="size-3" /> Meeting Link
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>Open meeting link</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )

  // ─── Render: Leaderboard Tab ────────────────────────────────────────────

  const renderLeaderboard = () => {
    const top3 = leaderboard.filter(e => e.rank <= 3 && !e.isCurrentUser)
    const restList = leaderboard.filter(e => e.rank > 3)
    const currentUserEntry = leaderboard.find(e => e.isCurrentUser)

    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
            {(['week', 'month', 'all'] as const).map(p => (
              <button key={p} onClick={() => setLbPeriod(p)}
                className={cn('px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all',
                  lbPeriod === p ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                {p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'All Time'}
              </button>
            ))}
          </div>
          <Select value={lbCourseId} onValueChange={setLbCourseId}>
            <SelectTrigger className="w-auto min-w-[140px] h-9 text-[13px]"><SelectValue placeholder="Course" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {enrolledCourses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {lbLoading ? <LeaderboardSkeleton /> : (
          <>
            {/* Podium */}
            {top3.length > 0 && (
              <div className="flex items-end justify-center gap-3 py-6">
                {[2, 1, 3].map((rank, idx) => {
                  const entry = top3.find(e => e.rank === rank)
                  if (!entry) return <div key={rank} className="w-24" />
                  const heights = ['h-28', 'h-36', 'h-24']
                  const medals = [<Medal key="m2" className="size-5 text-gray-400" />, <Crown key="m1" className="size-5 text-amber-400" />, <Medal key="m3" className="size-5 text-amber-700" />]
                  return (
                    <motion.div key={entry.userId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.15, ...springTransition }}
                      className="flex flex-col items-center gap-2">
                      <Avatar className="size-12 ring-2 ring-offset-2 ring-emerald-400"><AvatarFallback className="text-[13px] bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 text-emerald-700 dark:text-emerald-300">{getInitials(entry.userName)}</AvatarFallback></Avatar>
                      <span className="text-[13px] font-semibold">{entry.userName}</span>
                      <span className="text-[11px] text-muted-foreground">{formatNumber(entry.xp)} XP</span>
                      {medals[idx]}
                      <div className={cn('w-24 rounded-t-xl bg-gradient-to-b from-emerald-100 to-emerald-50 dark:from-emerald-950/30 dark:to-emerald-950/10 flex items-center justify-center', heights[idx])}>
                        <span className="text-[24px] font-bold text-emerald-600 dark:text-emerald-400">#{rank}</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}

            {/* Rest of leaderboard */}
            <div className="space-y-2">
              {restList.map((entry, i) => (
                <motion.div key={entry.userId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className={cn('rounded-2xl ios-shadow-sm bg-card p-4 flex items-center gap-3', entry.isCurrentUser && 'ring-1 ring-emerald-300 dark:ring-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/10')}>
                  <span className="text-[14px] font-bold text-muted-foreground w-7 text-center shrink-0">#{entry.rank}</span>
                  <Avatar className="size-9"><AvatarFallback className="text-[11px] bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 text-emerald-700 dark:text-emerald-300">{getInitials(entry.userName)}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium truncate">{entry.userName} {entry.isCurrentUser && <span className="text-[11px] text-emerald-600 dark:text-emerald-400">(You)</span>}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <XPBar xp={entry.xp} maxXP={maxLeaderboardXp} />
                      <span className="text-[11px] text-muted-foreground shrink-0">Lv. {entry.level}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[14px] font-bold">{formatNumber(entry.xp)}</p>
                    <p className="text-[11px] text-muted-foreground">XP</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Current user position if not in top list */}
            {currentUserEntry && currentUserEntry.rank > 3 && !restList.find(e => e.isCurrentUser) && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-2xl ios-shadow-sm bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-4 flex items-center gap-3 ring-1 ring-emerald-300 dark:ring-emerald-700">
                <span className="text-[14px] font-bold text-emerald-600 dark:text-emerald-400 w-7 text-center shrink-0">#{currentUserEntry.rank}</span>
                <Avatar className="size-9"><AvatarFallback className="text-[11px] bg-gradient-to-br from-emerald-200 to-teal-200 dark:from-emerald-800 dark:to-teal-800 text-emerald-800 dark:text-emerald-200">{getInitials(currentUserEntry.userName)}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium">{currentUserEntry.userName} <span className="text-[11px] text-emerald-600 dark:text-emerald-400">(You)</span></p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <XPBar xp={currentUserEntry.xp} maxXP={maxLeaderboardXp} />
                    <span className="text-[11px] text-muted-foreground shrink-0">Lv. {currentUserEntry.level}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[14px] font-bold">{formatNumber(currentUserEntry.xp)}</p>
                  <p className="text-[11px] text-muted-foreground">XP</p>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    )
  }

  // ─── Render: Peer Reviews Tab ───────────────────────────────────────────

  const renderPeerReviews = () => (
    <div className="space-y-4">
      {/* XP Banner */}
      <div className="rounded-2xl ios-shadow-sm bg-gradient-to-r from-emerald-500 to-teal-600 p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/20 p-2.5"><Sparkles className="size-6" /></div>
          <div>
            <h3 className="text-[16px] font-bold">Earn XP with Peer Reviews</h3>
            <p className="text-[13px] text-white/80 mt-0.5">Review your peers' work and earn 50 XP per review! Help others improve while boosting your own progress.</p>
          </div>
        </div>
      </div>

      {reviewsLoading ? (
        <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <ReviewSkeleton key={i} />)}</div>
      ) : reviews.length === 0 ? (
        <motion.div {...fadeIn} transition={springTransition} className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-6 dark:from-emerald-950/20 dark:to-teal-950/20"><Star className="size-12 text-emerald-400/60 dark:text-emerald-500/40" /></div>
          <h3 className="text-[18px] font-bold">No Reviews Available</h3>
          <p className="text-[14px] text-muted-foreground max-w-sm">Check back later for peer review assignments.</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {reviews.map((review, i) => (
              <motion.div key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ ...springTransition, delay: i * 0.05 }}
                className="rounded-2xl ios-shadow-sm bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[15px] font-semibold">{review.assignmentTitle}</h4>
                    <p className="text-[13px] text-muted-foreground mt-0.5">by {review.revieweeName} · {timeAgo(review.submittedAt)}</p>
                    {review.courseName && <Badge variant="secondary" className="text-[9px] mt-1 border-0">{review.courseName}</Badge>}
                  </div>
                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 text-[10px]">
                    <Zap className="size-3 mr-1" /> +50 XP
                  </Badge>
                </div>
                <div className="mt-3 rounded-xl bg-muted/40 p-3">
                  <p className="text-[13px] text-muted-foreground line-clamp-3">{review.submissionContent}</p>
                </div>
                <div className="mt-3">
                  <Button size="sm" onClick={() => { setSelectedReview(review); setReviewDialogOpen(true); setReviewRating(0); setReviewFeedback('') }}
                    className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white active:scale-[0.97]">
                    <Star className="size-3.5 mr-1" /> Review Submission
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle className="text-[16px] font-bold">Peer Review</DialogTitle></DialogHeader>
          {selectedReview && (
            <div className="space-y-4 pt-2">
              <div>
                <h4 className="text-[14px] font-semibold">{selectedReview.assignmentTitle}</h4>
                <p className="text-[12px] text-muted-foreground">by {selectedReview.revieweeName}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-3 max-h-40 overflow-y-auto">
                <p className="text-[13px]">{selectedReview.submissionContent}</p>
              </div>
              <div>
                <Label className="text-[13px] font-medium">Rating *</Label>
                <div className="mt-1.5"><StarRating value={reviewRating} onChange={setReviewRating} /></div>
              </div>
              <div>
                <Label className="text-[13px] font-medium">Feedback</Label>
                <Textarea value={reviewFeedback} onChange={(e) => setReviewFeedback(e.target.value)} placeholder="Provide constructive feedback..." className="mt-1.5 min-h-[80px] text-[13px]" />
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button onClick={handleSubmitReview} disabled={submittingReview || reviewRating === 0} className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white active:scale-[0.97]">
              {submittingReview ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Send className="size-4 mr-1.5" />} Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  // ─── Render: Bookmarks Tab ──────────────────────────────────────────────

  const renderBookmarks = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-bold flex items-center gap-2">
          <BookmarkCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
          My Bookmarks
        </h3>
        <span className="text-[13px] text-muted-foreground">{bookmarks.length} saved</span>
      </div>

      {bookmarksLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)}</div>
      ) : bookmarks.length === 0 ? (
        <motion.div {...fadeIn} transition={springTransition} className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 p-6 dark:from-emerald-950/20 dark:to-teal-950/20"><Bookmark className="size-12 text-emerald-400/60 dark:text-emerald-500/40" /></div>
          <h3 className="text-[18px] font-bold">No Bookmarks Yet</h3>
          <p className="text-[14px] text-muted-foreground max-w-sm">Bookmark discussions you want to revisit later!</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {bookmarks.map((bm, i) => (
              <motion.div key={bm.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ ...springTransition, delay: i * 0.05 }}
                className="rounded-2xl ios-shadow-sm bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[12px] text-muted-foreground">by {bm.userName}</span>
                      {bm.courseName && <Badge variant="secondary" className="text-[9px] px-1.5 py-0 border-0">{bm.courseName}</Badge>}
                    </div>
                    <h4 className="text-[15px] font-semibold">{bm.title}</h4>
                    <p className="text-[13px] text-muted-foreground line-clamp-2 mt-1">{bm.content}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-[12px] text-muted-foreground"><ArrowUp className="size-3" /> {bm.upvoteCount}</span>
                      <span className="flex items-center gap-1 text-[12px] text-muted-foreground"><MessageCircle className="size-3" /> {bm.replyCount}</span>
                      <span className="text-[11px] text-muted-foreground ml-auto">Saved {timeAgo(bm.bookmarkedAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-[12px] h-7 px-2 text-primary hover:text-primary/80" onClick={() => {
                          const post = posts.find(p => p.id === bm.postId) || { id: bm.postId, title: bm.title, content: bm.content, userId: '', userName: bm.userName, courseId: '', isPinned: false, upvoteCount: bm.upvoteCount, replyCount: bm.replyCount, hasUpvoted: false, isBookmarked: true, createdAt: bm.bookmarkedAt }
                          handleViewThread(post as DiscussionPost)
                        }}>
                          <Eye className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>View thread</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-[12px] h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => handleRemoveBookmark(bm.postId)}>
                          <X className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Remove bookmark</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )

  // ─── Main Render ────────────────────────────────────────────────────────

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <GraduationCap className="size-12 text-muted-foreground/40 mx-auto" />
          <p className="text-muted-foreground">Please log in to access the community</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-[24px] sm:text-[28px] font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
          Community
        </h1>
        <p className="text-[14px] text-muted-foreground mt-1">Connect, learn, and grow with fellow students</p>
      </div>

      {/* Stats */}
      {renderStatsHeader()}

      {/* Tab Navigation */}
      {renderTabNav()}

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {activeTab === 'discussions' && renderDiscussions()}
          {activeTab === 'groups' && renderStudyGroups()}
          {activeTab === 'events' && renderEvents()}
          {activeTab === 'leaderboard' && renderLeaderboard()}
          {activeTab === 'reviews' && renderPeerReviews()}
          {activeTab === 'bookmarks' && renderBookmarks()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
