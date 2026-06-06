import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// POST /api/instructor/ai/auto-caption - Generate multilingual captions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, sourceType, targetLanguage } = body

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    const type = sourceType === 'video' ? 'video' : 'text'
    const lang = targetLanguage || 'en'

    const zai = await ZAI.create()

    const systemPrompt = `You are an expert captioning and translation specialist. Your task is to generate accurate, timestamped captions for the provided content. Follow these rules strictly:

1. Produce captions with timestamps in the format [MM:SS] or [HH:MM:SS].
2. Each caption line should be in the target language, formatted as:
   [timestamp] Caption text
3. Ensure translations are natural, culturally appropriate, and preserve the original meaning.
4. Keep each caption segment concise — ideally one sentence or phrase per timestamp.
5. If the source is a video transcript, align timestamps with natural speech segments.
6. If the source is plain text, assign reasonable sequential timestamps starting from [00:00].
7. Target language: ${lang === 'en' ? 'English' : lang}`

    const userPrompt = type === 'video'
      ? `Generate timestamped captions in ${lang === 'en' ? 'English' : lang} for the following video transcript. Divide the content into natural speech segments and assign appropriate timestamps.

Transcript:
${content}`
      : `Generate timestamped captions in ${lang === 'en' ? 'English' : lang} for the following text. Divide the content into meaningful segments and assign sequential timestamps starting from [00:00].

Text:
${content}`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      thinking: { type: 'disabled' },
    })

    const response = completion.choices[0]?.message?.content

    if (!response) {
      return NextResponse.json(
        { error: 'AI failed to generate captions. Please try again.' },
        { status: 422 }
      )
    }

    return NextResponse.json({
      content,
      captions: response,
    })
  } catch (error) {
    console.error('Error generating captions:', error)
    return NextResponse.json(
      { error: 'Failed to generate captions' },
      { status: 500 }
    )
  }
}
