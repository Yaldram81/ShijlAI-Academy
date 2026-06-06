import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/profile - Get instructor profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: instructorId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        phone: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
    }

    const profile = await db.instructorProfile.findUnique({
      where: { instructorId },
    })

    let expertise: string[] = []
    let languages: Array<{ name: string; verified: boolean }> = []

    if (profile?.expertise) {
      try { expertise = JSON.parse(profile.expertise) } catch { /* ignore */ }
    }
    if (profile?.languages) {
      try { languages = JSON.parse(profile.languages) } catch { /* ignore */ }
    }

    return NextResponse.json({
      profile: {
        displayName: user.name,
        headline: profile?.headline || '',
        bio: user.bio || '',
        website: profile?.website || '',
        linkedin: profile?.linkedin || '',
        twitter: profile?.twitter || '',
        youtube: profile?.youtube || '',
        expertise,
        languages,
        avatar: user.avatar,
        phone: user.phone,
      },
    })
  } catch (error) {
    console.error('Error fetching instructor profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

// POST /api/instructor/profile - Save instructor profile data (including NTN)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { instructorId, ntn, ntnVerified, headline, website, linkedin, twitter, youtube, expertise, languages, displayName, bio } = body

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

    // Update User.name (displayName) and User.bio if provided
    const userUpdateData: { name?: string; bio?: string } = {}
    if (displayName !== undefined) {
      if (typeof displayName !== 'string' || displayName.trim().length === 0) {
        return NextResponse.json({ error: 'Display name must be a non-empty string' }, { status: 400 })
      }
      userUpdateData.name = displayName.trim()
    }
    if (bio !== undefined) {
      userUpdateData.bio = bio
    }
    if (Object.keys(userUpdateData).length > 0) {
      await db.user.update({
        where: { id: instructorId },
        data: userUpdateData,
      })
    }

    // Upsert instructor profile
    const profile = await db.instructorProfile.upsert({
      where: { instructorId },
      update: {
        ...(ntn !== undefined && { ntn }),
        ...(ntnVerified !== undefined && { ntnVerified }),
        ...(headline !== undefined && { headline }),
        ...(website !== undefined && { website }),
        ...(linkedin !== undefined && { linkedin }),
        ...(twitter !== undefined && { twitter }),
        ...(youtube !== undefined && { youtube }),
        ...(expertise !== undefined && { expertise: typeof expertise === 'string' ? expertise : JSON.stringify(expertise) }),
        ...(languages !== undefined && { languages: typeof languages === 'string' ? languages : JSON.stringify(languages) }),
      },
      create: {
        instructorId,
        ntn: ntn || null,
        ntnVerified: ntnVerified || false,
        headline: headline || null,
        website: website || null,
        linkedin: linkedin || null,
        twitter: twitter || null,
        youtube: youtube || null,
        expertise: expertise ? (typeof expertise === 'string' ? expertise : JSON.stringify(expertise)) : null,
        languages: languages ? (typeof languages === 'string' ? languages : JSON.stringify(languages)) : null,
      },
    })

    // Parse JSON fields for consistent response (matching GET behavior)
    let parsedExpertise: string[] = []
    let parsedLanguages: Array<{ name: string; verified: boolean }> = []
    if (profile.expertise) {
      try { parsedExpertise = JSON.parse(profile.expertise) } catch { parsedExpertise = [] }
    }
    if (profile.languages) {
      try { parsedLanguages = JSON.parse(profile.languages) } catch { parsedLanguages = [] }
    }

    return NextResponse.json({
      profile: {
        id: profile.id,
        instructorId: profile.instructorId,
        ntn: profile.ntn,
        ntnVerified: profile.ntnVerified,
        headline: profile.headline,
        website: profile.website,
        linkedin: profile.linkedin,
        twitter: profile.twitter,
        youtube: profile.youtube,
        expertise: parsedExpertise,
        languages: parsedLanguages,
      },
      message: 'Profile updated successfully',
    })
  } catch (error) {
    console.error('Error updating instructor profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
