import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentName, courseName, lastMessage } = body

    if (!studentName || !courseName || !lastMessage) {
      return NextResponse.json(
        { error: 'Missing required fields: studentName, courseName, lastMessage' },
        { status: 400 }
      )
    }

    const sdk = await ZAI.create()

    const prompt = `You are an AI assistant helping a course instructor draft a reply to a student message on an online learning platform (ShijlAI Academy, a global learning platform).

Student: ${studentName}
Course: ${courseName}
Student's last message: "${lastMessage}"

Instructions:
- Draft a helpful, warm, and professional reply from the instructor
- Keep it concise (2-4 sentences max)
- Be encouraging and supportive
- Use a friendly but professional tone
- If the student asked a question, provide a clear answer or next step
- If the student gave feedback, acknowledge and appreciate it
- Occasionally use relevant emoji (max 1-2)
- Do NOT use generic responses — make it specific to the student's message

Reply:`

    const result = await sdk.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'deepseek-ai/DeepSeek-V3',
    })

    const suggestion = result.choices?.[0]?.message?.content?.trim() || 
      `Thank you for reaching out, ${studentName}! I'll look into this for you. In the meantime, please review the relevant course materials and feel free to ask if you have more questions.`

    return NextResponse.json({ suggestion })
  } catch (error) {
    console.error('[AI Suggest Reply] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate reply suggestion' },
      { status: 500 }
    )
  }
}
