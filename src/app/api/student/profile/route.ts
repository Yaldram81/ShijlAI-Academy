import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Safely parse a JSON string, returning fallback on failure */
function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

/**
 * Cumulative XP threshold for a given level.
 * Level N requires N*(N-1)*50 XP total.
 *   Level 1 → 0, Level 2 → 100, Level 3 → 300, Level 4 → 600 …
 */
function xpForLevel(level: number): number {
  if (level <= 1) return 0
  return level * (level - 1) * 50
}

/** Derive the level from total XP using the threshold formula */
function levelFromXp(totalXp: number): number {
  // Solve N*(N-1)*50 <= totalXp  →  N² - N - totalXp/25 <= 0
  // N = floor((1 + sqrt(1 + 4*totalXp/25)) / 2)
  const n = Math.floor((1 + Math.sqrt(1 + (4 * totalXp) / 25)) / 2)
  return Math.max(1, n)
}

/** Human-readable title for a level number */
function levelTitle(level: number): string {
  const titles: Record<number, string> = {
    1: 'Novice',
    2: 'Learner',
    3: 'Scholar',
    4: 'Expert',
    5: 'Master',
    6: 'Grandmaster',
    7: 'Legend',
    8: 'Champion',
    9: 'Virtuoso',
    10: 'Sage',
  }
  if (level >= 11) return 'Transcendent'
  return titles[level] ?? 'Novice'
}

/**
 * Compute profile completion percentage based on 8 key fields:
 *   name, avatar, bio, headline, location, website, linkedin, phone
 */
function profileCompletionScore(data: {
  name: string | null
  avatar: string | null
  bio: string | null
  headline: string | null
  location: string | null
  website: string | null
  linkedin: string | null
  phone: string | null
}): number {
  const fields = [
    data.name,
    data.avatar,
    data.bio,
    data.headline,
    data.location,
    data.website,
    data.linkedin,
    data.phone,
  ]
  const filled = fields.filter((v) => v !== null && v !== undefined && String(v).trim() !== '').length
  return Math.round((filled / 8) * 100)
}

/** Default student-settings fields used when no StudentSettings row exists */
const defaultStudentSettings = {
  headline: null as string | null,
  location: null as string | null,
  website: null as string | null,
  linkedin: null as string | null,
  learningGoalType: 'career' as string,
}

// ─── Shared: build the full profile response ────────────────────────────────

