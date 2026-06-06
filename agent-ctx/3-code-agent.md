# Task 3 - Code Agent: Fix student messages WhatsApp-like layout

## Summary
Fixed `student-messages-view.tsx` to implement WhatsApp-like fixed layout with proper emoji handling.

## Changes Made

### 1. WhatsApp-like Fixed Layout
- Main wrapper: `flex flex-col h-[calc(100vh-52px-48px)]` → `flex h-screen`
- Inner container: kept `flex flex-1 min-h-0 overflow-hidden`
- Left sidebar: added `shrink-0` to prevent flex shrinking
- Conversation list ScrollArea: `flex-1` → `flex-1 min-h-0`
- Right chat area: added `h-full` 
- Messages ScrollArea: `flex-1 px-4 md:px-6` → `flex-1 min-h-0 px-4 md:px-6`

### 2. Removed Global Emoji Picker State
- Removed `showEmojiPicker` and `emojiPickerMsgId` state variables
- Removed `showEmojiPicker` and `onToggleEmojiPicker` props from MessageBubble
- Added local `showInputEmojiPicker` state for the input area emoji button only

### 3. Fixed Reaction Handler (ONE emoji per person per message)
- Replaced toggle-same-emoji logic with: find existing reaction → remove it → add new one if different
- This ensures only ONE emoji per user per message at any time

### 4. Input Emoji Button
- Now uses `showInputEmojiPicker` local state
- EmojiPicker inserts emoji into text input field
- Auto-focuses input after emoji insertion

### 5. Verification
- ESLint: passes with no errors
- Dev log: no compile errors
