import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateRecommendations } from '@/services/learning-engine'

// GET /api/ai/shijlai/recommendations?userId=xxx&type=xxx&status=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type')
    const status = searchParams.get('status') || 'active'

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = { userId, status }
    if (type) where.type = type

    const recommendations = await db.aIRecommendation.findMany({
      where,
      orderBy: { priorityScore: 'desc' },
      take: 50,
    })

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error('[ShijlAI Recommendations GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/ai/shijlai/recommendations
// Generate personalized recommendations using the new recommendation engine
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, sourceEvent, sourceData } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Use the new recommendation engine which incorporates topic mastery data
    const savedRecommendations = await generateRecommendations(userId)

    // If we also have a source event, try LLM enhancement for additional context
    if (sourceEvent) {
      try {
        const ZAI = (await import('z-ai-web-dev-sdk')).default
        const zai = await ZAI.create()

        // Get student profile for LLM context
        const profile = await db.studentLearningProfile.findUnique({
          where: { studentId: userId },
        })

        // Get topic mastery summary
        const weakTopics = await db.topicMastery.findMany({
          where: { userId, masteryScore: { lt: 50 } },
          orderBy: { masteryScore: 'asc' },
          take: 5,
        })

        const studentContext = {
          level: profile?.learningLevel || 'beginner',
          weakTopics: profile?.weakTopics || '[]',
          strongTopics: profile?.strongTopics || '[]',
          completionRate: profile?.completionRate || 0,
          avgQuizScore: profile?.averageQuizScore || 0,
          engagementScore: profile?.engagementScore || 0,
          consistencyScore: profile?.consistencyScore || 0,
          dropRiskScore: profile?.dropRiskScore || 0,
          learningSpeedScore: profile?.learningSpeedScore || 0,
          weakMasteryTopics: weakTopics.map(t => ({ name: t.topicName, score: t.masteryScore, trend: t.trend })),
          sourceEvent,
          sourceData,
        }

        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'assistant',
              content: `You are an AI learning recommendation engine for ShijlAI Academy. Based on the student's profile and topic mastery data, generate 2-3 additional personalized learning recommendations. Each recommendation should have: type (lesson, quiz, course, topic, or study_plan), title, description, reason (why this is recommended), priority (low, medium, high), priorityScore (0-100). Return as a JSON array.`,
            },
            {
              role: 'user',
              content: `Student data: ${JSON.stringify(studentContext)}`,
            },
          ],
          thinking: { type: 'disabled' },
        })

        const responseText = completion.choices[0]?.message?.content || '[]'

        // Parse the LLM response
        let llmRecommendations: Array<Record<string, unknown>> = []
        try {
          const jsonMatch = responseText.match(/\[[\s\S]*\]/)
          if (jsonMatch) {
            llmRecommendations = JSON.parse(jsonMatch[0])
          }
        } catch {
          console.error('Failed to parse LLM recommendations JSON')
        }

        // Save LLM recommendations
        for (const rec of llmRecommendations) {
          try {
            const saved = await db.aIRecommendation.create({
              data: {
                userId,
                type: (rec.type as string) || 'topic',
                title: (rec.title as string) || 'Recommendation',
                description: rec.description as string || null,
                reason: rec.reason as string || null,
                priority: (rec.priority as string) || 'medium',
                priorityScore: (rec.priorityScore as number) || 50,
                sourceEvent: sourceEvent || null,
                sourceData: sourceData ? JSON.stringify(sourceData) : null,
              },
            })
            savedRecommendations.push(saved)
          } catch {
            // Skip invalid recommendations
          }
        }
      } catch (llmError) {
        // LLM is optional enhancement, fall back to rule-based only
        console.warn('[ShijlAI Recommendations] LLM enhancement failed, using rule-based only:', llmError)
      }
    }

    // Log activity
    await db.studentAIActivity.create({
      data: {
        userId,
        activityType: 'recommendation_viewed',
        metadata: JSON.stringify({ count: savedRecommendations.length }),
      },
    })

    return NextResponse.json({ recommendations: savedRecommendations })
  } catch (error) {
    console.error('[ShijlAI Recommendations POST] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/ai/shijlai/recommendations
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { recommendationId, status } = body

    if (!recommendationId || !status) {
      return NextResponse.json({ error: 'recommendationId and status are required' }, { status: 400 })
    }

    const recommendation = await db.aIRecommendation.findUnique({ where: { id: recommendationId } })
    if (!recommendation) {
      return NextResponse.json({ error: 'Recommendation not found' }, { status: 404 })
    }

    const updated = await db.aIRecommendation.update({
      where: { id: recommendationId },
      data: { status },
    })

    return NextResponse.json({ recommendation: updated })
  } catch (error) {
    console.error('[ShijlAI Recommendations PATCH] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
