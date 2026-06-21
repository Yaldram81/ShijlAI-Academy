import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/instructor/settings/avatar - Upload avatar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, avatarData } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    if (!avatarData) {
      return NextResponse.json({ error: 'Avatar data is required' }, { status: 400 })
    }

    // Validate it's a data URL
    if (typeof avatarData !== 'string' || !avatarData.startsWith('data:')) {
      return NextResponse.json({ error: 'Invalid avatar data format' }, { status: 400 })
    }

    // In production, upload to S3/CDN. For now, store the data URL directly.
    const user = await db.user.update({
      where: { id: userId },
      data: { avatar: avatarData },
      select: { id: true, avatar: true },
    })

    return NextResponse.json({ success: true, avatar: user.avatar })
  } catch (error) {
    console.error('Error uploading avatar:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to upload avatar' }, { status: 500 })
  }
}

// DELETE /api/instructor/settings/avatar - Remove avatar
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { avatar: null },
      select: { id: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing avatar:', error)
    return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 })
  }
}