async function buildProfileResponse(studentId: string) {
  // 1. Personal Info + Student Settings
  const user = await db.user.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      bio: true,
      phone: true,
      language: true,
      isVerified: true,
      mfaEnabled: true,
      authProvider: true,
      createdAt: true,
      lastActiveAt: true,
      xp: true,
      level: true,
      shijlCoins: true,
      streak: true,
      longestStreak: true,
      studentSettings: {
        select: {
          headline: true,
          location: true,
          website: true,
          linkedin: true,
          learningGoalType: true,
        },
      },
    },
  })

  if (!user) return null

  const settings = user.studentSettings ?? defaultStudentSettings

  // 2. Learning Stats (parallel queries)
  const [
    totalEnrolled,
    coursesCompleted,
    coursesInProgress,
    totalTimeSpentResult,
    quizAggregate,
    quizzesPassed,
    submissionsSubmitted,
    submissionsGraded,
  ] = await Promise.all([
    // Total courses enrolled
    db.enrollment.count({ where: { userId: studentId } }),
    // Courses completed
    db.enrollment.count({ where: { userId: studentId, status: 'completed' } }),
    // Courses in progress
    db.enrollment.count({ where: { userId: studentId, status: 'active' } }),
    // Total learning time (sum of LessonProgress.timeSpent)
    db.lessonProgress.aggregate({
      _sum: { timeSpent: true },
      where: { enrollment: { userId: studentId } },
    }),
    // Average quiz score + total quiz attempts
    db.quizAttempt.aggregate({
      where: { userId: studentId },
      _avg: { percentage: true },
      _count: true,
    }),
    // Quizzes passed
    db.quizAttempt.count({ where: { userId: studentId, passed: true } }),
    // Assignments submitted
    db.submission.count({ where: { studentId } }),
    // Assignments graded
    db.submission.count({ where: { studentId, status: { in: ['graded', 'returned'] } } }),
  ])

  // 3. XP & Gamification
  const currentLevel = levelFromXp(user.xp)
  const currentLevelXpThreshold = xpForLevel(currentLevel)
  const nextLevelXpThreshold = xpForLevel(currentLevel + 1)
  const xpIntoCurrentLevel = user.xp - currentLevelXpThreshold
  const xpNeededForNextLevel = nextLevelXpThreshold - currentLevelXpThreshold
  const xpProgressPercent = xpNeededForNextLevel > 0
    ? Math.round((xpIntoCurrentLevel / xpNeededForNextLevel) * 100)
    : 100

  // Leaderboard rank: count users with more XP + 1
  const usersWithMoreXp = await db.user.count({
    where: { xp: { gt: user.xp }, role: 'student' },
  })
  const leaderboardRank = usersWithMoreXp + 1

  // 4. Skills
  const userSkills = await db.userSkill.findMany({
    where: { userId: studentId },
    select: {
      level: true,
      overallScore: true,
      skill: {
        select: { name: true, category: true },
      },
    },
  })

  // 5. Badges
  const userBadges = await db.userBadge.findMany({
    where: { userId: studentId },
    select: {
      earnedAt: true,
      badge: {
        select: {
          name: true,
          icon: true,
          description: true,
          category: true,
        },
      },
    },
    orderBy: { earnedAt: 'desc' },
  })

  // 6. Certificates (latest 5)
  const certificates = await db.certificate.findMany({
    where: { userId: studentId },
    select: {
      id: true,
      courseId: true,
      courseTitle: true,
      score: true,
      issuedAt: true,
      certificateId: true,
      templateType: true,
    },
    orderBy: { issuedAt: 'desc' },
    take: 5,
  })

  // 7. Learning Goals (active only)
  const learningGoals = await db.learningGoal.findMany({
    where: { userId: studentId, status: 'active' },
    select: {
      id: true,
      type: true,
      title: true,
      target: true,
      current: true,
      unit: true,
      period: true,
      startDate: true,
      endDate: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // 8. Recent Activity (latest 10 XpActivity)
  const recentActivity = await db.xpActivity.findMany({
    where: { userId: studentId },
    select: {
      id: true,
      action: true,
      xpAmount: true,
      coinAmount: true,
      description: true,
      metadata: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  // Parse metadata JSON on recent activity
  const parsedActivity = recentActivity.map((a) => ({
    ...a,
    metadata: safeJsonParse<Record<string, unknown>>(a.metadata, {}),
  }))

  // 9. Profile Completion Score
  const completionScore = profileCompletionScore({
    name: user.name,
    avatar: user.avatar,
    bio: user.bio,
    headline: settings.headline,
    location: settings.location,
    website: settings.website,
    linkedin: settings.linkedin,
    phone: user.phone,
  })

  // Compose response (remove studentSettings from user object)
  const { studentSettings: _ss, ...personalInfo } = user

  return {
    personalInfo,
    settings: {
      headline: settings.headline,
      location: settings.location,
      website: settings.website,
      linkedin: settings.linkedin,
      learningGoalType: settings.learningGoalType,
    },
    learningStats: {
      totalCoursesEnrolled: totalEnrolled,
      coursesCompleted,
      coursesInProgress,
      totalLearningTimeSeconds: totalTimeSpentResult._sum.timeSpent ?? 0,
      averageQuizScore: quizAggregate._avg.percentage
        ? Math.round(quizAggregate._avg.percentage * 100) / 100
        : 0,
      quizzesPassed,
      quizzesTotal: quizAggregate._count,
      assignmentsSubmitted: submissionsSubmitted,
      assignmentsGraded: submissionsGraded,
    },
    gamification: {
      xp: user.xp,
      level: currentLevel,
      shijlCoins: user.shijlCoins,
      streak: user.streak,
      longestStreak: user.longestStreak,
      xpProgress: {
        currentLevelXp: xpIntoCurrentLevel,
        xpNeededForNextLevel,
        progressPercent: xpProgressPercent,
        currentLevelThreshold: currentLevelXpThreshold,
        nextLevelThreshold: nextLevelXpThreshold,
      },
      leaderboardRank,
      levelTitle: levelTitle(currentLevel),
    },
    skills: userSkills.map((us) => ({
      name: us.skill.name,
      category: us.skill.category,
      level: us.level,
      progress: us.overallScore,
    })),
    badges: userBadges.map((ub) => ({
      name: ub.badge.name,
      icon: ub.badge.icon,
      description: ub.badge.description,
      category: ub.badge.category,
      earnedAt: ub.earnedAt,
    })),
    certificates,
    learningGoals,
    recentActivity: parsedActivity,
    profileCompletionScore: completionScore,
  }
}

// ─── GET /api/student/profile?studentId=xxx ─────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    // Verify user exists and is a student
    const user = await db.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (user.role !== 'student') {
      return NextResponse.json({ error: 'User is not a student' }, { status: 403 })
    }

    const profile = await buildProfileResponse(studentId)

    if (!profile) {
      return NextResponse.json({ error: 'Failed to build profile' }, { status: 500 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching student profile:', error)
    return NextResponse.json({ error: 'Failed to fetch student profile' }, { status: 500 })
  }
}

// ─── PATCH /api/student/profile ─────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, name, bio, phone, headline, location, website, linkedin } = body

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    // Verify user exists and is a student
    const user = await db.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (user.role !== 'student') {
      return NextResponse.json({ error: 'User is not a student' }, { status: 403 })
    }

    // Validate URL fields
    if (website !== undefined && website !== null && website !== '') {
      try {
        new URL(website)
      } catch {
        return NextResponse.json({ error: 'Invalid website URL' }, { status: 400 })
      }
    }
    if (linkedin !== undefined && linkedin !== null && linkedin !== '') {
      try {
        new URL(linkedin)
      } catch {
        return NextResponse.json({ error: 'Invalid LinkedIn URL' }, { status: 400 })
      }
    }

    // --- Update User fields ---
    const userUpdateData: Record<string, unknown> = {}
    if (name !== undefined) userUpdateData.name = name
    if (bio !== undefined) userUpdateData.bio = bio
    if (phone !== undefined) userUpdateData.phone = phone
    // Update lastActiveAt on any profile change
    userUpdateData.lastActiveAt = new Date()

    if (Object.keys(userUpdateData).length > 1) {
      // more than just lastActiveAt
      await db.user.update({
        where: { id: studentId },
        data: userUpdateData,
      })
    }

    // --- Upsert StudentSettings fields ---
    const hasSettingsFields = [headline, location, website, linkedin].some(
      (v) => v !== undefined
    )

    if (hasSettingsFields) {
      const settingsUpdate: Record<string, unknown> = {}
      if (headline !== undefined) settingsUpdate.headline = headline
      if (location !== undefined) settingsUpdate.location = location
      if (website !== undefined) settingsUpdate.website = website
      if (linkedin !== undefined) settingsUpdate.linkedin = linkedin

      const settingsCreate: Record<string, unknown> = {
        studentId,
        headline: headline ?? null,
        location: location ?? null,
        website: website ?? null,
        linkedin: linkedin ?? null,
      }

      await db.studentSettings.upsert({
        where: { studentId },
        update: settingsUpdate as Parameters<typeof db.studentSettings.upsert>[0]['update'],
        create: settingsCreate as Parameters<typeof db.studentSettings.upsert>[0]['create'],
      })
    }

    // Return updated profile (same shape as GET)
    const profile = await buildProfileResponse(studentId)

    if (!profile) {
      return NextResponse.json({ error: 'Failed to build updated profile' }, { status: 500 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error updating student profile:', error)
    return NextResponse.json({ error: 'Failed to update student profile' }, { status: 500 })
  }
}

// ─── POST /api/student/profile — Upload avatar ──────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, avatar } = body

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    if (!avatar) {
      return NextResponse.json({ error: 'Avatar data is required' }, { status: 400 })
    }

    // Validate it's a base64 data URL
    if (typeof avatar !== 'string' || !avatar.startsWith('data:')) {
      return NextResponse.json(
        { error: 'Invalid avatar format — must be a base64 data URL' },
        { status: 400 }
      )
    }

    // Verify user exists and is a student
    const user = await db.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (user.role !== 'student') {
      return NextResponse.json({ error: 'User is not a student' }, { status: 403 })
    }

    // Save avatar and update lastActiveAt
    const updated = await db.user.update({
      where: { id: studentId },
      data: {
        avatar,
        lastActiveAt: new Date(),
      },
      select: { id: true, avatar: true },
    })

    return NextResponse.json({ success: true, avatar: updated.avatar })
  } catch (error) {
    console.error('Error uploading avatar:', error)
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 })
  }
}

// ─── DELETE /api/student/profile — Remove avatar ────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId } = body

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    // Verify user exists and is a student
    const user = await db.user.findUnique({
      where: { id: studentId },
      select: { id: true, role: true, avatar: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (user.role !== 'student') {
      return NextResponse.json({ error: 'User is not a student' }, { status: 403 })
    }

    if (!user.avatar) {
      return NextResponse.json({ error: 'No avatar to remove' }, { status: 400 })
    }

    await db.user.update({
      where: { id: studentId },
      data: { avatar: null },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing avatar:', error)
    return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 })
  }
}
