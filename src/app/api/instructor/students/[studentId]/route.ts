import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/instructor/students/[studentId]?instructorId=xxx
// Returns comprehensive student detail data matching StudentDetailData interface
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params
    const instructorId = request.nextUrl.searchParams.get('instructorId')

    if (!instructorId) {
      return NextResponse.json(
        { error: 'Instructor ID is required' },
        { status: 400 }
      )
    }

    // ── 1. Fetch the student profile ──────────────────────────────
    const student = await db.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        adminNotes: true,
        xp: true,
        level: true,
        shijlCoins: true,
        streak: true,
        longestStreak: true,
        lastActiveAt: true,
        createdAt: true,
      },
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // ── 2. Get all courses taught by this instructor ───────────────
    const instructorCourses = await db.course.findMany({
      where: { instructorId },
      select: {
        id: true,
        title: true,
        thumbnail: true,
        category: true,
        level: true,
      },
    })

    const instructorCourseIds = instructorCourses.map((c) => c.id)

    if (instructorCourseIds.length === 0) {
      return NextResponse.json(
        { error: 'Student not found or not enrolled in instructor courses' },
        { status: 404 }
      )
    }

    // ── 3. Fetch student enrollments in instructor's courses ───────
    const enrollments = await db.enrollment.findMany({
      where: {
        userId: studentId,
        courseId: { in: instructorCourseIds },
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            category: true,
            level: true,
          },
        },
        lessonProgress: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                duration: true,
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    })

    // Verify the student is enrolled in at least one of the instructor's courses
    if (enrollments.length === 0) {
      return NextResponse.json(
        { error: 'Student not found or not enrolled in instructor courses' },
        { status: 404 }
      )
    }

    // ── 4. Fetch quiz attempts (for quizzes in instructor's courses) ─
    const quizAttempts = await db.quizAttempt.findMany({
      where: {
        userId: studentId,
        quiz: {
          courseId: { in: instructorCourseIds },
        },
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            courseId: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    })

    // ── 5. Fetch assignment submissions (for assignments in instructor's courses) ─
    const submissions = await db.submission.findMany({
      where: {
        studentId: studentId,
        assignment: {
          courseId: { in: instructorCourseIds },
        },
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            maxScore: true,
            courseId: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    })

    // ── 6. Fetch certificates (for instructor's courses) ───────────
    const certificates = await db.certificate.findMany({
      where: {
        userId: studentId,
        courseId: { in: instructorCourseIds },
      },
      orderBy: { issuedAt: 'desc' },
    })

    // ── 7. Fetch all badges earned by the student ──────────────────
    const userBadges = await db.userBadge.findMany({
      where: { userId: studentId },
      include: {
        badge: {
          select: {
            id: true,
            name: true,
            description: true,
            icon: true,
            category: true,
          },
        },
      },
      orderBy: { earnedAt: 'desc' },
    })

    // ── 8. Fetch xp activities for timeline ────────────────────────
    const xpActivities = await db.xpActivity.findMany({
      where: { userId: studentId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    // ── Compute derived fields ─────────────────────────────────────

    // Days since last active
    const daysSinceLastActive = Math.floor(
      (Date.now() - new Date(student.lastActiveAt).getTime()) /
        (1000 * 60 * 60 * 24)
    )

    // Average progress across enrollments
    const avgProgress =
      enrollments.length > 0
        ? enrollments.reduce((sum, e) => sum + e.progress, 0) /
          enrollments.length
        : 0

    // Completion rate
    const completedEnrollmentCount = enrollments.filter(
      (e) => e.status === 'completed'
    ).length
    const completionRate =
      enrollments.length > 0
        ? (completedEnrollmentCount / enrollments.length) * 100
        : 0

    // Engagement score (0-100): recency (40pts) + progress (30pts) + completion (30pts)
    let recencyScore = 0
    if (daysSinceLastActive <= 3) {
      recencyScore = 40
    } else if (daysSinceLastActive <= 7) {
      recencyScore = 30
    } else if (daysSinceLastActive <= 14) {
      recencyScore = 20
    } else if (daysSinceLastActive <= 30) {
      recencyScore = 10
    }

    const progressScore = (avgProgress / 100) * 30
    const completionScore = (completionRate / 100) * 30
    const engagementScore = Math.min(
      100,
      Math.round(recencyScore + progressScore + completionScore)
    )

    // Risk level based on days since last active and average progress
    let riskLevel: 'low' | 'medium' | 'high'
    if (
      daysSinceLastActive > 30 ||
      (avgProgress < 20 && daysSinceLastActive > 14)
    ) {
      riskLevel = 'high'
    } else if (
      daysSinceLastActive > 14 ||
      (avgProgress < 40 && daysSinceLastActive > 7)
    ) {
      riskLevel = 'medium'
    } else {
      riskLevel = 'low'
    }

    // Status: 'completed' if all courses completed, 'active' if accessed within 30 days, 'dropped' otherwise
    const allCoursesCompleted =
      enrollments.length > 0 &&
      enrollments.every((e) => e.status === 'completed')
    const status: string = allCoursesCompleted
      ? 'completed'
      : daysSinceLastActive <= 30
        ? 'active'
        : 'dropped'

    // ── Build the response ─────────────────────────────────────────

    // 1. StudentInfo (merged profile + gamification + computed fields)
    const studentInfo = {
      id: student.id,
      name: student.name,
      email: student.email,
      avatar: student.avatar,
      bio: student.bio,
      xp: student.xp,
      level: student.level,
      shijlCoins: student.shijlCoins,
      streak: student.streak,
      longestStreak: student.longestStreak,
      lastActiveAt: student.lastActiveAt.toISOString(),
      createdAt: student.createdAt.toISOString(),
      status,
      engagementScore,
      riskLevel,
    }

    // 2. Stats
    const totalLearningTime = enrollments.reduce(
      (sum, e) =>
        sum + e.lessonProgress.reduce((s, lp) => s + lp.timeSpent, 0),
      0
    )

    const totalLessonsCompleted = enrollments.reduce(
      (sum, e) =>
        sum +
        e.lessonProgress.filter((lp) => lp.status === 'completed').length,
      0
    )

    const totalLessons = enrollments.reduce(
      (sum, e) => sum + e.lessonProgress.length,
      0
    )

    const quizPassRate =
      quizAttempts.length > 0
        ? Math.round(
            (quizAttempts.filter((qa) => qa.passed).length /
              quizAttempts.length) *
              100
          )
        : 0

    const stats = {
      totalCoursesEnrolled: enrollments.length,
      averageProgress: Math.round(avgProgress),
      totalLearningTime,
      lessonsCompleted: totalLessonsCompleted,
      totalLessons,
      quizPassRate,
      assignmentsSubmitted: submissions.length,
      completedCourses: completedEnrollmentCount,
    }

    // 3. EnrolledCourseDetail[] (with lessons array from LessonProgress)
    const enrolledCourses = enrollments.map((enrollment) => {
      const completedLessons = enrollment.lessonProgress.filter(
        (lp) => lp.status === 'completed'
      ).length
      const totalTimeSpent = enrollment.lessonProgress.reduce(
        (sum, lp) => sum + lp.timeSpent,
        0
      )

      const lessons = enrollment.lessonProgress.map((lp) => ({
        id: lp.lesson.id,
        title: lp.lesson.title,
        status: lp.status,
        timeSpent: lp.timeSpent,
        completedAt: lp.completedAt ? lp.completedAt.toISOString() : null,
      }))

      return {
        courseId: enrollment.course.id,
        courseTitle: enrollment.course.title,
        category: enrollment.course.category,
        level: enrollment.course.level,
        thumbnail: enrollment.course.thumbnail,
        progress: enrollment.progress,
        enrolledAt: enrollment.enrolledAt.toISOString(),
        lastAccessed: enrollment.lastAccessed.toISOString(),
        completedAt: enrollment.completedAt
          ? enrollment.completedAt.toISOString()
          : null,
        completedLessons,
        totalLessons: enrollment.lessonProgress.length,
        totalTimeSpent,
        lessons,
      }
    })

    // 4. QuizAttemptDetail[]
    const quizAttemptsData = quizAttempts.map((qa) => ({
      id: qa.id,
      quizTitle: qa.quiz.title,
      score: qa.score,
      maxScore: qa.maxScore,
      percentage: qa.percentage,
      passed: qa.passed,
      startedAt: qa.startedAt.toISOString(),
      completedAt: qa.completedAt ? qa.completedAt.toISOString() : null,
      xpEarned: qa.xpEarned,
    }))

    // 5. QuizStats
    const quizStats = {
      total: quizAttempts.length,
      passed: quizAttempts.filter((qa) => qa.passed).length,
      avgScore:
        quizAttempts.length > 0
          ? Math.round(
              quizAttempts.reduce((sum, qa) => sum + qa.percentage, 0) /
                quizAttempts.length
            )
          : 0,
    }

    // 6. SubmissionDetail[]
    const submissionsData = submissions.map((sub) => ({
      id: sub.id,
      assignmentTitle: sub.assignment.title,
      status: sub.status,
      score: sub.score,
      maxScore: sub.assignment.maxScore,
      submittedAt: sub.submittedAt.toISOString(),
      gradedAt: sub.gradedAt ? sub.gradedAt.toISOString() : null,
      feedback: sub.feedback,
    }))

    // 7. AssignmentStats
    const assignmentStats = {
      total: submissions.length,
      submitted: submissions.filter((s) => s.status === 'submitted').length,
      graded: submissions.filter(
        (s) => s.status === 'graded' || s.status === 'grading'
      ).length,
      returned: submissions.filter((s) => s.status === 'returned').length,
    }

    // 8. CertificateDetail[]
    const certificatesData = certificates.map((cert) => ({
      id: cert.id,
      courseTitle: cert.courseTitle,
      userName: cert.userName,
      instructorName: cert.instructorName,
      score: cert.score,
      issuedAt: cert.issuedAt.toISOString(),
      certificateId: cert.certificateId,
      templateType: cert.templateType,
    }))

    // 9. BadgeDetail[]
    const badgesData = userBadges.map((ub) => ({
      id: ub.badge.id,
      name: ub.badge.name,
      description: ub.badge.description,
      icon: ub.badge.icon,
      category: ub.badge.category,
      earnedAt: ub.earnedAt.toISOString(),
    }))

    // 10. Instructor Notes (from adminNotes JSON, filtered by instructorId)
    interface NoteEntry { note: string; instructorId: string; instructorName: string; date: string }
    let allNotes: NoteEntry[] = []
    if (student.adminNotes) {
      try { allNotes = JSON.parse(student.adminNotes) } catch { allNotes = [] }
    }
    const instructorNotes = allNotes
      .filter(n => n.instructorId === instructorId)
      .map(n => ({ note: n.note, instructorName: n.instructorName, date: n.date }))

    // 11. Timeline from XpActivity (most recent 20)
    const timeline = xpActivities.map((activity) => ({
      type: activity.action,
      title: activity.description,
      date: activity.createdAt.toISOString(),
      description: activity.description,
    }))

    return NextResponse.json({
      student: studentInfo,
      stats,
      enrolledCourses,
      quizAttempts: quizAttemptsData,
      quizStats,
      submissions: submissionsData,
      assignmentStats,
      certificates: certificatesData,
      badges: badgesData,
      instructorNotes,
      timeline,
    })
  } catch (error) {
    console.error('Error fetching student detail:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
