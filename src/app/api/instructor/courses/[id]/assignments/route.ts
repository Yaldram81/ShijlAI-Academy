import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/courses/[id]/assignments - List assignments for a course
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const moduleId = searchParams.get('moduleId')

    const course = await db.course.findUnique({ where: { id } })
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    const where: Record<string, unknown> = { courseId: id }
    if (moduleId) {
      where.moduleId = moduleId
    }

    const assignments = await db.assignment.findMany({
      where,
      include: {
        module: {
          select: { id: true, title: true },
        },
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
  }
}

// POST /api/instructor/courses/[id]/assignments - Create assignment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      title, description, instructions, type, moduleId, maxScore, dueDate,
      rubric, resources, submissionType, wordLimit, order,
    } = body

    if (!title || !description || !instructions) {
      return NextResponse.json(
        { error: 'Title, description, and instructions are required' },
        { status: 400 }
      )
    }

    const course = await db.course.findUnique({ where: { id } })
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Validate moduleId if provided
    if (moduleId) {
      const moduleExists = await db.module.findUnique({
        where: { id: moduleId, courseId: id },
      })
      if (!moduleExists) {
        return NextResponse.json(
          { error: 'Module not found or does not belong to this course' },
          { status: 400 }
        )
      }
    }

    // Get next order if not specified
    let assignmentOrder = order
    if (assignmentOrder === undefined || assignmentOrder === null) {
      const maxOrder = await db.assignment.findFirst({
        where: { courseId: id },
        orderBy: { order: 'desc' },
        select: { order: true },
      })
      assignmentOrder = (maxOrder?.order ?? -1) + 1
    }

    const assignment = await db.assignment.create({
      data: {
        title,
        description,
        instructions,
        type: type || 'written',
        moduleId: moduleId || null,
        courseId: id,
        maxScore: maxScore || 100,
        dueDate: dueDate ? new Date(dueDate) : null,
        rubric: rubric || null,
        resources: resources || null,
        submissionType: submissionType || 'text',
        wordLimit: wordLimit || null,
        isPublished: body.isPublished ?? true,
        order: assignmentOrder,
      },
      include: {
        module: {
          select: { id: true, title: true },
        },
      },
    })

    return NextResponse.json(
      { assignment, message: 'Assignment created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 })
  }
}
