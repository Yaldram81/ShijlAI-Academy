# Task 4: Fix Instructor Messages View - WhatsApp-like Layout

## Summary
Fixed the instructor messages view (`/home/z/my-project/src/components/views/instructor-messages-view.tsx`) to implement a WhatsApp-like fixed viewport layout with proper flex behavior, and updated the MessageBubble component to make emoji picker props optional.

## Files Modified
1. `/home/z/my-project/src/components/views/instructor-messages-view.tsx` - Main instructor messages view
2. `/home/z/my-project/src/components/messaging/message-bubble.tsx` - Made `showEmojiPicker` and `onToggleEmojiPicker` props optional

## Key Changes

### Layout (WhatsApp-style fixed viewport)
- Main wrapper: `flex h-screen -m-4 md:-m-5 lg:-m-6` (was `flex flex-col h-[calc(100vh-52px-48px)]`)
- Inner container: removed duplicate `overflow-hidden`
- Left sidebar: added `shrink-0`
- Conversation list ScrollArea: added `min-h-0`
- Right chat area: added `h-full`
- Messages area: changed from `<div>` with `overflow-y-auto` to `<ScrollArea>` with `min-h-0`

### State Management
- Removed: `showEmojiPicker`, `emojiPickerMsgId` global states
- Added: `showInputEmojiPicker` local state for input emoji picker
- Reset `showInputEmojiPicker` on conversation switch and back navigation

### Reaction Handler (ONE emoji per person per message)
- Toggle same emoji off, replace different emoji, add new emoji if none exists
- Uses `instructorId` (not `studentId`)
- Removed `setShowEmojiPicker(false)` and `setEmojiPickerMsgId(null)` from handler

### MessageBubble Props
- Removed `showEmojiPicker` and `onToggleEmojiPicker` props from instructor view usage
- Made these props optional in MessageBubble component definition

### Emoji Picker
- Removed floating EmojiPicker for reactions (MessageBubble handles internally)
- Input area emoji picker now inserts emoji into text using `setMessageInput(prev => prev + emoji)`

### Mobile Optimization
- Sidebar hidden when chat is open (`mobileShowChat ? 'hidden md:flex' : 'flex'`)
- Chat area hidden when no chat selected (`!mobileShowChat ? 'hidden md:flex' : 'flex'`)
