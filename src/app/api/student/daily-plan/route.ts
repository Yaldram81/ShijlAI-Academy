import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// GET /api/student/daily-plan?userId=xxx — AI-powered daily study plan
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    // Validate the user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, streak: true, xp: true, level: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch student's enrollments with course, lesson progress, and assignments in parallel
    const [enrollments, upcomingAssignments, recentProgress] = await Promise.all([
      db.enrollment.findMany({
        where: { userId },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              category: true,
              level: true,
              estimatedDuration: true,
              modules: {
                select: { id: true, title: true, order: true },
                orderBy: { order: 'asc' },
              },
            },
          },
          lessonProgress: {
            include: {
              lesson: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                  duration: true,
                  order: true,
                  moduleId: true,
                },
              },
            },
            orderBy: { completedAt: 'desc' },
          },
        },
        orderBy: { lastAccessed: 'desc' },
      }),

      db.assignment.findMany({
        where: {
          course: { enrollments: { some: { userId } } },
          isPublished: true,
          dueDate: { gte: new Date() },
        },
        select: {
          id: true,
          title: true,
          dueDate: true,
          type: true,
          course: { select: { id: true, title: true } },
        },
        orderBy: { dueDate: 'asc' },
        take: 10,
      }),

      db.lessonProgress.findMany({
        where: {
          enrollment: { userId },
          status: 'in_progress',
        },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              type: true,
              duration: true,
              module: {
                select: {
                  course: {
                    select: { id: true, title: true },
                  },
                },
              },
            },
          },
        },
        take: 10,
      }),
    ])

    // Build context for the AI prompt
    const enrolledCourses = enrollments.map((e) => ({
      courseId: e.courseId,
      title: e.course.title,
      category: e.course.category,
      level: e.course.level,
      progress: Math.round(e.progress),
      lastAccessed: e.lastAccessed.toISOString(),
    }))

    const incompleteLessons = recentProgress.map((lp) => ({
      lessonId: lp.lessonId,
      title: lp.lesson.title,
      type: lp.lesson.type,
      duration: lp.lesson.duration,
      course: lp.lesson.module.course.title,
      status: lp.status,
      timeSpent: lp.timeSpent,
    }))

    // Find next unstarted lessons across enrollments
    const nextLessons: {
      lessonId: string
      title: string
      type: string
      duration: number
      course: string
      moduleId: string
    }[] = []

    for (const enrollment of enrollments) {
      const completedLessonIds = new Set(
        enrollment.lessonProgress
          .filter((lp) => lp.status === 'completed')
          .map((lp) => lp.lessonId)
      )

      // Find lessons in course modules that haven't been started
      for (const courseModule of enrollment.course.modules) {
        const lessonsInModule = await db.lesson.findMany({
          where: {
            moduleId: courseModule.id,
            isPublished: true,
            id: { notIn: [...completedLessonIds] },
          },
          select: {
            id: true,
            title: true,
            type: true,
            duration: true,
            moduleId: true,
          },
          orderBy: { order: 'asc' },
          take: 2,
        })

        for (const lesson of lessonsInModule) {
          nextLessons.push({
            lessonId: lesson.id,
            title: lesson.title,
            type: lesson.type,
            duration: lesson.duration,
            course: enrollment.course.title,
            moduleId: lesson.moduleId,
          })
        }

        if (nextLessons.length >= 6) break
      }
      if (nextLessons.length >= 6) break
    }

    const assignmentsDue = upcomingAssignments.map((a) => ({
      id: a.id,
      title: a.title,
      dueDate: a.dueDate?.toISOString().split('T')[0] ?? 'No due date',
      type: a.type,
      course: a.course.title,
    }))

    // Get quizzes available for the student's courses
    const courseIds = enrollments.map((e) => e.courseId)
    const availableQuizzes = await db.quiz.findMany({
      where: {
        courseId: { in: courseIds },
        isPublished: true,
      },
      select: {
        id: true,
        title: true,
        type: true,
        timeLimit: true,
        course: { select: { title: true } },
      },
      take: 5,
    })

    const quizzesAvailable = availableQuizzes.map((q) => ({
      id: q.id,
      title: q.title,
      type: q.type,
      timeLimit: q.timeLimit,
      course: q.course.title,
    }))

    // Build the student context summary
    const studentContext = {
      name: user.name,
      streak: user.streak,
      xp: user.xp,
      level: user.level,
      enrolledCourses,
      incompleteLessons,
      nextLessons: nextLessons.slice(0, 6),
      assignmentsDue,
      quizzesAvailable,
    }

    // Try AI-powered daily plan generation
    try {
      const systemPrompt = `You are an AI study planner for ShijlAI Academy, an international education platform. Generate a personalized daily study plan as a JSON object. The plan should be practical, balanced, and consider the student's current progress, upcoming deadlines, and learning streak.

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "greeting": "A personalized motivational message",
  "focusArea": "Main topic to focus on today",
  "tasks": [
    {
      "type": "lesson" | "quiz" | "reading" | "assignment",
      "title": "Task title",
      "course": "Course name",
      "estimatedMinutes": 30,
      "priority": "high" | "medium" | "low",
      "notes": "Brief tip or context"
    }
  ],
  "totalEstimatedMinutes": 120,
  "streakMessage": "Encouragement about their streak",
  "tip": "A study tip for today"
}

Rules:
- Include 4-8 tasks, mixing lesson watching, quizzes, reading, and assignments
- Prioritize in-progress lessons and upcoming assignment deadlines
- Keep total estimated time between 60-180 minutes
- Be specific with course and lesson names from the student's data
- If assignments are due soon, mark them as high priority`

      const userPrompt = `Generate a daily study plan for this student:

Student: ${user.name} (Level ${user.level}, ${user.xp} XP, ${user.streak}-day streak)

Enrolled Courses:
${enrolledCourses.map((c) => `- ${c.title} (${c.category}, ${c.level}) — ${c.progress}% complete`).join('\n')}

Incomplete Lessons (in progress):
${incompleteLessons.length > 0 ? incompleteLessons.map((l) => `- ${l.title} (${l.type}, ${l.duration}min) in ${l.course}`).join('\n') : 'None currently in progress'}

Next Lessons to Start:
${nextLessons.slice(0, 6).map((l) => `- ${l.title} (${l.type}, ${l.duration}min) in ${l.course}`).join('\n') || 'No new lessons available'}

Upcoming Assignments:
${assignmentsDue.length > 0 ? assignmentsDue.map((a) => `- ${a.title} (${a.type}) due ${a.dueDate} in ${a.course}`).join('\n') : 'No upcoming assignments'}

Available Quizzes:
${quizzesAvailable.map((q) => `- ${q.title} (${q.type}, ${q.timeLimit || 'no'} min limit) in ${q.course}`).join('\n') || 'No quizzes available'}`

      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        thinking: { type: 'disabled' },
      })

      const aiResponse = completion.choices[0]?.message?.content

      if (aiResponse) {
        // Parse the JSON response from AI
        let cleanedResponse = aiResponse.trim()
        // Remove markdown code blocks if present
        if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '')
        }

        try {
          const aiPlan = JSON.parse(cleanedResponse)
          // Map AI response to frontend-expected format
          const mappedTasks = (aiPlan.tasks || []).map((t: { type?: string; title?: string; estimatedMinutes?: number; notes?: string; course?: string }) => {
            const typeMap: Record<string, 'watch' | 'quiz' | 'read' | 'assignment'> = {
              lesson: 'watch',
              video: 'watch',
              reading: 'read',
              read: 'read',
              quiz: 'quiz',
              assignment: 'assignment',
            }
            return {
              task: t.title || 'Study task',
              type: typeMap[t.type?.toLowerCase()] || 'watch',
              duration: t.estimatedMinutes ? `${t.estimatedMinutes} min` : '20 min',
              dueDate: undefined as string | undefined,
            }
          })
          // Attach due dates from assignment data
          for (let i = 0; i < mappedTasks.length; i++) {
            if (mappedTasks[i].type === 'assignment' && assignmentsDue.length > 0) {
              const idx = Math.min(i, assignmentsDue.length - 1)
              mappedTasks[i].dueDate = assignmentsDue[idx].dueDate
            }
          }
          const totalMin = (aiPlan.totalEstimatedMinutes as number) || mappedTasks.reduce((sum: number, t: { duration: string }) => sum + parseInt(t.duration), 0)
          return NextResponse.json({
            plan: mappedTasks,
            totalEstimatedTime: `${totalMin} min`,
            aiGenerated: true,
          })
        } catch {
          // JSON parsing failed, fall through to fallback
          console.warn('AI response was not valid JSON, using fallback plan')
        }
      }
    } catch (aiError) {
      console.error('AI daily plan generation failed:', aiError)
      // Fall through to fallback
    }

    // Fallback plan based on student data
    const fallbackPlan = buildFallbackPlan(user, nextLessons, assignmentsDue, quizzesAvailable, enrolledCourses)
    return NextResponse.json({
      plan: fallbackPlan.plan,
      totalEstimatedTime: fallbackPlan.totalEstimatedTime,
      aiGenerated: false,
    })
  } catch (error) {
    console.error('Error generating daily plan:', error)
    return NextResponse.json(
      { error: 'Failed to generate daily plan' },
      { status: 500 }
    )
  }
}

