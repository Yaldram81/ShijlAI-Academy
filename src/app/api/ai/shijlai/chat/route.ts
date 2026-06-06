import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { logEvent } from '@/services/learning-engine'
import { getWeakTopics } from '@/services/learning-engine'

const MODE_PROMPTS: Record<string, string> = {
  tutor: `You are ShijlAI, a warm and friendly AI learning buddy. Talk to the student like a knowledgeable friend who genuinely cares — NOT like a teacher giving a lecture or a textbook. Be conversational, encouraging, and relatable.

CRITICAL RULES:
- DO NOT create structured lesson plans, step-by-step plans, or numbered outlines
- DO NOT use headings like "Understanding the Core Concept" or "Building from the Ground Up"
- DO NOT list rules, formulas, or definitions in rigid numbered lists
- Instead, EXPLAIN things naturally in flowing paragraphs — like you're chatting with a friend
- Use simple, everyday language and relatable analogies
- Be concise — a few well-written paragraphs beat a wall of structured content
- When the student is struggling, be encouraging first, then help gently
- Ask follow-up questions to check understanding naturally ("Does that make sense?", "Want me to explain that differently?")
- If they need practice, suggest 1-2 quick examples embedded naturally in your response — don't create a separate "Practice" section

Formatting:
- Use **bold** sparingly for truly important terms only
- Use short paragraphs for readability
- Use bullet points ONLY when listing genuinely separate items (not for steps in an explanation)
- Use code blocks for code
- Keep it conversational — imagine texting a smart friend who explains things well`,

  quiz: `You are Ask ShijlAI in Quiz Mode. Generate practice questions to test the student's understanding. Start with easier questions and increase difficulty. Always explain the correct answer after the student responds.

CRITICAL FORMAT — Follow this exact structure for every quiz question:
**Question 1:** [question text here]
A) [option A text]
B) [option B text]
C) [option C text]
D) [option D text]
Answer: [A/B/C/D]
Explanation: [why this answer is correct]

**Question 2:** [question text here]
A) [option A text]
B) [option B text]
C) [option D text]
D) [option D text]
Answer: [A/B/C/D]
Explanation: [why this answer is correct]

Rules:
- Each question MUST start with **Question N:** on its own line
- Options MUST be on separate lines starting with A) B) C) D)
- Always provide the Answer and Explanation after the options
- Generate 3-5 questions per quiz unless the student requests more`,

  assignment: `You are Ask ShijlAI in Assignment Helper Mode. Help students understand requirements, break tasks into steps, and suggest approaches. Do NOT write the entire assignment for them. Guide them to think critically and develop their own solutions.

Format guidelines:
- Break tasks into clearly numbered steps: Step 1:, Step 2:, etc.
- Use **bold** for step titles
- Include time estimates in parentheses like (30 min) or (1-2 hours)
- Provide checklists using bullet points
- Use ## headings for major sections`,

  study_planner: `You are Ask ShijlAI in Study Planner Mode. Create personalized study schedules based on the student's goals, timeline, and weak areas. Consider their learning speed and available time.

Format guidelines:
- Organize by days: **Day 1:**, **Day 2:**, etc.
- Under each day, list tasks as bullet points with type indicators:
  - 📖 Study: [topic] (duration)
  - 📝 Quiz: [topic] (duration)
  - 🔄 Revision: [topic] (duration)
  - ☕ Break (duration)
- Include time slots when possible
- Use ## headings for plan overview sections
- Use **bold** for important deadlines or milestones`,

  career_advisor: `You are Ask ShijlAI in Career Advisor Mode. Provide career guidance, roadmap suggestions, and skill development recommendations. Consider the student's current level and interests.

Format guidelines:
- Structure career paths as phases/steps: **Step 1:**, **Step 2:**, etc.
- Include timeframes in parentheses like (0-6 months) or (1-2 years)
- List required skills as bullet points under each step
- Use ## headings for different career paths or sections
- Suggest specific courses, certifications, or resources with bullet points
- Use **bold** for job titles, skill names, and certification names`,

  companion: `You are the AI Learning Companion, a warm and caring AI mentor who feels like a supportive friend. You proactively use the student's learning data to give personalized guidance, but you deliver it naturally — like a friend who noticed something and wants to help, NOT like a system generating alerts.

Your personality: Warm, genuine, encouraging, and proactive. You celebrate wins, notice struggles early, and always offer a helping hand.

CRITICAL RULES:
- DO NOT create structured step-by-step plans, numbered outlines, or lesson plans
- DO NOT use academic headings like "Understanding the Core Concept" or "Building from the Ground Up"
- Instead, share observations naturally: "Hey, I noticed your Calculus scores dipped this week — want some help with that?"
- When suggesting actions, weave them into conversation naturally, don't list them as numbered steps
- Be concise — a short caring message beats a wall of structured content
- Celebrate progress genuinely: "Awesome! Your mastery jumped 12% this week! 🎉"
- When there's a problem, acknowledge it warmly first, then offer help gently
- End with a natural follow-up to keep the conversation going

Formatting:
- Use **bold** sparingly for key terms or important insights only
- Use short paragraphs for readability
- Use bullet points ONLY for genuinely separate items (not steps in an explanation)
- Include specific metrics naturally: "Your quiz scores went from 78% to 63% this week"
- Keep it conversational and warm — imagine a caring friend texting you`,
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, message, mode = 'tutor', sessionId, courseId, language, quickAction } = body

    if (!userId || !message) {
      return NextResponse.json({ error: 'userId and message are required' }, { status: 400 })
    }

    // Get or create session
    let session
    if (sessionId) {
      session = await db.shijlAISession.findUnique({ where: { id: sessionId } })
      if (!session) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }
    } else {
      const title = message.slice(0, 60) + (message.length > 60 ? '...' : '')
      session = await db.shijlAISession.create({
        data: {
          userId,
          title,
          mode,
          courseId: courseId || null,
          language: language || 'en',
        },
      })
    }

    // Save user message
    const userMessage = await db.shijlAIMessage.create({
      data: {
        sessionId: session.id,
        userId,
        role: 'user',
        content: message,
        mode,
        quickAction: quickAction || null,
      },
    })

    // Build context
    // 1. Student learning profile with computed metrics
    const profile = await db.studentLearningProfile.findUnique({ where: { studentId: userId } })

    // 2. Topic mastery and drop risk context
    const weakTopics = await getWeakTopics(userId)
    const dropRiskScore = profile?.dropRiskScore || 0
    const engagementScore = profile?.engagementScore || 0
    const consistencyScore = profile?.consistencyScore || 0

    // 3. Current course info
    let courseContext = ''
    if (courseId) {
      const course = await db.course.findUnique({
        where: { id: courseId },
        include: { modules: { include: { lessons: true }, orderBy: { order: 'asc' } } },
      })
      if (course) {
        courseContext = `\n\nCurrent Course: ${course.title} (${course.category}, ${course.level} level)\nDescription: ${course.description}\nModules: ${course.modules.map(m => m.title).join(', ')}`
      }
    }

    // 4. Conversation summary
    const summaries = await db.conversationSummary.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 1,
    })

    // 5. Recent messages
    const recentMessages = await db.shijlAIMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    const messageHistory = recentMessages
      .reverse()
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    // Build system prompt
    let systemPrompt = MODE_PROMPTS[mode] || MODE_PROMPTS.tutor

    if (profile) {
      systemPrompt += `\n\nStudent Profile:
- Learning Level: ${profile.learningLevel}
- Engagement Score: ${profile.engagementScore}/100
- Consistency Score: ${profile.consistencyScore}/100
- Learning Speed Score: ${profile.learningSpeedScore}/100
- Drop Risk Score: ${profile.dropRiskScore}/100
- Completion Rate: ${profile.completionRate}%
- Average Quiz Score: ${profile.averageQuizScore}%
- Weak Topics: ${profile.weakTopics}
- Strong Topics: ${profile.strongTopics}
- Learning Speed: ${profile.learningSpeed}
- Study Streak: ${profile.studyStreakDays} days
- Total XP: ${profile.totalXpEarned}
- Last Computed: ${profile.lastComputedAt || 'Never'}`

      // Add drop risk context
      if (dropRiskScore > 60) {
        systemPrompt += `\n\n⚠️ IMPORTANT: This student has a HIGH drop risk score (${Math.round(dropRiskScore)}/100). Be especially encouraging, offer specific study strategies, and suggest breaking work into smaller achievable tasks. Avoid overwhelming the student.`
      } else if (dropRiskScore > 30) {
        systemPrompt += `\n\nNote: This student has a moderate drop risk score (${Math.round(dropRiskScore)}/100). Be supportive and suggest ways to stay consistent.`
      }

      // Add engagement context
      if (engagementScore < 30) {
        systemPrompt += `\n\nNote: This student's engagement is low (${Math.round(engagementScore)}/100). Try to make the conversation interactive and engaging. Ask questions and provide quick wins.`
      }

      // Add consistency context
      if (consistencyScore < 30) {
        systemPrompt += `\n\nNote: This student's consistency is low (${Math.round(consistencyScore)}/100). Encourage daily study habits and small consistent steps.`
      }
    }

    // Add weak topic mastery context
    if (weakTopics.length > 0) {
      const topicSummary = weakTopics
        .slice(0, 5)
        .map(t => `${t.topicName} (mastery: ${Math.round(t.masteryScore)}%, trend: ${t.trend})`)
        .join('; ')
      systemPrompt += `\n\nWeak Topic Masteries: ${topicSummary}\nWhen discussing these topics, provide extra explanations and simpler examples. Build understanding gradually.`
    }

    if (courseContext) {
      systemPrompt += courseContext
    }

    if (summaries.length > 0) {
      systemPrompt += `\n\nPrevious Conversation Summary: ${summaries[0].summary}`
    }

    if (quickAction) {
      const actionContexts: Record<string, string> = {
        explain_simpler: '\n\nThe student wants a simpler explanation. Break it down into basic concepts.',
        more_examples: '\n\nThe student wants more examples. Provide 2-3 additional examples.',
        test_me: '\n\nThe student wants to be tested. Generate a practice question related to the current topic.',
        translate: '\n\nThe student wants a translation. Provide the content in Urdu as well.',
      }
      if (actionContexts[quickAction]) {
        systemPrompt += actionContexts[quickAction]
      }
    }

    // Call LLM
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        ...messageHistory,
      ],
      thinking: { type: 'disabled' },
    })

    const aiResponse = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.'

    // Save AI response
    const assistantMessage = await db.shijlAIMessage.create({
      data: {
        sessionId: session.id,
        userId,
        role: 'assistant',
        content: aiResponse,
        mode,
      },
    })

    // Update session message count
    const updatedSession = await db.shijlAISession.update({
      where: { id: session.id },
      data: {
        messageCount: { increment: 2 },
        updatedAt: new Date(),
      },
    })

    // If messageCount > 20, generate conversation summary
    if (updatedSession.messageCount > 20 && !updatedSession.summaryGeneratedAt) {
      try {
        const allMessages = await db.shijlAIMessage.findMany({
          where: { sessionId: session.id },
          orderBy: { createdAt: 'asc' },
        })
        const conversationText = allMessages
          .map(m => `${m.role}: ${m.content}`)
          .join('\n')

        const summaryCompletion = await zai.chat.completions.create({
          messages: [
            {
              role: 'assistant',
              content: 'Summarize this conversation concisely, highlighting key topics discussed, concepts explained, and questions asked. Output as a brief paragraph.',
            },
            { role: 'user', content: conversationText },
          ],
          thinking: { type: 'disabled' },
        })

        const summaryText = summaryCompletion.choices[0]?.message?.content || ''
        if (summaryText) {
          await db.conversationSummary.create({
            data: {
              sessionId: session.id,
              summary: summaryText,
              keyTopics: '[]',
              messageRangeStart: 0,
              messageRangeEnd: allMessages.length - 1,
            },
          })
          await db.shijlAISession.update({
            where: { id: session.id },
            data: {
              summary: summaryText,
              summaryGeneratedAt: new Date(),
            },
          })
        }
      } catch {
        // Summary generation is non-critical, log and continue
        console.error('Failed to generate conversation summary')
      }
    }

    // Log the ai_tutor_used event for the learning engine
    try {
      await logEvent({
        userId,
        eventType: 'ai_tutor_used',
        courseId: courseId || undefined,
        metadata: {
          sessionId: session.id,
          mode,
          messageId: assistantMessage.id,
          quickAction: quickAction || null,
        },
      })
    } catch (eventError) {
      // Event logging is non-critical
      console.error('[ShijlAI Chat] Failed to log ai_tutor_used event:', eventError)
    }

    // Log activity
    await db.studentAIActivity.create({
      data: {
        userId,
        activityType: 'chat_message',
        mode,
        sessionId: session.id,
        metadata: JSON.stringify({ messageId: assistantMessage.id }),
      },
    })

    return NextResponse.json({
      message: aiResponse,
      sessionId: session.id,
      mode,
    })
  } catch (error) {
    console.error('[ShijlAI Chat] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
