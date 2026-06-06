import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getOrCreateProfile, updateStudentProfile } from '@/services/learning-engine'

// GET /api/ai/shijlai/profile?userId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Use the profile service which includes computed scores and topic masteries
    const profile = await getOrCreateProfile(userId)

    // Also get topic masteries for this student
    const topicMasteries = await db.topicMastery.findMany({
      where: { userId },
      orderBy: { masteryScore: 'asc' },
    })

    return NextResponse.json({
      profile: {
        ...profile,
        // Ensure new fields are explicitly included in response
        consistencyScore: profile.consistencyScore,
        learningSpeedScore: profile.learningSpeedScore,
        dropRiskScore: profile.dropRiskScore,
        lastComputedAt: profile.lastComputedAt,
      },
      topicMasteries,
    })
  } catch (error) {
    console.error('[ShijlAI Profile GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/ai/shijlai/profile
// Supports: action=compute to trigger feature engine, or action=event for legacy event-based update
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, action, event, eventData } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    if (action === 'compute') {
      // Trigger feature engine computation and profile update
      const profile = await updateStudentProfile(userId)

      // Get topic masteries
      const topicMasteries = await db.topicMastery.findMany({
        where: { userId },
        orderBy: { masteryScore: 'asc' },
      })

      return NextResponse.json({
        profile,
        topicMasteries,
        computed: true,
      })
    }

    // Legacy behavior: event-based profile update
    if (!event) {
      return NextResponse.json({ error: 'event or action=compute is required' }, { status: 400 })
    }

    // Recalculate metrics based on latest data
    const profile = await updateStudentProfile(userId)

    return NextResponse.json({ profile, updated: true })
  } catch (error) {
    console.error('[ShijlAI Profile POST] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
