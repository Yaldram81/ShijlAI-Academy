# Task: Enhance Instructor Course Detail View

## Summary of Changes

### Task 1: GET Endpoint for Single Instructor Course
**File**: `/home/z/my-project/src/app/api/instructor/courses/[id]/route.ts`

Added a `GET` handler that:
- Accepts `instructorId` as query param (required)
- Fetches course by ID with full data: modules (with lessons ordered), enrollments (with user info, last 20), quizzes, reviews (last 10)
- Verifies ownership (course.instructorId === instructorId)
- Computes analytics: totalEnrollments, recentEnrollments, avgProgress, completionRate, totalLessons, totalDuration, totalRevenue (from transactions)
- Builds enrollment trend data (last 30 days, grouped by date)
- Builds rating breakdown (1-5 stars)
- Returns rich course data with: course info, modules with lessons, recent enrollments, analytics, quizzes, recent reviews

### Task 2: Rewritten Instructor Course Detail View
**File**: `/home/z/my-project/src/components/views/instructor-course-detail-view.tsx`

Complete rewrite with comprehensive, feature-rich design including:
- **Header Section**: Course thumbnail (or gradient placeholder) with overlay info, title, badges (status, level, category, language), star rating, action buttons (Edit, Submit for Review, Copy Link, Preview, Archive/Unarchive), created/updated dates, description
- **Stats Cards Row**: 6 cards - Total Students, Avg Progress (with progress bar), Completion Rate (with progress bar), Revenue, Rating (with star display), Total Duration
- **Tabbed Content Section**: 5 tabs:
  1. **Curriculum** - Modules list with collapsible lessons (lesson title, type icon, duration, published/free badges). Quiz section below modules.
  2. **Students** - Table of enrolled students with avatar, progress bar, enrolled date, status badges. Searchable. Top students highlight.
  3. **Analytics** - Enrollment trend AreaChart (recharts), completion funnel, rating breakdown, quick summary stats
  4. **Reviews** - List of student reviews with rating stars, content, student name/avatar, date. Average rating display.
  5. **Settings** - Price, language, level, completion threshold, certificate toggle, archive/delete actions (danger zone)
- **Right Sidebar** (desktop only): Quick Actions card, Course Status card (publish/review/archive status with timeline), Recent Activity (last 5 enrollments)
- **Data Fetching**: From new GET endpoint with proper loading skeleton and error state with retry button
- **Navigation**: Breadcrumb with back button, tracks source view (dashboard vs courses)

### Task 3: Course Navigation from Courses Page
**File**: `/home/z/my-project/src/components/views/instructor-courses-view.tsx`

Made all course views clickable to navigate to detail view:
- Added `setSelectedCourseId` import from `useAppStore`
- Added `handleNavigateToDetail` helper function
- **Grid View**: Added `cursor-pointer` class and `onClick={() => handleNavigateToDetail(course)}`. Added `e.stopPropagation()` to checkbox, quick action buttons, and more dropdown
- **List View**: Added `cursor-pointer` class and `onClick={() => handleNavigateToDetail(course)}`. Added `e.stopPropagation()` to checkbox, action buttons container, and more dropdown
- **Kanban View**: Changed `onClick` from `toggleSelect` to `handleNavigateToDetail`. Added `e.stopPropagation()` wrapper around more dropdown

All existing buttons inside cards/rows now use `e.stopPropagation()` so they don't trigger navigation.

## Lint Result
✅ All lint checks passed with no errors.
