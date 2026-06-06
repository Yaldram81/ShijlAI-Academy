import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Default settings when no StudentSettings record exists
const defaultSettings = {
  headline: null,
  location: null,
  website: null,
  linkedin: null,
  learningGoalType: 'career',
  dailyGoalMinutes: 30,
  reminderTime: '20:00',
  videoQuality: 'auto',
  playbackSpeed: '1x',
  preferredLang: 'en',
  aiTutorMode: 'socratic',
  offlineDownloads: 'wifi',
  autoPlay: true,
  showSubtitles: true,
  focusMode: false,
  spacedRepetition: true,
  notifyDailyReminder: true,
  notifyAssignmentDue: true,
  notifyInstructorReply: true,
  notifyLiveSession: true,
  notifyNewCourse: true,
  notifyStreakRisk: true,
  notifyCertificate: true,
  notifyPlatformUpdates: false,
  emailDailyReminder: 'off',
  emailAssignmentDue: '1_day_before',
  emailInstructorReply: 'immediately',
  emailLiveSession: '1_hour_before',
  emailNewCourse: 'weekly_digest',
  emailStreakRisk: 'off',
  emailCertificate: 'immediately',
  emailPlatformUpdates: 'off',
  profileVisibility: 'public',
  showProgress: true,
  showOnLeaderboard: true,
  showCertificates: true,
  showOnlineStatus: true,
  allowMessages: 'instructors',
  dataSharing: false,
  theme: 'system',
  fontSize: 'default',
  compactMode: false,
  reducedMotion: false,
  sidebarPosition: 'left',
}

// Allowed enum values for validation
const validEnums: Record<string, string[]> = {
  learningGoalType: ['career', 'skill', 'personal'],
  videoQuality: ['auto', '1080p', '720p', '480p'],
  playbackSpeed: ['0.75x', '1x', '1.25x', '1.5x', '2x'],
  preferredLang: ['en', 'ur', 'ask'],
  aiTutorMode: ['socratic', 'direct'],
  offlineDownloads: ['wifi', 'always', 'disabled'],
  emailDailyReminder: ['off', 'immediately', '1_hour_before', '1_day_before', 'weekly_digest'],
  emailAssignmentDue: ['off', 'immediately', '1_hour_before', '1_day_before', 'weekly_digest'],
  emailInstructorReply: ['off', 'immediately', '1_hour_before', '1_day_before', 'weekly_digest'],
  emailLiveSession: ['off', 'immediately', '1_hour_before', '1_day_before', 'weekly_digest'],
  emailNewCourse: ['off', 'immediately', '1_hour_before', '1_day_before', 'weekly_digest'],
  emailStreakRisk: ['off', 'immediately', '1_hour_before', '1_day_before', 'weekly_digest'],
  emailCertificate: ['off', 'immediately', '1_hour_before', '1_day_before', 'weekly_digest'],
  emailPlatformUpdates: ['off', 'immediately', '1_hour_before', '1_day_before', 'weekly_digest'],
  profileVisibility: ['public', 'students', 'private'],
  allowMessages: ['everyone', 'instructors', 'nobody'],
  theme: ['light', 'dark', 'system'],
  fontSize: ['small', 'default', 'large'],
  sidebarPosition: ['left', 'right'],
}

const validDailyGoalMinutes = [15, 30, 45, 60, 90, 120]

