import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AIService } from '@/services/ai'

// GET /api/ai/shijlai/study-plan?userId=xxx&status=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = { userId }
    if (status) where.status = status

    const plans = await db.studyPlan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('[ShijlAI Study Plan GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/ai/shijlai/study-plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, examDate, availableHoursPerDay = 2, subjects = [] } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Get student profile for context
    const profile = await db.studentLearningProfile.findUnique({ where: { studentId: userId } })
    const enrollments = await db.enrollment.findMany({
      where: { userId },
      include: { course: true },
      take: 10,
    })

    const studentContext = {
      level: profile?.learningLevel || 'beginner',
      weakTopics: profile?.weakTopics || '[]',
      strongTopics: profile?.strongTopics || '[]',
      learningSpeed: profile?.learningSpeed || 'moderate',
      enrolledCourses: enrollments.map(e => e.course.title),
      studyStreak: profile?.studyStreakDays || 0,
    }

    const daysUntilExam = examDate
      ? Math.max(1, Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 30

    const subjectsStr = Array.isArray(subjects) ? subjects.join(', ') : subjects

    // Call AIService using generateJSON
    let planData: Record<string, unknown> = {}
    try {
      planData = await AIService.generateJSON<Record<string, unknown>>({
        systemPrompt: `You are a study plan generator for ShijlAI Academy. Create a personalized daily study schedule in JSON format. The plan should have a "days" array where each day has: "day" (number), "subjects" (array of { "name": string, "topics": string[], "duration": number in minutes, "activities": string[] }), "totalMinutes": number, "notes": string. Also include "totalDays", "dailyHours", and "tips" (array of study tips strings).`,
        messages: [
          {
            role: 'user',
            content: `Create a ${daysUntilExam}-day study plan for a student.
Subjects: ${subjectsStr}
Available hours per day: ${availableHoursPerDay}
Exam date: ${examDate || 'Not specified'}
Student context: ${JSON.stringify(studentContext)}

Return only the JSON object.`,
          },
        ],
        complexity: 'fast',
        feature: 'study_planner',
        userId,
      })
    } catch (err) {
      console.error('Failed to generate study plan JSON:', err)
    }

    const title = `Study Plan: ${subjectsStr || 'General'} (${daysUntilExam} days)`

    const plan = await db.studyPlan.create({
      data: {
        userId,
        title,
        examDate: examDate ? new Date(examDate) : null,
        availableHoursPerDay,
        subjects: JSON.stringify(subjects),
        planData: JSON.stringify(planData),
      },
    })

    // Log activity
    await db.studentAIActivity.create({
      data: {
        userId,
        activityType: 'study_plan_created',
        mode: 'study_planner',
        metadata: JSON.stringify({ planId: plan.id }),
      },
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('[ShijlAI Study Plan POST] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/ai/shijlai/study-plan
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { planId, status, progress } = body

    if (!planId) {
      return NextResponse.json({ error: 'planId is required' }, { status: 400 })
    }

    const plan = await db.studyPlan.findUnique({ where: { id: planId } })
    if (!plan) {
      return NextResponse.json({ error: 'Study plan not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (status !== undefined) updateData.status = status
    if (progress !== undefined) updateData.progress = progress

    const updatedPlan = await db.studyPlan.update({
      where: { id: planId },
      data: updateData,
    })

    return NextResponse.json({ plan: updatedPlan })
  } catch (error) {
    console.error('[ShijlAI Study Plan PATCH] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
