export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: string
  dateStr: string
  read: boolean
  isOwn: boolean
  type: string
  editedAt?: string | null
  deletedAt?: string | null
  reactions?: Record<string, string[]>
  readBy?: string[]
  attachments?: string | null
}

export interface ConversationSummary {
  id: string
  // Unified participant fields
  participantId: string
  participantName: string
  participantAvatar: string | null
  participantRole: string
  // Course
  courseName: string
  courseId: string | null
  // Message info
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  // Status
  online: boolean
  archived: boolean
  starred: boolean
  muted?: boolean
  // Student-specific categories
  isInstructor?: boolean
  isSupport?: boolean
}

export interface ConversationDetail {
  id: string
  participantId: string
  participantName: string
  participantAvatar: string | null
  participantRole: string
  courseName: string
  courseId: string | null
  online: boolean
  starred: boolean
  archived: boolean
  muted?: boolean
  messages: ChatMessage[]
}

export interface ContactInfo {
  id: string
  name: string
  avatar: string | null
  role: string
  courseName: string
  courseId: string
  online: boolean
}

export type StudentFilterTab = 'all' | 'instructors' | 'support' | 'starred' | 'unread' | 'archived'
export type InstructorFilterTab = 'all' | 'unread' | 'starred' | 'archived'
export type FilterTab = StudentFilterTab | InstructorFilterTab

export type MessageTheme = 'student' | 'instructor'
