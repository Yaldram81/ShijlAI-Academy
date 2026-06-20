import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail, enrollmentConfirmationEmail } from '@/lib/email'

// GET /api/enrollments - Get enrollments for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }
    const enrollments = await db.enrollment.findMany({
      where: { userId },
      include: { course: { select: { id: true, title: true, thumbnail: true, level: true } } },
      orderBy: { enrolledAt: 'desc' },
    })
    return NextResponse.json({ enrollments })
  } catch (error) {
    console.error('[ENROLLMENTS_GET]', error)
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 })
  }
}

// POST /api/enrollments - Enroll a student in a course
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, courseId } = body

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: 'userId and courseId are required' },
        { status: 400 }
      )
    }

    // Check if already enrolled
    const existing = await db.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    })

    if (existing) {
      // If archived, restore it
      if (existing.status === 'archived') {
        const restored = await db.enrollment.update({
          where: { id: existing.id },
          data: { status: 'active', lastAccessed: new Date() },
        })
        return NextResponse.json({ enrollment: restored, message: 'Course restored' })
      }
      return NextResponse.json({ enrollment: existing, message: 'Already enrolled' })
    }

    // Create enrollment
    const enrollment = await db.enrollment.create({
      data: {
        userId,
        courseId,
        status: 'active',
        progress: 0,
        lastAccessed: new Date(),
      },
    })

    // Update course enrollment count
    await db.course.update({
      where: { id: courseId },
      data: { enrollmentCount: { increment: 1 } },
    })

    // Remove from wishlist if present
    await db.wishlist.deleteMany({
      where: { userId, courseId },
    }).catch(() => {
      // Ignore if not in wishlist
    })

    // Send enrollment confirmation email (fire-and-forget)
    try {
      const [enrolledUser, enrolledCourse] = await Promise.all([
        db.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
        db.course.findUnique({
          where: { id: courseId },
          select: {
            title: true,
            category: true,
            instructor: { select: { name: true } },
          },
        }),
      ])
      if (enrolledUser && enrolledCourse) {
        sendEmail(enrollmentConfirmationEmail({
          fullName: enrolledUser.name,
          email: enrolledUser.email,
          courseTitle: enrolledCourse.title,
          courseCategory: enrolledCourse.category,
          instructorName: enrolledCourse.instructor?.name || 'ShijlAI Academy',
        })).catch((err) => {
          console.error('[enrollments] Failed to send confirmation email:', err instanceof Error ? err.message : 'Unknown')
        })
      }
    } catch {
      // Don't let email failure block enrollment response
    }

    return NextResponse.json({ enrollment }, { status: 201 })
  } catch (error) {
    console.error('Error enrolling:', error)
    return NextResponse.json(
      { error: 'Failed to enroll' },
      { status: 500 }
    )
  }
}
