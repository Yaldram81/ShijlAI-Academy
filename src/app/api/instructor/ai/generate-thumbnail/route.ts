import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/instructor/ai/generate-thumbnail - Generate course thumbnail images using AI
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

    const zai = await ZAI.create()

    // Generate 4 thumbnail variants with different style prompts
    const prompts = [
      `Course thumbnail for "${title}", ${thumbnailStyle} style, professional, vibrant colors, educational, clean design, text overlay with course title, high quality`,
      `Course thumbnail for "${title}", ${thumbnailStyle} style, with abstract geometric background, bold typography, educational theme, high quality`,
      `Course thumbnail for "${title}", ${thumbnailStyle} style, gradient background, modern icon or illustration, course title visible, professional, high quality`,
      `Course thumbnail for "${title}", ${thumbnailStyle} style, minimalist design, subtle patterns, elegant typography, educational branding, high quality`,
    ]

    // Generate each image, skipping failures
    const images: string[] = []

    for (const prompt of prompts) {
      try {
        const response = await zai.images.generations.create({
          prompt,
          size: '1344x768',
        })

        const base64 = response.data?.[0]?.base64
        if (base64) {
          images.push(base64)
        }
      } catch (err) {
        console.error('Failed to generate thumbnail variant:', err)
        // Skip this variant and continue with the rest
      }
    }

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