// GET /api/student/settings — Fetch student settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    // Fetch the user with their student settings
    const user = await db.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        phone: true,
        mfaEnabled: true,
        authProvider: true,
        language: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        lastActiveAt: true,
        studentSettings: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (user.role !== 'student') {
      return NextResponse.json({ error: 'User is not a student' }, { status: 403 })
    }

    // Extract settings and user profile info
    const { studentSettings, ...userFields } = user

    if (!studentSettings) {
      return NextResponse.json({
        settings: {
          studentId,
          ...defaultSettings,
        },
        user: userFields,
        isDefault: true,
      })
    }

    return NextResponse.json({
      settings: {
        headline: studentSettings.headline,
        location: studentSettings.location,
        website: studentSettings.website,
        linkedin: studentSettings.linkedin,
        learningGoalType: studentSettings.learningGoalType,
        dailyGoalMinutes: studentSettings.dailyGoalMinutes,
        reminderTime: studentSettings.reminderTime,
        videoQuality: studentSettings.videoQuality,
        playbackSpeed: studentSettings.playbackSpeed,
        preferredLang: studentSettings.preferredLang,
        aiTutorMode: studentSettings.aiTutorMode,
        offlineDownloads: studentSettings.offlineDownloads,
        autoPlay: studentSettings.autoPlay,
        showSubtitles: studentSettings.showSubtitles,
        focusMode: studentSettings.focusMode,
        spacedRepetition: studentSettings.spacedRepetition,
        notifyDailyReminder: studentSettings.notifyDailyReminder,
        notifyAssignmentDue: studentSettings.notifyAssignmentDue,
        notifyInstructorReply: studentSettings.notifyInstructorReply,
        notifyLiveSession: studentSettings.notifyLiveSession,
        notifyNewCourse: studentSettings.notifyNewCourse,
        notifyStreakRisk: studentSettings.notifyStreakRisk,
        notifyCertificate: studentSettings.notifyCertificate,
        notifyPlatformUpdates: studentSettings.notifyPlatformUpdates,
        emailDailyReminder: studentSettings.emailDailyReminder,
        emailAssignmentDue: studentSettings.emailAssignmentDue,
        emailInstructorReply: studentSettings.emailInstructorReply,
        emailLiveSession: studentSettings.emailLiveSession,
        emailNewCourse: studentSettings.emailNewCourse,
        emailStreakRisk: studentSettings.emailStreakRisk,
        emailCertificate: studentSettings.emailCertificate,
        emailPlatformUpdates: studentSettings.emailPlatformUpdates,
        profileVisibility: studentSettings.profileVisibility,
        showProgress: studentSettings.showProgress,
        showOnLeaderboard: studentSettings.showOnLeaderboard,
        showCertificates: studentSettings.showCertificates,
        showOnlineStatus: studentSettings.showOnlineStatus,
        allowMessages: studentSettings.allowMessages,
        dataSharing: studentSettings.dataSharing,
        theme: studentSettings.theme,
        fontSize: studentSettings.fontSize,
        compactMode: studentSettings.compactMode,
        reducedMotion: studentSettings.reducedMotion,
        sidebarPosition: studentSettings.sidebarPosition,
      },
      user: userFields,
      transactions: [],
    })
  } catch (error) {
    console.error('Error fetching student settings:', error)
    return NextResponse.json({ error: 'Failed to fetch student settings' }, { status: 500 })
  }
}

