import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface AnswerInput {
  questionId: string;
  answer: string;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, answers } = body as { userId: string; answers: AnswerInput[] };

    if (!userId || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'userId and answers array are required' },
        { status: 400 }
      );
    }

    // Fetch quiz with questions
    const quiz = await db.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Grade the quiz
    let totalScore = 0;
    let maxScore = 0;
    const gradedAnswers: Array<{
      questionId: string;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
      explanation: string | null;
      points: number;
    }> = [];

    for (const question of quiz.questions) {
      maxScore += question.points;
      const userAnswer = answers.find(
        (a: AnswerInput) => a.questionId === question.id
      );

      if (userAnswer) {
        const isCorrect =
          userAnswer.answer.trim().toLowerCase() ===
          (question.correctAnswer || '').trim().toLowerCase();

        if (isCorrect) {
          totalScore += question.points;
        }

        gradedAnswers.push({
          questionId: question.id,
          userAnswer: userAnswer.answer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          explanation: question.explanation,
          points: question.points,
        });
      } else {
        gradedAnswers.push({
          questionId: question.id,
          userAnswer: '',
          correctAnswer: question.correctAnswer,
          isCorrect: false,
          explanation: question.explanation,
          points: question.points,
        });
      }
    }

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const passed = percentage >= quiz.passingScore;

    // Calculate XP earned
    const baseXP = 20;
    const bonusXP = passed ? 30 : 0;
    const perfectBonus = percentage === 100 ? 50 : 0;
    const xpEarned = baseXP + bonusXP + perfectBonus;

    // Create quiz attempt
    const attempt = await db.quizAttempt.create({
      data: {
        userId,
        quizId: id,
        score: totalScore,
        maxScore,
        percentage,
        passed,
        answers: JSON.stringify(gradedAnswers),
        xpEarned,
        completedAt: new Date(),
      },
    });

    // Award XP to user
    await db.user.update({
      where: { id: userId },
      data: {
        xp: { increment: xpEarned },
        shijlCoins: { increment: passed ? 20 : 5 },
      },
    });

    // Update daily activity
    const today = new Date().toISOString().split('T')[0];
    await db.dailyActivity.upsert({
      where: {
        userId_date: { userId, date: today },
      },
      create: {
        userId,
        date: today,
        xpEarned,
        quizzesTaken: 1,
      },
      update: {
        xpEarned: { increment: xpEarned },
        quizzesTaken: { increment: 1 },
      },
    });

    // Check for Quiz Master badge (5 perfect quizzes)
    if (percentage === 100) {
      const perfectQuizCount = await db.quizAttempt.count({
        where: {
          userId,
          percentage: 100,
        },
      });

      if (perfectQuizCount >= 5) {
        const quizMasterBadge = await db.badge.findFirst({
          where: { name: 'Quiz Master' },
        });

        if (quizMasterBadge) {
          const existingBadge = await db.userBadge.findUnique({
            where: {
              userId_badgeId: {
                userId,
                badgeId: quizMasterBadge.id,
              },
            },
          });

          if (!existingBadge) {
            await db.userBadge.create({
              data: { userId, badgeId: quizMasterBadge.id },
            });

            await db.user.update({
              where: { id: userId },
              data: {
                xp: { increment: quizMasterBadge.xpReward },
                shijlCoins: { increment: quizMasterBadge.coinReward },
              },
            });
          }
        }
      }
    }

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        score: totalScore,
        maxScore,
        percentage: Math.round(percentage * 10) / 10,
        passed,
        xpEarned,
      },
      gradedAnswers,
    });
  } catch (error) {
    console.error('Error submitting quiz attempt:', error);
    return NextResponse.json(
      { error: 'Failed to submit quiz attempt' },
      { status: 500 }
    );
  }
}
