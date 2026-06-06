import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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
      // For security, don't reveal whether email exists
      return NextResponse.json({
        message: 'If an account with that email exists, a reset token has been generated.',
      })
    }

    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    const resetTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 min

    await db.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiresAt },
    })

    return NextResponse.json({
      message: 'If an account with that email exists, a reset token has been generated.',
      resetToken, // In demo, return token so user can use it
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
