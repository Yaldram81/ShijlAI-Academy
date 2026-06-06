# Task 2-b — AI Learning Path Tab Component

## Agent: UI Developer

## Task Summary
Build the AI-Powered Learning Path visualization component for the Learning Path tab in the AI Insights page.

## Files Created
- `/src/components/learning-path-tab.tsx` — Main component (~530 lines)

## Files Modified
- `/src/app/api/ai/learning-paths/route.ts` — Fixed TS error (nullable description)
- `/src/components/views/recommendations-view.tsx` — Replaced old learning-path tab content with LearningPathTab component

## Component Architecture

### LearningPathTab (main export)
Props: `{ userId: string; onAskShijlAI: (context: string) => void }`

Fetches from: `GET /api/ai/learning-paths?userId={userId}`

### Sub-components:
1. **AIInsightBanner** — Gradient banner with AI insight text and "Ask ShijlAI" button
2. **StatsRow** — 4 stat cards (Total, Completed, In Progress, Locked)
3. **PathGroup** — Collapsible group per learning path with progress bar
4. **PathNodeCard** — Timeline node with status icon, type/priority badges, mastery progress, XP/duration badges
5. **CareerPathCard** — Career card with skill roadmap, match %, progress bar
6. **KnowledgeGraphSection** — Prerequisite list derived from unlock requirements
7. **LearningPathSkeleton** — Loading skeleton

### Color Coding:
- completed → emerald
- in_progress → amber
- available → teal
- recommended → cyan (with ⭐)
- locked → slate/muted
- skipped → gray

## API Response Format
```typescript
interface LearningPathResponse {
  paths: LearningPathData[]       // Array of paths, each with nodes
  careerPaths: CareerRoadmap[]    // 4 career options
  aiInsight: string               // AI-generated insight
  stats: { totalNodes, completed, available, inProgress, locked, recommended }
  skillContextForAI: string        // Context for Ask ShijlAI
}
```

## Integration Point
In `recommendations-view.tsx`, the learning-path tab now renders:
```tsx
<LearningPathTab
  userId={userId}
  onAskShijlAI={(ctx) => sendChatMessage(ctx)}
/>
```

## Previous Agent Work (Task 2-a)
- Built the comprehensive API at `/api/ai/learning-paths`
- Extended Prisma schema with LearningPath, LearningPathNode, TopicPrerequisite models
- API returns demo data when DB is sparse
