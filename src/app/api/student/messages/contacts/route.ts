import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/student/messages/contacts - Get contacts the student can message
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    const contacts: Array<{
      id: string
      name: string
      avatar: string | null
      role: string
      courseName: string
      courseId: string
      online: boolean
    }> = []

    // Get instructors from student's enrolled courses
    const enrollments = await db.enrollment.findMany({
      where: {
        userId: studentId,
        status: { in: ['active', 'completed'] },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true,
            instructor: {
              select: {
                id: true,
                name: true,
                avatar: true,
                role: true,
                lastActiveAt: true,
              },
            },
          },
        },
      },
    })

    // Track unique instructor IDs to avoid duplicates
    const seenInstructorIds = new Set<string>()
    const fiveMinAgo = new Date()
    fiveMinAgo.setMinutes(fiveMinAgo.getMinutes() - 5)

    for (const enrollment of enrollments) {
      const instructor = enrollment.course.instructor
      if (instructor && !seenInstructorIds.has(instructor.id)) {
        seenInstructorIds.add(instructor.id)
        const online = new Date(instructor.lastActiveAt) > fiveMinAgo

        contacts.push({
          id: instructor.id,
          name: instructor.name,
          avatar: instructor.avatar,
          role: 'instructor',
          courseName: enrollment.course.title,
          courseId: enrollment.course.id,
          online,
        })
      }
    }

    // Get admin/support users
    const adminUsers = await db.user.findMany({
      where: {
        role: { in: ['admin'] },
        id: { not: studentId },
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        role: true,
        lastActiveAt: true,
      },
    })

    // Track seen IDs to avoid duplicates with instructors who are also admins
    for (const admin of adminUsers) {
      if (!seenInstructorIds.has(admin.id)) {
        const online = new Date(admin.lastActiveAt) > fiveMinAgo

        contacts.push({
          id: admin.id,
          name: admin.name,
          avatar: admin.avatar,
          role: 'admin',
          courseName: 'Platform Support',
          courseId: '',
          online,
        })
      }
    }

    // Sort: online first, then alphabetically
    contacts.sort((a, b) => {
      if (a.online !== b.online) return a.online ? -1 : 1
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({ contacts })
  } catch (error) {
    console.error('Error fetching student contacts:', error)
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}
