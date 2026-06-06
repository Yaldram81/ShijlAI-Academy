'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Inbox, Send, Search, Loader2,
  Star, Archive, CheckCheck,
  MessageSquare, Sparkles,
  Plus, X, Paperclip, ImagePlus,
  Hash, Menu, GraduationCap, Smile, Bookmark,
  MoreVertical, Download, CircleDot,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

import {
  type ChatMessage,
  type ConversationSummary as UnifiedConversationSummary,
  type ConversationDetail as UnifiedConversationDetail,
  type ContactInfo,
  type InstructorFilterTab,
  type MessageTheme,
  QUICK_REPLY_TEMPLATES,
  getInitials,
  getAvatarGradient,
  getThemeColors,
  exportConversation,
  DateSeparator,
  EmojiPicker,
  MessageBubble,
  ConversationListItem,
  ChatHeader,
} from '@/components/messaging'

// Local types that mirror the API response (instructor-specific field names)
interface ApiConversationSummary {
  id: string
  studentId: string
  studentName: string
  studentAvatar: string | null
  courseName: string
  courseId: string | null
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  online: boolean
  archived: boolean
  starred: boolean
  muted?: boolean
}

interface ApiConversationDetail {
  id: string
  studentId: string
  studentName: string
  studentAvatar: string | null
  courseName: string
  courseId: string | null
  online: boolean
  starred: boolean
  archived: boolean
  muted?: boolean
  messages: ChatMessage[]
}

/** Map API response (instructor field names) to unified ConversationSummary */
function mapSummary(api: ApiConversationSummary): UnifiedConversationSummary {
  return {
    id: api.id,
    participantId: api.studentId,
    participantName: api.studentName,
    participantAvatar: api.studentAvatar,
    participantRole: 'student',
    courseName: api.courseName,
    courseId: api.courseId,
    lastMessage: api.lastMessage,
    lastMessageTime: api.lastMessageTime,
    unreadCount: api.unreadCount,
    online: api.online,
    archived: api.archived,
    starred: api.starred,
    muted: api.muted,
  }
}

/** Map API response (instructor field names) to unified ConversationDetail */
function mapDetail(api: ApiConversationDetail): UnifiedConversationDetail {
  return {
    id: api.id,
    participantId: api.studentId,
    participantName: api.studentName,
    participantAvatar: api.studentAvatar,
    participantRole: 'student',
    courseName: api.courseName,
    courseId: api.courseId,
    online: api.online,
    starred: api.starred,
    archived: api.archived,
    muted: api.muted,
    messages: api.messages,
  }
}

const THEME: MessageTheme = 'instructor'
const colors = getThemeColors(THEME)

/* ═══════════════════════════════════════════════════════════
   INSTRUCTOR MESSAGES VIEW — Enterprise Chat System
   ═══════════════════════════════════════════════════════════ */
