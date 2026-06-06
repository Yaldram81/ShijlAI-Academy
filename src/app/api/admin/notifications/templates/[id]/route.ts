import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function safeJsonParse(str: string | null | undefined, fallback: unknown = null) {
  try { return str ? JSON.parse(str) : fallback } catch { return fallback }
}

// PATCH /api/admin/notifications/templates/[id] — Update a template by ID
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const template = await prisma.notificationTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Build update data from partial fields
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.subject !== undefined) updateData.subject = body.subject;
    if (body.body !== undefined) updateData.body = body.body;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.variables !== undefined) updateData.variables = JSON.stringify(body.variables);
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.link !== undefined) updateData.link = body.link;

    const updated = await prisma.notificationTemplate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        name: updated.name,
        title: updated.title,
        subject: updated.subject,
        body: updated.body,
        type: updated.type,
        category: updated.category,
        isActive: updated.isActive,
        variables: safeJsonParse(updated.variables, []),
        icon: updated.icon,
        link: updated.link,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Admin notification template update API error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification template' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/notifications/templates/[id] — Delete a template by ID
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const template = await prisma.notificationTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    await prisma.notificationTemplate.delete({
      where: { id },
    });

    return NextResponse.json({
      data: { success: true, message: 'Template deleted successfully' },
    });
  } catch (error) {
    console.error('Admin notification template delete API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification template' },
      { status: 500 }
    );
  }
}
