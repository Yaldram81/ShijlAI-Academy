import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/admin/security/blocked-ips — Block an IP address
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { ip, reason, expiresAt } = body

    if (!ip || !ip.trim()) {
      return NextResponse.json({ error: 'IP address is required' }, { status: 400 })
    }

    // Check if IP is already blocked (and not expired)
    const existing = await db.blockedIp.findFirst({
      where: {
        ip: ip.trim(),
        OR: [
          { expiresAt: null }, // permanent
          { expiresAt: { gte: new Date() } }, // not yet expired
        ],
      },
    })

    if (existing) {
      return NextResponse.json({ error: 'IP is already blocked' }, { status: 409 })
    }

    const blockedIp = await db.blockedIp.create({
      data: {
        ip: ip.trim(),
        reason: reason || 'No reason provided',
        blockedBy: null, // would be admin userId in production
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    // Log security event
    await db.securityEvent.create({
      data: {
        type: 'ip_blocked',
        details: JSON.stringify({ ip: ip.trim(), reason, expiresAt }),
      },
    })

    return NextResponse.json({
      blockedIp: {
        id: blockedIp.id,
        ip: blockedIp.ip,
        reason: blockedIp.reason,
        blockedBy: blockedIp.blockedBy,
        expiresAt: blockedIp.expiresAt?.toISOString() || null,
        createdAt: blockedIp.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('IP block error:', error)
    return NextResponse.json(
      { error: 'Failed to block IP' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/security/blocked-ips — Unblock an IP address
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Block ID is required' }, { status: 400 })
    }

    const existing = await db.blockedIp.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Blocked IP not found' }, { status: 404 })
    }

    await db.blockedIp.delete({ where: { id } })

    // Log security event
    await db.securityEvent.create({
      data: {
        type: 'ip_unblocked',
        details: JSON.stringify({ ip: existing.ip, blockId: id }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('IP unblock error:', error)
    return NextResponse.json(
      { error: 'Failed to unblock IP' },
      { status: 500 }
    )
  }
}
