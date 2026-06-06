import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { enrollmentId, lessonId, status, timeSpent } = body;

    if (!enrollmentId || !lessonId || !status) {
      return NextResponse.json(
        { error: 'enrollmentId, lessonId, and status are required' },
        { status: 400 }
      );
    }

    if (!['not_started', 'in_progress', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be: not_started, in_progress, or completed' },
        { status: 400 }
      );
    }

    // Get the enrollment
    const enrollment = await db.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        lessonProgress: true,
        course: {
          include: {
            modules: {
              include: { lessons: true },
            },
          },
        },
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Enrollment not found' },
        { status: 404 }
      );
    }

    // Calculate XP for completing a lesson
    const XP_PER_LESSON = 25;

    // Upsert lesson progress
    const existingProgress = await db.lessonProgress.findUnique({
      where: {
        enrollmentId_lessonId: { enrollmentId, lessonId },
      },
    });

    let xpEarned = 0;

    if (existingProgress) {
      // If transitioning to completed for the first time, award XP
      const wasCompleted = existingProgress.status === 'completed';
      xpEarned = status === 'completed' && !wasCompleted ? XP_PER_LESSON : 0;

      await db.lessonProgress.update({
        where: { id: existingProgress.id },
        data: {
          status,
          timeSpent: timeSpent ?? existingProgress.timeSpent,
          completedAt: status === 'completed' ? new Date() : null,
          xpEarned: existingProgress.xpEarned + xpEarned,
        },
      });
    } else {
      xpEarned = status === 'completed' ? XP_PER_LESSON : 0;

      await db.lessonProgress.create({
        data: {
          enrollmentId,
          lessonId,
          status,
          timeSpent: timeSpent || 0,
          completedAt: status === 'completed' ? new Date() : null,
          xpEarned,
        },
      });
    }

    // Calculate overall course progress
    const totalLessons = enrollment.course.modules.reduce(
      (acc, mod) => acc + mod.lessons.filter(l => l.isPublished).length,
      0
    );

    // Re-fetch progress after update
    const allProgress = await db.lessonProgress.findMany({
      where: { enrollmentId },
    });

    // Get IDs of published lessons to filter completed count
    const publishedLessonIds = new Set(
      enrollment.course.modules.flatMap(mod =>
        mod.lessons.filter(l => l.isPublished).map(l => l.id)
      )
    );

    const completedCount = allProgress.filter(
      (p) => p.status === 'completed' && publishedLessonIds.has(p.lessonId)
    ).length;

    const progressPercentage =
      totalLessons > 0
        ? Math.round((completedCount / totalLessons) * 100)
        : 0;

    // Update enrollment progress
    const updateData: Record<string, unknown> = {
      progress: progressPercentage,
      lastAccessed: new Date(),
    };

    if (progressPercentage === 100) {
      updateData.completedAt = new Date();
    }

    await db.enrollment.update({
      where: { id: enrollmentId },
      data: updateData,
    });

    // Award XP to user
    if (xpEarned > 0) {
      await db.user.update({
        where: { id: enrollment.userId },
        data: {
          xp: { increment: xpEarned },
        },
      });

      // Update daily activity
      const today = new Date().toISOString().split('T')[0];
      await db.dailyActivity.upsert({
        where: {
          userId_date: {
            userId: enrollment.userId,
            date: today,
          },
        },
        create: {
          userId: enrollment.userId,
          date: today,
          xpEarned: xpEarned,
          lessonsCompleted: status === 'completed' ? 1 : 0,
          timeSpent: timeSpent || 0,
        },
        update: {
          xpEarned: { increment: xpEarned },
          lessonsCompleted:
            status === 'completed' ? { increment: 1 } : undefined,
          timeSpent: { increment: timeSpent || 0 },
        },
      });
    }

    // Check if course is complete and award Course Completer badge
    if (progressPercentage === 100) {
      const completerBadge = await db.badge.findFirst({
        where: { name: 'Course Completer' },
      });

      if (completerBadge) {
        const existingBadge = await db.userBadge.findUnique({
          where: {
            userId_badgeId: {
              userId: enrollment.userId,
              badgeId: completerBadge.id,
            },
          },
        });

        if (!existingBadge) {
          await db.userBadge.create({
            data: {
              userId: enrollment.userId,
              badgeId: completerBadge.id,
            },
          });

          // Award badge XP and coins
          await db.user.update({
            where: { id: enrollment.userId },
            data: {
              xp: { increment: completerBadge.xpReward },
              shijlCoins: { increment: completerBadge.coinReward },
            },
          });
        }
      }
    }

    return NextResponse.json({
      message: 'Progress updated successfully',
      progress: progressPercentage,
      xpEarned,
      courseCompleted: progressPercentage === 100,
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
