'use client'

import {
  ArrowLeft, Star, Archive, BellOff, Bell,
  Search, MoreVertical, Download, Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { ConversationDetail, ConversationSummary, MessageTheme } from './types'
import { getInitials, getAvatarGradient, getRoleLabel, getRoleBadgeColor, getThemeColors } from './helpers'

export function ChatHeader({
  conversation,
  convSummary,
  onBack,
  onRefresh,
  onStar,
  onMute,
  onArchive,
  onSearchToggle,
  showMessageSearch,
  onExport,
  onToggleProfile,
  theme,
}: {
  conversation: ConversationDetail
  convSummary?: ConversationSummary
  onBack: () => void
  onRefresh: () => void
  onStar: () => void
  onMute: () => void
  onArchive: () => void
  onSearchToggle: () => void
  showMessageSearch: boolean
  onExport: () => void
  onToggleProfile?: () => void
  theme: MessageTheme
}) {
  const colors = getThemeColors(theme)

  return (
    <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-border/40 ios-glass-thick">
      <Button variant="ghost" size="icon" className="md:hidden size-8 rounded-full shrink-0" onClick={onBack}>
        <ArrowLeft className="size-4" />
      </Button>

      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative shrink-0">
          <Avatar className={cn('size-10 ring-2', colors.ring)}>
            <AvatarImage src={conversation.participantAvatar || undefined} alt={conversation.participantName} />
            <AvatarFallback className={cn(
              'text-xs font-bold text-white',
              getAvatarGradient(conversation.participantRole)
            )}>
              {getInitials(conversation.participantName)}
            </AvatarFallback>
          </Avatar>
          {conversation.online && (
            <div className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 ring-2 ring-background" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold text-foreground truncate">{conversation.participantName}</h2>
            <Badge variant="secondary" className={cn(
              'h-4 px-1.5 text-[9px] font-semibold shrink-0',
              getRoleBadgeColor(conversation.participantRole)
            )}>
              {getRoleLabel(conversation.participantRole)}
            </Badge>
            {conversation.starred && <Star className="size-3 text-amber-500 fill-amber-500" />}
            {conversation.muted && <BellOff className="size-3 text-muted-foreground/50" />}
          </div>
          <div className="flex items-center gap-1.5">
            {conversation.online ? (
              <span className={cn('text-[11px] font-medium', colors.accent)}>Online</span>
            ) : (
              <span className="text-[11px] text-muted-foreground/60">Offline</span>
            )}
            {conversation.courseName && conversation.courseName !== 'General' && (
              <>
                <span className="text-[11px] text-muted-foreground/40">·</span>
                <span className="text-[11px] text-muted-foreground/60 truncate">{conversation.courseName}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-0.5 shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={cn('size-8 rounded-full', showMessageSearch && colors.searchActiveBg)} onClick={onSearchToggle}>
              <Search className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Search messages</TooltipContent>
        </Tooltip>

        {onToggleProfile && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 rounded-full hidden lg:flex" onClick={onToggleProfile}>
                <Info className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{theme === 'instructor' ? 'Student info' : 'Info'}</TooltipContent>
          </Tooltip>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 rounded-full">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl w-52">
            <DropdownMenuLabel className="text-[11px] text-muted-foreground">Actions</DropdownMenuLabel>
            <DropdownMenuItem className="gap-2 text-[13px]" onClick={onStar}>
              <Star className={cn('size-4', conversation.starred && 'fill-amber-500 text-amber-500')} />
              {conversation.starred ? 'Unstar Conversation' : 'Star Conversation'}
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-[13px]" onClick={onMute}>
              {conversation.muted ? <Bell className="size-4" /> : <BellOff className="size-4" />}
              {conversation.muted ? 'Unmute Notifications' : 'Mute Notifications'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-[13px]" onClick={onExport}>
              <Download className="size-4" />
              Export Conversation
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-[13px]" onClick={onArchive}>
              <Archive className="size-4" />
              Archive Conversation
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {onToggleProfile ? (
              <DropdownMenuItem className="gap-2 text-[13px] text-muted-foreground" onClick={onToggleProfile}>
                <Info className="size-4" />
                {theme === 'instructor' ? 'Student Profile' : 'Conversation Info'}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="gap-2 text-[13px] text-muted-foreground">
                <Info className="size-4" />
                Conversation Info
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
