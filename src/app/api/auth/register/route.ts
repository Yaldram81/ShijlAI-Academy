import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail, verificationOtpEmail } from '@/lib/email'
import crypto from 'crypto'

// TODO(security): Replace simpleHash with bcrypt or argon2 in production.
// This is a weak hash only suitable for demonstration purposes.
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + str.length
}

/** Generates a cryptographically secure 6-digit OTP. */
function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, role } = body

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      )
    }

    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Password strength: minimum 8 characters
    // TODO(security): Use a library like zxcvbn for strength validation in production.
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Generate cryptographically secure OTP
    const otpCode = generateOTP()
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Create user
    const user = await db.user.create({
      data: {
        email,
        name,
        role: role || 'student',
        passwordHash: simpleHash(password),
        otpCode,
        otpExpiresAt,
        isVerified: false,
        authProvider: 'email',
      },
    })

    // Send verification OTP email (fire-and-forget, non-blocking)
    sendEmail(verificationOtpEmail({ fullName: name, email, otpCode })).catch((err) => {
      console.error('[register] Failed to send verification email:', err instanceof Error ? err.message : 'Unknown')
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
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
      },
      // NOTE: otpCode intentionally NOT returned in response for security.
      // Users receive it via email only.
      message: 'Account created. Please check your email to verify your account.',
    })
  } catch (error) {
    console.error('[register] Error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
