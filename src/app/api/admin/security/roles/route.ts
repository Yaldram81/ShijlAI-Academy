import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/admin/security/roles — Create a new role
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, permissions } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 })
    }

    // Check for duplicate name
    const existing = await db.securityRole.findUnique({ where: { name: name.trim() } })
    if (existing) {
      return NextResponse.json({ error: 'Role name already exists' }, { status: 409 })
    }

    const role = await db.securityRole.create({
      data: {
        name: name.trim(),
        description: description || null,
        permissions: JSON.stringify(permissions || []),
      },
    })

    // Log security event
    await db.securityEvent.create({
      data: {
        type: 'role_created',
        details: JSON.stringify({ roleName: name, permissions: permissions || [] }),
      },
    })

    return NextResponse.json({ role })
  } catch (error) {
    console.error('Role creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/security/roles — Update a role
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, name, description, permissions } = body

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 })
    }

    const existing = await db.securityRole.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Check for duplicate name (if name is being changed)
    if (name && name !== existing.name) {
      const duplicate = await db.securityRole.findUnique({ where: { name } })
      if (duplicate) {
        return NextResponse.json({ error: 'Role name already exists' }, { status: 409 })
      }
    }

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name.trim()
    if (description !== undefined) data.description = description || null
    if (permissions !== undefined) data.permissions = JSON.stringify(permissions)

    const role = await db.securityRole.update({
      where: { id },
      data,
    })

    // Log security event
    await db.securityEvent.create({
      data: {
        type: 'role_updated',
        details: JSON.stringify({ roleId: id, roleName: name || existing.name, updatedFields: Object.keys(data) }),
      },
    })

    return NextResponse.json({ role })
  } catch (error) {
    console.error('Role update error:', error)
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/security/roles — Delete a role
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 })
    }

    const existing = await db.securityRole.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    if (existing.isDefault) {
      return NextResponse.json({ error: 'Cannot delete default roles' }, { status: 403 })
    }

    await db.securityRole.delete({ where: { id } })

    // Log security event
    await db.securityEvent.create({
      data: {
        type: 'role_deleted',
        details: JSON.stringify({ roleId: id, roleName: existing.name }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Role deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    )
  }
}
