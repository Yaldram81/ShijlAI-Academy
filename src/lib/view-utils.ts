import type { View, UserRole } from '@/lib/types'

/**
 * Resolve the actual view key, handling role-based overrides.
 * This ensures that different `currentView` values that should map
 * to the same component are treated consistently.
 */
export function resolveViewKey(view: View, userRole?: UserRole): string {
  if (view === 'dashboard' && userRole === 'instructor') return 'instructor-dashboard'
  if (view === 'dashboard' && userRole === 'admin') return 'admin'
  if (view === 'settings' && userRole !== 'instructor') return 'student-settings'
  return view
}
