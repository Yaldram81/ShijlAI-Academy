import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface InstructorNoteEntry {
  note: string
  instructorId: string
  instructorName: string
  date: string
}

// GET /api/instructor/students/[studentId]/note - Get instructor's private notes about a student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    const student = await db.user.findUnique({
      where: { id: studentId },
      select: { id: true, adminNotes: true },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Parse existing adminNotes and filter by instructorId
    let notes: InstructorNoteEntry[] = []
    if (student.adminNotes) {
      try {
        notes = JSON.parse(student.adminNotes)
      } catch {
        notes = []
      }
    }

    const instructorNotes = notes.filter(n => n.instructorId === instructorId)

    return NextResponse.json({ notes: instructorNotes })
  } catch (error) {
    console.error('Error fetching student notes:', error)
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 })
  }
}

// POST /api/instructor/students/[studentId]/note - Save a private note about a student
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params
    const body = await request.json()
    const { note, instructorId, instructorName } = body

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    if (!note?.trim()) {
      return NextResponse.json({ error: 'Note cannot be empty' }, { status: 400 })
    }

    const student = await db.user.findUnique({
      where: { id: studentId },
      select: { id: true, adminNotes: true },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Parse existing adminNotes, preserving notes from other sources
    let existingNotes: InstructorNoteEntry[] = []
    if (student.adminNotes) {
      try {
        existingNotes = JSON.parse(student.adminNotes)
      } catch {
        existingNotes = []
      }
    }

    // Append new note entry
    const newNote: InstructorNoteEntry = {
      note: note.trim(),
      instructorId,
      instructorName: instructorName || 'Unknown Instructor',
      date: new Date().toISOString(),
    }
    existingNotes.push(newNote)

    await db.user.update({
      where: { id: studentId },
      data: { adminNotes: JSON.stringify(existingNotes) },
    })

    return NextResponse.json({ success: true, note: newNote })
  } catch (error) {
    console.error('Error saving student note:', error)
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 })
  }
}
