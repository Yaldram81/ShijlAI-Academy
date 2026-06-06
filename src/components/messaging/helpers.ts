import type { MessageTheme } from './types'

export function getInitials(name?: string | null): string {
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

export function getRoleLabel(role: string): string {
  switch (role) {
    case 'instructor': return 'Instructor'
    case 'admin': return 'Support'
    case 'parent': return 'Parent'
    case 'student': return 'Student'
    default: return ''
  }
}

export function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'instructor': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    case 'admin': return 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
    case 'student': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    default: return 'bg-muted text-muted-foreground'
  }
}

export function formatTimeShort(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function getAvatarGradient(role: string): string {
  switch (role) {
    case 'instructor': return 'bg-gradient-to-br from-emerald-400 to-teal-500'
    case 'admin': return 'bg-gradient-to-br from-sky-400 to-blue-500'
    case 'student': return 'bg-gradient-to-br from-emerald-400 to-teal-500'
    default: return 'bg-gradient-to-br from-sky-400 to-blue-500'
  }
}

export function getThemeColors(theme: MessageTheme) {
  return {
    primary: theme === 'instructor' ? 'emerald' : 'sky',
    gradient: theme === 'instructor'
      ? 'from-emerald-500 to-teal-600'
      : 'from-sky-500 to-blue-600',
    gradientHover: theme === 'instructor'
      ? 'hover:from-emerald-600 hover:to-teal-700'
      : 'hover:from-sky-600 hover:to-blue-700',
    ring: theme === 'instructor' ? 'ring-emerald-500/20' : 'ring-primary/15',
    accent: theme === 'instructor' ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400',
    bgLight: theme === 'instructor' ? 'from-emerald-50 to-teal-50' : 'from-sky-50 to-blue-50',
    bgLightDark: theme === 'instructor' ? 'dark:from-emerald-950/20 dark:to-teal-950/20' : 'dark:from-sky-950/20 dark:to-blue-950/20',
    iconMuted: theme === 'instructor' ? 'text-emerald-400/50 dark:text-emerald-500/40' : 'text-sky-400/50 dark:text-sky-500/40',
    border: theme === 'instructor' ? 'border-emerald-500' : 'border-primary',
    ownBubble: theme === 'instructor'
      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
      : 'bg-gradient-to-br from-sky-500 to-blue-600 text-white',
    recipientChip: theme === 'instructor' ? 'bg-emerald-500/10' : 'bg-primary/10',
    activeBg: theme === 'instructor' ? 'bg-emerald-500/8' : 'bg-primary/8',
    activeBorder: theme === 'instructor' ? 'border-l-emerald-500' : 'border-l-primary',
    activeRing: theme === 'instructor' ? 'ring-emerald-500/30' : 'ring-primary/30',
    unreadAccent: theme === 'instructor' ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400',
    unreadBadge: theme === 'instructor' ? 'bg-emerald-500' : 'bg-sky-500',
    checkColor: theme === 'instructor' ? 'text-emerald-500' : 'text-sky-500',
    searchActiveBg: theme === 'instructor' ? 'bg-emerald-500/10' : 'bg-primary/10',
    editBorder: theme === 'instructor' ? 'border-emerald-500/20' : 'border-primary/20',
    editSaveBtn: theme === 'instructor' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-primary text-primary-foreground',
    reactionOwn: theme === 'instructor' ? 'bg-emerald-500/15 ring-1 ring-emerald-500/30' : 'bg-primary/15 ring-1 ring-primary/30',
    sendBtn: theme === 'instructor'
      ? 'bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white'
      : 'bg-gradient-to-br from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white',
    filterActive: theme === 'instructor'
      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm'
      : 'bg-primary text-primary-foreground shadow-sm',
    spinnerBorder: theme === 'instructor' ? 'border-emerald-500' : 'border-primary',
    inputFocus: theme === 'instructor' ? 'focus-visible:ring-emerald-500/20' : 'focus-visible:ring-primary/20',
    newMsgBtn: theme === 'instructor'
      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white'
      : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white',
    senderName: theme === 'instructor' ? 'text-emerald-600/70 dark:text-emerald-400/70' : 'text-muted-foreground/70',
  }
}

export function exportConversation(
  participantName: string,
  courseName: string,
  messages: Array<{ timestamp: string; isOwn: boolean; senderName: string; content: string }>,
) {
  const lines = messages.map(m => {
    const sender = m.isOwn ? 'You' : m.senderName
    return `[${m.timestamp}] ${sender}: ${m.content}`
  })
  const header = `Conversation with ${participantName} (${courseName})\n${'='.repeat(60)}\n\n`
  const text = header + lines.join('\n')
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `conversation-${participantName.replace(/\s+/g, '-').toLowerCase()}.txt`
  a.click()
  URL.revokeObjectURL(url)
}
