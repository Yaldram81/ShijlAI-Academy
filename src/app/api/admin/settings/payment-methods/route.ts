import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ── GET /api/admin/settings/payment-methods — List all payment methods ──

export async function GET() {
  try {
    const paymentMethods = await db.paymentMethodConfig.findMany({
      orderBy: { order: 'asc' },
    })
    return NextResponse.json({ paymentMethods })
  } catch (error) {
    console.error('Payment methods fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    )
  }
}

// ── POST /api/admin/settings/payment-methods — Create a payment method ──

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, displayName, isConnected, isActive, config, icon, order } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Payment method name is required' },
        { status: 400 }
      )
    }

    if (!displayName || !displayName.trim()) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      )
    }

    // Check for duplicate name
    const existing = await db.paymentMethodConfig.findUnique({
      where: { name: name.trim() },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Payment method with this name already exists' },
        { status: 409 }
      )
    }

    const paymentMethod = await db.paymentMethodConfig.create({
      data: {
        name: name.trim(),
        displayName: displayName.trim(),
        isConnected: isConnected ?? false,
        isActive: isActive ?? true,
        config: config ? (typeof config === 'string' ? config : JSON.stringify(config)) : null,
        icon: icon || null,
        order: order ?? 0,
      },
    })

    // Log the activity
    await db.activityLog.create({
      data: {
        type: 'settings_updated',
        title: 'Payment method added',
        description: `Added payment method: ${displayName}`,
        icon: '💳',
        metadata: JSON.stringify({ name, action: 'create' }),
      },
    })

    return NextResponse.json({ paymentMethod }, { status: 201 })
  } catch (error) {
    console.error('Payment method creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment method' },
      { status: 500 }
    )
  }
}

// ── PUT /api/admin/settings/payment-methods — Update a payment method ──

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, name, displayName, isConnected, isActive, config, icon, order } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      )
    }

    const existing = await db.paymentMethodConfig.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      )
    }

    // Check for duplicate name if name is being changed
    if (name && name !== existing.name) {
      const duplicate = await db.paymentMethodConfig.findUnique({
        where: { name },
      })
      if (duplicate) {
        return NextResponse.json(
          { error: 'Payment method with this name already exists' },
          { status: 409 }
        )
      }
    }

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name.trim()
    if (displayName !== undefined) data.displayName = displayName.trim()
    if (isConnected !== undefined) data.isConnected = isConnected
    if (isActive !== undefined) data.isActive = isActive
    if (config !== undefined) {
      data.config = typeof config === 'string' ? config : JSON.stringify(config)
    }
    if (icon !== undefined) data.icon = icon
    if (order !== undefined) data.order = order

    const paymentMethod = await db.paymentMethodConfig.update({
      where: { id },
      data,
    })

    // Log the activity
    await db.activityLog.create({
      data: {
        type: 'settings_updated',
        title: 'Payment method updated',
        description: `Updated payment method: ${paymentMethod.displayName}`,
        icon: '💳',
        metadata: JSON.stringify({ id, updatedFields: Object.keys(data) }),
      },
    })

    return NextResponse.json({ paymentMethod })
  } catch (error) {
    console.error('Payment method update error:', error)
    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    )
  }
}

// ── DELETE /api/admin/settings/payment-methods — Delete a payment method ──

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Payment method ID is required' },
        { status: 400 }
      )
    }

    const existing = await db.paymentMethodConfig.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      )
    }

    await db.paymentMethodConfig.delete({ where: { id } })

    // Log the activity
    await db.activityLog.create({
      data: {
        type: 'settings_updated',
        title: 'Payment method removed',
        description: `Removed payment method: ${existing.displayName}`,
        icon: '💳',
        metadata: JSON.stringify({ name: existing.name, action: 'delete' }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Payment method deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete payment method' },
      { status: 500 }
    )
  }
}
