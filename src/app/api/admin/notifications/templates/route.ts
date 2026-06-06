import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function safeJsonParse(str: string | null | undefined, fallback: unknown = null) {
  try { return str ? JSON.parse(str) : fallback } catch { return fallback }
}

// GET /api/admin/notifications/templates — List all notification templates
export async function GET() {
  try {
    const templates = await prisma.notificationTemplate.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    // Get usage counts from NotificationLog for each template
    const templateIds = templates.map(t => t.id);

    const usageCounts = await prisma.notificationLog.groupBy({
      by: ['templateId'],
      where: {
        templateId: { in: templateIds },
      },
      _count: {
        templateId: true,
      },
    });

    const usageMap = new Map(
      usageCounts
        .filter(item => item.templateId !== null)
        .map(item => [item.templateId, item._count.templateId])
    );

    const formattedTemplates = templates.map(template => ({
      id: template.id,
      name: template.name,
      title: template.title,
      subject: template.subject,
      body: template.body,
      type: template.type,
      category: template.category,
      isActive: template.isActive,
      variables: safeJsonParse(template.variables, []),
      icon: template.icon,
      link: template.link,
      usageCount: usageMap.get(template.id) || 0,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      data: formattedTemplates,
    });
  } catch (error) {
    console.error('Admin notification templates list API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification templates' },
      { status: 500 }
    );
  }
}

// POST /api/admin/notifications/templates — Create or update a template
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, title, subject, body: templateBody, type, category, isActive, variables, icon, link } = body;

    if (!name || !title || !subject || !templateBody) {
      return NextResponse.json(
        { error: 'Missing required fields: name, title, subject, body' },
        { status: 400 }
      );
    }

    // Check if template with this name already exists
    const existing = await prisma.notificationTemplate.findUnique({
      where: { name },
    });

    const templateData = {
      name,
      title,
      subject,
      body: templateBody,
      type: type || 'both',
      category: category || 'system',
      isActive: isActive !== undefined ? isActive : true,
      variables: variables ? JSON.stringify(variables) : null,
      icon: icon || null,
      link: link || null,
    };

    let template;

    if (existing) {
      // Update existing template
      template = await prisma.notificationTemplate.update({
        where: { name },
        data: templateData,
      });
    } else {
      // Create new template
      template = await prisma.notificationTemplate.create({
        data: templateData,
      });
    }

    return NextResponse.json({
      data: {
        id: template.id,
        name: template.name,
        title: template.title,
        subject: template.subject,
        body: template.body,
        type: template.type,
        category: template.category,
        isActive: template.isActive,
        variables: safeJsonParse(template.variables, []),
        icon: template.icon,
        link: template.link,
        createdAt: template.createdAt.toISOString(),
        updatedAt: template.updatedAt.toISOString(),
      },
    }, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error('Admin notification templates create/update API error:', error);
    return NextResponse.json(
      { error: 'Failed to create/update notification template' },
      { status: 500 }
    );
  }
}
