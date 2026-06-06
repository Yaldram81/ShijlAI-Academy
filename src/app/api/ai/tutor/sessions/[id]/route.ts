import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/ai/tutor/sessions/[id] - Get a session with its messages
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await db.tutorSession.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

// PATCH /api/ai/tutor/sessions/[id] - Update a session
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, context, language, isArchived } = body as {
      title?: string;
      context?: string;
      language?: string;
      isArchived?: boolean;
    };

    const session = await db.tutorSession.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(context !== undefined && { context }),
        ...(language !== undefined && { language }),
        ...(isArchived !== undefined && { isArchived }),
      },
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

// DELETE /api/ai/tutor/sessions/[id] - Delete a session and its messages
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.chatMessage.deleteMany({ where: { sessionId: id } });
    await db.tutorSession.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
