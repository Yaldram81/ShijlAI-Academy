import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const quiz = await db.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            text: true,
            type: true,
            options: true,
            points: true,
            order: true,
            // Intentionally exclude correctAnswer and explanation
          },
        },
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Parse options JSON for each question
    const questionsWithParsedOptions = quiz.questions.map((q) => ({
      ...q,
      options: (() => { try { return JSON.parse(q.options) } catch { return [] } })(),
    }));

    return NextResponse.json({
      quiz: {
        ...quiz,
        questions: questionsWithParsedOptions,
      },
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz' },
      { status: 500 }
    );
  }
}
