import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Default settings when none exist
const defaultSettings = {
  notifyEnrollment: 'in-app',
  notifyQA: 'in-app',
  notifyReview: 'in-app',
  notifyAssignment: 'in-app',
  notifyMessage: 'in-app',
  notifyCourseApproved: 'in-app',
  notifyPayout: 'in-app',
  notifyPromotion: 'off',
  payoutSchedule: 'monthly',
  payoutThreshold: 2000,
  integrations: null,
  // Appearance & Preferences
  theme: 'system',
  compactMode: false,
  sidebarPosition: 'left',
  fontSize: 'medium',
  // Privacy
  profileVisibility: 'public',
  showEmail: false,
  showPhone: false,
  showRevenue: false,
  showStudentCount: true,
  // Regional & Format
  timezone: 'Asia/Karachi',
  dateFormat: 'DD/MM/YYYY',
  currency: 'USD',
  preferredLanguage: 'en',
  // Email preferences
  emailDigest: 'daily',
  marketingEmails: true,
  securityAlertEmails: true,
  courseUpdateEmails: true,
  // Editor & Course preferences
  autoSaveDrafts: true,
  defaultCourseLanguage: 'en',
  videoQuality: '1080p',
}

// GET /api/instructor/settings — Fetch instructor settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    // Verify instructor exists
    const instructor = await db.user.findUnique({
      where: { id: instructorId },
      select: { id: true, role: true },
    })
    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
    }

    // Fetch settings (or return defaults if none exist)
    const settings = await db.instructorSettings.findUnique({
      where: { instructorId },
    })

    if (!settings) {
      return NextResponse.json({
        settings: defaultSettings,
        isDefault: true,
      })
    }

    // Parse integrations JSON string for frontend consumption
    let integrations = null
    if (settings.integrations) {
      try { integrations = JSON.parse(settings.integrations) } catch { integrations = null }
    }

    return NextResponse.json({
      settings: {
        id: settings.id,
        instructorId: settings.instructorId,
        notifyEnrollment: settings.notifyEnrollment,
        notifyQA: settings.notifyQA,
        notifyReview: settings.notifyReview,
        notifyAssignment: settings.notifyAssignment,
        notifyMessage: settings.notifyMessage,
        notifyCourseApproved: settings.notifyCourseApproved,
        notifyPayout: settings.notifyPayout,
        notifyPromotion: settings.notifyPromotion,
        payoutSchedule: settings.payoutSchedule,
        payoutThreshold: settings.payoutThreshold,
        defaultPayoutMethodId: settings.defaultPayoutMethodId,
        integrations,
        // Appearance & Preferences
        theme: settings.theme,
        compactMode: settings.compactMode,
        sidebarPosition: settings.sidebarPosition,
        fontSize: settings.fontSize,
        // Privacy
        profileVisibility: settings.profileVisibility,
        showEmail: settings.showEmail,
        showPhone: settings.showPhone,
        showRevenue: settings.showRevenue,
        showStudentCount: settings.showStudentCount,
        // Regional & Format
        timezone: settings.timezone,
        dateFormat: settings.dateFormat,
        currency: settings.currency,
        preferredLanguage: settings.preferredLanguage,
        // Email preferences
        emailDigest: settings.emailDigest,
        marketingEmails: settings.marketingEmails,
        securityAlertEmails: settings.securityAlertEmails,
        courseUpdateEmails: settings.courseUpdateEmails,
        // Editor & Course preferences
        autoSaveDrafts: settings.autoSaveDrafts,
        defaultCourseLanguage: settings.defaultCourseLanguage,
        videoQuality: settings.videoQuality,
        // Account status
        deactivatedAt: settings.deactivatedAt,
        deletionRequestedAt: settings.deletionRequestedAt,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
      },
      isDefault: false,
    })
  } catch (error) {
    console.error('Error fetching instructor settings:', error)
    return NextResponse.json({ error: 'Failed to fetch instructor settings' }, { status: 500 })
  }
}

