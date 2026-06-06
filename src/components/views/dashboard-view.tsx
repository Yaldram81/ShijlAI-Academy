'use client'

import { useAppStore } from '@/lib/store'
import { StudentDashboard } from '@/components/views/student-dashboard'
import { InstructorDashboard } from '@/components/views/instructor-dashboard'
import { AdminDashboardV2 } from '@/components/admin/admin-dashboard-v2'

// Note: Instructor and admin dashboards are now loaded directly via resolveViewKey overrides.
// This wrapper serves as a fallback and for student dashboards.
export function DashboardView() {
  const { currentUser } = useAppStore()
  const role = currentUser?.role || 'student'

  if (role === 'instructor') return <InstructorDashboard />
  if (role === 'admin') return <AdminDashboardV2 />
  return <StudentDashboard />
}
