import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface QuickActionRequest {
  instructorId: string
  action: 'publish-course' | 'send-announcement' | 'reply-qa' | 'grade-submission' | 'message-student'
  payload: Record<string, unknown>
}

// POST /api/instructor/quick-actions - Execute quick actions from dashboard
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as QuickActionRequest
    const { instructorId, action, payload } = body

    if (!instructorId) {
      return NextResponse.json({ error: 'Instructor ID is required' }, { status: 400 })
    }

    const validActions = ['publish-course', 'send-announcement', 'reply-qa', 'grade-submission', 'message-student']
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: `action must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      )
    }

    if (!payload) {
      return NextResponse.json({ error: 'payload is required' }, { status: 400 })
    }

    // Verify instructor exists
    const instructor = await db.user.findUnique({
      where: { id: instructorId },
      select: { id: true, name: true, role: true },
    })
    if (!instructor) {
      return NextResponse.json({ error: 'Instructor not found' }, { status: 404 })
    }

    // Route to the appropriate handler
    switch (action) {
      case 'publish-course':
        return await handlePublishCourse(instructorId, payload)
      case 'send-announcement':
        return await handleSendAnnouncement(instructorId, payload)
      case 'reply-qa':
        return await handleReplyQA(instructorId, payload)
      case 'grade-submission':
        return await handleGradeSubmission(instructorId, payload)
      case 'message-student':
        return await handleMessageStudent(instructorId, payload)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error executing quick action:', error)
    return NextResponse.json(
      { error: 'Failed to execute quick action' },
      { status: 500 }
    )
  }
}

// ─── Handler: Publish a draft course ─────────────────────────────────────────
async function handlePublishCourse(instructorId: string, payload: Record<string, unknown>) {
  let { courseId } = payload as { courseId?: string }

  // Handle 'latest' courseId - find the most recent draft course
  if (!courseId || courseId === 'latest') {
    const latestDraft = await db.course.findFirst({
      where: { instructorId, isPublished: false, isArchived: false },
      orderBy: { createdAt: 'desc' },
    })
    if (!latestDraft) {
      return NextResponse.json({ error: 'No draft courses found to publish' }, { status: 404 })
    }
    courseId = latestDraft.id
  }

  // Verify course belongs to instructor
  const course = await db.course.findFirst({
    where: { id: courseId, instructorId },
  })

  if (!course) {
    return NextResponse.json({ error: 'Course not found or does not belong to this instructor' }, { status: 404 })
  }

  if (course.isPublished) {
    return NextResponse.json({ error: 'Course is already published' }, { status: 400 })
  }

  if (course.isArchived) {
    return NextResponse.json({ error: 'Cannot publish an archived course. Unarchive first.' }, { status: 400 })
  }

  // Publish the course
  const updated = await db.course.update({
    where: { id: courseId },
    data: {
      isPublished: true,
      reviewStatus: 'approved',
    },
  })

  // Log activity
  await db.activityLog.create({
    data: {
      userId: instructorId,
      type: 'course_published',
      title: `Course published: ${course.title}`,
      description: `Instructor published course "${course.title}"`,
      icon: '🚀',
      action: 'published',
      targetType: 'course',
      targetId: courseId,
      targetName: course.title,
      severity: 'info',
      category: 'admin_action',
    },
  }).catch(() => null)

  return NextResponse.json({
    success: true,
    action: 'publish-course',
    course: { id: updated.id, title: updated.title, isPublished: updated.isPublished },
    message: `Course "${course.title}" has been published successfully`,
  })
}

// ─── Handler: Send announcement to enrolled students ─────────────────────────
async function handleSendAnnouncement(instructorId: string, payload: Record<string, unknown>) {
  const { courseId, title, content } = payload as {
    courseId?: string
    title?: string
    content?: string
  }

  if (!courseId) {
    return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
  }

  if (!title || !content) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 })
  }

  // Handle 'all' courseId - send to all instructor's courses
  if (courseId === 'all') {
    const courses = await db.course.findMany({
      where: { instructorId, isPublished: true },
      include: {
        enrollments: {
          where: { status: 'active' },
          select: { userId: true, courseId: true },
        },
      },
    })

    if (courses.length === 0) {
      return NextResponse.json({ error: 'No published courses found' }, { status: 400 })
    }

    // Collect unique student IDs across all courses
    const allEnrollments = courses.flatMap(c => c.enrollments)
    const uniqueStudentIds = [...new Set(allEnrollments.map(e => e.userId))]

    if (uniqueStudentIds.length === 0) {
      return NextResponse.json({ error: 'No active students enrolled in your courses' }, { status: 400 })
    }

    const notificationData = uniqueStudentIds.map(userId => ({
      userId,
      type: 'promotion',
      title,
      content,
      icon: '📢',
      link: '/courses',
      senderId: instructorId,
      metadata: JSON.stringify({
        announcementType: 'course_announcement',
        allCourses: true,
      }),
    }))

    const result = await db.notification.createMany({
      data: notificationData,
    })

    return NextResponse.json({
      success: true,
      action: 'send-announcement',
      recipientsCount: result.count,
      message: `Announcement sent to ${result.count} student(s) across ${courses.length} courses`,
    })
  }

  // Verify course belongs to instructor
  const course = await db.course.findFirst({
    where: { id: courseId, instructorId },
    include: {
      enrollments: {
        where: { status: 'active' },
        select: { userId: true },
      },
    },
  })

  if (!course) {
    return NextResponse.json({ error: 'Course not found or does not belong to this instructor' }, { status: 404 })
  }

  if (course.enrollments.length === 0) {
    return NextResponse.json({ error: 'No active students enrolled in this course' }, { status: 400 })
  }

  // Create Notification records for each enrolled student
  const notificationData = course.enrollments.map((enrollment) => ({
    userId: enrollment.userId,
    type: 'promotion',
    title,
    content,
    icon: '📢',
    link: `/courses/${courseId}`,
    courseId,
    senderId: instructorId,
    metadata: JSON.stringify({
      announcementType: 'course_announcement',
      courseTitle: course.title,
    }),
  }))

  const result = await db.notification.createMany({
    data: notificationData,
  })

  return NextResponse.json({
    success: true,
    action: 'send-announcement',
    recipientsCount: result.count,
    message: `Announcement sent to ${result.count} student(s) in "${course.title}"`,
  })
}

// ─── Handler: Quick reply to a Q&A question ──────────────────────────────────
async function handleReplyQA(instructorId: string, payload: Record<string, unknown>) {
  const { questionId, content: answerContent } = payload as {
    questionId?: string
    content?: string
  }

  if (!questionId) {
    return NextResponse.json({ error: 'questionId is required' }, { status: 400 })
  }

  if (!answerContent) {
    return NextResponse.json({ error: 'content (answer) is required' }, { status: 400 })
  }

  // Verify the question belongs to one of instructor's courses
  const question = await db.qAQuestion.findUnique({
    where: { id: questionId },
    include: {
      course: { select: { instructorId: true, title: true, id: true } },
    },
  })

  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }

  if (question.course.instructorId !== instructorId) {
    return NextResponse.json({ error: 'This question does not belong to your course' }, { status: 403 })
  }

  // Create the answer
  const answer = await db.qAAnswer.create({
    data: {
      questionId,
      userId: instructorId,
      content: answerContent,
      isAiGenerated: false,
    },
  })

  // Mark question as answered
  await db.qAQuestion.update({
    where: { id: questionId },
    data: { isAnswered: true },
  })

  // Notify the student who asked the question
  await db.notification.create({
    data: {
      userId: question.userId,
      type: 'qa',
      title: 'Your question has been answered',
      content: `Your question in "${question.course.title}" has been answered by the instructor.`,
      icon: '💬',
      link: `/courses/${question.courseId}`,
      courseId: question.courseId,
      senderId: instructorId,
      metadata: JSON.stringify({
        questionId,
        answerId: answer.id,
        courseTitle: question.course.title,
      }),
    },
  })

  return NextResponse.json({
    success: true,
    action: 'reply-qa',
    answer: { id: answer.id, content: answer.content, createdAt: answer.createdAt.toISOString() },
    message: 'Answer posted successfully',
  })
}

// ─── Handler: Quick grade a submission ────────────────────────────────────────
async function handleGradeSubmission(instructorId: string, payload: Record<string, unknown>) {
  const { submissionId, score, feedback } = payload as {
    submissionId?: string
    score?: number
    feedback?: string
  }

  if (!submissionId) {
    return NextResponse.json({ error: 'submissionId is required' }, { status: 400 })
  }

  if (score === undefined || score === null) {
    return NextResponse.json({ error: 'score is required' }, { status: 400 })
  }

  // Verify submission belongs to instructor's course
  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    include: {
      assignment: {
        select: { courseId: true, maxScore: true, title: true, course: { select: { instructorId: true, title: true } } },
      },
      student: { select: { id: true, name: true } },
    },
  })

  if (!submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  if (submission.assignment.course.instructorId !== instructorId) {
    return NextResponse.json({ error: 'This submission does not belong to your course' }, { status: 403 })
  }

  if (score < 0 || score > submission.assignment.maxScore) {
    return NextResponse.json(
      { error: `Score must be between 0 and ${submission.assignment.maxScore}` },
      { status: 400 }
    )
  }

  // Update the submission
  const updated = await db.submission.update({
    where: { id: submissionId },
    data: {
      status: 'graded',
      score,
      feedback: feedback || null,
      gradedAt: new Date(),
      gradedBy: instructorId,
    },
  })

  // Notify the student
  await db.notification.create({
    data: {
      userId: submission.studentId,
      type: 'assignment',
      title: 'Your submission has been graded',
      content: `Your submission for "${submission.assignment.title}" has been graded. Score: ${score}/${submission.assignment.maxScore}`,
      icon: '✅',
      link: `/courses/${submission.assignment.courseId}`,
      courseId: submission.assignment.courseId,
      senderId: instructorId,
      metadata: JSON.stringify({
        submissionId,
        score,
        maxScore: submission.assignment.maxScore,
        assignmentTitle: submission.assignment.title,
        courseTitle: submission.assignment.course.title,
      }),
    },
  })

  return NextResponse.json({
    success: true,
    action: 'grade-submission',
    submission: {
      id: updated.id,
      status: updated.status,
      score: updated.score,
      feedback: updated.feedback,
    },
    message: `Submission graded: ${score}/${submission.assignment.maxScore}`,
  })
}

// ─── Handler: Send message to a student ──────────────────────────────────────
async function handleMessageStudent(instructorId: string, payload: Record<string, unknown>) {
  const { studentId, message: messageContent, courseId } = payload as {
    studentId?: string
    message?: string
    courseId?: string
  }

  if (!studentId) {
    return NextResponse.json({ error: 'studentId is required' }, { status: 400 })
  }

  if (!messageContent) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }

  // Verify student exists
  const student = await db.user.findUnique({
    where: { id: studentId },
    select: { id: true, name: true },
  })

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  // Find or create a conversation between instructor and student
  let conversation = await db.conversation.findFirst({
    where: {
      type: 'direct',
      courseId: courseId || null,
      participants: {
        every: {
          userId: { in: [instructorId, studentId] },
        },
      },
    },
    include: {
      participants: { select: { userId: true } },
    },
  })

  // Check that the conversation has exactly these 2 participants
  if (conversation && conversation.participants.length !== 2) {
    conversation = null
  }

  if (!conversation) {
    // Create a new conversation
    conversation = await db.conversation.create({
      data: {
        type: 'direct',
        courseId: courseId || null,
        lastMessageAt: new Date(),
        lastMessageContent: messageContent.substring(0, 200),
        participants: {
          create: [
            { userId: instructorId, role: 'admin' },
            { userId: studentId, role: 'member' },
          ],
        },
      },
      include: {
        participants: { select: { userId: true } },
      },
    })
  } else {
    // Update conversation's last message info
    await db.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        lastMessageContent: messageContent.substring(0, 200),
      },
    })
  }

  // Create the message
  const message = await db.message.create({
    data: {
      conversationId: conversation.id,
      senderId: instructorId,
      content: messageContent,
      type: 'text',
      isRead: false,
    },
  })

  // Notify the student about the new message
  await db.notification.create({
    data: {
      userId: studentId,
      type: 'message',
      title: 'New message from your instructor',
      content: messageContent.substring(0, 100) + (messageContent.length > 100 ? '...' : ''),
      icon: '✉️',
      link: courseId ? `/courses/${courseId}` : '/messages',
      courseId: courseId || null,
      senderId: instructorId,
      metadata: JSON.stringify({
        conversationId: conversation.id,
        messageId: message.id,
        messageType: 'direct',
      }),
    },
  })

  return NextResponse.json({
    success: true,
    action: 'message-student',
    message: {
      id: message.id,
      conversationId: conversation.id,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    },
    recipient: { id: student.id, name: student.name },
    messageSent: `Message sent to ${student.name}`,
  })
}
