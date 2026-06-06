import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

async function resolveUserId(rawUserId: string): Promise<string> {
  if (!rawUserId) throw new Error('User ID is required');
  const userExists = await db.user.findUnique({ where: { id: rawUserId } });
  if (!userExists) throw new Error('User not found');
  return rawUserId;
}

// GET /api/student/assignments - Get assignments for a student's enrolled courses
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawUserId = searchParams.get('userId');
    const status = searchParams.get('status');

    if (!rawUserId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const userId = await resolveUserId(rawUserId);

    // Get student's enrolled course IDs
    const enrollments = await db.enrollment.findMany({
      where: { userId },
      select: { courseId: true },
    });
    const courseIds = enrollments.map((e) => e.courseId);

    if (courseIds.length === 0) {
      return NextResponse.json({
        assignments: [],
        summary: { pending: 0, submitted: 0, graded: 0, total: 0 },
      });
    }

    // Get course info
    const courses = await db.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, title: true, instructorId: true },
    });
    const courseMap = new Map(courses.map((c) => [c.id, c]));

    // Get instructor names
    const instructorIds = [...new Set(courses.map((c) => c.instructorId))];
    const instructors = await db.user.findMany({
      where: { id: { in: instructorIds } },
      select: { id: true, name: true },
    });
    const instructorMap = new Map(instructors.map((i) => [i.id, i.name]));

    // Get all assignments for enrolled courses
    const assignments = await db.assignment.findMany({
      where: { courseId: { in: courseIds }, isPublished: true },
      orderBy: { dueDate: 'asc' },
    });

    // Get submissions
    const assignmentIds = assignments.map((a) => a.id);
    const submissions = await db.submission.findMany({
      where: { studentId: userId, assignmentId: { in: assignmentIds } },
      orderBy: { submittedAt: 'desc' },
    });

    const submissionMap = new Map<string, (typeof submissions)[0]>();
    for (const sub of submissions) {
      if (!submissionMap.has(sub.assignmentId)) {
        submissionMap.set(sub.assignmentId, sub);
      }
    }

    // Format
    const formattedAssignments = assignments.map((assignment) => {
      const submission = submissionMap.get(assignment.id);
      const course = courseMap.get(assignment.courseId);
      const instructorName = course ? instructorMap.get(course.instructorId) || 'Instructor' : 'Instructor';

      let rubricData: { criteria?: string; criterion?: string; description?: string; maxPoints: number }[] = [];
      try { rubricData = assignment.rubric ? JSON.parse(assignment.rubric) : []; } catch { /* skip */ }

      let resourcesData: { title: string; url: string; type: string }[] = [];
      try { resourcesData = assignment.resources ? JSON.parse(assignment.resources) : []; } catch { /* skip */ }

      let rubricScores: Record<string, number> = {};
      try { rubricScores = submission?.rubricScores ? JSON.parse(submission.rubricScores) : {}; } catch { /* skip */ }

      let fileUrls: { name: string; url: string; type: string; size: number }[] = [];
      try { fileUrls = submission?.fileUrls ? JSON.parse(submission.fileUrls) : []; } catch { /* skip */ }

      let assignmentStatus: 'pending' | 'submitted' | 'graded';
      if (submission && (submission.status === 'graded' || submission.status === 'returned')) {
        assignmentStatus = 'graded';
      } else if (submission) {
        assignmentStatus = 'submitted';
      } else {
        assignmentStatus = 'pending';
      }

      const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
      const now = new Date();
      const isOverdue = dueDate ? now > dueDate && assignmentStatus === 'pending' : false;
      const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

      const rubric = rubricData.map((r, i) => ({
        criterion: r.criteria || r.criterion || `Criterion ${i + 1}`,
        description: r.description || '',
        maxPoints: r.maxPoints || 0,
        score: rubricScores[r.criteria || r.criterion || `criterion_${i}`] ?? rubricScores[i] ?? null,
      }));

      const scorePercentage = submission?.score != null && assignment.maxScore > 0
        ? (submission.score / assignment.maxScore) * 100 : null;

      const getLetterGrade = (pct: number): string => {
        if (pct >= 90) return 'A';
        if (pct >= 80) return 'B';
        if (pct >= 70) return 'C';
        if (pct >= 60) return 'D';
        return 'F';
      };

      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        instructions: assignment.instructions,
        type: assignment.type,
        submissionType: assignment.submissionType,
        courseId: assignment.courseId,
        courseName: course?.title || 'Unknown Course',
        instructorName,
        maxScore: assignment.maxScore,
        dueDate: assignment.dueDate?.toISOString() || null,
        isOverdue,
        daysLeft,
        rubric,
        resources: resourcesData,
        wordLimit: assignment.wordLimit,
        order: assignment.order,
        submissionId: submission?.id || null,
        status: assignmentStatus,
        submittedAt: submission?.submittedAt?.toISOString() || null,
        score: submission?.score ?? null,
        scorePercentage,
        letterGrade: scorePercentage != null ? getLetterGrade(scorePercentage) : null,
        feedback: submission?.feedback || null,
        gradedAt: submission?.gradedAt?.toISOString() || null,
        gradedBy: submission?.gradedBy || null,
        fileUrls,
        content: submission?.content || null,
        attempt: submission?.attempt || 0,
      };
    });

    const pendingCount = formattedAssignments.filter((a) => a.status === 'pending').length;
    const submittedCount = formattedAssignments.filter((a) => a.status === 'submitted').length;
    const gradedCount = formattedAssignments.filter((a) => a.status === 'graded').length;

    let filtered = formattedAssignments;
    if (status && status !== 'all') {
      filtered = formattedAssignments.filter((a) => a.status === status);
    }

    return NextResponse.json({
      assignments: filtered,
      summary: { pending: pendingCount, submitted: submittedCount, graded: gradedCount, total: formattedAssignments.length },
    });
  } catch (error) {
    console.error('Error fetching student assignments:', error);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

// POST /api/student/assignments - Submit an assignment
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId: rawUserId, assignmentId, content, fileUrls } = body as {
      userId: string;
      assignmentId: string;
      content?: string;
      fileUrls?: { name: string; url: string; type: string; size: number }[];
    };

    if (!rawUserId || !assignmentId) {
      return NextResponse.json({ error: 'userId and assignmentId are required' }, { status: 400 });
    }

    const userId = await resolveUserId(rawUserId);

    const assignment = await db.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const enrollment = await db.enrollment.findFirst({
      where: { userId, courseId: assignment.courseId },
    });
    if (!enrollment) {
      return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
    }

    const existing = await db.submission.findFirst({
      where: { studentId: userId, assignmentId },
      orderBy: { attempt: 'desc' },
    });

    const attempt = (existing?.attempt || 0) + 1;

    const submission = await db.submission.create({
      data: {
        assignmentId,
        studentId: userId,
        content: content || '',
        fileUrls: fileUrls ? JSON.stringify(fileUrls) : null,
        status: 'submitted',
        attempt,
      },
    });

    await db.user.update({
      where: { id: userId },
      data: { xp: { increment: 10 }, lastActiveAt: new Date() },
    });

    return NextResponse.json({
      submission: {
        id: submission.id,
        status: submission.status,
        attempt: submission.attempt,
        submittedAt: submission.submittedAt.toISOString(),
      },
      xpEarned: 10,
      message: 'Assignment submitted successfully!',
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    return NextResponse.json({ error: 'Failed to submit assignment' }, { status: 500 });
  }
}
