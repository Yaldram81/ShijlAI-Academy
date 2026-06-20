import { NextRequest, NextResponse } from 'next/server'
import { AIService } from '@/services/ai'

// POST /api/instructor/ai/improve-bio - Improve an instructor's bio using AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bio, headline, moduleId, courseId } = body

    if (!bio) {
      return NextResponse.json({ error: 'Bio is required' }, { status: 400 })
    }

    const systemPrompt = `You are an expert profile writer for online course instructors. Your goal is to improve instructor bios to be professional, engaging, SEO-friendly, and highlight the instructor's expertise and achievements. Keep the bio concise (under 300 words). Use active voice and compelling language. Focus on credibility, experience, and what makes the instructor unique. Avoid generic clichés and buzzwords.`

    const userPrompt = `Improve the following instructor bio to make it more professional, engaging, and SEO-friendly:

Bio: "${bio}"
${headline ? `Headline: "${headline}"` : ''}

Please provide an improved version that:
- Uses active voice and compelling language
- Highlights expertise, achievements, and credibility
- Is concise (under 300 words)
- Is optimized for search visibility
- Feels authentic and approachable
${headline ? '- Aligns well with the provided headline' : ''}

Return only the improved bio text.`

    let response = ''
    try {
      response = await AIService.chat({
        systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        complexity: 'fast',
        feature: 'improve_bio',
        userId: moduleId || courseId,
        courseId: courseId || undefined,
      })
    } catch (err) {
      console.error('Failed to improve bio via AIService:', err)
    }

    if (!response) {
      return NextResponse.json(
        { error: 'AI failed to improve the bio. Please try again.' },
        { status: 422 }
      )
    }

    return NextResponse.json({
      content: response,
      bio: response,
    })
  } catch (error) {
    console.error('Error improving instructor bio:', error)
    return NextResponse.json(
      { error: 'Failed to improve instructor bio' },
      { status: 500 }
    )
  }
}

