'use client'

import { motion } from 'framer-motion'
import {
  Star, Archive, BellOff, Bell, MessageCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import type { ConversationSummary, MessageTheme } from './types'
import { getInitials, getAvatarGradient, getRoleLabel, getRoleBadgeColor, getThemeColors } from './helpers'

export function ConversationListItem({
  conversation,
  isActive,
  onClick,
  onStar,
  onMute,
  onArchive,
  theme,
}: {
  conversation: ConversationSummary
  isActive: boolean
  onClick: () => void
  onStar: () => void
  onMute: () => void
  onArchive: () => void
  theme: MessageTheme
}) {
  const colors = getThemeColors(theme)

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <motion.div
          role="button"
          tabIndex={0}
          whileTap={{ scale: 0.98 }}
          onClick={onClick}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-3 text-left transition-all duration-200 relative group cursor-pointer',
            isActive
              ? cn(colors.activeBg, 'border-l-2', colors.activeBorder)
              : 'hover:bg-muted/50 border-l-2 border-l-transparent'
          )}
        >
          {/* Avatar */}
          <div className="relative shrink-0">
            <Avatar className={cn(
              'size-11 ring-2 transition-all duration-200',
              isActive ? colors.activeRing : 'ring-border/30'
            )}>
              <AvatarImage src={conversation.participantAvatar || undefined} alt={conversation.participantName} />
              <AvatarFallback className={cn(
                'text-xs font-bold text-white',
                getAvatarGradient(conversation.participantRole)
              )}>
                {getInitials(conversation.participantName)}
              </AvatarFallback>
            </Avatar>
            {conversation.online && (
              <div className="absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full bg-emerald-500 ring-2 ring-background" />
            )}
            {conversation.muted && (
              <div className="absolute -bottom-0.5 -left-0.5 size-3.5 rounded-full bg-muted-foreground/30 ring-2 ring-background flex items-center justify-center">
                <BellOff className="size-2 text-background" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={cn(
                  'text-[14px] truncate',
                  conversation.unreadCount > 0 ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'
                )}>
                  {conversation.participantName}
                </span>
                {conversation.starred && <Star className="size-3 text-amber-500 fill-amber-500 shrink-0" />}
                {theme === 'student' && conversation.isInstructor && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    Instructor
                  </Badge>
                )}
                {theme === 'student' && conversation.isSupport && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[9px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
                    Support
                  </Badge>
                )}
                {theme === 'instructor' && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    {getRoleLabel(conversation.participantRole)}
                  </Badge>
                )}
              </div>
              <span className={cn(
                'text-[11px] shrink-0',
                conversation.unreadCount > 0 ? cn(colors.unreadAccent, 'font-medium') : 'text-muted-foreground/60'
              )}>
                {conversation.lastMessageTime}
              </span>
            </div>
            {theme === 'instructor' && (
              <p className={cn('text-[11px] font-medium truncate mt-0.5', colors.unreadAccent, 'opacity-70')}>
                {conversation.courseName}
              </p>
            )}
            <div className="flex items-center justify-between gap-2">
              <p className={cn(
                'text-[12px] truncate mt-0.5 flex-1',
                conversation.unreadCount > 0 ? 'text-foreground/70 font-medium' : 'text-muted-foreground/70'
              )}>
                {conversation.lastMessage}
              </p>
              {conversation.unreadCount > 0 && (
                <span className={cn('size-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0', colors.unreadBadge)}>
                  {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                </span>
              )}
            </div>
          </div>

          {/* Hover actions */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 bg-background/90 backdrop-blur-sm rounded-lg px-1 py-0.5 shadow-sm border border-border/40">
            <button onClick={(e) => { e.stopPropagation(); onStar() }} className="p-1 rounded hover:bg-muted/60 transition-colors">
              <Star className={cn('size-3', conversation.starred ? 'fill-amber-500 text-amber-500' : 'text-muted-foreground')} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onMute() }} className="p-1 rounded hover:bg-muted/60 transition-colors">
              {conversation.muted ? <Bell className={cn('size-3', colors.accent)} /> : <BellOff className="size-3 text-muted-foreground" />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onArchive() }} className="p-1 rounded hover:bg-muted/60 transition-colors">
              <Archive className="size-3 text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      </ContextMenuTrigger>
      <ContextMenuContent className="rounded-xl">
        <ContextMenuItem onClick={onStar} className="gap-2 text-[13px]">
          <Star className={cn('size-4', conversation.starred && 'fill-amber-500 text-amber-500')} />
          {conversation.starred ? 'Unstar' : 'Star'}
        </ContextMenuItem>
        <ContextMenuItem onClick={onMute} className="gap-2 text-[13px]">
          {conversation.muted ? <Bell className="size-4" /> : <BellOff className="size-4" />}
          {conversation.muted ? 'Unmute' : 'Mute'}
        </ContextMenuItem>
        <ContextMenuItem onClick={onClick} className="gap-2 text-[13px]">
          <MessageCircle className="size-4" />
          Open conversation
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={onArchive} className="gap-2 text-[13px]">
          <Archive className="size-4" />
          {conversation.archived ? 'Unarchive' : 'Archive'}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
