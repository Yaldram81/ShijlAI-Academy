'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, CheckCheck, Edit3, Trash2, Smile, Copy, Reply,
  ThumbsUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { toast } from 'sonner'
import { QUICK_EMOJIS, EMOJI_CATEGORIES } from './constants'
import type { ChatMessage, MessageTheme } from './types'
import { getThemeColors } from './helpers'

/** Mini emoji picker that appears near the message */
function MiniEmojiPicker({
  onSelect,
  onClose,
  theme,
  position,
}: {
  onSelect: (emoji: string) => void
  onClose: () => void
  theme: MessageTheme
  position: 'left' | 'right'
}) {
  const colors = getThemeColors(theme)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.9, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 4 }}
        transition={{ duration: 0.15 }}
        className={cn(
          'absolute z-50 bg-popover border border-border/60 rounded-xl shadow-lg p-2 w-[280px]',
          position === 'right' ? 'bottom-full right-0 mb-1' : 'bottom-full left-0 mb-1'
        )}
      >
        {/* Quick reactions */}
        <div className="flex flex-wrap gap-0.5 mb-2 p-1.5 bg-muted/30 rounded-lg">
          {QUICK_EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => { onSelect(emoji); onClose() }}
              className="size-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-[16px]"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Category tabs */}
        <EmojiGrid onSelect={(emoji) => { onSelect(emoji); onClose() }} theme={theme} colors={colors} />
      </motion.div>
    </AnimatePresence>
  )
}

