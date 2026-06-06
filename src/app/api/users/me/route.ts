import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/users/me - Get current user by role
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || 'student'

    const user = await db.user.findFirst({
      where: { role },
      include: {
        badges: {
          include: {
            badge: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            certificates: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'No user found with this role' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      user: {
        ...user,
        badgeCount: user.badges.length,
        enrollmentCount: user._count.enrollments,
        certificateCount: user._count.certificates,
      },
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// PATCH /api/users/me - Update current user (email/password)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, email, password } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}

    if (email) {
      // Check if email is already taken
      const existing = await db.user.findFirst({
        where: { email, NOT: { id: userId } },
      })
      if (existing) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
      }
      updateData.email = email
    }

    if (password) {
      // In a real app, hash the password. For demo, store as-is.
      updateData.passwordHash = password
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const user = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        role: true,
      },
    })

    return NextResponse.json({ user, success: true })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
