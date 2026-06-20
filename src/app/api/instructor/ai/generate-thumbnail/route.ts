import { NextRequest, NextResponse } from 'next/server'
import { ThumbnailGenerator } from '@/services/ai'

// POST /api/instructor/ai/generate-thumbnail - Generate course thumbnail images using AI (SVG/CSS fallback)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, style } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const thumbnailStyle = style || 'modern'
    const validStyles = ['modern', 'gradient', 'minimal', 'illustration']
    if (!validStyles.includes(thumbnailStyle)) {
      return NextResponse.json(
        { error: `Invalid style. Must be one of: ${validStyles.join(', ')}` },
        { status: 400 }
      )
    }

    const images = await ThumbnailGenerator.generate(title, thumbnailStyle as any)

    if (images.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any thumbnail images. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ images })
  } catch (error) {
    console.error('Error generating thumbnails:', error)
    return NextResponse.json({ error: 'Failed to generate thumbnail images' }, { status: 500 })
  }
}

