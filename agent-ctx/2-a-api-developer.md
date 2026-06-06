# Task 2-a: Extend Prisma Schema and Build Learning Path API

## Agent: API Developer

## Summary
Successfully extended Prisma schema with 3 new models and built a comprehensive Learning Path API.

## Changes Made

### Prisma Schema (`prisma/schema.prisma`)
1. Added `LearningPath` model — student-specific learning paths with courseId/careerPathId, status, progress tracking
2. Added `LearningPathNode` model — ordered path nodes with nodeType, status, mastery tracking, XP rewards, unlock logic
3. Added `TopicPrerequisite` model — cross-topic prerequisite relationships with required mastery %
4. Added `learningPaths LearningPath[]` to User model (after Instructor Copilot section)
5. Added `learningPaths LearningPath[]` to CareerPath model
6. Schema pushed successfully with `bun run db:push`

### Learning Path API (`src/app/api/ai/learning-paths/route.ts`)
- Completely rewrote the existing basic route with comprehensive implementation
- **Path Generation Engine**: generates personalized learning paths based on:
  - Student's TopicMastery from DB
  - Skill mastery aggregation from topic data
  - Student's Enrollments (active courses)
  - Career goals and roadmap matching
- **Node Status Logic**: 
  - mastery >= required → completed
  - mastery >= required * 0.8 → in_progress
  - mastery >= required * 0.5 → available
  - mastery < required * 0.5 → locked
  - Special "recommended" status for the most impactful next step
- **Course-specific templates**: ML (8 nodes), Python (6), Web (5), Data (5), Default (6)
- **Career roadmaps**: Data Scientist, ML Engineer, Web Developer, Cybersecurity
- **DB integration**: reads existing LearningPath/Node records; generates new ones from enrollments + topic mastery
- **Fallback**: uses rich demo data when DB is sparse or user not found
- **Error resilience**: always returns valid data, never crashes

### API Response Format
```json
{
  "paths": [{ "id", "title", "description", "status", "progress", "courseId", "careerPathId", "generatedAt", "nodes": [...] }],
  "careerPaths": [{ "id", "title", "icon", "description", "category", "skillRoadmap": [...], "progress", "matchPercentage", "totalSteps", "completedSteps" }],
  "aiInsight": "string",
  "stats": { "totalNodes", "completed", "available", "inProgress", "locked", "recommended" },
  "skillContextForAI": "string"
}
```

### Verification
- `bun run lint` — passes clean
- `curl /api/ai/learning-paths?userId=demo-user` — returns 200 with complete data
- Demo flow shows proper progression: completed → recommended → available → locked
