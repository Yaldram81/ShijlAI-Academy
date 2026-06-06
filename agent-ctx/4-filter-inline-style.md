# Task 4 - Filter Inline Style Refactor

## Summary
Refactored the search and filter sections in admin Users and Instructors pages to match the enterprise-level inline style used in the admin Courses page.

## Changes Made

### admin-user-management.tsx
- Replaced Popover-based hidden filter with inline visible Select dropdowns
- Added: Role filter, Status filter, Verification filter as inline Selects
- Added: RefreshCw button, Clear Filters button with tooltips
- Container: Changed from `div bg-muted/30` to `Card rounded-2xl ios-shadow-sm border-0 shadow-sm`
- All controls use `rounded-xl` and `h-9`
- Removed: Popover import, Filter icon import
- Added: RefreshCw import
- Search debounce: 500ms → 300ms
- Active filter chips row now inside Card with border-t separator

### admin-instructor-management.tsx
- Replaced Popover-based hidden filter with inline visible Select dropdowns
- Added: Status filter, Application Status filter, Has Courses filter as inline Selects
- Added: RefreshCw button, Clear Filters button with tooltips
- Container: Changed from `div bg-muted/30` to `Card rounded-2xl ios-shadow-sm border-0 shadow-sm`
- All controls use `rounded-xl` and `h-9`
- Removed: Popover import, Filter icon import
- Added: RefreshCw import
- Search debounce: 500ms → 300ms
- Active filter chips row now inside Card with border-t separator

## Preserved
- All filter state variables, API calls, debounced search logic
- Filter chips with individual remove functionality
- Clear all filters functionality
- Tab-based navigation (All/Flagged/Recent for Users, All/Applications/Flagged for Instructors)

## Verification
- Lint passes clean
- Dev server compiles successfully
- API calls work correctly
