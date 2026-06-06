import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateStudyPlan, getStudentStudyPlans, updateStudyPlanTask, deleteStudyPlan, getTodayTasks } from '@/services/learning-engine/study-planner-service'

// GET /api/ai/study-planner?userId=xxx&today=true&planId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const today = searchParams.get('today') === 'true'
    const planId = searchParams.get('planId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Return today's tasks across all active plans
    if (today) {
      const todayTasks = await getTodayTasks(userId)
      return NextResponse.json({ tasks: todayTasks })
    }

    // Return a specific plan
    if (planId) {
      const plan = await db.studyPlan.findUnique({
        where: { id: planId },
        include: {
          tasks: { orderBy: [{ dayNumber: 'asc' }, { orderIndex: 'asc' }] },
        },
      })
      if (!plan || plan.userId !== userId) {
        return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
      }
      return NextResponse.json({ plan: formatPlan(plan) })
    }

    // Return all plans for the user (active first, then completed)
    const result = await getStudentStudyPlans(userId)
    const formattedPlans = [...result.active, ...result.completed].map(formatPlan)
    return NextResponse.json({ plans: formattedPlans })
  } catch (error) {
    console.error('[Study Planner GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/ai/study-planner — Create a new study plan with AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      courseId,
      courseName,
      examDate,
      targetGrade,
      currentGrade,
      dailyHours = 2,
      weakTopics = [],
      strongTopics = [],
    } = body

    if (!userId || !examDate) {
      return NextResponse.json({ error: 'userId and examDate are required' }, { status: 400 })
    }

    // Validate examDate is in the future
    const examDateObj = new Date(examDate)
    if (isNaN(examDateObj.getTime())) {
      return NextResponse.json({ error: 'Invalid examDate format' }, { status: 400 })
    }

    if (examDateObj.getTime() <= Date.now()) {
      return NextResponse.json({ error: 'examDate must be in the future' }, { status: 400 })
    }

    if (dailyHours < 0.5 || dailyHours > 16) {
      return NextResponse.json({ error: 'dailyHours must be between 0.5 and 16' }, { status: 400 })
    }

    // Use the study planner service to generate the plan
    const plan = await generateStudyPlan({
      userId,
      courseId,
      courseName,
      examDate,
      targetGrade,
      currentGrade,
      dailyHours,
      weakTopics,
      strongTopics,
    })

    return NextResponse.json({ plan: formatPlan(plan) })
  } catch (error) {
    console.error('[Study Planner POST] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/ai/study-planner — Update task status or plan status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { taskId, status, planId } = body

    if (taskId && status) {
      const validStatuses = ['pending', 'in_progress', 'completed', 'skipped']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: `status must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
      }

      const result = await updateStudyPlanTask(taskId, status)

      // Also fetch updated plan progress
      const planTasks = await db.studyPlanTask.findMany({
        where: { studyPlanId: result.studyPlanId },
      })
      const completedCount = planTasks.filter(t => t.status === 'completed').length
      const progress = planTasks.length > 0 ? Math.round((completedCount / planTasks.length) * 100) : 0

      return NextResponse.json({
        task: {
          id: result.id,
          status: result.status,
          completedAt: result.completedAt?.toISOString?.() || null,
        },
        planProgress: progress,
      })
    }

    if (planId) {
      // Update plan status (e.g., abandon)
      const planStatus = body.status || 'abandoned'
      const updatedPlan = await db.studyPlan.update({
        where: { id: planId },
        data: { status: planStatus },
      })
      return NextResponse.json({ plan: { id: updatedPlan.id, status: updatedPlan.status } })
    }

    return NextResponse.json({ error: 'taskId or planId is required' }, { status: 400 })
  } catch (error) {
    console.error('[Study Planner PATCH] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/ai/study-planner — Delete/abandon a plan
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { planId, userId } = body

    if (!planId || !userId) {
      return NextResponse.json({ error: 'planId and userId are required' }, { status: 400 })
    }

    await deleteStudyPlan(planId, userId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Study Planner DELETE] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function formatPlan(plan: any) {
  return {
    id: plan.id,
    title: plan.title,
    courseName: plan.courseName,
    examDate: plan.examDate?.toISOString?.() || plan.examDate,
    targetGrade: plan.targetGrade,
    currentGrade: plan.currentGrade,
    dailyHours: plan.availableHoursPerDay,
    totalDays: plan.totalDays,
    completedTasks: plan.completedTasks,
    totalTasks: plan.totalTasks,
    progress: plan.progress,
    status: plan.status,
    tasks: (plan.tasks || []).map((task: any) => ({
      id: task.id,
      date: task.date instanceof Date ? task.date.toISOString().split('T')[0] : task.date,
      dayNumber: task.dayNumber,
      taskType: task.taskType,
      title: task.title,
      description: task.description,
      duration: task.duration,
      topic: task.topic,
      status: task.status,
      orderIndex: task.orderIndex,
    })),
    createdAt: plan.createdAt instanceof Date ? plan.createdAt.toISOString() : plan.createdAt,
  }
}
