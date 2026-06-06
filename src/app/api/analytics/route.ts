import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const role = searchParams.get('role') || 'student';
    const period = searchParams.get('period') || '30'; // days

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    if (role === 'student') {
      return await getStudentAnalytics(userId, daysAgo);
    } else if (role === 'instructor') {
      return await getInstructorAnalytics(userId, daysAgo);
    } else if (role === 'admin') {
      return await getAdminAnalytics(daysAgo);
    }

    return NextResponse.json(
      { error: 'Invalid role. Must be: student, instructor, or admin' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

async function getStudentAnalytics(userId: string, daysAgo: Date) {
  // Activity heatmap - daily activity for the period
  const dailyActivities = await db.dailyActivity.findMany({
    where: {
      userId,
      createdAt: { gte: daysAgo },
    },
    orderBy: { date: 'asc' },
  });

  // Weekly activity summary
  const weeklyActivity = await db.dailyActivity.findMany({
    where: {
      userId,
      createdAt: { gte: daysAgo },
    },
    orderBy: { date: 'asc' },
  });

  // Calculate totals
  const totalXpEarned = weeklyActivity.reduce((sum, d) => sum + d.xpEarned, 0);
  const totalLessonsCompleted = weeklyActivity.reduce(
    (sum, d) => sum + d.lessonsCompleted,
    0
  );
  const totalQuizzesTaken = weeklyActivity.reduce(
    (sum, d) => sum + d.quizzesTaken,
    0
  );
  const totalTimeSpent = weeklyActivity.reduce(
    (sum, d) => sum + d.timeSpent,
    0
  );

  // Subject performance
  const enrollments = await db.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          category: true,
        },
      },
      lessonProgress: {
        where: { status: 'completed' },
      },
    },
  });

  const subjectPerformance = enrollments.map((e) => ({
    courseId: e.course.id,
    courseTitle: e.course.title,
    category: e.course.category,
    progress: e.progress,
    completedLessons: e.lessonProgress.length,
  }));

  // Quiz performance
  const quizAttempts = await db.quizAttempt.findMany({
    where: { userId },
    orderBy: { completedAt: 'desc' },
    take: 20,
    include: {
      quiz: {
        select: {
          title: true,
          course: {
            select: { title: true },
          },
        },
      },
    },
  });

  // Average quiz score
  const avgQuizScore =
    quizAttempts.length > 0
      ? quizAttempts.reduce((sum, a) => sum + a.percentage, 0) /
        quizAttempts.length
      : 0;

  return NextResponse.json({
    role: 'student',
    period: {
      from: daysAgo.toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0],
    },
    overview: {
      totalXpEarned,
      totalLessonsCompleted,
      totalQuizzesTaken,
      totalTimeSpent,
      avgQuizScore: Math.round(avgQuizScore * 10) / 10,
    },
    heatmap: dailyActivities.map((d) => ({
      date: d.date,
      xp: d.xpEarned,
      lessons: d.lessonsCompleted,
      quizzes: d.quizzesTaken,
      timeSpent: d.timeSpent,
    })),
    subjectPerformance,
    recentQuizAttempts: quizAttempts.map((a) => ({
      id: a.id,
      quizTitle: a.quiz.title,
      courseTitle: a.quiz.course?.title,
      score: a.score,
      maxScore: a.maxScore,
      percentage: a.percentage,
      passed: a.passed,
      completedAt: a.completedAt,
    })),
  });
}

async function getInstructorAnalytics(userId: string, _daysAgo: Date) {
  // Get instructor's courses
  const courses = await db.course.findMany({
    where: { instructorId: userId },
    include: {
      enrollments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      },
      quizzes: {
        include: {
          attempts: {
            select: {
              id: true,
              percentage: true,
              passed: true,
            },
          },
        },
      },
      _count: {
        select: {
          modules: true,
        },
      },
    },
  });

  const coursePerformance = courses.map((course) => {
    const totalAttempts = course.quizzes.reduce(
      (sum, q) => sum + q.attempts.length,
      0
    );
    const passedAttempts = course.quizzes.reduce(
      (sum, q) => sum + q.attempts.filter((a) => a.passed).length,
      0
    );
    const avgScore =
      totalAttempts > 0
        ? course.quizzes.reduce(
            (sum, q) =>
              sum + q.attempts.reduce((s, a) => s + a.percentage, 0),
            0
          ) / totalAttempts
        : 0;

    return {
      courseId: course.id,
      courseTitle: course.title,
      category: course.category,
      enrollmentCount: course.enrollments.length,
      rating: course.rating,
      quizStats: {
        totalAttempts,
        passRate: totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
        avgScore: Math.round(avgScore * 10) / 10,
      },
      recentEnrollments: course.enrollments.slice(-5).map((e) => ({
        userName: e.user.name,
        enrolledAt: e.enrolledAt,
        progress: e.progress,
      })),
    };
  });

  return NextResponse.json({
    role: 'instructor',
    totalCourses: courses.length,
    totalEnrollments: courses.reduce(
      (sum, c) => sum + c.enrollments.length,
      0
    ),
    coursePerformance,
  });
}

async function getAdminAnalytics(_daysAgo: Date) {
  // Platform stats
  const stats = await db.platformStats.findFirst();

  // User growth
  const totalUsers = await db.user.count();
  const students = await db.user.count({ where: { role: 'student' } });
  const instructors = await db.user.count({ where: { role: 'instructor' } });
  const admins = await db.user.count({ where: { role: 'admin' } });

  // Course stats
  const totalCourses = await db.course.count();
  const publishedCourses = await db.course.count({
    where: { isPublished: true },
  });

  // Popular courses
  const popularCourses = await db.course.findMany({
    orderBy: { enrollmentCount: 'desc' },
    take: 10,
    include: {
      instructor: {
        select: { name: true },
      },
    },
  });

  // Total enrollments and certificates
  const totalEnrollments = await db.enrollment.count();
  const totalCertificates = await db.certificate.count();

  // Quiz attempt stats
  const totalQuizAttempts = await db.quizAttempt.count();
  const avgQuizScore = await db.quizAttempt.aggregate({
    _avg: { percentage: true },
  });

  // Daily activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentActivity = await db.dailyActivity.groupBy({
    by: ['date'],
    where: { createdAt: { gte: thirtyDaysAgo } },
    _sum: {
      xpEarned: true,
      lessonsCompleted: true,
      quizzesTaken: true,
      timeSpent: true,
    },
    _count: true,
    orderBy: { date: 'asc' },
  });

  // Active users (users with activity in last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const activeUsers = await db.dailyActivity.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { userId: true },
    distinct: ['userId'],
  });

  return NextResponse.json({
    role: 'admin',
    platformStats: stats,
    userStats: {
      total: totalUsers,
      students,
      instructors,
      admins,
      activeUsers: activeUsers.length,
    },
    courseStats: {
      total: totalCourses,
      published: publishedCourses,
    },
    engagement: {
      totalEnrollments,
      totalCertificates,
      totalQuizAttempts,
      avgQuizScore: avgQuizScore._avg.percentage
        ? Math.round(avgQuizScore._avg.percentage * 10) / 10
        : 0,
    },
    popularCourses: popularCourses.map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      enrollmentCount: c.enrollmentCount,
      rating: c.rating,
      instructor: c.instructor.name,
    })),
    dailyActivity: recentActivity.map((d) => ({
      date: d.date,
      totalXp: d._sum.xpEarned || 0,
      totalLessons: d._sum.lessonsCompleted || 0,
      totalQuizzes: d._sum.quizzesTaken || 0,
      activeUsers: d._count,
    })),
  });
}
