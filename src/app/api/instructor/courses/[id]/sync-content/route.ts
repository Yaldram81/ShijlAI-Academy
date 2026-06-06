import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/instructor/courses/[id]/sync-content - Bulk sync modules & lessons
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: courseId } = await params
    const body = await request.json()
    const { modules: formModules } = body as {
      modules: Array<{
        id: string
        title: string
        description: string
        order: number
        learningObjectives: string[]
        isPublished: boolean
        lessons: Array<{
          id: string
          title: string
          description: string
          content: string
          type: string
          videoUrl: string
          duration: number
          order: number
          resources: Array<{ id: string; title: string; url: string; type: string }>
          objectives: string[]
          isFree: boolean
          isPublished: boolean
          transcript: string
          slideUrl: string
        }>
        quizzes: Array<unknown>
      }>
    }

    // Verify course exists and instructor owns it
    const course = await db.course.findUnique({ where: { id: courseId } })
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Verify ownership
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId') || body.instructorId
    if (!instructorId || course.instructorId !== instructorId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Get existing DB modules for this course
    const existingModules = await db.module.findMany({
      where: { courseId },
      include: { lessons: true },
    })

    const existingModuleIds = new Set(existingModules.map(m => m.id))
    const formModuleIds = new Set(formModules.map(m => m.id))

    // Helper: check if an ID is a client-generated temporary ID
    const isTempId = (id: string) => id.includes('-') && !id.startsWith('cl')

    // Track ID mappings (tempId -> dbId)
    const moduleIdMap = new Map<string, string>()
    const lessonIdMap = new Map<string, string>()

    // ─── Delete modules that exist in DB but not in form ───
    const modulesToDelete = existingModules.filter(m => !formModuleIds.has(m.id))
    for (const mod of modulesToDelete) {
      // Lessons cascade delete
      await db.module.delete({ where: { id: mod.id } })
    }

    // ─── Create / Update modules ───
    for (let i = 0; i < formModules.length; i++) {
      const fm = formModules[i]
      const moduleId = fm.id

      if (isTempId(moduleId)) {
        // New module - create in DB
        const newModule = await db.module.create({
          data: {
            title: fm.title,
            description: fm.description || null,
            order: i,
            courseId,
            learningObjectives: fm.learningObjectives?.length
              ? JSON.stringify(fm.learningObjectives)
              : null,
            isPublished: fm.isPublished ?? false,
          },
        })
        moduleIdMap.set(moduleId, newModule.id)

        // Create lessons for this new module
        for (let j = 0; j < fm.lessons.length; j++) {
          const fl = fm.lessons[j]
          const lessonId = fl.id

          const newLesson = await db.lesson.create({
            data: {
              title: fl.title,
              description: fl.description || null,
              content: fl.content || '',
              type: fl.type || 'text',
              videoUrl: fl.videoUrl || null,
              duration: fl.duration || 0,
              order: j,
              moduleId: newModule.id,
              resources: fl.resources?.length ? JSON.stringify(fl.resources) : null,
              objectives: fl.objectives?.length ? JSON.stringify(fl.objectives) : null,
              isFree: fl.isFree ?? false,
              isPublished: fl.isPublished ?? true,
              transcript: fl.transcript || null,
              slideUrl: fl.slideUrl || null,
            },
          })
          lessonIdMap.set(lessonId, newLesson.id)
        }
      } else if (existingModuleIds.has(moduleId)) {
        // Existing module - update
        await db.module.update({
          where: { id: moduleId },
          data: {
            title: fm.title,
            description: fm.description || null,
            order: i,
            learningObjectives: fm.learningObjectives?.length
              ? JSON.stringify(fm.learningObjectives)
              : null,
            isPublished: fm.isPublished ?? false,
          },
        })

        // Get existing lessons for this module
        const existingLessons = existingModules.find(m => m.id === moduleId)?.lessons || []
        const existingLessonIds = new Set(existingLessons.map(l => l.id))
        const formLessonIds = new Set(fm.lessons.map(l => l.id))

        // Delete lessons not in form
        const lessonsToDelete = existingLessons.filter(l => !formLessonIds.has(l.id))
        for (const lesson of lessonsToDelete) {
          await db.lesson.delete({ where: { id: lesson.id } })
        }

        // Create / Update lessons
        for (let j = 0; j < fm.lessons.length; j++) {
          const fl = fm.lessons[j]

          if (isTempId(fl.id)) {
            // New lesson
            const newLesson = await db.lesson.create({
              data: {
                title: fl.title,
                description: fl.description || null,
                content: fl.content || '',
                type: fl.type || 'text',
                videoUrl: fl.videoUrl || null,
                duration: fl.duration || 0,
                order: j,
                moduleId,
                resources: fl.resources?.length ? JSON.stringify(fl.resources) : null,
                objectives: fl.objectives?.length ? JSON.stringify(fl.objectives) : null,
                isFree: fl.isFree ?? false,
                isPublished: fl.isPublished ?? true,
                transcript: fl.transcript || null,
                slideUrl: fl.slideUrl || null,
              },
            })
            lessonIdMap.set(fl.id, newLesson.id)
          } else if (existingLessonIds.has(fl.id)) {
            // Existing lesson - update
            await db.lesson.update({
              where: { id: fl.id },
              data: {
                title: fl.title,
                description: fl.description || null,
                content: fl.content || '',
                type: fl.type || 'text',
                videoUrl: fl.videoUrl || null,
                duration: fl.duration || 0,
                order: j,
                resources: fl.resources?.length ? JSON.stringify(fl.resources) : null,
                objectives: fl.objectives?.length ? JSON.stringify(fl.objectives) : null,
                isFree: fl.isFree ?? false,
                isPublished: fl.isPublished ?? true,
                transcript: fl.transcript || null,
                slideUrl: fl.slideUrl || null,
              },
            })
          }
          // If lesson ID is not temp and not in existing, it might be from another module move — skip for safety
        }
      }
      // If moduleId is not temp and not in existing, skip (orphaned reference)
    }

    return NextResponse.json({
      message: 'Content synced successfully',
      moduleIdMap: Object.fromEntries(moduleIdMap),
      lessonIdMap: Object.fromEntries(lessonIdMap),
    })
  } catch (error) {
    console.error('Error syncing course content:', error)
    return NextResponse.json({ error: 'Failed to sync course content' }, { status: 500 })
  }
}
