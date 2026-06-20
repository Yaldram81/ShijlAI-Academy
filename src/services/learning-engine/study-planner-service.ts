import { db } from '@/lib/db'
import { getOrCreateProfile } from './profile-service'
import { getWeakTopics, getStrongTopics } from './mastery-service'
import { AIService } from '@/services/ai'

// ─── Types ──────────────────────────────────────────────────────────────────

interface GenerateStudyPlanParams {
  userId: string
  courseId?: string
  courseName?: string
  examDate: string // ISO date
  targetGrade?: string
  currentGrade?: string
  dailyHours: number // hours available per day
  weakTopics?: string[]
  strongTopics?: string[]
}

interface TopicWeight {
  topic: string
  weight: number
  type: 'weak' | 'moderate' | 'strong'
}

type TaskType = 'study' | 'quiz' | 'revision' | 'practice' | 'mock_exam' | 'ai_discussion'
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'

interface GeneratedTask {
  date: Date
  dayNumber: number
  taskType: TaskType
  title: string
  description: string
  duration: number // minutes
  topic: string | null
  orderIndex: number
}

// ─── AI Enhancement (optional, graceful fallback) ───────────────────────────

async function generateAIPlanEnhancement(context: {
  courseName?: string
  examDate: string
  dailyHours: number
  weakTopics: string[]
  moderateTopics: string[]
  strongTopics: string[]
  totalDays: number
  targetGrade?: string
  currentGrade?: string
  learningLevel?: string
  learningSpeed?: string
}, userId?: string): Promise<{ tips?: string[]; focusAreas?: string[]; scheduleNotes?: string } | null> {
  try {
    const prompt = `You are a study plan advisor. Given this student context, provide brief JSON advice:
- course: ${context.courseName || 'General'}
- exam date: ${context.examDate}
- days until exam: ${context.totalDays}
- daily study hours: ${context.dailyHours}
- weak topics: ${context.weakTopics.join(', ') || 'none'}
- moderate topics: ${context.moderateTopics.join(', ') || 'none'}
- strong topics: ${context.strongTopics.join(', ') || 'none'}
- target grade: ${context.targetGrade || 'N/A'}
- current grade: ${context.currentGrade || 'N/A'}
- learning level: ${context.learningLevel || 'intermediate'}
- learning speed: ${context.learningSpeed || 'moderate'}

Return ONLY a JSON object with:
{
  "tips": ["tip1", "tip2", "tip3"],
  "focusAreas": ["area1", "area2"],
  "scheduleNotes": "brief note about schedule optimization"
}`

    const parsed = await AIService.generateJSON<any>({
      systemPrompt: 'You are a study plan advisor. Return only valid JSON.',
      messages: [{ role: 'user', content: prompt }],
      complexity: 'fast',
      feature: 'study_planner',
      userId,
    })

    if (parsed && Array.isArray(parsed.tips)) {
      return parsed
    }
    return null
  } catch (err) {
    console.error('generateAIPlanEnhancement error:', err)
    return null
  }
}

// ─── Topic Distribution Engine ──────────────────────────────────────────────

function distributeTopics(
  weakTopics: string[],
  strongTopics: string[],
  allTopics: string[]
): TopicWeight[] {
  // Derive moderate topics: topics that aren't weak or strong
  const weakSet = new Set(weakTopics)
  const strongSet = new Set(strongTopics)
  const moderateTopics = allTopics.filter(t => !weakSet.has(t) && !strongSet.has(t))

  const result: TopicWeight[] = []

  if (weakTopics.length > 0) {
    const weightPerWeak = 0.4 / weakTopics.length
    weakTopics.forEach(t => result.push({ topic: t, weight: weightPerWeak, type: 'weak' }))
  }

  if (moderateTopics.length > 0) {
    const weightPerModerate = 0.3 / moderateTopics.length
    moderateTopics.forEach(t => result.push({ topic: t, weight: weightPerModerate, type: 'moderate' }))
  }

  if (strongTopics.length > 0) {
    const weightPerStrong = 0.15 / strongTopics.length
    strongTopics.forEach(t => result.push({ topic: t, weight: weightPerStrong, type: 'strong' }))
  }

  return result
}

// ─── Daily Task Generation Engine ───────────────────────────────────────────

function getTasksPerDay(dailyHours: number): number {
  if (dailyHours <= 1) return 1
  if (dailyHours <= 2) return 2
  if (dailyHours <= 4) return 3
  return 4
}

function getTaskDurationSplit(dailyHours: number, taskIndex: number, totalTasks: number): number {
  const totalMinutes = dailyHours * 60
  const fractions = [0.40, 0.30, 0.20, 0.10]
  const fraction = fractions[taskIndex] || 0.10
  return Math.round(totalMinutes * fraction)
}