function EmojiGrid({
  onSelect,
  theme,
  colors,
}: {
  onSelect: (emoji: string) => void
  theme: MessageTheme
  colors: ReturnType<typeof getThemeColors>
}) {
  const [activeCategory, setActiveCategory] = useState('Frequent')

  return (
    <>
      <div className="flex gap-1 mb-1.5 overflow-x-auto scrollbar-none">
        {Object.keys(EMOJI_CATEGORIES).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'px-2 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors',
              activeCategory === cat
                ? colors.filterActive
                : 'bg-muted/50 text-muted-foreground hover:text-foreground'
            )}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="max-h-[140px] overflow-y-auto scrollbar-thin">
        <div className="flex flex-wrap gap-0.5">
          {(EMOJI_CATEGORIES[activeCategory] || []).map(emoji => (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              className="size-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-[14px]"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

export function MessageBubble({
  message,
  userId,
  theme,
  isEditing,
  editContent,
  onEditStart,
  onEditCancel,
  onEditSubmit,
  onEditContentChange,
  onEditKeyDown,
  onDelete,
  onReaction,
  isSearchHighlight,
  participantRole,
}: {
  message: ChatMessage
  userId: string
  theme: MessageTheme
  isEditing: boolean
  editContent: string
  onEditStart: () => void
  onEditCancel: () => void
  onEditSubmit: () => void
  onEditContentChange: (val: string) => void
  onEditKeyDown: (e: React.KeyboardEvent, messageId: string) => void
  onDelete: () => void
  onReaction: (emoji: string) => void
  showEmojiPicker?: boolean
  onToggleEmojiPicker?: () => void
  isSearchHighlight: boolean
  participantRole?: string
}) {
  const colors = getThemeColors(theme)
  const isOwn = message.isOwn
  const isDeleted = !!message.deletedAt
  const isEdited = !!message.editedAt && !isDeleted
  const [showLocalEmoji, setShowLocalEmoji] = useState(false)
  const bubbleRef = useRef<HTMLDivElement>(null)

  // Determine if user already has a reaction on this message
  const userExistingReaction = message.reactions
    ? Object.entries(message.reactions).find(([, userIds]) => userIds?.includes(userId))?.[0]
    : null

  if (isDeleted) {
    return (
      <div className={cn('flex mb-1', isOwn ? 'justify-end' : 'justify-start')}>
        <div className="max-w-[80%] md:max-w-[65%]">
          <div className="rounded-2xl px-3.5 py-2 text-[14px] italic text-muted-foreground/40 bg-muted/30">
            This message was deleted
          </div>
        </div>
      </div>
    )
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className={cn('flex mb-0.5', isOwn ? 'justify-end' : 'justify-start')}
        >
          <div className="max-w-[80%] md:max-w-[65%]">
            {/* Sender name */}
            {!isOwn && (
              <p className={cn('text-[11px] font-medium mb-0.5 ml-1', colors.senderName)}>
                {message.senderName}
              </p>
            )}

            {/* Bubble */}
            {isEditing ? (
              <div className={cn('rounded-2xl px-3.5 py-2 bg-muted/70 border', colors.editBorder)}>
                <Textarea
                  ref={(el) => { if (el) el.focus() }}
                  value={editContent}
                  onChange={(e) => onEditContentChange(e.target.value)}
                  onKeyDown={(e) => onEditKeyDown(e, message.id)}
                  className="min-h-[40px] max-h-[100px] bg-transparent border-0 text-[14px] p-0 resize-none focus-visible:ring-0"
                  rows={1}
                />
                <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-border/40">
                  <Button size="sm" variant="ghost" className="h-6 text-[11px] rounded-md" onClick={onEditCancel}>Cancel</Button>
                  <Button size="sm" className={cn('h-6 text-[11px] rounded-md', colors.editSaveBtn)} onClick={onEditSubmit} disabled={!editContent.trim()}>
                    Save
                  </Button>
                  <span className="text-[10px] text-muted-foreground/40 ml-auto">Esc to cancel · Enter to save</span>
                </div>
              </div>
            ) : (
              <div ref={bubbleRef} className="relative">
                <div className={cn(
                  'rounded-2xl px-3.5 pt-2 pb-1.5 text-[14px] leading-relaxed min-w-[120px]',
                  isOwn
                    ? cn(colors.ownBubble, 'rounded-br-md')
                    : 'bg-muted/70 text-foreground rounded-bl-md',
                  isSearchHighlight && 'ring-2 ring-amber-400/60'
                )}>
                  <span className="whitespace-pre-wrap break-words">{message.content}</span>
                  <div className={cn(
                    'float-right flex items-center gap-1 mt-2 ml-3',
                    isOwn ? 'text-white/70' : 'text-muted-foreground/60'
                  )}>
                    {isEdited && <span className="text-[10px]">(edited)</span>}
                    <span className="text-[10px]">{message.timestamp}</span>
                    {isOwn && (
                      message.read
                        ? <CheckCheck className={cn('size-3', colors.checkColor)} />
                        : <Check className="size-3 opacity-70" />
                    )}
                  </div>
                  <div className="clear-both" />
                </div>

              </div>
            )}

            {/* Reactions and Action Buttons */}
            {!isEditing && (
              <div className="flex items-center justify-between gap-4 mt-1 px-1">
                {/* Left: Reactions (Emoji Counter) */}
                <div className="flex flex-wrap gap-1">
                  {message.reactions && Object.keys(message.reactions).length > 0 && (
                    Object.entries(message.reactions).map(([emoji, userIds]) => {
                      if (!userIds || userIds.length === 0) return null
                      const isMyReaction = userIds.includes(userId)
                      return (
                        <button
                          key={emoji}
                          onClick={() => onReaction(emoji)}
                          className={cn(
                            'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[12px] transition-all hover:scale-105',
                            isMyReaction ? colors.reactionOwn : 'bg-muted/60'
                          )}
                        >
                          <span>{emoji}</span>
                          {userIds.length > 1 && <span className="text-[10px] text-muted-foreground">{userIds.length}</span>}
                        </button>
                      )
                    })
                  )}
                </div>

                {/* Right: Action Buttons (Like, Emoji Pack) */}
                <div className="flex items-center gap-0.5 shrink-0 ml-auto">
                  <button
                    onClick={() => onReaction('👍')}
                    className={cn(
                      'size-6 flex items-center justify-center rounded-full transition-all text-[12px]',
                      userExistingReaction === '👍'
                        ? cn(colors.reactionOwn, 'scale-110')
                        : 'text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50'
                    )}
                  >
                    <ThumbsUp className="size-3.5" />
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowLocalEmoji(!showLocalEmoji)}
                      className={cn(
                        'size-6 flex items-center justify-center rounded-full transition-all',
                        showLocalEmoji
                          ? 'text-muted-foreground bg-muted/50'
                          : 'text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50'
                      )}
                    >
                      <Smile className="size-3.5" />
                    </button>

                    <AnimatePresence>
                      {showLocalEmoji && (
                        <MiniEmojiPicker
                          onSelect={(emoji) => { onReaction(emoji); setShowLocalEmoji(false) }}
                          onClose={() => setShowLocalEmoji(false)}
                          theme={theme}
                          position="right"
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </ContextMenuTrigger>
      <ContextMenuContent className="rounded-xl">
        <ContextMenuItem className="gap-2 text-[13px]" onClick={() => setShowLocalEmoji(true)}>
          <Smile className="size-4" />
          React
        </ContextMenuItem>
        <ContextMenuItem className="gap-2 text-[13px]" onClick={() => { navigator.clipboard.writeText(message.content); toast.success('Copied to clipboard') }}>
          <Copy className="size-4" />
          Copy text
        </ContextMenuItem>
        <ContextMenuItem className="gap-2 text-[13px]" onClick={() => { toast.success('Message link copied') }}>
          <Reply className="size-4" />
          Reply
        </ContextMenuItem>
        {isOwn && !isEditing && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem className="gap-2 text-[13px]" onClick={onEditStart}>
              <Edit3 className="size-4" />
              Edit message
            </ContextMenuItem>
            <ContextMenuItem className="gap-2 text-[13px] text-red-600 dark:text-red-400" onClick={onDelete}>
              <Trash2 className="size-4" />
              Delete message
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
