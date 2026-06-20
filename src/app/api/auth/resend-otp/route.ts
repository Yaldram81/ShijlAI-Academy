import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail, resendOtpEmail } from '@/lib/email'
import crypto from 'crypto'

/** Generates a cryptographically secure 6-digit OTP. */
function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString()
}

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

    if (!user) {
      // Security: don't reveal whether email exists — return same response
      return NextResponse.json({
        message: 'If an unverified account with that email exists, a new code has been sent.',
      })
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: 'This account is already verified. Please log in.' },
        { status: 400 }
      )
    }

    // Rate limit: reject if a code was sent within the last 60 seconds
    if (user.otpExpiresAt) {
      const otpCreatedApprox = new Date(user.otpExpiresAt).getTime() - 10 * 60 * 1000
      const secondsSinceLastOtp = (Date.now() - otpCreatedApprox) / 1000
      if (secondsSinceLastOtp < 60) {
        const waitSeconds = Math.ceil(60 - secondsSinceLastOtp)
        return NextResponse.json(
          { error: `Please wait ${waitSeconds} seconds before requesting a new code.` },
          { status: 429 }
        )
      }
    }

    // Generate a new cryptographically secure OTP
    const otpCode = generateOTP()
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await db.user.update({
      where: { id: user.id },
      data: { otpCode, otpExpiresAt },
    })

    // Send the new OTP email
    sendEmail(resendOtpEmail({ fullName: user.name, email, otpCode })).catch((err) => {
      console.error('[resend-otp] Failed to send email:', err instanceof Error ? err.message : 'Unknown')
    })

    return NextResponse.json({
      message: 'If an unverified account with that email exists, a new code has been sent.',
    })
  } catch (error) {
    console.error('[resend-otp] Error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Failed to resend verification code' },
      { status: 500 }
    )
  }
}
