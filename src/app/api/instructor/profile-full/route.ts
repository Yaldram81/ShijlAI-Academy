import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function roundTo(num: number, decimals = 2): number {
  const factor = Math.pow(10, decimals)
  return Math.round(num * factor) / factor
}

// ─── GET /api/instructor/profile-full?instructorId=xxx ────────────────────────
// Returns comprehensive instructor profile data with stats, courses, payouts, etc.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    // ── 1. Personal Info ────────────────────────────────────────────────────
    const user = await db.user.findUnique({
      where: { id: instructorId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        phone: true,
        language: true,
        isVerified: true,
        mfaEnabled: true,
        createdAt: true,
        lastActiveAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
    }

    // ── 2. Instructor Profile ───────────────────────────────────────────────
    const profile = await db.instructorProfile.findUnique({
      where: { instructorId },
    })

    const expertise = safeJsonParse<string[]>(profile?.expertise, [])
    const languages = safeJsonParse<Array<{ name: string; verified: boolean }>>(profile?.languages, [])

    // ── 3-7. Parallel queries for stats, courses, payouts, reviews ──────────
    const [
      courseStats,
      topCourses,
      totalRevenueResult,
      thisMonthRevenueResult,
      payoutSummary,
      defaultPayoutMethod,
      totalEarnedResult,
      completedPayoutsResult,
      totalReviewsResult,
      avgCompletionResult,
    ] = await Promise.all([
      // Course counts
      Promise.all([
        db.course.count({ where: { instructorId } }),
        db.course.count({ where: { instructorId, isPublished: true } }),
        db.course.count({ where: { instructorId, isPublished: false } }),
      ]),

      // Top 6 courses for showcase
      db.course.findMany({
        where: { instructorId },
        select: {
          id: true,
          title: true,
          thumbnail: true,
          category: true,
          level: true,
          price: true,
          enrollmentCount: true,
          rating: true,
          isPublished: true,
          reviewStatus: true,
        },
        orderBy: { enrollmentCount: 'desc' },
        take: 6,
      }),

      // Total revenue (sum of instructorEarning for enrollment transactions)
      db.transaction.aggregate({
        _sum: { instructorEarning: true },
        where: {
          instructorId,
          type: 'enrollment',
          status: 'completed',
        },
      }),

      // This month's revenue
      db.transaction.aggregate({
        _sum: { instructorEarning: true },
        where: {
          instructorId,
          type: 'enrollment',
          status: 'completed',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),

      // Payout summary: pending + processing payouts
      db.payout.aggregate({
        _sum: { amount: true },
        where: {
          instructorId,
          status: { in: ['pending', 'processing'] },
        },
      }),

      // Default payout method
      db.payoutMethod.findFirst({
        where: { instructorId, isDefault: true, isActive: true },
        select: {
          id: true,
          type: true,
          bankName: true,
          accountNumber: true,
          phoneNumber: true,
          email: true,
        },
      }),

      // Total earned (all time from instructorEarning on completed enrollment txns)
      db.transaction.aggregate({
        _sum: { instructorEarning: true },
        where: {
          instructorId,
          type: 'enrollment',
          status: 'completed',
        },
      }),

      // Total paid out (completed payouts)
      db.payout.aggregate({
        _sum: { amount: true },
        where: {
          instructorId,
          status: 'completed',
        },
      }),

      // Total reviews received for instructor's courses
      db.review.count({
        where: {
          course: { instructorId },
        },
      }),

      // Average completion rate across instructor's courses
      db.enrollment.aggregate({
        _avg: { progress: true },
        where: {
          course: { instructorId },
        },
      }),
    ])

    // ── Student count (distinct userId across all instructor's courses) ──────
    const distinctStudents = await db.enrollment.findMany({
      where: { course: { instructorId } },
      select: { userId: true },
      distinct: ['userId'],
    })
    const totalStudents = distinctStudents.length

    // ── Average course rating ────────────────────────────────────────────────
    const avgRatingResult = await db.course.aggregate({
      _avg: { rating: true },
      where: { instructorId },
    })

    // ── Destructure course stats ────────────────────────────────────────────
    const [totalCourses, publishedCourses, draftCourses] = courseStats

    // ── Calculate available balance ─────────────────────────────────────────
    const totalEarned = totalEarnedResult._sum.instructorEarning ?? 0
    const totalPaidOut = completedPayoutsResult._sum.amount ?? 0
    const pendingPayouts = payoutSummary._sum.amount ?? 0
    const availableBalance = Math.max(0, totalEarned - totalPaidOut - pendingPayouts)

    // ── 7. Profile Completion Score ─────────────────────────────────────────
    let filledFields = 0
    const totalFields = 12

    // Basic: name, avatar, bio
    if (user.name && user.name.trim().length > 0) filledFields++
    if (user.avatar) filledFields++
    if (user.bio && user.bio.trim().length > 0) filledFields++

    // Professional: headline, expertise, languages
    if (profile?.headline && profile.headline.trim().length > 0) filledFields++
    if (expertise.length > 0) filledFields++
    if (languages.length > 0) filledFields++

    // Social: website, linkedin, twitter, youtube
    if (profile?.website && profile.website.trim().length > 0) filledFields++
    if (profile?.linkedin && profile.linkedin.trim().length > 0) filledFields++
    if (profile?.twitter && profile.twitter.trim().length > 0) filledFields++
    if (profile?.youtube && profile.youtube.trim().length > 0) filledFields++

    // Verification: phone, ntn/cnic
    if (user.phone && user.phone.trim().length > 0) filledFields++
    if ((profile?.ntn && profile.ntn.trim().length > 0) || (profile?.cnic && profile.cnic.trim().length > 0)) filledFields++

    const profileCompletionScore = Math.round((filledFields / totalFields) * 100)

    // ── Assemble response ───────────────────────────────────────────────────
    return NextResponse.json({
      // 1. Personal Info
      personalInfo: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        phone: user.phone,
        language: user.language,
        isVerified: user.isVerified,
        mfaEnabled: user.mfaEnabled,
        createdAt: user.createdAt,
        lastActiveAt: user.lastActiveAt,
      },

      // 2. Instructor Profile
      instructorProfile: profile
        ? {
            headline: profile.headline,
            website: profile.website,
            linkedin: profile.linkedin,
            twitter: profile.twitter,
            youtube: profile.youtube,
            expertise,
            languages,
            ntn: profile.ntn,
            ntnVerified: profile.ntnVerified,
            applicationStatus: profile.applicationStatus,
            cnic: profile.cnic,
            topicProposal: profile.topicProposal,
          }
        : {
            headline: null,
            website: null,
            linkedin: null,
            twitter: null,
            youtube: null,
            expertise: [],
            languages: [],
            ntn: null,
            ntnVerified: false,
            applicationStatus: null,
            cnic: null,
            topicProposal: null,
          },

      // 3. Teaching Stats
      teachingStats: {
        totalCourses,
        publishedCourses,
        draftCourses,
        totalStudents,
        avgCourseRating: roundTo(avgRatingResult._avg.rating ?? 0, 1),
        totalRevenue: roundTo(totalRevenueResult._sum.instructorEarning ?? 0),
        thisMonthRevenue: roundTo(thisMonthRevenueResult._sum.instructorEarning ?? 0),
        avgCompletionRate: roundTo(avgCompletionResult._avg.progress ?? 0, 1),
        totalReviews: totalReviewsResult,
      },

      // 4. Course Showcase
      courseShowcase: topCourses.map((c) => ({
        id: c.id,
        title: c.title,
        thumbnail: c.thumbnail,
        category: c.category,
        level: c.level,
        price: c.price,
        enrollmentCount: c.enrollmentCount,
        rating: c.rating,
        isPublished: c.isPublished,
        reviewStatus: c.reviewStatus,
      })),

      // 5. Payout Summary
      payoutSummary: {
        availableBalance: roundTo(availableBalance),
        defaultPayoutMethod: defaultPayoutMethod
          ? {
              id: defaultPayoutMethod.id,
              type: defaultPayoutMethod.type,
              bankName: defaultPayoutMethod.bankName,
              accountNumber: defaultPayoutMethod.accountNumber,
              phoneNumber: defaultPayoutMethod.phoneNumber,
              email: defaultPayoutMethod.email,
            }
          : null,
        totalEarned: roundTo(totalEarned),
        totalPaidOut: roundTo(totalPaidOut),
      },

      // 6. Verification Status
      verificationStatus: {
        isVerified: user.isVerified,
        mfaEnabled: user.mfaEnabled,
        ntnVerified: profile?.ntnVerified ?? false,
        applicationStatus: profile?.applicationStatus ?? null,
      },

      // 7. Profile Completion Score
      profileCompletion: {
        score: profileCompletionScore,
        filledFields,
        totalFields,
        breakdown: {
          basic: {
            name: !!(user.name && user.name.trim().length > 0),
            avatar: !!user.avatar,
            bio: !!(user.bio && user.bio.trim().length > 0),
          },
          professional: {
            headline: !!(profile?.headline && profile.headline.trim().length > 0),
            expertise: expertise.length > 0,
            languages: languages.length > 0,
          },
          social: {
            website: !!(profile?.website && profile.website.trim().length > 0),
            linkedin: !!(profile?.linkedin && profile.linkedin.trim().length > 0),
            twitter: !!(profile?.twitter && profile.twitter.trim().length > 0),
            youtube: !!(profile?.youtube && profile.youtube.trim().length > 0),
          },
          verification: {
            phone: !!(user.phone && user.phone.trim().length > 0),
            ntnOrCnic: !!((profile?.ntn && profile.ntn.trim().length > 0) || (profile?.cnic && profile.cnic.trim().length > 0)),
          },
        },
      },
    })
  } catch (error) {
    console.error('Error fetching full instructor profile:', error)
    return NextResponse.json({ error: 'Failed to fetch instructor profile' }, { status: 500 })
  }
}

// ─── PATCH /api/instructor/profile-full ───────────────────────────────────────
// Update instructor profile fields (User + InstructorProfile upsert)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      instructorId,
      // User fields
      name,
      bio,
      phone,
      // InstructorProfile fields
      headline,
      website,
      linkedin,
      twitter,
      youtube,
      expertise,
      languages,
    } = body

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    // Verify instructor exists
    const instructor = await db.user.findUnique({
      where: { id: instructorId },
    })
    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
    }

    // ── Update User model fields ────────────────────────────────────────────
    const userUpdateData: Record<string, unknown> = {}
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'Name must be a non-empty string' }, { status: 400 })
      }
      userUpdateData.name = name.trim()
    }
    if (bio !== undefined) {
      userUpdateData.bio = bio
    }
    if (phone !== undefined) {
      userUpdateData.phone = phone
    }

    if (Object.keys(userUpdateData).length > 0) {
      await db.user.update({
        where: { id: instructorId },
        data: userUpdateData,
      })
    }

    // ── Upsert InstructorProfile ────────────────────────────────────────────
    const profileUpdateData: Record<string, unknown> = {}
    if (headline !== undefined) profileUpdateData.headline = headline
    if (website !== undefined) profileUpdateData.website = website
    if (linkedin !== undefined) profileUpdateData.linkedin = linkedin
    if (twitter !== undefined) profileUpdateData.twitter = twitter
    if (youtube !== undefined) profileUpdateData.youtube = youtube
    if (expertise !== undefined) {
      profileUpdateData.expertise = Array.isArray(expertise)
        ? JSON.stringify(expertise)
        : typeof expertise === 'string'
          ? expertise
          : JSON.stringify(expertise)
    }
    if (languages !== undefined) {
      profileUpdateData.languages = Array.isArray(languages)
        ? JSON.stringify(languages)
        : typeof languages === 'string'
          ? languages
          : JSON.stringify(languages)
    }

    if (Object.keys(profileUpdateData).length > 0) {
      await db.instructorProfile.upsert({
        where: { instructorId },
        update: profileUpdateData,
        create: {
          instructorId,
          ...profileUpdateData,
        },
      })
    }

    // ── Return updated data ─────────────────────────────────────────────────
    const [updatedUser, freshProfile] = await Promise.all([
      db.user.findUnique({
        where: { id: instructorId },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          bio: true,
          phone: true,
          language: true,
          isVerified: true,
          mfaEnabled: true,
          createdAt: true,
          lastActiveAt: true,
        },
      }),
      db.instructorProfile.findUnique({ where: { instructorId } }),
    ])

    const parsedExpertise = safeJsonParse<string[]>(freshProfile?.expertise, [])
    const parsedLanguages = safeJsonParse<Array<{ name: string; verified: boolean }>>(freshProfile?.languages, [])

    return NextResponse.json({
      personalInfo: {
        id: updatedUser!.id,
        name: updatedUser!.name,
        email: updatedUser!.email,
        avatar: updatedUser!.avatar,
        bio: updatedUser!.bio,
        phone: updatedUser!.phone,
        language: updatedUser!.language,
        isVerified: updatedUser!.isVerified,
        mfaEnabled: updatedUser!.mfaEnabled,
        createdAt: updatedUser!.createdAt,
        lastActiveAt: updatedUser!.lastActiveAt,
      },
      instructorProfile: freshProfile
        ? {
            headline: freshProfile.headline,
            website: freshProfile.website,
            linkedin: freshProfile.linkedin,
            twitter: freshProfile.twitter,
            youtube: freshProfile.youtube,
            expertise: parsedExpertise,
            languages: parsedLanguages,
            ntn: freshProfile.ntn,
            ntnVerified: freshProfile.ntnVerified,
            applicationStatus: freshProfile.applicationStatus,
            cnic: freshProfile.cnic,
            topicProposal: freshProfile.topicProposal,
          }
        : {
            headline: null,
            website: null,
            linkedin: null,
            twitter: null,
            youtube: null,
            expertise: [],
            languages: [],
            ntn: null,
            ntnVerified: false,
            applicationStatus: null,
            cnic: null,
            topicProposal: null,
          },
      message: 'Profile updated successfully',
    })
  } catch (error) {
    console.error('Error updating instructor profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}

// ─── POST /api/instructor/profile-full/avatar ────────────────────────────────
// Upload avatar — save base64 data URL to User.avatar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { instructorId, avatarData } = body

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    if (!avatarData) {
      return NextResponse.json({ error: 'Avatar data is required' }, { status: 400 })
    }

    // Validate it's a data URL
    if (typeof avatarData !== 'string' || !avatarData.startsWith('data:')) {
      return NextResponse.json({ error: 'Invalid avatar data format. Must be a data URL.' }, { status: 400 })
    }

    // Verify instructor exists
    const instructor = await db.user.findUnique({
      where: { id: instructorId },
      select: { id: true },
    })
    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
    }

    const user = await db.user.update({
      where: { id: instructorId },
      data: { avatar: avatarData },
      select: { id: true, avatar: true },
    })

    return NextResponse.json({ success: true, avatar: user.avatar })
  } catch (error) {
    console.error('Error uploading avatar:', error)
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 })
  }
}

// ─── DELETE /api/instructor/profile-full/avatar ──────────────────────────────
// Remove avatar — set User.avatar to null
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { instructorId } = body

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

    await db.user.update({
      where: { id: instructorId },
      data: { avatar: null },
      select: { id: true },
    })

    return NextResponse.json({ success: true, message: 'Avatar removed' })
  } catch (error) {
    console.error('Error removing avatar:', error)
    return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 })
  }
}
