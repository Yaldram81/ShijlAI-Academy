import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/instructor/courses/[id]/reorder - Reorder modules
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { moduleIds } = body

    if (!Array.isArray(moduleIds) || moduleIds.length === 0) {
      return NextResponse.json(
        { error: 'moduleIds must be a non-empty array of module IDs' },
        { status: 400 }
      )
    }

    // Verify all modules belong to this course
    const modules = await db.module.findMany({
      where: { courseId: id },
      select: { id: true },
    })

    const courseModuleIds = new Set(modules.map((m) => m.id))
    for (const modId of moduleIds) {
      if (!courseModuleIds.has(modId)) {
        return NextResponse.json(
          { error: `Module ${modId} does not belong to this course` },
          { status: 400 }
        )
      }
    }

    // Update all module orders in a transaction
    await db.$transaction(
      moduleIds.map((modId: string, index: number) =>
        db.module.update({
          where: { id: modId },
          data: { order: index },
        })
      )
    )

    // Return updated modules
    const updatedModules = await db.module.findMany({
      where: { courseId: id },
      orderBy: { order: 'asc' },
      include: {
        lessons: { orderBy: { order: 'asc' } },
      },
    })

    return NextResponse.json({
      modules: updatedModules,
      message: 'Modules reordered successfully',
    })
  } catch (error) {
    console.error('Error reordering modules:', error)
    return NextResponse.json({ error: 'Failed to reorder modules' }, { status: 500 })
  }
}