function selectTaskType(
  dayNumber: number,
  totalDays: number,
  taskIndex: number,
  totalTasksForDay: number,
  isReviewDay: boolean,
  isDayBeforeExam: boolean,
  topicType: 'weak' | 'moderate' | 'strong'
): TaskType {
  // Day before exam: final revision + mock exam
  if (isDayBeforeExam) {
    if (taskIndex === 0) return 'revision'
    if (taskIndex === 1) return 'mock_exam'
    return 'revision'
  }

  // Review day: add review session
  if (isReviewDay && taskIndex === totalTasksForDay - 1) {
    return 'revision'
  }

  // Strong topics only get revision
  if (topicType === 'strong') return 'revision'

  // Phase-based allocation
  const phase = dayNumber / totalDays

  if (phase <= 0.4) {
    // Early phase: focus on studying weak/moderate topics
    if (taskIndex === 0) return 'study'
    if (taskIndex === 1) return 'ai_discussion'
    return 'quiz'
  } else if (phase <= 0.75) {
    // Middle phase: mix study + practice
    if (taskIndex === 0) return 'study'
    if (taskIndex === 1) return 'practice'
    return 'quiz'
  } else {
    // Late phase: revision + mock exams
    if (taskIndex === 0) return 'revision'
    if (taskIndex === 1) return 'mock_exam'
    return 'practice'
  }
}

function generateDailyTasks(
  dayNumber: number,
  totalDays: number,
  date: Date,
  dailyHours: number,
  topicWeights: TopicWeight[],
  practiceQuota: number // 15% of total hours allocated to practice/quiz
): GeneratedTask[] {
  const tasksForDay = getTasksPerDay(dailyHours)
  const isReviewDay = dayNumber % 3 === 0
  const isDayBeforeExam = dayNumber === totalDays

  const tasks: GeneratedTask[] = []

  // Assign topics to tasks based on weights (round-robin with weight bias)
  // Build a prioritized topic list for this day
  const dayTopics = selectTopicsForDay(dayNumber, totalDays, topicWeights)

  for (let i = 0; i < tasksForDay; i++) {
    const topicInfo = dayTopics[i % dayTopics.length] || dayTopics[0]
    const taskType = selectTaskType(dayNumber, totalDays, i, tasksForDay, isReviewDay, isDayBeforeExam, topicInfo.type)
    const duration = getTaskDurationSplit(dailyHours, i, tasksForDay)

    tasks.push({
      date: new Date(date),
      dayNumber,
      taskType,
      title: buildTaskTitle(taskType, topicInfo.topic),
      description: buildTaskDescription(taskType, topicInfo.topic, topicInfo.type, dayNumber, totalDays),
      duration,
      topic: topicInfo.topic,
      orderIndex: i,
    })
  }

  return tasks
}

function selectTopicsForDay(dayNumber: number, totalDays: number, topicWeights: TopicWeight[]): TopicWeight[] {
  if (topicWeights.length === 0) {
    return [{ topic: 'General Review', weight: 1, type: 'moderate' }]
  }

  // Rotate through topics so each day covers different topics
  // But bias early days toward weak topics and later days toward revision
  const offset = (dayNumber - 1) % topicWeights.length
  const rotated = [...topicWeights.slice(offset), ...topicWeights.slice(0, offset)]

  return rotated
}

function buildTaskTitle(taskType: TaskType, topic: string): string {
  switch (taskType) {
    case 'study': return `Study: ${topic}`
    case 'quiz': return `Quiz: ${topic}`
    case 'revision': return `Revision: ${topic}`
    case 'practice': return `Practice: ${topic}`
    case 'mock_exam': return `Mock Exam: ${topic}`
    case 'ai_discussion': return `AI Discussion: ${topic}`
    default: return `${topic}`
  }
}

function buildTaskDescription(
  taskType: TaskType,
  topic: string,
  topicType: string,
  dayNumber: number,
  totalDays: number
): string {
  const phase = dayNumber / totalDays

  switch (taskType) {
    case 'study':
      if (topicType === 'weak') {
        return `Focus on understanding core concepts of ${topic}. Take notes and work through examples. This is a priority area for improvement.`
      }
      return `Study ${topic} — read materials, watch videos, and complete exercises.`

    case 'quiz':
      return `Test your knowledge on ${topic}. Answer questions to identify gaps and reinforce learning.`

    case 'revision':
      if (phase > 0.7) {
        return `Final review of ${topic}. Focus on key formulas, definitions, and common exam patterns.`
      }
      return `Review previously covered material on ${topic}. Reinforce what you've learned so far.`

    case 'practice':
      return `Solve practice problems for ${topic}. Apply concepts to real exam-style questions.`

    case 'mock_exam':
      return `Take a timed mock exam covering ${topic} and related areas. Simulate real exam conditions.`

    case 'ai_discussion':
      return `Use AI tutor to discuss ${topic}. Ask questions about confusing parts and get explanations.`

    default:
      return `Work on ${topic}.`
  }
}

