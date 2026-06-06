import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes, createHash } from 'crypto'

// GET /api/admin/security/api-keys — Fetch API keys (with optional reveal)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const keyId = searchParams.get('id')

    if (keyId) {
      // Reveal a specific key (return the hashed key info — we can't reverse the hash)
      // In production, we would store the encrypted key and decrypt it
      // For now, we return the fullKey from a temporary store if it was recently created
      const apiKey = await db.apiKey.findUnique({ where: { id: keyId } })
      if (!apiKey) {
        return NextResponse.json({ error: 'API key not found' }, { status: 404 })
      }
      // We can't reveal a previously created key since we only store the hash
      // Return masked version
      return NextResponse.json({
        apiKey: {
          id: apiKey.id,
          name: apiKey.name,
          keyPrefix: apiKey.keyPrefix,
          keyLastFour: apiKey.keyLastFour,
          permission: apiKey.permission,
          isActive: apiKey.isActive,
          lastUsedAt: apiKey.lastUsedAt?.toISOString() || null,
          createdAt: apiKey.createdAt.toISOString(),
          revokedAt: apiKey.revokedAt?.toISOString() || null,
        },
      })
    }

    // List all API keys
    const apiKeys = await db.apiKey.findMany({ orderBy: { createdAt: 'desc' } })

    return NextResponse.json({
      apiKeys: apiKeys.map(k => ({
        id: k.id,
        name: k.name,
        keyPrefix: k.keyPrefix,
        keyLastFour: k.keyLastFour,
        permission: k.permission,
        isActive: k.isActive,
        lastUsedAt: k.lastUsedAt?.toISOString() || null,
        createdAt: k.createdAt.toISOString(),
        revokedAt: k.revokedAt?.toISOString() || null,
      })),
    })
  } catch (error) {
    console.error('API keys fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}

// POST /api/admin/security/api-keys — Generate a new API key
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, permission } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Key name is required' }, { status: 400 })
    }

    // Generate a new API key
    const rawKey = randomBytes(32).toString('hex')
    const fullKey = `shijlai_live_sk_${rawKey}`
    const keyHash = createHash('sha256').update(fullKey).digest('hex')
    const keyPrefix = 'shijlai_live_sk_'
    const keyLastFour = rawKey.slice(-4)

    const apiKey = await db.apiKey.create({
      data: {
        name: name.trim(),
        keyPrefix,
        keyHash,
        keyLastFour,
        permission: permission || 'full_access',
      },
    })

    // Log security event
    await db.securityEvent.create({
      data: {
        type: 'api_key_generated',
        details: JSON.stringify({ keyId: apiKey.id, keyName: name, permission }),
      },
    })

    return NextResponse.json({
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        keyLastFour: apiKey.keyLastFour,
        permission: apiKey.permission,
        isActive: apiKey.isActive,
        lastUsedAt: apiKey.lastUsedAt?.toISOString() || null,
        createdAt: apiKey.createdAt.toISOString(),
        revokedAt: apiKey.revokedAt?.toISOString() || null,
      },
      fullKey, // Return the full key only on creation
    })
  } catch (error) {
    console.error('API key generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate API key' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/security/api-keys — Revoke an API key
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Key ID is required' }, { status: 400 })
    }

    const existing = await db.apiKey.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    const apiKey = await db.apiKey.update({
      where: { id },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    })

    // Log security event
    await db.securityEvent.create({
      data: {
        type: 'api_key_revoked',
        details: JSON.stringify({ keyId: id, keyName: existing.name }),
      },
    })

    return NextResponse.json({
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        keyLastFour: apiKey.keyLastFour,
        permission: apiKey.permission,
        isActive: apiKey.isActive,
        lastUsedAt: apiKey.lastUsedAt?.toISOString() || null,
        createdAt: apiKey.createdAt.toISOString(),
        revokedAt: apiKey.revokedAt?.toISOString() || null,
      },
    })
  } catch (error) {
    console.error('API key revocation error:', error)
    return NextResponse.json(
      { error: 'Failed to revoke API key' },
      { status: 500 }
    )
  }
}
