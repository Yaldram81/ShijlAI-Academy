import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/instructor/refund - Process a refund for an enrollment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, courseId, instructorId } = body

    if (!studentId || !courseId || !instructorId) {
      return NextResponse.json({ error: 'Student ID, Course ID, and Instructor ID are required' }, { status: 400 })
    }

    // Find the enrollment and verify course ownership
    const enrollment = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: studentId, courseId } },
      include: { course: { select: { price: true, title: true, instructorId: true } } },
    })

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
    }

    // Verify the course belongs to the requesting instructor
    if (enrollment.course.instructorId !== instructorId) {
      return NextResponse.json({ error: 'You do not have permission to refund this enrollment' }, { status: 403 })
    }

    // Check if refund transaction already exists
    const existingRefund = await db.transaction.findFirst({
      where: {
        studentId,
        courseId,
        type: 'refund',
      },
    })

    if (existingRefund) {
      return NextResponse.json({ error: 'Refund already processed for this enrollment' }, { status: 409 })
    }

    // Use a transaction to ensure atomicity
    const result = await db.$transaction(async (tx) => {
      // Create refund transaction
      const refundAmount = enrollment.course.price * 0.8 // 80% refund (20% platform fee)
      const transaction = await tx.transaction.create({
        data: {
          type: 'refund',
          amount: -refundAmount,
          currency: 'USD',
          status: 'completed',
          description: `Refund for enrollment in "${enrollment.course.title}"`,
          courseId,
          studentId,
          instructorId,
          metadata: JSON.stringify({ enrollmentId: enrollment.id, originalPrice: enrollment.course.price, refundRate: 0.8 }),
        },
      })

      // Delete lesson progress and enrollment (revoke access)
      await tx.lessonProgress.deleteMany({
        where: { enrollmentId: enrollment.id },
      })
      await tx.enrollment.delete({
        where: { id: enrollment.id },
      })

      return transaction
    })

    return NextResponse.json({ transaction: result, success: true })
  } catch (error) {
    console.error('Error processing refund:', error)
    return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 })
  }
}
