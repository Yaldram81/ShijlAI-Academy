import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/instructor/courses/bulk - Bulk update courses
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { instructorId, courseIds, action } = body as {
      instructorId?: string
      courseIds?: string[]
      action?: 'publish' | 'unpublish' | 'archive' | 'unarchive'
    }

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { error: 'courseIds must be a non-empty array of course IDs' },
        { status: 400 }
      )
    }

    const validActions = ['publish', 'unpublish', 'archive', 'unarchive']
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: `action must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify instructor exists
    const instructor = await db.user.findUnique({
      where: { id: instructorId },
      select: { id: true, role: true },
    })
    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
    }

    // Verify all courses belong to this instructor
    const courses = await db.course.findMany({
      where: {
        id: { in: courseIds },
        instructorId,
      },
      select: { id: true, title: true, isPublished: true, isArchived: true },
    })

    if (courses.length === 0) {
      return NextResponse.json(
        { error: 'No matching courses found for this instructor' },
        { status: 404 }
      )
    }

    const foundCourseIds = new Set(courses.map((c) => c.id))
    const notFoundIds = courseIds.filter((id) => !foundCourseIds.has(id))
    if (notFoundIds.length > 0) {
      return NextResponse.json(
        {
          error: `The following course IDs do not belong to this instructor: ${notFoundIds.join(', ')}`,
        },
        { status: 403 }
      )
    }

    // Build update data based on action
    let updateData: Record<string, unknown>
    let successMessage: string

    switch (action) {
      case 'publish':
        // Only publish courses that are not archived
        const publishableCourses = courses.filter((c) => !c.isArchived)
        if (publishableCourses.length === 0) {
          return NextResponse.json(
            { error: 'No publishable courses found (archived courses must be unarchived first)' },
            { status: 400 }
          )
        }
        updateData = {
          isPublished: true,
          reviewStatus: 'approved',
        }
        successMessage = `${publishableCourses.length} course(s) published successfully`
        break

      case 'unpublish':
        updateData = {
          isPublished: false,
          reviewStatus: 'draft',
        }
        successMessage = `${courses.length} course(s) unpublished successfully`
        break

      case 'archive':
        updateData = {
          isArchived: true,
          isPublished: false,
        }
        successMessage = `${courses.length} course(s) archived successfully`
        break

      case 'unarchive':
        updateData = {
          isArchived: false,
        }
        successMessage = `${courses.length} course(s) unarchived successfully`
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Execute bulk update
    const updateResult = await db.course.updateMany({
      where: {
        id: { in: courseIds },
        instructorId,
      },
      data: updateData,
    })

    // Log activity for each course
    const logPromises = courses.map((course) =>
      db.activityLog.create({
        data: {
          userId: instructorId,
          type: 'course_published',
          title: `Course ${action}d: ${course.title}`,
          description: `Instructor bulk ${action}d course "${course.title}"`,
          icon: action === 'publish' ? '🚀' : action === 'archive' ? '📦' : '📝',
          action,
          targetType: 'course',
          targetId: course.id,
          targetName: course.title,
          severity: 'info',
          category: 'admin_action',
        },
      }).catch(() => null) // Don't fail if logging fails
    )
    await Promise.all(logPromises)

    return NextResponse.json({
      success: true,
      action,
      updatedCount: updateResult.count,
      message: successMessage,
      courseIds: courseIds,
    })
  } catch (error) {
    console.error('Error in bulk course update:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk update' },
      { status: 500 }
    )
  }
}
