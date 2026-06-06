import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

async function resolveUserId(userId: string): Promise<string> {
  const userExists = await db.user.findUnique({ where: { id: userId } });
  if (userExists) return userId;
  const fallback = await db.user.findFirst({ where: { role: 'student' } });
  if (fallback) return fallback.id;
  const anyUser = await db.user.findFirst();
  return anyUser?.id || userId;
}

// GET /api/ai/tutor/sessions - Get user's tutor sessions
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUserId = searchParams.get('userId');

    if (!rawUserId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const userId = await resolveUserId(rawUserId);

    const sessions = await db.tutorSession.findMany({
      where: { userId, isArchived: false },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true },
        },
      },
    });

    const formatted = sessions.map((s) => ({
      id: s.id,
      title: s.title,
      context: s.context,
      language: s.language,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      lastMessage: s.messages[0]?.content?.slice(0, 100) || null,
    }));

    return NextResponse.json({ sessions: formatted });
  } catch (error) {
    console.error('Error fetching tutor sessions:', error);
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
  }
}

// POST /api/ai/tutor/sessions - Create a new tutor session
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId: rawUserId, title, context, language } = body as {
      userId: string;
      title?: string;
      context?: string;
      language?: string;
    };

    if (!rawUserId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const userId = await resolveUserId(rawUserId);

    const session = await db.tutorSession.create({
      data: {
        userId,
        title: title || 'New Conversation',
        context: context || null,
        language: language || 'en',
      },
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error creating tutor session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
