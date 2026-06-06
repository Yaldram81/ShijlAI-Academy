import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/settings/account — Get account details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    // Verify user exists and has instructor role
    const user = await db.user.findUnique({
      where: { id: instructorId },
      select: {
        id: true,
        email: true,
        phone: true,
        mfaEnabled: true,
        status: true,
        authProvider: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        lastLoginIp: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.role !== 'instructor' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied: not an instructor' }, { status: 403 })
    }

    // Get account status from instructor settings
    const settings = await db.instructorSettings.findUnique({
      where: { instructorId },
      select: {
        deactivatedAt: true,
        deletionRequestedAt: true,
      },
    })

    // Count active sessions
    const activeSessionsCount = await db.userSession.count({
      where: { userId: instructorId, isActive: true },
    })

    return NextResponse.json({
      account: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        mfaEnabled: user.mfaEnabled,
        status: user.status,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        lastLoginIp: user.lastLoginIp,
        deactivatedAt: settings?.deactivatedAt || null,
        deletionRequestedAt: settings?.deletionRequestedAt || null,
        activeSessionsCount,
      },
    })
  } catch (error) {
    console.error('Error fetching account details:', error)
    return NextResponse.json({ error: 'Failed to fetch account details' }, { status: 500 })
  }
}

// POST /api/instructor/settings/account — Handle account actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { instructorId, action, phone, enable2FA, currentPassword, newPassword } = body

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    // Verify user exists and has instructor role
    const user = await db.user.findUnique({
      where: { id: instructorId },
      select: { id: true, role: true, status: true, passwordHash: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (user.role !== 'instructor' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied: not an instructor' }, { status: 403 })
    }

    // Handle password change (requires currentPassword verification)
    if (newPassword !== undefined && !action) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required to change password' }, { status: 400 })
      }
      // Verify current password
      if (user.passwordHash && user.passwordHash !== currentPassword) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
      }
      if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
      }
      // In a real app, hash the password. For demo, store as-is.
      await db.user.update({
        where: { id: instructorId },
        data: { passwordHash: newPassword },
      })
      return NextResponse.json({ message: 'Password changed successfully' })
    }

    // Handle update phone
    if (phone !== undefined && !action) {
      if (typeof phone !== 'string') {
        return NextResponse.json({ error: 'Phone must be a string' }, { status: 400 })
      }

      await db.user.update({
        where: { id: instructorId },
        data: { phone: phone || null },
      })

      return NextResponse.json({
        message: 'Phone number updated successfully',
        phone: phone || null,
      })
    }

    // Handle toggle 2FA
    if (enable2FA !== undefined && !action) {
      if (typeof enable2FA !== 'boolean') {
        return NextResponse.json({ error: 'enable2FA must be a boolean' }, { status: 400 })
      }

      await db.user.update({
        where: { id: instructorId },
        data: { mfaEnabled: enable2FA },
      })

      return NextResponse.json({
        message: enable2FA ? '2FA enabled successfully' : '2FA disabled successfully',
        mfaEnabled: enable2FA,
      })
    }

    // Handle account actions
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required (deactivate, delete, or reactivate)' },
        { status: 400 }
      )
    }

    // Ensure instructor settings exist
    const settings = await db.instructorSettings.findUnique({
      where: { instructorId },
    })

    switch (action) {
      case 'deactivate': {
        // Check if already deactivated
        if (settings?.deactivatedAt) {
          return NextResponse.json({ error: 'Account is already deactivated' }, { status: 400 })
        }

        // Set deactivatedAt timestamp
        if (settings) {
          await db.instructorSettings.update({
            where: { instructorId },
            data: { deactivatedAt: new Date() },
          })
        } else {
          await db.instructorSettings.create({
            data: {
              instructorId,
              deactivatedAt: new Date(),
            },
          })
        }

        // Also mark user status
        await db.user.update({
          where: { id: instructorId },
          data: { status: 'suspended' },
        })

        // Revoke all active sessions
        await db.userSession.updateMany({
          where: { userId: instructorId, isActive: true },
          data: { isActive: false },
        })

        return NextResponse.json({
          message: 'Account deactivated successfully',
          deactivatedAt: new Date(),
        })
      }

      case 'delete': {
        // Mark deletion request (don't actually delete - allow grace period)
        if (settings) {
          await db.instructorSettings.update({
            where: { instructorId },
            data: { deletionRequestedAt: new Date() },
          })
        } else {
          await db.instructorSettings.create({
            data: {
              instructorId,
              deletionRequestedAt: new Date(),
            },
          })
        }

        return NextResponse.json({
          message: 'Account deletion requested. Your account will be permanently deleted after 30 days.',
          deletionRequestedAt: new Date(),
        })
      }

      case 'reactivate': {
        // Check if deactivated
        if (!settings?.deactivatedAt) {
          return NextResponse.json({ error: 'Account is not deactivated' }, { status: 400 })
        }

        // Clear deactivatedAt
        await db.instructorSettings.update({
          where: { instructorId },
          data: {
            deactivatedAt: null,
            deletionRequestedAt: null,
          },
        })

        // Restore user status
        await db.user.update({
          where: { id: instructorId },
          data: { status: 'active' },
        })

        return NextResponse.json({
          message: 'Account reactivated successfully',
        })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Must be deactivate, delete, or reactivate` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error handling account action:', error)
    return NextResponse.json({ error: 'Failed to process account action' }, { status: 500 })
  }
}
