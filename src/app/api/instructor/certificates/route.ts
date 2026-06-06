import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/instructor/certificates - Issue a certificate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, courseId, instructorId } = body

    if (!studentId || !courseId || !instructorId) {
      return NextResponse.json({ error: 'Student ID, Course ID, and Instructor ID are required' }, { status: 400 })
    }

    // Check if certificate already exists
    const existing = await db.certificate.findFirst({
      where: { userId: studentId, courseId },
    })

    if (existing) {
      return NextResponse.json({ error: 'Certificate already issued for this student and course', certificate: existing }, { status: 409 })
    }

    // Get student and course info
    const student = await db.user.findUnique({
      where: { id: studentId },
      select: { name: true },
    })

    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { title: true, instructorId: true },
    })

    if (!student || !course) {
      return NextResponse.json({ error: 'Student or course not found' }, { status: 404 })
    }

    // Verify the course belongs to the requesting instructor
    if (course.instructorId !== instructorId) {
      return NextResponse.json({ error: 'You do not have permission to issue certificates for this course' }, { status: 403 })
    }

    // Get enrollment progress for score
    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: studentId, courseId } },
      select: { progress: true },
    })

    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    const certificate = await db.certificate.create({
      data: {
        userId: studentId,
        courseId,
        courseTitle: course.title,
        userName: student.name,
        score: enrollment?.progress ?? 0,
        certificateId,
      },
    })

    return NextResponse.json({ certificate, success: true })
  } catch (error) {
    console.error('Error issuing certificate:', error)
    return NextResponse.json({ error: 'Failed to issue certificate' }, { status: 500 })
  }
}