// POST /api/student/settings — Upsert student settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      studentId,
      // Profile fields
      headline,
      location,
      website,
      linkedin,
      // Learning preferences
      learningGoalType,
      dailyGoalMinutes,
      reminderTime,
      videoQuality,
      playbackSpeed,
      preferredLang,
      aiTutorMode,
      offlineDownloads,
      autoPlay,
      showSubtitles,
      focusMode,
      spacedRepetition,
      // Notification preferences (in-app)
      notifyDailyReminder,
      notifyAssignmentDue,
      notifyInstructorReply,
      notifyLiveSession,
      notifyNewCourse,
      notifyStreakRisk,
      notifyCertificate,
      notifyPlatformUpdates,
      // Email notification preferences
      emailDailyReminder,
      emailAssignmentDue,
      emailInstructorReply,
      emailLiveSession,
      emailNewCourse,
      emailStreakRisk,
      emailCertificate,
      emailPlatformUpdates,
      // Privacy settings
      profileVisibility,
      showProgress,
      showOnLeaderboard,
      showCertificates,
      showOnlineStatus,
      allowMessages,
      dataSharing,
      // Appearance settings
      theme,
      fontSize,
      compactMode,
      reducedMotion,
      sidebarPosition,
      // User profile updates
      name,
      bio,
      phone,
      // Password change
      currentPassword,
      newPassword,
      // Email change
      newEmail,
    } = body

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    // Verify student exists
    const user = await db.user.findUnique({
      where: { id: studentId },
    })
    if (!user) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    if (user.role !== 'student') {
      return NextResponse.json({ error: 'User is not a student' }, { status: 403 })
    }

    // --- Validate enum fields ---
    for (const [field, validValues] of Object.entries(validEnums)) {
      const value = body[field]
      if (value !== undefined && !validValues.includes(value)) {
        return NextResponse.json(
          { error: `Invalid value for ${field}: must be one of ${validValues.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Validate dailyGoalMinutes
    if (dailyGoalMinutes !== undefined && !validDailyGoalMinutes.includes(dailyGoalMinutes)) {
      return NextResponse.json(
        { error: `Invalid dailyGoalMinutes: must be one of ${validDailyGoalMinutes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate reminderTime format (HH:mm)
    if (reminderTime !== undefined) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
      if (!timeRegex.test(reminderTime)) {
        return NextResponse.json(
          { error: 'Invalid reminderTime: must be in HH:mm format (e.g., 20:00)' },
          { status: 400 }
        )
      }
    }

    // Validate URL fields
    if (website !== undefined && website !== null && website !== '') {
      try {
        new URL(website)
      } catch {
        return NextResponse.json(
          { error: 'Invalid website URL' },
          { status: 400 }
        )
      }
    }
    if (linkedin !== undefined && linkedin !== null && linkedin !== '') {
      try {
        new URL(linkedin)
      } catch {
        return NextResponse.json(
          { error: 'Invalid LinkedIn URL' },
          { status: 400 }
        )
      }
    }

    // --- Handle password change ---
    if (currentPassword && newPassword) {
      if (!user.passwordHash) {
        return NextResponse.json(
          { error: 'No password set for this account. Cannot change password.' },
          { status: 400 }
        )
      }
      // Simple comparison for demo (no bcrypt)
      if (currentPassword !== user.passwordHash) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 401 }
        )
      }
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters' },
          { status: 400 }
        )
      }
      // Update password directly (demo: store plain text)
      await db.user.update({
        where: { id: studentId },
        data: { passwordHash: newPassword },
      })
    }

    // --- Handle email change ---
    if (newEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newEmail)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }
      // Check if email is already taken
      const existingUser = await db.user.findUnique({
        where: { email: newEmail },
      })
      if (existingUser && existingUser.id !== studentId) {
        return NextResponse.json(
          { error: 'Email is already in use by another account' },
          { status: 409 }
        )
      }
      await db.user.update({
        where: { id: studentId },
        data: { email: newEmail },
      })
    }

    // --- Handle user profile updates (name, bio, phone) ---
    const userUpdateData: Record<string, unknown> = {}
    if (name !== undefined) userUpdateData.name = name
    if (bio !== undefined) userUpdateData.bio = bio
    if (phone !== undefined) userUpdateData.phone = phone

    // Also sync language from preferredLang if it's en or ur
    if (preferredLang !== undefined && (preferredLang === 'en' || preferredLang === 'ur')) {
      userUpdateData.language = preferredLang
    }

    // Handle mfaEnabled toggle
    if (body.mfaEnabled !== undefined) {
      userUpdateData.mfaEnabled = body.mfaEnabled
    }

    if (Object.keys(userUpdateData).length > 0) {
      await db.user.update({
        where: { id: studentId },
        data: userUpdateData,
      })
    }

    // --- Build settings data for upsert ---
    const settingsUpdateData: Record<string, unknown> = {}
    const settingsCreateData: Record<string, unknown> = { studentId }

    // Helper: add a field to both update and create data if provided
    const addField = (key: string, value: unknown, defaultValue: unknown) => {
      if (value !== undefined) {
        settingsUpdateData[key] = value
        settingsCreateData[key] = value
      } else {
        settingsCreateData[key] = defaultValue
      }
    }

    // Profile fields
    addField('headline', headline, defaultSettings.headline)
    addField('location', location, defaultSettings.location)
    addField('website', website, defaultSettings.website)
    addField('linkedin', linkedin, defaultSettings.linkedin)
    // Learning preferences
    addField('learningGoalType', learningGoalType, defaultSettings.learningGoalType)
    addField('dailyGoalMinutes', dailyGoalMinutes, defaultSettings.dailyGoalMinutes)
    addField('reminderTime', reminderTime, defaultSettings.reminderTime)
    addField('videoQuality', videoQuality, defaultSettings.videoQuality)
    addField('playbackSpeed', playbackSpeed, defaultSettings.playbackSpeed)
    addField('preferredLang', preferredLang, defaultSettings.preferredLang)
    addField('aiTutorMode', aiTutorMode, defaultSettings.aiTutorMode)
    addField('offlineDownloads', offlineDownloads, defaultSettings.offlineDownloads)
    addField('autoPlay', autoPlay, defaultSettings.autoPlay)
    addField('showSubtitles', showSubtitles, defaultSettings.showSubtitles)
    addField('focusMode', focusMode, defaultSettings.focusMode)
    addField('spacedRepetition', spacedRepetition, defaultSettings.spacedRepetition)
    // In-app notification preferences
    addField('notifyDailyReminder', notifyDailyReminder, defaultSettings.notifyDailyReminder)
    addField('notifyAssignmentDue', notifyAssignmentDue, defaultSettings.notifyAssignmentDue)
    addField('notifyInstructorReply', notifyInstructorReply, defaultSettings.notifyInstructorReply)
    addField('notifyLiveSession', notifyLiveSession, defaultSettings.notifyLiveSession)
    addField('notifyNewCourse', notifyNewCourse, defaultSettings.notifyNewCourse)
    addField('notifyStreakRisk', notifyStreakRisk, defaultSettings.notifyStreakRisk)
    addField('notifyCertificate', notifyCertificate, defaultSettings.notifyCertificate)
    addField('notifyPlatformUpdates', notifyPlatformUpdates, defaultSettings.notifyPlatformUpdates)
    // Email notification preferences
    addField('emailDailyReminder', emailDailyReminder, defaultSettings.emailDailyReminder)
    addField('emailAssignmentDue', emailAssignmentDue, defaultSettings.emailAssignmentDue)
    addField('emailInstructorReply', emailInstructorReply, defaultSettings.emailInstructorReply)
    addField('emailLiveSession', emailLiveSession, defaultSettings.emailLiveSession)
    addField('emailNewCourse', emailNewCourse, defaultSettings.emailNewCourse)
    addField('emailStreakRisk', emailStreakRisk, defaultSettings.emailStreakRisk)
    addField('emailCertificate', emailCertificate, defaultSettings.emailCertificate)
    addField('emailPlatformUpdates', emailPlatformUpdates, defaultSettings.emailPlatformUpdates)
    // Privacy settings
    addField('profileVisibility', profileVisibility, defaultSettings.profileVisibility)
    addField('showProgress', showProgress, defaultSettings.showProgress)
    addField('showOnLeaderboard', showOnLeaderboard, defaultSettings.showOnLeaderboard)
    addField('showCertificates', showCertificates, defaultSettings.showCertificates)
    addField('showOnlineStatus', showOnlineStatus, defaultSettings.showOnlineStatus)
    addField('allowMessages', allowMessages, defaultSettings.allowMessages)
    addField('dataSharing', dataSharing, defaultSettings.dataSharing)
    // Appearance settings
    addField('theme', theme, defaultSettings.theme)
    addField('fontSize', fontSize, defaultSettings.fontSize)
    addField('compactMode', compactMode, defaultSettings.compactMode)
    addField('reducedMotion', reducedMotion, defaultSettings.reducedMotion)
    addField('sidebarPosition', sidebarPosition, defaultSettings.sidebarPosition)

    // Upsert settings
    const settings = await db.studentSettings.upsert({
      where: { studentId },
      update: settingsUpdateData as Parameters<typeof db.studentSettings.upsert>[0]['update'],
      create: settingsCreateData as Parameters<typeof db.studentSettings.upsert>[0]['create'],
    })

    // Fetch updated user to return latest profile info
    const updatedUser = await db.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        phone: true,
        mfaEnabled: true,
        authProvider: true,
        language: true,
      },
    })

    return NextResponse.json({
      settings,
      user: updatedUser,
      message: 'Student settings updated successfully',
    })
  } catch (error) {
    console.error('Error updating student settings:', error)
    return NextResponse.json({ error: 'Failed to update student settings' }, { status: 500 })
  }
}

