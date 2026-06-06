import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      );
    }

    // Validate userId exists in DB, fallback to first student user
    let effectiveUserId = userId;
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      const firstStudent = await db.user.findFirst({
        where: { role: 'student' },
        orderBy: { createdAt: 'asc' },
      });
      if (firstStudent) {
        effectiveUserId = firstStudent.id;
      } else {
        return NextResponse.json(
          { error: 'No student user found' },
          { status: 404 }
        );
      }
    }

    // Fetch earned certificates with all new fields
    const certificates = await db.certificate.findMany({
      where: { userId: effectiveUserId },
      orderBy: { issuedAt: 'desc' },
    });

    const earned = certificates.map((cert) => ({
      id: cert.id,
      userId: cert.userId,
      courseId: cert.courseId,
      courseTitle: cert.courseTitle,
      userName: cert.userName,
      instructorName: cert.instructorName,
      score: cert.score,
      issuedAt: cert.issuedAt.toISOString(),
      certificateId: cert.certificateId,
      verificationHash: cert.verificationHash,
      templateType: cert.templateType,
    }));

    // Fetch in-progress enrollments: certificateEnabled=true and progress < 100
    const inProgressEnrollments = await db.enrollment.findMany({
      where: {
        userId: effectiveUserId,
        progress: { lt: 100 },
        course: { certificateEnabled: true },
      },
      include: {
        course: {
          include: {
            modules: {
              orderBy: { order: 'asc' },
              include: {
                lessons: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
        lessonProgress: true,
      },
    });

    const inProgress = await Promise.all(
      inProgressEnrollments.map(async (enrollment) => {
        const course = enrollment.course;

        // Build a set of completed lesson IDs for fast lookup
        const completedLessonIds = new Set(
          enrollment.lessonProgress
            .filter((lp) => lp.status === 'completed')
            .map((lp) => lp.lessonId)
        );

        // Compute remaining items (lessons not completed)
        const remainingItems: string[] = [];
        let remainingDuration = 0;

        for (const courseModule of course.modules) {
          for (const lesson of courseModule.lessons) {
            if (!completedLessonIds.has(lesson.id)) {
              remainingItems.push(`${courseModule.title} → ${lesson.title}`);
              remainingDuration += lesson.duration;
            }
          }
        }

        // Total and completed lesson counts
        const allLessons = course.modules.flatMap((m) => m.lessons);
        const totalLessons = allLessons.length;
        const completedLessons = allLessons.filter((l) =>
          completedLessonIds.has(l.id)
        ).length;

        return {
          enrollmentId: enrollment.id,
          courseId: course.id,
          courseTitle: course.title,
          progress: enrollment.progress,
          totalLessons,
          completedLessons,
          remainingItems,
          estimatedTimeToComplete: Math.round(remainingDuration / 60),
          category: course.category,
          thumbnail: course.thumbnail,
          certificateEnabled: course.certificateEnabled,
        };
      })
    );

    return NextResponse.json({
      earned,
      inProgress,
      totalEarned: earned.length,
      totalInProgress: inProgress.length,
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch certificates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, courseId } = body;

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: 'userId and courseId are required' },
        { status: 400 }
      );
    }

    // Check if enrollment exists and course is completed
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Not enrolled in this course' },
        { status: 404 }
      );
    }

    if (enrollment.progress < 100) {
      return NextResponse.json(
        {
          error: 'Course not yet completed',
          progress: enrollment.progress,
        },
        { status: 400 }
      );
    }

    // Check if certificate already exists
    const existingCert = await db.certificate.findFirst({
      where: { userId, courseId },
    });

    if (existingCert) {
      return NextResponse.json({
        message: 'Certificate already exists',
        certificate: existingCert,
      });
    }

    // Get user and course details
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: { name: true },
        },
        quizzes: {
          include: {
            attempts: {
              where: { userId },
              orderBy: { percentage: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!user || !course) {
      return NextResponse.json(
        { error: 'User or course not found' },
        { status: 404 }
      );
    }

    // Calculate score (average of best quiz attempts)
    const quizScores = course.quizzes
      .filter((q) => q.attempts.length > 0)
      .map((q) => q.attempts[0].percentage);

    const score =
      quizScores.length > 0
        ? quizScores.reduce((a, b) => a + b, 0) / quizScores.length
        : 100;

    // Determine template type based on score
    let templateType = 'completion';
    if (score >= 95) {
      templateType = 'distinction';
    } else if (score >= 85) {
      templateType = 'excellence';
    }

    // Generate unique certificate ID (format: SHIJL-{COURSE_PREFIX}-{DATE}-{RANDOM})
    const coursePrefix = course.title
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .substring(0, 3);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 4)
      .toUpperCase();
    const certId = `SHIJL-${coursePrefix}-${dateStr}-${randomSuffix}`;

    // Generate a simulated verification hash
    const verificationHash = `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;

    // Get instructor name
    const instructorName = course.instructor?.name ?? null;

    // Create certificate
    const certificate = await db.certificate.create({
      data: {
        userId,
        courseId,
        courseTitle: course.title,
        userName: user.name,
        instructorName,
        score: Math.round(score * 10) / 10,
        certificateId: certId,
        verificationHash,
        templateType,
      },
    });

    // Award XP and coins for earning certificate
    await db.user.update({
      where: { id: userId },
      data: {
        xp: { increment: 200 },
        shijlCoins: { increment: 50 },
      },
    });

    // Award Certificate Earner badge
    const certBadge = await db.badge.findFirst({
      where: { name: 'Certificate Earner' },
    });

    if (certBadge) {
      const existingBadge = await db.userBadge.findUnique({
        where: {
          userId_badgeId: {
            userId,
            badgeId: certBadge.id,
          },
        },
      });

      if (!existingBadge) {
        await db.userBadge.create({
          data: { userId, badgeId: certBadge.id },
        });

        await db.user.update({
          where: { id: userId },
          data: {
            xp: { increment: certBadge.xpReward },
            shijlCoins: { increment: certBadge.coinReward },
          },
        });
      }
    }

    // Update platform stats
    await db.platformStats.updateMany({
      data: {
        totalCertificates: { increment: 1 },
      },
    });

    return NextResponse.json({
      message: 'Certificate generated successfully',
      certificate,
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    return NextResponse.json(
      { error: 'Failed to generate certificate' },
      { status: 500 }
    );
  }
}
