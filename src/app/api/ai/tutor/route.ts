import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AIService } from '@/services/ai';

const SYSTEM_PROMPT_EN = `You are Ask ShijlAI, an AI-powered educational assistant for students worldwide on the ShijlAI Academy platform — a global learning academy. You guide students using the Socratic method - asking probing questions rather than giving direct answers. Be encouraging but rigorous.

Key principles:
1. Ask guiding questions that lead students to discover answers themselves
2. Break down complex problems into smaller, manageable steps
3. Use real-world examples and analogies that are universally relatable and culturally inclusive
4. Celebrate correct reasoning and gently correct misconceptions
5. When a student is stuck, provide hints rather than direct solutions
6. Support multilingual communication when requested
7. Reference international curriculum standards (IB, AP, Cambridge, Common Core, etc.) when relevant
8. Be patient, supportive, and enthusiastic about learning
9. If a student asks for a direct answer, explain why understanding the process is more valuable
10. Use markdown formatting for mathematical expressions, code blocks, and emphasis
11. When explaining code, use Python as default unless student specifies another language
12. After explaining a concept, always ask a follow-up question to check understanding
13. Use emojis sparingly but effectively to make learning fun 🎯
14. Structure your responses with clear headings (##, ###), bullet points, and numbered lists
15. Use **bold** for key terms and *italic* for emphasis
16. Always use proper markdown formatting - never leave formatting markers as plain text`;

const QUICK_ACTION_PROMPTS: Record<string, string> = {
  explain_simpler: 'The student wants a simpler explanation. Please re-explain the last concept in even simpler terms, as if teaching a beginner. Use very basic analogies.',
  more_examples: 'The student wants more examples. Please provide 2-3 additional real-world examples to illustrate the last concept you explained.',
  test_me: 'The student wants to be tested. Create a short quiz or practice problem related to what you just discussed. Ask them to solve it step by step.',
  translate: 'The student wants the explanation in a different language. Please rephrase your last response in simpler, clearer terms while keeping technical terms and code in English.',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, message, context, sessionId, language, quickAction } = body as {
      userId: string;
      message: string;
      context?: string;
      sessionId?: string;
      language?: string;
      quickAction?: string;
    };

    if (!userId || !message) {
      return NextResponse.json(
        { error: 'userId and message are required' },
        { status: 400 }
      );
    }

    // Verify user exists, fallback to first student user if not found
    let validUserId = userId;
    const userExists = await db.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      const fallbackUser = await db.user.findFirst({ where: { role: 'student' } });
      if (fallbackUser) {
        validUserId = fallbackUser.id;
      } else {
        const anyUser = await db.user.findFirst();
        if (anyUser) validUserId = anyUser.id;
      }
    }

    const lang = language || 'en';

    // Determine or create session
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      // Create a new session
      const titleFromMessage = message.length > 50 ? message.slice(0, 50) + '...' : message;
      const session = await db.tutorSession.create({
        data: {
          userId: validUserId,
          title: titleFromMessage,
          context: context || null,
          language: lang,
        },
      });
      activeSessionId = session.id;
    }

    // Save user message
    await db.chatMessage.create({
      data: {
        userId: validUserId,
        sessionId: activeSessionId,
        role: 'user',
        content: message,
        context: context || null,
        language: lang,
        quickAction: quickAction || null,
      },
    });

    // Get recent chat history for context (within this session)
    const recentMessages = await db.chatMessage.findMany({
      where: {
        sessionId: activeSessionId,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const chatHistory = recentMessages
      .reverse()
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    // Build context-aware system prompt
    let contextPrompt = SYSTEM_PROMPT_EN;
    if (context) {
      contextPrompt += `\n\nCurrent learning context: ${context}`;
    }
    if (quickAction && QUICK_ACTION_PROMPTS[quickAction]) {
      contextPrompt += `\n\n${QUICK_ACTION_PROMPTS[quickAction]}`;
    }
    if (lang !== 'en') {
      contextPrompt += `\n\nThe student prefers to communicate in ${lang}. Respond in the student's preferred language, but keep technical terms and code in English.`;
    }

    // Call AI using AIService
    const aiResponse = await AIService.chat({
      systemPrompt: contextPrompt,
      messages: chatHistory,
      complexity: 'fast',
      feature: 'tutor',
      userId: validUserId,
      sessionId: activeSessionId,
    });

    // Save assistant message
    await db.chatMessage.create({
      data: {
        userId: validUserId,
        sessionId: activeSessionId,
        role: 'assistant',
        content: aiResponse,
        context: context || null,
        language: lang,
      },
    });

    // Update session title from first user message if it's still default
    if (chatHistory.length <= 1) {
      const topic = message.length > 50 ? message.slice(0, 50) + '...' : message;
      await db.tutorSession.update({
        where: { id: activeSessionId },
        data: { title: topic, context: context || null },
      });
    } else {
      await db.tutorSession.update({
        where: { id: activeSessionId },
        data: { updatedAt: new Date() },
      });
    }

    // Award small XP for engaging with Ask ShijlAI
    await db.user.update({
      where: { id: validUserId },
      data: {
        xp: { increment: 5 },
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json({
      message: aiResponse,
      sessionId: activeSessionId,
      xpEarned: 5,
    });
  } catch (error) {
    console.error('Error in Ask ShijlAI:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
