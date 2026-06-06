import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { role } = body

    if (!role || !['student', 'instructor', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Valid role is required (student, instructor, admin)' },
        { status: 400 }
      )
    }

    const user = await db.user.findFirst({
      where: { role },
      include: {
        badges: { include: { badge: true } },
        _count: { select: { enrollments: true, certificates: true } },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'No demo user found for this role' },
        { status: 404 }
      )
    }

    // Update last active (non-blocking — don't fail if DB is read-only)
    try {
      await db.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() },
      })
    } catch (updateErr) {
      console.warn('Could not update lastActiveAt (read-only DB?):', updateErr)
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      bio: user.bio,
      language: user.language,
      xp: user.xp,
      level: user.level,
      shijlCoins: user.shijlCoins,
      streak: user.streak,
      longestStreak: user.longestStreak,
      lastActiveAt: user.lastActiveAt.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      isVerified: user.isVerified,
      badges: user.badges,
      badgeCount: user.badges.length,
      enrollmentCount: user._count.enrollments,
      certificateCount: user._count.certificates,
    }

    return NextResponse.json({
      user: safeUser,
      message: 'Demo login successful',
    })
  } catch (error) {
    console.error('Demo login error:', error)
    return NextResponse.json(
      { error: 'Demo login failed' },
      { status: 500 }
    )
  }
}
