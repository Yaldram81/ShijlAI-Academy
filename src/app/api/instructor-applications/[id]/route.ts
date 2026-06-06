import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  sendEmail,
  applicationUnderReviewEmail,
  moreInfoRequestedEmail,
  interviewScheduledEmail,
  applicationApprovedEmail,
  applicationRejectedEmail,
} from '@/lib/email'

// Generate random password
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Simple hash (matches existing auth setup — production should use bcrypt)
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + str.length
}

// Helper: add timeline event
async function addTimeline(data: {
  applicationId: string
  event: string
  fromStatus?: string
  toStatus?: string
  title: string
  description?: string
  performedBy?: string
  performedByName?: string
  metadata?: string
}) {
  await db.applicationTimeline.create({ data })
}

// PATCH /api/instructor-applications/[id] — Review/manage application (admin)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action, adminId, adminName, data: actionData } = body

    const application = await db.instructorApplication.findUnique({
      where: { id },
      include: {
        interviews: { where: { status: { in: ['scheduled', 'confirmed'] } }, orderBy: { scheduledAt: 'desc' } },
      },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    const previousStatus = application.status

    // ──── Action: Start Review (pending → under_review) ────
    if (action === 'start_review') {
      if (!['pending', 'info_provided'].includes(application.status)) {
        return NextResponse.json({ error: 'Application must be pending or info provided to start review' }, { status: 400 })
      }

      const updated = await db.instructorApplication.update({
        where: { id },
        data: {
          status: 'under_review',
          reviewedAt: new Date(),
          reviewedBy: adminId || null,
        },
      })

      await addTimeline({
        applicationId: id,
        event: 'status_change',
        fromStatus: previousStatus,
        toStatus: 'under_review',
        title: 'Application Under Review',
        description: `${adminName || 'Admin'} started reviewing the application`,
        performedBy: adminId,
        performedByName: adminName,
      })

      // Send under review email
      try {
        await sendEmail(applicationUnderReviewEmail({
          fullName: application.fullName,
          email: application.email,
          applicationCode: application.applicationCode,
        }))
        await db.instructorApplication.update({
          where: { id },
          data: { reviewEmailSent: true },
        })
        await addTimeline({
          applicationId: id,
          event: 'email_sent',
          title: 'Under Review Email Sent',
          description: `Notified ${application.email} that application is under review`,
          performedBy: 'system',
        })
      } catch (e) { console.error('Email error:', e) }

      return NextResponse.json({ application: { id: updated.id, status: updated.status }, message: 'Application moved to under review' })
    }

    // ──── Action: Request More Info ────
    if (action === 'request_more_info') {
      if (!['pending', 'under_review', 'info_provided'].includes(application.status)) {
        return NextResponse.json({ error: 'Cannot request more info for this application status' }, { status: 400 })
      }
      if (!actionData?.message) {
        return NextResponse.json({ error: 'Message is required when requesting more info' }, { status: 400 })
      }

      const updated = await db.instructorApplication.update({
        where: { id },
        data: {
          status: 'more_info_requested',
          infoRequestMessage: actionData.message,
          reviewedAt: new Date(),
          reviewedBy: adminId || null,
        },
      })

      await addTimeline({
        applicationId: id,
        event: 'status_change',
        fromStatus: previousStatus,
        toStatus: 'more_info_requested',
        title: 'More Information Requested',
        description: actionData.message,
        performedBy: adminId,
        performedByName: adminName,
        metadata: JSON.stringify({ message: actionData.message }),
      })

      // Send more info email
      try {
        await sendEmail(moreInfoRequestedEmail({
          fullName: application.fullName,
          email: application.email,
          applicationCode: application.applicationCode,
          message: actionData.message,
        }))
        await addTimeline({
          applicationId: id,
          event: 'email_sent',
          title: 'More Info Request Email Sent',
          description: `Requested additional information from ${application.email}`,
          performedBy: 'system',
        })
      } catch (e) { console.error('Email error:', e) }

      // Create notification if user exists
      if (application.userId) {
        await db.notification.create({
          data: {
            userId: application.userId,
            type: 'system',
            title: 'Additional Information Required',
            content: actionData.message,
            icon: '📧',
          },
        })
      }

      return NextResponse.json({ application: { id: updated.id, status: updated.status }, message: 'More information requested' })
    }

    // ──── Action: Schedule Interview ────
    if (action === 'schedule_interview') {
      if (!['under_review', 'info_provided', 'interview_scheduled'].includes(application.status)) {
        return NextResponse.json({ error: 'Application must be under review to schedule an interview' }, { status: 400 })
      }
      if (!actionData?.scheduledAt || !actionData?.interviewerName) {
        return NextResponse.json({ error: 'Interview date, time, and interviewer name are required' }, { status: 400 })
      }

      // Cancel any existing scheduled interviews
      await db.applicationInterview.updateMany({
        where: { applicationId: id, status: { in: ['scheduled', 'confirmed'] } },
        data: { status: 'cancelled' },
      })

      // Create new interview
      const interview = await db.applicationInterview.create({
        data: {
          applicationId: id,
          interviewType: actionData.interviewType || 'video_call',
          scheduledAt: new Date(actionData.scheduledAt),
          duration: actionData.duration || 30,
          meetingUrl: actionData.meetingUrl || null,
          meetingId: actionData.meetingId || null,
          meetingPassword: actionData.meetingPassword || null,
          location: actionData.location || null,
          interviewerId: adminId || null,
          interviewerName: actionData.interviewerName,
          notes: actionData.notes || null,
          status: 'scheduled',
        },
      })

      const updated = await db.instructorApplication.update({
        where: { id },
        data: { status: 'interview_scheduled' },
      })

      await addTimeline({
        applicationId: id,
        event: 'interview_scheduled',
        fromStatus: previousStatus,
        toStatus: 'interview_scheduled',
        title: 'Interview Scheduled',
        description: `Interview scheduled for ${new Date(actionData.scheduledAt).toLocaleString()} with ${actionData.interviewerName}`,
        performedBy: adminId,
        performedByName: adminName,
        metadata: JSON.stringify({ interviewId: interview.id }),
      })

      // Send interview email
      try {
        const scheduledDate = new Date(actionData.scheduledAt)
        await sendEmail(interviewScheduledEmail({
          fullName: application.fullName,
          email: application.email,
          applicationCode: application.applicationCode,
          interviewDate: scheduledDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          interviewTime: scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }),
          duration: interview.duration,
          meetingUrl: interview.meetingUrl || undefined,
          interviewerName: actionData.interviewerName,
          interviewType: interview.interviewType,
        }))
        await db.instructorApplication.update({
          where: { id },
          data: { interviewEmailSent: true },
        })
        await addTimeline({
          applicationId: id,
          event: 'email_sent',
          title: 'Interview Invitation Email Sent',
          description: `Interview invitation sent to ${application.email}`,
          performedBy: 'system',
        })
      } catch (e) { console.error('Email error:', e) }

      // Create notification if user exists
      if (application.userId) {
        await db.notification.create({
          data: {
            userId: application.userId,
            type: 'system',
            title: 'Interview Scheduled',
            content: `Your interview is scheduled for ${new Date(actionData.scheduledAt).toLocaleString()}. Check your email for details.`,
            icon: '📅',
          },
        })
      }

      return NextResponse.json({ application: { id: updated.id, status: updated.status }, interview: { id: interview.id }, message: 'Interview scheduled' })
    }

    // ──── Action: Complete Interview (add feedback) ────
    if (action === 'complete_interview') {
      const interviewId = actionData?.interviewId
      if (!interviewId) {
        return NextResponse.json({ error: 'Interview ID is required' }, { status: 400 })
      }

      const interview = await db.applicationInterview.findUnique({ where: { id: interviewId } })
      if (!interview) {
        return NextResponse.json({ error: 'Interview not found' }, { status: 404 })
      }

      await db.applicationInterview.update({
        where: { id: interviewId },
        data: {
          status: 'completed',
          feedback: actionData.feedback ? JSON.stringify(actionData.feedback) : null,
          feedbackScore: actionData.feedbackScore || null,
          completedAt: new Date(),
        },
      })

      const updated = await db.instructorApplication.update({
        where: { id },
        data: {
          status: 'interview_completed',
          evaluationScore: actionData.feedbackScore || application.evaluationScore,
          evaluationNotes: actionData.feedback ? JSON.stringify(actionData.feedback) : application.evaluationNotes,
        },
      })

      await addTimeline({
        applicationId: id,
        event: 'interview_completed',
        fromStatus: previousStatus,
        toStatus: 'interview_completed',
        title: 'Interview Completed',
        description: `Interview completed${actionData.feedbackScore ? ` with score ${actionData.feedbackScore}/100` : ''}`,
        performedBy: adminId,
        performedByName: adminName,
      })

      return NextResponse.json({ application: { id: updated.id, status: updated.status }, message: 'Interview marked as completed' })
    }

    // ──── Action: Approve Application ────
    if (action === 'approve') {
      if (!['under_review', 'interview_completed', 'more_info_requested', 'info_provided'].includes(application.status)) {
        return NextResponse.json({ error: 'Application cannot be approved from its current status' }, { status: 400 })
      }

      let userId: string
      let generatedPassword: string | null = null

      // Check if user with this email already exists
      const existingUser = await db.user.findUnique({
        where: { email: application.email },
      })

      if (existingUser) {
        userId = existingUser.id
        await db.user.update({
          where: { id: existingUser.id },
          data: {
            role: 'instructor',
            isVerified: true,
            status: 'active',
          },
        })
      } else {
        generatedPassword = generateRandomPassword()
        const newUser = await db.user.create({
          data: {
            email: application.email,
            name: application.fullName,
            phone: application.phone,
            role: 'instructor',
            passwordHash: simpleHash(generatedPassword),
            isVerified: true,
            authProvider: 'email',
            status: 'active',
          },
        })
        userId = newUser.id
      }

      // Create/update InstructorProfile
      await db.instructorProfile.upsert({
        where: { instructorId: userId },
        update: {
          headline: application.expertise,
          linkedin: application.linkedinProfile,
          website: application.portfolioUrl,
          expertise: JSON.stringify([application.expertise]),
          applicationStatus: 'approved',
          appliedAt: application.createdAt,
          reviewedAt: new Date(),
          reviewedBy: adminId || null,
          topicProposal: application.expertise,
        },
        create: {
          instructorId: userId,
          headline: application.expertise,
          linkedin: application.linkedinProfile,
          website: application.portfolioUrl,
          expertise: JSON.stringify([application.expertise]),
          applicationStatus: 'approved',
          appliedAt: application.createdAt,
          reviewedAt: new Date(),
          reviewedBy: adminId || null,
          topicProposal: application.expertise,
        },
      })

      // Update application
      const updated = await db.instructorApplication.update({
        where: { id },
        data: {
          status: 'approved',
          adminNotes: actionData?.adminNotes || application.adminNotes,
          reviewedAt: new Date(),
          reviewedBy: adminId || null,
          userId,
        },
      })

      // Create welcome notification
      await db.notification.create({
        data: {
          userId,
          type: 'system',
          title: 'Instructor Application Approved! 🎉',
          content: 'Congratulations! Your instructor application has been approved. You can now create and publish courses on ShijlAI Academy.',
          icon: '🎉',
          priority: 'high',
        },
      })

      await addTimeline({
        applicationId: id,
        event: 'status_change',
        fromStatus: previousStatus,
        toStatus: 'approved',
        title: 'Application Approved',
        description: `Application approved by ${adminName || 'admin'}. Instructor account ${existingUser ? 'upgraded' : 'created'}.`,
        performedBy: adminId,
        performedByName: adminName,
      })

      // Send approval email with credentials
      try {
        await sendEmail(applicationApprovedEmail({
          fullName: application.fullName,
          email: application.email,
          applicationCode: application.applicationCode,
          credentials: existingUser ? null : { email: application.email, password: generatedPassword! },
        }))
        await db.instructorApplication.update({
          where: { id },
          data: { decisionEmailSent: true },
        })
        await addTimeline({
          applicationId: id,
          event: 'email_sent',
          title: 'Approval Email Sent',
          description: `Approval email sent to ${application.email}${generatedPassword ? ' with account credentials' : ''}`,
          performedBy: 'system',
        })
      } catch (e) { console.error('Email error:', e) }

      // Activity log
      await db.activityLog.create({
        data: {
          userId: adminId || null,
          type: 'instructor_approved',
          title: `Instructor approved: ${application.fullName}`,
          description: `Email: ${application.email}, Expertise: ${application.expertise}`,
          icon: '✅',
          action: 'approved',
          targetName: application.fullName,
          targetType: 'user',
          targetId: userId,
          category: 'user_management',
          severity: 'info',
        },
      })

      return NextResponse.json({
        application: { id: updated.id, status: updated.status, userId },
        credentials: !existingUser ? { email: application.email, password: generatedPassword } : null,
        message: 'Application approved successfully',
      })
    }

    // ──── Action: Reject Application ────
    if (action === 'reject') {
      if (['approved', 'onboarded', 'rejected', 'withdrawn'].includes(application.status)) {
        return NextResponse.json({ error: 'Application cannot be rejected from its current status' }, { status: 400 })
      }
      if (!actionData?.reason) {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
      }

      // Set reapply cooldown (30 days)
      const reapplyAfter = new Date()
      reapplyAfter.setDate(reapplyAfter.getDate() + 30)

      const updated = await db.instructorApplication.update({
        where: { id },
        data: {
          status: 'rejected',
          rejectionReason: actionData.reason,
          rejectionFeedback: actionData.feedback || null,
          canReapply: actionData.canReapply !== false,
          reapplyAfter: actionData.canReapply !== false ? reapplyAfter : null,
          reviewedAt: new Date(),
          reviewedBy: adminId || null,
        },
      })

      // Cancel any scheduled interviews
      await db.applicationInterview.updateMany({
        where: { applicationId: id, status: { in: ['scheduled', 'confirmed'] } },
        data: { status: 'cancelled' },
      })

      await addTimeline({
        applicationId: id,
        event: 'status_change',
        fromStatus: previousStatus,
        toStatus: 'rejected',
        title: 'Application Rejected',
        description: `Rejected by ${adminName || 'admin'}. Reason: ${actionData.reason}`,
        performedBy: adminId,
        performedByName: adminName,
      })

      // Send rejection email
      try {
        await sendEmail(applicationRejectedEmail({
          fullName: application.fullName,
          email: application.email,
          applicationCode: application.applicationCode,
          reason: actionData.reason,
          feedback: actionData.feedback,
          canReapply: actionData.canReapply !== false,
          reapplyAfter: actionData.canReapply !== false ? reapplyAfter.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined,
        }))
        await db.instructorApplication.update({
          where: { id },
          data: { decisionEmailSent: true },
        })
        await addTimeline({
          applicationId: id,
          event: 'email_sent',
          title: 'Rejection Email Sent',
          description: `Rejection email sent to ${application.email}`,
          performedBy: 'system',
        })
      } catch (e) { console.error('Email error:', e) }

      // Create notification if user exists
      if (application.userId) {
        await db.notification.create({
          data: {
            userId: application.userId,
            type: 'system',
            title: 'Instructor Application Update',
            content: `Your application was not approved. Reason: ${actionData.reason}`,
            icon: '❌',
          },
        })
      }

      // Activity log
      await db.activityLog.create({
        data: {
          userId: adminId || null,
          type: 'instructor_rejected',
          title: `Instructor rejected: ${application.fullName}`,
          description: `Reason: ${actionData.reason}`,
          icon: '❌',
          action: 'rejected',
          targetName: application.fullName,
          targetType: 'user',
          targetId: id,
          category: 'user_management',
          severity: 'warning',
        },
      })

      return NextResponse.json({
        application: { id: updated.id, status: updated.status },
        message: 'Application rejected',
      })
    }

    // ──── Action: Add Admin Note ────
    if (action === 'add_note') {
      if (!actionData?.note) {
        return NextResponse.json({ error: 'Note content is required' }, { status: 400 })
      }

      const existingNotes = application.adminNotes
        ? JSON.parse(application.adminNotes)
        : []

      existingNotes.push({
        note: actionData.note,
        adminName: adminName || 'Admin',
        adminId: adminId || null,
        date: new Date().toISOString(),
      })

      await db.instructorApplication.update({
        where: { id },
        data: { adminNotes: JSON.stringify(existingNotes) },
      })

      await addTimeline({
        applicationId: id,
        event: 'note_added',
        title: 'Admin Note Added',
        description: actionData.note,
        performedBy: adminId,
        performedByName: adminName,
      })

      return NextResponse.json({ message: 'Note added' })
    }

    // ──── Action: Update Evaluation ────
    if (action === 'evaluate') {
      const updated = await db.instructorApplication.update({
        where: { id },
        data: {
          evaluationScore: actionData.score ?? application.evaluationScore,
          evaluationCriteria: actionData.criteria ? JSON.stringify(actionData.criteria) : application.evaluationCriteria,
          evaluationNotes: actionData.notes ?? application.evaluationNotes,
        },
      })

      await addTimeline({
        applicationId: id,
        event: 'evaluation_updated',
        title: 'Evaluation Updated',
        description: `Score: ${actionData.score || application.evaluationScore}/100`,
        performedBy: adminId,
        performedByName: adminName,
      })

      return NextResponse.json({ application: { id: updated.id, evaluationScore: updated.evaluationScore }, message: 'Evaluation updated' })
    }

    // ──── Action: Mark Onboarded ────
    if (action === 'mark_onboarded') {
      if (application.status !== 'approved') {
        return NextResponse.json({ error: 'Application must be approved before onboarding' }, { status: 400 })
      }

      const updated = await db.instructorApplication.update({
        where: { id },
        data: {
          status: 'onboarded',
          onboardedAt: new Date(),
          onboardingChecklist: actionData.checklist ? JSON.stringify(actionData.checklist) : null,
        },
      })

      await addTimeline({
        applicationId: id,
        event: 'status_change',
        fromStatus: previousStatus,
        toStatus: 'onboarded',
        title: 'Onboarding Completed',
        description: `${application.fullName} has completed onboarding`,
        performedBy: adminId,
        performedByName: adminName,
      })

      return NextResponse.json({ application: { id: updated.id, status: updated.status }, message: 'Marked as onboarded' })
    }

    // ──── Action: Withdraw (applicant) ────
    if (action === 'withdraw') {
      if (['approved', 'onboarded', 'rejected', 'withdrawn'].includes(application.status)) {
        return NextResponse.json({ error: 'Cannot withdraw from current status' }, { status: 400 })
      }

      const updated = await db.instructorApplication.update({
        where: { id },
        data: { status: 'withdrawn' },
      })

      // Cancel interviews
      await db.applicationInterview.updateMany({
        where: { applicationId: id, status: { in: ['scheduled', 'confirmed'] } },
        data: { status: 'cancelled' },
      })

      await addTimeline({
        applicationId: id,
        event: 'status_change',
        fromStatus: previousStatus,
        toStatus: 'withdrawn',
        title: 'Application Withdrawn',
        description: `${application.fullName} withdrew their application`,
        performedBy: 'applicant',
        performedByName: application.fullName,
      })

      return NextResponse.json({ application: { id: updated.id, status: updated.status }, message: 'Application withdrawn' })
    }

    // ──── Action: Provide Info (applicant responds to more_info_requested) ────
    if (action === 'provide_info') {
      if (application.status !== 'more_info_requested') {
        return NextResponse.json({ error: 'Application is not awaiting additional information' }, { status: 400 })
      }
      if (!actionData?.info) {
        return NextResponse.json({ error: 'Information is required' }, { status: 400 })
      }

      const updated = await db.instructorApplication.update({
        where: { id },
        data: {
          status: 'info_provided',
          infoProvidedAt: new Date(),
          infoProvidedData: JSON.stringify(actionData.info),
        },
      })

      await addTimeline({
        applicationId: id,
        event: 'status_change',
        fromStatus: previousStatus,
        toStatus: 'info_provided',
        title: 'Additional Information Provided',
        description: `${application.fullName} provided the requested information`,
        performedBy: 'applicant',
        performedByName: application.fullName,
        metadata: JSON.stringify(actionData.info),
      })

      return NextResponse.json({ application: { id: updated.id, status: updated.status }, message: 'Information provided' })
    }

    return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 })
  } catch (error) {
    console.error('Instructor application action error:', error)
    return NextResponse.json(
      { error: 'Failed to process application action' },
      { status: 500 }
    )
  }
}

