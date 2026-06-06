# Task: AI System Intelligence Dashboard - Frontend View Component

## Task ID: admin-system-intelligence-view

## Summary

Built the comprehensive `AdminSystemIntelligenceView` component at `/home/z/my-project/src/components/views/admin-system-intelligence-view.tsx`. This is a complete rewrite of the existing basic component into a production-quality, visually stunning dashboard.

## What Was Done

### 1. Component Architecture
- Complete rewrite of `admin-system-intelligence-view.tsx` (~700 lines)
- Defined full TypeScript interfaces matching the API response shape
- Created reusable sub-components: `TrendIndicator`, `HealthScoreRing`, `StatusBadge`, `SeverityBadge`, `InsightTypeIcon`, `InsightTypeBorder`, `EntityIcon`, `DashboardSkeleton`
- Proper state management for: data loading, error handling, AI insights generation, course sorting, expandable course details

### 2. Five Dashboard Sections Implemented

**Section 1: Header + Platform Overview**
- Page title "AI System Intelligence" with Cpu icon in gradient container
- Subtitle "Operational reasoning about platform health"
- 4 KPI cards with gradient backgrounds (orange/amber theme)
- Each card shows value + trend indicator (arrow + % change)
- Responsive grid: 1 col mobile, 2 col tablet, 4 col desktop

**Section 2: AI Insights (Hero Section)**
- Prominent card with gradient background for LLM-generated insights
- "Generate AI Analysis" button with gradient styling
- Loading state with spinner while generating
- Rule-based insights as bordered cards with type-based color coding
- Actionable insights shown with lightning bolt icon in orange callout

**Section 3: Alerts**
- Three columns: Critical, Warning, Info
- Each column has count badge on header
- Critical alerts pulse/glow red subtly (custom CSS animation added)
- Each alert shows severity badge, title, description, entity type, timestamp
- Custom scrollbar styling on scrollable areas

**Section 4: Course Intelligence**
- Sortable by: Health Score, Completion, Rating, Growth (toggle asc/desc)
- Each course shows: health score ring (SVG circular progress), status badge, metrics grid
- Expandable detail row with engagement breakdown, assessment score, progress bars
- Color-coded health scores (green/amber/red)
- Staggered animation on load

**Section 5: Instructor Intelligence**
- Ranked list sorted by effectiveness score (descending)
- #1 instructor highlighted with gold gradient accent
- Each card shows: rank badge, name, course count, student count, effectiveness score
- Metrics with progress bars: completion, rating, success rate, engagement
- Warnings shown as amber alert badges
- Warning count badge on instructor name

### 3. CSS Additions
Added to `globals.css`:
- `@keyframes pulse-subtle` - subtle red glow pulse for critical alerts
- `@keyframes pulse-subtle-dark` - dark mode variant
- `.animate-pulse-subtle` class

### 4. Key Design Decisions
- Orange/amber accent color theme (NOT blue/indigo)
- Command center feel, not analytics report
- AI Insights as the hero section
- Urgent-feeling alerts with visual hierarchy
- Framer Motion animations throughout (fade-in, stagger, hover)
- Custom scrollbar styling on all scrollable areas
- Dark mode compatible using bg-background, text-foreground
- No emojis - all icons from lucide-react
- Empty state handling for all sections
- Error state with retry button
- Loading skeleton while data fetches

### 5. API Routes
Both API routes already existed and were fully functional:
- `GET /api/admin/system-intelligence` - returns platform health, engagement, course intelligence, instructor intelligence, alerts, insights
- `POST /api/admin/system-intelligence/generate-insights` - accepts the data and returns LLM-generated analysis

## Files Modified
- `/home/z/my-project/src/components/views/admin-system-intelligence-view.tsx` - Complete rewrite
- `/home/z/my-project/src/app/globals.css` - Added critical alert pulse animation

## Files Already Existing (No Changes Needed)
- `/home/z/my-project/src/app/api/admin/system-intelligence/route.ts`
- `/home/z/my-project/src/app/api/admin/system-intelligence/generate-insights/route.ts`
- `/home/z/my-project/src/app/page.tsx` - already had the view registered
- `/home/z/my-project/src/components/admin-shell.tsx` - already had the sidebar link

## Verification
- ESLint passed with no errors
- API endpoint returns 200
- Main page returns 200
- Dev server running properly
