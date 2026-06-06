import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail, applicationConfirmationEmail, newApplicationAdminEmail } from '@/lib/email'

// Generate a unique application code
function generateApplicationCode(): string {
  const year = new Date().getFullYear()
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `INS-${year}-${code}`
}

// POST /api/instructor-applications — Submit a new instructor application (public)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      fullName,
      email,
      phone,
      expertise,
      experience,
      motivation,
      linkedinProfile,
      portfolioUrl,
      sampleLessonDesc,
      teachingApproach,
      expectedTimeline,
    } = body

    // Validate required fields
    if (!fullName || !email || !expertise || !motivation) {
      return NextResponse.json(
        { error: 'Full name, email, expertise, and motivation are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      )
    }

    // Check if email already has a pending or under_review application
    const existingActive = await db.instructorApplication.findFirst({
      where: {
        email,
        status: { in: ['pending', 'under_review', 'more_info_requested', 'info_provided', 'interview_scheduled', 'interview_completed'] },
      },
    })

    if (existingActive) {
      return NextResponse.json(
        { error: 'You already have an active application with this email. Please check your status using your tracking code.', existingCode: existingActive.applicationCode },
        { status: 409 }
      )
    }

    // Check if there's an approved/onboarded application with this email
    const approvedApplication = await db.instructorApplication.findFirst({
      where: {
        email,
        status: { in: ['approved', 'onboarded'] },
      },
    })

    if (approvedApplication) {
      return NextResponse.json(
        { error: 'An instructor account with this email already exists. Please log in instead.' },
        { status: 409 }
      )
    }

    // Check if there's a recent rejected application still in cooldown
    const recentRejected = await db.instructorApplication.findFirst({
      where: {
        email,
        status: 'rejected',
        canReapply: true,
        reapplyAfter: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (recentRejected) {
      const reapplyDate = recentRejected.reapplyAfter!.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      return NextResponse.json(
        { error: `Your previous application was rejected. You can reapply after ${reapplyDate}.`, reapplyAfter: recentRejected.reapplyAfter!.toISOString() },
        { status: 409 }
      )
    }

    // Generate unique application code
    let applicationCode = generateApplicationCode()
    const existingCode = await db.instructorApplication.findUnique({ where: { applicationCode } })
    while (existingCode) {
      applicationCode = generateApplicationCode()
      const check = await db.instructorApplication.findUnique({ where: { applicationCode } })
      if (!check) break
    }

    // Create the application
    const application = await db.instructorApplication.create({
      data: {
        applicationCode,
        fullName,
        email,
        phone: phone || null,
        expertise,
        experience: experience || '',
        motivation,
        linkedinProfile: linkedinProfile || null,
        portfolioUrl: portfolioUrl || null,
        sampleLessonDesc: sampleLessonDesc || null,
        teachingApproach: teachingApproach || null,
        expectedTimeline: expectedTimeline || null,
        status: 'pending',
        confirmationEmailSent: false,
      },
    })

    // Create timeline entry
    await db.applicationTimeline.create({
      data: {
        applicationId: application.id,
        event: 'application_submitted',
        toStatus: 'pending',
        title: 'Application Submitted',
        description: `${fullName} submitted an instructor application for ${expertise}`,
        performedBy: 'applicant',
        performedByName: fullName,
      },
    })

    // Create an activity log for admin visibility
    await db.activityLog.create({
      data: {
        type: 'instructor_applied',
        title: `New instructor application: ${fullName}`,
        description: `Applied with expertise in ${expertise}. Code: ${applicationCode}`,
        icon: '📋',
        action: 'created',
        targetName: fullName,
        targetType: 'user',
        targetId: application.id,
        category: 'user_management',
        severity: 'info',
      },
    })

    // Send confirmation email
    try {
      const emailPayload = applicationConfirmationEmail({
        fullName,
        email,
        applicationCode,
      })
      await sendEmail(emailPayload)
      
      // Mark confirmation email as sent
      await db.instructorApplication.update({
        where: { id: application.id },
        data: {
          confirmationEmailSent: true,
          confirmationEmailSentAt: new Date(),
        },
      })

      // Timeline entry for email
      await db.applicationTimeline.create({
        data: {
          applicationId: application.id,
          event: 'email_sent',
          title: 'Confirmation Email Sent',
          description: `Application confirmation email sent to ${email}`,
          performedBy: 'system',
        },
      })
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Don't fail the application submission if email fails
    }

    // Send admin notification email
    try {
      const adminEmail = newApplicationAdminEmail({
        adminEmail: 'admin@shijlai.com',
        applicantName: fullName,
        applicantEmail: email,
        expertise,
        experience: experience || 'Not specified',
        applicationCode,
      })
      await sendEmail(adminEmail)
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError)
    }

    return NextResponse.json({
      id: application.id,
      applicationCode: application.applicationCode,
      status: application.status,
      message: 'Application submitted successfully. Check your email for confirmation.',
    }, { status: 201 })
  } catch (error) {
    console.error('Instructor application submission error:', error)
    return NextResponse.json(
      { error: 'Failed to submit application. Please try again.' },
      { status: 500 }
    )
  }
}

// GET /api/instructor-applications — List applications (admin) or lookup by code (public)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const email = searchParams.get('email')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''

    // Public: Track application by code
    if (code) {
      const application = await db.instructorApplication.findUnique({
        where: { applicationCode: code },
        include: {
          timeline: { orderBy: { createdAt: 'desc' } },
          interviews: { orderBy: { scheduledAt: 'desc' } },
        },
      })

      if (!application) {
        return NextResponse.json(
          { error: 'Application not found. Please check your tracking code.' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        application: {
          id: application.id,
          applicationCode: application.applicationCode,
          fullName: application.fullName,
          email: application.email,
          status: application.status,
          expertise: application.expertise,
          createdAt: application.createdAt.toISOString(),
          reviewedAt: application.reviewedAt?.toISOString() || null,
          rejectionReason: application.rejectionReason || null,
          infoRequestMessage: application.infoRequestMessage || null,
          canReapply: application.canReapply,
          reapplyAfter: application.reapplyAfter?.toISOString() || null,
          timeline: application.timeline.map(t => ({
            id: t.id,
            event: t.event,
            fromStatus: t.fromStatus,
            toStatus: t.toStatus,
            title: t.title,
            description: t.description,
            performedByName: t.performedByName,
            createdAt: t.createdAt.toISOString(),
          })),
          interviews: application.interviews.map(i => ({
            id: i.id,
            interviewType: i.interviewType,
            scheduledAt: i.scheduledAt.toISOString(),
            duration: i.duration,
            meetingUrl: i.meetingUrl,
            status: i.status,
            interviewerName: i.interviewerName,
          })),
        },
      })
    }

    // Public: Check if email has existing application
    if (email && !code) {
      const application = await db.instructorApplication.findFirst({
        where: { email },
        orderBy: { createdAt: 'desc' },
        select: {
          applicationCode: true,
          status: true,
          fullName: true,
          createdAt: true,
        },
      })
      return NextResponse.json({ application })
    }

    // Admin: List all applications with filters
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

    const [applications, total] = await Promise.all([
      db.instructorApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
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
        status: app.interviews[0].status,
        interviewerName: app.interviews[0].interviewerName,
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
    console.error('Instructor applications list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    )
  }
}
