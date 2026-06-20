import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail, welcomeEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, otpCode } = body

    if (!email || !otpCode) {
      return NextResponse.json(
        { error: 'Email and OTP code are required' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: 'Account already verified' },
        { status: 400 }
      )
    }

    // Check OTP expiry first (don't leak timing info about OTP value)
    if (!user.otpExpiresAt || new Date(user.otpExpiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'OTP code has expired. Please request a new one.' },
        { status: 401 }
      )
    }

    // Check OTP match
    if (user.otpCode !== otpCode) {
      return NextResponse.json(
        { error: 'Invalid OTP code' },
        { status: 401 }
      )
    }

    // Verify user and clear OTP
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpiresAt: null,
      },
    })

    // Send welcome email (fire-and-forget)
    sendEmail(welcomeEmail({ fullName: updatedUser.name, email: updatedUser.email, role: updatedUser.role })).catch((err) => {
      console.error('[verify-otp] Failed to send welcome email:', err instanceof Error ? err.message : 'Unknown')
    })

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified,
      },
      message: 'Email verified successfully',
    })
  } catch (error) {
    console.error('[verify-otp] Error:', error instanceof Error ? error.message : 'Unknown')
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    )
  }
}
