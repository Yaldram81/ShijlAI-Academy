# Task: AI Study Planner UI Implementation

## Summary
Replaced the basic "Study Plans" tab content in the Recommendations View with a comprehensive AI Study Planner UI, and created the backend API to support it.

## Changes Made

### 1. Backend API - `/src/app/api/ai/study-planner/route.ts`
Created a new API route with four endpoints:
- **GET**: Fetches study plans with tasks for a user (uses separate queries to avoid Prisma include issues)
- **POST**: Creates a new study plan with intelligent task generation (deterministic fallback + optional AI enhancement)
- **PATCH**: Updates task status or plan status (e.g., mark task complete, abandon plan)
- **DELETE**: Deletes a plan and its tasks

### 2. Frontend - `/src/components/views/recommendations-view.tsx`

#### New Imports Added
- `Trash2`, `Award`, `Coffee`, `ChevronRight` from lucide-react
- `Input`, `Slider`, `Label` from shadcn/ui

#### New Types Added
- `StudyPlanTaskItem`: Task data structure
- `StudyPlanWithTasks`: Plan with embedded tasks

#### New State Variables
- `studyPlans`, `studyPlansLoading`, `selectedPlanId`, `generatingPlan`, `showCreateForm`
- `planForm` (examDate, courseId, courseName, dailyHours, targetGrade, currentGrade, weakTopics, strongTopics)
- `newTopicInput` (for adding topic tags)
- `expandedDays` (for timeline day expansion)

#### New Functions/Hooks
- `loadStudyPlans()`: Fetches plans from the API
- `useEffect` for loading plans when tab is active
- `useEffect` for initializing form topics from profile

#### Study Plans Tab UI (Two States)

**State 1 - No Plans**: Beautiful "Create Your Study Plan" form with:
- Exam date input (required)
- Course selection from enrolled courses
- Daily study hours slider (1-8)
- Target/current grade inputs
- Weak/strong topics with editable tags
- "Generate AI Study Plan" button with loading state

**State 2 - Plans Exist**: 
- Plan list with cards showing course name, countdown, progress bar, status badge
- Click to expand into detailed plan dashboard:
  - Plan header bar (countdown, daily hours, grades, progress %)
  - Today's tasks with checkboxes and color-coded type icons
  - Daily schedule timeline with expandable day rows
  - Weekly goals section
  - Milestones section with visual progress
  - "Create Another Plan" button

#### Task Type Visual Config
- study=emerald, quiz=violet, revision=amber, practice=cyan, mock_exam=rose, ai_discussion=blue, break=slate

## API Endpoints Tested
- GET /api/ai/study-planner?userId=xxx → Returns plans with tasks ✅
- POST /api/ai/study-planner → Creates plan with 59 tasks ✅
- PATCH /api/ai/study-planner → Updates task status and plan progress ✅
- DELETE /api/ai/study-planner → Deletes plan and tasks ✅

## Notes
- Used separate Prisma queries (plans + tasks) instead of `include: { tasks }` to avoid Prisma client cache issues
- AI plan generation uses deterministic fallback (no AI SDK to avoid server crashes)
- The existing `/api/ai/shijlai/study-plan` route was not modified
- All other tabs (recommendations, learning-path, topic-mastery) and Ask ShijlAI sidepanel remain untouched
