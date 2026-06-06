import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Auto-generate today's challenges if they don't exist
async function ensureDailyChallenges() {
  const today = new Date().toISOString().split('T')[0]
  const existing = await db.dailyChallenge.findMany({ where: { date: today } })

  if (existing.length > 0) return existing

  const challenges = await Promise.all([
    db.dailyChallenge.create({
      data: {
        title: 'Lesson Sprint',
        description: 'Complete 2 lessons today to earn bonus XP',
        type: 'lesson',
        target: 2,
        unit: 'lessons',
        xpReward: 25,
        coinReward: 10,
        icon: '📖',
        difficulty: 'easy',
        date: today,
      },
    }),
    db.dailyChallenge.create({
      data: {
        title: 'XP Hunter',
        description: 'Earn 100 XP today through any activity',
        type: 'xp',
        target: 100,
        unit: 'xp',
        xpReward: 50,
        coinReward: 25,
        icon: '⚡',
        difficulty: 'medium',
        date: today,
      },
    }),
    db.dailyChallenge.create({
      data: {
        title: 'Deep Focus',
        description: 'Study for at least 30 minutes today',
        type: 'time',
        target: 30,
        unit: 'minutes',
        xpReward: 75,
        coinReward: 40,
        icon: '🧠',
        difficulty: 'hard',
        date: today,
      },
    }),
  ])

  return challenges
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const challenges = await ensureDailyChallenges()
    const today = new Date().toISOString().split('T')[0]

    // Get user's progress on today's challenges
    const userChallenges = await db.userChallenge.findMany({
      where: {
        userId,
        challenge: { date: today },
      },
      include: { challenge: true },
    })

    // Create UserChallenge entries for any missing ones
    const existingChallengeIds = userChallenges.map(uc => uc.challengeId)
    const missingChallenges = challenges.filter(c => !existingChallengeIds.includes(c.id))

    if (missingChallenges.length > 0) {
      // Get today's activity for progress calculation
      const todayActivity = await db.dailyActivity.findUnique({
        where: { userId_date: { userId, date: today } },
      })

      const lessonsCompleted = todayActivity?.lessonsCompleted || 0
      const xpEarned = todayActivity?.xpEarned || 0
      const timeSpentMinutes = Math.round((todayActivity?.timeSpent || 0) / 60)

      const newUserChallenges = await Promise.all(
        missingChallenges.map(challenge => {
          let progress = 0
          if (challenge.type === 'lesson') progress = Math.min(lessonsCompleted, challenge.target)
          else if (challenge.type === 'xp') progress = Math.min(xpEarned, challenge.target)
          else if (challenge.type === 'time') progress = Math.min(timeSpentMinutes, challenge.target)

          return db.userChallenge.create({
            data: {
              userId,
              challengeId: challenge.id,
              progress,
              completed: progress >= challenge.target,
              completedAt: progress >= challenge.target ? new Date() : null,
            },
          })
        })
      )

      // Re-fetch all user challenges
      const allUserChallenges = await db.userChallenge.findMany({
        where: {
          userId,
          challenge: { date: today },
        },
        include: { challenge: true },
      })

      const result = challenges.map(challenge => {
        const uc = allUserChallenges.find(u => u.challengeId === challenge.id)
        return {
          ...challenge,
          userProgress: uc ? { id: uc.id, progress: uc.progress, completed: uc.completed, completedAt: uc.completedAt } : null,
        }
      })

      return NextResponse.json({ challenges: result })
    }

    const result = challenges.map(challenge => {
      const uc = userChallenges.find(u => u.challengeId === challenge.id)
      return {
        ...challenge,
        userProgress: uc ? { id: uc.id, progress: uc.progress, completed: uc.completed, completedAt: uc.completedAt } : null,
      }
    })

    return NextResponse.json({ challenges: result })
  } catch (error) {
    console.error('Error fetching challenges:', error)
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, challengeId } = body

    if (!userId || !challengeId) {
      return NextResponse.json({ error: 'userId and challengeId are required' }, { status: 400 })
    }

    const userChallenge = await db.userChallenge.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
      include: { challenge: true },
    })

    if (!userChallenge) {
      return NextResponse.json({ error: 'Challenge not found for user' }, { status: 404 })
    }

    if (!userChallenge.completed) {
      return NextResponse.json({ error: 'Challenge not yet completed' }, { status: 400 })
    }

    if (userChallenge.completedAt) {
      return NextResponse.json({ error: 'Reward already claimed' }, { status: 400 })
    }

    // Award rewards
    await db.user.update({
      where: { id: userId },
      data: {
        xp: { increment: userChallenge.challenge.xpReward },
        shijlCoins: { increment: userChallenge.challenge.coinReward },
      },
    })

    // Log XP activity
    await db.xpActivity.create({
      data: {
        userId,
        action: 'challenge_reward',
        xpAmount: userChallenge.challenge.xpReward,
        coinAmount: userChallenge.challenge.coinReward,
        description: `Completed daily challenge: ${userChallenge.challenge.title}`,
        metadata: JSON.stringify({ challengeId }),
      },
    })

    // Update daily activity
    const today = new Date().toISOString().split('T')[0]
    await db.dailyActivity.upsert({
      where: { userId_date: { userId, date: today } },
      create: { userId, date: today, xpEarned: userChallenge.challenge.xpReward },
      update: { xpEarned: { increment: userChallenge.challenge.xpReward } },
    })

    return NextResponse.json({ success: true, xpReward: userChallenge.challenge.xpReward, coinReward: userChallenge.challenge.coinReward })
  } catch (error) {
    console.error('Error claiming challenge reward:', error)
    return NextResponse.json({ error: 'Failed to claim reward' }, { status: 500 })
  }
}
