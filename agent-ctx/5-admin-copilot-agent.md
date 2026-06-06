# Task 5 — Admin Copilot View Component

## Task
Create the AI Admin Copilot view component at `/src/components/views/admin-copilot-view.tsx`

## Work Log

- Read worklog.md to understand prior work (Tasks 1-7 covering Skill Graph, Learning Path, AI Companion, Mock Interview, System Intelligence, etc.)
- Read store.ts, types.ts, ai-message-renderer.tsx, learning-companion-view.tsx, admin-system-intelligence-view.tsx to understand existing patterns
- Created `/src/components/views/admin-copilot-view.tsx` (~520 lines) with comprehensive AdminCopilotView component
- Implemented full chat interface with right sidebar panel layout (70/30 split)
- Component sections:
  1. **Header** — "AI Admin Copilot" with Sparkles icon, subtitle, New Chat button, Refresh button
  2. **Welcome Screen** — greeting with admin name, 2x4 grid of 8 suggested question cards
  3. **Chat Messages** — user messages (blue-500/10 bg, right-aligned), AI messages (muted/30 bg, left-aligned)
  4. **AI Avatar** — blue gradient circle with Bot icon
  5. **Intent Badge** — on each AI message, color-coded per intent type (9 intent types mapped)
  6. **Recommendations** — clickable follow-up action buttons below AI messages
  7. **Typing Indicator** — "Copilot is analyzing platform data..." with animated dots and spinner
  8. **Chat Input** — textarea with ArrowUp send button, 5 quick action chips (Courses, Students, Instructors, Risks, Report)
  9. **Right Sidebar** (~30%, hidden on mobile via md: breakpoint):
     - Suggested Questions (8 clickable buttons)
     - Recent Insights (last 3 query results, clickable to re-ask)
     - Critical Alerts (auto-detected, severity-colored warning cards)
     - Copilot Intelligence footer
  10. **Mobile Suggestions** — horizontal scrollable chips above input when no messages (mobile only)
- State management: messages, inputValue, isLoading, suggestedQuestions, criticalAlerts, recentQueries
- API integration:
  - POST /api/admin/copilot — sends { adminId, query }, receives { message, sessionId, intent, recommendations }
  - GET /api/admin/copilot?adminId=xxx — loads sidebar data { suggestedQuestions, criticalAlerts, recentQueries }
- Uses MarkdownRenderer from @/components/ai/ai-message-renderer for AI message rendering
- Framer Motion animations: message fade-in from bottom, spring transitions
- Auto-scroll to bottom on new messages
- Error handling with toast notifications (sonner)
- Responsive: sidebar collapses on mobile, mobile suggestion chips shown
- ScrollArea for sidebar overflow, custom scrollbar styling for chat area
- Lint passes clean (0 errors)

## Stage Summary
- Component exported as `AdminCopilotView` with 'use client' directive
- Blue/indigo admin theme matching existing admin portal
- Professional admin-focused chat feel (not chatty like student AI)
- All specified state, API calls, intent badges, and design requirements implemented
- Lint: passes clean, dev server running with no errors
