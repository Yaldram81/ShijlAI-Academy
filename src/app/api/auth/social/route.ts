import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { provider, name, email, avatar } = body

    if (!provider || !name || !email) {
      return NextResponse.json(
        { error: 'Provider, name, and email are required' },
        { status: 400 }
      )
    }

    if (!['google', 'facebook', 'apple'].includes(provider)) {
      return NextResponse.json(
        { error: 'Provider must be google, facebook, or apple' },
        { status: 400 }
      )
    }

    // Check if user exists with that email
    const existingUser = await db.user.findUnique({ where: { email } })

    if (existingUser) {
      // Log them in — update last active and avatar if provided
      const updatedUser = await db.user.update({
        where: { id: existingUser.id },
        data: {
          lastActiveAt: new Date(),
          authProvider: provider,
          ...(avatar ? { avatar } : {}),
        },
      })

      const {
        passwordHash: _ph,
        otpCode: _oc,
        otpExpiresAt: _oe,
        resetToken: _rt,
        resetTokenExpiresAt: _rte,
        mfaSecret: _ms,
        ...safeUser
      } = updatedUser

      return NextResponse.json({
        user: safeUser,
        isNewUser: false,
        message: 'Login successful',
      })
    }

    // Create new account
    const newUser = await db.user.create({
      data: {
        name,
        email,
        role: 'student',
        avatar: avatar || null,
        authProvider: provider,
        isVerified: true, // Social auth users are considered verified
      },
    })

    const {
      passwordHash: _ph,
      otpCode: _oc,
      otpExpiresAt: _oe,
      resetToken: _rt,
      resetTokenExpiresAt: _rte,
      mfaSecret: _ms,
      ...safeUser
    } = newUser

    return NextResponse.json(
      {
        user: safeUser,
        isNewUser: true,
        message: 'Account created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Social auth error:', error)
    return NextResponse.json(
      { error: 'Social authentication failed' },
      { status: 500 }
    )
  }
}
