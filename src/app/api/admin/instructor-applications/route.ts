import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/instructor-applications — List all instructor applications with filters, pagination, facets
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const sortField = searchParams.get('sortField') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: Record<string, any> = {}
    if (status && status !== 'all') {
      where.status = status
    }
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { expertise: { contains: search } },
        { applicationCode: { contains: search } },
      ]
    }

    const skip = (page - 1) * limit

    // Build orderBy
    const orderBy: Record<string, string> = {}
    if (sortField === 'fullName') {
      orderBy.fullName = sortOrder
    } else if (sortField === 'evaluationScore') {
      orderBy.evaluationScore = sortOrder === 'desc' ? 'desc' : 'asc'
    } else {
      orderBy.createdAt = sortOrder === 'desc' ? 'desc' : 'asc'
    }

    const [applications, total] = await Promise.all([
      db.instructorApplication.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          interviews: {
            where: { status: { in: ['scheduled', 'confirmed'] } },
            orderBy: { scheduledAt: 'desc' },
            take: 1,
          },
        },
      }),
      db.instructorApplication.count({ where }),
    ])

    // Status counts for facets
    const statusCounts = await db.instructorApplication.groupBy({
      by: ['status'],
      _count: { status: true },
    })

    const facets: Record<string, number> = {}
    statusCounts.forEach(sc => {
      facets[sc.status] = sc._count.status
    })

    const formatted = applications.map(app => ({
      id: app.id,
      applicationCode: app.applicationCode,
      fullName: app.fullName,
      email: app.email,
      phone: app.phone,
      expertise: app.expertise,
      experience: app.experience,
      motivation: app.motivation,
      linkedinProfile: app.linkedinProfile,
      portfolioUrl: app.portfolioUrl,
      sampleLessonDesc: app.sampleLessonDesc,
      teachingApproach: app.teachingApproach,
      expectedTimeline: app.expectedTimeline,
      status: app.status,
      adminNotes: app.adminNotes,
      reviewedAt: app.reviewedAt?.toISOString() || null,
      reviewedBy: app.reviewedBy,
      rejectionReason: app.rejectionReason || null,
      rejectionFeedback: app.rejectionFeedback || null,
      canReapply: app.canReapply,
      evaluationScore: app.evaluationScore,
      confirmationEmailSent: app.confirmationEmailSent,
      infoRequestMessage: app.infoRequestMessage,
      userId: app.userId,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
      linkedUser: app.user ? {
        id: app.user.id,
        name: app.user.name,
        email: app.user.email,
        avatar: app.user.avatar,
      } : null,
      upcomingInterview: app.interviews[0] ? {
        id: app.interviews[0].id,
        scheduledAt: app.interviews[0].scheduledAt.toISOString(),
        duration: app.interviews[0].duration,
        meetingUrl: app.interviews[0].meetingUrl,
        interviewerName: app.interviews[0].interviewerName,
        type: app.interviews[0].interviewType,
      } : null,
    }))

    return NextResponse.json({
      applications: formatted,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      facets,
    })
  } catch (error) {
    console.error('Admin instructor applications API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch instructor applications' },
      { status: 500 }
    )
  }
}