export function InstructorMessagesView() {
  const { currentUser } = useAppStore()
  const instructorId = currentUser?.id || ''

  // Core state
  const [conversations, setConversations] = useState<UnifiedConversationSummary[]>([])
  const [activeConversation, setActiveConversation] = useState<UnifiedConversationDetail | null>(null)
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [filter, setFilter] = useState<InstructorFilterTab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [messageSearchQuery, setMessageSearchQuery] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const [totalUnread, setTotalUnread] = useState(0)

  // Feature state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showInputEmojiPicker, setShowInputEmojiPicker] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false)
  const [contacts, setContacts] = useState<ContactInfo[]>([])
  const [contactSearch, setContactSearch] = useState('')
  const [newMsgRecipient, setNewMsgRecipient] = useState<ContactInfo | null>(null)
  const [newMsgContent, setNewMsgContent] = useState('')
  const [showMessageSearch, setShowMessageSearch] = useState(false)
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [aiSuggesting, setAiSuggesting] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [showProfilePanel, setShowProfilePanel] = useState(false)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  const editInputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ─── Fetch conversations ───
  const fetchConversations = useCallback(async () => {
    if (!instructorId) return
    try {
      const res = await fetch(`/api/instructor/messages?instructorId=${instructorId}&filter=${filter === 'starred' || filter === 'unread' ? 'all' : filter}`)
      if (res.ok) {
        const data = await res.json()
        const mapped = (data.conversations || []).map(mapSummary)
        setConversations(mapped)
        setTotalUnread(data.totalUnread || 0)
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
    } finally {
      setLoading(false)
    }
  }, [instructorId, filter])

  useEffect(() => { fetchConversations() }, [fetchConversations])

  // ─── Fetch conversation detail ───
  const selectConversation = useCallback(async (convId: string) => {
    if (!instructorId) return
    try {
      const res = await fetch(`/api/instructor/messages/${convId}?instructorId=${instructorId}`)
      if (res.ok) {
        const data = await res.json()
        setActiveConversation(mapDetail(data.conversation))
        setActiveConvId(convId)
        setMobileShowChat(true)
        setShowMessageSearch(false)
        setMessageSearchQuery('')
        setAiSuggestion(null)
        setShowQuickReplies(false)
        setShowInputEmojiPicker(false)

        await fetch('/api/instructor/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'mark-read', instructorId, conversationId: convId }),
        })
        fetchConversations()
      }
    } catch (err) {
      console.error('Failed to fetch conversation:', err)
    }
  }, [instructorId, fetchConversations])

  // ─── Send message ───
  const handleSendMessage = async (overrideContent?: string) => {
    const content = overrideContent || messageInput
    if (!content.trim() || !activeConvId || !instructorId || sendingMessage) return
    setSendingMessage(true)
    try {
      const res = await fetch('/api/instructor/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          instructorId,
          conversationId: activeConvId,
          content: content.trim(),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const newMsg: ChatMessage = {
          id: data.message?.id || `m-${Date.now()}`,
          senderId: instructorId,
          senderName: 'You',
          content: content.trim(),
          timestamp: data.message?.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dateStr: data.message?.dateStr || 'Today',
          read: false,
          isOwn: true,
          type: 'text',
        }
        setActiveConversation(prev => prev ? { ...prev, messages: [...prev.messages, newMsg] } : null)
        setMessageInput('')
        setAiSuggestion(null)
        setShowQuickReplies(false)
        fetchConversations()
        messageInputRef.current?.focus()
      }
    } catch (err) {
      console.error('Failed to send message:', err)
      toast.error('Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  // ─── Start new conversation ───
  const handleStartConversation = async () => {
    if (!newMsgRecipient || !newMsgContent.trim() || !instructorId) return
    try {
      const res = await fetch('/api/instructor/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          instructorId,
          studentId: newMsgRecipient.id,
          content: newMsgContent.trim(),
          courseId: newMsgRecipient.courseId || undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success('Conversation started')
        setShowNewMessageDialog(false)
        setNewMsgRecipient(null)
        setNewMsgContent('')
        setContactSearch('')
        fetchConversations()
        if (data.conversationId) {
          selectConversation(data.conversationId)
        }
      }
    } catch {
      toast.error('Failed to start conversation')
    }
  }

  // ─── Conversation actions ───
  const handleStarConversation = async (convId: string) => {
    try {
      await fetch('/api/instructor/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'star', instructorId, conversationId: convId }),
      })
      toast.success('Star status updated')
      fetchConversations()
      if (activeConvId === convId) {
        setActiveConversation(prev => prev ? { ...prev, starred: !prev.starred } : null)
      }
    } catch { toast.error('Failed to update') }
  }

  const handleMuteConversation = async (convId: string) => {
    try {
      await fetch('/api/instructor/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mute', instructorId, conversationId: convId }),
      })
      toast.success('Mute status updated')
      fetchConversations()
      if (activeConvId === convId) {
        setActiveConversation(prev => prev ? { ...prev, muted: !prev.muted } : null)
      }
    } catch { toast.error('Failed to update') }
  }

  const handleArchiveConversation = async (convId: string) => {
    try {
      await fetch('/api/instructor/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive', instructorId, conversationId: convId }),
      })
      toast.success('Conversation archived')
      fetchConversations()
      handleBackToList()
    } catch { toast.error('Failed to archive') }
  }

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/instructor/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk-mark-read', instructorId }),
      })
      toast.success('All messages marked as read')
      fetchConversations()
    } catch { toast.error('Failed to mark all as read') }
  }

  const handleBulkArchive = async () => {
    const unreadConvIds = conversations.filter(c => c.unreadCount > 0 && !c.archived).map(c => c.id)
    if (unreadConvIds.length === 0) {
      toast.info('No conversations to archive')
      return
    }
    try {
      await fetch('/api/instructor/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bulk-archive', instructorId, conversationIds: unreadConvIds }),
      })
      toast.success(`${unreadConvIds.length} conversations archived`)
      fetchConversations()
    } catch { toast.error('Failed to bulk archive') }
  }

  const handleExportConversation = useCallback(() => {
    if (!activeConversation) return
    exportConversation(
      activeConversation.participantName,
      activeConversation.courseName,
      activeConversation.messages,
    )
    toast.success('Conversation exported')
  }, [activeConversation])

  // ─── Message actions ───
  const handleDeleteMessage = async (messageId: string) => {
    try {
      await fetch('/api/instructor/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-message', instructorId, messageId }),
      })
      toast.success('Message deleted')
      if (activeConvId) selectConversation(activeConvId)
    } catch { toast.error('Failed to delete message') }
  }

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!newContent.trim()) return
    try {
      await fetch('/api/instructor/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit-message', instructorId, messageId, content: newContent.trim() }),
      })
      setActiveConversation(prev => prev ? {
        ...prev,
        messages: prev.messages.map(m =>
          m.id === messageId ? { ...m, content: newContent.trim(), editedAt: new Date().toISOString() } : m
        ),
      } : null)
      setEditingMessageId(null)
      setEditContent('')
      toast.success('Message edited')
    } catch { toast.error('Failed to edit message') }
  }

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      await fetch('/api/instructor/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add-reaction', instructorId, messageId, emoji }),
      })
      // Optimistic update - ONE emoji per person per message
      setActiveConversation(prev => prev ? {
        ...prev,
        messages: prev.messages.map(m => {
          if (m.id !== messageId) return m
          const reactions = { ...(m.reactions || {}) }

          // Find user's existing reaction
          let existingEmoji: string | null = null
          for (const [e, ids] of Object.entries(reactions)) {
            if (ids?.includes(instructorId)) {
              existingEmoji = e
              break
            }
          }

          // Remove existing reaction if any
          if (existingEmoji) {
            reactions[existingEmoji] = reactions[existingEmoji].filter(id => id !== instructorId)
            if (reactions[existingEmoji].length === 0) delete reactions[existingEmoji]
          }

          // Add new reaction (if different from existing, or no existing)
          if (existingEmoji !== emoji) {
            if (!reactions[emoji]) {
              reactions[emoji] = [instructorId]
            } else {
              reactions[emoji] = [...reactions[emoji], instructorId]
            }
          }

          return { ...m, reactions }
        }),
      } : null)
    } catch { toast.error('Failed to add reaction') }
  }

  const handleSearchMessages = async (query: string) => {
    if (!query.trim() || !instructorId) return
    try {
      if (activeConversation) {
        const results = activeConversation.messages.filter(m =>
          m.content.toLowerCase().includes(query.toLowerCase()) && !m.deletedAt
        )
        setSearchResults(results)
      }
    } catch { console.error('Search failed') }
  }

  // ─── AI Suggest Reply ───
  const handleAiSuggest = useCallback(async () => {
    if (!activeConversation) return
    setAiSuggesting(true)
    setAiSuggestion(null)

    try {
      const lastStudentMsg = [...activeConversation.messages].reverse().find(m => !m.isOwn)
      const res = await fetch('/api/instructor/ai/suggest-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: activeConversation.participantName,
          courseName: activeConversation.courseName,
          lastMessage: lastStudentMsg?.content || '',
        }),
      })

      if (!res.ok) throw new Error('Failed to get suggestion')
      const data = await res.json()
      setAiSuggestion(data.suggestion || 'Thank you for reaching out! Let me look into this for you.')
    } catch {
      // Fallback suggestions
      const fallbacks = [
        `Great question! Let me explain that in detail. The key concept here is understanding how the pieces fit together — I'd recommend reviewing Section 3 again and trying the practice exercise.`,
        `Thanks for asking! This is a common point of confusion. The short answer is: practice makes perfect. Try working through the examples in Module 2 and let me know if it clicks.`,
        `I appreciate your patience! Let me check on this and get back to you. In the meantime, feel free to review the related materials in the course resources section.`,
      ]
      setAiSuggestion(fallbacks[Math.floor(Math.random() * fallbacks.length)])
    } finally {
      setAiSuggesting(false)
    }
  }, [activeConversation])

  // ─── Fetch contacts for new message ───
  useEffect(() => {
    if (showNewMessageDialog && instructorId) {
      fetch(`/api/instructor/messages/contacts?instructorId=${instructorId}`)
        .then(r => r.json())
        .then(data => setContacts(data.contacts || []))
        .catch(console.error)
    }
  }, [showNewMessageDialog, instructorId])

  // ─── Auto-scroll ───
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeConversation?.messages?.length])

  // ─── Keyboard shortcuts ───
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleEditKeyDown = (e: React.KeyboardEvent, messageId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEditMessage(messageId, editContent)
    }
    if (e.key === 'Escape') {
      setEditingMessageId(null)
      setEditContent('')
    }
  }

  // ─── Simulated typing indicator ───
  useEffect(() => {
    if (messageInput.length > 0 && activeConvId) {
      setIsTyping(true)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000)
    } else {
      setIsTyping(false)
    }
    return () => { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current) }
  }, [messageInput, activeConvId])

  // ─── Filter conversations ───
  const filteredConversations = useMemo(() => {
    let result = conversations.filter(c =>
      !searchQuery ||
      c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.courseName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    if (filter === 'unread') result = result.filter(c => c.unreadCount > 0)
    if (filter === 'starred') result = result.filter(c => c.starred)
    if (filter === 'archived') result = result.filter(c => c.archived)
    else result = result.filter(c => !c.archived)
    return result
  }, [conversations, searchQuery, filter])

  const handleBackToList = () => {
    setMobileShowChat(false)
    setActiveConvId(null)
    setActiveConversation(null)
    setShowMessageSearch(false)
    setShowProfilePanel(false)
    setShowInputEmojiPicker(false)
  }

  const activeConvSummary = conversations.find(c => c.id === activeConvId)

  // ─── Tab counts ───
  const tabCounts = useMemo(() => ({
    all: conversations.filter(c => !c.archived).length,
    unread: conversations.filter(c => c.unreadCount > 0 && !c.archived).length,
    starred: conversations.filter(c => c.starred && !c.archived).length,
    archived: conversations.filter(c => c.archived).length,
  }), [conversations])

  /* ─── RENDER ─── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="flex h-full"
    >
      <div className="flex flex-1 min-h-0 overflow-hidden rounded-2xl border border-border/40 ios-glass-thick">

        {/* ═══ LEFT: Conversation List ═══ */}
        <div className={cn(
          'flex flex-col shrink-0 bg-background transition-all duration-300',
          sidebarCollapsed ? 'w-0 md:w-[60px] overflow-hidden border-r-0' : 'w-full md:w-[340px] lg:w-[380px] border-r border-border/40',
          mobileShowChat ? 'hidden md:flex' : 'flex'
        )}>
          {/* ─── Sidebar Header ─── */}
          <div className={cn(
            'px-4 py-3 border-b border-border/40',
            !sidebarCollapsed && 'space-y-3'
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg hidden md:flex"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                >
                  <Menu className="size-4" />
                </Button>
                {!sidebarCollapsed && (
                  <div>
                    <h1 className="text-[18px] font-bold text-foreground leading-tight">Messages</h1>
                    <p className="text-[12px] text-muted-foreground">
                      {totalUnread > 0 ? (
                        <span className={cn(colors.accent, 'font-medium')}>{totalUnread} unread</span>
                      ) : 'All caught up'}
                    </p>
                  </div>
                )}
              </div>
              {!sidebarCollapsed && (
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 rounded-lg" onClick={handleMarkAllRead}>
                        <CheckCheck className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Mark all read</TooltipContent>
                  </Tooltip>
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 rounded-lg">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>More actions</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end" className="rounded-xl w-52">
                      <DropdownMenuItem className="gap-2 text-[13px]" onClick={handleBulkArchive}>
                        <Archive className="size-4" />
                        Bulk archive unread
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-[13px]" onClick={handleMarkAllRead}>
                        <CheckCheck className="size-4" />
                        Mark all as read
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 rounded-lg">
                            <Plus className="size-4" />
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>New message</TooltipContent>
                    </Tooltip>
                    <DialogContent className="sm:max-w-md rounded-xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <GraduationCap className="size-5" />
                          New Message
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-2">
                        {/* Contact search */}
                        <div className="space-y-2">
                          <label className="text-[13px] font-medium text-foreground">To:</label>
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
                            <Input
                              placeholder="Search students..."
                              value={contactSearch}
                              onChange={(e) => setContactSearch(e.target.value)}
                              className="pl-8 h-9 bg-muted/50 border-0 rounded-lg text-[13px]"
                            />
                          </div>
                          {newMsgRecipient && (
                            <div className={cn('flex items-center gap-2 rounded-lg px-3 py-1.5', colors.recipientChip)}>
                              <Avatar className="size-6">
                                <AvatarFallback className={cn('text-[10px] text-white', getAvatarGradient('student'))}>{getInitials(newMsgRecipient.name)}</AvatarFallback>
                              </Avatar>
                              <span className="text-[13px] font-medium flex-1 truncate">{newMsgRecipient.name}</span>
                              <span className="text-[11px] text-muted-foreground truncate">{newMsgRecipient.courseName}</span>
                              <Button variant="ghost" size="icon" className="size-5" onClick={() => setNewMsgRecipient(null)}>
                                <X className="size-3" />
                              </Button>
                            </div>
                          )}
                          {!newMsgRecipient && (
                            <ScrollArea className="max-h-[200px]">
                              <div className="space-y-0.5">
                                {contacts
                                  .filter(c => !contactSearch || c.name.toLowerCase().includes(contactSearch.toLowerCase()))
                                  .map(contact => (
                                    <button
                                      key={contact.id + contact.courseId}
                                      onClick={() => setNewMsgRecipient(contact)}
                                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                                    >
                                      <Avatar className="size-8">
                                        <AvatarFallback className={cn('text-[10px] text-white', getAvatarGradient('student'))}>
                                          {getInitials(contact.name)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-medium truncate">{contact.name}</p>
                                        <p className="text-[11px] text-muted-foreground truncate">{contact.courseName}</p>
                                      </div>
                                      {contact.online && <div className="size-2 rounded-full bg-emerald-500" />}
                                    </button>
                                  ))}
                                {contacts.length === 0 && (
                                  <p className="text-[12px] text-muted-foreground text-center py-4">No students found</p>
                                )}
                              </div>
                            </ScrollArea>
                          )}
                        </div>
                        {/* Message */}
                        {newMsgRecipient && (
                          <div className="space-y-2">
                            <label className="text-[13px] font-medium text-foreground">Message:</label>
                            <Textarea
                              placeholder="Type your message..."
                              value={newMsgContent}
                              onChange={(e) => setNewMsgContent(e.target.value)}
                              className="min-h-[100px] bg-muted/50 border-0 rounded-lg text-[13px] resize-none"
                            />
                            <Button
                              onClick={handleStartConversation}
                              disabled={!newMsgContent.trim()}
                              className={cn('w-full rounded-lg', colors.newMsgBtn)}
                            >
                              <Send className="size-4 mr-2" />
                              Send Message
                            </Button>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>

            {/* Search + Filter (when not collapsed) */}
            {!sidebarCollapsed && (
              <>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    type="search"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 bg-muted/50 border-0 rounded-lg text-[13px] placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-primary/20"
                  />
                  {searchQuery && (
                    <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 size-6" onClick={() => setSearchQuery('')}>
                      <X className="size-3" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                  {([
                    { key: 'all' as InstructorFilterTab, label: 'All', icon: Inbox, count: tabCounts.all },
                    { key: 'unread' as InstructorFilterTab, label: 'Unread', icon: Inbox, count: tabCounts.unread },
                    { key: 'starred' as InstructorFilterTab, label: 'Starred', icon: Star, count: tabCounts.starred },
                    { key: 'archived' as InstructorFilterTab, label: 'Archived', icon: Archive, count: tabCounts.archived },
                  ]).map(({ key, label, icon: Icon, count }) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={cn(
                        'flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200 whitespace-nowrap',
                        filter === key
                          ? colors.filterActive
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className="size-3" />
                      {label}
                      {count > 0 && (
                        <span className={cn(
                          'ml-0.5 rounded-full px-1 text-[9px] font-bold',
                          filter === key ? 'bg-white/20' : 'bg-muted'
                        )}>{count}</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Conversation List */}
          {!sidebarCollapsed && (
            <ScrollArea className="flex-1 min-h-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className={cn('size-8 rounded-full border-2 border-t-transparent animate-spin', colors.spinnerBorder)} />
                  <p className="text-[13px] text-muted-foreground">Loading messages...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4 px-4">
                  <div className={cn('rounded-2xl bg-gradient-to-br p-6', colors.bgLight, colors.bgLightDark)}>
                    <MessageSquare className={cn('size-10', colors.iconMuted)} />
                  </div>
                  <div className="text-center space-y-1">
                    <h3 className="text-[16px] font-semibold text-foreground">No Messages</h3>
                    <p className="text-[13px] text-muted-foreground max-w-[220px]">
                      {searchQuery ? 'No results found.' : filter === 'archived' ? 'No archived conversations.' : 'Start a conversation with a student.'}
                    </p>
                  </div>
                  {!searchQuery && filter !== 'archived' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => setShowNewMessageDialog(true)}
                    >
                      <Plus className="size-3.5 mr-1.5" /> New Message
                    </Button>
                  )}
                </div>
              ) : (
                <div className="py-0.5">
                  {filteredConversations.map((conv) => (
                    <ConversationListItem
                      key={conv.id}
                      conversation={conv}
                      isActive={activeConvId === conv.id}
                      onClick={() => selectConversation(conv.id)}
                      onStar={() => handleStarConversation(conv.id)}
                      onMute={() => handleMuteConversation(conv.id)}
                      onArchive={() => handleArchiveConversation(conv.id)}
                      theme={THEME}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          )}
        </div>

        {/* ═══ CENTER: Chat View ═══ */}
        <div className={cn(
          'flex flex-col flex-1 min-w-0 h-full bg-background',
          !mobileShowChat ? 'hidden md:flex' : 'flex'
        )}>
          {activeConversation ? (
            <>
              {/* ─── Chat Header ─── */}
              <ChatHeader
                conversation={activeConversation}
                convSummary={activeConvSummary}
                onBack={handleBackToList}
                onRefresh={fetchConversations}
                onStar={() => handleStarConversation(activeConversation.id)}
                onMute={() => handleMuteConversation(activeConversation.id)}
                onArchive={() => handleArchiveConversation(activeConversation.id)}
                onSearchToggle={() => setShowMessageSearch(!showMessageSearch)}
                showMessageSearch={showMessageSearch}
                onExport={handleExportConversation}
                onToggleProfile={() => setShowProfilePanel(!showProfilePanel)}
                theme={THEME}
              />

              {/* ─── Message Search Bar ─── */}
              <AnimatePresence>
                {showMessageSearch && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-b border-border/40"
                  >
                    <div className="px-4 py-2 flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground/60" />
                        <Input
                          placeholder="Search in conversation..."
                          value={messageSearchQuery}
                          onChange={(e) => {
                            setMessageSearchQuery(e.target.value)
                            if (e.target.value.trim()) handleSearchMessages(e.target.value)
                            else setSearchResults([])
                          }}
                          className="pl-8 h-8 bg-muted/50 border-0 rounded-lg text-[13px]"
                          autoFocus
                        />
                      </div>
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => { setShowMessageSearch(false); setMessageSearchQuery(''); setSearchResults([]) }}>
                        <X className="size-4" />
                      </Button>
                    </div>
                    {messageSearchQuery && searchResults.length > 0 && (
                      <div className="px-4 pb-2 text-[11px] text-muted-foreground">
                        {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ─── Messages Area (scrollable, takes remaining space) ─── */}
              <ScrollArea className="flex-1 min-h-0 px-4 md:px-6">
                <div className="py-4 space-y-1">
                  {/* Conversation start indicator */}
                  <div className="flex items-center justify-center py-4">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Avatar className={cn('size-12 ring-2', colors.ring)}>
                        <AvatarImage src={activeConversation.participantAvatar || undefined} />
                        <AvatarFallback className={cn('text-sm font-bold text-white', getAvatarGradient('student'))}>
                          {getInitials(activeConversation.participantName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-[14px] font-semibold text-foreground">{activeConversation.participantName}</p>
                        <p className="text-[12px] text-muted-foreground">
                          Student
                          {activeConversation.courseName && activeConversation.courseName !== 'General' && ` · ${activeConversation.courseName}`}
                        </p>
                      </div>
                      <p className="text-[11px] text-muted-foreground/60 flex items-center gap-1">
                        <Hash className="size-3" />
                        This is the beginning of your conversation
                      </p>
                    </div>
                  </div>

                  {activeConversation.messages.map((msg, idx) => {
                    const prevMsg = idx > 0 ? activeConversation.messages[idx - 1] : null
                    const showDateSep = prevMsg && prevMsg.dateStr !== msg.dateStr

                    return (
                      <div key={msg.id}>
                        {(idx === 0 || showDateSep) && <DateSeparator date={msg.dateStr} />}
                        <MessageBubble
                          message={msg}
                          userId={instructorId}
                          theme={THEME}
                          isEditing={editingMessageId === msg.id}
                          editContent={editContent}
                          onEditStart={() => { setEditingMessageId(msg.id); setEditContent(msg.content) }}
                          onEditCancel={() => { setEditingMessageId(null); setEditContent('') }}
                          onEditSubmit={() => handleEditMessage(msg.id, editContent)}
                          onEditContentChange={setEditContent}
                          onEditKeyDown={handleEditKeyDown}
                          onDelete={() => handleDeleteMessage(msg.id)}
                          onReaction={(emoji) => handleAddReaction(msg.id, emoji)}
                          isSearchHighlight={messageSearchQuery ? msg.content.toLowerCase().includes(messageSearchQuery.toLowerCase()) : false}
                          participantRole="student"
                        />
                      </div>
                    )
                  })}

                  {activeConversation.messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Sparkles className="size-8 text-emerald-500/30" />
                      <p className="text-[13px] text-muted-foreground text-center">
                        No messages yet. Say hello! 👋
                      </p>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* ─── AI Suggestion Bar (above input, fixed) ─── */}
              <AnimatePresence>
                {aiSuggestion && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="shrink-0 overflow-hidden border-t border-border/40 bg-gradient-to-r from-emerald-500/5 to-teal-500/5"
                  >
                    <div className="px-4 py-2.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Sparkles className={cn('size-3.5', colors.accent)} />
                        <span className={cn('text-[12px] font-semibold', colors.accent)}>AI Suggested Reply</span>
                        <button
                          onClick={() => setAiSuggestion(null)}
                          className="ml-auto text-muted-foreground hover:text-foreground"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                      <p className="text-[13px] text-foreground/80 leading-relaxed bg-card/80 rounded-xl p-2.5 border border-emerald-500/10">
                        {aiSuggestion}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          className={cn('gap-1.5 rounded-xl text-[12px] h-7', colors.sendBtn)}
                          onClick={() => handleSendMessage(aiSuggestion)}
                        >
                          <Send className="size-3" />
                          Send
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 rounded-xl text-[12px] h-7"
                          onClick={() => {
                            setMessageInput(aiSuggestion)
                            setAiSuggestion(null)
                            messageInputRef.current?.focus()
                          }}
                        >
                          Edit & Send
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 rounded-xl text-[12px] h-7"
                          onClick={handleAiSuggest}
                        >
                          <Sparkles className="size-3" />
                          Regenerate
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ─── Emoji Picker (floating above input) ─── */}
              <AnimatePresence>
                {showInputEmojiPicker && (
                  <div className="relative">
                    <EmojiPicker
                      onSelect={(emoji) => {
                        setMessageInput(prev => prev + emoji)
                        setShowInputEmojiPicker(false)
                        messageInputRef.current?.focus()
                      }}
                      onClose={() => setShowInputEmojiPicker(false)}
                      theme={THEME}
                    />
                  </div>
                )}
              </AnimatePresence>

              {/* ─── Message Input (fixed at bottom) ─── */}
              <div className="shrink-0 border-t border-border/40 bg-background px-3 md:px-5 py-2.5">
                {/* Quick reply templates dropdown */}
                <AnimatePresence>
                  {showQuickReplies && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mb-2"
                    >
                      <div className="bg-muted/50 rounded-xl p-2 space-y-0.5 max-h-[200px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border">
                        <div className="flex items-center justify-between px-2 py-1 sticky top-0 bg-muted/50">
                          <span className="text-[11px] font-semibold text-muted-foreground">Quick Replies</span>
                          <Button variant="ghost" size="icon" className="size-5" onClick={() => setShowQuickReplies(false)}>
                            <X className="size-3" />
                          </Button>
                        </div>
                        {QUICK_REPLY_TEMPLATES.map((template, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setMessageInput(template)
                              setShowQuickReplies(false)
                              messageInputRef.current?.focus()
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg text-[12px] text-foreground/80 hover:bg-muted/60 transition-colors"
                          >
                            {template}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-end gap-1.5">
                  {/* Left action buttons group */}
                  <div className="flex items-center shrink-0 pb-0.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground/60 hover:text-foreground" onClick={() => fileInputRef.current?.click()}>
                          <Paperclip className="size-[18px]" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Attach</TooltipContent>
                    </Tooltip>
                    <input ref={fileInputRef} type="file" className="hidden" />
                  </div>

                  {/* Text input area with inline actions */}
                  <div className="flex-1 relative flex items-end bg-muted/50 rounded-2xl border border-border/30 focus-within:border-primary/30 transition-colors">
                    <Textarea
                      ref={messageInputRef}
                      placeholder="Message..."
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={sendingMessage}
                      className="flex-1 min-h-[38px] max-h-[120px] bg-transparent border-0 rounded-2xl text-[14px] px-4 py-2 resize-none placeholder:text-muted-foreground/50 overflow-y-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                      rows={1}
                    />
                    {/* Inline right actions inside input */}
                    <div className="flex items-center shrink-0 pr-1.5 pb-1 gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-lg text-muted-foreground/50 hover:text-emerald-600"
                            onClick={handleAiSuggest}
                            disabled={aiSuggesting}
                          >
                            {aiSuggesting ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>AI suggest</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-lg text-muted-foreground/50 hover:text-foreground"
                            onClick={() => setShowQuickReplies(!showQuickReplies)}
                          >
                            <Bookmark className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Quick replies</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-lg text-muted-foreground/50 hover:text-foreground"
                            onClick={() => setShowInputEmojiPicker(!showInputEmojiPicker)}
                          >
                            <Smile className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Emoji</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Send button */}
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!messageInput.trim() || sendingMessage}
                    size="icon"
                    className={cn('size-9 rounded-xl shadow-sm shrink-0 disabled:opacity-30 transition-all', colors.sendBtn, messageInput.trim() && 'scale-100')}
                  >
                    {sendingMessage ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </Button>
                </div>

                <div className="flex items-center justify-between mt-1 px-1">
                  <p className="text-[10px] text-muted-foreground/30">Enter to send · Shift+Enter for new line</p>
                  {messageInput.length > 0 && (
                    <p className="text-[10px] text-muted-foreground/30">{messageInput.length}</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full gap-5 px-4">
              <div className={cn('rounded-2xl bg-gradient-to-br p-8', colors.bgLight, colors.bgLightDark)}>
                <Inbox className={cn('size-12', colors.iconMuted)} />
              </div>
              <div className="text-center space-y-1.5">
                <h3 className="text-[18px] font-bold text-foreground">Student Messages</h3>
                <p className="text-[14px] text-muted-foreground max-w-[320px]">
                  Select a conversation or start a new one to chat with your students.
                </p>
              </div>
              <Button
                onClick={() => setShowNewMessageDialog(true)}
                className={cn('rounded-xl', colors.newMsgBtn)}
              >
                <Plus className="size-4 mr-2" /> New Message
              </Button>
            </div>
          )}
        </div>

        {/* ═══ RIGHT: Student Profile Panel ═══ */}
        <AnimatePresence>
          {showProfilePanel && activeConversation && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="hidden lg:flex flex-col border-l border-border/40 bg-background overflow-hidden"
            >
              <StudentProfilePanel
                conversation={activeConversation}
                onClose={() => setShowProfilePanel(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

/* ─── Student Profile Panel (instructor-specific) ─── */
function StudentProfilePanel({
  conversation,
  onClose,
}: {
  conversation: UnifiedConversationDetail
  onClose: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
        <span className="text-[13px] font-semibold text-foreground">Student Info</span>
        <Button variant="ghost" size="icon" className="size-7" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {/* Student avatar & name */}
      <div className="flex flex-col items-center gap-3 px-4 py-6">
        <Avatar className="size-20 ring-4 ring-emerald-500/20">
          <AvatarImage src={conversation.participantAvatar || undefined} />
          <AvatarFallback className="text-xl font-bold text-white bg-gradient-to-br from-emerald-400 to-teal-500">
            {getInitials(conversation.participantName)}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <h3 className="text-[16px] font-bold text-foreground">{conversation.participantName}</h3>
          <Badge variant="secondary" className="mt-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <GraduationCap className="size-3 mr-1" />
            Student
          </Badge>
        </div>
      </div>

      <Separator className="mx-4" />

      {/* Student details */}
      <div className="px-4 py-4 space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className={cn('size-8 rounded-lg flex items-center justify-center', colors.recipientChip)}>
              <GraduationCap className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Role</p>
              <p className="text-[13px] font-medium text-foreground">Student</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn('size-8 rounded-lg flex items-center justify-center', colors.recipientChip)}>
              <MessageSquare className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Course</p>
              <p className="text-[13px] font-medium text-foreground">{conversation.courseName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn('size-8 rounded-lg flex items-center justify-center', conversation.online ? 'bg-emerald-500/10' : 'bg-muted')}>
              <div className={cn('size-2.5 rounded-full', conversation.online ? 'bg-emerald-500' : 'bg-muted-foreground/40')} />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Status</p>
              <p className={cn('text-[13px] font-medium', conversation.online ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground')}>
                {conversation.online ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Separator className="mx-4" />

      {/* Quick actions */}
      <div className="px-4 py-4 space-y-2">
        <Button variant="outline" size="sm" className="w-full justify-start gap-2 rounded-lg text-[12px]" onClick={() => {
          exportConversation(conversation.participantName, conversation.courseName, conversation.messages)
          toast.success('Conversation exported')
          onClose()
        }}>
          <Download className="size-3.5" />
          Export Conversation
        </Button>
      </div>
    </div>
  )
}
