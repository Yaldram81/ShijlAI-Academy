import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/messages/contacts - Get contacts the instructor can message
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
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

    // Get students enrolled in the instructor's courses
    const courses = await db.course.findMany({
      where: {
        instructorId,
        isPublished: true,
      },
      include: {
        enrollments: {
          where: {
            status: { in: ['active', 'completed'] },
          },
          include: {
            user: {
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

    // Track unique student IDs to avoid duplicates (student may be in multiple courses)
    const seenStudentIds = new Set<string>()
    const fiveMinAgo = new Date()
    fiveMinAgo.setMinutes(fiveMinAgo.getMinutes() - 5)

    for (const course of courses) {
      for (const enrollment of course.enrollments) {
        const student = enrollment.user
        if (!seenStudentIds.has(student.id)) {
          seenStudentIds.add(student.id)
          const online = new Date(student.lastActiveAt) > fiveMinAgo

          contacts.push({
            id: student.id,
            name: student.name,
            avatar: student.avatar,
            role: student.role,
            courseName: course.title,
            courseId: course.id,
            online,
          })
        }
      }
    }

    // Sort: online first, then alphabetically
    contacts.sort((a, b) => {
      if (a.online !== b.online) return a.online ? -1 : 1
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({ contacts })
  } catch (error) {
    console.error('Error fetching instructor contacts:', error)
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}
