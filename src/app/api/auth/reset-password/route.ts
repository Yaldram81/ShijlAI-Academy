import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail, passwordChangedEmail } from '@/lib/email'

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      )
    }

    // Enforce minimum password length (8 chars per security guidelines)
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Find user with matching, non-expired reset token
    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiresAt: { gt: new Date() },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token. Please request a new password reset link.' },
        { status: 401 }
      )
    }

    // Update password and clear the reset token
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: simpleHash(newPassword),
        resetToken: null,
        resetTokenExpiresAt: null,
        loginAttempts: 0,
        lockedUntil: null,
      },
    })

    // Send password-changed confirmation email (fire-and-forget)
    sendEmail(passwordChangedEmail({ fullName: user.name, email: user.email })).catch((err) => {
      console.error('[reset-password] Failed to send confirmation email:', err instanceof Error ? err.message : 'Unknown')
    })

    return NextResponse.json({
      message: 'Password reset successfully. You can now log in with your new password.',
    })
  } catch (error) {
    console.error('[reset-password] Error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Password reset failed' },
      { status: 500 }
    )
  }
}
