import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/admin/ai-config/seed — Seed default providers, models, and prompt templates
export async function POST(request: Request) {
  try {
    const url = new URL(request.url)
    const reset = url.searchParams.get('reset') === 'true'

    if (reset) {
      // Clear existing records in proper dependency order
      await db.aIUsageLog.deleteMany()
      await db.aIModel.deleteMany()
      await db.aIProvider.deleteMany()
      await db.aIPromptTemplate.deleteMany()
      await db.aIConfiguration.deleteMany()
    } else {
      // Only seed if no providers exist yet
      const existingProviders = await db.aIProvider.count()
      if (existingProviders > 0) {
        return NextResponse.json(
          { error: 'Providers already exist. Use ?reset=true query param to force reset.', providerCount: existingProviders },
          { status: 409 }
        )
      }
    }

    // Seed providers with their models in a transaction
    const result = await db.$transaction(async (tx) => {
      // ── Google Gemini (Default) ──
      const google = await tx.aIProvider.create({
        data: {
          name: 'Google',
          slug: 'google',
          type: 'llm',
          isActive: true,
          isDefault: true,
          priority: 10,
          apiKey: process.env.GEMINI_API_KEY || null,
          apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta',
          healthStatus: 'healthy',
          models: {
            create: [
              {
                name: 'Gemini 2.5 Flash',
                slug: 'gemini-2.5-flash',
                modelId: 'gemini-2.5-flash',
                type: 'chat',
                isActive: true,
                isDefault: true,
                inputPricePer1M: 0.15,
                outputPricePer1M: 0.60,
                contextWindow: 1048576,
                maxOutputTokens: 8192,
                supportsVision: true,
                supportsStreaming: true,
                supportsJson: true,
                capabilities: JSON.stringify({ function_calling: true }),
                rpmLimit: 60,
                tpmLimit: 1000000,
              },
              {
                name: 'Gemini 2.5 Pro',
                slug: 'gemini-2.5-pro',
                modelId: 'gemini-2.5-pro',
                type: 'chat',
                isActive: true,
                isDefault: false,
                inputPricePer1M: 1.25,
                outputPricePer1M: 10.00,
                contextWindow: 1048576,
                maxOutputTokens: 8192,
                supportsVision: true,
                supportsStreaming: true,
                supportsJson: true,
                capabilities: JSON.stringify({ function_calling: true, code_execution: true }),
                rpmLimit: 60,
                tpmLimit: 1000000,
              },
              {
                name: 'Gemini 2.0 Flash',
                slug: 'gemini-2.0-flash',
                modelId: 'gemini-2.0-flash',
                type: 'chat',
                isActive: true,
                isDefault: false,
                inputPricePer1M: 0.10,
                outputPricePer1M: 0.40,
                contextWindow: 1048576,
                maxOutputTokens: 8192,
                supportsVision: true,
                supportsStreaming: true,
                supportsJson: true,
                capabilities: JSON.stringify({ function_calling: true }),
                rpmLimit: 60,
                tpmLimit: 1000000,
              },
              {
                name: 'Gemini 2.0 Flash Lite',
                slug: 'gemini-2.0-flash-lite',
                modelId: 'gemini-2.0-flash-lite',
                type: 'chat',
                isActive: true,
                isDefault: false,
                inputPricePer1M: 0.075,
                outputPricePer1M: 0.30,
                contextWindow: 1048576,
                maxOutputTokens: 8192,
                supportsVision: true,
                supportsStreaming: true,
                supportsJson: true,
                capabilities: JSON.stringify({ function_calling: true }),
                rpmLimit: 60,
                tpmLimit: 1000000,
              },
            ],
          },
        },
        include: { models: true },
      })

      // ── OpenAI ──
      const openai = await tx.aIProvider.create({
        data: {
          name: 'OpenAI',
          slug: 'openai',
          type: 'llm',
          isActive: true,
          isDefault: false,
          priority: 8,
          apiEndpoint: 'https://api.openai.com/v1',
          healthStatus: 'unknown',
          models: {
            create: [
              {
                name: 'GPT-4o',
                slug: 'gpt-4o',
                modelId: 'gpt-4o-2024-08-06',
                type: 'chat',
                isActive: true,
                isDefault: true,
                inputPricePer1M: 2.5,
                outputPricePer1M: 10,
                contextWindow: 128000,
                maxOutputTokens: 16384,
                supportsVision: true,
                supportsStreaming: true,
                supportsJson: true,
                capabilities: JSON.stringify({ function_calling: true, structured_outputs: true }),
                rpmLimit: 500,
                tpmLimit: 30000,
              },
              {
                name: 'GPT-4o Mini',
                slug: 'gpt-4o-mini',
                modelId: 'gpt-4o-mini-2024-07-18',
                type: 'chat',
                isActive: true,
                isDefault: false,
                inputPricePer1M: 0.15,
                outputPricePer1M: 0.6,
                contextWindow: 128000,
                maxOutputTokens: 16384,
                supportsVision: true,
                supportsStreaming: true,
                supportsJson: true,
                capabilities: JSON.stringify({ function_calling: true, structured_outputs: true }),
                rpmLimit: 500,
                tpmLimit: 200000,
              },
            ],
          },
        },
        include: { models: true },
      })

      // ── Anthropic ──
      const anthropic = await tx.aIProvider.create({
        data: {
          name: 'Anthropic',
          slug: 'anthropic',
          type: 'llm',
          isActive: true,
          isDefault: false,
          priority: 6,
          apiEndpoint: 'https://api.anthropic.com/v1',
          healthStatus: 'unknown',
          models: {
            create: [
              {
                name: 'Claude 3.5 Sonnet',
                slug: 'claude-3.5-sonnet',
                modelId: 'claude-3-5-sonnet-20241022',
                type: 'chat',
                isActive: true,
                isDefault: true,
                inputPricePer1M: 3,
                outputPricePer1M: 15,
                contextWindow: 200000,
                maxOutputTokens: 8192,
                supportsVision: true,
                supportsStreaming: true,
                supportsJson: true,
                capabilities: JSON.stringify({ function_calling: true, extended_thinking: true }),
                rpmLimit: 50,
                tpmLimit: 80000,
              },
            ],
          },
        },
        include: { models: true },
      })

      // Create/Update the AIConfiguration record with Google Gemini defaults
      const gemini25Flash = google.models.find(m => m.slug === 'gemini-2.5-flash')
      const gemini25Pro = google.models.find(m => m.slug === 'gemini-2.5-pro')

      const config = await tx.aIConfiguration.findFirst()
      if (config) {
        await tx.aIConfiguration.update({
          where: { id: config.id },
          data: {
            defaultProviderId: google.id,
            defaultModelId: gemini25Flash?.id || null,
            fallbackProviderId: google.id,
            fallbackModelId: gemini25Pro?.id || null,
          }
        })
      } else {
        await tx.aIConfiguration.create({
          data: {
            defaultProviderId: google.id,
            defaultModelId: gemini25Flash?.id || null,
            fallbackProviderId: google.id,
            fallbackModelId: gemini25Pro?.id || null,
          }
        })
      }

      // ── Prompt Templates ──
      const promptTemplates = await Promise.all([
        tx.aIPromptTemplate.create({
          data: {
            name: 'Tutor System Prompt',
            slug: 'tutor-system',
            category: 'tutor',
            description: 'System prompt for Ask ShijlAI that guides students using the Socratic method',
            content: `You are Ask ShijlAI, a helpful and patient AI learning assistant for students worldwide.

## Core Principles
- Guide students using the Socratic method — ask probing questions, give hints, and help them discover answers themselves
- Be encouraging and supportive. Celebrate small wins and progress
- Use examples relevant to international curricula (IB, AP, Cambridge, Common Core)
- Respond in the student's preferred language

## Guidelines
- If a student asks for a direct answer, gently redirect them to think through the problem
- Provide step-by-step explanations when concepts are difficult
- Use analogies and real-world examples to make abstract concepts concrete
- Adapt your tone and complexity to the student's level
- Never provide answers to exam questions directly

## Safety
- Do not discuss topics that are harmful, illegal, or inappropriate
- If a student seems distressed, suggest they talk to a teacher or counselor
- Keep conversations focused on learning`,
            variables: JSON.stringify(['student_level', 'subject', 'language']),
            version: 1,
            isActive: true,
            isDefault: true,
            tags: JSON.stringify(['tutor', 'system', 'socratic', 'education']),
          },
        }),
        tx.aIPromptTemplate.create({
          data: {
            name: 'Quiz Generator',
            slug: 'quiz-generator',
            category: 'content',
            description: 'Generates quiz questions from course content with varying difficulty levels',
            content: `Generate quiz questions based on the provided course content.

## Requirements
- Generate {{question_count}} questions of type {{question_type}}
- Difficulty level: {{difficulty_level}}
- Each question must have 4 options (for MCQ) and one correct answer
- Include detailed explanations for each answer
- Questions should test understanding, not just memorization

## Content to base questions on:
{{course_content}}

## Output Format
Return a JSON array of questions with the following structure:
{
  "questions": [
    {
      "text": "Question text",
      "type": "mcq",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "A",
      "explanation": "Detailed explanation...",
      "difficulty": "medium",
      "points": 1
    }
  ]
}`,
            variables: JSON.stringify(['question_count', 'question_type', 'difficulty_level', 'course_content']),
            version: 1,
            isActive: true,
            isDefault: true,
            tags: JSON.stringify(['quiz', 'content', 'assessment', 'generation']),
          },
        }),
        tx.aIPromptTemplate.create({
          data: {
            name: 'Content Moderator',
            slug: 'content-moderator',
            category: 'moderation',
            description: 'Analyzes user-generated content for policy violations and appropriate flagging',
            content: `Analyze the following content for policy violations and determine if it should be flagged.

## Content to Analyze:
{{content}}

## Review Criteria:
1. **Hate Speech**: Content that promotes hatred against protected groups
2. **Harassment**: Targeted harassment or bullying
3. **Inappropriate Content**: Sexual, violent, or otherwise inappropriate for an educational platform
4. **Spam**: Promotional content, irrelevant posts, or repeated submissions
5. **Misinformation**: Factually incorrect information presented as truth
6. **Academic Integrity**: Answers to exam questions, homework solutions intended for cheating

## Output Format
Return a JSON object:
{
  "isFlagged": true/false,
  "flagReason": "category of violation or null",
  "confidence": 0.0-1.0,
  "severity": "low" | "medium" | "high",
  "explanation": "Brief explanation of the decision",
  "suggestedAction": "none" | "flag" | "remove" | "escalate"
}`,
            variables: JSON.stringify(['content']),
            version: 1,
            isActive: true,
            isDefault: true,
            tags: JSON.stringify(['moderation', 'safety', 'content-review', 'flagging']),
          },
        }),
        tx.aIPromptTemplate.create({
          data: {
            name: 'Recommendation Engine',
            slug: 'recommendation-engine',
            category: 'recommendation',
            description: 'Generates personalized course recommendations based on student profile and behavior',
            content: `Generate personalized course recommendations for the following student.

## Student Profile:
- Learning Level: {{student_level}}
- Enrolled Courses: {{enrolled_courses}}
- Completed Courses: {{completed_courses}}
- Interests: {{interests}}
- Recent Activity: {{recent_activity}}

## Available Courses:
{{available_courses}}

## Recommendation Criteria:
1. **Relevance**: Match student's interests and learning goals
2. **Progression**: Suggest courses that build on completed ones
3. **Diversity**: Include courses from different categories when appropriate
4. **Popularity**: Factor in course ratings and enrollment numbers
5. **Difficulty**: Ensure appropriate difficulty progression

## Output Format
Return a JSON array of recommendations:
{
  "recommendations": [
    {
      "courseId": "id",
      "reason": "Why this course is recommended",
      "confidence": 0.0-1.0,
      "category": "progression|interest|popular|trending"
    }
  ]
}`,
            variables: JSON.stringify(['student_level', 'enrolled_courses', 'completed_courses', 'interests', 'recent_activity', 'available_courses']),
            version: 1,
            isActive: true,
            isDefault: true,
            tags: JSON.stringify(['recommendation', 'personalization', 'courses', 'discovery']),
          },
        }),
      ])

      // Create audit log for seeding
      await tx.aIAuditLog.create({
        data: {
          action: 'system_seed',
          category: 'config',
          description: 'Seeded default AI providers (OpenAI, Anthropic, Google), 7 models, and 4 prompt templates',
          newValue: JSON.stringify({
            providers: ['openai', 'anthropic', 'google'],
            modelsCount: 7,
            promptTemplatesCount: 4,
          }),
          severity: 'info',
        },
      })

      return {
        providers: [openai, anthropic, google],
        promptTemplates,
        stats: {
          providersCreated: 3,
          modelsCreated: 7,
          promptTemplatesCreated: 4,
        },
      }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Failed to seed AI configuration data' },
      { status: 500 }
    )
  }
}