// DELETE /api/student/settings — Delete student account and all related records
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId } = body

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    // Verify student exists
    const user = await db.user.findUnique({
      where: { id: studentId },
    })
    if (!user) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    if (user.role !== 'student') {
      return NextResponse.json({ error: 'User is not a student' }, { status: 403 })
    }

    // Delete the user — cascading deletes in the schema handle related records
    // We use a transaction for safety
    await db.$transaction(async (tx) => {
      // Delete student settings first (has relation to user)
      await tx.studentSettings.deleteMany({
        where: { studentId },
      })

      // Delete instructor application if exists
      await tx.instructorApplication.deleteMany({
        where: { userId: studentId },
      })

      // Delete commission override if exists
      await tx.commissionOverride.deleteMany({
        where: { instructorId: studentId },
      })

      // Delete instructor settings if exists (edge case: user was instructor before)
      await tx.instructorSettings.deleteMany({
        where: { instructorId: studentId },
      })

      // Delete instructor profile if exists
      await tx.instructorProfile.deleteMany({
        where: { instructorId: studentId },
      })

      // Delete payout methods
      await tx.payoutMethod.deleteMany({
        where: { instructorId: studentId },
      })

      // Delete payouts
      await tx.payout.deleteMany({
        where: { instructorId: studentId },
      })

      // Delete QA settings
      await tx.qASettings.deleteMany({
        where: { instructorId: studentId },
      })

      // Delete activity logs
      await tx.activityLog.deleteMany({
        where: { userId: studentId },
      })

      // Delete lesson bookmarks
      await tx.lessonBookmark.deleteMany({
        where: { userId: studentId },
      })

      // Delete lesson notes
      await tx.lessonNote.deleteMany({
        where: { userId: studentId },
      })

      // Delete user skills
      await tx.userSkill.deleteMany({
        where: { userId: studentId },
      })

      // Delete learning goals
      await tx.learningGoal.deleteMany({
        where: { userId: studentId },
      })

      // Delete user challenges
      await tx.userChallenge.deleteMany({
        where: { userId: studentId },
      })

      // Delete streak freezes
      await tx.streakFreeze.deleteMany({
        where: { userId: studentId },
      })

      // Delete XP activities
      await tx.xpActivity.deleteMany({
        where: { userId: studentId },
      })

      // Delete discussion bookmarks
      await tx.discussionBookmark.deleteMany({
        where: { userId: studentId },
      })

      // Delete discussion upvotes
      await tx.discussionUpvote.deleteMany({
        where: { userId: studentId },
      })

      // Delete discussion replies
      await tx.discussionReply.deleteMany({
        where: { userId: studentId },
      })

      // Delete discussion posts
      await tx.discussionPost.deleteMany({
        where: { userId: studentId },
      })

      // Delete study group messages
      await tx.studyGroupMessage.deleteMany({
        where: { userId: studentId },
      })

      // Delete study group resources
      await tx.studyGroupResource.deleteMany({
        where: { userId: studentId },
      })

      // Delete event attendances
      await tx.eventAttendee.deleteMany({
        where: { userId: studentId },
      })

      // Delete schedule events
      await tx.scheduleEvent.deleteMany({
        where: { userId: studentId },
      })

      // Delete community events created
      await tx.communityEvent.deleteMany({
        where: { createdBy: studentId },
      })

      // Delete study group memberships
      await tx.studyGroupMember.deleteMany({
        where: { userId: studentId },
      })

      // Delete peer reviews given/received
      await tx.peerReview.deleteMany({
        where: { reviewerId: studentId },
      })
      await tx.peerReview.deleteMany({
        where: { revieweeId: studentId },
      })

      // Delete session attendees
      await tx.sessionAttendee.deleteMany({
        where: { userId: studentId },
      })

      // Delete conversation participants
      await tx.conversationParticipant.deleteMany({
        where: { userId: studentId },
      })

      // Delete messages sent
      await tx.message.deleteMany({
        where: { senderId: studentId },
      })

      // Delete notifications
      await tx.notification.deleteMany({
        where: { userId: studentId },
      })

      // Delete wishlist items
      await tx.wishlist.deleteMany({
        where: { userId: studentId },
      })

      // Delete reviews
      await tx.review.deleteMany({
        where: { userId: studentId },
      })

      // Delete chat messages (Ask ShijlAI)
      await tx.chatMessage.deleteMany({
        where: { userId: studentId },
      })

      // Delete tutor sessions
      await tx.tutorSession.deleteMany({
        where: { userId: studentId },
      })

      // Delete user badges
      await tx.userBadge.deleteMany({
        where: { userId: studentId },
      })

      // Delete quiz attempts
      await tx.quizAttempt.deleteMany({
        where: { userId: studentId },
      })

      // Delete QA answers
      await tx.qAAnswer.deleteMany({
        where: { userId: studentId },
      })

      // Delete QA questions
      await tx.qAQuestion.deleteMany({
        where: { userId: studentId },
      })

      // Delete submissions
      await tx.submission.deleteMany({
        where: { studentId },
      })

      // Delete parent links (as parent or child)
      await tx.parentLink.deleteMany({
        where: { parentId: studentId },
      })
      await tx.parentLink.deleteMany({
        where: { childId: studentId },
      })

      // Delete certificates
      await tx.certificate.deleteMany({
        where: { userId: studentId },
      })

      // Delete enrollment lesson progress (must delete before enrollments)
      const enrollments = await tx.enrollment.findMany({
        where: { userId: studentId },
        select: { id: true },
      })
      if (enrollments.length > 0) {
        const enrollmentIds = enrollments.map((e) => e.id)
        await tx.lessonProgress.deleteMany({
          where: { enrollmentId: { in: enrollmentIds } },
        })
        // Delete lesson notes tied to enrollments
        await tx.lessonNote.deleteMany({
          where: { enrollmentId: { in: enrollmentIds } },
        })
        // Delete lesson bookmarks tied to enrollments
        await tx.lessonBookmark.deleteMany({
          where: { enrollmentId: { in: enrollmentIds } },
        })
        // Delete reviews tied to enrollments
        await tx.review.deleteMany({
          where: { enrollmentId: { in: enrollmentIds } },
        })
      }

      // Delete enrollments
      await tx.enrollment.deleteMany({
        where: { userId: studentId },
      })

      // Delete transactions (as student)
      await tx.transaction.deleteMany({
        where: { studentId },
      })
      // Delete transactions (as instructor)
      await tx.transaction.deleteMany({
        where: { instructorId: studentId },
      })

      // Delete disputes on user's transactions
      // (handled by transaction cascade or manual cleanup)

      // Finally, delete the user
      await tx.user.delete({
        where: { id: studentId },
      })
    })

    return NextResponse.json({
      message: 'Student account and all related data deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting student account:', error)
    return NextResponse.json({ error: 'Failed to delete student account' }, { status: 500 })
  }
}