// POST /api/instructor/settings — Upsert instructor settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      instructorId,
      notifyEnrollment,
      notifyQA,
      notifyReview,
      notifyAssignment,
      notifyMessage,
      notifyCourseApproved,
      notifyPayout,
      notifyPromotion,
      payoutSchedule,
      payoutThreshold,
      integrations,
      // Appearance & Preferences
      theme,
      compactMode,
      sidebarPosition,
      fontSize,
      // Privacy
      profileVisibility,
      showEmail,
      showPhone,
      showRevenue,
      showStudentCount,
      // Regional & Format
      timezone,
      dateFormat,
      currency,
      preferredLanguage,
      // Email preferences
      emailDigest,
      marketingEmails,
      securityAlertEmails,
      courseUpdateEmails,
      // Editor & Course preferences
      autoSaveDrafts,
      defaultCourseLanguage,
      videoQuality,
    } = body

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    // Verify instructor exists
    const instructor = await db.user.findUnique({
      where: { id: instructorId },
      select: { id: true },
    })
    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
    }

    // Validate notification values
    const validNotificationValues = ['in-app', 'email', 'off']
    const notificationFields = {
      notifyEnrollment,
      notifyQA,
      notifyReview,
      notifyAssignment,
      notifyMessage,
      notifyCourseApproved,
      notifyPayout,
      notifyPromotion,
    }

    for (const [key, value] of Object.entries(notificationFields)) {
      if (value !== undefined && !validNotificationValues.includes(value)) {
        return NextResponse.json(
          { error: `Invalid value for ${key}: must be one of ${validNotificationValues.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Validate payout schedule
    if (payoutSchedule !== undefined && !['monthly', 'on_request'].includes(payoutSchedule)) {
      return NextResponse.json(
        { error: 'Invalid payoutSchedule: must be monthly or on_request' },
        { status: 400 }
      )
    }

    // Validate payout threshold
    if (payoutThreshold !== undefined && (typeof payoutThreshold !== 'number' || payoutThreshold < 0)) {
      return NextResponse.json(
        { error: 'Invalid payoutThreshold: must be a non-negative number' },
        { status: 400 }
      )
    }

    // Validate theme
    if (theme !== undefined && !['light', 'dark', 'system'].includes(theme)) {
      return NextResponse.json(
        { error: 'Invalid theme: must be light, dark, or system' },
        { status: 400 }
      )
    }

    // Validate sidebarPosition
    if (sidebarPosition !== undefined && !['left', 'right'].includes(sidebarPosition)) {
      return NextResponse.json(
        { error: 'Invalid sidebarPosition: must be left or right' },
        { status: 400 }
      )
    }

    // Validate fontSize
    if (fontSize !== undefined && !['small', 'medium', 'large'].includes(fontSize)) {
      return NextResponse.json(
        { error: 'Invalid fontSize: must be small, medium, or large' },
        { status: 400 }
      )
    }

    // Validate profileVisibility
    if (profileVisibility !== undefined && !['public', 'limited', 'private'].includes(profileVisibility)) {
      return NextResponse.json(
        { error: 'Invalid profileVisibility: must be public, limited, or private' },
        { status: 400 }
      )
    }

    // Validate dateFormat
    if (dateFormat !== undefined && !['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].includes(dateFormat)) {
      return NextResponse.json(
        { error: 'Invalid dateFormat: must be DD/MM/YYYY, MM/DD/YYYY, or YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Validate emailDigest
    if (emailDigest !== undefined && !['immediately', 'daily', 'weekly', 'off'].includes(emailDigest)) {
      return NextResponse.json(
        { error: 'Invalid emailDigest: must be immediately, daily, weekly, or off' },
        { status: 400 }
      )
    }

    // Validate videoQuality
    if (videoQuality !== undefined && !['720p', '1080p', '4k'].includes(videoQuality)) {
      return NextResponse.json(
        { error: 'Invalid videoQuality: must be 720p, 1080p, or 4k' },
        { status: 400 }
      )
    }

    // Validate boolean fields
    const booleanFields = { compactMode, showEmail, showPhone, showRevenue, showStudentCount, marketingEmails, securityAlertEmails, courseUpdateEmails, autoSaveDrafts }
    for (const [key, value] of Object.entries(booleanFields)) {
      if (value !== undefined && typeof value !== 'boolean') {
        return NextResponse.json(
          { error: `Invalid ${key}: must be a boolean` },
          { status: 400 }
        )
      }
    }

    // Validate string fields are strings if provided
    const stringFields = { timezone, currency, preferredLanguage, defaultCourseLanguage }
    for (const [key, value] of Object.entries(stringFields)) {
      if (value !== undefined && typeof value !== 'string') {
        return NextResponse.json(
          { error: `Invalid ${key}: must be a string` },
          { status: 400 }
        )
      }
    }

    // Prepare integrations as JSON string if provided
    const integrationsValue = integrations !== undefined
      ? (typeof integrations === 'string' ? integrations : JSON.stringify(integrations))
      : undefined

    // Upsert settings
    const settings = await db.instructorSettings.upsert({
      where: { instructorId },
      update: {
        ...(notifyEnrollment !== undefined && { notifyEnrollment }),
        ...(notifyQA !== undefined && { notifyQA }),
        ...(notifyReview !== undefined && { notifyReview }),
        ...(notifyAssignment !== undefined && { notifyAssignment }),
        ...(notifyMessage !== undefined && { notifyMessage }),
        ...(notifyCourseApproved !== undefined && { notifyCourseApproved }),
        ...(notifyPayout !== undefined && { notifyPayout }),
        ...(notifyPromotion !== undefined && { notifyPromotion }),
        ...(payoutSchedule !== undefined && { payoutSchedule }),
        ...(payoutThreshold !== undefined && { payoutThreshold }),
        ...(integrationsValue !== undefined && { integrations: integrationsValue }),
        // Appearance & Preferences
        ...(theme !== undefined && { theme }),
        ...(compactMode !== undefined && { compactMode }),
        ...(sidebarPosition !== undefined && { sidebarPosition }),
        ...(fontSize !== undefined && { fontSize }),
        // Privacy
        ...(profileVisibility !== undefined && { profileVisibility }),
        ...(showEmail !== undefined && { showEmail }),
        ...(showPhone !== undefined && { showPhone }),
        ...(showRevenue !== undefined && { showRevenue }),
        ...(showStudentCount !== undefined && { showStudentCount }),
        // Regional & Format
        ...(timezone !== undefined && { timezone }),
        ...(dateFormat !== undefined && { dateFormat }),
        ...(currency !== undefined && { currency }),
        ...(preferredLanguage !== undefined && { preferredLanguage }),
        // Email preferences
        ...(emailDigest !== undefined && { emailDigest }),
        ...(marketingEmails !== undefined && { marketingEmails }),
        ...(securityAlertEmails !== undefined && { securityAlertEmails }),
        ...(courseUpdateEmails !== undefined && { courseUpdateEmails }),
        // Editor & Course preferences
        ...(autoSaveDrafts !== undefined && { autoSaveDrafts }),
        ...(defaultCourseLanguage !== undefined && { defaultCourseLanguage }),
        ...(videoQuality !== undefined && { videoQuality }),
      },
      create: {
        instructorId,
        notifyEnrollment: notifyEnrollment || defaultSettings.notifyEnrollment,
        notifyQA: notifyQA || defaultSettings.notifyQA,
        notifyReview: notifyReview || defaultSettings.notifyReview,
        notifyAssignment: notifyAssignment || defaultSettings.notifyAssignment,
        notifyMessage: notifyMessage || defaultSettings.notifyMessage,
        notifyCourseApproved: notifyCourseApproved || defaultSettings.notifyCourseApproved,
        notifyPayout: notifyPayout || defaultSettings.notifyPayout,
        notifyPromotion: notifyPromotion || defaultSettings.notifyPromotion,
        payoutSchedule: payoutSchedule || defaultSettings.payoutSchedule,
        payoutThreshold: payoutThreshold || defaultSettings.payoutThreshold,
        integrations: integrationsValue || null,
        // Appearance & Preferences
        theme: theme || defaultSettings.theme,
        compactMode: compactMode !== undefined ? compactMode : defaultSettings.compactMode,
        sidebarPosition: sidebarPosition || defaultSettings.sidebarPosition,
        fontSize: fontSize || defaultSettings.fontSize,
        // Privacy
        profileVisibility: profileVisibility || defaultSettings.profileVisibility,
        showEmail: showEmail !== undefined ? showEmail : defaultSettings.showEmail,
        showPhone: showPhone !== undefined ? showPhone : defaultSettings.showPhone,
        showRevenue: showRevenue !== undefined ? showRevenue : defaultSettings.showRevenue,
        showStudentCount: showStudentCount !== undefined ? showStudentCount : defaultSettings.showStudentCount,
        // Regional & Format
        timezone: timezone || defaultSettings.timezone,
        dateFormat: dateFormat || defaultSettings.dateFormat,
        currency: currency || defaultSettings.currency,
        preferredLanguage: preferredLanguage || defaultSettings.preferredLanguage,
        // Email preferences
        emailDigest: emailDigest || defaultSettings.emailDigest,
        marketingEmails: marketingEmails !== undefined ? marketingEmails : defaultSettings.marketingEmails,
        securityAlertEmails: securityAlertEmails !== undefined ? securityAlertEmails : defaultSettings.securityAlertEmails,
        courseUpdateEmails: courseUpdateEmails !== undefined ? courseUpdateEmails : defaultSettings.courseUpdateEmails,
        // Editor & Course preferences
        autoSaveDrafts: autoSaveDrafts !== undefined ? autoSaveDrafts : defaultSettings.autoSaveDrafts,
        defaultCourseLanguage: defaultCourseLanguage || defaultSettings.defaultCourseLanguage,
        videoQuality: videoQuality || defaultSettings.videoQuality,
      },
    })

    return NextResponse.json({
      settings,
      message: 'Instructor settings updated successfully',
    })
  } catch (error) {
    console.error('Error updating instructor settings:', error)
    return NextResponse.json({ error: 'Failed to update instructor settings' }, { status: 500 })
  }
}