// ─── Main: Generate Study Plan ──────────────────────────────────────────────

export async function generateStudyPlan(params: GenerateStudyPlanParams) {
  const {
    userId,
    courseId,
    courseName,
    examDate,
    targetGrade,
    currentGrade,
    dailyHours,
    weakTopics: inputWeakTopics,
    strongTopics: inputStrongTopics,
  } = params

  // 1. Calculate days remaining
  const examDateObj = new Date(examDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const rawDaysRemaining = Math.max(1, Math.ceil((examDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
  // Cap at 90 days — beyond that, plans become unwieldy
  const daysRemaining = Math.min(rawDaysRemaining, 90)

  // 2. Total available hours
  const totalAvailableHours = daysRemaining * dailyHours

  // 3. Fetch user's learning profile
  let profile: Awaited<ReturnType<typeof getOrCreateProfile>> | null = null
  try {
    profile = await getOrCreateProfile(userId)
  } catch {
    // Profile creation can fail gracefully
  }

  const profileWeakTopics: string[] = profile?.weakTopics
    ? (() => { try { return JSON.parse(profile.weakTopics) } catch { return [] } })()
    : []
  const profileStrongTopics: string[] = profile?.strongTopics
    ? (() => { try { return JSON.parse(profile.strongTopics) } catch { return [] } })()
    : []

  // 4. Fetch user's enrollments and incomplete lessons
  const enrollments = await db.enrollment.findMany({
    where: { userId, status: { in: ['active', 'completed'] } },
    include: {
      course: {
        include: {
          modules: {
            include: { lessons: true },
          },
        },
      },
      lessonProgress: true,
    },
    take: 20,
  })

  // Extract incomplete lesson topics
  const incompleteTopics: string[] = []
  for (const enrollment of enrollments) {
    for (const courseModule of enrollment.course?.modules || []) {
      for (const lesson of courseModule.lessons) {
        const progress = enrollment.lessonProgress.find(lp => lp.lessonId === lesson.id)
        if (!progress || progress.status !== 'completed') {
          incompleteTopics.push(lesson.title)
        }
      }
    }
  }

  // 5. Merge input topics with profile/inferred topics
  const weakTopics = [...new Set([...(inputWeakTopics || []), ...profileWeakTopics])]
  const strongTopics = [...new Set([...(inputStrongTopics || []), ...profileStrongTopics])]

  // Derive all unique topics from weak + strong + incomplete
  const allTopicsSet = new Set([...weakTopics, ...strongTopics, ...incompleteTopics])
  const allTopics = Array.from(allTopicsSet)

  // If no topics at all, create generic ones based on course name
  if (allTopics.length === 0) {
    const genericTopics = courseName
      ? [`${courseName} - Fundamentals`, `${courseName} - Core Concepts`, `${courseName} - Advanced Topics`]
      : ['General Study', 'Review & Practice', 'Exam Preparation']
    genericTopics.forEach(t => {
      allTopics.push(t)
      weakTopics.push(t)
    })
  }

  // 6. Topic Weighting Algorithm
  const topicWeights = distributeTopics(weakTopics, strongTopics, allTopics)

  // 7. Generate daily tasks
  const allTasks: GeneratedTask[] = []

  for (let day = 1; day <= daysRemaining; day++) {
    const dayDate = new Date(today)
    dayDate.setDate(dayDate.getDate() + day - 1)

    const dailyTasks = generateDailyTasks(
      day,
      daysRemaining,
      dayDate,
      dailyHours,
      topicWeights,
      0.15 * totalAvailableHours
    )

    allTasks.push(...dailyTasks)
  }

  // 8. AI Enhancement (optional)
  const aiEnhancement = await generateAIPlanEnhancement({
    courseName,
    examDate,
    dailyHours,
    weakTopics,
    moderateTopics: allTopics.filter(t => !weakTopics.includes(t) && !strongTopics.includes(t)),
    strongTopics,
    totalDays: daysRemaining,
    targetGrade,
    currentGrade,
    learningLevel: profile?.learningLevel || undefined,
    learningSpeed: profile?.learningSpeed || undefined,
  }, userId)

  // Build planData JSON with AI tips if available
  const planDataObj: Record<string, unknown> = {
    totalDays: daysRemaining,
    dailyHours,
    topicWeights: topicWeights.map(tw => ({ topic: tw.topic, weight: tw.weight, type: tw.type })),
    weakTopics,
    strongTopics,
    totalAvailableHours,
  }
  if (aiEnhancement) {
    planDataObj.aiTips = aiEnhancement.tips
    planDataObj.aiFocusAreas = aiEnhancement.focusAreas
    planDataObj.aiScheduleNotes = aiEnhancement.scheduleNotes
  }

  // 9. Create StudyPlan record in DB with all computed tasks
  const title = courseName
    ? `Study Plan: ${courseName} (${daysRemaining} days)`
    : `Study Plan (${daysRemaining} days)`

  const plan = await db.studyPlan.create({
    data: {
      userId,
      title,
      examDate: examDateObj,
      availableHoursPerDay: dailyHours,
      subjects: JSON.stringify(courseId ? [courseId] : []),
      planData: JSON.stringify(planDataObj),
      status: 'active',
      progress: 0,
      targetGrade: targetGrade || null,
      currentGrade: currentGrade || null,
      courseName: courseName || null,
      totalDays: daysRemaining,
      completedTasks: 0,
      totalTasks: allTasks.length,
      tasks: {
        create: allTasks.map(task => ({
          date: task.date,
          dayNumber: task.dayNumber,
          taskType: task.taskType,
          title: task.title,
          description: task.description,
          duration: task.duration,
          topic: task.topic,
          status: 'pending',
          orderIndex: task.orderIndex,
        })),
      },
    },
    include: {
      tasks: {
        orderBy: [{ date: 'asc' }, { orderIndex: 'asc' }],
      },
    },
  })

  // 10. Log activity as study_plan_created
  try {
    await db.studentAIActivity.create({
      data: {
        userId,
        activityType: 'study_plan_created',
        mode: 'study_planner',
        metadata: JSON.stringify({
          planId: plan.id,
          totalDays: daysRemaining,
          totalTasks: allTasks.length,
          courseName,
        }),
      },
    })
  } catch {
    // Activity logging is non-critical
  }

  return plan
}

// ─── Get All Study Plans for a Student ──────────────────────────────────────

export async function getStudentStudyPlans(userId: string) {
  const plans = await db.studyPlan.findMany({
    where: { userId, status: { not: 'abandoned' } },
    include: {
      tasks: {
        orderBy: [{ date: 'asc' }, { orderIndex: 'asc' }],
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Group by status: active first, then completed
  const active = plans.filter(p => p.status === 'active')
  const completed = plans.filter(p => p.status === 'completed')

  return { active, completed, all: plans }
}

// ─── Update Study Plan Task ─────────────────────────────────────────────────

export async function updateStudyPlanTask(taskId: string, status: TaskStatus) {
  // Fetch the task with its parent plan
  const task = await db.studyPlanTask.findUnique({
    where: { id: taskId },
    include: { studyPlan: true },
  })

  if (!task) {
    throw new Error('Task not found')
  }

  // Update the task
  const updatedTask = await db.studyPlanTask.update({
    where: { id: taskId },
    data: {
      status,
      ...(status === 'completed' ? { completedAt: new Date() } : {}),
      ...(status !== 'completed' ? { completedAt: null } : {}),
    },
  })

  // Recalculate plan progress
  const planId = task.studyPlanId
  const allTasks = await db.studyPlanTask.findMany({
    where: { studyPlanId: planId },
  })

  const completedCount = allTasks.filter(t => t.status === 'completed').length
  const totalTasks = allTasks.length
  const progressPct = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0

  // Determine if plan should be marked as completed
  const planStatus = completedCount === totalTasks ? 'completed' : task.studyPlan.status

  await db.studyPlan.update({
    where: { id: planId },
    data: {
      completedTasks: completedCount,
      totalTasks,
      progress: progressPct,
      ...(planStatus === 'completed' ? { status: 'completed' } : {}),
    },
  })

  return updatedTask
}

// ─── Get Today's Tasks ──────────────────────────────────────────────────────

export async function getTodayTasks(userId: string) {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const activePlans = await db.studyPlan.findMany({
    where: { userId, status: 'active' },
    include: {
      tasks: {
        where: {
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
        orderBy: [{ orderIndex: 'asc' }],
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Flatten tasks with plan context
  const tasks = activePlans.flatMap(plan =>
    plan.tasks.map(task => ({
      ...task,
      planTitle: plan.title,
      planId: plan.id,
      courseName: plan.courseName,
    }))
  )

  return tasks
}

// ─── Delete / Abandon a Study Plan ──────────────────────────────────────────

export async function deleteStudyPlan(planId: string, userId: string) {
  // Verify ownership
  const plan = await db.studyPlan.findUnique({
    where: { id: planId },
  })

  if (!plan) {
    throw new Error('Study plan not found')
  }

  if (plan.userId !== userId) {
    throw new Error('Unauthorized: You do not own this study plan')
  }

  // Soft-delete by marking as abandoned
  const updated = await db.studyPlan.update({
    where: { id: planId },
    data: { status: 'abandoned' },
  })

  return updated
}