// GET /api/instructor-applications/[id] — Get single application detail
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const application = await db.instructorApplication.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true, phone: true },
        },
        timeline: { orderBy: { createdAt: 'desc' } },
        interviews: { orderBy: { scheduledAt: 'desc' } },
      },
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    return NextResponse.json({
      application: {
        id: application.id,
        applicationCode: application.applicationCode,
        fullName: application.fullName,
        email: application.email,
        phone: application.phone,
        expertise: application.expertise,
        experience: application.experience,
        motivation: application.motivation,
        linkedinProfile: application.linkedinProfile,
        portfolioUrl: application.portfolioUrl,
        sampleLessonDesc: application.sampleLessonDesc,
        teachingApproach: application.teachingApproach,
        expectedTimeline: application.expectedTimeline,
        resumeUrl: application.resumeUrl,
        status: application.status,
        adminNotes: application.adminNotes,
        reviewedAt: application.reviewedAt?.toISOString() || null,
        reviewedBy: application.reviewedBy,
        rejectionReason: application.rejectionReason,
        rejectionFeedback: application.rejectionFeedback,
        canReapply: application.canReapply,
        reapplyAfter: application.reapplyAfter?.toISOString() || null,
        evaluationScore: application.evaluationScore,
        evaluationCriteria: application.evaluationCriteria,
        evaluationNotes: application.evaluationNotes,
        confirmationEmailSent: application.confirmationEmailSent,
        reviewEmailSent: application.reviewEmailSent,
        interviewEmailSent: application.interviewEmailSent,
        decisionEmailSent: application.decisionEmailSent,
        onboardingEmailSent: application.onboardingEmailSent,
        infoRequestMessage: application.infoRequestMessage,
        infoProvidedAt: application.infoProvidedAt?.toISOString() || null,
        infoProvidedData: application.infoProvidedData,
        onboardedAt: application.onboardedAt?.toISOString() || null,
        onboardingChecklist: application.onboardingChecklist,
        userId: application.userId,
        createdAt: application.createdAt.toISOString(),
        updatedAt: application.updatedAt.toISOString(),
        linkedUser: application.user ? {
          id: application.user.id,
          name: application.user.name,
          email: application.user.email,
          avatar: application.user.avatar,
          phone: application.user.phone,
        } : null,
        timeline: application.timeline.map(t => ({
          id: t.id,
          event: t.event,
          fromStatus: t.fromStatus,
          toStatus: t.toStatus,
          title: t.title,
          description: t.description,
          performedBy: t.performedBy,
          performedByName: t.performedByName,
          metadata: t.metadata,
          createdAt: t.createdAt.toISOString(),
        })),
        interviews: application.interviews.map(i => ({
          id: i.id,
          interviewType: i.interviewType,
          scheduledAt: i.scheduledAt.toISOString(),
          duration: i.duration,
          meetingUrl: i.meetingUrl,
          meetingId: i.meetingId,
          meetingPassword: i.meetingPassword,
          location: i.location,
          status: i.status,
          interviewerId: i.interviewerId,
          interviewerName: i.interviewerName,
          notes: i.notes,
          feedback: i.feedback,
          feedbackScore: i.feedbackScore,
          completedAt: i.completedAt?.toISOString() || null,
          createdAt: i.createdAt.toISOString(),
        })),
      },
    })
  } catch (error) {
    console.error('Get application detail error:', error)
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 })
  }
}
