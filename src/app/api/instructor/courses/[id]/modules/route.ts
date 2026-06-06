import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/courses/[id]/modules - Get all modules with lessons
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const modules = await db.module.findMany({
      where: { courseId: id },
      include: {
        lessons: { orderBy: { order: 'asc' } },
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ modules })
  } catch (error) {
    console.error('Error fetching modules:', error)
    return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 })
  }
}

// POST /api/instructor/courses/[id]/modules - Add a module
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description } = body

    if (!title) {
      return NextResponse.json({ error: 'Module title is required' }, { status: 400 })
    }

    // Get next order
    const maxOrder = await db.module.findFirst({
      where: { courseId: id },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    const module_ = await db.module.create({
      data: {
        title,
        description: description || null,
        order: (maxOrder?.order ?? -1) + 1,
        courseId: id,
      },
      include: { lessons: true },
    })

    return NextResponse.json({ module: module_, message: 'Module created successfully' }, { status: 201 })
  } catch (error) {
    console.error('Error creating module:', error)
    return NextResponse.json({ error: 'Failed to create module' }, { status: 500 })
  }
}