// Build a deterministic fallback plan when AI is unavailable
function buildFallbackPlan(
  user: { name: string; streak: number; xp: number; level: number },
  nextLessons: { lessonId: string; title: string; type: string; duration: number; course: string }[],
  assignmentsDue: { id: string; title: string; dueDate: string; type: string; course: string }[],
  quizzesAvailable: { id: string; title: string; type: string; timeLimit: number; course: string }[],
  _enrolledCourses: { courseId: string; title: string; category: string; level: string; progress: number }[]
) {
  const plan: {
    task: string
    type: 'watch' | 'quiz' | 'read' | 'assignment'
    duration: string
    dueDate?: string
  }[] = []

  // Add high-priority assignments that are due soon
  for (const assignment of assignmentsDue.slice(0, 2)) {
    plan.push({
      task: `Submit: ${assignment.title}`,
      type: 'assignment',
      duration: '30 min',
      dueDate: assignment.dueDate,
    })
  }

  // Add next lessons to watch
  for (const lesson of nextLessons.slice(0, 3)) {
    const taskType: 'watch' | 'read' = lesson.type === 'text' ? 'read' : 'watch'
    plan.push({
      task: lesson.title,
      type: taskType,
      duration: `${Math.max(15, lesson.duration || 20)} min`,
    })
  }

  // Add a quiz if available
  if (quizzesAvailable.length > 0) {
    const quiz = quizzesAvailable[0]
    plan.push({
      task: quiz.title,
      type: 'quiz',
      duration: `${quiz.timeLimit || 20} min`,
    })
  }

  // Add reading if we have room
  if (plan.length < 5 && nextLessons.length > 3) {
    const lesson = nextLessons[3]
    plan.push({
      task: `Review: ${lesson.title}`,
      type: 'read',
      duration: '15 min',
    })
  }

  const totalMin = plan.reduce((sum, t) => sum + parseInt(t.duration), 0)

  // These are kept for potential server-side use but not returned in response
  void user
  void _enrolledCourses

  return {
    plan,
    totalEstimatedTime: `${totalMin} min`,
  }
}
