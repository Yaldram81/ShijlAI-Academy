import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// POST /api/admin/course-thumbnails - Upload a course thumbnail image
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const courseId = formData.get('courseId') as string | null
    const file = formData.get('file') as File | null

    // Validate courseId
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }

    // Validate file
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      )
    }

    // Verify course exists
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { id: true, thumbnail: true },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Determine file extension
    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    }
    const ext = extMap[file.type] || 'jpg'

    // Generate filename
    const timestamp = Date.now()
    const filename = `${courseId}-${timestamp}.${ext}`

    // Ensure directory exists
    const publicDir = path.join(process.cwd(), 'public', 'course-thumbnails')
    await mkdir(publicDir, { recursive: true })

    // Write file to public directory
    const filePath = path.join(publicDir, filename)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await writeFile(filePath, buffer)

    // Update course thumbnail in database
    const thumbnailUrl = `/course-thumbnails/${filename}`
    await db.course.update({
      where: { id: courseId },
      data: { thumbnail: thumbnailUrl },
    })

    return NextResponse.json({
      url: thumbnailUrl,
      courseId,
    })
  } catch (error) {
    console.error('Error uploading course thumbnail:', error)
    return NextResponse.json({ error: 'Failed to upload thumbnail' }, { status: 500 })
  }
}
