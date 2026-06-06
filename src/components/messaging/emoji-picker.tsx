'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { QUICK_EMOJIS, EMOJI_CATEGORIES } from './constants'
import type { MessageTheme } from './types'
import { getThemeColors } from './helpers'

export function EmojiPicker({
  onSelect,
  onClose,
  theme = 'student',
}: {
  onSelect: (emoji: string) => void
  onClose: () => void
  theme?: MessageTheme
}) {
  const [activeCategory, setActiveCategory] = useState('Frequent')
  const colors = getThemeColors(theme)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-[100px] right-4 md:right-6 z-50 bg-popover border border-border/60 rounded-xl shadow-lg p-3 w-[300px]"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-semibold text-foreground">Reactions</span>
        <Button variant="ghost" size="icon" className="size-6" onClick={onClose}>
          <X className="size-3" />
        </Button>
      </div>

      {/* Quick reactions */}
      <div className="flex flex-wrap gap-1 mb-3 p-2 bg-muted/30 rounded-lg">
        {QUICK_EMOJIS.map(emoji => (
          <button
            key={emoji}
            onClick={() => { onSelect(emoji); onClose() }}
            className="size-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-[18px]"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 mb-2 overflow-x-auto scrollbar-none">
        {Object.keys(EMOJI_CATEGORIES).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              'px-2 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors',
              activeCategory === cat
                ? colors.filterActive
                : 'bg-muted/50 text-muted-foreground hover:text-foreground'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <ScrollArea className="h-[180px]">
        <div className="flex flex-wrap gap-0.5">
          {(EMOJI_CATEGORIES[activeCategory] || []).map(emoji => (
            <button
              key={emoji}
              onClick={() => { onSelect(emoji); onClose() }}
              className="size-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-[16px]"
            >
              {emoji}
            </button>
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  )
}
