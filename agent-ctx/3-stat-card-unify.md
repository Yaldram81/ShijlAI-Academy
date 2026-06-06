# Task 3: Unify StudentStatCard — Remove variant prop, replace inline stat cards

## Summary
Updated all student page views to use the redesigned StudentStatCard component (unified design, no variant prop). Removed all `variant="profile"` usages and replaced inline stat card implementations with StudentStatCard + StudentStatCardGrid.

## Files Modified
1. **student-profile-view.tsx** — Removed `variant="profile"` (4 cards), replaced inline quick stats row (5 mini stats) with StudentStatCardGrid columns={5}
2. **student-assignments-view.tsx** — Removed DashboardStats function + MiniSparkline, added StudentStatCard import, replaced with StudentStatCardGrid columns={6}, moved computations to useMemo hooks
3. **student-schedule-view.tsx** — Replaced inline stats bar with StudentStatCardGrid columns={5}, added StudentStatCard import

## Files Skipped (no stat cards)
- student-qa-view.tsx, student-assignment-detail-view.tsx, student-messages-view.tsx, student-settings-view.tsx

## No Changes Needed
- student-dashboard.tsx — Already uses StudentStatCard without variant

## Lint: PASS (0 errors)
