import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + str.length
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if locked
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return NextResponse.json(
        { error: 'Account locked. Try again later.' },
        { status: 423 }
      )
    }

    // Verify password
    if (user.passwordHash !== simpleHash(password)) {
      const attempts = (user.loginAttempts || 0) + 1
      const lockUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null
      await db.user.update({
        where: { id: user.id },
        data: { loginAttempts: attempts, lockedUntil: lockUntil },
      })
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Reset login attempts
    await db.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null, lastActiveAt: new Date() },
    })

    // Return safe user data (strip sensitive fields)
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
    }

    return NextResponse.json({
      user: safeUser,
      message: 'Login successful',
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
