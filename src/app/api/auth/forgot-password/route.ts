import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail, resetPasswordEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { email } })

    // Security: always return the same response regardless of whether email exists
    // This prevents user enumeration attacks
    if (!user) {
      return NextResponse.json({
        message: 'If an account with that email exists, a password reset link has been sent.',
      })
    }

    // Generate a cryptographically secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    await db.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiresAt },
    })

    // Build the reset link with the token
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const resetLink = `${appUrl}?view=reset-password&token=${resetToken}`

    // Send password reset email (fire-and-forget)
    sendEmail(resetPasswordEmail({ fullName: user.name, email: user.email, resetLink })).catch((err) => {
      console.error('[forgot-password] Failed to send reset email:', err instanceof Error ? err.message : 'Unknown')
    })

    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
      // NOTE: resetToken intentionally NOT returned in response for security.
      // Users receive it via email only.
    })
  } catch (error) {
    console.error('[forgot-password] Error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
