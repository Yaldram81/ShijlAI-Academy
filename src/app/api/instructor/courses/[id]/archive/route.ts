import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/instructor/courses/[id]/archive - Toggle archive status
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')

    const course = await db.course.findUnique({ where: { id } })
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Verify ownership
    if (!instructorId || course.instructorId !== instructorId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const updatedCourse = await db.course.update({
      where: { id },
      data: { isArchived: !course.isArchived },
    })

    return NextResponse.json({
      course: updatedCourse,
      message: updatedCourse.isArchived
        ? 'Course archived successfully'
        : 'Course unarchived successfully',
      isArchived: updatedCourse.isArchived,
    })
  } catch (error) {
    console.error('Error toggling archive status:', error)
    return NextResponse.json({ error: 'Failed to toggle archive status' }, { status: 500 })
  }
}
