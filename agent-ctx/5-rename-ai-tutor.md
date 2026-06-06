# Task 5: Rename "AI Tutor" → "Ask ShijlAI"

## Summary
Updated all navigation references from "AI Tutor" to "Ask ShijlAI" across the entire application.

## Files Modified
- `src/components/student-shell.tsx` — sidebar + bottom bar labels, icon Bot→Sparkles
- `src/components/sidebar.tsx` — label, icon Bot→Sparkles
- `src/components/views/student-dashboard.tsx` — quick link label
- `src/components/views/student-assignments-view.tsx` — 2 dropdown items
- `src/components/views/student-assignment-detail-view.tsx` — 7 references
- `src/components/views/student-settings-view.tsx` — section header
- `src/components/views/course-detail-view.tsx` — button + comment
- `src/components/views/course-player-view.tsx` — tab label + 5 other references
- `src/components/views/tutor-view.tsx` — 6 references
- `src/components/views/landing-view.tsx` — 5 references
- `src/components/views/about-view.tsx` — 5 references
- `src/components/views/pricing-view.tsx` — 4 references
- `src/components/views/settings-view.tsx` — 2 references
- `src/components/views/ask-shijlai-view.tsx` — description + system prompt
- `src/components/admin/admin-dashboard-v2.tsx` — pulse label
- `src/components/admin/admin-dev-tools.tsx` — 2 references
- `src/components/admin/admin-ai-config.tsx` — 9 references
- `src/app/api/admin/feature-flags/route.ts` — displayName
- `src/app/api/admin/dev-tools/route.ts` — description
- `src/app/api/dashboard/route.ts` — feature flag name
- `src/app/api/ai/chat/route.ts` — system prompt
- `src/app/api/ai/tutor/route.ts` — system prompt + comments
- `src/app/api/ai/shijlai/chat/route.ts` — system prompt
- `src/app/api/admin/ai-config/seed/route.ts` — description + system prompt
- `src/app/api/student/settings/route.ts` — comment
- `src/app/layout.tsx` — keyword

## Key Decisions
- View keys (`tutor`, `ai-tutor`) and route paths left unchanged
- Icon changed from Bot to Sparkles in nav items
- Backend system prompts updated so AI identifies as "Ask ShijlAI"
- Lint passes clean
