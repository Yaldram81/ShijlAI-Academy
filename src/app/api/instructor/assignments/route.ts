import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/assignments - Get all assignments for the instructor's courses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')
    const search = searchParams.get('search')
    const courseId = searchParams.get('courseId')
    const type = searchParams.get('type') // written, coding, project, peer-review, presentation
    const status = searchParams.get('status') // published, draft
    const sortBy = searchParams.get('sortBy') || 'createdAt' // createdAt, title, type, dueDate
    const sortOrder = searchParams.get('sortOrder') || 'desc' // asc, desc

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    // Verify instructor exists
    const instructor = await db.user.findUnique({
      where: { id: instructorId },
      select: { id: true, role: true },
    })
    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
    }

    // Get all courses for this instructor
    const instructorCourses = await db.course.findMany({
      where: { instructorId },
      select: { id: true, title: true },
    })

    if (instructorCourses.length === 0) {
      return NextResponse.json({
        assignments: [],
        summary: {
          totalAssignments: 0,
          publishedCount: 0,
          draftCount: 0,
          byType: {
            written: 0,
            coding: 0,
            project: 0,
            'peer-review': 0,
            presentation: 0,
          },
        },
      })
    }

    const courseIds = instructorCourses.map((c) => c.id)

    // Build where clause
    const where: Record<string, unknown> = {
      courseId: { in: courseIds },
    }

    if (courseId) {
      where.courseId = courseId
    }

    if (type) {
      where.type = type
    }

    if (status === 'published') {
      where.isPublished = true
    } else if (status === 'draft') {
      where.isPublished = false
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    // Parse sort
    const sortMap: Record<string, Record<string, string>> = {
      createdAt: { createdAt: sortOrder },
      title: { title: sortOrder },
      type: { type: sortOrder },
      dueDate: { dueDate: sortOrder },
      order: { order: sortOrder },
      updatedAt: { updatedAt: sortOrder },
    }
    const orderBy = sortMap[sortBy] || { createdAt: 'desc' }

    // Fetch assignments
    const assignments = await db.assignment.findMany({
      where,
      include: {
        course: {
          select: { id: true, title: true },
        },
      },
      orderBy,
    })

    // Get module data for assignments that have moduleId
    const moduleIds = assignments
      .map((a) => a.moduleId)
      .filter((id): id is string => id !== null)
    const modules = moduleIds.length > 0
      ? await db.module.findMany({
          where: { id: { in: moduleIds } },
          select: { id: true, title: true },
        })
      : []
    const moduleMap = new Map(modules.map((m) => [m.id, m]))

    // Get enrollment counts per course for submission estimation
    const courseEnrollmentCounts = await db.enrollment.groupBy({
      by: ['courseId'],
      where: { courseId: { in: courseIds } },
      _count: { id: true },
    })
    const enrollmentCountMap = new Map(
      courseEnrollmentCounts.map((e) => [e.courseId, e._count.id])
    )

    // Get actual submission counts per assignment
    const submissionCounts = await db.submission.groupBy({
      by: ['assignmentId'],
      where: { assignmentId: { in: assignments.map(a => a.id) } },
      _count: { id: true },
    })
    const submissionCountMap = new Map(
      submissionCounts.map((s) => [s.assignmentId, s._count.id])
    )

    // Format assignments
    const formattedAssignments = assignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      instructions: assignment.instructions,
      type: assignment.type,
      submissionType: assignment.submissionType,
      maxScore: assignment.maxScore,
      dueDate: assignment.dueDate,
      wordLimit: assignment.wordLimit,
      isPublished: assignment.isPublished,
      order: assignment.order,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
      course: {
        id: assignment.course.id,
        title: assignment.course.title,
      },
      module: assignment.moduleId
        ? moduleMap.has(assignment.moduleId)
          ? { id: assignment.moduleId, title: moduleMap.get(assignment.moduleId)!.title }
          : { id: assignment.moduleId, title: null }
        : null,
      submissionCount: submissionCountMap.get(assignment.id) || 0,
      enrollmentCount: enrollmentCountMap.get(assignment.courseId) || 0,
    }))

    // Build summary from ALL assignments (not filtered)
    const allAssignments = await db.assignment.findMany({
      where: { courseId: { in: courseIds } },
      select: { type: true, isPublished: true },
    })

    const totalAssignments = allAssignments.length
    const publishedCount = allAssignments.filter((a) => a.isPublished).length
    const draftCount = allAssignments.filter((a) => !a.isPublished).length

    const byType = {
      written: allAssignments.filter((a) => a.type === 'written').length,
      coding: allAssignments.filter((a) => a.type === 'coding').length,
      project: allAssignments.filter((a) => a.type === 'project').length,
      'peer-review': allAssignments.filter((a) => a.type === 'peer-review').length,
      presentation: allAssignments.filter((a) => a.type === 'presentation').length,
    }

    return NextResponse.json({
      assignments: formattedAssignments,
      summary: {
        totalAssignments,
        publishedCount,
        draftCount,
        byType,
      },
    })
  } catch (error) {
    console.error('Error fetching instructor assignments:', error)
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
}

// POST /api/instructor/assignments - Create a new assignment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      instructorId,
      title,
      description,
      type,
      courseId,
      moduleId,
      dueDate,
      maxScore,
      submissionType,
      wordLimit,
      instructions,
      rubric,
      resources,
      isPublished,
    } = body

    if (!instructorId || !title || !courseId) {
      return NextResponse.json(
        { error: 'Instructor ID, title, and course ID are required' },
        { status: 400 }
      )
    }

    // Verify instructor owns the course
    const course = await db.course.findFirst({
      where: { id: courseId, instructorId },
    })
    if (!course) {
      return NextResponse.json(
        { error: 'Course not found or you do not have permission' },
        { status: 403 }
      )
    }

    // Get the max order for assignments in this course
    const maxOrderAssignment = await db.assignment.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const nextOrder = (maxOrderAssignment?.order ?? 0) + 1

    const assignment = await db.assignment.create({
      data: {
        title,
        description: description || '',
        instructions: instructions || '',
        type: type || 'written',
        courseId,
        moduleId: moduleId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        maxScore: maxScore || 100,
        submissionType: submissionType || 'text',
        wordLimit: wordLimit || null,
        rubric: rubric || null,
        resources: resources || null,
        isPublished: isPublished ?? false,
        order: nextOrder,
      },
      include: {
        course: {
          select: { id: true, title: true },
        },
      },
    })

    return NextResponse.json({ assignment }, { status: 201 })
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
  }
}
